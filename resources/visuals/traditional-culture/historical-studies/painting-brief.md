# 历史题材八景

沿用原有历史题材分类，新增人物衣冠、飞禽走兽、边防建筑、舟船水路、礼器青铜和花卉园圃。全部为原创代码绘画，未调用生图模型；人物、服饰、建筑与器物均为艺术意象，不宣称真实肖像或具体朝代复原。

| 作品 | 设色与表现重点 |
| --- | --- |
| 文士展卷 | 靛青衣袍，成熟面骨、须髯与双手展卷；与帝王和青年将领区别角色 |
| 女乐抚琴 | 烟紫衣裙，独立设计的面形、低眉与琴弦接触；无夸张表情 |
| 芦汀鹤立 | 月白羽面、焦墨飞羽、少量朱顶，曲颈及双足支撑 |
| 秋原鹿鸣 | 赭金皮毛、浅腹与斑点，不对称角枝、前后肢遮挡 |
| 关山烽燧 | 土黄夯墙、暖赭夕照、青灰远岭，墙面遮挡与边塞层次 |
| 柳岸渔舟 | 青灰山水、竹青柳丝、舟中垂钓者，主景与留江空间 |
| 青铜鼎影 | 铜褐暗金、局部铜绿，器口厚度、双耳和三足承重 |
| 篱菊映石 | 金黄重瓣、竹青叶面与灰青石，花枝生长与疏密关系 |

透明 SVG/PNG 为 1600×1000。纸底与文字仅在展示拼图中。SVG 有独立主体分组和素材前缀 ID；同一素材重复内联时仍需实例前缀。

生成：`node scripts/generate-historical-ink-studies.mjs`。导出：`pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/historical-studies --overwrite`。细节与三底色检查：`python3 scripts/preview-historical-ink-studies.py`。画册：`pnpm design:culture:gallery`。
