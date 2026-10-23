'use strict';

/* ══════════════════════════════════════
   UI: capas de interfaz sobre el lienzo
   Cada capa recibe los botones (up, down, left, right, a, b, start)
   cuando está en la cima de la pila.
══════════════════════════════════════ */
const UI = (() => {
  const root = document.getElementById('ui');
  const stack = [];

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function push(layer) {
    stack.push(layer);
    root.appendChild(layer.el);
    return layer;
  }

  function remove(layer) {
    const i = stack.indexOf(layer);
    if (i >= 0) stack.splice(i, 1);
    layer.el.remove();
  }

  const top = () => stack[stack.length - 1];
  const busy = () => stack.length > 0;

  function press(btn) {
    const l = top();
    if (l && l.onButton) l.onButton(btn === 'start' ? 'b' : btn);
  }

  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  /* ── Cuadro de texto ───────────────── */
  const measurer = el('div', 'textbox measure');
  measurer.innerHTML = '<div class="tb-text"></div>';

  function paginate(text) {
    root.appendChild(measurer);
    const box = measurer.querySelector('.tb-text');
    const maxH = parseFloat(getComputedStyle(box).lineHeight) * 2 + 1;
    const pages = [];
    for (const para of String(text).split('\n')) {
      let cur = '';
      for (const w of para.split(' ')) {
        const test = cur ? cur + ' ' + w : w;
        box.textContent = test;
        if (box.scrollHeight > maxH && cur) {
          pages.push(cur);
          cur = w;
        } else cur = test;
      }
      if (cur) pages.push(cur);
    }
    measurer.remove();
    return pages.length ? pages : [''];
  }

  function textbox() {
    const box = el('div', 'textbox');
    box.innerHTML = '<div class="tb-text"></div><div class="tb-arrow">▼</div>';
    return box;
  }

  // Muestra un texto (con páginas) y espera a que el jugador pulse A
  function say(text, opts = {}) {
    return new Promise(resolve => {
      const pages = paginate(text);
      const layer = { el: textbox() };
      if (opts.cls) layer.el.classList.add(opts.cls);
      const txt = layer.el.querySelector('.tb-text');
      const arrow = layer.el.querySelector('.tb-arrow');
      let page = 0, shown = 0, typing = false, timer = null;
      const speed = opts.fast ? 6 : 22;

      function typePage() {
        typing = true;
        shown = 0;
        arrow.style.visibility = 'hidden';
        const full = pages[page];
        clearInterval(timer);
        timer = setInterval(() => {
          shown += 2;
          txt.textContent = full.slice(0, shown);
          if (shown >= full.length) finishPage();
        }, speed);
      }
      function finishPage() {
        clearInterval(timer);
        typing = false;
        txt.textContent = pages[page];
        const last = page === pages.length - 1;
        arrow.style.visibility = last && opts.keep ? 'hidden' : 'visible';
        if (last && opts.keep) done();
        else if (opts.auto) timer = setTimeout(() => advance(), opts.auto);
      }
      function advance() {
        clearTimeout(timer);
        if (page < pages.length - 1) { page++; typePage(); }
        else done();
      }
      function done() {
        clearInterval(timer);
        if (!opts.keep) remove(layer);
        resolve(layer);
      }
      layer.onButton = btn => {
        if (btn !== 'a' && btn !== 'b') return;
        if (typing) finishPage();
        else if (!(opts.keep && page === pages.length - 1)) { Audio8.sfx('select'); advance(); }
      };
      layer.el.addEventListener('click', () => layer.onButton('a'));
      push(layer);
      typePage();
    });
  }

  async function sayAll(lines, opts) {
    for (const l of [].concat(lines)) await say(l, opts);
  }

  /* ── Menús de opciones ─────────────── */
  // options: [string | {label, disabled, right}] · opts: {cls, cols, cancel, start}
  function choose(options, opts = {}) {
    return new Promise(resolve => {
      const cols = opts.cols || 1;
      const layer = { el: el('div', 'menu ' + (opts.cls || '')) };
      let idx = opts.start || 0;
      const items = options.map((o, i) => {
        const opt = typeof o === 'string' ? { label: o } : o;
        const it = el('div', 'menu-item' + (opt.disabled ? ' disabled' : ''), `<span class="cursor">▶</span><span class="label">${opt.html || esc(opt.label)}</span>${opt.right ? `<span class="right">${opt.right}</span>` : ''}`);
        it.addEventListener('click', e => { e.stopPropagation(); idx = i; render(); pick(); });
        layer.el.appendChild(it);
        return it;
      });
      if (cols > 1) layer.el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      function render() {
        items.forEach((it, i) => it.classList.toggle('active', i === idx));
        if (opts.onMove) opts.onMove(idx);
        items[idx]?.scrollIntoView?.({ block: 'nearest' });
      }
      function pick() {
        const o = options[idx];
        if (o && o.disabled) { Audio8.sfx('bump'); return; }
        Audio8.sfx('select');
        close(idx);
      }
      function close(v) {
        remove(layer);
        resolve(v);
      }
      layer.onButton = btn => {
        const n = options.length;
        if (btn === 'up') idx = (idx - cols + n) % n;
        else if (btn === 'down') idx = (idx + cols) % n;
        else if (btn === 'left' && cols > 1) idx = (idx - 1 + n) % n;
        else if (btn === 'right' && cols > 1) idx = (idx + 1) % n;
        else if (btn === 'a') return pick();
        else if (btn === 'b' && opts.cancel !== false) { Audio8.sfx('back'); return close(-1); }
        render();
      };
      push(layer);
      render();
    });
  }

  async function ask(text, options = ['Sí', 'No']) {
    const tb = await say(text, { keep: true });
    const r = await choose(options, { cls: 'yesno' });
    remove(tb);
    return r === -1 ? options.length - 1 : r;
  }

  /* ── Pantallas completas ───────────── */
  function screen(cls, html) {
    const layer = { el: el('div', 'fullscreen ' + cls, html) };
    return layer;
  }

  function hpBar(c) {
    const max = maxHp(c);
    const f = c.hp / max;
    const col = f > 0.5 ? 'var(--hp-good)' : f > 0.2 ? 'var(--hp-mid)' : 'var(--hp-low)';
    return `<div class="hpbar"><span class="hp-label">PS</span><div class="hp-track"><div class="hp-fill" style="width:${f * 100}%;background:${col}"></div></div></div>`;
  }

  function statusBadge(c) {
    if (c.hp <= 0) return '<span class="badge" style="background:#8a3a3a">DEB</span>';
    return c.status ? `<span class="badge" style="background:${STATUS[c.status].color}">${STATUS[c.status].name}</span>` : '';
  }

  function typeBadges(types) {
    return types.map(t => `<span class="type" style="background:${TYPES[t].color}">${TYPES[t].name}</span>`).join('');
  }

  function partySlot(c, i) {
    if (!c) return '<div class="slot empty"></div>';
    return `
      <div class="slot ${c.hp <= 0 ? 'fainted' : ''}" data-i="${i}">
        <img class="icon" src="${Art.creatureIcon(c.sp)}" alt="">
        <div class="slot-main">
          <div class="slot-name">${esc(monName(c))} ${statusBadge(c)}</div>
          ${hpBar(c)}
        </div>
        <div class="slot-side"><div>Nv${c.lvl}</div><div class="hp-num">${c.hp}/${maxHp(c)}</div></div>
      </div>`;
  }

  // Equipo. mode: 'view' | 'pick'. Devuelve el índice elegido o -1
  function party(prompt = 'Elige una criatura.', mode = 'pick', check) {
    return new Promise(resolve => {
      const layer = screen('party', '<div class="party-grid"></div><div class="screen-msg"></div>');
      const grid = layer.el.querySelector('.party-grid');
      const msg = layer.el.querySelector('.screen-msg');
      let idx = 0, moving = -1;
      function render() {
        const team = G.party;
        grid.innerHTML = [0, 1, 2, 3, 4, 5].map(i => partySlot(team[i], i)).join('') + `<div class="slot cancel ${idx === team.length ? 'active' : ''}">SALIR</div>`;
        const slots = grid.querySelectorAll('.slot:not(.empty)');
        slots.forEach((s, i) => {
          s.classList.toggle('active', i === idx);
          s.classList.toggle('moving', i === moving);
          s.onclick = () => { idx = i; render(); pick(); };
        });
        msg.textContent = moving >= 0 ? '¿Con cuál la intercambias?' : prompt;
      }
      const count = () => G.party.length + 1;
      async function pick() {
        if (idx === G.party.length) { Audio8.sfx('back'); return close(-1); }
        Audio8.sfx('select');
        if (moving >= 0) {
          const t = G.party[moving];
          G.party[moving] = G.party[idx];
          G.party[idx] = t;
          moving = -1;
          return render();
        }
        if (mode === 'view') {
          layer.locked = true;
          const r = await choose(['Datos', 'Mover', 'Salir'], { cls: 'submenu' });
          layer.locked = false;
          if (r === 0) await summary(idx);
          if (r === 1) moving = idx;
          return render();
        }
        if (check) {
          const err = check(G.party[idx]);
          if (err) { msg.textContent = err; Audio8.sfx('bump'); return; }
        }
        close(idx);
      }
      function close(v) { remove(layer); resolve(v); }
      layer.onButton = btn => {
        if (layer.locked) return;
        if (btn === 'up' || btn === 'left') idx = (idx - 1 + count()) % count();
        else if (btn === 'down' || btn === 'right') idx = (idx + 1) % count();
        else if (btn === 'a') return pick();
        else if (btn === 'b') {
          if (moving >= 0) { moving = -1; return render(); }
          Audio8.sfx('back');
          return close(-1);
        }
        render();
      };
      push(layer);
      render();
    });
  }

  function summary(i, list = G.party) {
    return new Promise(resolve => {
      const layer = screen('summary', '');
      let idx = i;
      function render() {
        const c = list[idx];
        const sp = SPECIES[c.sp];
        const st = stats(c);
        const next = c.lvl >= MAX_LEVEL ? 0 : expForLevel(c.lvl + 1) - c.exp;
        layer.el.innerHTML = `
          <div class="sum-left">
            <div class="sum-name">${esc(monName(c))}</div>
            <div class="sum-sub">Nv${c.lvl} · Nº${String(DEX_ORDER.indexOf(c.sp) + 1).padStart(3, '0')}</div>
            <img class="sum-img" src="${Art.creatureIcon(c.sp)}" alt="">
            <div>${typeBadges(sp.types)} ${statusBadge(c)}</div>
            <div class="sum-sub">PS ${c.hp}/${st.hp}</div>
            ${hpBar(c)}
            <div class="sum-sub">EXP para subir: ${next}</div>
            <div class="expbar"><div style="width:${expProgress(c) * 100}%"></div></div>
          </div>
          <div class="sum-right">
            <div class="sum-stats">
              ${['atk', 'def', 'spa', 'spd', 'spe'].map(k => `<span>${STAT_NAMES[k]}</span><b>${st[k]}</b>`).join('')}
            </div>
            <div class="sum-moves">
              ${c.moves.map(m => `<div class="sum-move"><span class="type mini" style="background:${TYPES[MOVES[m.id].t].color}">${TYPES[MOVES[m.id].t].name}</span><span>${MOVES[m.id].n}</span><b>${m.pp}/${MOVES[m.id].pp}</b></div>`).join('')}
            </div>
          </div>
          <div class="screen-hint">◀ ▶ cambiar · B volver</div>`;
      }
      layer.onButton = btn => {
        if (btn === 'b' || btn === 'a') { Audio8.sfx('back'); remove(layer); return resolve(); }
        if (btn === 'left' || btn === 'up') idx = (idx - 1 + list.length) % list.length;
        if (btn === 'right' || btn === 'down') idx = (idx + 1) % list.length;
        render();
      };
      layer.el.addEventListener('click', () => layer.onButton('b'));
      push(layer);
      render();
    });
  }

  // Mochila: devuelve el id del objeto elegido o null
  function bag(filter) {
    return new Promise(resolve => {
      const ids = Object.keys(G.bag).filter(id => G.bag[id] > 0 && (!filter || filter(ITEMS[id])));
      const layer = screen('bag', '<div class="bag-title">MOCHILA</div><div class="bag-list"></div><div class="screen-msg"></div>');
      const list = layer.el.querySelector('.bag-list');
      const msg = layer.el.querySelector('.screen-msg');
      let idx = 0;
      const entries = [...ids, null];
      function render() {
        list.innerHTML = entries.map((id, i) => `<div class="bag-item ${i === idx ? 'active' : ''}" data-i="${i}"><span class="cursor">▶</span><span>${id ? ITEMS[id].n : 'Cerrar'}</span><b>${id ? '×' + G.bag[id] : ''}</b></div>`).join('');
        list.querySelectorAll('.bag-item').forEach(it => it.onclick = () => { idx = +it.dataset.i; render(); pick(); });
        msg.textContent = entries[idx] ? ITEMS[entries[idx]].desc : 'Cerrar la mochila.';
        list.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
      }
      function pick() {
        Audio8.sfx(entries[idx] ? 'select' : 'back');
        remove(layer);
        resolve(entries[idx]);
      }
      layer.onButton = btn => {
        if (btn === 'up') idx = (idx - 1 + entries.length) % entries.length;
        else if (btn === 'down') idx = (idx + 1) % entries.length;
        else if (btn === 'a') return pick();
        else if (btn === 'b') { Audio8.sfx('back'); remove(layer); return resolve(null); }
        render();
      };
      push(layer);
      render();
    });
  }

  function dex() {
    return new Promise(resolve => {
      const layer = screen('dex', '<div class="dex-head"></div><div class="dex-list"></div>');
      const list = layer.el.querySelector('.dex-list');
      let idx = 0;
      function render() {
        const seen = Object.keys(G.dex.seen).length, caught = Object.keys(G.dex.caught).length;
        layer.el.querySelector('.dex-head').textContent = `CRIATURARIO · Vistas ${seen} · Capturadas ${caught}`;
        list.innerHTML = DEX_ORDER.map((id, i) => {
          const s = G.dex.seen[id], c = G.dex.caught[id];
          return `<div class="dex-item ${i === idx ? 'active' : ''}" data-i="${i}">
            <span class="dex-num">${String(i + 1).padStart(3, '0')}</span>
            ${s ? `<img src="${Art.creatureIcon(id)}" alt="">` : '<span class="dex-unknown">?</span>'}
            <span class="dex-name">${s ? SPECIES[id].n : '-----'}</span>
            ${c ? '<span class="dex-caught">●</span>' : ''}
          </div>`;
        }).join('');
        list.querySelectorAll('.dex-item').forEach(it => it.onclick = () => { idx = +it.dataset.i; render(); detail(); });
        list.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
      }
      async function detail() {
        const id = DEX_ORDER[idx];
        if (!G.dex.seen[id]) return Audio8.sfx('bump');
        Audio8.sfx('select');
        layer.locked = true;
        const sp = SPECIES[id];
        const d = screen('dex-detail', `
          <img class="sum-img" src="${Art.creatureIcon(id)}" alt="">
          <div>
            <div class="sum-name">Nº${String(idx + 1).padStart(3, '0')} ${sp.n}</div>
            <div>${typeBadges(sp.types)}</div>
            <p>${G.dex.caught[id] ? sp.dex : 'Captura esta criatura para saber más sobre ella.'}</p>
          </div>`);
        await new Promise(r => {
          d.onButton = () => { Audio8.sfx('back'); remove(d); r(); };
          d.el.addEventListener('click', () => d.onButton('b'));
          push(d);
        });
        layer.locked = false;
      }
      layer.onButton = btn => {
        if (layer.locked) return;
        if (btn === 'up') idx = (idx - 1 + DEX_ORDER.length) % DEX_ORDER.length;
        else if (btn === 'down') idx = (idx + 1) % DEX_ORDER.length;
        else if (btn === 'left') idx = Math.max(0, idx - 6);
        else if (btn === 'right') idx = Math.min(DEX_ORDER.length - 1, idx + 6);
        else if (btn === 'a') return detail();
        else if (btn === 'b') { Audio8.sfx('back'); remove(layer); return resolve(); }
        render();
      };
      push(layer);
      render();
    });
  }

  // Elegir una cantidad con arriba/abajo
  function quantity(max, price) {
    return new Promise(resolve => {
      const layer = { el: el('div', 'menu qty') };
      let n = 1;
      function render() { layer.el.innerHTML = `<div class="menu-item active">×${String(n).padStart(2, '0')} <span class="right">${price ? fmtMoney(price * n) : ''}</span></div>`; }
      layer.onButton = btn => {
        if (btn === 'up') n = n >= max ? 1 : n + 1;
        else if (btn === 'down') n = n <= 1 ? max : n - 1;
        else if (btn === 'right') n = Math.min(max, n + 10);
        else if (btn === 'left') n = Math.max(1, n - 10);
        else if (btn === 'a') { Audio8.sfx('select'); remove(layer); return resolve(n); }
        else if (btn === 'b') { Audio8.sfx('back'); remove(layer); return resolve(0); }
        render();
      };
      layer.el.addEventListener('click', () => layer.onButton('a'));
      push(layer);
      render();
    });
  }

  // Nombre del jugador
  function nameEntry(def) {
    return new Promise(resolve => {
      const layer = screen('name-entry', `
        <div class="sum-name">¿Cómo te llamas?</div>
        <input type="text" maxlength="10" value="${esc(def)}" autocomplete="off" spellcheck="false">
        <button class="ui-btn">Aceptar</button>`);
      const input = layer.el.querySelector('input');
      const ok = () => {
        const v = input.value.trim().slice(0, 10) || def;
        remove(layer);
        resolve(v);
      };
      layer.el.querySelector('button').onclick = ok;
      input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') ok(); });
      layer.onButton = btn => { if (btn === 'a') ok(); };
      push(layer);
      setTimeout(() => { input.focus(); input.select(); }, 50);
    });
  }

  // Indicador de dinero para tiendas y menús
  function moneyBox() {
    const layer = { el: el('div', 'money-box', `Dinero<br><b>${fmtMoney(G.money)}</b>`) };
    root.appendChild(layer.el);
    return { update: () => { layer.el.innerHTML = `Dinero<br><b>${fmtMoney(G.money)}</b>`; }, close: () => layer.el.remove() };
  }

  return { say, sayAll, ask, choose, party, summary, bag, dex, quantity, nameEntry, moneyBox, push, remove, press, busy, el, esc, hpBar, statusBadge, typeBadges };
})();

const fmtMoney = n => `${n.toLocaleString('es-ES')} ₵`;
