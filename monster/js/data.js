'use strict';

/* ══════════════════════════════════════
   CATÁLOGO · personajes, colecciones, mascotas y accesorios
   Fan game sin ánimo de lucro. Monster High es una marca de Mattel;
   los personajes Skullector pertenecen a sus respectivos dueños.
══════════════════════════════════════ */

// Aspecto: skin, hair, streak, style (peinado), eyes (color o [izq, der]), lips,
// feats (rasgos), pal (paleta de ropa), pat (estampado), boy (chico)
const CHARS = {
  // ── Las ghouls principales ──
  frankie: { name: 'Frankie Stein', kind: 'Creación del Dr. Frankenstein', bio: 'Empezó el instituto con solo 15 días de vida. Le apasionan la moda y la ciencia, y cuando se emociona le saltan chispas por los tornillos.',
    skin: '#b9ecd0', hair: '#1a1a1a', streak: '#ffffff', style: 'long', eyes: ['#4aa8e8', '#58c878'], lips: '#9a3a6a', feats: ['stitches', 'bolts'], pal: ['#1a1a1a', '#4cc4bc', '#ffffff'], pat: 'plaid' },
  draculaura: { name: 'Draculaura', kind: 'Hija de Drácula', bio: 'Tiene 1.600 años, es vegetariana (¡la sangre la marea!) y no se refleja en los espejos. Adora el rosa, los corazones y a su murciélago Count Fabulous.',
    skin: '#fbd3e0', hair: '#151015', streak: '#ff5fa8', style: 'pigtails', eyes: '#b04aa0', lips: '#e8287a', feats: ['fangs', 'heart'], pal: ['#ff5fa8', '#1a1a1a', '#ffffff'], pat: 'hearts' },
  clawdeen: { name: 'Clawdeen Wolf', kind: 'Hija del Hombre Lobo', bio: 'Sueña con tener su propia línea de moda. Leal con sus amigas, valiente y con un estilo absolutamente feroz.',
    skin: '#c8875a', hair: '#5a2e1a', streak: '#9a5a30', style: 'big', eyes: '#e8b030', lips: '#8a2a3a', feats: ['wolfEars', 'hoops'], pal: ['#7a3aa0', '#e8b030', '#1a1a1a'], pat: 'leopard' },
  cleo: { name: 'Cleo de Nile', kind: 'Hija de la Momia', bio: 'Princesa egipcia de casi 6.000 años y capitana de las animadoras, el Fear Squad. Le encanta ser el centro de atención.',
    skin: '#e2b07a', hair: '#141414', streak: '#e8c050', style: 'long', eyes: '#3aa0d8', lips: '#c0705a', feats: ['bandages', 'headdress'], pal: ['#e8c050', '#22a8a8', '#f4ecd8'], pat: 'stripes' },
  lagoona: { name: 'Lagoona Blue', kind: 'Hija del Monstruo Marino', bio: 'Viene de Australia, es campeona de natación y necesita hidratarse a menudo. Siempre relajada y con una sonrisa.',
    skin: '#8fd4ee', hair: '#f4e08a', streak: '#3a8ad8', style: 'wavy', eyes: '#3a6ac8', lips: '#e86a8a', feats: ['fins', 'scales'], pal: ['#2a8ad8', '#ff7a9a', '#f4e08a'], pat: 'scales' },
  ghoulia: { name: 'Ghoulia Yelps', kind: 'Hija de zombis', bio: 'La alumna más lista de Monster High. Habla en zombi, colecciona cómics de Dead Fast y es la mejor amiga de Cleo.',
    skin: '#b9bfcc', hair: '#3a8ae8', streak: '#1f5ab8', style: 'updo', eyes: '#7a8ab8', lips: '#c0405a', feats: ['glasses'], pal: ['#3a8ae8', '#e83a3a', '#f4d03a'], pat: 'stripes' },
  deuce: { name: 'Deuce Gorgon', kind: 'Hijo de Medusa', bio: 'Lleva gafas de sol para no convertir a nadie en piedra. Juega al casketball y es el novio de Cleo.',
    skin: '#9ccf7a', hair: '#3a9a3a', streak: '#c83a3a', style: 'snakes', eyes: '#3a3a3a', lips: '#6a8a5a', feats: ['sunglasses'], pal: ['#1a1a1a', '#3aa03a', '#e8e8e8'], pat: 'stripes', boy: true },
  abbey: { name: 'Abbey Bominable', kind: 'Hija del Yeti', bio: 'Viene del Himalaya y siempre dice lo que piensa. Su collar de cristal de hielo la mantiene fresquita.',
    skin: '#d6eef8', hair: '#ffffff', streak: '#b05ae8', style: 'longStraight', eyes: '#8a5ad8', lips: '#8a5ad8', feats: ['tusks', 'iceNecklace'], pal: ['#b05ae8', '#5ac8f0', '#ffffff'], pat: 'snow' },
  spectra: { name: 'Spectra Vondergeist', kind: 'Hija de fantasmas', bio: 'Atraviesa paredes y escribe el blog de cotilleos «Ghostly Gossip». Lleva con orgullo las cadenas de la familia.',
    skin: '#e8e2f8', hair: '#b080e8', streak: '#f070c0', style: 'side', eyes: '#9a6ad8', lips: '#9a4ad8', feats: ['ghost', 'chains'], pal: ['#7a4ac8', '#f070c0', '#e8e2f8'], pat: 'stripes' },
  operetta: { name: 'Operetta', kind: 'Hija del Fantasma de la Ópera', bio: 'Canta rockabilly y vive en las catacumbas del instituto. Con su voz puede hipnotizar a cualquiera.',
    skin: '#f4dcd8', hair: '#c8281e', streak: '#1a1a1a', style: 'victory', eyes: '#3a8a5a', lips: '#c8102e', feats: ['beauty'], pal: ['#1a1a1a', '#c8102e', '#ffffff'], pat: 'polka' },
  toralei: { name: 'Toralei Stripe', kind: 'Hija de una gata', bio: 'Traviesa y astuta, siempre está tramando algo junto a las gemelas Purrsephone y Meowlody.',
    skin: '#f0c8a0', hair: '#e8862a', streak: '#1a1a1a', style: 'long', eyes: ['#e8d03a', '#5ac83a'], lips: '#c86a3a', feats: ['catEars', 'tail', 'tigerHair'], pal: ['#e8862a', '#1a1a1a', '#f4e8d8'], pat: 'tiger' },
  howleen: { name: 'Howleen Wolf', kind: 'Hija del Hombre Lobo', bio: 'La hermana pequeña de Clawdeen y Clawd, con mucho carácter y ganas de demostrar lo que vale.',
    skin: '#c9906a', hair: '#e8703a', streak: '#ff5aa0', style: 'short', eyes: '#e8a030', lips: '#c84a5a', feats: ['wolfEars', 'piercings'], pal: ['#ff5aa0', '#3a3a3a', '#e8703a'], pat: 'leopard' },
  clawd: { name: 'Clawd Wolf', kind: 'Hijo del Hombre Lobo', bio: 'Hermano mayor de Clawdeen, estrella del equipo de casketball y novio de Draculaura.',
    skin: '#b07a52', hair: '#4a2a18', streak: '#6a3a20', style: 'boy', eyes: '#e8b030', lips: '#8a5a4a', feats: ['wolfEars'], pal: ['#7a3aa0', '#e8b030', '#2a2a2a'], pat: 'stripes', boy: true },
  holt: { name: 'Holt Hyde', kind: 'Hijo del Sr. Hyde', bio: 'La otra mitad de Jackson Jekyll. Es DJ y, cuando suena la música, ¡sale su lado más salvaje!',
    skin: '#6aa0e8', hair: '#ff6a1a', streak: '#ffd23a', style: 'flames', eyes: ['#ff6a1a', '#3ac83a'], lips: '#3a5aa8', feats: [], pal: ['#1a1a1a', '#ff6a1a', '#3a7ae8'], pat: 'flames', boy: true },
  heath: { name: 'Heath Burns', kind: 'Hijo de elementales del fuego', bio: 'Bromista y algo despistado. Cuando come algo picante o se emociona... ¡echa fuego por la boca!',
    skin: '#f8d8a0', hair: '#ff5a1a', streak: '#ffd23a', style: 'flames', eyes: '#e8a030', lips: '#c86a4a', feats: [], pal: ['#e83a1a', '#f4d03a', '#1a1a1a'], pat: 'flames', boy: true },
  rochelle: { name: 'Rochelle Goyle', kind: 'Hija de gárgolas', bio: 'Llegó de Scaris, la ciudad de las luces. Está hecha de granito y protege a sus amigas pase lo que pase.',
    skin: '#aaa6b4', hair: '#ff7ab0', streak: '#5ac8c8', style: 'long', eyes: '#5ac8a8', lips: '#d84a8a', feats: ['wings', 'stone'], pal: ['#ff7ab0', '#5ac8c8', '#2a2a3a'], pat: 'polka' },
  venus: { name: 'Venus McFlytrap', kind: 'Hija del Monstruo de las Plantas', bio: 'Ecologista convencida. Su polen de persuasión convence a cualquiera de cuidar el planeta.',
    skin: '#9ad46a', hair: '#ff4a8a', streak: '#3a8a2a', style: 'halfShaved', eyes: '#e83a6a', lips: '#e8285a', feats: ['vines'], pal: ['#ff4a8a', '#3aa02a', '#f4e03a'], pat: 'leaves' },
  robecca: { name: 'Robecca Steam', kind: 'Creación de Hexiciah Steam', bio: 'Robot de vapor con cohetes en las botas. Siempre llega tarde porque su reloj interno va a su aire.',
    skin: '#d89060', hair: '#141414', streak: '#3a7ad8', style: 'bob', eyes: '#3a7ad8', lips: '#a83a2a', feats: ['rivets', 'goggles'], pal: ['#b8742a', '#3a7ad8', '#2a2a2a'], pat: 'gears' },
  jinafire: { name: 'Jinafire Long', kind: 'Hija del dragón chino', bio: 'Perfeccionista y artista: todo lo que hace, lo hace con fuego y pasión.',
    skin: '#b8d870', hair: '#141414', streak: '#e8c030', style: 'long', eyes: '#e8c030', lips: '#c84a2a', feats: ['horns', 'tail', 'scales'], pal: ['#c8282a', '#e8c030', '#2a8a3a'], pat: 'scales' },
  skelita: { name: 'Skelita Calaveras', kind: 'Hija de calaveras', bio: 'Viene de México y lleva el Día de Muertos en el corazón. Cálida, alegre y muy musical.',
    skin: '#f8f4ec', hair: '#141414', streak: '#ff8a1a', style: 'long', eyes: '#e83a3a', lips: '#1a1a1a', feats: ['skeleton', 'sugarSkull'], pal: ['#ff8a1a', '#e83a8a', '#1a1a1a'], pat: 'flowers' },
  catrine: { name: 'Catrine DeMew', kind: 'Hija de una gata', bio: 'Pintora de Scaris con un talento artístico enorme y un gusto exquisito.',
    skin: '#f8ecec', hair: '#f0f0f8', streak: '#ff8ac0', style: 'long', eyes: '#5ac8e8', lips: '#ff6aa0', feats: ['catEars', 'tail'], pal: ['#2a2a4a', '#ff8ac0', '#f0f0f8'], pat: 'paint' },
  twyla: { name: 'Twyla', kind: 'Hija del Hombre del Saco', bio: 'Tímida y dulce. Controla las sombras, aparece sin hacer ruido y combate las pesadillas.',
    skin: '#c8b8e8', hair: '#3a6ae8', streak: '#8a5ae8', style: 'long', eyes: '#e83a5a', lips: '#8a3ab8', feats: [], pal: ['#3a2a6a', '#8a5ae8', '#c8b8e8'], pat: 'stars' },
  gigi: { name: 'Gigi Grant', kind: 'Genio de la lámpara', bio: 'Concede deseos... pero cuidado con lo que deseas. Protagonista de 13 Wishes.',
    skin: '#d8a8e8', hair: '#5a3ae8', streak: '#ff8ad8', style: 'pony', eyes: '#5ac8e8', lips: '#e85ab8', feats: ['wisp'], pal: ['#ff8ad8', '#5a3ae8', '#e8c050'], pat: 'stars' },
  catty: { name: 'Catty Noir', kind: 'Hija de una gata negra', bio: 'Estrella del pop que trae mala suerte sin querer a quien se cruza en su camino.',
    skin: '#cbb8e0', hair: '#1a1a1a', streak: '#c86ae8', style: 'long', eyes: '#5ae87a', lips: '#a83aa8', feats: ['catEars', 'tail'], pal: ['#1a1a1a', '#c86ae8', '#e8c050'], pat: 'stars' },
  elissabat: { name: 'Elissabat', kind: 'Vampira y actriz', bio: 'La gran estrella de Hauntlywood y protagonista de Frights, Camera, Action!',
    skin: '#e8dcf0', hair: '#2a1a2a', streak: '#8a2ae8', style: 'side', eyes: '#c83a5a', lips: '#8a1a3a', feats: ['fangs'], pal: ['#8a1a3a', '#2a1a2a', '#e8c050'], pat: 'stars' },
  nefera: { name: 'Nefera de Nile', kind: 'Hija de la Momia', bio: 'La hermana mayor de Cleo: mandona, competitiva y siempre impecable.',
    skin: '#d8a070', hair: '#141414', streak: '#3a5ae8', style: 'long', eyes: '#3aa0e8', lips: '#8a3a5a', feats: ['bandages', 'headdress'], pal: ['#3a5ae8', '#e8c050', '#1a1a1a'], pat: 'stripes' },
  viperine: { name: 'Viperine Gorgon', kind: 'Gorgona', bio: 'Prima de Deuce y maquilladora de las estrellas en Hauntlywood.',
    skin: '#a8d8a0', hair: '#8a3ac8', streak: '#3aa06a', style: 'snakesLong', eyes: '#e8c030', lips: '#8a2a8a', feats: [], pal: ['#8a3ac8', '#3aa06a', '#f4e8d8'], pat: 'scales' },
  kiyomi: { name: 'Kiyomi Haunterly', kind: 'Fantasma japonesa', bio: 'Una fantasma muy tímida que aprendió a mostrar quién es de verdad en Haunted.',
    skin: '#f8f8fc', hair: '#f4f4fa', streak: '#ff8ad0', style: 'long', eyes: '#5a5a8a', lips: '#ff8ad0', feats: ['ghost'], pal: ['#ff8ad0', '#f8f8fc', '#5a5a8a'], pat: 'flowers' },
  vandala: { name: 'Vandala Doubloons', kind: 'Fantasma pirata', bio: 'Fantasma pirata con ganas de aventura y mucho estilo marinero.',
    skin: '#a8e0d8', hair: '#e83a5a', streak: '#1a1a1a', style: 'wavy', eyes: '#e8c030', lips: '#c83a3a', feats: ['ghost', 'pirateHat'], pal: ['#1a1a1a', '#c83a3a', '#e8c050'], pat: 'stripes' },
  luna: { name: 'Luna Mothews', kind: 'Hija de la Polilla', bio: 'Como buena polilla, no puede resistirse a los focos del escenario de Boo York.',
    skin: '#f0e0f8', hair: '#d8b8f8', streak: '#ffffff', style: 'big', eyes: '#8a5ad8', lips: '#b85ae8', feats: ['mothWings', 'antennae'], pal: ['#d8b8f8', '#e8c050', '#5a3a8a'], pat: 'stars' },
  mouscedes: { name: 'Mouscedes King', kind: 'Hija del Rey de los Ratones', bio: 'Ritmo, estilo y mucho carácter en las calles de Boo York.',
    skin: '#d8c0b0', hair: '#f4e8f0', streak: '#ff5aa0', style: 'pony', eyes: '#3a3a3a', lips: '#ff5aa0', feats: ['mouseEars'], pal: ['#ff5aa0', '#1a1a1a', '#e8c050'], pat: 'polka' },
  elle: { name: 'Elle Eedee', kind: 'Robot', bio: 'Robot DJ de Boo York que vive para la música electrónica.',
    skin: '#e8e8f8', hair: '#5ae8f8', streak: '#ff5ad8', style: 'bob', eyes: '#5ae8f8', lips: '#ff5ad8', feats: ['rivets'], pal: ['#5ae8f8', '#ff5ad8', '#2a2a3a'], pat: 'gears' },
  astranova: { name: 'Astranova', kind: 'Alienígena', bio: 'Llegó del espacio exterior a lomos de un cometa y aterrizó en Boo York.',
    skin: '#c0c8f8', hair: '#ffffff', streak: '#5a8af8', style: 'long', eyes: '#f8e05a', lips: '#5a8af8', feats: ['stars'], pal: ['#2a2a6a', '#f8e05a', '#c0c8f8'], pat: 'stars' },
  kala: { name: "Kala Mer'ri", kind: 'Hija del Kraken', bio: 'Reina de las profundidades del Great Scarrier Reef, con muchos brazos y más planes.',
    skin: '#a8c8f0', hair: '#3a2a6a', streak: '#5ad8c8', style: 'wavy', eyes: '#e85a8a', lips: '#8a3a8a', feats: ['tentacles'], pal: ['#3a2a6a', '#5ad8c8', '#ff7aa0'], pat: 'scales' },
  posea: { name: 'Posea Reef', kind: 'Hija de Poseidón', bio: 'Guardiana del arrecife en Great Scarrier Reef.',
    skin: '#7ad8c8', hair: '#5a3ae8', streak: '#e8c050', style: 'wavy', eyes: '#e8c050', lips: '#5a3ae8', feats: ['fins', 'scales'], pal: ['#5a3ae8', '#e8c050', '#7ad8c8'], pat: 'scales' },
  peri: { name: 'Peri y Pearl Serpentine', short: 'Peri y Pearl', kind: 'Serpiente marina de dos cabezas', bio: 'Dos cabezas, dos personalidades... ¡e inseparables!',
    skin: '#a8e8c8', hair: '#e8f8f0', streak: '#5ac8a8', style: 'long', eyes: '#e85ab8', lips: '#5ac8a8', feats: ['scales', 'fins'], pal: ['#5ac8a8', '#e8c050', '#ffffff'], pat: 'scales' },
  marisol: { name: 'Marisol Coxi', kind: 'Hija del Ucumar', bio: 'Viene de los Andes y siempre ve el lado bueno de las cosas.',
    skin: '#c8a888', hair: '#5a3a8a', streak: '#e8c050', style: 'big', eyes: '#5a3a8a', lips: '#c84a5a', feats: [], pal: ['#e8703a', '#5a3a8a', '#e8c050'], pat: 'zigzag' },
  lorna: { name: 'Lorna McNessie', kind: 'Hija del Monstruo del Lago Ness', bio: 'Llegó desde Escocia con su tartán y su sentido del humor.',
    skin: '#a8d8b0', hair: '#e8703a', streak: '#ffffff', style: 'wavy', eyes: '#3a8a5a', lips: '#c84a5a', feats: ['scales'], pal: ['#2a6a3a', '#e83a3a', '#f4e8d8'], pat: 'plaid' },
  sirena: { name: 'Sirena Von Boo', kind: 'Fantasma y sirena', bio: 'Híbrida de Freaky Fusion: mitad sirena, mitad fantasma, y algo despistada.',
    skin: '#d8f0f8', hair: '#5ad8f8', streak: '#c87af8', style: 'wavy', eyes: '#c87af8', lips: '#c87af8', feats: ['ghost', 'fins'], pal: ['#5ad8f8', '#c87af8', '#ffffff'], pat: 'scales' },
  avea: { name: 'Avea Trotter', kind: 'Arpía y centaura', bio: 'Híbrida de Freaky Fusion con alas, energía y ganas de correr.',
    skin: '#e8c8a8', hair: '#c8e870', streak: '#e85a8a', style: 'big', eyes: '#e8a030', lips: '#e85a8a', feats: ['wings'], pal: ['#c8e870', '#e85a8a', '#5a3a2a'], pat: 'zigzag' },
  neighthan: { name: 'Neighthan Rot', kind: 'Zombi, unicornio y pegaso', bio: 'Híbrido de Freaky Fusion, tímido y con un corazón enorme.',
    skin: '#b8c8a8', hair: '#e8f8f8', streak: '#c87af8', style: 'boy', eyes: '#c87af8', lips: '#7a8a6a', feats: ['unicorn', 'stitches'], pal: ['#c87af8', '#5ac8e8', '#2a2a3a'], pat: 'stripes', boy: true },
  cleolei: { name: 'Cleolei', kind: 'Fusión de Cleo y Toralei', bio: 'Una fusión de Freaky Fusion: la realeza egipcia de Cleo con la astucia felina de Toralei.',
    skin: '#e8b888', hair: '#e8862a', streak: '#141414', style: 'long', eyes: ['#3aa0d8', '#e8d03a'], lips: '#c06a4a', feats: ['catEars', 'bandages', 'headdress'], pal: ['#e8c050', '#e8862a', '#141414'], pat: 'tiger' },
  lagoonafire: { name: 'Lagoonafire', kind: 'Fusión de Lagoona y Jinafire', bio: 'Agua y fuego en una sola ghoul gracias a Freaky Fusion.',
    skin: '#a8d8c8', hair: '#141414', streak: '#f4e08a', style: 'wavy', eyes: '#e8c030', lips: '#e86a6a', feats: ['fins', 'horns'], pal: ['#2a8ad8', '#c8282a', '#e8c030'], pat: 'scales' },
  dracubecca: { name: 'Dracubecca', kind: 'Fusión de Draculaura y Robecca', bio: 'Vampira y robot de vapor a la vez: una fusión de Freaky Fusion.',
    skin: '#f0c0b0', hair: '#141414', streak: '#ff5fa8', style: 'pigtails', eyes: '#3a7ad8', lips: '#e8287a', feats: ['fangs', 'rivets'], pal: ['#ff5fa8', '#b8742a', '#1a1a1a'], pat: 'gears' },
  clawvenus: { name: 'Clawvenus', kind: 'Fusión de Clawdeen y Venus', bio: 'Loba y planta en una sola ghoul gracias a Freaky Fusion.',
    skin: '#b8b870', hair: '#5a2e1a', streak: '#ff4a8a', style: 'big', eyes: '#e8b030', lips: '#e8285a', feats: ['wolfEars', 'vines'], pal: ['#7a3aa0', '#3aa02a', '#ff4a8a'], pat: 'leaves' },

  // ── Skullector (personajes con licencia) ──
  pennywise: { name: 'Pennywise', kind: 'It', bio: 'El payaso más temido de Derry, versión muñeca Monster High.',
    skin: '#f4f4f0', hair: '#e8501a', streak: '#c8401a', style: 'clown', eyes: '#e8c030', lips: '#c81a1a', feats: ['clownface'], pal: ['#d8d4c8', '#c81a1a', '#e8501a'], outfit: 'clown', boy: true },
  grady: { name: 'Las gemelas Grady', short: 'Gemelas Grady', kind: 'El resplandor', bio: '«Ven a jugar con nosotras...» Las gemelas del Hotel Overlook, en un set de dos muñecas.',
    skin: '#f4e0d0', hair: '#7a4a2a', streak: '#6a3a1a', style: 'bob', eyes: '#3a6ac8', lips: '#d86a7a', feats: ['twins'], pal: ['#8ab8e8', '#ffffff', '#e85a8a'], outfit: 'collarDress' },
  beetlejuice: { name: 'Bitelchús', kind: 'Bitelchús', bio: 'El bioexorcista más gamberro del más allá, con su traje de rayas.',
    skin: '#d8e0c8', hair: '#c8d878', streak: '#8aa858', style: 'messy', eyes: '#c83a3a', lips: '#6a6a4a', feats: ['mold'], pal: ['#ffffff', '#141414', '#8aa858'], outfit: 'stripedSuit', boy: true },
  lydia: { name: 'Lydia Deetz', kind: 'Bitelchús', bio: 'Extraña e insólita. La chica gótica que ve fantasmas, con su famoso vestido de novia rojo.',
    skin: '#f4ece8', hair: '#141414', streak: '#2a2a2a', style: 'lydia', eyes: '#3a3a3a', lips: '#8a1a2a', feats: [], pal: ['#c81a2a', '#141414', '#ffffff'], outfit: 'redGown' },
  greta: { name: 'Greta Gremlin', kind: 'Gremlins 2', bio: 'La gremlin más coqueta, con su peluca rubia y sus labios rojos.',
    skin: '#7ab85a', hair: '#f4e08a', streak: '#e8c860', style: 'bob', eyes: '#e83a3a', lips: '#e81a3a', feats: ['gremlinEars'], pal: ['#c8285a', '#3a8a3a', '#ffffff'] },
  dracula: { name: 'Drácula', kind: 'Universal Monsters', bio: 'El conde original, con su capa y su mirada hipnótica.',
    skin: '#e8e4ec', hair: '#141414', streak: '#2a2a2a', style: 'slick', eyes: '#c81a1a', lips: '#8a1a2a', feats: ['fangs'], pal: ['#141414', '#c81a1a', '#ffffff'], outfit: 'cape', boy: true },
  frankenstein: { name: 'El monstruo de Frankenstein', short: 'Frankenstein', kind: 'Universal Monsters', bio: 'La criatura clásica del cine de terror, con tornillos y cicatrices.',
    skin: '#a8c8a0', hair: '#141414', streak: '#2a2a2a', style: 'flat', eyes: '#5a5a5a', lips: '#5a6a5a', feats: ['bolts', 'stitches'], pal: ['#3a3a3a', '#5a5a5a', '#e8e8e8'], outfit: 'suit', boy: true },
  bride: { name: 'La novia de Frankenstein', short: 'La Novia', kind: 'Universal Monsters', bio: 'Con su peinado imposible de mechas blancas y su vestido blanco.',
    skin: '#f0f0f0', hair: '#141414', streak: '#ffffff', style: 'bride', eyes: '#3a3a3a', lips: '#c81a2a', feats: ['stitches'], pal: ['#ffffff', '#d8d8e0', '#141414'], outfit: 'whiteGown' },
  elvira: { name: 'Elvira', kind: 'Elvira, Mistress of the Dark', bio: 'La reina de las películas de miedo, con su peinado cardado y su vestido negro.',
    skin: '#f4ece8', hair: '#141414', streak: '#2a2a2a', style: 'beehive', eyes: '#3a3a3a', lips: '#c81a2a', feats: [], pal: ['#141414', '#c81a2a', '#e8e8e8'], outfit: 'blackGown' },
  chucky: { name: 'Chucky', kind: 'La novia de Chucky', bio: 'El muñeco Good Guy más peligroso, ahora en versión Monster High.',
    skin: '#f4d8b8', hair: '#e8501a', streak: '#c8401a', style: 'boy', eyes: '#3a8ad8', lips: '#c86a5a', feats: ['scars'], pal: ['#3a5ac8', '#ff5a1a', '#ffffff'], outfit: 'overalls', boy: true },
  tiffany: { name: 'Tiffany', kind: 'La novia de Chucky', bio: 'La novia de Chucky, rubia, con cuero negro y muy mala idea.',
    skin: '#f4d8c8', hair: '#f8e08a', streak: '#e8c860', style: 'long', eyes: '#3a8ad8', lips: '#8a1a3a', feats: ['scars'], pal: ['#141414', '#c8c8c8', '#c81a2a'], outfit: 'leather' },
  jack: { name: 'Jack Skellington', kind: 'Pesadilla antes de Navidad', bio: 'El Rey Calabaza de Halloween Town, con su traje de raya diplomática.',
    skin: '#f8f8f8', hair: 'none', streak: 'none', style: 'bald', eyes: 'hollow', lips: '#141414', feats: ['skullFace'], pal: ['#141414', '#ffffff', '#e8e8e8'], outfit: 'pinstripe', boy: true },
  sally: { name: 'Sally', kind: 'Pesadilla antes de Navidad', bio: 'La muñeca de trapo de Halloween Town, cosida a mano y muy valiente.',
    skin: '#a8c8e8', hair: '#c8281e', streak: '#a81a14', style: 'long', eyes: '#3a3a3a', lips: '#3a3a3a', feats: ['stitches'], pal: ['#3a6ac8', '#e8c050', '#c8281e'], outfit: 'patchwork' },
  winifred: { name: 'Winifred Sanderson', kind: 'El retorno de las brujas', bio: 'La mayor de las hermanas Sanderson, con su libro de hechizos.',
    skin: '#f0e0d0', hair: '#e8501a', streak: '#c8401a', style: 'winifred', eyes: '#5a8a3a', lips: '#a81a2a', feats: [], pal: ['#3a6a3a', '#8a3a8a', '#e8c050'], outfit: 'witch' },
  mary: { name: 'Mary Sanderson', kind: 'El retorno de las brujas', bio: 'La mediana de las Sanderson, con un olfato infalible para encontrar niños.',
    skin: '#f0e0d0', hair: '#3a2a1a', streak: '#5a3a2a', style: 'mary', eyes: '#5a3a2a', lips: '#a81a2a', feats: [], pal: ['#c81a2a', '#3a2a5a', '#e8c050'], outfit: 'witch' },
  sarah: { name: 'Sarah Sanderson', kind: 'El retorno de las brujas', bio: 'La pequeña de las Sanderson, que encanta con su canción.',
    skin: '#f8e8e0', hair: '#f8e08a', streak: '#e8c860', style: 'wavy', eyes: '#5a8ad8', lips: '#e85a8a', feats: [], pal: ['#8a3ac8', '#c85a8a', '#e8c050'], outfit: 'witch' },
  morticia: { name: 'Morticia Addams', kind: 'La familia Addams', bio: 'Elegante, misteriosa y siempre de negro riguroso.',
    skin: '#f4f0f0', hair: '#141414', streak: '#2a2a2a', style: 'longStraight', eyes: '#3a3a3a', lips: '#8a1a2a', feats: [], pal: ['#141414', '#3a3a3a', '#ffffff'], outfit: 'blackGown' },
  wednesday: { name: 'Miércoles Addams', kind: 'La familia Addams', bio: 'Trenzas, cuello blanco y cero sonrisas.',
    skin: '#f0ece8', hair: '#141414', streak: '#2a2a2a', style: 'braids', eyes: '#3a3a3a', lips: '#6a4a4a', feats: [], pal: ['#141414', '#ffffff', '#3a3a3a'], outfit: 'collarDress' },
  coraline: { name: 'Coraline', kind: 'Los mundos de Coraline', bio: 'Pelo azul, chubasquero amarillo y una puerta secreta que nunca debió abrir.',
    skin: '#f4e0d0', hair: '#3a6ae8', streak: '#2a4ab8', style: 'bob', eyes: '#3a3a3a', lips: '#c86a6a', feats: ['dragonfly'], pal: ['#f4d030', '#3a6ae8', '#5a5a5a'], outfit: 'raincoat' },
  gozer: { name: 'Gozer', kind: 'Cazafantasmas', bio: 'La diosa destructora de Cazafantasmas, en versión Skullector.',
    skin: '#e8e8f0', hair: '#f0f0f0', streak: '#d8d8d8', style: 'flatTop', eyes: '#e83a3a', lips: '#3a3a3a', feats: [], pal: ['#e8e8f0', '#c81a2a', '#141414'], outfit: 'bodysuit' },
  michael: { name: 'Michael Myers', kind: 'Halloween', bio: 'La silenciosa figura de la máscara blanca, convertido en muñeco Skullector.',
    skin: '#f4f4f0', hair: '#3a2a1a', streak: '#2a1a0a', style: 'boy', eyes: '#141414', lips: '#c8c8c0', feats: ['mask'], pal: ['#3a4a6a', '#2a3a5a', '#141414'], outfit: 'coverall', boy: true },
  krampus: { name: 'Krampus', kind: 'Leyenda alpina', bio: 'El temible compañero navideño de los cuernos, para coleccionistas valientes.',
    skin: '#6a4a3a', hair: '#3a2a1a', streak: '#5a3a2a', style: 'big', eyes: '#e8c030', lips: '#3a1a1a', feats: ['horns', 'fangs'], pal: ['#3a2a1a', '#c81a2a', '#e8e8e8'], outfit: 'fur', boy: true },
  oogie: { name: 'Oogie Boogie', kind: 'Pesadilla antes de Navidad', bio: 'El saco de bichos más tramposo de Halloween Town.',
    skin: '#c8b878', hair: 'none', streak: 'none', style: 'bald', eyes: 'hollow', lips: '#141414', feats: ['sack'], pal: ['#c8b878', '#3a3a3a', '#5a8a3a'], outfit: 'sack', boy: true },
};

