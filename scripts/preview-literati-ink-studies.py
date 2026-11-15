import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/literati-studies'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']
font_path = next((path for path in [Path('/System/Library/Fonts/Supplemental/Songti.ttc'), Path('C:/Windows/Fonts/simsun.ttc')] if path.exists()), None)


def font(size):
    return ImageFont.truetype(str(font_path), size) if font_path else ImageFont.load_default(size=size)


def fit(image, size):
    ratio = min(size[0] / image.width, size[1] / image.height)
    return image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)


sheet = Image.new('RGBA', (2040, 1680), '#dfc69c')
draw = ImageDraw.Draw(sheet)
draw.text((35, 24), '烟溪与雅物 · 彩墨十二景', font=font(40), fill='#413b30')
draw.text((38, 84), '海棠 / 佛手 / 灵芝 / 蟋蟀 / 萱草 / 翠鸟 / 提盒 / 绣囊 / 注碗 / 折扇 / 乌篷 / 竹筏', font=font(23), fill='#816749')
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
    (0, (724, 213, 1082, 531), (0, 0), '春雀 / 头胸与栖枝'),
    (1, (588, 214, 998, 782), (600, 0), '佛手 / 指瓣与果体'),
    (5, (673, 133, 1114, 659), (1200, 0), '翠鸟 / 喙与扣枝'),
    (7, (543, 332, 1060, 806), (0, 600), '绣囊 / 织面与束口'),
    (8, (481, 279, 1137, 771), (600, 600), '注子 / 曲柄、流与温碗'),
    (10, (306, 564, 866, 847), (1200, 600), '乌篷 / 篷骨与船舷'),
]:
    sample = fit(artworks[index].crop(crop), (540, 480))
    left, top = position
    details.alpha_composite(sample, (left + (600 - sample.width) // 2, top + 80))
    detail_draw.text((left + 25, top + 23), label, font=font(25), fill='#413b30')

sheet.convert('RGB').save(destination / 'literati-studies-preview.jpg', quality=95)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
details.convert('RGB').save(destination / 'material-details.jpg', quality=96)
print('Created literati overview, details and three-background proof')

