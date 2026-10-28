'use strict';

/* ══════════════════════════════════════
   EFECTOS DE SONIDO (Web Audio)
   La música de fondo reutiliza Audio8 de Criaturas de Brisaluz.
══════════════════════════════════════ */
const Sfx = (() => {
  let ac = null, out = null;
  let muted = false;
  try { muted = localStorage.getItem('cartas-mute') === '1'; } catch (e) { /* sin almacenamiento */ }

  function ensure() {
    if (ac) return ac;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ac = new C();
    out = ac.createGain();
    out.gain.value = 0.35;
    out.connect(ac.destination);
    return ac;
  }

  function tone(f, t, dur, type = 'sine', vol = 0.3, slide = 1) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(t, dur, vol = 0.3, type = 'bandpass', f = 2000, f2) {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);
    const src = ac.createBufferSource(), flt = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf;
    flt.type = type;
    flt.frequency.setValueAtTime(f, t);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.value = vol;
    src.connect(flt); flt.connect(g); g.connect(out);
    src.start(t);
  }

  const NOTES = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568 };

  function play(name) {
    if (muted || !ensure()) return;
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime;
    switch (name) {
      case 'click': tone(1400, t, 0.04, 'square', 0.08); break;
      case 'tap': tone(800, t, 0.05, 'triangle', 0.12); break;
      case 'rip': noise(t, 0.35, 0.5, 'bandpass', 4000, 900); noise(t + 0.05, 0.25, 0.3, 'highpass', 6000); break;
      case 'flip': noise(t, 0.09, 0.35, 'bandpass', 2500, 5000); break;
      case 'slide': noise(t, 0.16, 0.2, 'bandpass', 1200, 3000); break;
      case 'R': [NOTES.E5, NOTES.G5].forEach((f, i) => tone(f, t + i * 0.07, 0.25, 'triangle', 0.18)); break;
      case 'H': [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((f, i) => tone(f, t + i * 0.07, 0.35, 'triangle', 0.2)); noise(t + 0.25, 0.6, 0.15, 'highpass', 7000); break;
      case 'UR': [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.E6].forEach((f, i) => tone(f, t + i * 0.08, 0.5, 'triangle', 0.22)); noise(t + 0.3, 1, 0.2, 'highpass', 7000); break;
      case 'SR': [NOTES.C5, NOTES.G5, NOTES.C6, NOTES.E6, NOTES.G6].forEach((f, i) => { tone(f, t + i * 0.1, 0.8, 'triangle', 0.22); tone(f * 1.005, t + i * 0.1, 0.8, 'sine', 0.12); }); noise(t + 0.4, 1.6, 0.25, 'highpass', 8000); break;
      case 'anticipation': for (let i = 0; i < 6; i++) tone(300 + i * 80, t + i * 0.08, 0.08, 'sine', 0.12); break;
      case 'cash': tone(1318, t, 0.08, 'square', 0.12); tone(1760, t + 0.08, 0.3, 'square', 0.12); noise(t + 0.02, 0.15, 0.2, 'highpass', 5000); break;
      case 'coin': tone(1900 + Math.random() * 300, t, 0.08, 'triangle', 0.15); tone(2500, t + 0.04, 0.12, 'triangle', 0.1); break;
      case 'bill': noise(t, 0.12, 0.25, 'bandpass', 1500, 3500); break;
      case 'beep': tone(1200, t, 0.07, 'square', 0.1); break;
      case 'error': tone(220, t, 0.18, 'square', 0.15); tone(180, t + 0.12, 0.2, 'square', 0.15); break;
      case 'door': tone(1568, t, 0.5, 'sine', 0.12); tone(1175, t + 0.18, 0.6, 'sine', 0.12); break;
      case 'levelup': [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((f, i) => tone(f, t + i * 0.1, 0.3, 'square', 0.1)); break;
      case 'delivery': tone(392, t, 0.12, 'triangle', 0.2); tone(523, t + 0.12, 0.2, 'triangle', 0.2); break;
      case 'angry': tone(160, t, 0.2, 'sawtooth', 0.08, 0.8); break;
    }
  }

  function toggle() {
    muted = !muted;
    try { localStorage.setItem('cartas-mute', muted ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
    return muted;
  }

  return { play, toggle, isMuted: () => muted, unlock: () => { if (ensure() && ac.state === 'suspended') ac.resume(); } };
})();
