import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/visuals/traditional-culture/courtyard-studies/ink-wash',
)
const ink = '#364039'
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
<filter id="pigment" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".46" numOctaves="2" seed="151" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .24 0 0 0 .76" result="grain"/><feComposite in="SourceGraphic" in2="grain" operator="in" result="paint"/><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="51" result="edge"/><feDisplacementMap in="paint" in2="edge" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter>
<linearGradient id="iron" x2="100%" y2="60%"><stop stop-color="#87948e"/><stop offset=".36" stop-color="#647672"/><stop offset="1" stop-color="#3c4d4b"/></linearGradient>
<linearGradient id="wood" x2="90%" y2="70%"><stop stop-color="#b18e60"/><stop offset=".5" stop-color="#906d47"/><stop offset="1" stop-color="#615239"/></linearGradient>
<linearGradient id="bronze" x2="90%" y2="80%"><stop stop-color="#b2a176"/><stop offset=".4" stop-color="#8e865a"/><stop offset="1" stop-color="#526d5a"/></linearGradient>
<linearGradient id="jade" x2="90%" y2="90%"><stop stop-color="#d5d6b7"/><stop offset=".35" stop-color="#b8c4a3"/><stop offset=".7" stop-color="#92ab91"/><stop offset="1" stop-color="#728f7e"/></linearGradient>
<radialGradient id="fruit" cx="30%" cy="30%" r="80%"><stop stop-color="#dfc17b"/><stop offset=".5" stop-color="#cea154"/><stop offset="1" stop-color="#b67e44"/></radialGradient>
<radialGradient id="flower" cx="45%" cy="51%" r="70%"><stop stop-color="#eee3d4"/><stop offset=".23" stop-color="#c5acc9"/><stop offset=".54" stop-color="#977ca9"/><stop offset="1" stop-color="#6b6695"/></radialGradient>
<linearGradient id="fur" x2="80%" y2="100%"><stop stop-color="#788380"/><stop offset=".42" stop-color="#52655e"/><stop offset="1" stop-color="#344640"/></linearGradient>
<linearGradient id="feather" x2="95%" y2="80%"><stop stop-color="#a48869"/><stop offset=".55" stop-color="#807d69"/><stop offset="1" stop-color="#576b60"/></linearGradient>
<linearGradient id="roof" x2="25%" y2="100%"><stop stop-color="#9ba699"/><stop offset=".42" stop-color="#74877e"/><stop offset="1" stop-color="#405c56"/></linearGradient>
<linearGradient id="paper" x2="70%" y2="100%"><stop stop-color="#e8dcc0"/><stop offset="1" stop-color="#bfae87"/></linearGradient>
<clipPath id="window-opening"><circle cx="802" cy="522" r="180"/></clipPath>
</defs>`

function leaf(horizontal, vertical, angle, scale = 1, color = '#647f59') {
  return transform(
    path('M0 0Q-48 -48 -22 -149Q18 -105 0 0Z', color, 1, texture) +
      line('M0 -2Q-18 -66 -21 -132', '#b7b67e', 1.5, 0.6),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function roof(horizontal, vertical, width, depth) {
  return transform(
    path(
      `M${-width * 0.35} 0L${width * 0.35} 0Q${width * 0.44} ${depth * 0.76} ${width * 0.58} ${depth * 0.73}Q0 ${depth * 1.23} ${-width * 0.58} ${depth * 0.73}Q${-width * 0.43} ${depth * 0.76} ${-width * 0.35} 0Z`,
      'url(#roof)',
      1,
      texture,
    ) +
      times(17, (index) =>
        line(
          `M${-width * 0.33 + index * width * 0.041} 8L${-width * 0.52 + index * width * 0.065} ${depth * 0.87}`,
          '#bdc1aa',
          1.6,
          0.42,
        ),
      ) +
      line(
        `M${-width * 0.58} ${depth * 0.73}Q0 ${depth * 1.23} ${width * 0.58} ${depth * 0.73}`,
        '#3c5750',
        6,
      ),
    `translate(${horizontal} ${vertical})`,
  )
}

function ringSword() {
  const sword =
    path('M-15 16L-17 -398L7 -483L23 -399L22 16Z', 'url(#iron)', 1, texture) +
    path('M7 -470L15 -395L11 9L2 9L1 -394Z', '#bec7b5', 0.68) +
    path('M-44 12L48 12L44 28L-42 28Z', '#7e7957', 1, texture) +
    path('M-14 28L17 28L18 174L-14 174Z', '#77513b', 1, texture) +
    times(12, (index) => line(`M-13 ${37 + index * 11}L16 ${47 + index * 11}`, '#b08b60', 4)) +
    path('M-20 174L25 174L25 188L-20 188Z', '#85794d') +
    path(
      'M3 182A35 35 0 1 1 2 252A35 35 0 1 1 3 182ZM3 195A22 22 0 1 0 3 239A22 22 0 1 0 3 195Z',
      'url(#bronze)',
      1,
      'fill-rule="evenodd"',
    )
  return (
    group('ground', wash('M367 821Q835 759 1196 835Q1102 910 437 891Z', '#6d775d', 0.16)) +
    group(
      'lacquered-shield',
      path(
        'M568 366Q714 330 795 443L782 718Q742 822 598 848Q451 786 457 642L474 431Z',
        '#655344',
        1,
        texture,
      ) +
        path(
          'M570 386Q695 352 775 450L761 707Q725 799 599 826Q473 773 479 642L494 440Z',
          '#98594a',
          1,
          texture,
        ) +
        path(
          'M589 391L601 825Q732 794 761 706L775 450Q695 353 589 391Z',
          '#805a46',
          0.65,
          texture,
        ) +
        line('M590 404L604 807', '#bd9170', 5, 0.45) +
        ellipse(615, 584, 61, 67, 'url(#iron)', 1, texture) +
        ellipse(603, 573, 22, 27, '#99a18a', 0.5) +
        times(17, (index) => {
          const angle = (index * Math.PI * 2) / 17
          return ellipse(
            623 + Math.cos(angle) * 135,
            593 + Math.sin(angle) * 204,
            5,
            5,
            '#b6a378',
            0.8,
          )
        }) +
        path(
          'M524 493Q542 431 577 424L560 485Z M689 709L727 673Q716 751 655 776Z',
          '#4f5140',
          0.6,
          texture,
        ),
    ) +
    group('ring-pommel-sword', transform(sword, 'translate(868 572) rotate(31)')) +
    group(
      'vermilion-cord',
      line('M762 766Q744 817 789 856Q813 868 821 846Q819 824 787 846', '#9e5a46', 4) +
        brush(
          [
            [789, 856],
            [802, 883],
            [818, 890],
            [826, 909],
          ],
          12,
          '#a36349',
          0.8,
        ),
    )
  )
}

function bronzeGe() {
  const platePanel = (rows, columns, surface, palette) =>
    times(rows, (row) =>
      times(columns, (column) => {
        const point = (across, down) => surface((column + across) / columns, (row + down) / rows)
        const corner = (across, down) => point(across, down).map(rounded).join(' ')
        const center = point(0.5, 0.48)
        const upperLeft = point(0.18, 0.14)
        const lowerLeft = point(0.18, 0.94)
        const upperRight = point(0.81, 0.14)
        const lowerRight = point(0.81, 0.94)
        return (
          path(
            `M${corner(0.04, 0.02)}L${corner(0.94, 0.02)}L${corner(0.98, 0.91)}Q${corner(0.5, 1.08)} ${corner(0.03, 0.95)}Z`,
            palette[Math.min(palette.length - 1, Math.floor((column / columns) * palette.length))],
            1,
            'stroke="#3a4540" stroke-width="1" stroke-linejoin="round"',
          ) +
          line(`M${corner(0.1, 0.1)}L${corner(0.86, 0.1)}`, '#acb09a', 1.4, 0.55) +
          [upperLeft, upperRight, lowerLeft, lowerRight]
            .map(([horizontal, vertical]) => ellipse(horizontal, vertical, 1.8, 1.5, '#323d36'))
            .join('') +
          line(
            `M${upperLeft.join(' ')}L${lowerLeft.join(' ')}M${upperRight.join(' ')}L${lowerRight.join(' ')}`,
            '#b7a780',
            1.2,
            0.82,
          ) +
          (column % 3 === 1
            ? line(`M${center[0] - 5} ${center[1] + 2}l7 -1`, '#b0b3a0', 1, 0.33)
            : '')
        )
      }),
    )
  const frontColors = ['#7c8575', '#717d70', '#6a766b', '#657368', '#5d6c62']
  const sideColors = ['#56665b', '#51645a', '#4b5e54', '#475b52']
  const helmetOutline =
    'M632 327Q634 254 671 230Q701 208 736 223Q789 238 802 306L808 363L788 402L751 416L739 359L677 352L662 404L629 389Z'
  const helmetSurface = (across, down) => {
    const span = 65 + 110 * Math.sin(((0.13 + down * 0.87) * Math.PI) / 2)
    return [713 - span / 2 + across * span, 222 + down * 113 + Math.sin(across * Math.PI) * 8]
  }
  const ge =
    path('M-8 -345L10 -345L12 330L-10 330Z', 'url(#wood)', 1, texture) +
    line('M-3 -320L-2 316', '#c3a374', 2.5, 0.6) +
    path('M-11 322L13 322L15 350L1 367L-12 350Z', '#5b6b5c', 1, texture) +
    path(
      'M-68 -318L-8 -318L-8 -342L16 -342L20 -322Q119 -342 219 -318Q149 -295 93 -268L28 -254L24 -162L-1 -153L-4 -293L-68 -292Z',
      'url(#bronze)',
      1,
      texture,
    ) +
    path('M22 -317Q110 -332 207 -319L91 -288L23 -277Z', '#b9ae78', 0.74) +
    path('M24 -277L91 -288L207 -319Q143 -290 92 -268L27 -254Z', '#61785d', 0.8) +
    line('M23 -298L184 -317', '#e1ce93', 2, 0.65) +
    line('M27 -258L90 -272', '#455f4f', 2.5, 0.9) +
    path(
      'M-57 -311L-31 -311L-31 -301L-57 -301ZM5 -267L16 -267L16 -248L5 -248ZM5 -231L16 -231L16 -212L5 -212ZM5 -194L16 -194L16 -175L5 -175Z',
      '#3f5546',
    ) +
    times(3, (index) => {
      const vertical = -257 + index * 36
      return line(
        `M-12 ${vertical - 2}Q1 ${vertical + 7} 15 ${vertical + 1}M-12 ${vertical + 6}Q1 ${vertical + 15} 15 ${vertical + 9}`,
        '#a58b5f',
        3.4,
        1,
      )
    }) +
    path('M-12 -339L-7 -343L-7 -316L-12 -316Z', '#6a5339') +
    times(11, (index) =>
      ellipse(
        42 + index * 14,
        -307 + Math.sin(index * 2.8) * 10,
        3 + (index % 3),
        1.5,
        '#496d57',
        0.35,
        texture,
      ),
    )
  return (
    `<defs><clipPath id="lamellar-helmet-silhouette">${path(helmetOutline)}</clipPath></defs>` +
    group('ground', wash('M399 861Q756 809 1154 852Q1060 916 443 900Z', '#72775e', 0.16)) +
    group(
      'timber-armor-stand',
      path('M713 355L730 355L730 858L713 858Z', '#725d41', 1, texture) +
        path('M619 844L822 844L855 866L598 866Z', '#776444', 1, texture) +
        line('M637 850L813 850', '#b1996e', 2, 0.6),
    ) +
    group(
      'dark-lining-and-collar',
      path(
        'M659 409Q713 392 766 410L810 435L878 458L893 577L843 607L839 692L602 706L590 591L535 568L546 463L619 428Z',
        '#3e4941',
        1,
        texture,
      ) +
        ellipse(712, 415, 55, 19, '#293b34') +
        path('M660 410Q713 430 765 409L759 429Q713 449 666 428Z', '#8b6750', 1, texture) +
        line('M666 416Q711 439 759 416', '#b38c65', 3, 0.75),
    ) +
    group(
      'lamellar-skirt',
      path('M606 669L837 663L863 810Q743 850 575 808Z', '#394b41', 1, texture) +
        platePanel(
          7,
          12,
          (across, down) => [
            606 - down * 30 + across * (231 + down * 55),
            671 + down * 141 + Math.sin(across * Math.PI) * 15 - across * 6,
          ],
          frontColors,
        ),
    ) +
    group(
      'lamellar-chest-and-flank',
      platePanel(
        10,
        3,
        (across, down) => [
          831 + across * (57 - down * 13) - down * 2,
          465 - across * 10 + down * 203 + Math.sin(across * Math.PI) * 4,
        ],
        sideColors,
      ) +
        platePanel(
          10,
          10,
          (across, down) => [
            606 + down * 7 + across * (231 - down * 13),
            443 + down * 225 + Math.sin(across * Math.PI) * 15 - across * 5,
          ],
          frontColors,
        ) +
        line('M609 441Q723 471 835 437', '#9c8a64', 4, 0.85),
    ) +
    group(
      'articulated-shoulder-guards',
      platePanel(
        4,
        5,
        (across, down) => [619 - 120 * across - 10 * down, 430 + across * across * 55 + 88 * down],
        frontColors,
      ) +
        platePanel(
          4,
          5,
          (across, down) => [
            803 + 111 * across + 14 * down,
            429 + across * across * 51 + down * 86,
          ],
          sideColors,
        ) +
        line('M619 430Q548 439 499 485M803 429Q871 437 914 480', '#a6a48a', 2.5, 0.8),
    ) +
    group(
      'leather-waist-ties',
      path('M610 656Q721 674 845 650L845 670Q727 693 609 679Z', '#70543e', 1, texture) +
        line('M614 662Q729 680 839 656', '#b69a71', 2, 0.65) +
        path('M712 669L743 668L743 689L712 690Z', '#9d9366') +
        path('M718 674L737 673L737 683L718 684Z', '#514b36') +
        line(
          'M738 682Q779 725 757 747Q743 752 742 737Q739 725 758 712M738 682Q743 745 718 768',
          '#925e43',
          4,
          0.9,
        ),
    ) +
    group(
      'lamellar-helmet',
      path(helmetOutline, '#4a5d51', 1, texture) +
        group(
          'helmet-crown-plates',
          platePanel(5, 7, helmetSurface, frontColors),
          'clip-path="url(#lamellar-helmet-silhouette)"',
        ) +
        path('M644 334Q676 323 747 333L741 387Q720 399 677 390L673 347L645 351Z', '#293b33') +
        platePanel(
          3,
          2,
          (across, down) => [637 + across * 35 - down * 7, 331 + down * 57 + across * 4],
          frontColors,
        ) +
        platePanel(
          4,
          3,
          (across, down) => [746 + across * 52 + down * 7, 329 + down * 70 - across * 3],
          sideColors,
        ) +
        path('M641 324Q690 316 750 327L750 340Q693 328 641 337Z', '#7c8370', 1, texture) +
        line('M646 325Q700 319 746 328', '#b7b79c', 2.5, 0.7) +
        path('M683 223Q711 214 735 225L730 238Q706 231 681 240Z', '#88917c', 1, texture) +
        line('M670 390Q680 420 700 401M751 410Q761 430 770 414', '#a58a61', 3, 0.8),
    ) +
    group('bronze-dagger-axe-and-haft', transform(ge, 'translate(1046 546) rotate(13)'))
  )
}

function jadeCong() {
  const opening = 'M732 385A92 37 9 1 0 914 413A92 37 9 1 0 732 385Z'
  return (
    '<defs><linearGradient id="jade-bore-wall" x1="15%" y1="0%" x2="70%" y2="100%"><stop stop-color="#405f52"/><stop offset=".36" stop-color="#587766"/><stop offset=".72" stop-color="#819c81"/><stop offset="1" stop-color="#adb995"/></linearGradient><clipPath id="jade-bore-clip">' +
    path(opening) +
    '</clipPath></defs>' +
    group(
      'shadow',
      wash('M610 681L762 790L1025 723L1123 779Q941 846 755 846L561 739Z', '#708267', 0.17),
    ) +
    group(
      'square-jade-body',
      path('M620 360L760 475L760 795L620 680Z', '#94ab91', 1, texture) +
        path('M760 475L1025 410L1025 725L760 795Z', 'url(#jade)', 1, texture) +
        path(
          'M620 360L880 305L1025 410L760 475Z' + opening,
          'url(#jade)',
          1,
          `fill-rule="evenodd" ${texture}`,
        ) +
        path(opening, 'url(#jade-bore-wall)') +
        group(
          'visible-jade-inner-wall',
          path('M723 385Q808 345 924 410L917 431Q809 380 724 408Z', '#365c4c', 0.55) +
            path('M730 405Q812 457 917 423L911 435Q805 473 730 421Z', '#bdc6a0', 0.66) +
            line('M747 407Q802 435 880 423', '#a8b694', 3, 0.55) +
            line('M755 383Q810 368 872 396', '#6a8970', 2.5, 0.5),
          'clip-path="url(#jade-bore-clip)"',
        ) +
        path(
          'M732 385A92 37 9 1 0 914 413A92 37 9 1 0 732 385ZM746 388A77 26 9 1 0 899 412A77 26 9 1 0 746 388Z',
          '#6c8c78',
          0.9,
          'fill-rule="evenodd"',
        ) +
        times(4, (index) => {
          const vertical = 474 + index * 76
          return (
            path(
              `M620 ${vertical - 100}L760 ${vertical + 16}L1025 ${vertical - 49}L1025 ${vertical - 35}L760 ${vertical + 30}L620 ${vertical - 86}Z`,
              '#77957c',
              0.7,
              texture,
            ) +
            line(
              `M629 ${vertical - 78}L760 ${vertical + 31}L1015 ${vertical - 32}`,
              '#d5d7b4',
              3,
              0.65,
            )
          )
        }),
    ) +
    group(
      'restrained-carved-masks',
      times(3, (index) =>
        transform(
          line(
            'M-63 -11L-22 -11L-22 5L22 5L22 -11L62 -11M-57 21L-20 21L-20 35L20 35L20 21L56 21M-10 -13L10 -13',
            '#607f69',
            2.7,
            0.65,
          ) +
            ellipse(-39, 4, 10, 6, 'none', 1, 'stroke="#66876e" stroke-width="2.5"') +
            ellipse(39, 4, 10, 6, 'none', 1, 'stroke="#66876e" stroke-width="2.5"'),
          `translate(889 ${510 + index * 77}) skewY(-14)`,
        ),
      ),
    ) +
    group(
      'jade-mottling',
      times(19, (index) =>
        ellipse(
          786 + Math.sin(index * 2.4) * 9 + (index % 4) * 53,
          485 + Math.floor(index / 4) * 52,
          13 + (index % 3) * 7,
          5,
          '#e0dfbf',
          0.15,
          texture,
        ),
      ),
    )
  )
}

function incenseBurner() {
  return (
    group(
      'incense-smoke',
      wash(
        'M817 363Q756 287 840 236Q912 180 845 128Q947 177 860 246Q787 300 841 359Z',
        '#7f8c8a',
        0.2,
      ) + wash('M848 343Q946 300 900 235Q965 299 869 366Z', '#919792', 0.14),
    ) +
    group(
      'bronze-base',
      ellipse(794, 852, 197, 33, '#6d785b', 0.2) +
        path('M676 802L914 802Q919 856 795 870Q670 855 676 802Z', 'url(#bronze)', 1, texture) +
        ellipse(795, 802, 120, 29, '#a39d71') +
        path('M768 679L821 679L834 802Q801 833 755 802Z', 'url(#bronze)', 1, texture) +
        line('M780 695L778 795', '#bebb8d', 5, 0.5),
    ) +
    group(
      'round-censer-bowl',
      path(
        'M585 558Q796 617 1004 558Q977 699 797 719Q616 701 585 558Z',
        'url(#bronze)',
        1,
        texture,
      ) +
        ellipse(795, 557, 210, 56, '#839174', 1, texture) +
        ellipse(795, 557, 190, 41, '#4b6654') +
        line('M591 579Q794 642 998 579', '#b3ab77', 7, 0.7) +
        line('M642 645Q801 702 948 645', '#506d56', 4, 0.8) +
        times(11, (index) =>
          transform(
            line('M-11 -6L0 7L11 -6M-10 8L0 20L10 8', '#c0b27e', 2, 0.65),
            `translate(${650 + index * 29} ${630 + Math.sin((index / 10) * Math.PI) * 35})`,
          ),
        ),
    ) +
    group(
      'mountain-shaped-lid',
      path(
        'M607 549L658 497L681 505L709 440L742 458L782 364L812 432L839 406L863 461L899 433L927 491L960 484L984 550Q793 598 607 549Z',
        'url(#bronze)',
        1,
        texture,
      ) +
        path(
          'M658 536L708 453L719 512L749 475L783 378L784 479L751 548Z',
          '#b1ac7d',
          0.65,
          texture,
        ) +
        path('M793 555L840 421L852 491L874 474L901 538Z', '#54705c', 0.7, texture) +
        line('M711 482L696 524M776 435L756 512M906 481L922 519', '#425e4c', 5, 0.7) +
        times(9, (index) =>
          ellipse(677 + index * 29, 540 + Math.sin(index) * 7, 5, 3, '#405e4b', 0.8),
        ),
    )
  )
}

function goBoard() {
  let board =
    path('M0 0L516 0L516 464L0 464Z', 'url(#wood)', 1, texture) +
    path('M0 464L516 464L516 489L0 489Z', '#6c553c')
  board += times(19, (index) =>
    line(
      `M${27 + index * 25.5} 27L${27 + index * 25.5} 437M27 ${27 + index * 22.8}L486 ${27 + index * 22.8}`,
      '#5d583c',
      1.5,
      0.7,
    ),
  )
  board += [
    [4, 4],
    [10, 4],
    [16, 4],
    [4, 10],
    [10, 10],
    [16, 10],
    [4, 16],
    [10, 16],
    [16, 16],
  ]
    .map(([column, row]) =>
      ellipse(27 + (column - 1) * 25.5, 27 + (row - 1) * 22.8, 3.5, 3.5, '#5b563b'),
    )
    .join('')
  board += [
    [4, 4, 0],
    [5, 5, 1],
    [4, 6, 0],
    [13, 4, 1],
    [14, 5, 0],
    [15, 4, 1],
    [13, 6, 1],
    [8, 13, 0],
    [9, 13, 1],
    [10, 12, 0],
    [8, 14, 1],
    [9, 15, 0],
  ]
    .map(
      ([column, row, light]) =>
        ellipse(
          27 + (column - 1) * 25.5,
          27 + (row - 1) * 22.8,
          11,
          10,
          light ? '#d9d6be' : '#3d4940',
          1,
          texture,
        ) +
        ellipse(
          24 + (column - 1) * 25.5,
          24 + (row - 1) * 22.8,
          3,
          2,
          light ? '#eeead2' : '#879586',
          0.5,
        ),
    )
    .join('')
  return (
    group('board-shadow', wash('M330 777Q764 729 1220 824Q1081 912 474 900Z', '#737c62', 0.16)) +
    group(
      'nineteen-line-go-board',
      transform(board, 'translate(433 383) skewY(-11) skewX(15) scale(1 .88)'),
    ) +
    group(
      'stone-bowls',
      [
        [1032, 441, '#d9d8bd'],
        [1179, 599, '#3c4940'],
      ]
        .map(([horizontal, vertical, color], index) =>
          transform(
            path('M-78 0Q-65 93 0 95Q65 91 78 0Z', 'url(#wood)', 1, texture) +
              ellipse(0, 0, 78, 31, '#756449') +
              times(19, (stone) =>
                ellipse(
                  Math.sin(stone * 2.4) * 59 * Math.sqrt(stone / 19),
                  Math.cos(stone * 2.4) * 19 * Math.sqrt(stone / 19),
                  12,
                  8,
                  color,
                  1,
                  texture,
                ),
              ) +
              (index ? '' : ellipse(65, 93, 63, 22, '#a88e60', 1, texture)),
            `translate(${horizontal} ${vertical})`,
          ),
        )
        .join(''),
    ) +
    group(
      'folding-fan',
      transform(
        path('M0 0L-173 -136Q0 -281 173 -136Z', 'url(#paper)', 1, texture) +
          times(13, (index) => {
            const angle = -0.9 + index * 0.15
            return line(
              `M0 0L${Math.sin(angle) * 217} ${-Math.cos(angle) * 217}`,
              '#987d52',
              1.6,
              0.75,
            )
          }) +
          line('M0 0L-173 -136M0 0L173 -136', '#765d3e', 6) +
          ellipse(0, 0, 5, 5, '#61523b'),
        'translate(981 867) rotate(24) scale(.72)',
      ),
    )
  )
}

function wheelbarrow() {
  const wheel =
    path(
      'M0 -124A111 124 0 1 1 -1 -124ZM0 -86A78 86 0 1 0 1 -86Z',
      '#6f6445',
      1,
      `fill-rule="evenodd" ${texture}`,
    ) + ellipse(0, 0, 97, 109, 'none', 1, 'stroke="#b49460" stroke-width="7"')
  const spokes = times(10, (index) => {
    const angle = (index * Math.PI * 2) / 10
    return line(`M0 0L${Math.cos(angle) * 91} ${Math.sin(angle) * 103}`, '#9e7e4e', 9)
  })
  return (
    group('ground', wash('M345 831Q794 774 1260 833Q1171 904 404 899Z', '#798166', 0.16)) +
    group(
      'single-wheel',
      transform(
        wheel + spokes + ellipse(0, 0, 24, 25, '#716243') + ellipse(0, 0, 9, 10, '#4d5540'),
        'translate(614 742)',
      ),
    ) +
    group(
      'wooden-chassis',
      path('M526 576L1249 536L1251 554L522 599Z', 'url(#wood)', 1, texture) +
        path('M525 637L1256 598L1257 617L525 662Z', 'url(#wood)', 1, texture) +
        path('M559 591L577 588L630 739L609 747Z', '#7c6241') +
        path('M943 596L962 596L1001 847L975 847Z', 'url(#wood)') +
        path('M952 774L1093 731L1099 745L958 792Z', '#8c7047') +
        path('M515 496L963 467L1011 585L546 620Z', '#a68659', 1, texture) +
        path('M546 620L1011 585L1008 632L544 663Z', '#7d643f', 1, texture) +
        times(8, (index) =>
          line(`M${566 + index * 58} 509L${594 + index * 58} 606`, '#5b573b', 2.5, 0.5),
        ),
    ) +
    group(
      'grain-sacks',
      [
        [631, 537, 1],
        [812, 526, 0.95],
        [728, 422, 0.85],
      ]
        .map(([horizontal, vertical, scale], index) =>
          transform(
            path(
              'M-85 25Q-93 -42 -52 -110L-29 -132L-45 -156Q0 -173 44 -156L30 -132L57 -108Q92 -30 80 27Q10 61 -85 25Z',
              index % 2 ? '#bca579' : '#cbb78d',
              1,
              texture,
            ) +
              line('M-28 -131Q0 -121 30 -131M-36 -141L37 -141', '#8d7851', 4) +
              brush(
                [
                  [-57, 17],
                  [-71, -35],
                  [-49, -76],
                  [-33, -107],
                ],
                9,
                '#94875c',
                0.5,
              ) +
              brush(
                [
                  [41, -99],
                  [59, -68],
                  [64, -26],
                  [58, 12],
                ],
                8,
                '#e1cda1',
                0.5,
              ),
            `translate(${horizontal} ${vertical}) scale(${scale})`,
          ),
        )
        .join(''),
    )
  )
}

function loquatLeaf(horizontal, vertical, angle, scale, color) {
  const edge = times(
    10,
    (index) => `L${-29 - Math.sin((index / 9) * Math.PI) * 23} ${-25 - index * 17}l5 -7`,
  )
  return transform(
    path(
      'M0 0Q-25 -4 -30 -24' + edge + 'Q-23 -221 -8 -226Q47 -172 36 -74Q26 -22 0 0Z',
      color,
      1,
      texture,
    ) +
      line('M0 -4Q-17 -99 -9 -210', '#bdc080', 2, 0.65) +
      times(7, (index) =>
        line(
          `M${-11 + Math.sin(index) * 3} ${-35 - index * 23}l-28 -17m28 17l31 -25`,
          '#b6bd7e',
          1,
          0.4,
        ),
      ),
    `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
  )
}

