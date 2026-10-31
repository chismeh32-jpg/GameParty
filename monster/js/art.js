'use strict';

/* ══════════════════════════════════════
   ILUSTRACIONES · muñecas, mascotas y accesorios en SVG
   Todo se dibuja con código: no hay imágenes de terceros.
══════════════════════════════════════ */
const Art = (() => {
  /* ── Color ── */
  const rgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (h, a) => hex(rgb(h).map(v => (a < 0 ? v * (1 + a) : v + (255 - v) * a)));
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
  const lum = h => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const hash = s => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* ── Estampados ── */
  function pattern(id, kind, c1, c2, c3) {
    const P = (w, h, body, extra = '') => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}" ${extra}><rect width="${w}" height="${h}" fill="${c1}"/>${body}</pattern>`;
    switch (kind) {
      case 'plaid': return P(16, 16, `<rect y="5" width="16" height="5" fill="${c2}" opacity=".55"/><rect x="5" width="5" height="16" fill="${c2}" opacity=".55"/><rect y="12" width="16" height="1.2" fill="${c3}" opacity=".7"/><rect x="12" width="1.2" height="16" fill="${c3}" opacity=".7"/>`);
      case 'hearts': return P(18, 18, `<path d="M9,13 C3,9 4,4 7,4 C8.4,4 9,5 9,6 C9,5 9.6,4 11,4 C14,4 15,9 9,13Z" fill="${c2}"/><path d="M0,4 C-3,2 -2,0 0,0.6 C2,0 3,2 0,4Z" fill="${c3}" opacity=".7"/>`);
      case 'leopard': return P(22, 22, `<path d="M4,4 q4,-3 7,1 q-1,5 -5,4 q-4,-1 -2,-5Z M14,13 q4,-2 6,2 q-2,4 -5,3 q-3,-2 -1,-5Z M2,15 q3,0 3,3 q-3,2 -4,0Z" fill="none" stroke="${c2}" stroke-width="1.8"/><circle cx="7" cy="6" r="1.4" fill="${c3}"/><circle cx="17" cy="16" r="1.3" fill="${c3}"/>`);
      case 'stripes': return P(10, 10, `<rect width="5" height="10" fill="${c2}"/>`, 'patternTransform="rotate(35)"');
      case 'scales': return P(12, 10, `<path d="M0,10 a6,6 0 0 1 12,0 M-6,5 a6,6 0 0 1 12,0 M6,5 a6,6 0 0 1 12,0" fill="none" stroke="${c2}" stroke-width="1.2" opacity=".75"/>`);
      case 'snow': return P(16, 16, `<path d="M8,4 v8 M4,8 h8 M5,5 l6,6 M11,5 l-6,6" stroke="${c3}" stroke-width="1" opacity=".8"/><circle cx="1" cy="1" r="1" fill="${c2}"/>`);
      case 'polka': return P(14, 14, `<circle cx="7" cy="7" r="2.6" fill="${c2}"/><circle cx="0" cy="0" r="2.6" fill="${c2}"/><circle cx="14" cy="14" r="2.6" fill="${c2}"/><circle cx="14" cy="0" r="2.6" fill="${c2}"/><circle cx="0" cy="14" r="2.6" fill="${c2}"/>`);
      case 'tiger': return P(24, 24, `<path d="M0,4 q6,4 12,0 q6,-4 12,0 M0,16 q6,4 12,0 q6,-4 12,0" fill="none" stroke="${c2}" stroke-width="3" stroke-linecap="round"/>`);
      case 'flames': return P(20, 24, `<path d="M10,22 q-7,-5 -2,-12 q0,4 3,4 q-2,-6 3,-12 q1,6 4,8 q3,6 -8,12Z" fill="${c2}" opacity=".85"/><path d="M10,21 q-3,-3 0,-7 q1,3 3,3 q0,3 -3,4Z" fill="${c3}"/>`);
      case 'leaves': return P(18, 18, `<path d="M3,15 q2,-10 12,-12 q-2,10 -12,12Z" fill="${c2}"/><path d="M3,15 L15,3" stroke="${c3}" stroke-width=".8"/>`);
      case 'gears': return P(18, 18, `<circle cx="9" cy="9" r="4.2" fill="none" stroke="${c2}" stroke-width="2.4" stroke-dasharray="2 1.3"/><circle cx="9" cy="9" r="1.4" fill="${c2}"/>`);
      case 'flowers': return P(20, 20, `<g fill="${c2}"><circle cx="10" cy="6" r="2.6"/><circle cx="14" cy="9.5" r="2.6"/><circle cx="12.5" cy="14" r="2.6"/><circle cx="7.5" cy="14" r="2.6"/><circle cx="6" cy="9.5" r="2.6"/></g><circle cx="10" cy="10.5" r="1.8" fill="${c3}"/>`);
      case 'paint': return P(24, 24, `<path d="M5,6 q3,-3 6,0 q2,4 -2,5 q-5,1 -4,-5Z" fill="${c2}"/><circle cx="17" cy="16" r="3" fill="${c3}"/><circle cx="21" cy="11" r="1.2" fill="${c2}"/>`);
      case 'stars': return P(18, 18, `<path d="M9,3 l1.6,3.6 3.9,.4 -3,2.6 .9,3.9 -3.4,-2 -3.4,2 .9,-3.9 -3,-2.6 3.9,-.4Z" fill="${c3}"/>`);
      case 'zigzag': return P(16, 10, `<path d="M0,7 l4,-4 4,4 4,-4 4,4" fill="none" stroke="${c2}" stroke-width="2.4"/>`);
      case 'skulls': return P(20, 20, `<path d="M10,4 c-3.5,0 -5,2.4 -5,4.6 c0,1.6 .9,2.6 2,3 v1.8 h6 v-1.8 c1.1,-.4 2,-1.4 2,-3 c0,-2.2 -1.5,-4.6 -5,-4.6Z" fill="${c2}"/><circle cx="8" cy="8.6" r="1.1" fill="${c1}"/><circle cx="12" cy="8.6" r="1.1" fill="${c1}"/>`);
      case 'pinstripe': return P(8, 8, `<rect x="3.6" width=".9" height="8" fill="${c2}"/>`);
      case 'patch': return P(30, 30, `<rect width="15" height="15" fill="${c2}"/><rect x="15" y="15" width="15" height="15" fill="${c3}"/><path d="M15,0 v30 M0,15 h30" stroke="#1a1a1a" stroke-width=".8" stroke-dasharray="2 1.5"/>`);
      default: return P(10, 10, '');
    }
  }

  /* ── Paleta según la colección ── */
  const PERMS = [[0, 1, 2], [1, 0, 2], [0, 2, 1], [2, 0, 1], [1, 2, 0]];
  const THEME_TINT = {
    pajamas: ['#ffffff', 0.38], beach: ['#ffd23f', 0.2], tropical: ['#ff7a3a', 0.22], halloween: ['#ff7a1a', 0.25],
    neon: ['#39ff8a', 0.3], winter: ['#ffffff', 0.28], ghostly: ['#e8e0ff', 0.35], ocean: ['#2ad8d8', 0.3],
    garden: ['#ff9ad8', 0.22], mystery: ['#8a6a4a', 0.3], casbah: ['#e8b850', 0.25], g2: ['#ff6ad8', 0.12],
  };
  function paletteFor(doll, ch) {
    const line = LINE_BY_ID[doll.line];
    let pal = ch.pal;
    if (line.theme === 'fusion' && FUSION_OF[doll.char]) {
      const [a, b] = FUSION_OF[doll.char];
      pal = [CHARS[a].pal[0], CHARS[b].pal[0], CHARS[a].pal[1]];
    }
    const perm = ch.outfit ? PERMS[0] : PERMS[hash(doll.line) % PERMS.length];
    let p = perm.map(i => pal[i]);
    if (line.id === 'sk_beetle2' || line.id === 'sk_elvira2') p = [p[0], shade(p[1], 0.1), mix(p[2], '#8a3ac8', 0.4)];
    const t = THEME_TINT[line.theme];
    if (t) p = p.map(c => mix(c, t[0], t[1]));
    if (['gala', 'couture', 'runway', 'redcarpet'].includes(line.theme)) p = [shade(p[0], -0.08), p[1], '#e8c050'];
    if (line.theme === 'iridescent') p = [mix(p[0], '#d8c8ff', 0.4), mix(p[1], '#c8fff0', 0.4), '#ffffff'];
    return p;
  }
  const FUSION_OF = { cleolei: ['cleo', 'toralei'], lagoonafire: ['lagoona', 'jinafire'], dracubecca: ['draculaura', 'robecca'], clawvenus: ['clawdeen', 'venus'] };

  /* ── Ropa por tema ── */
  // top: tee | corset | crop | jacket | bodysuit | nightie | swim | coat | none
  // bottom: mini | flare | tutu | gown | mermaid | shorts | pants | harem | none
  const THEMES = {
    school: { top: 'tee', bottom: 'mini', patOn: 'bottom', shoes: 'boots', extras: ['belt'] },
    jacket: { top: 'jacket', bottom: 'mini', patOn: 'bottom', shoes: 'heels', extras: [] },
    party: { top: 'corset', bottom: 'tutu', patOn: 'top', shoes: 'heels', extras: ['necklace'] },
    pajamas: { top: 'nightie', bottom: 'none', patOn: 'top', shoes: 'slippers', extras: ['sleepmask'] },
    beach: { top: 'swim', bottom: 'sarong', patOn: 'top', shoes: 'sandals', extras: ['headSunglasses'] },
    tropical: { top: 'swim', bottom: 'sarong', patOn: 'bottom', shoes: 'sandals', extras: ['flower'] },
    gala: { top: 'corset', bottom: 'gown', patOn: 'none', shoes: 'heels', extras: ['necklace', 'gloves'] },
    halloween: { top: 'corset', bottom: 'flare', patOn: 'bottom', shoes: 'boots', extras: ['cape'] },
    picture: { top: 'tee', bottom: 'flare', patOn: 'bottom', shoes: 'heels', extras: ['hairbow'] },
    travel: { top: 'jacket', bottom: 'mini', patOn: 'top', shoes: 'boots', extras: ['beret', 'scarf'] },
    hero: { top: 'bodysuit', bottom: 'none', patOn: 'none', shoes: 'boots', extras: ['cape', 'eyemask', 'emblem'] },
    casbah: { top: 'crop', bottom: 'harem', patOn: 'bottom', shoes: 'sandals', extras: ['bangles', 'headband'] },
    redcarpet: { top: 'corset', bottom: 'gown', patOn: 'none', shoes: 'heels', extras: ['stole', 'sparkle'] },
    fusion: { top: 'corset', bottom: 'flare', patOn: 'bottom', shoes: 'boots', extras: ['split'] },
    ghostly: { top: 'corset', bottom: 'gown', patOn: 'none', shoes: 'heels', extras: ['chains', 'sheer'] },
    broadway: { top: 'corset', bottom: 'mini', patOn: 'none', shoes: 'heels', extras: ['gloves', 'tophat', 'sparkle'] },
    ocean: { top: 'corset', bottom: 'mermaid', patOn: 'bottom', shoes: 'none', extras: ['glow', 'shell'] },
    blackwhite: { top: 'tee', bottom: 'mini', patOn: 'bottom', shoes: 'boots', extras: ['belt', 'gray'] },
    g2: { top: 'tee', bottom: 'mini', patOn: 'top', shoes: 'sneakers', extras: ['hairbow'] },
    neon: { top: 'jacket', bottom: 'shorts', patOn: 'none', shoes: 'boots', extras: ['glow'] },
    g3: { top: 'crop', bottom: 'mini', patOn: 'bottom', shoes: 'boots', extras: ['jacketOpen'] },
    casual: { top: 'tee', bottom: 'pants', patOn: 'top', shoes: 'sneakers', extras: [] },
    winter: { top: 'coat', bottom: 'mini', patOn: 'none', shoes: 'boots', extras: ['furtrim', 'earmuffs'] },
    iridescent: { top: 'corset', bottom: 'flare', patOn: 'none', shoes: 'heels', extras: ['irid'] },
    mystery: { top: 'coat', bottom: 'mini', patOn: 'top', shoes: 'boots', extras: ['deerstalker'] },
    fest: { top: 'crop', bottom: 'shorts', patOn: 'top', shoes: 'boots', extras: ['flowercrown'] },
    garden: { top: 'corset', bottom: 'flare', patOn: 'bottom', shoes: 'heels', extras: ['flowercrown'] },
    couture: { top: 'corset', bottom: 'gown', patOn: 'bottom', shoes: 'heels', extras: ['bigcollar', 'gloves'] },
    runway: { top: 'bodysuit', bottom: 'none', patOn: 'none', shoes: 'heels', extras: ['bigcollar', 'cape'] },
  };
  // Trajes de los personajes Skullector
  const COSTUMES = {
    clown: { top: 'tee', bottom: 'pants', patOn: 'none', shoes: 'boots', extras: ['ruff', 'pompoms'], mono: true },
    collarDress: { top: 'tee', bottom: 'flare', patOn: 'none', shoes: 'heels', extras: ['whitecollar'] },
    stripedSuit: { top: 'jacket', bottom: 'pants', patOn: 'all', pat: 'pinstripeBold', shoes: 'boots', extras: [] },
    redGown: { top: 'corset', bottom: 'gown', patOn: 'none', shoes: 'heels', extras: ['veil', 'gloves'], mono: true },
    cape: { top: 'jacket', bottom: 'pants', patOn: 'none', shoes: 'boots', extras: ['cape', 'medal'] },
    suit: { top: 'jacket', bottom: 'pants', patOn: 'none', shoes: 'boots', extras: [] },
    whiteGown: { top: 'corset', bottom: 'gown', patOn: 'none', shoes: 'heels', extras: ['drape'], mono: true },
    blackGown: { top: 'corset', bottom: 'gown', patOn: 'none', shoes: 'heels', extras: ['drape'], mono: true },
    overalls: { top: 'tee', bottom: 'pants', patOn: 'none', shoes: 'sneakers', extras: ['overalls', 'rainbow'] },
    leather: { top: 'jacket', bottom: 'mini', patOn: 'none', shoes: 'boots', extras: [] },
    pinstripe: { top: 'jacket', bottom: 'pants', patOn: 'all', pat: 'pinstripe', shoes: 'boots', extras: ['batbow'] },
    patchwork: { top: 'tee', bottom: 'gown', patOn: 'all', pat: 'patch', shoes: 'none', extras: [] },
    witch: { top: 'corset', bottom: 'gown', patOn: 'none', shoes: 'heels', extras: ['cape'] },
    raincoat: { top: 'coat', bottom: 'pants', patOn: 'none', shoes: 'boots', extras: [] },
    bodysuit: { top: 'bodysuit', bottom: 'none', patOn: 'none', shoes: 'heels', extras: ['web'] },
    coverall: { top: 'bodysuit', bottom: 'none', patOn: 'none', shoes: 'boots', extras: ['zip'] },
    fur: { top: 'coat', bottom: 'pants', patOn: 'none', shoes: 'boots', extras: ['furtrim', 'chainsBig'] },
    sack: { top: 'sack', bottom: 'none', patOn: 'none', shoes: 'none', extras: [] },
  };

  /* ── Peinados: [atrás, flequillo, mecha atrás, mecha delante] ── */
  const HAIR = {
    long: ['M54,70 Q48,18 100,16 Q152,18 146,70 Q150,150 150,236 Q124,246 100,240 Q76,246 50,236 Q50,150 54,70Z',
      'M58,84 Q54,26 100,22 Q146,24 142,72 Q134,46 112,44 Q86,46 72,60 Q64,70 58,84Z',
      'M122,24 Q142,34 145,70 Q149,150 147,234 L137,238 Q139,150 135,72 Q132,46 114,30Z', 'M90,28 Q76,40 66,66 L74,68 Q82,48 98,36Z'],
    longStraight: ['M54,72 Q48,18 100,16 Q152,18 146,72 L150,238 Q100,246 50,238Z',
      'M58,86 Q56,24 100,22 Q144,24 142,86 Q140,48 102,30 L98,30 Q60,48 58,86Z',
      'M54,90 L50,236 L62,238 L64,90Z', 'M100,24 Q80,30 66,60 L72,64 Q84,38 100,30Z'],
    pigtails: ['M56,72 Q50,20 100,18 Q150,20 144,72 Q140,60 100,58 Q60,60 56,72Z M60,44 Q32,56 32,112 Q32,164 22,216 Q46,218 52,172 Q60,122 64,62Z M140,44 Q168,56 168,112 Q168,164 178,216 Q154,218 148,172 Q140,122 136,62Z',
      'M60,72 Q56,22 100,20 Q144,22 140,72 L135,62 L127,67 L119,60 L110,67 L100,60 L90,67 L81,60 L73,67 L65,62Z',
      'M48,64 Q38,100 40,146 Q40,180 32,212 L39,212 Q48,180 47,146 Q46,104 54,66Z M152,64 Q162,100 160,146 Q160,180 168,212 L161,212 Q152,180 153,146 Q154,104 146,66Z', ''],
    big: ['M100,10 Q58,6 44,40 Q20,70 36,110 Q16,150 38,190 Q34,224 64,228 Q80,238 100,230 Q120,238 136,228 Q166,224 162,190 Q184,150 164,110 Q180,70 156,40 Q142,6 100,10Z',
      'M58,86 Q46,30 100,18 Q152,24 148,76 Q138,48 112,46 Q84,44 70,62 Q62,72 58,86Z',
      'M150,60 Q172,100 158,150 Q170,190 150,222 L144,214 Q158,186 148,150 Q160,104 142,64Z', 'M78,24 Q62,36 60,60 L68,60 Q70,40 86,28Z'],
    wavy: ['M54,70 Q46,18 100,16 Q154,18 146,70 Q158,110 146,140 Q160,180 148,214 Q156,238 128,240 Q100,232 72,240 Q44,238 52,214 Q40,180 54,140 Q42,110 54,70Z',
      'M58,84 Q52,26 100,20 Q148,26 144,74 Q136,48 112,46 Q86,46 72,60 Q64,70 58,84Z',
      'M138,40 Q158,80 146,120 Q160,160 146,200 Q154,222 140,236 L134,228 Q144,214 138,198 Q150,160 138,120 Q148,84 130,46Z', 'M84,28 Q70,40 64,62 L72,62 Q78,44 92,34Z'],
    updo: ['M56,76 Q50,24 100,20 Q150,24 144,76 Q146,104 138,118 L62,118 Q54,104 56,76Z M100,-6 a24,22 0 1 1 -0.1,0Z',
      'M58,88 Q52,28 100,22 Q142,26 140,62 Q120,42 96,46 Q74,52 66,76Z',
      'M86,0 Q100,8 114,0 Q118,14 100,20 Q82,14 86,0Z', 'M62,70 Q60,40 82,30 L86,36 Q68,46 68,72Z'],
    side: ['M54,70 Q48,18 100,16 Q152,18 148,70 Q158,150 154,242 Q124,252 104,236 Q82,220 54,204 Q46,130 54,70Z',
      'M56,94 Q48,24 104,22 Q150,26 142,74 Q130,40 100,44 Q76,52 66,72 Q60,82 56,94Z',
      'M128,30 Q150,50 150,90 Q158,160 152,236 L142,238 Q146,160 140,90 Q138,52 120,36Z', 'M62,86 Q60,48 90,32 L94,38 Q70,54 68,88Z'],
    victory: ['M56,80 Q50,30 100,26 Q150,30 144,80 Q152,112 140,130 Q120,122 100,124 Q80,122 60,130 Q48,112 56,80Z',
      'M60,70 Q58,40 76,26 a20,16 0 0 1 24,4 a20,16 0 0 1 24,-4 Q142,40 140,70 Q126,48 100,48 Q74,48 60,70Z',
      'M64,40 a14,12 0 1 1 26,-6 a10,8 0 1 0 -18,4Z', 'M110,34 a14,12 0 1 1 26,6 a10,8 0 1 0 -18,-4Z'],
    short: ['M54,74 Q48,20 100,16 Q152,20 146,74 Q152,104 146,124 L136,116 L130,128 L120,118 L80,118 L70,128 L64,116 L54,124 Q48,104 54,74Z',
      'M58,82 Q52,24 100,20 Q148,24 142,74 L134,58 L126,66 L116,52 L106,62 L94,50 L84,62 L76,54 L68,68Z',
      'M128,30 Q146,44 146,74 Q150,96 144,112 L138,104 Q142,86 138,72 Q136,46 122,34Z', 'M80,30 L72,52 L80,48 L86,32Z'],
    bob: ['M54,72 Q48,20 100,16 Q152,20 146,72 Q152,110 146,132 Q126,138 116,128 L84,128 Q74,138 54,132 Q48,110 54,72Z',
      'M60,70 Q58,22 100,20 Q142,22 140,70 Q120,58 100,60 Q80,58 60,70Z',
      'M132,40 Q148,70 146,128 L138,130 Q140,80 126,44Z', 'M74,28 Q64,44 62,66 L70,64 Q72,46 82,32Z'],
    pony: ['M56,74 Q50,22 100,18 Q150,22 144,74 L140,100 L60,100Z M118,26 Q162,18 166,70 Q172,140 152,206 Q144,152 140,112 Q136,64 116,44Z',
      'M58,84 Q52,26 100,22 Q146,24 142,70 Q130,46 108,46 Q84,46 70,62 Q62,72 58,84Z',
      'M150,40 Q166,90 158,150 L150,170 Q156,110 144,56Z', ''],
    halfShaved: ['M100,16 Q152,18 148,70 Q156,150 150,232 Q124,242 104,234 Q112,150 106,80Z',
      'M84,26 Q122,14 144,42 Q150,62 146,94 Q132,54 104,44 Q92,40 84,26Z',
      'M128,40 Q146,70 146,110 Q150,170 144,226 L136,226 Q142,170 138,110 Q138,70 122,46Z', ''],
    boy: ['M56,74 Q50,20 100,18 Q150,20 144,74 Q146,90 142,100 L58,100 Q54,90 56,74Z',
      'M58,74 Q54,22 100,20 Q146,22 142,74 Q136,52 124,48 Q100,40 76,48 Q66,52 58,74Z',
      'M110,22 Q130,26 138,46 L130,46 Q124,32 108,28Z', ''],
    flames: ['M60,74 Q48,40 62,30 Q56,8 80,14 Q82,-4 100,8 Q118,-6 122,14 Q144,6 140,30 Q154,40 140,74 Q122,52 100,54 Q78,52 60,74Z',
      'M62,70 Q60,44 76,38 Q80,52 90,46 Q94,30 104,36 Q108,52 118,44 Q126,36 136,46 Q140,58 138,70 Q120,56 100,58 Q80,56 62,70Z',
      'M80,16 Q84,30 92,36 Q88,22 98,10 Q100,26 108,32 Q110,18 120,16 Q116,30 120,40 L80,40Z', ''],
    snakes: ['M58,72 Q54,40 72,32 Q100,24 128,32 Q146,40 142,72 Q120,60 100,60 Q80,60 58,72Z', '', '', ''],
    snakesLong: ['M56,72 Q50,24 100,20 Q150,24 144,72 Q140,60 100,58 Q60,60 56,72Z', '', '', ''],
    braids: ['M56,72 Q50,20 100,18 Q150,20 144,72 Q140,100 132,108 L68,108 Q60,100 56,72Z',
      'M58,82 Q56,24 100,22 Q144,24 142,82 Q138,46 101,30 L99,30 Q62,46 58,82Z', '', ''],
    beehive: ['M100,-14 Q40,-12 40,50 Q36,90 50,110 Q30,140 48,170 Q60,160 64,130 L136,130 Q140,160 152,170 Q170,140 150,110 Q164,90 160,50 Q160,-12 100,-14Z',
      'M60,84 Q54,30 100,26 Q146,30 140,84 Q132,52 100,50 Q68,52 60,84Z', '', ''],
    bride: ['M60,74 Q44,20 62,-12 Q80,-36 100,-38 Q120,-36 138,-12 Q156,20 140,74 Q140,100 132,116 L68,116 Q60,100 60,74Z',
      'M60,80 Q56,30 100,26 Q144,30 140,80 Q130,50 100,48 Q70,50 60,80Z',
      'M70,-4 Q74,-20 84,-28 L90,-24 Q80,-12 78,2 L86,6 Q82,24 72,36Z M130,-4 Q126,-20 116,-28 L110,-24 Q120,-12 122,2 L114,6 Q118,24 128,36Z', ''],
    clown: ['M58,64 Q40,48 34,64 Q24,74 36,86 Q30,98 46,100 Q56,96 60,84Z M142,64 Q160,48 166,64 Q176,74 164,86 Q170,98 154,100 Q144,96 140,84Z', '', '', ''],
    messy: ['M54,76 Q42,40 60,30 Q52,10 76,14 Q86,-2 102,10 Q120,-2 128,16 Q150,12 144,36 Q160,52 146,78 Q150,100 140,112 L60,112 Q50,100 54,76Z',
      'M58,80 Q54,40 68,34 L72,52 L80,36 L88,52 L96,34 L104,50 L112,34 L120,52 L128,38 L136,50 L142,74 Q138,44 120,40 L80,40 Q66,46 58,80Z', '', ''],
    lydia: ['M54,74 Q48,20 100,16 Q152,20 146,74 Q150,110 144,128 L56,128 Q50,110 54,74Z',
      'M58,76 Q54,22 100,20 Q146,22 142,76 L134,64 L128,74 L120,62 L112,74 L104,60 L96,74 L88,60 L80,74 L72,62 L66,74Z', '', ''],
    slick: ['M56,72 Q50,22 100,18 Q150,22 144,72 Q146,92 140,100 L60,100 Q54,92 56,72Z',
      'M58,70 Q56,24 100,22 Q144,24 142,70 Q130,48 112,46 L100,60 L88,46 Q70,48 58,70Z', '', ''],
    flat: ['M58,70 L58,22 L142,22 L142,70 Q140,56 100,54 Q60,56 58,70Z', 'M58,52 L58,22 L142,22 L142,52 L132,46 L120,52 L108,46 L96,52 L84,46 L72,52Z', '', ''],
    winifred: ['M56,80 Q42,40 62,20 Q56,-6 80,-8 Q92,-20 100,4 Q108,-20 120,-8 Q144,-6 138,20 Q158,40 144,80 Q150,110 140,124 L60,124 Q50,110 56,80Z',
      'M58,84 Q56,34 100,28 Q144,34 142,84 Q134,52 112,50 Q100,62 88,50 Q66,52 58,84Z', '', ''],
    mary: ['M56,76 Q48,24 100,16 Q150,4 160,-16 Q170,30 146,76 Q150,110 140,122 L60,122 Q50,110 56,76Z',
      'M58,82 Q56,30 104,22 Q146,14 160,-14 Q156,40 142,72 Q130,48 108,48 Q78,48 58,82Z', '', ''],
    flatTop: ['M56,74 L54,8 Q100,0 146,8 L144,74 Q146,100 140,112 L60,112 Q54,100 56,74Z', 'M58,70 L58,10 L142,10 L142,70 Q130,50 100,48 Q70,50 58,70Z', '', ''],
    bald: ['', '', '', ''],
  };

  /* ── Cuerpo ── */
  const GIRL = {
    torso: 'M74,150 C80,142 120,142 126,150 L120,176 Q117,192 118,202 L82,202 Q83,192 80,176Z',
    hips: 'M82,200 L118,200 Q124,214 122,232 L78,232 Q76,214 82,200Z',
    legL: 'M80,228 L99,228 L97,300 Q96,330 94,372 L86,372 Q84,330 83,300Z',
    legR: 'M101,228 L120,228 L117,300 Q116,330 114,372 L106,372 Q104,330 103,300Z',
    armL: 'M77,152 Q66,176 64,198 Q62,222 61,244',
    armR: ['M123,152 Q134,176 136,198 Q138,222 139,244', 'M123,152 Q140,170 142,188 Q138,200 121,208'],
    handL: [61, 250], handR: [[139, 250], [119, 209]],
  };
  const BOY = {
    torso: 'M70,150 C78,142 122,142 130,150 L125,200 L75,200Z',
    hips: 'M75,198 L125,198 L123,232 L77,232Z',
    legL: 'M78,228 L99,228 L97,372 L84,372Z',
    legR: 'M101,228 L122,228 L116,372 L103,372Z',
    armL: 'M73,152 Q62,176 60,198 Q58,222 58,244',
    armR: ['M127,152 Q138,176 140,198 Q142,222 142,244', 'M127,152 Q144,170 146,188 Q142,202 124,206'],
    handL: [58, 250], handR: [[142, 250], [122, 207]],
  };

  const TOPS = {
    tee: b => `<path d="${b === BOY ? 'M68,149 C78,140 122,140 132,149 L126,204 L74,204Z' : 'M72,150 C80,140 120,140 128,150 L121,176 Q118,192 119,204 L81,204 Q82,192 79,176Z'}"/>`,
    corset: () => '<path d="M77,160 Q100,153 123,160 L119,180 Q117,194 118,205 L82,205 Q83,194 81,180Z"/>',
    crop: () => '<path d="M73,150 C80,141 120,141 127,150 L122,182 Q100,186 78,182Z"/>',
    jacket: b => b === BOY ? '<path d="M68,149 C78,140 122,140 132,149 L126,206 L74,206Z"/>' : '<path d="M72,150 C80,140 120,140 128,150 L122,178 Q118,194 120,208 L80,208 Q82,194 78,178Z"/>',
    bodysuit: b => `<path d="${b === BOY ? 'M70,150 C78,142 122,142 130,150 L125,200 L75,200Z' : GIRL.torso}"/><path d="${b.hips}"/><path d="${b.legL}"/><path d="${b.legR}"/>`,
    nightie: () => '<path d="M74,150 C80,142 120,142 126,150 L122,176 Q138,236 136,266 Q100,276 64,266 Q62,236 78,176Z"/>',
    swim: () => '<path d="M78,158 Q100,152 122,158 L119,180 Q117,194 118,204 Q122,214 112,228 L100,232 L88,228 Q78,214 82,204 Q83,194 81,180Z"/>',
    coat: b => `<path d="${b === BOY ? 'M66,148 C78,140 122,140 134,148 L136,300 L64,300Z' : 'M70,148 C80,140 120,140 130,148 L138,300 Q100,306 62,300Z'}"/>`,
    sack: () => '<path d="M100,20 Q150,24 160,120 Q176,260 160,370 Q100,392 40,370 Q24,260 40,120 Q50,24 100,20Z"/>',
  };
  const BOTTOMS = {
    mini: () => '<path d="M80,198 L120,198 L131,252 Q100,258 69,252Z"/>',
    flare: () => '<path d="M80,198 L120,198 L142,272 Q100,284 58,272Z"/>',
    tutu: () => '<path d="M80,198 L120,198 L140,236 Q130,246 120,240 Q110,250 100,242 Q90,250 80,240 Q70,246 60,236Z"/><path d="M78,212 L122,212 L146,258 Q134,268 122,260 Q112,270 100,262 Q88,270 78,260 Q66,268 54,258Z" opacity=".75"/>',
    gown: () => '<path d="M80,198 L120,198 Q132,280 152,390 Q100,400 48,390 Q68,280 80,198Z"/>',
    mermaid: () => '<path d="M80,198 L120,198 Q128,262 112,330 L138,394 Q118,384 100,392 Q82,384 62,394 L88,330 Q72,262 80,198Z"/>',
    shorts: () => '<path d="M80,198 L120,198 L123,242 L102,244 L100,230 L98,244 L77,242Z"/>',
    pants: b => b === BOY ? '<path d="M75,198 L125,198 L122,300 L118,370 L103,370 L101,236 L99,236 L97,370 L82,370 L78,300Z"/>' : '<path d="M80,198 L120,198 L118,300 L116,368 L104,368 L101,234 L99,234 L96,368 L84,368 L82,300Z"/>',
    harem: () => '<path d="M80,198 L120,198 Q134,290 118,362 L104,362 Q108,300 100,242 Q92,300 96,362 L82,362 Q66,290 80,198Z"/>',
    sarong: () => '<path d="M81,204 L120,198 L128,262 Q112,256 94,238Z"/>',
  };
  const SHOES = {
    heels: (c) => `<path d="M82,366 L97,366 Q99,376 98,384 L80,384 Q79,374 82,366Z" fill="${c}"/><path d="M78,384 L99,384 L99,391 L78,391Z" fill="${shade(c, -0.35)}"/>`,
    boots: (c) => `<path d="M82,316 L98,316 L98,384 L79,384 Q79,350 82,316Z" fill="${c}"/><path d="M77,384 L100,384 L100,392 L77,392Z" fill="${shade(c, -0.4)}"/><path d="M82,322 L98,322" stroke="${shade(c, 0.3)}" stroke-width="2"/>`,
    sneakers: (c) => `<path d="M80,366 L98,366 Q103,380 101,388 L78,388 Q76,376 80,366Z" fill="#f4f4f4"/><path d="M80,374 L99,374" stroke="${c}" stroke-width="3"/><path d="M77,388 L102,388 L102,392 L77,392Z" fill="${c}"/>`,
    slippers: (c) => `<ellipse cx="90" cy="384" rx="13" ry="7" fill="${c}"/><circle cx="90" cy="378" r="5" fill="#ffffff" opacity=".8"/>`,
    sandals: (c) => `<path d="M80,384 L100,384 L100,389 L80,389Z" fill="${shade(c, -0.3)}"/><path d="M84,372 L96,380 M96,372 L84,380" stroke="${c}" stroke-width="2.2"/>`,
    none: () => '',
  };

  /* ── Detalles reutilizables ── */
  const heartPath = (x, y, s) => `M${x},${y + 4 * s} C${x - 6 * s},${y} ${x - 5 * s},${y - 5 * s} ${x - 2 * s},${y - 5 * s} C${x - 0.6 * s},${y - 5 * s} ${x},${y - 4 * s} ${x},${y - 3 * s} C${x},${y - 4 * s} ${x + 0.6 * s},${y - 5 * s} ${x + 2 * s},${y - 5 * s} C${x + 5 * s},${y - 5 * s} ${x + 6 * s},${y} ${x},${y + 4 * s}Z`;
  const starPath = (x, y, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`; } return d + 'Z'; };
  const stitch = (x1, y1, x2, y2, n = 4, c = '#2a2a2a') => {
    let s = `<path d="M${x1},${y1} L${x2},${y2}" stroke="${c}" stroke-width="1.3"/>`;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), nx = -dy / len * 3, ny = dx / len * 3;
    for (let i = 1; i <= n; i++) { const t = i / (n + 1), x = x1 + dx * t, y = y1 + dy * t; s += `<path d="M${(x - nx).toFixed(1)},${(y - ny).toFixed(1)} L${(x + nx).toFixed(1)},${(y + ny).toFixed(1)}" stroke="${c}" stroke-width="1.2"/>`; }
    return s;
  };
  const mirror = s => `<g transform="translate(200,0) scale(-1,1)">${s}</g>`;

  /* ══ Muñeca ══ */
  function dollInner(doll, uid) {
    const ch = CHARS[doll.char];
    const line = LINE_BY_ID[doll.line];
    const boy = !!ch.boy;
    const B = boy ? BOY : GIRL;
    const f = new Set(ch.feats);
    const spec = ch.outfit ? COSTUMES[ch.outfit] : (boy ? boyTheme(line.theme) : THEMES[line.theme] || THEMES.school);
    const ex = new Set(spec.extras);
    const [c1, c2, c3] = paletteFor(doll, ch);
    const skin = ch.skin, skinD = shade(skin, -0.18), skinL = shade(skin, 0.25);
    const hairC = ch.hair === 'none' ? skin : ch.hair, hairD = shade(hairC, lum(hairC) < 0.2 ? 0.25 : -0.25);
    const streak = ch.streak === 'none' ? hairC : ch.streak;
    const pose = ch.outfit ? 0 : hash(doll.id) % 2;
    const r = seededArt(hash(doll.id));
    const P = n => `${uid}${n}`;

    // Estampado: el de la colección o el del personaje
    const patKind = spec.pat === 'pinstripeBold' ? 'stripes' : spec.pat || (line.theme === 'couture' ? 'skulls' : ch.pat || 'skulls');
    let patC = [c1, c2, c3];
    if (spec.pat === 'pinstripeBold') patC = ['#ffffff', '#141414', '#141414'];
    if (spec.pat === 'pinstripe') patC = [c1, '#ffffff', c3];
    if (spec.pat === 'patch') patC = [c1, c2, mix(c3, '#ffffff', 0.3)];
    let defs = pattern(P('pat'), patKind, ...patC);
    defs += `<radialGradient id="${P('face')}" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="${skinL}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="${skinD}"/></radialGradient>`;
    defs += `<linearGradient id="${P('hair')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hairC, 0.12)}"/><stop offset="1" stop-color="${shade(hairC, -0.15)}"/></linearGradient>`;
    defs += `<linearGradient id="${P('irid')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
    if (f.has('flames') || ch.style === 'flames') defs += `<linearGradient id="${P('fire')}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${hairC}"/><stop offset="1" stop-color="${streak}"/></linearGradient>`;
    defs += `<filter id="${P('glow')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    if (ex.has('gray')) defs += `<filter id="${P('gray')}"><feColorMatrix type="saturate" values="0"/></filter>`;

    const fillTop = spec.patOn === 'top' || spec.patOn === 'all' ? `url(#${P('pat')})` : ex.has('irid') ? `url(#${P('irid')})` : c1;
    const fillBot = spec.patOn === 'bottom' || spec.patOn === 'all' ? `url(#${P('pat')})` : ex.has('irid') ? `url(#${P('irid')})` : (spec.top === 'bodysuit' || spec.mono ? c1 : c2);
    const hairFill = ch.style === 'flames' ? `url(#${P('fire')})` : `url(#${P('hair')})`;
    let back = '', body = '', clothes = '', arms = '', head = '', front = '', over = '';

    /* Detrás del cuerpo */
    if (ex.has('cape')) back += `<path d="M76,148 Q46,260 40,336 Q100,352 160,336 Q154,260 124,148Z" fill="${ch.outfit === 'cape' ? '#141414' : c3}"/>${ch.outfit === 'cape' ? '<path d="M80,154 Q56,260 52,328 Q100,342 148,328 Q144,260 120,154Z" fill="#a81a2a"/>' : ''}`;
    if (ex.has('bigcollar')) back += `<path d="M58,152 Q36,108 62,96 L100,140 L138,96 Q164,108 142,152Z" fill="${c3}" stroke="${shade(c3, -0.3)}" stroke-width="1.5"/>`;
    if (f.has('wings')) { const wc = ch.char === 'avea' ? c2 : skinD; const w = `<path d="M80,160 Q40,110 22,128 Q34,140 26,156 Q42,156 40,176 Q56,168 62,188 Q70,172 82,180Z" fill="${wc}" stroke="${shade(wc, -0.3)}" stroke-width="1.5"/>`; back += w + mirror(w); }
    if (f.has('mothWings')) { const w = `<path d="M84,170 Q30,100 16,150 Q10,200 54,198 Q20,240 52,262 Q76,250 86,200Z" fill="${c1}" opacity=".85" stroke="${shade(c1, -0.3)}" stroke-width="1.5"/><circle cx="40" cy="160" r="9" fill="${c3}" opacity=".8"/><circle cx="56" cy="236" r="6" fill="${c2}" opacity=".8"/>`; back += w + mirror(w); }
    if (f.has('tail')) { const dragon = doll.char === 'jinafire'; back += `<path d="M116,222 Q156,232 160,196 Q162,170 148,160" fill="none" stroke="${dragon ? skin : hairC}" stroke-width="${dragon ? 10 : 7}" stroke-linecap="round"/>${dragon ? '<path d="M150,160 L160,148 L158,166Z" fill="#c8282a"/>' : ''}`; }
    if (f.has('tentacles')) back += [-1, 1].map(s => `<path d="M${100 + s * 14},220 Q${100 + s * 60},260 ${100 + s * 46},320 Q${100 + s * 40},350 ${100 + s * 62},360" fill="none" stroke="${shade(skin, -0.1)}" stroke-width="12" stroke-linecap="round"/>`).join('');

    /* Pelo de atrás */
    const H = HAIR[ch.style] || HAIR.long;
    if (H[0]) back += `<path d="${H[0]}" fill="${ch.style === 'clown' ? hairC : hairFill}"/>`;
    if (H[2] && ch.style !== 'flames') back += `<path d="${H[2]}" fill="${streak}" opacity=".95"/>`;
    if (ch.style === 'braids') back += [72, 128].map(x => `<g fill="${hairC}">${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${x}" cy="${120 + i * 16}" rx="8" ry="10"/>`).join('')}</g><path d="M${x - 6},212 L${x + 6},212" stroke="${hairD}" stroke-width="3"/>`).join('');
    if (ch.style === 'snakesLong') back += [-1, 1].flatMap(s => [0, 1, 2].map(i => `<path d="M${100 + s * (38 + i * 6)},60 Q${100 + s * (60 + i * 6)},110 ${100 + s * (44 + i * 8)},160 Q${100 + s * (34 + i * 6)},190 ${100 + s * (50 + i * 6)},210" fill="none" stroke="${i % 2 ? streak : hairC}" stroke-width="8" stroke-linecap="round"/><circle cx="${100 + s * (50 + i * 6)}" cy="212" r="5" fill="${i % 2 ? streak : hairC}"/>`)).join('');

    /* Cuerpo */
    const ghost = f.has('ghost');
    const legs = !['gown', 'mermaid'].includes(spec.bottom) && spec.top !== 'sack';
    if (spec.top !== 'sack') {
      body += `<g fill="${skin}" ${ghost ? 'opacity=".88"' : ''}>`;
      if (legs) body += `<path d="${B.legL}"/><path d="${B.legR}"/>`;
      body += `<path d="M93,112 L107,112 L108,148 L92,148Z" fill="${skinD}"/><path d="${B.torso}"/><path d="${B.hips}"/></g>`;
      if (legs && f.has('skeleton')) body += `<g stroke="${shade(skin, -0.25)}" stroke-width="1.2" fill="none"><path d="M90,240 L90,296 M89,306 L89,362 M110,240 L110,296 M111,306 L111,362"/><circle cx="90" cy="300" r="3.5"/><circle cx="110" cy="300" r="3.5"/></g>`;
      if (legs && f.has('bandages')) body += `<g stroke="#f4ecd8" stroke-width="3" opacity=".9"><path d="M84,320 L96,312 M84,334 L96,326 M84,348 L96,340 M104,316 L116,324 M104,330 L116,338"/></g>`;
      if (legs && f.has('stitches') && doll.char !== 'neighthan') body += stitch(84, 306, 97, 304, 3) + stitch(103, 304, 116, 306, 3);
      if (legs && f.has('rivets')) body += `<g fill="${shade(skin, -0.35)}"><circle cx="90" cy="300" r="2.4"/><circle cx="110" cy="300" r="2.4"/></g>`;
      if (legs && f.has('scales')) body += `<g fill="none" stroke="${skinD}" stroke-width="1"><path d="M86,330 a3,3 0 0 1 6,0 M89,336 a3,3 0 0 1 6,0 M106,332 a3,3 0 0 1 6,0"/></g>`;
    }

    /* Ropa */
    const topSpec = spec.top;
    if (topSpec === 'sack') {
      clothes += `<g fill="${c1}" stroke="${shade(c1, -0.35)}" stroke-width="2">${TOPS.sack()}</g>${stitch(66, 140, 134, 140, 8, '#3a3a3a')}${stitch(100, 150, 100, 330, 10, '#3a3a3a')}`;
    } else {
      if (spec.bottom !== 'none') {
        const bot = BOTTOMS[spec.bottom](B);
        clothes += `<g fill="${fillBot}" ${ex.has('sheer') ? 'opacity=".72"' : ''} ${ex.has('glow') ? `filter="url(#${P('glow')})"` : ''}>${bot}</g>`;
        if (ex.has('split')) clothes += `<g fill="${c1}" opacity=".9" clip-path="url(#${P('half')})">${bot}</g>`;
        if (spec.bottom === 'tutu') clothes += `<path d="M80,198 L120,198" stroke="${c3}" stroke-width="4"/>`;
        if (spec.bottom === 'gown' || spec.bottom === 'mermaid') clothes += `<path d="M100,206 Q96,300 88,384" stroke="${shade(c2, 0.2)}" stroke-width="2" fill="none" opacity=".5"/>`;
      }
      if (ex.has('split')) defs += `<clipPath id="${P('half')}"><rect x="0" y="0" width="100" height="400"/></clipPath>`;
      if (topSpec !== 'none') {
        const legC = topSpec === 'bodysuit' && ch.outfit !== 'bodysuit' ? c1 : fillTop;
        clothes += `<g fill="${topSpec === 'bodysuit' ? legC : fillTop}">${TOPS[topSpec](B)}</g>`;
        if (topSpec === 'corset') clothes += `<path d="M100,162 L100,202" stroke="${c3}" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M84,150 L86,160 M116,150 L114,160" stroke="${c1}" stroke-width="2.5"/>`;
        if (topSpec === 'swim') clothes += `<path d="M86,150 L88,160 M114,150 L112,160" stroke="${c1}" stroke-width="2.5"/>`;
        if (topSpec === 'jacket') clothes += `<path d="M100,150 L100,206" stroke="${shade(c1, -0.35)}" stroke-width="1.4"/><path d="M88,146 L100,166 L112,146" fill="${c3}" stroke="${shade(c1, -0.35)}" stroke-width="1"/>`;
        if (topSpec === 'coat') clothes += `<path d="M100,150 L100,300" stroke="${shade(c1, -0.35)}" stroke-width="1.6"/><g fill="${c3}"><circle cx="94" cy="176" r="2.4"/><circle cx="94" cy="206" r="2.4"/><circle cx="94" cy="236" r="2.4"/></g><path d="M66,214 L134,214" stroke="${shade(c1, -0.25)}" stroke-width="6"/>`;
        if (topSpec === 'nightie') clothes += `<path d="M66,262 q4,8 8,0 q4,8 8,0 q4,8 8,0 q4,8 8,0 q4,8 8,0 q4,8 8,0 q4,8 8,0 q4,8 8,0 q4,8 8,0" fill="none" stroke="${c3}" stroke-width="2.5"/>`;
        if (topSpec === 'bodysuit' && (ch.outfit === 'coverall' || ex.has('zip'))) clothes += `<path d="M100,148 L100,232" stroke="${shade(c1, -0.4)}" stroke-width="1.5"/>`;
      }
      if (ex.has('jacketOpen')) clothes += `<path d="M72,150 L90,146 L88,200 L78,204 Q76,180 72,150Z M128,150 L110,146 L112,200 L122,204 Q124,180 128,150Z" fill="${c3}" stroke="${shade(c3, -0.3)}" stroke-width="1"/>`;
      if (ex.has('overalls')) clothes += `<path d="M84,170 L116,170 L118,204 L82,204Z" fill="${c1}"/><path d="M84,170 L80,148 M116,170 L120,148" stroke="${c1}" stroke-width="4"/>`;
      if (ex.has('rainbow')) clothes += `<g stroke-width="3"><path d="M74,152 L126,152" stroke="#e83a3a"/><path d="M73,158 L127,158" stroke="#f4a03a"/><path d="M74,164 L126,164" stroke="#3a8ae8"/></g>`;
      if (ex.has('belt')) clothes += `<rect x="80" y="196" width="40" height="7" fill="${c3}"/><circle cx="100" cy="199.5" r="4" fill="${shade(c3, -0.3)}"/>`;
      if (ex.has('whitecollar')) clothes += `<path d="M84,146 Q92,160 100,150 Q108,160 116,146 Q100,142 84,146Z" fill="#ffffff" stroke="#c8c8c8" stroke-width="1"/>`;
      if (ex.has('ruff')) clothes += `<path d="M70,148 q5,-8 10,0 q5,-8 10,0 q5,-8 10,0 q5,-8 10,0 q5,-8 10,0 q5,-8 10,0 L124,156 L76,156Z" fill="#f4f0e8" stroke="#c8c0b0" stroke-width="1"/>`;
      if (ex.has('pompoms')) clothes += `<g fill="${c2}"><circle cx="100" cy="170" r="5"/><circle cx="100" cy="190" r="5"/><circle cx="100" cy="300" r="5"/></g>`;
      if (ex.has('batbow')) clothes += `<path d="M100,148 L86,140 Q90,146 86,152Z M100,148 L114,140 Q110,146 114,152Z" fill="#141414"/><circle cx="100" cy="148" r="2.5" fill="#141414"/>`;
      if (ex.has('medal')) clothes += `<circle cx="100" cy="170" r="5" fill="#e8c050" stroke="#a87a1a"/><path d="M96,152 L100,165 L104,152" stroke="#a81a2a" stroke-width="2" fill="none"/>`;
      if (ex.has('emblem')) clothes += `<path d="${starPath(100, 172, 9)}" fill="${c3}"/>`;
      if (ex.has('chains') || ex.has('chainsBig')) clothes += `<path d="M78,206 Q100,222 122,204" fill="none" stroke="#c8c8d8" stroke-width="3" stroke-dasharray="4 2"/>`;
      if (ex.has('stole')) clothes += `<path d="M70,152 Q100,170 130,152 Q134,166 124,170 Q100,184 76,170 Q66,166 70,152Z" fill="${mix(c3, '#ffffff', 0.6)}"/>`;
      if (ex.has('drape')) clothes += `<path d="M78,160 Q60,230 50,300 L62,300 Q72,230 84,170Z M122,160 Q140,230 150,300 L138,300 Q128,230 116,170Z" fill="${shade(c1, 0.1)}" opacity=".85"/>`;
      if (ex.has('furtrim')) clothes += `<path d="M70,150 Q100,164 130,150" fill="none" stroke="#f8f4f0" stroke-width="8" stroke-linecap="round"/>${topSpec === 'coat' ? '<path d="M64,300 L136,300" stroke="#f8f4f0" stroke-width="7" stroke-linecap="round"/>' : ''}`;
      if (ex.has('scarf')) clothes += `<path d="M86,140 Q100,152 114,140 L116,150 Q100,160 84,150Z" fill="${c2}"/><path d="M108,150 L114,182 L106,182 L102,154Z" fill="${c2}"/>`;
      if (ex.has('sparkle')) clothes += `<g fill="#ffffff" opacity=".8">${[0, 1, 2, 3, 4, 5].map(i => `<path d="${starPath(76 + r() * 48, 210 + r() * 150, 3)}"/>`).join('')}</g>`;
      if (ex.has('shell')) clothes += `<path d="M100,162 L93,170 Q100,176 107,170Z" fill="#f8d8e8" stroke="${c3}" stroke-width="1"/>`;
      if (ex.has('web')) clothes += `<path d="M100,150 L100,230 M80,170 L120,210 M120,170 L80,210" stroke="${c2}" stroke-width="1.2" opacity=".7"/>`;
    }

    /* Brazos */
    if (spec.top !== 'sack') {
      const armR = B.armR[pose], handR = B.handR[pose];
      const longSleeve = ['jacket', 'coat', 'bodysuit'].includes(topSpec);
      const armSkin = (path) => `<path d="${path}" fill="none" stroke="${skin}" stroke-width="${boy ? 10 : 8}" stroke-linecap="round" ${ghost ? 'opacity=".88"' : ''}/>`;
      arms += armSkin(B.armL) + armSkin(armR);
      arms += `<g fill="${skin}" ${ghost ? 'opacity=".88"' : ''}><ellipse cx="${B.handL[0]}" cy="${B.handL[1]}" rx="5" ry="7"/><ellipse cx="${handR[0]}" cy="${handR[1]}" rx="5" ry="6"/></g>`;
      const sleeveC = topSpec === 'bodysuit' ? c1 : fillTop === `url(#${P('pat')})` ? c1 : fillTop;
      if (longSleeve) arms += [B.armL, armR].map(p => `<path d="${p}" fill="none" stroke="${sleeveC}" stroke-width="${boy ? 13 : 11}" stroke-linecap="round" stroke-dasharray="${topSpec === 'bodysuit' ? 'none' : '86 200'}"/>`).join('');
      else if (topSpec === 'tee' || topSpec === 'crop') arms += [B.armL, armR].map(p => `<path d="${p}" fill="none" stroke="${sleeveC}" stroke-width="${boy ? 13 : 11}" stroke-linecap="butt" stroke-dasharray="20 300"/>`).join('');
      if (ex.has('gloves')) arms += [B.armL, armR].map(p => `<path d="${p}" fill="none" stroke="${ch.outfit ? '#141414' : c3}" stroke-width="9" stroke-dasharray="0 48 60 200" stroke-linecap="round"/>`).join('');
      if (ex.has('bangles')) arms += `<g fill="none" stroke="#e8c050" stroke-width="2"><ellipse cx="${B.handL[0]}" cy="${B.handL[1] - 10}" rx="5" ry="2"/><ellipse cx="${handR[0]}" cy="${handR[1] - 9}" rx="5" ry="2"/></g>`;
      if (f.has('bandages')) arms += `<g stroke="#f4ecd8" stroke-width="2.6"><path d="M60,212 L68,206 M60,224 L68,218 M59,236 L67,230"/></g>`;
      if (f.has('stitches')) arms += stitch(58, 232, 68, 236, 2);
      if (f.has('vines')) arms += `<path d="M76,156 Q60,170 70,184 Q58,196 66,210 Q56,222 62,236" fill="none" stroke="#3a8a2a" stroke-width="2.2"/><path d="M68,184 q-8,-2 -8,-8 q6,0 8,8Z M64,210 q-8,0 -9,-6 q7,-1 9,6Z" fill="#5ab83a"/>`;
      if (f.has('fins')) arms += `<path d="M62,206 Q50,214 56,232 L62,226Z" fill="${shade(skin, -0.12)}" opacity=".9"/>`;
      if (f.has('rivets')) arms += `<g fill="${shade(skin, -0.35)}"><circle cx="77" cy="152" r="2.4"/><circle cx="64" cy="198" r="2.4"/><circle cx="123" cy="152" r="2.4"/></g>`;
      if (f.has('chains')) arms += `<path d="M58,222 Q66,232 70,222" fill="none" stroke="#c8c8d8" stroke-width="2.4" stroke-dasharray="3 1.5"/>`;
      if (f.has('stone')) arms += `<g fill="${shade(skin, -0.2)}" opacity=".7"><circle cx="66" cy="190" r="1.4"/><circle cx="63" cy="214" r="1.2"/><circle cx="90" cy="320" r="1.3"/><circle cx="110" cy="290" r="1.2"/></g>`;
    }

    /* Zapatos */
    if (spec.shoes !== 'none' && spec.top !== 'sack' && legs) {
      const sc = ch.outfit === 'raincoat' ? '#f4d030' : ch.outfit ? shade(c1, -0.1) : (lum(c2) > 0.85 ? c1 : c2);
      const s = (SHOES[spec.shoes] || SHOES.heels)(sc);
      front += s + `<g transform="translate(20,0)">${s}</g>`;
    }

    /* Cabeza */
    if (ch.style === 'snakes') head += snakesHair(hairC, streak, false);
    head += `<ellipse cx="62" cy="84" rx="5" ry="8" fill="${skinD}"/><ellipse cx="138" cy="84" rx="5" ry="8" fill="${skinD}"/>`;
    if (f.has('fins')) head += `<path d="M60,82 Q44,74 46,96 Q54,92 60,96Z" fill="${shade(skin, -0.12)}"/>` + mirror(`<path d="M60,82 Q44,74 46,96 Q54,92 60,96Z" fill="${shade(skin, -0.12)}"/>`);
    if (f.has('gremlinEars')) head += `<path d="M62,78 Q24,60 20,84 Q40,92 62,92Z" fill="${skin}" stroke="${skinD}" stroke-width="1.5"/>` + mirror(`<path d="M62,78 Q24,60 20,84 Q40,92 62,92Z" fill="${skin}" stroke="${skinD}" stroke-width="1.5"/>`);
    head += `<path d="M62,74 C60,42 78,28 100,28 C122,28 140,42 138,74 C138,100 122,122 100,124 C78,122 62,100 62,74Z" fill="url(#${P('face')})" ${ghost ? 'opacity=".9"' : ''}/>`;
    if (ghost) head += `<path d="M62,74 C60,42 78,28 100,28 C122,28 140,42 138,74 C138,100 122,122 100,124 C78,122 62,100 62,74Z" fill="none" stroke="${shade(skin, 0.5)}" stroke-width="3" opacity=".6" filter="url(#${P('glow')})"/>`;
    head += faceDetails(ch, f, { skin, skinD, hairD, c1, c2, c3, boy, P });

    /* Pelo de delante y rasgos sobre la cabeza */
    if (f.has('wolfEars') || f.has('catEars')) {
      const cat = f.has('catEars');
      const ear = cat ? `<path d="M66,50 L60,16 L86,36Z" fill="${hairC}"/><path d="M68,44 L64,24 L80,36Z" fill="#ffb0c0"/>` : `<path d="M64,54 L52,12 L84,36Z" fill="${hairC}"/><path d="M66,46 L58,22 L78,38Z" fill="${shade(skin, 0.15)}"/>`;
      head += ear + mirror(ear);
    }
    if (f.has('mouseEars')) head += `<circle cx="66" cy="30" r="15" fill="${skinD}"/><circle cx="66" cy="30" r="9" fill="#ffb0c8"/><circle cx="134" cy="30" r="15" fill="${skinD}"/><circle cx="134" cy="30" r="9" fill="#ffb0c8"/>`;
    if (H[1]) head += `<path d="${H[1]}" fill="${hairFill}"/>`;
    if (H[3]) head += `<path d="${H[3]}" fill="${streak}"/>`;
    if (ch.style === 'flames' && H[2]) head += `<path d="${H[2]}" fill="${streak}" opacity=".9"/>`;
    if (f.has('tigerHair')) head += `<g stroke="${streak}" stroke-width="3" stroke-linecap="round" fill="none"><path d="M76,36 Q84,40 88,34 M110,30 Q118,36 126,32 M140,120 Q146,128 148,140 M52,140 Q48,150 52,164"/></g>`;
    if (ch.style === 'snakes') head += snakesHair(hairC, streak, true);
    if (ch.style === 'clown') head += `<path d="M62,74 C60,42 78,28 100,28 C122,28 140,42 138,74" fill="none" stroke="${skinD}" stroke-width="1" opacity=".5"/>`;
    if (f.has('horns')) head += doll.char === 'krampus'
      ? `<path d="M74,34 Q50,0 66,-30 Q70,-4 86,26Z M126,34 Q150,0 134,-30 Q130,-4 114,26Z" fill="#3a2a1a" stroke="#1a1008" stroke-width="1.5"/>`
      : `<path d="M78,32 Q70,10 82,2 Q84,18 88,28Z M122,32 Q130,10 118,2 Q116,18 112,28Z" fill="#e8c030" stroke="#a87a1a" stroke-width="1"/>`;
    if (f.has('unicorn')) head += `<path d="M100,32 L96,6 L104,6Z" fill="#f8e8ff" stroke="#c87af8" stroke-width="1"/>`;
    if (f.has('antennae')) head += `<path d="M86,26 Q80,4 66,4 M114,26 Q120,4 134,4" fill="none" stroke="${shade(hairC, -0.3)}" stroke-width="2"/><circle cx="66" cy="4" r="3.5" fill="${c3}"/><circle cx="134" cy="4" r="3.5" fill="${c3}"/>`;
    if (f.has('headdress')) head += `<path d="M64,56 Q100,40 136,56 L134,64 Q100,50 66,64Z" fill="#e8c050" stroke="#a87a1a" stroke-width="1"/><path d="M100,46 L94,56 L100,62 L106,56Z" fill="#22a8a8"/><g>${[0, 1, 2, 3].map(i => `<rect x="54" y="${64 + i * 14}" width="8" height="7" fill="${i % 2 ? '#22a8a8' : '#e8c050'}"/><rect x="138" y="${64 + i * 14}" width="8" height="7" fill="${i % 2 ? '#22a8a8' : '#e8c050'}"/>`).join('')}</g>`;
    if (f.has('goggles')) head += `<g stroke="#5a3a1a" stroke-width="2"><circle cx="86" cy="36" r="8" fill="#3a7ad8"/><circle cx="114" cy="36" r="8" fill="#3a7ad8"/><path d="M94,36 L106,36"/></g><circle cx="84" cy="34" r="2" fill="#ffffff"/><circle cx="112" cy="34" r="2" fill="#ffffff"/>`;
    if (f.has('pirateHat')) head += `<path d="M48,40 Q100,-6 152,40 Q100,24 48,40Z" fill="#1a1a1a"/><path d="M92,22 a6,5 0 1 1 16,0 a6,5 0 1 1 -16,0" fill="#ffffff"/>`;
    if (f.has('dragonfly')) head += `<path d="M122,40 L138,36 M126,34 L134,44" stroke="#3ac8a8" stroke-width="3" stroke-linecap="round"/>`;
    if (ex.has('sleepmask')) head += `<rect x="70" y="40" width="60" height="14" rx="7" fill="${c2}"/><path d="M84,47 Q90,52 96,47 M104,47 Q110,52 116,47" stroke="${shade(c2, -0.4)}" stroke-width="1.4" fill="none"/>`;
    if (ex.has('headSunglasses')) head += `<path d="M70,38 L96,38 Q94,48 84,48 Q72,48 70,38Z M104,38 L130,38 Q128,48 116,48 Q106,48 104,38Z" fill="#1a1a1a"/><path d="M96,40 L104,40" stroke="#1a1a1a" stroke-width="2"/>`;
    if (ex.has('flower')) head += flower(128, 48, c3, '#ffe060');
    if (ex.has('hairbow')) head += `<path d="M126,36 L112,26 L112,46Z M126,36 L140,26 L140,46Z" fill="${c3}"/><circle cx="126" cy="36" r="4" fill="${shade(c3, -0.2)}"/>`;
    if (ex.has('beret')) head += `<ellipse cx="108" cy="26" rx="34" ry="12" fill="${c2}" transform="rotate(-12 108 26)"/><circle cx="112" cy="14" r="3" fill="${c2}"/>`;
    if (ex.has('tophat')) head += `<rect x="104" y="0" width="26" height="24" fill="#141414" transform="rotate(10 117 12)"/><ellipse cx="116" cy="26" rx="22" ry="5" fill="#141414" transform="rotate(10 116 26)"/><rect x="104" y="16" width="26" height="4" fill="${c3}" transform="rotate(10 117 18)"/>`;
    if (ex.has('headband')) head += `<path d="M62,58 Q100,40 138,58" fill="none" stroke="#e8c050" stroke-width="3"/>${[72, 86, 100, 114, 128].map((x, i) => `<circle cx="${x}" cy="${54 - Math.sin((i / 4) * Math.PI) * 8 + 4}" r="2.5" fill="#e8c050"/>`).join('')}`;
    if (ex.has('flowercrown')) head += [66, 80, 94, 108, 122, 134].map((x, i) => flower(x, 40 - Math.sin((i / 5) * Math.PI) * 10, i % 2 ? c3 : '#ff8ac8', '#ffe060', 0.8)).join('');
    if (ex.has('earmuffs')) head += `<path d="M58,70 Q58,14 100,14 Q142,14 142,70" fill="none" stroke="${c2}" stroke-width="4"/><circle cx="58" cy="82" r="11" fill="#f8f4f0"/><circle cx="142" cy="82" r="11" fill="#f8f4f0"/>`;
    if (ex.has('deerstalker')) head += `<path d="M58,50 Q60,10 100,8 Q140,10 142,50 Q100,40 58,50Z" fill="url(#${P('pat')})" stroke="${shade(c1, -0.3)}" stroke-width="1.5"/><path d="M58,50 L46,58 L64,56Z M142,50 L154,58 L136,56Z" fill="${c1}"/>`;
    if (ex.has('veil')) head += `<path d="M60,40 Q100,20 140,40 Q170,160 160,300 Q100,320 40,300 Q30,160 60,40Z" fill="#ffffff" opacity=".22"/>`;
    if (f.has('hoops')) head += `<circle cx="62" cy="100" r="7" fill="none" stroke="#e8c050" stroke-width="2"/><circle cx="138" cy="100" r="7" fill="none" stroke="#e8c050" stroke-width="2"/>`;
    if (f.has('piercings')) head += `<circle cx="60" cy="88" r="1.8" fill="#e8e8e8"/><circle cx="62" cy="94" r="1.8" fill="#e8e8e8"/><circle cx="140" cy="90" r="1.8" fill="#e8e8e8"/>`;
    if (f.has('bolts')) head += `<g><rect x="82" y="124" width="10" height="7" rx="2" fill="#b8c0c8" stroke="#6a7078"/><rect x="108" y="124" width="10" height="7" rx="2" fill="#b8c0c8" stroke="#6a7078"/></g>`;
    if (f.has('iceNecklace')) head += `<path d="M86,140 Q100,150 114,140" fill="none" stroke="#c8e8f8" stroke-width="1.5"/><path d="M100,146 L94,154 L100,166 L106,154Z" fill="#a8e8ff" stroke="#5ac8f0"/>`;
    if (ex.has('necklace')) head += `<path d="M86,142 Q100,156 114,142" fill="none" stroke="${c3}" stroke-width="2.5" stroke-dasharray="0.1 4.5" stroke-linecap="round"/>`;
    if (f.has('wisp')) head += `<path d="M150,60 q10,-10 0,-20 q-8,-6 -2,-14" fill="none" stroke="#c8a8f8" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;

    let out = back + body + clothes + arms + front + head + over;
    if (ex.has('gray')) out = `<g filter="url(#${P('gray')})">${out}</g>`;
    return { defs, out };
  }

  function boyTheme(theme) {
    if (theme === 'hero') return { top: 'bodysuit', bottom: 'none', patOn: 'none', shoes: 'boots', extras: ['cape', 'emblem'] };
    if (theme === 'beach' || theme === 'tropical') return { top: 'tee', bottom: 'shorts', patOn: 'bottom', shoes: 'sandals', extras: [] };
    if (theme === 'pajamas') return { top: 'tee', bottom: 'pants', patOn: 'all', shoes: 'slippers', extras: [] };
    if (theme === 'gala' || theme === 'party' || theme === 'redcarpet') return { top: 'jacket', bottom: 'pants', patOn: 'none', shoes: 'boots', extras: ['batbow'] };
    if (theme === 'fusion') return { top: 'jacket', bottom: 'pants', patOn: 'top', shoes: 'boots', extras: [] };
    return { top: 'jacket', bottom: 'pants', patOn: 'top', shoes: 'sneakers', extras: [] };
  }

  function snakesHair(c, c2, front) {
    const ss = front ? [[86, 30, -1], [114, 30, 1], [100, 24, 0]] : [[76, 40, -1], [124, 40, 1], [92, 36, -1], [108, 36, 1]];
    return ss.map(([x, y, d], i) => {
      const col = i % 2 ? c : shade(c, -0.15);
      const hx = x + d * 14, hy = y - 22;
      return `<path d="M${x},${y + 22} Q${x - d * 6},${y} ${hx},${hy}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round"/><ellipse cx="${hx}" cy="${hy}" rx="7" ry="5.5" fill="${col}"/><circle cx="${hx - 2}" cy="${hy - 1.5}" r="1.4" fill="${c2}"/><circle cx="${hx + 2}" cy="${hy - 1.5}" r="1.4" fill="${c2}"/>`;
    }).join('');
  }

  function flower(x, y, c, center, s = 1) {
    return `<g transform="translate(${x},${y}) scale(${s})" fill="${c}"><circle cx="0" cy="-5" r="4"/><circle cx="5" cy="-1" r="4"/><circle cx="3" cy="5" r="4"/><circle cx="-3" cy="5" r="4"/><circle cx="-5" cy="-1" r="4"/><circle r="2.6" fill="${center}"/></g>`;
  }

  function faceDetails(ch, f, k) {
    const { skin, skinD, hairD, c3, boy, P } = k;
    let s = '';
    // Cara de calavera (Jack) o máscara (Michael)
    if (f.has('skullFace')) {
      s += `<path d="M70,72 Q72,58 86,60 Q98,64 94,80 Q88,92 76,88 Q66,84 70,72Z" fill="#141414"/>` + mirror(`<path d="M70,72 Q72,58 86,60 Q98,64 94,80 Q88,92 76,88 Q66,84 70,72Z" fill="#141414"/>`);
      s += `<path d="M98,96 L100,92 L102,96Z" fill="#141414"/><path d="M76,104 Q100,122 124,104" fill="none" stroke="#141414" stroke-width="2"/>`;
      for (let i = 0; i < 9; i++) { const x = 80 + i * 5; s += `<path d="M${x},${106 + Math.sin(i / 8 * Math.PI) * 7} l0,6" stroke="#141414" stroke-width="1.4"/>`; }
      return s;
    }
    if (f.has('mask')) {
      s += `<path d="M64,74 C62,40 78,28 100,28 C122,28 138,40 136,74 C136,100 122,122 100,124 C78,122 64,100 64,74Z" fill="#f8f8f4" stroke="#c8c8c0"/>`;
      s += `<ellipse cx="84" cy="80" rx="8" ry="5" fill="#141414"/><ellipse cx="116" cy="80" rx="8" ry="5" fill="#141414"/><path d="M92,108 Q100,110 108,108" stroke="#a8a8a0" stroke-width="2" fill="none"/>`;
      return s;
    }
    if (f.has('sack')) {
      s += `<path d="M76,70 Q84,62 92,72 Q84,82 76,70Z M108,72 Q116,62 124,70 Q116,82 108,72Z" fill="#141414"/><path d="M74,100 Q100,124 126,100 Q100,110 74,100Z" fill="#141414"/>`;
      return s;
    }
    // Maquillaje especial
    if (f.has('clownface')) s += `<path d="M84,58 L82,74 M116,58 L118,74 M84,90 Q82,104 88,112 M116,90 Q118,104 112,112" stroke="#c81a1a" stroke-width="2.5" fill="none"/><path d="M88,116 Q100,126 112,116 Q100,120 88,116Z" fill="#c81a1a"/>`;
    if (f.has('sugarSkull')) {
      s += `<g fill="none" stroke="#e83a8a" stroke-width="1.6"><circle cx="84" cy="82" r="13"/><circle cx="116" cy="82" r="13"/></g>`;
      s += [[84, 66], [116, 66], [72, 92], [128, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#ff8a1a"/>`).join('');
      s += `<path d="M96,94 L100,100 L104,94Z" fill="#1a1a1a"/>${flower(100, 44, '#ff8a1a', '#e83a8a', 0.7)}`;
    }
    if (f.has('mold')) s += `<g fill="#8aa858" opacity=".55"><circle cx="72" cy="66" r="5"/><circle cx="128" cy="100" r="4"/><circle cx="118" cy="50" r="3"/></g><g fill="#5a4a6a" opacity=".5"><ellipse cx="84" cy="90" rx="10" ry="3"/><ellipse cx="116" cy="90" rx="10" ry="3"/></g>`;
    if (f.has('scars')) s += stitch(70, 66, 84, 92, 4, '#8a3a3a') + stitch(118, 98, 130, 76, 3, '#8a3a3a');
    if (f.has('stitches') && !f.has('scars')) s += stitch(116, 96, 130, 108, 3, '#3a3a3a');
    if (f.has('stars')) s += `<path d="${starPath(126, 98, 4)}" fill="#f8e05a"/><path d="${starPath(74, 100, 3)}" fill="#f8e05a"/>`;
    if (f.has('scales')) s += `<g fill="none" stroke="${skinD}" stroke-width="1" opacity=".8"><path d="M68,92 a3,3 0 0 1 6,0 M71,98 a3,3 0 0 1 6,0 M126,92 a3,3 0 0 1 6,0 M123,98 a3,3 0 0 1 6,0"/></g>`;
    if (f.has('rivets')) s += `<g fill="${shade(skin, -0.35)}"><circle cx="66" cy="70" r="1.8"/><circle cx="134" cy="70" r="1.8"/><circle cx="70" cy="104" r="1.8"/><circle cx="130" cy="104" r="1.8"/></g>`;
    if (f.has('stone')) s += `<g fill="${skinD}" opacity=".6"><circle cx="74" cy="60" r="1.3"/><circle cx="128" cy="66" r="1.1"/><circle cx="120" cy="110" r="1.2"/></g>`;

    // Ojos
    const hollow = ch.eyes === 'hollow';
    const eyes = Array.isArray(ch.eyes) ? ch.eyes : [ch.eyes, ch.eyes];
    const eye = (iris, i) => {
      const id = P('eye' + i);
      const white = boy ? 'M72,84 Q83,74 95,82 Q84,90 72,84Z' : 'M70,84 Q81,71 96,81 Q85,92 70,84Z';
      let e = '';
      if (!boy) e += `<path d="M68,82 Q80,62 99,78 Q82,70 68,82Z" fill="${c3 === '#ffffff' ? k.c1 : c3}" opacity=".5"/>`;
      e += `<clipPath id="${id}"><path d="${white}"/></clipPath><path d="${white}" fill="#ffffff"/>`;
      e += `<g clip-path="url(#${id})"><circle cx="84" cy="82.5" r="${boy ? 6 : 7}" fill="${iris}"/><circle cx="84" cy="82.5" r="${boy ? 6 : 7}" fill="none" stroke="${shade(iris, -0.45)}" stroke-width="1.2"/><circle cx="84" cy="83" r="3.2" fill="#120a14"/><circle cx="86.5" cy="79.5" r="2.2" fill="#ffffff"/><circle cx="81.5" cy="85.5" r="1.1" fill="#ffffff"/></g>`;
      e += boy ? `<path d="M71,84 Q82,73 96,81" fill="none" stroke="#1a0e1a" stroke-width="2.4" stroke-linecap="round"/><path d="M71,68 Q83,62 96,67" fill="none" stroke="${hairD}" stroke-width="3" stroke-linecap="round"/>`
        : `<path d="M68,84 Q80,68 97,80" fill="none" stroke="#1a0e1a" stroke-width="3.2" stroke-linecap="round"/><path d="M70,81 L63,77 M72,78 L66,72 M75,76 L71,69" stroke="#1a0e1a" stroke-width="1.8" stroke-linecap="round"/><path d="M74,88 Q85,91 95,83" fill="none" stroke="#1a0e1a" stroke-width=".8" opacity=".5"/><path d="M72,66 Q83,58 95,63" fill="none" stroke="${hairD}" stroke-width="2.2" stroke-linecap="round"/>`;
      return e;
    };
    if (hollow) s += `<ellipse cx="84" cy="80" rx="9" ry="11" fill="#141414"/><ellipse cx="116" cy="80" rx="9" ry="11" fill="#141414"/>`;
    else if (f.has('sunglasses')) s += `<path d="M64,76 L98,76 Q96,93 82,93 Q66,93 64,76Z M102,76 L136,76 Q134,93 118,93 Q104,93 102,76Z" fill="#1a1a1a"/><path d="M98,78 L102,78" stroke="#1a1a1a" stroke-width="3"/><path d="M70,80 L78,80 M108,80 L116,80" stroke="#ffffff" stroke-width="1.6" opacity=".5"/><path d="M71,68 Q83,62 96,67 M104,67 Q117,62 129,68" fill="none" stroke="${hairD}" stroke-width="3" stroke-linecap="round"/>`;
    else s += eye(eyes[0], 0) + mirror(eye(eyes[1], 1));

    if (f.has('glasses')) s += `<path d="M66,76 Q80,66 98,76 Q97,92 82,92 Q68,92 66,76Z M102,76 Q120,66 134,76 Q132,92 118,92 Q103,92 102,76Z" fill="#ffffff" fill-opacity=".12" stroke="#e83a3a" stroke-width="3"/><path d="M98,78 L102,78" stroke="#e83a3a" stroke-width="2.5"/><path d="M66,76 L60,70 M134,76 L140,70" stroke="#e83a3a" stroke-width="3"/>`;

    // Nariz, boca y colorete
    if (!f.has('clownface')) s += `<path d="M101,92 Q103.5,98 99,100" fill="none" stroke="${skinD}" stroke-width="1.6" stroke-linecap="round"/>`;
    else s += `<circle cx="100" cy="98" r="5" fill="#c81a1a"/>`;
    if (boy) s += `<path d="M91,108 Q100,113 109,107" fill="none" stroke="${shade(ch.lips, -0.1)}" stroke-width="2.4" stroke-linecap="round"/>`;
    else s += `<path d="M89,108 Q94,104 100,106 Q106,104 111,108 Q100,111 89,108Z" fill="${shade(ch.lips, -0.1)}"/><path d="M90,108.5 Q100,117 110,108.5 Q100,111 90,108.5Z" fill="${ch.lips}"/><ellipse cx="103" cy="112" rx="3" ry="1.1" fill="#ffffff" opacity=".45"/>`;
    if (f.has('fangs')) s += `<path d="M94.5,108.6 L96,114 L97.6,108.8Z M102.4,108.8 L104,114 L105.5,108.6Z" fill="#ffffff"/>`;
    if (f.has('tusks')) s += `<path d="M92,114 Q90,108 93,104 M108,114 Q110,108 107,104" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>`;
    if (f.has('heart')) s += `<path d="${heartPath(124, 98, 1.1)}" fill="#ff3d9a"/>`;
    if (!hollow) s += `<ellipse cx="74" cy="98" rx="7" ry="4" fill="#ff6a9a" opacity=".22"/><ellipse cx="126" cy="98" rx="7" ry="4" fill="#ff6a9a" opacity=".22"/>`;
    return s;
  }

  function seededArt(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ── API muñecas ── */
  let uidN = 0;
  function dollSVG(id, opts = {}) {
    const d = DOLLS[id];
    const ch = CHARS[d.char];
    const uid = `d${(uidN++).toString(36)}`;
    const line = LINE_BY_ID[d.line];
    if (ch.feats.includes('twins')) {
      const a = dollInner(d, uid + 'a'), b = dollInner(d, uid + 'b');
      return wrap(a.defs + b.defs, `<g transform="translate(-22,112) scale(.7)">${a.out}</g><g transform="translate(82,116) scale(.7)">${b.out}</g>`, opts);
    }
    const x = dollInner(d, uid);
    let content = x.out;
    if (line.theme === 'hero' && !ch.boy) content += heroMask(d, ch);
    return wrap(x.defs, content, opts);
  }
  function heroMask(d, ch) {
    const c = paletteFor(d, ch)[2];
    return `<path d="M64,72 Q100,62 136,72 L134,90 Q118,96 100,88 Q82,96 66,90Z M72,82 Q84,74 96,82 Q84,90 72,82Z M104,82 Q116,74 128,82 Q116,90 104,82Z" fill="${c}" fill-rule="evenodd" opacity=".92"/>`;
  }
  function wrap(defs, content, { w = 200, h = 400 } = {}) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -40 200 440" width="${w}" height="${h}"><defs>${defs}</defs>${content}</svg>`;
  }

  const urlCache = new Map();
  function toURL(key, svg) {
    if (urlCache.has(key)) return urlCache.get(key);
    const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    urlCache.set(key, u);
    return u;
  }
  // Las muñecas con ficha de estilo (looks.js) se dibujan con Figure; el resto, con el dibujo genérico
  const dollURL = id => urlCache.get('d:' + id) || toURL('d:' + id, typeof LOOKS !== 'undefined' && LOOKS[id] ? Figure.svg(id) : dollSVG(id));

  /* ══ Mascotas ══ */
  function petSVG(id) {
    const p = PET_BY_ID[id];
    const [a, b, c] = p.colors;
    const eye = (x, y, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff"/><circle cx="${x + 0.6}" cy="${y + 0.6}" r="${r * 0.6}" fill="#1a1a1a"/><circle cx="${x + 1.6}" cy="${y - 1}" r="${r * 0.25}" fill="#ffffff"/>`;
    let s = '';
    switch (p.species) {
      case 'patchdog': case 'dogdragon':
        s += `<ellipse cx="62" cy="84" rx="30" ry="20" fill="${a}"/><path d="M40,84 L36,104 L46,104 Z M78,84 L80,104 L90,104Z" fill="${b}"/>`;
        s += `<circle cx="60" cy="52" r="24" fill="${a}"/><path d="M38,40 Q30,62 42,66 Q44,50 48,42Z" fill="${b}"/><path d="M82,40 Q90,62 78,66 Q76,50 72,42Z" fill="${c}"/>`;
        s += `<path d="M48,30 Q60,24 72,34 Q70,48 56,46 Q46,42 48,30Z" fill="${c}" opacity=".7"/>` + stitch(48, 30, 70, 46, 3, '#3a3a3a');
        s += eye(52, 52) + eye(68, 52) + `<ellipse cx="60" cy="62" rx="5" ry="3.5" fill="#1a1a1a"/><path d="M92,80 Q104,66 100,58" stroke="${a}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
        if (p.species === 'dogdragon') s += `<path d="M44,74 Q20,56 18,80 Q30,76 44,86Z" fill="${c}"/><path d="M50,30 L54,18 L58,30 M62,30 L66,18 L70,30" fill="${c}"/>`;
        break;
      case 'bat':
        s += `<path d="M58,60 Q30,30 6,46 Q16,52 12,62 Q24,60 26,72 Q38,64 46,72Z" fill="${b}"/>` + `<g transform="translate(120,0) scale(-1,1)"><path d="M58,60 Q30,30 6,46 Q16,52 12,62 Q24,60 26,72 Q38,64 46,72Z" fill="${b}"/></g>`;
        s += `<circle cx="60" cy="62" r="20" fill="${a}"/><path d="M44,48 L42,30 L54,44Z M76,48 L78,30 L66,44Z" fill="${a}"/>` + eye(53, 60, 5) + eye(67, 60, 5) + `<path d="M56,72 L58,76 L60,72 L62,76 L64,72" fill="#ffffff" stroke="#1a1a1a" stroke-width=".6"/><path d="M52,40 L68,40 L66,32 L54,32Z" fill="#1a1a1a"/><rect x="50" y="40" width="20" height="3" fill="${c}"/>`;
        break;
      case 'kitten': case 'sabercat':
        s += `<ellipse cx="60" cy="88" rx="26" ry="18" fill="${a}"/><path d="M84,88 Q104,76 98,56" stroke="${a}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
        s += `<circle cx="60" cy="56" r="24" fill="${a}"/><path d="M40,44 L36,18 L56,36Z M80,44 L84,18 L64,36Z" fill="${a}"/><path d="M42,40 L40,26 L52,36Z M78,40 L80,26 L68,36Z" fill="#ffb0c0"/>`;
        s += eye(51, 56, 6) + eye(69, 56, 6) + `<path d="M57,66 L63,66 L60,70Z" fill="#ff8aa0"/><path d="M44,66 L30,64 M44,70 L30,72 M76,66 L90,64 M76,70 L90,72" stroke="#5a5a5a" stroke-width="1"/>`;
        if (p.species === 'sabercat') s += `<path d="M54,72 L55,84 L58,72 M62,72 L65,84 L66,72" fill="#ffffff" stroke="#c8c8c8" stroke-width=".5"/><g stroke="${b}" stroke-width="3" stroke-linecap="round"><path d="M50,36 L52,44 M60,32 L60,42 M70,36 L68,44 M44,84 L50,92 M70,82 L64,92"/></g>`;
        else s += stitch(40, 80, 80, 80, 6, b);
        break;
      case 'cobra':
        s += `<path d="M30,100 Q60,110 86,96 Q100,86 84,76 Q64,70 60,80" fill="none" stroke="${a}" stroke-width="14" stroke-linecap="round"/>`;
        s += `<path d="M60,82 Q56,60 60,50" stroke="${a}" stroke-width="12" fill="none"/><path d="M60,18 Q86,26 82,50 Q72,62 60,62 Q48,62 38,50 Q34,26 60,18Z" fill="${a}"/><path d="M60,26 Q74,32 72,48 Q60,56 48,48 Q46,32 60,26Z" fill="${b}"/>` + eye(54, 38, 4) + eye(66, 38, 4) + `<path d="M60,54 L60,62 L57,66 M60,62 L63,66" stroke="#e83a3a" stroke-width="1.5" fill="none"/>`;
        s += `<path d="M44,22 L60,10 L76,22" fill="none" stroke="${c}" stroke-width="3"/>`;
        break;
      case 'piranha':
        s += `<path d="M20,60 Q40,24 80,34 Q100,44 100,60 Q100,76 80,86 Q40,96 20,60Z" fill="${a}"/><path d="M100,60 L118,44 L114,60 L118,76Z" fill="${b}"/><path d="M56,34 L66,18 L74,36Z" fill="${b}"/>`;
        s += eye(44, 52, 7) + `<path d="M22,62 Q36,70 50,64" fill="#ffffff" stroke="#1a1a1a" stroke-width="1"/><path d="M26,63 L28,68 L31,64 L34,69 L37,65 L40,69 L43,65" fill="none" stroke="#1a1a1a" stroke-width="1"/><path d="M60,70 Q70,62 80,70" fill="none" stroke="${b}" stroke-width="2" opacity=".6"/>`;
        break;
      case 'owl':
        s += `<ellipse cx="60" cy="68" rx="30" ry="36" fill="${a}"/><path d="M34,40 L30,18 L48,34Z M86,40 L90,18 L72,34Z" fill="${a}"/><ellipse cx="60" cy="80" rx="18" ry="20" fill="${shade(a, 0.3)}"/>`;
        s += `<circle cx="47" cy="52" r="12" fill="${b}"/><circle cx="73" cy="52" r="12" fill="${b}"/>` + eye(47, 52, 8) + eye(73, 52, 8) + `<path d="M56,62 L64,62 L60,70Z" fill="#e8a030"/><path d="M36,50 Q47,40 58,50 M62,50 Q73,40 84,50" fill="none" stroke="${c}" stroke-width="3"/>`;
        break;
      case 'rat':
        s += `<ellipse cx="66" cy="80" rx="30" ry="20" fill="${a}"/><path d="M94,84 Q116,84 112,104" stroke="${b}" stroke-width="3" fill="none"/><circle cx="40" cy="62" r="20" fill="${a}"/><circle cx="30" cy="42" r="10" fill="${a}"/><circle cx="30" cy="42" r="6" fill="${b}"/><circle cx="52" cy="44" r="10" fill="${a}"/><circle cx="52" cy="44" r="6" fill="${b}"/>` + eye(36, 60, 4) + eye(48, 60, 4) + `<circle cx="24" cy="68" r="4" fill="${b}"/><path d="M36,70 L18,66 M36,72 L18,76" stroke="#5a5a5a" stroke-width="1"/><path d="M60,64 L90,64" stroke="${c}" stroke-width="4"/>`;
        break;
      case 'mammoth':
        s += `<ellipse cx="62" cy="64" rx="38" ry="32" fill="${a}"/><rect x="34" y="84" width="14" height="22" rx="5" fill="${a}"/><rect x="74" y="84" width="14" height="22" rx="5" fill="${a}"/>`;
        s += `<path d="M34,64 Q18,74 22,96 Q26,104 32,98 Q30,82 42,74Z" fill="${shade(a, -0.08)}"/><path d="M38,78 Q24,96 40,104" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>` + eye(46, 54, 5) + `<path d="M30,40 Q60,20 92,40" stroke="${b}" stroke-width="5" fill="none"/><path d="M36,36 Q60,26 86,36" stroke="${shade(a, -0.1)}" stroke-width="4" fill="none" stroke-dasharray="3 3"/>`;
        break;
      case 'ferret':
        s += `<path d="M20,80 Q40,60 70,70 Q100,80 104,96 Q80,100 60,94 Q30,96 20,80Z" fill="${a}" opacity=".85"/><circle cx="34" cy="62" r="18" fill="${a}" opacity=".9"/><path d="M22,48 L22,38 L32,46Z M44,46 L48,36 L50,48Z" fill="${a}"/><path d="M22,58 Q34,52 46,58 L44,66 Q34,62 24,66Z" fill="${b}" opacity=".6"/>` + eye(28, 60, 4) + eye(40, 60, 4) + `<circle cx="34" cy="70" r="2.5" fill="${c}"/><path d="M60,96 Q66,106 72,96 Q78,106 84,96" fill="none" stroke="${b}" stroke-width="2" opacity=".6"/>`;
        break;
      case 'spider':
        s += `<g stroke="${a}" stroke-width="4" fill="none" stroke-linecap="round">${[-1, 1].map(d => [0, 1, 2, 3].map(i => `<path d="M${60 + d * 12},${66 + i * 6} Q${60 + d * 36},${50 + i * 10} ${60 + d * 46},${78 + i * 10}"/>`).join('')).join('')}</g>`;
        s += `<ellipse cx="60" cy="74" rx="20" ry="18" fill="${a}"/><circle cx="60" cy="48" r="16" fill="${a}"/><path d="M44,40 Q48,20 66,24 Q82,28 74,40 Q64,32 50,40Z" fill="${a}"/>` + eye(54, 48, 4.5) + eye(66, 48, 4.5) + `<path d="M54,58 Q60,62 66,58" stroke="${b}" stroke-width="2" fill="none"/><path d="M48,64 L72,64" stroke="${b}" stroke-width="3"/>`;
        break;
      case 'hedgehog':
        s += `<path d="M24,86 Q16,56 40,40 Q60,26 84,40 Q104,56 98,86Z" fill="${c}"/><g stroke="${c}" stroke-width="4" stroke-linecap="round">${[0, 1, 2, 3, 4, 5, 6].map(i => { const ang = Math.PI + i * Math.PI / 6; return `<path d="M${60 + Math.cos(ang) * 34},${70 + Math.sin(ang) * 34} l${Math.cos(ang) * 12},${Math.sin(ang) * 12}"/>`; }).join('')}</g>`;
        s += `<ellipse cx="44" cy="76" rx="22" ry="18" fill="${a}"/>` + eye(38, 70, 4) + eye(50, 70, 4) + `<circle cx="28" cy="78" r="3.5" fill="#1a1a1a"/><path d="M70,40 l6,-8 6,8" fill="${b}"/>`;
        break;
      case 'griffin':
        s += `<path d="M66,60 Q100,20 114,44 Q100,54 104,66 Q90,62 80,74Z" fill="${shade(a, -0.1)}"/><ellipse cx="62" cy="80" rx="28" ry="20" fill="${a}"/><circle cx="44" cy="52" r="18" fill="${a}"/><path d="M28,54 L14,58 L28,62Z" fill="#e8b030"/>` + eye(40, 48, 5) + `<path d="M40,98 L40,108 M56,98 L56,108 M72,98 L72,108" stroke="${shade(a, -0.3)}" stroke-width="5" stroke-linecap="round"/><path d="M50,36 L52,26 L58,34" fill="${b}"/>`;
        break;
      case 'flytrap':
        s += `<path d="M60,110 Q58,80 60,70" stroke="#3a8a2a" stroke-width="6" fill="none"/><path d="M60,92 Q40,84 34,96 Q48,100 60,96Z M60,98 Q80,88 88,100 Q74,104 60,102Z" fill="#5ab83a"/><rect x="40" y="104" width="40" height="14" rx="3" fill="${b}"/>`;
        s += `<path d="M24,46 Q60,10 96,46 Q60,54 24,46Z" fill="${a}"/><path d="M24,52 Q60,86 96,52 Q60,58 24,52Z" fill="${a}"/><path d="M28,48 Q60,40 92,48 Q60,60 28,52Z" fill="${b}"/>`;
        s += `<g fill="#ffffff">${[34, 44, 54, 64, 74, 84].map(x => `<path d="M${x},46 l3,6 3,-6Z"/>`).join('')}</g>` + eye(46, 30, 5) + eye(72, 30, 5);
        break;
      case 'penguin':
        s += `<ellipse cx="60" cy="68" rx="30" ry="38" fill="${b}"/><ellipse cx="60" cy="76" rx="20" ry="28" fill="${c}"/><circle cx="60" cy="40" r="20" fill="${b}"/>` + eye(53, 38, 5) + eye(67, 38, 5) + `<path d="M54,48 L66,48 L60,56Z" fill="#e8a030"/><path d="M48,104 L44,110 L56,110Z M72,104 L76,110 L64,110Z" fill="#e8a030"/>`;
        s += `<g fill="${a}"><circle cx="34" cy="62" r="3"/><circle cx="86" cy="62" r="3"/><rect x="44" y="18" width="32" height="8" rx="3"/></g><circle cx="60" cy="76" r="8" fill="none" stroke="${a}" stroke-width="2.5" stroke-dasharray="3 2"/>`;
        break;
      case 'dustbunny':
        s += `<g fill="${a}">${Array.from({ length: 14 }, (_, i) => { const ang = i / 14 * Math.PI * 2; return `<circle cx="${60 + Math.cos(ang) * 26}" cy="${74 + Math.sin(ang) * 22}" r="12"/>`; }).join('')}<circle cx="60" cy="74" r="26"/></g>`;
        s += `<ellipse cx="46" cy="34" rx="8" ry="20" fill="${a}" transform="rotate(-14 46 34)"/><ellipse cx="74" cy="34" rx="8" ry="20" fill="${a}" transform="rotate(14 74 34)"/><ellipse cx="46" cy="36" rx="4" ry="12" fill="${b}" transform="rotate(-14 46 36)"/><ellipse cx="74" cy="36" rx="4" ry="12" fill="${b}" transform="rotate(14 74 36)"/>` + eye(50, 72, 6) + eye(70, 72, 6) + `<circle cx="60" cy="82" r="3" fill="${b}"/>`;
        break;
      case 'chameleon':
        s += `<path d="M16,80 Q30,40 70,46 Q102,52 104,76 Q100,92 76,92 Q40,96 16,80Z" fill="${a}"/><path d="M98,84 Q118,96 106,110 Q94,112 98,100" stroke="${a}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M30,52 L36,36 L44,50 L52,34 L58,48 L66,32 L72,48" fill="${b}"/>`;
        s += `<circle cx="34" cy="66" r="10" fill="${c}"/>` + eye(34, 66, 6) + `<path d="M18,80 Q26,86 36,82" stroke="#1a1a1a" stroke-width="1.5" fill="none"/><path d="M50,92 L48,104 M80,92 L82,104" stroke="${shade(a, -0.3)}" stroke-width="5" stroke-linecap="round"/>`;
        break;
      case 'scarab':
        s += `<g stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"><path d="M40,60 L18,52 M40,74 L16,76 M40,88 L20,100 M80,60 L102,52 M80,74 L104,76 M80,88 L100,100"/></g>`;
        s += `<ellipse cx="60" cy="76" rx="26" ry="32" fill="${a}"/><path d="M60,44 L60,108" stroke="${c}" stroke-width="2"/><path d="M40,58 Q60,48 80,58" fill="none" stroke="${b}" stroke-width="3"/><circle cx="60" cy="38" r="12" fill="${c}"/>` + eye(55, 36, 3.5) + eye(65, 36, 3.5) + `<circle cx="60" cy="24" r="6" fill="${b}"/>`;
        break;
      case 'cloudog':
        s += `<g fill="${a}"><circle cx="40" cy="84" r="16"/><circle cx="62" cy="88" r="18"/><circle cx="84" cy="82" r="15"/><circle cx="60" cy="52" r="24"/><circle cx="40" cy="44" r="12"/><circle cx="80" cy="44" r="12"/></g>`;
        s += eye(52, 52, 5) + eye(68, 52, 5) + `<ellipse cx="60" cy="62" rx="4" ry="3" fill="#1a1a1a"/><path d="M48,70 Q60,76 72,70" stroke="${c}" stroke-width="3" fill="none"/><circle cx="60" cy="74" r="3" fill="${b}"/>`;
        break;
      default:
        s += `<circle cx="60" cy="60" r="30" fill="${a}"/>` + eye(52, 56) + eye(68, 56);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">${s}</svg>`;
  }
  const petURL = id => urlCache.get('p:' + id) || toURL('p:' + id, petSVG(id));

  /* ══ Accesorios ══ */
  function accSVG(id) {
    const x = ACC_BY_ID[id];
    const [a, b] = x.colors;
    let defs = x.pat ? pattern('ap', x.pat, a, b, shade(b, 0.4)) : '';
    const fillA = x.pat ? 'url(#ap)' : a;
    let s = '';
    switch (x.icon) {
      case 'sewing': s = `<rect x="18" y="40" width="64" height="44" rx="6" fill="${a}"/><rect x="18" y="34" width="64" height="12" rx="4" fill="${b}"/><circle cx="36" cy="64" r="9" fill="#ff5fa8"/><path d="M58,52 L74,76" stroke="#c8c8c8" stroke-width="3"/><circle cx="58" cy="52" r="2" fill="none" stroke="#c8c8c8"/>${stitch(22, 86, 78, 86, 6, b)}`; break;
      case 'bag': s = `<path d="M34,40 Q34,20 50,20 Q66,20 66,40" fill="none" stroke="${b}" stroke-width="5"/><path d="M20,40 L80,40 L74,86 L26,86Z" fill="${fillA}" stroke="${shade(a, -0.3)}" stroke-width="2"/><rect x="44" y="48" width="12" height="8" rx="2" fill="#e8c050"/>`; break;
      case 'heartbag': s = `<path d="M38,38 Q38,18 50,18 Q62,18 62,38" fill="none" stroke="${b}" stroke-width="4"/><path d="${heartPath(50, 66, 7)}" fill="${a}" stroke="${shade(a, -0.3)}" stroke-width="2"/><path d="M42,52 L58,52" stroke="${b}" stroke-width="2"/>`; break;
      case 'camera': s = `<rect x="16" y="32" width="68" height="46" rx="8" fill="${a}"/><rect x="16" y="32" width="68" height="12" rx="6" fill="${b}"/><circle cx="50" cy="60" r="15" fill="#1a1a1a"/><circle cx="50" cy="60" r="9" fill="#3a5a8a"/><circle cx="46" cy="56" r="3" fill="#ffffff" opacity=".7"/><rect x="66" y="36" width="10" height="5" fill="#ffd23f"/>`; break;
      case 'parasol': s = `<path d="M10,46 Q50,4 90,46 Q80,40 70,46 Q60,40 50,46 Q40,40 30,46 Q20,40 10,46Z" fill="${a}" stroke="${b}" stroke-width="2"/><path d="M50,46 L50,88 Q50,94 44,92" fill="none" stroke="${b}" stroke-width="3"/><path d="M50,12 L50,6" stroke="${b}" stroke-width="3"/><path d="M14,46 q6,6 12,0 q6,6 12,0 q6,6 12,0 q6,6 12,0 q6,6 12,0 q6,6 12,0" fill="none" stroke="${b}" stroke-width="1.5"/>`; break;
      case 'flowercrown': s = `<path d="M14,60 Q50,40 86,60" fill="none" stroke="#3a8a2a" stroke-width="3"/>${[18, 32, 50, 68, 82].map((cx, i) => flower(cx, 58 - Math.sin(i / 4 * Math.PI) * 14, i % 2 ? b : a, '#ffe060', 1.5)).join('')}`; break;
      case 'sketchbook': s = `<rect x="22" y="16" width="56" height="70" rx="4" fill="${a}"/><rect x="26" y="20" width="48" height="62" fill="#ffffff"/><path d="M40,30 Q36,50 44,72 L56,72 Q62,50 58,30Z" fill="none" stroke="${b}" stroke-width="2"/><path d="M22,22 L78,22" stroke="#c8c8c8" stroke-width="2" stroke-dasharray="3 3"/><path d="M66,50 L84,86" stroke="#e8c050" stroke-width="4"/>`; break;
      case 'hoops': s = `<circle cx="34" cy="56" r="20" fill="none" stroke="${a}" stroke-width="5"/><circle cx="68" cy="56" r="20" fill="none" stroke="${b}" stroke-width="5"/><circle cx="34" cy="34" r="3" fill="${a}"/><circle cx="68" cy="34" r="3" fill="${b}"/>`; break;
      case 'headdress': s = `<path d="M14,50 Q50,24 86,50 L82,58 Q50,38 18,58Z" fill="${a}" stroke="#a87a1a" stroke-width="2"/><path d="M50,30 L42,44 L50,52 L58,44Z" fill="${b}"/>${[0, 1, 2, 3].map(i => `<rect x="12" y="${58 + i * 9}" width="8" height="6" fill="${i % 2 ? b : a}"/><rect x="80" y="${58 + i * 9}" width="8" height="6" fill="${i % 2 ? b : a}"/>`).join('')}`; break;
      case 'pompoms': s = [[34, 50, a], [66, 54, b]].map(([cx, cy, c]) => `<g fill="${c}">${Array.from({ length: 10 }, (_, i) => `<circle cx="${cx + Math.cos(i / 10 * 6.28) * 12}" cy="${cy + Math.sin(i / 10 * 6.28) * 12}" r="9"/>`).join('')}<circle cx="${cx}" cy="${cy}" r="12"/></g><rect x="${cx - 3}" y="${cy + 14}" width="6" height="20" fill="#1a1a1a"/>`).join(''); break;
      case 'ankh': s = `<path d="M50,52 Q30,40 34,22 Q38,8 50,8 Q62,8 66,22 Q70,40 50,52Z" fill="none" stroke="${a}" stroke-width="7"/><path d="M50,50 L50,92 M30,56 L70,56" stroke="${a}" stroke-width="8"/><circle cx="50" cy="56" r="4" fill="${b}"/>`; break;
      case 'surfboard': s = `<path d="M50,6 Q74,30 66,86 Q50,98 34,86 Q26,30 50,6Z" fill="${a}" stroke="${shade(a, -0.3)}" stroke-width="2"/><path d="M50,10 L50,92" stroke="${b}" stroke-width="5"/><path d="M40,40 Q50,48 60,40" stroke="#ffffff" stroke-width="2" fill="none"/>`; break;
      case 'bottle': s = `<rect x="34" y="28" width="32" height="62" rx="10" fill="${b}" opacity=".85"/><rect x="40" y="14" width="20" height="16" rx="3" fill="${a}"/><path d="M34,56 L66,56 L66,80 Q50,86 34,80Z" fill="${a}" opacity=".6"/><path d="M40,36 L40,74" stroke="#ffffff" stroke-width="3" opacity=".6"/>`; break;
      case 'goggles': s = `<path d="M10,50 L90,50" stroke="${shade(a, -0.3)}" stroke-width="6"/><circle cx="32" cy="50" r="16" fill="${b}" stroke="${a}" stroke-width="6"/><circle cx="68" cy="50" r="16" fill="${b}" stroke="${a}" stroke-width="6"/><circle cx="27" cy="45" r="4" fill="#ffffff" opacity=".7"/><circle cx="63" cy="45" r="4" fill="#ffffff" opacity=".7"/>`; break;
      case 'comic': s = `<rect x="22" y="14" width="56" height="74" rx="3" fill="${b}"/><rect x="26" y="18" width="48" height="16" fill="${a}"/><path d="M34,30 L38,22 L42,30 M46,22 L46,30 L52,30" stroke="#ffffff" stroke-width="2" fill="none"/><path d="${starPath(50, 60, 18)}" fill="${a}"/><path d="M42,58 L58,58" stroke="#1a1a1a" stroke-width="3"/>`; break;
      case 'glasses': s = `<path d="M10,44 Q28,30 46,44 Q44,64 28,64 Q12,64 10,44Z M54,44 Q72,30 90,44 Q88,64 72,64 Q56,64 54,44Z" fill="#ffffff" fill-opacity=".3" stroke="${a}" stroke-width="5"/><path d="M46,46 L54,46" stroke="${a}" stroke-width="4"/>`; break;
      case 'sunglasses': s = `<path d="M8,40 L46,40 Q44,64 28,64 Q10,64 8,40Z M54,40 L92,40 Q90,64 72,64 Q56,64 54,40Z" fill="${a}"/><path d="M46,44 L54,44" stroke="${a}" stroke-width="5"/><path d="M16,46 L28,46 M62,46 L74,46" stroke="#ffffff" stroke-width="2.5" opacity=".5"/><path d="M8,40 L92,40" stroke="${b}" stroke-width="2"/>`; break;
      case 'ball': s = `<circle cx="50" cy="50" r="34" fill="${a}"/><path d="M16,50 L84,50 M50,16 L50,84 M26,26 Q40,50 26,74 M74,26 Q60,50 74,74" fill="none" stroke="${b}" stroke-width="2.5"/><g fill="#ffffff"><circle cx="40" cy="40" r="4"/><circle cx="60" cy="40" r="4"/></g>`; break;
      case 'icenecklace': s = `<path d="M14,20 Q50,60 86,20" fill="none" stroke="#c8e8f8" stroke-width="3"/><path d="M50,40 L36,58 L50,90 L64,58Z" fill="${a}" stroke="${b}" stroke-width="2"/><path d="M50,40 L46,58 L50,90 M36,58 L64,58" stroke="#ffffff" stroke-width="1.2" opacity=".7" fill="none"/>`; break;
      case 'phone': s = `<rect x="30" y="10" width="40" height="80" rx="10" fill="${a}"/><path d="M36,22 L64,22 L66,74 L34,74Z" fill="#1a1a2a"/><path d="${heartPath(50, 50, 3)}" fill="${b}"/><circle cx="50" cy="82" r="4" fill="${b}"/>`; break;
      case 'chain': s = `<g fill="none" stroke="${a}" stroke-width="6">${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${20 + i * 15}" cy="${50 + (i % 2 ? 0 : 0)}" rx="10" ry="${i % 2 ? 4 : 8}"/>`).join('')}</g><path d="M80,50 L90,62 L84,74Z" fill="${b}"/>`; break;
      case 'mic': s = `<path d="M50,58 L50,90 M36,90 L64,90" stroke="${shade(a, -0.3)}" stroke-width="5"/><rect x="32" y="12" width="36" height="48" rx="18" fill="${a}"/><g stroke="${shade(a, -0.3)}" stroke-width="2">${[22, 30, 38, 46].map(y => `<path d="M34,${y} L66,${y}"/>`).join('')}</g><rect x="30" y="44" width="40" height="8" fill="${b}"/>`; break;
      case 'vinyl': s = `<circle cx="50" cy="50" r="40" fill="${a}"/><g fill="none" stroke="#3a3a3a" stroke-width="1">${[34, 28, 22].map(r => `<circle cx="50" cy="50" r="${r}"/>`).join('')}</g><circle cx="50" cy="50" r="13" fill="${b}"/><circle cx="50" cy="50" r="3" fill="#f4f4f4"/>`; break;
      case 'yarn': s = `<circle cx="50" cy="54" r="32" fill="${a}"/><g fill="none" stroke="${shade(a, -0.25)}" stroke-width="2.5"><path d="M24,40 Q50,60 76,40 M20,58 Q50,80 80,58 M34,26 Q40,60 30,82 M62,24 Q58,56 70,84"/></g><path d="M80,64 Q96,80 86,96" fill="none" stroke="${a}" stroke-width="3"/>`; break;
      case 'skateboard': s = `<rect x="10" y="40" width="80" height="16" rx="8" fill="${a}"/><path d="M20,48 L80,48" stroke="${shade(a, 0.3)}" stroke-width="3" stroke-dasharray="6 4"/><circle cx="26" cy="66" r="8" fill="${b}"/><circle cx="74" cy="66" r="8" fill="${b}"/>`; break;
      case 'palette': s = `<path d="M50,14 Q90,14 90,50 Q90,72 72,72 Q62,72 66,82 Q66,90 50,88 Q10,86 10,50 Q10,14 50,14Z" fill="#f4e8d8" stroke="#c8b8a0" stroke-width="2"/>${[[30, 36, a], [50, 28, '#3a8ad8'], [70, 36, '#f4d03a'], [28, 58, '#3aa03a']].map(([cx, cy, c]) => `<circle cx="${cx}" cy="${cy}" r="7" fill="${c}"/>`).join('')}<path d="M60,56 L92,90" stroke="${b}" stroke-width="5" stroke-linecap="round"/>`; break;
      case 'lamp': s = `<path d="M18,62 Q20,44 50,44 Q80,44 84,58 Q96,52 96,40 Q100,64 80,70 L24,70Z" fill="${a}" stroke="#a87a1a" stroke-width="2"/><path d="M14,56 Q4,52 8,44" stroke="${a}" stroke-width="4" fill="none"/><rect x="30" y="70" width="40" height="8" rx="3" fill="#a87a1a"/><path d="M50,44 Q42,30 50,24 Q58,18 52,8" fill="none" stroke="${b}" stroke-width="3" opacity=".7"/><circle cx="50" cy="40" r="4" fill="#ffffff"/>`; break;
      case 'watering': s = `<path d="M24,40 L70,40 L74,84 L20,84Z" fill="${a}"/><path d="M70,50 L92,30" stroke="${a}" stroke-width="7" stroke-linecap="round"/><path d="M24,48 Q8,48 10,62 Q12,74 22,72" fill="none" stroke="${a}" stroke-width="5"/><path d="${heartPath(46, 64, 2.5)}" fill="${b}"/>`; break;
      case 'guitar': s = `<path d="M40,52 Q24,52 24,70 Q24,90 44,90 Q58,90 62,78 Q72,76 70,64 Q66,52 54,56 Q50,48 40,52Z" fill="${a}"/><circle cx="46" cy="70" r="6" fill="${b}"/><path d="M56,62 L88,14" stroke="${b}" stroke-width="5"/><rect x="82" y="8" width="10" height="12" rx="2" fill="${b}"/>`; break;
      case 'fan': s = `<path d="M50,84 L10,40 Q50,0 90,40Z" fill="${a}" stroke="${b}" stroke-width="2"/><g stroke="${b}" stroke-width="1.5">${[-40, -20, 0, 20, 40].map(dx => `<path d="M50,84 L${50 + dx},${dx * dx / 80 + 12}"/>`).join('')}</g><circle cx="50" cy="84" r="5" fill="${b}"/>`; break;
      case 'clapper': s = `<rect x="16" y="40" width="68" height="46" rx="3" fill="${a}"/><path d="M16,40 L84,28 L82,18 L14,30Z" fill="${b}"/><g fill="${a}"><path d="M24,28 L34,26 L38,34 L28,36Z M48,24 L58,22 L62,30 L52,32Z"/></g><path d="M24,56 L76,56 M24,68 L76,68" stroke="${b}" stroke-width="2"/>`; break;
      case 'diary': s = `<rect x="24" y="12" width="54" height="76" rx="4" fill="${a}"/><rect x="24" y="12" width="8" height="76" fill="${shade(a, -0.3)}"/><path d="M50,36 c-7,0 -10,5 -10,9 c0,3 2,5 4,6 v4 h12 v-4 c2,-1 4,-3 4,-6 c0,-4 -3,-9 -10,-9Z" fill="${b}"/><path d="M62,34 L70,30 L70,40Z" fill="${b}"/><rect x="74" y="44" width="8" height="12" rx="2" fill="#e8c050"/>`; break;
      case 'locker': s = `<path d="M36,8 L64,8 L82,26 L74,92 L26,92 L18,26Z" fill="${a}" stroke="${b}" stroke-width="3"/><path d="M50,30 c-8,0 -12,5 -12,10 c0,4 2,6 5,7 v4 h14 v-4 c3,-1 5,-3 5,-7 c0,-5 -4,-10 -12,-10Z" fill="${b}"/><rect x="66" y="50" width="5" height="14" rx="2" fill="#c8c8c8"/>`; break;
      case 'coffee': s = `<path d="M28,30 L72,30 L66,88 L34,88Z" fill="#f4ece0"/><rect x="26" y="24" width="48" height="10" rx="3" fill="${b}"/><rect x="31" y="50" width="38" height="20" fill="${a}"/><path d="M50,54 c-4,0 -6,3 -6,5 c0,2 1,3 2,4 v2 h8 v-2 c1,-1 2,-2 2,-4 c0,-2 -2,-5 -6,-5Z" fill="#f4ece0"/><path d="M44,20 Q40,12 46,6 M56,20 Q52,12 58,6" stroke="#c8c8c8" stroke-width="2" fill="none"/>`; break;
      case 'tray': s = `<rect x="8" y="58" width="84" height="12" rx="4" fill="${a}"/><circle cx="32" cy="48" r="12" fill="#5ab83a"/><rect x="52" y="34" width="22" height="24" rx="3" fill="${b}"/><path d="M58,34 L58,26" stroke="#ffffff" stroke-width="3"/>`; break;
      case 'shoes': s = `<path d="M14,70 Q14,50 30,48 L44,48 Q50,60 64,64 L84,68 Q90,74 84,80 L22,80Z" fill="${a}"/><rect x="18" y="80" width="14" height="10" fill="${b}"/><path d="M14,80 L88,80" stroke="${b}" stroke-width="4"/>`; break;
      case 'lipstick': s = `<rect x="36" y="50" width="28" height="40" rx="3" fill="${b}"/><rect x="38" y="36" width="24" height="16" fill="#e8c050"/><path d="M40,36 L40,16 L60,24 L60,36Z" fill="${a}"/>`; break;
      case 'mirror': s = `<ellipse cx="50" cy="40" rx="28" ry="32" fill="${b}"/><ellipse cx="50" cy="40" rx="22" ry="26" fill="${a}"/><path d="M38,26 L46,22" stroke="#ffffff" stroke-width="3" opacity=".7"/><rect x="45" y="70" width="10" height="24" rx="4" fill="${b}"/>`; break;
      case 'brush': s = `<rect x="44" y="50" width="12" height="44" rx="5" fill="${a}"/><ellipse cx="50" cy="32" rx="22" ry="24" fill="${a}"/><g stroke="${b}" stroke-width="2">${[38, 44, 50, 56, 62].map(x => `<path d="M${x},20 L${x},44"/>`).join('')}</g>`; break;
      case 'skullbow': s = `<path d="M50,26 c-18,0 -26,12 -26,24 c0,8 5,13 11,15 v10 h30 v-10 c6,-2 11,-7 11,-15 c0,-12 -8,-24 -26,-24Z" fill="${a}" stroke="#1a1a1a" stroke-width="2"/><ellipse cx="40" cy="50" rx="6" ry="7" fill="#1a1a1a"/><ellipse cx="60" cy="50" rx="6" ry="7" fill="#1a1a1a"/><path d="M47,62 L50,58 L53,62Z" fill="#1a1a1a"/><path d="M64,26 L82,12 L84,34Z M64,26 L82,40 L66,32Z" fill="${b}"/><circle cx="66" cy="27" r="5" fill="${b}"/>`; break;
      case 'balloon': s = `<ellipse cx="50" cy="38" rx="26" ry="30" fill="${a}"/><path d="M40,22 Q44,16 52,16" stroke="#ffffff" stroke-width="3" fill="none" opacity=".6"/><path d="M50,68 L46,74 L54,74Z" fill="${a}"/><path d="M50,74 Q44,86 52,96" fill="none" stroke="${b}" stroke-width="1.5"/>`; break;
      case 'book': s = `<rect x="20" y="14" width="60" height="74" rx="3" fill="${a}"/><rect x="26" y="20" width="48" height="62" rx="2" fill="none" stroke="${b}" stroke-width="2"/><path d="M50,36 c-7,0 -10,5 -10,9 c0,3 2,5 4,6 v4 h12 v-4 c2,-1 4,-3 4,-6 c0,-4 -3,-9 -10,-9Z" fill="${b}"/>`; break;
      case 'key': s = `<circle cx="50" cy="28" r="18" fill="${b}"/>${[[44, 24], [56, 24], [44, 34], [56, 34]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="3" fill="#1a1a2a"/>`).join('')}<path d="M50,46 L50,92 M50,74 L62,74 M50,84 L60,84" stroke="${a}" stroke-width="6"/>`; break;
      case 'spellbook': s = `<rect x="16" y="14" width="68" height="76" rx="4" fill="${a}"/><path d="M50,30 Q38,40 40,52 Q42,62 50,64 Q58,62 60,52 Q62,40 50,30Z" fill="#c8b890"/><circle cx="50" cy="48" r="4" fill="${b}"/><path d="M44,48 L56,48" stroke="#1a1a1a" stroke-width="1.5"/><g fill="${b}"><rect x="16" y="20" width="6" height="10"/><rect x="16" y="74" width="6" height="10"/><rect x="78" y="20" width="6" height="10"/><rect x="78" y="74" width="6" height="10"/></g>`; break;
      case 'pumpkin': s = `<path d="M50,24 Q50,14 58,10" stroke="${b}" stroke-width="5" fill="none"/><g fill="${a}"><ellipse cx="34" cy="58" rx="18" ry="28"/><ellipse cx="66" cy="58" rx="18" ry="28"/><ellipse cx="50" cy="58" rx="20" ry="30"/></g><path d="M38,50 L44,44 L46,54Z M62,50 L56,44 L54,54Z M36,68 Q50,80 64,68 L58,70 L54,66 L50,72 L46,66 L42,70Z" fill="#3a1a0a"/>`; break;
      default: s = `<circle cx="50" cy="50" r="30" fill="${a}"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs>${defs}</defs>${s}</svg>`;
  }
  const accURL = id => urlCache.get('a:' + id) || toURL('a:' + id, accSVG(id));

  /* ── Iconos de interfaz ── */
  function skullBow(c = '#ffffff', bow = '#ff3d9a', size = 24) {
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><path d="M46,20 c-20,0 -30,13 -30,27 c0,9 5,15 12,17 v12 h34 v-12 c7,-2 12,-8 12,-17 c0,-14 -10,-27 -28,-27Z" fill="${c}"/><ellipse cx="35" cy="47" rx="7" ry="8" fill="#1a1018"/><ellipse cx="57" cy="47" rx="7" ry="8" fill="#1a1018"/><path d="M43,60 L46,55 L49,60Z" fill="#1a1018"/><path d="M38,76 L38,70 M46,76 L46,70 M54,76 L54,70" stroke="#1a1018" stroke-width="3"/><path d="M66,22 L88,6 L90,34Z M66,22 L90,40 L70,30Z" fill="${bow}"/><circle cx="68" cy="23" r="6" fill="${bow}"/></svg>`;
  }

  return { doll: dollSVG, dollURL, pet: petSVG, petURL, acc: accSVG, accURL, skullBow, shade, mix, pattern };
})();
