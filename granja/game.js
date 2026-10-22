'use strict';

/* ══════════════════════════════════════
   CONFIGURACIÓN
══════════════════════════════════════ */
const COLS = 5;
const BASE_ROWS = 3;
const DAY_MS = 60000;          // 1 día de juego = 60 s reales (06:00 → 24:00)
const DAYS_PER_SEASON = 7;
const SAVE_KEY = 'granja-sim-v1';
const FEED_PRICE = 5;
const DRY_DAYS_TO_DIE = 3;

const SEASONS = [
  { id: 'primavera', name: 'Primavera', emoji: '🌸', article: 'la' },
  { id: 'verano',    name: 'Verano',    emoji: '☀️', article: 'el' },
  { id: 'otono',     name: 'Otoño',     emoji: '🍂', article: 'el' },
  { id: 'invierno',  name: 'Invierno',  emoji: '❄️', article: 'el' },
];

const CROPS = {
  trigo:     { name: 'Trigo',     emoji: '🌾', seed: 10, sell: 24,  days: 3, level: 1, seasons: ['primavera', 'verano', 'otono'] },
  cebolla:   { name: 'Cebolla',   emoji: '🧅', seed: 12, sell: 30,  days: 4, level: 1, seasons: ['invierno', 'primavera'] },
  zanahoria: { name: 'Zanahoria', emoji: '🥕', seed: 15, sell: 38,  days: 4, level: 1, seasons: ['primavera', 'otono'] },
  col:       { name: 'Col',       emoji: '🥬', seed: 20, sell: 55,  days: 5, level: 2, seasons: ['otono', 'invierno'] },
  maiz:      { name: 'Maíz',      emoji: '🌽', seed: 25, sell: 65,  days: 5, level: 2, seasons: ['verano', 'otono'] },
  tomate:    { name: 'Tomate',    emoji: '🍅', seed: 30, sell: 45,  days: 4, level: 3, seasons: ['verano'], regrow: 2 },
  fresa:     { name: 'Fresa',     emoji: '🍓', seed: 40, sell: 55,  days: 4, level: 3, seasons: ['primavera'], regrow: 2 },
  calabaza:  { name: 'Calabaza',  emoji: '🎃', seed: 70, sell: 200, days: 6, level: 4, seasons: ['otono'] },
  sandia:    { name: 'Sandía',    emoji: '🍉', seed: 80, sell: 230, days: 6, level: 5, seasons: ['verano'] },
};

const ANIMALS = {
  gallina: { name: 'Gallina', emoji: '🐔', cost: 150,  feed: 1, product: 'huevo', every: 1, level: 1 },
  oveja:   { name: 'Oveja',   emoji: '🐑', cost: 450,  feed: 2, product: 'lana',  every: 3, level: 2 },
  vaca:    { name: 'Vaca',    emoji: '🐄', cost: 700,  feed: 3, product: 'leche', every: 1, level: 3 },
  cerdo:   { name: 'Cerdo',   emoji: '🐖', cost: 1000, feed: 3, product: 'trufa', every: 2, level: 4 },
};

const PRODUCTS = {
  huevo: { name: 'Huevo', emoji: '🥚', sell: 30 },
  lana:  { name: 'Lana',  emoji: '🧶', sell: 200 },
  leche: { name: 'Leche', emoji: '🥛', sell: 75 },
  trufa: { name: 'Trufa', emoji: '🍄', sell: 220 },
};

// Todo lo que puede guardarse en el granero y venderse
const ITEMS = {};
for (const [id, c] of Object.entries(CROPS)) ITEMS[id] = { name: c.name, emoji: c.emoji, sell: c.sell, crop: true };
for (const [id, p] of Object.entries(PRODUCTS)) ITEMS[id] = { name: p.name, emoji: p.emoji, sell: p.sell, crop: false };

const WEATHER = {
  soleado:  { name: 'Soleado',  emoji: '☀️' },
  nublado:  { name: 'Nublado',  emoji: '☁️' },
  lluvia:   { name: 'Lluvia',   emoji: '🌧️', waters: true },
  tormenta: { name: 'Tormenta', emoji: '⛈️', waters: true },
  nieve:    { name: 'Nieve',    emoji: '🌨️', waters: true },
};

const UPGRADES = [
  { id: 'terreno',        name: 'Ampliar terreno',     emoji: '🚜', desc: '+1 fila de parcelas (5 más)',           max: 3, cost: l => [400, 1200, 3000][l] },
  { id: 'granero',        name: 'Granero más grande',  emoji: '🏚️', desc: '+40 de capacidad en el granero',        max: 4, cost: l => 300 * (l + 1) },
  { id: 'corral',         name: 'Ampliar corral',      emoji: '🪵', desc: '+2 plazas para animales',               max: 4, cost: l => 500 * (l + 1) },
  { id: 'espantapajaros', name: 'Espantapájaros',      emoji: '🧑‍🌾', desc: 'Ahuyenta a los cuervos de tus cultivos', max: 1, cost: () => 350 },
  { id: 'pararrayos',     name: 'Pararrayos',          emoji: '⚡', desc: 'Protege la granja de los rayos',        max: 1, cost: () => 600 },
  { id: 'cafe',           name: 'Cafetera',            emoji: '☕', desc: '+25 de energía máxima',                 max: 2, cost: l => 800 * (l + 1) },
  { id: 'aspersor',       name: 'Aspersores',          emoji: '💦', desc: 'Riegan todas las parcelas cada mañana', max: 1, cost: () => 4000 },
];

