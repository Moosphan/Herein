import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import { validatePayload, validatePublicationCover } from '../src/shared/video-workflow'

const file = {
  id: randomUUID(),
  path: 'media/video-workflow/project/frame.png',
  sha256: 'a'.repeat(64),
  size: 100,
  mime: 'image/png',
}
const provenance = { videoSha256: 'b'.repeat(64), time: 1.5, frame: 45, fps: 30 }
const frameCover = {
  file,
  feedFile: file,
  sourceRenderId: 'render',
  method: 'frame',
  platform: 'douyin',
  frameSource: provenance,
  width: 1080,
  height: 1920,
  feedWidth: 1080,
  feedHeight: 1920,
  createdAt: new Date().toISOString(),
  feedback: '',
}

test('frame covers preserve real provenance and original Douyin dimensions', () => {
  const cover = validatePublicationCover(frameCover)
  assert.equal(cover.method, 'frame')
  assert.deepEqual(cover.frameSource, provenance)
  assert.equal(cover.height, 1920)
  assert.equal(cover.platform, 'douyin')
})

test('frame covers enforce source coordinates and platform-specific dimensions', () => {
  const bilibili = {
    ...frameCover,
    platform: 'bilibili',
    width: 1600,
    height: 900,
    feedWidth: 1600,
    feedHeight: 1200,
  }
  assert.equal(validatePublicationCover(bilibili).width, 1600)
  for (const change of [
    { frameSource: undefined },
    { frameSource: { ...provenance, time: -1 } },
    { frameSource: { ...provenance, frame: 99 } },
    { frameSource: { ...provenance, fps: NaN } },
    { frameSource: { ...provenance, videoSha256: 'bad' } },
    { width: 0 },
    { platform: 'unknown' },
  ])
    assert.throws(() => validatePublicationCover({ ...frameCover, ...change }), /封面/)
  assert.throws(() => validatePublicationCover({ ...bilibili, height: 1920 }), /封面/)
  const platforms = {
    bilibili: { title: '标题', description: '', tags: [], cover: frameCover },
    douyin: { title: '标题', description: '', tags: [] },
  }
  assert.throws(() => validatePayload('publish', { platforms }), /平台/)
})

test('publication cover preserves an optional portrait image with independent file validation', () => {
  const bilibili = {
    ...frameCover,
    platform: 'bilibili',
    width: 1600,
    height: 900,
    feedWidth: 1600,
    feedHeight: 1200,
    portraitFile: { ...file, id: randomUUID(), path: 'media/video-workflow/project/portrait.png' },
  }
  assert.deepEqual(validatePublicationCover(bilibili).portraitFile, bilibili.portraitFile)
  for (const invalid of [
    { ...file, mime: 'text/html' },
    { ...file, size: 4 * 1024 * 1024 + 1 },
  ])
    assert.throws(() => validatePublicationCover({ ...bilibili, portraitFile: invalid }), /封面/)
})

test('Douyin AI covers use the fixed portrait size and retain platform ownership', () => {
  const cover = { ...frameCover, method: 'code', frameSource: undefined, portraitFile: file }
  assert.equal(validatePublicationCover(cover).height, 1920)
  for (const changes of [{ width: 720 }, { height: 1080 }, { feedHeight: 900 }])
    assert.throws(() => validatePublicationCover({ ...cover, ...changes }), /封面/)
})

test('legacy Douyin AI dual-ratio records remain readable', () => {
  const legacy = {
    ...frameCover,
    method: 'image2',
    frameSource: undefined,
    width: 1600,
    height: 900,
    feedWidth: 1600,
    feedHeight: 1200,
  }
  assert.equal(validatePublicationCover(legacy).height, 900)
  assert.equal(validatePublicationCover(legacy).portraitFile, undefined)
})
