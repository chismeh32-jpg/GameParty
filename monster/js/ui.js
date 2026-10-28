'use strict';

/* ══════════════════════════════════════
   INTERFAZ · pantallas, fichas, avisos
══════════════════════════════════════ */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COIN = '<svg class="coin" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#ffc83a" stroke="#b8860b" stroke-width="2.5"/><circle cx="20" cy="20" r="13" fill="none" stroke="#e8a810" stroke-width="1.5"/><path d="M20,10 c-6,0 -8.5,4 -8.5,7.6 c0,2.6 1.4,4.2 3.3,4.8 v3.4 h10.4 v-3.4 c1.9,-.6 3.3,-2.2 3.3,-4.8 c0,-3.6 -2.5,-7.6 -8.5,-7.6Z" fill="#8a5a00"/><circle cx="16.8" cy="17.5" r="2" fill="#ffc83a"/><circle cx="23.2" cy="17.5" r="2" fill="#ffc83a"/></svg>';
const coinSm = n => `${COIN.replace('class="coin"', 'class="coin-sm"')} ${n}`;
const fmt = n => n.toLocaleString('es-ES');
const GEN_ORDER = ['G1', 'G2', 'G3', 'COL', 'SK'];
const ICON_ACH = { first: '🎁', open25: '📦', open100: '⚰️', open300: '☕', dolls10: '💀', dolls50: '🎓', dolls100: '🏫', dollsAll: '👑', line1: '✅', line5: '🗄️', legend: '🌟', skullector: '🔮', shiny: '✨', core5: '🖐️', drac10: '🦇', pets5: '🐾', petsAll: '🐉', acc20: '👠', accAll: '👗', gift: '💝', streak7: '📅', photo: '📷' };

