import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/figure-studies'
assets = json.loads((destination / 'ink-wash/catalog.json').read_text())['assets']
font_path = Path('/System/Library/Fonts/Supplemental/Songti.ttc')


def font(size):
    if font_path.exists():
        return ImageFont.truetype(str(font_path), size)
    return ImageFont.load_default(size=size)


sheet = Image.new('RGBA', (2100, 880), '#dfc69c')
draw = ImageDraw.Draw(sheet)
draw.text((48, 31), '衣冠与骏骨 · 彩墨人物试绘', font=font(40), fill='#493e32')
draw.text((50, 92), '汉武帝 / 霍去病 / 赤兔马    ·    原创意象，非考据复原', font=font(21), fill='#856b50')
draw.line((48, 137, 2052, 137), fill='#b59a74')
crops = [(445, 140, 1225, 935), (190, 45, 1415, 960), (238, 170, 1312, 930)]
proof = Image.new('RGBA', (1500, 936), '#dfc69c')

for index, (asset, crop) in enumerate(zip(assets, crops)):
    artwork = Image.open(destination / 'ink-wash' / asset['png']).convert('RGBA')
    warm = Image.new('RGBA', artwork.size, '#dfc69c')
    warm.alpha_composite(artwork)
    warm.convert('RGB').save(destination / (asset['id'] + '-paper.jpg'), quality=95)
    cropped = artwork.crop(crop)
    cropped.thumbnail((654, 614), Image.Resampling.LANCZOS)
    left = index * 700 + 23 + (654 - cropped.width) // 2
    top = 148 + (614 - cropped.height) // 2
    sheet.alpha_composite(cropped, (left, top))
    draw.text((index * 700 + 48, 771), asset['name'], font=font(30), fill='#493e32')
    draw.text((index * 700 + 48, 821), asset['note'], font=font(18), fill='#856b50')
    for column, color in enumerate(['#dfc69c', '#faf9f4', '#393c40']):
        sample = Image.new('RGBA', (500, 312), color)
        sample.alpha_composite(artwork.resize(sample.size, Image.Resampling.LANCZOS))
        proof.alpha_composite(sample, (column * 500, index * 312))

sheet.convert('RGB').save(destination / 'figure-studies-preview.jpg', quality=95)
proof.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
print('Created figure preview, three paper studies and background proof')
