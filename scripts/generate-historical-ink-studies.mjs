import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const destination = join(root, 'resources/visuals/traditional-culture/historical-studies/ink-wash')
mkdirSync(destination, { recursive: true })
const ink = '#303b3b'
const paperWhite = '#e7dcc1'
const number = (value) => Number(value.toFixed(2))
const repeat = (count, callback) =>
  Array.from({ length: count }, (_, index) => callback(index)).join('')

function painter(seed) {
  let state = seed
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
  const path = (outline, color = ink, opacity = 1, attributes = '') =>
    `<path d="${outline}" fill="${color}" opacity="${opacity}" ${attributes}/>`
  const line = (outline, color = ink, width = 2, opacity = 1) =>
    `<path d="${outline}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`
  const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1, attributes = '') =>
    `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${color}" opacity="${opacity}" ${attributes}/>`
  const group = (identity, content, attributes = '') =>
    `<g id="${identity}" ${attributes}>${content}</g>`
  function brush(points, width, color = ink, opacity = 1, dry = 0.25) {
    const curve = (fraction) =>
      [0, 1].map(
        (axis) =>
          (1 - fraction) ** 3 * points[0][axis] +
          3 * (1 - fraction) ** 2 * fraction * points[1][axis] +
          3 * (1 - fraction) * fraction ** 2 * points[2][axis] +
          fraction ** 3 * points[3][axis],
      )
    function ribbon(breadth, offset, alpha) {
      const left = []
      const right = []
      for (let step = 0; step <= 40; step++) {
        const fraction = step / 40
        const center = curve(fraction)
        const before = curve(Math.max(0, fraction - 0.001))
        const after = curve(Math.min(1, fraction + 0.001))
        const length = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
        const normal = [-(after[1] - before[1]) / length, (after[0] - before[0]) / length]
        const pressure = (0.3 + Math.sin(fraction * Math.PI) * 0.7) * (1 - fraction * 0.88)
        const radius = (breadth * pressure * (0.94 + random() * 0.12)) / 2
        left.push(center.map((value, axis) => number(value + normal[axis] * (offset + radius))))
        right.unshift(center.map((value, axis) => number(value + normal[axis] * (offset - radius))))
      }
      return path(
        'M' + [...left, ...right].map((point) => point.join(' ')).join('L') + 'Z',
        color,
        alpha,
      )
    }
    let content = ribbon(width, 0, opacity * (1 - dry * 0.45))
    content += repeat(Math.min(12, Math.max(3, Math.round(width / 4))), (index) =>
      ribbon(
        0.6 + random() * 1.1,
        (index / Math.max(1, Math.min(12, Math.round(width / 4))) - 0.5) * width * 0.65,
        opacity * dry * (0.25 + random() * 0.4),
      ),
    )
    return content
  }
  const wash = (outline, color, opacity = 1) => path(outline, color, opacity, 'filter="url(#wash)"')
  return { path, line, ellipse, group, brush, wash, random }
}

const definitions = `<defs>
<filter id="wash" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
<filter id="pigment" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="43" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .16 0 0 0 .84" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in"/></filter>
<linearGradient id="bronze" x1="0" y1="0" x2="1" y2=".4"><stop stop-color="#473f32"/><stop offset=".3" stop-color="#a18555"/><stop offset=".67" stop-color="#7b6746"/><stop offset="1" stop-color="#4d513e"/></linearGradient>
<radialGradient id="sun"><stop stop-color="#bb6445" stop-opacity=".54"/><stop offset=".85" stop-color="#c47c52" stop-opacity=".43"/><stop offset="1" stop-color="#c47c52" stop-opacity="0"/></radialGradient>
<linearGradient id="indigo-robe" x1="0" y1="0" x2="1" y2=".5"><stop stop-color="#415867"/><stop offset=".52" stop-color="#63767c"/><stop offset="1" stop-color="#394f5c"/></linearGradient>
<linearGradient id="purple-robe" x1="0" y1="0" x2="1" y2=".4"><stop stop-color="#927587"/><stop offset=".5" stop-color="#b298a2"/><stop offset="1" stop-color="#6e586f"/></linearGradient>
<radialGradient id="scholar-skin" cx=".43" cy=".34" r=".8"><stop stop-color="#ddbc98"/><stop offset=".67" stop-color="#ceaa82"/><stop offset="1" stop-color="#ae865e"/></radialGradient>
<radialGradient id="musician-skin" cx=".45" cy=".36" r=".85"><stop stop-color="#e6c6a6"/><stop offset=".65" stop-color="#d9b58e"/><stop offset="1" stop-color="#ba926e"/></radialGradient>
</defs>`

