# SEO Action Plan — ludumgames.es
**Fecha:** 2026-07-01 | Ordenado por impacto × esfuerzo

---

## ✅ Completado

| # | Tarea | Verificación |
|---|-------|--------------|
| ✅ | Dominio correcto en robots/sitemap/canonical/JSON-LD | `ludum.es` → `ludumgames.es` en todos los archivos |
| ✅ | Canonical en homepage | `app/page.tsx` |
| ✅ | og:image dinámica (1200×630) | `app/opengraph-image.tsx` |
| ✅ | og:url + og:description ampliada | `app/layout.tsx` |
| ✅ | Cabeceras de seguridad (CSP-adjacent) | `next.config.js` — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| ✅ | llms.txt | `public/llms.txt` |
| ✅ | WebSite + Organization JSON-LD homepage | `app/page.tsx` (sitelinks searchbox) |
| ✅ | Crawlers de IA explícitos en robots.ts | GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc. |
| ✅ | Texto ancla en tarjetas de portada (aria-label) | `app/page.tsx` |
| ✅ | PageSpeed / Core Web Vitals medido con API real | Ver tabla de resultados abajo |
| ✅ | TTFB alto en `/juegos/[id]` corregido | Query migrada a `unstable_cache` (revalidate 3600s) — 1279ms → 340ms en mobile |
| ✅ | Bug de dominio roto en JSON-LD de BoardGame | Corregido junto al fix de TTFB |
| ✅ | Google Search Console verificado + sitemap enviado | Confirmado por el usuario 2026-07-01 |
| ✅ | Sitemap fallaba en GSC ("No se ha podido obtener") | Causa: misma query sin cache que el TTFB alto — migrada a `unstable_cache`. Reenvío confirmado "Correcto", 1005 páginas descubiertas |
| ✅ | Contenido indexable en homepage para no logueados | Sección "¿Qué es Ludum?" (texto ~190 palabras) + "Los juegos mejor valorados" (top 10 con nombre/año/rating enlazados) + "Categorías populares" (chips agregados de datos reales). Palabras totales: 107 → 298. H2 antes vacíos, ahora con 3 encabezados |

---

## Resultados de PageSpeed (post-fixes)

| Página | Mobile | Desktop | LCP mobile | TTFB mobile | CLS |
|---|---|---|---|---|---|
| `/` | 96 | 100 | 2701ms ⚠️ | 87ms ✅ | 0 ✅ |
| `/buscar` | 95 | 100 | 2930ms ⚠️ | 255ms ✅ | 0 ✅ |
| `/juegos/174430` | 93 | 100 | 3001ms ⚠️ | **340ms** ✅ (antes 1279ms) | 0.026 ✅ |

**Descartado del plan original:** la tarea de `width`/`height` en imágenes para reducir CLS — los datos reales muestran CLS ~0 en las tres páginas, no hay layout shift que corregir.

---

## Pendiente

### 1. LCP en mobile ligeramente por encima del umbral (2.7-3.0s vs objetivo 2.5s)
Presente en las 3 páginas por igual — no es específico de ninguna, probablemente imágenes de portada + JS del framework en conexión móvil simulada. PageSpeed señala "Reduce unused JavaScript" (270-570ms de ahorro potencial) como única pista, pero es overhead genérico de React/Next.js sin una causa aislable sin herramientas de bundle-analysis.

**Impacto:** Medio | **Esfuerzo:** requiere bundle analyzer para diagnosticar mejor

---

### 2. Monitorizar cobertura en Search Console
Con el sitemap ya enviado, revisar en 1-2 semanas:
- Páginas indexadas vs enviadas (objetivo: sin errores de cobertura)
- Core Web Vitals reales (field data) una vez haya tráfico suficiente
- Errores de rastreo si aparecen

**Impacto:** Seguimiento continuo | **Esfuerzo:** revisión periódica

---

*Generado por Agentic SEO Skill v3.0.1 — actualizado tras verificación con PageSpeed API y confirmación de Search Console*
