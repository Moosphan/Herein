import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncInkCollections } from './sync-ink-collections.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const destination = join(root, 'resources/visuals/traditional-culture/colored-studies')
const inkDirectory = join(destination, 'ink-wash')
mkdirSync(inkDirectory, { recursive: true })

const number = (value) => Number(value.toFixed(2))
const repeat = (count, callback) =>
  Array.from({ length: count }, (_, index) => callback(index)).join('')

function randomSource(seed) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function painter(seed, colors) {
  const random = randomSource(seed)
  const shape = (outline, color, opacity = 1, extra = '') =>
    `<path d="${outline}" fill="${color}" opacity="${opacity}" ${extra}/>`
  const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1, extra = '') =>
    `<ellipse cx="${number(horizontal)}" cy="${number(vertical)}" rx="${number(radiusX)}" ry="${number(radiusY)}" fill="${color}" opacity="${opacity}" ${extra}/>`
  const group = (identity, content, extra = '') => `<g id="${identity}" ${extra}>${content}</g>`
  const wash = (outline, color, opacity = 1) =>
    shape(outline, color, opacity, 'filter="url(#wash)"')

  function stroke(points, width, color = colors.ink, opacity = 1, dry = false) {
    const samples = []
    for (let segment = 0; segment < points.length - 1; segment++) {
      const before = points[Math.max(0, segment - 1)]
      const start = points[segment]
      const end = points[segment + 1]
      const after = points[Math.min(points.length - 1, segment + 2)]
      for (let step = 0; step < 8; step++) {
        const fraction = step / 8
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
      const before = samples[Math.max(0, index - 1)]
      const after = samples[Math.min(samples.length - 1, index + 1)]
      const length = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
      const pressure = 0.1 + 0.45 * Math.sin((Math.PI * index) / (samples.length - 1)) ** 0.6
      const radius = width * pressure * (0.8 + random() * 0.4)
      for (let side = 0; side < 2; side++) {
        const direction = side ? 1 : -1
        sides[side].push(
          `${number(sample[0] - ((after[1] - before[1]) / length) * radius * direction)},${number(sample[1] + ((after[0] - before[0]) / length) * radius * direction)}`,
        )
      }
    })
    return shape(
      `M${sides[0].join('L')}L${sides[1].reverse().join('L')}Z`,
      color,
      opacity,
      `filter="url(#${dry ? 'dry' : 'edge'})"`,
    )
  }

  function ridge(identity, outline, faces, color, opacity = 1) {
    let content = `<linearGradient id="${identity}-color" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="${color}" stop-opacity=".64"/><stop offset=".52" stop-color="${color}" stop-opacity=".38"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>`
    content += wash(outline, `url(#${identity}-color)`, 1)
    content += `<clipPath id="${identity}-clip"><path d="${outline}"/></clipPath>`
    content += `<g clip-path="url(#${identity}-clip)">`
    faces.forEach(([horizontal, vertical, length, drift, breadth]) => {
      content += wash(
        `M${horizontal} ${vertical}Q${horizontal - breadth * 0.2} ${vertical + length * 0.25} ${horizontal + drift * 0.4} ${vertical + length * 0.48}L${horizontal + drift - breadth * 0.6} ${vertical + length}L${horizontal + drift + breadth} ${vertical + length * 0.9}Q${horizontal + breadth} ${vertical + length * 0.3} ${horizontal} ${vertical}Z`,
        'url(#rock-shade)',
        0.8,
      )
      content += wash(
        `M${horizontal + 10} ${vertical + 24}Q${horizontal + breadth * 1.6} ${vertical + length * 0.35} ${horizontal + drift + breadth * 1.9} ${vertical + length}L${horizontal + drift + breadth * 0.8} ${vertical + length * 0.92}Z`,
        colors.light,
        0.3,
      )
      content += repeat(60, () => {
        const progress = random()
        const left = horizontal + drift * progress + (random() - 0.4) * breadth * 1.8
        const top = vertical + length * progress
        const run = 14 + random() * 38
        return stroke(
          [
            [left, top],
            [left + (drift / length) * run * 0.3 - 4, top + run * 0.4],
            [left + (drift / length) * run, top + run],
          ],
          2 + random() * 8,
          colors.ink,
          0.1 + random() * 0.24,
          true,
        )
      })
      content += repeat(14, () => {
        const progress = random()
        return ellipse(
          horizontal + drift * progress + (random() - 0.3) * breadth,
          vertical + length * progress,
          2 + random() * 5,
          1 + random() * 2,
          colors.ink,
          0.26,
          'filter="url(#edge)"',
        )
      })
    })
    return group(identity, content + '</g>', `opacity="${opacity}" mask="url(#landscape-fade)"`)
  }

  function tree(horizontal, vertical, scale, foliage, identity) {
    let content = stroke(
      [
        [0, 0],
        [9, -46],
        [0, -99],
        [14, -160],
        [8, -225],
      ],
      17,
      colors.ink,
      0.9,
    )
    const branches = [
      [9, -67, -63, -116],
      [2, -113, 71, -160],
      [10, -154, -43, -201],
      [11, -185, 51, -225],
    ]
    branches.forEach(([startX, startY, endX, endY]) => {
      content += stroke(
        [
          [startX, startY],
          [(startX + endX) / 2, endY + 19],
          [endX, endY],
        ],
        8,
        colors.ink,
        0.83,
      )
    })
    ;[
      [-55, -124, 44, 29],
      [63, -164, 52, 32],
      [-31, -205, 46, 35],
      [13, -240, 39, 32],
    ].forEach(([centerX, centerY, breadth, height], cluster) => {
      content += ellipse(
        centerX,
        centerY,
        breadth,
        height,
        foliage[cluster % foliage.length],
        0.35,
        'filter="url(#wash)"',
      )
      content += repeat(45, () => {
        const angle = random() * Math.PI * 2
        const radius = Math.sqrt(random())
        const left = centerX + Math.cos(angle) * breadth * radius
        const top = centerY + Math.sin(angle) * height * radius
        return stroke(
          [
            [left - 4, top + 1],
            [left + 3, top - 4],
            [left + 8, top + 3],
          ],
          8 + random() * 11,
          foliage[Math.floor(random() * foliage.length)],
          0.35 + random() * 0.45,
        )
      })
    })
    content += stroke(
      [
        [-14, 8],
        [0, -2],
        [21, 4],
      ],
      6,
      colors.ink,
      0.55,
      true,
    )
    return group(
      identity,
      content,
      `transform="translate(${horizontal} ${vertical}) scale(${scale})"`,
    )
  }

  function roof(horizontal, vertical, breadth, height, fill) {
    const left = horizontal - breadth / 2
    const right = horizontal + breadth / 2
    let content = shape(
      `M${left} ${vertical + height * 0.8}Q${left + breadth * 0.2} ${vertical + height} ${horizontal - breadth * 0.12} ${vertical + 8}Q${horizontal} ${vertical - 5} ${horizontal + breadth * 0.12} ${vertical + 8}Q${right - breadth * 0.2} ${vertical + height} ${right} ${vertical + height * 0.8}Q${right - breadth * 0.07} ${vertical + height * 1.04} ${horizontal} ${vertical + height}Q${left + breadth * 0.07} ${vertical + height * 1.04} ${left} ${vertical + height * 0.8}Z`,
      fill,
      1,
      'filter="url(#edge)"',
    )
    content += wash(
      `M${left + 10} ${vertical + height * 0.85}Q${horizontal} ${vertical + height + 16} ${right - 10} ${vertical + height * 0.85}L${right - 28} ${vertical + height + 10}Q${horizontal} ${vertical + height + 22} ${left + 24} ${vertical + height + 10}Z`,
      colors.ink,
      0.75,
    )
    content += stroke(
      [
        [left + 8, vertical + height * 0.79],
        [horizontal, vertical + height * 0.9],
        [right - 8, vertical + height * 0.79],
      ],
      5,
      colors.light,
      0.65,
    )
    content += repeat(23, (index) => {
      const fraction = (index + 1) / 24
      const end = left + breadth * fraction
      const start = horizontal + (fraction - 0.5) * breadth * 0.25
      return stroke(
        [
          [start, vertical + 16],
          [(start + end) / 2, vertical + height * 0.67],
          [end, vertical + height * (0.87 + 0.08 * Math.sin(fraction * Math.PI))],
        ],
        1.8,
        colors.ink,
        0.2,
        true,
      )
    })
    return content
  }

  const definitions = `<defs>
    <filter id="edge" x="-15%" y="-20%" width="130%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".043 .12" numOctaves="3" seed="17" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".25"/></filter>
    <filter id="wash" x="-18%" y="-22%" width="136%" height="144%"><feTurbulence type="fractalNoise" baseFrequency=".023 .041" numOctaves="3" seed="31" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 .6 .6 0 -.1" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="pigment"/><feDisplacementMap in="pigment" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".7"/></filter>
    <filter id="dry" x="-12%" y="-18%" width="124%" height="136%"><feTurbulence type="fractalNoise" baseFrequency=".24 .6" numOctaves="3" seed="41" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.5 1.5 1.5 0 -1.5" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in"/><feDisplacementMap in2="noise" scale="2.3" xChannelSelector="R" yChannelSelector="G"/></filter>
    <linearGradient id="fade-gradient" x2="0" y2="1"><stop stop-color="white"/><stop offset=".77" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient>
    <mask id="fade"><rect width="1600" height="1000" fill="url(#fade-gradient)"/></mask>
    <linearGradient id="landscape-gradient" x1="0" y1="0" x2="0" y2="1000" gradientUnits="userSpaceOnUse"><stop stop-color="white"/><stop offset=".58" stop-color="white"/><stop offset=".87" stop-color="#555"/><stop offset=".95" stop-color="black"/></linearGradient>
    <mask id="landscape-fade"><rect width="1600" height="1000" fill="url(#landscape-gradient)"/></mask>
    <linearGradient id="rock-shade" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="${colors.ink}" stop-opacity=".52"/><stop offset=".46" stop-color="${colors.ink}" stop-opacity=".23"/><stop offset="1" stop-color="${colors.ink}" stop-opacity="0"/></linearGradient>
    <linearGradient id="ceramic" x1="0" y1="0" x2="1" y2=".1"><stop stop-color="#a5b5b3"/><stop offset=".28" stop-color="#e9e6d7"/><stop offset=".57" stop-color="#f0e9d6"/><stop offset=".84" stop-color="#c8d1c8"/><stop offset="1" stop-color="#839da8"/></linearGradient>
    <linearGradient id="gold" x1=".2" y1="0" x2=".7" y2="1"><stop stop-color="#dfb85e"/><stop offset=".45" stop-color="#c39745"/><stop offset="1" stop-color="#8d6636"/></linearGradient>
    <linearGradient id="sand" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="#d7b572" stop-opacity=".72"/><stop offset=".65" stop-color="#b78449" stop-opacity=".28"/><stop offset="1" stop-color="#a77948" stop-opacity="0"/></linearGradient>
  </defs>`

  return { random, shape, ellipse, group, wash, stroke, ridge, tree, roof, definitions }
}

