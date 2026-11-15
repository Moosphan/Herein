import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncInkCollections } from './sync-ink-collections.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const destination = join(root, 'resources/visuals/traditional-culture/figure-studies')
const inkDirectory = join(destination, 'ink-wash')
mkdirSync(inkDirectory, { recursive: true })
const repeat = (count, callback) =>
  Array.from({ length: count }, (_, index) => callback(index)).join('')
const rounded = (value) => Number(value.toFixed(2))

function painter(seed) {
  let state = seed
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
  const path = (outline, color, opacity = 1, attributes = '') =>
    `<path d="${outline}" fill="${color}" opacity="${opacity}" ${attributes}/>`
  const group = (identity, content, attributes = '') =>
    `<g id="${identity}" ${attributes}>${content}</g>`
  const wash = (outline, color, opacity = 1) => path(outline, color, opacity, 'filter="url(#wet)"')
  const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1, attributes = '') =>
    `<ellipse cx="${rounded(horizontal)}" cy="${rounded(vertical)}" rx="${rounded(radiusX)}" ry="${rounded(radiusY)}" fill="${color}" opacity="${opacity}" ${attributes}/>`

  function brush(points, width, color = '#343532', opacity = 1, dry = false) {
    const samples = []
    for (let segment = 0; segment < points.length - 1; segment++) {
      const before = points[Math.max(0, segment - 1)]
      const start = points[segment]
      const end = points[segment + 1]
      const after = points[Math.min(points.length - 1, segment + 2)]
      for (let step = 0; step < 9; step++) {
        const fraction = step / 9
        samples.push(
          [0, 1].map(
            (axis) =>
              0.5 *
              (2 * start[axis] +
                (-before[axis] + end[axis]) * fraction +
                (2 * before[axis] - 5 * start[axis] + 4 * end[axis] - after[axis]) * fraction ** 2 +
                (-before[axis] + 3 * start[axis] - 3 * end[axis] + after[axis]) * fraction ** 3),
          ),
        )
      }
    }
    samples.push(points.at(-1))
    const sides = [[], []]
    samples.forEach((sample, index) => {
      const previous = samples[Math.max(0, index - 1)]
      const next = samples[Math.min(samples.length - 1, index + 1)]
      const length = Math.hypot(next[0] - previous[0], next[1] - previous[1]) || 1
      const radius =
        width *
        (0.05 + Math.sin((Math.PI * index) / (samples.length - 1)) ** 0.64 * 0.48) *
        (0.83 + random() * 0.32)
      for (let side = 0; side < 2; side++) {
        const direction = side ? 1 : -1
        sides[side].push(
          `${rounded(sample[0] - ((next[1] - previous[1]) / length) * radius * direction)},${rounded(sample[1] + ((next[0] - previous[0]) / length) * radius * direction)}`,
        )
      }
    })
    return path(
      `M${sides[0].join('L')}L${sides[1].reverse().join('L')}Z`,
      color,
      opacity,
      `filter="url(#${dry ? 'dry' : 'edge'})"`,
    )
  }

  const definitions = `<defs>
    <filter id="edge" x="-14%" y="-18%" width="128%" height="136%"><feTurbulence type="fractalNoise" baseFrequency=".065 .12" numOctaves="3" seed="37" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".22"/></filter>
    <filter id="wet" x="-18%" y="-18%" width="136%" height="136%"><feTurbulence type="fractalNoise" baseFrequency=".022 .034" numOctaves="3" seed="71" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .25 .25 .25 0 .48" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="pigment"/><feDisplacementMap in="pigment" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".7"/></filter>
    <filter id="dry" x="-14%" y="-18%" width="128%" height="136%"><feTurbulence type="fractalNoise" baseFrequency=".22 .58" numOctaves="3" seed="41" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.5 1.5 1.5 0 -1.5" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in"/><feDisplacementMap in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/></filter>
    <linearGradient id="silk" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="#66675e"/><stop offset=".34" stop-color="#414743"/><stop offset=".67" stop-color="#303836"/><stop offset="1" stop-color="#747167" stop-opacity=".12"/></linearGradient>
    <linearGradient id="skin" x1=".15" y1=".1" x2=".85" y2=".8"><stop stop-color="#e2c198"/><stop offset=".42" stop-color="#d3aa7f"/><stop offset=".76" stop-color="#c79a71"/><stop offset="1" stop-color="#aa7f61"/></linearGradient>
    <linearGradient id="red-silk" x1=".2" y1="0" x2=".6" y2="1"><stop stop-color="#b6614a"/><stop offset=".5" stop-color="#914638"/><stop offset="1" stop-color="#6a3931"/></linearGradient>
    <linearGradient id="horse-coat" x1=".4" y1="0" x2=".65" y2="1"><stop stop-color="#bb754e"/><stop offset=".4" stop-color="#a25a3f"/><stop offset=".75" stop-color="#874733"/><stop offset="1" stop-color="#663e31"/></linearGradient>
    <linearGradient id="black-coat" x1=".1" y1=".1" x2=".7" y2=".9"><stop stop-color="#77786d"/><stop offset=".45" stop-color="#4c5650"/><stop offset="1" stop-color="#353d39"/></linearGradient>
    <linearGradient id="armor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#818b82"/><stop offset=".45" stop-color="#5d706e"/><stop offset="1" stop-color="#364a4b"/></linearGradient>
    <radialGradient id="red-muscle"><stop stop-color="#d58c59" stop-opacity=".48"/><stop offset=".65" stop-color="#c08456" stop-opacity=".15"/><stop offset="1" stop-color="#c08456" stop-opacity="0"/></radialGradient>
    <radialGradient id="black-muscle"><stop stop-color="#b4b39a" stop-opacity=".35"/><stop offset=".65" stop-color="#9a9a82" stop-opacity=".11"/><stop offset="1" stop-color="#9a9a82" stop-opacity="0"/></radialGradient>
    <linearGradient id="ground-fade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white"/><stop offset=".8" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient>
    <mask id="ground-mask"><rect width="1600" height="1000" fill="url(#ground-fade)"/></mask>
  </defs>`
  return { random, path, group, wash, brush, ellipse, definitions }
}

