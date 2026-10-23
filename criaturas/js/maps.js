'use strict';

/* ══════════════════════════════════════
   LEYENDA DE TILES
══════════════════════════════════════ */
const LEGEND = {
  '.': 'grass', ',': 'tall', '=': 'path', 'T': 'tree', '~': 'water', ':': 'sand', '*': 'flowers',
  'F': 'fence', 'L': 'ledge', 'S': 'sign', 'R': 'rock', '#': 'cavewall', '_': 'cave', 'o': 'boulder',
  'W': 'wall', 'f': 'floor', 'c': 'counter', 'K': 'shelf', 't': 'table', 'P': 'pc', 'H': 'healer',
  'B': 'bed', 'p': 'plant', 'm': 'mat', 'r': 'carpet', 'g': 'gymfloor', 'X': 'void', 'q': 'shrine',
};
const SOLID_TILES = new Set(['tree', 'water', 'fence', 'sign', 'rock', 'cavewall', 'boulder', 'wall', 'counter', 'shelf', 'table', 'pc', 'healer', 'bed', 'plant', 'void']);
const ENCOUNTER_TILES = { tall: 1, cave: 0.45 };

const BUILDING_KINDS = {
  house:  { w: 4, h: 3, door: 1, roof: '#d8584a', wall: '#f4e6c8' },
  house2: { w: 4, h: 3, door: 2, roof: '#4a7ad8', wall: '#f4e6c8' },
  lab:    { w: 6, h: 4, door: 3, roof: '#8a8a9a', wall: '#f0f0f4', sign: 'LAB', signColor: '#3a5a9a' },
  center: { w: 6, h: 4, door: 3, roof: '#e05a5a', wall: '#fff4f0', sign: '+', signColor: '#e05a5a', doorColor: '#c84a4a' },
  shop:   { w: 4, h: 3, door: 1, roof: '#4a8ad8', wall: '#f0f4ff', sign: 'T', signColor: '#2a5aa8', doorColor: '#3a6ab8' },
  gym:    { w: 7, h: 5, door: 3, roof: '#5aa86a', wall: '#e8e0d0', sign: 'GYM', signColor: '#3a7a4a', doorColor: '#5a5a6a' },
};

/* ══════════════════════════════════════
   ASPECTO DE LOS PERSONAJES
══════════════════════════════════════ */
const LOOKS = {
  player:   { head: 'cap',   c: '#d8433a', h: '#4a2a1a', s: '#3a6ad8', p: '#3a3a4a' },
  rival:    { head: 'short', h: '#5a3a8a', s: '#2f8a5a', p: '#5a4a3a' },
  prof:     { head: 'long',  h: '#c8b8a8', s: '#f8f8f8', S: '#c8c8d0', p: '#6a5a8a' },
  mom:      { head: 'long',  h: '#8a4a2a', s: '#f2a0b8', p: '#5a5a8a' },
  nurse:    { head: 'long',  h: '#f08ab8', s: '#ffffff', S: '#f0c8d8', p: '#f08ab8', b: '#ffffff' },
  clerk:    { head: 'cap',   c: '#3a6ab8', h: '#3a2a1a', s: '#3a6ab8', p: '#2a2a3a' },
  youngster:{ head: 'cap',   c: '#f2c040', h: '#4a2a1a', s: '#e86a3a', p: '#4a6ad8' },
  lass:     { head: 'long',  h: '#e8a040', s: '#d84a8a', p: '#4a3a6a' },
  bug:      { head: 'cap',   c: '#6aa83a', h: '#3a2a1a', s: '#f2d23a', p: '#5a7a3a' },
  hiker:    { head: 'bald',  h: '#5a3a1a', k: '#e8b088', s: '#a86a3a', p: '#5a4a3a' },
  medium:   { head: 'long',  h: '#2a2a3a', s: '#5a3a8a', p: '#3a2a4a' },
  guard:    { head: 'cap',   c: '#2a3a6a', h: '#2a1a1a', s: '#3a4a7a', p: '#2a2a3a' },
  leader1:  { head: 'short', h: '#7a5a3a', k: '#e8b088', s: '#8a7a6a', p: '#4a3a2a' },
  leader2:  { head: 'long',  h: '#f2d23a', s: '#2a3a5a', p: '#f2d23a' },
  sailor:   { head: 'cap',   c: '#ffffff', h: '#2a1a1a', s: '#ffffff', S: '#c8d8f0', p: '#2a4a8a' },
  oldman:   { head: 'bald',  h: '#d8d8d8', s: '#6a8a5a', p: '#4a4a3a' },
  girl:     { head: 'long',  h: '#3a2a1a', s: '#f2d23a', p: '#d8584a' },
  engineer: { head: 'cap',   c: '#f2d23a', h: '#2a1a1a', s: '#e8a040', p: '#3a3a4a' },
};