const ACHIEVEMENTS = [
  { id: 'cosecha1',   emoji: '🌱', name: 'Primera cosecha',      desc: 'Cosecha tu primer cultivo',          test: s => s.stats.harvests >= 1 },
  { id: 'cosecha100', emoji: '🧺', name: 'Manos de agricultor',  desc: 'Cosecha 100 cultivos',               test: s => s.stats.harvests >= 100 },
  { id: 'animal1',    emoji: '🐣', name: 'Nuevo amigo',          desc: 'Compra tu primer animal',            test: s => s.animals.length >= 1 },
  { id: 'zoo',        emoji: '🐮', name: 'Corral lleno',         desc: 'Ten 6 animales a la vez',            test: s => s.animals.length >= 6 },
  { id: 'feliz',      emoji: '💖', name: 'Animales felices',     desc: 'Un animal con 100 de felicidad',     test: s => s.animals.some(a => a.mood >= 100) },
  { id: 'rico1',      emoji: '💰', name: 'Ahorrador',            desc: 'Ten 1.000 monedas',                  test: s => s.coins >= 1000 },
  { id: 'rico2',      emoji: '🏦', name: 'Terrateniente',        desc: 'Ten 10.000 monedas',                 test: s => s.coins >= 10000 },
  { id: 'nivel5',     emoji: '⭐', name: 'Experto',              desc: 'Alcanza el nivel 5',                 test: s => s.level >= 5 },
  { id: 'anio',       emoji: '📅', name: 'Un año en el campo',   desc: 'Llega al día 29',                    test: s => s.day >= 29 },
  { id: 'max',        emoji: '🗺️', name: 'Latifundio',           desc: 'Amplía el terreno al máximo',        test: s => s.upgrades.terreno >= 3 },
];

const ANIMAL_NAMES = ['Paca', 'Lola', 'Manchas', 'Copito', 'Rufo', 'Pepa', 'Bombón', 'Nube', 'Canela', 'Chispa', 'Tula', 'Kiko', 'Margarita', 'Pancho', 'Luna', 'Rosita'];

const ENERGY_COST = { plant: 2, water: 1, harvest: 1, clear: 2, pet: 2 };

/* ══════════════════════════════════════
   ESTADO
══════════════════════════════════════ */
function emptyPlot() {
  return { crop: null, progress: 0, watered: false, dry: 0, ready: false, dead: false, regrown: false };
}

function newState() {
  const s = {
    version: 1,
    day: 1,
    time: 0,
    coins: 250,
    energy: 100,
    xp: 0,
    level: 1,
    weather: 'soleado',
    plots: Array.from({ length: BASE_ROWS * COLS }, emptyPlot),
    barn: {},
    feed: 3,
    animals: [],
    upgrades: { terreno: 0, granero: 0, corral: 0, espantapajaros: 0, pararrayos: 0, cafe: 0, aspersor: 0 },
    prices: {},
    marketEvent: null,
    stats: { harvests: 0, earned: 0, spent: 0, products: 0, sleeps: 0 },
    achievements: {},
    selectedSeed: 'trigo',
    seenHelp: false,
  };
  rollPrices(s);
  return s;
}

let state = load() || newState();
let paused = false;
let lastTick = performance.now();

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const base = newState();
    return {
      ...base, ...saved,
      upgrades: { ...base.upgrades, ...saved.upgrades },
      stats: { ...base.stats, ...saved.stats },
    };
  } catch (e) {
    return null;
  }
}

/* ══════════════════════════════════════
   DERIVADOS
══════════════════════════════════════ */
const rows = () => BASE_ROWS + state.upgrades.terreno;
const barnCap = () => 40 + 40 * state.upgrades.granero;
const corralCap = () => 2 + 2 * state.upgrades.corral;
const maxEnergy = () => 100 + 25 * state.upgrades.cafe;
const barnUsed = () => Object.values(state.barn).reduce((a, b) => a + b, 0);
const barnFree = () => barnCap() - barnUsed();
const xpNeeded = lvl => 50 + 50 * lvl * lvl;
const feedNeed = () => state.animals.reduce((a, an) => a + ANIMALS[an.type].feed, 0);

function seasonOf(day) { return SEASONS[Math.floor((day - 1) / DAYS_PER_SEASON) % 4]; }
function dayInSeason(day) { return ((day - 1) % DAYS_PER_SEASON) + 1; }
function yearOf(day) { return Math.floor((day - 1) / (DAYS_PER_SEASON * 4)) + 1; }
function targetDays(p) { const c = CROPS[p.crop]; return p.regrown ? c.regrow : c.days; }
function priceOf(id) { return Math.max(1, Math.round(ITEMS[id].sell * (state.prices[id] || 1))); }
function fmt(n) { return n.toLocaleString('es-ES'); }
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ══════════════════════════════════════
   ACCIONES BÁSICAS
══════════════════════════════════════ */
function spendEnergy(n) {
  if (state.energy < n) {
    toast('😴 Estás agotado. ¡Ve a dormir!');
    return false;
  }
  state.energy -= n;
  return true;
}

function addCoins(n) {
  state.coins += n;
  if (n > 0) state.stats.earned += n;
  else state.stats.spent -= n;
}

