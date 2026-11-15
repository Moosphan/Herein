import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/spring-studies'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']


def text(draw, position, content, size, fill):
    primary = ImageFont.truetype('/System/Library/Fonts/Supplemental/Songti.ttc', size)
    fallback = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', size)
    left, top = position
    for character in content:
        selected = primary if character.isspace() or primary.getmask(character).getbbox() else fallback
        draw.text((left, top + size), character, font=selected, fill=fill, anchor='ls')
        left += selected.getlength(character)


def fit(image, bounds):
    ratio = min(bounds[0] / image.width, bounds[1] / image.height)
    return image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)


sheet = Image.new('RGBA', (2040, 1680), '#dfc69c')
draw = ImageDraw.Draw(sheet)
text(draw, (35, 24), '春汀与清赏 · 彩墨十二景', 40, '#413b30')
text(draw, (38, 84), '鸢尾 / 绣球 / 葫芦 / 乌桕 / 戴胜 / 鸬鹚 / 漆盘 / 建盏 / 铜锁 / 团扇 / 石碾 / 板桥', 23, '#816749')
proof = Image.new('RGBA', (1200, 3000), '#dfc69c')
artworks = []
for index, asset in enumerate(assets):
    artwork = Image.open(destination / 'ink-wash' / asset['png']).convert('RGBA')
    artworks.append(artwork)
    sample = fit(artwork.crop(artwork.getbbox()), (440, 373))
    left = index % 4 * 510 + (510 - sample.width) // 2
    top = 145 + index // 4 * 500 + (373 - sample.height) // 2
    sheet.alpha_composite(sample, (left, top))
    text(draw, (index % 4 * 510 + 35, 535 + index // 4 * 500), asset['name'], 30, '#413b30')
    text(draw, (index % 4 * 510 + 35, 579 + index // 4 * 500), asset['theme'], 18, '#816749')
    for column, color in enumerate(['#dfc69c', '#faf9f4', '#393c40']):
        cell = Image.new('RGBA', (400, 250), color)
        cell.alpha_composite(artwork.resize(cell.size, Image.Resampling.LANCZOS))
        proof.alpha_composite(cell, (column * 400, index * 250))

details = Image.new('RGBA', (1800, 1200), '#dfc69c')
detail_draw = ImageDraw.Draw(details)
for index, crop, position, title in [
    (0, (450, 240, 930, 560), (0, 0), '鸢尾 / 垂瓣、立瓣与花基'),
    (4, (430, 285, 1060, 850), (600, 0), '戴胜 / 羽冠、曲喙与折翼'),
    (5, (640, 290, 1050, 810), (1200, 0), '鸬鹚 / 颈轴、钩喙与蹼足'),
    (7, (441, 350, 1150, 805), (0, 600), '建盏 / 口壁、茶面与圈足'),
    (8, (768, 555, 1005, 748), (600, 600), '铜锁 / 扣环与横锁梁'),
    (10, (766, 430, 1135, 695), (1200, 600), '石碾 / 中轴、梁与碾磙'),
]:
    sample = fit(artworks[index].crop(crop), (540, 480))
    left, top = position
    details.alpha_composite(sample, (left + (600 - sample.width) // 2, top + 80))
    text(detail_draw, (left + 25, top + 23), title, 25, '#413b30')

sheet.convert('RGB').save(destination / 'spring-studies-preview.jpg', quality=95)
details.convert('RGB').save(destination / 'material-details.jpg', quality=96)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
print('Created spring overview, structural details and three-background proof')
