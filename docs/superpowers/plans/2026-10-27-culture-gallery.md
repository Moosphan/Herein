# 传统文化统一画册实现计划

**目标：** 把已生成作品归入同一本地网页，分类切换、弹窗看大图，避免首次加载原始 SVG / PNG。

**结构：** Python 从现有 catalog 与 PNG 生成透明 WebP 缩略图、按需大图和清单。独立 React 19 / HeroUI 3.2.6 页面复用规范 2.0 主题；Vite 输出经典 IIFE 脚本，使网页直接通过 file 协议打开，无 CDN 和服务器依赖。原文件保留下载。

**边界：** 使用当前工作树，不修改生产业务、已有绘画或应用控件；新画册独立于原各辑画册。作品纸底为素材展示背景，控件沿用项目主题。实现和验证在本会话完成，不提交代码。

## 执行任务

- [x] 编写 `scripts/test-culture-gallery.cjs`：检查文件协议打开、分类按需图片请求、原图延迟加载、弹窗关闭与焦点、明暗主题及窗口布局；先运行确认缺少画册时失败。
- [x] 编写 `scripts/prepare-culture-gallery.py`：收录当前 16 幅、24 款线描、4 个排版样例、6 幅旧人物稿和预览图；生成 640px WebP 列表图与最大 1600px 大图，按源内容摘要命名并输出尺寸、体积和来源信息。
- [x] 新建 `docs/design-system/v2/culture-gallery/` 页面及 `vite.culture-gallery.config.ts`：使用 HeroUI Tabs / Modal / Button / Card，未选分类不挂载图片，大图仅打开弹窗加载；布局预留图幅，错误提供原图链接；主题跟随系统并支持切换。
- [x] 增加 `scripts/build-culture-gallery.mjs` 与构建命令：准备图片后构建经典脚本和本地 CSS，并生成 `resources/visuals/traditional-culture/gallery/index.html`。
- [x] 运行浏览器与 Electron 检查、实际看截图、比较图片体积；运行设计检查、设计构建、格式检查，记录结果和使用入口。

## 验证命令

`pnpm design:culture:gallery` 生成画册；`node scripts/test-culture-gallery.cjs` 验证交互与加载；`pnpm design:check`、`pnpm design:build` 验证现有设计合同。截图和加载统计放 `.scratch/culture-gallery/`，交付当前画册链接和已测得的压缩结果。
