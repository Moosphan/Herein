import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/han-figures/ink-wash',
)
const ink = '#292d2b'
const repeat = (count, draw) => Array.from({ length: count }, (_, index) => draw(index)).join('')
const path = (shape, color = ink, opacity = 1, treatment = '') =>
  `<path d="${shape}" fill="${color}" opacity="${opacity}" ${treatment}/>`
const line = (shape, color = ink, width = 2, opacity = 1) =>
  `<path d="${shape}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1) =>
  `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${color}" opacity="${opacity}"/>`
const group = (identity, content, transformation = '') =>
  `<g id="${identity}" ${transformation ? `transform="${transformation}"` : ''}>${content}</g>`
const move = (content, transformation) => `<g transform="${transformation}">${content}</g>`
const grain = 'filter="url(#pigment)"'
const definitions = `<defs>
<filter id="pigment" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".029 .12" numOctaves="2" seed="117" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .12 .12 .12 0 .80" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="paint"/><feDisplacementMap in="paint" in2="noise" scale="1.7" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="dry" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".23 .42" numOctaves="2" seed="83" result="fibers"/><feColorMatrix in="fibers" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 0 -.27" result="alpha"/><feComposite in="SourceGraphic" in2="alpha" operator="in"/></filter>
${[
  ['iron', '#60645e', '#424b47', '#2d3735'],
  ['blue-iron', '#697679', '#4a5d61', '#34464b'],
  ['umber-iron', '#7c796a', '#575d51', '#3e483f'],
  ['black-silk', '#41483e', '#2b302c', '#1e2423'],
  ['red-cloth', '#985344', '#793d35', '#4b302b'],
  ['linen', '#b4c0ad', '#879d8e', '#546e67'],
  ['pale-silk', '#e3d7b9', '#c7ba99', '#9d9d82'],
  ['brown-cloth', '#97815f', '#70634d', '#4a5142'],
  ['wood', '#bc9b68', '#8e704a', '#5c4d37'],
  ['horn', '#a88c5c', '#786044', '#453e33'],
]
  .map(
    ([identity, start, middle, end]) =>
      `<linearGradient id="${identity}" x1="10%" y1="0%" x2="85%" y2="100%"><stop stop-color="${start}"/><stop offset=".54" stop-color="${middle}"/><stop offset="1" stop-color="${end}"/></linearGradient>`,
  )
  .join('')}
<radialGradient id="skin" cx="39%" cy="33%" r="74%"><stop stop-color="#dfc49e"/><stop offset=".55" stop-color="#d0ae85"/><stop offset="1" stop-color="#ad8962"/></radialGradient>
<radialGradient id="fair-skin" cx="38%" cy="33%" r="77%"><stop stop-color="#e6cfaa"/><stop offset=".62" stop-color="#d9bf9a"/><stop offset="1" stop-color="#b39874"/></radialGradient>
<radialGradient id="weathered-skin" cx="37%" cy="31%" r="78%"><stop stop-color="#c9a47c"/><stop offset=".6" stop-color="#b89268"/><stop offset="1" stop-color="#937650"/></radialGradient>
<radialGradient id="cheek-wash"><stop stop-color="#977153" stop-opacity=".27"/><stop offset="1" stop-color="#977153" stop-opacity="0"/></radialGradient>
<radialGradient id="horse-coat" cx="27%" cy="26%" r="83%"><stop stop-color="#77796b"/><stop offset=".45" stop-color="#575e54"/><stop offset="1" stop-color="#343e3a"/></radialGradient>
</defs>`

function brush(points, width, color = ink, opacity = 1, dry = false) {
  const curve = (fraction) =>
    [0, 1].map(
      (axis) =>
        (1 - fraction) ** 3 * points[0][axis] +
        3 * (1 - fraction) ** 2 * fraction * points[1][axis] +
        3 * (1 - fraction) * fraction ** 2 * points[2][axis] +
        fraction ** 3 * points[3][axis],
    )
  const left = []
  const right = []
  for (let step = 0; step <= 34; step++) {
    const fraction = step / 34
    const point = curve(fraction)
    const before = curve(Math.max(0, fraction - 0.002))
    const after = curve(Math.min(1, fraction + 0.002))
    const length = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
    const normal = [-(after[1] - before[1]) / length, (after[0] - before[0]) / length]
    const pressure =
      (width * (0.33 + 0.67 * Math.sin(Math.PI * fraction)) * (1 - 0.88 * fraction)) / 2
    left.push(point.map((value, axis) => +(value + pressure * normal[axis]).toFixed(2)))
    right.unshift(point.map((value, axis) => +(value - pressure * normal[axis]).toFixed(2)))
  }
  return path(
    'M' + [...left, ...right].map((point) => point.join(' ')).join('L') + 'Z',
    color,
    opacity,
    dry ? 'filter="url(#dry)"' : '',
  )
}

function clothLines(lines, color, breadth = 6, opacity = 0.64) {
  return lines
    .map((points, index) => brush(points, breadth + (index % 3), color, opacity, index % 3 !== 0))
    .join('')
}

function eye(shape, upper, lower, pupilX, pupilY, width = 4.1, age = false) {
  return (
    path(shape, '#ddd2b6', 0.9) +
    ellipse(pupilX, pupilY, 4.2, 5.2, '#34372d') +
    line(upper, ink, width) +
    line(lower, '#8b7458', 1.2, 0.76) +
    (age ? line(upper, '#4d4d3e', 1.3, 0.42) : '')
  )
}

function beardStrands(left, top, width, length, count, gray = false) {
  return repeat(count, (index) => {
    const fraction = index / (count - 1)
    const horizontal = left + width * fraction
    const vertical = top + Math.sin(fraction * Math.PI) * 13
    return brush(
      [
        [horizontal, vertical],
        [horizontal - 4, vertical + length * 0.3],
        [left + width * 0.55 + (fraction - 0.5) * width * 0.55, top + length * 0.8],
        [
          left + width * 0.52 + (fraction - 0.5) * width * 0.26,
          top + length + Math.sin(index * 2.1) * 9,
        ],
      ],
      1 + (index % 3) * 0.55,
      gray && index % 4 === 0 ? '#b4b39a' : index % 5 ? '#30362f' : '#7d8068',
      0.75,
      true,
    )
  })
}

