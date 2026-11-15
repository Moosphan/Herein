import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/seasonal-studies/ink-wash',
)
const ink = '#35483f'
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
    const breadth =
      (width * (0.25 + 0.75 * Math.sin(Math.PI * fraction)) * (1 - fraction * 0.87)) / 2
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

function leaf(horizontal, vertical, rotation, scale = 1, color = '#5d7c5e') {
  return group(
    `leaf-${horizontal}-${vertical}`,
    path('M0 0Q-59 -46 -29 -146Q10 -102 0 0Z', color, 0.95, texture) +
      line('M0 -2Q-25 -70 -28 -130', '#b5b58a', 1.5, 0.45),
    `transform="translate(${horizontal} ${vertical}) rotate(${rotation}) scale(${scale})"`,
  )
}

const definitions = `<defs>
<filter id="soft" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="pigment" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="2" seed="103" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .23 0 0 0 .77" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in"/></filter>
<radialGradient id="stone" cx="27%" cy="25%" r="90%"><stop stop-color="#9eab99"/><stop offset=".55" stop-color="#7a9083"/><stop offset="1" stop-color="#4f6d65"/></radialGradient>
<radialGradient id="fruit" cx="27%" cy="27%" r="90%"><stop stop-color="#d19b63"/><stop offset=".42" stop-color="#bf7851"/><stop offset=".8" stop-color="#a45241"/><stop offset="1" stop-color="#85453b"/></radialGradient>
<radialGradient id="fur" cx="32%" cy="25%" r="95%"><stop stop-color="#e8e0c6"/><stop offset=".55" stop-color="#d0ceb8"/><stop offset="1" stop-color="#9da99c"/></radialGradient>
<linearGradient id="bronze" x2="95%" y2="65%"><stop stop-color="#bba16c"/><stop offset=".32" stop-color="#a18c59"/><stop offset=".7" stop-color="#677359"/><stop offset="1" stop-color="#4f604c"/></linearGradient>
<linearGradient id="celadon" x2="100%" y2="10%"><stop stop-color="#6d958a"/><stop offset=".28" stop-color="#b5c9ac"/><stop offset=".47" stop-color="#c4cfb1"/><stop offset=".76" stop-color="#8aafa0"/><stop offset="1" stop-color="#577f77"/></linearGradient>
<linearGradient id="bamboo" x2="100%"><stop stop-color="#9a794b"/><stop offset=".35" stop-color="#d4b87b"/><stop offset=".62" stop-color="#d1b778"/><stop offset="1" stop-color="#917544"/></linearGradient>
<linearGradient id="wood" x2="90%" y2="60%"><stop stop-color="#b19062"/><stop offset=".55" stop-color="#8b704b"/><stop offset="1" stop-color="#5d5039"/></linearGradient>
<radialGradient id="rose"><stop stop-color="#e3b2ac"/><stop offset=".6" stop-color="#c98a91"/><stop offset="1" stop-color="#a76779"/></radialGradient>
</defs>`

function peony() {
  let content = group(
    'taihu-rock',
    wash('M743 846Q943 774 1134 841L1200 882L837 902Z', '#6e7c68', 0.18) +
      path(
        'M830 835L840 746Q816 703 849 656L879 643L865 600Q889 548 928 565L957 625L1008 645L1034 731L1095 779L1110 858L1002 888L883 869ZM890 739Q899 711 919 723Q934 739 910 763Q891 763 890 739ZM946 654Q970 642 978 671Q973 694 954 684Q943 679 946 654Z',
        'url(#stone)',
        1,
        `${texture} fill-rule="evenodd"`,
      ) +
      path('M847 820L876 774L889 812L943 850L1006 859L1013 881L882 867Z', '#3f625a', 0.45) +
      brush(
        [
          [880, 692],
          [907, 667],
          [921, 626],
          [917, 587],
        ],
        13,
        '#c0bfa0',
        0.5,
      ) +
      times(14, (index) =>
        ellipse(867 + index * 14, 843 + Math.sin(index) * 18, 8, 3, '#556d50', 0.6),
      ),
  )
  content += group(
    'stems',
    brush(
      [
        [650, 854],
        [683, 684],
        [746, 547],
        [759, 410],
      ],
      16,
      '#657453',
    ) +
      brush(
        [
          [710, 695],
          [581, 636],
          [491, 570],
          [493, 487],
        ],
        12,
        '#647552',
      ) +
      brush(
        [
          [718, 669],
          [824, 613],
          [906, 568],
          [951, 496],
        ],
        10,
        '#6c7c54',
      ),
  )
  content += group(
    'peony-leaves',
    [
      [677, 756, -60, 1.2],
      [700, 694, 46, 1.2],
      [668, 667, -85, 0.9],
      [581, 606, -52, 1],
      [744, 587, 60, 1.15],
      [832, 599, 64, 0.9],
      [890, 545, 30, 0.85],
      [519, 552, -27, 0.8],
    ]
      .map(([horizontal, vertical, angle, scale], index) =>
        leaf(horizontal, vertical, angle, scale, index % 2 ? '#56735b' : '#6d865f'),
      )
      .join(''),
  )
  const bloom = (horizontal, vertical, scale, identity) => {
    let petals = ''
    for (const [ring, count, radius, depth] of [
      [0, 9, 78, 89],
      [1, 7, 45, 70],
      [2, 5, 15, 47],
    ]) {
      petals += times(count, (index) => {
        const rotation = (index * 360) / count + ring * 23 + Math.sin(index * 2.3) * 8
        const pressure = 0.88 + (index % 4) * 0.07
        return (
          path(
            `M-24 12Q-74 -18 -55 -${radius + depth}Q-38 -${radius + depth + 20} -13 -${radius + depth - 7}Q16 -${radius + depth + 29} 43 -${radius + depth - 5}Q77 -${radius + depth - 16} 69 -${radius + 21}Q67 -16 17 18Z`,
            ['#bf808b', '#d7a0a1', '#e2b1a9'][ring],
            0.96,
            `transform="rotate(${rotation}) scale(${pressure} ${1 + Math.cos(index) * 0.09})" ${texture}`,
          ) +
          line(
            `M-8 -${radius + 12}Q-18 -${radius + 43} -29 -${radius + depth - 5}`,
            '#9d6173',
            2,
            0.3,
          ).replace('<path ', `<path transform="rotate(${rotation})" `)
        )
      })
    }
    petals += times(16, (index) =>
      ellipse(Math.cos(index * 2.4) * 25, Math.sin(index * 2.4) * 18, 3, 2, '#c4a052', 0.95),
    )
    return group(
      identity,
      petals,
      `transform="translate(${horizontal} ${vertical}) rotate(-12) scale(${scale})"`,
    )
  }
  content += bloom(758, 391, 1, 'main-peony') + bloom(493, 465, 0.52, 'side-peony')
  return content
}

