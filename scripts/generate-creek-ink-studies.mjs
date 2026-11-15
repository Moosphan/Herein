import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/creek-studies/ink-wash',
)
const grain = 'filter="url(#pigment)"'
const times = (count, draw) => Array.from({ length: count }, (_, index) => draw(index)).join('')
const path = (shape, color, opacity = 1, extra = grain) =>
  `<path d="${shape}" fill="${color}" opacity="${opacity}" ${extra}/>`
const line = (shape, color = '#495745', width = 2, opacity = 1) =>
  `<path d="${shape}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1) =>
  `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${color}" opacity="${opacity}" ${grain}/>`
const transform = (content, position) => `<g transform="${position}">${content}</g>`
const group = (identity, content) => `<g id="${identity}">${content}</g>`
const definitions = `<defs>
<filter id="pigment" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".34" numOctaves="2" seed="223" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .17 0 0 0 .83" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="paint"/><feTurbulence type="fractalNoise" baseFrequency=".037" numOctaves="2" seed="62" result="edge"/><feDisplacementMap in="paint" in2="edge" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="soft"><feGaussianBlur stdDeviation="4"/></filter>
${[
  ['leaf', '#a0ad70', '#70885a', '#395d4b'],
  ['pink', '#dfabb8', '#c5769b', '#994f80'],
  ['crimson', '#ca6b7c', '#a94364', '#772d52'],
  ['wood', '#ba9e70', '#8e7353', '#594b3c'],
  ['dark-wood', '#9b7955', '#77583f', '#493b31'],
  ['bronze', '#c6a867', '#9c8553', '#5b6554'],
  ['cloth', '#b26c60', '#8f4b46', '#633a38'],
  ['stone', '#b7b6a4', '#909f94', '#5d746e'],
  ['bird', '#b2aa94', '#8e8b80', '#555d59'],
  ['quill', '#af9671', '#8d7556', '#544e40'],
  ['earth', '#c9b088', '#a7906b', '#7c6e51'],
]
  .map(
    ([identity, start, middle, end]) =>
      `<linearGradient id="${identity}" x1="10%" y1="0%" x2="80%" y2="100%"><stop stop-color="${start}"/><stop offset=".5" stop-color="${middle}"/><stop offset="1" stop-color="${end}"/></linearGradient>`,
  )
  .join('')}
</defs>`

function brush(points, width, color, opacity = 1) {
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
  for (let step = 0; step <= 28; step++) {
    const fraction = step / 28
    const center = curve(fraction)
    const before = curve(Math.max(0, fraction - 0.003))
    const after = curve(Math.min(1, fraction + 0.003))
    const length = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
    const normal = [-(after[1] - before[1]) / length, (after[0] - before[0]) / length]
    const breadth =
      (width * (0.35 + 0.65 * Math.sin(Math.PI * fraction)) * (1 - fraction * 0.84)) / 2
    left.push(center.map((value, axis) => +(value + normal[axis] * breadth).toFixed(2)))
    right.unshift(center.map((value, axis) => +(value - normal[axis] * breadth).toFixed(2)))
  }
  return path(
    'M' + [...left, ...right].map((point) => point.join(' ')).join('L') + 'Z',
    color,
    opacity,
  )
}

