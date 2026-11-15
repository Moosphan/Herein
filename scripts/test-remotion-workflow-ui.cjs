const { app, BrowserWindow, session, ipcMain, dialog } = require('electron')
const assert = require('node:assert/strict')
const { mkdtempSync, mkdirSync, readFileSync, writeFileSync, chmodSync } = require('node:fs')
const { join, resolve } = require('node:path')
const { tmpdir } = require('node:os')
const { spawnSync } = require('node:child_process')
const { setTimeout: delay } = require('node:timers/promises')

const root = mkdtempSync(join(tmpdir(), 'synthetic-remotion-ui-'))
const materialPath = join(root, 'local-ui-image.png')
const materialCreated = spawnSync(
  'ffmpeg',
  [
    '-nostdin',
    '-y',
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'color=c=yellow:s=80x80',
    '-frames:v',
    '1',
    materialPath,
  ],
  { encoding: 'utf8' },
)
assert.equal(materialCreated.status, 0, materialCreated.stderr)
const originalDialog = dialog.showOpenDialog
dialog.showOpenDialog = (window, options) =>
  options?.title === '导入原生画面素材'
    ? Promise.resolve({ canceled: false, filePaths: [materialPath] })
    : originalDialog(window, options)
const node = spawnSync('which', ['node'], { encoding: 'utf8' }).stdout.trim()
const seeded = spawnSync(
  process.execPath,
  ['--import', 'tsx', join(__dirname, 'seed-bilibili-publishing.ts'), root, node],
  { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8' },
)
assert.equal(seeded.status, 0, seeded.stderr)
const seedProject = JSON.parse(readFileSync(join(root, 'seed-project.json'), 'utf8'))
const fixtureDb = new (require('better-sqlite3'))(join(root, 'database/dashboard.db'))
fixtureDb.prepare("DELETE FROM video_workflow_revisions WHERE stage IN ('render', 'publish')").run()
fixtureDb.close()
const runtimeRoot = join(root, 'runtime')
mkdirSync(runtimeRoot)
for (const name of ['react', 'react-dom', 'remotion']) {
  const directory = join(runtimeRoot, 'node_modules', name)
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name, version: '4.0.541' }))
}
const executable = join(runtimeRoot, 'cli.js')
const modePath = join(root, 'mode')
const invocationPath = join(root, 'invocation.json')
writeFileSync(modePath, 'success')
writeFileSync(
  executable,
  `
const fs = require('node:fs');
if (process.argv.includes('--version')) { console.log('@remotion/cli 4.0.541'); process.exit(0); }
fs.writeFileSync(${JSON.stringify(invocationPath)}, JSON.stringify(process.argv.slice(2)));
if(fs.readFileSync(${JSON.stringify(modePath)}, 'utf8') === 'failure') { console.error('Synthetic Remotion render unavailable'); process.exit(1); }
const output = process.argv[process.argv.indexOf('Video') + 1];
if (!output || !output.endsWith('.mp4')) process.exit(2);
require('node:child_process').execFileSync('ffmpeg', ['-nostdin','-y','-v','error','-f','lavfi','-i','color=c=0x123456:s=1920x1080:d=10','-f','lavfi','-i','sine=frequency=440:duration=10','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-shortest',output]);
`,
)
const configPath = join(root, 'config/video-workflow.json')
const agentPath = join(runtimeRoot, 'agent.cjs')
const nativeSources = {
  summary: 'Synthetic native Remotion UI fixture',
  files: [
    {
      name: 'visuals.tsx',
      content:
        "import React from 'react'; import Scene from './scene-0'; export default function Visuals(props) { return <Scene {...props}/> }",
    },
    {
      name: 'scene-0.tsx',
      content:
        "import React from 'react'; export default function Scene() { return <div>Native visual fixture</div> }",
    },
  ],
}
writeFileSync(
  agentPath,
  `#!${node}\nif(process.argv[2]==='mcp'){process.stdout.write('[]');process.exit(0)}process.stdin.resume();process.stdin.on('end',()=>{const output=process.argv.indexOf('--output-last-message');if(output>=0)require('node:fs').writeFileSync(process.argv[output+1],${JSON.stringify(JSON.stringify(nativeSources))});else process.stdout.write(JSON.stringify({result:${JSON.stringify(JSON.stringify(nativeSources))}}));});`,
)
chmodSync(agentPath, 0o700)
writeFileSync(
  configPath,
  JSON.stringify({
    ...JSON.parse(readFileSync(configPath, 'utf8')),
    remotionPath: executable,
    hyperframesPath: '',
    codexPath: agentPath,
    claudePath: agentPath,
    deepseekPath: '',
  }),
)
process.env.MYDASHBOARD_USER_DATA = root
delete process.env.ELECTRON_RENDERER_URL
global.fetch = async () => {
  throw new Error('Synthetic offline fixture')
}
app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*'] },
    (_details, done) => done({ cancel: true }),
  )
})
require('../out/main/index.js')

