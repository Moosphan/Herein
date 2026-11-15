import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncInkCollections } from './sync-ink-collections.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const destination = join(root, 'resources/visuals/traditional-culture/figure-studies-v3')
const inkDirectory = join(destination, 'ink-wash')
mkdirSync(inkDirectory, { recursive: true })
const repeat = (count, callback) =>
  Array.from({ length: count }, (_, index) => callback(index)).join('')
const number = (value) => Number(value.toFixed(2))
const ink = '#252a28'
const warmInk = '#39382f'
const red = '#8e3f32'
const paleSkin = '#d8bc93'

function studio(seed) {
  let state = seed
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
  const path = (outline, fill = ink, opacity = 1, attributes = '') => {
    const treatment = attributes.includes('url(#paper-edge)')
      ? attributes.replace('url(#paper-edge)', 'url(#pigment)')
      : attributes
    const wash = opacity < 0.85 && !attributes && fill !== ink ? 'filter="url(#light-wash)"' : ''
    return `<path d="${outline}" fill="${fill}" opacity="${opacity}" ${treatment} ${wash}/>`
  }
  const line = (outline, fill = ink, width = 1.5, opacity = 1) =>
    `<path d="${outline}" fill="none" stroke="${fill}" stroke-width="${width}" opacity="${opacity}" stroke-linejoin="round" stroke-linecap="round"/>`
  const group = (identity, content, attributes = '') =>
    `<g id="${identity}" ${attributes}>${content}</g>`
  const ellipse = (horizontal, vertical, radiusX, radiusY, fill, opacity = 1) =>
    `<ellipse cx="${horizontal}" cy="${vertical}" rx="${radiusX}" ry="${radiusY}" fill="${fill}" opacity="${opacity}"/>`

  function curve(points, progress) {
    const remaining = 1 - progress
    return [0, 1].map(
      (axis) =>
        remaining ** 3 * points[0][axis] +
        3 * remaining ** 2 * progress * points[1][axis] +
        3 * remaining * progress ** 2 * points[2][axis] +
        progress ** 3 * points[3][axis],
    )
  }

  function ribbon(
    points,
    width,
    fill = ink,
    opacity = 1,
    taper = 0.12,
    offset = 0,
    from = 0,
    until = 1,
  ) {
    const left = []
    const right = []
    const samples = 42
    for (let index = 0; index <= samples; index++) {
      const progress = from + ((until - from) * index) / samples
      const position = curve(points, progress)
      const before = curve(points, Math.max(0, progress - 0.001))
      const after = curve(points, Math.min(1, progress + 0.001))
      const horizontal = after[0] - before[0]
      const vertical = after[1] - before[1]
      const length = Math.hypot(horizontal, vertical) || 1
      const normal = [-vertical / length, horizontal / length]
      const pressure = (0.36 + Math.sin(progress * Math.PI) * 0.64) * (1 - progress * (1 - taper))
      const breadth = width * pressure * (0.96 + random() * 0.08)
      left.push([
        position[0] + normal[0] * (offset + breadth / 2),
        position[1] + normal[1] * (offset + breadth / 2),
      ])
      right.unshift([
        position[0] + normal[0] * (offset - breadth / 2),
        position[1] + normal[1] * (offset - breadth / 2),
      ])
    }
    return path(
      'M' + [...left, ...right].map((point) => point.map(number).join(' ')).join('L') + 'Z',
      fill,
      opacity,
    )
  }

  function brush(points, width, fill = ink, opacity = 1, dry = 0.35) {
    let marks = ribbon(points, width, fill, opacity * (1 - dry * 0.6), 0.08)
    const hairs = Math.min(22, Math.max(5, Math.floor(width * 0.6)))
    for (let index = 0; index < hairs; index++) {
      const offset = (index / (hairs - 1) - 0.5) * width * 0.5
      marks += ribbon(
        points,
        0.5 + random() * 1.8,
        fill,
        opacity * (0.25 + random() * 0.5),
        0.02,
        offset,
        random() * 0.12,
        0.72 + random() * 0.28,
      )
    }
    return marks
  }

  const definitions = `<defs><filter id="pigment" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".024 .095" numOctaves="3" seed="${seed}" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .18 .18 .18 0 .69" result="pigment"/><feComposite in="SourceGraphic" in2="pigment" operator="in" result="paint"/><feDisplacementMap in="paint" in2="grain" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="light-wash" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="1.6"/></filter><filter id="paper-edge" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".045 .13" numOctaves="2" seed="${seed}" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="1.4" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="broken-ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".24 .38" numOctaves="2" seed="${seed + 1}" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 0 -.4" result="fibres"/><feComposite in="SourceGraphic" in2="fibres" operator="in"/></filter></defs>`
  return { random, path, line, group, ellipse, brush, ribbon, definitions }
}