function pomegranate() {
  let content = group(
    'branches',
    brush(
      [
        [420, 853],
        [655, 692],
        [776, 407],
        [1115, 268],
      ],
      38,
      '#765e44',
    ) +
      brush(
        [
          [683, 611],
          [729, 554],
          [958, 626],
          [1186, 507],
        ],
        20,
        '#806447',
      ) +
      brush(
        [
          [815, 413],
          [811, 350],
          [737, 314],
          [700, 271],
        ],
        15,
        '#806447',
      ),
  )
  content += group(
    'leaves',
    [
      [578, 735, -75, 1],
      [679, 627, -29, 1.2],
      [769, 490, -60, 0.9],
      [851, 400, 30, 1.1],
      [922, 354, 52, 1.1],
      [1069, 290, 50, 0.8],
      [774, 341, -50, 0.8],
      [899, 596, 120, 1],
      [1061, 568, 70, 1],
      [1124, 539, 20, 0.9],
      [697, 568, 80, 0.8],
    ]
      .map(([horizontal, vertical, angle, scale], index) =>
        leaf(horizontal, vertical, angle, scale, index % 2 ? '#748654' : '#526f51'),
      )
      .join(''),
  )
  const fruit = (horizontal, vertical, scale, identity, open = false) => {
    let body = path(
      'M-17 -96Q-88 -109 -105 -42Q-131 37 -69 88Q-8 124 57 93Q127 56 105 -25Q92 -103 23 -96Z',
      'url(#fruit)',
      1,
      texture,
    )
    body +=
      path('M-21 93L-27 124L-11 115L2 137L13 115L30 123L27 93Z', '#8d553c') +
      line('M-5 -99Q-16 -132 -2 -153', '#776043', 6)
    body += wash('M-76 -42Q-60 -83 -21 -77Q-41 -43 -40 13L-81 24Z', '#dfb278', 0.35)
    if (open) {
      body += path('M-65 -47Q-16 -75 50 -44Q76 -8 56 52Q6 87 -56 51Q-86 9 -65 -47Z', '#d4b184')
      body += path(
        'M-55 -35Q-18 -60 0 -28Q34 -57 52 -28L46 39Q15 71 -2 34Q-35 68 -58 35Z',
        '#8c4036',
      )
      body += times(38, (index) => {
        const horizontalSeed = -47 + (index % 7) * 15 + Math.sin(index) * 2
        const verticalSeed = -27 + Math.floor(index / 7) * 14
        return ellipse(
          horizontalSeed,
          verticalSeed,
          6,
          7,
          index % 3 ? '#b66550' : '#d18c66',
          0.98,
          `transform="rotate(${index % 2 ? 17 : -13} ${horizontalSeed} ${verticalSeed})"`,
        )
      })
      body += line('M0 -41L-3 49M-56 4L46 13', '#d4b184', 4, 0.8)
    }
    return group(
      identity,
      body,
      `transform="translate(${horizontal} ${vertical}) rotate(${open ? -12 : 9}) scale(${scale})"`,
    )
  }
  content +=
    group(
      'fruit-bearing-twigs',
      line('M1121 539Q1147 550 1144 573M705 584L696 578', '#806447', 5),
    ) +
    fruit(927, 470, 0.83, 'hanging-fruit') +
    fruit(1128, 679, 0.7, 'lower-fruit') +
    fruit(729, 727, 1, 'split-fruit', true)
  return content
}

function banana() {
  let content = group(
    'rain-stones',
    wash('M460 852Q741 787 1117 846L1222 886L539 896Z', '#758475', 0.2) +
      path(
        'M881 851L903 755L960 697L1032 726L1081 805L1056 871L970 888Z',
        'url(#stone)',
        1,
        texture,
      ) +
      path('M907 840L960 730L976 790L1041 832L1047 864L974 881Z', '#4b6b61', 0.45),
  )
  content += group(
    'leaf-sheaths',
    brush(
      [
        [740, 875],
        [739, 721],
        [776, 559],
        [771, 429],
      ],
      60,
      '#748467',
    ) +
      brush(
        [
          [758, 864],
          [789, 690],
          [826, 560],
          [833, 491],
        ],
        35,
        '#9b9d74',
      ) +
      brush(
        [
          [718, 856],
          [699, 701],
          [677, 613],
          [661, 589],
        ],
        34,
        '#687859',
      ),
  )
  const leaves = [
    [
      'M767 502Q657 287 432 279Q365 343 461 442L482 439L480 450L521 458L528 443L536 463L578 472L586 456L596 477L637 484L647 468L654 489Z',
      'M768 504Q616 357 433 279',
      '#6b8c68',
    ],
    [
      'M774 469Q763 202 971 171Q1032 217 970 336Q882 420 774 469Z',
      'M775 471Q827 277 970 172',
      '#668763',
    ],
    [
      'M790 550Q1002 336 1214 415Q1240 503 1119 549Q949 557 790 550Z',
      'M792 550Q1026 430 1214 416',
      '#507959',
    ],
    [
      'M739 601Q572 448 386 510Q385 603 506 632Q621 621 739 601Z',
      'M740 602Q565 529 386 511',
      '#527654',
    ],
    [
      'M760 640Q952 552 1075 642Q1122 728 1027 777Q922 686 760 640Z',
      'M761 640Q973 627 1027 777',
      '#78966b',
    ],
  ]
  content += group(
    'banana-leaves',
    leaves
      .map(([shape, vein, color], index) => {
        const veins = [
          'M484 310l-20 125M534 336l-17 117M589 372l-7 94M645 413l-2 66M699 455l8 33',
          'M811 379l74 28M832 327l97 46M861 275l104 40M902 225l96 28',
          'M898 500l-7 46M972 469l16 80M1046 443l26 108M1120 426l27 103M1171 421l25 70',
          'M439 525l-12 71M494 540l-6 84M551 557l9 67M608 574l19 44M663 588l18 22',
          'M864 651l44 -59M913 670l66 -63M958 701l96 -64M994 736l95 -45',
        ][index]
        return group(
          'blade-' + index,
          path(shape, color, 0.96, texture) +
            line(vein, '#b0b68a', 3, 0.7) +
            `<defs><clipPath id="blade-clip-${index}">${path(shape)}</clipPath></defs>` +
            group(
              'veins-' + index,
              line(veins, '#c0c29b', 2, 0.36),
              `clip-path="url(#blade-clip-${index})"`,
            ),
        )
      })
      .join(''),
  )
  content += group(
    'rain',
    times(11, (index) =>
      line(`M${410 + index * 72} ${260 + ((index * 97) % 400)}l-8 34`, '#82968b', 2, 0.24),
    ),
  )
  return content
}

