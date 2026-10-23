/* ══════════════════════════════════════
   COMBATE EN 3D
   Dibuja con Three.js la misma escena que battle.js describe en `scene`
   (criaturas, entrenadores, ataques, cápsulas, evolución). Si algo falla,
   el juego sigue usando el combate 2D.
══════════════════════════════════════ */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from '../vendor/three/utils/SkeletonUtils.js';

const BASE = new URL('../models/', import.meta.url).href;
const loader = new GLTFLoader();
const cache = new Map();        // url → Promise<gltf>

const TRAINER_MODELS = {
  player: 'jugador', rival: 'dani', prof: 'alisa', leader1: 'petra', leader2: 'volta',
  youngster: 'joven', lass: 'chica', bug: 'cazabichos', hiker: 'montanero', medium: 'medium', engineer: 'ingeniero',
};
const ARENA_STYLE = {
  pradera:         { sky: '#9fd3f0', ground: '#557744', hemi: 1.6, sun: 2.2, fog: '#cfe8f4' },
  bosque:          { sky: '#b8dcb0', ground: '#3f5a30', hemi: 1.5, sun: 1.8, fog: '#c8e4c0' },
  cueva:           { sky: '#2a2018', ground: '#1a120c', hemi: 1.1, sun: 1.4, fog: '#2a2018' },
  gimnasio_roca:   { sky: '#d8ccb8', ground: '#6a5a48', hemi: 1.5, sun: 2.0, fog: '#d8ccb8' },
  gimnasio_voltio: { sky: '#1e2448', ground: '#2a2a40', hemi: 1.3, sun: 1.9, fog: '#1e2448' },
  santuario:       { sky: '#2a2a5a', ground: '#4a3a7a', hemi: 1.4, sun: 1.8, fog: '#3a3a6a' },
};

const url = (group, id) => `${BASE}${group}/${id}.glb`;

function load(u) {
  if (!cache.has(u)) {
    cache.set(u, new Promise((res, rej) => loader.load(u, res, undefined, rej)).catch(err => { cache.delete(u); throw err; }));
  }
  return cache.get(u);
}

/* ── Estado del renderizador ──────── */
let renderer = null, canvas = null, available = true;
let scene3 = null, camera = null, sun = null, hemi = null;
let world = null;            // objetos del combate actual
const clock = new THREE.Clock();

function ensureRenderer() {
  if (renderer || !available) return !!renderer;
  try {
    canvas = document.createElement('canvas');
    canvas.id = 'game3d';
    document.getElementById('screen').insertBefore(canvas, document.getElementById('ui'));
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene3 = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1.5, 0.05, 200);
    hemi = new THREE.HemisphereLight(0xffffff, 0x445533, 1.5);
    sun = new THREE.DirectionalLight(0xfff4e0, 2);
    sun.position.set(-3, 7, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5;
    sun.shadow.bias = -0.0005;
    scene3.add(hemi, sun, sun.target);
    window.addEventListener('resize', resize);
    resize();
    return true;
  } catch (e) {
    console.warn('WebGL no disponible, se usa el combate 2D', e);
    available = false;
    if (canvas) canvas.remove();
    renderer = null;
    return false;
  }
}

function resize() {
  if (!renderer) return;
  const r = document.getElementById('screen').getBoundingClientRect();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
  camera.aspect = r.width / r.height || 1.5;
  camera.updateProjectionMatrix();
}

/* ── Instancias de modelos ────────── */
function instance(gltf, { shadows = true } = {}) {
  const root = cloneSkinned(gltf.scene);
  const mats = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = shadows;
    o.receiveShadow = true;
    o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
    mats.push(...[].concat(o.material));
  });
  const mixer = new THREE.AnimationMixer(root);
  const clips = {};
  for (const c of gltf.animations) clips[c.name] = mixer.clipAction(c);
  if (clips.idle) clips.idle.play();
  return { root, mats, mixer, clips, opacity: 1 };
}

function setOpacity(inst, a) {
  if (inst.opacity === a) return;
  inst.opacity = a;
  for (const m of inst.mats) {
    m.transparent = a < 1;
    m.opacity = a;
    m.depthWrite = a >= 1;
  }
}

function setGlow(inst, color, amount) {
  for (const m of inst.mats) {
    if (!m.emissive) continue;
    m.emissive.set(color);
    m.emissiveIntensity = amount;
  }
}

function dispose(obj) {
  obj.traverse(o => {
    if (o.isMesh) [].concat(o.material).forEach(m => m.dispose());
  });
}

/* ── API ──────────────────────────── */
// Precarga lo necesario para un combate. Devuelve true si todo está listo.
async function prepare({ arena, species = [], trainers = [], balls = [] }) {
  if (!ensureRenderer()) return false;
  const urls = [url('escenarios', arena || 'pradera'), url('entrenadores', 'jugador')];
  for (const s of species) urls.push(url('criaturas', s));
  for (const t of trainers) if (TRAINER_MODELS[t]) urls.push(url('entrenadores', TRAINER_MODELS[t]));
  for (const b of balls) urls.push(url('capsulas', b));
  try {
    await Promise.all(urls.map(load));
    return true;
  } catch (e) {
    console.warn('No se pudo cargar algún modelo 3D', e);
    return false;
  }
}

