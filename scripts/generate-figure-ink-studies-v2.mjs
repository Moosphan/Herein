import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncInkCollections } from './sync-ink-collections.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const destination = join(root, 'resources/visuals/traditional-culture/figure-studies-v2')
const inkDirectory = join(destination, 'ink-wash')
mkdirSync(inkDirectory, { recursive: true })
const repeat = (count, callback) =>
  Array.from({ length: count }, (_, index) => callback(index)).join('')
const rounded = (value) => Number(value.toFixed(2))

function studio(seed) {
  let state = seed
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
  const shape = (outline, color, opacity = 1, attributes = '') =>
    `<path d="${outline}" fill="${color}" opacity="${opacity}" ${attributes}/>`
  const line = (outline, color = '#514538', width = 1, opacity = 1, attributes = '') =>
    `<path d="${outline}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" ${attributes}/>`
  const ellipse = (horizontal, vertical, radiusX, radiusY, color, opacity = 1, attributes = '') =>
    `<ellipse cx="${rounded(horizontal)}" cy="${rounded(vertical)}" rx="${rounded(radiusX)}" ry="${rounded(radiusY)}" fill="${color}" opacity="${opacity}" ${attributes}/>`
  const group = (identity, content, attributes = '') =>
    `<g id="${identity}" ${attributes}>${content}</g>`
  const wash = (outline, color, opacity = 1) =>
    shape(outline, color, opacity, 'filter="url(#wash)"')
  const shade = (outline, color, opacity = 1) =>
    shape(outline, color, opacity, 'filter="url(#soft)"')

  function brush(outline, color, width, opacity = 1) {
    return line(outline, color, width, opacity, 'filter="url(#dry)"')
  }

  function eye(identity, horizontal, vertical, breadth, looking = 0, serious = true) {
    const upper = serious ? -4.5 : -3.5
    const outline = `M${horizontal} ${vertical}Q${horizontal + breadth * 0.48} ${vertical + upper - 2} ${horizontal + breadth} ${vertical - 1}Q${horizontal + breadth * 0.58} ${vertical + 6} ${horizontal} ${vertical}Z`
    return group(
      identity,
      `<clipPath id="${identity}-clip"><path d="${outline}"/></clipPath>` +
        shape(outline, '#dbccae', 0.8) +
        `<g clip-path="url(#${identity}-clip)">` +
        ellipse(horizontal + breadth * 0.53 + looking, vertical + 0.4, 5.3, 5.7, '#514b3d') +
        ellipse(horizontal + breadth * 0.53 + looking, vertical + 0.2, 2.8, 4.3, '#292e2a') +
        ellipse(
          horizontal + breadth * 0.53 + looking - 1.3,
          vertical - 0.6,
          0.9,
          0.7,
          '#ded7ba',
          0.9,
        ) +
        '</g>' +
        line(
          `M${horizontal} ${vertical}Q${horizontal + breadth * 0.48} ${vertical + upper - 2} ${horizontal + breadth} ${vertical - 1}`,
          '#3c3b31',
          1.9,
          0.95,
        ) +
        line(
          `M${horizontal + 2} ${vertical + 1}Q${horizontal + breadth * 0.52} ${vertical + 6} ${horizontal + breadth - 1} ${vertical}`,
          '#896d53',
          0.9,
          0.65,
        ) +
        line(
          `M${horizontal + 3} ${vertical - 6}Q${horizontal + breadth * 0.52} ${vertical - 11} ${horizontal + breadth - 2} ${vertical - 7}`,
          '#9c7f61',
          0.85,
          0.42,
        ),
    )
  }

  const definitions = `<defs>
    <filter id="edge" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".08 .13" numOctaves="3" seed="19" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="wash" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".023 .038" numOctaves="3" seed="73" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .36 .36 .36 0 .28" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="pigment"/><feDisplacementMap in="pigment" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".65"/></filter>
    <filter id="dry" x="-10%" y="-18%" width="120%" height="136%"><feTurbulence type="fractalNoise" baseFrequency=".28 .58" numOctaves="3" seed="41" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.5 1.5 1.5 0 -1.45" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in"/></filter>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5"/></filter>
    <linearGradient id="skin" x1=".15" y1=".15" x2=".95" y2=".7"><stop stop-color="#cfb38c"/><stop offset=".36" stop-color="#ddc5a1"/><stop offset=".65" stop-color="#ceb08b"/><stop offset="1" stop-color="#a38667"/></linearGradient>
    <linearGradient id="young-skin" x1=".1" y1=".1" x2="1" y2=".8"><stop stop-color="#ceaf87"/><stop offset=".38" stop-color="#e4caa4"/><stop offset=".7" stop-color="#d1b18b"/><stop offset="1" stop-color="#a88c6b"/></linearGradient>
    <linearGradient id="robe" x1=".1" y1="0" x2=".85" y2="1"><stop stop-color="#62645b"/><stop offset=".3" stop-color="#383f3c"/><stop offset=".65" stop-color="#262f2e"/><stop offset="1" stop-color="#4c5249"/></linearGradient>
    <linearGradient id="crimson" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="#a75b48"/><stop offset=".5" stop-color="#7e3f34"/><stop offset="1" stop-color="#4f322d"/></linearGradient>
    <linearGradient id="iron" x1=".1" y1="0" x2=".9" y2=".8"><stop stop-color="#a09c85"/><stop offset=".32" stop-color="#757f73"/><stop offset=".7" stop-color="#4e605b"/><stop offset="1" stop-color="#374a46"/></linearGradient>
    <linearGradient id="chestnut" x1=".2" y1="0" x2=".7" y2="1"><stop stop-color="#b77d55"/><stop offset=".36" stop-color="#a06343"/><stop offset=".72" stop-color="#814a35"/><stop offset="1" stop-color="#573e31"/></linearGradient>
    <radialGradient id="muscle"><stop stop-color="#dcab77" stop-opacity=".5"/><stop offset=".6" stop-color="#c18d5b" stop-opacity=".15"/><stop offset="1" stop-color="#c18d5b" stop-opacity="0"/></radialGradient>
    <linearGradient id="fade-gradient" x1="0" y1="0" x2="0" y2="1000" gradientUnits="userSpaceOnUse"><stop stop-color="white"/><stop offset=".85" stop-color="white"/><stop offset=".99" stop-color="black"/></linearGradient>
    <mask id="fade"><rect width="1600" height="1000" fill="url(#fade-gradient)"/></mask>
  </defs>`
  return { random, shape, line, ellipse, group, wash, shade, brush, eye, definitions }
}

