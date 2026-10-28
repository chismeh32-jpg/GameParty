'use strict';

/* ══════════════════════════════════════
   ESTADO
══════════════════════════════════════ */
function emptyPlot() {
  return { tilled: false, crop: null, progress: 0, watered: false, dry: 0, ready: false, dead: false, regrown: false };
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
    plots: Array.from({ length: FIELD.cols * FIELD.maxRows }, emptyPlot),
    water: 15,
    barn: {},
    feed: 3,
    animals: [],
    upgrades: { terreno: 0, regadera: 0, granero: 0, corral: 0, espantapajaros: 0, pararrayos: 0, cafe: 0, aspersor: 0 },
    prices: {},
    marketEvent: null,
    stats: { harvests: 0, earned: 0, spent: 0, products: 0, sleeps: 0 },
    achievements: {},
    tool: 'azada',
    player: { x: 5.5, y: 7, dir: 'down' },
    seenHelp: false,
  };
  rollPrices(s);
  return s;
}

let state = load() || newState();
let paused = false;

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
      player: { ...base.player, ...saved.player },
    };
  } catch (e) {
    return null;
  }
}

/* ══════════════════════════════════════
   DERIVADOS
══════════════════════════════════════ */
const fieldRows = () => FIELD.baseRows + state.upgrades.terreno;
const canCap = () => 15 + 15 * state.upgrades.regadera;
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
function plural(n, one, many) { return n === 1 ? one : many; }

/* ══════════════════════════════════════
   MUNDO
══════════════════════════════════════ */
const G_GRASS = 0, G_PATH = 1, G_FIELD = 2, G_WATER = 3;
const ground = new Uint8Array(MAP_W * MAP_H);
const solid = new Uint8Array(MAP_W * MAP_H);
const fences = new Uint8Array(MAP_W * MAP_H);
const treeList = [];
const idx = (x, y) => y * MAP_W + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;

function buildWorld() {
  const addTree = (x, y) => {
    if (solid[idx(x, y)]) return;
    treeList.push({ x, y, variant: Math.floor(Sprites.hash(x, y, 3) * 2) });
    solid[idx(x, y)] = 1;
  };
  // Caminos
  for (let x = 3; x <= 20; x++) ground[idx(x, 7)] = G_PATH;
  for (let y = 6; y <= 9; y++) ground[idx(5, y)] = G_PATH;
  for (let y = 8; y <= 18; y++) ground[idx(12, y)] = G_PATH;
  for (let x = 5; x <= 12; x++) ground[idx(x, 18)] = G_PATH;
  for (const b of BUILDINGS) if (b.h > 1) ground[idx(b.door.x, b.door.y + 1)] = G_PATH;
  // Huerto
  for (let y = 0; y < FIELD.maxRows; y++) for (let x = 0; x < FIELD.cols; x++) ground[idx(FIELD.x + x, FIELD.y + y)] = G_FIELD;
  // Estanque (esquinas redondeadas)
  for (let y = POND.y; y < POND.y + POND.h; y++) {
    for (let x = POND.x; x < POND.x + POND.w; x++) {
      const corner = (x === POND.x || x === POND.x + POND.w - 1) && (y === POND.y || y === POND.y + POND.h - 1);
      if (corner) continue;
      ground[idx(x, y)] = G_WATER;
      solid[idx(x, y)] = 1;
    }
  }
  // Valla del corral, con puerta a la izquierda
  for (let x = CORRAL.x; x < CORRAL.x + CORRAL.w; x++) {
    fences[idx(x, CORRAL.y)] = 1;
    fences[idx(x, CORRAL.y + CORRAL.h - 1)] = 1;
  }
  for (let y = CORRAL.y; y < CORRAL.y + CORRAL.h; y++) {
    if (y !== CORRAL.gateY) fences[idx(CORRAL.x, y)] = 1;
    fences[idx(CORRAL.x + CORRAL.w - 1, y)] = 1;
  }
  fences.forEach((f, i) => { if (f) solid[i] = 1; });
  // Edificios
  for (const b of BUILDINGS) {
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) solid[idx(x, y)] = 1;
  }
  // Árboles: borde del mapa y decorativos
  for (const [x, y] of TREES) addTree(x, y);
  for (let x = 0; x < MAP_W; x++) { addTree(x, 0); addTree(x, MAP_H - 1); }
  for (let y = 1; y < MAP_H - 1; y++) { addTree(0, y); addTree(MAP_W - 1, y); }
  for (let x = 1; x < MAP_W - 1; x++) if (x < CORRAL.x || x >= CORRAL.x + CORRAL.w) addTree(x, 1);
}

function isSolidTile(x, y) {
  if (!inMap(x, y)) return true;
  return solid[idx(x, y)] === 1;
}

function buildingAt(x, y) {
  return BUILDINGS.find(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
}

function plotIndexAt(x, y) {
  const cx = x - FIELD.x, cy = y - FIELD.y;
  if (cx < 0 || cy < 0 || cx >= FIELD.cols || cy >= FIELD.maxRows) return -1;
  return cy * FIELD.cols + cx;
}

function plotTile(i) {
  return { x: FIELD.x + (i % FIELD.cols), y: FIELD.y + Math.floor(i / FIELD.cols) };
}

const plotUnlocked = i => Math.floor(i / FIELD.cols) < fieldRows();

/* ══════════════════════════════════════
   ACCIONES BÁSICAS
══════════════════════════════════════ */
function spendEnergy(n) {
  if (state.energy < n) {
    toast('😴 Estás agotado. ¡Vuelve a casa a dormir!');
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
      '<p>Tu granja prospera.</p>' +
      (unlocked.length ? `<p><strong>Desbloqueado:</strong></p><ul>${unlocked.map(u => `<li>${u}</li>`).join('')}</ul>` : ''),
      [{ label: '¡Genial!', primary: true }]);
  }
}

/* ══════════════════════════════════════
   HUERTO
══════════════════════════════════════ */
function canPlant(id) {
  const c = CROPS[id];
  if (state.level < c.level) return `🔒 Necesitas nivel ${c.level}`;
  if (!c.seasons.includes(seasonOf(state.day).id)) return `${c.emoji} No se puede sembrar en ${seasonOf(state.day).name.toLowerCase()}`;
  if (state.coins < c.seed) return '🪙 No tienes monedas suficientes';
  return null;
}