function preload(list) {
  if (!available) return;
  for (const [group, id] of list) load(url(group, id)).catch(() => {});
}

async function begin(sc) {
  ensureRenderer();
  const arenaId = sc.arena || 'pradera';
  const style = ARENA_STYLE[arenaId] || ARENA_STYLE.pradera;
  const arena = instance(await load(url('escenarios', arenaId)), { shadows: false });
  scene3.background = new THREE.Color(style.sky);
  scene3.fog = new THREE.Fog(style.fog, 14, 40);
  hemi.color.set(0xffffff);
  hemi.groundColor.set(style.ground);
  hemi.intensity = style.hemi;
  sun.intensity = style.sun;
  scene3.add(arena.root);
  arena.root.updateMatrixWorld(true);

  // Zonas de combate marcadas en el escenario
  const zone = name => {
    const m = arena.root.getObjectByName(name);
    if (!m) return null;
    const c = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3());
    return c;
  };
  const me = zone('zone_player_floor') || new THREE.Vector3(0, 0, 1.6);
  const foe = zone('zone_rival_floor') || new THREE.Vector3(0, 0, -1.6);
  // Altura exacta del suelo: el punto más alto de la zona
  const top = name => { const m = arena.root.getObjectByName(name); return m ? new THREE.Box3().setFromObject(m).max.y : 0; };
  me.y = top('zone_player_floor');
  foe.y = top('zone_rival_floor');

  const dir = foe.clone().sub(me).normalize();
  const side = new THREE.Vector3(-dir.z, 0, dir.x);
  const mkSlot = (pos, faceTo) => {
    const g = new THREE.Group();
    g.position.copy(pos);
    g.rotation.y = Math.atan2(faceTo.x - pos.x, faceTo.z - pos.z);
    scene3.add(g);
    return { group: g, inst: null, sp: null };
  };

  world = {
    sc, arena, style, mePos: me, foePos: foe, dir, side,
    me: mkSlot(me, foe), foe: mkSlot(foe, me),
    playerTrainer: null, enemyTrainer: null, enemyLook: null,
    playerOutAt: null, ball: null, ballKind: null, ballOpen: 0,
    proj: [], fx: [], evolveInst: {},
    t0: performance.now(),
  };

  // Entrenador del jugador, de espaldas en su zona
  world.playerTrainer = instance(await load(url('entrenadores', 'jugador')));
  world.playerTrainer.root.position.copy(me).addScaledVector(dir, -0.2).addScaledVector(side, 0.35);
  world.playerTrainer.root.rotation.y = Math.atan2(foe.x - me.x, foe.z - me.z);
  scene3.add(world.playerTrainer.root);

  // Proyectiles y partículas reutilizables
  const sphere = new THREE.SphereGeometry(1, 16, 12);
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2, transparent: true }));
    m.visible = false;
    scene3.add(m);
    world.proj.push(m);
  }
  const box = new THREE.OctahedronGeometry(1, 0);
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1, transparent: true }));
    m.visible = false;
    scene3.add(m);
    world.fx.push(m);
  }
  world.light = new THREE.PointLight(0xffffff, 0, 4);
  scene3.add(world.light);

  // Sombra centrada en la acción
  const mid = me.clone().lerp(foe, 0.5);
  sun.target.position.copy(mid);
  sun.position.copy(mid).add(new THREE.Vector3(-3, 7, 4));

  resize();
  canvas.classList.add('on');
  clock.getDelta();
}

function end() {
  if (!world) return;
  clearEffects();
  scene3.traverse(o => { if (o !== scene3 && o !== hemi && o !== sun && o !== sun.target) o.userData.remove = true; });
  for (const o of [...scene3.children]) if (o.userData.remove) { dispose(o); scene3.remove(o); }
  world = null;
  if (canvas) canvas.classList.remove('on');
}

/* ══════════════════════════════════════
   EFECTOS DE ATAQUE (partículas por tipo)
══════════════════════════════════════ */
const GEO = {};
function geo(kind) {
  if (GEO[kind]) return GEO[kind];
  switch (kind) {
    case 'sphere': GEO[kind] = new THREE.SphereGeometry(1, 12, 8); break;
    case 'octa': GEO[kind] = new THREE.OctahedronGeometry(1, 0); break;
    case 'rock': GEO[kind] = new THREE.DodecahedronGeometry(1, 0); break;
    case 'ring': GEO[kind] = new THREE.TorusGeometry(1, 0.08, 6, 28); break;
    case 'arc': GEO[kind] = new THREE.TorusGeometry(1, 0.12, 6, 20, Math.PI * 0.9); break;
    case 'leaf': {
      const sh = new THREE.Shape();
      sh.moveTo(0, -1); sh.quadraticCurveTo(0.7, 0, 0, 1); sh.quadraticCurveTo(-0.7, 0, 0, -1);
      GEO[kind] = new THREE.ShapeGeometry(sh, 4);
      break;
    }
    case 'cyl': GEO[kind] = new THREE.CylinderGeometry(1, 1, 1, 6, 1); break;
  }
  return GEO[kind];
}

const particles = [];
const emitters = [];

