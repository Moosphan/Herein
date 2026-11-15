import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/civilization-studies/ink-wash',
)
const ink = '#363e3a'
const texture = 'filter="url(#pigment)"'
const rounded = (value) => Math.round(value * 100) / 100
const times = (count, callback) =>
  Array.from({ length: count }, (_, index) => callback(index)).join('')
const path = (shape, color = ink, opacity = 1, extra = '') =>
  `<path d="${shape}" fill="${color}" opacity="${opacity}" ${extra}/>`
const line = (shape, color = ink, width = 2, opacity = 1) =>
  `<path d="${shape}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1, extra = '') =>
  `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${color}" opacity="${opacity}" ${extra}/>`
const group = (identity, content, extra = '') => `<g id="${identity}" ${extra}>${content}</g>`
const transform = (content, attributes) => `<g transform="${attributes}">${content}</g>`
const wash = (shape, color, opacity = 0.2) => path(shape, color, opacity, 'filter="url(#soft)"')

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
  for (let step = 0; step <= 36; step++) {
    const fraction = step / 36
    const center = curve(fraction)
    const before = curve(Math.max(0, fraction - 0.002))
    const after = curve(Math.min(1, fraction + 0.002))
    const distance = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
    const normal = [-(after[1] - before[1]) / distance, (after[0] - before[0]) / distance]
    const breadth = (width * (0.3 + 0.7 * Math.sin(Math.PI * fraction)) * (1 - fraction * 0.86)) / 2
    left.push(center.map((value, axis) => rounded(value + normal[axis] * breadth)))
    right.unshift(center.map((value, axis) => rounded(value - normal[axis] * breadth)))
  }
  return path(
    'M' + [...left, ...right].map((point) => point.join(' ')).join('L') + 'Z',
    color,
    opacity,
    texture,
  )
}

const definitions = `<defs>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="pigment" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".46" numOctaves="2" seed="137" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .24 0 0 0 .76" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="pigmented"/><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="43" result="edge"/><feDisplacementMap in="pigmented" in2="edge" scale="2.8" xChannelSelector="R" yChannelSelector="G"/></filter>
<linearGradient id="wood" x2="90%" y2="65%"><stop stop-color="#a17b54"/><stop offset=".45" stop-color="#876348"/><stop offset="1" stop-color="#544334"/></linearGradient>
<linearGradient id="stone" x2="85%" y2="100%"><stop stop-color="#b1b39d"/><stop offset=".38" stop-color="#8f9a8b"/><stop offset="1" stop-color="#586f68"/></linearGradient>
<linearGradient id="paper" x2="70%" y2="100%"><stop stop-color="#e8dabc"/><stop offset=".6" stop-color="#d3c39f"/><stop offset="1" stop-color="#b1a07a"/></linearGradient>
<radialGradient id="grape" cx="30%" cy="25%" r="85%"><stop stop-color="#aaa0b5"/><stop offset=".36" stop-color="#887493"/><stop offset="1" stop-color="#554c70"/></radialGradient>
<radialGradient id="fur" cx="30%" cy="30%" r="90%"><stop stop-color="#b7936c"/><stop offset=".6" stop-color="#8b6b53"/><stop offset="1" stop-color="#604d40"/></radialGradient>
<linearGradient id="silk" x2="95%" y2="100%"><stop stop-color="#a96b65"/><stop offset=".35" stop-color="#c68b7c"/><stop offset="1" stop-color="#9e5e61"/></linearGradient>
<radialGradient id="lantern" cx="38%" cy="44%" r="75%"><stop stop-color="#ead394"/><stop offset=".45" stop-color="#d5ac69"/><stop offset="1" stop-color="#b77b4b"/></radialGradient>
<linearGradient id="peacock" x2="100%" y2="55%"><stop stop-color="#487d93"/><stop offset=".4" stop-color="#316f80"/><stop offset="1" stop-color="#304c6b"/></linearGradient>
<linearGradient id="tail" x2="90%" y2="80%"><stop stop-color="#5c8b7e"/><stop offset=".5" stop-color="#57775b"/><stop offset="1" stop-color="#83794f"/></linearGradient>
<linearGradient id="tile" x2="40%" y2="100%"><stop stop-color="#9aa49d"/><stop offset=".45" stop-color="#727f7c"/><stop offset="1" stop-color="#465756"/></linearGradient>
<radialGradient id="petal"><stop stop-color="#dfb4a4"/><stop offset=".55" stop-color="#c78983"/><stop offset="1" stop-color="#a96168"/></radialGradient>
</defs>`

function grain(horizontal, vertical, count, spread, color = '#d4b272') {
  return times(count, (index) =>
    ellipse(
      horizontal + Math.sin(index * 2.399) * spread * Math.sqrt(index / count),
      vertical + Math.cos(index * 2.399) * spread * 0.3 * Math.sqrt(index / count),
      3.7,
      1.8,
      color,
      0.8,
      `transform="rotate(${index * 29} ${horizontal + Math.sin(index * 2.399) * spread * Math.sqrt(index / count)} ${vertical + Math.cos(index * 2.399) * spread * 0.3 * Math.sqrt(index / count)})"`,
    ),
  )
}

