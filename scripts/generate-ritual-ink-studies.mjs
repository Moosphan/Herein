import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/ritual-studies/ink-wash',
)
const grain = 'filter="url(#pigment)"'
const times = (count, draw) => Array.from({ length: count }, (_, index) => draw(index)).join('')
const path = (shape, color, opacity = 1, extra = grain) =>
  `<path d="${shape}" fill="${color}" opacity="${opacity}" ${extra}/>`
const line = (shape, color = '#46594a', width = 2, opacity = 1) =>
  `<path d="${shape}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1) =>
  `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${color}" opacity="${opacity}" ${grain}/>`
const transform = (content, position) => `<g transform="${position}">${content}</g>`
const group = (identity, content) => `<g id="${identity}">${content}</g>`
const definitions = `<defs>
<filter id="pigment" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".34" numOctaves="2" seed="223" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .17 0 0 0 .83" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="paint"/><feTurbulence type="fractalNoise" baseFrequency=".037" numOctaves="2" seed="62" result="edge"/><feDisplacementMap in="paint" in2="edge" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="soft" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="4"/></filter>
${[
  ['leaf', '#a6ae72', '#788d55', '#3e6451'],
  ['dark-leaf', '#8d9d6d', '#58745a', '#344f45'],
  ['white', '#eee7d8', '#d8dac7', '#99ad9d'],
  ['pink', '#daaaa9', '#bd708c', '#874f74'],
  ['purple', '#ab91a9', '#856a94', '#584b74'],
  ['gold', '#e5c36b', '#b79a47', '#7f723e'],
  ['yellow', '#efd071', '#cca948', '#928139'],
  ['wood', '#b59b6c', '#89734e', '#574e3c'],
  ['red', '#b36550', '#90483d', '#603636'],
  ['bronze', '#b9ab75', '#7c8b6e', '#465f58'],
  ['clay', '#bd956d', '#98724f', '#654f3c'],
  ['jade', '#d1d6b5', '#a2baa4', '#608a7d'],
  ['stone', '#b2b4a2', '#8b9a8d', '#586e68'],
  ['earth', '#cfb486', '#ac8d5c', '#7e6b4c'],
  ['beetle', '#b4b06a', '#6f9270', '#365f59'],
]
  .map(
    ([identity, start, middle, end]) =>
      `<linearGradient id="${identity}" x1="10%" y1="0%" x2="75%" y2="100%"><stop stop-color="${start}"/><stop offset=".48" stop-color="${middle}"/><stop offset="1" stop-color="${end}"/></linearGradient>`,
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
  for (let step = 0; step <= 30; step++) {
    const fraction = step / 30
    const center = curve(fraction)
    const before = curve(Math.max(0, fraction - 0.003))
    const after = curve(Math.min(1, fraction + 0.003))
    const length = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
    const normal = [-(after[1] - before[1]) / length, (after[0] - before[0]) / length]
    const breadth =
      (width * (0.35 + 0.65 * Math.sin(Math.PI * fraction)) * (1 - fraction * 0.78)) / 2
    left.push(center.map((value, axis) => +(value + normal[axis] * breadth).toFixed(2)))
    right.unshift(center.map((value, axis) => +(value - normal[axis] * breadth).toFixed(2)))
  }
  return path(
    'M' + [...left, ...right].map((point) => point.join(' ')).join('L') + 'Z',
    color,
    opacity,
  )
}

function branch(shape, width = 12) {
  return `<g ${grain}>${line(shape, '#6b5d46', width)}${line(shape, '#ac9870', width * 0.23, 0.6)}</g>`
}

function leaf(horizontal, vertical, angle, scale = 1, color = 'url(#leaf)', broad = false) {
  return transform(
    path(
      broad
        ? 'M0 0C-67 -24 -101 -102 -33 -151Q-6 -179 0 -200Q13 -173 42 -153C102 -98 71 -25 0 0Z'
        : 'M0 0C-43 -33 -49 -101 -9 -154C24 -116 45 -49 0 0Z',
      color,
    ) +
      line(
        broad
          ? 'M0 -5Q-12 -97 0 -188M-7 -47L-49 -83M-9 -80L-53 -119M-9 -107L-30 -148M-5 -56L46 -99M-7 -94L31 -141'
          : 'M0 -4Q-8 -69 -9 -144',
        '#c7c59a',
        1.7,
        0.55,
      ),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function rock(horizontal, vertical, scale = 1) {
  return transform(
    path('M-139 14L-118 -62L-67 -114L-21 -93L32 -139L103 -86L142 21L64 43L-65 38Z', 'url(#stone)') +
      path('M32 -139L18 -44L64 43L142 21L103 -86Z', '#58756c', 0.46) +
      times(14, (index) =>
        brush(
          [
            [-106 + (index % 5) * 41, -46 - Math.floor(index / 5) * 22],
            [-111 + (index % 5) * 41, -26 - Math.floor(index / 5) * 20],
            [-101 + (index % 5) * 41, -16 - Math.floor(index / 5) * 20],
            [-108 + (index % 5) * 41, -4 - Math.floor(index / 5) * 20],
          ],
          3.4,
          '#536e62',
          0.46,
        ),
      ),
    `translate(${horizontal} ${vertical}) scale(${scale})`,
  )
}

function hosta() {
  const foliage = [
    [750, 811, -64, 1.5],
    [773, 827, -29, 1.66],
    [804, 820, 11, 1.92],
    [827, 824, 46, 1.55],
    [737, 826, -91, 1.24],
    [813, 831, 82, 1.28],
  ]
  const flower = (horizontal, vertical, angle, scale) =>
    transform(
      path(
        'M0 0Q14 -13 15 -41L17 -66Q27 -87 41 -91Q28 -74 40 -66Q48 -60 67 -67Q53 -50 37 -47Q47 -34 62 -35Q46 -19 31 -31Q31 -15 19 -9L12 5Z',
        'url(#white)',
      ) +
        path('M17 -66Q27 -52 37 -47L24 -37L15 -41Z', '#bac5ac') +
        line('M14 -8Q19 -36 27 -51M29 -52L47 -57', '#7f9782', 1.6, 0.8) +
        ellipse(47, -57, 3.5, 2, '#b69852'),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'back-leaves',
      foliage
        .slice(0, 3)
        .map(([horizontal, vertical, angle, scale]) =>
          leaf(horizontal, vertical, angle, scale, 'url(#dark-leaf)', true),
        )
        .join(''),
    ) +
    group(
      'flower-stems',
      line('M785 824Q760 601 843 295M771 821Q650 565 678 383', '#6e8c5e', 6) +
        [
          [843, 295, -28, 1.05],
          [822, 368, 44, 0.92],
          [801, 445, -38, 1.15],
          [786, 516, 38, 0.98],
          [678, 383, -42, 0.96],
          [674, 461, 30, 1.12],
          [683, 538, -32, 1],
        ]
          .map((args) => flower(...args))
          .join(''),
    ) +
    group(
      'front-leaves',
      foliage
        .slice(3)
        .map(([horizontal, vertical, angle, scale]) =>
          leaf(horizontal, vertical, angle, scale, 'url(#leaf)', true),
        )
        .join(''),
    ) +
    rock(1062, 842, 0.68)
  )
}

function knotweed() {
  const stems = [
    [642, 276, -35],
    [814, 219, 5],
    [957, 337, 32],
    [1090, 426, 54],
    [711, 457, -25],
  ]
  const spike = (horizontal, vertical, angle) =>
    transform(
      line('M0 0Q25 38 11 102', '#956978', 2.4) +
        times(43, (index) => {
          const fraction = index / 42
          const center = 32 * fraction - 21 * fraction ** 2
          const spread = Math.sin(Math.PI * fraction) * 13
          return ellipse(
            center + Math.sin(index * 2.4) * spread,
            fraction * 98,
            3.2 + Math.sin(Math.PI * fraction) * 2.3,
            4,
            index % 3 ? '#ae6684' : '#d8a2aa',
            0.9,
          )
        }),
      `translate(${horizontal} ${vertical}) rotate(${angle})`,
    )
  return (
    group(
      'stems',
      stems
        .map(([horizontal, vertical]) =>
          line(`M800 840Q${horizontal - 120} 550 ${horizontal} ${vertical}`, '#75865b', 4.5),
        )
        .join(''),
    ) +
    group(
      'narrow-leaves',
      stems
        .map(([horizontal, vertical], index) =>
          [0.38, 0.62, 0.8]
            .map((fraction, order) => {
              const leafHorizontal =
                (1 - fraction) ** 2 * 800 +
                2 * (1 - fraction) * fraction * (horizontal - 120) +
                fraction ** 2 * horizontal
              const leafVertical =
                (1 - fraction) ** 2 * 840 +
                2 * (1 - fraction) * fraction * 550 +
                fraction ** 2 * vertical
              return leaf(
                leafHorizontal,
                leafVertical,
                (index + order) % 2 ? 69 : -71,
                0.78 - order * 0.13,
              )
            })
            .join(''),
        )
        .join(''),
    ) +
    group(
      'drooping-racemes',
      stems.map(([horizontal, vertical, angle]) => spike(horizontal, vertical, angle)).join(''),
    ) +
    group(
      'water',
      line(
        'M435 855Q569 840 699 856M854 858Q1014 845 1173 856M533 881Q687 870 823 882',
        '#87998b',
        2.4,
        0.55,
      ),
    ) +
    rock(574, 833, 0.55)
  )
}

function beans() {
  const pod = (horizontal, vertical, angle, scale = 1) =>
    transform(
      line('M0 -25Q3 -9 0 0', '#6e7e4e', 3.2) +
        path(
          'M0 0C-33 11 -46 72 -22 133Q-11 162 -1 182Q10 142 26 117C50 72 33 19 0 0Z',
          'url(#purple)',
        ) +
        path('M0 8Q19 68 -1 166Q-20 127 -19 91Q-9 63 -14 28Z', '#a992a0', 0.56) +
        line(
          'M-1 8Q20 80 -1 171M-18 42Q-3 27 14 42M-24 76Q-3 59 23 77M-19 112Q-3 98 13 118',
          '#5c5d76',
          2,
          0.65,
        ),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  const trifoliate = (horizontal, vertical, angle, scale) =>
    transform(
      line('M0 0L0 -62M0 -27L-46 -61M0 -27L46 -61', '#657c50', 4) +
        leaf(0, -62, 0, 0.72, 'url(#leaf)', true) +
        leaf(-46, -61, -58, 0.65, 'url(#dark-leaf)', true) +
        leaf(46, -61, 54, 0.65, 'url(#leaf)', true),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'support-and-vine',
      branch('M698 861L770 211', 12) +
        branch('M898 851L830 209', 10) +
        line(
          'M686 848C747 811 674 755 738 706Q849 655 800 612Q674 559 758 496Q843 453 817 402Q779 342 840 295L847 224',
          '#607d56',
          6,
        ) +
        line(
          'M840 295L853.5 296.2M840 295Q865 304 869 325M734 554L661 508M801 648Q914 627 1009 653M817 445L749 445M801 648L873 637M704 759L734 789',
          '#698052',
          3.5,
        ) +
        line(
          'M811 538C862 529 922 555 910 595Q898 619 882 598Q875 582 890 577M781 328Q709 287 692 321Q681 345 704 348Q725 349 717 329',
          '#6d8758',
          2.7,
        ),
    ) +
    group(
      'leaves',
      trifoliate(749, 445, -32, 1.15) +
        trifoliate(873, 637, 38, 1.1) +
        trifoliate(734, 789, -43, 0.94),
    ) +
    group(
      'pods',
      pod(857, 321, -8, 1.12) +
        pod(884, 345, -37, 0.9) +
        pod(655, 532, 17, 1.05) +
        pod(1017, 677, -19, 0.85),
    ) +
    group(
      'small-blossoms',
      [0, 1, 2]
        .map((index) =>
          transform(
            path(
              'M0 0Q-32 -13 -12 -30Q2 -36 9 -19Q33 -33 34 -8Q30 9 12 7Q4 25 -7 13Z',
              'url(#pink)',
            ),
            `translate(${807 + index * 17} ${235 + index * 27}) scale(.68)`,
          ),
        )
        .join(''),
    )
  )
}

function oriole() {
  return (
    group(
      'branch',
      branch('M420 793Q763 729 1140 457', 17) +
        branch('M853 657Q1066 679 1222 582', 8) +
        [
          [552, 760, -52, 0.76],
          [668, 734, 48, 0.9],
          [1044, 532, 34, 0.8],
          [1149, 584, 65, 0.68],
        ]
          .map((args) => leaf(...args))
          .join(''),
    ) +
    group(
      'tail',
      path('M802 604Q874 650 1023 707L1001 724Q893 705 781 650Z', '#4b5344') +
        path('M788 621Q869 660 1001 717L981 734Q881 700 796 665Z', '#a59a4c') +
        line('M829 654L982 715', '#d3b452', 3.5, 0.8),
    ) +
    group(
      'feet',
      line(
        'M744 600L763 677Q774 678 778 689L775 694M763 677Q751 677 748 688M763 679Q765 693 771 697M830 611L849 636Q863 635 868 646L865 652M849 636Q837 637 834 649M850 638Q851 649 858 653',
        '#817259',
        5.2,
      ),
    ) +
    group(
      'body',
      path(
        'M637 448C646 379 724 368 771 414Q811 452 859 509Q900 570 852 623Q819 664 750 636Q676 617 651 548Z',
        'url(#yellow)',
      ) +
        path('M733 447C793 434 854 500 863 553Q867 600 818 615Q768 574 729 488Z', '#414d41') +
        path('M751 457Q811 478 845 542L833 550Q791 487 751 475Z', '#d9b64c') +
        times(7, (index) =>
          line(
            `M${768 + index * 8} ${498 + index * 8}Q${799 + index * 6} ${550 + index * 5} ${818 + index * 3} ${583 + index * 2}`,
            '#8d8c59',
            2.8,
            0.7,
          ),
        ) +
        path('M652 496Q652 566 700 595Q735 619 765 618Q690 580 692 507Z', '#e3c466', 0.7),
    ) +
    group(
      'head',
      path(
        'M637 449Q604 417 620 371Q636 330 683 332Q736 331 750 375L741 419L714 452Q675 482 637 449Z',
        'url(#yellow)',
      ) +
        path('M624 384Q670 369 715 391L746 412L731 430Q691 404 652 407L624 399Z', '#414d42') +
        path('M623 380L548 391L617 405L638 397Z', '#bb8c76') +
        line('M553 392L622 393', '#695b4b', 2.1, 0.9) +
        ellipse(650, 389, 7.5, 8, '#303e36') +
        ellipse(648, 386, 1.7, 1.7, '#d8cd9c') +
        brush(
          [
            [637, 418],
            [657, 440],
            [687, 446],
            [716, 425],
          ],
          11,
          '#e8cb72',
          0.8,
        ),
    )
  )
}

function beetle() {
  const insect = transform(
    group(
      'six-legs',
      line(
        'M-25 -42L-64 -69L-84 -40L-93 -31M27 -42L66 -72L88 -48L99 -40M-41 -12L-78 1L-95 35L-106 39M40 -8L80 6L99 39L108 42M-33 29L-66 54L-71 94L-84 106M32 31L65 58L72 98L82 109',
        '#4c5b43',
        6,
      ) +
        line(
          'M-85 -39L-92 -43M-95 35L-102 31M-71 94L-79 91M88 -48L95 -51M99 39L106 35M72 98L79 94',
          '#84784c',
          2.4,
        ),
    ) +
      group(
        'head',
        path('M-20 -71Q-24 -100 -3 -109Q23 -113 27 -86L20 -67Z', '#506c50') +
          ellipse(-19, -91, 6, 8, '#344c42') +
          ellipse(22, -91, 6, 8, '#344c42') +
          line('M-16 -100L-31 -120L-42 -118M18 -103L31 -123L44 -122', '#606a46', 3.5) +
          path('M-46 -54Q-36 -82 -1 -82Q36 -81 46 -53L35 -30H-32Z', 'url(#beetle)'),
      ) +
      group(
        'wing-cases',
        path(
          'M-38 -39C-68 -5 -57 52 -17 71Q0 81 18 70C63 47 69 -7 38 -39Q1 -52 -38 -39Z',
          'url(#beetle)',
        ) +
          path('M-36 -34Q-53 12 -20 61Q-4 73 -1 70L-1 -40Z', '#a6a268', 0.45) +
          line('M-1 -40L1 72M-33 -30Q-47 12 -20 51M30 -27Q47 10 23 53', '#3c6353', 2.5, 0.9) +
          path('M-1 -39L-11 -23L11 -23Z', '#657e57') +
          times(26, (index) =>
            ellipse(
              -33 + (index % 6) * 13,
              -20 + Math.floor(index / 6) * 17,
              1.2,
              1.7,
              '#546b48',
              0.6,
            ),
          ),
      ),
    'translate(904 535) rotate(24) scale(1.05)',
  )
  return (
    group('twig', branch('M509 827Q789 662 1010 270', 12)) +
    group(
      'support-leaf',
      transform(
        path(
          'M0 0C-171 -13 -217 -141 -124 -291Q-62 -359 -25 -401Q19 -327 104 -290C205 -205 167 -70 0 0Z',
          'url(#dark-leaf)',
        ) +
          line(
            'M0 -5Q-31 -192 -25 -388M-12 -91L-131 -170M-22 -161L-136 -255M-25 -226L-101 -310M-9 -96L106 -179M-20 -175L95 -256M-23 -241L51 -308',
            '#bdbe91',
            3,
            0.62,
          ),
        'translate(819 741) rotate(24)',
      ),
    ) +
    insect +
    group('second-leaf', leaf(610, 760, -52, 1.1, 'url(#leaf)', true))
  )
}

function xun() {
  return (
    group('mat', ellipse(805, 814, 278, 44, '#8c8c67', 0.2)) +
    group(
      'pottery',
      path(
        'M690 305C714 235 798 219 845 262C909 314 1040 478 1022 644Q1004 815 809 833C651 840 555 760 556 642C555 515 643 379 690 305Z',
        'url(#clay)',
      ) +
        path(
          'M698 321C620 467 578 621 627 711Q659 776 737 797C632 771 586 702 596 616Q610 463 698 321Z',
          '#ceb18b',
          0.43,
        ) +
        path(
          'M843 301Q980 464 981 612Q994 745 874 805Q1047 768 1022 611Q998 445 843 301Z',
          '#745c43',
          0.48,
        ) +
        ellipse(767, 280, 46, 18, '#5c4c3a') +
        ellipse(766, 275, 39, 10, '#352f28') +
        line('M728 276Q766 255 808 276', '#d0ad83', 3.2, 0.7),
    ) +
    group(
      'finger-holes',
      [
        [717, 473, 24, 30],
        [842, 453, 25, 29],
        [674, 592, 26, 30],
        [814, 589, 27, 31],
        [920, 570, 20, 28],
      ]
        .map(
          ([horizontal, vertical, radiusX, radiusY]) =>
            ellipse(horizontal + 3, vertical + 3, radiusX + 5, radiusY + 5, '#ba956f') +
            ellipse(horizontal, vertical, radiusX, radiusY, '#4e4435') +
            line(
              `M${horizontal - radiusX + 3} ${vertical + 5}Q${horizontal} ${vertical + radiusY + 10} ${horizontal + radiusX - 4} ${vertical + 5}`,
              '#d0ab7e',
              2.5,
              0.8,
            ),
        )
        .join(''),
    ) +
    group(
      'clay-surface',
      times(42, (index) =>
        ellipse(
          641 + (index % 8) * 39,
          375 + Math.floor(index / 8) * 69,
          1.8,
          2.1,
          '#735b42',
          0.35,
        ),
      ) + line('M654 720Q740 775 861 751M644 732Q741 790 853 765', '#b38d64', 2.2, 0.6),
    )
  )
}

function bronzeYi() {
  return (
    group('rear-foot', path('M888 639L947 635L966 787L936 802L914 773Z', '#5c7260')) +
    group(
      'loop-handle',
      path(
        'M1035 424C1232 372 1240 621 1099 643L1062 603C1176 605 1184 440 1054 475Z',
        'url(#bronze)',
      ) + line('M1074 435C1198 417 1213 581 1107 619', '#c8b884', 4.5, 0.65),
    ) +
    group(
      'body',
      path(
        'M541 439Q622 375 839 387Q1003 394 1093 465L1088 610Q1040 715 867 737Q677 753 586 637Q558 589 541 439Z',
        'url(#bronze)',
      ) +
        path(
          'M541 439Q699 520 905 496Q1027 482 1093 465L1088 488Q1020 537 839 544Q640 544 552 469Z',
          '#566f5e',
        ) +
        path('M596 540Q739 597 1047 540L1040 572Q742 634 602 574Z', '#a7a575', 0.8) +
        line('M601 560Q800 628 1045 554', '#4b6557', 4.2, 0.8),
    ) +
    group(
      'basin',
      ellipse(822, 450, 273, 67, '#b7b181') +
        ellipse(825, 450, 241, 48, '#596e5b') +
        ellipse(819, 465, 204, 28, '#8d9874') +
        path('M565 426Q461 405 371 445L420 478Q489 450 580 474Z', 'url(#bronze)') +
        path('M379 446Q470 421 569 445L569 458Q469 436 414 463Z', '#4d6857') +
        line('M384 443Q462 418 551 436', '#d1bc86', 4, 0.8),
    ) +
    group(
      'front-feet',
      path('M636 661L693 692L674 810Q654 831 622 815L619 801Z', 'url(#bronze)') +
        path('M970 687L1024 666L1047 800Q1040 823 1004 818L989 806Z', 'url(#bronze)'),
    ) +
    group(
      'relief',
      times(7, (index) =>
        transform(
          line(
            'M-24 0Q-24 -20 -8 -20Q10 -19 7 -4Q5 8 -6 3Q-13 -4 -5 -9M10 -17L24 -18V13H-24',
            '#526e5b',
            3,
            0.8,
          ),
          `translate(${639 + index * 58} ${615 + Math.sin((index / 6) * Math.PI) * 25})`,
        ),
      ) + line('M632 774L653 788M1010 781L1032 780', '#b8ac7a', 3, 0.7),
    )
  )
}

function jadeHuang() {
  const body = 'M447 369C505 714 1074 754 1182 375L1090 334C991 596 647 590 543 329Z'
  return (
    group(
      'back-cords',
      line('M470 393Q442 258 637 214Q823 141 1118 349', '#894e47', 9) +
        line('M476 393Q453 271 640 226Q850 159 1111 349', '#be8060', 2.4, 0.8),
    ) +
    group(
      'jade-thickness',
      path('M447 369C505 714 1074 754 1182 375L1182 398C1076 779 503 738 447 391Z', '#73927c'),
    ) +
    group(
      'jade-body',
      path(
        body +
          'M496 379a13 16 0 1 0 26 0a13 16 0 1 0 -26 0M1110 385a13 16 0 1 0 26 0a13 16 0 1 0 -26 0',
        'url(#jade)',
        1,
        'fill-rule="evenodd" ' + grain,
      ) +
        line(
          'M469 391C566 691 1033 713 1157 398M550 363C672 618 1007 615 1086 369',
          '#d8d4b1',
          4.1,
          0.65,
        ),
    ) +
    group(
      'carved-pattern',
      times(14, (index) => {
        const angle = Math.PI * (0.12 + (index / 13) * 0.76)
        const horizontal = 814 - Math.cos(angle) * 285
        const vertical = 384 + Math.sin(angle) * 235
        return transform(
          line(
            'M-10 9Q-23 -1 -13 -14Q0 -26 13 -12Q22 -1 10 8Q-1 14 -5 3Q-7 -5 2 -6',
            '#6b9580',
            2.4,
            0.7,
          ),
          `translate(${horizontal} ${vertical}) rotate(${90 - (angle * 180) / Math.PI})`,
        )
      }),
    ) +
    group(
      'front-ties',
      line('M509 382L489 357M1123 383L1120 353', '#99564b', 8) +
        path('M791 649L807 632L825 649L816 667L800 669Z', 'url(#red)') +
        line('M807 665Q786 712 799 755M816 665Q843 719 834 756', '#985647', 6) +
        times(17, (index) =>
          brush(
            [
              [799 + index * 2.4, 753],
              [788 + index * 3, 792],
              [797 + index * 3, 833],
              [791 + index * 3, 877 - (index % 4) * 5],
            ],
            3.8,
            index % 3 ? '#a45a4b' : '#ba8161',
            0.85,
          ),
        ),
    )
  )
}

function chimes() {
  const chime = (horizontal, vertical, scale) =>
    transform(
      line(
        `M-24 ${(321 - vertical) / scale}L-24 0M27 ${(321 - vertical) / scale}L27 9`,
        '#7c7252',
        3.4,
      ) +
        path('M-39 -5L3 -12L79 78L62 109L-9 49L-72 138L-103 115Z', 'url(#stone)') +
        path(
          'M-103 115L-72 138L-70 147L-104 124ZM62 109L79 78L83 88L65 119L-9 59L-70 147L-72 138L-9 49Z',
          '#5a7468',
        ) +
        ellipse(-24, 7, 5, 6, '#425f52') +
        ellipse(27, 22, 5, 6, '#425f52') +
        line('M-24 -6L-24 9M27 6L27 24', '#7c7252', 3.4) +
        line('M-31 17L-88 114M5 12L67 82', '#c3c1a5', 2.3, 0.55),
      `translate(${horizontal} ${vertical}) scale(${scale})`,
    )
  return (
    group(
      'frame',
      path('M418 795L460 795L472 293H438ZM1144 795H1185L1163 293H1129Z', 'url(#red)') +
        path('M392 290H1201V327H392Z', 'url(#wood)') +
        path('M392 276Q417 260 446 278H1148Q1182 260 1201 276V294H392Z', '#a68554') +
        path('M385 793H485L509 831H359ZM1100 793H1201L1226 831H1078Z', 'url(#wood)') +
        line('M432 354L474 405M1131 405L1171 354', '#b38d59', 9),
    ) +
    group(
      'hanging-stones',
      chime(568, 448, 1.05) +
        chime(770, 439, 0.97) +
        chime(953, 428, 0.86) +
        chime(1111, 417, 0.75),
    ) +
    group(
      'mallet',
      transform(
        path('M0 0H13V192H0Z', 'url(#wood)') + ellipse(6, 0, 24, 14, '#877452'),
        'translate(740 665) rotate(-34)',
      ),
    ) +
    group(
      'beam-decoration',
      times(15, (index) => line(`M${433 + index * 48} 303h20`, '#6f6c47', 2.4, 0.7)),
    )
  )
}

function grainTray() {
  const basket =
    'M435 555C427 457 613 385 813 397C1027 392 1198 471 1195 566L1185 623Q1128 767 817 782C572 786 438 688 435 555Z'
  const face =
    'M453 548C451 463 626 412 814 419C1016 411 1181 480 1176 559Q1143 692 811 711C600 714 470 643 453 548Z'
  return (
    group(
      'tray',
      path(basket, 'url(#wood)') +
        `<defs><clipPath id="tray-face"><path d="${face}"/></clipPath></defs>` +
        path(face, '#b49d6c') +
        `<g clip-path="url(#tray-face)">${times(32, (index) => line(`M${390 + index * 29} 400L${630 + index * 29} 765`, '#7c744e', 2.4, 0.57))}${times(22, (index) => line(`M390 ${410 + index * 17}Q800 ${470 + index * 17} 1230 ${350 + index * 17}`, '#d3bc82', 3.2, 0.8))}</g>` +
        line(
          'M439 554C434 455 619 395 814 408C1030 399 1190 474 1186 563Q1155 705 813 725C576 729 448 649 439 554Z',
          '#ccb27b',
          17,
        ) +
        line(
          'M444 553C443 459 623 404 814 416C1021 405 1181 479 1177 561Q1147 698 813 715C582 721 459 644 444 553Z',
          '#8b7b53',
          3.2,
        ) +
        times(41, (index) => {
          const angle = (index * Math.PI * 2) / 41
          const horizontal = 812 + Math.cos(angle) * 372
          const vertical = 559 + Math.sin(angle) * 160
          return transform(
            line('M-2 -7L2 7', '#7f744e', 2.8, 0.8),
            `translate(${horizontal} ${vertical}) rotate(${(angle * 180) / Math.PI + 90})`,
          )
        }),
    ) +
    group(
      'rice-grains',
      times(150, (index) => {
        const angle = index * 2.4
        const radius = Math.sqrt(index / 150)
        return transform(
          ellipse(0, 0, 6.8, 2.8, index % 3 ? '#dfc688' : '#c3a466'),
          `translate(${802 + Math.cos(angle) * radius * 224} ${550 + Math.sin(angle) * radius * 83}) rotate(${(index * 41) % 180})`,
        )
      }),
    ) +
    group(
      'rice-panicles',
      times(4, (index) =>
        transform(
          line('M0 180Q-35 79 0 -38', '#9a8c4b', 3) +
            times(22, (seed) => {
              const fraction = seed / 21
              const horizontal = -19 * Math.sin(fraction * Math.PI)
              const vertical = -35 + fraction * 142
              return (
                line(`M${horizontal} ${vertical}l${seed % 2 ? 20 : -22} 15`, '#a08b46', 1.5) +
                transform(
                  ellipse(0, 0, 5, 10, 'url(#gold)'),
                  `translate(${horizontal + (seed % 2 ? 22 : -24)} ${vertical + 16}) rotate(${seed % 2 ? -35 : 35})`,
                )
              )
            }),
          `translate(${493 + index * 36} ${389 + index * 11}) rotate(${-43 + index * 6})`,
        ),
      ),
    )
  )
}

function lamp() {
  return (
    group(
      'base',
      path('M654 791L780 745L943 780L1012 831L836 866L614 824Z', 'url(#red)') +
        path('M614 824L836 866L1012 831V856L836 893L614 848Z', '#774336') +
        path('M644 836L662 839V872L642 878ZM966 842L986 838L988 867L968 872Z', '#6b4836'),
    ) +
    group(
      'stem',
      path('M779 744L800 413H839L855 764Q815 784 779 744Z', 'url(#red)') +
        ellipse(819, 731, 58, 17, 'url(#wood)') +
        ellipse(819, 512, 42, 14, 'url(#wood)') +
        line('M805 546L797 706', '#c1895e', 4.4, 0.6),
    ) +
    group(
      'oil-bowl',
      path('M626 369Q802 427 1004 365L979 433Q818 502 657 434Z', 'url(#bronze)') +
        ellipse(816, 365, 190, 49, '#bdb17d') +
        ellipse(816, 364, 167, 33, '#6e7350') +
        ellipse(808, 374, 141, 19, '#9b925c', 0.65) +
        path('M638 366L599 345L585 363L628 395Z', '#aa9a64') +
        line('M593 357L610 360', '#524b36', 8),
    ) +
    group(
      'flame',
      path('M596 348C561 323 602 292 591 257C636 305 622 331 596 348Z', '#ce9249', 0.85) +
        path('M598 340Q580 325 599 298Q616 325 598 340Z', '#ead08a'),
    ) +
    group(
      'book',
      path('M1029 693L1219 742L1152 800L965 750Z', '#80928c') +
        path('M965 750L1152 800V823L965 773Z', '#d8c9a6') +
        path('M1152 800L1219 742V763L1152 823Z', '#b0b79e') +
        line('M980 759L1139 802M983 768L1139 811M1048 705L1010 743', '#8d9b88', 2.2, 0.8),
    )
  )
}

function earthenGate() {
  return (
    group(
      'distant-hills',
      path('M342 701L443 541L532 573L610 445L748 604L853 527L1076 702Z', '#9fa58d', 0.28) +
        path('M949 718L1069 488L1160 538L1260 408L1362 690Z', '#819b91', 0.2),
    ) +
    group(
      'rear-wall',
      path('M951 363L1109 404L1180 794L1055 827Z', 'url(#earth)') +
        path('M1109 404L1180 794L1055 827L1023 427Z', '#8f7a53'),
    ) +
    group(
      'main-wall',
      path(
        'M423 368L951 363L1055 827L348 827Z M744 550H890V827H744Z',
        'url(#earth)',
        1,
        'fill-rule="evenodd" ' + grain,
      ) +
        path('M423 368L464 340L987 338L951 363Z', '#d7bd8e') +
        path('M371 714L430 403L451 412L405 744Z', '#d7bd8e', 0.4),
    ) +
    group(
      'gate-depth',
      path('M744 550L779 583V827H744ZM744 550H890L911 583H779Z', '#7b6e4e') +
        path('M779 583H890V827H779Z', '#485347') +
        path('M817 670H890V827H817Z', '#778977', 0.55) +
        path('M728 529H904V555H728Z', 'url(#wood)') +
        line('M736 541H893', '#6a6044', 3, 0.75),
    ) +
    group(
      'earth-layers',
      times(14, (index) => {
        const vertical = 404 + index * 28
        const left = 419 - index * 4.8
        const right = 959 + index * 6.4
        return line(
          `M${left} ${vertical}Q${left + 101} ${vertical + 9} 718 ${vertical - 2}${vertical < 529 ? `Q820 ${vertical + 6} ${right} ${vertical - 1}` : `M916 ${vertical}L${right} ${vertical - 1}`}`,
          '#8e7a53',
          2.5,
          0.4,
        )
      }) +
        times(48, (index) =>
          ellipse(
            430 + (index % 7) * 46,
            434 + Math.floor(index / 7) * 50,
            3 + (index % 3),
            1.8,
            '#8d7a50',
            0.45,
          ),
        ),
    ) +
    group(
      'road',
      path('M744 827H890L1158 924L505 924Z', '#b4a277', 0.24) +
        line('M764 851L664 903M879 850L1038 905', '#a69267', 2.5, 0.36),
    ) +
    group(
      'ground',
      rock(445, 863, 0.37) +
        times(12, (index) =>
          brush(
            [
              [1172 + index * 5, 845],
              [1143 + index * 8, 809],
              [1173 + index * 6, 783],
              [1154 + index * 9, 744 + (index % 3) * 18],
            ],
            6,
            '#8a8b57',
            0.8,
          ),
        ),
    )
  )
}

const studies = [
  {
    id: 'hosta-white-trumpets',
    name: '玉簪花影',
    category: 'color',
    theme: '玉簪 / 月白与浓叶',
    note: '阔心叶从根丛展开，长花葶承接侧开的白色筒花，叶脉顺体面。',
    draw: hosta,
  },
  {
    id: 'red-knotweed-riverside',
    name: '红蓼秋汀',
    category: 'color',
    theme: '红蓼 / 胭脂与苔青',
    note: '弯垂花穗与连续花轴共用变换，披针叶依茎附着，水面留白。',
    draw: knotweed,
  },
  {
    id: 'purple-hyacinth-bean-vine',
    name: '扁豆垂荚',
    category: 'color',
    theme: '扁豆 / 烟紫与豆青',
    note: '三出复叶、攀援藤与阔扁紫荚分别成组，幼花、叶柄与荚梗接藤。',
    draw: beans,
  },
  {
    id: 'oriole-golden-perch',
    name: '黄鹂栖枝',
    category: 'figures',
    theme: '黄鹂 / 金黄与墨羽',
    note: '黑色贯眼纹、折叠黑翼与金黄胸背，脚趾包扣树枝，非物种图谱。',
    draw: oriole,
  },
  {
    id: 'chafer-on-broad-leaf',
    name: '金龟伏叶',
    category: 'figures',
    theme: '金龟子 / 铜金与青碧',
    note: '头胸、成对鞘翅与六足分层，躯体实体，足尖落在可承托叶面。',
    draw: beetle,
  },
  {
    id: 'clay-xun-five-holes',
    name: '陶埙古韵',
    category: 'color',
    theme: '陶埙 / 熟褐与暖赭',
    note: '卵形陶体、顶端吹口与五处可见指孔有壁厚，孔数不作为具体古埙复原。',
    draw: xun,
  },
  {
    id: 'bronze-yi-basin',
    name: '铜匜沃盥',
    category: 'color',
    theme: '铜匜 / 古铜与青锈',
    note: '浅腹长流、后鋬、三足及连续内腔，原创礼器形态练习，非具名文物复原。',
    draw: bronzeYi,
  },
  {
    id: 'jade-huang-red-cords',
    name: '玉璜双系',
    category: 'color',
    theme: '玉璜 / 青白与绛绦',
    note: '弧形玉体保留实体厚度，端部穿孔真正镂空，双系绳与下垂绦束相接。',
    draw: jadeHuang,
  },
  {
    id: 'suspended-stone-chimes',
    name: '磬石悬声',
    category: 'color',
    theme: '编磬意象 / 石青与朱木',
    note: '折角磬石悬在木架横梁下，绳接穿孔，简化四磬不充当历史编列或声学复原。',
    draw: chimes,
  },
  {
    id: 'woven-winnowing-tray',
    name: '笸箩晒谷',
    category: 'color',
    theme: '晒谷 / 竹黄与稻金',
    note: '浅圆笸箩有连续口沿、编织器面和前壁，稻粒落面，稻穗连贯接秆。',
    draw: grainTray,
  },
  {
    id: 'lacquer-lamp-stand',
    name: '灯檠书影',
    category: 'color',
    theme: '灯檠 / 朱漆与微金',
    note: '灯盘接立柱、立柱落座，灯芯与火焰位于油盘一侧，书册另置下方。',
    draw: lamp,
  },
  {
    id: 'rammed-earth-pass',
    name: '夯关秋照',
    category: 'ink',
    theme: '关门 / 土金与远青',
    note: '夯土墙体、门洞侧壁、木楣与地面连续，原创关隘空间，不对应具体遗址。',
    draw: earthenGate,
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
console.log('Generated twelve ritual ink studies')
