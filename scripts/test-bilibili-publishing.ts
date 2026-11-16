import test from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import {
  copyFileSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { bilibiliUpdatePreload } from '../src/main/services/video-workflow/bilibili-update'
import { pathToFileURL } from 'node:url'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { runMigrations } from '../src/main/database/migrations'
import { VideoWorkflowRepository } from '../src/main/database/repositories/video-workflow-repository'
import { WorkflowFiles } from '../src/main/services/video-workflow/files'
import { BilibiliCatbus, supportedCatbusNode } from '../src/main/services/video-workflow/catbus'
import { BilibiliPublishingService } from '../src/main/services/video-workflow/bilibili'
import type { BilibiliPublishRequest } from '../src/shared/bilibili-publishing'

async function fixture(platform: 'bilibili' | 'douyin' = 'bilibili', tags: string[] = []) {
  const root = mkdtempSync(join(tmpdir(), 'bilibili-publishing-'))
  const db = new Database(':memory:')
  runMigrations(db)
  const repository = new VideoWorkflowRepository(db)
  const files = new WorkflowFiles(root, repository)
  let project = repository.create('自动发布验证')
  const file = await files.write(project.id, 'fixture-media', '.mp4')
  const cover = await files.write(project.id, 'fixture-cover', '.png')
  const subtitles = await files.write(project.id, 'fixture-subtitles', '.srt')
  const payloads = {
    brief: { text: '审核内容', duration: 10 },
    copy: { text: '审核文案' },
    storyboard: {
      mode: 'template',
      template: 'technical',
      scenes: [{ id: 'one', title: '标题', body: '正文', layout: 'title' }],
    },
    narration: { scenes: [{ id: 'one', text: '口播' }] },
    audio: {
      tracks: [{ sceneId: 'one', text: '口播', file, duration: 10 }],
      file,
      subtitles,
      duration: 10,
    },
    roughcut: {
      file,
      cover,
      duration: 10,
      width: 1920,
      height: 1080,
      compositionFiles: [file],
      compositionNames: ['index.html'],
      manifestHash: 'fixture',
      checks: 'ok',
    },
    render: {
      file,
      cover,
      duration: 10,
      width: 1920,
      height: 1080,
      compositionFiles: [file],
      compositionNames: ['index.html'],
      manifestHash: 'fixture',
      checks: 'ok',
    },
    publish: {
      platforms: {
        bilibili: {
          title: '审核标题',
          description: '@not-a-file $(never execute)',
          tags: ['技术'],
        },
        douyin: { title: '另一平台', description: '', tags },
      },
    },
  }
  for (const [stage, payload] of Object.entries(payloads)) {
    project = repository.save(
      project.id,
      stage as keyof typeof payloads,
      payload,
      project.revision,
      randomUUID(),
    )
    project = repository.approve(
      project.id,
      stage as keyof typeof payloads,
      project.stages[stage as keyof typeof payloads]!.id,
      project.revision,
      randomUUID(),
    )
  }
  mkdirSync(join(root, 'dist/platforms/bilibili/web'), { recursive: true })
  for (const name of ['api', 'commands'])
    copyFileSync(
      join(import.meta.dirname, `fixtures/bilibili-update-${name}.mjs`),
      join(root, `dist/platforms/bilibili/web/${name}.js`),
    )
  const cli = join(root, 'dist', 'cli', 'main.mjs')
  const creator = join(root, 'dist', 'platforms', 'douyin', 'web', 'creator.js')
  mkdirSync(join(root, 'dist', 'cli'), { recursive: true })
  mkdirSync(join(root, 'dist', 'platforms', 'douyin', 'web'), { recursive: true })
  writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module' }))
  writeFileSync(
    creator,
    `
function withExtras() {}
export function videoItem(info, posterUri, o, creationId) {
    const title = (o.title ?? '').trim();
    const desc = (o.desc ?? '').trim();
    const common = {
        text: title ? title + ' ' + desc : desc,
        caption: desc,
        item_title: title,
        text_extra: '[]',
        challenges: '[]',
        hashtag_source: '',
    };
    withExtras(common, o, false);
    return { item: { common } };
}
`,
  )
  copyFileSync(join(import.meta.dirname, 'fixtures/catbus.mjs'), cli)
  const runtime = {
    nodePath: process.execPath,
    catbusPath: cli,
    codexPath: '',
    claudePath: '',
    hyperframesPath: '',
    ffmpegPath: '',
    ffprobePath: '',
  }
  const client = new BilibiliCatbus(root, runtime, undefined, platform)
  const service = new BilibiliPublishingService(
    root,
    db,
    repository,
    files,
    () => runtime,
    () => {},
    platform,
  )
  const request: BilibiliPublishRequest = {
    projectId: project.id,
    expectedRevision: project.revision,
    requestId: randomUUID(),
    accountUid: platform === 'douyin' ? 'MS4wLjABAAAA_test_123' : '123',
    category: platform === 'douyin' ? '' : '17',
    visibility: 'public',
    copyright: 'original',
  }
  const finish = async (id: string) => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const record = service.list(project.id).find((item) => item.id === id)!
      if (!['queued', 'uploading', 'submitting'].includes(record.state)) return record
      await delay(20)
    }
    throw new Error('Publishing did not finish')
  }
  const close = async () => {
    await service.dispose()
    db.close()
    rmSync(root, { recursive: true, force: true })
  }
  return {
    root,
    db,
    repository,
    files,
    project,
    file,
    request,
    service,
    client,
    runtime,
    finish,
    close,
  }
}

test('douyin publishes structured topics with caption and title offsets', async () => {
  const context = await fixture('douyin')
  try {
    const record = context.service.start(context.request)
    await context.finish(record.id)
    const snapshot = record.snapshot
    snapshot.metadata = {
      title: '  霍去病 🐎  ',
      description: '  历史🐎故事 #霍去病  ',
      tags: ['霍去病', '#封狼居胥', '霍去病'],
    }
    await context.client.publish(
      snapshot,
      '/fixture.mp4',
      '/fixture.png',
      new AbortController().signal,
      () => {},
    )
    const common = JSON.parse(readFileSync(join(context.root, 'publish-body'), 'utf8'))
    const topics = JSON.parse(common.text_extra)
    assert.equal(topics.length, 2)
    assert.equal(common.caption, '历史🐎故事 #霍去病 #封狼居胥')
    assert.equal(common.text, '霍去病 🐎 ' + common.caption)
    assert.equal(common.hashtag_source, 'search/search')
    assert.equal(common.challenges, '[]')
    assert.deepEqual(
      topics.map((topic: { hashtag_name: string }) => topic.hashtag_name),
      ['霍去病', '封狼居胥'],
    )
    for (const topic of topics) {
      assert.equal(topic.type, 1)
      assert.equal(topic.hashtag_id, 0)
      assert.equal(common.text.slice(topic.start, topic.end), '#' + topic.hashtag_name)
      assert.equal(
        common.caption.slice(topic.caption_start, topic.caption_end),
        '#' + topic.hashtag_name,
      )
    }
    assert.equal(
      readdirSync(context.client.home).some((name) => name.startsWith('topics-')),
      false,
    )
  } finally {
    await context.close()
  }
})

