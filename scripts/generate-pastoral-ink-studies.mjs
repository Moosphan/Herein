import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/pastoral-studies/ink-wash',
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
    ['berry', '#947998', '#67506f', '#403b55'],
    ['clay', '#bf9975', '#a47c5d', '#795c49'],
    ['bronze', '#bd9d68', '#8e805b', '#526e60'],
    ['cream', '#f0e8d6', '#dfdac8', '#b4c4b5'],
    ['orange', '#e6b26e', '#cf7b4e', '#a9533d'],
    ['frog', '#a7ac64', '#7e9654', '#426e51'],
    ['shell', '#b49b60', '#827951', '#475d4c'],
    ['thatch', '#c3a66d', '#a68a58', '#796548'],
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
const polygon = (points, color, opacity = 1, extra = '') =>
  path('M' + points.map((point) => point.join(' ')).join('L') + 'Z', color, opacity, extra)

function mulberryLeaf(horizontal, vertical, scale, angle) {
  return transform(
    path(
      'M0 0C-72 -11 -119 -79 -95 -130Q-82 -153 -51 -129Q-27 -157 -10 -190L7 -168L21 -167L29 -147L48 -141L49 -118L64 -109L55 -82L65 -68L43 -42L41 -24Z',
      'url(#leaf)',
      1,
      grain,
    ) +
      line(
        'M0 -2Q-7 -96 -10 -177M-6 -65L-72 -112M-6 -90L39 -132M-4 -39L-56 -65M-5 -61L45 -88',
        '#c0bd81',
        2,
        0.5,
      ),
    'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
  )
}

function mulberrySilkworm() {
  const berry = (horizontal, vertical, scale, angle) =>
    transform(
      ellipse(0, 0, 29, 57, '#56445d', 1, grain) +
        times(36, (index) => {
          const row = Math.floor(index / 4)
          const column = index % 4
          const breadth = Math.sin(((row + 1) / 11) * Math.PI)
          return ellipse(
            (column - 1.5) * 14 * breadth,
            -46 + row * 11,
            9 * breadth + 2,
            8,
            index % 4 ? 'url(#berry)' : '#8f6d88',
            1,
            grain,
          )
        }) +
        line('M0 -57Q4 -80 -9 -93', '#77734d', 3),
      'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
    )
  return (
    group(
      'mulberry-branches',
      branch('M1230 825Q1034 599 818 435Q666 302 379 219', 28) +
        branch('M808 431Q632 502 357 460', 12) +
        branch('M990 606Q1073 451 1146 345', 12) +
        branch('M703 364Q689 238 588 168', 9),
    ) +
    group(
      'serrated-leaves',
      mulberryLeaf(573, 298, 1.2, -46) +
        mulberryLeaf(770, 405, 1.24, 32) +
        mulberryLeaf(458, 469, 0.92, -64) +
        mulberryLeaf(967, 591, 1.08, -48) +
        mulberryLeaf(1085, 443, 0.91, 29) +
        mulberryLeaf(1099, 712, 1, 77),
    ) +
    group(
      'purple-fruits',
      berry(630, 467, 1.1, -13) + berry(887, 574, 1.22, 16) + berry(1132, 492, 0.9, -6),
    ) +
    group(
      'silkworm-on-leaf',
      transform(
        path(
          'M-104 7Q-59 -28 -13 -16Q35 -34 86 -9L108 16Q105 37 74 39Q31 14 -6 31Q-59 17 -96 34Z',
          'url(#cream)',
          1,
          grain,
        ) +
          times(10, (index) =>
            line('M' + (-84 + index * 17) + ' 3q-6 15 3 26', '#a9ac8d', 2, 0.68),
          ) +
          times(8, (index) => ellipse(-71 + index * 20, 18, 2.1, 2.1, '#8b967b', 0.8)) +
          path('M89 0Q124 -10 131 14Q125 38 104 35Z', '#bcc5aa', 1, grain) +
          ellipse(121, 10, 2, 2, '#5b6858') +
          line('M-73 29l-5 8M-52 30l-4 8M51 30l5 7M73 33l4 8M91 30l5 8', '#929b7e', 3),
        'translate(1170 687) rotate(-12) scale(.72)',
      ),
    )
  )
}