function emperorStudy() {
  const paint = painter(10031)
  const { path, group, wash, brush, ellipse, random } = paint
  let content = group(
    'court-atmosphere',
    wash('M363 775Q391 560 441 438Q482 521 510 679Q475 771 403 834Z', '#746c59', 0.1) +
      wash('M1080 762Q1158 537 1248 498Q1283 673 1268 842Z', '#68757a', 0.1) +
      wash('M459 856Q848 800 1212 853L1265 932L408 932Z', '#75644e', 0.12),
  )
  const robe =
    'M735 435Q657 438 593 489Q552 549 519 650L483 790Q503 850 613 878L658 913Q842 932 1128 898Q1205 876 1175 816L1119 675Q1095 530 999 470L926 440Z'
  content += group(
    'robe-mass',
    path(robe, 'url(#silk)', 0.97, 'filter="url(#edge)"') +
      `<clipPath id="robe-clip"><path d="${robe}"/></clipPath>` +
      '<g clip-path="url(#robe-clip)">' +
      wash(
        'M600 493Q682 499 690 615Q673 763 756 906L578 906Q624 785 599 654Q571 571 600 493Z',
        '#899083',
        0.19,
      ) +
      wash(
        'M931 457Q1096 543 1056 737Q1045 816 1168 910L973 928Q1024 758 944 621Z',
        '#252f2f',
        0.45,
      ) +
      wash('M695 504Q772 609 786 770L806 933L730 933Q749 743 676 626Z', '#262e2b', 0.42) +
      repeat(65, () => {
        const horizontal = 560 + random() * 567
        const vertical = 517 + random() * 365
        return brush(
          [
            [horizontal, vertical],
            [horizontal - 7, vertical + 20],
            [horizontal + 8, vertical + 46 + random() * 25],
          ],
          5 + random() * 14,
          '#b3aa8b',
          0.025 + random() * 0.06,
          true,
        )
      }) +
      '</g>',
  )
  content += group(
    'back-collar-and-neck',
    path('M749 412L754 472L817 522L909 468L902 406Z', 'url(#skin)', 1, 'filter="url(#edge)"') +
      path(
        'M734 437L766 462L827 518L901 449L930 451L841 569L815 572L716 463Z',
        '#9a4736',
        1,
        'filter="url(#edge)"',
      ) +
      path('M714 456L815 571L831 601L782 584L686 479Z', '#b88852', 0.85, 'filter="url(#wet)"') +
      path('M932 455L856 567L827 606L814 574L906 458Z', '#c09b63', 0.9, 'filter="url(#edge)"') +
      brush(
        [
          [919, 464],
          [880, 528],
          [835, 585],
        ],
        4,
        '#dfbd7a',
        0.65,
      ),
  )
  content += group(
    'headdress-ribbons',
    path(
      'M749 243Q691 274 701 390L682 529Q706 512 729 477L739 371Z',
      '#3a3732',
      0.9,
      'filter="url(#edge)"',
    ) +
      path(
        'M908 260Q941 302 949 354L969 501L944 478L921 366Z',
        '#41403a',
        0.9,
        'filter="url(#edge)"',
      ),
  )
  const face =
    'M757 249Q783 214 836 218Q881 219 905 250Q916 277 912 309L915 335L930 352Q932 362 915 366L917 388Q914 417 896 438Q869 465 838 460Q807 455 781 430Q759 409 752 378L740 336Q731 294 757 249Z'
  content += group(
    'face',
    path(face, 'url(#skin)', 1, 'filter="url(#edge)"') +
      wash(
        'M759 270Q773 294 770 340L790 394L820 430L853 452Q807 450 783 419Q756 399 749 355Z',
        '#906f58',
        0.31,
      ) +
      wash(
        'M865 245Q889 269 885 302L874 333L902 358L920 357L908 333L909 286L897 256Z',
        '#f0cf9e',
        0.4,
      ) +
      wash('M900 369Q907 392 886 414L850 423L845 440Q896 451 918 400L922 371Z', '#9a7057', 0.24) +
      ellipse(752, 340, 14, 24, '#c09a75', 1, 'filter="url(#edge)"') +
      brush(
        [
          [747, 324],
          [757, 335],
          [751, 352],
        ],
        3,
        '#886b55',
        0.6,
      ),
  )
  content += group(
    'facial-expression',
    brush(
      [
        [791, 300],
        [813, 296],
        [837, 300],
      ],
      8,
      '#3c3830',
      0.94,
    ) +
      brush(
        [
          [871, 296],
          [889, 291],
          [905, 298],
        ],
        7,
        '#3c3830',
        0.92,
      ) +
      brush(
        [
          [794, 313],
          [814, 308],
          [835, 314],
        ],
        3.1,
        '#524334',
        0.9,
      ) +
      brush(
        [
          [872, 310],
          [890, 306],
          [904, 311],
        ],
        2.7,
        '#524334',
        0.9,
      ) +
      ellipse(819, 312, 3.4, 2.4, '#30332f', 0.95) +
      ellipse(892, 309, 2.9, 2.3, '#30332f', 0.95) +
      brush(
        [
          [855, 306],
          [855, 332],
          [866, 350],
          [882, 355],
        ],
        3.8,
        '#a27b5c',
        0.7,
      ) +
      brush(
        [
          [884, 358],
          [895, 361],
          [903, 357],
        ],
        3.2,
        '#71523e',
        0.7,
      ) +
      brush(
        [
          [824, 384],
          [855, 379],
          [882, 382],
          [897, 378],
        ],
        3.8,
        '#825444',
        0.85,
      ) +
      brush(
        [
          [835, 395],
          [860, 398],
          [881, 393],
        ],
        2.1,
        '#b58b6a',
        0.8,
      ) +
      brush(
        [
          [792, 323],
          [807, 327],
          [823, 325],
        ],
        2.2,
        '#9a795c',
        0.48,
      ) +
      brush(
        [
          [882, 319],
          [893, 321],
          [903, 317],
        ],
        2,
        '#9a795c',
        0.48,
      ),
  )
  content += group(
    'moustache-and-beard',
    path(
      'M820 370Q841 366 857 371Q876 365 897 369L908 379Q888 379 869 375L858 378L848 374Q831 377 817 384Z',
      '#464037',
      0.9,
      'filter="url(#edge)"',
    ) +
      path(
        'M777 377Q791 399 807 407Q823 416 840 410L856 418L875 411Q905 409 920 386Q915 432 892 469L870 500L859 477L841 505L820 482Q791 453 779 419Z',
        '#47473e',
        0.93,
        'filter="url(#wet)"',
      ) +
      repeat(28, () => {
        const horizontal = 791 + random() * 112
        const vertical = 413 + random() * 10
        const drift = (854 - horizontal) * 0.26
        return brush(
          [
            [horizontal, vertical],
            [horizontal + drift * 0.4, vertical + 25],
            [horizontal + drift, vertical + 47 + random() * 26],
          ],
          1.2 + random() * 1.7,
          '#a2987d',
          0.15 + random() * 0.18,
          true,
        )
      }),
  )
  content += group(
    'black-crown',
    path(
      'M745 264Q745 217 764 180Q789 158 838 157Q877 159 902 189L916 267Q842 286 745 264Z',
      '#333831',
      0.98,
      'filter="url(#edge)"',
    ) +
      wash('M771 181Q795 165 824 167L829 269L756 261Z', '#6b7061', 0.4) +
      path(
        'M740 253Q833 274 920 252L923 273Q836 295 741 274Z',
        '#5d4833',
        1,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [751, 257],
          [829, 274],
          [912, 257],
        ],
        3,
        '#b89c5e',
        0.78,
      ) +
      path('M827 166L843 165L856 266L843 270Z', '#8c4e37', 0.82, 'filter="url(#edge)"') +
      ellipse(843, 269, 9, 8, '#b59456', 0.9, 'filter="url(#edge)"') +
      brush(
        [
          [768, 198],
          [761, 227],
          [760, 247],
        ],
        4,
        '#969b85',
        0.2,
        true,
      ),
  )
  content += group(
    'sleeve-folds',
    wash('M587 542Q576 636 548 732L639 789L728 777Q649 734 640 666L649 569Z', '#56615a', 0.7) +
      path(
        'M654 691Q705 676 760 696L771 755Q718 780 672 754Z',
        '#a44e39',
        0.93,
        'filter="url(#wet)"',
      ) +
      path('M663 704L673 704L696 756L685 759Z', '#d1ab65', 0.78, 'filter="url(#edge)"') +
      wash('M1039 580Q1051 666 1105 748L1056 799Q987 776 960 719L969 661Z', '#3d4743', 0.9) +
      path('M962 670Q989 676 1001 700L971 757L942 738Z', '#954a38', 0.97, 'filter="url(#edge)"') +
      brush(
        [
          [599, 548],
          [608, 649],
          [663, 715],
        ],
        7,
        '#b4ad8f',
        0.23,
        true,
      ) +
      brush(
        [
          [1050, 601],
          [1055, 684],
          [1093, 749],
        ],
        9,
        '#b1a382',
        0.15,
        true,
      ),
  )
  content += group(
    'bamboo-manuscript',
    path('M746 679L972 666L988 716L759 737Z', '#c2a16c', 1, 'filter="url(#edge)"') +
      repeat(19, (index) => {
        const horizontal = 752 + index * 12
        return brush(
          [
            [horizontal, 681 - index * 0.6],
            [horizontal + 4, 705 - index * 0.6],
            [horizontal + 10, 732 - index * 0.8],
          ],
          2.1,
          '#735b3d',
          0.72,
        )
      }) +
      brush(
        [
          [751, 692],
          [867, 685],
          [978, 680],
        ],
        3,
        '#675441',
        0.7,
      ) +
      brush(
        [
          [756, 721],
          [872, 712],
          [983, 704],
        ],
        3,
        '#675441',
        0.7,
      ),
  )
  content += group(
    'hands',
    path(
      'M716 699Q731 687 748 691L777 688Q791 686 793 694L770 703L790 704Q799 707 793 713L770 716L787 721Q790 729 781 730L757 728Q740 745 721 735L709 719Z',
      'url(#skin)',
      1,
      'filter="url(#edge)"',
    ) +
      path(
        'M979 680Q966 673 954 677L934 681Q926 687 932 692L949 690L942 704L924 710Q918 716 926 719L946 715Q950 731 961 730L981 714L989 693Z',
        'url(#skin)',
        1,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [727, 714],
          [747, 719],
          [765, 713],
        ],
        1.8,
        '#9b7455',
        0.62,
      ) +
      brush(
        [
          [957, 689],
          [964, 699],
          [957, 715],
        ],
        1.8,
        '#9b7455',
        0.65,
      ),
  )
  return { ...paint, content }
}

