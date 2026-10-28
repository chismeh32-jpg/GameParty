'use strict';

/* ══════════════════════════════════════
   LÓGICA · cajas, colección, recompensas y regalos
══════════════════════════════════════ */
const PET_SELL = { comun: 15, rara: 35, epica: 90 };
const ACC_SELL = { comun: 8, rara: 20, epica: 50 };
const LINE_BONUS = { comun: 150, rara: 250, epica: 400, legendaria: 600 };
const PITY_AT = 15;   // garantiza una épica o mejor cada 15 cajas de muñeca sin suerte

let S = null;        // partida del perfil activo
let PID = null;      // id del perfil activo

const Game = {
  save() { if (PID && S) Store.save(PID, S); },

  // ── Monedas ──
  addCoins(n) { S.coins += n; S.stats.coinsEarned += Math.max(0, n); },
  canPay(n) { return S.settings.freeMode || S.coins >= n; },
  pay(n) { if (S.settings.freeMode) return true; if (S.coins < n) return false; S.coins -= n; return true; },

  // ── Caja gratis cada hora ──
  tickFree() {
    const f = S.free;
    if (f.n >= FREE_MAX) { f.t = Date.now(); return; }
    const gained = Math.floor((Date.now() - f.t) / FREE_EVERY);
    if (gained > 0) { f.n = Math.min(FREE_MAX, f.n + gained); f.t = f.n >= FREE_MAX ? Date.now() : f.t + gained * FREE_EVERY; }
  },
  freeNext() { return S.free.n >= FREE_MAX ? 0 : Math.max(0, FREE_EVERY - (Date.now() - S.free.t)); },

  // ── Recompensa diaria ──
  dailyPending() { return S.daily.last !== dayNumber(); },
  claimDaily() {
    const today = dayNumber();
    if (S.daily.last === today) return null;
    const streak = S.daily.last === today - 1 ? S.daily.streak + 1 : 1;
    S.daily = { last: today, streak };
    const coins = 40 + 20 * Math.min(streak - 1, 6);
    this.addCoins(coins);
    let box = null;
    if (streak % 7 === 0) { box = 'skullector'; S.inv.skullector = (S.inv.skullector || 0) + 1; }
    else if (streak % 3 === 0) { box = 'misteriosa'; S.inv.misteriosa = (S.inv.misteriosa || 0) + 1; }
    this.save();
    return { coins, streak, box };
  },

  // ── Abrir cajas ──
  // source: 'free' (caja gratis), 'inv' (caja guardada) o 'buy'
  take(boxId, source) {
    const box = BOX_BY_ID[boxId];
    if (source === 'free') { if (S.free.n <= 0) return false; if (S.free.n >= FREE_MAX) S.free.t = Date.now(); S.free.n--; return true; }
    if (source === 'inv') { if (!S.inv[boxId]) return false; S.inv[boxId]--; if (!S.inv[boxId]) delete S.inv[boxId]; return true; }
    return this.pay(box.price);
  },

  open(boxId, source) {
    const box = BOX_BY_ID[boxId];
    if (!this.take(boxId, source)) return null;
    S.stats.opened++;
    let res;
    if (box.kind === 'doll') res = this.rollDoll(box);
    else if (box.kind === 'pet') res = { items: [this.givePet(this.rollFrom(PETS, box.rates).id)] };
    else res = { items: Array.from({ length: box.count || 1 }, () => this.giveAcc(this.rollFrom(ACCESSORIES, box.rates).id)) };
    res.box = boxId;
    res.rewards = this.afterChange();
    this.save();
    return res;
  },

  rollFrom(list, rates) {
    const avail = new Set(list.map(x => x.rarity));
    const r = pickWeighted(Object.entries(rates).filter(([k, w]) => w > 0 && avail.has(k)));
    const pool = list.filter(x => x.rarity === r);
    return pool[Math.floor(Math.random() * pool.length)];
  },

  rollDoll(box) {
    const pool = box.pool();
    let doll;
    if (!box.rates) doll = pool[Math.floor(Math.random() * pool.length)];
    else {
      let rates = box.rates;
      if (S.pity >= PITY_AT - 1) rates = { comun: 0, rara: 0, epica: 70, legendaria: 30 };
      doll = this.rollFrom(pool, rates);
    }
    S.pity = RARITY[doll.rarity].order >= 2 ? 0 : S.pity + 1;
    const shiny = Math.random() < SHINY_CHANCE;
    const main = this.giveDoll(doll.id, shiny);
    const items = [main];
    // A veces la muñeca trae su mascota o un accesorio suyo
    const extra = this.rollExtra(doll.char);
    if (extra) items.push(extra);
    return { items };
  },

  rollExtra(ch) {
    const pets = PETS.filter(p => p.owner === ch);
    const accs = ACCESSORIES.filter(a => a.owner === ch);
    const x = Math.random();
    if (x < 0.16 && pets.length) return this.givePet(pets[Math.floor(Math.random() * pets.length)].id, true);
    if (x < 0.42 && accs.length) return this.giveAcc(accs[Math.floor(Math.random() * accs.length)].id, true);
    if (x < 0.55) { const g = ACCESSORIES.filter(a => !a.owner); return this.giveAcc(g[Math.floor(Math.random() * g.length)].id, true); }
    return null;
  },

  giveDoll(id, shiny = false) {
    const cur = S.dolls[id];
    const isNew = !cur;
    if (isNew) S.dolls[id] = { n: 0, shiny: 0, t: Date.now() };
    S.dolls[id].n++;
    if (shiny) S.dolls[id].shiny++;
    const d = DOLLS[id];
    const score = RARITY[d.rarity].order * 2 + (shiny ? 1 : 0);
    if (!S.stats.best || score > S.stats.best.score) S.stats.best = { id, shiny, score };
    S.history.unshift({ k: 'd', id, shiny, t: Date.now() });
    S.history.length = Math.min(S.history.length, 40);
    return { kind: 'doll', id, shiny, isNew, n: S.dolls[id].n };
  },
  givePet(id, extra = false) {
    const isNew = !S.pets[id];
    S.pets[id] = (S.pets[id] || 0) + 1;
    if (!extra) { S.history.unshift({ k: 'p', id, t: Date.now() }); S.history.length = Math.min(S.history.length, 40); }
    return { kind: 'pet', id, isNew, n: S.pets[id], extra };
  },
  giveAcc(id, extra = false) {
    const isNew = !S.accs[id];
    S.accs[id] = (S.accs[id] || 0) + 1;
    return { kind: 'acc', id, isNew, n: S.accs[id], extra };
  },

  // Colecciones completadas y logros nuevos tras cualquier cambio
  afterChange() {
    const out = [];
    for (const l of LINES) {
      if (!S.linesDone[l.id] && lineDone(S, l)) {
        S.linesDone[l.id] = true;
        const c = LINE_BONUS[l.rarity];
        this.addCoins(c);
        S.inv.misteriosa = (S.inv.misteriosa || 0) + 1;
        out.push({ type: 'line', id: l.id, coins: c });
      }
    }
    for (const ch of Object.keys(CHARS)) {
      const all = DOLL_LIST.filter(d => d.char === ch);
      if (all.length >= 3 && !S.charsDone[ch] && all.every(d => S.dolls[d.id])) {
        S.charsDone[ch] = true;
        this.addCoins(300);
        out.push({ type: 'char', id: ch, coins: 300 });
      }
    }
    for (const a of ACHIEVEMENTS) {
      if (!S.ach[a.id] && a.test(S)) {
        S.ach[a.id] = Date.now();
        this.addCoins(a.reward);
        out.push({ type: 'ach', id: a.id, coins: a.reward });
      }
    }
    return out;
  },

  // ── Tienda de deseos: comprar una muñeca concreta ──
  wishPrice(id) { return WISH_PRICE[DOLLS[id].rarity]; },
  wish(id) {
    if (S.dolls[id]) return null;
    if (!this.pay(this.wishPrice(id))) return null;
    S.stats.wishes++;
    const r = this.giveDoll(id, false);
    r.rewards = this.afterChange();
    this.save();
    return r;
  },

  // ── Vender repetidas ──
  sellValue(kind, id, shiny = false) {
    if (kind === 'doll') return RARITY[DOLLS[id].rarity].dup * (shiny ? 3 : 1);
    if (kind === 'pet') return PET_SELL[PET_BY_ID[id].rarity];
    return ACC_SELL[ACC_BY_ID[id].rarity];
  },
  sellOne(kind, id) {
    const map = kind === 'doll' ? S.dolls : kind === 'pet' ? S.pets : S.accs;
    const n = kind === 'doll' ? map[id]?.n : map[id];
    if (!n || n < 2) return 0;
    const shinyExtra = kind === 'doll' && map[id].shiny > 0 && map[id].shiny >= n;
    const v = this.sellValue(kind, id, shinyExtra);
    if (kind === 'doll') { map[id].n--; if (map[id].shiny > map[id].n) map[id].shiny = map[id].n; } else map[id]--;
    this.addCoins(v);
    this.save();
    return v;
  },
  sellAllDupes() {
    let total = 0, count = 0;
    for (const [id, v] of Object.entries(S.dolls)) {
      // Se queda una copia y todas las brillantes
      const keep = Math.max(1, v.shiny);
      while (v.n > keep) { v.n--; total += this.sellValue('doll', id); count++; }
    }
    for (const id of Object.keys(S.pets)) while (S.pets[id] > 1) { S.pets[id]--; total += PET_SELL[PET_BY_ID[id].rarity]; count++; }
    for (const id of Object.keys(S.accs)) while (S.accs[id] > 1) { S.accs[id]--; total += ACC_SELL[ACC_BY_ID[id].rarity]; count++; }
    this.addCoins(total);
    this.save();
    return { total, count };
  },
  dupeCount() {
    let n = 0;
    for (const v of Object.values(S.dolls)) n += Math.max(0, v.n - Math.max(1, v.shiny));
    for (const v of Object.values(S.pets)) n += v - 1;
    for (const v of Object.values(S.accs)) n += v - 1;
    return n;
  },

  // ── Regalos ──
  gift(kind, id, shiny = false) {
    if (kind === 'b') {
      if (!this.pay(BOX_BY_ID[id].price)) return null;
    } else if (kind === 'd') {
      const v = S.dolls[id]; if (!v) return null;
      if (shiny && !v.shiny) return null;
      v.n--; if (shiny) v.shiny--;
      if (v.shiny > v.n) v.shiny = v.n;
      if (v.n <= 0) { delete S.dolls[id]; S.shelf = S.shelf.map(x => (x === id ? null : x)); delete S.fav[id]; if (S.avatar === id) S.avatar = null; }
    } else {
      const map = kind === 'p' ? S.pets : S.accs;
      if (!map[id]) return null;
      map[id]--; if (!map[id]) delete map[id];
    }
    S.stats.gifts++;
    const code = Gift.encode(kind, id, shiny);
    const rewards = this.afterChange();
    this.save();
    return { code, rewards };
  },
  redeem(code) {
    const g = Gift.decode(code);
    if (!g) return { error: 'Ese código no es válido. Revisa que esté copiado entero.' };
    if (S.redeemed[g.nonce]) return { error: 'Este regalo ya lo has abierto en este perfil.' };
    S.redeemed[g.nonce] = Date.now();
    let item;
    if (g.kind === 'd') item = this.giveDoll(g.id, g.shiny);
    else if (g.kind === 'p') item = this.givePet(g.id);
    else if (g.kind === 'a') item = this.giveAcc(g.id);
    else { S.inv[g.id] = (S.inv[g.id] || 0) + 1; item = { kind: 'box', id: g.id }; }
    const rewards = this.afterChange();
    this.save();
    return { item, rewards };
  },

  // Regalo directo a otro perfil del mismo dispositivo
  giftToProfile(kind, id, shiny, toId) {
    const g = this.gift(kind, id, shiny);
    if (!g) return null;
    const other = Store.open(toId);
    if (!other) return null;
    const prev = { S, PID };
    S = other; PID = toId;
    const r = this.redeem(g.code);
    this.save();
    S = prev.S; PID = prev.PID;
    Store.profiles.current = PID;
    Store.saveProfiles();
    return r;
  },
};

function pickWeighted(entries) {
  const tot = entries.reduce((a, [, w]) => a + w, 0);
  let x = Math.random() * tot;
  for (const [k, w] of entries) { if ((x -= w) < 0) return k; }
  return entries[entries.length - 1][0];
}