function scholar() {
  const p = painter(27041)
  const { path, line, ellipse, brush, group } = p
  let body = path(
    'M739 406Q656 414 602 481Q541 571 500 667Q532 717 579 743L646 709Q638 795 631 885Q799 928 1059 871Q1035 751 1018 636Q996 528 975 472L882 413Z',
    'url(#indigo-robe)',
    1,
    'filter="url(#pigment)"',
  )
  body += path('M739 426L676 503L635 735L640 880L751 904L762 632L819 506Z', '#283f4a', 0.78)
  body += path('M874 435L931 500L977 662L1040 859L925 885L856 633Z', '#64777a', 0.7)
  body += path('M752 389L796 402L835 395L888 420L824 493L728 430Z', '#c2b395')
  body += path('M759 413L812 448L865 409L879 426L820 478L741 428Z', '#8a6b4e')
  body += group(
    'robe-folds',
    brush(
      [
        [672, 481],
        [651, 558],
        [657, 638],
        [635, 698],
      ],
      14,
      ink,
      0.48,
    ) +
      brush(
        [
          [907, 479],
          [936, 552],
          [926, 622],
          [976, 672],
        ],
        18,
        ink,
        0.52,
      ) +
      brush(
        [
          [807, 539],
          [779, 679],
          [798, 789],
          [776, 893],
        ],
        18,
        '#a2a595',
        0.35,
      ) +
      brush(
        [
          [891, 650],
          [897, 737],
          [930, 813],
          [953, 864],
        ],
        12,
        ink,
        0.55,
      ) +
      brush(
        [
          [599, 540],
          [572, 608],
          [562, 664],
          [583, 686],
        ],
        13,
        '#a2a595',
        0.37,
      ),
  )
  body += path('M615 602L644 567L713 586L704 626L647 643Z', '#d2b18c')
  body += path('M924 569L958 580L963 622L920 639L892 623L901 594Z', '#d2b18c')
  body += group(
    'reading-scroll',
    path('M649 555Q756 571 905 543L926 642Q785 666 666 643Z', '#e0cfaa') +
      path('M664 564Q745 593 904 557L909 578Q766 607 667 583Z', '#b69d70', 0.5) +
      ellipse(651, 599, 13, 48, '#a5895e') +
      ellipse(920, 592, 11, 48, '#b99e70') +
      repeat(12, (index) =>
        line(`M${681 + index * 17} ${598 + Math.sin(index) * 4}l4 31`, '#9f906f', 1.2, 0.5),
      ),
  )
  body += line(
    'M635 589L654 595M637 600L656 604M939 589L921 596M942 602L922 609',
    '#896746',
    2,
    0.9,
  )
  let face = path(
    'M38 22Q77 -4 113 18L132 55L127 114L117 152L95 178L65 172L42 147L29 112L23 69Z',
    'url(#scholar-skin)',
  )
  face += path('M29 63L48 42L42 110L55 148L76 174L65 172L42 147L29 112Z', '#9e7856', 0.35)
  face += path('M106 45L128 68L124 116L113 140L108 110Z', '#a98561', 0.22)
  face += path(
    'M20 103Q9 66 26 29Q47 -2 83 -3Q117 0 132 29L137 61L124 78L114 43L77 26Q51 48 36 57L33 115Z',
    ink,
  )
  face += path('M66 5Q44 -7 49 -29Q63 -48 87 -34Q103 -16 86 5Z', ink)
  face += brush(
    [
      [32, 40],
      [51, 9],
      [91, 5],
      [120, 34],
    ],
    13,
    '#69726a',
    0.55,
  )
  face += path('M43 82Q60 75 80 80L89 85L87 89Q66 81 44 87Z', '#3d4139')
  face += path('M102 81L120 78L126 82L121 85L104 86Z', '#3d4139')
  face += path('M45 97Q61 88 80 93L89 98Q68 106 48 101Z', '#dfcba7')
  face += path('M102 96Q112 89 123 92L126 96L109 101Z', '#dfcba7')
  face += ellipse(61, 97, 3.5, 4, ink) + ellipse(111, 95, 2.8, 3.3, ink)
  face += line('M44 96Q65 85 88 97M102 95Q115 87 126 95', ink, 1.9)
  face += line('M48 106Q66 111 79 105M105 104L121 101', '#856749', 1.1, 0.65)
  face += line('M93 93Q86 116 89 123L97 131M105 113L112 126Q116 131 108 135', '#7e6042', 1.5)
  face += line('M96 136L100 137M108 135L111 133', '#674d36', 1.3)
  face += path('M86 146Q95 140 101 144L112 143L119 147L103 150L87 149Z', '#51493b')
  face += line('M88 152L112 150', '#67513c', 1.1)
  face += path('M66 151Q79 160 93 158L113 153L107 172L88 188L72 174Z', '#454940')
  face += repeat(7, (index) =>
    brush(
      [
        [74 + index * 5, 160],
        [72 + index * 5, 172],
        [83 + index * 3, 181],
        [86 + index * 2, 187],
      ],
      1.6,
      '#a3a08b',
      0.7,
    ),
  )
  return (
    group('scholar-robes', body) +
    group('scholar-head', face, 'transform="translate(741 184) scale(1.28)"')
  )
}

