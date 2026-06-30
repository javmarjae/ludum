# SEO Action Plan — ludumgames.es
**Fecha:** 2026-07-01 | Ordenado por impacto × esfuerzo

---

## Sprint 1 — Esta semana (Alto impacto, Bajo esfuerzo)

### [DONE] ✅ Dominio correcto en robots/sitemap/canonical
Corregido hoy: `ludum.es` → `ludumgames.es` en `robots.ts`, `sitemap.ts`, `layout.tsx`, y canonical de juegos.

---

### 1. Añadir canonical en homepage
**Archivo:** `app/page.tsx`  
**Cambio:**
```ts
export const metadata: Metadata = {
  alternates: { canonical: 'https://ludumgames.es' },
};
```
**Impacto:** Alto | **Esfuerzo:** 5 min

---

### 2. Crear og:image para la homepage
**Archivo:** `public/og-home.png` + `app/layout.tsx`  
**Cambio:** Diseñar imagen 1200×630 con logo + tagline, luego:
```ts
openGraph: {
  images: [{ url: '/og-home.png', width: 1200, height: 630, alt: 'Ludum — Recomendador de Juegos de Mesa' }],
  url: 'https://ludumgames.es',
  description: 'Descubre tu próximo juego de mesa favorito con recomendaciones personalizadas.',
}
```
**Impacto:** Alto | **Esfuerzo:** 30 min

---

### 3. Cabeceras de seguridad en next.config.js
**Archivo:** `next.config.js` (o `next.config.ts`)  
```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }];
}
```
**Impacto:** Medio-Alto | **Esfuerzo:** 15 min

---

### 4. Crear /llms.txt
**Archivo:** `public/llms.txt`
```
# Ludum

> Plataforma española para descubrir, recomendar y registrar partidas de juegos de mesa.

## Páginas clave

- /buscar — Catálogo con más de 138.000 juegos de mesa
- /recomendador — Recomendador personalizado por mecánicas, jugadores y tiempo
- /juegos/[bgg_id] — Ficha detallada de cada juego con schema BoardGame
- /blog — Artículos, reseñas y guías sobre juegos de mesa
- /eventos — Torneos y ferias cerca del usuario

## Datos

Basado en BoardGameGeek (BGG). Catálogo sincronizado diariamente.
```
**Impacto:** Medio (futuro) | **Esfuerzo:** 10 min

---

### 5. WebSite + Organization schema en homepage
**Archivo:** `app/page.tsx` (o layout.tsx)  
```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Ludum',
      url: 'https://ludumgames.es',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://ludumgames.es/buscar?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      name: 'Ludum',
      url: 'https://ludumgames.es',
      logo: 'https://ludumgames.es/logo.svg',
    },
  ],
};
```
**Impacto:** Alto (sitelinks searchbox en Google) | **Esfuerzo:** 20 min

---

## Sprint 2 — Próximas 2 semanas (Medio impacto)

### 6. Gestión explícita de crawlers de IA en robots.ts
```ts
rules: [
  { userAgent: '*', allow: '/', disallow: ['/api/', '/auth/', '/admin/'] },
  { userAgent: 'GPTBot', allow: '/' },
  { userAgent: 'ClaudeBot', allow: '/' },
  { userAgent: 'PerplexityBot', allow: '/' },
  { userAgent: 'Google-Extended', allow: '/' },
],
```
**Impacto:** Medio | **Esfuerzo:** 10 min

---

### 7. Texto ancla en tarjetas de juego de la homepage
Añadir `<span className="sr-only">{game.name}</span>` dentro de cada `<a>` de tarjeta, para que los links tengan texto semántico sin afectar el diseño visual.  
**Impacto:** Medio | **Esfuerzo:** 30 min

---

### 8. width/height en imágenes de juego
En el componente de tarjeta de juego, pasar `width={246} height={300}` al `<Image>` de Next.js para eliminar CLS.  
**Impacto:** CWV (CLS) | **Esfuerzo:** 1h

---

## Sprint 3 — Antes del lanzamiento (Largo plazo)

### 9. Contenido indexable en homepage para no logueados
Añadir sección pública con:
- Top 10 juegos más valorados (con links a fichas)
- Categorías populares (estrategia, familia, party...)
- Texto descriptivo de 200-300 palabras sobre qué es Ludum

**Impacto:** Alto (contenido thin actual: 63 palabras) | **Esfuerzo:** 2-3h

---

### 10. PageSpeed / Core Web Vitals
Ejecutar [pagespeed.web.dev](https://pagespeed.web.dev) manualmente sobre:
- `/` (homepage)
- `/buscar`
- `/juegos/174430` (Gloomhaven como referencia)

Objetivos: LCP < 2.5s, INP < 200ms, CLS < 0.1  
**Impacto:** Alto | **Esfuerzo:** Variable según resultados

---

### 11. Google Search Console
1. Verificar `ludumgames.es` en GSC
2. Enviar sitemap: `https://ludumgames.es/sitemap.xml`
3. Monitorizar errores de indexación, cobertura y CWV reales

**Impacto:** Crítico para seguimiento | **Esfuerzo:** 30 min setup

---

## Resumen de prioridades

| # | Tarea | Impacto | Esfuerzo | Sprint |
|---|-------|---------|---------|--------|
| ✅ | Dominio correcto (robots/sitemap/canonical) | 🔴 Crítico | Hecho | — |
| 1 | Canonical homepage | 🔴 Alto | 5 min | 1 |
| 2 | og:image + og:url homepage | 🔴 Alto | 30 min | 1 |
| 3 | Cabeceras de seguridad | ⚠️ Medio-Alto | 15 min | 1 |
| 4 | llms.txt | ⚠️ Medio | 10 min | 1 |
| 5 | WebSite + Organization schema | ⚠️ Alto | 20 min | 1 |
| 6 | Crawlers IA en robots | ⚠️ Medio | 10 min | 2 |
| 7 | Texto ancla tarjetas | ⚠️ Medio | 30 min | 2 |
| 8 | width/height imágenes | ⚠️ CWV | 1h | 2 |
| 9 | Contenido homepage | 🔴 Alto | 2-3h | 3 |
| 10 | PageSpeed manual | 🔴 CWV | Variable | 3 |
| 11 | Google Search Console | 🔴 Seguimiento | 30 min | 3 |

---

*Generado por Agentic SEO Skill v3.0.1*
