import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/spring-studies/ink-wash',
)
const times = (count, draw) => Array.from({ length: count }, (_, index) => draw(index)).join('')
const pigment = 'filter="url(#pigment)"'
const path = (shape, fill, opacity = 1, extra = pigment) =>
  `<path d="${shape}" fill="${fill}" opacity="${opacity}" ${extra}/>`
const line = (shape, color = '#494e40', width = 2, opacity = 1) =>
  `<path d="${shape}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
const ellipse = (horizontal, vertical, radiusX, radiusY, fill, opacity = 1) =>
  `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${fill}" opacity="${opacity}" ${pigment}/>`
const move = (content, transformation) => `<g transform="${transformation}">${content}</g>`
const group = (identity, content) => `<g id="${identity}">${content}</g>`
const definitions = `<defs>
<filter id="pigment" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency=".3" numOctaves="2" seed="127" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .14 0 0 0 .86" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="paint"/><feTurbulence type="fractalNoise" baseFrequency=".038" numOctaves="2" seed="42" result="edge"/><feDisplacementMap in="paint" in2="edge" scale="2.8" xChannelSelector="R" yChannelSelector="G"/></filter>
${[
  ['leaf', '#9aa46b', '#678356', '#385b4e'],
  ['indigo', '#b4a5ce', '#8276ae', '#4c4c80'],
  ['hydrangea', '#bec3d8', '#879bb9', '#566f99'],
  ['gourd', '#c4b574', '#a79a57', '#6e7b47'],
  ['wood', '#b29167', '#8b6c4b', '#55483a'],
  ['stone', '#b5b4a2', '#949a8b', '#657770'],
  ['rust', '#d28c60', '#ae6a48', '#7d4c3b'],
  ['feather', '#697773', '#3c5355', '#273a40'],
  ['lacquer', '#c16b50', '#a34e3a', '#6b342e'],
  ['gold', '#d3b272', '#ac8c4c', '#776b49'],
  ['silk', '#eee2c6', '#d7cba9', '#b5b392'],
  ['earth', '#c7b391', '#ad9977', '#817759'],
]
  .map(
    ([identity, top, middle, bottom]) =>
      `<linearGradient id="${identity}" x1="15%" y1="0%" x2="75%" y2="100%"><stop stop-color="${top}"/><stop offset=".48" stop-color="${middle}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`,
  )
  .join('')}
<radialGradient id="tea"><stop stop-color="#f0dfb8"/><stop offset=".72" stop-color="#d7bd89"/><stop offset="1" stop-color="#997442"/></radialGradient>
<radialGradient id="glaze" cx="42%" cy="25%" r="80%"><stop stop-color="#9f845e"/><stop offset=".5" stop-color="#65523d"/><stop offset="1" stop-color="#342f2c"/></radialGradient>
<radialGradient id="peach" cx="27%" cy="30%" r="85%"><stop stop-color="#e1bd89"/><stop offset=".55" stop-color="#ce9b7d"/><stop offset="1" stop-color="#b57470"/></radialGradient>
<radialGradient id="peach-blush" cx="75%" cy="20%" r="75%"><stop stop-color="#b86b70" stop-opacity=".75"/><stop offset="1" stop-color="#b86b70" stop-opacity="0"/></radialGradient>
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
  for (let step = 0; step <= 26; step++) {
    const fraction = step / 26
    const center = curve(fraction)
    const before = curve(Math.max(0, fraction - 0.003))
    const after = curve(Math.min(1, fraction + 0.003))
    const length = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
    const normal = [-(after[1] - before[1]) / length, (after[0] - before[0]) / length]
    const half =
      (breadth * (0.28 + 0.72 * Math.sin(Math.PI * fraction)) * (1 - 0.85 * fraction)) / 2
    left.push(center.map((value, axis) => +(value + normal[axis] * half).toFixed(2)))
    right.unshift(center.map((value, axis) => +(value - normal[axis] * half).toFixed(2)))
  }
  return path(
    'M' + [...left, ...right].map((point) => point.join(' ')).join('L') + 'Z',
    color,
    opacity,
  )
}

function leaf(horizontal, vertical, rotation, scale = 1, color = 'url(#leaf)') {
  return move(
    path('M0 0C-44 -24 -61 -97 -10 -143C30 -103 37 -39 0 0Z', color) +
      line('M0 -5Q-6 -67 -10 -133M-6 -54L-29 -81M-7 -79L13 -104', '#c6c795', 1.5, 0.54),
    `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})`,
  )
}

function rock(horizontal, vertical, scale = 1) {
  return move(
    path('M-158 10L-131 -64L-79 -113L-20 -96L37 -137L113 -80L160 16L64 40L-69 32Z', 'url(#stone)') +
      path('M37 -137L20 -41L64 40L160 16L113 -80Z', '#59766a', 0.36) +
      times(17, (index) =>
        brush(
          [
            [-113 + (index % 6) * 41, -40 - Math.floor(index / 6) * 18],
            [-120 + (index % 6) * 41, -27 - Math.floor(index / 6) * 18],
            [-103 + (index % 6) * 41, -10 - Math.floor(index / 6) * 18],
            [-109 + (index % 6) * 41, 8 - Math.floor(index / 6) * 18],
          ],
          3,
          '#50685c',
          0.46,
        ),
      ),
    `translate(${horizontal} ${vertical}) scale(${scale})`,
  )
}