test('both platforms freeze their own approved selected-frame cover for scheduled publication', async () => {
  for (const platform of ['bilibili', 'douyin'] as const) {
    const context = await fixture(platform)
    try {
      const selected = await context.files.write(
        context.project.id,
        'selected-frame-fixture',
        '.png',
      )
      const metadata = structuredClone(
        context.project.stages.publish!.payload,
      ) as import('../src/shared/video-workflow').PublishPayload
      metadata.platforms[platform].cover = {
        file: selected,
        feedFile: selected,
        sourceRenderId: context.project.stages.render!.id,
        method: 'frame',
        platform,
        frameSource: { videoSha256: context.file.sha256, time: 1, frame: 30, fps: 30 },
        width: platform === 'bilibili' ? 1600 : 1920,
        height: platform === 'bilibili' ? 900 : 1080,
        feedWidth: platform === 'bilibili' ? 1600 : 1920,
        feedHeight: platform === 'bilibili' ? 1200 : 1080,
        createdAt: new Date().toISOString(),
        feedback: '',
      }
      let project = context.repository.save(
        context.project.id,
        'publish',
        metadata,
        context.project.revision,
        randomUUID(),
      )
      project = context.repository.approve(
        project.id,
        'publish',
        project.stages.publish!.id,
        project.revision,
        randomUUID(),
      )
      const record = context.service.start({
        ...context.request,
        expectedRevision: project.revision,
        scheduleAt: new Date(Date.now() + 120000).toISOString(),
      })
      assert.equal(record.state, 'scheduled')
      assert.equal(record.snapshot.cover.id, selected.id)
      assert.equal(record.snapshot.metadata.cover?.platform, platform)
      assert.equal(record.snapshot.metadata.cover?.frameSource?.frame, 30)
      assert.equal(existsSync(join(context.root, 'calls')), false)
      context.repository.save(
        project.id,
        'publish',
        context.project.stages.publish!.payload,
        project.revision,
        randomUUID(),
      )
      assert.equal(record.snapshot.cover.id, selected.id)
    } finally {
      await context.close()
    }
  }
})

test('douyin rejects incompatible topic adapters and malformed names before starting the CLI upload', async () => {
  for (const mode of ['incompatible', 'invalid']) {
    const context = await fixture('douyin', mode === 'invalid' ? ['错误 话题'] : ['历史'])
    try {
      if (mode === 'incompatible') {
        const creator = join(context.root, 'dist', 'platforms', 'douyin', 'web', 'creator.js')
        writeFileSync(
          creator,
          readFileSync(creator, 'utf8').replace("text_extra: '[]'", "text_extra: 'changed'"),
        )
      }
      const record = await context.finish(context.service.start(context.request).id)
      assert.equal(record.state, 'failed')
      assert.match(record.error!, mode === 'invalid' ? /话题名称/ : /话题适配/)
      assert.equal(existsSync(join(context.root, 'calls')), false)
    } finally {
      await context.close()
    }
  }
})

test('douyin publishes its approved metadata with sec_uid and only supported platform parameters', async () => {
  const context = await fixture('douyin', ['历史'])
  try {
    assert.equal((await context.service.connection(true)).uid, context.request.accountUid)
    const record = await context.finish(context.service.start(context.request).id)
    assert.equal(record.state, 'reviewing')
    assert.equal(record.snapshot.metadata.title, '另一平台')
    assert.equal(record.externalId, '7531234567890123456')
    assert.equal(record.url, 'https://www.douyin.com/video/7531234567890123456')
    const args = JSON.parse(readFileSync(join(context.root, 'calls'), 'utf8').trim())
    assert.equal(args[0], 'douyin')
    assert.equal(args[args.indexOf('-a') + 1], 'mydashboard-douyin')
    assert.equal(args.includes('--category'), false)
    assert.equal(args.includes('--source'), false)
    const common = JSON.parse(readFileSync(join(context.root, 'publish-body'), 'utf8'))
    assert.equal(JSON.parse(common.text_extra)[0].hashtag_name, '历史')
    assert.equal(context.service.start(context.request).id, record.id)
    writeFileSync(join(context.root, 'mode'), 'private')
    assert.equal((await context.service.refresh(context.project.id, record.id)).state, 'private')
    assert.equal(context.repository.get(context.project.id).stages.publish!.status, 'approved')
  } finally {
    await context.close()
  }
})

test('douyin reports actual public visibility instead of assuming a requested private setting applied', async () => {
  const context = await fixture('douyin')
  try {
    const record = await context.finish(
      context.service.start({ ...context.request, visibility: 'private' }).id,
    )
    assert.equal((await context.service.refresh(context.project.id, record.id)).state, 'published')
  } finally {
    await context.close()
  }
})

test('douyin and bilibili use independent submission tables and idempotency keys', async () => {
  const context = await fixture('douyin')
  const bili = new BilibiliPublishingService(
    context.root,
    context.db,
    context.repository,
    context.files,
    () => context.runtime,
    () => {},
  )
  try {
    const dyRecord = context.service.start(context.request)
    const biliRecord = bili.start({ ...context.request, accountUid: '123', category: '17' })
    assert.notEqual(dyRecord.id, biliRecord.id)
    assert.equal(bili.list(context.project.id).length, 1)
    assert.equal(context.service.list(context.project.id).length, 1)
    assert.equal((await context.finish(dyRecord.id)).state, 'reviewing')
    for (
      let attempt = 0;
      attempt < 200 &&
      ['queued', 'uploading', 'submitting'].includes(bili.list(context.project.id)[0].state);
      attempt++
    )
      await delay(20)
    assert.equal(bili.list(context.project.id)[0].state, 'reviewing')
  } finally {
    await bili.dispose()
    await context.close()
  }
})

