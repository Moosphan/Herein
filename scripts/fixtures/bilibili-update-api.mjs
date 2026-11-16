class CatbusError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}
const MEMBER = 'https://member.bilibili.com',
  ORIGIN = { member: MEMBER },
  UPLOAD_PAGE = MEMBER
const rand = { now: () => 1 }
const headers = () => ({
  referer() {
    return this
  },
  get() {
    return {}
  },
})
export async function videoInfo(b, id) {
  return b.info(id)
}
export function submitArchive(b, a) {
  return b.post('/x/vu/web/add/v3', { json: a })
}
/** 撤稿。 */
