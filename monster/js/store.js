'use strict';

/* ══════════════════════════════════════
   GUARDADO · perfiles, partida, fotos y códigos de regalo
══════════════════════════════════════ */
const PROFILES_KEY = 'mh-cajas-perfiles';
const PROFILE_KEY = id => `mh-cajas-p-${id}`;
const FREE_EVERY = 60 * 60 * 1000;   // una caja gratis cada hora
const FREE_MAX = 3;

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } }

function newProfileState(name) {
  return {
    v: 1, name, avatar: null, coins: 300,
    dolls: {}, pets: {}, accs: {},
    free: { n: FREE_MAX, t: Date.now() },
    inv: {},
    daily: { last: null, streak: 0 },
    stats: { opened: 0, coinsEarned: 0, gifts: 0, photos: 0, best: null, wishes: 0 },
    ach: {}, fav: {}, shelf: Array(12).fill(null),
    settings: { freeMode: false, hideMissing: false, shelfOpen: false },
    redeemed: {}, history: [], pity: 0, linesDone: {}, charsDone: {},
  };
}

const Store = {
  profiles: null,
  load() {
    let p = null;
    try { p = JSON.parse(lsGet(PROFILES_KEY)); } catch (e) { p = null; }
    this.profiles = p && Array.isArray(p.list) ? p : { list: [], current: null };
    return this.profiles;
  },
  saveProfiles() { lsSet(PROFILES_KEY, JSON.stringify(this.profiles)); },
  create(name) {
    const id = Math.random().toString(36).slice(2, 9);
    this.profiles.list.push({ id, name });
    this.profiles.current = id;
    this.saveProfiles();
    const s = newProfileState(name);
    lsSet(PROFILE_KEY(id), JSON.stringify(s));
    return s;
  },
  open(id) {
    let s = null;
    try { s = JSON.parse(lsGet(PROFILE_KEY(id))); } catch (e) { s = null; }
    const meta = this.profiles.list.find(p => p.id === id);
    if (!meta) return null;
    if (!s) s = newProfileState(meta.name);
    // Rellena campos que falten en partidas antiguas
    const base = newProfileState(meta.name);
    for (const k of Object.keys(base)) if (s[k] === undefined) s[k] = base[k];
    for (const k of Object.keys(base.stats)) if (s.stats[k] === undefined) s.stats[k] = base.stats[k];
    for (const k of Object.keys(base.settings)) if (s.settings[k] === undefined) s.settings[k] = base.settings[k];
    // Quita objetos que ya no existen en el catálogo
    for (const id2 of Object.keys(s.dolls)) if (!DOLLS[id2]) delete s.dolls[id2];
    for (const id2 of Object.keys(s.pets)) if (!PET_BY_ID[id2]) delete s.pets[id2];
    for (const id2 of Object.keys(s.accs)) if (!ACC_BY_ID[id2]) delete s.accs[id2];
    s.shelf = s.shelf.map(x => (x && DOLLS[x] ? x : null));
    this.profiles.current = id;
    this.saveProfiles();
    return s;
  },
  save(id, s) { return lsSet(PROFILE_KEY(id), JSON.stringify(s)); },
  rename(id, name) { const m = this.profiles.list.find(p => p.id === id); if (m) { m.name = name; this.saveProfiles(); } },
  remove(id) {
    this.profiles.list = this.profiles.list.filter(p => p.id !== id);
    if (this.profiles.current === id) this.profiles.current = this.profiles.list[0]?.id || null;
    lsDel(PROFILE_KEY(id));
    this.saveProfiles();
  },
};

/* ── Fotos reales (IndexedDB, compartidas por todos los perfiles del dispositivo) ── */
const Photos = (() => {
  let db = null;
  const mem = new Map();
  function open() {
    return new Promise(res => {
      if (db) return res(db);
      try {
        const rq = indexedDB.open('mh-cajas', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('photos');
        rq.onsuccess = () => { db = rq.result; res(db); };
        rq.onerror = () => res(null);
      } catch (e) { res(null); }
    });
  }
  async function loadAll() {
    const d = await open();
    if (!d) return mem;
    return new Promise(res => {
      try {
        const tx = d.transaction('photos', 'readonly');
        const st = tx.objectStore('photos');
        const rq = st.openCursor();
        rq.onsuccess = () => {
          const cur = rq.result;
          if (cur) { mem.set(cur.key, cur.value); cur.continue(); } else res(mem);
        };
        rq.onerror = () => res(mem);
      } catch (e) { res(mem); }
    });
  }
  async function put(key, src) {
    mem.set(key, src);
    const d = await open();
    if (!d) return;
    try { d.transaction('photos', 'readwrite').objectStore('photos').put(src, key); } catch (e) { /* solo en memoria */ }
  }
  async function del(key) {
    mem.delete(key);
    const d = await open();
    if (!d) return;
    try { d.transaction('photos', 'readwrite').objectStore('photos').delete(key); } catch (e) { /* nada */ }
  }
  // Reduce una imagen del móvil a un tamaño razonable
  function shrink(file, max = 720) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = rej;
        img.src = fr.result;
      };
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }
  return { loadAll, put, del, shrink, get: k => mem.get(k), has: k => mem.has(k), all: () => mem, count: () => mem.size };
})();

/* ── Códigos de regalo ── */
const Gift = {
  encode(kind, id, shiny) {
    const nonce = Math.random().toString(36).slice(2, 8);
    const raw = `${kind}|${id}|${shiny ? 1 : 0}|${nonce}`;
    const sum = (hashStr(raw) % 1296).toString(36).padStart(2, '0');
    return 'MH-' + btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '-' + sum.toUpperCase();
  },
  decode(code) {
    try {
      const m = code.trim().match(/^MH-([A-Za-z0-9_-]+)-([A-Z0-9]{2})$/);
      if (!m) return null;
      const raw = decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))));
      if ((hashStr(raw) % 1296).toString(36).padStart(2, '0').toUpperCase() !== m[2]) return null;
      const [kind, id, shiny, nonce] = raw.split('|');
      const ok = kind === 'd' ? DOLLS[id] : kind === 'p' ? PET_BY_ID[id] : kind === 'a' ? ACC_BY_ID[id] : kind === 'b' ? BOX_BY_ID[id] : null;
      if (!ok || !nonce) return null;
      return { kind, id, shiny: shiny === '1', nonce };
    } catch (e) { return null; }
  },
};
function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