function emperorFace(paint) {
  const { shape, line, ellipse, group, shade, brush, eye, random } = paint
  const contour =
    'M35 27C58 5 136 1 161 29C178 52 176 91 173 124C190 120 196 133 191 153C187 169 179 179 170 181C163 208 152 229 132 241C112 253 88 253 66 238C44 223 31 201 24 178C9 177 1 165 0 148C-2 132 9 126 21 133C16 94 13 51 35 27Z'
  let content =
    shape(contour, 'url(#skin)') +
    `<clipPath id="face-clip"><path d="${contour}"/></clipPath><g clip-path="url(#face-clip)">`
  content += shade(
    'M23 28Q47 33 46 85L36 138Q41 181 61 210L88 244Q49 234 30 196L14 145L16 66Z',
    '#806c56',
    0.37,
  )
  content += shade(
    'M151 35Q157 78 152 109L138 130L145 168Q158 187 143 213L125 240Q158 228 173 191L183 130L174 60Z',
    '#8b745a',
    0.31,
  )
  content += shade('M53 64Q79 47 101 57L111 82L103 99L68 101L42 93Z', '#f1dbb2', 0.33)
  content += shade('M109 111Q118 137 126 157L139 172L122 178L109 168Z', '#8f7255', 0.4)
  content += shade('M101 105Q105 131 103 151L107 163L117 163L113 149L113 107Z', '#f1d9ae', 0.55)
  content += shade('M43 143Q66 126 81 140L91 166L77 181L51 170Z', '#bd8f70', 0.24)
  content += shade('M130 143Q147 139 152 153L141 169L124 171Z', '#e1b38c', 0.28)
  content += shade('M68 191Q103 206 138 189L131 217L101 230L78 216Z', '#e3c7a1', 0.5)
  content += '</g>'
  content += group(
    'eyes-and-brow',
    shape('M38 97Q60 85 83 89L95 94L92 100Q66 92 41 101Z', '#414038', 0.95) +
      shape('M118 94Q137 86 158 90L165 96L158 99Q138 93 120 100Z', '#414038', 0.96) +
      eye('eye-near', 44, 111, 43, 1.4) +
      eye('eye-far', 120, 108, 36, 1.2) +
      line('M44 124Q65 130 85 121', '#8b735a', 1, 0.57) +
      line('M123 121Q141 126 154 117', '#8b735a', 0.85, 0.55) +
      line('M93 88Q95 98 92 104M111 88Q108 99 111 104', '#8d7459', 0.9, 0.62),
  )
  content += group(
    'nose-and-mouth',
    line('M103 110Q99 134 98 149Q95 159 101 164', '#9a7d5c', 1.3, 0.65) +
      line('M117 141L124 159Q132 163 131 170Q123 176 116 172', '#806449', 1.1, 0.84) +
      shape('M97 170Q101 166 108 170L107 173Q101 172 97 174Z', '#695640', 0.78) +
      shape('M122 170Q129 165 134 169Q134 174 126 175Z', '#695640', 0.78) +
      line('M92 179Q87 184 85 192M138 180Q145 185 146 194', '#9a795b', 1, 0.6) +
      shape('M81 194Q96 189 108 193Q118 190 136 193L142 196Q112 200 81 197Z', '#825b47', 0.64) +
      line('M84 195Q101 193 112 195Q126 193 139 195', '#594a38', 1, 0.9) +
      shade('M92 200Q112 204 130 199L125 207L103 209Z', '#b99170', 0.52) +
      line('M99 214Q112 218 124 213', '#a08465', 1, 0.55),
  )
  content += group(
    'ears',
    line(
      'M12 140Q21 135 23 150L17 162Q13 163 12 154M179 135Q187 132 185 146L177 159',
      '#947759',
      1.4,
      0.8,
    ),
  )
  content += group(
    'mature-facial-hair',
    shape('M106 181Q92 178 76 184L62 195Q80 190 95 189L105 187Z', '#48473c', 0.9) +
      shape('M112 181Q125 177 141 181L155 191Q141 188 126 187L114 188Z', '#48473c', 0.92) +
      shape(
        'M29 156Q33 190 53 207L68 216Q77 226 93 231L109 228L126 230Q146 219 162 201L168 181Q167 222 145 248L123 273L114 266L102 281L91 270L79 271Q53 246 43 220L33 199Z',
        '#505247',
        0.9,
        'filter="url(#wash)"',
      ) +
      repeat(43, (index) => {
        const horizontal = 38 + index * 2.8
        const vertical = 202 + Math.sin((index / 43) * Math.PI) * 26
        const target = 104 + (horizontal - 104) * 0.46
        return line(
          `M${horizontal} ${vertical}Q${horizontal + (target - horizontal) * 0.5} ${vertical + 19} ${target} ${254 + random() * 16}`,
          index % 4 ? '#2f3933' : '#c5bea1',
          0.65 + random() * 0.6,
          0.2 + random() * 0.25,
        )
      }) +
      repeat(17, (index) =>
        brush(
          `M${80 + index * 3} ${184 + Math.sin(index) * 2}Q105 181 ${66 + index * 5} ${193 + random() * 4}`,
          '#3b4037',
          0.8,
          0.45,
        ),
      ),
  )
  content += group(
    'restrained-age-lines',
    line('M54 54Q90 49 122 51M55 64Q89 61 130 64', '#9e8567', 0.75, 0.35) +
      line('M43 111L35 109M155 107L163 103M48 117L38 120M152 114L160 117', '#9c8164', 0.7, 0.52),
  )
  return group('emperor-face', content, 'transform="translate(709 214) scale(1.05)"')
}