function horse(paint, identity, coat, gallop = true) {
  const { path, group, wash, brush, ellipse, random } = paint
  const dark = coat === 'red' ? '#573b30' : '#333c38'
  const warm = coat === 'red' ? '#c08456' : '#9a9a82'
  const body =
    'M560 458Q601 421 678 434Q782 450 900 435Q952 414 984 373L1021 304Q1034 266 1068 251Q1101 237 1134 251L1162 266Q1180 288 1175 316L1156 356Q1126 383 1112 412L1080 482Q1065 552 1027 587Q977 631 911 633L743 623Q677 621 616 603Q557 600 535 560Q511 508 560 458Z'
  let content = group(
    `${identity}-tail`,
    wash(
      'M555 467Q467 460 451 528Q450 576 393 597Q337 618 276 590Q356 665 425 637Q483 621 486 566Q488 510 559 490Z',
      dark,
      0.86,
    ) +
      repeat(22, (index) => {
        const vertical = 478 + index * 0.8
        return brush(
          [
            [550, vertical],
            [478 - random() * 20, 497 + index * 2],
            [453 - random() * 20, 579 + index],
            [371 - random() * 44, 626 + index * 0.6],
            [306 - random() * 31, 606 + index * 0.9],
          ],
          2 + random() * 5,
          dark,
          0.25 + random() * 0.42,
          index % 3 === 0,
        )
      }),
  )
  const legs = gallop
    ? [
        [
          'M659 576Q681 601 726 614L792 641Q809 652 795 667L733 718L702 748L690 740L725 696L753 657L695 658Q640 646 621 610Z',
          '#754633',
        ],
        [
          'M1005 552Q1039 574 1036 611L1013 667L1063 744L1085 757L1080 775L1058 775Q1045 768 1043 754L977 680Q967 668 976 647L984 604L968 584Z',
          '#754633',
        ],
      ]
    : [
        [
          'M626 585Q655 601 677 618L665 682L677 798L663 831L644 830L650 797L630 688L607 627Z',
          '#424a43',
        ],
        [
          'M997 568L1033 588L1042 672L1069 779L1063 813L1044 813L1046 780L1013 681L989 644Z',
          '#424a43',
        ],
      ]
  content += group(
    `${identity}-far-legs`,
    legs
      .map(([outline, color]) =>
        path(outline, coat === 'red' ? color : '#434c46', 0.95, 'filter="url(#edge)"'),
      )
      .join(''),
  )
  content += group(
    `${identity}-body`,
    path(body, coat === 'red' ? 'url(#horse-coat)' : 'url(#black-coat)', 1, 'filter="url(#edge)"') +
      `<clipPath id="${identity}-body-clip"><path d="${body}"/></clipPath>` +
      `<g clip-path="url(#${identity}-body-clip)">` +
      path(
        'M547 432Q627 391 690 452Q736 512 705 580Q664 619 591 580Q529 546 547 432Z',
        coat === 'red' ? 'url(#red-muscle)' : 'url(#black-muscle)',
        1,
      ) +
      path(
        'M915 419Q981 410 1028 458Q1056 516 1013 581Q957 607 910 554Q883 486 915 419Z',
        coat === 'red' ? 'url(#red-muscle)' : 'url(#black-muscle)',
        1,
      ) +
      wash(
        'M692 452Q794 479 901 451L915 479Q787 491 695 474Z',
        '#e5b783',
        coat === 'red' ? 0.26 : 0.15,
      ) +
      wash('M649 562Q734 581 824 588L925 575L985 582Q927 641 808 627L689 617Z', dark, 0.6) +
      wash('M1048 294Q1052 346 1013 416L996 481Q1044 443 1063 380L1100 285Z', warm, 0.4) +
      wash(
        'M1079 320Q1096 337 1107 356L1083 401L1055 453L1031 463Q1063 408 1079 320Z',
        dark,
        0.38,
      ) +
      repeat(95, () => {
        const horizontal = 560 + random() * 510
        const vertical = 448 + random() * 162
        return brush(
          [
            [horizontal, vertical],
            [horizontal + 5, vertical + 11],
            [horizontal + 19, vertical + 15 + random() * 15],
          ],
          2 + random() * 7,
          random() > 0.4 ? warm : dark,
          0.025 + random() * 0.07,
          true,
        )
      }) +
      '</g>',
  )
  const nearLegs = gallop
    ? [
        'M595 555Q565 585 558 620Q549 658 522 687L457 753L433 800L409 812L399 799L422 773L436 738L489 665Q514 622 515 583L544 547Z',
        'M982 533Q1006 551 1028 579L1086 614L1167 645L1224 645L1231 665L1209 676L1161 665L1072 651Q1022 630 1000 610L946 574Z',
      ]
    : [
        'M572 554Q546 580 546 624L569 697L544 801L532 835L511 834L517 805L532 698L512 640Q505 610 522 575L543 548Z',
        'M955 555Q984 568 983 611L969 678L951 791L956 835L935 839L926 798L932 679L933 619L917 594Z',
      ]
  content += group(
    `${identity}-near-legs`,
    nearLegs
      .map((outline) =>
        path(
          outline,
          coat === 'red' ? 'url(#horse-coat)' : 'url(#black-coat)',
          1,
          'filter="url(#edge)"',
        ),
      )
      .join(''),
  )
  content += group(
    `${identity}-leg-planes`,
    gallop
      ? wash('M546 589Q533 647 497 687L451 753L444 742L482 679L515 601Z', warm, 0.52) +
          wash('M993 565L1040 609L1157 654L1192 655L1182 649L1082 619L1025 579Z', warm, 0.45) +
          brush(
            [
              [522, 646],
              [497, 681],
              [460, 729],
            ],
            4,
            dark,
            0.56,
            true,
          ) +
          brush(
            [
              [1043, 623],
              [1112, 650],
              [1175, 661],
            ],
            3,
            dark,
            0.4,
          )
      : wash('M542 598L546 660L558 694L535 806L529 801L542 695L525 645Z', warm, 0.45) +
          wash('M952 613L950 678L940 793L947 823L936 824L935 799L940 679Z', warm, 0.4),
  )
  content += group(
    `${identity}-hooves`,
    gallop
      ? path(
          'M424 789L440 798L429 817L400 825L394 818L399 802Z',
          '#363a34',
          0.98,
          'filter="url(#edge)"',
        ) +
          path(
            'M1212 646L1234 645L1249 662L1244 673L1208 677L1204 667Z',
            '#363a34',
            0.98,
            'filter="url(#edge)"',
          ) +
          path('M1063 757L1085 754L1098 774L1093 784L1058 781Z', '#414034') +
          path('M696 736L711 743L701 760L681 761L680 753Z', '#414034')
      : path(
          'M515 823L534 825L542 842L536 852L507 852L503 845Z',
          '#303632',
          0.98,
          'filter="url(#edge)"',
        ) +
          path(
            'M929 826L951 823L967 841L961 853L932 853L924 844Z',
            '#303632',
            0.98,
            'filter="url(#edge)"',
          ) +
          path('M646 819L668 818L678 835L671 844L641 842Z', '#333b35') +
          path('M1045 804L1067 804L1079 819L1073 828L1044 827Z', '#333b35'),
  )
  const head =
    'M1089 256Q1111 241 1136 252L1165 269Q1178 284 1187 309L1212 337L1235 347Q1251 358 1246 376Q1240 390 1218 389L1184 379L1162 360Q1138 366 1117 353L1102 323L1081 295Z'
  content += group(
    `${identity}-head`,
    path(head, coat === 'red' ? 'url(#horse-coat)' : 'url(#black-coat)', 1, 'filter="url(#edge)"') +
      path(
        'M1090 265Q1071 245 1077 215Q1094 225 1102 257ZM1123 253Q1121 227 1133 209Q1148 237 1135 265Z',
        coat === 'red' ? '#965a3c' : '#505b50',
        1,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [1086, 227],
          [1091, 241],
          [1095, 254],
        ],
        4,
        '#453e31',
        0.8,
      ) +
      brush(
        [
          [1135, 220],
          [1134, 238],
          [1129, 251],
        ],
        3.3,
        '#453e31',
        0.8,
      ) +
      wash('M1140 274Q1149 297 1161 317L1214 359L1206 366L1165 346L1139 306Z', warm, 0.55) +
      wash('M1207 347Q1227 351 1242 361L1240 377Q1222 388 1204 374L1182 366Z', dark, 0.53) +
      path('M1133 291Q1141 284 1150 291L1153 297Q1140 302 1132 297Z', '#302f29', 0.95) +
      ellipse(1145, 293, 1.9, 1.5, '#dfd6b3', 0.9) +
      path(
        'M1221 357Q1231 350 1237 359Q1240 369 1229 372Q1219 369 1221 357Z',
        '#3c342c',
        0.9,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [1205, 379],
          [1222, 383],
          [1238, 379],
        ],
        2.3,
        '#543c30',
        0.8,
      ) +
      brush(
        [
          [1130, 312],
          [1138, 334],
          [1152, 343],
        ],
        3.5,
        dark,
        0.6,
      ),
  )
  content += group(
    `${identity}-mane`,
    wash(
      'M1110 249Q1079 216 1049 249Q1029 283 1009 321L976 361Q1000 349 1013 340L977 397Q954 432 920 449Q973 446 1004 414Q1054 359 1063 305Q1069 270 1110 249Z',
      dark,
      0.97,
    ) +
      repeat(29, () => {
        const vertical = 260 + random() * 125
        const horizontal = 1072 - (vertical - 260) * 0.36
        return brush(
          [
            [horizontal + 10, vertical],
            [horizontal - 13, vertical + 23],
            [horizontal - 35 - random() * 30, vertical + 44 + random() * 28],
          ],
          2 + random() * 4,
          dark,
          0.38 + random() * 0.4,
          true,
        )
      }) +
      brush(
        [
          [1113, 252],
          [1153, 264],
          [1172, 284],
          [1183, 298],
        ],
        11,
        dark,
        0.92,
      ),
  )
  content += group(
    `${identity}-muscle-accents`,
    brush(
      [
        [594, 467],
        [568, 505],
        [581, 546],
      ],
      3,
      dark,
      0.3,
      true,
    ) +
      brush(
        [
          [677, 485],
          [699, 522],
          [677, 566],
        ],
        3,
        dark,
        0.35,
        true,
      ) +
      brush(
        [
          [955, 473],
          [939, 515],
          [960, 550],
        ],
        3,
        dark,
        0.4,
        true,
      ) +
      brush(
        [
          [719, 594],
          [814, 607],
          [905, 598],
        ],
        3,
        warm,
        0.3,
        true,
      ),
  )
  return group(identity, content)
}

