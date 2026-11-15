const { app, BrowserWindow, dialog, nativeImage } = require('electron')
const assert = require('node:assert/strict')
const { mkdtempSync, writeFileSync, readFileSync, existsSync } = require('node:fs')
const { join } = require('node:path')
const { tmpdir } = require('node:os')
const { spawnSync } = require('node:child_process')
const { setTimeout: delay } = require('node:timers/promises')
const { randomUUID } = require('node:crypto')
const root = mkdtempSync(join(tmpdir(), 'frame-cover-ui-'))
const seed = spawnSync(
  process.execPath,
  ['--import', 'tsx', join(__dirname, 'seed-frame-cover.ts'), root],
  { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8' },
)
assert.equal(seed.status, 0, seed.stderr)
process.env.MYDASHBOARD_USER_DATA = root
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [root] })
const initial = JSON.parse(readFileSync(join(root, 'seed-project.json'), 'utf8'))
require('../out/main/index.js')
const deadline = setTimeout(() => app.exit(1), 120000)
app.whenReady().then(async () => {
  let window
  const evaluate = (source) => window.webContents.executeJavaScript(source, true)
  const wait = async (source, label) => {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (await evaluate(`Boolean(${source})`)) return
      await delay(100)
    }
    throw new Error(`Timed out: ${label}`)
  }
  const click = async (name) => {
    assert.ok(
      await evaluate(
        `(() => { const button=[...document.querySelectorAll('button')].find(b => (b.textContent.trim()===${JSON.stringify(name)} || b.getAttribute('aria-label')===${JSON.stringify(name)}) && !b.disabled); if(!button)return false;button.click();return true })()`,
      ),
      name,
    )
    await delay(180)
  }
  const call = async (action, ...args) => {
    const result = await evaluate(
      `window.electronAPI.invoke(${JSON.stringify(`workflow:${action}`)}, ...${JSON.stringify(args)})`,
    )
    assert.equal(result.success, true, result.error)
    return result.data
  }
  const key = async (keyCode) => {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode })
    await delay(120)
  }
  const screenshot = async (name) => {
    writeFileSync(join(root, name), (await window.webContents.capturePage()).toPNG())
  }
  try {
    for (let attempt = 0; attempt < 120; attempt++) {
      window = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('file:'))
      if (window && !window.webContents.isLoadingMainFrame()) break
      await delay(100)
    }
    window.setMinimumSize(720, 640)
    window.setSize(1440, 1100)
    await wait('document.querySelector("nav")', 'app')
    await evaluate("location.hash='/video'")
    await wait('document.querySelector(".workflow-project-row")', 'project')
    await click('继续创作')
    await wait('document.querySelector("[data-cover-frame]")', 'frame button')
    await click('从视频选帧')
    await wait('document.querySelector("#publication-cover-frame")', 'slider')
    await evaluate('document.querySelector("#publication-cover-frame").focus()')
    await key('Right')
    assert.equal(
      await evaluate('Number(document.querySelector("#publication-cover-frame").value)'),
      1,
    )
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        await screenshot(`frame-picker-${theme}-${width}.png`)
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'))
      }
    }
    window.webContents.setZoomFactor(2)
    await screenshot('frame-picker-200percent.png')
    await key('Tab')
    assert.ok(
      await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'),
    )
    window.webContents.debugger.attach('1.3')
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-motion', value: 'reduce' },
        { name: 'forced-colors', value: 'active' },
      ],
    })
    await screenshot('frame-picker-reduced-high-contrast.png')
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', { features: [] })
    window.webContents.debugger.detach()
    await key('Escape')
    assert.equal(await evaluate('document.activeElement.hasAttribute("data-cover-frame")'), true)
    assert.deepEqual(await call('get', initial.id), initial)
    window.webContents.setZoomFactor(1)
    window.setSize(1440, 1100)
    await evaluate('document.documentElement.classList.remove("dark")')
    const selectFrame = async (frame) => {
      await click('从视频选帧')
      await wait('document.querySelector("#publication-cover-frame")', 'slider')
      await evaluate('document.querySelector("#publication-cover-frame").focus()')
      await key('End')
      if (frame === 0) await key('Home')
      await wait(
        '!document.querySelector("[data-cover-frame-confirm]").disabled',
        'frame preview ready',
      )
      await click('使用此帧作为封面')
      await wait('!document.querySelector("[role=dialog]")', 'candidate confirmed')
      assert.equal((await call('get', initial.id)).stages.publish.status, 'approved')
      await click('保存草稿')
      await click('确认保存新版本')
      await wait('!document.querySelector("[role=dialog]")', 'saved')
      const project = await call('get', initial.id)
      assert.equal(project.stages.publish.status, 'review')
      await call(
        'approve',
        project.id,
        'publish',
        project.stages.publish.id,
        project.revision,
        randomUUID(),
        '',
      )
      return await call('get', initial.id)
    }
    let project = await selectFrame(119)
    const bili = project.stages.publish.payload.platforms.bilibili.cover
    assert.equal(bili.frameSource.frame, 119)
    assert.equal(bili.frameSource.videoSha256, initial.stages.render.payload.file.sha256)
    for (const [file, height] of [
      [bili.file, 900],
      [bili.feedFile, 1200],
    ])
      assert.deepEqual(nativeImage.createFromPath(join(root, file.path)).getSize(), {
        width: 1600,
        height,
      })
    let exported = await call('export', project.id, 'bilibili')
    assert.deepEqual(
      readFileSync(join(exported, 'cover.png')),
      readFileSync(join(root, bili.file.path)),
    )
    assert.deepEqual(
      readFileSync(join(exported, 'cover-4x3.png')),
      readFileSync(join(root, bili.feedFile.path)),
    )
    await evaluate('document.querySelector("input[type=radio][value=douyin]").click()')
    await wait(
      'document.querySelector("[data-publication-cover]")?.getAttribute("aria-label")==="抖音投稿封面"',
      'douyin panel',
    )
    assert.equal(await evaluate('document.querySelector("[data-cover-generate]")'), null)
    project = await selectFrame(0)
    const douyin = project.stages.publish.payload.platforms.douyin.cover
    assert.equal(douyin.platform, 'douyin')
    assert.equal(douyin.frameSource.frame, 0)
    assert.deepEqual(nativeImage.createFromPath(join(root, douyin.file.path)).getSize(), {
      width: 360,
      height: 640,
    })
    assert.equal(project.stages.publish.payload.platforms.bilibili.cover.file.id, bili.file.id)
    assert.equal(project.stages.render.id, initial.stages.render.id)
    exported = await call('export', project.id, 'douyin')
    assert.deepEqual(
      readFileSync(join(exported, 'cover.png')),
      readFileSync(join(root, douyin.file.path)),
    )
    assert.equal(existsSync(join(exported, 'cover-4x3.png')), false)
    assert.match(readFileSync(join(exported, 'README.txt'), 'utf8'), /360×640/)
    const history = await call('historyAssets', project.id, 'cover', 'douyin')
    assert.ok(history.every((item) => item.value.platform === 'douyin'))
    const bad = structuredClone(project.stages.publish.payload)
    bad.platforms.douyin.cover.frameSource.videoSha256 = 'a'.repeat(64)
    const rejected = await evaluate(
      `window.electronAPI.invoke('workflow:save', ${JSON.stringify(project.id)}, 'publish', ${JSON.stringify(bad)}, ${project.revision}, 'tampered-frame')`,
    )
    assert.equal(rejected.success, false)
    assert.match(rejected.error, /成片已变化/)
    await click('从视频选帧')
    await wait(
      '!document.querySelector("[data-cover-frame-confirm]")?.disabled',
      'error fixture preview',
    )
    const videoPath = join(root, initial.stages.render.payload.file.path)
    const originalBytes = readFileSync(videoPath)
    writeFileSync(videoPath, 'damaged source video')
    await click('使用此帧作为封面')
    await wait(
      'document.querySelector("[role=dialog] [role=alert]")?.textContent.includes("修改")',
      'source error preserves dialog',
    )
    assert.equal(
      (await call('get', initial.id)).stages.publish.payload.platforms.douyin.cover.file.id,
      douyin.file.id,
    )
    writeFileSync(videoPath, originalBytes)
    await key('Escape')
    await screenshot('douyin-frame-cover.png')
    const runtime = await call('runtime')
    const anamorphicPath = join(root, 'anamorphic.mp4')
    const encoded = spawnSync(
      runtime.ffmpegPath,
      [
        '-nostdin',
        '-v',
        'error',
        '-i',
        join(root, 'source.mp4'),
        '-vf',
        'setsar=2',
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        anamorphicPath,
      ],
      { encoding: 'utf8' },
    )
    assert.equal(encoded.status, 0, encoded.stderr)
    let anamorphic = await call(
      'createFromVideo',
      '非方形像素封面验证',
      anamorphicPath,
      '隔离测试视频',
      randomUUID(),
    )
    const frameInfo = await call(
      'frameCoverInfo',
      anamorphic.id,
      anamorphic.stages.render.id,
      anamorphic.revision,
    )
    assert.deepEqual([frameInfo.width, frameInfo.height], [720, 640])
    const anamorphicFrame = await call('createFrameCover', {
      projectId: anamorphic.id,
      renderId: anamorphic.stages.render.id,
      expected: anamorphic.revision,
      platform: 'douyin',
      time: 1,
      requestId: randomUUID(),
    })
    anamorphic.stages.publish.payload.platforms.douyin.cover = anamorphicFrame
    anamorphic = await call(
      'save',
      anamorphic.id,
      'publish',
      anamorphic.stages.publish.payload,
      anamorphic.revision,
      randomUUID(),
    )
    anamorphic = await call(
      'approve',
      anamorphic.id,
      'publish',
      anamorphic.stages.publish.id,
      anamorphic.revision,
      randomUUID(),
      '',
    )
    const anamorphicExport = await call('export', anamorphic.id, 'douyin')
    assert.deepEqual(nativeImage.createFromPath(join(anamorphicExport, 'cover.png')).getSize(), {
      width: 720,
      height: 640,
    })
    console.log(
      JSON.stringify({
        passed: true,
        root,
        checks: [
          'slider keyboard first/last',
          'cancel/focus',
          'both platforms',
          'draft/save/review',
          'actual PNG sizes',
          'export bytes',
          'platform history',
          'source integrity',
          'themes/viewports/zoom',
        ],
      }),
    )
    clearTimeout(deadline)
    app.exit(0)
  } catch (failure) {
    console.error(failure)
    console.error('Artifacts:', root)
    if (window) {
      console.error(await evaluate('document.body.innerText'))
      await screenshot('failure.png')
    }
    clearTimeout(deadline)
    app.exit(1)
  }
})
