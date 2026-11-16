import { readFileSync, existsSync, mkdirSync, realpathSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import {
  type BilibiliCategory,
  type BilibiliPublishSnapshot,
} from '../../../shared/bilibili-publishing'
import type { VideoPlatform, WorkflowRuntime } from '../../../shared/video-workflow'
import { PUBLISHING_PLATFORMS, validPublishingUid } from '../../../shared/platform-publishing'
import { catbusProcess } from './catbus-process'
import { publishingAccountHome } from './bilibili-accounts'
import { douyinTopicPreload } from './douyin-topics'
import { bilibiliUpdatePreload } from './bilibili-update'

const MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: '请先扫码连接 B 站账号',
  AUTH_EXPIRED: 'B 站登录已过期，请重新扫码连接',
  RISK_CONTROL: 'B 站触发平台验证或风控，已停止，请前往创作中心核查',
  NETWORK: '网络中断，请核查平台投稿结果后再处理',
  UPSTREAM: 'B 站未返回可确认的投稿结果，请核查创作中心',
  USAGE: '投稿参数未被 CLI 接受，请检查分区与发布资料',
  UNSUPPORTED: '当前 CLI 不支持此操作',
  PROCESS: '无法运行 Catbus，请检查执行环境中的 Node 和 Catbus 路径',
  TIMEOUT: 'Catbus 执行超时，请核查网络和平台结果',
  CANCELLED: '操作已停止；已提交的稿件不会被自动撤回',
  OUTPUT_LIMIT: 'CLI 输出异常，操作已停止',
  INVALID_RESPONSE: 'CLI 未返回有效回执，请核查平台投稿结果',
  UPDATE_UNSUPPORTED: '当前 Catbus 不兼容原作品更新，已停止，请配置原版 Catbus 0.2.1',
  UPDATE_REJECTED: 'B 站拒绝此次更新，参数错误（状态码 21001），可手动重试更新原作品',
  UPDATE_INVALID: '原作品账号、分P或资料无法核实，已停止更新，请在创作中心核查',
  TOPIC_INVALID: '抖音话题名称不能包含空格、# 或 @，请修改标签并重新审核',
  TOPIC_UNSUPPORTED: '当前 Catbus 文件不兼容抖音话题适配，已停止投稿，请配置原版 Catbus 0.2.1',
}
function upstreamDetail(error: Record<string, unknown>) {
  const detail =
    error.detail && typeof error.detail === 'object' && !Array.isArray(error.detail)
      ? (error.detail as Record<string, unknown>)
      : {}
  const status = detail.status_code ?? detail.code
  const statusText =
    typeof status === 'number' && Number.isSafeInteger(status) && Math.abs(status) < 1e9
      ? `状态码 ${status}`
      : ''
  const message = typeof error.message === 'string' ? error.message.trim() : ''
  const phases: Record<string, string> = {
    'ApplyUploadInner 失败': '视频上传申请失败',
    'CommitUploadInner 失败': '视频上传确认失败',
    'ApplyImageUpload 失败': '封面上传申请失败',
    'CommitImageUpload 失败': '封面上传确认失败',
  }
  const reason =
    phases[message] ??
    (message.length <= 240 &&
    /^[\p{Script=Han}\d\s，。：；！？、（）《》“”‘’「」【】.,:;!?()-]+$/u.test(message)
      ? message.replace(/\s+/g, ' ')
      : '')
  return [reason, statusText].filter(Boolean).join('；')
}
export class CatbusFailure extends Error {
  uploadedFilename?: string
  platformCode?: number
  uploadedCid?: string
  constructor(
    readonly code: string,
    platform: VideoPlatform = 'bilibili',
    detail = '',
  ) {
    super(
      (MESSAGES[code] ?? 'Catbus 操作失败，请检查运行环境和平台状态').replaceAll(
        'B 站',
        PUBLISHING_PLATFORMS[platform].label,
      ) + (detail ? `；平台信息：${detail}` : ''),
    )
  }
}
export function supportedCatbusNode(version: string) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) return false
  const [major, minor, patch] = version.split('.').map(Number)
  return (
    major >= 26 ||
    (major === 24 && minor >= 15) ||
    (major === 22 && (minor > 22 || (minor === 22 && patch >= 2)))
  )
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CatbusFailure('INVALID_RESPONSE')
  return value as Record<string, unknown>
}
export function bilibiliVideoId(value: string) {
  if (/^BV[A-Za-z0-9]{10}$/.test(value)) return value
  try {
    const url = new URL(value)
    if (
      url.protocol === 'https:' &&
      ['www.bilibili.com', 'bilibili.com'].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port
    ) {
      const match = url.pathname.match(/^\/video\/(BV[A-Za-z0-9]{10})\/?$/)
      if (match) return match[1]
    }
  } catch {}
  throw new Error('请填写有效 BV 号或 B 站 HTTPS 作品链接')
}
export function publishingVideoId(platform: VideoPlatform, value: string) {
  if (platform === 'bilibili') return bilibiliVideoId(value)
  if (/^\d{10,30}$/.test(value)) return value
  try {
    const url = new URL(value)
    if (
      url.protocol === 'https:' &&
      ['www.douyin.com', 'douyin.com'].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port
    ) {
      const match = url.pathname.match(/^\/video\/(\d{10,30})\/?$/)
      if (match) return match[1]
    }
  } catch {}
  throw new Error('请填写有效抖音作品 ID 或 HTTPS 视频链接')
}

