import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/literati-studies/ink-wash',
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
<clipPath id="silk-body"><path d="M562 391Q762 463 1005 387L1055 653Q1041 764 818 800Q618 787 548 682Z"/></clipPath>
<clipPath id="fan-face"><path d="M345 428Q790 -11 1267 406L1021 636Q821 461 634 645Z"/></clipPath>
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

function sparrow(horizontal, vertical, scale, angle) {
  return transform(
    path('M-17 40L-115 94L-105 111L-12 78Z', '#524d43', 1, grain) +
      path(
        'M-58 -10Q-84 24 -48 67Q-4 109 48 66Q86 42 58 -4Q22 -41 -22 -28Z',
        'url(#white)',
        1,
        grain,
      ) +
      path('M-49 -23Q-17 -44 34 -14Q43 29 -37 65Q-77 43 -49 -23Z', 'url(#brown)', 1, grain) +
      path('M-50 -12Q4 -12 23 11Q-2 43 -44 55Q-68 38 -50 -12Z', '#705941', 1, grain) +
      times(7, (index) =>
        line(
          `M${-42 + index * 6} ${-3 + index * 2}Q${-28 + index * 5} ${26 + index * 2} ${-48 + index * 8} ${47 + index}`,
          '#c5ad83',
          2.4,
          0.65,
        ),
      ) +
      path('M22 -20Q9 -58 42 -76Q82 -94 104 -59L97 -21Q63 8 22 -20Z', '#946d47', 1, grain) +
      path('M35 -30Q51 -57 87 -45L97 -21Q66 8 35 -30Z', '#e4d8bc', 1, grain) +
      path('M51 -26Q63 -39 75 -24Q68 -11 55 -14Z', '#343b36') +
      path('M99 -47L128 -36L98 -30Z', '#49483c') +
      ellipse(84, -48, 4.7, 4.7, '#252f2f') +
      ellipse(85, -50, 1.3, 1.3, '#eee0bd') +
      line('M-1 80L-7 103L-22 107M-7 103L5 111M30 77L28 100L14 106M28 100L41 104', '#6e5d45', 3),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function crabapple() {
  return (
    group(
      'old-branches',
      branch('M1218 824C1138 657 1056 552 872 481C672 394 549 316 351 236', 34) +
        branch('M884 485Q841 316 623 202Q542 149 458 142', 15) +
        branch('M738 423Q590 503 357 437', 13) +
        branch('M1091 640Q1123 472 1042 331', 13),
    ) +
    group(
      'leaves',
      times(22, (index) => {
        const horizontal = 406 + index * 33
        const vertical = 262 + index * 17 + Math.sin(index * 2.6) * 71
        return leaf(horizontal, vertical, -65 + (index % 5) * 37, 0.45 + (index % 3) * 0.13)
      }),
    ) +
    group(
      'blossoms',
      [
        [358, 238, 0.83, -12],
        [476, 293, 0.92, 30],
        [593, 344, 0.65, 9],
        [682, 386, 0.95, 20],
        [573, 193, 0.77, 12],
        [700, 250, 0.63, 11],
        [794, 341, 0.75, 50],
        [1003, 535, 0.95, 22],
        [1085, 468, 0.72, 0],
        [1054, 345, 0.72, 26],
        [410, 441, 0.91, 5],
        [543, 469, 0.67, 12],
      ]
        .map((parameters) => flower(...parameters))
        .join('') +
        times(12, (index) =>
          ellipse(
            391 + index * 57,
            221 + index * 22 + Math.sin(index * 1.3) * 88,
            9,
            14,
            '#b36981',
            1,
            grain,
          ),
        ),
    ) +
    group('spring-sparrow', sparrow(871, 365, 1.16, -9))
  )
}

function fingerCitron() {
  const body =
    'M670 719C612 657 599 580 638 522C621 478 588 438 594 389Q591 361 613 358Q633 361 628 384L651 421L681 472L673 348Q651 300 673 269Q691 254 705 273Q712 291 696 310L723 361L737 461L772 324Q785 288 768 260Q751 227 774 216Q803 209 811 250L824 293L801 458L845 374Q879 329 870 298Q858 269 882 262Q908 265 906 296L902 343L851 495L911 429Q942 414 943 384Q941 356 965 360Q988 373 970 402L949 449L885 549C914 649 861 752 772 769Q713 769 670 719Z'
  return (
    group(
      'dish',
      ellipse(794, 809, 296, 52, '#628b87', 0.22) +
        path(
          'M465 745Q779 836 1123 742Q1088 848 805 871Q556 855 465 745Z',
          'url(#jade)',
          1,
          grain,
        ) +
        ellipse(794, 747, 330, 72, '#d4dfcb', 1, grain) +
        ellipse(794, 748, 276, 48, '#93b2a5', 1, grain),
    ) +
    group(
      'citron-fruit',
      path(body, 'url(#yellow)', 1, grain) +
        times(7, (index) =>
          line(
            `M${657 + index * 33} ${519 + Math.sin(index) * 31}Q${672 + index * 22} 645 ${716 + index * 16} 727`,
            '#a88738',
            2.7,
            0.39,
          ),
        ) +
        wash('M667 533Q653 596 717 704Q676 590 708 504Z', '#f4df8e', 0.45) +
        branch('M733 739Q771 783 798 733', 12),
    ) +
    group(
      'citron-leaves',
      branch('M918 788Q1047 641 1167 577', 6) +
        leaf(1033, 663, 42, 1.15) +
        leaf(1094, 622, -14, 0.96) +
        leaf(969, 738, -50, 0.92),
    )
  )
}

function lingzhiStone() {
  const cap = (horizontal, vertical, scale, angle) =>
    transform(
      path(
        'M-124 1C-170 -42 -123 -101 -57 -99C-26 -139 43 -123 56 -86C131 -104 167 -43 113 -6Q58 37 9 17Q-54 46 -124 1Z',
        'url(#red)',
        1,
        grain,
      ) +
        line(
          'M-116 -15C-153 -51 -101 -82 -54 -75Q-12 -112 39 -64Q122 -88 125 -38Q84 8 16 -3Q-55 22 -116 -15',
          '#d4a16b',
          4,
          0.65,
        ) +
        line(
          'M-80 -22Q-67 -60 -17 -49Q17 -77 55 -42Q106 -53 84 -23Q45 2 13 -17Q-29 -3 -80 -22',
          '#be815a',
          3,
          0.8,
        ) +
        ellipse(-27, -43, 26, 13, '#6c3832', 0.7, grain),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'scholar-stone',
      path(
        'M431 838Q504 733 523 661L480 554L537 460L532 365L607 316L702 348L729 469L692 565L724 650L672 741L691 839Z',
        'url(#stone)',
        1,
        grain,
      ) +
        path(
          'M537 461L602 390L591 532L643 613L588 716L568 826L477 840L546 684L514 555Z',
          '#526e6a',
          0.65,
          grain,
        ) +
        path('M638 412Q688 399 691 457Q689 509 654 514Q621 475 638 412Z', '#374f50', 0.65, grain) +
        times(17, (index) =>
          brush(
            [
              [550 + (index % 4) * 27, 385 + index * 25],
              [531 + (index % 4) * 25, 407 + index * 25],
              [580 + (index % 4) * 17, 422 + index * 25],
              [553 + (index % 4) * 24, 444 + index * 25],
            ],
            5,
            '#c1bfa4',
            0.5,
          ),
        ),
    ) +
    group(
      'stems',
      branch('M788 820Q813 659 937 445Q966 393 976 337', 23) +
        branch('M847 699Q989 654 1094 535', 18) +
        branch('M809 759Q757 622 800 564', 17),
    ) +
    group('caps', cap(984, 351, 1.18, 8) + cap(1106, 541, 0.84, -11) + cap(802, 573, 0.65, 12)) +
    group(
      'moss-grass',
      times(19, (index) =>
        brush(
          [
            [415 + index * 32, 841],
            [442 + index * 31, 824],
            [419 + index * 34, 794],
            [448 + index * 32, 780 - (index % 3) * 20],
          ],
          8,
          '#717c4f',
          0.55,
        ),
      ),
    )
  )
}

function cricketGrass() {
  const seed = (horizontal, vertical, angle, scale) =>
    transform(
      line('M0 90L0 -52', '#77734d', 2.8) +
        times(15, (index) =>
          transform(
            ellipse(0, 0, 6, 17, index % 3 ? '#af975d' : '#877c4d', 0.9, grain),
            `translate(${Math.sin(index * 3.14) * 3 + (index % 2 ? -9 : 9)} ${-40 + index * 8}) rotate(${index % 2 ? -34 : 31})`,
          ),
        ),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'autumn-grasses',
      times(11, (index) => {
        const start = 335 + index * 57
        const headHorizontal = start + 30
        const headVertical = 270 + (index % 4) * 67
        const headAngle = -14 + (index % 5) * 8
        const radians = (headAngle * Math.PI) / 180
        const connection = [
          headHorizontal - Math.sin(radians) * 64,
          headVertical + Math.cos(radians) * 64,
        ]
        return (
          brush(
            [
              [start, 824],
              [start - 48, 660],
              [connection[0] - Math.sin(radians) * 100, connection[1] + Math.cos(radians) * 100],
              connection,
            ],
            9,
            index % 2 ? '#877948' : '#7a8854',
            0.8,
          ) +
          brush(
            [
              [start, 801],
              [start - 23, 671],
              [start - 121, 620],
              [start - 162, 607 + (index % 3) * 45],
            ],
            25,
            '#8b9156',
            0.7,
          ) +
          seed(headHorizontal, headVertical, headAngle, 0.8)
        )
      }),
    ) +
    group(
      'ground-stone',
      path(
        'M699 814Q781 747 952 738L1102 780L1190 853Q944 889 715 854Z',
        'url(#stone)',
        0.9,
        grain,
      ) + wash('M754 843Q928 777 1133 840L1067 864Z', '#405853', 0.3),
    ) +
    group(
      'cricket',
      transform(
        path('M-53 1Q-2 -28 96 -5L128 25Q20 63 -58 35Z', '#5c5b3b', 1, grain) +
          path('M-29 -10Q29 -14 109 9L82 33Q15 22 -29 -10Z', '#8b8350', 1, grain) +
          times(7, (index) =>
            line(`M${-10 + index * 11} -2L${32 + index * 9} 22`, '#383f32', 1.8, 0.7),
          ) +
          path('M-65 -13Q-106 -17 -107 18Q-102 49 -62 41L-41 18Z', '#3a4131', 1, grain) +
          ellipse(-93, 9, 6, 6, '#202c28') +
          line('M-101 -5Q-159 -77 -231 -85M-103 3Q-182 -15 -247 16', '#555b3d', 2.4) +
          line(
            'M42 22L-16 -54L76 -78L107 -58M43 25L99 77L39 111L10 109M-49 30L-72 72L-129 88M-30 30L-3 81L-35 103M-19 27L13 55L-27 80M17 28L52 49L80 71',
            '#535a37',
            5,
          ) +
          line('M44 23L-15 -53L75 -77', '#9c965b', 2) +
          line('M100 12L139 3M110 25L150 26', '#4e5133', 2),
        'translate(947 727) rotate(-9) scale(1.1)',
      ),
    )
  )
}

