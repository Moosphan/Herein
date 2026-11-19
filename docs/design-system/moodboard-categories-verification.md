# Moodboards 自定义类别验证

2026-11-16，关联任务 #21。用户确认新增类别和图标选择，以及 MOODBOARD-CATEGORIES-001 局部组件兼容例外。

## 交付行为

新增或编辑资源的 Category 区提供“新增类别”，内联输入名称并选择 20 款 Heroicons 2.2.0 outline 图标。保存成功后收起并自动选中类别。类别选项、筛选和资源卡片采用同一份定义，独立保存的类别在尚无资源时也能恢复。

类别由 SQLite migration 41 创建独立表，包含稳定 ID、名称、标准化名称与图标。创建类别在事务内核验重复，并使用唯一约束保存。重复匹配包含内置名称与标识、自定义类别以及历史自由文本类别，比较使用 trim、NFKC 和小写转换。已有资源 category 字段与旧 getCategories IPC 签名继续支持，历史自由文本类别显示原名称和默认书签图标。

空名称、重复名称、非法图标与保存失败保留输入并提示。更改名称清除旧错误。保存期间锁定重复提交，取消和 Escape 保留资源表单草稿。成功与取消收起后，焦点在控件重新启用并完成 DOM 更新后返回新增入口。组件卸载后忽略迟到的界面回调。

## 自动化与实图

- `pnpm test:moodboard` 六项通过，包括内置定义、无资源类别重开数据库、创建/编辑/筛选、Unicode 重复、非法输入和历史自由文本。
- `pnpm test:backup` 两项通过，备份往返与哈希损坏检测成功。
- `pnpm test:moodboard:ui` 所使用的完整构建及 Electron 脚本通过。测试实际 IPC、选择游戏图标、保存后自动选中、资源保存及卡片图标、筛选、编辑回显、重开及 renderer 重载。
- Electron 验证名称为空、重复失败及输入保留，修改名称清除旧错误，Tab / Shift+Tab、Space、Escape、成功与取消焦点返回，明暗 1440 / 1024 和 200% 缩放，额外核实 200% 下类别保存按钮可以滚动到固定标题与底栏之间。
- 初始六项数据测试与新入口界面测试均先失败。后续错误清除和保存成功焦点回归分别先重现失败，再通过。审查发现的保存后焦点丢失已按 DOM 提交顺序修正。
- 主代理已检查明暗截图及 200% 布局。最终截图目录 `/var/folders/tp/lp03pbbn6wb275zsvn3lfrq00000gn/T/herein-moodboard-ui-21br8k`。

数据日志 `/tmp/herein-moodboard-data-final.log`，界面日志 `/tmp/herein-moodboard-ui-final.log`，焦点回归失败日志 `/tmp/herein-moodboard-save-focus-red.log`，错误清除失败日志 `/tmp/herein-moodboard-error-red.log`。

`pnpm design:check`、`pnpm design:build`、应用构建及差异检查通过。变更源码 ESLint 零错误，MoodboardModal 的既有 effect 依赖警告仍在。新增文件及改动后的后端文件格式检查通过，旧 MoodboardModal 采用局部修改以控制格式改动范围。Impeccable 检测无发现。

完整 TypeScript 检查仍有 79 项既有诊断，包含旧 MoodboardItemRow 与 BaseRepository 的索引签名问题。新增共享定义和类别编辑组件没有类型诊断，renderer 检查中的其他既有问题另见 `/tmp/herein-moodboard-web-types.log`。

## 运行版本

用户确认现在重启后，日常构建 `03487e3f-e032-4b61-ac18-93ec7a50068b` 已重启并聚焦，运行控制接口成功，源码指纹匹配。实际用户数据库只读核查确认 migration 41 已应用，类别表与四个字段就绪。重启记录 `/tmp/herein-moodboard-restart.log`。代码尚未提交。
