import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const materials = () => require('../src/shared/video-materials')
const file = {
  id: 'sample',
  path: 'media/video-workflow/project/sample.png',
  sha256: 'a'.repeat(64),
  size: 40,
  mime: 'image/png',
}
const asset = () => ({
  file,
  title: '原始资料.png',
  kind: 'image',
  role: '展示原始产品界面',
  source: 'local',
  sceneId: 'one',
})

test('native material validation preserves independent purpose, local provenance and scene scope', () => {
  const value = materials().validateNativeMaterials([asset()], ['one'])
  assert.equal(value[0].role, '展示原始产品界面')
  assert.equal(value[0].sceneId, 'one')
  assert.equal(value[0].source, 'local')
  assert.throws(
    () => materials().validateNativeMaterials([{ ...asset(), role: '' }], ['one']),
    /用途/,
  )
  assert.throws(() => materials().validateNativeMaterials([asset()], ['other']), /分镜/)
  assert.throws(() => materials().validateNativeMaterials([asset(), asset()], ['one']), /重复/)
  assert.throws(
    () => materials().validateNativeMaterials([{ ...asset(), kind: 'font' }], ['one']),
    /类型/,
  )
})

test('native material fonts have deterministic families and cannot spoof media types or paths', () => {
  const input = {
    ...asset(),
    kind: 'font',
    sceneId: undefined,
    file: { ...file, path: 'media/video-workflow/project/sample.ttf', mime: 'font/ttf' },
  }
  const validated = materials().validateNativeMaterials([input], ['one'])
  assert.match(validated[0].fontFamily, /^WorkflowFont_/)
  assert.throws(
    () =>
      materials().validateNativeMaterials(
        [{ ...input, file: { ...input.file, path: '../../bad.ttf' } }],
        ['one'],
      ),
    /文件/,
  )
  assert.throws(
    () =>
      materials().validateNativeMaterials(
        [{ ...input, file: { ...input.file, mime: 'image/png' } }],
        ['one'],
      ),
    /类型/,
  )
})

test('material size budgets accept large CJK fonts and original images but reject oversized resources', () => {
  const input = {
    ...asset(),
    kind: 'font',
    sceneId: undefined,
    file: {
      ...file,
      path: 'media/video-workflow/project/sample.ttf',
      mime: 'font/ttf',
      size: 24 * 1024 * 1024,
    },
  }
  assert.equal(materials().validateNativeMaterials([input])[0].file.size, input.file.size)
  assert.throws(
    () =>
      materials().validateNativeMaterials([
        { ...input, file: { ...input.file, size: 65 * 1024 * 1024 } },
      ]),
    /大小/,
  )
  assert.throws(
    () =>
      materials().validateNativeMaterials([
        { ...asset(), file: { ...file, size: 33 * 1024 * 1024 } },
      ]),
    /大小/,
  )
})
