const { app, BrowserWindow, dialog, nativeImage, shell } = require('electron')
const assert = require('node:assert/strict')
const { mkdtempSync, writeFileSync, readFileSync } = require('node:fs')
const { join } = require('node:path')
const { tmpdir } = require('node:os')
const { spawnSync } = require('node:child_process')
const { setTimeout: delay } = require('node:timers/promises')

const root = mkdtempSync(join(tmpdir(), 'publication-cover-ui-'))
const revealed = []
shell.showItemInFolder = (path) => revealed.push(path)
const node = spawnSync('which', ['node'], { encoding: 'utf8' }).stdout.trim()
const seed = spawnSync(
  process.execPath,
  ['--import', 'tsx', join(__dirname, 'seed-bilibili-publishing.ts'), root, node],
  {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    encoding: 'utf8',
  },
)
assert.equal(seed.status, 0, seed.stderr)
const refreshSeed = spawnSync(
  process.execPath,
  [
    '--import',
    'tsx',
    join(__dirname, 'seed-publication-refresh.ts'),
    root,
    ...process.argv.filter((argument) => ['--frame', '--no-cover'].includes(argument)),
  ],
  {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    encoding: 'utf8',
  },
)
assert.equal(refreshSeed.status, 0, refreshSeed.stderr)
process.env.MYDASHBOARD_USER_DATA = root
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [root] })
const initial = JSON.parse(readFileSync(join(root, 'seed-project.json'), 'utf8'))
require('../out/main/index.js')