function leaf(horizontal, vertical, angle, scale = 1, color = 'url(#leaf)') {
  return transform(
    path('M0 0C-43 -27 -66 -101 -11 -159C28 -121 47 -49 0 0Z', color) +
      line('M0 -5Q-7 -77 -11 -150M-7 -57L-35 -89M-8 -82L17 -116', '#bec79b', 1.6, 0.55),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function rock(horizontal, vertical, scale = 1) {
  return transform(
    path('M-159 18L-126 -67L-77 -120L-26 -99L32 -148L106 -98L155 17L68 46L-66 38Z', 'url(#stone)') +
      path('M32 -148L18 -39L68 46L155 17L106 -98Z', '#58746b', 0.45) +
      times(18, (index) =>
        brush(
          [
            [-116 + (index % 6) * 42, -45 - Math.floor(index / 6) * 22],
            [-122 + (index % 6) * 42, -24 - Math.floor(index / 6) * 20],
            [-107 + (index % 6) * 42, -12 - Math.floor(index / 6) * 19],
            [-111 + (index % 6) * 42, 8 - Math.floor(index / 6) * 20],
          ],
          3,
          '#4d675d',
          0.5,
        ),
      ),
    `translate(${horizontal} ${vertical}) scale(${scale})`,
  )
}

function acorus() {
  const blades = [
    [
      [710, 800],
      [590, 597],
      [490, 407],
      [431, 386],
    ],
    [
      [719, 801],
      [596, 535],
      [606, 279],
      [650, 236],
    ],
    [
      [734, 806],
      [700, 515],
      [744, 242],
      [789, 201],
    ],
    [
      [746, 805],
      [791, 484],
      [899, 357],
      [970, 345],
    ],
    [
      [724, 803],
      [754, 525],
      [676, 307],
      [632, 283],
    ],
    [
      [744, 808],
      [848, 623],
      [981, 570],
      [1086, 594],
    ],
    [
      [738, 813],
      [817, 711],
      [964, 675],
      [1064, 698],
    ],
    [
      [709, 815],
      [570, 675],
      [488, 632],
      [394, 658],
    ],
    [
      [731, 807],
      [672, 579],
      [470, 467],
      [390, 480],
    ],
    [
      [737, 804],
      [807, 500],
      [833, 342],
      [814, 276],
    ],
  ]
  return (
    group(
      'creek-wash',
      ellipse(843, 856, 389, 34, '#92a69b', 0.16) +
        line('M335 858Q537 848 666 856M937 872Q1101 861 1244 873', '#6d958d', 3, 0.4),
    ) +
    group('back-stone', rock(986, 774, 0.75)) +
    group(
      'sword-leaves',
      blades
        .map((points, index) =>
          brush(
            points,
            32 + (index % 3) * 9,
            index % 3 === 0 ? '#446d51' : index % 3 === 1 ? '#8d9c5c' : '#668758',
          ),
        )
        .join(''),
    ) +
    group(
      'spadix',
      line('M730 802Q706 649 690 561', '#6c8552', 6) +
        transform(
          path('M-7 0Q-18 -54 -6 -111Q0 -128 9 -111Q21 -52 9 0Z', '#a6a269') +
            times(15, (index) =>
              line(`M-7 ${-8 - index * 6}L9 ${-13 - index * 6}`, '#797d46', 1.4, 0.65),
            ),
          'translate(690 563) rotate(-13)',
        ),
    ) +
    group(
      'root-stone',
      rock(643, 839, 0.45) +
        brush(
          [
            [660, 847],
            [723, 816],
            [775, 855],
            [829, 842],
          ],
          8,
          '#4b6c53',
          0.6,
        ),
    )
  )
}

function cockscomb() {
  const crest = (horizontal, vertical, scale, angle) =>
    transform(
      path(
        'M-7 115Q-29 83 -66 65Q-108 56 -107 31Q-125 12 -105 -5Q-123 -25 -102 -42Q-106 -69 -82 -69Q-76 -94 -56 -85Q-44 -112 -21 -91Q0 -116 15 -90Q43 -102 48 -76Q78 -88 78 -58Q110 -65 108 -38Q134 -21 114 0Q132 24 110 35Q110 61 80 62Q32 89 10 116Z',
        'url(#crimson)',
      ) +
        times(19, (index) => {
          const horizontalOffset = -92 + index * 10
          return line(
            `M${horizontalOffset} ${-27 - Math.sin(index * 1.7) * 24}Q${horizontalOffset - 18} 14 ${horizontalOffset * 0.55} 54Q${horizontalOffset * 0.27} 79 3 107`,
            index % 3 === 0 ? '#e2a1a2' : '#792e57',
            index % 3 === 0 ? 3 : 2,
            0.5,
          )
        }) +
        path('M-9 103L-19 132L7 141L18 108Z', '#697b48'),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'stems',
      line(
        'M786 849Q776 634 808 415M779 749Q657 643 629 543M788 673Q917 562 947 467',
        '#6e774a',
        9,
      ),
    ) +
    group(
      'foliage',
      [
        [780, 798, -68, 1.55],
        [779, 719, 54, 1.6],
        [786, 620, -53, 1.25],
        [795, 568, 51, 1.18],
        [659, 632, -55, 1.05],
        [920, 541, 52, 0.85],
      ]
        .map((parameters) => leaf(...parameters))
        .join(''),
    ) +
    group(
      'flower-crests',
      crest(808, 317, 1.22, 8) + crest(609, 460, 0.72, -20) + crest(959, 397, 0.65, 21),
    ) +
    group(
      'ground',
      rock(910, 859, 0.45) +
        brush(
          [
            [660, 864],
            [735, 852],
            [815, 866],
            [882, 867],
          ],
          13,
          '#7b8862',
          0.4,
        ),
    )
  )
}

function crapeMyrtle() {
  const bloom = (horizontal, vertical, scale, phase) =>
    transform(
      times(6, (index) =>
        transform(
          path(
            'M0 -3Q-30 -17 -29 -37Q-40 -50 -23 -57Q-12 -70 -1 -57Q14 -69 25 -54Q42 -46 27 -34Q26 -15 0 -3Z',
            index % 2 ? '#c578a1' : '#d9a0b6',
            0.9,
          ) + line('M0 -2L-8 -34', '#9a5a87', 1, 0.55),
          `rotate(${index * 60 + phase})`,
        ),
      ) +
        ellipse(0, 0, 8, 6, '#af9252') +
        times(7, (index) => ellipse(-10 + index * 3, -4 - Math.sin(index) * 6, 2, 2, '#d4b66c')),
      `translate(${horizontal} ${vertical}) scale(${scale})`,
    )
  return (
    group(
      'woody-branches',
      path(
        'M553 860Q645 747 701 599Q752 471 824 373L839 380Q766 486 722 616Q656 791 581 866Z',
        'url(#wood)',
      ) +
        line(
          'M708 612Q615 509 531 438M749 511Q919 479 1034 390M802 409Q800 312 740 263',
          '#736c50',
          9,
        ) +
        line('M710 606Q635 537 568 509M846 489Q953 526 1054 489', '#8f805b', 5),
    ) +
    group(
      'small-leaves',
      [
        [629, 528, -64, 0.67],
        [672, 570, 47, 0.73],
        [759, 481, -39, 0.77],
        [851, 494, 46, 0.67],
        [953, 458, 42, 0.6],
        [787, 352, -62, 0.55],
        [570, 474, -55, 0.57],
        [1009, 492, 65, 0.57],
      ]
        .map((parameters) => leaf(...parameters))
        .join(''),
    ) +
    group(
      'pink-panicles',
      [
        [755, 253, 0.56, 7],
        [811, 292, 0.63, 19],
        [798, 229, 0.57, 8],
        [851, 324, 0.61, 27],
        [820, 365, 0.54, 11],
        [1024, 361, 0.58, 8],
        [1075, 395, 0.51, 23],
        [986, 414, 0.56, 17],
        [540, 410, 0.6, 9],
        [579, 371, 0.51, 31],
        [492, 434, 0.44, 19],
      ]
        .map((parameters) => bloom(...parameters))
        .join(''),
    ) +
    group(
      'root-rock',
      rock(644, 871, 0.55) +
        brush(
          [
            [474, 884],
            [551, 858],
            [636, 892],
            [757, 881],
          ],
          10,
          '#6c8263',
          0.35,
        ),
    )
  )
}

function dove() {
  const elmLeaf = (horizontal, vertical, angle, scale) =>
    transform(
      path(
        'M0 0L-15 -16L-27 -21L-24 -33L-36 -46L-29 -55L-35 -68L-23 -76L-24 -90L-10 -99L-3 -120L12 -102L24 -97L23 -81L36 -70L30 -57L36 -45L25 -34L24 -19L10 -13Z',
        'url(#leaf)',
      ) + line('M0 -4L-3 -113', '#bec299', 1.5, 0.6),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'elm-branch',
      line('M356 801Q708 746 1225 657', '#69644d', 21) +
        line('M974 702Q1026 530 1150 413M1050 550Q1198 530 1262 467', '#7c7454', 8),
    ) +
    group(
      'elm-leaves',
      [
        [1110, 453, -38, 0.78],
        [1100, 468, 43, 0.9],
        [1061, 512, -70, 0.72],
        [1053, 527, 17, 0.78],
        [1172, 539, 60, 0.85],
        [1217, 502, 45, 0.72],
        [1144, 547, -27, 0.7],
      ]
        .map((parameters) => elmLeaf(...parameters))
        .join(''),
    ) +
    group(
      'far-foot',
      line('M789 668L800 743M800 743Q781 746 777 756M800 743Q817 738 827 746', '#80655b', 7),
    ) +
    group(
      'bird-volume',
      path(
        'M747 601Q782 632 843 672L1044 727L1023 749Q942 739 863 713Q738 731 666 654Q605 600 623 538Q629 486 679 476Q724 470 747 505Q756 543 747 601Z',
        'url(#bird)',
      ) +
        path(
          'M739 595Q778 623 840 664L1004 724Q962 726 907 709L807 677Q768 666 727 641Z',
          '#585f5b',
        ) +
        path(
          'M699 553Q783 519 862 581Q912 617 908 658Q838 687 755 654Q722 628 699 553Z',
          '#8a8171',
        ) +
        times(8, (index) =>
          path(
            `M${752 + index * 17} ${566 + index * 5}q22 4 30 27q-18 4 -33 -10Z`,
            index % 2 ? '#b4a38a' : '#706b5d',
            0.8,
          ),
        ) +
        path('M648 503Q638 515 631 535L601 526L627 512Z', '#665f55') +
        path('M680 548Q714 550 738 566L745 594Q705 588 682 570Z', '#4d514e') +
        times(15, (index) =>
          ellipse(
            687 + (index % 5) * 11,
            557 + Math.floor(index / 5) * 8 + (index % 2) * 2,
            3.3,
            2.3,
            '#ddd4bc',
            0.9,
          ),
        ) +
        ellipse(659, 507, 6, 5, '#393d36') +
        ellipse(658, 505, 1.7, 1.6, '#d2c5a4') +
        line('M627 529L646 534', '#655c50', 1.7),
    ) +
    group(
      'near-foot',
      line(
        'M743 675Q735 711 745 750M745 750Q725 750 718 765M745 750Q761 748 769 758M745 750L748 770',
        '#8c7061',
        7,
      ) + line('M719 765L714 764M769 758L774 756', '#4e5044', 2.5),
    )
  )
}