// Generaciones
const GENS = {
  G1: { name: 'G1 · 2010–2016', short: 'G1', color: '#ff3d9a' },
  G2: { name: 'G2 · 2016–2018', short: 'G2', color: '#ff8a3d' },
  G3: { name: 'G3 · 2022–hoy', short: 'G3', color: '#a04dff' },
  COL: { name: 'Coleccionista', short: 'COL', color: '#e8b830' },
  SK: { name: 'Skullector', short: 'SK', color: '#14d2a0' },
};

const RARITY = {
  comun: { name: 'Básica', order: 0, color: '#c8b8d8', dup: 25 },
  rara: { name: 'Rara', order: 1, color: '#5ab8ff', dup: 50 },
  epica: { name: 'Épica', order: 2, color: '#c86aff', dup: 120 },
  legendaria: { name: 'Legendaria', order: 3, color: '#ffc83a', dup: 300 },
};

// Colecciones: id, nombre, año, generación, rareza, tema de ropa, miembros
const LINES = [
  // ── G1 ──
  { id: 'basic', name: 'Básicas', year: 2010, gen: 'G1', rarity: 'comun', theme: 'school', desc: 'Las primeras muñecas de Monster High, con su ropa de diario y su diario.', members: ['frankie', 'draculaura', 'clawdeen', 'cleo', 'lagoona', 'deuce', 'ghoulia', 'holt'] },
  { id: 'dawn', name: 'Dawn of the Dance', year: 2010, gen: 'G1', rarity: 'rara', theme: 'party', desc: 'Listas para el gran baile, con faldas de tul.', members: ['frankie', 'clawdeen', 'cleo', 'draculaura', 'lagoona', 'ghoulia', 'deuce'] },
  { id: 'deadtired', name: 'Dead Tired', year: 2011, gen: 'G1', rarity: 'comun', theme: 'pajamas', desc: 'Fiesta de pijamas: camisones y antifaces para dormir.', members: ['frankie', 'draculaura', 'cleo', 'ghoulia', 'lagoona'] },
  { id: 'schoolsout', name: "School's Out", year: 2011, gen: 'G1', rarity: 'comun', theme: 'jacket', desc: '¡Se acabaron las clases! Looks de fin de curso.', members: ['frankie', 'clawdeen', 'spectra', 'cleo', 'draculaura', 'clawd', 'abbey', 'lagoona'] },
  { id: 'gloombeach', name: 'Gloom Beach', year: 2011, gen: 'G1', rarity: 'comun', theme: 'beach', desc: 'Un día de playa con bañadores y gafas de sol.', members: ['frankie', 'draculaura', 'clawdeen', 'cleo', 'lagoona'] },
  { id: 'sweet1600', name: 'Sweet 1600', year: 2011, gen: 'G1', rarity: 'rara', theme: 'gala', desc: 'La fiesta del 1.600 cumpleaños de Draculaura.', members: ['draculaura', 'frankie', 'clawdeen', 'cleo', 'lagoona'] },
  { id: 'newghouls', name: 'Nuevos alumnos', year: 2012, gen: 'G1', rarity: 'comun', theme: 'school', desc: 'Las muñecas básicas de los alumnos que fueron llegando al instituto.', members: ['operetta', 'toralei', 'howleen', 'heath', 'rochelle', 'venus', 'robecca'] },
  { id: 'skullshores', name: 'Skull Shores', year: 2012, gen: 'G1', rarity: 'comun', theme: 'tropical', desc: 'Escapada a la isla tropical de Skull Shores.', members: ['frankie', 'draculaura', 'ghoulia'] },
  { id: 'ghoulsrule', name: 'Ghouls Rule', year: 2012, gen: 'G1', rarity: 'rara', theme: 'halloween', desc: 'Disfraces de Halloween en homenaje a su herencia monstruosa.', members: ['frankie', 'cleo', 'draculaura', 'clawdeen', 'abbey'] },
  { id: 'pictureday', name: 'Picture Day', year: 2013, gen: 'G1', rarity: 'comun', theme: 'picture', desc: 'Día de la foto de clase: ¡sonrisa monstruosa!', members: ['frankie', 'operetta', 'lagoona', 'draculaura', 'clawdeen', 'cleo'] },
  { id: 'scaris', name: 'Scaris: City of Frights', year: 2013, gen: 'G1', rarity: 'rara', theme: 'travel', desc: 'De viaje por Scaris, la capital de la moda monstruosa.', members: ['frankie', 'draculaura', 'clawdeen', 'cleo', 'lagoona', 'catrine', 'jinafire', 'skelita'] },
  { id: 'powerghouls', name: 'Power Ghouls', year: 2013, gen: 'G1', rarity: 'epica', theme: 'hero', desc: 'Superheroínas: Voltageous, Wonder Wolf, Polterghoul y Cat-Tastrophe.', members: ['frankie', 'clawdeen', 'spectra', 'toralei'] },
  { id: 'thirteenwishes', name: '13 Wishes', year: 2013, gen: 'G1', rarity: 'rara', theme: 'casbah', desc: 'La aventura de Gigi Grant y sus 13 deseos.', members: ['gigi', 'twyla', 'howleen', 'lagoona', 'cleo', 'spectra'] },
  { id: 'fca', name: 'Frights, Camera, Action!', year: 2014, gen: 'G1', rarity: 'rara', theme: 'redcarpet', desc: 'Alfombra negra en Hauntlywood.', members: ['elissabat', 'draculaura', 'clawdeen', 'frankie', 'viperine'] },
  { id: 'freakyfusion', name: 'Freaky Fusion', year: 2014, gen: 'G1', rarity: 'epica', theme: 'fusion', desc: 'Híbridos y fusiones creados por accidente en el laboratorio.', members: ['cleolei', 'lagoonafire', 'dracubecca', 'clawvenus', 'sirena', 'avea', 'neighthan'] },
  { id: 'brandboo', name: 'Brand-Boo Students', year: 2014, gen: 'G1', rarity: 'comun', theme: 'school', desc: 'Alumnas de intercambio recién llegadas a Monster High.', members: ['marisol', 'lorna'] },
  { id: 'haunted', name: 'Haunted', year: 2015, gen: 'G1', rarity: 'rara', theme: 'ghostly', desc: 'Una aventura en el instituto fantasma de Haunted High.', members: ['spectra', 'kiyomi', 'vandala', 'twyla', 'draculaura', 'frankie'] },
  { id: 'booyork', name: 'Boo York, Boo York', year: 2015, gen: 'G1', rarity: 'rara', theme: 'broadway', desc: 'Luces, música y un cometa sobre Boo York.', members: ['cleo', 'nefera', 'catty', 'luna', 'mouscedes', 'elle', 'astranova'] },
  { id: 'reef', name: 'Great Scarrier Reef', year: 2016, gen: 'G1', rarity: 'rara', theme: 'ocean', desc: 'Bajo el mar del Great Scarrier Reef, ¡algunas brillan!', members: ['lagoona', 'kala', 'posea', 'peri', 'toralei', 'frankie', 'draculaura', 'clawdeen'] },
  { id: 'sdcc', name: 'Exclusiva Comic-Con', year: 2011, gen: 'G1', rarity: 'legendaria', theme: 'blackwhite', desc: 'La mítica Frankie en blanco y negro de la Comic-Con de San Diego.', members: ['frankie'] },
  // ── G2 ──
  { id: 'welcome', name: 'Welcome to Monster High', year: 2016, gen: 'G2', rarity: 'comun', theme: 'g2', desc: 'El renacer de Monster High con un look más juvenil.', members: ['frankie', 'draculaura', 'clawdeen', 'cleo', 'lagoona'] },
  { id: 'electrified', name: 'Electrified', year: 2017, gen: 'G2', rarity: 'rara', theme: 'neon', desc: 'Pelo eléctrico y colores neón.', members: ['frankie', 'draculaura', 'clawdeen', 'lagoona'] },
  // ── G3 ──
  { id: 'g3core', name: 'Faboolous Friends', year: 2022, gen: 'G3', rarity: 'comun', theme: 'g3', desc: 'Las muñecas principales de la tercera generación.', members: ['frankie', 'draculaura', 'clawdeen', 'cleo', 'lagoona', 'deuce', 'toralei', 'abbey', 'ghoulia', 'twyla'] },
  { id: 'dayout', name: 'Day Out', year: 2022, gen: 'G3', rarity: 'comun', theme: 'casual', desc: 'Un día de compras por la ciudad.', members: ['frankie', 'draculaura', 'clawdeen'] },
  { id: 'howliday', name: 'Howliday', year: 2022, gen: 'G3', rarity: 'epica', theme: 'winter', desc: 'Edición especial de las fiestas de invierno.', members: ['draculaura'] },
  { id: 'fearidescent', name: 'Skulltimate Secrets: Fearidescent', year: 2023, gen: 'G3', rarity: 'rara', theme: 'iridescent', desc: 'Taquillas sorpresa con ropa iridiscente.', members: ['draculaura', 'clawdeen', 'frankie', 'cleo', 'lagoona'] },
  { id: 'monsterball', name: 'Monster Ball', year: 2023, gen: 'G3', rarity: 'rara', theme: 'gala', desc: 'El gran baile de gala de Monster High.', members: ['draculaura', 'clawdeen', 'cleo', 'lagoona'] },
  { id: 'neonfrights', name: 'Skulltimate Secrets: Neon Frights', year: 2023, gen: 'G3', rarity: 'rara', theme: 'neon', desc: 'Taquillas sorpresa con colores fluorescentes.', members: ['draculaura', 'frankie', 'toralei', 'ghoulia', 'twyla'] },
  { id: 'monstermysteries', name: 'Skulltimate Secrets: Monster Mysteries', year: 2024, gen: 'G3', rarity: 'rara', theme: 'mystery', desc: 'Detectives monstruosas resolviendo misterios.', members: ['draculaura', 'clawdeen', 'cleo', 'abbey'] },
  { id: 'monsterfest', name: 'Monster Fest', year: 2024, gen: 'G3', rarity: 'comun', theme: 'fest', desc: 'El festival de música de Monster High, con póster de su grupo favorito.', members: ['draculaura', 'clawdeen', 'frankie', 'cleo', 'lagoona'] },
  { id: 'gardenmysteries', name: 'Skulltimate Secrets: Garden Mysteries', year: 2024, gen: 'G3', rarity: 'rara', theme: 'garden', desc: 'Secretos entre flores en el jardín del instituto.', members: ['draculaura', 'twyla', 'venus'] },
  { id: 'deadfast', name: 'Dead Fast', year: 2024, gen: 'G3', rarity: 'epica', theme: 'hero', desc: 'Ghoulia como la superheroína de su cómic favorito.', members: ['ghoulia'] },
  { id: 'fangvote', name: 'Fang Vote', year: 2024, gen: 'G3', rarity: 'epica', theme: 'g3', desc: 'El personaje elegido por los fans para volver.', members: ['jinafire'] },
  { id: 'houseofwolf', name: 'House of Wolf', year: 2025, gen: 'G3', rarity: 'epica', theme: 'couture', desc: 'Clawdeen presenta su propia casa de moda.', members: ['clawdeen'] },
  // ── Coleccionista ──
  { id: 'hauntcouture', name: 'Haunt Couture', year: 2022, gen: 'COL', rarity: 'legendaria', theme: 'couture', desc: 'Alta costura monstruosa para coleccionistas.', members: ['frankie', 'draculaura', 'clawdeen', 'cleo', 'lagoona'] },
  { id: 'midnightrunway', name: 'Haunt Couture: Midnight Runway', year: 2023, gen: 'COL', rarity: 'legendaria', theme: 'runway', desc: 'Desfile de medianoche de alta costura.', members: ['frankie', 'cleo', 'spectra'] },
  { id: 'creeproduction', name: 'Boo-riginal Creeproduction', year: 2022, gen: 'COL', rarity: 'epica', theme: 'school', desc: 'Reediciones fieles de las muñecas originales de 2010.', members: ['draculaura', 'clawdeen', 'frankie', 'lagoona', 'ghoulia', 'abbey', 'cleo', 'deuce', 'spectra'] },
  { id: 'fangclub', name: 'Fang Club', year: 2025, gen: 'COL', rarity: 'legendaria', theme: 'garden', desc: 'Venus en una edición Skullector exclusiva.', members: ['venus'] },
  // ── Skullector ──
  { id: 'sk_it', name: 'Skullector: It', year: 2020, gen: 'SK', rarity: 'legendaria', desc: 'La primera Skullector de la historia.', members: ['pennywise'] },
  { id: 'sk_shining', name: 'Skullector: El resplandor', year: 2020, gen: 'SK', rarity: 'legendaria', desc: 'Set de dos muñecas.', members: ['grady'] },
  { id: 'sk_beetle', name: 'Skullector: Bitelchús', year: 2021, gen: 'SK', rarity: 'legendaria', desc: 'Set de dos muñecas de la película de 1988.', members: ['beetlejuice', 'lydia'] },
  { id: 'sk_gremlins', name: 'Skullector: Gremlins 2', year: 2021, gen: 'SK', rarity: 'legendaria', desc: 'La gremlin más glamurosa.', members: ['greta'] },
  { id: 'sk_dracula', name: 'Skullector: Drácula', year: 2022, gen: 'SK', rarity: 'legendaria', desc: 'Monstruos clásicos de Universal.', members: ['dracula'] },
  { id: 'sk_frank', name: 'Skullector: La novia de Frankenstein', year: 2022, gen: 'SK', rarity: 'legendaria', desc: 'Set de dos muñecas de los monstruos clásicos.', members: ['frankenstein', 'bride'] },
  { id: 'sk_elvira', name: 'Skullector: Elvira', year: 2023, gen: 'SK', rarity: 'legendaria', desc: 'La Señora de la Oscuridad.', members: ['elvira'] },
  { id: 'sk_chucky', name: 'Skullector: La novia de Chucky', year: 2023, gen: 'SK', rarity: 'legendaria', desc: 'Set de dos muñecos.', members: ['chucky', 'tiffany'] },
  { id: 'sk_nbc', name: 'Skullector: Pesadilla antes de Navidad', year: 2023, gen: 'SK', rarity: 'legendaria', desc: 'Set de dos muñecos de Halloween Town.', members: ['jack', 'sally'] },
  { id: 'sk_hocus', name: 'Skullector: El retorno de las brujas', year: 2024, gen: 'SK', rarity: 'legendaria', desc: 'Las tres hermanas Sanderson.', members: ['winifred', 'mary', 'sarah'] },
  { id: 'sk_addams', name: 'Skullector: La familia Addams', year: 2024, gen: 'SK', rarity: 'legendaria', desc: 'Set de dos muñecas: madre e hija.', members: ['morticia', 'wednesday'] },
  { id: 'sk_beetle2', name: 'Skullector: Bitelchús Bitelchús', year: 2025, gen: 'SK', rarity: 'legendaria', desc: 'Set de dos muñecas de la secuela.', members: ['beetlejuice', 'lydia'] },
  { id: 'sk_elvira2', name: 'Skullector: Elvira (2025)', year: 2025, gen: 'SK', rarity: 'legendaria', desc: 'Segunda Elvira Skullector.', members: ['elvira'] },
  { id: 'sk_coraline', name: 'Skullector: Coraline', year: 2026, gen: 'SK', rarity: 'legendaria', desc: 'Colaboración con LAIKA.', members: ['coraline'] },
  { id: 'sk_gozer', name: 'Skullector: Cazafantasmas', year: 2026, gen: 'SK', rarity: 'legendaria', desc: 'Gozer el Gozeriano.', members: ['gozer'] },
  { id: 'sk_halloween', name: 'Skullector: Halloween', year: 2026, gen: 'SK', rarity: 'legendaria', desc: 'El hombre de la máscara.', members: ['michael'] },
  { id: 'sk_krampus', name: 'Skullector: Krampus', year: 2026, gen: 'SK', rarity: 'legendaria', desc: 'Edición navideña de terror.', members: ['krampus'] },
  { id: 'sk_oogie', name: 'Skullector: Oogie Boogie', year: 2026, gen: 'SK', rarity: 'legendaria', desc: 'El villano de Halloween Town.', members: ['oogie'] },
];

