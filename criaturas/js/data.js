'use strict';

/* ══════════════════════════════════════
   TIPOS
══════════════════════════════════════ */
const TYPES = {
  normal:    { name: 'Normal',    color: '#a8a77a' },
  fuego:     { name: 'Fuego',     color: '#ee8130' },
  agua:      { name: 'Agua',      color: '#6390f0' },
  planta:    { name: 'Planta',    color: '#7ac74c' },
  electrico: { name: 'Eléctrico', color: '#e8c72a' },
  roca:      { name: 'Roca',      color: '#b6a136' },
  volador:   { name: 'Volador',   color: '#a98ff3' },
  bicho:     { name: 'Bicho',     color: '#a6b91a' },
  veneno:    { name: 'Veneno',    color: '#a33ea1' },
  fantasma:  { name: 'Fantasma',  color: '#735797' },
};

// Multiplicador atacante → defensor (lo que no aparece vale 1)
const TYPE_CHART = {
  normal:    { roca: 0.5, fantasma: 0 },
  fuego:     { planta: 2, bicho: 2, fuego: 0.5, agua: 0.5, roca: 0.5 },
  agua:      { fuego: 2, roca: 2, agua: 0.5, planta: 0.5 },
  planta:    { agua: 2, roca: 2, fuego: 0.5, planta: 0.5, volador: 0.5, bicho: 0.5, veneno: 0.5 },
  electrico: { agua: 2, volador: 2, planta: 0.5, electrico: 0.5, roca: 0.5 },
  roca:      { fuego: 2, volador: 2, bicho: 2, roca: 0.5 },
  volador:   { planta: 2, bicho: 2, electrico: 0.5, roca: 0.5 },
  bicho:     { planta: 2, fuego: 0.5, volador: 0.5, fantasma: 0.5, veneno: 0.5 },
  veneno:    { planta: 2, veneno: 0.5, roca: 0.5, fantasma: 0.5 },
  fantasma:  { fantasma: 2, normal: 0 },
};

function typeEffect(atkType, defTypes) {
  return defTypes.reduce((m, t) => m * (TYPE_CHART[atkType][t] ?? 1), 1);
}

const STATUS = {
  psn: { name: 'ENV', label: 'envenenado', color: '#a33ea1' },
  brn: { name: 'QUE', label: 'quemado', color: '#ee8130' },
  par: { name: 'PAR', label: 'paralizado', color: '#c9a800' },
  slp: { name: 'DOR', label: 'dormido', color: '#8a8a8a' },
};

const STAT_NAMES = { atk: 'Ataque', def: 'Defensa', spa: 'At. Esp.', spd: 'Def. Esp.', spe: 'Velocidad' };

