'use strict';

/* ══════════════════════════════════════
   PIXEL ART
   Todo se dibuja con código en lienzos pequeños (1 unidad = 1 píxel de
   pixel art) que luego se escalan sin suavizado.
══════════════════════════════════════ */
const Sprites = (() => {
  const cache = new Map();

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function cached(key, build) {
    if (!cache.has(key)) cache.set(key, build());
    return cache.get(key);
  }

  // Añade un borde oscuro de 1 px alrededor de la silueta
  function outline(src, color = 'rgba(40,25,15,0.6)') {
    const w = src.width, h = src.height;
    const out = makeCanvas(w + 2, h + 2);
    const ctx = out.getContext('2d');
    const data = src.getContext('2d').getImageData(0, 0, w, h).data;
    ctx.fillStyle = color;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 0) ctx.fillRect(x, y, 3, 3);
      }
    }
    ctx.drawImage(src, 1, 1);
    return out;
  }

  function flip(src) {
    const out = makeCanvas(src.width, src.height);
    const ctx = out.getContext('2d');
    ctx.translate(src.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    return out;
  }

  // Dibuja un mapa de caracteres: cada letra es un color de la paleta, '.' es transparente
  function pixmap(rows, pal) {
    const c = makeCanvas(rows[0].length, rows.length);
    const ctx = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    });
    return c;
  }

  function disc(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function ellipse(ctx, cx, cy, rx, ry, color) {
    ctx.fillStyle = color;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // Ruido determinista para que el suelo no cambie entre fotogramas
  function hash(x, y, s = 0) {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  /* ── Granjero ─────────────────────────── */
  const PLAYER_PAL = {
    h: '#e9c46a', H: '#b5651d', k: '#f2c49b', e: '#2b1d14', r: '#6b3e1f',
    s: '#d9574a', S: '#a83f35', p: '#3b5ba5', b: '#4a2c1a',
  };
  const PLAYER_TOP = {
    down: [
      '....hhhh....', '..hhhhhhhh..', '.hhhHHHHhhh.', 'hhhhhhhhhhhh',
      '..rkkkkkkr..', '..kkekkekk..', '..kkkkkkkk..', '...kkkkkk...',
      '..ssssssss..', '.kssssssssk.', '.kssSSSSssk.', '..ssssssss..', '..pppppppp..',
    ],
    up: [
      '....hhhh....', '..hhhhhhhh..', '.hhhHHHHhhh.', 'hhhhhhhhhhhh',
      '..rrrrrrrr..', '..rrrrrrrr..', '..rrrrrrrr..', '...kkkkkk...',
      '..ssssssss..', '.kssssssssk.', '.kssSSSSssk.', '..ssssssss..', '..pppppppp..',
    ],
    left: [
      '....hhhh....', '..hhhhhhhh..', '.hhHHHHhhhh.', 'hhhhhhhhhhh.',
      '...kkkkrr...', '...kekkrr...', '..kkkkkrr...', '....kkkk....',
      '...ssssss...', '...sksSss...', '...ssSSss...', '...ssssss...', '...pppppp...',
    ],
  };
  const PLAYER_LEGS = {
    front: [
      ['..ppp..ppp..', '..ppp..ppp..', '..bbb..bbb..'],
      ['..ppp..ppp..', '..bbb..ppp..', '.......bbb..'],
      ['..ppp..ppp..', '..ppp..bbb..', '..bbb.......'],
    ],
    side: [
      ['....pppp....', '....pppp....', '....bbbb....'],
      ['...pp..pp...', '...pp..pp...', '...bb..bb...'],
      ['....pppp....', '...pppp.....', '...bbbb.....'],
    ],
  };

  function player(dir, frame) {
    return cached(`player-${dir}-${frame}`, () => {
      if (dir === 'right') return flip(player('left', frame));
      const legs = dir === 'left' ? PLAYER_LEGS.side : PLAYER_LEGS.front;
      return outline(pixmap([...PLAYER_TOP[dir], ...legs[frame]], PLAYER_PAL));
    });
  }

  /* ── Animales (mirando a la derecha) ──── */
  const ANIMAL_ART = {
    gallina: {
      pal: { w: '#fbfbf5', g: '#d6d6cc', r: '#e0412f', o: '#f0a020', e: '#222' },
      rows: [
        '....rr....', '...rwww...', '...wwewo..', '...wwww...', '.wwwwwww..',
        'wwwwwwwww.', 'wgwwwwwww.', '.wggwwww..', '..wwwww...', '...o..o...',
      ],
    },
    oveja: {
      pal: { f: '#f4f1ea', F: '#d9d3c7', D: '#3a3530', e: '#fff' },
      rows: [
        '..ffff.ffff...', '.ffffffffff...', 'fffFffffffffDD', 'ffffffffFfffDe',
        'ffFffffffffDDD', '.ffffffFfffDD.', '..ffffffffff..', '..DD.DD..DD.DD', '..DD.DD..DD.DD',
      ],
    },
    vaca: {
      pal: { w: '#f7f5ef', K: '#2d2a26', n: '#f2a7a0', h: '#d8c9a0', e: '#222' },
      rows: [
        '.............hh.', '............wwww', 'wwwwKKwwwwwwwwew', 'wwwKKKwwwwKKwwww',
        'wwwwKwwwwKKKwwnn', 'wwwwwwwwwwKwwwnn', 'wwKKwwwwwwwwww..', '.wwwwwwwwwwwww..',
        '.ww.ww....ww.ww.', '.ww.ww....ww.ww.', '.KK.KK....KK.KK.',
      ],
    },
    cerdo: {
      pal: { p: '#f4a6b4', P: '#d97a8c', e: '#2b1d14' },
      rows: [
        '.P........P...', '.pppppppppppp.', 'ppppppppppppep', 'pppppppppppPPP',
        'pppppppppppPPP', 'pppppppppppppp', '.pppppppppppp.', '.pp.pp..pp.pp.', '.PP.PP..PP.PP.',
      ],
    },
  };

  function animal(type, facingLeft, step) {
    return cached(`animal-${type}-${facingLeft}-${step}`, () => {
      if (facingLeft) return flip(animal(type, false, step));
      const art = ANIMAL_ART[type];
      let rows = art.rows;
      if (step) {
        // paso: intercambia las patas delanteras y traseras de la última fila
        rows = rows.slice();
        const last = rows[rows.length - 1];
        rows[rows.length - 1] = last.split('').reverse().join('');
      }
      return outline(pixmap(rows, art.pal));
    });
  }

  /* ── Cultivos ─────────────────────────── */
  function crop(id, stage) {
    return cached(`crop-${id}-${stage}`, () => {
      const c = makeCanvas(16, 16);
      const ctx = c.getContext('2d');
      const art = CROPS[id].art;
      const leaf = art.leaf || '#5fae3e';
      const leafDark = '#3f7f2a';
      if (stage === 'dead') {
        rect(ctx, 7, 8, 2, 7, '#8a7350');
        rect(ctx, 4, 9, 3, 1, '#9c845c'); rect(ctx, 9, 10, 3, 1, '#9c845c');
        rect(ctx, 3, 10, 1, 2, '#9c845c'); rect(ctx, 12, 11, 1, 2, '#9c845c');
        rect(ctx, 6, 6, 4, 2, '#7d6544');
      } else if (stage === 0) {
        rect(ctx, 7, 11, 2, 4, leafDark);
        rect(ctx, 5, 10, 2, 2, leaf); rect(ctx, 9, 10, 2, 2, leaf);
        rect(ctx, 4, 9, 2, 1, leaf); rect(ctx, 10, 9, 2, 1, leaf);
      } else if (stage === 1) {
        rect(ctx, 7, 6, 2, 9, leafDark);
        rect(ctx, 3, 8, 4, 2, leaf); rect(ctx, 9, 7, 4, 2, leaf);
        rect(ctx, 4, 11, 3, 2, leaf); rect(ctx, 9, 10, 4, 2, leaf);
        rect(ctx, 6, 4, 4, 2, leaf);
      } else {
        drawRipe(ctx, art, leaf, leafDark);
      }
      return outline(c);
    });
  }

  function drawRipe(ctx, art, leaf, leafDark) {
    switch (art.type) {
      case 'stalk':
        [[2, 5], [5, 3], [8, 2], [11, 4], [13, 6]].forEach(([x, top]) => {
          rect(ctx, x, top + 4, 1, 15 - top - 4, '#9aa83a');
          for (let y = top; y < top + 5; y++) rect(ctx, x - (y % 2), y, 2, 1, y % 2 ? art.dark : art.color);
        });
        break;
      case 'corn':
        rect(ctx, 7, 1, 2, 15, '#4f9a3a');
        rect(ctx, 3, 6, 4, 2, leaf); rect(ctx, 1, 5, 2, 1, leaf);
        rect(ctx, 9, 10, 4, 2, leaf); rect(ctx, 13, 9, 2, 1, leaf);
        rect(ctx, 4, 12, 3, 2, leafDark);
        rect(ctx, 9, 3, 3, 6, art.color);
        for (let y = 3; y < 9; y += 2) rect(ctx, 10, y, 1, 1, art.dark);
        rect(ctx, 9, 2, 3, 1, '#c9d27a');
        break;
      case 'root':
        rect(ctx, 6, 3, 1, 8, leaf); rect(ctx, 9, 4, 1, 7, leaf); rect(ctx, 7, 2, 2, 9, leafDark);
        rect(ctx, 4, 5, 2, 1, leaf); rect(ctx, 10, 5, 2, 1, leaf); rect(ctx, 5, 6, 1, 3, leaf); rect(ctx, 10, 6, 1, 3, leaf);
        ellipse(ctx, 7.5, 12.5, 4, 2.6, art.color);
        rect(ctx, 5, 12, 6, 1, art.dark);
        break;
      case 'head':
        disc(ctx, 7.5, 9.5, 6, art.dark);
        disc(ctx, 7.5, 9, 4.6, art.color);
        disc(ctx, 7, 8.5, 2.4, '#c4ec9e');
        rect(ctx, 4, 14, 8, 1, art.dark);
        break;
      case 'bush':
        disc(ctx, 7.5, 8.5, 6.5, leafDark);
        disc(ctx, 7, 8, 5.2, leaf);
        (art.small
          ? [[3, 6], [10, 4], [6, 10], [11, 10], [4, 12], [8, 6]]
          : [[3, 7], [9, 4], [5, 11], [11, 10]]
        ).forEach(([x, y]) => {
          const s = art.small ? 2 : 3;
          rect(ctx, x, y, s, s, art.color);
          rect(ctx, x, y + s - 1, s, 1, art.dark);
          rect(ctx, x, y, 1, 1, '#ffd2c8');
        });
        break;
      case 'ground':
        rect(ctx, 7, 3, 2, 3, '#5a7a2a');
        rect(ctx, 9, 4, 3, 2, leaf);
        ellipse(ctx, 7.5, 10.5, 7, 4.8, art.color);
        for (const x of [3, 7, 11]) rect(ctx, x, 7, 1, 8, art.dark);
        rect(ctx, 4, 7, 2, 1, 'rgba(255,255,255,0.35)');
        break;
    }
  }

  /* ── Árboles ──────────────────────────── */
  const TREE_COLORS = {
    primavera: { base: '#4f9a3a', light: '#6fbf4f', extra: '#f6a8c8' },
    verano:    { base: '#3f8a30', light: '#5fae3e', extra: null },
    otono:     { base: '#c0602a', light: '#e8923a', extra: '#f2c14e' },
    invierno:  { base: '#4e6e5a', light: '#6b8a76', extra: '#ffffff' },
  };

  function tree(season, variant) {
    return cached(`tree-${season}-${variant}`, () => {
      const c = makeCanvas(30, 38);
      const ctx = c.getContext('2d');
      const col = TREE_COLORS[season];
      rect(ctx, 12, 24, 6, 13, '#6b4426');
      rect(ctx, 12, 24, 2, 13, '#83552f');
      rect(ctx, 10, 35, 10, 2, '#5a381e');
      const blobs = variant
        ? [[15, 12, 11], [8, 17, 7], [22, 17, 7], [15, 5, 7]]
        : [[15, 13, 12], [7, 18, 6], [23, 18, 6]];
      for (const [x, y, r] of blobs) disc(ctx, x, y + 1, r, col.base);
      for (const [x, y, r] of blobs) disc(ctx, x - 1, y - 1, r * 0.7, col.light);
      if (col.extra) {
        for (let i = 0; i < 18; i++) {
          const x = 4 + Math.floor(hash(i, variant, 7) * 22);
          const y = 3 + Math.floor(hash(i, variant, 9) * 20);
          const d = ctx.getImageData(x, y, 1, 1).data;
          if (d[3] && (season !== 'invierno' || y < 14)) rect(ctx, x, y, season === 'invierno' ? 3 : 2, season === 'invierno' ? 1 : 2, col.extra);
        }
      }
      return outline(c);
    });
  }

  /* ── Edificios ────────────────────────── */
  function planks(ctx, x, y, w, h, base, line) {
    rect(ctx, x, y, w, h, base);
    for (let yy = y + 3; yy < y + h; yy += 4) rect(ctx, x, yy, w, 1, line);
  }

  function roof(ctx, x, y, w, h, color, dark, snow) {
    for (let i = 0; i < h; i++) {
      const inset = Math.max(0, Math.floor((h - i) / 3) - 1);
      rect(ctx, x + inset, y + i, w - inset * 2, 1, i % 4 === 3 ? dark : color);
    }
    if (snow) {
      for (let i = 0; i < 4; i++) {
        const inset = Math.max(0, Math.floor((h - i) / 3) - 1);
        rect(ctx, x + inset, y + i, w - inset * 2, 1, '#f4f8fb');
      }
      for (let xx = x + 4; xx < x + w - 4; xx += 5) rect(ctx, xx, y + 4, 2, 2 + (xx % 3), '#f4f8fb');
    }
  }

  function windowAt(ctx, x, y, lit) {
    rect(ctx, x, y, 12, 10, '#5a3a22');
    rect(ctx, x + 1, y + 1, 10, 8, lit ? '#ffd77a' : '#9fd3e6');
    rect(ctx, x + 6, y + 1, 1, 8, '#5a3a22');
    rect(ctx, x + 1, y + 5, 10, 1, '#5a3a22');
    if (!lit) rect(ctx, x + 2, y + 2, 2, 2, '#e4f6fb');
  }

  function building(id, season, lit) {
    return cached(`b-${id}-${season}-${lit}`, () => {
      const snow = season === 'invierno';
      let c, ctx;
      if (id === 'casa') {
        c = makeCanvas(80, 82); ctx = c.getContext('2d');
        rect(ctx, 60, 4, 8, 16, '#8a5a44'); rect(ctx, 59, 3, 10, 3, '#6b4434');
        planks(ctx, 4, 40, 72, 42, '#c98e5a', '#a86f42');
        roof(ctx, 0, 10, 80, 34, '#b8473b', '#8f3329', snow);
        rect(ctx, 33, 58, 14, 24, '#6b3e1f'); rect(ctx, 35, 60, 10, 22, '#83502a');
        rect(ctx, 42, 70, 2, 2, '#e9c46a');
        windowAt(ctx, 12, 54, lit); windowAt(ctx, 56, 54, lit);
        rect(ctx, 10, 64, 16, 3, '#7a4d2c'); rect(ctx, 54, 64, 16, 3, '#7a4d2c');
        rect(ctx, 11, 63, 3, 2, '#e85a7a'); rect(ctx, 16, 63, 3, 2, '#f2c14e'); rect(ctx, 21, 63, 3, 2, '#e85a7a');
        rect(ctx, 57, 63, 3, 2, '#f2c14e'); rect(ctx, 62, 63, 3, 2, '#6aa0e8'); rect(ctx, 67, 63, 3, 2, '#f2c14e');
      } else if (id === 'establo') {
        c = makeCanvas(80, 82); ctx = c.getContext('2d');
        planks(ctx, 2, 34, 76, 48, '#a83a32', '#8a2e28');
        roof(ctx, 0, 4, 80, 34, '#5b3b2e', '#462c22', snow);
        rect(ctx, 26, 50, 28, 32, '#f2ead8'); rect(ctx, 28, 52, 24, 30, '#8a2e28');
        ctx.fillStyle = '#f2ead8';
        for (let i = 0; i < 24; i++) { ctx.fillRect(28 + i, 52 + Math.floor(i * 30 / 24), 2, 1); ctx.fillRect(50 - i, 52 + Math.floor(i * 30 / 24), 2, 1); }
        rect(ctx, 39, 52, 2, 30, '#f2ead8');
        rect(ctx, 34, 38, 12, 8, '#f2ead8'); rect(ctx, 35, 39, 10, 6, lit ? '#ffd77a' : '#3a2418');
        rect(ctx, 2, 34, 76, 2, '#f2ead8');
      } else if (id === 'taller') {
        c = makeCanvas(48, 66); ctx = c.getContext('2d');
        planks(ctx, 2, 26, 44, 40, '#7d8fa3', '#66788c');
        roof(ctx, 0, 4, 48, 26, '#3f6e6a', '#2f5450', snow);
        rect(ctx, 17, 44, 14, 22, '#4a3626'); rect(ctx, 19, 46, 10, 20, '#5e4532');
        windowAt(ctx, 4, 38, lit);
        rect(ctx, 33, 36, 11, 8, '#d8c9a0'); rect(ctx, 35, 38, 7, 2, '#555'); rect(ctx, 37, 40, 3, 3, '#555');
      } else if (id === 'caja') {
        c = makeCanvas(16, 18); ctx = c.getContext('2d');
        rect(ctx, 1, 6, 14, 11, '#9b6a3c'); rect(ctx, 1, 9, 14, 1, '#7a5230'); rect(ctx, 1, 13, 14, 1, '#7a5230');
        rect(ctx, 0, 3, 16, 4, '#7a5230'); rect(ctx, 0, 3, 16, 1, '#b07d4a');
        rect(ctx, 3, 6, 1, 11, '#c0c4c8'); rect(ctx, 12, 6, 1, 11, '#c0c4c8');
        if (snow) rect(ctx, 0, 2, 16, 2, '#f4f8fb');
        c = outline(c);
      } else if (id === 'tablon') {
        c = makeCanvas(18, 20); ctx = c.getContext('2d');
        rect(ctx, 2, 8, 2, 12, '#6b4426'); rect(ctx, 14, 8, 2, 12, '#6b4426');
        rect(ctx, 0, 1, 18, 12, '#8a5a34'); rect(ctx, 1, 2, 16, 10, '#a8743f');
        rect(ctx, 3, 3, 5, 6, '#f4ecd8'); rect(ctx, 10, 4, 5, 5, '#f8e08a'); rect(ctx, 4, 4, 3, 1, '#888'); rect(ctx, 4, 6, 3, 1, '#888');
        rect(ctx, 5, 3, 1, 1, '#e0412f'); rect(ctx, 12, 4, 1, 1, '#e0412f');
        if (snow) rect(ctx, 0, 0, 18, 2, '#f4f8fb');
        c = outline(c);
      }
      return c;
    });
  }

  /* ── Suelo ────────────────────────────── */
  const GRASS = {
    primavera: ['#79c05a', '#66ad4a', '#93d272'],
    verano:    ['#6ab04c', '#579a3c', '#84c463'],
    otono:     ['#bba14e', '#a3873c', '#d1b964'],
    invierno:  ['#e8eff3', '#d0dce3', '#ffffff'],
  };

  function grassTile(ctx, x, y, season, tx, ty) {
    const [base, dark, light] = GRASS[season];
    rect(ctx, x, y, 16, 16, base);
    for (let i = 0; i < 6; i++) {
      const px = Math.floor(hash(tx, ty, i) * 15), py = Math.floor(hash(tx, ty, i + 20) * 14);
      rect(ctx, x + px, y + py, 1, 2, i % 2 ? dark : light);
    }
    if (hash(tx, ty, 99) > 0.86) {
      const px = 3 + Math.floor(hash(tx, ty, 50) * 9), py = 4 + Math.floor(hash(tx, ty, 51) * 8);
      rect(ctx, x + px, y + py, 1, 3, dark); rect(ctx, x + px + 2, y + py - 1, 1, 4, dark); rect(ctx, x + px + 4, y + py, 1, 3, dark);
    }
    if (season !== 'invierno' && hash(tx, ty, 77) > 0.94) {
      const px = 3 + Math.floor(hash(tx, ty, 60) * 10), py = 3 + Math.floor(hash(tx, ty, 61) * 10);
      const flower = ['#f6f1e0', '#f2c14e', '#e85a7a', '#9a7fe0'][Math.floor(hash(tx, ty, 62) * 4)];
      rect(ctx, x + px, y + py, 2, 2, flower); rect(ctx, x + px, y + py + 2, 1, 1, dark);
    }
  }

  function pathTile(ctx, x, y, season, tx, ty) {
    rect(ctx, x, y, 16, 16, season === 'invierno' ? '#d9cbb4' : '#cfa874');
    for (let i = 0; i < 5; i++) {
      const px = Math.floor(hash(tx, ty, i + 40) * 14), py = Math.floor(hash(tx, ty, i + 45) * 14);
      rect(ctx, x + px, y + py, 2, 1, i % 2 ? '#b08a58' : '#e2c296');
    }
  }

  function fieldTile(ctx, x, y, tx, ty, state) {
    if (state === 'untilled') {
      rect(ctx, x, y, 16, 16, '#b88b58');
      for (let i = 0; i < 6; i++) {
        const px = Math.floor(hash(tx, ty, i + 80) * 14), py = Math.floor(hash(tx, ty, i + 90) * 14);
        rect(ctx, x + px, y + py, 2, 1, i % 2 ? '#a07646' : '#cfa274');
      }
      return;
    }
    const wet = state === 'wet';
    rect(ctx, x, y, 16, 16, wet ? '#5c3b22' : '#8a5a33');
    for (let yy = 2; yy < 16; yy += 4) rect(ctx, x + 1, y + yy, 14, 1, wet ? '#45291a' : '#704626');
    rect(ctx, x, y, 16, 1, wet ? '#6e4a2c' : '#9c6a3e');
  }

  function waterTile(ctx, x, y, edges) {
    rect(ctx, x, y, 16, 16, '#4a9ad4');
    if (edges.top) rect(ctx, x, y, 16, 3, '#8fcbea');
    if (edges.left) rect(ctx, x, y, 2, 16, '#8fcbea');
    if (edges.right) rect(ctx, x + 14, y, 2, 16, '#3b84bc');
    if (edges.bottom) rect(ctx, x, y + 14, 16, 2, '#3b84bc');
  }

  function fence(ctx, x, y, n) {
    const post = '#8a5a34', rail = '#a8743f';
    for (const ry of [5, 10]) {
      if (n.left) rect(ctx, x, y + ry, 8, 2, rail);
      if (n.right) rect(ctx, x + 8, y + ry, 8, 2, rail);
    }
    if (n.up) rect(ctx, x + 7, y, 2, 6, rail);
    if (n.down) rect(ctx, x + 7, y + 10, 2, 6, rail);
    rect(ctx, x + 6, y + 2, 4, 12, post);
    rect(ctx, x + 6, y + 2, 4, 1, '#b07d4a');
    rect(ctx, x + 6, y + 13, 4, 1, '#5a381e');
  }

  return { player, animal, crop, tree, building, grassTile, pathTile, fieldTile, waterTile, fence, hash };
})();
