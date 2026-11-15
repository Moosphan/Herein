import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/autumn-studies/ink-wash',
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
    ['scarlet', '#e2a09b', '#c36e7b', '#914557'],
    ['fruit', '#e49668', '#be5946', '#813f37'],
    ['russet', '#d6b077', '#a17d54', '#695c45'],
    ['clay', '#b98666', '#946249', '#694b3d'],
    ['bronze', '#b7a477', '#8f855b', '#586b5a'],
    ['water', '#c7d5c7', '#98b7b0', '#6e9998'],
  ]
    .map(
      ([identity, start, middle, end]) =>
        '<linearGradient id="' +
        identity +
        '" x2="65%" y2="100%"><stop stop-color="' +
        start +
        '"/><stop offset=".48" stop-color="' +
        middle +
        '"/><stop offset="1" stop-color="' +
        end +
        '"/></linearGradient>',
    )
    .join('') +
  '</defs>'

function rock(horizontal, vertical, scale = 1) {
  return transform(
    wash('M-205 25Q-45 -45 192 24Q160 74 -180 64Z', '#788f81', 0.18) +
      path(
        'M-172 18L-141 -98L-75 -152L-29 -122L39 -176L131 -102L162 21L58 62L-85 54Z',
        'url(#stone)',
        1,
        grain,
      ) +
      path('M39 -176L30 -55L86 4L58 62L162 21L131 -102Z', '#4d6b69', 0.45, grain) +
      brush(
        [
          [-140, -89],
          [-105, -111],
          [-96, -24],
          [-112, 25],
        ],
        9,
        '#526a65',
        0.7,
      ) +
      brush(
        [
          [-64, -119],
          [-39, -84],
          [-80, -22],
          [-60, 31],
        ],
        6,
        '#64776c',
        0.6,
      ) +
      times(15, (index) =>
        ellipse(
          -116 + index * 18,
          30 + Math.sin(index * 1.7) * 8,
          4 + (index % 4),
          2,
          '#4c6852',
          0.6,
        ),
      ),
    'translate(' + horizontal + ' ' + vertical + ') scale(' + scale + ')',
  )
}