/* ══════════════════════════════════════
   MOVIMIENTOS
   c: phys | spec | status · p: potencia · a: precisión (0 = nunca falla)
══════════════════════════════════════ */
const MOVES = {
  // Normal
  placaje:        { n: 'Placaje',         t: 'normal',    c: 'phys',   p: 40,  a: 100, pp: 35 },
  aranazo:        { n: 'Arañazo',         t: 'normal',    c: 'phys',   p: 40,  a: 100, pp: 35 },
  grunido:        { n: 'Gruñido',         t: 'normal',    c: 'status', a: 100, pp: 40, foe: { atk: -1 } },
  latigo:         { n: 'Látigo',          t: 'normal',    c: 'status', a: 100, pp: 30, foe: { def: -1 } },
  ataque_rapido:  { n: 'Ataque Rápido',   t: 'normal',    c: 'phys',   p: 40,  a: 100, pp: 30, prio: 1 },
  mordisco:       { n: 'Mordisco',        t: 'normal',    c: 'phys',   p: 60,  a: 100, pp: 25 },
  golpe_cuerpo:   { n: 'Golpe Cuerpo',    t: 'normal',    c: 'phys',   p: 85,  a: 100, pp: 15, status: ['par', 30] },
  derribo:        { n: 'Derribo',         t: 'normal',    c: 'phys',   p: 90,  a: 85,  pp: 20, recoil: 0.25 },
  afilar:         { n: 'Afilar',          t: 'normal',    c: 'status', a: 0,   pp: 30, self: { atk: 1 } },
  danza_espada:   { n: 'Danza Espada',    t: 'normal',    c: 'status', a: 0,   pp: 20, self: { atk: 2 } },
  agilidad:       { n: 'Agilidad',        t: 'normal',    c: 'status', a: 0,   pp: 30, self: { spe: 2 } },
  rizo_defensa:   { n: 'Rizo Defensa',    t: 'normal',    c: 'status', a: 0,   pp: 40, self: { def: 1 } },
  // Fuego
  ascuas:         { n: 'Ascuas',          t: 'fuego',     c: 'spec',   p: 40,  a: 100, pp: 25, status: ['brn', 10] },
  rueda_fuego:    { n: 'Rueda Fuego',     t: 'fuego',     c: 'phys',   p: 60,  a: 100, pp: 25, status: ['brn', 10] },
  colmillo_igneo: { n: 'Colmillo Ígneo',  t: 'fuego',     c: 'phys',   p: 65,  a: 95,  pp: 15, status: ['brn', 10] },
  lanzallamas:    { n: 'Lanzallamas',     t: 'fuego',     c: 'spec',   p: 90,  a: 100, pp: 15, status: ['brn', 10] },
  // Agua
  burbuja:        { n: 'Burbuja',         t: 'agua',      c: 'spec',   p: 40,  a: 100, pp: 30, foeChance: [{ spe: -1 }, 10] },
  pistola_agua:   { n: 'Pistola Agua',    t: 'agua',      c: 'spec',   p: 40,  a: 100, pp: 25 },
  refugio:        { n: 'Refugio',         t: 'agua',      c: 'status', a: 0,   pp: 40, self: { def: 1 } },
  hidropulso:     { n: 'Hidropulso',      t: 'agua',      c: 'spec',   p: 60,  a: 100, pp: 20 },
  acua_cola:      { n: 'Acua Cola',       t: 'agua',      c: 'phys',   p: 90,  a: 90,  pp: 10 },
  surf:           { n: 'Surf',            t: 'agua',      c: 'spec',   p: 90,  a: 100, pp: 15 },
  // Planta
  latigo_cepa:    { n: 'Látigo Cepa',     t: 'planta',    c: 'phys',   p: 45,  a: 100, pp: 25 },
  absorber:       { n: 'Absorber',        t: 'planta',    c: 'spec',   p: 20,  a: 100, pp: 25, drain: 0.5 },
  megaagotar:     { n: 'Megaagotar',      t: 'planta',    c: 'spec',   p: 40,  a: 100, pp: 15, drain: 0.5 },
  hoja_afilada:   { n: 'Hoja Afilada',    t: 'planta',    c: 'phys',   p: 55,  a: 95,  pp: 25, crit: 1 },
  energibola:     { n: 'Energibola',      t: 'planta',    c: 'spec',   p: 90,  a: 100, pp: 10 },
  somnifero:      { n: 'Somnífero',       t: 'planta',    c: 'status', a: 75,  pp: 15, inflict: 'slp' },
  sintesis:       { n: 'Síntesis',        t: 'planta',    c: 'status', a: 0,   pp: 5,  heal: 0.5 },
  // Eléctrico
  impactrueno:    { n: 'Impactrueno',     t: 'electrico', c: 'spec',   p: 40,  a: 100, pp: 30, status: ['par', 10] },
  chispa:         { n: 'Chispa',          t: 'electrico', c: 'phys',   p: 65,  a: 100, pp: 20, status: ['par', 30] },
  onda_trueno:    { n: 'Onda Trueno',     t: 'electrico', c: 'status', a: 90,  pp: 20, inflict: 'par' },
  rayo:           { n: 'Rayo',            t: 'electrico', c: 'spec',   p: 90,  a: 100, pp: 15, status: ['par', 10] },
  // Roca
  lanzarrocas:    { n: 'Lanzarrocas',     t: 'roca',      c: 'phys',   p: 50,  a: 90,  pp: 15 },
  avalancha:      { n: 'Avalancha',       t: 'roca',      c: 'phys',   p: 75,  a: 90,  pp: 10 },
  roca_afilada:   { n: 'Roca Afilada',    t: 'roca',      c: 'phys',   p: 100, a: 80,  pp: 5,  crit: 1 },
  // Volador
  picotazo:       { n: 'Picotazo',        t: 'volador',   c: 'phys',   p: 35,  a: 100, pp: 35 },
  tornado:        { n: 'Tornado',         t: 'volador',   c: 'spec',   p: 40,  a: 100, pp: 35 },
  ataque_ala:     { n: 'Ataque Ala',      t: 'volador',   c: 'phys',   p: 60,  a: 100, pp: 35 },
  golpe_aereo:    { n: 'Golpe Aéreo',     t: 'volador',   c: 'phys',   p: 60,  a: 0,   pp: 20 },
  // Bicho
  disparo_demora: { n: 'Disparo Demora',  t: 'bicho',     c: 'status', a: 95,  pp: 40, foe: { spe: -2 } },
  picadura:       { n: 'Picadura',        t: 'bicho',     c: 'phys',   p: 60,  a: 100, pp: 20 },
  tijera_x:       { n: 'Tijera X',        t: 'bicho',     c: 'phys',   p: 80,  a: 100, pp: 15 },
  zumbido:        { n: 'Zumbido',         t: 'bicho',     c: 'spec',   p: 90,  a: 100, pp: 10, foeChance: [{ spd: -1 }, 10] },
  // Veneno
  picotazo_veneno:{ n: 'Picotazo Veneno', t: 'veneno',    c: 'phys',   p: 15,  a: 100, pp: 35, status: ['psn', 30] },
  polvo_veneno:   { n: 'Polvo Veneno',    t: 'veneno',    c: 'status', a: 75,  pp: 35, inflict: 'psn' },
  acido:          { n: 'Ácido',           t: 'veneno',    c: 'spec',   p: 40,  a: 100, pp: 30, foeChance: [{ spd: -1 }, 10] },
  bomba_lodo:     { n: 'Bomba Lodo',      t: 'veneno',    c: 'spec',   p: 90,  a: 100, pp: 10, status: ['psn', 30] },
  // Fantasma
  lenguetazo:     { n: 'Lengüetazo',      t: 'fantasma',  c: 'phys',   p: 30,  a: 100, pp: 30, status: ['par', 30] },
  tinieblas:      { n: 'Tinieblas',       t: 'fantasma',  c: 'spec',   p: 45,  a: 100, pp: 15 },
  hipnosis:       { n: 'Hipnosis',        t: 'fantasma',  c: 'status', a: 60,  pp: 20, inflict: 'slp' },
  bola_sombra:    { n: 'Bola Sombra',     t: 'fantasma',  c: 'spec',   p: 80,  a: 100, pp: 15, foeChance: [{ spd: -1 }, 20] },
  // Para cuando no queda PP
  forcejeo:       { n: 'Forcejeo',        t: 'normal',    c: 'phys',   p: 50,  a: 0,   pp: 1,  recoil: 0.25, typeless: true },
};