function redHorseStudy() {
  const paint = painter(10037)
  const { group, path, wash, brush, ellipse, random } = paint
  let content = group(
    'wind-and-ground',
    wash('M235 821Q594 781 1094 813L1307 852Q857 894 266 871Z', '#887656', 0.12) +
      repeat(19, () => {
        const horizontal = 275 + random() * 980
        const vertical = 850 + random() * 42
        return brush(
          [
            [horizontal, vertical],
            [horizontal + 25 + random() * 30, vertical - 3],
            [horizontal + 80, vertical],
          ],
          2.5,
          '#7e6b4d',
          0.12 + random() * 0.18,
          true,
        )
      }) +
      repeat(25, () =>
        ellipse(
          410 + random() * 600,
          811 + random() * 72,
          1 + random() * 2.5,
          0.8 + random(),
          '#8b7753',
          0.2,
        ),
      ),
  )
  content += horse(paint, 'red-hare', 'red', true)
  content += group(
    'simple-halter',
    brush(
      [
        [1116, 267],
        [1119, 313],
        [1144, 352],
      ],
      5.5,
      '#674731',
      0.95,
    ) +
      brush(
        [
          [1197, 339],
          [1183, 356],
          [1195, 378],
        ],
        5,
        '#795638',
        0.95,
      ) +
      ellipse(1143, 352, 5, 5, '#b2925a', 0.9) +
      brush(
        [
          [1143, 355],
          [1071, 428],
          [993, 464],
        ],
        2.6,
        '#5c4c35',
        0.8,
      ),
  )
  content += group(
    'flying-mane-ends',
    path(
      'M1011 356Q966 369 938 399Q915 416 875 415Q920 439 955 418Q992 392 1011 356Z',
      '#574033',
      0.8,
      'filter="url(#wet)"',
    ),
  )
  return { ...paint, content }
}