// Variaciones de vestuario por personaje dentro de un tema (detalles extra)
const THEME_NAMES = {
  school: 'Look de diario', jacket: 'Fin de curso', party: 'Baile', pajamas: 'Pijama', beach: 'Playa', tropical: 'Isla tropical',
  gala: 'Gala', halloween: 'Disfraz', picture: 'Foto de clase', travel: 'Viaje', hero: 'Superheroína', casbah: 'Desierto',
  redcarpet: 'Alfombra negra', fusion: 'Fusión', ghostly: 'Fantasmal', broadway: 'Musical', ocean: 'Bajo el mar', blackwhite: 'Blanco y negro',
  g2: 'G2', neon: 'Neón', g3: 'G3', casual: 'Casual', winter: 'Invierno', iridescent: 'Iridiscente', mystery: 'Detective',
  fest: 'Festival', garden: 'Jardín', couture: 'Alta costura', runway: 'Pasarela',
};

/* ── Muñecas: una por miembro de cada colección ── */
const DOLLS = {};
const DOLL_LIST = [];
for (const line of LINES) {
  line.members.forEach((c, i) => {
    const id = `${line.id}.${c}`;
    const ch = CHARS[c];
    const d = { id, char: c, line: line.id, name: ch.name, lineName: line.name, year: line.year, gen: line.gen, rarity: line.rarity, theme: line.theme, n: DOLL_LIST.length + 1, idx: i };
    DOLLS[id] = d;
    DOLL_LIST.push(d);
  });
}
const LINE_BY_ID = Object.fromEntries(LINES.map(l => [l.id, l]));