function hedgehog() {
  return (
    group(
      'ground',
      ellipse(794, 805, 337, 28, '#8e9267', 0.16) +
        brush(
          [
            [429, 819],
            [532, 783],
            [635, 824],
            [728, 809],
          ],
          9,
          '#6c8059',
          0.5,
        ),
    ) +
    group(
      'far-feet',
      path('M832 747Q829 773 829 790Q842 803 867 798L873 790L867 740Z', '#75674f') +
        path('M668 744Q663 768 660 787Q671 802 697 798L706 786L706 746Z', '#75674f'),
    ) +
    group(
      'quill-body',
      path(
        'M590 741Q574 650 618 577Q664 502 767 503Q914 498 981 625Q1012 683 998 744Q916 793 779 792Q668 791 590 741Z',
        'url(#quill)',
      ) +
        times(510, (index) => {
          const fraction = (index * 0.61803398875) % 1
          const horizontal = 622 + fraction * 350
          const top = 518 + Math.pow((horizontal - 782) / 186, 2) * 107
          const vertical = top + ((index * 0.41421356237) % 1) * (744 - top)
          const angle = (horizontal - 786) / 190
          return brush(
            [
              [horizontal, vertical + 9],
              [horizontal + angle * 7, vertical + 2],
              [horizontal + angle * 14, vertical - 7],
              [horizontal + angle * 18, vertical - 16],
            ],
            index % 3 === 0 ? 3.5 : 2.7,
            index % 4 === 0 ? '#c5af87' : index % 4 === 1 ? '#574f40' : '#a58a63',
            0.85,
          )
        }),
    ) +
    group(
      'face-and-feet',
      path(
        'M624 651Q586 636 552 663Q513 686 475 733Q458 748 476 762Q516 779 557 758Q597 775 626 743Q649 700 624 651Z',
        '#b6a185',
      ) +
        path('M534 722Q500 725 476 741L477 758Q513 761 548 743Z', '#cab598') +
        ellipse(608, 654, 25, 29, '#9a8266') +
        ellipse(608, 657, 13, 18, '#b9a080') +
        ellipse(540, 709, 6, 5, '#303b35') +
        ellipse(471, 748, 12, 8, '#3d4237') +
        line('M484 761Q512 766 532 751', '#766750', 2) +
        path('M614 753Q610 775 599 791Q596 803 614 806Q638 809 650 797L648 765Z', '#8c775c') +
        path('M911 761Q917 778 920 791Q920 806 945 806Q965 806 966 795L958 752Z', '#8c775c') +
        line('M610 801L612 791M621 805L625 795M937 799L935 789M947 798L946 788', '#4e4c3c', 2),
    ) +
    group(
      'fallen-chestnuts',
      ellipse(425, 801, 24, 19, '#8b5841') +
        path('M407 791Q426 777 446 793L438 783L425 777Z', '#b99866') +
        path('M1063 760Q1082 724 1127 745Q1148 767 1127 798L1094 812L1059 794Z', '#9c8b57') +
        times(32, (index) => {
          const angle = (index * Math.PI * 2) / 32
          const horizontal = 1096 + Math.cos(angle) * 37
          const vertical = 777 + Math.sin(angle) * 30
          return line(
            `M${horizontal} ${vertical}l${Math.cos(angle) * 15} ${Math.sin(angle) * 15}`,
            '#6d7850',
            2,
            0.8,
          )
        }) +
        path('M1081 783Q1090 758 1111 766Q1127 784 1114 801L1090 802Z', '#91563c') +
        line('M1084 786L1081 800', '#b99366', 3),
    )
  )
}

