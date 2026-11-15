import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parent.parent
destination = root / 'resources/visuals/traditional-culture/colored-studies'
catalog = json.loads((destination / 'ink-wash/catalog.json').read_text())
font_candidates = [
    Path('/System/Library/Fonts/Supplemental/Songti.ttc'),
    Path('/System/Library/Fonts/PingFang.ttc'),
]
font_path = next((candidate for candidate in font_candidates if candidate.exists()), None)


def font(size):
    if font_path:
        return ImageFont.truetype(str(font_path), size)
    return ImageFont.load_default(size=size)


paper = Image.new('RGBA', (1800, 1400), '#e1c9a2')
texture = Image.effect_noise(paper.size, 11).convert('L')
texture.putalpha(11)
paper = Image.alpha_composite(paper, texture.convert('RGBA'))
drawing = ImageDraw.Draw(paper)
drawing.text((56, 37), '随物赋彩 · 彩墨四景', font=font(42), fill='#4d4032')
drawing.text((59, 99), '以笔墨与留白定调，按物体与场景设色', font=font(21), fill='#806b54')
drawing.line((56, 144, 1744, 144), fill='#bea27d', width=1)

backgrounds = Image.new('RGBA', (1500, len(catalog['assets']) * 312), '#e1c9a2')
background_draw = ImageDraw.Draw(backgrounds)

for index, asset in enumerate(catalog['assets']):
    artwork = Image.open(destination / 'ink-wash' / asset['png']).convert('RGBA')
    thumbnail = artwork.resize((850, 531), Image.Resampling.LANCZOS)
    left = 25 + index % 2 * 900
    top = 148 + index // 2 * 604
    paper.alpha_composite(thumbnail, (left, top))
    drawing.text((left + 35, top + 516), asset['name'], font=font(29), fill='#4d4032')
    drawing.text((left + 35, top + 560), asset['note'], font=font(18), fill='#806b54')
    for column, color in enumerate(['#e1c9a2', '#faf9f4', '#393c40']):
        proof = Image.new('RGBA', (500, 312), color)
        proof.alpha_composite(artwork.resize(proof.size, Image.Resampling.LANCZOS))
        backgrounds.alpha_composite(proof, (column * 500, index * 312))
    background_draw.text((12, index * 312 + 12), asset['name'], font=font(18), fill='#69533e')

paper.convert('RGB').save(destination / 'four-studies-preview.jpg', quality=95)
backgrounds.convert('RGB').save(destination / 'background-proof.jpg', quality=94)
print('Created four-studies-preview.jpg and background-proof.jpg')
