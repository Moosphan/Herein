import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const ink = '#35413d'
const round = (value) => Number(value.toFixed(2))
const times = (count, callback) =>
  Array.from({ length: count }, (_, index) => callback(index)).join('')
const path = (shape, color = ink, opacity = 1, extra = '') =>
  `<path d="${shape}" fill="${color}" opacity="${opacity}" ${extra}/>`
const line = (shape, color = ink, width = 2, opacity = 1) =>
  `<path d="${shape}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`
const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1, extra = '') =>
  `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${color}" opacity="${opacity}" ${extra}/>`
const group = (identity, content, extra = '') => `<g id="${identity}" ${extra}>${content}</g>`
const wash = (shape, color, opacity) => path(shape, color, opacity, 'filter="url(#soft)"')
const texture = 'filter="url(#pigment)"'

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
  for (let step = 0; step <= 32; step++) {
    const fraction = step / 32
    const center = curve(fraction)
    const previous = curve(Math.max(0, fraction - 0.002))
    const next = curve(Math.min(1, fraction + 0.002))
    const length = Math.hypot(next[0] - previous[0], next[1] - previous[1]) || 1
    const breadth =
      (width * (0.32 + Math.sin(fraction * Math.PI) * 0.68) * (1 - fraction * 0.85)) / 2
    const normal = [-(next[1] - previous[1]) / length, (next[0] - previous[0]) / length]
    left.push(center.map((value, axis) => round(value + normal[axis] * breadth)))
    right.unshift(center.map((value, axis) => round(value - normal[axis] * breadth)))
  }
  return path(
    'M' + [...left, ...right].map((point) => point.join(' ')).join('L') + 'Z',
    color,
    opacity,
    texture,
  )
}

const definitions = `<defs>
<filter id="soft" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="3.3"/></filter>
<filter id="pigment" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="29" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .2 0 0 0 .8" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in"/></filter>
<radialGradient id="jade" cx="36%" cy="30%" r="85%"><stop stop-color="#c2c9a6"/><stop offset=".4" stop-color="#8b9e7d"/><stop offset=".8" stop-color="#657d66"/><stop offset="1" stop-color="#b2b58a"/></radialGradient>
<linearGradient id="copper" x2="100%" y2="65%"><stop stop-color="#554f37"/><stop offset=".35" stop-color="#b59b61"/><stop offset=".68" stop-color="#87764d"/><stop offset="1" stop-color="#505a44"/></linearGradient>
<linearGradient id="lacquer" x2="100%" y2="85%"><stop stop-color="#9e5146"/><stop offset=".5" stop-color="#7b3734"/><stop offset="1" stop-color="#4c3030"/></linearGradient>
<radialGradient id="celadon" cx="33%" cy="24%" r="85%"><stop stop-color="#d2d6be"/><stop offset=".55" stop-color="#a4b6a0"/><stop offset="1" stop-color="#658678"/></radialGradient>
<linearGradient id="wood" x2="100%" y2="20%"><stop stop-color="#594b3a"/><stop offset=".45" stop-color="#a28b60"/><stop offset="1" stop-color="#66543e"/></linearGradient>
<radialGradient id="moon"><stop stop-color="#eee4c7" stop-opacity=".95"/><stop offset=".86" stop-color="#e3d6b5" stop-opacity=".7"/><stop offset="1" stop-color="#e3d6b5" stop-opacity="0"/></radialGradient>
</defs>`

function writingDesk() {
  let content = group(
    'unrolled-paper',
    path('M414 481Q609 446 797 484L824 738Q625 705 434 755Z', '#e4d5b4') +
      path('M414 481Q434 463 445 488L464 743Q444 773 434 755Z', '#bfa67b') +
      line('M483 513Q618 493 748 518', '#c3b38e', 1.4, 0.6),
  )
  content += group(
    'inkstone',
    path('M747 603Q878 551 1082 603L1101 757Q922 829 738 757Z', '#394541') +
      ellipse(916, 606, 169, 59, '#718076') +
      ellipse(919, 608, 135, 40, '#293e3f') +
      ellipse(945, 613, 92, 25, '#334c4d') +
      line('M758 745Q927 793 1084 744', '#8e9c87', 4, 0.5),
  )
  content += group(
    'brush',
    path('M655 257L680 269L553 652L530 644Z', 'url(#wood)') +
      path('M530 644L553 652L541 691L521 683Z', '#343f3b') +
      path('M521 680Q548 691 541 712Q525 753 495 791Q511 733 508 716Z', '#384541', 1, texture) +
      brush(
        [
          [518, 710],
          [521, 740],
          [505, 770],
          [495, 791],
        ],
        5,
        '#839487',
        0.7,
      ),
  )
  content += group(
    'ink-stick',
    path('M1030 430L1103 446L1082 620L1007 605Z', '#34413d') +
      path('M1043 445L1089 454L1073 592L1022 581Z', '#48534a') +
      line('M1047 471L1070 477M1042 493L1066 499M1039 517L1061 522', '#b09b69', 4, 0.8),
  )
  content += group(
    'brush-rest',
    path(
      'M658 762Q671 718 690 751Q706 709 724 750Q743 719 757 759L759 777L655 781Z',
      'url(#celadon)',
    ),
  )
  return content
}

