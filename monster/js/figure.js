'use strict';

/* ══════════════════════════════════════
   FIGURAS · dibujo plano de cada muñeca a partir de su ficha de estilo
   (LOOKS, en looks.js). La ficha describe la ropa, el peinado y los
   colores del modelo concreto:
     sk piel · hr peinado/color/mechas · hs tipo de mechas · bg flequillo
     ey ojos · lp labios · tp parte de arriba · bt parte de abajo
     dr vestido · nk escote del vestido · jk chaqueta · lg piernas
     sh zapatos · hd cabeza · ac complementos · ft rasgos (+x, -x)
   Cada valor es tipo/color/color2/estampado, con colores en hex sin #.
══════════════════════════════════════ */
const Figure = (() => {
  const { shade, mix } = Art;
  const C = v => (v ? (v[0] === '#' ? v : '#' + v) : null);
  const lumOf = h => { const n = parseInt(h.slice(1), 16); return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255; };

  function parse(str) {
    const o = {};
    for (const tok of (str || '').trim().split(/\s+/)) {
      if (!tok) continue;
      const i = tok.indexOf('=');
      if (i < 0) continue;
      const k = tok.slice(0, i), v = tok.slice(i + 1);
      if (k === 'ac' || k === 'ft') o[k] = v.split(',').map(x => x.split(':'));
      else o[k] = v.replace(/:/g, '/').split('/');
    }
    return o;
  }

  /* ── Cuerpo (vista de frente, una mano en la cadera) ── */
  const G = {
    torso: 'M90,124 Q80,126 73,131 Q68,136 71,146 L76,160 Q80,178 86,196 Q80,210 79,230 L121,230 Q120,210 114,196 Q120,178 124,160 L129,146 Q132,136 127,131 Q120,126 110,124Z',
    legL: 'M79,222 Q76,262 79,300 Q82,322 83,336 Q80,372 82,422 L93,422 Q93,378 95,338 Q98,314 100,282 L100,226Z',
    armL: 'M75,137 L60,182 L81,205', handL: [84, 208],
    armR: 'M126,137 L139,186 L135,232', handR: [134, 238],
  };
  const B = {
    torso: 'M90,124 Q76,126 68,132 Q63,140 67,152 L74,196 Q76,214 78,232 L122,232 Q124,214 126,196 L133,152 Q137,140 132,132 Q124,126 110,124Z',
    legL: 'M78,222 Q76,262 78,300 Q80,322 81,336 Q79,372 80,422 L94,422 Q94,378 96,338 Q99,314 100,282 L100,226Z',
    armL: 'M70,138 L61,188 L64,236', handL: [64, 242],
    armR: 'M130,138 L139,188 L136,236', handR: [136, 242],
  };
  // Brazo ahusado a partir de hombro, codo y muñeca
  function limb(pts, w0, w1) {
    const n = pts.map(p => p.split(',').map(Number));
    const L = [], R = [];
    n.forEach((p, i) => {
      const a = n[Math.max(0, i - 1)], b = n[Math.min(n.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      const w = (w0 + (w1 - w0) * (i / (n.length - 1))) / 2;
      L.push(`${(p[0] - dy * w).toFixed(1)},${(p[1] + dx * w).toFixed(1)}`);
      R.push(`${(p[0] + dy * w).toFixed(1)},${(p[1] - dx * w).toFixed(1)}`);
    });
    const [ex, ey] = n[0];
    return `M${L.join(' L')} L${R.reverse().join(' L')}Z M${ex - w0 / 2},${ey} a${w0 / 2},${w0 / 2} 0 1 0 ${w0},0 a${w0 / 2},${w0 / 2} 0 1 0 ${-w0},0Z`;
  }
  const armPts = a => a.slice(1).split(' L');
  const flipPath = p => p.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - +x},${y}`);
  const ANK = { L: 87, R: 113 };

  /* ── Pelo ── */
  function hairShapes(style, boy) {
    const back = [], front = [], top = [];
    const capBlunt = 'M75,74 C73,48 86,38 100,38 C114,38 127,48 125,74 L123,68 Q100,64 77,68Z';
    const capSide = 'M75,78 C72,50 88,38 104,39 C118,41 127,52 125,72 Q114,58 98,60 Q86,64 75,78Z';
    const capPart = 'M75,80 C73,50 86,38 100,38 C114,38 127,50 125,80 Q122,58 108,50 L100,46 L92,50 Q78,58 75,80Z';
    const longBack = 'M100,36 C72,36 63,58 63,88 C63,132 58,190 64,242 Q100,254 136,242 C142,190 137,132 137,88 C137,58 128,36 100,36Z';
    const lockL = 'M77,66 Q69,108 71,150 Q72,190 68,228 Q78,214 82,190 Q85,150 83,110 Q81,88 81,74Z';
    const wavy = (x0, dir) => {
      let d = `M${x0},70`;
      for (let y = 70, i = 0; y < 236; y += 22, i++) d += ` Q${x0 + dir * (i % 2 ? 9 : -5)},${y + 11} ${x0 + dir * 2},${y + 22}`;
      return d;
    };
    switch (style) {
      case 'pig':
        back.push('M100,38 C76,38 68,58 70,96 L130,96 C132,58 124,38 100,38Z');
        back.push('M76,56 Q46,56 42,104 Q36,166 46,232 Q56,246 64,230 Q58,170 64,122 Q70,88 84,66Z');
        back.push(flipPath('M76,56 Q46,56 42,104 Q36,166 46,232 Q56,246 64,230 Q58,170 64,122 Q70,88 84,66Z'));
        front.push(capBlunt, 'M77,66 Q75,84 78,96 Q80,82 82,70Z', flipPath('M77,66 Q75,84 78,96 Q80,82 82,70Z'));
        top.push(['tie', 74, 58], ['tie', 126, 58]);
        break;
      case 'pony':
        back.push('M100,36 C76,36 68,56 70,92 L130,92 C132,56 124,36 100,36Z');
        back.push('M104,34 Q150,26 154,78 Q158,150 140,214 Q130,172 132,122 Q132,72 106,46Z');
        front.push(capSide, 'M77,70 Q74,90 77,104 Q80,88 82,74Z');
        top.push(['tie', 120, 40]);
        break;
      case 'side':
        back.push('M100,36 C74,36 66,58 68,94 L132,94 C134,58 126,36 100,36Z');
        back.push('M118,70 Q146,84 144,130 Q142,180 128,232 Q118,190 120,150 Q122,110 112,86Z');
        front.push(capSide);
        front.push('M118,74 Q136,92 136,132 Q136,176 126,224 Q120,186 122,150 Q124,110 116,86Z');
        top.push(['tie', 124, 82]);
        break;
      case 'bob':
        back.push('M100,36 C70,36 63,58 65,90 C65,108 68,120 74,126 L126,126 C132,120 135,108 135,90 C137,58 130,36 100,36Z');
        front.push(capBlunt, 'M76,68 Q72,100 76,124 Q82,106 82,74Z', flipPath('M76,68 Q72,100 76,124 Q82,106 82,74Z'));
        break;
      case 'bun':
      case 'buns':
        back.push('M100,38 C76,38 68,58 70,92 L130,92 C132,58 124,38 100,38Z');
        if (style === 'bun') back.push('M100,10 a19,17 0 1 0 .1,0Z');
        else back.push('M78,20 a15,14 0 1 0 .1,0Z', 'M122,20 a15,14 0 1 0 .1,0Z');
        front.push(capPart, 'M76,72 Q73,90 77,104 Q80,88 81,76Z', flipPath('M76,72 Q73,90 77,104 Q80,88 81,76Z'));
        break;
      case 'curly': {
        let d = '';
        for (let i = 0; i < 26; i++) {
          const a = Math.PI * (i / 25), y = 40 + i * 8.6, w = 38 + Math.sin(a) * 22 + (i > 18 ? -((i - 18) * 2) : 0);
          d += `M${100 - w},${y} a${12 + (i % 3) * 2},12 0 1 0 .1,0Z M${100 + w},${y} a${12 + ((i + 1) % 3) * 2},12 0 1 0 .1,0Z `;
        }
        back.push('M100,30 C64,30 50,60 52,110 C54,170 50,220 62,250 Q100,262 138,250 C150,220 146,170 148,110 C150,60 136,30 100,30Z', d);
        front.push(capPart, 'M77,64 Q66,100 70,140 Q74,110 82,76Z', flipPath('M77,64 Q66,100 70,140 Q74,110 82,76Z'));
        break;
      }
      case 'wavy':
        back.push(longBack.replace('C142,190 137,132', 'C146,190 140,132').replace('C58,190 63,132', 'C54,190 60,132'));
        back.push(`${wavy(66, -1)} L80,236 L80,70Z`, `${wavy(134, 1)} L120,236 L120,70Z`);
        front.push(capPart, lockL, flipPath(lockL));
        break;
      case 'short':
        front.push('M74,78 C70,48 86,34 100,34 C116,34 130,46 126,78 Q124,60 114,54 L104,58 L96,50 L86,56 Q78,62 74,78Z');
        break;
      case 'quiff':
        front.push('M74,78 C70,52 82,40 96,36 Q100,22 120,24 Q112,32 116,38 C126,46 130,58 126,78 Q122,60 112,56 Q100,52 88,56 Q78,62 74,78Z');
        break;
      case 'mohawk':
        front.push('M75,76 C73,58 80,50 88,48 L112,48 C120,50 127,58 125,76 Q114,62 100,62 Q86,62 75,76Z');
        top.push(['spikes']);
        break;
      case 'shag':
        back.push('M100,36 C70,36 62,60 64,96 Q64,120 70,140 L130,140 Q136,120 136,96 C138,60 130,36 100,36Z');
        front.push(capSide, 'M76,70 Q70,104 74,134 Q80,108 82,76Z', flipPath('M76,70 Q70,104 74,134 Q80,108 82,76Z'));
        break;
      case 'half':
        back.push('M100,36 C76,36 68,56 70,92 L130,92 C132,56 124,36 100,36Z');
        back.push('M104,38 C128,40 138,60 138,92 C138,140 142,190 134,236 Q118,240 112,232 Q122,180 120,130 Q118,90 104,70Z');
        front.push('M77,76 C76,56 86,42 104,40 C118,40 126,52 125,72 Q118,58 104,58 Q90,60 77,76Z', 'M116,62 Q134,96 132,140 Q130,190 126,226 Q118,190 120,150 Q122,110 112,74Z');
        break;
      case 'victory':
        back.push('M100,38 C74,38 66,60 68,96 Q68,120 74,132 L126,132 Q132,120 132,96 C134,60 126,38 100,38Z');
        back.push('M84,26 a16,15 0 1 0 .1,0Z', 'M116,26 a16,15 0 1 0 .1,0Z');
        front.push(capBlunt, 'M76,70 Q68,104 72,128 Q74,136 80,130 Q80,104 82,76Z', flipPath('M76,70 Q68,104 72,128 Q74,136 80,130 Q80,104 82,76Z'));
        break;
      case 'braid':
        back.push('M100,36 C76,36 68,56 70,92 L130,92 C132,56 124,36 100,36Z');
        front.push(capPart);
        for (let i = 0; i < 9; i++) front.push(`M${118 + i * 0.8},${84 + i * 17} a8,10 0 1 0 .1,0Z`);
        break;
      case 'snakes':
        front.push('M75,76 C73,58 80,50 88,48 L112,48 C120,50 127,58 125,76 Q114,62 100,62 Q86,62 75,76Z');
        top.push(['snakes']);
        break;
      case 'flames':
        front.push('M74,78 C70,52 82,40 92,38 L86,18 L100,32 L104,10 L112,32 L126,18 L118,40 C128,48 130,60 126,78 Q122,60 112,56 Q100,52 88,56 Q78,62 74,78Z');
        break;
      default: // long
        back.push(longBack);
        front.push(boy ? capSide : capPart, lockL, flipPath(lockL));
    }
    if (style === 'longblunt') front.splice(0, 1, capBlunt);
    return { back, front, top };
  }

  /* ── Estampados ── */
  function fillOf(uid, defs, key, c1, c2, pat) {
    if (!pat) return c1;
    const id = `${uid}${key}`;
    const c3 = lumOf(c1) > 0.5 ? shade(c1, -0.35) : mix(c1, '#ffffff', 0.5);
    if (pat === 'hstripes') defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="${c1}"/><rect width="10" height="5" fill="${c2 || c3}"/></pattern>`);
    else if (pat === 'vstripes') defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="${c1}"/><rect width="4" height="10" fill="${c2 || c3}"/></pattern>`);
    else if (pat === 'check') defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="12" height="12"><rect width="12" height="12" fill="${c1}"/><rect width="6" height="6" fill="${c2 || c3}"/><rect x="6" y="6" width="6" height="6" fill="${c2 || c3}"/></pattern>`);
    else if (pat === 'fishnet') defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="none"/><path d="M0,0 H6 M0,0 V6" stroke="${c1}" stroke-width="1"/></pattern>`);
    else if (pat === 'lace') defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill="${c1}"/><circle cx="4" cy="4" r="2" fill="none" stroke="${c2 || c3}" stroke-width=".8"/></pattern>`);
    else if (pat === 'sparkle') defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="${c1}"/><circle cx="2" cy="3" r=".9" fill="${c2 || '#ffffff'}"/><circle cx="7" cy="8" r=".7" fill="${c2 || '#ffffff'}"/></pattern>`);
    else if (pat === 'web') defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="24"><rect width="24" height="24" fill="${c1}"/><path d="M12,0 V24 M0,12 H24 M3,3 L21,21 M21,3 L3,21" stroke="${c2 || c3}" stroke-width=".6"/><circle cx="12" cy="12" r="5" fill="none" stroke="${c2 || c3}" stroke-width=".6"/><circle cx="12" cy="12" r="9" fill="none" stroke="${c2 || c3}" stroke-width=".6"/></pattern>`);
    else if (pat === 'camo') defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="24"><rect width="24" height="24" fill="${c1}"/><path d="M2,4 q6,-4 10,2 q-4,6 -10,-2Z M14,14 q6,-2 8,4 q-6,4 -8,-4Z" fill="${c2 || c3}"/></pattern>`);
    else {
      // Los estampados de art.js a escala .75 (respetando el giro que ya traigan)
      const p = Art.pattern(id, pat, c1, c2 || c3, lumOf(c1) > 0.5 ? '#1a1a1a' : '#ffffff');
      defs.push(p.includes('patternTransform="') ? p.replace('patternTransform="', 'patternTransform="scale(.75) ') : p.replace('<pattern', '<pattern patternTransform="scale(.75)"'));
    }
    return `url(#${id})`;
  }

  function hairFill(uid, defs, c1, c2, mode) {
    if (!c2 || mode === 'none') return c1;
    const id = `${uid}hair`;
    if (mode === 'tips' || mode === 'ombre') {
      defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop offset="${mode === 'tips' ? 0.55 : 0.2}" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`);
    } else if (mode === 'split') {
      defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse"><stop offset=".5" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/></linearGradient>`);
    } else if (mode === 'stripes') {
      defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="16" height="400" patternTransform="rotate(4)"><rect width="16" height="400" fill="${c1}"/><rect x="2" width="7" height="400" fill="${c2}"/></pattern>`);
    } else { // streak: dos mechas
      defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="200" height="400"><rect width="200" height="400" fill="${c1}"/><rect x="72" width="8" height="400" fill="${c2}"/><rect x="116" width="9" height="400" fill="${c2}"/><rect x="132" width="5" height="400" fill="${c2}"/><rect x="60" width="5" height="400" fill="${c2}"/></pattern>`);
    }
    return `url(#${id})`;
  }

  /* ── Una figura ── */
  let uidN = 0;
  function figure(spec, char) {
    const ch = CHARS[char] || {};
    const o = parse(spec);
    const uid = `f${(uidN++).toString(36)}_`;
    const defs = [];
    const boy = o.boy ? o.boy[0] === '1' : !!ch.boy;
    const body = boy ? B : G;
    const skin = C(o.sk?.[0]) || ch.skin || '#f0c8a8';
    const skin2 = C(o.sk?.[1]);
    const skD = shade(skin, -0.14);
    const feats = new Set(ch.feats || []);
    for (const [f] of o.ft || []) { if (f[0] === '-') feats.delete(f.slice(1)); else feats.add(f.replace(/^\+/, '')); }
    const hr = o.hr || [];
    const hairStyle = hr[0] || (boy ? 'short' : { pigtails: 'pig', big: 'curly', longStraight: 'long', updo: 'bun', boy: 'short', halfShaved: 'half' }[ch.style] || ch.style || 'long');
    const hc1 = C(hr[1]) || ch.hair || '#1a1a1a', hc2 = C(hr[2]) || (hr[1] ? null : ch.streak);
    const hMode = o.hs?.[0] || (hr[2] ? 'streak' : (hr[1] ? 'none' : 'streak'));
    const eye = C(o.ey?.[0]) || (Array.isArray(ch.eyes) ? ch.eyes[0] : ch.eyes) || '#5a3a2a';
    const eye2 = C(o.ey?.[1]) || (Array.isArray(ch.eyes) ? ch.eyes[1] : eye);
    const lips = C(o.lp?.[0]) || ch.lips || '#d8507a';
    const shadow = C(o.ey?.[2]) || mix(lips, eye, 0.5);

    const fillG = (key, part, def = {}) => {
      const p = o[key];
      if (!p) return null;
      const c1 = C(p[1]) || def.c1 || '#1a1a1a';
      const c2 = C(p[2]) || null;
      return { t: p[0], c1, c2, f: fillG.f(key + part, c1, c2, p[3]), dark: shade(c1, -0.22) };
    };
    fillG.f = (key, c1, c2, pat) => fillOf(uid, defs, key, c1, c2, pat);

    let clipN = 0;
    const clip = (d) => { const id = `${uid}c${clipN++}`; defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return `clip-path="url(#${id})"`; };
    const band = (y0, y1) => clip(`M-50,${y0} H250 V${y1} H-50Z`);
    const legs = [body.legL, flipPath(body.legL)];
    const arms = [[body.armL, body.handL], [body.armR, body.handR]];

    const backL = [], legL = [], botL = [], torL = [], armL = [], headL = [];

    /* Rasgos de detrás */
    if (feats.has('wings')) backL.push(`<path d="M80,140 Q40,90 20,120 Q30,130 26,146 Q40,140 44,156 Q56,146 64,162 Q70,150 82,160Z" fill="${shade(skin, -0.2)}"/><path d="M120,140 Q160,90 180,120 Q170,130 174,146 Q160,140 156,156 Q144,146 136,162 Q130,150 118,160Z" fill="${shade(skin, -0.2)}"/>`);
    if (feats.has('mothWings')) backL.push(`<path d="M86,150 Q30,80 18,140 Q30,190 86,170Z M114,150 Q170,80 182,140 Q170,190 114,170Z" fill="${mix(skin, '#ffffff', 0.4)}" opacity=".85"/>`);
    if (feats.has('tail')) backL.push(`<path d="M116,226 Q150,260 156,320 Q158,340 148,346" fill="none" stroke="${C(o.ft?.find(f => f[0] === 'tail')?.[1]) || hc1}" stroke-width="7" stroke-linecap="round"/>`);

    /* Pelo de detrás */
    const hs = hairShapes(hairStyle, boy);
    const hf = hairFill(uid, defs, hc1, hc2, hMode);
    for (const d of hs.back) backL.push(`<path d="${d}" fill="${hf}"/>`);

    /* Vestidos largos por detrás (cola) */
    const dr = fillG('dr', 'd');
    const bt = fillG('bt', 'b');
    const skirt = dr || (bt && !['shorts', 'pants', 'flare', 'jeans', 'leggings'].includes(bt.t) ? bt : null);
    if (skirt && skirt.t === 'hilo') backL.push(`<path d="M84,200 Q60,300 48,440 Q100,456 152,440 Q140,300 116,200Z" fill="${skirt.dark}"/>`);
    const jk = fillG('jk', 'j');
    if (jk && jk.t === 'cape') backL.push(`<path d="M74,128 Q40,260 34,452 Q100,470 166,452 Q160,260 126,128Z" fill="${jk.c2 || jk.dark}"/>`);

    /* Piernas */
    for (const l of legs) legL.push(`<path d="${l}" fill="${skin}"/>`);
    if (skin2) legL.push(`<path d="${legs[1]}" fill="${skin2}"/>`);
    if (feats.has('vines')) legL.push(`<path d="M84,250 q10,20 -2,40 q-8,20 6,40 q10,20 -2,40 M116,250 q-10,20 2,40 q8,20 -6,40 q-10,20 2,40" fill="none" stroke="#3a8a3a" stroke-width="2.5"/>`);
    if (feats.has('stitches')) legL.push(`<path d="M80,300 h12 M84,296 v8 M88,296 v8" stroke="${shade(skin, -0.45)}" stroke-width="1"/>`);
    if (feats.has('bandages')) legL.push(`<g stroke="${mix(skin, '#ffffff', 0.5)}" stroke-width="3" opacity=".8">${[260, 290, 360, 390].map(y => `<path d="M${80},${y} l16,-6 M${104},${y - 6} l16,6"/>`).join('')}</g>`);
    if (feats.has('skeleton')) legL.push(`<g stroke="${shade(skin, -0.5)}" stroke-width=".9" fill="none" opacity=".5"><path d="M88,250 V320 M112,250 V320 M88,350 V410 M112,350 V410"/></g>`);
    const lg = fillG('lg', 'l');
    if (lg) {
      const y0 = { tights: 200, leggings: 200, stripes: 200, fishnet: 200, socks: 290, knee: 334, ankle: 396 }[lg.t] ?? 200;
      const f = lg.t === 'fishnet' ? fillG.f('lgnet', lg.c1, null, 'fishnet') : lg.t === 'stripes' ? fillG.f('lgs', lg.c1, lg.c2 || '#1a1a1a', 'hstripes') : (lg.c2 && lg.t !== 'tights' ? fillG.f('lgs', lg.c1, lg.c2, 'hstripes') : lg.f);
      legL.push(`<g ${band(y0, 430)}>${legs.map(l => `<path d="${l}" fill="${f}"${lg.t === 'fishnet' ? '' : ` stroke="${lg.t === 'fishnet' ? 'none' : f}" stroke-width="1.2"`}/>`).join('')}</g>`);
      if (['socks', 'knee'].includes(lg.t)) legL.push(`<path d="M79,${y0 + 2} h16 M105,${y0 + 2} h16" stroke="${shade(lg.c1, -0.2)}" stroke-width="3"/>`);
    }

    /* Pantalones y shorts */
    const pants = bt && ['shorts', 'pants', 'flare', 'jeans', 'leggings', 'capri'].includes(bt.t) ? bt : null;
    if (pants) {
      const y1 = { shorts: 254, capri: 360, leggings: 424, pants: 420, jeans: 420, flare: 424 }[pants.t];
      legL.push(`<g ${band(190, y1)}>${legs.map(l => `<path d="${l}" fill="${pants.f}" stroke="${pants.c1}" stroke-width="${pants.t === 'leggings' ? 1 : 4}"/>`).join('')}<path d="${body.torso}" fill="${pants.f}" ${band(194, 240)}/></g>`);
      if (pants.t === 'flare') legL.push(`<path d="M80,380 L74,428 L96,428 L95,380Z M120,380 L126,428 L104,428 L105,380Z" fill="${pants.f}"/>`);
      if (pants.t === 'jeans' || pants.t === 'pants') legL.push(`<path d="M100,232 V${y1 - 4}" stroke="${shade(pants.c1, -0.25)}" stroke-width="1" opacity=".6" ${band(232, 300)}/>`);
      if (pants.t === 'shorts' && pants.c2) legL.push(`<path d="M76,250 h22 M102,250 h22" stroke="${pants.c2}" stroke-width="3"/>`);
    }

    /* Zapatos */
    const sh = fillG('sh', 's', { c1: '#1a1a1a' });
    const shoe = sh || { t: 'heel', c1: '#1a1a1a', c2: null, f: '#1a1a1a', dark: '#000000' };
    for (const [k, cx] of Object.entries(ANK)) {
      const l = k === 'L' ? legs[0] : legs[1];
      const sole = shoe.c2 || shade(shoe.c1, -0.3);
      const shaftY = { boot: 338, thigh: 286, ankle: 394, buckle: 338, lace: 338, skate: 388 }[shoe.t];
      if (shaftY) {
        legL.push(`<g ${band(shaftY, 440)}><path d="${l}" fill="${shoe.f}" stroke="${shoe.c1}" stroke-width="5"/></g>`);
        if (shoe.t === 'buckle' || shoe.t === 'lace') {
          for (let y = shaftY + 12; y < 420; y += shoe.t === 'lace' ? 8 : 22) legL.push(shoe.t === 'lace' ? `<path d="M${cx - 4},${y} l8,4 M${cx + 4},${y} l-8,4" stroke="${sole}" stroke-width="1.2"/>` : `<rect x="${cx - 9}" y="${y}" width="18" height="4" fill="${sole}"/><rect x="${cx + 2}" y="${y - 1}" width="5" height="6" fill="none" stroke="#c8c8c8" stroke-width="1"/>`);
        }
        legL.push(`<path d="M${cx - 10},${shaftY} q10,4 20,0" fill="none" stroke="${shade(shoe.c1, 0.15)}" stroke-width="2" ${band(0, 999)}/>`);
      }
      if (shoe.t === 'bare') { legL.push(`<path d="M${cx - 7},414 Q${cx - 9},440 ${cx - 6},458 Q${cx},462 ${cx + 6},458 Q${cx + 9},440 ${cx + 7},414Z" fill="${skin}"/>`); continue; }
      if (shoe.t === 'slipper') { legL.push(`<path d="M${cx - 9},420 Q${cx - 14},446 ${cx - 12},460 Q${cx},466 ${cx + 12},460 Q${cx + 14},446 ${cx + 9},420Z" fill="${shoe.f}"/><circle cx="${cx - 5}" cy="430" r="2.5" fill="${shade(shoe.c1, 0.35)}"/><circle cx="${cx + 5}" cy="430" r="2.5" fill="${shade(shoe.c1, 0.35)}"/>`); continue; }
      const footFill = shoe.t === 'sandal' ? skin : shoe.f;
      legL.push(`<path d="M${cx - 9},414 Q${cx - 13},440 ${cx - 11},452 L${cx + 11},452 Q${cx + 13},440 ${cx + 9},414Z" fill="${footFill}"/>`);
      if (shoe.t === 'sandal') legL.push(`<path d="M${cx - 10},428 h20 M${cx - 11},440 h22 M${cx - 9},418 h18" stroke="${shoe.c1}" stroke-width="3"/>`);
      if (shoe.t === 'mary') legL.push(`<path d="M${cx - 10},426 h20" stroke="${sole}" stroke-width="3"/><circle cx="${cx + 7}" cy="426" r="1.8" fill="#e8e8e8"/>`);
      if (shoe.t === 'skate') {
        legL.push(`<rect x="${cx - 13}" y="452" width="26" height="6" rx="2" fill="${shade(shoe.c1, -0.3)}"/><circle cx="${cx - 8}" cy="463" r="5" fill="${shoe.c2 || '#ffd23a'}"/><circle cx="${cx + 8}" cy="463" r="5" fill="${shoe.c2 || '#ffd23a'}"/>`);
      } else if (shoe.t === 'sneaker') {
        legL.push(`<rect x="${cx - 12}" y="450" width="24" height="9" rx="3" fill="${shoe.c2 || '#f4f4f4'}"/><path d="M${cx - 4},422 l8,0 M${cx - 4},428 l8,0 M${cx - 4},434 l8,0" stroke="${shoe.c2 || '#f4f4f4'}" stroke-width="1.5"/>`);
      } else {
        const ph = shoe.t === 'heel' || shoe.t === 'mary' || shoe.t === 'sandal' ? 16 : 22;
        legL.push(`<path d="M${cx - 13},452 h26 v${ph} q0,3 -3,3 h-20 q-3,0 -3,-3Z" fill="${sole}"/><path d="M${cx - 13},${452 + ph * 0.45} h26" stroke="${shade(sole, 0.25)}" stroke-width="1.2" opacity=".7"/>`);
      }
    }

    /* Torso */
    torL.push(`<path d="M94,100 L106,100 L107,128 L93,128Z" fill="${skD}"/>`);
    torL.push(`<path d="${body.torso}" fill="${skin}"/>`);
    if (skin2) torL.push(`<path d="${body.torso}" fill="${skin2}" ${clip('M100,0 H250 V600 H100Z')}/>`);
    if (feats.has('stitches')) torL.push(`<path d="M90,124 Q100,130 110,124" fill="none" stroke="${shade(skin, -0.45)}" stroke-width="1"/>`);
    if (feats.has('bolts')) torL.push(`<rect x="86" y="112" width="7" height="6" rx="1.5" fill="#9aa0a8"/><rect x="107" y="112" width="7" height="6" rx="1.5" fill="#9aa0a8"/>`);
    if (feats.has('skeleton')) torL.push(`<g stroke="${shade(skin, -0.5)}" stroke-width=".9" fill="none" opacity=".5"><path d="M88,150 q12,6 24,0 M90,160 q10,5 20,0 M92,170 q8,4 16,0"/></g>`);

    // Parte de arriba (o la del vestido)
    const tp = fillG('tp', 't');
    const top = dr ? { ...dr, t: o.nk?.[0] || 'tank' } : tp;
    let topEnd = 204;
    if (top) {
      const t = top.t;
      topEnd = t === 'crop' || t === 'tube' || t === 'bra' ? 176 : (boy ? 236 : 206);
      if (dr) topEnd = 214;
      const neck = {
        tee: 'M93,124 Q100,132 107,124', long: 'M93,124 Q100,132 107,124', collar: 'M93,124 L100,138 L107,124',
        turtle: '', crop: 'M93,124 Q100,134 107,124', vneck: 'M92,124 L100,146 L108,124',
      }[t];
      let region = `M-50,126 H250 V${topEnd} H-50Z`;
      if (['corset', 'tube', 'strapless', 'tank', 'bra', 'halter', 'offs'].includes(t)) region = `M-50,150 Q80,${t === 'offs' ? 140 : 142} 100,${t === 'tank' || t === 'halter' ? 156 : 152} Q120,${t === 'offs' ? 140 : 142} 250,150 V${topEnd} H-50Z`;
      if (t === 'turtle') region = `M-50,106 H250 V${topEnd} H-50Z`;
      torL.push(`<g ${clip(region)}><path d="${body.torso}" fill="${top.f}" stroke="${top.c1}" stroke-width="2"/>${t === 'turtle' ? `<rect x="92" y="104" width="16" height="26" fill="${top.f}"/>` : ''}</g>`);
      if (neck) torL.push(`<path d="${neck}Z" fill="${skin}"/>`);
      if (t === 'tank') torL.push(`<path d="M86,128 L84,152 M114,128 L116,152" stroke="${top.c1}" stroke-width="4"/>`);
      if (t === 'halter') torL.push(`<path d="M80,150 L96,112 L104,112 L120,150Z" fill="${top.f}"/><path d="M93,128 L100,148 L107,128" fill="${skin}"/>`);
      if (t === 'corset') torL.push(`<path d="M100,154 V${topEnd}" stroke="${top.c2 || shade(top.c1, -0.3)}" stroke-width="1.5"/>${[162, 172, 182, 192].map(y => `<path d="M96,${y} l8,5 M104,${y} l-8,5" stroke="${top.c2 || shade(top.c1, -0.3)}" stroke-width="1"/>`).join('')}`);
      if (t === 'collar') torL.push(`<path d="M93,124 L86,136 L99,138Z M107,124 L114,136 L101,138Z" fill="${top.c2 || '#ffffff'}"/><g fill="${top.c2 || shade(top.c1, -0.3)}">${[148, 162, 176, 190].map(y => `<circle cx="100" cy="${y}" r="1.5"/>`).join('')}</g>`);
      if (t === 'offs') torL.push(`<path d="M66,144 Q80,138 100,146 Q120,138 134,144 L134,152 Q120,146 100,154 Q80,146 66,152Z" fill="${top.c2 || shade(top.c1, 0.2)}"/>`);
      if (top.c2 && ['tee', 'crop', 'long', 'tank', 'vneck', 'tube', 'strapless'].includes(t) && !dr) torL.push(`<path d="M80,${topEnd - 3} Q100,${topEnd} 120,${topEnd - 3}" stroke="${top.c2}" stroke-width="3" fill="none" ${clip(body.torso)}/>`);
      if (top.c2 && dr && t !== 'collar') torL.push(`<path d="M84,198 Q100,202 116,198" stroke="${top.c2}" stroke-width="5" fill="none"/>`);
    }

    // Falda
    if (skirt) {
      const t = skirt.t;
      const shapes = {
        pleat: 'M85,194 L115,194 L134,262 Q100,268 66,262Z',
        mini: 'M85,194 L115,194 L127,254 Q100,258 73,254Z',
        skater: 'M85,194 L115,194 Q132,224 142,254 Q120,262 100,256 Q80,262 58,254 Q68,224 85,194Z',
        tutu: 'M85,194 L115,194 Q150,224 150,246 Q138,240 130,250 Q120,242 110,252 Q100,244 90,252 Q80,242 70,250 Q62,240 50,246 Q50,224 85,194Z',
        pencil: 'M84,194 L116,194 Q122,240 118,294 L82,294 Q78,240 84,194Z',
        midi: 'M85,194 L115,194 Q132,260 140,332 Q100,342 60,332 Q68,260 85,194Z',
        gown: 'M86,196 L114,196 Q134,300 164,462 Q100,476 36,462 Q66,300 86,196Z',
        mermaid: 'M84,196 L116,196 Q124,280 118,330 Q140,400 160,466 Q100,478 40,466 Q60,400 82,330 Q76,280 84,196Z',
        hilo: 'M85,194 L115,194 Q132,224 138,250 Q100,262 62,250 Q68,224 85,194Z',
        bubble: 'M85,194 L115,194 Q140,226 132,250 Q100,262 68,250 Q60,226 85,194Z',
        tiered: 'M85,194 L115,194 L124,224 L136,226 L142,262 Q100,270 58,262 L64,226 L76,224Z',
        swim: 'M85,194 L115,194 L121,230 Q108,232 100,246 Q92,232 79,230Z',
      };
      const d = shapes[t] || shapes.mini;
      torL.push(`<path d="${d}" fill="${skirt.f}"/>`);
      if (t === 'pleat') torL.push(`<g stroke="${skirt.c2 || shade(skirt.c1, -0.25)}" stroke-width="1.1" opacity=".8">${[-24, -14, -5, 5, 14, 24].map(dx => `<path d="M${100 + dx * 0.5},198 L${100 + dx},262"/>`).join('')}</g>`);
      if (t === 'tutu') torL.push(`<path d="M70,214 Q100,222 130,214" stroke="${shade(skirt.c1, 0.25)}" stroke-width="3" fill="none" opacity=".7"/>`);
      if (t === 'tiered') torL.push(`<path d="M76,224 L124,224 M70,244 Q100,250 130,244" stroke="${skirt.c2 || shade(skirt.c1, -0.25)}" stroke-width="2" fill="none"/>`);
      if (skirt.c2 && !['pleat', 'tiered', 'hilo'].includes(t) && !dr) torL.push(`<path d="${d}" fill="none" stroke="${skirt.c2}" stroke-width="3" ${clip('M-50,240 H250 V600 H-50Z')}/>`);
      if (dr && dr.c2 && ['gown', 'mermaid'].includes(t)) torL.push(`<path d="M${t === 'gown' ? '58,400 Q100,420 142,400' : '64,410 Q100,424 136,410'}" stroke="${dr.c2}" stroke-width="3" fill="none" opacity=".8"/>`);
    }
    if (!top && !dr && !(jk && jk.t !== 'cape') && !skirt && !pants) {
      // sin ropa indicada: body sencillo para que no quede sin vestir
      torL.push(`<path d="${body.torso}" fill="#1a1a1a" ${band(146, 232)}/>`);
    }

    /* Brazos */
    for (const [i, [a, hd]] of arms.entries()) {
      armL.push(`<path d="${limb(armPts(a), boy ? 14 : 12, boy ? 9 : 7)}" fill="${skin2 && i === 1 ? skin2 : skin}"/>`);
      armL.push(`<ellipse cx="${hd[0]}" cy="${hd[1]}" rx="5" ry="6.5" fill="${skin2 && i === 1 ? skin2 : skin}"/>`);
    }
    if (feats.has('stitches')) armL.push(`<path d="M134,200 l10,-2 M137,196 l1,8" stroke="${shade(skin, -0.45)}" stroke-width="1"/>`);
    const sleeve = (y0, y1, f, w) => `<g ${band(y0, y1)}>${arms.map(([a]) => `<path d="${limb(armPts(a), w + 2, w - 3)}" fill="${f}"/>`).join('')}</g>`;
    if (top && !feats.has('noSleeves')) {
      if (['tee', 'collar', 'crop', 'vneck'].includes(top.t)) armL.push(sleeve(120, 156, top.f, boy ? 15 : 13));
      if (['long', 'turtle'].includes(top.t)) armL.push(sleeve(120, 232, top.f, boy ? 14 : 12));
      if (top.t === 'offs') armL.push(sleeve(140, 158, top.c2 || shade(top.c1, 0.2), 15));
    }
    const ac = new Map((o.ac || []).map(([k, c]) => [k, C(c) || '#1a1a1a']));
    if (ac.has('gloves')) armL.push(sleeve(186, 260, ac.get('gloves'), 11) + arms.map(([, h]) => `<ellipse cx="${h[0]}" cy="${h[1]}" rx="5.5" ry="7" fill="${ac.get('gloves')}"/>`).join(''));
    if (ac.has('cuffs')) armL.push(arms.map(([, h], i) => `<rect x="${h[0] - 6}" y="${h[1] - (i ? 14 : 12)}" width="12" height="5" rx="2" fill="${ac.get('cuffs')}" transform="rotate(${i ? 0 : -50} ${h[0]} ${h[1] - 10})"/>`).join(''));

    /* Chaqueta */
    if (jk && jk.t !== 'cape') {
      const t = jk.t;
      const end = { jacket: 196, crop: 172, blazer: 238, coat: 330, long: 400, vest: 200, fur: 196, bolero: 158, hoodie: 214, lab: 330, kimono: 300 }[t] || 196;
      const panelL = `M-50,120 H96 L${t === 'bolero' ? 84 : 92},${end} H-50Z`;
      const panelR = `M250,120 H104 L${t === 'bolero' ? 116 : 108},${end} H250Z`;
      const outline = end > 232 ? (boy ? 'M90,124 Q76,126 68,132 Q63,140 67,152 L74,196 Q72,260 64,' + end + ' L136,' + end + ' Q128,260 126,196 L133,152 Q137,140 132,132 Q124,126 110,124Z' : 'M90,124 Q80,126 73,131 Q68,136 71,146 L76,160 Q80,178 86,196 Q72,260 62,' + end + ' L138,' + end + ' Q128,260 114,196 Q120,178 124,160 L129,146 Q132,136 127,131 Q120,126 110,124Z') : body.torso;
      armL.unshift(''); // la chaqueta va por encima de la ropa pero debajo de los brazos
      const jkBody = `<g ${clip(panelL)}><path d="${outline}" fill="${jk.f}" stroke="${jk.c1}" stroke-width="3" ${band(118, end)}/></g><g ${clip(panelR)}><path d="${outline}" fill="${jk.f}" stroke="${jk.c1}" stroke-width="3" ${band(118, end)}/></g>`;
      torL.push(jkBody);
      if (t !== 'vest') armL.push(sleeve(118, t === 'bolero' || t === 'crop' ? 210 : 230, jk.f, boy ? 15 : 13));
      if (['jacket', 'blazer', 'coat', 'lab', 'long'].includes(t)) torL.push(`<path d="M93,124 L86,150 L96,146Z M107,124 L114,150 L104,146Z" fill="${jk.c2 || shade(jk.c1, -0.25)}"/>`);
      if (t === 'fur') { const fc = jk.c2 || '#f4f0f0'; torL.push(`<path d="M70,132 q4,-8 10,-6 q4,-8 10,-4 q4,-4 10,-2 q6,-2 10,2 q6,-4 10,4 q6,-2 10,6 q2,12 -8,16 q-4,8 -12,2 q-4,4 -10,0 q-4,4 -10,0 q-8,6 -12,-2 q-10,-4 -8,-16Z" fill="${fc}"/>`); }
      if (t === 'hoodie') backL.push(`<path d="M72,128 Q66,80 100,70 Q134,80 128,128Z" fill="${jk.dark}"/>`);
      if (t === 'kimono') torL.push(`<path d="M93,124 L96,200 M107,124 L104,200" stroke="${jk.c2 || shade(jk.c1, -0.25)}" stroke-width="4"/>`);
    }
    if (jk && jk.t === 'cape') torL.push(`<path d="M76,126 Q100,140 124,126 L130,134 Q100,150 70,134Z" fill="${jk.f}"/>`);

    /* Complementos de cintura y cuello */
    if (ac.has('belt')) torL.push(`<path d="M84,195 Q100,199 116,195 L116,201 Q100,205 84,201Z" fill="${ac.get('belt')}"/><rect x="96" y="195" width="8" height="8" rx="1" fill="none" stroke="#d8c070" stroke-width="1.5"/>`);
    if (ac.has('sash')) torL.push(`<path d="M84,192 Q100,198 116,192 L116,204 Q100,210 84,204Z" fill="${ac.get('sash')}"/>`);
    if (ac.has('neck')) torL.push(`<path d="M92,126 Q100,140 108,126" fill="none" stroke="${ac.get('neck')}" stroke-width="2"/><circle cx="100" cy="137" r="3" fill="${ac.get('neck')}"/>`);
    if (ac.has('collar')) torL.push(`<path d="M80,128 Q100,148 120,128 L124,136 Q100,158 76,136Z" fill="${ac.get('collar')}"/>`);
    if (ac.has('choker')) torL.push(`<rect x="93" y="110" width="14" height="4" fill="${ac.get('choker')}"/>`);
    if (ac.has('tie')) torL.push(`<path d="M98,126 L102,126 L104,132 L102,168 L100,172 L98,168 L96,132Z" fill="${ac.get('tie')}"/>`);
    if (ac.has('bowtie')) torL.push(`<path d="M100,128 L90,122 L90,134Z M100,128 L110,122 L110,134Z" fill="${ac.get('bowtie')}"/>`);
    if (ac.has('scarf')) torL.push(`<path d="M88,120 Q100,132 112,120 L114,128 Q100,140 86,128Z M106,130 L110,170 L102,172Z" fill="${ac.get('scarf')}"/>`);
    if (ac.has('kneepads')) legL.push(`<rect x="80" y="322" width="16" height="14" rx="5" fill="${ac.get('kneepads')}"/><rect x="104" y="322" width="16" height="14" rx="5" fill="${ac.get('kneepads')}"/>`);
    if (ac.has('apron')) torL.push(`<path d="M86,200 L114,200 L118,250 L82,250Z" fill="${ac.get('apron')}"/>`);
    if (ac.has('bag')) armL.push(`<path d="M128,236 Q134,222 140,236" fill="none" stroke="${shade(ac.get('bag'), -0.3)}" stroke-width="1.6"/><rect x="124" y="236" width="20" height="16" rx="3" fill="${ac.get('bag')}"/>`);
    if (feats.has('chains')) torL.push(`<path d="M84,200 Q100,212 116,200" fill="none" stroke="#b8b8c8" stroke-width="2" stroke-dasharray="3 1.5"/>`);
    if (feats.has('iceNecklace') && !ac.has('neck')) torL.push(`<path d="M92,126 Q100,138 108,126" fill="none" stroke="#a8e8ff" stroke-width="2"/><path d="M100,134 l4,6 l-4,6 l-4,-6Z" fill="#a8e8ff"/>`);

    /* Cabeza */
    const face = 'M76,72 C76,54 87,46 100,46 C113,46 124,54 124,72 C124,90 113,106 100,110 C87,106 76,90 76,72Z';
    if (feats.has('fins')) headL.push(`<path d="M78,74 L60,62 L64,76 L58,84 L66,88 L60,96 L80,90Z" fill="${shade(skin, -0.12)}"/><path d="M122,74 L140,62 L136,76 L142,84 L134,88 L140,96 L120,90Z" fill="${shade(skin, -0.12)}"/>`);
    if (feats.has('wolfEars')) headL.push(`<path d="M70,54 L66,22 L90,42Z M130,54 L134,22 L110,42Z" fill="${hc1}"/><path d="M72,48 L70,30 L84,42Z M128,48 L130,30 L116,42Z" fill="${mix(hc1, '#ffb0a0', 0.5)}"/>`);
    if (feats.has('catEars')) headL.push(`<path d="M72,52 L70,26 L90,42Z M128,52 L130,26 L110,42Z" fill="${hc1}"/><path d="M74,46 L73,32 L84,42Z M126,46 L127,32 L116,42Z" fill="#ffb0c0"/>`);
    if (feats.has('mouseEars')) headL.push(`<circle cx="72" cy="40" r="13" fill="${hc1}"/><circle cx="128" cy="40" r="13" fill="${hc1}"/>`);
    if (feats.has('gremlinEars')) headL.push(`<path d="M78,70 L44,52 L76,84Z M122,70 L156,52 L124,84Z" fill="${skin}"/>`);
    headL.push(`<path d="${face}" fill="${skin}"/>`);
    if (skin2) headL.push(`<path d="${face}" fill="${skin2}" ${clip('M100,0 H250 V600 H100Z')}/>`);
    // Ojos
    const eyeAt = (x, col, flip) => {
      const s = flip ? -1 : 1;
      return `<path d="M${x - 6 * s},78 Q${x},70 ${x + 6 * s},76 Q${x + 2 * s},72 ${x - 6 * s},78Z" fill="${shadow}" opacity=".55"/>`
        + `<path d="M${x - 6 * s},80 Q${x},74.5 ${x + 6 * s},79.5 Q${x},85 ${x - 6 * s},80Z" fill="#ffffff"/>`
        + `<circle cx="${x + 0.6 * s}" cy="80.2" r="3.3" fill="${col}"/><circle cx="${x + 0.6 * s}" cy="80.2" r="1.7" fill="#141014"/><circle cx="${x + 1.6 * s}" cy="79" r=".9" fill="#ffffff"/>`
        + `<path d="M${x - 6.5 * s},80 Q${x},73.5 ${x + 6.2 * s},79 L${x + 8.5 * s},76.5" fill="none" stroke="#141014" stroke-width="1.9" stroke-linecap="round"/>`
        + `<path d="M${x - 6 * s},71 Q${x},67.5 ${x + 6 * s},69.5" fill="none" stroke="${shade(hc1, -0.25)}" stroke-width="1.3" stroke-linecap="round"/>`;
    };
    headL.push(eyeAt(89, eye, true), eyeAt(111, eye2, false));
    if (feats.has('skeleton') || feats.has('sugarSkull')) headL.push(`<circle cx="89" cy="80" r="9" fill="none" stroke="#1a1a1a" stroke-width="1.4" opacity=".6"/><circle cx="111" cy="80" r="9" fill="none" stroke="#1a1a1a" stroke-width="1.4" opacity=".6"/><path d="M100,86 l-2,4 h4Z" fill="#1a1a1a"/>`);
    headL.push(`<ellipse cx="83" cy="92" rx="5" ry="3" fill="#ff7a9a" opacity=".3"/><ellipse cx="117" cy="92" rx="5" ry="3" fill="#ff7a9a" opacity=".3"/>`);
    headL.push(`<path d="M99,89 Q100,91 101,89" fill="none" stroke="${shade(skin, -0.3)}" stroke-width="1"/>`);
    headL.push(`<path d="M94.5,98 Q100,95.5 105.5,98 Q100,103.5 94.5,98Z" fill="${lips}"/><path d="M94.5,98 Q100,99.5 105.5,98" stroke="${shade(lips, -0.35)}" stroke-width=".7" fill="none"/>`);
    if (feats.has('fangs')) headL.push(`<path d="M96.5,99 l1,3 l1,-3Z M101.5,99 l1,3 l1,-3Z" fill="#ffffff"/>`);
    if (feats.has('tusks')) headL.push(`<path d="M95,100 l-1,-5 l2.5,3Z M105,100 l1,-5 l-2.5,3Z" fill="#ffffff"/>`);
    if (feats.has('heart')) headL.push(`<path d="M117,92 c-3,-2 -3,-5 -1,-5 c1,0 1,1 1,1 c0,0 0,-1 1,-1 c2,0 2,3 -1,5Z" fill="#e8287a"/>`);
    if (feats.has('clownface')) headL.push(`<circle cx="100" cy="90" r="3.5" fill="#e8283a"/><path d="M89,72 v-8 M111,72 v-8" stroke="#3a8ae8" stroke-width="2"/>`);
    if (feats.has('beauty')) headL.push(`<circle cx="108" cy="96" r=".9" fill="#1a1a1a"/>`);
    if (feats.has('stitches')) headL.push(`<path d="M114,60 Q120,70 116,84" fill="none" stroke="${shade(skin, -0.45)}" stroke-width="1"/><path d="M114,66 h5 M115,72 h5 M115,78 h5" stroke="${shade(skin, -0.45)}" stroke-width=".8"/>`);
    if (feats.has('scales')) headL.push(`<path d="M80,86 a2,2 0 0 1 4,0 M84,88 a2,2 0 0 1 4,0 M116,86 a2,2 0 0 1 4,0" fill="none" stroke="${shade(skin, -0.25)}" stroke-width=".8"/>`);
    if (feats.has('stone')) headL.push(`<path d="M82,60 l6,4 l-2,6 M118,96 l-4,4" fill="none" stroke="${shade(skin, -0.3)}" stroke-width=".8"/>`);
    // Pelo de delante
    for (const d of hs.front) headL.push(`<path d="${d}" fill="${hf}"/>`);
    headL.push(`<path d="M84,52 Q96,44 112,48" fill="none" stroke="#ffffff" stroke-width="3" opacity=".18" stroke-linecap="round"/>`);
    for (const [k, x, y] of hs.top) {
      if (k === 'tie') headL.push(`<circle cx="${x}" cy="${y}" r="5" fill="${C(o.hr?.[3]) || shade(hc2 || hc1, 0.2)}"/>`);
      if (k === 'spikes') headL.push(`<path d="M86,50 L84,22 L94,40 L98,14 L104,38 L112,20 L114,48Z" fill="${hf}"/>`);
      if (k === 'snakes') headL.push(`<g fill="none" stroke="${hc1}" stroke-width="6" stroke-linecap="round">${[[84, 44, 78, 24], [94, 40, 92, 16], [106, 40, 110, 16], [116, 44, 124, 24]].map(([a, b, c, dd]) => `<path d="M${a},${b} Q${a - 6},${(b + dd) / 2} ${c},${dd}"/>`).join('')}</g><g fill="${hc2 || '#c83a3a'}">${[[78, 24], [92, 16], [110, 16], [124, 24]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3"/>`).join('')}</g>`);
    }
    if (feats.has('horns')) headL.push(`<path d="M82,46 Q72,26 80,14 Q82,30 90,42Z M118,46 Q128,26 120,14 Q118,30 110,42Z" fill="${C(o.ft?.find(f => f[0] === 'horns')?.[1]) || '#e8c050'}"/>`);
    if (feats.has('unicorn')) headL.push(`<path d="M96,40 L100,8 L104,40Z" fill="#f4d8f8"/>`);
    if (feats.has('antennae')) headL.push(`<path d="M92,40 Q86,20 78,14 M108,40 Q114,20 122,14" fill="none" stroke="${hc1}" stroke-width="2"/>`);

    // Cabeza: accesorios
    const hd = o.hd ? { t: o.hd[0], c1: C(o.hd[1]) || '#1a1a1a', c2: C(o.hd[2]) } : (feats.has('headdress') ? { t: 'headdress', c1: '#e8c050', c2: '#22a8a8' } : null);
    if (hd) {
      const { t, c1, c2 } = hd;
      if (t === 'bow') headL.push(`<path d="M116,44 L100,32 L102,52Z M116,44 L132,32 L130,52Z" fill="${c1}"/><circle cx="116" cy="43" r="4" fill="${c2 || shade(c1, -0.25)}"/>`);
      if (t === 'bigbow') headL.push(`<path d="M100,36 L74,20 L76,50Z M100,36 L126,20 L124,50Z" fill="${c1}"/><circle cx="100" cy="36" r="6" fill="${c2 || shade(c1, -0.25)}"/>`);
      if (t === 'band') headL.push(`<path d="M76,64 C76,40 90,34 100,34 C110,34 124,40 124,64" fill="none" stroke="${c1}" stroke-width="5"/>`);
      if (t === 'headdress') headL.push(`<path d="M75,62 C78,46 90,40 100,40 C110,40 122,46 125,62" fill="none" stroke="${c1}" stroke-width="4"/><path d="M100,36 l-5,10 h10Z" fill="${c1}"/><circle cx="100" cy="44" r="2.2" fill="${c2 || '#22a8a8'}"/><path d="M76,64 V110 M124,64 V110" stroke="${c1}" stroke-width="3" stroke-dasharray="4 3"/>`);
      if (t === 'tiara') headL.push(`<path d="M84,46 L88,34 L94,42 L100,28 L106,42 L112,34 L116,46Z" fill="${c1}"/><circle cx="100" cy="36" r="2" fill="${c2 || '#ff5fa8'}"/>`);
      if (t === 'crown') headL.push(`<path d="M80,44 L80,22 L90,32 L100,16 L110,32 L120,22 L120,44Z" fill="${c1}"/><circle cx="100" cy="30" r="3" fill="${c2 || '#ff3a5a'}"/>`);
      if (t === 'hat') headL.push(`<path d="M60,50 Q100,36 140,50 Q130,56 100,54 Q70,56 60,50Z" fill="${c1}"/><path d="M80,48 L104,-6 Q110,-10 108,0 L120,46Z" fill="${c1}"/><path d="M80,44 Q100,40 120,42 L120,48 Q100,46 80,50Z" fill="${c2 || shade(c1, 0.3)}"/>`);
      if (t === 'tophat') headL.push(`<g transform="rotate(-10 106 30)"><rect x="90" y="8" width="30" height="30" fill="${c1}"/><rect x="82" y="36" width="46" height="5" rx="2" fill="${c1}"/><rect x="90" y="30" width="30" height="5" fill="${c2 || shade(c1, 0.3)}"/></g>`);
      if (t === 'beret') headL.push(`<path d="M74,48 Q80,24 112,26 Q134,30 128,46 Q100,40 74,48Z" fill="${c1}"/>`);
      if (t === 'cap') headL.push(`<path d="M74,52 Q76,28 100,28 Q124,28 126,52Z" fill="${c1}"/><path d="M100,50 Q130,46 146,54 Q126,58 100,54Z" fill="${c2 || shade(c1, -0.2)}"/>`);
      if (t === 'flower') headL.push(`<g transform="translate(120,50)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-6" rx="4" ry="6" fill="${c1}" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="${c2 || '#ffd23a'}"/></g>`);
      if (t === 'flowers') headL.push(`<g>${[[80, 46], [100, 38], [120, 46]].map(([x, y]) => `<g transform="translate(${x},${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-4" rx="3" ry="4.5" fill="${c1}" transform="rotate(${a})"/>`).join('')}<circle r="2" fill="${c2 || '#ffd23a'}"/></g>`).join('')}</g>`);
      if (t === 'headphones') headL.push(`<path d="M72,76 C70,30 130,30 128,76" fill="none" stroke="${c1}" stroke-width="5"/><rect x="66" y="70" width="10" height="18" rx="4" fill="${c2 || c1}"/><rect x="124" y="70" width="10" height="18" rx="4" fill="${c2 || c1}"/>`);
      if (t === 'goggles') headL.push(`<path d="M74,58 Q100,48 126,58" fill="none" stroke="${shade(c1, -0.3)}" stroke-width="5"/><circle cx="90" cy="54" r="7" fill="${c2 || '#5ac8e8'}" stroke="${c1}" stroke-width="3"/><circle cx="110" cy="54" r="7" fill="${c2 || '#5ac8e8'}" stroke="${c1}" stroke-width="3"/>`);
      if (t === 'veil') backL.push(`<path d="M80,40 Q100,30 120,40 L150,300 Q100,316 50,300Z" fill="${c1}" opacity=".45"/>`);
      if (t === 'hood') backL.push(`<path d="M66,130 Q58,70 100,34 Q142,70 134,130Z" fill="${c1}"/>`);
      if (t === 'shades') headL.push(`<path d="M78,48 Q100,38 122,48 L120,56 Q111,60 102,54 L98,54 Q89,60 80,56Z" fill="${c1}"/><path d="M84,50 Q90,48 96,51 M104,51 Q110,48 116,50" stroke="#ffffff" stroke-width="1.2" opacity=".5" fill="none"/>`);
      if (t === 'sleep') headL.push(`<path d="M76,52 Q100,40 124,52 L122,62 Q100,54 78,62Z" fill="${c1}"/><path d="M84,56 q5,3 10,0 M106,56 q5,3 10,0" stroke="${c2 || shade(c1, -0.4)}" stroke-width="1.2" fill="none"/>`);
      if (t === 'sunhat') headL.push(`<ellipse cx="100" cy="48" rx="50" ry="10" fill="${c1}" transform="rotate(-6 100 48)"/><path d="M78,48 Q78,20 100,20 Q122,20 122,46Z" fill="${c1}"/><path d="M78,44 Q100,38 122,42 L122,48 Q100,44 78,50Z" fill="${c2 || shade(c1, -0.25)}"/>`);
      if (t === 'helmet') headL.push(`<path d="M72,62 Q70,22 100,22 Q130,22 128,62 Q100,54 72,62Z" fill="${c1}"/><path d="M90,26 L90,58 M110,26 L110,58" stroke="${shade(c1, -0.2)}" stroke-width="3"/>`);
      if (t === 'beanie') headL.push(`<path d="M72,60 Q70,20 100,20 Q130,20 128,60Z" fill="${c1}"/><rect x="72" y="52" width="56" height="9" rx="4" fill="${c2 || shade(c1, -0.2)}"/>`);
      if (t === 'bucket') headL.push(`<path d="M76,50 Q78,22 100,22 Q122,22 124,50Z" fill="${c1}"/><path d="M64,58 Q100,40 136,58 L130,48 Q100,40 70,48Z" fill="${shade(c1, -0.15)}"/>`);
      if (t === 'pirate') headL.push(`<path d="M56,46 Q70,18 100,30 Q130,18 144,46 Q120,36 100,44 Q80,36 56,46Z" fill="${c1}"/><path d="M60,44 Q100,30 140,44" stroke="${c2 || '#e8c050'}" stroke-width="2.5" fill="none"/>`);
      if (t === 'clip') headL.push(`<rect x="114" y="52" width="12" height="5" rx="2" fill="${c1}" transform="rotate(-20 120 54)"/>`);
      if (t === 'mask') headL.push(`<path d="M78,74 Q100,66 122,74 L120,86 Q110,90 100,84 Q90,90 80,86Z M82,79 Q89,74 95,79 Q89,84 82,79Z M105,79 Q111,74 118,79 Q111,84 105,79Z" fill="${c1}" fill-rule="evenodd"/>`);
      if (t === 'turban' || t === 'wrap') headL.push(`<path d="M72,60 Q70,30 100,28 Q130,30 128,60 Q100,50 72,60Z" fill="${c1}"/>`);
      if (t === 'skullpin') headL.push(`<g transform="translate(118,52)"><circle r="6" fill="${c1}"/><circle cx="-2" cy="-1" r="1.4" fill="#1a1a1a"/><circle cx="2" cy="-1" r="1.4" fill="#1a1a1a"/></g>`);
    }
    // Gafas
    if (ac.has('glasses') || (feats.has('glasses') && !ac.has('noglasses'))) {
      const gc = ac.get('glasses') || '#f4f4f4';
      headL.push(`<path d="M79,74 Q89,70 97,75 L96,84 Q88,88 80,84Z M121,74 Q111,70 103,75 L104,84 Q112,88 120,84Z" fill="#ffffff" fill-opacity=".2" stroke="${gc}" stroke-width="2.2"/><path d="M97,77 Q100,75 103,77" stroke="${gc}" stroke-width="2" fill="none"/><path d="M79,74 L74,70 M121,74 L126,70" stroke="${gc}" stroke-width="2.2"/>`);
    }
    if (ac.has('sunglasses') || feats.has('sunglasses')) headL.push(`<path d="M78,74 H98 V82 Q88,88 78,82Z M102,74 H122 V82 Q112,88 102,82Z" fill="${ac.get('sunglasses') || '#1a1a1a'}"/><path d="M98,76 H102" stroke="#1a1a1a" stroke-width="2"/>`);
    if (feats.has('hoops') || ac.has('earrings')) headL.push(`<circle cx="76" cy="92" r="4" fill="none" stroke="${ac.get('earrings') || '#e8c050'}" stroke-width="1.4"/><circle cx="124" cy="92" r="4" fill="none" stroke="${ac.get('earrings') || '#e8c050'}" stroke-width="1.4"/>`);

    return `<g><defs>${defs.join('')}</defs>${backL.join('')}${legL.join('')}${torL.join('')}${armL.join('')}${headL.join('')}</g>`;
  }

  /* ── Muñeca (una o un set) ── */
  function svg(id) {
    const d = DOLLS[id];
    const look = LOOKS[id];
    const specs = Array.isArray(look) ? look : [look];
    const chars = d.chars.length === 1 && CHARS[d.chars[0]]?.feats?.includes('twins') ? [d.chars[0], d.chars[0]] : d.chars;
    const n = chars.length;
    const figs = chars.map((c, i) => figure(specs[i] ?? specs[0] ?? '', c));
    if (n === 1) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 0 180 480" width="180" height="480">${figs[0]}</svg>`;
    const step = 120, W = 180 + step * (n - 1);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 0 ${W} 480" width="${W}" height="480">${figs.map((f, i) => `<g transform="translate(${i * step},0)">${f}</g>`).join('')}</svg>`;
  }
  return { svg, figure, parse };
})();
