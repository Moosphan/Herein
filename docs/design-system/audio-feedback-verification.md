# 配音修改意见验证

2026-11-15，关联 #3 的修改意见首期。实现位于 `codex/import-finished-video` 的视频工作树，复用已有单段生成、任务取消和历史版本。

## 已交付流程

逐段播放器的“更多操作”提供“按修改意见重新生成”。弹窗展示原文与修改意见，使用工作台选择的 Codex、Claude 或 DeepSeek CLI 解释意见，校验方案后将实际朗读文本送入当前 TTS 引擎。生成子段各自保留完整输出，可追加毫秒级静音，再合成为目标片段及新的完整音轨和字幕。任务与版本记录修改意见、执行器、实际合成输入和说明，生成成功后进入待审核。

普通单段重生成沿用该片段已保存的读法与停顿方案。用户可通过原历史版本入口试听和切换。提交失败保留弹窗输入，后台失败或取消保存任务意见与旧配音。

## 自动化验证

- `pnpm test:video-workflow` 通过 107 项。新增覆盖修改意见进入 CLI、合成文本进入 TTS、实际停顿时长、字幕原文、仅替换目标段、历史记录、普通重生成沿用调整、无效输入与无效方案、AI 阶段取消及合成阶段失败。
- `pnpm exec electron scripts/test-workflow-audio-controls.cjs` 覆盖真实 Electron IPC 参数、空白禁用、中文输入法 Enter、菜单方向键、Space/Enter、Tab、Escape 与焦点返回、错误就近展示、关闭重开保留意见、其余播放器稳定，以及原配音参数和历史版本入口。
- `pnpm design:check`、`pnpm design:build`、`pnpm build` 通过。Impeccable 对受影响页面的机械检查返回空问题列表。
- 本地 macOS arm64 目录打包通过，实际启动 `isPackaged=true` 的应用，确认分段菜单、意见弹窗、标签与空输入禁用状态。此包为本地未签名验证包。
- `pnpm exec tsc --noEmit -p tsconfig.web.json` 与 `pnpm exec tsc -b --pretty false` 仍报其他模块错误，包括 WebView 类型、IPC 清理函数返回类型、仓库基类约束及缺失 `@swc/core` 类型。日志中本次改动的配音工作流文件没有报错，全量类型检查尚未通过。

UI 测试同步更新了历史分页读取、file 协议下的 HashRouter 导航和历史数据加载等待，按当前入口验证。截图通过 Chromium 实际帧捕获。

## 真实 AI 与本地模型

使用隔离数据目录运行真实 Codex CLI 与 VoxCPM2。原文为“调用 toJson，把对象转成 JSON。处理完成后重新运行。”，修改意见要求函数名拆读、JSON 按字母读、完整句尾和 300 毫秒句间停顿。AI 实际输出两个纯文本子段并完成合成，完整音频为 10.220333 秒，版本状态为待审核。

实际合成输入为“调用 to J S O N，把对象转成 J S O N。”和“处理完成后再运行一次。”，前段后接 300 毫秒静音，末段后接 0 毫秒。源口播及字幕保留原文。实测结果位于本机 `/var/folders/tp/lp03pbbn6wb275zsvn3lfrq00000gn/T/audio-feedback-real-nEeiC3/report.json`。

已验证真实生成与版本链路。英文读音、字母衔接和尾音听感仍需人工试听审核。当前方案通过纯文本读法、完整句子合成与停顿控制影响输出，效果取决于所选 TTS。静音只控制间隔，模型缺失发音仍需重新生成和试听。

## 主题、尺寸与键盘截图

| 场景 | 证据 |
| --- | --- |
| 浅色 1440 | [截图](screenshots-v2/audio-correction-light-1440.png) |
| 浅色 1024 | [截图](screenshots-v2/audio-correction-light-1024.png) |
| 深色 1440 | [截图](screenshots-v2/audio-correction-dark-1440.png) |
| 深色 1024 | [截图](screenshots-v2/audio-correction-dark-1024.png) |
| 浅色 200% | [截图](screenshots-v2/audio-correction-light-200percent.png) |
| 深色 200% | [截图](screenshots-v2/audio-correction-dark-200percent.png) |
| Reduced motion 与高对比 | [截图](screenshots-v2/audio-correction-reduced-high-contrast.png) |
| 打包应用 | [截图](screenshots-v2/audio-correction-packaged.png) |

组件使用既有 Button、VoiceTextArea、DropdownMenu 与 WorkflowDialog，沿用 VIDEO-WORKFLOW-001。页面规格及迁移记录已同步，负责人及 HeroUI 退出里程碑沿用现有工作流合同。


## 多段修改与连续提交增量 · 2026-11-15

