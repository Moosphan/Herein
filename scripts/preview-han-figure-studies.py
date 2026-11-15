import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/han-figures'
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


sheet = Image.new('RGBA', (2500, 900), '#dfc69c')
draw = ImageDraw.Draw(sheet)
text(draw, (45, 24), '楚汉风骨 · 秦末与西汉五人像', 43, '#413b30')
text(draw, (48, 90), '参考史料与出土形制 / 原创代码彩墨 / 非可证实的本人肖像', 23, '#816749')
proof = Image.new('RGBA', (1440, 1500), '#dfc69c')
faces = Image.new('RGBA', (2500, 830), '#dfc69c')
face_draw = ImageDraw.Draw(faces)
text(face_draw, (40, 20), '五官与人物差异 · 同尺度放大', 35, '#413b30')
details = Image.new('RGBA', (2100, 1300), '#dfc69c')
detail_draw = ImageDraw.Draw(details)
artworks = []
face_crops = [(629, 207, 858, 475), (712, 207, 899, 536), (714, 202, 900, 466), (727, 200, 906, 480), (729, 202, 916, 464)]
subtitles = ['沉雄 · 札甲 · 骏马', '隆准 · 美髯 · 长冠', '清秀 · 读简 · 从容', '长臂 · 持弓 · 风霜', '素甲 · 筹策 · 审势']
for index, asset in enumerate(assets):
    artwork = Image.open(destination / 'ink-wash' / asset['png']).convert('RGBA')
    artworks.append(artwork)
    sample = fit(artwork.crop(artwork.getbbox()), (465, 580))
    sheet.alpha_composite(sample, (index * 500 + (500 - sample.width) // 2, 160 + (580 - sample.height) // 2))
    text(draw, (index * 500 + 28, 769), asset['name'], 34, '#413b30')
    text(draw, (index * 500 + 28, 828), subtitles[index], 22, '#816749')
    warm = Image.new('RGBA', artwork.size, '#dfc69c')
    warm.alpha_composite(artwork)
    warm.convert('RGB').save(destination / (asset['id'] + '-paper.jpg'), quality=96)
    for column, color in enumerate(['#dfc69c', '#faf9f4', '#393c40']):
        cell = Image.new('RGBA', (480, 300), color)
        cell.alpha_composite(artwork.resize(cell.size, Image.Resampling.LANCZOS))
        proof.alpha_composite(cell, (column * 480, index * 300))
    sample = fit(artwork.crop(face_crops[index]), (445, 638))
    faces.alpha_composite(sample, (index * 500 + (500 - sample.width) // 2, 97))
    text(face_draw, (index * 500 + 32, 753), asset['name'], 27, '#413b30')

for index, crop, position, title in [
    (0, (1091, 212, 1290, 580), (0, 0), '骏马 / 头颈、鬃缰与衔接'),
    (0, (556, 479, 1030, 799), (700, 0), '项羽 / 札甲、握缰与袖口'),
    (1, (723, 76, 893, 251), (1400, 0), '刘邦 / 简化长冠，无冕旒'),
    (2, (789, 630, 981, 770), (0, 650), '张良 / 简册与托握'),
    (3, (530, 400, 722, 887), (700, 650), '李广 / 弓弦、弓把与手掌'),
    (4, (796, 585, 1055, 965), (1400, 650), '韩信 / 简册与直剑鞘'),
]:
    sample = fit(artworks[index].crop(crop), (640, 535))
    left, top = position
    details.alpha_composite(sample, (left + (700 - sample.width) // 2, top + 80))
    text(detail_draw, (left + 20, top + 22), title, 25, '#413b30')

sheet.convert('RGB').save(destination / 'han-figures-preview.jpg', quality=96)
faces.convert('RGB').save(destination / 'face-studies.jpg', quality=97)
details.convert('RGB').save(destination / 'portrait-details.jpg', quality=96)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=95)
print('Created Qin-Han portraits, five-face comparison, prop details and background proof')
