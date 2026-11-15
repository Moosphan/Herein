import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/travel-studies'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']
font_path = next((path for path in [Path('/System/Library/Fonts/Supplemental/Songti.ttc'), Path('C:/Windows/Fonts/simsun.ttc')] if path.exists()), None)


def font(size):
    return ImageFont.truetype(str(font_path), size) if font_path else ImageFont.load_default(size=size)


def fit(image, size):
    ratio = min(size[0] / image.width, size[1] / image.height)
    return image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)


sheet = Image.new('RGBA', (2040, 1680), '#dfc69c')
draw = ImageDraw.Draw(sheet)
draw.text((35, 24), '清庭与行藏 · 彩墨十二景', font=font(40), fill='#413b30')
draw.text((38, 84), '金橘 / 木瓜 / 金丝桃 / 荷包牡丹 / 蝉 / 蝶 / 笔筒 / 剪尺 / 纸伞 / 蓑笠 / 书函 / 石狮', font=font(23), fill='#816749')
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
    (3, (551, 284, 1130, 501), (0, 0), '荷包牡丹 / 外瓣、反卷与内瓣'),
    (4, (688, 393, 969, 650), (600, 0), '蝉 / 头胸、足与翅'),
    (6, (588, 175, 1030, 820), (1200, 0), '笔筒 / 笔毫与筒口'),
    (7, (480, 356, 1045, 712), (0, 600), '剪刀 / 枢轴与指环'),
    (9, (701, 313, 1146, 857), (600, 600), '蓑衣 / 肩领与草束'),
    (11, (988, 342, 1308, 910), (1200, 600), '石狮 / 宽吻、厚胸与巨爪'),
]:
    sample = fit(artworks[index].crop(crop), (540, 480))
    left, top = position
    details.alpha_composite(sample, (left + (600 - sample.width) // 2, top + 80))
    detail_draw.text((left + 25, top + 23), label, font=font(25), fill='#413b30')

sheet.convert('RGB').save(destination / 'travel-studies-preview.jpg', quality=95)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
details.convert('RGB').save(destination / 'material-details.jpg', quality=96)

lion_preview = Image.new('RGBA', artworks[11].size, '#dfc69c')
lion_preview.alpha_composite(artworks[11])
lion_preview.convert('RGB').save(destination / 'stone-lions-refined-preview.jpg', quality=96)

combined = Image.new('RGBA', (1800, 780), '#dfc69c')
combined_draw = ImageDraw.Draw(combined)
cat = Image.open(root / 'resources/visuals/traditional-culture/courtyard-studies/ink-wash/ink-cat-and-butterfly.png').convert('RGBA')
for index, (artwork, title) in enumerate([
    (artworks[3], '荷包垂露 · 荷包牡丹'),
    (artworks[11], '石狮守庭 · 门庭雕兽'),
    (cat, '狸花逐蝶 · 中华田园猫'),
]):
    sample = fit(artwork.crop(artwork.getbbox()), (552, 650))
    combined.alpha_composite(sample, (index * 600 + (600 - sample.width) // 2, 50 + (650 - sample.height) // 2))
    combined_draw.text((index * 600 + 24, 721), title, font=font(30), fill='#413b30')
combined.convert('RGB').save(destination / 'flower-lions-tabby-preview.jpg', quality=96)
print('Created travel overview, details and three-background proof')