function emperorHead(paint) {
  const { path, line, group, ellipse, brush, random } = paint
  let face = path(
    'M51 25Q101 -1 153 18Q185 33 192 72L195 113Q201 139 197 159L198 183Q191 215 169 235L143 252Q115 258 91 239L63 211L48 182L35 166Q20 162 18 144Q15 128 27 124L41 128L36 83Q33 48 51 25Z',
    paleSkin,
  )
  face += path(
    'M49 47Q63 30 79 35L69 94L66 140Q68 183 100 219L118 245L95 235L66 211L48 180L33 153L42 92Z',
    '#987b5a',
    0.25,
  )
  face += path(
    'M175 52L190 78L195 117L182 136L184 157L194 175L185 198L167 215L157 202L170 174L164 148L165 117L176 93Z',
    '#8d6b4e',
    0.2,
  )
  face += path('M88 52Q116 35 152 48L160 80L146 92L103 89L80 80Z', '#eed5a8', 0.45)
  face += path('M105 139Q126 129 143 139L149 158L134 172L108 163Z', '#bf8c68', 0.22)
  face += path('M156 119L160 145L169 158L158 165L150 156L150 129Z', '#f0d9aa', 0.6)
  face += path('M161 127L169 145L178 156L175 164L166 163L170 158L160 148Z', '#8b6749', 0.33)
  face += group(
    'imperial-brows',
    path('M77 100Q100 87 121 91L145 100L143 106L120 100Q100 96 78 104Z', ink) +
      path('M166 99L181 93L191 94L192 99L181 100L168 105Z', ink) +
      line('M147 95L151 108M158 96L156 108', '#7a6148', 1.3, 0.65),
  )
  face += group(
    'imperial-gaze',
    path('M84 116Q107 103 134 111L145 114Q119 124 87 119Z', '#e9d1a9') +
      path('M85 115Q108 104 134 110L145 114L133 114Q110 110 86 118Z', ink) +
      ellipse(124, 114, 4.6, 4.1, ink) +
      ellipse(123, 112.5, 1.1, 0.85, '#ead8b2') +
      line('M91 120Q110 125 131 118', '#6c5943', 1.1, 0.7) +
      path('M168 112Q181 105 192 107L192 111Q181 115 170 115Z', '#ead2aa') +
      path('M167 111Q181 104 193 107L193 110Q180 108 169 114Z', ink) +
      ellipse(184, 110, 3.2, 3.1, ink) +
      line('M171 119L190 115', '#6b543f', 0.9, 0.7),
  )
  face += group(
    'imperial-nose-and-mouth',
    line('M150 115Q147 135 145 148Q143 156 149 160', '#745d43', 1.4, 0.85) +
      line('M165 140Q170 151 180 156Q185 162 177 168L169 168', '#684f39', 1.4, 0.9) +
      path('M150 167Q154 164 159 167L160 169L151 170Z', '#574736') +
      path('M174 166Q180 164 183 167L179 169L174 169Z', '#574736') +
      line('M145 178L139 187M184 177L187 186', '#8e6a4a', 1.25, 0.7) +
      path('M134 191Q149 186 162 189L180 187L186 190L177 193L157 194L137 194Z', '#926246', 0.7) +
      line('M136 191L158 190L182 190', ink, 1.4, 0.9) +
      line('M147 202Q162 206 175 200', '#987653', 1, 0.7),
  )
  face += group(
    'imperial-ear',
    line('M29 135Q41 128 45 143L39 154L34 150M39 139L35 143', '#826046', 1.5, 0.9),
  )
  face += group(
    'temple-hair',
    path('M41 123L36 77Q33 45 50 25L63 25L58 72L55 107L53 159L47 177L42 159Z', ink) +
      brush(
        [
          [49, 109],
          [46, 147],
          [57, 176],
          [69, 197],
        ],
        10,
        ink,
        0.9,
        0.5,
      ) +
      brush(
        [
          [186, 72],
          [195, 105],
          [190, 122],
          [192, 140],
        ],
        8,
        ink,
        0.8,
        0.7,
      ),
  )
  face += group(
    'mustache',
    path('M160 179Q146 172 132 178L116 192Q135 186 151 187L161 183Z', ink) +
      path('M165 179Q176 174 186 179L197 189L183 186L168 185Z', ink) +
      brush(
        [
          [159, 180],
          [141, 184],
          [129, 194],
          [108, 194],
        ],
        2.8,
        ink,
        0.9,
        0.7,
      ) +
      brush(
        [
          [173, 181],
          [181, 182],
          [193, 191],
          [204, 192],
        ],
        2.5,
        ink,
        0.9,
        0.8,
      ),
  )
  face += group(
    'beard-masses',
    path(
      'M59 184Q71 207 97 216L121 221L137 213L153 216L175 207L187 193Q187 230 169 255L148 285L136 294L120 313L109 294L99 300L88 279Q68 253 62 222Z',
      ink,
      0.95,
      'filter="url(#paper-edge)"',
    ) +
      path('M83 210Q99 222 118 229L113 269L105 281L96 263Z', '#6b6d5e', 0.6) +
      path('M143 228L169 216L159 247L138 276L126 291L134 258Z', '#535a4f', 0.65) +
      brush(
        [
          [62, 197],
          [65, 243],
          [97, 286],
          [118, 314],
        ],
        10,
        ink,
        0.9,
        0.8,
      ) +
      brush(
        [
          [179, 212],
          [178, 246],
          [149, 277],
          [129, 315],
        ],
        8,
        ink,
        0.9,
        0.8,
      ) +
      brush(
        [
          [112, 236],
          [114, 263],
          [126, 289],
          [116, 321],
        ],
        5,
        ink,
        1,
        0.8,
      ) +
      brush(
        [
          [92, 228],
          [94, 258],
          [110, 279],
          [103, 302],
        ],
        2,
        '#afaa88',
        0.6,
        0.7,
      ) +
      brush(
        [
          [155, 229],
          [149, 257],
          [135, 281],
          [130, 298],
        ],
        1.5,
        '#b3af8f',
        0.6,
        0.7,
      ),
  )
  face += group(
    'age-and-resolve',
    line(
      'M83 69Q108 63 138 68M86 76Q116 71 145 76M88 130Q109 137 129 126M173 124L191 119',
      '#8e7251',
      0.85,
      0.6,
    ) + line('M77 116L69 114M78 122L70 127M138 129L140 135', '#715b42', 0.9, 0.65),
  )
  face += group(
    'living-beard-strands',
    repeat(27, (index) => {
      const progress = index / 26
      const horizontal = 63 + progress * 116
      const vertical = 207 + Math.sin(progress * Math.PI) * 23
      const target = 119 + (horizontal - 119) * 0.34
      return brush(
        [
          [horizontal, vertical],
          [horizontal - 3 + progress * 6, vertical + 28],
          [target - 4, 287 + random() * 12],
          [target + random() * 12 - 6, 298 + Math.sin(progress * Math.PI) * 26 + random() * 13],
        ],
        0.7 + random() * 2.2,
        index % 5 ? ink : '#b3ae8d',
        0.65 + random() * 0.3,
        0.8,
      )
    }) +
      brush(
        [
          [47, 94],
          [44, 130],
          [54, 169],
          [65, 194],
        ],
        5,
        ink,
        0.95,
        0.8,
      ) +
      brush(
        [
          [142, 181],
          [127, 183],
          [118, 197],
          [104, 200],
        ],
        1.1,
        ink,
        0.9,
        0.9,
      ),
  )
  return group('emperor-head', face, 'transform="translate(727 211) scale(1.12)"')
}