/* ══════════════════════════════════════
   GENERADORES DE INTERIORES
══════════════════════════════════════ */
function centerMap(id, name, out) {
  return {
    id, name, interior: true, heal: true,
    rows: [
      'WWWWWWWWWWW',
      'pffffHfffPp',
      'fffffffffff',
      'ffcccccccff',
      'fffffffffff',
      'fffffffffff',
      'rrrrrrrrrrr',
      'ffffmmmffff',
    ],
    warps: [4, 5, 6].map(x => ({ x, y: 7, ...out })),
    npcs: [
      { id: 'nurse', x: 5, y: 2, dir: 'down', look: 'nurse', script: 'nurse' },
      { id: 'pcuser', x: 1, y: 5, dir: 'right', look: 'girl', text: ['El PC de la derecha guarda las criaturas que no caben en tu equipo.'] },
    ],
    objects: [{ x: 9, y: 1, script: 'pc' }],
  };
}

function shopMap(id, name, shop, out) {
  return {
    id, name, interior: true,
    rows: [
      'WWWWWWWW',
      'KKffffKK',
      'ffffffff',
      'cccfffff',
      'ffffffff',
      'ffffffpf',
      'fffmmfff',
    ],
    warps: [3, 4].map(x => ({ x, y: 6, ...out })),
    npcs: [
      { id: 'clerk', x: 1, y: 2, dir: 'down', look: 'clerk', script: 'shop', shop },
      { id: 'shopper', x: 5, y: 3, dir: 'left', look: 'oldman', text: ['Las Supercápsulas solo las venden en las ciudades grandes.', 'Aquí tendrás que conformarte con las normales, je, je.'] },
    ],
  };
}

function houseMap(id, name, out, npcs) {
  return {
    id, name, interior: true,
    rows: [
      'WWWWWWWW',
      'KffffffB',
      'ffffffff',
      'fftfffff',
      'ffffffpf',
      'ffffffff',
      'fffmmfff',
    ],
    warps: [3, 4].map(x => ({ x, y: 6, ...out })),
    npcs,
  };
}

/* ══════════════════════════════════════
   MAPAS
══════════════════════════════════════ */
const MAPS = {};
const defineMap = m => { MAPS[m.id] = m; };

/* ── Pueblo Albor ── */
defineMap({
  id: 'pueblo', name: 'Pueblo Albor', music: 'town',
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'TTTTTTTTT==TTTTTTTTT',
    'TT*......==......*TT',
    'TT.......==.......TT',
    'TT.......==.......TT',
    'TT.......==.......TT',
    'TT.......==.......TT',
    'TT..=....==...=...TT',
    'TT================TT',
    'TT.S..............TT',
    'TT................TT',
    'TT................TT',
    'TT................TT',
    'TT.*...=====....*.TT',
    'TT~~~~........~~~~TT',
    'TT~~~~...**...~~~~TT',
    'TTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  buildings: [
    { kind: 'house', x: 3, y: 4, to: 'casa', tx: 3, ty: 5 },
    { kind: 'house2', x: 12, y: 4, to: 'casa_rival', tx: 3, ty: 5 },
    { kind: 'lab', x: 7, y: 9, to: 'lab', tx: 4, ty: 7 },
  ],
  warps: [
    { x: 9, y: 0, to: 'ruta1', tx: 9, ty: 26 },
    { x: 10, y: 0, to: 'ruta1', tx: 10, ty: 26 },
  ],
  signs: [{ x: 3, y: 9, text: 'PUEBLO ALBOR · Donde empiezan las grandes aventuras.' }],
  npcs: [
    { id: 'kid', x: 15, y: 11, dir: 'left', look: 'youngster', wander: true, text: ['¡La profesora Alisa sabe muchísimo de criaturas!', 'Su laboratorio es el edificio gris.'] },
    { id: 'girl1', x: 5, y: 12, dir: 'down', look: 'girl', wander: true, text: ['Dicen que en la hierba alta viven criaturas salvajes.', 'Sin una criatura propia es peligroso entrar.'] },
  ],
  triggers: [
    { x: 9, y: 2, script: 'noStarter' },
    { x: 10, y: 2, script: 'noStarter' },
  ],
});

