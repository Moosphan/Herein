import hashlib
import json
from pathlib import Path

from PIL import Image, features


root = Path(__file__).resolve().parent.parent
source = root / 'resources/visuals/traditional-culture'
destination = source / 'gallery'
media = destination / 'media'
catalog_path = root / 'docs/design-system/v2/culture-gallery/catalog.json'
media.mkdir(parents=True, exist_ok=True)
catalog_path.parent.mkdir(parents=True, exist_ok=True)
if not features.check('webp'):
    raise RuntimeError('Pillow WebP support is required')

categories = [
    ('latest', '精选总览'),
    ('new', '本次新作'),
    ('ink', '山水与古建'),
    ('color', '彩墨与器物'),
    ('figures', '人物与生灵'),
    ('line', '线描元素'),
    ('layouts', '排版示例'),
    ('history', '历史稿'),
    ('proofs', '预览与细节'),
]
assets = []


def add(identity, name, note, category, filename, svg=None, collection='', latest=False, recent=False):
    original = source / filename
    if not original.is_file():
        raise FileNotFoundError(original)
    digest = hashlib.sha256(original.read_bytes() + b'webp-v2-method3').hexdigest()[:12]
    image = Image.open(original).convert('RGBA')
    previews = {}
    for kind, maximum, quality in [('thumb', 640, 85), ('detail', 1600, 92)]:
        name_on_disk = f'{identity}-{digest}-{kind}.webp'
        target = media / name_on_disk
        sample = image.copy()
        sample.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
        if not target.is_file():
            temporary = target.with_suffix('.pending')
            sample.save(temporary, 'WEBP', quality=quality, method=3)
            temporary.replace(target)
        previews[kind] = f'./media/{name_on_disk}'
        previews[kind + 'Bytes'] = target.stat().st_size
    assets.append({
        'id': identity,
        'name': name,
        'note': note,
        'category': category,
        'collection': collection,
        'latest': latest,
        'recent': recent,
        'width': image.width,
        'height': image.height,
        'original': '../' + filename,
        'svg': '../' + svg if svg else None,
        'transparent': image.getextrema()[3][0] < 255,
        'originalBytes': original.stat().st_size,
        **previews,
    })


statesmen_directory = 'han-statesmen/ink-wash'
statesmen_catalog = json.loads((source / statesmen_directory / 'catalog.json').read_text())
for asset in statesmen_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{statesmen_directory}/{asset['png']}", f"{statesmen_directory}/{asset['svg']}",
        asset['theme'], latest=True, recent=True)

han_directory = 'han-figures/ink-wash'
han_catalog = json.loads((source / han_directory / 'catalog.json').read_text())
for asset in han_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{han_directory}/{asset['png']}", f"{han_directory}/{asset['svg']}",
        asset['theme'], latest=True)

spring_directory = 'spring-studies/ink-wash'
spring_catalog = json.loads((source / spring_directory / 'catalog.json').read_text())
for asset in spring_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{spring_directory}/{asset['png']}", f"{spring_directory}/{asset['svg']}",
        asset['theme'], latest=True)

creek_directory = 'creek-studies/ink-wash'
creek_catalog = json.loads((source / creek_directory / 'catalog.json').read_text())
for asset in creek_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{creek_directory}/{asset['png']}", f"{creek_directory}/{asset['svg']}",
        asset['theme'], latest=True)

ritual_directory = 'ritual-studies/ink-wash'
ritual_catalog = json.loads((source / ritual_directory / 'catalog.json').read_text())
for asset in ritual_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{ritual_directory}/{asset['png']}", f"{ritual_directory}/{asset['svg']}",
        asset['theme'], latest=True)

travel_directory = 'travel-studies/ink-wash'
travel_catalog = json.loads((source / travel_directory / 'catalog.json').read_text())
for asset in travel_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{travel_directory}/{asset['png']}", f"{travel_directory}/{asset['svg']}",
        asset['theme'], latest=True)

autumn_directory = 'autumn-studies/ink-wash'
autumn_catalog = json.loads((source / autumn_directory / 'catalog.json').read_text())
for asset in autumn_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{autumn_directory}/{asset['png']}", f"{autumn_directory}/{asset['svg']}",
        asset['theme'], latest=True)