test('douyin and bilibili retain independent accounts and restart selection', async () => {
  const context = await fixture('douyin')
  const bili = new BilibiliPublishingService(
    context.root,
    context.db,
    context.repository,
    context.files,
    () => context.runtime,
    () => {},
  )
  let restarted: BilibiliPublishingService | undefined
  try {
    assert.equal((await context.service.connection(true)).uid, context.request.accountUid)
    assert.equal((await bili.connection(true)).uid, '123')
    const original = context.service.accounts().accounts[0]
    writeFileSync(join(context.root, 'login-user'), 'MS4wLjABAAAA_second_456')
    context.service.connect()
    for (let attempt = 0; attempt < 200; attempt++) {
      if ((await context.service.connection()).state !== 'connecting') break
      await delay(20)
    }
    assert.equal(context.service.accounts().accounts.length, 2)
    await context.service.selectAccount(original.id)
    assert.equal(bili.accounts().accounts.length, 1)
    await context.service.dispose()
    restarted = new BilibiliPublishingService(
      context.root,
      context.db,
      context.repository,
      context.files,
      () => context.runtime,
      () => {},
      'douyin',
    )
    assert.equal((await restarted.connection(true)).uid, original.uid)
    await restarted.removeAccount(original.id)
    assert.equal((await restarted.connection(true)).state, 'disconnected')
    assert.equal((await bili.connection(true)).uid, '123')
  } finally {
    await restarted?.dispose()
    await bili.dispose()
    await context.close()
  }
})

test('douyin rejects stale approvals, mismatched settings and modified files before upload', async () => {
  const context = await fixture('douyin')
  try {
    assert.throws(() => context.service.start({ ...context.request, expectedRevision: 0 }), /更新/)
    const payload = context.repository.get(context.project.id).stages.publish!.payload as {
      platforms: Record<string, unknown>
    }
    const saved = context.repository.save(
      context.project.id,
      'publish',
      {
        ...payload,
        platforms: {
          ...payload.platforms,
          douyin: {
            title: '另一平台',
            description: '',
            tags: [],
            submission: {
              category: '',
              categoryName: '科技',
              visibility: 'private',
              copyright: 'original',
              source: '',
            },
          },
        },
      },
      context.project.revision,
      randomUUID(),
    )
    assert.throws(
      () => context.service.start({ ...context.request, expectedRevision: saved.revision }),
      /审核/,
    )
    const approved = context.repository.approve(
      saved.id,
      'publish',
      saved.stages.publish!.id,
      saved.revision,
      randomUUID(),
    )
    assert.throws(
      () => context.service.start({ ...context.request, expectedRevision: approved.revision }),
      /不一致/,
    )
    writeFileSync(context.files.path(context.file), 'changed')
    const record = await context.finish(
      context.service.start({
        ...context.request,
        expectedRevision: approved.revision,
        visibility: 'private',
      }).id,
    )
    assert.equal(record.state, 'failed')
    assert.equal(existsSync(join(context.root, 'calls')), false)
  } finally {
    await context.close()
  }
})

test('douyin preserves unknown uploads and validates exact item ownership before reconciliation', async () => {
  const context = await fixture('douyin')
  try {
    writeFileSync(join(context.root, 'mode'), 'network')
    const record = await context.finish(context.service.start(context.request).id)
    assert.equal(record.state, 'unknown')
    assert.doesNotMatch(record.error!, /SECRET/)
    assert.equal(
      context.service.start({ ...context.request, requestId: randomUUID() }).id,
      record.id,
    )
    writeFileSync(join(context.root, 'mode'), 'wrong-owner')
    await assert.rejects(
      context.service.refresh(context.project.id, record.id, '7531234567890123456'),
      /不符/,
    )
    await assert.rejects(
      context.service.refresh(
        context.project.id,
        record.id,
        'https://www.douyin.com.evil.test/video/7531234567890123456',
      ),
      /有效/,
    )
    writeFileSync(join(context.root, 'mode'), '')
    assert.equal(
      (
        await context.service.refresh(
          context.project.id,
          record.id,
          'https://www.douyin.com/video/7531234567890123456',
        )
      ).state,
      'published',
    )
  } finally {
    await context.close()
  }
})

test('douyin requires the original account before uploading and identifies the correct platform', async () => {
  const context = await fixture('douyin')
  try {
    writeFileSync(join(context.root, 'mode'), 'wrong-account')
    const record = await context.finish(context.service.start(context.request).id)
    assert.equal(record.state, 'needs_auth')
    assert.match(record.error!, /抖音/)
    assert.equal(existsSync(join(context.root, 'calls')), false)
  } finally {
    await context.close()
  }
})

test('douyin rejects a response belonging to another platform and cancels login without losing bindings', async () => {
  const context = await fixture('douyin')
  try {
    writeFileSync(join(context.root, 'mode'), 'wrong-platform')
    assert.equal((await context.service.connection(true)).state, 'error')
    writeFileSync(join(context.root, 'mode'), '')
    assert.equal((await context.service.connection(true)).uid, context.request.accountUid)
    const previous = context.service.accounts()
    context.service.connect()
    await context.service.cancelLogin()
    assert.equal((await context.service.connection()).uid, context.request.accountUid)
    assert.deepEqual(context.service.accounts().accounts, previous.accounts)
  } finally {
    await context.close()
  }
})

test('requires the exact supported Node engine versions', () => {
  for (const version of ['22.22.2', '22.23.0', '24.15.0', '26.0.0', '27.0.0'])
    assert.equal(supportedCatbusNode(version), true)
  for (const version of ['20.19.0', '22.22.1', '23.0.0', '24.13.0', '25.0.0', 'invalid'])
    assert.equal(supportedCatbusNode(version), false)
})

test('binds isolated accounts, restores selection and checks old submissions with their original account', async () => {
  const context = await fixture()
  let restarted: BilibiliPublishingService | undefined
  try {
    assert.equal((await context.service.connection(true)).uid, '123')
    const original = context.service.accounts().accounts[0]
    assert.equal(original.uid, '123')
    writeFileSync(join(context.root, 'login-user'), '456')
    context.service.connect()
    for (
      let attempt = 0;
      attempt < 200 && (await context.service.connection()).state === 'connecting';
      attempt++
    )
      await delay(20)
    const second = context.service.accounts()
    assert.equal(second.accounts.length, 2)
    assert.equal(second.connection.uid, '456')
    assert.notEqual(second.selectedId, original.id)
    const record = await context.finish(
      context.service.start({ ...context.request, accountUid: '456' }).id,
    )
    assert.equal(record.state, 'reviewing')
    await context.service.selectAccount(original.id)
    assert.equal((await context.service.connection()).uid, '123')
    const reviewed = await context.service.refresh(context.project.id, record.id)
    assert.equal(reviewed.state, 'published')
    assert.equal(reviewed.snapshot.accountUid, '456')
    assert.equal((await context.service.connection()).uid, '123')
    await context.service.dispose()
    restarted = new BilibiliPublishingService(
      context.root,
      context.db,
      context.repository,
      context.files,
      () => context.runtime,
      () => {},
    )
    assert.equal((await restarted.connection(true)).uid, '123')
    assert.equal(restarted.accounts().accounts.length, 2)
    await restarted.removeAccount(second.selectedId!)
    assert.equal(restarted.accounts().accounts.length, 1)
    assert.equal((await restarted.connection()).uid, '123')
    await assert.rejects(restarted.refresh(context.project.id, record.id), /连接|绑定/)
    assert.equal(context.repository.get(context.project.id).stages.publish!.status, 'approved')
    await assert.rejects(restarted.selectAccount('../../outside'), /账号/)
  } finally {
    await restarted?.dispose()
    await context.close()
  }
})