function jadePendant() {
  let content = group(
    'silk-cord',
    line(
      'M760 237Q698 141 765 125Q819 138 814 230M800 151Q852 94 892 148Q920 204 839 249',
      '#8d4d41',
      9,
    ) + line('M789 159Q771 221 790 239', '#c48d70', 2, 0.8),
  )
  content += group(
    'jade-disc',
    path(
      'M1038 468A238 238 0 1 1 562 468A238 238 0 1 1 1038 468ZM875 468A75 75 0 1 0 725 468A75 75 0 1 0 875 468Z',
      'url(#jade)',
      1,
      'fill-rule="evenodd"',
    ),
  )
  content += ellipse(800, 468, 213, 213, 'none', 1, 'stroke="#bfc6a1" stroke-width="3"')
  content += ellipse(800, 468, 98, 98, 'none', 0.7, 'stroke="#c5c9a5" stroke-width="3"')
  content += group(
    'carved-clouds',
    times(11, (index) =>
      group(
        'cloud-' + index,
        line('M-16 -164q-24 -27 -37 -2q-4 19 19 22q22 -1 25 -21q15 11 26 2', '#506f5b', 3, 0.45) +
          line('M-12 -164q-17 -12 -20 1', '#d0d2ad', 2, 0.6),
        `transform="translate(800 468) rotate(${(index * 360) / 11})"`,
      ),
    ),
  )
  content += group(
    'tassel-knot',
    line('M779 687Q757 738 800 748Q843 736 821 687M800 726L800 798', '#925246', 8) +
      path('M800 757L822 784L801 808L780 784Z', '#a86350'),
  )
  content += group(
    'tassel',
    times(19, (index) =>
      brush(
        [
          [782 + index * 2, 803],
          [770 + index * 3, 827],
          [770 + index * 3, 867],
          [765 + index * 3.5, 907],
        ],
        4,
        index % 3 ? '#a65d4c' : '#c18566',
        0.85,
      ),
    ),
  )
  return content
}

function chimeBells() {
  let content = group(
    'frame',
    path('M446 261L492 259L490 827L445 827ZM1104 260L1152 261L1153 827L1107 827Z', 'url(#wood)') +
      path('M418 243Q799 270 1179 243L1171 290Q808 312 429 290Z', '#735b40') +
      path('M426 244Q484 222 513 245L1090 246Q1123 222 1172 244Z', '#ad8b58') +
      path('M419 821L523 821L542 848L408 848ZM1080 821L1180 821L1195 848L1067 848Z', '#766044'),
  )
  content += group(
    'suspension',
    times(5, (index) => line(`M${551 + index * 124} 288v${75 + index * 26}`, '#7d6650', 5)),
  )
  content += group(
    'five-bells',
    times(5, (index) => {
      const size = 0.78 + index * 0.09
      const bell =
        path('M-39 0Q-53 80 -63 109Q0 143 63 109Q53 79 39 0Z', 'url(#copper)', 1, texture) +
        ellipse(0, 5, 39, 12, '#8f7b50') +
        ellipse(0, 112, 62, 20, '#4e5140') +
        ellipse(0, 111, 47, 11, '#8c7950') +
        line('M0 20v81', '#cfb27b', 3, 0.7) +
        times(
          3,
          (row) =>
            ellipse(-22, 32 + row * 21, 4, 5, '#b59b67') +
            ellipse(22, 32 + row * 21, 4, 5, '#b59b67'),
        )
      return group(
        'bell-' + index,
        bell,
        `transform="translate(${551 + index * 124} ${365 + index * 26}) scale(${size})"`,
      )
    }),
  )
  content += group(
    'mallet',
    line('M635 745L1005 688', '#866948', 12) +
      ellipse(1007, 686, 26, 18, '#9a7850', 1, 'transform="rotate(-12 1007 686)"'),
  )
  return content
}

