require('tsx/cjs')
const { app } = require('electron')
const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const { randomUUID } = require('node:crypto')
const {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  existsSync,
} = require('node:fs')
const { join } = require('node:path')
const { tmpdir, homedir } = require('node:os')
const { execFileSync } = require('node:child_process')
const { runMigrations } = require('../src/main/database/migrations')
const { VideoWorkflowService } = require('../src/main/services/video-workflow/service')
const { WorkflowRuntimeManager, runAgent } = require('../src/main/services/video-workflow/cli')
const { renderWorkflow } = require('../src/main/services/video-workflow/render')
const { importNativeMaterial } = require('../src/main/services/video-workflow/native-materials')
const { renderRemotion } = require('../src/main/services/video-workflow/remotion')
const { captureTransparentMaterial } = require('./fixtures/transparent-material.cjs')

const root =
  process.env.WORKFLOW_ACCEPTANCE_ROOT || mkdtempSync(join(tmpdir(), 'real-remotion-films-'))
mkdirSync(root, { recursive: true })
console.log('ACCEPTANCE_ROOT', root)
app.setPath('userData', join(root, 'electron'))
app.on('window-all-closed', () => {})
const deadline = setTimeout(() => app.exit(1), 55 * 60000)
app.whenReady().then(async () => {
  const db = new Database(join(root, 'workflow.db'))
  runMigrations(db)
  const service = new VideoWorkflowService(root, db, () => {
    throw new Error('Use measured local narration only')
  })
  const resuming = process.env.WORKFLOW_ACCEPTANCE_RESUME === '1'
  const report =
    resuming && existsSync(join(root, 'report.json'))
      ? JSON.parse(readFileSync(join(root, 'report.json'), 'utf8'))
      : {
          root,
          automatedApprovals:
            'Only isolated acceptance fixtures; no production or human visual approval',
          agent: 'real authenticated Codex CLI',
          films: [],
        }
  const persist = () => writeFileSync(join(root, 'report.json'), JSON.stringify(report, null, 2))
  try {
    const runtime = {
      ...new WorkflowRuntimeManager(root).get(),
      codexPath: join(
        '/Applications/Codex.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS',
        'codex',
      ),
      remotionPath: join(
        homedir(),
        'Library/Application Support/my-dashboard/tools/remotion/node_modules/@remotion/cli/remotion-cli.js',
      ),
      hyperframesPath: '',
    }
    service.runtime.set(runtime)
    const ffmpeg = (args) =>
      execFileSync(runtime.ffmpegPath, ['-nostdin', '-y', '-v', 'error', ...args], {
        maxBuffer: 32 * 1024 * 1024,
      })
    const probeDuration = (path) =>
      Number(
        execFileSync(
          runtime.ffprobePath,
          [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            path,
          ],
          { encoding: 'utf8' },
        ).trim(),
      )
    const texts = [
      'A seed holds the beginning of a forest. Its small shell protects a living future.',
      'With water and light, roots reach down while the first green shoot rises.',
      'Leaves unfold and gather sunlight. Patient growth turns one seed into a young tree.',
    ]
    for (const format of ['landscape', 'portrait']) {
      if (report.films.some((film) => film.format === format)) continue
      const existing = resuming
        ? db
            .prepare('SELECT id FROM video_projects WHERE title=?')
            .get(`Real Agent seed film ${format}`)
        : undefined
      let project = existing
        ? service.repository.get(existing.id)
        : service.repository.create(`Real Agent seed film ${format}`)
      const directory = join(root, format)
      mkdirSync(directory, { recursive: true })
      let materials = [],
        payload,
        calls = 0
      if (!project.stages.roughcut) {
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
            'Automated isolated acceptance fixture',
          )
        }
        save('brief', {
          text: 'A short illustrated science film about a seed becoming a tree. Botanical editorial mood, paper and ink with luminous green growth. Design time-based scenes, continuous object motion and at least one within-scene viewpoint change. Freely invent visual staging appropriate to the story; registered assets are original illustrations, not scientific recordings. English narration and readable captions; no invented measurements.',
          duration: 20,
          format,
        })
        save('copy', { text: texts.join('\n') })
        save('storyboard', {
          mode: 'agent',
          template: 'technical',
          format,
          scenes: texts.map((text, index) => ({
            id: `seed-${index}`,
            title: ['The seed', 'Water and light', 'A young tree'][index],
            body: text,
            layout: 'title',
            html: `<div style="background:#f3eddc;color:#264732;height:100%;padding:80px;font-family:Georgia"><h1>${['The seed', 'Water and light', 'A young tree'][index]}</h1><p>${text}</p></div>`,
            visualDirection: [
              'Move from the seed silhouette into a closer view of its living interior.',
              'Follow the growth from roots into the shoot, explaining water and light visually.',
              'Continue the growing subject into unfolding leaves and a young tree.',
            ][index],
          })),
        })
        save('narration', { scenes: texts.map((text, index) => ({ id: `seed-${index}`, text })) })
        const tracks = []
        for (const [index, text] of texts.entries()) {
          const aiff = join(directory, `voice-${index}.aiff`),
            wav = join(directory, `voice-${index}.wav`)
          execFileSync('/usr/bin/say', ['-v', 'Samantha', '-r', '195', '-o', aiff, text])
          ffmpeg(['-i', aiff, '-ar', '48000', '-ac', '1', wav])
          tracks.push({
            sceneId: `seed-${index}`,
            text,
            duration: probeDuration(wav),
            file: await service.files.import(project.id, wav),
          })
        }
        const merged = join(directory, 'narration.wav')
        const concat = join(directory, 'concat.txt')
        writeFileSync(
          concat,
          tracks.map((_, index) => `file '${join(directory, `voice-${index}.wav`)}'`).join('\n'),
        )
        ffmpeg(['-f', 'concat', '-safe', '0', '-i', concat, '-c', 'copy', merged])
        let cursor = 0
        const stamp = (seconds) => {
          const millis = Math.round(seconds * 1000)
          return `${String(Math.floor(millis / 3600000)).padStart(2, '0')}:${String(Math.floor(millis / 60000) % 60).padStart(2, '0')}:${String(Math.floor(millis / 1000) % 60).padStart(2, '0')},${String(millis % 1000).padStart(3, '0')}`
        }
        const captions = tracks
          .map((track, index) => {
            const start = cursor
            cursor += track.duration
            return `${index + 1}\n${stamp(start)} --> ${stamp(cursor)}\n${track.text}\n`
          })
          .join('\n')
        save('audio', {
          file: await service.files.import(project.id, merged),
          subtitles: await service.files.write(project.id, captions, '.srt'),
          duration: cursor,
          tracks,
        })
        const seedSvg = join(directory, 'seed.svg')
        writeFileSync(
          seedSvg,
          '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><ellipse cx="200" cy="220" rx="95" ry="125" fill="#7b4b2a" transform="rotate(25 200 220)"/><path d="M170 300Q230 220 210 125" stroke="#d2af79" stroke-width="10" fill="none"/><path d="M210 125Q210 35 280 55Q285 110 210 125" fill="#4f8b43"/></svg>',
        )
        const seedPng = join(directory, 'seed.png')
        writeFileSync(
          seedPng,
          await captureTransparentMaterial(readFileSync(seedSvg, 'utf8'), {
            width: 400,
            height: 400,
          }),
        )
        const water = join(directory, 'water.mp4')
        ffmpeg([
          '-f',
          'lavfi',
          '-i',
          'color=c=0x326b89:s=240x320:r=30:d=3',
          '-vf',
          "drawbox=x=100:y=100:w=25:h=80:color=0xa6dcef:t=fill:enable='lt(mod(t,1),0.5)'",
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          water,
        ])
        for (const [path, role] of [
          [
            seedPng,
            'Original seed illustration, use as an independent visual subject in the opening.',
          ],
          [
            water,
            'Original abstract water rhythm animation, may be composited in the growth scene; not real footage.',
          ],
          ['/System/Library/Fonts/Supplemental/Georgia.ttf', 'Editorial botanical typography.'],
        ]) {
          const asset = await importNativeMaterial(project.id, path, service.files, runtime)
          materials.push({ ...asset, role })
        }
        let injected = false
        const createNative = async (prompt, options) => {
          calls++
          writeFileSync(join(directory, `agent-prompt-${calls}.txt`), prompt)
          const result = await runAgent('codex', runtime, directory, prompt, options.signal, {
            timeout: options.timeout,
            onProgress: console.log,
          })
          writeFileSync(
            join(directory, `agent-response-${calls}.json`),
            JSON.stringify(result, null, 2),
          )
          if (!injected && Array.isArray(result.files)) {
            injected = true
            const target = result.files.find((file) => file.name === 'scene-0.tsx')
            target.content += '\nthrow new ReferenceError("ACCEPTANCE_INJECTED_SOURCE_FAILURE");\n'
            writeFileSync(
              join(directory, 'injected-response.json'),
              JSON.stringify(result, null, 2),
            )
          }
          return result
        }
        const job = service.repository.startJob(
          project.id,
          'roughcut',
          project.revision,
          randomUUID(),
          'template',
          '',
          undefined,
          'remotion',
        )
        payload = await renderWorkflow({
          project,
          final: false,
          files: service.files,
          runtime,
          cwd: join(directory, 'roughcut'),
          signal: new AbortController().signal,
          phase: console.log,
          renderEngine: 'remotion',
          nativeMaterials: materials,
          createNative,
        })
        project = service.repository.finishJob(job.id, payload)
      } else {
        payload = project.stages.roughcut.payload
        materials = payload.nativeMaterials
        calls = JSON.parse(payload.checks).nativeCreation.attempts
        assert.equal(project.stages.roughcut.status, 'review')
      }
      assert.equal(project.stages.roughcut.status, 'review')
      assert.ok(JSON.parse(payload.checks).nativeCreation.repairs >= 1)
      const initialId = project.stages.roughcut.id
      const initialAudio = project.stages.audio.id
      const frames = await service.frameInspection.frames(
        project.id,
        initialId,
        'seed-0',
        randomUUID(),
      )
      for (const frame of frames.frames)
        copyFileSync(service.files.path(frame.file), join(directory, `before-${frame.phase}.jpg`))
      const waitJob = async (job) => {
        for (;;) {
          const latest = service.repository.job(job.id)
          if (latest.state !== 'running') {
            assert.equal(latest.state, 'succeeded', latest.error)
            return latest
          }
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }
      const plan = await waitJob(
        await service.generate({
          projectId: project.id,
          stage: 'roughcut',
          executor: 'codex',
          renderEngine: 'remotion',
          expectedRevision: project.revision,
          requestId: randomUUID(),
          modification: {
            feedback:
              'At the middle of the opening, give the seed a clearer close-up and warmer rim light, preserving the actual narration and other scenes.',
            at: frames.frames[1].time,
            sceneId: 'seed-0',
          },
        }),
      )
      assert.equal(service.repository.get(project.id).stages.roughcut.id, initialId)
      await waitJob(
        await service.generate({
          projectId: project.id,
          stage: 'roughcut',
          executor: 'template',
          renderEngine: 'remotion',
          expectedRevision: project.revision,
          requestId: randomUUID(),
          motionPlanJobId: plan.id,
        }),
      )
      project = service.repository.get(project.id)
      const revised = project.stages.roughcut.payload
      for (const name of payload.compositionNames.filter(
        (name) => /\.tsx$/.test(name) && name !== 'scene-0.tsx',
      ))
        assert.equal(
          payload.compositionFiles[payload.compositionNames.indexOf(name)].sha256,
          revised.compositionFiles[revised.compositionNames.indexOf(name)].sha256,
          name,
        )
      assert.equal(project.stages.audio.id, initialAudio)
      const after = await service.frameInspection.frames(
        project.id,
        project.stages.roughcut.id,
        'seed-0',
        randomUUID(),
      )
      for (const frame of after.frames)
        copyFileSync(service.files.path(frame.file), join(directory, `after-${frame.phase}.jpg`))
      project = service.repository.approve(
        project.id,
        'roughcut',
        project.stages.roughcut.id,
        project.revision,
        randomUUID(),
        'Automated fixture approval, human visual acceptance pending',
      )
      const final = await renderWorkflow({
        project,
        final: true,
        files: service.files,
        runtime,
        cwd: join(directory, 'final'),
        signal: new AbortController().signal,
        phase: console.log,
        createNative: () => {
          throw new Error('Frozen final invoked Agent')
        },
      })
      assert.equal(final.manifestHash, revised.manifestHash)
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
      const exported = await service.exportComposition(project.id, 'render', directory)
      for (const asset of materials) {
        const name = `material-${asset.file.id}.${asset.file.path.split('.').at(-1)}`
        assert.deepEqual(
          readFileSync(join(exported, 'public', name)),
          readFileSync(service.files.path(asset.file)),
        )
      }
      copyFileSync(service.files.path(final.file), join(directory, 'film.mp4'))
      report.films.push({
        format,
        projectId: project.id,
        duration: final.duration,
        width: final.width,
        height: final.height,
        initialAgentCalls: calls,
        repair: JSON.parse(payload.checks).nativeCreation,
        initialId,
        revisedId: project.stages.roughcut.id,
        finalId: project.stages.render.id,
        exported,
        video: join(directory, 'film.mp4'),
        frames: directory,
        unchangedAudio: initialAudio,
        frozenFinalHash: final.manifestHash,
      })
      persist()
    }
    for (const film of report.films) {
      if (film.exportedProjectRendered) continue
      const project = service.repository.get(film.projectId)
      const previousStages = structuredClone(project.stages)
      const materials = project.stages.roughcut.payload.nativeMaterials
      const materialPath = service.files.path(materials[0].file)
      const materialBytes = readFileSync(materialPath)
      writeFileSync(materialPath, 'intentionally corrupted managed acceptance material')
      try {
        await assert.rejects(
          service.generate({
            projectId: project.id,
            stage: 'roughcut',
            executor: 'template',
            renderEngine: 'remotion',
            expectedRevision: project.revision,
            requestId: randomUUID(),
            nativeMaterials: materials,
          }),
          /文件丢失或内容被修改/,
        )
        assert.deepEqual(service.repository.get(project.id).stages, previousStages)
      } finally {
        writeFileSync(materialPath, materialBytes)
      }
      await renderRemotion(runtime, film.exported, new AbortController().signal, true, console.log)
      assert.ok(Math.abs(probeDuration(join(film.exported, 'final.mp4')) - film.duration) < 0.05)
      film.terminalMaterialFailurePreservedStages = true
      film.exportedProjectRendered = join(film.exported, 'final.mp4')
      persist()
    }
    delete report.error
    persist()
    console.log('REAL_FILMS_ACCEPTANCE_OK', root)
    clearTimeout(deadline)
    await service.dispose()
    db.close()
    app.exit(0)
  } catch (failure) {
    report.error = failure.stack || String(failure)
    persist()
    console.error(failure, 'Artifacts:', root)
    clearTimeout(deadline)
    await service.dispose()
    db.close()
    app.exit(1)
  }
})