function moonRabbit() {
  let content = group(
    'moon',
    ellipse(536, 338, 120, 120, '#e3d9ad', 0.52) +
      wash('M419 356Q508 310 638 337L652 389L433 410Z', '#c5c5a0', 0.2),
  )
  content += group(
    'osmanthus-branch',
    brush(
      [
        [1127, 635],
        [1033, 488],
        [938, 330],
        [738, 253],
      ],
      22,
      '#786447',
    ) +
      brush(
        [
          [982, 409],
          [1077, 332],
          [1118, 269],
          [1182, 256],
        ],
        12,
        '#786447',
      ),
  )
  content += group(
    'osmanthus-leaves',
    [
      [834, 285, -58, 0.7],
      [923, 336, 42, 0.8],
      [1004, 447, 70, 0.8],
      [1078, 333, 60, 0.65],
      [1146, 284, 53, 0.7],
      [1041, 493, 140, 0.75],
    ]
      .map(([horizontal, vertical, angle, scale]) =>
        leaf(horizontal, vertical, angle, scale, '#75885e'),
      )
      .join(''),
  )
  content += group(
    'golden-blossoms',
    times(22, (index) => {
      const horizontal = 830 + (index % 6) * 55 + Math.sin(index) * 18
      const vertical = 320 + Math.floor(index / 6) * 44 + Math.cos(index) * 17
      return group(
        'flower-' + index,
        times(4, (petal) =>
          ellipse(
            Math.cos((petal * Math.PI) / 2) * 5,
            Math.sin((petal * Math.PI) / 2) * 5,
            5,
            4,
            '#c3a65a',
            0.9,
          ),
        ) + ellipse(0, 0, 2, 2, '#96784a'),
        `transform="translate(${horizontal} ${vertical})"`,
      )
    }),
  )
  content += group('ground', wash('M488 830Q755 768 1042 835L1144 873L551 891Z', '#7a8468', 0.22))
  let rabbit =
    ellipse(844, 744, 150, 107, 'url(#fur)', 1, texture) +
    ellipse(774, 696, 97, 111, 'url(#fur)', 1, texture)
  rabbit += path(
    'M675 631Q637 554 652 474Q666 458 683 490Q708 560 705 624Z',
    'url(#fur)',
    1,
    texture,
  )
  rabbit += path(
    'M715 628Q699 520 733 451Q750 433 758 462Q758 560 741 634Z',
    'url(#fur)',
    1,
    texture,
  )
  rabbit +=
    path('M672 580Q652 520 662 492Q684 530 687 583Z', '#bda697', 0.6) +
    path('M728 584Q722 513 744 474Q747 528 738 590Z', '#bda697', 0.6)
  rabbit += path(
    'M656 631Q674 600 720 605Q774 615 785 660Q787 711 741 735Q693 752 656 720L617 704Q603 690 618 679L644 667Z',
    'url(#fur)',
    1,
    texture,
  )
  rabbit +=
    ellipse(920, 823, 99, 29, '#bcc2aa') +
    ellipse(742, 827, 72, 21, '#d2d0b5') +
    path('M720 735Q692 767 700 820L728 829L748 799L763 736Z', '#d2d1b8')
  rabbit +=
    ellipse(984, 750, 39, 34, '#d4d0b6', 1, texture) +
    ellipse(681, 659, 8, 7, '#675b4a') +
    ellipse(679, 657, 2, 2, '#e8ddbe') +
    path('M619 680L632 688L620 695L610 689Z', '#9b7a67')
  rabbit += line('M623 701Q643 713 652 705M632 693l-43 -4M636 702l-42 12', '#8f9684', 2, 0.8)
  rabbit += times(8, (index) =>
    brush(
      [
        [788 + index * 13, 725],
        [803 + index * 13, 749],
        [804 + index * 13, 771],
        [810 + index * 13, 785],
      ],
      4,
      '#a5ad9c',
      0.35,
    ),
  )
  content += group('seated-rabbit', rabbit)
  return content
}

