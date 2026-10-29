# Catálogo desde la wiki de Monster High

Estos scripts rehacen `js/catalog.js` y `js/photos.js` con los datos de [monsterhigh.fandom.com](https://monsterhigh.fandom.com):

- cada colección y sus muñecas salen del cuadro de información o de la galería de su página;
- después se repasan las páginas de muñecas de cada personaje (`Personaje (G1)/merchandise`, enlazadas desde las listas por año `Dolls/2010`…) para añadir las que no salen en ninguna página de colección;
- cada muñeca tiene el enlace a su foto oficial (las imágenes no se copian, se cargan desde la wiki).

Necesitan acceso a `monsterhigh.fandom.com` y `static.wikia.nocookie.net`. Se ejecutan desde una carpeta de trabajo vacía:

```sh
mkdir -p /tmp/mh && cd /tmp/mh
T=/ruta/al/repo/monster/tools/wiki
PYTHONPATH=$T python3 $T/fetch.py     # páginas y fotos de estudio
PYTHONPATH=$T python3 $T/build.py     # muñecas de cada colección (usa parse2.py) → entries_base.json
PYTHONPATH=$T python3 $T/merch.py     # páginas de muñecas de cada personaje
python3 $T/merch_parse.py             # una ficha por muñeca o set, con su código de modelo y su foto
python3 $T/merch_new.py               # descarta las que ya están (mismo código, misma foto o mismo personaje en la colección)
python3 $T/merch_merge.py             # las añade a su colección → entries.json
PYTHONPATH=$T python3 $T/resolve.py   # enlaces de las fotos y comprobación de que cargan
PYTHONPATH=$T python3 $T/chars.py     # especie de cada personaje
PYTHONPATH=$T python3 $T/gen.py       # escribe js/catalog.js y js/photos.js
```

Los identificadores de las colecciones que ya existían se mantienen (en `gen.py`, `OLD_LINES` y `OLD_SK`) para no romper las partidas guardadas. Si una muñeca desaparece del catálogo, el juego devuelve sus calaveras al cargar la partida.
