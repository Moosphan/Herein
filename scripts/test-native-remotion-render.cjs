require('tsx/cjs')
const { app, nativeImage } = require('electron')
const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const { randomUUID } = require('node:crypto')
const { mkdtempSync, mkdirSync, readFileSync, writeFileSync, chmodSync } = require('node:fs')
const { join, resolve } = require('node:path')
const { tmpdir } = require('node:os')
const { execFileSync } = require('node:child_process')
const { runMigrations } = require('../src/main/database/migrations')
const { VideoWorkflowService } = require('../src/main/services/video-workflow/service')
const { WorkflowRuntimeManager } = require('../src/main/services/video-workflow/cli')
const { renderWorkflow } = require('../src/main/services/video-workflow/render')
const { importNativeMaterial } = require('../src/main/services/video-workflow/native-materials')
const { NATIVE_REMOTION_ENTRY_V1 } = require('../src/main/services/video-workflow/remotion-native')
const { renderRemotion } = require('../src/main/services/video-workflow/remotion')

const root = mkdtempSync(join(tmpdir(), 'native-remotion-render-'))
app.setPath('userData', join(root, 'electron'))
app.on('window-all-closed', () => {})
const deadline = setTimeout(() => app.exit(1), 300000)

app.whenReady().then(async () => {
  const db = new Database(join(root, 'workflow.db'))
  runMigrations(db)
  const service = new VideoWorkflowService(root, db, () => {
    throw new Error('Unexpected voice generation')
  })
  try {
    assert.ok(process.env.WORKFLOW_REMOTION_PATH, 'WORKFLOW_REMOTION_PATH is required')
    const runtime = {
      ...new WorkflowRuntimeManager(root).get(),
      remotionPath: resolve(process.env.WORKFLOW_REMOTION_PATH),
      hyperframesPath: '',
    }
    const ffmpeg = (args) =>
      execFileSync(runtime.ffmpegPath, ['-nostdin', '-v', 'error', '-y', ...args], {
        maxBuffer: 16 * 1024 * 1024,
      })
    const sources = {
      summary: 'Native SVG curve and nonlinear frame motion',
      files: [
        {
          name: 'visuals.tsx',
          content:
            "import React from 'react'; import {AbsoluteFill, Sequence, Img, OffthreadVideo, staticFile} from 'remotion'; import First from './scene-0'; import Second from './scene-1'; export default function Visuals(props) { return <AbsoluteFill>{props.scenes.map((scene,index) => <Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames}>{index === 0 ? <First/> : <Second/>}</Sequence>)}{props.assets.filter(asset => asset.kind === 'image').map(asset => <Img key={asset.name} src={staticFile(asset.name)} style={{position:'absolute',left:700,top:40,width:80,height:80}}/>)}{props.assets.filter(asset => asset.kind === 'video').map(asset => <OffthreadVideo key={asset.name} src={staticFile(asset.name)} muted style={{position:'absolute',left:800,top:40,width:80,height:80}}/>)}{props.assets.filter(asset => asset.kind === 'font').map(asset => <div key={asset.name} style={{position:'absolute',left:20,top:600,fontFamily:asset.fontFamily,color:'white',fontSize:48}}>Frozen local font</div>)}</AbsoluteFill> }",
        },
        {
          name: 'scene-0.tsx',
          content:
            "import React from 'react'; import {AbsoluteFill,useCurrentFrame} from 'remotion'; export default function Scene() { const frame = useCurrentFrame(); return <AbsoluteFill style={{background:'#123456'}}><svg width='100%' height='100%'><path d={`M 50 400 Q ${frame * frame} 20 700 400`} fill='none' stroke='#ffffff' strokeWidth='20'/><circle cx={100 + frame * frame * 2} cy='200' r='60' fill='#ff0000'/></svg></AbsoluteFill> }",
        },
        {
          name: 'scene-1.tsx',
          content:
            "import React from 'react'; import {AbsoluteFill} from 'remotion'; export default function Scene() { return <AbsoluteFill style={{background:'#165b43'}}/> }",
        },
      ],
    }
    const resultPath = join(root, 'agent-response.json')
    const promptPath = join(root, 'agent-prompt.txt')
    const callPath = join(root, 'agent-calls.txt')
    writeFileSync(resultPath, JSON.stringify(sources))
    const agent = join(root, 'agent')
    writeFileSync(
      agent,
      `#!/usr/bin/env node\nif(process.argv[2]==='mcp'){process.stdout.write('[]');process.exit(0)}const fs=require('node:fs');let input='';process.stdin.on('data',data=>input+=data);process.stdin.on('end',()=>{fs.writeFileSync(${JSON.stringify(promptPath)},input);fs.appendFileSync(${JSON.stringify(callPath)},'x');let value=JSON.parse(fs.readFileSync(${JSON.stringify(resultPath)},'utf8'));if(Array.isArray(value)){const next=value.shift();fs.writeFileSync(${JSON.stringify(resultPath)},JSON.stringify(value));value=next;}if(value.hold){setInterval(()=>{},1000);return;}fs.writeFileSync(process.argv[process.argv.indexOf('--output-last-message')+1],JSON.stringify(value));});`,
    )
    chmodSync(agent, 0o700)
    service.runtime.set({ ...runtime, codexPath: agent })
    const calls = () => readFileSync(callPath, 'utf8').length
    const waitJob = async (job, expected = 'succeeded') => {
      for (let attempt = 0; attempt < 2400; attempt++) {
        const latest = service.repository.job(job.id)
        if (latest.state !== 'running') {
          assert.equal(latest.state, expected, latest.error)
          return latest
        }
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      throw new Error('Native workflow timed out')
    }
    for (const format of ['landscape', 'portrait']) {
      let project = service.repository.create(`Native ${format}`)
      const save = (stage, payload) => {
        project = service.repository.save(
          project.id,
          stage,
          payload,
          project.revision,
          randomUUID(),
        )
        project = service.repository.approve(
          project.id,
          stage,
          project.stages[stage].id,
          project.revision,
          randomUUID(),
        )
      }
      save('brief', {
        text: 'Explain a moving task with native SVG and a nonlinear camera path',
        duration: 2,
        format,
      })
      save('copy', { text: 'Task enters the queue. Execution starts.' })
      save('storyboard', {
        mode: 'agent',
        template: 'technical',
        format,
        scenes: [
          {
            id: 'one',
            title: 'Queue',
            body: 'Task enters',
            layout: 'title',
            html: `<h1>Original static queue</h1><img src="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>')}">`,
            visualDirection: 'Follow the task along a changing curve',
          },
          {
            id: 'two',
            title: 'Execution',
            body: 'Execution starts',
            layout: 'title',
            html: '<h1>Execution</h1>',
          },
        ],
      })
      save('narration', {
        scenes: [
          { id: 'one', text: 'Task enters' },
          { id: 'two', text: 'Execution starts' },
        ],
      })
      const audioPath = join(root, 'voice.wav')
      ffmpeg(['-f', 'lavfi', '-i', 'sine=frequency=440:duration=1.6', audioPath])
      const audio = await service.files.import(project.id, audioPath)
      const subtitles = await service.files.write(
        project.id,
        '1\n00:00:00,000 --> 00:00:01,600\nTask enters\n',
        '.srt',
      )
      save('audio', {
        file: audio,
        subtitles,
        duration: 1.6,
        tracks: [
          { sceneId: 'one', file: audio, text: 'Task enters', duration: 0.8 },
          { sceneId: 'two', file: audio, text: 'Execution starts', duration: 0.8 },
        ],
      })
      const imagePath = join(root, `${format}-image.png`)
      ffmpeg(['-f', 'lavfi', '-i', 'color=c=0xffff00:s=80x80', '-frames:v', '1', imagePath])
      const videoPath = join(root, `${format}-silent.mp4`)
      ffmpeg([
        '-f',
        'lavfi',
        '-i',
        'color=c=0x00ffff:s=80x80:d=2',
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        videoPath,
      ])
      const nativeMaterials = []
      for (const path of [imagePath, videoPath, '/System/Library/Fonts/Supplemental/Arial.ttf']) {
        const material = await importNativeMaterial(project.id, path, service.files, runtime)
        nativeMaterials.push({
          ...material,
          role: `独立${material.kind}素材用于说明任务`,
          ...(material.kind === 'image' ? { sceneId: 'one' } : {}),
        })
      }
      assert.equal(nativeMaterials[1].duration, 2)
      assert.match(nativeMaterials[2].fontFamily, /^WorkflowFont_/)
      const invalidPath = join(root, 'invalid.png')
      writeFileSync(invalidPath, 'invalid image')
      await assert.rejects(
        importNativeMaterial(project.id, invalidPath, service.files, runtime),
        /解码/,
      )
      const invalidFont = join(root, 'invalid.ttf')
      writeFileSync(invalidFont, 'not a font')
      await assert.rejects(
        importNativeMaterial(project.id, invalidFont, service.files, runtime),
        /格式/,
      )
      await assert.rejects(
        importNativeMaterial(project.id, join(root, 'missing.mp4'), service.files, runtime),
        /ENOENT/,
      )
      writeFileSync(imagePath, 'original file changed after import')
      await service.files.verify(project.id, nativeMaterials[0].file)
      const generate = async (extra) => {
        const job = await service.generate({
          projectId: project.id,
          expectedRevision: project.revision,
          requestId: randomUUID(),
          executor: 'template',
          stage: 'roughcut',
          renderEngine: 'remotion',
          ...(!extra?.motionPlanJobId ? { nativeMaterials } : {}),
          ...extra,
        })
        await waitJob(job)
        project = service.repository.get(project.id)
      }
      const brokenSources = {
        ...sources,
        files: sources.files.map((file) =>
          file.name === 'scene-0.tsx'
            ? {
                ...file,
                content: file.content.replace(
                  'const frame = useCurrentFrame();',
                  'const frame = missingFrameValue;',
                ),
              }
            : file,
        ),
      }
      writeFileSync(resultPath, JSON.stringify([brokenSources, sources]))
      await generate()
      let roughcut = project.stages.roughcut.payload
      assert.equal(roughcut.renderProfile.quality, 'delivery')
      assert.equal(JSON.parse(roughcut.checks).nativeCreation.repairs, 1)
      assert.equal(JSON.parse(roughcut.checks).nativeCreation.attempts, 2)
      assert.match(project.jobs.find((job) => job.stage === 'roughcut').phase, /自动修复 1\/2/)
      const frozenConfig =
        roughcut.compositionFiles[roughcut.compositionNames.indexOf('composition.json')]
      assert.equal(
        JSON.parse(readFileSync(service.files.path(frozenConfig), 'utf8')).creation.repairs,
        1,
      )
      const originalSettings = JSON.parse(readFileSync(service.files.path(frozenConfig), 'utf8'))
      assert.equal(originalSettings.assets.filter((asset) => asset.source === 'local').length, 3)
      assert.equal(roughcut.nativeMaterials.length, 3)
      assert.match(readFileSync(promptPath, 'utf8'), /独立image素材用于说明任务/)
      assert.match(readFileSync(promptPath, 'utf8'), /missingFrameValue/)
      assert.match(readFileSync(promptPath, 'utf8'), /修复诊断/)
      writeFileSync(resultPath, JSON.stringify(sources))
      assert.equal(project.stages.roughcut.status, 'review')
      assert.equal(JSON.parse(roughcut.checks).motionEngine, 'remotion-native')
      assert.ok(!roughcut.compositionNames.includes('index.html'))
      assert.ok(roughcut.compositionNames.includes('asset-0-0.svg'))
      assert.notEqual(
        roughcut.cover.sha256,
        roughcut.compositionFiles[roughcut.compositionNames.indexOf('reference-0.png')].sha256,
      )
      assert.match(readFileSync(promptPath, 'utf8'), /Follow the task along a changing curve/)
      const pixel = (time, x, y) => {
        const output = join(root, `${format}-${time}.png`)
        ffmpeg([
          '-ss',
          String(time),
          '-i',
          service.files.path(roughcut.file),
          '-frames:v',
          '1',
          output,
        ])
        const image = nativeImage.createFromPath(output)
        const bitmap = image.getBitmap()
        const offset = (y * image.getSize().width + x) * 4
        return [bitmap[offset + 2], bitmap[offset + 1], bitmap[offset]]
      }
      assert.ok(pixel(0.05, 100, 200)[0] > 200, 'Native circle missing')
      assert.ok(pixel(0.6, 100, 200)[0] < 100, 'Native nonlinear animation did not advance')
      assert.ok(pixel(1.1, 10, 10)[1] > 70, 'Second native scene missing')
      assert.ok(
        pixel(0.1, 720, 60)[0] > 200 && pixel(0.1, 720, 60)[1] > 200,
        'Independent image missing',
      )
      assert.ok(
        pixel(0.1, 820, 60)[1] > 200 && pixel(0.1, 820, 60)[2] > 200,
        'Silent independent video missing',
      )
      const original = roughcut
      writeFileSync(
        resultPath,
        JSON.stringify({
          summary: 'Change only queue scene',
          native: { instructions: 'Change the task color while keeping all other sources' },
          scenes: [{ sceneId: 'one', effects: [] }],
        }),
      )
      const planJob = await service.generate({
        projectId: project.id,
        expectedRevision: project.revision,
        requestId: randomUUID(),
        executor: 'codex',
        stage: 'roughcut',
        renderEngine: 'remotion',
        modification: { feedback: 'Change task color', at: 0.2, sceneId: 'one' },
      })
      const plan = await waitJob(planJob)
      assert.ok(plan.motionPlan.native)
      assert.equal(
        service.repository.get(project.id).stages.roughcut.id,
        project.stages.roughcut.id,
        'Planning changed the current video',
      )
      if (format === 'landscape') {
        const before = calls()
        writeFileSync(
          resultPath,
          JSON.stringify([
            brokenSources,
            {
              ...sources,
              files: sources.files.map((file) =>
                file.name === 'scene-1.tsx'
                  ? { ...file, content: file.content.replace('#165b43', '#ffffff') }
                  : file,
              ),
            },
          ]),
        )
        const scoped = await service.generate({
          projectId: project.id,
          expectedRevision: project.revision,
          requestId: randomUUID(),
          executor: 'template',
          stage: 'roughcut',
          renderEngine: 'remotion',
          motionPlanJobId: plan.id,
        })
        const rejected = await waitJob(scoped, 'failed')
        assert.match(rejected.error, /只能改变/)
        assert.equal(calls() - before, 2)
        assert.deepEqual(service.repository.get(project.id).stages, project.stages)
      }
      writeFileSync(
        resultPath,
        JSON.stringify([
          brokenSources,
          {
            ...sources,
            files: sources.files.map((file) =>
              file.name === 'scene-0.tsx'
                ? { ...file, content: file.content.replace('#ff0000', '#ff8800') }
                : file,
            ),
          },
        ]),
      )
      await generate({ motionPlanJobId: plan.id })
      roughcut = project.stages.roughcut.payload
      assert.equal(JSON.parse(roughcut.checks).nativeCreation.repairs, 1)
      const originalSecond =
        original.compositionFiles[original.compositionNames.indexOf('scene-1.tsx')]
      const nextSecond = roughcut.compositionFiles[roughcut.compositionNames.indexOf('scene-1.tsx')]
      assert.equal(originalSecond.sha256, nextSecond.sha256)
      assert.equal(
        project.stages.audio.id,
        project.history.find((revision) => revision.stage === 'audio').id,
      )
      project = await service.approve(
        project.id,
        'roughcut',
        project.stages.roughcut.id,
        project.revision,
        randomUUID(),
        '',
      )
      assert.equal(project.stages.render.status, 'approved')
      assert.equal(project.stages.render.payload.file.id, project.stages.roughcut.payload.file.id)
      assert.equal(
        project.stages.render.payload.manifestHash,
        project.stages.roughcut.payload.manifestHash,
      )
      const musicPath = join(root, 'music.wav')
      ffmpeg(['-f', 'lavfi', '-i', 'sine=frequency=880:duration=3', musicPath])
      const music =
        format === 'landscape'
          ? {
              file: await service.files.import(project.id, musicPath),
              title: 'Native music regression',
              source: 'local',
              start: 0.2,
              duration: 1.1,
              volume: 0.3,
              playbackRate: 1.25,
            }
          : undefined
      const final = await renderWorkflow({
        project,
        files: service.files,
        runtime,
        cwd: join(root, `${format}-final`),
        final: true,
        music,
        signal: new AbortController().signal,
        phase: console.log,
        createNative: () => {
          throw new Error('Final must not invoke authoring')
        },
      })
      assert.equal(final.sourceRoughcut, project.stages.roughcut.id)
      assert.deepEqual(final.nativeMaterials, roughcut.nativeMaterials)
      assert.equal(JSON.parse(final.checks).nativeCreation.repairs, 1)
      const finalJob = service.repository.startJob(
        project.id,
        'render',
        project.revision,
        randomUUID(),
        'template',
        '',
        undefined,
        'remotion',
      )
      project = service.repository.finishJob(finalJob.id, final)
      assert.equal(service.repository.job(finalJob.id).phase, '已完成，等待人工审核')
      if (!music) assert.equal(final.manifestHash, roughcut.manifestHash)
      for (const name of roughcut.compositionNames.filter((name) => name.endsWith('.tsx')))
        assert.equal(
          final.compositionFiles[final.compositionNames.indexOf(name)].sha256,
          roughcut.compositionFiles[roughcut.compositionNames.indexOf(name)].sha256,
        )
      const finalSettings = JSON.parse(
        readFileSync(
          service.files.path(
            final.compositionFiles[final.compositionNames.indexOf('composition.json')],
          ),
          'utf8',
        ),
      )
      if (music) assert.equal(finalSettings.music.volume, 0.3)
      if (music) {
        // The unified music action starts with the visible final, never invokes the creative Agent,
        // and returns a new pending production revision requiring the one video review.
        project = service.repository.approve(
          project.id,
          'render',
          project.stages.render.id,
          project.revision,
          randomUUID(),
        )
        // Later upstream changes replace all scene IDs; retaining the frozen video must retain
        // its scene-scoped assets and source timeline when only music is edited.
        const changedStoryboard = {
          ...project.stages.storyboard.payload,
          scenes: project.stages.storyboard.payload.scenes.map((scene, index) => ({
            ...scene,
            id: `changed-${index}`,
          })),
        }
        project = service.repository.save(
          project.id,
          'storyboard',
          changedStoryboard,
          project.revision,
          randomUUID(),
        )
        project = service.repository.approve(
          project.id,
          'storyboard',
          project.stages.storyboard.id,
          project.revision,
          randomUUID(),
        )
        for (const stage of ['narration', 'audio']) {
          const original = project.stages[stage].payload
          const next =
            stage === 'narration'
              ? {
                  ...original,
                  scenes: original.scenes.map((scene, index) => ({
                    ...scene,
                    id: `changed-${index}`,
                  })),
                }
              : {
                  ...original,
                  tracks: original.tracks.map((track, index) => ({
                    ...track,
                    sceneId: `changed-${index}`,
                  })),
                }
          project = service.repository.save(project.id, stage, next, project.revision, randomUUID())
          project = service.repository.approve(
            project.id,
            stage,
            project.stages[stage].id,
            project.revision,
            randomUUID(),
          )
        }
        const visibleFinal = project.stages.render.payload.file.id
        project = await service.discardMotionPlans(project.id, project.revision)
        assert.equal(project.stages.roughcut.payload.file.id, visibleFinal)
        assert.equal(project.stages.roughcut.payload.music.title, 'Native music regression')
        project = await service.approve(
          project.id,
          'roughcut',
          project.stages.roughcut.id,
          project.revision,
          randomUUID(),
          '',
        )
        const callsBeforeMusic = calls()
        const musicJob = await service.generate({
          projectId: project.id,
          stage: 'roughcut',
          expectedRevision: project.revision,
          requestId: randomUUID(),
          executor: 'template',
          musicOnly: true,
        })
        await waitJob(musicJob)
        project = service.repository.get(project.id)
        assert.equal(calls(), callsBeforeMusic)
        assert.equal(project.stages.roughcut.status, 'review')
        assert.equal(project.stages.render.status, 'stale')
        const withoutMusic = project.stages.roughcut.payload
        assert.equal(withoutMusic.music, undefined)
        assert.equal(withoutMusic.renderProfile.quality, 'delivery')
        const settings = JSON.parse(
          readFileSync(
            service.files.path(
              withoutMusic.compositionFiles[
                withoutMusic.compositionNames.indexOf('composition.json')
              ],
            ),
            'utf8',
          ),
        )
        assert.equal(settings.music, undefined)
        for (const name of final.compositionNames.filter((name) => name.endsWith('.tsx')))
          assert.equal(
            withoutMusic.compositionFiles[withoutMusic.compositionNames.indexOf(name)].sha256,
            final.compositionFiles[final.compositionNames.indexOf(name)].sha256,
          )
        project = await service.approve(
          project.id,
          'roughcut',
          project.stages.roughcut.id,
          project.revision,
          randomUUID(),
          '',
        )
        assert.equal(project.stages.render.status, 'approved')
        assert.equal(project.stages.render.payload.file.id, withoutMusic.file.id)
        // Restore the upstream fixture IDs for the independent later full-regeneration tests.
        // The music regression above deliberately used only the old frozen timeline.
        for (const stage of ['storyboard', 'narration', 'audio']) {
          const original = project.stages[stage].payload
          const next =
            stage === 'storyboard' || stage === 'narration'
              ? {
                  ...original,
                  scenes: original.scenes.map((scene, index) => ({
                    ...scene,
                    id: index ? 'two' : 'one',
                  })),
                }
              : {
                  ...original,
                  tracks: original.tracks.map((track, index) => ({
                    ...track,
                    sceneId: index ? 'two' : 'one',
                  })),
                }
          project = service.repository.save(project.id, stage, next, project.revision, randomUUID())
          project = service.repository.approve(
            project.id,
            stage,
            project.stages[stage].id,
            project.revision,
            randomUUID(),
          )
        }
      }
      const destination = join(root, `${format}-export`)
      mkdirSync(destination)
      const exported = await service.exportComposition(project.id, 'roughcut', destination)
      assert.match(readFileSync(join(exported, 'visuals.tsx'), 'utf8'), /Sequence/)
      assert.ok(readFileSync(join(exported, 'public/narration.wav')).length > 100)
      assert.ok(readFileSync(join(exported, 'public/asset-0-0.svg'), 'utf8').includes('<svg'))
      for (const material of nativeMaterials) {
        const name = `material-${material.file.id}.${material.file.path.split('.').at(-1)}`
        assert.deepEqual(
          readFileSync(join(exported, 'public', name)),
          readFileSync(service.files.path(material.file)),
        )
      }
      if (format === 'landscape') {
        const oldDirectory = join(root, 'legacy-native')
        mkdirSync(oldDirectory)
        const config = {
          ...finalSettings,
          assets: finalSettings.assets.filter((asset) => !asset.kind),
        }
        for (const [index, file] of final.compositionFiles.entries())
          require('node:fs').copyFileSync(
            service.files.path(file),
            join(oldDirectory, final.compositionNames[index]),
          )
        writeFileSync(join(oldDirectory, 'composition.json'), JSON.stringify(config))
        writeFileSync(join(oldDirectory, 'remotion.tsx'), NATIVE_REMOTION_ENTRY_V1)
        await renderRemotion(runtime, oldDirectory, new AbortController().signal, true, () => {})
      }
      const priorId = project.stages.roughcut.id
      if (format === 'landscape') {
        const target = service.files.path(nativeMaterials[0].file)
        const saved = readFileSync(target)
        writeFileSync(target, 'modified managed material')
        try {
          await assert.rejects(
            service.generate({
              projectId: project.id,
              expectedRevision: project.revision,
              requestId: randomUUID(),
              executor: 'template',
              stage: 'roughcut',
              renderEngine: 'remotion',
              nativeMaterials,
            }),
            /文件丢失或内容被修改/,
          )
        } finally {
          writeFileSync(target, saved)
        }
        const other = service.repository.create('Foreign material owner')
        await assert.rejects(service.files.verifyPayload(other.id, nativeMaterials), /不属于/)
        assert.equal(service.repository.get(project.id).stages.roughcut.id, priorId)
      }
      writeFileSync(resultPath, JSON.stringify({ blockers: ['Required asset is unavailable'] }))
      const failed = await service.generate({
        projectId: project.id,
        expectedRevision: project.revision,
        requestId: randomUUID(),
        executor: 'template',
        stage: 'roughcut',
        renderEngine: 'remotion',
      })
      for (
        let attempt = 0;
        attempt < 200 && service.repository.job(failed.id).state === 'running';
        attempt++
      )
        await new Promise((resolve) => setTimeout(resolve, 50))
      assert.equal(service.repository.job(failed.id).state, 'failed')
      assert.match(service.repository.job(failed.id).error, /Required asset is unavailable/)
      assert.equal(service.repository.get(project.id).stages.roughcut.id, priorId)
      if (format === 'landscape') {
        const before = calls()
        const invalid = {
          ...sources,
          files: sources.files.map((file) =>
            file.name === 'scene-0.tsx'
              ? { ...file, content: 'export default function Broken( {' }
              : file,
          ),
        }
        writeFileSync(resultPath, JSON.stringify([invalid, invalid, invalid]))
        const persistent = await service.generate({
          projectId: project.id,
          expectedRevision: project.revision,
          requestId: randomUUID(),
          executor: 'template',
          stage: 'roughcut',
          renderEngine: 'remotion',
        })
        assert.match((await waitJob(persistent, 'failed')).error, /自动修复 2 次后仍失败/)
        assert.equal(calls() - before, 3)
        assert.deepEqual(service.repository.get(project.id).stages, project.stages)
        const beforeCancel = calls()
        writeFileSync(resultPath, JSON.stringify({ hold: true }))
        const pending = await service.generate({
          projectId: project.id,
          expectedRevision: project.revision,
          requestId: randomUUID(),
          executor: 'template',
          stage: 'roughcut',
          renderEngine: 'remotion',
        })
        for (let attempt = 0; attempt < 400 && calls() === beforeCancel; attempt++)
          await new Promise((resolve) => setTimeout(resolve, 50))
        assert.equal(calls() - beforeCancel, 1)
        await service.cancel(pending.id)
        await waitJob(pending, 'cancelled')
        assert.equal(calls() - beforeCancel, 1)
        assert.deepEqual(service.repository.get(project.id).stages, project.stages)
      }
      writeFileSync(resultPath, JSON.stringify(sources))
      console.log(
        `PASS native ${format}: render repair, service authoring, nonlinear SVG, scene timing, plan confirmation, single-scene isolation, frozen final, export, failure preservation${format === 'landscape' ? ', repair limit, scoped repair rejection, cancellation' : ''}`,
      )
    }
    console.log(`Native render artifacts: ${root}`)
    clearTimeout(deadline)
    await service.dispose()
    db.close()
    app.exit(0)
  } catch (error) {
    console.error(error)
    clearTimeout(deadline)
    await service.dispose()
    db.close()
    app.exit(1)
  }
})
