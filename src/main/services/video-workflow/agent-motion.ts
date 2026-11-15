function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function motionFrame(value: unknown): unknown {
  const frame = record(value)
  if (!frame || typeof frame.transform !== 'string') return value
  if (['translate', 'scale', 'scaleX', 'scaleY', 'rotate'].some((key) => key in frame)) return value
  const numeric = '-?\\d+(?:\\.\\d+)?'
  const scale = new RegExp(`^\\s*(scale|scaleX|scaleY)\\(\\s*(${numeric})\\s*\\)\\s*$`).exec(
    frame.transform,
  )
  const translate = new RegExp(
    `^\\s*translate\\(\\s*(${numeric})px\\s*,\\s*(${numeric})px\\s*\\)\\s*$`,
  ).exec(frame.transform)
  const rotate = new RegExp(`^\\s*rotate\\(\\s*(${numeric})deg\\s*\\)\\s*$`).exec(frame.transform)
  let converted: Record<string, unknown>
  if (scale) converted = { [scale[1]]: Number(scale[2]) }
  else if (translate) converted = { translate: `${translate[1]}px ${translate[2]}px` }
  else if (rotate) converted = { rotate: `${rotate[1]}deg` }
  else return value
  const { transform, ...properties } = frame
  return { ...properties, ...converted }
}

function motionEffects(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map((value) => {
    const effect = record(value)
    return effect && Array.isArray(effect.keyframes)
      ? { ...effect, keyframes: effect.keyframes.map(motionFrame) }
      : value
  })
}

export function normalizeAgentMotion(value: unknown): unknown {
  const input = record(value)
  if (!input || !Array.isArray(input.scenes)) return value
  return {
    ...input,
    scenes: input.scenes.map((value) => {
      const scene = record(value)
      if (!scene) return value
      const motion = record(scene.motion)
      return {
        ...scene,
        ...(scene.effects === undefined ? {} : { effects: motionEffects(scene.effects) }),
        ...(motion ? { motion: { ...motion, effects: motionEffects(motion.effects) } } : {}),
      }
    }),
  }
}