/* ══════════════════════════════════════
   CRIATURAS
   base: [ps, atq, def, atqEsp, defEsp, vel]
   art: parámetros para el dibujo procedural (art.js)
══════════════════════════════════════ */
const SPECIES = {
  brasito: {
    n: 'Brasito', types: ['fuego'], base: [39, 52, 43, 60, 50, 65], exp: 62, rate: 45, evo: ['llamarzorro', 16],
    dex: 'Un cachorro juguetón. La llama de su cola brilla más cuando está contento.',
    learn: [[1, 'aranazo'], [1, 'grunido'], [5, 'ascuas'], [9, 'mordisco'], [13, 'rueda_fuego'], [19, 'colmillo_igneo'], [25, 'danza_espada'], [31, 'lanzallamas']],
    art: { plan: 'quad', body: '#f08a3c', belly: '#ffd7a0', accent: '#ffd23f', ears: 'fox', tail: 'flame', eyes: 'round' },
  },
  llamarzorro: {
    n: 'Llamarzorro', types: ['fuego'], base: [58, 74, 58, 85, 65, 90], exp: 142, rate: 45,
    dex: 'Corre por las praderas dejando un rastro de chispas. Su melena arde a gran temperatura.',
    learn: [[1, 'aranazo'], [1, 'grunido'], [1, 'ascuas'], [9, 'mordisco'], [13, 'rueda_fuego'], [20, 'colmillo_igneo'], [27, 'danza_espada'], [34, 'lanzallamas'], [40, 'golpe_cuerpo']],
    art: { plan: 'quad', body: '#e0662a', belly: '#ffd7a0', accent: '#ffd23f', ears: 'fox', tail: 'flame', eyes: 'fierce', extra: 'mane', size: 1.15 },
  },
  gotarin: {
    n: 'Gotarín', types: ['agua'], base: [44, 48, 65, 50, 64, 43], exp: 63, rate: 45, evo: ['marejon', 16],
    dex: 'Respira por las branquias de su cabeza. Le encanta chapotear en los ríos.',
    learn: [[1, 'placaje'], [1, 'latigo'], [5, 'pistola_agua'], [9, 'refugio'], [13, 'burbuja'], [17, 'mordisco'], [21, 'hidropulso'], [27, 'acua_cola'], [33, 'surf']],
    art: { plan: 'biped', body: '#f2a0b8', belly: '#fff0f4', accent: '#e05a8a', ears: 'fins', tail: 'curl', eyes: 'big', extra: 'none' },
  },
  marejon: {
    n: 'Marejón', types: ['agua'], base: [69, 63, 85, 70, 80, 58], exp: 142, rate: 45,
    dex: 'Su caparazón resiste el golpe de las olas. Dispara chorros de agua a presión.',
    learn: [[1, 'placaje'], [1, 'latigo'], [1, 'pistola_agua'], [9, 'refugio'], [13, 'burbuja'], [18, 'mordisco'], [23, 'hidropulso'], [30, 'acua_cola'], [37, 'surf']],
    art: { plan: 'biped', body: '#4a9ad8', belly: '#e8f4ff', accent: '#2a5a9a', ears: 'fins', tail: 'curl', eyes: 'fierce', extra: 'shell', size: 1.15 },
  },
  brotin: {
    n: 'Brotín', types: ['planta'], base: [45, 49, 49, 65, 65, 45], exp: 64, rate: 45, evo: ['frondosaur', 16],
    dex: 'La hoja de su cabeza absorbe la luz del sol. Duerme en los días nublados.',
    learn: [[1, 'placaje'], [1, 'grunido'], [5, 'latigo_cepa'], [8, 'absorber'], [11, 'polvo_veneno'], [14, 'somnifero'], [18, 'hoja_afilada'], [23, 'megaagotar'], [28, 'sintesis'], [33, 'energibola']],
    art: { plan: 'quad', body: '#6cc070', belly: '#c8f0b0', accent: '#3f9a3a', ears: 'round', tail: 'none', eyes: 'round', extra: 'leaf' },
  },
  frondosaur: {
    n: 'Frondosaur', types: ['planta'], base: [70, 70, 70, 85, 85, 60], exp: 142, rate: 45,
    dex: 'En su lomo crece un pequeño bosque. Los pájaros anidan en él sin miedo.',
    learn: [[1, 'placaje'], [1, 'grunido'], [1, 'latigo_cepa'], [8, 'absorber'], [11, 'polvo_veneno'], [14, 'somnifero'], [19, 'hoja_afilada'], [25, 'megaagotar'], [31, 'sintesis'], [37, 'energibola']],
    art: { plan: 'quad', body: '#4fa85a', belly: '#c8f0b0', accent: '#2f7a2a', ears: 'round', tail: 'leaf', eyes: 'fierce', extra: 'bush', size: 1.15 },
  },
  pipio: {
    n: 'Pipío', types: ['normal', 'volador'], base: [40, 45, 40, 35, 35, 56], exp: 50, rate: 255, evo: ['halconcio', 18],
    dex: 'Muy común en los caminos. Canta al amanecer con un trino agudo.',
    learn: [[1, 'placaje'], [3, 'tornado'], [7, 'ataque_rapido'], [12, 'picotazo'], [16, 'ataque_ala'], [22, 'agilidad'], [28, 'golpe_aereo']],
    art: { plan: 'bird', body: '#b07a4a', belly: '#f4e0c0', accent: '#f0a020', ears: 'none', tail: 'feather', eyes: 'round', extra: 'crest' },
  },
  halconcio: {
    n: 'Halconcio', types: ['normal', 'volador'], base: [63, 70, 60, 50, 50, 81], exp: 122, rate: 120,
    dex: 'Planea a gran altura vigilando su territorio. Caza en picado.',
    learn: [[1, 'placaje'], [1, 'tornado'], [7, 'ataque_rapido'], [12, 'picotazo'], [17, 'ataque_ala'], [24, 'agilidad'], [30, 'golpe_aereo'], [36, 'derribo']],
    art: { plan: 'bird', body: '#8a5a34', belly: '#f4e0c0', accent: '#f0a020', ears: 'none', tail: 'feather', eyes: 'fierce', extra: 'crest', size: 1.15 },
  },
  roedin: {
    n: 'Roedín', types: ['normal'], base: [30, 56, 35, 25, 35, 72], exp: 51, rate: 255, evo: ['roedon', 20],
    dex: 'Roe todo lo que encuentra. Sus dientes no paran de crecer.',
    learn: [[1, 'placaje'], [1, 'latigo'], [4, 'ataque_rapido'], [8, 'mordisco'], [14, 'afilar'], [20, 'golpe_cuerpo'], [27, 'derribo']],
    art: { plan: 'quad', body: '#a58ac8', belly: '#efe4f8', accent: '#f4b0c0', ears: 'round', tail: 'thin', eyes: 'round', extra: 'teeth' },
  },
  roedon: {
    n: 'Roedón', types: ['normal'], base: [55, 81, 60, 50, 70, 97], exp: 116, rate: 127,
    dex: 'Con sus incisivos puede roer piedra. Vive en grandes familias.',
    learn: [[1, 'placaje'], [1, 'latigo'], [4, 'ataque_rapido'], [8, 'mordisco'], [14, 'afilar'], [22, 'golpe_cuerpo'], [30, 'derribo']],
    art: { plan: 'quad', body: '#7e64a8', belly: '#efe4f8', accent: '#f4b0c0', ears: 'round', tail: 'thin', eyes: 'fierce', extra: 'teeth', size: 1.15 },
  },
  larvita: {
    n: 'Larvita', types: ['bicho'], base: [45, 30, 35, 20, 20, 45], exp: 39, rate: 255, evo: ['alabella', 7],
    dex: 'Come hojas sin parar para poder transformarse cuanto antes.',
    learn: [[1, 'placaje'], [1, 'disparo_demora'], [5, 'picadura']],
    art: { plan: 'bug', body: '#9ccc3a', belly: '#e8f4a0', accent: '#f0c020', ears: 'antenna', tail: 'none', eyes: 'round', extra: 'spots' },
  },
  alabella: {
    n: 'Alabella', types: ['bicho', 'volador'], base: [60, 45, 50, 80, 80, 70], exp: 128, rate: 45,
    dex: 'Sus alas esparcen un polvo brillante. Revolotea entre las flores.',
    learn: [[1, 'tornado'], [1, 'picadura'], [9, 'polvo_veneno'], [12, 'somnifero'], [15, 'ataque_ala'], [20, 'zumbido'], [26, 'agilidad']],
    art: { plan: 'butterfly', body: '#5a4a8a', belly: '#e8e0ff', accent: '#f6a8d8', ears: 'antenna', tail: 'none', eyes: 'big', extra: 'wings' },
  },
  chispin: {
    n: 'Chispín', types: ['electrico'], base: [35, 55, 40, 50, 50, 90], exp: 82, rate: 190, evo: ['voltion', 22],
    dex: 'Sus antenas captan la electricidad del aire. Si lo asustas, te dará un calambrazo.',
    learn: [[1, 'impactrueno'], [1, 'grunido'], [6, 'ataque_rapido'], [10, 'onda_trueno'], [15, 'chispa'], [21, 'agilidad'], [27, 'rayo']],
    art: { plan: 'biped', body: '#7ec8f0', belly: '#e8f6ff', accent: '#f2d23a', ears: 'antenna', tail: 'bolt', eyes: 'big', extra: 'cheeks' },
  },
  voltion: {
    n: 'Voltión', types: ['electrico'], base: [60, 90, 55, 90, 80, 110], exp: 160, rate: 75,
    dex: 'Descarga rayos capaces de iluminar una ciudad entera durante una noche.',
    learn: [[1, 'impactrueno'], [1, 'grunido'], [6, 'ataque_rapido'], [10, 'onda_trueno'], [15, 'chispa'], [23, 'agilidad'], [29, 'rayo'], [35, 'golpe_cuerpo']],
    art: { plan: 'biped', body: '#3f8ad8', belly: '#d8eeff', accent: '#f2d23a', ears: 'horns', tail: 'bolt', eyes: 'fierce', extra: 'cheeks', size: 1.15 },
  },
  pedrusco: {
    n: 'Pedrusco', types: ['roca'], base: [40, 80, 100, 30, 30, 20], exp: 60, rate: 255, evo: ['rocazon', 20],
    dex: 'Se camufla entre las piedras del camino. Mucha gente lo pisa sin querer.',
    learn: [[1, 'placaje'], [1, 'rizo_defensa'], [6, 'lanzarrocas'], [11, 'mordisco'], [16, 'avalancha'], [22, 'derribo'], [28, 'roca_afilada']],
    art: { plan: 'rock', body: '#9a8f80', belly: '#c9bfae', accent: '#6f655a', ears: 'none', tail: 'none', eyes: 'fierce', extra: 'arms' },
  },
  rocazon: {
    n: 'Rocazón', types: ['roca'], base: [80, 105, 130, 45, 55, 40], exp: 137, rate: 120,
    dex: 'Su cuerpo es duro como el granito. Rueda montaña abajo a toda velocidad.',
    learn: [[1, 'placaje'], [1, 'rizo_defensa'], [6, 'lanzarrocas'], [11, 'mordisco'], [16, 'avalancha'], [24, 'derribo'], [32, 'roca_afilada']],
    art: { plan: 'rock', body: '#7d7466', belly: '#b3a894', accent: '#5a5248', ears: 'horns', tail: 'none', eyes: 'fierce', extra: 'arms', size: 1.2 },
  },
  setilla: {
    n: 'Setilla', types: ['planta', 'veneno'], base: [50, 55, 55, 45, 55, 30], exp: 70, rate: 190, evo: ['hongoloso', 20],
    dex: 'Vive a la sombra de los árboles. Sus esporas dan mucho sueño.',
    learn: [[1, 'absorber'], [1, 'polvo_veneno'], [6, 'acido'], [11, 'somnifero'], [16, 'megaagotar'], [22, 'bomba_lodo']],
    art: { plan: 'mushroom', body: '#f4e6d0', belly: '#fff6e8', accent: '#d8433a', ears: 'none', tail: 'none', eyes: 'sleepy', extra: 'spots' },
  },
  hongoloso: {
    n: 'Hongoloso', types: ['planta', 'veneno'], base: [70, 80, 80, 75, 80, 40], exp: 146, rate: 75,
    dex: 'Su sombrero gigante protege del sol a criaturas más pequeñas.',
    learn: [[1, 'absorber'], [1, 'polvo_veneno'], [6, 'acido'], [11, 'somnifero'], [16, 'megaagotar'], [24, 'bomba_lodo'], [30, 'energibola']],
    art: { plan: 'mushroom', body: '#efdcc0', belly: '#fff6e8', accent: '#9a3ad8', ears: 'none', tail: 'none', eyes: 'fierce', extra: 'spots', size: 1.2 },
  },
  sombrin: {
    n: 'Sombrín', types: ['fantasma'], base: [30, 35, 30, 100, 35, 80], exp: 62, rate: 190, evo: ['espectron', 25],
    dex: 'Aparece en lugares oscuros. Le divierte asustar a los excursionistas.',
    learn: [[1, 'lenguetazo'], [1, 'hipnosis'], [8, 'tinieblas'], [20, 'bola_sombra']],
    art: { plan: 'ghost', body: '#7a5aa8', belly: '#a58ac8', accent: '#f0f0ff', ears: 'none', tail: 'none', eyes: 'big', extra: 'grin' },
  },
  espectron: {
    n: 'Espectrón', types: ['fantasma'], base: [45, 50, 45, 115, 55, 95], exp: 142, rate: 90,
    dex: 'Se esconde en las sombras y roba el calor de quien pasa cerca.',
    learn: [[1, 'lenguetazo'], [1, 'hipnosis'], [8, 'tinieblas'], [22, 'bola_sombra'], [30, 'agilidad']],
    art: { plan: 'ghost', body: '#5a3a8a', belly: '#8a6ab8', accent: '#f0f0ff', ears: 'horns', tail: 'none', eyes: 'fierce', extra: 'grin', size: 1.2 },
  },
  charquito: {
    n: 'Charquito', types: ['agua'], base: [40, 50, 40, 40, 40, 90], exp: 66, rate: 190, evo: ['ranaldo', 22],
    dex: 'Salta de charco en charco. Su piel resbaladiza se seca si no se moja.',
    learn: [[1, 'burbuja'], [1, 'grunido'], [5, 'pistola_agua'], [10, 'ataque_rapido'], [15, 'hidropulso'], [22, 'golpe_cuerpo']],
    art: { plan: 'frog', body: '#4ab8a0', belly: '#d8f4e0', accent: '#2f7a6a', ears: 'none', tail: 'none', eyes: 'frog', extra: 'none' },
  },
  ranaldo: {
    n: 'Ranaldo', types: ['agua'], base: [65, 65, 65, 70, 50, 90], exp: 135, rate: 75,
    dex: 'De un solo salto cruza un río. Su croar se oye a kilómetros.',
    learn: [[1, 'burbuja'], [1, 'grunido'], [5, 'pistola_agua'], [10, 'ataque_rapido'], [15, 'hidropulso'], [24, 'golpe_cuerpo'], [30, 'surf']],
    art: { plan: 'frog', body: '#2f9a88', belly: '#d8f4e0', accent: '#1f6a5a', ears: 'none', tail: 'none', eyes: 'frog', extra: 'spots', size: 1.2 },
  },
  murcielin: {
    n: 'Murcielín', types: ['veneno', 'volador'], base: [40, 45, 35, 30, 40, 55], exp: 49, rate: 255, evo: ['nocturcielo', 22],
    dex: 'Vive en cuevas oscuras. Se orienta con ultrasonidos.',
    learn: [[1, 'mordisco'], [5, 'picotazo_veneno'], [10, 'ataque_ala'], [15, 'acido'], [22, 'bomba_lodo']],
    art: { plan: 'bat', body: '#5a6ab8', belly: '#a8b4e8', accent: '#e05a7a', ears: 'bat', tail: 'none', eyes: 'round', extra: 'fangs' },
  },
  nocturcielo: {
    n: 'Nocturcielo', types: ['veneno', 'volador'], base: [75, 80, 70, 65, 75, 90], exp: 159, rate: 90,
    dex: 'Vuela sin hacer ruido en las noches sin luna.',
    learn: [[1, 'mordisco'], [5, 'picotazo_veneno'], [10, 'ataque_ala'], [15, 'acido'], [24, 'bomba_lodo'], [30, 'golpe_aereo']],
    art: { plan: 'bat', body: '#3f4a98', belly: '#8a96d8', accent: '#e05a7a', ears: 'bat', tail: 'none', eyes: 'fierce', extra: 'fangs', size: 1.2 },
  },
  auroral: {
    n: 'Auroral', types: ['electrico', 'volador'], base: [90, 90, 85, 125, 90, 100], exp: 261, rate: 3,
    dex: 'Una criatura legendaria. Dicen que su aparición trae tormentas de luz al Santuario.',
    learn: [[1, 'rayo'], [1, 'ataque_ala'], [1, 'agilidad'], [1, 'golpe_aereo'], [40, 'golpe_cuerpo']],
    art: { plan: 'bird', body: '#f2d23a', belly: '#fff8d0', accent: '#5ab8f0', ears: 'none', tail: 'bolt', eyes: 'fierce', extra: 'aura', size: 1.3 },
  },
};

