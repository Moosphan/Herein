const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const Database = require('better-sqlite3')
const assert = require('node:assert/strict')
const { mkdtempSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { randomUUID } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const { setTimeout: delay } = require('node:timers/promises')

const root = mkdtempSync(join(tmpdir(), 'workflow-audio-controls-'))
process.env.MYDASHBOARD_USER_DATA = root
console.log('UI artifacts:', root)
const source = join(root, 'voice.wav')
execFileSync('/opt/homebrew/bin/ffmpeg', [
  '-v',
  'error',
  '-f',
  'lavfi',
  '-i',
  'sine=frequency=440:duration=3',
  '-ar',
  '48000',
  source,
])
dialog.showOpenDialog = async (_window, options) => ({
  canceled: false,
  filePaths: options.properties.includes('multiSelections') ? [source, source] : [source],
})
const originalHandle = ipcMain.handle.bind(ipcMain)
let captured
ipcMain.handle = (channel, listener) =>
  originalHandle(channel, (event, ...args) => {
    if (channel === 'workflow:generate' && (args[0]?.audioTrackId || args[0]?.audioTrackIds)) {
      captured = args[0]
      return { success: false, error: '测试生成失败，旧配音已保留' }
    }
    return listener(event, ...args)
  })
require('../out/main/index.js')

const testDeadline = setTimeout(() => {
  console.error('UI test exceeded deadline', root)
  app.exit(1)
}, 120000)
app.whenReady().then(async () => {
  let window
  const evaluate = async (source) => {
    try {
      return await window.webContents.executeJavaScript(source, true)
    } catch (error) {
      console.error('EVALUATE_FAILED', source, error)
      throw error
    }
  }
  const waitFor = async (source, label) => {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (await evaluate(`Boolean(${source})`)) return
      await delay(100)
    }
    throw new Error(`Timed out: ${label}`)
  }
  const invoke = async (channel, ...args) => {
    const response = await evaluate(
      `window.electronAPI.invoke(${[channel, ...args].map((value) => JSON.stringify(value)).join(',')})`,
    )
    assert.equal(response.success, true, response.error)
    return response.data
  }
  const click = async (label) => {
    assert.ok(
      await evaluate(
        `(()=>{const item=[...document.querySelectorAll('button')].find(item=>item.textContent.trim()===${JSON.stringify(label)}||item.getAttribute('aria-label')===${JSON.stringify(label)});if(!item||item.disabled)return false;item.click();return true})()`,
      ),
      label,
    )
    await delay(100)
  }
  const key = async (keyCode) => {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode })
    await delay(100)
  }
  const field = (label) =>
    `(()=>{const label=[...document.querySelectorAll('label')].find(item=>item.textContent.trim()===${JSON.stringify(label)});return label&&document.getElementById(label.htmlFor)})()`
  const screenshot = async (name) => {
    window.show()
    window.focus()
    await delay(350)
    window.webContents.invalidate()
    await delay(150)
    if (!name.startsWith('audio-correction')) {
      writeFileSync(join(root, name + '.png'), (await window.webContents.capturePage()).toPNG())
      return
    }
    const attached = window.webContents.debugger.isAttached()
    if (!attached) window.webContents.debugger.attach('1.3')
    try {
      let deadline
      const image = await Promise.race([
        window.webContents.debugger.sendCommand('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true,
          captureBeyondViewport: false,
        }),
        new Promise((_, reject) => {
          deadline = setTimeout(() => reject(new Error('Screenshot timed out: ' + name)), 8000)
        }),
      ]).finally(() => clearTimeout(deadline))
      writeFileSync(join(root, name + '.png'), Buffer.from(image.data, 'base64'))
    } finally {
      if (!attached) window.webContents.debugger.detach()
    }
  }
  try {
    for (let attempt = 0; attempt < 120; attempt++) {
      window = BrowserWindow.getAllWindows().find((item) =>
        item.webContents.getURL().startsWith('file:'),
      )
      if (window && !window.webContents.isLoadingMainFrame()) break
      await delay(100)
    }
    assert.ok(window)
    window.setMinimumSize(720, 640)
    window.setSize(1440, 1100)
    let project = await invoke('workflow:create', '配音参数和单段重生成验证')
    const payloads = {
      brief: { text: '验证单段配音', duration: 10 },
      copy: { text: '第一镜。第二镜。' },
      storyboard: {
        mode: 'template',
        template: 'technical',
        scenes: [
          { id: 'one', title: '第一镜', body: '第一镜说明', layout: 'title' },
          { id: 'two', title: '第二镜', body: '第二镜说明', layout: 'title' },
        ],
      },
      narration: {
        scenes: [
          { id: 'one', text: '第一镜口播。' },
          { id: 'two', text: '第二镜口播。' },
        ],
      },
    }
    for (const stage of ['brief', 'copy', 'storyboard', 'narration']) {
      project = await invoke(
        'workflow:save',
        project.id,
        stage,
        payloads[stage],
        project.revision,
        randomUUID(),
      )
      project = await invoke(
        'workflow:approve',
        project.id,
        stage,
        project.stages[stage].id,
        project.revision,
        randomUUID(),
        '',
      )
    }
    const draft = await invoke('tts:importReference')
    const profile = await invoke('tts:saveProfile', {
      draftId: draft.id,
      name: '验证女声音色',
      transcript: '验证参考录音。',
      start: 0,
      end: 3,
    })
    const job = await invoke('workflow:importAudio', {
      projectId: project.id,
      expectedRevision: project.revision,
      requestId: randomUUID(),
    })
    for (let attempt = 0; attempt < 120; attempt++) {
      project = await invoke('workflow:get', project.id)
      if (project.jobs.find((item) => item.id === job.id)?.state !== 'running') break
      await delay(100)
    }
    assert.equal(project.jobs.find((item) => item.id === job.id)?.state, 'succeeded')
    const secondJob = await invoke('workflow:importAudio', {
      projectId: project.id,
      stage: 'audio',
      expectedRevision: project.revision,
      requestId: randomUUID(),
      executor: 'template',
    })
    for (let attempt = 0; attempt < 120; attempt++) {
      project = await invoke('workflow:get', project.id)
      if (project.jobs.find((item) => item.id === secondJob.id)?.state !== 'running') break
      await delay(100)
    }
    assert.equal(project.jobs.find((item) => item.id === secondJob.id)?.state, 'succeeded')
    assert.equal((await invoke('workflow:history', project.id, 'audio')).items.length, 2)
    await evaluate(`location.hash='/video'`)
    await waitFor('document.querySelector(".workflow-project-card")', 'project list')
    await click('继续创作')
    await waitFor(
      'document.querySelectorAll(".workflow-audio-row").length===2',
      'two playable segments',
    )
    await waitFor(
      'document.querySelector("[data-audio-version-selector]")',
      'audio version selector',
    )
    await click('分段配音版本')
    await waitFor(
      '[...document.querySelectorAll("[role=option]")].some(item=>item.textContent.includes("历史 v1"))',
      'historical audio version option',
    )
    await evaluate(
      '[...document.querySelectorAll("[role=option]")].find(item=>item.textContent.includes("历史 v1")).click()',
    )
    await waitFor(
      'document.body.textContent.includes("切换为当前版本")',
      'restore audio version action',
    )
    assert.ok(await evaluate('document.body.textContent.includes("生成于")'))
    await waitFor(
      '[...document.querySelectorAll("button")].some(item=>item.textContent.trim()==="切换为当前版本"&&!item.disabled)',
      'historical audio source loaded',
    )
    await click('切换为当前版本')
    await waitFor(
      'document.body.textContent.includes("已切换分段配音版本")',
      'restored audio version',
    )
    project = await invoke('workflow:get', project.id)
    assert.ok(await evaluate('document.querySelector(".workflow-audio-row audio").controls'))
    await waitFor('document.querySelector("[data-audio-track-menu]")', 'segment menu')
    await evaluate('document.querySelector("[data-audio-track-menu]").focus()')
    window.focus()
    await key('Space')
    await waitFor('document.querySelector("[role=menuitem]")', 'keyboard opens menu')
    assert.ok(
      await evaluate(
        '[...document.querySelectorAll("[role=menuitem]")].some(item=>item.textContent.includes("重新生成此段配音"))',
      ),
    )
    await key('Escape')
    assert.ok(await evaluate('document.activeElement.matches("[data-audio-track-menu]")'))
    await evaluate('document.querySelector("details.workflow-notice").open=true')
    await click('配音引擎')
    await evaluate(
      '[...document.querySelectorAll("[role=option]")].find(item=>item.textContent.includes("VoxCPM2")).click()',
    )
    await click('已保存参考音色（冻结版本）')
    await evaluate('document.querySelector("[role=option]").click()')
    await waitFor(`${field('参考尾部停顿（毫秒）')}?.value==='320'`, 'default pause')
    await evaluate(
      `(()=>{const input=${field('参考尾部停顿（毫秒）')};Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'500');input.dispatchEvent(new Event('input',{bubbles:true}))})()`,
    )
    await evaluate(
      'window.__unchangedPlayer=document.querySelectorAll(".workflow-audio-row audio")[1]',
    )
    await evaluate('document.querySelector("[data-audio-track-menu]").focus()')
    await key('Space')
    await key('End')
    await key('Enter')
    await waitFor(
      'document.body.textContent.includes("测试生成失败，旧配音已保留")',
      'failure keeps audio',
    )
    assert.equal(captured.audioTrackId, project.stages.audio.payload.tracks[0].file.id)
    assert.equal(captured.voice.engine, 'voxcpm2')
    assert.equal(captured.voice.profileId, profile.id)
    assert.equal(captured.voice.options.promptPauseMs, 500)
    assert.ok(
      await evaluate(
        'window.__unchangedPlayer===document.querySelectorAll(".workflow-audio-row audio")[1]',
      ),
    )
    const openCorrection = async (index = 0) => {
      await evaluate(`document.querySelectorAll("[data-audio-track-menu]")[${index}].focus()`)
      await key('Space')
      await key('Home')
      await key('Down')
      await key('Enter')
      await waitFor('document.querySelector("[role=dialog] textarea")', 'correction dialog')
    }
    await openCorrection()
    assert.ok(
      await evaluate(
        '[...document.querySelectorAll("[role=dialog] button")].find(item=>item.textContent.startsWith("按意见重新生成")).disabled',
      ),
    )
    const feedback = 'KSP 按字母读，toJson 拆开读，每句话完整收尾，句间停顿稍长。'
    await evaluate(
      `(()=>{const field=document.querySelector('[role=dialog] textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(field,${JSON.stringify(feedback)});field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();field.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));field.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true}));field.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}))})()`,
    )
    await key('Escape')
    assert.ok(await evaluate('document.activeElement.matches("[data-audio-track-menu]")'))
    await openCorrection()
    assert.equal(await evaluate('document.querySelector("[role=dialog] textarea").value'), feedback)
    await click('按意见重新生成')
    await waitFor(
      'document.querySelector("[role=dialog] [role=alert]")?.textContent.includes("测试生成失败")',
      'correction failure retains draft',
    )
    assert.equal(captured.audioFeedback, feedback)
    assert.equal(captured.agentExecutor, 'codex')
    assert.equal(captured.audioTrackId, project.stages.audio.payload.tracks[0].file.id)
    assert.equal(await evaluate('document.querySelector("[role=dialog] textarea").value'), feedback)
    await evaluate(
      '[...document.querySelectorAll("fieldset button")].find(item=>item.textContent.includes("2 · 第二镜")).click()',
    )
    await click('按意见重新生成 2 段')
    await waitFor(
      'document.querySelector("[role=dialog] [role=alert]")?.textContent.includes("测试生成失败")',
      'batch submission failure retains input',
    )
    assert.deepEqual(
      captured.audioTrackIds,
      project.stages.audio.payload.tracks.map((track) => track.file.id),
    )
    assert.equal(captured.audioTrackId, undefined)
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark',${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        await screenshot(`audio-correction-${theme}-${width}`)
        assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
      }
      window.setSize(1440, 900)
      window.webContents.setZoomFactor(2)
      await evaluate(
        '[...document.querySelectorAll("[role=dialog] button")].find(item=>item.textContent.startsWith("按意见重新生成")).focus();document.activeElement.scrollIntoView({block:"center"})',
      )
      await key('Tab')
      assert.ok(
        await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'),
      )
      await screenshot(`audio-correction-${theme}-200percent`)
      window.webContents.setZoomFactor(1)
    }
    window.webContents.debugger.attach('1.3')
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-motion', value: 'reduce' },
        { name: 'forced-colors', value: 'active' },
      ],
    })
    await screenshot('audio-correction-reduced-high-contrast')
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', { features: [] })
    window.webContents.debugger.detach()
    await key('Escape')
    assert.ok(await evaluate('document.activeElement.matches("[data-audio-track-menu]")'))
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark',${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        await evaluate(
          'document.querySelector("[data-audio-track-menu]").scrollIntoView({block:"center"});document.querySelector("[data-audio-track-menu]").focus()',
        )
        await key('Space')
        await waitFor('document.querySelector("[role=menu]")', 'visible segment menu')
        assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        await screenshot(`audio-menu-${theme}-${width}`)
        await key('Escape')
      }
      window.setSize(1440, 1100)
      window.webContents.setZoomFactor(2)
      await evaluate(
        'document.querySelector("[data-audio-track-menu]").scrollIntoView({block:"center"});document.querySelector("[data-audio-track-menu]").focus()',
      )
      await key('Space')
      await screenshot(`audio-menu-${theme}-zoom200`)
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
      await key('Escape')
      window.webContents.setZoomFactor(1)
      await evaluate(`${field('参考尾部停顿（毫秒）')}.scrollIntoView({block:'center'})`)
      await screenshot(`audio-pause-${theme}`)
    }
    const fixture = new Database(join(root, 'database/dashboard.db'))
    const queuedId = randomUUID()
    const now = new Date().toISOString()
    fixture
      .prepare(
        'INSERT INTO video_workflow_jobs(id,project_id,stage,request_id,expected_revision,executor,input_fingerprint,state,phase,created_at,updated_at,operation) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .run(
        queuedId,
        project.id,
        'audio',
        queuedId,
        project.revision,
        'codex',
        '',
        'running',
        '正在按意见修改第一段',
        now,
        now,
        JSON.stringify({
          action: 'regenerate-audio',
          audioTrackId: project.stages.audio.payload.tracks[0].file.id,
          audioTrackIds: [project.stages.audio.payload.tracks[0].file.id],
          audioTrackNumbers: [1],
          feedback: '第一段纠音',
        }),
      )
    window.webContents.send('workflow:updated', project.id)
    await waitFor(
      'document.querySelector("[data-audio-modification-queue]")',
      'active audio correction queue',
    )
    await openCorrection(1)
    assert.equal(
      await evaluate('document.querySelectorAll("[role=dialog] fieldset button")[0].disabled'),
      true,
      'active track is locked separately',
    )
    assert.equal(
      await evaluate('document.querySelectorAll("[role=dialog] fieldset button")[1].disabled'),
      false,
      'other tracks remain editable while generation runs',
    )
    await evaluate(
      `(()=>{const field=document.querySelector('[role=dialog] textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(field,'第二段 JSON 按字母读');field.dispatchEvent(new Event('input',{bubbles:true}))})()`,
    )
    await click('按意见重新生成')
    await waitFor(
      'document.querySelector("[role=dialog] [role=alert]")',
      'other track can submit during active generation',
    )
    assert.equal(captured.audioTrackId, project.stages.audio.payload.tracks[1].file.id)
    assert.equal(captured.audioFeedback, '第二段 JSON 按字母读')
    await screenshot('audio-correction-queue')
    await key('Escape')
    fixture.prepare('DELETE FROM video_workflow_jobs WHERE id=?').run(queuedId)
    fixture.close()
    window.webContents.send('workflow:updated', project.id)
    await waitFor(
      '!document.querySelector("[data-audio-modification-queue]")',
      'queue fixture removed',
    )
    await click('打开配音工具')
    await waitFor('document.querySelector("[role=dialog]")', 'voiceover dialog')
    await evaluate(
      '[...document.querySelectorAll("label")].find(item=>item.textContent.trim()==="声音克隆").click()',
    )
    await evaluate(
      '[...document.querySelectorAll("summary")].find(item=>item.textContent.trim()==="高级参数").parentElement.open=true',
    )
    await waitFor(
      `(()=>{const label=[...document.querySelectorAll('[role=dialog] label')].find(item=>item.textContent.trim()==='参考尾部停顿（毫秒）');return label&&document.getElementById(label.htmlFor)?.value==='320'})()`,
      'voiceover pause field',
    )
    await screenshot('voiceover-pause-dark')
    console.log(
      'PASS: feedback reaches single-track request, IME/keyboard/Escape, input and player retention, native controls, light/dark, 1440/1024/200%, reduced motion/high contrast',
    )
    clearTimeout(testDeadline)
    app.exit(0)
  } catch (error) {
    console.error(error)
    app.exit(1)
  }
})
