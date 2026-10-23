'use strict';

/* ══════════════════════════════════════
   ESTADO GLOBAL Y GUARDADO
══════════════════════════════════════ */
const SAVE_KEY = 'criaturas-brisaluz-v1';
let G = null;

function newGame(name) {
  return {
    name, money: 1500, party: [], box: [], bag: { pocion: 1 },
    flags: {}, dex: { seen: {}, caught: {} },
    map: 'casa', x: 4, y: 3, dir: 'down',
    lastHeal: { map: 'casa', x: 4, y: 4 },
    playTime: 0, steps: 0, mode: 'world',
  };
}

function save() {
  if (!G || G.mode === 'title') return;
  const p = World.player;
  const data = { ...G, x: p.x, y: p.y, dir: p.dir, mode: undefined };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* sin almacenamiento */ }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/* ══════════════════════════════════════
   ENTRADA: teclado, cruceta táctil y clics
══════════════════════════════════════ */
const Input = (() => {
  const held = { up: false, down: false, left: false, right: false, a: false, b: false };
  const order = [];   // direcciones pulsadas, la última manda
  const KEYS = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Space: 'a', Enter: 'a', KeyJ: 'a',
    KeyX: 'b', Backspace: 'b', KeyK: 'b', ShiftLeft: 'b', ShiftRight: 'b',
    Escape: 'start', KeyM: 'start', Tab: 'start',
  };
  const isDir = b => b === 'up' || b === 'down' || b === 'left' || b === 'right';

  function down(btn) {
    Audio8.unlock();
    if (isDir(btn)) {
      if (!held[btn]) order.push(btn);
    }
    held[btn] = true;
    dispatch(btn);
  }
  function up(btn) {
    held[btn] = false;
    const i = order.indexOf(btn);
    if (i >= 0) order.splice(i, 1);
  }
  function dir() {
    for (let i = order.length - 1; i >= 0; i--) if (held[order[i]]) return order[i];
    return null;
  }

  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const btn = KEYS[e.code];
    if (!btn) return;
    e.preventDefault();
    if (e.repeat && !isDir(btn)) return;
    if (e.repeat) { dispatch(btn); return; }
    down(btn);
  });
  window.addEventListener('keyup', e => { const btn = KEYS[e.code]; if (btn) up(btn); });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; order.length = 0; });

  // Botones en pantalla
  document.querySelectorAll('[data-btn]').forEach(el => {
    const btn = el.dataset.btn;
    const release = e => { e.preventDefault(); el.classList.remove('pressed'); up(btn); };
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* puntero sintético */ }
      el.classList.add('pressed');
      down(btn);
    });
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('contextmenu', e => e.preventDefault());
  });

  // Repetición en menús al mantener una dirección
  let repeatT = 0;
  function tick(dt) {
    const d = dir();
    if (!d || !UI.busy()) { repeatT = 0; return; }
    repeatT += dt;
    if (repeatT > 0.4) { repeatT = 0.32; dispatch(d); }
  }

  return { held, dir, tick };
})();

function dispatch(btn) {
  if (UI.busy()) return UI.press(btn);
  if (!G) return Title.press(btn);
  if (G.mode === 'world') {
    if (btn === 'a' || btn === 'start') World.press(btn);
  }
}

/* ══════════════════════════════════════
   PANTALLA Y ESCALADO
══════════════════════════════════════ */
const screenEl = document.getElementById('screen');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let pxScale = 1;

function resize() {
  const controls = document.getElementById('controls');
  const touch = matchMedia('(pointer: coarse)').matches;
  const portrait = innerHeight > innerWidth;
  document.body.classList.toggle('touch', touch);
  const reserved = touch && portrait ? controls.offsetHeight + 8 : 0;
  const availW = innerWidth - (touch && !portrait ? 0 : 16);
  const availH = innerHeight - reserved - 16;
  const scale = Math.max(1, Math.min(availW / 240, availH / 160));
  screenEl.style.width = `${Math.floor(240 * scale)}px`;
  screenEl.style.height = `${Math.floor(160 * scale)}px`;
  screenEl.style.setProperty('--u', scale.toFixed(3));
  pxScale = Math.min(8, Math.ceil(scale * (devicePixelRatio || 1)));
  canvas.width = 240 * pxScale;
  canvas.height = 160 * pxScale;
}
window.addEventListener('resize', resize);

