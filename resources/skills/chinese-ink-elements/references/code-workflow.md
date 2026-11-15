# 代码、渲染与交付

## 目录

- 运行九景范例
- 编写新作品
- SVG 结构与透明性
- 导出 PNG
- 交付清单与宿主集成

## 运行九景范例

需要 Node.js 18 或更新版本。SVG 生成器只使用 Node 内置模块，不访问网络、不调用模型、不依赖原项目路径。

```bash
node "<技能目录>/scripts/generate-studies.mjs" --list
node "<技能目录>/scripts/generate-studies.mjs" --out "<输出目录>"
node "<技能目录>/scripts/generate-studies.mjs" --out "<输出目录>" --scenes misty-mountains,pagoda-pines
```

默认只选中的作品会出现在 `catalog.json` 与预览页。每次使用独立输出目录最容易保持版本一致；原目录有将被写入的文件时，生成器先报冲突。确认允许替换后传 `--overwrite`，它仅覆盖本次生成器的目标文件，不清空目录；选中作品的旧 PNG、旧校验报告和旧联系图会移除，避免旧预览冒充新稿，需重新渲染。旧目录里的其他作品文件不会自动删除，浏览以本次 catalog 为准。

`--seed-offset 10` 为每个样本的固定种子增加同一个整数偏移，只改变墨粒与笔压等局部变化。它不能替代重新构图；保留种子即可复现同一版本。

生成结果：

```text
<输出目录>/
  ink-wash/
    catalog.json
    <scene-id>.svg
  demo/
    ink-study.html
```

九个 ID：`misty-mountains`、`pagoda-pines`、`temple-in-mist`、`bridge-returning-boat`、`bamboo-moon-gate`、`lotus-pond`、`plum-blossom`、`palace-courtyard`、`gorge-sails`。catalog 同时保留预期 PNG 文件名；PNG 需渲染后才存在，预览页会注明未导出时下载不可用。

## 编写新作品

可以复制生成器到当前输出工作区改编，或从其中提取所需函数。安装目录中的脚本是范例，不要为一次用户绘画覆盖它。

| 函数/区域                   | 作用                               | 改编时注意                                       |
| --------------------------- | ---------------------------------- | ------------------------------------------------ |
| `randomSource`              | 固定种子随机数                     | 记录种子；固定调用顺序才能复现细节               |
| `brush`                     | 变压宽笔、多点插值、边缘与干笔处理 | 控制点先决定笔势，宽度表达压力；不是线宽抖动装饰 |
| `definitions`               | 色板、渐变、颗粒和干湿滤镜         | 当前按 1600×1000 调整，改尺寸后复查              |
| `mountain`                  | 主体山形、局部坡面暗带、短皴与苔点 | 新山要改轮廓与坡面 marks，不能只增加纹理数量     |
| `inkRoof`                   | 屋面形体、檐口、轻瓦纹             | 调整宽高要同时核对墙体和上下檐承接               |
| `tower` / `hall`            | 古塔与厅殿骨架                     | 当前坐标属于样本；新布局要重算连接关系           |
| `pine` / `bamboo`           | 松树和竹的组合笔形                 | 改枝势和叶簇关系，减少机械复制                   |
| `lotusLeaf` / `lotusFlower` | 叶面湿染和花瓣组织                 | 透明度、遮挡与材料色分开考虑                     |
| `boat` / `ripples`          | 江舟、帆与水纹                     | 随空间尺度调整，而非统一大小                     |
| `scenes`                    | 九景构图、说明与种子               | 新画替换或新增自己的 draw 函数与唯一 ID          |

手写新 SVG 时，可参考以下骨架。路径内容由实际题材设计，不需要照搬示例坐标。

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     width="1600" height="1000" viewBox="0 0 1600 1000"
     role="img" aria-labelledby="work-title work-desc">
  <title id="work-title">作品名</title>
  <desc id="work-desc">原创水墨意象，透明背景。</desc>
  <defs>绘画所需的局部滤镜、渐变与遮罩</defs>
  <g id="work-far-range">远景</g>
  <g id="work-subject">主体结构及材料色</g>
  <g id="work-foreground">近景、细节与点景</g>
