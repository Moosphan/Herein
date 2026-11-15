import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/figure-studies-v2'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']
font_path = Path('/System/Library/Fonts/Supplemental/Songti.ttc')


def font(size):
    if font_path.exists():
        return ImageFont.truetype(str(font_path), size)
    return ImageFont.load_default(size=size)


sheet = Image.new('RGBA', (2100, 930), '#dfc69c')
draw = ImageDraw.Draw(sheet)
draw.text((48, 31), '衣冠与风骨 · 人物第二稿', font=font(40), fill='#493e32')
draw.text((50, 92), '汉武帝 / 霍去病 / 赤兔马    ·    原创彩墨意象', font=font(22), fill='#856b50')
draw.line((48, 137, 2052, 137), fill='#b59a74')
crops = [(410, 105, 1210, 957), (280, 110, 1080, 962), (275, 170, 1325, 925)]
proof = Image.new('RGBA', (1500, 936), '#dfc69c')
details = Image.new('RGBA', (1800, 1000), '#dfc69c')
detail_draw = ImageDraw.Draw(details)
detail_specs = [
    (0, (700, 238, 925, 505), (0, 0, 450, 534), '汉武帝 / 面部'),
    (1, (760, 220, 975, 433), (450, 0, 900, 534), '霍去病 / 面部'),
    (0, (753, 717, 890, 833), (900, 0, 1350, 534), '拢袖 / 手部'),
    (1, (908, 663, 982, 756), (1350, 0, 1800, 534), '按剑 / 手部'),
    (2, (925, 205, 1215, 425), (0, 534, 900, 1000), '赤兔 / 头颈'),
    (2, (385, 535, 1280, 858), (900, 534, 1800, 1000), '赤兔 / 四肢'),
]
artworks = []

for index, (asset, crop) in enumerate(zip(assets, crops)):
    artwork = Image.open(destination / 'ink-wash' / asset['png']).convert('RGBA')
    artworks.append(artwork)
    warm = Image.new('RGBA', artwork.size, '#dfc69c')
    warm.alpha_composite(artwork)
    warm.convert('RGB').save(destination / (asset['id'] + '-paper.jpg'), quality=95)
    cropped = artwork.crop(crop)
    cropped.thumbnail((654, 638), Image.Resampling.LANCZOS)
    left = index * 700 + 23 + (654 - cropped.width) // 2
    top = 154 + (638 - cropped.height) // 2
    sheet.alpha_composite(cropped, (left, top))
    draw.text((index * 700 + 48, 807), asset['name'], font=font(30), fill='#493e32')
    descriptions = ['成熟凝视 · 玄衣冕冠 · 拢袖收势', '青年统帅 · 朱红披风 · 札甲按剑', '赤栗设色 · 颈肩承接 · 奔姿错落']
    draw.text((index * 700 + 48, 858), descriptions[index], font=font(20), fill='#856b50')
    for column, color in enumerate(['#dfc69c', '#faf9f4', '#393c40']):
        sample = Image.new('RGBA', (500, 312), color)
        sample.alpha_composite(artwork.resize(sample.size, Image.Resampling.LANCZOS))
        proof.alpha_composite(sample, (column * 500, index * 312))

for asset_index, crop, cell, label in detail_specs:
    left, top, right, bottom = cell
    sample = artworks[asset_index].crop(crop)
    sample.thumbnail((right - left - 40, bottom - top - 65), Image.Resampling.LANCZOS)
    details.alpha_composite(sample, (left + (right - left - sample.width) // 2, top + 50))
    detail_draw.text((left + 20, top + 14), label, font=font(22), fill='#493e32')

sheet.convert('RGB').save(destination / 'figure-studies-preview.jpg', quality=95)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
details.convert('RGB').save(destination / 'portrait-details.jpg', quality=96)
print('Created second-edition preview, details, paper studies and background proof')