function flyingGeese() {
  const goose = (horizontal, vertical, scale, angle) =>
    transform(
      path(
        'M-23 3Q-114 -65 -216 -93L-208 -68L-178 -57L-174 -42L-150 -37L-142 -23L-115 -20L-105 -5L-72 9L-43 28Z',
        '#7d8b84',
      ) +
        path(
          'M-100 29Q-72 -12 -23 -8Q19 -2 55 17Q84 8 113 -16L160 -60Q175 -70 186 -58L195 -44L222 -37L193 -32Q174 -29 167 -38L138 -7Q110 33 69 46Q22 78 -35 54L-87 62L-114 52L-82 44Z',
          'url(#bird)',
        ) +
        path(
          'M-12 22Q-14 -70 -41 -182L-23 -171L-9 -142L1 -145L11 -112L21 -112L29 -80L39 -72L41 -39L53 -30L38 15L12 42Z',
          '#596a64',
        ) +
        times(7, (index) =>
          line(
            `M${-28 + index * 11} ${-157 + index * 24}Q${-8 + index * 8} ${-107 + index * 17} ${6 + index * 4} 15`,
            '#c0c2ac',
            2,
            0.6,
          ),
        ) +
        path('M73 40Q117 20 145 -12L162 -32Q146 -5 143 6Q118 43 76 52Z', '#d2d1ba') +
        ellipse(180, -50, 3, 2.6, '#343d37') +
        line('M-33 55L-67 72L-84 72M-10 59L-38 77L-59 79', '#715e4b', 4),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'distant-wash',
      brush(
        [
          [420, 782],
          [689, 736],
          [945, 790],
          [1208, 753],
        ],
        50,
        '#a7b3a0',
        0.15,
      ) + line('M379 825Q563 815 682 827M893 817Q1124 800 1254 818', '#8a9b86', 2, 0.4),
    ) +
    group('near-goose', goose(698, 476, 1.35, -8)) +
    group('far-goose', goose(1036, 358, 0.76, 7)) +
    group(
      'reeds',
      [
        [1016, 850, 1091, 604],
        [1051, 854, 1161, 681],
        [1019, 856, 1018, 647],
      ]
        .map(
          ([horizontal, vertical, tipX, tipY], index) =>
            line(
              `M${horizontal} ${vertical}Q${horizontal + 35} ${vertical - 139} ${tipX} ${tipY}`,
              '#938459',
              3,
            ) +
            transform(
              times(13, (spike) =>
                brush(
                  [
                    [0, spike * 5],
                    [13, spike * 5 - 10],
                    [18, spike * 5 - 16],
                    [23, spike * 5 - 19],
                  ],
                  4,
                  '#b8a67b',
                  0.7,
                ),
              ),
              `translate(${tipX} ${tipY}) rotate(${index * 9 - 12})`,
            ),
        )
        .join(''),
    )
  )
}

function bronzeIron() {
  return (
    group(
      'folded-silk',
      path('M387 644L958 605L1190 780L649 843L387 728Z', 'url(#cloth)') +
        path('M387 713L649 809L1190 754L1190 780L649 843L387 728Z', '#693e3c') +
        line('M463 677L670 774L1092 736M484 690L667 786L1092 747', '#c38a74', 3, 0.55) +
        line('M547 645L719 795M826 622L982 765', '#6c3e3d', 2, 0.45),
    ) +
    group(
      'handle',
      path('M797 559L1199 360Q1218 353 1227 369Q1234 387 1212 398L829 596Z', 'url(#bronze)') +
        line('M882 538L1208 375', '#dbc58d', 4, 0.6) +
        path('M1170 375L1203 360Q1220 356 1226 369Q1230 383 1211 395L1185 405Z', '#675849'),
    ) +
    group(
      'bowl-volume',
      path('M547 524L887 526Q885 672 768 710Q634 721 573 647Q551 601 547 524Z', 'url(#bronze)') +
        ellipse(717, 525, 172, 65, '#c6ac77') +
        ellipse(717, 525, 146, 47, '#6f6350') +
        path('M574 546Q705 602 863 541Q846 614 787 637Q653 652 591 596Z', '#9b8357', 0.65) +
        line('M581 592Q711 663 852 590', '#d0b27a', 3, 0.55) +
        line('M632 676Q706 710 780 688', '#555f4c', 5, 0.7),
    ) +
    group(
      'charcoal-interior',
      [
        [644, 527, -12],
        [699, 542, 20],
        [756, 511, -5],
        [794, 538, 18],
        [682, 502, -8],
      ]
        .map(([horizontal, vertical, angle]) =>
          transform(
            path('M-28 -12L-16 -24L24 -17L31 6L10 20L-25 10Z', '#45483e') +
              line('M-19 -15L15 -9L22 4', '#77644d', 2, 0.6),
            `translate(${horizontal} ${vertical}) rotate(${angle})`,
          ),
        )
        .join(''),
    ) +
    group(
      'smoke',
      brush(
        [
          [726, 469],
          [687, 430],
          [765, 403],
          [744, 365],
        ],
        17,
        '#9b9d8a',
        0.15,
      ),
    )
  )
}

