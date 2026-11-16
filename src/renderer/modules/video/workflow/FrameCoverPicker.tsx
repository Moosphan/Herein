import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import { VoiceRadioGroup } from '../components/voiceover/VoiceControls'
import {
  stageValue,
  type PublicationCover,
  type VideoPlatform,
  type VideoProject,
} from '@shared/video-workflow'
import { WorkflowDialog } from './WorkflowDialog'
import { mediaUrl, workflowCall } from './useWorkflow'

type FrameInfo = { width: number; height: number; duration: number; fps: number; lastFrame: number }

export function FrameCoverPicker({
  project,
  platform,
  disabled,
  onChange,
}: {
  project: VideoProject
  platform: VideoPlatform
  disabled: boolean
  onChange: (cover: PublicationCover) => void
}) {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<FrameInfo>()
  const [frame, setFrame] = useState(0)
  const render = stageValue(project, 'render')
  const [ratio, setRatio] = useState(
    render && render.height > render.width ? 'portrait' : 'landscape',
  )
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [ready, setReady] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const request = useRef<string>()
  const generation = useRef(0)
  const renderId = project.stages.render?.id
  const identity = `${project.id}:${project.revision}:${renderId}:${platform}`
  const changeOpen = (value: boolean) => {
    if (!value) {
      generation.current++
      if (request.current)
        void workflowCall('cancelFrameCover', project.id, request.current).catch(() => {})
      request.current = undefined
    }
    setOpen(value)
  }
  useEffect(() => {
    const sequence = ++generation.current
    setInfo(undefined)
    setFrame(0)
    setReady(false)
    setError('')
    setPending(false)
    if (open && renderId)
      void workflowCall<FrameInfo>('frameCoverInfo', project.id, renderId, project.revision)
        .then((value) => {
          if (generation.current === sequence) setInfo(value)
        })
        .catch((failure) => {
          if (generation.current === sequence) setError(failure.message)
        })
    return () => {
      generation.current++
      if (request.current)
        void workflowCall('cancelFrameCover', project.id, request.current).catch(() => {})
      request.current = undefined
    }
  }, [open, identity])
  useEffect(() => {
    if (!video.current || !info) return
    const target = frame / info.fps
    setReady(false)
    if (Math.abs(video.current.currentTime - target) < 0.000001 && video.current.readyState >= 2)
      setReady(true)
    else video.current.currentTime = target
  }, [frame, info])
  const loaded = () => {
    if (
      video.current &&
      info &&
      Math.abs(video.current.currentTime - frame / info.fps) < 0.5 / info.fps
    )
      setReady(true)
  }
  const confirm = async () => {
    if (!info || !ready || pending || request.current || disabled || !renderId) return
    const sequence = generation.current
    const requestId = crypto.randomUUID()
    request.current = requestId
    setPending(true)
    setError('')
    try {
      const cover = await workflowCall<PublicationCover>('createFrameCover', {
        projectId: project.id,
        renderId,
        expected: project.revision,
        platform,
        time: frame / info.fps,
        requestId,
      })
      if (generation.current !== sequence) return
      onChange(cover)
      changeOpen(false)
    } catch (failure) {
      if (generation.current === sequence) setError((failure as Error).message)
    } finally {
      if (request.current === requestId) request.current = undefined
      if (generation.current === sequence) setPending(false)
    }
  }
  const aspectRatio =
    platform === 'bilibili'
      ? ratio === 'portrait'
        ? 9 / 16
        : ratio === 'feed'
          ? 4 / 3
          : 16 / 9
      : info
        ? info.width / info.height
        : 9 / 16
  return (
    <>
      <Button
        ref={button}
        size="sm"
        variant="secondary"
        disabled={disabled || project.stages.render?.status !== 'approved'}
        onClick={() => setOpen(true)}
        data-cover-frame
      >
        从视频选帧
      </Button>
      <WorkflowDialog
        open={open}
        onOpenChange={changeOpen}
        title="从视频选帧"
        description="拖动滑条预览正式成片。确认后仅修改当前平台的封面草稿，保存并重新审核后生效；取消保留旧封面。"
        returnFocus={button}
        footer={
          <>
            <Button variant="secondary" onClick={() => changeOpen(false)}>
              {pending ? '取消选帧' : '取消'}
            </Button>
            <Button
              disabled={!info || !ready || pending || disabled}
              onClick={() => void confirm()}
              data-cover-frame-confirm
            >
              {pending ? '正在提取…' : '使用此帧作为封面'}
            </Button>
          </>
        }
      >
        {!info && !error && (
          <p className="workflow-muted" role="status">
            正在读取正式成片…
          </p>
        )}
        {info && render && (
          <div className="workflow-section">
            {platform === 'bilibili' && (
              <VoiceRadioGroup
                label="封面裁切预览"
                value={ratio}
                onChange={setRatio}
                compact
                options={[
                  { value: 'landscape', label: '个人空间 16:9' },
                  { value: 'feed', label: '首页推荐 4:3' },
                  { value: 'portrait', label: '竖版 9:16' },
                ]}
              />
            )}
            <video
              ref={video}
              className="workflow-media"
              src={mediaUrl(project.id, render.file)}
              muted
              preload="auto"
              aria-label="封面选帧预览"
              style={{
                aspectRatio,
                objectFit: 'cover',
                objectPosition: 'center',
                width: `min(100%, ${44 * aspectRatio}vh)`,
                marginInline: 'auto',
              }}
              onLoadedData={loaded}
              onSeeked={loaded}
              onSeeking={() => setReady(false)}
              onError={() => {
                setReady(false)
                setError('视频加载失败，请检查正式成片文件后重新打开。')
              }}
            />
            <div className="voiceover-slider-group">
              <div className="voiceover-field-label">
                <label htmlFor="publication-cover-frame">选择视频帧</label>
                <output className="voiceover-value" htmlFor="publication-cover-frame">
                  {(frame / info.fps).toFixed(3)} 秒 · 第 {frame} 帧
                </output>
              </div>
              <input
                id="publication-cover-frame"
                className="voiceover-slider"
                style={
                  {
                    '--voiceover-progress': `${info.lastFrame ? (frame / info.lastFrame) * 100 : 0}%`,
                  } as CSSProperties
                }
                type="range"
                min={0}
                max={info.lastFrame}
                step={1}
                value={frame}
                disabled={pending}
                aria-valuetext={`${(frame / info.fps).toFixed(3)} 秒，第 ${frame} 帧`}
                onChange={(event) => setFrame(Number(event.target.value))}
              />
            </div>
            <p className="workflow-muted">
              {platform === 'bilibili'
                ? '同一帧居中裁切为 1600×900、1600×1200 和 1080×1920；请分别检查主体是否完整。'
                : `抖音保留原视频画幅 ${info.width}×${info.height}。`}{' '}
              PNG，每张不超过 4 MiB。
            </p>
          </div>
        )}
        {error && (
          <p className="workflow-error" role="alert">
            {error}
          </p>
        )}
      </WorkflowDialog>
    </>
  )
}