defineMap(houseMap('casa', 'Tu casa', { to: 'pueblo', tx: 4, ty: 7 }, [
  { id: 'mom', x: 2, y: 2, dir: 'down', look: 'mom', script: 'mom' },
]));

defineMap(houseMap('casa_rival', 'Casa de Dani', { to: 'pueblo', tx: 14, ty: 7 }, [
  { id: 'sister', x: 5, y: 2, dir: 'down', look: 'lass', script: 'sister' },
]));

defineMap({
  id: 'lab', name: 'Laboratorio', interior: true, music: 'town',
  rows: [
    'WWWWWWWWWW',
    'KKKffffKKK',
    'ffffffffff',
    'fffftttfff',
    'ffffffffff',
    'Pfffffffpf',
    'ffffffffff',
    'ffffffffff',
    'ffffmmffff',
  ],
  warps: [4, 5].map(x => ({ x, y: 8, to: 'pueblo', tx: 10, ty: 13 })),
  npcs: [
    { id: 'prof', x: 5, y: 2, dir: 'down', look: 'prof', script: 'prof' },
    { id: 'rival_lab', x: 2, y: 4, dir: 'right', look: 'rival', script: 'rivalLab', hideIf: 'rival1' },
    { id: 'aide', x: 8, y: 6, dir: 'left', look: 'oldman', text: ['Soy el ayudante de la profesora.', 'Las criaturas suben de nivel al combatir y algunas evolucionan.'] },
  ],
  objects: [
    { x: 4, y: 3, script: 'starter', species: 'brasito', hideIf: 'starter_brasito' },
    { x: 5, y: 3, script: 'starter', species: 'gotarin', hideIf: 'starter_gotarin' },
    { x: 6, y: 3, script: 'starter', species: 'brotin', hideIf: 'starter_brotin' },
  ],
});

/* ── Ruta 1 ── */
defineMap({
  id: 'ruta1', name: 'Ruta 1', music: 'route',
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'TTTTTTTTT==TTTTTTTTT',
    'TT,,,,...==.....,,TT',
    'TT,,,,...==.....,,TT',
    'TT,,,,...==...TT,,TT',
    'TT.......==...TT..TT',
    'TTLLLLLL.==.LLLLLLTT',
    'TT.......==.......TT',
    'TT..,,,,.==.,,,,..TT',
    'TT..,,,,.==.,,,,..TT',
    'TT..,,,,.==.,,,,..TT',
    'TT.......==.......TT',
    'TTTTT....==....TTTTT',
    'TT*......==......*TT',
    'TT..S....==.......TT',
    'TT,,,,,..==..,,,,,TT',
    'TT,,,,,..==..,,,,,TT',
    'TT,,,,,..==..,,,,,TT',
    'TT.......==.......TT',
    'TT..TT...==...TT..TT',
    'TT..TT...==...TT..TT',
    'TT.......==.......TT',
    'TTLLLL...==...LLLLTT',
    'TT,,,,...==...,,,,TT',
    'TT,,,,...==...,,,,TT',
    'TT.......==.......TT',
    'TTTTTTTTT==TTTTTTTTT',
    'TTTTTTTTT==TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 27, to: 'pueblo', tx: 9, ty: 1 },
    { x: 10, y: 27, to: 'pueblo', tx: 10, ty: 1 },
    { x: 9, y: 0, to: 'ciudad1', tx: 11, ty: 17 },
    { x: 10, y: 0, to: 'ciudad1', tx: 12, ty: 17 },
  ],
  signs: [{ x: 4, y: 14, text: 'RUTA 1 · Norte: Ciudad Roble. Sur: Pueblo Albor.' }],
  encounters: { tall: [['roedin', 2, 4, 35], ['pipio', 2, 4, 35], ['larvita', 3, 4, 20], ['chispin', 3, 5, 10]] },
  npcs: [
    { id: 't_pablo', x: 6, y: 18, dir: 'right', look: 'youngster', trainer: { name: 'Joven Pablo', party: [['roedin', 4]], prize: 15, sight: 3,
      intro: '¡Eh, tú! ¡Mis criaturas y yo hemos entrenado mucho!', defeat: '¡No puede ser! ¡Perdí!', after: 'Tengo que capturar más criaturas en la hierba alta.' } },
    { id: 't_lucia', x: 13, y: 9, dir: 'left', look: 'lass', trainer: { name: 'Chica Lucía', party: [['pipio', 3], ['larvita', 4]], prize: 15, sight: 3,
      intro: '¡Nuestras miradas se han cruzado! ¡A luchar!', defeat: 'Uy... ¡qué fuerte eres!', after: 'Algún día tendré un equipo de seis criaturas.' } },
    { id: 'route_man', x: 11, y: 24, dir: 'down', look: 'oldman', text: ['Debilita a una criatura salvaje y lánzale una Cápsula.', 'Cuantos menos PS le queden, más fácil será capturarla.'] },
  ],
  items: [
    { id: 'r1_pocion', x: 3, y: 2, item: 'pocion' },
    { id: 'r1_capsula', x: 16, y: 24, item: 'capsula', qty: 2 },
  ],
});