function eagle() {
  let content = group(
    'cliff',
    path(
      'M591 900L644 825L702 790L720 718L782 711L837 770L914 791L1011 869L1059 905Z',
      'url(#stone)',
      1,
      texture,
    ) +
      path('M645 883L722 810L758 738L776 804L851 848L917 901Z', '#4a6961', 0.55) +
      brush(
        [
          [697, 857],
          [720, 810],
          [727, 784],
          [739, 754],
        ],
        13,
        '#b1b5a0',
        0.5,
      ),
  )
  content += group(
    'tail-feathers',
    path(
      'M837 659Q903 702 1018 838L978 846L866 765L932 849L893 844L817 731Z',
      '#4b5145',
      1,
      texture,
    ) + line('M852 699L975 819M847 718L905 822', '#97876b', 3, 0.55),
  )
  let bird = path(
    'M747 395Q764 349 814 379Q884 420 905 525Q936 636 851 721Q803 760 748 688Q686 611 700 522Q700 445 747 395Z',
    '#8c7a5c',
    1,
    texture,
  )
  bird += path('M740 440Q702 489 725 589Q742 645 789 666Q762 593 774 529Z', '#b0a17d', 0.8, texture)
  bird += path(
    'M805 424Q882 428 898 529Q912 636 867 694Q803 669 774 600Q752 505 805 424Z',
    '#5e5d48',
    1,
    texture,
  )
  bird += times(6, (index) =>
    path(
      `M${797 + index * 12} ${475 + index * 18}Q${822 + index * 13} ${539 + index * 12} ${847 + index * 6} ${648 + index * 5}Q${864 + index * 5} ${650 + index * 3} ${862 + index * 5} ${628 + index * 4}Q${853 + index * 9} ${537 + index * 12} ${817 + index * 11} ${464 + index * 18}Z`,
      index % 2 ? '#7f7358' : '#948261',
      0.8,
      texture,
    ),
  )
  bird += times(18, (index) =>
    path(
      'M-10 -10Q0 8 12 -9Q9 17 -1 18Q-13 10 -10 -10Z',
      '#b0a07b',
      0.48,
      `transform="translate(${779 + (index % 4) * 22} ${438 + Math.floor(index / 4) * 25}) rotate(-12)"`,
    ),
  )
  bird += path(
    'M747 401Q704 380 717 337Q737 289 790 305Q832 313 844 354L824 399L782 421Z',
    '#a49a7d',
    1,
    texture,
  )
  bird +=
    path('M721 351L682 366Q673 383 690 401L707 384L736 378Z', '#9e8c58') +
    path('M682 366Q677 383 690 401L697 384Z', '#4e5140')
  bird +=
    path('M723 344L765 337L753 347L724 354Z', '#494b3c') +
    ellipse(742, 352, 7, 6, '#b89b54') +
    ellipse(740, 352, 3.5, 4.5, '#303e36')
  bird += brush(
    [
      [778, 400],
      [789, 416],
      [797, 422],
      [798, 444],
    ],
    12,
    '#d0c3a0',
    0.7,
  )
  bird +=
    line(
      'M778 707L764 747L742 771M764 747l25 17M843 713L825 761L807 782M825 761l27 13',
      '#b49a61',
      11,
    ) + line('M742 771l-8 12M789 764l7 11M807 782l-8 7M852 774l7 10', '#3e4d42', 4)
  content += group('watchful-eagle', bird)
  content += group(
    'wind-grass',
    brush(
      [
        [576, 863],
        [546, 812],
        [525, 785],
        [492, 778],
      ],
      8,
      '#83916e',
      0.8,
    ) +
      brush(
        [
          [583, 874],
          [547, 851],
          [506, 846],
          [473, 853],
        ],
        9,
        '#83916e',
        0.8,
      ),
  )
  return content
}

function celadonVase() {
  let content = group('ground', wash('M535 858Q763 817 1015 851L1081 879L570 896Z', '#7b8873', 0.2))
  let vase = path(
    'M709 348Q726 414 703 471Q690 503 643 541Q596 591 618 696Q644 789 722 820L733 850L876 850L888 820Q978 779 994 682Q1004 598 961 548Q912 507 900 474Q882 416 898 348Z',
    'url(#celadon)',
    1,
    texture,
  )
  vase += ellipse(806, 847, 73, 15, '#6d9586') + ellipse(806, 840, 70, 11, '#a3b89c')
  vase += path('M676 553Q651 623 665 692Q670 730 691 754Q654 647 699 568Z', '#d8dec0', 0.4)
  vase += path('M915 561Q973 622 936 729Q919 775 869 801Q927 718 915 561Z', '#527f75', 0.35)
  vase += line('M730 437Q802 449 882 437M731 452Q802 465 884 451', '#6d9786', 3, 0.6)
  vase += group(
    'incised-lotus',
    times(5, (index) =>
      path(
        'M0 0Q-41 -39 0 -77Q40 -38 0 0Z',
        'none',
        0.5,
        `stroke="#668d7e" stroke-width="2" transform="translate(805 685) rotate(${index * 32 - 64})"`,
      ),
    ) +
      line(
        'M805 686Q799 727 818 753M807 718Q772 692 755 716M809 738Q854 712 876 727',
        '#668d7e',
        2,
        0.5,
      ),
  )
  content += group('celadon-body', vase)
  let rim = path(
    'M688 338Q708 305 737 316Q762 281 790 309Q823 282 853 309Q887 291 910 319Q947 315 932 344Q922 379 882 379Q853 400 820 385Q784 406 754 384Q712 388 703 365Z',
    '#789e8e',
  )
  rim +=
    ellipse(808, 341, 108, 34, '#456e64') +
    ellipse(808, 338, 94, 24, '#5d8778') +
    path(
      'M699 339Q716 366 751 364Q778 387 808 372Q838 384 865 366Q907 370 930 341L917 366Q893 387 864 382Q837 398 807 387Q773 400 747 380Q714 380 704 363Z',
      '#afc5a7',
    )
  rim += line(
    'M704 339Q716 316 737 324M755 318Q774 302 789 316M813 317Q834 301 850 318M871 320Q892 309 907 327',
    '#d1d7b8',
    3,
    0.75,
  )
  content += group('lotus-mouth', rim)
  return content
}

function bronzeJue() {
  let content = group(
    'ground',
    wash('M478 847Q782 801 1116 854L1158 886L509 901Z', '#7f7a58', 0.18),
  )
  content += group('rear-leg', path('M824 643L906 843L878 859L764 666Z', '#606b50', 1, texture))
  content += group(
    'handle',
    path(
      'M958 445Q1092 395 1111 497Q1131 588 999 623L990 588Q1084 562 1079 507Q1071 446 968 482Z',
      'url(#bronze)',
      1,
      texture,
    ),
  )
  let body = path(
    'M572 429Q779 490 1004 426L982 610Q923 688 790 700Q670 689 617 610Z',
    'url(#bronze)',
    1,
    texture,
  )
  body += path(
    'M626 584Q668 640 782 666Q916 659 976 603L963 632Q884 711 790 700Q673 686 626 635Z',
    '#58694e',
    0.7,
  )
  body +=
    path('M626 599L700 648L641 853L603 870L615 826L659 658Z', 'url(#bronze)', 1, texture) +
    path('M886 666L954 629L1042 855L1007 871L956 777Z', 'url(#bronze)', 1, texture)
  body += path(
    'M565 421Q509 416 460 376Q588 389 678 372Q833 336 1003 387L1074 420Q923 461 774 458Q647 460 565 421Z',
    '#aa965f',
  )
  body += path(
    'M521 397Q669 428 777 427Q889 426 999 407Q913 377 777 385Q661 410 521 397Z',
    '#52634b',
  )
  body += line('M480 384Q586 421 707 420M793 446Q942 443 1051 419', '#d1b77d', 3, 0.7)
  body += group(
    'cast-relief',
    times(2, (index) =>
      group(
        'mask-' + index,
        line(
          'M-66 -21h42v-14h48v14h40v43H23V7H-23v29h-41V2h25M-43 -6h15M31 -6h15M-3 -24v68',
          '#506448',
          5,
          0.65,
        ) + line('M-61 -26h35v-15h52v15h33', '#c2aa70', 3, 0.7),
        `transform="translate(${712 + index * 176} 534) scale(.9 .9)"`,
      ),
    ),
  )
  body += group(
    'rim-posts',
    path('M656 405L652 306L668 306L678 411Z', 'url(#bronze)') +
      ellipse(659, 303, 25, 10, '#b6a16d') +
      path('M866 405L873 305L890 305L887 406Z', 'url(#bronze)') +
      ellipse(881, 303, 24, 10, '#ac9864'),
  )
  content += group('three-legged-jue', body)
  return content
}

