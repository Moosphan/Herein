# 纸上山河 · 中国传统文化绘画资源（Demo）

## 统一分类画册

当前精选累计 190 幅，含其他分类及预览共 327 项。“本次新作”展示汉家群像五人像，共 5 幅。

打开 [作品画册](gallery/index.html)，按精选、本次新作、山水与古建、彩墨与器物、人物与生灵、线描、排版、历史稿和细节预览浏览。页面使用本地打包的 HeroUI 3.2.6，支持明暗主题、键盘分类切换和弹窗预览，不依赖 CDN 或本地服务器。

列表使用最大 640px 的透明 WebP，弹窗才加载最大 1600px 的 WebP；SVG 和原始 PNG 仅在查看或下载时读取。原始画作与透明性不变，WebP 作为预览副本；纸底只在展示层，已有含纸底的拼图除外。未选分类不挂载图片，列表图片延迟加载并预留尺寸，避免整页先加载所有作品或反复渲染复杂 SVG。

更新画作并导出 PNG 后运行 `pnpm design:culture:gallery`。命令读取既有清单和预览图、按内容摘要复用压缩缓存，再构建 `gallery/index.html`；不自动重画。页面源码为 `docs/design-system/v2/culture-gallery/`，构建命令复用独立设计工作台依赖，验证入口为 `node scripts/test-culture-gallery.cjs` 和 `pnpm exec electron scripts/verify-culture-gallery-electron.cjs`。图片体积统计见 `gallery/image-report.json`。

供「史笺」牛皮纸分镜试用的原创插画小集。当前是资源与排版展示稿，尚未增加应用内素材选择入口，也不会修改已有项目。

## 汉家群像 · 文武与著史

本辑五人已按跨批次相似反馈全员重画：萧何侧坐掌籍、陈平长身敛袖、周勃厚颈素服扶剑、卫青戴胄转身、司马迁侧脸伏案。分别起稿骨相、体态、冠发、衣物剪裁和完整配色，不套用韩信、李广等旧作的脸、甲衣或披风。共同汉代形制以既有史料约束；具体面貌、体征、发式和服色明确为艺术推演。

五组 1600×1000 透明 SVG/PNG 在 `han-statesmen/ink-wash/`，总览 `han-statesmen/han-statesmen-preview.jpg`；另有五官并排、手与工具局部和三底色预览。[创作说明](han-statesmen/painting-brief.md) 包含重建命令，[史料核查](han-statesmen/historical-references.md) 记录原文和形制边界。“本次新作”切至本辑，包含前辑五人重绘在内的旧作全部保留；Skill 已补充跨批次造型表、独立起稿与新旧人物并排检查的方法。

## 楚汉风骨 · 秦末与西汉五人像

新增项羽、刘邦、张良、李广、韩信五幅代码彩墨人物：分别以沉雄札甲与身侧骏马、隆准美髯与长冠、清秀持简、长臂持弓、青灰甲衣与筹策区分。依据《史记》形貌记述和徐州博物馆西汉陶俑等形制资料，保留史料与艺术推演的区别；不宣称真实肖像或精确服制复原。

五组 1600×1000 透明 SVG/PNG 位于 `han-figures/ink-wash/`；总览 `han-figures/han-figures-preview.jpg`，另有五官并排、器物局部与三底色预览。见 [创作说明](han-figures/painting-brief.md) 和 [史料核查](han-figures/historical-references.md)。画册“本次新作”切至本辑，前辑全部保留；Skill 同步历史人物的证据分层、右衽叠压与装备接触检查。

五人已按反馈全部重绘：分别重建方阔、成熟长面、清秀椭圆、风霜长颧和转向青年脸型，采用连续不透明脸缘；外衣/披风与内袍/甲衣重新分色，收窄肩腰与横向袖量。当前生成器为 `scripts/generate-han-figure-redraw.mjs`，原稿备份在 `.scratch/han-figures-before-redraw/`，其他画作保留。

## 春汀与清赏 · 十二景

新增鸢尾临水、绣球映石、葫芦垂藤、乌桕秋汀、戴胜寻春、鸬鹚听水、漆盘荐果、建盏茶沫、铜锁守匣、团扇扑香、石碾晒场、板桥溪声。按花色、秋叶、羽毛、漆釉、绢木与溪石分别设色；前辑全部保留，包括已修订木鱼。

