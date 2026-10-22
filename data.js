'use strict';

/* ══════════════════════════════════════
   CONFIGURACIÓN GENERAL
══════════════════════════════════════ */
const TILE = 16;                // tamaño de una casilla en píxeles de pixel art
const DAY_MS = 150000;          // 1 día de juego = 150 s reales (06:00 → 24:00)
const DAYS_PER_SEASON = 7;
const SAVE_KEY = 'granja2d-v1';
const FEED_PRICE = 5;
const DRY_DAYS_TO_DIE = 3;
const PLAYER_SPEED = 4.2;       // casillas por segundo

const ENERGY_COST = { till: 2, water: 1, plant: 1, harvest: 1, clear: 2, pet: 1 };

const SEASONS = [
  { id: 'primavera', name: 'Primavera', emoji: '🌸', article: 'la' },
  { id: 'verano',    name: 'Verano',    emoji: '☀️', article: 'el' },
  { id: 'otono',     name: 'Otoño',     emoji: '🍂', article: 'el' },
  { id: 'invierno',  name: 'Invierno',  emoji: '❄️', article: 'el' },
];

// art: cómo se dibuja la planta madura (ver sprites.js)
const CROPS = {
  trigo:     { name: 'Trigo',     emoji: '🌾', seed: 10, sell: 24,  days: 3, level: 1, seasons: ['primavera', 'verano', 'otono'], art: { type: 'stalk',  color: '#e7c04f', dark: '#b8892c' } },
  cebolla:   { name: 'Cebolla',   emoji: '🧅', seed: 12, sell: 30,  days: 4, level: 1, seasons: ['invierno', 'primavera'],        art: { type: 'root',   color: '#e9d7a8', dark: '#c49a5a', leaf: '#7cbf4f' } },
  zanahoria: { name: 'Zanahoria', emoji: '🥕', seed: 15, sell: 38,  days: 4, level: 1, seasons: ['primavera', 'otono'],           art: { type: 'root',   color: '#f08a2c', dark: '#c4601a', leaf: '#4fa83a' } },
  col:       { name: 'Col',       emoji: '🥬', seed: 20, sell: 55,  days: 5, level: 2, seasons: ['otono', 'invierno'],            art: { type: 'head',   color: '#8fd16a', dark: '#4f9a3a' } },
  maiz:      { name: 'Maíz',      emoji: '🌽', seed: 25, sell: 65,  days: 5, level: 2, seasons: ['verano', 'otono'],              art: { type: 'corn',   color: '#f2cf3d', dark: '#c9a020' } },
  tomate:    { name: 'Tomate',    emoji: '🍅', seed: 30, sell: 45,  days: 4, level: 3, seasons: ['verano'], regrow: 2,            art: { type: 'bush',   color: '#e0412f', dark: '#a82a1e' } },
  fresa:     { name: 'Fresa',     emoji: '🍓', seed: 40, sell: 55,  days: 4, level: 3, seasons: ['primavera'], regrow: 2,         art: { type: 'bush',   color: '#f0506a', dark: '#b8304a', small: true } },
  calabaza:  { name: 'Calabaza',  emoji: '🎃', seed: 70, sell: 200, days: 6, level: 4, seasons: ['otono'],                        art: { type: 'ground', color: '#f08a24', dark: '#c0601a', stripes: 'v' } },
  sandia:    { name: 'Sandía',    emoji: '🍉', seed: 80, sell: 230, days: 6, level: 5, seasons: ['verano'],                       art: { type: 'ground', color: '#5aa83f', dark: '#2f6e25', stripes: 'v' } },
};

const ANIMALS = {
  gallina: { name: 'Gallina', emoji: '🐔', cost: 150,  feed: 1, product: 'huevo', every: 1, level: 1 },
  oveja:   { name: 'Oveja',   emoji: '🐑', cost: 450,  feed: 2, product: 'lana',  every: 3, level: 2 },
  vaca:    { name: 'Vaca',    emoji: '🐄', cost: 700,  feed: 3, product: 'leche', every: 1, level: 3 },
  cerdo:   { name: 'Cerdo',   emoji: '🐖', cost: 1000, feed: 3, product: 'trufa', every: 2, level: 4 },
};

const PRODUCTS = {
  huevo: { name: 'Huevo', emoji: '🥚', sell: 30 },
  lana:  { name: 'Lana',  emoji: '🧶', sell: 200 },
  leche: { name: 'Leche', emoji: '🥛', sell: 75 },
  trufa: { name: 'Trufa', emoji: '🍄', sell: 220 },
};

// Todo lo que puede guardarse en el granero y venderse
const ITEMS = {};
for (const [id, c] of Object.entries(CROPS)) ITEMS[id] = { name: c.name, emoji: c.emoji, sell: c.sell, crop: true };
for (const [id, p] of Object.entries(PRODUCTS)) ITEMS[id] = { name: p.name, emoji: p.emoji, sell: p.sell, crop: false };

const WEATHER = {
  soleado:  { name: 'Soleado',  emoji: '☀️' },
  nublado:  { name: 'Nublado',  emoji: '☁️' },
  lluvia:   { name: 'Lluvia',   emoji: '🌧️', waters: true },
  tormenta: { name: 'Tormenta', emoji: '⛈️', waters: true },
  nieve:    { name: 'Nieve',    emoji: '🌨️', waters: true },
};

