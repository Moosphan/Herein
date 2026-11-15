import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/travel-studies/ink-wash',
)
const ink = '#343d3c'
const grain = 'filter="url(#pigment)"'
const times = (count, draw) => Array.from({ length: count }, (_, index) => draw(index)).join('')
const path = (shape, color = ink, opacity = 1, extra = '') =>
  `<path d="${shape}" fill="${color}" opacity="${opacity}" ${extra}/>`
const line = (shape, color = ink, width = 2, opacity = 1) =>
  `<path d="${shape}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1, extra = '') =>
  `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${color}" opacity="${opacity}" ${extra}/>`
const transform = (content, position) => `<g transform="${position}">${content}</g>`
const group = (identity, content, extra = '') => `<g id="${identity}" ${extra}>${content}</g>`
const wash = (shape, color, opacity = 0.2) => path(shape, color, opacity, 'filter="url(#soft)"')
const gradients = [
  ['leaf', '#a8ac72', '#788b52', '#436550'],
  ['pink', '#efd1c6', '#cf929e', '#a95d7c'],
  ['yellow', '#edcf6e', '#d3ac4b', '#a27c38'],
  ['red', '#bd6551', '#9a463c', '#622f30'],
  ['wood', '#b89a69', '#8c6e4d', '#574a3d'],
  ['jade', '#d6dcc8', '#a5c4b7', '#608f8c'],
  ['silk', '#7889a8', '#526989', '#35475e'],
  ['stone', '#b0b2a2', '#8b958c', '#5b7271'],
  ['bird-blue', '#6cafa9', '#3a8792', '#295d7a'],
  ['brown', '#be9c68', '#98724c', '#63503e'],
  ['white', '#eee6d7', '#d8d6c4', '#a3b6b0'],
]
const definitions = `<defs>
<filter id="soft" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="pigment" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency=".39" numOctaves="2" seed="181" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .17 0 0 0 .83" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="paint"/><feTurbulence type="fractalNoise" baseFrequency=".041" numOctaves="2" seed="71" result="edge"/><feDisplacementMap in="paint" in2="edge" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>
${gradients.map(([identity, start, middle, end]) => `<linearGradient id="${identity}" x2="65%" y2="100%"><stop stop-color="${start}"/><stop offset=".47" stop-color="${middle}"/><stop offset="1" stop-color="${end}"/></linearGradient>`).join('')}
</defs>`

function brush(points, width, color = ink, opacity = 1) {
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
    const center = curve(fraction)
    const before = curve(Math.max(0, fraction - 0.003))
    const after = curve(Math.min(1, fraction + 0.003))
    const length = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
    const normal = [-(after[1] - before[1]) / length, (after[0] - before[0]) / length]
    const breadth =
      (width * (0.35 + 0.65 * Math.sin(Math.PI * fraction)) * (1 - fraction * 0.83)) / 2
    left.push(center.map((value, axis) => +(value + normal[axis] * breadth).toFixed(2)))
    right.unshift(center.map((value, axis) => +(value - normal[axis] * breadth).toFixed(2)))
  }
  return path(
    'M' + [...left, ...right].map((point) => point.join(' ')).join('L') + 'Z',
    color,
    opacity,
    grain,
  )
}