// p: { geo, color, color2, pos, vel, life, size, size2, gravity, drag, spin, glow, opacity, rot }
function particle(p) {
  const glow = p.glow !== false;
  const mat = glow
    ? new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: p.opacity ?? 1, blending: p.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false, side: THREE.DoubleSide })
    : new THREE.MeshStandardMaterial({ color: p.color, transparent: true, opacity: p.opacity ?? 1, roughness: 0.6, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo(p.geo || 'sphere'), mat);
  mesh.position.copy(p.pos);
  if (p.rot) mesh.rotation.copy(p.rot);
  // Las partículas sueltas se agrandan para que se lean bien a la distancia de la cámara
  const mul = p.geo === 'ring' || p.geo === 'arc' ? 1 : 1.7;
  mesh.scale.setScalar((p.size ?? 0.1) * mul);
  scene3.add(mesh);
  particles.push({
    mesh, vel: p.vel ? p.vel.clone() : new THREE.Vector3(), age: 0, life: p.life ?? 0.6,
    size: (p.size ?? 0.1) * mul, size2: (p.size2 ?? p.size ?? 0.1) * mul, gravity: p.gravity ?? 0, drag: p.drag ?? 0,
    spin: p.spin || null, c1: new THREE.Color(p.color), c2: new THREE.Color(p.color2 ?? p.color), op: p.opacity ?? 1,
    scaleXYZ: p.scaleXYZ || null, fadeIn: p.fadeIn || 0,
  });
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i];
    q.age += dt;
    const k = q.age / q.life;
    if (k >= 1) {
      scene3.remove(q.mesh);
      q.mesh.material.dispose();
      particles.splice(i, 1);
      continue;
    }
    q.vel.y -= q.gravity * dt;
    if (q.drag) q.vel.multiplyScalar(Math.max(0, 1 - q.drag * dt));
    q.mesh.position.addScaledVector(q.vel, dt);
    const sz = q.size + (q.size2 - q.size) * k;
    if (q.scaleXYZ) q.mesh.scale.set(sz * q.scaleXYZ[0], sz * q.scaleXYZ[1], sz * q.scaleXYZ[2]);
    else q.mesh.scale.setScalar(Math.max(0.001, sz));
    q.mesh.material.color.copy(q.c1).lerp(q.c2, k);
    const fin = q.fadeIn ? Math.min(1, k / q.fadeIn) : 1;
    q.mesh.material.opacity = q.op * fin * (k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1);
    if (q.spin) { q.mesh.rotation.x += q.spin.x * dt; q.mesh.rotation.y += q.spin.y * dt; q.mesh.rotation.z += q.spin.z * dt; }
  }
  for (let i = emitters.length - 1; i >= 0; i--) {
    const e = emitters[i];
    e.age += dt;
    if (e.update(e.age, dt) === false || e.age > (e.life ?? 3)) emitters.splice(i, 1);
  }
}

function clearEffects() {
  for (const q of particles) { scene3.remove(q.mesh); q.mesh.material.dispose(); }
  particles.length = 0;
  emitters.length = 0;
}

const rnd = (a, b) => a + Math.random() * (b - a);
const jitter = r => new THREE.Vector3(rnd(-r, r), rnd(-r, r), rnd(-r, r));

function burst(at, { color, color2, n = 16, speed = 2.5, size = 0.08, size2 = 0.02, life = 0.5, geoKind = 'sphere', gravity = 0, glow = true, up = 0 }) {
  for (let i = 0; i < n; i++) {
    const v = jitter(1).normalize().multiplyScalar(speed * rnd(0.5, 1));
    v.y += up;
    particle({ geo: geoKind, color, color2, pos: at.clone(), vel: v, life: life * rnd(0.7, 1.2), size, size2, gravity, drag: 2, glow, spin: geoKind === 'sphere' ? null : jitter(8) });
  }
}

function shockwave(at, color, size = 0.9, life = 0.45) {
  particle({ geo: 'ring', color, pos: at.clone().setY(at.y + 0.05), rot: new THREE.Euler(Math.PI / 2, 0, 0), size: 0.15, size2: size, life, opacity: 0.9 });
}

// Lanza un efecto a lo largo del camino a→b durante `dur` segundos
function stream(a, b, dur, rate, spawn) {
  let acc = 0;
  emitters.push({ age: 0, life: dur + 0.05, update(age, dt) {
    acc += dt * rate;
    while (acc >= 1) {
      acc--;
      const t = Math.min(1, age / dur);
      spawn(a.clone().lerp(b, t), t);
    }
    return age < dur;
  } });
}

function later(delay, fn) {
  emitters.push({ age: 0, life: delay + 0.1, update(age) { if (age >= delay) { fn(); return false; } return true; } });
}

function bolt(top, bottom, color) {
  const pts = [top.clone()];
  const n = 7;
  for (let i = 1; i < n; i++) {
    const p = top.clone().lerp(bottom, i / n);
    p.x += rnd(-0.25, 0.25); p.z += rnd(-0.25, 0.25);
    pts.push(p);
  }
  pts.push(bottom.clone());
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const mid = a.clone().lerp(b, 0.5);
    const len = a.distanceTo(b);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    for (const [w, op, col] of [[0.035, 1, 0xffffff], [0.11, 0.55, color]]) {
      const mesh = new THREE.Mesh(geo('cyl'), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
      mesh.position.copy(mid);
      mesh.quaternion.copy(q);
      mesh.scale.set(w, len, w);
      scene3.add(mesh);
      particles.push({ mesh, vel: new THREE.Vector3(), age: 0, life: 0.35, size: 1, size2: 1, gravity: 0, drag: 0, spin: null, c1: new THREE.Color(col), c2: new THREE.Color(col), op, scaleXYZ: [w, len, w], fadeIn: 0 });
    }
  }
}