test('cancelling or scanning the wrong account preserves the previously bound credentials', async () => {
  const context = await fixture()
  try {
    await context.service.connection(true)
    const original = context.service.accounts().accounts[0]
    context.service.connect()
    await context.service.cancelLogin()
    assert.equal((await context.service.connection()).uid, '123')
    assert.equal(context.service.accounts().accounts.length, 1)
    writeFileSync(join(context.root, 'login-user'), '456')
    context.service.connect(original.id)
    for (
      let attempt = 0;
      attempt < 200 && (await context.service.connection()).state === 'connecting';
      attempt++
    )
      await delay(20)
    assert.match((await context.service.connection()).error!, /不一致/)
    assert.equal(context.service.accounts().accounts.length, 1)
    assert.equal((await context.service.connection(true)).uid, '123')
    writeFileSync(join(context.root, 'login-user'), '123')
    context.service.connect()
    for (
      let attempt = 0;
      attempt < 200 && (await context.service.connection()).state === 'connecting';
      attempt++
    )
      await delay(20)
    assert.equal(
      context.service.accounts().accounts.length,
      1,
      'Rebinding the same UID must not create duplicates',
    )
    assert.equal((await context.service.connection()).uid, '123')
    const record = await context.finish(context.service.start(context.request).id)
    assert.equal(record.state, 'reviewing')
  } finally {
    await context.close()
  }
})

test('blocks account mutations during login and upload and never uploads with a different selected UID', async () => {
  const context = await fixture()
  try {
    await context.service.connection(true)
    const original = context.service.accounts().accounts[0]
    context.service.connect()
    await assert.rejects(context.service.selectAccount(original.id), /等待/)
    await assert.rejects(context.service.removeAccount(original.id), /等待/)
    await assert.rejects(context.service.refresh(context.project.id, 'any-record'), /等待/)
    assert.throws(() => context.service.start(context.request), /等待|执行/)
    await context.service.cancelLogin()
    const record = context.service.start(context.request)
    await assert.rejects(context.service.removeAccount(original.id), /等待/)
    await context.finish(record.id)
    const mismatch = await context.finish(
      context.service.start({ ...context.request, accountUid: '456', requestId: randomUUID() }).id,
    )
    assert.equal(mismatch.state, 'needs_auth')
    assert.equal(readFileSync(join(context.root, 'calls'), 'utf8').trim().split('\n').length, 1)
  } finally {
    await context.close()
  }
})

test('submits frozen approved files and returns a reviewing receipt without changing stage history', async () => {
  const context = await fixture()
  try {
    const started = context.service.start(context.request)
    const record = await context.finish(started.id)
    assert.equal(record.state, 'reviewing')
    assert.equal(record.externalId, 'BV1xx411c7mD')
    assert.equal(record.snapshot.renderRevisionId, context.project.stages.render!.id)
    assert.equal(record.snapshot.video.sha256, context.file.sha256)
    assert.equal(record.snapshot.metadata.title, '审核标题')
    assert.equal(
      context.repository.get(context.project.id).history.length,
      context.project.history.length,
    )
    assert.equal(
      readFileSync(join(context.root, 'description'), 'utf8'),
      '@not-a-file $(never execute)',
    )
    const args = JSON.parse(readFileSync(join(context.root, 'calls'), 'utf8').trim())
    assert.equal(args[args.indexOf('--visibility') + 1], 'public')
    assert.equal(args[args.indexOf('--category') + 1], '17')
    assert.equal(args[args.indexOf('-a') + 1], 'mydashboard-bili')
    assert.equal(context.repository.get(context.project.id).publications.length, 0)
  } finally {
    await context.close()
  }
})

test('deduplicates requests and blocks the same intent even after submission', async () => {
  const context = await fixture()
  try {
    const first = context.service.start(context.request)
    assert.equal(context.service.start(context.request).id, first.id)
    assert.throws(() => context.service.start({ ...context.request, category: '18' }), /请求/)
    assert.equal(
      context.service.start({ ...context.request, requestId: randomUUID() }).id,
      first.id,
    )
    await context.finish(first.id)
    assert.equal(
      context.service.start({ ...context.request, requestId: randomUUID() }).id,
      first.id,
    )
    assert.equal(readFileSync(join(context.root, 'calls'), 'utf8').trim().split('\n').length, 1)
  } finally {
    await context.close()
  }
})

test('rejects stale approvals, missing categories, implicit visibility and invalid repost sources', async () => {
  const context = await fixture()
  try {
    assert.throws(() => context.service.start({ ...context.request, expectedRevision: 0 }), /更新/)
    assert.throws(() => context.service.start({ ...context.request, category: '' }), /分区/)
    assert.throws(
      () =>
        context.service.start({
          ...context.request,
          visibility: undefined,
        } as unknown as BilibiliPublishRequest),
      /可见/,
    )
    assert.throws(
      () => context.service.start({ ...context.request, copyright: 'repost', source: '' }),
      /来源/,
    )
    const changed = context.repository.save(
      context.project.id,
      'publish',
      context.project.stages.publish!.payload,
      context.project.revision,
      randomUUID(),
    )
    assert.throws(
      () => context.service.start({ ...context.request, expectedRevision: changed.revision }),
      /审核/,
    )
    assert.equal(context.service.list(context.project.id).length, 0)
  } finally {
    await context.close()
  }
})