function actPlot(i) {
  const p = state.plots[i];
  const tool = state.tool;
  if (p.ready) return harvest(i);
  if (tool === 'azada') {
    if (p.dead) return clearPlot(i);
    if (p.crop) return toast(`${CROPS[p.crop].emoji} Aquí ya crece ${CROPS[p.crop].name.toLowerCase()}`);
    if (p.tilled) return toast('Ya está arada. Elige una semilla en la barra 🌱');
    if (!spendEnergy(ENERGY_COST.till)) return;
    p.tilled = true;
    p.watered = !!WEATHER[state.weather].waters;
    puff(i, '#a07646');
    return afterAction();
  }
  if (tool === 'regadera') {
    if (!p.tilled) return toast('Primero ara la tierra con la azada ⛏️');
    if (p.dead) return toast('🥀 Está seco. Límpialo con la azada');
    if (p.watered) return p.crop ? toast(`💧 Ya está regada. Lista en ${targetDays(p) - p.progress} ${plural(targetDays(p) - p.progress, 'día', 'días')}`) : toast('💧 Ya está regada');
    if (state.water <= 0) return toast('🪣 La regadera está vacía. Rellénala en el estanque');
    if (!spendEnergy(ENERGY_COST.water)) return;
    state.water--;
    p.watered = true;
    p.dry = 0;
    puff(i, '#6ab8e8');
    return afterAction();
  }
  // Semilla
  if (p.dead) return toast('🥀 Limpia el cultivo seco con la azada');
  if (p.crop) return toast(`${CROPS[p.crop].emoji} Aquí ya crece ${CROPS[p.crop].name.toLowerCase()}`);
  if (!p.tilled) return toast('Primero ara la tierra con la azada ⛏️');
  const err = canPlant(tool);
  if (err) return toast(err);
  if (!spendEnergy(ENERGY_COST.plant)) return;
  addCoins(-CROPS[tool].seed);
  Object.assign(p, { crop: tool, progress: 0, ready: false, dead: false, dry: 0, regrown: false });
  puff(i, '#7cbf4f');
  afterAction();
}

function harvest(i) {
  const p = state.plots[i];
  if (barnFree() < 1) return toast('🏚️ ¡El granero está lleno! Vende algo en la caja de envíos');
  if (!spendEnergy(ENERGY_COST.harvest)) return;
  const c = CROPS[p.crop];
  addToBarn(p.crop, 1);
  state.stats.harvests++;
  gainXp(Math.max(3, Math.round(c.sell / 5)));
  const t = plotTile(i);
  floatText(t.x + 0.5, t.y, `+1 ${c.emoji}`);
  if (c.regrow) {
    Object.assign(p, { progress: 0, ready: false, watered: false, dry: 0, regrown: true });
  } else {
    Object.assign(p, { crop: null, progress: 0, ready: false, dry: 0, regrown: false });
  }
  afterAction();
}

function clearPlot(i) {
  if (!spendEnergy(ENERGY_COST.clear)) return;
  Object.assign(state.plots[i], { crop: null, progress: 0, ready: false, dead: false, dry: 0, regrown: false });
  puff(i, '#9c845c');
  afterAction();
}

function refillCan() {
  if (state.water >= canCap()) return toast('🪣 La regadera ya está llena');
  state.water = canCap();
  toast(`💧 Regadera llena (${state.water})`);
  afterAction();
}

/* ══════════════════════════════════════
   ANIMALES
══════════════════════════════════════ */
function randomCorralSpot() {
  return { x: rand(CORRAL.x + 1.6, CORRAL.x + CORRAL.w - 1.6), y: rand(CORRAL.gateY + 1.8, CORRAL.y + CORRAL.h - 1.4) };
}

function buyAnimal(type) {
  const a = ANIMALS[type];
  if (state.level < a.level) return toast(`🔒 Necesitas nivel ${a.level}`);
  if (state.animals.length >= corralCap()) return toast('🪵 El establo está lleno. ¡Amplíalo en el taller!');
  if (state.coins < a.cost) return toast('🪙 No tienes monedas suficientes');
  addCoins(-a.cost);
  const used = state.animals.map(x => x.name);
  const name = pick(ANIMAL_NAMES.filter(n => !used.includes(n))) || pick(ANIMAL_NAMES);
  const spot = { x: CORRAL.x + CORRAL.w / 2 - 1, y: CORRAL.gateY + 1.5 };
  state.animals.push({ type, name, mood: 60, petted: false, fedDays: 0, pending: null, pendingQty: 0, ...spot });
  toast(`${a.emoji} ¡${name} se une a la granja!`);
  afterAction();
}

function interactAnimal(an) {
  const def = ANIMALS[an.type];
  if (an.pending) {
    const added = addToBarn(an.pending, an.pendingQty);
    if (!added) return toast('🏚️ ¡El granero está lleno!');
    const p = PRODUCTS[an.pending];
    floatText(an.x, an.y - 1, `+${added} ${p.emoji}`);
    state.stats.products += added;
    gainXp(2 * added);
    an.pendingQty -= added;
    if (!an.pendingQty) an.pending = null;
    return afterAction();
  }
  if (an.petted) return toast(`${def.emoji} ${an.name} ya ha recibido mimos hoy`);
  if (!spendEnergy(ENERGY_COST.pet)) return;
  an.petted = true;
  an.mood = Math.min(100, an.mood + 12);
  floatText(an.x, an.y - 1, '❤️');
  toast(`${def.emoji} ${an.name} está feliz`);
  gainXp(2);
  afterAction();
}

