# 🌾 Granja Simulador

Simulador de granja para el navegador, pensado para jugar en el móvil. No necesita instalación ni dependencias: solo HTML, CSS y JavaScript.

## Cómo jugarlo

- **En local:** abre `index.html` en el navegador.
- **En GitHub Pages** (con Pages activado en la rama `main`): `https://chismeh32-jpg.github.io/GameParty/`

La partida se guarda sola en el navegador.

## Mecánicas

| | |
|---|---|
| 🌱 **Cultivos** | 9 semillas (trigo, cebolla, zanahoria, col, maíz, tomate, fresa, calabaza y sandía). Cada una tiene su coste, días de crecimiento y estaciones. El tomate y la fresa vuelven a dar fruto. |
| 💧 **Riego** | Los cultivos solo crecen los días que se riegan. Si pasan 3 días sin agua, se secan. La lluvia y la nieve riegan solas. |
| 🍂 **Estaciones** | Primavera, verano, otoño e invierno, de 7 días cada una. Al cambiar de estación se marchitan los cultivos que no son de temporada. |
| ⏰ **Tiempo** | Cada día va de 06:00 a 24:00 (60 s reales). Si no duermes antes de medianoche, te desmayas y despiertas con media energía. |
| ⚡ **Energía** | Sembrar, regar, cosechar, limpiar y mimar animales gastan energía. Dormir la recupera. |
| 🐔 **Animales** | Gallinas, ovejas, vacas y cerdos. Cada noche comen pienso y producen huevos, lana, leche o trufas. Si están felices pueden producir el doble, y si están tristes no producen. |
| 🏪 **Mercado** | Los precios cambian cada día. Los productos fuera de temporada se pagan mejor y, a veces, hay feria con un producto a precio doble. |
| 🌦️ **Eventos** | Lluvia, tormentas con rayos, cuervos que se comen los cultivos... |
| 🔧 **Mejoras** | Más terreno, granero, corral, espantapájaros, pararrayos, cafetera (más energía) y aspersores automáticos. |
| ⭐ **Progreso** | Subes de nivel con la experiencia y desbloqueas semillas y animales. Hay 10 logros. |

## Archivos

- `index.html`: estructura de la interfaz
- `styles.css`: estilos, con modo claro y oscuro
- `game.js`: lógica del juego (datos, simulación diaria, guardado y render)

Para ajustar el equilibrio del juego, modifica las tablas `CROPS`, `ANIMALS`, `PRODUCTS` y `UPGRADES` al principio de `game.js`.
