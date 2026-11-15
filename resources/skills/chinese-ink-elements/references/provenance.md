# 来源与适用边界

## 本包经验来源

本技能整理自“纸上山河”九景代码绘画的连续迭代：线描试作 → 墨块与干湿笔触 → 山体结构和古塔承接修订 → 六种不同题材扩展。

用户反馈形成的主要判断：线条轮廓不足以表现期望的墨风；山体需要山面与皴染；古塔需要薄檐与连续塔身；青灰、灰绿和淡赭更适合暖牛皮纸；系列作品需要构图区别。

后续用户明确放宽设色：基础定调由笔墨、留白、结构和层次承担，颜色按物体与场景自由发挥。青灰、灰绿和淡赭仅保留为早期九景的复现色板，不再作为通用主题色限制。新增历史题材元素目录用于候选规划，不代表已绘制全部资源。

`scripts/generate-studies.mjs` 由本项目原创九景生成器改编，保留已确认的形体与笔触方法，并增加可迁移输出目录、题材选择、种子偏移和覆盖保护。`assets/approved-collection.png` 是当前九景的风格预览。它们是可运行样本，不代表所有新题材都能通过参数自动生成。

包内继承的项目代码许可见 [LICENSE](../LICENSE)。本包没有复制下列外部项目的实现、GLSL、滤镜代码或 SVG 路径。

## 外部方法参考

### 23ag1/ink-wash-painting-skill

- [仓库](https://github.com/23ag1/ink-wash-painting-skill)
- [绘画方法入口](https://raw.githubusercontent.com/23ag1/ink-wash-painting-skill/main/SKILL.md)
- [构图](https://raw.githubusercontent.com/23ag1/ink-wash-painting-skill/main/references/composition.md)
- [材料与墨度](https://raw.githubusercontent.com/23ag1/ink-wash-painting-skill/main/references/materials.md)
- [笔触](https://raw.githubusercontent.com/23ag1/ink-wash-painting-skill/main/references/brush.md)
- [题材研究](https://raw.githubusercontent.com/23ag1/ink-wash-painting-skill/main/references/motif-studies.md)

采用结构先于纹理、远近墨度、干湿边缘区别和古建承接等绘画思路。2026-10-26 核对时未找到可确认的许可证文件，因此没有把其 kit、GLSL 或示例代码带入本包。重新引用源码时需重新确认当前许可证，不能把本包的原创实现视为它的授权。

### JimLiu/baoyu-skills

- [ink-brush 风格参考](https://github.com/JimLiu/baoyu-skills/blob/main/skills/baoyu-comic/references/art-styles/ink-brush.md)
- [mono-ink 色板参考](https://github.com/JimLiu/baoyu-skills/blob/main/skills/baoyu-article-illustrator/references/palettes/mono-ink.md)

参考有限设色、留白与墨色层次的表达方向；它们是风格/提示词材料，不是本包 SVG 渲染引擎。

### 其他相关方法

- [LingDong-/shan-shui-inf](https://github.com/LingDong-/shan-shui-inf)：程序化山水、层次与皴纹的思路；当前实现没有直接复制其路径和代码。
- [rough-stuff/rough](https://github.com/rough-stuff/rough)：手绘路径变化的思路；当前生成器不依赖 Rough.js。

## 不由此保证的能力

这是写意水墨的程序化近似，不是宣纸物理仿真、历史建筑测绘、植物图鉴或文物复原。SVG 滤镜在不同引擎中可能不同，透明 PNG 应使用实际目标渲染器检查。

外部链接只作方法溯源。执行本技能、运行范例和导出素材不需要访问这些网站，也不要求安装其他技能、模型或付费服务。
