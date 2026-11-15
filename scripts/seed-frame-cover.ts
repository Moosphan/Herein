import Database from 'better-sqlite3'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { runMigrations } from '../src/main/database/migrations'
import { VideoWorkflowRepository } from '../src/main/database/repositories/video-workflow-repository'
import { WorkflowFiles } from '../src/main/services/video-workflow/files'
import { WorkflowRuntimeManager } from '../src/main/services/video-workflow/cli'

async function seed() {
  const root = process.argv[2]
  mkdirSync(join(root, 'database'), { recursive: true })
  const db = new Database(join(root, 'database/dashboard.db'))
  runMigrations(db)
  const repository = new VideoWorkflowRepository(db)
  const files = new WorkflowFiles(root, repository)
  const runtime = new WorkflowRuntimeManager(root).get()
  let project = repository.create('两平台选帧封面验证')
  const source = join(root, 'source.mp4')
  execFileSync(runtime.ffmpegPath, [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    "color=c=red:s=360x640:r=30:d=4,drawbox=x=0:y=0:w=iw:h=ih:color=blue:t=fill:enable='gte(t,2)'",
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    source,
  ])
  const file = await files.import(project.id, source)
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
      file,
      cover,
      duration: 4,
      width: 360,
      height: 640,
      compositionFiles: [],
      compositionNames: [],
      manifestHash: file.sha256,
      checks: 'isolated test fixture',
      imported: { filename: 'source.mp4', description: '红色开头，蓝色后半段，选帧检验' },
    },
    randomUUID(),
    ['isolated-test'],
  )
  project = repository.approve(
    project.id,
    'publish',
    project.stages.publish!.id,
    project.revision,
    randomUUID(),
  )
  writeFileSync(join(root, 'seed-project.json'), JSON.stringify(project))
  db.close()
}
void seed()