function emperor() {
  const paint = studio(731)
  const { path, line, group, ellipse, brush, random } = paint
  let content = group(
    'robe-silhouette',
    path(
      'M758 491Q672 464 600 499Q516 533 477 612L434 700Q399 765 384 874L429 909L484 940Q788 978 1126 935L1193 894L1166 826L1124 695Q1097 574 1023 536L942 505L887 533Z',
      ink,
      0.98,
      'filter="url(#paper-edge)"',
    ) +
      path(
        'M470 680Q516 565 590 536L627 548L589 638L579 701L551 752L511 854L438 883L408 872Z',
        '#56594c',
        0.8,
        'filter="url(#broken-ink)"',
      ) +
      path(
        'M987 553Q1050 591 1083 671L1104 768L1155 876L1081 925L1021 934L1043 844L1022 736L1006 642Z',
        '#485148',
        0.8,
        'filter="url(#broken-ink)"',
      ),
  )
  content += group(
    'imperial-neck',
    path('M785 451L784 505L844 554L916 505L913 445Z', paleSkin) +
      path('M786 464L907 460L898 495L852 517L792 493Z', '#8d7553', 0.45),
  )
  content += group(
    'crossed-collar',
    path('M759 494L780 484L846 547L913 493L951 514L856 625L825 621L705 523Z', red) +
      path('M750 500L846 589L933 508L947 516L850 618L829 618L734 516Z', '#b29862', 0.9) +
      line('M749 508L843 598L938 515', '#d8bf86', 2, 0.8),
  )
  content += emperorHead(paint)
  content += group(
    'imperial-crown',
    path(
      'M755 261L744 213L750 168Q769 151 844 150Q909 151 933 176L941 254Q865 273 755 261Z',
      ink,
      1,
      'filter="url(#paper-edge)"',
    ) +
      path('M756 190L777 174L788 254L761 256Z', '#63675a', 0.65) +
      path('M712 147L908 111L991 144L794 184Z', '#353c35') +
      path('M712 147L794 176L991 138L990 151L795 191L710 160Z', ink) +
      line('M718 149L794 178L982 141', '#a78e58', 2.8, 0.9) +
      path('M754 252Q851 267 939 248L941 260Q844 281 757 266Z', '#8e7547') +
      line('M759 259Q850 274 934 256', '#ccb27d', 1.8, 0.9),
  )
  content += group(
    'crown-drops',
    repeat(4, (index) => {
      const horizontal = 727 + index * 17
      const start = 160 + index * 7
      const end = 322 + index * 13
      return (
        line(`M${horizontal} ${start}L${horizontal - 4} ${end}`, '#796b47', 0.8, 0.85) +
        repeat(7, (bead) =>
          ellipse(
            number(horizontal - bead * 0.55),
            number(start + ((end - start) / 7) * (bead + 1)),
            2.1,
            2.7,
            bead % 3 ? '#97875a' : '#455e50',
            0.9,
          ),
        )
      )
    }) +
      repeat(3, (index) =>
        line(
          `M${946 + index * 16} ${159 - index * 3}L${948 + index * 16} ${306 - index * 9}`,
          '#796b47',
          0.9,
          0.8,
        ),
      ),
  )
  content += group(
    'heavy-sleeve-gesture',
    path(
      'M546 622Q558 691 630 728L836 777L827 872Q578 876 437 814L446 760Z',
      ink,
      0.98,
      'filter="url(#paper-edge)"',
    ) +
      path(
        'M1090 663Q1065 717 997 745L859 778L851 854Q1027 858 1158 793L1136 737Z',
        '#28322e',
        1,
        'filter="url(#paper-edge)"',
      ) +
      path('M823 765L851 772L843 869L814 868Z', red) +
      path('M861 774L887 765L901 855L869 863Z', red) +
      line('M835 776L831 860M875 777L887 850', '#b49a66', 4, 0.85) +
      path('M848 788L864 784L876 796L876 818L859 835L842 829L838 812Z', paleSkin) +
      line('M846 800L861 804L867 814M846 815L858 819', '#765a40', 1.5, 0.8),
  )
  content += group(
    'robe-pressure-strokes',
    brush(
      [
        [527, 580],
        [507, 630],
        [478, 694],
        [474, 739],
      ],
      15,
      '#9b9b7e',
      0.5,
      0.8,
    ) +
      brush(
        [
          [561, 614],
          [558, 685],
          [610, 726],
          [694, 746],
        ],
        11,
        '#838c78',
        0.65,
        0.8,
      ) +
      brush(
        [
          [462, 774],
          [550, 824],
          [673, 846],
          [803, 843],
        ],
        11,
        '#7c8671',
        0.8,
        0.7,
      ) +
      brush(
        [
          [485, 802],
          [571, 844],
          [701, 861],
          [808, 855],
        ],
        3,
        '#b1b195',
        0.65,
        0.7,
      ) +
      brush(
        [
          [1097, 715],
          [1062, 768],
          [990, 802],
          [905, 817],
        ],
        9,
        '#969c81',
        0.65,
        0.8,
      ) +
      brush(
        [
          [1114, 802],
          [1058, 834],
          [981, 847],
          [907, 845],
        ],
        3,
        '#c1baa0',
        0.6,
        0.8,
      ) +
      brush(
        [
          [655, 544],
          [691, 613],
          [686, 694],
          [721, 734],
        ],
        25,
        '#4f5b4e',
        0.9,
        0.7,
      ) +
      brush(
        [
          [951, 570],
          [927, 645],
          [950, 708],
          [935, 747],
        ],
        17,
        '#5c6553',
        0.7,
        0.8,
      ),
  )
  content += group(
    'broken-hem',
    repeat(15, (index) => {
      const horizontal = 463 + index * 44
      return brush(
        [
          [horizontal, 882],
          [horizontal - 12, 901],
          [horizontal + 8, 931],
          [horizontal - 15, 962 - random() * 18],
        ],
        7 + random() * 16,
        ink,
        0.45 + random() * 0.35,
        0.8,
      )
    }),
  )
  return { ...paint, content }
}