function emperorStudy() {
  const paint = studio(22031)
  const { shape, line, group, wash, shade, ellipse, brush, random } = paint
  let content = group(
    'imperial-atmosphere',
    shade('M421 892Q774 857 1180 894L1210 940Q789 973 394 943Z', '#79684e', 0.1),
  )
  const robe =
    'M691 477Q643 468 600 493C540 526 511 592 497 659L449 824Q468 864 516 874L564 924Q805 964 1137 918L1181 875Q1165 791 1129 733L1092 620Q1077 545 1019 509Q964 472 919 478Z'
  content += group(
    'ceremonial-robes',
    shape(robe, 'url(#robe)', 1, 'filter="url(#edge)"') +
      `<clipPath id="robe-clip"><path d="${robe}"/></clipPath><g clip-path="url(#robe-clip)">` +
      shade(
        'M556 534Q630 490 658 562Q669 637 604 724L545 852L482 851Q521 731 526 649Z',
        '#8c8b75',
        0.23,
      ) +
      wash('M644 535Q691 634 680 739L691 932L622 936Q649 786 610 696Z', '#171f21', 0.45) +
      shade(
        'M934 510Q999 540 1041 630L1109 859L1064 915L990 909Q1036 786 968 693Z',
        '#92917b',
        0.18,
      ) +
      wash('M1009 544Q1083 629 1088 727L1165 866L1123 915Q1076 799 1028 730Z', '#141f20', 0.55) +
      wash('M741 615Q788 674 789 740L800 946L741 946Q749 801 710 724Z', '#171f20', 0.39) +
      shade('M855 645Q888 786 876 943L837 945Q861 812 826 699Z', '#a5a18a', 0.12) +
      repeat(65, () => {
        const horizontal = 510 + random() * 580
        const vertical = 590 + random() * 320
        return brush(
          `M${horizontal} ${vertical}q${random() * 12 - 6} 23 ${random() * 20 - 10} ${33 + random() * 48}`,
          '#b3ae8f',
          2 + random() * 5,
          0.035 + random() * 0.04,
        )
      }) +
      '</g>',
  )
  content += group(
    'neck',
    shape('M758 430L754 498L809 544L880 490L875 424Z', 'url(#skin)') +
      shade('M765 442L866 440L866 479Q819 500 768 464Z', '#6e6251', 0.48),
  )
  content += group(
    'crossed-collar',
    shape(
      'M703 470L742 475L813 547L894 470L926 485L842 609L808 618L675 493Z',
      '#7c4133',
      1,
      'filter="url(#edge)"',
    ) +
      shape(
        'M703 472L810 582L912 480L924 491L815 614L691 484Z',
        '#b29b6b',
        0.92,
        'filter="url(#edge)"',
      ) +
      shape('M697 487L809 597L818 614L805 615L686 496Z', '#d3bb84', 0.6) +
      line('M911 490L815 600L696 480', '#dfc58d', 2.2, 0.68),
  )
  content += emperorFace(paint)
  content += group(
    'imperial-crown',
    shape(
      'M725 244L727 191Q731 161 758 151L857 151Q884 163 887 193L895 247Q813 268 725 244Z',
      '#303a34',
      1,
      'filter="url(#edge)"',
    ) +
      shade('M738 179Q768 160 792 164L790 247L731 241Z', '#828778', 0.28) +
      shape('M672 156L884 125L952 160L737 196Z', '#3e443b', 1, 'filter="url(#edge)"') +
      shape('M672 156L737 187L952 152L952 164L735 201L672 170Z', '#242e2d') +
      line('M678 157L736 185L946 152', '#b49b62', 2.5, 0.8) +
      line('M736 193L943 159', '#866d46', 2, 0.7) +
      shape('M728 239Q808 259 894 240L894 252Q812 275 726 252Z', '#7e6441', 0.98) +
      line('M735 243Q811 261 886 245', '#c9ae72', 2, 0.9),
  )
  content += group(
    'crown-pendants',
    repeat(4, (index) => {
      const horizontal = 687 + index * 15
      const top = 168 + index * 7
      const bottom = 323 + index * 17
      return (
        line(`M${horizontal} ${top}L${horizontal - 4} ${bottom}`, '#98855b', 0.9, 0.85) +
        repeat(8, (bead) =>
          ellipse(
            horizontal - (bead + 1) * 0.48,
            top + ((bottom - top) / 8) * (bead + 1),
            2.2,
            2.7,
            bead % 3 ? '#a49b75' : '#5b7b6d',
            0.93,
          ),
        )
      )
    }) +
      repeat(3, (index) => {
        const horizontal = 909 + index * 14
        const top = 171 - index * 3
        return (
          line(`M${horizontal} ${top}L${horizontal + 1} ${340 - index * 12}`, '#98855b', 0.9, 0.8) +
          repeat(8, (bead) =>
            ellipse(
              horizontal,
              top + ((166 - index * 9) / 8) * (bead + 1),
              2.1,
              2.6,
              bead % 3 ? '#a49b75' : '#5b7b6d',
              0.9,
            ),
          )
        )
      }),
  )
  content += group(
    'folded-sleeves',
    shape(
      'M550 635Q581 693 656 721L786 735L776 820Q613 838 509 799L493 753Z',
      'url(#robe)',
      1,
      'filter="url(#edge)"',
    ) +
      shape(
        'M1055 637Q1030 694 965 723L835 747L856 819Q1023 832 1123 792L1144 750Z',
        'url(#robe)',
        1,
        'filter="url(#edge)"',
      ) +
      wash('M536 726Q620 785 765 771L771 808Q610 828 516 789Z', '#172626', 0.6) +
      wash('M858 778Q1022 778 1106 721L1128 777Q1028 823 859 813Z', '#717966', 0.22) +
      shape('M762 727Q787 727 810 747L804 812L773 822Z', '#944a37', 1, 'filter="url(#edge)"') +
      shape('M841 735L871 727L885 813L854 817Z', '#944a37', 1, 'filter="url(#edge)"') +
      line('M778 734L788 814M856 737L868 811', '#baa16b', 5, 0.8) +
      brush(
        'M545 677Q558 715 611 743M522 761Q618 803 744 795M1080 696Q1026 748 926 762M889 801Q1003 812 1089 779',
        '#adb19a',
        3.3,
        0.21,
      ),
  )
  content += group(
    'composed-hands',
    shape(
      'M798 748Q811 739 823 744L847 749Q855 753 853 761L842 764L837 785L822 799L804 795L794 779Z',
      'url(#skin)',
      1,
    ) +
      shape(
        'M819 766Q826 754 837 754L854 759Q860 763 855 769L840 770L837 784L829 791L815 787L810 778Z',
        'url(#skin)',
        1,
      ) +
      line(
        'M816 752Q827 754 835 760M815 765Q824 767 827 776M830 775L838 774M827 782L835 779',
        '#9a7b5c',
        1.1,
        0.7,
      ),
  )
  content += group(
    'restrained-silk-motif',
    repeat(5, (index) => {
      const horizontal = 602 + index * 82
      return line(`M${horizontal} 877q10 -11 21 0q9 11 20 0`, '#a28d5e', 1.2, 0.17)
    }),
  )
  return { ...paint, content }
}

