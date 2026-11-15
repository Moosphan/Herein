import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/historical-studies'
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


sheet = Image.new('RGBA', (1920, 1220), '#dfc69c')
draw = ImageDraw.Draw(sheet)
draw.text((35, 24), '衣冠 · 生灵 · 关山 · 器物', font=font(38), fill='#413b30')
draw.text((38, 78), '历史题材八景 / 原创代码彩墨意象', font=font(22), fill='#816749')
proof = Image.new('RGBA', (1200, len(assets) * 250), '#dfc69c')
artworks = []
for index, asset in enumerate(assets):
    artwork = Image.open(destination / 'ink-wash' / asset['png']).convert('RGBA')
    artworks.append(artwork)
    cropped = fit(artwork.crop(artwork.getbbox()), (415, 425))
    left = (index % 4) * 480 + (480 - cropped.width) // 2
    top = 139 + (index // 4) * 530 + (425 - cropped.height) // 2
    sheet.alpha_composite(cropped, (left, top))
    draw.text(((index % 4) * 480 + 35, 580 + (index // 4) * 530), asset['name'], font=font(29), fill='#413b30')
    draw.text(((index % 4) * 480 + 35, 623 + (index // 4) * 530), asset['theme'], font=font(18), fill='#816749')
    for column, color in enumerate(['#dfc69c', '#faf9f4', '#393c40']):
        cell = Image.new('RGBA', (400, 250), color)
        cell.alpha_composite(artwork.resize(cell.size, Image.Resampling.LANCZOS))
        proof.alpha_composite(cell, (column * 400, index * 250))

details = Image.new('RGBA', (1600, 1100), '#dfc69c')
detail_draw = ImageDraw.Draw(details)
for index, crop, position, label in [
    (0, (753, 160, 923, 423), (0, 0), '文士 / 眉眼、须髯与面骨'),
    (1, (735, 147, 918, 423), (800, 0), '女乐 / 发束、低眉与口线'),
    (0, (600, 535, 976, 660), (0, 550), '展卷 / 手指与书卷承接'),
    (1, (620, 630, 1053, 727), (800, 550), '抚琴 / 琴弦与指下接触'),
]:
    sample = fit(artworks[index].crop(crop), (740, 440))
    left, top = position
    details.alpha_composite(sample, (left + (800 - sample.width) // 2, top + 75))
    detail_draw.text((left + 30, top + 22), label, font=font(26), fill='#413b30')

sheet.convert('RGB').save(destination / 'historical-studies-preview.jpg', quality=95)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
details.convert('RGB').save(destination / 'portrait-details.jpg', quality=96)
print('Created eight-study overview, figure details and three-background proof')
