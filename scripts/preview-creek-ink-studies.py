import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/creek-studies'
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
text(draw, (35, 24), '溪园与百工 · 彩墨十二景', 40, '#413b30')
text(draw, (38, 84), '菖蒲 / 鸡冠 / 紫薇 / 斑鸠 / 刺猬 / 鸿雁 / 铜熨 / 木鱼 / 铜锣 / 辘轳 / 草仓 / 照壁', 23, '#816749')
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
    (3, (592, 463, 884, 784), (0, 0), '斑鸠 / 颈斑、折翼与扣枝'),
    (4, (450, 493, 1010, 818), (600, 0), '刺猬 / 尖吻、背刺与短足'),
    (6, (529, 355, 1241, 720), (1200, 0), '铜熨 / 盘壁、炭与长柄'),
    (7, (420, 225, 1115, 790), (0, 600), '木鱼 / 梨形腹、斜音口与浅雕'),
    (9, (492, 310, 1075, 909), (600, 600), '辘轳 / 支柱、卷筒与井口'),
    (10, (496, 236, 1110, 885), (1200, 600), '草仓 / 草顶、束箍与支承'),
]:
    sample = fit(artworks[index].crop(crop), (540, 480))
    left, top = position
    details.alpha_composite(sample, (left + (600 - sample.width) // 2, top + 80))
    text(detail_draw, (left + 25, top + 23), title, 25, '#413b30')

sheet.convert('RGB').save(destination / 'creek-studies-preview.jpg', quality=95)
details.convert('RGB').save(destination / 'material-details.jpg', quality=96)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
fish_preview = Image.new('RGBA', (1280, 960), '#dfc69c')
fish_draw = ImageDraw.Draw(fish_preview)
text(fish_draw, (48, 30), '木鱼静声 · 实物结构重绘', 38, '#413b30')
text(fish_draw, (50, 86), '圆钝梨形腹 / 斜向长音口 / 前缘浅雕鱼纹', 22, '#816749')
fish_sample = fit(artworks[7].crop(artworks[7].getbbox()), (1150, 725))
fish_preview.alpha_composite(fish_sample, ((1280 - fish_sample.width) // 2, 175 + (725 - fish_sample.height) // 2))
fish_preview.convert('RGB').save(destination / 'wooden-fish-refined-preview.jpg', quality=96)
print('Created creek overview, structural details and three-background proof')