用户追加要求同时修改多个配音。原意见弹窗提供可多选的片段列表，默认选择入口片段，选择多个后按钮显示本次段数。所选片段共用本次意见；不同意见可在其他片段入口分别提交。已提交片段显示当前阶段并禁止重复提交，其他片段继续可操作。任务按项目提交顺序执行，任务日志记录目标段号，等待中可单独取消。

任务开始执行时核对前置来源和目标文件，并基于当前最新完整音轨生成。前一个任务成功后，后续任务累计保留该结果；取消或失败保留此前成功版本。活动任务始终参与冲突检查及 UI 展示，包括存在超过 100 条更新任务记录的情况。新任务及既有任务兼容同一片段目标合同，旧记录继续可查看。

`pnpm test:video-workflow` 现为 109 项通过。新增端到端回归覆盖多段合成、单段执行期间提交另一批、请求幂等、重复目标拒绝、取消等待任务及时返回、取消前一个任务后后续继续、批次中途合成失败保留前版、累计合并与历史版本，以及活动任务超过历史窗口时仍可找回。本轮使用隔离 CLI 响应和音频夹具验证队列、合成请求及版本合并，真实模型单段链路见前节实测。

Electron UI 额外验证多选参数正确传入 IPC，当前段执行时其他段仍能打开意见弹窗并提交，已提交目标在多选列表中禁用，批次失败保留输入；明暗、1440/1024、200% 缩放、reduced-motion、高对比和键盘焦点检查通过。实际界面截图如下。

- [多选浅色 1440](screenshots-v2/audio-correction-batch-light-1440.png)
- [多选浅色 1024](screenshots-v2/audio-correction-batch-light-1024.png)
- [多选深色 1440](screenshots-v2/audio-correction-batch-dark-1440.png)
- [多选深色 1024](screenshots-v2/audio-correction-batch-dark-1024.png)
- [浅色 200%](screenshots-v2/audio-correction-batch-light-200percent.png)
- [深色 200%](screenshots-v2/audio-correction-batch-dark-200percent.png)
- [高对比与减弱动效](screenshots-v2/audio-correction-batch-reduced-high-contrast.png)
- [第一段执行时提交第二段](screenshots-v2/audio-correction-batch-queue.png)

设计检查、设计构建、生产构建与格式检查通过，受影响界面机械检查无新增问题。全量类型检查仍有前节所列其他模块错误，本次变更文件在日志中无类型错误。

macOS arm64 本地未签名目录包再次构建通过。隔离启动后通过实际 renderer 验证两个目标按钮可同时选中，`aria-pressed=true` 数量为 2，file 协议加载及意见标签正常。

## 单段修改范围隔离 · 2026-11-15

真实任务记录显示，第 11 段仅要求修复“核对文件”的尾音时，AI 同时把 `User`、`JsonClass`、`UserJsonAdapter`、`KSP` 改成了中文拟音。通用提示词要求转换缩写与函数名，扩大了此次修改范围；后续意见又沿用了该合成输入。任务记录中的目标片段和意见各自对应正确。

纠音任务现在仅接收目标片段原文、本次意见与通过范围检查的本段历史调整。默认保留英文名称写法，明确指定的名称允许调整。合成前按上下文对齐完整英文标识符，越界改写会使本次任务失败并保留现有配音。已授权名称的范围随版本保存，尾音和停顿调整继续检查此前有效的英文读法。旧记录的超范围拟音在再次修改或普通重生成时丢弃，从原文重建。

新增回归覆盖尾音意见引发无关名称转写、函数名拆读与其他名称隔离、重复名称、`toJson` 展开后包含 `JSON` 的误匹配、跨子段拆词、旧版不安全输入清理及授权范围跨版本保存。视频工作流 112 项、配音 39 项测试通过，生产构建、设计检查、设计构建和修改文件 ESLint 通过。全量 TypeScript 检查仍有既存其他模块错误，修改文件没有类型错误。

真实 Qwen3-TTS 复测已完成当前 KSP 视频的第 11、12 段，分别按两段各自最新意见从原文重建，得到配音版本 10，状态为待审核。第 11 段 11.941333 秒，合成输入保留 `User`、`JsonClass`、`UserJsonAdapter` 与 `KSP` 的英文拼写。第 12 段 11.132750 秒，`Moshi`、`User`、`toJson` 使用英文原文，`JSON` 采用 `J S O N` 字母读法。英文读音、字母衔接与尾音仍待人工试听。

已逐条校验其余 15 段的版本复用、字幕正文、音色参数、原版本可追溯性和完整音频文件哈希。更新后的主目录生产应用已启动，控制通道与聚焦成功，运行构建的源码指纹匹配当前主目录。
