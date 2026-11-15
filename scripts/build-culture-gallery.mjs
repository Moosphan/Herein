import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
for (const [command, args] of [
  ['python3', ['scripts/prepare-culture-gallery.py']],
  [
    'pnpm',
    [
      '--dir',
      'docs/design-system/v2',
      'exec',
      'vite',
      'build',
      '--config',
      'vite.culture-gallery.config.ts',
    ],
  ],
]) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
const destination = join(root, 'resources/visuals/traditional-culture/gallery')
if (!existsSync(join(destination, 'assets/gallery.css'))) throw new Error('Missing gallery CSS')
const { totals, assets } = JSON.parse(
  readFileSync(join(root, 'docs/design-system/v2/culture-gallery/catalog.json'), 'utf8'),
)
writeFileSync(
  join(destination, 'index.html'),
  `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>纸上山河 · 作品画册</title><link rel="stylesheet" href="./assets/gallery.css"><script defer src="./assets/gallery.js"></script></head><body><div id="root"></div><noscript>请启用 JavaScript 查看分类画册，或<a href="../demo/ink-study.html">打开原素材页</a>。</noscript></body></html>`,
)
console.log(
  `Built offline gallery: ${assets.length} assets; thumbnails ${((totals.thumbBytes / totals.originalBytes) * 100).toFixed(1)}% of original raster bytes`,
)
