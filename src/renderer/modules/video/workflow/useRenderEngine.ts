import { useSyncExternalStore } from 'react'
import {
  isVideoRenderEngine,
  type VideoProject,
  type VideoRenderEngine,
} from '@shared/video-workflow'
import { productionRevision } from '@shared/video-production'

const changedEvent = 'video-render-engine-changed'
const memory = new Map<string, VideoRenderEngine>()

function subscribe(listener: () => void) {
  window.addEventListener(changedEvent, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(changedEvent, listener)
    window.removeEventListener('storage', listener)
  }
}

export function useRenderEngine(project: VideoProject) {
  const key = `video-workflow:render-engine:${project.id}`
  const fallback =
    (
      productionRevision(project)?.payload as
        | import('@shared/video-workflow').RenderPayload
        | undefined
    )?.renderEngine ?? 'hyperframes'
  const current = () => {
    try {
      const value = localStorage.getItem(key)
      return isVideoRenderEngine(value) ? value : fallback
    } catch {
      return memory.get(key) ?? fallback
    }
  }
  const selected = useSyncExternalStore(subscribe, current, () => fallback)
  const select = (value: string) => {
    if (!isVideoRenderEngine(value)) return
    memory.set(key, value)
    try {
      localStorage.setItem(key, value)
    } catch {
      memory.set(key, value)
    }
    window.dispatchEvent(new Event(changedEvent))
  }
  return [selected, select] as const
}
