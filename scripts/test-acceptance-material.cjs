require('tsx/cjs')
const assert = require('node:assert/strict')
const { app, nativeImage } = require('electron')
const { mkdirSync, writeFileSync } = require('node:fs')
const { join, resolve } = require('node:path')
const { captureStoryboard } = require('../src/main/services/video-workflow/render')
const helper = join(__dirname, 'fixtures', 'transparent-material.cjs')
app.on('window-all-closed', () => {})
app.whenReady().then(async () => {
  try {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><ellipse cx="200" cy="220" rx="95" ry="125" fill="#7b4b2a" transform="rotate(25 200 220)"/><path d="M170 300Q230 220 210 125" stroke="#d2af79" stroke-width="10" fill="none"/><path d="M210 125Q210 35 280 55Q285 110 210 125" fill="#4f8b43"/></svg>'
    const render =
      process.env.WORKFLOW_MATERIAL_LEGACY_CAPTURE === '1'
        ? (html) =>
            captureStoryboard(html, new AbortController().signal, '', { width: 400, height: 400 })
        : require(helper).captureTransparentMaterial
    const png = await render(svg, { width: 400, height: 400 })
    const image = nativeImage.createFromBuffer(png)
    assert.deepEqual(image.getSize(), { width: 400, height: 400 })
    const pixels = image.toBitmap()
    assert.equal(pixels[3], 0, 'asset corner must be transparent, not storyboard white')
    assert.equal(pixels[(220 * 400 + 200) * 4 + 3], 255, 'seed subject must remain opaque')
    const output = resolve('output/native-remotion/material-alpha-fix/seed.png')
    mkdirSync(require('node:path').dirname(output), { recursive: true })
    writeFileSync(output, png)
    console.log('TRANSPARENT_MATERIAL_OK', output)
    app.exit(0)
  } catch (error) {
    console.error(error)
    app.exit(1)
  }
})