export function publishingVideoUrl(platform: VideoPlatform, value: string) {
  return `https://www.${platform}.com/video/${publishingVideoId(platform, value)}`
}

export class CatbusPublishingClient {
  readonly home: string
  private checked?: Promise<void>
  constructor(
    root: string,
    private runtime: WorkflowRuntime,
    accountId: string | undefined = undefined,
    private platform: VideoPlatform = 'bilibili',
  ) {
    this.home = publishingAccountHome(
      root,
      accountId ?? PUBLISHING_PLATFORMS[platform].account,
      platform,
    )
    mkdirSync(this.home, { recursive: true, mode: 0o700 })
  }
  private async run(
    args: string[],
    signal?: AbortSignal,
    progress?: (text: string) => void,
    metadata?: BilibiliPublishSnapshot['metadata'],
    update?: {
      target: NonNullable<BilibiliPublishSnapshot['updateTarget']>
      receipt: string
      inspect?: boolean
    },
  ) {
    const configured = this.runtime.catbusPath
    if (
      !configured ||
      !isAbsolute(configured) ||
      !existsSync(configured) ||
      !isAbsolute(this.runtime.nodePath) ||
      !existsSync(this.runtime.nodePath)
    )
      throw new CatbusFailure('PROCESS', this.platform)
    let entry = realpathSync(configured)
    if (/\.cmd$/i.test(entry))
      entry = join(dirname(entry), 'node_modules', 'catbus-cli', 'dist', 'cli', 'main.js')
    let result: { code: number | null; stdout: string }
    let preload: string | undefined
    try {
      if (metadata && this.platform === 'douyin' && metadata.tags.length) {
        const source = douyinTopicPreload(entry, metadata)
        preload = join(this.home, `topics-${randomUUID()}.mjs`)
        writeFileSync(preload, source, { mode: 0o600 })
      }
      if (update) {
        const source = bilibiliUpdatePreload(entry, update.target, update.receipt, update.inspect)
        preload = join(this.home, `update-${randomUUID()}.mjs`)
        writeFileSync(preload, source, { mode: 0o600 })
      }
      result = await catbusProcess(
        this.runtime.nodePath,
        entry,
        args,
        this.home,
        signal,
        progress,
        preload ? pathToFileURL(preload).href : undefined,
      )
    } catch (error) {
      throw new CatbusFailure((error as Error).message, this.platform)
    } finally {
      if (preload) rmSync(preload, { force: true })
    }
    let envelope: Record<string, unknown>
    try {
      envelope = object(JSON.parse(result.stdout))
    } catch {
      throw new CatbusFailure('INVALID_RESPONSE')
    }
    if (envelope.ok !== true || result.code !== 0) {
      const error = object(envelope.error)
      const detail =
        error.detail && typeof error.detail === 'object'
          ? (error.detail as Record<string, unknown>)
          : {}
      if (
        update &&
        !update.inspect &&
        error.code === 'UPSTREAM' &&
        (detail.code ?? detail.status_code) === 21001
      ) {
        const failure = new CatbusFailure('UPDATE_REJECTED', this.platform)
        failure.platformCode = 21001
        throw failure
      }
      throw new CatbusFailure(
        typeof error.code === 'string' ? error.code : 'INVALID_RESPONSE',
        this.platform,
        error.code === 'UPSTREAM' ? upstreamDetail(error) : '',
      )
    }
    if (
      args[0] === this.platform &&
      (envelope.platform !== this.platform ||
        envelope.endpoint !== 'web' ||
        envelope.account !== PUBLISHING_PLATFORMS[this.platform].account ||
        envelope.resource !== args[1] ||
        envelope.action !== args[2])
    )
      throw new CatbusFailure('INVALID_RESPONSE')
    return envelope.data
  }
  async check(signal?: AbortSignal) {
    this.checked ??= (async () => {
      const result = object(await this.run(['version', '-o', 'json'], signal))
      if (result.version !== '0.2.1')
        throw new Error('请安装 Catbus CLI 0.2.1，并在执行环境配置其路径')
      if (typeof result.node !== 'string' || !supportedCatbusNode(result.node))
        throw new Error('Catbus 需要 Node 22.22.2+（22 系列）、24.15+（24 系列）或 26+')
    })()
    return this.checked
  }
  private async command(
    resource: string,
    action: string,
    args: string[] = [],
    signal?: AbortSignal,
    progress?: (text: string) => void,
    metadata?: BilibiliPublishSnapshot['metadata'],
    update?: {
      target: NonNullable<BilibiliPublishSnapshot['updateTarget']>
      receipt: string
      inspect?: boolean
    },
  ) {
    await this.check(signal)
    return this.run(
      [
        this.platform,
        resource,
        action,
        '-a',
        PUBLISHING_PLATFORMS[this.platform].account,
        '-e',
        'web',
        '-o',
        'json',
        ...args,
      ],
      signal,
      progress,
      metadata,
      update,
    )
  }
  async account(signal?: AbortSignal) {
    const data = object(await this.command('auth', 'status', [], signal))
    if (data.logged_in !== true) throw new CatbusFailure('AUTH_REQUIRED', this.platform)
    const user = object(data.user)
    if (
      !validPublishingUid(this.platform, user.id) ||
      (typeof user.name !== 'string' && user.name !== null)
    )
      throw new CatbusFailure('INVALID_RESPONSE')
    return { uid: user.id, name: user.name ?? `${PUBLISHING_PLATFORMS[this.platform].label}用户` }
  }
  async login(signal: AbortSignal) {
    await this.command('auth', 'login', ['--method', 'qrcode'], signal)
    return this.account(signal)
  }
  async categories(signal?: AbortSignal): Promise<BilibiliCategory[]> {
    if (this.platform !== 'bilibili') return []
    const data = await this.command('item', 'categories', [], signal)
    if (!Array.isArray(data)) throw new CatbusFailure('INVALID_RESPONSE')
    return data.map((value) => {
      const category = object(value)
      if (
        typeof category.id !== 'string' ||
        !/^\d+$/.test(category.id) ||
        typeof category.name !== 'string'
      )
        throw new CatbusFailure('INVALID_RESPONSE')
      return {
        id: category.id,
        name: category.name,
        parentId: typeof category.parent_id === 'string' ? category.parent_id : null,
      }
    })
  }
  private updateReceiptPath(id: string) {
    if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error('无效更新记录 ID')
    return join(this.home, `update-receipt-${id}.json`)
  }
  readUpdateReceipt(id: string) {
    const path = this.updateReceiptPath(id)
    if (!existsSync(path)) return undefined
    const value = JSON.parse(readFileSync(path, 'utf8'))
    if (typeof value.cid !== 'string' || !/^\d+$/.test(value.cid))
      throw new CatbusFailure('INVALID_RESPONSE')
    return {
      cid: value.cid as string,
      filename:
        typeof value.filename === 'string' && value.filename.length > 0
          ? value.filename
          : undefined,
    }
  }
  clearUpdateReceipt(id: string) {
    rmSync(this.updateReceiptPath(id), { force: true })
  }
  async publish(
    snapshot: BilibiliPublishSnapshot,
    video: string,
    cover: string,
    signal: AbortSignal,
    progress: (text: string) => void,
    submissionId?: string,
  ) {
    const receipt =
      snapshot.updateTarget && submissionId
        ? this.updateReceiptPath(submissionId)
        : join(this.home, `receipt-${randomUUID()}.json`)
    let uploadedCid: string | undefined
    let uploadedFilename: string | undefined
    const readReceipt = () => {
      if (existsSync(receipt)) {
        const value = JSON.parse(readFileSync(receipt, 'utf8'))
        if (typeof value.cid === 'string' && /^\d+$/.test(value.cid)) uploadedCid = value.cid
        if (typeof value.filename === 'string' && value.filename.length > 0)
          uploadedFilename = value.filename
      }
    }
    const description = join(this.home, `description-${randomUUID()}.txt`)
    writeFileSync(description, snapshot.metadata.description, { mode: 0o600 })
    try {
      const data = object(
        await this.command(
          'item',
          'publish',
          [
            '--video',
            video,
            '--cover',
            cover,
            '--title',
            snapshot.metadata.title,
            '--text',
            `@${description}`,
            ...snapshot.metadata.tags.flatMap((tag) => ['--tag', tag]),
            ...(this.platform === 'bilibili' ? ['--category', snapshot.category] : []),
            '--visibility',
            snapshot.visibility,
            ...(this.platform === 'bilibili' && snapshot.copyright === 'repost'
              ? ['--source', snapshot.source]
              : []),
          ],
          signal,
          progress,
          snapshot.metadata,
          snapshot.updateTarget ? { target: snapshot.updateTarget, receipt } : undefined,
        ),
      )
      if (
        typeof data.id !== 'string' ||
        typeof data.url !== 'string' ||
        data.status !== 'reviewing'
      )
        throw new CatbusFailure('INVALID_RESPONSE')
      let id: string
      try {
        id = publishingVideoId(this.platform, data.id)
        if (publishingVideoId(this.platform, data.url) !== id) throw new Error('mismatch')
      } catch {
        throw new CatbusFailure('INVALID_RESPONSE')
      }
      if (snapshot.updateTarget && id !== snapshot.updateTarget.externalId)
        throw new CatbusFailure('INVALID_RESPONSE')
      readReceipt()
      if (snapshot.updateTarget && !uploadedCid) throw new CatbusFailure('INVALID_RESPONSE')
      return { id, url: publishingVideoUrl(this.platform, id), uploadedCid, uploadedFilename }
    } catch (error) {
      readReceipt()
      if (error instanceof CatbusFailure) {
        error.uploadedCid = uploadedCid
        error.uploadedFilename = uploadedFilename
      }
      throw error
    } finally {
      rmSync(description, { force: true })
      if (!snapshot.updateTarget || !submissionId) rmSync(receipt, { force: true })
    }
  }
  async inspectUpdate(
    target: NonNullable<BilibiliPublishSnapshot['updateTarget']>,
    signal?: AbortSignal,
  ) {
    const data = object(
      await this.command(
        'item',
        'get',
        [target.externalId, '--raw'],
        signal,
        undefined,
        undefined,
        { target, receipt: '', inspect: true },
      ),
    )
    const archive = object(data.archive)
    if (!Array.isArray(data.videos) || data.videos.length !== 1)
      throw new CatbusFailure('UPDATE_INVALID')
    const video = object(data.videos[0])
    const state = typeof archive.state === 'number' ? archive.state : NaN
    // Match Catbus 0.2.1 creator archive normalization.
    const status =
      state >= 0 && video.status === 0
        ? 'published'
        : [-2, -4, -16, -100].includes(state)
          ? 'rejected'
          : [-1, -6, -30, -40].includes(state)
            ? 'reviewing'
            : null
    return {
      cid: String(video.cid),
      filename: typeof video.filename === 'string' ? video.filename : undefined,
      status,
    }
  }
  async contentCid(id: string, uid: string, signal?: AbortSignal) {
    const data = object(await this.command('item', 'get', [id, '--raw'], signal))
    const owner = object(data.owner)
    if (
      data.bvid !== id ||
      String(owner.mid) !== uid ||
      !Array.isArray(data.pages) ||
      data.pages.length !== 1
    )
      throw new CatbusFailure('UPDATE_INVALID')
    return String(object(data.pages[0]).cid)
  }
  async find(id: string, signal?: AbortSignal) {
    const data = await this.command('item', 'list', ['--limit', '200'], signal)
    if (!Array.isArray(data)) throw new CatbusFailure('INVALID_RESPONSE')
    const found = data.map(object).find((item) => item.id === id)
    if (!found) return null
    return { id, title: found.title, status: found.status, uid: object(found.author).id }
  }
}

export { CatbusPublishingClient as BilibiliCatbus }
