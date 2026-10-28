'use strict';

/* ══════════════════════════════════════
   ARRANQUE · perfiles y bienvenida
══════════════════════════════════════ */
const Main = {
  async boot() {
    document.querySelector('.logo-skull').innerHTML = Art.skullBow('#ffffff', '#ff3d9a', '100%');
    document.querySelector('.w-skull').innerHTML = Art.skullBow('#ffffff', '#ff3d9a', '100%');
    await Photos.loadAll();
    Store.load();
    if (!Store.profiles.list.length) return this.welcome();
    const id = Store.profiles.list.some(p => p.id === Store.profiles.current) ? Store.profiles.current : Store.profiles.list[0].id;
    this.enter(id);
  },

  welcome() {
    $('#app').classList.add('hidden');
    const w = $('#welcome');
    w.classList.remove('hidden');
    const inp = $('#w-name');
    const go = () => {
      const n = inp.value.trim();
      if (!n) { inp.focus(); Sfx.play('error'); return; }
      Sfx.unlock(); Sfx.play('gift');
      w.classList.add('hidden');
      this.newProfile(n.slice(0, 18), true);
    };
    $('#w-go').onclick = go;
    inp.onkeydown = e => { if (e.key === 'Enter') go(); };
  },

  enter(id) {
    S = Store.open(id);
    PID = id;
    if (!S) { Store.remove(id); return this.boot(); }
    Game.tickFree();
    S.stats.photos = Photos.count();
    Game.save();
    $('#app').classList.remove('hidden');
    UI.go('cajas');
    if (S.notice) {
      const n = S.notice;
      delete S.notice;
      Game.save();
      UI.modal('📷 ¡Fotos reales!', `<p>El catálogo se ha rehecho con la wiki de Monster High: ahora hay ${DOLL_LIST.length} muñecas, cada una con su foto oficial.</p><p>${n.gone} ${n.gone === 1 ? 'muñeca que tenías ya no está' : 'muñecas que tenías ya no están'} en el catálogo, así que te devolvemos ${coinSm(n.coins)}.</p>`, [{ label: '¡A verlas!', cls: 'primary' }]);
    }
    this.checkGiftLink();
  },

  async newProfile(name, first = false) {
    if (PID && S) Game.save();
    Store.create(name);
    this.enter(Store.profiles.current);
    await UI.modal(`¡Hola, ${esc(name)}!`, `<p>Bienvenida a <b>Monster High · Cajas Sorpresa</b>.</p>
      <p>🎁 Tienes <b>${FREE_MAX} cajas gratis</b> y ${coinSm(S.coins)} para empezar. Cada hora se recarga una caja gratis.</p>
      <p>👆 Toca la caja tres veces para agitarla y descubre qué muñeca hay dentro: de la G1 de 2010 a las Skullector.</p>
      <p>🐾 A veces la caja trae de regalo su mascota o un accesorio. Las repetidas puedes venderlas o regalárselas a tu pareja.</p>
      ${first ? '<p>📷 En la ficha de cada muñeca puedes ponerle una foto real.</p>' : ''}`, [{ label: '¡A abrir cajas!', cls: 'primary' }]);
  },

  switchProfile(id) {
    Game.save();
    this.enter(id);
    UI.toast(`🦇 Ahora juegas como ${esc(S.name)}`);
  },

  deleteProfile() {
    Store.remove(PID);
    S = null; PID = null;
    if (!Store.profiles.list.length) return this.welcome();
    this.enter(Store.profiles.current);
  },

  async checkGiftLink() {
    const params = new URLSearchParams(location.search);
    const code = params.get('regalo');
    if (!code) return;
    history.replaceState(null, '', location.pathname);
    const ok = await UI.modal('💝 Te han enviado un regalo', `<p>Lo recibirá el perfil <b>${esc(S.name)}</b>.</p>${Store.profiles.list.length > 1 ? '<p class="tiny">Si es para otra persona, cambia de perfil y vuelve a abrir el enlace.</p>' : ''}`, [{ label: 'Ahora no', cls: 'ghost' }, { label: '¡Abrirlo!', cls: 'primary' }]);
    if (ok === 1) UI.redeemFlow(code);
  },
};

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && S) { Game.tickFree(); if (!Opening.active && UI.tab === 'cajas') UI.render(); else UI.renderHeader(); }
});
document.addEventListener('pointerdown', () => Sfx.unlock(), { once: true });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'ask-in') document.querySelector('#modal .m-actions .btn.primary')?.click();
});

Main.boot();
window.addEventListener('resize', () => { if (S && UI.tab === 'estanteria' && !Opening.active) UI.render(); });
