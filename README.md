# Sala de Juegos

Juegos de recreativa en JavaScript puro, cada uno en un solo archivo HTML (canvas, sin dependencias externas; las librerías que hacen falta van incluidas en la carpeta del juego).

Juega en línea: https://arkangeldigital-maker.github.io/pacman/

| Juego | Carpeta | Qué es |
| --- | --- | --- |
| Villa Rosquilla: Choca y Corre | [`villarosquilla/`](villarosquilla/) | Ciudad de caricatura en 3D para recorrer a pie y en coche, con misiones y persecuciones de la policía |
| Hello Kitty: El Jardín Mágico | [`hellokitty/`](hellokitty/) | Juego en 3D para niños pequeños con Hello Kitty, My Melody y Kuromi |
| Toy Story: La Gran Aventura | [`toystory/`](toystory/) | Aventura en 3D para niños pequeños con Woody, Buzz y Jessie |
| Godzilla: Choque de Titanes | [`godzilla/`](godzilla/) | Peleas de kaijus 2 contra 2 al estilo Marvel vs Capcom |
| Angry Kaijus | [`birds/`](birds/) | Al estilo Angry Birds: tirachinas y física contra las fortalezas de los Mechas |
| Godzilla Pac-Man | [`pacman/`](pacman/) | Pac-Man con Godzilla como protagonista y kaijus como enemigos |

El `index.html` de la raíz es el índice. Para añadir un juego, crea su carpeta con un `index.html` y suma una entrada a la lista `GAMES` del índice.

## Villa Rosquilla: Choca y Corre

Juego de mundo abierto inspirado en los juegos de ciudad como *The Simpsons: Hit and Run*, pero con personajes, ciudad y música propios.

- Elige a Papá Toño, Mamá Lupe, Beto o Lili y recorre Villa Rosquilla a pie o en cualquier coche (también los del tráfico)
- **A pie:** WASD o flechas · Shift correr · Espacio saltar · F patada · E subir al coche o hablar
- **En coche:** W acelerar · S frenar y reversa · A/D girar · Espacio freno de mano · H claxon · E bajar · R enderezar
- Arrastra el ratón para girar la cámara · M música · Esc pausa · en el móvil aparecen palanca y botones
- 6 misiones de historia (el ! amarillo marca quién te da la siguiente): entrega con tiempo, recoger piezas, embestir un camión, carrera contra Rayo Ramírez, cazar drones espía y una huida final con la policía
- Medidor **Choca y Corre**: si chocas coches, atropellas cosas o empujas peatones se llena y llega la policía; si te atrapan pagas multa
- Monedas por la ciudad, 20 cartas escondidas y cabinas de teléfono ☎ para pedir los coches que vas desbloqueando. El progreso se guarda en el navegador
- Three.js r160 (MIT) incluido en `villarosquilla/three.module.min.js`. Personajes, coches y ciudad están hechos con formas 3D en `villarosquilla/modelos.js` (estilo caricatura con contorno negro) y la música es original, hecha con Web Audio

## Hello Kitty: El Jardín Mágico

También pensado para niñas y niños de unos 5 años, con el mismo motor que el de Toy Story: no se puede perder y la voz del navegador lee las misiones y cuenta en español.

- Elige a Hello Kitty, My Melody o Kuromi
- **Toca el pasto** (o haz clic) para caminar · **flechas** o **WASD** · **Espacio** o el botón rojo para saltar · **M** música
- Misiones: recoger 10 corazones, encontrar a Keroppi, Pompompurin, Cinnamoroll y Pochacco (te siguen en fila) y hacer crecer 10 flores; al final, picnic con pastel
- Una flecha rosa en el pasto señala lo que falta; la pelota se puede patear
- Three.js r160 (MIT) incluido en `hellokitty/three.module.min.js`. Los personajes (en `hellokitty/personajes.js`) son versiones propias modeladas con formas 3D y la música es original, una melodía de cajita musical hecha con Web Audio

## Toy Story: La Gran Aventura

Pensado para niñas y niños de unos 5 años: no se puede perder y la voz del navegador lee en voz alta cada misión y cuenta en español.

- Elige a Woody, Buzz o Jessie
- **Toca el suelo** (o haz clic) para caminar · también **flechas** o **WASD** · **Espacio** o el botón rojo para saltar · **M** música
- Misiones: recoger 10 estrellas, encontrar a Rex, Hamm, Slinky, Forky y Lilypad (te siguen en fila) y explotar 10 globos; al final, fiesta con todos
- Una flecha amarilla en el suelo señala siempre lo que falta; la pelota se puede patear
- Gráficos 3D con [Three.js](https://threejs.org/) r160 (MIT), incluido en `toystory/three.module.min.js`. Los personajes (en `toystory/personajes.js`) son versiones propias modeladas con formas 3D, con las caras, proporciones y trajes de cada uno y la música es original, compuesta con Web Audio (no es la banda sonora de la película)

## Godzilla: Choque de Titanes

Elige dos kaijus entre Godzilla, King Ghidorah, Mechagodzilla, Rodan, Mothra y Anguirus, y pelea contra la CPU o contra otra persona en el mismo teclado.

- **J1**: `WASD` moverse · `J` golpe · `K` fuerte · `L` especial · `O` hipercombo · `U` asistente · `I` relevo
- **J2**: flechas · `,` `.` `/` golpe, fuerte, especial · `;` asistente · `'` relevo · `Shift` derecho hipercombo (o teclado numérico 1-6)
- `↓` + fuerte es el lanzador: si mantienes `↑` al conectar, saltas tras el rival para seguir el combo en el aire
- Cadenas de combo: golpe → fuerte → lanzador o especial → hipercombo
- La barra de hiper llega hasta nivel 3; cada hipercombo gasta un nivel
- El compañero en reserva recupera la vida roja; el asistente entra, lanza su especial y se va
- `Esc` pausa · `M` sonido · en el móvil aparecen botones táctiles

## Angry Kaijus

Arrastra el kaiju hacia atrás en el tirachinas y suéltalo. En pleno vuelo, toca la pantalla (o `Espacio`) para usar su poder:

- **Godzilla**: pulso nuclear que hace volar todo lo que tiene cerca
- **Rodan**: picada supersónica a doble velocidad
- **Ghidorah**: se divide en tres; rompe muy bien el cristal
- **Anguirus**: se hace bola de pinchos y cae a plomo; ideal contra la piedra

6 niveles con madera, cristal y piedra. Las estrellas dependen de los kaijus que te sobren y se guardan en el navegador. La física usa [Matter.js](https://brm.io/matter-js/) (MIT), incluido en `birds/matter.min.js`. `R` repite el nivel, `Esc` pausa, `M` sonido.

## Godzilla Pac-Man

- **Flechas** o **WASD**: moverse · **Espacio** / **Enter**: empezar · **P**: pausa · **M**: sonido
- En móvil: desliza el dedo sobre el tablero o usa la cruceta
- Laberinto clásico de 28 × 31, cuatro kaijus con la inteligencia de los fantasmas originales, píldoras de poder con aliento atómico, frutas, vidas y récord guardado