function sellAnimal(i) {
  const an = state.animals[i];
  const def = ANIMALS[an.type];
  const value = Math.round(def.cost * 0.5);
  showModal(`¿Vender a ${an.name}?`, `<p>Recibirás ${fmt(value)} 🪙 por tu ${def.name.toLowerCase()}.</p>`, [
    { label: 'Cancelar' },
    { label: 'Vender', primary: true, action: () => {
      state.animals.splice(i, 1);
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
  if (id === 'cafe') state.energy += 25;
  if (id === 'regadera') state.water = canCap();
  toast(`${up.emoji} ¡${up.name} comprado!`);
  afterAction();
}

/* ══════════════════════════════════════
   PASO DEL TIEMPO
══════════════════════════════════════ */
function askSleep() {
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
    if (!p.crop || p.dead) { p.watered = false; continue; }
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
  if (grown) report.push(`🌱 ${grown} ${plural(grown, 'cultivo ha crecido', 'cultivos han crecido')}.`);
  if (withered) report.push(`🥀 ${withered} ${plural(withered, 'cultivo se ha secado', 'cultivos se han secado')} por falta de agua.`);

  // 2. Animales: comen y dejan sus productos para recogerlos por la mañana
  let hungry = 0, ready = 0;
  for (const an of s.animals) {
    const def = ANIMALS[an.type];
    if (!an.petted) an.mood = Math.max(0, an.mood - 4);
    an.petted = false;
    if (s.feed >= def.feed) {
      s.feed -= def.feed;
      an.fedDays++;
      an.mood = Math.min(100, an.mood + 4);
      if (an.mood >= 30 && an.fedDays % def.every === 0 && !an.pending) {
        an.pending = def.product;
        an.pendingQty = an.mood >= 80 && Math.random() < 0.35 ? 2 : 1;
        ready++;
      }
    } else {
      an.mood = Math.max(0, an.mood - 20);
      hungry++;
    }
    Object.assign(an, randomCorralSpot());
  }
  if (ready) report.push(`🧺 ${ready} ${plural(ready, 'animal tiene', 'animales tienen')} algo para ti en el corral.`);
  if (hungry) report.push(`😿 ${hungry} ${plural(hungry, 'animal se ha quedado', 'animales se han quedado')} sin pienso.`);

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
    if (killed) report.push(`🥀 ${killed} ${plural(killed, 'cultivo no aguanta', 'cultivos no aguantan')} el cambio de estación.`);
  }

  // 4. Clima
  s.weather = rollWeather(season.id);
  const w = WEATHER[s.weather];
  if (w.waters || s.upgrades.aspersor) {
    for (const p of s.plots) if (p.tilled && !p.dead) { p.watered = true; p.dry = 0; }
    report.push(w.waters ? `${w.emoji} Hoy ${s.weather === 'nieve' ? 'nieva' : 'llueve'}: el huerto ya está regado.` : '💦 Los aspersores han regado el huerto.');
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
      const i = targets.splice(Math.floor(Math.random() * targets.length), 1)[0];
      Object.assign(s.plots[i], { crop: null, progress: 0, ready: false, dry: 0, regrown: false });
    }
    if (n) report.push(`🐦 ¡Los cuervos se han comido ${n} ${plural(n, 'cultivo', 'cultivos')}! Un espantapájaros ayudaría.`);
  }

  // 6. Mercado, energía y vuelta a casa
  rollPrices(s);
  if (s.marketEvent) report.push(`🎪 ¡Feria en el pueblo! ${ITEMS[s.marketEvent].emoji} ${ITEMS[s.marketEvent].name} se paga al doble hoy.`);
  s.energy = passedOut ? Math.round(maxEnergy() * 0.5) : maxEnergy();
  s.player = { x: 5.5, y: 7, dir: 'down' };
  walkTarget = null;
  pendingAct = null;
  if (dayInSeason(s.day) === DAYS_PER_SEASON) report.push(`⏳ Último día de ${season.name.toLowerCase()}. ¡Cosecha lo que puedas!`);

  const title = passedOut ? '😵 Te desmayaste en el campo' : `🌅 Día ${s.day}`;
  const intro = passedOut
    ? `<p>Trabajaste hasta medianoche. Despiertas en casa en el día ${s.day} con solo la mitad de energía.</p>`
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

function afterAction() {
  checkAchievements();
  save();
  renderHud();
  renderHotbar();
  if (panelId) renderPanel();
}

/* ══════════════════════════════════════
   JUGADOR Y CONTROLES
══════════════════════════════════════ */
const DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const keys = {};
const joy = { active: false, id: null, x: 0, y: 0 };
let walkTarget = null;   // punto (en casillas) hacia el que camina el jugador al tocar la pantalla
let pendingAct = null;   // casilla sobre la que actuar al llegar
let stuckTime = 0;
let walkAnim = 0;
let moving = false;

function playerTile() {
  return { x: Math.floor(state.player.x), y: Math.floor(state.player.y - 0.15) };
}

function facingTile() {
  const t = playerTile();
  const [dx, dy] = DIRS[state.player.dir];
  return { x: t.x + dx, y: t.y + dy };
}

function collides(x, y) {
  const pts = [[x - 0.28, y - 0.3], [x + 0.28, y - 0.3], [x - 0.28, y - 0.02], [x + 0.28, y - 0.02]];
  return pts.some(([px, py]) => isSolidTile(Math.floor(px), Math.floor(py)));
}

function faceTowards(tx, ty) {
  const t = playerTile();
  const dx = tx - t.x, dy = ty - t.y;
  if (!dx && !dy) return;
  state.player.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

function updatePlayer(dt) {
  const p = state.player;
  let vx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let vy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (joy.active) { vx = joy.x; vy = joy.y; }
  if (vx || vy) { walkTarget = null; pendingAct = null; }

  if (pendingAct) {
    const t = playerTile();
    if (Math.max(Math.abs(t.x - pendingAct.x), Math.abs(t.y - pendingAct.y)) <= 1) {
      const target = pendingAct;
      walkTarget = null;
      pendingAct = null;
      faceTowards(target.x, target.y);
      actAt(target.x, target.y);
      vx = vy = 0;
    }
  }
  if (walkTarget && !vx && !vy) {
    const dx = walkTarget.x - p.x, dy = walkTarget.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.08) walkTarget = null;
    else { vx = dx / d; vy = dy / d; }
  }

  const len = Math.hypot(vx, vy);
  if (len > 1) { vx /= len; vy /= len; }
  moving = len > 0.15;
  if (!moving) { walkAnim = 0; return; }

  if (Math.abs(vx) > Math.abs(vy)) p.dir = vx > 0 ? 'right' : 'left';
  else p.dir = vy > 0 ? 'down' : 'up';

  const step = PLAYER_SPEED * dt;
  const ox = p.x, oy = p.y;
  if (!collides(p.x + vx * step, p.y)) p.x += vx * step;
  if (!collides(p.x, p.y + vy * step)) p.y += vy * step;
  walkAnim += dt;

  if (walkTarget) {
    if (Math.hypot(p.x - ox, p.y - oy) < step * 0.2) stuckTime += dt;
    else stuckTime = 0;
    if (stuckTime > 0.25) { walkTarget = null; pendingAct = null; stuckTime = 0; }
  }
}

function animalNear(x, y) {
  let best = null, bestD = 0.95;
  for (const an of state.animals) {
    const d = Math.hypot(an.x - x, an.y - 0.3 - y);
    if (d < bestD) { best = an; bestD = d; }
  }
  return best;
}

function actFacing() {
  const t = facingTile();
  actAt(t.x, t.y);
}

function actAt(tx, ty) {
  if (uiOpen()) return;
  const an = animalNear(tx + 0.5, ty + 0.5);
  if (an) return interactAnimal(an);
  const b = buildingAt(tx, ty);
  if (b) return interactBuilding(b);
  if (inMap(tx, ty) && ground[idx(tx, ty)] === G_WATER) return refillCan();
  const pi = plotIndexAt(tx, ty);
  if (pi !== -1) {
    if (!plotUnlocked(pi)) return toast('🚜 Terreno sin desbrozar. Amplíalo en el taller');
    return actPlot(pi);
  }
}

function interactBuilding(b) {
  if (b.id === 'casa') return askSleep();
  if (b.id === 'caja') return openPanel('mercado');
  if (b.id === 'establo') return openPanel('animales');
  if (b.id === 'taller') return openPanel('mejoras');
  if (b.id === 'tablon') return openPanel('logros');
}

function isActionable(tx, ty) {
  if (!inMap(tx, ty)) return false;
  if (buildingAt(tx, ty) || ground[idx(tx, ty)] === G_WATER) return true;
  if (animalNear(tx + 0.5, ty + 0.5)) return true;
  const pi = plotIndexAt(tx, ty);
  return pi !== -1 && plotUnlocked(pi);
}

/* ── Animales en el corral ── */
function updateAnimals(dt) {
  for (const an of state.animals) {
    if (an.x === undefined) Object.assign(an, randomCorralSpot());
    if (an.wait === undefined) an.wait = rand(0.5, 3);
    if (an.tx === undefined) { an.tx = an.x; an.ty = an.y; }
    const dx = an.tx - an.x, dy = an.ty - an.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.05) {
      an.moving = false;
      an.wait -= dt;
      if (an.wait <= 0) {
        const spot = randomCorralSpot();
        an.tx = spot.x; an.ty = spot.y;
        an.wait = rand(1.5, 5);
      }
    } else {
      const sp = 0.7 * dt;
      an.moving = true;
      an.x += (dx / d) * Math.min(sp, d);
      an.y += (dy / d) * Math.min(sp, d);
      if (Math.abs(dx) > 0.02) an.left = dx < 0;
      an.anim = (an.anim || 0) + dt;
    }
  }
}

/* ══════════════════════════════════════
   RENDER DEL MUNDO
══════════════════════════════════════ */
const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
let scale = 3;
let dpr = 1;
let cam = { x: 0, y: 0 };
let staticLayer = null;
let staticKey = '';
const floaters = [];
const particles = [];
let weatherDrops = [];
let lightning = 0;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  // Que se vean unas 11-12 casillas en el lado más corto
  scale = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) / (TILE * 11.5)));
  weatherDrops = [];
}

