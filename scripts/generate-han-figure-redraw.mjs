import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/han-figures/ink-wash',
)
const ink = '#282d2c'
const path = (shape, fill = ink, opacity = 1, extra = '') =>
  `<path d="${shape}" fill="${fill}" opacity="${opacity}" ${extra}/>`
const line = (shape, color = ink, width = 2, opacity = 1) =>
  `<path d="${shape}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1) =>
  `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${color}" opacity="${opacity}"/>`
const group = (identity, content, transform = '') =>
  `<g id="${identity}" ${transform ? `transform="${transform}"` : ''}>${content}</g>`
const repeat = (count, draw) => Array.from({ length: count }, (_, index) => draw(index)).join('')
const pigment = 'filter="url(#pigment)"'

const definitions = `<defs>
<filter id="pigment" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".04 .18" numOctaves="2" seed="43" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .09 .09 .09 0 .86" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in"/></filter>
<filter id="soft"><feGaussianBlur stdDeviation="5"/></filter>
${[
  ['iron', '#61737a', '#3b525b', '#263b44'],
  ['blue-iron', '#829094', '#536976', '#354750'],
  ['old-iron', '#7c8580', '#505d5a', '#35433e'],
  ['crimson', '#ac5945', '#863e37', '#552c2e'],
  ['wine', '#8f4e54', '#6c3541', '#422a34'],
  ['ink-violet', '#635365', '#423d4c', '#292d38'],
  ['teal', '#4c737a', '#31545e', '#223942'],
  ['ochre', '#c6a473', '#9d7e56', '#6c5944'],
  ['ivory', '#eee1c2', '#d9caab', '#b5a384'],
  ['umber', '#79634e', '#514434', '#342e29'],
  ['russet', '#a57e5b', '#805d44', '#533c31'],
  ['horn', '#b79a67', '#7d6240', '#4d4233'],
  ['bamboo', '#cfb780', '#b39a66', '#88734b'],
]
  .map(
    ([identity, start, middle, end]) =>
      `<linearGradient id="${identity}" x1="15%" y1="0%" x2="85%" y2="100%"><stop stop-color="${start}"/><stop offset=".52" stop-color="${middle}"/><stop offset="1" stop-color="${end}"/></linearGradient>`,
  )
  .join('')}
${[
  ['warm-skin', '#e2bd91', '#c89e73', '#a27452'],
  ['mature-skin', '#e0bb92', '#c19b74', '#977151'],
  ['fair-skin', '#eed8b5', '#dec39e', '#b99a79'],
  ['old-skin', '#ccab82', '#b18a62', '#896647'],
  ['young-skin', '#e3c5a0', '#cbaa83', '#a37c5b'],
]
  .map(
    ([identity, start, middle, end]) =>
      `<radialGradient id="${identity}" cx="39%" cy="29%" r="80%"><stop stop-color="${start}"/><stop offset=".65" stop-color="${middle}"/><stop offset="1" stop-color="${end}"/></radialGradient>`,
  )
  .join('')}
<radialGradient id="cheek"><stop stop-color="#815839" stop-opacity=".32"/><stop offset="1" stop-color="#815839" stop-opacity="0"/></radialGradient>
<radialGradient id="flush"><stop stop-color="#b07b63" stop-opacity=".20"/><stop offset="1" stop-color="#b07b63" stop-opacity="0"/></radialGradient>
<radialGradient id="horse-coat" cx="25%" cy="22%" r="85%"><stop stop-color="#93877b"/><stop offset=".5" stop-color="#6d655d"/><stop offset="1" stop-color="#454842"/></radialGradient>
</defs>`

function brush(points, breadth, color, opacity = 1) {
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
  for (let step = 0; step <= 30; step++) {
    const fraction = step / 30
    const point = curve(fraction)
    const before = curve(Math.max(0, fraction - 0.001))
    const after = curve(Math.min(1, fraction + 0.001))
    const length = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
    const normal = [-(after[1] - before[1]) / length, (after[0] - before[0]) / length]
    const width = (breadth * (0.3 + 0.7 * Math.sin(Math.PI * fraction)) * (1 - 0.83 * fraction)) / 2
    left.push(point.map((value, axis) => +(value + width * normal[axis]).toFixed(2)))
    right.unshift(point.map((value, axis) => +(value - width * normal[axis]).toFixed(2)))
  }
  return path(
    'M' + [...left, ...right].map((point) => point.join(' ')).join('L') + 'Z',
    color,
    opacity,
  )
}

function folds(curves, color, breadth = 8, opacity = 0.55) {
  return curves
    .map((points, index) => brush(points, breadth + (index % 3), color, opacity))
    .join('')
}

function eye(identity, shape, lid, lower, horizontal, vertical, radius = 4.5, thickness = 2.3) {
  return (
    `<defs><clipPath id="${identity}">${path(shape)}</clipPath></defs>` +
    path(shape, '#d8c8aa') +
    `<g clip-path="url(#${identity})">${ellipse(horizontal, vertical, radius, radius + 1.4, '#535044')}${ellipse(horizontal, vertical - 0.2, radius * 0.52, radius + 0.5, '#252c29')}${ellipse(horizontal - 1.1, vertical - 1.9, 0.8, 0.9, '#ddd4bc', 0.8)}</g>` +
    line(lid, ink, thickness) +
    line(lower, '#8c6d50', 0.9, 0.7)
  )
}

function face(identity, shape, material, shading, features) {
  return (
    `<defs><clipPath id="${identity}-face-clip">${path(shape)}</clipPath></defs>` +
    path(shape, `url(#${material})`) +
    `<g clip-path="url(#${identity}-face-clip)">${shading}${features}</g>`
  )
}

function ear(horizontal, vertical, scale, skin) {
  return group(
    'ear',
    path('M0 4C-18 -9 -24 10 -20 29C-18 46 -5 57 5 45L11 18Z', `url(#${skin})`) +
      line('M-5 10C-16 6 -15 22 -7 25Q0 25 -4 38', '#876247', 1.6, 0.65),
    `translate(${horizontal} ${vertical}) scale(${scale})`,
  )
}

function hairs(left, top, width, length, count, color, spread = 0.4) {
  return repeat(count, (index) => {
    const fraction = index / (count - 1)
    return brush(
      [
        [left + width * fraction, top + Math.sin(fraction * Math.PI) * 7],
        [left + width * fraction - 3, top + length * 0.3],
        [left + width * 0.5 + (fraction - 0.5) * width * 0.8, top + length * 0.75],
        [
          left + width * 0.5 + (fraction - 0.5) * width * spread,
          top + length + Math.sin(index * 1.7) * 8,
        ],
      ],
      0.8 + (index % 3) * 0.3,
      index % 4 === 0 ? color : ink,
      0.73,
    )
  })
}