/* ── Mascotas ── */
const PETS = [
  { id: 'watzit', name: 'Watzit', owner: 'frankie', species: 'patchdog', rarity: 'comun', desc: 'Un perro hecho de piezas de muchos animales distintos.', colors: ['#e8e0d0', '#5a5a5a', '#5ac8a8'] },
  { id: 'countfabulous', name: 'Count Fabulous', owner: 'draculaura', species: 'bat', rarity: 'comun', desc: 'Murciélago muy presumido que se cree el más elegante de la cripta.', colors: ['#ff8ac0', '#2a2a2a', '#ffffff'] },
  { id: 'crescent', name: 'Crescent', owner: 'clawdeen', species: 'kitten', rarity: 'comun', desc: 'Gatita cosida a mano, muy mimosa.', colors: ['#e8c8a0', '#7a3aa0', '#ffffff'] },
  { id: 'hissette', name: 'Hissette', owner: 'cleo', species: 'cobra', rarity: 'comun', desc: 'Cobra real, tan elegante como su dueña.', colors: ['#e8c050', '#22a8a8', '#1a1a1a'] },
  { id: 'neptuna', name: 'Neptuna', owner: 'lagoona', species: 'piranha', rarity: 'comun', desc: 'Piraña muy simpática (menos cuando tiene hambre).', colors: ['#ff7a9a', '#3a8ad8', '#ffffff'] },
  { id: 'sirhootsalot', name: 'Sir Hoots A Lot', owner: 'ghoulia', species: 'owl', rarity: 'comun', desc: 'Búho zombi, sabio y despistado.', colors: ['#7a8ab8', '#e8c050', '#3a8ae8'] },
  { id: 'perseus', name: 'Perseus', owner: 'deuce', species: 'rat', rarity: 'rara', desc: 'Rata muy lista, la mascota de Deuce.', colors: ['#a8a8a8', '#ff9ab0', '#3aa03a'] },
  { id: 'shiver', name: 'Shiver', owner: 'abbey', species: 'mammoth', rarity: 'rara', desc: 'Mamut lanudo en miniatura que adora el frío.', colors: ['#e8f4fc', '#b05ae8', '#c8a888'] },
  { id: 'rhuen', name: 'Rhuen', owner: 'spectra', species: 'ferret', rarity: 'rara', desc: 'Hurón fantasma que atraviesa paredes igual que Spectra.', colors: ['#e8e2f8', '#b080e8', '#f070c0'] },
  { id: 'memphis', name: 'Memphis "Daddy O" Longlegs', owner: 'operetta', species: 'spider', rarity: 'rara', desc: 'Araña con tupé rockabilly, ¡muy marchosa!', colors: ['#2a2a2a', '#c8102e', '#ffffff'] },
  { id: 'sweetfang', name: 'Sweet Fang', owner: 'toralei', species: 'sabercat', rarity: 'rara', desc: 'Cachorra de tigre dientes de sable, tan traviesa como Toralei.', colors: ['#e8862a', '#1a1a1a', '#ffffff'] },
  { id: 'cushion', name: 'Cushion', owner: 'howleen', species: 'hedgehog', rarity: 'rara', desc: 'Erizo adorable... ¡pero no lo abraces muy fuerte!', colors: ['#c8a070', '#ff5aa0', '#5a3a2a'] },
  { id: 'roux', name: 'Roux', owner: 'rochelle', species: 'griffin', rarity: 'rara', desc: 'Grifo de piedra, protector como su dueña.', colors: ['#a8a4b0', '#ff7ab0', '#5ac8c8'] },
  { id: 'chewlian', name: 'Chewlian', owner: 'venus', species: 'flytrap', rarity: 'rara', desc: 'Planta carnívora con mucho apetito y mucho cariño.', colors: ['#5ab83a', '#ff4a8a', '#e8f8e0'] },
  { id: 'captainpenny', name: 'Captain Penny', owner: 'robecca', species: 'penguin', rarity: 'rara', desc: 'Pingüino mecánico de latón, siempre puntual (al contrario que Robecca).', colors: ['#b8742a', '#2a2a2a', '#ffffff'] },
  { id: 'dustin', name: 'Dustin', owner: 'twyla', species: 'dustbunny', rarity: 'rara', desc: 'Una pelusa con orejas: el conejito de polvo de Twyla.', colors: ['#c8b8e8', '#8a5ae8', '#ffffff'] },
  { id: 'crossfade', name: 'Crossfade', owner: 'holt', species: 'chameleon', rarity: 'epica', desc: 'Camaleón-dragón que cambia de color con la música.', colors: ['#3ac83a', '#ff6a1a', '#3a7ae8'] },
  { id: 'azura', name: 'Azura', owner: 'nefera', species: 'scarab', rarity: 'epica', desc: 'Escarabajo sagrado, tan altivo como Nefera.', colors: ['#3a5ae8', '#e8c050', '#1a1a1a'] },
  { id: 'yunyun', name: 'Yun Yun', owner: 'jinafire', species: 'cloudog', rarity: 'epica', desc: 'Perrita esponjosa de Jinafire en G3.', colors: ['#ffffff', '#e8c030', '#c8282a'] },
  { id: 'watzie', name: 'Watzie', owner: 'frankie', species: 'dogdragon', rarity: 'epica', desc: 'La versión G3 de la mascota de Frankie: mitad perro, mitad dragón.', colors: ['#b9ecd0', '#5a5a5a', '#4cc4bc'] },
  { id: 'tundra', name: 'Tundra', owner: 'abbey', species: 'mammoth', rarity: 'epica', desc: 'El mamut lanudo de Abbey en G3.', colors: ['#f4fbff', '#5ac8f0', '#a88868'] },
];
const PET_BY_ID = Object.fromEntries(PETS.map(p => [p.id, p]));

