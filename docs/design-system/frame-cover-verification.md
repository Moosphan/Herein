# 发布选帧封面 · #15

2026-11-09 用户确认两平台“从视频选帧”弹窗、B 站双比例居中裁切、抖音原画幅、取消保留及保存/重新审核流程。GitHub: https://github.com/Moosphan/MyDashboard/issues/15 。独立关联 #14，不修改父任务 #10。

## 行为

- 只从当前已审核正式成片抽取，校验项目版本、成片版本、受管源文件归属和 SHA-256；异步完成前复验，过期结果拒绝应用。
- 浏览器只负责滑条逐帧定位预览；确认时 FFmpeg 输出高清 PNG，冻结实际视频指纹、时间、帧号及帧率。不调用创作 Agent，不改变视频、配音或字幕。
- B 站同一帧居中裁切为 1600×900 与 1600×1200；抖音保留显示方向和原画幅。每张 PNG 不超过 4 MiB，超过时明确失败并保留旧封面。
- 确认只更新当前平台草稿；原保存动作创建待审核版本，人工审核后投稿/导出读取该平台封面。封面历史按平台查询，旧版保留；源成片变化后不允许复用旧来源。
- 关闭/Escape/取消同步废弃迟到响应并终止未完成提取。单请求 60 秒、最多 4 个并发，退出服务终止活动抽帧。读取元数据有 20 秒时限。

## 验证记录

- 共享校验测试验证来源坐标、指纹、尺寸、错误平台及旧 AI 封面兼容；真实服务测试使用红/蓝视频检查所选实际像素、双比例和抖音画幅、取消、源损坏、过期版本、旋转信息。
- `pnpm test:video-workflow` 最终 96/96，日志 `/tmp/frame-cover-workflow-final.log`；追加旋转/竞态检查已纳入，单独日志 `/tmp/frame-cover-service.log`。
- Electron 两平台闭环通过，日志 `/tmp/frame-cover-ui.log`；真实滑条方向键、Home/End 首尾、取消不保存、焦点返回、确认草稿、保存待审、审核后导出字节、平台历史及篡改拒绝均检查。隔离测试的审核由脚本执行，不代表人工确认生产视频。
- 原 B 站 AI 封面生成、Image2 下载恢复、历史切换、导出及模拟投稿回归通过，日志 `/tmp/frame-cover-regression-ui.log`。
- UI 最终通过日志 `/tmp/frame-cover-ui-verified.log`，截图 `/var/folders/tp/lp03pbbn6wb275zsvn3lfrq00000gn/T/frame-cover-ui-rNutMF/`：浅深色 1440/1024、200%、高对比/reduced-motion、抖音封面。实际查看浅色弹窗与深色/200% 截图确认预览、时间、滑条与动作可见，视频损坏错误保留弹窗和旧封面。
- 两平台投稿快照回归 30/30，通过隔离定时任务验证所选帧、所属平台和时间被冻结，后续编辑不覆盖已排定快照；日志 `/tmp/frame-cover-publishing-final.log`。测试不真实上传。
- `pnpm build`、`pnpm design:check`、`pnpm design:build` 已通过。全量 web 类型检查存在 MainLayout、AI Lab 等既有错误；node 检查存在 electron-vite 的 `@swc/core` 缺失。本次文件没有新增类型诊断，不能宣称全仓类型通过。
- 最终 `tsc -b` / main / web 诊断已检查：本次文件没有新增错误，全仓仍有其他模块既有错误。Prettier 及 `git diff --check` 通过。
- 只读代码审查发现一个 P2：非方形像素视频直接设置方形像素会拉伸。已贯通 FFprobe 显示尺寸、旋转、抽帧缩放及保存校验修复。服务测试实际验证 SAR 2 的红绿画面；Electron 使用编码尺寸 360×640、SAR 2 的导入视频，验证显示/封面为 720×640，完成保存、审核及导出。追加审查没有形成有效结果，不计为额外审查通过。
- SAR 修复后最终验证：工作流 96/96（`/tmp/frame-cover-workflow-sar.log`）、投稿 30/30（`/tmp/frame-cover-publishing-sar.log`）、真实 Electron 双平台闭环（`/tmp/frame-cover-ui-sar.log`）均通过。最新截图目录 `/var/folders/tp/lp03pbbn6wb275zsvn3lfrq00000gn/T/frame-cover-ui-Saue0t`；实际查看最新浅色 1440 弹窗，滑条、比例切换、时间及确认/取消均可见。
- 最新 `pnpm build`、`pnpm design:check`、`pnpm design:build`、相关文件 Prettier 和 `git diff --check` 通过。日志分别为 `/tmp/frame-cover-build-sar.log`、`/tmp/frame-cover-design-check-final.log`、`/tmp/frame-cover-design-build-final.log`、`/tmp/frame-cover-format-final.log`。
- `pnpm daily:build` 和 `pnpm daily:restart` 通过，重启前只读检查生产运行视频任务为 0。最新日常 release `319f317d-51f1-43db-bc8e-0454088006e4`，控制接口响应 true、运行源码指纹与当前源码一致。本轮代码未提交/推送。

## 限制

目前可靠帧号定位支持固定帧率 0–120fps。可变帧率明确说明无法可靠选帧；不伪造帧号。超大细节帧可能超过原有 PNG 4 MiB 限制，用户需选择其他画面。B 站裁切可能截去边缘主体，必须检查两种比例；抖音平台后续展示裁切由平台决定。测试不向真实账号投稿。