function xiangHead() {
  const shape =
    'M32 43C61 14 125 6 170 30C197 46 203 73 200 107C199 130 204 157 195 183C185 212 168 238 142 250C120 262 92 256 72 243C46 227 30 206 24 183C18 160 18 132 21 106C22 80 19 62 32 43Z'
  let features =
    path('M39 94C57 82 82 82 105 89L111 98C84 94 64 91 40 101Z') +
    path('M139 88Q164 78 188 87L190 96Q165 89 141 97Z')
  features += eye(
    'near-eye',
    'M44 113Q71 101 99 111Q73 121 47 118Z',
    'M44 113Q71 100 99 111',
    'M48 118Q75 123 96 115',
    78,
    111,
    5.2,
    3.3,
  )
  features += eye(
    'far-eye',
    'M143 109Q163 100 184 108Q169 119 145 115Z',
    'M143 109Q163 99 184 108',
    'M147 115Q167 120 181 112',
    167,
    108,
    4.6,
    2.8,
  )
  features += line('M47 102Q70 95 97 101M145 99Q165 94 181 98', '#927256', 1, 0.65)
  features += path(
    'M122 105C122 123 111 145 111 158Q113 171 130 171Q150 170 153 161Q150 150 140 150L134 115Z',
    '#ac8058',
    0.24,
  )
  features += line(
    'M125 109C125 129 118 145 117 157Q117 164 128 167M141 151Q153 152 155 160Q154 164 148 165',
    '#78563c',
    1.8,
  )
  features += line(
    'M120 172Q133 177 146 171M101 172Q97 182 98 188M160 168Q166 180 165 190',
    '#9c7354',
    1.1,
    0.6,
  )
  features += line(
    'M115 166Q119 163 124 165M141 165Q146 162 150 164M43 115L39 118M184 111L188 114',
    '#75553d',
    1.2,
    0.8,
  )
  features += path(
    'M80 189Q100 178 122 185Q140 178 162 186L168 196Q143 190 127 195Q111 191 96 195L75 198Z',
  )
  features +=
    line('M100 205Q123 202 148 201', '#634b3b', 2) +
    line('M107 212Q129 217 143 210', '#a87c5e', 1.6)
  features += line('M36 145Q38 168 47 181M181 132Q181 154 176 163', '#9c7856', 1.2, 0.45)
  let content =
    ear(23, 127, 1, 'warm-skin') +
    face(
      'xiang',
      shape,
      'warm-skin',
      ellipse(39, 160, 31, 83, 'url(#cheek)') +
        ellipse(176, 164, 34, 61, 'url(#cheek)') +
        ellipse(87, 166, 29, 31, 'url(#flush)'),
      features,
    )
  content += path(
    'M31 192Q49 218 76 226Q117 243 159 224L188 194C185 224 177 251 154 266Q120 283 83 264Q47 248 35 225Z',
    '#343a33',
  )
  content += hairs(42, 217, 139, 53, 43, '#8e8b70', 0.8)
  content += path(
    'M18 143C10 114 9 87 13 63C16 30 44 8 83 2C128 -8 172 4 192 27C209 49 214 77 201 111L190 117C191 79 183 58 159 43Q126 58 92 34Q55 44 40 76L33 141Z',
    '#242c2b',
  )
  content +=
    path('M72 8C55 -20 62 -52 88 -61C120 -72 147 -49 145 -27L138 9Z', '#29312e', 1, pigment) +
    path('M71 -2L143 -5L143 9L73 14Z', '#7c4737')
  content += folds(
    [
      [
        [23, 90],
        [24, 55],
        [47, 28],
        [78, 20],
      ],
      [
        [99, 8],
        [134, 5],
        [174, 16],
        [190, 56],
      ],
      [
        [77, -39],
        [90, -51],
        [122, -43],
        [135, -20],
      ],
    ],
    '#788175',
    2.2,
    0.5,
  )
  content += line('M29 141Q34 162 34 172M37 137L40 164', '#303630', 1.6)
  return group('face-and-hair', content, 'translate(627 198) scale(1.12 .92)')
}

function liuHead() {
  const shape =
    'M28 44C53 19 104 16 141 36C164 49 173 79 170 113C169 132 177 151 170 174C166 198 155 224 135 241C115 257 88 257 65 245C40 233 24 215 20 190C14 163 13 135 16 109C18 83 13 60 28 44Z'
  let features =
    path('M32 91Q51 80 79 88L82 94Q58 89 33 99Z', '#3c3730') +
    path('M111 94Q132 85 155 92L157 99Q135 94 112 101Z', '#3c3730')
  features += eye(
    'near-eye',
    'M35 111Q56 102 78 111Q58 119 38 116Z',
    'M35 111Q55 102 78 111',
    'M38 117Q58 122 76 115',
    56,
    111,
    4,
    2.2,
  )
  features += eye(
    'far-eye',
    'M115 114Q133 107 151 113Q136 122 117 119Z',
    'M115 114Q133 106 151 113',
    'M119 120Q134 124 149 117',
    134,
    114,
    3.8,
    2.1,
  )
  features += line(
    'M34 122Q53 130 73 123M118 126Q135 131 148 124M33 102Q56 97 77 104M117 105Q134 101 150 106',
    '#967353',
    1,
    0.65,
  )
  features += line('M45 67Q66 60 89 66M47 74Q69 68 89 74', '#a07d5b', 1.1, 0.67)
  features += path(
    'M98 102C94 120 93 139 96 153C97 159 110 164 110 171Q108 180 94 178L81 174Q85 159 86 145L90 112Z',
    '#a27c58',
    0.26,
  )
  features += line(
    'M98 103C94 121 94 142 98 153C101 158 111 161 111 169Q110 175 102 177M85 171Q79 168 76 174',
    '#7d5c40',
    1.8,
  )
  features += line(
    'M41 145Q35 172 46 188M143 148Q153 162 150 186M47 193Q49 212 58 220',
    '#9d7756',
    1.1,
    0.62,
  )
  features += path(
    'M58 195Q70 182 88 186L99 191Q115 182 133 193L142 205Q121 196 100 200Q80 194 52 207Z',
    '#37362e',
  )
  features += hairs(60, 192, 73, 24, 20, '#8b8266', 1.1)
  features +=
    line('M68 215Q88 217 113 212', '#73503c', 2) + line('M76 224Q96 228 111 222', '#ac7d5d', 1.5)
  let content =
    ear(16, 133, 0.9, 'mature-skin') +
    face(
      'liu',
      shape,
      'mature-skin',
      ellipse(31, 175, 26, 66, 'url(#cheek)') +
        ellipse(151, 186, 29, 51, 'url(#cheek)') +
        ellipse(61, 164, 23, 31, 'url(#flush)'),
      features,
    )
  content += path(
    'M25 191Q43 219 62 227Q91 242 130 228L158 203Q157 254 137 285Q120 314 91 334Q61 306 46 278Q27 246 25 191Z',
    '#30352f',
  )
  content += hairs(36, 224, 112, 108, 39, '#9c9c80', 0.25)
  content += path(
    'M15 138Q2 108 7 78Q10 40 24 28L45 25Q27 49 29 84L27 143ZM150 31Q173 43 180 76L170 143L162 141Q163 86 150 65Z',
    '#30332d',
  )
  content += line('M9 106Q18 144 40 173M172 105Q168 145 151 174', '#67563f', 2.3)
  content += group(
    'simplified-long-crown',
    path(
      'M17 32L13 -58Q22 -86 42 -99L128 -106L159 -78L165 32Q96 53 17 32Z',
      '#30352e',
      1,
      pigment,
    ) +
      path('M17 -58L40 -83L49 31L25 36Z', '#5d604b') +
      path('M41 -101L131 -109L158 -84L49 -77Z', '#51513b') +
      line('M48 -78L144 -87M23 27Q93 48 157 27M28 -62L40 22', '#ad9567', 1.8, 0.55),
  )
  return group('face-and-hair', content, 'translate(718 193)')
}