function xiangHead() {
  let content = path(
    'M47 37Q88 7 143 28Q183 44 191 94L193 135Q205 158 193 176L187 204Q171 239 141 252L102 256Q65 242 46 217L32 179Q17 176 16 152Q16 136 31 136L35 91Q28 58 47 37Z',
    'url(#skin)',
  )
  content += path('M35 92L54 69L55 134Q45 176 62 206L83 233Q51 224 40 193L29 159Z', '#907153', 0.24)
  content += ellipse(163, 167, 37, 62, 'url(#cheek-wash)')
  content += line('M28 147Q38 143 38 158L30 168', '#8b6b4c', 2)
  content +=
    path('M55 103Q81 91 111 102L116 110Q83 101 56 111Z') +
    path('M145 103Q167 95 185 104L186 112Q166 105 147 111Z')
  content += eye(
    'M59 119Q83 110 107 119Q86 130 62 124Z',
    'M59 119Q82 109 107 119',
    'M63 125Q84 131 105 122',
    90,
    119,
    3.6,
  )
  content += eye(
    'M150 120Q168 113 185 120Q172 129 152 124Z',
    'M150 120Q168 112 185 120',
    'M153 125Q171 129 184 122',
    174,
    120,
    3.2,
  )
  content += path(
    'M130 117Q127 142 118 163Q116 174 132 179L150 175L153 166L142 161L141 128Z',
    '#a4815c',
    0.32,
  )
  content += line(
    'M131 123Q128 145 123 162Q119 172 134 174M145 163Q154 167 149 174',
    '#775c41',
    1.9,
    0.86,
  )
  content += line('M123 178Q133 182 143 178', '#9b7959', 1.2, 0.74)
  content += path(
    'M88 191Q108 180 130 188Q151 181 169 190L173 199Q153 194 135 198L128 195L116 199Q101 193 83 200Z',
  )
  content +=
    line('M111 206Q134 210 156 204', '#6e5140', 2.1, 0.86) +
    line('M117 213Q135 218 149 211', '#af8565', 2, 0.7)
  content += path(
    'M52 196Q68 222 85 223Q115 239 154 225L183 204Q178 245 145 272L108 277Q69 257 52 226Z',
    '#343a33',
    0.96,
  )
  content += beardStrands(59, 214, 119, 69, 29)
  content += path(
    'M33 144L23 112Q11 65 36 31Q65 2 121 5Q183 4 195 53L193 99L180 90Q177 57 153 47Q107 57 79 37Q46 57 47 102L46 148Z',
    ink,
    1,
    grain,
  )
  content +=
    path('M78 12Q61 -31 91 -55Q129 -72 145 -43Q155 -15 136 12Z', '#2c332e', 1, grain) +
    path('M75 -1L141 -6L142 11L80 18Z', '#774c3a')
  content += clothLines(
    [
      [
        [38, 75],
        [49, 49],
        [64, 41],
        [86, 30],
      ],
      [
        [105, 17],
        [135, 19],
        [168, 30],
        [181, 55],
      ],
      [
        [86, -40],
        [75, -22],
        [91, -6],
        [108, 3],
      ],
    ],
    '#7f8270',
    4,
    0.7,
  )
  content += line('M73 84Q93 80 108 84', '#af8a62', 1.3, 0.45)
  return group('xiang-yu-head', content, 'translate(561 175) scale(1.12)')
}

function liuHead() {
  let content = path(
    'M51 30Q105 7 157 34Q180 49 181 85L184 124L198 155L192 169L192 193Q177 229 153 253L116 274Q89 267 69 247L48 214L37 177Q18 175 17 150Q15 134 32 132L38 86Q32 50 51 30Z',
    'url(#skin)',
  )
  content += path(
    'M45 64L58 55L60 145Q57 186 77 218L104 253L115 270L89 259L62 232L47 207L34 160Z',
    '#8f7151',
    0.23,
  )
  content +=
    ellipse(163, 173, 35, 64, 'url(#cheek-wash)') +
    line('M25 144Q37 140 38 155L29 166', '#886a4b', 1.7)
  content +=
    path('M65 103Q88 89 116 100L121 107L114 112Q88 100 65 112Z') +
    path('M149 105L167 99L182 104L183 111L164 108L150 113Z')
  content += eye(
    'M66 120Q90 112 114 121Q92 130 69 126Z',
    'M66 120Q90 110 114 121',
    'M70 128Q93 134 111 125',
    98,
    121,
    3.6,
    true,
  )
  content += eye(
    'M149 121Q166 114 182 121L181 127Q166 131 151 126Z',
    'M149 121Q166 113 182 121',
    'M152 128Q167 132 181 126',
    174,
    122,
    3,
    true,
  )
  content += path(
    'M134 106L139 119Q134 145 142 160L157 169L154 181L137 185L122 178L124 165L131 145Z',
    '#a07d58',
    0.3,
  )
  content += line(
    'M137 116Q133 138 138 155L153 169Q158 174 150 178L140 179M125 174Q130 169 135 176',
    '#795c40',
    2,
  )
  content += line(
    'M73 86Q96 79 121 88M76 79Q97 73 118 81M71 139Q91 147 111 138M158 141L179 137',
    '#957856',
    1.3,
    0.68,
  )
  content += path(
    'M98 199Q113 187 135 195Q153 188 173 196L180 205Q154 199 139 206L132 202Q111 208 88 207Z',
  )
  content +=
    line('M119 218Q139 221 160 216', '#76523e', 2.2) +
    line('M124 226Q142 230 156 224', '#ae8863', 1.6)
  content += path(
    'M52 204Q68 229 85 237L100 237Q133 250 169 228L188 206Q185 254 158 287L127 329L99 314Q68 284 55 252Z',
    '#343a31',
    1,
    grain,
  )
  content += beardStrands(59, 230, 119, 108, 42, true)
  content += path(
    'M35 139L27 116L26 68L39 32Q72 8 123 10L161 26L179 51L182 81L172 77Q157 51 137 48L92 55L59 45L50 87L47 151Z',
    '#2a302b',
  )
  content += clothLines(
    [
      [
        [40, 67],
        [49, 49],
        [64, 44],
        [82, 40],
      ],
      [
        [59, 229],
        [66, 251],
        [76, 272],
        [96, 289],
      ],
      [
        [158, 238],
        [159, 269],
        [141, 297],
        [124, 327],
      ],
    ],
    '#a5a58b',
    2.4,
    0.55,
  )
  return group('liu-bang-head', content, 'translate(696 158) scale(1.1)')
}

