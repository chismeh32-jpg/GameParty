'use strict';

/* ══════════════════════════════════════
   COMBATE POR TURNOS
══════════════════════════════════════ */
const Battle = (() => {
  let scene = null;   // estado visual que dibuja render()
  let hud = null;     // elementos DOM del marcador

  const wait = ms => new Promise(r => setTimeout(r, ms));
  function anim(ms, step) {
    return new Promise(res => {
      const t0 = performance.now();
      const f = now => {
        const p = Math.min(1, (now - t0) / ms);
        step(p);
        if (p < 1) requestAnimationFrame(f); else res();
      };
      requestAnimationFrame(f);
    });
  }

  /* ── Marcadores (DOM) ─────────────── */
  function buildHud() {
    const root = document.getElementById('ui');
    const wrap = UI.el('div', 'battle-hud');
    wrap.innerHTML = `
      <div class="bbox foe hidden"><div class="bname"></div><div class="blvl"></div><div class="bstatus"></div><div class="bhp"><span>PS</span><div class="hp-track"><div class="hp-fill"></div></div></div></div>
      <div class="bbox me hidden"><div class="bname"></div><div class="blvl"></div><div class="bstatus"></div><div class="bhp"><span>PS</span><div class="hp-track"><div class="hp-fill"></div></div></div><div class="bhpnum"></div><div class="bexp"><div></div></div></div>
      <div class="balls hidden"></div>`;
    root.appendChild(wrap);
    return {
      wrap,
      foe: wrap.querySelector('.bbox.foe'),
      me: wrap.querySelector('.bbox.me'),
      balls: wrap.querySelector('.balls'),
    };
  }

  function hpColor(f) { return f > 0.5 ? 'var(--hp-good)' : f > 0.2 ? 'var(--hp-mid)' : 'var(--hp-low)'; }

  function updateBox(side, hpOverride) {
    const box = side.isPlayer ? hud.me : hud.foe;
    const c = side.mon;
    if (!c) return box.classList.add('hidden');
    box.classList.remove('hidden');
    const max = maxHp(c);
    const hp = hpOverride ?? c.hp;
    box.querySelector('.bname').textContent = monName(c);
    box.querySelector('.blvl').textContent = `Nv${c.lvl}`;
    box.querySelector('.bstatus').innerHTML = c.status ? `<span class="badge" style="background:${STATUS[c.status].color}">${STATUS[c.status].name}</span>` : '';
    const fill = box.querySelector('.hp-fill');
    fill.style.width = `${(hp / max) * 100}%`;
    fill.style.background = hpColor(hp / max);
    if (side.isPlayer) {
      box.querySelector('.bhpnum').textContent = `${Math.max(0, Math.round(hp))}/${max}`;
      box.querySelector('.bexp div').style.width = `${expProgress(c) * 100}%`;
    }
  }

  function tweenHp(side, from, to) {
    const ms = Math.min(900, 250 + Math.abs(from - to) * 12);
    return anim(ms, p => updateBox(side, from + (to - from) * p));
  }

  function showBalls(party) {
    hud.balls.classList.remove('hidden');
    hud.balls.innerHTML = Array.from({ length: 6 }, (_, i) => {
      const c = party[i];
      return `<span class="pball ${!c ? 'none' : c.hp <= 0 ? 'down' : ''}"></span>`;
    }).join('');
  }

  /* ── Utilidades de combate ────────── */
  const stageMult = s => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));
  function effStat(side, key) {
    let v = stats(side.mon)[key] * stageMult(side.stages[key]);
    if (key === 'spe' && side.mon.status === 'par') v *= 0.5;
    return Math.max(1, Math.floor(v));
  }
  const freshStages = () => ({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });

  function label(side, capital = true) {
    const n = monName(side.mon);
    if (side.isPlayer) return n;
    const s = scene.wild ? `${n} salvaje` : `${n} enemigo`;
    return capital ? `El ${s}` : `el ${s}`;
  }

  // "de Brasito" / "del Roedín salvaje"
  function ofLabel(side) {
    if (side.isPlayer) return `de ${monName(side.mon)}`;
    return `del ${monName(side.mon)} ${scene.wild ? 'salvaje' : 'enemigo'}`;
  }

  function calcDamage(att, def, moveId) {
    const mv = MOVES[moveId];
    const physical = mv.c === 'phys';
    const A = effStat(att, physical ? 'atk' : 'spa');
    const D = effStat(def, physical ? 'def' : 'spd');
    const crit = Math.random() < (mv.crit ? 1 / 8 : 1 / 16);
    const base = Math.floor(Math.floor((Math.floor((2 * att.mon.lvl) / 5 + 2) * mv.p * A) / D) / 50) + 2;
    const stab = !mv.typeless && SPECIES[att.mon.sp].types.includes(mv.t) ? 1.5 : 1;
    const eff = mv.typeless ? 1 : typeEffect(mv.t, SPECIES[def.mon.sp].types);
    const burn = att.mon.status === 'brn' && physical ? 0.5 : 1;
    const rnd = (85 + Math.floor(Math.random() * 16)) / 100;
    let dmg = Math.floor(base * (crit ? 1.5 : 1) * stab * eff * burn * rnd);
    if (eff > 0) dmg = Math.max(1, dmg);
    return { dmg, crit, eff };
  }

  function canInflict(target, st) {
    if (target.mon.status || target.mon.hp <= 0) return false;
    const types = SPECIES[target.mon.sp].types;
    if (st === 'brn' && types.includes('fuego')) return false;
    if (st === 'psn' && types.includes('veneno')) return false;
    if (st === 'par' && types.includes('electrico')) return false;
    return true;
  }

  const STATUS_MSG = {
    psn: n => `¡${n} ha sido envenenado!`,
    brn: n => `¡${n} se ha quemado!`,
    par: n => `¡${n} está paralizado! Quizás no pueda moverse.`,
    slp: n => `¡${n} se ha dormido!`,
  };

  async function inflict(target, st) {
    target.mon.status = st;
    if (st === 'slp') target.mon.sleep = randInt(1, 3);
    updateBox(target);
    await say(STATUS_MSG[st](label(target)));
  }

  async function changeStages(side, changes) {
    for (const [k, v] of Object.entries(changes)) {
      const cur = side.stages[k];
      const next = Math.max(-6, Math.min(6, cur + v));
      if (next === cur) {
        await say(`¡${STAT_NAMES[k]} ${ofLabel(side)} no puede ${v > 0 ? 'subir' : 'bajar'} más!`);
        continue;
      }
      side.stages[k] = next;
      scene.fx = { type: v > 0 ? 'up' : 'down', target: side.isPlayer ? 'me' : 'foe', t: performance.now() };
      await wait(350);
      const how = Math.abs(v) > 1 ? (v > 0 ? 'subió mucho' : 'bajó mucho') : v > 0 ? 'subió' : 'bajó';
      await say(`¡${STAT_NAMES[k]} ${ofLabel(side)} ${how}!`);
    }
  }

  const say = (t, o) => UI.say(t, o);

  /* ── Animaciones de la escena ─────── */
  async function attackAnim(att, def, mv) {
    const me = att.isPlayer ? scene.me : scene.foe;
    const dir = att.isPlayer ? 1 : -1;
    const from = att.isPlayer ? 'me' : 'foe';
    // Evento que la escena 3D convierte en un efecto propio de cada tipo
    scene.attack = { type: mv.t, cat: mv.c, from, targetFoe: !!(mv.foe || mv.inflict), t: performance.now() };
    Audio8.attack(mv.t, mv.c);
    if (mv.c === 'phys') {
      await anim(140, p => { me.dx = dir * 14 * p; me.dy = -dir * 6 * p; });
      await anim(140, p => { me.dx = dir * 14 * (1 - p); me.dy = -dir * 6 * (1 - p); });
      if (scene.use3d) await wait(120);
    } else if (mv.c === 'spec') {
      scene.proj = { color: TYPES[mv.t].color, type: mv.t, from, p: 0 };
      await anim(scene.use3d ? 700 : 320, p => { scene.proj.p = p; });
      scene.proj = null;
    } else {
      scene.fx = { type: 'sparkle', target: from, t: performance.now() };
      await wait(scene.use3d ? 650 : 380);
    }
    void def;
  }

  async function hitAnim(side, eff) {
    Audio8.sfx(eff > 1 ? 'super' : eff < 1 ? 'weak' : 'hit');
    const s = side.isPlayer ? scene.me : scene.foe;
    scene.hit = { target: side.isPlayer ? 'me' : 'foe', eff, t: performance.now() };
    if (scene.use3d) { await wait(320); return; }
    for (let i = 0; i < 4; i++) { s.hidden = !s.hidden; await wait(70); }
    s.hidden = false;
  }

  async function faintAnim(side) {
    Audio8.sfx('faint');
    const s = side.isPlayer ? scene.me : scene.foe;
    scene.faint = { target: side.isPlayer ? 'me' : 'foe', t: performance.now() };
    await anim(scene.use3d ? 650 : 380, p => { s.dy = p * 40; s.alpha = 1 - p; });
    s.sp = null;
    s.dy = 0;
    s.alpha = 1;
  }

  async function sendOut(side, idx) {
    side.idx = idx;
    side.mon = side.party[idx];
    side.stages = freshStages();
    const s = side.isPlayer ? scene.me : scene.foe;
    if (side.isPlayer && !scene.playerOut) {
      scene.playerOut = true;
      if (scene.use3d) await wait(450);  // el entrenador lanza la cápsula
    }
    s.sp = side.mon.sp;
    s.alpha = 0;
    s.scale = 0.2;
    Audio8.sfx('ball');
    await anim(260, p => { s.alpha = p; s.scale = 0.2 + 0.8 * p; });
    Audio8.cry(side.mon.sp);
    G.dex.seen[side.mon.sp] = true;
    updateBox(side);
  }

  async function withdraw(side) {
    const s = side.isPlayer ? scene.me : scene.foe;
    await anim(220, p => { s.alpha = 1 - p; s.scale = 1 - 0.8 * p; });
    s.sp = null;
    s.scale = 1;
    s.alpha = 1;
  }

  /* ── Acciones ─────────────────────── */
  async function useMove(att, def, moveIdx) {
    const mon = att.mon;
    if (mon.hp <= 0) return;
    if (mon.status === 'slp') {
      mon.sleep--;
      if (mon.sleep > 0) { await say(`${label(att)} está profundamente dormido.`); return; }
      mon.status = null;
      updateBox(att);
      await say(`¡${label(att)} se ha despertado!`);
    }
    if (mon.status === 'par' && Math.random() < 0.25) {
      await say(`¡${label(att)} está paralizado! No se puede mover.`);
      return;
    }
    const slot = moveIdx >= 0 ? mon.moves[moveIdx] : null;
    const moveId = slot ? slot.id : 'forcejeo';
    if (slot) slot.pp = Math.max(0, slot.pp - 1);
    const mv = MOVES[moveId];
    await say(`¡${label(att)} usó ${mv.n}!`, { fast: true });

    if (mv.a && Math.random() * 100 >= mv.a) {
      await say(`¡Pero ${label(att, false)} ha fallado!`);
      return;
    }

    if (mv.c === 'status') {
      await attackAnim(att, def, mv);
      if (mv.self) await changeStages(att, mv.self);
      if (mv.foe) await changeStages(def, mv.foe);
      if (mv.inflict) {
        if (canInflict(def, mv.inflict)) await inflict(def, mv.inflict);
        else await say('¡Pero no ha tenido efecto!');
      }
      if (mv.heal) {
        const max = maxHp(mon);
        if (mon.hp >= max) await say('¡Pero no ha tenido efecto!');
        else {
          const before = mon.hp;
          mon.hp = Math.min(max, mon.hp + Math.floor(max * mv.heal));
          await tweenHp(att, before, mon.hp);
          await say(`${label(att)} ha recuperado salud.`);
        }
      }
      return;
    }

    const { dmg, crit, eff } = calcDamage(att, def, moveId);
    await attackAnim(att, def, mv);
    if (eff === 0) {
      await say(`No afecta ${def.isPlayer ? 'a ' + monName(def.mon) : `al ${monName(def.mon)} ${scene.wild ? 'salvaje' : 'enemigo'}`}...`);
      return;
    }
    const before = def.mon.hp;
    def.mon.hp = Math.max(0, def.mon.hp - dmg);
    await hitAnim(def, eff);
    await tweenHp(def, before, def.mon.hp);
    if (crit) await say('¡Un golpe crítico!');
    if (eff > 1) await say('¡Es muy eficaz!');
    else if (eff < 1) await say('No es muy eficaz...');

    const dealt = before - def.mon.hp;
    if (mv.drain && dealt > 0 && mon.hp < maxHp(mon)) {
      const b = mon.hp;
      mon.hp = Math.min(maxHp(mon), mon.hp + Math.max(1, Math.floor(dealt * mv.drain)));
      await tweenHp(att, b, mon.hp);
      await say(`¡${label(att)} absorbió energía!`);
    }
    if (mv.recoil && dealt > 0) {
      const b = mon.hp;
      mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(dealt * mv.recoil)));
      await tweenHp(att, b, mon.hp);
      await say(`${label(att)} se ha hecho daño con el retroceso.`);
    }
    if (def.mon.hp > 0) {
      if (mv.status && Math.random() * 100 < mv.status[1] && canInflict(def, mv.status[0])) await inflict(def, mv.status[0]);
      if (mv.foeChance && Math.random() * 100 < mv.foeChance[1]) await changeStages(def, mv.foeChance[0]);
    }
  }

  async function endOfTurn(side) {
    const m = side.mon;
    if (!m || m.hp <= 0) return;
    if (m.status === 'psn' || m.status === 'brn') {
      const dmg = Math.max(1, Math.floor(maxHp(m) / (m.status === 'psn' ? 8 : 16)));
      const before = m.hp;
      m.hp = Math.max(0, m.hp - dmg);
      await say(m.status === 'psn' ? `${label(side)} sufre por el veneno.` : `${label(side)} se resiente de la quemadura.`);
      await hitAnim(side, 1);
      await tweenHp(side, before, m.hp);
    }
  }

  function aiChoose(side, target) {
    const usable = side.mon.moves.map((m, i) => ({ m, i })).filter(x => x.m.pp > 0);
    if (!usable.length) return -1;
    if (scene.wild || Math.random() < 0.2) return usable[Math.floor(Math.random() * usable.length)].i;
    let best = usable[0], bestScore = -1;
    for (const x of usable) {
      const mv = MOVES[x.m.id];
      let score;
      if (mv.c === 'status') {
        score = 15;
        if (mv.inflict) score = canInflict(target, mv.inflict) ? 45 : 0;
        if (mv.self && Object.keys(mv.self).some(k => side.stages[k] >= 2)) score = 2;
        if (mv.foe && Object.keys(mv.foe).some(k => target.stages[k] <= -2)) score = 2;
        if (mv.heal) score = side.mon.hp < maxHp(side.mon) / 2 ? 60 : 0;
      } else {
        const eff = typeEffect(mv.t, SPECIES[target.mon.sp].types);
        const stab = SPECIES[side.mon.sp].types.includes(mv.t) ? 1.5 : 1;
        score = mv.p * eff * stab * ((mv.a || 100) / 100);
      }
      score *= 0.85 + Math.random() * 0.3;
      if (score > bestScore) { bestScore = score; best = x; }
    }
    return best.i;
  }

  /* ── Experiencia y movimientos ────── */
  async function learnMove(c, moveId) {
    const mv = MOVES[moveId];
    if (c.moves.length < 4) {
      c.moves.push({ id: moveId, pp: mv.pp });
      Audio8.sfx('levelup');
      await say(`¡${monName(c)} ha aprendido ${mv.n}!`);
      return;
    }
    while (true) {
      await say(`${monName(c)} quiere aprender ${mv.n}, pero ya conoce cuatro movimientos.`);
      const yes = await UI.ask(`¿Quieres que olvide un movimiento para aprender ${mv.n}?`);
      if (yes === 0) {
        const tb = await UI.say('¿Qué movimiento debería olvidar?', { keep: true });
        const r = await UI.choose(c.moves.map(m => ({ label: MOVES[m.id].n, right: `${MOVES[m.id].pp}PP` })), { cls: 'forget' });
        UI.remove(tb);
        if (r >= 0) {
          const old = MOVES[c.moves[r].id].n;
          c.moves[r] = { id: moveId, pp: mv.pp };
          await say(`1, 2 y... ¡Puf! ${monName(c)} ha olvidado ${old}.`);
          Audio8.sfx('levelup');
          await say(`¡Y ha aprendido ${mv.n}!`);
          return;
        }
      }
      const stop = await UI.ask(`¿Dejar de aprender ${mv.n}?`);
      if (stop === 0) { await say(`${monName(c)} no ha aprendido ${mv.n}.`); return; }
    }
  }

  async function grantExp(foeMon) {
    const alive = [...scene.participants].map(uid => G.party.find(c => c.uid === uid)).filter(c => c && c.hp > 0);
    if (!alive.length) return;
    const total = expGain(foeMon, !scene.wild);
    const each = Math.max(1, Math.floor(total / alive.length));
    for (const c of alive) {
      if (c.lvl >= MAX_LEVEL) continue;
      await say(`¡${monName(c)} ha ganado ${each} puntos de experiencia!`, { fast: true });
      const events = addExp(c, each);
      if (c === scene.player.mon) updateBox(scene.player);
      for (const ev of events) {
        if (ev.type === 'level') {
          Audio8.sfx('levelup');
          if (c === scene.player.mon) updateBox(scene.player);
          await say(`¡${monName(c)} ha subido al nivel ${ev.lvl}!`);
          scene.leveled.add(c.uid);
        } else if (ev.type === 'move') {
          await learnMove(c, ev.move);
        }
      }
    }
  }

  /* ── Captura ──────────────────────── */
  async function throwBall(ball) {
    const foe = scene.foe;
    const mon = scene.enemy.mon;
    G.bag[ball]--;
    await say(`¡${G.name} lanzó una ${ITEMS[ball].n}!`, { fast: true });
    Audio8.sfx('ball');
    scene.ball = { x: 40, y: 120, open: 0, visible: true, kind: ball };
    await anim(450, p => { scene.ball.x = 40 + (176 - 40) * p; scene.ball.y = 120 - Math.sin(p * Math.PI) * 70 + (40 - 120) * p; });
    scene.ball.open = 3;
    await anim(250, p => { foe.scale = 1 - p; foe.alpha = 1 - p; });
    scene.ball.open = 0;
    await anim(250, p => { scene.ball.y = 40 + 22 * p; });

    const max = maxHp(mon);
    const bonus = mon.status === 'slp' ? 2 : mon.status ? 1.5 : 1;
    const a = ((3 * max - 2 * mon.hp) * SPECIES[mon.sp].rate * ITEMS[ball].ball * bonus) / (3 * max);
    const p = Math.min(1, a / 255);
    const caught = Math.random() < p;
    let shakes = 3;
    if (!caught) { shakes = 0; while (shakes < 3 && Math.random() < Math.pow(p, 0.25)) shakes++; }
    for (let i = 0; i < shakes; i++) {
      await wait(350);
      Audio8.sfx('shake');
      await anim(300, q => { scene.ball.rot = Math.sin(q * Math.PI * 2) * 0.5; });
      scene.ball.rot = 0;
    }
    await wait(300);
    if (caught) {
      Audio8.sfx('catch');
      scene.ball.caught = true;
      await say(`¡Genial! ¡Has capturado a ${SPECIES[mon.sp].n}!`);
      G.dex.caught[mon.sp] = true;
      G.dex.seen[mon.sp] = true;
      mon.status = mon.status === 'slp' ? null : mon.status;
      if (G.party.length < 6) G.party.push(mon);
      else {
        G.box.push(mon);
        await say(`${SPECIES[mon.sp].n} ha sido enviado al PC.`);
      }
      return true;
    }
    scene.ball = null;
    Audio8.sfx('ball');
    await anim(250, q => { foe.scale = q; foe.alpha = q; });
    await say(['¡Oh, no! ¡La criatura se ha escapado!', '¡Vaya! ¡Parecía que la habías atrapado!', '¡Argh! ¡Casi lo consigues!', '¡Mecachis! ¡Por poco!'][shakes]);
    return false;
  }

  /* ── Objetos en combate ───────────── */
  async function useItemOn(id, c) {
    const it = ITEMS[id];
    const max = maxHp(c);
    if (it.revive) {
      if (c.hp > 0) return false;
      c.hp = Math.floor(max * it.revive);
      G.bag[id]--;
      await say(`¡${monName(c)} se ha recuperado!`);
      return true;
    }
    if (c.hp <= 0) return false;
    if (it.heal) {
      if (c.hp >= max) return false;
      const before = c.hp;
      c.hp = Math.min(max, c.hp + it.heal);
      G.bag[id]--;
      Audio8.sfx('heal');
      if (c === scene.player.mon) await tweenHp(scene.player, before, c.hp);
      await say(`${monName(c)} ha recuperado ${c.hp - before} PS.`);
      return true;
    }
    if (it.cure) {
      if (!c.status || (it.cure !== 'all' && it.cure !== c.status)) return false;
      c.status = null;
      c.sleep = 0;
      G.bag[id]--;
      if (c === scene.player.mon) updateBox(scene.player);
      await say(`${monName(c)} ya se encuentra bien.`);
      return true;
    }
    return false;
  }

  /* ── Elección del jugador ─────────── */
  async function chooseAction() {
    const me = scene.player;
    while (true) {
      const tb = await UI.say(`¿Qué hará ${monName(me.mon)}?`, { keep: true, cls: "narrow" });
      const act = await UI.choose(['LUCHAR', 'MOCHILA', 'EQUIPO', 'HUIR'], { cls: 'battle-actions', cols: 2, cancel: false });
      UI.remove(tb);
      if (act === 0) {
        if (!me.mon.moves.some(m => m.pp > 0)) {
          await say(`¡A ${monName(me.mon)} no le quedan movimientos!`);
          return { type: 'move', idx: -1 };
        }
        const info = UI.el('div', 'move-info');
        document.getElementById('ui').appendChild(info);
        const opts = me.mon.moves.map(m => ({ label: MOVES[m.id].n, disabled: m.pp <= 0 }));
        const r = await UI.choose(opts, {
          cls: 'battle-moves', cols: 2,
          onMove: i => {
            const m = me.mon.moves[i];
            const mv = MOVES[m.id];
            const eff = mv.c === 'status' ? null : typeEffect(mv.t, SPECIES[scene.enemy.mon.sp].types);
            info.innerHTML = `PP ${m.pp}/${mv.pp}<br><span class="type" style="background:${TYPES[mv.t].color}">${TYPES[mv.t].name}</span>` +
              (eff === null ? '' : `<br><small>${eff > 1 ? 'Muy eficaz' : eff === 0 ? 'Sin efecto' : eff < 1 ? 'Poco eficaz' : 'Normal'}</small>`);
          },
        });
        info.remove();
        if (r === -1) continue;
        return { type: 'move', idx: r };
      }
      if (act === 1) {
        const id = await UI.bag(it => it.heal || it.cure || it.revive || (it.ball && scene.wild));
        if (!id) continue;
        if (ITEMS[id].ball) {
          if (!scene.wild) { await say('¡No puedes capturar la criatura de otro entrenador!'); continue; }
          return { type: 'ball', id };
        }
        const t = await UI.party(`¿En quién usar ${ITEMS[id].n}?`);
        if (t < 0) continue;
        return { type: 'item', id, target: G.party[t] };
      }
      if (act === 2) {
        const t = await UI.party('¿Qué criatura sacas?', 'pick', c => (c.hp <= 0 ? 'No le quedan fuerzas para luchar.' : c === me.mon ? '¡Ya está combatiendo!' : null));
        if (t < 0) continue;
        return { type: 'switch', idx: t };
      }
      if (act === 3) {
        if (!scene.wild) { await say('¡No puedes huir de un combate contra un entrenador!'); continue; }
        return { type: 'run' };
      }
    }
  }

  async function forcedSwitch() {
    while (true) {
      const t = await UI.party('Elige la siguiente criatura.', 'pick', c => (c.hp <= 0 ? 'No le quedan fuerzas para luchar.' : null));
      if (t >= 0) return t;
    }
  }

  /* ── Bucle principal del combate ──── */
  // opts: { wild: mon } | { trainer: { name, party, prize, look } }, env, noBlackout
  async function run(opts) {
    const wild = !!opts.wild;
    const firstIdx = G.party.findIndex(c => c.hp > 0);
    if (firstIdx < 0) return 'lose';
    scene = {
      wild, env: opts.env || 'grass', arena: opts.arena || 'pradera', t0: performance.now(), use3d: false, playerOut: false,
      me: { sp: null, alpha: 1, scale: 1, dx: 0, dy: 0 },
      foe: { sp: null, alpha: 1, scale: 1, dx: 0, dy: 0 },
      trainerLook: opts.trainer?.look || null, trainerX: opts.trainer ? 0 : null,
      participants: new Set(), leveled: new Set(), fx: null, proj: null, ball: null,
    };
    hud = buildHud();
    const player = { isPlayer: true, party: G.party, idx: firstIdx, mon: null, stages: freshStages() };
    const enemyParty = wild ? [opts.wild] : opts.trainer.party;
    const enemy = { isPlayer: false, party: enemyParty, idx: 0, mon: null, stages: freshStages() };
    scene.player = player;
    scene.enemy = enemy;
    Audio8.play(opts.music || (wild ? 'battle' : 'gym'));

    let result = null;
    try {
      // Escena 3D si el dispositivo puede y los modelos cargan a tiempo
      scene.intro = 1;
      const B3 = window.Battle3D;
      if (B3 && B3.available) {
        const species = new Set([...G.party, ...enemyParty].flatMap(c => [c.sp, SPECIES[c.sp].evo?.[0]].filter(Boolean)));
        const ok = await Promise.race([
          B3.prepare({ arena: scene.arena, species: [...species], trainers: opts.trainer?.look ? [opts.trainer.look] : [], balls: ['capsula', 'supercapsula', 'ultracapsula'] }),
          wait(5000).then(() => false),
        ]);
        if (ok) {
          try { await B3.begin(scene); scene.use3d = true; } catch (e) { console.warn('Combate 3D no disponible', e); }
        }
      }
      // Presentación
      await anim(scene.use3d ? 1100 : 400, p => { scene.intro = 1 - p; });
      scene.intro = 0;
      if (wild) {
        await sendOut(enemy, 0);
        await say(`¡Un ${SPECIES[opts.wild.sp].n} salvaje apareció!`);
      } else {
        showBalls(enemyParty);
        await say(`¡${opts.trainer.name} quiere luchar!`);
        hud.balls.classList.add('hidden');
        await anim(300, p => { scene.trainerX = p; });
        scene.trainerLook = null;
        await say(`¡${opts.trainer.name} saca a ${monName(enemyParty[0])}!`, { fast: true });
        await sendOut(enemy, 0);
      }
      await say(`¡Adelante, ${monName(G.party[firstIdx])}!`, { fast: true });
      await sendOut(player, firstIdx);
      scene.participants.add(player.mon.uid);

      let runAttempts = 0;
      while (!result) {
        const action = await chooseAction();
        const foeMove = aiChoose(enemy, player);
        let foeActs = true;

        if (action.type === 'run') {
          runAttempts++;
          const ps = effStat(player, 'spe'), fs = effStat(enemy, 'spe');
          const odds = ((ps * 128) / Math.max(1, fs) + 30 * runAttempts) / 256;
          if (ps >= fs || Math.random() < odds) {
            Audio8.sfx('door');
            await say('¡Escapaste sin problemas!');
            result = 'run';
            break;
          }
          await say('¡No has podido escapar!');
        } else if (action.type === 'switch') {
          await say(`¡Vuelve, ${monName(player.mon)}!`, { fast: true });
          await withdraw(player);
          await say(`¡Adelante, ${monName(G.party[action.idx])}!`, { fast: true });
          await sendOut(player, action.idx);
          scene.participants.add(player.mon.uid);
        } else if (action.type === 'item') {
          const ok = await useItemOn(action.id, action.target);
          if (!ok) { await say('No tendría ningún efecto.'); continue; }
        } else if (action.type === 'ball') {
          if (await throwBall(action.id)) { result = 'caught'; break; }
        } else if (action.type === 'move') {
          // Orden: prioridad y luego velocidad
          const myMove = action.idx >= 0 ? MOVES[player.mon.moves[action.idx].id] : MOVES.forcejeo;
          const theirMove = foeMove >= 0 ? MOVES[enemy.mon.moves[foeMove].id] : MOVES.forcejeo;
          const myPrio = myMove.prio || 0, theirPrio = theirMove.prio || 0;
          const ps = effStat(player, 'spe'), fs = effStat(enemy, 'spe');
          const meFirst = myPrio !== theirPrio ? myPrio > theirPrio : ps !== fs ? ps > fs : Math.random() < 0.5;
          const order = meFirst ? [[player, enemy, action.idx], [enemy, player, foeMove]] : [[enemy, player, foeMove], [player, enemy, action.idx]];
          for (const [a, d, m] of order) {
            if (a.mon.hp <= 0 || d.mon.hp <= 0) continue;
            await useMove(a, d, m);
            if (player.mon.hp <= 0 || enemy.mon.hp <= 0) break;
          }
          foeActs = false;
        }

        if (foeActs && enemy.mon.hp > 0 && player.mon.hp > 0) await useMove(enemy, player, foeMove);

        // Fin de turno
        for (const side of [player, enemy]) await endOfTurn(side);

        // Debilitados
        if (enemy.mon.hp <= 0) {
          await faintAnim(enemy);
          await say(`¡${label(enemy)} se ha debilitado!`);
          await grantExp(enemy.mon);
          const next = enemyParty.findIndex(c => c.hp > 0);
          if (next < 0) { result = 'win'; break; }
          await say(`¡${opts.trainer.name} va a sacar a ${monName(enemyParty[next])}!`);
          await sendOut(enemy, next);
          scene.participants = new Set(player.mon.hp > 0 ? [player.mon.uid] : []);
        }
        if (player.mon.hp <= 0) {
          await faintAnim(player);
          await say(`¡${monName(player.mon)} se ha debilitado!`);
          scene.participants.delete(player.mon.uid);
          if (!G.party.some(c => c.hp > 0)) { result = 'lose'; break; }
          const t = await forcedSwitch();
          await say(`¡Adelante, ${monName(G.party[t])}!`, { fast: true });
          await sendOut(player, t);
          scene.participants.add(player.mon.uid);
        }
      }

      if (result === 'win' && !wild) {
        Audio8.play('town');
        Audio8.sfx('win');
        scene.trainerLook = opts.trainer.look;
        scene.trainerX = 1;
        await anim(300, p => { scene.trainerX = 1 - p; });
        await say(`¡Has derrotado a ${opts.trainer.name}!`);
        if (opts.trainer.defeat) await UI.sayAll(opts.trainer.defeat);
        const lastLvl = enemyParty[enemyParty.length - 1].lvl;
        const prize = (opts.trainer.prize || 20) * lastLvl;
        G.money += prize;
        await say(`¡Has ganado ${fmtMoney(prize)}!`);
      } else if (result === 'win') {
        Audio8.sfx('win');
      }
      if (result === 'lose') {
        await say(`¡A ${G.name} no le quedan criaturas que puedan luchar!`);
        if (!opts.noBlackout) {
          const lost = Math.floor(G.money / 2);
          G.money -= lost;
          await say(`${G.name} ha perdido ${fmtMoney(lost)}...`);
          await say('... ... ... ¡Todo se ha vuelto negro!');
        }
      }

      // Evoluciones tras el combate
      for (const c of G.party) {
        const to = scene.leveled.has(c.uid) && c.hp > 0 ? canEvolve(c) : null;
        if (to) await evolveScene(c, to);
      }
    } finally {
      if (scene.use3d) window.Battle3D.end();
      hud.wrap.remove();
      scene = null;
    }
    return result;
  }

  async function evolveScene(c, to) {
    const from = c.sp;
    scene.evolve = { from, to, p: 0 };
    scene.me.sp = null;
    scene.foe.sp = null;
    hud.foe.classList.add('hidden');
    hud.me.classList.add('hidden');
    await say(`¿Qué? ¡${monName(c)} está evolucionando!`);
    Audio8.sfx('evolve');
    await anim(2600, p => { scene.evolve.p = p; });
    const oldName = monName(c);
    evolve(c, to);
    G.dex.seen[to] = true;
    G.dex.caught[to] = true;
    Audio8.sfx('catch');
    await say(`¡Enhorabuena! ¡${oldName} ha evolucionado a ${SPECIES[to].n}!`);
    // Movimientos que se aprenden al evolucionar en su nivel actual
    for (const [l, m] of SPECIES[to].learn) {
      if (l === c.lvl && !c.moves.some(x => x.id === m)) await learnMove(c, m);
    }
    scene.evolve = null;
  }

  /* ── Dibujo de la escena ──────────── */
  const ENV = {
    grass:  { sky: ['#f8f0d0', '#d8f0b0'], ground: '#a8d880', plat: '#7cc25a', plat2: '#5aa83a' },
    cave:   { sky: ['#4a3a2a', '#6e5640'], ground: '#8a7058', plat: '#a8906e', plat2: '#6e5640' },
    gym:    { sky: ['#e8e0f8', '#c8c0e0'], ground: '#b0a8c8', plat: '#d8d0f0', plat2: '#9088b0' },
    shrine: { sky: ['#2a2a5a', '#6a5aa8'], ground: '#8a7ac8', plat: '#d8d0f0', plat2: '#7a6ab8' },
  };

  function drawPlatform(ctx, cx, cy, rx, ry, env) {
    ctx.fillStyle = env.plat2;
    ctx.beginPath(); ctx.ellipse(cx, cy + 2, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = env.plat;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx - 2, ry - 2, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawMon(ctx, s, view, cx, by) {
    if (!s.sp || s.hidden || s.alpha <= 0) return;
    const img = Art.creature(s.sp, view);
    const w = img.width * s.scale, h = img.height * s.scale;
    ctx.globalAlpha = s.alpha;
    ctx.drawImage(img, Math.round(cx - w / 2 + s.dx), Math.round(by - h + s.dy), Math.round(w), Math.round(h));
    ctx.globalAlpha = 1;
  }

  function render(ctx, now) {
    if (!scene) return;
    if (scene.use3d && window.Battle3D.render(scene, now)) return;
    const env = ENV[scene.env] || ENV.grass;
    const g = ctx.createLinearGradient(0, 0, 0, 100);
    g.addColorStop(0, env.sky[0]);
    g.addColorStop(1, env.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 240, 160);
    ctx.fillStyle = env.ground;
    ctx.fillRect(0, 96, 240, 64);

    if (scene.evolve) {
      const e = scene.evolve;
      const flick = Math.sin(e.p * e.p * 60) > 0;
      const img = Art.creature(flick || e.p > 0.97 ? (e.p > 0.97 ? e.to : e.from) : e.to, 'front');
      ctx.fillStyle = `rgba(255,255,255,${Math.sin(e.p * Math.PI) * 0.7})`;
      ctx.fillRect(0, 0, 240, 160);
      ctx.drawImage(img, 120 - img.width / 2, 92 - img.height);
      return;
    }

    const intro = scene.intro || 0;
    drawPlatform(ctx, 176 + intro * 120, 62, 46, 11, env);
    drawPlatform(ctx, 64 - intro * 120, 118, 54, 12, env);

    // Entrenador rival antes de sacar a su criatura
    if (scene.trainerLook) {
      const img = Art.character(LOOKS[scene.trainerLook], 'down', 0);
      ctx.drawImage(img, 176 - img.width + scene.trainerX * 80, 64 - img.height * 2, img.width * 2, img.height * 2);
    }
    drawMon(ctx, { ...scene.foe, dx: scene.foe.dx + intro * 120 }, 'front', 176, 66);
    drawMon(ctx, { ...scene.me, dx: scene.me.dx - intro * 120 }, 'back', 64, 124);

    // Proyectil de ataque especial
    if (scene.proj) {
      const fromMe = scene.proj.from === 'me';
      const [x0, y0, x1, y1] = fromMe ? [74, 96, 172, 40] : [168, 40, 70, 98];
      for (let i = 0; i < 4; i++) {
        const p = Math.max(0, scene.proj.p - i * 0.08);
        const x = x0 + (x1 - x0) * p, y = y0 + (y1 - y0) * p - Math.sin(p * Math.PI) * 10;
        ctx.fillStyle = i ? Art.shade(scene.proj.color, 0.4) : scene.proj.color;
        ctx.beginPath(); ctx.arc(x, y, 5 - i, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Efectos de estadísticas y destellos
    if (scene.fx) {
      const age = (now - scene.fx.t) / 500;
      if (age > 1) scene.fx = null;
      else {
        const [cx, cy] = scene.fx.target === 'me' ? [64, 92] : [176, 38];
        ctx.fillStyle = scene.fx.type === 'down' ? '#5a8af0' : scene.fx.type === 'up' ? '#f05a5a' : '#fff6a0';
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          const r = 10 + age * 18;
          const y = scene.fx.type === 'down' ? cy - 14 + age * 28 : scene.fx.type === 'up' ? cy + 14 - age * 28 : cy + Math.sin(ang) * r;
          const x = scene.fx.type === 'sparkle' ? cx + Math.cos(ang) * r : cx - 18 + i * 5;
          ctx.fillRect(Math.round(x), Math.round(y), 2, 3);
        }
      }
    }

    // Cápsula lanzada
    if (scene.ball) {
      const b = scene.ball;
      const img = Art.capsule(b.open || 0);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot || 0);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      if (b.caught) {
        ctx.fillStyle = '#fff6a0';
        for (let i = 0; i < 3; i++) ctx.fillRect(b.x - 10 + i * 9, b.y - 14 - ((now / 100 + i) % 4), 2, 2);
      }
    }
  }

  return { run, render, active: () => !!scene };
})();