function buildStaticLayer() {
  const season = seasonOf(state.day).id;
  const key = `${season}-${fieldRows()}`;
  if (key === staticKey) return;
  staticKey = key;
  staticLayer = document.createElement('canvas');
  staticLayer.width = MAP_W * TILE;
  staticLayer.height = MAP_H * TILE;
  const g = staticLayer.getContext('2d');
  const isWater = (x, y) => inMap(x, y) && ground[idx(x, y)] === G_WATER;
  const isFence = (x, y) => inMap(x, y) && fences[idx(x, y)] === 1;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const px = x * TILE, py = y * TILE;
      const gt = ground[idx(x, y)];
      if (gt === G_PATH) Sprites.pathTile(g, px, py, season, x, y);
      else if (gt === G_WATER) {
        Sprites.grassTile(g, px, py, season, x, y);
        Sprites.waterTile(g, px, py, { top: !isWater(x, y - 1), left: !isWater(x - 1, y), right: !isWater(x + 1, y), bottom: !isWater(x, y + 1) });
      } else if (gt === G_FIELD) {
        const pi = plotIndexAt(x, y);
        if (plotUnlocked(pi)) Sprites.fieldTile(g, px, py, x, y, 'untilled');
        else {
          // Terreno sin desbrozar: piedras y matorrales
          Sprites.grassTile(g, px, py, season, x, y);
          if (Sprites.hash(x, y, 5) > 0.45) {
            const rx = px + 2 + Math.floor(Sprites.hash(x, y, 7) * 6), ry = py + 7 + Math.floor(Sprites.hash(x, y, 8) * 4);
            g.fillStyle = '#6f6a62'; g.fillRect(rx, ry + 1, 7, 4);
            g.fillStyle = '#9a958a'; g.fillRect(rx + 1, ry, 5, 3);
            g.fillStyle = '#c4beb2'; g.fillRect(rx + 2, ry, 2, 1);
          } else {
            const wx = px + 4 + Math.floor(Sprites.hash(x, y, 9) * 6), wy = py + 5;
            g.fillStyle = season === 'invierno' ? '#7d8a6a' : '#3f6e2a';
            g.fillRect(wx, wy + 2, 2, 7); g.fillRect(wx - 3, wy + 4, 2, 5); g.fillRect(wx + 3, wy + 3, 2, 6);
            g.fillRect(wx - 2, wy + 3, 1, 1); g.fillRect(wx + 4, wy + 2, 1, 1);
          }
        }
      } else Sprites.grassTile(g, px, py, season, x, y);
      if (isFence(x, y)) {
        Sprites.fence(g, px, py, { left: isFence(x - 1, y), right: isFence(x + 1, y), up: isFence(x, y - 1), down: isFence(x, y + 1) });
      }
    }
  }
}

function updateCamera() {
  const vw = canvas.width / scale, vh = canvas.height / scale;
  const mw = MAP_W * TILE, mh = MAP_H * TILE;
  let x = state.player.x * TILE - vw / 2;
  let y = (state.player.y - 0.5) * TILE - vh / 2;
  x = mw > vw ? Math.max(0, Math.min(mw - vw, x)) : (mw - vw) / 2;
  y = mh > vh ? Math.max(0, Math.min(mh - vh, y)) : (mh - vh) / 2;
  cam.x = Math.round(x * scale) / scale;
  cam.y = Math.round(y * scale) / scale;
}

function floatText(x, y, text) {
  floaters.push({ x: x * TILE, y: y * TILE, text, t: 0 });
}

function puff(i, color) {
  const t = plotTile(i);
  for (let k = 0; k < 8; k++) {
    particles.push({ x: (t.x + 0.5) * TILE, y: (t.y + 0.7) * TILE, vx: rand(-25, 25), vy: rand(-40, -10), t: 0, life: rand(0.3, 0.6), color });
  }
}

