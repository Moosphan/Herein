# B 站原作品更新验证

2026-11-16 · 任务 #19 · 父任务 #20 · 依赖 #18

## 实现边界

发布方式默认创建新作品，用户显式选择本项目同账号已通过的原作品并确认后才提交更新。请求冻结原投稿记录 ID、BV、原链接、账号、成片与发布资料版本。旧记录缺省沿用创建行为，抖音继续创建投稿。更新目前支持单分P，分P不匹配或账号、原作品资料无法核实时停止并提示。

Catbus 0.2.1 子进程使用临时 Node loader，检查安装包 API 与命令源码哈希后适配本次调用。上传前读取原作品归属和创作中心完整资料，保留原稿高级字段，复用视频与封面上传，将最终提交改为带原 aid/BV 的编辑请求。适配范围限定为本次子进程调用。回执在数据库保存 CID 与上传 filename 后才删除，启动、核查与手动恢复会读取遗留回执。

成功回执进入审核中。上传 CID 在编辑请求前写入按投稿记录 ID 关联的持久回执，平台响应中断时用于保留待核查状态。核查通过需要创作中心确认本次上传 filename 或上传 CID，并核实稿件通过及可用的分P状态。未知更新可以经用户创作中心核查、显式确认和应用的账号、稳定状态、filename 与 CID 核对后重新尝试更新同一原作品。

## 自动化证据

- `pnpm test:bilibili-publishing` 36 项通过。覆盖既有双平台投稿、更新原记录选择、账号门禁、定时更新拒绝、请求及同 BV 同版本防重、原链接保留、旧 CID 不能确认更新通过，适配不兼容时上传前停止，未知更新的核查与同目标重试，以及模拟提交后应用中断时的持久回执恢复。
- 真实安装的 Catbus 0.2.1 API 源码通过 loader 导入并使用受控请求执行。核对编辑端点、原 aid/BV、新上传 CID 与 filename、高级字段保留，错误账号、所有者和多分P均为零写入。测试可通过 `HEREIN_CATBUS_TEST_ENTRY` 指定安装位置，本机实际执行通过。
- `pnpm typecheck` 与 `pnpm build` 通过。
- `electron scripts/test-bilibili-publishing-ui.cjs` 通过。使用临时用户数据和本地平台回执，覆盖创建/更新、原作品选择、确认前零新增请求、取消与 Escape、焦点返回、明暗主题、1440/1024 宽度、200% 缩放、原 BV 审核回执和旧内容核查失败。

## 外部验证