function autumnStudy() {
  const paint = painter(7251, { ink: '#49433c', light: '#d1a16b' })
  const { group, shape, wash, stroke, ridge, tree, roof, ellipse, random } = paint
  let content = ridge(
    'far-slopes-left',
    'M270 570L362 444L407 463L484 335L532 388L601 309L675 416L731 438L816 564L818 792L262 799Z',
    [],
    '#607f8c',
    0.45,
  )
  content += ridge(
    'far-slopes-right',
    'M849 644L970 473L1001 505L1082 354L1114 387L1189 328L1230 442L1325 564L1371 797Z',
    [],
    '#607e88',
    0.38,
  )
  content += ridge(
    'autumn-main-cliff',
    'M164 771L197 593L242 574L278 434L328 459L373 309L414 336L471 188L510 230L541 322L573 355L601 476L663 512L701 684L675 843L250 901Z',
    [
      [471, 205, 499, -47, 57],
      [372, 320, 366, -64, 43],
      [278, 452, 272, -38, 39],
      [539, 332, 342, 57, 38],
    ],
    '#927454',
  )
  content += ridge(
    'autumn-right-cliff',
    'M903 816L961 646L1002 627L1037 546L1086 564L1127 480L1179 539L1212 636L1262 670L1386 829L1292 912Z',
    [
      [1126, 488, 294, 45, 48],
      [1036, 557, 222, -28, 28],
    ],
    '#9b805e',
    0.72,
  )
  content += group(
    'waterfall',
    shape(
      'M613 496Q603 544 616 578Q636 621 610 666L586 722Q603 731 619 720Q639 673 640 638Q645 598 629 569Q618 542 633 502Z',
      '#e5e4cf',
      0.9,
      'filter="url(#wash)"',
    ) +
      stroke(
        [
          [626, 510],
          [617, 559],
          [632, 615],
          [613, 686],
        ],
        3,
        '#6e8587',
        0.48,
      ) +
      wash('M545 740Q626 702 712 736Q747 764 692 782Q609 795 534 779Z', '#809797', 0.12),
  )
  content += group(
    'rock-shelf',
    wash('M179 806Q366 758 526 768L590 813Q431 862 230 866Z', '#9b7954', 0.4) +
      stroke(
        [
          [210, 812],
          [371, 791],
          [510, 800],
          [564, 817],
        ],
        7,
        '#49433c',
        0.42,
        true,
      ),
  )
  content += tree(290, 785, 0.85, ['#a9523d', '#bd8050', '#964b38'], 'maple-left')
  content += tree(405, 775, 0.55, ['#bd8e43', '#ad633d', '#c99a51'], 'maple-small')
  content += ridge(
    'pavilion-island',
    'M777 758L807 727L835 731L862 714L897 729L936 718L968 742L1009 759L984 822L831 838Z',
    [
      [865, 722, 99, -15, 27],
      [936, 727, 91, 20, 22],
    ],
    '#93816a',
    0.85,
  )
  content += group(
    'listening-pavilion',
    shape('M818 703L965 703L977 721L802 721Z', '#8b8170', 0.8) +
      shape('M840 614L848 614L848 704L840 704ZM928 614L936 614L936 704L928 704Z', '#795140') +
      shape('M847 657L931 657L931 668L847 668Z', '#88583d', 0.75) +
      roof(888, 551, 217, 64, '#677171') +
      stroke(
        [
          [812, 727],
          [887, 732],
          [980, 724],
        ],
        6,
        '#49433c',
        0.35,
        true,
      ),
  )
  content += tree(1203, 804, 0.82, ['#ae583b', '#c2934a', '#944638'], 'maple-right')
  content += group(
    'stream',
    repeat(14, (index) => {
      const left = 596 + random() * 260
      const top = 783 + index * 8
      return stroke(
        [
          [left, top],
          [left + 20 + random() * 25, top - 2],
          [left + 56 + random() * 58, top + 1],
        ],
        1.5 + random() * 2,
        '#728284',
        0.12 + random() * 0.15,
        true,
      )
    }) +
      repeat(14, () => ellipse(470 + random() * 280, 788 + random() * 74, 3, 1.5, '#ac573c', 0.6)),
  )
  return { ...paint, content }
}