function addToBarn(id, qty) {
  const added = Math.min(qty, barnFree());
  if (added > 0) state.barn[id] = (state.barn[id] || 0) + added;
  return added;
}

function gainXp(n) {
  state.xp += n;
  while (state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level);
    state.level++;
    const unlocked = [
      ...Object.values(CROPS).filter(c => c.level === state.level).map(c => `${c.emoji} Semilla de ${c.name}`),
      ...Object.values(ANIMALS).filter(a => a.level === state.level).map(a => `${a.emoji} ${a.name}`),
    ];
    showModal(`⭐ ¡Nivel ${state.level}!`,
      `<p>Tu granja prospera.</p>` +
      (unlocked.length ? `<p><strong>Desbloqueado:</strong></p><ul>${unlocked.map(u => `<li>${u}</li>`).join('')}</ul>` : ''),
      [{ label: '¡Genial!', primary: true }]);
  }
}

/* ══════════════════════════════════════
   PARCELAS
══════════════════════════════════════ */
function tapPlot(i) {
  const p = state.plots[i];
  if (p.dead) return clearPlot(i);
  if (!p.crop) return plant(i);
  if (p.ready) return harvest(i);
  if (!p.watered) return water(i);
  const left = targetDays(p) - p.progress;
  toast(`${CROPS[p.crop].emoji} Regada. Lista en ${left} día${left === 1 ? '' : 's'}.`);
}

function canPlant(id) {
  const c = CROPS[id];
  if (state.level < c.level) return `🔒 Necesitas nivel ${c.level}`;
  if (!c.seasons.includes(seasonOf(state.day).id)) return `${c.emoji} No se puede sembrar en ${seasonOf(state.day).name}`;
  if (state.coins < c.seed) return '🪙 No tienes monedas suficientes';
  return null;
}

function plant(i) {
  const id = state.selectedSeed;
  const err = canPlant(id);
  if (err) return toast(err);
  if (!spendEnergy(ENERGY_COST.plant)) return;
  addCoins(-CROPS[id].seed);
  state.plots[i] = { ...emptyPlot(), crop: id, watered: !!WEATHER[state.weather].waters };
  afterAction(i);
}

function water(i, silent) {
  const p = state.plots[i];
  if (!p.crop || p.dead || p.ready || p.watered) return false;
  if (!spendEnergy(ENERGY_COST.water)) return false;
  p.watered = true;
  p.dry = 0;
  if (!silent) afterAction(i);
  return true;
}

function harvest(i, silent) {
  const p = state.plots[i];
  if (!p.ready) return false;
  if (barnFree() < 1) { toast('🏚️ ¡El granero está lleno! Vende algo en el mercado.'); return false; }
  if (!spendEnergy(ENERGY_COST.harvest)) return false;
  const c = CROPS[p.crop];
  addToBarn(p.crop, 1);
  state.stats.harvests++;
  gainXp(Math.max(3, Math.round(c.sell / 5)));
  if (c.regrow) {
    Object.assign(p, { progress: 0, ready: false, watered: false, dry: 0, regrown: true });
  } else {
    state.plots[i] = emptyPlot();
  }
  if (!silent) { toast(`+1 ${c.emoji} ${c.name}`); afterAction(i); }
  return true;
}

function clearPlot(i) {
  if (!spendEnergy(ENERGY_COST.clear)) return;
  state.plots[i] = emptyPlot();
  afterAction(i);
}

function waterAll() {
  let n = 0;
  for (let i = 0; i < state.plots.length; i++) {
    const p = state.plots[i];
    if (!p.crop || p.dead || p.ready || p.watered) continue;
    if (state.energy < ENERGY_COST.water) { toast('😴 Te has quedado sin energía'); break; }
    if (water(i, true)) n++;
  }
  if (n) toast(`💧 Has regado ${n} parcela${n === 1 ? '' : 's'}`);
  else if (state.energy >= ENERGY_COST.water) toast('No hay nada que regar');
  afterAction();
}

function harvestAll() {
  let n = 0;
  for (let i = 0; i < state.plots.length; i++) {
    if (!state.plots[i].ready) continue;
    if (!harvest(i, true)) break;
    n++;
  }
  if (n) toast(`🧺 Has cosechado ${n} cultivo${n === 1 ? '' : 's'}`);
  else if (!state.plots.some(p => p.ready)) toast('Todavía no hay nada listo');
  afterAction();
}

/* ══════════════════════════════════════
   ANIMALES
══════════════════════════════════════ */
function buyAnimal(type) {
  const a = ANIMALS[type];
  if (state.level < a.level) return toast(`🔒 Necesitas nivel ${a.level}`);
  if (state.animals.length >= corralCap()) return toast('🪵 El corral está lleno. ¡Amplíalo en Mejoras!');
  if (state.coins < a.cost) return toast('🪙 No tienes monedas suficientes');
  addCoins(-a.cost);
  const used = state.animals.map(x => x.name);
  const name = pick(ANIMAL_NAMES.filter(n => !used.includes(n))) || pick(ANIMAL_NAMES);
  state.animals.push({ type, name, mood: 60, petted: false, fedDays: 0 });
  toast(`${a.emoji} ¡${name} se une a la granja!`);
  afterAction();
}