/* ── Ciudad Roble ── */
defineMap({
  id: 'ciudad1', name: 'Ciudad Roble', music: 'town',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TT*...................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....=....=......=...TT',
    'TT======================',
    'TT====================TT',
    'TT.....S...==.........TT',
    'TT.........==...*.*...TT',
    'TT.........==.........TT',
    'TT.........==.........TT',
    'TT.........==....~~~..TT',
    'TT...=.....==....~~~..TT',
    'TT.........==.........TT',
    'TTTTTTTTTTT==TTTTTTTTTTT',
    'TTTTTTTTTTT==TTTTTTTTTTT',
  ],
  buildings: [
    { kind: 'center', x: 3, y: 3, to: 'centro1', tx: 5, ty: 6 },
    { kind: 'shop', x: 10, y: 4, to: 'tienda1', tx: 3, ty: 5 },
    { kind: 'gym', x: 15, y: 2, to: 'gym1', tx: 5, ty: 12 },
    { kind: 'house', x: 4, y: 12, to: 'casa_roble', tx: 3, ty: 5 },
  ],
  warps: [
    { x: 11, y: 18, to: 'ruta1', tx: 9, ty: 1 },
    { x: 12, y: 18, to: 'ruta1', tx: 10, ty: 1 },
    { x: 23, y: 8, to: 'ruta2', tx: 1, ty: 8 },
  ],
  signs: [{ x: 7, y: 10, text: 'CIUDAD ROBLE · El gimnasio de Petra pone a prueba a los entrenadores.' }],
  npcs: [
    { id: 'guard1', x: 21, y: 8, dir: 'left', look: 'guard', script: 'guard1', hideIf: 'badge1' },
    { id: 'c1_kid', x: 14, y: 12, dir: 'down', look: 'girl', wander: true, text: ['Petra usa criaturas de tipo Roca.', '¡El agua y las plantas les hacen muchísimo daño!'] },
    { id: 'c1_man', x: 7, y: 15, dir: 'right', look: 'sailor', text: ['En el Centro de Criaturas curan a tu equipo gratis.', 'Busca el tejado rojo con la cruz.'] },
  ],
});

defineMap(centerMap('centro1', 'Centro de Criaturas', { to: 'ciudad1', tx: 6, ty: 7 }));
defineMap(shopMap('tienda1', 'Tienda', 'tienda1', { to: 'ciudad1', tx: 11, ty: 7 }));
defineMap(houseMap('casa_roble', 'Casa', { to: 'ciudad1', tx: 5, ty: 15 }, [
  { id: 'gift_lady', x: 4, y: 3, dir: 'down', look: 'mom', script: 'giftLady' },
]));

