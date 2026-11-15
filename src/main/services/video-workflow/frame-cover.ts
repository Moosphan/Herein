import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  stageValue,
  stageUnlocked,
  validatePublicationCover,
  type VideoPlatform,
  type WorkflowRuntime,
} from '../../../shared/video-workflow'
import { VideoWorkflowRepository } from '../../database/repositories/video-workflow-repository'
import { WorkflowFiles } from './files'
import { workflowCommand } from './process'

export function videoDisplaySize(stream: {
  width?: number
  height?: number
  sample_aspect_ratio?: string
  side_data_list?: { rotation?: number }[]
}) {
  const [sarWidth, sarHeight] = String(stream.sample_aspect_ratio ?? '1:1')
    .split(':')
    .map(Number)
  const sar = sarWidth > 0 && sarHeight > 0 ? sarWidth / sarHeight : 1
  let width = Math.round(Number(stream.width) * sar),
    height = Number(stream.height)
  const rotation = stream.side_data_list?.find((item) => item.rotation !== undefined)?.rotation ?? 0
  if (Math.abs(rotation % 180) === 90) [width, height] = [height, width]
  return { width, height }
}

export class FrameCoverService {
  private running = new Map<
    string,
    { projectId: string; controller: AbortController; promise: Promise<unknown> }
  >()
  private stopped = false
  constructor(
    private repository: VideoWorkflowRepository,
    private files: WorkflowFiles,
    private runtime: () => WorkflowRuntime,
  ) {}

  private source(projectId: string, renderId: string, expected: number) {
    const project = this.repository.get(projectId)
    if (project.revision !== expected || project.stages.render?.id !== renderId)
      throw new Error('项目或成片已变化，请重新打开选帧')
    if (
      project.archived ||
      project.stages.render.status !== 'approved' ||
      !stageUnlocked(project, 'publish') ||
      project.jobs.some((job) => job.state === 'running')
    )
      throw new Error('请先审核正式成片并等待当前任务结束再选帧')
    return { project, render: stageValue(project, 'render')! }
  }