function generalStudy() {
  const paint = painter(10039)
  const { path, group, wash, brush, ellipse, random } = paint
  let content = group(
    'frontier-atmosphere',
    wash(
      'M184 753L281 657L328 684L412 584L466 638L567 600L638 712L685 742L732 706L848 756L1084 755L1192 688L1247 712L1339 675L1420 797L1405 889L178 898Z',
      '#7f8781',
      0.13,
    ) + wash('M230 881Q638 821 1197 862L1373 929L215 937Z', '#a08b64', 0.15),
  )
  content += group(
    'lance',
    brush(
      [
        [722, 619],
        [881, 367],
        [1064, 119],
      ],
      10,
      '#65583f',
      0.95,
    ) +
      brush(
        [
          [731, 607],
          [887, 365],
          [1060, 125],
        ],
        2.5,
        '#c5af79',
        0.9,
      ) +
      path(
        'M1056 135L1063 100L1085 66L1081 109L1068 140Z',
        '#7e8980',
        0.98,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [1081, 78],
          [1073, 108],
          [1064, 132],
        ],
        2,
        '#d4d1b3',
        0.9,
      ) +
      path(
        'M1045 141Q1017 155 1001 183Q1030 174 1047 162L1040 189Q1064 170 1068 139Z',
        '#9c4b3b',
        0.92,
        'filter="url(#wet)"',
      ),
  )
  content += group(
    'flying-cloak',
    path(
      'M638 341Q564 368 518 393Q465 412 437 417L346 405Q379 437 415 453Q363 460 312 484L256 477Q293 510 361 525Q420 533 475 508L583 472L672 451Z',
      'url(#red-silk)',
      0.98,
      'filter="url(#wet)"',
    ) +
      wash('M627 359Q520 436 425 434L368 421Q431 479 509 450L609 409Z', '#d38a63', 0.38) +
      wash('M614 403Q537 466 465 487L328 507Q407 539 490 505L639 452Z', '#623c32', 0.4) +
      brush(
        [
          [588, 384],
          [483, 447],
          [403, 465],
        ],
        4,
        '#dc9a6b',
        0.4,
        true,
      ) +
      brush(
        [
          [545, 461],
          [438, 500],
          [342, 506],
        ],
        5,
        '#6b3a30',
        0.43,
        true,
      ),
  )
  content += group(
    'mount',
    horse(paint, 'campaign-horse', 'black', false),
    'transform="translate(65 179) scale(.8)"',
  )
  content += group(
    'saddle-and-reins',
    path(
      'M548 546Q626 553 710 548L726 595Q629 620 550 594Z',
      '#8c5942',
      0.98,
      'filter="url(#edge)"',
    ) +
      path(
        'M565 545Q633 558 702 543L713 565Q631 585 558 566Z',
        '#b0955a',
        0.95,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [1015, 451],
          [984, 506],
          [933, 536],
          [821, 508],
        ],
        4,
        '#614c38',
        0.95,
      ) +
      brush(
        [
          [959, 395],
          [958, 429],
          [978, 463],
        ],
        4,
        '#8c6744',
        0.95,
      ) +
      brush(
        [
          [1009, 449],
          [997, 466],
          [1009, 480],
        ],
        4,
        '#8c6744',
        0.95,
      ),
  )
  content += group(
    'far-rider-leg',
    path(
      'M661 526Q722 546 760 580L744 649L718 691L700 687L716 640L715 595L649 571Z',
      '#4e5950',
      0.98,
      'filter="url(#edge)"',
    ) + path('M709 672L730 675L723 705L744 718L741 731L702 724L696 711Z', '#3b4037'),
  )
  const torso =
    'M623 346Q644 335 678 340L727 370L750 421L727 487L699 551L628 567L585 542L607 464L598 406Z'
  content += group(
    'young-general-armor',
    path(torso, 'url(#armor)', 1, 'filter="url(#edge)"') +
      `<clipPath id="torso-clip"><path d="${torso}"/></clipPath>` +
      '<g clip-path="url(#torso-clip)">' +
      repeat(11, (row) =>
        repeat(9, (column) => {
          const horizontal = 594 + column * 17 + (row % 2) * 8
          const vertical = 377 + row * 17
          return (
            path(
              `M${horizontal} ${vertical}L${horizontal + 13} ${vertical - 1}L${horizontal + 15} ${vertical + 13}L${horizontal + 2} ${vertical + 15}Z`,
              (row + column) % 3 ? '#8b9486' : '#435957',
              0.26 + random() * 0.2,
              'filter="url(#edge)"',
            ) + ellipse(horizontal + 4, vertical + 4, 1, 1.2, '#d1b477', 0.65)
          )
        }),
      ) +
      wash('M601 391Q632 446 625 514L608 561L585 554Z', '#283e3f', 0.55) +
      wash('M690 362Q696 417 731 438L731 465L686 442Q658 407 665 359Z', '#cad0ac', 0.14) +
      '</g>',
  )
  content += group(
    'belt-and-tunic',
    path('M605 511Q657 536 716 506L710 530Q651 555 600 535Z', '#6b4f36', 1, 'filter="url(#edge)"') +
      path('M653 526L673 523L677 539L655 542Z', '#c2a56a', 0.95, 'filter="url(#edge)"') +
      path(
        'M602 538Q663 558 705 533L723 578L699 593L664 570L637 594L584 578Z',
        '#705b47',
        0.97,
        'filter="url(#wet)"',
      ),
  )
  content += group(
    'neck-and-collar',
    path('M643 307L642 345L662 373L686 348L683 307Z', 'url(#skin)', 1, 'filter="url(#edge)"') +
      path(
        'M626 341L645 338L662 364L682 338L700 344L664 390Z',
        '#a4543e',
        1,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [634, 344],
          [660, 375],
          [690, 344],
        ],
        3,
        '#b5a16a',
        0.8,
      ),
  )
  const face =
    'M628 238Q650 218 676 230Q700 239 708 264L708 288L722 307Q724 314 709 318L706 336Q696 352 680 356Q660 352 645 341L629 321L620 285Z'
  content += group(
    'young-face',
    path(face, 'url(#skin)', 1, 'filter="url(#edge)"') +
      wash('M632 245Q631 279 641 308L659 336Q645 338 635 322L621 288Z', '#9f7d60', 0.32) +
      wash('M680 242Q692 262 690 283L681 303L705 310L711 306L698 289L701 266Z', '#e7c59a', 0.5) +
      ellipse(625, 290, 9, 15, '#bd9977', 1, 'filter="url(#edge)"') +
      brush(
        [
          [647, 278],
          [664, 272],
          [679, 275],
        ],
        5,
        '#403c31',
        0.92,
      ) +
      brush(
        [
          [692, 274],
          [702, 271],
          [708, 274],
        ],
        3.8,
        '#403c31',
        0.92,
      ) +
      brush(
        [
          [648, 287],
          [664, 282],
          [677, 286],
        ],
        2.2,
        '#574b3a',
        0.9,
      ) +
      ellipse(666, 285, 2.4, 1.8, '#30342d', 0.94) +
      brush(
        [
          [692, 283],
          [700, 280],
          [707, 282],
        ],
        1.8,
        '#574b3a',
        0.9,
      ) +
      ellipse(702, 282, 1.7, 1.4, '#30342d', 0.94) +
      brush(
        [
          [684, 284],
          [683, 301],
          [691, 310],
          [703, 310],
        ],
        2.4,
        '#9e7958',
        0.7,
      ) +
      brush(
        [
          [676, 328],
          [688, 325],
          [702, 326],
        ],
        2.5,
        '#875b47',
        0.85,
      ) +
      brush(
        [
          [674, 338],
          [686, 342],
          [698, 337],
        ],
        1.5,
        '#ac8766',
        0.65,
      ),
  )
  content += group(
    'campaign-cap',
    path(
      'M616 283Q608 260 614 239Q619 208 646 199Q675 191 697 213Q712 229 715 259L703 276L693 253L633 252L630 283Z',
      '#45534f',
      1,
      'filter="url(#edge)"',
    ) +
      wash('M628 236Q636 210 654 208Q680 202 697 234L690 246L630 249Z', '#a1a28d', 0.34) +
      path(
        'M627 247Q666 231 708 251L711 263Q668 248 631 261Z',
        '#7b6241',
        1,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [634, 249],
          [668, 243],
          [703, 253],
        ],
        2.8,
        '#c6ad72',
        0.8,
      ) +
      path('M615 266L631 273L635 326L620 315Z', '#4b5b54', 1, 'filter="url(#edge)"') +
      path('M649 202Q643 182 657 171Q673 176 675 199Z', '#4b5146', 0.95, 'filter="url(#edge)"'),
  )
  content += group(
    'lance-arm',
    path(
      'M710 375Q738 372 760 393L822 404L849 389L865 404L836 429Q823 436 802 430L738 421L709 407Z',
      'url(#armor)',
      1,
      'filter="url(#edge)"',
    ) +
      brush(
        [
          [740, 388],
          [748, 408],
          [748, 417],
        ],
        4,
        '#afb096',
        0.5,
      ) +
      path(
        'M844 393Q854 379 866 381L876 386Q882 388 878 394L867 394L866 408L856 418L843 410Z',
        'url(#skin)',
        1,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [859, 391],
          [864, 400],
          [857, 410],
        ],
        1.4,
        '#8f7253',
        0.8,
      ),
  )
  content += group(
    'rein-arm',
    path(
      'M618 380Q599 393 609 430L638 467L727 493L736 477L665 447L644 408L641 382Z',
      'url(#armor)',
      1,
      'filter="url(#edge)"',
    ) +
      brush(
        [
          [613, 402],
          [627, 435],
          [649, 452],
        ],
        4,
        '#bbc1a4',
        0.35,
      ) +
      path(
        'M725 478Q741 475 750 485L762 491L757 502L746 498L735 501L724 493Z',
        'url(#skin)',
        1,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [752, 497],
          [806, 510],
          [864, 517],
        ],
        3,
        '#644d36',
        0.9,
      ),
  )
  content += group(
    'near-rider-leg',
    path(
      'M655 551Q691 549 723 568L766 604Q780 622 765 639L738 671L713 715L693 705L716 656L729 623L687 605L645 590Z',
      '#59695f',
      1,
      'filter="url(#edge)"',
    ) +
      wash('M668 566L701 576L751 616L734 637L719 623L678 601Z', '#a1a58b', 0.29) +
      brush(
        [
          [691, 592],
          [729, 614],
          [730, 631],
        ],
        3.5,
        '#34433d',
        0.6,
      ) +
      path(
        'M697 693L720 706L709 736L735 749Q739 758 729 761L693 753L683 739Z',
        '#41483d',
        1,
        'filter="url(#edge)"',
      ) +
      brush(
        [
          [697, 706],
          [690, 735],
          [698, 745],
        ],
        3,
        '#929880',
        0.4,
      ),
  )
  return { ...paint, content }
}