pastoral_directory = 'pastoral-studies/ink-wash'
pastoral_catalog = json.loads((source / pastoral_directory / 'catalog.json').read_text())
for asset in pastoral_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{pastoral_directory}/{asset['png']}", f"{pastoral_directory}/{asset['svg']}",
        asset['theme'], latest=True)

literati_directory = 'literati-studies/ink-wash'
literati_catalog = json.loads((source / literati_directory / 'catalog.json').read_text())
for asset in literati_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{literati_directory}/{asset['png']}", f"{literati_directory}/{asset['svg']}",
        asset['theme'], latest=True)

garden_directory = 'garden-studies/ink-wash'
garden_catalog = json.loads((source / garden_directory / 'catalog.json').read_text())
for asset in garden_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{garden_directory}/{asset['png']}", f"{garden_directory}/{asset['svg']}",
        asset['theme'], latest=True)

courtyard_directory = 'courtyard-studies/ink-wash'
courtyard_catalog = json.loads((source / courtyard_directory / 'catalog.json').read_text())
for asset in courtyard_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{courtyard_directory}/{asset['png']}", f"{courtyard_directory}/{asset['svg']}",
        asset['theme'], latest=True)

civilization_directory = 'civilization-studies/ink-wash'
civilization_catalog = json.loads((source / civilization_directory / 'catalog.json').read_text())
for asset in civilization_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{civilization_directory}/{asset['png']}", f"{civilization_directory}/{asset['svg']}",
        asset['theme'], latest=True)

seasonal_directory = 'seasonal-studies/ink-wash'
seasonal_catalog = json.loads((source / seasonal_directory / 'catalog.json').read_text())
for asset in seasonal_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{seasonal_directory}/{asset['png']}", f"{seasonal_directory}/{asset['svg']}",
        asset['theme'], latest=True)

heritage_directory = 'heritage-studies/ink-wash'
heritage_catalog = json.loads((source / heritage_directory / 'catalog.json').read_text())
for asset in heritage_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{heritage_directory}/{asset['png']}", f"{heritage_directory}/{asset['svg']}",
        asset['theme'], latest=True)

historical_directory = 'historical-studies/ink-wash'
historical_catalog = json.loads((source / historical_directory / 'catalog.json').read_text())
expanded_directory = 'expanded-studies/ink-wash'
expanded_catalog = json.loads((source / expanded_directory / 'catalog.json').read_text())
for asset in expanded_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{expanded_directory}/{asset['png']}", f"{expanded_directory}/{asset['svg']}",
        asset['theme'], latest=True)

for asset in historical_catalog['assets']:
    add(asset['id'], asset['name'], asset['note'], asset['category'],
        f"{historical_directory}/{asset['png']}", f"{historical_directory}/{asset['svg']}",
        asset['theme'], latest=True)

for directory, category, title, latest in [
    ('ink-wash', 'ink', '水墨九景', True),
    ('colored-studies/ink-wash', 'color', '彩墨四景', True),
    ('figure-studies-v3/ink-wash', 'figures', '写意第三稿 · 当前版本', True),
    ('figure-studies-v2/ink-wash', 'history', '人物第二稿', False),
    ('figure-studies/ink-wash', 'history', '人物第一稿', False),
]:
    catalog = json.loads((source / directory / 'catalog.json').read_text())
    for asset in catalog['assets']:
        add(asset['id'], asset['name'], asset['note'], category,
            f"{directory}/{asset['png']}", f"{directory}/{asset['svg']}", title, latest)

line_catalog = json.loads((source / 'catalog.json').read_text())
for asset in line_catalog['assets']:
    for palette, filename in asset['files'].items():
        add(f"line-{palette}-{asset['id']}", asset['name'], asset['summary'], 'line',
            str(Path(filename).with_suffix('.png')), filename, line_catalog['palettes'][palette]['name'])

for identity, title in [
    ('cover', '山河卷首'), ('temple-study', '寺院解读'),
    ('palace-chapter', '宫阙章节'), ('garden-quote', '园林引文'),
]:
    add(f'layout-{identity}', title, '早期线描元素排版示例，可查看原始页面。', 'layouts',
        f'demo/{identity}-preview.png', collection='排版示例')
    assets[-1]['page'] = f'../demo/{identity}.html'