function ground(horizontal, vertical, width = 360) {
  return (
    ellipse(horizontal, vertical, width, 29, '#867d62', 0.14) +
    line(
      `M${horizontal - width - 27} ${vertical + 9}Q${horizontal - width / 2} ${vertical - 6} ${horizontal - 40} ${vertical + 10}`,
      '#7f8468',
      3,
      0.3,
    )
  )
}

function irisFlower(horizontal, vertical, rotation, scale = 1) {
  return move(
    path('M0 14C-39 -21 -57 -111 -24 -133C9 -143 12 -61 0 14Z', '#8b80b4') +
      path('M3 12C-6 -53 24 -131 50 -117C80 -93 31 -26 3 12Z', 'url(#indigo)') +
      path('M-2 15C-24 -25 -4 -144 19 -139C49 -114 14 -37 -2 15Z', '#a99ac9') +
      path('M-4 12C-46 -8 -114 9 -111 47C-98 88 -35 61 -4 22Z', 'url(#indigo)') +
      path('M5 15C50 -10 118 8 107 45C97 80 37 56 5 22Z', 'url(#indigo)') +
      path('M0 9C-33 38 -31 101 1 117C38 102 44 40 0 9Z', 'url(#indigo)') +
      brush(
        [
          [-4, 22],
          [-24, 35],
          [-49, 45],
          [-75, 45],
        ],
        10,
        '#e1b45d',
      ) +
      brush(
        [
          [6, 23],
          [27, 33],
          [50, 40],
          [74, 38],
        ],
        10,
        '#e1b45d',
      ) +
      brush(
        [
          [1, 28],
          [-1, 43],
          [2, 66],
          [4, 87],
        ],
        11,
        '#dfb962',
      ) +
      line('M-25 39Q-48 59 -75 58M28 38Q52 55 77 51M-8 47Q-12 77 0 96', '#565481', 2.3, 0.6),
    `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})`,
  )
}

function irises() {
  return (
    group(
      'water-and-rock',
      ellipse(807, 839, 396, 37, '#779b96', 0.17) +
        rock(1011, 805, 0.74) +
        line('M339 865Q489 844 628 862M934 885Q1091 875 1245 880', '#759c94', 3, 0.4),
    ) +
    group(
      'sword-leaves',
      [
        [
          [
            [690, 829],
            [519, 647],
            [447, 453],
            [440, 351],
          ],
          45,
          '#627e58',
        ],
        [
          [
            [713, 836],
            [583, 626],
            [607, 327],
            [663, 254],
          ],
          42,
          '#718859',
        ],
        [
          [
            [736, 841],
            [788, 645],
            [909, 528],
            [1049, 486],
          ],
          48,
          '#7b8d60',
        ],
        [
          [
            [706, 832],
            [647, 557],
            [758, 332],
            [823, 276],
          ],
          39,
          '#426650',
        ],
        [
          [
            [728, 841],
            [864, 698],
            [1031, 678],
            [1124, 702],
          ],
          40,
          '#809163',
        ],
        [
          [
            [722, 834],
            [788, 593],
            [809, 382],
            [783, 310],
          ],
          35,
          '#567551',
        ],
      ]
        .map(([points, width, color]) => brush(points, width, color))
        .join(''),
    ) +
    group(
      'flower-stems',
      line(
        'M709 831Q690 569 602 423M728 834Q744 514 831 396M724 834Q848 649 980 591',
        '#55754e',
        7,
      ) +
        leaf(697, 681, -47, 0.4) +
        leaf(765, 616, 50, 0.43),
    ) +
    group(
      'flowers',
      irisFlower(601, 417, -13, 1.04) +
        irisFlower(832, 386, 16, 0.8) +
        move(
          path('M0 0Q-26 -48 -7 -95Q20 -84 18 -43Z', '#8b7baa') +
            path('M-7 -95Q-28 -45 0 0L7 -41Z', '#637e53'),
          'translate(980 590) rotate(39)',
        ),
    )
  )
}