function sheng() {
  let content = group(
    'ground',
    wash('M546 846Q811 808 1106 857L1145 884L574 898Z', '#827951', 0.18),
  )
  content += group(
    'bamboo-pipes',
    times(13, (index) => {
      const horizontal = 601 + index * 29
      const top = [451, 354, 293, 232, 204, 277, 339, 312, 267, 234, 306, 381, 453][index]
      return group(
        'pipe-' + index,
        path(`M${horizontal} ${top}h24l4 ${739 - top}h-24Z`, 'url(#bamboo)', 1, texture) +
          ellipse(horizontal + 12, top, 12, 5, '#725b39') +
          ellipse(horizontal + 12, top - 1, 7, 2.5, '#40513d') +
          line(
            `M${horizontal + 3} ${top + 129}h21M${horizontal + 4} ${top + 259}h21`,
            '#8d7748',
            3,
            0.65,
          ) +
          ellipse(horizontal + 14, 671 + (index % 3) * 14, 4, 11, '#5c5839') +
          line(`M${horizontal + 7} ${top + 14}l2 ${620 - top}`, '#e0c68c', 1.6, 0.45),
      )
    }),
  )
  content += group(
    'pipe-binding',
    path('M599 587Q783 614 975 585L976 613Q786 643 600 615Z', '#7b6540') +
      line('M605 592Q788 619 968 590', '#b99b62', 3, 0.75),
  )
  content += group(
    'wind-chest',
    path(
      'M604 715Q787 746 981 709L971 774Q936 845 790 851Q659 852 616 788Z',
      'url(#wood)',
      1,
      texture,
    ) +
      ellipse(791, 715, 187, 48, '#9f8455') +
      path('M641 735Q783 769 941 734L928 777Q784 812 651 778Z', '#a98d59') +
      line('M654 780Q785 819 924 779', '#574c34', 4, 0.6),
  )
  content += group(
    'mouthpipe',
    path('M958 769Q1071 770 1093 671L1113 672Q1097 797 966 797Z', 'url(#wood)', 1, texture) +
      ellipse(1103, 670, 11, 5, '#6a583a') +
      ellipse(1103, 668, 6, 2, '#344b3c'),
  )
  return content
}

function pitchPot() {
  let content = group(
    'ground',
    wash('M478 844Q810 803 1126 851L1219 884L507 899Z', '#817954', 0.18),
  )
  content += group(
    'inserted-arrows',
    [
      [769, 531, 647, 227],
      [801, 531, 821, 193],
      [834, 529, 979, 270],
    ]
      .map(([bottomX, bottomY, topX, topY], index) =>
        group(
          'arrow-' + index,
          line(`M${bottomX} ${bottomY}L${topX} ${topY}`, '#93744b', 6) +
            path(
              'M0 0L-15 35L-10 63L0 51L10 60L17 33Z',
              '#9d9472',
              0.9,
              `transform="translate(${topX} ${topY}) rotate(${index === 0 ? -23 : index === 1 ? 4 : 29})"`,
            ),
        ),
      )
      .join(''),
  )
  let pot = path(
    'M747 492Q762 562 732 595Q673 637 684 727Q693 803 760 829L759 852L850 852L849 827Q918 802 929 721Q939 642 881 596Q848 565 862 491Z',
    'url(#bronze)',
    1,
    texture,
  )
  pot +=
    path(
      'M702 719Q736 790 794 791Q878 798 909 728L897 778Q872 824 847 829L759 831Q712 811 702 773Z',
      '#586f53',
      0.45,
    ) + ellipse(805, 849, 46, 11, '#697750')
  pot +=
    path('M732 486Q799 510 878 485L873 509Q805 537 738 510Z', '#b9a16b') +
    ellipse(805, 488, 73, 20, '#52634b') +
    ellipse(805, 486, 58, 12, '#3e5443')
  pot += group(
    'side-ears',
    path('M718 516H751V537H718ZM860 516H885V537H860Z', 'url(#bronze)') +
      path('M720 504h-30l2 68h32ZM882 504h29l-2 68h-29Z', 'url(#bronze)') +
      ellipse(706, 503, 17, 8, '#ad9864') +
      ellipse(897, 503, 17, 8, '#ad9864') +
      ellipse(706, 502, 9, 4, '#3e5140') +
      ellipse(897, 502, 9, 4, '#3e5140'),
  )
  pot +=
    line('M713 674Q804 702 900 673M713 686Q804 716 899 686', '#c0a56e', 3, 0.6) +
    times(6, (index) => line(`M${737 + index * 25} 714l11 11l-11 11`, '#53664d', 3, 0.6))
  content += group('bronze-pitch-pot', pot)
  content += group(
    'spare-arrow',
    line('M967 836L1195 633', '#93744b', 6) +
      path('M1195 633L1172 639L1157 668L1183 661L1205 651Z', '#9f9370') +
      path('M967 836L962 848L976 842Z', '#5f6e52'),
  )
  return content
}