function woodenFish() {
  const silhouette =
    'M18 319C9 255 29 165 60 100C88 34 126 -2 179 5C254 3 310 44 348 91C389 143 405 222 437 273C465 315 493 319 530 329Q554 334 549 347L528 355Q558 367 548 379L518 382L533 394Q506 405 483 391L452 389Q379 409 238 410C140 420 45 400 18 319Z'
  const carving = (shape, width = 2.6) =>
    line(shape, '#694c32', width + 1.6, 0.48) +
    transform(line(shape, '#d1b17d', width * 0.48, 0.65), 'translate(-1.3 -1.6)')
  const body =
    `<defs>
<radialGradient id="fish-pear-wood" cx="30%" cy="22%" r="85%"><stop stop-color="#c2a06b"/><stop offset=".42" stop-color="#ae8955"/><stop offset=".76" stop-color="#967045"/><stop offset="1" stop-color="#665035"/></radialGradient>
<linearGradient id="fish-cut-face" x1="15%" y1="5%" x2="80%" y2="95%"><stop stop-color="#b79360"/><stop offset=".6" stop-color="#ad8754"/><stop offset="1" stop-color="#82613d"/></linearGradient>
<clipPath id="fish-body-boundary"><path d="${silhouette}"/></clipPath>
</defs>` +
    group(
      'pear-resonator',
      path(silhouette, 'url(#fish-pear-wood)') +
        path(
          'M43 194Q125 251 217 282L337 329Q360 333 366 311Q366 344 410 358L452 389Q353 420 226 410Q78 420 35 355Q13 309 20 252Z',
          'url(#fish-cut-face)',
        ) +
        `<g clip-path="url(#fish-body-boundary)">${times(58, (index) => {
          const vertical = 40 + index * 7.3
          return line(
            `M-6 ${vertical}C118 ${vertical - 5} 191 ${vertical + 12} 275 ${vertical + 32}Q374 ${vertical + 52} 450 ${vertical + 26}`,
            index % 4 === 0 ? '#dac296' : '#765535',
            index % 5 === 0 ? 1.5 : 0.8,
            index % 4 === 0 ? 0.15 : 0.09,
          )
        })}${times(31, (index) => {
          const vertical = 225 + index * 4.8
          return line(
            `M24 ${vertical}Q140 ${vertical - 25} 230 ${vertical + 1}Q309 ${vertical + 24} 372 ${vertical + 1}`,
            '#dbc293',
            0.9,
            0.15,
          )
        })}</g>` +
        brush(
          [
            [66, 157],
            [83, 87],
            [121, 49],
            [168, 38],
          ],
          18,
          '#dec59a',
          0.17,
        ) +
        brush(
          [
            [34, 303],
            [34, 350],
            [87, 396],
            [184, 398],
          ],
          12,
          '#6c5639',
          0.28,
        ) +
        brush(
          [
            [254, 406],
            [338, 405],
            [402, 389],
            [452, 387],
          ],
          8,
          '#5f4e33',
          0.38,
        ),
    ) +
    group(
      'oblique-sound-mouth',
      path(
        'M38 168C93 219 175 238 261 256C309 266 345 273 359 286C369 298 354 327 336 328C274 315 212 291 155 270C96 245 56 218 38 192Z',
        '#2f3028',
      ) +
        path(
          'M38 168C93 219 175 238 261 256C309 266 345 273 359 286Q368 299 361 312Q350 287 302 283Q159 255 43 185Z',
          '#1e251f',
          0.72,
        ) +
        line('M43 195C133 260 240 296 336 332Q358 337 365 313', '#d4b27d', 3.4, 0.75) +
        line('M40 165C133 224 227 247 310 265', '#c9ab78', 1.8, 0.45),
    ) +
    group(
      'integrated-front-carving',
      `<g clip-path="url(#fish-body-boundary)">` +
        path(
          'M355 117Q381 146 395 191Q411 246 447 291Q470 323 518 340L529 356Q464 345 434 305Q405 264 391 216Q378 160 355 117Z',
          '#8d693f',
          0.3,
        ) +
        transform(
          carving(
            'M357 119C327 111 323 91 339 85C356 78 369 94 361 105C356 111 344 106 348 100',
            2.5,
          ),
          'translate(-16 4)',
        ) +
        transform(
          carving('M371 148C346 137 339 151 350 164Q366 180 385 175', 2.5),
          'translate(-11 4)',
        ) +
        carving('M388 181C395 222 411 253 435 281Q463 316 510 333', 3) +
        times(13, (index) => {
          const offset = index * 2.9
          return line(
            `M${372 + offset * 0.22} ${151 + offset * 0.35}C${395 + offset * 0.3} ${205 + offset * 0.5} ${401 + offset * 0.55} ${264 + offset * 0.38} ${441 + offset} ${301 + offset * 0.6}`,
            index % 3 === 0 ? '#cfb080' : '#765737',
            index % 3 === 0 ? 1.3 : 1.7,
            0.56,
          )
        }) +
        carving('M433 310Q463 348 522 353Q538 353 542 343', 3) +
        path('M502 342Q523 339 541 343L532 352L511 352Z', '#a18050') +
        line('M521 355Q538 358 545 367Q531 375 513 372', '#675135', 2.6, 0.7) +
        path('M479 372Q501 378 518 381L527 390Q509 396 493 384Z', '#b99a65') +
        carving('M224 399Q268 379 317 384Q361 388 401 373Q427 365 450 350', 3.5) +
        times(17, (index) =>
          line(
            `M${244 + index * 9.5} ${395 - index * 1.1}Q${285 + index * 8.3} ${386 - index * 1.4} ${323 + index * 7} ${386 - index * 1.7}`,
            index % 3 === 0 ? '#d2b280' : '#80613c',
            1.2,
            0.58,
          ),
        ) +
        transform(carving('M303 56Q309 73 329 78M311 61Q324 62 329 70', 2), 'translate(-12 2)') +
        '</g>',
    )
  return (
    group(
      'brocade-cushion',
      path('M412 742Q478 701 774 695Q1047 704 1104 749L1085 811Q800 883 440 818Z', 'url(#cloth)') +
        ellipse(759, 748, 338, 65, '#a7736b') +
        path('M436 765Q723 835 1092 757L1085 811Q800 883 440 818Z', '#8e554f', 0.7) +
        line('M439 805Q745 877 1088 800', '#caa978', 4, 0.8) +
        times(21, (index) => {
          const horizontal = 462 + index * 29.8
          const vertical = 820 + Math.sin((index / 20) * Math.PI) * 25
          return line(`M${horizontal} ${vertical}l-2 14`, '#b59061', 2, 0.75)
        }) +
        times(11, (index) =>
          transform(
            line('M-11 0Q0 -15 11 0Q0 15 -11 0Z', '#c59a79', 1.2, 0.4),
            `translate(${478 + index * 53} ${789 + Math.sin((index / 10) * Math.PI) * 21})`,
          ),
        ),
    ) +
    transform(body, 'translate(423 233) scale(1.22)') +
    group(
      'wooden-beater',
      path('M1111 803L1263 526Q1268 518 1277 522Q1285 527 1279 537L1125 810Z', 'url(#wood)') +
        line('M1121 800L1270 533', '#d0b588', 2.5, 0.55) +
        transform(
          ellipse(0, 0, 37, 44, '#8f6b41') +
            ellipse(-7, -6, 29, 35, '#bd9b69') +
            brush(
              [
                [-20, 13],
                [-2, 28],
                [15, 22],
                [23, 9],
              ],
              8,
              '#d1b58b',
              0.4,
            ),
          'translate(1274 522) rotate(27)',
        ),
    )
  )
}