function zhangHead() {
  const shape =
    'M27 47C48 22 91 15 124 28C150 39 170 65 170 96C169 118 177 145 169 170C162 197 145 221 125 238C113 249 98 252 85 246C58 233 38 212 28 190C17 168 15 141 17 116C18 91 12 66 27 47Z'
  let features =
    brush(
      [
        [38, 91],
        [58, 85],
        [75, 87],
        [91, 94],
      ],
      4.6,
      '#565347',
    ) +
    brush(
      [
        [121, 93],
        [134, 91],
        [149, 95],
        [157, 102],
      ],
      4.1,
      '#565347',
    )
  features += eye(
    'near-eye',
    'M41 111Q63 107 85 117Q62 120 44 116Z',
    'M41 111Q63 106 85 117',
    'M46 117Q64 124 82 120',
    70,
    117,
    3.7,
    1.8,
  )
  features += eye(
    'far-eye',
    'M120 116Q137 113 152 121Q137 126 121 122Z',
    'M120 116Q138 112 152 121',
    'M123 123Q139 128 150 124',
    138,
    122,
    3.3,
    1.7,
  )
  features += line('M43 102Q65 98 83 107M123 107Q138 103 151 111', '#b39571', 0.8, 0.65)
  features += path(
    'M103 116Q102 141 98 155Q96 162 105 166L120 167Q127 162 121 157L114 149L112 124Z',
    '#b19471',
    0.18,
  )
  features += line(
    'M105 119Q105 140 102 153Q100 161 109 163M118 159Q123 160 121 164',
    '#9d7a5a',
    1.35,
    0.9,
  )
  features += line('M103 169Q111 172 119 169', '#b18c6d', 0.85)
  features += path('M86 193Q96 188 105 191Q116 189 128 194Q109 200 88 197Z', '#c2957a', 0.52)
  features +=
    line('M87 194Q101 192 108 194Q117 192 126 194', '#8f6852', 1.4, 0.9) +
    line('M96 202Q110 205 121 200', '#bb9276', 1.1)
  features += line('M72 214Q88 232 107 233', '#b99775', 0.8, 0.55)
  let content =
    ear(21, 127, 0.76, 'fair-skin') +
    face(
      'zhang',
      shape,
      'fair-skin',
      ellipse(33, 168, 23, 64, 'url(#cheek)') +
        ellipse(155, 177, 26, 60, 'url(#cheek)') +
        ellipse(68, 169, 28, 27, 'url(#flush)'),
      features,
    )
  content += path(
    'M17 149Q3 115 8 80C11 42 30 12 64 5C103 -6 151 7 170 35Q188 67 173 110L163 114Q164 74 141 49Q121 62 99 57Q74 53 65 40C41 54 32 74 31 104L29 152Z',
    '#27312e',
  )
  content +=
    path(
      'M65 13C52 -7 54 -34 71 -47Q96 -64 121 -46C136 -34 136 -10 120 10Z',
      '#303a33',
      1,
      pigment,
    ) + path('M62 1L126 0L127 12L66 17Z', '#77724f')
  content += folds(
    [
      [
        [14, 101],
        [17, 68],
        [29, 38],
        [56, 24],
      ],
      [
        [92, 12],
        [124, 12],
        [155, 31],
        [165, 63],
      ],
      [
        [65, -28],
        [77, -48],
        [109, -43],
        [120, -23],
      ],
    ],
    '#687a6a',
    1.7,
    0.55,
  )
  content += line('M29 118Q26 144 35 158M24 134Q25 153 28 164', '#3c4438', 1.2, 0.8)
  return group('face-and-hair', content, 'translate(718 200) rotate(4 100 120)')
}