function lacquerBox() {
  let content = group(
    'box-body',
    path('M465 464L1015 403L1144 483L1113 702L604 782L468 676Z', 'url(#lacquer)', 1, texture) +
      path('M604 542L1144 483L1113 702L604 782Z', '#6b3431') +
      path('M468 482L604 542L604 782L468 676Z', '#542f2d'),
  )
  content += group(
    'fitted-lid',
    path('M451 439L1009 375L1153 464L1150 500L601 569L454 497Z', '#4f3530') +
      path('M451 439L1009 375L1153 464L600 534Z', 'url(#lacquer)') +
      line('M460 447L600 526L1136 464', '#c99d68', 4, 0.8) +
      line('M616 571L1134 505M616 752L1106 677', '#be925e', 3, 0.8),
  )
  let inlay = brush(
    [
      [690, 680],
      [771, 614],
      [887, 591],
      [1002, 560],
    ],
    8,
    '#bcc5ac',
    0.9,
  )
  for (const [horizontal, vertical, direction] of [
    [743, 640, -1],
    [791, 615, 1],
    [853, 595, -1],
    [909, 579, 1],
  ]) {
    inlay += path(
      `M${horizontal} ${vertical}q${direction * 25} -46 ${direction * 62} -35q${-direction * 10} 32 ${-direction * 62} 35Z`,
      '#c6cbb3',
    )
    inlay += line(`M${horizontal} ${vertical}l${direction * 44} -27`, '#869b8b', 1.3, 0.7)
  }
  content += group('mother-of-pearl', inlay)
  content += group(
    'lid-cloud',
    line(
      'M673 457q30 -42 72 -14q25 -54 74 -26q52 3 59 25q-72 -15 -83 11q-39 -10 -65 13',
      '#ceb47f',
      4,
      0.7,
    ),
  )
  return content
}

function bowQuiver() {
  let content = group('bow-string', line('M674 224L547 765L891 648', '#b6a77c', 3))
  content += group(
    'laminated-bow',
    brush(
      [
        [674, 224],
        [981, 209],
        [1028, 503],
        [891, 648],
      ],
      42,
      '#5b4437',
    ) +
      brush(
        [
          [676, 226],
          [945, 241],
          [987, 487],
          [890, 646],
        ],
        16,
        '#a18356',
      ) +
      path('M942 398L976 412L958 486L924 470Z', '#65473c') +
      times(7, (index) => line(`M${938 - index * 2} ${412 + index * 8}l25 10`, '#bd9c6d', 2, 0.8)),
  )
  content += group(
    'arrow',
    line('M554 753L1073 454', '#89744c', 8) +
      path('M1072 454L1117 426L1102 462L1077 465Z', '#52605a') +
      path('M568 744L550 718L516 739L539 763ZM564 754L554 786L520 795L539 769Z', '#bbaa7d'),
  )
  let quiver =
    path('M1093 543L1213 576L1167 848Q1113 872 1057 822Z', '#936a47') +
    path('M1134 565L1208 581L1167 848L1124 851Z', '#70533d') +
    ellipse(1150, 556, 64, 21, '#574739', 1, 'transform="rotate(15 1150 556)"')
  quiver += times(
    4,
    (index) =>
      line(
        `M${1104 + index * 24} ${553 + index * 5}l${34 - index * 5} -${221 - index * 17}`,
        '#927b50',
        5,
      ) + path(`M${1120 + index * 19} ${358 + index * 22}l-10 -41l19 -18l2 40Z`, '#aaa98c'),
  )
  return content + group('quiver', quiver)
}

