import { useEffect, useRef, useState } from 'react'
import {
  AcademicCapIcon,
  BookmarkIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CameraIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  CpuChipIcon,
  FilmIcon,
  FolderIcon,
  GlobeAltIcon,
  HeartIcon,
  HomeIcon,
  LightBulbIcon,
  MusicalNoteIcon,
  PlusIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  SwatchIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { MOODBOARD_ICONS, type MoodboardCategory, type MoodboardIcon } from '@shared/moodboard'

const icons = {
  bookmark: BookmarkIcon,
  code: CodeBracketIcon,
  palette: SwatchIcon,
  cpu: CpuChipIcon,
  academic: AcademicCapIcon,
  briefcase: BriefcaseIcon,
  puzzle: PuzzlePieceIcon,
  folder: FolderIcon,
  book: BookOpenIcon,
  camera: CameraIcon,
  film: FilmIcon,
  music: MusicalNoteIcon,
  globe: GlobeAltIcon,
  heart: HeartIcon,
  home: HomeIcon,
  lightbulb: LightBulbIcon,
  wrench: WrenchScrewdriverIcon,
  chart: ChartBarIcon,
  rocket: RocketLaunchIcon,
  chat: ChatBubbleLeftRightIcon,
}

export function MoodboardCategoryIcon({
  icon,
  className,
}: {
  icon: MoodboardIcon
  className?: string
}) {
  const key = Object.hasOwn(icons, icon) ? icon : 'bookmark'
  const Icon = icons[key]
  return <Icon aria-hidden="true" data-category-icon={key} className={className} />
}

export function MoodboardCategoryEditor({
  onCreated,
}: {
  onCreated: (category: MoodboardCategory) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<MoodboardIcon>('bookmark')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const lock = useRef(false)
  const mounted = useRef(true)
  const restoreFocus = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    if (open) input.current?.focus()
    else if (!saving && restoreFocus.current) {
      trigger.current?.focus()
      restoreFocus.current = false
    }
  }, [open, saving])
  const close = () => {
    restoreFocus.current = true
    setOpen(false)
  }
  const save = async () => {
    if (lock.current) return
    if (!name.trim()) {
      setError('请填写类别名称')
      input.current?.focus()
      return
    }
    lock.current = true
    setSaving(true)
    setError('')
    try {
      const response = await window.electronAPI.invoke('moodboard:addCategory', {
        label: name,
        icon,
      })
      if (!response.success) throw new Error(response.error || '类别保存失败，请重试')
      if (mounted.current) {
        onCreated(response.data)
        close()
      }
    } catch (failure) {
      if (mounted.current) setError((failure as Error).message)
    } finally {
      lock.current = false
      if (mounted.current) setSaving(false)
    }
  }
  return (
    <>
      <Button
        ref={trigger}
        size="sm"
        variant="ghost"
        aria-expanded={open}
        aria-controls="moodboard-category-editor"
        disabled={saving}
        onClick={() => {
          setName('')
          setIcon('bookmark')
          setError('')
          setOpen(!open)
        }}
      >
        <PlusIcon className="w-4 h-4" aria-hidden="true" />
        新增类别
      </Button>
      {open && (
        <div
          id="moodboard-category-editor"
          data-moodboard-category-editor
          role="group"
          aria-label="新增类别"
          className="w-full space-y-sm mt-sm border border-outline-variant/30 rounded-lg p-sm"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              if (!lock.current) close()
            }
          }}
        >
          <div>
            <label
              htmlFor="moodboard-category-name"
              className="font-label-sm text-on-surface-variant"
            >
              类别名称
            </label>
            <input
              ref={input}
              id="moodboard-category-name"
              value={name}
              disabled={saving}
              aria-invalid={!!error}
              aria-describedby={error ? 'moodboard-category-error' : undefined}
              onChange={(event) => {
                setName(event.target.value)
                setError('')
              }}
              className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-lg px-md py-sm text-body-sm outline-none mt-xs"
            />
          </div>
          <fieldset disabled={saving}>
            <legend className="font-label-sm text-on-surface-variant mb-xs">图标</legend>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-xs">
              {MOODBOARD_ICONS.map((option) => (
                <Button
                  key={option.value}
                  size="icon"
                  variant={icon === option.value ? 'primary' : 'ghost'}
                  aria-label={`图标：${option.label}`}
                  title={option.label}
                  aria-pressed={icon === option.value}
                  onClick={() => setIcon(option.value)}
                >
                  <MoodboardCategoryIcon icon={option.value} className="w-5 h-5" />
                </Button>
              ))}
            </div>
          </fieldset>
          {error && (
            <p
              id="moodboard-category-error"
              role="alert"
              className="text-body-sm text-error break-words"
            >
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-xs">
            <Button size="sm" variant="ghost" disabled={saving} onClick={close}>
              取消新增类别
            </Button>
            <Button size="sm" disabled={saving} onClick={() => void save()}>
              {saving ? '保存中…' : '保存类别'}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
