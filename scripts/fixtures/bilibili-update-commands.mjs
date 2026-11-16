// Exact upstream anchors used by the hash-checked loader fixture.
export async function itemPublish() {
    const video = await uploadVideo(b, await readMedia(b.http, o.video));
}
export async function itemGet(ctx) {
    const b = await bili(ctx);
    const bvid = ctx.args.item;
    return norm.video(await api.videoInfo(b, bvid));
}
