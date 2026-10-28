'use strict';

/* ══════════════════════════════════════
   APERTURA DE SOBRES
══════════════════════════════════════ */
const Opening = (() => {
  const el = document.getElementById('opening');
  const stage = el.querySelector('.op-stage');
  const tray = el.querySelector('.op-tray');
  const info = el.querySelector('.op-info');
  const hint = el.querySelector('.op-hint');
  const btnAll = el.querySelector('[data-op="all"]');
  const btnExit = el.querySelector('[data-op="exit"]');
  let product = null, cards = [], idx = 0, phase = 'idle', packValue = 0, onClose = null;
  let collected = [], run = 0;     // run invalida los temporizadores al cerrar

  const RAYS = { H: '#8ac8ff', UR: '#c8a0ff', SR: '#ffd23f' };

  function open(prod, done) {
    product = prod;
    onClose = done;
    el.classList.remove('hidden');
    document.body.classList.add('no-scroll');
    nextPack();
  }

  function left() { return S.storage[product] || 0; }

  function nextPack() {
    if (left() <= 0) return close();
    S.storage[product]--;
    S.stats.packs++;
    const set = PRODUCTS[product].set;
    cards = openPack(set);
    collected = cards.map(() => false);
    run++;
    idx = 0;
    packValue = 0;
    phase = 'pack';
    tray.innerHTML = '';
    btnAll.classList.remove('hidden');
    btnExit.classList.add('hidden');
    renderInfo();
    const s = SETS[set];
    stage.innerHTML = `
      <div class="pack" style="--c1:${s.color};--c2:${s.color2}">
        <div class="pack-top"></div>
        <div class="pack-body">
          <div class="pack-brand">CRIATURAS<small>JUEGO DE CARTAS</small></div>
          <div class="pack-art"><img src="art/full/${s.mascot}.webp" alt=""></div>
          <div class="pack-set">${esc(s.name)}</div>
          <div class="pack-count">10 cartas</div>
        </div>
        <div class="pack-sheen"></div>
      </div>`;
    hint.textContent = 'Desliza sobre el sobre (o tócalo) para abrirlo';
    const pack = stage.querySelector('.pack');
    let startX = null;
    pack.addEventListener('pointerdown', e => { startX = e.clientX; pack.setPointerCapture?.(e.pointerId); });
    pack.addEventListener('pointermove', e => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      pack.style.setProperty('--rip', Math.min(1, Math.abs(dx) / 120));
      if (Math.abs(dx) > 110) { startX = null; rip(pack); }
    });
    pack.addEventListener('pointerup', () => { if (startX !== null) { startX = null; rip(pack); } });
    attachTilt(pack, 0.6);
    Game.save();
  }

  function rip(pack) {
    if (phase !== 'pack') return;
    phase = 'ripping';
    Sfx.play('rip');
    pack.classList.add('ripped');
    const my = run;
    setTimeout(() => {
      if (my !== run) return;
      stage.innerHTML = `<div class="stack">${cards.map((id, i) => cardHTML(id, { back: true, cls: 'stack-card' }).replace('class="card', `style="--i:${i}" class="card`)).join('')}</div>`;
      [...stage.querySelectorAll('.stack-card')].forEach(c => attachTilt(c, 0.7));
      phase = 'cards';
      hint.textContent = 'Toca la carta para darle la vuelta';
      layoutStack();
      stage.querySelector('.stack').addEventListener('click', advance);
      Sfx.play('slide');
    }, 650);
  }

  // El elemento i muestra cards[i]; la carta de arriba es la del índice actual
  function topCard() { return stage.querySelectorAll('.stack-card')[idx] || null; }

  function layoutStack() {
    const all = [...stage.querySelectorAll('.stack-card')];
    all.forEach((c, i) => {
      const depth = i - idx;                  // 0 = arriba
      c.style.zIndex = 100 - i;
      c.classList.toggle('gone', depth < 0);
      if (depth >= 0) c.style.transform = `translate(${depth * 3}px, ${depth * 3}px)`;
    });
    // Anticipación en la última carta (la rara)
    const top = topCard();
    if (top && idx === cards.length - 1) {
      const r = CARDS[cards[idx]].rarity;
      if (RARITIES[r].order >= 3) {
        top.classList.add('anticipate');
        top.style.setProperty('--glow', RAYS[r]);
        Sfx.play('anticipation');
        hint.textContent = '¡Esta brilla! Toca para descubrirla…';
      }
    }
  }

  function advance() {
    if (phase !== 'cards') return;
    const card = topCard();
    if (!card) return;
    if (card.classList.contains('flipped')) {
      card.classList.remove('flipped');
      reveal(card, idx);
      return;
    }
    // Segunda pulsación: la carta va a la bandeja
    card.classList.add('to-tray');
    Sfx.play('slide');
    addToTray(cards[idx]);
    idx++;
    setTimeout(() => card.classList.add('gone'), 260);
    if (idx >= cards.length) {
      phase = 'ending';
      const my = run;
      return setTimeout(() => { if (my === run) summary(); }, 350);
    }
    layoutStack();
  }

  // Añade la carta i del sobre a la colección (una sola vez)
  function collect(i) {
    if (collected[i]) return null;
    collected[i] = true;
    const id = cards[i];
    const isNew = !S.collection[id];
    S.collection[id] = (S.collection[id] || 0) + 1;
    S.stats.cards++;
    if (isNew) S.stats.unique = Object.keys(S.collection).length;
    if (RARITIES[CARDS[id].rarity].order >= 3) S.stats.hits = (S.stats.hits || 0) + 1;
    const price = cardPrice(id, S.day);
    packValue += price;
    return { isNew, price };
  }

  function reveal(card, i) {
    const got = collect(i);
    if (!got) return;
    const { isNew, price } = got;
    const c = CARDS[cards[i]];
    renderInfo();
    card.classList.remove('anticipate');
    const r = RARITIES[c.rarity];
    if (r.order >= 2) Sfx.play(c.rarity === 'R' ? 'R' : c.rarity); else Sfx.play('flip');
    if (r.order >= 3) {
      stage.insertAdjacentHTML('afterbegin', `<div class="rays" style="--ray:${RAYS[c.rarity]}"></div>`);
      if (r.order >= 4) confetti(c.rarity === 'SR' ? 70 : 40);
    }
    card.insertAdjacentHTML('beforeend', `<div class="reveal-tag ${isNew ? 'new' : ''}">${isNew ? '¡NUEVA!' : ''} ${r.name} · ${euro(price)}</div>`);
    hint.textContent = 'Toca otra vez para pasar a la siguiente';
  }

  function addToTray(id) {
    tray.insertAdjacentHTML('beforeend', `<div class="tray-card">${cardHTML(id)}</div>`);
  }

  function confetti(n) {
    const cols = ['#ffd23f', '#ff5ab8', '#5ab8ff', '#6af0a0', '#ffffff', '#c8a0ff'];
    const box = document.createElement('div');
    box.className = 'confetti';
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.style.setProperty('--x', `${(Math.random() - 0.5) * 120}vw`);
      p.style.setProperty('--y', `${-20 - Math.random() * 70}vh`);
      p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
      p.style.setProperty('--d', `${0.9 + Math.random() * 0.9}s`);
      p.style.background = cols[i % cols.length];
      box.appendChild(p);
    }
    el.appendChild(box);
    setTimeout(() => box.remove(), 2000);
  }

  function revealAll() {
    if (phase === 'pack') { rip(stage.querySelector('.pack')); }
    if (phase === 'ripping') { const my = run; return setTimeout(() => { if (my === run) revealAll(); }, 700); }
    if (phase !== 'cards') return;
    while (idx < cards.length) {
      const card = topCard();
      if (card.classList.contains('flipped')) { card.classList.remove('flipped'); reveal(card, idx); }
      addToTray(cards[idx]);
      card.classList.add('gone');
      idx++;
    }
    summary();
  }

  function summary() {
    phase = 'summary';
    stage.querySelectorAll('.rays').forEach(r => r.remove());
    const price = S.prices[product] ?? PRODUCTS[product].market;
    const profit = packValue - PRODUCTS[product].market;
    stage.innerHTML = `
      <div class="op-summary">
        <div class="sum-title">${profit >= 0 ? '¡Buen sobre!' : 'Resumen del sobre'}</div>
        <div class="sum-value">Valor de las cartas: <b>${euro(packValue)}</b> <small>(el sobre vale ${euro(PRODUCTS[product].market)})</small></div>
        <div class="sum-grid">${cards.map(id => `<div class="sum-card" data-id="${id}">${cardHTML(id)}</div>`).join('')}</div>
      </div>`;
    void price;
    stage.querySelectorAll('.sum-card').forEach(c => c.addEventListener('click', () => UI.cardDetail(c.dataset.id)));
    tray.innerHTML = '';
    hint.textContent = left() ? `Te quedan ${left()} sobres de este tipo` : 'No te quedan más sobres de este tipo';
    btnAll.classList.add('hidden');
    btnExit.classList.remove('hidden');
    btnExit.innerHTML = left() ? `Abrir otro (${left()})` : 'Terminar';
    S.stats.bestPack = Math.max(S.stats.bestPack || 0, packValue);
    Game.gainXp(3);
    Game.save();
  }

  function renderInfo() {
    info.innerHTML = `<b>${esc(SETS[PRODUCTS[product].set].name)}</b> · Valor: ${euro(packValue)} · Quedan ${left()}`;
  }

  function close() {
    run++;
    if (phase === 'pack') {
      // Sin abrir: el sobre vuelve al almacén
      S.storage[product] = (S.storage[product] || 0) + 1;
      S.stats.packs--;
    } else if (phase === 'ripping' || phase === 'cards' || phase === 'ending') {
      // Ya abierto: las cartas que faltaban van directas al álbum
      cards.forEach((_, i) => collect(i));
      S.stats.bestPack = Math.max(S.stats.bestPack || 0, packValue);
    }
    el.classList.add('hidden');
    document.body.classList.remove('no-scroll');
    stage.innerHTML = '';
    tray.innerHTML = '';
    phase = 'idle';
    Game.save();
    if (onClose) onClose();
  }

  btnAll.addEventListener('click', revealAll);
  btnExit.addEventListener('click', () => (left() && phase === 'summary' ? nextPack() : close()));
  el.querySelector('[data-op="close"]').addEventListener('click', close);

  return { open, get active() { return phase !== 'idle'; } };
})();