function loquats() {
  return (
    group(
      'woody-branch',
      brush(
        [
          [418, 818],
          [644, 724],
          [843, 570],
          [1011, 277],
        ],
        47,
        '#76674f',
      ) +
        brush(
          [
            [773, 617],
            [900, 603],
            [1051, 572],
            [1193, 622],
          ],
          19,
          '#817552',
        ) +
        brush(
          [
            [835, 534],
            [724, 464],
            [684, 388],
            [664, 283],
          ],
          17,
          '#7a7053',
        ) +
        line('M545 762Q698 694 762 629', '#b1a17b', 4, 0.6),
    ) +
    group(
      'broad-serrated-leaves',
      [
        [697, 407, -45, 1, '#637f57'],
        [856, 479, 17, 1.2, '#5a7756'],
        [980, 336, 65, 1, '#7c8b5b'],
        [1027, 598, 111, 1.1, '#688259'],
        [770, 611, -111, 1.05, '#829364'],
        [1063, 591, 44, 0.85, '#506e50'],
      ]
        .map((entry) => loquatLeaf(...entry))
        .join(''),
    ) +
    group(
      'connected-fruit-stalks',
      line('M920 447Q974 495 1006 534Q1066 576 1135 612', '#8c8355', 5) +
        [
          [877, 516, 1.1, 920, 447],
          [951, 532, 1, 944, 478],
          [906, 602, 1.05, 976, 509],
          [979, 611, 0.92, 1006, 534],
          [1047, 652, 0.9, 1067, 577],
          [1106, 657, 0.95, 1110, 600],
        ]
          .map(([horizontal, vertical, scale, rootX, rootY], index) => {
            const angle = ((index * 13 - 24) * Math.PI) / 180
            const endX = horizontal + Math.sin(angle) * 48 * scale
            const endY = vertical - Math.cos(angle) * 48 * scale
            return line(
              `M${rootX} ${rootY}Q${endX + 9} ${rootY + 7} ${endX} ${endY}`,
              '#8c8355',
              3.5,
            )
          })
          .join(''),
    ) +
    group(
      'loquat-clusters',
      [
        [877, 516, 1.1],
        [951, 532, 1],
        [906, 602, 1.05],
        [979, 611, 0.92],
        [1047, 652, 0.9],
        [1106, 657, 0.95],
      ]
        .map(([horizontal, vertical, scale], index) =>
          transform(
            ellipse(0, 0, 39, 48, 'url(#fruit)', 1, texture) +
              path('M-8 35L-13 45L-3 44L1 51L8 43L15 43L8 34Z', '#7b7049') +
              brush(
                [
                  [-23, -23],
                  [-31, -3],
                  [-26, 14],
                  [-21, 21],
                ],
                8,
                '#ead29a',
                0.4,
              ),
            `translate(${horizontal} ${vertical}) rotate(${index * 13 - 24}) scale(${scale})`,
          ),
        )
        .join(''),
    )
  )
}

