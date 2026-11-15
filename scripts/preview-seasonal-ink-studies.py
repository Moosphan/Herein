import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/seasonal-studies'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']
font_path = next((path for path in [
    Path('/System/Library/Fonts/Supplemental/Songti.ttc'),
    Path('C:/Windows/Fonts/simsun.ttc'),
] if path.exists()), None)


def font(size):
    return ImageFont.truetype(str(font_path), size) if font_path else ImageFont.load_default(size=size)


def fit(image, size):
    ratio = min(size[0] / image.width, size[1] / image.height)
    return image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)


sheet = Image.new('RGBA', (2040, 1680), '#dfc69c')
draw = ImageDraw.Draw(sheet)
draw.text((35, 24), '四时与人间 · 彩墨十二景', font=font(40), fill='#413b30')
draw.text((38, 84), '花木 / 鹰兔 / 青瓷 / 礼器 / 竹笙 / 投壶 / 汲水 / 渡口 / 驿舍', font=font(23), fill='#816749')
proof = Image.new('RGBA', (1200, len(assets) * 250), '#dfc69c')
artworks = []
for index, asset in enumerate(assets):
    artwork = Image.open(destination / 'ink-wash' / asset['png']).convert('RGBA')
    artworks.append(artwork)
    sample = fit(artwork.crop(artwork.getbbox()), (440, 373))
    left = index % 4 * 510 + (510 - sample.width) // 2
    top = 145 + index // 4 * 500 + (373 - sample.height) // 2
    sheet.alpha_composite(sample, (left, top))
    draw.text((index % 4 * 510 + 35, 535 + index // 4 * 500), asset['name'], font=font(30), fill='#413b30')
    draw.text((index % 4 * 510 + 35, 579 + index // 4 * 500), asset['theme'], font=font(18), fill='#816749')
    for column, color in enumerate(['#dfc69c', '#faf9f4', '#393c40']):
        cell = Image.new('RGBA', (400, 250), color)
        cell.alpha_composite(artwork.resize(cell.size, Image.Resampling.LANCZOS))
        proof.alpha_composite(cell, (column * 400, index * 250))

details = Image.new('RGBA', (1800, 1200), '#dfc69c')
detail_draw = ImageDraw.Draw(details)
for index, crop, position, label in [
    (0, (554, 174, 969, 601), (0, 0), '牡丹 / 重瓣与提按'),
    (3, (599, 431, 790, 744), (600, 0), '月兔 / 眼神与耳根'),
    (4, (664, 283, 908, 550), (1200, 0), '苍鹰 / 钩喙、眉眼与羽根'),
    (5, (675, 277, 948, 488), (0, 600), '青瓷 / 莲口与釉色'),
    (8, (674, 473, 924, 624), (600, 600), '投壶 / 耳部与颈肩承接'),
    (9, (422, 212, 936, 738), (1200, 600), '桔槔 / 支点、绳与桶'),
]:
    sample = fit(artworks[index].crop(crop), (540, 480))
    left, top = position
    details.alpha_composite(sample, (left + (600 - sample.width) // 2, top + 80))
    detail_draw.text((left + 25, top + 23), label, font=font(25), fill='#413b30')

sheet.convert('RGB').save(destination / 'seasonal-studies-preview.jpg', quality=95)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
details.convert('RGB').save(destination / 'material-details.jpg', quality=96)
print('Created seasonal twelve-study overview, details and three-background proof')