十二组 1600×1000 透明 SVG/PNG 位于 `spring-studies/ink-wash/`，总览 `spring-studies/spring-studies-preview.jpg`，另有六处局部与三底色对照。创作边界与重建命令见 [本辑说明](spring-studies/painting-brief.md)。项目、安装副本 Skill 和分发 ZIP 同步新增题材画法。

## 溪园与百工 · 十二景

新增菖蒲清溪、鸡冠映秋、紫薇绯云、斑鸠榆影、刺猬寻栗、芦汀鸿雁、铜熨展帛、木鱼静声、铜锣悬响、辘轳井畔、草仓藏粟、苍瓦照壁。按花木、羽刺、铜木与庭院分别设色，继续透明交付、暖纸展示；前辑画作全部保留。

十二组 1600×1000 SVG/PNG 位于 `creek-studies/ink-wash/`，总览为 `creek-studies/creek-studies-preview.jpg`，另有六处局部和三底色对照。构图、边界和重建命令见 `creek-studies/painting-brief.md`。Skill 项目、安装副本与分发 ZIP 同步新题材结构经验。

木鱼根据常州天宁寺实物重画圆钝梨形腹、侧面斜向长音口与前缘浅雕，取消独立大鱼脸；`creek-studies/wooden-fish-refined-preview.jpg` 为当前单幅预览，其余十一幅及前辑作品保留。

## 清庭与行藏 · 十二景

新增金橘满枝、木瓜垂香、金丝照石、荷包垂露、梧叶鸣蝉、石竹双蝶、笔筒清供、刀尺裁锦、纸伞听雨、蓑笠江行、书函芸香、石狮守庭。荷包牡丹已重画花瓣与复叶，门前抱鼓石已替换为石狮；前辑墨猫改为褐灰短毛的中华田园狸花猫。按花果、昆虫、竹木、青铁、靛锦和门庭设色；沿用透明交付与暖纸展示，其他画作及木屐修订保留。

十二组 1600×1000 SVG/PNG 位于 `travel-studies/ink-wash/`，总览为 `travel-studies/travel-studies-preview.jpg`，另有六处局部与三底色对照；构图和生成命令见 `travel-studies/painting-brief.md`。项目、安装版 Skill 与分发 ZIP 同步昆虫停栖、裁剪工具、纸伞及蓑笠的结构经验。

## 花木与雅器 · 十二景

新增杜鹃照石、芙蓉秋色、枣枝垂赭、荔实垂丹、双鹑秋野、芦洲秋蟹、阮音含翠、紫砂陈韵、香篆静室、木屐苔阶、竹篓渔闲、井台汲古。花木分别以胭脂、粉黛、赤赭与丹红设色，秋野动物、木陶竹铜和井台各保留材料色与承接。旧稿不重画。

十二组 1600×1000 透明 SVG/PNG 位于 `autumn-studies/ink-wash/`；总览为 `autumn-studies/autumn-studies-preview.jpg`，另有六处局部及三底色检查图。生成及导出命令见 `autumn-studies/painting-brief.md`。项目、安装版 Skill 与分发 ZIP 同步蟹足、鹌鹑、阮琴弦路、编竹与井台结构经验。

## 桑野与物华 · 十二景

新增桑葚春蚕、栀子凝香、凌霄映夏、白头秋枝、荷钱听蛙、灵龟探石、铜觚清影、陶甑炊烟、竹箫流韵、屏上远岫、谷斗丰登、茅舍柴扉。按桑果、白花、橙花、动物、铜陶竹木与乡居分别设色，保留透明交付与暖纸展示；前辑包括草穗修订全部保留。

十二组 1600×1000 SVG/PNG 在 `pastoral-studies/ink-wash/`，总览为 `pastoral-studies/pastoral-studies-preview.jpg`，另有六处局部与三底色对照。生成：`node scripts/generate-pastoral-ink-studies.mjs`；导出：`pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/pastoral-studies --overwrite`；预览：`python3 scripts/preview-pastoral-ink-studies.py`。构图与边界见 `pastoral-studies/painting-brief.md`。

Skill 的项目副本、安装版与 ZIP 同步补充蛙龟与蚕、桑叶与管状花、折屏投影及炊器叠置的绘画经验。

## 烟溪与雅物 · 十二景

