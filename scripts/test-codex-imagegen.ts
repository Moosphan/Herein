import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { runAgent, WorkflowRuntimeManager } from '../src/main/services/video-workflow/cli'

test('Codex image tasks enable the native tool and write only the requested image output', async () => {
  const root = mkdtempSync(join(tmpdir(), 'codex-imagegen-contract-'))
  const executable = join(root, 'codex-fixture.mjs')
  const target = join(root, 'generated.png')
  const reference = join(root, 'reference.png')
  writeFileSync(reference, 'reference image fixture')
  writeFileSync(
    executable,
    `#!/usr/bin/env node
import {writeFileSync} from 'node:fs';
const args=process.argv.slice(2);
if(args[0]==='mcp'){console.log('[]');process.exit(0)}
let prompt='';for await(const chunk of process.stdin) prompt+=chunk;
if(args[args.indexOf('--sandbox')+1]==='read-only'&&!args.includes('image_generation')){
 writeFileSync(args[args.indexOf('--output-last-message')+1],JSON.stringify({mode:'content'}));process.exit(0)
}
if(args[args.indexOf('--sandbox')+1]!=='workspace-write'||!args.includes('image_generation')){
 console.error('native image generation was not enabled');process.exit(1)
}
if(args[args.indexOf('--image')+1]!==${JSON.stringify(reference)}){console.error('missing reference');process.exit(1)}
if(!prompt.includes('image_generation')||!prompt.includes(${JSON.stringify(target)})){console.error('missing image task contract');process.exit(1)}
writeFileSync(${JSON.stringify(target)},'native image fixture');
writeFileSync(args[args.indexOf('--output-last-message')+1],JSON.stringify({imagePath:${JSON.stringify(target)}}));
`,
    { mode: 0o755 },
  )
  try {
    const runtime = { ...new WorkflowRuntimeManager(root).get(), codexPath: executable }
    const result = await runAgent(
      'codex',
      runtime,
      root,
      '生成一张 4:3 KSP 技术封面。',
      new AbortController().signal,
      {
        imageGeneration: {
          referencePath: reference,
          outputPath: target,
          width: 1600,
          height: 1200,
        },
      },
    )
    assert.deepEqual(result, { imagePath: target })
    assert.equal(readFileSync(target, 'utf8'), 'native image fixture')
    assert.deepEqual(
      await runAgent('codex', runtime, root, '返回内容 JSON。', new AbortController().signal),
      { mode: 'content' },
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