function hydrangeas() {
  const clusters = [
    [629, 384, 146, 1],
    [893, 456, 122, 0.84],
    [777, 263, 102, 0.7],
  ]
  return (
    group('foot-stone', ground(815, 851) + rock(1061, 809, 0.62)) +
    group(
      'stems-and-leaves',
      line(
        'M752 837Q729 617 630 390M752 837Q762 619 893 460M749 831Q774 570 778 270',
        '#6d7952',
        10,
      ) +
        line(
          'M734 693L710 693M747 742L761 742M708 595L695 595M804 597L810 597M766 481L761 481M749 801L744 801',
          '#6d7952',
          4,
        ) +
        [
          [710, 693, -67, 1.13],
          [761, 742, 65, 1.05],
          [695, 595, -53, 0.9],
          [810, 597, 67, 0.96],
          [761, 481, -11, 0.71],
          [744, 801, -83, 0.79],
        ]
          .map(([horizontal, vertical, rotation, scale]) =>
            move(
              path(
                'M0 0L-24 -13L-23 -22L-40 -27L-35 -37L-51 -46L-42 -57L-52 -70L-40 -77L-43 -91L-27 -96L-23 -110L-10 -121L3 -108L17 -108L20 -95L35 -90L31 -75L43 -65L35 -52L43 -38L29 -29L26 -14L10 -13Z',
                'url(#leaf)',
              ) +
                line(
                  'M0 -5L-10 -112M-4 -40L-34 -65M-6 -62L22 -84M-3 -30L22 -50',
                  '#c0c698',
                  1.6,
                  0.55,
                ),
              `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})`,
            ),
          )
          .join(''),
    ) +
    group(
      'rounded-flower-heads',
      clusters
        .map(([horizontal, vertical, radius, scale]) =>
          move(
            ellipse(0, 0, radius, radius * 0.83, '#7188a3', 0.7) +
              times(56, (index) => {
                const angle = index * 2.399963
                const distance = Math.sqrt((index + 0.4) / 56) * radius * 0.94
                const centerX = Math.cos(angle) * distance
                const centerY = Math.sin(angle) * distance * 0.81
                const size = (17 + (index % 4) * 2) * (0.83 + 0.18 * Math.cos(angle))
                return move(
                  times(4, (petal) =>
                    move(
                      path(
                        `M0 2C${-size} ${-size * 0.15} ${-size * 1.08} ${-size * 1.03} -3 ${-size * 1.25}C${size * 0.72} ${-size * 1.2} ${size * 0.81} ${-size * 0.4} 0 2Z`,
                        ['#acbad1', '#bfc4d8', '#8ea7c6', '#a5a9c7'][(index + petal) % 4],
                      ),
                      `rotate(${petal * 90 + (index % 7) * 4})`,
                    ),
                  ) + ellipse(0, 0, 3.3, 3.3, '#d7d3b1'),
                  `translate(${centerX} ${centerY})`,
                )
              }),
            `translate(${horizontal} ${vertical}) scale(${scale})`,
          ),
        )
        .join(''),
    )
  )
}

function gourdFruit(horizontal, vertical, scale, rotation) {
  return move(
    line('M0 -24Q3 -8 0 4', '#69744e', 7) +
      path(
        'M0 0C-43 -3 -58 33 -42 71C-35 89 -34 103 -56 133C-102 193 -71 273 0 282C69 286 111 218 79 155C63 121 28 94 33 77C52 35 34 1 0 0Z',
        'url(#gourd)',
      ) +
      path(
        'M29 30C48 67 10 92 37 129C87 194 59 249 25 268C92 251 106 192 70 147C38 108 27 95 34 74C44 46 42 38 29 30Z',
        '#6d7b49',
        0.33,
      ) +
      line('M-15 22Q-36 41 -23 71M-40 164Q-63 217 -29 246', '#d6c789', 5, 0.48) +
      ellipse(2, 276, 8, 3, '#7f774b'),
    `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})`,
  )
}

function vineLeaf(horizontal, vertical, rotation, scale) {
  return move(
    path(
      'M0 0C-17 22 -49 6 -57 -20Q-91 -28 -74 -60Q-96 -84 -65 -100Q-67 -124 -38 -116Q-28 -145 -4 -127Q18 -151 34 -125Q65 -132 64 -105Q96 -87 76 -60Q93 -32 60 -17Q43 10 19 -3L7 -24Z',
      'url(#leaf)',
    ) +
      line(
        'M0 -3L-1 -117M-1 -47L-58 -83M-1 -49L58 -80M-2 -79L-37 -107M0 -81L37 -108',
        '#bdc69a',
        2,
        0.62,
      ),
    `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})`,
  )
}

function gourds() {
  return (
    group(
      'branch',
      brush(
        [
          [370, 438],
          [622, 225],
          [878, 387],
          [1219, 271],
        ],
        20,
        '#72674a',
      ) +
        line(
          'M557 330Q562 442 592 482M900 341Q891 456 890 499M759 339Q789 253 837 254Q896 258 859 294Q831 306 825 284M1047 317Q1117 347 1090 385Q1062 401 1060 374',
          '#6d7a4e',
          4,
        ),
    ) +
    group(
      'back-leaves',
      vineLeaf(505, 368, -56, 1.22) + vineLeaf(729, 331, 15, 1.3) + vineLeaf(1095, 311, 53, 1.12),
    ) +
    group('hanging-fruit', gourdFruit(591, 479, 1.03, 12) + gourdFruit(890, 498, 0.79, -17)) +
    group(
      'front-leaves',
      vineLeaf(935, 335, -17, 1.26) + vineLeaf(632, 336, -52, 0.83) + vineLeaf(1189, 282, 60, 0.72),
    )
  )
}

