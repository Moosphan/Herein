import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { BilibiliPublishSnapshot } from '../../../shared/bilibili-publishing'

// Installed Catbus remains untouched. Both modules are checked before the upload process starts.
export function bilibiliUpdateSources(
  api: string,
  commands: string,
  target: NonNullable<BilibiliPublishSnapshot['updateTarget']>,
  receipt: string,
  inspect = false,
) {
  const start = api.indexOf('export function submitArchive(b, a) {')
  const end = api.indexOf('\n/** 撤稿。', start)
  const marker = '    const video = await uploadVideo(b, await readMedia(b.http, o.video));'
  if (
    start < 0 ||
    end < 0 ||
    !api.slice(start, end).includes('/x/vu/web/add/v3') ||
    commands.split(marker).length !== 2
  )
    throw new Error('UPDATE_UNSUPPORTED')
  const getMarker = '    return norm.video(await api.videoInfo(b, bvid));'
  if (inspect && commands.split(getMarker).length !== 2) throw new Error('UPDATE_UNSUPPORTED')
  const config = JSON.stringify(target)
  const preparation = `
let hereinOriginal;
export async function hereinPrepareUpdate(b) {
  if (hereinOriginal) return hereinOriginal;
  const target = ${config};
  if (String(b.mid) !== target.accountUid) throw new CatbusError('UPDATE_INVALID', '原作品账号不一致');
  const info = await videoInfo(b, target.externalId);
  if (info.bvid !== target.externalId || String(info.owner?.mid) !== target.accountUid || info.pages?.length !== 1)
    throw new CatbusError('UPDATE_INVALID', '原作品归属或分P不支持');
  const original = await b.get(MEMBER + '/x/vupre/web/archive/view', {
    headers: headers('GET', { origin: ORIGIN.member, sameOrigin: true }).referer(UPLOAD_PAGE).get(),
    query: [['bvid', target.externalId]]
  });
  if (String(original?.archive?.aid) !== String(info.aid) || original.videos?.length !== 1 || !/^\\d+$/.test(String(original.videos[0].cid)))
    throw new CatbusError('UPDATE_INVALID', '原作品完整资料不可核实');
  // archive/view returns display objects. The web editor submits their numeric values.
  const archive = original.archive;
  const humanType = archive.human_type2?.id ?? archive.human_type2 ?? 0;
  const recreate = archive.recreate?.switch ?? archive.recreate ?? 0;
  if (!Number.isInteger(humanType) || humanType < 0 || ![-1, 0, 1].includes(recreate))
    throw new CatbusError('UPDATE_INVALID', '原作品分类或二创设置无法转换为编辑参数');
  original.archive = { ...archive, human_type2: humanType, recreate };
  hereinOriginal = original;
  return original;
}
`
  const replacement = `export async function submitArchive(b, a) {
  const original = await hereinPrepareUpdate(b);
  const target = ${config};
  const cid = a.videos?.[0]?.biz_id;
  if (!cid || a.videos.length !== 1) throw new CatbusError('UPDATE_INVALID', '上传回执无有效分P');
  const body = { ...original.archive,
    aid: original.archive.aid, bvid: target.externalId,
    new_web_edit: 1,
    copyright: a.copyright ?? 1, source: a.source ?? '', cover: a.cover,
    title: a.title, tid: a.tid, tag: a.tag, desc: a.desc ?? '',
    desc_format_id: 0,
    desc_v2: a.desc ? [{ raw_text: a.desc, type: 1, biz_id: '' }] : [],
    is_only_self: a.private === false ? 0 : 1,
    videos: [{ filename: a.videos[0].filename, title: a.title, desc: '', cid }],
    csrf: b.csrf };
  // Persist the uploaded content identity before the write for interrupted-response reconciliation.
  hereinWriteReceipt(${JSON.stringify(receipt)}, JSON.stringify({ cid: String(cid), filename: a.videos[0].filename }), { mode: 0o600 });
  const result = await b.post(MEMBER + '/x/vu/web/edit', {
    headers: headers('POST', { origin: ORIGIN.member, sameOrigin: true }).referer(UPLOAD_PAGE).get(),
    query: [['t', rand.now()], ['csrf', b.csrf]], json: body });
  if (result?.bvid && result.bvid !== target.externalId || result?.aid && String(result.aid) !== String(original.archive.aid))
    throw new CatbusError('INVALID_RESPONSE', '原作品更新回执不一致');
  return { ...result, bvid: target.externalId, aid: original.archive.aid };
}`
  return {
    api:
      "import { writeFileSync as hereinWriteReceipt } from 'node:fs';\n" +
      api.slice(0, start) +
      preparation +
      replacement +
      api.slice(end),
    commands: inspect
      ? commands.replace(getMarker, '    return api.hereinPrepareUpdate(b);')
      : commands.replace(marker, '    await api.hereinPrepareUpdate(b);\n' + marker),
  }
}

export function bilibiliUpdatePreload(
  entry: string,
  target: NonNullable<BilibiliPublishSnapshot['updateTarget']>,
  receipt: string,
  inspect = false,
) {
  const paths = ['api', 'commands'].map((name) =>
    resolve(dirname(entry), `../platforms/bilibili/web/${name}.js`),
  )
  let originals: string[]
  try {
    originals = paths.map((path) => readFileSync(path, 'utf8'))
  } catch {
    throw new Error('UPDATE_UNSUPPORTED')
  }
  const sources = bilibiliUpdateSources(originals[0], originals[1], target, receipt, inspect)
  const replacements = paths.map((path, index) => ({
    url: pathToFileURL(path).href,
    hash: createHash('sha256').update(originals[index]).digest('hex'),
    source: index === 0 ? sources.api : sources.commands,
  }))
  const hook = `import { createHash } from 'node:crypto';
const replacements = ${JSON.stringify(replacements)};
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  const replacement = replacements.find(item => item.url === url);
  if (!replacement) return result;
  if (createHash('sha256').update(String(result.source)).digest('hex') !== replacement.hash) throw new Error('UPDATE_UNSUPPORTED');
  return { ...result, source: replacement.source };
}`
  return `import { register } from 'node:module'; register(${JSON.stringify('data:text/javascript;base64,' + Buffer.from(hook).toString('base64'))}, ${JSON.stringify(pathToFileURL(entry).href)});`
}