defineMap({
  id: 'gym1', arena: 'gimnasio_roca', name: 'Gimnasio Roble', interior: true, music: 'gym',
  rows: [
    'WWWWWWWWWW',
    'gggggggggg',
    'gggggggggg',
    'goggggggog',
    'gggggggggg',
    'ggooggoogg',
    'gggggggggg',
    'gggggggggg',
    'goggggggog',
    'gggggggggg',
    'gggggggggg',
    'gggggggggg',
    'gggggggggg',
    'ggggmmgggg',
  ],
  warps: [4, 5].map(x => ({ x, y: 13, to: 'ciudad1', tx: 18, ty: 7 })),
  npcs: [
    { id: 'leader1', x: 5, y: 2, dir: 'down', look: 'leader1', trainer: { name: 'Líder Petra', party: [['pedrusco', 11], ['pedrusco', 13]], prize: 80, sight: 0, leader: 'badge1',
      intro: 'Soy Petra, líder del Gimnasio Roble. Mis criaturas son duras como la roca. ¿Crees que puedes romper mi defensa?', defeat: '¡Increíble! Has demostrado tu valía. Toma la Medalla Roca.', after: 'Con la Medalla Roca, el guardia de la salida este te dejará pasar a la Ruta 2.' } },
    { id: 't_rocco', x: 3, y: 7, dir: 'right', look: 'hiker', trainer: { name: 'Montañero Rocco', party: [['pedrusco', 9]], prize: 20, sight: 4,
      intro: '¡Para llegar a Petra tendrás que pasar por encima de mí!', defeat: '¡Ay, mis rocas!', after: 'Petra es mucho más dura que yo.' } },
    { id: 'gym1_guide', x: 7, y: 11, dir: 'left', look: 'oldman', text: ['¡Hola, aspirante! Las criaturas de Roca odian el Agua y la Planta.', 'El Fuego, en cambio, apenas les hace cosquillas.'] },
  ],
});

/* ── Ruta 2 · Bosque Musgo ── */
defineMap({
  id: 'ruta2', arena: 'bosque', name: 'Ruta 2 · Bosque Musgo', music: 'route',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT,,,,,,TT......,,,,,,TTTTTTTT',
    'TT,,,,,,TT......,,,,,,TT,,,,TT',
    'TT,,,,,,TT..TT..,,,,,,TT,,,,TT',
    'TT......TT..TT..........,,,,TT',
    'TT......,,..TT..TTTTTT..TT..TT',
    'TT......,,..TT..TTTTTT..TT..TT',
    '==......,,......,,,,,,.......=',
    'TT......,,......,,,,,,.......=',
    'TT..TTTTTT..TT..,,,,,,..TT..TT',
    'TT..TTTTTT..TT..........TT..TT',
    'TT..,,,,,,..TT..TTTT....,,..TT',
    'TT..,,,,,,..........~~..,,..TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  warps: [
    { x: 0, y: 8, to: 'ciudad1', tx: 22, ty: 8 },
    { x: 29, y: 8, to: 'cueva', tx: 1, ty: 8 },
    { x: 29, y: 9, to: 'cueva', tx: 1, ty: 8 },
  ],
  triggers: [
    { x: 2, y: 8, script: 'rival2' },
    { x: 2, y: 9, script: 'rival2' },
  ],
  encounters: { tall: [['setilla', 7, 10, 25], ['larvita', 7, 9, 20], ['pipio', 8, 10, 20], ['roedin', 8, 10, 15], ['charquito', 8, 10, 12], ['alabella', 9, 10, 5], ['brotin', 8, 9, 3]] },
  npcs: [
    { id: 'rival2', x: 5, y: 8, dir: 'left', look: 'rival', hideIf: 'rival2', trainer: { rival: 2, name: 'Rival Dani', prize: 40, sight: 0,
      intro: '¡Eh, ya tienes la Medalla Roca! Yo también. Veamos quién ha entrenado más.', defeat: '¡Grr! Esta vez has ganado tú...', after: 'Voy a la Cueva Eco. ¡Nos vemos en Puerto Marea!' }, script: 'rival2' },
    { id: 't_leo', x: 14, y: 3, dir: 'down', look: 'bug', trainer: { name: 'Cazabichos Leo', party: [['larvita', 8], ['alabella', 10]], prize: 15, sight: 5,
      intro: '¡Mira mi red! ¡He capturado bichos increíbles!', defeat: '¡Mis bichitos!', after: 'Las Larvitas evolucionan muy pronto.' } },
    { id: 't_marta', x: 23, y: 12, dir: 'left', look: 'lass', trainer: { name: 'Excursionista Marta', party: [['setilla', 10], ['roedin', 10]], prize: 20, sight: 3,
      intro: '¡Este bosque es mi territorio!', defeat: 'Me has dejado sin aliento.', after: 'Las Setillas duermen a sus rivales con su polvo.' } },
    { id: 't_iker', x: 6, y: 12, dir: 'right', look: 'youngster', trainer: { name: 'Joven Iker', party: [['charquito', 11]], prize: 15, sight: 4,
      intro: '¡Mi Charquito es el más rápido del bosque!', defeat: '¡Qué velocidad la tuya!', after: 'Charquito evoluciona en el nivel 22.' } },
  ],
  items: [
    { id: 'r2_super', x: 25, y: 3, item: 'superpocion' },
    { id: 'r2_capsula', x: 4, y: 12, item: 'capsula', qty: 3 },
    { id: 'r2_antidoto', x: 20, y: 13 - 1, item: 'antidoto' },
  ],
});

