import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/garden-studies/ink-wash',
)
const ink = '#343d3b'
const grain = 'filter="url(#pigment)"'
const times = (count, callback) =>
  Array.from({ length: count }, (_, index) => callback(index)).join('')
const path = (shape, color = ink, opacity = 1, extra = '') =>
  `<path d="${shape}" fill="${color}" opacity="${opacity}" ${extra}/>`
const line = (shape, color = ink, width = 2, opacity = 1) =>
  `<path d="${shape}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1, extra = '') =>
  `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${color}" opacity="${opacity}" ${extra}/>`
const transform = (content, attributes) => `<g transform="${attributes}">${content}</g>`
const group = (identity, content, extra = '') => `<g id="${identity}" ${extra}>${content}</g>`
const wash = (shape, color, opacity = 0.18) => path(shape, color, opacity, 'filter="url(#soft)"')
const definitions = `<defs>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="pigment" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency=".43" numOctaves="2" seed="162" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .18 0 0 0 .82" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="paint"/><feTurbulence type="fractalNoise" baseFrequency=".038" numOctaves="2" seed="62" result="edge"/><feDisplacementMap in="paint" in2="edge" scale="2.5" xChannelSelector="R" yChannelSelector="G"/></filter>
<linearGradient id="leaf" x2="80%" y2="100%"><stop stop-color="#94a16a"/><stop offset=".43" stop-color="#697f51"/><stop offset="1" stop-color="#3d6350"/></linearGradient>
<linearGradient id="purple" x2="85%" y2="100%"><stop stop-color="#cfb6cb"/><stop offset=".45" stop-color="#a08aaf"/><stop offset="1" stop-color="#71628f"/></linearGradient>
<radialGradient id="orange" cx="32%" cy="28%" r="80%"><stop stop-color="#e4b55e"/><stop offset=".55" stop-color="#d48642"/><stop offset="1" stop-color="#a75132"/></radialGradient>
<linearGradient id="petal" x2="65%" y2="100%"><stop stop-color="#f1e7da"/><stop offset=".58" stop-color="#e5c9c7"/><stop offset="1" stop-color="#ae718d"/></linearGradient>
<linearGradient id="white" x2="65%" y2="100%"><stop stop-color="#eee8d7"/><stop offset=".5" stop-color="#d9dbcf"/><stop offset="1" stop-color="#9eaead"/></linearGradient>
<linearGradient id="blue" x2="80%" y2="100%"><stop stop-color="#647a8d"/><stop offset=".5" stop-color="#384f65"/><stop offset="1" stop-color="#253d4b"/></linearGradient>
<linearGradient id="gold" x2="65%" y2="100%"><stop stop-color="#d7bc78"/><stop offset=".4" stop-color="#bc9556"/><stop offset="1" stop-color="#8b6c41"/></linearGradient>
<linearGradient id="wood" x2="70%" y2="100%"><stop stop-color="#b69765"/><stop offset=".5" stop-color="#8a6947"/><stop offset="1" stop-color="#65513e"/></linearGradient>
<linearGradient id="jade" x2="80%" y2="95%"><stop stop-color="#d4d6b6"/><stop offset=".4" stop-color="#b1c5ac"/><stop offset="1" stop-color="#6d978d"/></linearGradient>
<linearGradient id="ceramic" x2="65%" y2="100%"><stop stop-color="#bed0ba"/><stop offset=".4" stop-color="#93b5a4"/><stop offset="1" stop-color="#507e79"/></linearGradient>
<linearGradient id="clay" x2="80%" y2="100%"><stop stop-color="#b58b67"/><stop offset=".45" stop-color="#947257"/><stop offset="1" stop-color="#655747"/></linearGradient>
<linearGradient id="roof" x2="25%" y2="100%"><stop stop-color="#8d9a98"/><stop offset=".5" stop-color="#697d80"/><stop offset="1" stop-color="#3d565d"/></linearGradient>
<clipPath id="basket"><path d="M600 463Q797 509 1020 458L964 790Q797 854 665 784Z"/></clipPath>
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
      (width * (0.32 + 0.68 * Math.sin(Math.PI * fraction)) * (1 - fraction * 0.82)) / 2
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
    path('M0 0C-42 -34 -59 -100 -20 -157C17 -116 28 -46 0 0Z', color, 1, grain) +
      line('M0 -4Q-16 -72 -20 -142', '#b4ba88', 1.6, 0.55),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function branch(shape, width, color = '#665a48') {
  return `<g ${grain}>${line(shape, color, width, 0.96)}${line(shape, '#9f8b69', width * 0.21, 0.36)}</g>`
}

function wisteria() {
  const raceme = (horizontal, vertical, scale, angle) =>
    transform(
      line('M0 0Q-15 100 4 277', '#767b55', 2.8) +
        times(21, (index) => {
          const vertical = 19 + index * 11
          const breadth = 35 * (1 - index / 28)
          const horizontal = Math.sin(index * 2.38) * breadth
          return transform(
            ellipse(
              0,
              0,
              17 - index * 0.39,
              10 - index * 0.21,
              index % 3 ? 'url(#purple)' : '#c4acc4',
              0.96,
              grain,
            ) + path('M-10 1Q0 27 14 2Q2 12 -10 1Z', '#8c719f', 0.76),
            `translate(${horizontal} ${vertical}) rotate(${Math.sin(index) * 26})`,
          )
        }),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'woody-vine',
      branch('M1249 817C1150 700 1233 461 1072 314Q1000 237 798 260Q567 279 343 168', 32) +
        branch('M1073 315Q951 337 870 192Q815 116 688 133', 13) +
        branch('M965 273Q866 393 621 333Q497 315 413 369', 14) +
        times(15, (index) =>
          brush(
            [
              [1188 - index * 19, 706 - index * 23],
              [1153 - index * 17, 688 - index * 24],
              [1159 - index * 17, 673 - index * 24],
              [1145 - index * 17, 660 - index * 24],
            ],
            5,
            '#b7a17c',
            0.5,
          ),
        ),
    ) +
    group(
      'purple-racemes',
      raceme(429, 228, 1.18, -7) +
        raceme(585, 261, 1.5, 7) +
        raceme(761, 298, 1.2, -12) +
        raceme(920, 317, 1.52, 9) +
        raceme(1050, 369, 0.93, -4) +
        raceme(719, 156, 0.84, 11),
    ) +
    group(
      'compound-leaves',
      times(8, (index) => {
        const horizontal = 457 + index * 86
        const vertical = 214 + Math.sin(index * 1.4) * 65
        return transform(
          line('M0 0Q39 -38 98 -40', '#68734e', 3) +
            times(5, (leafIndex) =>
              leaf(
                leafIndex * 20,
                -leafIndex * 8,
                leafIndex % 2 ? 82 : -39,
                0.42 + leafIndex * 0.02,
              ),
            ),
          `translate(${horizontal} ${vertical}) rotate(${-34 + index * 9})`,
        )
      }),
    )
  )
}

function persimmons() {
  const fruit = (horizontal, vertical, scale, angle) =>
    transform(
      path(
        'M-66 -24C-80 20 -60 85 -3 92C58 99 92 40 66 -14Q56 -48 6 -43Q-39 -56 -66 -24Z',
        'url(#orange)',
        1,
        grain,
      ) +
        wash('M-49 -8Q-40 -42 -5 -33Q-35 -8 -34 30Z', '#f0c471', 0.33) +
        path(
          'M-26 -39L-7 -54L4 -45L26 -55L25 -35L42 -20L16 -19L3 -8L-7 -28L-31 -20Z',
          '#666e46',
          1,
          grain,
        ) +
        line('M5 -39L4 -70', '#665c41', 5),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'branch',
      branch('M355 836Q533 607 641 471Q773 282 1230 210', 32) +
        branch('M629 487Q848 481 1104 369', 17) +
        branch('M809 312Q790 225 894 153', 11) +
        branch('M531 628Q408 582 346 466', 11),
    ) +
    group(
      'autumn-leaves',
      leaf(422, 578, -36, 1.05, '#a28c52') +
        leaf(644, 469, 44, 1.2, '#98794c') +
        leaf(801, 326, -46, 0.96) +
        leaf(1016, 269, 38, 1.14, '#ad9c5c') +
        leaf(1119, 234, 79, 0.85, '#8d854e') +
        leaf(938, 430, -19, 0.88, '#ad7647'),
    ) +
    group(
      'ripe-fruits',
      fruit(555, 629, 1.13, 8) +
        fruit(711, 490, 1.26, -8) +
        fruit(927, 434, 0.94, 6) +
        fruit(1046, 342, 1.15, 13) +
        fruit(1166, 277, 0.8, -9),
    )
  )
}

function magnolias() {
  const blossom = (horizontal, vertical, scale, angle) =>
    transform(
      path(
        'M0 28Q-75 -22 -75 -106Q-17 -103 6 -31Q34 -127 85 -142Q111 -40 40 23Z',
        '#b6859a',
        1,
        grain,
      ) +
        path(
          'M3 29Q-51 -20 -49 -130Q15 -110 32 -27Q66 -108 91 -99Q86 -6 3 29Z',
          'url(#petal)',
          1,
          grain,
        ) +
        path('M1 25Q-12 -57 29 -167Q69 -110 50 -40Q39 7 1 25Z', 'url(#petal)', 1, grain) +
        line('M6 15Q24 -58 30 -139', '#c48ba1', 2.2, 0.47) +
        path('M-9 21Q5 6 28 22L22 42L-2 46Z', '#7e8160', 1, grain),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'branches',
      branch('M440 863Q664 618 734 434Q822 227 1096 199', 32) +
        branch('M632 618Q482 480 441 305', 17) +
        branch('M706 490Q932 524 1096 388', 14) +
        branch('M854 280Q852 186 796 141', 10) +
        branch('M557 541Q398 534 315 438', 9),
    ) +
    group(
      'silk-petals',
      blossom(453, 306, 1.03, -23) +
        blossom(731, 437, 1.27, 16) +
        blossom(951, 481, 0.9, 46) +
        blossom(1089, 206, 1.05, 23) +
        blossom(810, 171, 0.8, -19) +
        blossom(345, 463, 0.72, -45),
    ) +
    group(
      'buds-and-leaves',
      leaf(573, 570, -51, 0.62, '#859663') +
        leaf(1009, 439, 78, 0.62) +
        transform(ellipse(0, 0, 19, 40, '#d3b7c0', 1, grain), 'translate(1193 318) rotate(39)') +
        branch('M1100 386L1180 337', 7),
    )
  )
}

function magpie(horizontal, vertical, angle, scale, back = false) {
  return transform(
    group(
      back ? 'far-bird' : 'near-bird',
      path('M40 88Q103 152 136 370Q85 340 57 246L12 110Z', 'url(#blue)', 1, grain) +
        path('M46 126Q108 251 119 346L95 323Q56 236 23 149Z', '#7a919d', 0.6, grain) +
        path('M-59 1Q-80 72 -29 147Q22 187 63 126Q82 60 27 6Z', ink, 1, grain) +
        path('M-39 54Q-58 103 -13 139Q23 163 41 129Q26 107 19 72Z', 'url(#white)') +
        path('M4 34Q70 39 69 119Q25 128 7 105Q-12 86 4 34Z', 'url(#blue)', 1, grain) +
        path('M20 45Q56 53 54 88Q34 89 16 67Z', '#d3d9cb', 0.95) +
        ellipse(-35, -8, 39, 35, '#303e40', 1, grain) +
        path('M-69 -16L-114 -3L-68 7Z', '#48524d') +
        ellipse(-52, -13, 4.2, 4.2, '#171f21') +
        ellipse(-53, -14, 1.1, 1.1, '#ded6bd') +
        line(
          'M-19 140L-30 185L-53 192M-30 185L-9 193M17 149L11 187L-6 198M11 187L29 195',
          '#655742',
          5,
        ),
    ),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function magpies() {
  return (
    group(
      'weathered-plum',
      branch('M332 804Q598 610 854 602Q1065 620 1268 507', 31) +
        branch('M764 614Q711 434 528 316', 16) +
        branch('M1003 604Q1102 725 1263 738', 13) +
        branch('M553 670Q492 558 346 536', 10),
    ) +
    magpie(626, 470, -13, 0.96, true) +
    magpie(1021, 405, 15, 1.08) +
    group(
      'small-plum-blooms',
      times(16, (index) => {
        const horizontal = index < 8 ? 354 + index * 29 : 1100 + (index - 8) * 23
        const vertical = index < 8 ? 533 - index * 25 : 715 - (index - 8) * 21
        return transform(
          times(5, (petal) =>
            ellipse(
              Math.cos(petal * 1.256) * 12,
              Math.sin(petal * 1.256) * 12,
              11,
              9,
              index % 3 ? '#bf8a91' : '#d6b2aa',
              1,
              grain,
            ),
          ) + ellipse(0, 0, 4, 4, '#946943'),
          `translate(${horizontal} ${vertical})`,
        )
      }),
    )
  )
}

function rooster() {
  const tail =
    path(
      'M853 565C950 392 1034 292 1158 328C1293 371 1279 585 1192 683C1228 508 1214 375 1122 380Q988 397 885 602Z',
      '#355b57',
      1,
      grain,
    ) +
    times(7, (index) =>
      brush(
        [
          [865 + index * 6, 557],
          [970 + index * 19, 397 - index * 16],
          [1260 + index * 10, 247 + index * 36],
          [1081 + index * 20, 653 + index * 20],
        ],
        45 - index * 2.8,
        index % 3 ? '#355b57' : '#59777a',
        0.98,
      ),
    )
  return (
    group(
      'earth',
      wash('M421 838Q726 793 1168 844Q1126 900 473 888Z', '#6b715a', 0.17) +
        times(8, (index) =>
          brush(
            [
              [474 + index * 76, 852],
              [476 + index * 76, 828],
              [487 + index * 76, 817],
              [478 + index * 76, 800],
            ],
            7,
            '#7d835c',
            0.6,
          ),
        ),
    ) +
    group(
      'legs',
      path(
        'M719 681L714 764L685 841L703 848L739 777L746 692ZM813 680L822 773L864 834L881 830L848 769L845 672Z',
        '#aa8c4d',
        1,
        grain,
      ) + line('M695 840L653 852M695 840L714 861M871 832L922 847M871 832L853 855', '#89703d', 8),
    ) +
    group('tail', tail) +
    group(
      'body',
      path(
        'M606 389C697 378 772 443 863 493Q970 486 960 579Q966 703 812 729Q639 732 599 601Q558 537 606 389Z',
        '#96523b',
        1,
        grain,
      ) +
        path('M729 482Q876 455 921 560Q943 656 820 685Q766 625 729 482Z', '#655741', 1, grain) +
        times(14, (index) =>
          transform(
            path('M0 0Q51 -13 71 24Q24 41 0 0Z', index % 3 ? '#9b7849' : '#bc955a', 0.88, grain),
            `translate(${724 + (index % 4) * 38} ${501 + Math.floor(index / 4) * 31}) rotate(${19 + (index % 4) * 8})`,
          ),
        ) +
        path(
          'M605 308Q675 343 713 453L740 535Q656 571 595 505Q564 443 568 368Z',
          '#c39c59',
          1,
          grain,
        ) +
        times(17, (index) =>
          brush(
            [
              [582 + index * 6, 337 + (index % 3) * 8],
              [581 + index * 7, 399],
              [598 + index * 7, 464],
              [594 + index * 8, 498 + (index % 3) * 16],
            ],
            15,
            index % 3 ? '#aa7442' : '#e0b566',
            0.92,
          ),
        ),
    ) +
    group(
      'head',
      path(
        'M562 285Q568 255 594 257Q622 250 640 285L645 337Q625 368 588 350L565 325Z',
        '#c5985c',
        1,
        grain,
      ) +
        path(
          'M568 278Q549 259 556 237L574 249Q564 214 583 207L596 232Q600 199 619 209L624 242Q647 222 650 243L644 281Z',
          '#aa4a3d',
          1,
          grain,
        ) +
        path(
          'M568 313Q546 322 555 347Q568 372 583 350Q597 373 606 352L598 319Z',
          '#a2483c',
          1,
          grain,
        ) +
        path('M566 293L517 312L566 317Z', '#b9a26d') +
        ellipse(588, 292, 7, 7, '#d6aa5d') +
        ellipse(587, 292, 3.9, 4.4, '#252d2c') +
        line('M573 283Q585 277 599 283', '#654931', 3),
    )
  )
}

function geese() {
  const goose = (horizontal, vertical, scale, angle) =>
    transform(
      path(
        'M-182 70Q-221 37 -247 39L-230 104Q-188 179 -54 181Q70 181 107 124Q132 91 114 52Q94 15 75 -29L62 -130Q68 -171 44 -191Q6 -220 -24 -187Q-42 -162 -22 -137L9 -125L12 -25Q2 39 -55 52Q-133 32 -182 70Z',
        'url(#white)',
      ) +
        path('M-204 89Q-111 57 -40 93Q-10 116 -61 150Q-128 170 -204 119Z', '#c9d1c5', 1, grain) +
        times(9, (index) =>
          line(
            `M${-185 + index * 15} ${92 + (index % 2) * 4}Q${-147 + index * 13} ${132 + (index % 3) * 3} ${-90 + index * 12} 130`,
            '#8eaaa6',
            2.5,
            0.48,
          ),
        ) +
        path('M-26 -173L-73 -161Q-87 -149 -66 -143L-24 -145Z', '#c99454', 1, grain) +
        ellipse(-5, -174, 4, 4, '#273b39') +
        line('M-6 -182L5 -183', '#879d99', 2.5) +
        path('M21 -130Q48 -101 47 -37Q59 24 86 65L64 80Q29 33 25 -30Z', '#b1c2b9', 0.5, grain),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'water',
      wash('M350 674Q611 607 1159 705Q1244 786 1107 833Q668 864 341 774Z', '#829b91', 0.17) +
        times(8, (index) =>
          line(
            `M${392 + index * 9} ${714 + index * 19}Q${775 + index * 13} ${686 + index * 23} ${1220 - index * 27} ${723 + index * 19}`,
            '#78918a',
            2,
            0.36,
          ),
        ),
    ) +
    group('far-goose', goose(996, 526, 0.72, 8)) +
    group('near-goose', goose(733, 631, 1.1, -4)) +
    group(
      'reeds',
      brush(
        [
          [1161, 832],
          [1199, 697],
          [1170, 498],
          [1262, 391],
        ],
        13,
        '#7d8858',
      ) +
        leaf(1201, 637, 66, 0.8, '#8d975f') +
        leaf(1191, 702, -26, 0.92, '#667b56'),
    )
  )
}

function ruyi() {
  return (
    group(
      'shadow',
      wash(
        'M415 803C673 681 979 650 1149 673Q1237 702 1128 724Q740 742 468 831Q385 843 415 803Z',
        '#6c816b',
        0.11,
      ),
    ) +
    group(
      'jade-sceptre',
      path(
        'M402 758Q588 642 777 596Q919 562 1061 442L1111 470Q966 634 793 660Q619 689 435 797Z',
        'url(#jade)',
      ) +
        path(
          'M420 770Q619 663 795 635Q966 605 1084 461L1097 474Q979 628 799 653Q610 689 433 788Z',
          '#71968b',
          0.5,
          grain,
        ) +
        path(
          'M1033 474Q950 483 937 422Q920 378 959 352Q957 291 1009 283Q1038 242 1086 260Q1115 222 1152 245Q1207 227 1225 273Q1286 272 1294 320Q1336 361 1299 403Q1314 461 1260 476Q1236 521 1194 498Q1144 548 1107 506Q1070 521 1033 474Z',
          'url(#jade)',
        ) +
        line(
          'M1033 454Q983 447 987 402Q973 361 1019 345Q1002 303 1052 309Q1081 271 1115 302Q1160 267 1193 310Q1242 299 1253 340Q1295 368 1254 403Q1270 446 1226 452Q1187 488 1155 457Q1117 494 1089 462Q1056 482 1033 454Z',
          '#819e87',
          5,
          0.65,
        ) +
        line(
          'M1038 397Q1094 340 1150 366Q1215 378 1229 347M1092 425Q1151 388 1196 421',
          '#dce0be',
          6,
          0.68,
        ) +
        ellipse(446, 768, 13, 8, '#739c91'),
    ) +
    group(
      'silk-knot',
      line(
        'M449 767Q394 786 468 815Q508 843 508 795Q493 769 449 787Q410 775 404 815Q415 839 449 797',
        '#995a56',
        9,
      ) +
        times(11, (index) =>
          brush(
            [
              [447 + index * 3, 805],
              [440 + index * 5, 845],
              [463 + index * 5, 873],
              [456 + index * 6, 914],
            ],
            6,
            index % 3 ? '#a76560' : '#bf8880',
            0.96,
          ),
        ),
    )
  )
}

function hairOrnaments() {
  const teeth = times(24, (index) =>
    path(
      `M${-202 + index * 16} 14L${-198 + index * 16} 172Q${-192 + index * 16} 183 ${-189 + index * 16} 170L${-187 + index * 16} 14Z`,
      'url(#wood)',
      1,
      grain,
    ),
  )
  const blossom = (horizontal, vertical, scale) =>
    transform(
      times(5, (index) =>
        transform(
          path('M0 0Q-32 -23 -19 -58Q16 -62 27 -30Q27 -8 0 0Z', 'url(#gold)', 1, grain),
          `rotate(${index * 72})`,
        ),
      ) +
        ellipse(0, 0, 12, 12, '#b4774d') +
        ellipse(-2, -3, 6, 6, '#d5b175'),
      `translate(${horizontal} ${vertical}) scale(${scale})`,
    )
  return (
    group(
      'comb',
      transform(
        teeth +
          path(
            'M-220 29Q-248 -30 -192 -100Q-118 -182 30 -171Q162 -166 204 -82Q233 -39 208 29Z',
            'url(#wood)',
            1,
            grain,
          ) +
          path(
            'M-198 -18Q-206 -74 -140 -112Q9 -188 155 -95Q185 -72 186 -18Z',
            '#b18b56',
            1,
            grain,
          ) +
          line('M-172 -45Q-50 -126 91 -65Q140 -49 161 -32', '#ceb27b', 4, 0.65) +
          line('M-191 7L191 7', '#584b38', 5),
        'translate(674 604) rotate(-18)',
      ),
    ) +
    group(
      'jade-pin',
      transform(
        path('M-9 0L9 0L12 435L0 477L-11 435Z', 'url(#gold)', 1, grain) +
          path(
            'M-52 3Q-84 -52 -25 -75Q-27 -121 21 -112Q70 -119 75 -73Q125 -31 78 5Q29 31 -6 9Z',
            'url(#jade)',
          ) +
          line('M-26 -36Q8 -77 55 -38Q77 -7 42 -4Q12 -9 20 -36', '#799d8d', 4, 0.65),
        'translate(1070 285) rotate(33)',
      ),
    ) +
    group(
      'flower-pin',
      transform(
        path('M-8 0L8 0L7 391L0 427L-7 389Z', 'url(#gold)', 1, grain) +
          blossom(0, 0, 1.25) +
          blossom(60, 42, 0.62) +
          line('M-29 -6Q-68 7 -77 73M13 21Q5 67 34 97', '#9f804a', 4) +
          ellipse(-77, 79, 10, 14, '#d7d6ba') +
          ellipse(34, 103, 11, 15, '#d7d6ba'),
        'translate(863 250) rotate(28)',
      ),
    )
  )
}

function ceramicPillow() {
  return (
    group('shadow', wash('M359 766Q781 699 1255 762Q1137 862 478 836Z', '#7e8d75', 0.18)) +
    group(
      'body',
      path(
        'M380 483Q524 405 794 435Q1058 401 1204 477L1194 710Q1114 826 788 800Q486 824 391 721Z',
        'url(#ceramic)',
      ) +
        path('M791 527Q1024 549 1204 477L1194 710Q1096 815 788 800Z', '#5d8b82', 0.57, grain) +
        path(
          'M380 483Q505 391 712 424Q786 446 863 420Q1088 387 1204 477Q1100 583 866 561Q794 543 710 565Q494 582 380 483Z',
          '#b7cbb4',
        ) +
        path(
          'M423 481Q551 425 708 453Q786 476 865 449Q1030 420 1157 479Q1068 546 865 532Q795 514 711 539Q528 549 423 481Z',
          '#a5bfaa',
          1,
          grain,
        ) +
        line('M403 504Q507 590 715 573Q797 549 868 571Q1098 592 1182 500', '#d1d8bc', 5, 0.76) +
        line('M411 712Q516 790 784 767Q1100 795 1171 704', '#456e65', 4, 0.65) +
        ellipse(1100, 688, 18, 11, '#40685f'),
    ) +
    group(
      'painted-floral-scroll',
      transform(
        line(
          'M-207 1Q-107 -80 -17 -11Q55 44 105 -8Q152 -46 203 -14M-78 -36Q-84 14 -135 26M77 10Q92 -45 43 -51',
          '#416c67',
          5,
          0.8,
        ) +
          leaf(-139, 23, -54, 0.34, '#567e70') +
          leaf(46, -50, -92, 0.3, '#658b77') +
          times(7, (index) =>
            transform(
              ellipse(0, -18, 12, 24, '#d8d9b9', 0.94),
              `translate(-14 -4) rotate(${index * 51.4})`,
            ),
          ) +
          ellipse(-14, -4, 12, 9, '#9d9e66'),
        'translate(791 489) scale(1 .46)',
      ),
    )
  )
}

function teaBasket() {
  const weave =
    times(25, (index) =>
      line(
        `M${571 + index * 19} 468Q${632 + index * 13} 637 ${607 + index * 18} 834`,
        index % 3 ? '#c1a471' : '#e0c28d',
        6,
        0.78,
      ),
    ) +
    times(23, (index) =>
      line(
        `M586 ${474 + index * 16}Q801 ${540 + index * 12} 1017 ${468 + index * 16}`,
        '#6f6648',
        4,
        0.63,
      ),
    )
  return (
    group('shadow', wash('M378 813Q734 756 1240 820Q1042 893 433 862Z', '#6d7b57', 0.17)) +
    group(
      'basket-handle',
      line('M629 487Q548 211 798 211Q1075 205 993 486', '#6e6248', 20) +
        line('M630 480Q561 231 799 225Q1054 220 992 478', '#b89d69', 8),
    ) +
    group(
      'tea-leaves',
      ellipse(809, 475, 209, 60, '#3e6854') +
        times(20, (index) =>
          leaf(
            653 + index * 17,
            476 + Math.sin(index * 2) * 14,
            -45 + index * 8,
            0.45 + (index % 3) * 0.08,
          ),
        ),
    ) +
    group(
      'woven-basket',
      path('M600 463Q797 509 1020 458L964 790Q797 854 665 784Z', 'url(#wood)', 1, grain) +
        group('woven-strips', weave, 'clip-path="url(#basket)"') +
        line('M600 463Q797 509 1020 458', '#cbb17b', 17) +
        line('M665 784Q797 854 964 790', '#776745', 14),
    ) +
    group(
      'bamboo-hat',
      path('M375 747Q449 635 499 525Q574 629 685 731Q570 810 375 747Z', '#b39762', 1, grain) +
        path('M375 747Q533 784 685 731Q579 837 391 775Z', '#867144', 1, grain) +
        times(19, (index) =>
          line(
            `M499 535Q${444 + index * 8} 640 ${391 + index * 15} ${750 + Math.sin((index / 18) * Math.PI) * 16}`,
            '#d8ba7d',
            3,
            0.6,
          ),
        ) +
        line('M430 693Q535 727 627 682M412 722Q537 754 654 708', '#806e44', 4, 0.6) +
        ellipse(499, 533, 10, 5, '#7b724e'),
    )
  )
}

function readingLamp() {
  return (
    group('shadow', wash('M330 808Q791 728 1240 792Q1128 886 386 859Z', '#7e7d64', 0.16)) +
    group(
      'closed-manuscripts',
      transform(
        path('M-231 -60L167 -106L224 -56L-174 0Z', '#ddd0ae') +
          path('M-174 0L224 -56L224 5L-173 61Z', '#bdaf8d') +
          path('M-231 -60L-174 0L-173 61L-231 -2Z', '#a5997a') +
          line('M-166 13L214 -40M-166 28L214 -25M-166 44L214 -9', '#e3d3af', 3, 0.8) +
          path('M-240 -67L165 -115L230 -59L-175 4Z', '#526d77', 1, grain) +
          path('M-177 62L229 6L229 18L-176 76L-240 7L-240 -4Z', '#45606a', 1, grain) +
          path('M-114 -76L-34 -85L-3 -59L-84 -48Z', '#d8c8a0'),
        'translate(578 715) rotate(-6)',
      ),
    ) +
    group(
      'pedestal-lamp',
      ellipse(1011, 795, 131, 34, '#76644d', 1, grain) +
        path(
          'M955 760Q987 673 976 571L1044 571Q1033 684 1070 760Q1078 791 1011 793Q947 791 955 760Z',
          'url(#clay)',
          1,
          grain,
        ) +
        ellipse(1011, 566, 50, 15, '#6c604b') +
        path('M832 463Q1000 535 1190 464L1153 546Q1012 607 866 542Z', 'url(#clay)', 1, grain) +
        ellipse(1011, 464, 179, 46, '#a18860') +
        ellipse(1011, 466, 155, 31, '#615a45') +
        ellipse(1011, 469, 136, 21, '#8e8050', 0.62) +
        path('M860 477L825 456L818 434L835 427L854 453L881 461Z', '#554b37') +
        path(
          'M825 436C774 405 808 351 817 315Q849 367 839 402Q853 424 825 436Z',
          '#cd974e',
          0.95,
          grain,
        ) +
        path('M826 428Q803 407 821 375Q840 410 826 428Z', '#e9bf70') +
        line('M902 518Q1008 554 1125 516', '#bc9e74', 4, 0.66),
    )
  )
}

function watersidePavilion() {
  const curvePoint = (points, fraction) =>
    [0, 1].map(
      (axis) =>
        (1 - fraction) ** 3 * points[0][axis] +
        3 * (1 - fraction) ** 2 * fraction * points[1][axis] +
        3 * (1 - fraction) * fraction ** 2 * points[2][axis] +
        fraction ** 3 * points[3][axis],
    )
  const boughs = [
    [
      [386, 493],
      [322, 400],
      [247, 345],
      [177, 359],
    ],
    [
      [383, 452],
      [402, 314],
      [495, 273],
      [601, 299],
    ],
    [
      [383, 421],
      [330, 315],
      [268, 228],
      [193, 233],
    ],
    [
      [401, 396],
      [462, 234],
      [585, 192],
      [726, 250],
    ],
    [
      [394, 351],
      [405, 207],
      [328, 160],
      [265, 200],
    ],
    [
      [415, 354],
      [512, 311],
      [635, 321],
      [743, 378],
    ],
  ]
  const curtain = (layer) =>
    times(6, (boughIndex) => {
      const bough = boughs[boughIndex]
      return times(12, (strandIndex) => {
        const fraction =
          0.16 + strandIndex * 0.073 + Math.sin(strandIndex * 2.4 + boughIndex) * 0.019
        const root = curvePoint(bough, fraction)
        const phase = strandIndex * 2.37 + boughIndex * 1.91 + layer * 2.1
        const length = 177 + 114 * Math.sin(fraction * Math.PI) + 52 * Math.sin(phase) + layer * 42
        const drift = 63 + 34 * Math.cos(phase * 0.53) + layer * 14
        const start = [root[0] + layer * 5, root[1] + layer * 10]
        const points = [
          start,
          [start[0] - 21 + Math.sin(phase) * 12, start[1] + length * 0.32],
          [start[0] + drift * 1.18, start[1] + length * 0.78],
          [start[0] + drift, start[1] + length],
        ]
        const color = ['#8d9b62', '#6d8751', '#506f48'][layer]
        const stem = line(
          `M${start.join(' ')}C${points
            .slice(1)
            .map((point) => point.join(' '))
            .join(' ')}`,
          color,
          layer === 2 ? 1.75 : 1.35,
          0.44 + layer * 0.12,
        )
        const leaves = times(12, (leafIndex) => {
          const position = 0.1 + leafIndex * 0.069 + Math.sin(phase + leafIndex) * 0.012
          const center = curvePoint(points, position)
          const direction = leafIndex % 2 ? 1 : -1
          const size = 25 + 11 * Math.sin(phase + leafIndex * 0.82)
          const tipX = 14 + direction * (10 + Math.cos(phase) * 4)
          const tipY = size + direction * 5
          const bend = tipX * 0.38 + direction * 7
          return path(
            `M${center[0]} ${center[1]}q${bend - 3} ${size * 0.24} ${tipX} ${tipY}q${-tipX * 0.65 + direction * 5} ${-size * 0.27} ${-tipX} ${-tipY}Z`,
            leafIndex % 5 === 0 ? '#a2a66a' : color,
            0.82 + layer * 0.07,
          )
        })
        const newGrowth =
          layer === 1 && strandIndex % 3 === 1
            ? transform(
                path('M0 0Q1 -23 8 -41Q10 -15 0 0Z', '#8d9c62', 0.87) +
                  path('M4 4Q21 -7 40 -7Q24 1 4 4Z', '#758d55', 0.9),
                `translate(${start[0]} ${start[1]}) rotate(${35 + Math.sin(phase) * 23})`,
              )
            : ''
        return stem + leaves + newGrowth
      })
    })
  const project = (horizontal, depth, elevation) => [
    850 + horizontal + depth * 0.43,
    786 - depth * 0.24 - elevation,
  ]
  const polygon = (points, color) =>
    path('M' + points.map((point) => point.join(' ')).join('L') + 'Z', color)
  const solid = (horizontal, depth, width, length, elevation, height, front, top, side) => {
    const nearLeft = project(horizontal, depth, elevation)
    const nearRight = project(horizontal + width, depth, elevation)
    const farRight = project(horizontal + width, depth + length, elevation)
    const farLeft = project(horizontal, depth + length, elevation)
    const lift = (point) => [point[0], point[1] - height]
    return (
      polygon([nearRight, farRight, lift(farRight), lift(nearRight)], side) +
      polygon([nearLeft, nearRight, lift(nearRight), lift(nearLeft)], front) +
      polygon([lift(nearLeft), lift(nearRight), lift(farRight), lift(farLeft)], top)
    )
  }
  const post = (horizontal, depth, color, highlight, shade) =>
    solid(horizontal, depth, 17, 17, 18, 230, color, highlight, shade)
  const rail = (horizontal, depth, width, length, elevation) =>
    solid(horizontal, depth, width, length, elevation, 9, '#8e7450', '#c1a677', '#776446')
  const braces = (horizontal, depth, direction) => {
    const origin = project(horizontal, depth, 222)
    return transform(
      path(
        `M0 -8L${direction * 60} -8L${direction * 60} 0Q${direction * 33} 0 ${direction * 14} 30L0 30Z`,
        '#8e7250',
      ),
      `translate(${origin.join(' ')})`,
    )
  }
  const frame = group(
    'pavilion-rear-frame',
    post(0, 220, '#99815e', '#baa078', '#806e50') +
      post(360, 220, '#99815e', '#baa078', '#806e50') +
      solid(0, 220, 377, 18, 223, 25, '#9b815c', '#baa17b', '#7f6c4e') +
      solid(360, 0, 18, 237, 223, 25, '#8b7051', '#b69b74', '#756246') +
      rail(20, 220, 339, 12, 93) +
      rail(20, 220, 339, 12, 40) +
      times(10, (index) =>
        solid(30 + index * 33, 222, 6, 7, 48, 45, '#a68c64', '#c3ab81', '#8b7855'),
      ) +
      solid(18, 196, 341, 35, 55, 9, '#a48b63', '#c5ae82', '#8c7854') +
      rail(360, 20, 12, 199, 93) +
      rail(360, 20, 12, 199, 40) +
      times(6, (index) =>
        solid(362, 31 + index * 33, 6, 7, 48, 45, '#a18a62', '#bda77e', '#7f704f'),
      ) +
      solid(340, 18, 32, 201, 55, 9, '#a18a62', '#bba57b', '#806e4d'),
    grain,
  )
  const frontFrame = group(
    'pavilion-open-columns',
    post(0, 0, '#8e7250', '#b59b71', '#695a40') +
      post(360, 0, '#8e7250', '#b59b71', '#695a40') +
      solid(0, 0, 377, 18, 223, 25, '#8d7051', '#b39971', '#6f5b42') +
      solid(0, 0, 18, 237, 223, 25, '#927754', '#b59b75', '#766448') +
      braces(17, 0, 1) +
      braces(360, 0, -1) +
      rail(20, 0, 108, 12, 90) +
      rail(20, 0, 108, 12, 40) +
      rail(250, 0, 109, 12, 90) +
      rail(250, 0, 109, 12, 40) +
      times(3, (index) =>
        solid(37 + index * 32, 2, 6, 7, 48, 42, '#a18a62', '#bda77e', '#7f704f'),
      ) +
      times(3, (index) =>
        solid(266 + index * 32, 2, 6, 7, 48, 42, '#a18a62', '#bda77e', '#7f704f'),
      ),
    grain,
  )
  const peak = project(180, 110, 425)
  const leftEave = project(-70, -55, 264)
  const rightEave = project(430, -55, 264)
  const farEave = project(430, 280, 264)
  const edgeCenter = [(leftEave[0] + rightEave[0]) / 2, leftEave[1] + 27]
  const frontSlope = `M${peak.join(' ')}C${peak[0] - 22} ${peak[1] + 80} ${leftEave[0] + 130} ${leftEave[1] - 8} ${leftEave.join(' ')}Q${edgeCenter.join(' ')} ${rightEave.join(' ')}C${rightEave[0] - 100} ${rightEave[1] - 20} ${peak[0] + 55} ${peak[1] + 85} ${peak.join(' ')}Z`
  const sideSlope = `M${peak.join(' ')}C${peak[0] + 74} ${peak[1] + 55} ${farEave[0] - 115} ${farEave[1] + 5} ${farEave.join(' ')}Q${farEave[0] - 41} ${farEave[1] + 47} ${rightEave.join(' ')}C${rightEave[0] - 100} ${rightEave[1] - 20} ${peak[0] + 55} ${peak[1] + 85} ${peak.join(' ')}Z`
  const leftHip = [
    peak,
    [peak[0] - 22, peak[1] + 80],
    [leftEave[0] + 130, leftEave[1] - 8],
    leftEave,
  ]
  const rightHip = [
    peak,
    [peak[0] + 55, peak[1] + 85],
    [rightEave[0] - 100, rightEave[1] - 20],
    rightEave,
  ]
  const farHip = [peak, [peak[0] + 74, peak[1] + 55], [farEave[0] - 115, farEave[1] + 5], farEave]
  const roofTile = (firstHip, secondHip, control, fraction, color) => {
    const firstEnd = firstHip[3]
    const secondEnd = secondHip[3]
    const offset = [0, 1].map(
      (axis) =>
        2 * fraction * (1 - fraction) * (control[axis] - (firstEnd[axis] + secondEnd[axis]) / 2),
    )
    const points = Array.from({ length: 24 }, (_, index) => {
      const height = 0.055 + (index * 0.945) / 23
      const first = curvePoint(firstHip, height)
      const second = curvePoint(secondHip, height)
      return [0, 1].map(
        (axis) =>
          first[axis] * (1 - fraction) + second[axis] * fraction + offset[axis] * height ** 2,
      )
    })
    return line('M' + points.map((point) => point.join(' ')).join('L'), color, 1.5, 0.43)
  }
  const tiledRoof = group(
    'pavilion-hip-roof',
    path(frontSlope, 'url(#roof)', 1, grain) +
      path(sideSlope, '#536b6b', 1, grain) +
      times(22, (index) =>
        roofTile(leftHip, rightHip, edgeCenter, 0.035 + index * 0.044, '#b5bdac'),
      ) +
      times(8, (index) =>
        roofTile(
          rightHip,
          farHip,
          [farEave[0] - 41, farEave[1] + 47],
          0.08 + index * 0.12,
          '#91a19a',
        ),
      ) +
      path(
        `M${leftEave.join(' ')}Q${edgeCenter.join(' ')} ${rightEave.join(' ')}Q${farEave[0] - 41} ${farEave[1] + 47} ${farEave.join(' ')}L${farEave[0]} ${farEave[1] + 7}Q${farEave[0] - 41} ${farEave[1] + 54} ${rightEave[0]} ${rightEave[1] + 7}Q${edgeCenter[0]} ${edgeCenter[1] + 7} ${leftEave[0]} ${leftEave[1] + 7}Z`,
        '#3e5554',
        1,
        grain,
      ) +
      line(
        `M${peak.join(' ')}C${peak[0] + 55} ${peak[1] + 85} ${rightEave[0] - 100} ${rightEave[1] - 20} ${rightEave.join(' ')}`,
        '#a0afa0',
        3,
        0.75,
      ) +
      ellipse(peak[0], peak[1] + 3, 18, 6, '#6a8076') +
      path(
        `M${peak[0] - 7} ${peak[1]}Q${peak[0] - 15} ${peak[1] - 14} ${peak[0]} ${peak[1] - 32}Q${peak[0] + 15} ${peak[1] - 14} ${peak[0] + 7} ${peak[1]}Z`,
        '#6f8577',
        1,
        grain,
      ),
  )
  const terrace = group(
    'pavilion-stone-terrace',
    solid(-66, -55, 492, 330, -14, 32, '#929a80', '#b9b18e', '#7f8c78') +
      solid(124, -95, 134, 40, -16, 18, '#949b80', '#b5ad88', '#808c77') +
      line('M797 815Q1023 830 1291 806', '#7f9988', 2, 0.36),
    grain,
  )
  return (
    group(
      'distant-water',
      wash(
        'M270 665Q443 592 659 630Q849 563 1118 605Q1306 586 1428 645L1393 694Q951 652 702 694Z',
        '#8f9c89',
        0.16,
      ) +
        wash('M291 778Q787 678 1414 756Q1290 864 424 873Z', '#829d8d', 0.13) +
        times(10, (index) =>
          line(
            `M${663 + index * 24} ${776 + index * 10}Q1075 ${765 + index * 11} ${1401 - index * 21} ${777 + index * 10}`,
            '#7e998d',
            1.8,
            0.35,
          ),
        ),
    ) +
    group(
      'natural-bank',
      path(
        'M178 812Q240 745 354 749Q436 711 548 749Q628 758 763 752L818 790Q645 800 556 837Q414 825 303 859Q208 863 178 838Z',
        '#a3a174',
        0.65,
        grain,
      ) +
        brush(
          [
            [217, 829],
            [280, 789],
            [350, 811],
            [421, 785],
          ],
          13,
          '#848761',
          0.55,
        ) +
        times(9, (index) =>
          brush(
            [
              [281 + index * 31, 804 + Math.sin(index) * 11],
              [284 + index * 31, 785],
              [270 + index * 32, 767],
              [286 + index * 31, 748 + (index % 3) * 8],
            ],
            5,
            '#7e8659',
            0.7,
          ),
        ),
    ) +
    group('willow-back-curtain', curtain(0), grain) +
    terrace +
    frame +
    frontFrame +
    tiledRoof +
    group(
      'willow-old-trunk',
      path(
        'M326 822Q368 758 375 676C389 574 369 492 348 433Q317 367 328 302Q334 259 366 229L378 236Q348 279 352 319Q354 370 383 415Q411 475 413 544Q424 653 390 745Q375 791 350 819L337 828Z',
        '#716b50',
        1,
        grain,
      ) +
        path(
          'M347 794Q313 815 287 821L271 827Q310 830 336 816Q363 824 388 818L409 813Q371 814 359 802Z',
          '#77754f',
          0.9,
          grain,
        ) +
        path(
          'M331 817Q375 730 387 630Q398 520 365 437Q334 367 342 307L351 286Q341 354 378 424Q413 513 407 601Q402 725 350 819Z',
          '#a69c72',
          0.5,
          grain,
        ) +
        times(9, (index) =>
          brush(
            [
              [349 + Math.sin(index) * 9, 771 - index * 48],
              [366 + Math.sin(index) * 13, 747 - index * 47],
              [374 + Math.sin(index) * 10, 721 - index * 45],
              [372 + Math.sin(index) * 9, 704 - index * 45],
            ],
            4,
            '#474f3f',
            0.65,
          ),
        ) +
        times(6, (index) => {
          const bough = boughs[index]
          return brush(bough, 21 - index * 1.7, '#6b6950', 0.96)
        }),
    ) +
    group('willow-mid-curtain', curtain(1), grain) +
    group('willow-front-curtain', curtain(2), grain)
  )
}

const studies = [
  {
    id: 'wisteria-cascade',
    name: '藤萝垂紫',
    category: 'color',
    theme: '紫藤 / 老蔓与串花',
    note: '曲折老蔓承接长短不齐的花序，灰紫与新绿相映。',
    draw: wisteria,
  },
  {
    id: 'persimmon-autumn',
    name: '柿染秋枝',
    category: 'color',
    theme: '秋果 / 橙赭与枯叶',
    note: '柿果的萼、果柄和承重枝连续，橙红果面保留同色转暗。',
    draw: persimmons,
  },
  {
    id: 'magnolia-spring',
    name: '辛夷照春',
    category: 'color',
    theme: '木兰 / 粉白与虬枝',
    note: '大瓣木兰沿枝向舒展，实体浅瓣与透明花间留白分开。',
    draw: magnolias,
  },
  {
    id: 'magpies-plum',
    name: '双鹊报春',
    category: 'figures',
    theme: '喜鹊 / 长尾与梅枝',
    note: '两鹊改变俯仰与体量，黑白翼面、蓝灰长尾及扣枝足爪明确。',
    draw: magpies,
  },
  {
    id: 'rooster-dawn',
    name: '雄鸡司晨',
    category: 'figures',
    theme: '雄鸡 / 金颈与墨尾',
    note: '昂首立姿、红冠、金褐颈羽与弧形尾羽构成主势，双足落地。',
    draw: rooster,
  },
  {
    id: 'geese-reed-water',
    name: '双鹅清波',
    category: 'figures',
    theme: '白鹅 / 芦汀与水纹',
    note: '两鹅以白羽实体、连续颈身与背侧折翼表现游姿，江水保持透明。',
    draw: geese,
  },
  {
    id: 'jade-ruyi',
    name: '玉意流云',
    category: 'color',
    theme: '如意 / 青玉与绛绦',
    note: '云头、弯柄与绦结连续衔接，低对比青玉层次表现厚实温润。',
    draw: ruyi,
  },
  {
    id: 'hairpins-comb',
    name: '簪梳凝香',
    category: 'color',
    theme: '梳篦 / 玉簪与金花',
    note: '木梳疏齿与两支簪体交错，珠坠有挂接，花头和长针保持连接。',
    draw: hairOrnaments,
  },
  {
    id: 'celadon-pillow',
    name: '瓷枕清梦',
    category: 'color',
    theme: '瓷枕 / 豆形与卷草',
    note: '枕面微凹、器壁与底缘连续，青瓷面内绘花枝，不以通透代替釉色。',
    draw: ceramicPillow,
  },
  {
    id: 'tea-basket-hat',
    name: '茶篓春采',
    category: 'color',
    theme: '采茶 / 竹篓与箬笠',
    note: '提梁落到篓口两侧，编织随篓腹弯曲，箬笠叠放在前景。',
    draw: teaBasket,
  },
  {
    id: 'earthen-lamp-books',
    name: '陶灯书影',
    category: 'color',
    theme: '灯火 / 陶盏与书册',
    note: '灯盘、灯柱与底座相接，灯芯伸出油盘边缘，书页与封面有厚度。',
    draw: readingLamp,
  },
  {
    id: 'waterside-pavilion',
    name: '柳岸水榭',
    category: 'ink',
    theme: '园林 / 灰瓦与临水台',
    note: '细长披针柳叶随柔长垂枝向右飘拂，浓淡柳幕围合开敞水亭，梁柱落在低矮临水台基。',
    draw: watersidePavilion,
  },
]

mkdirSync(destination, { recursive: true })
for (const study of studies) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}。原创代码彩墨意象，非文物、古迹或技术复原。透明背景。</desc>${definitions}${study.draw()}</svg>`
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
console.log('Generated twelve garden ink studies')