function gardenia() {
  const bloom = (horizontal, vertical, scale, angle) =>
    transform(
      times(8, (index) =>
        transform(
          path(
            'M-4 13C-39 -10 -61 -65 -16 -101Q6 -118 33 -99C28 -64 49 -22 8 8Z',
            'url(#cream)',
            1,
            grain,
          ) + wash('M-8 -9Q9 -64 -10 -88Q29 -50 9 -5Z', '#a9baa1', 0.34),
          'rotate(' + index * 45 + ')',
        ),
      ) +
        times(5, (index) =>
          transform(
            path('M0 6Q-39 -29 -4 -62Q26 -55 22 -25Z', '#e9e5ca', 1, grain),
            'rotate(' + (index * 72 + 14) + ') scale(.67)',
          ),
        ) +
        ellipse(0, 0, 9, 7, '#b6a96c', 1, grain),
      'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
    )
  return (
    group(
      'shrub-branches',
      branch('M520 836Q648 574 931 356Q1093 243 1204 180', 23) +
        branch('M711 589Q674 439 551 345', 13) +
        branch('M856 435Q1003 465 1162 386', 11),
    ) +
    group(
      'glossy-leaves',
      [
        [571, 760, -60, 1.15],
        [665, 633, 32, 1.25],
        [730, 558, -35, 1.05],
        [552, 350, -57, 0.9],
        [670, 470, -46, 0.95],
        [834, 457, 68, 1.1],
        [1002, 434, 75, 0.98],
        [1010, 309, -30, 1.2],
        [1118, 252, 58, 0.82],
        [1142, 394, 52, 0.8],
      ]
        .map(([horizontal, vertical, angle, scale]) =>
          leaf(horizontal, vertical, angle, scale, 'url(#leaf)'),
        )
        .join(''),
    ) +
    group(
      'ivory-flowers',
      bloom(555, 356, 1.2, -14) +
        bloom(927, 349, 1.33, 16) +
        bloom(712, 641, 0.87, 33) +
        transform(
          path('M0 15Q-31 -40 -3 -87Q28 -60 18 -12Z', 'url(#cream)', 1, grain) +
            path('M-5 15L-28 -21L-12 -12L4 -31L11 -14L27 -17L15 16Z', '#698052', 1, grain),
          'translate(1158 194) rotate(34)',
        ),
    )
  )
}

function trumpetVine() {
  const bloom = (horizontal, vertical, scale, angle) =>
    transform(
      path(
        'M-13 -83Q7 -54 12 -11Q48 13 51 44Q19 69 -20 48Q-40 26 -19 -12L-31 -79Z',
        'url(#orange)',
        1,
        grain,
      ) +
        path(
          'M-18 10C-49 -13 -72 10 -54 33C-83 57 -46 84 -22 67C-3 93 31 84 33 63C69 70 82 36 55 19C61 -13 22 -24 9 3Q-7 -13 -18 10Z',
          'url(#orange)',
          1,
          grain,
        ) +
        path('M-21 20Q5 -2 27 22Q41 51 10 61Q-24 56 -21 20Z', '#9d4d38', 0.84, grain) +
        path('M-10 25Q7 12 17 28Q20 46 5 48Q-11 44 -10 25Z', '#6f4136', 0.75, grain) +
        line('M-30 -80L-9 -87', '#77814f', 8),
      'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
    )
  const pinnate = (horizontal, vertical, angle, scale) =>
    transform(
      line('M0 0Q18 -91 -3 -226', '#65734c', 3) +
        times(7, (index) => {
          const fraction = 0.14 + index * 0.115
          const attachmentHorizontal = 36 * (1 - fraction) * fraction - 3 * fraction ** 2
          const attachmentVertical = -182 * (1 - fraction) * fraction - 226 * fraction ** 2
          return leaf(
            attachmentHorizontal,
            attachmentVertical,
            index % 2 ? 58 : -62,
            0.36 + (index % 3) * 0.04,
          )
        }) +
        leaf(-3, -226, -1, 0.38),
      'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ') scale(' + scale + ')',
    )
  return (
    group(
      'climbing-stem',
      branch('M441 818C579 679 522 503 734 349Q862 248 1169 240', 25) +
        branch('M724 353Q843 474 1074 465', 11) +
        branch('M593 518Q568 317 423 257', 12),
    ) +
    group(
      'flower-pedicels',
      line(
        'M724 353Q733 352 741 360M842 434Q866 401 870 359M1005 463Q1016 411 1021 353M1049 254Q1045 231 1049 211M1169 240Q1188 229 1190 209M555 386Q563 351 547 335',
        '#78844f',
        4.5,
      ),
    ) +
    group(
      'compound-leaves',
      pinnate(596, 570, -48, 1.2) +
        pinnate(744, 359, 20, 1.14) +
        pinnate(1000, 465, 72, 1.1) +
        pinnate(1034, 252, 34, 1) +
        pinnate(477, 320, -37, 0.86),
    ) +
    group(
      'trumpet-blossoms',
      bloom(798, 432, 1.08, -25) +
        bloom(903, 456, 1.2, -5) +
        bloom(1002, 445, 1.1, 25) +
        bloom(1086, 285, 0.97, -13) +
        bloom(1173, 303, 1.12, 24) +
        bloom(516, 405, 0.9, 37),
    )
  )
}