function autumnTallow() {
  const branches = [
    [
      [441, 805],
      [592, 631],
      [743, 382],
      [1094, 279],
    ],
    [
      [622, 592],
      [594, 472],
      [560, 367],
      [485, 288],
    ],
    [
      [796, 414],
      [886, 429],
      [1011, 437],
      [1154, 390],
    ],
  ]
  return (
    group(
      'tallow-branches',
      branches.map((points, index) => brush(points, index === 0 ? 24 : 11, '#6a5d46')).join('') +
        line(
          'M597 499L637 391M731 477L716 334M897 340L899 239M1007 411L1023 334M1045 296L1153 225',
          '#73634a',
          4,
        ),
    ) +
    group(
      'autumn-leaves',
      [
        [495, 300, -44, 1.03],
        [555, 384, 25, 1.1],
        [636, 395, 27, 0.93],
        [720, 344, -30, 0.9],
        [795, 414, 73, 1.08],
        [901, 246, -22, 0.96],
        [1022, 336, 43, 0.92],
        [1108, 403, 71, 0.92],
        [1151, 234, 18, 0.8],
        [667, 570, 72, 0.86],
      ]
        .map(([horizontal, vertical, rotation, scale], index) =>
          move(
            path(
              'M0 0C-20 -22 -52 -47 -51 -66L-8 -115L45 -70C49 -48 21 -23 0 0Z',
              ['#ad5944', '#bb7950', '#cb9b59', '#8e7347'][index % 4],
            ) + line('M0 -4L-7 -107M-3 -37L-31 -58M-5 -56L24 -77', '#e0b17a', 1.7, 0.65),
            `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})`,
          ),
        )
        .join(''),
    ) +
    group(
      'split-capsules',
      [
        [820, 399],
        [853, 380],
        [879, 367],
        [1086, 286],
        [1112, 274],
      ]
        .map(([horizontal, vertical], index) =>
          move(
            line('M0 -2L-7 -28', '#746548', 3) +
              path('M-19 10Q-31 -12 -11 -23L0 -5L14 -22Q35 -3 18 15L3 4L-3 25Z', '#5d5949') +
              ellipse(-8, -3, 8, 10, '#e3d8bd') +
              ellipse(11, 1, 8, 10, '#c9c5ad') +
              ellipse(1, 15, 8, 9, '#d5cfb6'),
            `translate(${horizontal} ${vertical}) rotate(${index * 13 - 20})`,
          ),
        )
        .join(''),
    )
  )
}

function hoopoe() {
  return (
    group(
      'earth-and-grass',
      ground(801, 785) +
        rock(1038, 757, 0.48) +
        times(7, (index) =>
          brush(
            [
              [464 + index * 18, 776],
              [445 + index * 16, 722],
              [439 + index * 18, 687],
              [423 + index * 22, 669 + (index % 3) * 20],
            ],
            7,
            '#8e9668',
            0.7,
          ),
        ),
    ) +
    group(
      'far-leg',
      line(
        'M797 676Q805 711 801 739L831 765M801 739Q792 756 778 769M831 765L853 767',
        '#6b5a46',
        7,
      ),
    ) +
    group(
      'tail',
      path('M865 571Q971 623 1053 704L1022 741Q912 687 827 652Z', '#393e3b') +
        path('M927 625L972 655L986 708L946 688Z', '#c6c0a7'),
    ) +
    group(
      'body',
      path(
        'M664 447C705 409 824 451 879 531C922 588 878 676 788 704C697 716 632 663 637 586C638 533 660 501 664 447Z',
        'url(#rust)',
      ) +
        path('M751 479C839 475 884 534 878 593Q866 647 790 665L711 576Z', '#3f4541') +
        `<clipPath id="hoopoe-wing"><path d="M751 479C839 475 884 534 878 593Q866 647 790 665L711 576Z"/></clipPath><g clip-path="url(#hoopoe-wing)">` +
        times(5, (index) =>
          path(
            `M${704 + index * 33} ${491 + index * 15}Q${743 + index * 33} ${551 + index * 12} ${750 + index * 31} ${648 + index * 4}L${736 + index * 31} ${653 + index * 4}Q${727 + index * 33} ${553 + index * 12} ${692 + index * 33} ${504 + index * 15}Z`,
            '#d3c7aa',
            0.92,
          ),
        ) +
        '</g>' +
        times(16, (index) =>
          brush(
            [
              [678 + (index % 4) * 27, 526 + Math.floor(index / 4) * 30],
              [671 + (index % 4) * 27, 537 + Math.floor(index / 4) * 30],
              [682 + (index % 4) * 27, 548 + Math.floor(index / 4) * 30],
              [678 + (index % 4) * 27, 555 + Math.floor(index / 4) * 30],
            ],
            3,
            '#cf9467',
            0.45,
          ),
        ),
    ) +
    group(
      'crest',
      times(10, (index) => {
        const angle = -70 + index * 10
        const length = 111 + 18 * Math.sin((index / 9) * Math.PI)
        return move(
          path(
            `M0 12Q-15 ${-length * 0.6} -7 ${-length}Q3 ${-length - 15} 10 ${-length}Q20 ${-length * 0.55} 9 12Z`,
            'url(#rust)',
          ) +
            path(
              `M-7 ${-length}Q3 ${-length - 15} 10 ${-length}L12 ${-length + 24}L-9 ${-length + 26}Z`,
              '#3e4037',
            ),
          `translate(664 432) rotate(${angle})`,
        )
      }),
    ) +
    group(
      'head-and-beak',
      path(
        'M668 408C620 389 587 414 584 451C586 493 620 518 664 503Q685 503 702 480L695 442Z',
        'url(#rust)',
      ) +
        path('M590 441Q507 456 463 502Q494 457 589 429Z', '#444b43') +
        line('M588 441Q515 461 479 490', '#c1b28c', 1.6, 0.62) +
        ellipse(615, 436, 8, 7, '#333b35') +
        ellipse(613, 434, 2, 2, '#e0c79b'),
    ) +
    group(
      'near-leg',
      line(
        'M752 689Q745 727 730 748Q714 766 694 775M730 748Q740 764 756 771M694 775L674 778M699 773L707 782M756 771L774 777',
        '#6c5a46',
        7,
      ),
    )
  )
}