preview_names = {
    'background-proof': '三种底色对照',
    'portrait-details': '人物、动作与结构细节',
    'huo-qubing-face-study': '霍去病 · 面部修订细节',
    'figure-studies-preview': '三作拼图',
    'four-studies-preview': '彩墨四景拼图',
    'historical-studies-preview': '历史题材八景拼图',
    'expanded-studies-preview': '百物与生机十二景拼图',
    'heritage-studies-preview': '文脉与秋声十二景拼图',
    'seasonal-studies-preview': '四时与人间十二景拼图',
    'civilization-studies-preview': '百工与春华十二景拼图',
    'courtyard-studies-preview': '庭院与风物十二景拼图',
    'garden-studies-preview': '花庭与清供十二景拼图',
    'literati-studies-preview': '烟溪与雅物十二景拼图',
    'travel-studies-preview': '清庭与行藏十二景拼图',
    'ritual-studies-preview': '秋庭与礼乐十二景拼图',
    'creek-studies-preview': '溪园与百工十二景拼图',
    'spring-studies-preview': '春汀与清赏十二景拼图',
    'han-figures-preview': '楚汉风骨 · 秦末与西汉五人像',
    'han-statesmen-preview': '汉家群像 · 文武与著史五人像',
    'face-studies': '五官与人物差异 · 同尺度放大',
    'portrait-details': '衣冠、马具、弓矢与简册细节',
    'wooden-fish-refined-preview': '木鱼静声 · 实物结构重绘',
    'flower-lions-tabby-preview': '荷包牡丹、石狮与狸花 · 重画预览',
    'stone-lions-refined-preview': '石狮守庭 · 雕兽结构修订',
    'autumn-studies-preview': '花木与雅器十二景拼图',
    'pastoral-studies-preview': '桑野与物华十二景拼图',
    'material-details': '材质、透孔与构件细节',
    'contact-sheet': '联系图',
}
for directory, title in [
    ('han-statesmen', '汉家群像 · 文武与著史'),
    ('han-figures', '楚汉风骨 · 秦末与西汉五人像'),
    ('spring-studies', '春汀与清赏十二景'),
    ('creek-studies', '溪园与百工十二景'),
    ('ritual-studies', '秋庭与礼乐十二景'),
    ('travel-studies', '清庭与行藏十二景'),
    ('autumn-studies', '花木与雅器十二景'),
    ('pastoral-studies', '桑野与物华十二景'),
    ('literati-studies', '烟溪与雅物十二景'),
    ('garden-studies', '花庭与清供十二景'),
    ('courtyard-studies', '庭院与风物十二景'),
    ('civilization-studies', '百工与春华十二景'),
    ('seasonal-studies', '四时与人间十二景'),
    ('heritage-studies', '文脉与秋声十二景'),
    ('expanded-studies', '百物与生机十二景'),
    ('historical-studies', '历史题材八景'),
    ('colored-studies', '彩墨四景'),
    ('figure-studies-v3', '人物第三稿 · 当前版本'),
    ('figure-studies-v2', '人物第二稿'),
    ('figure-studies', '人物第一稿'),
]:
    for original in sorted((source / directory).glob('*')):
        if original.suffix not in ('.jpg', '.png'):
            continue
        caption = preview_names.get(original.stem)
        if caption is None:
            matched = next((asset['name'] for asset in assets if original.stem == asset['id'] + '-paper'), None)
            caption = f'{matched} · 纸底预览' if matched else original.stem
        add(f'{directory}-{original.stem}', caption, '展示图含纸底；透明素材请在对应作品分类中下载。',
            'proofs', original.relative_to(source).as_posix(), collection=title)

manifest = {
    'categories': [{'id': identity, 'name': name} for identity, name in categories],
    'assets': assets,
    'totals': {key: sum(asset[key] for asset in assets) for key in ('originalBytes', 'thumbBytes', 'detailBytes')},
}
referenced = {Path(asset[kind]).name for asset in assets for kind in ('thumb', 'detail')}
for generated in media.glob('*.webp'):
    if generated.name not in referenced:
        generated.unlink()
catalog_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(destination / 'image-report.json').write_text(json.dumps(manifest['totals'], indent=2) + '\n')
print(f"Prepared {len(assets)} artworks and previews: {manifest['totals']}")
