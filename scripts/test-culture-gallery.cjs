const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync, statSync } = require('node:fs')
const { resolve, join } = require('node:path')
const { createRequire } = require('node:module')
const { pathToFileURL, fileURLToPath } = require('node:url')

const root = resolve(__dirname, '..')
const catalog = require('../docs/design-system/v2/culture-gallery/catalog.json')
const localRequire = createRequire(join(root, 'docs/design-system/v2/package.json'))
const { chromium } = localRequire('@playwright/test')
const output = join(root, '.scratch/culture-gallery')
mkdirSync(output, { recursive: true })

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    })
    const requests = new Set()
    const errors = []
    page.on('request', (request) => requests.add(request.url()))
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(
      pathToFileURL(join(root, 'resources/visuals/traditional-culture/gallery/index.html')).href,
    )
    await page.getByRole('heading', { name: '纸上山河 · 作品画册' }).waitFor()
    await page
      .locator('article img')
      .first()
      .evaluate((image) => image.decode())
    assert.equal(
      await page.locator('article').count(),
      catalog.assets.filter((asset) => asset.latest).length,
    )
    assert.equal(
      [...requests].filter((url) => /\.(svg|png|jpg)(\?|$)|-detail\.webp/.test(url)).length,
      0,
    )
    assert.ok([...requests].filter((url) => /-thumb\.webp/.test(url)).length <= 9)
    const initialRequests = [...requests]
    await page
      .locator('article img')
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
    await page.screenshot({ path: join(output, 'desktop-light.png') })
    await page.locator('article').last().scrollIntoViewIfNeeded()
    await page
      .locator('article')
      .last()
      .locator('img')
      .evaluate((image) => image.decode())
    assert.ok(
      [...requests].filter((url) => url.includes('-thumb.webp')).length >
        initialRequests.filter((url) => url.includes('-thumb.webp')).length,
    )
    await page.getByRole('tab', { name: /本次新作/ }).click()
    assert.equal(
      await page.locator('article').count(),
      catalog.assets.filter((asset) => asset.recent).length,
    )
    const newPreview = page
      .locator('article')
      .filter({
        has: page.getByRole('heading', {
          name: catalog.assets.find((asset) => asset.recent).name,
          exact: true,
        }),
      })
      .getByRole('button', { name: '放大预览' })
    await newPreview.click()
    await page
      .getByRole('dialog')
      .locator('img')
      .evaluate((image) => image.decode())
    assert.ok(
      (await page
        .getByRole('dialog')
        .getByRole('link', { name: '下载透明 PNG' })
        .getAttribute('href')) === catalog.assets.find((asset) => asset.recent).original,
    )
    await page.keyboard.press('Escape')
    await page.getByRole('tab', { name: /人物与生灵/ }).click()
    assert.equal(
      await page.locator('article').count(),
      catalog.assets.filter((asset) => asset.category === 'figures').length,
    )
    const hero = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: '霍去病 · 锐气' }) })
    const preview = hero.getByRole('button', { name: '放大预览' })
    await preview.click()
    const dialog = page.getByRole('dialog')
    await dialog.waitFor()
    await dialog.locator('img').evaluate((image) => image.decode())
    assert.ok(
      await dialog.locator('img').evaluate((image) => {
        const picture = image.getBoundingClientRect()
        const stage = image.parentElement.getBoundingClientRect()
        return picture.height <= stage.height + 1 && picture.width <= stage.width + 1
      }),
      'Detail preview must fit its stage without cropping',
    )
    assert.ok(
      [...requests].some(
        (url) => url.includes('huo-qubing-vanguard') && url.includes('-detail.webp'),
      ),
    )
    assert.ok(
      (await dialog.getByRole('link', { name: '下载透明 PNG' }).getAttribute('href')).includes(
        'figure-studies-v3',
      ),
    )
    await page.screenshot({ path: join(output, 'detail.png') })
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(await preview.evaluate((element) => element === document.activeElement), true)
    const selectedTab = page.getByRole('tab', { name: /人物与生灵/ })
    await selectedTab.focus()
    await page.keyboard.press('ArrowRight')
    await page.getByRole('tab', { name: /线描元素/ }).waitFor({ state: 'visible' })
    assert.equal(
      await page.getByRole('tab', { name: /线描元素/ }).getAttribute('aria-selected'),
      'true',
    )
    await page.getByRole('button', { name: '切换到深色' }).click()
    assert.equal(await page.locator('html').getAttribute('class'), 'dark')
    await page.screenshot({ path: join(output, 'desktop-dark.png') })
    for (const width of [1024, 600, 390]) {
      await page.setViewportSize({ width, height: 900 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    }
    await page.screenshot({ path: join(output, 'narrow-dark.png') })
    await page.setViewportSize({ width: 720, height: 550 })
    await page.getByRole('tab', { name: /历史稿/ }).click()
    assert.equal(await page.locator('article').count(), 6)
    const historicalButton = page
      .locator('article')
      .first()
      .getByRole('button', { name: '放大预览' })
    await historicalButton.click()
    await dialog.locator('img').evaluate((image) => image.decode())
    const close = dialog.getByRole('button', { name: /close|关闭/i })
    assert.ok(await close.isVisible())
    await close.focus()
    await page.keyboard.press('Tab')
    assert.ok(await dialog.evaluate((element) => element.contains(document.activeElement)))
    await page.keyboard.press('Escape')
    await page.getByRole('tab', { name: /预览与细节/ }).click()
    assert.ok((await page.locator('article').count()) >= 10)
    await page
      .locator('article img')
      .first()
      .evaluate((image) => {
        image.src = './missing-preview.webp'
      })
    await page.getByRole('alert').first().waitFor()
    assert.ok(await page.getByRole('link', { name: '打开原图' }).first().isVisible())
    assert.deepEqual(errors, [])
    const bytes = initialRequests
      .filter((url) => url.startsWith('file:'))
      .reduce((total, url) => total + statSync(fileURLToPath(url)).size, 0)
    const report = {
      initialRequests: initialRequests.length,
      initialBytes: bytes,
      initialImageRequests: initialRequests.filter((url) => url.includes('-thumb.webp')).length,
      errors,
    }
    writeFileSync(join(output, 'verification.json'), JSON.stringify(report, null, 2))
    console.log(
      'Gallery file protocol, lazy images, current/historical assets, keyboard, themes and responsive checks passed',
      report,
    )
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