function liHead() {
  const shape =
    'M32 45C58 21 100 17 133 31C158 42 171 71 168 104C167 123 177 150 169 174C165 202 153 229 131 249C116 264 94 270 74 260C47 246 30 225 24 199C16 171 13 144 18 116C22 89 16 62 32 45Z'
  let features =
    brush(
      [
        [31, 101],
        [49, 89],
        [66, 92],
        [81, 100],
      ],
      7.5,
      '#515347',
    ) +
    brush(
      [
        [113, 100],
        [129, 93],
        [145, 98],
        [156, 105],
      ],
      7.1,
      '#535448',
    )
  features += eye(
    'near-eye',
    'M34 118Q56 110 79 117Q60 124 37 123Z',
    'M34 118Q56 110 79 117',
    'M38 124Q57 129 76 121',
    59,
    118,
    3.8,
    2.5,
  )
  features += eye(
    'far-eye',
    'M115 118Q135 113 152 120Q136 126 117 124Z',
    'M115 118Q134 112 152 120',
    'M119 125Q135 131 150 124',
    134,
    120,
    3.5,
    2.2,
  )
  features += line(
    'M30 111Q54 102 78 110M114 110Q135 105 153 114M34 132Q54 141 76 131M118 134Q136 139 152 130',
    '#8f6a4d',
    1.05,
    0.8,
  )
  features += line(
    'M32 121L23 125M34 128L23 133M155 122L163 126M153 129L163 135',
    '#9e7956',
    0.8,
    0.7,
  )
  features += line(
    'M49 64Q77 55 102 63M46 74Q75 65 103 72M53 82Q76 75 96 82M86 94L90 104',
    '#96714f',
    1.1,
    0.8,
  )
  features += path(
    'M96 115C93 134 87 150 90 165Q96 176 111 173L123 166Q120 155 108 153L107 124Z',
    '#896847',
    0.28,
  )
  features += line(
    'M96 117Q94 143 93 159Q94 169 105 168M114 158Q124 162 119 168M98 178Q108 183 117 177',
    '#745238',
    1.6,
  )
  features += line(
    'M44 152Q39 173 51 190M142 151Q151 175 142 193M42 164L47 180M150 168L147 183',
    '#97704e',
    1.05,
    0.85,
  )
  features += path(
    'M59 202Q74 189 92 196Q108 189 128 202L133 211Q111 205 96 209Q79 204 55 215Z',
    '#555749',
  )
  features += folds(
    [
      [
        [64, 204],
        [74, 196],
        [83, 198],
        [91, 204],
      ],
      [
        [104, 201],
        [112, 198],
        [124, 204],
        [129, 210],
      ],
    ],
    '#b8b594',
    1.6,
    0.8,
  )
  features += line('M71 222Q91 218 112 220M78 230Q94 234 108 229', '#74513a', 1.65)
  let content =
    ear(18, 140, 0.93, 'old-skin') +
    face(
      'li',
      shape,
      'old-skin',
      ellipse(35, 186, 28, 72, 'url(#cheek)') +
        ellipse(150, 181, 30, 62, 'url(#cheek)') +
        ellipse(65, 164, 23, 31, 'url(#flush)'),
      features,
    )
  content += path(
    'M23 203Q45 232 67 241Q100 252 132 233L158 208Q159 245 134 273Q110 290 82 282Q44 268 30 241Z',
    '#55594b',
  )
  content += hairs(32, 232, 119, 50, 47, '#c0bd9d', 0.7)
  content += path(
    'M19 148Q7 118 11 79Q13 45 35 28Q91 -3 139 27Q174 48 177 91L170 145L161 151L158 91Q149 62 130 55Q91 39 50 58L33 91L30 149Z',
    '#5a6154',
  )
  content += folds(
    [
      [
        [22, 117],
        [13, 82],
        [32, 48],
        [56, 37],
      ],
      [
        [119, 37],
        [153, 48],
        [167, 80],
        [166, 124],
      ],
    ],
    '#aaa88b',
    2.2,
    0.8,
  )
  content +=
    path('M28 44Q90 17 156 47L155 65Q93 42 29 63Z', '#747461', 1, pigment) +
    line('M36 51Q96 34 149 54', '#b3ab84', 1.8, 0.55)
  content += path('M61 28C48 4 54 -18 74 -28C97 -39 120 -26 126 -7L123 28Z', '#4a5349')
  return group('face-and-hair', content, 'translate(728 173) scale(.94 1.04)')
}

function hanHead() {
  const shape =
    'M35 40C63 17 113 11 148 33C175 51 179 80 174 109C170 132 171 160 163 184C152 216 127 241 104 256C91 263 77 257 65 247C43 231 27 212 20 188C12 164 9 139 15 115C19 87 15 58 35 40Z'
  let features =
    brush(
      [
        [30, 92],
        [46, 85],
        [62, 85],
        [75, 91],
      ],
      6.1,
      '#363d37',
    ) +
    brush(
      [
        [101, 87],
        [121, 78],
        [148, 82],
        [157, 94],
      ],
      7.1,
      '#363d37',
    )
  features += eye(
    'far-eye',
    'M28 111Q44 103 64 108Q50 119 31 117Z',
    'M28 111Q44 103 64 108',
    'M32 118Q48 123 61 114',
    38,
    111,
    4,
    2.3,
  )
  features += eye(
    'near-eye',
    'M102 108Q124 96 149 107Q126 119 104 115Z',
    'M102 108Q124 96 149 107',
    'M105 116Q128 123 146 111',
    114,
    108,
    4.8,
    2.7,
  )
  features += line('M30 102Q47 96 62 100M105 97Q125 89 145 98', '#9e8060', 0.85, 0.75)
  features += path(
    'M83 109Q77 132 69 155Q67 165 81 168L97 165Q104 161 99 155L91 152L94 121Z',
    '#947557',
    0.2,
  )
  features += line('M83 112Q79 135 72 155Q70 163 82 165M93 155Q102 157 98 164', '#896247', 1.7)
  features += line('M73 172Q85 177 95 171', '#a57f5f', 0.95)
  features += path('M61 199Q76 191 87 195Q99 191 118 197Q96 203 65 203Z', '#af8067', 0.52)
  features +=
    line('M62 200Q79 195 89 198Q102 194 117 197', '#785440', 1.8) +
    line('M73 209Q91 213 107 205', '#b58a6c', 1.3)
  features += line(
    'M37 171Q41 196 53 211M142 157Q137 183 127 196M72 232Q86 240 99 233',
    '#a07c5a',
    0.9,
    0.5,
  )
  let content =
    ear(174, 129, -0.86, 'young-skin') +
    face(
      'han',
      shape,
      'young-skin',
      ellipse(27, 159, 23, 72, 'url(#cheek)') +
        ellipse(146, 176, 30, 58, 'url(#cheek)') +
        ellipse(119, 164, 25, 26, 'url(#flush)'),
      features,
    )
  content += path(
    'M16 144Q3 116 8 80C13 42 35 16 72 7C119 -6 160 8 176 40Q191 75 176 118L167 125Q169 87 149 57L131 42Q100 61 69 44Q43 60 33 93L27 149Z',
    '#283439',
  )
  content +=
    path(
      'M84 14C68 -9 76 -43 98 -54C123 -66 147 -49 149 -29Q150 -6 130 14Z',
      '#2c393b',
      1,
      pigment,
    ) + path('M81 3L139 0L138 13L84 18Z', '#735240')
  content += folds(
    [
      [
        [16, 108],
        [15, 78],
        [34, 40],
        [65, 25],
      ],
      [
        [101, 10],
        [133, 14],
        [162, 38],
        [171, 70],
      ],
      [
        [94, -37],
        [105, -52],
        [132, -41],
        [137, -20],
      ],
    ],
    '#768477',
    1.7,
    0.6,
  )
  content += line('M171 125L166 148M174 136L171 156', '#333f38', 1.5)
  return group('face-and-hair', content, 'translate(725 189)')
}

function armor(identity, shape, left, top, width, height, material = 'iron') {
  const columns = Math.max(4, Math.round(width / 26))
  const rows = Math.max(3, Math.round(height / 28))
  return (
    `<defs><clipPath id="${identity}">${path(shape)}</clipPath></defs>` +
    path(shape, `url(#${material})`, 1, pigment) +
    `<g clip-path="url(#${identity})">${repeat(rows, (row) =>
      repeat(columns, (column) => {
        const horizontal =
          left + (column * width) / (columns - 1) + ((row % 2) * width) / (columns * 2)
        const vertical =
          top + (row * height) / (rows - 1) + Math.sin((column / (columns - 1)) * Math.PI) * 8
        const plate = width / columns
        return (
          line(
            `M${horizontal} ${vertical}q${plate * 0.42} 7 ${plate * 0.85} 0m${-plate * 0.72} -16l1 15`,
            '#b0b0a0',
            0.95,
            0.37,
          ) +
          line(
            `M${horizontal + plate * 0.24} ${vertical - 13}v4m${plate * 0.35} -4v4`,
            '#c6b99b',
            1,
            0.5,
          )
        )
      }),
    )}</g>`
  )
}