function wellSweep() {
  let content = group('earth', wash('M366 824Q658 767 968 800L1236 870L499 904Z', '#8b8b68', 0.2))
  content += group(
    'support-frame',
    path('M854 369L874 368L955 830L928 836Z', 'url(#wood)') +
      path('M851 371L874 375L800 843L773 837Z', '#94794e') +
      line('M811 683L931 683', '#8c7048', 13) +
      line('M826 530L898 527', '#8c7048', 11),
  )
  content += group(
    'lever-and-pivot',
    path('M467 225L1204 511L1195 537L460 251Z', 'url(#wood)', 1, texture) +
      ellipse(860, 389, 20, 19, '#67553a') +
      ellipse(860, 388, 8, 7, '#b39461') +
      line('M475 230L1193 517', '#c3a371', 3, 0.6),
  )
  content += group(
    'counterweight',
    line('M1184 529L1176 595', '#836448', 6) +
      path('M1139 584L1191 569L1224 608L1207 657L1149 649L1125 616Z', '#72735b', 1, texture) +
      line('M1136 595L1210 635M1151 580L1180 651', '#95754d', 6),
  )
  content += group(
    'well-shaft',
    path('M377 727L377 810Q514 881 688 809L688 727Z', '#8b947e', 1, texture) +
      ellipse(533, 727, 157, 61, '#b4b297') +
      ellipse(533, 726, 126, 43, '#536f63') +
      ellipse(533, 730, 104, 29, '#426456') +
      path('M377 727Q515 796 688 727L688 755Q536 819 377 753Z', '#9ca68b'),
  )
  content += group(
    'stone-joints',
    line('M397 793Q531 850 669 793M448 779v50M556 798v46M634 782v43', '#657c6d', 3, 0.6),
  )
  content += group(
    'rope-and-bucket',
    line('M479 242L488 638', '#8d714a', 5) +
      line('M488 633Q449 611 447 654M488 633Q527 613 526 654', '#816243', 7) +
      path('M443 652L531 652L522 724Q487 746 452 724Z', 'url(#wood)', 1, texture) +
      ellipse(487, 651, 44, 15, '#bc9c6b') +
      ellipse(487, 653, 33, 9, '#5f6248') +
      line('M448 681Q487 694 527 680M451 711Q486 726 523 710', '#63563d', 5, 0.8),
  )
  content += group(
    'grass',
    brush(
      [
        [701, 854],
        [730, 789],
        [754, 775],
        [771, 737],
      ],
      11,
      '#71815b',
      0.8,
    ) +
      brush(
        [
          [718, 857],
          [760, 834],
          [776, 803],
          [812, 804],
        ],
        10,
        '#71815b',
        0.8,
      ),
  )
  return content
}

function timberPier() {
  let content = group(
    'far-bank',
    wash('M361 496L476 423L550 462L663 357L809 457L915 406L1147 505Z', '#83948c', 0.2) +
      wash(
        'M332 665Q593 600 841 637Q1099 601 1211 694L1233 828Q1006 896 797 866Q545 918 341 824Z',
        '#719486',
        0.2,
      ),
  )
  content += group(
    'shore',
    wash('M1097 580Q1171 584 1241 646L1280 825Q1191 842 1094 795L1049 701Z', '#9e9d78', 0.43) +
      path('M1099 610L1137 663L1111 711L1084 725L1051 704L1065 663Z', '#9b9e7c', 0.75, texture),
  )
  content += group(
    'pier-piles',
    path(
      'M641 683h15v32h-15ZM665 731h16v31h-16ZM854 714h16v31h-16ZM1065 696h16v27h-16Z',
      '#756346',
    ),
  )
  content += group(
    'timber-pier',
    path('M630 666L1050 632L1110 697L650 737Z', 'url(#wood)', 1, texture) +
      path('M650 737L1110 697L1110 710L651 749L630 679L630 666Z', '#665b40') +
      times(12, (index) =>
        line(
          `M${650 + index * 34} ${665 - index * 2.75}L${670 + index * 37} ${734 - index * 3.2}`,
          '#615a40',
          2.5,
          0.65,
        ),
      ),
  )
  content += group(
    'mooring-posts',
    path('M653 702L650 655L664 653L667 702ZM1015 654L1014 612L1028 610L1030 653Z', '#8a714b') +
      line('M651 675l18 -2M1014 631l16 -2', '#c0a070', 3, 0.8),
  )
  let boat =
    path('M383 755Q607 802 823 742L786 802Q592 865 427 815Z', '#6b7561', 1, texture) +
    path('M401 758Q605 791 806 750Q637 811 436 789Z', '#a38d60') +
    path('M432 773Q610 810 782 765L754 788Q608 831 447 799Z', '#4b6052')
  boat +=
    line('M481 780L514 812M579 796L598 826M696 786L704 810', '#c3aa78', 7, 0.85) +
    line('M724 789L919 850', '#8b7551', 7) +
    path('M901 835L949 861L938 881L890 852Z', '#977c52')
  content +=
    group('moored-riverboat', boat) +
    group(
      'boarding-plank',
      path('M725 720L752 725L684 782L658 777Z', '#b39a6a', 1, texture) +
        path('M658 777L684 782L684 790L658 785Z', '#6a6143') +
        line('M736 724L672 778', '#786c49', 2, 0.8),
    ) +
    group('mooring-rope', line('M660 674Q584 717 609 763L636 783', '#98744e', 5)) +
    group(
      'water-ripples',
      line(
        'M368 839Q533 882 723 854M756 849l102 -19M427 880Q605 912 794 868M842 764l95 -6M1024 737l79 -7M650 768l39 -3M840 751l41 -4',
        '#718e7e',
        3,
        0.45,
      ),
    )
  content += group(
    'bank-reeds',
    brush(
      [
        [1170, 866],
        [1139, 784],
        [1144, 715],
        [1115, 681],
      ],
      11,
      '#6b825c',
      0.8,
    ) +
      brush(
        [
          [1175, 864],
          [1201, 757],
          [1236, 733],
          [1220, 689],
        ],
        12,
        '#6b825c',
        0.8,
      ) +
      brush(
        [
          [1177, 866],
          [1221, 811],
          [1253, 811],
          [1276, 788],
        ],
        9,
        '#6b825c',
        0.8,
      ),
  )
  return content
}