function bulbul() {
  return (
    group(
      'autumn-branch',
      branch('M349 815Q655 624 1194 444', 25) +
        branch('M681 650Q643 457 435 355', 11) +
        branch('M1050 495Q1061 337 1218 258', 9),
    ) +
    group(
      'faded-leaves',
      leaf(486, 388, -70, 0.83, '#ad8d52') +
        leaf(608, 508, 28, 0.75, '#b69c5e') +
        leaf(1082, 379, -15, 0.86, '#ab8050') +
        leaf(1160, 297, 50, 0.75, '#b6a06b'),
    ) +
    group(
      'white-headed-bird',
      transform(
        path('M-68 82L-177 189L-157 209L-46 139Z', '#48534c', 1, grain) +
          path('M-164 190L-177 189L-157 209L-140 194Z', '#d4d6bc', 1, grain) +
          path('M-66 -34Q-116 32 -65 104Q-2 171 75 100Q114 28 49 -35Z', 'url(#cream)', 1, grain) +
          path('M-56 -32Q-115 -1 -76 89Q-29 115 24 61Q4 18 -56 -32Z', '#758166', 1, grain) +
          path('M-59 -17Q-95 22 -55 83Q-16 83 11 52Q-12 14 -59 -17Z', '#566756', 1, grain) +
          times(9, (index) =>
            line(
              'M' +
                (-58 + index * 5) +
                ' ' +
                (-3 + index * 3) +
                'q18 30 ' +
                (-8 + index * 3) +
                ' 58',
              '#b4b99a',
              2.1,
              0.7,
            ),
          ) +
          path(
            'M-12 -24Q-38 -74 2 -103Q38 -125 77 -105L108 -81L98 -38Q66 -8 23 -10Z',
            '#313d39',
            1,
            grain,
          ) +
          path(
            'M-7 -76Q9 -112 53 -106Q37 -85 61 -70L91 -69L90 -55Q48 -48 24 -73Q10 -65 -7 -76Z',
            '#e3e4cf',
            1,
            grain,
          ) +
          path('M49 -23Q74 -42 93 -47L99 -30Q70 4 43 0Z', '#dfdfc8', 1, grain) +
          path('M101 -74L146 -60L102 -56Z', '#41483b') +
          ellipse(79, -77, 5, 5, '#172c29') +
          ellipse(80, -79, 1.4, 1.4, '#e6dbb9') +
          line(
            'M-12 128L-17 158L-35 169M-17 158L4 166M38 126L49 143L30 154M49 143L67 149',
            '#6f6547',
            4,
          ),
        'translate(845 339) rotate(-6) scale(1.4)',
      ),
    )
  )
}

function frogLotus() {
  return (
    group(
      'lotus-stems',
      brush(
        [
          [635, 845],
          [636, 734],
          [593, 600],
          [560, 459],
        ],
        6,
        '#687d50',
        0.75,
      ) +
        brush(
          [
            [1030, 851],
            [1004, 682],
            [1073, 448],
            [1089, 273],
          ],
          6,
          '#687d50',
          0.7,
        ),
    ) +
    group(
      'rear-leaf',
      path(
        'M987 303Q914 185 1002 165Q1065 124 1139 185Q1229 197 1204 283L1146 343L1097 288L1094 366Q1023 367 987 303Z',
        'url(#leaf)',
        0.84,
        grain,
      ) + line('M1097 288L1005 183M1097 288L1191 213M1097 288L1147 330', '#c6c58b', 2, 0.45),
    ) +
    group(
      'front-lotus-leaf',
      path(
        'M337 742Q282 646 409 575Q479 508 585 550Q697 504 820 542Q941 490 1085 570Q1216 560 1274 672Q1240 752 1103 783Q966 862 805 827L717 739L702 831Q500 850 408 795Z',
        'url(#leaf)',
        1,
        grain,
      ) +
        path('M717 739Q477 652 362 674Q426 780 648 805L703 829Z', '#6c8854', 0.68, grain) +
        line(
          'M717 739Q578 596 409 605M717 739Q722 590 817 555M717 739Q952 566 1106 596M717 739Q1017 772 1239 686M717 739Q558 769 419 752',
          '#bec28b',
          3,
          0.4,
        ),
    ) +
    group(
      'resting-frog',
      transform(
        path('M16 8Q57 -52 129 -30Q182 -4 146 49L87 91L49 67Z', 'url(#frog)', 1, grain) +
          path(
            'M53 46Q100 11 138 39Q147 68 80 88L133 108L162 102L171 111L151 121L81 115L28 83Z',
            '#68824d',
            1,
            grain,
          ) +
          path(
            'M-92 15Q-111 -35 -64 -59Q-26 -77 21 -51Q54 -13 40 44Q4 82 -42 66Q-72 50 -92 15Z',
            'url(#frog)',
            1,
            grain,
          ) +
          path('M-108 -13Q-114 -44 -89 -58Q-64 -60 -57 -37L-54 -15Z', '#8c9c55', 1, grain) +
          ellipse(-84, -37, 15, 16, '#b0b575', 1, grain) +
          ellipse(-87, -38, 10, 6, '#283d32') +
          ellipse(-89, -42, 2, 3, '#d6d5a8') +
          path('M-94 13Q-59 16 -24 12Q-26 35 -61 34Q-85 29 -94 13Z', '#abb87b', 1, grain) +
          line('M-98 11Q-65 16 -29 11', '#526b43', 2.8, 0.8) +
          ellipse(-101, -6, 2.6, 2, '#4b6141') +
          path(
            'M-34 50Q-39 77 -65 93Q-72 100 -63 115Q-56 127 -75 131Q-87 126 -89 115L-104 120Q-115 117 -107 110L-88 100Q-76 64 -58 42Z',
            '#809651',
            1,
            grain,
          ) +
          path('M4 50Q15 84 -4 104L-12 127L-26 126L-22 105Q-3 89 -18 60Z', '#587e49', 1, grain) +
          line('M-15 126l-12 13M-15 126l8 12M-76 131l-6 13M-76 131l-15 7', '#668149', 3) +
          times(17, (index) =>
            ellipse(
              -24 + (index % 5) * 30,
              -35 + Math.floor(index / 5) * 22,
              3 + (index % 3),
              2 + (index % 2),
              '#456b43',
              0.65,
              grain,
            ),
          ),
        'translate(766 594) rotate(-7) scale(1.8)',
      ),
    )
  )
}