function render(now) {
  const W = canvas.width, H = canvas.height;
  const season = seasonOf(state.day).id;
  buildStaticLayer();
  updateCamera();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#24391c';
  ctx.fillRect(0, 0, W, H);
  ctx.setTransform(scale, 0, 0, scale, -cam.x * scale, -cam.y * scale);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(staticLayer, 0, 0);

  const view = { x0: cam.x - 48, y0: cam.y - 48, x1: cam.x + W / scale + 48, y1: cam.y + H / scale + 64 };

  // Destellos del agua
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let y = POND.y; y < POND.y + POND.h; y++) {
    for (let x = POND.x; x < POND.x + POND.w; x++) {
      if (ground[idx(x, y)] !== G_WATER) continue;
      const ph = (now / 900 + Sprites.hash(x, y, 11) * 6) % 6;
      if (ph < 1.2) ctx.fillRect(x * TILE + 3 + Math.floor(Sprites.hash(x, y, 12) * 8), y * TILE + 5 + Math.floor(ph * 4), 4, 1);
    }
  }

  // Huerto
  const rows = fieldRows();
  for (let i = 0; i < FIELD.cols * rows; i++) {
    const p = state.plots[i];
    const t = plotTile(i);
    const px = t.x * TILE, py = t.y * TILE;
    if (p.tilled) Sprites.fieldTile(ctx, px, py, t.x, t.y, p.watered ? 'wet' : 'tilled');
    if (p.crop) {
      const stage = p.dead ? 'dead' : p.ready ? 2 : (p.regrown || p.progress / targetDays(p) >= 0.5 ? 1 : 0);
      const bob = p.ready ? Math.round(Math.sin(now / 300 + i) * 0.6) : 0;
      ctx.drawImage(Sprites.crop(p.crop, stage), px - 1, py - 3 + bob);
    }
  }

  // Casilla objetivo
  if (!uiOpen()) {
    const t = pendingAct || facingTile();
    if (isActionable(t.x, t.y)) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(t.x * TILE + 0.5, t.y * TILE + 0.5, TILE - 1, TILE - 1);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.strokeRect(t.x * TILE + 1.5, t.y * TILE + 1.5, TILE - 3, TILE - 3);
    }
  }

  // Objetos ordenados por profundidad
  const lit = state.time > 0.62;
  const objs = [];
  for (const tr of treeList) {
    const x = tr.x * TILE, y = tr.y * TILE;
    if (x < view.x0 || x > view.x1 || y < view.y0 || y > view.y1) continue;
    objs.push({ y: y + TILE, draw: () => ctx.drawImage(Sprites.tree(season, tr.variant), x - 8, y + TILE - 38) });
  }
  for (const b of BUILDINGS) {
    objs.push({ y: (b.y + b.h) * TILE, draw: () => {
      const img = Sprites.building(b.id, season, lit);
      ctx.drawImage(img, b.x * TILE + Math.round((b.w * TILE - img.width) / 2), (b.y + b.h) * TILE - img.height);
    } });
  }
  for (const an of state.animals) {
    objs.push({ y: an.y * TILE, draw: () => drawAnimal(an, now) });
  }
  objs.push({ y: state.player.y * TILE, draw: drawPlayer });
  objs.sort((a, b) => a.y - b.y);
  for (const o of objs) o.draw();

  // Partículas y textos flotantes (mundo)
  for (const pa of particles) {
    ctx.globalAlpha = Math.max(0, 1 - pa.t / pa.life);
    ctx.fillStyle = pa.color;
    ctx.fillRect(Math.round(pa.x), Math.round(pa.y), 2, 2);
  }
  ctx.globalAlpha = 1;

  // Capa de pantalla: clima, noche y textos
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawWeather(W, H);
  const dark = state.time < 0.6 ? 0 : Math.min(0.55, ((state.time - 0.6) / 0.4) * 0.6);
  if (dark > 0) {
    ctx.fillStyle = `rgba(16,20,56,${dark})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (lightning > 0) {
    ctx.fillStyle = `rgba(255,255,240,${lightning})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.textAlign = 'center';
  ctx.font = `700 ${Math.round(15 * dpr)}px "DM Sans", sans-serif`;
  for (const f of floaters) {
    const sx = (f.x - cam.x) * scale, sy = (f.y - cam.y) * scale - f.t * 30 * dpr;
    ctx.globalAlpha = Math.max(0, 1 - f.t / 1.2);
    ctx.lineWidth = 3 * dpr;
    ctx.strokeStyle = 'rgba(30,20,10,0.8)';
    ctx.strokeText(f.text, sx, sy);
    ctx.fillStyle = '#fff';
    ctx.fillText(f.text, sx, sy);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const p = state.player;
  const frame = moving ? 1 + (Math.floor(walkAnim * 8) % 2) : 0;
  const img = Sprites.player(p.dir, frame);
  const x = Math.round(p.x * TILE), y = Math.round(p.y * TILE);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(x - 5, y - 2, 10, 3);
  ctx.drawImage(img, x - Math.floor(img.width / 2), y - img.height + (frame ? -1 : 0));
}

function drawAnimal(an, now) {
  const img = Sprites.animal(an.type, !!an.left, an.moving ? Math.floor((an.anim || 0) * 5) % 2 : 0);
  const x = Math.round(an.x * TILE), y = Math.round(an.y * TILE);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x - Math.floor(img.width / 2) + 2, y - 2, img.width - 4, 3);
  ctx.drawImage(img, x - Math.floor(img.width / 2), y - img.height);
  if (an.pending) {
    // Burbuja con el producto
    const by = y - img.height - 13 + Math.round(Math.sin(now / 250) * 1);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(x - 6, by, 12, 10);
    ctx.fillRect(x - 1, by + 10, 2, 2);
    ctx.strokeStyle = 'rgba(40,25,15,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 6.5, by - 0.5, 13, 11);
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PRODUCTS[an.pending].emoji, x, by + 5.5);
    ctx.textBaseline = 'alphabetic';
  }
}

function drawWeather(W, H) {
  const w = state.weather;
  if (w !== 'lluvia' && w !== 'tormenta' && w !== 'nieve') return;
  const snow = w === 'nieve';
  const count = snow ? 90 : 140;
  if (weatherDrops.length !== count) {
    weatherDrops = Array.from({ length: count }, () => ({ x: Math.random() * W, y: Math.random() * H, s: rand(0.6, 1.2) }));
  }
  ctx.fillStyle = 'rgba(30,40,70,0.15)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = snow ? 'rgba(255,255,255,0.9)' : 'rgba(180,210,255,0.55)';
  for (const d of weatherDrops) {
    if (snow) ctx.fillRect(d.x, d.y, 2.5 * dpr * d.s, 2.5 * dpr * d.s);
    else ctx.fillRect(d.x, d.y, 1.2 * dpr, 12 * dpr * d.s);
  }
}

function updateEffects(dt) {
  for (const f of floaters) f.t += dt;
  while (floaters.length && floaters[0].t > 1.2) floaters.shift();
  for (const p of particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; }
  for (let i = particles.length - 1; i >= 0; i--) if (particles[i].t > particles[i].life) particles.splice(i, 1);
  const snow = state.weather === 'nieve';
  for (const d of weatherDrops) {
    d.y += (snow ? 40 : 700) * d.s * dpr * dt;
    d.x += (snow ? Math.sin(d.y / 30) * 15 : -60) * dpr * dt;
    if (d.y > canvas.height) { d.y = -20; d.x = Math.random() * canvas.width; }
    if (d.x < -10) d.x = canvas.width;
  }
  if (lightning > 0) lightning = Math.max(0, lightning - dt * 2);
  if (state.weather === 'tormenta' && Math.random() < dt * 0.08) lightning = 0.6;
}

