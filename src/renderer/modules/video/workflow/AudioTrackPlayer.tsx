import { useRef, useState } from 'react'
import type { AudioTrack } from '@shared/video-workflow'
import { mediaUrl, workflowCall } from './useWorkflow'
import { Button } from '@/components/ui/button'
import { VoiceTextArea } from '../components/voiceover/VoiceControls'
import { WorkflowDialog } from './WorkflowDialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export function AudioTrackPlayer({
  projectId,
  track,
  title,
  index,
  onRegenerate,
  regenerateDisabledReason,
  previousFeedback,
  correctionTargets,
}: {
  projectId: string
  track: AudioTrack
  title: string
  index: number
  onRegenerate: (feedback?: string, fileIds?: string[]) => Promise<void>
  regenerateDisabledReason?: string
  previousFeedback?: string
  correctionTargets?: { id: string; label: string; disabledReason?: string }[]
}) {
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [feedback, setFeedback] = useState(previousFeedback ?? track.correction?.feedback ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [selectedIds, setSelectedIds] = useState([track.file.id])
  const selected = correctionTargets
    ? selectedIds.filter((id) =>
        correctionTargets.some((target) => target.id === id && !target.disabledReason),
      )
    : [track.file.id]
  const menuButton = useRef<HTMLButtonElement>(null)
  const submit = async () => {
    if (submitting || regenerateDisabledReason || !feedback.trim() || !selected.length) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await onRegenerate(feedback.trim(), selected)
      setCorrectionOpen(false)
    } catch (failure) {
      setSubmitError((failure as Error).message)
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className="workflow-audio-row" data-playing={playing}>
      <div className="workflow-toolbar">
        <strong className="workflow-audio-title text-body-sm">
          {String(index + 1).padStart(2, '0')} · {title}
        </strong>
        <div className="workflow-actions">
          <span className="workflow-muted">{track.duration.toFixed(1)} 秒</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                data-audio-track-menu
                ref={menuButton}
                aria-label={`第 ${index + 1} 段更多操作`}
                title="更多操作"
              >
                更多操作
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setLocationError('')
                  void workflowCall('showFile', projectId, track.file).catch((failure) =>
                    setLocationError((failure as Error).message),
                  )
                }}
              >
                打开所在文件夹
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={Boolean(regenerateDisabledReason)}
                title={regenerateDisabledReason}
                onSelect={() => {
                  setSubmitError('')
                  setCorrectionOpen(true)
                }}
              >
                按修改意见重新生成
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={Boolean(regenerateDisabledReason)}
                title={regenerateDisabledReason}
                className="data-[highlighted]:bg-surface-container-low data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
                onSelect={() => void onRegenerate().catch(() => {})}
              >
                重新生成此段配音
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <p className="text-body-sm leading-relaxed">{track.text}</p>
      {track.correction && (
        <details className="workflow-muted" data-audio-correction>
          <summary className="cursor-pointer">本段配音调整说明</summary>
          <p className="mt-2 whitespace-pre-wrap">{track.correction.summary}</p>
          <p className="mt-2 whitespace-pre-wrap">修改意见 {track.correction.feedback}</p>
          {track.correction.parts.map((part, partIndex) => (
            <p key={partIndex} className="mt-2 whitespace-pre-wrap">
              {part.text}（后接停顿 {part.pauseAfterMs} 毫秒）
            </p>
          ))}
        </details>
      )}
      {regenerateDisabledReason && <p className="workflow-muted">{regenerateDisabledReason}</p>}
      <audio
        controls
        preload="metadata"
        src={mediaUrl(projectId, track.file)}
        className="workflow-audio-player w-full"
        data-playing={playing}
        aria-label={`第 ${index + 1} 段试听`}
        onPlay={() => {
          setPlaying(true)
          setError('')
        }}
        onPlaying={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPause={() => {
          setPlaying(false)
          setLoading(false)
        }}
        onEnded={() => {
          setPlaying(false)
          setLoading(false)
        }}
        onError={() => {
          setPlaying(false)
          setLoading(false)
          setError('音频加载失败，请重新打开项目或重试。')
        }}
      />
      {loading && (
        <span className="workflow-muted" role="status">
          正在加载音频…
        </span>
      )}
      {error && (
        <p className="workflow-error" role="alert">
          {error}
        </p>
      )}
      {locationError && (
        <p className="workflow-error" role="alert">
          {locationError}
        </p>
      )}
      <WorkflowDialog
        open={correctionOpen}
        onOpenChange={setCorrectionOpen}
        title={`修改第 ${index + 1} 段配音`}
        description="AI 将结合原文和读音提示调整合成文本与停顿，生成后请试听审核。"
        returnFocus={menuButton}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCorrectionOpen(false)}>
              关闭
            </Button>
            <Button
              disabled={
                submitting ||
                Boolean(regenerateDisabledReason) ||
                !selected.length ||
                !feedback.trim() ||
                feedback.length > 5000
              }
              onClick={() => void submit()}
            >
              {submitting
                ? '提交中…'
                : selected.length > 1
                  ? `按意见重新生成 ${selected.length} 段`
                  : '按意见重新生成'}
            </Button>
          </>
        }
      >
        <p className="text-body-sm leading-relaxed">{track.text}</p>
        {correctionTargets && correctionTargets.length > 1 && (
          <fieldset className="workflow-section">
            <legend className="voiceover-field-label">同时修改的配音</legend>
            <p className="workflow-muted">
              可选择多段，共用下方修改意见。其他片段的任务执行期间也可继续提交。
            </p>
            <div className="workflow-section max-h-48 overflow-y-auto" aria-label="配音片段选择">
              {correctionTargets.map((target) => (
                <div key={target.id}>
                  <Button
                    size="sm"
                    variant={selected.includes(target.id) ? 'secondary' : 'ghost'}
                    aria-pressed={selected.includes(target.id)}
                    disabled={submitting || Boolean(target.disabledReason)}
                    className="w-full justify-start whitespace-normal text-left"
                    onClick={() =>
                      setSelectedIds((ids) =>
                        ids.includes(target.id)
                          ? ids.filter((id) => id !== target.id)
                          : [...ids, target.id],
                      )
                    }
                  >
                    {selected.includes(target.id) ? '已选 · ' : ''}
                    {target.label}
                  </Button>
                  {target.disabledReason && (
                    <p className="workflow-muted">{target.disabledReason}</p>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        )}
        <VoiceTextArea
          label="配音修改意见"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="例如 KSP 按字母读，toJson 拆开读，每句话完整收尾，句间停顿稍长。"
          rows={5}
          maxLength={5000}
          disabled={submitting}
          aria-describedby={`audio-feedback-help-${track.file.id}`}
        />
        <p id={`audio-feedback-help-${track.file.id}`} className="workflow-muted">
          最多 5000 字符。使用工作台所选 AI 执行器调整，再由当前音色合成。结果可在历史版本中比较。
        </p>
        {(submitError || regenerateDisabledReason) && (
          <p role="alert" className="workflow-error">
            {submitError || regenerateDisabledReason}
          </p>
        )}
      </WorkflowDialog>
    </div>
  )
}