const TYPE_COLORS = {
  normal: [0xffffff, 0xd8d4c0], fuego: [0xffd23f, 0xe0412f], agua: [0x8fd8ff, 0x2f7ad8], planta: [0x8fe060, 0x2f8a2a],
  electrico: [0xfff6a0, 0xf2c020], roca: [0xb8a888, 0x6e5a40], volador: [0xffffff, 0xa98ff3], bicho: [0xd8f060, 0x7a9a1a],
  veneno: [0xd88ae0, 0x7a2a8a], fantasma: [0xb090f0, 0x3a2058],
};

function attackEffect(a) {
  const att = a.from === 'me' ? world.me : world.foe;
  const def = a.from === 'me' ? world.foe : world.me;
  const from = chest(att), to = chest(def);
  const ground = def.group.position.clone();
  const [c1, c2] = TYPE_COLORS[a.type] || TYPE_COLORS.normal;
  const dirv = to.clone().sub(from).normalize();

  if (a.cat === 'status') {
    // Aura alrededor del usuario y, si afecta al rival, polvo que viaja hacia él
    const base = att.group.position.clone();
    for (let i = 0; i < 3; i++) later(i * 0.12, () => particle({ geo: 'ring', color: c1, color2: c2, pos: base.clone().setY(base.y + 0.1), vel: new THREE.Vector3(0, 1.3, 0), rot: new THREE.Euler(Math.PI / 2, 0, 0), size: 0.55, size2: 0.25, life: 0.6 }));
    if (a.targetFoe) stream(from, to, 0.5, 40, p => particle({ color: c1, color2: c2, pos: p.add(jitter(0.25)), vel: jitter(0.4), size: 0.05, size2: 0.02, life: 0.5 }));
    return;
  }

  if (a.cat === 'phys') {
    // Impacto al final de la embestida
    later(0.17, () => {
      burst(to, { color: c1, color2: c2, n: 18, speed: 3, size: 0.09, life: 0.4, geoKind: a.type === 'roca' ? 'rock' : 'octa', glow: a.type !== 'roca' });
      shockwave(ground, c1, 1.0);
      if (a.type === 'fuego') burst(to, { color: 0xffd23f, color2: 0xe0412f, n: 22, speed: 1.5, size: 0.14, size2: 0.02, life: 0.6, up: 1.2 });
      if (a.type === 'electrico') bolt(to.clone().add(new THREE.Vector3(0, 2.2, 0)), to, c2);
      if (a.type === 'agua') burst(to, { color: 0x8fd8ff, n: 20, speed: 2.2, size: 0.06, life: 0.7, gravity: 6, glow: false, up: 2 });
    });
    return;
  }

  const D = 0.62;   // duración del viaje (coincide con battle.js)
  switch (a.type) {
    case 'fuego':
      stream(from, to, D, 90, (p, t) => particle({ color: 0xfff0a0, color2: 0xe0412f, pos: p.add(jitter(0.08 + t * 0.1)), vel: dirv.clone().multiplyScalar(1.2).add(jitter(0.5)).add(new THREE.Vector3(0, 0.6, 0)), size: 0.1 + t * 0.08, size2: 0.02, life: 0.45 }));
      later(D, () => { burst(to, { color: 0xffd23f, color2: 0xe0412f, n: 34, speed: 2.2, size: 0.16, size2: 0.02, life: 0.7, up: 1.5 }); shockwave(ground, 0xff8a3a, 1.2); });
      break;
    case 'agua':
      stream(from, to, D, 80, (p, t) => particle({ color: 0xffffff, color2: 0x3a8ad8, pos: p.add(jitter(0.05)).setY(p.y + Math.sin(t * Math.PI) * 0.35), vel: jitter(0.3), size: 0.07, size2: 0.03, life: 0.35, glow: t < 0.5 }));
      later(D, () => {
        burst(to, { color: 0xbfe8ff, color2: 0x3a8ad8, n: 30, speed: 2, size: 0.07, life: 0.9, gravity: 7, glow: false, up: 2.5 });
        shockwave(ground, 0x8fd8ff, 1.3, 0.6);
      });
      break;
    case 'planta':
      for (let i = 0; i < 8; i++) later(i * 0.05, () => {
        const start = from.clone().add(jitter(0.3));
        const v = to.clone().add(jitter(0.3)).sub(start).multiplyScalar(1 / (D - 0.1));
        v.y += 0.8;
        particle({ geo: 'leaf', color: i % 2 ? 0x8fe060 : 0x4fa83a, pos: start, vel: v, size: 0.12, size2: 0.1, life: D - 0.05, glow: false, gravity: 2.6, spin: new THREE.Vector3(9, 12, 6) });
      });
      later(D, () => burst(to, { color: 0x8fe060, color2: 0x2f8a2a, n: 14, speed: 2, size: 0.1, size2: 0.06, life: 0.6, geoKind: 'leaf', glow: false, gravity: 2 }));
      break;
    case 'electrico':
      stream(from, to, D * 0.5, 60, p => particle({ geo: 'octa', color: 0xfff6a0, pos: p.add(jitter(0.15)), vel: jitter(1.5), size: 0.05, size2: 0.01, life: 0.25, spin: jitter(10), add: true }));
      later(D * 0.45, () => bolt(ground.clone().add(new THREE.Vector3(rnd(-0.2, 0.2), 3.2, rnd(-0.2, 0.2))), to, 0xf2c020));
      later(D * 0.62, () => bolt(ground.clone().add(new THREE.Vector3(rnd(-0.3, 0.3), 3.2, rnd(-0.3, 0.3))), to, 0xfff6a0));
      later(D * 0.62, () => { burst(to, { color: 0xffffff, color2: 0xf2c020, n: 26, speed: 3.4, size: 0.05, life: 0.4, geoKind: 'octa' }); shockwave(ground, 0xfff6a0, 1.1); });
      break;
    case 'roca':
      for (let i = 0; i < 6; i++) later(i * 0.07, () => {
        const p = ground.clone().add(new THREE.Vector3(rnd(-0.6, 0.6), 2.8 + rnd(0, 0.8), rnd(-0.6, 0.6)));
        particle({ geo: 'rock', color: i % 2 ? 0x9a8f80 : 0x7d7466, pos: p, vel: new THREE.Vector3(0, -2, 0), size: rnd(0.12, 0.2), life: 0.65, gravity: 9, glow: false, spin: jitter(6) });
      });
      later(D * 0.8, () => { burst(ground.clone().setY(ground.y + 0.2), { color: 0xc8b898, color2: 0x6e5a40, n: 20, speed: 2, size: 0.06, life: 0.6, geoKind: 'rock', glow: false, gravity: 6, up: 1.5 }); shockwave(ground, 0xc8b898, 1.4, 0.5); });
      break;
    case 'volador':
      for (let i = 0; i < 3; i++) later(i * 0.12, () => {
        const v = dirv.clone().multiplyScalar(7);
        particle({ geo: 'arc', color: 0xffffff, color2: 0xa98ff3, pos: from.clone().add(jitter(0.2)), vel: v, rot: new THREE.Euler(0, Math.atan2(dirv.x, dirv.z), rnd(-0.6, 0.6)), size: 0.3, size2: 0.45, life: 0.55 });
      });
      stream(from, to, D, 50, p => particle({ color: 0xffffff, pos: p.add(jitter(0.4)), vel: dirv.clone().multiplyScalar(3), size: 0.03, size2: 0.01, life: 0.3, opacity: 0.7 }));
      later(D, () => burst(to, { color: 0xffffff, color2: 0xa98ff3, n: 18, speed: 2.8, size: 0.06, life: 0.4 }));
      break;
    case 'bicho':
      stream(from, to, D, 70, (p, t) => {
        const off = new THREE.Vector3(Math.sin(t * 30) * 0.3, Math.cos(t * 26) * 0.25, Math.sin(t * 22) * 0.3);
        particle({ geo: 'octa', color: 0xd8f060, color2: 0x7a9a1a, pos: p.add(off), vel: jitter(1.2), size: 0.05, size2: 0.02, life: 0.4, spin: jitter(12) });
      });
      later(D, () => burst(to, { color: 0xd8f060, color2: 0x7a9a1a, n: 22, speed: 2.4, size: 0.05, life: 0.5, geoKind: 'octa' }));
      break;
    case 'veneno':
      emitters.push({ age: 0, life: D + 0.05, update(age) {
        const t = Math.min(1, age / D);
        const p = from.clone().lerp(to, t);
        p.y += Math.sin(t * Math.PI) * 0.8;
        particle({ color: 0xd88ae0, color2: 0x7a2a8a, pos: p.add(jitter(0.06)), size: 0.16, size2: 0.05, life: 0.25, glow: false, opacity: 0.85 });
        return age < D;
      } });
      later(D, () => {
        burst(to, { color: 0xd88ae0, color2: 0x7a2a8a, n: 24, speed: 1.8, size: 0.09, size2: 0.04, life: 0.8, glow: false, gravity: 4, up: 1.6 });
        for (let i = 0; i < 8; i++) particle({ color: 0xe8b0f0, pos: ground.clone().add(new THREE.Vector3(rnd(-0.5, 0.5), 0.1, rnd(-0.5, 0.5))), vel: new THREE.Vector3(0, rnd(0.5, 1.2), 0), size: 0.06, size2: 0.12, life: 0.8, glow: false, opacity: 0.6 });
      });
      break;
    case 'fantasma':
      emitters.push({ age: 0, life: D + 0.05, update(age) {
        const t = Math.min(1, age / D);
        const p = from.clone().lerp(to, t * t);
        p.y += Math.sin(age * 18) * 0.12;
        particle({ color: 0x3a2058, color2: 0x000000, pos: p.clone(), size: 0.22, size2: 0.08, life: 0.18, glow: false, opacity: 0.8 });
        particle({ color: 0xb090f0, pos: p.add(jitter(0.25)), vel: jitter(0.6), size: 0.04, size2: 0.01, life: 0.4 });
        return age < D;
      } });
      later(D, () => {
        for (let i = 0; i < 3; i++) later(i * 0.08, () => particle({ geo: 'ring', color: 0xb090f0, color2: 0x3a2058, pos: to.clone(), rot: new THREE.Euler(rnd(0, 3), rnd(0, 3), 0), size: 0.9, size2: 0.1, life: 0.45 }));
      });
      break;
    default: // normal
      stream(from, to, D, 40, p => particle({ color: 0xffffff, color2: 0xd8d4c0, pos: p.add(jitter(0.05)), size: 0.12, size2: 0.02, life: 0.3 }));
      later(D, () => { burst(to, { color: 0xffffff, color2: 0xfff0c0, n: 20, speed: 2.6, size: 0.07, life: 0.4, geoKind: 'octa' }); shockwave(ground, 0xffffff, 1.0); });
  }
}

