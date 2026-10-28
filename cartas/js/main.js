'use strict';

/* ══════════════════════════════════════
   ESTADO Y REGLAS DE LA TIENDA
══════════════════════════════════════ */
const SAVE_KEY = 'cartas-brisaluz-v1';

const UPGRADES = [
  { id: 'estanteria', name: 'Estantería', icon: '🧺', desc: 'Más espacio para exponer productos.', max: 4, cost: n => [80, 160, 280, 450][n], level: n => [1, 2, 4, 6][n] },
  { id: 'planta', name: 'Plantas', icon: '🪴', desc: 'La tienda resulta más acogedora: vienen más clientes.', max: 2, cost: n => [40, 70][n], level: () => 1 },
  { id: 'vitrina', name: 'Vitrina de cartas', icon: '🪟', desc: 'Expón cartas sueltas para los coleccionistas.', max: 1, cost: () => 120, level: () => 2 },
  { id: 'poster', name: 'Pósteres', icon: '🖼️', desc: 'Decoración: más clientes.', max: 2, cost: n => [60, 100][n], level: () => 2 },
  { id: 'mesa', name: 'Mesa de juego', icon: '🎲', desc: 'Los jugadores alquilan la mesa y a veces compran sobres.', max: 2, cost: n => [150, 260][n], level: n => [3, 5][n] },
  { id: 'alfombra', name: 'Alfombra', icon: '🟥', desc: 'Decoración: más clientes.', max: 1, cost: () => 120, level: () => 3 },
  { id: 'neon', name: 'Letrero de neón', icon: '💡', desc: 'Atrae a muchos más clientes.', max: 1, cost: () => 220, level: () => 4 },
  { id: 'cajero', name: 'Cajero (empleado)', icon: '🧑‍💼', desc: 'Cobra solo a los clientes. Sueldo: 20 €/día.', max: 1, cost: () => 250, level: () => 5 },
  { id: 'reponedor', name: 'Reponedor (empleado)', icon: '🧑‍🔧', desc: 'Repone las estanterías desde el almacén. Sueldo: 25 €/día.', max: 1, cost: () => 350, level: () => 7 },
];

function freshDaily() { return { revenue: 0, spent: 0, customers: 0, lost: 0, expensive: 0, served: 0, seller: false }; }

function newState() {
  return {
    version: 1, money: 120, day: 1, time: OPEN_MIN, phase: 'day', level: 1, xp: 0, rep: 3,
    storage: { sobre_base: 24 },
    shelves: [{ product: null, count: 0 }, { product: null, count: 0 }],
    prices: Object.fromEntries(Object.entries(PRODUCTS).map(([id, p]) => [id, p.market])),
    collection: {}, vitrina: [],
    up: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
    orders: [], queue: [],
    stats: { packs: 0, cards: 0, revenue: 0, served: 0, bestPack: 0 },
    daily: freshDaily(),
    tutorial: 0,
  };
}

let S = null;
function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const base = newState();
    const s = { ...base, ...saved, up: { ...base.up, ...saved.up }, stats: { ...base.stats, ...saved.stats }, prices: { ...base.prices, ...saved.prices }, daily: { ...freshDaily(), ...saved.daily } };
    s.queue = [];
    if (s.phase === 'day') s.time = Math.min(s.time, CLOSE_MIN - 1);
    return s;
  } catch (e) { return null; }
}

const xpNeeded = lvl => 60 + 60 * (lvl - 1);
function addMoney(n, reason) { Game.addMoney(n, reason); }

