import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderOpenIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { VoiceRadioGroup, VoiceTextArea } from '../components/voiceover/VoiceControls'
import { VoiceSelect } from '../components/voiceover/VoiceEngineFields'
import {
  stageValue,
  publicationCoverRenderId,
  type CoverGeneration,
  type PlatformMetadata,
  type PublicationCover,
  type VideoProject,
} from '@shared/video-workflow'
import { mediaUrl, workflowCall } from './useWorkflow'
import { WorkflowDialog } from './WorkflowDialog'
import { useWorkflowAssets } from './useWorkflowHistory'
import { FrameCoverPicker } from './FrameCoverPicker'

export function PublicationCoverPanel({
  project,
  platform = 'bilibili',
  value,
  disabled,
  canGenerate,
  generating,
  onChange,
  onGenerate,
}: {
  project: VideoProject
  platform?: 'bilibili' | 'douyin'
  value: PlatformMetadata
  disabled: boolean
  canGenerate: boolean
  generating: boolean
  onChange: (cover: PublicationCover | undefined) => void
  onGenerate: (options: CoverGeneration) => Promise<boolean>
}) {
  const [method, setMethod] = useState<CoverGeneration['method']>('code')
  const render = stageValue(project, 'render')
  const portraitVideo = Boolean(render && render.height > render.width)
  const [includePortrait, setIncludePortrait] = useState(portraitVideo)
  const [feedback, setFeedback] = useState('')
  const [open, setOpen] = useState(false)
  const [reuseOpen, setReuseOpen] = useState(false)
  const [generationOpen, setGenerationOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [ratio, setRatio] = useState(
    portraitVideo ? 'portrait' : value.cover ? 'feed' : 'landscape',
  )
  const [selectedId, setSelectedId] = useState(value.cover?.file.id ?? 'render-frame')
  const [imageError, setImageError] = useState(false)
  const [revealError, setRevealError] = useState('')
  const [revealing, setRevealing] = useState(false)
  const [imageSize, setImageSize] = useState<{ id: string; width: number; height: number }>()
  const previewButton = useRef<HTMLButtonElement>(null)
  const reuseButton = useRef<HTMLButtonElement>(null)
  const generateButton = useRef<HTMLButtonElement>(null)
  const submissionPending = useRef(false)
  const historicalCovers = useWorkflowAssets<PublicationCover>(project, 'cover', platform)
  const platformLabel = platform === 'bilibili' ? 'B 站' : '抖音'
  const methodLabel = (cover: PublicationCover) =>
    cover.method === 'frame' ? '视频选帧' : cover.method === 'code' ? 'AI 代码' : 'GPT Image2'
  const versions = useMemo(() => {
    const found = new Map<string, { cover: PublicationCover; version: number }>()
    for (const revision of [...historicalCovers.items].reverse()) {
      const cover = revision.value
      if (cover && !found.has(cover.file.id))
        found.set(cover.file.id, { cover, version: revision.version })
    }
    if (value.cover)
      found.set(value.cover.file.id, {
        cover: value.cover,
        version: project.stages.publish?.version ?? 0,
      })
    return [...found.values()].sort((left, right) => right.version - left.version)
  }, [value.cover, historicalCovers.items, project.stages.publish?.version])
  useEffect(() => {
    setSelectedId(value.cover?.file.id ?? 'render-frame')
  }, [value.cover?.file.id])
  const selected = versions.find((item) => item.cover.file.id === selectedId)?.cover
  const selectedPortraitId = selected?.portraitFile?.id
  useEffect(() => {
    setRatio(
      selectedId === 'render-frame'
        ? portraitVideo
          ? 'portrait'
          : 'landscape'
        : selectedPortraitId && portraitVideo
          ? 'portrait'
          : 'feed',
    )
  }, [selectedId, selectedPortraitId, portraitVideo])
  const currentRender = project.stages.render?.id
  const fileRatio = platform === 'douyin' ? 'landscape' : ratio
  const file = selected
    ? fileRatio === 'portrait'
      ? (selected.portraitFile ?? selected.file)
      : fileRatio === 'feed'
        ? selected.feedFile
        : selected.file
    : render?.cover
  const aspectRatio =
    platform === 'douyin'
      ? selected
        ? selected.width / selected.height
        : imageSize
          ? imageSize.width / imageSize.height
          : 9 / 16
      : ratio === 'portrait'
        ? 9 / 16
        : ratio === 'feed'
          ? 4 / 3
          : 16 / 9
  const dimensions = selected
    ? fileRatio === 'portrait'
      ? '1080×1920'
      : `${fileRatio === 'feed' ? selected.feedWidth : selected.width}×${fileRatio === 'feed' ? selected.feedHeight : selected.height}`
    : imageSize?.id === file?.id
      ? `${imageSize?.width}×${imageSize?.height}`
      : ''
  const stale = selected && publicationCoverRenderId(selected) !== currentRender
  const timestamp = (cover: PublicationCover) =>
    new Date(cover.createdAt).toLocaleString('zh-CN', { hour12: false })
  useEffect(() => {
    setImageError(false)
    setRevealError('')
  }, [file?.id])
  const revealFile = async () => {
    if (!file || revealing) return
    setRevealing(true)
    setRevealError('')
    try {
      await workflowCall('showFile', project.id, file)
    } catch (failure) {
      setRevealError((failure as Error).message)
    } finally {
      setRevealing(false)
    }
  }
  const imageLoaded = (image: HTMLImageElement) => {
    if (file) setImageSize({ id: file.id, width: image.naturalWidth, height: image.naturalHeight })
  }
  const generate = async () => {
    if (!canGenerate || submissionPending.current) return
    submissionPending.current = true
    setSubmitting(true)
    setGenerationError('')
    try {
      if (
        await onGenerate({
          method,
          feedback,
          platform,
          includePortrait: platform === 'douyin' || includePortrait,
        })
      )
        setGenerationOpen(false)
      else setGenerationError('未能启动封面任务，请查看页面错误提示后重试；修改建议已保留。')
    } catch (failure) {
      setGenerationError((failure as Error).message)
    } finally {
      submissionPending.current = false
      setSubmitting(false)
    }
  }
  return (
    <section
      className="workflow-section workflow-publication-cover"
      aria-label={`${platformLabel}投稿封面`}
      data-publication-cover
    >
      {historicalCovers.error && (
        <p role="alert" className="workflow-error">
          {historicalCovers.error}
        </p>
      )}
      <div className="workflow-stage-heading">
        <h4 className="text-body-sm font-semibold">{platformLabel}投稿封面</h4>
        <div className="workflow-toolbar">
          <FrameCoverPicker
            project={project}
            platform={platform}
            disabled={disabled || generating}
            onChange={onChange}
          />
          <Button
            ref={generateButton}
            size="sm"
            disabled={!canGenerate}
            onClick={() => {
              setGenerationError('')
              setGenerationOpen(true)
            }}
            data-cover-generate
          >
            {generating ? '正在生成封面…' : value.cover ? '重新生成封面' : 'AI 生成封面'}
          </Button>
        </div>
      </div>
      <div className="workflow-cover-content">
        <div className="workflow-cover-thumbnail">
          <div className="workflow-cover-image">
            {file && (
              <img
                src={mediaUrl(project.id, file)}
                style={{ aspectRatio }}
                alt={selected ? `${platformLabel}投稿封面候选` : '当前使用成片截帧'}
                onError={() => setImageError(true)}
                onLoad={(event) => imageLoaded(event.currentTarget)}
              />
            )}
            <div className="workflow-cover-image-actions">
              <Button
                ref={previewButton}
                variant="ghost"
                size="icon"
                disabled={!file}
                aria-label="放大预览封面"
                title="放大预览封面"
                onClick={() => setOpen(true)}
              >
                <MagnifyingGlassPlusIcon className="size-5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!file || revealing}
                aria-label="打开封面所在文件夹"
                title="打开封面所在文件夹"
                onClick={() => void revealFile()}
              >
                <FolderOpenIcon className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <p className="workflow-muted mt-2" data-cover-source>
            {selected?.method === 'frame' ? '视频选帧' : selected ? '独立封面' : '成片截帧'}
            {dimensions && ` · ${dimensions}`}
            {platform === 'douyin'
              ? selected?.method === 'code' || selected?.method === 'image2'
                ? selected.width < selected.height
                  ? ' · 9:16'
                  : ' · 16:9'
                : ' · 原视频画幅'
              : ratio === 'portrait'
                ? selected
                  ? ' · 9:16'
                  : ' · 9:16 裁切预览'
                : selected
                  ? ` · ${ratio === 'feed' ? '4:3' : '16:9'}`
                  : ratio === 'feed'
                    ? ' · 4:3 裁切预览'
                    : ' · 16:9'}
          </p>
          {selected?.frameSource && (
            <p className="workflow-muted">
              {selected.frameSource.time.toFixed(3)} 秒 · 第 {selected.frameSource.frame} 帧
            </p>
          )}
        </div>
        <div className="workflow-cover-summary">
          <p className="workflow-muted" role="status" data-cover-status>
            {generating
              ? '正在生成封面，进度与取消操作见右侧执行记录。'
              : stale
                ? '此封面对应旧成片。可确认复用已有图片，或重新选帧、生成封面。'
                : value.cover
                  ? '已纳入发布资料；更换后需保存并重新审核，视频无需重新渲染。'
                  : platform === 'bilibili'
                    ? '当前沿用成片截帧。可选视频帧或 AI 生成独立封面。'
                    : '当前沿用成片截帧。可选视频帧或 AI 生成竖版封面。'}
          </p>
          <p className="workflow-muted">
            {platform === 'bilibili'
              ? `首页推荐 4:3 · 1600×1200 / 个人空间 16:9 · 1600×900${selected?.portraitFile ? ' / 竖版 9:16 · 1080×1920' : ''}`
              : 'AI 可生成 9:16 · 1080×1920 封面；视频选帧使用原视频画幅'}
          </p>
          {versions.length > 0 && (
            <div className="workflow-toolbar">
              <fieldset disabled={disabled} className="min-w-0 flex-1">
                <VoiceSelect
                  label="封面历史版本"
                  value={selectedId}
                  onChange={setSelectedId}
                  options={[
                    { value: 'render-frame', label: '原成片截帧' },
                    ...versions.map(({ cover, version }) => ({
                      value: cover.file.id,
                      label: `${cover.file.id === value.cover?.file.id ? '当前 · ' : ''}发布 v${version} · ${timestamp(cover)} · ${methodLabel(cover)}`,
                    })),
                  ]}
                />
              </fieldset>
              {stale && (
                <Button
                  ref={reuseButton}
                  size="sm"
                  variant="secondary"
                  disabled={disabled || generating || !currentRender}
                  onClick={() => setReuseOpen(true)}
                >
                  复用到当前成片
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  disabled || !!stale || selectedId === (value.cover?.file.id ?? 'render-frame')
                }
                onClick={() => onChange(selected)}
              >
                {selected ? '使用此封面' : '使用原成片截帧'}
              </Button>
            </div>
          )}
        </div>
      </div>
      {imageError && (
        <p role="alert" className="workflow-error">
          封面加载失败，请检查文件或重新生成。
        </p>
      )}
      {revealError && (
        <p role="alert" className="workflow-error">
          无法定位封面：{revealError}
        </p>
      )}
      <WorkflowDialog
        open={reuseOpen}
        onOpenChange={setReuseOpen}
        title="确认复用旧成片封面"
        description="确认已有封面图片仍适合当前成片。原图片与来源记录保留，保存后需重新人工审核。"
        returnFocus={reuseButton}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReuseOpen(false)}>
              取消
            </Button>
            <Button
              disabled={disabled || generating || !selected || !currentRender}
              onClick={() => {
                if (!selected || !currentRender) return
                onChange({
                  ...selected,
                  reuseConfirmations: [
                    ...(selected.reuseConfirmations ?? []),
                    { renderId: currentRender, confirmedAt: new Date().toISOString() },
                  ],
                })
                setReuseOpen(false)
              }}
            >
              确认复用封面
            </Button>
          </>
        }
      >
        <p className="workflow-muted">
          标题、简介、标签及现有封面文件保留。请预览并确认封面内容与当前成片一致，再保存新发布版本。
          {selected?.frameSource && '旧选帧作为已有图片复用，原视频指纹、时间与帧号继续保留。'}
        </p>
      </WorkflowDialog>
      <WorkflowDialog
        open={generationOpen}
        onOpenChange={setGenerationOpen}
        title={value.cover ? '修改并重新生成封面' : '生成投稿封面'}
        description={`沿用视频内容与视觉风格生成${platform === 'douyin' ? '9:16 竖版封面' : '封面套图'}；成功后创建待审核发布版本。`}
        returnFocus={generateButton}
        footer={
          <>
            <Button variant="secondary" onClick={() => setGenerationOpen(false)}>
              取消
            </Button>
            <Button disabled={!canGenerate || submitting} onClick={() => void generate()}>
              {submitting ? '正在启动…' : '开始生成封面'}
            </Button>
          </>
        }
      >
        <div className="workflow-section">
          {platform === 'bilibili' && (
            <fieldset disabled={disabled || submitting}>
              <VoiceRadioGroup
                label="封面规格"
                compact
                value={includePortrait ? 'portrait' : 'landscape'}
                onChange={(value) => setIncludePortrait(value === 'portrait')}
                options={[
                  { value: 'landscape', label: '横版套图 16:9 + 4:3' },
                  { value: 'portrait', label: '横竖套图（含 9:16）' },
                ]}
              />
            </fieldset>
          )}
          <fieldset disabled={disabled || submitting}>
            <VoiceRadioGroup
              label="封面生成方式"
              value={method}
              compact
              onChange={(value) => setMethod(value as CoverGeneration['method'])}
              options={[
                { value: 'code', label: 'AI 代码' },
                { value: 'image2', label: 'GPT Image2（Codex）' },
              ]}
            />
          </fieldset>
          <p className="workflow-muted">
            {method === 'image2'
              ? `通过 Codex CLI 调用官方内置图片生成，复用当前登录并计入相应额度。${platform === 'bilibili' && includePortrait ? '横竖套图分别生成 4:3 与 9:16 两张图片，16:9 从 4:3 安全区裁切。' : '生成一张图片。'}`
              : '使用当前所选 Agent CLI · 各规格独立构图与渲染，沿用视频内容与风格。'}
          </p>
          <VoiceTextArea
            label="封面修改建议（选填）"
            rows={4}
            maxLength={5000}
            disabled={disabled || submitting}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="例如：标题更醒目，增加主题图解，沿用视频的奶油色与紫色，避免大面积空白。"
          />
          <p className="workflow-muted">
            PNG，每张不超过 4 MiB。
            {platform === 'bilibili'
              ? '自动投稿使用 16:9，发布包附带 4:3 和所生成的 9:16 素材。'
              : '生成 1080×1920 的 9:16 封面，保存审核后用于抖音投稿。'}
            关闭弹窗保留建议，不取消已启动任务。
          </p>
          {generationError && (
            <p role="alert" className="workflow-error">
              {generationError}
            </p>
          )}
        </div>
      </WorkflowDialog>
      <WorkflowDialog
        open={open}
        onOpenChange={setOpen}
        title="投稿封面预览"
        description={
          platform === 'douyin'
            ? '核对当前投稿封面的主体、文字与实际画幅。'
            : selected
              ? '各比例对应独立封面文件，可分别核对文字、主体与安全边距。'
              : '当前是原成片截帧，比例选择用于居中裁切预览。'
        }
        returnFocus={previewButton}
      >
        <div className="workflow-toolbar">
          {platform === 'bilibili' && (
            <VoiceRadioGroup
              label="预览比例"
              value={ratio}
              onChange={setRatio}
              compact
              options={[
                { value: 'feed', label: '首页推荐 4:3' },
                { value: 'landscape', label: '个人空间 16:9' },
                ...(!selected || selected.portraitFile
                  ? [{ value: 'portrait', label: '竖版 9:16' }]
                  : []),
              ]}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            disabled={!file || revealing}
            aria-label="打开预览封面所在文件夹"
            title="打开预览封面所在文件夹"
            onClick={() => void revealFile()}
          >
            <FolderOpenIcon className="size-5" aria-hidden="true" />
          </Button>
        </div>
        {revealError && (
          <p role="alert" className="workflow-error">
            无法定位封面：{revealError}
          </p>
        )}
        {open && file && (
          <div
            className="workflow-cover-preview-frame"
            style={{ aspectRatio, width: `min(100%, ${58 * aspectRatio}vh)` }}
          >
            <img
              className="workflow-cover-preview"
              src={mediaUrl(project.id, file)}
              alt={
                selected
                  ? `${platform === 'douyin' ? `${selected.width}:${selected.height}` : ratio === 'portrait' ? '9:16' : ratio === 'feed' ? '4:3' : '16:9'} 投稿封面放大预览`
                  : '原成片截帧放大预览'
              }
              onError={() => setImageError(true)}
              onLoad={(event) => imageLoaded(event.currentTarget)}
            />
          </div>
        )}
        {selected && (
          <p className="workflow-muted mt-3">
            {timestamp(selected)} · {methodLabel(selected)}
            {selected.frameSource &&
              ` · ${selected.frameSource.time.toFixed(3)} 秒 · 第 ${selected.frameSource.frame} 帧`}
            {selected.feedback && ` · 修改建议：${selected.feedback}`}
          </p>
        )}
      </WorkflowDialog>
    </section>
  )
}
