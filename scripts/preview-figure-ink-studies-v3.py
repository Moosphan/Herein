import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/figure-studies-v3'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']
font_path = Path('/System/Library/Fonts/Supplemental/Songti.ttc')


def font(size):
    if font_path.exists():
        return ImageFont.truetype(str(font_path), size)
    return ImageFont.load_default(size=size)


def fit(artwork, size):
    ratio = min(size[0] / artwork.width, size[1] / artwork.height)
    return artwork.resize((round(artwork.width * ratio), round(artwork.height * ratio)), Image.Resampling.LANCZOS)


sheet = Image.new('RGBA', (2400, 1100), '#dfc69c')
draw = ImageDraw.Draw(sheet)
draw.text((55, 32), '衣冠与风骨 · 写意第三稿', font=font(43), fill='#413b30')
draw.text((57, 100), '纯代码绘画 / 汉武帝 · 霍去病 · 赤兔 / 神态与笔势试作', font=font(23), fill='#816749')
draw.line((55, 148, 2345, 148), fill='#b59a74')
crops = [(370, 102, 1208, 980), (205, 145, 1080, 975), (250, 180, 1325, 800)]
proof = Image.new('RGBA', (1500, 936), '#dfc69c')
details = Image.new('RGBA', (1800, 1150), '#dfc69c')
detail_draw = ImageDraw.Draw(details)
detail_specs = [
    (0, (750, 287, 968, 580), (0, 0, 600, 660), '汉武帝 / 眉眼与须髯'),
    (1, (786, 184, 991, 479), (600, 0, 1200, 660), '霍去病 / 发束与凝视'),
    (1, (897, 645, 977, 746), (1200, 0, 1800, 660), '霍去病 / 按剑握持'),
    (2, (896, 172, 1215, 438), (0, 660, 900, 1150), '赤兔 / 头颈与飞鬃'),
    (2, (422, 510, 1315, 800), (900, 660, 1800, 1150), '赤兔 / 腾空四肢'),
]
artworks = []

for index, (asset, crop) in enumerate(zip(assets, crops)):
    artwork = Image.open(destination / 'ink-wash' / asset['png']).convert('RGBA')
    artworks.append(artwork)
    warm = Image.new('RGBA', artwork.size, '#dfc69c')
    warm.alpha_composite(artwork)
    warm.convert('RGB').save(destination / (asset['id'] + '-paper.jpg'), quality=96)
    cropped = fit(artwork.crop(crop), (752, 765))
    left = index * 800 + 24 + (752 - cropped.width) // 2
    top = 164 + (765 - cropped.height) // 2
    sheet.alpha_composite(cropped, (left, top))
    draw.text((index * 800 + 56, 949), asset['name'], font=font(35), fill='#413b30')
    draw.text((index * 800 + 56, 1014), asset['note'], font=font(23), fill='#816749')
    for column, color in enumerate(['#dfc69c', '#faf9f4', '#393c40']):
        sample = Image.new('RGBA', (500, 312), color)
        sample.alpha_composite(artwork.resize(sample.size, Image.Resampling.LANCZOS))
        proof.alpha_composite(sample, (column * 500, index * 312))

for asset_index, crop, cell, label in detail_specs:
    left, top, right, bottom = cell
    sample = fit(artworks[asset_index].crop(crop), (right - left - 45, bottom - top - 84))
    details.alpha_composite(sample, (left + (right - left - sample.width) // 2, top + 65))
    detail_draw.text((left + 22, top + 18), label, font=font(25), fill='#413b30')

sheet.convert('RGB').save(destination / 'figure-studies-preview.jpg', quality=96)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=95)
details.convert('RGB').save(destination / 'portrait-details.jpg', quality=96)
hero_detail = Image.new('RGBA', (1000, 1120), '#dfc69c')
hero_draw = ImageDraw.Draw(hero_detail)
hero_draw.text((52, 36), '霍去病 · 青年将领', font=font(39), fill='#413b30')
hero_draw.text((54, 97), '舒展眉间 · 清朗远眺 · 坚定而不怒', font=font(24), fill='#816749')
hero_sample = fit(artworks[1].crop((785, 178, 998, 482)), (850, 900))
hero_detail.alpha_composite(hero_sample, ((1000 - hero_sample.width) // 2, 169))
hero_detail.convert('RGB').save(destination / 'huo-qubing-face-study.jpg', quality=97)
print('Created third-edition preview, enlarged details and three-background proof')