// Orden del Criaturario
const DEX_ORDER = ['brasito', 'llamarzorro', 'gotarin', 'marejon', 'brotin', 'frondosaur', 'pipio', 'halconcio', 'roedin', 'roedon', 'larvita', 'alabella', 'chispin', 'voltion', 'pedrusco', 'rocazon', 'setilla', 'hongoloso', 'sombrin', 'espectron', 'charquito', 'ranaldo', 'murcielin', 'nocturcielo', 'auroral'];

/* ══════════════════════════════════════
   OBJETOS
══════════════════════════════════════ */
const ITEMS = {
  pocion:       { n: 'Poción',        price: 300,  heal: 20,  desc: 'Recupera 20 PS.' },
  superpocion:  { n: 'Superpoción',   price: 700,  heal: 60,  desc: 'Recupera 60 PS.' },
  hiperpocion:  { n: 'Hiperpoción',   price: 1200, heal: 200, desc: 'Recupera 200 PS.' },
  antidoto:     { n: 'Antídoto',      price: 100,  cure: 'psn', desc: 'Cura el envenenamiento.' },
  antiquemar:   { n: 'Antiquemar',    price: 250,  cure: 'brn', desc: 'Cura las quemaduras.' },
  antiparaliz:  { n: 'Antiparaliz',   price: 200,  cure: 'par', desc: 'Cura la parálisis.' },
  despertar:    { n: 'Despertar',     price: 250,  cure: 'slp', desc: 'Despierta a una criatura dormida.' },
  curatotal:    { n: 'Cura Total',    price: 600,  cure: 'all', desc: 'Cura cualquier problema de estado.' },
  revivir:      { n: 'Revivir',       price: 1500, revive: 0.5, desc: 'Reanima a una criatura debilitada con la mitad de sus PS.' },
  capsula:      { n: 'Cápsula',       price: 200,  ball: 1,   desc: 'Sirve para capturar criaturas salvajes.' },
  supercapsula: { n: 'Supercápsula',  price: 600,  ball: 1.5, desc: 'Una cápsula mejor que la normal.' },
  ultracapsula: { n: 'Ultracápsula',  price: 1200, ball: 2,   desc: 'Una cápsula de altísima calidad.' },
};

const SHOPS = {
  tienda1: ['capsula', 'pocion', 'antidoto', 'antiparaliz', 'antiquemar', 'despertar'],
  tienda2: ['capsula', 'supercapsula', 'pocion', 'superpocion', 'antidoto', 'antiparaliz', 'antiquemar', 'despertar', 'curatotal', 'revivir'],
};

const MAX_LEVEL = 60;
const expForLevel = lvl => lvl * lvl * lvl;