function cormorant() {
  return (
    group(
      'water',
      ellipse(815, 862, 434, 33, '#789996', 0.17) +
        line('M330 876Q473 862 592 878M1001 882Q1163 869 1275 884', '#698d89', 3, 0.4),
    ) +
    group('perch-rock', rock(840, 824, 1.14)) +
    group(
      'far-webbed-foot',
      path('M843 693L863 756L903 776L868 776L853 792L846 770L818 778L841 751L824 698Z', '#45574e'),
    ) +
    group(
      'tail',
      path('M876 588L1016 747L995 768L857 678Z', '#2d4446') +
        line('M887 628L993 752', '#667b74', 2.6, 0.65),
    ) +
    group(
      'body-and-neck',
      path(
        'M730 464C714 428 679 425 667 391C651 345 686 303 727 303C773 306 780 340 755 356C737 360 717 347 707 365C692 393 735 399 767 423C832 438 910 503 924 565C942 635 897 695 822 710C748 711 704 665 707 603C703 546 746 512 730 464Z',
        'url(#feather)',
      ) +
        path('M768 474C855 459 919 544 896 616Q869 676 809 671L758 592Z', '#3b5559') +
        times(32, (index) => {
          const horizontal = 780 + (index % 5) * 22 + Math.floor(index / 5) * 2
          const vertical = 497 + Math.floor(index / 5) * 22
          return line(`M${horizontal} ${vertical}q12 2 14 17q-8 7 -15 4`, '#82917f', 2, 0.4)
        }) +
        brush(
          [
            [727, 366],
            [705, 388],
            [724, 412],
            [741, 438],
          ],
          12,
          '#9aa995',
          0.46,
        ),
    ) +
    group(
      'face',
      path('M737 334L791 338Q800 343 787 360L772 355L779 349L738 351Z', '#b99a56') +
        path('M726 346Q742 346 750 359L738 378L719 367Z', '#c2ad74') +
        ellipse(731, 332, 6, 5, '#8d9b82') +
        ellipse(732, 332, 3.5, 4, '#233a3a'),
    ) +
    group(
      'near-webbed-foot',
      path('M788 692L787 765L757 795L787 785L806 800L808 782L838 793L803 763L807 698Z', '#3c5048') +
        line('M788 769L787 785M800 770L808 782', '#819080', 2, 0.6),
    )
  )
}

function lacquerTray() {
  return (
    group('table-shadow', ground(802, 792, 460)) +
    group(
      'tray',
      path(
        'M364 562C397 475 1203 475 1238 562L1230 657C1201 775 396 776 372 661Z',
        'url(#lacquer)',
      ) +
        ellipse(801, 566, 438, 132, '#693c32') +
        ellipse(801, 551, 423, 116, '#be6e4e') +
        ellipse(801, 549, 397, 96, '#9f4e38') +
        line('M384 593C435 727 1171 728 1218 592', '#dda672', 4, 0.63) +
        times(13, (index) =>
          move(
            path('M0 0Q-8 -12 0 -22Q13 -11 19 -3Q8 -5 0 0Z', '#d1a362', 0.73),
            `translate(${481 + index * 53} ${666 + 29 * Math.sin((index / 12) * Math.PI)}) rotate(${index * 5 - 30})`,
          ),
        ),
    ) +
    group(
      'peaches',
      [
        [641, 525, -10, 1.06],
        [834, 496, 19, 1.03],
        [1002, 559, 30, 0.9],
      ]
        .map(([horizontal, vertical, rotation, scale]) =>
          move(
            path(
              'M0 -72C-24 -94 -78 -76 -87 -27C-104 27 -67 78 -13 77Q1 77 4 89Q13 74 34 72C93 62 105 0 78 -44C57 -79 28 -86 0 -72Z',
              'url(#peach)',
            ) +
              path(
                'M0 -72C-24 -94 -78 -76 -87 -27C-104 27 -67 78 -13 77Q1 77 4 89Q13 74 34 72C93 62 105 0 78 -44C57 -79 28 -86 0 -72Z',
                'url(#peach-blush)',
              ) +
              line('M0 -69C-22 -36 -28 22 -2 68', '#a06c5c', 2.4, 0.55) +
              line('M0 -70Q-4 -84 7 -91', '#72654a', 5) +
              leaf(3, -80, 62, 0.45),
            `translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})`,
          ),
        )
        .join(''),
    )
  )
}