/* ── Accesorios ── */
const ACCESSORIES = [
  // Frankie
  { id: 'kit_costura', name: 'Kit de costura', owner: 'frankie', icon: 'sewing', rarity: 'comun', colors: ['#4cc4bc', '#1a1a1a'] },
  { id: 'bolso_cuadros', name: 'Bolso de cuadros', owner: 'frankie', icon: 'bag', rarity: 'comun', colors: ['#1a1a1a', '#4cc4bc'], pat: 'plaid' },
  { id: 'camara_instant', name: 'Cámara instantánea', owner: 'frankie', icon: 'camera', rarity: 'rara', colors: ['#4cc4bc', '#ffffff'] },
  // Draculaura
  { id: 'sombrilla', name: 'Sombrilla rosa', owner: 'draculaura', icon: 'parasol', rarity: 'comun', colors: ['#ff5fa8', '#1a1a1a'] },
  { id: 'bolso_corazon', name: 'Bolso corazón', owner: 'draculaura', icon: 'heartbag', rarity: 'comun', colors: ['#ff5fa8', '#1a1a1a'] },
  { id: 'corona_flores', name: 'Corona de flores', owner: 'draculaura', icon: 'flowercrown', rarity: 'rara', colors: ['#ff5fa8', '#ffffff'] },
  // Clawdeen
  { id: 'cuaderno_disenos', name: 'Cuaderno de diseños', owner: 'clawdeen', icon: 'sketchbook', rarity: 'comun', colors: ['#7a3aa0', '#e8b030'] },
  { id: 'aros_dorados', name: 'Aros dorados', owner: 'clawdeen', icon: 'hoops', rarity: 'comun', colors: ['#e8b030', '#c8901a'] },
  { id: 'bolso_leopardo', name: 'Bolso de leopardo', owner: 'clawdeen', icon: 'bag', rarity: 'rara', colors: ['#e8b030', '#5a2e1a'], pat: 'leopard' },
  // Cleo
  { id: 'tocado', name: 'Tocado egipcio', owner: 'cleo', icon: 'headdress', rarity: 'rara', colors: ['#e8c050', '#22a8a8'] },
  { id: 'pompones', name: 'Pompones del Fear Squad', owner: 'cleo', icon: 'pompoms', rarity: 'comun', colors: ['#e8c050', '#22a8a8'] },
  { id: 'ankh', name: 'Colgante ankh', owner: 'cleo', icon: 'ankh', rarity: 'comun', colors: ['#e8c050', '#22a8a8'] },
  // Lagoona
  { id: 'tabla_surf', name: 'Tabla de surf', owner: 'lagoona', icon: 'surfboard', rarity: 'rara', colors: ['#2a8ad8', '#ff7a9a'] },
  { id: 'botella_agua', name: 'Botella de hidratación', owner: 'lagoona', icon: 'bottle', rarity: 'comun', colors: ['#2a8ad8', '#8fd4ee'] },
  { id: 'gafas_buceo', name: 'Gafas de buceo', owner: 'lagoona', icon: 'goggles', rarity: 'comun', colors: ['#ff7a9a', '#8fd4ee'] },
  // Ghoulia
  { id: 'comic_deadfast', name: 'Cómic de Dead Fast', owner: 'ghoulia', icon: 'comic', rarity: 'rara', colors: ['#e83a3a', '#f4d03a'] },
  { id: 'gafas_rojas', name: 'Gafas rojas', owner: 'ghoulia', icon: 'glasses', rarity: 'comun', colors: ['#e83a3a', '#ffffff'] },
  { id: 'libro', name: 'Libro de texto', owner: 'ghoulia', icon: 'book', rarity: 'comun', colors: ['#3a8ae8', '#f4d03a'] },
  // Deuce
  { id: 'gafas_sol', name: 'Gafas de sol', owner: 'deuce', icon: 'sunglasses', rarity: 'comun', colors: ['#1a1a1a', '#3aa03a'] },
  { id: 'casketball', name: 'Balón de casketball', owner: 'deuce', icon: 'ball', rarity: 'comun', colors: ['#ff8a2a', '#1a1a1a'] },
  // Abbey
  { id: 'collar_hielo', name: 'Collar de hielo', owner: 'abbey', icon: 'icenecklace', rarity: 'rara', colors: ['#5ac8f0', '#b05ae8'] },
  { id: 'snowboard', name: 'Snowboard', owner: 'abbey', icon: 'surfboard', rarity: 'comun', colors: ['#b05ae8', '#ffffff'] },
  // Spectra
  { id: 'icoffin', name: 'iCoffin', owner: 'spectra', icon: 'phone', rarity: 'comun', colors: ['#7a4ac8', '#f070c0'] },
  { id: 'cadenas', name: 'Cadenas de la familia', owner: 'spectra', icon: 'chain', rarity: 'rara', colors: ['#c8c8d8', '#7a4ac8'] },
  // Operetta
  { id: 'microfono', name: 'Micrófono vintage', owner: 'operetta', icon: 'mic', rarity: 'comun', colors: ['#c8c8c8', '#c8102e'] },
  { id: 'vinilo', name: 'Disco de vinilo', owner: 'operetta', icon: 'vinyl', rarity: 'comun', colors: ['#1a1a1a', '#c8102e'] },
  // Otros personajes
  { id: 'ovillo', name: 'Ovillo de lana', owner: 'toralei', icon: 'yarn', rarity: 'comun', colors: ['#e8862a', '#1a1a1a'] },
  { id: 'monopatin', name: 'Monopatín', owner: 'howleen', icon: 'skateboard', rarity: 'comun', colors: ['#ff5aa0', '#3a3a3a'] },
  { id: 'gafas_vapor', name: 'Gafas de vapor', owner: 'robecca', icon: 'goggles', rarity: 'rara', colors: ['#b8742a', '#3a7ad8'] },
  { id: 'pincel', name: 'Pincel y paleta', owner: 'catrine', icon: 'palette', rarity: 'rara', colors: ['#ff8ac0', '#2a2a4a'] },
  { id: 'lampara', name: 'Lámpara mágica', owner: 'gigi', icon: 'lamp', rarity: 'epica', colors: ['#e8c050', '#5a3ae8'] },
  { id: 'regadera', name: 'Regadera ecológica', owner: 'venus', icon: 'watering', rarity: 'comun', colors: ['#3aa02a', '#ff4a8a'] },
  { id: 'guitarra', name: 'Guitarra', owner: 'skelita', icon: 'guitar', rarity: 'rara', colors: ['#ff8a1a', '#1a1a1a'] },
  { id: 'abanico', name: 'Abanico de dragón', owner: 'jinafire', icon: 'fan', rarity: 'rara', colors: ['#c8282a', '#e8c030'] },
  { id: 'claqueta', name: 'Claqueta de cine', owner: 'elissabat', icon: 'clapper', rarity: 'rara', colors: ['#1a1a1a', '#ffffff'] },
  // De todo el instituto
  { id: 'diario', name: 'Diario secreto', owner: null, icon: 'diary', rarity: 'comun', colors: ['#ff3d9a', '#1a1a1a'] },
  { id: 'taquilla', name: 'Taquilla ataúd', owner: null, icon: 'locker', rarity: 'rara', colors: ['#ff3d9a', '#1a1a1a'] },
  { id: 'cafe', name: 'Café del Coffin Bean', owner: null, icon: 'coffee', rarity: 'comun', colors: ['#5a3a2a', '#ff3d9a'] },
  { id: 'bandeja', name: 'Bandeja de la Creepateria', owner: null, icon: 'tray', rarity: 'comun', colors: ['#c8c8d8', '#ff3d9a'] },
  { id: 'tacones', name: 'Tacones de plataforma', owner: null, icon: 'shoes', rarity: 'comun', colors: ['#ff3d9a', '#1a1a1a'] },
  { id: 'pintalabios', name: 'Pintalabios de vampira', owner: null, icon: 'lipstick', rarity: 'comun', colors: ['#c81a4a', '#1a1a1a'] },
  { id: 'espejo', name: 'Espejo sin reflejo', owner: null, icon: 'mirror', rarity: 'rara', colors: ['#c8a8e8', '#1a1a1a'] },
  { id: 'cepillo', name: 'Cepillo de muñeca', owner: null, icon: 'brush', rarity: 'comun', colors: ['#ff3d9a', '#ffffff'] },
  { id: 'calavera_lazo', name: 'Calavera con lazo', owner: null, icon: 'skullbow', rarity: 'epica', colors: ['#ffffff', '#ff3d9a'] },
  // Skullector
  { id: 'globo_rojo', name: 'Globo rojo', owner: 'pennywise', icon: 'balloon', rarity: 'epica', colors: ['#c81a1a', '#ffffff'] },
  { id: 'manual_muertos', name: 'Manual para recién fallecidos', owner: 'beetlejuice', icon: 'book', rarity: 'epica', colors: ['#3a8a3a', '#141414'] },
  { id: 'camara_lydia', name: 'Cámara de Lydia', owner: 'lydia', icon: 'camera', rarity: 'epica', colors: ['#141414', '#c81a2a'] },
  { id: 'llave_boton', name: 'Llave con botón', owner: 'coraline', icon: 'key', rarity: 'epica', colors: ['#3a3a3a', '#3a6ae8'] },
  { id: 'libro_hechizos', name: 'Libro de hechizos', owner: 'winifred', icon: 'spellbook', rarity: 'epica', colors: ['#6a4a2a', '#e8c050'] },
  { id: 'calabaza', name: 'Corona de calabaza', owner: 'jack', icon: 'pumpkin', rarity: 'epica', colors: ['#ff8a1a', '#3a8a3a'] },
];
const ACC_BY_ID = Object.fromEntries(ACCESSORIES.map(a => [a.id, a]));

