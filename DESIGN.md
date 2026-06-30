---
name: Ludum
description: Recomendador y tracker de juegos de mesa para grupos, en español.
colors:
  cream: "#F7EEE7"
  sand: "#D8CBBC"
  olive-ink: "#3A372F"
  sage: "#89BA86"
  forest: "#3E5E3B"
  forest-dark: "#2C4429"
  bg-card: "#FFFFFF"
  bg-inset: "#EDE4D9"
  text-2: "#57534A"
  text-3: "#7A7469"
  text-4: "#A09B93"
  brand-tint: "#E4F0E3"
  border: "rgba(216,203,188,0.7)"
  rating-high: "#16a34a"
  rating-mid: "#d97706"
  danger: "#dc2626"
  danger-tint: "rgba(220,38,38,0.08)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.75rem, 1.517rem + 0.99vw, 2.3125rem)"
    fontWeight: 700
    lineHeight: 1.189
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "clamp(0.875rem, 0.823rem + 0.22vw, 1rem)"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "clamp(0.75rem, 0.724rem + 0.11vw, 0.8125rem)"
    fontWeight: 700
    lineHeight: 1.5
rounded:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  lg2: "16px"
  xl: "20px"
  xl2: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.forest-dark}"
  button-ghost:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.md}"
    padding: "14px"
  chip:
    backgroundColor: "{colors.bg-inset}"
    textColor: "{colors.text-3}"
    rounded: "{rounded.xs}"
    padding: "2px 7px"
---

# Design System: Ludum

## 1. Overview

**Creative North Star: "El sommelier de juegos de mesa"**

Ludum es una herramienta para gente que ya conoce el hobby: rápida de escanear, densa en datos útiles (rating, jugadores, duración, complejidad) pero con la calidez de una revista bien diseñada, no la frialdad de un panel de administración. La paleta verde bosque sobre crema/arena evoca mesa de madera y tapete, sin caer en lo temático/literal. Las sombras son planas y "editoriales" — un borde implícito de 1px más una sombra mínima — nunca el `box-shadow` difuso y genérico de una plantilla SaaS.

Rechaza explícitamente: estética "gamer" (RGB, neón, fuentes futuristas), plantillas SaaS genéricas (cards idénticas, gradientes decorativos, eyebrows en mayúsculas, hero-metric template) y tono infantil/cartoon pese al tema lúdico.

**Key Characteristics:**
- Verde bosque + crema/arena, con tema oscuro espejo completo (no un ajuste superficial).
- Sombras planas con borde implícito, nunca difusas/flotantes por defecto.
- Tipografía display serif (Playfair) solo en títulos; cuerpo en sans cálida (Urbanist).
- Densidad de información alta pero ordenada: badges, chips y ratings hacen el trabajo pesado.
- Mobile-first real: bottom nav, sidebar colapsable, grids que se reordenan, no solo se encogen.

## 2. Colors

Paleta restringida y cálida: un acento (verde bosque) que carga la marca, neutros con leve tinte cálido, ratings en semáforo (verde/ámbar/gris) como único uso de color fuera de marca.

### Primary
- **Forest** (`#3E5E3B`): acento de marca — CTAs primarios, enlaces activos, iconografía seleccionada, foco. En oscuro se invierte a **Sage** (`#89BA86`) para mantener contraste sobre fondo casi negro.

### Neutral
- **Cream** (`#F7EEE7`): fondo base de la app (claro).
- **White / Bg-card** (`#FFFFFF`): superficie de tarjetas, inputs, nav.
- **Bg-inset** (`#EDE4D9`): fondo de chips, badges, filas hover — un nivel "hundido" respecto a la tarjeta.
- **Olive ink** (`#3A372F`): texto principal.
- **Text-2/3/4** (`#57534A` / `#7A7469` / `#A09B93`): jerarquía descendente de texto secundario, nunca gris puro.
- **Sand border** (`rgba(216,203,188,0.7)`): el "borde implícito" que sustituye a la sombra difusa en casi todos los componentes.

### Named Rules
**La Regla del Borde Implícito.** Ninguna tarjeta o botón flota sobre un `box-shadow` difuso por defecto. Cada superficie lleva `0 1px 3px rgba(58,55,47,0.07), 0 0 0 1px rgba(216,203,188,0.8)` — una sombra casi imperceptible más un borde de 1px del color de fondo. La elevación real (`--shadow-card-hover`) solo aparece en hover/foco, nunca en reposo.

**La Regla del Semáforo.** El color fuera de la paleta de marca se reserva para una sola cosa: el rating de un juego (`#16a34a` ≥8, `#d97706` ≥7, gris el resto). No se usa color decorativo en ningún otro sitio sin justificación semántica equivalente.

## 3. Typography

**Display Font:** Playfair Display (con fallback Georgia, serif)
**Body Font:** Urbanist (con fallback system-ui, sans-serif)

**Character:** Pareja de contraste clásica — serif editorial para títulos que da peso y carácter a "Ludum", sans geométrica-cálida para todo lo funcional (cuerpo, labels, UI). Nunca mezclar: los `h1`–`h6` siempre llevan `var(--font-display)`; el resto siempre Urbanist.

