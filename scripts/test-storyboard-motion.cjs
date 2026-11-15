require('tsx/cjs')
const { app, BrowserWindow } = require('electron')
const assert = require('node:assert/strict')
const { mkdtempSync, writeFileSync, chmodSync, readFileSync } = require('node:fs')
const { randomUUID } = require('node:crypto')
const { setTimeout: delay } = require('node:timers/promises')
const Database = require('better-sqlite3')
const { runMigrations } = require('../src/main/database/migrations')
const { VideoWorkflowService } = require('../src/main/services/video-workflow/service')
const { join } = require('node:path')
const { tmpdir } = require('node:os')
const {
  prepareMotionScene,
  verifyStoryboardMotion,
  storyboardMotionPlan,
} = require('../src/main/services/video-workflow/motion')
const { hyperframesDocument } = require('../src/main/services/video-workflow/render')

app.on('window-all-closed', () => {})
app.whenReady().then(async () => {
  const root = mkdtempSync(join(tmpdir(), 'storyboard-motion-'))
  let window
  let service
  let database
  try {
    const svg = `<svg width="800" height="600" viewBox="0 0 800 600">
      <line id="horizontal" x1="20" y1="40" x2="400" y2="40" stroke="red" stroke-width="2" />
      <line id="vertical" x1="20" y1="80" x2="20" y2="300" stroke="red" stroke-width="2" />
      <path id="path" d="M40 80 H400" fill="none" stroke="red" stroke-width="2" />
      <line id="point" x1="30" y1="40" x2="30" y2="40" stroke="red" stroke-width="2" />
      <line id="unstroked" x1="20" y1="50" x2="400" y2="50" />
      <line id="zero-stroke" x1="20" y1="60" x2="400" y2="60" stroke="red" stroke-width="0" />
      <line id="transparent-stroke" x1="20" y1="70" x2="400" y2="70" stroke="red" stroke-opacity="0" />
      <g style="display:none"><line id="hidden" x1="20" y1="90" x2="400" y2="90" stroke="red" /></g>
      <defs><line id="definition" x1="20" y1="100" x2="400" y2="100" stroke="red" /></defs>
    </svg>`
    const visibleStrokes = await prepareMotionScene(
      svg,
      'stroke-fixture',
      ['#horizontal', '#vertical', '#path'],
      new AbortController().signal,
    )
    assert.deepEqual(visibleStrokes.counts, [1, 1, 1])
    const scaledEntrance = await prepareMotionScene(
      '<style>#entrance{width:800px;height:2px;background:red;transform:scaleX(0)}</style><div id="entrance"></div>',
      'scaled-entrance',
      ['#entrance'],
      new AbortController().signal,
    )
    assert.deepEqual(scaledEntrance.counts, [1])
    assert.match(scaledEntrance.html, /scaleX\(0\)/)
    for (const html of [
      '<div id="entrance" style="width:0;height:2px;background:red;transform:scaleX(0)"></div>',
      '<div style="display:none"><div id="entrance" style="width:800px;height:2px;background:red;transform:scaleX(0)"></div></div>',
      '<div style="visibility:hidden"><div id="entrance" style="width:800px;height:2px;background:red;transform:scaleX(0)"></div></div>',
    ])
      await assert.rejects(
        prepareMotionScene(html, 'invalid-entrance', ['#entrance'], new AbortController().signal),
        /不可见或非画面元素/,
      )
    for (const selector of [
      '#point',
      '#unstroked',
      '#zero-stroke',
      '#transparent-stroke',
      '#hidden',
      '#definition',
    ])
      await assert.rejects(
        prepareMotionScene(svg, 'invalid-stroke', [selector], new AbortController().signal),
        /不可见或非画面元素/,
      )
    console.log(
      'PASS: visible horizontal/vertical SVG strokes are valid motion targets; empty, hidden and unpainted targets remain rejected',
    )
    const storyboard = {
      mode: 'agent',
      template: 'technical',
      motionPolicy: { enabled: true, excludedSceneIds: [] },
      scenes: [
        {
          id: 'one',
          title: '连接与增长',
          body: 'MG',
          layout: 'split',
          html: '<style>#line{width:200px;height:20px;background:red;transform-origin:left center}#bar{width:20px;height:200px;background:lime;transform-origin:center bottom}</style><div id="line"></div><div id="bar"></div>',
          motion: {
            summary: '横向连线与纵向柱形增长',
            blockers: [],
            effects: [
              {
                selector: '#line',
                start: 0,
                duration: 1,
                easing: 'linear',
                keyframes: [{ scaleX: 0 }, { scaleX: 1 }],
              },
              {
                selector: '#bar',
                start: 0,
                duration: 1,
                easing: 'linear',
                keyframes: [{ scaleY: 0 }, { scaleY: 1 }],
              },
            ],
          },
        },
      ],
    }
    await verifyStoryboardMotion(storyboard, new AbortController().signal)
    const invalid = {
      ...storyboard,
      scenes: [
        {
          ...storyboard.scenes[0],
          motion: {
            ...storyboard.scenes[0].motion,
            effects: [{ ...storyboard.scenes[0].motion.effects[0], selector: '#missing' }],
          },
        },
      ],
    }
    await assert.rejects(
      verifyStoryboardMotion(invalid, new AbortController().signal),
      /没有匹配到/,
    )
    await verifyStoryboardMotion(
      { ...invalid, motionPolicy: { enabled: true, excludedSceneIds: ['one'] } },
      new AbortController().signal,
    )
    const project = {
      title: 'MG 验证',
      stages: {
        storyboard: { payload: storyboard },
        audio: {
          payload: { tracks: [{ sceneId: 'one', duration: 2, text: '连接与增长' }], duration: 2 },
        },
      },
    }
    const plan = storyboardMotionPlan(project)
    const prepared = await prepareMotionScene(
      storyboard.scenes[0].html,
      'scene-0',
      plan.scenes[0].effects.map((effect) => effect.selector),
      new AbortController().signal,
    )
    plan.scenes[0].effects.forEach((effect, index) => (effect.selector = prepared.selectors[index]))
    const html = hyperframesDocument(project, [prepared.html], plan)
    writeFileSync(join(root, 'index.html'), html)
    window = new BrowserWindow({
      show: false,
      width: 1920,
      height: 1080,
      webPreferences: { sandbox: true, offscreen: true },
    })
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    for (const [time, factor] of [
      [0, 0],
      [1000, 0.5],
      [2000, 1],
      [1000, 0.5],
    ]) {
      const bounds = await window.webContents.executeJavaScript(
        `(async()=>{document.getAnimations().forEach(animation=>{animation.pause();animation.currentTime=${time}});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return ${JSON.stringify(prepared.selectors)}.map(selector=>{const box=document.querySelector(selector).getBoundingClientRect();return {width:box.width,height:box.height}})})()`,
      )
      assert.ok(Math.abs(bounds[0].width - 200 * factor) < 1)
      assert.equal(bounds[0].height, 20, 'scaleX preserves height')
      assert.equal(bounds[1].width, 20, 'scaleY preserves width')
      assert.ok(Math.abs(bounds[1].height - 200 * factor) < 1)
      writeFileSync(
        join(root, `seek-${time}.png`),
        (await window.webContents.capturePage()).toPNG(),
      )
    }
    database = new Database(join(root, 'workflow.db'))
    runMigrations(database)
    service = new VideoWorkflowService(root, database, () => {
      throw new Error('MG must not synthesize speech')
    })
    let state = service.repository.create('自动 MG 设置验证')
    for (const [stage, payload] of [
      ['brief', { text: '讲解关系', duration: 10 }],
      ['copy', { text: '关系与时间轴' }],
    ]) {
      state = service.repository.save(state.id, stage, payload, state.revision, randomUUID())
      state = service.repository.approve(
        state.id,
        stage,
        state.stages[stage].id,
        state.revision,
        randomUUID(),
      )
    }
    const executable = join(root, 'fake-codex')
    const promptPath = join(root, 'prompt.txt')
    const generated = {
      ...storyboard,
      scenes: [
        ...storyboard.scenes.map((scene) => ({
          ...scene,
          motion: {
            ...scene.motion,
            blockers: [
              '未提供实测配音，归一化卡点需在粗剪时按原口播词锚与实际配音校准。',
              '独立子 agent 设计复核尚未完成：审核会话未收到任务内容，重新创建会话失败，需补做复核。',
            ],
          },
        })),
        {
          id: 'two',
          title: '排除镜头',
          body: '静态内容',
          layout: 'summary',
          html: '<h1>静态内容</h1>',
        },
      ],
    }
    const writeAgent = (payload) => {
      writeFileSync(
        executable,
        '#!/usr/bin/env node\n' +
          `if(process.argv[2]==='mcp'){process.stdout.write('[]');process.exit(0)}const output=process.argv.indexOf('--output-last-message');if(output<0||!process.argv[output+1])process.exit(2);const fs=require('node:fs');let prompt='';process.stdin.on('data',chunk=>prompt+=chunk);process.stdin.on('end',()=>{fs.writeFileSync(${JSON.stringify(promptPath)},prompt);fs.writeFileSync(process.argv[output+1],${JSON.stringify(JSON.stringify(payload))});});`,
      )
      chmodSync(executable, 0o755)
    }
    writeAgent(generated)
    service.runtime.set({ codexPath: executable })
    const waitJob = async (job) => {
      for (let attempt = 0; attempt < 100; attempt++) {
        const current = service.repository.job(job.id)
        if (current.state !== 'running') return current
        await delay(100)
      }
      throw new Error('Timed out waiting for storyboard MG job')
    }
    const settings = {
      ...generated,
      mode: 'template',
      motionPolicy: { enabled: true, excludedSceneIds: ['two'] },
    }
    const job = await service.generate({
      projectId: state.id,
      stage: 'storyboard',
      executor: 'template',
      settings,
      expectedRevision: state.revision,
      requestId: randomUUID(),
    })
    const finished = await waitJob(job)
    assert.equal(finished.state, 'succeeded', finished.error)
    assert.equal(finished.executor, 'codex', 'Template MG must use semantic Agent generation')
    assert.match(readFileSync(promptPath, 'utf8'), /内置 MG 规则.*所有未排除/)
    state = service.repository.get(state.id)
    assert.deepEqual(state.stages.storyboard.payload.motionPolicy, settings.motionPolicy)
    assert.equal(state.stages.storyboard.payload.scenes.length, 2)
    state = await service.approve(
      state.id,
      'storyboard',
      state.stages.storyboard.id,
      state.revision,
      randomUUID(),
      '',
    )
    const retainedVersion = state.stages.storyboard.id
    writeAgent({ ...generated, scenes: [...invalid.scenes, generated.scenes[1]] })
    const invalidJob = await service.generate({
      projectId: state.id,
      stage: 'storyboard',
      executor: 'template',
      settings,
      expectedRevision: state.revision,
      requestId: randomUUID(),
    })
    const rejected = await waitJob(invalidJob)
    assert.equal(rejected.state, 'failed')
    assert.match(rejected.error, /没有匹配到/)
    assert.equal(
      service.repository.get(state.id).stages.storyboard.id,
      retainedVersion,
      'Invalid AI targets preserve approved storyboard',
    )
    const gap = '实物图片尚未取得；当前为已标注的原创示意图'
    const fallback = {
      ...storyboard,
      scenes: ['one', 'two', 'three'].map((id) => ({
        ...storyboard.scenes[0],
        id,
        html: storyboard.scenes[0].html + '<p>原创示意图 · 非实拍</p>',
        motion: { ...storyboard.scenes[0].motion, blockers: [gap] },
      })),
    }
    state = await service.save(state.id, 'storyboard', fallback, state.revision, randomUUID())
    await assert.rejects(
      service.approve(
        state.id,
        'storyboard',
        state.stages.storyboard.id,
        state.revision,
        randomUUID(),
        '',
      ),
      /补齐/,
    )
    const request = randomUUID()
    const expected = state.revision
    const beforeFallback = structuredClone(state.stages.storyboard.payload)
    state = await service.acceptIllustration(state.id, expected, request)
    assert.equal(state.stages.storyboard.status, 'review')
    assert.equal(
      state.stages.storyboard.payload.scenes.filter((scene) => scene.materialFallback).length,
      3,
    )
    assert.deepEqual(
      state.stages.storyboard.payload.scenes.map(({ materialFallback, ...scene }) => scene),
      beforeFallback.scenes,
    )
    assert.deepEqual(state.stages.storyboard.payload.scenes[0].motion.blockers, [gap])
    assert.equal(state.jobs[0].operation.action, 'accept-illustration')
    const acceptedVersion = state.stages.storyboard.id
    assert.equal(
      (await service.acceptIllustration(state.id, expected, request)).stages.storyboard.id,
      acceptedVersion,
    )
    await assert.rejects(service.acceptIllustration(state.id, expected - 1, randomUUID()), /更新/)
    state = await service.approve(
      state.id,
      'storyboard',
      acceptedVersion,
      state.revision,
      randomUUID(),
      '',
    )
    const edited = structuredClone(state.stages.storyboard.payload)
    edited.scenes[0].html += '<p>新画面</p>'
    state = await service.save(state.id, 'storyboard', edited, state.revision, randomUUID())
    assert.equal(state.stages.storyboard.payload.scenes[0].materialFallback, undefined)
    const hidden = {
      ...fallback,
      scenes: [
        fallback.scenes[0],
        {
          ...fallback.scenes[1],
          html:
            storyboard.scenes[0].html +
            '<style>.hidden-label{display:none}</style><p class="hidden-label">原创示意图</p>',
        },
      ],
    }
    state = await service.save(state.id, 'storyboard', hidden, state.revision, randomUUID())
    await assert.rejects(
      service.acceptIllustration(state.id, state.revision, randomUUID()),
      /可见.*标注/,
    )
    assert.equal(
      service.repository.get(state.id).revision,
      state.revision,
      'Batch fallback is atomic when one scene lacks a visible label',
    )
    console.log(
      'PASS: explicit material fallback retains gaps, requires visible label, records review version, is idempotent and expires after editing',
    )
    console.log(
      'PASS: actual DOM targets, exclusions, directional WAAPI scaling and reverse seek:',
      root,
    )
    app.exit(0)
  } catch (error) {
    console.error(error)
    app.exit(1)
  } finally {
    if (service) await service.dispose()
    if (database) database.close()
    if (window && !window.isDestroyed()) window.destroy()
  }
})