function teaBowl() {
  return (
    group(
      'cloth',
      path('M353 695L1117 648L1266 780L487 840Z', '#aaa992', 0.43) +
        line('M441 732L1154 695M480 788L1218 749', '#777e6b', 2, 0.4),
    ) +
    group(
      'bowl-foot',
      ellipse(791, 765, 149, 30, '#393a31') +
        path('M647 739L650 768Q784 812 931 767L935 740Z', '#595343'),
    ) +
    group(
      'bowl-body',
      path('M450 469C478 657 600 763 791 773C992 768 1113 650 1136 469Z', 'url(#glaze)') +
        times(70, (index) => {
          const fraction = index / 69
          const upperX = 463 + fraction * 659
          const lowerX = 656 + fraction * 272
          const upperY = 494 + 62 * Math.sin(fraction * Math.PI)
          const lowerY = 704 + 46 * Math.sin(fraction * Math.PI)
          return line(
            `M${upperX} ${upperY}Q${upperX * 0.45 + lowerX * 0.55} ${lowerY - 63} ${lowerX} ${lowerY}`,
            index % 3 === 0 ? '#b19967' : '#8a7550',
            index % 4 === 0 ? 3 : 1.4,
            0.34,
          )
        }),
    ) +
    group(
      'rim-and-tea',
      ellipse(793, 470, 346, 121, '#37372f') +
        ellipse(793, 466, 333, 109, '#8d7755') +
        ellipse(793, 471, 319, 97, '#494032') +
        ellipse(793, 481, 296, 76, 'url(#tea)') +
        times(85, (index) => {
          const angle = index * 2.4
          const distance = Math.sqrt((index + 0.5) / 85)
          return ellipse(
            793 + Math.cos(angle) * distance * 281,
            481 + Math.sin(angle) * distance * 69,
            2 + (index % 4),
            1 + (index % 3),
            '#eee0bd',
            0.5,
          )
        }) +
        line('M501 456Q766 350 1074 452', '#c7aa76', 3, 0.6),
    ) +
    group(
      'bamboo-whisk',
      move(
        line('M0 0L0 -188', '#a78a58', 18) +
          path('M-12 -15Q-39 39 -46 83Q0 117 46 83Q35 35 11 -15Z', '#bb9d61', 0.6) +
          times(19, (index) =>
            line(
              `M${-9 + index} -11Q${-51 + index * 5.7} 36 ${-43 + index * 4.8} ${82 + 14 * Math.sin((index / 18) * Math.PI)}`,
              '#8f774b',
              1.7,
              0.76,
            ),
          ) +
          line('M-10 -6L10 -6M-10 -13L10 -13', '#635642', 3),
        'translate(1197 639) rotate(29) scale(.72)',
      ),
    )
  )
}

function bronzeLock() {
  return (
    group('ground', ground(804, 817, 426)) +
    group(
      'box',
      path('M399 476L950 399L1183 521L648 613Z', 'url(#wood)') +
        path('M399 476L648 613L646 803L402 658Z', '#73573d') +
        path('M648 613L1183 521L1173 711L646 803Z', '#936b43') +
        line('M404 513L649 650L1179 558', '#493e31', 9) +
        line(
          'M430 585L610 690M702 720Q880 682 1128 650M697 744Q927 710 1130 674M475 512L907 451',
          '#b28d5a',
          3,
          0.55,
        ),
    ) +
    group(
      'metal-corners',
      path('M398 476L448 469L448 515L403 525Z', 'url(#gold)') +
        path('M1136 530L1183 521L1180 573L1138 581Z', 'url(#gold)') +
        path('M647 613L697 604L696 653L648 662L613 641L614 594Z', 'url(#gold)') +
        path('M647 757L694 748L692 795L647 804L612 783L613 739Z', 'url(#gold)'),
    ) +
    group(
      'hasp-and-lock',
      path('M866 571L895 566L895 665L866 670Z', '#b79957') +
        ellipse(880, 590, 5, 5, '#5f5c41') +
        path(
          'M857 646L855 625Q882 594 909 616L912 642L899 644L897 626Q883 615 870 629L871 646Z',
          '#c2aa67',
        ) +
        path('M793 646L967 617L988 633L817 663Z', '#cfb470') +
        path('M817 663L988 633L986 700L816 729Z', 'url(#gold)') +
        path('M793 646L817 663L816 729L793 708Z', '#8d774a') +
        path('M901 672L917 669L917 680L911 681L911 696L905 697L905 682L901 683Z', '#4c5140') +
        line('M837 679L970 656', '#dfc78b', 2.4, 0.6),
    )
  )
}