function gong() {
  return (
    group(
      'support-feet',
      path('M448 818L568 795L613 822L491 849Z', 'url(#dark-wood)') +
        path('M990 818L1110 795L1155 822L1034 849Z', 'url(#dark-wood)'),
    ) +
    group(
      'wood-frame',
      path('M488 831L488 278L518 278L518 824Z', 'url(#wood)') +
        path('M1030 829L1030 278L1060 278L1060 822Z', 'url(#wood)') +
        path('M450 273L1092 273L1092 311L450 311Z', 'url(#dark-wood)') +
        path('M450 273L474 260L1116 260L1092 273Z', '#ad8b60') +
        line('M506 319L506 805M1046 319L1046 805', '#c5a576', 4, 0.5) +
        line('M518 331L575 311M1030 331L973 311', '#6a513b', 14),
    ) +
    group(
      'suspension',
      line('M665 312L705 405M887 312L849 405', '#965a43', 7) +
        line('M665 312L687 312M868 312L888 312', '#a66c50', 5),
    ) +
    group(
      'gong-plate',
      ellipse(779, 574, 223, 231, '#6d7358') +
        ellipse(774, 568, 216, 226, 'url(#bronze)') +
        ellipse(774, 568, 189, 199, '#b69a61') +
        ellipse(774, 568, 167, 177, '#bba46c') +
        ellipse(774, 568, 66, 71, '#a38a50') +
        ellipse(762, 552, 47, 54, '#d1b878') +
        line('M625 674Q720 797 876 704', '#697654', 7, 0.4) +
        line('M607 515Q638 386 766 377', '#ddc88e', 4, 0.6) +
        times(38, (index) => {
          const angle = (index * Math.PI * 2) / 38
          return ellipse(
            774 + Math.cos(angle) * 181,
            568 + Math.sin(angle) * 191,
            2.3,
            2.3,
            '#7b805a',
            0.45,
          )
        }),
    ) +
    group(
      'padded-mallet',
      path('M1110 767L1208 582L1221 589L1125 775Z', 'url(#wood)') +
        transform(
          ellipse(0, 0, 30, 40, '#5a5547') +
            line('M-15 -22L15 -21M-23 -6L22 -5M-23 11L23 12', '#8b8270', 3, 0.7),
          'translate(1215 582) rotate(25)',
        ),
    )
  )
}

function windlass() {
  return (
    group(
      'well-base',
      path('M499 720L786 657L1069 731L789 817Z', 'url(#stone)') +
        path('M499 720L789 785L1069 731L1069 819L789 902L499 820Z', '#82968a') +
        path('M789 785L1069 731L1069 819L789 902Z', '#647e73') +
        path('M565 722L788 678L1000 733L787 789Z', '#344d49') +
        path(
          'M499 720L786 657L1069 731L789 817Z M565 722L788 678L1000 733L787 789Z',
          '#acb6a1',
          1,
          'fill-rule="evenodd" ' + grain,
        ) +
        path('M565 722L788 678L1000 733L976 748L789 709L594 751Z', '#56746b') +
        line(
          'M511 765L787 837L1058 771M512 797L789 869L1057 802M650 756L650 799M931 800L931 848',
          '#4c6659',
          3,
          0.7,
        ),
    ) +
    group('rear-post', path('M917 739L917 322L949 322L949 751Z', 'url(#wood)')) +
    group(
      'drum-and-axle',
      path('M586 405L1017 405L1017 427L586 427Z', '#6d5a42') +
        path('M673 379L868 379L868 457L673 457Z', 'url(#dark-wood)') +
        ellipse(675, 418, 17, 43, '#b29368') +
        ellipse(869, 418, 18, 43, '#675340') +
        times(19, (index) =>
          line(
            `M${686 + index * 9} 380Q${677 + index * 9} 418 ${686 + index * 9} 455`,
            '#b9a478',
            4,
            0.8,
          ),
        ),
    ) +
    group(
      'rope',
      line('M798 452L798 771', '#b19a68', 6) + line('M800 459L800 766', '#705e43', 1.4, 0.7),
    ) +
    group(
      'front-post',
      path('M597 780L597 322L630 322L630 790Z', 'url(#wood)') +
        path('M582 320L644 320L644 344L582 344Z', '#b49868') +
        path('M902 320L964 320L964 344L902 344Z', '#b49868') +
        line('M599 414L556 414L556 501L515 501', '#624e37', 15) +
        line('M515 488L515 516', '#b29669', 19),
    ) +
    group(
      'bucket-on-rim',
      path('M934 682L1046 682L1035 767Q992 790 947 765Z', 'url(#wood)') +
        ellipse(990, 682, 56, 18, '#c3ad81') +
        ellipse(990, 682, 43, 10, '#5e6652') +
        line('M950 729L1038 729M947 751L1036 751', '#5a6552', 6) +
        line('M950 681Q990 590 1031 681', '#7d684a', 6) +
        times(6, (index) =>
          line(`M${956 + index * 13} 695L${959 + index * 12} 764`, '#62533b', 2, 0.6),
        ),
    ) +
    group(
      'ground-grass',
      brush(
        [
          [421, 846],
          [491, 827],
          [554, 861],
          [596, 851],
        ],
        9,
        '#789166',
        0.5,
      ) +
        brush(
          [
            [1092, 866],
            [1127, 789],
            [1165, 783],
            [1173, 747],
          ],
          12,
          '#8b965d',
          0.8,
        ),
    )
  )
}

