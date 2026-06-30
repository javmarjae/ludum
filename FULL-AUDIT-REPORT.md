# SEO Audit — ludumgames.es
**Fecha:** 2026-07-01  
**Herramienta:** Agentic SEO Skill v3.0.1  
**URL auditada:** https://ludumgames.es  

---

## Puntuación global estimada: 54 / 100 — Needs Improvement

| Categoría | Peso | Puntuación | Notas |
|-----------|------|-----------|-------|
| Technical SEO | 25% | 52 | Dominio correcto, HTTPS OK, falta canonical en home |
| On-Page SEO | 15% | 60 | Metadata parcial, og:image ausente en home |
| Schema / Structured Data | 15% | 72 | BoardGame JSON-LD en juegos (confirmado en prod) |
| Content Quality | 20% | 45 | Home muy thin (63 palabras), no hay llms.txt |
| Performance (CWV) | 10% | N/A | API de PageSpeed con rate limit — sin datos |
| Image Optimization | 10% | 65 | lazy loading parcial, falta width/height en imágenes |
| AI Search Readiness (GEO) | 5% | 20 | Sin llms.txt, crawlers de IA no gestionados |

---

## 🔴 Críticos — Corregir inmediatamente

### C1 · Dominio incorrecto en robots.ts, sitemap.ts y layout.tsx
**Evidencia:** El `robots.txt` en producción apunta a `https://ludum.es/sitemap.xml`. `ludum.es` tiene certificado SSL inválido (self-signed) — no es el dominio correcto.  
**Impacto:** Google no puede indexar el sitemap. Si indexa `ludum.es` como canónico, `ludumgames.es` pierde autoridad.  
**Fix:** ✅ Corregido hoy en todos los archivos — `metadataBase`, `robots.ts`, `sitemap.ts` y canonical de juegos ahora apuntan a `https://ludumgames.es`.  
**Confianza:** Confirmed

---

### C2 · Sin canonical en la homepage
**Evidencia:** `parse_html.py` devuelve `"canonical": null` para `https://ludumgames.es`.  
**Impacto:** Si Google ve contenido duplicado entre `ludumgames.es/` y versiones con `www.` o `http://`, no sabe cuál es la URL maestra.  
**Fix:** Añadir `alternates: { canonical: 'https://ludumgames.es' }` al metadata de `app/page.tsx`.  
**Confianza:** Confirmed

---

### C3 · Sin og:image en la homepage
**Evidencia:** `social_meta.py` → `"og_missing": ["og:image", "og:url"]`. Score OG: 62/100.  
**Impacto:** Al compartir el enlace en WhatsApp, Twitter/X, LinkedIn — no aparece imagen. CTR social muy bajo.  
**Fix:** Crear imagen estática `/public/og-home.png` (1200×630px) y añadirla al metadata de `app/layout.tsx`.  
**Confianza:** Confirmed

---

## ⚠️ Warnings — Corregir en el próximo mes

### W1 · 5 cabeceras de seguridad ausentes (score: 45/100)
**Evidencia:** `security_headers.py` confirma ausencia de: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Solo está `HSTS` (sin `includeSubDomains`).  
**Impacto:** Señal negativa de confianza para Google. Vulnerabilidad a clickjacking y XSS. Penalización potencial de Chrome.  
**Fix:** Añadir en `next.config.js` → `headers()`:
```js
{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
{ key: 'X-Content-Type-Options', value: 'nosniff' },
{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
```
**Confianza:** Confirmed

---

### W2 · Sin llms.txt — IA Search Readiness: 20/100
**Evidencia:** `llms_txt_checker.py` → HTTP 404.  
**Impacto:** ChatGPT, Perplexity y Claude no tienen una forma estructurada de entender qué es Ludum. Páginas de juego pueden no aparecer en respuestas de IA.  
**Fix:** Crear `/public/llms.txt` con descripción del site, páginas clave y propósito.  
**Confianza:** Confirmed

---

### W3 · Crawlers de IA no gestionados explícitamente en robots.txt
**Evidencia:** `robots_checker.py` → 11 crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended...) heredan reglas de `*` sin declaración explícita.  
**Impacto:** Falta de control sobre qué IAs rastrean el contenido. Importante para el roadmap de GEO/AEO.  
**Fix:** Añadir en `app/robots.ts` reglas explícitas para crawlers de IA.  
**Confianza:** Confirmed

