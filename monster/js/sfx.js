'use strict';

/* ══════════════════════════════════════
   EFECTOS DE SONIDO · sintetizados con WebAudio
══════════════════════════════════════ */
const Sfx = (() => {
  let ctx = null, master = null;
  let muted = false;
  try { muted = localStorage.getItem('mh-cajas-mute') === '1'; } catch (e) { /* sin almacenamiento */ }

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, { type = 'sine', vol = 0.3, at = 0, slide = 0, attack = 0.005 } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, { vol = 0.2, at = 0, freq = 1200, q = 1, type = 'bandpass' } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }

  const SOUNDS = {
    tap: () => tone(660, 0.06, { type: 'triangle', vol: 0.15 }),
    click: () => { tone(520, 0.05, { type: 'square', vol: 0.06 }); tone(780, 0.05, { type: 'triangle', vol: 0.1, at: 0.03 }); },
    shake: () => { tone(110, 0.12, { type: 'sine', vol: 0.4, slide: 0.6 }); noise(0.18, { vol: 0.35, freq: 700, q: 2 }); noise(0.1, { vol: 0.2, freq: 2400, q: 3, at: 0.06 }); },
    creak: () => { tone(180, 0.6, { type: 'sawtooth', vol: 0.05, slide: 1.8, attack: 0.05 }); noise(0.5, { vol: 0.08, freq: 900, q: 8 }); },
    whoosh: () => noise(0.45, { vol: 0.35, freq: 1600, q: 0.7 }),
    comun: () => [523, 659, 784].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.18, at: i * 0.07 })),
    rara: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.2, at: i * 0.08 })),
    epica: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.4, { type: 'square', vol: 0.07, at: i * 0.08 })); [784, 1047].forEach((f, i) => tone(f, 0.6, { type: 'sine', vol: 0.15, at: 0.45 + i * 0.1 })); },
    legendaria: () => {
      [262, 330, 392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.5, { type: 'triangle', vol: 0.18, at: i * 0.07 }));
      [523, 659, 784].forEach(f => tone(f, 1.2, { type: 'sine', vol: 0.12, at: 0.7 }));
      for (let i = 0; i < 8; i++) tone(1800 + Math.random() * 1600, 0.12, { type: 'sine', vol: 0.05, at: 0.6 + i * 0.07 });
    },
    shiny: () => { for (let i = 0; i < 10; i++) tone(1400 + i * 160, 0.18, { type: 'sine', vol: 0.06, at: i * 0.05 }); },
    anticipation: () => { tone(220, 1.1, { type: 'sawtooth', vol: 0.05, slide: 3, attack: 0.3 }); noise(1, { vol: 0.08, freq: 3000, q: 0.5 }); },
    coin: () => { tone(988, 0.08, { type: 'square', vol: 0.08 }); tone(1319, 0.25, { type: 'square', vol: 0.08, at: 0.07 }); },
    bats: () => { for (let i = 0; i < 6; i++) noise(0.05, { vol: 0.12, freq: 2800, q: 4, at: i * 0.06 }); },
    error: () => { tone(200, 0.15, { type: 'square', vol: 0.08 }); tone(150, 0.2, { type: 'square', vol: 0.08, at: 0.12 }); },
    achievement: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.18, at: i * 0.1 })),
    gift: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.22, { type: 'sine', vol: 0.18, at: i * 0.08 })),
  };

  return {
    play(name) { if (muted) return; try { SOUNDS[name]?.(); } catch (e) { /* audio no disponible */ } },
    unlock() { if (!muted) ac(); },
    toggle() { muted = !muted; try { localStorage.setItem('mh-cajas-mute', muted ? '1' : '0'); } catch (e) { /* nada */ } return muted; },
    get muted() { return muted; },
  };
})();