function zhangHead() {
  let content = path(
    'M47 34Q87 12 128 26Q168 38 175 78L175 122L184 149L179 165L178 190Q165 223 142 241L114 254Q84 248 65 227L44 196L35 168Q19 167 17 146Q17 132 32 132L33 86Q30 52 47 34Z',
    'url(#fair-skin)',
  )
  content += path(
    'M38 92L52 65L53 137Q45 174 60 203L85 235L108 250L88 243L63 223L45 195L30 157Z',
    '#a38d6e',
    0.18,
  )
  content +=
    ellipse(154, 169, 30, 54, 'url(#cheek-wash)') +
    line('M25 142Q34 139 35 151L28 160', '#9a7d5e', 1.5)
  content +=
    path('M54 103Q77 94 102 102L104 107Q79 100 55 108Z', '#46473a') +
    path('M132 102Q151 94 171 101L171 106Q152 101 133 108Z', '#434538')
  content += eye(
    'M56 116Q78 108 100 116Q79 125 58 121Z',
    'M56 116Q78 107 100 116',
    'M60 122Q80 127 99 119',
    75,
    116,
    2.6,
  )
  content += eye(
    'M134 115Q152 109 170 115Q153 123 135 120Z',
    'M134 115Q152 108 170 115',
    'M137 121Q153 125 168 119',
    148,
    115,
    2.5,
  )
  content += path(
    'M116 116L118 137L112 156Q109 167 122 172L136 168L133 159L124 154L125 120Z',
    '#aa8c68',
    0.22,
  )
  content += line(
    'M118 121L115 145Q109 161 116 166L125 168M129 160Q135 161 133 167',
    '#967352',
    1.5,
    0.84,
  )
  content +=
    line('M104 191Q121 187 139 191L149 190', '#876149', 1.8) +
    path('M107 193Q124 199 142 193Q124 203 109 198Z', '#b99578', 0.55)
  content += line('M92 213Q116 224 143 213', '#aa8c69', 1.2, 0.45)
  content += path(
    'M33 145L24 120L23 78Q23 30 59 10Q90 -7 130 7Q175 17 185 54L183 105L172 95Q161 58 132 41Q110 59 74 49Q43 69 45 115L45 153Z',
    ink,
    1,
    grain,
  )
  content +=
    path('M80 16Q55 -11 77 -44Q106 -64 131 -43Q146 -19 123 7Z', '#30372f', 1, grain) +
    path('M72 -3L133 -8L136 7L78 16Z', '#647261')
  content += path('M39 137L48 154L49 195L38 181Z', '#363d33')
  content += clothLines(
    [
      [
        [37, 84],
        [48, 57],
        [69, 41],
        [97, 29],
      ],
      [
        [124, 25],
        [147, 32],
        [165, 50],
        [176, 76],
      ],
      [
        [84, -38],
        [77, -20],
        [91, -7],
        [107, 0],
      ],
    ],
    '#899079',
    3,
    0.59,
  )
  return group('zhang-liang-head', content, 'translate(695 166) scale(1.06)')
}

function liHead() {
  let content = path(
    'M47 33Q90 9 137 29Q174 41 183 79L181 118L195 150L188 170L182 197Q169 227 145 241L107 254Q73 248 48 223L35 190L29 170Q14 168 14 146Q13 132 29 131L32 89Q27 55 47 33Z',
    'url(#weathered-skin)',
  )
  content += path(
    'M37 76L50 59L51 139Q40 179 56 205L83 235L106 250L78 242L51 220L34 184L24 148Z',
    '#796747',
    0.22,
  )
  content +=
    ellipse(160, 168, 32, 59, 'url(#cheek-wash)') +
    line('M21 142Q32 138 33 151L25 160', '#7e6545', 1.8)
  content +=
    path('M49 102Q70 91 102 100L106 109Q81 102 51 112Z', '#4b4e3f') +
    path('M134 103Q156 94 176 102L179 111L154 108L136 113Z', '#484e40')
  content += eye(
    'M51 121Q75 112 100 120Q76 128 53 125Z',
    'M51 121Q76 112 100 120',
    'M54 127Q79 134 98 124',
    67,
    120,
    3.1,
    true,
  )
  content += eye(
    'M135 121Q155 113 176 120Q155 128 137 125Z',
    'M135 121Q156 113 176 120',
    'M138 128Q157 133 174 124',
    150,
    120,
    3,
    true,
  )
  content += line(
    'M57 82Q81 75 105 82M57 75Q80 69 102 75M55 137Q75 146 95 138M139 140L173 136M50 119L43 115M49 127L41 129',
    '#8d7551',
    1.4,
    0.78,
  )
  content += path(
    'M119 115L125 125L119 151L126 164L142 168L139 180L118 183L109 176L113 163L117 140Z',
    '#96754f',
    0.35,
  )
  content += line(
    'M122 121L118 144L114 165Q116 174 129 174M132 167Q143 167 140 177',
    '#765b3d',
    1.8,
  )
  content += path(
    'M84 198Q105 183 124 191Q146 184 162 197L168 205Q144 199 129 205L121 202Q102 209 79 207Z',
    '#535747',
  )
  content +=
    line('M103 216Q125 218 147 211', '#77553f', 1.9) +
    line('M102 221Q124 227 146 219', '#9b7b55', 1.5)
  content += path(
    'M44 198Q59 227 82 228Q119 248 160 224L181 201Q178 238 151 263L121 286Q89 281 65 256Q46 237 44 198Z',
    '#4d5548',
    1,
    grain,
  )
  content += beardStrands(51, 223, 121, 65, 34, true)
  content += path(
    'M29 141L22 112L24 75Q23 32 59 16Q101 -2 145 17Q179 29 184 69L179 103L169 94L161 62Q135 44 111 51Q77 38 53 60L43 112L41 156Z',
    '#424b3e',
    1,
    grain,
  )
  content +=
    path('M65 22Q51 -8 72 -32Q96 -48 121 -32Q135 -7 119 16Z', '#414b3f') +
    path('M52 19L132 11L139 38L56 50Z', '#6f7057')
  content += clothLines(
    [
      [
        [38, 74],
        [48, 51],
        [61, 38],
        [82, 30],
      ],
      [
        [110, 26],
        [138, 26],
        [162, 42],
        [172, 65],
      ],
      [
        [49, 200],
        [57, 219],
        [68, 234],
        [77, 244],
      ],
      [
        [142, 226],
        [144, 247],
        [126, 266],
        [116, 279],
      ],
    ],
    '#b2b29a',
    2.8,
    0.73,
  )
  return group('li-guang-head', content, 'translate(696 173) scale(1.09)')
}