function strungCoins() {
  let content = group(
    'thread-behind',
    line(
      'M485 448Q530 340 688 444Q781 501 895 434Q1074 403 1091 569Q1116 722 940 804',
      '#99664b',
      15,
    ) + line('M478 444Q541 332 687 438', '#c29a70', 4, 0.8),
  )
  for (const [index, horizontal, vertical, size] of [
    [0, 602, 528, 1.02],
    [1, 825, 555, 1.13],
    [2, 1016, 646, 0.94],
  ]) {
    let coin = path(
      'M143 0A143 143 0 1 1 -143 0A143 143 0 1 1 143 0ZM-43 -43V43H43V-43Z',
      'url(#copper)',
      1,
      'fill-rule="evenodd"',
    )
    coin +=
      ellipse(0, 0, 128, 128, 'none', 0.8, 'stroke="#c4ac71" stroke-width="5"') +
      path('M-52 -52H52V52H-52Z', 'none', 1, 'stroke="#594f37" stroke-width="4"')
    coin += times(4, (part) =>
      group(
        'casting-mark-' + index + '-' + part,
        line('M-15 -90h27M-12 -79h21M0 -97v30', '#645e41', 4, 0.55),
        `transform="rotate(${part * 90})"`,
      ),
    )
    content += group(
      'coin-' + index,
      coin,
      `transform="translate(${horizontal} ${vertical}) rotate(${index * 17 - 12}) scale(${size})"`,
    )
  }
  content += group(
    'thread-through-holes',
    line(
      'M577 501Q595 526 628 546M801 533Q824 553 851 572M1000 629Q1013 642 1035 663',
      '#9b6c4e',
      8,
    ) + line('M579 501Q596 523 627 542M803 534L850 569M1002 630L1033 660', '#c29a70', 2, 0.75),
  )
  content += group(
    'front-knot',
    line('M1017 682Q1023 735 1068 742Q1094 720 1069 704Q1037 709 1042 751L1001 819', '#a87150', 9),
  )
  return content
}

function teaBrazier() {
  let content = group(
    'brazier',
    path('M603 533L879 533L864 800Q748 850 618 802Z', '#9d7250', 1, texture) +
      ellipse(741, 535, 139, 45, '#6a5140') +
      ellipse(742, 536, 112, 30, '#3e433b') +
      path(
        'M637 710Q655 685 675 707L676 759L638 759ZM722 713Q743 687 762 709L762 764L722 764ZM806 708Q825 683 842 704L842 758L806 760Z',
        '#54493a',
      ) +
      line('M622 795Q741 836 857 793', '#c09b70', 5, 0.8),
  )
  let kettle = path(
    'M618 423Q607 337 678 313Q745 283 811 321Q865 352 858 427Q836 489 739 490Q648 489 618 423Z',
    'url(#celadon)',
    1,
    texture,
  )
  kettle +=
    path('M836 365Q888 385 910 336L940 334Q924 413 855 414Z', '#91a98f') +
    path(
      'M646 326Q598 194 739 190Q878 193 829 329',
      'none',
      1,
      'stroke="#59634e" stroke-width="18" stroke-linecap="round"',
    ) +
    ellipse(737, 317, 59, 16, '#809a86') +
    ellipse(738, 307, 14, 11, '#65836f')
  content += group('kettle', kettle, 'transform="translate(0 43)"')
  content += group(
    'tea-bowls',
    path('M1025 701Q1030 780 1094 779Q1151 775 1156 701Z', 'url(#celadon)') +
      ellipse(1091, 702, 66, 20, '#c2cbb1') +
      ellipse(1092, 703, 51, 13, '#8b7b4c') +
      path('M1068 776L1120 775L1116 789L1071 790Z', '#6e8a76'),
  )
  content += group(
    'steam',
    wash(
      'M741 279Q687 232 748 190Q793 146 754 98Q823 147 779 192Q738 231 772 279Z',
      '#8c9688',
      0.23,
    ),
    'transform="translate(0 75)"',
  )
  return content
}

function weavingLoom() {
  let content = group(
    'rear-frame',
    path('M541 231L573 231L565 824L530 824ZM1019 231L1052 231L1068 826L1033 826Z', 'url(#wood)') +
      path('M511 227L1080 227L1080 259L511 259Z', '#836948'),
  )
  content += group(
    'warp-threads',
    times(35, (index) =>
      line(`M${590 + index * 12} 260L${587 + index * 12} 640`, '#d1ba8f', 2.2, 0.85),
    ),
  )
  content += group(
    'woven-cloth',
    path('M584 497L1004 497L1006 768Q803 813 581 768Z', '#8f6470', 1, texture) +
      times(22, (index) =>
        line(
          `M585 ${508 + index * 11}Q789 ${518 + index * 11} 1004 ${508 + index * 11}`,
          '#c4a3a0',
          1.5,
          0.5,
        ),
      ) +
      times(21, (index) => line(`M${593 + index * 20} 499v274`, '#bea08e', 1, 0.4)),
  )
  content += group(
    'front-beams',
    path('M518 632L1082 632L1082 669L518 669Z', 'url(#wood)') +
      path('M518 664L550 664L525 876L488 876ZM1050 664L1082 664L1124 876L1084 876Z', '#755a3e') +
      path('M495 856L1118 856L1121 884L492 884Z', '#826446'),
  )
  content += group(
    'shuttle',
    path('M696 587Q776 551 859 585Q787 621 696 587Z', '#71503a') +
      path('M737 585Q779 567 821 585Q780 602 737 585Z', '#dfc99b') +
      line('M791 583Q861 543 888 482', '#d0bb91', 2),
  )
  content += group(
    'winding-beam',
    line('M553 790L1032 790', '#ac8a58', 22) +
      ellipse(551, 789, 16, 23, '#745b3c') +
      ellipse(1033, 789, 16, 23, '#745b3c'),
  )
  return content
}

