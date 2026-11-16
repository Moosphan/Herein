import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { validateMotionPlan, validatePayload } from '../src/shared/video-workflow'

const require = createRequire(import.meta.url)
const native = () => require('../src/main/services/video-workflow/remotion-native')

const sources = {
  summary: '原生 SVG 镜头与非线性运动',
  files: [
    {
      name: 'visuals.tsx',
      content:
        "import React from 'react'; import Scene from './scene-0'; export default function Visuals(props) { return <Scene {...props}/> }",
    },
    {
      name: 'scene-0.tsx',
      content:
        "import React from 'react'; import {useCurrentFrame} from 'remotion'; export default function Scene() { const frame = useCurrentFrame(); return <svg><path d={`M 0 0 Q ${frame * frame} 80 400 300`} /></svg> }",
    },
  ],
}

test('storyboard retains cinematic direction independently of its static keyframe and preview effects', () => {
  const result = validatePayload('storyboard', {
    mode: 'agent',
    template: 'technical',
    scenes: [
      {
        id: 'one',
        title: '队列',
        body: '任务等待执行',
        layout: 'title',
        html: '<h1>队列</h1>',
        visualDirection: '跟随任务穿过队列，镜内切换俯视与近景，保持空间连续',
      },
    ],
  })
  assert.equal(
    result.scenes[0].visualDirection,
    '跟随任务穿过队列，镜内切换俯视与近景，保持空间连续',
  )
})

test('native single-scene plan explicitly requires one target entry and complete plan JSON', () => {
  const project = {
    stages: {
      storyboard: {
        payload: {
          scenes: [
            { id: 'one', title: '第一镜' },
            { id: 'two', title: '第二镜' },
          ],
        },
      },
      audio: {
        payload: {
          duration: 4,
          tracks: [
            { sceneId: 'one', text: '第一镜', duration: 2 },
            { sceneId: 'two', text: '第二镜', duration: 2 },
          ],
        },
      },
    },
  }
  const prompt = native().nativeRevisionPrompt(project, '拉近主体', 1, 'one')
  assert.match(prompt, /scenes 必须且只能有 1 项/)
  assert.match(prompt, /sceneId 必须是 "one"/)
  assert.match(prompt, /不得返回源码/)
})

test('native source preserves arbitrary frame logic instead of mapping it to WAAPI effects', () => {
  const result = native().validateNativeSources(sources, ['one'], {
    react: '18.3.1',
    remotion: '4.0.541',
  })
  assert.deepEqual(result, sources)
  assert.throws(
    () =>
      native().validateNativeSources(
        { ...sources, files: [...sources.files, { name: '../escape.tsx', content: '' }] },
        ['one'],
        {},
      ),
    /文件/,
  )
  assert.throws(
    () =>
      native().validateNativeSources(
        { ...sources, files: [...sources.files, { name: 'remotion.tsx', content: '' }] },
        ['one'],
        {},
      ),
    /文件/,
  )
})

test('native source rejects missing modules, unavailable dependencies and Node imports before bundling', () => {
  const replace = (content: string) => ({
    ...sources,
    files: [{ ...sources.files[0], content }, sources.files[1]],
  })
  assert.throws(
    () =>
      native().validateNativeSources(
        replace("import fs from 'node:fs'; export default () => null"),
        ['one'],
        {},
      ),
    /依赖|导入/,
  )
  assert.throws(
    () =>
      native().validateNativeSources(
        replace("import Missing from './missing'; export default Missing"),
        ['one'],
        {},
      ),
    /模块/,
  )
  assert.throws(
    () =>
      native().validateNativeSources(
        replace("import Three from 'three'; export default () => null"),
        ['one'],
        {},
      ),
    /依赖/,
  )
  assert.throws(
    () =>
      native().validateNativeSources(
        replace("const loader = require; export default () => loader('fs')"),
        ['one'],
        {},
      ),
    /require/,
  )
  assert.throws(
    () =>
      native().validateNativeSources(
        replace("export default () => import('node:fs')"),
        ['one'],
        {},
      ),
    /动态导入/,
  )
  assert.throws(
    () => native().validateNativeSources(replace('export default function Broken( {'), ['one'], {}),
    /语法/,
  )
})