/* ── Cajas ── */
const BOXES = [
  { id: 'misteriosa', name: 'Caja Misteriosa', desc: 'Cualquier muñeca de cualquier año y colección.', price: 100, kind: 'doll', pool: () => DOLL_LIST, rates: { comun: 50, rara: 32, epica: 12, legendaria: 6 }, color: '#ff3d9a', color2: '#1a1018' },
  { id: 'g1', name: 'Caja Clásica', desc: 'Solo muñecas de la G1 (2010–2016).', price: 120, kind: 'doll', pool: () => DOLL_LIST.filter(d => d.gen === 'G1'), rates: { comun: 50, rara: 34, epica: 12, legendaria: 4 }, color: '#ff3d9a', color2: '#2a0a1a' },
  { id: 'g3', name: 'Caja Nueva Era', desc: 'G2, G3 y ediciones de coleccionista (2016–hoy).', price: 120, kind: 'doll', pool: () => DOLL_LIST.filter(d => ['G2', 'G3', 'COL'].includes(d.gen)), rates: { comun: 50, rara: 32, epica: 12, legendaria: 6 }, color: '#a04dff', color2: '#160a2a' },
  { id: 'dia', name: 'Caja del día', desc: 'Solo dos colecciones, distintas cada día.', price: 160, kind: 'doll', pool: () => dailyLines().flatMap(l => DOLL_LIST.filter(d => d.line === l.id)), rates: null, color: '#3dd8ff', color2: '#0a1a2a' },
  { id: 'skullector', name: 'Ataúd Skullector', desc: 'Solo épicas y legendarias. ¡Aquí viven las Skullector!', price: 500, kind: 'doll', pool: () => DOLL_LIST, rates: { comun: 0, rara: 0, epica: 50, legendaria: 50 }, color: '#14d2a0', color2: '#06140f' },
  { id: 'mascota', name: 'Caja de Mascota', desc: 'Una mascota de las ghouls.', price: 50, kind: 'pet', rates: { comun: 55, rara: 35, epica: 10 }, color: '#ffb03d', color2: '#2a1606' },
  { id: 'accesorios', name: 'Bolsa de Accesorios', desc: 'Dos accesorios al azar.', price: 40, kind: 'acc', count: 2, rates: { comun: 62, rara: 28, epica: 10 }, color: '#5ae87a', color2: '#062a10' },
];
const BOX_BY_ID = Object.fromEntries(BOXES.map(b => [b.id, b]));

