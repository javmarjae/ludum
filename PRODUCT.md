# Product

## Register

product

## Users

Aficionados a los juegos de mesa en España/Latinoamérica (interfaz en español) que juegan en grupo: parejas, cuadrillas de amigos, clubes. Llegan a Ludum en dos momentos distintos: (1) decidiendo qué jugar antes de quedar (recomendador, buscador), y (2) después de jugar, registrando la partida y viendo estadísticas con su grupo (tracker). Usuarios de nivel medio-alto en el hobby — conocen BoardGameGeek, mecánicas, complejidad — no son principiantes que necesiten todo explicado.

## Product Purpose

Combina un recomendador de juegos de mesa (según grupo, nº jugadores, duración, dificultad) con un tracker de partidas por grupo (quién ganó, puestos, estadísticas, colección). Catálogo sincronizado desde BoardGameGeek (138k+ juegos). Éxito = el grupo vuelve a Ludum cada vez que va a jugar, no solo una vez.

## Medición de activación y retención

La unidad de retención es el **grupo que vuelve a registrar partidas**. No se añaden eventos ni identificadores personales: el informe usa las marcas de tiempo y relaciones ya existentes en `groups` y `plays`.

- **Activación D7:** grupos cuya primera partida se registra (`plays.created_at`) dentro de los 7 días posteriores a `groups.created_at`, dividido por grupos con una ventana completa de 7 días.
- **Repetición D7/D30:** grupos con otra fila de `plays` registrada dentro de los 7 o 30 días posteriores a la primera, dividido por grupos cuya primera partida ya tuvo una ventana completa de observación.
- Se usa `plays.created_at`, no `played_at`, para que las partidas históricas cargadas tarde no parezcan retornos recientes.
- Las tasas se ocultan cuando hay menos de 5 grupos elegibles; se muestran los conteos agregados.
- Ejecutar `npm run measure-retention` para consultar el proyecto Supabase configurado en `.env.local`. El script es de solo lectura, solo consulta IDs y fechas, agrega en memoria y no escribe resultados.

**Límites:** el esquema borra en cascada las partidas al borrar un grupo, por lo que los grupos eliminados no aparecen en cohortes históricas y la retención puede quedar sobreestimada. La métrica mide volver a **registrar** en Ludum, no si el grupo jugó fuera de la plataforma.

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
