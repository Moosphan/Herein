# B 站封面规范核验

2026-10-26 直接读取官方投稿页及其当前脚本，未使用第三方尺寸文章作为依据：

- 页面：https://member.bilibili.com/york/videoup
- 官方脚本：https://s1.hdslb.com/bfs/static/creator-monorepo/videoup/static/js/index.1a0ef7ad.js
- `homepageCoverFourThree`：首页推荐封面（4:3）；`profileCoverSixteenNine`：个人空间封面（16:9）。
- `recommendedCoverResolution` / `batchCoverRecommendation`：推荐 ≥1200×900、4:3 高清封面。
- `imageResolutionError` 与加载校验：输入宽 ≥960、高 ≥600；`imageAspectRatioOutOfRange`：宽高比 4:3–16:9。
- `check_cover_size_fail` 附近实际校验 `size > 0x1400000`，错误参数 20，即原始图片 20 MiB。

项目封面输出：1600×1200 与 1600×900 PNG，沿用受管图片上限各 4 MiB；这是比官方原图大小更严格的内部限制。AI 代码分别排版，Image2 生成 4:3 后按中心安全区截出 16:9，预览中同时可核对。Catbus 0.2.1 仅接收一个 `--cover`，自动上传 16:9；发布包同时导出 4:3，用户可在创作中心单独设置首页推荐封面。

## 2026-11-15 · 用户确认的竖版制作范围

关联 #17。工作台输出新增 1080×1920（9:16）竖版，PNG 每张至多 4 MiB。该尺寸是用户确认的项目制作规格。B 站套图可附带独立竖版素材，应用的 Catbus 调用继续将 16:9 主文件传入单个 --cover 参数，发布包分别提供 cover.png、cover-4x3.png 和所生成的 cover-9x16.png。抖音独立 AI 封面采用 9:16 主文件，选帧封面采用实际成片画幅。

本轮访问官方投稿页与抖音开放平台文档的浏览工具请求失败，当前制作范围以用户决策及本地投稿通道实现为依据。平台最终展示的裁切和审核结果需在真实投稿后核对。
