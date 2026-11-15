import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const destination = join(root, 'resources/visuals/traditional-culture/heritage-studies/ink-wash')
const ink = '#35443f'
const texture = 'filter="url(#pigment)"'
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
const rounded = (value) => Math.round(value * 100) / 100

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
    const before = curve(Math.max(0, fraction - 0.002))
    const after = curve(Math.min(1, fraction + 0.002))
    const length = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
    const normal = [-(after[1] - before[1]) / length, (after[0] - before[0]) / length]
    const breadth =
      (width * (0.24 + Math.sin(Math.PI * fraction) * 0.76) * (1 - fraction * 0.88)) / 2
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
<filter id="soft" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="pigment" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="71" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .18 0 0 0 .82" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in"/></filter>
<linearGradient id="bronze" x2="90%" y2="70%"><stop stop-color="#a58e59"/><stop offset=".4" stop-color="#82744e"/><stop offset=".8" stop-color="#58634e"/><stop offset="1" stop-color="#8a8056"/></linearGradient>
<radialGradient id="mirror" cx="37%" cy="28%" r="80%"><stop stop-color="#c2b17f"/><stop offset=".52" stop-color="#a29060"/><stop offset=".8" stop-color="#807349"/><stop offset="1" stop-color="#626a4f"/></radialGradient>
<linearGradient id="bamboo" x2="100%"><stop stop-color="#b69a66"/><stop offset=".34" stop-color="#d4bf8b"/><stop offset=".68" stop-color="#dcca98"/><stop offset="1" stop-color="#ad8f5d"/></linearGradient>
<radialGradient id="stone" cx="30%" cy="25%" r="90%"><stop stop-color="#aaa993"/><stop offset=".6" stop-color="#808878"/><stop offset="1" stop-color="#596b63"/></radialGradient>
<linearGradient id="vermilion" x2="90%" y2="80%"><stop stop-color="#b36951"/><stop offset=".5" stop-color="#975041"/><stop offset="1" stop-color="#713d35"/></linearGradient>
<linearGradient id="wood" x2="100%" y2="40%"><stop stop-color="#7a583b"/><stop offset=".4" stop-color="#b38e59"/><stop offset=".7" stop-color="#a77e4a"/><stop offset="1" stop-color="#644b35"/></linearGradient>
<linearGradient id="silk" x2="95%" y2="80%"><stop stop-color="#678694"/><stop offset=".45" stop-color="#8ba3a6"/><stop offset="1" stop-color="#3f6474"/></linearGradient>
<radialGradient id="skin"><stop stop-color="#ddd0aa"/><stop offset="1" stop-color="#b39b6b"/></radialGradient>
</defs>`

function tigerTally() {
  let content = group(
    'ground',
    wash(
      'M350 778Q607 741 810 768Q1103 732 1285 802Q1019 847 802 820Q559 843 350 809Z',
      '#8a8262',
      0.2,
    ),
  )
  let tiger = path(
    'M457 603Q465 544 540 527L879 521L948 487L969 419L1011 403L1033 431L1081 435L1097 465L1137 483L1141 520L1107 539L1060 534L1020 561L1009 665L1045 709L1038 735L954 735L949 705L960 626L904 619L856 700L866 730L784 737L781 709L797 636L612 636L566 694L584 728L511 735L487 703L507 627L471 634Z',
    'url(#bronze)',
    1,
    texture,
  )
  tiger += path(
    'M508 573Q634 540 803 555L923 546L998 494L1009 437L988 433L970 493L924 527L541 546Z',
    '#c0a96f',
    0.35,
  )
  tiger += path(
    'M456 593Q377 578 375 510Q382 466 421 492Q437 514 413 533',
    'none',
    1,
    'stroke="#68704f" stroke-width="25" stroke-linecap="round"',
  )
  tiger += line('M460 601Q633 575 833 585Q951 569 1000 514', '#d0b982', 4, 0.65)
  tiger +=
    path('M983 486L999 452L1018 472L1005 491Z', '#484e3b') +
    ellipse(1069, 477, 6, 5, '#343f34') +
    ellipse(1070, 476, 1.8, 1.5, '#d8c58d')
  tiger += line('M1100 512L1127 508M1090 494L1128 499', '#4d513b', 3)
  tiger += times(8, (index) =>
    brush(
      [
        [568 + index * 47, 545],
        [590 + index * 42, 569],
        [568 + index * 46, 590],
        [584 + index * 44, 612],
      ],
      12,
      '#4f6149',
      0.7,
    ),
  )
  tiger +=
    brush(
      [
        [969, 545],
        [994, 563],
        [984, 594],
        [975, 604],
      ],
      10,
      '#485d48',
      0.65,
    ) + line('M808 533L800 635', '#4d5c47', 3, 0.7)
  tiger += group(
    'inlaid-marks',
    times(4, (index) => line(`M${626 + index * 35} 595l13 -7l9 13`, '#c5ad73', 2.5, 0.7)),
  )
  return content + group('bronze-tiger', tiger)
}

function bronzeMirror() {
  const blossom =
    'M0 -294Q58 -310 99 -263Q165 -275 195 -221Q257 -204 256 -143Q310 -105 287 -44Q315 12 278 62Q286 127 231 158Q212 221 148 225Q106 277 48 258Q-9 285 -61 253Q-126 269 -161 217Q-225 200 -226 137Q-279 96 -258 40Q-286 -19 -250 -67Q-264 -131 -208 -164Q-187 -226 -126 -229Q-81 -283 -23 -265Z'
  let content = group(
    'ground',
    wash('M365 831Q622 786 946 805Q1187 794 1270 854Q897 909 404 870Z', '#7d7055', 0.19),
  )
  content += group(
    'wooden-mirror-stand',
    path(
      'M873 657L945 659L997 818L1220 827L1241 858L823 861L812 832L887 821Z',
      'url(#wood)',
      1,
      texture,
    ) +
      path('M850 818L1199 816L1220 827L823 839Z', '#ba9566') +
      path('M886 681L910 678L943 819L922 820Z', '#665039') +
      line('M840 847Q1026 833 1222 847', '#5e4a35', 4, 0.65),
  )
  let front = path(blossom, '#665f40', 1, 'transform="translate(941 438) scale(.99 1.05)"')
  front += path(
    blossom,
    'url(#mirror)',
    1,
    `transform="translate(934 426) scale(.99 1.05)" ${texture}`,
  )
  front += ellipse(934, 423, 252, 263, '#bcaa79') + ellipse(934, 423, 238, 249, '#6a715f')
  front += `<defs><radialGradient id="polished-face" cx="30%" cy="20%" r="100%"><stop stop-color="#ded9bb"/><stop offset=".4" stop-color="#c9cbb7"/><stop offset=".74" stop-color="#a0b1a5"/><stop offset="1" stop-color="#788d83"/></radialGradient><clipPath id="face-clip"><ellipse cx="934" cy="423" rx="228" ry="239"/></clipPath></defs>`
  front += ellipse(934, 423, 228, 239, 'url(#polished-face)')
  front += group(
    'muted-reflection',
    wash(
      'M691 526Q757 477 806 500Q872 465 939 511Q1032 474 1177 535L1180 676L688 676Z',
      '#647d71',
      0.17,
    ) +
      path('M705 298Q846 204 1038 212L1124 223Q874 269 724 411Z', '#efe8cb', 0.23) +
      brush(
        [
          [739, 466],
          [856, 390],
          [1012, 348],
          [1141, 306],
        ],
        58,
        '#e7e4c8',
        0.2,
      ) +
      line('M730 553Q857 531 974 550M987 568L1120 555', '#e4e2c5', 4, 0.22),
    'clip-path="url(#face-clip)"',
  )
  front += line('M766 251Q826 190 917 182M1103 274Q1154 355 1156 438', '#e4cca0', 4, 0.65)
  front += times(15, (index) => {
    const angle = 2.2 + index * 0.28
    const horizontal = 934 + Math.cos(angle) * 259
    const vertical = 423 + Math.sin(angle) * 273
    return ellipse(horizontal, vertical, 3 + (index % 3), 2, '#687e64', 0.45)
  })
  content += group('polished-mirror-front', front)
  let back = path(blossom, '#605f40', 1, 'transform="translate(571 599) scale(.64 .67)"')
  back += path(
    blossom,
    'url(#bronze)',
    1,
    `transform="translate(564 588) scale(.64 .67)" ${texture}`,
  )
  back +=
    ellipse(564, 586, 157, 162, 'none', 0.8, 'stroke="#c8af76" stroke-width="5"') +
    ellipse(564, 586, 141, 146, 'none', 0.7, 'stroke="#636f50" stroke-width="3"')
  back += times(4, (index) =>
    group(
      'bird-relief-' + index,
      path(
        'M-32 -50Q-83 -66 -96 -104Q-48 -117 -14 -87Q14 -110 48 -91Q29 -70 5 -66Q47 -52 62 -17Q19 -11 -9 -42Q-12 -15 -43 -5Q-56 -22 -32 -50Z',
        '#b09a65',
        0.8,
        texture,
      ) +
        line('M-77 -97Q-42 -99 -23 -74M-17 -66Q18 -56 39 -30', '#56694e', 3, 0.8) +
        ellipse(24, -86, 3, 3, '#48513c'),
      `transform="translate(564 586) rotate(${index * 90})"`,
    ),
  )
  back += ellipse(566, 588, 46, 39, '#5e6348') + ellipse(560, 578, 36, 31, '#b8a272')
  back += path(
    'M539 582Q532 539 559 535Q590 534 594 574L576 582Q574 551 561 554Q550 554 554 581Z',
    '#665f43',
  )
  back += line(
    'M554 560Q505 541 507 575Q512 614 561 600Q592 595 589 626Q590 674 647 714Q707 760 751 748',
    '#9e654b',
    7,
  )
  back += line('M555 558Q512 546 512 574', '#c39468', 2, 0.65)
  content += group('decorated-mirror-back', back, 'transform="rotate(-9 564 588)"')
  return content
}

function bambooSlips() {
  let content = group(
    'tied-document',
    times(14, (index) => {
      const horizontal = 422 + index * 43
      const top = 292 + Math.sin(index * 0.45) * 18
      return group(
        'slip-' + index,
        path(`M${horizontal} ${top}q18 -11 35 0l-9 477q-16 16 -34 0Z`, 'url(#bamboo)', 1, texture) +
          line(`M${horizontal + 24} ${top + 14}l-8 450`, '#aa8f60', 1.6, 0.45),
      )
    }),
  )
  content += group(
    'binding-cords',
    line('M422 382Q740 408 1018 381M417 668Q732 695 1014 666', '#66533c', 11) +
      line('M423 378Q740 404 1016 377M419 664Q732 691 1012 662', '#a38a5a', 3, 0.8),
  )
  content += group(
    'abstract-ink',
    times(9, (column) =>
      times(6, (row) => {
        const horizontal = 454 + column * 49
        const vertical = 433 + row * 30 + Math.sin(column) * 8
        return line(`M${horizontal} ${vertical}l8 4m-6 8l10 -3`, '#645a41', 2.2, 0.65)
      }),
    ),
  )
  content += group(
    'loose-cord',
    line(
      'M966 380Q1050 329 1091 380Q1122 429 1058 447Q1020 455 1000 411M1030 426Q1079 537 1147 558',
      '#826348',
      8,
    ),
  )
  content += group(
    'rolled-slips',
    path('M1097 426L1190 433L1183 784L1081 772Z', 'url(#bamboo)') +
      ellipse(1144, 429, 49, 28, '#a88b5b') +
      ellipse(1145, 427, 31, 16, '#d3bd89') +
      line('M1117 460L1107 762M1146 462L1139 772M1173 463L1168 773', '#94754e', 3, 0.6) +
      line('M1089 556L1188 568', '#6f5740', 10),
  )
  return content
}

function sundial() {
  let content = group(
    'stone-base',
    ellipse(787, 834, 188, 45, '#7c8271') +
      path('M675 562L919 562L959 825Q802 877 616 828Z', 'url(#stone)', 1, texture) +
      path('M702 594L864 594L888 814Q791 844 668 816Z', '#9c9e86', 0.6),
  )
  let face = path('M512 486Q797 399 1100 487L1097 562Q792 671 514 563Z', '#686f5c')
  face +=
    ellipse(805, 483, 305, 139, '#bcb999') +
    ellipse(805, 480, 273, 118, '#a6ae95') +
    ellipse(805, 480, 243, 101, 'none', 0.75, 'stroke="#727c68" stroke-width="3"')
  face += times(24, (index) => {
    const angle = (index * Math.PI) / 12
    return line(
      `M${rounded(805 + Math.cos(angle) * 251)} ${rounded(480 + Math.sin(angle) * 106)}L${rounded(805 + Math.cos(angle) * 278)} ${rounded(480 + Math.sin(angle) * 119)}`,
      '#617364',
      2.5,
      0.8,
    )
  })
  face += path('M805 476L1000 522L1019 540L808 490Z', '#586958', 0.35)
  face +=
    path('M794 491L854 254L867 253L817 490Z', '#4a5f55') +
    line('M808 487L862 257', '#c5c4a0', 3, 0.7) +
    ellipse(805, 490, 13, 7, '#495c50')
  content += group('dial-and-gnomon', face)
  return (
    content +
    group(
      'ground-grass',
      brush(
        [
          [475, 863],
          [495, 833],
          [505, 826],
          [513, 797],
        ],
        10,
        '#758064',
        0.7,
      ) +
        brush(
          [
            [490, 866],
            [536, 847],
            [546, 823],
            [562, 818],
          ],
          8,
          '#758064',
          0.7,
        ),
    )
  )
}

function herbalMedicine() {
  let content = group(
    'grinding-trough',
    path('M443 672Q758 613 1063 671L1039 759Q748 817 469 760Z', '#737a68', 1, texture) +
      ellipse(755, 670, 311, 64, '#a2a38b') +
      ellipse(755, 671, 266, 37, '#5c6c5d') +
      ellipse(755, 674, 225, 24, '#7e856c'),
  )
  content += group(
    'grinding-wheel',
    ellipse(774, 590, 117, 117, 'url(#stone)') +
      ellipse(773, 589, 91, 91, 'none', 0.7, 'stroke="#aeb29b" stroke-width="6"') +
      ellipse(774, 590, 22, 22, '#4e6157') +
      line('M569 590L994 590', '#92754f', 18) +
      ellipse(568, 590, 16, 14, '#6e563d') +
      ellipse(994, 590, 16, 14, '#6e563d'),
  )
  let herbs = brush(
    [
      [1109, 748],
      [1084, 660],
      [1126, 556],
      [1088, 422],
    ],
    10,
    '#63775c',
    0.9,
  )
  for (const [horizontal, vertical, direction] of [
    [1100, 695, -1],
    [1103, 626, 1],
    [1112, 570, -1],
    [1099, 497, 1],
    [1094, 451, -1],
  ]) {
    herbs +=
      path(
        `M${horizontal} ${vertical}q${direction * 53} -79 ${direction * 100} -59q${direction * 2} 53 ${-direction * 100} 59Z`,
        '#789365',
        0.9,
        texture,
      ) + line(`M${horizontal} ${vertical}l${direction * 76} -47`, '#b3b58a', 2, 0.7)
  }
  content += group('medicinal-leaves', herbs)
  content += group(
    'roots-and-slices',
    path('M483 808Q529 765 575 807Q586 833 627 845Q578 861 546 833Q507 858 483 808Z', '#b59565') +
      times(5, (index) =>
        ellipse(
          714 + index * 53,
          816 + Math.sin(index) * 18,
          28,
          12,
          '#c9b58a',
          1,
          `transform="rotate(${index * 13 - 18} ${714 + index * 53} ${816 + Math.sin(index) * 18})"`,
        ),
      ) +
      line('M501 808L560 818M732 807l11 13M825 811l12 14', '#98764e', 2, 0.6),
  )
  return content
}

function sealAndClay() {
  const sealPattern =
    'M-45 -42H-9V-12H-35V13H-11V45H-46V28M8 -43H43V-8H18V12H44V43H9V24M-45 -27H-24M26 -28V-21M-30 29V40M23 29H34'
  let content = group(
    'ground',
    wash('M332 791Q611 748 843 778Q1121 744 1305 823Q1016 888 400 851Z', '#897456', 0.18),
  )
  content += group(
    'folded-letter',
    path('M370 462L853 401L951 711L456 804Z', '#b7a27d', 0.6) +
      path('M365 452L849 391L944 698L449 792Z', '#e0cfaa', 1, texture) +
      path('M365 452L634 592L849 391L663 643Z', '#c4ac81', 0.7) +
      path('M365 452L639 601L849 391Q670 551 643 617Z', '#e7d7b5') +
      line('M451 775L642 618L929 685', '#b59c74', 2, 0.6) +
      line('M424 494L886 534M572 427L674 747', '#8e6245', 6) +
      line('M427 491L884 531M575 428L676 745', '#b08b5f', 1.7, 0.6),
  )
  content += group(
    'clay-seal',
    path(
      'M593 523Q610 499 642 506L689 510Q713 526 707 556L703 581Q675 601 641 594Q601 599 582 573Q578 545 593 523Z',
      '#a5704e',
      1,
      texture,
    ) +
      path('M603 526L683 521L692 572L612 580Z', '#bc8a62') +
      group(
        'clay-impression',
        line(sealPattern, '#7d4c34', 6, 0.8),
        'transform="translate(646 551) rotate(-5) scale(.67 .5)"',
      ) +
      line('M595 566l9 14M688 518l11 8M696 566l-5 13', '#85573d', 2, 0.7),
  )
  content += group(
    'cinnabar-impression',
    group(
      'red-print',
      path('M-60 -60H60V60H-60Z', 'none', 0.9, 'stroke="#a14a39" stroke-width="6"') +
        line(sealPattern, '#a14a39', 9, 0.9) +
        path('M-63 32l8 -3v11l-6 5ZM26 -64l9 2v6h-10Z', '#d9c29a'),
      'transform="translate(794 640) rotate(-11) scale(.8 .65)"',
    ),
  )
  let stamp = path('M927 424L1079 385L1195 449L1040 493Z', '#b09a66', 1, texture)
  stamp +=
    path('M927 424L1040 493L1040 632L928 563Z', '#80764f', 1, texture) +
    path('M1040 493L1195 449L1194 586L1040 632Z', 'url(#bronze)', 1, texture)
  stamp +=
    path('M1040 612L1194 566L1194 586L1040 632Z', '#8f4937') +
    path('M928 544L1040 612L1040 632L928 563Z', '#633f31') +
    line('M943 439L1039 496L1180 456', '#cbb27c', 3, 0.65)
  stamp += path(
    'M979 433L971 370Q968 313 1012 300Q1052 286 1084 318L1125 430L1093 450L1057 346Q1044 325 1023 335Q1004 344 1009 370L1016 422Z',
    'url(#bronze)',
    1,
    texture,
  )
  stamp += path(
    'M1016 422L1009 370Q1004 344 1023 335Q1044 325 1057 346L1093 450L1078 454L1045 354Q1036 341 1026 349Q1019 356 1023 374L1030 425Z',
    '#535e44',
  )
  stamp += line('M981 369Q977 323 1018 311Q1051 304 1072 332', '#d2b985', 4, 0.65)
  content += group('bronze-bridge-knob-seal', stamp)
  content += group(
    'ink-box-lid',
    ellipse(1198, 695, 115, 46, '#513b32') +
      ellipse(1194, 684, 115, 45, 'url(#vermilion)', 1, texture) +
      ellipse(1194, 681, 96, 33, 'none', 0.7, 'stroke="#c09a64" stroke-width="3"') +
      path('M1143 684Q1180 647 1236 681Q1189 665 1162 692Z', '#bf8b5d', 0.5),
  )
  content += group(
    'open-cinnabar-box',
    path('M914 741L914 780Q1038 865 1158 780L1158 741Z', '#754739', 1, texture) +
      ellipse(1036, 741, 122, 48, '#bb9560') +
      ellipse(1036, 739, 110, 39, '#5c3b30') +
      ellipse(1036, 741, 96, 30, '#aa4936', 1, texture) +
      path(
        'M950 735Q995 718 1051 725Q1105 725 1125 745Q1042 727 958 752Z',
        '#c96d4c',
        0.6,
        texture,
      ) +
      line('M924 784Q1028 841 1149 784', '#b28654', 3, 0.7) +
      times(9, (index) =>
        line(`M${965 + index * 17} ${737 + Math.sin(index) * 6}l14 3`, '#8d382f', 2, 0.4),
      ),
  )
  return content
}

function pipa() {
  let content = group(
    'pipa-body',
    path(
      'M746 394Q710 498 624 596Q556 679 606 783Q672 888 823 843Q943 803 934 693Q921 589 824 418L808 358L766 358Z',
      'url(#wood)',
      1,
      texture,
    ) +
      path(
        'M760 415Q723 517 648 609Q587 690 628 766Q689 851 810 814Q913 777 901 688Q887 592 810 430L796 379L778 379Z',
        '#c9ab73',
      ),
  )
  content += group(
    'neck-and-head',
    path('M762 392L774 237L822 235L809 398Z', '#78563b') +
      path('M774 238L775 193L835 158L872 170L869 196L822 220L822 238Z', '#987047') +
      path('M799 216L850 184L852 197L816 220Z', '#574835'),
  )
  content += group(
    'pegs',
    line('M775 263L743 263M773 285L740 286M819 253L847 253M817 279L845 279', '#674d35', 10) +
      ellipse(741, 263, 9, 14, '#9e7a4e') +
      ellipse(738, 286, 9, 14, '#9e7a4e') +
      ellipse(847, 253, 9, 14, '#9e7a4e') +
      ellipse(845, 279, 9, 14, '#9e7a4e'),
  )
  content += group(
    'frets',
    times(10, (index) =>
      line(
        `M${766 - index * 1.8} ${325 + index * 24}L${812 + index * 3.7} ${325 + index * 24}`,
        '#785b3b',
        6,
        0.9,
      ),
    ),
  )
  content += group(
    'bridge-and-strings',
    path('M695 740Q763 760 835 738L832 762Q764 783 698 764Z', '#705039') +
      times(4, (index) =>
        line(
          `M${784 + index * 7} 220Q${771 + index * 10} 499 ${725 + index * 28} 753`,
          '#e0c895',
          1.8,
          0.9,
        ),
      ),
  )
  content += group(
    'sound-holes',
    path(
      'M668 634Q640 651 656 676Q671 664 668 634ZM857 624Q883 642 868 670Q854 657 857 624Z',
      '#6f5639',
      0.8,
    ),
  )
  return group('instrument', content, 'transform="rotate(12 770 540)"')
}

function caravanGoods() {
  let content = group(
    'folded-textiles',
    path('M493 589L876 526L1021 598L628 673Z', 'url(#silk)', 1, texture) +
      path('M628 673L1021 598L1015 655L630 732L494 653L493 589Z', '#577989') +
      path('M601 647L1019 573L1037 602L629 687Z', '#a28a60') +
      line('M543 610L898 554M632 705L1015 634', '#b1b8a1', 3, 0.6),
  )
  content += group(
    'leather-travel-bag',
    path('M679 388Q808 335 926 399L967 571Q838 641 667 587L647 460Z', '#9f744c', 1, texture) +
      path('M679 388Q800 423 926 399L919 479Q806 514 662 475Z', '#b58c5d') +
      path('M789 411L831 415L840 606L799 612Z', '#73553e') +
      path('M785 445L842 443L844 492L790 493Z', '#b59b60') +
      path('M798 455H831V482H799Z', '#69583c') +
      line('M680 394Q699 317 756 329M899 389Q883 317 841 329', '#6e533d', 12),
  )
  let bells = ''
  for (const [index, horizontal, vertical, size] of [
    [0, 1015, 475, 1],
    [1, 1130, 621, 0.8],
  ]) {
    const bell =
      path('M-53 -37Q-59 -99 0 -104Q61 -97 54 -34L72 52Q0 94 -72 52Z', 'url(#bronze)', 1, texture) +
      ellipse(0, 49, 71, 26, '#656445') +
      ellipse(0, 50, 49, 14, '#3f4c3c') +
      ellipse(0, 50, 10, 12, '#ad955f') +
      line('M-22 -102Q-23 -143 0 -142Q24 -144 22 -101', '#826c45', 9) +
      line('M0 -89V27', '#c9b17c', 3, 0.6)
    bells += group(
      'bell-' + index,
      bell,
      `transform="translate(${horizontal} ${vertical}) rotate(${index ? 12 : -8}) scale(${size})"`,
    )
  }
  content +=
    group(
      'bell-cord',
      line('M885 345Q1024 260 1014 329L1015 337M1011 364Q1087 419 1130 508', '#8d6247', 8),
    ) + group('caravan-bells', bells)
  return content
}

function academyCorridor() {
  let content = group(
    'garden-behind',
    wash('M397 690Q544 613 650 659Q756 591 850 663L1202 786L453 824Z', '#7f9281', 0.24) +
      brush(
        [
          [1064, 732],
          [1077, 601],
          [1121, 507],
          [1109, 395],
        ],
        8,
        '#6f896b',
        0.55,
      ) +
      brush(
        [
          [1134, 731],
          [1107, 602],
          [1122, 473],
          [1162, 416],
        ],
        7,
        '#6f896b',
        0.55,
      ),
  )
  let structure =
    path('M358 749L932 595L1220 707L643 877Z', '#aaa184') +
    path('M643 877L1220 707L1220 738L643 909L358 781L358 749Z', '#777e6b')
  structure += path(
    'M408 438L438 438L438 765L408 775ZM634 484L664 484L664 846L634 857ZM898 334L917 337L917 641L898 646ZM1100 408L1121 413L1121 716L1100 723Z',
    '#6d5640',
  )
  structure += path(
    'M421 454L636 499L906 359L1122 429L1121 456L911 385L649 529L421 482Z',
    '#9b8156',
  )
  structure +=
    path(
      'M338 421Q564 429 867 243L1197 377Q986 441 660 548Q475 519 338 421Z',
      '#506a63',
      1,
      texture,
    ) + path('M338 421Q479 488 660 524L1197 377L1186 404L660 553Q480 516 351 446Z', '#344e48')
  structure +=
    path('M868 244L1197 377L1094 379L844 278Z', '#7b8b77', 0.8) +
    brush(
      [
        [859, 262],
        [729, 367],
        [534, 434],
        [357, 428],
      ],
      12,
      '#a4ac8c',
      0.65,
    )
  structure +=
    line('M438 698L635 754L1107 605M437 719L637 776L1107 627', '#917b53', 6) +
    times(5, (index) => line(`M${470 + index * 36} ${707 + index * 10}v46`, '#917b53', 5))
  content += group('timber-corridor', structure)
  return (
    content +
    group(
      'garden-stones',
      path('M1135 824L1166 781L1214 789L1257 841L1218 865L1153 857Z', '#7e8978', 0.75) +
        brush(
          [
            [1182, 817],
            [1197, 785],
            [1210, 768],
            [1206, 747],
          ],
          12,
          '#687e60',
          0.7,
        ),
    )
  )
}

function ginkgoRock() {
  let content = group(
    'rock',
    path(
      'M856 818L875 719L937 656L1004 675L1066 751L1035 833L924 861Z',
      'url(#stone)',
      1,
      texture,
    ) + path('M888 792L946 690L954 755L1022 797L1019 830L925 846Z', '#5f7165', 0.5),
  )
  content += group(
    'ginkgo-branch',
    brush(
      [
        [443, 858],
        [573, 705],
        [694, 443],
        [929, 230],
      ],
      47,
      '#6a5941',
    ) +
      brush(
        [
          [632, 582],
          [725, 548],
          [856, 576],
          [1028, 480],
        ],
        22,
        '#776046',
      ) +
      brush(
        [
          [728, 425],
          [697, 340],
          [599, 321],
          [518, 269],
        ],
        18,
        '#776046',
      ),
  )
  const leaves = [
    [545, 300, 0],
    [605, 331, -20],
    [674, 354, 15],
    [719, 406, 30],
    [803, 348, -30],
    [852, 285, 18],
    [917, 232, 5],
    [740, 553, -40],
    [822, 563, 16],
    [924, 526, 30],
    [1006, 475, -10],
  ]
  content += group(
    'golden-leaves',
    leaves
      .map(([horizontal, vertical, rotation], index) => {
        const shape =
          path(
            'M0 35Q-11 -1 -51 -42Q-23 -74 -1 -60Q19 -76 53 -43Q14 -7 0 35Z',
            index % 3 ? '#bb9c4f' : '#ceae5a',
            0.94,
            texture,
          ) +
          times(6, (vein) =>
            line(
              `M0 34Q${(vein - 2.5) * 9} -13 ${(vein - 2.5) * 17} ${-47 + Math.abs(vein - 2.5) * 3}`,
              '#dfc276',
              1.4,
              0.65,
            ),
          ) +
          line('M0 36L0 58', '#967e45', 3)
        return group(
          'leaf-' + index,
          shape,
          `transform="translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${index % 2 ? 0.75 : 1})"`,
        )
      })
      .join(''),
  )
  content += group(
    'fallen-leaf',
    path('M619 837Q587 815 570 832Q586 855 622 855Q645 875 665 849L631 841Z', '#c4a250', 0.8),
  )
  return content
}

function orchid() {
  let content = group(
    'root-rock',
    wash('M513 853Q657 813 838 835L1018 880L751 897L557 885Z', '#8e8d6c', 0.26) +
      path('M895 836L917 750L965 721L1019 773L1003 849Z', '#8b927e', 0.75, texture) +
      path('M917 834L952 768L973 817L991 843Z', '#657b69', 0.5),
  )
  const blades = [
    [[742, 861], [694, 709], [588, 535], [455, 491], 31],
    [[746, 858], [622, 693], [511, 681], [403, 727], 26],
    [[751, 860], [765, 676], [787, 480], [858, 408], 28],
    [[755, 864], [860, 689], [986, 637], [1118, 687], 27],
    [[748, 862], [792, 746], [685, 514], [642, 439], 24],
    [[754, 858], [925, 811], [1008, 757], [1070, 760], 21],
    [[746, 860], [622, 779], [511, 814], [476, 837], 25],
  ]
  content += group(
    'orchid-blades',
    blades
      .map(([start, control, after, end, width], index) =>
        brush([start, control, after, end], width, index % 2 ? '#5a7961' : '#3f6654', 0.9),
      )
      .join(''),
  )
  content += group(
    'flower-stems',
    brush(
      [
        [748, 853],
        [719, 685],
        [715, 548],
        [756, 423],
      ],
      7,
      '#65805d',
      0.9,
    ) +
      brush(
        [
          [756, 850],
          [814, 689],
          [878, 591],
          [960, 514],
        ],
        7,
        '#65805d',
        0.85,
      ),
  )
  content += group(
    'orchid-flowers',
    [
      [751, 442, -17],
      [769, 515, 21],
      [895, 588, 8],
      [965, 516, -15],
    ]
      .map(([horizontal, vertical, rotation], index) => {
        let flower = path(
          'M0 4Q-30 -51 -12 -73Q10 -70 10 -7Q44 -51 64 -29Q55 -9 13 9Q52 27 43 53Q13 51 3 20Q-20 64 -39 48Q-42 26 -8 8Q-63 11 -66 -14Q-42 -30 0 4Z',
          index % 2 ? '#a6b38e' : '#c7c9a5',
          0.97,
          texture,
        )
        flower +=
          path('M-9 9Q4 -2 19 10Q16 31 3 35Q-10 26 -9 9Z', '#9a835f') +
          line('M-2 14L7 24M6 12L12 19', '#6e6250', 2, 0.8)
        return group(
          'flower-' + index,
          flower,
          `transform="translate(${horizontal} ${vertical}) rotate(${rotation})"`,
        )
      })
      .join(''),
  )
  return content
}

function flagDrum() {
  let content = group(
    'banner-pole',
    line('M553 830L605 204', '#776047', 16) +
      path('M596 213L610 166L622 213Z', '#69715b') +
      path(
        'M612 227Q747 275 930 235L915 339L856 375L918 438Q760 471 593 408Z',
        'url(#vermilion)',
        1,
        texture,
      ) +
      path('M612 227Q750 272 930 235L915 267Q770 298 607 261Z', '#c59c66', 0.7) +
      brush(
        [
          [610, 283],
          [725, 319],
          [833, 287],
          [919, 277],
        ],
        16,
        '#713e35',
        0.35,
      ) +
      brush(
        [
          [601, 369],
          [717, 401],
          [815, 367],
          [889, 403],
        ],
        18,
        '#d2916a',
        0.4,
      ),
  )
  let drum =
    path('M719 596Q902 547 1089 596L1083 786Q902 851 725 786Z', 'url(#vermilion)', 1, texture) +
    ellipse(904, 595, 187, 67, '#987344') +
    ellipse(904, 589, 170, 53, 'url(#skin)') +
    ellipse(904, 589, 145, 41, 'none', 0.65, 'stroke="#9a8054" stroke-width="3"')
  drum +=
    line('M736 773Q900 827 1071 774', '#c4a16a', 8) +
    times(12, (index) => {
      const angle = (index * Math.PI) / 6
      return ellipse(904 + Math.cos(angle) * 177, 595 + Math.sin(angle) * 60, 4, 4, '#d0b27a')
    }) +
    times(7, (index) =>
      line(`M${754 + index * 48} ${641 + Math.sin(index * 0.5) * 13}l7 126`, '#773d32', 4, 0.65),
    )
  content +=
    group(
      'drum-stand',
      path('M756 779L790 789L758 884L722 884ZM1012 788L1045 780L1082 884L1045 884Z', '#69543e') +
        line('M764 854H1046', '#8f6e47', 12),
    ) + group('war-drum', drum)
  content += group(
    'drumsticks',
    line('M846 561L1057 472', '#9b7b4e', 10) +
      ellipse(1058, 472, 21, 13, '#c0a16c', 1, 'transform="rotate(-23 1058 472)"') +
      line('M800 549L1026 573', '#937047', 10) +
      ellipse(1025, 573, 21, 13, '#bb965f'),
  )
  return content
}

const studies = [
  {
    id: 'bronze-tiger-tally',
    name: '虎符合信',
    theme: '文字制度与器用 · 符节军令',
    category: 'color',
    note: '铜褐虎形 · 合缝与抽象嵌纹 · 非特定虎符复原',
    draw: tigerTally,
  },
  {
    id: 'lobed-bronze-mirror',
    name: '菱镜流光',
    theme: '文字制度与器用 · 铜镜日用',
    category: 'color',
    note: '菱花镜面与飞鸟背纹 · 铜金转面 · 木座承托',
    draw: bronzeMirror,
  },
  {
    id: 'bamboo-bound-slips',
    name: '简牍遗音',
    theme: '文字制度与器用 · 文字书籍',
    category: 'color',
    note: '竹黄简面 · 编绳卷束 · 抽象墨痕非史料文本',
    draw: bambooSlips,
  },
  {
    id: 'stone-sundial',
    name: '晷影知时',
    theme: '生产交流与图解 · 天文计时',
    category: 'color',
    note: '青灰石盘 · 晷针投影 · 计时器物意象',
    draw: sundial,
  },
  {
    id: 'herbal-grinding-trough',
    name: '本草碾香',
    theme: '生产交流与图解 · 医药器用',
    category: 'color',
    note: '石碾轮槽 · 药叶根片 · 非药材鉴定图',
    draw: herbalMedicine,
  },
  {
    id: 'seal-and-clay',
    name: '印泥封信',
    theme: '文字制度与器用 · 文书印信',
    category: 'color',
    note: '桥钮铜印 · 朱砂印泥盒 · 绳束封泥与抽象印迹',
    draw: sealAndClay,
  },
  {
    id: 'wooden-pipa',
    name: '琵琶弦语',
    theme: '文字制度与器用 · 音乐表演',
    category: 'color',
    note: '木色梨腹 · 曲项弦轴 · 乐器通用意象',
    draw: pipa,
  },
  {
    id: 'caravan-bells-and-bag',
    name: '驼铃行囊',
    theme: '生产交流与图解 · 丝路商旅',
    category: 'color',
    note: '铜铃皮囊 · 石蓝织物 · 冷暖材料相衬',
    draw: caravanGoods,
  },
  {
    id: 'academy-timber-corridor',
    name: '书院廊影',
    theme: '建筑与历史空间 · 教育庭院',
    category: 'ink',
    note: '青灰薄檐 · 木柱栏杆 · 斜向纵深与庭竹',
    draw: academyCorridor,
  },
  {
    id: 'ginkgo-autumn-rock',
    name: '银杏秋石',
    theme: '自然与环境 · 林木四时',
    category: 'ink',
    note: '金黄扇叶 · 曲褐枝势 · 青灰近石',
    draw: ginkgoRock,
  },
  {
    id: 'orchid-by-rock',
    name: '兰草幽香',
    theme: '自然与环境 · 花卉园圃',
    category: 'ink',
    note: '墨绿长叶 · 青白幽花 · 收锋交错与留白',
    draw: orchid,
  },
  {
    id: 'banner-and-war-drum',
    name: '旌旗鼓角',
    theme: '军事与交通 · 仪仗军需',
    category: 'color',
    note: '绛红旌旗 · 赭金鼓面 · 木架支承与鼓槌',
    draw: flagDrum,
  },
]

mkdirSync(destination, { recursive: true })
for (const study of studies) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}。原创代码彩墨意象，非具体文物或技术复原。透明背景。</desc>${definitions}${study.draw()}</svg>`
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
console.log('Generated twelve new heritage ink studies')