/* ══════════════════════════════════════
   BUCLE PRINCIPAL
══════════════════════════════════════ */
let lastFrame = performance.now();
let lastSave = 0;

function loop(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  const running = !uiOpen() && !paused && !document.hidden;
  if (running) {
    updatePlayer(dt);
    updateAnimals(dt);
    state.time += (dt * 1000) / DAY_MS;
    if (state.time >= 1) {
      state.time = 1;
      newDay(true);
    }
    if (now - lastSave > 10000) { lastSave = now; save(); }
  }
  updateEffects(dt);
  render(now);
  renderClock();
  requestAnimationFrame(loop);
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
let panelId = null;
function modalOpen() { return !$('#modal').classList.contains('hidden'); }
function uiOpen() { return modalOpen() || !!panelId; }

function showModal(title, html, buttons) {
  modalQueue.push({ title, html, buttons });
  if (!modalOpen()) nextModal();
}

function nextModal() {
  const m = modalQueue.shift();
  if (!m) { $('#modal').classList.add('hidden'); return; }
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
  actions.lastChild.focus();
}

function showHelp() {
  showModal('🌾 Cómo jugar', `
    <p>Has heredado una pequeña granja. ¡Hazla prosperar!</p>
    <ul>
      <li>🕹️ <strong>Muévete</strong> con el joystick (móvil) o con WASD / flechas. Usa el botón <strong>A</strong>, Espacio o toca una casilla para interactuar.</li>
      <li>⛏️ <strong>Ara</strong> la tierra del huerto con la azada, 🌱 <strong>siembra</strong> eligiendo una semilla y 💧 <strong>riega</strong> cada día. Sin agua 3 días, el cultivo se seca.</li>
      <li>🪣 Rellena la regadera en el <strong>estanque</strong>.</li>
      <li>🧺 Cosecha cuando la planta esté madura y vende en la <strong>caja de envíos</strong> junto a tu casa.</li>
      <li>🐔 Compra animales en el <strong>establo</strong>. Recoge sus productos y acarícialos cada día.</li>
      <li>🔧 En el <strong>taller</strong> compras mejoras. En el <strong>tablón</strong> ves tus logros.</li>
      <li>🛏️ Entra en <strong>casa</strong> para dormir. Si llegas a medianoche, te desmayas.</li>
      <li>🍂 Cada estación dura ${DAYS_PER_SEASON} días; los cultivos fuera de temporada se marchitan.</li>
    </ul>`, [{ label: '¡Vamos!', primary: true }]);
}

/* ══════════════════════════════════════
   UI: HUD y barra de herramientas
══════════════════════════════════════ */
let lastClock = '';
function renderClock() {
  const minutes = Math.min(18 * 60 - 1, Math.floor(state.time * 18 * 60));
  const h = 6 + Math.floor(minutes / 60);
  const m = Math.floor((minutes % 60) / 10) * 10;
  const text = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  if (text === lastClock) return;
  lastClock = text;
  $('#hud-clock').textContent = text;
  $('#hud-clock').classList.toggle('late', h >= 22);
}

function renderHud() {
  const season = seasonOf(state.day);
  const w = WEATHER[state.weather];
  $('#hud-date').textContent = `${season.emoji} ${season.name} ${dayInSeason(state.day)}`;
  $('#hud-weather').textContent = w.emoji;
  $('#hud-weather').title = w.name;
  $('#hud-coins').textContent = fmt(state.coins);
  $('#energy-fill').style.width = `${(state.energy / maxEnergy()) * 100}%`;
  $('#hud-energy').textContent = state.energy;
  $('#hud-level').textContent = state.level;
  $('#xp-fill').style.width = `${(state.xp / xpNeeded(state.level)) * 100}%`;
  $('#btn-pause').textContent = paused ? '▶️' : '⏸️';
}

function hotbarItems() {
  const items = [
    { id: 'azada', icon: '⛏️', label: 'Azada' },
    { id: 'regadera', icon: '💧', label: 'Regadera', count: `${state.water}/${canCap()}` },
  ];
  const season = seasonOf(state.day).id;
  for (const [id, c] of Object.entries(CROPS)) {
    if (state.level < c.level) continue;
    items.push({ id, icon: c.emoji, label: c.name, count: `${c.seed}🪙`, off: !c.seasons.includes(season) });
  }
  return items;
}

function renderHotbar() {
  const bar = $('#hotbar');
  const items = hotbarItems();
  if (!items.some(it => it.id === state.tool)) state.tool = 'azada';
  bar.innerHTML = '';
  items.forEach((it, n) => {
    const b = document.createElement('button');
    b.className = 'slot' + (it.id === state.tool ? ' selected' : '') + (it.off ? ' off' : '');
    b.title = `${it.label}${n < 9 ? ` (${n + 1})` : ''}`;
    b.innerHTML = `<span class="icon">${it.icon}</span>${it.count ? `<span class="count">${it.count}</span>` : ''}${n < 9 ? `<span class="key">${n + 1}</span>` : ''}`;
    b.onclick = () => selectTool(it.id);
    bar.appendChild(b);
  });
  const sel = items.find(it => it.id === state.tool);
  let hint = sel.label;
  if (CROPS[sel.id]) {
    const c = CROPS[sel.id];
    hint = `${c.emoji} ${c.name} · ${c.days} días${c.regrow ? ` · rebrota en ${c.regrow}` : ''} · se vende por ~${c.sell}🪙` + (sel.off ? ' · fuera de temporada' : '');
  } else if (sel.id === 'regadera') hint = `💧 Regadera · ${state.water}/${canCap()} de agua`;
  else hint = '⛏️ Azada · ara la tierra y limpia cultivos secos';
  $('#tool-hint').textContent = hint;
}

function selectTool(id) {
  state.tool = id;
  renderHotbar();
  save();
}

/* ══════════════════════════════════════
   UI: paneles (caja de envíos, establo, taller, tablón, menú)
══════════════════════════════════════ */
const PANEL_TITLES = {
  mercado: '📦 Caja de envíos',
  animales: '🐮 Establo',
  mejoras: '🔧 Taller',
  logros: '📋 Tablón',
  menu: '🎒 Mochila',
};

function openPanel(id) {
  panelId = id;
  walkTarget = null;
  pendingAct = null;
  $('#panel-title').textContent = PANEL_TITLES[id];
  $('#panel').classList.remove('hidden');
  renderPanel();
  $('#panel-body').scrollTop = 0;
}

function closePanel() {
  panelId = null;
  $('#panel').classList.add('hidden');
}

function renderPanel() {
  const body = $('#panel-body');
  if (panelId === 'mercado') body.innerHTML = marketHtml();
  else if (panelId === 'animales') body.innerHTML = animalsHtml();
  else if (panelId === 'mejoras') body.innerHTML = upgradesHtml();
  else if (panelId === 'logros') body.innerHTML = achievementsHtml();
  else if (panelId === 'menu') body.innerHTML = menuHtml();
}

function marketHtml() {
  const used = barnUsed(), cap = barnCap();
  const ids = Object.keys(ITEMS).sort((a, b) => (state.barn[b] || 0) - (state.barn[a] || 0));
  const rowsHtml = ids.map(id => {
    const it = ITEMS[id];
    const have = state.barn[id] || 0;
    const price = priceOf(id);
    const diff = Math.round(((price - it.sell) / it.sell) * 100);
    const trend = diff >= 5 ? `<span class="price-up">▲ ${diff}%</span>` : diff <= -5 ? `<span class="price-down">▼ ${-diff}%</span>` : '<span class="muted">=</span>';
    return `
      <div class="card row-item ${have ? '' : 'faded'}">
        <div class="big">${it.emoji}</div>
        <div class="info">
          <div class="title">${it.name} <span class="muted">× ${have}</span></div>
          <div class="sub">🪙 ${price} c/u ${trend}</div>
        </div>
        <div class="actions">
          <button class="btn small" data-act="sell" data-id="${id}" data-n="1" ${have ? '' : 'disabled'}>Vender 1</button>
          <button class="btn small primary" data-act="sell" data-id="${id}" data-n="all" ${have ? '' : 'disabled'}>Todo</button>
        </div>
      </div>`;
  }).join('');
  return `
    <div class="card">
      <div class="card-title">🏚️ Granero <span class="muted">${used}/${cap}</span></div>
      <div class="meter wide"><div style="width:${(used / cap) * 100}%"></div></div>
      <div class="muted small-gap">${state.marketEvent
        ? `🎪 ¡Feria! ${ITEMS[state.marketEvent].emoji} ${ITEMS[state.marketEvent].name} al doble de precio hoy.`
        : 'Los precios cambian cada mañana. Lo que está fuera de temporada se paga mejor.'}</div>
    </div>
    <button class="btn primary block" data-act="sell-all" ${used ? '' : 'disabled'}>💰 Vender todo el granero</button>
    <div class="list">${rowsHtml}</div>`;
}

function animalsHtml() {
  const mine = state.animals.map((an, i) => {
    const def = ANIMALS[an.type];
    const p = PRODUCTS[def.product];
    const daysLeft = def.every - (an.fedDays % def.every);
    const mood = an.mood >= 80 ? '😄 Muy feliz' : an.mood >= 50 ? '🙂 Contento' : an.mood >= 30 ? '😐 Regular' : '😢 Triste (no produce)';
    const status = an.pending ? `${p.emoji} ¡Tiene ${p.name.toLowerCase()} para recoger!` : `${p.emoji} ${def.every === 1 ? 'Produce cada día' : `Produce en ${daysLeft} ${plural(daysLeft, 'día', 'días')}`}`;
    return `
      <div class="card row-item">
        <div class="big">${def.emoji}</div>
        <div class="info">
          <div class="title">${an.name} <span class="muted">· ${def.name}</span></div>
          <div class="sub">${mood}${an.petted ? ' · 💕 mimado hoy' : ''}</div>
          <div class="meter mood wide"><div style="width:${an.mood}%"></div></div>
          <div class="sub">${status} · 🌾 ${def.feed}/día</div>
        </div>
        <div class="actions"><button class="btn small" data-act="sell-animal" data-i="${i}">Vender</button></div>
      </div>`;
  }).join('') || '<div class="card empty-state">Todavía no tienes animales. ¡Compra una gallina para empezar!</div>';

  const shop = Object.entries(ANIMALS).map(([id, a]) => {
    const p = PRODUCTS[a.product];
    const locked = state.level < a.level;
    return `
      <div class="card row-item">
        <div class="big">${locked ? '🔒' : a.emoji}</div>
        <div class="info">
          <div class="title">${a.name}</div>
          <div class="sub">${p.emoji} ${p.name} ${a.every === 1 ? 'cada día' : `cada ${a.every} días`} (~${p.sell}🪙) · 🌾 ${a.feed}/día</div>
        </div>
        <div class="actions">
          <button class="btn small ${locked ? '' : 'primary'}" data-act="buy-animal" data-id="${id}" ${locked || state.coins < a.cost ? 'disabled' : ''}>${locked ? `Nivel ${a.level}` : `${fmt(a.cost)} 🪙`}</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="card feed-card">
      <div>
        <div class="card-title">🌾 Pienso: ${state.feed}</div>
        <div class="muted">Se reparte solo cada noche. Consumo diario: <strong>${feedNeed()}</strong></div>
      </div>
      <div class="btn-group">
        <button class="btn small" data-act="feed" data-n="1" ${state.coins < FEED_PRICE ? 'disabled' : ''}>+1 · ${FEED_PRICE}🪙</button>
        <button class="btn small" data-act="feed" data-n="10" ${state.coins < FEED_PRICE * 10 ? 'disabled' : ''}>+10 · ${FEED_PRICE * 10}🪙</button>
      </div>
    </div>
    <p class="hint">Acércate a tus animales en el corral para acariciarlos y recoger sus productos.</p>
    <h3 class="section-title">Tus animales <span class="muted">${state.animals.length}/${corralCap()}</span></h3>
    <div class="list">${mine}</div>
    <h3 class="section-title">Comprar animales</h3>
    <div class="list">${shop}</div>`;
}

function upgradesHtml() {
  return '<div class="list">' + UPGRADES.map(up => {
    const lvl = state.upgrades[up.id];
    const maxed = lvl >= up.max;
    const cost = maxed ? 0 : up.cost(lvl);
    return `
      <div class="card row-item">
        <div class="big">${up.emoji}</div>
        <div class="info">
          <div class="title">${up.name} ${up.max > 1 ? `<span class="muted">${lvl}/${up.max}</span>` : ''}</div>
          <div class="sub">${up.desc}</div>
        </div>
        <div class="actions">
          <button class="btn small ${maxed ? '' : 'primary'}" data-act="upgrade" data-id="${up.id}" ${maxed || state.coins < cost ? 'disabled' : ''}>${maxed ? '✅' : `${fmt(cost)} 🪙`}</button>
        </div>
      </div>`;
  }).join('') + '</div>';
}

function achievementsHtml() {
  const got = ACHIEVEMENTS.filter(a => state.achievements[a.id]).length;
  const stats = [
    ['📅 Días en la granja', state.day],
    ['🗓️ Año', yearOf(state.day)],
    ['🧺 Cultivos cosechados', state.stats.harvests],
    ['🥚 Productos animales', state.stats.products],
    ['💰 Monedas ganadas', fmt(state.stats.earned)],
    ['🛒 Monedas gastadas', fmt(state.stats.spent)],
  ];
  return `
    <h3 class="section-title first">Logros <span class="muted">${got}/${ACHIEVEMENTS.length}</span></h3>
    <div class="ach-grid">${ACHIEVEMENTS.map(a => `
      <div class="ach ${state.achievements[a.id] ? '' : 'locked'}">
        <div class="emoji">${a.emoji}</div>
        <div class="name">${a.name}</div>
        <div class="desc">${a.desc}</div>
      </div>`).join('')}</div>
    <h3 class="section-title">Estadísticas</h3>
    <div class="card stats-list">${stats.map(([k, v]) => `<span>${k}</span><strong>${v}</strong>`).join('')}</div>`;
}

function menuHtml() {
  const items = Object.entries(state.barn);
  return `
    <div class="card stats-list">
      <span>⭐ Nivel</span><strong>${state.level} <span class="muted">(${state.xp}/${xpNeeded(state.level)} XP)</span></strong>
      <span>⚡ Energía</span><strong>${state.energy}/${maxEnergy()}</strong>
      <span>💧 Regadera</span><strong>${state.water}/${canCap()}</strong>
      <span>🌾 Pienso</span><strong>${state.feed}</strong>
    </div>
    <h3 class="section-title">Granero <span class="muted">${barnUsed()}/${barnCap()}</span></h3>
    ${items.length
      ? `<div class="inv-grid">${items.map(([id, n]) => `<div class="inv"><span>${ITEMS[id].emoji}</span><strong>${n}</strong></div>`).join('')}</div>`
      : '<div class="card empty-state">El granero está vacío.</div>'}
    <p class="hint">Vende tus productos en la caja de envíos 📦 que hay junto a tu casa.</p>
    <div class="btn-row">
      <button class="btn" data-act="help">❓ Cómo jugar</button>
      <a class="btn" href="criaturas/" style="text-align:center;text-decoration:none">🎮 Criaturas</a>
      <a class="btn" href="cartas/" style="text-align:center;text-decoration:none">🃏 Tienda de cartas</a>
      <button class="btn danger" data-act="reset">🗑️ Nueva partida</button>
    </div>`;
}

$('#panel-body').addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const { act, id, n, i } = b.dataset;
  if (act === 'sell') sell(id, n === 'all' ? Infinity : 1);
  else if (act === 'sell-all') sellAll();
  else if (act === 'feed') buyFeed(+n);
  else if (act === 'buy-animal') buyAnimal(id);
  else if (act === 'sell-animal') sellAnimal(+i);
  else if (act === 'upgrade') buyUpgrade(id);
  else if (act === 'help') showHelp();
  else if (act === 'reset') {
    showModal('🗑️ ¿Empezar de cero?', '<p>Se borrará tu granja actual. Esta acción no se puede deshacer.</p>', [
      { label: 'Cancelar' },
      { label: 'Borrar y empezar', primary: true, action: () => {
        state = newState();
        state.seenHelp = true;
        staticKey = '';
        closePanel();
        afterAction();
        toast('🌱 ¡Nueva granja!');
      } },
    ]);
  }
});

/* ══════════════════════════════════════
   EVENTOS DE ENTRADA
══════════════════════════════════════ */
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
};
let lastKeyAct = 0;

