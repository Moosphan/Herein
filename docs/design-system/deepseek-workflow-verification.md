# DeepSeek Harness 视频工作流验证

日期：2026-11-04。UI 范围沿用 VIDEO-WORKFLOW-001；保持既有布局、VoiceSelect / VoiceInput、Radix 弹窗与应用主题，没有添加控件样式、图标或运行时依赖。

## 协议与业务

- 官方包 `@deepseek-ai/dsh@0.2.1-rc.5`，使用 headless NDJSON 协议；非交互输入经 stdin，patch 在 `--json` 前传递。不使用该发行版未支持的权限 CLI 参数。
- 仅接受成功退出、会话已完成和终止 `final.text`；思考和中间文字不会成为产物。超时、取消、进程树清理与输出上限复用工作流进程执行层。
- 主进程统一允许 Codex、Claude、DeepSeek，模板 MG 和粗剪初始 MG 尊重显式选择。路径为空时明确报错，不转交其他服务商。
- 覆盖旧配置加载、路径持久化、npm JavaScript 入口检测、stdin/参数、失败与脱敏、截断输出、取消、超时及显式 MG 执行器的工作流回归为 **83/83 通过**。
- 另以真实官方 `dsh@0.2.1-rc.5` 与当前适配器运行隔离 smoke：独立 Harness home，强制阻断 socket/fetch，替换真实提供商为本地 `LlmAdapter`。确认收到 stdin 标记、模型未收到工具、已注册的合成工具被 guard 拒绝，NDJSON 被正式解析器接受。该检查验证真实 CLI 加载和协议，但不代表已经验证在线 API 认证及生成质量。

## Electron 合成验证

命令：`pnpm build && pnpm exec electron scripts/test-deepseek-workflow-ui.cjs`。

使用临时数据库与合成项目、合成 dsh，不读取个人作品和提供商凭据；阻断应用外部 HTTP/HTTPS。测试经过真实渲染页面、preload IPC、主进程服务与本地子进程。

- 执行环境展示 DeepSeek 路径，保存后实际读取一致；关闭焦点返回入口。
- 使用 Space / Home / End / Enter 操作 Select；默认 Codex，可切换 DeepSeek；粗剪动效面板和阶段选择共享，重载后仍保留。
- DeepSeek 返回新文案后显示待审核；模拟退出码 1 时任务失败且上一版文案原样保留。
- 浅色/深色、1440/1024 宽度检查无文档横向溢出，并保存合成截图。
- 200% 缩放下执行环境弹窗可滚动，Tab 保持弹窗焦点，Escape 关闭后焦点返回。
- 截图位于本地 `.scratch/deepseek-cli/screens/`，未纳入仓库或上传。已查看 1024 深色和 200% 弹窗截图。

应用构建、`pnpm design:check` 和 `pnpm design:build` 通过。类型检查仍有其他模块既有错误，不能将全量类型检查标为通过；修改的工作流文件未报告类型错误。真实提供商认证、计费和生成质量不由合成测试证明。

## 2026-11-06 凭据服务回归

原因：headless 默认禁用 credentials，已保存于 Harness Models 的 API key 因而不可用。修复在单次 patch 中启用官方凭据服务，原 profile、密钥文件和进程环境不做迁移或复制；内容生成的工具隐藏、guard、只读与禁止审批继续保留。

适配器回归检查凭据服务启用、缺失凭据的可操作提示及密钥脱敏；修复前断言失败，修复后通过。真实官方 CLI 禁网 smoke 使用合成的 Models 凭据和空的启动 API key：修复前复现 MISSING_CREDENTIAL，修复后从官方凭据服务的 file 来源解析成功，验证没有将存储密钥导出为环境变量。缺失凭据时仍保留原版本，提示去 Harness Models 页面配置，不自动切换服务商。

已分别验证 npm 0.2.1-rc.5 和桌面版 0.2.1-rc.3。桌面版另在隔离测试 home 中通过官方 credentials 插件只读核实本机已有凭据可解析，未输出其值；文件前后字节比较一致，测试继续强制禁网且使用合成 provider，没有在线模型调用。全量工作流回归 83/83、应用构建、合成 Electron 回归、design:check 和 design:build 通过。

## 2026-11-06 分镜动效协议兼容

实际失败发生在分镜结构校验：Agent 使用 `transform: "scaleX(0)"`、`transform: "translate(50px, -8px)"`，宿主只接受直接 `scaleX` / `translate` 字段。兼容限定在 Agent 返回边界，转为既有字段后仍走严格校验；共享校验器和手工输入不放开任意 CSS。仅转换单个 scale / scaleX / scaleY / translate(px, px) / rotate(deg)，复合变换、百分比、矩阵、冲突属性、未知属性及越界数值仍拒绝。分镜和粗剪计划共用该适配；提示词明确字段层级。

恢复验证还发现 SVG 横线有实际描边但 getBoundingClientRect 的高度为零，被错误视为不可见。目标校验现在额外检查 SVGGeometryElement、非零几何长度、可见描边宽度和透明度；祖先隐藏与定义元素拦截保留。合成 Electron 回归覆盖水平线、竖线、路径，以及空点、无描边、零宽描边、透明描边、隐藏组和 defs。

旧动效测试的 fake Codex 未处理 `mcp list`，缺少输出参数时会误将 Node 可执行文件当输出文件。已增加 MCP 响应与输出参数检查；本轮受影响的 Node 24.13.0 已从本地缓存的官方包恢复，并与 nodejs.org 的 SHA-256 清单核对一致。业务代码没有新增系统文件写入行为。

恢复结果的完整 DOM 校验又复现了初始 `transform: scaleX(0)` 的 HTML 入场线条误判。零边界时额外读取 HTMLElement 的布局尺寸，保持原始变换并继续检查隐藏祖先；真正零尺寸、display:none、visibility:hidden 的目标仍拒绝。先新增真实 Electron 回归并确认失败，再修复并通过完整动效测试，覆盖原样序列化、SVG 描边、目标选择、反向 seek 和逐元素缩放。

本轮工作流回归 **84/84**、最终应用构建、DeepSeek 合成 Electron 业务/键盘/主题/视口/200% 弹窗回归通过。合成回归继续阻断网络，不用于证明真实模型质量。

现有失败会话的 9 镜结果已通过结构和实际 DOM 动效目标校验。第 7 镜另外存在引用裂纹 ID 却未创建元素的模型遗漏，使用真实 DeepSeek CLI 仅修复该镜；该步骤有一次在线模型调用，其余 8 镜保持恢复候选原样。保存前确认没有运行任务且项目版本未变化，并创建本地数据库备份；通过正常服务 save 路径保存为分镜 v4 待审核，旧 v3 和原失败任务保留，未自动审核或推进后续阶段。会话、作品内容、凭据及数据库备份只保留本机，未纳入仓库或上传。

`pnpm daily:build`、停止/启动及应用控制端点检查通过，运行中的 release 与新构建一致。真实作品只验证到分镜结构、素材输入和动效目标，不代表成片渲染及艺术效果已审核。