function youngFace(paint) {
  const { shape, line, group, shade, ellipse, eye } = paint
  const contour =
    'M41 24Q83 -4 130 17Q157 28 169 58L169 92Q167 119 171 141Q175 164 168 186Q164 210 141 226L118 240Q100 243 79 227Q48 208 37 180L24 153Q5 153 2 133Q-1 117 10 114L24 120L26 81Q25 45 41 24Z'
  let content =
    shape(contour, 'url(#young-skin)') +
    `<clipPath id="young-face-clip"><path d="${contour}"/></clipPath><g clip-path="url(#young-face-clip)">`
  content += shade(
    'M30 38Q54 24 51 70L44 109L43 150Q51 190 78 216L111 238Q77 235 48 205L27 168L20 104Z',
    '#7a6b54',
    0.32,
  )
  content += shade(
    'M140 28Q166 55 157 84L145 108L151 137L157 157L143 172L141 185L158 196Q173 178 169 160L167 133L175 70Z',
    '#997b5c',
    0.33,
  )
  content += shade('M66 39Q91 28 120 39L127 69L103 87L64 82Z', '#f0d9ae', 0.27)
  content += shade('M58 128Q80 116 98 134L103 151L88 170L63 157Z', '#b58b6b', 0.23)
  content += shade('M113 110L127 126L128 145L141 155L128 159L115 147Z', '#8c7255', 0.32)
  content += shade('M109 100L117 101L115 140L122 151L116 155L107 145Z', '#f1d9ac', 0.48)
  content += shade('M85 199Q114 212 143 191L138 215L120 229L103 229Z', '#e8cda6', 0.36) + '</g>'
  content += group(
    'focused-young-expression',
    shape('M47 92Q70 80 94 87L102 92L99 96Q72 90 49 96Z', '#3f4237', 0.95) +
      shape('M125 86Q144 77 160 84L166 90L162 93Q144 87 127 92Z', '#3f4237', 0.95) +
      eye('young-eye-near', 52, 108, 43, 4, true) +
      eye('young-eye-far', 127, 103, 31, 3, true) +
      line('M54 119Q74 125 92 116M129 114Q143 118 156 109', '#ad8f6d', 0.8, 0.52) +
      line(
        'M111 106Q107 129 108 145L115 155M128 140L132 152Q140 155 140 159L130 164',
        '#907153',
        1.2,
        0.7,
      ) +
      shape('M117 162Q121 158 126 161L125 164L118 165Z', '#765f45', 0.72) +
      shape('M134 162Q140 158 144 161Q141 166 136 166Z', '#765f45', 0.74) +
      shape('M97 184Q110 177 121 180L132 177L149 180L153 183Q131 188 99 186Z', '#a4775d', 0.64) +
      line('M99 184L117 183Q132 184 148 181', '#71533f', 1.05, 0.86) +
      shade('M107 189Q127 193 143 186L138 194L118 197Z', '#c99d79', 0.63) +
      line('M114 205Q126 208 135 202', '#a98b69', 0.8, 0.5),
  )
  content += group(
    'young-ear',
    line('M12 124Q22 118 27 132L23 141Q17 144 14 137', '#96795a', 1.1, 0.8),
  )
  content += group(
    'bound-hair',
    shape(
      'M21 123Q5 88 16 47Q25 5 65 -6Q108 -17 144 6Q178 25 180 72L170 104L159 89L158 56Q129 51 101 34Q78 58 39 63L32 113L35 150L22 148Z',
      '#303b35',
      1,
      'filter="url(#edge)"',
    ) +
      shade('M27 52Q43 17 77 10Q116 0 141 23Q95 18 60 50L37 61Z', '#8a8f79', 0.33) +
      line(
        'M36 55Q70 44 100 25M44 44Q71 23 94 18M102 12Q137 14 156 39M161 48Q167 68 165 86',
        '#a2a58d',
        1,
        0.36,
      ) +
      shape(
        'M69 1Q60 -13 68 -33Q80 -50 100 -42Q115 -36 112 -15L108 3Z',
        '#354038',
        1,
        'filter="url(#edge)"',
      ) +
      line('M79 -30Q100 -39 103 -16M78 -34Q75 -16 79 -1M87 -38L88 0', '#8c9780', 1.1, 0.4) +
      shape('M26 64Q86 46 161 65L165 82Q92 64 29 80Z', '#71654a', 1, 'filter="url(#edge)"') +
      line('M31 68Q94 53 158 69', '#bba977', 2, 0.7) +
      ellipse(100, 66, 8, 7, '#a38e59', 0.94) +
      ellipse(100, 66, 4.5, 4, '#6e7c6a', 0.95),
  )
  return group(
    'young-commanders-face',
    content,
    'transform="translate(770 182) rotate(-4 95 120) scale(1.02)"',
  )
}