const studies = [
  {
    id: 'han-wudi-impression',
    name: '汉武帝 · 观远',
    note: '玄衣赭领 · 手持竹简 · 沉静帝王意象',
    seed: 10031,
    draw: emperorStudy,
  },
  {
    id: 'huo-qubing-impression',
    name: '霍去病 · 出塞',
    note: '少年骑将 · 青灰甲胄 · 朱红披风',
    seed: 10039,
    draw: generalStudy,
  },
  {
    id: 'red-hare-gallop',
    name: '赤兔 · 追风',
    note: '赤栗马身 · 飞鬃扬尾 · 腾跃伸展',
    seed: 10037,
    draw: redHorseStudy,
  },
]

for (const study of studies) {
  const painting = study.draw()
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.note}。原创文学与历史人物意象；非真实肖像、服制或马具的考据复原。透明背景。</desc>${painting.definitions}${painting.group('artwork', painting.content, 'mask="url(#ground-mask)"')}</svg>`
  const prefixed = source
    .replace(/id="([^"]+)"/g, (_, identity) => `id="${study.id}-${identity}"`)
    .replace(/url\(#([^)]+)\)/g, (_, identity) => `url(#${study.id}-${identity})`)
    .replace(
      'aria-labelledby="title description"',
      `aria-labelledby="${study.id}-title ${study.id}-description"`,
    )
  writeFileSync(join(inkDirectory, `${study.id}.svg`), prefixed)
}
writeFileSync(
  join(inkDirectory, 'catalog.json'),
  JSON.stringify(
    {
      version: 1,
      style: 'figurative-colored-ink',
      width: 1600,
      height: 1000,
      background: 'transparent',
      assets: studies.map(({ id, name, note, seed }) => ({
        id,
        name,
        note,
        seed,
        svg: `${id}.svg`,
        png: `${id}.png`,
      })),
    },
    null,
    2,
  ) + '\n',
)
const card = (study) =>
  `<article><a href="ink-wash/${study.id}.svg" target="_blank" aria-label="查看${study.name}原图"><img src="ink-wash/${study.id}.png" alt="${study.name}，${study.note}"></a><div class="caption"><div><h2>${study.name}</h2><p>${study.note}</p></div><nav aria-label="下载${study.name}"><a href="ink-wash/${study.id}.svg" download>SVG ↓</a><a href="ink-wash/${study.id}.png" download>透明 PNG ↓</a></nav></div></article>`