function granary() {
  return (
    group(
      'rear-legs',
      path('M665 692L665 836L696 841L696 690Z', '#6f5c42') +
        path('M948 687L948 833L979 828L979 684Z', '#6f5c42'),
    ) +
    group(
      'raised-store',
      path('M558 468L1048 468L1048 695Q809 773 558 695Z', 'url(#wood)') +
        ellipse(804, 693, 246, 61, '#8d7551') +
        times(29, (index) => {
          const horizontal = 568 + index * 16.5
          const bottom = 693 + Math.sin((index / 28) * Math.PI) * 49
          return line(`M${horizontal} 475L${horizontal} ${bottom}`, '#5a5b40', 2.5, 0.65)
        }) +
        path('M566 570Q799 640 1041 570L1041 589Q804 660 566 589Z', '#6d6847') +
        path('M566 664Q799 733 1041 664L1041 683Q804 752 566 683Z', '#6d6847') +
        path('M731 552L854 552L854 688L731 688Z', '#614f38') +
        path('M740 559L846 559L846 682L740 682Z', '#9c7e54') +
        times(5, (index) =>
          line(`M${750 + index * 20} 566L${750 + index * 20} 676`, '#69573d', 2.5),
        ) +
        line('M743 583L843 583M743 651L843 651', '#534f3b', 6),
    ) +
    group(
      'thatched-roof',
      path(
        'M805 244Q762 302 665 358Q585 415 508 468Q583 513 807 527Q1006 511 1098 468Q951 364 867 292L805 244Z',
        'url(#earth)',
      ) +
        path('M508 468Q810 540 1098 468L1080 490Q810 558 524 490Z', '#82764f') +
        times(85, (index) => {
          const fraction = index / 84
          const horizontal = 517 + fraction * 572
          return brush(
            [
              [805 + (horizontal - 805) * 0.2, 299],
              [805 + (horizontal - 805) * 0.46, 356],
              [horizontal - 7, 445],
              [horizontal, 477 + Math.sin(fraction * Math.PI) * 31],
            ],
            3,
            index % 3 === 0 ? '#d1b888' : '#8e7e54',
            0.7,
          )
        }),
    ) +
    group(
      'front-legs',
      path('M585 711L585 853L622 863L622 719Z', 'url(#wood)') +
        path('M991 716L991 853L1027 845L1027 707Z', 'url(#wood)') +
        ellipse(604, 770, 48, 13, '#ad9e79') +
        ellipse(1011, 769, 48, 13, '#ad9e79'),
    ) +
    group(
      'ladder',
      line('M708 875L749 671M862 875L824 671', '#a18a60', 14) +
        times(6, (index) => {
          const fraction = index / 5
          return line(
            `M${714 + fraction * 34} ${851 - fraction * 170}L${856 - fraction * 32} ${851 - fraction * 170}`,
            '#78684b',
            10,
          )
        }),
    ) +
    group(
      'grain-sheaf',
      times(9, (index) =>
        brush(
          [
            [1115, 856],
            [1086 + index * 7, 805],
            [1080 + index * 11, 742],
            [1072 + index * 14, 705 + (index % 3) * 13],
          ],
          4,
          '#a08b4e',
          0.8,
        ),
      ) + line('M1086 808L1145 804', '#7a7952', 8),
    )
  )
}