function leaf(horizontal, vertical, angle, scale = 1, color = 'url(#leaf)') {
  return transform(
    path('M0 0C-36 -19 -54 -88 -9 -141C22 -97 32 -34 0 0Z', color, 1, grain) +
      line('M0 -5Q-15 -65 -9 -126', '#c1c28d', 1.2, 0.48),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function branch(shape, width = 12, opacity = 1) {
  return `<g ${grain}>${line(shape, '#655a4b', width, opacity)}${line(shape, '#b2a17b', width * 0.19, opacity * 0.4)}</g>`
}

function flower(horizontal, vertical, scale, angle, color = 'url(#pink)') {
  return transform(
    times(5, (index) =>
      transform(
        path(
          'M0 5C-42 -1 -51 -35 -30 -53C-14 -64 3 -51 7 -34C30 -60 56 -28 29 -5Q16 9 0 5Z',
          color,
          1,
          grain,
        ),
        `rotate(${index * 72})`,
      ),
    ) +
      times(13, (index) => {
        const angle = index * 2.4
        const radius = 5 + (index % 4) * 3
        const horizontal = Math.cos(angle) * radius
        const vertical = Math.sin(angle) * radius
        return (
          line(`M0 0L${horizontal} ${vertical}`, '#956b3c', 1.1, 0.7) +
          ellipse(horizontal, vertical, 2.2, 2.4, '#d0a14e')
        )
      }) +
      ellipse(0, 0, 4, 4, '#895744'),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

const materialDefinitions =
  '<defs>' +
  [
    ['orange', '#e9bd61', '#d89443', '#a36136'],
    ['hemp', '#d2bb87', '#ad955f', '#796b4d'],
    ['paper', '#eee5cd', '#d9c8a4', '#b6a785'],
    ['rose', '#e6a4a7', '#bf738a', '#934d70'],
    ['steel', '#a9b8b1', '#7a8e8d', '#455d64'],
    ['book', '#8b9da5', '#576f85', '#394c66'],
  ]
    .map(
      ([identity, start, middle, end]) =>
        '<linearGradient id="' +
        identity +
        '" x2="60%" y2="100%"><stop stop-color="' +
        start +
        '"/><stop offset=".48" stop-color="' +
        middle +
        '"/><stop offset="1" stop-color="' +
        end +
        '"/></linearGradient>',
    )
    .join('') +
  '</defs>'

const polygon = (points, color, opacity = 1, extra = grain) =>
  path('M' + points.map((point) => point.join(' ')).join('L') + 'Z', color, opacity, extra)

function stone(horizontal, vertical, scale = 1) {
  return transform(
    wash('M-175 27Q-25 -12 169 32L127 61L-148 62Z', '#7b9281', 0.15) +
      path(
        'M-150 21L-129 -81L-61 -144L-13 -119L42 -164L126 -92L153 25L61 55L-74 48Z',
        'url(#stone)',
        1,
        grain,
      ) +
      path('M42 -164L24 -44L61 55L153 25L126 -92Z', '#52736c', 0.45, grain) +
      times(14, (index) =>
        brush(
          [
            [-107 + (index % 4) * 45, -86 + Math.floor(index / 4) * 33],
            [-125 + (index % 4) * 45, -72 + Math.floor(index / 4) * 33],
            [-101 + (index % 4) * 45, -45 + Math.floor(index / 4) * 33],
            [-109 + (index % 4) * 45, -33 + Math.floor(index / 4) * 33],
          ],
          3 + (index % 3),
          '#5e776c',
          0.48,
        ),
      ) +
      times(12, (index) =>
        ellipse(
          -124 + index * 22,
          30 + Math.sin(index * 2) * 7,
          4 + (index % 4),
          2,
          '#4d6952',
          0.6,
        ),
      ),
    'translate(' + horizontal + ' ' + vertical + ') scale(' + scale + ')',
  )
}

function kumquat() {
  const branchwork =
    branch('M502 829Q670 664 761 447Q867 271 1067 241', 19) +
    branch('M698 580Q562 470 445 344', 10) +
    branch('M760 454Q947 492 1142 603', 10) +
    branch('M886 318Q838 255 795 220', 7)
  const leaves = [
    [455, 355, -35, 0.78],
    [520, 417, 62, 0.8],
    [612, 509, -47, 0.84],
    [699, 585, 78, 0.82],
    [763, 451, -38, 0.8],
    [824, 369, 56, 0.72],
    [873, 326, -36, 0.7],
    [973, 265, 57, 0.8],
    [1040, 248, -31, 0.7],
    [942, 499, 79, 0.7],
    [1058, 554, -30, 0.8],
    [1112, 584, 54, 0.72],
    [832, 268, -32, 0.7],
  ]
  return (
    group('branchwork', branchwork) +
    group(
      'leaf-clusters',
      leaves
        .map(([horizontal, vertical, angle, scale]) =>
          leaf(horizontal, vertical, angle, scale, '#607d50'),
        )
        .join(''),
    ) +
    group(
      'golden-fruits',
      [
        [497, 433, 31],
        [641, 574, 36],
        [783, 517, 34],
        [907, 380, 32],
        [1041, 319, 29],
        [1026, 588, 36],
        [1153, 645, 31],
      ]
        .map(
          ([horizontal, vertical, radius]) =>
            line(
              'M' + horizontal + ' ' + (vertical - 42) + 'L' + horizontal + ' ' + (vertical - 12),
              '#736441',
              2.8,
            ) +
            ellipse(horizontal, vertical, radius, radius * 1.16, 'url(#orange)', 1, grain) +
            path(
              'M-7 -3L-3 -8L2 -4L8 -6L5 1L0 3Z',
              '#667347',
              1,
              'transform="translate(' + horizontal + ' ' + (vertical - radius) + ')"',
            ) +
            times(17, (index) =>
              ellipse(
                horizontal + Math.cos(index * 2.4) * radius * 0.7,
                vertical + Math.sin(index * 2.4) * radius * 0.83,
                0.9,
                0.9,
                '#a67837',
                0.45,
              ),
            ),
        )
        .join(''),
    )
  )
}

function quince() {
  return (
    group(
      'branches',
      branch('M401 319Q651 339 816 510Q945 681 1120 814', 23) +
        branch('M669 387Q824 297 1056 332', 12) +
        branch('M854 553Q677 599 520 568', 10),
    ) +
    group(
      'leaves',
      [
        [474, 331, -48, 0.8],
        [565, 354, 102, 0.9],
        [674, 392, 15, 0.9],
        [779, 473, 136, 0.9],
        [861, 560, 60, 0.8],
        [962, 684, 93, 0.7],
        [1045, 757, 60, 0.7],
        [921, 325, -40, 0.8],
        [1008, 330, 58, 0.9],
        [699, 584, 128, 0.8],
        [586, 574, -50, 0.8],
      ]
        .map(([horizontal, vertical, angle, scale]) => leaf(horizontal, vertical, angle, scale))
        .join(''),
    ) +
    group(
      'heavy-fruit',
      [
        [594, 458, 0.9, -7],
        [897, 401, 1, 11],
        [757, 665, 1.13, -5],
        [1062, 822, 0.75, 10],
      ]
        .map(([horizontal, vertical, scale, angle]) =>
          transform(
            line('M0 -111Q-7 -84 0 -65', '#705b3c', 5) +
              path(
                'M0 -71Q-70 -88 -81 -30Q-96 22 -53 74Q-19 112 17 102Q80 86 88 24Q96 -47 47 -65Q21 -79 0 -71Z',
                'url(#yellow)',
                1,
                grain,
              ) +
              wash('M-48 -51Q-12 -70 12 -51L-5 89Q-58 74 -62 17Z', '#e8cc89', 0.24) +
              brush(
                [
                  [10, -66],
                  [34, -32],
                  [21, 42],
                  [26, 88],
                ],
                3,
                '#9d823e',
                0.6,
              ) +
              line('M-8 98L-2 90L5 99L13 91', '#78613c', 2),
            'translate(' +
              horizontal +
              ' ' +
              vertical +
              ') rotate(' +
              angle +
              ') scale(' +
              scale +
              ')',
          ),
        )
        .join(''),
    )
  )
}

function goldenStamens(horizontal, vertical, scale, angle) {
  return transform(
    times(5, (index) =>
      transform(
        path(
          'M0 0C-40 2 -70 -36 -51 -65Q-23 -88 -2 -48Q25 -72 46 -46Q62 -8 0 0Z',
          'url(#yellow)',
          1,
          grain,
        ),
        'rotate(' + index * 72 + ')',
      ),
    ) +
      times(62, (index) => {
        const angle = index * 2.399,
          radius = 14 + Math.sqrt(index / 62) * 54
        const horizontal = Math.cos(angle) * radius,
          vertical = Math.sin(angle) * radius
        return (
          line(
            'M0 0Q' +
              horizontal * 0.43 +
              ' ' +
              (vertical * 0.6 - 12) +
              ' ' +
              horizontal +
              ' ' +
              vertical,
            '#ba913c',
            1.3,
            0.85,
          ) + ellipse(horizontal, vertical, 2, 2.3, '#d6aa48')
        )
      }) +
      ellipse(0, 0, 5, 5, '#a67e35'),
    'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
  )
}

function hypericum() {
  return (
    group('rocks', stone(991, 796, 1.06)) +
    group(
      'stems',
      branch('M539 843Q613 620 691 362', 11) +
        branch('M618 615Q822 498 1044 419', 8) +
        branch('M661 463Q555 453 474 378', 6),
    ) +
    group(
      'paired-leaves',
      [
        [583, 714, -58, 0.85],
        [583, 714, 69, 0.7],
        [626, 598, -52, 0.75],
        [626, 598, 69, 0.8],
        [671, 430, -53, 0.7],
        [671, 430, 58, 0.7],
        [809, 510, -25, 0.73],
        [809, 510, 90, 0.75],
        [959, 450, -18, 0.7],
        [959, 450, 95, 0.6],
      ]
        .map(([horizontal, vertical, angle, scale]) => leaf(horizontal, vertical, angle, scale))
        .join(''),
    ) +
    group(
      'flowers',
      goldenStamens(688, 339, 0.96, -12) +
        goldenStamens(1050, 407, 1.02, 20) +
        goldenStamens(477, 369, 0.72, -8),
    ) +
    group(
      'bud',
      line('M816 509Q870 445 873 398', '#748358', 4) +
        ellipse(873, 393, 17, 22, '#bba458', 1, grain),
    )
  )
}

function bleedingHeart() {
  const blossom = (horizontal, vertical, scale, angle) =>
    transform(
      path(
        'M-5 -29C-20 -67 -60 -55 -60 -17C-59 14 -39 39 -24 50Q-19 36 -6 27Q-12 8 -5 -29Z',
        '#bd5e80',
        1,
        grain,
      ) +
        path(
          'M-5 -29C6 -64 47 -61 56 -29C69 8 44 31 22 49Q16 32 5 26Q12 4 -5 -29Z',
          'url(#rose)',
          1,
          grain,
        ) +
        path('M-40 -42Q-54 -18 -41 14L-30 30Q-41 -5 -29 -42Z', '#efb9c6', 0.25, grain) +
        path('M26 -41Q44 -24 38 4L25 25Q35 -9 19 -38Z', '#f5cad1', 0.2, grain) +
        path('M-9 19Q-20 48 -8 71Q-1 80 9 68Q21 45 9 19Q0 25 -9 19Z', '#f2eee2', 1, grain) +
        path('M0 29Q-7 54 0 73Q12 54 8 27Z', '#c8c9bc', 0.6, grain) +
        path(
          'M-29 35Q-36 55 -51 49Q-42 65 -26 58Q-15 52 -13 36ZM27 34Q35 53 49 45Q45 62 28 58Q16 53 13 37Z',
          '#ac4c73',
          1,
          grain,
        ) +
        line('M-6 -28Q-3 -5 -7 17M8 26Q13 49 4 68', '#9b456b', 1.4, 0.55),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  const lobedLeaf = (horizontal, vertical, scale, angle, color) =>
    transform(
      path(
        'M0 0C-29 -9 -61 -12 -65 -39Q-44 -43 -32 -40Q-64 -66 -49 -91Q-29 -82 -17 -70Q-32 -109 -9 -133Q10 -119 15 -94Q29 -119 43 -112Q55 -84 35 -58Q58 -65 71 -48Q65 -21 39 -17Q22 -13 0 0Z',
        color,
        1,
        grain,
      ) + line('M0 -1Q-4 -63 -9 -119M-3 -38L-45 -64M-5 -56L35 -85', '#bfbd8a', 1.6, 0.5),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  const compound = (horizontal, vertical, scale, angle, color) =>
    transform(
      line('M0 0Q-4 -53 3 -110M0 -37L-49 -62M0 -54L48 -82', '#697a50', 4) +
        lobedLeaf(-49, -62, 0.68, -48, color) +
        lobedLeaf(48, -82, 0.66, 48, color) +
        lobedLeaf(3, -110, 0.8, 0, color),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  const flowerAxis = (fraction) => ({
    horizontal:
      (1 - fraction) ** 3 * 529 +
      3 * (1 - fraction) ** 2 * fraction * 681 +
      3 * (1 - fraction) * fraction ** 2 * 1054 +
      fraction ** 3 * 1210,
    vertical:
      (1 - fraction) ** 3 * 405 +
      3 * (1 - fraction) ** 2 * fraction * 196 +
      3 * (1 - fraction) * fraction ** 2 * 239 +
      fraction ** 3 * 478,
  })
  const blooms = [0.1, 0.25, 0.4, 0.55, 0.69, 0.82]
    .map((fraction, index) => {
      const root = flowerAxis(fraction)
      const scale = [0.84, 1.04, 1.12, 1.08, 0.94, 0.78][index]
      const horizontal = root.horizontal + 6
      const vertical = root.vertical + 62 + index * 2
      return (
        line(
          `M${root.horizontal} ${root.vertical}Q${horizontal - 8} ${vertical - 28} ${horizontal} ${vertical}`,
          '#7f725b',
          2.6,
        ) + blossom(horizontal, vertical + 30 * scale, scale, [-8, -4, 2, 5, 9, 14][index])
      )
    })
    .join('')
  return (
    group('root-stones', stone(494, 848, 0.48)) +
    group(
      'herbaceous-stems',
      line('M619 850C583 699 483 536 529 405C681 196 1054 239 1210 478', '#758158', 6) +
        line(
          'M620 849Q674 677 853 615M605 792Q454 650 418 621M595 735Q684 577 734 548',
          '#79875b',
          5,
        ) +
        line('M529 405C681 196 1054 239 1210 478', '#a5a678', 1.7, 0.8),
    ) +
    group(
      'soft-compound-foliage',
      compound(570, 740, 1.05, -67, '#81946c') +
        compound(642, 754, 1.03, 55, 'url(#leaf)') +
        compound(734, 548, 0.8, 35, '#869b76') +
        compound(853, 615, 0.9, 61, '#5d7c60') +
        compound(418, 621, 0.72, -41, '#688768'),
    ) +
    group('pendent-flowers', blooms) +
    group(
      'terminal-buds',
      line('M1201 466Q1226 471 1228 505', '#7f725b', 2.3) +
        transform(
          path('M0 0Q-28 6 -21 33Q-9 48 0 56Q19 36 17 19Q14 4 0 0Z', 'url(#rose)', 1, grain),
          'translate(1228 505) rotate(-15) scale(.65)',
        ),
    )
  )
}

function planeLeaf(horizontal, vertical, scale, angle) {
  return transform(
    path(
      'M0 0L-95 -44L-121 -112L-74 -95L-82 -169L-27 -138L0 -222L37 -151L95 -176L82 -104L139 -111L106 -49L47 -29Z',
      'url(#leaf)',
      1,
      grain,
    ) + line('M0 -5L0 -203M0 -33L-86 -111M0 -53L88 -122', '#c3c493', 2, 0.4),
    'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
  )
}
function cicada() {
  const insect =
    times(3, (index) =>
      [-1, 1]
        .map((side) =>
          line(
            'M' +
              side * 18 +
              ' ' +
              (-24 + index * 13) +
              'L' +
              side * (49 + index * 5) +
              ' ' +
              (-36 + index * 35) +
              'L' +
              side * 13 +
              ' ' +
              (-7 + index * 32) +
              'l' +
              -side * 6 +
              ' 7',
            '#655b3d',
            3.5,
          ),
        )
        .join(''),
    ) +
    path('M-23 3Q-35 61 0 116Q35 62 22 3Z', '#6f7150', 1, grain) +
    times(5, (index) =>
      line(
        'M-18 ' + (27 + index * 15) + 'Q0 ' + (38 + index * 15) + ' 18 ' + (27 + index * 15),
        '#3e5448',
        2,
        0.7,
      ),
    ) +
    [-1, 1]
      .map((side) =>
        transform(
          path('M-5 -16C-68 0 -86 103 -38 160Q6 160 9 73Z', '#b2b68e', 0.49, grain) +
            line(
              'M-6 -11Q-38 77 -38 153M-11 11L-50 41L-54 85L-35 129M-18 35L-4 72L-32 108M-49 44L-25 55M-54 85L-33 78',
              '#697e62',
              1.7,
              0.65,
            ),
          'scale(' + side + ' 1)',
        ),
      )
      .join('') +
    path('M-23 -28Q0 -48 25 -26L28 9Q0 30 -28 9Z', '#657354', 1, grain) +
    ellipse(0, -45, 29, 18, '#7d8055', 1, grain) +
    ellipse(-24, -46, 6.5, 7, '#433f30') +
    ellipse(24, -46, 6.5, 7, '#433f30') +
    line('M-11 -56L-21 -72M10 -56L18 -72', '#6e6240', 2)
  return (
    group(
      'branch',
      branch('M411 782Q712 583 1058 282', 29) + branch('M741 527Q951 563 1170 486', 10),
    ) +
    group(
      'leaves',
      planeLeaf(692, 582, 1.3, -60) +
        planeLeaf(978, 536, 1.09, 53) +
        planeLeaf(1008, 326, 0.85, 15),
    ) +
    group('resting-cicada', transform(insect, 'translate(833 469) rotate(42) scale(1.05)'))
  )
}

function dianthusBloom(horizontal, vertical, scale, angle) {
  return transform(
    times(5, (index) =>
      transform(
        path(
          'M0 7Q-24 -6 -35 -35L-32 -53L-22 -45L-17 -61L-9 -50L-1 -65L7 -51L18 -62L22 -45L34 -50Q33 -12 0 7Z',
          'url(#rose)',
          1,
          grain,
        ) + line('M0 0L-6 -46M0 0L15 -43', '#9f5c78', 1, 0.45),
        'rotate(' + index * 72 + ')',
      ),
    ) +
      ellipse(0, 0, 8, 8, '#f0d2bc') +
      times(7, (index) => ellipse(Math.cos(index) * 7, Math.sin(index) * 7, 1.6, 1.6, '#8d5468')),
    'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
  )
}
function butterfly(horizontal, vertical, scale, angle) {
  return transform(
    path(
      'M-3 -19C-41 -120 -125 -130 -120 -52Q-117 10 -32 22C-109 8 -110 92 -54 91Q-22 87 -6 36Z',
      'url(#orange)',
      1,
      grain,
    ) +
      path(
        'M4 -19C33 -89 94 -119 104 -63Q115 -14 28 20C84 8 98 61 63 78Q26 98 7 33Z',
        'url(#pink)',
        1,
        grain,
      ) +
      path('M-112 -74Q-95 -110 -66 -82L-36 -5Q-96 -28 -112 -74Z', '#6b6450', 0.63, grain) +
      path('M94 -76Q80 -94 55 -67L25 -3Q80 -23 94 -76Z', '#695c50', 0.55, grain) +
      times(9, (index) =>
        ellipse(-105 + index * 9, -61 + Math.sin(index * 0.4) * 29, 3, 4, '#eadbb8', 0.85),
      ) +
      times(7, (index) =>
        ellipse(34 + index * 8, -47 + Math.sin(index * 0.5) * 20, 2.6, 3.2, '#f1dfc6', 0.8),
      ) +
      path('M-5 -30Q-16 12 -2 64Q13 26 5 -29Z', '#4f5841', 1, grain) +
      ellipse(0, -36, 8, 8, '#4b4f3b') +
      line('M-4 -41Q-10 -69 -26 -70M4 -41Q12 -63 25 -62', '#655b41', 2),
    'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
  )
}
function butterfliesDianthus() {
  return (
    group('stone-setting', stone(999, 823, 0.88)) +
    group(
      'slender-stems',
      [
        [547, 423],
        [716, 351],
        [835, 532],
        [973, 464],
      ]
        .map(([horizontal, vertical]) =>
          line(
            'M' +
              (horizontal + 44) +
              ' 852Q' +
              (horizontal - 46) +
              ' 646 ' +
              horizontal +
              ' ' +
              vertical,
            '#6c8456',
            4,
          ),
        )
        .join(''),
    ) +
    group(
      'narrow-leaves',
      [
        [568, 742, -67],
        [574, 718, 72],
        [702, 635, -64],
        [714, 580, 62],
        [853, 724, 70],
        [929, 668, -61],
        [929, 625, 65],
      ]
        .map(([horizontal, vertical, angle]) =>
          transform(
            path('M0 0Q-14 -60 0 -137Q10 -69 0 0Z', 'url(#leaf)', 1, grain),
            'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ')',
          ),
        )
        .join(''),
    ) +
    group(
      'flowers',
      dianthusBloom(547, 421, 0.85, 4) +
        dianthusBloom(716, 350, 1, 15) +
        dianthusBloom(835, 532, 0.8, -10) +
        dianthusBloom(973, 464, 0.78, 10),
    ) +
    group('butterflies', butterfly(1091, 279, 0.83, 23) + butterfly(465, 599, 0.58, -27))
  )
}

function brushCup() {
  const pen = (horizontal, vertical, angle, length, width, color) =>
    transform(
      path('M-8 0L-6 ' + -length + 'L7 ' + -length + 'L9 0Z', color, 1, grain) +
        path(
          'M-6 ' +
            -length +
            'Q-28 ' +
            (-length - 49) +
            ' 0 ' +
            (-length - 106) +
            'Q26 ' +
            (-length - 52) +
            ' 7 ' +
            -length +
            'Z',
          'url(#white)',
          1,
          grain,
        ) +
        path(
          'M-5 ' +
            (-length - 38) +
            'Q-8 ' +
            (-length - 79) +
            ' 0 ' +
            (-length - 106) +
            'Q9 ' +
            (-length - 76) +
            ' 5 ' +
            (-length - 34) +
            'Z',
          '#424f46',
          1,
          grain,
        ) +
        line('M-6 ' + (-length + 12) + 'L7 ' + (-length + 12), '#574d39', 4),
      'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + width + ' 1)',
    )
  return (
    group(
      'bamboo-container',
      path('M621 514L639 795Q800 876 979 791L994 513Z', 'url(#wood)', 1, grain) +
        ellipse(809, 515, 188, 62, '#ad9566', 1, grain) +
        ellipse(809, 510, 163, 42, '#4c5540') +
        group(
          'held-brushes',
          pen(728, 582, -17, 240, 1.5, '#866447') +
            pen(798, 577, -5, 278, 1.3, '#b39a63') +
            pen(881, 584, 16, 239, 1.4, '#5c6b5c'),
        ) +
        path('M621 517Q799 599 994 517L979 791Q800 876 639 795Z', 'url(#wood)', 1, grain) +
        line('M633 547Q806 620 987 547M641 769Q811 840 982 768', '#685c40', 10, 0.7) +
        times(15, (index) =>
          line(
            'M' +
              (652 + index * 22) +
              ' ' +
              (561 + Math.sin((index / 14) * Math.PI) * 31) +
              'Q' +
              (657 + index * 22) +
              ' 682 ' +
              (663 + index * 21) +
              ' ' +
              (790 + Math.sin((index / 14) * Math.PI) * 28),
            '#c6b27a',
            2,
            0.4,
          ),
        ),
    ) +
    group(
      'book-rest',
      polygon(
        [
          [389, 809],
          [550, 748],
          [690, 810],
          [527, 876],
        ],
        'url(#book)',
      ) +
        polygon(
          [
            [389, 809],
            [527, 862],
            [690, 799],
            [690, 816],
            [527, 882],
            [389, 828],
          ],
          '#4c5d64',
        ) +
        line('M410 811L527 858L671 804', '#d0c6a4', 9, 0.85),
    )
  )
}

function scissorsCloth() {
  const scissors = transform(
    path('M0 0L155 -66Q192 -80 229 -88L49 29Z', 'url(#steel)', 1, grain) +
      path('M0 0L171 61Q200 73 222 103L35 43Z', 'url(#steel)', 1, grain) +
      line('M0 5L-63 -22M10 20L-66 46', '#536867', 20) +
      '<path d="M-81 -92C-148 -118 -190 -37 -130 -11C-72 13 -27 -65 -81 -92ZM-88 -70C-117 -84 -148 -43 -122 -30C-94 -14 -62 -56 -88 -70Z" fill="#526b6a" fill-rule="evenodd" ' +
      grain +
      '/>' +
      '<path d="M-91 36C-151 13 -190 90 -132 119C-74 146 -34 64 -91 36ZM-97 59C-123 46 -153 86 -126 100C-99 114 -70 73 -97 59Z" fill="#6c7e77" fill-rule="evenodd" ' +
      grain +
      '/>' +
      ellipse(7, 17, 18, 17, '#9d9778') +
      ellipse(7, 17, 6, 6, '#58645a'),
    'translate(749 543) rotate(-16) scale(1.15)',
  )
  return (
    '<defs><clipPath id="cloth">' +
    path('M399 554L881 399L1211 623L1126 809L673 882L451 738Z') +
    '</clipPath></defs>' +
    group(
      'folded-cloth',
      path('M399 554L881 399L1211 623L1126 809L673 882L451 738Z', 'url(#silk)', 1, grain) +
        path('M451 738L673 882L1126 809L1049 763L683 831Z', '#314a69', 0.6, grain) +
        '<g clip-path="url(#cloth)">' +
        times(36, (index) =>
          line(
            'M' + (341 + index * 25) + ' 417L' + (691 + index * 25) + ' 933',
            '#c2b38b',
            1.8,
            0.3,
          ),
        ) +
        times(17, (index) =>
          line('M385 ' + (478 + index * 23) + 'L1222 ' + (268 + index * 23), '#a8b2ae', 1, 0.2),
        ) +
        '</g>',
    ) +
    group('scissors', scissors) +
    group(
      'wooden-ruler',
      polygon(
        [
          [464, 733],
          [1035, 555],
          [1061, 585],
          [489, 766],
        ],
        'url(#wood)',
      ) +
        times(31, (index) =>
          line(
            'M' +
              (483 + index * 18) +
              ' ' +
              (733 - index * 5.6) +
              'L' +
              (487 + index * 18) +
              ' ' +
              (746 - index * 5.6 + (index % 5 === 0 ? 8 : 0)),
            '#5c5a44',
            2,
            0.9,
          ),
        ),
    )
  )
}

function umbrella() {
  const center = [807, 246],
    edgeCenter = [807, 497],
    radiusX = 387,
    radiusY = 99
  const rim = (angle) => [
    edgeCenter[0] + Math.cos(angle) * radiusX,
    edgeCenter[1] + Math.sin(angle) * radiusY,
  ]
  const sector = (index) => {
    const start = (index * Math.PI) / 8,
      end = ((index + 1) * Math.PI) / 8
    const first = rim(start),
      last = rim(end),
      middle = rim((start + end) / 2)
    return path(
      'M' +
        center.join(' ') +
        'Q' +
        [(center[0] + first[0]) * 0.5, center[1] + 79].join(' ') +
        ' ' +
        first.join(' ') +
        'Q' +
        [middle[0], middle[1] + 9].join(' ') +
        ' ' +
        last.join(' ') +
        'Q' +
        [(center[0] + last[0]) * 0.5, center[1] + 79].join(' ') +
        ' ' +
        center.join(' ') +
        'Z',
      ['#d8be88', '#e2cc9c', '#cbb27f', '#d4b683'][index % 4],
      1,
      grain,
    )
  }
  let panels = ''
  for (let index = 0; index < 8; index++) panels += sector(index)
  let canopy = 'M807 246Q1000.5 325 1194 497'
  for (let index = 0; index < 8; index++) {
    const middle = rim(((index + 0.5) * Math.PI) / 8),
      end = rim(((index + 1) * Math.PI) / 8)
    canopy += 'Q' + [middle[0], middle[1] + 9].join(' ') + ' ' + end.join(' ')
  }
  canopy += 'Q613.5 325 807 246Z'
  return (
    '<defs><clipPath id="canopy-edge">' +
    path(canopy) +
    '</clipPath></defs>' +
    group(
      'shaft',
      line('M807 247L807 815', '#806343', 14) +
        line('M803 511L803 790', '#baa06c', 3, 0.6) +
        line('M807 814Q807 875 765 872Q729 868 743 834', '#836145', 15),
    ) +
    group('paper-canopy', panels) +
    group(
      'ribs',
      times(9, (index) => {
        const end = rim((index * Math.PI) / 8)
        return (
          line(
            'M' +
              center.join(' ') +
              'Q' +
              [(center[0] + end[0]) * 0.5, center[1] + 79].join(' ') +
              ' ' +
              end.join(' '),
            '#91774c',
            2.4,
            0.65,
          ) + ellipse(end[0], end[1], 4, 3, '#806341')
        )
      }) + ellipse(807, 244, 11, 8, '#806445'),
    ) +
    group(
      'painted-plum',
      branch('M869 492Q978 423 1047 449', 5) +
        branch('M948 451Q939 433 943 421', 3) +
        flower(943, 423, 0.25, 11, '#ad675c') +
        flower(987, 451, 0.28, 20, '#a95e53') +
        flower(1040, 451, 0.22, 5, '#b97364'),
      'clip-path="url(#canopy-edge)"',
    )
  )
}

function rainCape() {
  const cape =
    'M872 355Q924 337 968 361L985 393Q1074 406 1142 466L1089 529L1105 825Q913 874 724 812L758 531L703 479Q769 412 852 396Z'
  let layers = ''
  for (let row = 0; row < 7; row++)
    layers +=
      line(
        'M728 ' + (450 + row * 48) + 'Q924 ' + (465 + row * 48) + ' 1122 ' + (450 + row * 48),
        '#8a7b50',
        2.5,
        0.55,
      ) +
      times(30, (index) => {
        const horizontal = 748 + index * 12,
          rowTop = 446 + row * 48
        return brush(
          [
            [horizontal, rowTop],
            [horizontal - 8, rowTop + 18],
            [horizontal - 10 + (index % 5) * 3, rowTop + 64],
            [horizontal - 14 + (index % 5) * 5, rowTop + 89 + (index % 4) * 7],
          ],
          7 + (index % 3) * 2,
          index % 3 === 0 ? '#756a4a' : index % 3 === 1 ? '#b5a372' : '#c4b27d',
          0.8,
        )
      })
  const hat =
    path('M-246 42Q-2 130 248 40L24 -128Q-9 -143 -32 -122Z', 'url(#hemp)', 1, grain) +
    ellipse(1, 44, 244, 69, '#776b49', 1, grain) +
    path('M-246 42Q-1 106 248 40L24 -128Q-9 -143 -32 -122Z', 'url(#hemp)', 1, grain) +
    times(39, (index) => {
      const angle = (Math.PI * index) / 38,
        end = [Math.cos(angle) * 244, 44 + Math.sin(angle) * 60]
      return line('M0 -127Q' + end[0] * 0.45 + ' -22 ' + end.join(' '), '#8b7952', 1.8, 0.6)
    }) +
    line('M-241 43Q0 114 243 43', '#796847', 7, 0.8) +
    line('M-40 86Q-56 169 18 181Q85 180 88 118', '#7e7450', 4)
  return (
    '<defs><clipPath id="cape-edge">' +
    path(cape) +
    '</clipPath></defs>' +
    group('wooden-hanger', branch('M885 366L915 292L944 367', 12) + branch('M885 365L944 366', 9)) +
    group(
      'straw-cape',
      path(cape, '#8c8059', 1, grain) +
        '<g clip-path="url(#cape-edge)">' +
        layers +
        '</g>' +
        path(
          'M852 396L872 355Q920 336 968 361L985 393L944 429L919 402L889 425Z',
          '#746c4e',
          1,
          grain,
        ) +
        line(
          'M889 425Q920 463 944 429M889 425Q868 447 844 475M944 429Q969 444 987 474',
          '#c4b17d',
          5,
        ),
    ) +
    group('conical-hat', transform(hat, 'translate(512 656) rotate(-11) scale(.84)'))
  )
}

function booksCase() {
  const shape = 'M473 573L887 452L1157 586L746 724Z'
  const book = (offset, color) => {
    return transform(
      polygon(
        [
          [482, 529],
          [879, 415],
          [1116, 535],
          [723, 660],
        ],
        color,
      ) +
        polygon(
          [
            [482, 529],
            [723, 650],
            [1116, 525],
            [1116, 548],
            [723, 676],
            [482, 553],
          ],
          '#d2c5a5',
        ) +
        line('M492 540L723 657L1106 537', '#e8d9b7', 3, 0.8) +
        times(6, (index) =>
          line(
            'M' +
              (501 + index * 29) +
              ' ' +
              (537 + index * 14) +
              'L' +
              (509 + index * 29) +
              ' ' +
              (554 + index * 14),
            '#e5d5b1',
            3,
            0.9,
          ),
        ) +
        polygon(
          [
            [797, 478],
            [940, 441],
            [981, 462],
            [838, 502],
          ],
          '#dbd0b5',
        ) +
        line('M829 482L924 457M838 488L948 461', '#87958d', 2, 0.55),
      'translate(0 ' + offset + ')',
    )
  }
  return (
    group(
      'case',
      path(shape, 'url(#book)', 1, grain) +
        polygon(
          [
            [473, 573],
            [746, 710],
            [1157, 576],
            [1157, 733],
            [747, 882],
            [473, 735],
          ],
          '#475c71',
        ) +
        polygon(
          [
            [473, 573],
            [746, 710],
            [747, 882],
            [473, 735],
          ],
          '#60748a',
        ) +
        line('M486 720L747 861L1144 721', '#bdad85', 3, 0.8),
    ) +
    group('stacked-volumes', book(102, '#8a767a') + book(63, '#6b8186') + book(23, '#687b92')) +
    group(
      'ribbon',
      path('M812 486L851 476L1050 572L1060 718L1016 734L1010 594Z', '#a38c65', 0.9, grain),
    ) +
    group(
      'sprig',
      branch('M392 767Q460 727 508 672', 3) +
        leaf(433, 741, -51, 0.4) +
        leaf(466, 718, 56, 0.4) +
        leaf(502, 678, 9, 0.38),
    )
  )
}

function doorwayStones() {
  const lion = (horizontal, vertical, scale, female) => {
    const identity = female ? 'lion-dam' : 'lion-sire'
    const stoneFace = `url(#${identity}-face)`
    const stoneBody = `url(#${identity}-body)`
    const relief = `url(#${identity}-relief)`
    const material =
      `<defs><linearGradient id="${identity}-face" x1="12%" y1="4%" x2="82%" y2="100%"><stop stop-color="#d0cbb5"/><stop offset=".48" stop-color="#aaa997"/><stop offset="1" stop-color="#778374"/></linearGradient>` +
      `<linearGradient id="${identity}-body" x1="9%" y1="8%" x2="87%" y2="94%"><stop stop-color="#bbbca7"/><stop offset=".45" stop-color="#999f8e"/><stop offset="1" stop-color="#607267"/></linearGradient>` +
      `<radialGradient id="${identity}-relief" cx="32%" cy="22%" r="82%"><stop stop-color="#c8c5ae"/><stop offset=".6" stop-color="#a1a68f"/><stop offset="1" stop-color="#748272"/></radialGradient></defs>`
    const curl = (horizontal, vertical, scale, angle) =>
      transform(
        path(
          'M-20 17C-38 2 -33 -25 -12 -32C10 -43 35 -23 32 0C29 23 4 31 -12 17C-25 7 -19 -15 -4 -18C12 -22 24 -6 15 6C8 15 -6 10 -5 1Q-4 -7 3 -5Q9 -1 3 3Q13 4 12 -5C10 -17 -8 -15 -11 -4Q-15 11 -1 17Q13 22 23 10C34 -6 18 -28 1 -27Q-20 -27 -22 -7Q-23 6 -15 11Z',
          relief,
          1,
          grain,
        ) +
          line('M-23 6C-34 -15 -11 -40 12 -28', '#d0cbb3', 2.4, 0.74) +
          line('M-11 17C8 35 35 10 22 -11', '#52675b', 2.3, 0.7),
        `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
      )
    const pedestal =
      path('M-153 99H113L165 70V192L113 225H-153Z', '#959d8a', 1, grain) +
      path('M113 99L165 70V192L113 225Z', '#6e7c6d', 1, grain) +
      path('M-153 99L-104 70H165L113 99Z', '#c1bfa6', 1, grain) +
      path('M-162 91H118L173 60V79L118 112H-162Z', '#b5b7a0', 1, grain) +
      path('M-147 115H104V195H-147Z', '#828e7a', 1, grain) +
      path('M-138 121H96V187H-138Z', '#b1b49d', 1, grain) +
      path(
        'M-125 121Q-115 146 -92 144Q-81 160 -63 157Q-51 180 -39 157Q-19 163 -5 143Q17 148 28 121Z',
        '#7c8c76',
        1,
        grain,
      ) +
      path(
        'M-113 123Q-104 138 -87 136Q-73 150 -60 148L-51 162L-41 148Q-22 151 -12 136Q7 140 16 123Z',
        '#c3bea4',
        1,
        grain,
      ) +
      line(
        'M-87 126Q-76 147 -61 143L-50 152L-40 143Q-21 147 -12 126M-126 153Q-112 146 -107 159Q-103 171 -115 174Q-126 175 -123 164M68 135Q90 135 83 157Q78 168 65 161Q55 153 65 147Q75 143 75 152',
        '#6d806d',
        2.8,
        0.8,
      ) +
      path(
        'M-160 195H116L170 165V184L116 218H-160ZM-168 218H121L178 184V200L121 235H-168Z',
        '#a3aa93',
        1,
        grain,
      ) +
      line('M-144 223H103M128 217L161 197', '#c6c1a7', 3, 0.7)
    const seatedMass =
      path(
        'M-90 -154C-44 -205 60 -191 106 -151C155 -113 165 -51 158 3Q157 61 102 78L-57 78Q-117 50 -123 -24Q-128 -88 -90 -154Z',
        stoneBody,
        1,
        grain,
      ) +
      path(
        'M74 -110C133 -116 164 -59 156 1C151 49 128 73 79 75C41 76 14 52 21 19Q27 -13 65 -19Q89 -21 104 -2C95 -29 67 -52 74 -110Z',
        '#8a9680',
        1,
        grain,
      ) +
      path(
        'M89 -90C128 -96 152 -55 146 -16Q119 -43 97 -25C72 -7 65 22 87 37Q117 52 136 23Q133 59 99 63C61 69 41 41 50 14Q56 -4 76 -9',
        relief,
        1,
        grain,
      ) +
      line(
        'M109 -53Q133 -43 124 -22Q115 -3 96 -16Q82 -30 99 -37Q112 -42 114 -29',
        '#526c5c',
        4.3,
        0.8,
      ) +
      path(
        'M-101 -147C-66 -189 -9 -194 42 -155Q63 -126 49 -77Q27 -35 -2 -27Q-46 -28 -78 -65Q-110 -103 -101 -147Z',
        stoneFace,
        1,
        grain,
      ) +
      path(
        'M-107 -153Q-44 -111 40 -151L64 -134Q75 -113 62 -94L42 -77L29 -89Q-20 -66 -69 -88L-87 -75Q-117 -97 -117 -127Z',
        '#7e8d73',
        1,
        grain,
      ) +
      path('M-107 -146Q-40 -106 41 -145L51 -133Q-37 -90 -111 -130Z', '#c6c2a5', 1, grain) +
      line('M-102 -127Q-61 -104 -17 -108M11 -114L40 -126', '#5a735c', 3.4, 0.9) +
      curl(52, -114, 0.38, 80) +
      path('M-50 -105Q-34 -117 -19 -105L-18 -91Q-34 -79 -50 -91Z', relief, 1, grain) +
      path(
        'M-48 -90Q-55 -78 -53 -68L-63 -56Q-51 -36 -32 -36Q-13 -37 -6 -55L-17 -69Q-16 -86 -27 -91Z',
        stoneBody,
        1,
        grain,
      ) +
      path('M-48 -74Q-37 -86 -22 -73L-18 -59Q-36 -48 -52 -60Z', '#c7c3a7', 1, grain) +
      path('M-58 -57Q-34 -44 -9 -56L-9 -48Q-34 -32 -58 -49Z', '#60775e', 1, grain) +
      ellipse(-34, -51, 4, 6, '#4c684f') +
      line('M-40 -102Q-31 -106 -28 -97Q-27 -91 -36 -89', '#5f755e', 2.6, 0.9)
    const plantedLeg =
      path(
        'M-71 -76C-50 -87 -14 -74 -17 -45L-20 22Q-21 40 -5 48C13 59 8 81 -11 85L-96 84C-122 80 -127 58 -112 42Q-93 27 -94 9L-98 -36Q-96 -63 -71 -76Z',
        stoneFace,
        1,
        grain,
      ) +
      path('M-90 -44Q-96 6 -88 34Q-66 28 -49 39L-38 47Q-47 18 -44 -45Z', '#bdbea6', 0.8, grain) +
      path(
        'M-36 -61Q-16 -53 -22 -28L-23 19Q-24 38 -9 46L-22 50Q-42 40 -40 17Z',
        '#708069',
        0.85,
        grain,
      ) +
      line('M-89 30Q-70 20 -49 35', '#7b8b71', 3.4, 0.8) +
      path(
        'M-104 52Q-89 39 -76 55Q-65 38 -51 55Q-35 39 -23 55Q-6 51 -6 67L-12 78H-100Q-118 70 -104 52Z',
        relief,
        1,
        grain,
      ) +
      line('M-80 57L-82 76M-54 57L-56 78M-29 59L-32 78', '#5f7462', 3.6, 0.9) +
      path(
        'M-101 72L-95 63L-87 72ZM-76 76L-69 66L-62 76ZM-51 77L-44 67L-37 77ZM-27 75L-20 66L-15 74Z',
        '#cecab0',
        0.8,
        grain,
      )
    const prop = female
      ? path(
          'M-6 56Q-8 29 13 19Q27 -1 47 20Q75 22 92 47Q103 65 85 79L26 88Q-1 85 -6 56Z',
          stoneBody,
          1,
          grain,
        ) +
        path(
          'M3 20Q-3 -3 13 -10Q25 -27 38 -13Q59 -21 65 -2Q82 10 66 32Q45 51 19 37Z',
          relief,
          1,
          grain,
        ) +
        curl(9, 3, 0.3, -30) +
        curl(57, 2, 0.28, 40) +
        path('M10 13Q21 3 32 14Q48 2 59 14L56 29Q36 39 15 29Z', '#c4c1a8', 1, grain) +
        ellipse(24, 10, 4, 4, '#576e5c') +
        ellipse(47, 10, 4, 4, '#576e5c') +
        path('M28 17Q36 12 44 17L39 23H32Z', '#617664') +
        path('M17 28Q35 23 55 28L51 35Q31 44 17 28Z', '#5f7460') +
        path('M49 45Q67 41 74 56L80 72H58L48 63L34 68L19 80H5L9 61Z', '#b1b59b', 1, grain) +
        line('M24 66L23 79M66 59L66 73', '#5c725f', 2.4) +
        path(
          'M8 -75C38 -86 59 -63 51 -33Q47 -15 63 -8C82 0 79 18 62 21L21 17Q6 9 13 -11Q20 -29 3 -39Z',
          stoneFace,
          1,
          grain,
        ) +
        line('M39 0L39 13M55 2L55 16', '#617561', 3.1)
      : ellipse(37, 47, 51, 49, stoneBody, 1, grain) +
        path('M-10 38Q20 1 67 14Q96 41 79 73Q57 101 19 87Q-8 74 -10 38Z', relief, 0.88, grain) +
        line(
          'M-8 43Q39 12 82 43Q33 79 -8 43M35 -1Q15 46 38 96Q61 48 35 -1M5 14Q21 44 6 78M66 12Q52 45 69 82',
          '#617760',
          3.2,
          0.9,
        ) +
        times(7, (index) => {
          const angle = (index * Math.PI * 2) / 7
          return curl(36 + Math.cos(angle) * 32, 47 + Math.sin(angle) * 30, 0.18, index * 51)
        }) +
        ellipse(37, 47, 11, 12, '#c6c3a5', 1, grain) +
        path(
          'M7 -80C40 -89 61 -72 53 -41Q49 -26 62 -17L77 -8Q93 9 77 22Q63 31 39 21L12 19Q-1 15 3 -1L9 -22L-6 -43Z',
          stoneFace,
          1,
          grain,
        ) +
        path('M17 -1Q26 -13 38 1Q49 -9 59 3Q73 -4 78 8L73 18L19 14Z', relief, 1, grain) +
        line('M37 1L35 15M58 3L56 19', '#5e735f', 3.4)
    const maneMass =
      path(
        'M-116 -196C-149 -219 -155 -266 -138 -294Q-151 -321 -121 -342Q-116 -373 -83 -373Q-65 -401 -33 -391Q-2 -412 26 -387Q63 -398 83 -371Q116 -373 126 -340Q156 -321 143 -292Q166 -263 147 -235Q154 -205 125 -187Q113 -158 81 -161Q59 -141 33 -157L-61 -151Q-93 -156 -99 -181Z',
        stoneBody,
        1,
        grain,
      ) +
      [
        [-103, -315, 0.8, -18],
        [-66, -351, 0.87, 12],
        [-20, -363, 0.84, 2],
        [27, -357, 0.86, 37],
        [72, -339, 0.82, 65],
        [110, -308, 0.8, 82],
        [125, -265, 0.82, 108],
        [117, -219, 0.8, 122],
        [80, -187, 0.73, 154],
        [-124, -272, 0.84, -55],
        [-119, -227, 0.82, -75],
        [-90, -190, 0.79, -103],
        [67, -299, 0.65, 73],
        [82, -256, 0.7, 100],
        [67, -217, 0.63, 125],
      ]
        .map((args) => curl(...args))
        .join('')
    const face =
      path(
        'M-103 -296C-77 -328 -34 -334 0 -320Q46 -323 68 -286Q83 -263 62 -234L53 -205Q43 -171 5 -161L-67 -163Q-113 -175 -128 -211Q-147 -252 -119 -277Z',
        stoneFace,
        1,
        grain,
      ) +
      path('M35 -301Q55 -331 80 -312Q105 -291 80 -269L63 -260L47 -275Z', relief, 1, grain) +
      path('M56 -303Q77 -314 78 -295L65 -282Q70 -297 56 -303Z', '#5e7461', 1, grain) +
      path('M-121 -288Q-140 -303 -128 -320Q-107 -332 -93 -307Z', relief, 1, grain) +
      path('M-113 -298Q-124 -314 -130 -308L-128 -294Z', '#6f8068', 1, grain) +
      path(
        'M-101 -298Q-76 -325 -39 -319Q-14 -321 9 -303L25 -279Q-2 -291 -24 -274L-57 -275Q-86 -267 -108 -276Z',
        '#bfc0a6',
        1,
        grain,
      ) +
      path(
        'M-69 -307Q-44 -317 -26 -301L-17 -281L-34 -279Q-38 -298 -57 -295Z',
        '#89977b',
        1,
        grain,
      ) +
      line('M-98 -302Q-76 -313 -56 -308M-39 -312Q-18 -306 -10 -293', '#d0c8ac', 3.4, 0.8) +
      path(
        'M-123 -273Q-108 -296 -84 -286L-62 -268L-67 -246L-103 -240Q-126 -245 -123 -273ZM-54 -268Q-43 -298 -14 -290Q13 -286 17 -263L6 -244L-29 -244Z',
        '#687b64',
        1,
        grain,
      ) +
      ellipse(-97, -265, 17, 17, relief, 1, grain) +
      ellipse(-20, -265, 19, 19, relief, 1, grain) +
      ellipse(-101, -262, 5.6, 6.6, '#6e7d64', 1, grain) +
      ellipse(-26, -262, 6.3, 7.4, '#62745c', 1, grain) +
      path(
        'M-129 -281Q-108 -302 -89 -289L-61 -270L-67 -256L-91 -274Q-108 -283 -123 -269ZM-58 -269Q-42 -301 -15 -292L19 -277Q34 -269 25 -252L12 -258Q-12 -281 -34 -270L-48 -255Z',
        '#9da68b',
        1,
        grain,
      ) +
      line(
        'M-123 -282Q-106 -292 -91 -282L-72 -270M-48 -279Q-30 -293 -10 -283L14 -271',
        '#d1c9ad',
        4.7,
        0.9,
      ) +
      path(
        'M-72 -272Q-56 -296 -41 -278Q-36 -265 -46 -248L-48 -230L-93 -226L-103 -244Z',
        relief,
        1,
        grain,
      ) +
      path('M-55 -279Q-44 -272 -48 -257L-57 -246L-69 -247Z', '#7e8c71', 0.8, grain) +
      path(
        'M5 -251Q40 -274 62 -244Q87 -231 67 -208L42 -190L12 -200L-2 -226Z',
        stoneBody,
        1,
        grain,
      ) +
      path(
        'M10 -242Q35 -258 44 -237Q54 -231 49 -220Q30 -225 18 -209L8 -214Q27 -237 10 -242Z',
        '#bdbea2',
        1,
        grain,
      ) +
      line('M38 -250Q62 -245 58 -230M47 -221Q68 -220 59 -206', '#5c735d', 3.5, 0.8) +
      path(
        female
          ? 'M-132 -219Q-100 -235 -65 -226L-13 -226Q27 -221 35 -201Q30 -175 -3 -167Q-52 -158 -97 -177Q-128 -188 -132 -219Z'
          : 'M-134 -222Q-103 -240 -65 -229L-10 -228Q30 -225 39 -200Q34 -171 1 -164Q-51 -155 -100 -175Q-133 -186 -134 -222Z',
        '#435a48',
        1,
        grain,
      ) +
      path(
        'M-137 -242C-127 -260 -103 -258 -85 -249Q-71 -244 -62 -237Q-47 -255 -24 -246Q-2 -247 9 -229Q23 -214 8 -204Q-13 -195 -36 -208L-61 -217Q-87 -203 -116 -211Q-145 -215 -137 -242Z',
        stoneFace,
        1,
        grain,
      ) +
      path(
        'M-119 -245Q-118 -270 -96 -271Q-77 -286 -59 -272Q-31 -272 -27 -252Q-31 -239 -49 -238L-65 -241L-83 -234L-107 -236Z',
        '#8b9479',
        1,
        grain,
      ) +
      path(
        'M-113 -252Q-103 -265 -94 -256L-99 -247ZM-60 -258Q-44 -267 -37 -254L-44 -248Z',
        '#4e6651',
        1,
        grain,
      ) +
      line('M-103 -272Q-81 -284 -64 -273', '#d2c6a6', 4, 0.85) +
      path(
        'M-131 -231Q-119 -224 -104 -230L-91 -227Q-116 -215 -133 -225ZM-57 -228Q-30 -242 -10 -225L-8 -218Q-30 -232 -51 -221Z',
        '#d0c5a7',
        0.8,
        grain,
      ) +
      path(
        'M-113 -216L-101 -213L-103 -193Q-109 -187 -112 -203ZM-5 -213L6 -214L4 -198L-2 -189L-6 -193Z',
        '#bbb79a',
        1,
        grain,
      ) +
      path(
        'M-95 -215Q-69 -228 -47 -219L-19 -213L-20 -206L-46 -210Q-70 -218 -92 -208Z',
        '#bdb99b',
        1,
        grain,
      ) +
      line(
        'M-83 -217L-82 -211M-71 -220L-70 -213M-58 -219L-57 -212M-44 -216L-45 -210M-32 -214L-33 -208',
        '#6b7c62',
        2.1,
        0.7,
      ) +
      path('M-85 -179Q-66 -196 -46 -188L-27 -181L-7 -178Q-38 -168 -85 -179Z', '#8e9a7b', 1, grain) +
      path(
        'M-131 -201Q-111 -180 -79 -176Q-30 -162 24 -185L31 -172Q9 -148 -34 -150Q-95 -151 -123 -180Z',
        stoneFace,
        1,
        grain,
      ) +
      line('M-119 -191Q-100 -179 -78 -176M-65 -173Q-23 -160 17 -179', '#c7c0a2', 3.3, 0.65) +
      path(
        'M-92 -160Q-79 -143 -61 -145L-49 -125L-38 -137L-25 -123L-14 -139L0 -130L12 -150Q-39 -136 -92 -160Z',
        stoneBody,
        1,
        grain,
      ) +
      line(
        'M-76 -159L-64 -145M-57 -157L-47 -138M-36 -155L-33 -137M-13 -155L-18 -140',
        '#61755e',
        2.8,
        0.7,
      ) +
      curl(51, -204, 0.38, 112) +
      path('M-115 -194Q-113 -205 -121 -211L-127 -206L-124 -195Z', '#9eaa8b', 1, grain)
    return transform(
      material + pedestal + seatedMass + plantedLeg + prop + maneMass + face,
      `translate(${horizontal} ${vertical}) scale(${female ? scale : -scale} ${scale})`,
    )
  }
  return (
    group(
      'threshold',
      polygon(
        [
          [405, 781],
          [1047, 781],
          [1182, 857],
          [527, 857],
        ],
        '#939e8e',
      ) +
        polygon(
          [
            [527, 857],
            [1182, 857],
            [1182, 889],
            [527, 889],
          ],
          '#71867b',
        ),
    ) +
    group(
      'door-frame',
      polygon(
        [
          [483, 268],
          [1080, 268],
          [1120, 298],
          [521, 298],
        ],
        'url(#wood)',
      ) +
        path(
          'M483 268L521 298L521 784L483 766ZM1080 268L1120 298L1120 802L1080 784Z',
          'url(#wood)',
          1,
          grain,
        ),
    ) +
    group(
      'door-leaves',
      path('M521 298H1080V784H521Z', 'url(#red)', 1, grain) +
        line('M802 303V780', '#623e32', 9, 0.9) +
        times(14, (index) => line('M' + (541 + index * 38) + ' 319V764', '#79513d', 2, 0.5)) +
        times(10, (index) =>
          ellipse(
            561 + (index % 5) * 113,
            363 + Math.floor(index / 5) * 349,
            5,
            5,
            '#b39a61',
            0.85,
          ),
        ) +
        [737, 862]
          .map(
            (horizontal) =>
              ellipse(horizontal, 527, 21, 28, '#705a3d') +
              '<ellipse cx="' +
              horizontal +
              '" cy="553" rx="19" ry="23" fill="none" stroke="#b19963" stroke-width="6"/>',
          )
          .join(''),
    ) +
    group('paired-guardian-lions', lion(468, 700, 0.86, true) + lion(1148, 700, 0.86, false))
  )
}

const studies = [
  {
    id: 'kumquat-golden-branch',
    name: '金橘满枝',
    category: 'color',
    theme: '金橘 / 橙金与深叶',
    note: '椭圆金橘由果梗悬挂，叶片深浅衬托实果，枝条连续承接。',
    draw: kumquat,
  },
  {
    id: 'quince-fruit-fragrance',
    name: '木瓜垂香',
    category: 'color',
    theme: '木瓜 / 杏黄与淡赭',
    note: '大果沿下行枝势分布，果柄与厚实果面相接，非特定栽培品种图谱。',
    draw: quince,
  },
  {
    id: 'hypericum-golden-stamens',
    name: '金丝照石',
    category: 'color',
    theme: '金丝桃 / 花金与青石',
    note: '五瓣黄花、放射长蕊与对生叶表现植物身份，石头压住右下。',
    draw: hypericum,
  },
  {
    id: 'bleeding-heart-flowers',
    name: '荷包垂露',
    category: 'color',
    theme: '荷包牡丹 / 胭脂与浅白',
    note: '拱形花轴上心形花与浅色内瓣下垂，复叶另组，花梗接回花轴。',
    draw: bleedingHeart,
  },
  {
    id: 'cicada-plane-tree-leaf',
    name: '梧叶鸣蝉',
    category: 'figures',
    theme: '夏蝉 / 青褐与薄翅',
    note: '实体头胸腹、六足和叠翅分层，昆虫停栖枝面，非物种解剖复原。',
    draw: cicada,
  },
  {
    id: 'butterflies-dianthus',
    name: '石竹双蝶',
    category: 'figures',
    theme: '蝶花 / 金橙与藕粉',
    note: '石竹有细叶和裂瓣，双蝶改变体态与近远翼形，保留花鸟留白。',
    draw: butterfliesDianthus,
  },
  {
    id: 'bamboo-brush-pot',
    name: '笔筒清供',
    category: 'color',
    theme: '文房 / 竹黄与墨色',
    note: '笔杆插入有内壁的竹筒，笔毫聚束收锋，前筒壁遮住插入部分。',
    draw: brushCup,
  },
  {
    id: 'scissors-ruler-brocade',
    name: '刀尺裁锦',
    category: 'color',
    theme: '裁衣 / 靛锦与青铁',
    note: '双刃在共同枢轴交叠，指环真实镂空，剪刀与木尺置于布面。',
    draw: scissorsCloth,
  },
  {
    id: 'oil-paper-umbrella',
    name: '纸伞听雨',
    category: 'color',
    theme: '纸伞 / 淡杏与朱梅',
    note: '纸面分瓣承接伞骨，中心与伞杆相接，装饰梅枝留在伞面内。',
    draw: umbrella,
  },
  {
    id: 'rain-cape-conical-hat',
    name: '蓑笠江行',
    category: 'color',
    theme: '雨具 / 草褐与竹黄',
    note: '蓑衣挂起，层叠草束随肩背下垂，斗笠有圆锥体积、口沿与系绳。',
    draw: rainCape,
  },
  {
    id: 'thread-bound-books-case',
    name: '书函芸香',
    category: 'color',
    theme: '书函 / 靛蓝与纸白',
    note: '线装册、书函与束带共享投影，纸页为实体材料，不写伪造书名。',
    draw: booksCase,
  },
  {
    id: 'drum-stones-red-door',
    name: '石狮守庭',
    category: 'ink',
    theme: '石狮 / 青灰石与朱门',
    note: '门庭雕兽以宽吻突目、压眉阔口、团块卷鬃、厚胸巨爪和层叠石座表现镇守感；绣球与幼狮区分雌雄，非活狮写生或特定文物复原。',
    draw: doorwayStones,
  },
]

mkdirSync(destination, { recursive: true })
for (const study of studies) {
  const source =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">' +
    study.name +
    '</title><desc id="description">' +
    study.theme +
    '。' +
    study.note +
    '原创代码彩墨意象，非文物、古迹或技术复原。透明背景。</desc>' +
    definitions +
    materialDefinitions +
    study.draw() +
    '</svg>'
  const svg = source
    .replace(/id="([^"]+)"/g, (_, identity) => 'id="' + study.id + '-' + identity + '"')
    .replace(/url\(#([^)]+)\)/g, (_, identity) => 'url(#' + study.id + '-' + identity + ')')
    .replace(
      'aria-labelledby="title description"',
      'aria-labelledby="' + study.id + '-title ' + study.id + '-description"',
    )
  writeFileSync(join(destination, study.id + '.svg'), svg)
}
writeFileSync(
  join(destination, 'catalog.json'),
  JSON.stringify(
    {
      version: 1,
      width: 1600,
      height: 1000,
      background: 'transparent',
      assets: studies.map(({ id, name, category, theme, note }) => ({
        id,
        name,
        category,
        theme,
        note,
        svg: id + '.svg',
        png: id + '.png',
      })),
    },
    null,
    2,
  ) + '\n',
)
console.log('Generated twelve travel ink studies')