function terracesWheel() {
  let content = group(
    'distant-hills',
    wash(
      'M233 595Q354 469 474 446Q523 371 585 392Q673 449 733 493Q827 402 902 398Q997 422 1111 529L1306 651Z',
      '#7c8a81',
      0.27,
    ),
  )
  const bands = [
    [
      'M298 639Q407 549 584 544Q743 560 883 503Q1004 485 1175 591L1204 633Q1008 551 880 559Q711 616 579 599Q430 606 336 684Z',
      '#9a9e6c',
    ],
    [
      'M259 712Q426 633 587 641Q748 678 921 600Q1023 582 1232 679L1259 729Q1053 649 930 657Q753 737 578 705Q412 705 295 753Z',
      '#89976a',
    ],
    [
      'M217 796Q406 737 566 755Q766 788 925 716Q1096 684 1329 801L1285 853Q1104 780 930 775Q768 845 551 816Q393 805 258 851Z',
      '#a49f70',
    ],
  ]
  for (const [index, shape, color] of bands.map((band, index) => [index, ...band])) {
    content += group('terrace-' + index, path(shape, color, 0.9, texture))
  }
  content += group(
    'field-ridges',
    line('M301 639Q467 551 584 552Q739 567 882 511Q1011 501 1165 590', '#667c59', 5, 0.6) +
      line('M266 713Q427 643 586 648Q746 686 922 609Q1041 588 1221 681', '#617b58', 5, 0.55) +
      line('M228 797Q406 748 564 762Q764 795 927 725Q1091 697 1317 801', '#7d8257', 6, 0.65) +
      times(9, (index) =>
        brush(
          [
            [376 + index * 83, 625 - Math.sin(index) * 20],
            [381 + index * 83, 638 - Math.sin(index) * 20],
            [393 + index * 83, 644 - Math.sin(index) * 20],
            [402 + index * 83, 651 - Math.sin(index) * 20],
          ],
          3,
          '#b7ba8a',
          0.6,
        ),
      ),
  )
  content += group(
    'watercourse',
    wash(
      'M880 604Q921 669 858 718Q803 777 851 847L1006 870Q906 798 952 741Q1004 684 938 627Z',
      '#799795',
      0.57,
    ) + line('M903 651Q950 708 886 765Q870 798 900 833', '#c8d3ba', 4, 0.55),
  )
  let wheel =
    ellipse(1087, 660, 131, 131, 'none', 1, 'stroke="#756044" stroke-width="15"') +
    ellipse(1087, 660, 110, 110, 'none', 1, 'stroke="#9b8055" stroke-width="8"')
  wheel += times(12, (index) =>
    group(
      'spoke-' + index,
      line('M0 0L0 -126', '#8b704b', 7) + path('M-13 -123L21 -119L18 -96L-14 -101Z', '#9d845b'),
      `transform="translate(1087 660) rotate(${index * 30})"`,
    ),
  )
  wheel +=
    ellipse(1087, 660, 21, 21, '#62533e') +
    path('M1048 698L1073 689L1039 862L1008 862ZM1114 690L1137 699L1170 862L1138 862Z', '#655a44')
  content += group('waterwheel', wheel)
  return content
}

