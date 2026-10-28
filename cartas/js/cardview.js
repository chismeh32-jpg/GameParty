'use strict';

/* ══════════════════════════════════════
   DIBUJO DE CARTAS (HTML + CSS)
══════════════════════════════════════ */
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const ICON_FILES = { curatotal: 'cura_total' };

function costIcons(cost) {
  return cost.map(t => `<span class="cost" style="--tc:${TYPES[t].color}">${TYPE_ICON[t]}</span>`).join('');
}

function artFor(c) {
  if (c.kind === 'criatura') {
    const full = c.variant === 'full' || c.variant === 'gold' || c.variant === 'rainbow';
    return `art/${full ? 'full' : 'criaturas'}/${c.ref}.webp`;
  }
  if (c.kind === 'entrenador') return `art/entrenadores/${c.ref}.webp`;
  if (c.kind === 'objeto') return ITEM_CARDS[c.ref].render ? `art/capsulas/${ITEM_CARDS[c.ref].render}.webp` : `../criaturas/icons/${ICON_FILES[c.ref] || c.ref}.png`;
  return null;
}

function cardFront(c) {
  const set = SETS[c.set];
  const r = RARITIES[c.rarity];
  const full = c.variant === 'full' || c.variant === 'gold' || c.variant === 'rainbow';
  const tc = c.type ? TYPES[c.type].color : c.kind === 'entrenador' ? '#c8a050' : '#7a9ab8';
  const foot = `<div class="foot"><span>${set.code} ${String(c.num).padStart(3, '0')}/${String(c.total).padStart(3, '0')}</span><span class="rsym r-${c.rarity}">${r.symbol}</span><span class="illus">Ilus. Claude Design</span></div>`;
  const art = artFor(c);
  let body = '';

  if (c.kind === 'criatura') {
    body = `
      <div class="top">
        <div class="stage">${esc(c.stage)}</div>
        <div class="name-row"><span class="name">${esc(c.name)}</span><span class="hp"><small>PS</small>${c.hp}</span><span class="type-icon" style="--tc:${tc}">${TYPE_ICON[c.type]}</span></div>
      </div>
      ${full ? '<div class="art-spacer"></div>' : `<div class="art"><img src="${art}" alt="" loading="lazy" draggable="false">${RARITIES[c.rarity].holo ? '<div class="holo art-holo"></div>' : ''}</div>`}
      ${full ? '' : `<div class="strip">${esc(SPECIES[c.ref].types.map(t => TYPES[t].name).join(' / '))} · Nº ${String(DEX_ORDER.indexOf(c.ref) + 1).padStart(3, '0')}</div>`}
      <div class="attacks">
        ${c.attacks.map(a => `
          <div class="atk">
            <span class="costs">${costIcons(a.cost)}</span>
            <span class="atk-name">${esc(a.name)}</span>
            <span class="atk-dmg">${a.dmg || ''}</span>
          </div>
          ${a.text ? `<div class="atk-text">${esc(a.text)}</div>` : ''}`).join('')}
      </div>
      <div class="bottom">
        <span>Debilidad ${c.weak ? TYPE_ICON[c.weak] + '×2' : '—'}</span>
        <span>Resistencia ${c.resist ? TYPE_ICON[c.resist] + '−20' : '—'}</span>
        <span>Retirada ${'✦'.repeat(c.retreat)}</span>
      </div>
      ${full ? '' : `<div class="flavor">${esc(c.dex)}</div>`}`;
  } else if (c.kind === 'entrenador' || c.kind === 'objeto') {
    body = `
      <div class="top">
        <div class="badge-kind">${c.kind === 'entrenador' ? 'ENTRENADOR' : 'OBJETO'}</div>
        <div class="name-row"><span class="name">${esc(c.name)}</span></div>
      </div>
      <div class="art ${c.kind}"><img src="${art}" alt="" loading="lazy" draggable="false" class="${art.endsWith('.png') ? 'pixel' : ''}"></div>
      <div class="text-box">${esc(c.text)}</div>
      <div class="rule">Solo puedes jugar ${c.kind === 'entrenador' ? '1 carta de Entrenador' : 'las cartas de Objeto que quieras'} durante tu turno.</div>`;
  } else {
    body = `
      <div class="energy-art" style="--tc:${tc}"><span>${TYPE_ICON[c.type]}</span></div>
      <div class="energy-name">${esc(c.name)}</div>
      <div class="rule">Energía básica</div>`;
  }

  return `
    <div class="face front kind-${c.kind} r-${c.rarity} v-${c.variant} theme-${set.theme}" style="--tc:${tc}">
      ${full ? `<img class="full-art" src="${art}" alt="" loading="lazy" draggable="false">` : ''}
      <div class="frame">${body}${foot}</div>
      ${RARITIES[c.rarity].holo && (full || c.kind !== 'criatura') ? '<div class="holo"></div>' : ''}
      <div class="glare"></div>
    </div>`;
}

const CARD_BACK = `
  <div class="face back">
    <div class="back-ring"><div class="back-core"></div></div>
    <div class="back-title">CRIATURAS<small>JUEGO DE CARTAS</small></div>
  </div>`;

// Devuelve el HTML de una carta. opts: { back: true (empieza boca abajo), size: 'sm'|'md'|'lg' }
function cardHTML(id, opts = {}) {
  const c = CARDS[id];
  return `
    <div class="card ${opts.back ? 'flipped' : ''} ${opts.cls || ''}" data-id="${id}" data-rarity="${c.rarity}">
      <div class="card-inner">${cardFront(c)}${CARD_BACK}</div>
    </div>`;
}

// Inclinación 3D y brillo que siguen al puntero
function attachTilt(el, strength = 1) {
  const set = (x, y) => {
    el.style.setProperty('--mx', x.toFixed(3));
    el.style.setProperty('--my', y.toFixed(3));
    el.style.setProperty('--tilt', strength);
  };
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    el.classList.add('tilting');
  });
  el.addEventListener('pointerleave', () => { set(0.5, 0.5); el.classList.remove('tilting'); });
  set(0.5, 0.5);
}
