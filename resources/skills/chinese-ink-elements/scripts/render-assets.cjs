const { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } = require('node:fs')
const { basename, join, resolve } = require('node:path')
const { tmpdir } = require('node:os')
const { parseArgs } = require('node:util')

const { app, BrowserWindow } = require('electron')

function run() {
  const { values: options } = parseArgs({
    options: {
      input: { type: 'string' },
      overwrite: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })

  if (options.help) {
    console.log('Usage: electron render-assets.cjs --input DIRECTORY [--overwrite]')
    process.exit(0)
  }
  if (!options.input) throw new Error('--input is required')
  if (!app) throw new Error('Run this script with an existing Electron executable')

  const directory = resolve(options.input)
  const inkDirectory = join(directory, 'ink-wash')
  const catalog = JSON.parse(readFileSync(join(inkDirectory, 'catalog.json'), 'utf8'))
  const { width, height, assets } = catalog
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width * height > 32000000
  )
    throw new Error(
      'Catalog requires positive integer dimensions totaling at most 32 million pixels',
    )
  if (!Array.isArray(assets) || !assets.length) throw new Error('Catalog has no assets')
  const identities = new Set()
  const destinations = new Set()
  const pending = assets.map((asset) => {
    if (!/^[a-z][a-z0-9-]*$/.test(asset.id) || identities.has(asset.id))
      throw new Error('Invalid or duplicate asset ID')
    identities.add(asset.id)
    for (const extension of ['svg', 'png']) {
      const filename = asset[extension]
      if (
        typeof filename !== 'string' ||
        filename !== basename(filename) ||
        !filename.endsWith('.' + extension) ||
        /[\\/]/.test(filename)
      )
        throw new Error(asset.id + ': invalid ' + extension + ' filename')
      if (destinations.has(filename)) throw new Error(asset.id + ': duplicate filename')
      destinations.add(filename)
    }
    return { ...asset, source: readFileSync(join(inkDirectory, asset.svg), 'utf8') }
  })
  const reportPath = join(directory, 'verification.json')
  const sheetPath = join(directory, 'contact-sheet.png')
  const conflicts = [
    ...assets.map((asset) => join(inkDirectory, asset.png)),
    reportPath,
    sheetPath,
  ].filter(existsSync)
  if (conflicts.length && !options.overwrite)
    throw new Error(
      'Exports already exist; choose another directory or pass --overwrite:\n' +
        conflicts.join('\n'),
    )

  app.setPath('userData', mkdtempSync(join(tmpdir(), 'chinese-ink-elements-')))
  const timeout = setTimeout(() => {
    console.error('Rendering exceeded 120 seconds')
    app.exit(1)
  }, 120000)

  app
    .whenReady()
    .then(async () => {
      const window = new BrowserWindow({
        show: false,
        backgroundColor: '#00000000',
        webPreferences: {
          offscreen: true,
          backgroundThrottling: false,
          sandbox: true,
          nodeIntegration: false,
          contextIsolation: true,
        },
      })
      try {
        await window.loadURL(
          'data:text/html;charset=utf-8,<html lang="zh-CN"><title>Ink export</title></html>',
        )
        const result = await window.webContents.executeJavaScript(`(async()=>{
        const pending=${JSON.stringify(pending)};
        const width=${width};const height=${height};
        for(const asset of pending){
          const document=new DOMParser().parseFromString(asset.source,'image/svg+xml');
          const root=document.documentElement;
          if(document.querySelector('parsererror')||root.localName!=='svg'||root.namespaceURI!=='http://www.w3.org/2000/svg')throw new Error(asset.id+': invalid SVG XML');
          if(/\\b(?:NaN|[+-]?Infinity)\\b/.test(asset.source))throw new Error(asset.id+': non-finite coordinate');
          const viewBox=root.getAttribute('viewBox')?.trim().split(/[\\s,]+/).map(Number);
          if(!viewBox||viewBox.length!==4||!viewBox.every(Number.isFinite)||viewBox[2]<=0||viewBox[3]<=0)throw new Error(asset.id+': invalid viewBox');
          if(Number(root.getAttribute('width'))!==width||Number(root.getAttribute('height'))!==height)throw new Error(asset.id+': SVG and catalog dimensions disagree');
          const elements=[root,...root.querySelectorAll('*')];const ids=new Set();
          for(const element of elements){
            const identity=element.getAttribute('id');
            if(identity){if(ids.has(identity))throw new Error(asset.id+': duplicate SVG ID '+identity);ids.add(identity)}
            if(['script','foreignObject','image','feImage','iframe','style','animate','animateTransform','animateMotion','set','use'].includes(element.localName))throw new Error(asset.id+': unsupported active or embedded content');
          }
          for(const element of elements)for(const attribute of element.attributes){
            if(/^on/i.test(attribute.localName)||attribute.localName==='href')throw new Error(asset.id+': event or resource reference');
            for(const match of attribute.value.matchAll(/url\\(\\s*(['"]?)(.*?)\\1\\s*\\)/g)){
              if(!match[2].startsWith('#')||!ids.has(match[2].slice(1)))throw new Error(asset.id+': external or unresolved SVG reference');
            }
            if(attribute.name==='aria-labelledby'||attribute.name==='aria-describedby')for(const identity of attribute.value.split(/\\s+/))if(!ids.has(identity))throw new Error(asset.id+': unresolved ARIA reference');
          }
        }
        const rendered=[];
        const sheet=document.createElement('canvas');sheet.width=1800;sheet.height=Math.ceil(pending.length/3)*420;
        const sheetContext=sheet.getContext('2d');sheetContext.fillStyle='#dfc69c';sheetContext.fillRect(0,0,sheet.width,sheet.height);
        for(const [index,asset] of pending.entries()){
          const url=URL.createObjectURL(new Blob([asset.source],{type:'image/svg+xml'}));
          try{
            const image=new Image();image.src=url;await image.decode();
            const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
            const context=canvas.getContext('2d');context.drawImage(image,0,0,width,height);
            const left=(index%3)*600;const top=Math.floor(index/3)*420;
            sheetContext.fillStyle='#434d41';sheetContext.font='24px "Songti SC",serif';sheetContext.fillText(asset.name??asset.id,left+22,top+38);
            const ratio=Math.min(560/width,350/height);sheetContext.drawImage(image,left+20+(560-width*ratio)/2,top+55+(350-height*ratio)/2,width*ratio,height*ratio);
            const pixels=context.getImageData(0,0,width,height).data;
            let painted=0;let transparent=0;
            for(let offset=3;offset<pixels.length;offset+=4){if(pixels[offset]>20)painted++;if(pixels[offset]===0)transparent++}
            if(!painted||!transparent)throw new Error(asset.id+': empty art or missing transparent region');
            rendered.push({id:asset.id,png:asset.png,width,height,painted,transparent,data:canvas.toDataURL('image/png').split(',')[1]});
          }finally{URL.revokeObjectURL(url)}
        }
        return {rendered,sheet:sheet.toDataURL('image/png').split(',')[1]};
      })()`)
        mkdirSync(inkDirectory, { recursive: true })
        for (const asset of result.rendered)
          writeFileSync(join(inkDirectory, asset.png), Buffer.from(asset.data, 'base64'))
        writeFileSync(sheetPath, Buffer.from(result.sheet, 'base64'))
        const exported = result.rendered.map(({ data, ...asset }) => asset)
        writeFileSync(
          reportPath,
          JSON.stringify(
            {
              renderer:
                'Electron ' + process.versions.electron + ' / Chromium ' + process.versions.chrome,
              exported,
              svgReferences: true,
              visualReview: 'manual review required',
            },
            null,
            2,
          ) + '\n',
        )
        console.log(
          'Exported ' +
            result.rendered.length +
            ' transparent PNGs and a paper-backed contact sheet; XML, dimensions and SVG references passed. Inspect images before delivery.',
        )
        clearTimeout(timeout)
        window.destroy()
        app.exit(0)
      } catch (error) {
        console.error(error.stack ?? error)
        clearTimeout(timeout)
        window.destroy()
        app.exit(1)
      }
    })
    .catch((error) => {
      console.error(error.stack ?? error)
      clearTimeout(timeout)
      app.exit(1)
    })
}

try {
  run()
} catch (error) {
  console.error(error.stack ?? error)
  if (app) app.exit(1)
  else process.exit(1)
}