function collar(horizontal, vertical, scale, material, trim) {
  return group(
    'overlapping-collar',
    path('M-85 3L-61 -10L28 70L10 91Z', material) +
      path('M59 -8L86 9L-59 167L-81 151Z', material) +
      path('M70 1L78 9L-65 158L-73 152Z', trim) +
      line('M-75 5L19 82', trim, 2, 0.7),
    `translate(${horizontal} ${vertical}) scale(${scale})`,
  )
}

function book(horizontal, vertical, rotation, scale = 1) {
  const body =
    path('M0 0L179 4L176 131L-3 125Z', 'url(#bamboo)') +
    repeat(16, (index) =>
      line(`M${index * 11 + 4} 6L${index * 11 + 2} 121`, '#7d714f', 0.9, 0.58),
    ) +
    line('M0 25L179 29M-2 99L177 105', '#5d6247', 3) +
    repeat(10, (index) =>
      line(`M${20 + index * 12} ${40 + (index % 3) * 6}l3 5m-2 4l-1 9`, '#5e5d43', 0.85, 0.5),
    )
  return group(
    'bamboo-book',
    body,
    `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})`,
  )
}

function sword(horizontal, vertical, rotation) {
  return group(
    'sheathed-straight-sword',
    path('M-9 31L10 31L12 225L1 242L-11 229Z', '#2c3533') +
      line('M5 43L7 219L1 232', '#a49b77', 1.6, 0.7) +
      path('M0 18L16 29L1 39L-16 29Z', '#9d8960') +
      path('M-7 -28L7 -28L7 22L-7 22Z', '#4c4a35') +
      repeat(7, (index) => line(`M-6 ${-24 + index * 6}L6 ${-21 + index * 6}`, '#b2a480', 1.1)) +
      ellipse(0, -30, 10, 3, '#ab9469'),
    `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(.68)`,
  )
}

function belt(left, top, width, color = '#3a342b') {
  return group(
    'waist-belt',
    path(
      `M${left} ${top}Q${left + width / 2} ${top + 27} ${left + width} ${top - 3}L${left + width + 1} ${top + 24}Q${left + width / 2} ${top + 54} ${left - 1} ${top + 25}Z`,
      color,
    ) +
      line(
        `M${left + 4} ${top + 8}Q${left + width / 2} ${top + 33} ${left + width - 3} ${top + 4}`,
        '#b8a77d',
        1.7,
        0.7,
      ) +
      path(`M${left + width * 0.52} ${top + 14}l38 -3l3 28l-39 4Z`, '#ad9565') +
      path(`M${left + width * 0.52 + 7} ${top + 20}l24 -2l1 15l-24 3Z`, color),
  )
}

function horse() {
  let content = path(
    'M1125 501C1126 439 1100 392 1109 331C1113 296 1130 268 1159 263C1188 253 1217 271 1233 298C1252 327 1271 344 1281 363Q1286 377 1276 390Q1261 405 1240 400Q1219 392 1213 372L1195 353Q1184 351 1185 369C1189 410 1210 462 1234 504C1268 569 1302 675 1304 771L1307 907Q1227 945 1096 923L1054 854C1105 723 1129 609 1125 501Z',
    'url(#horse-coat)',
    1,
    pigment,
  )
  content += path(
    'M1156 280Q1126 292 1120 333Q1115 386 1152 453L1192 560Q1176 456 1152 390Q1135 344 1156 310Z',
    '#c2b095',
    0.24,
  )
  content +=
    path(
      'M1135 284C1123 263 1117 237 1124 222Q1138 219 1153 270ZM1174 267Q1177 230 1191 216Q1202 223 1194 250L1189 278Z',
      '#42483f',
    ) + path('M1135 264L1129 236L1145 266ZM1182 259L1190 231L1188 264Z', '#ae9b80', 0.65)
  content +=
    path('M1228 354Q1262 345 1280 365Q1288 380 1273 393Q1258 402 1240 393L1224 374Z', '#56594f') +
    ellipse(1263, 375, 9, 5.5, '#30362e')
  content +=
    path('M1178 303Q1192 293 1205 304Q1198 316 1182 313Z', '#30382f') +
    ellipse(1194, 305, 4, 4.5, '#817d61') +
    ellipse(1195, 305, 2.5, 3.8, '#242e27')
  content += line('M1180 322Q1195 325 1204 343M1242 390Q1256 396 1270 389', '#3e443a', 1.8, 0.7)
  content += repeat(16, (index) =>
    brush(
      [
        [1134 + (index % 3) * 4, 285 + index * 5],
        [1106 - index * 0.7, 324 + index * 7],
        [1120 - index, 382 + index * 10],
        [1084 - index, 432 + index * 12],
      ],
      6 + (index % 4),
      index % 5 ? '#303b32' : '#96967d',
      0.8,
    ),
  )
  content +=
    line('M1151 275L1170 319L1236 383M1170 319L1212 306M1225 362L1278 360', '#594a36', 6) +
    line('M1151 276L1170 320L1236 383M1225 362L1277 360', '#b09b72', 1.6, 0.8) +
    ellipse(1243, 387, 6, 6, '#a08b61') +
    line('M1243 394C1242 528 1143 619 1025 675Q1010 682 991 683', '#6c5d42', 3.1)
  content += folds(
    [
      [
        [1149, 511],
        [1165, 601],
        [1154, 695],
        [1114, 797],
      ],
      [
        [1234, 564],
        [1260, 645],
        [1272, 752],
        [1273, 839],
      ],
    ],
    '#bab29a',
    5,
    0.3,
  )
  return group('companion-horse', content)
}