test('rejects submission settings that differ from the reviewed AI metadata', async () => {
  const context = await fixture()
  try {
    const payload = structuredClone(
      context.project.stages.publish!.payload,
    ) as import('../src/shared/video-workflow').PublishPayload
    payload.platforms.bilibili.submission = {
      category: '17',
      categoryName: '父分区 / 测试分区',
      visibility: 'private',
      copyright: 'original',
      source: '',
    }
    let project = context.repository.save(
      context.project.id,
      'publish',
      payload,
      context.project.revision,
      randomUUID(),
    )
    project = context.repository.approve(
      project.id,
      'publish',
      project.stages.publish!.id,
      project.revision,
      randomUUID(),
    )
    const request = { ...context.request, expectedRevision: project.revision }
    assert.throws(() => context.service.start(request), /已审核资料不一致/)
    assert.equal(context.service.list(project.id).length, 0)
    const record = await context.finish(
      context.service.start({ ...request, visibility: 'private' }).id,
    )
    assert.equal(record.state, 'reviewing')
    assert.equal(record.snapshot.metadata.submission?.visibility, 'private')
  } finally {
    await context.close()
  }
})

test('stops before upload when account ownership or approved media changes', async () => {
  const context = await fixture()
  try {
    writeFileSync(join(context.root, 'mode'), 'wrong-account')
    const account = await context.finish(context.service.start(context.request).id)
    assert.equal(account.state, 'needs_auth')
    writeFileSync(join(context.root, 'mode'), '')
    writeFileSync(context.files.path(context.file), 'tampered')
    const changed = await context.finish(
      context.service.start({ ...context.request, requestId: randomUUID() }).id,
    )
    assert.equal(changed.state, 'failed')
    assert.equal(
      context.service.list(context.project.id).some((item) => item.externalId),
      false,
    )
  } finally {
    await context.close()
  }
})

test('douyin preserves safe upstream reasons and status codes without exposing credentials or republishing', async () => {
  for (const mode of ['upstream-rejected', 'upstream-upload', 'upstream-secret']) {
    const context = await fixture('douyin')
    try {
      writeFileSync(join(context.root, 'mode'), mode)
      const result = await context.finish(context.service.start(context.request).id)
      assert.equal(result.state, 'unknown')
      assert.match(result.error ?? '', /10001/)
      if (mode === 'upstream-rejected') assert.match(result.error ?? '', /作品描述不符合要求/)
      if (mode === 'upstream-upload') assert.match(result.error ?? '', /视频上传申请失败/)
      assert.doesNotMatch(JSON.stringify(result), /SECRET|cookie=|example\.com/)
      assert.equal(
        context.service.start({ ...context.request, requestId: randomUUID() }).id,
        result.id,
      )
      assert.equal(readFileSync(join(context.root, 'calls'), 'utf8').trim().split('\n').length, 1)
    } finally {
      await context.close()
    }
  }
})

test('preserves unknown outcomes and sanitized errors instead of automatically republishing', async () => {
  const context = await fixture()
  try {
    writeFileSync(join(context.root, 'mode'), 'network')
    const result = await context.finish(context.service.start(context.request).id)
    assert.equal(result.state, 'unknown')
    assert.throws(
      () =>
        context.service.start({
          ...context.request,
          visibility: 'private',
          requestId: randomUUID(),
        }),
      /待核查/,
    )
    assert.doesNotMatch(result.error ?? '', /SECRET|cookie=/)
    assert.equal(
      context.service.start({ ...context.request, requestId: randomUUID() }).id,
      result.id,
    )
    assert.equal(readFileSync(join(context.root, 'calls'), 'utf8').trim().split('\n').length, 1)
  } finally {
    await context.close()
  }
})

test('keeps the frozen submission when metadata changes while uploading and synchronizes exact BV', async () => {
  const context = await fixture()
  try {
    writeFileSync(join(context.root, 'mode'), 'slow')
    const started = context.service.start(context.request)
    while (!context.service.list(context.project.id).some((item) => item.state === 'uploading'))
      await delay(10)
    context.repository.save(
      context.project.id,
      'publish',
      {
        platforms: {
          bilibili: { title: '修改后的标题', description: '', tags: ['其他'] },
          douyin: { title: '其他平台', description: '', tags: [] },
        },
      },
      context.project.revision,
      randomUUID(),
    )
    const result = await context.finish(started.id)
    assert.equal(result.state, 'reviewing')
    assert.equal(result.snapshot.metadata.title, '审核标题')
    const refreshed = await context.service.refresh(context.project.id, started.id)
    assert.equal(refreshed.state, 'published')
    assert.equal(context.repository.get(context.project.id).stages.publish!.status, 'review')
  } finally {
    await context.close()
  }
})

test('restart recovery treats interrupted upload as unknown and does not submit again', async () => {
  const context = await fixture()
  try {
    writeFileSync(join(context.root, 'mode'), 'slow')
    const started = context.service.start(context.request)
    while (!context.service.list(context.project.id).some((item) => item.state === 'uploading'))
      await delay(10)
    await context.service.dispose()
    const restarted = new BilibiliPublishingService(
      context.root,
      context.db,
      context.repository,
      context.files,
      () => context.runtime,
      () => {},
    )
    assert.equal(restarted.list(context.project.id)[0].state, 'unknown')
    assert.equal(restarted.start({ ...context.request, requestId: randomUUID() }).id, started.id)
    await restarted.dispose()
  } finally {
    await context.close()
  }
})

test('rejects a parent category before uploading and permits an explicit corrected retry', async () => {
  const context = await fixture()
  try {
    const record = await context.finish(
      context.service.start({ ...context.request, category: '1' }).id,
    )
    assert.equal(record.state, 'failed')
    assert.match(record.error!, /子分区/)
    assert.equal(existsSync(join(context.root, 'calls')), false)
    assert.equal(
      (
        await context.finish(
          context.service.start({ ...context.request, requestId: randomUUID() }).id,
        )
      ).state,
      'reviewing',
    )
  } finally {
    await context.close()
  }
})

test('risk control requires explicit acknowledgement before a new attempt', async () => {
  const context = await fixture()
  try {
    writeFileSync(join(context.root, 'mode'), 'risk')
    const record = await context.finish(context.service.start(context.request).id)
    assert.equal(record.state, 'risk_control')
    assert.doesNotMatch(record.error!, /SECRET/)
    assert.equal(
      context.service.start({ ...context.request, requestId: randomUUID() }).id,
      record.id,
    )
    context.service.confirmNotSubmitted(context.project.id, record.id)
    writeFileSync(join(context.root, 'mode'), '')
    const retry = await context.finish(
      context.service.start({ ...context.request, requestId: randomUUID() }).id,
    )
    assert.notEqual(retry.id, record.id)
    assert.equal(retry.state, 'reviewing')
    assert.throws(() => context.service.confirmNotSubmitted(context.project.id, retry.id), /只有/)
  } finally {
    await context.close()
  }
})

