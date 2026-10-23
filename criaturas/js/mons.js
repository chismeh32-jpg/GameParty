'use strict';

/* ══════════════════════════════════════
   CRIATURAS: creación, estadísticas y progreso
══════════════════════════════════════ */
let uidCounter = Date.now() % 100000;
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

function calcStat(base, iv, lvl, isHp) {
  const v = Math.floor(((2 * base + iv) * lvl) / 100);
  return isHp ? v + lvl + 10 : v + 5;
}

function stats(c) {
  const b = SPECIES[c.sp].base;
  const out = {};
  STAT_KEYS.forEach((k, i) => { out[k] = calcStat(b[i], c.iv[k], c.lvl, k === 'hp'); });
  return out;
}

const maxHp = c => stats(c).hp;
const monName = c => c.nick || SPECIES[c.sp].n;

function movesAtLevel(sp, lvl) {
  const learned = [];
  for (const [l, m] of SPECIES[sp].learn) {
    if (l <= lvl && !learned.includes(m)) learned.push(m);
  }
  return learned.slice(-4);
}

function makeMon(sp, lvl) {
  const iv = {};
  for (const k of STAT_KEYS) iv[k] = randInt(0, 15);
  const c = { uid: ++uidCounter, sp, lvl, exp: expForLevel(lvl), iv, status: null, sleep: 0 };
  c.moves = movesAtLevel(sp, lvl).map(id => ({ id, pp: MOVES[id].pp }));
  c.hp = maxHp(c);
  return c;
}

function healMon(c) {
  c.hp = maxHp(c);
  c.status = null;
  c.sleep = 0;
  for (const m of c.moves) m.pp = MOVES[m.id].pp;
}

function expGain(defeated, trainer) {
  const base = SPECIES[defeated.sp].exp;
  return Math.max(1, Math.floor((base * defeated.lvl * (trainer ? 1.5 : 1)) / 7));
}

// Añade experiencia y devuelve los eventos (subidas de nivel, movimientos nuevos)
function addExp(c, amount) {
  const events = [];
  if (c.lvl >= MAX_LEVEL) return events;
  c.exp += amount;
  while (c.lvl < MAX_LEVEL && c.exp >= expForLevel(c.lvl + 1)) {
    const before = stats(c);
    c.lvl++;
    const after = stats(c);
    c.hp = Math.min(after.hp, c.hp + (after.hp - before.hp));
    events.push({ type: 'level', lvl: c.lvl, before, after });
    for (const [l, m] of SPECIES[c.sp].learn) {
      if (l === c.lvl && !c.moves.some(x => x.id === m)) events.push({ type: 'move', move: m });
    }
  }
  return events;
}

function canEvolve(c) {
  const evo = SPECIES[c.sp].evo;
  return evo && c.lvl >= evo[1] ? evo[0] : null;
}

function evolve(c, to) {
  const before = maxHp(c);
  c.sp = to;
  c.hp = Math.min(maxHp(c), c.hp + (maxHp(c) - before));
}

function expProgress(c) {
  if (c.lvl >= MAX_LEVEL) return 1;
  const a = expForLevel(c.lvl), b = expForLevel(c.lvl + 1);
  return Math.max(0, Math.min(1, (c.exp - a) / (b - a)));
}