/* ── Sincronización por fotograma ─── */
function swapCreature(slot, sp) {
  if (slot.sp === sp) return;
  if (slot.inst) { dispose(slot.inst.root); slot.group.remove(slot.inst.root); slot.inst = null; }
  slot.sp = sp;
  if (!sp) return;
  const p = cache.get(url('criaturas', sp));
  if (!p) return;
  p.then(g => {
    if (slot.sp !== sp || slot.inst) return;
    slot.inst = instance(g);
    slot.group.add(slot.inst.root);
    const at = slot.group.position.clone().add(new THREE.Vector3(0, 0.5, 0));
    burst(at, { color: 0xffffff, color2: 0xff8080, n: 22, speed: 2.4, size: 0.07, life: 0.5 });
    shockwave(slot.group.position, 0xffffff, 1.0);
  });
}

function syncCreature(slot, s, target, dt) {
  swapCreature(slot, s.sp);
  const inst = slot.inst;
  if (!inst) return;
  inst.mixer.update(dt);
  inst.root.visible = !s.hidden && s.alpha > 0;
  setOpacity(inst, Math.max(0, Math.min(1, s.alpha)));
  inst.root.scale.setScalar(Math.max(0.01, s.scale));
  // Embestida hacia el rival (dx en píxeles 2D, ±14) y hundimiento al debilitarse (dy hasta 40)
  const lunge = Math.min(1, Math.abs(s.dx) / 14) * 0.9;
  inst.root.position.set(0, 0, lunge);
  if (s.dy > 8) inst.root.position.y = -(s.dy / 40) * 1.1;
  else inst.root.position.y = Math.abs(s.dy) / 20 * 0.4;
  const hit = slot.hitAt ? (performance.now() - slot.hitAt) / 380 : 1;
  if (hit < 1) {
    inst.root.position.x = Math.sin(hit * 40) * 0.09 * (1 - hit) * slot.hitPow;
    setGlow(inst, 0xff4030, (1 - hit) * 0.7);
  } else setGlow(inst, 0x000000, 0);
  void target;
}

