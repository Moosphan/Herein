# 百物与生机 · 十二景

依据历史题材目录，继续拓展文房、玉漆器、礼乐、军械、货币、茶事、织造、水利、花鸟与庭园；均为原创代码彩墨意象，延续暖纸上的材料色、块面、轻颗粒与留白。未调用生图模型。

| 作品 | 类型与画法 |
| --- | --- |
| 砚边笔意 | 文房：砚体厚壁、内凹墨池、纸卷与收锋笔毫 |
| 玉璧垂绦 | 玉饰：低对比青玉、真实透孔、浅刻纹与丝结流苏 |
| 编钟清韵 | 礼乐：木架、悬绳、连续钟体与厚口，简化五钟意象 |
| 漆匣含光 | 漆木：暗朱漆面、盖缘厚度与浅色螺钿枝叶 |
| 弓矢待发 | 军械：弓梢弦端、杆羽镞承接、箭箙口遮挡 |
| 钱串流通 | 商贸：铜金转面、真实方孔与孔内穿绳，铸纹为抽象装饰 |
| 炉畔茶烟 | 茶事：青瓷壶、赭陶炉、器底支承与淡烟 |
| 织梭经纬 | 百工：机架、经线、织面和梭的关系，结构装饰意象 |
| 梯田水转 | 农耕：曲折田面、田埂厚边、水路与有轴心支架的木轮 |
| 杏枝双燕 | 花鸟：粗细枝势、杏粉花簇、不同尺度飞燕与叉尾 |
| 莲下游鲤 | 水域：朱金双鲤、连续尾柄、同色柔染腹面与叶脉；按反馈移除大块浅白腹斑 |
| 月下水亭 | 园林：薄檐、柱梁、栏杆台基、月色与低对比水岸 |

透明 SVG/PNG 均为 1600×1000，纸底与标题只在展示拼图中。语义分组适用于静态复用和后续编辑，未验证机构运动。器形、服制和技术均不是指定文物、朝代或工程的复原；纹样不冒充币文、铭文或史料。

运行 `node scripts/generate-expanded-ink-studies.mjs` 生成 SVG；运行 `pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/expanded-studies --overwrite` 导出透明 PNG；运行 `python3 scripts/preview-expanded-ink-studies.py` 查看拼图、材质细节与三底色；最后运行 `pnpm design:culture:gallery` 更新统一画册。

独立生成器已收入 Skill，可用 `--list`、`--scenes` 选择题材，输出目录必须显式指定；同目录重画需 `--overwrite`。新材料和构造经验分别见 Skill 的 `objects-and-materials.md`、`craft-and-constructed-scenes.md`，燕鲤及春花经验补充至活体和元素配方。
