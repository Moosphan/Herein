import Database from 'better-sqlite3'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { VideoWorkflowRepository } from '../src/main/database/repositories/video-workflow-repository'
import { WorkflowFiles } from '../src/main/services/video-workflow/files'

async function seed() {
  const root = process.argv[2]
  const db = new Database(join(root, 'database/dashboard.db'))
  const repository = new VideoWorkflowRepository(db)
  const files = new WorkflowFiles(root, repository)
  let project = repository.get(JSON.parse(readFileSync(join(root, 'seed-project.json'), 'utf8')).id)
  const image = async (height: number) =>
    files.write(
      project.id,
      execFileSync('ffmpeg', [
        '-v',
        'error',
        '-f',
        'lavfi',
        '-i',
        `color=c=purple:s=1600x${height}`,
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
  const publication = project.stages.publish!.payload
  publication.platforms.bilibili.cover = {
    file: await image(900),
    feedFile: await image(1200),
    sourceRenderId: project.stages.render!.id,
    method: process.argv.includes('--frame') ? 'frame' : 'code',
    ...(process.argv.includes('--frame')
      ? {
          platform: 'bilibili',
          frameSource: {
            videoSha256: project.stages.render!.payload.file.sha256,
            time: 3,
            frame: 90,
            fps: 30,
          },
        }
      : {}),
    createdAt: new Date().toISOString(),
    feedback: '保留旧封面',
    width: 1600,
    height: 900,
    feedWidth: 1600,
    feedHeight: 1200,
  }
  if (process.argv.includes('--no-cover')) delete publication.platforms.bilibili.cover
  project = repository.save(project.id, 'publish', publication, project.revision, randomUUID())
  project = repository.approve(
    project.id,
    'publish',
    project.stages.publish!.id,
    project.revision,
    randomUUID(),
  )
  project = repository.save(
    project.id,
    'render',
    { ...project.stages.render!.payload, duration: 2 },
    project.revision,
    randomUUID(),
  )
  project = repository.approve(
    project.id,
    'render',
    project.stages.render!.id,
    project.revision,
    randomUUID(),
  )
  writeFileSync(join(root, 'seed-project.json'), JSON.stringify(project))
  db.close()
}
seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
