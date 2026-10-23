'use strict';

/* ══════════════════════════════════════
   AUDIO: música chiptune y efectos con Web Audio
══════════════════════════════════════ */
const Audio8 = (() => {
  let ac = null;
  let master = null;
  let muted = false;
  try { muted = localStorage.getItem('criaturas-mute') === '1'; } catch (e) { /* sin almacenamiento */ }
  let current = null;      // id de la pista sonando
  let timer = null;
  let nextTime = 0;
  let step = 0;

  function ensure() {
    if (ac) return ac;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ac = new Ctx();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.18;
    master.connect(ac.destination);
    return ac;
  }

  function unlock() {
    const a = ensure();
    if (a && a.state === 'suspended') a.resume();
  }

  const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function freq(note) {
    const m = /^([A-G]#?)(\d)$/.exec(note);
    if (!m) return 0;
    const n = NOTE_INDEX[m[1]] + (+m[2] + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function tone(f, t, dur, type = 'square', vol = 0.5, slide = 0) {
    if (!ac || !f) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // Ruido con filtro opcional: { type: 'lowpass' | 'bandpass' | 'highpass', f, f2 (barrido) }
  function noise(t, dur, vol = 0.3, filter) {
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    const g = ac.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    let node = src;
    if (filter) {
      const f = ac.createBiquadFilter();
      f.type = filter.type;
      f.frequency.setValueAtTime(filter.f, t);
      if (filter.f2) f.frequency.exponentialRampToValueAtTime(filter.f2, t + dur);
      f.Q.value = filter.q || 1;
      src.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(master);
    src.start(t);
  }

  // Sonido de ataque según el tipo
  function attack(type, cat) {
    if (!ensure() || muted) return;
    const t = ac.currentTime;
    if (cat === 'status') {
      [0, 1, 2].forEach(i => tone(500 + i * 180, t + i * 0.08, 0.12, 'triangle', 0.25, 1.4));
      return;
    }
    switch (type) {
      case 'fuego': noise(t, 0.6, 0.5, { type: 'lowpass', f: 400, f2: 2500 }); tone(110, t, 0.5, 'sawtooth', 0.15, 2); break;
      case 'agua': for (let i = 0; i < 6; i++) tone(900 - i * 90 + Math.random() * 120, t + i * 0.06, 0.07, 'sine', 0.3, 0.6); noise(t + 0.3, 0.3, 0.25, { type: 'bandpass', f: 1800, q: 2 }); break;
      case 'planta': for (let i = 0; i < 4; i++) noise(t + i * 0.1, 0.12, 0.3, { type: 'bandpass', f: 3000, f2: 1200, q: 3 }); break;
      case 'electrico': for (let i = 0; i < 10; i++) tone(1200 + Math.random() * 1400, t + i * 0.03, 0.03, 'square', 0.2); noise(t + 0.3, 0.25, 0.5, { type: 'highpass', f: 1500 }); break;
      case 'roca': for (let i = 0; i < 4; i++) { noise(t + i * 0.09, 0.15, 0.5, { type: 'lowpass', f: 500 }); tone(70, t + i * 0.09, 0.12, 'square', 0.25, 0.6); } break;
      case 'volador': noise(t, 0.5, 0.45, { type: 'bandpass', f: 600, f2: 3500, q: 4 }); break;
      case 'bicho': { const o = ac.createOscillator(); const g = ac.createGain(); const lfo = ac.createOscillator(); const lg = ac.createGain();
        o.type = 'sawtooth'; o.frequency.value = 220; lfo.frequency.value = 30; lg.gain.value = 60; lfo.connect(lg); lg.connect(o.frequency);
        g.gain.setValueAtTime(0.15, t); g.gain.linearRampToValueAtTime(0, t + 0.6); o.connect(g); g.connect(master);
        o.start(t); lfo.start(t); o.stop(t + 0.62); lfo.stop(t + 0.62); break; }
      case 'veneno': for (let i = 0; i < 5; i++) tone(180 + Math.random() * 80, t + i * 0.09, 0.1, 'sine', 0.35, 1.8); break;
      case 'fantasma': { const o = ac.createOscillator(); const g = ac.createGain(); const lfo = ac.createOscillator(); const lg = ac.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(250, t + 0.7);
        lfo.frequency.value = 7; lg.gain.value = 25; lfo.connect(lg); lg.connect(o.frequency);
        g.gain.setValueAtTime(0.25, t); g.gain.linearRampToValueAtTime(0, t + 0.7); o.connect(g); g.connect(master);
        o.start(t); lfo.start(t); o.stop(t + 0.72); lfo.stop(t + 0.72); break; }
      default: tone(440, t, 0.08, 'square', 0.25, 0.5); noise(t, 0.12, 0.3);
    }
  }

  // Grito propio de cada especie (siempre suena igual para la misma criatura)
  function cry(sp) {
    if (!ensure() || muted || !sp) return;
    let h = 0;
    for (const ch of sp) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const t = ac.currentTime;
    const base = 300 + (h % 500);
    const notes = 2 + (h % 3);
    const wave = ['sawtooth', 'square', 'triangle'][(h >> 3) % 3];
    for (let i = 0; i < notes; i++) {
      const up = ((h >> (i + 4)) & 1) ? 1.35 : 0.75;
      tone(base * (1 + ((h >> (i * 2)) % 5) / 10), t + i * 0.11, 0.14, wave, 0.2, up);
    }
  }

  // Cada pista: tempo y canales con notas "C5:1 E5:1 -:2" (duración en corcheas)
  const parse = s => s.trim().split(/\s+/).map(tok => { const [n, d] = tok.split(':'); return [n, +(d || 1)]; });
  const TRACKS = {
    town: {
      bpm: 132,
      lead: parse('E5:2 G5:1 E5:1 D5:2 C5:2 D5:1 E5:1 G5:2 E5:4 C5:2 D5:1 E5:1 F5:2 E5:2 D5:2 B4:2 C5:4 ' +
                  'G4:2 C5:1 E5:1 G5:2 A5:2 G5:1 F5:1 E5:2 D5:4 E5:2 F5:1 E5:1 D5:2 G4:2 C5:6 -:2'),
      bass: parse('C3:4 G3:4 C3:4 G3:4 F3:4 C3:4 G3:4 C3:4 C3:4 E3:4 F3:4 G3:4 C3:4 G3:4 C3:4 C3:4'),
      wave: 'square', bassWave: 'triangle',
    },
    route: {
      bpm: 150,
      lead: parse('D5:1 E5:1 F#5:2 A5:2 F#5:1 E5:1 D5:2 E5:2 B4:4 A4:2 B4:1 D5:1 E5:2 F#5:2 E5:4 -:2 ' +
                  'G5:2 F#5:1 E5:1 D5:2 B4:2 A4:2 D5:2 F#5:4 E5:1 F#5:1 G5:2 F#5:2 E5:2 D5:6 -:2'),
      bass: parse('D3:2 A3:2 D3:2 A3:2 G3:2 D4:2 G3:2 D4:2 B2:2 F#3:2 B2:2 F#3:2 A2:2 E3:2 A2:2 E3:2 ' +
                  'G3:2 D4:2 G3:2 D4:2 D3:2 A3:2 D3:2 A3:2 A2:2 E3:2 A2:2 E3:2 D3:2 A3:2 D3:4'),
      wave: 'square', bassWave: 'triangle',
    },
    cave: {
      bpm: 96,
      lead: parse('A4:3 C5:1 B4:2 E4:2 -:2 A4:2 G4:2 E4:2 F4:3 A4:1 G#4:2 E4:2 -:4 ' +
                  'C5:3 B4:1 A4:2 E4:2 F4:2 E4:2 D4:2 E4:6 -:4'),
      bass: parse('A2:4 A2:4 E2:4 E2:4 F2:4 F2:4 E2:4 E2:4 A2:4 A2:4 D2:4 D2:4 E2:4 E2:4 A2:4 A2:4'),
      wave: 'triangle', bassWave: 'triangle',
    },
    battle: {
      bpm: 176,
      lead: parse('A4:1 A4:1 C5:1 A4:1 E5:2 D5:1 C5:1 B4:2 G4:2 A4:4 A4:1 A4:1 C5:1 E5:1 G5:2 F5:1 E5:1 D5:2 E5:2 -:4 ' +
                  'F5:2 E5:1 D5:1 C5:2 D5:2 E5:2 C5:2 A4:4 B4:1 C5:1 D5:2 E5:2 G#4:2 A4:6 -:2'),
      bass: parse('A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 G2:1 G3:1 G2:1 G3:1 A2:1 A3:1 A2:1 A3:1 ' +
                  'A2:1 A3:1 A2:1 A3:1 F2:1 F3:1 F2:1 F3:1 G2:1 G3:1 G2:1 G3:1 E2:1 E3:1 E2:1 E3:1 ' +
                  'F2:1 F3:1 F2:1 F3:1 C3:1 C4:1 C3:1 C4:1 A2:1 A3:1 A2:1 A3:1 D3:1 D4:1 D3:1 D4:1 ' +
                  'E2:1 E3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1'),
      wave: 'square', bassWave: 'square',
    },
    gym: null,  // se rellena abajo
    title: null,
  };
  TRACKS.gym = { ...TRACKS.battle, bpm: 186 };
  TRACKS.title = { ...TRACKS.town, bpm: 120 };

  // Programa las notas de ambos canales por adelantado
  function schedule() {
    if (!ac || !current) return;
    const tr = TRACKS[current];
    const eighth = 60 / tr.bpm / 2;
    while (nextTime < ac.currentTime + 0.25) {
      for (const [chan, wave, vol, oct] of [['lead', tr.wave, 0.22, 1], ['bass', tr.bassWave, 0.28, 1]]) {
        const notes = tr[chan];
        const total = notes.reduce((a, n) => a + n[1], 0);
        let pos = step % total;
        let acc = 0;
        for (const [n, d] of notes) {
          if (acc === pos && n !== '-') tone(freq(n) * oct, nextTime, d * eighth * 0.92, wave, vol);
          acc += d;
          if (acc > pos) break;
        }
      }
      nextTime += eighth;
      step++;
    }
  }

  function play(id) {
    if (current === id) return;
    current = id;
    if (!ensure() || !TRACKS[id]) return;
    step = 0;
    nextTime = ac.currentTime + 0.05;
    clearInterval(timer);
    timer = setInterval(schedule, 60);
  }

  function stop() {
    current = null;
    clearInterval(timer);
  }

  // Efectos de sonido
  function sfx(name) {
    if (!ensure() || muted) return;
    const t = ac.currentTime;
    switch (name) {
      case 'select': tone(1320, t, 0.05, 'square', 0.25); break;
      case 'back': tone(660, t, 0.06, 'square', 0.2); break;
      case 'bump': tone(110, t, 0.08, 'square', 0.3); break;
      case 'hit': noise(t, 0.15, 0.5); tone(220, t, 0.12, 'square', 0.3, 0.4); break;
      case 'super': noise(t, 0.25, 0.6); tone(330, t, 0.2, 'square', 0.35, 0.3); break;
      case 'weak': noise(t, 0.1, 0.3); break;
      case 'faint': tone(440, t, 0.6, 'square', 0.3, 0.15); break;
      case 'ball': tone(880, t, 0.1, 'square', 0.3, 1.5); break;
      case 'shake': tone(300, t, 0.08, 'square', 0.3); tone(200, t + 0.09, 0.08, 'square', 0.3); break;
      case 'catch': [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.1, 0.12, 'square', 0.3)); break;
      case 'levelup': ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(freq(n), t + i * 0.09, 0.12, 'square', 0.3)); break;
      case 'heal': ['C5', 'E5', 'G5', 'E5', 'C6'].forEach((n, i) => tone(freq(n), t + i * 0.14, 0.16, 'triangle', 0.4)); break;
      case 'item': ['G5', 'C6', 'E6'].forEach((n, i) => tone(freq(n), t + i * 0.08, 0.1, 'square', 0.3)); break;
      case 'win': ['G5', 'G5', 'G5', 'E5', 'C6'].forEach((n, i) => tone(freq(n), t + i * 0.12, i === 4 ? 0.5 : 0.1, 'square', 0.3)); break;
      case 'encounter': for (let i = 0; i < 8; i++) tone(880 - i * 60, t + i * 0.04, 0.04, 'square', 0.25); break;
      case 'door': noise(t, 0.08, 0.2); break;
      case 'jump': tone(300, t, 0.15, 'square', 0.25, 2); break;
      case 'cry': tone(600 + Math.random() * 400, t, 0.25, 'sawtooth', 0.2, 0.6); break;
      case 'evolve': ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'E6'].forEach((n, i) => tone(freq(n), t + i * 0.12, 0.14, 'square', 0.3)); break;
    }
  }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('criaturas-mute', muted ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
    if (master) master.gain.value = muted ? 0 : 0.18;
    return muted;
  }

  return { play, stop, sfx, attack, cry, unlock, toggleMute, isMuted: () => muted };
})();