function musician() {
  const { path, line, ellipse, brush, group } = painter(27043)
  let body = path(
    'M728 414Q658 430 610 511Q567 601 532 706Q582 731 644 739L682 664Q658 773 635 843Q775 897 1097 845Q1044 734 1016 630Q1001 549 978 486L866 411Z',
    'url(#purple-robe)',
    1,
    'filter="url(#pigment)"',
  )
  body += path('M690 464Q714 539 733 610L693 803L655 846L801 863L809 603L795 468Z', '#b3979f', 0.9)
  body += path('M888 463L943 515L1037 752L1090 837L959 851L875 651Z', '#654f68', 0.7)
  body += path('M788 347Q807 365 831 355L837 399L798 427L773 406L789 385Z', 'url(#musician-skin)')
  body += path('M742 394L796 428L851 392L884 423L801 490L716 428Z', '#ddcdb0')
  body += path('M750 423L799 463L862 413L871 426L799 478L735 433Z', '#b98c67')
  body +=
    brush(
      [
        [620, 521],
        [604, 601],
        [578, 660],
        [557, 691],
      ],
      15,
      '#55465b',
      0.55,
    ) +
    brush(
      [
        [948, 507],
        [970, 576],
        [969, 648],
        [1010, 686],
      ],
      18,
      '#c2a4ad',
      0.5,
    ) +
    brush(
      [
        [805, 588],
        [820, 677],
        [788, 776],
        [818, 858],
      ],
      23,
      '#574759',
      0.55,
    ) +
    brush(
      [
        [885, 696],
        [914, 772],
        [964, 824],
        [994, 845],
      ],
      15,
      '#c6a9ac',
      0.38,
    )
  body += path('M633 661L678 637L722 655L718 676L677 681L650 693Z', '#dfbc98')
  body += path('M950 660L979 654L1003 670L1037 680L1032 688L998 682L984 701L969 696Z', '#dfbc98')
  let qin = path('M449 710Q688 679 1120 714L1149 749Q833 784 426 746Z', '#624c3c')
  qin += path('M449 710Q766 687 1114 716L1128 730Q780 755 441 735Z', '#98734e')
  qin += repeat(7, (index) =>
    line(
      `M452 ${718 + index * 3}Q777 ${703 + index * 3} 1126 ${724 + index * 2}`,
      '#d0b082',
      0.8,
      0.8,
    ),
  )
  qin += repeat(9, (index) => ellipse(530 + index * 57, 718, 2.2, 1.7, '#dfcda5'))
  body += group('qin', qin, 'transform="translate(0 -22)"')
  body += line('M680 654L694 678M691 650L706 673M981 672L995 690M992 671L1007 684', '#9b7555', 1.7)
  let face = path(
    'M34 25Q76 -4 109 26Q132 53 124 91L118 122Q107 150 84 163Q62 160 43 141L29 110L22 70Z',
    'url(#musician-skin)',
  )
  face += path('M29 63L43 46L38 104L51 135L76 160L62 153L42 136L29 110Z', '#ad8865', 0.25)
  face += path(
    'M14 85Q6 52 23 23Q44 -8 77 -9Q119 -4 136 33L134 76L122 96L116 49Q100 38 80 21Q58 45 34 51L31 104Z',
    '#313a3c',
  )
  face += path('M79 0Q85 -24 111 -24Q142 -17 133 9L111 30L94 12Z', '#313a3c')
  face +=
    brush(
      [
        [27, 39],
        [45, 3],
        [75, 0],
        [89, 12],
      ],
      12,
      '#6d7574',
      0.5,
    ) +
    brush(
      [
        [97, -12],
        [122, -13],
        [133, 0],
        [115, 17],
      ],
      10,
      '#5d676a',
      0.55,
    )
  face += line('M91 -9L154 -22', '#a78b54', 4) + ellipse(152, -22, 5, 6, '#beac7f')
  face += path('M44 79Q61 72 78 77L85 82L81 84Q62 77 45 83Z', '#555044')
  face += path('M98 80Q110 75 119 79L123 83L115 82L100 84Z', '#555044')
  face += line('M45 94Q63 99 81 91M100 94Q111 97 121 90', '#413e37', 1.9)
  face += line('M49 97Q64 101 78 95M102 97L117 95', '#ae8869', 0.9, 0.6)
  face += line('M89 91Q86 109 89 114L96 120M102 107L107 117L102 121', '#a68160', 1.1)
  face += path('M76 135L86 131L92 133L105 131L109 134Q93 141 79 137Z', '#a96d62', 0.9)
  face += line('M80 135Q95 136 105 133', '#794f43', 1)
  face += ellipse(25, 105, 4, 6, '#b39862')
  return (
    group('musician-robes', body) +
    group('musician-head', face, 'transform="translate(730 190) rotate(9 75 80) scale(1.13)"')
  )
}