function turtleStone() {
  return (
    group(
      'resting-stone',
      path(
        'M374 782L495 680L657 681L749 644L912 687L1071 661L1226 764L1261 839Q859 898 379 844Z',
        'url(#stone)',
        1,
        grain,
      ) +
        path('M498 713L657 694L727 682L683 744L805 798L508 836L406 812Z', '#7b8b79', 0.65, grain) +
        times(14, (index) =>
          brush(
            [
              [506 + index * 40, 791 - (index % 3) * 16],
              [538 + index * 34, 781 - (index % 3) * 17],
              [551 + index * 33, 800 - (index % 4) * 14],
              [591 + index * 30, 804 - (index % 3) * 18],
            ],
            4,
            '#b5b69a',
            0.55,
          ),
        ),
    ) +
    group(
      'turtle-limbs',
      path('M535 668Q502 693 483 731L510 748L547 727L585 692Z', '#6a7950', 1, grain) +
        path('M741 686L771 742L810 757L837 745L803 722L792 674Z', '#6d7d50', 1, grain) +
        path(
          'M881 659Q941 660 983 693L1000 719L971 733L945 713L916 710L879 683Z',
          '#8b9360',
          1,
          grain,
        ) +
        path('M594 710Q562 743 592 779L630 790L665 778L637 762L658 723Z', '#899563', 1, grain) +
        times(4, (index) => line('M' + (594 + index * 13) + ' 778l-3 10', '#485e43', 2)) +
        path('M490 656Q414 640 401 675Q436 660 489 689Z', '#748056', 1, grain),
    ) +
    group(
      'domed-shell',
      path(
        'M486 671C456 518 577 430 725 439C867 434 937 545 903 669Q719 779 486 697Z',
        'url(#shell)',
        1,
        grain,
      ) +
        path('M486 671Q684 755 903 669L893 695Q698 788 486 697Z', '#51664a', 1, grain) +
        line(
          'M580 492L621 544L613 623L550 674M621 544L718 516L787 552L777 630L695 673L613 623M718 516L741 451M787 552L874 523M777 630L891 669M695 673L698 737',
          '#495f46',
          4,
          0.75,
        ) +
        times(8, (index) =>
          line(
            'M' +
              (508 + index * 48) +
              ' ' +
              (666 + Math.sin((index / 7) * Math.PI) * 48) +
              'l-4 25',
            '#bbc089',
            2.5,
            0.6,
          ),
        ) +
        wash('M549 548Q611 452 735 475Q649 480 585 570Z', '#c1b77b', 0.3),
    ) +
    group(
      'head-neck',
      path(
        'M869 595Q947 620 984 577Q1003 546 1042 550Q1114 553 1123 605Q1117 644 1067 648Q1007 626 957 665L890 674Z',
        'url(#shell)',
        1,
        grain,
      ) +
        ellipse(1080, 585, 7, 7, '#253f32') +
        ellipse(1082, 583, 2, 2, '#d7cda0') +
        line('M1120 615Q1088 626 1063 614', '#526647', 3) +
        ellipse(1113, 601, 2.3, 2, '#4b6043') +
        line('M1007 585L1035 608M989 606L1019 627M962 629L985 644', '#c2bc88', 2, 0.6),
    ) +
    group(
      'reedy-grass',
      times(7, (index) =>
        brush(
          [
            [1204 + index * 9, 808],
            [1200 + index * 11, 741],
            [1163 + index * 20, 694],
            [1129 + index * 24, 650 - (index % 3) * 24],
          ],
          11,
          '#6d8153',
          0.65,
        ),
      ),
    )
  )
}

function bronzeGu() {
  return group(
    'bronze-vessel',
    path(
      'M571 246Q802 304 1033 246C918 347 869 438 865 493L876 607Q900 712 989 803Q795 875 601 805Q693 722 713 608L718 494Q716 371 571 246Z',
      'url(#bronze)',
      1,
      grain,
    ) +
      ellipse(802, 246, 231, 54, '#b1a477', 1, grain) +
      ellipse(802, 246, 207, 40, '#4c6458', 1, grain) +
      path('M715 488Q792 512 865 488L876 607Q799 640 713 608Z', '#758367', 0.6, grain) +
      line(
        'M716 496Q797 521 865 498M716 600Q797 624 875 600M612 797Q795 851 978 796',
        '#c7af75',
        4,
        0.75,
      ) +
      times(4, (index) =>
        transform(
          path('M-8 0L8 0L11 107L-12 112Z', '#748366', 1, grain) +
            line('M-5 4L-7 104', '#c0af76', 2, 0.55),
          'translate(' + (713 + index * 57) + ' 487)',
        ),
      ) +
      times(13, (index) =>
        transform(
          line('M0 0l7 14l-7 15l9 15', '#b9a775', 2, 0.65),
          'translate(' +
            (656 + index * 23) +
            ' ' +
            (706 + Math.sin((index / 12) * Math.PI) * 24) +
            ')',
        ),
      ) +
      group(
        'surface-patina',
        wash('M665 326Q714 386 737 451L754 491L733 491Q705 418 665 326Z', '#446e61', 0.38) +
          wash('M868 641Q875 727 942 785L900 795Q858 717 868 641Z', '#486f61', 0.34),
      ),
  )
}

