import type {
  AudioPayload,
  RenderPayload,
  StoryboardPayload,
  WorkflowFile,
  WorkflowRevision,
} from './video-workflow'

export interface InspectionScene {
  id: string
  title: string
  start: number
  end: number
}
export interface RenderInspectionInfo {
  revisionId: string
  version: number
  createdAt: string
  video: WorkflowFile
  duration: number
  scenes: InspectionScene[]
  technicalCheck: 'passed' | 'failed' | 'unrecorded'
  reviewStatus: WorkflowRevision['status']
}
export interface InspectionSample {
  phase: 'early' | 'middle' | 'late'
  frame: number
  time: number
}
export interface RenderInspectionFrames {
  revisionId: string
  videoHash: string
  sceneId: string
  fps: number
  frames: (InspectionSample & { file: WorkflowFile })[]
}

export function describeRenderInspection(
  revision: WorkflowRevision,
  history: WorkflowRevision[],
): RenderInspectionInfo {
  if (revision.stage !== 'roughcut' && revision.stage !== 'render')
    throw new Error('实际画面抽检仅支持视频制作或历史粗剪/交付版本')
  const render = revision.payload as RenderPayload
  const boardRevision = history.find(
    (item) => item.id === render.sourceStoryboard && item.stage === 'storyboard',
  )
  const audioRevision = history.find(
    (item) => item.id === render.sourceAudio && item.stage === 'audio',
  )
  if (!boardRevision || !audioRevision)
    throw new Error('此版本未记录完整的分镜和配音来源，无法按分镜抽检；请直接观看视频')
  const storyboard = boardRevision.payload as StoryboardPayload
  const audio = audioRevision.payload as AudioPayload
  if (
    !storyboard.scenes.length ||
    new Set(storyboard.scenes.map((scene) => scene.id)).size !== storyboard.scenes.length
  )
    throw new Error('来源分镜标识不完整或重复，无法对照')
  let start = 0
  const scenes = storyboard.scenes.map((scene) => {
    const tracks = audio.tracks.filter((track) => track.sceneId === scene.id)
    if (
      !tracks.length ||
      tracks.some((track) => !Number.isFinite(track.duration) || track.duration <= 0)
    )
      throw new Error('来源配音缺少有效的逐镜时长，无法按分镜抽检')
    const duration = tracks.reduce((total, track) => total + track.duration, 0)
    const entry = { id: scene.id, title: scene.title, start, end: start + duration }
    start += duration
    return entry
  })
  if (
    !Number.isFinite(render.duration) ||
    Math.abs(start - render.duration) > 0.1 ||
    audio.tracks.some((track) => !scenes.some((scene) => scene.id === track.sceneId))
  )
    throw new Error('来源时间轴与视频时长不一致，无法可靠对照')
  let technicalCheck: RenderInspectionInfo['technicalCheck'] = 'unrecorded'
  try {
    const check = JSON.parse(render.checks)
    if (check?.ok === true) technicalCheck = 'passed'
    if (check?.ok === false) technicalCheck = 'failed'
  } catch {}
  return {
    revisionId: revision.id,
    version: revision.version,
    createdAt: revision.createdAt,
    video: render.file,
    duration: render.duration,
    scenes,
    technicalCheck,
    reviewStatus: revision.status,
  }
}

export function inspectionSceneSamples(
  scene: InspectionScene,
  duration: number,
  fps: number,
): InspectionSample[] {
  if (
    ![scene.start, scene.end, duration, fps].every(Number.isFinite) ||
    scene.start < 0 ||
    scene.end <= scene.start ||
    fps <= 0 ||
    duration <= 0
  )
    throw new Error('抽检时间轴无有效帧')
  const first = Math.ceil(scene.start * fps - 1e-7)
  const last = Math.ceil(Math.min(scene.end, duration) * fps - 1e-7) - 1
  if (last < first) throw new Error('此分镜没有可抽检的有效帧')
  return (
    [
      ['early', 0.2],
      ['middle', 0.5],
      ['late', 0.8],
    ] as const
  ).map(([phase, progress]) => {
    const frame = Math.max(
      first,
      Math.min(last, Math.round((scene.start + (scene.end - scene.start) * progress) * fps)),
    )
    return { phase, frame, time: frame / fps }
  })
}