function petAnimal(idx) {
  const an = state.animals[idx];
  if (an.petted) return toast(`${an.name} ya ha recibido mimos hoy 💕`);
  if (!spendEnergy(ENERGY_COST.pet)) return;
  an.petted = true;
  an.mood = Math.min(100, an.mood + 12);
  toast(`${ANIMALS[an.type].emoji} ${an.name} está feliz 💕`);
  gainXp(2);
  afterAction();
}

function sellAnimal(idx) {
  const an = state.animals[idx];
  const def = ANIMALS[an.type];
  const value = Math.round(def.cost * 0.5);
  showModal(`¿Vender a ${an.name}?`, `<p>Recibirás ${fmt(value)} 🪙 por tu ${def.name.toLowerCase()}.</p>`, [
    { label: 'Cancelar' },
    { label: 'Vender', primary: true, action: () => {
      state.animals.splice(idx, 1);
      addCoins(value);
      toast(`👋 Adiós, ${an.name}`);
      afterAction();
    } },
  ]);
}

function buyFeed(n) {
  const cost = n * FEED_PRICE;
  if (state.coins < cost) return toast('🪙 No tienes monedas suficientes');
  addCoins(-cost);
  state.feed += n;
  afterAction();
}

/* ══════════════════════════════════════
   MERCADO
══════════════════════════════════════ */
function rollPrices(s) {
  const season = seasonOf(s.day).id;
  s.prices = {};
  for (const id of Object.keys(ITEMS)) {
    let m = rand(0.75, 1.3);
    // Lo que está fuera de temporada se paga mejor
    if (CROPS[id] && !CROPS[id].seasons.includes(season)) m *= 1.25;
    s.prices[id] = Math.round(m * 100) / 100;
  }
  s.marketEvent = null;
  if (Math.random() < 0.12) {
    const id = pick(Object.keys(ITEMS));
    s.prices[id] = Math.round(s.prices[id] * 200) / 100;
    s.marketEvent = id;
  }
}

function sell(id, qty) {
  const have = state.barn[id] || 0;
  const n = Math.min(qty, have);
  if (!n) return;
  const total = n * priceOf(id);
  state.barn[id] = have - n;
  if (!state.barn[id]) delete state.barn[id];
  addCoins(total);
  toast(`💰 +${fmt(total)} por ${n} ${ITEMS[id].emoji}`);
  afterAction();
}

function sellAll() {
  const ids = Object.keys(state.barn);
  if (!ids.length) return toast('El granero está vacío');
  let total = 0, count = 0;
  for (const id of ids) {
    total += state.barn[id] * priceOf(id);
    count += state.barn[id];
  }
  state.barn = {};
  addCoins(total);
  toast(`💰 Has vendido ${count} productos por ${fmt(total)} 🪙`);
  afterAction();
}

/* ══════════════════════════════════════
   MEJORAS
══════════════════════════════════════ */
function buyUpgrade(id) {
  const up = UPGRADES.find(u => u.id === id);
  const lvl = state.upgrades[id];
  if (lvl >= up.max) return;
  const cost = up.cost(lvl);
  if (state.coins < cost) return toast('🪙 No tienes monedas suficientes');
  addCoins(-cost);
  state.upgrades[id]++;
  if (id === 'terreno') {
    for (let i = 0; i < COLS; i++) state.plots.push(emptyPlot());
  }
  if (id === 'cafe') state.energy += 25;
  toast(`${up.emoji} ¡${up.name} comprado!`);
  afterAction();
}

/* ══════════════════════════════════════
   PASO DEL TIEMPO
══════════════════════════════════════ */
function sleep() {
  showModal('🛏️ ¿Irte a dormir?', '<p>Terminará el día y recuperarás toda tu energía.</p>', [
    { label: 'Todavía no' },
    { label: 'Dormir', primary: true, action: () => newDay(false) },
  ]);
}