function generalStudy() {
  const paint = studio(22039)
  const { shape, line, group, wash, shade, ellipse, brush, random } = paint
  let content = group(
    'frontier-atmosphere',
    shade('M420 919Q849 865 1175 919L1206 959Q847 985 393 957Z', '#947951', 0.1),
  )
  content += group(
    'wind-pulled-cloak',
    shape(
      'M787 442Q686 440 629 476Q562 506 520 568Q465 616 377 620L292 604Q319 642 374 651L292 687Q351 732 435 724L374 758Q469 800 574 756L712 676L868 564Z',
      'url(#crimson)',
      0.98,
      'filter="url(#edge)"',
    ) +
      shade(
        'M728 466Q663 536 596 571L440 672Q414 691 358 689Q458 734 544 678L691 604L783 488Z',
        '#d3a17b',
        0.25,
      ) +
      wash(
        'M773 494Q717 583 618 651L488 720L400 750Q478 790 566 750L699 679L841 552Z',
        '#442f2a',
        0.47,
      ) +
      brush(
        'M708 497Q615 579 528 622T365 662M666 622Q558 704 430 726M493 690Q440 705 382 704',
        '#e1b184',
        4,
        0.29,
      ),
  )
  const torso =
    'M786 439Q710 439 655 486Q625 517 622 573L603 712L598 839Q664 876 771 869L985 857L1034 798L1017 625L1008 538Q976 477 906 449Z'
  content += group(
    'campaign-armor',
    shape(torso, 'url(#iron)', 1, 'filter="url(#edge)"') +
      `<clipPath id="armor-clip"><path d="${torso}"/></clipPath><g clip-path="url(#armor-clip)">` +
      shade('M695 473Q721 500 714 568L674 728L678 870L602 857L615 587Z', '#d0c8a6', 0.23) +
      wash('M971 499Q971 623 985 707L1030 828L965 867Q926 748 940 631Z', '#203c38', 0.5) +
      shade('M764 481Q817 495 841 551L860 739L825 807L782 709Z', '#b8b79b', 0.2) +
      repeat(18, (row) =>
        repeat(17, (column) => {
          const horizontal = 610 + column * 24 + (row % 2) * 12
          const vertical = 518 + row * 19
          const bow = (horizontal - 808) ** 2 / 16000
          return (
            shape(
              `M${horizontal} ${vertical + bow}q10 4 20 -1l-1 15q-9 5 -19 1Z`,
              column % 4 ? '#a3a48a' : '#475950',
              0.12 + random() * 0.13,
            ) +
            line(`M${horizontal + 1} ${vertical + 15 + bow}q8 4 17 -1`, '#283e36', 0.85, 0.5) +
            ellipse(horizontal + 5, vertical + 5 + bow, 0.9, 1.2, '#d4c28d', 0.6) +
            ellipse(horizontal + 15, vertical + 5 + bow, 0.9, 1.2, '#d4c28d', 0.6)
          )
        }),
      ) +
      '</g>',
  )
  content += group(
    'neck-and-collar',
    shape('M811 374L807 439L842 477L897 437L895 366Z', 'url(#young-skin)') +
      shade('M814 387Q854 410 893 386L890 432Q856 447 813 415Z', '#7c6d52', 0.39) +
      shape('M781 437L809 424L849 465L894 423L924 443L855 515L826 509Z', '#7d4334') +
      shape('M797 433L848 486L909 434L920 446L852 509L837 508L786 445Z', '#b69d6b', 0.9) +
      line('M798 435L849 488L909 437', '#d1bb85', 2, 0.75),
  )
  content += youngFace(paint)
  content += group(
    'armor-shoulder-lames',
    shape(
      'M677 481Q710 465 751 488L772 553Q733 577 655 556L642 536Z',
      '#63756b',
      0.98,
      'filter="url(#edge)"',
    ) +
      shape(
        'M931 481Q976 480 1003 515L1025 561Q985 577 944 552L923 516Z',
        '#5d7064',
        0.98,
        'filter="url(#edge)"',
      ) +
      repeat(4, (index) =>
        line(
          `M${657 - index * 3} ${509 + index * 13}Q710 ${526 + index * 12} ${755 + index * 4} ${510 + index * 13}`,
          '#b6b49a',
          1.5,
          0.48,
        ),
      ) +
      repeat(4, (index) =>
        line(
          `M${935 + index * 2} ${503 + index * 14}Q971 ${522 + index * 14} ${1002 + index * 6} ${521 + index * 12}`,
          '#b6b49a',
          1.3,
          0.44,
        ),
      ) +
      line('M673 486Q716 478 746 495M942 488Q978 492 995 520', '#c6c2a0', 2.2, 0.55),
  )
  content += group(
    'leather-belt',
    shape(
      'M601 754Q800 790 1019 745L1024 792Q804 835 600 797Z',
      '#594c35',
      0.98,
      'filter="url(#edge)"',
    ) +
      line('M607 762Q804 799 1016 753M607 788Q800 823 1018 784', '#b59b68', 2, 0.75) +
      shape('M792 783L839 780L844 815L796 819Z', '#ac9665', 1, 'filter="url(#edge)"') +
      shape('M800 789L832 787L835 809L804 812Z', '#657660') +
      line('M809 792Q824 784 830 798Q825 811 810 808', '#d3c08a', 1.4, 0.8) +
      repeat(5, (index) => ellipse(646 + index * 29, 784 + index * 1.6, 2, 2, '#bdab76', 0.7)),
  )
  content += group(
    'right-forearm-resting',
    shape(
      'M1008 559Q1042 585 1048 631L1043 679L1008 735L949 757L932 735L983 704L1002 666L990 624L973 595Z',
      '#5e7065',
      1,
      'filter="url(#edge)"',
    ) +
      wash('M1027 595Q1044 655 1025 690L995 724L975 727Q1010 669 1007 640Z', '#223f39', 0.44) +
      shape('M985 687L1011 705L982 746L951 758L936 737Z', '#67543a') +
      line('M988 698L1000 709M976 715L991 725M964 730L977 740', '#b1a17a', 2, 0.8),
  )
  content += group(
    'sword-and-scabbard',
    shape('M923 719L948 714L1039 925L1014 936Z', '#3d4b42', 1, 'filter="url(#edge)"') +
      line('M943 731L1027 921', '#a28b58', 2.6, 0.85) +
      shape('M916 722L947 709L950 725L921 737Z', '#b09b66') +
      shape('M930 673L940 669L957 709L946 715Z', '#69513c') +
      repeat(5, (index) =>
        line(`M${932 + index * 2.7} ${678 + index * 6}l12 2`, '#ad9a6d', 1.8, 0.9),
      ) +
      ellipse(932, 674, 10, 5, '#b4a071', 1, 'transform="rotate(-22 932 674)"') +
      shape('M1011 919L1042 908L1049 930L1020 943Z', '#a39061', 0.95, 'filter="url(#edge)"'),
  )
  content += group(
    'hand-on-sword',
    shape(
      'M952 738L938 728Q929 722 926 713L919 697Q918 690 924 689L933 692L939 702L944 708Q946 697 940 690L932 680Q930 674 935 673Q941 673 947 681L960 699Q965 708 963 719L967 729Z',
      'url(#young-skin)',
    ) +
      shape(
        'M924 689Q931 686 936 693L945 708L941 714Q936 714 934 708L928 700L922 696Z',
        'url(#young-skin)',
      ) +
      shape(
        'M924 700Q928 697 931 701L940 715Q942 719 937 722Q932 722 930 717L924 708Z',
        'url(#young-skin)',
      ) +
      line(
        'M926 693L933 697L940 709M926 705L933 710L938 718M943 687Q949 693 951 700M949 715Q945 720 943 726',
        '#927354',
        1.05,
        0.78,
      ),
  )
  content += group(
    'left-arm-and-gauntlet',
    shape(
      'M653 558Q626 579 627 622L645 690L704 731L738 724L746 703L690 675L680 628L687 586Z',
      'url(#iron)',
      1,
      'filter="url(#edge)"',
    ) +
      wash('M638 595Q641 641 659 672L713 709L704 727L645 690L628 625Z', '#2f4740', 0.5) +
      shape('M690 676L717 688L744 702L733 726L704 733L678 710Z', '#64543a') +
      line('M692 685L681 706M704 691L694 717M716 697L707 724', '#b5a379', 1.8, 0.8),
  )
  content += group(
    'relaxed-left-hand',
    shape(
      'M737 705Q748 701 759 708L774 717Q780 724 773 727L762 721L756 725L775 734Q783 741 775 744L751 734L764 743Q769 750 761 750L744 741Q736 739 733 731L728 723Z',
      'url(#young-skin)',
    ) + line('M746 714Q751 718 756 725M743 728L753 733M744 736L752 741', '#987956', 1, 0.7),
  )
  content += group(
    'hanging-tunic',
    shape(
      'M604 807Q696 842 792 833L830 927L695 947L583 914Z',
      '#525c4c',
      1,
      'filter="url(#wash)"',
    ) +
      shape('M840 829L996 804L1030 927L871 951Z', '#454f43', 1, 'filter="url(#wash)"') +
      brush(
        'M617 828Q622 884 601 924M654 841L658 935M711 848L733 947M889 843L909 949M956 828L982 941',
        '#b9b398',
        2.7,
        0.22,
      ),
  )
  return { ...paint, content }
}