function palaceStudy() {
  const paint = painter(9462, { ink: '#49382f', light: '#e4bd68' })
  const { group, shape, wash, stroke, ridge, tree, roof, ellipse, random } = paint
  let content = ridge(
    'palace-distant-hills',
    'M172 595L266 447L333 469L433 320L475 371L544 334L613 446L693 414L795 576L864 606L938 484L1000 507L1096 360L1152 398L1237 506L1384 651L1375 768L178 755Z',
    [
      [433, 332, 297, -35, 56],
      [1095, 373, 258, 50, 44],
    ],
    '#7d8489',
    0.24,
  )
  content += group(
    'side-walls',
    shape('M214 586L606 584L606 747L214 747Z', '#ad654d', 0.88, 'filter="url(#edge)"') +
      shape('M1033 584L1372 588L1372 747L1033 747Z', '#a35e48', 0.88, 'filter="url(#edge)"') +
      stroke(
        [
          [211, 585],
          [415, 585],
          [607, 584],
        ],
        17,
        '#6c7065',
        0.9,
      ) +
      stroke(
        [
          [1030, 583],
          [1205, 585],
          [1378, 589],
        ],
        17,
        '#6c7065',
        0.9,
      ),
  )
  content += group(
    'terraces',
    shape('M527 725L1139 725L1207 825L456 825Z', '#b7a285', 0.95, 'filter="url(#edge)"') +
      shape('M456 824L1207 824L1207 844L456 844Z', '#847762', 0.85) +
      shape('M742 733L919 733L1007 865L647 865Z', '#d0bfa0', 1, 'filter="url(#edge)"') +
      repeat(9, (index) => {
        const fraction = index / 9
        return stroke(
          [
            [739 - fraction * 87, 744 + fraction * 119],
            [831, 747 + fraction * 119],
            [924 + fraction * 79, 744 + fraction * 119],
          ],
          2.7,
          '#82705a',
          0.42,
          true,
        )
      }),
  )
  content += group(
    'gate-body',
    shape('M599 456L1064 456L1064 733L599 733Z', '#b05c43', 1, 'filter="url(#edge)"') +
      wash('M918 457L1063 459L1063 733L986 733Z', '#744333', 0.52) +
      shape('M739 570Q741 532 791 524L862 524Q911 532 916 570L916 733L739 733Z', '#47352d') +
      shape('M754 576Q760 544 798 540L855 540Q894 546 901 576L901 733L754 733Z', '#783d32') +
      shape('M826 543L831 543L831 734L826 734Z', '#332e2a', 0.7) +
      repeat(7, (row) =>
        repeat(6, (column) => ellipse(771 + column * 23, 580 + row * 20, 2.7, 3, '#c5a25a', 0.75)),
      ) +
      repeat(6, (index) =>
        shape(
          `M${622 + index * 82} 473L${634 + index * 82} 473L${634 + index * 82} 731L${622 + index * 82} 731Z`,
          '#87402e',
          0.75,
        ),
      ),
  )
  content += group(
    'upper-storey',
    shape('M654 345L1007 345L1007 475L654 475Z', '#ad6042', 1, 'filter="url(#edge)"') +
      shape('M683 381L977 381L977 436L683 436Z', '#334e55', 0.92) +
      repeat(10, (index) =>
        shape(
          `M${690 + index * 31} 378L${697 + index * 31} 378L${697 + index * 31} 440L${690 + index * 31} 440Z`,
          '#b49c62',
        ),
      ) +
      shape('M669 439L993 439L993 463L669 463Z', '#51716a') +
      stroke(
        [
          [670, 441],
          [831, 446],
          [995, 441],
        ],
        3,
        '#d5ac58',
        0.85,
      ),
  )
  content += group(
    'golden-roofs',
    roof(831, 207, 543, 143, 'url(#gold)') +
      roof(831, 406, 687, 91, 'url(#gold)') +
      stroke(
        [
          [771, 212],
          [827, 206],
          [882, 212],
        ],
        8,
        '#8d6733',
        0.85,
      ) +
      shape('M826 208L823 191L831 182L838 192L835 209Z', '#aa803d', 0.9),
  )
  content += group(
    'brackets',
    repeat(13, (index) => {
      const left = 573 + index * 43
      return (
        stroke(
          [
            [left - 9, 508],
            [left, 515],
            [left + 10, 507],
          ],
          7,
          '#5b6b5c',
          0.9,
        ) + shape(`M${left - 3} 512L${left + 4} 512L${left + 4} 530L${left - 3} 530Z`, '#a97941')
      )
    }),
  )
  content += group(
    'wall-pigment',
    '<clipPath id="wall-texture-clip"><path d="M214 606L590 606L590 733L214 733ZM1070 606L1372 606L1372 736L1070 736ZM603 537L732 537L732 726L603 726ZM923 537L1060 537L1060 726L923 726Z"/></clipPath><g clip-path="url(#wall-texture-clip)">' +
      repeat(180, () => {
        const left = 210 + random() * 1170
        const top = 535 + random() * 205
        return stroke(
          [
            [left, top],
            [left + 5, top + 11],
            [left + 1 + random() * 16, top + 17 + random() * 26],
          ],
          9 + random() * 25,
          random() > 0.45 ? '#dca47b' : '#6c3f32',
          0.03 + random() * 0.07,
          true,
        )
      }) +
      wash('M214 667Q480 611 731 692L732 731L214 734Z', '#5f5140', 0.12) +
      wash('M922 674Q1125 708 1371 660L1371 735L922 730Z', '#6c4636', 0.2) +
      '</g>',
  )
  content += group(
    'forecourt-washes',
    wash('M246 854Q597 804 694 875Q968 825 1290 855L1349 924L234 930Z', '#aa8860', 0.11) +
      repeat(13, () => {
        const horizontal = 310 + random() * 1000
        const vertical = 850 + random() * 48
        return stroke(
          [
            [horizontal, vertical],
            [horizontal + 34, vertical - 2],
            [horizontal + 76, vertical],
          ],
          2.5,
          '#79644d',
          0.2,
          true,
        )
      }),
  )
  content += tree(291, 804, 1.1, ['#637462', '#647259', '#8b8858'], 'courtyard-tree-left')
  content += tree(1306, 800, 0.75, ['#9e653e', '#bb8a4a', '#867b50'], 'courtyard-tree-right')
  return { ...paint, content }
}

