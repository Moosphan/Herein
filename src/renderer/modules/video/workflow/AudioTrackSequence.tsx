import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { AudioTrack } from '@shared/video-workflow'

export function AudioTrackSequence({
  tracks,
  blockedIds,
  children,
}: {
  tracks: AudioTrack[]
  blockedIds: string[]
  children: (currentId: string | null) => ReactNode
}) {
  const container = useRef<HTMLElement>(null)
  const active = useRef<HTMLAudioElement | null>(null)
  const request = useRef({ id: 0 })
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [error, setError] = useState('')
  useLayoutEffect(() => {
    const section = container.current
    const lifetime = request.current
    return () => {
      ++lifetime.id
      active.current = null
      section?.querySelectorAll('audio').forEach((media) => media.pause())
    }
  }, [])
  const stop = (target: EventTarget) => {
    if (target === active.current) {
      active.current = null
      ++request.current.id
    }
  }
  return (
    <section
      ref={container}
      aria-label="逐镜试听"
      onPlayCapture={(event) => {
        const media = event.target
        if (!(media instanceof HTMLAudioElement) || media.paused) return
        ++request.current.id
        active.current = media
        setCurrentId(media.dataset.trackId ?? null)
        setError('')
      }}
      onPauseCapture={(event) => {
        // Native playback emits pause before ended. Preserve the active source for that handoff.
        if (event.target instanceof HTMLAudioElement && !event.target.ended) stop(event.target)
      }}
      onAbortCapture={(event) => stop(event.target)}
      onEmptiedCapture={(event) => stop(event.target)}
      onErrorCapture={(event) => stop(event.target)}
      onEndedCapture={(event) => {
        const media = event.target
        if (!(media instanceof HTMLAudioElement) || media !== active.current || !media.ended) return
        active.current = null
        const attempt = ++request.current.id
        const index = tracks.findIndex((track) => track.file.id === media.dataset.trackId)
        const next = index < 0 ? undefined : tracks[index + 1]
        if (!next || blockedIds.includes(next.file.id)) return
        const player = [...(container.current?.querySelectorAll('audio') ?? [])].find(
          (item) => item.dataset.trackId === next.file.id,
        )
        if (!player) return
        try {
          player.currentTime = 0
          void player.play().catch(() => {
            if (request.current.id === attempt)
              setError('下一段未能自动播放，请手动播放以继续试听。')
          })
        } catch {
          if (request.current.id === attempt) setError('下一段未能自动播放，请手动播放以继续试听。')
        }
      }}
    >
      <div className="workflow-section">{children(currentId)}</div>
      {error && (
        <p className="workflow-error" role="alert" data-audio-sequence-error>
          {error}
        </p>
      )}
    </section>
  )
}