function newDay(passedOut) {
  const s = state;
  const report = [];
  const oldSeason = seasonOf(s.day);

  // 1. Crecimiento de los cultivos
  let withered = 0, grown = 0;
  for (const p of s.plots) {
    if (!p.crop || p.dead) continue;
    if (p.ready) { p.watered = false; continue; }
    if (p.watered) {
      p.progress++;
      p.dry = 0;
      grown++;
      if (p.progress >= targetDays(p)) p.ready = true;
    } else if (++p.dry >= DRY_DAYS_TO_DIE) {
      p.dead = true;
      withered++;
    }
    p.watered = false;
  }
  if (grown) report.push(`🌱 ${grown} cultivo${grown === 1 ? '' : 's'} han crecido.`);
  if (withered) report.push(`🥀 ${withered} cultivo${withered === 1 ? ' se ha secado' : 's se han secado'} por falta de agua.`);

  // 2. Animales: comer y producir
  const produced = {};
  let hungry = 0, lost = 0;
  for (const an of s.animals) {
    const def = ANIMALS[an.type];
    an.petted = false;
    if (s.feed >= def.feed) {
      s.feed -= def.feed;
      an.fedDays++;
      an.mood = Math.min(100, an.mood + 4);
      if (an.mood >= 30 && an.fedDays % def.every === 0) {
        const qty = an.mood >= 80 && Math.random() < 0.35 ? 2 : 1;
        const added = addToBarn(def.product, qty);
        lost += qty - added;
        if (added) produced[def.product] = (produced[def.product] || 0) + added;
      }
    } else {
      an.mood = Math.max(0, an.mood - 20);
      hungry++;
    }
  }
  for (const [id, n] of Object.entries(produced)) {
    s.stats.products += n;
    report.push(`${PRODUCTS[id].emoji} Tus animales han dado ${n} ${PRODUCTS[id].name.toLowerCase()}${n === 1 ? '' : 's'}.`);
  }
  if (Object.keys(produced).length) gainXp(Object.values(produced).reduce((a, b) => a + b, 0) * 2);
  if (hungry) report.push(`😿 ${hungry} animal${hungry === 1 ? '' : 'es'} se han quedado sin pienso.`);
  if (lost) report.push(`🏚️ El granero estaba lleno: se perdieron ${lost} productos.`);

  // 3. Nuevo día
  s.day++;
  s.time = 0;
  s.stats.sleeps++;
  const season = seasonOf(s.day);
  if (season.id !== oldSeason.id) {
    let killed = 0;
    for (const p of s.plots) {
      if (p.crop && !p.dead && !CROPS[p.crop].seasons.includes(season.id)) { p.dead = true; killed++; }
    }
    report.unshift(`${season.emoji} <strong>¡Empieza ${season.article} ${season.name.toLowerCase()}!</strong>` +
      (season.id === 'primavera' ? ` Año ${yearOf(s.day)}.` : ''));
    if (killed) report.push(`🥀 ${killed} cultivo${killed === 1 ? '' : 's'} no aguantan el cambio de estación.`);
  }

  // 4. Clima
  s.weather = rollWeather(season.id);
  const w = WEATHER[s.weather];
  if (w.waters || s.upgrades.aspersor) {
    for (const p of s.plots) if (p.crop && !p.dead && !p.ready) { p.watered = true; p.dry = 0; }
    report.push(w.waters ? `${w.emoji} Hoy ${s.weather === 'nieve' ? 'nieva' : 'llueve'}: los cultivos ya están regados.` : '💦 Los aspersores han regado tus cultivos.');
  }
  if (s.weather === 'tormenta' && !s.upgrades.pararrayos && Math.random() < 0.5) {
    const targets = s.plots.map((p, i) => i).filter(i => s.plots[i].crop && !s.plots[i].dead);
    if (targets.length) {
      const i = pick(targets);
      report.push(`⚡ ¡Un rayo ha quemado tu ${CROPS[s.plots[i].crop].name.toLowerCase()}!`);
      s.plots[i].dead = true;
    }
  }

  // 5. Cuervos
  if (!s.upgrades.espantapajaros && Math.random() < 0.2) {
    const targets = s.plots.map((p, i) => i).filter(i => s.plots[i].crop && !s.plots[i].dead && !s.plots[i].ready);
    const n = Math.min(targets.length, 1 + Math.floor(Math.random() * 2));
    for (let k = 0; k < n; k++) {
      const idx = targets.splice(Math.floor(Math.random() * targets.length), 1)[0];
      s.plots[idx] = emptyPlot();
    }
    if (n) report.push(`🐦 ¡Los cuervos se han comido ${n} cultivo${n === 1 ? '' : 's'}! Un espantapájaros ayudaría.`);
  }

  // 6. Mercado y energía
  rollPrices(s);
  if (s.marketEvent) report.push(`🎪 ¡Feria en el pueblo! ${ITEMS[s.marketEvent].emoji} ${ITEMS[s.marketEvent].name} se paga al doble hoy.`);
  s.energy = passedOut ? Math.round(maxEnergy() * 0.5) : maxEnergy();
  if (dayInSeason(s.day) === DAYS_PER_SEASON) report.push(`⏳ Último día de ${season.name.toLowerCase()}. ¡Cosecha lo que puedas!`);

  const title = passedOut ? '😵 Te desmayaste en el campo' : `🌅 Día ${s.day}`;
  const intro = passedOut
    ? `<p>Trabajaste hasta medianoche. Despiertas en el día ${s.day} con solo la mitad de energía.</p>`
    : `<p>${season.emoji} ${season.name}, día ${dayInSeason(s.day)} · ${w.emoji} ${w.name}</p>`;
  showModal(title, intro + (report.length ? `<ul>${report.map(r => `<li>${r}</li>`).join('')}</ul>` : '<p>Una noche tranquila en la granja.</p>'),
    [{ label: '¡A trabajar!', primary: true }]);
  afterAction();
}

function rollWeather(season) {
  const r = Math.random();
  if (season === 'invierno') return r < 0.3 ? 'nieve' : r < 0.45 ? 'nublado' : 'soleado';
  if (season === 'verano') return r < 0.12 ? 'lluvia' : r < 0.18 ? 'tormenta' : 'soleado';
  return r < 0.28 ? 'lluvia' : r < 0.33 ? 'tormenta' : r < 0.5 ? 'nublado' : 'soleado';
}

function tick(now) {
  const dt = now - lastTick;
  lastTick = now;
  if (!paused && !modalOpen() && !document.hidden) {
    state.time += dt / DAY_MS;
    if (state.time >= 1) {
      state.time = 1;
      newDay(true);
    }
    renderClock();
  }
  requestAnimationFrame(tick);
}

/* ══════════════════════════════════════
   LOGROS
══════════════════════════════════════ */
function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements[a.id] && a.test(state)) {
      state.achievements[a.id] = state.day;
      toast(`🏆 Logro: ${a.name}`);
    }
  }
}

function afterAction(plotIndex) {
  checkAchievements();
  save();
  render();
  if (plotIndex !== undefined) {
    const el = document.querySelector(`.plot[data-i="${plotIndex}"]`);
    if (el) el.classList.add('pop');
  }
}