function steamer() {
  const handle = (horizontal, vertical, angle) =>
    transform(
      path('M-7 -30C-84 -61 -86 65 -6 46L-5 24C-56 35 -55 -25 -7 -8Z', 'url(#clay)', 1, grain),
      'translate(' + horizontal + ' ' + vertical + ') rotate(' + angle + ')',
    )
  return (
    group(
      'hearth-stones',
      path('M552 807L590 750L676 777L690 840L570 852Z', '#8a8977', 1, grain) +
        path('M920 783L1002 752L1057 817L1017 851L915 838Z', '#7a8070', 1, grain) +
        path('M701 838L741 802L865 802L906 843L862 871L730 864Z', '#858973', 1, grain),
    ) +
    group(
      'lower-pot-handles',
      handle(603, 592, -16) + transform(handle(603, 592, -16), 'translate(1600 0) scale(-1 1)'),
    ) +
    group(
      'lower-cooking-pot',
      path(
        'M573 552Q794 594 1011 552L1017 671Q1008 800 802 829Q597 810 573 681Z',
        'url(#clay)',
        1,
        grain,
      ) +
        path(
          'M593 676Q627 791 796 804Q920 795 974 741Q899 846 762 826Q609 804 593 676Z',
          '#755c49',
          0.54,
          grain,
        ) +
        ellipse(793, 552, 220, 42, '#c3a383', 1, grain) +
        ellipse(793, 552, 193, 30, '#6a5947', 1, grain),
    ) +
    group(
      'upper-steamer',
      path('M551 314Q797 367 1042 314L1011 553Q797 612 578 553Z', 'url(#clay)', 1, grain) +
        ellipse(797, 314, 246, 63, '#c8ac86', 1, grain) +
        ellipse(797, 314, 217, 44, '#9f8968', 1, grain) +
        times(29, (index) => {
          const row = Math.floor(index / 7),
            column = index % 7
          const horizontal = 651 + column * 48 + (row % 2) * 13
          const vertical = 289 + row * 14
          return ellipse(horizontal, vertical, 7, 3.5, '#625c46', 0.85)
        }) +
        line('M566 340Q797 386 1025 340M586 538Q799 588 1003 539', '#d4b590', 3.5, 0.7) +
        handle(577, 431, -10) +
        transform(handle(577, 431, -10), 'translate(1594 0) scale(-1 1)') +
        times(19, (index) =>
          line('M' + (587 + index * 22) + ' 392q-8 78 1 121', '#80674e', 1.6, 0.25),
        ),
    ) +
    group(
      'steam',
      times(4, (index) =>
        line(
          'M' +
            (668 + index * 89) +
            ' 257C' +
            (621 + index * 95) +
            ' 220 ' +
            (716 + index * 66) +
            ' 178 ' +
            (685 + index * 80) +
            ' 125',
          '#e4e0cb',
          11,
          0.3,
        ),
      ),
    )
  )
}

function bambooXiao() {
  const flute = transform(
    path('M-24 -286Q0 -296 24 -286L22 351Q0 365 -21 351Z', 'url(#wood)', 1, grain) +
      ellipse(0, -286, 24, 8, '#c6b985', 1, grain) +
      ellipse(0, -286, 15, 4, '#5e6346') +
      path('M-9 -289Q0 -269 9 -289L10 -281Q0 -260 -10 -281Z', '#565c3e') +
      times(8, (index) => line('M-23 ' + (-238 + index * 76) + 'q23 7 46 0', '#7c7950', 5, 0.8)) +
      times(6, (index) => ellipse(1, -77 + index * 47, 6.5, 8.5, '#454e3b', 1, grain)) +
      line('M-12 -265L-11 335', '#d1b87d', 3, 0.45),
    'translate(774 477) rotate(28)',
  )
  return (
    group(
      'cloth-case',
      path(
        'M492 775L1055 349Q1076 337 1093 366L1125 411L539 852Q505 855 492 775Z',
        'url(#silk)',
        1,
        grain,
      ) +
        line('M514 789L1094 378', '#a3afba', 2, 0.6) +
        path('M1028 369L1079 334L1138 407L1084 446Z', '#697c92', 1, grain) +
        line('M1079 349L1123 405', '#b4b7ba', 3, 0.65),
    ) +
    group('bamboo-flute', flute) +
    group(
      'cord-tassel',
      line('M825 342Q784 355 829 366Q884 364 866 336Q856 319 832 345L872 595', '#a75d4c', 6) +
        ellipse(872, 593, 11, 15, '#be9a61', 1, grain) +
        times(21, (index) =>
          line(
            'M' +
              (862 + index) +
              ' 610Q' +
              (879 + index * 0.7) +
              ' 670 ' +
              (862 + index * 1.5) +
              ' ' +
              (757 + Math.sin(index) * 10),
            '#a65e50',
            2.5,
            0.85,
          ),
        ),
    )
  )
}