function hanHead() {
  let content = path(
    'M52 30Q91 9 136 26Q173 43 181 81L180 121L191 149L184 169L181 192Q164 222 140 242L111 255Q84 248 65 225L48 202L39 174Q22 173 20 151Q18 136 34 134L38 91Q33 53 52 30Z',
    'url(#skin)',
  )
  content += path(
    'M42 84L58 54L58 139Q52 181 70 210L91 240L110 253L89 247L67 228L47 203L31 151Z',
    '#927652',
    0.22,
  )
  content +=
    ellipse(163, 173, 28, 52, 'url(#cheek-wash)') +
    line('M27 144Q36 141 37 153L30 163', '#896d4e', 1.6)
  content +=
    path('M58 103Q81 92 108 99L112 106Q86 102 60 111Z', '#343d33') +
    path('M140 103Q159 95 178 103L179 109Q158 103 141 111Z', '#343b32')
  content += eye(
    'M61 119Q83 110 107 117Q87 128 64 124Z',
    'M61 119Q83 110 107 117',
    'M65 126Q87 132 105 122',
    79,
    118,
    3,
  )
  content += eye(
    'M141 119Q158 112 177 118Q161 127 143 124Z',
    'M141 119Q159 111 177 118',
    'M144 126Q160 130 175 123',
    154,
    119,
    2.8,
  )
  content += path(
    'M123 117L130 129L126 152L137 163L145 167L141 179L125 181L116 174L118 158Z',
    '#a48460',
    0.3,
  )
  content += line(
    'M127 121L123 147Q118 163 127 170L136 172M137 163Q147 168 141 175',
    '#836548',
    1.7,
  )
  content += path(
    'M108 194Q120 187 130 192L134 197L129 199L121 196L107 200ZM138 192Q151 188 163 195L168 200L155 199L142 198Z',
    '#505440',
    0.9,
  )
  content +=
    line('M112 211Q132 214 152 208', '#785740', 1.9) +
    line('M119 220Q133 224 145 216', '#ac8965', 1.6)
  content +=
    path('M119 239Q135 231 149 235L146 250L131 264L117 253Z', '#424b3c', 0.85) +
    beardStrands(122, 239, 23, 27, 9)
  content += path(
    'M35 146L27 115L28 71Q32 29 68 10Q110 -7 149 15Q181 29 188 64L180 100L172 87Q164 55 137 42L108 51L75 42Q48 66 48 113L47 155Z',
    '#2c352d',
    1,
    grain,
  )
  content +=
    path('M85 16Q64 -15 89 -44Q123 -62 143 -37Q154 -15 132 9Z', '#303b31') +
    path('M76 5L141 -2L145 15L81 25Z', '#73694d')
  content += clothLines(
    [
      [
        [40, 84],
        [48, 58],
        [65, 43],
        [89, 30],
      ],
      [
        [118, 26],
        [140, 30],
        [165, 46],
        [176, 70],
      ],
      [
        [92, -38],
        [82, -15],
        [103, 0],
        [119, 5],
      ],
    ],
    '#82907a',
    3.3,
    0.6,
  )
  return group('han-xin-head', content, 'translate(698 165) scale(1.1)')
}

function neck(horizontal, vertical, width, height, skin = 'url(#skin)') {
  return move(
    path(`M0 0L${width} 0L${width - 4} ${height}L${width / 2} ${height + 26}L4 ${height}Z`, skin) +
      path(
        `M0 0L${width} 0L${width - 8} ${height * 0.48}L${width / 2} ${height * 0.75}L4 ${height * 0.5}Z`,
        '#786344',
        0.22,
      ),
    `translate(${horizontal} ${vertical})`,
  )
}

function lamellae(
  identity,
  outline,
  columns,
  rows,
  x,
  y,
  panelWidth,
  panelHeight,
  base = 'url(#iron)',
) {
  const clip = `<clipPath id="${identity}-clip"><path d="${outline}"/></clipPath>`
  const unitWidth = panelWidth / columns
  const unitHeight = panelHeight / rows
  return (
    clip +
    path(outline, base, 1, grain) +
    `<g clip-path="url(#${identity}-clip)">` +
    repeat(rows, (row) =>
      repeat(columns + 1, (column) => {
        const horizontal = x + (column - (row % 2) * 0.42) * unitWidth
        const vertical = y + row * unitHeight
        return (
          path(
            `M${horizontal + 2} ${vertical}Q${horizontal + unitWidth / 2} ${vertical - 3} ${horizontal + unitWidth - 2} ${vertical + 1}L${horizontal + unitWidth - 1} ${vertical + unitHeight - 3}Q${horizontal + unitWidth / 2} ${vertical + unitHeight + 3} ${horizontal + 2} ${vertical + unitHeight - 2}Z`,
            row % 3 === 0 ? '#738073' : '#626e62',
            0.16,
          ) +
          line(
            `M${horizontal + 3} ${vertical + unitHeight - 3}Q${horizontal + unitWidth / 2} ${vertical + unitHeight + 2} ${horizontal + unitWidth - 3} ${vertical + unitHeight - 3}`,
            '#a1a38a',
            1.6,
            0.45,
          ) +
          line(
            `M${horizontal + 7} ${vertical + 4}L${horizontal + 8} ${vertical + 10}M${horizontal + unitWidth - 8} ${vertical + 4}L${horizontal + unitWidth - 9} ${vertical + 10}`,
            '#b9ad89',
            1.5,
            0.65,
          )
        )
      }),
    ) +
    '</g>'
  )
}

function crossCollar(horizontal, vertical, scale, cloth, trim, edge) {
  return move(
    path('M-108 12L-72 -7L38 91L17 113Z', cloth) +
      path('M-102 19L-91 10L31 100L21 111Z', trim) +
      path('M72 -7L108 13L-66 191L-95 172Z', cloth) +
      path('M87 4L98 13L-72 182L-83 174Z', trim) +
      line('M92 11L-77 176', edge, 1.8, 0.7),
    `translate(${horizontal} ${vertical}) scale(${scale})`,
  )
}

function sword(horizontal, vertical, rotation, scale = 1) {
  return move(
    path('M-14 49L14 49L18 309L0 329L-13 311Z', '#303731', 1, grain) +
      line('M7 63L10 306L1 317', '#a99c76', 2.5, 0.7) +
      path('M0 31L21 42L0 55L-21 43Z', '#9b8b62') +
      path('M-9 -29L9 -29L11 35L-9 35Z', '#524d39') +
      repeat(7, (index) =>
        line(`M-8 ${-22 + index * 8}L10 ${-18 + index * 8}`, '#b9aa80', 1.7, 0.8),
      ) +
      ellipse(0, -31, 15, 5, '#9f8c60'),
    `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})`,
  )
}

