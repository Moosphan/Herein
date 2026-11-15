# 文脉与秋声 · 彩墨十二景

延续牛皮纸上的彩墨意象，用铜金、竹赭、青灰、朱砂、木褐、蓝灰和秋黄区分材质。主体文件不含纸底与题字；十二幅各有独立构图，不替换既有作品。

| 作品 | 题材与画法重点 |
| --- | --- |
| 虎符合信 | 铜色兽形符信、合缝、铸纹与弯尾 |
| 菱镜流光 | 菱花镜面、飞鸟背纹、穿钮系绳与木座；正背双面组合 |
| 简牍遗音 | 竹片厚薄、编绳、卷束和抽象墨记 |
| 晷影知时 | 石盘、晷针投影、刻度与承接石座 |
| 本草碾香 | 碾轮落槽、木轴、药草与切片 |
| 印泥封信 | 桥钮铜印、敞口朱砂印泥盒、盒盖、系绳封泥与朱红印迹 |
| 琵琶弦语 | 梨形木体、曲项、品、弦与覆手 |
| 驼铃行囊 | 蓝灰织物、皮囊、铜铃与扣带 |
| 书院廊影 | 梁柱、檐面、台基与庭院点景 |
| 银杏秋石 | 扇叶、分枝、秋黄淡染与山石 |
| 兰草幽香 | 叶片提按、花瓣虚实与根石 |
| 旌旗鼓角 | 朱旗翻折、鼓面、铆钉与鼓架承接 |

均为原创历史题材意象，不对应特定出土文物、真实印文或精确器械复原。简牍与封泥中的符号不冒充可考古文字；日晷为器物意象，不用于精确计时。

二次修订按用户反馈重画铜镜与印信：镜面用含蓄反光与远影说明用途，镜背保留铜色飞鸟纹及穿钮；印信增加铜印的桥钮和染朱底缘、开盖印泥盒与纸面印迹，强化器形识别。后者为封缄与钤印的组合意象，不作为同一朝代的文书制度复原。

输出：1600×1000 透明 SVG 与 PNG。网页采用 640px 透明 WebP 缩略图，放大后才加载 1600px 预览；下载保留原始文件。

在项目根目录依次执行：

```bash
node scripts/generate-heritage-ink-studies.mjs
pnpm exec electron resources/skills/chinese-ink-elements/scripts/render-assets.cjs --input resources/visuals/traditional-culture/heritage-studies --overwrite
python3 scripts/preview-heritage-ink-studies.py
pnpm design:culture:gallery
```

`heritage-studies-preview.jpg` 为十二幅总览；`background-proof.jpg` 为牛皮纸、浅纸与深底对照；`material-details.jpg` 用于检查铜色、浮纹、晷针承接、弦品、梁柱与兰瓣。
