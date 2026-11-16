const { app, BrowserWindow, dialog, nativeImage, shell } = require('electron')
const assert = require('node:assert/strict')
const { mkdtempSync, writeFileSync, readFileSync } = require('node:fs')
const { join } = require('node:path')
const { tmpdir } = require('node:os')
const { spawnSync } = require('node:child_process')
const { setTimeout: delay } = require('node:timers/promises')

const root = mkdtempSync(join(tmpdir(), 'publication-cover-ui-'))
const revealed = []
shell.showItemInFolder = path => revealed.push(path)
const node = spawnSync('which', ['node'], { encoding: 'utf8' }).stdout.trim()
const seed = spawnSync(process.execPath, ['--import', 'tsx', join(__dirname, 'seed-bilibili-publishing.ts'), root, node], {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8',
})
assert.equal(seed.status, 0, seed.stderr)
process.env.MYDASHBOARD_USER_DATA = root
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [root] })
const initial = JSON.parse(readFileSync(join(root, 'seed-project.json'), 'utf8'))
require('../out/main/index.js')

app.whenReady().then(async () => {
  let window
  const evaluate = source => window.webContents.executeJavaScript(source, true)
  const waitFor = async (source, label) => {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (await evaluate(`Boolean(${source})`)) return
      await delay(100)
    }
    throw new Error(`Timed out: ${label}`)
  }
  const click = async name => {
    assert.ok(await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find(item =>
        (item.textContent.trim() === ${JSON.stringify(name)} || item.getAttribute('aria-label') === ${JSON.stringify(name)}) && !item.disabled)
      if (!button) return false
      button.click(); return true
    })()`), name)
    await delay(150)
  }
  const call = async (action, ...args) => {
    const result = await evaluate(`window.electronAPI.invoke(${JSON.stringify(`workflow:${action}`)}, ...${JSON.stringify(args)})`)
    assert.equal(result.success, true, result.error)
    return result.data
  }
  const key = async keyCode => {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode })
    await delay(120)
  }
  const screenshot = async name => {
    await evaluate('document.querySelector("[role=dialog], [data-publication-cover]").scrollIntoView({block:"center"})')
    await delay(100)
    writeFileSync(join(root, name), (await window.webContents.capturePage()).toPNG())
  }
  const completed = async () => {
    let project
    for (let attempt = 0; attempt < 200; attempt++) {
      project = await call('get', initial.id)
      if (!project.jobs.some(job => job.state === 'running')) return project
      await delay(100)
    }
    throw new Error('Cover task did not complete')
  }
  try {
    for (let attempt = 0; attempt < 120; attempt++) {
      window = BrowserWindow.getAllWindows().find(item => item.webContents.getURL().startsWith('file:'))
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
    await waitFor('document.querySelector("[data-cover-source]")?.textContent.includes("成片截帧")', 'original source label')
    await screenshot('cover-original-light-1440.png')
    await click('放大预览封面')
    assert.equal(await evaluate('document.querySelectorAll("[role=dialog] input[type=radio]").length'), 3)
    for (const [ratio, expected] of [['feed', 4 / 3], ['landscape', 16 / 9], ['portrait', 9 / 16]]) {
      await evaluate(`document.querySelector('[role=dialog] input[value=${ratio}]').click()`)
      const actual = await evaluate(`(() => {const rect=document.querySelector('.workflow-cover-preview').getBoundingClientRect();return rect.width/rect.height})()`)
      assert.ok(Math.abs(actual - expected) < 0.02, `${ratio}: ${actual}`)
      await click('打开预览封面所在文件夹')
      assert.equal(revealed.at(-1), join(root, initial.stages.render.payload.cover.path))
    }
    await key('Escape')
    await click('打开封面所在文件夹')
    assert.equal(revealed.at(-1), join(root, initial.stages.render.payload.cover.path))
    assert.equal(await evaluate('document.querySelector("[data-publication-cover] textarea")'), null)
    await click('AI 生成封面')
    await waitFor('document.querySelector("[role=dialog] textarea")', 'cover generation dialog')
    assert.equal((await call('get', initial.id)).jobs.length, initial.jobs.length)
    await evaluate(`(() => {
      const field = document.querySelector('[role=dialog] textarea')
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(field, '保留当前风格')
      field.dispatchEvent(new Event('input', {bubbles:true}))
    })()`)
    await key('Escape')
    assert.equal(await evaluate('document.activeElement.hasAttribute("data-cover-generate")'), true)
    await click('AI 生成封面')
    assert.equal(await evaluate('document.querySelector("[role=dialog] textarea").value'), '保留当前风格')
    const runtime = await call('runtime')
    await call('configure', { ...runtime, codexPath: '' })
    await evaluate('document.querySelector("[role=dialog] input[value=image2]").click()')
    await click('开始生成封面')
    await waitFor('document.querySelector("[role=dialog] [role=alert]")?.textContent.includes("未能启动")', 'launch error keeps dialog')
    assert.ok(await evaluate('document.body.textContent.includes("请在执行环境配置已登录且支持原生图片生成的 Codex CLI")'))
    assert.equal((await call('get', initial.id)).jobs.length, initial.jobs.length)
    assert.equal(await evaluate('document.querySelector("[role=dialog] textarea").value'), '保留当前风格')
    await call('configure', { ...runtime, bunPath: '', image2Path: '' })
    await evaluate('document.querySelector("[role=dialog] input[value=code]").click()')
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        await screenshot(`cover-generation-${theme}-${width}.png`)
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'))
      }
    }
    window.webContents.setZoomFactor(2)
    await screenshot('cover-generation-200percent.png')
    await key('Tab')
    assert.ok(await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'))
    window.webContents.setZoomFactor(1)
    window.setSize(1440, 1100)
    await evaluate('document.documentElement.classList.remove("dark")')
    await click('开始生成封面')
    let project = await completed()
    await waitFor('!document.querySelector("[role=dialog]")', 'generation accepted')
    assert.equal(project.jobs[0].state, 'succeeded', project.jobs[0].error)
    assert.equal(project.jobs[0].operation.action, 'generate-cover')
    const first = project.stages.publish.payload.platforms.bilibili.cover
    assert.equal(first.method, 'code')
    assert.equal(first.sourceRenderId, initial.stages.render.id)
    assert.ok(first.designFile)
    assert.equal(project.stages.publish.status, 'review')
    for (const [file, height] of [[first.file, 900], [first.feedFile, 1200]]) {
      assert.deepEqual(nativeImage.createFromPath(join(root, file.path)).getSize(), { width: 1600, height })
      assert.ok(file.size <= 4 * 1024 * 1024)
    }
    const prompt = readFileSync(join(root, 'cover-prompt.txt'), 'utf8')
    assert.ok(prompt.includes('审核文案') && prompt.includes('font-family') && prompt.includes('内容要饱满'))
    for (const stage of ['brief', 'copy', 'storyboard', 'narration', 'audio', 'roughcut', 'render'])
      assert.equal(project.stages[stage].id, initial.stages[stage].id)
    assert.deepEqual(project.stages.publish.payload.platforms.douyin, initial.stages.publish.payload.platforms.douyin)
    await waitFor('document.querySelector("[data-cover-generate]")?.textContent.includes("重新生成")', 'cover applied')
    await waitFor('document.querySelector("[data-cover-source]")?.textContent.includes("独立封面")', 'generated source label')
    await click('打开封面所在文件夹')
    assert.equal(revealed.at(-1), join(root, first.feedFile.path))
    await click('放大预览封面')
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`)
      for (const ratio of ['feed', 'landscape']) {
        await evaluate(`document.querySelector('[role=dialog] input[value=${ratio}]').click()`)
        await waitFor('document.querySelector(".workflow-cover-preview")?.complete', 'preview ready')
        const dimensions = await evaluate('(() => {const image=document.querySelector(".workflow-cover-preview");const rect=image.getBoundingClientRect();return {width:image.naturalWidth,height:image.naturalHeight,ratio:rect.width/rect.height}})()')
        assert.equal(dimensions.width, 1600)
        assert.equal(dimensions.height, ratio === 'feed' ? 1200 : 900)
        assert.ok(Math.abs(dimensions.ratio - (ratio === 'feed' ? 4 / 3 : 16 / 9)) < 0.02)
        await click('打开预览封面所在文件夹')
        assert.equal(revealed.at(-1), join(root, (ratio === 'feed' ? first.feedFile : first.file).path))
        for (const width of [1440, 1024]) {
          window.setSize(width, 1000)
          await screenshot(`cover-preview-${theme}-${ratio}-${width}.png`)
          assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'))
        }
      }
    }
    window.webContents.setZoomFactor(2)
    await screenshot('cover-preview-200percent.png')
    await key('Tab')
    assert.ok(await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'))
    await key('Escape')
    assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'), '放大预览封面')
    window.webContents.setZoomFactor(1)
    window.setSize(1440, 1100)
    await evaluate('document.documentElement.classList.remove("dark")')
    writeFileSync(join(root, 'cover-mode'), 'v2')
    const options = { method: 'code', feedback: '标题更醒目，保留奶油色背景' }
    await click('重新生成封面')
    await evaluate(`(() => {
      const field = document.querySelector('[role=dialog] textarea')
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(field, ${JSON.stringify(options.feedback)})
      field.dispatchEvent(new Event('input', {bubbles:true}))
    })()`)
    await click('开始生成封面')
    project = await completed()
    const second = project.stages.publish.payload.platforms.bilibili.cover
    assert.notEqual(first.file.sha256, second.file.sha256)
    assert.equal(second.feedback, options.feedback)
    assert.ok(readFileSync(join(root, 'cover-prompt.txt'), 'utf8').includes(options.feedback))
    assert.ok(readFileSync(join(root, 'cover-prompt.txt'), 'utf8').includes('一份内容，两种封面'))
    writeFileSync(join(root, 'cover-mode'), 'api-error')
    await call('generate', { projectId: initial.id, stage: 'publish', executor: 'codex', expectedRevision: project.revision, requestId: 'image2-api-error', cover: { method: 'image2' } })
    project = await completed()
    assert.equal(project.jobs[0].state, 'failed')
    assert.match(project.jobs[0].error, /HTTP 503 upstream unavailable/)
    for (const secret of ['test-private-token', 'test-private-key', 'sk-exampleSensitiveCredential12345'])
      assert.ok(!project.jobs[0].error.includes(secret))
    assert.equal(project.stages.publish.payload.platforms.bilibili.cover.file.id, second.file.id)
    for (const method of ['code', 'image2']) {
      writeFileSync(join(root, 'cover-mode'), 'invalid')
      await call('generate', { projectId: initial.id, stage: 'publish', executor: 'codex', expectedRevision: project.revision, requestId: `invalid-${method}`, cover: { method } })
      project = await completed()
      assert.equal(project.jobs[0].state, 'failed')
      assert.equal(project.stages.publish.payload.platforms.bilibili.cover.file.id, second.file.id)
    }
    writeFileSync(join(root, 'cover-mode'), 'slow')
    const slow = await call('generate', { projectId: initial.id, stage: 'publish', executor: 'codex', expectedRevision: project.revision, requestId: 'cancel-cover', cover: { method: 'code' } })
    await call('cancel', slow.id)
    project = await completed()
    assert.equal(project.jobs[0].state, 'cancelled')
    assert.equal(project.stages.publish.payload.platforms.bilibili.cover.file.id, second.file.id)
    writeFileSync(join(root, 'cover-mode'), '')
    await call('generate', { projectId: initial.id, stage: 'publish', executor: 'codex', expectedRevision: project.revision, requestId: 'image2-cover', cover: { method: 'image2', feedback: '中文标题居中安全区' } })
    project = await completed()
    assert.equal(project.jobs[0].state, 'succeeded', project.jobs[0].error)
    assert.equal(project.jobs[0].executor, 'codex')
    const image2 = project.stages.publish.payload.platforms.bilibili.cover
    assert.equal(image2.method, 'image2')
    const imageArgs = JSON.parse(readFileSync(join(root, 'cover-image-args.json'), 'utf8'))
    assert.ok(imageArgs.includes('image_generation'))
    assert.equal(imageArgs[imageArgs.indexOf('--sandbox') + 1], 'workspace-write')
    const task = JSON.parse(readFileSync(join(root, 'cover-image-task.json'), 'utf8'))
    assert.deepEqual([task.width, task.height], [1600, 1200])
    assert.deepEqual(nativeImage.createFromPath(join(root, image2.file.path)).getSize(), { width: 1600, height: 900 })
    writeFileSync(join(root, 'cover-mode'), 'jpeg')
    await call('generate', {
      projectId: initial.id,
      stage: 'publish',
      executor: 'codex',
      expectedRevision: project.revision,
      requestId: 'image2-jpeg-cover',
      cover: { method: 'image2' },
    })
    project = await completed()
    assert.equal(project.jobs[0].state, 'succeeded', project.jobs[0].error)
    assert.deepEqual(
      nativeImage.createFromPath(
        join(root, project.stages.publish.payload.platforms.bilibili.cover.feedFile.path),
      ).getSize(),
      { width: 1600, height: 1200 },
    )
    writeFileSync(join(root, 'cover-mode'), 'tool-unavailable')
    const unavailableBase = project.stages.publish.id
    await call('generate', { projectId: initial.id, stage: 'publish', executor: 'codex', expectedRevision: project.revision, requestId: 'unavailable-native-image-tool', cover: { method: 'image2' } })
    project = await completed()
    assert.equal(project.jobs[0].state, 'failed')
    assert.match(project.jobs[0].error, /image_generation/)
    assert.equal(project.stages.publish.id, unavailableBase)
    writeFileSync(join(root, 'cover-mode'), '')
    await waitFor('document.querySelector("[data-cover-status]")?.textContent.includes("已纳入")', 'image2 applied')
    await evaluate('document.querySelector("button[aria-label=封面历史版本]").focus()')
    await key('Space')
    await waitFor('document.querySelector("[role=listbox]")', 'cover history opens')
    await key('End')
    await key('Enter')
    await click('使用此封面')
    await click('保存草稿')
    await click('确认保存新版本')
    await waitFor('!document.querySelector("[role=dialog]")', 'cover switch saved')
    project = await call('get', initial.id)
    assert.equal(project.stages.publish.payload.platforms.bilibili.cover.file.id, first.file.id)
    assert.equal(project.stages.publish.status, 'review')
    const wrongSource = structuredClone(project.stages.publish.payload)
    wrongSource.platforms.bilibili.cover.sourceRenderId = 'wrong-render'
    const rejected = await evaluate(`window.electronAPI.invoke('workflow:save',${JSON.stringify(initial.id)},'publish',${JSON.stringify(wrongSource)},${project.revision},'wrong-source')`)
    assert.equal(rejected.success, false)
    assert.match(rejected.error, /成片已变化/)
    await call('approve', project.id, 'publish', project.stages.publish.id, project.revision, 'approve-cover', '')
    const exported = await call('export', project.id, 'bilibili')
    assert.deepEqual(readFileSync(join(exported, 'cover.png')), readFileSync(join(root, first.file.path)))
    assert.deepEqual(readFileSync(join(exported, 'cover-4x3.png')), readFileSync(join(root, first.feedFile.path)))
    project = await call('get', project.id)
    writeFileSync(join(root, 'mode'), '')
    await call('bilibiliConnection')
    const submission = await call('bilibiliPublish', { projectId: project.id, expectedRevision: project.revision, requestId: 'cover-upload', accountUid: '123', category: '17', visibility: 'public', copyright: 'original', source: '' })
    assert.equal(submission.snapshot.cover.id, first.file.id)
    await waitFor('document.querySelector("[data-bilibili-submission=reviewing]")', 'selected cover uploaded')
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        await screenshot(`cover-panel-${theme}-${width}.png`)
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'))
        assert.ok(await evaluate(`(() => {
          const section = document.querySelector('[data-publication-cover]')
          const right = section.getBoundingClientRect().right
          return [...section.querySelectorAll('.workflow-cover-summary p, .workflow-cover-summary button')]
            .every(element => element.getBoundingClientRect().right <= right + 1)
        })()`), `cover content stays in main column: ${theme} ${width}`)
      }
    }
    window.webContents.setZoomFactor(2)
    await screenshot('cover-panel-200percent.png')
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'))
    window.webContents.setZoomFactor(1)
    window.setSize(1440, 1100)
    project = await call('get', initial.id)
    const beforePortrait = structuredClone(project.stages.publish.payload.platforms.douyin)
    await click('重新生成封面')
    await waitFor(
      'document.querySelector("[role=dialog] input[value=portrait]")',
      'portrait generation choice',
    )
    await evaluate('document.querySelector("[role=dialog] input[value=portrait]").click()')
    await screenshot('cover-portrait-generation.png')
    await click('开始生成封面')
    project = await completed()
    assert.equal(project.jobs[0].state, 'succeeded', project.jobs[0].error)
    const triple = project.stages.publish.payload.platforms.bilibili.cover
    assert.ok(triple.portraitFile, 'Bilibili cover set includes 9:16')
    assert.deepEqual(nativeImage.createFromPath(join(root, triple.portraitFile.path)).getSize(), {
      width: 1080,
      height: 1920,
    })
    assert.deepEqual(project.stages.publish.payload.platforms.douyin, beforePortrait)
    await click('放大预览封面')
    await waitFor(
      'document.querySelector("[role=dialog] input[value=portrait]")',
      'portrait preview option',
    )
    await evaluate('document.querySelector("[role=dialog] input[value=portrait]").click()')
    const portraitAspect = await evaluate(
      '(()=>{const box=document.querySelector(".workflow-cover-preview").getBoundingClientRect();return box.width/box.height})()',
    )
    assert.ok(Math.abs(portraitAspect - 9 / 16) < 0.01)
    await click('打开预览封面所在文件夹')
    assert.equal(revealed.at(-1), join(root, triple.portraitFile.path))
    await screenshot('cover-portrait-preview.png')
    await key('Escape')
    await call(
      'approve',
      project.id,
      'publish',
      project.stages.publish.id,
      project.revision,
      'approve-portrait-cover',
      '',
    )
    const portraitExport = await call('export', project.id, 'bilibili')
    assert.deepEqual(
      readFileSync(join(portraitExport, 'cover-9x16.png')),
      readFileSync(join(root, triple.portraitFile.path)),
    )
    assert.deepEqual(
      readFileSync(join(portraitExport, 'cover.png')),
      readFileSync(join(root, triple.file.path)),
    )
    await evaluate('document.querySelector("input[type=radio][value=douyin]").click()')
    await click('AI 生成封面')
    await waitFor('document.querySelector("[role=dialog] textarea")', 'Douyin AI generation')
    await click('开始生成封面')
    project = await completed()
    const dyPortrait = project.stages.publish.payload.platforms.douyin.cover
    assert.equal(project.jobs[0].state, 'succeeded', project.jobs[0].error)
    assert.equal(dyPortrait.platform, 'douyin')
    assert.deepEqual([dyPortrait.width, dyPortrait.height], [1080, 1920])
    assert.deepEqual(project.stages.publish.payload.platforms.bilibili.cover, triple)
    assert.deepEqual(nativeImage.createFromPath(join(root, dyPortrait.file.path)).getSize(), {
      width: 1080,
      height: 1920,
    })
    writeFileSync(
      join(root, 'cover-portrait-source.png'),
      nativeImage
        .createFromPath(join(root, 'cover-source.png'))
        .resize({ width: 1080, height: 1920 })
        .toPNG(),
    )
    for (const platform of ['douyin', 'bilibili']) {
      const otherPlatform = platform === 'bilibili' ? 'douyin' : 'bilibili'
      const otherMetadata = structuredClone(project.stages.publish.payload.platforms[otherPlatform])
      const previousCover = project.stages.publish.payload.platforms[platform].cover
      const expectedReference = previousCover.portraitFile ?? previousCover.feedFile
      await call('generate', {
        projectId: project.id,
        stage: 'publish',
        executor: 'codex',
        expectedRevision: project.revision,
        requestId: `portrait-image2-${platform}`,
        cover: { method: 'image2', platform, includePortrait: true },
      })
      project = await completed()
      assert.equal(project.jobs[0].state, 'succeeded', project.jobs[0].error)
      const imageCover = project.stages.publish.payload.platforms[platform].cover
      assert.equal(imageCover.method, 'image2')
      assert.deepEqual(
        nativeImage.createFromPath(join(root, imageCover.portraitFile.path)).getSize(),
        { width: 1080, height: 1920 },
      )
      assert.deepEqual(project.stages.publish.payload.platforms[otherPlatform], otherMetadata)
      const recorded = JSON.parse(readFileSync(join(root, 'cover-image-args.json'), 'utf8'))
      assert.ok(recorded.includes('image_generation'))
      assert.equal(recorded[recorded.indexOf('--image') + 1], join(root, expectedReference.path))
      const task = JSON.parse(readFileSync(join(root, 'cover-image-task.json'), 'utf8'))
      assert.deepEqual([task.width, task.height], [1080, 1920])
    }
    const validPortraitRevision = project.stages.publish.id
    writeFileSync(join(root, 'cover-mode'), 'portrait-invalid')
    await call('generate', {
      projectId: project.id,
      stage: 'publish',
      executor: 'codex',
      expectedRevision: project.revision,
      requestId: 'portrait-second-image-invalid',
      cover: { method: 'image2', platform: 'bilibili', includePortrait: true },
    })
    project = await completed()
    assert.equal(project.jobs[0].state, 'failed')
    assert.equal(
      project.stages.publish.id,
      validPortraitRevision,
      'second image failure retains the complete old version',
    )
    writeFileSync(join(root, 'cover-mode'), 'portrait-slow')
    const pendingPortrait = await call('generate', {
      projectId: project.id,
      stage: 'publish',
      executor: 'codex',
      expectedRevision: project.revision,
      requestId: 'portrait-second-image-cancel',
      cover: { method: 'image2', platform: 'bilibili', includePortrait: true },
    })
    for (let attempt = 0; attempt < 200; attempt++) {
      const status = await call('get', project.id)
      if (status.jobs.find((job) => job.id === pendingPortrait.id).phase.includes('1080×1920'))
        break
      await delay(100)
    }
    await call('cancel', pendingPortrait.id)
    project = await completed()
    assert.equal(project.jobs[0].state, 'cancelled')
    assert.equal(project.stages.publish.id, validPortraitRevision)
    const legacyPublication = structuredClone(project.stages.publish.payload)
    legacyPublication.platforms.douyin.cover = { ...triple, platform: 'douyin' }
    delete legacyPublication.platforms.douyin.cover.portraitFile
    await call('save', project.id, 'publish', legacyPublication, project.revision, 'legacy-douyin-cover')
    await waitFor('document.querySelector("[data-cover-source]")?.textContent.includes("1600×900")', 'legacy Douyin cover displays primary dimensions')
    await click('放大预览封面')
    const legacyAspect = await evaluate('(()=>{const box=document.querySelector(".workflow-cover-preview").getBoundingClientRect();return box.width/box.height})()')
    assert.ok(Math.abs(legacyAspect - 16 / 9) < 0.01)
    assert.ok(await evaluate(`document.querySelector('.workflow-cover-preview').src.includes(${JSON.stringify(triple.file.id)})`))
    await key('Escape')
    const storedRuntimePath = join(root, 'config/video-workflow.json')
    const storedRuntime = JSON.parse(readFileSync(storedRuntimePath, 'utf8'))
    writeFileSync(storedRuntimePath, JSON.stringify({ ...storedRuntime, bunPath: '/removed/bun', image2Path: '/removed/old-image-api.ts' }))
    await evaluate('document.querySelector("[data-workflow-settings]").click()')
    await waitFor('document.querySelector("[role=dialog] input")', 'Codex image settings')
    assert.ok(await evaluate(`Array.from(document.querySelectorAll('[role=dialog] input')).some(input=>input.value===${JSON.stringify(runtime.codexPath)})`))
    assert.ok(!await evaluate('document.querySelector("[role=dialog]").textContent.includes("baoyu-imagine")'))
    assert.ok(!await evaluate('document.querySelector("[role=dialog]").textContent.includes("Bun（")'))
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        await screenshot(`native-imagegen-settings-${theme}-${width}.png`)
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'))
      }
    }
    window.webContents.setZoomFactor(2)
    await screenshot('native-imagegen-settings-200percent.png')
    await key('Tab')
    assert.ok(await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'))
    window.webContents.setZoomFactor(1)
    await click('保存配置')
    await waitFor('!document.querySelector("[role=dialog]")', 'Codex settings save ignores unused legacy paths')
    assert.equal(await evaluate('document.activeElement.hasAttribute("data-workflow-settings")'), true)
    console.log('PUBLICATION_COVERS_OK', root)
    app.exit(0)
  } catch (error) {
    console.error(error)
    if (window) writeFileSync(join(root, 'failure.png'), (await window.webContents.capturePage()).toPNG())
    app.exit(1)
  }
})