function crane() {
  const { path, line, ellipse, brush, group } = painter(27047)
  let legs = line(
    'M925 606L917 716L971 815L974 870M976 870L948 882M974 870L1004 879M970 868L981 893',
    '#535b54',
    8,
  )
  legs += line(
    'M863 618L847 729L856 869M856 867L826 882M855 867L885 879M855 867L856 891',
    '#414e4b',
    8,
  )
  let body = ellipse(
    892,
    527,
    151,
    102,
    paperWhite,
    1,
    'transform="rotate(-12 892 527)" filter="url(#pigment)"',
  )
  body += path(
    'M818 481Q954 427 1037 494L1034 572L978 642L974 593L937 653L933 594L889 629L881 574Z',
    '#38494b',
  )
  body += path('M823 486Q913 458 992 498L976 556L904 583L835 565Z', '#ddd7c2')
  body +=
    brush(
      [
        [837, 499],
        [898, 478],
        [963, 497],
        [981, 530],
      ],
      25,
      '#b7b9a9',
      0.6,
    ) +
    brush(
      [
        [891, 557],
        [934, 543],
        [966, 542],
        [1004, 545],
      ],
      12,
      '#929f98',
      0.5,
    )
  body += path(
    'M815 498Q744 461 693 412Q653 370 674 312Q691 274 739 269L750 290Q704 296 704 332Q697 369 731 394L844 457Z',
    paperWhite,
  )
  body += path(
    'M815 498Q738 456 694 409Q661 376 675 326L687 309Q679 357 710 386Q743 418 803 444Z',
    '#394c4d',
  )
  body += ellipse(738, 277, 40, 22, paperWhite)
  body += path('M709 265Q727 247 751 258L761 269L734 266Z', '#9f4c3e')
  body += path('M703 271L629 276L700 285L715 279Z', '#7a755a')
  body +=
    line('M634 277L700 278', '#454e44', 1.3) +
    ellipse(718, 276, 3.4, 3.2, ink) +
    ellipse(717, 275, 0.9, 0.8, '#efe6ce')
  body += brush(
    [
      [754, 300],
      [730, 331],
      [733, 367],
      [763, 390],
    ],
    10,
    '#b3b6a8',
    0.4,
  )
  let reeds = ''
  for (const [horizontal, height] of [
    [451, 260],
    [481, 340],
    [513, 215],
  ]) {
    reeds += brush(
      [
        [horizontal, 880],
        [horizontal - 11, 798],
        [horizontal + 20, 880 - height / 2],
        [horizontal + 14, 880 - height],
      ],
      5,
      '#7f835d',
      0.75,
    )
    reeds += brush(
      [
        [horizontal + 8, 790],
        [horizontal - 48, 746],
        [horizontal - 60, 714],
        [horizontal - 58, 702],
      ],
      17,
      '#82886b',
      0.7,
    )
  }
  return group('reeds', reeds) + group('crane-legs', legs) + group('crane-body', body)
}

