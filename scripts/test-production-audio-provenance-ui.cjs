require('tsx/cjs')
const { app, BrowserWindow } = require('electron')
const assert = require('node:assert/strict')
const { mkdtempSync, cpSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')
const { tmpdir } = require('node:os')
const { randomUUID } = require('node:crypto')
const Database = require('better-sqlite3')
const {
  VideoWorkflowRepository,
} = require('../src/main/database/repositories/video-workflow-repository')
const root = mkdtempSync(join(tmpdir(), 'production-audio-provenance-ui-'))
assert.ok(
  process.env.WORKFLOW_SEED_DIR,
  'WORKFLOW_SEED_DIR must be a completed production audio refresh fixture',
)
cpSync(join(process.env.WORKFLOW_SEED_DIR, 'workflow.db'), join(root, 'seed.db'))
cpSync(join(process.env.WORKFLOW_SEED_DIR, 'media'), join(root, 'media'), { recursive: true })
cpSync(join(process.env.WORKFLOW_SEED_DIR, 'config'), join(root, 'config'), { recursive: true })
require('node:fs').mkdirSync(join(root, 'database'))
require('node:fs').renameSync(join(root, 'seed.db'), join(root, 'database/dashboard.db'))
const db = new Database(join(root, 'database/dashboard.db'))
const repository = new VideoWorkflowRepository(db)
let project = repository.list()[0]
const sourceVersion = project.stages.audio.version
project = repository.save(
  project.id,
  'audio',
  project.stages.audio.payload,
  project.revision,
  randomUUID(),
)
project = repository.approve(
  project.id,
  'audio',
  project.stages.audio.id,
  project.revision,
  randomUUID(),
)
const currentVersion = project.stages.audio.version
const projectId = project.id
db.close()
process.env.MYDASHBOARD_USER_DATA = root
require('../out/main/index.js')
app.whenReady().then(async () => {
  let window
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const evaluate = (code) => window.webContents.executeJavaScript(code, true)
  const waitFor = async (code) => {
    for (let attempt = 0; attempt < 600; attempt++) {
      if (await evaluate(`Boolean(${code})`)) return
      await pause(100)
    }
    throw new Error(`Timed out ${code}`)
  }
  const screenshot = async (name) => {
    await pause(100)
    writeFileSync(join(root, name), (await window.webContents.capturePage()).toPNG())
  }
  const press = (keyCode) => {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode })
  }
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      window = BrowserWindow.getAllWindows().find((window) =>
        window.webContents.getURL().startsWith('file:'),
      )
      if (window && !window.webContents.isLoadingMainFrame()) break
      await pause(100)
    }
    assert.ok(window)
    await evaluate("location.hash='/video'")
    await waitFor('document.querySelector(".workflow-project-card")')
    await evaluate(
      '[...document.querySelectorAll("button")].find(button=>button.textContent.trim()==="继续创作").click()',
    )
    await waitFor('document.querySelector("[data-workflow-stage=roughcut]")')
    const actualInput = () =>
      evaluate(
        'document.querySelector(".workflow-review-info .workflow-inspector-item strong").textContent',
      )
    assert.equal(
      await actualInput(),
      `分段配音 v${sourceVersion}`,
      'Review must show the actual frozen audio version',
    )
    assert.ok(
      await evaluate(
        `[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='应用当前配音 v${currentVersion}')`,
      ),
    )
    window.focus()
    window.setMinimumSize(720, 640)
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark',${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        await screenshot(`audio-provenance-${theme}-${width}.png`)
        assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        assert.equal(await actualInput(), `分段配音 v${sourceVersion}`)
      }
    }
    window.webContents.setZoomFactor(2)
    await screenshot('audio-provenance-200percent.png')
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    window.webContents.setZoomFactor(1)
    window.setSize(1440, 1000)
    await evaluate(
      'document.querySelector(\'[aria-label="预览版本（审核针对当前版本）"]\').focus()',
    )
    press('Space')
    await waitFor('document.querySelector("[role=option]")')
    press('ArrowDown')
    press('Escape')
    await waitFor('!document.querySelector("[role=option]")')
    assert.equal(
      await evaluate('document.activeElement.getAttribute("aria-label")'),
      '预览版本（审核针对当前版本）',
    )
    await evaluate(
      `[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='应用当前配音 v${currentVersion}').focus()`,
    )
    press('Space')
    await waitFor(
      `document.querySelector('.workflow-review-info .workflow-inspector-item strong')?.textContent==='分段配音 v${currentVersion}'`,
    )
    const actualDb = new Database(join(root, 'database/dashboard.db'), { readonly: true })
    const actual = new VideoWorkflowRepository(actualDb).get(projectId)
    assert.equal(actual.stages.roughcut.payload.sourceAudio, actual.stages.audio.id)
    assert.equal(actual.stages.roughcut.status, 'review')
    assert.equal(actual.stages.audio.version, currentVersion)
    actualDb.close()
    await screenshot('audio-provenance-updated.png')
    console.log('PRODUCTION_AUDIO_PROVENANCE_UI_OK', root)
    app.exit(0)
  } catch (error) {
    console.error(error)
    app.exit(1)
  }
})
