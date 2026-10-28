'use strict';

/* ══════════════════════════════════════
   LA TIENDA: plano, clientes y dibujo
══════════════════════════════════════ */
const T = 16;
const GW = 14, GH = 11;              // casillas del plano
const OPEN_MIN = 9 * 60, CLOSE_MIN = 21 * 60;
const MIN_PER_SEC = 4;               // minutos de juego por segundo real

const SHELF_SPOTS = [
  { x: 1, y: 3 }, { x: 4, y: 3 }, { x: 7, y: 3 },
  { x: 1, y: 6 }, { x: 4, y: 6 }, { x: 7, y: 6 },
];
const COUNTER = { x: 10, y: 3, w: 3, h: 2 };
const REGISTER = { x: 11, y: 3 };
const QUEUE = [[11, 5], [11, 6], [11, 7], [10, 7], [9, 7], [9, 8]];
const VITRINA = { x: 13, y: 6, h: 3 };
const TABLES = [{ x: 1, y: 9, seats: [[0, 9], [3, 9]] }, { x: 5, y: 9, seats: [[4, 9], [7, 9]] }];
const DOOR = [[8, 10], [9, 10]];
const PLANTS = [[0, 2], [9, 2]];

const Shop = (() => {
  let customers = [];
  let floaters = [];
  let spawnT = 3;
  let nextId = 1;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ── Plano y caminos ───────────── */
  function blockedGrid() {
    const g = [];
    for (let y = 0; y < GH; y++) {
      g.push([]);
      for (let x = 0; x < GW; x++) {
        let b = y < 2;
        if (y === 2 && x >= 10) b = true;
        if (x >= COUNTER.x && x < COUNTER.x + COUNTER.w && y >= COUNTER.y && y < COUNTER.y + COUNTER.h) b = true;
        g[y].push(b);
      }
    }
    S.shelves.forEach((_, i) => { const s = SHELF_SPOTS[i]; g[s.y][s.x] = g[s.y][s.x + 1] = true; });
    if (S.up.vitrina) for (let i = 0; i < VITRINA.h; i++) g[VITRINA.y + i][VITRINA.x] = true;
    for (let i = 0; i < S.up.mesa; i++) { const t = TABLES[i]; g[t.y][t.x] = g[t.y][t.x + 1] = true; }
    for (let i = 0; i < S.up.planta; i++) { const [x, y] = PLANTS[i]; g[y][x] = true; }
    return g;
  }

  function path(from, to) {
    const g = blockedGrid();
    const key = (x, y) => y * GW + x;
    const prev = new Map([[key(from[0], from[1]), null]]);
    const q = [from];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === to[0] && y === to[1]) break;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        if (g[ny][nx] && !(nx === to[0] && ny === to[1])) continue;
        const k = key(nx, ny);
        if (prev.has(k)) continue;
        prev.set(k, [x, y]);
        q.push([nx, ny]);
      }
    }
    const out = [];
    let cur = to;
    if (!prev.has(key(to[0], to[1]))) return [to];
    while (cur) { out.unshift(cur); cur = prev.get(key(cur[0], cur[1])); }
    return out.slice(1);
  }

  /* ── Clientes ──────────────────── */
  const HEADS = ['cap', 'short', 'long', 'bald', 'long', 'short'];
  const HAIR = ['#2a1a14', '#6b3e1f', '#c8a050', '#e8d070', '#a8a8a8', '#d8584a', '#3a2a5a', '#f08ab8'];
  const SKIN = ['#f6cfa4', '#e8b088', '#c8906a', '#8a5a3a', '#f8dcc0'];
  const CLOTH = ['#d8433a', '#3a6ad8', '#4fa83a', '#f2c040', '#8a4ab8', '#2a2a3a', '#e88a2a', '#f4f4f4', '#2a8a8a', '#e05a8a'];

  function randomLook() {
    return { head: pick(HEADS), c: pick(CLOTH), h: pick(HAIR), k: pick(SKIN), s: pick(CLOTH), p: pick(['#2a2a3a', '#3a4a7a', '#5a4a3a', '#6a6a7a', '#1a3a6a']) };
  }

  function unlockedProducts() {
    return Object.entries(PRODUCTS).filter(([, p]) => p.level <= S.level).map(([id]) => id);
  }

  function spawn() {
    const types = [['shopper', 70]];
    if (S.up.vitrina && S.vitrina.length) types.push(['collector', 18]);
    const freeSeats = freeTableSeats();
    if (freeSeats.length >= 2) types.push(['gamer', 14]);
    if (S.level >= 2 && !S.daily.seller) types.push(['seller', 4]);
    const total = types.reduce((a, t) => a + t[1], 0);
    let r = Math.random() * total, type = 'shopper';
    for (const [t, w] of types) { r -= w; if (r <= 0) { type = t; break; } }
    if (type === 'seller') S.daily.seller = true;

    const c = {
      id: nextId++, type, look: randomLook(), x: pick(DOOR)[0], y: GH - 1 + 0.6, dir: 'up',
      path: [], state: 'enter', wait: 0, basket: [], wants: [], mood: 1, patience: 45, bubble: null, bubbleT: 0, anim: 0,
    };
    if (type === 'shopper') {
      const prods = unlockedProducts();
      const n = Math.random() < 0.35 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        // Los sobres son lo más buscado
        const weighted = prods.flatMap(p => Array(PRODUCTS[p].kind === 'pack' ? 4 : PRODUCTS[p].kind === 'box' ? 1 : 2).fill(p));
        c.wants.push(pick(weighted));
      }
    }
    customers.push(c);
    S.daily.customers++;
    Sfx.play('door');
    nextStep(c);
  }

  function freeTableSeats() {
    const seats = [];
    for (let i = 0; i < S.up.mesa; i++) for (const s of TABLES[i].seats) if (!customers.some(c => c.seat && c.seat[0] === s[0] && c.seat[1] === s[1])) seats.push(s);
    return seats;
  }

  function goTo(c, tile, then) {
    c.path = path([Math.round(c.x), Math.round(c.y)], tile);
    c.state = 'walk';
    c.after = then;
  }

  function say(c, emoji, t = 2.2) { c.bubble = emoji; c.bubbleT = t; }

  function nextStep(c) {
    if (c.type === 'shopper') {
      const want = c.wants.shift();
      if (!want) return c.basket.length ? joinQueue(c) : leave(c);
      const idx = S.shelves.findIndex(s => s.product === want && s.count > 0);
      if (idx < 0) {
        // Busca el producto aunque esté agotado: si hay estantería vacía de ese producto, se acerca
        say(c, '❓');
        S.daily.lost++;
        changeRep(-0.02);
        return setTimeout(() => nextStep(c), 900);
      }
      const s = SHELF_SPOTS[idx];
      return goTo(c, [s.x + (Math.random() < 0.5 ? 0 : 1), s.y + 1], () => browse(c, idx, want));
    }
    if (c.type === 'collector') {
      return goTo(c, [VITRINA.x - 1, VITRINA.y + Math.floor(Math.random() * VITRINA.h)], () => {
        c.state = 'browse'; c.dir = 'right'; c.wait = 2.2;
        c.onWait = () => {
          const affordable = S.vitrina.map((v, i) => ({ v, i, max: cardPrice(v.id, S.day) * rnd(1.0, 1.55) })).filter(o => o.v.price <= o.max);
          if (!affordable.length) { say(c, '💸'); changeRep(-0.01); return leave(c); }
          const best = affordable.sort((a, b) => b.v.price - a.v.price)[0];
          S.vitrina.splice(best.i, 1);
          c.basket.push({ card: best.v.id, price: best.v.price, qty: 1 });
          say(c, '✨');
          joinQueue(c);
        };
      });
    }
    if (c.type === 'gamer') {
      const seat = freeTableSeats()[0];
      if (!seat) return leave(c);
      c.seat = seat;
      return goTo(c, seat, () => {
        c.state = 'play'; c.dir = seat[0] % 4 === 0 ? 'right' : 'left';
        c.wait = rnd(20, 40); say(c, '🃏', 3);
        c.onWait = () => {
          const fee = 3 + S.up.mesa;
          addMoney(fee, 'mesa');
          floatText(c.x, c.y - 1, `+${euro(fee)}`);
          c.seat = null;
          // A veces se compran un sobre al terminar
          const packShelf = S.shelves.findIndex(s => PRODUCTS[s.product]?.kind === 'pack' && s.count > 0);
          if (packShelf >= 0 && Math.random() < 0.5) { c.type = 'shopper'; c.wants = [S.shelves[packShelf].product]; return nextStep(c); }
          leave(c);
        };
      });
    }
    if (c.type === 'seller') {
      c.offer = makeOffer();
      say(c, '💼', 3);
      return joinQueue(c);
    }
  }

  function browse(c, idx, want) {
    c.state = 'browse'; c.dir = 'up'; c.wait = rnd(1.2, 2.2);
    c.onWait = () => {
      const shelf = S.shelves[idx];
      const p = PRODUCTS[want];
      if (shelf.product !== want || shelf.count <= 0) { say(c, '❓'); S.daily.lost++; return nextStep(c); }
      const price = S.prices[want];
      const willing = p.market * rnd(0.95, 1.45) * (0.85 + S.rep * 0.06);
      if (price > willing) {
        say(c, '💢');
        Sfx.play('angry');
        changeRep(-0.03);
        S.daily.expensive++;
        return nextStep(c);
      }
      const qty = Math.min(shelf.count, p.kind === 'pack' ? 1 + Math.floor(Math.random() * (price < p.market ? 4 : 3)) : 1);
      shelf.count -= qty;
      const same = c.basket.find(b => b.product === want && b.price === price);
      if (same) same.qty += qty; else c.basket.push({ product: want, qty, price });
      say(c, price < p.market * 0.95 ? '😍' : '🙂', 1.5);
      nextStep(c);
    };
  }

  function makeOffer() {
    const sets = Object.values(SETS).filter(s => s.level <= S.level);
    const cards = [];
    for (let i = 0; i < 3; i++) {
      const set = pick(sets);
      const pool = set.cards.filter(id => RARITIES[CARDS[id].rarity].order >= (Math.random() < 0.3 ? 3 : 2));
      cards.push(pick(pool.length ? pool : set.cards));
    }
    const value = cards.reduce((a, id) => a + cardPrice(id, S.day), 0);
    return { cards, price: Math.max(1, Math.round(value * rnd(0.55, 1.05) * 100) / 100), value };
  }

  function joinQueue(c) {
    c.state = 'queue';
    S.queue.push(c.id);
    updateQueueTargets();
  }

  function updateQueueTargets() {
    S.queue = S.queue.filter(id => customers.some(c => c.id === id));
    S.queue.forEach((id, i) => {
      const c = customers.find(x => x.id === id);
      const spot = QUEUE[Math.min(i, QUEUE.length - 1)];
      c.qpos = i;
      if (Math.round(c.x) !== spot[0] || Math.round(c.y) !== spot[1] || c.state === 'queue') {
        c.path = path([Math.round(c.x), Math.round(c.y)], spot);
        c.state = 'toqueue';
      }
    });
  }

  function leave(c, angry) {
    if (angry) { say(c, '😠'); changeRep(-0.1); }
    c.seat = null;
    goTo(c, pick(DOOR), () => { c.gone = true; });
  }

  // Cobro terminado (lo llama la UI de la caja)
  function served(c, ok) {
    S.queue = S.queue.filter(id => id !== c.id);
    if (ok) {
      say(c, Math.random() < 0.5 ? '😊' : '👍', 2);
      changeRep(0.03);
    }
    leave(c);
    updateQueueTargets();
  }

  function queueHead() {
    const id = S.queue[0];
    const c = customers.find(x => x.id === id);
    return c && c.state === 'waiting' ? c : null;
  }

  function changeRep(d) { S.rep = Math.max(0.5, Math.min(5, S.rep + d)); }

  function floatText(x, y, text, color = '#2a8a3a') { floaters.push({ x, y, text, color, t: 0 }); }

  /* ── Bucle ─────────────────────── */
  function update(dt) {
    // Paso del tiempo y llegada de clientes
    if (S.phase === 'day') {
      S.time += dt * MIN_PER_SEC;
      if (S.time < CLOSE_MIN) {
        spawnT -= dt;
        if (spawnT <= 0) {
          spawn();
          const decor = S.up.planta + S.up.poster + S.up.neon * 2 + S.up.alfombra;
          const base = Math.max(2.6, 8.5 - S.level * 0.35 - decor * 0.45);
          spawnT = base * (3.2 / (S.rep + 0.2)) * rnd(0.7, 1.3);
        }
      } else if (!customers.length) {
        S.time = CLOSE_MIN;
        Game.endDay();
      }
      // Pedidos en camino
      for (const o of S.orders) {
        if (o.eta !== null && S.time >= o.eta) { o.eta = null; Game.deliver(o); }
      }
      S.orders = S.orders.filter(o => o.eta !== null);
    }

    for (const c of customers) {
      c.anim += dt;
      if (c.bubbleT > 0) c.bubbleT -= dt; else c.bubble = null;
      if (c.state === 'walk' || c.state === 'toqueue') {
        const tgt = c.path[0];
        if (!tgt) {
          if (c.state === 'toqueue') { c.state = 'waiting'; c.dir = c.qpos === 0 ? 'up' : 'up'; }
          else { const f = c.after; c.after = null; c.state = 'idle'; if (f) f(); }
          continue;
        }
        const dx = tgt[0] - c.x, dy = tgt[1] - c.y;
        const d = Math.hypot(dx, dy);
        const sp = 3 * dt;
        if (Math.abs(dx) > Math.abs(dy)) c.dir = dx > 0 ? 'right' : 'left'; else if (d > 0.01) c.dir = dy > 0 ? 'down' : 'up';
        if (d <= sp) { c.x = tgt[0]; c.y = tgt[1]; c.path.shift(); }
        else { c.x += (dx / d) * sp; c.y += (dy / d) * sp; }
      } else if (c.state === 'browse' || c.state === 'play') {
        c.wait -= dt;
        if (c.wait <= 0) { c.state = 'idle'; const f = c.onWait; c.onWait = null; f(); }
      } else if (c.state === 'waiting') {
        c.patience -= dt;
        if (c.patience < 12 && !c.bubble) say(c, '⏳', 1.5);
        if (c.patience <= 0) {
          // Se va sin pagar y devuelve lo que llevaba
          for (const b of c.basket) {
            if (b.product) { const s = S.shelves.find(x => x.product === b.product); if (s) s.count += b.qty; }
            if (b.card) S.vitrina.push({ id: b.card, price: b.price });
          }
          c.basket = [];
          S.queue = S.queue.filter(id => id !== c.id);
          leave(c, true);
          updateQueueTargets();
        }
      }
    }
    customers = customers.filter(c => !c.gone);
    for (const f of floaters) f.t += dt;
    floaters = floaters.filter(f => f.t < 1.4);

    // Empleados
    if (S.up.cajero && queueHead()) {
      S.cashierT = (S.cashierT || 0) + dt;
      if (S.cashierT > 4) { S.cashierT = 0; Game.autoCheckout(queueHead()); }
    }
    if (S.up.reponedor) {
      S.restockT = (S.restockT || 0) + dt;
      if (S.restockT > 6) { S.restockT = 0; Game.autoRestock(); }
    }
  }

  /* ── Dibujo ────────────────────── */
  const PAL = { floor: '#c89a64', floor2: '#b88a58', wall: '#f2e2c4', wall2: '#d8c49e', trim: '#8a5a34', counter: '#9a6a3a', counterTop: '#c8945a' };

  function productColor(id) {
    const p = PRODUCTS[id];
    if (!p) return '#888';
    if (p.set) return SETS[p.set].color;
    return p.color;
  }

  function drawShelf(ctx, i, now) {
    const s = SHELF_SPOTS[i];
    const sh = S.shelves[i];
    const x = s.x * T, y = s.y * T;
    ctx.fillStyle = '#6a4426'; ctx.fillRect(x, y - 10, 32, 26);
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(x + 1, y - 9, 30, 24);
    ctx.fillStyle = '#5a381e';
    for (const yy of [y - 2, y + 7]) ctx.fillRect(x + 1, yy, 30, 2);
    if (sh.product) {
      const p = PRODUCTS[sh.product];
      const col = productColor(sh.product), col2 = p.set ? SETS[p.set].color2 : '#fff';
      const per = p.kind === 'box' ? 3 : p.kind === 'pack' ? 8 : 5;
      const w = p.kind === 'box' ? 9 : p.kind === 'pack' ? 3 : 5;
      for (let k = 0; k < Math.min(sh.count, per * 2); k++) {
        const row = k < per ? 0 : 1;
        const px = x + 2 + (k % per) * (w + 0.6);
        const py = row ? y - 1 : y - 8;
        const h = p.kind === 'box' ? 6 : 6;
        ctx.fillStyle = col; ctx.fillRect(Math.round(px), py, w, h);
        ctx.fillStyle = col2; ctx.fillRect(Math.round(px), py + 2, w, 1);
        if (p.kind === 'pack') { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(Math.round(px), py, 1, h); }
      }
      // Etiqueta de precio
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 6, y + 10, 20, 6);
      ctx.fillStyle = '#2a2a3a'; ctx.font = '5px monospace'; ctx.textAlign = 'center';
      ctx.fillText(S.prices[sh.product].toFixed(2), x + 16, y + 15);
      if (sh.count === 0 && Math.floor(now / 500) % 2) { ctx.fillStyle = '#d8433a'; ctx.fillRect(x + 1, y - 9, 30, 1); }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '6px monospace'; ctx.textAlign = 'center';
      ctx.fillText('VACÍA', x + 16, y + 3);
    }
  }

  function render(ctx, now) {
    // Suelo
    for (let y = 2; y < GH; y++) for (let x = 0; x < GW; x++) {
      ctx.fillStyle = (x + y) % 2 ? PAL.floor : PAL.floor2;
      ctx.fillRect(x * T, y * T, T, T);
      ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(x * T, y * T + 15, T, 1);
    }
    if (S.up.alfombra) {
      ctx.fillStyle = '#a83a4a'; ctx.fillRect(3 * T + 4, 4 * T + 4, 5 * T - 8, 4 * T - 8);
      ctx.fillStyle = '#d8b040'; ctx.strokeStyle = '#d8b040'; ctx.lineWidth = 1;
      ctx.strokeRect(3 * T + 7.5, 4 * T + 7.5, 5 * T - 15, 4 * T - 15);
    }
    // Paredes
    ctx.fillStyle = PAL.wall; ctx.fillRect(0, 0, GW * T, 2 * T);
    ctx.fillStyle = PAL.wall2; for (let x = 0; x < GW * T; x += 8) ctx.fillRect(x, 0, 1, 2 * T - 4);
    ctx.fillStyle = PAL.trim; ctx.fillRect(0, 2 * T - 4, GW * T, 4);
    // Ventana y letrero
    ctx.fillStyle = '#6a4426'; ctx.fillRect(4 * T - 2, 6, 3 * T + 4, 18);
    ctx.fillStyle = '#9fd8f0'; ctx.fillRect(4 * T, 8, 3 * T, 14);
    ctx.fillStyle = '#e8f8ff'; ctx.fillRect(4 * T + 3, 10, 6, 3);
    if (S.up.neon) {
      const on = Math.floor(now / 900) % 6 !== 0;
      ctx.fillStyle = on ? '#ff5ab8' : '#8a3a6a';
      ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
      ctx.shadowColor = '#ff5ab8'; ctx.shadowBlur = on ? 6 : 0;
      ctx.fillText('CARTAS', 2 * T, 18);
      ctx.shadowBlur = 0;
    }
    for (let i = 0; i < S.up.poster; i++) {
      const px = [8 * T + 4, 1 * T + 2][i] ?? 8 * T;
      ctx.fillStyle = '#fff'; ctx.fillRect(px, 5, 14, 20);
      ctx.fillStyle = ['#e8a030', '#6a4ab8'][i]; ctx.fillRect(px + 2, 7, 10, 12);
      ctx.fillStyle = '#f2c040'; ctx.fillRect(px + 5, 10, 4, 4);
    }
    // Puerta
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(8 * T, GH * T - 3, 2 * T, 3);

    // Objetos ordenados por profundidad
    const items = [];
    S.shelves.forEach((_, i) => items.push({ y: SHELF_SPOTS[i].y * T + T, draw: () => drawShelf(ctx, i, now) }));
    for (let i = S.shelves.length; i < SHELF_SPOTS.length; i++) {
      const s = SHELF_SPOTS[i];
      items.push({ y: 0, draw: () => { ctx.strokeStyle = 'rgba(80,50,20,.35)'; ctx.setLineDash([2, 2]); ctx.strokeRect(s.x * T + .5, s.y * T - 9.5, 31, 25); ctx.setLineDash([]); } });
    }
    items.push({ y: (COUNTER.y + COUNTER.h) * T, draw: () => drawCounter(ctx, now) });
    if (S.up.vitrina) items.push({ y: (VITRINA.y + VITRINA.h) * T, draw: () => drawVitrina(ctx) });
    for (let i = 0; i < S.up.mesa; i++) items.push({ y: TABLES[i].y * T + T, draw: () => drawTable(ctx, TABLES[i]) });
    for (let i = 0; i < S.up.planta; i++) { const [x, y] = PLANTS[i]; items.push({ y: y * T + T, draw: () => drawPlant(ctx, x, y) }); }
    for (const c of customers) items.push({ y: c.y * T + T, draw: () => drawCustomer(ctx, c, now) });
    if (S.up.reponedor) items.push({ y: 5 * T + T, draw: () => ctx.drawImage(Art.character({ head: 'cap', c: '#4fa83a', h: '#3a2a1a', s: '#4fa83a', p: '#2a2a3a' }, 'down', 0), 0 * T + 1, 5 * T - 2) });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();

    // Textos flotantes
    ctx.textAlign = 'center';
    ctx.font = 'bold 7px monospace';
    for (const f of floaters) {
      ctx.globalAlpha = 1 - f.t / 1.4;
      ctx.fillStyle = '#fff';
      ctx.fillText(f.text, f.x * T + 8 + 0.5, f.y * T - f.t * 10 + 0.5);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x * T + 8, f.y * T - f.t * 10);
    }
    ctx.globalAlpha = 1;

    if (S.phase === 'night') {
      ctx.fillStyle = 'rgba(20,24,60,.45)';
      ctx.fillRect(0, 0, GW * T, GH * T);
    }
  }

  function drawCounter(ctx, now) {
    const x = COUNTER.x * T, y = COUNTER.y * T;
    // Tendero(s) detrás del mostrador
    ctx.drawImage(Art.character(LOOKS.player, 'down', 0), REGISTER.x * T + 1, 2 * T - 2);
    if (S.up.cajero) ctx.drawImage(Art.character({ head: 'long', h: '#8a4a2a', s: '#d8433a', p: '#2a2a3a' }, 'down', 0), (REGISTER.x + 1) * T + 1, 2 * T - 2);
    ctx.fillStyle = PAL.counter; ctx.fillRect(x, y, COUNTER.w * T, COUNTER.h * T);
    ctx.fillStyle = PAL.counterTop; ctx.fillRect(x, y, COUNTER.w * T, 5);
    ctx.fillStyle = '#7a4a2a'; for (let xx = x + 6; xx < x + COUNTER.w * T; xx += 12) ctx.fillRect(xx, y + 8, 1, COUNTER.h * T - 10);
    // Caja registradora
    const rx = REGISTER.x * T + 2, ry = y - 6;
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(rx, ry, 12, 9);
    ctx.fillStyle = '#6af0a0'; ctx.fillRect(rx + 2, ry + 1, 8, 3);
    ctx.fillStyle = '#c8c8d8'; ctx.fillRect(rx + 1, ry + 5, 10, 3);
    if (S.queue.length && Math.floor(now / 400) % 2) {
      ctx.fillStyle = '#f2c040';
      ctx.beginPath(); ctx.arc(rx + 6, ry - 6, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2a3a'; ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center'; ctx.fillText('!', rx + 6, ry - 4);
    }
  }

  function drawVitrina(ctx) {
    const x = VITRINA.x * T, y = VITRINA.y * T - 6;
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(x, y, T, VITRINA.h * T + 6);
    ctx.fillStyle = '#bfe4f4'; ctx.fillRect(x + 2, y + 2, T - 4, VITRINA.h * T + 2);
    S.vitrina.slice(0, 8).forEach((v, i) => {
      const r = CARDS[v.id].rarity;
      ctx.fillStyle = r === 'SR' ? '#f2c040' : r === 'UR' ? '#c8a0ff' : r === 'H' ? '#8ac8ff' : '#fff';
      ctx.fillRect(x + 4 + (i % 2) * 5, y + 4 + Math.floor(i / 2) * 11, 4, 6);
    });
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x + 3, y + 3, 1, VITRINA.h * T);
  }

  function drawTable(ctx, t) {
    const x = t.x * T, y = t.y * T;
    ctx.fillStyle = '#5a381e'; ctx.fillRect(x + 1, y + 2, 30, 13);
    ctx.fillStyle = '#3a8a4a'; ctx.fillRect(x + 2, y + 3, 28, 9);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 6, y + 5, 3, 4); ctx.fillRect(x + 22, y + 5, 3, 4);
    for (const [sx, sy] of t.seats) { ctx.fillStyle = '#8a5a34'; ctx.fillRect(sx * T + 4, sy * T + 6, 8, 8); }
  }

  function drawPlant(ctx, x, y) {
    ctx.fillStyle = '#c0603a'; ctx.fillRect(x * T + 4, y * T + 8, 8, 7);
    ctx.fillStyle = '#3f9a3a'; ctx.beginPath(); ctx.arc(x * T + 8, y * T + 5, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6cc04a'; ctx.beginPath(); ctx.arc(x * T + 6, y * T + 3, 3, 0, Math.PI * 2); ctx.fill();
  }

  function drawCustomer(ctx, c, now) {
    const moving = c.state === 'walk' || c.state === 'toqueue';
    const frame = moving ? 1 + (Math.floor(c.anim * 6) % 2) : 0;
    const img = Art.character(c.look, c.dir, frame);
    const x = Math.round(c.x * T + 8 - img.width / 2), y = Math.round(c.y * T + 15 - img.height);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(Math.round(c.x * T + 3), Math.round(c.y * T + 13), 10, 3);
    ctx.drawImage(img, x, y);
    // Bolsa con la compra
    if (c.basket.length && moving) { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(x + 12, y + 10, 4, 5); }
    if (c.bubble) {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x - 1, y - 13, 16, 12, 3); ctx.fill(); ctx.stroke();
      ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(c.bubble, x + 7, y - 7);
      ctx.textBaseline = 'alphabetic';
    } else if (c.state === 'waiting' && c.qpos === 0) {
      ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.type === 'seller' ? '💼' : '🛒', x + 7, y - 3 + Math.sin(now / 200));
    }
  }

  // Qué hay en una casilla del plano (para los toques)
  function hit(tx, ty) {
    const c = customers.find(c => Math.round(c.x) === tx && Math.abs(c.y - ty) < 1);
    if (c && c.state === 'waiting' && c.qpos === 0) return { type: 'register' };
    for (let i = 0; i < SHELF_SPOTS.length; i++) {
      const s = SHELF_SPOTS[i];
      if ((tx === s.x || tx === s.x + 1) && (ty === s.y || ty === s.y - 1 || ty === s.y + 1 && !c)) return { type: 'shelf', index: i };
    }
    if (tx >= COUNTER.x - 1 && tx < COUNTER.x + COUNTER.w && ty >= 1 && ty <= COUNTER.y + 2) return { type: 'register' };
    if (tx >= VITRINA.x - 1 && ty >= VITRINA.y && ty < VITRINA.y + VITRINA.h) return { type: 'vitrina' };
    if (c) return { type: 'customer', c };
    return null;
  }

  function reset() { customers = []; floaters = []; spawnT = 2; S.queue = []; }

  return {
    update, render, hit, served, queueHead, floatText, changeRep, reset, say,
    get customers() { return customers; },
  };
})();