function swallow(horizontal, vertical, size, flip = 1) {
  let bird = path(
    'M-12 4Q-40 -42 -115 -55Q-80 -10 -30 24Q-1 46 22 12Q71 -11 91 -63Q38 -48 11 -8Z',
    '#38494a',
    1,
    texture,
  )
  bird +=
    path('M-7 10Q10 4 22 14Q10 35 -4 33Z', '#d8c7a5') +
    ellipse(18, 0, 13, 12, '#38494a') +
    path('M27 -3L49 3L29 7Z', '#6e6549') +
    path('M-23 24L-63 89L-20 61L1 94L-6 27Z', '#38494a') +
    ellipse(21, -2, 2, 2, '#d7c9aa')
  return group(
    'swallow-' + horizontal,
    bird,
    `transform="translate(${horizontal} ${vertical}) rotate(-15) scale(${size * flip} ${size})"`,
  )
}
function apricotSwallows() {
  let content = group(
    'branch',
    brush(
      [
        [380, 848],
        [572, 699],
        [653, 443],
        [901, 229],
      ],
      48,
      '#62513f',
    ) +
      brush(
        [
          [566, 680],
          [677, 653],
          [824, 638],
          [1020, 519],
        ],
        23,
        '#6e5844',
      ) +
      brush(
        [
          [692, 439],
          [640, 365],
          [594, 309],
          [472, 286],
        ],
        18,
        '#6e5844',
      ),
  )
  const blooms = [
    [530, 305],
    [590, 328],
    [631, 385],
    [709, 411],
    [747, 365],
    [791, 321],
    [851, 265],
    [883, 230],
    [698, 641],
    [779, 628],
    [855, 601],
    [928, 564],
    [1018, 514],
  ]
  content += group(
    'apricot-blossom',
    blooms
      .map(([horizontal, vertical], index) => {
        const petals =
          times(5, (petal) =>
            ellipse(
              0,
              -13,
              12,
              18,
              index % 3 ? '#d4a399' : '#be8a86',
              0.95,
              `transform="rotate(${petal * 72})"`,
            ),
          ) +
          ellipse(0, 0, 6, 6, '#b18c52') +
          times(7, (stamen) =>
            line(
              `M0 0l${round(Math.cos(stamen) * 12)} ${round(Math.sin(stamen) * 12)}`,
              '#d5b87b',
              1.3,
            ),
          )
        return group(
          'blossom-' + index,
          petals,
          `transform="translate(${horizontal} ${vertical}) rotate(${index * 19}) scale(${index % 3 ? 0.75 : 1})"`,
        )
      })
      .join(''),
  )
  content += group('spring-birds', swallow(1050, 361, 1.4) + swallow(1070, 645, 0.88, -1))
  return content
}

function koi(horizontal, vertical, rotation, size, color) {
  const tones =
    color === '#ba6752'
      ? ['#9e4e40', '#ba6752', '#cb885e', '#bc8056']
      : ['#89703f', '#ae8d50', '#c2a467', '#b49760']
  const toneId = 'koi-tone-' + horizontal
  let fish = `<defs><linearGradient id="${toneId}" x1="0%" y1="0%" x2="0%" y2="100%"><stop stop-color="${tones[0]}"/><stop offset=".42" stop-color="${tones[1]}"/><stop offset=".8" stop-color="${tones[2]}"/><stop offset="1" stop-color="${tones[3]}"/></linearGradient></defs>`
  fish += path(
    'M-133 -6Q-114 -71 -22 -63Q68 -51 108 -5Q47 37 -45 54Q-108 60 -133 -6Z',
    `url(#${toneId})`,
    1,
    texture,
  )
  fish +=
    path('M-131 -11Q-156 -64 -199 -78L-182 -7L-204 70Q-160 62 -126 7Z', color, 0.9) +
    path('M-19 -57Q-14 -102 31 -90L52 -43Z', color, 0.68) +
    path('M-10 28Q15 78 65 79L42 17Z', color, 0.7)
  fish +=
    line('M-181 -65L-143 -12M-188 50L-144 4', '#8d745a', 1.5, 0.6) +
    line('M66 -27Q50 -3 72 17', '#9b6552', 2, 0.7) +
    ellipse(83, -15, 4.5, 4.5, '#34403b') +
    ellipse(84, -16, 1.4, 1.3, '#e8d4ab') +
    line('M108 -5q12 -4 17 2M108 -4q11 7 14 16', '#6a6551', 1.5)
  fish += times(3, (row) =>
    times(5, (index) =>
      line(`M${-58 + index * 22} ${-28 + row * 22}q13 7 0 15`, '#8b674f', 1, 0.28),
    ),
  )
  return group(
    'koi-' + horizontal,
    fish,
    `transform="translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${size})"`,
  )
}
function lotusKoi() {
  let content = group(
    'pond-wash',
    wash(
      'M392 583Q528 461 742 503Q914 470 1113 555Q1226 684 1077 784Q813 868 531 802Q361 746 392 583Z',
      '#92a7a0',
      0.23,
    ),
  )
  content += group(
    'lotus-leaf',
    path(
      'M460 346Q405 228 546 216Q667 156 764 279Q773 395 645 416Q516 454 460 346Z',
      '#6f8a6a',
      0.86,
      texture,
    ) +
      path('M610 329L747 264L745 309L679 357Z', '#dfc69c', 0) +
      times(7, (index) =>
        brush(
          [
            [609, 327],
            [570 + index * 15, 310],
            [472 + index * 34, 294],
            [462 + index * 38, 251 + Math.abs(index - 3) * 27],
          ],
          3,
          '#a9b18a',
          0.65,
        ),
      ) +
      brush(
        [
          [610, 328],
          [624, 454],
          [561, 548],
          [581, 682],
        ],
        8,
        '#73896a',
        0.7,
      ),
  )
  content += group(
    'swimming-koi',
    koi(776, 577, -26, 1.27, '#ba6752') + koi(1037, 723, 148, 0.85, '#ae8d50'),
  )
  content += group(
    'ripples',
    line(
      'M486 733Q581 759 678 742M878 470Q994 446 1085 478M673 826Q821 851 949 824',
      '#78958d',
      2,
      0.5,
    ),
  )
  return content
}