function xiangYu() {
  let content = horse()
  content += group(
    'contrasting-crimson-cloak',
    path(
      'M676 463C616 461 566 490 548 542C530 597 522 710 491 810L453 923Q563 968 697 944L1022 944L1104 918C1050 805 1065 668 1040 564C1021 496 968 474 886 465Z',
      'url(#crimson)',
      1,
      pigment,
    ) +
      path('M576 541Q566 726 523 914L579 935Q624 763 622 585Z', '#492f2c', 0.45) +
      path('M994 553Q1007 702 1050 919L1009 932Q948 750 959 573Z', '#422f30', 0.5) +
      folds(
        [
          [
            [568, 632],
            [552, 751],
            [526, 850],
            [495, 917],
          ],
          [
            [1031, 639],
            [1025, 730],
            [1064, 868],
            [1086, 909],
          ],
          [
            [591, 897],
            [631, 916],
            [672, 924],
            [713, 931],
          ],
        ],
        '#cf8b66',
        5.3,
        0.55,
      ),
  )
  content += group(
    'under-robe',
    path(
      'M665 476Q613 485 600 545L590 697L618 799L594 939Q800 972 1000 941L971 794L985 618L958 522L883 479Z',
      'url(#umber)',
      1,
      pigment,
    ),
  )
  content += armor(
    'chest-armor',
    'M661 484L716 484L762 531L825 485L888 486Q944 510 958 575L940 784Q791 830 629 788L612 591Q618 517 661 484Z',
    621,
    532,
    325,
    255,
  )
  content += armor(
    'near-shoulder-armor',
    'M647 486Q588 488 566 543L562 595Q610 618 651 584L685 519Z',
    558,
    520,
    117,
    79,
  )
  content += armor(
    'far-shoulder-armor',
    'M875 487Q955 480 987 535L1003 586Q954 618 906 582L858 516Z',
    867,
    519,
    134,
    83,
  )
  content += path('M721 409L798 410L815 493L764 531L708 480Z', 'url(#warm-skin)')
  content += xiangHead() + collar(763, 482, 0.91, '#874639', '#bc9b6b')
  content += group(
    'near-arm',
    path(
      'M587 569C563 601 560 644 590 685Q622 722 703 738L741 703L719 674L647 660Q620 629 638 591Z',
      'url(#iron)',
      1,
      pigment,
    ) +
      path('M684 672L720 676L710 731L675 722Z', '#74654a') +
      path('M716 684Q735 681 755 691L774 704Q782 714 769 721L750 723L716 712Z', 'url(#warm-skin)') +
      line('M730 691L757 704M725 701L748 712M737 714L757 718', '#896043', 1.5),
  )
  content += group(
    'rein-arm',
    path(
      'M972 569Q1012 602 1016 648L1009 693L977 720L944 702L963 673L960 626L938 594Z',
      'url(#iron)',
      1,
      pigment,
    ) +
      path('M972 667L1007 672L1000 705L968 702Z', '#7f6a4c') +
      path(
        'M984 667L978 649Q977 635 987 636L1000 646L1007 660L1004 682L994 689L982 681Z',
        'url(#warm-skin)',
      ) +
      line('M985 650L996 659M984 659L996 668M987 673L996 679', '#8c6747', 1.4),
  )
  content += belt(627, 784, 318) + sword(635, 824, 14)
  content += folds(
    [
      [
        [678, 840],
        [659, 873],
        [649, 911],
        [650, 944],
      ],
      [
        [860, 847],
        [881, 890],
        [931, 923],
        [964, 939],
      ],
    ],
    '#b29470',
    4.8,
    0.55,
  )
  return content
}

function liuBang() {
  let content = group(
    'ink-violet-outer-mantle',
    path(
      'M730 470C664 465 600 497 581 555Q551 670 529 929Q619 962 714 945L1000 946L1094 924C1065 830 1069 656 1039 548Q1015 479 901 471Z',
      'url(#ink-violet)',
      1,
      pigment,
    ) +
      path('M614 562Q601 747 560 931L615 940Q665 751 665 557Z', '#252b34', 0.6) +
      path('M1008 553Q1004 733 1059 926L1015 940Q961 768 962 553Z', '#262b34', 0.6) +
      folds(
        [
          [
            [598, 662],
            [588, 768],
            [568, 868],
            [547, 918],
          ],
          [
            [1029, 640],
            [1035, 742],
            [1062, 860],
            [1075, 913],
          ],
        ],
        '#a08a88',
        4,
        0.55,
      ),
  )
  content += group(
    'warm-inner-robe',
    path(
      'M725 484Q686 500 678 564L664 734L680 816L656 942Q813 974 992 941L964 819L973 586Q964 509 897 485Z',
      'url(#russet)',
      1,
      pigment,
    ) +
      path('M718 552Q740 647 727 773L697 930L732 944Q781 780 769 592Z', '#574639', 0.4) +
      folds(
        [
          [
            [898, 577],
            [906, 645],
            [911, 686],
            [892, 745],
          ],
          [
            [747, 832],
            [732, 884],
            [724, 924],
            [720, 947],
          ],
          [
            [898, 832],
            [919, 888],
            [941, 926],
            [962, 943],
          ],
        ],
        '#d1b08a',
        4.5,
        0.5,
      ),
  )
  content += path('M771 412L847 414L869 493L812 540L756 487Z', 'url(#mature-skin)')
  content += liuHead() + collar(817, 482, 0.85, '#322f2b', '#bca275')
  content += group(
    'folded-sleeves',
    path(
      'M673 560Q628 579 625 639C624 683 648 715 693 733L836 750L861 711L843 683L722 678L714 613Z',
      'url(#russet)',
      1,
      pigment,
    ) +
      path(
        'M980 570Q1013 601 1000 651Q994 681 947 720L859 752L840 716L858 686L916 663L930 605Z',
        'url(#russet)',
        1,
        pigment,
      ) +
      path('M819 682L852 684L851 748L820 745Z', '#38372e') +
      path('M930 660L956 680L926 712L908 688Z', '#3e392f'),
  )
  content += group(
    'collected-hands',
    path('M850 699Q865 689 882 696L899 711Q900 723 885 727L850 724Z', 'url(#mature-skin)') +
      path('M884 695Q895 693 910 702L925 711L918 727L896 727L886 716Z', 'url(#mature-skin)') +
      line(
        'M857 706L879 710L888 716M858 716L878 721M898 703L915 714M897 715L910 723',
        '#866044',
        1.25,
      ),
  )
  content += belt(686, 800, 277, '#3c352b')
  content += folds(
    [
      [
        [637, 625],
        [640, 666],
        [665, 692],
        [709, 709],
      ],
      [
        [977, 622],
        [975, 651],
        [952, 679],
        [925, 690],
      ],
    ],
    '#c6a480',
    3.5,
    0.6,
  )
  return content
}

