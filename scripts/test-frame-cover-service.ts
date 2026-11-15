import assert from 'node:assert/strict'
import test from 'node:test'
import Database from 'better-sqlite3'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { runMigrations } from '../src/main/database/migrations'
import { VideoWorkflowRepository } from '../src/main/database/repositories/video-workflow-repository'
import { WorkflowFiles } from '../src/main/services/video-workflow/files'
import { WorkflowRuntimeManager } from '../src/main/services/video-workflow/cli'
import * as implementation from '../src/main/services/video-workflow/frame-cover'

test('frame covers extract the selected real frame, crop per platform, and preserve drafts', async () => {
  assert.equal(typeof implementation.FrameCoverService, 'function')
  const root = mkdtempSync(join(tmpdir(), 'frame-cover-'))
  const db = new Database(':memory:')
  runMigrations(db)
  const repository = new VideoWorkflowRepository(db)
  const files = new WorkflowFiles(root, repository)
  const runtime = new WorkflowRuntimeManager(root).get()
  const service = new implementation.FrameCoverService(repository, files, () => runtime)
  try {
    let project = repository.create('选帧检验')
    const source = join(root, 'source.mp4')
    execFileSync(runtime.ffmpegPath, [
      '-v',
      'error',
      '-f',
      'lavfi',
      '-i',
      "color=c=red:s=90x160:r=30:d=4,drawbox=x=0:y=0:w=iw:h=ih:color=blue:t=fill:enable='gte(t,2)'",
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      source,
    ])
    const video = await files.import(project.id, source)
    const cover = await files.write(
      project.id,
      execFileSync(runtime.ffmpegPath, [
        '-v',
        'error',
        '-i',
        source,
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
    project = repository.completeVideoImport(
      project.id,
      {
        file: video,
        cover,
        duration: 4,
        width: 90,
        height: 160,
        compositionFiles: [],
        compositionNames: [],
        manifestHash: video.sha256,
        checks: 'unverified',
        imported: { filename: 'source.mp4', description: '真实视频' },
      },
      randomUUID(),
      ['test-import'],
    )
    project = repository.get(project.id)
    const snapshot = repository.get(project.id)
    const renderId = project.stages.render!.id
    const info = await service.info(project.id, renderId, project.revision)
    assert.deepEqual([info.width, info.height, info.duration, info.fps], [90, 160, 4, 30])
    const extract = (platform: 'bilibili' | 'douyin', time: number) =>
      service.create({
        projectId: project.id,
        renderId,
        expected: project.revision,
        platform,
        time,
        requestId: randomUUID(),
      })
    const douyin = await extract('douyin', 2.51)
    assert.deepEqual(
      [douyin.width, douyin.height, douyin.frameSource?.frame, douyin.frameSource?.time],
      [90, 160, 75, 2.5],
    )
    assert.equal(douyin.file.id, douyin.feedFile.id)
    const bili = await extract('bilibili', 1.1)
    assert.deepEqual(
      [bili.width, bili.height, bili.feedWidth, bili.feedHeight],
      [1600, 900, 1600, 1200],
    )
    for (const [candidate, dominant] of [
      [douyin, 2],
      [bili, 0],
    ] as const) {
      const bytes = execFileSync(runtime.ffmpegPath, [
        '-v',
        'error',
        '-i',
        await files.verify(project.id, candidate.file),
        '-vf',
        'scale=1:1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        'pipe:1',
      ])
      assert.ok(bytes[dominant] > 180, String([...bytes]))
    }
    assert.deepEqual(repository.get(project.id), snapshot)
    await assert.rejects(extract('douyin', 4), /时间/)
    await assert.rejects(service.info(project.id, renderId, project.revision - 1), /变化/)
    const requestId = randomUUID()
    const pending = service.create({
      projectId: project.id,
      renderId,
      expected: project.revision,
      platform: 'douyin',
      time: 1,
      requestId,
    })
    service.cancel(project.id, requestId)
    await assert.rejects(pending, /取消/)
    const rotatedPath = join(root, 'rotated.mp4')
    execFileSync(runtime.ffmpegPath, [
      '-v',
      'error',
      '-display_rotation',
      '90',
      '-i',
      source,
      '-c',
      'copy',
      rotatedPath,
    ])
    const rotatedProject = repository.create('旋转视频')
    const rotatedFile = await files.import(rotatedProject.id, rotatedPath)
    const rotatedCover = await files.write(
      rotatedProject.id,
      execFileSync(runtime.ffmpegPath, [
        '-v',
        'error',
        '-i',
        rotatedPath,
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
    const rotated = repository.completeVideoImport(
      rotatedProject.id,
      {
        ...project.stages.render!.payload,
        file: rotatedFile,
        cover: rotatedCover,
        width: 160,
        height: 90,
        manifestHash: rotatedFile.sha256,
      },
      randomUUID(),
      ['rotated-test'],
    )
    const rotatedInfo = await service.info(rotated.id, rotated.stages.render!.id, rotated.revision)
    assert.deepEqual([rotatedInfo.width, rotatedInfo.height], [160, 90])
    const selected = await service.create({
      projectId: rotated.id,
      renderId: rotated.stages.render!.id,
      expected: rotated.revision,
      platform: 'douyin',
      time: 2,
      requestId: randomUUID(),
    })
    const actual = JSON.parse(
      execFileSync(
        runtime.ffprobePath,
        [
          '-v',
          'error',
          '-show_entries',
          'stream=width,height',
          '-of',
          'json',
          files.path(selected.file),
        ],
        { encoding: 'utf8' },
      ),
    )
    assert.deepEqual([actual.streams[0].width, actual.streams[0].height], [160, 90])
    const anamorphicPath = join(root, 'anamorphic.mp4')
    execFileSync(runtime.ffmpegPath, [
      '-v',
      'error',
      '-i',
      source,
      '-vf',
      'setsar=2',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      anamorphicPath,
    ])
    const anamorphicProject = repository.create('非方形像素视频')
    const anamorphicFile = await files.import(anamorphicProject.id, anamorphicPath)
    const anamorphicCover = await files.write(
      anamorphicProject.id,
      execFileSync(runtime.ffmpegPath, [
        '-v',
        'error',
        '-i',
        anamorphicPath,
        '-frames:v',
        '1',
        '-vf',
        'scale=180:160,setsar=1',
        '-f',
        'image2pipe',
        '-c:v',
        'png',
        'pipe:1',
      ]),
      '.png',
    )
    const anamorphic = repository.completeVideoImport(
      anamorphicProject.id,
      {
        ...project.stages.render!.payload,
        file: anamorphicFile,
        cover: anamorphicCover,
        width: 90,
        height: 160,
        manifestHash: anamorphicFile.sha256,
      },
      randomUUID(),
      ['anamorphic-test'],
    )
    const anamorphicInfo = await service.info(
      anamorphic.id,
      anamorphic.stages.render!.id,
      anamorphic.revision,
    )
    assert.deepEqual([anamorphicInfo.width, anamorphicInfo.height], [180, 160])
    const anamorphicSelected = await service.create({
      projectId: anamorphic.id,
      renderId: anamorphic.stages.render!.id,
      expected: anamorphic.revision,
      platform: 'douyin',
      time: 1,
      requestId: randomUUID(),
    })
    const anamorphicActual = JSON.parse(
      execFileSync(
        runtime.ffprobePath,
        [
          '-v',
          'error',
          '-show_entries',
          'stream=width,height',
          '-of',
          'json',
          files.path(anamorphicSelected.file),
        ],
        { encoding: 'utf8' },
      ),
    )
    assert.deepEqual(
      [anamorphicActual.streams[0].width, anamorphicActual.streams[0].height],
      [180, 160],
    )
    await assert.rejects(service.info(rotated.id, renderId, rotated.revision), /变化/)
    const stale = service.create({
      projectId: project.id,
      renderId,
      expected: project.revision,
      platform: 'douyin',
      time: 1,
      requestId: randomUUID(),
    })
    repository.save(
      project.id,
      'publish',
      project.stages.publish!.payload,
      project.revision,
      randomUUID(),
    )
    await assert.rejects(stale, /变化/)
    project = repository.get(project.id)
    writeFileSync(files.path(video), 'tampered')
    await assert.rejects(extract('douyin', 1), /修改/)
  } finally {
    await service.dispose()
    db.close()
    rmSync(root, { recursive: true, force: true })
  }
})