function deer() {
  const { path, line, ellipse, brush, group, random } = painter(27053)
  let legs = path('M726 570L731 689L698 773L725 857L706 867L672 774L689 669L687 575Z', '#8c694b')
  legs += path('M939 553L967 661L949 765L980 850L960 861L921 771L932 668L898 575Z', '#88674c')
  legs += path('M653 565L668 666L632 767L615 865L591 869L605 763L625 654L617 563Z', '#af8358')
  legs += path('M858 572L870 674L848 762L859 870L835 872L818 761L828 672L818 577Z', '#bd9364')
  legs += path(
    'M591 863L615 861L616 878L586 880ZM835 866L860 867L866 881L834 882ZM705 855L726 852L732 866L709 870ZM960 849L981 845L992 860L968 867Z',
    '#3c4840',
  )
  let body = path(
    'M588 493Q591 423 674 405L825 418L915 395L989 334L1033 274L1075 286Q1044 363 1039 433L1000 522Q951 592 857 615L733 603Q665 613 618 580Z',
    '#b28a5e',
    1,
    'filter="url(#pigment)"',
  )
  body += path(
    'M616 529Q692 563 775 557Q888 555 961 488L938 554Q884 610 786 609L692 598L634 570Z',
    '#d6bb8d',
  )
  body += path(
    'M617 442Q685 414 750 445L889 439L955 401Q926 464 848 476L725 458L645 474Z',
    '#946d4c',
    0.6,
  )
  body += path('M1004 405L1022 327L1046 291L1062 303L1040 392L1025 442Z', '#d4b88b')
  body += path(
    'M1041 274Q1055 242 1087 246L1136 262L1174 285L1177 300L1147 312L1101 295L1065 302Z',
    '#b28a5e',
  )
  body += path('M1110 281L1159 289L1174 300L1149 307L1114 294Z', '#d4b78d')
  body += path('M1161 285L1179 289L1177 301L1166 302Z', '#41483c')
  body += path('M1052 262Q1023 241 1020 209Q1045 206 1074 247Z', '#aa805a')
  body += path('M1092 254Q1100 218 1129 213Q1142 237 1109 265Z', '#b9966d')
  body += path('M1031 218L1063 251L1043 243Z', '#d8ba91')
  body += path('M1098 248L1123 225L1118 244Z', '#d8ba91')
  body += path('M1091 271Q1101 264 1112 272L1105 280L1097 279Z', ink)
  body += ellipse(1104, 271, 1.4, 1.2, '#ead5ad')
  body += line('M1128 300L1153 305', '#78553c', 1.4)
  body += brush(
    [
      [1052, 250],
      [1025, 199],
      [1043, 149],
      [1026, 96],
    ],
    12,
    '#71664c',
    0.95,
  )
  body += brush(
    [
      [1037, 191],
      [1001, 172],
      [991, 148],
      [977, 139],
    ],
    8,
    '#71664c',
    0.9,
  )
  body += brush(
    [
      [1037, 166],
      [1072, 138],
      [1084, 103],
      [1076, 82],
    ],
    8,
    '#71664c',
    0.9,
  )
  body += brush(
    [
      [1080, 247],
      [1093, 201],
      [1080, 171],
      [1106, 133],
    ],
    11,
    '#7f7253',
    0.95,
  )
  body += brush(
    [
      [1090, 198],
      [1125, 184],
      [1139, 158],
      [1136, 145],
    ],
    7,
    '#7f7253',
    0.9,
  )
  body += brush(
    [
      [1090, 165],
      [1070, 140],
      [1073, 117],
      [1065, 105],
    ],
    6,
    '#7f7253',
    0.8,
  )
  body += group(
    'coat-spots',
    repeat(21, (index) => {
      const horizontal = 652 + (index % 7) * 39 + random() * 11
      const vertical = 465 + Math.floor(index / 7) * 30 + random() * 8
      return ellipse(
        number(horizontal),
        number(vertical),
        5 + random() * 3,
        3 + random() * 2,
        '#dfc99e',
        0.75,
      )
    }),
  )
  body += path('M592 480Q563 465 550 487L560 503L595 508Z', '#b79a75')
  return group('deer-legs', legs) + group('deer-body', body)
}

function beacon() {
  const { path, line, ellipse, brush, wash, group, random } = painter(27059)
  let scene = ellipse(1112, 325, 113, 113, 'url(#sun)')
  scene += wash(
    'M247 782Q325 754 365 700Q383 672 394 663Q432 653 461 685L508 691Q551 671 588 608Q625 579 655 550Q695 557 710 607L743 649Q792 637 828 599Q861 589 883 574Q925 589 950 641L1032 699Q1083 674 1122 633L1161 615Q1195 621 1229 665Q1312 736 1386 785Z',
    '#758084',
    0.25,
  )
  scene += wash(
    'M295 814Q381 760 465 728Q492 700 526 719L581 725Q621 716 651 684Q686 660 705 658Q746 658 780 700L813 706Q857 695 894 675L935 659Q983 674 1040 725L1165 769L1280 846Z',
    '#9d8866',
    0.4,
  )
  scene +=
    brush(
      [
        [655, 559],
        [621, 637],
        [573, 677],
        [536, 695],
      ],
      18,
      '#6d797b',
      0.22,
    ) +
    brush(
      [
        [883, 583],
        [870, 625],
        [896, 655],
        [931, 694],
      ],
      17,
      '#738184',
      0.2,
    )
  let tower = path('M625 449L942 440L992 789L581 789Z', '#b29870', 1, 'filter="url(#pigment)"')
  tower += path('M884 443L942 440L992 789L889 776Z', '#786c52')
  tower += path(
    'M615 412L662 411L664 449L704 448L703 411L747 409L748 446L791 445L790 407L837 405L839 444L879 443L878 405L928 404L943 458L616 468Z',
    '#b69b72',
  )
  tower += path('M615 461L944 451L947 475L612 486Z', '#786b52')
  tower += path('M744 789L747 696Q750 663 782 662Q812 661 816 691L821 789Z', '#544f42')
  tower += path('M754 789L758 701Q758 676 779 674L783 789Z', '#8c7857')
  tower += repeat(55, () => {
    const horizontal = 627 + random() * 286
    const vertical = 495 + random() * 142
    return brush(
      [
        [horizontal, vertical],
        [horizontal + 9, vertical + 3],
        [horizontal + 19, vertical],
        [horizontal + 26, vertical + 1],
      ],
      2 + random() * 3,
      '#675f4b',
      0.25,
    )
  })
  tower += brush(
    [
      [642, 507],
      [624, 598],
      [639, 709],
      [615, 778],
    ],
    22,
    '#d2bb91',
    0.4,
  )
  tower += brush(
    [
      [889, 492],
      [873, 585],
      [885, 689],
      [893, 768],
    ],
    22,
    '#695f49',
    0.35,
  )
  scene += group('beacon-tower', tower)
  scene += wash(
    'M771 414Q740 362 782 312Q817 271 789 226Q759 184 810 145Q799 192 835 217Q865 260 818 307Q778 352 806 407Z',
    '#625f51',
    0.28,
  )
  scene += wash(
    'M265 831L463 773L594 785L840 771L1046 789L1267 858L1000 876L715 847L478 866Z',
    '#8d7857',
    0.55,
  )
  scene += repeat(7, (index) =>
    brush(
      [
        [380 + index * 107, 811],
        [399 + index * 104, 794],
        [439 + index * 100, 820],
        [469 + index * 99, 828],
      ],
      8,
      '#655c48',
      0.4,
    ),
  )
  return group('beacon-scene', scene)
}