function zhangLiang() {
  let content = group(
    'deep-teal-outer-mantle',
    path(
      'M750 461Q690 462 650 489C618 514 607 564 595 626L555 909Q623 953 728 939L943 941L1054 920C1009 819 1027 672 1001 556Q988 493 901 467Z',
      'url(#teal)',
      1,
      pigment,
    ) +
      path('M655 522Q638 710 589 918L638 935Q692 745 699 534Z', '#1b343f', 0.65) +
      path('M959 519Q966 715 1019 919L973 934Q927 774 921 551Z', '#203640', 0.6) +
      folds(
        [
          [
            [618, 650],
            [610, 746],
            [591, 852],
            [572, 902],
          ],
          [
            [992, 634],
            [992, 746],
            [1011, 855],
            [1040, 910],
          ],
        ],
        '#81a0a0',
        4.3,
        0.65,
      ),
  )
  content += group(
    'ivory-inner-robe',
    path(
      'M744 479Q700 495 691 548L680 680L693 786L664 936Q805 967 972 938L942 799L949 605L930 521L880 480Z',
      'url(#ivory)',
      1,
      pigment,
    ) +
      path('M704 553Q728 654 710 777L688 934L722 942Q771 781 755 568Z', '#9c987c', 0.35) +
      folds(
        [
          [
            [895, 551],
            [910, 618],
            [903, 664],
            [885, 712],
          ],
          [
            [746, 829],
            [725, 873],
            [716, 916],
            [713, 940],
          ],
          [
            [889, 832],
            [910, 882],
            [943, 923],
            [958, 938],
          ],
        ],
        '#887f65',
        4.7,
        0.5,
      ),
  )
  content += path('M779 416L847 420L862 488L813 524L766 478Z', 'url(#fair-skin)')
  content += zhangHead() + collar(812, 477, 0.81, '#e8dcc0', '#596c58')
  content += group(
    'supporting-sleeve',
    path(
      'M691 566Q653 586 650 631Q649 680 696 703L783 723L823 702L826 675L718 655L718 609Z',
      'url(#ivory)',
      1,
      pigment,
    ) +
      path('M798 674L830 679L821 720L793 714Z', '#53644f') +
      path('M824 683L846 680L865 691L871 704L859 713L834 711L819 702Z', 'url(#fair-skin)') +
      line('M834 688L854 695M832 696L854 704M846 708L858 708', '#ab8664', 1.2),
  )
  content += belt(693, 785, 249, '#515b46')
  content += book(827, 641, 14, 0.78)
  content += group(
    'reading-sleeve-and-hand',
    path(
      'M961 570Q997 599 985 639L961 679L923 704L903 681L934 646L925 607Z',
      'url(#ivory)',
      1,
      pigment,
    ) +
      path('M926 649L951 666L930 698L905 681Z', '#53644f') +
      path(
        'M912 660L903 646L889 641Q878 643 884 654L891 668L898 684L911 683L921 675Z',
        'url(#fair-skin)',
      ) +
      line('M891 648L902 660M888 657L899 670M899 677L910 678', '#a78160', 1.15),
  )
  content += sword(966, 808, -14)
  content += folds(
    [
      [
        [660, 626],
        [662, 663],
        [697, 682],
        [750, 689],
      ],
      [
        [972, 610],
        [975, 635],
        [949, 659],
        [935, 671],
      ],
    ],
    '#f1e3c4',
    3.5,
    0.75,
  )
  return content
}

function bow(horizontal, vertical) {
  const shape =
    'M29 -229C-10 -216 -45 -197 -34 -169C-25 -144 3 -96 3 -51Q20 -19 18 0Q19 29 4 59C0 98 -33 150 -34 174Q-37 203 29 229L34 222Q-18 201 -22 175C-26 147 15 103 15 62Q33 29 30 0Q32 -28 15 -55C16 -101 -15 -146 -22 -170Q-30 -196 34 -221Z'
  return group(
    'strung-bow',
    path(shape, 'url(#horn)') +
      line('M30 -225L30 225', '#bbab80', 1.6) +
      line(
        'M30 -220C-33 -197 -26 -178 -21 -165C-7 -137 12 -97 10 -53Q27 -16 24 2Q26 32 11 62C9 111 -28 153 -27 177Q-25 199 30 224',
        '#c0a16c',
        1.1,
        0.8,
      ) +
      repeat(8, (index) => line(`M18 ${-15 + index * 4}L30 ${-13 + index * 4}`, '#4e4331', 2)),
    `translate(${horizontal} ${vertical}) rotate(-10)`,
  )
}

function liGuang() {
  let content = group(
    'dark-umber-mantle',
    path(
      'M744 461Q662 458 613 512C588 545 590 617 574 704L537 923Q623 955 709 942L1003 941L1092 922Q1056 794 1052 655Q1051 517 941 481L869 468Z',
      'url(#umber)',
      1,
      pigment,
    ) +
      path('M615 550Q624 751 573 930L628 941Q662 775 658 571Z', '#302e29', 0.6) +
      path('M1004 546Q997 716 1055 926L1007 940Q950 748 959 548Z', '#302d29', 0.65) +
      folds(
        [
          [
            [592, 681],
            [588, 768],
            [567, 865],
            [554, 918],
          ],
          [
            [1051, 668],
            [1047, 752],
            [1075, 856],
            [1078, 916],
          ],
        ],
        '#aa9272',
        3.8,
        0.55,
      ),
  )
  content += group(
    'quiver',
    path('M995 513L1044 507L1052 680L1001 688Z', '#79613e') +
      path('M991 509L1047 502L1049 518L994 525Z', '#b09260') +
      repeat(
        5,
        (index) =>
          line(
            `M${1002 + index * 9} 510L${1011 + index * 12} ${394 - (index % 2) * 15}`,
            '#b2a077',
            2.5,
          ) +
          path(`M${1011 + index * 12} ${394 - (index % 2) * 15}l-10 24l9 -6l10 -22Z`, '#77765c'),
      ),
  )
  content += group(
    'ochre-tunic',
    path(
      'M716 483L873 481Q944 506 967 571L963 778L990 939Q819 966 663 938L686 799L668 616Z',
      'url(#ochre)',
      1,
      pigment,
    ),
  )
  content += armor(
    'weathered-armor',
    'M723 485L771 495L820 541L879 488Q937 496 961 562L943 774Q822 812 686 780L680 586Q689 523 723 485Z',
    682,
    536,
    271,
    245,
    'old-iron',
  )
  content += path('M778 412L846 412L865 488L818 532L765 481Z', 'url(#old-skin)') + liHead()
  content += group(
    'quiver-harness',
    path('M986 514L997 521L916 698L900 709L841 581L853 575L908 687Z', '#4b3b2c') +
      line('M990 519L908 699L848 581', '#b39c71', 1.7, 0.85) +
      path('M901 691l12 -5l8 16l-12 6Z', '#ad9260'),
  )
  content += collar(817, 481, 0.8, '#bd9e71', '#ead0a0')
  content += bow(590, 651)
  content += group(
    'long-bow-arm',
    path(
      'M697 548Q663 548 645 588L618 650L633 681L665 680L709 621L722 568Z',
      'url(#ochre)',
      1,
      pigment,
    ) +
      path('M618 633L648 642L635 681L609 672Z', '#766045') +
      path(
        'M616 643L604 629Q597 614 604 606L614 607L623 619L627 637L634 648L626 662L615 656Z',
        'url(#old-skin)',
      ) +
      line('M607 614L615 621M607 623L618 630M613 635L622 641M617 648L626 652', '#7c563a', 1.3),
  )
  content += group(
    'resting-arm',
    path(
      'M974 562Q1013 590 1010 636L993 678L920 724L894 700L914 676L961 642L950 598Z',
      'url(#ochre)',
      1,
      pigment,
    ) +
      path('M920 675L942 697L915 724L895 705Z', '#6e5b41') +
      path('M905 695L889 683L870 685L855 698L858 711L879 721L899 714L910 704Z', 'url(#old-skin)') +
      line('M874 691L894 700M868 700L886 708M879 713L894 710', '#835c3c', 1.3),
  )
  content += belt(690, 781, 257) + sword(978, 813, -12)
  content += folds(
    [
      [
        [739, 833],
        [720, 876],
        [709, 917],
        [708, 943],
      ],
      [
        [880, 835],
        [907, 889],
        [947, 920],
        [976, 938],
      ],
    ],
    '#dac49b',
    4.5,
    0.6,
  )
  return content
}