function youngHead(paint) {
  const { path, line, group, brush, ellipse } = paint
  let face = path(
    'M44 24Q89 -1 132 13Q167 25 178 55L177 90Q180 115 178 139L173 166Q168 187 151 205L132 225Q120 233 107 228L83 214L61 197L45 174L33 153Q18 157 11 144Q0 128 9 115Q16 109 29 116L29 75Q26 43 44 24Z',
    '#dbbf94',
  )
  face += path(
    'M34 55Q51 36 67 35L60 88L55 123L60 157Q69 186 89 207L117 229L106 227L82 212L60 195L44 168L29 145L31 100Z',
    '#9b7e58',
    0.3,
  )
  face += path(
    'M157 46L176 69L177 99L167 117L171 138L175 152L168 173L152 190L156 168L161 147L154 125L156 93Z',
    '#a38259',
    0.19,
  )
  face +=
    '<defs><radialGradient id="young-forehead-tone" cx="48%" cy="42%" r="58%"><stop offset="0" stop-color="#efdab1" stop-opacity="0.26"/><stop offset="0.5" stop-color="#efdab1" stop-opacity="0.12"/><stop offset="1" stop-color="#efdab1" stop-opacity="0"/></radialGradient></defs>'
  face += ellipse(105, 61, 52, 34, 'url(#young-forehead-tone)')
  face += path('M129 109L133 132Q135 142 144 147L137 153L129 143L125 125Z', '#f1d8aa', 0.66)
  face += group(
    'young-brows',
    path('M49 97Q70 88 89 92L112 99L110 103L88 98Q69 95 52 101Z', ink, 0.94) +
      path('M141 98Q154 92 169 94L174 98L162 98L143 102Z', ink, 0.92) +
      line('M54 96L69 92M76 93L94 96M148 97L162 95', '#686854', 0.85, 0.7),
  )
  face += group(
    'young-gaze',
    path('M61 113Q80 103 99 107L112 113Q92 124 72 119Z', '#eee0c2') +
      ellipse(95, 113.2, 4.8, 5.1, '#484d3f') +
      ellipse(96, 113.5, 2.45, 3.5, ink) +
      ellipse(96.8, 111.3, 1.15, 1.1, '#fff0cf') +
      path('M60 112Q79 102 99 106L113 112L110 114Q88 104 65 114Z', ink, 0.96) +
      line('M67 117Q84 124 104 117', '#927654', 0.9, 0.8) +
      path('M140 111Q153 104 166 108L171 112Q159 119 144 116Z', '#eee0c2') +
      ellipse(160, 111.9, 3.7, 4.1, '#484d3f') +
      ellipse(160.6, 112.1, 2, 2.9, ink) +
      ellipse(161, 110.2, 0.8, 0.85, '#fff0cf') +
      path('M139 110Q153 102 166 107L172 112L169 113Q155 106 142 113Z', ink, 0.93) +
      line('M145 117Q157 120 167 115', '#927654', 0.8, 0.7),
  )
  face += group(
    'young-features',
    line('M124 109Q120 126 121 139Q122 145 126 148', '#9a7951', 1.05, 0.68) +
      line('M133 122Q134 136 143 144Q148 148 144 152L138 154', '#816445', 1.1, 0.84) +
      path('M127 152Q131 150 135 152L133 153.5L128 153.5Z', '#67503a', 0.9) +
      line('M141 152L145 150', '#67503a', 1.1, 0.8) +
      line('M134 160L133 165', '#ab875e', 0.8, 0.55) +
      path(
        'M106 177Q117 176 127 173L134 175L147 174L154 177Q138 183 123 181L109 179Z',
        '#ab7858',
        0.65,
      ) +
      line('M108 177Q119 179 131 177Q144 178 152 176', '#654c36', 1.35, 0.9) +
      path('M115 181Q131 184 146 180Q135 188 120 186Z', '#d7ab82', 0.7) +
      line('M122 199Q133 201 143 197', '#a38661', 0.9, 0.6) +
      line('M18 124Q30 117 33 132L27 143L22 138', '#805f40', 1.3, 0.85),
  )
  face += group(
    'ink-hair-mass',
    path(
      'M27 141Q16 115 13 83Q8 50 29 22Q47 -6 78 -10Q126 -22 156 1Q189 18 188 58L178 97L167 81L163 53L133 34L106 21Q76 56 39 61L36 103L39 153L29 154Z',
      ink,
      1,
      'filter="url(#paper-edge)"',
    ) +
      path('M44 16Q75 -4 111 2L128 16L100 16L71 42L39 53L30 49Z', '#656b58', 0.7) +
      path('M71 -5Q60 -19 68 -39Q79 -54 100 -45Q119 -39 111 -15L106 -3Z', ink) +
      path('M79 -34L84 -41L95 -40L89 -11L80 -8Z', '#6f755c', 0.7) +
      path('M82 -4L114 -8L116 1L83 6Z', red) +
      brush(
        [
          [87, -38],
          [78, -22],
          [82, -10],
          [87, -1],
        ],
        2.5,
        '#c0b58d',
        0.7,
        0.7,
      ) +
      brush(
        [
          [124, 4],
          [157, 12],
          [177, 32],
          [178, 61],
        ],
        4,
        '#a0a18a',
        0.55,
        0.7,
      ) +
      brush(
        [
          [30, 64],
          [23, 89],
          [28, 119],
          [32, 145],
        ],
        6,
        ink,
        1,
        0.75,
      ) +
      brush(
        [
          [104, 20],
          [84, 44],
          [65, 49],
          [42, 55],
        ],
        2.7,
        '#bab79a',
        0.75,
        0.8,
      ) +
      brush(
        [
          [137, 28],
          [158, 42],
          [169, 59],
          [169, 78],
        ],
        2.1,
        '#a5ad91',
        0.6,
        0.8,
      ),
  )
  face += group(
    'wind-loose-hair',
    brush(
      [
        [41, 36],
        [12, 37],
        [-13, 57],
        [-49, 47],
      ],
      5,
      ink,
      0.9,
      0.8,
    ) +
      brush(
        [
          [36, 52],
          [12, 66],
          [-5, 70],
          [-34, 67],
        ],
        2.1,
        ink,
        0.9,
        0.9,
      ) +
      brush(
        [
          [32, 100],
          [14, 113],
          [6, 138],
          [-5, 154],
        ],
        2.5,
        ink,
        0.9,
        0.8,
      ),
  )
  face += group(
    'swept-hair-strokes',
    brush(
      [
        [106, 20],
        [88, 42],
        [61, 56],
        [32, 60],
      ],
      5,
      ink,
      0.98,
      0.8,
    ) +
      brush(
        [
          [118, 16],
          [144, 18],
          [176, 42],
          [182, 70],
        ],
        6,
        ink,
        0.95,
        0.8,
      ) +
      brush(
        [
          [104, 12],
          [87, 14],
          [63, 24],
          [45, 38],
        ],
        3,
        '#a6ad8b',
        0.75,
        0.8,
      ) +
      brush(
        [
          [121, 11],
          [149, 18],
          [169, 36],
          [176, 55],
        ],
        1.4,
        '#c1bea0',
        0.75,
        0.8,
      ) +
      brush(
        [
          [28, 63],
          [17, 96],
          [32, 123],
          [35, 150],
        ],
        4,
        ink,
        0.95,
        0.8,
      ),
  )
  return group('young-head', face, 'transform="translate(777 214) rotate(-2 100 115) scale(1.12)"')
}

