import type { WorkflowFile } from './video-workflow'

export interface NativeMaterial {
  file: WorkflowFile
  title: string
  kind: 'image' | 'video' | 'font'
  source: 'local'
  role: string
  sceneId?: string
  fontFamily?: string
  width?: number
  height?: number
  duration?: number
}

export const NATIVE_MATERIAL_TYPES = {
  png: ['image', 'image/png'],
  jpg: ['image', 'image/jpeg'],
  jpeg: ['image', 'image/jpeg'],
  webp: ['image', 'image/webp'],
  mp4: ['video', 'video/mp4'],
  woff: ['font', 'font/woff'],
  woff2: ['font', 'font/woff2'],
  ttf: ['font', 'font/ttf'],
  otf: ['font', 'font/otf'],
} as const

export const NATIVE_MATERIAL_LIMITS = {
  image: 32 * 1024 * 1024,
  font: 64 * 1024 * 1024,
  video: 1024 * 1024 * 1024,
}

export function validateNativeMaterials(value: unknown, sceneIds?: string[]): NativeMaterial[] {
  if (!Array.isArray(value) || value.length > 80) throw new Error('画面素材清单无效或超过 80 项')
  const used = new Set<string>()
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('画面素材格式无效')
    const item = entry as NativeMaterial
    const file = item.file
    if (
      !file ||
      typeof file.id !== 'string' ||
      !/^[a-zA-Z0-9-]+$/.test(file.id) ||
      typeof file.path !== 'string' ||
      !/^media\/video-workflow\/[a-zA-Z0-9/-]+\.[a-z0-9]+$/.test(file.path) ||
      typeof file.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(file.sha256) ||
      !Number.isFinite(file.size) ||
      file.size <= 0
    )
      throw new Error('画面素材受管文件无效')
    const extension = file.path.split('.').at(-1) as keyof typeof NATIVE_MATERIAL_TYPES
    const type = NATIVE_MATERIAL_TYPES[extension]
    if (!type || type[0] !== item.kind || type[1] !== file.mime)
      throw new Error('画面素材类型不匹配')
    if (file.size > NATIVE_MATERIAL_LIMITS[item.kind]) throw new Error('画面素材超出大小限制')
    if (used.has(file.id)) throw new Error('画面素材重复，请在同一项中描述多个用途')
    used.add(file.id)
    if (item.source !== 'local') throw new Error('画面素材来源无效')
    if (typeof item.title !== 'string' || !item.title.trim() || item.title.length > 300)
      throw new Error('画面素材名称需为 1–300 字符')
    if (typeof item.role !== 'string' || !item.role.trim() || item.role.length > 2000)
      throw new Error(`素材「${item.title}」请填写 1–2000 字符用途`)
    if (
      item.sceneId !== undefined &&
      (typeof item.sceneId !== 'string' ||
        !item.sceneId ||
        (sceneIds && !sceneIds.includes(item.sceneId)))
    )
      throw new Error(`素材「${item.title}」关联分镜已不存在，请重新选择`)
    const output: NativeMaterial = {
      file: { id: file.id, path: file.path, sha256: file.sha256, size: file.size, mime: file.mime },
      title: item.title.trim(),
      kind: item.kind,
      source: 'local',
      role: item.role.trim(),
      ...(item.sceneId ? { sceneId: item.sceneId } : {}),
      ...(item.kind === 'font' ? { fontFamily: `WorkflowFont_${file.sha256.slice(0, 16)}` } : {}),
    }
    for (const key of ['width', 'height', 'duration'] as const) {
      if (item[key] !== undefined) {
        if (!Number.isFinite(item[key]) || item[key]! <= 0) throw new Error('画面素材媒体规格无效')
        output[key] = item[key]
      }
    }
    return output
  })
}