function syncTrainer(sc, now, dt) {
  // Rival: aparece mientras trainerLook está definido; trainerX 0→1 lo aparta
  const look = sc.trainerLook;
  if (look !== world.enemyLook) {
    if (world.enemyTrainer) { dispose(world.enemyTrainer.root); scene3.remove(world.enemyTrainer.root); world.enemyTrainer = null; }
    world.enemyLook = look;
    const id = look && TRAINER_MODELS[look];
    const p = id && cache.get(url('entrenadores', id));
    if (p) p.then(g => {
      if (world && world.enemyLook === look && !world.enemyTrainer) {
        world.enemyTrainer = instance(g);
        world.enemyTrainer.root.rotation.y = Math.atan2(world.mePos.x - world.foePos.x, world.mePos.z - world.foePos.z);
        scene3.add(world.enemyTrainer.root);
      }
    });
  }
  if (world.enemyTrainer) {
    const t = world.enemyTrainer;
    t.mixer.update(dt);
    const x = sc.trainerX || 0;
    t.root.position.copy(world.foePos).addScaledVector(world.dir, 0.8 + x * 1.5).addScaledVector(world.side, -0.7 - x * 2);
    setOpacity(t, 1 - x);
    t.root.visible = x < 0.98;
  }

  // Jugador: visible hasta que saca su primera criatura; entonces lanza y se aparta
  const pt = world.playerTrainer;
  if (!pt) return;
  pt.mixer.update(dt);
  if (sc.playerOut && world.playerOutAt === null) {
    world.playerOutAt = now;
    if (pt.clips.throw) { pt.clips.throw.reset().setLoop(THREE.LoopOnce, 1).play(); pt.clips.throw.clampWhenFinished = true; }
  }
  const k = world.playerOutAt === null ? 0 : Math.min(1, (now - world.playerOutAt) / 700);
  pt.root.position.copy(world.mePos).addScaledVector(world.dir, -0.2 - k * 1.2).addScaledVector(world.side, 0.35 - k * 2.4);
  setOpacity(pt, 1 - k);
  pt.root.visible = k < 1;
}

function chest(slot) {
  return slot.group.position.clone().add(new THREE.Vector3(0, 0.55, 0));
}

