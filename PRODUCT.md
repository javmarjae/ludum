# Product

## Register

product

## Users

Aficionados a los juegos de mesa en España/Latinoamérica (interfaz en español) que juegan en grupo: parejas, cuadrillas de amigos, clubes. Llegan a Ludum en dos momentos distintos: (1) decidiendo qué jugar antes de quedar (recomendador, buscador), y (2) después de jugar, registrando la partida y viendo estadísticas con su grupo (tracker). Usuarios de nivel medio-alto en el hobby — conocen BoardGameGeek, mecánicas, complejidad — no son principiantes que necesiten todo explicado.

## Product Purpose

Combina un recomendador de juegos de mesa (según grupo, nº jugadores, duración, dificultad) con un tracker de partidas por grupo (quién ganó, puestos, estadísticas, colección). Catálogo sincronizado desde BoardGameGeek (138k+ juegos). Éxito = el grupo vuelve a Ludum cada vez que va a jugar, no solo una vez.

## Brand Personality

Cálido-editorial **y** minimalista-experto a la vez: cuidado como una revista de juegos de mesa bien diseñada (calidez, tipografía con carácter, espacio para respirar), pero denso y serio en la información cuando hace falta — sin relleno decorativo, sin tono infantil. Como un sommelier de juegos de mesa: cercano, pero con criterio. Voz en español natural, sin tecnicismos innecesarios.

## Anti-references

- Estética "gamer" genérica: RGB, neones, fuentes futuristas, esquinas agresivas.
- Plantilla SaaS genérica: cards idénticas en grid, gradientes decorativos, iconos en círculo repetidos, eyebrows en mayúsculas sobre cada sección, hero-metric template.
- Demasiado infantil / cartoon: pese a que el tema son "juegos", la audiencia es adulta y el tono no debe leerse como app para niños.

## Design Principles

1. **El sistema de diseño existente manda**: paleta verde bosque (`--forest #3E5E3B`) + crema/arena (`--cream #F7EEE7`), sombras planas editoriales (`--shadow-card`), escala tipográfica fluida ya en `globals.css` — extender y refinar, no sustituir.
2. **Información antes que decoración**: ratings, jugadores, duración, complejidad son los datos que el usuario escanea para decidir — la jerarquía visual debe priorizarlos sobre adornos.
3. **Calidez sin infantilismo**: color cálido y tono cercano, pero con la densidad de información y precisión de una herramienta para expertos del hobby.
4. **Coherencia entre claro y oscuro**: toda mejora debe funcionar igual de bien en `[data-theme="dark"]`, no solo en el tema por defecto.
5. **Movimiento con propósito**: las animaciones deben comunicar relación causa-efecto (qué cambió, qué se puede hacer) — nunca decorativas porque sí.

## Accessibility & Inclusion

WCAG AA: contraste ≥4.5:1 en texto de cuerpo, ≥3:1 en texto grande; navegación completa por teclado; `prefers-reduced-motion` respetado en toda animación nueva.
