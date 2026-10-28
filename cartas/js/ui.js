'use strict';

/* ══════════════════════════════════════
   PANELES, CAJA Y VENTANAS
══════════════════════════════════════ */
const UI = (() => {
  const $ = s => document.querySelector(s);
  const panel = $('#panel'), panelBody = $('#panel-body'), panelTitle = $('#panel-title');
  let current = null;   // { id, render }

  /* ── Utilidades ─────────────────── */
  function toast(msg, kind = '') {
    const wrap = $('#toasts');
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.innerHTML = msg;
    wrap.appendChild(t);
    while (wrap.children.length > 3) wrap.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2600);
  }

  function openPanel(id, title, render) {
    current = { id, render };
    panelTitle.innerHTML = title;
    panel.classList.remove('hidden');
    refresh();
    panelBody.scrollTop = 0;
    Sfx.play('tap');
  }
  function closePanel() { current = null; panel.classList.add('hidden'); Game.refreshHud(); }
  function refresh() { if (current) panelBody.innerHTML = current.render(); Game.refreshHud(); }
  const isOpen = () => !!current || !$('#modal').classList.contains('hidden') || !$('#checkout').classList.contains('hidden') || Opening.active;

  function modal(title, html, buttons = [{ label: 'Vale', primary: true }]) {
    return new Promise(res => {
      const m = $('#modal');
      m.querySelector('.modal-title').innerHTML = title;
      m.querySelector('.modal-body').innerHTML = html;
      const actions = m.querySelector('.modal-actions');
      actions.innerHTML = '';
      buttons.forEach((b, i) => {
        const btn = document.createElement('button');
        btn.className = `btn ${b.primary ? 'primary' : ''}`;
        btn.innerHTML = b.label;
        btn.onclick = () => { m.classList.add('hidden'); Sfx.play('click'); res(i); };
        actions.appendChild(btn);
      });
      m.classList.remove('hidden');
    });
  }

  function productThumb(id) {
    const p = PRODUCTS[id];
    if (p.kind === 'acc') return `<div class="pthumb pt-acc" style="--c:${p.color}">${p.icon}</div>`;
    const s = SETS[p.set];
    return `<div class="pthumb pt-${p.kind}" style="--c1:${s.color};--c2:${s.color2}"><img src="art/full/${s.mascot}.webp" alt=""></div>`;
  }

  /* ── Pedidos ────────────────────── */
  const orderQty = {};
  function ordersPanel() {
    openPanel('orders', '📦 Pedidos al proveedor', () => {
      const pending = S.orders.length ? `<div class="note">🚚 En camino: ${S.orders.map(o => `${o.lots * PRODUCTS[o.product].lot} × ${PRODUCTS[o.product].short}`).join(', ')}</div>` : '';
      return `${pending}
        <p class="muted">${S.phase === 'night' ? 'Lo que pidas ahora llegará mañana al abrir.' : 'Los pedidos tardan una hora de juego en llegar.'}</p>
        <div class="list">${Object.entries(PRODUCTS).map(([id, p]) => {
          const locked = p.level > S.level;
          const q = orderQty[id] || 1;
          const total = q * p.lot * p.cost;
          return `<div class="row ${locked ? 'locked' : ''}">
            ${productThumb(id)}
            <div class="info">
              <div class="title">${esc(p.name)}</div>
              <div class="sub">${locked ? `🔒 Nivel ${p.level}` : `Lote de ${p.lot} · coste ${euro(p.cost)}/u · PVP recomendado ${euro(p.market)}`}</div>
              <div class="sub">En almacén: ${S.storage[id] || 0}</div>
            </div>
            ${locked ? '' : `<div class="actions col">
              <div class="stepper"><button data-act="oq" data-id="${id}" data-d="-1">−</button><span>${q}</span><button data-act="oq" data-id="${id}" data-d="1">+</button></div>
              <button class="btn small primary" data-act="order" data-id="${id}" ${S.money < total ? 'disabled' : ''}>${euro(total)}</button>
            </div>`}
          </div>`;
        }).join('')}</div>`;
    });
  }

  /* ── Almacén y precios ──────────── */
  function storagePanel() {
    openPanel('storage', '🗃️ Almacén y precios', () => {
      const ids = Object.keys(PRODUCTS).filter(id => (S.storage[id] || 0) > 0 || S.shelves.some(s => s.product === id));
      if (!ids.length) return '<div class="empty">El almacén está vacío. Haz un pedido al proveedor.</div>';
      return `<div class="list">${ids.map(id => {
        const p = PRODUCTS[id];
        const n = S.storage[id] || 0;
        const onShelf = S.shelves.filter(s => s.product === id).reduce((a, s) => a + s.count, 0);
        return `<div class="row">
          ${productThumb(id)}
          <div class="info">
            <div class="title">${esc(p.name)}</div>
            <div class="sub">Almacén: <b>${n}</b> · En estantería: <b>${onShelf}</b></div>
            ${priceControl(id)}
          </div>
          <div class="actions col">
            ${p.kind === 'pack' ? `<button class="btn small primary" data-act="open" data-id="${id}" ${n ? '' : 'disabled'}>✨ Abrir</button>` : ''}
            ${p.kind === 'box' ? `<button class="btn small" data-act="openbox" data-id="${id}" ${n ? '' : 'disabled'}>📦 Abrir caja</button>` : ''}
          </div>
        </div>`;
      }).join('')}</div>`;
    });
  }

  function priceControl(id) {
    const p = PRODUCTS[id];
    const pr = S.prices[id];
    const margin = Math.round(((pr - p.cost) / pr) * 100);
    const vs = pr / p.market;
    const tag = vs > 1.3 ? '<span class="bad">muy caro</span>' : vs > 1.1 ? '<span class="warn">algo caro</span>' : vs < 0.95 ? '<span class="good">barato</span>' : '<span>justo</span>';
    return `<div class="price-ctl">
      <button data-act="price" data-id="${id}" data-d="-0.5">−</button>
      <span class="price">${euro(pr)}</span>
      <button data-act="price" data-id="${id}" data-d="0.5">+</button>
      <button class="mini" data-act="pricemkt" data-id="${id}">Mercado</button>
      <small>${tag} · margen ${margin}%</small>
    </div>`;
  }

  /* ── Estanterías ────────────────── */
  function shelfPanel(i) {
    if (i >= S.shelves.length) {
      return modal('🧱 Espacio libre', 'Aquí cabe otra estantería. Cómprala en <b>Mejoras</b>.', [{ label: 'Ir a Mejoras', primary: true }, { label: 'Cerrar' }]).then(r => { if (r === 0) upgradesPanel(); });
    }
    openPanel('shelf', `🧺 Estantería ${i + 1}`, () => {
      const sh = S.shelves[i];
      const head = sh.product
        ? `<div class="row">
            ${productThumb(sh.product)}
            <div class="info"><div class="title">${esc(PRODUCTS[sh.product].name)}</div>
              <div class="sub">En la estantería: <b>${sh.count}/${PRODUCTS[sh.product].cap}</b> · Almacén: ${S.storage[sh.product] || 0}</div>
              ${priceControl(sh.product)}</div>
            <div class="actions col">
              <button class="btn small primary" data-act="restock" data-i="${i}" ${(S.storage[sh.product] || 0) && sh.count < PRODUCTS[sh.product].cap ? '' : 'disabled'}>Reponer</button>
              <button class="btn small" data-act="unshelf" data-i="${i}" ${sh.count ? '' : 'disabled'}>Retirar</button>
            </div>
          </div>`
        : '<div class="empty">Estantería vacía. Elige qué producto poner.</div>';
      const options = Object.keys(PRODUCTS).filter(id => (S.storage[id] || 0) > 0 && id !== sh.product);
      return `${head}
        <h3>Poner otro producto</h3>
        ${options.length ? `<div class="list">${options.map(id => `<div class="row">${productThumb(id)}<div class="info"><div class="title">${esc(PRODUCTS[id].short)}</div><div class="sub">Almacén: ${S.storage[id]}</div></div><div class="actions"><button class="btn small" data-act="assign" data-i="${i}" data-id="${id}">Colocar</button></div></div>`).join('')}</div>` : '<p class="muted">No tienes más productos en el almacén.</p>'}`;
    });
  }

  /* ── Álbum ──────────────────────── */
  let albumSet = 'base';
  function albumPanel() {
    openPanel('album', '🃏 Álbum de cartas', () => {
      const tabs = Object.values(SETS).map(s => `<button class="tab ${albumSet === s.id ? 'on' : ''}" data-act="aset" data-id="${s.id}">${s.code}</button>`).join('');
      const set = SETS[albumSet];
      const owned = set.cards.filter(id => S.collection[id]).length;
      const value = Object.entries(S.collection).reduce((a, [id, n]) => a + cardPrice(id, S.day) * n, 0);
      return `<div class="tabs">${tabs}</div>
        <div class="album-head"><b>${esc(set.name)}</b> · ${owned}/${set.cards.length} (${Math.round((owned / set.cards.length) * 100)}%)<br><small>Valor de toda tu colección hoy: <b>${euro(value)}</b></small></div>
        <div class="progress"><div style="width:${(owned / set.cards.length) * 100}%"></div></div>
        <div class="album-grid">${set.cards.map(id => S.collection[id]
          ? `<div class="album-card" data-act="card" data-id="${id}">${cardHTML(id)}<span class="count">×${S.collection[id]}</span></div>`
          : `<div class="album-card missing"><div class="missing-card"><span>${String(CARDS[id].num).padStart(3, '0')}</span><small>${RARITIES[CARDS[id].rarity].symbol}</small></div></div>`).join('')}</div>`;
    });
  }

  function cardDetail(id) {
    const c = CARDS[id];
    const n = S.collection[id] || 0;
    const price = cardPrice(id, S.day);
    const sell = Math.round(price * 0.8 * 100) / 100;
    const m = $('#card-detail');
    m.querySelector('.cd-card').innerHTML = cardHTML(id, { cls: 'big' });
    attachTilt(m.querySelector('.card'), 1);
    m.querySelector('.cd-info').innerHTML = `
      <div><b>${esc(c.name)}</b> · ${RARITIES[c.rarity].name}</div>
      <div class="muted">${SETS[c.set].name} · ${c.id}</div>
      <div>Tienes: <b>${n}</b> · Precio de mercado hoy: <b>${euro(price)}</b></div>
      <div class="btn-row">
        <button class="btn" data-cd="sell" ${n ? '' : 'disabled'}>Vender 1 online (${euro(sell)})</button>
        ${S.up.vitrina ? `<button class="btn primary" data-cd="vitrina" ${n && S.vitrina.length < 8 ? '' : 'disabled'}>A la vitrina</button>` : ''}
        <button class="btn" data-cd="close">Cerrar</button>
      </div>`;
    m.classList.remove('hidden');
    m.onclick = async e => {
      const b = e.target.closest('[data-cd]');
      if (e.target === m) return m.classList.add('hidden');
      if (!b) return;
      if (b.dataset.cd === 'close') return m.classList.add('hidden');
      if (b.dataset.cd === 'sell') {
        S.collection[id]--;
        if (!S.collection[id]) delete S.collection[id];
        Game.addMoney(sell, 'online');
        Sfx.play('coin');
        toast(`💰 Vendida ${esc(c.name)} por ${euro(sell)}`);
      }
      if (b.dataset.cd === 'vitrina') {
        S.collection[id]--;
        if (!S.collection[id]) delete S.collection[id];
        S.vitrina.push({ id, price: Math.round(price * 1.25 * 20) / 20 || 0.1 });
        toast(`🪟 ${esc(c.name)} está en la vitrina`);
      }
      m.classList.add('hidden');
      Game.save();
      refresh();
    };
  }

  /* ── Vitrina ────────────────────── */
  function vitrinaPanel() {
    openPanel('vitrina', '🪟 Vitrina de cartas', () => {
      if (!S.vitrina.length) return '<div class="empty">La vitrina está vacía. Abre el Álbum, elige una carta y pulsa <b>A la vitrina</b>. Los coleccionistas pagan más que la tienda online.</div>';
      return `<p class="muted">Hasta 8 cartas. Si el precio es razonable, los coleccionistas las comprarán.</p>
        <div class="list">${S.vitrina.map((v, i) => {
          const mk = cardPrice(v.id, S.day);
          return `<div class="row"><div class="mini-card">${cardHTML(v.id)}</div>
            <div class="info"><div class="title">${esc(CARDS[v.id].name)}</div><div class="sub">${RARITIES[CARDS[v.id].rarity].name} · mercado ${euro(mk)}</div>
              <div class="price-ctl"><button data-act="vprice" data-i="${i}" data-d="-1">−</button><span class="price">${euro(v.price)}</span><button data-act="vprice" data-i="${i}" data-d="1">+</button></div></div>
            <div class="actions"><button class="btn small" data-act="vremove" data-i="${i}">Retirar</button></div></div>`;
        }).join('')}</div>`;
    });
  }

  /* ── Mejoras ────────────────────── */
  function upgradesPanel() {
    openPanel('upgrades', '⭐ Mejoras de la tienda', () => {
      return `<p class="muted">Alquiler diario: ${euro(Game.rent())} · Sueldos: ${euro(Game.salaries())}</p>
        <div class="list">${UPGRADES.map(u => {
          const lvl = S.up[u.id];
          const maxed = lvl >= u.max;
          const cost = maxed ? 0 : u.cost(lvl);
          const need = maxed ? 0 : u.level(lvl);
          const locked = need > S.level;
          return `<div class="row ${locked ? 'locked' : ''}">
            <div class="pthumb pt-acc" style="--c:#f2e2c4">${u.icon}</div>
            <div class="info"><div class="title">${esc(u.name)} ${u.max > 1 ? `<small>${lvl}/${u.max}</small>` : ''}</div><div class="sub">${esc(u.desc)}</div></div>
            <div class="actions">${maxed ? '✅' : locked ? `<span class="muted">🔒 Nv ${need}</span>` : `<button class="btn small primary" data-act="upgrade" data-id="${u.id}" ${S.money < cost ? 'disabled' : ''}>${euro(cost)}</button>`}</div>
          </div>`;
        }).join('')}</div>
        <h3>Estadísticas</h3>
        <div class="stats">
          <span>Sobres abiertos</span><b>${S.stats.packs}</b>
          <span>Cartas distintas</span><b>${Object.keys(S.collection).length}/${Object.keys(CARDS).length}</b>
          <span>Mejor sobre</span><b>${euro(S.stats.bestPack || 0)}</b>
          <span>Clientes atendidos</span><b>${S.stats.served || 0}</b>
          <span>Ventas totales</span><b>${euro(S.stats.revenue)}</b>
        </div>
        <div class="btn-row"><button class="btn" data-act="help">❓ Cómo jugar</button><button class="btn danger" data-act="reset">🗑️ Empezar de cero</button></div>`;
    });
  }

  /* ── Acciones de los paneles ────── */
  panelBody.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const { act, id } = b.dataset;
    const i = +b.dataset.i;
    Sfx.play('click');
    if (act === 'oq') orderQty[id] = Math.max(1, Math.min(20, (orderQty[id] || 1) + +b.dataset.d));
    else if (act === 'order') Game.order(id, orderQty[id] || 1);
    else if (act === 'price') Game.setPrice(id, S.prices[id] + +b.dataset.d * (PRODUCTS[id].market >= 50 ? 10 : PRODUCTS[id].market >= 10 ? 1 : 0.2) * 2);
    else if (act === 'pricemkt') Game.setPrice(id, PRODUCTS[id].market);
    else if (act === 'open') { closePanel(); Opening.open(id, () => {}); return; }
    else if (act === 'openbox') Game.openBox(id);
    else if (act === 'restock') Game.restock(i);
    else if (act === 'unshelf') Game.unshelf(i);
    else if (act === 'assign') Game.assign(i, id);
    else if (act === 'aset') albumSet = id;
    else if (act === 'card') return cardDetail(id);
    else if (act === 'vprice') { const v = S.vitrina[i]; v.price = Math.max(0.1, Math.round((v.price + +b.dataset.d * Math.max(0.1, v.price * 0.1)) * 20) / 20); }
    else if (act === 'vremove') { const v = S.vitrina.splice(i, 1)[0]; S.collection[v.id] = (S.collection[v.id] || 0) + 1; }
    else if (act === 'upgrade') Game.buyUpgrade(id);
    else if (act === 'help') return Game.help();
    else if (act === 'reset') return Game.reset();
    Game.save();
    refresh();
  });
  $('#panel-close').addEventListener('click', closePanel);
  panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });

  /* ══════════════════════════════════════
     CAJA REGISTRADORA
  ══════════════════════════════════════ */
  const co = $('#checkout');
  let cur = null;   // { c, total, method, typed, paid, given: [] }
  const MONEY = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05];

  async function checkout(c) {
    if (!c) return;
    if (c.type === 'seller') return sellerOffer(c);
    const total = Math.round(c.basket.reduce((a, b) => a + b.qty * b.price, 0) * 100) / 100;
    const method = Math.random() < 0.45 ? 'card' : 'cash';
    let paid = total;
    if (method === 'cash') {
      const opts = [5, 10, 20, 50, 100].filter(v => v >= total);
      paid = opts.length ? opts[Math.random() < 0.7 ? 0 : Math.min(1, opts.length - 1)] : Math.ceil(total / 10) * 10;
      if (paid === total) paid = total + [5, 10][Math.floor(Math.random() * 2)];
    }
    cur = { c, total, method, typed: '', paid, given: [], start: performance.now() };
    renderCheckout();
    co.classList.remove('hidden');
    Sfx.play('beep');
  }

  function cents(n) { return Math.round(n * 100); }

  function renderCheckout() {
    const { c, total, method, typed, paid, given } = cur;
    const lines = c.basket.map(b => `<div class="line"><span>${b.qty} × ${esc(b.product ? PRODUCTS[b.product].short : CARDS[b.card].name)}</span><b>${euro(b.qty * b.price)}</b></div>`).join('');
    const givenSum = given.reduce((a, v) => a + cents(v), 0) / 100;
    const change = Math.round((paid - total) * 100) / 100;
    co.querySelector('.co-body').innerHTML = `
      <div class="ticket">${lines}<div class="line total"><span>TOTAL</span><b>${euro(total)}</b></div></div>
      ${method === 'card'
        ? `<div class="pay-hint">💳 Paga con tarjeta. Teclea el importe en el datáfono.</div>
           <div class="pos-screen">${euro(+typed / 100 || 0)}</div>
           <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(k => `<button data-key="${k}" class="${k === 'OK' ? 'ok' : k === 'C' ? 'clear' : ''}">${k}</button>`).join('')}</div>`
        : `<div class="pay-hint">💶 Paga con <b>${euro(paid)}</b>. Devuelve el cambio: <b class="change">${euro(change)}</b></div>
           <div class="pos-screen ${cents(givenSum) === cents(change) ? 'ok' : ''}">Has dado: ${euro(givenSum)}</div>
           <div class="drawer">${MONEY.map(v => `<button data-money="${v}" class="${v >= 5 ? 'bill' : 'coin'}" style="--c:${v >= 5 ? ['#7ab0e8', '#e88a8a', '#e8b07a', '#9ad89a'][[50, 20, 10, 5].indexOf(v)] : v >= 1 ? '#e8c860' : '#d8a060'}">${v >= 1 ? v : Math.round(v * 100) + 'c'}</button>`).join('')}</div>
           <div class="btn-row"><button class="btn" data-co="undo">↩ Deshacer</button><button class="btn primary" data-co="give">Dar cambio</button></div>`}`;
  }

  co.addEventListener('click', e => {
    if (!cur) return;
    const key = e.target.closest('[data-key]')?.dataset.key;
    const money = e.target.closest('[data-money]')?.dataset.money;
    const act = e.target.closest('[data-co]')?.dataset.co;
    if (key !== undefined) {
      if (key === 'C') cur.typed = '';
      else if (key === 'OK') return finish(+cur.typed === cents(cur.total));
      else if (cur.typed.length < 7) cur.typed += key;
      Sfx.play('beep');
    }
    if (money) { cur.given.push(+money); Sfx.play(+money >= 5 ? 'bill' : 'coin'); }
    if (act === 'undo') cur.given.pop();
    if (act === 'give') return finish(cents(cur.given.reduce((a, v) => a + v, 0)) === cents(cur.paid - cur.total));
    if (act === 'later') { co.classList.add('hidden'); cur = null; return; }
    renderCheckout();
  });

  function finish(ok) {
    if (!ok) {
      Sfx.play('error');
      co.querySelector('.co-box').classList.remove('shake');
      void co.offsetWidth;
      co.querySelector('.co-box').classList.add('shake');
      cur.c.patience -= 3;
      return;
    }
    const secs = (performance.now() - cur.start) / 1000;
    const tip = secs < 8 && Math.random() < 0.5 ? Math.round(cur.total * 0.05 * 20) / 20 : 0;
    Game.completeSale(cur.c, cur.total, tip);
    co.classList.add('hidden');
    cur = null;
    // Si hay más clientes esperando, se atiende al siguiente
    setTimeout(() => { const n = Shop.queueHead(); if (n && !S.up.cajero && document.querySelector('#checkout').classList.contains('hidden')) checkout(n); }, 450);
  }

  async function sellerOffer(c) {
    const o = c.offer;
    const r = await modal('💼 Un vendedor te ofrece cartas', `
      <p>«Me deshago de mi colección. ¿Te interesan estas cartas?»</p>
      <div class="offer-cards">${o.cards.map(id => `<div class="mini-card">${cardHTML(id)}</div>`).join('')}</div>
      <p>Valor de mercado: <b>${euro(o.value)}</b> · Te las deja por <b>${euro(o.price)}</b></p>`,
      [{ label: `Comprar (${euro(o.price)})`, primary: S.money >= o.price }, { label: 'No, gracias' }]);
    if (r === 0 && S.money >= o.price) {
      Game.spend(o.price, 'cartas');
      for (const id of o.cards) S.collection[id] = (S.collection[id] || 0) + 1;
      toast('🃏 Cartas añadidas a tu álbum');
      Sfx.play('cash');
    } else if (r === 0) toast('No tienes dinero suficiente', 'bad');
    Shop.served(c, true);
    Game.save();
  }

  return { toast, modal, openPanel, closePanel, refresh, isOpen, ordersPanel, storagePanel, shelfPanel, albumPanel, vitrinaPanel, upgradesPanel, cardDetail, checkout, productThumb };
})();