function syncProjectile(sc) {
  const p = sc.proj;
  world.proj.forEach(m => { m.visible = false; });
  world.light.intensity = 0;
  if (!p || p.type) return;
  const fromMe = p.from === 'me';
  const a = chest(fromMe ? world.me : world.foe), b = chest(fromMe ? world.foe : world.me);
  const col = new THREE.Color(p.color);
  world.proj.forEach((m, i) => {
    const t = Math.max(0, p.p - i * 0.07);
    const pos = a.clone().lerp(b, t);
    pos.y += Math.sin(t * Math.PI) * 0.6;
    m.position.copy(pos);
    m.scale.setScalar(0.16 - i * 0.025);
    m.material.color.copy(col);
    m.material.emissive.copy(col);
    m.material.opacity = 1 - i * 0.15;
    m.visible = t > 0 && t < 1;
  });
  world.light.color.copy(col);
  world.light.intensity = 3;
  world.light.position.copy(world.proj[0].position);
}

function syncFx(sc, now) {
  world.fx.forEach(m => { m.visible = false; });
  const fx = sc.fx;
  if (!fx) return;
  const age = (now - fx.t) / 500;
  if (age < 0 || age > 1) return;
  const slot = fx.target === 'me' ? world.me : world.foe;
  const c = slot.group.position;
  const col = fx.type === 'down' ? 0x5a8af0 : fx.type === 'up' ? 0xf05a5a : 0xfff0a0;
  world.fx.forEach((m, i) => {
    const ang = (i / world.fx.length) * Math.PI * 2;
    const r = fx.type === 'sparkle' ? 0.45 + age * 0.5 : 0.5;
    const y = fx.type === 'down' ? 1.3 - age * 1.2 : fx.type === 'up' ? 0.1 + age * 1.3 : 0.6 + Math.sin(ang * 2 + age * 6) * 0.3;
    m.position.set(c.x + Math.cos(ang) * r, c.y + y + (i % 3) * 0.1, c.z + Math.sin(ang) * r);
    m.scale.setScalar(0.05 * (1 - age * 0.5));
    m.material.color.set(col);
    m.material.emissive.set(col);
    m.material.opacity = 1 - age;
    m.rotation.y = now / 200 + i;
    m.visible = true;
  });
}

function syncBall(sc, dt) {
  const b = sc.ball;
  if (!b) {
    if (world.ball) { dispose(world.ball.root); scene3.remove(world.ball.root); world.ball = null; world.ballKind = null; }
    return;
  }
  const kind = b.kind || 'capsula';
  if (world.ballKind !== kind) {
    if (world.ball) { dispose(world.ball.root); scene3.remove(world.ball.root); world.ball = null; }
    world.ballKind = kind;
    const p = cache.get(url('capsulas', kind));
    if (p) p.then(g => {
      if (!world || world.ballKind !== kind || world.ball) return;
      world.ball = instance(g);
      world.ball.root.scale.setScalar(1.4);
      if (world.ball.clips.idle) world.ball.clips.idle.stop();
      scene3.add(world.ball.root);
    });
  }
  const ball = world.ball;
  if (!ball) return;
  ball.mixer.update(dt);
  // Trayectoria: x (40→176 px) es el avance del lanzamiento; después y (40→62) es la caída al suelo
  const start = world.mePos.clone().addScaledVector(world.dir, -0.6).addScaledVector(world.side, -0.5).add(new THREE.Vector3(0, 1.2, 0));
  const end = world.foePos.clone().add(new THREE.Vector3(0, 1.25, 0));
  const t = Math.max(0, Math.min(1, (b.x - 40) / 136));
  const pos = start.clone().lerp(end, t);
  pos.y += Math.sin(t * Math.PI) * 1.2;
  if (t >= 1) pos.y = world.foePos.y + 1.25 - Math.max(0, Math.min(1, (b.y - 40) / 22)) * 1.25;
  ball.root.position.copy(pos);
  ball.root.rotation.set(0, Math.atan2(world.mePos.x - world.foePos.x, world.mePos.z - world.foePos.z), (b.rot || 0) * 0.8);
  if (t < 1) ball.root.rotation.x = -t * Math.PI * 4;
  // Tapa abierta mientras la criatura entra
  const open = (b.open || 0) > 0;
  if (open !== (world.ballOpen > 0) && ball.clips.open) {
    const a = ball.clips.open;
    if (open) { a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = 1; a.play(); }
    else { a.timeScale = -1; a.paused = false; a.play(); }
  }
  world.ballOpen = open ? 1 : 0;
  setGlow(ball, 0xfff0a0, b.caught ? 0.4 + Math.sin(performance.now() / 120) * 0.3 : 0);
}

