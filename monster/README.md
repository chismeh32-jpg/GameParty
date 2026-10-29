# 💀 Monster High · Cajas Sorpresa

Fan game para abrir cajas sorpresa (blind boxes) y coleccionar muñecas de Monster High de todas las épocas: la G1 de 2010, la G2, la G3, las ediciones de coleccionista y las Skullector. Cada muñeca se ve con su **foto oficial**. También hay mascotas y accesorios.

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

- Cada muñeca muestra su foto oficial de la [wiki de Monster High](https://monsterhigh.fandom.com). El juego solo guarda el enlace; la imagen se carga desde la wiki (sin enviar *referer*, que es como la wiki permite mostrarlas en otras páginas).
- Si una foto no carga, se ve el dibujo de la muñeca.
- En la ficha de cada muñeca se puede poner **una foto tuya**, que tiene prioridad: buscarla en Google, pegar el enlace o subirla de la galería. Esas fotos se guardan solo en el dispositivo; para pasárselas a la otra persona hay **Exportar fotos** e **Importar fotos** en el perfil.
- Con el ajuste **Fotos reales** del perfil se puede volver a los dibujos.

## Catálogo

- **719 muñecas en 219 colecciones**, sacadas de la wiki de Monster High (las páginas de cada colección y las de muñecas de cada personaje):
  - G1 (2010–2016): 365 muñecas
  - G2 (2016–2018): 106
  - G3 (2022–hoy): 160
  - Ediciones de coleccionista (Haunt Couture, Howliday, Creeproduction, Collector, Comic-Con…): 58
  - Skullector, de Pennywise (2020) a las de 2026: 30
- Incluye los sets de varias muñecas (por ejemplo Cleo y Deuce), las muñecas que venían con un playset y las ediciones especiales.
- **21 mascotas** y **50 accesorios**.

El catálogo se genera con los scripts de `tools/wiki/` (ver su README) y se puede volver a generar cuando salgan muñecas nuevas.

## Archivos

- `index.html`, `styles.css`: interfaz
- `js/data.js`: personajes, mascotas, accesorios, cajas y logros
- `js/catalog.js`: colecciones y muñecas (generado desde la wiki)
- `js/photos.js`: enlace a la foto oficial de cada muñeca (generado desde la wiki)
- `js/art.js`: generador de ilustraciones SVG de muñecas, mascotas y accesorios
- `js/game.js`: lógica de cajas, rarezas, recompensas y regalos
- `js/store.js`: guardado, perfiles, fotos (IndexedDB) y códigos de regalo
- `js/ui.js`: pantallas y fichas
- `js/opening.js`: animación de apertura
- `js/sfx.js`: efectos de sonido sintetizados

---

Fan game no oficial y sin ánimo de lucro. Monster High es una marca de Mattel; los personajes Skullector pertenecen a sus respectivos dueños. El repositorio no contiene imágenes de terceros: las fotos se enlazan desde la wiki de Monster High.
