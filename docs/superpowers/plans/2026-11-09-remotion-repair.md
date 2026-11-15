# Remotion 有限自动修复实施计划

> 本轮按 executing-plans 在当前已存在的隔离工作树逐项实施；用户已批准从 GitHub #11 开始，不再进行执行方式确认。

**Goal:** 完成 #11，在同一次原生粗剪任务中修复可诊断源码错误，保留创意、审核和旧视频。

**Architecture:** 独立修复协调器接收创作、源码校验与真实渲染回调。只有明确的源码/编译/React 执行错误进入修复，环境与依赖缺口终止；每轮都重新验证单镜边界。总计首版加最多两轮修复，总耗时不超过二十分钟，原任务取消信号贯穿 Agent 与 Remotion。正式成片保持冻结路径。

**Tech Stack:** TypeScript / Electron / Remotion 4.0.541 / 现有 Agent CLI。

## 边界

- 在现有 codex/import-finished-video 工作树实施，保留其他未提交改动；不自动提交或推送本轮。
- 不增加镜头、布局或动作枚举，不切换执行器、引擎、事实或口播，不自动安装依赖。
- 可信入口、配音、字幕、素材清单与单镜隔离逐轮检查。
- 新源码通过真实渲染后才冻结；失败和取消不覆盖旧产物。
- 诊断仅保留有界错误信息，去除常见凭据，不把环境和任意原始进程输出回传给模型。
- 不修改界面布局；现有任务阶段显示修复次数，成功记录保存在冻结配置和检查结果。

## 文件与接口

- 新增 `remotion-repair.ts`：`NativeCreationFailure`、诊断提炼、修复协调器，参数为 prompt/create/validate/render/signal/phase，结果为源码和尝试报告。
- 修改 `remotion-native.ts`：标记可修复语法、模块与协议错误；写入可选创作报告。
- 修改 `remotion.ts`：提炼真正的编译/React 错误，环境错误仍终止。
- 修改 `remotion-authoring.ts`：准备素材和前版一次，协调器逐轮校验与写入、真实渲染后返回工程清单和报告。
- 修改 `render.ts`、`service.ts`：原生粗剪仅渲染一次，冻结修复后的文件；Agent 沿用同一选择并接收剩余时间与取消信号，成功阶段显示实际次数。
- 测试使用原生专项与真实渲染脚本，补充失败、取消、单镜越界与正式成片无 Agent 调用断言。

## 执行

- [x] 写失败测试并运行：语法修复、渲染修复、两次上限、终止错误、取消、总时限、逐轮单镜边界、诊断脱敏。
- [x] 实现协调器与错误分类，让上述测试通过。
- [x] 接通原生创作和真实渲染，补真实 service 测试：首轮渲染错误、修复后待审核、持久次数、失败保留旧版。
- [x] 验证正式成片冻结路径、导出、旧工程、工作流与 Electron 回归，更新验证文档和 #11 进展。

## 验证命令

`pnpm test:remotion:native`；`pnpm test:video-workflow`；`WORKFLOW_REMOTION_PATH=... pnpm test:remotion:native:render`；`pnpm test:remotion:ui`；`pnpm design:check`；`pnpm design:build`。完整类型检查继续区分既有诊断与本次路径。
