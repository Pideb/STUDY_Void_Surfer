// Review-only articulation maps using the exact user-selected PNGs.
window.BOSS_ANIMATION_RIGS = [
  {
    id: 'crystal-gates', label: '수정', version: '새 디자인', color: '#8bd7ff',
    src: '../2026-10-27-boss-redesign/crystal-gates-candidate.png',
    detail: '코어 셔터와 네 수정 날개가 벌어지고, 충전 후 부채꼴 파편을 발사합니다.',
    core: [.385,.485,.045], muzzle: [.06,.48],
    parts: [
      { pivot: [.55,.40], poly: [[.31,.29],[.49,.10],[.65,.35],[.55,.46]], side: -1, amplitude: .025, open: .10 },
      { pivot: [.55,.58], poly: [[.31,.70],[.48,.98],[.65,.68],[.55,.53]], side: 1, amplitude: .025, open: .10 },
      { pivot: [.79,.17], poly: [[.61,0],[.91,.05],[.91,.27],[.73,.29]], side: -1, amplitude: .02, open: .09 },
      { pivot: [.79,.82], poly: [[.65,.72],[.91,.67],[.91,.99],[.65,.99]], side: 1, amplitude: .02, open: .09 },
    ],
  },
  {
    id: 'industrial-void', label: '산업', version: '기존 디자인 유지', color: '#ffad58',
    src: '../../../public/assets/game/stages/industrial-void/boss.png',
    detail: '기존 요새의 위쪽·중앙 포신이 따로 조준하고, 번갈아 반동을 일으킵니다.',
    core: [.61,.51,.038], muzzle: [.035,.51],
    parts: [
      { pivot: [.43,.39], poly: [[.01,.33],[.40,.25],[.49,.33],[.45,.44],[.01,.43]], side: -1, amplitude: .012, open: .045, recoil: .026 },
      { pivot: [.42,.52], poly: [[.005,.45],[.42,.44],[.49,.50],[.45,.61],[.005,.58]], side: 1, amplitude: .012, open: .035, recoil: .023 },
    ],
  },
  {
    id: 'signal-monoliths', label: '신호', version: '새 디자인', color: '#d49bff',
    src: '../2026-10-27-boss-redesign/signal-monoliths-candidate.png',
    detail: '분리 장갑이 전개되고, 앞뒤 신호등이 순서대로 점등된 뒤 펄스를 발사합니다.',
    core: [.12,.50,.035], muzzle: [.04,.50],
    parts: [
      { pivot: [.48,.48], poly: [[.30,.26],[.56,.35],[.53,.66],[.30,.77]], side: -1, amplitude: .012, open: .032, slide: .018 },
      { pivot: [.69,.50], poly: [[.53,.29],[.79,.38],[.78,.63],[.54,.72]], side: 1, amplitude: .012, open: .03, slide: .025 },
      { pivot: [.66,.24], poly: [[.51,.14],[.67,.07],[.82,.23],[.67,.36],[.52,.28]], side: -1, amplitude: .026, open: .05, lift: .018 },
      { pivot: [.66,.76], poly: [[.51,.73],[.67,.63],[.82,.75],[.67,.92],[.52,.84]], side: 1, amplitude: .026, open: .05, lift: .018 },
    ],
  },
  {
    id: 'gravity-well', label: '중력', version: '기존 디자인 유지', color: '#be9bff',
    src: '../../../public/assets/game/stages/gravity-well/boss.png',
    detail: '기존 초승달 장갑이 미세하게 열리고, 렌즈와 중력 구슬이 서로 다른 속도로 회전합니다.',
    core: [.43,.50,.115], muzzle: [.24,.50],
    parts: [
      { pivot: [.71,.35], poly: [[.18,.07],[.49,.01],[.73,.15],[.84,.36],[.68,.39],[.48,.23],[.27,.21]], side: -1, amplitude: .008, open: .038 },
      { pivot: [.71,.70], poly: [[.18,.89],[.40,.98],[.68,.91],[.84,.74],[.70,.61],[.49,.78],[.26,.77]], side: 1, amplitude: .008, open: .038 },
    ],
  },
  {
    id: 'abyssal-beast', label: '심해', version: '새 디자인', color: '#62f1ee',
    src: '../2026-10-27-boss-redesign/abyssal-beast-candidate.png',
    detail: '턱을 벌려 포효하고, 지느러미와 촉수·꼬리가 서로 다른 박자로 움직입니다.',
    core: [.115,.43,.055], muzzle: [.065,.43],
    parts: [
      { pivot: [.285,.48], poly: [[.015,.43],[.16,.44],[.31,.48],[.25,.65],[.09,.69],[.015,.59]], side: -1, amplitude: .016, open: .19, jaw: true },
      { pivot: [.43,.43], poly: [[.34,.38],[.53,.42],[.75,.94],[.55,.86],[.43,.67]], side: 1, amplitude: .027, open: .07 },
      { pivot: [.34,.20], poly: [[.24,.23],[.35,.03],[.50,.015],[.46,.24]], side: -1, amplitude: .02, open: .04 },
    ],
  },
  {
    id: 'solar-forge', label: '태양', version: '새 디자인', color: '#ffb24f',
    src: '../2026-10-27-boss-redesign/solar-forge-candidate.png',
    detail: '방열판이 펼쳐지고 코어가 달아오른 뒤 열탄을 발사하며, 포구와 본체에 반동이 생깁니다.',
    core: [.64,.50,.075], muzzle: [.08,.50],
    parts: [
      { pivot: [.40,.29], poly: [[.26,.24],[.38,.04],[.59,0],[.52,.18],[.45,.30]], side: -1, amplitude: .012, open: .12 },
      { pivot: [.40,.73], poly: [[.26,.73],[.39,.99],[.57,.99],[.52,.84],[.45,.70]], side: 1, amplitude: .012, open: .12 },
      { pivot: [.78,.29], poly: [[.68,.19],[.91,.08],[.85,.30],[.74,.34]], side: -1, amplitude: .015, open: .10 },
      { pivot: [.78,.73], poly: [[.68,.77],[.89,.98],[.85,.74],[.74,.68]], side: 1, amplitude: .015, open: .10 },
      { pivot: [.32,.44], poly: [[.005,.47],[.13,.33],[.28,.30],[.37,.40],[.31,.48]], side: 1, amplitude: .006, open: .035, recoil: .012 },
      { pivot: [.32,.58], poly: [[.005,.54],[.14,.68],[.28,.69],[.37,.61],[.31,.53]], side: -1, amplitude: .006, open: .035, recoil: .012 },
    ],
  },
];