test('native authoring detects installed creative dependencies with private package manifests', () => {
  const directory = mkdtempSync(join(tmpdir(), 'native-dependencies-'))
  try {
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify({ name: 'video-runtime', dependencies: { 'custom-visual': '1.2.3' } }),
    )
    for (const name of ['react', 'react-dom', 'remotion', 'custom-visual']) {
      const target = join(directory, 'node_modules', name)
      mkdirSync(target, { recursive: true })
      writeFileSync(
        join(target, 'package.json'),
        JSON.stringify({
          name,
          version: name === 'custom-visual' ? '1.2.3' : '1.0.0',
          exports: { '.': './index.js' },
        }),
      )
      writeFileSync(join(target, 'index.js'), 'module.exports = {}')
    }
    const executable = join(directory, 'cli.js')
    writeFileSync(executable, '')
    assert.equal(
      native().nativeDependencies({ remotionPath: executable })['custom-visual'],
      '1.2.3',
    )
    const nested = join(directory, 'runtime')
    mkdirSync(nested)
    writeFileSync(join(nested, 'package.json'), JSON.stringify({ dependencies: {} }))
    writeFileSync(join(nested, 'cli.js'), '')
    assert.equal(
      native().nativeDependencies({ remotionPath: join(nested, 'cli.js') })['custom-visual'],
      undefined,
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('single scene revision preserves every other source module', () => {
  const previous = {
    ...sources,
    files: [...sources.files, { name: 'scene-1.tsx', content: 'export default () => null' }],
  }
  const changed = {
    ...previous,
    files: previous.files.map((file) =>
      file.name === 'scene-0.tsx' ? { ...file, content: file.content + '\n' } : file,
    ),
  }
  native().assertNativeRevisionScope(previous, changed, ['one', 'two'], 'one')
  assert.throws(
    () =>
      native().assertNativeRevisionScope(
        previous,
        {
          ...changed,
          files: changed.files.map((file) => ({ ...file, content: file.content + '\n' })),
        },
        ['one', 'two'],
        'one',
      ),
    /当前分镜/,
  )
})

test('native modification plans accept creative instructions without synthesizing selector effects', () => {
  const plan = validateMotionPlan(
    {
      summary: '改为跟随镜头',
      feedback: '跟随队列任务',
      at: 0.4,
      scenes: [{ sceneId: 'one', effects: [] }],
      native: { instructions: '主体穿越空间，SVG 路径持续变化，按语义切换景别' },
    },
    [{ id: 'one', duration: 2 }],
  )
  assert.equal(plan.native?.instructions, '主体穿越空间，SVG 路径持续变化，按语义切换景别')
  assert.equal(plan.scenes[0].effects.length, 0)
  assert.throws(
    () =>
      validateMotionPlan({ ...plan, native: { instructions: '' } }, [{ id: 'one', duration: 2 }]),
    /原生/,
  )
})

test('native project uses React visuals directly and keeps narration and captions in the frozen host', () => {
  const directory = mkdtempSync(join(tmpdir(), 'native-remotion-unit-'))
  try {
    native().writeNativeComposition(
      directory,
      sources,
      { duration: 2, width: 1920, height: 1080, fps: 30, scenes: [], captions: [], assets: [] },
      { react: '18.3.1', remotion: '4.0.541' },
    )
    const entry = readFileSync(join(directory, 'remotion.tsx'), 'utf8')
    assert.doesNotMatch(entry, /iframe|index\.html|getAnimations/)
    assert.match(entry, /Visuals/)
    assert.match(entry, /narration\.wav/)
    assert.equal(readFileSync(join(directory, 'scene-0.tsx'), 'utf8'), sources.files[1].content)
    const settings = JSON.parse(readFileSync(join(directory, 'composition.json'), 'utf8'))
    assert.equal(settings.native, true)
    assert.deepEqual(
      settings.sourceFiles,
      sources.files.map((file) => file.name),
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('a single-scene edit can configure and measure host captions through the frozen host API', () => {
  const revised = {
    ...sources,
    files: [
      sources.files[0],
      {
        name: 'scene-0.tsx',
        content: `import React from 'react';
import {useHostCaption} from './host-captions';
export default function Scene() {
  const {bounds} = useHostCaption('one', {containerStyle: {paddingBottom: 20}});
  return <div style={{height: bounds?.top ?? 1600}}>Generated files</div>;
}`,
      },
    ],
  }
  native().assertNativeRevisionScope(sources, revised, ['one'], 'one')
  assert.deepEqual(
    native().validateNativeSources(revised, ['one'], { react: '18.3.1', remotion: '4.0.541' }),
    revised,
  )
  const directory = mkdtempSync(join(tmpdir(), 'native-host-caption-'))
  try {
    native().writeNativeComposition(
      directory,
      revised,
      {
        duration: 2,
        width: 1080,
        height: 1920,
        fps: 30,
        scenes: [
          {
            id: 'one',
            title: '第一镜',
            text: '字幕',
            start: 0,
            duration: 2,
            from: 0,
            durationInFrames: 60,
            module: 'scene-0.tsx',
            motionEnabled: true,
          },
        ],
        captions: [{ start: 0, duration: 2, text: '完整字幕。' }],
        assets: [],
      },
      { react: '18.3.1', remotion: '4.0.541' },
    )
    assert.match(readFileSync(join(directory, 'host-captions.tsx'), 'utf8'), /useHostCaption/)
    assert.match(readFileSync(join(directory, 'remotion.tsx'), 'utf8'), /HostCaptionProvider/)
    assert.equal(readFileSync(join(directory, 'visuals.tsx'), 'utf8'), sources.files[0].content)
    assert.match(
      native().nativeCreationPrompt(
        { stages: { storyboard: { payload: { scenes: [{ id: 'one' }] } }, brief: {}, copy: {} } },
        { scenes: [], assets: [], captions: [], width: 1080, height: 1920, duration: 2, fps: 30 },
        {},
        sources,
        '字幕下边缘固定在1900',
        'one',
      ),
      /useHostCaption[\s\S]*bounds/,
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('frozen caption API tampering stops rendering before launching external tools', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'native-caption-integrity-'))
  try {
    native().writeNativeComposition(
      directory,
      sources,
      {
        duration: 2,
        width: 1080,
        height: 1920,
        fps: 30,
        scenes: [],
        captions: [],
        assets: [],
      },
      { react: '18.3.1', remotion: '4.0.541' },
    )
    writeFileSync(join(directory, 'host-captions.tsx'), 'export const modified = true;')
    const { renderRemotion } = require('../src/main/services/video-workflow/remotion')
    await assert.rejects(
      renderRemotion({}, directory, new AbortController().signal, true, () => {}),
      /字幕接口.*可信模板/,
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