function silkFan() {
  return (
    group(
      'silk-ribbon',
      path(
        'M800 738C722 775 762 849 665 884L695 896C788 868 760 797 815 770C850 821 906 806 931 865L956 849C915 786 855 807 832 748Z',
        '#a66970',
        0.8,
      ),
    ) +
    group(
      'handle',
      path('M790 620L816 620L828 898Q814 919 800 896Z', 'url(#wood)') +
        line('M806 654L815 894', '#d2b27f', 3, 0.6),
    ) +
    group(
      'fan-face',
      ellipse(807, 440, 277, 263, 'url(#silk)') +
        `<clipPath id="fan-clip"><ellipse cx="807" cy="440" rx="260" ry="247"/></clipPath>` +
        `<g clip-path="url(#fan-clip)">` +
        brush(
          [
            [661, 690],
            [701, 549],
            [781, 427],
            [990, 335],
          ],
          12,
          '#776c4c',
        ) +
        line('M753 480Q703 431 658 423M843 410Q814 343 847 302M927 360L967 282', '#7f7654', 3) +
        [
          [703, 532, -48, 0.52],
          [778, 452, 62, 0.51],
          [659, 423, -35, 0.5],
          [849, 307, 18, 0.46],
          [970, 287, 31, 0.4],
        ]
          .map((parameters) => leaf(...parameters, '#829371'))
          .join('') +
        [
          [738, 491, 1],
          [871, 388, 0.85],
          [958, 333, 0.62],
        ]
          .map(([horizontal, vertical, scale]) =>
            move(
              times(5, (index) =>
                move(
                  path('M0 2C-27 -1 -41 -40 -16 -51C6 -59 22 -23 0 2Z', '#d8aca4'),
                  `rotate(${index * 72})`,
                ),
              ) +
                ellipse(0, 0, 9, 8, '#aa7865') +
                times(9, (index) =>
                  move(
                    line('M0 -5L1 -23', '#ac8860', 1.2) + ellipse(1, -23, 2.3, 2.3, '#c2a76d'),
                    `rotate(${index * 40})`,
                  ),
                ),
              `translate(${horizontal} ${vertical}) scale(${scale})`,
            ),
          )
          .join('') +
        '</g>' +
        `<ellipse cx="807" cy="440" rx="272" ry="258" fill="none" stroke="#84764d" stroke-width="9" opacity=".8"/>` +
        `<ellipse cx="807" cy="440" rx="261" ry="247" fill="none" stroke="#baa579" stroke-width="3"/>`,
    ) +
    group(
      'neck-binding',
      path('M787 680L824 680L825 729L792 729Z', '#90724c') +
        times(6, (index) => line(`M791 ${686 + index * 7}L824 ${683 + index * 7}`, '#c4a777', 2)),
    )
  )
}

function stoneRoller() {
  return (
    group('threshing-ground', ground(808, 850, 506)) +
    group(
      'bed',
      path('M357 639L357 704C426 868 1179 866 1249 700L1249 640Z', '#8e9481') +
        ellipse(803, 640, 447, 151, 'url(#stone)') +
        ellipse(803, 635, 354, 105, '#b9b39a') +
        line('M386 704C533 821 1102 817 1225 704', '#64766a', 3, 0.6) +
        line('M462 633C536 522 1114 525 1141 637C1100 747 530 755 462 633Z', '#8a8e77', 5, 0.6),
    ) +
    group(
      'roller',
      path('M878 535C876 488 961 461 995 488L1091 558L998 672L897 602Z', 'url(#stone)') +
        ellipse(1035, 612, 73, 69, '#899583') +
        ellipse(1035, 612, 61, 57, '#a5aa93') +
        ellipse(1035, 612, 12, 12, '#586653') +
        times(11, (index) =>
          line(
            `M${913 + index * 8} ${507 + index * 5}L${905 + index * 8} ${577 + index * 5}`,
            '#6c7c6a',
            2.5,
            0.45,
          ),
        ),
    ) +
    group(
      'pivot-and-beam',
      path('M784 605L784 440L811 435L818 610Z', 'url(#wood)') +
        ellipse(800, 441, 17, 8, '#c5ac7d') +
        path('M791 468L1124 640L1114 660L786 490Z', '#8a6f4c') +
        line('M806 476L1118 643', '#c4a16a', 3, 0.55) +
        path('M1022 589L1042 584L1048 615L1033 627Z', '#77674a'),
    ) +
    group(
      'grain-straw',
      times(17, (index) =>
        move(
          brush(
            [
              [0, 0],
              [-4, -60],
              [4, -109],
              [0, -161],
            ],
            4,
            '#a18a53',
          ) +
            times(9, (seed) =>
              move(
                ellipse(-6, -113 - seed * 5, 6, 3, '#c0a263') +
                  ellipse(5, -115 - seed * 5, 6, 3, '#af945a'),
                `rotate(${seed % 2 ? 4 : -4})`,
              ),
            ),
          `translate(${438 + index * 5} ${818 + (index % 3) * 5}) rotate(${-40 + index * 4}) scale(.78)`,
        ),
      ),
    )
  )
}