function bambooBook(horizontal, vertical, rotation, scale = 1) {
  return move(
    path('M0 0L159 8L156 110L-4 105Z', '#b6a273') +
      repeat(
        15,
        (index) =>
          path(
            `M${index * 10.7} ${index * 0.54}L${index * 10.7 + 9} ${index * 0.54 + 0.5}L${index * 10.7 + 7} ${105 + index * 0.33}L${index * 10.7 - 2} ${105 + index * 0.33}Z`,
            index % 3 ? '#b9a675' : '#c7b384',
          ) +
          line(
            `M${index * 10.7 + 4} ${13 + index * 0.54}L${index * 10.7 + 3} ${86 + index * 0.33}`,
            '#766e4e',
            0.8,
            0.35,
          ),
      ) +
      line('M-1 22L158 29M-2 84L157 90', '#5f6146', 3.6) +
      line(
        'M20 36l5 2m-3 3l2 5m17 -7l5 2m-3 3l1 6m20 -7l4 3m-3 3l4 4m19 -8l4 2m-3 3l1 6m19 -8l5 2m-4 3l3 6',
        '#5f6247',
        1.2,
        0.65,
      ),
    `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})`,
  )
}

function horseCompanion() {
  let content = path(
    'M1121 540Q1163 450 1130 366Q1099 306 1141 247Q1168 211 1211 232Q1257 257 1269 314L1294 368L1278 401L1242 402Q1230 367 1211 351Q1193 347 1199 376Q1228 470 1270 525L1361 809Q1392 882 1328 925Q1219 959 1086 926L1045 858Q1142 690 1121 540Z',
    'url(#horse-coat)',
    1,
    grain,
  )
  content += path(
    'M1154 311Q1125 394 1170 483L1223 607Q1204 474 1176 405Q1160 366 1175 331Z',
    '#a3a38b',
    0.3,
  )
  content +=
    path(
      'M1145 255L1139 201Q1148 169 1164 199L1176 243ZM1189 230L1205 184Q1220 166 1220 199L1214 245Z',
      '#3c443d',
    ) + path('M1150 237L1148 207L1155 214L1163 241ZM1200 229L1212 198L1211 232Z', '#a4a18b', 0.55)
  content +=
    path('M1267 350Q1296 360 1298 381L1282 402L1243 403L1235 386Z', '#414a42') +
    ellipse(1277, 379, 9, 6, '#242f2b')
  content +=
    path('M1208 283Q1222 271 1235 285L1228 294L1212 292Z', '#29322d') +
    ellipse(1223, 284, 4, 4, '#b6b69d', 0.65)
  content += line('M1215 306Q1229 321 1234 344M1247 394L1280 394', '#333d35', 2.7, 0.8)
  content += group(
    'mane',
    repeat(12, (index) =>
      brush(
        [
          [1143 + (index % 3) * 7, 253 + index * 8],
          [1109 - index * 1.4, 286 + index * 10],
          [1134 - index * 1.8, 362 + index * 10],
          [1093 - index * 1.1, 400 + index * 14],
        ],
        8 + (index % 4),
        index % 4 ? '#303a32' : '#8a9380',
        0.8,
        true,
      ),
    ),
  )
  content += group(
    'bridle-and-rein',
    line('M1175 245L1205 317L1248 386L1264 396M1205 317L1242 296M1237 370L1290 366', '#78664a', 8) +
      line('M1175 245L1205 317L1248 386L1264 396M1237 370L1290 366', '#b39b70', 2, 0.7) +
      ellipse(1257, 395, 9, 8, '#a68e5c') +
      line('M1256 401Q1240 534 1063 676Q1018 715 971 698', '#5d5840', 4.5),
  )
  content += clothLines(
    [
      [
        [1160, 510],
        [1170, 563],
        [1173, 610],
        [1159, 668],
      ],
      [
        [1241, 529],
        [1265, 603],
        [1271, 656],
        [1280, 707],
      ],
    ],
    '#a4ac91',
    7,
    0.5,
  )
  return group('companion-horse', content)
}

function xiangYu() {
  let content = horseCompanion()
  content += group(
    'under-robe',
    path(
      'M594 438Q492 431 422 507L368 674L351 913Q624 982 1002 937L1086 897L1043 729L986 518Q915 449 823 435L742 500Z',
      'url(#red-cloth)',
      1,
      grain,
    ),
  )
  content += group(
    'iron-torso',
    lamellae(
      'xiang-torso',
      'M564 473Q662 442 784 468L925 523L937 779Q762 844 539 776L481 574Z',
      11,
      8,
      500,
      489,
      450,
      309,
    ),
  )
  content += group(
    'shoulder-lamellae',
    lamellae(
      'xiang-left-shoulder',
      'M517 463Q452 471 418 520L405 598Q478 622 562 583L586 493Z',
      5,
      4,
      402,
      476,
      190,
      143,
    ) +
      lamellae(
        'xiang-right-shoulder',
        'M819 468Q925 466 988 527L1012 598Q936 624 866 577Z',
        5,
        4,
        825,
        480,
        190,
        140,
      ),
  )
  content += neck(627, 397, 129, 111)
  content += xiangHead()
  content += group(
    'right-lapped-collar',
    crossCollar(701, 440, 0.91, '#643c30', '#aa8a60', '#dbc093'),
  )
  content += group(
    'waist',
    path('M531 764Q748 821 944 763L950 818Q744 882 520 815Z', '#342f27') +
      line('M538 784Q745 839 940 784', '#b19c70', 3.3, 0.65) +
      path('M738 800L791 796L796 831L744 839Z', '#a48e60') +
      path('M749 808L782 805L785 824L752 829Z', '#454b3b'),
  )
  content += group(
    'left-arm',
    path(
      'M430 569Q393 614 404 690Q425 765 525 790L620 762L627 729L532 716L495 664L511 603Z',
      'url(#iron)',
      1,
      grain,
    ) +
      path('M520 709L557 720L541 781L508 768Z', '#78674b') +
      line('M531 723L522 758M542 727L532 766', '#b8a378', 2.1) +
      path('M552 725L582 720L614 733L625 750L611 762L583 753L564 760L543 748Z', 'url(#skin)') +
      line('M566 732L589 740L608 744M563 742L588 749', '#866548', 1.6),
  )
  content += group(
    'rein-arm',
    path(
      'M961 580Q1004 620 1014 659L1007 704L953 737L910 714L928 681L954 655L926 611Z',
      'url(#iron)',
      1,
      grain,
    ) +
      path('M951 680L979 701L949 736L921 718Z', '#786548') +
      path(
        'M951 705L958 683Q958 671 948 669L929 672L916 685L918 701L936 716L954 720Z',
        'url(#skin)',
      ) +
      line('M926 678L940 680L947 691M923 688L938 693M927 698L940 704', '#816145', 1.5),
  )
  content += group('straight-sheathed-sword', sword(553, 823, 19, 0.46))
  content += group(
    'robe-brushwork',
    clothLines(
      [
        [
          [425, 780],
          [409, 841],
          [399, 881],
          [391, 918],
        ],
        [
          [605, 846],
          [593, 879],
          [596, 916],
          [621, 942],
        ],
        [
          [818, 849],
          [851, 890],
          [879, 916],
          [930, 937],
        ],
      ],
      '#c1946b',
      10,
      0.68,
    ) +
      clothLines(
        [
          [
            [446, 611],
            [431, 644],
            [449, 682],
            [490, 710],
          ],
          [
            [938, 604],
            [964, 624],
            [974, 651],
            [956, 677],
          ],
        ],
        '#aeb29a',
        6,
        0.65,
      ),
  )
  return content
}

