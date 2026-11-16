require('tsx/cjs')
const { app } = require('electron')
const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  chmodSync,
  existsSync,
} = require('node:fs')
const { join } = require('node:path')
const { tmpdir } = require('node:os')
const { randomUUID } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const { runMigrations } = require('../src/main/database/migrations')
const { fingerprint } = require('../src/main/database/repositories/video-workflow-repository')
const { VideoWorkflowService } = require('../src/main/services/video-workflow/service')
const {
  nativeSettings,
  writeNativeComposition,
} = require('../src/main/services/video-workflow/remotion-native')
const { subtitleCues } = require('../src/main/services/video-workflow/audio')

const root = mkdtempSync(join(tmpdir(), 'production-audio-refresh-'))
app.setPath('userData', join(root, 'electron'))
app.on('window-all-closed', () => {})
app.whenReady().then(async () => {
  const db = new Database(join(root, 'workflow.db'))
  runMigrations(db)
  const service = new VideoWorkflowService(root, db, () => {
    throw new Error('Unexpected TTS')
  })
  try {
    const runtime = service.runtime.get()
    if (process.env.WORKFLOW_REMOTION_PATH)
      runtime.remotionPath = process.env.WORKFLOW_REMOTION_PATH
    if (process.env.WORKFLOW_REMOTION_BROWSER_PATH)
      runtime.remotionBrowserPath = process.env.WORKFLOW_REMOTION_BROWSER_PATH
    assert.ok(runtime.remotionPath, 'WORKFLOW_REMOTION_PATH is required')
    const marker = join(root, 'unexpected-agent')
    const agent = join(root, 'agent')
    writeFileSync(
      agent,
      `#!/usr/bin/env node\nrequire('fs').writeFileSync(${JSON.stringify(marker)}, 'called');process.exit(66)\n`,
    )
    chmodSync(agent, 0o700)
    service.runtime.set({ ...runtime, codexPath: agent })
    const ffmpeg = (args) =>
      execFileSync(runtime.ffmpegPath, ['-nostdin', '-v', 'error', '-y', ...args])
    let project = service.repository.create('Corrected audio must reach the video')
    const save = (stage, payload) => {
      project = service.repository.save(project.id, stage, payload, project.revision, randomUUID())
      project = service.repository.approve(
        project.id,
        stage,
        project.stages[stage].id,
        project.revision,
        randomUUID(),
      )
    }
    save('brief', { text: 'Audio refresh', duration: 2 })
    save('copy', { text: 'First. Second.' })
    save('storyboard', {
      mode: 'agent',
      template: 'technical',
      scenes: [
        { id: 'one', title: 'First', body: 'First', layout: 'title' },
        { id: 'two', title: 'Second', body: 'Second', layout: 'title' },
      ],
    })
    save('narration', {
      scenes: [
        { id: 'one', text: 'First' },
        { id: 'two', text: 'Second' },
      ],
    })
    const audio = async (frequency, duration) => {
      const path = join(root, `voice-${frequency}.wav`)
      ffmpeg([
        '-f',
        'lavfi',
        '-i',
        `sine=frequency=${frequency}:duration=${duration}`,
        '-ar',
        '48000',
        path,
      ])
      const file = await service.files.import(project.id, path)
      const subtitles = await service.files.write(
        project.id,
        '1\n00:00:00,000 --> 00:00:00,900\nFirst\n',
        '.srt',
      )
      return {
        file,
        subtitles,
        duration,
        tracks: [
          { sceneId: 'one', text: 'First', file, duration: duration / 2 },
          { sceneId: 'two', text: 'Second', file, duration: duration / 2 },
        ],
      }
    }
    const oldAudio = await audio(440, 2)
    save('audio', oldAudio)
    const oldAudioId = project.stages.audio.id
    const cwd = join(root, 'frozen')
    mkdirSync(cwd)
    const settings = nativeSettings(project)
    settings.captions = subtitleCues(oldAudio.tracks)
    settings.music = { name: 'music.wav', start: 0, duration: 2, volume: 0.1, playbackRate: 1 }
    const sources = {
      summary: 'Frozen scenes',
      files: [
        {
          name: 'visuals.tsx',
          content:
            "import React from 'react';import {AbsoluteFill,Sequence} from 'remotion';import First from './scene-0';import Second from './scene-1';export default function Visuals({scenes}){return <AbsoluteFill>{scenes.map((scene,index)=><Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames}>{index===0?<First/>:<Second/>}</Sequence>)}</AbsoluteFill>}",
        },
        {
          name: 'scene-0.tsx',
          content:
            "import React from 'react';import {AbsoluteFill} from 'remotion';export default function First(){return <AbsoluteFill style={{background:'red'}}/>}",
        },
        {
          name: 'scene-1.tsx',
          content:
            "import React from 'react';import {AbsoluteFill} from 'remotion';export default function Second(){return <AbsoluteFill style={{background:'blue'}}/>}",
        },
      ],
    }
    writeNativeComposition(cwd, sources, settings, { react: '18.3.1', remotion: '4.0.541' })
    const names = [
      ...sources.files.map((file) => file.name),
      'remotion.tsx',
      'host-captions.tsx',
      'composition.json',
      'package.json',
      'narration.wav',
      'music.wav',
    ]
    require('node:fs').copyFileSync(service.files.path(oldAudio.file), join(cwd, 'narration.wav'))
    require('node:fs').copyFileSync(service.files.path(oldAudio.file), join(cwd, 'music.wav'))
    const compositionFiles = await Promise.all(
      names.map((name) => service.files.import(project.id, join(cwd, name))),
    )
    const path = join(root, 'old.mp4')
    ffmpeg([
      '-f',
      'lavfi',
      '-i',
      'color=c=red:s=1920x1080:r=30:d=2',
      '-i',
      service.files.path(oldAudio.file),
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-shortest',
      path,
    ])
    const file = await service.files.import(project.id, path)
    const coverPath = join(root, 'cover.png')
    ffmpeg(['-i', path, '-frames:v', '1', coverPath])
    const cover = await service.files.import(project.id, coverPath)
    project = service.repository.save(
      project.id,
      'roughcut',
      {
        file,
        cover,
        renderEngine: 'remotion',
        width: 1920,
        height: 1080,
        duration: 2,
        compositionFiles,
        compositionNames: names,
        manifestHash: fingerprint(
          compositionFiles.map((file, index) => [names[index], file.sha256]),
        ),
        music: {
          file: oldAudio.file,
          title: 'Frozen background',
          source: 'local',
          start: 0,
          duration: 2,
          volume: 0.1,
          playbackRate: 1,
        },
        sourceAudio: oldAudioId,
        sourceStoryboard: project.stages.storyboard.id,
        sourceNarration: project.stages.narration.id,
        checks: '{}',
        renderProfile: { quality: 'delivery', fps: 30 },
      },
      project.revision,
      randomUUID(),
    )
    project = service.repository.approveProduction(
      project.id,
      project.stages.roughcut.id,
      project.revision,
      randomUUID(),
    )
    const previousVideo = project.stages.render
    const corrected = await audio(880, 1.8)
    save('audio', corrected)
    const correctedId = project.stages.audio.id
    const job = await service.generate({
      projectId: project.id,
      stage: 'roughcut',
      executor: 'template',
      expectedRevision: project.revision,
      requestId: randomUUID(),
      audioOnly: true,
    })
    let terminal
    for (let attempt = 0; attempt < 2400; attempt++) {
      terminal = service.repository.job(job.id)
      if (terminal.state !== 'running') break
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    assert.equal(terminal.state, 'succeeded', terminal.error)
    project = service.repository.get(project.id)
    const result = project.stages.roughcut.payload
    assert.equal(result.sourceAudio, correctedId)
    assert.equal(result.music.duration, 1.8)
    assert.equal(result.music.volume, 0.1)
    assert.equal(project.stages.roughcut.status, 'review')
    assert.equal(
      result.compositionFiles[result.compositionNames.indexOf('narration.wav')].sha256,
      corrected.file.sha256,
    )
    assert.ok(Math.abs(result.duration - 1.8) < 0.05)
    const config = JSON.parse(
      readFileSync(
        service.files.path(
          result.compositionFiles[result.compositionNames.indexOf('composition.json')],
        ),
        'utf8',
      ),
    )
    assert.equal(config.duration, 1.8)
    assert.equal(config.scenes[1].from, 27)
    assert.equal(config.scenes[1].durationInFrames, 27)
    assert.deepEqual(config.captions, subtitleCues(corrected.tracks))
    for (const name of names.filter((name) => name.endsWith('.tsx'))) {
      assert.equal(
        result.compositionFiles[result.compositionNames.indexOf(name)].sha256,
        compositionFiles[names.indexOf(name)].sha256,
      )
    }
    assert.equal(
      existsSync(marker),
      false,
      'Audio refresh must reuse frozen visuals without Agent authoring',
    )
    assert.ok(project.history.some((revision) => revision.id === previousVideo.id))
    const decoded = ffmpeg([
      '-i',
      service.files.path(result.file),
      '-vn',
      '-ac',
      '1',
      '-ar',
      '48000',
      '-f',
      's16le',
      'pipe:1',
    ])
    let crossings = 0
    for (let index = 2; index < decoded.length; index += 2)
      if (decoded.readInt16LE(index - 2) < 0 && decoded.readInt16LE(index) >= 0) crossings++
    assert.ok(
      crossings / 1.8 > 800 && crossings / 1.8 < 950,
      `Output audio frequency ${crossings / 1.8} must match corrected 880Hz`,
    )
    console.log('PRODUCTION_AUDIO_REFRESH_OK', root)
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    await service.dispose()
    db.close()
    app.exit(process.exitCode || 0)
  }
})