function commander() {
  const paint = studio(419)
  const { path, line, group, brush, ellipse } = paint
  let content = group(
    'cloak',
    path(
      'M797 455Q699 447 629 498Q578 537 521 553Q427 577 309 523Q346 588 405 618L310 629Q393 683 479 677L406 719Q517 748 623 678L753 627L908 534Z',
      red,
      0.96,
      'filter="url(#paper-edge)"',
    ) +
      path(
        'M686 489Q628 569 535 603Q453 631 370 590Q458 657 539 630L649 576L755 490Z',
        '#b26849',
        0.75,
        'filter="url(#broken-ink)"',
      ) +
      path('M738 511Q699 607 598 651L467 707Q518 727 611 679L774 618L869 532Z', '#512f2a', 0.9) +
      brush(
        [
          [707, 489],
          [579, 574],
          [492, 629],
          [345, 564],
        ],
        6,
        '#d39d6d',
        0.9,
        0.8,
      ) +
      brush(
        [
          [685, 592],
          [598, 668],
          [502, 694],
          [435, 698],
        ],
        4,
        '#ba7754',
        0.85,
        0.8,
      ) +
      brush(
        [
          [339, 550],
          [297, 530],
          [264, 503],
          [225, 495],
        ],
        6,
        red,
        0.8,
        0.8,
      ),
  )
  content += group(
    'armor-body',
    path(
      'M799 461Q722 455 670 512L634 621L653 736L620 903L765 955L1049 898L1038 768L1051 658Q1035 544 942 493L891 467L851 501Z',
      '#4d5a51',
      1,
      'filter="url(#paper-edge)"',
    ) +
      path(
        'M719 502Q754 490 786 511L796 640L728 739L672 727L670 629Z',
        '#808778',
        0.9,
        'filter="url(#broken-ink)"',
      ) +
      path(
        'M974 541Q1037 609 1034 695L1010 781L1041 886L973 913L923 794L942 711L928 617Z',
        '#293b35',
        0.98,
      ) +
      path(
        'M787 538L894 546L944 611L938 700L873 747L791 723L751 650Z',
        '#596c5e',
        0.8,
        'filter="url(#broken-ink)"',
      ),
  )
  content += group(
    'neck',
    path('M828 405L816 461L850 510L907 468L915 402Z', '#d1b28a') +
      path('M830 413L904 419L896 459L853 481L822 454Z', '#937550', 0.6),
  )
  content += group(
    'collar',
    path('M798 455L818 447L857 488L906 449L938 479L865 537L837 528L777 474Z', red) +
      path('M805 458L856 511L921 463L932 475L866 532L845 527L791 471Z', '#baa06d', 0.95),
  )
  content += youngHead(paint)
  content += group(
    'shoulder-lames',
    path(
      'M702 502Q735 480 781 509L799 566L775 606L670 568L661 550Z',
      '#3b4c43',
      1,
      'filter="url(#paper-edge)"',
    ) +
      path(
        'M932 505Q997 522 1018 567L1038 609L977 606L931 567L920 533Z',
        '#35463d',
        1,
        'filter="url(#paper-edge)"',
      ) +
      brush(
        [
          [693, 517],
          [722, 512],
          [755, 526],
          [780, 544],
        ],
        7,
        '#bab99a',
        0.85,
        0.7,
      ) +
      brush(
        [
          [678, 539],
          [712, 546],
          [744, 564],
          [777, 572],
        ],
        5.5,
        '#a2ae93',
        0.8,
        0.8,
      ) +
      brush(
        [
          [686, 560],
          [712, 570],
          [746, 587],
          [770, 587],
        ],
        4,
        '#d0c5a1',
        0.65,
        0.8,
      ) +
      brush(
        [
          [940, 522],
          [963, 531],
          [989, 553],
          [1009, 580],
        ],
        6,
        '#bab99b',
        0.8,
        0.7,
      ) +
      brush(
        [
          [935, 547],
          [957, 565],
          [983, 584],
          [1020, 592],
        ],
        3.5,
        '#b6b498',
        0.75,
        0.8,
      ),
  )
  content += group(
    'selective-armor-marks',
    repeat(7, (row) => {
      const vertical = 577 + row * 20
      return (
        brush(
          [
            [792 - row * 2, vertical],
            [836, vertical + 17],
            [883, vertical + 12],
            [927, vertical - 9],
          ],
          3.2,
          '#c2b991',
          0.55,
          0.8,
        ) +
        repeat(6, (column) => {
          const horizontal = 794 + column * 22 - row * 2
          return line(`M${horizontal} ${vertical + 3}l-2 10q6 5 14 1`, '#273a32', 1.4, 0.7)
        })
      )
    }) +
      brush(
        [
          [751, 581],
          [732, 633],
          [739, 692],
          [768, 719],
        ],
        15,
        '#222f2a',
        0.9,
        0.8,
      ) +
      brush(
        [
          [933, 595],
          [924, 654],
          [908, 704],
          [884, 738],
        ],
        11,
        '#1f302a',
        0.9,
        0.8,
      ),
  )
  content += group(
    'belt-and-skirt',
    path(
      'M653 740Q843 804 1023 736L1030 775Q843 850 647 786Z',
      '#302f27',
      1,
      'filter="url(#paper-edge)"',
    ) +
      line('M660 748Q848 811 1017 747M655 779Q840 842 1022 767', '#ae9564', 2.5, 0.8) +
      path('M845 792L893 783L903 822L855 833Z', '#ad935b') +
      path('M854 799L887 792L894 816L863 823Z', '#3a4b3c') +
      line('M863 803L887 813L869 816', '#c6b780', 1.6, 0.9) +
      path('M650 791L760 824L803 936L756 957L620 903Z', '#363f35', 1, 'filter="url(#broken-ink)"') +
      path('M909 820L1023 780L1063 902L939 942Z', '#2d3a32', 1, 'filter="url(#paper-edge)"') +
      brush(
        [
          [690, 813],
          [688, 862],
          [670, 900],
          [651, 919],
        ],
        8,
        '#a5a58b',
        0.7,
        0.8,
      ) +
      brush(
        [
          [961, 819],
          [973, 856],
          [985, 899],
          [1012, 916],
        ],
        5,
        '#b9b192',
        0.7,
        0.8,
      ),
  )
  content += group(
    'sword',
    path('M925 703L952 692L1062 927L1034 940Z', ink, 1, 'filter="url(#paper-edge)"') +
      brush(
        [
          [946, 721],
          [973, 785],
          [1013, 874],
          [1049, 930],
        ],
        5,
        '#bc9c63',
        0.9,
        0.6,
      ) +
      path('M914 707L954 688L964 704L924 725Z', '#a28a54') +
      path('M922 658L935 651L955 692L941 700Z', ink) +
      repeat(5, (index) =>
        line(`M${926 + index * 3} ${660 + index * 6}l12 1`, '#bda36d', 2.2, 0.85),
      ) +
      path('M918 660L935 649L940 657L923 667Z', '#bea368'),
  )
  content += group(
    'sword-arm',
    path(
      'M1010 605Q1055 630 1058 669L1045 714L984 750L955 733L963 709L1007 680L995 654L981 630Z',
      '#3b4c43',
      1,
      'filter="url(#paper-edge)"',
    ) +
      path('M1004 690L1026 713L982 745L960 727Z', '#6c634a') +
      brush(
        [
          [1021, 637],
          [1043, 662],
          [1034, 692],
          [1000, 712],
        ],
        6,
        '#b8b496',
        0.8,
        0.8,
      ) +
      line('M997 701L1009 716M986 708L998 725M976 715L987 734', '#c3ac76', 2, 0.85),
  )
  content += group(
    'grip',
    path(
      'M968 721L953 713L948 700L948 682Q945 673 937 674L918 679Q910 682 909 689L912 708Q916 720 928 723L953 737Z',
      paleSkin,
    ) +
      path('M916 683Q921 678 929 682L940 692L943 702L937 705L930 698L919 694Z', paleSkin) +
      line(
        'M918 685L929 687L938 697M916 695L925 698L933 708M919 705L927 708L931 716M942 710L951 720',
        '#72543b',
        1.3,
        0.9,
      ),
  )
  content += group(
    'resting-arm',
    path(
      'M675 580Q633 593 629 640L641 700L709 743L758 727L753 702L692 678L687 631L706 605Z',
      '#384b40',
      1,
      'filter="url(#paper-edge)"',
    ) +
      path('M700 683L731 696L759 705L754 732L716 742L687 716Z', '#66573e') +
      line('M706 693L696 713M719 700L709 725M732 706L723 730', '#b59c69', 2, 0.9) +
      path('M752 706L769 706L791 715L798 726L790 733L774 729L763 734L751 729L744 719Z', paleSkin) +
      line('M762 713L778 719L789 721M761 722L773 725', '#75563a', 1.4, 0.8),
  )
  content += group(
    'campaign-brush-accents',
    brush(
      [
        [647, 663],
        [654, 683],
        [676, 701],
        [698, 708],
      ],
      8,
      '#9da68c',
      0.7,
      0.8,
    ) +
      brush(
        [
          [711, 817],
          [744, 840],
          [761, 879],
          [769, 914],
        ],
        15,
        '#60705a',
        0.8,
        0.8,
      ) +
      brush(
        [
          [1015, 807],
          [1031, 839],
          [1046, 870],
          [1060, 897],
        ],
        7,
        ink,
        0.9,
        0.8,
      ) +
      ellipse(693, 537, 2.5, 3, '#b7a26e', 0.95) +
      ellipse(970, 549, 2.5, 3, '#b7a26e', 0.95),
  )
  return { ...paint, content }
}