新增海棠春雀、佛手清供、灵芝寿石、蟋蟀秋草、萱草蜻蜓、秋浦翠鸟、朱漆提盒、绣囊丝结、青瓷注碗、折扇清风、乌篷桥影、竹筏青溪。分别按花鸟、果石、丝漆、青釉与水乡选色，沿用透明素材和暖纸展示。前辑包括已确认柳树与亭子的源图全部保留。

源图位于 `literati-studies/ink-wash/`，十二组 1600×1000 SVG/PNG；总览为 `literati-studies/literati-studies-preview.jpg`，另有六处细节和三底色对照。生成：`node scripts/generate-literati-ink-studies.mjs`；导出：`pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/literati-studies --overwrite`；预览：`python3 scripts/preview-literati-ink-studies.py`。构图与边界见 `literati-studies/painting-brief.md`。

Skill 的项目副本、安装版和分发 ZIP 同步补充垂柳风势、刚性建筑统一投影、玉器实体孔壁，以及本轮小鸟草虫、折扇、绣囊和竹筏的结构经验。

## 花庭与清供 · 十二景

新增藤萝垂紫、柿染秋枝、辛夷照春、双鹊报春、雄鸡司晨、双鹅清波、玉意流云、簪梳凝香、瓷枕清梦、茶篓春采、陶灯书影、柳岸水榭。按紫花、秋果、白羽、青玉、金花、青釉和竹木分别设色，继续使用暖纸展示与透明素材交付。前辑作品全部保留。

源图位于 `garden-studies/ink-wash/`，十二组 1600×1000 SVG/PNG；总览为 `garden-studies/garden-studies-preview.jpg`，另有材料细节与三底色对照。生成：`node scripts/generate-garden-ink-studies.mjs`；导出：`pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/garden-studies --overwrite`；预览：`python3 scripts/preview-garden-ink-studies.py`。详细构图与边界见 `garden-studies/painting-brief.md`。

## 第二稿：水墨方向

根据用户对线描风格的反馈，新增 [水墨试作](demo/ink-study.html)：烟岚山水、松风古塔、云山古寺。以浓淡墨块、湿染边缘、枯笔飞白与留白重新绘制；不是给第一稿轮廓添加模糊滤镜。原线描保留供对照。

`ink-wash/` 包含九张 1600×1000 的透明 SVG 和 PNG、独立资源清单。纸纹与题字只在展示页，未烘焙进素材。山体、古塔、寺院、松树等按组组织，可整体使用或继续修改；SVG 使用固定种子的噪声、位移与颗粒滤镜，PNG 是当前 Electron 渲染结果，适合需要稳定外观或低渲染开销的场景。不同 SVG 引擎的滤镜细节可能略有不同。

运行 `pnpm design:culture:ink` 重新生成水墨稿和 PNG，截图与检查结果保存在 `.scratch/traditional-culture/ink-wash-*`，新增六景拼图为 `ink-wash-new-works.png`。这套资源按独立画面创作，尚未将第一稿的全部八类元素转换为水墨风格。

第三稿重点重画山、塔并优化配色：山体采用不规则峰脊、青灰与淡赭分面、短笔皴染与点苔，减轻全幅模糊；古塔改为七层逐级收分、连续墙体、薄屋檐和石台基。参考开源 Skill 的绘画方法，未引入其代码或渲染管线，来源与取舍见 [水墨 Skill 研究](../../../docs/design-system/ink-wash-skill-references.md)。

## 第四辑：沿用墨色，扩为九景

保留已确认的三景，新增六款不同题材。继续使用青灰、灰绿与淡赭；花卉仅少量加入藕粉、米白与淡胭脂。所有素材保持透明背景，可用于点景、章节过渡或配合文字排版。

| 文件名                  | 作品     | 构图与主要分组                               |
| ----------------------- | -------- | -------------------------------------------- |
| `bridge-returning-boat` | 江桥归舟 | 横向石桥、桥下透明留白、归舟、岸松、远山     |
| `bamboo-moon-gate`      | 竹庭月门 | 淡赭墙体、透明月门、门内借景、浓墨修竹与湖石 |
| `lotus-pond`            | 荷塘清趣 | 大块荷叶、藕粉花瓣、莲蓬、蜻蜓与疏水纹       |
| `plum-blossom`          | 梅影疏香 | 偏右老干、横斜枝条、米白与淡胭脂花簇、根石   |
| `palace-courtyard`      | 云阙重檐 | 重檐主体、赭红柱列、配殿、三层台基与中阶     |
| `gorge-sails`           | 峡江帆影 | 两岸峭壁、中间留江、近远帆船与崖松           |