// Precio para pedir una muñeca concreta en la tienda de deseos
const WISH_PRICE = { comun: 300, rara: 600, epica: 1500, legendaria: 4000 };
const SHINY_CHANCE = 0.04;

// Generador pseudoaleatorio con semilla (para cosas que dependen del día)
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function dayNumber(d = new Date()) { return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
function dailyLines() {
  const pool = LINES.filter(l => l.gen !== 'SK' && l.members.length >= 3);
  const r = seeded(dayNumber() * 7919);
  const a = Math.floor(r() * pool.length);
  let b = Math.floor(r() * (pool.length - 1));
  if (b >= a) b++;
  return [pool[a], pool[b]];
}

/* ── Logros ── */
const ACHIEVEMENTS = [
  { id: 'first', name: 'Primer susto', desc: 'Abre tu primera caja.', test: s => s.stats.opened >= 1, reward: 50 },
  { id: 'open25', name: 'Adicta a las cajas', desc: 'Abre 25 cajas.', test: s => s.stats.opened >= 25, reward: 150 },
  { id: 'open100', name: 'Coleccionista de ataúdes', desc: 'Abre 100 cajas.', test: s => s.stats.opened >= 100, reward: 400 },
  { id: 'open300', name: 'Leyenda del Coffin Bean', desc: 'Abre 300 cajas.', test: s => s.stats.opened >= 300, reward: 1000 },
  { id: 'dolls10', name: 'Nueva alumna', desc: 'Consigue 10 muñecas distintas.', test: s => ownedDolls(s) >= 10, reward: 100 },
  { id: 'dolls50', name: 'Mejor del curso', desc: 'Consigue 50 muñecas distintas.', test: s => ownedDolls(s) >= 50, reward: 300 },
  { id: 'dolls100', name: 'Directora Bloodgood', desc: 'Consigue 100 muñecas distintas.', test: s => ownedDolls(s) >= 100, reward: 800 },
  { id: 'dollsAll', name: 'Colección completa', desc: 'Consigue todas las muñecas.', test: s => ownedDolls(s) >= DOLL_LIST.length, reward: 5000 },
  { id: 'line1', name: 'Serie completa', desc: 'Completa una colección entera.', test: s => LINES.some(l => lineDone(s, l)), reward: 200 },
  { id: 'line5', name: 'Estantería llena', desc: 'Completa 5 colecciones.', test: s => LINES.filter(l => lineDone(s, l)).length >= 5, reward: 600 },
  { id: 'legend', name: '¡Legendaria!', desc: 'Consigue una muñeca legendaria.', test: s => DOLL_LIST.some(d => d.rarity === 'legendaria' && s.dolls[d.id]), reward: 200 },
  { id: 'skullector', name: 'Skullector', desc: 'Consigue 5 muñecas Skullector.', test: s => DOLL_LIST.filter(d => d.gen === 'SK' && s.dolls[d.id]).length >= 5, reward: 600 },
  { id: 'shiny', name: '¡Cómo brilla!', desc: 'Consigue una muñeca brillante.', test: s => Object.values(s.dolls).some(v => v.shiny > 0), reward: 150 },
  { id: 'core5', name: 'Las cinco ghouls', desc: 'Ten a Frankie, Draculaura, Clawdeen, Cleo y Lagoona.', test: s => ['frankie', 'draculaura', 'clawdeen', 'cleo', 'lagoona'].every(c => DOLL_LIST.some(d => d.char === c && s.dolls[d.id])), reward: 150 },
  { id: 'drac10', name: 'Fan de Draculaura', desc: 'Consigue 10 Draculauras distintas.', test: s => DOLL_LIST.filter(d => d.char === 'draculaura' && s.dolls[d.id]).length >= 10, reward: 400 },
  { id: 'pets5', name: 'Zoo monstruoso', desc: 'Consigue 5 mascotas.', test: s => Object.keys(s.pets).length >= 5, reward: 100 },
  { id: 'petsAll', name: 'Todas las mascotas', desc: 'Consigue todas las mascotas.', test: s => Object.keys(s.pets).length >= PETS.length, reward: 800 },
  { id: 'acc20', name: 'Fashionista', desc: 'Consigue 20 accesorios distintos.', test: s => Object.keys(s.accs).length >= 20, reward: 200 },
  { id: 'accAll', name: 'Armario infinito', desc: 'Consigue todos los accesorios.', test: s => Object.keys(s.accs).length >= ACCESSORIES.length, reward: 800 },
  { id: 'gift', name: 'Regalo de corazón', desc: 'Regala algo a otra persona.', test: s => (s.stats.gifts || 0) >= 1, reward: 100 },
  { id: 'streak7', name: 'Una semana de sustos', desc: 'Entra 7 días seguidos.', test: s => (s.daily?.streak || 0) >= 7, reward: 300 },
  { id: 'photo', name: 'Foto de verdad', desc: 'Añade una foto real a una muñeca.', test: s => (s.stats.photos || 0) >= 1, reward: 50 },
];
function shortName(c) { const ch = CHARS[c]; return ch.short || (ch.name.length > 13 ? ch.name.split(' ')[0] : ch.name); }
function ownedDolls(s) { return Object.keys(s.dolls).length; }
function lineDone(s, l) { return l.members.every(c => s.dolls[`${l.id}.${c}`]); }