function foldingScreen() {
  const panels = [
    [352, 258, 288, 47],
    [640, 305, 312, -58],
    [952, 247, 296, 49],
  ]
  const painting = (index) => {
    if (index === 0)
      return (
        path(
          'M24 410Q72 346 103 363L168 249L206 282L267 218L298 305L298 454L24 454Z',
          '#829884',
          0.6,
          grain,
        ) +
        branch('M103 455Q151 354 115 199', 8) +
        times(9, (leafIndex) =>
          transform(
            times(5, (blade) =>
              line(
                'M0 0l' + Math.cos(blade * 1.1) * 24 + ' ' + Math.sin(blade * 1.1) * 13,
                '#566f54',
                2.5,
                0.8,
              ),
            ),
            'translate(' +
              (105 + (leafIndex % 3) * 17) +
              ' ' +
              (224 + Math.floor(leafIndex / 3) * 60) +
              ')',
          ),
        )
      )
    if (index === 1)
      return (
        wash(
          'M24 364L61 247L95 268L153 120L182 182L224 156L297 330L297 450L24 450Z',
          '#97aaa0',
          0.4,
        ) +
        path(
          'M24 416L66 343L100 352L153 229L185 278L226 200L254 279L298 305L298 458L24 458Z',
          '#678878',
          0.72,
          grain,
        ) +
        path('M108 392Q145 339 153 253L184 290L174 373L194 406L155 451Z', '#436e63', 0.62, grain) +
        times(12, (mark) =>
          brush(
            [
              [140 + (mark % 3) * 24, 285 + mark * 10],
              [130 + (mark % 3) * 22, 307 + mark * 10],
              [151 + (mark % 3) * 21, 318 + mark * 10],
              [140 + (mark % 3) * 23, 337 + mark * 10],
            ],
            3.5,
            '#b8bd99',
            0.65,
          ),
        )
      )
    return (
      path(
        'M24 383L75 329L113 352L152 277L205 342L257 313L298 358L298 453L24 453Z',
        '#799380',
        0.65,
        grain,
      ) +
      branch('M254 452Q205 308 261 218', 8) +
      branch('M237 343Q199 261 155 245', 4) +
      times(7, (flowerIndex) =>
        flower(
          163 + flowerIndex * 14,
          248 + (flowerIndex % 3) * 33,
          0.17,
          flowerIndex * 11,
          '#c2a09a',
        ),
      ) +
      line('M76 189q12 -12 22 0q12 -9 20 0M123 162q9 -9 17 0q10 -9 17 0', '#627b72', 2.2, 0.8)
    )
  }
  return group(
    'folding-panels',
    panels
      .map(([horizontal, vertical, width, slope], index) => {
        const matrix =
          'matrix(' + width / 320 + ' ' + slope / 320 + ' 0 1 ' + horizontal + ' ' + vertical + ')'
        return transform(
          '<defs><clipPath id="screen-panel-' +
            index +
            '"><path d="M24 25H296V457H24Z"/></clipPath></defs>' +
            path('M0 0H320V510H0Z', 'url(#wood)', 1, grain) +
            path('M24 25H296V457H24Z', '#ded8bc', 1, grain) +
            group(
              'screen-painting-' + index,
              painting(index),
              'clip-path="url(#screen-panel-' + index + ')"',
            ) +
            line('M13 13H307V490H13Z', '#c0a16a', 2.6, 0.8) +
            path('M0 510H24V564H0ZM296 510H320V564H296Z', 'url(#wood)', 1, grain) +
            times(3, (hinge) =>
              path('M307 ' + (86 + hinge * 143) + 'h13v29h-13Z', '#8e8057', 1, grain),
            ),
          matrix,
        )
      })
      .join(''),
  )
}

