'use strict';

/* ══════════════════════════════════════
   APERTURA DE CAJAS
══════════════════════════════════════ */
const Opening = (() => {
  const el = $('#opening');
  const stage = el.querySelector('.op-stage');
  const text = el.querySelector('.op-text');
  const actions = el.querySelector('.op-actions');
  const fx = el.querySelector('.op-fx');
  const title = el.querySelector('.op-title');
  const rays = el.querySelector('.op-rays');
  let res = null, phase = 'idle', taps = 0, boxId = null, run = 0;
  const SHAKES = 3;
  const BAT = '<svg viewBox="0 0 44 24"><path d="M22,8 Q18,2 14,6 Q8,0 0,6 Q6,8 6,14 Q10,10 14,14 Q18,10 22,16 Q26,10 30,14 Q34,10 38,14 Q38,8 44,6 Q36,0 30,6 Q26,2 22,8Z" fill="#12060f"/><circle cx="20" cy="9" r="1" fill="#ff3d9a"/><circle cx="24" cy="9" r="1" fill="#ff3d9a"/></svg>';
  const SPARK = c => `<svg viewBox="0 0 20 20"><path d="M10,0 L12,8 L20,10 L12,12 L10,20 L8,12 L0,10 L8,8Z" fill="${c}"/></svg>`;

  // Rareza más alta del resultado (para el brillo previo)
  function topRarity(r) {
    const main = r.items[0];
    if (main.kind === 'doll') return DOLLS[main.id].rarity;
    const rs = r.items.map(i => (i.kind === 'pet' ? PET_BY_ID[i.id] : ACC_BY_ID[i.id]).rarity);
    return rs.sort((a, b) => RARITY[b].order - RARITY[a].order)[0];
  }

  function start(id, source) {
    const r = Game.open(id, source);
    if (!r) { Sfx.play('error'); UI.toast('No tienes calaveras suficientes 💀', 'bad'); return; }
    res = r; boxId = id; taps = 0; phase = 'box'; run++;
    UI.renderHeader();
    const box = BOX_BY_ID[id];
    el.classList.remove('hidden', 'reveal');
    document.body.classList.add('locked');
    title.textContent = box.name;
    fx.innerHTML = '';
    stage.innerHTML = `<div class="big-box" role="button" tabindex="0" aria-label="Agitar la caja">${UI.mboxHTML(box)}</div>`;
    text.innerHTML = `<div class="tap-hint">Toca la caja para agitarla</div><div class="shake-dots">${'<i></i>'.repeat(SHAKES)}</div>`;
    actions.innerHTML = '<button class="btn ghost small" data-op="skip">Abrir ya</button>';
    const bb = stage.querySelector('.big-box');
    bb.addEventListener('click', shake);
    bb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shake(); } });
    bb.focus({ preventScroll: true });
  }

  function shake() {
    if (phase !== 'box') return;
    const b = stage.querySelector('.big-box');
    taps++;
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
    Sfx.play('shake');
    text.querySelectorAll('.shake-dots i').forEach((d, i) => d.classList.toggle('on', i < taps));
    if (taps >= SHAKES) openLid();
  }

  function openLid(fast = false) {
    if (phase !== 'box') return;
    phase = 'opening';
    const my = run;
    const b = stage.querySelector('.big-box');
    const r = topRarity(res);
    const order = RARITY[r].order;
    text.innerHTML = `<div class="tap-hint">${order >= 2 ? '¡Algo brilla dentro…!' : '¿Qué habrá dentro…?'}</div>`;
    actions.innerHTML = '';
    if (order >= 1) { b.style.setProperty('--glow', RARITY[r].color); b.classList.add('glow'); }
    if (order >= 2) Sfx.play('anticipation');
    const wait = fast ? 150 : order >= 2 ? 1100 : 450;
    setTimeout(() => {
      if (my !== run) return;
      Sfx.play('creak');
      b.classList.add('open');
      setTimeout(() => { if (my === run) { Sfx.play('whoosh'); reveal(); } }, 600);
    }, wait);
  }

  function reveal() {
    phase = 'reveal';
    const r = res;
    const main = r.items[0];
    const rar = topRarity(r);
    el.classList.add('reveal');
    rays.style.setProperty('--ray', RARITY[rar].color);
    let h = '', name = '', sub = '', tags = '';
    if (main.kind === 'doll') {
      const d = DOLLS[main.id];
      h += `<div class="reveal-item main">${UI.pkgHTML(main.id, { badges: false, shiny: main.shiny })}</div>`;
      name = esc(d.name);
      sub = `${esc(d.lineName)}${d.edition ? ` · ${esc(d.edition)}` : ''} · ${d.year} · ${GENS[d.gen].short}`;
      tags = `<span class="rv-tag r-${d.rarity}">${RARITY[d.rarity].name}</span>${main.shiny ? '<span class="rv-tag shiny">✨ Brillante</span>' : ''}${main.isNew ? '<span class="rv-tag new">¡NUEVA!</span>' : `<span class="rv-tag dup">Repetida · tienes ×${main.n}</span>`}`;
      for (const x of r.items.slice(1)) {
        h += `<div class="reveal-item extra"><span class="extra-tag">¡De regalo!</span>${UI.itemCard(x.kind, x.id, { act: false })}</div>`;
        const xi = x.kind === 'pet' ? PET_BY_ID[x.id] : ACC_BY_ID[x.id];
        tags += `<span class="rv-tag ${x.isNew ? 'new' : 'dup'}">+ ${esc(xi.name)}${x.isNew ? ' (nuevo)' : ''}</span>`;
      }
    } else {
      const big = r.items.length === 1;
      h += r.items.map((x, i) => `<div class="reveal-item ${big ? 'main' : 'acc2'}" style="animation-delay:${i * 0.25}s">${UI.itemCard(x.kind, x.id, { act: false })}</div>`).join('');
      const xs = r.items.map(x => (x.kind === 'pet' ? PET_BY_ID[x.id] : ACC_BY_ID[x.id]));
      name = xs.map(x => esc(x.name)).join(' + ');
      sub = xs.map(x => (x.owner ? `de ${esc(shortName(x.owner))}` : 'de Monster High')).join(' · ');
      tags = r.items.map((x, i) => `<span class="rv-tag r-${xs[i].rarity}">${RARITY[xs[i].rarity].name}</span>${x.isNew ? '<span class="rv-tag new">¡NUEVO!</span>' : `<span class="rv-tag dup">Repe ×${x.n}</span>`}`).join('');
    }
    stage.innerHTML = h;
    text.innerHTML = `<div class="rv-name">${name}</div><div class="rv-sub">${sub}</div><div class="rv-tags">${tags}</div>`;

    // Botones
    const box = BOX_BY_ID[boxId];
    let again = '';
    if (S.free.n > 0 && boxId === 'misteriosa') again = `<button class="btn primary" data-op="again" data-src="free">Otra gratis (${S.free.n})</button>`;
    else if (S.inv[boxId]) again = `<button class="btn primary" data-op="again" data-src="inv">Abrir otra (×${S.inv[boxId]})</button>`;
    else if (Game.canPay(box.price)) again = `<button class="btn primary" data-op="again" data-src="buy">Otra · ${S.settings.freeMode ? 'gratis' : coinSm(box.price)}</button>`;
    actions.innerHTML = `${main.kind === 'doll' ? '<button class="btn" data-op="detail">Ver ficha</button>' : ''}${again}<button class="btn ghost" data-op="close">Cerrar</button>`;

    // Sonido y efectos según rareza
    const order = RARITY[rar].order;
    Sfx.play(rar);
    if (main.shiny) setTimeout(() => Sfx.play('shiny'), 500);
    sparkles(6 + order * 6, RARITY[rar].color);
    if (order >= 2) { bats(order >= 3 ? 14 : 8); setTimeout(() => Sfx.play('bats'), 200); }
    if (order >= 3) { flash(); confetti(70); }
    if (main.shiny) sparkles(18, '#ffffff');
  }

  /* ── Efectos ── */
  function bats(n) {
    for (let i = 0; i < n; i++) {
      const b = document.createElement('div');
      b.className = 'fx-bat';
      b.innerHTML = BAT;
      const left = Math.random() < 0.5;
      b.style.left = '50%'; b.style.top = '45%';
      b.style.setProperty('--x0', `${(Math.random() - 0.5) * 60}px`);
      b.style.setProperty('--y0', `${(Math.random() - 0.5) * 60}px`);
      b.style.setProperty('--x1', `${(left ? -1 : 1) * (40 + Math.random() * 30)}vw`);
      b.style.setProperty('--y1', `${-20 - Math.random() * 40}vh`);
      b.style.setProperty('--d', `${1.4 + Math.random() * 1}s`);
      b.style.animationDelay = `${Math.random() * 0.4}s`;
      fx.appendChild(b);
      setTimeout(() => b.remove(), 3200);
    }
  }
  function confetti(n) {
    const cols = ['#ff3d9a', '#ffc83a', '#5ae87a', '#5ab8ff', '#ffffff', '#c86aff', '#14d2a0'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.className = 'fx-conf';
      c.style.background = cols[i % cols.length];
      c.style.setProperty('--x', `${(Math.random() - 0.5) * 110}vw`);
      c.style.setProperty('--y', `${(Math.random() - 0.3) * 90}vh`);
      c.style.setProperty('--r', `${Math.random() * 900 - 450}deg`);
      c.style.setProperty('--d', `${1.2 + Math.random() * 1.2}s`);
      fx.appendChild(c);
      setTimeout(() => c.remove(), 2600);
    }
  }
  function sparkles(n, color) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'fx-spark';
      s.innerHTML = SPARK(color);
      s.style.left = `${50 + (Math.random() - 0.5) * 70}%`;
      s.style.top = `${42 + (Math.random() - 0.5) * 50}%`;
      s.style.animationDelay = `${Math.random() * 0.9}s`;
      fx.appendChild(s);
      setTimeout(() => s.remove(), 2200);
    }
  }
  function flash() {
    const f = document.createElement('div');
    f.className = 'fx-flash';
    fx.appendChild(f);
    setTimeout(() => f.remove(), 700);
  }

  function close() {
    run++;
    if (phase === 'box' || phase === 'opening') {
      // Si se cierra antes de verla, la muñeca ya está guardada: se avisa
      UI.toast('La caja se ha abierto: lo tienes en tu colección 💀');
    }
    phase = 'idle';
    el.classList.add('hidden');
    el.classList.remove('reveal');
    document.body.classList.remove('locked');
    stage.innerHTML = ''; fx.innerHTML = '';
    UI.render();
    UI.rewardsToasts(res?.rewards);
    res = null;
  }

  el.addEventListener('click', e => {
    const b = e.target.closest('[data-op]');
    if (!b) return;
    Sfx.play('tap');
    const op = b.dataset.op;
    if (op === 'close') close();
    else if (op === 'skip') { taps = SHAKES; openLid(true); }
    else if (op === 'detail') { const id = res.items[0].id; close(); UI.openDoll(id, 'auto'); }
    else if (op === 'again') { const rw = res.rewards; res = null; UI.rewardsToasts(rw); start(boxId, b.dataset.src); }
  });

  return { start, get active() { return phase !== 'idle'; } };
})();
