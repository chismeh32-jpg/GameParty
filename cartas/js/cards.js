'use strict';

/* ══════════════════════════════════════
   CARTAS: rarezas, expansiones y sobres
   Usa SPECIES, TYPES, MOVES y ITEMS de ../criaturas/js/data.js
══════════════════════════════════════ */
const RARITIES = {
  C:  { name: 'Común',       symbol: '●',   order: 0, value: [0.02, 0.08] },
  U:  { name: 'Poco común',  symbol: '◆',   order: 1, value: [0.05, 0.2] },
  R:  { name: 'Rara',        symbol: '★',   order: 2, value: [0.25, 0.9] },
  H:  { name: 'Rara holo',   symbol: '★',   order: 3, value: [1.2, 3.5],  holo: true },
  UR: { name: 'Ultra rara',  symbol: '★★',  order: 4, value: [5, 14],     holo: true },
  SR: { name: 'Secreta',     symbol: '★★★', order: 5, value: [25, 60],    holo: true },
};

const TYPE_ICON = {
  normal: '✦', fuego: '🔥', agua: '💧', planta: '🍃', electrico: '⚡',
  roca: '⛰️', volador: '🪶', bicho: '🐞', veneno: '☠️', fantasma: '👻',
};

const TRAINER_CARDS = {
  alisa:      { name: 'Profesora Alisa', text: 'Descarta tu mano y roba 7 cartas.', look: 'prof' },
  dani:       { name: 'Dani', text: 'Busca en tu mazo 1 criatura evolucionada y ponla en tu mano.', look: 'rival' },
  petra:      { name: 'Petra', text: 'Las criaturas de tipo Roca reciben 20 de daño menos este turno.', look: 'leader1' },
  volta:      { name: 'Volta', text: 'Une 2 Energías Eléctrico de tu pila de descartes a tus criaturas.', look: 'leader2' },
  joven:      { name: 'Joven entusiasta', text: 'Roba 2 cartas.', look: 'youngster' },
  chica:      { name: 'Chica aventurera', text: 'Mira las 5 primeras cartas de tu mazo y quédate 1.', look: 'lass' },
  cazabichos: { name: 'Cazabichos', text: 'Busca 2 criaturas de tipo Bicho en tu mazo.', look: 'bug' },
  montanero:  { name: 'Montañero', text: 'Busca 1 Energía Roca y únela a una de tus criaturas.', look: 'hiker' },
  medium:     { name: 'Médium', text: 'Tu rival baraja 1 carta de su mano en su mazo.', look: 'medium' },
  ingeniero:  { name: 'Ingeniera', text: 'Mueve 1 Energía de una de tus criaturas a otra.', look: 'engineer' },
};

const ITEM_CARDS = {
  pocion:       { text: 'Cura 30 puntos de daño a 1 de tus criaturas.' },
  superpocion:  { text: 'Cura 60 puntos de daño a 1 de tus criaturas.' },
  hiperpocion:  { text: 'Cura 120 puntos de daño a 1 de tus criaturas.' },
  antidoto:     { text: 'Tu criatura activa ya no está envenenada.' },
  curatotal:    { text: 'Tu criatura activa se recupera de todos los estados.' },
  revivir:      { text: 'Pon en tu banca 1 criatura de tu pila de descartes.' },
  capsula:      { text: 'Lanza una moneda. Si sale cara, busca 1 criatura en tu mazo.', render: 'capsula' },
  supercapsula: { text: 'Busca 1 criatura básica en tu mazo.', render: 'supercapsula' },
  ultracapsula: { text: 'Descarta 2 cartas y busca cualquier criatura en tu mazo.', render: 'ultracapsula' },
};