function liuBang() {
  let content = group(
    'black-robe',
    path(
      'M747 468Q661 451 573 481Q490 508 449 598L388 748L358 907Q708 991 1172 938L1252 892L1204 784L1152 637Q1100 519 999 485L913 462L836 533Z',
      'url(#black-silk)',
      1,
      grain,
    ),
  )
  content += group(
    'robe-turning-planes',
    path(
      'M584 495Q494 579 482 658L466 756L409 866L393 910L479 932L526 821L534 701L616 525Z',
      '#6f7160',
      0.45,
      grain,
    ) +
      path(
        'M1003 499Q1094 568 1116 668L1141 767L1204 887L1127 934L1080 846L1058 738L1038 627Z',
        '#666c5c',
        0.42,
        grain,
      ),
  )
  content += neck(775, 409, 109, 123)
  content += liuHead()
  content += group(
    'plain-long-crown',
    path(
      'M734 213L724 141L735 94Q787 74 861 88L906 123L914 207Q831 235 734 213Z',
      '#2b312a',
      1,
      grain,
    ) +
      path('M731 141L746 111L762 208L738 212Z', '#6d6b53', 0.6) +
      path('M737 94L866 80L902 105L759 122Z', '#4a4a38') +
      line('M748 111L874 99M761 130Q825 117 891 125M754 203Q831 224 907 203', '#a58d5d', 2.4, 0.6) +
      line('M747 211Q748 296 773 342M903 208Q907 298 881 341', '#756243', 3.5, 0.8),
  )
  content += group('overlapping-collar', crossCollar(839, 468, 1, '#783d35', '#a9956c', '#c8b286'))
  content += group(
    'sleeves',
    path(
      'M481 612Q431 674 461 766Q486 830 627 834L838 798L851 747L643 750L572 709L561 641Z',
      '#343b33',
      1,
      grain,
    ) +
      path(
        'M1110 627Q1174 697 1125 771L1009 831L798 805L790 753L1001 739L1026 683L1021 637Z',
        '#2b342e',
        1,
        grain,
      ) +
      path('M762 744L813 746L820 817L767 817Z', '#793e32') +
      line('M773 753L781 808M805 754L812 807', '#b4996c', 3) +
      path('M1020 736L1043 763L1008 795L988 762Z', '#79513b'),
  )
  content += group(
    'collected-hands',
    path('M803 758L826 744L852 749L867 764L858 784L829 788L806 777Z', 'url(#skin)') +
      path('M844 755L860 750L876 760L888 771L881 789L859 787L850 777Z', '#c7a57e') +
      line(
        'M813 760L835 762L851 770M814 771L832 776L844 776M859 761L874 771M858 772L877 780',
        '#806244',
        1.6,
      ),
  )
  content += group(
    'cloth-calligraphy',
    clothLines(
      [
        [
          [561, 529],
          [517, 588],
          [504, 645],
          [522, 697],
        ],
        [
          [452, 727],
          [530, 782],
          [621, 796],
          [748, 768],
        ],
        [
          [1049, 555],
          [1073, 612],
          [1070, 668],
          [1039, 716],
        ],
        [
          [1093, 752],
          [1015, 796],
          [947, 804],
          [886, 791],
        ],
        [
          [600, 837],
          [566, 887],
          [548, 923],
          [530, 946],
        ],
        [
          [976, 839],
          [1012, 892],
          [1045, 929],
          [1090, 944],
        ],
      ],
      '#9b9b81',
      7,
      0.58,
    ) +
      clothLines(
        [
          [
            [680, 842],
            [671, 881],
            [658, 917],
            [666, 951],
          ],
          [
            [873, 848],
            [895, 886],
            [909, 925],
            [935, 949],
          ],
        ],
        '#171f1c',
        22,
        0.78,
      ),
  )
  return content
}

function zhangLiang() {
  let content = group(
    'pale-robe',
    path(
      'M729 444Q624 439 557 478Q477 519 443 625L400 787L380 916Q735 980 1132 938L1204 895L1163 788L1122 650Q1091 534 1000 475L906 444L813 508Z',
      'url(#linen)',
      1,
      grain,
    ),
  )
  content += group(
    'silk-turning-planes',
    path(
      'M574 478Q507 529 490 626L467 714L429 812L409 910L474 934L519 836L538 728L560 626L621 500Z',
      '#cfceb0',
      0.68,
      grain,
    ) +
      path(
        'M988 489Q1061 558 1074 659L1096 766L1156 895L1096 929L1032 807L1020 704L997 597Z',
        '#566e60',
        0.53,
        grain,
      ),
  )
  content += neck(769, 394, 96, 106, 'url(#fair-skin)') + zhangHead()
  content += group(
    'right-lapped-collar',
    crossCollar(813, 442, 0.91, '#d8caa9', '#5f7767', '#a9b39a'),
  )
  content += group(
    'waist-and-sword',
    path('M535 758Q797 825 1040 757L1047 790Q799 861 532 796Z', '#5f624b') +
      line('M547 778Q794 844 1035 777', '#c4b58c', 2.8, 0.78) +
      sword(1022, 780, -19, 0.44),
  )
  content += group(
    'book-support-arm',
    path(
      'M492 588Q450 651 465 706Q489 767 640 792L783 759L784 717L658 716L563 675L573 620Z',
      'url(#pale-silk)',
      1,
      grain,
    ) +
      path('M743 708L794 715L788 772L738 776Z', '#526d60') +
      path('M788 723L814 712L840 721L851 737L840 754L808 756L785 746Z', 'url(#fair-skin)') +
      line('M800 726L821 731L838 736M798 738L818 743', '#9a7857', 1.4),
  )
  content += group('reading-book', bambooBook(815, 643, 13, 1.28))
  content += group(
    'right-arm-and-hand',
    path(
      'M1050 571Q1114 617 1103 672L1057 745L979 744L964 715L1014 686L1019 641L1000 601Z',
      'url(#linen)',
      1,
      grain,
    ) +
      path('M1004 696L1022 720L990 749L969 727Z', '#5e7561') +
      path(
        'M988 716L979 695L963 677L950 675L943 683L950 696L949 709L963 727L981 731Z',
        'url(#fair-skin)',
      ) +
      line('M955 685L967 695L973 709M951 699L960 710M961 713L968 720', '#927251', 1.5),
  )
  content += group(
    'robe-flow',
    clothLines(
      [
        [
          [579, 510],
          [544, 557],
          [532, 617],
          [541, 664],
        ],
        [
          [476, 691],
          [528, 728],
          [613, 750],
          [731, 735],
        ],
        [
          [1036, 567],
          [1074, 618],
          [1073, 655],
          [1035, 699],
        ],
        [
          [562, 821],
          [542, 873],
          [537, 909],
          [516, 941],
        ],
        [
          [745, 848],
          [709, 894],
          [687, 925],
          [693, 955],
        ],
        [
          [963, 815],
          [988, 863],
          [1043, 916],
          [1081, 938],
        ],
      ],
      '#d8d5b6',
      9,
      0.77,
    ) +
      clothLines(
        [
          [
            [617, 803],
            [626, 861],
            [609, 917],
            [603, 947],
          ],
          [
            [885, 835],
            [923, 880],
            [930, 915],
            [949, 949],
          ],
        ],
        '#4e6a5d',
        16,
        0.66,
      ),
  )
  return content
}