function wheat(horizontal, vertical, angle, scale = 1) {
  return transform(
    brush(
      [
        [0, 30],
        [8, -59],
        [7, -177],
        [0, -247],
      ],
      5,
      '#b08e4f',
    ) +
      times(9, (index) => {
        const height = -75 - index * 18
        return (
          path(
            `M1 ${height + 19}Q-35 ${height + 5} -29 ${height - 19}Q-5 ${height - 18} 1 ${height + 19}ZM4 ${height + 10}Q37 ${height - 8} 24 ${height - 31}Q6 ${height - 25} 4 ${height + 10}Z`,
            index % 3 ? '#c6a361' : '#b29254',
            0.95,
            texture,
          ) +
          line(
            `M-19 ${height - 5}L-37 ${height - 43}M19 ${height - 13}L34 ${height - 55}`,
            '#b39559',
            1.3,
            0.65,
          )
        )
      }),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function mill() {
  return (
    group('ground', wash('M308 830Q702 732 1115 810L1265 872Q903 929 388 889Z', '#7c8069', 0.17)) +
    group(
      'wheat-sheaf',
      wheat(1066, 835, -19, 1.7) +
        wheat(1055, 849, 12, 1.55) +
        wheat(1104, 851, 33, 1.32) +
        brush(
          [
            [1071, 864],
            [1029, 818],
            [1032, 756],
            [1057, 690],
          ],
          11,
          '#8a7953',
        ) +
        line('M1032 797Q1064 785 1103 805M1031 808Q1066 793 1108 818', '#6e6546', 5),
    ) +
    group(
      'lower-stone',
      path('M415 630Q705 580 969 638L967 760Q705 859 421 755Z', 'url(#stone)', 1, texture) +
        ellipse(692, 633, 278, 94, '#a3ac99', 1, texture) +
        times(21, (index) =>
          line(
            `M${441 + index * 23} ${695 + Math.sin((index / 20) * Math.PI) * 52}l-2 35`,
            '#566e64',
            2,
            0.33,
          ),
        ) +
        path('M904 729L1023 757L989 792L891 765Z', '#8d9988') +
        path('M914 738L1009 760L984 775L909 754Z', '#566b61'),
    ) +
    group(
      'upper-stone',
      path('M450 542Q700 467 938 546L938 634Q712 729 448 627Z', '#6c8177', 1, texture) +
        ellipse(693, 541, 246, 92, 'url(#stone)', 1, texture) +
        times(62, (index) => {
          const angle = index * 2.399
          const radius = Math.sqrt((index + 1) / 63)
          const horizontal = 693 + Math.cos(angle) * radius * 225
          const vertical = 541 + Math.sin(angle) * radius * 80
          return path(
            `M${horizontal} ${vertical}l6 -1l3 2l-6 2Z`,
            index % 3 ? '#d2cfb0' : '#425d57',
            0.17,
            texture,
          )
        }) +
        ellipse(693, 535, 38, 16, '#4b5b50') +
        ellipse(692, 538, 26, 8, '#303f39') +
        times(15, (index) => {
          const angle = (index * Math.PI * 2) / 15
          return line(
            `M${693 + Math.cos(angle) * 59} ${541 + Math.sin(angle) * 22}Q${693 + Math.cos(angle + 0.09) * 150} ${541 + Math.sin(angle + 0.09) * 55} ${693 + Math.cos(angle + 0.16) * 229} ${541 + Math.sin(angle + 0.16) * 84}`,
            '#526b62',
            2.2,
            0.46,
          )
        }) +
        path('M846 531L855 432Q866 425 877 434L873 538Z', 'url(#wood)') +
        ellipse(864, 432, 10, 5, '#c1a27b'),
    ) +
    group(
      'grain-bag',
      path(
        'M317 676Q353 650 416 681L449 806Q428 863 333 840Q293 820 317 676Z',
        '#b9a77e',
        1,
        texture,
      ) +
        ellipse(367, 680, 50, 17, '#776d4e') +
        grain(369, 678, 48, 41) +
        brush(
          [
            [332, 707],
            [315, 756],
            [324, 795],
            [340, 815],
          ],
          8,
          '#8e8668',
          0.55,
        ) +
        grain(934, 825, 55, 90, '#c9b17a'),
    )
  )
}

function printing() {
  const glyphs = times(7, (column) =>
    times(7, (row) => {
      const horizontal = 27 + column * 49
      const vertical = 27 + row * 41
      return transform(
        line(
          'M-10 -10L12 -10M-13 0L13 0M0 -14L0 13M-10 13L10 13',
          column % 2 ? '#b6a47e' : '#aa9b78',
          2.4,
          0.75,
        ) +
          (row % 2
            ? line('M-10 -10L-10 9M10 -6L10 13', '#c0b08a', 2, 0.65)
            : line('M-11 7L9 -5M-7 -14L4 -4', '#beac84', 2, 0.65)),
        `translate(${horizontal} ${vertical})`,
      )
    }),
  )
  return (
    group('shadow', wash('M324 786Q668 694 1173 770L1222 836L577 903Z', '#6f705d', 0.17)) +
    group(
      'carved-block',
      transform(
        path('M0 0L411 0L411 340L0 340Z', 'url(#wood)') +
          path('M0 340L411 340L430 358L16 358Z', '#574534') +
          path('M411 0L430 19L430 358L411 340Z', '#695440') +
          path('M18 18L392 18L392 321L18 321Z', '#3d4238', 1, texture) +
          glyphs,
        'translate(428 419) skewY(-9) rotate(-5)',
      ),
    ) +
    group(
      'fresh-paper',
      path(
        'M747 285Q933 311 1097 278L1164 668Q1008 716 817 689Q863 586 807 455Z',
        'url(#paper)',
        1,
        texture,
      ) +
        path('M817 689Q879 661 870 600Q896 671 859 714Z', '#ad9e80', 0.6) +
        times(6, (column) =>
          times(7, (row) =>
            transform(
              line('M-7 -8L7 -8M-9 1L9 1M0 -12L0 12M-6 11L7 11', '#525047', 1.5, 0.66),
              `translate(${851 + column * 40 + row * 4} ${342 + row * 43 - column * 2})`,
            ),
          ),
        ),
    ) +
    group(
      'ink-brush',
      transform(
        path('M0 0Q77 -12 154 1L151 39Q79 55 0 39Z', '#a27b50', 1, texture) +
          path('M0 39Q77 55 151 39L146 78Q72 101 7 78Z', '#3b4139', 1, texture) +
          times(17, (index) => line(`M${10 + index * 8} 51l2 26`, '#9b9d80', 1, 0.25)) +
          path('M52 0L51 -102Q77 -120 100 -101L102 0Z', 'url(#wood)') +
          ellipse(76, -101, 25, 9, '#a48a64'),
        'translate(276 590) rotate(-21)',
      ),
    ) +
    group(
      'bound-book',
      path('M900 766L1137 717L1195 786L957 840Z', '#526b7e', 1, texture) +
        path('M957 840L1195 786L1196 809L957 863Z', '#cfc3a3') +
        path('M900 766L922 761L982 832L958 839Z', '#354e65') +
        times(5, (index) => line(`M${916 + index * 9} ${785 + index * 9}l19 -5`, '#d2c5a5', 2)),
    )
  )
}

function abacus() {
  let frame = path(
    'M0 0L686 0L686 378L0 378ZM30 29L30 348L657 348L657 29Z',
    'url(#wood)',
    1,
    'fill-rule="evenodd"',
  )
  frame += times(11, (index) => {
    const horizontal = 58 + index * 56
    return (
      line(`M${horizontal} 28L${horizontal} 350`, '#bba66e', 6) +
      times(2, (bead) => ellipse(horizontal, 64 + bead * 38, 22, 14, 'url(#wood)', 1, texture)) +
      times(5, (bead) => {
        const vertical =
          index % 3 === 1 ? 179 + bead * 33 : bead < 2 ? 166 + bead * 33 : 242 + (bead - 2) * 33
        return (
          ellipse(
            horizontal,
            vertical,
            22,
            13.6,
            index % 4 ? 'url(#wood)' : '#6d5240',
            1,
            texture,
          ) + line(`M${horizontal - 13} ${vertical - 6}q12 -4 25 -1`, '#c1a274', 1.3, 0.45)
        )
      })
    )
  })
  frame +=
    path('M27 125L660 125L660 144L27 144Z', '#71513c') + line('M35 127L650 127', '#c3a16b', 2, 0.7)
  return (
    group('ground', wash('M285 757Q767 681 1242 781L1216 854L394 882Z', '#6a705a', 0.16)) +
    group('wooden-abacus', transform(frame, 'translate(391 332) rotate(-7 340 180)')) +
    group(
      'counting-rods',
      times(8, (index) =>
        path(
          `M${371 + index * 21} 815l9 -95l8 1l-9 95Z`,
          index % 3 ? '#a45e45' : '#b57e50',
          1,
          texture,
        ),
      ) +
        times(4, (index) =>
          path(`M574 ${755 + index * 19}l116 -12l2 8l-117 12Z`, '#9e6748', 1, texture),
        ),
    ) +
    group(
      'notes-roll',
      path('M816 752Q925 712 1055 721L1186 806L927 855Z', 'url(#paper)', 1, texture) +
        times(5, (index) =>
          line(`M${930 + index * 27} 751l41 36m-25 -15l-7 12`, '#6e6954', 2, 0.55),
        ) +
        ellipse(1173, 804, 20, 38, '#c5b38d', 1, 'transform="rotate(-24 1173 804)"') +
        ellipse(1173, 805, 7, 22, '#928162', 1, 'transform="rotate(-24 1173 805)"'),
    )
  )
}

function steelyard() {
  return (
    group('ground', wash('M307 826Q796 774 1239 824L1278 871L370 888Z', '#7c7960', 0.17)) +
    group(
      'scale-suspension',
      line('M700 208Q670 178 650 209L660 319M700 208L693 315', '#70634e', 5) +
        path('M440 346L1128 268L1132 282L442 363Z', 'url(#wood)', 1, texture) +
        ellipse(443, 352, 13, 10, '#a98b55') +
        times(24, (index) =>
          line(`M${745 + index * 14} ${313 - index * 1.59}l2 9`, '#d3bc83', 1.6, 0.8),
        ) +
        line('M672 313L681 338', '#514b37', 7),
    ) +
    group(
      'hanging-pan',
      line('M487 353L484 404M484 404L378 638M484 404L637 614M484 404L521 669', '#73684d', 3.3) +
        path('M372 638Q480 704 643 614L626 655Q503 741 390 676Z', '#887447', 1, texture) +
        ellipse(508, 638, 138, 36, '#b09a65', 1, 'transform="rotate(-5 508 638)"') +
        grain(507, 627, 60, 96, '#cbb17b') +
        line('M373 638Q509 707 642 614', '#665b3c', 4),
    ) +
    group(
      'counterweight',
      line('M987 289L1001 379L964 407M1001 379L1012 405', '#776341', 4) +
        path('M967 405Q991 392 1016 404L1036 474Q991 498 947 477Z', '#5d6256', 1, texture) +
        ellipse(991, 405, 25, 9, '#989879') +
        line('M968 418Q960 448 964 471', '#bec0a1', 4, 0.45),
    ) +
    group(
      'rice-measure',
      path('M829 656L1129 656L1102 846L855 846Z', 'url(#wood)', 1, texture) +
        path('M829 656L897 604L1192 607L1129 656Z', '#aa895c') +
        path('M1129 656L1192 607L1162 790L1102 846Z', '#6f553b') +
        path('M853 649L902 617L1165 620L1120 648Z', '#62543c') +
        grain(1007, 635, 110, 121, '#cfb174') +
        times(8, (index) =>
          line(`M${860 + index * 34} 674l${5 - index * 1.2} 152`, '#5a4834', 2, 0.5),
        ) +
        path('M845 718L1120 718L1117 731L847 731Z', '#514c3b') +
        path('M852 795L1110 795L1108 809L854 809Z', '#514c3b') +
        grain(810, 854, 42, 90),
    )
  )
}

function palaceLantern() {
  return (
    group(
      'hanging-cord',
      line('M799 106L799 215', '#6b5144', 6) +
        line('M781 200Q799 174 818 200L815 229L785 229Z', '#8c543f', 7),
    ) +
    group(
      'octagonal-frame',
      path('M684 275L751 230L868 230L934 276L953 324L656 324Z', '#946247', 1, texture) +
        path('M684 275L934 276L953 324L656 324Z', '#684c39') +
        path('M660 328L948 328L929 624L681 624Z', 'url(#lantern)', 1, texture) +
        path('M660 328L717 348L731 600L681 624Z', '#bb8b54') +
        path('M893 348L948 328L929 624L879 600Z', '#b1824e') +
        path('M717 348L893 348L879 600L731 600Z', '#e1bf78', 0.5) +
        path(
          'M648 319L960 319L958 336L650 336ZM675 613L936 613L951 639L661 639Z',
          '#9b4f39',
          1,
          texture,
        ) +
        line('M713 337L729 612M897 337L881 612M661 336L681 614M946 336L929 614', '#8c4937', 9) +
        line('M730 354L879 354M738 589L872 589', '#ad7648', 3) +
        path('M686 641L927 641L869 688L749 688Z', '#956142') +
        line('M799 689L799 758', '#a25b3f', 6),
    ) +
    group(
      'painted-plum-panel',
      brush(
        [
          [762, 569],
          [811, 527],
          [782, 460],
          [846, 402],
        ],
        9,
        '#86644b',
        0.8,
      ) +
        brush(
          [
            [797, 507],
            [828, 497],
            [845, 481],
            [859, 469],
          ],
          5,
          '#86644b',
          0.8,
        ) +
        [
          [791, 489],
          [814, 442],
          [849, 409],
          [852, 478],
        ]
          .map(([horizontal, vertical], index) =>
            transform(
              times(5, (petal) =>
                ellipse(
                  Math.cos(petal * 1.257) * 10,
                  Math.sin(petal * 1.257) * 10,
                  9,
                  7,
                  index % 2 ? '#c47865' : '#a75d53',
                  0.9,
                ),
              ) + ellipse(0, 0, 2.5, 2.5, '#8e6a39'),
              `translate(${horizontal} ${vertical})`,
            ),
          )
          .join(''),
    ) +
    group(
      'silk-tassels',
      ellipse(799, 762, 17, 20, '#af543f', 1, texture) +
        times(15, (index) =>
          brush(
            [
              [789 + index * 1.5, 775],
              [786 + index * 2, 814],
              [786 + index * 2.5, 854],
              [777 + index * 3.2, 887 - Math.abs(index - 7) * 2],
            ],
            3,
            index % 3 ? '#ac573e' : '#ce8250',
            0.86,
          ),
        ) +
        line('M787 779L812 779', '#d2a268', 3),
    ) +
    group(
      'night-atmosphere',
      wash('M1054 328Q1154 448 1098 599Q1117 422 1029 348Z', '#747b90', 0.1) +
        wash('M502 413Q423 549 522 682Q462 552 547 440Z', '#7f8196', 0.1),
    )
  )
}

function kite() {
  const kiteShape =
    'M0 -116Q-43 -167 -70 -119L-125 -87L-327 -136Q-255 -47 -199 12L-86 32L-152 172L-16 103L0 64L17 103L153 172L87 32L199 12Q264 -47 327 -136L125 -87L70 -119Q45 -168 0 -116Z'
  return (
    group(
      'wind',
      brush(
        [
          [355, 311],
          [472, 257],
          [525, 292],
          [573, 275],
        ],
        8,
        '#9eaa9b',
        0.22,
      ) +
        brush(
          [
            [997, 681],
            [1121, 621],
            [1192, 641],
            [1267, 620],
          ],
          8,
          '#9da9a2',
          0.18,
        ),
    ) +
    group(
      'swallow-kite',
      transform(
        path(kiteShape, '#3f5f74', 1, texture) +
          path(
            'M-313 -126L-123 -76L-78 16L-194 0Z M313 -126L123 -76L78 16L194 0Z',
            '#bd7655',
            0.96,
            texture,
          ) +
          path(
            'M-255 -105L-141 -73L-111 -24L-182 -33ZM255 -105L141 -73L111 -24L182 -33Z',
            '#d3b477',
            0.95,
            texture,
          ) +
          path(
            'M-59 -97Q-27 -133 0 -114Q29 -134 59 -97L41 25Q0 82 -41 25Z',
            '#cfb87f',
            1,
            texture,
          ) +
          path('M-35 -82Q0 -107 35 -82L28 -38Q0 -20 -28 -38Z', '#a05344') +
          path('M-14 -109L0 -129L14 -109L0 -91Z', '#bb854c') +
          ellipse(-26, -88, 8, 10, '#e6d4aa') +
          ellipse(26, -88, 8, 10, '#e6d4aa') +
          ellipse(-24, -89, 3.4, 6, '#3b413b') +
          ellipse(24, -89, 3.4, 6, '#3b413b') +
          path('M-26 46L-132 154L-15 96L0 63L16 96L133 154L26 46Z', '#a35d48') +
          line('M-313 -126Q-110 -69 0 -29Q114 -72 313 -126M0 -113L0 63', '#c0a371', 3.5, 0.85) +
          line('M-117 -76L-84 21M117 -76L84 21', '#745b44', 3) +
          times(5, (index) =>
            line(
              `M${-230 + index * 27} ${-88 + index * 11}l${32 - index * 2} 38M${230 - index * 27} ${-88 + index * 11}l${-32 + index * 2} 38`,
              '#e1c48b',
              2,
              0.75,
            ),
          ),
        'translate(847 397) rotate(17)',
      ),
    ) +
    group('kite-string', line('M854 430Q924 612 751 673T563 825', '#766c53', 1.7, 0.8)) +
    group(
      'wood-spool',
      transform(
        path('M-72 -37L72 -37L72 38L-72 38Z', '#c9b88e') +
          times(19, (index) =>
            line(`M${-61 + index * 6.7} -32L${-60 + index * 6.7} 32`, '#8d8064', 1.5, 0.65),
          ) +
          path(
            'M-95 -48L-70 -48L-70 48L-95 48ZM70 -48L95 -48L95 48L70 48Z',
            'url(#wood)',
            1,
            texture,
          ) +
          line('M-115 0L118 0', '#725b40', 9),
        'translate(540 830) rotate(-15)',
      ),
    )
  )
}

function grapeLeaf(horizontal, vertical, angle, scale = 1) {
  return transform(
    path(
      'M0 0Q-46 -8 -69 -41L-39 -43L-67 -87L-26 -81L-19 -127L9 -98L34 -123L39 -78L78 -83L58 -44L79 -29L39 -8L16 -17Z',
      '#617c53',
      0.95,
      texture,
    ) +
      path('M0 0L-19 -127L9 -98L16 -17Z', '#86935e', 0.5) +
      line('M2 -4L-14 -108M-2 -28L-55 -76M-3 -41L56 -70M-4 -15L51 -33', '#bdba7d', 1.7, 0.7),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function grapeSquirrel() {
  return (
    group(
      'vine',
      brush(
        [
          [340, 744],
          [590, 670],
          [870, 557],
          [1177, 486],
        ],
        49,
        '#70604c',
      ) +
        brush(
          [
            [728, 606],
            [793, 480],
            [885, 357],
            [1038, 241],
          ],
          21,
          '#7f7052',
        ) +
        brush(
          [
            [908, 392],
            [1048, 349],
            [1149, 363],
            [1263, 334],
          ],
          12,
          '#837354',
        ) +
        line('M1168 425Q1268 389 1242 434T1199 427', '#8c8763', 2.5),
    ) +
    group(
      'grape-foliage',
      [
        [802, 401, -33, 1.4],
        [980, 350, 26, 1.3],
        [1124, 382, 57, 1.1],
        [1057, 515, 87, 1.2],
        [753, 577, -82, 1.05],
      ]
        .map((entry) => grapeLeaf(...entry))
        .join(''),
    ) +
    group(
      'grape-bunch',
      line('M989 385Q1003 427 980 475', '#7a7652', 6) +
        times(28, (index) => {
          const row = Math.floor(Math.sqrt(index))
          const horizontal = 966 + Math.sin(index * 2.4) * (88 - row * 10)
          const vertical = 464 + index * 7 + Math.cos(index * 2.4) * 24
          return ellipse(
            horizontal,
            vertical,
            26 - index * 0.16,
            29 - index * 0.14,
            'url(#grape)',
            1,
            texture,
          )
        }),
    ) +
    group(
      'squirrel-tail',
      path(
        'M573 685Q483 675 425 602Q371 531 408 431Q440 354 502 371Q558 389 549 459Q542 514 500 529Q521 599 630 605Z',
        'url(#fur)',
        1,
        texture,
      ) +
        brush(
          [
            [487, 411],
            [409, 484],
            [457, 607],
            [552, 637],
          ],
          45,
          '#c0a080',
          0.6,
        ) +
        times(17, (index) =>
          brush(
            [
              [443 + Math.sin(index) * 11, 415 + index * 10],
              [410, 442 + index * 11],
              [439, 519 + index * 7],
              [481 + index * 3, 564 + index * 4],
            ],
            2.5,
            '#605244',
            0.4,
          ),
        ),
    ) +
    group(
      'squirrel-body',
      path(
        'M554 678Q536 603 579 548Q613 507 655 522Q690 535 694 580L718 605Q746 643 716 681Q670 727 590 711Z',
        'url(#fur)',
        1,
        texture,
      ) +
        path('M652 554Q675 553 685 581L700 636Q689 672 664 682L641 637Z', '#c7b08b', 0.8, texture) +
        ellipse(595, 665, 47, 42, '#896a50', 1, texture) +
        path('M579 695Q604 690 645 702L660 713Q611 731 580 716Z', '#655342') +
        line('M617 709L644 714M610 714L636 720', '#3f4036', 1.8),
    ) +
    group(
      'squirrel-head-and-paws',
      path(
        'M646 539L627 510Q631 488 647 491L668 518Q696 518 709 540L743 554Q750 567 733 576L703 581L676 567Z',
        'url(#fur)',
        1,
        texture,
      ) +
        path('M638 512Q635 498 645 499L658 519Z', '#725241') +
        path('M697 554Q717 550 739 558L733 571L707 573Z', '#bfa381') +
        ellipse(704, 542, 6.1, 5.3, '#333b34') +
        ellipse(705, 540.5, 1.6, 1.4, '#d9cab0') +
        ellipse(742, 558, 4, 3, '#3d3b34') +
        line('M732 569L741 566M729 569L752 578M729 564L756 563', '#5c5846', 1.2, 0.7) +
        path('M675 592Q711 591 728 617L716 629Q688 624 674 615Z', '#967655', 1, texture) +
        ellipse(730, 615, 16, 19, 'url(#grape)') +
        path('M687 624Q711 633 737 621L739 631Q708 652 685 642Z', '#a38562', 1, texture) +
        line('M726 627L733 631M720 631L728 636', '#5e5540', 1.4),
    )
  )
}

function narcissus() {
  const leaves = [
    [628, 780, 471, 258, 513, 688],
    [663, 782, 652, 235, 591, 614],
    [704, 778, 778, 230, 746, 603],
    [734, 783, 986, 316, 844, 689],
    [694, 785, 917, 457, 802, 670],
    [644, 788, 467, 445, 543, 700],
    [764, 789, 1087, 570, 931, 744],
  ]
  return (
    group(
      'leaf-fan',
      leaves
        .map(
          ([baseX, baseY, tipX, tipY, bendX, bendY], index) =>
            path(
              `M${baseX} ${baseY}Q${bendX - 36} ${bendY - 192} ${tipX} ${tipY}Q${bendX + 2} ${bendY - 97} ${baseX + 23} ${baseY}Z`,
              index % 2 ? '#6f855b' : '#4e7463',
              0.96,
              texture,
            ) +
            line(
              `M${baseX + 12} ${baseY - 9}Q${bendX - 17} ${bendY - 140} ${tipX} ${tipY + 15}`,
              '#b6bb78',
              1.6,
              0.52,
            ),
        )
        .join(''),
    ) +
    group(
      'flower-stems',
      [
        [679, 775, 637, 362],
        [724, 779, 822, 401],
        [696, 778, 740, 274],
      ]
        .map(([baseX, baseY, flowerX, flowerY]) =>
          brush(
            [
              [baseX, baseY],
              [baseX + 14, 569],
              [flowerX - 17, flowerY + 95],
              [flowerX, flowerY],
            ],
            10,
            '#8e9e69',
          ),
        )
        .join('') +
        brush(
          [
            [692, 542],
            [667, 482],
            [686, 424],
            [691, 380],
          ],
          7,
          '#8e9e69',
        ) +
        brush(
          [
            [736, 430],
            [774, 405],
            [785, 367],
            [784, 329],
          ],
          6,
          '#8e9e69',
        ),
    ) +
    group(
      'white-and-gold-flowers',
      [
        [633, 363, 1, -10],
        [820, 404, 0.9, 22],
        [742, 275, 0.82, -26],
        [691, 380, 0.68, 24],
        [784, 329, 0.7, 13],
      ]
        .map(([horizontal, vertical, scale, angle]) =>
          transform(
            times(6, (index) =>
              path(
                'M0 1Q-37 -10 -22 -62Q-2 -92 16 -69Q44 -36 0 1Z',
                index % 2 ? '#e7e3cd' : '#f0e9d5',
                1,
                `transform="rotate(${index * 60})" ${texture}`,
              ),
            ) +
              ellipse(0, 1, 19, 18, '#d2af4c') +
              path('M-18 -5Q0 11 19 -6L15 13Q0 25 -14 13Z', '#bd923e') +
              ellipse(0, -4, 14, 8, '#e9c85e') +
              ellipse(0, -3, 5, 3, '#b18a32'),
            `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
          ),
        )
        .join(''),
    ) +
    group(
      'bulbs-and-water',
      ellipse(716, 807, 240, 50, '#839da0', 0.6) +
        [
          [617, 776],
          [690, 779],
          [771, 782],
        ]
          .map(
            ([horizontal, vertical]) =>
              path(
                `M${horizontal - 36} ${vertical + 27}Q${horizontal - 47} ${vertical - 7} ${horizontal - 8} ${vertical - 29}L${horizontal + 4} ${vertical - 48}L${horizontal + 20} ${vertical - 19}Q${horizontal + 54} ${vertical + 18} ${horizontal + 29} ${vertical + 36}Z`,
                '#c2b28e',
                1,
                texture,
              ) + line(`M${horizontal - 6} ${vertical - 15}q-17 29 -2 43`, '#8c8568', 2, 0.6),
          )
          .join('') +
        path('M816 810L836 770L873 765L902 812Z', 'url(#stone)', 1, texture),
    ) +
    group(
      'blue-and-white-basin',
      path('M466 797Q718 866 965 797L929 875Q711 947 501 875Z', '#d2d5c5', 1, texture) +
        path('M475 808Q714 875 957 808L950 829Q711 891 484 828Z', '#577c91') +
        path('M506 862Q710 918 924 862L921 879Q713 943 510 879Z', '#68879a') +
        times(10, (index) =>
          line(
            `M${526 + index * 38} ${850 + Math.sin((index / 9) * Math.PI) * 31}q12 -17 23 0q-11 17 -23 0`,
            '#557a8e',
            2.2,
            0.75,
          ),
        ) +
        path('M567 900L857 900L842 921L584 921Z', '#778f91'),
    )
  )
}

function peacock() {
  const feathers = [
    [1163, 867],
    [1224, 841],
    [1245, 795],
    [1190, 753],
    [1118, 722],
    [1046, 700],
    [970, 666],
  ]
  let tail = feathers
    .map(([endX, endY], index) => {
      const startX = 770 + index * 3
      const startY = 580 - index * 2
      return (
        path(
          `M${startX} ${startY}Q${endX - 144} ${endY - 141} ${endX + 17} ${endY - 22}Q${endX + 49} ${endY + 12} ${endX + 4} ${endY + 34}Q${endX - 148} ${endY - 48} ${startX - 9} ${startY + 21}Z`,
          index % 3 ? 'url(#tail)' : '#8a8c60',
          0.94,
          texture,
        ) +
        line(
          `M${startX} ${startY + 10}Q${endX - 150} ${endY - 96} ${endX + 14} ${endY + 12}`,
          '#b4af73',
          1,
          0.65,
        ) +
        transform(
          ellipse(0, 0, 15, 23, '#b09555') +
            ellipse(0, 1, 11, 16, '#4d8c83') +
            ellipse(0, 3, 7, 11, '#354c6f') +
            ellipse(-2, 0, 3, 5, '#8eb4a6', 0.65),
          `translate(${endX - 2} ${endY - 3}) rotate(${-40 - index})`,
        )
      )
    })
    .join('')
  return (
    group(
      'garden-rock',
      wash('M450 847Q835 777 1262 850L1197 900L457 906Z', '#687c67', 0.15) +
        path(
          'M518 850L554 778L640 766L675 809L718 821L755 878L643 895Z',
          'url(#stone)',
          1,
          texture,
        ) +
        brush(
          [
            [540, 838],
            [568, 822],
            [570, 794],
            [606, 786],
          ],
          12,
          '#c0c0a1',
          0.6,
        ),
    ) +
    group(
      'feet-and-legs',
      path(
        'M651 659L660 784L637 826L643 832L675 791L671 656ZM705 669L708 798L735 841L745 842L723 795L724 661Z',
        '#8f8970',
        1,
        texture,
      ) + line('M644 827L611 837M644 827L650 844M736 840L770 846M738 840L720 852', '#645e4c', 4),
    ) +
    group('trailing-train', tail) +
    group(
      'body-and-folded-wing',
      path(
        'M621 492Q652 470 704 485Q795 498 815 562Q819 619 743 676Q677 706 627 653Q585 598 621 492Z',
        'url(#peacock)',
        1,
        texture,
      ) +
        path('M646 526Q710 488 778 552Q802 596 739 650Q667 672 639 613Z', '#779085', 1, texture) +
        times(17, (index) =>
          transform(
            path(
              'M0 0Q-10 -11 -7 -24Q5 -33 15 -16Q12 -6 0 0Z',
              index % 2 ? '#5d7e77' : '#98a98d',
              0.6,
              texture,
            ),
            `translate(${666 + (index % 5) * 22} ${548 + Math.floor(index / 5) * 20}) rotate(-29)`,
          ),
        ) +
        times(9, (index) =>
          brush(
            [
              [651 + index * 11, 534 + index * 2],
              [668 + index * 10, 560],
              [687 + index * 7, 590],
              [706 + index * 4, 621 + index * 2],
            ],
            10,
            index % 2 ? '#536e67' : '#a4a681',
            0.8,
          ),
        ) +
        path('M768 530Q810 535 843 575L801 614L765 590Z', '#6e8b62', 1, texture),
    ) +
    group(
      'long-neck-and-head',
      path(
        'M626 562Q604 509 610 443Q626 374 617 337Q603 316 578 320Q558 323 550 311Q547 293 571 282Q603 268 626 287Q646 304 643 341Q639 391 652 428L682 489Q698 542 668 576Z',
        'url(#peacock)',
        1,
        texture,
      ) +
        brush(
          [
            [625, 549],
            [609, 480],
            [638, 411],
            [628, 344],
          ],
          12,
          '#6c9f9b',
          0.7,
        ) +
        path('M555 302Q568 293 585 301L580 313L558 311Z', '#ddd9bd') +
        ellipse(575, 301, 4.5, 4.7, '#303d3c') +
        path('M551 302L529 309L552 314Z', '#9b9875') +
        line('M592 281Q584 265 584 248M601 279L600 241M611 281L617 250', '#506a6f', 2) +
        ellipse(584, 247, 5, 6, '#3a6c7e') +
        ellipse(600, 240, 5, 6, '#3a6c7e') +
        ellipse(617, 249, 5, 6, '#3a6c7e'),
    ) +
    group(
      'camellia-spray',
      brush(
        [
          [1019, 706],
          [1030, 580],
          [1132, 472],
          [1129, 371],
        ],
        14,
        '#726b4c',
      ) +
        [
          [1063, 544, -20],
          [1113, 466, 47],
          [1098, 492, -56],
        ]
          .map(([horizontal, vertical, angle]) =>
            transform(
              path('M0 0Q-43 -48 -18 -103Q26 -76 0 0Z', '#597b5e', 1, texture) +
                line('M0 0L-14 -84', '#a3ad77', 1.5),
              `translate(${horizontal} ${vertical}) rotate(${angle})`,
            ),
          )
          .join('') +
        transform(
          times(7, (index) =>
            ellipse(
              Math.cos(index * 0.898) * 20,
              Math.sin(index * 0.898) * 20,
              25,
              22,
              'url(#petal)',
              1,
              texture,
            ),
          ) +
            times(11, (index) =>
              ellipse(Math.cos(index * 2.4) * 12, Math.sin(index * 2.4) * 10, 2, 2, '#c9ac5e'),
            ),
          'translate(1130 378)',
        ),
    )
  )
}

function gate() {
  const roof = (horizontal, vertical, width, depth) =>
    transform(
      path(
        `M${-width * 0.33} 0L${width * 0.33} 0Q${width * 0.41} ${depth * 0.72} ${width * 0.57} ${depth * 0.82}Q0 ${depth * 1.27} ${-width * 0.57} ${depth * 0.82}Q${-width * 0.4} ${depth * 0.7} ${-width * 0.33} 0Z`,
        'url(#tile)',
        1,
        texture,
      ) +
        times(20, (index) =>
          line(
            `M${-width * 0.31 + index * width * 0.0327} 7L${-width * 0.51 + index * width * 0.0537} ${depth * 0.91}`,
            '#b0b4a5',
            1.6,
            0.42,
          ),
        ) +
        line(
          `M${-width * 0.57} ${depth * 0.82}Q0 ${depth * 1.27} ${width * 0.57} ${depth * 0.82}`,
          '#3e5553',
          7,
        ),
      `translate(${horizontal} ${vertical})`,
    )
  return (
    group(
      'distant-mountains',
      wash(
        'M224 645L361 513L430 557L566 422L702 565L842 475L1015 606L1198 493L1358 652Z',
        '#788c89',
        0.23,
      ) + wash('M359 670L482 570L635 628L798 524L984 654L1189 571L1391 690Z', '#7b9088', 0.17),
    ) +
    group(
      'gate-wall',
      path(
        'M296 595L1251 595L1251 838L915 838L915 718Q915 644 799 641Q681 646 681 718L681 838L296 838Z',
        '#bca77d',
        1,
        texture,
      ) +
        path('M296 595L1251 595L1251 632L296 632Z', '#958a68', 1, texture) +
        path('M296 831L681 831L681 852L296 852ZM915 831L1251 831L1251 852L915 852Z', '#938b6b') +
        times(11, (index) =>
          path(
            `M${310 + index * 85} 595L${310 + index * 85} 550L${356 + index * 85} 550L${356 + index * 85} 595Z`,
            '#b8a67e',
            1,
            texture,
          ),
        ) +
        line('M300 633L1248 633', '#d5c29a', 3, 0.8) +
        path(
          'M658 837L658 718Q658 621 799 619Q937 621 939 718L939 837L914 837L914 718Q914 646 799 643Q682 647 682 718L682 837Z',
          '#857e60',
          1,
          texture,
        ) +
        [338, 476, 1014, 1152]
          .map((horizontal) =>
            line(`M${horizontal} 690l81 0m-40 -42l0 40m9 66l42 0`, '#8d8669', 1.8, 0.5),
          )
          .join(''),
    ) +
    group(
      'gate-tower',
      path('M565 426L1034 426L1034 551L565 551Z', '#ad7560', 1, texture) +
        path('M590 450L1007 450L1007 536L590 536Z', '#5a5550') +
        times(8, (index) => path(`M${595 + index * 55} 443l13 0l0 107l-13 0Z`, '#9f5e47')) +
        path('M619 309L979 309L979 406L619 406Z', '#a96d56', 1, texture) +
        times(6, (index) => path(`M${640 + index * 55} 326l26 0l0 63l-26 0Z`, '#54594e')) +
        roof(799, 367, 562, 93) +
        roof(799, 245, 476, 87) +
        path('M641 244Q798 232 956 244L955 255L642 255Z', '#5a6b61') +
        line('M799 231L799 210', '#687267', 7),
    ) +
    group(
      'road-and-grass',
      wash('M682 838Q751 887 582 924L1103 924Q873 875 915 838Z', '#b29e76', 0.3) +
        brush(
          [
            [301, 844],
            [346, 817],
            [391, 830],
            [446, 814],
          ],
          16,
          '#7b855f',
          0.5,
        ) +
        brush(
          [
            [1137, 849],
            [1206, 825],
            [1271, 852],
            [1304, 833],
          ],
          14,
          '#7a865d',
          0.5,
        ),
    )
  )
}

function tiles() {
  const tileRow = times(7, (index) => {
    const horizontal = 410 + index * 111
    const top = 315 - index * 12
    const bottom = 645 - index * 8
    return (
      path(
        `M${horizontal - 44} ${top}Q${horizontal} ${top - 25} ${horizontal + 44} ${top}L${horizontal + 49} ${bottom}L${horizontal - 49} ${bottom}Z`,
        'url(#tile)',
        1,
        texture,
      ) +
      path(
        `M${horizontal + 25} ${top + 9}L${horizontal + 48} ${bottom}L${horizontal + 30} ${bottom}L${horizontal + 13} ${top + 7}Z`,
        '#415452',
        0.55,
      ) +
      line(
        `M${horizontal - 25} ${top + 20}Q${horizontal - 17} ${top + 120} ${horizontal - 21} ${bottom - 12}`,
        '#b2b8a4',
        4,
        0.7,
      ) +
      times(3, (joint) =>
        line(
          `M${horizontal - 38} ${top + 90 + joint * 85}Q${horizontal} ${top + 79 + joint * 85} ${horizontal + 42} ${top + 90 + joint * 85}`,
          '#4c615b',
          2.2,
          0.6,
        ),
      ) +
      ellipse(horizontal, bottom, 49, 48, '#53675f', 1, texture) +
      ellipse(horizontal, bottom, 40, 39, '#8a9685', 1, texture) +
      ellipse(horizontal, bottom, 32, 31, '#667e72', 0.65) +
      times(6, (petal) =>
        transform(
          path('M0 -4Q-17 -14 -5 -29Q11 -29 15 -16Q17 -8 0 -4Z', '#b3b79d', 0.7, texture),
          `translate(${horizontal} ${bottom}) rotate(${petal * 60 + index * 12})`,
        ),
      ) +
      ellipse(horizontal, bottom, 8, 8, '#50685b')
    )
  })
  return (
    group('roof-shadow', wash('M345 724Q732 683 1198 664L1283 750L446 879Z', '#7a816c', 0.14)) +
    group(
      'timber-bracket',
      path('M380 661L1161 607L1180 691L398 761Z', 'url(#wood)', 1, texture) +
        path('M398 761L1180 691L1177 717L401 793Z', '#5f5140') +
        path('M596 745L651 741L661 873L611 880Z', '#8f684b', 1, texture) +
        path('M565 758L684 746L673 782L590 796Z', '#ad845b') +
        path('M936 717L985 712L1008 834L956 841Z', '#8f684b', 1, texture) +
        line('M405 742L1161 675', '#c2a178', 3, 0.5),
    ) +
    group('cylindrical-tiles-and-lotus-ends', tileRow) +
    group(
      'eave-grasses',
      brush(
        [
          [1130, 290],
          [1172, 246],
          [1189, 212],
          [1185, 181],
        ],
        7,
        '#7b8962',
        0.8,
      ) +
        brush(
          [
            [1143, 271],
            [1173, 252],
            [1212, 254],
            [1245, 229],
          ],
          6,
          '#88946a',
          0.75,
        ) +
        brush(
          [
            [1164, 246],
            [1141, 222],
            [1126, 209],
            [1119, 189],
          ],
          5,
          '#6b805e',
          0.7,
        ),
    )
  )
}

function embroidery() {
  const ring =
    '<circle cx="0" cy="0" r="220" fill="none" stroke="#b28754" stroke-width="15"/><circle cx="0" cy="0" r="229" fill="none" stroke="#876347" stroke-width="4"/>'
  let peony = times(9, (index) =>
    transform(
      path(
        'M0 3Q-42 -10 -34 -53Q-13 -85 17 -60Q52 -69 48 -36Q35 -6 0 3Z',
        index % 3 ? '#bf8290' : '#d49ba3',
        1,
        texture,
      ) +
        times(4, (thread) =>
          line(
            `M${-12 + thread * 5} -6Q${-20 + thread * 6} -32 ${-15 + thread * 8} -51`,
            '#e0b9b7',
            1,
            0.55,
          ),
        ),
      `rotate(${index * 40}) translate(0 -22)`,
    ),
  )
  peony += times(15, (index) =>
    ellipse(Math.sin(index * 2.4) * 15, Math.cos(index * 2.4) * 12, 2, 3, '#c2a35d'),
  )
  return (
    group(
      'silk-folds',
      wash('M343 790Q843 733 1190 826L1220 902L414 919Z', '#9c7b73', 0.14) +
        path('M392 728Q515 685 659 728L764 862Q631 886 439 848Z', 'url(#silk)', 1, texture) +
        brush(
          [
            [421, 756],
            [544, 741],
            [652, 812],
            [739, 852],
          ],
          24,
          '#dbac98',
          0.35,
        ) +
        path(
          'M773 610L1081 622Q1044 781 1174 859L958 873Q879 797 773 610Z',
          'url(#silk)',
          1,
          texture,
        ) +
        brush(
          [
            [984, 699],
            [931, 755],
            [966, 820],
            [1035, 856],
          ],
          20,
          '#6c5261',
          0.3,
        ),
    ) +
    group(
      'embroidery-hoop',
      transform(
        ellipse(0, 0, 215, 215, '#d6c9a6', 1, texture) +
          ring +
          brush(
            [
              [-114, 151],
              [-68, 62],
              [38, 36],
              [98, -105],
            ],
            7,
            '#6a825c',
          ) +
          path(
            'M-71 89Q-140 84 -150 22Q-86 14 -71 89ZM-9 28Q57 23 64 -30Q3 -44 -9 28Z',
            '#7d946b',
            1,
            texture,
          ) +
          transform(peony, 'translate(76 -78) scale(.85)') +
          line('M-62 125Q-140 206 -261 253Q-300 282 -247 304Q-189 318 -192 277', '#944f5f', 2.5) +
          line('M-63 125L-18 64', '#68777a', 3) +
          line('M-61 122L-55 116', '#d3d7c5', 1) +
          path('M-21 -228L18 -228L18 -254L-21 -254Z', '#9f7e49') +
          line('M-35 -246L34 -246', '#6a6850', 5) +
          ellipse(-35, -246, 5, 8, '#968d60'),
        'translate(696 510) rotate(-14)',
      ),
    ) +
    group(
      'thread-spools',
      transform(
        path('M0 -29L74 -29L74 29L0 29Z', '#a8677b', 1, texture) +
          times(19, (index) =>
            line(`M${4 + index * 3.6} -24L${4 + index * 3.6} 24`, '#dbb1af', 1, 0.6),
          ) +
          path('M-8 -37L4 -37L4 37L-8 37ZM71 -37L83 -37L83 37L71 37Z', '#aa875a'),
        'translate(1058 739) rotate(19)',
      ),
    ) +
    group(
      'small-scissors',
      transform(
        line('M0 0L78 -108L48 -10L-4 17M4 9L117 -68L32 9L-14 11', '#6f7e7a', 8) +
          ellipse(
            -14,
            27,
            19,
            29,
            'none',
            1,
            'stroke="#8f845b" stroke-width="7" transform="rotate(30 -14 27)"',
          ) +
          ellipse(
            -35,
            -2,
            19,
            27,
            'none',
            1,
            'stroke="#8f845b" stroke-width="7" transform="rotate(-35 -35 -2)"',
          ) +
          ellipse(12, -1, 5, 5, '#b9ac7d'),
        'translate(878 855) rotate(9)',
      ),
    )
  )
}

const studies = [
  {
    id: 'wheat-and-stone-mill',
    name: '麦香石磨',
    category: 'color',
    theme: '农桑百工 · 谷物加工',
    note: '磨盘转面与磨齿 · 木柄出粮槽 · 麦束粮袋',
    draw: mill,
  },
  {
    id: 'woodblock-printing-desk',
    name: '雕版留香',
    category: 'color',
    theme: '文教百工 · 雕版印书',
    note: '刻版墨刷与揭纸 · 书册陪景 · 纹字仅为装饰',
    draw: printing,
  },
  {
    id: 'abacus-and-counting-rods',
    name: '珠算筹思',
    category: 'color',
    theme: '数理商贸 · 筹算意象',
    note: '上二下五木珠 · 横梁穿杆 · 散筹与纸卷',
    draw: abacus,
  },
  {
    id: 'steelyard-and-grain-measure',
    name: '市衡量谷',
    category: 'color',
    theme: '商贸度量 · 杆秤米斗',
    note: '提绳支点与吊盘 · 移动秤砣 · 木斗粮粒',
    draw: steelyard,
  },
  {
    id: 'octagonal-palace-lantern',
    name: '宫灯照影',
    category: 'color',
    theme: '民俗陈设 · 八角宫灯',
    note: '红木骨架与暖绢 · 折面梅影 · 垂穗悬绳',
    draw: palaceLantern,
  },
  {
    id: 'swallow-kite-and-spool',
    name: '纸鸢乘风',
    category: 'color',
    theme: '节俗游艺 · 燕形纸鸢',
    note: '靛蓝朱赭燕翼 · 竹骨与风线 · 木制绕线轴',
    draw: kite,
  },
  {
    id: 'squirrel-in-grape-vine',
    name: '葡架松趣',
    category: 'figures',
    theme: '花果生灵 · 葡萄松鼠',
    note: '紫葡青叶 · 松鼠回卷蓬尾 · 前爪抱果',
    draw: grapeSquirrel,
  },
  {
    id: 'narcissus-in-porcelain-basin',
    name: '凌波清供',
    category: 'color',
    theme: '岁时清供 · 水仙盆景',
    note: '白瓣黄盏与带叶 · 鳞茎石子 · 青花浅盆',
    draw: narcissus,
  },
  {
    id: 'peacock-and-camellia',
    name: '翠羽山茶',
    category: 'figures',
    theme: '花鸟园石 · 孔雀山茶',
    note: '钴青长颈与冠羽 · 拖尾眼斑 · 爪石着落',
    draw: peacock,
  },
  {
    id: 'city-gate-in-spring-clouds',
    name: '春云城阙',
    category: 'ink',
    theme: '建筑历史空间 · 城门望楼',
    note: '夯土城墙与券门 · 重檐望楼 · 淡山与道路',
    draw: gate,
  },
  {
    id: 'lotus-tiles-on-timber-eaves',
    name: '瓦当承露',
    category: 'ink',
    theme: '建筑构件 · 莲纹瓦当',
    note: '筒瓦纵向承叠 · 莲纹瓦端 · 木檐与细草',
    draw: tiles,
  },
  {
    id: 'silk-embroidery-and-needle',
    name: '绣绷春色',
    category: 'color',
    theme: '衣食百工 · 丝线刺绣',
    note: '竹绷花绢与针线 · 木轴彩线 · 金属小剪',
    draw: embroidery,
  },
]

mkdirSync(destination, { recursive: true })
for (const study of studies) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}。原创代码彩墨意象，非文物、制度或技术复原。透明背景。</desc>${definitions}${study.draw()}</svg>`
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
console.log('Generated twelve civilization ink studies')