/* ══════════════════════════════════════
   UI: utilidades
══════════════════════════════════════ */
const $ = sel => document.querySelector(sel);

function toast(msg) {
  const wrap = $('#toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  while (wrap.children.length > 3) wrap.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2200);
}

const modalQueue = [];
function modalOpen() { return !$('#modal').classList.contains('hidden'); }

function showModal(title, html, buttons) {
  modalQueue.push({ title, html, buttons });
  if (!modalOpen()) nextModal();
}

function nextModal() {
  const m = modalQueue.shift();
  if (!m) { $('#modal').classList.add('hidden'); lastTick = performance.now(); return; }
  $('#modal-title').textContent = m.title;
  $('#modal-body').innerHTML = m.html;
  const actions = $('#modal-actions');
  actions.innerHTML = '';
  for (const b of m.buttons) {
    const btn = document.createElement('button');
    btn.className = 'btn' + (b.primary ? ' primary' : '');
    btn.textContent = b.label;
    btn.onclick = () => { nextModal(); if (b.action) b.action(); };
    actions.appendChild(btn);
  }
  $('#modal').classList.remove('hidden');
}

function showHelp() {
  showModal('🌾 Cómo jugar', `
    <p>Has heredado una pequeña granja. ¡Hazla prosperar!</p>
    <ul>
      <li>🌱 <strong>Siembra</strong>: elige una semilla y toca una parcela vacía.</li>
      <li>💧 <strong>Riega</strong> cada día: los cultivos solo crecen si tienen agua. Tres días secos y se mueren.</li>
      <li>🧺 <strong>Cosecha</strong> cuando brillen y vende en el 🏪 mercado. Los precios cambian cada día.</li>
      <li>🍂 Cada estación dura ${DAYS_PER_SEASON} días. Los cultivos fuera de temporada se marchitan.</li>
      <li>🐔 Los <strong>animales</strong> producen cada día si tienen pienso. ¡Acarícialos para que estén felices!</li>
      <li>⚡ Cada acción gasta energía. 🛏️ Duerme para recuperarla; si llegas a medianoche, te desmayas.</li>
      <li>🔧 Invierte en <strong>mejoras</strong> y sube de nivel para desbloquear nuevas semillas y animales.</li>
    </ul>`, [{ label: '¡Vamos!', primary: true }]);
}

/* ══════════════════════════════════════
   UI: render
══════════════════════════════════════ */
function renderClock() {
  const minutes = Math.min(18 * 60 - 1, Math.floor(state.time * 18 * 60));
  const h = 6 + Math.floor(minutes / 60);
  const m = Math.floor((minutes % 60) / 10) * 10;
  $('#hud-clock').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  $('#daybar-fill').style.width = `${state.time * 100}%`;
  $('#hud-clock').style.color = h >= 22 ? 'var(--danger)' : '';
}

function renderHud() {
  const season = seasonOf(state.day);
  $('#hud-season').textContent = `${season.emoji} ${season.name}`;
  $('#hud-day').textContent = `Día ${state.day}`;
  const w = WEATHER[state.weather];
  $('#hud-weather').textContent = w.emoji;
  $('#hud-weather').title = w.name;
  $('#hud-coins').textContent = fmt(state.coins);
  $('#hud-energy').textContent = `${state.energy}/${maxEnergy()}`;
  $('#energy-fill').style.width = `${(state.energy / maxEnergy()) * 100}%`;
  $('#hud-level').textContent = state.level;
  $('#xp-fill').style.width = `${(state.xp / xpNeeded(state.level)) * 100}%`;
  $('#btn-pause').textContent = paused ? '▶️' : '⏸️';
  renderClock();
}

function renderFarm() {
  const season = seasonOf(state.day);
  const note = $('#season-note');
  const dis = dayInSeason(state.day);
  if (dis === DAYS_PER_SEASON) {
    note.textContent = `⏳ Último día de ${season.name.toLowerCase()}: mañana se marchitarán los cultivos que no sean de la nueva estación.`;
    note.classList.remove('hidden');
  } else if (state.marketEvent) {
    note.textContent = `🎪 ¡Feria! ${ITEMS[state.marketEvent].emoji} ${ITEMS[state.marketEvent].name} se paga al doble hoy en el mercado.`;
    note.classList.remove('hidden');
  } else {
    note.classList.add('hidden');
  }

  const grid = $('#farm-grid');
  grid.innerHTML = '';
  state.plots.forEach((p, i) => {
    const el = document.createElement('button');
    el.className = 'plot';
    el.dataset.i = i;
    let label = 'Parcela vacía';
    if (p.dead) {
      el.classList.add('dead');
      el.textContent = '🥀';
      label = 'Cultivo seco: toca para limpiar';
    } else if (p.crop) {
      const c = CROPS[p.crop];
      const frac = p.progress / targetDays(p);
      if (p.ready) {
        el.classList.add('ready');
        el.textContent = c.emoji;
        label = `${c.name} lista para cosechar`;
      } else {
        el.textContent = p.regrown ? '🌿' : frac < 0.34 ? '🌱' : '🌿';
        const bar = document.createElement('div');
        bar.className = 'prog';
        bar.innerHTML = `<div style="width:${Math.max(6, frac * 100)}%"></div>`;
        el.appendChild(bar);
        label = `${c.name}: ${p.progress}/${targetDays(p)} días`;
      }
      if (p.watered) el.classList.add('wet');
      else if (!p.ready) el.classList.add('thirsty');
    }
    el.setAttribute('aria-label', label);
    el.title = label;
    el.onclick = () => tapPlot(i);
    grid.appendChild(el);
  });

  const list = $('#seed-list');
  list.innerHTML = '';
  for (const [id, c] of Object.entries(CROPS)) {
    const el = document.createElement('button');
    const locked = state.level < c.level;
    const off = !c.seasons.includes(season.id);
    el.className = 'seed' + (state.selectedSeed === id ? ' selected' : '') + (locked ? ' locked' : '') + (off ? ' off' : '');
    const seasonIcons = c.seasons.map(sid => SEASONS.find(x => x.id === sid).emoji).join('');
    el.innerHTML = `
      <div class="emoji">${locked ? '🔒' : c.emoji}</div>
      <div class="name">${c.name}</div>
      <div class="meta">🪙 ${c.seed} → ${c.sell}</div>
      <div class="meta">⏱️ ${c.days} días${c.regrow ? ` · ♻️ ${c.regrow}` : ''}</div>
      <div class="tag">${locked ? `Nivel ${c.level}` : seasonIcons}</div>`;
    el.onclick = () => {
      state.selectedSeed = id;
      if (locked) toast(`🔒 Se desbloquea en el nivel ${c.level}`);
      else if (off) toast(`${c.emoji} ${c.name} no se siembra en ${season.name.toLowerCase()}`);
      save();
      renderFarm();
    };
    list.appendChild(el);
  }
}

function renderAnimals() {
  $('#feed-count').textContent = state.feed;
  $('#feed-need').textContent = feedNeed();
  $('#corral-count').textContent = `${state.animals.length}/${corralCap()}`;
  document.querySelectorAll('[data-buy-feed]').forEach(b => {
    const n = +b.dataset.buyFeed;
    b.textContent = `+${n} · ${n * FEED_PRICE}🪙`;
    b.disabled = state.coins < n * FEED_PRICE;
  });

  const list = $('#animal-list');
  list.innerHTML = '';
  if (!state.animals.length) {
    list.innerHTML = '<div class="card empty-state">Todavía no tienes animales. ¡Compra una gallina para empezar!</div>';
  }
  state.animals.forEach((an, idx) => {
    const def = ANIMALS[an.type];
    const p = PRODUCTS[def.product];
    const daysLeft = def.every - (an.fedDays % def.every);
    const mood = an.mood >= 80 ? '😄 Muy feliz' : an.mood >= 50 ? '🙂 Contento' : an.mood >= 30 ? '😐 Regular' : '😢 Triste (no produce)';
    const el = document.createElement('div');
    el.className = 'card row-item';
    el.innerHTML = `
      <div class="big">${def.emoji}</div>
      <div class="info">
        <div class="title">${an.name} <span class="muted">· ${def.name}</span></div>
        <div class="sub">${mood}</div>
        <div class="meter mood wide"><div style="width:${an.mood}%"></div></div>
        <div class="sub">${p.emoji} ${def.every === 1 ? 'Produce cada día' : `Produce en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`} · 🌾 ${def.feed}/día</div>
      </div>
      <div class="actions" style="flex-direction:column">
        <button class="btn small" data-pet="${idx}" ${an.petted ? 'disabled' : ''}>${an.petted ? '💕' : '🤚 Mimar'}</button>
        <button class="btn small" data-sell-animal="${idx}">Vender</button>
      </div>`;
    list.appendChild(el);
  });
  list.querySelectorAll('[data-pet]').forEach(b => b.onclick = () => petAnimal(+b.dataset.pet));
  list.querySelectorAll('[data-sell-animal]').forEach(b => b.onclick = () => sellAnimal(+b.dataset.sellAnimal));

  const shop = $('#animal-shop');
  shop.innerHTML = '';
  for (const [id, a] of Object.entries(ANIMALS)) {
    const p = PRODUCTS[a.product];
    const locked = state.level < a.level;
    const el = document.createElement('div');
    el.className = 'card row-item';
    el.innerHTML = `
      <div class="big">${locked ? '🔒' : a.emoji}</div>
      <div class="info">
        <div class="title">${a.name}</div>
        <div class="sub">${p.emoji} ${p.name} ${a.every === 1 ? 'cada día' : `cada ${a.every} días`} (~${p.sell}🪙) · 🌾 ${a.feed}/día</div>
      </div>
      <div class="actions">
        <button class="btn small ${locked ? '' : 'primary'}" ${locked || state.coins < a.cost ? 'disabled' : ''}>${locked ? `Nivel ${a.level}` : `${fmt(a.cost)} 🪙`}</button>
      </div>`;
    el.querySelector('button').onclick = () => buyAnimal(id);
    shop.appendChild(el);
  }
}

function renderMarket() {
  const used = barnUsed(), cap = barnCap();
  $('#barn-usage').textContent = `${used}/${cap}`;
  $('#barn-fill').style.width = `${(used / cap) * 100}%`;
  $('#market-event').textContent = state.marketEvent
    ? `🎪 ¡Feria! ${ITEMS[state.marketEvent].emoji} ${ITEMS[state.marketEvent].name} al doble de precio hoy.`
    : 'Los precios cambian cada mañana. Lo que está fuera de temporada se paga mejor.';

  const list = $('#market-list');
  list.innerHTML = '';
  const ids = Object.keys(ITEMS).sort((a, b) => (state.barn[b] || 0) - (state.barn[a] || 0));
  for (const id of ids) {
    const it = ITEMS[id];
    const have = state.barn[id] || 0;
    const price = priceOf(id);
    const diff = Math.round(((price - it.sell) / it.sell) * 100);
    const trend = diff >= 5 ? `<span class="price-up">▲ ${diff}%</span>` : diff <= -5 ? `<span class="price-down">▼ ${-diff}%</span>` : '<span class="muted">=</span>';
    const el = document.createElement('div');
    el.className = 'card row-item';
    if (!have) el.style.opacity = '.55';
    el.innerHTML = `
      <div class="big">${it.emoji}</div>
      <div class="info">
        <div class="title">${it.name} <span class="muted">× ${have}</span></div>
        <div class="sub">🪙 ${price} c/u ${trend}</div>
      </div>
      <div class="actions">
        <button class="btn small" data-n="1" ${have ? '' : 'disabled'}>Vender 1</button>
        <button class="btn small primary" data-n="all" ${have ? '' : 'disabled'}>Todo</button>
      </div>`;
    el.querySelectorAll('button').forEach(b => b.onclick = () => sell(id, b.dataset.n === 'all' ? Infinity : 1));
    list.appendChild(el);
  }
  $('#btn-sell-all').disabled = !used;
}

function renderUpgrades() {
  const list = $('#upgrade-list');
  list.innerHTML = '';
  for (const up of UPGRADES) {
    const lvl = state.upgrades[up.id];
    const maxed = lvl >= up.max;
    const cost = maxed ? 0 : up.cost(lvl);
    const el = document.createElement('div');
    el.className = 'card row-item';
    el.innerHTML = `
      <div class="big">${up.emoji}</div>
      <div class="info">
        <div class="title">${up.name} ${up.max > 1 ? `<span class="muted">${lvl}/${up.max}</span>` : ''}</div>
        <div class="sub">${up.desc}</div>
      </div>
      <div class="actions">
        <button class="btn small ${maxed ? '' : 'primary'}" ${maxed || state.coins < cost ? 'disabled' : ''}>${maxed ? '✅' : `${fmt(cost)} 🪙`}</button>
      </div>`;
    el.querySelector('button').onclick = () => buyUpgrade(up.id);
    list.appendChild(el);
  }
}

function renderAchievements() {
  const got = ACHIEVEMENTS.filter(a => state.achievements[a.id]).length;
  $('#ach-count').textContent = `${got}/${ACHIEVEMENTS.length}`;
  $('#ach-list').innerHTML = ACHIEVEMENTS.map(a => `
    <div class="ach ${state.achievements[a.id] ? '' : 'locked'}">
      <div class="emoji">${a.emoji}</div>
      <div class="name">${a.name}</div>
      <div class="desc">${a.desc}</div>
    </div>`).join('');

  const rowsData = [
    ['📅 Días en la granja', state.day],
    ['🗓️ Año', yearOf(state.day)],
    ['🧺 Cultivos cosechados', state.stats.harvests],
    ['🥚 Productos animales', state.stats.products],
    ['💰 Monedas ganadas', fmt(state.stats.earned)],
    ['🛒 Monedas gastadas', fmt(state.stats.spent)],
    ['🟫 Parcelas', state.plots.length],
  ];
  $('#stats-list').innerHTML = rowsData.map(([k, v]) => `<span>${k}</span><strong>${v}</strong>`).join('');
}

function render() {
  renderHud();
  renderFarm();
  renderAnimals();
  renderMarket();
  renderUpgrades();
  renderAchievements();
}

/* ══════════════════════════════════════
   EVENTOS
══════════════════════════════════════ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.id === `tab-${btn.dataset.tab}`));
    window.scrollTo({ top: 0 });
  };
});

$('#btn-pause').onclick = () => {
  paused = !paused;
  lastTick = performance.now();
  toast(paused ? '⏸️ Tiempo en pausa' : '▶️ El tiempo vuelve a correr');
  renderHud();
};
$('#btn-sleep').onclick = sleep;
$('#btn-water-all').onclick = waterAll;
$('#btn-harvest-all').onclick = harvestAll;
$('#btn-sell-all').onclick = sellAll;
$('#btn-help').onclick = showHelp;
document.querySelectorAll('[data-buy-feed]').forEach(b => b.onclick = () => buyFeed(+b.dataset.buyFeed));
$('#btn-reset').onclick = () => showModal('🗑️ ¿Empezar de cero?', '<p>Se borrará tu granja actual. Esta acción no se puede deshacer.</p>', [
  { label: 'Cancelar' },
  { label: 'Borrar y empezar', primary: true, action: () => { state = newState(); state.seenHelp = true; save(); render(); toast('🌱 ¡Nueva granja!'); } },
]);

document.addEventListener('visibilitychange', () => {
  lastTick = performance.now();
  if (document.hidden) save();
});
window.addEventListener('beforeunload', save);

/* ══════════════════════════════════════
   INICIO
══════════════════════════════════════ */
render();
if (!state.seenHelp) {
  state.seenHelp = true;
  save();
  showHelp();
}
requestAnimationFrame(t => { lastTick = t; requestAnimationFrame(tick); });