原有三景文件名保持不变：`misty-mountains`、`pagoda-pines`、`temple-in-mist`。当前水墨素材采用生成器中的固定色板，不使用下文第一稿线描素材的 CSS 色彩变量。

## 第五辑：按物赋彩 · 四景试绘

依据 `chinese-ink-elements` 的笔墨、结构与透明导出规则，新画四款独立构图：[彩墨四景展示页](colored-studies/index.html)。

| 作品     | 配色与主体                             |
| -------- | -------------------------------------- |
| 丹枫听瀑 | 赭石山骨、胭脂秋林、青灰飞瀑与山亭     |
| 朱门金阙 | 朱红墙身、金黄重檐、石青彩梁与庭树     |
| 青花案雅 | 钴蓝花纹、瓷白瓶身、藕紫花卉与书卷笔砚 |
| 沙海行旅 | 沙金大漠、驼棕商队、石蓝远山与落日     |

`colored-studies/ink-wash/` 包含四张 1600×1000 透明 SVG 与 PNG；`four-studies-preview.jpg` 为二乘二暖纸展示，`background-proof.jpg` 为暖纸、白底、深底边缘检查。作品为原创古风意象，不对应真实宫门、传世器物或特定历史商队。

重新生成 SVG/展示页：`node scripts/generate-colored-ink-studies.mjs`。导出与 XML、引用、尺寸、alpha 检查：`pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/colored-studies --overwrite`。生成拼图：`python3 scripts/preview-colored-ink-studies.py`，需 Pillow；中文题字优先使用本机宋体。重新导出后应实际看图检查，技术检查不替代视觉判断。

## 人物与骏马试绘

当前展示 [写意第三稿](figure-studies-v3/index.html)，[第二稿](figure-studies-v2/index.html) 与 [第一稿](figure-studies/index.html) 保留对照。上一辑四款彩墨与本辑三款一起补入 [水墨与彩墨素材总览](demo/ink-study.html)。初版资源首页也增加了两辑入口，原九景与三色线描仍保留。

第三稿按用户明确选择继续代码绘画，独立生成 `han-wudi-command`、`huo-qubing-vanguard`、`red-hare-flight`。汉武帝重画集中视线与压眉、成组须髯和拢袖静势；霍去病重画青年眉眼、束发、闭口线与握剑，减少甲片铺排；赤兔改为斜向腾空的奔姿，调整前腿伸展，鬃尾采用少量长短相间的收锋笔束。新写的贝塞尔笔触通过法线宽度、压力变化、分束与不等长收锋构造，形体不是旧稿换种子；面部关键线不使用位移或全脸模糊。研究见 [写意人物与画马](../../../docs/design-system/xieyi-figure-skill-research.md)。未安装或执行第三方技能代码，未使用生图模型制作第三稿。

第三稿资源位于 `figure-studies-v3/ink-wash/`，各有 1600×1000 透明 SVG 与 PNG。`figure-studies-preview.jpg` 为三作暖纸拼图；`portrait-details.jpg` 放大面部、头发、握剑与马匹结构，`background-proof.jpg` 检查三种底色。霍去病的面部根据后续反馈单独修订：放松眉间、修正近远眼透视、收细鼻口，保留服饰姿态；新增 `huo-qubing-face-study.jpg` 查看青年面貌，汉武帝与赤兔保持原绘画。绘画设定见 [第三稿简报](figure-studies-v3/painting-brief.md)。这仍是代码写意试作，程式化面部与衣甲概括的限制由实图判断，导出检查不代表神韵已获用户认可。

第三稿生成：`node scripts/generate-figure-ink-studies-v3.mjs`；渲染：`pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/figure-studies-v3 --overwrite`；预览：`python3 scripts/preview-figure-ink-studies-v3.py`，需 Pillow。素材总览固定指向第三稿，旧稿生成不会切回历史版本。以下保留第二稿与第一稿记录。

第二稿根据人物绘画 Skill 的研究重做身份、面部、表情、姿势和衣服体积，参考与许可取舍见 [研究记录](../../../docs/design-system/figure-painting-skill-references.md)。汉武帝改为成熟的临朝半身像，使用收拢的袖势与克制凝视；霍去病改为青年统帅按剑站姿，放大脸部，衣甲、披风和手臂按遮挡关系组织；赤兔重新设计头颈、胸腹、远近腿与鬃尾。面部结构不使用随机位移滤镜。人物身份的表达属于艺术设计，不能据此认定真实容貌或汉代服制。