function hanXin() {
  let content = group(
    'wine-red-mantle',
    path(
      'M743 463Q672 461 634 503C608 531 608 583 596 665L549 923Q638 955 733 941L995 942L1088 916C1044 812 1056 666 1029 555Q1011 489 903 468Z',
      'url(#wine)',
      1,
      pigment,
    ) +
      path('M641 545Q633 754 587 931L643 940Q686 757 686 557Z', '#392c35', 0.6) +
      path('M997 550Q995 763 1050 927L999 938Q944 753 947 554Z', '#422b36', 0.6) +
      folds(
        [
          [
            [614, 658],
            [603, 767],
            [583, 861],
            [568, 917],
          ],
          [
            [1024, 639],
            [1025, 736],
            [1053, 851],
            [1070, 909],
          ],
        ],
        '#b47b75',
        4,
        0.6,
      ),
  )
  content += group(
    'ivory-undergarment',
    path(
      'M735 487L898 487Q956 510 974 563L970 779L997 937Q833 969 673 940L695 797L680 604Z',
      'url(#ivory)',
      1,
      pigment,
    ),
  )
  content += armor(
    'command-armor',
    'M735 486L780 502L827 542L883 491Q941 505 965 568L948 779Q825 813 693 779L680 584Q689 517 735 486Z',
    686,
    538,
    272,
    241,
    'blue-iron',
  )
  content += armor(
    'near-shoulder-armor',
    'M716 486Q651 485 625 536L623 586Q670 612 714 579L752 517Z',
    622,
    517,
    123,
    79,
    'blue-iron',
  )
  content += armor(
    'far-shoulder-armor',
    'M895 487Q970 489 995 539L1001 581Q956 612 913 582L874 516Z',
    875,
    518,
    121,
    81,
    'blue-iron',
  )
  content +=
    path('M782 419L847 418L865 492L822 532L769 481Z', 'url(#young-skin)') +
    hanHead() +
    collar(822, 483, 0.79, '#e2cfaa', '#6d7461')
  content += group(
    'left-sleeve',
    path(
      'M656 581Q628 609 639 646Q655 678 717 698L788 716L811 687L798 663L722 648L700 609Z',
      'url(#ivory)',
      1,
      pigment,
    ) +
      path('M780 660L808 668L801 711L774 705Z', '#677361') +
      path('M804 675L825 668L846 677L856 692L848 703L826 705L802 693Z', 'url(#young-skin)') +
      line('M816 679L838 687M814 689L835 697M829 700L843 697', '#96704d', 1.2),
  )
  content += belt(698, 783, 250)
  content += book(849, 604, -9, 0.81)
  content += group(
    'right-sleeve',
    path(
      'M993 586Q1022 619 1006 657L964 698L929 708L913 681L948 650L953 608Z',
      'url(#ivory)',
      1,
      pigment,
    ) +
      path('M936 657L960 674L936 707L914 688Z', '#677361') +
      path(
        'M925 672L913 657L901 646L889 643Q880 646 885 654L895 666L899 681L912 690L926 684Z',
        'url(#young-skin)',
      ) +
      line('M891 649L908 666M890 659L903 675M904 682L916 684', '#98714f', 1.2),
  )
  content += sword(986, 812, -15)
  content += folds(
    [
      [
        [744, 833],
        [730, 876],
        [713, 920],
        [712, 944],
      ],
      [
        [893, 837],
        [916, 889],
        [952, 918],
        [981, 936],
      ],
      [
        [646, 617],
        [649, 649],
        [679, 671],
        [715, 680],
      ],
    ],
    '#9a947a',
    4.5,
    0.55,
  )
  return content
}

const studies = [
  {
    id: 'xiang-yu-chu-campaign',
    name: '项羽 · 沉雄',
    theme: '秦末楚汉 / 甲衣与骏马',
    note: '方阔颌面、浓眉短髯与沉雄视线；朱赭披风衬青铁甲，束腰收肩。五官与马色为艺术推演。',
    draw: xiangYu,
  },
  {
    id: 'liu-bang-han-founder',
    name: '刘邦 · 定汉',
    theme: '汉初 / 长冠与美须髯',
    note: '成熟长面、高鼻与垂髯，烟紫外氅衬赭褐内袍；依据隆准、美须髯塑形，非精确肖像或冠制复原。',
    draw: liuBang,
  },
  {
    id: 'zhang-liang-strategist',
    name: '张良 · 从容',
    theme: '楚汉汉初 / 清秀与简册',
    note: '清秀椭圆面、细眉敛目、无须；深靛青外衣与米白内袍明确分层，窄肩读简。五官与服色属推演。',
    draw: zhangLiang,
  },
  {
    id: 'li-guang-frontier-archer',
    name: '李广 · 守边',
    theme: '西汉 / 猿臂与弓矢',
    note: '长颧面、窄眼与灰短髯，风霜边将持弓；深褐披风、土黄袍袖和铁灰甲衣分层，非特定战役复原。',
    draw: liGuang,
  },
  {
    id: 'han-xin-campaign-strategy',
    name: '韩信 · 审势',
    theme: '楚汉汉初 / 札甲与筹策',
    note: '转向凝视的青年瘦长面、清晰颌线与无须口鼻；绛红披风衬青灰甲、米白袖，持简审势。面貌属原创推演。',
    draw: hanXin,
  },
]

export {
  definitions,
  path,
  line,
  ellipse,
  group,
  repeat,
  pigment,
  brush,
  folds,
  eye,
  face,
  ear,
  hairs,
  armor,
  collar,
  book,
  sword,
  belt,
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  mkdirSync(destination, { recursive: true })
  for (const study of studies) {
    const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}依据史料方向的原创代码彩墨，非可证实的本人肖像。透明背景；参考见 historical-references.md。</desc>${definitions}${study.draw()}</svg>`
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
        version: 2,
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
  console.log(
    'Redrew all five Qin-Han portraits with independent facial geometry and contrasting garment layers',
  )
}
