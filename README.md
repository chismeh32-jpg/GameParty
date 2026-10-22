# 🌾 Granja Simulador

Simulador de granja en 2D al estilo Stardew Valley para el navegador. Funciona en el móvil (joystick y botón táctil) y en el ordenador (teclado y ratón). No necesita instalación ni dependencias: todo el pixel art se dibuja con código.

## Cómo jugarlo

- **Online (GitHub Pages):** `https://chismeh32-jpg.github.io/GameParty/`
- **En local:** abre `index.html` en el navegador.

La partida se guarda sola en el navegador.

## Controles

| | Móvil | Ordenador |
|---|---|---|
| Moverse | Joystick | WASD o flechas |
| Usar / interactuar | Botón **A** o tocar una casilla cercana | Espacio, E o clic en una casilla cercana |
| Ir a un sitio | Tocar una casilla lejana | Clic en una casilla lejana |
| Cambiar herramienta | Barra inferior | Teclas 1-9 |
| Menú | 🎒 | Esc |

## La granja

| Lugar | Para qué sirve |
|---|---|
| 🏠 **Casa** | Dormir y pasar al día siguiente |
| 📦 **Caja de envíos** | Vender cultivos y productos (los precios cambian cada día) |
| 🌱 **Huerto** | Arar con la azada, sembrar y regar |
| 💧 **Estanque** | Rellenar la regadera |
| 🐮 **Establo y corral** | Comprar animales y pienso. Acaricia a tus animales y recoge sus productos en el corral |
| 🔧 **Taller** | Mejoras: más terreno, regadera más grande, granero, establo, espantapájaros, pararrayos, cafetera y aspersores |
| 📋 **Tablón** | Logros y estadísticas |

## Mecánicas

- **Cultivos:** hay 9 semillas, cada una con sus estaciones. El tomate y la fresa vuelven a dar fruto. Sin agua durante 3 días, el cultivo se seca.
- **Estaciones:** duran 7 días cada una y cambian los colores del mapa. Al cambiar de estación se marchitan los cultivos que no son de temporada.
- **Tiempo:** el día va de 06:00 a 24:00 (2,5 minutos reales) y se hace de noche. Si no duermes antes de medianoche, te desmayas.
- **Clima:** lluvia y nieve riegan el huerto. Las tormentas pueden quemar un cultivo con un rayo y los cuervos se comen cultivos si no tienes espantapájaros.
- **Animales:** gallinas, ovejas, vacas y cerdos. Comen pienso cada noche y, si están contentos, dejan huevos, lana, leche o trufas para recoger.
- **Progreso:** subes de nivel con la experiencia, desbloqueas semillas y animales y hay 10 logros.

## Archivos

- `index.html`: interfaz (HUD, barra de herramientas, controles y paneles)
- `styles.css`: estilos
- `data.js`: datos del juego y del mapa (cultivos, animales, mejoras, edificios...)
- `sprites.js`: pixel art dibujado con código
- `game.js`: simulación, movimiento, render y guardado
- `sw.js`: borra la caché de la antigua app Party Games en los móviles que la tenían instalada

Para ajustar el equilibrio del juego, modifica las tablas de `data.js`.