function plankBridge() {
  return (
    group(
      'far-bank',
      path('M322 596Q423 494 588 523L681 594L570 658L353 654Z', '#9eaa91', 0.4) +
        path('M1059 514Q1171 469 1292 561L1303 629L1107 628Z', '#a5ad91', 0.36),
    ) +
    group(
      'water',
      ellipse(829, 789, 441, 80, '#8ba9a1', 0.13) +
        line(
          'M500 811Q656 789 830 809M795 865Q1033 843 1212 855M478 736Q554 718 645 731',
          '#70958e',
          3,
          0.4,
        ),
    ) +
    group(
      'bridge-bearings',
      rock(453, 715, 0.65) +
        rock(1116, 650, 0.64) +
        path('M489 667L516 668L516 736L493 740ZM1023 598L1047 597L1052 676L1029 682Z', '#655b44'),
    ) +
    group(
      'bridge-beams',
      path('M438 656L1086 575L1110 595L464 681Z', '#766145') +
        path('M465 681L1110 595L1107 619L463 707Z', '#594e3b') +
        path('M491 705L1134 620L1133 645L491 730Z', '#66543e'),
    ) +
    group(
      'deck',
      times(22, (index) => {
        const horizontal = 449 + index * 29
        const vertical = 645 - index * 3.65
        return (
          path(
            `M${horizontal} ${vertical}L${horizontal + 27} ${vertical - 3.4}L${horizontal + 82} ${vertical + 41}L${horizontal + 54} ${vertical + 45}Z`,
            index % 3 ? '#a68c61' : '#b8a276',
          ) +
          line(
            `M${horizontal + 10} ${vertical + 5}L${horizontal + 56} ${vertical + 39}`,
            '#756447',
            1.5,
            0.6,
          )
        )
      }),
    ) +
    group(
      'banks-and-grass',
      rock(437, 731, 0.6) +
        rock(1181, 682, 0.65) +
        times(9, (index) =>
          brush(
            [
              [1141 + index * 8, 669],
              [1130 + index * 16, 617],
              [1119 + index * 19, 563],
              [1114 + index * 21, 542 + (index % 3) * 25],
            ],
            10,
            index % 2 ? '#78926a' : '#657f59',
          ),
        ) +
        times(6, (index) =>
          brush(
            [
              [395 + index * 9, 724],
              [373 + index * 7, 666],
              [361 + index * 7, 635],
              [345 + index * 13, 616 + (index % 2) * 20],
            ],
            9,
            '#7a8d66',
          ),
        ),
    )
  )
}

const studies = [
  [
    'iris-waterside-violet',
    '鸢尾临水',
    'color',
    '花卉 / 鸢紫与苍绿',
    '三垂瓣、三立瓣围合花心，剑叶从根丛展开，花梗与花基连续。',
    irises,
  ],
  [
    'hydrangea-blue-stone',
    '绣球映石',
    'color',
    '花木 / 石蓝与藕紫',
    '疏密小花围成有体积的球状花序，阔叶与分枝承接，近远花头改变尺度。',
    hydrangeas,
  ],
  [
    'bottle-gourd-autumn-vine',
    '葫芦垂藤',
    'color',
    '藤果 / 草金与竹青',
    '上下两腹、束腰和果柄连续，果梗连藤，卷须与裂叶形成穿插负形。',
    gourds,
  ],
  [
    'tallow-autumn-seeds',
    '乌桕秋汀',
    'color',
    '秋木 / 赭红与米白',
    '菱状秋叶沿有粗细的枝干分布，开裂深色果皮托住浅色种子。',
    autumnTallow,
  ],
  [
    'hoopoe-spring-ground',
    '戴胜寻春',
    'figures',
    '花鸟 / 赭羽与墨白',
    '长而微弯的喙、黑端扇冠和黑白折翼建立身份，双足落地。',
    hoopoe,
  ],
  [
    'cormorant-waterside-rock',
    '鸬鹚听水',
    'figures',
    '水鸟 / 墨青与冷石',
    '有厚度的长颈接头胸，喙端微钩、翼羽叠覆，蹼足承托石面。',
    cormorant,
  ],
  [
    'lacquer-tray-peaches',
    '漆盘荐果',
    'color',
    '漆木 / 朱漆与桃粉',
    '漆盘内底、口沿、前壁共用椭圆投影，桃实以缝线、尖顶和柔色面建立体积。',
    lacquerTray,
  ],
  [
    'dark-glaze-whisked-tea',
    '建盏茶沫',
    'color',
    '茶器 / 褐釉与乳金',
    '深釉盏口、茶面、外壁和圈足连续，釉纹随盏壁收拢，茶筅置侧。',
    teaBowl,
  ],
  [
    'bronze-lock-wooden-chest',
    '铜锁守匣',
    'color',
    '箱匣 / 木赭与铜金',
    '箱盖箱壁共用投影，锁扣连盖壁，横锁梁贯穿扣环，非开锁机制图。',
    bronzeLock,
  ],
  [
    'round-silk-fan-blossoms',
    '团扇扑香',
    'color',
    '绢艺 / 米绢与烟粉',
    '扇面遮住后方结构，花枝裁在绢面内，包边、扇颈与柄连续。',
    silkFan,
  ],
  [
    'stone-roller-threshing-yard',
    '石碾晒场',
    'ink',
    '乡居 / 石灰与谷金',
    '圆碾盘上立中轴，梁连碾磙轴心，石体有端面与厚度；仅作乡居构造意象。',
    stoneRoller,
  ],
  [
    'plank-bridge-creek',
    '板桥溪声',
    'ink',
    '溪岸 / 木赭与浅青',
    '木梁跨石墩，横铺木板共用投影，桥面贴近溪水并接入两岸。',
    plankBridge,
  ],
].map(([id, name, category, theme, note, draw]) => ({ id, name, category, theme, note, draw }))

mkdirSync(destination, { recursive: true })
for (const study of studies) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}原创代码彩墨意象，非具名文物、工艺或物种复原。透明背景。</desc>${definitions}${study.draw()}</svg>`
  const svg = source
    .replace(/id="([^"]+)"/g, (_, identity) => `id="${study.id}-${identity}"`)
    .replace(/url\(#([^)]+)\)/g, (_, identity) => `url(#${study.id}-${identity})`)
    .replace(
      'aria-labelledby="title description"',
      `aria-labelledby="${study.id}-title ${study.id}-description"`,
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
console.log('Generated twelve spring waterside and everyday ink studies')