function screenWall() {
  return (
    group(
      'paving',
      path('M396 820L1024 752L1225 851L590 924Z', '#9eaa97', 0.28) +
        line(
          'M438 841L1064 782M505 876L1132 815M638 799L827 898M855 776L1044 873',
          '#869780',
          2,
          0.4,
        ),
    ) +
    group(
      'stone-base',
      path('M479 770L1068 770L1125 802L534 802Z', '#bbc0aa') +
        path('M534 802L1125 802L1125 853L534 853Z', 'url(#stone)') +
        path('M479 770L534 802L534 853L479 819Z', '#667f71'),
    ) +
    group(
      'wall-volume',
      path('M513 359L1061 359L1061 775L513 775Z', '#b9b5a0') +
        path('M513 359L547 379L547 790L513 775Z', '#7b8f80') +
        path('M547 379L1095 379L1095 790L547 790Z', '#c2c4ae') +
        path('M590 421L1052 421L1052 744L590 744Z', '#859a87') +
        path('M606 437L1036 437L1036 728L606 728Z', '#a9b7a0') +
        ellipse(821, 582, 122, 122, '#7d9380') +
        ellipse(821, 582, 111, 111, '#b8bf9f') +
        path(
          'M754 639Q786 610 787 562Q789 540 778 514Q826 529 825 560Q821 577 809 590Q850 554 860 520Q878 558 853 597Q826 630 777 649Z',
          '#6b876e',
        ) +
        path(
          'M774 650Q828 652 877 616Q889 605 897 587Q901 630 863 647Q811 675 774 650Z',
          '#849b7c',
        ) +
        line('M601 451L1028 451M601 716L1028 716', '#c7cbb5', 3, 0.65),
    ) +
    group(
      'tiled-cap',
      path('M483 350Q624 340 784 306Q952 345 1123 363L1103 387Q812 375 501 376Z', '#5b7469') +
        path('M501 376Q817 377 1103 387L1103 401Q814 391 501 390Z', '#3e5b52') +
        path('M483 350Q620 340 784 306L802 318Q650 351 503 362Z', '#8da08e') +
        times(35, (index) =>
          line(
            `M${504 + index * 17} ${352 + Math.abs(index - 17) * 0.18}L${510 + index * 17} ${378 + index * 0.3}`,
            '#a9b29c',
            2,
            0.6,
          ),
        ),
    ) +
    group(
      'side-grasses',
      [
        [417, 865, 395, 693],
        [430, 869, 455, 666],
        [443, 871, 500, 725],
        [1166, 864, 1197, 703],
      ]
        .map(([horizontal, vertical, tipX, tipY], index) =>
          brush(
            [
              [horizontal, vertical],
              [horizontal - 10, vertical - 89],
              [tipX - 9, tipY + 10],
              [tipX, tipY],
            ],
            11 + index * 2,
            '#648361',
            0.8,
          ),
        )
        .join('') + rock(1170, 868, 0.35),
    )
  )
}

const studies = [
  {
    id: 'acorus-creek-stones',
    name: '菖蒲清溪',
    category: 'color',
    theme: '溪石 / 苍绿与青灰',
    note: '剑叶从根际弯出，肉穗花序接花梗，溪石与根部形成前后遮挡。',
    draw: acorus,
  },
  {
    id: 'cockscomb-autumn-crimson',
    name: '鸡冠映秋',
    category: 'color',
    theme: '花卉 / 绛红与秋绿',
    note: '鸡冠花的褶皱肉质花冠有共同花托，枝叶逐级承接，不画成扇形轮廓。',
    draw: cockscomb,
  },
  {
    id: 'crape-myrtle-pink-cloud',
    name: '紫薇绯云',
    category: 'color',
    theme: '花木 / 烟粉与淡赭',
    note: '弯干托举疏密不同的花序，皱瓣有体面和花心，保留枝间负形。',
    draw: crapeMyrtle,
  },
  {
    id: 'spotted-dove-elm-branch',
    name: '斑鸠榆影',
    category: 'figures',
    theme: '花鸟 / 灰褐与豆绿',
    note: '小头、厚胸、长尾与黑白颈斑区分鸟形，两足包扣树枝。',
    draw: dove,
  },
  {
    id: 'hedgehog-fallen-chestnuts',
    name: '刺猬寻栗',
    category: 'figures',
    theme: '生灵 / 栗褐与草金',
    note: '低伏刺猬有尖吻、圆耳和短足，栗实散在地面，不画背刺运果。',
    draw: hedgehog,
  },
  {
    id: 'wild-geese-reed-flight',
    name: '芦汀鸿雁',
    category: 'figures',
    theme: '飞鸟 / 灰羽与芦赭',
    note: '两雁近远错落，长颈向前、近远翼不同角度，苇穗接入草茎。',
    draw: flyingGeese,
  },
  {
    id: 'bronze-pan-iron-silk',
    name: '铜熨展帛',
    category: 'color',
    theme: '百工 / 古铜与绛帛',
    note: '长柄铜熨斗以深盘容炭，柄接盘后壁，器底贴近丝帛，通用器形意象。',
    draw: bronzeIron,
  },
  {
    id: 'wooden-fish-red-cushion',
    name: '木鱼静声',
    category: 'color',
    theme: '木器 / 熟褐与朱绒',
    note: '参考天宁寺木鱼的圆钝梨形腹、侧面斜向长音口与前缘浅刻鱼纹，木体连续，软垫承底，槌置侧边。',
    draw: woodenFish,
  },
  {
    id: 'suspended-bronze-gong',
    name: '铜锣悬响',
    category: 'color',
    theme: '礼乐 / 铜金与深木',
    note: '圆锣有收边与中央鼓面，双绳接梁，框架落脚，槌头有包裹层。',
    draw: gong,
  },
  {
    id: 'windlass-well-bucket',
    name: '辘轳井畔',
    category: 'ink',
    theme: '乡居 / 木赭与石青',
    note: '双柱托卷筒与轴，曲柄接近端轴头，绳垂入井口，木桶置井沿。',
    draw: windlass,
  },
  {
    id: 'raised-thatched-granary',
    name: '草仓藏粟',
    category: 'ink',
    theme: '乡野 / 谷金与竹木',
    note: '架空圆仓、草顶、束箍、短梯和立足形成可读支承，仅作原创粮仓意象。',
    draw: granary,
  },
  {
    id: 'grey-tile-screen-wall',
    name: '苍瓦照壁',
    category: 'ink',
    theme: '庭院 / 苍瓦与浅石',
    note: '影壁、瓦帽、石座共享投影，圆形装饰为原创叶纹，不假托历史纹样。',
    draw: screenWall,
  },
]

mkdirSync(destination, { recursive: true })
for (const study of studies) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}原创代码彩墨意象，非文物、古迹、技术或物种复原。透明背景。</desc>${definitions}${study.draw()}</svg>`
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
console.log('Generated twelve creek and crafts ink studies')
