import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { VideoProject, WorkflowRevision } from '@shared/video-workflow'
import type { RenderInspectionInfo, RenderInspectionFrames } from '@shared/video-frame-inspection'
import { VoiceSelect } from '../components/voiceover/VoiceEngineFields'
import { WorkflowDialog } from './WorkflowDialog'
import { mediaUrl, workflowCall } from './useWorkflow'
import { useWorkflowHistory } from './useWorkflowHistory'

function useInspectionInfo(projectId: string, revisionId: string) {
  const [result, setResult] = useState<{
    id: string
    info?: RenderInspectionInfo
    error?: string
  }>()
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setResult(undefined)
    if (revisionId)
      void workflowCall<RenderInspectionInfo>('renderInspectionInfo', projectId, revisionId)
        .then((info) => {
          if (active) setResult({ id: revisionId, info })
        })
        .catch((failure) => {
          if (active) setResult({ id: revisionId, error: failure.message })
        })
    return () => {
      active = false
    }
  }, [projectId, revisionId, attempt])
  return {
    result: result?.id === revisionId ? result : undefined,
    retry: () => setAttempt((value) => value + 1),
  }
}

function useInspectionFrames(projectId: string, revisionId: string, sceneId: string) {
  const identity = `${projectId}:${revisionId}:${sceneId}`
  const [result, setResult] = useState<{
    identity: string
    value?: RenderInspectionFrames
    error?: string
  }>()
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setResult(undefined)
    const requestId = crypto.randomUUID()
    if (revisionId && sceneId)
      void workflowCall<RenderInspectionFrames>(
        'renderInspectionFrames',
        projectId,
        revisionId,
        sceneId,
        requestId,
      )
        .then((value) => {
          if (active) setResult({ identity, value })
        })
        .catch((failure) => {
          if (active) setResult({ identity, error: failure.message })
        })
    return () => {
      active = false
      if (revisionId && sceneId)
        void workflowCall('cancelRenderInspection', projectId, requestId).catch(() => {})
    }
  }, [identity, attempt])
  return {
    result: result?.identity === identity ? result : undefined,
    retry: () => setAttempt((value) => value + 1),
  }
}

const phaseLabels = { early: '前段', middle: '中段', late: '后段' }