app.whenReady().then(async () => {
  let window
  const evaluate = (source) => window.webContents.executeJavaScript(source, true)
  const waitFor = async (source, label) => {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (await evaluate(`Boolean(${source})`)) return
      await delay(100)
    }
    throw new Error(`Timed out: ${label}`)
  }
  const click = async (name) => {
    assert.ok(
      await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find(item =>
        (item.textContent.trim() === ${JSON.stringify(name)} || item.getAttribute('aria-label') === ${JSON.stringify(name)}) && !item.disabled)
      if (!button) return false
      button.click(); return true
    })()`),
      name,
    )
    await delay(150)
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
    await evaluate(
      'document.querySelector("[role=dialog], [data-publication-cover]").scrollIntoView({block:"center"})',
    )
    await delay(100)
    writeFileSync(join(root, name), (await window.webContents.capturePage()).toPNG())
  }
  const completed = async () => {
    let project
    for (let attempt = 0; attempt < 200; attempt++) {
      project = await call('get', initial.id)
      if (!project.jobs.some((job) => job.state === 'running')) return project
      await delay(100)
    }
    throw new Error('Cover task did not complete')
  }
  try {
    for (let attempt = 0; attempt < 120; attempt++) {
      window = BrowserWindow.getAllWindows().find((item) =>
        item.webContents.getURL().startsWith('file:'),
      )
      if (window && !window.webContents.isLoadingMainFrame()) break
      await delay(100)
    }
    window.setMinimumSize(720, 640)
    window.setSize(1440, 1100)
    await waitFor('document.querySelector("nav")', 'app ready')
    await evaluate("location.hash='/video'")
    await waitFor('document.querySelector(".workflow-project-row")', 'project list')
    await click('继续创作')
    await waitFor('document.querySelector("[data-publication-cover]")', 'cover panel')
    if (process.argv.includes('--no-cover')) {
      await click('保存当前成片发布版本')
      await click('确认保存新版本')
      await waitFor('document.body.textContent.includes("草稿已保存")', 'unchanged metadata saved')
      const refreshed = await call('get', initial.id)
      assert.equal(refreshed.stages.publish.status, 'review')
      assert.equal(refreshed.stages.publish.version, initial.stages.publish.version + 1)
      assert.deepEqual(refreshed.stages.publish.payload, initial.stages.publish.payload)
      await click('审核通过此版本')
      await click('确认审核通过')
      await waitFor('document.body.textContent.includes("已审核通过")', 'manual approval')
      console.log(JSON.stringify({ result: 'PASS', root, mode: 'no-cover' }))
      app.exit(0)
      return
    }
    await waitFor(
      'document.body.textContent.includes("此封面对应旧成片")',
      'stale publication shown',
    )
    const original = initial.stages.publish.payload
    const initialVersion = initial.stages.publish.version
    const forged = structuredClone(original)
    forged.platforms.bilibili.cover.feedback = '伪造来源描述'
    forged.platforms.bilibili.cover.reuseConfirmations = [
      { renderId: initial.stages.render.id, confirmedAt: new Date().toISOString() },
    ]
    const rejection = await evaluate(
      `window.electronAPI.invoke('workflow:save', ${JSON.stringify(initial.id)}, 'publish', ${JSON.stringify(forged)}, ${initial.revision}, 'forged-cover-reuse')`,
    )
    assert.equal(
      rejection.success,
      false,
      'reuse must match an existing immutable historical cover',
    )
    assert.match(rejection.error, /复用来源/)
    const staleSave = await evaluate(
      `window.electronAPI.invoke('workflow:save', ${JSON.stringify(initial.id)}, 'publish', ${JSON.stringify(original)}, ${initial.revision}, 'unconfirmed-cover-reuse')`,
    )
    assert.equal(staleSave.success, false)
    assert.match(staleSave.error, /成片已变化/)
    await click('复用到当前成片')
    await waitFor('document.querySelector("[role=dialog]")', 'reuse confirmation')
    assert.ok(
      await evaluate(
        'document.querySelector("[role=dialog]").textContent.includes("保存后需重新人工审核")',
      ),
    )
    await key('Escape')
    assert.equal((await call('get', initial.id)).stages.publish.id, initial.stages.publish.id)
    assert.equal(await evaluate('document.activeElement.textContent.trim()'), '复用到当前成片')
    await click('复用到当前成片')
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        await screenshot(`publication-refresh-${theme}-${width}.png`)
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'))
      }
    }
    window.webContents.setZoomFactor(2)
    await screenshot('publication-refresh-200percent.png')
    await key('Tab')
    assert.ok(
      await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'),
    )
    window.webContents.setZoomFactor(1)
    await click('确认复用封面')
    await click('保存草稿')
    await click('确认保存新版本')
    await waitFor('document.body.textContent.includes("草稿已保存")', 'saved publication')
    let project = await call('get', initial.id)
    assert.equal(project.stages.publish.version, initialVersion + 1)
    assert.equal(project.stages.publish.status, 'review')
    assert.notEqual(project.stages.publish.status, 'stale')
    const saved = project.stages.publish.payload
    assert.equal(saved.platforms.bilibili.title, original.platforms.bilibili.title)
    assert.equal(saved.platforms.bilibili.description, original.platforms.bilibili.description)
    assert.deepEqual(saved.platforms.bilibili.tags, original.platforms.bilibili.tags)
    assert.deepEqual(saved.platforms.douyin, original.platforms.douyin)
    assert.equal(
      saved.platforms.bilibili.cover.sourceRenderId,
      original.platforms.bilibili.cover.sourceRenderId,
    )
    assert.equal(
      saved.platforms.bilibili.cover.file.sha256,
      original.platforms.bilibili.cover.file.sha256,
    )
    if (process.argv.includes('--frame')) {
      assert.deepEqual(
        saved.platforms.bilibili.cover.frameSource,
        original.platforms.bilibili.cover.frameSource,
      )
      assert.ok(
        saved.platforms.bilibili.cover.frameSource.time >= initial.stages.render.payload.duration,
      )
    }
    assert.equal(
      saved.platforms.bilibili.cover.reuseConfirmations.at(-1).renderId,
      initial.stages.render.id,
    )
    await click('审核通过此版本')
    await click('确认审核通过')
    await waitFor('document.body.textContent.includes("已审核通过")', 'manual approval')
    project = await call('get', initial.id)
    assert.equal(project.stages.publish.status, 'approved')
    const listed = await call('list', false)
    assert.equal(
      listed.find((item) => item.id === initial.id).cover.id,
      saved.platforms.bilibili.cover.file.id,
    )
    console.log(JSON.stringify({ result: 'PASS', root, version: project.stages.publish.version }))
    app.exit(0)
  } catch (failure) {
    console.error(failure)
    app.exit(1)
  }
})