function posthouse() {
  let content = group(
    'distance',
    wash('M356 568L487 453L629 511L733 411L918 500L1111 462L1242 579Z', '#8b9990', 0.2),
  )
  content += group(
    'autumn-road',
    wash('M364 862Q655 729 886 708L1189 727L1228 842Q921 763 762 818L599 917Z', '#b39465', 0.28) +
      path('M388 874Q680 747 857 745Q698 786 562 909Z', '#b59c73', 0.28),
  )
  let house =
    path('M738 466L983 484L983 754L739 714Z', '#c4ae86', 1, texture) +
    path('M983 484L1171 428L1171 690L983 754Z', '#a38f6b')
  house +=
    path('M698 469L839 324L1025 441L1196 411L1198 439L986 503L727 485Z', '#5b7266', 1, texture) +
    path('M839 324L1176 384L1196 411L1025 463Z', '#7b8972') +
    path('M698 469L839 342L1025 463L986 484L841 383L734 481Z', '#81917a')
  house +=
    path('M823 543L899 550L899 737L823 727Z', '#526657') +
    path('M837 553L858 556L858 720L837 718Z', '#7b7350') +
    path('M1028 527L1116 503L1116 583L1028 611Z', '#5b6a56') +
    line('M1072 516v80M1032 557l80 -23', '#b4a175', 4, 0.8)
  house +=
    path('M736 548L937 574L967 627L746 595Z', '#8b8c67', 1, texture) +
    path('M746 595L967 627L960 641L744 608Z', '#566955') +
    path('M752 601L767 602L767 733L752 733ZM937 627L950 629L950 758L937 757Z', '#8b7350')
  house += path('M742 726L982 764L1178 698L1187 720L982 789L735 750Z', '#8d9075')
  house += group(
    'station-plaque',
    path('M802 487L931 498L931 545L802 534Z', '#635438', 1, texture) +
      line('M809 494L923 505M809 529L924 539', '#b89d69', 2, 0.7) +
      '<text x="814" y="523" font-family="Songti SC,STSong,serif" font-size="33" font-weight="600" fill="#dac08b" transform="rotate(5 814 523)">驿站</text>',
  )
  content += group('roadside-house', house)
  content += group(
    'waypost',
    path('M685 418L699 419L699 715L685 713Z', '#796347') +
      path('M607 431L696 441L696 459L607 449Z', 'url(#wood)') +
      line('M624 448v21M673 455v21', '#6d6141', 4) +
      path('M614 468L683 478L683 590L614 579Z', '#8d5b42', 1, texture) +
      '<text x="629" y="522" font-family="Songti SC,STSong,serif" font-size="43" font-weight="600" fill="#d8be87">驿</text>' +
      line('M625 550L671 557M625 564L671 571', '#c4a773', 2, 0.65),
  )
  content += group(
    'autumn-tree',
    brush(
      [
        [434, 800],
        [466, 635],
        [464, 476],
        [527, 335],
      ],
      24,
      '#796449',
    ) +
      brush(
        [
          [470, 540],
          [410, 474],
          [380, 443],
          [340, 422],
        ],
        14,
        '#796449',
      ),
  )
  content += group(
    'ochre-foliage',
    times(25, (index) => {
      const horizontal = 352 + (index % 6) * 36 + Math.sin(index * 3) * 22
      const vertical = 342 + Math.floor(index / 6) * 43 + Math.cos(index) * 24
      return path(
        'M0 12Q-33 -2 -18 -30Q-5 -52 11 -24Q44 -24 29 1Q23 24 0 12Z',
        index % 3 ? '#b39c58' : '#a67b4d',
        0.65,
        `transform="translate(${horizontal} ${vertical}) rotate(${index * 37}) scale(${0.7 + (index % 4) * 0.1})" ${texture}`,
      )
    }),
  )
  content += group(
    'hitching-rail',
    path('M465 690h13v112h-13ZM739 675h13v124h-13Z', '#7e6948') +
      line('M465 709L752 696', '#9c8056', 12) +
      path('M443 791L515 785L523 818L450 825Z', '#999674', 0.8),
  )
  content += group('horse-cart-shafts', line('M928 787L578 744M903 757L585 728', '#8e7048', 9))
  const wheel = (horizontal, vertical, radius, identity, opacity = 1) => {
    let spokes = times(10, (index) => {
      const angle = (index * Math.PI) / 5
      return line(
        `M${horizontal} ${vertical}l${rounded(Math.cos(angle) * (radius - 7))} ${rounded(Math.sin(angle) * (radius - 7))}`,
        '#8f744c',
        4,
      )
    })
    spokes +=
      ellipse(
        horizontal,
        vertical,
        radius,
        radius,
        'none',
        1,
        'stroke="#66543a" stroke-width="9"',
      ) +
      ellipse(
        horizontal,
        vertical,
        radius - 8,
        radius - 8,
        'none',
        0.8,
        'stroke="#b29461" stroke-width="2"',
      ) +
      ellipse(horizontal, vertical, 10, 10, '#68553b') +
      ellipse(horizontal - 2, vertical - 2, 4, 4, '#c0a06b')
    return group(identity, spokes, `opacity="${opacity}"`)
  }
  let cart = wheel(1123, 801, 40, 'far-wheel', 0.8)
  cart +=
    path('M896 747L1118 723L1180 773L941 808Z', 'url(#wood)', 1, texture) +
    path('M941 808L1180 773L1180 797L942 833Z', '#776245') +
    path('M907 660L1093 638L1152 688L1152 757L955 784L907 747Z', '#9f8a60', 1, texture) +
    path('M955 706L1152 683L1152 757L955 784Z', '#86764f') +
    line('M956 730L1151 706M956 755L1151 732M977 702v78M1124 688v75', '#bea471', 4, 0.75)
  cart +=
    path('M900 661Q908 583 974 581Q1062 570 1102 629L1159 681L952 711Z', '#8c9d8c', 1, texture) +
    path('M900 661Q907 587 974 581Q956 625 952 711Z', '#697f72') +
    line(
      'M938 609Q955 586 974 586Q1034 576 1070 618M1019 583Q1055 621 1063 696',
      '#c0bea0',
      3,
      0.65,
    )
  cart +=
    path('M958 715L980 712L980 778L958 781Z', '#6e6145') +
    path('M1049 706L1068 704L1068 766L1049 769Z', '#6e6145') +
    group(
      'mail-scrolls',
      path('M984 724L1011 721L1016 762L990 765Z', '#c5b28b') +
        ellipse(998, 722, 14, 5, '#dfcba3') +
        ellipse(998, 722, 5, 2, '#85714d') +
        line('M989 745L1015 741', '#92734c', 4),
    )
  content += group('covered-post-cart', cart)
  let horse = group(
    'far-legs',
    path('M159 165L168 181L155 224L172 270L158 274L137 225Z', '#7c5b44') +
      path('M283 166L299 174L309 216L285 268L270 270L289 217Z', '#7c5b44'),
  )
  horse += path(
    'M137 111Q165 100 190 109Q222 118 263 103Q306 97 330 136Q341 159 322 180Q294 199 248 188Q208 203 174 187Q141 184 129 162Q115 145 137 111Z',
    '#a77951',
    1,
    texture,
  )
  horse += path('M134 71Q158 97 168 139L154 178Q126 157 113 133L93 106Z', '#a77951', 1, texture)
  horse += path(
    'M142 119Q189 131 252 115Q296 108 313 142Q269 119 229 134Q179 148 142 139Z',
    '#c39b6a',
    0.5,
  )
  horse += path(
    'M151 176L168 188L166 222L155 267L163 275L141 277L142 263L149 217ZM300 177L314 188L291 224L309 252L302 280L282 282L289 266L279 240L270 216Z',
    '#a5774f',
    1,
    texture,
  )
  horse += path(
    'M140 267L157 267L163 279L139 281ZM282 275L303 273L302 285L280 287ZM158 264L169 265L175 275L158 278ZM271 263L285 264L284 274L269 276Z',
    '#4d4c3c',
  )
  horse += path(
    'M92 49L90 16L101 25L113 49L126 33L132 52Q151 61 141 84L121 105L89 120L57 117Q43 113 50 100L79 75Z',
    '#b18358',
    1,
    texture,
  )
  horse +=
    path('M55 99L81 105L89 120L57 117Q43 113 50 104Z', '#8c7152') +
    path('M96 30L102 47L95 48ZM126 43L127 54L119 51Z', '#77593e') +
    ellipse(111, 73, 4, 3, '#3a4438') +
    ellipse(60, 106, 3, 2, '#4d4d3b') +
    line('M51 113L74 115', '#61543d', 1.5)
  horse +=
    brush(
      [
        [137, 64],
        [156, 82],
        [151, 112],
        [169, 143],
      ],
      18,
      '#4d4a37',
    ) +
    brush(
      [
        [327, 131],
        [362, 160],
        [332, 215],
        [370, 247],
      ],
      24,
      '#514b38',
    ) +
    brush(
      [
        [333, 139],
        [361, 179],
        [341, 215],
        [358, 235],
      ],
      11,
      '#68533c',
    )
  horse +=
    path('M197 111L248 109L250 126L200 134Z', '#8e5541') +
    line(
      'M205 131L200 189M130 122Q124 149 144 168M83 82L111 97M58 101L91 109M111 97L133 70',
      '#5c543b',
      5,
    ) +
    ellipse(146, 159, 6, 6, '#baa06a')
  content += group('harnessed-post-horse', horse, 'transform="translate(449 610) scale(.95)"')
  content += group('tether', line('M527 705Q500 749 472 714', '#92754f', 3.5))
  content += wheel(1000, 842, 50, 'near-wheel')
  content += group(
    'road-contact',
    wash('M487 881Q659 859 775 877L792 899L490 906Z', '#796a4b', 0.13) +
      line('M978 895L1030 889M1100 843L1144 837', '#95815c', 3, 0.35),
  )
  return content
}