test('malformed submission receipts remain unknown and exact-BV reconciliation checks ownership', async () => {
  const context = await fixture()
  try {
    writeFileSync(join(context.root, 'mode'), 'bad-receipt')
    const record = await context.finish(context.service.start(context.request).id)
    assert.equal(record.state, 'unknown')
    assert.equal(record.url, null)
    writeFileSync(join(context.root, 'mode'), 'wrong-owner')
    await assert.rejects(
      context.service.refresh(context.project.id, record.id, 'BV1xx411c7mD'),
      /不符/,
    )
    assert.equal(context.service.list(context.project.id)[0].state, 'unknown')
    writeFileSync(join(context.root, 'mode'), '')
    const reconciled = await context.service.refresh(
      context.project.id,
      record.id,
      'https://www.bilibili.com/video/BV1xx411c7mD',
    )
    assert.equal(reconciled.state, 'published')
    assert.equal(reconciled.externalId, 'BV1xx411c7mD')
    assert.equal(
      readdirSync(context.client.home).some((name) => name.startsWith('description-')),
      false,
    )
  } finally {
    await context.close()
  }
})

test('sends explicit private visibility and repost source without announcing public publication', async () => {
  const context = await fixture()
  try {
    const record = await context.finish(
      context.service.start({
        ...context.request,
        visibility: 'private',
        copyright: 'repost',
        source: '原作者许可来源',
      }).id,
    )
    assert.equal(record.state, 'reviewing')
    const args = JSON.parse(readFileSync(join(context.root, 'calls'), 'utf8').trim())
    assert.equal(args[args.indexOf('--visibility') + 1], 'private')
    assert.equal(args[args.indexOf('--source') + 1], '原作者许可来源')
    assert.equal((await context.service.refresh(context.project.id, record.id)).state, 'private')
  } finally {
    await context.close()
  }
})

test('cancels a queued submission before any upload starts', async () => {
  const context = await fixture()
  try {
    const record = context.service.start(context.request)
    const cancelled = await context.service.cancel(context.project.id, record.id)
    assert.equal(cancelled.state, 'cancelled')
    assert.equal(existsSync(join(context.root, 'calls')), false)
  } finally {
    await context.close()
  }
})

test('disconnect cancels QR login and removes isolated local credentials', async () => {
  const context = await fixture()
  try {
    assert.equal(context.service.connect().state, 'connecting')
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await context.service.connection()).qrCode) break
      await delay(20)
    }
    assert.ok((await context.service.connection()).qrCode?.startsWith('data:image/png;base64,'))
    assert.equal((await context.service.disconnect()).state, 'disconnected')
    assert.equal(existsSync(context.client.home), false)
    assert.equal(existsSync(context.files.path(context.file)), true)
  } finally {
    await context.close()
  }
})

test('update requires a successful original from this project and the same account', async () => {
  const c = await fixture()
  try {
    assert.throws(
      () => c.service.start({ ...c.request, updateSubmissionId: 'missing' }),
      /原作品|记录/,
    )
    const original = await c.finish(c.service.start(c.request).id)
    assert.throws(
      () =>
        c.service.start({ ...c.request, requestId: randomUUID(), updateSubmissionId: original.id }),
      /通过|原作品/,
    )
    await c.service.refresh(c.project.id, original.id)
    assert.throws(
      () =>
        c.service.start({
          ...c.request,
          requestId: randomUUID(),
          accountUid: '456',
          updateSubmissionId: original.id,
        }),
      /账号/,
    )
    assert.throws(
      () =>
        c.service.start({
          ...c.request,
          requestId: randomUUID(),
          updateSubmissionId: original.id,
          scheduleAt: new Date(Date.now() + 120000).toISOString(),
        }),
      /定时/,
    )
  } finally {
    await c.close()
  }
})

test('updates freeze the original ID, deduplicate and require new CID before published', async () => {
  const c = await fixture()
  try {
    const original = await c.finish(c.service.start(c.request).id)
    await c.service.refresh(c.project.id, original.id)
    const request = { ...c.request, requestId: randomUUID(), updateSubmissionId: original.id }
    const started = c.service.start(request)
    assert.equal(started.snapshot.updateTarget?.externalId, original.externalId)
    assert.equal(c.service.start(request).id, started.id)
    const updated = await c.finish(started.id)
    assert.equal(updated.state, 'reviewing', updated.error ?? '')
    assert.equal(updated.externalId, original.externalId)
    assert.equal(updated.uploadedCid, '200')
    assert.equal((await c.service.refresh(c.project.id, updated.id)).state, 'reviewing')
    writeFileSync(join(c.root, 'mode'), 'new-content')
    assert.equal((await c.service.refresh(c.project.id, updated.id)).state, 'published')
    assert.equal(
      c.service.start({ ...request, requestId: randomUUID(), updateSubmissionId: updated.id }).id,
      updated.id,
    )
    assert.equal(JSON.parse(readFileSync(join(c.root, 'update-body'), 'utf8')).aid, 12345)
    assert.equal(JSON.parse(readFileSync(join(c.root, 'update-body'), 'utf8')).mission_id, 99)
  } finally {
    await c.close()
  }
})

const installedCatbus =
  process.env.HEREIN_CATBUS_TEST_ENTRY ??
  join(
    homedir(),
    '.local/share/mydashboard/publishing-tools/node_modules/catbus-cli/dist/cli/main.js',
  )