function bronzeDing() {
  const { path, line, ellipse, brush, group } = painter(27061)
  let legs = path('M579 615L625 625L606 831Q585 858 560 837L566 716Z', 'url(#bronze)')
  legs += path('M946 620L992 605L1018 825Q1005 850 981 841L963 725Z', 'url(#bronze)')
  legs += path('M772 660L824 658L830 865Q807 886 782 868Z', 'url(#bronze)')
  let body = path(
    'M523 387Q529 618 647 678Q789 741 948 681Q1050 625 1076 391Z',
    'url(#bronze)',
    1,
    'filter="url(#pigment)"',
  )
  body += path('M983 414Q1004 562 912 664L946 680Q1054 622 1073 413Z', '#4e5542', 0.64)
  body += path('M557 420Q568 561 666 622L702 663Q604 641 569 563Z', '#b69b67', 0.4)
  body += ellipse(800, 391, 279, 75, '#b29a6a')
  body += ellipse(800, 389, 253, 57, '#464b3d')
  body += ellipse(799, 399, 231, 36, '#69674c')
  body += path('M523 391Q791 488 1077 393L1064 445Q796 520 534 445Z', '#756b4c')
  body += line('M544 438Q799 509 1052 440', '#b6a06c', 5, 0.8)
  body += group(
    'handles',
    path(
      'M598 366L591 241Q622 200 676 232L698 364L670 373L653 251Q637 240 619 253L626 366Z',
      'url(#bronze)',
    ) +
      path(
        'M921 361L927 230Q975 205 1008 240L1002 366L973 373L980 257Q965 242 951 253L949 367Z',
        'url(#bronze)',
      ),
  )
  let ornament = ''
  for (const horizontal of [660, 940]) {
    ornament += path(
      'M-76 8Q-48 -27 -13 -14L0 0L13 -14Q48 -27 76 8L58 26L26 13L19 56L0 75L-19 56L-26 13L-58 26Z',
      '#4e5642',
      0.7,
      `transform="translate(${horizontal} 527)"`,
    )
    ornament += line(
      `M${horizontal - 57} 539l25 -10l17 17M${horizontal + 57} 539l-25 -10l-17 17M${horizontal} 544v40`,
      '#baa475',
      4,
      0.9,
    )
  }
  body += group('abstract-ritual-band', ornament)
  body += brush(
    [
      [596, 465],
      [642, 493],
      [690, 479],
      [742, 493],
    ],
    12,
    '#687b60',
    0.55,
  )
  body += brush(
    [
      [1000, 490],
      [994, 573],
      [941, 620],
      [935, 641],
    ],
    18,
    '#738164',
    0.4,
  )
  body += line('M641 667Q788 726 940 673', '#b19762', 4, 0.65)
  return group('ding-legs', legs) + group('bronze-vessel', body)
}