### Hierarchy
- **Display / H1** (700, `clamp(1.75rem, …, 2.3125rem)` ≈ 28→37px, lh 1.189): título de página, nombre de marca en nav.
- **H2** (700-800, `clamp(1.3125rem, …, 1.75rem)` ≈ 21→28px): cabeceras de sección.
- **H3** (700, `clamp(1.0625rem, …, 1.3125rem)` ≈ 17→21px): títulos de tarjeta/componente.
- **Body1** (500, `clamp(0.875rem, …, 1rem)` ≈ 14→16px, lh 1.5): texto de contenido principal.
- **Body2 / Label** (600-700, `clamp(0.75rem, …, 0.8125rem)` ≈ 12→13px): metadatos, badges, chips, labels de formulario.
- **Caption** (500, `clamp(0.625rem, …, 0.73125rem)` ≈ 10→11.7px): timestamps, microcopy.

### Named Rules
**La Regla de la Escala Fluida.** Todo tamaño de fuente usa `clamp()` con los tokens `--fs-*` ya definidos en `globals.css`, nunca un `px` fijo nuevo. Si un componente necesita un tamaño que no está en la escala, se añade el token, no un valor suelto.

## 4. Elevation

Sistema plano por defecto con sombra-borde implícita (ver Regla del Borde Implícito). La profundidad real es una respuesta a estado (hover, foco, drag), no un adorno permanente.

### Shadow Vocabulary
- **`--shadow-card`** (`0 1px 3px rgba(58,55,47,.07), 0 0 0 1px rgba(216,203,188,.8)`): estado de reposo de cualquier tarjeta, input o panel.
- **`--shadow-card-hover`** (`0 4px 16px rgba(58,55,47,.10), 0 0 0 1px rgba(216,203,188,1)`): hover/foco de tarjetas interactivas.
- **`--shadow-btn`** (`0 1px 2px rgba(58,55,47,.08), 0 0 0 1px rgba(216,203,188,.9)`): botones secundarios/ghost.
- **`--shadow-btn-brand`** (`0 2px 8px rgba(62,94,59,.28), 0 1px 2px rgba(62,94,59,.18)`): CTAs primarios — la única sombra coloreada del sistema.

### Named Rules
**La Regla Plano-por-Defecto.** Si un componente nuevo necesita destacar, primero se prueba con `--shadow-card-hover` en estado activo antes de inventar una sombra nueva.

## 5. Components

### Buttons
- **Shape:** radio 8px (`--rounded-sm`) en casi todos los botones; pill (999px) solo en chips de filtro y badges.
- **Primary:** fondo `--brand`, texto blanco, `--shadow-btn-brand`, padding `8px 16px`–`12px 24px` según contexto.
- **Ghost/Secondary:** fondo `--bg-card`, texto `--text-2`, `--shadow-btn` (el borde implícito hace de contorno).
- **Hover/Focus:** transición de 0.12–0.2s en `background`/`box-shadow`/`transform`; nunca instantáneo, nunca >0.3s.

### Chips / Badges
- **Style:** fondo `--bg-inset`, texto `--text-3`, radio 4-8px, padding `2px 7px`–`4px 10px`, fuente 700 11-12px.
- **State activo:** fondo `--brand`, texto blanco (ver `buscar-chip-btn[data-active]`).

### Cards / Containers
- **Corner Style:** 10-20px según tamaño del contenedor (chip interno más cerrado, card de página más abierto).
- **Background:** `--bg-card` sobre `--bg`.
- **Shadow Strategy:** ver Elevation.
- **Border:** ninguno explícito — el borde vive dentro de la sombra (`--shadow-card`).
- **Internal Padding:** 14-24px.

### Inputs / Fields
- **Style:** fondo `--bg-card`, `--shadow-input` (borde implícito + inset sutil), radio 10-14px.
- **Focus:** borde sólido `--brand` de 2px + halo `0 0 0 4px rgba(62,94,59,.08)` combinado con `--shadow-card`.

### Navigation
- Top nav (`.app-nav`): sticky, blur de fondo, se oculta entera cuando hay sidebar (usuario logueado). Sidebar (`.app-sidebar`) en desktop, bottom nav fijo de 62px en móvil (`<640px`). Item activo: fondo `--brand-tint` + texto `--brand`.

### Skeleton / Loading
- `.skeleton`: pulso de opacidad 1↔0.55 cada 1.6s — usado en todos los `loading.tsx` para mantener el layout estable mientras cargan datos (patrón ya consolidado en `/recomendador`, extendido ahora a `/buscar`).

## 6. Do's and Don'ts

### Do:
- **Do** reutilizar las CSS vars de `globals.css` (`--brand`, `--bg-card`, `--shadow-card`, `--fs-*`) en cualquier componente nuevo o retocado.
- **Do** comprobar cada cambio visual en `[data-theme="dark"]` además de claro.
- **Do** usar `--shadow-card` en reposo y `--shadow-card-hover` solo como respuesta a interacción.
- **Do** mantener el contraste de texto secundario por encima de 4.5:1 incluso sobre `--bg-inset`.
- **Do** usar Suspense + skeleton (`loading.tsx`) para cualquier carga de datos que pueda tardar, como ya se hizo en `/buscar`.

### Don't:
- **Don't** usar gradientes decorativos en texto (`background-clip: text`) ni `border-left`/`border-right` de color como acento de tarjeta.
- **Don't** introducir grids de cards idénticas, eyebrows en mayúsculas sobre cada sección, ni el "hero-metric template" — son los anti-patrones SaaS genéricos que este proyecto rechaza explícitamente.
- **Don't** usar estética "gamer" (RGB, neón, fuentes futuristas) ni un tono infantil/cartoon — la audiencia es adulta y experta en el hobby.
- **Don't** animar `width`/`height`/`top`/`left` cuando `transform`/`opacity` consigue el mismo efecto.
- **Don't** enviar una animación sin alternativa `@media (prefers-reduced-motion: reduce)`.