const UPGRADES = [
  { id: 'terreno',        name: 'Ampliar terreno',     emoji: '🚜', desc: '+1 fila de cultivo (8 parcelas)',       max: 3, cost: l => [400, 1200, 3000][l] },
  { id: 'regadera',       name: 'Regadera de cobre',   emoji: '🚿', desc: '+15 de capacidad de agua',              max: 2, cost: l => 350 * (l + 1) },
  { id: 'granero',        name: 'Granero más grande',  emoji: '🏚️', desc: '+40 de capacidad en el granero',        max: 4, cost: l => 300 * (l + 1) },
  { id: 'corral',         name: 'Ampliar establo',     emoji: '🪵', desc: '+2 plazas para animales',               max: 4, cost: l => 500 * (l + 1) },
  { id: 'espantapajaros', name: 'Espantapájaros',      emoji: '🧑‍🌾', desc: 'Ahuyenta a los cuervos de tus cultivos', max: 1, cost: () => 350 },
  { id: 'pararrayos',     name: 'Pararrayos',          emoji: '⚡', desc: 'Protege la granja de los rayos',        max: 1, cost: () => 600 },
  { id: 'cafe',           name: 'Cafetera',            emoji: '☕', desc: '+25 de energía máxima',                 max: 2, cost: l => 800 * (l + 1) },
  { id: 'aspersor',       name: 'Aspersores',          emoji: '💦', desc: 'Riegan todas las parcelas cada mañana', max: 1, cost: () => 4000 },
];

const ACHIEVEMENTS = [
  { id: 'cosecha1',   emoji: '🌱', name: 'Primera cosecha',      desc: 'Cosecha tu primer cultivo',          test: s => s.stats.harvests >= 1 },
  { id: 'cosecha100', emoji: '🧺', name: 'Manos de agricultor',  desc: 'Cosecha 100 cultivos',               test: s => s.stats.harvests >= 100 },
  { id: 'animal1',    emoji: '🐣', name: 'Nuevo amigo',          desc: 'Compra tu primer animal',            test: s => s.animals.length >= 1 },
  { id: 'zoo',        emoji: '🐮', name: 'Establo lleno',        desc: 'Ten 6 animales a la vez',            test: s => s.animals.length >= 6 },
  { id: 'feliz',      emoji: '💖', name: 'Animales felices',     desc: 'Un animal con 100 de felicidad',     test: s => s.animals.some(a => a.mood >= 100) },
  { id: 'rico1',      emoji: '💰', name: 'Ahorrador',            desc: 'Ten 1.000 monedas',                  test: s => s.coins >= 1000 },
  { id: 'rico2',      emoji: '🏦', name: 'Terrateniente',        desc: 'Ten 10.000 monedas',                 test: s => s.coins >= 10000 },
  { id: 'nivel5',     emoji: '⭐', name: 'Experto',              desc: 'Alcanza el nivel 5',                 test: s => s.level >= 5 },
  { id: 'anio',       emoji: '📅', name: 'Un año en el campo',   desc: 'Llega al día 29',                    test: s => s.day >= 29 },
  { id: 'max',        emoji: '🗺️', name: 'Latifundio',           desc: 'Amplía el terreno al máximo',        test: s => s.upgrades.terreno >= 3 },
];

const ANIMAL_NAMES = ['Paca', 'Lola', 'Manchas', 'Copito', 'Rufo', 'Pepa', 'Bombón', 'Nube', 'Canela', 'Chispa', 'Tula', 'Kiko', 'Margarita', 'Pancho', 'Luna', 'Rosita'];

/* ══════════════════════════════════════
   MAPA
══════════════════════════════════════ */
const MAP_W = 34;
const MAP_H = 26;
const FIELD = { x: 3, y: 10, cols: 8, baseRows: 3, maxRows: 6 };
const POND = { x: 4, y: 19, w: 6, h: 4 };
const CORRAL = { x: 20, y: 2, w: 12, h: 14, gateY: 7 };   // valla perimetral, puerta en el lado izquierdo

// Edificios y objetos con los que se puede interactuar (coordenadas en casillas)
const BUILDINGS = [
  { id: 'casa',   name: 'Casa',            x: 3,  y: 2, w: 5, h: 4, door: { x: 5, y: 5 } },
  { id: 'taller', name: 'Taller',          x: 12, y: 3, w: 3, h: 3, door: { x: 13, y: 5 } },
  { id: 'establo', name: 'Establo',        x: 23, y: 3, w: 5, h: 4, door: { x: 25, y: 6 } },
  { id: 'caja',   name: 'Caja de envíos',  x: 9,  y: 5, w: 1, h: 1 },
  { id: 'tablon', name: 'Tablón',          x: 16, y: 5, w: 1, h: 1 },
];

const TREES = [
  [11, 12], [13, 16], [17, 13], [2, 16], [12, 21], [16, 23], [27, 19], [30, 22],
  [24, 21], [21, 18], [31, 18], [18, 20], [2, 23], [9, 24], [26, 24], [14, 8],
];