const UI = (() => {
  let tab = 'cajas';
  let colTab = 'dolls';
  const filt = { gen: 'all', char: 'all', show: 'all' };
  let freeTimer = null;

  /* ── Avisos ── */
  function toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.innerHTML = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3000);
  }
  function rewardsToasts(list) {
    let d = 0;
    for (const r of list || []) {
      setTimeout(() => {
        if (r.type === 'line') { toast(`🎉 ¡Colección completa: ${esc(LINE_BY_ID[r.id].name)}! ${coinSm('+' + r.coins)} y una caja`, 'gold'); Sfx.play('achievement'); }
        else if (r.type === 'char') { toast(`💖 ¡Tienes todas las ${esc(CHARS[r.id].name)}! ${coinSm('+' + r.coins)}`, 'gold'); Sfx.play('achievement'); }
        else { const a = ACHIEVEMENTS.find(x => x.id === r.id); toast(`🏆 Logro: ${esc(a.name)} ${coinSm('+' + r.coins)}`, 'pink'); Sfx.play('achievement'); }
        renderHeader();
      }, d);
      d += 900;
    }
  }

  /* ── Modal ── */
  function modal(title, body, buttons = [{ label: 'Vale', cls: 'primary' }]) {
    return new Promise(res => {
      const m = $('#modal');
      m.querySelector('.m-title').innerHTML = title;
      m.querySelector('.m-body').innerHTML = body;
      const acts = m.querySelector('.m-actions');
      acts.innerHTML = buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${b.label}</button>`).join('');
      m.classList.remove('hidden');
      acts.onclick = e => {
        const b = e.target.closest('[data-i]');
        if (!b) return;
        Sfx.play('tap');
        m.classList.add('hidden');
        res(+b.dataset.i);
      };
    });
  }
  async function ask(title, label, value = '', placeholder = '') {
    const i = await modal(title, `<p>${label}</p><input class="input" id="ask-in" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off" style="margin-top:10px">`, [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Aceptar', cls: 'primary' }]);
    return i === 1 ? ($('#ask-in')?.value ?? '') : null;
  }

  /* ── Hoja de detalle ── */
  let sheetKey = null;
  function sheet(html, onClick, key = null) {
    const w = $('#sheet');
    const reset = key === null || key !== sheetKey || w.classList.contains('hidden');
    sheetKey = key;
    w.querySelector('.sheet-body').innerHTML = html;
    w.classList.remove('hidden');
    if (reset) w.querySelector('.sheet').scrollTop = 0;
    document.body.classList.add('locked');
    w.querySelector('.sheet-body').onclick = onClick || null;
  }
  function closeSheet() {
    $('#sheet').classList.add('hidden');
    document.body.classList.remove('locked');
  }
  $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet' || e.target.closest('.sheet-x')) { Sfx.play('tap'); closeSheet(); render(); } });

  /* ── Piezas ── */
  function mboxHTML(box) {
    return `<div class="mbox" style="--c1:${box.color};--c2:${box.color2}"><div class="lid"></div><div class="body"></div><div class="ribbon"></div>
      <div class="bow"><svg viewBox="0 0 100 60"><path d="M50,30 L8,6 Q0,30 8,54Z M50,30 L92,6 Q100,30 92,54Z" fill="${box.color2}" stroke="${box.color}" stroke-width="3"/><circle cx="50" cy="30" r="10" fill="${box.color}"/></svg></div>
      <div class="emb">${Art.skullBow('#fff', box.color2, '100%')}</div><div class="q">?</div></div>`;
  }
  // Foto real: la tuya si has puesto una; si no, la de la wiki
  const photoFor = id => Photos.get(id) || PHOTO_URLS[id] || null;
  const usePhotos = () => S.settings.realPhotos !== false;
  // Si la foto no carga, se cambia por el dibujo
  const fallback = id => `onerror="this.onerror=null;this.src='${Art.dollURL(id)}';this.classList.add('fb')"`;
  const lineLabel = d => esc((d.edition || d.lineName).replace('Skullector: ', '').replace('Skulltimate Secrets: ', 'SS: '));
  function pkgHTML(id, { owned = !!S.dolls[id], badges = true, shiny = null, art = false } = {}) {
    const d = DOLLS[id];
    const v = S.dolls[id];
    const hide = !owned && S.settings.hideMissing;
    const isShiny = shiny ?? (owned && v?.shiny > 0);
    let b = '';
    if (owned && badges && v) {
      if (v.n > 1) b += `<span class="pkg-badge">×${v.n}</span>`;
      if (v.shiny) b += '<span class="pkg-badge">✨</span>';
      if (S.fav[id]) b += '<span class="pkg-badge fav">❤</span>';
    }
    const ph = !art && usePhotos() && photoFor(id);
    if (ph) {
      return `<div class="pcard g-${d.gen} r-${d.rarity} ${owned ? '' : 'missing'} ${isShiny ? 'shiny' : ''}">
        <div class="pc-img"><img referrerpolicy="no-referrer" loading="lazy" src="${esc(ph)}" alt="${esc(d.name)}" draggable="false" ${fallback(id)}></div>
        <div class="pc-foot"><b>${hide ? '???' : esc(d.short)}</b><small>${lineLabel(d)} · ${d.year}</small></div>
        <span class="pkg-rar" title="${RARITY[d.rarity].name}"></span>
        <div class="pkg-badges">${b}</div>
        ${owned ? '' : '<div class="lock">?</div>'}
      </div>`;
    }
    return `<div class="pkg g-${d.gen} r-${d.rarity} ${owned ? '' : 'missing'} ${isShiny ? 'shiny' : ''} ${hide ? 'hide-name' : ''}">
      <div class="pkg-shape"></div>
      <div class="pkg-in"><div class="pkg-brand">${d.gen === 'SK' ? 'Skullector' : 'Monster High'}</div>
        <div class="pkg-win"><img src="${Art.dollURL(id)}" alt="${esc(d.name)}" draggable="false"></div>
        <div class="pkg-name">${hide ? '???' : esc(d.short)}</div>
        <div class="pkg-line">${lineLabel(d)} · ${d.year}</div>
      </div>
      <span class="pkg-rar" title="${RARITY[d.rarity].name}"></span>
      <div class="pkg-badges">${b}</div>
      ${owned ? '' : '<div class="lock">?</div>'}
    </div>`;
  }
  function itemCard(kind, id, { act = true } = {}) {
    const x = kind === 'pet' ? PET_BY_ID[id] : ACC_BY_ID[id];
    const n = kind === 'pet' ? S.pets[id] : S.accs[id];
    const url = kind === 'pet' ? Art.petURL(id) : Art.accURL(id);
    return `<button class="item-card r-${x.rarity} ${n ? '' : 'missing'}" ${act ? `data-act="${kind}" data-id="${id}"` : ''}>
      ${n > 1 ? `<span class="cnt">×${n}</span>` : ''}<img src="${url}" alt="" draggable="false"><div class="nm">${esc(x.name)}</div>
      <div class="own">${x.owner ? esc(shortName(x.owner)) : 'Monster High'}</div></button>`;
  }
  const rarTag = r => `<span class="tag r" style="background:${RARITY[r].color}">${RARITY[r].name}</span>`;

  /* ── Cabecera ── */
  function renderHeader() {
    const c = $('#coins');
    c.classList.toggle('free', S.settings.freeMode);
    c.innerHTML = `${COIN}<span>${S.settings.freeMode ? '∞' : fmt(S.coins)}</span>`;
    const who = $('#who');
    who.innerHTML = S.avatar && S.dolls[S.avatar] ? `<img src="${Art.dollURL(S.avatar)}" alt="">` : esc((S.name || '?').slice(0, 1).toUpperCase());
    document.querySelectorAll('#tabs button').forEach(b => {
      b.classList.toggle('on', b.dataset.tab === tab);
      b.querySelector('.dot')?.remove();
    });
    if (S.free.n > 0 || Game.dailyPending() || Object.keys(S.inv).length) $('#tabs [data-tab="cajas"]').insertAdjacentHTML('beforeend', '<span class="dot"></span>');
  }

  function render() {
    renderHeader();
    clearInterval(freeTimer);
    const v = $('#view');
    if (tab === 'cajas') v.innerHTML = viewCajas();
    else if (tab === 'coleccion') v.innerHTML = viewColeccion();
    else if (tab === 'estanteria') v.innerHTML = viewEstanteria();
    else if (tab === 'logros') v.innerHTML = viewLogros();
    else v.innerHTML = viewPerfil();
    if (tab === 'cajas') freeTimer = setInterval(updateFreeTimer, 1000);
  }
  function go(t) { tab = t; window.scrollTo(0, 0); render(); }

  /* ══ CAJAS ══ */
  function viewCajas() {
    Game.tickFree();
    const fb = BOX_BY_ID.misteriosa;
    const dots = Array.from({ length: FREE_MAX }, (_, i) => `<i class="${i < S.free.n ? 'on' : ''}"></i>`).join('');
    let h = `<div class="free-card"><div class="mini-box">${mboxHTML(fb)}</div><div style="flex:1;min-width:0">
      <h3>Caja gratis</h3><p id="free-txt">${freeText()}</p><div class="free-dots">${dots}</div>
      <button class="btn primary" data-act="open" data-box="misteriosa" data-src="free" ${S.free.n ? '' : 'disabled'}>Abrir caja gratis</button></div></div>`;
    if (Game.dailyPending()) {
      const st = S.daily.last === dayNumber() - 1 ? S.daily.streak + 1 : 1;
      h += `<div class="daily"><span class="ico">📅</span><div>Recompensa diaria<br><small class="muted">Racha: ${st} ${st === 1 ? 'día' : 'días'}</small></div><button class="btn gold small" data-act="daily">Recoger</button></div>`;
    }
    const inv = Object.entries(S.inv).filter(([, n]) => n > 0);
    if (inv.length) {
      h += `<h3 class="sub">🎀 Tus cajas guardadas</h3><div class="inv-row">${inv.map(([id, n]) => `<button class="inv-item" data-act="open" data-box="${id}" data-src="inv"><div class="mini-box">${mboxHTML(BOX_BY_ID[id])}</div>${esc(BOX_BY_ID[id].name)}<div class="n">×${n}</div></button>`).join('')}</div>`;
    }
    h += `<h2 class="sec">Tienda de cajas</h2><div class="shop">`;
    for (const b of BOXES) {
      let desc = b.desc;
      if (b.id === 'dia') desc = `Hoy: <b>${dailyLines().map(l => esc(l.name)).join('</b> y <b>')}</b>`;
      const rates = b.rates ? Object.entries(b.rates).filter(([, w]) => w > 0).map(([r, w]) => `<span class="rate ${r}">${RARITY[r]?.name || r} ${w}%</span>`).join('') : '';
      const can = Game.canPay(b.price);
      h += `<div class="box-card"><div class="mini-box">${mboxHTML(b)}</div><div style="flex:1;min-width:0"><h4>${esc(b.name)}</h4><p>${desc}</p>${rates ? `<div class="rates">${rates}</div>` : ''}
        <div class="btn-row"><button class="btn ${can ? 'primary' : ''} small" data-act="open" data-box="${b.id}" data-src="buy" ${can ? '' : 'disabled'}>Abrir · ${S.settings.freeMode ? 'gratis' : coinSm(b.price)}</button>
        <button class="btn ghost small" data-act="gift-box" data-box="${b.id}" title="Regalar esta caja">🎁</button></div></div></div>`;
    }
    h += '</div>';
    h += `<p class="tiny" style="margin-top:14px">Cada caja de muñeca puede traer de regalo su mascota o un accesorio. Si llevas ${PITY_AT - 1} cajas sin suerte, la siguiente trae una épica o legendaria seguro. Las muñecas brillantes ✨ salen en un ${Math.round(SHINY_CHANCE * 100)}% de las cajas.</p>`;
    return h;
  }
  function freeText() {
    if (S.free.n >= FREE_MAX) return `¡Tienes ${S.free.n} cajas gratis! Ábrelas para que se vuelvan a cargar.`;
    const ms = Game.freeNext();
    const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60;
    return `${S.free.n ? `Tienes ${S.free.n}. ` : ''}Siguiente caja gratis en <b>${m}:${String(s).padStart(2, '0')}</b>`;
  }
  function updateFreeTimer() {
    const before = S.free.n;
    Game.tickFree();
    if (S.free.n !== before) { render(); return; }
    const t = $('#free-txt');
    if (t) t.innerHTML = freeText();
  }

  /* ══ COLECCIÓN ══ */
  function viewColeccion() {
    const nd = ownedDolls(S), np = Object.keys(S.pets).length, na = Object.keys(S.accs).length;
    let h = `<div class="seg">
      <button data-act="coltab" data-v="dolls" class="${colTab === 'dolls' ? 'on' : ''}">Muñecas<small>${nd}/${DOLL_LIST.length}</small></button>
      <button data-act="coltab" data-v="pets" class="${colTab === 'pets' ? 'on' : ''}">Mascotas<small>${np}/${PETS.length}</small></button>
      <button data-act="coltab" data-v="accs" class="${colTab === 'accs' ? 'on' : ''}">Accesorios<small>${na}/${ACCESSORIES.length}</small></button></div>`;
    if (colTab === 'pets') return h + `<div class="col-head"><div class="progress"><i style="width:${np / PETS.length * 100}%"></i></div><b>${np}/${PETS.length}</b></div><div class="mini-grid">${PETS.map(p => itemCard('pet', p.id)).join('')}</div>`;
    if (colTab === 'accs') return h + `<div class="col-head"><div class="progress"><i style="width:${na / ACCESSORIES.length * 100}%"></i></div><b>${na}/${ACCESSORIES.length}</b></div><div class="mini-grid">${ACCESSORIES.map(a => itemCard('acc', a.id)).join('')}</div>`;

    const chars = [...new Set(DOLL_LIST.flatMap(d => d.chars))].sort((a, b) => CHARS[a].name.localeCompare(CHARS[b].name, 'es'));
    h += `<div class="col-head"><div class="progress"><i style="width:${nd / DOLL_LIST.length * 100}%"></i></div><b>${nd}/${DOLL_LIST.length} · ${Math.floor(nd / DOLL_LIST.length * 100)}%</b></div>`;
    h += `<div class="chips" style="margin-bottom:8px">${[['all', 'Todas'], ['G1', 'G1'], ['G2', 'G2'], ['G3', 'G3'], ['COL', 'Coleccionista'], ['SK', 'Skullector']].map(([v, l]) => `<button class="chip ${filt.gen === v ? 'on' : ''}" data-act="fgen" data-v="${v}">${l}</button>`).join('')}</div>`;
    h += `<div class="filters"><select class="sel" data-act="fchar"><option value="all">Todos los personajes</option>${chars.map(c => `<option value="${c}" ${filt.char === c ? 'selected' : ''}>${esc(CHARS[c].name)}</option>`).join('')}</select>
      <select class="sel" data-act="fshow">${[['all', 'Todas'], ['own', 'Las que tengo'], ['miss', 'Me faltan'], ['dup', 'Repetidas'], ['shiny', 'Brillantes ✨'], ['fav', 'Favoritas ❤']].map(([v, l]) => `<option value="${v}" ${filt.show === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
    let any = false;
    for (const l of [...LINES].sort((a, b) => GEN_ORDER.indexOf(a.gen) - GEN_ORDER.indexOf(b.gen) || a.year - b.year)) {
      if (filt.gen !== 'all' && l.gen !== filt.gen) continue;
      let ds = l.dolls.map(id => DOLLS[id]);
      if (filt.char !== 'all') ds = ds.filter(d => d.chars.includes(filt.char));
      ds = ds.filter(d => {
        const v = S.dolls[d.id];
        switch (filt.show) {
          case 'own': return !!v;
          case 'miss': return !v;
          case 'dup': return v && v.n > 1;
          case 'shiny': return v && v.shiny > 0;
          case 'fav': return !!S.fav[d.id];
          default: return true;
        }
      });
      if (!ds.length) continue;
      any = true;
      const have = l.dolls.filter(id => S.dolls[id]).length;
      h += `<div class="line-group"><div class="line-head"><h4>${esc(l.name)}</h4><span class="yr">${l.year}</span><span class="gen" style="background:${GENS[l.gen].color}">${GENS[l.gen].short}</span>
        <span class="cnt ${have === l.dolls.length ? 'done' : ''}">${have === l.dolls.length ? '✓ ' : ''}${have}/${l.dolls.length}</span></div>
        <div class="grid">${ds.map(d => `<button data-act="doll" data-id="${d.id}">${pkgHTML(d.id)}</button>`).join('')}</div></div>`;
    }
    if (!any) h += '<div class="empty">No hay muñecas con estos filtros.</div>';
    return h;
  }

  /* ── Ficha de muñeca ── */
  // view: 'photo' | 'box' | 'out'; 'auto' elige la foto si la hay; sin valor mantiene la vista actual
  let dView = 'box';
  function openDoll(id, view) {
    const d = DOLLS[id], ch = CHARS[d.char], line = LINE_BY_ID[d.line], v = S.dolls[id];
    const ph = photoFor(id);
    if (view === 'auto') dView = ph && usePhotos() ? 'photo' : 'box';
    else if (view) dView = view;
    if (dView === 'photo' && !ph) dView = 'box';
    let art;
    if (dView === 'out') art = `<div class="free-doll ${v ? '' : 'missing'}"><img src="${Art.dollURL(id)}" alt=""></div>`;
    else if (dView === 'photo') art = `${pkgHTML(id, { badges: false })}<p class="tiny credit">${Photos.has(id) ? 'Tu foto' : `Foto: ${esc(PHOTO_SOURCE)}`}</p>`;
    else art = pkgHTML(id, { badges: false, art: true });
    const pets = PETS.filter(p => p.owner === d.char), accs = ACCESSORIES.filter(a => a.owner === d.char);
    const others = DOLL_LIST.filter(x => x.char === d.char);
    const haveOthers = others.filter(x => S.dolls[x.id]).length;
    let h = `<div class="detail"><div class="d-art">${art}
      <div class="view-tabs">${ph ? `<button data-act="dview" data-v="photo" class="${dView === 'photo' ? 'on' : ''}">📷 Foto</button>` : ''}${ph && ch.auto ? '' : `<button data-act="dview" data-v="box" class="${dView === 'box' ? 'on' : ''}">🎨 En su caja</button><button data-act="dview" data-v="out" class="${dView === 'out' ? 'on' : ''}">🎨 Sin caja</button>`}</div></div>
      <div class="d-info"><h2>${esc(d.name)}</h2><div class="kind">${d.chars.length > 1 ? `Set de ${d.chars.length} muñecas` : esc(ch.kind)}</div>
      <div class="tags">${rarTag(d.rarity)}<span class="tag" style="background:${GENS[d.gen].color}">${GENS[d.gen].name}</span><span class="tag">${esc(line.name)}</span></div>
      <p class="bio">${d.chars.map(c => esc(CHARS[c].bio)).join('<br>')}</p><p class="muted" style="font-weight:700;margin-bottom:10px">${d.edition ? `${esc(d.edition)} · ` : ''}${esc(line.desc)}${line.desc.includes(String(d.year)) ? '' : ` (${d.year})`}</p>
      <div class="have">${v ? `Tienes ×${v.n}${v.shiny ? ` · ✨ brillantes ×${v.shiny}` : ''}` : '<span class="muted">Todavía no la tienes</span>'} · <span class="muted">${haveOthers}/${others.length} versiones de ${esc(shortName(d.char))}</span></div>`;
    if (pets.length) h += `<div class="d-sub">Su mascota</div><div class="extras">${pets.map(p => itemCard('pet', p.id)).join('')}</div>`;
    if (accs.length) h += `<div class="d-sub">Sus accesorios</div><div class="extras">${accs.map(a => itemCard('acc', a.id)).join('')}</div>`;
    h += '<div class="d-actions">';
    if (v) {
      h += `<button class="btn ${S.fav[id] ? 'primary' : ''}" data-act="fav" data-id="${id}">${S.fav[id] ? '❤ Favorita' : '🤍 Favorita'}</button>`;
      h += `<button class="btn" data-act="to-shelf" data-id="${id}">🪞 A la estantería</button>`;
      h += `<button class="btn" data-act="avatar" data-id="${id}">👤 Usar de avatar</button>`;
      h += `<button class="btn teal" data-act="gift-doll" data-id="${id}">🎁 Regalar</button>`;
      if (v.n > 1) h += `<button class="btn gold" data-act="sell" data-kind="doll" data-id="${id}">Vender 1 repe · ${coinSm(Game.sellValue('doll', id))}</button>`;
    } else {
      const price = Game.wishPrice(id);
      h += `<button class="btn gold" data-act="wish" data-id="${id}" ${Game.canPay(price) ? '' : 'disabled'}>⭐ Pedirla · ${S.settings.freeMode ? 'gratis' : coinSm(price)}</button>`;
    }
    h += `<button class="btn" data-act="photo" data-id="${id}">📷 ${Photos.has(id) ? 'Cambiar mi foto' : ph ? 'Poner otra foto' : 'Añadir foto real'}</button></div></div></div>`;
    sheet(h, null, 'd:' + id);
    $('#sheet').dataset.doll = id;
  }

  function openItem(kind, id) {
    const x = kind === 'pet' ? PET_BY_ID[id] : ACC_BY_ID[id];
    const n = kind === 'pet' ? S.pets[id] : S.accs[id];
    const url = kind === 'pet' ? Art.petURL(id) : Art.accURL(id);
    const ownerDolls = x.owner ? DOLL_LIST.filter(d => d.char === x.owner) : [];
    let h = `<div class="detail"><div class="d-art"><div class="free-doll" style="aspect-ratio:1"><img src="${url}" alt="" style="width:80%;height:auto;${n ? '' : 'filter:brightness(0) invert(.25)'}"></div></div>
      <div class="d-info"><h2>${esc(x.name)}</h2><div class="kind">${kind === 'pet' ? 'Mascota' : 'Accesorio'}${x.owner ? ` de ${esc(CHARS[x.owner].name)}` : ' de Monster High'}</div>
      <div class="tags">${rarTag(x.rarity)}</div>${x.desc ? `<p class="bio">${esc(x.desc)}</p>` : ''}
      <div class="have">${n ? `Tienes ×${n}` : '<span class="muted">Todavía no lo tienes. Sale en las cajas de ' + (kind === 'pet' ? 'mascota' : 'accesorios') + (x.owner ? ' o junto a su dueña' : '') + '.</span>'}</div>`;
    if (ownerDolls.length) h += `<div class="d-sub">Muñecas de ${esc(shortName(x.owner))}</div><div class="hist">${ownerDolls.map(d => `<button data-act="doll" data-id="${d.id}">${pkgHTML(d.id, { badges: false })}</button>`).join('')}</div>`;
    h += '<div class="d-actions">';
    if (n) h += `<button class="btn teal" data-act="gift-item" data-kind="${kind}" data-id="${id}">🎁 Regalar</button>`;
    if (n > 1) h += `<button class="btn gold" data-act="sell" data-kind="${kind}" data-id="${id}">Vender 1 repe · ${coinSm(Game.sellValue(kind, id))}</button>`;
    h += '</div></div></div>';
    sheet(h, null, kind + ':' + id);
  }

  /* ══ ESTANTERÍA ══ */
  function viewEstanteria() {
    const open = S.settings.shelfOpen;
    const slot = (id, i) => {
      if (!id) return `<button class="slot empty-slot" data-act="slot" data-i="${i}" aria-label="Hueco vacío">+</button>`;
      const ph = open && usePhotos() && photoFor(id);
      const free = ph ? `<div class="free-doll photo"><img referrerpolicy="no-referrer" src="${esc(ph)}" alt="" ${fallback(id)}></div>` : `<div class="free-doll"><img src="${Art.dollURL(id)}" alt=""></div>`;
      return `<button class="slot" data-act="slot" data-i="${i}">${open ? free : pkgHTML(id, { badges: false })}</button>`;
    };
    const cols = window.innerWidth <= 520 ? 3 : window.innerWidth >= 900 ? 6 : 4;
    let shelves = '';
    for (let i = 0; i < S.shelf.length; i += cols) shelves += `<div class="shelf" style="--cols:${cols}">${S.shelf.slice(i, i + cols).map((id, k) => slot(id, i + k)).join('')}</div>`;
    const pets = Object.keys(S.pets);
    return `<h2 class="sec">Mi estantería</h2>
      <div class="btn-row" style="margin-bottom:12px"><button class="btn small" data-act="shelf-open">${open ? '📦 Ver en sus cajas' : '💃 Sacarlas de la caja'}</button>
      <button class="btn small" data-act="shelf-fill">❤ Poner mis favoritas</button><button class="btn small" data-act="shelf-wall">🎨 Cambiar pared</button></div>
      <div class="room ${S.settings.wall ? 'dark' : ''}">${shelves}
      ${pets.length ? `<div class="pet-rug">${pets.map(p => `<img src="${Art.petURL(p)}" alt="${esc(PET_BY_ID[p].name)}" title="${esc(PET_BY_ID[p].name)}" data-act="pet" data-id="${p}">`).join('')}</div>` : ''}</div>
      <p class="tiny" style="margin-top:10px">Toca un hueco para colocar una muñeca. Tus mascotas viven en la alfombra.</p>`;
  }
  function pickDoll(title, onPick, filter = () => true) {
    const owned = DOLL_LIST.filter(d => S.dolls[d.id] && filter(d));
    if (!owned.length) { toast('Aún no tienes muñecas. ¡Abre una caja!'); return; }
    sheet(`<h2 class="sec">${title}</h2><div class="pick-grid">${owned.map(d => `<button data-pick="${d.id}">${pkgHTML(d.id, { badges: false })}</button>`).join('')}</div>`, e => {
      const b = e.target.closest('[data-pick]');
      if (b) { Sfx.play('tap'); onPick(b.dataset.pick); }
    });
  }

  /* ══ LOGROS ══ */
  function viewLogros() {
    const nd = ownedDolls(S);
    const shinies = Object.values(S.dolls).reduce((a, v) => a + v.shiny, 0);
    const linesDone = LINES.filter(l => lineDone(S, l)).length;
    const best = S.stats.best;
    let h = `<h2 class="sec">Logros</h2><div class="stats">
      <div class="stat"><b>${fmt(S.stats.opened)}</b><span>cajas abiertas</span></div>
      <div class="stat"><b>${nd}/${DOLL_LIST.length}</b><span>muñecas distintas</span></div>
      <div class="stat"><b>${linesDone}/${LINES.length}</b><span>colecciones completas</span></div>
      <div class="stat"><b>${Object.keys(S.pets).length}/${PETS.length}</b><span>mascotas</span></div>
      <div class="stat"><b>${Object.keys(S.accs).length}/${ACCESSORIES.length}</b><span>accesorios</span></div>
      <div class="stat"><b>${shinies}</b><span>brillantes ✨</span></div>
      <div class="stat"><b>${fmt(S.stats.coinsEarned)}</b><span>calaveras ganadas</span></div>
      <div class="stat"><b>${S.daily.streak || 0}</b><span>días de racha</span></div></div>`;
    if (best && DOLLS[best.id]) h += `<h3 class="sub">🌟 Tu mejor premio</h3><div style="width:150px"><button data-act="doll" data-id="${best.id}">${pkgHTML(best.id, { badges: false, shiny: best.shiny })}</button></div>`;
    const hist = S.history.filter(x => x.k === 'd' && DOLLS[x.id]).slice(0, 12);
    if (hist.length) h += `<h3 class="sub">🕒 Últimas muñecas</h3><div class="hist">${hist.map(x => `<button data-act="doll" data-id="${x.id}">${pkgHTML(x.id, { badges: false, shiny: x.shiny })}</button>`).join('')}</div>`;
    h += `<h3 class="sub">🏆 ${Object.keys(S.ach).length}/${ACHIEVEMENTS.length} logros</h3>`;
    h += ACHIEVEMENTS.map(a => `<div class="ach ${S.ach[a.id] ? 'done' : ''}"><div class="ic">${S.ach[a.id] ? ICON_ACH[a.id] || '🏆' : '🔒'}</div><div><h4>${esc(a.name)}</h4><p>${esc(a.desc)}</p></div><div class="rw">${S.ach[a.id] ? '✓' : coinSm('+' + a.reward)}</div></div>`).join('');
    return h;
  }

  /* ══ PERFIL ══ */
  function viewPerfil() {
    const others = Store.profiles.list.filter(p => p.id !== PID);
    const dupes = Game.dupeCount();
    return `<div class="prof-head"><div class="who">${S.avatar && S.dolls[S.avatar] ? `<img src="${Art.dollURL(S.avatar)}" alt="">` : esc((S.name || '?')[0].toUpperCase())}</div>
      <div><h2>${esc(S.name)}</h2><button class="btn small" data-act="rename">✏️ Cambiar nombre</button></div></div>
      <h3 class="sub">🎁 Regalos</h3>
      <div class="card"><p class="muted" style="font-weight:700;margin-bottom:10px">Regala muñecas, mascotas, accesorios o cajas a tu pareja. Se genera un código (o un enlace) que solo se puede abrir una vez.</p>
      <div class="btn-row"><button class="btn teal" data-act="gift-menu">🎁 Regalar algo</button><button class="btn" data-act="redeem">📩 Abrir un regalo</button></div></div>
      <h3 class="sub">📷 Fotos reales</h3>
      <div class="row-list">
        <div class="row"><div>Fotos reales<small>${Object.keys(PHOTO_URLS).length} muñecas con foto de la wiki. Si lo apagas, se ven los dibujos.</small></div><button class="switch ${usePhotos() ? 'on' : ''}" data-act="set" data-k="realPhotos" aria-label="Fotos reales"></button></div>
        <div class="row"><div>${Photos.count()} fotos tuyas<small>Las que pones tú se guardan solo en este dispositivo. Pásaselas a tu pareja con un archivo.</small></div></div>
        <div class="btn-row"><button class="btn small" data-act="photos-export">⬇️ Exportar fotos</button><button class="btn small" data-act="photos-import">⬆️ Importar fotos</button></div>
      </div>
      <h3 class="sub">👥 Perfiles en este dispositivo</h3>
      <div class="row-list">${others.map(p => `<div class="row">🦇 ${esc(p.name)}<button class="btn small" data-act="switch" data-id="${p.id}">Jugar como ${esc(p.name)}</button></div>`).join('')}
        <button class="btn small" data-act="new-profile">➕ Nuevo perfil</button></div>
      <h3 class="sub">⚙️ Ajustes</h3>
      <div class="row-list">
        <div class="row"><div>Sonido</div><button class="switch ${Sfx.muted ? '' : 'on'}" data-act="mute" aria-label="Sonido"></button></div>
        <div class="row"><div>Modo libre<small>Todas las cajas gratis, sin límite. Ideal para abrir sin parar.</small></div><button class="switch ${S.settings.freeMode ? 'on' : ''}" data-act="set" data-k="freeMode" aria-label="Modo libre"></button></div>
        <div class="row"><div>Esconder los nombres de las que faltan<small>Más misterio en la colección.</small></div><button class="switch ${S.settings.hideMissing ? 'on' : ''}" data-act="set" data-k="hideMissing" aria-label="Esconder nombres"></button></div>
        <div class="row"><div>Repetidas<small>${dupes} copias de sobra (se guarda una de cada y todas las brillantes).</small></div><button class="btn gold small" data-act="sell-all" ${dupes ? '' : 'disabled'}>Venderlas</button></div>
        <div class="row"><div>Borrar este perfil<small>Se pierde toda la colección de ${esc(S.name)}.</small></div><button class="btn danger small" data-act="delete-profile">Borrar</button></div>
      </div>
      <p class="tiny" style="margin-top:18px">Fan game no oficial y sin ánimo de lucro. Monster High es una marca de Mattel; los personajes Skullector pertenecen a sus dueños. Las fotos oficiales se cargan desde la wiki de Monster High (monsterhigh.fandom.com) y los dibujos están hechos con código. Las fotos que añadas tú se quedan en tu dispositivo.</p>`;
  }

  /* ── Regalar ── */
  function giftMenu() {
    const dolls = DOLL_LIST.filter(d => S.dolls[d.id]);
    const pets = PETS.filter(p => S.pets[p.id]);
    const accs = ACCESSORIES.filter(a => S.accs[a.id]);
    let h = `<h2 class="sec">¿Qué quieres regalar?</h2>`;
    if (!dolls.length && !pets.length && !accs.length) h += '<p class="muted">Todavía no tienes nada. También puedes regalar una caja desde la tienda (botón 🎁).</p>';
    if (dolls.length) h += `<div class="d-sub">Muñecas</div><div class="pick-grid">${dolls.map(d => `<button data-act="gift-doll" data-id="${d.id}">${pkgHTML(d.id)}</button>`).join('')}</div>`;
    if (pets.length) h += `<div class="d-sub">Mascotas</div><div class="mini-grid">${pets.map(p => itemCard('pet', p.id, { act: false }).replace('<button class="item-card', `<button data-act="gift-item" data-kind="pet" data-id="${p.id}" class="item-card`)).join('')}</div>`;
    if (accs.length) h += `<div class="d-sub">Accesorios</div><div class="mini-grid">${accs.map(a => itemCard('acc', a.id, { act: false }).replace('<button class="item-card', `<button data-act="gift-item" data-kind="acc" data-id="${a.id}" class="item-card`)).join('')}</div>`;
    sheet(h);
  }
  async function giftFlow(kind, id) {
    const k = kind === 'doll' ? 'd' : kind === 'pet' ? 'p' : kind === 'acc' ? 'a' : 'b';
    let shiny = false, name;
    if (k === 'd') {
      const v = S.dolls[id];
      name = DOLLS[id].name + ` (${DOLLS[id].lineName})`;
      if (v.shiny) {
        const i = await modal('🎁 ¿Cuál regalas?', `<p>Tienes ${v.n} de ${esc(name)}, ${v.shiny} brillante${v.shiny > 1 ? 's' : ''}.</p>`, [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Normal', cls: '' }, { label: '✨ Brillante', cls: 'primary' }]);
        if (i === 0) return;
        if (i === 1 && v.n - v.shiny <= 0) { toast('Todas las que tienes son brillantes', 'bad'); return; }
        shiny = i === 2;
      }
      if (v.n === 1) {
        const ok = await modal('🎁 Es tu única copia', `<p>Si regalas <b>${esc(name)}</b> dejará de estar en tu colección.</p>`, [{ label: 'Mejor no', cls: 'ghost' }, { label: 'Regalarla', cls: 'teal' }]);
        if (ok !== 1) return;
      }
    } else if (k === 'b') {
      name = BOX_BY_ID[id].name;
      if (!Game.canPay(BOX_BY_ID[id].price)) { toast('No tienes calaveras suficientes', 'bad'); Sfx.play('error'); return; }
      const ok = await modal('🎁 Regalar una caja', `<p>Vas a regalar una <b>${esc(name)}</b> por ${S.settings.freeMode ? 'nada (modo libre)' : coinSm(BOX_BY_ID[id].price)}.</p>`, [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Regalar', cls: 'teal' }]);
      if (ok !== 1) return;
    } else {
      name = (k === 'p' ? PET_BY_ID : ACC_BY_ID)[id].name;
      const n = k === 'p' ? S.pets[id] : S.accs[id];
      if (n === 1) {
        const ok = await modal('🎁 Es tu única copia', `<p>Si regalas <b>${esc(name)}</b> dejará de estar en tu colección.</p>`, [{ label: 'Mejor no', cls: 'ghost' }, { label: 'Regalar', cls: 'teal' }]);
        if (ok !== 1) return;
      }
    }
    // ¿A otro perfil del dispositivo o con código?
    const others = Store.profiles.list.filter(p => p.id !== PID);
    let dest = -1;
    if (others.length) {
      const btns = [{ label: '🔗 Con código', cls: '' }, ...others.map(p => ({ label: `💝 A ${esc(p.name)}`, cls: 'teal' }))];
      const i = await modal('🎁 ¿A quién se lo das?', '<p>Puedes dárselo a otro perfil de este dispositivo o crear un código para enviarlo.</p>', [{ label: 'Cancelar', cls: 'ghost' }, ...btns]);
      if (i === 0) return;
      dest = i - 2;
    }
    if (dest >= 0) {
      const r = Game.giftToProfile(k, id, shiny, others[dest].id);
      if (!r || r.error) { toast(r?.error || 'No se pudo regalar', 'bad'); return; }
      Sfx.play('gift');
      closeSheet(); render();
      toast(`💝 ¡${esc(name)} ya es de ${esc(others[dest].name)}!`, 'pink');
      return;
    }
    const g = Game.gift(k, id, shiny);
    if (!g) { toast('No se pudo regalar', 'bad'); return; }
    Sfx.play('gift');
    closeSheet(); render();
    rewardsToasts(g.rewards);
    const link = `${location.origin}${location.pathname}?regalo=${encodeURIComponent(g.code)}`;
    const i = await modal('🎁 ¡Regalo listo!', `<p>Envía este enlace a tu pareja. Al abrirlo recibirá <b>${esc(name)}${shiny ? ' ✨' : ''}</b>.</p><div class="code-box" style="margin-top:10px">${esc(link)}</div><p class="tiny" style="margin-top:8px">Código: ${esc(g.code)}</p>`,
      [{ label: navigator.share ? '📤 Compartir' : '📋 Copiar enlace', cls: 'primary' }, { label: 'Hecho', cls: 'ghost' }]);
    if (i === 0) shareText(`🎁 ¡Te he regalado ${name}${shiny ? ' ✨' : ''} en Monster High Cajas Sorpresa! Ábrelo aquí: ${link}`, link);
  }
  async function shareText(text, link) {
    try {
      if (navigator.share) { await navigator.share({ title: 'Un regalo monstruoso', text }); return; }
    } catch (e) { /* cancelado */ }
    try { await navigator.clipboard.writeText(link); toast('📋 Enlace copiado'); } catch (e) { toast('Copia el enlace a mano'); }
  }
  async function redeemFlow(code) {
    if (!code) {
      code = await ask('📩 Abrir un regalo', 'Pega el código o el enlace que te han enviado:', '', 'MH-...');
      if (!code) return;
      const m = code.match(/regalo=([^&\s]+)/);
      if (m) code = decodeURIComponent(m[1]);
    }
    const r = Game.redeem(code.trim());
    if (r.error) { Sfx.play('error'); await modal('😿 Vaya...', `<p>${esc(r.error)}</p>`); return; }
    Sfx.play('gift');
    render();
    const it = r.item;
    let body = '';
    if (it.kind === 'doll') body = `<div style="max-width:170px;margin:0 auto 10px">${pkgHTML(it.id, { badges: false, shiny: it.shiny })}</div><p style="text-align:center">¡Te han regalado <b>${esc(DOLLS[it.id].name)}</b> (${esc(DOLLS[it.id].lineName)})${it.shiny ? ' ✨ brillante' : ''}!</p>`;
    else if (it.kind === 'pet') body = `<img src="${Art.petURL(it.id)}" style="width:130px;display:block;margin:0 auto"><p style="text-align:center">¡Te han regalado a <b>${esc(PET_BY_ID[it.id].name)}</b>!</p>`;
    else if (it.kind === 'acc') body = `<img src="${Art.accURL(it.id)}" style="width:110px;display:block;margin:0 auto"><p style="text-align:center">¡Te han regalado <b>${esc(ACC_BY_ID[it.id].name)}</b>!</p>`;
    else body = `<div class="mini-box" style="width:90px;margin:0 auto 10px">${mboxHTML(BOX_BY_ID[it.id])}</div><p style="text-align:center">¡Te han regalado una <b>${esc(BOX_BY_ID[it.id].name)}</b>! La tienes en «Tus cajas guardadas».</p>`;
    await modal('💝 ¡Un regalo para ti!', body, [{ label: '¡Gracias!', cls: 'primary' }]);
    rewardsToasts(r.rewards);
  }

  /* ── Fotos ── */
  async function photoFlow(id) {
    const d = DOLLS[id];
    const has = Photos.has(id);
    const q = encodeURIComponent(`Monster High ${d.gen === 'SK' ? 'Skullector ' : ''}${d.name} ${d.lineName.replace('Skullector: ', '')} ${d.year} doll`);
    const i = await modal('📷 Foto real', `<p>Pon tu propia foto de <b>${esc(d.name)}</b> (${esc(d.lineName)}).${PHOTO_URLS[id] ? ' Sustituirá a la de la wiki.' : ''}</p><p class="tiny">Busca la foto, mantén el dedo sobre ella y elige «Copiar dirección de la imagen». Luego pégala con «Pegar enlace». También puedes subir una foto de tu galería.</p>`,
      [{ label: '🔎 Buscar en Google', cls: '' }, { label: '🔗 Pegar enlace', cls: '' }, { label: '🖼️ Subir de la galería', cls: 'primary' }, ...(has ? [{ label: '🗑️ Quitar mi foto', cls: 'danger' }] : []), { label: 'Cancelar', cls: 'ghost' }]);
    if (i === 0) { window.open(`https://www.google.com/search?tbm=isch&q=${q}`, '_blank', 'noopener'); return; }
    if (i === 1) {
      const url = await ask('🔗 Enlace de la foto', 'Pega la dirección de la imagen:', '', 'https://...');
      if (!url) return;
      if (!/^(https?:\/\/|data:image\/)/i.test(url.trim())) { toast('Eso no parece un enlace de imagen', 'bad'); return; }
      const ok = await new Promise(res => { const im = new Image(); im.referrerPolicy = 'no-referrer'; im.onload = () => res(true); im.onerror = () => res(false); im.src = url.trim(); setTimeout(() => res(false), 9000); });
      if (!ok) { toast('No se pudo cargar esa imagen 😿', 'bad'); return; }
      await savePhoto(id, url.trim());
      return;
    }
    if (i === 2) {
      const inp = $('#file-photo');
      inp.value = '';
      inp.onchange = async () => {
        const f = inp.files?.[0];
        if (!f) return;
        try { await savePhoto(id, await Photos.shrink(f)); } catch (e) { toast('No se pudo leer la foto', 'bad'); }
      };
      inp.click();
      return;
    }
    if (has && i === 3) { await Photos.del(id); toast('Foto quitada'); openDoll(id, 'auto'); }
  }
  async function savePhoto(id, src) {
    await Photos.put(id, src);
    S.stats.photos = Photos.count();
    const r = Game.afterChange();
    Game.save();
    toast('📷 ¡Foto guardada!', 'pink');
    rewardsToasts(r);
    if (!$('#sheet').classList.contains('hidden')) openDoll(id, 'photo');
  }
  function exportPhotos() {
    if (!Photos.count()) { toast('Todavía no tienes fotos'); return; }
    const data = { v: 1, app: 'mh-cajas', photos: Object.fromEntries(Photos.all()) };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fotos-monster-high.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('⬇️ Archivo de fotos descargado');
  }
  function importPhotos() {
    const inp = $('#file-import');
    inp.value = '';
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        let n = 0;
        for (const [id, src] of Object.entries(data.photos || {})) if (DOLLS[id] && typeof src === 'string' && /^(https?:|data:image\/)/.test(src)) { await Photos.put(id, src); n++; }
        S.stats.photos = Photos.count();
        Game.afterChange(); Game.save();
        toast(`⬆️ ${n} fotos importadas`, 'pink');
        render();
      } catch (e) { toast('Ese archivo no es de fotos', 'bad'); }
    };
    inp.click();
  }

  /* ── Acciones ── */
  async function onAction(el) {
    const a = el.dataset.act, id = el.dataset.id;
    Sfx.unlock();
    switch (a) {
      case 'open': Sfx.play('click'); Opening.start(el.dataset.box, el.dataset.src); break;
      case 'daily': {
        const r = Game.claimDaily();
        if (!r) break;
        Sfx.play('coin');
        await modal('📅 Recompensa diaria', `<p style="text-align:center;font-size:20px">${coinSm('+' + r.coins)}</p><p style="text-align:center">Racha de ${r.streak} ${r.streak === 1 ? 'día' : 'días'}.${r.box ? ` ¡Y una <b>${esc(BOX_BY_ID[r.box].name)}</b> de regalo!` : ' Vuelve mañana para más.'}</p>`);
        render(); rewardsToasts(Game.afterChange()); Game.save();
        break;
      }
      case 'gift-box': Sfx.play('tap'); giftFlow('box', el.dataset.box); break;
      case 'coltab': Sfx.play('tap'); colTab = el.dataset.v; render(); break;
      case 'fgen': Sfx.play('tap'); filt.gen = el.dataset.v; render(); break;
      case 'doll': Sfx.play('tap'); openDoll(id, 'auto'); break;
      case 'pet': Sfx.play('tap'); openItem('pet', id); break;
      case 'acc': Sfx.play('tap'); openItem('acc', id); break;
      case 'dview': Sfx.play('tap'); openDoll($('#sheet').dataset.doll, el.dataset.v); break;
      case 'fav': S.fav[id] ? delete S.fav[id] : (S.fav[id] = true); Game.save(); Sfx.play('tap'); openDoll(id); break;
      case 'avatar': S.avatar = id; Game.save(); Sfx.play('tap'); renderHeader(); toast('👤 ¡Nuevo avatar!'); break;
      case 'to-shelf': {
        const free = S.shelf.indexOf(null);
        if (S.shelf.includes(id)) { toast('Ya está en tu estantería'); break; }
        if (free < 0) { toast('La estantería está llena. Quita alguna primero.', 'bad'); break; }
        S.shelf[free] = id; Game.save(); Sfx.play('tap'); toast('🪞 ¡Colocada en la estantería!');
        break;
      }
      case 'wish': {
        const d = DOLLS[id];
        const price = Game.wishPrice(id);
        const ok = await modal('⭐ Pedir una muñeca', `<p>¿Quieres pedir a <b>${esc(d.name)}</b> (${esc(d.lineName)}) por ${S.settings.freeMode ? 'nada (modo libre)' : coinSm(price)}?</p>`, [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Pedirla', cls: 'gold' }]);
        if (ok !== 1) break;
        const r = Game.wish(id);
        if (!r) { toast('No tienes calaveras suficientes', 'bad'); Sfx.play('error'); break; }
        Sfx.play(d.rarity); openDoll(id); renderHeader(); rewardsToasts(r.rewards);
        break;
      }
      case 'sell': {
        const v = Game.sellOne(el.dataset.kind, id);
        if (v) { Sfx.play('coin'); toast(`Vendida por ${coinSm(v)}`, 'gold'); }
        renderHeader();
        el.dataset.kind === 'doll' ? openDoll(id) : openItem(el.dataset.kind, id);
        break;
      }
      case 'sell-all': {
        const n = Game.dupeCount();
        const ok = await modal('Vender repetidas', `<p>Vas a vender ${n} copias repetidas. Te quedas con una de cada y con todas las brillantes.</p>`, [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Vender', cls: 'gold' }]);
        if (ok !== 1) break;
        const r = Game.sellAllDupes();
        Sfx.play('coin'); toast(`Has ganado ${coinSm(r.total)}`, 'gold'); render();
        break;
      }
      case 'gift-doll': Sfx.play('tap'); giftFlow('doll', id); break;
      case 'gift-item': Sfx.play('tap'); giftFlow(el.dataset.kind, id); break;
      case 'gift-menu': Sfx.play('tap'); giftMenu(); break;
      case 'redeem': Sfx.play('tap'); redeemFlow(); break;
      case 'photo': Sfx.play('tap'); photoFlow(id); break;
      case 'photos-export': exportPhotos(); break;
      case 'photos-import': importPhotos(); break;
      case 'slot': {
        const i = +el.dataset.i;
        Sfx.play('tap');
        if (S.shelf[i]) {
          const c = await modal(esc(DOLLS[S.shelf[i]].name), `<p>${esc(DOLLS[S.shelf[i]].lineName)}</p>`, [{ label: 'Ver ficha', cls: 'primary' }, { label: 'Cambiar', cls: '' }, { label: 'Quitar', cls: 'danger' }, { label: 'Cerrar', cls: 'ghost' }]);
          if (c === 0) openDoll(S.shelf[i], 'auto');
          if (c === 2) { S.shelf[i] = null; Game.save(); render(); }
          if (c !== 1) break;
        }
        pickDoll('Elige una muñeca', pid => { const old = S.shelf.indexOf(pid); if (old >= 0) S.shelf[old] = null; S.shelf[i] = pid; Game.save(); closeSheet(); render(); }, d => !S.shelf.includes(d.id) || S.shelf[i] === d.id);
        break;
      }
      case 'shelf-open': S.settings.shelfOpen = !S.settings.shelfOpen; Game.save(); Sfx.play('tap'); render(); break;
      case 'shelf-wall': S.settings.wall = !S.settings.wall; Game.save(); Sfx.play('tap'); render(); break;
      case 'shelf-fill': {
        const favs = DOLL_LIST.filter(d => S.fav[d.id] && S.dolls[d.id]).map(d => d.id);
        if (!favs.length) { toast('Marca muñecas como favoritas ❤ en su ficha'); break; }
        S.shelf = Array(12).fill(null).map((_, k) => favs[k] || null);
        Game.save(); Sfx.play('tap'); render();
        break;
      }
      case 'set': S.settings[el.dataset.k] = !S.settings[el.dataset.k]; Game.save(); Sfx.play('tap'); render(); break;
      case 'mute': Sfx.toggle(); render(); break;
      case 'rename': {
        const n = await ask('✏️ Tu nombre', '¿Cómo quieres llamarte?', S.name);
        if (n && n.trim()) { S.name = n.trim().slice(0, 18); Store.rename(PID, S.name); Game.save(); render(); }
        break;
      }
      case 'switch': Main.switchProfile(id); break;
      case 'new-profile': {
        const n = await ask('➕ Nuevo perfil', '¿Cómo se llama la nueva coleccionista?', '');
        if (n && n.trim()) Main.newProfile(n.trim().slice(0, 18));
        break;
      }
      case 'delete-profile': {
        const ok = await modal('🗑️ Borrar perfil', `<p>Se borrará para siempre la colección de <b>${esc(S.name)}</b>. ¿Seguro?</p>`, [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Borrar', cls: 'danger' }]);
        if (ok === 1) Main.deleteProfile();
        break;
      }
    }
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('#tabs [data-tab]');
    if (t) { Sfx.unlock(); Sfx.play('tap'); go(t.dataset.tab); return; }
    if (e.target.closest('#who')) { Sfx.play('tap'); go('perfil'); return; }
    const el = e.target.closest('[data-act]');
    if (el && !el.closest('#modal') && el.tagName !== 'SELECT') onAction(el);
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('select[data-act]');
    if (!el) return;
    if (el.dataset.act === 'fchar') filt.char = el.value;
    if (el.dataset.act === 'fshow') filt.show = el.value;
    render();
  });

  return { render, renderHeader, go, toast, modal, ask, sheet, closeSheet, rewardsToasts, pkgHTML, mboxHTML, itemCard, openDoll, redeemFlow, get tab() { return tab; } };
})();