开发验证使用本地受控平台请求。编辑请求与简介字段采用维护中的 biliup 协议结构，`Studio` 包含 `desc_format_id`、`desc` 和 `desc_v2`，`Credit` 使用 `type`、`raw_text`、`biz_id`。原稿富文本简介在更新时替换为当前已审核的纯文本简介。[biliup 源码](https://github.com/biliup/biliup/blob/master/crates/biliup/src/uploader/bilibili.rs)

真实平台更换视频、封面与资料仍需用户在应用中确认执行后核查，平台当前账号的作品编辑权限及风控结果由实际接口返回。


## 集成复核

主代理检查了最终明暗确认弹窗截图。完整 `tsc -b --pretty false` 仍报告 79 项仓库既有诊断，本轮更新路径无新增诊断。原生 `tsc --noEmit` 命令通过的结果同时保留。源码路径 ESLint 按既有空 catch 例外检查通过。

复核发现的应用中断回执缺失已修复，回执按投稿记录 ID 关联，数据库保存 CID 与上传 filename 后清理。测试覆盖提交后进程中断、启动恢复、旧 CID 拒绝通过及新 CID 核查。原稿富文本简介会替换为当前已审核的纯文本字段，同一 BV 与同一审核版本的更新按内容防重。最终集成复核没有尚待解决的重要问题。


日常应用 release `2399d93f-c327-455b-af06-6ac813b17f4f` 已构建、重启并聚焦，控制接口响应且源码指纹匹配。集成串行重跑工作流 117/117 与发布 36/36 通过，日志 `/tmp/herein-publication-integration-workflow.log`、`/tmp/herein-publication-integration-publishing.log`。完整类型检查日志为 `/tmp/herein-publication-integration-types.log`。当前生产项目的资料复用确认、资料审核与原作品更新操作由用户在应用中执行。


## 2026-11-16 · #19 参数错误 21001 修复复核

平台返回“参数错误，状态码 21001”的此次编辑已明确失败。上一轮尝试沿用原分P CID，11:06 的真实重试仍然被拒绝。该轮测试曾使用错误的替换 CID 断言，且省略真实响应中的对象型设置。后续直接核验 B 站当前网页的上传及编辑流程，修正为新上传 filename 与对应 biz_id/CID。视频条目仅提交 filename、title、desc 与新上传 CID。

回执持久保存上传 CID 与 filename，数据库保存后清理旁路回执，兼容旧 CID-only 记录。核查通过带原账号与作品归属校验的创作中心只读查询，使用新 filename 或上传 CID 证明本次内容已生效，并按 Catbus 0.2.1 创作中心状态映射处理审核与退回。公开页继续显示原视频时，缺少本次内容证明的记录保留当前状态并显示“尚未核实本次更新内容”，不会从旧内容推断审核中。历史记录的特定 21001 错误文本在只读核实原内容后恢复为失败，网络中断记录继续保留待核查状态。

数值平台错误码 21001 保存为结构化字段并进入可手动重试的失败状态。手动确认未生效前同时核查 filename 与 CID，避免原分P CID 保持不变时误允许重试。核查不发起编辑或投稿。

本轮回归仅使用临时数据库与受控平台请求，真实平台更新仍需实际提交及后续核查。没有用模拟成功结果证明真实平台编辑成功。


修复回归 `pnpm test:bilibili-publishing` 39/39 通过，日志 `/tmp/herein-update21001-final3.log`。新增覆盖明确 21001 拒绝、旧错误记录只读恢复、同 CID 新 filename 证明、旧 CID-only 核查与非零分P状态阻止通过。真实安装 Catbus 的 `commands.itemGet` 经 inspection loader 与模拟认证客户端执行，验证只读返回、零 POST；该轮编辑测试曾断言原分P CID，后续按当前网页替换流程更正为新上传 CID，继续校验四个视频字段与新资产回执。`pnpm typecheck` 通过，源码 ESLint 按已有空 catch 例外通过。完整 UI、构建及日常应用实机验证由集成复核记录。


最终状态守卫要求创作中心分P明确返回 `status === 0` 才允许核查通过，缺失状态保留待核实结果。已有明确 21001 拒绝且本次资产不匹配时，其他编辑产生的审核中或退回状态不会覆盖本次失败。两项回归先重现失败，日志 `/tmp/herein-update21001-guards-red.log`。
修复后发布回归 39/39 通过，日志 `/tmp/herein-update21001-guards-green.log`，`pnpm typecheck` 与源码 ESLint 按已有空 catch 例外再次通过。


真实记录 `85f4d804-8fb7-403e-bd39-66ae17e4afb2` 已通过正常发布服务的 refresh 做平台只读核查。原公开 CID 与创作中心原分P一致，旧更新回执 CID 未生效。记录现为 failed，platformCode 为 21001，错误明确显示参数拒绝及可手动重试，关联作品继续为 BV1BrsW6fEch。查询记录见 `/tmp/herein-update21001-reconciled.json`，本轮未调用平台编辑请求。最终工作流 117/117 和发布 39/39 通过。完整 TypeScript 检查仍有其他模块既有诊断，当前修改路径无新增诊断。


## 2026-11-16 · 11:06 重试后的编辑协议核验

真实记录 `59f72f45-f136-4050-b7f0-88ec5d6ec74f` 上传成功后仍返回 21001。认证只读查询确认原视频仍在，原分P CID 为 43634852441，本次上传 CID 为 43643699763。记录保持明确失败，可由用户重新确认更新。

直接读取 B 站当前网页入口及其引用的 `index.9f5ceff0.js`，沿 `archive/view`、`BeforeUpload` 和 `getBasicParams` 核验完整链路。查询响应的 `human_type2` 是包含 id 的对象，`recreate` 是包含 switch 的对象。编辑请求将它们分别转换为数字 id 和 switch，并发送 `new_web_edit: 1`。替换文件的上传事件同时更新 filename 与 CID，最终编辑使用该新文件的 CID。追加分P的已有项规则不能用于推导替换文件请求。

适配器现在在上传前校验并转换分类及二创设置，兼容对象、数字及缺省响应，拒绝非法设置。回归使用真实响应结构，覆盖对象值、数字值、缺省值和非法值，保留原作品 aid/BV 与高级设置，并验证新文件和新 CID 匹配。两项回归已分别在修复前失败。

真实只读返回的数据在本地拦截传输下再次通过实际安装的 Catbus loader 构造编辑请求，核实数值分类 0、二创开关 -1、编辑标志 1，以及本次上传 CID 和 filename。报告 `/tmp/herein-retry-schema-verified.json`。该验证的外部网络写请求数为零，真实平台编辑结果仍需实际确认提交后核查。

来源为 B 站当前产品源码 [投稿入口](https://member.bilibili.com/york/videoup?new) 与其引用的 [网页脚本](https://s1.hdslb.com/bfs/static/creator-monorepo/videoup/static/js/index.9f5ceff0.js)。

本轮最终发布测试 39/39、工作流 117/117 通过。日志为 `/tmp/herein-update-edit-schema-final.log` 与 `/tmp/herein-update-edit-schema-workflow.log`。`pnpm typecheck`、相关源码与测试 ESLint、Prettier 和差异检查通过。

完整 `tsc -b` 仍有 79 项既有诊断，本次修改路径无诊断。日常 release `9c8b8cd2-66d8-4ea0-a202-e8f57168ea1d` 已构建重启，控制接口运行与聚焦成功，源码指纹匹配。代码尚未提交。


## 2026-11-16 · 最新发布记录与历史日志

按用户截图要求，每个平台默认仅展示最新一次完整记录，旧记录以倒序摘要收进默认折叠的发布日志。摘要包括时间、状态、创建或更新方式和作品编号，单条展开可查看原详情并执行核查、取消或确认。全部原始持久记录仍由原服务读取，最新取服务已有的创建倒序首条。零条或一条记录省略历史入口。

Electron 回归先确认旧界面同时展开三条，修正后验证默认一条、历史两条摘要、单条详情和原作品打开操作、收起后仍有三条持久记录。覆盖空记录、单记录、两平台隔离、Enter / Space、焦点、明暗主题、1440 / 1024 和 200% 缩放。原生 summary 的 Enter 测试发送完整 char 事件，隐藏状态采用 Chromium checkVisibility 校验。主代理已检查默认收起、明暗摘要与 200% 截图。截图目录 `/var/folders/tp/lp03pbbn6wb275zsvn3lfrq00000gn/T/bilibili-ui-Wiy6rw`，日志 `/tmp/herein-publishing-history-ui.log`。

发布服务 39/39 通过，design:check、design:build、应用构建、源码 ESLint、Prettier、差异检查通过。Impeccable 检测没有发现。renderer 类型检查和完整 tsc -b 仍有仓库既有诊断，完整共 79 项，修改组件无诊断。日常 release `54cc3dc3-abcd-4d2e-a066-68466a04beeb` 已构建，运行验证见本轮任务跟踪。代码尚未提交。
