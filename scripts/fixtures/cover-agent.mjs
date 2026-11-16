#!/usr/bin/env node
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(process.cwd(), '../../..')
// Runtime probes must never be treated as a generation request. An absent
// --output-last-message previously selected argv[0] (the Node executable).
if (process.argv.includes('--version')) {
  console.log('cover-agent fixture 1.0.0')
  process.exit(0)
}
if (process.argv[2] === 'mcp' && process.argv[3] === 'list') {
  console.log('[]')
  process.exit(0)
}
const outputIndex = process.argv.indexOf('--output-last-message')
if (outputIndex < 0 || !process.argv[outputIndex + 1]) {
  console.error('Fixture requires --output-last-message')
  process.exit(2)
}
const mode = existsSync(join(root, 'cover-mode')) ? readFileSync(join(root, 'cover-mode'), 'utf8') : ''
if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 30000))
if (process.argv.includes('image_generation')) {
  let prompt = ''
  for await (const chunk of process.stdin) prompt += chunk
  const line = prompt.split('\n').find(line => line.startsWith('image_generation_target='))
  const task = JSON.parse(line.slice('image_generation_target='.length))
  const portrait = task.width === 1080
  if (mode === 'portrait-slow' && portrait) await new Promise(resolve => setTimeout(resolve, 30000))
  if (mode === 'api-error') {
    console.error('HTTP 503 upstream unavailable\nAuthorization: Bearer test-private-token\nOPENAI_API_KEY=test-private-key\nsk-exampleSensitiveCredential12345')
    process.exit(1)
  }
  writeFileSync(join(root, 'cover-image-args.json'), JSON.stringify(process.argv.slice(2)))
  writeFileSync(join(root, 'cover-image-task.json'), JSON.stringify(task))
  if (mode === 'tool-unavailable') {
    writeFileSync(process.argv[outputIndex + 1], JSON.stringify({error:'image_generation tool unavailable'}))
    process.exit(0)
  }
  if (mode === 'invalid' || (mode === 'portrait-invalid' && portrait)) writeFileSync(task.outputPath, 'not an image')
  else copyFileSync(join(root, portrait ? 'cover-portrait-source.png' : mode === 'jpeg' ? 'cover-source.jpg' : 'cover-source.png'), task.outputPath)
  writeFileSync(process.argv[outputIndex + 1], JSON.stringify({imagePath:task.outputPath}))
} else {
  let prompt = ''
  for await (const chunk of process.stdin) prompt += chunk
  writeFileSync(join(root, 'cover-prompt.txt'), prompt)
  const html = height => `<style>body{background:#f8f0db;color:#392456;font-family:system-ui}main{width:1600px;height:${height}px;padding:85px;display:grid;grid-template-columns:1.2fr 1fr;gap:60px;align-items:center}h1{font-size:98px;margin:20px 0}p{font-size:36px}.card{padding:45px;background:#dfd0ee;border-radius:40px;font-size:48px;line-height:1.8}</style><main><div><p>技术创作 · 从内容到发布</p><h1>${mode === 'v2' ? '让封面更有说服力' : '一份内容，两种封面'}</h1><p>保留视频风格，让主题一眼可见</p></div><div class="card">内容依据<br>视觉层次<br>双比例适配</div></main>`
  const result = JSON.stringify(mode === 'invalid' ? { feedHtml: '' } : {
    feedHtml: html(1200), landscapeHtml: html(900),
    portraitHtml:
            '<style>body{margin:0;background:#f8f0db;color:#392456;font-family:system-ui}main{box-sizing:border-box;width:1080px;height:1920px;padding:100px;display:flex;flex-direction:column;justify-content:center;gap:70px}h1{font-size:110px}p{font-size:48px}.diagram{background:#dfd0ee;border-radius:40px;padding:70px;font-size:64px;line-height:2}</style><main><h1>把内容安放在竖屏</h1><p>独立构图，保留视觉语言</p><div class="diagram">内容依据<br>视觉层次<br>竖版适配</div></main>',
  })
  const output = process.argv[outputIndex + 1]
  writeFileSync(output, result)
}