function porcelainStudy() {
  const paint = painter(6534, { ink: '#3d4853', light: '#b6c7c6' })
  const { group, shape, wash, stroke, ellipse, random } = paint
  const vase =
    'M697 452Q708 473 715 510L709 562Q699 597 666 629Q627 670 632 734Q631 777 670 816Q714 850 811 848Q897 849 934 814Q975 774 966 719Q962 667 925 629Q893 597 885 562L880 511Q884 478 896 452Z'
  let content = group(
    'table-impression',
    wash('M277 832Q663 786 1256 829Q1349 850 1307 898Q863 922 309 889Z', '#97795d', 0.13) +
      stroke(
        [
          [300, 862],
          [671, 874],
          [1115, 861],
          [1308, 866],
        ],
        6,
        '#846a54',
        0.2,
        true,
      ),
  )
  content += group(
    'scroll',
    shape(
      'M994 744Q1102 724 1243 751L1213 845Q1101 821 988 841Z',
      '#e9d4aa',
      0.98,
      'filter="url(#edge)"',
    ) +
      shape('M1200 744Q1239 727 1259 755L1232 842Q1212 859 1193 836Z', '#bc986c', 0.9) +
      ellipse(1212, 838, 20, 9, '#e1c49b', 1, 'transform="rotate(18 1212 838)"') +
      stroke(
        [
          [1202, 839],
          [1211, 832],
          [1225, 837],
        ],
        4,
        '#80654d',
        0.6,
      ) +
      repeat(15, (index) => {
        const horizontal = 1020 + index * 10
        return stroke(
          [
            [horizontal, 764 + random() * 7],
            [horizontal - 2, 790 + random() * 9],
            [horizontal - 8, 814],
          ],
          2 + random() * 2,
          '#5f5b50',
          0.18,
          true,
        )
      }),
  )
  content += group(
    'flower-stems',
    stroke(
      [
        [794, 493],
        [813, 391],
        [874, 297],
        [905, 225],
      ],
      8,
      '#696247',
      0.85,
    ) +
      stroke(
        [
          [806, 465],
          [757, 368],
          [661, 321],
          [609, 253],
        ],
        7,
        '#7c694c',
        0.85,
      ) +
      stroke(
        [
          [814, 446],
          [898, 359],
          [993, 332],
        ],
        6,
        '#73724d',
        0.8,
      ) +
      stroke(
        [
          [792, 486],
          [778, 311],
          [803, 206],
        ],
        5,
        '#6e734f',
        0.8,
      ),
  )
  const leaves = [
    [786, 409, -63, -48],
    [842, 352, 68, -20],
    [866, 309, -51, -54],
    [727, 356, 2, -64],
    [754, 376, -79, 10],
    [931, 354, 26, 49],
    [790, 292, 48, -35],
    [783, 328, -43, -41],
  ]
  content += group(
    'leaves',
    leaves
      .map(([left, top, driftX, driftY]) =>
        shape(
          `M${left} ${top}Q${left + driftX * 0.8 - driftY * 0.3} ${top + driftY * 0.5 + driftX * 0.25} ${left + driftX} ${top + driftY}Q${left + driftX * 0.45 + driftY * 0.2} ${top + driftY * 0.7 - driftX * 0.25} ${left} ${top}Z`,
          '#72816b',
          0.65,
          'filter="url(#edge)"',
        ),
      )
      .join(''),
  )
  function flower(horizontal, vertical, size, tint, identity) {
    let petals = ''
    for (let ring = 0; ring < 3; ring++) {
      const count = 13 - ring * 2
      for (let petal = 0; petal < count; petal++) {
        const angle = (petal / count) * Math.PI * 2 + ring * 0.6 + (random() - 0.5) * 0.18
        const radius = size * (0.58 - ring * 0.17)
        const left = horizontal + Math.cos(angle) * radius
        const top = vertical + Math.sin(angle) * radius * 0.65
        const breadth = size * (0.43 - ring * 0.07) * (0.88 + random() * 0.22)
        const petalColor = ring === 2 ? '#dfbfc1' : tint
        petals += shape(
          `M${left - breadth * 0.55} ${top + breadth * 0.38}Q${left - breadth * 1.1} ${top - breadth * 0.12} ${left - breadth * 0.58} ${top - breadth * 0.47}Q${left - breadth * 0.27} ${top - breadth * 0.77} ${left} ${top - breadth * 0.51}Q${left + breadth * 0.45} ${top - breadth * 0.84} ${left + breadth * 0.72} ${top - breadth * 0.25}Q${left + breadth * 1.08} ${top + breadth * 0.26} ${left + breadth * 0.3} ${top + breadth * 0.43}Z`,
          petalColor,
          0.7 + ring * 0.08,
          `transform="rotate(${number((angle * 180) / Math.PI)} ${number(left)} ${number(top)})" filter="url(#wash)"`,
        )
        petals += stroke(
          [
            [left, top + breadth * 0.3],
            [left + Math.cos(angle) * 8, top - breadth * 0.4],
          ],
          1.8,
          '#9b7378',
          0.28,
        )
      }
    }
    petals += repeat(17, () =>
      ellipse(
        horizontal + (random() - 0.5) * size * 0.29,
        vertical + (random() - 0.5) * size * 0.19,
        1.8,
        2.4,
        '#bd974e',
        0.9,
      ),
    )
    return group(identity, petals)
  }
  content += flower(901, 231, 75, '#b8899a', 'mauve-peony')
  content += flower(617, 259, 57, '#cfadab', 'blush-peony')
  content += flower(992, 333, 46, '#c5979f', 'side-peony')
  content += flower(803, 207, 30, '#ccb3b8', 'peony-bud')
  content +=
    '<g id="porcelain-body">' +
    shape(vase, 'url(#ceramic)', 1, 'filter="url(#edge)"') +
    `<clipPath id="vase-clip"><path d="${vase}"/></clipPath>` +
    '<g clip-path="url(#vase-clip)">' +
    wash('M637 646Q674 681 680 766Q697 820 751 856L631 862Z', '#447095', 0.21) +
    wash(
      'M891 514Q873 601 938 656L977 784L929 837Q948 751 906 674Q846 607 860 513Z',
      '#3c698d',
      0.18,
    ) +
    stroke(
      [
        [713, 546],
        [796, 556],
        [883, 546],
      ],
      8,
      '#315a85',
      0.86,
    ) +
    stroke(
      [
        [703, 568],
        [795, 579],
        [892, 569],
      ],
      3,
      '#315a85',
      0.8,
    ) +
    stroke(
      [
        [660, 806],
        [794, 824],
        [943, 804],
      ],
      6,
      '#315a85',
      0.8,
    )
  let pattern = ''
  pattern += stroke(
    [
      [670, 747],
      [727, 708],
      [790, 732],
      [858, 684],
      [942, 720],
    ],
    6,
    '#315b86',
    0.8,
  )
  ;[
    [709, 717, -34, -37],
    [739, 713, 18, 41],
    [779, 730, -22, 37],
    [827, 709, -20, -45],
    [873, 688, 24, -41],
    [899, 699, 13, 40],
  ].forEach(([left, top, driftX, driftY]) => {
    pattern += shape(
      `M${left} ${top}Q${left + driftX * 1.2} ${top + driftY * 0.4} ${left + driftX} ${top + driftY}Q${left + driftX * 0.1} ${top + driftY * 0.75} ${left} ${top}Z`,
      '#315b86',
      0.78,
      'filter="url(#edge)"',
    )
  })
  ;[
    [737, 675],
    [841, 758],
    [906, 656],
  ].forEach(([left, top]) => {
    for (let petal = 0; petal < 5; petal++) {
      const angle = (petal * Math.PI * 2) / 5
      pattern += ellipse(
        left + Math.cos(angle) * 15,
        top + Math.sin(angle) * 15,
        11,
        7,
        '#416c96',
        0.8,
        `transform="rotate(${number((angle * 180) / Math.PI)} ${number(left + Math.cos(angle) * 15)} ${number(top + Math.sin(angle) * 15)})" filter="url(#edge)"`,
      )
    }
    pattern += ellipse(left, top, 4, 4, '#274769', 0.9)
  })
  content += pattern + '</g></g>'
  content += group(
    'vase-mouth',
    ellipse(797, 452, 100, 14, '#5c7d91', 0.95, 'filter="url(#edge)"') +
      ellipse(797, 450, 86, 8, '#7e8d8c', 1) +
      stroke(
        [
          [698, 453],
          [795, 463],
          [895, 453],
        ],
        4,
        '#e8e5d2',
        0.9,
      ),
  )
  content += group(
    'inkstone-and-brush',
    shape(
      'M354 796Q413 774 496 795L516 825Q441 852 349 827Z',
      '#465054',
      0.9,
      'filter="url(#edge)"',
    ) +
      ellipse(428, 812, 58, 13, '#2f373d', 0.85) +
      stroke(
        [
          [410, 837],
          [491, 791],
          [611, 727],
        ],
        12,
        '#a78755',
        0.95,
      ) +
      shape(
        'M413 833Q401 830 388 840Q375 857 359 862Q391 865 412 846Z',
        '#393c3b',
        0.93,
        'filter="url(#edge)"',
      ) +
      stroke(
        [
          [458, 810],
          [511, 779],
          [588, 738],
        ],
        2.5,
        '#d2b881',
        0.8,
      ),
  )
  return { ...paint, content }
}