/* ── Cueva Eco ── */
defineMap({
  id: 'cueva', arena: 'cueva', name: 'Cueva Eco', music: 'cave', dark: true,
  rows: [
    '########################',
    '########################',
    '##____####______########',
    '##____####______##____##',
    '##__o_____________o___##',
    '##____##_____###______##',
    '##____##__o__###__##__##',
    '####__##_____###__##__##',
    '______##__##______##____',
    '##____##__##__o___##__##',
    '##____________________##',
    '##__###____####__###__##',
    '##__###____####__###__##',
    '##_____o____________o_##',
    '##____________________##',
    '########################',
  ],
  warps: [
    { x: 0, y: 8, to: 'ruta2', tx: 28, ty: 8 },
    { x: 23, y: 8, to: 'ciudad2', tx: 1, ty: 8 },
  ],
  encounters: { cave: [['pedrusco', 10, 13, 40], ['murcielin', 10, 13, 40], ['sombrin', 11, 13, 15], ['chispin', 11, 13, 5]] },
  npcs: [
    { id: 't_bruno', x: 12, y: 10, dir: 'up', look: 'hiker', trainer: { name: 'Montañero Bruno', party: [['pedrusco', 13], ['pedrusco', 13]], prize: 20, sight: 3,
      intro: '¡En esta cueva mando yo!', defeat: '¡Me has hecho polvo!', after: 'Más allá de la cueva está Puerto Marea.' } },
    { id: 't_elvira', x: 19, y: 13, dir: 'left', look: 'medium', trainer: { name: 'Médium Elvira', party: [['sombrin', 14], ['murcielin', 13]], prize: 25, sight: 4,
      intro: 'Los espíritus me han dicho que vendrías...', defeat: 'Los espíritus se equivocaron...', after: 'Los ataques normales no afectan a los fantasmas.' } },
  ],
  items: [
    { id: 'cv_revivir', x: 3, y: 2, item: 'revivir' },
    { id: 'cv_super', x: 21, y: 3, item: 'superpocion', qty: 2 },
    { id: 'cv_ultra', x: 3, y: 13, item: 'supercapsula', qty: 2 },
  ],
});

/* ── Puerto Marea ── */
defineMap({
  id: 'ciudad2', name: 'Puerto Marea', music: 'town',
  rows: [
    'TTTTTTTTTTT==TTTTTTTTTTT',
    'TTTTTTTTTTT==TTTTTTTTTTT',
    'TT.........==.........TT',
    'TT.........==.........TT',
    'TT.........==.........TT',
    'TT.........==.........TT',
    'TT.........==.........TT',
    'TT....=....==.....=...TT',
    '======================TT',
    'TT....................TT',
    'TT.S..................TT',
    'TT....................TT',
    'TT....................TT',
    'TT*...........=.....*.TT',
    '::::::::::::::::::::::::',
    '::::::::::::::::::::::::',
    '~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  buildings: [
    { kind: 'center', x: 3, y: 3, to: 'centro2', tx: 5, ty: 6 },
    { kind: 'gym', x: 14, y: 2, to: 'gym2', tx: 5, ty: 12 },
    { kind: 'shop', x: 13, y: 10, to: 'tienda2', tx: 3, ty: 5 },
  ],
  warps: [
    { x: 0, y: 8, to: 'cueva', tx: 22, ty: 8 },
    { x: 11, y: 0, to: 'santuario', tx: 6, ty: 12 },
    { x: 12, y: 0, to: 'santuario', tx: 7, ty: 12 },
  ],
  signs: [{ x: 3, y: 10, text: 'PUERTO MAREA · Hogar de Volta, la líder eléctrica.' }],
  triggers: [
    { x: 11, y: 2, script: 'northGate' },
    { x: 12, y: 2, script: 'northGate' },
  ],
  npcs: [
    { id: 'c2_sailor', x: 8, y: 15, dir: 'down', look: 'sailor', wander: true, text: ['¡Ahoy! El mar está demasiado bravo para navegar hoy.', 'Al norte de la ciudad está el Santuario. Solo los campeones pueden entrar.'] },
    { id: 'c2_girl', x: 18, y: 12, dir: 'left', look: 'girl', text: ['Volta usa criaturas Eléctricas.', 'Las criaturas de Agua y Voladoras lo pasan fatal contra ella.'] },
    { id: 'rival3', x: 11, y: 3, dir: 'down', look: 'rival', showIf: 'badge2', hideIf: 'rival3', trainer: { rival: 3, name: 'Rival Dani', prize: 60, sight: 0,
      intro: '¡Dos medallas! Ya somos los mejores de la región... pero solo puede haber un campeón. ¡Vamos!', defeat: '¡Has ganado! Eres... el mejor entrenador de Brisaluz.', after: '' }, script: 'rival3' },
  ],
});

