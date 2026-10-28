# 💀 Monster High · Cajas Sorpresa

Fan game para abrir cajas sorpresa (blind boxes) y coleccionar muñecas de Monster High de todas las épocas: la G1 de 2010, la G2, la G3, las ediciones de coleccionista y las Skullector. También hay mascotas y accesorios.

- **Online:** `https://chismeh32-jpg.github.io/GameParty/monster/`
- **En local:** sirve la carpeta del repositorio (por ejemplo `python3 -m http.server`) y abre `/monster/`.

La partida se guarda en el navegador. Puede haber varios perfiles en el mismo dispositivo.

## Cómo se juega

- **🎁 Cajas:** cada hora se recarga una caja gratis (hasta 3). En la tienda hay cajas de muñeca (misteriosa, clásica G1, nueva era, la caja del día y el ataúd Skullector), de mascota y de accesorios.
- **Abrir:** toca la caja tres veces para agitarla. Si dentro hay algo épico o legendario, la caja brilla antes de abrirse.
- **Extras:** las cajas de muñeca a veces traen de regalo su mascota o un accesorio.
- **Rarezas:** básica, rara, épica y legendaria. Además, un 4 % de las muñecas sale brillante ✨. Si llevas 14 cajas sin una épica o legendaria, la siguiente la trae seguro.
- **💀 Colección:** filtros por generación, personaje y estado (las que tengo, las que me faltan, repetidas, brillantes y favoritas). Las que faltan se pueden pedir con calaveras.
- **🪞 Estantería:** 12 huecos para lucir tus favoritas, en su caja o fuera de ella. Las mascotas viven en la alfombra.
- **🏆 Logros:** estadísticas y 22 logros con recompensa. Completar una colección o todas las versiones de un personaje también da premio.
- **🦇 Perfil:** regalos, fotos reales, perfiles y ajustes, incluido el **modo libre** (cajas gratis sin límite).

## Regalos entre la pareja

Desde la ficha de cualquier muñeca, mascota o accesorio, o desde la tienda para regalar una caja:

- Si los dos perfiles están en el mismo dispositivo, se pasa directamente.
- Si no, se crea un **enlace**. Al abrirlo, el regalo llega al perfil activo. Cada regalo solo se puede abrir una vez por perfil.

## Fotos reales

Las ilustraciones están dibujadas con código. En la ficha de cada muñeca se puede añadir una **foto real**: buscarla en Google, pegar el enlace de la imagen o subirla de la galería. Las fotos se guardan solo en el dispositivo; para pasárselas a la otra persona hay **Exportar fotos** e **Importar fotos** en el perfil.

## Catálogo

- **209 muñecas en 56 colecciones**: Básicas, Dawn of the Dance, Dead Tired, School's Out, Gloom Beach, Sweet 1600, Ghouls Rule, Scaris, Power Ghouls, 13 Wishes, Freaky Fusion, Boo York, Great Scarrier Reef, Welcome to Monster High, Electrified, Faboolous Friends, Skulltimate Secrets, Monster Ball, Monster Fest, Haunt Couture, Creeproduction y todas las Skullector (de Pennywise en 2020 a las de 2026).
- **21 mascotas** y **50 accesorios**.

El catálogo se ha hecho de memoria y con búsquedas, así que puede faltar alguna muñeca o haber algún año distinto. Se añaden más en `js/data.js`: basta con añadir una colección a `LINES`, y si es un personaje nuevo, también a `CHARS`.

## Archivos

- `index.html`, `styles.css`: interfaz
- `js/data.js`: personajes, colecciones, mascotas, accesorios, cajas y logros
- `js/art.js`: generador de ilustraciones SVG de muñecas, mascotas y accesorios
- `js/game.js`: lógica de cajas, rarezas, recompensas y regalos
- `js/store.js`: guardado, perfiles, fotos (IndexedDB) y códigos de regalo
- `js/ui.js`: pantallas y fichas
- `js/opening.js`: animación de apertura
- `js/sfx.js`: efectos de sonido sintetizados

---

Fan game no oficial y sin ánimo de lucro. Monster High es una marca de Mattel; los personajes Skullector pertenecen a sus respectivos dueños. No incluye imágenes de terceros.
