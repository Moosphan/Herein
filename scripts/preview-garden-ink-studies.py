import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/garden-studies'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']
font_path = next((path for path in [Path('/System/Library/Fonts/Supplemental/Songti.ttc'), Path('C:/Windows/Fonts/simsun.ttc')] if path.exists()), None)


def font(size):
    return ImageFont.truetype(str(font_path), size) if font_path else ImageFont.load_default(size=size)


def fit(image, size):
    ratio = min(size[0] / image.width, size[1] / image.height)
    return image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)


sheet = Image.new('RGBA', (2040, 1680), '#dfc69c')
draw = ImageDraw.Draw(sheet)
draw.text((35, 24), '花庭与清供 · 彩墨十二景', font=font(40), fill='#413b30')
draw.text((38, 84), '紫藤 / 柿子 / 木兰 / 喜鹊 / 雄鸡 / 白鹅 / 如意 / 簪梳 / 瓷枕 / 茶篓 / 陶灯 / 水榭', font=font(23), fill='#816749')
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
    (0, (348, 230, 1009, 740), (0, 0), '紫藤 / 串花与复叶'),
    (4, (495, 192, 748, 525), (600, 0), '雄鸡 / 头冠与颈羽'),
    (5, (670, 387, 907, 665), (1200, 0), '白鹅 / 头颈与喙'),
    (6, (916, 229, 1332, 542), (0, 600), '如意 / 云头与玉质'),
    (9, (550, 207, 1034, 833), (600, 600), '竹篓 / 提梁与编织'),
    (11, (730, 285, 1390, 840), (1200, 600), '水榭 / 开敞梁柱与临水台基'),
]:
    sample = fit(artworks[index].crop(crop), (540, 480))
    left, top = position
    details.alpha_composite(sample, (left + (600 - sample.width) // 2, top + 80))
    detail_draw.text((left + 25, top + 23), label, font=font(25), fill='#413b30')

sheet.convert('RGB').save(destination / 'garden-studies-preview.jpg', quality=95)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
details.convert('RGB').save(destination / 'material-details.jpg', quality=96)
print('Created garden overview, details and three-background proof')