function horse() {
  const paint = studio(619)
  const { path, line, group, brush, ellipse } = paint
  let content = group(
    'far-legs',
    path(
      'M690 527Q682 566 644 592L582 604L505 603L451 584L441 596L476 617L556 633L636 634Q690 618 731 576Z',
      '#4f4937',
      0.95,
      'filter="url(#paper-edge)"',
    ) +
      path(
        'M974 537Q997 555 997 582L990 626L1021 665L1052 669L1056 682L1043 691L1019 680L967 644Q954 634 961 614L966 590L937 567Z',
        '#53513e',
        1,
        'filter="url(#paper-edge)"',
      ) +
      path(
        'M441 584L453 585L458 599L445 610L429 603L431 591ZM1045 671L1058 671L1069 687L1058 699L1046 691L1038 685Z',
        ink,
      ),
  )
  content += group(
    'tail-calligraphy',
    brush(
      [
        [680, 459],
        [544, 410],
        [492, 553],
        [318, 457],
      ],
      44,
      ink,
      0.96,
      0.7,
    ) +
      brush(
        [
          [653, 466],
          [536, 454],
          [488, 556],
          [281, 499],
        ],
        19,
        '#444539',
        0.9,
        0.8,
      ) +
      brush(
        [
          [628, 461],
          [526, 438],
          [490, 479],
          [347, 402],
        ],
        16,
        ink,
        0.95,
        0.8,
      ) +
      brush(
        [
          [588, 466],
          [500, 497],
          [427, 488],
          [315, 445],
        ],
        8,
        '#7e7250',
        0.9,
        0.8,
      ) +
      brush(
        [
          [618, 475],
          [515, 523],
          [389, 515],
          [274, 468],
        ],
        4,
        ink,
        0.95,
        0.8,
      ),
  )
  const body =
    'M618 454C650 418 702 416 752 434Q847 463 930 429Q980 408 1007 360L1050 293Q1069 264 1095 273L1120 296Q1116 330 1095 367Q1068 420 1052 471C1045 511 1034 552 1004 581Q976 612 930 626Q875 641 827 622L751 600Q693 602 652 584Q609 565 600 528Q587 481 618 454Z'
  content += group(
    'horse-body',
    path(body, '#aa6444', 0.98, 'filter="url(#paper-edge)"') +
      `<clipPath id="body-clip"><path d="${body}"/></clipPath><g clip-path="url(#body-clip)">` +
      path(
        'M599 473Q644 421 690 447Q726 474 707 518L673 560L638 569L609 529Z',
        '#734c36',
        0.6,
        'filter="url(#broken-ink)"',
      ) +
      path(
        'M663 430Q731 432 779 451Q862 481 938 444L975 425L967 445Q857 507 758 479L693 456Z',
        '#d5a16b',
        0.85,
        'filter="url(#broken-ink)"',
      ) +
      path(
        'M690 553Q767 570 817 593L878 613L958 591L997 563Q976 610 931 628L870 634L803 614L749 597L688 587Z',
        '#513f30',
        0.9,
        'filter="url(#broken-ink)"',
      ) +
      path(
        'M1008 352Q1041 295 1077 281L1087 299L1047 367L1018 430L996 460L970 467L986 411Z',
        '#d3a16d',
        0.9,
        'filter="url(#broken-ink)"',
      ) +
      path(
        'M1092 321Q1080 389 1054 443L1038 518L1007 571L987 581Q994 527 1014 478L1040 423L1065 359Z',
        '#5a4230',
        0.8,
        'filter="url(#broken-ink)"',
      ) +
      path(
        'M947 461Q987 442 1016 463L1014 507L993 546L970 552L949 525L941 492Z',
        '#ca8c5b',
        0.75,
        'filter="url(#broken-ink)"',
      ) +
      brush(
        [
          [633, 463],
          [615, 494],
          [631, 533],
          [662, 551],
        ],
        18,
        '#d3a36f',
        0.85,
        0.8,
      ) +
      brush(
        [
          [982, 467],
          [964, 493],
          [973, 525],
          [989, 538],
        ],
        13,
        '#e1b47f',
        0.8,
        0.8,
      ) +
      brush(
        [
          [745, 489],
          [802, 518],
          [860, 514],
          [907, 492],
        ],
        9,
        '#dcad75',
        0.6,
        0.85,
      ) +
      '</g>',
  )
  content += group(
    'near-hind-leg',
    path(
      'M670 536Q663 570 632 597L595 626L563 653L522 682L496 709L479 704L481 691L504 665L543 634L574 603L595 565L623 537Z',
      '#9b5c3e',
      1,
      'filter="url(#paper-edge)"',
    ) +
      path(
        'M643 547Q631 576 603 599L564 638L526 666L496 698L487 698L508 668L550 631L576 600L602 555Z',
        '#d49a66',
        0.9,
        'filter="url(#broken-ink)"',
      ) +
      brush(
        [
          [644, 561],
          [616, 602],
          [555, 640],
          [514, 684],
        ],
        6,
        '#503d2b',
        0.9,
        0.8,
      ) +
      path('M482 692L498 701L495 718L478 730L460 722L463 711Z', ink) +
      line('M468 714L485 707', '#b59e73', 1.5, 0.8),
  )
  content += group(
    'near-front-leg',
    path(
      'M985 535Q1005 548 1021 576L1058 609Q1073 619 1090 620L1143 629L1217 650L1258 650L1265 664L1253 673L1224 668L1140 648L1084 644Q1057 643 1039 629L999 603L970 575L961 550Z',
      '#ac6948',
      1,
      'filter="url(#paper-edge)"',
    ) +
      path(
        'M984 547Q1004 566 1018 587L1055 622L1090 631L1144 639L1225 660L1248 659L1247 665L1221 663L1141 645L1087 640Q1057 640 1045 630L1009 602L980 571Z',
        '#d4a271',
        0.9,
        'filter="url(#broken-ink)"',
      ) +
      brush(
        [
          [1002, 588],
          [1040, 632],
          [1067, 636],
          [1141, 643],
        ],
        4.5,
        '#573e2b',
        0.9,
        0.8,
      ) +
      path('M1250 650L1264 650L1281 665L1278 678L1255 686L1242 672Z', ink) +
      line('M1252 673L1273 662', '#c0ae80', 1.4, 0.8),
  )
  content += group(
    'structural-ink',
    brush(
      [
        [625, 453],
        [656, 424],
        [705, 434],
        [744, 446],
      ],
      8,
      ink,
      0.9,
      0.7,
    ) +
      brush(
        [
          [766, 456],
          [838, 479],
          [901, 451],
          [947, 426],
        ],
        7,
        '#4a412e',
        0.9,
        0.8,
      ) +
      brush(
        [
          [1015, 378],
          [1004, 413],
          [971, 441],
          [957, 469],
        ],
        7,
        '#58422c',
        0.95,
        0.7,
      ) +
      brush(
        [
          [947, 468],
          [929, 506],
          [941, 546],
          [969, 561],
        ],
        5,
        '#463b29',
        0.9,
        0.8,
      ) +
      brush(
        [
          [686, 474],
          [712, 506],
          [692, 546],
          [665, 560],
        ],
        4.5,
        '#5a412e',
        0.85,
        0.8,
      ) +
      brush(
        [
          [737, 597],
          [799, 599],
          [850, 651],
          [928, 623],
        ],
        7,
        ink,
        0.85,
        0.8,
      ),
  )
  let head = path(
    'M1063 280Q1090 256 1117 274Q1139 289 1146 314L1165 339L1200 361Q1213 370 1208 385L1199 396L1180 394L1150 374L1125 356Q1106 356 1094 344L1076 325L1064 305Z',
    '#ac6b47',
    1,
    'filter="url(#paper-edge)"',
  )
  head += path(
    'M1091 281Q1116 281 1128 309L1134 335L1161 364L1183 378L1179 383L1144 361L1124 342L1115 315Z',
    '#daa56e',
    0.8,
    'filter="url(#broken-ink)"',
  )
  head += path('M1184 360L1203 365L1211 378L1205 391L1192 395L1176 385L1175 375Z', '#58432f', 0.9)
  head += path(
    'M1068 282Q1057 259 1066 230Q1085 247 1084 276ZM1095 273Q1103 250 1124 242Q1128 265 1110 287Z',
    '#66452f',
    1,
    'filter="url(#paper-edge)"',
  )
  head +=
    brush(
      [
        [1069, 240],
        [1074, 252],
        [1073, 267],
        [1076, 276],
      ],
      4,
      ink,
      0.9,
      0.7,
    ) +
    brush(
      [
        [1118, 250],
        [1114, 260],
        [1107, 270],
        [1106, 278],
      ],
      4,
      ink,
      0.9,
      0.7,
    )
  head += group(
    'horse-alert-eye',
    path('M1110 314Q1117 305 1129 309L1134 315Q1122 324 1113 320Z', ink) +
      ellipse(1123, 314, 2.5, 2, '#e9cf9b') +
      ellipse(1125, 313, 1.2, 1.8, ink) +
      brush(
        [
          [1108, 306],
          [1119, 299],
          [1127, 304],
          [1134, 308],
        ],
        3.2,
        ink,
        0.95,
        0.7,
      ),
  )
  head += group(
    'horse-muzzle',
    path('M1187 367Q1198 363 1201 374Q1204 384 1194 387L1188 382L1184 375Z', ink) +
      line('M1188 390Q1200 397 1205 385', ink, 2.4, 0.95) +
      brush(
        [
          [1130, 328],
          [1126, 344],
          [1144, 351],
          [1159, 354],
        ],
        2.5,
        '#503a29',
        0.9,
        0.7,
      ),
  )
  content += group('horse-head', head)
  content += group(
    'wind-mane',
    brush(
      [
        [1090, 275],
        [1053, 233],
        [1019, 321],
        [941, 319],
      ],
      28,
      ink,
      0.98,
      0.7,
    ) +
      brush(
        [
          [1075, 291],
          [1030, 287],
          [1023, 369],
          [924, 358],
        ],
        23,
        ink,
        0.95,
        0.8,
      ) +
      brush(
        [
          [1060, 315],
          [1014, 312],
          [1003, 406],
          [899, 397],
        ],
        19,
        ink,
        0.95,
        0.8,
      ) +
      brush(
        [
          [1036, 349],
          [1009, 367],
          [1005, 412],
          [925, 442],
        ],
        15,
        ink,
        0.9,
        0.8,
      ) +
      brush(
        [
          [1080, 263],
          [1049, 245],
          [1029, 279],
          [990, 267],
        ],
        6,
        ink,
        0.9,
        0.8,
      ) +
      brush(
        [
          [1057, 293],
          [1020, 301],
          [1011, 332],
          [952, 335],
        ],
        4,
        '#b8a373',
        0.8,
        0.8,
      ) +
      brush(
        [
          [1039, 329],
          [1000, 347],
          [1000, 375],
          [928, 381],
        ],
        3,
        '#c0ab7c',
        0.8,
        0.8,
      ) +
      brush(
        [
          [1098, 275],
          [1111, 275],
          [1117, 288],
          [1128, 291],
        ],
        8,
        ink,
        0.95,
        0.7,
      ),
  )
  content += group(
    'flying-hair-ends',
    brush(
      [
        [989, 296],
        [974, 305],
        [963, 304],
        [951, 299],
      ],
      2.5,
      ink,
      0.9,
      0.9,
    ) +
      brush(
        [
          [963, 355],
          [943, 366],
          [919, 360],
          [897, 362],
        ],
        2.5,
        ink,
        0.9,
        0.9,
      ) +
      brush(
        [
          [934, 402],
          [912, 414],
          [889, 412],
          [866, 411],
        ],
        2.5,
        ink,
        0.85,
        0.9,
      ),
  )
  content = group('rising-gallop', content, 'transform="rotate(-7 790 500)"')
  return { ...paint, content }
}