---

### W4 · og:url y og:description demasiado corto en homepage
**Evidencia:** `social_meta.py` → `og:url` ausente, `og:description` = 43 chars (mínimo 50).  
**Impacto:** Previews sociales incompletos. Twitter/X puede truncar o mostrar descripción vacía.  
**Fix:** Añadir `openGraph: { url: 'https://ludumgames.es', description: '...' }` con ≥50 chars.  
**Confianza:** Confirmed

---

### W5 · Enlaces a juegos sin texto ancla
**Evidencia:** `parse_html.py` → 15 de 16 links a `/juegos/[id]` desde la homepage tienen `"text": ""` (solo imagen, sin texto alternativo contextual).  
**Impacto:** Google usa el texto ancla para entender el tema de la página destino. Links vacíos diluyen la señal semántica.  
**Fix:** Envolver cada tarjeta de juego en un `<span className="sr-only">{game.name}</span>` dentro del `<a>`, o asegurarse de que el `alt` de la imagen llega al link.  
**Confianza:** Confirmed

---

### W6 · Homepage con contenido muy thin (63 palabras)
**Evidencia:** `readability.py` → 63 palabras, Flesch Reading Ease: 25.6 (muy difícil), grade 12.3.  
**Impacto:** Google puede clasificar la homepage como "thin content". Para usuarios no logueados, el valor de la página es mínimo.  
**Nota:** Es esperado en una app — la home autenticada tiene mucho más contenido. Pero para SEO, la versión pública (no logueada) es la que indexa Google.  
**Fix:** Añadir sección de texto descriptivo en la landing (features, categorías populares, texto sobre el catálogo) que sea indexable sin login.  
**Confianza:** Likely

---

### W7 · Imágenes de BGG sin width/height declarados
**Evidencia:** `parse_html.py` → todas las imágenes de juegos tienen `"width": null, "height": null`.  
**Impacto:** CLS (Cumulative Layout Shift) alto — Google penaliza el CWV. El navegador no puede reservar espacio antes de cargar la imagen.  
**Fix:** Usar `width` y `height` en el componente `<Image>` de Next.js, o definir `fill` con contenedor de tamaño fijo.  
**Confianza:** Likely

---

### W8 · No hay schema JSON-LD en la homepage
**Evidencia:** `parse_html.py` → `"schema": []` en la homepage.  
**Impacto:** Google no puede mostrar rich snippets del site en búsquedas de marca.  
**Fix:** Añadir `WebSite` schema con `SearchAction` (sitelinks searchbox) y `Organization` schema en `app/page.tsx` o `app/layout.tsx`.  
**Confianza:** Confirmed

---

## ✅ Passes

| Check | Resultado |
|-------|-----------|
| HTTPS activo | ✅ |
| Sin redirect chains (0 hops) | ✅ |
| HSTS configurado | ✅ (`max-age=63072000`) |
| robots.txt presente y válido | ✅ |
| sitemap.ts creado hoy | ✅ |
| BoardGame JSON-LD en páginas de juego | ✅ |
| Twitter card configurada | ✅ |
| og:title, og:type, og:locale presentes | ✅ |
| lang="es" en `<html>` | ✅ |
| charset UTF-8 | ✅ |
| viewport mobile configurado | ✅ |
| Favicon SVG | ✅ |
| lazy loading en imágenes off-screen | ✅ (parcial — primeras imágenes sin lazy) |
| Internal links bien estructurados | ✅ |

---

## ℹ️ Info / Limitaciones del audit

- **PageSpeed Insights**: API con rate limit durante el audit. Sin datos de LCP, INP, CLS. Ejecutar manualmente en [pagespeed.web.dev](https://pagespeed.web.dev).
- **Backlinks**: No auditados (requiere herramienta externa — Ahrefs, Search Console).
- **Playwright / Visual**: No instalado. Sin screenshots de responsividad.
- **Blog**: Sin posts publicados aún — no se pudo auditar contenido de artículos.

---

*Generado por Agentic SEO Skill v3.0.1 — LLM-first analysis con scripts de verificación*