/* ── Definición de expansiones ───── */
// Cada entrada: [tipo, referencia, rareza, variante]
// variante: 'normal' | 'holo' | 'full' | 'gold' | 'rainbow'
const SET_DEFS = {
  base: {
    name: 'Brisaluz Base', code: 'BRI', level: 1, color: '#e8a030', color2: '#c8402a', mascot: 'llamarzorro', theme: 'day',
    slots: ['C', 'C', 'C', 'C', 'C', 'U', 'U', 'U', 'X', 'RARE'],
    rare: { R: 0.772, H: 0.18, UR: 0.04, SR: 0.008 }, valueMul: 1,
    list: [
      ...['pipio', 'roedin', 'larvita', 'pedrusco', 'setilla', 'sombrin', 'charquito', 'murcielin', 'chispin'].map(s => ['criatura', s, 'C']),
      ...['brasito', 'gotarin', 'brotin', 'halconcio', 'roedon', 'alabella', 'ranaldo', 'nocturcielo'].map(s => ['criatura', s, 'U']),
      ...['llamarzorro', 'marejon', 'frondosaur', 'voltion', 'rocazon', 'hongoloso', 'espectron'].map(s => ['criatura', s, 'R']),
      ...['llamarzorro', 'marejon', 'frondosaur', 'voltion', 'espectron'].map(s => ['criatura', s, 'H', 'holo']),
      ...['joven', 'chica', 'cazabichos', 'montanero'].map(t => ['entrenador', t, 'U']),
      ['entrenador', 'alisa', 'R'], ['entrenador', 'dani', 'R'],
      ...['pocion', 'capsula', 'antidoto'].map(i => ['objeto', i, 'C']),
      ...['superpocion', 'supercapsula', 'revivir'].map(i => ['objeto', i, 'U']),
      ...['fuego', 'agua', 'planta', 'electrico', 'normal'].map(t => ['energia', t, 'C']),
      ...['llamarzorro', 'marejon', 'frondosaur'].map(s => ['criatura', s, 'UR', 'full']),
      ['criatura', 'auroral', 'SR', 'gold'],
    ],
  },
  sombras: {
    name: 'Sombras de Bruma', code: 'SOM', level: 4, color: '#6a4ab8', color2: '#2a1a4a', mascot: 'espectron', theme: 'night',
    slots: ['C', 'C', 'C', 'C', 'C', 'U', 'U', 'U', 'X', 'RARE'],
    rare: { R: 0.7, H: 0.2, UR: 0.08, SR: 0.02 }, valueMul: 1.3,
    list: [
      ...['sombrin', 'murcielin', 'setilla', 'roedin', 'pedrusco', 'charquito', 'larvita'].map(s => ['criatura', s, 'C']),
      ...['nocturcielo', 'hongoloso', 'roedon', 'alabella', 'ranaldo', 'chispin'].map(s => ['criatura', s, 'U']),
      ...['espectron', 'rocazon', 'voltion', 'halconcio'].map(s => ['criatura', s, 'R']),
      ...['espectron', 'nocturcielo', 'hongoloso'].map(s => ['criatura', s, 'H', 'holo']),
      ['entrenador', 'medium', 'U'], ['entrenador', 'ingeniero', 'U'], ['entrenador', 'volta', 'R'], ['entrenador', 'petra', 'R'],
      ['objeto', 'ultracapsula', 'U'], ['objeto', 'curatotal', 'U'], ['objeto', 'hiperpocion', 'R'],
      ...['fantasma', 'veneno', 'roca', 'bicho', 'volador'].map(t => ['energia', t, 'C']),
      ...['espectron', 'nocturcielo', 'voltion'].map(s => ['criatura', s, 'UR', 'full']),
      ['criatura', 'espectron', 'SR', 'gold'], ['criatura', 'sombrin', 'SR', 'rainbow'],
    ],
  },
  leyendas: {
    name: 'Leyendas del Santuario', code: 'LEY', level: 8, color: '#2a9ad8', color2: '#f2c040', mascot: 'auroral', theme: 'legend',
    slots: ['U', 'U', 'U', 'U', 'U', 'R', 'R', 'R', 'RARE', 'RARE'],
    rare: { H: 0.77, UR: 0.2, SR: 0.03 }, valueMul: 0.7,
    list: [
      ...['brasito', 'gotarin', 'brotin', 'pipio', 'chispin', 'charquito'].map(s => ['criatura', s, 'U']),
      ...['llamarzorro', 'marejon', 'frondosaur', 'halconcio', 'voltion', 'ranaldo', 'nocturcielo', 'rocazon'].map(s => ['criatura', s, 'R']),
      ['entrenador', 'alisa', 'R'], ['entrenador', 'dani', 'R'], ['entrenador', 'volta', 'R'],
      ...['llamarzorro', 'marejon', 'frondosaur', 'voltion', 'halconcio'].map(s => ['criatura', s, 'H', 'holo']),
      ...['llamarzorro', 'marejon', 'frondosaur', 'voltion', 'espectron', 'hongoloso', 'rocazon', 'halconcio'].map(s => ['criatura', s, 'UR', 'full']),
      ['criatura', 'auroral', 'SR', 'rainbow'],
      ...['llamarzorro', 'marejon', 'frondosaur'].map(s => ['criatura', s, 'SR', 'gold']),
    ],
  },
};

