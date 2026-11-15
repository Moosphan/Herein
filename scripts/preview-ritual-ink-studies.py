import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/ritual-studies'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']
font_path = Path('/System/Library/Fonts/Supplemental/Songti.ttc')


def font(size):
    return ImageFont.truetype(str(font_path), size) if font_path.exists() else ImageFont.load_default(size=size)


def text(draw, position, content, size, fill):
    primary = font(size)
    fallback_path = Path('/System/Library/Fonts/PingFang.ttc')
    fallback = ImageFont.truetype(str(fallback_path), size) if fallback_path.exists() else primary
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
text(draw, (35, 24), '秋庭与礼乐 · 彩墨十二景', 40, '#413b30')
text(draw, (38, 84), '玉簪 / 红蓼 / 扁豆 / 黄鹂 / 金龟 / 陶埙 / 铜匜 / 玉璜 / 磬石 / 晒谷 / 灯檠 / 夯关', 23, '#816749')
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
    (2, (570, 210, 1100, 820), (0, 0), '扁豆 / 复叶、藤与荚梗'),
    (3, (541, 320, 909, 727), (600, 0), '黄鹂 / 眼纹、折翼与扣枝'),
    (4, (743, 371, 1075, 685), (1200, 0), '金龟 / 鞘翅与六足'),
    (6, (354, 379, 1210, 835), (0, 600), '铜匜 / 长流、内腔与足'),
    (7, (432, 324, 1195, 721), (600, 600), '玉璜 / 孔、壁厚与系绳'),
    (8, (382, 270, 1223, 840), (1200, 600), '磬石 / 穿孔、悬绳与框架'),
]:
    sample = fit(artworks[index].crop(crop), (540, 480))
    left, top = position
    details.alpha_composite(sample, (left + (600 - sample.width) // 2, top + 80))
    text(detail_draw, (left + 25, top + 23), title, 25, '#413b30')

sheet.convert('RGB').save(destination / 'ritual-studies-preview.jpg', quality=95)
details.convert('RGB').save(destination / 'material-details.jpg', quality=96)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
print('Created ritual overview, structural details and three-background proof')