function InspectionSide({
  projectId,
  revisionId,
  sceneId,
  side,
  onSeek,
}: {
  projectId: string
  revisionId: string
  sceneId: string
  side: 'current' | 'previous'
  onSeek?: (time: number, sceneId: string) => void
}) {
  const { result, retry } = useInspectionInfo(projectId, revisionId)
  const info = result?.info
  const scene = info?.scenes.find((item) => item.id === sceneId)
  const frames = useInspectionFrames(projectId, scene ? revisionId : '', scene?.id ?? '')
  const [failedImages, setFailedImages] = useState<string[]>([])
  return (
    <section
      className="min-w-0 grid content-start gap-3"
      data-inspection-side={side}
      data-revision={revisionId}
    >
      <h3 className="text-body-sm font-semibold">
        {side === 'current' ? '预览版本' : '对照旧版'}
        {info ? ` v${info.version}` : ''}
      </h3>
      {!result && (
        <p className="workflow-muted" role="status">
          正在读取来源…
        </p>
      )}
      {result?.error && (
        <div className="workflow-error" role="alert">
          <p>{result.error}</p>
          <Button size="sm" variant="ghost" onClick={retry}>
            重试读取来源
          </Button>
        </div>
      )}
      {info && (
        <>
          <p className="workflow-muted break-words">
            {new Date(info.createdAt).toLocaleString('zh-CN')}
            <br />
            视频指纹 {info.video.sha256.slice(0, 12)}
          </p>
          <p className="workflow-muted">
            技术检查记录：
            {
              { passed: '通过', failed: '未通过', unrecorded: '未记录可核验结果' }[
                info.technicalCheck
              ]
            }
            <br />
            人工审核状态：
            {{ review: '待审核', approved: '已审核', stale: '已失效' }[info.reviewStatus]}
          </p>
          {!scene ? (
            <p className="workflow-muted">此版本没有相同分镜，无法对照。</p>
          ) : (
            <>
              {!frames.result && (
                <p className="workflow-muted" role="status">
                  正在从实际视频抽帧…
                </p>
              )}
              {frames.result?.error && (
                <div className="workflow-error" role="alert">
                  <p>{frames.result.error}</p>
                  <Button size="sm" variant="ghost" onClick={frames.retry}>
                    重试抽帧
                  </Button>
                </div>
              )}
              {frames.result?.value?.frames.map((frame) => {
                const failed = failedImages.includes(frame.file.id)
                const label = `${phaseLabels[frame.phase]} · ${frame.time.toFixed(3)} 秒 · 第 ${frame.frame} 帧`
                const content = (
                  <>
                    <p className="text-body-sm">{label}</p>
                    <img
                      className="w-full h-auto max-h-60 object-contain"
                      src={mediaUrl(projectId, frame.file)}
                      alt={`视频 v${info.version}，${scene.title}，${label}，实际视频帧`}
                      onError={() => setFailedImages((previous) => [...previous, frame.file.id])}
                    />
                    {failed && (
                      <p className="workflow-error" role="alert">
                        帧图片加载失败，请关闭后重试；尚未完成视觉验收。
                      </p>
                    )}
                  </>
                )
                return onSeek ? (
                  <button
                    key={frame.file.id}
                    type="button"
                    className="workflow-scene w-full"
                    data-inspection-frame
                    data-time={frame.time}
                    disabled={failed}
                    aria-label={`定位预览：${label}`}
                    onClick={() => onSeek(frame.time, sceneId)}
                  >
                    {content}
                  </button>
                ) : (
                  <figure
                    key={frame.file.id}
                    className="workflow-scene"
                    data-inspection-frame
                    data-time={frame.time}
                  >
                    {content}
                  </figure>
                )
              })}
              {frames.result?.value && (
                <p className="workflow-muted">
                  实测 {frames.result.value.fps.toFixed(2)} fps
                  {onSeek ? ' · 点击画面定位主播放器' : ''}
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}

function InspectionSession({
  project,
  revision,
  initialSceneId,
  onSeek,
  onFeedback,
}: {
  project: VideoProject
  revision: WorkflowRevision
  initialSceneId?: string
  onSeek: (time: number, sceneId: string) => void
  onFeedback?: () => void
}) {
  const { result, retry } = useInspectionInfo(project.id, revision.id)
  const [selectedScene, setSelectedScene] = useState(initialSceneId ?? '')
  const [previousId, setPreviousId] = useState('none')
  const history = useWorkflowHistory(project, 'roughcut')
  const deliveryHistory = useWorkflowHistory(project, 'render')
  const scenes = result?.info?.scenes ?? []
  const sceneId = scenes.some((scene) => scene.id === selectedScene)
    ? selectedScene
    : (scenes[0]?.id ?? '')
  const previous = [...history.items, ...deliveryHistory.items]
    .filter((item) => item.id !== revision.id && item.createdAt <= revision.createdAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <section className="workflow-section" data-render-inspection>
      <p className="workflow-muted">
        画面来自实际视频，按共同分镜的前段 20%、中段 50%、后段 80%
        抽取最近有效帧。旧版使用自己的配音时间轴；时间不同仍对应同一相对进度。
      </p>
      <p className="workflow-muted">
        技术检查与人工视觉验收分开记录，三帧抽样不能替代完整观看后人工审核；本页不自动判断画面合格。
      </p>
      {!result && (
        <p className="workflow-muted" role="status">
          正在读取视频来源…
        </p>
      )}
      {result?.error && (
        <div className="workflow-error" role="alert">
          <p>{result.error}</p>
          <Button size="sm" variant="ghost" onClick={retry}>
            重试读取来源
          </Button>
        </div>
      )}
      {scenes.length > 0 && (
        <>
          <VoiceSelect
            label="抽检分镜"
            value={sceneId}
            onChange={setSelectedScene}
            options={scenes.map((scene, index) => ({
              value: scene.id,
              label: `${index + 1} · ${scene.title}`,
            }))}
          />
          <VoiceSelect
            label="对照旧版"
            value={previousId}
            onChange={setPreviousId}
            options={[
              { value: 'none', label: '不对照旧版' },
              ...previous.map((item) => ({
                value: item.id,
                label: `${item.stage === 'render' ? '交付' : '制作'} v${item.version} · ${new Date(item.createdAt).toLocaleString('zh-CN')}`,
              })),
            ]}
          />
          {(history.error || deliveryHistory.error) && (
            <p className="workflow-error" role="alert">
              {history.error || deliveryHistory.error}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void history.retry()
                  void deliveryHistory.retry()
                }}
              >
                重试读取历史
              </Button>
            </p>
          )}
          {history.loading && (
            <p className="workflow-muted" role="status">
              正在读取历史版本…
            </p>
          )}
          {history.cursor && (
            <Button
              size="sm"
              variant="ghost"
              disabled={history.loading}
              onClick={() => void history.more()}
            >
              加载更早对照版本
            </Button>
          )}
          {deliveryHistory.cursor && (
            <Button
              size="sm"
              variant="ghost"
              disabled={deliveryHistory.loading}
              onClick={() => void deliveryHistory.more()}
            >
              加载更早交付对照
            </Button>
          )}
          {!previous.length && !history.loading && !history.error && (
            <p className="workflow-muted">
              {history.cursor
                ? '已加载记录中没有更早视频，可继续加载。'
                : '没有更早的视频版本可对照。'}
            </p>
          )}
          <div className={`grid gap-3 ${previousId === 'none' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <InspectionSide
              key={`current:${revision.id}:${sceneId}`}
              projectId={project.id}
              revisionId={revision.id}
              sceneId={sceneId}
              side="current"
              onSeek={onSeek}
            />
            {previousId !== 'none' && (
              <InspectionSide
                key={`previous:${previousId}:${sceneId}`}
                projectId={project.id}
                revisionId={previousId}
                sceneId={sceneId}
                side="previous"
              />
            )}
          </div>
        </>
      )}
      {onFeedback && (
        <Button size="sm" variant="secondary" onClick={onFeedback}>
          前往原修改计划入口
        </Button>
      )}
    </section>
  )
}

export function RenderFrameInspection({
  project,
  revision,
  sceneId,
  onSeek,
  onFeedback,
}: {
  project: VideoProject
  revision: WorkflowRevision
  sceneId?: string
  onSeek: (time: number, sceneId: string) => void
  onFeedback?: () => void
}) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const closeAction = useRef<(() => void) | null>(null)
  return (
    <>
      <Button
        ref={trigger}
        type="button"
        size="sm"
        variant="ghost"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        实际画面抽检
      </Button>
      <WorkflowDialog
        open={open}
        onOpenChange={setOpen}
        title="实际画面抽检"
        description={`视频 v${revision.version} 的真实视频帧与改版对照。`}
        returnFocus={trigger}
        onCloseAutoFocus={(event) => {
          if (closeAction.current) {
            event.preventDefault()
            const action = closeAction.current
            closeAction.current = null
            action()
          }
        }}
      >
        {open && (
          <InspectionSession
            key={revision.id}
            project={project}
            revision={revision}
            initialSceneId={sceneId}
            onSeek={(time, id) => {
              onSeek(time, id)
              setOpen(false)
            }}
            onFeedback={
              onFeedback
                ? () => {
                    closeAction.current = onFeedback
                    setOpen(false)
                  }
                : undefined
            }
          />
        )}
      </WorkflowDialog>
    </>
  )
}