/* ── Construcción de las cartas ──── */
const CARDS = {};      // id → carta
const SETS = {};       // id → { ...def, cards: [ids] }

function seeded(str) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

const isEvolved = sp => Object.values(SPECIES).some(s => s.evo && s.evo[0] === sp);
const POPULAR = { llamarzorro: 1.6, marejon: 1.5, frondosaur: 1.5, auroral: 2.2, espectron: 1.4, voltion: 1.3, brasito: 1.2, gotarin: 1.15, brotin: 1.15, sombrin: 1.1 };

function creatureStats(sp) {
  const s = SPECIES[sp];
  const evolved = isEvolved(sp);
  const hp = Math.min(200, 10 * Math.round((s.base[0] * 1.1 + 20) / 10) + (evolved ? 20 : 0) + (sp === 'auroral' ? 40 : 0));
  // Ataques: los dos movimientos con daño más potentes que puede aprender
  const dmgMoves = [...new Set(s.learn.map(l => l[1]))].filter(m => MOVES[m].p).sort((a, b) => MOVES[a].p - MOVES[b].p);
  const statusMove = s.learn.map(l => l[1]).find(m => MOVES[m].c === 'status');
  const picks = evolved || sp === 'auroral' ? dmgMoves.slice(-2) : [statusMove, dmgMoves[Math.min(1, dmgMoves.length - 1)]].filter(Boolean);
  const attacks = picks.map(m => {
    const mv = MOVES[m];
    const dmg = mv.p ? 10 * Math.round((mv.p * (evolved ? 1.2 : 0.9)) / 10) : 0;
    const cost = Math.max(1, Math.min(4, Math.round((mv.p || 20) / 35)));
    const text = mv.inflict ? `El rival queda ${STATUS[mv.inflict].label}.` : mv.self ? 'Mejora una estadística de esta criatura.' : mv.foe ? 'Reduce una estadística del rival.' : mv.heal ? 'Cura 30 de daño a esta criatura.' : mv.drain ? 'Cura a esta criatura la mitad del daño hecho.' : mv.status ? `Puede dejar al rival ${STATUS[mv.status[0]].label}.` : '';
    return { name: mv.n, dmg, cost: Array.from({ length: cost }, (_, i) => (i === 0 || cost < 3 ? s.types[0] : 'normal')), text };
  });
  const weak = Object.keys(TYPES).find(t => typeEffect(t, s.types) >= 2);
  const resist = Object.keys(TYPES).find(t => typeEffect(t, s.types) > 0 && typeEffect(t, s.types) <= 0.5);
  const retreat = s.base[5] >= 90 ? 1 : s.base[5] >= 50 ? 2 : 3;
  const prevo = Object.keys(SPECIES).find(k => SPECIES[k].evo && SPECIES[k].evo[0] === sp);
  return { hp, attacks, weak, resist, retreat, stage: prevo ? `Evoluciona de ${SPECIES[prevo].n}` : sp === 'auroral' ? 'Criatura legendaria' : 'Criatura básica' };
}

for (const [setId, def] of Object.entries(SET_DEFS)) {
  const ids = [];
  def.list.forEach(([kind, ref, rarity, variant], i) => {
    const num = i + 1;
    const id = `${def.code}-${String(num).padStart(3, '0')}`;
    const rnd = seeded(id);
    const r = RARITIES[rarity];
    let base = r.value[0] + (r.value[1] - r.value[0]) * rnd();
    if (kind === 'criatura') base *= POPULAR[ref] || 1;
    if (kind === 'energia') base = 0.05 + rnd() * 0.05;
    base *= def.valueMul;
    const card = { id, set: setId, num, total: def.list.length, kind, ref, rarity, variant: variant || (rarity === 'UR' ? 'full' : 'normal'), base: Math.round(base * 100) / 100 };
    if (kind === 'criatura') Object.assign(card, { name: SPECIES[ref].n, type: SPECIES[ref].types[0], ...creatureStats(ref), dex: SPECIES[ref].dex });
    if (kind === 'entrenador') Object.assign(card, { name: TRAINER_CARDS[ref].name, text: TRAINER_CARDS[ref].text });
    if (kind === 'objeto') Object.assign(card, { name: ITEMS[ref].n, text: ITEM_CARDS[ref].text });
    if (kind === 'energia') Object.assign(card, { name: `Energía ${TYPES[ref].name}`, type: ref });
    CARDS[id] = card;
    ids.push(id);
  });
  SETS[setId] = { id: setId, ...def, cards: ids };
}

