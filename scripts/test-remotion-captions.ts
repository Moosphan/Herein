import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import {
  writeNativeComposition,
  nativeDependencies,
  validateNativeSources,
} from '../src/main/services/video-workflow/remotion-native'
import { WorkflowRuntimeManager } from '../src/main/services/video-workflow/cli'

async function main() {
  assert.ok(process.env.WORKFLOW_REMOTION_PATH, 'WORKFLOW_REMOTION_PATH is required')
  const executable = resolve(process.env.WORKFLOW_REMOTION_PATH)
  const requireRuntime = createRequire(executable)
  const { bundle } = requireRuntime('@remotion/bundler')
  const { openBrowser, getCompositions, renderStill } = requireRuntime('@remotion/renderer')
  const directory = mkdtempSync(join(tmpdir(), 'native-caption-layout-'))
  const runtime = { ...new WorkflowRuntimeManager(directory).get(), remotionPath: executable }
  const dependencies = nativeDependencies(runtime)
  const source = (
    id: string,
    layout: string,
  ) => `import React, {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {useHostCaption} from './host-captions';
export default function Scene() {
  const frame = useCurrentFrame();
  const {active, caption, bounds} = useHostCaption('${id}', ${layout});
  const content = useRef(null);
  useLayoutEffect(() => {
    if (active && bounds) console.log('CAPTION_GEOMETRY ' + JSON.stringify({sceneId:'${id}', text:caption.text, bounds, contentBottom:content.current?.getBoundingClientRect().bottom}));
  }, [active, caption, bounds]);
  return active && bounds ? <div ref={content} style={{position:'absolute',left:54,top:200,width:800,height:bounds.top - 28 - 200,background:'#8b3eb1'}}/> : null;
}`
  const sources = validateNativeSources(
    {
      summary: 'Scene-local caption styling and measured content boundary',
      files: [
        {
          name: 'visuals.tsx',
          content:
            "import React from 'react'; import First from './scene-0'; import Second from './scene-1'; export default function Visuals(){return <><First/><Second/></>;}",
        },
        {
          name: 'scene-0.tsx',
          content: source(
            'one',
            "{containerStyle:{padding:frame >= 45 ? '0 54px 10px' : '0 54px 20px',transform:frame >= 45 ? 'translateY(-10px)' : undefined},captionStyle:{fontSize:54,lineHeight:1.25,maxWidth:440,margin:0,border:'2px solid #f5bf2f',boxSizing:'border-box'}}",
          ),
        },
        { name: 'scene-1.tsx', content: source('two', '{}') },
      ],
    },
    ['one', 'two'],
    dependencies,
  )
  writeNativeComposition(
    directory,
    sources,
    {
      duration: 3,
      width: 1080,
      height: 1920,
      fps: 30,
      scenes: [
        {
          id: 'one',
          title: 'First',
          text: '字幕',
          start: 0,
          duration: 2,
          from: 0,
          durationInFrames: 60,
          module: 'scene-0.tsx',
          motionEnabled: true,
        },
        {
          id: 'two',
          title: 'Second',
          text: '默认字幕',
          start: 2,
          duration: 1,
          from: 60,
          durationInFrames: 30,
          module: 'scene-1.tsx',
          motionEnabled: true,
        },
      ],
      captions: [
        { start: 0, duration: 0.8, text: '短字幕' },
        {
          start: 0.8,
          duration: 1.2,
          text: '这是一段需要真实换行和测量高度的字幕，保留文字内容与原始时间。',
        },
        { start: 2, duration: 1, text: 'Second scene keeps its default caption layout.' },
      ],
      assets: [],
    },
    dependencies,
  )
  const publicDirectory = join(directory, 'public')
  mkdirSync(publicDirectory)
  execFileSync(runtime.ffmpegPath, [
    '-nostdin',
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'anullsrc=r=48000:cl=mono',
    '-t',
    '3',
    join(publicDirectory, 'narration.wav'),
  ])
  symlinkSync(
    dirname(dirname(requireRuntime.resolve('react/package.json'))),
    join(directory, 'node_modules'),
    'dir',
  )
  // Resolve through the runtime's package tree, matching the production CLI.
  const serveUrl = await bundle({
    entryPoint: join(directory, 'remotion.tsx'),
    publicDir: publicDirectory,
    onProgress: () => {},
  })
  const browser = await openBrowser('chrome', {
    browserExecutable: runtime.remotionBrowserPath,
    logLevel: 'error',
  })
  const evidence: unknown[] = []
  try {
    const [composition] = await getCompositions(serveUrl, {
      puppeteerInstance: browser,
      logLevel: 'error',
    })
    let shortHeight = 0
    let shortTop = 0
    for (const [index, frame, scale] of [
      [0, 0, 1],
      [1, 30, 1],
      [2, 65, 1],
      [3, 0, 1],
      [4, 0, 0.5],
      [5, 50, 1],
    ]) {
      const measurements: any[] = []
      const output = join(directory, `frame-${index}.png`)
      await renderStill({
        serveUrl,
        composition,
        frame,
        scale,
        output,
        puppeteerInstance: browser,
        logLevel: 'error',
        onBrowserLog: (log: { text: string }) => {
          if (log.text.startsWith('CAPTION_GEOMETRY '))
            measurements.push(JSON.parse(log.text.slice('CAPTION_GEOMETRY '.length)))
        },
      })
      const last = measurements.at(-1)
      assert.ok(last, `missing measured geometry at frame ${frame}`)
      assert.ok(
        Math.abs(last.bounds.bottom - (frame < 60 ? 1900 : 1720)) < 0.1,
        JSON.stringify(last),
      )
      assert.ok(last.bounds.left >= 54 && last.bounds.right <= 1026, JSON.stringify(last))
      if (scale === 1)
        assert.ok(Math.abs(last.contentBottom - (last.bounds.top - 28)) < 0.1, JSON.stringify(last))
      if (index === 0) {
        shortHeight = last.bounds.height
        shortTop = last.bounds.top
      }
      if (index === 1) {
        assert.ok(last.bounds.height > shortHeight * 2)
        assert.ok(last.bounds.top < shortTop)
      }
      if (index === 3 || index === 4) assert.ok(Math.abs(last.bounds.height - shortHeight) < 0.1)
      const pixels = JSON.parse(
        execFileSync(
          'python3',
          [
            '-c',
            "from PIL import Image;import json,sys; im=Image.open(sys.argv[1]).convert('RGB'); p=im.load(); pts=[(x,y) for y in range(im.height) for x in range(im.width) if p[x,y][0]>200 and 120<p[x,y][1]<220 and p[x,y][2]<100];print(json.dumps({'bottom':max(y for x,y in pts)+1 if pts else None}))",
            output,
          ],
          { encoding: 'utf8' },
        ),
      )
      if (frame < 60) assert.ok(Math.abs(pixels.bottom / scale - 1900) <= 2, JSON.stringify(pixels))
      evidence.push({ frame, scale, ...last, output })
    }
    writeFileSync(join(directory, 'report.json'), JSON.stringify(evidence, null, 2))
    console.log(JSON.stringify({ verified: true, directory, frames: evidence.length }))
  } finally {
    await browser.close({ silent: true })
  }
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