第二稿文件位于 `figure-studies-v2/ink-wash/`：`han-wudi-majesty`、`huo-qubing-resolve`、`red-hare-stride`，各有 1600×1000 透明 SVG 与 PNG。`figure-studies-preview.jpg` 为三作纸底预览，`portrait-details.jpg` 用于检查脸、手、马头与四肢；`background-proof.jpg` 对照暖纸、白底和深底。纸底与题字不写入透明素材。

第二稿生成：`node scripts/generate-figure-ink-studies-v2.mjs`；渲染：`pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/figure-studies-v2 --overwrite`；预览：`python3 scripts/preview-figure-ink-studies-v2.py`。以下为保留的第一稿记录。

| 作品          | 构图与可编辑分组                                     |
| ------------- | ---------------------------------------------------- |
| 汉武帝 · 观远 | 玄衣半身人物、冠与垂带、面部、须髯、衣袍、手与竹简   |
| 霍去病 · 出塞 | 少年骑将、青灰甲胄、朱红披风、长矛、骑姿、马身和缰绳 |
| 赤兔 · 追风   | 赤栗奔马、鬃尾、头颈、马身、远近四肢、蹄与简式笼头   |

三款 SVG 和透明 PNG 位于 `figure-studies/ink-wash/`，尺寸均为 1600×1000；题字、纸底只存在于画册与预览。`figure-studies-preview.jpg` 以局部裁切排版展示三作，`*-paper.jpg` 是全画幅纸底预览，`background-proof.jpg` 用于对照暖纸、白色和深色背景。

这组是历史与文学人物的艺术意象，不宣称真实肖像、汉代冠服或甲胄马具复原；赤兔独立成画，不与两位西汉人物组成同一史实场面。

生成：`node scripts/generate-figure-ink-studies.mjs`。渲染与 SVG 检查：`pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/figure-studies --overwrite`。纸底预览：`python3 scripts/preview-figure-ink-studies.py`，需 Pillow。执行 `node scripts/sync-ink-collections.mjs` 可从已有清单刷新素材总览，不重新绘画或渲染；原两个素材生成器也会同步保留新辑入口。

## 预览与重新生成

直接打开 [资源展示页](demo/index.html)。顶部配色链接可切换整组插画，点击画作查看原始 SVG，四张排版示例可独立打开。

在项目根目录执行 `pnpm design:culture`，重新生成全部 SVG、透明 PNG、四张示例与预览截图。纯 SVG/HTML 生成可单独运行 `node scripts/generate-traditional-culture-assets.mjs`；PNG 和截图使用项目现有 Electron，不调用付费模型。

## 元素与配色

| 文件名      | 元素   | 主要可拆分组                             |
| ----------- | ------ | ---------------------------------------- |
| `pagoda`    | 古塔   | 塔刹、七层塔身、各层檐、铃铎、窗、台基   |
| `temple`    | 寺院   | 主殿、配殿、重檐、柱列、窗格、香炉       |
| `palace`    | 宫阙   | 重檐、斗栱、柱列、门钉、双层台基、栏杆   |
| `mountains` | 山川   | 远山、中山、近山、云带、水纹、日轮、飞鸟 |
| `bridge`    | 石桥   | 拱券、砌石、栏杆、水纹、岸边草木         |
| `moon-gate` | 月洞门 | 圆门、墙身、瓦顶、砖纹、竹叶、铺地       |
| `pine`      | 古松   | 枝干、皴纹、六组针叶、根石               |
| `clouds`    | 祥云   | 三组如意云、日轮、云尾                   |

每个元素有三套配色：`ochre/` 淡赭设色、`ink/` 焦墨线描、`cinnabar/` 朱砂古印，共 **24 个 SVG 和 24 个透明 PNG**。

- SVG：1000×800，固定 `viewBox`，无全幅底色、脚本、远程字体或图片；可任意缩放。
- PNG：1500×1200，透明背景，适用于不支持 SVG 的工具。
- `catalog.json`：资源名称、使用建议、尺寸、色板和 SVG 文件映射。
- `demo/`：展示页及 1920×1080 的卷首、建筑解读、宫阙章节、园林题跋四张静态示例；纸纹只在演示页，不烘焙进元素。
- `.scratch/traditional-culture/`：截图与本轮渲染检查结果，不是资源源文件。