function desertStudy() {
  const paint = painter(8137, { ink: '#594735', light: '#dbb77b' })
  const { group, shape, wash, stroke, ridge, ellipse } = paint
  let content = group(
    'sun',
    ellipse(1154, 280, 69, 69, '#bb7950', 0.36, 'filter="url(#wash)"') +
      ellipse(1150, 276, 57, 57, '#cb9460', 0.28, 'filter="url(#wash)"'),
  )
  content += ridge(
    'desert-distant-range',
    'M206 598L305 485L353 504L408 434L453 472L506 394L547 428L610 511L681 532L765 483L817 520L902 446L950 480L1029 438L1086 506L1167 521L1269 459L1402 613L1379 762L209 748Z',
    [
      [506, 408, 235, -38, 38],
      [903, 460, 196, 35, 32],
    ],
    '#6a8391',
    0.33,
  )
  content += group(
    'dunes',
    wash(
      'M158 734Q450 544 665 600Q853 668 1084 564Q1260 504 1432 653L1430 920L170 930Z',
      'url(#sand)',
      0.9,
    ) +
      wash('M180 833Q419 700 725 737Q1063 777 1392 664L1414 938L180 938Z', '#be9256', 0.17) +
      wash('M182 739Q411 587 659 602Q449 635 329 754Z', '#deb875', 0.28) +
      stroke(
        [
          [209, 735],
          [408, 637],
          [578, 605],
          [682, 609],
        ],
        3,
        '#a87b49',
        0.27,
        true,
      ) +
      stroke(
        [
          [904, 626],
          [1071, 575],
          [1249, 568],
        ],
        2.8,
        '#9e764d',
        0.22,
        true,
      ),
  )
  function camel(horizontal, vertical, scale, tint, identity, cargo) {
    let animal = shape(
      'M-63 -53Q-87 -61 -94 -48L-105 -35Q-91 -35 -86 -42L-72 -36L-66 -15L-67 28L-58 29L-52 -7L-28 -4L-26 34L-17 34L-16 -4L16 -4L27 28L36 28L31 -15L43 -29L56 -77L70 -82L78 -78L88 -83L83 -93L65 -99L53 -92L39 -62L27 -56Q19 -83 7 -86Q-7 -86 -12 -64Q-21 -57 -30 -69Q-46 -88 -55 -70Z',
      tint,
      0.96,
      'filter="url(#edge)"',
    )
    animal += wash('M-66 -29Q-24 -13 31 -27L25 -8L-55 -4Z', '#493c30', 0.4)
    animal += shape('M57 -91L56 -108L65 -98ZM70 -96L76 -105L77 -92Z', tint)
    animal += ellipse(79, -91, 1.7, 1.5, '#302f2b', 0.9)
    animal += shape('M-55 -62L21 -61L28 -29L-61 -30Z', cargo, 0.93, 'filter="url(#edge)"')
    animal += shape(
      'M-54 -52L-28 -54L-28 -20L-55 -21ZM-17 -53L14 -50L18 -18L-16 -20Z',
      '#af9775',
      0.95,
      'filter="url(#edge)"',
    )
    animal += stroke(
      [
        [-55, -43],
        [-24, -38],
        [20, -42],
      ],
      3,
      '#675341',
      0.8,
    )
    animal += stroke(
      [
        [-36, -55],
        [-37, -40],
        [-38, -20],
      ],
      2,
      '#6e5439',
      0.75,
    )
    animal += stroke(
      [
        [-5, -54],
        [-3, -37],
        [-1, -19],
      ],
      2,
      '#6e5439',
      0.75,
    )
    return group(
      identity,
      animal,
      `transform="translate(${horizontal} ${vertical}) scale(${scale})"`,
    )
  }
  content += group(
    'caravan-shadows',
    wash('M355 760Q467 738 587 754L642 775Q486 789 360 777Z', '#71583d', 0.13) +
      wash('M664 794Q817 777 952 799L999 817Q821 830 668 814Z', '#71583d', 0.16) +
      wash('M1018 816Q1150 807 1264 834L1305 850Q1122 851 1018 838Z', '#71583d', 0.17),
  )
  content += camel(472, 727, 0.74, '#9a7753', 'distant-camel', '#567c8c')
  content += camel(758, 766, 0.94, '#876347', 'middle-camel', '#9c5150')
  content += camel(1097, 803, 1.18, '#88613f', 'near-camel', '#49758b')
  content += group(
    'leading-traveller',
    ellipse(1315, 754, 10, 12, '#634d3b', 0.95, 'filter="url(#edge)"') +
      shape(
        'M1305 764Q1321 755 1329 770L1343 808Q1327 816 1306 804L1298 784Z',
        '#5a7382',
        0.95,
        'filter="url(#edge)"',
      ) +
      stroke(
        [
          [1310, 806],
          [1307, 823],
          [1295, 838],
        ],
        6,
        '#584b3e',
        0.9,
      ) +
      stroke(
        [
          [1327, 810],
          [1338, 823],
          [1344, 836],
        ],
        6,
        '#584b3e',
        0.9,
      ) +
      stroke(
        [
          [1316, 778],
          [1290, 789],
          [1263, 791],
        ],
        6,
        '#536c79',
        0.95,
      ) +
      stroke(
        [
          [1189, 695],
          [1200, 739],
          [1265, 790],
        ],
        1.7,
        '#675941',
        0.75,
      ),
  )
  content += group(
    'caravan-reins',
    stroke(
      [
        [529, 659],
        [587, 704],
        [697, 729],
      ],
      1.8,
      '#756042',
      0.6,
    ) +
      stroke(
        [
          [833, 678],
          [893, 751],
          [1025, 766],
        ],
        1.8,
        '#756042',
        0.65,
      ),
  )
  content += group(
    'sparse-grasses',
    stroke(
      [
        [277, 862],
        [263, 844],
        [242, 838],
      ],
      4,
      '#8b784f',
      0.45,
      true,
    ) +
      stroke(
        [
          [278, 862],
          [283, 835],
          [298, 823],
        ],
        4,
        '#8b784f',
        0.45,
        true,
      ) +
      stroke(
        [
          [280, 864],
          [302, 850],
          [324, 850],
        ],
        3,
        '#8b784f',
        0.4,
        true,
      ),
  )
  return { ...paint, content }
}