app.whenReady().then(async () => {
  ipcMain.removeHandler('ai:getCodexUsageDashboard')
  ipcMain.handle('ai:getCodexUsageDashboard', () => ({
    success: false,
    error: 'Synthetic offline fixture',
  }))
  let window
  const evaluate = (source) => window.webContents.executeJavaScript(source, true)
  const wait = async (source, label = source) => {
    for (let attempt = 0; attempt < 300; attempt++) {
      if (
        window &&
        !window.isDestroyed() &&
        !window.webContents.isLoadingMainFrame() &&
        (await evaluate(`Boolean(${source})`))
      )
        return
      await delay(100)
    }
    throw new Error('Timed out: ' + label)
  }
  const click = async (label) => {
    assert.ok(
      await evaluate(
        `(() => {const button=[...document.querySelectorAll('button')].find(button => button.textContent.trim() === ${JSON.stringify(label)}); if(!button || button.disabled) return false; button.click(); return true;})()`,
      ),
      label,
    )
  }
  const key = async (keyCode) => {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode })
    await delay(100)
  }
  const stage = async (index) => {
    await evaluate(
      `document.querySelector('nav[aria-label="视频创作步骤"] button[aria-label^="${index}."]').click()`,
    )
    await wait(
      `document.querySelector('nav [aria-current=step]')?.getAttribute('aria-label').startsWith('${index}.')`,
    )
  }
  const openProject = async () => {
    await evaluate('location.hash="/video"')
    await wait('document.getElementById("workflow-project-search")')
    await click('继续创作')
    await wait('document.querySelector("nav[aria-label=视频创作步骤]")')
  }
  const getProject = () =>
    evaluate(`window.electronAPI.invoke('workflow:get', ${JSON.stringify(seedProject.id)})`)
  const selector = 'button[role=combobox][aria-label="合成引擎"]'
  const screens = resolve('.scratch/remotion/screens')
  mkdirSync(screens, { recursive: true })
  const screenshot = async (name) => {
    await delay(150)
    writeFileSync(join(screens, `${name}.png`), (await window.webContents.capturePage()).toPNG())
  }
  const deadline = setTimeout(() => {
    console.error('Remotion UI timed out')
    app.exit(1)
  }, 150000)
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      window = BrowserWindow.getAllWindows().find((candidate) =>
        candidate.webContents.getURL().startsWith('file:'),
      )
      if (window && !window.webContents.isLoadingMainFrame()) break
      await delay(100)
    }
    assert.ok(window)
    window.setSize(1440, 1000)
    await openProject()
    assert.equal(
      await evaluate('document.querySelectorAll("nav[aria-label=视频创作步骤] button").length'),
      7,
    )
    assert.equal(
      await evaluate(
        '[...document.querySelectorAll("nav[aria-label=视频创作步骤] button")].filter(b=>b.textContent.includes("视频制作")).length',
      ),
      1,
    )
    const originalStages = (await getProject()).data.stages
    await stage(3)
    await click('创作设置')
    await wait('document.querySelector("[data-native-materials]")')
    await evaluate('document.querySelector("[data-native-materials] summary").click()')
    await wait(
      '[...document.querySelectorAll("button")].some(button => button.textContent === "导入本地素材" && !button.disabled)',
    )
    await click('导入本地素材')
    await wait('document.querySelector("[data-native-material]")')
    await click('检查素材')
    await wait('document.querySelector("[data-native-materials]").textContent.includes("请填写")')
    await evaluate(
      `(() => { const field=document.querySelector('[data-native-material] textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(field,'独立产品界面，保留原图内容'); field.dispatchEvent(new Event('input',{bubbles:true})); })()`,
    )
    await evaluate('document.querySelector("[data-native-material] button[role=combobox]").focus()')
    await key('Space')
    await wait('document.querySelector("[role=listbox]")')
    await key('End')
    await key('Return')
    await wait('!document.querySelector("[role=listbox]")')
    await click('检查素材')
    await wait('document.querySelector("[data-native-materials]").textContent.includes("检查通过")')
    const storedMaterial = await evaluate(
      `JSON.parse(localStorage.getItem('video-workflow:native-materials:${seedProject.id}'))[0]`,
    )
    assert.ok(storedMaterial.sceneId)
    const managedMaterial = join(root, storedMaterial.file.path)
    const originalBytes = readFileSync(managedMaterial)
    writeFileSync(managedMaterial, 'modified')
    await click('检查素材')
    await wait(
      'document.querySelector("[data-native-materials]").textContent.includes("文件丢失或内容被修改")',
    )
    writeFileSync(managedMaterial, originalBytes)
    await click('检查素材')
    await wait('document.querySelector("[data-native-materials]").textContent.includes("检查通过")')
    assert.deepEqual((await getProject()).data.stages, originalStages)
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        await screenshot(`native-materials-${theme}-${width}`)
        assert.ok(
          await evaluate(
            'document.querySelector("[role=dialog]").scrollWidth <= document.querySelector("[role=dialog]").clientWidth',
          ),
        )
      }
    }
    window.webContents.setZoomFactor(2)
    await screenshot('native-materials-dark-200')
    await key('Escape')
    await wait('!document.querySelector("[role=dialog]")')
    assert.equal(await evaluate('document.activeElement?.textContent.trim()'), '创作设置')
    window.webContents.setZoomFactor(1)
    window.webContents.reload()
    await wait('document.querySelector("main")')
    await openProject()
    await stage(3)
    await click('创作设置')
    await wait(
      'document.querySelector("[data-native-material] textarea")?.value.includes("独立产品界面")',
    )
    await key('Escape')
    await stage(6)
    await wait(`document.querySelector(${JSON.stringify(selector)})`)
    assert.match(
      await evaluate(`document.querySelector(${JSON.stringify(selector)}).textContent`),
      /HyperFrames/,
    )
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`)
    await key('Space')
    await wait('document.querySelector("[role=listbox]")')
    await key('End')
    await key('Return')
    await wait(
      `document.querySelector(${JSON.stringify(selector)}).textContent.includes('Remotion')`,
    )
    await wait('!document.querySelector("[role=listbox]")')
    window.webContents.reload()
    await wait('document.querySelector("main")')
    await openProject()
    await stage(6)
    await wait(
      `document.querySelector(${JSON.stringify(selector)}).textContent.includes('Remotion')`,
    )
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'))
        await evaluate(
          `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`,
        )
        await screenshot(`roughcut-${theme}-${width}`)
      }
    }
    window.setSize(1440, 1000)
    await click('制作 Remotion 视频')
    await wait(`document.querySelector(${JSON.stringify(selector)}).disabled`)
    await wait('document.querySelector("[data-job-state=succeeded]")')
    let result
    for (let attempt = 0; attempt < 100; attempt++) {
      result = await getProject()
      if (result.data.stages.roughcut.payload.renderEngine === 'remotion') break
      await delay(100)
    }
    assert.equal(result.data.stages.roughcut.payload.renderEngine, 'remotion')
    assert.equal(result.data.stages.roughcut.status, 'review')
    assert.equal(result.data.stages.roughcut.payload.renderProfile.quality, 'delivery')
    assert.ok(JSON.parse(readFileSync(invocationPath, 'utf8')).includes('18'))
    assert.equal(result.data.stages.roughcut.payload.nativeMaterials.length, 1)
    assert.equal(
      result.data.stages.roughcut.payload.nativeMaterials[0].role,
      '独立产品界面，保留原图内容',
    )
    assert.equal(
      result.data.stages.roughcut.payload.nativeMaterials[0].sceneId,
      storedMaterial.sceneId,
    )
    assert.equal(result.data.stages.audio.id, originalStages.audio.id)
    const firstNativeId = result.data.stages.roughcut.id
    const inspectionStages = result.data.stages
    await evaluate(
      `(() => { const button=[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='实际画面抽检'); if(!button) throw new Error('Missing actual video inspection entry'); button.focus(); })()`,
    )
    await key('Space')
    await wait('document.querySelector("[data-render-inspection]")')
    await wait(
      'document.querySelectorAll("[data-inspection-side=current] [data-inspection-frame]").length === 3',
    )
    assert.ok(
      await evaluate(
        'document.querySelector("[data-render-inspection]").textContent.includes("完整观看后人工审核")',
      ),
    )
    await evaluate('document.querySelector("button[role=combobox][aria-label=对照旧版]").focus()')
    await key('Space')
    await key('End')
    await key('Return')
    await wait(
      'document.querySelector("[data-inspection-side=previous]")?.textContent.includes("来源")',
    )
    await key('Tab')
    assert.ok(
      await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'),
    )
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        assert.ok(
          await evaluate(
            'document.querySelector("[role=dialog]").scrollWidth <= document.querySelector("[role=dialog]").clientWidth',
          ),
        )
        await screenshot(`inspection-${theme}-${width}`)
      }
    }
    window.webContents.setZoomFactor(2)
    await screenshot('inspection-dark-200')
    await key('Escape')
    await wait('!document.querySelector("[role=dialog]")')
    assert.equal(await evaluate('document.activeElement.textContent.trim()'), '实际画面抽检')
    window.webContents.setZoomFactor(1)
    window.setSize(1440, 1000)
    await click('实际画面抽检')
    await wait(
      'document.querySelectorAll("[data-inspection-side=current] [data-inspection-frame]").length === 3',
    )
    const seekTime = await evaluate(
      'Number(document.querySelectorAll("[data-inspection-side=current] [data-inspection-frame]")[1].dataset.time)',
    )
    await evaluate(
      'document.querySelectorAll("[data-inspection-side=current] [data-inspection-frame]")[1].click()',
    )
    await wait('!document.querySelector("[role=dialog]")')
    await wait(
      `Math.abs(document.querySelector('video[aria-label="视频制作预览"]').currentTime - ${seekTime}) < 0.05`,
    )
    assert.deepEqual((await getProject()).data.stages, inspectionStages)
    await click('制作 Remotion 视频')
    for (let attempt = 0; attempt < 200; attempt++) {
      result = await getProject()
      if (result.data.stages.roughcut.id !== firstNativeId) break
      await delay(100)
    }
    assert.notEqual(result.data.stages.roughcut.id, firstNativeId)
    await wait(
      `document.querySelector('video[aria-label="视频制作预览"]')?.src.includes(${JSON.stringify(result.data.stages.roughcut.payload.file.id)})`,
    )
    await click('实际画面抽检')
    await wait(
      'document.querySelectorAll("[data-inspection-side=current] [data-inspection-frame]").length === 3',
    )
    await evaluate('document.querySelector("button[role=combobox][aria-label=对照旧版]").focus()')
    await key('Space')
    await wait('document.querySelector("[role=listbox]")')
    await key('Home')
    await key('Down')
    await key('Return')
    await wait(
      'document.querySelectorAll("[data-inspection-side=previous] [data-inspection-frame]").length === 3',
    )
    assert.equal(
      await evaluate('document.querySelector("[data-inspection-side=previous]").dataset.revision'),
      firstNativeId,
    )
    await screenshot('inspection-valid-comparison')
    await key('Escape')
    await wait('!document.querySelector("[role=dialog]")')
    const inspectedVideoPath = join(root, result.data.stages.roughcut.payload.file.path)
    const inspectedBytes = readFileSync(inspectedVideoPath)
    writeFileSync(inspectedVideoPath, 'tampered inspected video')
    await click('实际画面抽检')
    await wait(
      'document.querySelector("[data-inspection-side=current]")?.textContent.includes("文件丢失或内容被修改")',
    )
    assert.equal(
      await evaluate(
        'document.querySelectorAll("[data-inspection-side=current] [data-inspection-frame]").length',
      ),
      0,
    )
    writeFileSync(inspectedVideoPath, inspectedBytes)
    await click('重试抽帧')
    await wait(
      'document.querySelectorAll("[data-inspection-side=current] [data-inspection-frame]").length === 3',
    )
    await click('前往原修改计划入口')
    await wait('!document.querySelector("[role=dialog]")')
    await wait(
      'document.getElementById("workflow-motion-plan")?.open && document.activeElement === document.querySelector("#workflow-motion-plan summary")',
    )
    const originalId = result.data.stages.roughcut.id
    writeFileSync(modePath, 'failure')
    await click('制作 Remotion 视频')
    await wait('document.querySelector("[data-job-state=failed]")')
    assert.equal((await getProject()).data.stages.roughcut.id, originalId)
    assert.ok(JSON.parse(readFileSync(invocationPath, 'utf8')).includes('--concurrency=1'))
    await click('审核通过此版本')
    await wait('document.querySelector("[role=dialog]")')
    await click('确认审核通过')
    await wait('!document.querySelector("[role=dialog]")')
    result = await getProject()
    assert.equal(result.data.stages.render.status, 'approved')
    assert.equal(
      result.data.stages.render.payload.file.id,
      result.data.stages.roughcut.payload.file.id,
    )
    assert.equal(
      result.data.jobs.some((job) => job.stage === 'render'),
      false,
    )
    assert.equal(
      await evaluate(
        '[...document.querySelectorAll("button")].some(b=>b.textContent.trim()==="渲染最终成片")',
      ),
      false,
    )
    await wait(
      'document.querySelector("button[aria-label=继续下一步]")?.textContent.includes("平台发布")',
    )
    await evaluate('document.querySelector("button[aria-label=继续下一步]").click()')
    await wait('document.querySelector("[data-workflow-stage=publish]")')
    await stage(6)
    assert.equal(
      await evaluate(
        `[...document.querySelectorAll('.workflow-inspector-item')].find(item => item.querySelector('span')?.textContent === '生成方式')?.querySelector('strong')?.textContent.trim()`,
      ),
      'Remotion',
    )
    assert.ok(await evaluate(`document.querySelector(${JSON.stringify(selector)})`))
    writeFileSync(modePath, 'success')
    assert.equal(result.data.stages.render.payload.renderEngine, 'remotion')
    assert.equal(result.data.stages.render.status, 'approved')
    assert.equal(
      await evaluate(`document.querySelector('.workflow-job-meta span')?.textContent`),
      'Remotion',
    )
    window.webContents.setZoomFactor(2)
    await evaluate('document.querySelector("[data-workflow-settings]").click()')
    await wait('document.querySelector("[role=dialog]")')
    await key('Tab')
    assert.ok(
      await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'),
    )
    assert.ok(
      await evaluate(
        `[...document.querySelectorAll('label')].some(label => label.textContent.includes('Remotion 4.0.541'))`,
      ),
    )
    await screenshot('settings-dark-200percent')
    await key('Escape')
    await wait('!document.querySelector("[role=dialog]")')
    await wait('document.activeElement.hasAttribute("data-workflow-settings")')
    window.webContents.setZoomFactor(1)
    window.webContents.debugger.attach('1.3')
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-motion', value: 'reduce' },
        { name: 'forced-colors', value: 'active' },
      ],
    })
    await stage(6)
    await wait(`document.querySelector(${JSON.stringify(selector)})`)
    await click('实际画面抽检')
    await wait(
      'document.querySelectorAll("[data-inspection-side=current] [data-inspection-frame]").length === 3',
    )
    await screenshot('inspection-forced-colors-reduced-motion')
    await key('Escape')
    await wait('!document.querySelector("[role=dialog]")')
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`)
    await key('Space')
    await wait('document.querySelector("[role=listbox]")')
    await key('Escape')
    await wait('!document.querySelector("[role=listbox]")')
    assert.ok(
      await evaluate(
        `document.activeElement === document.querySelector(${JSON.stringify(selector)})`,
      ),
    )
    await screenshot('roughcut-forced-colors-reduced-motion')
    const preservedStages = (await getProject()).data.stages
    await stage(3)
    await evaluate(
      `localStorage.setItem('video-workflow:native-materials:${seedProject.id}', '{broken')`,
    )
    await click('创作设置')
    await wait(
      '[...document.querySelectorAll("button")].some(button => button.textContent.trim() === "重置为空素材草稿")',
    )
    await evaluate('document.querySelector("[data-native-materials] summary").click()')
    await click('重置为空素材草稿')
    await click('检查素材')
    await wait('document.querySelector("[data-native-materials]").textContent.includes("检查通过")')
    assert.equal(await evaluate('document.querySelectorAll("[data-native-material]").length'), 0)
    assert.deepEqual((await getProject()).data.stages, preservedStages)
    await key('Escape')
    await wait('!document.querySelector("[role=dialog]")')
    window.webContents.debugger.detach()
    console.log(
      'PASS native materials; actual video frame inspection, old-version comparison, missing-source and tamper errors, retry, seeking, original modification entry, read-only preservation; keyboard, themes, widths, 200%, forced colors/reduced motion; Remotion rendering and final engine routing',
    )
    console.log('Synthetic screenshots:', screens)
    app.exit(0)
  } catch (error) {
    console.error(error)
    if (window) await screenshot('failure')
    app.exit(1)
  } finally {
    clearTimeout(deadline)
  }
})