function azalea() {
  let drawing = group('stone-setting', rock(947, 771, 1.25))
  drawing += group(
    'branches',
    branch('M485 849Q628 742 709 551Q746 445 985 325', 20) +
      branch('M642 680Q579 538 440 426', 10) +
      branch('M733 517Q702 373 680 284', 9) +
      branch('M805 421Q932 492 1095 461', 9) +
      branch('M640 654Q826 654 1042 561', 9),
  )
  const placements = [
    [451, 440, -52, 0.8],
    [500, 478, 62, 0.7],
    [580, 552, -65, 0.85],
    [650, 642, 55, 0.8],
    [714, 541, 68, 0.8],
    [697, 395, -43, 0.7],
    [675, 331, -25, 0.7],
    [807, 425, 63, 0.72],
    [884, 365, -44, 0.72],
    [1001, 327, 37, 0.72],
    [968, 481, 106, 0.73],
    [1053, 463, 64, 0.7],
    [899, 606, 92, 0.8],
    [1003, 572, 92, 0.75],
  ]
  drawing += group(
    'leaves',
    placements
      .map(([horizontal, vertical, angle, scale]) => leaf(horizontal, vertical, angle, scale))
      .join(''),
  )
  drawing += group(
    'blooms',
    [
      [435, 388, 0.85, -12],
      [665, 274, 0.9, 12],
      [783, 368, 1.05, -8],
      [976, 284, 0.9, 35],
      [1092, 425, 0.82, 7],
      [1055, 546, 0.95, -20],
    ]
      .map(([horizontal, vertical, scale, angle]) =>
        transform(
          flower(0, 0, 1, 0, 'url(#scarlet)') +
            times(6, (index) =>
              line(
                'M0 0Q' + (index * 4 - 12) + ' -18 ' + (index * 6 - 17) + ' -31',
                '#81434f',
                1.5,
                0.8,
              ),
            ),
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
  return drawing
}

function hibiscusBloom(horizontal, vertical, scale, angle) {
  return transform(
    times(5, (index) =>
      transform(
        path(
          'M0 10C-40 15 -102 -23 -104 -73C-82 -118 -24 -100 -8 -61C15 -102 64 -85 59 -47Q43 -6 0 10Z',
          'url(#pink)',
          1,
          grain,
        ) +
          times(5, (vein) =>
            line(
              'M0 3Q' + (-35 + vein * 14) + ' -37 ' + (-77 + vein * 24) + ' -71',
              '#a95d7c',
              1.5,
              0.35,
            ),
          ),
        'rotate(' + index * 72 + ')',
      ),
    ) +
      path('M-7 4Q2 -33 19 -58L25 -56Q16 -19 6 7Z', '#d7ad62') +
      times(16, (index) =>
        ellipse(18 + Math.sin(index * 2.4) * 10, -51 + index * 1.1, 2, 2, '#b27c40'),
      ),
    'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
  )
}

function hibiscus() {
  return (
    group('supporting-stone', rock(571, 812, 0.9)) +
    group(
      'stems',
      branch('M735 881Q800 622 854 359', 14) +
        branch('M780 715Q993 615 1104 418', 9) +
        branch('M819 530Q690 472 575 344', 7),
    ) +
    group(
      'foliage',
      [
        [777, 733, -65, 1.15],
        [820, 632, 68, 1.1],
        [852, 463, 42, 0.92],
        [970, 633, 74, 1.2],
        [1022, 553, -40, 0.8],
        [694, 477, -65, 0.96],
        [655, 431, 31, 0.85],
      ]
        .map(([horizontal, vertical, angle, scale]) =>
          transform(
            path(
              'M0 0L-65 -26L-81 -69L-49 -67L-56 -117L-15 -98L0 -159L26 -103L59 -123L54 -72L83 -64L56 -24Z',
              'url(#leaf)',
              1,
              grain,
            ) + line('M0 0L0 -143M0 -31L-62 -64M0 -50L47 -76', '#c0bc80', 2, 0.4),
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
    ) +
    group(
      'flowers',
      hibiscusBloom(847, 351, 1.04, -12) +
        hibiscusBloom(1103, 418, 0.85, 20) +
        hibiscusBloom(574, 341, 0.7, -25),
    ) +
    group(
      'buds',
      ellipse(757, 522, 19, 29, 'url(#scarlet)', 1, 'transform="rotate(-22 757 522)"') +
        leaf(759, 546, -18, 0.28),
    )
  )
}

function fruitBranch(kind) {
  const jujube = kind === 'jujube'
  let drawing = group(
    'branchwork',
    jujube
      ? branch('M392 819Q649 684 778 487Q934 291 1171 261', 22) +
          branch('M660 641Q628 476 510 363', 11) +
          branch('M817 445Q1003 479 1183 579', 10) +
          branch('M935 339Q907 268 861 216', 8)
      : branch('M407 272Q715 327 907 516Q1024 645 1167 772', 24) +
          branch('M693 381Q865 317 1073 350', 12) +
          branch('M898 506Q706 563 529 571', 11) +
          branch('M1033 645Q1161 620 1230 530', 7),
  )
  const leaves = jujube
    ? [
        [510, 367, -45, 0.8],
        [568, 423, 71, 0.7],
        [628, 508, -62, 0.8],
        [689, 614, 59, 0.8],
        [771, 501, -45, 0.7],
        [820, 441, 73, 0.72],
        [935, 347, 30, 0.7],
        [1005, 303, -32, 0.7],
        [1127, 274, 61, 0.78],
        [1036, 503, 80, 0.78],
        [1141, 557, -51, 0.7],
        [893, 277, -41, 0.65],
      ]
    : [
        [476, 291, -58, 0.9],
        [575, 329, 110, 0.8],
        [690, 381, 22, 0.9],
        [780, 432, 130, 0.9],
        [904, 516, 42, 1],
        [995, 605, -35, 0.9],
        [1104, 707, 105, 0.8],
        [978, 338, -35, 0.85],
        [1070, 350, 92, 0.9],
        [700, 554, -50, 0.9],
        [620, 565, 113, 0.9],
        [1186, 597, 42, 0.85],
      ]
  drawing += group(
    'leaves',
    leaves
      .map(([horizontal, vertical, angle, scale]) =>
        leaf(horizontal, vertical, angle, scale, jujube ? 'url(#leaf)' : '#668059'),
      )
      .join(''),
  )
  const fruitPositions = jujube
    ? [
        [539, 455],
        [659, 680],
        [806, 558],
        [994, 366],
        [1138, 335],
        [1111, 619],
      ]
    : [
        [608, 392],
        [810, 472],
        [1002, 394],
        [1075, 742],
        [558, 625],
        [778, 611],
      ]
  drawing += group(
    'hanging-fruits',
    fruitPositions
      .map(([horizontal, vertical], index) => {
        let result = line(
          'M' +
            horizontal +
            ' ' +
            (vertical - 58) +
            'Q' +
            (horizontal + 12) +
            ' ' +
            (vertical - 15) +
            ' ' +
            horizontal +
            ' ' +
            vertical,
          '#766549',
          3,
        )
        result += transform(
          jujube
            ? ellipse(0, 20, 25, 39, 'url(#fruit)', 1, grain) +
                path('M-18 2Q-22 21 -10 41Q-16 10 -4 -8Z', '#d6a66c', 0.45, grain) +
                line('M-6 -17L3 -19', '#64543b', 3)
            : times(3, (cluster) =>
                transform(
                  ellipse(0, 22, 36, 39, 'url(#fruit)', 1, grain) +
                    times(47, (spot) => {
                      const angle = spot * 2.4,
                        radius = Math.sqrt(spot / 47) * 32
                      return path(
                        'M-3 0L0 -3L3 0L0 3Z',
                        '#e3ab73',
                        0.55,
                        'transform="translate(' +
                          Math.cos(angle) * radius +
                          ' ' +
                          (22 + Math.sin(angle) * radius) +
                          ')"',
                      )
                    }) +
                    line('M-5 -14Q0 -20 6 -14', '#68573c', 3),
                  'translate(' + (cluster * 44 - 42) + ' ' + (cluster % 2) * 34 + ') scale(.85)',
                ),
              ),
          'translate(' + horizontal + ' ' + vertical + ') rotate(' + (index % 2 ? 8 : -10) + ')',
        )
        return result
      })
      .join(''),
  )
  return drawing
}

function quail(horizontal, vertical, scale, angle) {
  return transform(
    line('M40 138L55 185L72 208M55 185L35 205', '#92714a', 6) +
      path(
        'M-146 84Q-177 54 -153 -7Q-133 -80 -51 -94Q17 -116 43 -154Q78 -188 115 -166Q151 -150 139 -103L126 -66Q138 -8 105 63Q60 148 -47 151Q-122 149 -146 84Z',
        'url(#russet)',
        1,
        grain,
      ) +
      path('M-138 48Q-138 -57 -65 -63Q24 -48 45 40Q3 103 -96 108Z', '#755e46', 0.85, grain) +
      times(36, (index) => {
        const row = Math.floor(index / 6),
          column = index % 6
        return brush(
          [
            [-107 + column * 24, -29 + row * 22],
            [-100 + column * 24, -17 + row * 22],
            [-96 + column * 24, -8 + row * 22],
            [-98 + column * 24, -4 + row * 22],
          ],
          5,
          index % 3 ? '#c9b58a' : '#3f493e',
          0.8,
        )
      }) +
      path('M37 -153Q92 -181 126 -145L119 -130Q75 -148 51 -125Z', '#d8c7a0', 1, grain) +
      path('M61 -93Q93 -112 127 -113L121 -92Q90 -69 83 -47Z', '#e1cfaa', 1, grain) +
      path('M123 -135L168 -115L133 -102Z', '#6e6046') +
      ellipse(115, -136, 5.3, 5, '#292f2c') +
      ellipse(116, -138, 1.4, 1.4, '#ded4b9') +
      line('M-31 145L-21 200L4 219M-21 200L-44 220M-21 200L-19 225', '#9f7e53', 6) +
      line('M61 -157Q78 -162 90 -157', '#624c3c', 5),
    'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
  )
}

function fieldQuails() {
  return (
    group(
      'ground',
      wash('M411 773Q738 686 1162 787L1200 837Q661 887 368 822Z', '#95a379', 0.18) +
        rock(1081, 790, 0.5),
    ) +
    group(
      'grasses',
      times(13, (index) => {
        const horizontal = 439 + index * 49,
          tip = 307 + (index % 5) * 48
        const angle = ((-16 - (index % 4) * 4) * Math.PI) / 180
        const baseX = horizontal + 63 - Math.sin(angle) * 91,
          baseY = tip + Math.cos(angle) * 91
        return (
          brush(
            [
              [horizontal, 826],
              [horizontal - 30, 675],
              [baseX - Math.sin(angle) * 77, baseY + Math.cos(angle) * 77],
              [baseX, baseY],
            ],
            4,
            '#7e8f57',
            0.7,
          ) +
          transform(
            line('M0 0L0 97', '#a48b57', 2, 0.8) +
              times(9, (seed) =>
                ellipse(Math.sin(seed * 2) * 8, seed * 11, 5.5, 10, '#b39b62', 0.8),
              ),
            'translate(' +
              (horizontal + 63) +
              ' ' +
              tip +
              ') rotate(' +
              (angle * 180) / Math.PI +
              ')',
          ) +
          leaf(horizontal, 735, 50 + (index % 3) * 20, 0.45)
        )
      }),
    ) +
    group('quail-pair', quail(716, 618, 1.02, -3) + quail(1009, 668, 0.7, 13))
  )
}

function crab(horizontal, vertical, scale, angle) {
  const legs = times(4, (index) => {
    const rootY = 15 + index * 19
    const jointY = -23 + index * 43,
      endY = -2 + index * 59
    return [-1, 1]
      .map((side) =>
        path(
          'M' +
            side * 76 +
            ' ' +
            rootY +
            'L' +
            side * (149 + index * 8) +
            ' ' +
            jointY +
            'L' +
            side * (205 - index * 8) +
            ' ' +
            endY +
            'L' +
            side * (219 - index * 13) +
            ' ' +
            (endY + 59) +
            'L' +
            side * (193 - index * 7) +
            ' ' +
            (endY + 8) +
            'L' +
            side * (142 + index * 8) +
            ' ' +
            (jointY + 15) +
            'L' +
            side * 72 +
            ' ' +
            (rootY + 14) +
            'Z',
          'url(#bronze)',
          1,
          grain,
        ),
      )
      .join('')
  })
  const claw = (side) =>
    transform(
      path('M53 6Q98 -26 112 -73L135 -83L150 -32Q132 18 84 40Z', 'url(#bronze)', 1, grain) +
        path(
          'M112 -73Q71 -112 88 -158Q107 -188 143 -160L139 -127L115 -144Q112 -109 133 -104Q151 -106 159 -142L174 -166Q191 -130 170 -98L150 -69Z',
          'url(#russet)',
          1,
          grain,
        ) +
        line('M96 -143L105 -132M151 -143L145 -128', '#574e36', 2),
      'scale(' + side + ' 1)',
    )
  return transform(
    legs +
      claw(-1) +
      claw(1) +
      path(
        'M-102 8L-78 -30L-43 -38L-24 -48L1 -40L28 -50L48 -37L83 -30L107 8L100 57L76 94Q0 130 -79 94L-102 62Z',
        'url(#bronze)',
        1,
        grain,
      ) +
      wash('M-74 13Q-23 -12 65 12L73 60Q19 99 -67 65Z', '#6b805c', 0.3) +
      line('M-24 -34L-30 -58M25 -36L33 -60', '#71633d', 6) +
      ellipse(-30, -59, 6, 5, '#313d34') +
      ellipse(34, -61, 6, 5, '#313d34') +
      times(18, (index) =>
        ellipse(-73 + (index % 6) * 27, 16 + Math.floor(index / 6) * 23, 4, 2, '#55664c', 0.55),
      ) +
      line('M-42 8L-17 19L-22 39M38 8L14 19L18 38M-12 52L11 52', '#59644b', 2, 0.45),
    'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
  )
}

function reedCrabs() {
  return (
    group(
      'water-ripples',
      times(8, (index) =>
        line(
          'M' + (399 + (index % 3) * 80) + ' ' + (751 + index * 17) + 'q190 -12 380 0t341 0',
          '#759d99',
          2,
          0.35,
        ),
      ),
    ) +
    group(
      'reed-leaves',
      times(9, (index) =>
        brush(
          [
            [454 + index * 28, 833],
            [545 + index * 14, 653],
            [412 + index * 31, 450],
            [536 + index * 33, 300 + (index % 3) * 47],
          ],
          6,
          '#6d845e',
          0.75,
        ),
      ) +
        leaf(609, 651, -65, 1.6) +
        leaf(579, 577, -55, 1.5) +
        leaf(667, 565, 59, 1.7),
    ) +
    group('crabs', crab(856, 684, 1.05, -13) + crab(1141, 533, 0.55, 18))
  )
}

function ruan() {
  const instrument =
    path(
      'M-143 71Q-155 -88 -79 -148L-32 -173L-32 -490L-48 -502L-49 -565Q-6 -591 35 -567L41 -502L23 -491L23 -173Q131 -144 149 -12Q174 134 54 180Q-92 226 -143 71Z',
      'url(#wood)',
      1,
      grain,
    ) +
    ellipse(0, 8, 135, 168, '#c7b183', 1, grain) +
    ellipse(0, 10, 119, 149, '#d2bd93', 0.8, grain) +
    path('M-32 -490L23 -490L23 -172L-32 -172Z', '#5b5140', 1, grain) +
    times(13, (index) =>
      line('M-28 ' + (-463 + index * 21) + 'L21 ' + (-463 + index * 21), '#d0b374', 4),
    ) +
    [-1, 1]
      .map((side) =>
        times(
          2,
          (index) =>
            line(
              'M' +
                side * 20 +
                ' ' +
                (-530 + index * 37) +
                'L' +
                side * 58 +
                ' ' +
                (-530 + index * 37),
              '#5b4a3a',
              9,
            ) + ellipse(side * 63, -530 + index * 37, 12, 9, '#937346'),
        ),
      )
      .join('') +
    ellipse(-57, -12, 16, 23, '#554d3b') +
    ellipse(58, -12, 16, 23, '#554d3b') +
    path('M-38 113Q0 103 39 114L35 137L-37 137Z', '#68513d') +
    times(4, (index) =>
      line(
        'M' +
          (index < 2 ? -20 : 20) +
          ' ' +
          (-530 + (index % 2) * 37) +
          'L' +
          (-15 + index * 9) +
          ' -490L' +
          (-15 + index * 9) +
          ' 129',
        '#eee0b9',
        1.6,
        0.85,
      ),
    ) +
    times(16, (index) =>
      path(
        'M-2 0Q-11 -8 0 -18Q12 -8 2 0Z',
        '#70856b',
        0.6,
        'transform="translate(' +
          Math.cos((index * Math.PI) / 8) * 104 +
          ' ' +
          (10 + Math.sin((index * Math.PI) / 8) * 131) +
          ') rotate(' +
          index * 22.5 +
          ')"',
      ),
    )
  return (
    group('ruan-instrument', transform(instrument, 'translate(800 651) rotate(18) scale(.96)')) +
    group(
      'silk-cord',
      line('M822 785Q872 812 919 782Q947 764 937 735', '#9a4c45', 7) +
        times(13, (index) =>
          brush(
            [
              [936, 741],
              [946, 772],
              [970 + index * 3, 810],
              [958 + index * 4, 840 + (index % 4) * 6],
            ],
            3,
            '#9b5547',
            0.75,
          ),
        ),
    )
  )
}

function teapot() {
  return (
    group(
      'slab',
      path('M420 777Q792 742 1165 778L1107 828Q733 858 436 816Z', 'url(#stone)', 0.85, grain),
    ) +
    group(
      'handle',
      line('M967 559C1236 458 1237 752 962 704', '#704e3a', 33) +
        line('M970 554C1210 472 1212 729 973 697', '#ab7d58', 14, 0.55),
    ) +
    group(
      'spout',
      path(
        'M593 613Q514 638 467 527L424 501L436 488Q511 485 536 541Q561 573 625 559Z',
        'url(#clay)',
        1,
        grain,
      ) + ellipse(431, 493, 17, 8, '#4c4336', 1, 'transform="rotate(14 431 493)"'),
    ) +
    group(
      'pot-body',
      path(
        'M585 555Q618 501 798 503Q955 503 994 564L1011 699Q1004 798 798 808Q590 798 574 706Z',
        'url(#clay)',
        1,
        grain,
      ) +
        path(
          'M596 575Q622 541 671 537Q625 623 639 715Q646 764 705 789Q601 770 592 705Z',
          '#c3936c',
          0.35,
          grain,
        ) +
        ellipse(794, 558, 198, 47, '#976b4d', 1, grain) +
        path('M631 553Q655 493 796 489Q928 492 963 551Q803 600 631 553Z', 'url(#clay)', 1, grain) +
        ellipse(797, 495, 35, 15, '#72513d') +
        path('M769 495L773 472Q797 455 818 474L824 495Z', 'url(#clay)', 1, grain) +
        line('M638 560Q797 598 960 558', '#5e4736', 3, 0.7) +
        ellipse(796, 795, 139, 14, '#624c3a', 0.7),
    ) +
    group(
      'tea-leaves',
      times(9, (index) =>
        leaf(
          1143 + (index % 3) * 17,
          807 + Math.floor(index / 3) * 9,
          70 + index * 17,
          0.24,
          '#586c48',
        ),
      ),
    )
  )
}

function incense() {
  return (
    group(
      'tray',
      path('M438 699L899 591L1208 722L753 852Z', '#71513e', 1, grain) +
        path('M438 699L753 829L1208 699L1208 722L753 866L438 726Z', '#583f35', 1, grain),
    ) +
    group(
      'burner',
      path('M538 622L865 548L1054 632L724 717Z', 'url(#bronze)', 1, grain) +
        path('M538 622L724 697L1054 615L1054 679L724 770L538 687Z', 'url(#bronze)', 1, grain) +
        path('M562 624L864 562L1025 632L724 700Z', '#ded2b6', 1, grain) +
        path('M610 629L859 578L972 628L726 683Z', '#b5aa89', 1, grain) +
        line(
          'M643 628L852 588L932 626L735 667L690 647L872 612L837 598L674 631L734 657L889 626',
          '#746546',
          7,
          0.8,
        ),
    ) +
    group(
      'tools',
      line('M606 502L1047 421', '#916f49', 15) +
        line('M606 499L1047 418', '#c0a06a', 5, 0.7) +
        transform(
          path('M0 0L21 -3L31 193Q30 208 17 207L6 194Z', 'url(#wood)', 1, grain) +
            ellipse(18, 216, 37, 24, 'url(#bronze)', 1, grain),
          'translate(1128 441) rotate(20)',
        ),
    ) +
    group(
      'smoke',
      wash(
        'M758 618Q693 491 783 410Q856 359 781 273Q833 340 803 405Q726 488 776 613Z',
        '#758b83',
        0.2,
      ),
    )
  )
}

function clogs() {
  const shoe = (identity) => {
    const project = (length, breadth, height) => [
      +(length * 0.94 + breadth * 0.65).toFixed(2),
      +(-length * 0.29 + breadth * 0.42 - height * 0.82).toFixed(2),
    ]
    const point = (length, breadth, height) => project(length, breadth, height).join(' ')
    const face = (corners, color, opacity = 1) =>
      path(
        'M' + corners.map((corner) => project(...corner).join(' ')).join('L') + 'Z',
        color,
        opacity,
        grain,
      )
    const footbed = (height) =>
      'M' +
      point(0, 22, height) +
      'C' +
      point(0, 6, height) +
      ' ' +
      point(20, 0, height) +
      ' ' +
      point(42, 0, height) +
      'L' +
      point(340, 7, height) +
      'Q' +
      point(389, 9, height) +
      ' ' +
      point(393, 37, height) +
      'L' +
      point(390, 121, height) +
      'Q' +
      point(387, 151, height) +
      ' ' +
      point(356, 153, height) +
      'L' +
      point(50, 164, height) +
      'Q' +
      point(5, 160, height) +
      ' ' +
      point(0, 135, height) +
      'Z'
    const tooth = (start) =>
      face(
        [
          [start, 8, 0],
          [start + 44, 8, 0],
          [start + 44, 154, 0],
          [start, 154, 0],
        ],
        '#64503a',
      ) +
      face(
        [
          [start, 8, 0],
          [start, 8, 88],
          [start, 154, 88],
          [start, 154, 0],
        ],
        '#9b7950',
      ) +
      face(
        [
          [start, 154, 0],
          [start, 154, 88],
          [start + 44, 154, 88],
          [start + 44, 154, 0],
        ],
        '#71583d',
      ) +
      line('M' + point(start + 3, 151, 9) + 'L' + point(start + 3, 151, 76), '#c0a16d', 2, 0.45)
    const arch = (length, breadth) =>
      project(length, breadth, 112 + 76 * Math.sin((Math.PI * breadth) / 164) ** 0.62)
    const archCurve = (length) =>
      Array.from({ length: 33 }, (_, index) => arch(length, (index * 164) / 32))
    const front = archCurve(45)
    const rear = archCurve(253)
    const outline = (points) => points.map((position) => position.join(' ')).join('L')
    const band = 'M' + outline(front) + 'L' + outline([...rear].reverse()) + 'Z'
    const opening = 'M' + outline(front) + 'L' + point(45, 0, 112) + 'Z'
    const top = footbed(112)
    const clippedGrain = times(13, (index) => {
      const breadth = 9 + index * 12
      return line(
        'M' +
          point(18, breadth, 112.4) +
          'Q' +
          point(176, breadth + Math.sin(index) * 5, 112.4) +
          ' ' +
          point(377, breadth - 4, 112.4),
        index % 3 ? '#8f704b' : '#e3c68a',
        index % 4 === 0 ? 2.2 : 1.2,
        0.47,
      )
    })
    const basketWeave =
      times(25, (index) => {
        const length = 49 + index * 8.3
        return line('M' + outline(archCurve(length)), '#7c684c', 2, 0.58)
      }) +
      times(22, (index) => {
        const breadth = 3 + index * 7.5
        return line(
          'M' + arch(46, breadth).join(' ') + 'L' + arch(252, breadth).join(' '),
          index % 3 ? '#d5bc8b' : '#7f6849',
          index % 3 ? 2.3 : 1.6,
          0.57,
        )
      })
    return (
      '<defs><clipPath id="' +
      identity +
      '-footbed">' +
      path(top) +
      '</clipPath></defs>' +
      tooth(292) +
      tooth(65) +
      path(footbed(88), '#8b6c47', 1, grain) +
      path(
        'M' +
          point(0, 22, 112) +
          'L' +
          point(0, 135, 112) +
          'Q' +
          point(5, 160, 112) +
          ' ' +
          point(50, 164, 112) +
          'L' +
          point(356, 153, 112) +
          'Q' +
          point(387, 151, 112) +
          ' ' +
          point(390, 121, 112) +
          'L' +
          point(390, 121, 88) +
          'Q' +
          point(387, 151, 88) +
          ' ' +
          point(356, 153, 88) +
          'L' +
          point(50, 164, 88) +
          'Q' +
          point(5, 160, 88) +
          ' ' +
          point(0, 135, 88) +
          'L' +
          point(0, 22, 88) +
          'Z',
        '#9e7b50',
        1,
        grain,
      ) +
      path(top, '#c4a674', 1, grain) +
      '<g clip-path="url(#' +
      identity +
      '-footbed)">' +
      clippedGrain +
      '</g>' +
      path(opening, '#4c4637', 1, grain) +
      path(band, '#aa9066', 1, grain) +
      basketWeave +
      line('M' + outline(front), '#685a43', 5.5, 0.9) +
      line('M' + outline(rear), '#736247', 4.5, 0.85) +
      line('M' + arch(46, 163).join(' ') + 'L' + arch(252, 163).join(' '), '#66583e', 6) +
      line('M' + arch(46, 1).join(' ') + 'L' + arch(252, 1).join(' '), '#89714b', 4) +
      [61, 238]
        .map((length) => {
          const anchor = project(length, 157, 113)
          return ellipse(anchor[0], anchor[1], 3.8, 2.8, '#67583e')
        })
        .join('')
    )
  }
  return (
    group('moss-stone', rock(1207, 815, 0.52)) +
    group(
      'pair-of-clogs',
      transform(shoe('rear-shoe'), 'translate(775 430) rotate(4) scale(1.08)') +
        transform(shoe('front-shoe'), 'translate(340 775) rotate(-7) scale(1.26)'),
    ) +
    group(
      'scattered-leaves',
      leaf(407, 824, 66, 0.45, '#a08752') + leaf(1280, 796, -55, 0.35, '#9c8253'),
    )
  )
}

function creel() {
  const shape =
    'M598 504Q571 545 560 677Q561 791 783 822Q1042 815 1055 689Q1047 562 989 501Q788 435 598 504Z'
  return (
    '<defs><clipPath id="basket-clip">' +
    path(shape) +
    '</clipPath></defs>' +
    group(
      'strap',
      line('M603 537C420 270 1254 200 995 536', '#766341', 22) +
        line('M603 537C420 270 1254 200 995 536', '#c3a572', 7, 0.65),
    ) +
    group(
      'basket-body',
      path(shape, 'url(#russet)', 1, grain) +
        '<g clip-path="url(#basket-clip)">' +
        times(25, (index) =>
          line(
            'M' +
              (472 + index * 27) +
              ' 443Q' +
              (578 + index * 17) +
              ' 629 ' +
              (488 + index * 26) +
              ' 850',
            '#d2b884',
            8,
            0.68,
          ),
        ) +
        times(23, (index) =>
          line(
            'M525 ' +
              (462 + index * 17) +
              'Q805 ' +
              (550 + index * 13) +
              ' 1100 ' +
              (460 + index * 17),
            '#776641',
            4,
            0.55,
          ),
        ) +
        '</g>' +
        ellipse(791, 506, 201, 54, '#7b6847') +
        ellipse(791, 500, 173, 37, '#514e38') +
        line('M592 501Q797 578 992 501', '#cbb17c', 12) +
        ellipse(792, 783, 174, 25, '#7f6c47', 0.5),
    ) +
    group(
      'lid',
      transform(
        ellipse(0, 0, 141, 35, 'url(#russet)', 1, grain) +
          times(11, (index) =>
            line(
              'M' + (-119 + index * 23) + ' -20L' + (-108 + index * 20) + ' 20',
              '#7d6b48',
              3,
              0.55,
            ),
          ) +
          line('M-12 -13Q0 -32 12 -13', '#78613c', 7),
        'translate(1141 746) rotate(22)',
      ),
    ) +
    group(
      'reed-spray',
      brush(
        [
          [1124, 825],
          [1113, 724],
          [1170, 648],
          [1210, 618],
        ],
        5,
        '#68825d',
      ) +
        leaf(1157, 712, -53, 0.7) +
        leaf(1178, 677, 45, 0.75),
    )
  )
}

function well() {
  return (
    group('ground', wash('M334 821Q787 697 1229 818Q1164 899 419 878Z', '#9ba586', 0.16)) +
    group(
      'rear-stonework',
      path('M489 641L780 578L1068 661L775 746Z', 'url(#stone)', 1, grain) +
        path('M555 644L780 600L1004 661L774 720Z', '#394f4c') +
        path('M555 644L780 600L1004 661L974 686L780 631L584 670Z', '#728c81', 1, grain),
    ) +
    group(
      'frame',
      path('M537 658L533 283L562 277L570 652Z', 'url(#wood)', 1, grain) +
        path('M998 687L996 316L1026 320L1035 697Z', 'url(#wood)', 1, grain) +
        path('M521 279L582 268L1050 307L1049 331L522 299Z', 'url(#wood)', 1, grain),
    ) +
    group(
      'windlass',
      line('M540 410L1017 450', '#6b563f', 31) +
        path('M720 402L862 416L862 477L720 463Z', 'url(#wood)', 1, grain) +
        ellipse(722, 432, 17, 30, '#b49b69') +
        ellipse(862, 446, 17, 30, '#725a3e') +
        times(13, (index) =>
          line(
            'M' +
              (730 + index * 10) +
              ' ' +
              (404 + index * 0.95) +
              'L' +
              (730 + index * 10) +
              ' ' +
              (461 + index * 0.95),
            '#cfb480',
            4,
            0.85,
          ),
        ) +
        line('M1020 451L1077 455L1077 519L1110 522', '#796142', 17) +
        line('M805 468L805 691', '#b89a6b', 5),
    ) +
    group(
      'front-stones',
      path('M489 641L775 718L1068 661L1066 805L775 878L489 788Z', 'url(#stone)', 1, grain) +
        path('M775 718L1068 661L1066 805L775 878Z', '#6d8580', 0.65, grain) +
        line(
          'M489 714L775 799L1066 728M627 679L626 753M922 692L921 764M774 800L775 878M551 734L550 808M997 745L998 822',
          '#526d68',
          4,
          0.65,
        ),
    ) +
    group(
      'bucket',
      path('M1112 687L1230 704L1220 822Q1168 853 1116 821Z', 'url(#wood)', 1, grain) +
        ellipse(1170, 696, 60, 18, '#68573d') +
        ellipse(1170, 692, 50, 11, '#424e42') +
        times(7, (index) =>
          line(
            'M' + (1124 + index * 15) + ' 711L' + (1128 + index * 13) + ' 823',
            '#60523d',
            2,
            0.65,
          ),
        ) +
        line('M1116 732L1225 747M1118 794L1221 808', '#4e615a', 8) +
        line('M1124 707Q1126 610 1205 641L1220 708', '#8c7952', 11),
    )
  )
}

const studies = [
  {
    id: 'azalea-red-stone',
    name: '杜鹃照石',
    category: 'color',
    theme: '杜鹃 / 胭脂与青石',
    note: '分杈承接窄叶与胭脂花，斜枝在青灰石前形成疏密。',
    draw: azalea,
  },
  {
    id: 'hibiscus-autumn-pink',
    name: '芙蓉秋色',
    category: 'color',
    theme: '木芙蓉 / 粉黛与掌叶',
    note: '掌状叶、五瓣花与伸出花心区分形态，保留枝端留白。',
    draw: hibiscus,
  },
  {
    id: 'jujube-autumn-fruit',
    name: '枣枝垂赭',
    category: 'color',
    theme: '枣实 / 赤赭与叶青',
    note: '椭圆枣实沿果梗悬垂，以温润色面表现转折。',
    draw: () => fruitBranch('jujube'),
  },
  {
    id: 'lychee-cluster-crimson',
    name: '荔实垂丹',
    category: 'color',
    theme: '荔枝 / 丹红与粒壳',
    note: '成簇荔枝有连贯果梗和局部壳粒，叶面与果簇分出主次。',
    draw: () => fruitBranch('lychee'),
  },
  {
    id: 'quails-autumn-field',
    name: '双鹑秋野',
    category: 'figures',
    theme: '鹌鹑 / 赭羽与草色',
    note: '圆短躯体、细腿与背羽斑纹构成鹌鹑意象，脚落于地面。',
    draw: fieldQuails,
  },
  {
    id: 'reed-crabs-shallow-water',
    name: '芦洲秋蟹',
    category: 'figures',
    theme: '秋蟹 / 铜褐与水青',
    note: '横宽甲壳、双螯与四对步足形成层次，芦叶穿插浅水。',
    draw: reedCrabs,
  },
  {
    id: 'ruan-pearl-inlay',
    name: '阮音含翠',
    category: 'color',
    theme: '阮琴 / 木黄与青钿',
    note: '圆腹直颈、四弦与弦轴连续连接，纹饰为原创意象。',
    draw: ruan,
  },
  {
    id: 'zisha-teapot-slab',
    name: '紫砂陈韵',
    category: 'color',
    theme: '紫砂 / 栗褐与茶青',
    note: '壶身、盖、流和把以陶色转面表现厚度，壶口与流口真实开合。',
    draw: teapot,
  },
  {
    id: 'incense-seal-tray',
    name: '香篆静室',
    category: 'color',
    theme: '香事 / 铜绿与灰白',
    note: '香灰实体面与篆香形线有轻重，铜炉置于漆盘，非香法复原。',
    draw: incense,
  },
  {
    id: 'wooden-clogs-moss',
    name: '木屐苔阶',
    category: 'color',
    theme: '木屐 / 木赭与编帮',
    note: '参考实物形态重画长条木底、前后横齿与拱起编织帮面，部件共用投影，非特定文物复原。',
    draw: clogs,
  },
  {
    id: 'woven-fishing-creel',
    name: '竹篓渔闲',
    category: 'color',
    theme: '鱼篓 / 竹黄与苇青',
    note: '编织沿鼓腹曲面与口沿，提绳接两侧，盖另置岸边。',
    draw: creel,
  },
  {
    id: 'windlass-stone-well',
    name: '井台汲古',
    category: 'ink',
    theme: '辘轳 / 木轴与青石',
    note: '木架承轴、绳从卷筒入井，井壁为实体，旁置水桶，装饰性构造意象。',
    draw: well,
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
console.log('Generated twelve autumn ink studies')