window.addEventListener('keydown', e => {
  if (e.code === 'Escape') {
    if (modalOpen()) return;
    if (panelId) closePanel();
    else openPanel('menu');
    return;
  }
  if (modalOpen() && (e.code === 'Enter' || e.code === 'Space')) return;
  if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); return; }
  if (uiOpen()) return;
  if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
    e.preventDefault();
    const now = performance.now();
    if (now - lastKeyAct > 200) { lastKeyAct = now; actFacing(); }
    return;
  }
  const digit = /^Digit([1-9])$/.exec(e.code);
  if (digit) {
    const it = hotbarItems()[+digit[1] - 1];
    if (it) selectTool(it.id);
  }
});
window.addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// Tocar o hacer clic en el mundo: actuar si está cerca, si no caminar hasta allí
canvas.addEventListener('pointerdown', e => {
  if (uiOpen()) return;
  const wx = cam.x + (e.clientX * dpr) / scale;
  const wy = cam.y + (e.clientY * dpr) / scale;
  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  if (!inMap(tx, ty)) return;
  const t = playerTile();
  const near = Math.max(Math.abs(t.x - tx), Math.abs(t.y - ty)) <= 1;
  const actionable = isActionable(tx, ty);
  if (near && actionable) {
    faceTowards(tx, ty);
    actAt(tx, ty);
    return;
  }
  walkTarget = { x: tx + 0.5, y: ty + 0.6 };
  pendingAct = actionable ? { x: tx, y: ty } : null;
  stuckTime = 0;
});

