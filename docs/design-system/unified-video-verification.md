# 视频制作统一节点 · #16

2026-11-09 用户确认将动态粗剪与正式成片合并，关联 #14/#15，独立 issue https://github.com/Moosphan/MyDashboard/issues/16 。父任务 #10 保持原状。

## 用户行为

工作流从原 8 节点变为 7 节点：创作简报 → 内容文案 → HTML 分镜 → 口播定稿 → 分段配音 → 视频制作 → 平台发布。新视频直接交付编码；制作、逐镜/整片修改、实际画面抽检、配乐、历史、工程导出集中于原两栏工作台。一次人工视频审核后直接进入发布，不再渲染/审核相同内容第二遍。发布资料自身的人工审核继续保留。

内部保留 roughcut/render 旧标识以兼容来源、历史及投稿快照。视频制作审核前验证全部文件和冻结 manifest，在一个事务中把相同视频文件/工程登记为已审核发布引用，不运行创作 Agent 或渲染。修改或配乐产生新的待审版本并使发布失效。当前视频与用户审核、工程导出、抽检和发布来源保持一致。

旧项目保留原视频、编码、审核与全部历史；旧待审核交付版在统一节点审核，旧已审核交付版可直接继续发布。旧预览质量明确显示历史编码，人工审核不伪造 delivery 编码。用户重新制作后才应用新编码。Remotion 使用 CRF18，HyperFrames delivery；画幅和帧率不变，没有新增美术模板/动作限制。

## 验证证据

- 导航纯函数 2/2：无重复制作节点，制作下一步直接发布，导入成品项目仍仅显示发布。
- 工作流最终回归 106/106，日志 `/tmp/unified-review-workflow-final.log`；包括一次审核同文件、旧编码保持、manifest/文件损坏拒绝、字幕分段、来源失效，以及新制作版本与旧交付版本同毫秒创建时仍选择新版。
- 投稿最终回归 30/30，日志 `/tmp/unified-publishing-final.log`，无真实上传。
- 原生单元 20/20，以及真实 Remotion 横竖版合成、单镜修改、有限修复、取消、导出及配乐移除，日志 `/tmp/unified-production-native-final.log` / `/tmp/unified-review-native-render-final.log`。最终真实回归还覆盖上游 scene ID 全部更换后，沿用最新带配乐视频再只改配乐、无 Agent 调用。首轮测试因夹具 ID 串扰失败，隔离恢复夹具后完整重跑两画幅通过。真实 Remotion 渲染使用受控 Agent 源码，#14 的真实 Agent 美术样片另有记录。
- Electron 统一流程最终复验通过，日志 `/tmp/unified-ui-reviewed-final.log`：7 个可见节点、交付编码参数、审核后同 file 的 approved 发布引用、无 render 生成任务、下一步直接发布、历史抽检及对照、篡改/重试、键盘/焦点、明暗 1440/1024、200%、高对比及 reduced motion。隔离项目审核由测试脚本执行，不代表生产视频人工批准。
- 原配乐 UI 兼容回归通过，日志 `/tmp/unified-music-ui-first.log`；旧交付版配乐/当前草稿加载、试听、主题、尺寸和焦点保留。双平台选帧保存/审核/导出及 SAR 回归通过，日志 `/tmp/unified-frame-cover-ui.log`。
- 实际查看最新浅色播放器/配乐/动作及深色200%抽检弹窗截图。截图位于 `.scratch/remotion/screens`，沿用已有窄窗口滚动与控件，没有新增样式或图标迁移。
- build、design:check、design:build 通过。全量 main/web 类型检查仍报 AI Lab/MainLayout/articles 等既有错误；本次文件没有新增诊断，不宣称全仓类型通过。

## 审查与交付状态

只读审查提出的两个 P2 均已修复并复核：上游改动后仍显示最新实际视频，沿用操作保留同一文件/音乐/冻结来源；只改配乐按冻结分镜验证素材，不被新上游 scene ID 阻止。新增同毫秒选择红绿回归，统一工具栏保留“打开视频所在文件夹”。审查记录 `.scratch/remotion/unified-review.md`。全部新代码未提交/推送。

最终 build、design:check、design:build、相关文件 Prettier 和 git diff --check 通过。生产库运行中的视频任务为 0 后构建并重启日常版本 `a894b02e-5807-4c6e-9d50-449f3237bc94`；控制端响应、active/running 版本一致、源码指纹一致。日志 `/tmp/unified-daily-build-final.log` / `/tmp/unified-daily-restart-final.log`。未执行真实投稿，也未自动批准生产视频。#14 诊断样片与人工美术验收状态独立保留。