function horseStudy() {
  const paint = studio(22037)
  const { shape, line, ellipse, group, wash, shade, brush, random } = paint
  let content = group(
    'ground',
    wash('M258 844Q684 788 1250 826L1375 874Q879 928 261 899Z', '#9a805a', 0.12) +
      repeat(22, () => {
        const horizontal = 280 + random() * 990
        const vertical = 868 + random() * 40
        return brush(
          `M${horizontal} ${vertical}q40 -6 ${57 + random() * 70} -2`,
          '#897251',
          1.8,
          0.2,
        )
      }),
  )
  content += group(
    'far-legs',
    shape(
      'M625 565Q656 585 676 630L684 686L737 720L776 747L772 762L757 767L724 744L654 710Q639 700 635 680L611 635L582 601Z',
      '#70503a',
      1,
      'filter="url(#edge)"',
    ) +
      shape(
        'M966 542Q1002 553 1021 584L1045 631L1101 685L1148 694L1156 711L1148 724L1110 716L1076 698L1008 654Q996 645 990 631L960 598L941 572Z',
        '#725039',
        1,
        'filter="url(#edge)"',
      ) +
      shape('M756 748L776 744L787 758L784 770L763 773L751 763Z', '#363b30') +
      shape('M1146 694L1160 693L1174 709L1169 722L1149 724L1143 711Z', '#363b30'),
  )
  content += group(
    'tail-mass',
    shape(
      'M584 439C544 423 520 435 497 456C455 493 409 496 363 472L334 456Q352 500 405 514Q454 527 490 506C523 488 539 467 586 465Z',
      '#4d4132',
      0.95,
      'filter="url(#wash)"',
    ) +
      repeat(34, (index) => {
        const offset = index / 34
        return line(
          `M${575 - offset * 15} ${441 + offset * 18}C${526 - offset * 8} ${421 + offset * 23} ${518 - offset * 12} ${450 + offset * 17} ${491 - offset * 8} ${466 + offset * 30}Q${430 - offset * 10} ${511 + offset * 15} ${357 - offset * 19} ${479 + offset * 5}`,
          index % 4 ? '#453f31' : '#a58b5c',
          0.9 + random() * 2,
          0.3 + random() * 0.4,
        )
      }),
  )
  const body =
    'M543 459C565 425 607 414 657 424C726 439 766 447 837 438C896 429 925 410 955 365L999 287Q1021 248 1051 245Q1082 238 1110 264L1125 310Q1106 348 1091 379Q1067 425 1066 480C1066 533 1046 571 1004 595Q961 623 904 628L753 624Q679 634 624 613Q571 608 548 580Q527 548 528 505Q527 480 543 459Z'
  content += group(
    'chestnut-body',
    shape(body, 'url(#chestnut)', 1, 'filter="url(#edge)"') +
      `<clipPath id="horse-body-clip"><path d="${body}"/></clipPath><g clip-path="url(#horse-body-clip)">` +
      shape('M531 426Q620 390 687 442Q746 507 691 594Q619 643 549 568Z', 'url(#muscle)', 0.9) +
      shape('M900 432Q977 414 1031 454Q1092 519 1023 603Q945 645 905 568Z', 'url(#muscle)', 0.85) +
      shade('M652 446Q728 478 850 454L907 433L933 451Q798 501 681 467Z', '#e3b980', 0.34) +
      shade('M680 564Q771 602 891 583L987 567L982 599Q846 653 702 619Z', '#4a3c2c', 0.49) +
      shade(
        'M998 290Q1029 263 1052 271Q1042 321 1015 372L990 430Q958 453 941 466L949 419Q978 371 998 290Z',
        '#deb080',
        0.37,
      ) +
      shade(
        'M1063 310Q1073 353 1049 411L1034 494L1020 557L992 579Q998 514 1014 466Q1038 397 1063 310Z',
        '#543e2e',
        0.43,
      ) +
      shade(
        'M596 450Q562 478 569 531Q585 565 616 576L604 600Q548 591 536 543Q522 483 560 452Z',
        '#684a33',
        0.3,
      ) +
      repeat(90, () => {
        const horizontal = 548 + random() * 497
        const vertical = 436 + random() * 181
        return brush(
          `M${horizontal} ${vertical}q${8 + random() * 12} 4 ${15 + random() * 22} ${4 + random() * 12}`,
          '#e3c18c',
          0.8 + random() * 2.8,
          0.035 + random() * 0.055,
        )
      }) +
      '</g>',
  )
  content += group(
    'near-hind-leg',
    shape(
      'M592 550Q568 561 558 598Q551 634 524 661L490 683Q478 694 471 710L440 796L424 823L411 822L409 808L425 775L442 704Q446 684 464 668L490 637Q509 608 520 574L548 549Z',
      'url(#chestnut)',
      1,
      'filter="url(#edge)"',
    ) +
      shade(
        'M555 568Q551 624 522 653L477 690L455 738L442 780L429 789L447 710Q452 690 474 671L499 638L523 581Z',
        '#d6a773',
        0.45,
      ) +
      line('M560 589Q557 624 531 647L487 681Q471 691 465 710L445 776', '#6b4b34', 1.4, 0.65) +
      shape(
        'M413 813L431 819L428 840L405 849L392 843L396 832Z',
        '#363b31',
        1,
        'filter="url(#edge)"',
      ) +
      line('M402 834L423 827', '#ad9972', 1.2, 0.65),
  )
  content += group(
    'near-foreleg',
    shape(
      'M982 541Q1001 546 1005 568L1017 614Q1024 635 1042 641L1111 655Q1137 660 1155 677L1209 711L1239 713L1245 728L1237 740L1212 736L1144 703Q1130 695 1113 693L1036 682Q1010 678 996 658L970 616Q946 588 954 564Z',
      'url(#chestnut)',
      1,
      'filter="url(#edge)"',
    ) +
      shade(
        'M976 555Q990 568 995 596L1008 631Q1020 650 1040 655L1117 670L1166 701L1145 697L1118 683L1040 671Q1008 669 994 645L973 609Z',
        '#d6a576',
        0.46,
      ) +
      line('M1010 650Q1025 666 1050 667L1114 679Q1130 683 1147 696', '#61432f', 1.2, 0.62) +
      shape(
        'M1232 713L1245 714L1260 727L1259 741L1236 746L1223 735Z',
        '#343b30',
        1,
        'filter="url(#edge)"',
      ) +
      line('M1231 732L1252 724', '#b3a47d', 1.4, 0.65),
  )
  content += group(
    'shoulder-and-stifle',
    line(
      'M961 467Q941 492 950 530Q954 550 970 560M622 455Q649 483 646 520Q640 552 616 569M718 605Q799 620 876 609',
      '#684b34',
      1.4,
      0.45,
    ) +
      brush(
        'M568 466Q548 496 556 530M964 476Q949 501 961 532M985 567L999 611M567 605Q549 639 518 664',
        '#d2a676',
        2.7,
        0.39,
      ),
  )
  const head =
    'M1041 252Q1067 234 1092 249L1118 272Q1130 292 1135 316L1161 344L1188 361Q1200 373 1193 387Q1188 397 1169 394L1142 381L1115 361Q1093 355 1079 339L1058 313Q1042 286 1041 252Z'
  content += group(
    'horse-head',
    shape(head, 'url(#chestnut)', 1, 'filter="url(#edge)"') +
      shade(
        'M1080 259Q1098 278 1103 305L1128 339L1161 368L1152 374L1113 347L1089 310L1072 281Z',
        '#d9ad78',
        0.46,
      ) +
      shade('M1170 357L1188 362L1197 379L1186 392L1168 387L1155 379Z', '#554532', 0.48) +
      shape(
        'M1048 260Q1027 242 1028 215L1040 223L1062 255ZM1078 249Q1072 224 1083 205Q1097 227 1091 252Z',
        '#875737',
        1,
        'filter="url(#edge)"',
      ) +
      line('M1035 228L1051 251M1084 216L1085 242', '#4d4130', 2, 0.8) +
      shape('M1090 291Q1098 285 1105 290L1108 295Q1101 300 1092 298Z', '#2e342b', 0.96) +
      ellipse(1101, 293, 1.7, 1.2, '#dbc99d', 0.9) +
      line('M1089 286Q1099 280 1108 287', '#c99c68', 1.4, 0.8) +
      shape('M1174 366Q1184 362 1187 371Q1188 379 1180 381Q1173 379 1174 366Z', '#36392a', 0.94) +
      line('M1161 385Q1178 393 1188 385', '#4f392a', 1.6, 0.85) +
      line('M1102 311Q1103 331 1121 342', '#64462f', 1.1, 0.6),
  )
  content += group(
    'mane',
    shape(
      'M1080 250Q1056 228 1030 244Q1009 260 994 292L972 326Q952 345 935 348Q953 352 968 349L938 390L904 415Q929 417 950 402Q980 382 993 349L1021 291Q1037 257 1062 258Z',
      '#493d2f',
      0.98,
      'filter="url(#wash)"',
    ) +
      repeat(37, (index) => {
        const progress = index / 37
        const horizontal = 1056 - progress * 72
        const vertical = 245 + progress * 101
        return line(
          `M${horizontal} ${vertical}Q${horizontal - 17} ${vertical + 29} ${horizontal - 46} ${vertical + 40}T${horizontal - 75 - random() * 12} ${vertical + 40 + random() * 17}`,
          index % 4 ? '#413e30' : '#a98a5b',
          0.7 + random() * 1.8,
          0.3 + random() * 0.44,
        )
      }) +
      shape(
        'M1070 251Q1105 245 1119 276L1127 299Q1110 286 1098 270L1074 264Z',
        '#514130',
        0.94,
        'filter="url(#edge)"',
      ),
  )
  return { ...paint, content }
}

