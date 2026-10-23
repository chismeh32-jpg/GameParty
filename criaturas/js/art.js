'use strict';

/* ══════════════════════════════════════
   PIXEL ART PROCEDURAL
   Todo se dibuja con código: no hay imágenes externas.
══════════════════════════════════════ */
const Art = (() => {
  const cache = new Map();
  const cached = (key, build) => {
    if (!cache.has(key)) cache.set(key, build());
    return cache.get(key);
  };

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  /* ── Color ───────────────────────────── */
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex([r, g, b]) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  // amt > 0 aclara, amt < 0 oscurece
  function shade(hex, amt) {
    const rgb = hexToRgb(hex);
    return rgbToHex(rgb.map(v => (amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  }

  /* ── Primitivas a nivel de píxel ─────── */
  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function ellipse(ctx, cx, cy, rx, ry, color, clipY) {
    if (rx <= 0 || ry <= 0) return;
    ctx.fillStyle = color;
    const y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      if (clipY !== undefined && y > clipY) break;
      const dy = (y + 0.5 - cy) / ry;
      if (Math.abs(dy) > 1) continue;
      const half = rx * Math.sqrt(1 - dy * dy);
      const xa = Math.round(cx - half), xb = Math.round(cx + half);
      if (xb > xa) ctx.fillRect(xa, y, xb - xa, 1);
    }
  }

  function poly(ctx, pts, color) {
    ctx.fillStyle = color;
    const ys = pts.map(p => p[1]);
    const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const sy = y + 0.5;
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const xa = Math.round(xs[i]), xb = Math.round(xs[i + 1]);
        if (xb > xa) ctx.fillRect(xa, y, xb - xa, 1);
      }
    }
  }

  function line(ctx, x0, y0, x1, y1, color, w = 1) {
    ctx.fillStyle = color;
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps, y = y0 + ((y1 - y0) * i) / steps;
      ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
    }
  }

  // Borde de 1 px alrededor de la silueta
  function outline(src, color) {
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

  function pixmap(rows, pal) {
    const c = makeCanvas(rows[0].length, rows.length);
    const ctx = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (col) rect(ctx, x, y, 1, 1, col);
      }
    });
    return c;
  }

  function hash(x, y, s = 0) {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  /* ══════════════════════════════════════
     CRIATURAS
     Se dibujan en un lienzo de 72×72 a partir de un "plan" corporal.
     Las coordenadas se escriben en un espacio de 64×64 con el suelo en y=60.
  ══════════════════════════════════════ */
  function creature(id, view = 'front') {
    return cached(`cr-${id}-${view}`, () => {
      const sp = SPECIES[id];
      const a = sp.art;
      const k = a.size || 1;
      const back = view === 'back';
      const c = makeCanvas(72, 72);
      const ctx = c.getContext('2d');
      const X = x => 36 + (x - 32) * k;
      const Y = y => 68 + (y - 60) * k;
      const R = r => r * k;

      const body = a.body, belly = a.belly, accent = a.accent;
      const dark = shade(body, -0.28), light = shade(body, 0.3);

      // Óvalo con volumen: sombra abajo, color base y brillo arriba a la izquierda
      const blob = (cx, cy, rx, ry, col = body) => {
        ellipse(ctx, X(cx), Y(cy), R(rx), R(ry), shade(col, -0.28));
        ellipse(ctx, X(cx) - 0.4, Y(cy) - R(1.2), R(rx) - 1, R(ry) - 1.2, col);
        ellipse(ctx, X(cx - rx * 0.35), Y(cy - ry * 0.42), R(rx * 0.32), R(ry * 0.24), shade(col, 0.3));
      };
      const flat = (cx, cy, rx, ry, col) => ellipse(ctx, X(cx), Y(cy), R(rx), R(ry), col);
      const P = pts => pts.map(([x, y]) => [X(x), Y(y)]);
      const tri = (pts, col) => poly(ctx, P(pts), col);
      const ln = (x0, y0, x1, y1, col, w = 1) => line(ctx, X(x0), Y(y0), X(x1), Y(y1), col, w);

      function eyes(lx, ly, rx, ry) {
        if (back) return;
        const style = a.eyes;
        for (const [ex, ey, side] of [[lx, ly, -1], [rx, ry, 1]]) {
          const x = X(ex), y = Y(ey);
          if (style === 'sleepy') {
            rect(ctx, Math.round(x - 2), Math.round(y), 4, 1, '#2a1a14');
            rect(ctx, Math.round(x - 2), Math.round(y - 1), 1, 1, '#2a1a14');
            rect(ctx, Math.round(x + 1), Math.round(y - 1), 1, 1, '#2a1a14');
          } else if (style === 'big' || style === 'frog') {
            ellipse(ctx, x, y, 3.2 * Math.min(k, 1.1), 3.4 * Math.min(k, 1.1), '#ffffff');
            ellipse(ctx, x + side * 0.4, y + 0.6, 1.9, 2.2, '#1e1420');
            rect(ctx, Math.round(x - 1), Math.round(y - 1), 1, 1, '#ffffff');
          } else {
            ellipse(ctx, x, y, 1.9, 2.6, '#1e1420');
            rect(ctx, Math.round(x - 1), Math.round(y - 2), 1, 1, '#ffffff');
            if (style === 'fierce') line(ctx, x - 3 * side, y - 4, x + 2 * side, y - 2.4, '#1e1420');
          }
        }
      }

      function ears(hx, hy, hr) {
        const e = a.ears;
        if (e === 'fox' || e === 'bat') {
          const t = e === 'bat' ? 12 : 9;
          tri([[hx - hr + 1, hy - 3], [hx - hr + 1, hy - hr - t + 2], [hx - 2, hy - hr + 2]], dark);
          tri([[hx + hr - 1, hy - 3], [hx + hr - 1, hy - hr - t + 2], [hx + 2, hy - hr + 2]], dark);
          tri([[hx - hr + 2, hy - 4], [hx - hr + 2, hy - hr - t + 5], [hx - 3, hy - hr + 2]], back ? body : accent === '#ffd23f' ? '#ffe9a8' : shade(accent, 0.2));
          tri([[hx + hr - 2, hy - 4], [hx + hr - 2, hy - hr - t + 5], [hx + 3, hy - hr + 2]], back ? body : accent === '#ffd23f' ? '#ffe9a8' : shade(accent, 0.2));
        } else if (e === 'round') {
          blob(hx - hr + 2, hy - hr + 2, 4.5, 4.5);
          blob(hx + hr - 2, hy - hr + 2, 4.5, 4.5);
          if (!back) { flat(hx - hr + 2, hy - hr + 2.5, 2.4, 2.4, accent); flat(hx + hr - 2, hy - hr + 2.5, 2.4, 2.4, accent); }
        } else if (e === 'long') {
          tri([[hx - 7, hy - hr + 4], [hx - 13, hy - hr - 12], [hx - 2, hy - hr + 2]], body);
          tri([[hx + 7, hy - hr + 4], [hx + 13, hy - hr - 12], [hx + 2, hy - hr + 2]], body);
          tri([[hx - 11, hy - hr - 6], [hx - 13, hy - hr - 12], [hx - 8, hy - hr - 7]], '#2a1a14');
          tri([[hx + 11, hy - hr - 6], [hx + 13, hy - hr - 12], [hx + 8, hy - hr - 7]], '#2a1a14');
        } else if (e === 'horns') {
          tri([[hx - 7, hy - hr + 3], [hx - 9, hy - hr - 7], [hx - 3, hy - hr + 1]], accent);
          tri([[hx + 7, hy - hr + 3], [hx + 9, hy - hr - 7], [hx + 3, hy - hr + 1]], accent);
        } else if (e === 'fins') {
          tri([[hx - hr + 1, hy], [hx - hr - 7, hy - 6], [hx - hr - 4, hy + 4]], shade(body, 0.2));
          tri([[hx + hr - 1, hy], [hx + hr + 7, hy - 6], [hx + hr + 4, hy + 4]], shade(body, 0.2));
        } else if (e === 'antenna') {
          ln(hx - 4, hy - hr + 2, hx - 9, hy - hr - 8, '#2a1a14');
          ln(hx + 4, hy - hr + 2, hx + 9, hy - hr - 8, '#2a1a14');
          flat(hx - 9, hy - hr - 9, 2.2, 2.2, accent);
          flat(hx + 9, hy - hr - 9, 2.2, 2.2, accent);
        }
      }

      function tail(tx, ty, dir = 1) {
        const t = a.tail;
        if (t === 'flame') {
          ln(tx, ty, tx + 8 * dir, ty - 10, body, 4);
          tri([[tx + 4 * dir, ty - 12], [tx + 9 * dir, ty - 26], [tx + 15 * dir, ty - 12], [tx + 9 * dir, ty - 6]], '#e0412f');
          tri([[tx + 6 * dir, ty - 12], [tx + 9 * dir, ty - 22], [tx + 13 * dir, ty - 12], [tx + 9 * dir, ty - 8]], accent);
        } else if (t === 'leaf') {
          ln(tx, ty, tx + 8 * dir, ty - 6, accent, 2);
          tri([[tx + 6 * dir, ty - 6], [tx + 14 * dir, ty - 18], [tx + 18 * dir, ty - 8], [tx + 12 * dir, ty - 2]], '#3f9a3a');
        } else if (t === 'thin') {
          for (let i = 0; i < 9; i++) flat(tx + i * 1.6 * dir, ty - Math.sin(i / 2.4) * 8, 1.2, 1.2, accent);
        } else if (t === 'curl') {
          blob(tx + 4 * dir, ty - 2, 4, 4);
          blob(tx + 7 * dir, ty - 7, 3, 3);
        } else if (t === 'bolt') {
          tri([[tx, ty], [tx + 8 * dir, ty - 8], [tx + 4 * dir, ty - 9], [tx + 14 * dir, ty - 20], [tx + 6 * dir, ty - 12], [tx + 9 * dir, ty - 11]], shade(accent === '#e0412f' ? '#f2d23a' : accent, -0.1));
        } else if (t === 'feather') {
          tri([[tx - 6, ty - 2], [tx - 10, ty + 8], [tx, ty + 4], [tx + 10, ty + 8], [tx + 6, ty - 2]], dark);
        }
      }

      function mouth(mx, my) {
        if (back) return;
        const x = X(mx), y = Y(my);
        const ex = a.extra;
        if (ex === 'grin') {
          for (let i = -4; i <= 4; i++) rect(ctx, Math.round(x + i), Math.round(y + (i % 2 ? 1 : 0)), 1, 1, '#2a1a14');
          rect(ctx, Math.round(x - 3), Math.round(y + 1), 6, 1, '#ffffff');
        } else if (ex === 'teeth') {
          rect(ctx, Math.round(x - 2), Math.round(y), 4, 1, '#2a1a14');
          rect(ctx, Math.round(x - 1.5), Math.round(y + 1), 3, 2, '#ffffff');
          rect(ctx, Math.round(x), Math.round(y + 1), 1, 2, '#bbbbbb');
        } else if (ex === 'fangs') {
          rect(ctx, Math.round(x - 3), Math.round(y), 6, 1, '#2a1a14');
          rect(ctx, Math.round(x - 3), Math.round(y + 1), 1, 2, '#ffffff');
          rect(ctx, Math.round(x + 2), Math.round(y + 1), 1, 2, '#ffffff');
        } else {
          rect(ctx, Math.round(x - 1), Math.round(y), 1, 1, '#2a1a14');
          rect(ctx, Math.round(x + 1), Math.round(y), 1, 1, '#2a1a14');
          rect(ctx, Math.round(x), Math.round(y + 1), 1, 1, '#2a1a14');
        }
      }

      switch (a.plan) {
        case 'quad': {
          if (!back) tail(42, 46, 1);
          if (a.extra === 'mane') for (let i = 0; i < 9; i++) {
            const ang = Math.PI + (i / 8) * Math.PI;
            tri([[32 + Math.cos(ang) * 9, 30 + Math.sin(ang) * 9], [32 + Math.cos(ang) * 17, 30 + Math.sin(ang) * 15], [32 + Math.cos(ang + 0.3) * 9, 30 + Math.sin(ang + 0.3) * 9]], i % 2 ? accent : '#e0412f');
          }
          if (a.extra === 'bush') { blob(22, 36, 7, 6, '#3f8a30'); blob(42, 36, 7, 6, '#3f8a30'); blob(32, 32, 8, 6, '#4fa83a'); }
          blob(24, 56, 4, 3.5, dark); blob(40, 56, 4, 3.5, dark);
          blob(32, 46, 14, 10);
          if (!back) flat(32, 49, 8, 5.5, belly);
          blob(25, 57, 4, 3); blob(39, 57, 4, 3);
          ears(32, 30, 11);
          blob(32, 30, 12, 11);
          if (!back) {
            flat(32, 36, 5.5, 3.6, belly);
            rect(ctx, Math.round(X(32) - 1), Math.round(Y(34)), 2, 1, '#2a1a14');
            eyes(26, 29, 38, 29);
            mouth(32, 37);
          }
          if (a.extra === 'leaf') {
            ln(32, 19, 32, 15, '#2f7a2a', 2);
            tri([[32, 16], [22, 6], [30, 9]], accent);
            tri([[32, 16], [42, 5], [35, 12]], '#6cd060');
          }
          if (a.extra === 'teeth' && back) { /* nada */ }
          if (back) tail(42, 46, 1);
          break;
        }
        case 'biped': {
          if (a.extra === 'shell') {
            blob(32, 44, 15, 13, accent);
            if (back) for (const [x, y] of [[26, 40], [38, 40], [32, 48], [32, 36]]) flat(x, y, 3.5, 3, shade(accent, 0.25));
          }
          if (!back) tail(42, 52, 1);
          blob(25, 58, 5, 3); blob(39, 58, 5, 3);
          blob(32, 46, 11, 12);
          if (!back) flat(32, 48.5, 7, 8, belly);
          blob(20, 44, 3, 5); blob(44, 44, 3, 5);
          ears(32, 26, 11);
          blob(32, 26, 12, 11);
          if (!back) {
            eyes(27, 25, 37, 25);
            mouth(32, 31);
            if (a.extra === 'cheeks') { flat(23.5, 30, 2.6, 2.2, accent); flat(40.5, 30, 2.6, 2.2, accent); }
          }
          if (back) tail(40, 52, 1);
          break;
        }
        case 'bird': {
          if (a.extra === 'aura') for (let i = 0; i < 26; i++) {
            const ang = (i / 26) * Math.PI * 2;
            flat(32 + Math.cos(ang) * 26, 36 + Math.sin(ang) * 22, 1.3, 1.3, i % 2 ? accent : '#ffffff');
          }
          tail(32, 52);
          if (a.tail === 'bolt') tail(38, 52, 1);
          tri([[22, 36], [6, 42], [10, 48], [4, 52], [16, 52], [24, 48]], dark);
          tri([[42, 36], [58, 42], [54, 48], [60, 52], [48, 52], [40, 48]], dark);
          tri([[22, 38], [10, 44], [16, 47], [24, 46]], a.extra === 'aura' ? accent : body);
          tri([[42, 38], [54, 44], [48, 47], [40, 46]], a.extra === 'aura' ? accent : body);
          ln(29, 55, 28, 60, '#e09020', 2); ln(35, 55, 36, 60, '#e09020', 2);
          blob(32, 44, 12, 12);
          if (!back) flat(32, 47, 8, 8, belly);
          if (a.extra === 'crest' || a.extra === 'aura') {
            tri([[30, 16], [26, 6], [33, 13]], accent);
            tri([[32, 15], [33, 4], [36, 14]], a.extra === 'aura' ? '#ffffff' : accent);
          }
          blob(32, 24, 10, 9);
          if (!back) {
            eyes(27, 23, 37, 23);
            tri([[29, 27], [35, 27], [32, 32]], '#f0a020');
            rect(ctx, Math.round(X(29)), Math.round(Y(27)), Math.round(R(6)), 1, '#c07010');
          }
          break;
        }
        case 'butterfly': {
          for (const s of [-1, 1]) {
            blob(32 + s * 14, 28, 13, 12, accent);
            blob(32 + s * 11, 46, 9, 8, shade(accent, -0.1));
            flat(32 + s * 16, 26, 4, 4, '#ffffff');
            flat(32 + s * 16, 26, 2, 2, body);
            flat(32 + s * 11, 47, 2.5, 2.5, '#ffffff');
          }
          blob(32, 42, 5, 13);
          ears(32, 26, 7);
          blob(32, 26, 7.5, 7);
          eyes(29, 26, 35, 26);
          break;
        }
        case 'bug': {
          blob(52, 52, 6, 5); blob(45, 48, 8, 7);
          if (!back && a.extra === 'spots') { flat(45, 46, 1.5, 1.5, accent); flat(52, 50, 1.3, 1.3, accent); }
          blob(24, 57, 3, 2, dark); blob(36, 57, 3, 2, dark);
          ears(30, 42, 12);
          blob(30, 42, 13, 12);
          if (!back) {
            flat(30, 47, 7, 4.5, belly);
            eyes(25, 40, 35, 40);
            mouth(30, 47);
          }
          break;
        }
        case 'rock': {
          const pts = [];
          for (let i = 0; i < 11; i++) {
            const ang = (i / 11) * Math.PI * 2;
            const r = 16 + (hash(i, 3, 1) - 0.5) * 6;
            pts.push([32 + Math.cos(ang) * r, 42 + Math.sin(ang) * r * 0.9]);
          }
          if (a.extra === 'arms') { blob(13, 46, 5.5, 5); blob(51, 46, 5.5, 5); }
          ears(32, 42, 15);
          tri(pts, dark);
          tri(pts.map(([x, y]) => [x + (32 - x) * 0.08, y + (42 - y) * 0.08 - 1.2]), body);
          tri(pts.slice(5, 9).concat([[32, 42]]).map(([x, y]) => [x + (32 - x) * 0.4, y + (42 - y) * 0.4 - 1]), shade(body, 0.22));
          ln(40, 50, 44, 46, a.accent); ln(44, 46, 43, 42, a.accent); ln(22, 34, 25, 37, a.accent);
          blob(25, 58, 4, 2.5, dark); blob(39, 58, 4, 2.5, dark);
          if (!back) {
            eyes(26, 39, 38, 39);
            rect(ctx, Math.round(X(29)), Math.round(Y(46)), Math.round(R(6)), 1, '#2a1a14');
          }
          break;
        }
        case 'mushroom': {
          blob(26, 58, 4, 2.5); blob(38, 58, 4, 2.5);
          blob(32, 46, 10, 11);
          blob(21, 46, 2.5, 4); blob(43, 46, 2.5, 4);
          ellipse(ctx, X(32), Y(29), R(20), R(13), shade(accent, -0.3), Y(31));
          ellipse(ctx, X(32), Y(28), R(19), R(12), accent, Y(30));
          ellipse(ctx, X(26), Y(22), R(6), R(3), shade(accent, 0.25), Y(30));
          flat(32, 31, 15, 2.5, shade(body, -0.15));
          for (const [x, y, r] of [[24, 24, 3], [36, 21, 3.5], [43, 27, 2.5], [29, 17, 2], [18, 28, 2]]) flat(x, y, r, r * 0.8, '#ffffff');
          if (!back) {
            flat(32, 49, 6, 6, belly);
            eyes(28, 41, 36, 41);
            mouth(32, 46);
          }
          break;
        }
        case 'ghost': {
          const hem = [[17, 30], [47, 30], [45, 48], [41, 55], [37, 50], [32, 57], [27, 50], [23, 55], [19, 48]];
          tri(hem.map(([x, y]) => [x, y + 1]), dark);
          tri(hem, body);
          blob(12, 36, 4, 5); blob(52, 36, 4, 5);
          ears(32, 28, 14);
          blob(32, 28, 15, 14);
          ellipse(ctx, X(27), Y(22), R(5), R(3), shade(body, 0.3));
          if (!back) {
            eyes(26, 27, 38, 27);
            mouth(32, 36);
          }
          break;
        }
        case 'frog': {
          blob(14, 52, 6, 4); blob(50, 52, 6, 4);
          blob(32, 46, 17, 11);
          if (!back) flat(32, 49, 10, 6.5, belly);
          blob(24, 57, 4.5, 2.5); blob(40, 57, 4.5, 2.5);
          blob(32, 37, 14, 9);
          blob(23, 28, 5.5, 5.5); blob(41, 28, 5.5, 5.5);
          if (a.extra === 'spots') for (const [x, y] of [[20, 44], [44, 42], [38, 50], [26, 51]]) flat(x, y, 1.8, 1.5, a.accent);
          if (!back) {
            eyes(23, 28, 41, 28);
            line(ctx, X(23), Y(40), X(41), Y(40), '#2a1a14');
            rect(ctx, Math.round(X(23)), Math.round(Y(39)), 1, 1, '#2a1a14');
            rect(ctx, Math.round(X(41)), Math.round(Y(39)), 1, 1, '#2a1a14');
          }
          break;
        }
        case 'bat': {
          const wing = s => [[32 + s * 6, 34], [32 + s * 28, 20], [32 + s * 24, 31], [32 + s * 29, 42], [32 + s * 20, 40], [32 + s * 17, 48], [32 + s * 7, 42]];
          tri(wing(-1), dark); tri(wing(1), dark);
          tri(wing(-1).map(([x, y]) => [x + (x < 32 ? 1 : -1), y + 1.5]), shade(a.accent, -0.35));
          tri(wing(1).map(([x, y]) => [x + (x < 32 ? 1 : -1), y + 1.5]), shade(a.accent, -0.35));
          blob(28, 56, 2.5, 2, dark); blob(36, 56, 2.5, 2, dark);
          ears(32, 38, 10);
          blob(32, 38, 10, 11);
          if (!back) {
            flat(32, 43, 6, 5, belly);
            eyes(28, 35, 36, 35);
            mouth(32, 41);
          }
          break;
        }
      }
      return outline(c, shade(body, -0.65));
    });
  }

  // Versión en miniatura (para menús) como data URL
  // Versión pequeña (≈28 px) para la criatura que te sigue por el mapa
  function creatureMini(id, view = 'front') {
    return cached(`mini-${id}-${view}`, () => {
      const src = creature(id, view);
      const k = 0.4 * (SPECIES[id].art.size || 1);
      const w = Math.round(src.width * k), h = Math.round(src.height * k);
      const c = makeCanvas(w, h);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, w, h);
      // Bordes nítidos: sin píxeles semitransparentes
      const img = ctx.getImageData(0, 0, w, h);
      for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 110 ? 255 : 0;
      ctx.putImageData(img, 0, 0);
      return c;
    });
  }

  function creatureIcon(id) {
    return cached(`icon-${id}`, () => creature(id, 'front').toDataURL());
  }

  /* ══════════════════════════════════════
     PERSONAJES (16×18 con borde)
  ══════════════════════════════════════ */
  const HEADS = {
    cap: {
      down: ['...cccccc...', '..cccccccc..', '..cCCCCCCc..', '.cccccccccc.', '..hkkkkkkh..', '..kkekkekk..', '..kkkkkkkk..', '...kkkkkk...'],
      up:   ['...cccccc...', '..cccccccc..', '..cccccccc..', '..cccccccc..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '...kkkkkk...'],
      left: ['...cccccc...', '..cccccccc..', 'cccccccccc..', '...ccccccc..', '...kkkkhhh..', '..kekkkhhh..', '..kkkkkhh...', '...kkkkk....'],
    },
    short: {
      down: ['...hhhhhh...', '..hhhhhhhh..', '.hhhhhhhhhh.', '.hhkkkkkkhh.', '..kkkkkkkk..', '..kkekkekk..', '..kkkkkkkk..', '...kkkkkk...'],
      up:   ['...hhhhhh...', '..hhhhhhhh..', '.hhhhhhhhhh.', '.hhhhhhhhhh.', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '...kkkkkk...'],
      left: ['...hhhhhh...', '..hhhhhhhh..', '..hhhhhhhhh.', '..hkkkkhhhh.', '..kkkkkhhh..', '..kekkkhhh..', '..kkkkkhh...', '...kkkkk....'],
    },
    long: {
      down: ['...hhhhhh...', '..hhhhhhhh..', '.hhhhhhhhhh.', '.hhkkkkkkhh.', '.hhkkkkkkhh.', '.hkkekkekkh.', '.hhkkkkkkhh.', '.hh.kkkk.hh.'],
      up:   ['...hhhhhh...', '..hhhhhhhh..', '.hhhhhhhhhh.', '.hhhhhhhhhh.', '.hhhhhhhhhh.', '.hhhhhhhhhh.', '.hhhhhhhhhh.', '.hh.kkkk.hh.'],
      left: ['...hhhhhh...', '..hhhhhhhh..', '..hhhhhhhhh.', '..hkkkkhhhh.', '..kkkkkhhhh.', '..kekkkhhhh.', '..kkkkkhhhh.', '...kkkkkhh..'],
    },
    bald: {
      down: ['............', '...kkkkkk...', '..kkkkkkkk..', '.hkkkkkkkkh.', '.hkkkkkkkkh.', '..kkekkekk..', '..kkkkkkkk..', '...kkkkkk...'],
      up:   ['............', '...kkkkkk...', '..kkkkkkkk..', '.hkkkkkkkkh.', '.hhhhhhhhhh.', '..hhhhhhhh..', '..kkkkkkkk..', '...kkkkkk...'],
      left: ['............', '...kkkkkk...', '..kkkkkkkk..', '..kkkkkkkhh.', '..kkkkkkhh..', '..kekkkkhh..', '..kkkkkkk...', '...kkkkk....'],
    },
  };
  const BODY = {
    front: ['..ssssssss..', '.kssssssssk.', '.kssSSSSssk.', '..ssssssss..', '..pppppppp..'],
    side:  ['...ssssss...', '...sksSss...', '...ssSSss...', '...ssssss...', '...pppppp...'],
  };
  const LEGS = {
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

  // look: { head, c (gorra), C (visera), h (pelo), k (piel), s, S (ropa), p (pantalón), b (calzado) }
  function character(look, dir, frame) {
    const key = `ch-${JSON.stringify(look)}-${dir}-${frame}`;
    return cached(key, () => {
      if (dir === 'right') return flip(character(look, 'left', frame));
      const side = dir === 'left';
      const pal = { c: look.c, C: look.C || shade(look.c || '#888888', -0.25), h: look.h, k: look.k || '#f6cfa4', e: '#2a1a14', s: look.s, S: look.S || shade(look.s, -0.22), p: look.p, b: look.b || '#3a2a20' };
      const rows = [...HEADS[look.head][dir], ...(side ? BODY.side : BODY.front), ...(side ? LEGS.side : LEGS.front)[frame]];
      return outline(pixmap(rows, pal), 'rgba(30,20,20,0.75)');
    });
  }

  /* ══════════════════════════════════════
     TILES (16×16)
  ══════════════════════════════════════ */
  const PAL = {
    grass: '#8fd46a', grass2: '#7cc25a', grass3: '#a8e47e',
    tall: '#4fa83a', tall2: '#3a8a2c', tall3: '#6cc04a',
    path: '#ecd9a6', path2: '#dcc28a', path3: '#f6e8c0',
    sand: '#f2e2a8', sand2: '#e2cd88',
    water: '#5ab0f0', water2: '#8fd0ff', water3: '#3a8ad0',
    trunk: '#7a4a2a', leaf: '#3f9a3a', leaf2: '#2f7a2c', leaf3: '#6cc04a',
    cave: '#b89a72', cave2: '#9c7e58', caveWall: '#6e5640', caveWall2: '#4e3c2c',
    floor: '#e8c890', floor2: '#d4ae70', wall: '#f4ecd8', wall2: '#d8ccb0',
  };

  function grassBase(ctx, tx, ty) {
    rect(ctx, 0, 0, 16, 16, PAL.grass);
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(hash(tx, ty, i) * 14), y = Math.floor(hash(tx, ty, i + 9) * 14);
      rect(ctx, x, y, 1, 2, i % 2 ? PAL.grass2 : PAL.grass3);
    }
  }

  function tile(type, tx, ty, frame = 0) {
    // Los tiles con variaciones por posición se cachean por variante (4)
    const v = Math.floor(hash(tx, ty, 77) * 4);
    return cached(`t-${type}-${v}-${frame}`, () => {
      const c = makeCanvas(16, 16);
      const ctx = c.getContext('2d');
      const vx = v * 3 + 1, vy = v * 5 + 2;
      switch (type) {
        case 'grass': grassBase(ctx, vx, vy); break;
        case 'tall':
          rect(ctx, 0, 0, 16, 16, PAL.tall);
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
              const x = col * 4 + (row ? 2 : 0), y = row * 8 + 1;
              rect(ctx, x, y + 2, 1, 5, PAL.tall2); rect(ctx, x + 1, y, 1, 7, PAL.tall3); rect(ctx, x + 2, y + 3, 1, 4, PAL.tall2);
            }
          }
          break;
        case 'path':
          rect(ctx, 0, 0, 16, 16, PAL.path);
          for (let i = 0; i < 4; i++) rect(ctx, Math.floor(hash(vx, vy, i) * 14), Math.floor(hash(vx, vy, i + 5) * 15), 2, 1, i % 2 ? PAL.path2 : PAL.path3);
          break;
        case 'sand':
          rect(ctx, 0, 0, 16, 16, PAL.sand);
          for (let i = 0; i < 5; i++) rect(ctx, Math.floor(hash(vx, vy, i + 30) * 15), Math.floor(hash(vx, vy, i + 40) * 15), 1, 1, PAL.sand2);
          break;
        case 'water':
          rect(ctx, 0, 0, 16, 16, PAL.water);
          for (let i = 0; i < 3; i++) {
            const y = (i * 5 + frame * 2) % 16;
            const x = (i * 6 + v * 3) % 12;
            rect(ctx, x, y, 4, 1, PAL.water2);
            rect(ctx, x + 1, y + 1, 2, 1, PAL.water3);
          }
          break;
        case 'flowers':
          grassBase(ctx, vx, vy);
          for (const [x, y, col] of [[3, 3, '#f4f4f4'], [10, 5, '#f26a7a'], [5, 10, '#f2d23a'], [12, 12, '#f4f4f4']]) {
            const dy = frame && (x + y) % 2 ? 1 : 0;
            rect(ctx, x - 1, y + dy, 3, 1, col); rect(ctx, x, y - 1 + dy, 1, 3, col); rect(ctx, x, y + dy, 1, 1, '#f2b020');
          }
          break;
        case 'tree': {
          grassBase(ctx, vx, vy);
          rect(ctx, 6, 11, 4, 5, PAL.trunk);
          rect(ctx, 6, 11, 1, 5, '#9a6a3a');
          ellipse(ctx, 8, 7, 8, 7.5, PAL.leaf2);
          ellipse(ctx, 8, 6.5, 7, 6.5, PAL.leaf);
          ellipse(ctx, 6, 4.5, 3.5, 2.5, PAL.leaf3);
          rect(ctx, 10, 8, 2, 1, PAL.leaf2); rect(ctx, 4, 9, 2, 1, PAL.leaf2);
          break;
        }
        case 'ledge':
          grassBase(ctx, vx, vy);
          rect(ctx, 0, 10, 16, 3, '#5a9a3a');
          rect(ctx, 0, 13, 16, 3, '#3f7a2a');
          rect(ctx, 0, 10, 16, 1, '#a8e47e');
          break;
        case 'fence':
          grassBase(ctx, vx, vy);
          rect(ctx, 0, 5, 16, 2, '#c08a50'); rect(ctx, 0, 10, 16, 2, '#c08a50');
          rect(ctx, 2, 3, 3, 11, '#a06a3a'); rect(ctx, 11, 3, 3, 11, '#a06a3a');
          rect(ctx, 2, 3, 3, 1, '#d8a870'); rect(ctx, 11, 3, 3, 1, '#d8a870');
          break;
        case 'sign':
          grassBase(ctx, vx, vy);
          rect(ctx, 7, 9, 2, 7, '#7a4a2a');
          rect(ctx, 2, 2, 12, 8, '#7a4a2a'); rect(ctx, 3, 3, 10, 6, '#c08a50');
          rect(ctx, 4, 4, 8, 1, '#7a4a2a'); rect(ctx, 4, 6, 6, 1, '#7a4a2a');
          break;
        case 'rock':
          grassBase(ctx, vx, vy);
          ellipse(ctx, 8, 9, 7, 6, '#6e6a62');
          ellipse(ctx, 7.5, 8, 6, 5, '#a09a90');
          ellipse(ctx, 6, 6.5, 2.5, 1.5, '#c8c2b8');
          break;
        case 'cave':
          rect(ctx, 0, 0, 16, 16, PAL.cave);
          for (let i = 0; i < 5; i++) rect(ctx, Math.floor(hash(vx, vy, i + 50) * 14), Math.floor(hash(vx, vy, i + 60) * 14), 2, 2, PAL.cave2);
          break;
        case 'cavewall':
          rect(ctx, 0, 0, 16, 16, PAL.caveWall);
          rect(ctx, 0, 12, 16, 4, PAL.caveWall2);
          for (let i = 0; i < 4; i++) rect(ctx, Math.floor(hash(vx, vy, i + 70) * 13), Math.floor(hash(vx, vy, i + 80) * 10), 3, 2, '#8a6e52');
          break;
        case 'boulder':
          rect(ctx, 0, 0, 16, 16, PAL.cave);
          ellipse(ctx, 8, 9, 7.5, 6.5, '#5a4a3a');
          ellipse(ctx, 7.5, 8, 6.5, 5.5, '#8a7a66');
          ellipse(ctx, 6, 6, 2.5, 1.5, '#b0a088');
          break;
        case 'floor':
          rect(ctx, 0, 0, 16, 16, PAL.floor);
          rect(ctx, 0, 7, 16, 1, PAL.floor2); rect(ctx, 0, 15, 16, 1, PAL.floor2);
          rect(ctx, (v * 4) % 16, 0, 1, 7, PAL.floor2); rect(ctx, (v * 4 + 8) % 16, 8, 1, 7, PAL.floor2);
          break;
        case 'gymfloor':
          rect(ctx, 0, 0, 16, 16, (tx + ty) % 2 ? '#c8c0d8' : '#b0a8c8');
          rect(ctx, 0, 0, 16, 1, '#e0d8f0');
          break;
        case 'carpet':
          rect(ctx, 0, 0, 16, 16, '#d8584a');
          rect(ctx, 1, 1, 14, 14, '#e8746a');
          break;
        case 'wall':
          rect(ctx, 0, 0, 16, 16, PAL.wall);
          rect(ctx, 0, 12, 16, 4, '#b89a72');
          rect(ctx, 0, 12, 16, 1, '#8a6e52');
          for (let x = 2; x < 16; x += 6) rect(ctx, x, 2, 1, 9, PAL.wall2);
          break;
        case 'counter':
          rect(ctx, 0, 0, 16, 16, PAL.floor);
          rect(ctx, 0, 2, 16, 12, '#c0784a');
          rect(ctx, 0, 2, 16, 3, '#e8a070');
          rect(ctx, 0, 13, 16, 1, '#8a4a2a');
          break;
        case 'shelf':
          rect(ctx, 0, 0, 16, 16, '#8a5a34');
          for (const y of [2, 7, 12]) {
            rect(ctx, 1, y, 14, 4, '#5a381e');
            for (let x = 2; x < 14; x += 2) rect(ctx, x, y, 1, 4, ['#d8433a', '#4a8ad8', '#e8c040', '#5ab05a'][(x + y + v) % 4]);
          }
          break;
        case 'table':
          rect(ctx, 0, 0, 16, 16, PAL.floor);
          rect(ctx, 1, 3, 14, 9, '#a86a3a'); rect(ctx, 1, 3, 14, 2, '#c8884a');
          rect(ctx, 2, 12, 2, 3, '#7a4a2a'); rect(ctx, 12, 12, 2, 3, '#7a4a2a');
          break;
        case 'pc':
          rect(ctx, 0, 0, 16, 16, PAL.floor);
          rect(ctx, 2, 1, 12, 13, '#8a9ab0'); rect(ctx, 3, 2, 10, 7, '#2a3a5a');
          rect(ctx, 4, 3, 6, 1, '#6af0a0'); rect(ctx, 4, 5, 4, 1, '#6af0a0');
          rect(ctx, 3, 11, 10, 2, '#5a6a80');
          break;
        case 'healer':
          rect(ctx, 0, 0, 16, 16, PAL.floor);
          rect(ctx, 1, 2, 14, 12, '#e8e8f0'); rect(ctx, 1, 2, 14, 2, '#ffffff');
          for (const x of [3, 7, 11]) { ellipse(ctx, x + 1, 9, 1.8, 1.8, '#d8433a'); rect(ctx, x, 9, 3, 1, '#ffffff'); }
          break;
        case 'bed':
          rect(ctx, 0, 0, 16, 16, PAL.floor);
          rect(ctx, 1, 0, 14, 16, '#6a4a8a'); rect(ctx, 2, 1, 12, 4, '#ffffff'); rect(ctx, 2, 6, 12, 9, '#8a6ab8');
          break;
        case 'plant':
          rect(ctx, 0, 0, 16, 16, PAL.floor);
          rect(ctx, 4, 10, 8, 5, '#c0603a'); rect(ctx, 4, 10, 8, 1, '#e0805a');
          ellipse(ctx, 8, 6, 6, 5, '#3f9a3a'); ellipse(ctx, 7, 5, 3, 2, '#6cc04a');
          break;
        case 'mat':
          rect(ctx, 0, 0, 16, 16, PAL.floor);
          rect(ctx, 2, 4, 12, 9, '#4a8ad8'); rect(ctx, 3, 5, 10, 7, '#6aa8f0');
          break;
        case 'cavehole':
          rect(ctx, 0, 0, 16, 16, PAL.cave);
          ellipse(ctx, 8, 9, 7, 5, '#1a120c');
          break;
        case 'void':
          rect(ctx, 0, 0, 16, 16, '#101018');
          break;
        case 'shrine':
          rect(ctx, 0, 0, 16, 16, '#d8d0f0');
          rect(ctx, 0, 0, 16, 1, '#f0ecff');
          rect(ctx, (v * 5) % 14, 6, 2, 2, '#f0e090');
          break;
        default:
          rect(ctx, 0, 0, 16, 16, '#ff00ff');
      }
      return c;
    });
  }

  /* ══════════════════════════════════════
     EDIFICIOS (se dibujan como un único sprite)
  ══════════════════════════════════════ */
  function building(kind) {
    return cached(`bld-${kind}`, () => {
      const def = BUILDING_KINDS[kind];
      const w = def.w * 16, h = def.h * 16;
      const c = makeCanvas(w, h + 8);
      const ctx = c.getContext('2d');
      const roofH = Math.round(h * 0.5);
      const top = 8;
      // Paredes
      rect(ctx, 2, top + roofH - 4, w - 4, h - roofH + 4, def.wall);
      rect(ctx, 2, top + h - 3, w - 4, 3, shade(def.wall, -0.25));
      for (let x = 6; x < w - 4; x += 8) rect(ctx, x, top + roofH, 1, h - roofH - 3, shade(def.wall, -0.1));
      // Tejado
      for (let i = 0; i < roofH + 8; i++) {
        const inset = Math.max(0, Math.floor((roofH + 8 - i) / 4) - 1);
        rect(ctx, inset, i, w - inset * 2, 1, i % 4 === 3 ? shade(def.roof, -0.2) : def.roof);
      }
      rect(ctx, 0, roofH + 6, w, 2, shade(def.roof, -0.35));
      // Puerta
      const dx = def.door * 16;
      rect(ctx, dx + 2, top + h - 15, 12, 15, '#4a3020');
      rect(ctx, dx + 3, top + h - 14, 10, 14, def.doorColor || '#7a4a2a');
      rect(ctx, dx + 10, top + h - 8, 1, 2, '#f2d23a');
      // Ventanas
      for (let x = 0; x < def.w; x++) {
        if (x === def.door || x === 0 || x === def.w - 1) continue;
        if (def.w > 4 && (x === def.door - 1 || x === def.door + 1)) continue;
        rect(ctx, x * 16 + 3, top + h - 14, 10, 8, '#4a3020');
        rect(ctx, x * 16 + 4, top + h - 13, 8, 6, '#9fd8f0');
        rect(ctx, x * 16 + 5, top + h - 12, 2, 2, '#e8f8ff');
      }
      if (def.w <= 4) {
        const wx = def.door === 1 ? w - 14 : 4;
        rect(ctx, wx - 1, top + h - 14, 10, 8, '#4a3020');
        rect(ctx, wx, top + h - 13, 8, 6, '#9fd8f0');
      }
      // Cartel
      if (def.sign) {
        const sx = dx - 4, sy = top + roofH - 1;
        rect(ctx, sx, sy, 24, 10, '#ffffff');
        rect(ctx, sx, sy, 24, 1, '#cccccc');
        ctx.fillStyle = def.signColor;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (def.sign === '+') {
          rect(ctx, sx + 10, sy + 2, 4, 7, def.signColor);
          rect(ctx, sx + 8, sy + 4, 8, 3, def.signColor);
        } else {
          ctx.fillText(def.sign, sx + 12, sy + 5.5);
        }
      }
      return outline(c, 'rgba(40,25,20,0.7)');
    });
  }

  /* ══════════════════════════════════════
     OBJETOS DEL MAPA
  ══════════════════════════════════════ */
  function itemBall() {
    return cached('itemball', () => {
      const c = makeCanvas(10, 10);
      const ctx = c.getContext('2d');
      ellipse(ctx, 5, 5, 5, 5, '#d8433a');
      rect(ctx, 0, 5, 10, 5, '#f4f4f4');
      ellipse(ctx, 5, 5, 5, 5, 'rgba(0,0,0,0)');
      rect(ctx, 0, 4, 10, 2, '#2a1a14');
      rect(ctx, 4, 3, 2, 4, '#2a1a14');
      rect(ctx, 4, 4, 2, 2, '#ffffff');
      return outline(c, 'rgba(30,20,20,0.6)');
    });
  }

  function capsule(open = 0) {
    return cached(`capsule-${open}`, () => {
      const c = makeCanvas(12, 12);
      const ctx = c.getContext('2d');
      ellipse(ctx, 6, 6, 6, 6, '#f4f4f4');
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, 12, 6); ctx.clip();
      ellipse(ctx, 6, 6 - open, 6, 6, '#d8433a');
      ctx.restore();
      rect(ctx, 0, 5, 12, 2, '#2a1a14');
      ellipse(ctx, 6, 6, 2.2, 2.2, '#2a1a14');
      ellipse(ctx, 6, 6, 1.2, 1.2, '#ffffff');
      return outline(c, 'rgba(30,20,20,0.6)');
    });
  }

  return { creature, creatureMini, creatureIcon, character, tile, building, itemBall, capsule, shade, ellipse, rect, makeCanvas, hash };
})();
