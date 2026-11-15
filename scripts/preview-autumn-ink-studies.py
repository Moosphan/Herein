import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/autumn-studies'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']
font_path = next((path for path in [Path('/System/Library/Fonts/Supplemental/Songti.ttc'), Path('C:/Windows/Fonts/simsun.ttc')] if path.exists()), None)


def font(size):
    return ImageFont.truetype(str(font_path), size) if font_path else ImageFont.load_default(size=size)


def fit(image, size):
    ratio = min(size[0] / image.width, size[1] / image.height)
    return image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)


sheet = Image.new('RGBA', (2040, 1680), '#dfc69c')
draw = ImageDraw.Draw(sheet)
draw.text((35, 24), '花木与雅器 · 彩墨十二景', font=font(40), fill='#413b30')
draw.text((38, 84), '杜鹃 / 芙蓉 / 枣枝 / 荔枝 / 双鹑 / 芦蟹 / 阮琴 / 紫砂 / 香篆 / 木屐 / 鱼篓 / 井台', font=font(23), fill='#816749')
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
    (9, (330, 235, 1280, 830), (0, 0), '木屐 / 长木底、横齿与编帮'),
    (5, (607, 467, 1123, 858), (600, 0), '秋蟹 / 螯足与甲壳'),
    (6, (801, 88, 1091, 373), (1200, 0), '阮琴 / 弦轴与琴颈'),
    (7, (400, 460, 1238, 818), (0, 600), '紫砂 / 壶流与把手'),
    (10, (530, 443, 1066, 829), (600, 600), '鱼篓 / 口壁与编织'),
    (11, (490, 273, 1127, 711), (1200, 600), '井台 / 卷轴与支架'),
]:
    sample = fit(artworks[index].crop(crop), (540, 480))
    left, top = position
    details.alpha_composite(sample, (left + (600 - sample.width) // 2, top + 80))
    detail_draw.text((left + 25, top + 23), label, font=font(25), fill='#413b30')

sheet.convert('RGB').save(destination / 'autumn-studies-preview.jpg', quality=95)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
details.convert('RGB').save(destination / 'material-details.jpg', quality=96)
print('Created autumn overview, details and three-background proof')



