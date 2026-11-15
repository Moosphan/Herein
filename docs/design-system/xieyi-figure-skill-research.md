# 写意人物与画马：第三版研究取舍

核对日期：2026-10-27。针对第二版人物五官含混、头发像贴片、帝王与将军缺少角色气势、骏马缺少奔腾韵律的问题，重新核对公开绘画 Skill 与博物馆开放馆藏。研究结论用于指导原创重绘，不复制第三方代码、路径、模板或具体画作。

## 先说明结论

没有找到一个同时提供中国人物肖像、汉代服饰、人体骨骼和奔马动作的成熟开源 Skill。Skill 主要提供观察、构图、笔墨和提示词方法；人物神韵仍需要单独设计头身比例、动作线、视线、受力和笔势，并且必须逐张看图修正。第三版因此放弃“在旧 SVG 五官上继续加纹理”的方式，改为少量明确的写意笔触：先定神态和动作线，再以浓淡墨块与关键线收住形。

## 新核对的公开 Skill

### LittleExian / photo-to-chinese-ink（MIT）

- [SKILL.md](https://github.com/LittleExian/photo-to-chinese-ink/blob/main/SKILL.md)、[人物与肖像规则](https://github.com/LittleExian/photo-to-chinese-ink/blob/main/references/subject-mapping.md)、[笔墨语言](https://github.com/LittleExian/photo-to-chinese-ink/blob/main/references/ink-language.md)。
- 对本次最有用的规则是：先锁定姿态轴、头部朝向、眉眼方向、鼻口位置、发块和服装大形，再保留少量身份笔；人物不能被简化成通用长袍人。动物必须先锁物种、动作、脊柱和四肢连接，再用集中识别笔表现头、背线、关节和鬃毛。
- 它是“照片转写意水墨”的工作流，并不是人物骨骼或汉代服制数据库；本项目只借用观察顺序。该仓库为 MIT，未复制其代码或文字模板。

### cloveric / claude-drawing-skill（MIT）

- [SKILL.md](https://github.com/cloveric/claude-drawing-skill/blob/main/SKILL.md)、[水墨实现](https://github.com/cloveric/claude-drawing-skill/blob/main/lib/inkpaint.py)、[许可证](https://github.com/cloveric/claude-drawing-skill/blob/main/LICENSE)。
- 水墨模块的 `stroke` 支持干湿、收锋、飞白和压力变化，强调“先构图、先看图、每轮只修最明显问题”。这比在每个形状上套随机位移更适合表达衣纹、发束和鬃尾的方向。
- 模块的现成物件主要是山水、松、塔和行旅小人，没有人物肖像或马匹解剖实现，不能把它当作自动解决五官和动作的引擎；第三版不引入该库，且依用户要求不再把旧版 SVG 或透明导出约束当作画法前提。

### cconcept / paint-photo-chinese-ink（仅作方法参考）

- [结构与路由](https://github.com/cconcept/paint-photo-chinese-ink/blob/main/references/style-routing.md) 提供两条相关路线：`Xu Beihong-inspired structural ink treatment` 强调人体、马匹的骨架、负重关节、动作向量和黑墨节点；`Wu Daozi tradition-inspired Tang figure-line reconstruction` 强调衣纹的起承转折、压力与速度变化。
- [笔墨真实性](https://github.com/cconcept/paint-photo-chinese-ink/blob/main/references/ink-authenticity.md) 要求每幅只使用两到三类主要笔墨，先留白和骨架，再放主体墨块，最后决定是否需要一个结构性的“醒神”节点；禁止用模糊、光晕、全幅米色噪声和装饰性飞溅掩盖断肢或错位。
- 该仓库许可证是 [Download-Only](https://github.com/cconcept/paint-photo-chinese-ink/blob/main/LICENSE)，仅允许个人非商业使用未修改副本，不安装、不复制、不把它的模板并入本项目。这里只记录公开的观察原则和限制。

## 馆藏观察（不是考据服饰模板）

- [Cleveland Museum of Art：Three Horses and Four Grooms，约 1320s](https://clevelandart.org/art/1960.181)。馆方说明使用“elegant in appearance and vigorous in spirit”描述马的气质，并提到李公麟结构传统、唐代传统和韩干的设色来源。第三版借鉴“重量先于纹理、鬃毛服从动作”的观察原则，不复制构图。
- [Cleveland Museum of Art：Nine Songs，1361](https://clevelandart.org/art/1959.138)。馆方标为 `baimiao`（fine-line drawing），说明线条本身承载书法性自我表达。第三版将衣纹和发束作为有速度变化的主线，而不是均匀黑色轮廓。
- [Cleveland Museum of Art：A Vignette of Life on the Frontier，约 1717–22](https://clevelandart.org/art/1979.18)。馆方分别描述人物衣服的线性处理、马的体量、警觉眼神和飘动鬃毛；第三版据此把人物与骏马拆成不同的线墨逻辑。它是清代作品，不能直接作为汉武帝或霍去病的服制复原依据。
- [Cleveland Museum of Art 开放 API](https://openaccess-api.clevelandart.org/api/artworks/?q=horse&limit=8) 是本轮检索入口；馆藏资料用于绘画语言和作品出处核对，不宣称真实肖像。

## 第三版执行规则

1. **汉武帝：先神后形。** 采用三分之二侧向的临朝半身；头顶冠与肩线构成稳定的垂直轴，眉弓压低、眼睑半收、嘴部闭合，视线落向画外，避免笑脸和正面证件照感。须发以一块深墨发冠和三组有方向的短锋表示，不画成均匀噪声。
2. **霍去病：以动作显将气。** 采用迎风回身、前肩压低、后肩打开、手按剑柄的斜向动作；披风从肩胛向后上方拉出长短不同的墨带，甲片只保留肩、胸、腰的几组受力结构。脸用清楚的眉眼和下颌转折表现年轻专注，不靠夸张肌肉或武侠光效。
3. **赤兔：以一条力线贯穿。** 采用前冲腾跃瞬间：耳、额、鼻梁、颈背、脊线形成连续的前进弧；胸廓先落墨，前后腿按远近交错收锋，蹄尖不漂浮；鬃尾沿同一风向分成少量长短变化的飞白笔束。用赤栗与焦墨作为少量识别色，不用渐变和圆形肌肉徽章。
4. **五官和手部验收。** 先看 10–15% 缩略图能否识别角色和动作，再看原尺寸；脸必须有眉、眼睑、鼻梁、鼻底、口线和下颌的连续关系，手必须围绕袖口、剑柄或衣带产生遮挡，不能由独立贴片拼接。
5. **停止条件。** 每个角色只保留结构线、主体墨块和一类局部干笔；不再用全脸模糊、统一边缘滤镜、随机纹理、泛黄背景或飞溅补“神韵”。如果原尺寸看不清，应重画关键线，而不是提高噪声或对比度。

研究结论不能替代逐图审查。最终交付仍标注为原创历史题材意象，不宣称汉武帝、霍去病真实容貌或汉代冠服考据复原。
