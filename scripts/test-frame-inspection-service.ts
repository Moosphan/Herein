import assert from 'node:assert/strict'
import test from 'node:test'
import Database from 'better-sqlite3'
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { runMigrations } from '../src/main/database/migrations'
import { VideoWorkflowRepository } from '../src/main/database/repositories/video-workflow-repository'
import { WorkflowFiles } from '../src/main/services/video-workflow/files'
import { WorkflowRuntimeManager } from '../src/main/services/video-workflow/cli'
import * as implementation from '../src/main/services/video-workflow/frame-inspection'
import type { StagePayloads, VideoStage } from '../src/shared/video-workflow'

test('actual frame inspection verifies rendered pixels, provenance, failures and read-only behavior', async () => {
  assert.equal(typeof implementation.FrameInspection, 'function')
  const root = mkdtempSync(join(tmpdir(), 'actual-frame-inspection-'))
  const db = new Database(':memory:')
  runMigrations(db)
  const repository = new VideoWorkflowRepository(db)
  const files = new WorkflowFiles(root, repository)
  const runtime = new WorkflowRuntimeManager(root).get()
  const service = new implementation.FrameInspection(repository, files, () => runtime)
  try {
    let project = repository.create('实际帧检验')
    const temporary = join(root, 'actual.mp4')
    execFileSync(runtime.ffmpegPath, [
      '-v',
      'error',
      '-f',
      'lavfi',
      '-i',
      "color=c=red:s=160x90:r=30:d=4,drawbox=x=0:y=0:w=iw:h=ih:color=blue:t=fill:enable='gte(t,2)',drawbox=x=0:y=0:w=32:h=32:color=white:t=fill:enable='eq(mod(n,2),1)'",
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      temporary,
    ])
    const video = await files.import(project.id, temporary)
    const image = await files.write(
      project.id,
      execFileSync(runtime.ffmpegPath, [
        '-v',
        'error',
        '-i',
        temporary,
        '-frames:v',
        '1',
        '-f',
        'image2pipe',
        '-c:v',
        'png',
        'pipe:1',
      ]),
      '.png',
    )
    const subtitles = await files.write(
      project.id,
      '1\n00:00:00,000 --> 00:00:04,000\n字幕\n',
      '.srt',
    )
    const payloads: Partial<StagePayloads> = {
      brief: { text: '检验', duration: 4 },
      copy: { text: '检验' },
      storyboard: {
        mode: 'template',
        template: 'technical',
        scenes: [
          {
            id: 'a',
            title: '白色分镜',
            body: '与视频红蓝像素不同',
            layout: 'title',
            html: '<h1 style="background:white">白色分镜</h1>',
          },
          { id: 'b', title: '第二镜', body: '第二镜', layout: 'title' },
        ],
      },
      narration: {
        scenes: [
          { id: 'a', text: '开头' },
          { id: 'b', text: '主体' },
        ],
      },
      audio: {
        tracks: [
          { sceneId: 'a', text: '开头', duration: 2.13795, file: video },
          { sceneId: 'b', text: '主体', duration: 1.86205, file: video },
        ],
        file: video,
        subtitles,
        duration: 4,
      },
      roughcut: {
        file: video,
        cover: image,
        duration: 4,
        width: 1920,
        height: 1080,
        compositionFiles: [image],
        compositionNames: ['frame.png'],
        manifestHash: 'a'.repeat(64),
        checks: 'unverified',
      },
    }
    for (const stage of Object.keys(payloads) as VideoStage[]) {
      if (stage === 'roughcut')
        Object.assign(payloads.roughcut!, {
          sourceStoryboard: project.stages.storyboard!.id,
          sourceAudio: project.stages.audio!.id,
        })
      project = repository.save(project.id, stage, payloads[stage], project.revision, randomUUID())
      project = repository.approve(
        project.id,
        stage,
        project.stages[stage]!.id,
        project.revision,
        randomUUID(),
      )
    }
    const snapshot = repository.get(project.id)
    const revisionId = project.stages.roughcut!.id
    assert.equal(service.info(project.id, revisionId).scenes[1].start, 2.13795)
    const first = await service.frames(project.id, revisionId, 'a', randomUUID())
    const second = await service.frames(project.id, revisionId, 'b', randomUUID())
    assert.equal(first.videoHash, video.sha256)
    assert.equal(first.revisionId, revisionId)
    assert.equal(first.fps, 30)
    assert.equal(first.frames.length, 3)
    for (const [result, dominant] of [
      [first, 0],
      [second, 2],
    ] as const) {
      const frame = result.frames[1]
      const pixels = execFileSync(runtime.ffmpegPath, [
        '-v',
        'error',
        '-i',
        await files.verify(project.id, frame.file),
        '-vf',
        'crop=64:32:48:32,scale=1:1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        'pipe:1',
      ])
      assert.ok(pixels[dominant] > 180, String([...pixels]))
      assert.ok(pixels[dominant === 0 ? 2 : 0] < 60, String([...pixels]))
      for (const sample of result.frames) {
        const marker = execFileSync(runtime.ffmpegPath, [
          '-v',
          'error',
          '-i',
          await files.verify(project.id, sample.file),
          '-vf',
          'crop=16:16:0:0,scale=1:1',
          '-f',
          'rawvideo',
          '-pix_fmt',
          'rgb24',
          'pipe:1',
        ])
        assert.equal(
          Math.min(...marker) > 180,
          sample.frame % 2 === 1,
          `Requested frame ${sample.frame}, marker ${[...marker]}`,
        )
      }
    }
    assert.deepEqual(await service.frames(project.id, revisionId, 'a', randomUUID()), first)
    const cachedPath = files.path(first.frames[0].file)
    writeFileSync(cachedPath, 'damaged cached image')
    const recovered = await service.frames(project.id, revisionId, 'a', randomUUID())
    assert.notEqual(recovered.frames[0].file.id, first.frames[0].file.id)
    const other = repository.create('另一项目')
    assert.throws(() => service.info(other.id, revisionId), /不存在/)
    await assert.rejects(service.frames(project.id, revisionId, 'missing', randomUUID()), /分镜/)
    const bytes = readFileSync(files.path(video))
    writeFileSync(files.path(video), 'tampered source')
    await assert.rejects(service.frames(project.id, revisionId, 'b', randomUUID()), /修改/)
    writeFileSync(files.path(video), bytes)
    const requestId = randomUUID()
    const pending = service.frames(project.id, revisionId, 'b', requestId)
    service.cancel(project.id, requestId)
    await assert.rejects(pending, /取消/)
    const failed = new implementation.FrameInspection(repository, files, () => ({
      ...runtime,
      ffmpegPath: '/missing/ffmpeg',
    }))
    await assert.rejects(failed.frames(project.id, revisionId, 'a', randomUUID()), /抽帧失败/)
    await failed.dispose()
    assert.deepEqual(repository.get(project.id), snapshot)
    const shortPath = join(root, 'short.mp4')
    execFileSync(runtime.ffmpegPath, [
      '-v',
      'error',
      '-i',
      temporary,
      '-t',
      '1',
      '-c',
      'copy',
      shortPath,
    ])
    const shortVideo = await files.import(project.id, shortPath)
    const mismatched = repository.save(
      project.id,
      'roughcut',
      { ...payloads.roughcut!, file: shortVideo },
      project.revision,
      randomUUID(),
    )
    await assert.rejects(
      service.frames(project.id, mismatched.stages.roughcut!.id, 'a', randomUUID()),
      /实际视频时长/,
    )
    const marker = join(root, 'extracting')
    const slowPath = join(root, 'slow-ffmpeg')
    writeFileSync(
      slowPath,
      `#!${runtime.nodePath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)}, 'started'); setTimeout(() => {}, 30000);`,
    )
    chmodSync(slowPath, 0o700)
    const cancellable = new implementation.FrameInspection(repository, files, () => ({
      ...runtime,
      ffmpegPath: slowPath,
    }))
    const activeRequest = randomUUID()
    const extraction = cancellable.frames(project.id, revisionId, 'b', activeRequest)
    for (let attempt = 0; attempt < 100 && !existsSync(marker); attempt++) await delay(20)
    assert.ok(existsSync(marker))
    cancellable.cancel(other.id, activeRequest)
    await delay(30)
    await cancellable.dispose()
    await assert.rejects(extraction, /取消/)
    await assert.rejects(cancellable.frames(project.id, revisionId, 'b', randomUUID()), /退出/)
  } finally {
    await service.dispose()
    db.close()
    rmSync(root, { recursive: true, force: true })
  }
})