function liGuang() {
  let content = group(
    'campaign-robe',
    path(
      'M741 442Q645 435 557 478Q485 522 454 627L409 792L399 929Q711 978 1111 943L1183 900L1150 793L1118 656Q1078 527 989 473L908 448L822 510Z',
      'url(#brown-cloth)',
      1,
      grain,
    ),
  )
  content += group(
    'quiver',
    move(
      path('M0 0L68 -7L73 211L18 222Z', '#695a41', 1, grain) +
        path('M0 0L68 -7L73 9L4 17Z', '#b19a6a') +
        repeat(
          5,
          (index) =>
            line(
              `M${12 + index * 10} 8L${-8 + index * 15} ${-132 - (index % 2) * 18}`,
              '#a99970',
              3,
            ) +
            path(`M${-8 + index * 15} ${-132 - (index % 2) * 18}l-13 30l13 -5l11 -27Z`, '#797b62'),
        ) +
        line('M15 54L64 47M17 65L64 58M25 184L63 180', '#ad956b', 2.8, 0.8),
      'translate(1047 518) rotate(17)',
    ),
  )
  content += group(
    'lamellar-vest',
    lamellae(
      'li-vest',
      'M642 466L755 488L830 544L908 489L980 486L1038 590L1002 804Q800 860 575 793L561 577Z',
      10,
      8,
      559,
      493,
      486,
      315,
      'url(#umber-iron)',
    ),
  )
  content += neck(772, 402, 99, 105, 'url(#weathered-skin)') + liHead()
  content += group(
    'secured-quiver-harness',
    path('M1008 502L1020 511L938 702L919 711L846 580L857 574L930 685Z', '#574b36') +
      line('M1012 511L932 694L852 580', '#a4926a', 2.2, 0.8) +
      path('M928 689L940 685L948 701L935 708Z', '#a28b5c'),
  )
  content += group('plain-collar', crossCollar(824, 447, 0.88, '#7f7659', '#c0ae83', '#d1bc8e'))
  content += group(
    'belt-and-sword',
    path('M573 773Q794 839 1010 785L1015 825Q793 886 563 817Z', '#463f30') +
      path('M793 815L842 810L847 846L798 853Z', '#9e8d62') +
      sword(1005, 831, -17, 0.37),
  )
  content += group(
    'bow',
    move(
      path(
        'M60 -265C45 -241 -33 -241 -48 -210C-68 -172 -16 -119 -7 -63Q10 -27 10 0Q10 32 -7 68C-24 120 -69 164 -47 210C-35 239 35 238 60 265L53 255C25 231 -25 230 -35 209C-52 177 -11 128 4 71Q23 31 23 0Q23 -31 4 -66C-9 -127 -53 -176 -36 -208C-25 -229 24 -232 53 -255Z',
        'url(#horn)',
      ) +
        line('M59 -263L59 263', '#c8b584', 2) +
        line(
          'M53 -254C25 -231 -39 -235 -42 -209C-60 -172 -9 -119 0 -64Q18 -26 17 0Q18 30 0 68C-17 124 -60 168 -42 211Q-31 237 54 255',
          '#bd9f68',
          2.1,
          0.78,
        ) +
        repeat(9, (index) => line(`M10 ${-22 + index * 5}L23 ${-20 + index * 5}`, '#4c4636', 2.7)),
      'translate(449 628) rotate(-13)',
    ),
  )
  content += group(
    'long-bow-arm',
    path(
      'M583 528Q529 541 511 610L479 667L497 716L552 706L601 626L626 562Z',
      'url(#brown-cloth)',
      1,
      grain,
    ) +
      path('M476 651L516 658L505 701L474 692Z', '#6f5f44') +
      path(
        'M477 658L463 647L455 625L455 604L467 595L481 603L485 624L498 645L492 664Z',
        'url(#weathered-skin)',
      ) +
      line('M462 607L470 611L473 627M460 620L470 627M465 635L477 643', '#76583c', 1.6),
  )
  content += group(
    'resting-arm',
    path(
      'M1009 565Q1072 613 1070 686L1033 749L916 783L886 750L925 720L993 690L992 635L979 596Z',
      'url(#brown-cloth)',
      1,
      grain,
    ) +
      path('M935 717L960 742L924 775L899 754Z', '#62563e') +
      path(
        'M919 741L904 726L882 725L863 737L863 754L880 766L906 767L923 758Z',
        'url(#weathered-skin)',
      ) +
      line('M877 734L892 736L908 746M873 746L893 752M880 758L898 759', '#765a3e', 1.6),
  )
  content += group(
    'field-wear-brushwork',
    clothLines(
      [
        [
          [576, 541],
          [544, 577],
          [535, 618],
          [511, 653],
        ],
        [
          [1008, 602],
          [1036, 638],
          [1031, 677],
          [999, 711],
        ],
        [
          [596, 838],
          [581, 878],
          [566, 922],
          [553, 943],
        ],
        [
          [807, 870],
          [824, 900],
          [840, 931],
          [851, 950],
        ],
        [
          [1002, 845],
          [1021, 884],
          [1060, 921],
          [1091, 940],
        ],
      ],
      '#c7b58a',
      6,
      0.68,
    ) +
      clothLines(
        [
          [
            [664, 851],
            [639, 885],
            [646, 922],
            [642, 950],
          ],
          [
            [921, 849],
            [931, 884],
            [965, 932],
            [984, 947],
          ],
        ],
        '#424b3b',
        19,
        0.7,
      ),
  )
  return content
}