function morningGlory() {
  const bloom = (horizontal, vertical, scale, angle) =>
    transform(
      path(
        'M0 11Q-65 45 -100 -7Q-121 -48 -73 -69Q-42 -121 5 -90Q64 -111 82 -60Q132 -20 78 22Q34 57 0 11Z',
        'url(#flower)',
        1,
        texture,
      ) +
        path('M-21 -15Q-7 -39 8 -36Q30 -19 25 1Q6 17 -12 1Z', '#e6dfd2') +
        ellipse(5, -12, 7, 6, '#ae9ab0') +
        times(5, (index) =>
          transform(
            brush(
              [
                [0, -12],
                [-10, -36],
                [-6, -58],
                [1, -85],
              ],
              7,
              '#d1bdcd',
              0.45,
            ),
            `rotate(${index * 72} 0 -12)`,
          ),
        ),
      `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
    )
  return (
    group(
      'bamboo-trellis',
      path(
        'M631 843L636 275L655 275L651 843Z M938 842L928 267L945 267L958 842Z',
        'url(#wood)',
        1,
        texture,
      ) +
        path(
          'M469 383L1106 357L1107 373L470 400ZM476 639L1135 613L1136 631L478 657Z',
          'url(#wood)',
          1,
          texture,
        ) +
        line('M625 381L662 400M627 395L660 380M923 370L954 385M929 383L952 366', '#7a7351', 4),
    ) +
    group(
      'twining-vine',
      line(
        'M646 856Q735 770 639 677Q564 609 675 541Q740 502 653 403Q605 343 689 289M680 541Q827 507 933 445Q986 408 938 341M934 615Q1058 597 1069 519',
        '#73855b',
        5,
        0.9,
      ),
    ) +
    group(
      'heart-shaped-leaves',
      [
        [658, 732, -35, 1.05],
        [706, 574, 49, 1.1],
        [860, 497, -25, 0.9],
        [965, 392, 42, 0.8],
        [639, 418, -73, 0.87],
        [980, 618, 70, 0.95],
      ]
        .map(([horizontal, vertical, angle, scale], index) =>
          transform(
            path(
              'M0 0Q-52 -39 -61 -81Q-62 -124 -20 -115Q3 -109 8 -89Q33 -121 63 -96Q87 -57 0 0Z',
              index % 2 ? '#6d8d67' : '#8b9c6b',
              1,
              texture,
            ) + line('M0 -5L7 -88M1 -22L-40 -79M4 -40L49 -77', '#c5c491', 1.5, 0.6),
            `translate(${horizontal} ${vertical}) rotate(${angle}) scale(${scale})`,
          ),
        )
        .join(''),
    ) +
    group(
      'trumpet-flower-stems',
      line(
        'M695 540Q772 572 813 592M935 444Q1003 462 1060 497M653 403Q571 401 532 459',
        '#839669',
        6,
      ),
    ) +
    group(
      'purple-and-blue-trumpets',
      bloom(818, 598, 1, 12) + bloom(1062, 493, 0.8, -19) + bloom(526, 459, 0.76, 17),
    ) +
    group(
      'root-grass',
      brush(
        [
          [523, 850],
          [647, 811],
          [745, 870],
          [835, 842],
        ],
        18,
        '#7a8a61',
        0.45,
      ),
    )
  )
}

function catAndButterfly() {
  const bodyShape =
    'M550 747C516 673 550 570 634 548C724 520 795 583 841 594Q861 543 899 532Q956 549 963 637Q970 710 922 765Q833 807 713 793Q608 804 550 747Z'
  const tailShape =
    'M599 741C529 793 418 780 413 690C410 632 451 590 491 610Q526 627 505 655Q499 665 490 660Q507 639 488 631C455 617 439 654 447 693C461 748 521 744 573 716Z'
  const tabbyMark = (shape, opacity = 0.85) => path(shape, '#5e4b3d', opacity, texture)
  return (
    '<defs><linearGradient id="tabby-fur" x1="15%" y1="10%" x2="80%" y2="100%"><stop stop-color="#c5b18b"/><stop offset=".5" stop-color="#a58a65"/><stop offset="1" stop-color="#75624e"/></linearGradient><clipPath id="tabby-body-clip">' +
    path(bodyShape) +
    '</clipPath><clipPath id="tabby-tail-clip">' +
    path(tailShape) +
    '</clipPath></defs>' +
    group(
      'ground-and-grass',
      wash('M390 828Q824 790 1161 840Q1010 879 438 863Z', '#7a8467', 0.14) +
        brush(
          [
            [449, 835],
            [437, 795],
            [408, 785],
            [391, 781],
          ],
          6,
          '#7d8d60',
          0.7,
        ) +
        brush(
          [
            [455, 836],
            [474, 800],
            [463, 773],
            [450, 762],
          ],
          6,
          '#7d8d60',
          0.7,
        ),
    ) +
    group(
      'ringed-shorthaired-tail',
      path(tailShape, 'url(#tabby-fur)', 1, texture) +
        '<g clip-path="url(#tabby-tail-clip)">' +
        [
          'M424 638L465 662L457 681L415 662Z',
          'M411 689L451 699L459 720L416 716Z',
          'M442 746L467 719L488 733L467 765Z',
          'M502 784L508 744L532 742L530 786Z',
          'M554 776L545 739L569 726L585 759Z',
        ]
          .map((shape) => tabbyMark(shape))
          .join('') +
        '</g>',
    ) +
    group(
      'crouching-tabby-body',
      path(bodyShape, 'url(#tabby-fur)', 1, texture) +
        '<g clip-path="url(#tabby-body-clip)">' +
        [
          'M587 548Q563 596 587 643Q598 661 614 666Q586 610 618 546Z',
          'M632 536Q606 583 629 632L649 650Q636 597 666 543Z',
          'M687 547Q665 593 698 644L719 656Q699 602 718 560Z',
          'M743 574Q728 622 763 659L782 666Q754 618 778 586Z',
          'M806 591Q787 629 817 666L834 667Q817 630 840 605Z',
          'M576 682Q610 656 650 672Q664 680 671 693Q623 676 585 705Z',
          'M563 720Q608 697 647 722L660 737Q613 722 574 742Z',
          'M716 719Q738 691 728 669Q757 694 741 727Z',
          'M773 735Q795 705 786 681Q818 714 798 747Z',
        ]
          .map((shape) => tabbyMark(shape, 0.68))
          .join('') +
        times(90, (index) => {
          const horizontal = 554 + (index % 15) * 25 + Math.sin(index * 2.3) * 7
          const vertical = 553 + Math.floor(index / 15) * 35 + Math.cos(index * 1.7) * 9
          return line(
            `M${horizontal} ${vertical}q-3 6 1 12`,
            index % 3 ? '#d0ba92' : '#6f5c48',
            1,
            0.22,
          )
        }) +
        '</g>' +
        path(
          'M868 589Q885 586 902 597L925 641Q924 692 898 716Q865 693 854 662Z',
          '#d7c9aa',
          0.85,
          texture,
        ) +
        path(
          'M591 750Q615 705 655 704Q692 722 682 765L730 783Q764 780 775 796Q775 813 749 817L654 808Q609 801 591 750Z',
          'url(#tabby-fur)',
          1,
          texture,
        ) +
        tabbyMark('M607 740Q630 723 652 737L663 750Q637 741 616 760Z', 0.8) +
        line('M714 793L713 806M731 794L731 809M747 796L748 810', '#5e5041', 2.4, 0.75) +
        line('M600 652Q574 683 588 713', '#e0cfaa', 3, 0.5),
    ) +
    group(
      'planted-foreleg',
      path(
        'M864 661Q886 650 901 671Q917 711 912 758L912 786Q936 781 949 796Q960 818 932 824L872 819Q856 809 860 786L848 712Z',
        'url(#tabby-fur)',
        1,
        texture,
      ) +
        tabbyMark(
          'M850 705Q878 718 910 704L915 722Q881 733 855 725ZM857 750Q882 761 913 749L913 766Q881 777 860 766Z',
          0.83,
        ) +
        line('M900 803L902 818M917 803L920 820M933 803L936 817', '#5c4d3f', 2.4, 0.85),
    ) +
    group(
      'raised-paw',
      path(
        'M931 592Q961 610 983 586L1027 529Q1033 516 1044 519Q1054 515 1061 523Q1074 522 1078 535Q1088 546 1080 563Q1065 589 1039 613Q997 664 951 659L924 635Z',
        'url(#tabby-fur)',
        1,
        texture,
      ) +
        tabbyMark(
          'M980 588Q1004 598 1021 584L1008 604Q995 617 975 610ZM1021 537L1041 564L1028 579L1009 553Z',
          0.8,
        ) +
        line('M1043 526L1049 543M1057 529L1061 546M1068 537L1069 551', '#65503d', 2.2, 0.85),
    ) +
    group(
      'domestic-tabby-head',
      transform(
        path(
          'M-73 -30Q-91 -71 -86 -121Q-57 -111 -33 -84Q8 -92 43 -70Q70 -104 91 -108L86 -31Q101 1 89 37Q70 79 15 86Q-37 86 -69 51Q-92 16 -73 -30Z',
          'url(#tabby-fur)',
          1,
          texture,
        ) +
          path('M-75 -104Q-72 -75 -61 -57L-39 -72ZM54 -61L76 -90L76 -47Z', '#b79079', 1, texture) +
          path('M-69 -111L-87 -122L-85 -86M77 -105L94 -110L90 -78', '#63513e', 1, texture) +
          path(
            'M-40 35Q-13 20 6 40Q25 25 51 42L48 64Q25 82 2 76Q-26 73 -40 54Z',
            '#e3d6b7',
            1,
            texture,
          ) +
          path('M-59 -6Q-37 -29 -13 -12Q-25 6 -53 1Z', '#c5bb74') +
          path('M18 -15Q45 -40 66 -22Q54 -3 26 -6Z', '#c5bb74') +
          path(
            'M-34 -23Q-26 -12 -32 2L-39 1Q-43 -11 -34 -23ZM44 -34Q51 -21 44 -7L36 -6Q34 -20 44 -34Z',
            '#3a4234',
          ) +
          line('M-61 -6Q-38 -29 -13 -12M18 -15Q44 -40 67 -22', '#4b4a37', 3, 0.95) +
          ellipse(-28, -15, 2.2, 2.2, '#ece5c9') +
          ellipse(47, -24, 2.2, 2.2, '#ece5c9') +
          tabbyMark(
            'M-34 -77Q-29 -52 -17 -35L-22 -62L-9 -48L-1 -65L8 -45L23 -66L18 -28Q36 -52 35 -75L21 -68L10 -80L0 -64L-11 -80L-20 -67Z',
            0.8,
          ) +
          tabbyMark(
            'M-69 -48L-45 -34L-55 -26L-77 -32ZM-79 6L-54 13L-52 25L-77 20ZM75 -53L55 -43L65 -32L83 -39ZM83 1L60 15L60 26L87 14Z',
            0.86,
          ) +
          path('M-9 38Q3 30 16 36L6 47Q-1 48 -9 38Z', '#a47b68') +
          line('M5 47L7 55M7 55Q-2 61 -11 57M7 55Q19 60 27 51', '#605242', 2.1, 0.95) +
          line(
            'M-24 44Q-61 34 -98 34M-26 52Q-69 48 -105 60M-23 59Q-59 65 -84 81M30 40Q64 23 99 24M33 48Q76 39 109 47M33 56Q68 57 99 66',
            '#e2d8bb',
            1.7,
            0.95,
          ) +
          times(12, (index) => {
            const horizontal = -58 + index * 10
            return line(`M${horizontal} 67q-3 6 -1 10`, '#d1bc97', 1.1, 0.55)
          }),
        'translate(913 495) rotate(-9)',
      ),
    ) +
    group(
      'butterfly',
      transform(
        path(
          'M0 0C-9 -38 -38 -54 -43 -28Q-45 -6 -9 8Q-38 7 -27 29Q-9 38 0 0Z',
          '#c88d4c',
          1,
          texture,
        ) +
          path('M0 0C18 -40 44 -40 39 -16Q32 2 9 8Q31 16 16 32Q2 31 0 0Z', '#ab7044', 1, texture) +
          line('M0 -7L0 23M0 -6L-9 -17M1 -6L12 -16', '#61523c', 2.4),
        'translate(1127 367) rotate(24)',
      ),
    )
  )
}
function mandarinDucks() {
  const male =
    path(
      'M-142 24Q-191 -9 -184 -26L-112 -16Q-42 -80 66 -43Q145 -20 126 39Q87 87 -30 69Q-100 62 -142 24Z',
      '#a07a4c',
      1,
      texture,
    ) +
    path('M-120 -11Q-60 -70 39 -44Q46 -22 8 12L-86 21Z', '#4e6c65', 1, texture) +
    path('M-50 13Q-72 -45 -42 -86Q16 -80 15 -2L6 42Z', '#c18a45', 1, texture) +
    line('M-34 -64Q-27 -23 -9 13', '#e2bd6c', 3, 0.75) +
    path('M8 16Q58 -21 76 9L74 54L31 65Z', '#4b536d') +
    line('M22 23L27 57M38 17L45 58', '#dfd8b4', 7) +
    path(
      'M60 22Q91 -21 75 -51Q57 -80 79 -108Q106 -133 141 -106Q165 -88 154 -55L143 -13Q143 27 124 40Z',
      '#8c634a',
      1,
      texture,
    ) +
    path('M77 -100Q100 -127 132 -106L149 -84Q127 -86 108 -64L88 -48L77 -72Z', '#477865') +
    path('M79 -72Q104 -101 142 -87L150 -73Q119 -78 105 -52L84 -34Z', '#ded7b5') +
    path('M92 -30Q108 -46 127 -45L140 -15Q114 4 86 -8Z', '#b77843', 1, texture) +
    ellipse(129, -84, 4, 4, '#333f36') +
    path('M148 -82L180 -73L151 -61Z', '#b7644b') +
    times(7, (index) => line(`M${-118 + index * 15} 31l31 12`, '#d9ba7e', 2, 0.7))
  const female =
    path(
      'M-121 23L-170 -8L-116 -9Q-23 -71 66 -33Q118 -12 106 32Q59 79 -35 63Q-99 54 -121 23Z',
      'url(#feather)',
      1,
      texture,
    ) +
    path(
      'M50 19Q76 -8 61 -39Q42 -77 60 -102Q84 -130 117 -105Q137 -82 121 -49L115 0Q99 28 81 37Z',
      '#8c8a72',
      1,
      texture,
    ) +
    path('M117 -87L150 -76L118 -69Z', '#7c8066') +
    ellipse(105, -89, 12, 10, '#dedcc0') +
    ellipse(106, -89, 5, 5, '#39483e') +
    line('M93 -90L64 -96', '#d6d5b9', 4) +
    times(23, (index) =>
      ellipse(
        -80 + (index % 7) * 23,
        8 + Math.floor(index / 7) * 13 + Math.sin(index) * 4,
        7,
        3,
        '#bcb99a',
        0.65,
      ),
    ) +
    path('M-94 12Q-26 -43 39 -7Q15 39 -76 36Z', '#777f69', 0.75, texture) +
    times(7, (index) => line(`M${-74 + index * 15} 9l22 13`, '#c4bea0', 1.8, 0.65))
  return (
    group(
      'water-wash',
      wash('M303 731Q807 620 1318 760Q1234 851 414 882Z', '#7c9c90', 0.13) +
        line('M417 807Q620 846 831 808M763 700Q1007 741 1225 696', '#75998d', 3, 0.5) +
        line('M423 829Q587 860 739 834M928 749Q1081 767 1238 737', '#9baf98', 2, 0.5),
    ) +
    group('female-mandarin-duck', transform(female, 'translate(1021 642) rotate(-5) scale(.9)')) +
    group('male-mandarin-duck', transform(male, 'translate(650 735) rotate(-5)')) +
    group(
      'reeds',
      brush(
        [
          [382, 830],
          [392, 665],
          [360, 508],
          [356, 359],
        ],
        10,
        '#8a9566',
      ) +
        brush(
          [
            [413, 827],
            [473, 656],
            [456, 483],
            [490, 327],
          ],
          8,
          '#819368',
        ) +
        brush(
          [
            [400, 831],
            [452, 691],
            [492, 621],
            [554, 598],
          ],
          8,
          '#6d8c64',
        ) +
        path(
          'M390 738Q321 631 333 527Q381 597 390 738ZM432 710Q441 556 527 496Q470 598 432 710Z',
          '#8e9d6a',
          0.85,
          texture,
        ) +
        transform(
          times(17, (index) =>
            brush(
              [
                [0, index * 5],
                [30, index * 5 + 7],
                [44, index * 5 + 22],
                [54, index * 5 + 31],
              ],
              6,
              '#b29b6e',
              0.65,
            ),
          ),
          'translate(359 354) rotate(8)',
        ),
    )
  )
}

function bambooWindow() {
  const bamboo =
    brush(
      [
        [733, 758],
        [752, 568],
        [702, 414],
        [743, 274],
      ],
      20,
      '#5c7d62',
    ) +
    brush(
      [
        [878, 742],
        [894, 529],
        [872, 395],
        [904, 306],
      ],
      14,
      '#748b64',
    ) +
    times(6, (index) =>
      line(
        `M${741 - Math.sin(index) * 9} ${350 + index * 62}l17 -2M${884 + Math.sin(index) * 6} ${391 + index * 58}l13 0`,
        '#c0c092',
        2.5,
        0.8,
      ),
    ) +
    [
      [733, 399, -68, 0.85],
      [738, 437, 51, 0.75],
      [742, 535, -73, 0.7],
      [868, 433, 73, 0.8],
      [883, 540, 44, 0.9],
      [887, 607, -46, 0.65],
    ]
      .map((entry) => leaf(...entry))
      .join('')
  return (
    group('bamboo-behind-opening', bamboo, 'clip-path="url(#window-opening)"') +
    group(
      'white-plaster-wall',
      path(
        'M413 283L1189 283L1189 824L413 824ZM604 522A198 198 0 1 0 1000 522A198 198 0 1 0 604 522Z',
        '#d5d2b8',
        1,
        `fill-rule="evenodd" ${texture}`,
      ) +
        path('M413 783L1189 783L1189 827L413 827Z', '#9b9e87', 1, texture) +
        brush(
          [
            [440, 744],
            [500, 723],
            [530, 734],
            [552, 714],
          ],
          28,
          '#a8ad93',
          0.4,
        ) +
        path(
          'M594 522A208 208 0 1 0 1010 522A208 208 0 1 0 594 522ZM622 522A180 180 0 1 1 982 522A180 180 0 1 1 622 522Z',
          '#7e9082',
          1,
          'fill-rule="evenodd"',
        ) +
        path(
          'M607 522A195 195 0 1 0 997 522A195 195 0 1 0 607 522ZM616 522A186 186 0 1 1 988 522A186 186 0 1 1 616 522Z',
          '#b9bda3',
          0.8,
          'fill-rule="evenodd"',
        ),
    ) +
    group(
      'ice-crack-window-lattice',
      line(
        'M611 450L723 441L774 346M723 441L766 527L680 612L641 582M766 527L863 487L961 412M863 487L902 580L973 609M902 580L808 695M680 612L722 688M766 527L802 597L902 580',
        '#687b71',
        9,
        0.9,
      ),
      'clip-path="url(#window-opening)"',
    ) +
    group(
      'gray-tile-cap',
      path('M390 269L1208 269L1231 293L367 293Z', 'url(#roof)', 1, texture) +
        line('M376 296L1222 296', '#53685b', 7) +
        times(28, (index) => line(`M${397 + index * 29} 270l-7 16`, '#b6bca5', 2, 0.6)),
    ) +
    group(
      'grass-at-wall',
      brush(
        [
          [1113, 851],
          [1102, 789],
          [1052, 765],
          [1028, 753],
        ],
        10,
        '#7a8b62',
        0.7,
      ) +
        brush(
          [
            [1125, 851],
            [1133, 805],
            [1164, 778],
            [1195, 768],
          ],
          9,
          '#89966c',
          0.65,
        ),
    )
  )
}

function archway() {
  return (
    group(
      'distant-houses',
      wash(
        'M330 677L440 604L541 661L548 802L330 802Z M1043 645L1168 587L1283 651L1280 795L1044 795Z',
        '#8e9b8c',
        0.25,
      ) + line('M331 677L440 604L543 661M1042 645L1169 587L1283 651', '#697e71', 5, 0.3),
    ) +
    group(
      'stone-plinths',
      [
        [428, 844],
        [641, 851],
        [965, 851],
        [1170, 844],
      ]
        .map(
          ([horizontal, vertical]) =>
            path(
              `M${horizontal - 36} ${vertical - 58}L${horizontal + 33} ${vertical - 58}L${horizontal + 44} ${vertical}L${horizontal - 46} ${vertical}Z`,
              '#a4a78e',
              1,
              texture,
            ) +
            line(
              `M${horizontal - 38} ${vertical - 9}L${horizontal + 36} ${vertical - 9}`,
              '#758979',
              3,
            ),
        )
        .join(''),
    ) +
    group(
      'red-timber-archway',
      [
        [419, 517, 28, 792],
        [625, 338, 34, 802],
        [948, 338, 34, 802],
        [1154, 517, 28, 792],
      ]
        .map(
          ([horizontal, vertical, width, bottom]) =>
            path(
              `M${horizontal} ${vertical}L${horizontal + width} ${vertical}L${horizontal + width} ${bottom}L${horizontal} ${bottom}Z`,
              '#a26650',
              1,
              texture,
            ) +
            line(
              `M${horizontal + 6} ${vertical + 10}L${horizontal + 6} ${bottom - 12}`,
              '#c99b79',
              3,
              0.6,
            ),
        )
        .join('') +
        path(
          'M433 532L641 532L641 566L433 566ZM967 532L1168 532L1168 566L967 566ZM642 358L965 358L965 398L642 398ZM643 497L962 497L962 535L643 535Z',
          '#9b654d',
          1,
          texture,
        ) +
        path('M676 410L929 410L929 476L676 476Z', '#6b8071', 1, texture) +
        line('M685 418L919 418L919 468L685 468Z', '#c2ad77', 3, 0.8) +
        ellipse(803, 442, 26, 20, '#a1a383', 0.5) +
        times(4, (index) => path(`M${698 + index * 57} 475l-10 23l33 0l-10 -23Z`, '#b28a5a')) +
        line('M452 574L598 574M1006 574L1143 574', '#bda16c', 4),
    ) +
    group(
      'three-roof-crowns',
      roof(803, 271, 419, 83) + roof(534, 455, 216, 78) + roof(1070, 455, 216, 78),
    ) +
    group(
      'carved-brackets',
      [
        [642, 373],
        [963, 373],
        [435, 551],
        [1168, 551],
      ]
        .map(([horizontal, vertical]) =>
          path(
            `M${horizontal - 37} ${vertical + 10}L${horizontal + 37} ${vertical + 10}L${horizontal + 26} ${vertical + 35}L${horizontal + 12} ${vertical + 35}L${horizontal + 12} ${vertical + 54}L${horizontal - 12} ${vertical + 54}L${horizontal - 12} ${vertical + 35}L${horizontal - 26} ${vertical + 35}Z`,
            '#a98056',
            1,
            texture,
          ),
        )
        .join(''),
    ) +
    group(
      'cobbled-lane',
      wash('M656 817L951 817Q997 876 1214 921L397 921Q641 866 656 817Z', '#a59b7c', 0.18) +
        times(16, (index) =>
          line(
            `M${535 + (index % 5) * 107 + Math.floor(index / 5) * 13} ${852 + Math.floor(index / 5) * 20}l50 -2`,
            '#7e8c79',
            2,
            0.28,
          ),
        ),
    )
  )
}

const studies = [
  {
    id: 'ring-sword-and-lacquer-shield',
    name: '环刀守阵',
    category: 'color',
    theme: '军旅兵器 · 刀盾意象',
    note: '环首长刀与漆盾 · 铁刃木胎 · 非制式复原',
    draw: ringSword,
  },
  {
    id: 'bronze-ge-and-helmet',
    name: '铜戈遗影',
    category: 'color',
    theme: '军旅器用 · 铜戈与札甲胄',
    note: '长胡横援与木柲 · 秦式札甲胄结构参考 · 原创设色意象',
    draw: bronzeGe,
  },
  {
    id: 'jade-cong-ritual-vessel',
    name: '玉琮凝礼',
    category: 'color',
    theme: '礼制器物 · 方琮意象',
    note: '外方内圆与可见玉质内壁 · 分节玉面 · 抽象刻纹',
    draw: jadeCong,
  },
  {
    id: 'mountain-lid-incense-burner',
    name: '博山烟岚',
    category: 'color',
    theme: '居室陈设 · 山形香炉',
    note: '山形铜盖与承盘 · 烟气虚实 · 原创器形',
    draw: incenseBurner,
  },
  {
    id: 'go-board-bowls-and-fan',
    name: '棋枰清趣',
    category: 'color',
    theme: '文人游艺 · 围棋折扇',
    note: '十九路木枰 · 黑白棋子与棋罐 · 留白折扇',
    draw: goBoard,
  },
  {
    id: 'single-wheel-grain-barrow',
    name: '独轮载谷',
    category: 'color',
    theme: '农桑交通 · 木车负粮',
    note: '独轮辐轴与木架 · 双柄支腿 · 麻袋叠放',
    draw: wheelbarrow,
  },
  {
    id: 'golden-loquats-on-branch',
    name: '枇杷金实',
    category: 'color',
    theme: '四时花果 · 枇杷熟枝',
    note: '金赭果皮 · 厚叶锯缘 · 果柄与萼端',
    draw: loquats,
  },
  {
    id: 'morning-glory-on-trellis',
    name: '牵牛晓露',
    category: 'color',
    theme: '庭院花木 · 牵牛攀篱',
    note: '青紫喇叭花 · 心形叶与缠藤 · 竹篱承接',
    draw: morningGlory,
  },
  {
    id: 'ink-cat-and-butterfly',
    name: '狸花戏蝶',
    category: 'figures',
    theme: '中华田园猫 · 短毛狸花',
    note: '褐灰短毛、额头 M 纹、颊纹与环尾，伏身举爪望蝶；中华田园猫原创意象。',
    draw: catAndButterfly,
  },
  {
    id: 'mandarin-ducks-among-reeds',
    name: '芦汀鸳侣',
    category: 'figures',
    theme: '花鸟水岸 · 芦塘鸳鸯',
    note: '雌雄羽色与体态有别 · 水线接触 · 芦穗陪景',
    draw: mandarinDucks,
  },
  {
    id: 'bamboo-through-lattice-window',
    name: '漏窗竹影',
    category: 'ink',
    theme: '园林古建 · 粉墙漏窗',
    note: '圆窗透孔与冰裂格 · 瓦帽粉墙 · 窗后竹叶',
    draw: bambooWindow,
  },
  {
    id: 'timber-archway-in-old-lane',
    name: '古巷牌坊',
    category: 'ink',
    theme: '建筑历史空间 · 古巷坊门',
    note: '四柱三间与三重檐冠 · 木枋石础 · 原创无字匾',
    draw: archway,
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
console.log('Generated twelve courtyard ink studies')