function chrysanthemums() {
  const { path, line, ellipse, brush, wash, group, random } = painter(27067)
  let scene = wash('M912 785L923 676L967 594L1044 628L1101 706L1064 817L956 836Z', '#8e9180', 0.7)
  scene += path('M923 782L969 654L984 736L1047 768L1063 818L966 828Z', '#626f66', 0.38)
  scene += brush(
    [
      [942, 772],
      [957, 718],
      [977, 697],
      [967, 656],
    ],
    7,
    '#4d5f54',
    0.6,
  )
  const blooms = [
    [581, 409, 48],
    [726, 322, 57],
    [859, 438, 49],
    [673, 559, 42],
    [925, 579, 36],
    [533, 618, 30],
  ]
  let plants = ''
  for (const [horizontal, vertical] of blooms) {
    plants += brush(
      [
        [788, 859],
        [horizontal + 45, 739],
        [horizontal - 12, vertical + 109],
        [horizontal, vertical],
      ],
      6,
      '#657650',
      0.85,
    )
    for (const offset of [115, 201]) {
      const direction = offset === 115 ? -1 : 1
      plants += path(
        `M${horizontal + 9} ${vertical + offset}q${direction * 48} -57 ${direction * 93} -30l${-direction * 24} 12l${direction * 14} 17l${-direction * 35} 3l${direction * 7} 18Z`,
        '#657b57',
        0.88,
        'filter="url(#pigment)"',
      )
      plants += line(
        `M${horizontal + 9} ${vertical + offset}l${direction * 65} -16`,
        '#a6ab7a',
        1.8,
        0.7,
      )
    }
  }
  scene += group('chrysanthemum-stems', plants)
  for (const [horizontal, vertical, radius] of blooms) {
    let petals = ''
    for (let layer = 0; layer < 2; layer++) {
      petals += repeat(layer ? 14 : 19, (index) => {
        const angle = index * (layer ? 360 / 14 : 360 / 19) + layer * 13
        const length = radius * (layer ? 0.66 : 1) * (0.83 + random() * 0.3)
        return path(
          `M-4 5Q-19 ${-length * 0.63} -3 ${-length}Q8 ${-length * 1.08} 8 ${-length * 0.68}L5 4Z`,
          layer ? '#d9ad54' : '#c69443',
          1,
          `transform="rotate(${number(angle)})" filter="url(#pigment)"`,
        )
      })
    }
    petals += ellipse(0, 0, radius * 0.18, radius * 0.14, '#8e753e')
    petals += repeat(9, () =>
      ellipse(
        number((random() - 0.5) * radius * 0.3),
        number((random() - 0.5) * radius * 0.22),
        1.4,
        1,
        '#edd093',
      ),
    )
    scene += group(
      `flower-${horizontal}`,
      petals,
      `transform="translate(${horizontal} ${vertical})"`,
    )
  }
  return group('autumn-chrysanthemums', scene)
}

function fishingBoat() {
  const { path, line, ellipse, brush, wash, group, random } = painter(27071)
  let scene = wash(
    'M560 628Q601 586 664 549Q716 497 738 490Q771 493 801 537L841 555Q883 536 921 465Q961 433 987 389Q1009 406 1037 452L1084 491Q1130 518 1167 555L1226 577Q1277 606 1327 650Z',
    '#71868a',
    0.29,
  )
  scene += wash(
    'M745 618Q810 575 860 560Q899 516 913 514Q948 522 987 555L1028 570Q1091 562 1144 537L1208 519Q1257 550 1338 649Z',
    '#899785',
    0.21,
  )
  scene +=
    brush(
      [
        [987, 406],
        [971, 467],
        [927, 495],
        [902, 536],
      ],
      24,
      '#5f797e',
      0.3,
    ) +
    brush(
      [
        [1039, 466],
        [1051, 510],
        [1114, 540],
        [1167, 576],
      ],
      17,
      '#647d80',
      0.21,
    )
  scene += group(
    'willow-trunk',
    brush(
      [
        [380, 811],
        [448, 643],
        [404, 477],
        [492, 257],
      ],
      37,
      '#5b6551',
      0.88,
    ) +
      brush(
        [
          [430, 580],
          [491, 477],
          [570, 391],
          [723, 362],
        ],
        19,
        '#5b6551',
        0.86,
      ) +
      brush(
        [
          [437, 503],
          [380, 419],
          [308, 378],
          [252, 383],
        ],
        15,
        '#5b6551',
        0.8,
      ),
  )
  let leaves = ''
  for (const [startX, startY, endX, endY] of [
    [287, 379, 244, 611],
    [345, 397, 350, 663],
    [495, 421, 519, 669],
    [582, 388, 602, 612],
    [670, 371, 703, 554],
    [471, 299, 532, 495],
  ]) {
    leaves += line(
      `M${startX} ${startY}Q${endX + 20} ${(startY + endY) / 2} ${endX} ${endY}`,
      '#657b60',
      2.1,
      0.7,
    )
    leaves += repeat(13, (index) => {
      const fraction = index / 13
      const horizontal = startX + (endX - startX) * fraction + Math.sin(fraction * Math.PI) * 12
      const vertical = startY + (endY - startY) * fraction
      const direction = index % 2 ? 1 : -1
      return brush(
        [
          [horizontal, vertical],
          [horizontal + direction * 14, vertical + 7],
          [horizontal + direction * 17, vertical + 23],
          [horizontal + direction * 10, vertical + 33],
        ],
        8,
        '#748762',
        0.7,
      )
    })
  }
  scene += group('willow-leaves', leaves)
  scene += wash('M179 834L303 775L395 782L505 812L596 835L458 862L281 866Z', '#8e8f6c', 0.6)
  let boat = path('M704 719Q868 757 1144 699L1114 747Q946 799 763 760Z', '#594c3e')
  boat += path('M717 724Q927 755 1133 707L1117 723Q904 779 736 744Z', '#a4865e')
  boat += path('M826 717L832 664Q855 630 894 663L908 732Z', '#a89673')
  boat += line('M837 670L842 722M854 658L863 728M876 661L887 730', '#635e49', 3, 0.7)
  boat += path('M945 711L942 657Q954 639 971 649L993 712L1013 728L962 734Z', '#50656a')
  boat += ellipse(955, 634, 12, 15, '#bca37d')
  boat += path('M925 625Q946 606 974 618L990 632L926 633Z', '#a88d5c')
  boat += line('M967 666L999 684L1030 668', '#bca37d', 7)
  boat += line('M1028 669Q1067 550 1193 487', '#5f6850', 3.4)
  boat += line('M1193 487Q1204 594 1219 731', '#8b8b70', 1, 0.7)
  scene += group('boat-and-fisher', boat)
  scene += repeat(17, (index) => {
    const horizontal = 622 + random() * 649
    const vertical = 775 + index * 6
    return brush(
      [
        [horizontal, vertical],
        [horizontal + 32, vertical - 3],
        [horizontal + 69, vertical + 4],
        [horizontal + 95, vertical],
      ],
      2.4,
      '#7a8b83',
      0.35,
    )
  })
  return group('river-willow-fisher', scene)
}