</svg>
```

## SVG 结构与透明性

### 扩展类型的独立样本

`scripts/generate-expanded-studies.mjs` 提供十二款器物、百工、田园与花鸟样本，`--list` 返回实际 ID，`--scenes` 选择子集，`--out` 指定工作目录。它导出 `ink-wash/catalog.json` 与 SVG，可直接交给同包渲染器；选择覆盖前会检查输出文件。新题材在输出工作区改编，保留安装目录的样本。

该脚本不依赖第三方包，SVG 引用按作品加前缀，保持透明孔洞与实体材料面的区别。透明导出、材质放大图和实际尺寸都要复核；装饰器具不代表已验证技术机制。

### 坐标与命名

- 根节点有明确 `width`、`height` 和 `viewBox`，坐标系与导出尺寸一致。
- 有语义的形体用 `<g id="作品前缀-部件名">` 包裹。需要动效时再按具体动作细分，静态插画不必把每一个墨点拆成组。
- `id`、`url(#...)`、ARIA 引用一起加前缀。重复内联同一作品时再加实例前缀；已有作品前缀只能解决不同作品之间的冲突。
- 固定噪声种子，避免运行时随机动画。渐变、滤镜和遮罩的引用必须存在且唯一。

### 墨色与 alpha

- 透明素材根部不放全幅纸色或纸纹。背景纸纹由预览页叠加，导出的 PNG 保留 alpha。
- 镂空用闭合负形、`fill-rule="evenodd"`、clip 或 mask；实体墙面用材料色遮住后景。两者不要混淆。
- 多个半透明层叠加会变深；修改局部颜色后检查实际合成结果。
- 避免大滤镜区域乘以大量极细路径。需要低开销播放或稳定视觉时预渲染 PNG，保留 SVG 作源。

### 自包含资源

默认输出不含脚本、事件处理、外部图片、外部 CSS、远程字体或 `foreignObject`。路径与滤镜自己携带。用户有明确混合媒体需求时可另做输出，但应说明依赖，不能继续声称纯自包含矢量。

## 导出 PNG

### 已有 Electron 的环境

本包的 `render-assets.cjs` 由 Electron 主进程执行，不是普通 Node 脚本。使用环境里已有的 Electron 可执行文件，例如在已装 Electron 的项目目录：

```bash
pnpm exec electron "<技能目录>/scripts/render-assets.cjs" --input "<SVG输出目录>"
```

脚本读取 `ink-wash/catalog.json`，在本地沙箱窗口中解析 SVG、检查引用、绘到透明 Canvas，生成同名 PNG、`verification.json` 和带纸底的 `contact-sheet.png` 预览。联系图有底色，各作品 PNG 保持透明。它使用独立临时 userData，不连接原项目数据。已有导出时默认拒绝覆盖；确认要更新同版 PNG 后：

```bash
pnpm exec electron "<技能目录>/scripts/render-assets.cjs" --input "<SVG输出目录>" --overwrite
```

导出尺寸由 catalog 读取。SVG 中存在外部资源、无效 XML、重复 ID、缺失引用、非有限坐标或完全无墨迹时失败。技术检查不是审美评估：仍需看实际 PNG，检查透明洞口、边缘和布局。

### 没有 Electron 的环境

使用当前可用的 Chromium 浏览器或既有渲染服务，把 SVG 载入透明 Canvas 后以 PNG 输出。无需为了本技能自动安装 Electron；必要时先交付 SVG，说明 PNG 的限制。部分 SVG 转换器对 `feTurbulence`、位移和合成支持不一致，未经对照不要用其输出替代已确认风格。

浏览器截图通常会烘焙页面背景。只有确认导出设置保留 alpha，或者从透明 Canvas 得到像素，才能标作透明 PNG。

## 交付清单与宿主集成

通常交付 SVG、透明 PNG、轻量预览、作品清单和生成脚本；用户只需单图时可收敛。清单记录 ID、标题、尺寸、文件名、种子和必要说明，避免源文件与预览版本混用。

在 200–500px 的实际页面尺寸检查可读性，原尺寸看结构与破边。用于投影片或视频时按目标画幅再排版，不把 1600×1000 当成平台封面比例。

需要内联修改时选语义分组；作为 `<img>` 使用时只能整体变换。需要真正动效时使用宿主已有的动画与渲染流程，本技能提供可拆组画面，不定义时间轴运行时。

项目若有 UI 设计规范，绘画素材与宿主工作台分别遵守各自边界。用户只要求绘画时，不更换现有页面、控件和主题。
