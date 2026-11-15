const { app, BrowserWindow } = require('electron')
const assert = require('node:assert/strict')
const { resolve, join } = require('node:path')
const { mkdirSync, mkdtempSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')

const root = resolve(__dirname, '..')
const catalog = require('../docs/design-system/v2/culture-gallery/catalog.json')
const output = join(root, '.scratch/culture-gallery')
app.setPath('userData', mkdtempSync(join(tmpdir(), 'culture-gallery-')))
app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1440,
    height: 1000,
    webPreferences: { sandbox: true, backgroundThrottling: false },
  })
  try {
    await window.loadFile(join(root, 'resources/visuals/traditional-culture/gallery/index.html'))
    const result = await window.webContents.executeJavaScript(`(async () => {
      const deadline = performance.now() + 10000;
      while (!document.querySelector('article img')) {
        if (performance.now() > deadline) throw new Error('Gallery did not mount');
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      await document.querySelector('article img').decode();
      return { title: document.querySelector('h1').textContent, cards: document.querySelectorAll('article').length, tabs: document.querySelectorAll('[role="tab"]').length, image: document.querySelector('article img').naturalWidth };
    })()`)
    assert.equal(result.cards, catalog.assets.filter((asset) => asset.latest).length)
    assert.equal(result.tabs, catalog.categories.length)
    assert.ok(result.image > 0)
    mkdirSync(output, { recursive: true })
    writeFileSync(join(output, 'electron.png'), (await window.webContents.capturePage()).toPNG())
    console.log('Electron sandbox / file protocol passed', result)
    app.exit(0)
  } catch (error) {
    console.error(error)
    app.exit(1)
  }
})
