# 🃏 Tienda de Cartas Brisaluz

Simulador de tienda de cartas coleccionables, inspirado en los juegos de llevar una tienda y abrir sobres. Las cartas son las criaturas de **[Criaturas de Brisaluz](../criaturas/)**, ilustradas con sus modelos 3D.

- **Online:** `https://chismeh32-jpg.github.io/GameParty/cartas/`
- **En local:** sirve la carpeta del repositorio con un servidor (por ejemplo `python3 -m http.server`) y abre `/cartas/`.

La partida se guarda sola en el navegador.

## Cómo se juega

1. **📦 Pedidos:** compra sobres, cajas y accesorios al proveedor. Llegan en una hora de juego.
2. **🧺 Estanterías:** toca una estantería para elegir qué producto expone y reponerla desde el almacén.
3. **🏷️ Precios:** en el Almacén ajustas el precio de venta. Si es demasiado caro, el cliente se enfada 💢 y baja tu reputación.
4. **💳 Cobrar:** cuando haya cola en la caja, cobra.
   - Con **tarjeta** tecleas el importe exacto en el datáfono.
   - Con **efectivo** devuelves el cambio con billetes y monedas.
   - Si atiendes rápido, a veces te dejan propina.
5. **✨ Abrir sobres:** desliza el dedo sobre el sobre para rasgarlo y descubre las cartas una a una. La última es la rara y brilla si es holo o mejor.
6. **🃏 Álbum:** colecciona las tres expansiones. Puedes vender cartas online (al 80 %) o ponerlas en la **vitrina** para los coleccionistas.
7. **🌙 Noche:** al cerrar pagas el alquiler y los sueldos. Es el momento de abrir sobres y preparar el día siguiente.

## Expansiones

| Expansión | Cartas | Nivel | Sobre |
|---|---|---|---|
| Brisaluz Base (BRI) | 50 | 1 | 4 € |
| Sombras de Bruma (SOM) | 37 | 4 | 6 € |
| Leyendas del Santuario (LEY) | 34 | 8 | 14 € |

Rarezas: Común ● · Poco común ◆ · Rara ★ · Rara holo ★ · Ultra rara ★★ (arte completo) · Secreta ★★★ (dorada o arcoíris). El precio de cada carta cambia un poco cada día.

## Clientes

- **Compradores:** buscan sobres y accesorios en las estanterías.
- **Coleccionistas:** miran la vitrina y pagan bien por cartas raras.
- **Jugadores:** alquilan las mesas de juego (mejora).
- **Vendedores:** te ofrecen lotes de cartas sueltas.

## Mejoras

Estanterías, plantas, pósteres, alfombra y neón (traen más clientes), vitrina, mesas de juego, y empleados: un **cajero** que cobra solo y un **reponedor** que rellena las estanterías.

## Archivos

- `index.html`, `styles.css`: interfaz
- `cards.css`: diseño de las cartas (holo, brillo e inclinación 3D)
- `js/cards.js`: expansiones, rarezas, sobres, precios y productos
- `js/cardview.js`: HTML de cada carta
- `js/shop.js`: la tienda en pixel art, clientes y colas
- `js/opening.js`: apertura de sobres
- `js/ui.js`: paneles, caja registradora y álbum
- `js/main.js`: estado, economía, días y guardado
- `js/sfx.js`: efectos de sonido
- `art/`: ilustraciones generadas a partir de los modelos 3D de `../criaturas/models/`
- `tools/render-art.html`: herramienta que genera esas ilustraciones con Three.js

Usa también `../criaturas/js/data.js` (criaturas, tipos y movimientos), `maps.js` y `art.js` (personajes en pixel art) y `audio.js` (música).
