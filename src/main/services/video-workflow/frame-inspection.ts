import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  describeRenderInspection,
  inspectionSceneSamples,
  type RenderInspectionFrames,
} from '../../../shared/video-frame-inspection'
import type { RenderPayload, WorkflowRuntime } from '../../../shared/video-workflow'
import { VideoWorkflowRepository } from '../../database/repositories/video-workflow-repository'
import { WorkflowFiles } from './files'
import { workflowCommand } from './process'

export class FrameInspection {
  private cache = new Map<string, RenderInspectionFrames>()
  private running = new Map<
    string,
    { projectId: string; controller: AbortController; promise: Promise<RenderInspectionFrames> }
  >()
  private stopped = false
  constructor(
    private repository: VideoWorkflowRepository,
    private files: WorkflowFiles,
    private runtime: () => WorkflowRuntime,
  ) {}

  info(projectId: string, revisionId: string) {
    const revision = this.repository.revision(projectId, revisionId)
    const render = revision.payload as RenderPayload
    const sources = [render.sourceStoryboard, render.sourceAudio].filter((id): id is string =>
      Boolean(id),
    )
    return describeRenderInspection(
      revision,
      sources.map((id) => this.repository.revision(projectId, id)),
    )
  }

  frames(projectId: string, revisionId: string, sceneId: string, requestId: string) {
    if (this.stopped) return Promise.reject(new Error('工作流正在退出'))
    if (
      typeof requestId !== 'string' ||
      !/^[a-f0-9-]{36}$/.test(requestId) ||
      this.running.has(requestId)
    )
      return Promise.reject(new Error('抽检请求 ID 无效或正在使用'))
    if (this.running.size >= 8) return Promise.reject(new Error('抽检请求较多，请稍后重试'))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)
    const promise = this.extract(projectId, revisionId, sceneId, controller.signal).finally(() => {
      clearTimeout(timer)
      this.running.delete(requestId)
    })
    this.running.set(requestId, { projectId, controller, promise })
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
    this.cache.clear()
  }

  private async extract(
    projectId: string,
    revisionId: string,
    sceneId: string,
    signal: AbortSignal,
  ): Promise<RenderInspectionFrames> {
    const info = this.info(projectId, revisionId)
    const scene = info.scenes.find((item) => item.id === sceneId)
    if (!scene) throw new Error('此版本没有对应分镜，无法对照')
    const source = await this.files.verify(projectId, info.video)
    const assertActive = () => {
      if (signal.aborted) throw new Error('抽检已取消或超时，请重试')
    }
    assertActive()
    const key = JSON.stringify([projectId, revisionId, info.video.sha256, scene])
    const cached = this.cache.get(key)
    if (cached) {
      try {
        for (const frame of cached.frames) await this.files.verify(projectId, frame.file)
        assertActive()
        return cached
      } catch {
        this.cache.delete(key)
        assertActive()
      }
    }
    const directory = mkdtempSync(join(tmpdir(), 'video-frame-inspection-'))
    try {
      const runtime = this.runtime()
      const command = (executable: string, args: string[]) =>
        workflowCommand(executable, args, {
          cwd: directory,
          signal,
          timeout: 20000,
          timeoutMessage: '视频抽检超时，请重试',
        })
      const probe = JSON.parse(
        await command(runtime.ffprobePath, [
          '-v',
          'error',
          '-select_streams',
          'v:0',
          '-show_entries',
          'stream=avg_frame_rate,r_frame_rate,duration,nb_frames:format=duration',
          '-of',
          'json',
          source,
        ]),
      )
      const stream = probe.streams?.[0]
      const rate = (value: string | undefined) => {
        const [numerator, denominator] = (value ?? '').split('/').map(Number)
        return numerator / denominator
      }
      const fps = rate(stream?.r_frame_rate)
      const duration = Number(stream?.duration ?? probe.format?.duration)
      if (
        !Number.isFinite(fps) ||
        fps <= 0 ||
        fps > 120 ||
        Math.abs(fps - rate(stream?.avg_frame_rate)) > 0.001
      )
        throw new Error('视频帧率未记录或为可变帧率，无法可靠定位抽检时间')
      if (!Number.isFinite(duration) || Math.abs(duration - info.duration) > 0.15)
        throw new Error('实际视频时长与来源记录不一致，无法可靠对照')
      const result: RenderInspectionFrames = {
        revisionId,
        videoHash: info.video.sha256,
        sceneId,
        fps,
        frames: [],
      }
      for (const sample of inspectionSceneSamples(scene, duration, fps)) {
        assertActive()
        const image = join(directory, `${sample.phase}.jpg`)
        await command(runtime.ffmpegPath, [
          '-nostdin',
          '-y',
          '-v',
          'error',
          '-ss',
          sample.time.toFixed(9),
          '-i',
          source,
          '-map',
          '0:v:0',
          '-frames:v',
          '1',
          '-vf',
          'scale=640:640:force_original_aspect_ratio=decrease',
          '-q:v',
          '3',
          image,
        ])
        assertActive()
        result.frames.push({
          ...sample,
          file: await this.files.write(projectId, readFileSync(image), '.jpg'),
        })
      }
      await this.files.verify(projectId, info.video)
      assertActive()
      if (this.cache.size >= 128) this.cache.delete(this.cache.keys().next().value!)
      this.cache.set(key, result)
      return result
    } catch (failure) {
      assertActive()
      throw new Error(
        `实际视频抽帧失败：${(failure as Error).message.slice(0, 800)}。请重试或直接观看视频；尚未完成视觉验收。`,
      )
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  }
}
