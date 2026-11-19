# 配音顺序播放与当前片段验证

2026-11-19，关联 #22。范围已由用户确认，一个完整任务，无前置依赖。

## 行为与状态

用户点播任意片段后，只在当前实际播放源的正常 `ended` 事件中检查紧邻下一段。下一段存在且没有运行中的修改任务才调用其原生播放；不跨越未完成片段，也没有监听生成完成后恢复播放的逻辑。正常结束前的原生 `pause` 事件与用户暂停区分，避免丢失切段机会。

当前定位与播放状态分离。标题继续使用原主题主色及 700 字重，当前项提供 `aria-current`；暂停、末段结束、错误或其他音源抢占后仍可识别最后停留项。播放按钮仅在实际播放期间高亮。每个版本/项目/生成任务的列表拥有独立播放作用域，作用域卸载停止其中音频，旧播放请求失败不会更新新的作用域；同一任务追加片段不重建原播放器。

## 回归

命令：`pnpm build`，然后 `pnpm exec electron scripts/test-workflow-audio-controls.cjs --playback-only`。

- 先在原实现复现失败：`Pause keeps the current item highlighted`，日志 `/tmp/herein-audio-sequence-red.log`。
- 修复后真实 WAV 播放通过：正常 1→2 切段、末段停止、暂停保留高亮、单一当前项、手动切段互斥、过期 ended 事件无效、播放错误保留定位。
- 完整音频抢占时逐段播放停止，原片段保持当前定位。
- 自动播放 Promise 拒绝后就近显示说明，原段保持定位，不重试、不在随后结果到达后恢复。
- 临时数据库构造生成任务，先只显示第一段，播放结束后再追加下一段；原播放器元素保留，全部维持暂停。用户重新点播后可再次顺序播放。
- 下一段已有旧音频但正在重生成时不自动播放；删除运行中任务后也不恢复。
- 切换历史版本与返回项目列表时，旧元素实际暂停，旧当前定位清除。
- 原生 Space 播放/暂停、Tab 与 Shift+Tab，明暗 1440/1024、200% 无横向溢出，高对比与 reduced-motion 截图验证。
- 另外运行 `pnpm exec electron scripts/test-workflow-audio-controls.cjs`，原配音参数、修改意见、单段/多段请求、失败保留、菜单/焦点、主题、缩放、高对比回归通过。

日志：`/tmp/herein-audio-sequence-ui-final.log`、`/tmp/herein-audio-sequence-controls.log`。明暗 1440/1024 与缩放截图已检查。代码格式检查、修改组件 ESLint、`pnpm design:check`、`pnpm design:build` 通过；全仓 TypeScript 仍有 79 项既有诊断，本次三个组件没有新增类型错误。通用长流程测试同步更新暂停/结束断言，未将其完整生成视频流程作为本轮通过证据。

最终截图目录：`/var/folders/tp/lp03pbbn6wb275zsvn3lfrq00000gn/T/workflow-audio-controls-QTEVSp`。已查看浅色 1440、深色 1024、深色 200% 的暂停高亮。独立只读代码审查无可操作发现。

## 日常应用

确认工作流、B 站和抖音均无运行中任务后重启。运行版本 `86b4b682-bf24-42b1-8eec-f6a42975afc4` 已启动并聚焦，源码指纹匹配。构建与重启日志为 `/tmp/herein-audio-sequence-daily-build.log`、`/tmp/herein-audio-sequence-restart.log`。用户已确认验收通过，提交记录关联 #22。
