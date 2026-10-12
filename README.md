# Sala de Juegos

Juegos de recreativa en JavaScript puro, cada uno en un solo archivo HTML (canvas, sin dependencias).

Juega en línea: https://arkangeldigital-maker.github.io/pacman/

| Juego | Carpeta | Qué es |
| --- | --- | --- |
| Godzilla: Choque de Titanes | [`godzilla/`](godzilla/) | Peleas de kaijus 2 contra 2 al estilo Marvel vs Capcom |
| Godzilla Pac-Man | [`pacman/`](pacman/) | Pac-Man con Godzilla como protagonista y kaijus como enemigos |

El `index.html` de la raíz es el índice. Para añadir un juego, crea su carpeta con un `index.html` y suma una entrada a la lista `GAMES` del índice.

## Godzilla: Choque de Titanes

Elige dos kaijus entre Godzilla, King Ghidorah, Mechagodzilla, Rodan, Mothra y Anguirus, y pelea contra la CPU o contra otra persona en el mismo teclado.

- **J1**: `WASD` moverse · `J` golpe · `K` fuerte · `L` especial · `O` hipercombo · `U` asistente · `I` relevo
- **J2**: flechas · `,` `.` `/` golpe, fuerte, especial · `;` asistente · `'` relevo · `Shift` derecho hipercombo (o teclado numérico 1-6)
- `↓` + fuerte es el lanzador: si mantienes `↑` al conectar, saltas tras el rival para seguir el combo en el aire
- Cadenas de combo: golpe → fuerte → lanzador o especial → hipercombo
- La barra de hiper llega hasta nivel 3; cada hipercombo gasta un nivel
- El compañero en reserva recupera la vida roja; el asistente entra, lanza su especial y se va
- `Esc` pausa · `M` sonido · en el móvil aparecen botones táctiles

## Godzilla Pac-Man

- **Flechas** o **WASD**: moverse · **Espacio** / **Enter**: empezar · **P**: pausa · **M**: sonido
- En móvil: desliza el dedo sobre el tablero o usa la cruceta
- Laberinto clásico de 28 × 31, cuatro kaijus con la inteligencia de los fantasmas originales, píldoras de poder con aliento atómico, frutas, vidas y récord guardado