## 使用与修改

作为装饰点景，可直接使用 `<img src=".../ochre/pagoda.svg" alt="">`。建议宽度 200–500px；作为侧边主视觉可放大，正文旁降低透明度，避免细线与文字相叠。没有经过小尺寸图标优化，不建议压缩到 16–32px。

如需改变局部颜色或做 MG 动效，内联 SVG 后操作语义 `<g id="...">`；每个元素的 ID 已包含元素前缀，同一元素在同页重复内联时仍需添加实例前缀。通过 `<img>` 引入时只能整体变换，不能直接选择内部檐线、柱列或山体。

SVG 根节点的 `style` 声明 `--ink`、`--fine`、`--wash`、`--accent`、`--pale`，修改这些颜色即可保持几何一致地换色。样式、生成器和 PNG 应一起重新导出；不要直接修改生成后的单份 PNG。

## 历史题材八景与人物绘画指南

这辑已收入统一分类画册的“人物与生灵”“山水与古建”“彩墨与器物”和精选总览。沿用历史题材目录，本辑包含文士展卷、女乐抚琴、芦汀鹤立、秋原鹿鸣、关山烽燧、柳岸渔舟、青铜鼎影、篱菊映石，分别练习身份动作、动物体积、边防建筑、舟船、礼器与花卉。均为原创代码彩墨意象，1600×1000 透明 SVG/PNG；详见 [创作简报](historical-studies/painting-brief.md)。

生成 SVG：`node scripts/generate-historical-ink-studies.mjs`；透明导出：`pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/historical-studies --overwrite`；纸底拼图、脸手局部与三底色检查：`python3 scripts/preview-historical-ink-studies.py`；最后运行 `pnpm design:culture:gallery` 更新 WebP 画册。本辑不替换已认可的第三稿人物。

Skill 新增 [人物神韵、五官与衣冠](../../skills/chinese-ink-elements/references/figure-painting.md) 和 [动物结构、神态与动势](../../skills/chinese-ink-elements/references/living-animals.md)，覆盖角色差异、头颈与五官、额头淡染、手与工具接触、服饰受力、活体关节和步态。已同步本地安装目录、项目副本与分发 ZIP；人物和动物的质量检查、调用示例也已补齐。

## 百物与生机 · 十二景

这十二幅保留在画册的对应分类和精选总览，题材包括砚台笔卷、玉璧丝绦、编钟、螺钿漆匣、弓矢箭箙、铜钱、茶炉、织机、梯田水车、杏枝双燕、莲下游鲤、月下水亭。[创作简报](expanded-studies/painting-brief.md) 记录材料和类型。

本辑仍为 1600×1000 透明 SVG/PNG，使用代码绘画。`node scripts/generate-expanded-ink-studies.mjs` 生成 SVG，按简报导出 PNG、生成材质细节和三底色预览，再运行 `pnpm design:culture:gallery` 刷新 WebP 画册。

Skill 新增 [器物与材料](../../skills/chinese-ink-elements/references/objects-and-materials.md)、[礼乐、百工与构造](../../skills/chinese-ink-elements/references/craft-and-constructed-scenes.md)，补充春花、燕鲤、真实透孔、器物支承和构件关系；十二款生成器同时收入安装版及 ZIP，支持列举、题材子集和覆盖保护。

## 文脉与秋声 · 十二景

这十二幅保留在对应分类与精选总览：虎符合信、菱镜流光、简牍遗音、晷影知时、本草碾香、印泥封信、琵琶弦语、驼铃行囊、书院廊影、银杏秋石、兰草幽香、旌旗鼓角。按铜、竹、石、木、织物和花木分别设色，沿用牛皮纸上的彩墨定调。铜镜和印信已按反馈重画为更明确的镜面/背纹组合与铜印/印泥/封缄组合。

均提供 1600×1000 透明 SVG/PNG，网页继续使用 640px WebP 缩略图与按需大图。前辑双鲤修订及其他原作保留。生成命令、题材边界和十二景总览见 [创作简报](heritage-studies/painting-brief.md)。本辑仅扩充作品，不改动安装版 Skill 或生产界面。

## 四时与人间 · 十二景