function dragonfly(horizontal, vertical, scale, angle) {
  return transform(
    times(4, (index) =>
      transform(
        path('M0 0Q-72 -71 -157 -41Q-187 -21 -149 -8Q-72 9 0 0Z', '#d7ded2', 0.83, grain) +
          line('M-7 -3Q-74 -35 -157 -28M-59 -20L-98 -5M-89 -27L-128 -12', '#879e9a', 1.3, 0.65),
        `rotate(${[-14, 31, 163, 206][index]})`,
      ),
    ) +
      line('M0 -24Q0 27 13 134', '#785c3f', 8) +
      times(8, (index) =>
        line(
          `M${index * 0.9 - 3} ${31 + index * 12}L${index * 0.9 + 7} ${31 + index * 12}`,
          '#b49455',
          2,
        ),
      ) +
      ellipse(0, -6, 11, 17, '#6b704a') +
      ellipse(-8, -25, 8, 7, '#696a46') +
      ellipse(7, -25, 8, 7, '#696a46'),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function daylilies() {
  const bloom = (horizontal, vertical, scale, angle) =>
    transform(
      times(6, (index) =>
        transform(
          path(
            'M0 22C-28 -11 -43 -78 -4 -120Q18 -85 36 -61Q23 -15 0 22Z',
            'url(#yellow)',
            1,
            grain,
          ) + line('M0 10Q-5 -50 -4 -104', '#b57440', 2, 0.5),
          `rotate(${index * 60 + (index % 2 ? 7 : 0)})`,
        ),
      ) +
        times(
          6,
          (index) =>
            line(
              `M0 0Q${-15 + index * 6} -27 ${-35 + index * 13} ${-53 + (index % 2) * 18}`,
              '#b78149',
              2,
            ) + ellipse(-35 + index * 13, -53 + (index % 2) * 18, 4.5, 3, '#805d39'),
        ),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'arching-leaves',
      times(13, (index) =>
        brush(
          [
            [775 + (index % 3) * 19, 843],
            [591 + index * 25, 672],
            [384 + index * 52, 421],
            [308 + index * 77, 510 + Math.sin(index * 1.8) * 181],
          ],
          28 + (index % 3) * 9,
          index % 2 ? '#738455' : '#92985d',
          0.9,
        ),
      ),
    ) +
    group(
      'flower-stems',
      branch('M784 836Q863 584 773 342', 7) +
        branch('M808 837Q963 687 1055 471', 6) +
        branch('M776 824Q665 623 589 563', 6),
    ) +
    group(
      'lily-blossoms',
      bloom(773, 342, 1.1, 17) +
        bloom(1057, 472, 0.85, -21) +
        bloom(587, 564, 0.8, 51) +
        transform(
          path('M0 0Q-29 -60 1 -110Q47 -69 0 0Z', 'url(#yellow)', 1, grain),
          'translate(874 492) rotate(23)',
        ),
    ) +
    group('dragonfly', dragonfly(1138, 245, 0.7, 37))
  )
}

function kingfisher() {
  return (
    group(
      'reeds',
      times(
        9,
        (index) =>
          brush(
            [
              [429 + index * 93, 833],
              [400 + index * 97, 643],
              [448 + index * 91, 397],
              [470 + index * 88, 288 + (index % 3) * 97],
            ],
            5,
            '#777e50',
            0.7,
          ) +
          brush(
            [
              [431 + index * 93, 810],
              [402 + index * 92, 707],
              [337 + index * 100, 669],
              [275 + index * 107, 690 - (index % 4) * 34],
            ],
            23,
            '#87915e',
            0.65,
          ),
      ) + branch('M474 754Q713 650 1120 544', 14),
    ) +
    group(
      'perched-bird',
      transform(
        path('M-4 126L-69 211L-39 222L29 141Z', '#325a6a', 1, grain) +
          path('M-74 15Q-101 109 -32 149Q37 180 75 114Q91 49 51 10Z', '#b97944', 1, grain) +
          path('M-59 -4Q-106 45 -59 119Q-1 149 40 101Q29 40 10 -3Z', 'url(#bird-blue)', 1, grain) +
          path('M-48 18Q-81 59 -36 122Q14 113 26 82Q4 33 -48 18Z', '#3e717a', 1, grain) +
          times(14, (index) =>
            ellipse(
              -45 + (index % 4) * 13,
              27 + Math.floor(index / 4) * 21,
              3,
              6,
              '#8cc0b0',
              0.7,
              grain,
            ),
          ) +
          path('M-30 -27Q10 -43 61 -12L60 43Q23 63 -17 31Z', 'url(#bird-blue)', 1, grain) +
          path(
            'M-23 -14Q-52 -65 -13 -94Q40 -131 86 -87Q107 -43 67 -8Q18 12 -23 -14Z',
            'url(#bird-blue)',
            1,
            grain,
          ) +
          path('M-2 -22Q30 -38 53 -12L35 12L9 -3Z', '#e1d7bb', 1, grain) +
          path('M67 -61L186 -52L76 -40Z', '#354447', 1, grain) +
          line('M80 -51L174 -52', '#b1b7a3', 1.4, 0.7) +
          path('M38 -67Q56 -77 72 -62L63 -46L40 -49Z', '#30483e', 1, grain) +
          ellipse(57, -61, 6, 6, '#192e2d') +
          ellipse(59, -63, 1.8, 1.8, '#e9ddba') +
          times(10, (index) =>
            ellipse(-14 + index * 9, -84 + Math.sin(index * 1.3) * 6, 2.3, 3, '#a5ccc1', 0.8),
          ) +
          line(
            'M-18 144L-23 167L-42 176M-23 167L-5 172M30 142L34 156L16 163M34 156L48 162',
            '#a36143',
            4,
          ),
        'translate(846 350) rotate(-12) scale(1.55)',
      ),
    ) +
    group(
      'water-ripples',
      times(8, (index) =>
        line(
          `M${356 + index * 85} ${831 + (index % 3) * 26}q60 -9 ${91 + (index % 3) * 22} -3`,
          '#728e86',
          2,
          0.3,
        ),
      ),
    )
  )
}

function lacquerBox() {
  const slice = (top, bottom) =>
    path(
      `M529 ${top}Q791 ${top + 51} 1055 ${top - 8}L1055 ${bottom}Q790 ${bottom + 64} 529 ${bottom + 8}Z`,
      'url(#red)',
      1,
      grain,
    ) +
    path(
      `M1055 ${top - 8}L1140 ${top - 72}L1140 ${bottom - 64}L1055 ${bottom}Z`,
      '#693b36',
      1,
      grain,
    ) +
    line(`M540 ${bottom - 2}Q792 ${bottom + 51} 1053 ${bottom - 10}`, '#c39b58', 4, 0.8)
  return (
    group(
      'handle-back',
      path(
        'M1048 767L1062 286Q1062 201 956 196L677 206L677 229L956 221Q1038 223 1037 291L1024 775Z',
        'url(#wood)',
        1,
        grain,
      ),
    ) +
    group(
      'stacked-lacquer',
      slice(396, 513) +
        slice(519, 639) +
        slice(645, 767) +
        path(
          'M517 378L603 312Q862 349 1147 300L1147 326L1064 395Q802 454 517 404Z',
          '#864336',
          1,
          grain,
        ) +
        path('M517 378L603 312Q862 349 1147 300L1064 370Q802 427 517 378Z', '#ba6b50', 1, grain) +
        line('M531 385Q787 432 1058 380L1131 322', '#d2a26b', 3, 0.85),
    ) +
    group(
      'floral-inlay',
      times(3, (index) =>
        transform(
          branch('M0 20Q34 -31 105 -14', 2) +
            times(4, (petal) =>
              leaf(petal * 25 + 13, 2 - petal * 4, petal % 2 ? 53 : -45, 0.16, '#c5a56d'),
            ) +
            flower(62, -14, 0.21, 14, '#cdb37a'),
          `translate(720 ${457 + index * 124})`,
        ),
      ),
    ) +
    group(
      'handle-front',
      path(
        'M538 802L517 301Q515 234 577 215L677 206L681 232L586 240Q543 252 545 306L564 801Z',
        'url(#wood)',
        1,
        grain,
      ) +
        line('M532 304L551 788', '#cfb37f', 3, 0.55) +
        path('M672 195Q820 184 914 189L915 227L676 237Z', 'url(#wood)', 1, grain) +
        ellipse(551, 740, 6, 7, '#bda36d') +
        ellipse(1040, 717, 6, 7, '#bda36d'),
    )
  )
}

function silkPouch() {
  return (
    group(
      'back-cord',
      line('M642 397Q502 259 674 202Q824 159 963 247Q1011 279 947 371', '#9f6c45', 9) +
        line('M642 397Q502 259 674 202Q824 159 963 247Q1011 279 947 371', '#d2ac71', 2.2, 0.75),
    ) +
    group(
      'silk-bag',
      path(
        'M562 391Q762 463 1005 387L1055 653Q1041 764 818 800Q618 787 548 682Z',
        'url(#silk)',
        1,
        grain,
      ) +
        path('M562 391Q666 436 770 433L696 766Q581 745 548 682Z', '#8092ad', 0.32, grain) +
        path('M951 417L1005 387L1055 653Q1041 764 818 800L943 715Z', '#2f465d', 0.45, grain) +
        times(12, (index) =>
          line(
            `M${585 + index * 35} ${420 + Math.sin(index) * 5}Q${594 + index * 33} 467 ${583 + index * 38} ${532 + (index % 4) * 29}`,
            '#a8adbb',
            2,
            0.35,
          ),
        ),
    ) +
    group(
      'embroidered-peony',
      transform(
        times(3, (ring) =>
          times(7 + ring * 2, (index) =>
            transform(
              path(
                'M0 -12C-38 -36 -29 -84 2 -96Q34 -77 25 -47Q14 -23 0 -12Z',
                ['#d6b9a7', '#c59494', '#ae798c'][ring],
                1,
                grain,
              ),
              `rotate(${(index * 360) / (7 + ring * 2)}) scale(${1.14 - ring * 0.27})`,
            ),
          ),
        ) + ellipse(0, 0, 17, 13, '#d0b06d', 1, grain),
        'translate(795 606) scale(1.18)',
      ) +
        leaf(731, 690, -38, 0.52, '#9eb39c') +
        leaf(865, 680, 62, 0.5, '#7eaa9a'),
      'clip-path="url(#silk-body)"',
    ) +
    group(
      'gathered-neck',
      path('M562 391L572 355Q771 400 995 350L1005 387Q785 451 562 391Z', '#9d714e', 1, grain) +
        times(18, (index) =>
          line(`M${577 + index * 23} ${363 + Math.sin(index / 6) * 20}l-2 27`, '#ddbc80', 3, 0.7),
        ) +
        line('M574 385Q775 426 996 376', '#dcba76', 6),
    ) +
    group(
      'knots-tassels',
      line(
        'M827 410C730 345 749 324 798 341C828 355 840 382 839 408C890 328 956 329 926 374Q903 399 839 408L904 801M839 408L806 844',
        '#ca9d60',
        7,
      ) +
        ellipse(807, 833, 12, 15, '#a4744d') +
        ellipse(905, 790, 12, 15, '#a4744d') +
        times(17, (index) =>
          line(
            `M${796 + index * 1.4} 847Q${794 + index * 1.6} 887 ${784 + index * 2} ${937 + Math.sin(index * 1.4) * 7}`,
            '#b78e57',
            2.3,
          ),
        ) +
        times(17, (index) =>
          line(
            `M${894 + index * 1.4} 804Q${899 + index * 1.5} 842 ${899 + index * 1.8} ${880 + Math.sin(index * 1.6) * 7}`,
            '#b78e57',
            2.3,
          ),
        ),
    )
  )
}

function celadonEwer() {
  return (
    group(
      'warming-bowl',
      path('M490 637Q773 708 1076 637Q1052 828 807 868Q561 852 490 637Z', 'url(#jade)', 1, grain) +
        ellipse(783, 637, 293, 81, '#c3d4bd', 1, grain) +
        ellipse(783, 637, 261, 59, '#6c9b90', 1, grain),
    ) +
    group(
      'handle-back',
      path(
        'M855 378C1111 275 1175 606 947 659L931 611C1117 559 1066 365 859 422Z',
        'url(#jade)',
        1,
        grain,
      ),
    ) +
    group(
      'ewer-body',
      path(
        'M693 364L696 435C554 490 593 722 752 756Q896 782 954 668C994 565 934 470 866 436L866 364Z',
        'url(#jade)',
        1,
        grain,
      ) +
        path(
          'M661 484Q577 481 570 407L519 340L488 354Q507 407 508 458Q519 557 621 579Z',
          'url(#jade)',
          1,
          grain,
        ) +
        ellipse(504, 346, 21, 9, '#6a9188', 1, grain) +
        wash('M704 460Q652 553 698 686Q644 633 654 536Z', '#e1e7cc', 0.5) +
        path('M878 455Q953 491 957 602Q951 691 883 727Q946 615 884 510Z', '#5d8f85', 0.45, grain) +
        times(7, (index) =>
          line(
            `M${686 + index * 27} 473Q${632 + index * 40} 613 ${713 + index * 18} 729`,
            '#608f85',
            2,
            0.3,
          ),
        ),
    ) +
    group(
      'lid-neck',
      ellipse(782, 363, 88, 22, '#b5cbb3', 1, grain) +
        path('M685 352Q701 302 783 301Q860 301 877 352Q790 385 685 352Z', 'url(#jade)', 1, grain) +
        ellipse(782, 305, 18, 14, '#abc4af', 1, grain) +
        ellipse(782, 294, 10, 9, '#cdd9bf', 1, grain),
    ) +
    group(
      'cup-saucer',
      ellipse(1196, 782, 157, 30, '#648e87', 0.2) +
        path(
          'M1046 758Q1194 794 1347 758Q1328 809 1199 821Q1080 811 1046 758Z',
          'url(#jade)',
          1,
          grain,
        ) +
        ellipse(1196, 757, 149, 33, '#c5d4bd', 1, grain) +
        path('M1119 652Q1201 680 1280 652L1265 737Q1206 789 1136 738Z', 'url(#jade)', 1, grain) +
        ellipse(1199, 653, 81, 25, '#d9e0c8', 1, grain) +
        ellipse(1199, 654, 64, 16, '#896c42', 0.85, grain),
    )
  )
}

function foldingFan() {
  const center = [843, 803]
  const rim = (fraction) => {
    const start = [345, 428],
      control = [790, -11],
      end = [1267, 406]
    return [0, 1].map(
      (axis) =>
        (1 - fraction) ** 2 * start[axis] +
        2 * fraction * (1 - fraction) * control[axis] +
        fraction ** 2 * end[axis],
    )
  }
  return (
    group(
      'fan-ribs-back',
      times(15, (index) => {
        const target = rim(index / 14)
        return line(`M${center}L${target}`, '#816743', 8, 0.9)
      }),
    ) +
    group(
      'paper-face',
      path('M345 428Q790 -11 1267 406L1021 636Q821 461 634 645Z', '#e6d9b7', 1, grain),
    ) +
    group(
      'painted-landscape',
      wash('M404 493L568 307L669 418L794 273L952 406L1137 332L1224 484L901 559Z', '#869c99', 0.38) +
        path('M602 583L730 434L807 470L912 351L1011 459L1059 554L845 658Z', '#6d8580', 0.6, grain) +
        path('M731 565L798 484L845 535L913 415L961 453L937 580L854 641Z', '#49675f', 0.67, grain) +
        times(12, (index) =>
          brush(
            [
              [738 + index * 16, 511 + (index % 4) * 19],
              [729 + index * 16, 542 + (index % 4) * 19],
              [748 + index * 15, 550 + (index % 4) * 19],
              [726 + index * 16, 574 + (index % 4) * 19],
            ],
            5,
            '#b2b899',
            0.5,
          ),
        ) +
        branch('M467 546Q512 413 498 369', 11) +
        times(10, (index) =>
          transform(
            times(7, (needle) =>
              line(
                `M0 0l${Math.cos(needle * 0.7) * 25} ${Math.sin(needle * 0.7) * 12}`,
                '#4e6653',
                3,
                0.8,
              ),
            ),
            `translate(${474 + (index % 3) * 19} ${391 + Math.floor(index / 3) * 25})`,
          ),
        ),
      'clip-path="url(#fan-face)"',
    ) +
    group(
      'paper-folds',
      times(15, (index) => {
        const target = rim(index / 14)
        return line(`M${center}L${target}`, index % 2 ? '#b7aa85' : '#f0e5c8', 2, 0.5)
      }),
      'clip-path="url(#fan-face)"',
    ) +
    group(
      'guard-sticks',
      line('M342 425L862 817M1269 404L827 819', '#826747', 15) +
        line('M346 428L857 812M1266 407L832 814', '#c6a16a', 3, 0.7) +
        ellipse(843, 803, 9, 8, '#665844') +
        line('M844 815Q874 851 852 894', '#a77b4b', 5) +
        times(16, (index) =>
          line(
            `M${843 + index * 1.1} 889Q${833 + index * 1.6} 919 ${835 + index * 1.5} ${955 + Math.sin(index) * 6}`,
            '#9b764c',
            2,
          ),
        ),
    )
  )
}

function bridgeBoat() {
  const bridge = 'M422 651Q836 192 1300 615L1300 727L1185 755Q833 323 527 782L422 757Z'
  const hull = 'M322 746Q535 798 803 730L850 710Q780 819 575 838Q382 831 322 746Z'
  return (
    group(
      'distant-shore',
      wash('M254 628Q506 515 724 567Q1059 480 1390 577L1382 635Q882 584 310 700Z', '#87998b', 0.23),
    ) +
    group(
      'stone-bridge',
      path(bridge, 'url(#stone)', 1, grain) +
        path('M422 651Q836 192 1300 615L1319 588Q843 167 405 625Z', '#bdbea8', 1, grain) +
        line('M529 773Q832 325 1187 747', '#455f5e', 7, 0.65) +
        times(17, (index) => {
          const fraction = index / 16
          const horizontal = 434 + fraction * 854
          const vertical =
            (1 - fraction) ** 2 * 642 + 2 * fraction * (1 - fraction) * 192 + fraction ** 2 * 615
          return (
            line(`M${horizontal} ${vertical}l0 -58`, '#7a8f82', 11) +
            ellipse(horizontal, vertical - 62, 8, 6, '#a5ad99', 1, grain)
          )
        }) +
        line('M434 584Q848 134 1288 557', '#869b8e', 7) +
        times(17, (index) => {
          const fraction = (index + 0.4) / 17
          const horizontal = 448 + fraction * 821
          const vertical =
            (1 - fraction) ** 2 * 672 + 2 * fraction * (1 - fraction) * 229 + fraction ** 2 * 646
          return line(`M${horizontal} ${vertical}l${-22 + fraction * 44} 25`, '#5d7671', 2, 0.5)
        }),
    ) +
    group(
      'banks',
      path('M266 738Q356 696 452 720L537 800Q402 843 220 817Z', '#8b9676', 0.78, grain) +
        path('M1194 721Q1348 655 1450 748L1462 795L1259 821Z', '#7b8e75', 0.85, grain),
    ) +
    group(
      'black-awning-boat',
      path(hull, 'url(#wood)', 1, grain) +
        path(
          'M417 758Q417 602 515 595L648 582Q715 592 754 750Q584 789 417 758Z',
          '#424f50',
          1,
          grain,
        ) +
        path('M417 758Q417 602 515 595Q598 610 617 770Z', '#617474', 1, grain) +
        path('M442 754Q446 630 514 623Q570 632 588 773Z', '#263d3e', 1, grain) +
        times(6, (index) =>
          line(
            `M${531 + index * 22} ${596 - index * 2}Q${588 + index * 24} 640 ${616 + index * 25} ${768 - index * 3}`,
            '#93a297',
            2.4,
            0.55,
          ),
        ) +
        line('M326 747Q540 796 802 731L842 715', '#c7ae7a', 5) +
        line('M763 751L1029 648', '#715e42', 9) +
        path('M984 651L1068 619Q1093 617 1080 633L1004 671Z', '#7c6546', 1, grain),
    ) +
    group(
      'ripples',
      times(13, (index) =>
        line(
          `M${314 + index * 67} ${848 + (index % 3) * 24}q${23 + (index % 4) * 15} -6 ${58 + (index % 3) * 28} -2`,
          '#6e8e86',
          2,
          0.35,
        ),
      ),
    )
  )
}

function raftCreek() {
  return (
    group(
      'far-peaks',
      wash(
        'M229 659L360 468L436 550L599 317L686 476L803 368L994 565L1108 479L1369 683L1199 720L340 735Z',
        '#849ba1',
        0.27,
      ) +
        path('M269 715L447 503L534 585L661 445L801 612L925 527L1103 708Z', '#6b8b80', 0.39, grain),
    ) +
    group(
      'near-shore',
      path(
        'M1093 772L1122 624L1210 560L1271 615L1310 725L1414 777L1400 834L1195 835Z',
        'url(#stone)',
        1,
        grain,
      ) +
        path('M1125 650L1210 561L1178 691L1210 763L1142 811Z', '#4f7067', 0.75, grain) +
        times(11, (index) =>
          brush(
            [
              [1180 + (index % 3) * 27, 649 + index * 12],
              [1190 + (index % 3) * 24, 663 + index * 12],
              [1173 + (index % 3) * 24, 682 + index * 12],
              [1194 + (index % 3) * 25, 697 + index * 12],
            ],
            5,
            '#a5b092',
            0.6,
          ),
        ),
    ) +
    group(
      'bamboo-raft',
      times(8, (index) => {
        const horizontal = 400 + index * 12
        const vertical = 750 + index * 15
        return (
          line(`M${horizontal} ${vertical}L${horizontal + 490} ${vertical - 148}`, '#927b47', 23) +
          line(
            `M${horizontal - 2} ${vertical - 4}L${horizontal + 489} ${vertical - 152}`,
            '#c1ad6e',
            8,
            0.7,
          ) +
          times(9, (joint) =>
            line(
              `M${horizontal + joint * 55 - 3} ${vertical - joint * 16.6 - 9}l6 15`,
              '#68714b',
              3,
              0.8,
            ),
          )
        )
      }) +
        line('M523 713L607 818M792 632L876 737', '#645b3d', 9) +
        line('M526 711L610 816M795 630L879 735', '#cfb778', 2),
    ) +
    group(
      'cargo-pole',
      path('M594 690L597 591Q648 552 714 564L733 655Q674 698 594 690Z', 'url(#wood)', 1, grain) +
        ellipse(653, 580, 59, 21, '#d0b887', 1, grain) +
        ellipse(653, 580, 45, 13, '#806a45', 1, grain) +
        times(12, (index) =>
          line(
            `M${601 + index * 10} ${600 - Math.sin(index * 0.29) * 13}l9 66`,
            '#d2b87a',
            2,
            0.55,
          ),
        ) +
        line('M406 663L1071 472', '#6c6341', 12) +
        line('M407 660L1070 469', '#b5a16b', 3),
    ) +
    group(
      'bamboo-grove',
      times(
        4,
        (index) =>
          line(
            `M${1282 + index * 22} 755Q${1292 + index * 21} 518 ${1249 + index * 33} ${289 + (index % 2) * 59}`,
            '#586d4e',
            8,
          ) +
          times(5, (node) => {
            const horizontal = 1263 + index * 25 + Math.sin(node) * 12,
              vertical = 356 + node * 68
            return (
              branch(
                `M${horizontal} ${vertical}q${node % 2 ? 58 : -55} -21 ${node % 2 ? 82 : -84} -39`,
                3,
              ) +
              times(5, (blade) =>
                leaf(
                  horizontal + (node % 2 ? 1 : -1) * blade * 17,
                  vertical - blade * 8,
                  -74 + blade * 39 + index * 7,
                  0.28 + (blade % 3) * 0.06,
                  '#5d7952',
                ),
              )
            )
          }),
      ),
    ) +
    group(
      'water-lines',
      times(13, (index) =>
        line(`M${266 + index * 66} ${876 + (index % 3) * 21}q53 -8 106 -5`, '#668f8c', 2, 0.3),
      ),
    )
  )
}

const studies = [
  {
    id: 'crabapple-sparrow',
    name: '海棠春雀',
    category: 'figures',
    theme: '春花 / 栗羽与胭脂',
    note: '斜枝海棠承接一只停栖麻雀，花叶、脚趾与枝干有实际附着。',
    draw: crabapple,
  },
  {
    id: 'finger-citron-dish',
    name: '佛手清供',
    category: 'color',
    theme: '佛手 / 金黄与青釉',
    note: '果体连续分出卷曲指状裂瓣，以黄赭转面和青瓷浅盘体现清供。',
    draw: fingerCitron,
  },
  {
    id: 'lingzhi-scholar-stone',
    name: '灵芝寿石',
    category: 'ink',
    theme: '寿石 / 赭红与青灰',
    note: '灵芝菌盖与柄连续生长，层纹随盖曲面；怪石有转面与凹处。',
    draw: lingzhiStone,
  },
  {
    id: 'cricket-autumn-grass',
    name: '蟋蟀秋草',
    category: 'figures',
    theme: '秋虫 / 草穗与石隙',
    note: '长触须、折叠后腿和翅脉区分蟋蟀，秋草长短浓淡有别。',
    draw: cricketGrass,
  },
  {
    id: 'daylily-dragonfly',
    name: '萱草蜻蜓',
    category: 'color',
    theme: '萱草 / 金瓣与透明翅',
    note: '六瓣萱花和弧形带叶错落，蜻蜓胸腹与两对翅相接。',
    draw: daylilies,
  },
  {
    id: 'kingfisher-reeds',
    name: '秋浦翠鸟',
    category: 'figures',
    theme: '翠鸟 / 石青与橙赭',
    note: '长尖喙、短颈和紧实躯干体现翠鸟，脚趾扣住斜枝，翅背点翠。',
    draw: kingfisher,
  },
  {
    id: 'lacquer-carry-box',
    name: '朱漆提盒',
    category: 'color',
    theme: '食盒 / 朱漆与竹木',
    note: '三层盒体和盖沿共用方向，前后提架落到盒侧，不以花纹代替器形。',
    draw: lacquerBox,
  },
  {
    id: 'embroidered-silk-pouch',
    name: '绣囊丝结',
    category: 'color',
    theme: '香囊 / 靛绢与藕粉',
    note: '绣花附着囊面，褶口束绳、盘结与两束参差流苏连续连接。',
    draw: silkPouch,
  },
  {
    id: 'celadon-ewer-bowl',
    name: '青瓷注碗',
    category: 'color',
    theme: '注子 / 青釉与茶色',
    note: '注子置温碗内，以釉色、曲柄、流口与茶盏表现器物关系，非特定出土器复原。',
    draw: celadonEwer,
  },
  {
    id: 'landscape-folding-fan',
    name: '折扇清风',
    category: 'color',
    theme: '折扇 / 墨山与竹骨',
    note: '同一扇钉汇聚扇骨，扇面山水限制在折纸边界内，竹护骨和穗结相承。',
    draw: foldingFan,
  },
  {
    id: 'awning-boat-stone-bridge',
    name: '乌篷桥影',
    category: 'ink',
    theme: '水乡 / 石拱与乌篷',
    note: '石桥拱圈和栏杆同弧，桥脚落岸，深色船篷与木船身共同接水。',
    draw: bridgeBoat,
  },
  {
    id: 'bamboo-raft-creek',
    name: '竹筏青溪',
    category: 'ink',
    theme: '溪行 / 竹筏与青山',
    note: '成束竹竿、横扎绳、篓与长篙组成近筏，青峰和岸竹分出远近。',
    draw: raftCreek,
  },
]

mkdirSync(destination, { recursive: true })
for (const study of studies) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}原创代码彩墨意象，非文物、古迹或技术复原。透明背景。</desc>${definitions}${study.draw()}</svg>`
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
console.log('Generated twelve literati ink studies')