function grainMeasures() {
  const scoop = transform(
    path('M-214 -77Q0 -190 211 -78L175 131Q-7 211 -180 123Z', 'url(#wood)', 1, grain) +
      path('M-214 -77Q0 -190 211 -78Q32 -24 -170 59L-180 123Z', '#b99f69', 1, grain) +
      times(23, (index) =>
        line(
          'M' +
            (-190 + index * 17) +
            ' ' +
            (-78 - Math.sin((index / 22) * Math.PI) * 45) +
            'Q' +
            (-164 + index * 15) +
            ' 20 ' +
            (-174 + index * 16) +
            ' ' +
            (118 + Math.sin((index / 22) * Math.PI) * 41),
          '#755e3e',
          2,
          0.5,
        ),
      ) +
      times(16, (index) =>
        line(
          'M-187 ' +
            (-56 + index * 12) +
            'Q-9 ' +
            (-117 + index * 14) +
            ' 184 ' +
            (-56 + index * 12),
          '#cfb57d',
          2,
          0.4,
        ),
      ) +
      line('M-212 -77Q0 -190 211 -78L175 131Q-7 211 -180 123Z', '#786747', 7, 0.9),
    'translate(562 513) rotate(-14) scale(1.3)',
  )
  return (
    group('bamboo-winnowing-tray', scoop) +
    group(
      'wood-grain-measure',
      path('M738 584L1037 533L1193 614L878 682Z', '#b49361', 1, grain) +
        path('M738 584L878 682L888 849L772 764Z', 'url(#wood)', 1, grain) +
        path('M878 682L1193 614L1140 786L888 849Z', '#937044', 1, grain) +
        path('M762 588L1035 549L1162 614L883 662Z', '#6c5b3e', 1, grain) +
        path('M778 601Q952 566 1129 613L883 651Z', '#c4a76a', 1, grain) +
        times(117, (index) => {
          const fraction = (index % 13) / 13,
            row = Math.floor(index / 13)
          const horizontal = 795 + fraction * 307 - row * 5
          const vertical = 605 + Math.sin(fraction * Math.PI) * 17 + row * 3
          return transform(
            ellipse(0, 0, 5, 2, '#dec38a', 0.9, grain),
            'translate(' +
              horizontal +
              ' ' +
              vertical +
              ') rotate(' +
              ((index % 5) * 17 - 25) +
              ')',
          )
        }) +
        line('M745 584L1037 537L1188 615L879 678ZM774 752L889 830L1145 774', '#d0ae71', 4, 0.75) +
        line('M814 641L833 801M995 661L967 821M1108 637L1063 799', '#654f37', 2.3, 0.5),
    ) +
    group(
      'scattered-grain',
      times(29, (index) =>
        transform(
          ellipse(0, 0, 6.5, 2.7, index % 3 ? '#c5a064' : '#d6ba7e', 0.95, grain),
          'translate(' +
            (542 + index * 19) +
            ' ' +
            (849 + Math.sin(index * 1.9) * 23) +
            ') rotate(' +
            ((index * 37) % 180) +
            ')',
        ),
      ),
    )
  )
}

function thatchedCottage() {
  const project = (horizontal, depth, elevation) => [
    490 + horizontal + depth * 0.55,
    799 - depth * 0.28 - elevation,
  ]
  const face = (points, color, opacity = 1) =>
    polygon(
      points.map(([horizontal, depth, elevation]) => project(horizontal, depth, elevation)),
      color,
      opacity,
      grain,
    )
  const ridgeFront = project(220, -28, 416),
    ridgeBack = project(220, 263, 416)
  const roofRight = [ridgeFront, ridgeBack, project(480, 263, 242), project(480, -28, 242)]
  const roofLeft = [project(-35, -28, 242), project(-35, 263, 242), ridgeBack, ridgeFront]
  const roofTexture = (left) =>
    times(46, (index) => {
      const depth = -24 + index * 6.2
      const start = project(220, depth, 416)
      const end = project(left ? -35 : 480, depth, 242)
      const middle = start.map(
        (value, axis) => value + (end[axis] - value) * (0.49 + (index % 4) * 0.025),
      )
      return line(
        'M' + start + 'Q' + middle + ' ' + end,
        index % 3 ? '#6e6448' : '#cfb47a',
        2.5,
        index % 3 ? 0.42 : 0.72,
      )
    })
  return (
    group(
      'earthen-floor',
      wash('M304 839Q570 752 1103 779L1283 851Q870 918 332 878Z', '#8c9274', 0.2),
    ) +
    group(
      'cottage-wall',
      face(
        [
          [0, 0, 0],
          [440, 0, 0],
          [440, 0, 246],
          [220, 0, 398],
          [0, 0, 246],
        ],
        '#c2b18a',
      ) +
        face(
          [
            [440, 0, 0],
            [440, 230, 0],
            [440, 230, 246],
            [440, 0, 246],
          ],
          '#9f9b79',
        ) +
        face(
          [
            [14, 0, 0],
            [32, 0, 0],
            [32, 0, 248],
            [14, 0, 248],
          ],
          '#756247',
        ) +
        face(
          [
            [410, 0, 0],
            [429, 0, 0],
            [429, 0, 248],
            [410, 0, 248],
          ],
          '#756247',
        ) +
        face(
          [
            [173, -1, 0],
            [278, -1, 0],
            [278, -1, 190],
            [173, -1, 190],
          ],
          '#514e3e',
        ) +
        face(
          [
            [182, -2, 0],
            [219, -2, 0],
            [219, -2, 180],
            [182, -2, 180],
          ],
          '#8c7755',
        ) +
        face(
          [
            [62, -1, 115],
            [130, -1, 115],
            [130, -1, 190],
            [62, -1, 190],
          ],
          '#5e6652',
        ) +
        line(
          'M' +
            project(95, -2, 116) +
            'L' +
            project(95, -2, 190) +
            'M' +
            project(62, -2, 152) +
            'L' +
            project(130, -2, 152),
          '#aa9570',
          4,
        ) +
        times(6, (index) =>
          line(
            'M' + project(185 + index * 6, -3, 5) + 'L' + project(185 + index * 6, -3, 178),
            '#b8a172',
            1.4,
            0.5,
          ),
        ),
    ) +
    group(
      'thatched-roof',
      '<defs><clipPath id="roof-left-plane">' +
        polygon(roofLeft, 'white') +
        '</clipPath><clipPath id="roof-right-plane">' +
        polygon(roofRight, 'white') +
        '</clipPath></defs>' +
        polygon(roofLeft, 'url(#thatch)', 1, grain) +
        polygon(roofRight, 'url(#thatch)', 1, grain) +
        group('left-thatch-strokes', roofTexture(true), 'clip-path="url(#roof-left-plane)"') +
        group('right-thatch-strokes', roofTexture(false), 'clip-path="url(#roof-right-plane)"') +
        line('M' + ridgeFront + 'L' + ridgeBack, '#a18a59', 12) +
        line(
          'M' + project(-35, -28, 242) + 'L' + ridgeFront + 'L' + project(480, -28, 242),
          '#776544',
          7,
        ),
    ) +
    group(
      'gate-and-fence',
      times(10, (index) => {
        const horizontal = 279 + index * 18
        const vertical = 850 - index * 4.2
        return branch('M' + horizontal + ' ' + vertical + 'l-9 ' + (-102 - (index % 3) * 12), 6)
      }) +
        line('M276 787L439 748M280 826L448 789', '#8a7350', 6) +
        times(9, (index) =>
          branch(
            'M' + (1043 + index * 27) + ' ' + (806 - index * 3) + 'l4 ' + (-89 - (index % 3) * 11),
            5,
          ),
        ) +
        line('M1047 746L1262 723M1044 786L1265 761', '#8a7350', 5) +
        path('M669 821L722 805L788 821L740 842Z', '#9b9f86', 0.8, grain),
    ) +
    group(
      'low-grass',
      times(18, (index) =>
        brush(
          [
            [300 + index * 54, 863],
            [296 + index * 55, 846],
            [310 + index * 54, 828],
            [296 + index * 55, 812 - (index % 3) * 14],
          ],
          7,
          '#798957',
          0.58,
        ),
      ),
    )
  )
}