const studies = [
  {
    id: 'peony-and-taihu-rock',
    name: '牡丹绣石',
    category: 'ink',
    theme: '自然与环境 · 牡丹园石',
    note: '胭脂重瓣 · 青灰透石 · 花叶干湿相映',
    draw: peony,
  },
  {
    id: 'pomegranate-autumn-branch',
    name: '榴实盈枝',
    category: 'ink',
    theme: '自然与环境 · 秋实花木',
    note: '赭红果皮 · 裂果籽粒 · 长叶与斜枝',
    draw: pomegranate,
  },
  {
    id: 'banana-rain-stones',
    name: '蕉雨听石',
    category: 'ink',
    theme: '自然与环境 · 庭院雨意',
    note: '宽叶侧锋 · 冷绿雨痕 · 根石承接',
    draw: banana,
  },
  {
    id: 'osmanthus-moon-rabbit',
    name: '桂影月兔',
    category: 'figures',
    theme: '人物与生灵 · 月兔意象',
    note: '桂黄清月 · 灰白兔毛 · 原创节令文学意象',
    draw: moonRabbit,
  },
  {
    id: 'eagle-on-cliff',
    name: '苍鹰守岩',
    category: 'figures',
    theme: '人物与生灵 · 山岩猛禽',
    note: '敛翼回望 · 钩喙利爪 · 褐羽层叠',
    draw: eagle,
  },
  {
    id: 'celadon-lotus-vase',
    name: '青瓷含莲',
    category: 'color',
    theme: '文字制度与器用 · 青瓷器物',
    note: '莲口青釉 · 刻花淡纹 · 口壁与底足',
    draw: celadonVase,
  },
  {
    id: 'bronze-jue-vessel',
    name: '铜爵礼影',
    category: 'color',
    theme: '文字制度与器用 · 礼器意象',
    note: '流尾双柱 · 三足铜爵 · 非特定出土器复原',
    draw: bronzeJue,
  },
  {
    id: 'bamboo-sheng-pipes',
    name: '笙竹和鸣',
    category: 'color',
    theme: '文字制度与器用 · 礼乐器物',
    note: '参差竹管 · 木斗吹管 · 非具体古笙复原',
    draw: sheng,
  },
  {
    id: 'arrow-pitch-pot',
    name: '投壶矢趣',
    category: 'color',
    theme: '文字制度与器用 · 宴饮礼戏',
    note: '修颈铜壶 · 双耳箭矢 · 通用活动意象',
    draw: pitchPot,
  },
  {
    id: 'well-and-sweep',
    name: '桔槔汲古',
    category: 'ink',
    theme: '生产交流与图解 · 乡野汲水',
    note: '石井绳桶 · 支点配重 · 装饰构造非技术复原',
    draw: wellSweep,
  },
  {
    id: 'riverside-timber-pier',
    name: '汀渡横舟',
    category: 'ink',
    theme: '军事与交通 · 水路渡口',
    note: '低矮临水栈台 · 船舷踏板 · 系泊与短桩水纹',
    draw: timberPier,
  },
  {
    id: 'autumn-posthouse',
    name: '驿路秋舍',
    category: 'ink',
    theme: '建筑与历史空间 · 行旅驿舍',
    note: '驿站牌匾与招牌 · 系驾驿马 · 带篷木轮驿车',
    draw: posthouse,
  },
]

mkdirSync(destination, { recursive: true })
for (const study of studies) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.theme}。${study.note}。原创代码彩墨意象，非史实复原。透明背景。</desc>${definitions}${study.draw()}</svg>`
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
console.log('Generated twelve seasonal ink studies')
