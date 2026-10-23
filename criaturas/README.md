# 🎮 Criaturas de Brisaluz

RPG de captura y combate de criaturas para el navegador, al estilo de los clásicos de consola portátil. Es un juego original: región, criaturas, personajes y pixel art propios, todo dibujado con código. No necesita instalación ni dependencias.

- **Online:** `https://chismeh32-jpg.github.io/GameParty/criaturas/`
- **En local:** abre `criaturas/index.html` en el navegador.

## Controles

| | Ordenador | Móvil |
|---|---|---|
| Moverse | Flechas o WASD | Cruceta |
| A (aceptar, hablar) | Z, Espacio o Enter | A |
| B (volver, correr) | X o Mayús | B |
| Menú | Esc o M | START |

## Contenido

- **25 criaturas** de 10 tipos (Normal, Fuego, Agua, Planta, Eléctrico, Roca, Volador, Bicho, Veneno y Fantasma), con evoluciones y una legendaria.
- **Combates por turnos** con tabla de tipos, bonificación por tipo propio (STAB), golpes críticos, precisión, prioridad, estados (veneno, quemadura, parálisis y sueño) y cambios de estadísticas.
- **Capturas** con Cápsula, Supercápsula y Ultracápsula (cuantos menos PS, más fácil).
- **Experiencia**, subidas de nivel, aprendizaje de movimientos (con opción de olvidar uno) y evoluciones animadas.
- **Mapas:** Pueblo Albor, Ruta 1, Ciudad Roble, Ruta 2 (Bosque Musgo), Cueva Eco, Puerto Marea y el Santuario.
- **Historia:** elección de inicial, rival, 2 gimnasios con medalla, entrenadores que te ven y vienen a retarte, guardias, regalos y final con créditos.
- Centros de Criaturas, tiendas, PC para guardar criaturas, Criaturario, mochila, ficha de entrenador, bordillos para saltar, hierba alta y cuevas con encuentros.
- Música chiptune y efectos con Web Audio, y guardado en el navegador.

## Archivos (`js/`)

| Archivo | Contenido |
|---|---|
| `data.js` | Tipos, movimientos, criaturas y objetos |
| `maps.js` | Mapas, NPC, entrenadores y edificios |
| `art.js` | Pixel art procedural (criaturas, personajes, tiles, edificios) |
| `audio.js` | Música y efectos de sonido |
| `mons.js` | Estadísticas, niveles y evoluciones |
| `ui.js` | Textos, menús y pantallas |
| `battle.js` | Sistema de combate |
| `world.js` | Movimiento, eventos e historia |
| `main.js` | Arranque, controles, título y guardado |