const Game = (() => {
  const $ = s => document.querySelector(s);

  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...S, queue: [] })); } catch (e) { /* sin almacenamiento */ } }

  function addMoney(n, reason) {
    S.money = Math.round((S.money + n) * 100) / 100;
    if (reason !== 'online') S.daily.revenue += n;
    else S.daily.online = (S.daily.online || 0) + n;
    S.stats.revenue += n;
    refreshHud();
  }

  function spend(n) {
    S.money = Math.round((S.money - n) * 100) / 100;
    S.daily.spent += n;
    refreshHud();
  }

  function gainXp(n) {
    S.xp += n;
    while (S.xp >= xpNeeded(S.level)) {
      S.xp -= xpNeeded(S.level);
      S.level++;
      Sfx.play('levelup');
      const unlocked = [
        ...Object.values(PRODUCTS).filter(p => p.level === S.level).map(p => `🛒 ${p.name}`),
        ...Object.values(SETS).filter(s => s.level === S.level).map(s => `🃏 Expansión «${s.name}»`),
        ...UPGRADES.filter(u => Array.from({ length: u.max }, (_, i) => u.level(i)).includes(S.level)).map(u => `${u.icon} ${u.name}`),
      ];
      UI.modal(`⭐ ¡Nivel ${S.level}!`, `<p>Tu tienda es cada vez más conocida.</p>${unlocked.length ? `<p><b>Desbloqueado:</b></p><ul>${unlocked.map(u => `<li>${u}</li>`).join('')}</ul>` : ''}`, [{ label: '¡Genial!', primary: true }]);
    }
    refreshHud();
  }

  const rent = () => 15 + S.level * 5 + S.shelves.length * 3;
  const salaries = () => (S.up.cajero ? 20 : 0) + (S.up.reponedor ? 25 : 0);

  function setPrice(id, v) {
    S.prices[id] = Math.max(0.05, Math.round(v * 20) / 20);
  }

  function order(id, lots) {
    const p = PRODUCTS[id];
    const total = lots * p.lot * p.cost;
    if (S.money < total) return UI.toast('No tienes dinero suficiente', 'bad');
    spend(total);
    S.orders.push({ product: id, lots, eta: S.phase === 'day' ? S.time + 60 : null, night: S.phase === 'night' });
    if (S.phase === 'night') S.orders[S.orders.length - 1].eta = OPEN_MIN;
    Sfx.play('cash');
    UI.toast(`📦 Pedido: ${lots * p.lot} × ${p.short}`);
    if (S.tutorial === 3) S.tutorial = 4;
  }

  function deliver(o) {
    const p = PRODUCTS[o.product];
    S.storage[o.product] = (S.storage[o.product] || 0) + o.lots * p.lot;
    Sfx.play('delivery');
    UI.toast(`🚚 ¡Ha llegado tu pedido! ${o.lots * p.lot} × ${p.short}`);
    UI.refresh();
  }

  function openBox(id) {
    const p = PRODUCTS[id];
    if (!S.storage[id]) return;
    S.storage[id]--;
    const pack = PACK_OF_SET[p.set];
    S.storage[pack] = (S.storage[pack] || 0) + p.packs;
    Sfx.play('rip');
    UI.toast(`📦 Caja abierta: +${p.packs} sobres`);
  }

  function restock(i) {
    const sh = S.shelves[i];
    if (!sh.product) return;
    const cap = PRODUCTS[sh.product].cap;
    const n = Math.min(cap - sh.count, S.storage[sh.product] || 0);
    sh.count += n;
    S.storage[sh.product] -= n;
    if (n) Sfx.play('slide');
  }

  function unshelf(i) {
    const sh = S.shelves[i];
    if (!sh.product) return;
    S.storage[sh.product] = (S.storage[sh.product] || 0) + sh.count;
    sh.count = 0;
  }

  function assign(i, id) {
    unshelf(i);
    S.shelves[i].product = id;
    restock(i);
    if (S.tutorial === 0) { S.tutorial = 1; hint(); }
  }

  function autoRestock() {
    S.shelves.forEach((sh, i) => { if (sh.product && sh.count < PRODUCTS[sh.product].cap / 2) restock(i); });
  }

  function buyUpgrade(id) {
    const u = UPGRADES.find(x => x.id === id);
    const lvl = S.up[id];
    if (lvl >= u.max) return;
    const cost = u.cost(lvl);
    if (S.money < cost || u.level(lvl) > S.level) return;
    spend(cost);
    S.up[id]++;
    if (id === 'estanteria') S.shelves.push({ product: null, count: 0 });
    Sfx.play('levelup');
    UI.toast(`${u.icon} ${u.name} comprado`);
  }

  function completeSale(c, total, tip) {
    addMoney(total + tip, 'venta');
    S.daily.served++;
    S.stats.served = (S.stats.served || 0) + 1;
    gainXp(Math.max(1, Math.round(total)));
    Sfx.play('cash');
    Shop.floatText(c.x, c.y - 1, `+${euro(total + tip)}`);
    if (tip) UI.toast(`💝 ¡Propina de ${euro(tip)} por atender rápido!`);
    Shop.served(c, true);
    if (S.tutorial === 1) { S.tutorial = 2; hint(); }
    save();
  }

  function autoCheckout(c) {
    if (!c) return;
    if (c.type === 'seller') { Shop.served(c, true); return; }
    const total = Math.round(c.basket.reduce((a, b) => a + b.qty * b.price, 0) * 100) / 100;
    completeSale(c, total, 0);
  }

  /* ── Día y noche ───────────────── */
  async function endDay() {
    if (S.phase !== 'day') return;
    S.phase = 'night';
    const r = rent(), sal = salaries();
    S.money = Math.round((S.money - r - sal) * 100) / 100;
    const d = S.daily;
    const profit = d.revenue + (d.online || 0) - d.spent - r - sal;
    Sfx.play('door');
    await UI.modal(`🌙 Fin del día ${S.day}`, `
      <div class="summary">
        <span>Clientes</span><b>${d.customers}</b>
        <span>Atendidos</span><b>${d.served}</b>
        <span>Se fueron sin encontrar producto</span><b>${d.lost}</b>
        <span>Les pareció caro</span><b>${d.expensive}</b>
        <span>Ventas en tienda</span><b>${euro(d.revenue)}</b>
        <span>Ventas online</span><b>${euro(d.online || 0)}</b>
        <span>Compras</span><b>${d.spent ? "−" : ""}${euro(d.spent)}</b>
        <span>Alquiler</span><b>−${euro(r)}</b>
        ${sal ? `<span>Sueldos</span><b>−${euro(sal)}</b>` : ''}
        <span class="big">Balance del día</span><b class="big ${profit >= 0 ? 'good' : 'bad'}">${profit >= 0 ? '+' : ''}${euro(profit)}</b>
      </div>
      <p class="muted">Es de noche: aprovecha para abrir sobres, pedir stock y preparar la tienda.</p>`,
      [{ label: 'Vale', primary: true }]);
    if (S.money < 0) UI.toast('⚠️ Estás en números rojos. Vende cartas o ajusta precios.', 'bad');
    if (S.tutorial === 2) S.tutorial = 3;
    hint();
    save();
  }

  function startDay() {
    S.day++;
    S.phase = 'day';
    S.time = OPEN_MIN;
    S.daily = freshDaily();
    Shop.reset();
    for (const o of S.orders) { o.eta = null; deliver(o); }
    S.orders = [];
    Sfx.play('door');
    UI.toast(`☀️ ¡Día ${S.day}! La tienda está abierta`);
    hint();
    save();
  }

  /* ── HUD y tutorial ────────────── */
  function clock() {
    if (S.phase === 'night') return '🌙 Cerrado';
    const m = Math.floor(S.time);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60 / 10) * 10).padStart(2, '0')}`;
  }

  function refreshHud() {
    if (!S) return;
    $('#hud-money').textContent = euro(S.money);
    $('#hud-money').classList.toggle('neg', S.money < 0);
    $('#hud-day').textContent = `Día ${S.day}`;
    $('#hud-clock').textContent = clock();
    $('#hud-level').textContent = S.level;
    $('#xp-fill').style.width = `${(S.xp / xpNeeded(S.level)) * 100}%`;
    const stars = Math.round(S.rep * 2) / 2;
    $('#hud-rep').innerHTML = Array.from({ length: 5 }, (_, i) => (stars >= i + 1 ? '★' : stars >= i + 0.5 ? '⯪' : '☆')).join('');
    const head = Shop.queueHead();
    $('#btn-charge').classList.toggle('hidden', !head || !!S.up.cajero);
    $('#btn-charge .n').textContent = S.queue.length;
    $('#btn-day').classList.toggle('hidden', S.phase !== 'night');
    $('#paused').classList.toggle('hidden', !UI.isOpen() || !$('#checkout').classList.contains('hidden') || S.phase === 'night');
    $('[data-ui="vitrina"]').classList.toggle('hidden', !S.up.vitrina);
  }

  const HINTS = [
    '👉 Toca una <b>estantería</b> para colocar los sobres que tienes en el almacén.',
    '🛒 ¡Bien! Los clientes compran lo que hay en las estanterías. Cuando hagan cola, pulsa <b>Cobrar</b>.',
    '✨ Prueba a <b>abrir un sobre</b> desde el Almacén: puede salir una carta rara que valga mucho.',
    '📦 Cuando te quedes sin stock, haz un pedido en <b>Pedidos</b>. Llega en una hora de juego.',
  ];
  function hint() {
    const h = $('#hint');
    if (S.tutorial < HINTS.length) { h.innerHTML = HINTS[S.tutorial]; h.classList.remove('hidden'); }
    else h.classList.add('hidden');
  }

  function help() {
    UI.modal('❓ Cómo jugar', `
      <ul>
        <li>📦 <b>Pide stock</b> al proveedor: sobres, cajas y accesorios.</li>
        <li>🧺 <b>Colócalo</b> en las estanterías tocándolas y ajusta los <b>precios</b>. Si te pasas, los clientes se enfadan 💢.</li>
        <li>💳 <b>Cobra</b> en la caja: teclea el importe en el datáfono o devuelve el cambio exacto.</li>
        <li>✨ <b>Abre sobres</b> desde el Almacén y colecciona cartas. Las holo, ultra raras y secretas valen mucho.</li>
        <li>🪟 Pon cartas en la <b>vitrina</b> para que las compren los coleccionistas, o véndelas online.</li>
        <li>⭐ Sube de nivel para desbloquear expansiones, productos y mejoras.</li>
        <li>🌙 Al cerrar pagas el alquiler. Por la noche puedes preparar la tienda tranquilamente.</li>
      </ul>`);
  }

  async function reset() {
    const r = await UI.modal('🗑️ ¿Empezar de cero?', '<p>Se borrará tu tienda y tu colección.</p>', [{ label: 'Borrar', primary: true }, { label: 'Cancelar' }]);
    if (r !== 0) return;
    S = newState();
    Shop.reset();
    UI.closePanel();
    save();
    hint();
  }

  return { save, addMoney, spend, gainXp, rent, salaries, setPrice, order, deliver, openBox, restock, unshelf, assign, autoRestock, buyUpgrade, completeSale, autoCheckout, endDay, startDay, refreshHud, hint, help, reset };
})();

/* ══════════════════════════════════════
   LIENZO Y BUCLE PRINCIPAL
══════════════════════════════════════ */
const canvas = document.getElementById('shop');
const ctx = canvas.getContext('2d');
let scale = 2, px = 2;

function resize() {
  const wrap = document.getElementById('shop-wrap');
  const cs = getComputedStyle(wrap);
  const availW = Math.min(wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), 900);
  const availH = window.innerHeight - document.getElementById('hud').offsetHeight - document.getElementById('bar').offsetHeight - 70;
  scale = Math.max(0.5, Math.min(availW / (GW * T), availH / (GH * T)));
  canvas.style.width = `${Math.floor(GW * T * scale)}px`;
  canvas.style.height = `${Math.floor(GH * T * scale)}px`;
  px = Math.min(6, Math.ceil(scale * (window.devicePixelRatio || 1)));
  canvas.width = GW * T * px;
  canvas.height = GH * T * px;
}
window.addEventListener('resize', resize);

canvas.addEventListener('click', e => {
  Sfx.unlock();
  const r = canvas.getBoundingClientRect();
  const tx = Math.floor(((e.clientX - r.left) / r.width) * GW);
  const ty = Math.floor(((e.clientY - r.top) / r.height) * GH);
  const h = Shop.hit(tx, ty);
  if (!h) return;
  if (h.type === 'shelf') UI.shelfPanel(h.index);
  else if (h.type === 'register') { const c = Shop.queueHead(); if (c) UI.checkout(c); else UI.toast('No hay nadie esperando en la caja'); }
  else if (h.type === 'vitrina') UI.vitrinaPanel();
  else if (h.type === 'customer') {
    const c = h.c;
    const what = { shopper: 'Busca productos', collector: 'Coleccionista: mira la vitrina', gamer: 'Viene a jugar', seller: 'Quiere venderte cartas' }[c.type];
    Shop.say(c, '💬', 1);
    UI.toast(`👤 ${what}${c.basket.length ? ` · lleva ${c.basket.reduce((a, b) => a + b.qty, 0)} artículo(s)` : ''}`);
  }
});

document.getElementById('bar').addEventListener('click', e => {
  const b = e.target.closest('[data-ui]');
  if (!b) return;
  Sfx.unlock();
  Audio8.unlock?.();
  const ui = b.dataset.ui;
  if (ui === 'orders') UI.ordersPanel();
  if (ui === 'storage') UI.storagePanel();
  if (ui === 'open') {
    const packs = Object.keys(PRODUCTS).filter(id => PRODUCTS[id].kind === 'pack' && S.storage[id] > 0);
    if (!packs.length) UI.toast('No tienes sobres en el almacén. ¡Haz un pedido!', 'bad');
    else if (packs.length === 1) Opening.open(packs[0], () => {});
    else UI.storagePanel();
  }
  if (ui === 'album') UI.albumPanel();
  if (ui === 'vitrina') UI.vitrinaPanel();
  if (ui === 'upgrades') UI.upgradesPanel();
});
document.getElementById('btn-charge').addEventListener('click', () => UI.checkout(Shop.queueHead()));
document.getElementById('btn-day').addEventListener('click', () => Game.startDay());
document.getElementById('btn-mute').addEventListener('click', e => {
  const m = Sfx.toggle();
  if (Audio8.isMuted() !== m) Audio8.toggleMute();
  e.currentTarget.textContent = m ? '🔇' : '🔊';
  if (!m) Audio8.play('town');
});

let last = performance.now();
let hudT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const paused = UI.isOpen() && document.getElementById('checkout').classList.contains('hidden');
  if (!paused && !document.hidden) Shop.update(dt);
  ctx.setTransform(px, 0, 0, px, 0, 0);
  ctx.imageSmoothingEnabled = false;
  Shop.render(ctx, now);
  hudT += dt;
  if (hudT > 0.25) { hudT = 0; Game.refreshHud(); }
  requestAnimationFrame(frame);
}

/* ── Inicio ── */
S = loadState() || newState();
document.getElementById('btn-mute').textContent = Sfx.isMuted() ? '🔇' : '🔊';
resize();
Game.refreshHud();
Game.hint();
if (S.day === 1 && S.stats.served === 0 && S.tutorial === 0) Game.help();
document.addEventListener('pointerdown', () => { Sfx.unlock(); if (!Sfx.isMuted()) { Audio8.unlock(); Audio8.play('town'); } }, { once: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) Game.save(); });
window.addEventListener('beforeunload', () => Game.save());
setInterval(() => Game.save(), 15000);
requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