这十二幅保留在对应分类与精选总览：牡丹绣石、榴实盈枝、蕉雨听石、桂影月兔、苍鹰守岩、青瓷含莲、铜爵礼影、笙竹和鸣、投壶矢趣、桔槔汲古、汀渡横舟、驿路秋舍。花木、生灵、器物和乡野空间各自设计构图，按花色、毛羽、釉色、铜木材质自由设色。

透明 SVG/PNG 均为 1600×1000；缩略图继续使用 640px WebP，放大才加载大图。生成命令、题材边界和检查局部见 [创作简报](seasonal-studies/painting-brief.md)。原有 163 份 SVG/PNG 经 SHA-256 对照全部保持一致，包含刚修订的铜镜、印信和双鲤。本辑不改动生产应用或安装版 Skill。

## 百工与春华 · 十二景

这十二幅保留在对应分类与精选总览：麦香石磨、雕版留香、珠算筹思、市衡量谷、宫灯照影、纸鸢乘风、葡架松趣、凌波清供、翠羽山茶、春云城阙、瓦当承露、绣绷春色。新增农桑、印书、筹算、度量、灯彩、游艺、花鸟与建筑构件题材，按材料和季节自由使用朱赭、靛蓝、紫葡、黄白与青翠。

均提供 1600×1000 透明 SVG/PNG，沿用 WebP 缩略图、按需大图和原下载入口。前辑 188 份 SVG/PNG 哈希保持一致；不修改画册布局、生产界面或安装版 Skill。生成命令、十二幅构图与历史使用边界见 [创作简报](civilization-studies/painting-brief.md)。

## 庭院与风物 · 十二景

本辑十二幅：环刀守阵、铜戈遗影、玉琮凝礼、博山烟岚、棋枰清趣、独轮载谷、枇杷金实、牵牛晓露、狸花戏蝶、芦汀鸳侣、漏窗竹影、古巷牌坊。题材覆盖军旅、礼器、清供、游艺、交通、花鸟与园林，延续彩墨定调并区分铁、铜、玉、漆木、金果和紫花，保留在对应分类及精选总览中。

均提供 1600×1000 透明 SVG/PNG；预览沿用 640px WebP 和按需大图。前辑全部 213 份 SVG/PNG 哈希保持一致；画册布局、生产界面与安装版 Skill 保持原样。生成命令、构图和历史使用边界见 [创作简报](courtyard-studies/painting-brief.md)。

后续局部修订：玉琮孔内补绘不透明玉质内壁与深浅层次；铜戈重画装柄关系，旧盔改为秦式札胄并补充披膊、胸腹甲与甲裙。参考资料与艺术推演边界见 [形制参考](courtyard-studies/historical-references.md)；其他十幅源图保持原样。

## 秋庭与礼乐 · 十二景

本辑新增玉簪花影、红蓼秋汀、扁豆垂荚、黄鹂栖枝、金龟伏叶、陶埙古韵、铜匜沃盥、玉璜双系、磬石悬声、笸箩晒谷、灯檠书影、夯关秋照十二幅原创代码彩墨，按花色、毛羽、陶铜、玉石、竹木和夯土分别设色。

提供 1600×1000 透明 SVG/PNG，统一画册“本次新作”切至本辑，精选与各分类保留旧稿；继续采用 640px WebP 缩略图与按需大图。构图、生成命令和历史使用边界见 [创作简报](ritual-studies/painting-brief.md)。Skill 同步本辑植物、甲虫、陶埙、铜匜、玉璜与悬磬的结构经验。

## 参考与边界

这套绘画经验已封装为 [中国古风元素绘画 Skill](../../skills/chinese-ink-elements/SKILL.md)，包含色彩笔墨、各类元素配方、透明导出、视觉纠偏及九景独立生成代码。可在本地调用 `$chinese-ink-elements`，完整分发包见 [技能 ZIP](../../skill-packages/chinese-ink-elements.zip)。

参考 [shan-shui-inf](https://github.com/LingDong-/shan-shui-inf) 的分层与皴线思路、[Rough.js](https://github.com/rough-stuff/rough) 的手绘线条方法，以及 IconPark 等项目的资源组织方法。完整核实记录见 [研究文档](../../../docs/design-system/traditional-culture-assets-research.md)。没有复制第三方 SVG 路径或引入其依赖。

本项目代码绘制的通用古建、园林和自然意象，沿用项目 Apache-2.0 许可。不对应某座真实古迹、具体朝代营造制度或历史测绘复原；不作为事实性古迹配图冒充真实素材。
