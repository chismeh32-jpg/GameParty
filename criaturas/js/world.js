'use strict';

/* ══════════════════════════════════════
   MUNDO: mapa, movimiento, NPC y eventos
══════════════════════════════════════ */
const World = (() => {
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const WALK = 0.2, RUN = 0.11, JUMP = 0.4;

  let map = null;
  const player = { x: 0, y: 0, dir: 'down', moving: false, t: 0, fx: 0, fy: 0, tx: 0, ty: 0, dur: WALK, jump: false, foot: 0 };
  let busy = false;          // hay un evento en curso
  let turnDelay = 0;
  let fade = 0;
  let emote = null;
  let stepsSinceWarp = 0;
  let banner = null;
  let lastBump = 0;

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const flag = f => !!G.flags[f];
  const visible = d => (!d.hideIf || !flag(d.hideIf)) && (!d.showIf || flag(d.showIf));

  /* ── Carga de mapas ───────────────── */
  function load(id, x, y, dir) {
    const def = MAPS[id];
    const h = def.rows.length, w = def.rows[0].length;
    const tiles = [], solid = new Uint8Array(w * h);
    def.rows.forEach((row, yy) => {
      if (row.length !== w) console.warn(`Fila ${yy} de ${id} mide ${row.length} (esperado ${w})`);
      for (let xx = 0; xx < w; xx++) {
        const t = LEGEND[row[xx]] || 'grass';
        tiles.push(t);
        if (SOLID_TILES.has(t)) solid[yy * w + xx] = 1;
      }
    });
    const warps = [...(def.warps || [])];
    const buildings = (def.buildings || []).map(b => {
      const k = BUILDING_KINDS[b.kind];
      for (let yy = b.y; yy < b.y + k.h; yy++) for (let xx = b.x; xx < b.x + k.w; xx++) solid[yy * w + xx] = 1;
      const door = { x: b.x + k.door, y: b.y + k.h - 1 };
      solid[door.y * w + door.x] = 0;
      warps.push({ x: door.x, y: door.y, to: b.to, tx: b.tx, ty: b.ty, door: true });
      return { ...b, k, door };
    });
    map = {
      id, def, w, h, tiles, solid, warps, buildings,
      npcs: (def.npcs || []).filter(visible).map(n => ({ ...n, ox: n.x, oy: n.y, moving: false, t: 0, wanderT: 1 + Math.random() * 3 })),
      objects: (def.objects || []).filter(visible),
      items: (def.items || []).filter(it => !flag(it.id)),
    };
    G.map = id;
    player.x = x; player.y = y;
    if (dir) player.dir = dir;
    player.moving = false;
    stepsSinceWarp = 0;
    Audio8.play(def.music || (def.interior ? 'town' : 'route'));
    // Precarga el escenario 3D de la zona y las criaturas del equipo
    if (window.Battle3D?.available) {
      window.Battle3D.preload([['escenarios', arenaOf(def)], ...G.party.map(c => ['criaturas', c.sp]), ...Object.values(def.encounters || {}).flat().map(e => ['criaturas', e[0]])]);
    }
    showBanner(def.name);
  }

  function showBanner(name) {
    if (banner) banner.remove();
    banner = UI.el('div', 'map-banner', UI.esc(name));
    document.getElementById('ui').appendChild(banner);
    const b = banner;
    setTimeout(() => b.classList.add('out'), 1800);
    setTimeout(() => b.remove(), 2400);
  }

  const arenaOf = def => def.arena || (def.dark ? 'cueva' : 'pradera');

  const inside = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h;
  const tileAt = (x, y) => (inside(x, y) ? map.tiles[y * map.w + x] : null);
  const npcAt = (x, y) => map.npcs.find(n => (n.x === x && n.y === y) || (n.moving && n.tx === x && n.ty === y));
  const objectAt = (x, y) => map.objects.find(o => o.x === x && o.y === y);
  const itemAt = (x, y) => map.items.find(o => o.x === x && o.y === y);

  function blocked(x, y, ignore) {
    if (!inside(x, y)) return true;
    if (map.solid[y * map.w + x]) return true;
    const n = npcAt(x, y);
    if (n && n !== ignore) return true;
    if (objectAt(x, y) || itemAt(x, y)) return true;
    return false;
  }

  /* ── Movimiento del jugador ───────── */
  function update(dt) {
    for (const n of map.npcs) updateNpc(n, dt);
    if (player.moving) {
      player.t += dt / player.dur;
      if (player.t >= 1) finishStep();
      return;
    }
    if (busy || UI.busy() || fade > 0) return;
    const d = Input.dir();
    if (!d) return;
    if (d !== player.dir) {
      player.dir = d;
      turnDelay = 0.08;
      return;
    }
    if (turnDelay > 0) { turnDelay -= dt; return; }
    tryStep(d);
  }

  function tryStep(d) {
    const [dx, dy] = DIRS[d];
    const nx = player.x + dx, ny = player.y + dy;
    const t = tileAt(nx, ny);
    if (t === 'ledge') {
      if (d === 'down' && !blocked(nx, ny + 1)) {
        Audio8.sfx('jump');
        return startStep(nx, ny + 1, JUMP, true);
      }
      return bump();
    }
    if (blocked(nx, ny)) return bump();
    startStep(nx, ny, Input.held.b ? RUN : WALK, false);
  }

  function bump() {
    const now = performance.now();
    if (now - lastBump > 350) { Audio8.sfx('bump'); lastBump = now; }
  }

  function startStep(tx, ty, dur, jump) {
    Object.assign(player, { moving: true, t: 0, fx: player.x, fy: player.y, tx, ty, dur, jump });
    player.foot ^= 1;
  }

  function finishStep() {
    player.moving = false;
    player.jump = false;
    player.x = player.tx;
    player.y = player.ty;
    stepsSinceWarp++;
    G.steps = (G.steps || 0) + 1;
    afterStep();
  }

  function afterStep() {
    const warp = map.warps.find(w => w.x === player.x && w.y === player.y);
    if (warp) return run(() => doWarp(warp));
    const trig = (map.def.triggers || []).find(t => t.x === player.x && t.y === player.y);
    if (trig) return run(() => SCRIPTS[trig.script](trig));
    const spotter = trainerSees();
    if (spotter) return run(() => trainerSpotted(spotter));
    const tile = tileAt(player.x, player.y);
    const enc = map.def.encounters?.[tile];
    if (enc && stepsSinceWarp > 1 && Math.random() < 0.1 * (ENCOUNTER_TILES[tile] || 0)) {
      return run(() => wildEncounter(enc, tile));
    }
  }

  async function run(fn) {
    busy = true;
    try { await fn(); } finally { busy = false; }
  }

  async function fadeTo(target, ms = 220) {
    const from = fade;
    const t0 = performance.now();
    while (true) {
      const p = Math.min(1, (performance.now() - t0) / ms);
      fade = from + (target - from) * p;
      if (p >= 1) break;
      await new Promise(r => requestAnimationFrame(r));
    }
  }

  async function doWarp(w) {
    Audio8.sfx('door');
    await fadeTo(1);
    const dest = MAPS[w.to];
    let dir = player.dir;
    if (dest.interior) dir = 'up';
    else if (MAPS[map.id].interior) dir = 'down';
    load(w.to, w.tx, w.ty, dir);
    save();
    await fadeTo(0);
  }

  /* ── NPC ──────────────────────────── */
  function updateNpc(n, dt) {
    if (n.moving) {
      n.t += dt / WALK;
      if (n.t >= 1) { n.moving = false; n.x = n.tx; n.y = n.ty; if (n.onArrive) { const f = n.onArrive; n.onArrive = null; f(); } }
      return;
    }
    if (!n.wander || busy || UI.busy()) return;
    n.wanderT -= dt;
    if (n.wanderT > 0) return;
    n.wanderT = 1.5 + Math.random() * 3;
    const d = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
    n.dir = d;
    if (Math.random() < 0.5) return;
    const [dx, dy] = DIRS[d];
    const nx = n.x + dx, ny = n.y + dy;
    if (Math.abs(nx - n.ox) > 2 || Math.abs(ny - n.oy) > 2) return;
    if (blocked(nx, ny, n) || (nx === player.x && ny === player.y) || (player.moving && nx === player.tx && ny === player.ty)) return;
    if (tileAt(nx, ny) === 'ledge') return;
    Object.assign(n, { moving: true, t: 0, fx: n.x, fy: n.y, tx: nx, ty: ny });
  }

  function npcStep(n, d) {
    return new Promise(res => {
      const [dx, dy] = DIRS[d];
      n.dir = d;
      Object.assign(n, { moving: true, t: 0, fx: n.x, fy: n.y, tx: n.x + dx, ty: n.y + dy, onArrive: res });
    });
  }

  function trainerSees() {
    for (const n of map.npcs) {
      if (!n.trainer || !n.trainer.sight || flag('beat_' + n.id)) continue;
      const [dx, dy] = DIRS[n.dir];
      for (let i = 1; i <= n.trainer.sight; i++) {
        const x = n.x + dx * i, y = n.y + dy * i;
        if (x === player.x && y === player.y) return n;
        if (blocked(x, y, n)) break;
      }
    }
    return null;
  }

  async function trainerSpotted(n) {
    Audio8.sfx('encounter');
    emote = { npc: n, t: performance.now() };
    await wait(700);
    emote = null;
    // Se acerca hasta quedar al lado
    while (Math.abs(n.x - player.x) + Math.abs(n.y - player.y) > 1) await npcStep(n, n.dir);
    player.dir = OPP[n.dir];
    await trainerBattle(n);
  }

  function rivalStarter(evolved) {
    const map2 = { brasito: 'gotarin', gotarin: 'brotin', brotin: 'brasito' };
    const sp = map2[G.flags.starter] || 'brasito';
    return evolved ? SPECIES[sp].evo[0] : sp;
  }

  function rivalParty(n) {
    if (n === 1) return [[rivalStarter(), 5]];
    if (n === 2) return [['pipio', 11], [rivalStarter(), 13]];
    return [['halconcio', 21], ['setilla', 20], ['chispin', 21], [rivalStarter(true), 24]];
  }

  async function trainerBattle(n, extra = {}) {
    const tr = n.trainer;
    n.dir = OPP[player.dir];
    if (tr.intro) await UI.sayAll(tr.intro);
    const list = tr.rival ? rivalParty(tr.rival) : tr.party;
    const party = list.map(([sp, lvl]) => makeMon(sp, lvl));
    const env = map.def.music === 'gym' ? 'gym' : map.def.dark ? 'cave' : 'grass';
    const result = await battleTransition(() => Battle.run({ trainer: { ...tr, party, look: n.look }, env, arena: arenaOf(map.def), ...extra }));
    if (result === 'win') {
      G.flags['beat_' + n.id] = true;
      if (tr.leader) await leaderReward(tr);
      else if (tr.after && !tr.rival) await UI.say(tr.after);
    }
    if (result === 'lose' && !extra.noBlackout) await blackout();
    save();
    return result;
  }

  async function leaderReward(tr) {
    G.flags[tr.leader] = true;
    Audio8.sfx('levelup');
    const badge = tr.leader === 'badge1' ? 'Medalla Roca' : 'Medalla Voltio';
    await UI.say(`¡${G.name} ha recibido la ${badge}!`);
    await UI.say(tr.after);
  }

  async function wildEncounter(enc, tile) {
    const total = enc.reduce((a, e) => a + e[3], 0);
    let r = Math.random() * total;
    let pick = enc[0];
    for (const e of enc) { r -= e[3]; if (r <= 0) { pick = e; break; } }
    const mon = makeMon(pick[0], randInt(pick[1], pick[2]));
    const env = tile === 'cave' ? 'cave' : 'grass';
    const result = await battleTransition(() => Battle.run({ wild: mon, env, arena: arenaOf(map.def) }));
    if (result === 'lose') await blackout();
    save();
  }

  // Destello y fundido al entrar en combate
  async function battleTransition(fn) {
    Audio8.sfx('encounter');
    for (let i = 0; i < 3; i++) { await fadeTo(0.8, 70); await fadeTo(0, 70); }
    await fadeTo(1, 250);
    G.mode = 'battle';
    fade = 0;
    let result;
    try { result = await fn(); } finally { G.mode = 'world'; }
    fade = 1;
    Audio8.play(map.def.music || 'route');
    await fadeTo(0, 300);
    return result;
  }

  async function blackout() {
    await fadeTo(1, 400);
    for (const c of G.party) healMon(c);
    const h = G.lastHeal;
    load(h.map, h.x, h.y, 'down');
    await fadeTo(0, 400);
    await UI.say(h.map === 'casa' ? 'Has vuelto corriendo a casa. Tus criaturas han descansado.' : 'Has vuelto corriendo al Centro de Criaturas. Tus criaturas se han recuperado.');
  }

  /* ── Interacción con A ────────────── */
  function interact() {
    if (busy || player.moving || UI.busy()) return;
    const [dx, dy] = DIRS[player.dir];
    let x = player.x + dx, y = player.y + dy;
    if (tileAt(x, y) === 'counter') { x += dx; y += dy; }
    const n = npcAt(x, y);
    if (n) return run(() => talk(n));
    const o = objectAt(x, y);
    if (o) return run(() => SCRIPTS[o.script](o));
    const it = itemAt(x, y);
    if (it) return run(() => pickItem(it));
    const t = tileAt(player.x + dx, player.y + dy);
    if (t === 'sign') {
      const s = (map.def.signs || []).find(s => s.x === player.x + dx && s.y === player.y + dy);
      if (s) return run(() => UI.say(s.text));
    }
    if (t === 'shelf') return run(() => UI.say('Está lleno de libros sobre criaturas.'));
    if (t === 'pc') return run(() => SCRIPTS.pc());
    if (t === 'healer') return run(() => UI.say('Una máquina para curar criaturas. Mejor no tocarla.'));
    if (t === 'water') return run(() => UI.say('El agua es de un azul precioso.'));
  }

  async function talk(n) {
    if (n.moving) return;
    n.dir = OPP[player.dir];
    if (n.script && SCRIPTS[n.script] && !(n.trainer && !n.trainer.rival && !flag('beat_' + n.id))) return SCRIPTS[n.script](n);
    if (n.trainer && !flag('beat_' + n.id)) return trainerBattle(n);
    if (n.trainer && flag('beat_' + n.id)) return UI.say(n.trainer.after || '...');
    if (n.text) return UI.sayAll(n.text);
  }

  async function pickItem(it) {
    G.flags[it.id] = true;
    map.items = map.items.filter(x => x !== it);
    G.bag[it.item] = (G.bag[it.item] || 0) + (it.qty || 1);
    Audio8.sfx('item');
    await UI.say(`¡${G.name} ha encontrado ${it.qty > 1 ? it.qty + ' × ' : ''}${ITEMS[it.item].n}!`);
  }

  async function heal(where) {
    for (const c of G.party) healMon(c);
    Audio8.sfx('heal');
    await wait(900);
    G.lastHeal = where;
  }

  /* ── Eventos de la historia ───────── */
  const SCRIPTS = {
    async noStarter() {
      if (flag('starter')) return;
      await UI.say('¡ESPERA! ¡No vayas a la hierba alta sin una criatura!');
      await UI.say('Profesora Alisa: Ven a mi laboratorio, al sur del pueblo. Tengo algo para ti.');
      player.dir = 'down';
      startStep(player.x, player.y + 1, WALK, false);
      await wait(260);
    },

    async mom(n) {
      if (!flag('starter')) {
        await UI.sayAll([`¡Buenos días, ${G.name}!`, 'La profesora Alisa ha preguntado por ti. Su laboratorio es el edificio gris del sur del pueblo.']);
        return;
      }
      await UI.say(`¡${G.name}! Pareces cansado. Descansa un poco.`);
      await heal({ map: 'casa', x: 2, y: 3 });
      await UI.say('¡Tus criaturas están como nuevas! Ten mucho cuidado ahí fuera.');
      void n;
    },

    async sister() {
      if (!flag('starter')) return UI.say('Mi hermano Dani ha ido corriendo al laboratorio. ¡Dice que hoy le darán su primera criatura!');
      if (!flag('sister_gift')) {
        G.flags.sister_gift = true;
        await UI.say('¡Así que ya tienes una criatura! Toma, esto te vendrá bien.');
        G.bag.pocion = (G.bag.pocion || 0) + 3;
        Audio8.sfx('item');
        return UI.say(`¡${G.name} ha recibido 3 × Poción!`);
      }
      return UI.say('Dani siempre quiere ganar. ¡No dejes que se le suba a la cabeza!');
    },

    async prof() {
      if (!flag('met_prof')) {
        G.flags.met_prof = true;
        await UI.sayAll([
          `¡Hola, ${G.name}! Soy la profesora Alisa. Estudio a las criaturas que viven en la región de Brisaluz.`,
          'Las personas y las criaturas viven aquí juntas, como amigas. Algunas personas incluso combaten con ellas.',
          'Ya tienes edad para empezar tu propia aventura. En la mesa hay tres cápsulas, cada una con una criatura.',
          '¡Elige la que más te guste!',
        ]);
        return;
      }
      if (!flag('starter')) return UI.say('¡Vamos, elige una de las tres cápsulas de la mesa!');
      const seen = Object.keys(G.dex.seen).length, caught = Object.keys(G.dex.caught).length;
      await UI.say(`Veamos tu Criaturario... Has visto ${seen} criaturas y has capturado ${caught}.`);
      await UI.say(caught >= 20 ? '¡Increíble! ¡Eres todo un experto en criaturas!' : caught >= 10 ? '¡Vas muy bien! Sigue así.' : '¡Sigue explorando! Hay muchas criaturas esperándote.');
    },

    async rivalLab() {
      if (!flag('met_prof')) return UI.say('Dani: ¡Eh! La profesora me ha dicho que espere. ¡Habla con ella!');
      return UI.say('Dani: ¡Venga, elige tú primero! Yo me quedaré con la mejor, je, je.');
    },

    async starter(o) {
      if (!flag('met_prof')) return UI.say('Son cápsulas con criaturas dentro. Mejor habla antes con la profesora.');
      if (flag('starter')) return UI.say('Es la última cápsula de la profesora Alisa.');
      const sp = SPECIES[o.species];
      await showCreature(o.species);
      const yes = await UI.ask(`¿Quieres a ${sp.n}, la criatura de tipo ${TYPES[sp.types[0]].name}?`);
      hideCreature();
      if (yes !== 0) return;
      G.flags.starter = o.species;
      G.flags['starter_' + o.species] = true;
      map.objects = map.objects.filter(x => x !== o);
      const mon = makeMon(o.species, 5);
      G.party.push(mon);
      G.dex.seen[o.species] = true;
      G.dex.caught[o.species] = true;
      Audio8.sfx('catch');
      await UI.say(`¡${G.name} ha recibido a ${sp.n}!`);

      // El rival elige la que tiene ventaja
      const rival = map.npcs.find(n => n.id === 'rival_lab');
      const rsp = rivalStarter();
      const robj = map.objects.find(x => x.species === rsp);
      await UI.say(`Dani: ¡Pues yo me quedo con esta! ¡${SPECIES[rsp].n}!`);
      G.flags['starter_' + rsp] = true;
      map.objects = map.objects.filter(x => x !== robj);
      Audio8.sfx('ball');
      await UI.say(`Dani ha recibido a ${SPECIES[rsp].n}.`);
      await UI.say('Dani: ¡Vamos a ver qué tal combaten! ¡Te reto!');
      const res = await trainerBattle({ ...rival, trainer: { rival: 1, name: 'Rival Dani', prize: 20, intro: '', defeat: '¡Bah! ¡Ha sido suerte!' } }, { noBlackout: true });
      if (res === 'lose') await UI.say('Dani: ¡Ja! ¡He elegido mejor que tú!');
      for (const c of G.party) healMon(c);
      G.flags.rival1 = true;
      map.npcs = map.npcs.filter(n => n.id !== 'rival_lab');
      await UI.say('Dani: Me voy a entrenar. ¡La próxima vez te ganaré seguro! ¡Adiós!');
      Audio8.sfx('door');
      await UI.sayAll([
        'Profesora Alisa: ¡Qué combate tan emocionante! He curado a tu criatura.',
        'Toma, llévate esto. Es un CRIATURARIO: registra todas las criaturas que veas y captures.',
      ]);
      G.flags.dex = true;
      Audio8.sfx('item');
      await UI.say(`¡${G.name} ha recibido el Criaturario!`);
      G.bag.capsula = (G.bag.capsula || 0) + 5;
      await UI.say(`¡${G.name} ha recibido 5 × Cápsula!`);
      await UI.sayAll([
        'Debilita a las criaturas salvajes y lánzales una Cápsula para capturarlas.',
        'En Ciudad Roble, al norte, hay un gimnasio. Los líderes de gimnasio son los entrenadores más fuertes de la región.',
        'Pulsa START (o Esc) para abrir el menú y guardar la partida. ¡Buena suerte!',
      ]);
      save();
    },

    async nurse() {
      await UI.say('¡Hola! Bienvenido al Centro de Criaturas.');
      const r = await UI.ask('¿Quieres que cure a tus criaturas?', ['Curar', 'No, gracias']);
      if (r !== 0) return UI.say('¡Vuelve cuando quieras!');
      await UI.say('Muy bien. Dame tus criaturas un momento.');
      await heal({ map: map.id, x: 5, y: 4 });
      await UI.say('¡Listo! Tus criaturas están en plena forma. ¡Vuelve cuando quieras!');
      save();
    },

    async pc() {
      Audio8.sfx('select');
      await UI.say(`${G.name} ha encendido el PC.`);
      while (true) {
        const tb = await UI.say('¿Qué quieres hacer?', { keep: true });
        const r = await UI.choose(['Sacar criatura', 'Dejar criatura', 'Apagar'], { cls: 'side' });
        UI.remove(tb);
        if (r === 0) {
          if (!G.box.length) { await UI.say('No hay criaturas guardadas en el PC.'); continue; }
          if (G.party.length >= 6) { await UI.say('Tu equipo está completo.'); continue; }
          const tb2 = await UI.say('¿Qué criatura quieres sacar?', { keep: true });
          const i = await UI.choose(G.box.map(c => ({ label: `${monName(c)}`, right: `Nv${c.lvl}` })), { cls: 'side scroll' });
          UI.remove(tb2);
          if (i >= 0) { const c = G.box.splice(i, 1)[0]; G.party.push(c); await UI.say(`¡${monName(c)} se ha unido a tu equipo!`); }
        } else if (r === 1) {
          if (G.party.length <= 1) { await UI.say('¡No puedes dejar a tu última criatura!'); continue; }
          const i = await UI.party('¿Qué criatura dejas en el PC?');
          if (i >= 0) {
            if (G.party.filter(c => c.hp > 0).length <= 1 && G.party[i].hp > 0) { await UI.say('¡Necesitas al menos una criatura que pueda luchar!'); continue; }
            const c = G.party.splice(i, 1)[0];
            healMon(c);
            G.box.push(c);
            await UI.say(`${monName(c)} se ha guardado en el PC.`);
          }
        } else break;
      }
    },

    async shop(n) {
      const money = UI.moneyBox();
      await UI.say('¡Hola! ¿En qué puedo ayudarte?');
      while (true) {
        const tb = await UI.say('¿Qué deseas?', { keep: true });
        const r = await UI.choose(['Comprar', 'Vender', 'Salir'], { cls: 'side' });
        UI.remove(tb);
        if (r === 0) {
          const list = SHOPS[n.shop];
          while (true) {
            const tb2 = await UI.say('¿Qué quieres comprar?', { keep: true });
            const i = await UI.choose(list.map(id => ({ label: ITEMS[id].n, icon: id, right: fmtMoney(ITEMS[id].price) })), { cls: 'shop-list' });
            UI.remove(tb2);
            if (i < 0) break;
            const id = list[i];
            const max = Math.min(99, Math.floor(G.money / ITEMS[id].price));
            if (max < 1) { await UI.say('No tienes suficiente dinero.'); continue; }
            const tb3 = await UI.say(`${ITEMS[id].n}. ¿Cuántas quieres?`, { keep: true });
            const q = await UI.quantity(max, ITEMS[id].price);
            UI.remove(tb3);
            if (!q) continue;
            G.money -= q * ITEMS[id].price;
            G.bag[id] = (G.bag[id] || 0) + q;
            money.update();
            Audio8.sfx('item');
            await UI.say(`¡Aquí tienes! ${q} × ${ITEMS[id].n}.`);
            if (id === 'capsula' && q >= 10) {
              G.bag.supercapsula = (G.bag.supercapsula || 0) + 1;
              await UI.say('¡Y de regalo, una Supercápsula por tu compra!');
            }
          }
        } else if (r === 1) {
          const id = await UI.bag();
          if (!id) continue;
          const price = Math.floor(ITEMS[id].price / 2);
          const tb3 = await UI.say(`Te doy ${fmtMoney(price)} por cada una. ¿Cuántas vendes?`, { keep: true });
          const q = await UI.quantity(G.bag[id], price);
          UI.remove(tb3);
          if (!q) continue;
          G.bag[id] -= q;
          G.money += q * price;
          money.update();
          Audio8.sfx('item');
        } else break;
      }
      money.close();
      await UI.say('¡Gracias! ¡Vuelve pronto!');
    },

    async guard1() {
      await UI.sayAll(['¡Alto! Solo los entrenadores con la Medalla Roca pueden seguir hacia el este.', 'Consíguela en el gimnasio de Ciudad Roble.']);
    },

    async giftLady() {
      if (flag('gift_charquito')) return UI.say('¿Cuidas bien de Charquito? ¡Me alegro mucho!');
      await UI.say('Tengo un Charquito, pero ya no puedo cuidarlo como se merece...');
      const r = await UI.ask('¿Quieres quedártelo?');
      if (r !== 0) return UI.say('Vaya... Si cambias de idea, aquí estaré.');
      const mon = makeMon('charquito', 10);
      G.dex.seen.charquito = true;
      G.dex.caught.charquito = true;
      G.flags.gift_charquito = true;
      Audio8.sfx('catch');
      if (G.party.length < 6) {
        G.party.push(mon);
        await UI.say(`¡${G.name} ha recibido a Charquito!`);
      } else {
        G.box.push(mon);
        await UI.say('¡Charquito ha sido enviado a tu PC!');
      }
      save();
    },

    async rival2() {
      if (flag('rival2')) return;
      const n = map.npcs.find(x => x.id === 'rival2');
      if (!n) return;
      emote = { npc: n, t: performance.now() };
      Audio8.sfx('encounter');
      await wait(700);
      emote = null;
      while (Math.abs(n.x - player.x) + Math.abs(n.y - player.y) > 1) {
        await npcStep(n, n.x > player.x ? 'left' : n.x < player.x ? 'right' : n.y > player.y ? 'up' : 'down');
      }
      player.dir = n.x > player.x ? 'right' : n.x < player.x ? 'left' : n.y > player.y ? 'down' : 'up';
      const res = await trainerBattle(n);
      if (res === 'win') {
        G.flags.rival2 = true;
        await UI.say(n.trainer.after);
        map.npcs = map.npcs.filter(x => x !== n);
        Audio8.sfx('door');
      }
    },

    async northGate() {
      if (!flag('badge2')) {
        await UI.say('Un cartel: «SANTUARIO. Solo pueden pasar los entrenadores con dos medallas».');
        player.dir = 'down';
        startStep(player.x, player.y + 1, WALK, false);
        await wait(260);
        return;
      }
      if (flag('rival3')) return;
      const n = map.npcs.find(x => x.id === 'rival3');
      if (!n) return;
      player.dir = 'up';
      if (n.x !== player.x) n.dir = n.x < player.x ? 'right' : 'left';
      await UI.say('Dani: ¡Espera! ¡No tan rápido!');
      const res = await trainerBattle(n);
      if (res !== 'win') return;
      G.flags.rival3 = true;
      G.flags.champion = true;
      map.npcs = map.npcs.filter(x => x !== n);
      Audio8.sfx('evolve');
      await UI.sayAll([
        'Dani: Increíble... Me has ganado de verdad. Supongo que ahora eres el entrenador número uno de Brisaluz.',
        'Dani: Pero no pienso rendirme. ¡Seguiré entrenando y algún día te ganaré!',
        'Dani: Por cierto... dicen que en el Santuario, aquí al norte, vive una criatura legendaria. ¡Ve tú primero!',
      ]);
      await ending();
    },

    async rival3(n) {
      player.dir = OPP[n.dir];
      return SCRIPTS.northGate();
    },

    async legend(o) {
      await UI.say('Una criatura resplandeciente te observa en silencio...');
      Audio8.sfx('cry');
      await UI.say('¡Kriiiiiiaaah!');
      const mon = makeMon(o.creature, 35);
      const result = await battleTransition(() => Battle.run({ wild: mon, env: 'shrine', arena: 'santuario', music: 'gym' }));
      if (result === 'caught' || result === 'win') {
        G.flags.legend = true;
        map.objects = map.objects.filter(x => x !== o);
        if (result === 'win') await UI.say('La criatura legendaria se ha desvanecido en un destello de luz...');
      }
      if (result === 'lose') await blackout();
      save();
    },
  };

  async function ending() {
    const caught = Object.keys(G.dex.caught).length;
    const layer = { el: UI.el('div', 'fullscreen ending', `
      <div class="end-title">¡ENHORABUENA!</div>
      <p>Has derrotado a los dos líderes de gimnasio y a tu rival.</p>
      <p><b>${UI.esc(G.name)}</b> es el nuevo campeón de Brisaluz.</p>
      <p>Criaturas capturadas: <b>${caught}/${DEX_ORDER.length}</b></p>
      <p class="muted">El Santuario ya está abierto... ¿Completarás el Criaturario?</p>
      <p class="blink">Pulsa A</p>`) };
    await new Promise(res => {
      layer.onButton = btn => { if (btn === 'a' || btn === 'b') { UI.remove(layer); res(); } };
      layer.el.addEventListener('click', () => layer.onButton('a'));
      UI.push(layer);
    });
    save();
  }

  // Muestra el sprite de una criatura en grande (al elegir inicial)
  let preview = null;
  async function showCreature(sp) {
    preview = sp;
    Audio8.sfx('cry');
  }
  function hideCreature() { preview = null; }

  /* ── Dibujo ───────────────────────── */
  function lerpPos(e) {
    if (!e.moving) return [e.x, e.y];
    const t = Math.min(1, e.t);
    return [e.fx + (e.tx - e.fx) * t, e.fy + (e.ty - e.fy) * t];
  }

  function render(ctx, now) {
    const [px, py] = lerpPos(player);
    const camX = Math.round(px * 16 + 8 - 120);
    const camY = Math.round(py * 16 + 8 - 80);
    const frame = Math.floor(now / 500) % 2;
    const outside = map.def.interior ? 'void' : map.def.dark ? 'cavewall' : 'tree';

    ctx.save();
    ctx.translate(-camX, -camY);
    const x0 = Math.floor(camX / 16) - 1, y0 = Math.floor(camY / 16) - 1;
    for (let y = y0; y < y0 + 12; y++) {
      for (let x = x0; x < x0 + 17; x++) {
        const t = tileAt(x, y) || outside;
        ctx.drawImage(Art.tile(t, x, y, frame), x * 16, y * 16);
      }
    }

    // Objetos del suelo
    for (const it of map.items) ctx.drawImage(Art.itemBall(), it.x * 16 + 2, it.y * 16 + 3);
    for (const o of map.objects) {
      if (o.species) ctx.drawImage(Art.capsule(0), o.x * 16 + 1, o.y * 16 + 1);
    }

    // Entidades ordenadas por profundidad
    const ents = [];
    for (const b of map.buildings) {
      ents.push({ y: (b.y + b.k.h) * 16, draw: () => { const img = Art.building(b.kind); ctx.drawImage(img, b.x * 16 - 1, (b.y + b.k.h) * 16 - img.height + 1); } });
    }
    for (const o of map.objects) {
      if (!o.creature) continue;
      ents.push({ y: (o.y + 1) * 16, draw: () => {
        const img = Art.creature(o.creature, 'front');
        const bob = Math.sin(now / 400) * 2;
        ctx.drawImage(img, o.x * 16 + 8 - img.width / 2, (o.y + 1) * 16 - img.height + bob);
      } });
    }
    for (const n of map.npcs) {
      const [nx, ny] = lerpPos(n);
      ents.push({ y: ny * 16 + 16, draw: () => drawChar(ctx, LOOKS[n.look], n, nx, ny, 0) });
    }
    ents.push({ y: py * 16 + 16.5, draw: () => {
      const hop = player.jump ? Math.sin(Math.min(1, player.t) * Math.PI) * 8 : 0;
      drawChar(ctx, LOOKS.player, player, px, py, hop);
    } });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.draw();

    if (emote) {
      const [ex, ey] = lerpPos(emote.npc);
      const bx = ex * 16 + 3, by = ey * 16 - 16;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 10, 12);
      ctx.fillStyle = '#2a1a14';
      ctx.fillRect(bx, by, 10, 1); ctx.fillRect(bx, by + 11, 10, 1); ctx.fillRect(bx, by, 1, 12); ctx.fillRect(bx + 9, by, 1, 12);
      ctx.fillStyle = '#d8433a';
      ctx.fillRect(bx + 4, by + 2, 2, 5); ctx.fillRect(bx + 4, by + 8, 2, 2);
    }
    ctx.restore();

    if (map.def.dark) {
      const g = ctx.createRadialGradient(120, 84, 30, 120, 84, 150);
      g.addColorStop(0, 'rgba(10,6,4,0)');
      g.addColorStop(1, 'rgba(10,6,4,0.75)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 240, 160);
    }

    if (preview) {
      ctx.fillStyle = 'rgba(255,250,235,0.92)';
      ctx.fillRect(72, 18, 96, 84);
      ctx.strokeStyle = '#2a1a14';
      ctx.strokeRect(72.5, 18.5, 95, 83);
      const img = Art.creature(preview, 'front');
      ctx.drawImage(img, 120 - img.width / 2, 98 - img.height);
    }

    if (fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, 240, 160);
    }
  }

  function drawChar(ctx, look, e, x, y, hop) {
    const walking = e.moving && e.t > 0.25 && e.t < 0.75;
    const f = walking ? 1 + ((e.foot ?? (e.x + e.y)) & 1) : 0;
    const img = Art.character(look, e.dir, f);
    const sx = Math.round(x * 16 + 8 - img.width / 2);
    const sy = Math.round(y * 16 + 16 - img.height - 1 - hop);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(Math.round(x * 16 + 3), Math.round(y * 16 + 13), 10, 3);
    ctx.drawImage(img, sx, sy);
    // Las piernas quedan ocultas por la hierba alta
    const tx = Math.round(x), ty = Math.round(y);
    if (!e.moving && tileAt(tx, ty) === 'tall') {
      ctx.drawImage(Art.tile('tall', tx, ty), 0, 9, 16, 7, tx * 16, ty * 16 + 9, 16, 7);
    }
  }

  function press(btn) {
    if (btn === 'a') return interact();
    if (btn === 'start' && !busy && !player.moving && !UI.busy()) return run(startMenu);
  }

  /* ── Menú de pausa ────────────────── */
  async function startMenu() {
    Audio8.sfx('select');
    let last = 0;
    while (true) {
      const opts = [];
      if (G.flags.dex) opts.push(['CRIATURARIO', 'dex']);
      if (G.party.length) opts.push(['CRIATURAS', 'party']);
      opts.push(['MOCHILA', 'bag'], [G.name.toUpperCase(), 'card'], ['GUARDAR', 'save'], [Audio8.isMuted() ? 'SONIDO: NO' : 'SONIDO: SÍ', 'sound']);
      if (window.Battle3D) opts.push([window.Battle3D.enabled ? 'COMBATES: 3D' : 'COMBATES: 2D', 'gfx']);
      opts.push(['SALIR', 'exit']);
      const r = await UI.choose(opts.map(o => o[0]), { cls: 'start-menu', start: Math.min(last, opts.length - 1) });
      if (r < 0 || opts[r][1] === 'exit') return;
      last = r;
      const act = opts[r][1];
      if (act === 'dex') await UI.dex();
      if (act === 'party') await UI.party('Elige una criatura.', 'view');
      if (act === 'bag') await bagMenu();
      if (act === 'card') await trainerCard();
      if (act === 'save') {
        const yes = await UI.ask('¿Quieres guardar la partida?');
        if (yes === 0) { save(); Audio8.sfx('levelup'); await UI.say(`${G.name} ha guardado la partida.`); }
      }
      if (act === 'sound') Audio8.toggleMute();
      if (act === 'gfx') window.Battle3D.setEnabled(!window.Battle3D.enabled);
    }
  }

  async function bagMenu() {
    while (true) {
      const id = await UI.bag();
      if (!id) return;
      const it = ITEMS[id];
      if (it.ball) { await UI.say('¡Ahora no puedes usar eso!'); continue; }
      const t = await UI.party(`¿En quién usar ${it.n}?`);
      if (t < 0) continue;
      const c = G.party[t];
      const max = maxHp(c);
      let msg = null;
      if (it.revive && c.hp <= 0) { c.hp = Math.floor(max * it.revive); msg = `¡${monName(c)} se ha recuperado!`; }
      else if (it.heal && c.hp > 0 && c.hp < max) { const b = c.hp; c.hp = Math.min(max, c.hp + it.heal); msg = `${monName(c)} ha recuperado ${c.hp - b} PS.`; }
      else if (it.cure && c.hp > 0 && c.status && (it.cure === 'all' || it.cure === c.status)) { c.status = null; c.sleep = 0; msg = `${monName(c)} ya se encuentra bien.`; }
      if (!msg) { await UI.say('No tendría ningún efecto.'); continue; }
      G.bag[id]--;
      Audio8.sfx('heal');
      await UI.say(msg);
    }
  }

  async function trainerCard() {
    const badges = [['badge1', 'Roca', '#9a8f80'], ['badge2', 'Voltio', '#f2d23a']];
    const mins = Math.floor((G.playTime || 0) / 60);
    const layer = { el: UI.el('div', 'fullscreen card', `
      <div class="card-head">FICHA DE ENTRENADOR</div>
      <div class="card-body">
        <div>
          <div>Nombre: <b>${UI.esc(G.name)}</b></div>
          <div>Dinero: <b>${fmtMoney(G.money)}</b></div>
          <div>Criaturario: <b>${Object.keys(G.dex.caught).length}</b></div>
          <div>Tiempo: <b>${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}</b></div>
        </div>
        <canvas class="card-sprite" width="16" height="18"></canvas>
      </div>
      <div class="badges">${badges.map(([f, n, c]) => `<div class="badge-slot ${flag(f) ? 'got' : ''}"><span style="background:${flag(f) ? c : 'transparent'}"></span>${n}</div>`).join('')}</div>`) };
    layer.el.querySelector('.card-sprite').getContext('2d').drawImage(Art.character(LOOKS.player, 'down', 0), 1, 0);
    await new Promise(res => {
      layer.onButton = btn => { if (btn === 'a' || btn === 'b') { Audio8.sfx('back'); UI.remove(layer); res(); } };
      layer.el.addEventListener('click', () => layer.onButton('b'));
      UI.push(layer);
    });
  }

  return {
    load, update, render, press, startMenu,
    get player() { return player; }, get map() { return map; }, get busy() { return busy; },
    scripts: SCRIPTS, trainerBattle, blackout,
  };
})();