  async info(projectId: string, renderId: string, expected: number, signal?: AbortSignal) {
    if (this.stopped) throw new Error('工作流正在退出')
    const { render } = this.source(projectId, renderId, expected)
    const source = await this.files.verify(projectId, render.file)
    const runtime = this.runtime()
    const probe = JSON.parse(
      await workflowCommand(
        runtime.ffprobePath,
        [
          '-v',
          'error',
          '-select_streams',
          'v:0',
          '-show_entries',
          'stream=width,height,sample_aspect_ratio,avg_frame_rate,r_frame_rate,duration,nb_frames:stream_side_data=rotation:format=duration',
          '-of',
          'json',
          source,
        ],
        { cwd: tmpdir(), signal, timeout: 20000 },
      ),
    )
    const stream = probe.streams?.[0]
    const rate = (value: string = '') => {
      const [numerator, denominator] = value.split('/').map(Number)
      return numerator / denominator
    }
    const fps = rate(stream?.r_frame_rate)
    const duration = Number(stream?.duration ?? probe.format?.duration)
    const { width, height } = videoDisplaySize(stream ?? {})
    if (
      !Number.isFinite(fps) ||
      fps <= 0 ||
      fps > 120 ||
      Math.abs(fps - rate(stream?.avg_frame_rate)) > 0.001
    )
      throw new Error('视频帧率未记录或为可变帧率，无法可靠选帧')
    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      ![width, height].every((size) => Number.isInteger(size) && size > 0 && size <= 8192)
    )
      throw new Error('实际视频尺寸或时长无效，无法选帧')
    const frameCount = Number(stream?.nb_frames)
    const frames =
      Number.isSafeInteger(frameCount) && frameCount > 0
        ? frameCount
        : Math.ceil(duration * fps - 0.000001)
    this.source(projectId, renderId, expected)
    return {
      renderId,
      videoSha256: render.file.sha256,
      width,
      height,
      duration,
      fps,
      lastFrame: frames - 1,
    }
  }

  create(input: {
    projectId: string
    renderId: string
    expected: number
    platform: VideoPlatform
    time: number
    requestId: string
  }) {
    if (this.stopped) return Promise.reject(new Error('工作流正在退出'))
    if (
      !input ||
      !['bilibili', 'douyin'].includes(input.platform) ||
      typeof input.requestId !== 'string' ||
      !/^[a-f0-9-]{36}$/.test(input.requestId) ||
      this.running.has(input.requestId)
    )
      return Promise.reject(new Error('选帧请求无效或正在使用'))
    if (this.running.size >= 4) return Promise.reject(new Error('选帧请求较多，请稍后重试'))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)
    const promise = this.extract(input, controller.signal).finally(() => {
      clearTimeout(timer)
      this.running.delete(input.requestId)
    })
    this.running.set(input.requestId, { projectId: input.projectId, controller, promise })
    return promise
  }

  cancel(projectId: string, requestId: string) {
    const request = this.running.get(requestId)
    if (request?.projectId === projectId) request.controller.abort()
  }

  async dispose() {
    this.stopped = true
    for (const request of this.running.values()) request.controller.abort()
    await Promise.allSettled([...this.running.values()].map((request) => request.promise))
  }

  private async extract(
    input: {
      projectId: string
      renderId: string
      expected: number
      platform: VideoPlatform
      time: number
    },
    signal: AbortSignal,
  ) {
    const directory = mkdtempSync(join(tmpdir(), 'video-frame-cover-'))
    try {
      const info = await this.info(input.projectId, input.renderId, input.expected, signal)
      if (!Number.isFinite(input.time) || input.time < 0 || input.time >= info.duration)
        throw new Error('选帧时间超出视频范围，请重新选择')
      const frame = Math.min(info.lastFrame, Math.floor(input.time * info.fps + 0.000001))
      const time = frame / info.fps
      const { render } = this.source(input.projectId, input.renderId, input.expected)
      const source = await this.files.verify(input.projectId, render.file)
      const runtime = this.runtime()
      const original = join(directory, 'frame.png')
      await workflowCommand(
        runtime.ffmpegPath,
        [
          '-nostdin',
          '-y',
          '-v',
          'error',
          '-ss',
          time.toFixed(9),
          '-i',
          source,
          '-map',
          '0:v:0',
          '-frames:v',
          '1',
          '-vf',
          `scale=${info.width}:${info.height},setsar=1`,
          original,
        ],
        { cwd: directory, signal, timeout: 30000 },
      )
      const output = async (name: string, width: number, height: number) => {
        const path = join(directory, name)
        await workflowCommand(
          runtime.ffmpegPath,
          [
            '-nostdin',
            '-y',
            '-v',
            'error',
            '-i',
            original,
            '-vf',
            `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`,
            '-frames:v',
            '1',
            path,
          ],
          { cwd: directory, signal, timeout: 20000 },
        )
        return readFileSync(path)
      }
      const landscape =
        input.platform === 'bilibili'
          ? await output('landscape.png', 1600, 900)
          : readFileSync(original)
      const feed = input.platform === 'bilibili' ? await output('feed.png', 1600, 1200) : landscape
      if ([landscape, feed].some((bytes) => !bytes.length || bytes.length > 4 * 1024 * 1024))
        throw new Error('该帧 PNG 超出 4 MiB 限制，请选择细节较少的画面')
      await this.files.verify(input.projectId, render.file)
      this.source(input.projectId, input.renderId, input.expected)
      signal.throwIfAborted()
      const file = await this.files.write(input.projectId, landscape, '.png')
      const feedFile =
        input.platform === 'bilibili' ? await this.files.write(input.projectId, feed, '.png') : file
      signal.throwIfAborted()
      this.source(input.projectId, input.renderId, input.expected)
      return validatePublicationCover({
        file,
        feedFile,
        sourceRenderId: input.renderId,
        method: 'frame',
        platform: input.platform,
        frameSource: { videoSha256: info.videoSha256, time, frame, fps: info.fps },
        createdAt: new Date().toISOString(),
        feedback: '',
        width: input.platform === 'bilibili' ? 1600 : info.width,
        height: input.platform === 'bilibili' ? 900 : info.height,
        feedWidth: input.platform === 'bilibili' ? 1600 : info.width,
        feedHeight: input.platform === 'bilibili' ? 1200 : info.height,
      })
    } catch (failure) {
      if (signal.aborted) throw new Error('选帧已取消或超时，旧封面已保留')
      throw failure
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  }
}