function hanXin() {
  let content = group(
    'under-robe',
    path(
      'M747 448Q645 432 564 483Q493 522 454 635L416 788L406 918Q741 983 1115 945L1186 904L1144 785L1110 647Q1074 536 989 479L909 449L829 511Z',
      'url(#linen)',
      1,
      grain,
    ),
  )
  content += group(
    'command-armor',
    lamellae(
      'han-torso',
      'M621 470L743 478L826 530L911 477L975 482L1048 596L1007 792Q796 849 574 781L554 577Z',
      11,
      8,
      555,
      485,
      495,
      310,
      'url(#blue-iron)',
    ),
  )
  content += group(
    'short-shoulder-armor',
    lamellae(
      'han-left-shoulder',
      'M604 469Q520 471 478 547L476 605Q532 625 605 584L647 500Z',
      5,
      4,
      477,
      478,
      174,
      141,
      'url(#blue-iron)',
    ) +
      lamellae(
        'han-right-shoulder',
        'M923 468Q1016 474 1070 548L1074 608Q1003 616 947 578L906 500Z',
        5,
        4,
        905,
        480,
        175,
        138,
        'url(#blue-iron)',
      ),
  )
  content += neck(775, 403, 100, 110) + hanHead()
  content += group(
    'plain-cross-collar',
    crossCollar(830, 449, 0.88, '#566a60', '#c9b78b', '#d3bd8e'),
  )
  content += group(
    'waist',
    path('M574 776Q794 835 1016 779L1021 823Q790 880 563 818Z', '#373d32') +
      line('M577 792Q796 854 1012 795', '#b6a57b', 2.8, 0.75) +
      path('M791 814L842 807L848 839L795 848Z', '#a38e60') +
      path('M802 819L833 815L837 833L805 838Z', '#4c5b48'),
  )
  content += group('sheathed-command-sword', sword(1010, 795, -18, 0.46))
  content += group(
    'left-sleeve',
    path(
      'M493 575Q455 628 479 697Q504 756 651 783L751 755L755 718L658 715L567 676L568 618Z',
      'url(#linen)',
      1,
      grain,
    ) +
      path('M720 710L763 714L756 768L713 767Z', '#807859') +
      path('M751 724L777 712L803 716L823 733L815 748L792 754L769 751L750 741Z', 'url(#skin)') +
      line('M767 724L789 728L805 735M764 736L788 744', '#89674a', 1.6),
  )
  content += group('campaign-strips', bambooBook(788, 645, -8, 1.38))
  content += group(
    'right-sleeve-and-hand',
    path(
      'M1035 566Q1100 610 1092 674L1034 743L961 732L956 707L1002 674L1006 634L988 593Z',
      'url(#linen)',
      1,
      grain,
    ) +
      path('M992 689L1014 716L984 743L957 718Z', '#827b5c') +
      path(
        'M977 711L972 691L960 681L940 677L931 686L936 699L953 705L958 719L977 722Z',
        'url(#skin)',
      ) +
      line('M942 685L957 689L964 700M939 696L950 700M962 706L968 713', '#8b6b4b', 1.5),
  )
  content += group(
    'cloth-and-armor-brushwork',
    clothLines(
      [
        [
          [507, 608],
          [493, 655],
          [534, 697],
          [607, 717],
        ],
        [
          [1030, 607],
          [1052, 642],
          [1044, 675],
          [1008, 701],
        ],
        [
          [580, 844],
          [548, 888],
          [544, 922],
          [526, 940],
        ],
        [
          [740, 859],
          [714, 900],
          [711, 931],
          [717, 953],
        ],
        [
          [973, 844],
          [994, 882],
          [1036, 922],
          [1082, 940],
        ],
      ],
      '#b7c1ab',
      6.5,
      0.68,
    ) +
      clothLines(
        [
          [
            [628, 845],
            [620, 880],
            [601, 916],
            [604, 946],
          ],
          [
            [892, 855],
            [916, 885],
            [934, 928],
            [957, 947],
          ],
        ],
        '#405b53',
        16,
        0.74,
      ),
  )
  return content
}

const studies = [
  {
    id: 'xiang-yu-chu-campaign',
    name: '项羽 · 沉雄',
    theme: '秦末楚汉 / 甲衣与骏马',
    note: '壮年沉雄，束发短髯、札甲佩剑；身侧骏马采用保守鬃缰。五官与马色为艺术推演。',
    draw: xiangYu,
  },
  {
    id: 'liu-bang-han-founder',
    name: '刘邦 · 定汉',
    theme: '汉初 / 长冠与美须髯',
    note: '据隆准、美须髯的文字方向塑形，右衽深袍与简化长冠；非真实肖像及精确冠制复原。',
    draw: liuBang,
  },
  {
    id: 'zhang-liang-strategist',
    name: '张良 · 从容',
    theme: '楚汉汉初 / 清秀与简册',
    note: '据状貌如妇人好女的史家评语处理清秀面骨，读简藏锋；发式、配色和未记载五官属推演。',
    draw: zhangLiang,
  },
  {
    id: 'li-guang-frontier-archer',
    name: '李广 · 守边',
    theme: '西汉 / 猿臂与角弓',
    note: '据长、猿臂、善射塑造边将持弓，保留长臂、风霜与低调甲衣；非特定战役现场。',
    draw: liGuang,
  },
  {
    id: 'han-xin-campaign-strategy',
    name: '韩信 · 审势',
    theme: '楚汉汉初 / 札甲与筹策',
    note: '以指挥与读简表现统帅身份，不捏造史载五官；简册、佩剑与素甲采用保守处理。',
    draw: hanXin,
  },
]

mkdirSync(destination, { recursive: true })
for (const study of studies) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}依据史料方向的原创代码彩墨人物，未保留可证实的本人肖像。史料与推演边界见 historical-references.md。透明背景。</desc>${definitions}${study.draw()}</svg>`
  const prefixed = source
    .replace(/id="([^"]+)"/g, (_, identity) => `id="${study.id}-${identity}"`)
    .replace(/url\(#([^)]+)\)/g, (_, identity) => `url(#${study.id}-${identity})`)
    .replace(
      'aria-labelledby="title description"',
      `aria-labelledby="${study.id}-title ${study.id}-description"`,
    )
  writeFileSync(join(destination, study.id + '.svg'), prefixed)
}
writeFileSync(
  join(destination, 'catalog.json'),
  JSON.stringify(
    {
      version: 1,
      width: 1600,
      height: 1000,
      background: 'transparent',
      medium: 'code-painted-historical-interpretation',
      assets: studies.map(({ id, name, theme, note }) => ({
        id,
        name,
        theme,
        note,
        category: 'figures',
        svg: id + '.svg',
        png: id + '.png',
      })),
    },
    null,
    2,
  ) + '\n',
)
console.log('Generated five distinct Qin-Han historical figure interpretations')