function moonPavilion() {
  let content = group(
    'moon-and-cloud',
    ellipse(1124, 255, 128, 128, 'url(#moon)') +
      wash(
        'M902 301Q975 269 1038 291Q1114 329 1252 295Q1220 353 1124 345Q1019 317 902 327Z',
        '#b5b8a3',
        0.37,
      ),
  )
  content += group(
    'distant-shore',
    wash('M273 699Q414 605 516 616Q626 555 712 611Q824 658 905 616L1246 751Z', '#667f7d', 0.2),
  )
  let pavilion =
    path('M642 464L666 464L666 741L642 741ZM937 464L961 464L961 741L937 741Z', '#66513e') +
    path('M697 476L712 476L712 723L697 723ZM889 476L904 476L904 723L889 723Z', '#8b7350')
  pavilion +=
    path(
      'M567 470Q671 446 796 310Q929 443 1031 470Q937 503 795 489Q644 503 567 470Z',
      '#455f5c',
      1,
      texture,
    ) +
    path(
      'M567 470Q681 477 795 462Q929 477 1031 470L1014 491Q909 512 795 493Q682 510 584 491Z',
      '#314b49',
    ) +
    brush(
      [
        [797, 320],
        [766, 402],
        [651, 455],
        [582, 470],
      ],
      9,
      '#9ca68a',
      0.65,
    ) +
    brush(
      [
        [805, 329],
        [851, 407],
        [960, 458],
        [1016, 472],
      ],
      7,
      '#869b88',
      0.55,
    )
  pavilion +=
    path('M795 310L789 279L802 264L813 281L808 310Z', '#5a6551') +
    path('M621 729L982 729L1011 759L595 759Z', '#a29270') +
    path('M595 759L1011 759L1010 786L595 786Z', '#776f55')
  pavilion +=
    line('M661 680H941M665 696H939', '#8f7a55', 6) +
    times(7, (index) => line(`M${685 + index * 38} 682v44`, '#8f7a55', 5))
  content +=
    group('waterside-pavilion', pavilion) +
    group(
      'shore-and-water',
      wash('M412 795Q615 753 806 790Q978 776 1138 833L1043 855Q811 821 609 842Z', '#788f80', 0.36) +
        times(7, (index) =>
          line(`M${492 + index * 47} ${853 + index * 12}q120 -5 247 4`, '#7e9890', 1.6, 0.4),
        ),
    )
  return content
}