const studies = [
  {
    id: 'han-wudi-command',
    name: '汉武帝 · 凝威',
    note: '压眉凝视 · 玄衣重墨 · 拢袖静势',
    draw: emperor,
  },
  {
    id: 'huo-qubing-vanguard',
    name: '霍去病 · 锐气',
    note: '青年侧望 · 按剑蓄势 · 迎风披袍',
    draw: commander,
  },
  {
    id: 'red-hare-flight',
    name: '赤兔 · 凌风',
    note: '腾空奔姿 · 胸颈领势 · 飞鬃长尾',
    draw: horse,
  },
]

for (const study of studies) {
  const painting = study.draw()
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.note}。第三版代码写意绘画，原创历史文学角色意象，非真实肖像或历史服制复原。透明背景。</desc>${painting.definitions}${painting.group('painting', painting.content)}</svg>`
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
      version: 3,
      medium: 'code-painted-expressive-ink',
      width: 1600,
      height: 1000,
      background: 'transparent',
      assets: studies.map(({ id, name, note }) => ({
        id,
        name,
        note,
        svg: `${id}.svg`,
        png: `${id}.png`,
      })),
    },
    null,
    2,
  ) + '\n',
)
const cards = studies
  .map(
    (study, index) =>
      `<article id="${study.id}"><a class="art" href="ink-wash/${study.id}.svg" target="_blank" aria-label="放大查看${study.name}"><img src="ink-wash/${study.id}.png" width="1600" height="1000" alt="${study.name}，${study.note}"></a><div class="caption"><div><span class="order">0${index + 1} / 写意重绘</span><h2>${study.name}</h2><p>${study.note}</p></div><nav aria-label="下载${study.name}"><a href="ink-wash/${study.id}.svg" download>可编辑 SVG ↓</a><a href="ink-wash/${study.id}.png" download>透明 PNG ↓</a></nav></div></article>`,
  )
  .join('')
writeFileSync(
  join(destination, 'index.html'),
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>衣冠与风骨 · 写意第三稿</title><style>*{box-sizing:border-box}body{margin:0;background:#dfc69c;color:#473d31;font-family:"Songti SC",serif}a{color:inherit;text-underline-offset:5px}a:focus-visible{outline:2px solid #884834;outline-offset:5px}main{max-width:1360px;margin:auto;padding:38px 52px 55px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #88705250;padding-bottom:24px;gap:20px}header strong{font-size:22px;letter-spacing:.1em}header nav{font:12px sans-serif;display:flex;gap:22px}.intro{display:flex;justify-content:space-between;align-items:end;gap:30px;margin:32px 0 0}.intro h1{font-size:38px;font-weight:500;letter-spacing:.1em;margin:0}.intro p{font:13px/1.9 sans-serif;color:#79634c;max-width:490px;margin:0}article{margin-top:28px}.art{display:block;max-width:1120px;margin:auto}.art img{display:block;width:100%;height:auto}.caption{display:flex;justify-content:space-between;gap:24px;align-items:center;border-top:1px solid #88705250;padding:18px 0 26px}.order{font:11px sans-serif;letter-spacing:.15em;color:#8b7053}h2{font-size:28px;font-weight:500;margin:9px 0}.caption p{font:12px/1.8 sans-serif;color:#79634c;margin:0}.caption nav{display:flex;gap:20px;font:12px sans-serif}footer{border-top:1px solid #88705250;padding-top:22px;font:12px/1.9 sans-serif;color:#79634c}@media(max-width:700px){main{padding:24px 20px}.intro,.caption{display:block}.intro h1{font-size:29px}.intro p{margin-top:16px}.caption nav{margin-top:16px}header strong{font-size:17px}header nav{gap:12px;flex-wrap:wrap}}</style></head><body><main><header><strong>纸上山河 · 衣冠与风骨</strong><nav><a href="../demo/ink-study.html#figure-collection">素材总览 ↗</a><a href="../figure-studies-v2/index.html">第二稿对照 ↗</a></nav></header><div class="intro"><h1>取其神，落其势。</h1><p>第三稿独立起稿。以明确的眉眼、连贯的发须与衣纹笔势表现人物，以腾空姿态与飞鬃长尾表现赤兔。全部由代码绘制，未使用生图模型。</p></div>${cards}<footer>1600 × 1000 · 透明 SVG / PNG · 纸底与题字仅在预览层。<br>原创历史文学角色意象；非真实肖像、特定历史现场或冠服甲胄考据复原。<br><a href="../../../../docs/design-system/xieyi-figure-skill-research.md">国画 Skill 研究与参考 ↗</a></footer></main></body></html>`,
)
syncInkCollections()
console.log('Generated three original code-painted expressive figure studies')