const studies = [
  {
    id: 'mulberry-silkworm',
    name: '桑葚春蚕',
    category: 'color',
    theme: '桑蚕 / 紫果与柔白',
    note: '锯齿桑叶与成串紫果附枝，蚕体伏在叶面，以体节和胸足说明结构。',
    draw: mulberrySilkworm,
  },
  {
    id: 'gardenia-ivory',
    name: '栀子凝香',
    category: 'color',
    theme: '栀子 / 象牙白与深叶',
    note: '叠瓣白花、尖蕾和深绿叶形成疏密关系，白瓣保持实体色。',
    draw: gardenia,
  },
  {
    id: 'trumpet-vine-orange',
    name: '凌霄映夏',
    category: 'color',
    theme: '藤花 / 橙赭与复叶',
    note: '木质攀枝承接羽状复叶与喇叭花，花筒连到花冠而不悬浮。',
    draw: trumpetVine,
  },
  {
    id: 'bulbul-autumn-branch',
    name: '白头秋枝',
    category: 'figures',
    theme: '白头翁 / 浅冠与栗枝',
    note: '白头翁的冠斑、长尾与短喙区别于前辑小鸟，脚爪扣住秋枝。',
    draw: bulbul,
  },
  {
    id: 'frog-lotus-leaf',
    name: '荷钱听蛙',
    category: 'figures',
    theme: '青蛙 / 褶腿与荷叶',
    note: '低伏青蛙以鼓眼、短前足和折叠后腿表现体积，荷叶承接足部。',
    draw: frogLotus,
  },
  {
    id: 'turtle-resting-stone',
    name: '灵龟探石',
    category: 'figures',
    theme: '龟石 / 甲褐与青灰',
    note: '穹隆背甲、短足、尾和伸出的头颈构成连贯龟形，腹面落在石上。',
    draw: turtleStone,
  },
  {
    id: 'bronze-gu-vessel',
    name: '铜觚清影',
    category: 'color',
    theme: '铜觚 / 暗金与铜绿',
    note: '喇叭口、束腰与外撇圈足同轴连续，器口有内壁，纹饰为原创简化。',
    draw: bronzeGu,
  },
  {
    id: 'earthen-steamer',
    name: '陶甑炊烟',
    category: 'color',
    theme: '炊器 / 陶赭与淡汽',
    note: '上甑下釜叠置，耳与器壁连接，甑底孔和石支承表现装饰性炊蒸意象。',
    draw: steamer,
  },
  {
    id: 'bamboo-xiao-case',
    name: '竹箫流韵',
    category: 'color',
    theme: '洞箫 / 竹褐与绛绦',
    note: '竹节、吹口与指孔沿同一管身，配布套和绦穗，非特定古箫形制复原。',
    draw: bambooXiao,
  },
  {
    id: 'folding-landscape-screen',
    name: '屏上远岫',
    category: 'color',
    theme: '屏风 / 木框与山水',
    note: '三折屏风以连续铰接和交替面向表现空间，屏内绘画限制在实体绢面。',
    draw: foldingScreen,
  },
  {
    id: 'winnowing-grain-measure',
    name: '谷斗丰登',
    category: 'color',
    theme: '丰收 / 竹箕与木斗',
    note: '编竹簸箕与方木量斗呈现口沿、内腔、板厚和谷粒，非标准容量示意。',
    draw: grainMeasures,
  },
  {
    id: 'thatched-cottage-gate',
    name: '茅舍柴扉',
    category: 'ink',
    theme: '乡居 / 茅顶与柴篱',
    note: '茅舍、梁柱、屋面与墙体使用共同投影，门口踏石和柴篱承接地面。',
    draw: thatchedCottage,
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
console.log('Generated twelve pastoral ink studies')