const studies = [
  {
    id: 'scholar-reading-scroll',
    name: '文士展卷',
    theme: '人物与衣冠 · 文人士人',
    category: 'figures',
    note: '靛青衣袍 · 成熟面骨 · 双手展卷，非特定人物肖像',
    draw: scholar,
  },
  {
    id: 'musician-playing-qin',
    name: '女乐抚琴',
    theme: '人物与衣冠 · 艺术生活',
    category: 'figures',
    note: '烟紫衣裙 · 低眉专注 · 琴弦与指下动作，通用人物意象',
    draw: musician,
  },
  {
    id: 'crane-in-reeds',
    name: '芦汀鹤立',
    theme: '山川与自然 · 飞禽走兽',
    category: 'figures',
    note: '月白羽面 · 焦墨翼羽 · 曲颈与支撑足',
    draw: crane,
  },
  {
    id: 'deer-under-autumn-light',
    name: '秋原鹿鸣',
    theme: '山川与自然 · 飞禽走兽',
    category: 'figures',
    note: '赭金皮毛 · 不对称角枝 · 轻步凝望',
    draw: deer,
  },
  {
    id: 'beacon-at-sunset',
    name: '关山烽燧',
    theme: '建筑与历史空间 · 关隘边防',
    category: 'ink',
    note: '土黄夯墙 · 暖赭落日 · 青灰远岭，原创边塞意象',
    draw: beacon,
  },
  {
    id: 'willow-river-fisher',
    name: '柳岸渔舟',
    theme: '军事与交通 · 舟船水路',
    category: 'ink',
    note: '柳丝斜垂 · 青灰江山 · 一叶渔舟与垂钓者',
    draw: fishingBoat,
  },
  {
    id: 'bronze-ritual-ding',
    name: '青铜鼎影',
    theme: '文字制度与器用 · 礼器青铜',
    category: 'color',
    note: '铜褐暗金 · 局部铜绿 · 三足承重，非特定出土器物复原',
    draw: bronzeDing,
  },
  {
    id: 'golden-chrysanthemums',
    name: '篱菊映石',
    theme: '山川与自然 · 花卉园圃',
    category: 'color',
    note: '秋金重瓣 · 竹青叶面 · 灰青湖石',
    draw: chrysanthemums,
  },
]

for (const study of studies) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}。原创代码彩墨意象，非历史实物复原，透明背景。</desc>${definitions}${study.draw()}</svg>`
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
      version: 1,
      width: 1600,
      height: 1000,
      background: 'transparent',
      assets: studies.map(({ id, name, theme, category, note }) => ({
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
console.log(
  'Generated eight historical ink studies: figures, animals, border architecture, river transport, bronze and flowers',
)
