import { nativeImage } from 'electron'
import { openSync, closeSync, readSync, lstatSync } from 'node:fs'
import { basename, extname, dirname } from 'node:path'
import {
  NATIVE_MATERIAL_TYPES,
  validateNativeMaterials,
  type NativeMaterial,
} from '../../../shared/video-materials'
import type { WorkflowRuntime } from '../../../shared/video-workflow'
import { WorkflowFiles } from './files'
import { workflowCommand } from './process'

export async function importNativeMaterial(
  projectId: string,
  path: string,
  files: WorkflowFiles,
  runtime: WorkflowRuntime,
): Promise<NativeMaterial> {
  const extension = extname(path).slice(1).toLowerCase() as keyof typeof NATIVE_MATERIAL_TYPES
  const type = NATIVE_MATERIAL_TYPES[extension]
  if (!type || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink())
    throw new Error('请选择本地 PNG、JPEG、WebP、MP4 或 WOFF/WOFF2/TTF/OTF 普通文件')
  const file = await files.import(projectId, path)
  const managed = await files.verify(projectId, file)
  const metadata: Partial<NativeMaterial> = {}
  if (type[0] === 'image') {
    const image = nativeImage.createFromPath(managed)
    if (image.isEmpty()) throw new Error(`图片「${basename(path)}」无法解码，请检查实际内容`)
    Object.assign(metadata, image.getSize())
  } else if (type[0] === 'video') {
    const raw = await workflowCommand(
      runtime.ffprobePath,
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration:stream=codec_type,width,height',
        '-of',
        'json',
        managed,
      ],
      { cwd: dirname(managed), timeout: 30000 },
    )
    const data = JSON.parse(raw)
    const stream = data.streams?.find((item: { codec_type: string }) => item.codec_type === 'video')
    const duration = Number(data.format?.duration)
    if (!stream?.width || !stream.height || !Number.isFinite(duration) || duration <= 0)
      throw new Error(`视频「${basename(path)}」缺少有效画面或时长`)
    Object.assign(metadata, { width: stream.width, height: stream.height, duration })
  } else {
    const header = Buffer.alloc(4)
    const descriptor = openSync(managed, 'r')
    try {
      readSync(descriptor, header, 0, 4, 0)
    } finally {
      closeSync(descriptor)
    }
    const signatures: Record<string, string> = {
      woff: 'wOFF',
      woff2: 'wOF2',
      otf: 'OTTO',
      ttf: '\u0000\u0001\u0000\u0000',
    }
    const expected = signatures[extension]
    if (header.toString('latin1') !== expected)
      throw new Error(`字体「${basename(path)}」格式与内容不匹配`)
  }
  return validateNativeMaterials([
    {
      file,
      title: basename(path),
      source: 'local',
      kind: type[0],
      role: '按画面需要使用',
      ...metadata,
    },
  ])[0]
}