defineMap(centerMap('centro2', 'Centro de Criaturas', { to: 'ciudad2', tx: 6, ty: 7 }));
defineMap(shopMap('tienda2', 'Tienda', 'tienda2', { to: 'ciudad2', tx: 14, ty: 13 }));

defineMap({
  id: 'gym2', arena: 'gimnasio_voltio', name: 'Gimnasio Marea', interior: true, music: 'gym',
  rows: [
    'WWWWWWWWWW',
    'gggggggggg',
    'gggggggggg',
    'gHggggggHg',
    'gggggggggg',
    'gggPggPggg',
    'gggggggggg',
    'gggggggggg',
    'gPggggggPg',
    'gggggggggg',
    'gggggggggg',
    'gggggggggg',
    'gggggggggg',
    'ggggmmgggg',
  ],
  warps: [4, 5].map(x => ({ x, y: 13, to: 'ciudad2', tx: 17, ty: 7 })),
  npcs: [
    { id: 'leader2', x: 5, y: 2, dir: 'down', look: 'leader2', trainer: { name: 'Líder Volta', party: [['chispin', 19], ['murcielin', 19], ['voltion', 22]], prize: 100, sight: 0, leader: 'badge2',
      intro: '¡Bienvenido al Gimnasio Marea! Soy Volta. ¿Estás listo para sentir la corriente?', defeat: '¡Me has dejado sin batería! Te has ganado la Medalla Voltio.', after: 'Con dos medallas puedes ir al Santuario, al norte de la ciudad.' } },
    { id: 't_tesla', x: 2, y: 9, dir: 'right', look: 'engineer', trainer: { name: 'Ingeniero Teo', party: [['chispin', 16], ['chispin', 17]], prize: 25, sight: 4,
      intro: '¡Mis circuitos están a plena carga!', defeat: '¡Cortocircuito!', after: 'Volta tiene un Voltión muy rápido.' } },
    { id: 't_sara', x: 7, y: 6, dir: 'left', look: 'lass', trainer: { name: 'Chica Sara', party: [['pipio', 16], ['chispin', 17]], prize: 20, sight: 4,
      intro: '¡No llegarás hasta Volta!', defeat: '¡Uf! Eres muy bueno.', after: 'Las criaturas de Roca resisten la electricidad.' } },
  ],
});

/* ── Santuario ── */
defineMap({
  id: 'santuario', arena: 'santuario', name: 'Santuario', music: 'cave',
  rows: [
    'TTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTT',
    'TTTqqqqqqqqTTT',
    'TTqqqqqqqqqqTT',
    'TTqq*qqqq*qqTT',
    'TTqqqqqqqqqqTT',
    'TTqqqqqqqqqqTT',
    'TTqqqqqqqqqqTT',
    'TT*qqqqqqqq*TT',
    'TTTqqqqqqqqTTT',
    'TTTTTqqqqTTTTT',
    'TTTTTT==TTTTTT',
    'TTTTTT==TTTTTT',
    'TTTTTT==TTTTTT',
  ],
  warps: [
    { x: 6, y: 13, to: 'ciudad2', tx: 11, ty: 1 },
    { x: 7, y: 13, to: 'ciudad2', tx: 12, ty: 1 },
  ],
  objects: [{ x: 6, y: 4, script: 'legend', creature: 'auroral', hideIf: 'legend' }],
});