const studies = [
  {
    id: 'han-wudi-majesty',
    name: '汉武帝 · 临朝',
    note: '成熟而克制的帝王意象 · 冕冠玄衣 · 静态收势',
    seed: 22031,
    draw: emperorStudy,
  },
  {
    id: 'huo-qubing-resolve',
    name: '霍去病 · 长风',
    note: '年轻而专注的统帅意象 · 札甲披风 · 按剑立姿',
    seed: 22039,
    draw: generalStudy,
  },
  {
    id: 'red-hare-stride',
    name: '赤兔 · 奔霄',
    note: '赤栗骏马意象 · 颈肩承接 · 屈伸错落的奔姿',
    seed: 22037,
    draw: horseStudy,
  },
]

for (const study of studies) {
  const painting = study.draw()
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title description"><title id="title">${study.name}</title><desc id="description">${study.note}。第二版原创彩墨插画，非真实肖像或冠服甲胄考据复原，透明背景。</desc>${painting.definitions}${painting.group('artwork', painting.content, 'mask="url(#fade)"')}</svg>`
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
      version: 2,
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
const cards = studies
  .map(
    (study, index) =>
      `<article id="${study.id}"><a class="art" href="ink-wash/${study.id}.svg" target="_blank" aria-label="放大查看${study.name}"><img src="ink-wash/${study.id}.png" width="1600" height="1000" alt="${study.name}，${study.note}"></a><div class="caption"><div><span class="order">0${index + 1} / 彩墨重绘</span><h2>${study.name}</h2><p>${study.note}</p></div><nav aria-label="下载${study.name}"><a href="ink-wash/${study.id}.svg" download>可编辑 SVG ↓</a><a href="ink-wash/${study.id}.png" download>透明 PNG ↓</a></nav></div></article>`,
  )
  .join('')
writeFileSync(
  join(destination, 'index.html'),
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>衣冠与风骨 · 人物第二稿</title><style>*{box-sizing:border-box}body{margin:0;background:#dfc69c;color:#473d31;font-family:"Songti SC",serif}a{color:inherit;text-underline-offset:5px}a:focus-visible{outline:2px solid #884834;outline-offset:5px}main{max-width:1360px;margin:auto;padding:38px 52px 55px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #88705250;padding-bottom:24px;gap:20px}header strong{font-size:22px;letter-spacing:.1em}header nav{font:12px sans-serif;display:flex;gap:22px}.intro{display:flex;justify-content:space-between;align-items:end;gap:30px;margin:32px 0 0}.intro h1{font-size:38px;font-weight:500;letter-spacing:.1em;margin:0}.intro p{font:13px/1.9 sans-serif;color:#79634c;max-width:490px;margin:0}article{margin-top:28px}.art{display:block;max-width:1120px;margin:auto}.art img{display:block;width:100%;height:auto}.caption{display:flex;justify-content:space-between;gap:24px;align-items:center;border-top:1px solid #88705250;padding:18px 0 26px}.order{font:11px sans-serif;letter-spacing:.15em;color:#8b7053}h2{font-size:28px;font-weight:500;margin:9px 0}.caption p{font:12px/1.8 sans-serif;color:#79634c;margin:0}.caption nav{display:flex;gap:20px;font:12px sans-serif}footer{border-top:1px solid #88705250;padding-top:22px;font:12px/1.9 sans-serif;color:#79634c}@media(max-width:700px){main{padding:24px 20px}.intro,.caption{display:block}.intro h1{font-size:29px}.intro p{margin-top:16px}.caption nav{margin-top:16px}header strong{font-size:17px}header nav{gap:12px;flex-wrap:wrap}}</style></head><body><main><header><strong>纸上山河 · 衣冠与风骨</strong><nav><a href="../demo/ink-study.html#figure-collection">素材总览 ↗</a><a href="../figure-studies/index.html">查看第一稿 ↗</a></nav></header><div class="intro"><h1>先立其人，再写其形。</h1><p>第二稿重新设计角色、脸部结构与姿势。面部不用位移滤镜，衣纹服从肩、肘、腰部的受力；赤兔单独重新设计骨架。</p></div>${cards}<footer>1600 × 1000 · 透明 SVG / PNG · 牛皮纸与题字仅在预览层。<br>历史人物的性格表达是创作选择，不代表真实容貌或历史心理；冠服甲胄为艺术概括，非考据复原。赤兔单独成画，不与西汉人物拼为同一事件。<br><a href="../../../../docs/design-system/figure-painting-skill-references.md">人物绘画 Skill 参考与本次取舍 ↗</a></footer></main></body></html>`,
)
console.log(`Generated three redesigned figure studies in ${destination}`)
syncInkCollections()