function syncEvolve(sc, now, dt) {
  const e = sc.evolve;
  const active = !!e;
  for (const s of [world.me, world.foe]) if (s.inst) s.inst.root.visible = s.inst.root.visible && !active;
  if (world.playerTrainer) world.playerTrainer.root.visible = world.playerTrainer.root.visible && !active;
  for (const [sp, inst] of Object.entries(world.evolveInst)) inst.root.visible = false;
  if (!active) { hemi.intensity = world.style.hemi; return; }
  const center = world.mePos.clone().lerp(world.foePos, 0.4);
  for (const sp of [e.from, e.to]) {
    if (!world.evolveInst[sp]) {
      const p = cache.get(url('criaturas', sp));
      world.evolveInst[sp] = null;
      if (p) p.then(g => { if (world) { const inst = instance(g); inst.root.scale.setScalar(1.5); scene3.add(inst.root); world.evolveInst[sp] = inst; } });
    }
  }
  const flick = Math.sin(e.p * e.p * 60) > 0;
  const show = e.p > 0.97 ? e.to : flick ? e.from : e.to;
  const inst = world.evolveInst[show];
  if (inst) {
    inst.root.visible = true;
    inst.mixer.update(dt);
    inst.root.position.copy(center);
    inst.root.rotation.y = Math.atan2(camera.position.x - center.x, camera.position.z - center.z) + Math.sin(now / 300) * 0.4;
    setGlow(inst, 0xffffff, e.p < 0.97 ? Math.sin(e.p * Math.PI) * 0.45 : 0);
  }
  hemi.intensity = world.style.hemi + Math.sin(e.p * Math.PI) * 1.2;
}

function syncCamera(sc, now) {
  const me = world.mePos, foe = world.foePos;
  const dir = foe.clone().sub(me).normalize();
  const side = new THREE.Vector3(-dir.z, 0, dir.x);   // derecha vista desde detrás de tu criatura
  const c = window.__cam || CAM;
  if (camera.fov !== c.fov) { camera.fov = c.fov; camera.updateProjectionMatrix(); }
  // Cámara de combate: detrás de tu criatura, mirando al rival
  const camPos = me.clone().addScaledVector(dir, -c.back).addScaledVector(side, c.side).add(new THREE.Vector3(0, c.up, 0));
  const look = me.clone().lerp(foe, c.look).addScaledVector(side, c.lookSide).add(new THREE.Vector3(0, c.lookUp, 0));
  // Entrada: barrido desde un plano general del escenario
  const k = sc.intro || 0;
  const wide = me.clone().lerp(foe, 0.5).addScaledVector(side, 7).addScaledVector(dir, -3).add(new THREE.Vector3(0, 4.5, 0));
  camPos.lerp(wide, k * k);
  if (sc.evolve) {
    const c = me.clone().lerp(foe, 0.4);
    camPos.copy(c).addScaledVector(dir, -5.2).addScaledVector(side, 1.2).add(new THREE.Vector3(0, 1.8, 0));
    look.copy(c).add(new THREE.Vector3(0, 0.75, 0));
  }
  // Pequeño balanceo para que la escena respire y sacudida en los golpes fuertes
  camPos.y += Math.sin(now / 1800) * 0.04;
  if (world.shake) {
    const k2 = 1 - (now - world.shake.t) / 400;
    if (k2 > 0) camPos.add(jitter(world.shake.mag * k2));
    else world.shake = null;
  }
  camera.position.copy(camPos);
  camera.lookAt(look);
}

// Encuadre clásico: tu criatura abajo a la izquierda y la rival arriba a la derecha
const CAM = { fov: 34, back: 2.6, side: 3.4, up: 2.6, look: 0.65, lookSide: -1.0, lookUp: -0.3 };

function render(sc, now) {
  if (!world || world.sc !== sc) return false;
  const dt = Math.min(0.2, clock.getDelta());
  world.arena.mixer.update(dt);
  if (sc.attack && sc.attack !== world.lastAttack) { world.lastAttack = sc.attack; attackEffect(sc.attack); }
  if (sc.hit && sc.hit !== world.lastHit) {
    world.lastHit = sc.hit;
    const slot = sc.hit.target === 'me' ? world.me : world.foe;
    slot.hitAt = now;
    slot.hitPow = sc.hit.eff > 1 ? 1.6 : sc.hit.eff < 1 ? 0.6 : 1;
    world.shake = { t: now, mag: sc.hit.eff > 1 ? 0.12 : 0.04 };
  }
  if (sc.faint && sc.faint !== world.lastFaint) {
    world.lastFaint = sc.faint;
    const slot = sc.faint.target === 'me' ? world.me : world.foe;
    later(0.3, () => burst(slot.group.position.clone().add(new THREE.Vector3(0, 0.15, 0)), { color: 0xd8ccb8, color2: 0x8a7a60, n: 20, speed: 1.4, size: 0.12, size2: 0.2, life: 0.8, glow: false, up: 0.6 }));
  }
  updateParticles(dt);
  syncCreature(world.me, sc.me, world.foe, dt);
  syncCreature(world.foe, sc.foe, world.me, dt);
  syncTrainer(sc, now, dt);
  syncProjectile(sc);
  syncFx(sc, now);
  syncBall(sc, dt);
  syncEvolve(sc, now, dt);
  syncCamera(sc, now);
  renderer.render(scene3, camera);
  return true;
}

let enabled = true;
try { enabled = localStorage.getItem('criaturas-3d') !== '0'; } catch (e) { /* sin almacenamiento */ }

window.Battle3D = {
  get available() { return available && enabled; },
  get enabled() { return enabled; },
  setEnabled(v) { enabled = v; try { localStorage.setItem('criaturas-3d', v ? '1' : '0'); } catch (e) { /* sin almacenamiento */ } },
  prepare, preload, begin, end, render, trainerModel: look => TRAINER_MODELS[look],
};
window.dispatchEvent(new Event('battle3d-ready'));
