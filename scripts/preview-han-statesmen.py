import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/han-statesmen'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']


def text(draw, position, content, size, fill='#413b30'):
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Songti.ttc', size)
    draw.text(position, content, font=font, fill=fill)


def fit(image, bounds):
    ratio = min(bounds[0] / image.width, bounds[1] / image.height)
    return image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)


sheet = Image.new('RGBA', (2500, 950), '#dfc69c')
draw = ImageDraw.Draw(sheet)
text(draw, (40, 20), '汉家群像 · 文武与著史', 43)
text(draw, (43, 86), '原创代码彩墨 / 史事与出土形制参考 / 面貌服色为艺术推演', 24, '#816749')
faces = Image.new('RGBA', (2500, 830), '#dfc69c')
face_draw = ImageDraw.Draw(faces)
text(face_draw, (40, 20), '五官与神态 · 文臣、武臣与史家', 36)
proof = Image.new('RGBA', (1440, 1500), '#dfc69c')
details = Image.new('RGBA', (2100, 1300), '#dfc69c')
detail_draw = ImageDraw.Draw(details)
artworks = []
face_crops = [(699, 170, 879, 442), (731, 174, 906, 401), (715, 215, 930, 434), (741, 175, 930, 423), (633, 252, 812, 475)]
subtitles = ['侧坐掌籍 · 熟褐麻衣', '长身敛袖 · 青碧金赭', '厚颈方颌 · 陶赭暗绛', '戴胄转身 · 苔灰铁甲', '侧脸伏案 · 麦赭灰蓝']
for index, asset in enumerate(assets):
    artwork = Image.open(destination / 'ink-wash' / asset['png']).convert('RGBA')
    artworks.append(artwork)
    sample = fit(artwork.crop(artwork.getbbox()), (465, 625))
    sheet.alpha_composite(sample, (index * 500 + (500 - sample.width) // 2, 149 + (625 - sample.height) // 2))
    text(draw, (index * 500 + 30, 800), asset['name'], 34)
    text(draw, (index * 500 + 30, 867), subtitles[index], 23, '#816749')
    warm = Image.new('RGBA', artwork.size, '#dfc69c')
    warm.alpha_composite(artwork)
    warm.convert('RGB').save(destination / (asset['id'] + '-paper.jpg'), quality=96)
    for column, color in enumerate(['#dfc69c', '#faf9f4', '#393c40']):
        cell = Image.new('RGBA', (480, 300), color)
        cell.alpha_composite(artwork.resize(cell.size, Image.Resampling.LANCZOS))
        proof.alpha_composite(cell, (column * 480, index * 300))
    sample = fit(artwork.crop(face_crops[index]), (445, 630))
    faces.alpha_composite(sample, (index * 500 + (500 - sample.width) // 2, 100))
    text(face_draw, (index * 500 + 30, 753), asset['name'], 28)

for index, crop, position, title in [
    (0, (735, 540, 981, 748), (0, 0), '萧何 / 图籍与承托'),
    (1, (715, 554, 998, 654), (700, 0), '陈平 / 收袖议事'),
    (2, (971, 628, 1050, 716), (1400, 0), '周勃 / 扶剑与承挂'),
    (3, (650, 468, 965, 787), (0, 650), '卫青 / 札甲与军令简'),
    (4, (840, 559, 900, 756), (700, 650), '司马迁 / 执笔与落点'),
    (4, (502, 673, 1178, 935), (1400, 650), '司马迁 / 低案与编简'),
]:
    sample = fit(artworks[index].crop(crop), (640, 535))
    left, top = position
    details.alpha_composite(sample, (left + (700 - sample.width) // 2, top + 80))
    text(detail_draw, (left + 20, top + 22), title, 25)

sheet.convert('RGB').save(destination / 'han-statesmen-preview.jpg', quality=96)
faces.convert('RGB').save(destination / 'face-studies.jpg', quality=97)
details.convert('RGB').save(destination / 'portrait-details.jpg', quality=96)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=95)
print('Created five works, face comparison, six prop details and three-background proof')

# Compare against the existing sitters, not just against this batch.
comparison = Image.new('RGBA', (2500, 1700), '#dfc69c')
comparison_draw = ImageDraw.Draw(comparison)
text(comparison_draw, (35, 12), '跨批次检查 · 上排旧作保留 / 下排五人重画', 36)
old_directory = destination.parent / 'han-figures/ink-wash'
old_assets = json.loads((old_directory / 'catalog.json').read_text())['assets']
old_face_crops = [(629, 207, 858, 475), (712, 207, 899, 536), (714, 202, 900, 466), (727, 200, 906, 480), (729, 202, 916, 464)]
for row, (directory, collection, crops) in enumerate([
    (old_directory, old_assets, old_face_crops),
    (destination / 'ink-wash', assets, face_crops),
]):
    for index, (asset, crop) in enumerate(zip(collection, crops)):
        source = Image.open(directory / asset['png']).convert('RGBA')
        sample = fit(source.crop(crop), (350, 390))
        x, y = index * 500, row * 800 + 85
        comparison.alpha_composite(sample, (x + (500 - sample.width) // 2, y))
        sample = fit(source.crop(source.getbbox()), (330, 280))
        comparison.alpha_composite(sample, (x + (500 - sample.width) // 2, y + 400))
        text(comparison_draw, (x + 35, y + 698), asset['name'], 27)
output = root / '.scratch/statesmen-cross-batch.jpg'
output.parent.mkdir(exist_ok=True)
comparison.convert('RGB').save(output, quality=96)
print('Created cross-batch comparison against Xiang Yu, Liu Bang, Zhang Liang, Li Guang and Han Xin')
