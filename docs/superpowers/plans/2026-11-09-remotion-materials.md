# Remotion 独立素材接入实施计划（#12）

**Goal:** 用户导入本地图片、MP4、字体并说明用途后，原生画面按独立资源编排，粗剪/正片/导出冻结相同文件。

**Architecture:** 受管文件保存原始字节，素材清单包含原文件名、用途、可选分镜与主进程核实的媒体规格；粗剪请求冻结清单，修订 payload 和 composition.json 保存来源。当前项目素材草稿在现有本地草稿机制中保留，历史修订不受草稿修改影响。修改计划沿用来源粗剪素材；换素材走整片新合成。字体由可信入口加载，旧入口继续可渲染。

**Tech Stack:** Electron / TypeScript / React 18 的 VIDEO-WORKFLOW-001 既有控件 / Remotion 4.0.541。

## 边界

- 当前隔离工作树内执行，保留其他脏改动；不自动提交/推送。
- 不下载、付费生成、安装依赖或以示意素材替代缺失真实素材。
- 图片 PNG/JPEG/WebP（32 MiB），视频 MP4（1 GiB，含无音轨视频），字体 WOFF/WOFF2/TTF/OTF（64 MiB，容纳完整中文字体）；复用受管文件指纹校验。
- 字体使用主进程分配的 family，原生视频素材默认静音，配音/字幕仍由宿主控制。
- 素材草稿不使已有审核或配音失效；点原合成按钮创建待审核粗剪；缺失文件在启动前阻止并就近显示。
- 用户已确认入口放在“分镜 → 创作设置”，不放粗剪。素材为按项目自动保存的独立本机草稿，关闭设置仍保留；只有合成原生粗剪时应用。保留两栏、动作顺序、密度与审核位置，不启动 HeroUI 依赖迁移。

## 实施与验证

- [x] 先写失败测试：本地类型/真实内容验证、用途与分镜校验、跨项目和被修改文件拒绝、无音轨视频可导入、字体元数据与冻结清单。
- [x] 新增 shared/video-materials.ts 的 NativeMaterial/校验；main 的 native-materials.ts 负责实际导入与规格核实，IPC 使用系统选择器；扩展受管字体格式。
- [x] render payload 增加可选 nativeMaterials，service 在原生整片合成时冻结请求清单，修改计划沿用旧版素材；authoring 将独立资源和登记来源放入 settings/assets。
- [x] 可信入口等待字体加载、旧原生入口可继续渲染；正式成片与导出复用冻结文件。
- [x] 在分镜创作设置中加入默认折叠的画面素材区，按项目自动保存草稿，关闭保留；错误就近显示，运行锁定，删除仅移除草稿引用。
- [x] 专项与工作流测试、真实横竖版图片/视频/字体渲染和导出、Electron 键盘/主题/视口/200% 回归、design:check/build、类型/构建/格式验证，回填 #12。

## 文件责任

- `src/shared/video-materials.ts`：素材类型、用途/范围/数量/文件类型校验。
- `src/main/services/video-workflow/native-materials.ts`：导入内容验证、尺寸/时长、字体 family、文件来源。
- `src/main/services/video-workflow/{files,remotion-native,remotion-authoring,remotion,render,service}.ts`：受管资源、可信入口、清单传递和工程冻结。
- `src/main/ipc/video-workflow.ts`：系统文件选择与校验 IPC。
- `src/renderer/modules/video/workflow/NativeMaterialPanel.tsx`：确认后的弹窗与草稿；`StageWorkspace.tsx` 传递清单。
- `scripts/test-native-materials.ts`、原生真实渲染脚本与 Electron 回归：入口到冻结导出证据。