writeFileSync(
  join(destination, 'index.html'),
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>人物与骏马 · 彩墨试绘</title><style>*{box-sizing:border-box}body{margin:0;background:#dfc69c;color:#463b30;font-family:"Songti SC",serif}main{max-width:1440px;margin:auto;padding:40px 48px 55px}a{color:inherit;text-underline-offset:5px}a:focus-visible{outline:2px solid #934b38;outline-offset:5px}header{display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;border-bottom:1px solid #88705150}header strong{font-size:23px;letter-spacing:.1em}header a{font:12px sans-serif}.intro{display:flex;align-items:end;justify-content:space-between;gap:24px;margin:34px 0 0}h1{font-size:38px;letter-spacing:.1em;font-weight:500;margin:0}.intro p{font:13px/1.9 sans-serif;color:#7b654e;max-width:490px;margin:0}section{display:grid;grid-template-columns:1fr 1fr;gap:32px}article{min-width:0}article>a{display:block}img{display:block;width:100%;height:auto}.caption{border-top:1px solid #88705150;padding:17px 0 24px;display:flex;align-items:center;justify-content:space-between;gap:15px}h2{font-size:24px;font-weight:500;margin:0 0 8px}.caption p{font:12px/1.7 sans-serif;color:#7b654e;margin:0}nav{display:flex;gap:15px;font:12px sans-serif;white-space:nowrap}.hero{max-width:1120px;margin:0 auto}.hero h2{font-size:28px}footer{border-top:1px solid #88705150;padding-top:20px;font:12px/1.9 sans-serif;color:#7b654e}@media(max-width:760px){main{padding:24px 20px}.intro{display:block}.intro p{margin-top:18px}section{grid-template-columns:1fr}h1{font-size:30px}.caption{display:block}nav{margin-top:14px}header strong{font-size:18px}}</style></head><body><main><header><strong>纸上山河 · 人物与骏马</strong><a href="../demo/ink-study.html#figure-collection">返回素材总览 ↗</a></header><div class="intro"><h1>衣冠有势，骏骨生风。</h1><p>玄衣人物、披风骑将、赤栗奔马三种新题材。<br>1600 × 1000 透明 SVG / PNG，纸色只在展示层。</p></div><section>${card(studies[0])}${card(studies[1])}</section><div class="hero">${card(studies[2])}</div><footer>原创历史与文学人物意象，不代表汉武帝、霍去病的真实容貌；冠服、甲胄与马具为艺术概括，并非考据复原。<br>赤兔单独成画，不与两位汉代人物组成同一历史事件。素材按人物、冠服、披风、马身、鬃尾、四肢、缰绳等语义分组，可继续编辑。</footer></main></body></html>`,
)
console.log(`Generated ${studies.length} figure and horse studies in ${destination}`)
syncInkCollections()
