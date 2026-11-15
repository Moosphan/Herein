import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { VoiceTextArea } from '../components/voiceover/VoiceControls'
import { VoiceSelect } from '../components/voiceover/VoiceEngineFields'
import { validateNativeMaterials, type NativeMaterial } from '@shared/video-materials'
import { stageValue, type StoryScene, type VideoProject } from '@shared/video-workflow'
import { workflowCall } from './useWorkflow'

const storageKey = (id: string) => `video-workflow:native-materials:${id}`

export function nativeMaterialDraft(id: string): NativeMaterial[] | undefined {
  const raw = localStorage.getItem(storageKey(id))
  if (raw === null) return undefined
  const value = JSON.parse(raw)
  if (!Array.isArray(value)) throw new Error('本地画面素材草稿无效，请在分镜创作设置中重新导入')
  return value
}

export function NativeMaterialPanel({
  projectId,
  scenes,
  disabled,
}: {
  projectId: string
  scenes: StoryScene[]
  disabled: boolean
}) {
  const [items, setItems] = useState<NativeMaterial[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  useEffect(() => {
    let current = true
    void (async () => {
      try {
        const stored = nativeMaterialDraft(projectId)
        const materials =
          stored ??
          stageValue(await workflowCall<VideoProject>('get', projectId), 'roughcut')
            ?.nativeMaterials ??
          []
        if (current) {
          setItems(materials)
          setLoaded(true)
        }
      } catch (failure) {
        if (current) setError((failure as Error).message)
      }
    })()
    return () => {
      current = false
    }
  }, [projectId])
  const update = (next: NativeMaterial[]) => {
    setItems(next)
    setVerified(false)
    try {
      localStorage.setItem(storageKey(projectId), JSON.stringify(next))
      setError('')
    } catch {
      setError('素材草稿未能保存到本机，请保留窗口并重试；关闭后可能丢失修改。')
    }
  }
  const importFile = async () => {
    setBusy(true)
    setError('')
    try {
      const material = await workflowCall<NativeMaterial | null>('importNativeMaterial', projectId)
      if (material) update([...items, { ...material, role: '' }])
    } catch (failure) {
      setError((failure as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const verify = async () => {
    setBusy(true)
    setError('')
    setVerified(false)
    try {
      const materials = validateNativeMaterials(
        items,
        scenes.map((scene) => scene.id),
      )
      await workflowCall('verifyNativeMaterials', projectId, materials)
      setVerified(true)
    } catch (failure) {
      setError((failure as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <details data-native-materials>
      <summary className="cursor-pointer text-body-sm font-semibold">
        画面素材 · 原生 Remotion · {items.length} 项
      </summary>
      <div className="workflow-section mt-3">
        <p className="workflow-muted">
          本机素材草稿自动保存，关闭创作设置仍保留。仅在合成新的 Remotion
          粗剪时应用；修改计划沿用原视频素材。不会更改已有视频、分镜或配音，生成后仍需审核。
        </p>
        <p className="workflow-muted">
          图片 PNG/JPEG/WebP 每项最多 32 MiB，字体 WOFF/WOFF2/TTF/OTF 最多 64 MiB；MP4 最多 1
          GiB，画面素材默认静音。
        </p>
        <div className="workflow-actions">
          <Button
            size="sm"
            variant="secondary"
            disabled={disabled || busy || !loaded || items.length >= 80}
            onClick={() => void importFile()}
          >
            导入本地素材
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={disabled || busy || !loaded}
            onClick={() => void verify()}
          >
            检查素材
          </Button>
          {!loaded && error && (
            <Button
              size="sm"
              variant="secondary"
              disabled={disabled || busy}
              onClick={() => {
                update([])
                setLoaded(true)
              }}
            >
              重置为空素材草稿
            </Button>
          )}
        </div>
        {items.map((item, index) => (
          <div
            key={item.file.id}
            className="workflow-section workflow-divider"
            data-native-material={item.file.id}
          >
            <div className="workflow-toolbar">
              <div className="min-w-0 break-words">
                <strong className="text-body-sm">{item.title}</strong>
                <p className="workflow-muted">
                  本地{item.kind === 'font' ? '字体' : item.kind === 'video' ? '视频' : '图片'} ·{' '}
                  {(item.file.size / 1024).toFixed(1)} KiB
                  {item.width ? ` · ${item.width}×${item.height}` : ''}
                  {item.duration ? ` · ${item.duration.toFixed(1)} 秒` : ''}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={disabled || busy}
                onClick={() => update(items.filter((_, position) => position !== index))}
                aria-label={`移除素材 ${item.title}`}
              >
                移出草稿
              </Button>
            </div>
            <VoiceTextArea
              label={`素材用途 · ${item.title}`}
              rows={2}
              maxLength={2000}
              value={item.role}
              disabled={disabled || busy}
              placeholder="说明画面用途、资料来源和必须保留的内容"
              onChange={(event) =>
                update(
                  items.map((entry, position) =>
                    position === index ? { ...entry, role: event.target.value } : entry,
                  ),
                )
              }
            />
            <VoiceSelect
              label={`使用范围 · ${item.title}`}
              value={item.sceneId ?? 'all'}
              disabled={disabled || busy}
              onChange={(value) =>
                update(
                  items.map((entry, position) =>
                    position === index
                      ? { ...entry, sceneId: value === 'all' ? undefined : value }
                      : entry,
                  ),
                )
              }
              options={[
                { value: 'all', label: '全片' },
                ...scenes.map((scene) => ({ value: scene.id, label: scene.title })),
              ]}
            />
            {item.sceneId && !scenes.some((scene) => scene.id === item.sceneId) && (
              <p className="workflow-error" role="alert">
                关联分镜已不存在，请重新选择范围。
              </p>
            )}
            {item.fontFamily && (
              <p className="workflow-muted break-all">字体标识：{item.fontFamily}</p>
            )}
            <p className="workflow-muted break-all">原文件指纹：{item.file.sha256}</p>
          </div>
        ))}
        {!items.length && loaded && (
          <p className="workflow-muted">
            尚未登记独立素材，可按需要导入；原生程序化画面仍可自由创作。
          </p>
        )}
        {busy && (
          <p className="workflow-muted" role="status">
            正在处理素材…
          </p>
        )}
        {verified && (
          <p className="workflow-muted" role="status">
            素材文件、用途和范围检查通过；合成前会再次校验。
          </p>
        )}
        {error && (
          <p className="workflow-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </details>
  )
}
