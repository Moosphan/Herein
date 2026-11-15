# 花庭与清供 · 彩墨十二景

沿用用户确认的中国古风代码绘画方向，按物体材质设色，以暖纸展示、透明主体交付。本辑新增十二种构图，保留前辑所有作品；不调用生图模型，不将通用意象宣称为某一朝代的文物、建筑或工艺复原。

| 作品 | 结构与设色 |
| --- | --- |
| 藤萝垂紫 | 老蔓曲折、串花下垂，灰紫花序与新绿复叶，长短错落 |
| 柿染秋枝 | 萼与果柄衔接承重枝，橙红果面转暗，赭黄秋叶 |
| 辛夷照春 | 大瓣木兰随枝向舒展，粉白实体花瓣遮住后枝 |
| 双鹊报春 | 两鹊改变俯仰、大小与高低，足爪扣枝，蓝灰长尾 |
| 雄鸡司晨 | 昂首、红冠、金颈与墨绿弧尾，双腿承重接地 |
| 双鹅清波 | 头颈接躯干，白羽实体与青灰暗面，水纹透明 |
| 玉意流云 | 云头与弯柄连续，青玉低对比转面，绛绦穿系 |
| 簪梳凝香 | 梳齿连续接梳背，金花与玉簪长针接合，珠坠有吊点 |
| 瓷枕清梦 | 豆形微凹枕面、厚壁、底缘，青釉面内画卷草 |
| 茶篓春采 | 提梁连接口缘，编织随腹面弯曲，茶叶遮挡与箬笠前景 |
| 陶灯书影 | 灯盘、立柱、底座连续，灯芯贴盘缘，书册有页层厚度 |
| 柳岸水榭 | 弯曲老干、分杈披垂，细长披针叶随长梢向右飘拂；三层浓淡柳幕保留。四角攒尖亭使用统一投影，柱梁、坐凳、栏杆与石台同向；瓦线贴合屋面，入口与踏步对齐 |

纸底为 `#dfc69c`，仅用于画册与总览；原图均为 1600×1000 透明 SVG/PNG。材料白、玉色和青釉属于实体填色，不能拿纸底冒充；梳齿、提梁、柳丝之间保持透明留白。代码生成器为确定性输出，SVG 分组可继续编辑。

## 生成与检查

```sh
node scripts/generate-garden-ink-studies.mjs
pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/garden-studies --overwrite
python3 scripts/preview-garden-ink-studies.py
pnpm design:culture:gallery
```

`garden-studies-preview.jpg` 是十二作总览；`material-details.jpg` 查看串花、雄鸡头冠、鹅头颈、玉如意、竹篓与水榭承接；`background-proof.jpg` 对照暖纸、白底和深底。画册沿用最大 640px WebP 缩略图、弹窗按需读取最大 1600px WebP，原始 SVG/PNG 保留下载。