/* ══════════════════════════════════════
   TÍTULO E INTRODUCCIÓN
══════════════════════════════════════ */
const Title = (() => {
  let active = true;
  let starting = false;

  function render(c, now) {
    const g = c.createLinearGradient(0, 0, 0, 160);
    g.addColorStop(0, '#3a5ab8');
    g.addColorStop(0.6, '#8ab8f0');
    g.addColorStop(1, '#c8e8a0');
    c.fillStyle = g;
    c.fillRect(0, 0, 240, 160);
    // Colinas
    c.fillStyle = '#6cc04a';
    c.beginPath(); c.ellipse(60, 170, 110, 46, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4fa83a';
    c.beginPath(); c.ellipse(200, 176, 120, 50, 0, 0, Math.PI * 2); c.fill();
    // Estrellas
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 20; i++) {
      const x = (Art.hash(i, 1) * 240) | 0, y = (Art.hash(i, 2) * 70) | 0;
      if ((now / 300 + i) % 6 < 4) c.fillRect(x, y, 1, 1);
    }
    // Criaturas
    const bob = Math.sin(now / 500) * 3;
    const legend = Art.creature('auroral', 'front');
    c.drawImage(legend, 120 - legend.width / 2, 74 - legend.height / 2 + bob);
    const a = Art.creature('brasito', 'front'), b = Art.creature('gotarin', 'front'), d = Art.creature('brotin', 'front');
    c.drawImage(a, 8, 150 - a.height + Math.sin(now / 350) * 1.5);
    c.drawImage(d, 84, 158 - d.height);
    c.drawImage(b, 164, 150 - b.height + Math.cos(now / 350) * 1.5);
    // Logo
    c.textAlign = 'center';
    c.font = '16px "Press Start 2P", monospace';
    c.lineWidth = 4;
    c.strokeStyle = '#2a1a4a';
    c.strokeText('CRIATURAS', 120, 26);
    c.fillStyle = '#f2d23a';
    c.fillText('CRIATURAS', 120, 26);
    c.font = '7px "Press Start 2P", monospace';
    c.lineWidth = 3;
    c.strokeText('de Brisaluz', 120, 38);
    c.fillStyle = '#ffffff';
    c.fillText('de Brisaluz', 120, 38);
    if (!starting && Math.floor(now / 600) % 2) {
      c.font = '7px "Press Start 2P", monospace';
      c.strokeText('PULSA A', 120, 112);
      c.fillText('PULSA A', 120, 112);
    }
  }

  async function press(btn) {
    if (!active || starting || btn !== 'a') return;
    starting = true;
    Audio8.sfx('select');
    const existing = loadSave();
    let choice = 1;
    if (existing) {
      choice = await UI.choose(['CONTINUAR', 'NUEVA PARTIDA'], { cls: 'title-menu', cancel: false });
      if (choice === 1) {
        const sure = await UI.ask('¿Empezar de cero? Se borrará la partida guardada.');
        if (sure !== 0) { starting = false; return; }
      }
    }
    if (choice === 0) {
      G = { ...newGame(existing.name), ...existing, mode: 'world' };
      active = false;
      World.load(G.map, G.x, G.y, G.dir);
      return;
    }
    await intro();
  }

  async function intro() {
    G = newGame('Alex');
    G.mode = 'intro';
    active = false;
    Audio8.play('town');
    await UI.sayAll([
      '¡Hola! ¡Bienvenido al mundo de las criaturas!',
      'Me llamo Alisa, aunque todos me llaman la profesora de las criaturas.',
      'Este mundo está habitado por unos seres fascinantes llamados criaturas.',
      'Algunas personas las tienen como mascotas. Otras las usan para combatir. Yo me dedico a estudiarlas.',
    ]);
    G.name = await UI.nameEntry('Alex');
    await UI.sayAll([
      `¡${G.name}! Tu propia aventura está a punto de comenzar.`,
      'Te espera un mundo lleno de criaturas, sueños y aventuras. ¡Vamos allá!',
    ]);
    G.mode = 'world';
    World.load('casa', 4, 3, 'down');
    save();
  }

  function renderIntro(c, now) {
    c.fillStyle = '#1a1a2a';
    c.fillRect(0, 0, 240, 160);
    const img = Art.character(LOOKS.prof, 'down', 0);
    c.drawImage(img, 120 - img.width * 2, 18, img.width * 4, img.height * 4);
    const cr = Art.creature('pipio', 'front');
    c.drawImage(cr, 176, 92 - cr.height + Math.sin(now / 300) * 2);
  }

  return { render, renderIntro, press };
})();

/* ══════════════════════════════════════
   BUCLE PRINCIPAL
══════════════════════════════════════ */
let lastFrame = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  Input.tick(dt);
  ctx.setTransform(pxScale, 0, 0, pxScale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (!G) Title.render(ctx, now);
  else if (G.mode === 'intro') Title.renderIntro(ctx, now);
  else if (G.mode === 'battle' && Battle.active()) Battle.render(ctx, now);
  else if (World.map) {
    if (G.mode === 'world') {
      World.update(dt);
      if (!document.hidden) G.playTime = (G.playTime || 0) + dt;
    }
    World.render(ctx, now);
  }
  requestAnimationFrame(frame);
}

document.getElementById('btn-mute').addEventListener('click', e => {
  e.currentTarget.textContent = Audio8.toggleMute() ? '🔇' : '🔊';
});
document.getElementById('btn-mute').textContent = Audio8.isMuted() ? '🔇' : '🔊';
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('beforeunload', save);

resize();
(document.fonts ? document.fonts.load('8px "Press Start 2P"').catch(() => {}) : Promise.resolve()).finally(() => {
  resize();
  requestAnimationFrame(t => { lastFrame = t; requestAnimationFrame(frame); });
});