export const studies = [
  {
    id: 'inkstone-and-brush',
    name: '砚边笔意',
    theme: '文字制度与器用 · 文房书籍',
    category: 'color',
    note: '墨石青黑 · 纸卷米白 · 竹笔与笔架',
    draw: writingDesk,
  },
  {
    id: 'jade-disc-tassel',
    name: '玉璧垂绦',
    theme: '文字制度与器用 · 玉石佩饰',
    category: 'color',
    note: '青玉温润 · 真实透孔 · 赭红丝绦',
    draw: jadePendant,
  },
  {
    id: 'bronze-chime-bells',
    name: '编钟清韵',
    theme: '文字制度与器用 · 礼乐表演',
    category: 'color',
    note: '铜褐钟体 · 木架悬挂 · 简化五钟意象',
    draw: chimeBells,
  },
  {
    id: 'lacquer-inlay-box',
    name: '漆匣含光',
    theme: '文字制度与器用 · 漆木日用',
    category: 'color',
    note: '髹漆暗朱 · 浅色螺钿枝叶 · 盒盖承接',
    draw: lacquerBox,
  },
  {
    id: 'bow-and-quiver',
    name: '弓矢待发',
    theme: '军事与交通 · 兵器军需',
    category: 'color',
    note: '木骨弓身 · 连续弓弦 · 箭箙与羽翎',
    draw: bowQuiver,
  },
  {
    id: 'strung-round-coins',
    name: '钱串流通',
    theme: '生产交流与图解 · 商业货币',
    category: 'color',
    note: '铜金材料色 · 方孔镂空 · 钱绳穿接，纹样非币文',
    draw: strungCoins,
  },
  {
    id: 'tea-kettle-brazier',
    name: '炉畔茶烟',
    theme: '文字制度与器用 · 饮食茶事',
    category: 'color',
    note: '青瓷茶壶 · 赭陶小炉 · 淡烟与茶盏',
    draw: teaBrazier,
  },
  {
    id: 'loom-and-shuttle',
    name: '织梭经纬',
    theme: '生产交流与图解 · 百工制造',
    category: 'color',
    note: '木架经线 · 烟紫织面 · 梭与卷布梁，结构意象',
    draw: weavingLoom,
  },
  {
    id: 'terraces-waterwheel',
    name: '梯田水转',
    theme: '生产交流与图解 · 农耕水利',
    category: 'ink',
    note: '层叠田埂 · 青灰水路 · 木轮支架，非工程复原',
    draw: terracesWheel,
  },
  {
    id: 'apricot-two-swallows',
    name: '杏枝双燕',
    theme: '自然与环境 · 花木飞禽',
    category: 'figures',
    note: '杏粉花簇 · 枯褐枝势 · 近远双燕与叉尾',
    draw: apricotSwallows,
  },
  {
    id: 'lotus-swimming-koi',
    name: '莲下游鲤',
    theme: '自然与环境 · 水域鱼类',
    category: 'figures',
    note: '朱金双鲤 · 同色柔染腹面 · 莲叶与水面留白',
    draw: lotusKoi,
  },
  {
    id: 'moon-waterside-pavilion',
    name: '月下水亭',
    theme: '建筑与历史空间 · 园林庭院',
    category: 'ink',
    note: '青灰薄檐 · 柱梁台基 · 月色与水岸',
    draw: moonPavilion,
  },
]

export function generateStudies(destination, { scenes, overwrite = false } = {}) {
  const selected = scenes
    ? scenes.map((identity) => {
        const study = studies.find((entry) => entry.id === identity)
        if (!study) throw new Error('Unknown scene: ' + identity)
        return study
      })
    : studies
  if (!selected.length || new Set(selected.map((study) => study.id)).size !== selected.length)
    throw new Error('Select distinct scenes')
  const directory = join(resolve(destination), 'ink-wash')
  const outputs = [
    ...selected.map((study) => join(directory, study.id + '.svg')),
    join(directory, 'catalog.json'),
  ]
  if (!overwrite && outputs.some(existsSync))
    throw new Error('Output already exists; choose another directory or pass --overwrite')
  mkdirSync(directory, { recursive: true })
  for (const study of selected) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}。原创代码彩墨意象，非具体器物、服制或技术复原。透明背景。</desc>${definitions}${study.draw()}</svg>`
    const prefixed = svg
      .replace(/id="([^"]+)"/g, (_, identity) => `id="${study.id}-${identity}"`)
      .replace(/url\(#([^)]+)\)/g, (_, identity) => `url(#${study.id}-${identity})`)
      .replace(
        'aria-labelledby="title description"',
        `aria-labelledby="${study.id}-title ${study.id}-description"`,
      )
    writeFileSync(join(directory, study.id + '.svg'), prefixed)
  }
  writeFileSync(
    join(directory, 'catalog.json'),
    JSON.stringify(
      {
        version: 1,
        width: 1600,
        height: 1000,
        background: 'transparent',
        assets: selected.map(({ id, name, theme, category, note }) => ({
          id,
          name,
          theme,
          category,
          note,
          svg: id + '.svg',
          png: id + '.png',
        })),
      },
      null,
      2,
    ) + '\n',
  )
  console.log('Generated ' + selected.length + ' SVG studies in ' + directory)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      out: { type: 'string' },
      scenes: { type: 'string' },
      overwrite: { type: 'boolean', default: false },
      list: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })
  if (values.list) console.log(studies.map((study) => study.id + '  ' + study.name).join('\n'))
  else if (values.help)
    console.log(
      'node generate-expanded-studies.mjs --out DIRECTORY [--scenes ID,ID] [--overwrite] [--list]\nGenerates transparent SVG and catalog.json. Export PNG with render-assets.cjs.',
    )
  else {
    if (!values.out) throw new Error('--out DIRECTORY is required')
    generateStudies(values.out, { scenes: values.scenes?.split(','), overwrite: values.overwrite })
  }
}