// Joystick virtual
const joyEl = $('#joystick');
const knob = $('#joy-knob');
function updateJoy(e) {
  const r = joyEl.getBoundingClientRect();
  let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
  let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  knob.style.transform = `translate(${dx * 32}px, ${dy * 32}px)`;
  if (len < 0.2) dx = dy = 0;
  joy.x = dx;
  joy.y = dy;
}
joyEl.addEventListener('pointerdown', e => {
  joy.active = true;
  joy.id = e.pointerId;
  try { joyEl.setPointerCapture(e.pointerId); } catch (err) { /* puntero sintético */ }
  updateJoy(e);
});
joyEl.addEventListener('pointermove', e => { if (joy.active && e.pointerId === joy.id) updateJoy(e); });
const endJoy = e => {
  if (e.pointerId !== joy.id) return;
  joy.active = false;
  joy.x = joy.y = 0;
  knob.style.transform = '';
};
joyEl.addEventListener('pointerup', endJoy);
joyEl.addEventListener('pointercancel', endJoy);

// Botón de acción (mantener pulsado repite)
let actRepeat = null;
const actBtn = $('#btn-action');
actBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  actFacing();
  clearInterval(actRepeat);
  actRepeat = setInterval(() => { if (!uiOpen()) actFacing(); }, 380);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => actBtn.addEventListener(ev, () => clearInterval(actRepeat)));

$('#btn-menu').onclick = () => openPanel('menu');
$('#panel-close').onclick = closePanel;
$('#panel').addEventListener('click', e => { if (e.target.id === 'panel') closePanel(); });
$('#btn-pause').onclick = () => {
  paused = !paused;
  toast(paused ? '⏸️ Tiempo en pausa' : '▶️ El tiempo vuelve a correr');
  renderHud();
};

window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('beforeunload', save);

/* ══════════════════════════════════════
   INICIO
══════════════════════════════════════ */
buildWorld();
resize();
renderHud();
renderHotbar();
if (!state.seenHelp) {
  state.seenHelp = true;
  save();
  showHelp();
}
requestAnimationFrame(t => { lastFrame = t; requestAnimationFrame(loop); });