test(
  'real installed Catbus loader edits the original archive and rejects unsupported targets before upload',
  { skip: !existsSync(installedCatbus) },
  () => {
    const entry = installedCatbus
    const root = mkdtempSync(join(tmpdir(), 'bili-real-loader-'))
    try {
      const receipt = join(root, 'receipt.json')
      const preload = join(root, 'update.mjs')
      writeFileSync(
        preload,
        bilibiliUpdatePreload(
          entry,
          {
            sourceRecordId: 'local',
            externalId: 'BV1xx411c7mD',
            url: 'https://www.bilibili.com/video/BV1xx411c7mD',
            accountUid: '123',
          },
          receipt,
        ),
      )
      const inspectPreload = join(root, 'inspect.mjs')
      writeFileSync(
        inspectPreload,
        bilibiliUpdatePreload(
          entry,
          {
            sourceRecordId: 'local',
            externalId: 'BV1xx411c7mD',
            url: 'https://www.bilibili.com/video/BV1xx411c7mD',
            accountUid: '123',
          },
          '',
          true,
        ),
      )
      for (const mode of [
        'success',
        'inspect',
        'empty-description',
        'numeric-settings',
        'missing-settings',
        'invalid-settings',
        'wrong-owner',
        'multipart',
        'wrong-account',
      ]) {
        const script = `
        import * as api from ${JSON.stringify(pathToFileURL(join(entry, '../../platforms/bilibili/web/api.js')).href)};
        const mode = ${JSON.stringify(mode)};
        let writes = 0;
        const description = mode === 'empty-description' ? '' : 'New description';
        const b = { mid: mode === 'wrong-account' ? 999 : 123, csrf: 'fixture', wbi: async query => query,
          get: async (url) => url.includes('/wbi/view')
            ? { bvid: 'BV1xx411c7mD', aid: 12345, owner: { mid: mode === 'wrong-owner' ? 999 : 123 }, pages: mode === 'multipart' ? [{cid: 100}, {cid: 101}] : [{cid: 100}] }
            : { archive: { aid: 12345, mission_id: 99, subtitle: {open: 1}, ...(mode === 'missing-settings' ? {} : mode === 'numeric-settings' ? {human_type2: 5, recreate: 1} : {human_type2: {id: mode === 'invalid-settings' ? 'bad' : 0, name: ''}, recreate: {auth: 1, editable: 1, switch: -1}}), desc: 'Old description', desc_format_id: 1, desc_v2: [{raw_text: '@old', type: 2, biz_id: '999'}] }, videos: [{cid: 100, filename: 'old', status: 0, aid: 12345, reject_reason: 'readonly'}] },
          post: async (url, options) => { writes++; if (!url.endsWith('/x/vu/web/edit')) throw Error('create endpoint');
            if (options.json.human_type2 !== (mode === 'numeric-settings' ? 5 : 0) || options.json.recreate !== (mode === 'numeric-settings' ? 1 : mode === 'missing-settings' ? 0 : -1)) throw Error('archive response objects leaked into edit request');
            if (options.json.new_web_edit !== 1) throw Error('missing web edit mode');
            if (options.json.aid !== 12345 || options.json.mission_id !== 99 || options.json.subtitle.open !== 1 || options.json.videos[0].cid !== 200) throw Error('lost metadata');
            if (JSON.stringify(Object.keys(options.json.videos[0]).sort()) !== JSON.stringify(['cid','desc','filename','title'])) throw Error('readonly video metadata');
            if (options.json.desc !== description || options.json.desc_format_id !== 0 || JSON.stringify(options.json.desc_v2) !== JSON.stringify(description ? [{raw_text:description,type:1,biz_id:''}] : [])) throw Error('stale rich description');
            return {aid: 12345}; }
        };
        try {
          const original = await api.hereinPrepareUpdate(b);
          if (mode === 'inspect') {
            globalThis.hereinMockBili = b;
            const { register } = await import('node:module');
            const hook = 'export async function load(url, context, nextLoad) {' +
              'const result = await nextLoad(url, context);' +
              'if (!url.endsWith("/platforms/bilibili/web/client.js")) return result;' +
              'return { ...result, source: String(result.source).replace("export async function bili(ctx) {", "export async function bili(ctx) { return globalThis.hereinMockBili;") }; }';
            register('data:text/javascript;base64,' + Buffer.from(hook).toString('base64'), import.meta.url);
            const commands = await import(${JSON.stringify(pathToFileURL(join(entry, '../../platforms/bilibili/web/commands.js')).href)});
            const inspected = await commands.itemGet({args: {item: 'BV1xx411c7mD'}});
            console.log(JSON.stringify({ writes, cid: inspected.videos[0].cid })); process.exit(0);
          }
          const result = await api.submitArchive(b, { videos: [{filename: 'upload', biz_id: 200}], title: 'New', desc: description, private: false });
          console.log(JSON.stringify({writes, id: result.bvid}));
        } catch(error) { console.log(JSON.stringify({writes, code: error.code})); }
      `
        const result = JSON.parse(
          execFileSync(
            'node',
            [
              '--import',
              mode === 'inspect' ? inspectPreload : preload,
              '--input-type=module',
              '-e',
              script,
            ],
            {
              encoding: 'utf8',
            },
          ),
        )
        if (mode === 'inspect') assert.deepEqual(result, { writes: 0, cid: 100 })
        else if (
          ['success', 'empty-description', 'numeric-settings', 'missing-settings'].includes(mode)
        )
          assert.deepEqual(result, { writes: 1, id: 'BV1xx411c7mD' })
        else assert.deepEqual(result, { writes: 0, code: 'UPDATE_INVALID' })
      }
      assert.deepEqual(JSON.parse(readFileSync(receipt, 'utf8')), {
        cid: '200',
        filename: 'upload',
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  },
)

test('unknown updates retain original ID and require explicit verified recovery before retry', async () => {
  const c = await fixture()
  try {
    const original = await c.finish(c.service.start(c.request).id)
    await c.service.refresh(c.project.id, original.id)
    writeFileSync(join(c.root, 'mode'), 'network')
    const request = { ...c.request, requestId: randomUUID(), updateSubmissionId: original.id }
    const unknown = await c.finish(c.service.start(request).id)
    assert.equal(unknown.state, 'unknown')
    assert.equal(unknown.externalId, original.externalId)
    assert.equal(unknown.uploadedCid, '200')
    const checked = await c.service.refresh(c.project.id, unknown.id)
    assert.equal(checked.state, 'unknown')
    assert.match(checked.error ?? '', /尚未核实/)
    assert.doesNotMatch(checked.error ?? '', /待审核/)
    assert.equal(c.service.start({ ...request, requestId: randomUUID() }).id, unknown.id)
    assert.throws(
      () => c.service.start({ ...request, requestId: randomUUID(), visibility: 'private' }),
      /待核查/,
    )
    writeFileSync(join(c.root, 'mode'), 'new-content')
    await assert.rejects(c.service.confirmNotSubmitted(c.project.id, unknown.id), /已有本次更新/)
    writeFileSync(join(c.root, 'mode'), '')
    assert.equal((await c.service.confirmNotSubmitted(c.project.id, unknown.id)).state, 'failed')
    const retry = await c.finish(c.service.start({ ...request, requestId: randomUUID() }).id)
    assert.equal(retry.state, 'reviewing', retry.error ?? '')
    assert.equal(retry.externalId, original.externalId)
    assert.equal(retry.snapshot.updateTarget?.sourceRecordId, original.id)
  } finally {
    await c.close()
  }
})

test('restart recovers durable update content receipt before reconciliation and manual recovery', async () => {
  const c = await fixture()
  let restarted: BilibiliPublishingService | undefined
  try {
    const original = await c.finish(c.service.start(c.request).id)
    await c.service.refresh(c.project.id, original.id)
    const update = await c.finish(
      c.service.start({ ...c.request, requestId: randomUUID(), updateSubmissionId: original.id })
        .id,
    )
    await c.service.dispose()
    const interrupted = {
      ...update,
      state: 'uploading',
      uploadedCid: undefined,
      uploadedFilename: undefined,
    }
    c.db
      .prepare('UPDATE video_bilibili_submissions SET state=?, record=? WHERE id=?')
      .run('uploading', JSON.stringify(interrupted), update.id)
    const receipt = join(c.client.home, `update-receipt-${update.id}.json`)
    writeFileSync(receipt, JSON.stringify({ cid: '200', filename: 'new.mp4' }))
    restarted = new BilibiliPublishingService(
      c.root,
      c.db,
      c.repository,
      c.files,
      () => c.runtime,
      () => {},
    )
    assert.equal(restarted.list(c.project.id)[0].uploadedCid, '200')
    assert.equal(restarted.list(c.project.id)[0].uploadedFilename, 'new.mp4')
    assert.equal(existsSync(receipt), false, 'Receipt is consumed only after database persistence')
    assert.equal((await restarted.refresh(c.project.id, update.id)).state, 'unknown')
    writeFileSync(join(c.root, 'mode'), 'new-content')
    await assert.rejects(restarted.confirmNotSubmitted(c.project.id, update.id), /已有本次更新/)
    assert.equal((await restarted.refresh(c.project.id, update.id)).state, 'published')
  } finally {
    await restarted?.dispose()
    await c.close()
  }
})

test('incompatible update adapter fails before upload without falling back to create', async () => {
  const c = await fixture()
  try {
    const original = await c.finish(c.service.start(c.request).id)
    await c.service.refresh(c.project.id, original.id)
    writeFileSync(
      join(c.root, 'dist/platforms/bilibili/web/commands.js'),
      'export function changed() {}',
    )
    const update = await c.finish(
      c.service.start({ ...c.request, requestId: randomUUID(), updateSubmissionId: original.id })
        .id,
    )
    assert.equal(update.state, 'failed')
    assert.match(update.error ?? '', /不兼容/)
    assert.equal(update.externalId, original.externalId)
    assert.equal(readFileSync(join(c.root, 'calls'), 'utf8').trim().split('\n').length, 1)
  } finally {
    await c.close()
  }
})

test('definitive update rejection is retryable and legacy 21001 reconciles read-only', async () => {
  const c = await fixture()
  try {
    const original = await c.finish(c.service.start(c.request).id)
    await c.service.refresh(c.project.id, original.id)
    writeFileSync(join(c.root, 'mode'), 'update-21001')
    const update = await c.finish(
      c.service.start({ ...c.request, requestId: randomUUID(), updateSubmissionId: original.id })
        .id,
    )
    assert.equal(update.state, 'failed')
    assert.equal(update.platformCode, 21001)
    assert.match(update.error ?? '', /21001/)
    const legacy = {
      ...update,
      state: 'unknown',
      platformCode: undefined,
      uploadedFilename: undefined,
      error: 'B 站未返回可确认的投稿结果；平台信息：参数错误；状态码 21001',
    }
    c.db
      .prepare('UPDATE video_bilibili_submissions SET state=?,record=? WHERE id=?')
      .run('unknown', JSON.stringify(legacy), update.id)
    const calls = readFileSync(join(c.root, 'calls'), 'utf8')
    const checked = await c.service.refresh(c.project.id, update.id)
    assert.equal(checked.state, 'failed')
    assert.equal(checked.platformCode, 21001)
    assert.equal(readFileSync(join(c.root, 'calls'), 'utf8'), calls)
    writeFileSync(join(c.root, 'mode'), 'old-content-review')
    const stillFailed = await c.service.refresh(c.project.id, update.id)
    assert.equal(stillFailed.state, 'failed')
    assert.equal(stillFailed.platformCode, 21001)
    writeFileSync(join(c.root, 'mode'), '')
    const retry = await c.finish(
      c.service.start({ ...c.request, requestId: randomUUID(), updateSubmissionId: original.id })
        .id,
    )
    assert.notEqual(retry.id, update.id)
    assert.equal(retry.externalId, original.externalId)
    assert.equal(retry.state, 'reviewing')
  } finally {
    await c.close()
  }
})

test('creator filename proves replacement retaining original part CID and review states are authoritative', async () => {
  const c = await fixture()
  try {
    const original = await c.finish(c.service.start(c.request).id)
    await c.service.refresh(c.project.id, original.id)
    const update = await c.finish(
      c.service.start({ ...c.request, requestId: randomUUID(), updateSubmissionId: original.id })
        .id,
    )
    assert.equal(update.uploadedFilename, 'new.mp4')
    writeFileSync(join(c.root, 'mode'), 'same-cid-new-file-review')
    assert.equal((await c.service.refresh(c.project.id, update.id)).state, 'reviewing')
    writeFileSync(join(c.root, 'mode'), 'same-cid-new-file-rejected')
    assert.equal((await c.service.refresh(c.project.id, update.id)).state, 'rejected')
    writeFileSync(join(c.root, 'mode'), 'same-cid-new-file-pending-part')
    assert.equal((await c.service.refresh(c.project.id, update.id)).state, 'rejected')
    writeFileSync(join(c.root, 'mode'), 'same-cid-new-file-missing-status')
    assert.equal((await c.service.refresh(c.project.id, update.id)).state, 'rejected')
    writeFileSync(join(c.root, 'mode'), 'same-cid-new-file')
    assert.equal((await c.service.refresh(c.project.id, update.id)).state, 'published')
  } finally {
    await c.close()
  }
})

test('legacy CID-only update receipts still reconcile when exact new CID is visible', async () => {
  const c = await fixture()
  try {
    const original = await c.finish(c.service.start(c.request).id)
    await c.service.refresh(c.project.id, original.id)
    const update = await c.finish(
      c.service.start({ ...c.request, requestId: randomUUID(), updateSubmissionId: original.id })
        .id,
    )
    const legacy = { ...update, state: 'unknown', uploadedFilename: undefined }
    c.db
      .prepare('UPDATE video_bilibili_submissions SET state=?,record=? WHERE id=?')
      .run('unknown', JSON.stringify(legacy), update.id)
    assert.equal((await c.service.refresh(c.project.id, update.id)).state, 'unknown')
    writeFileSync(join(c.root, 'mode'), 'new-content')
    assert.equal((await c.service.refresh(c.project.id, update.id)).state, 'published')
  } finally {
    await c.close()
  }
})