/* ── Apertura de sobres ──────────── */
function pickWeighted(table) {
  let r = Math.random();
  for (const [k, w] of Object.entries(table)) { r -= w; if (r <= 0) return k; }
  return Object.keys(table)[0];
}

function openPack(setId) {
  const set = SETS[setId];
  const byR = {};
  for (const id of set.cards) (byR[CARDS[id].rarity] ||= []).push(id);
  const pick = r => {
    const pool = byR[r] || byR.C || byR.U;
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const out = set.slots.map(slot => {
    if (slot === 'RARE') return pick(pickWeighted(set.rare));
    if (slot === 'X') return pick(pickWeighted({ C: 0.6, U: 0.3, R: 0.1 }));
    return pick(slot);
  });
  // Las cartas comunes primero; la mejor, al final
  return out.sort((a, b) => RARITIES[CARDS[a].rarity].order - RARITIES[CARDS[b].rarity].order);
}

/* ── Mercado ─────────────────────── */
// Precio del día: varía un ±12 % cada día de forma determinista
function cardPrice(id, day) {
  const c = CARDS[id];
  const rnd = seeded(`${id}-${day}`)();
  return Math.max(0.05, Math.round(c.base * (0.88 + rnd * 0.24) * 100) / 100);
}

const PRODUCTS = {
  sobre_base:     { name: 'Sobre Brisaluz Base', short: 'Sobre Base', kind: 'pack', set: 'base', market: 4.0, cost: 2.4, lot: 10, level: 1, cap: 16 },
  fundas:         { name: 'Fundas para cartas (50)', short: 'Fundas', kind: 'acc', market: 3.5, cost: 1.6, lot: 6, level: 2, cap: 10, icon: '🛡️', color: '#4a8ad8' },
  caja_base:      { name: 'Caja Brisaluz Base (24 sobres)', short: 'Caja Base', kind: 'box', set: 'base', packs: 24, market: 84, cost: 52, lot: 1, level: 3, cap: 3 },
  caja_mazo:      { name: 'Caja de mazo', short: 'Caja de mazo', kind: 'acc', market: 5, cost: 2.4, lot: 6, level: 3, cap: 8, icon: '🗃️', color: '#d8433a' },
  sobre_sombras:  { name: 'Sobre Sombras de Bruma', short: 'Sobre Sombras', kind: 'pack', set: 'sombras', market: 6, cost: 3.6, lot: 10, level: 4, cap: 16 },
  album:          { name: 'Álbum de 9 bolsillos', short: 'Álbum', kind: 'acc', market: 12, cost: 6, lot: 4, level: 5, cap: 6, icon: '📒', color: '#8a5a34' },
  caja_sombras:   { name: 'Caja Sombras de Bruma (24 sobres)', short: 'Caja Sombras', kind: 'box', set: 'sombras', packs: 24, market: 126, cost: 79, lot: 1, level: 6, cap: 3 },
  tapete:         { name: 'Tapete de juego', short: 'Tapete', kind: 'acc', market: 18, cost: 9, lot: 4, level: 7, cap: 6, icon: '🟩', color: '#3a8a4a' },
  sobre_leyendas: { name: 'Sobre Leyendas del Santuario', short: 'Sobre Leyendas', kind: 'pack', set: 'leyendas', market: 14, cost: 8.4, lot: 10, level: 8, cap: 16 },
  caja_leyendas:  { name: 'Caja Leyendas del Santuario (24 sobres)', short: 'Caja Leyendas', kind: 'box', set: 'leyendas', packs: 24, market: 300, cost: 190, lot: 1, level: 10, cap: 3 },
};

const PACK_OF_SET = { base: 'sobre_base', sombras: 'sobre_sombras', leyendas: 'sobre_leyendas' };
const euro = n => `${(Math.round(n * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
