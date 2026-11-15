import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destination = join(root, 'resources/visuals/traditional-culture')
const collections = [
  {
    directory: 'colored-studies',
    identity: 'colored-collection',
    title: '随物赋彩 · 彩墨四景',
    description: '秋山、宫门、瓷器与商旅，按材质与场景分别设色。',
  },
  {
    directory: 'figure-studies-v3',
    identity: 'figure-collection',
    title: '衣冠与风骨 · 写意第三稿',
    description: '代码重绘：凝视静势、青年锐气、腾空奔马。前两稿保留对照；原创意象，非考据复原。',
  },
]
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  )

export function syncInkCollections() {
  const available = collections.flatMap((collection) => {
    const filename = join(destination, collection.directory, 'ink-wash/catalog.json')
    if (!existsSync(filename)) return []
    const catalog = JSON.parse(readFileSync(filename, 'utf8'))
    return [{ ...collection, assets: catalog.assets }]
  })
  const galleryPath = join(destination, 'demo/ink-study.html')
  if (existsSync(galleryPath)) {
    let source = readFileSync(galleryPath, 'utf8')
    for (const collection of collections) {
      source = source.replace(
        new RegExp(`<section id="${collection.identity}">[\\s\\S]*?<\\/section>`),
        '',
      )
    }
    const supplemental = available
      .map(
        (collection) =>
          `<section id="${collection.identity}"><div class="intro"><h2 style="font-size:30px;font-weight:500;letter-spacing:.08em;margin:0">${escape(collection.title)}</h2><p>${escape(collection.description)}<br><a href="../${collection.directory}/index.html">查看本辑大图与下载 ↗</a></p></div><div class="grid">${collection.assets
            .map((asset) => {
              const prefix = `../${collection.directory}/ink-wash/`
              const hasPng = existsSync(
                join(destination, collection.directory, 'ink-wash', asset.png),
              )
              return `<article><div class="small-art"><a href="${prefix}${escape(asset.svg)}" target="_blank" aria-label="查看${escape(asset.name)}原图"><img src="${prefix}${escape(hasPng ? asset.png : asset.svg)}" alt="${escape(asset.name)}，${escape(asset.note)}" loading="lazy" width="1600" height="1000"></a></div><div class="caption"><h3>${escape(asset.name)}</h3><p>${escape(asset.note)}</p><div class="downloads"><a href="${prefix}${escape(asset.svg)}" target="_blank">查看 SVG ↗</a>${hasPng ? `<a href="${prefix}${escape(asset.png)}" download>透明 PNG ↓</a>` : ''}</div></div></article>`
            })
            .join('')}</div></section>`,
      )
      .join('')
    source = source.replace('<footer>', supplemental + '<footer>')
    source = source.replace(
      '<a class="back" href="index.html#elements">查看上一版线描 ↗</a>',
      '<a class="back" href="../gallery/index.html">打开分类画册 ↗</a>',
    )
    source = source.replace(
      '<title>墨入山河 · 九景水墨小集</title>',
      '<title>纸上山河 · 水墨与彩墨素材</title>',
    )
    source = source.replace('纸上山河 · 水墨小集', '纸上山河 · 水墨与彩墨素材')
    source = source.replace('第四辑 / 青灰 · 淡赭 · 皴染 / 九景', '山水 · 古建 · 器物 · 人物')
    source = source.replace('第四辑 / 九景 / 2026', '水墨与彩墨 / 独立作品 / 2026')
    source = source.replace(
      '纸纹与题字仅用于展示，未烘焙进素材。九景可独立下载、缩放与组合。',
      '纸纹与题字仅用于展示，未烘焙进素材。各辑可独立下载、缩放与组合。',
    )
    writeFileSync(galleryPath, source)
  }
  const indexPath = join(destination, 'demo/index.html')
  if (existsSync(indexPath)) {
    let source = readFileSync(indexPath, 'utf8')
    const navigation = `<nav aria-label="绘画风格" style="padding-top:22px;font-size:14px;display:flex;gap:24px;flex-wrap:wrap"><a href="../gallery/index.html">分类画册 ↗</a><a href="ink-study.html">水墨九景 ↗</a>${available.map((collection) => `<a href="ink-study.html#${collection.identity}">${escape(collection.title)} ↗</a>`).join('')}</nav>`
    source = source.replace(/<nav aria-label="绘画风格"[^>]*>[\s\S]*?<\/nav>/, navigation)
    writeFileSync(indexPath, source)
  }
  for (const collection of available) {
    const filename = join(destination, collection.directory, 'index.html')
    if (!existsSync(filename)) continue
    let source = readFileSync(filename, 'utf8')
    if (!source.includes('data-unified-gallery')) {
      source = source.replace(
        '<nav>',
        '<nav><a data-unified-gallery href="../gallery/index.html">分类画册 ↗</a>',
      )
      writeFileSync(filename, source)
    }
  }
  console.log(`Synced ${available.length} supplementary ink collections into the material gallery`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  syncInkCollections()