const studies = [
  {
    id: 'autumn-falls',
    name: '丹枫听瀑',
    note: '赭石山骨 · 胭脂秋林 · 青灰飞瀑',
    seed: 7251,
    draw: autumnStudy,
  },
  {
    id: 'vermilion-gate',
    name: '朱门金阙',
    note: '朱红墙身 · 金黄屋面 · 石青彩梁',
    seed: 9462,
    draw: palaceStudy,
  },
  {
    id: 'porcelain-peonies',
    name: '青花案雅',
    note: '钴蓝瓷器 · 藕紫牡丹 · 暖木书卷',
    seed: 6534,
    draw: porcelainStudy,
  },
  {
    id: 'desert-caravan',
    name: '沙海行旅',
    note: '沙金大漠 · 驼棕商队 · 石蓝远山',
    seed: 8137,
    draw: desertStudy,
  },
]

for (const study of studies) {
  const painting = study.draw()
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="${study.id}-title ${study.id}-description"><title id="${study.id}-title">${study.name}</title><desc id="${study.id}-description">${study.note}。原创彩墨意象，非历史实物复原。透明背景。</desc>${painting.definitions}${painting.group('artwork', painting.content, 'mask="url(#fade)"')}</svg>`
  const prefixed = source
    .replace(
      /id="(?!autumn-falls-title|autumn-falls-description|vermilion-gate-title|vermilion-gate-description|porcelain-peonies-title|porcelain-peonies-description|desert-caravan-title|desert-caravan-description)([^"]+)"/g,
      `id="${study.id}-$1"`,
    )
    .replace(/url\(#([^)]+)\)/g, `url(#${study.id}-$1)`)
  writeFileSync(join(inkDirectory, `${study.id}.svg`), prefixed)
}

writeFileSync(
  join(inkDirectory, 'catalog.json'),
  JSON.stringify(
    {
      version: 1,
      style: 'colored-ink',
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

const gallery = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>随物赋彩 · 彩墨四景</title><style>
*{box-sizing:border-box}body{margin:0;background:#e5d0ac;color:#443b31;font-family:ui-serif,"Songti SC",serif}main{max-width:1440px;padding:52px 42px 64px;margin:auto}header{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:30px}.eyebrow{font:11px/1.5 ui-sans-serif,sans-serif;letter-spacing:.26em;color:#87664c}h1{font-size:38px;letter-spacing:.12em;font-weight:500;margin:10px 0}header p{font-size:14px;color:#786754;line-height:1.8;max-width:500px;margin:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}figure{margin:0;background:#ddc39b;box-shadow:0 8px 30px #5b402810;border:1px solid #98754c25}figure>a{display:block;line-height:0;background:radial-gradient(ellipse at 50% 40%,#ead6b5 0%,#dfc69f 80%);overflow:hidden}figure img{width:100%;height:auto;display:block}figcaption{display:flex;justify-content:space-between;align-items:center;padding:17px 23px 20px;border-top:1px solid #98754c20;gap:12px}h2{font-size:22px;font-weight:500;letter-spacing:.12em;margin:0 0 6px}figcaption p{font-size:12px;letter-spacing:.04em;color:#80684e;margin:0}nav{display:flex;gap:12px;font:12px ui-sans-serif,sans-serif}a{color:inherit;text-decoration:none}nav a{border-bottom:1px solid #8b7057;padding-bottom:3px}a:focus-visible{outline:2px solid #8f4c39;outline-offset:4px}footer{font-size:12px;color:#8a745d;margin-top:26px;line-height:1.8}@media(max-width:740px){main{padding:28px 18px}header{display:block}header p{margin-top:15px}.grid{grid-template-columns:1fr}h1{font-size:30px}figcaption{padding:15px}}
</style></head><body><main><header><div><div class="eyebrow">CHINESE COLORED INK · STUDIES 01—04</div><h1>随物赋彩 · 彩墨四景</h1></div><p>笔墨与留白定调，颜色随物、随境。<br>点击画面查看原图；SVG / PNG 均为 1600 × 1000 透明素材。</p></header><div class="grid">${studies.map((study) => `<figure><a href="ink-wash/${study.id}.svg" target="_blank" aria-label="查看${study.name}原图"><img src="ink-wash/${study.id}.png" alt="${study.name}，${study.note}"></a><figcaption><div><h2>${study.name}</h2><p>${study.note}</p></div><nav aria-label="下载${study.name}"><a href="ink-wash/${study.id}.svg" download>SVG</a><a href="ink-wash/${study.id}.png" download>PNG</a></nav></figcaption></figure>`).join('')}</div><footer>依照 chinese-ink-elements 绘画规范创作 · 牛皮纸仅为展示底色，不写入透明素材。<br>本组为原创古风意象，不对应具体历史建筑、传世器物或某一朝代的形制复原。</footer></main></body></html>`
writeFileSync(join(destination, 'index.html'), gallery)
console.log(`Generated ${studies.length} colored ink studies in ${destination}`)
syncInkCollections()
