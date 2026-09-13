# Auditoría SEO completa — moonbeautyval.com

**Fecha:** 2026-09-13
**Tipo de negocio detectado:** E-commerce (skincare coreano/K-Beauty), híbrido con capa de delivery local (Valencia + Naguanagua, Carabobo, Venezuela), checkout coordinado por WhatsApp, sin tienda física.
**Páginas indexables auditadas:** 127/127 (1 home, 1 `/products`, 12 categorías, 108 productos, `/categorias`, 4 legales).
**Metodología:** crawl completo del sitemap en producción, fetch HTTP directo + renderizado (Playwright/Lighthouse), lectura de código fuente en `C:\Users\HP\Desktop\MoonBeauty`, y 11 subagentes especializados (`seo-technical`, `seo-content`, `seo-schema`, `seo-sitemap`, `seo-performance`, `seo-visual`, `seo-geo`, `seo-sxo`, `seo-local`, `seo-ecommerce`, `seo-backlinks`) más 2 verificaciones manuales adicionales (imágenes, integridad de contenido).

---

## Resumen ejecutivo

### SEO Health Score: **52 / 100**

| Categoría | Peso | Puntaje |
|---|---|---|
| Technical SEO | 22% | 68 |
| Content Quality | 23% | 52 |
| On-Page SEO | 20% | 48 |
| Schema / Structured Data | 10% | 35 |
| Performance (CWV) | 10% | 41 |
| AI Search Readiness (GEO) | 10% | 50 |
| Images | 5% | 65 |

**Lectura del puntaje:** el sitio tiene una base técnica genuinamente sólida (SSR real, seguridad reforzada, sitemap limpio, metadatos únicos por página) que un competidor promedio en este mercado no tiene. Lo que baja el puntaje no son problemas de infraestructura sino **contenido estructural ausente**: no hay `<h1>` en 123 de 127 páginas, no hay datos estructurados de producto en ninguna de las 108 fichas, y no existe una sola página que diga de forma extraíble qué es el negocio, dónde opera y cómo funciona el delivery. Son arreglos de alto impacto y, en su mayoría, bajo esfuerzo — no un rediseño.

Dos hallazgos adicionales, evaluados con métricas propias fuera del Health Score ponderado, confirman la misma historia desde ángulos distintos:
- **GEO Readiness Score: 50/100** — el sitio está técnicamente abierto a todos los crawlers de IA (Googlebot, OAI-SearchBot, PerplexityBot, Claude-SearchBot, bingbot, Applebot — probado en vivo, 200 idéntico en los 12), pero no hay casi nada citable en el HTML.
- **SXO Gap Score: 38/100** — un análisis inverso de 5 búsquedas reales de compradoras muestra que, incluso cuando el tipo de página es el correcto (categoría, producto, home), la plantilla omite casi todos los elementos con los que ganan las páginas que sí rankean hoy.

### Top 5 problemas críticos

1. **Cero `<h1>` en 123 de 127 páginas en vivo.** Ya existe un fix escrito y verificado localmente (svelte-check 0 errores, probado en servidor de desarrollo) para las 4 plantillas más importantes — **pero no está commiteado ni desplegado**. Es el arreglo de mayor apalancamiento del sitio y ya está listo.
2. **Cero datos estructurados `Product`/`Offer` en las 108 fichas de producto.** Bloquea resultados enriquecidos de precio/disponibilidad en Google, Shopping, y las superficies de compra de ChatGPT/Perplexity/Bing Copilot. Todos los datos necesarios (marca, precio USD, disponibilidad) ya están en el HTML renderizado.
3. **Bug de integridad de datos confirmado en `/products/1`:** la página de un protector solar en barra TOCOBO muestra literalmente la descripción de una bruma facial de Dr. Althea — un producto y marca completamente distintos. Se propaga al meta description y a la vista previa de WhatsApp.
4. **No existe contenido de legitimidad del negocio en ningún lugar del sitio.** "Naguanagua" aparece 0 veces en las 127 páginas; no hay página "Nosotros"; el enlace "Saber más" de la portada apunta al catálogo en vez de a información real sobre el negocio.
5. **Página de desarrollo abandonada, viva e indexable en `/contacts`** — el cuerpo entero dice "Esta es la ruta de contactos", sin `<title>`.

### Top 5 quick wins (bajo esfuerzo, alto impacto)

1. **Commitear y desplegar el fix de `<h1>`** ya escrito en el working tree — no requiere código nuevo.
2. **Desplegar el fix de truncado por límite de palabra** en `recortar()` (`src/lib/seo.ts`) — ya parcheado durante esta auditoría, corrige el corte a mitad de palabra en 116 de 127 meta descriptions con un solo cambio de función.
3. **Desplegar la corrección gramatical** en la meta description de `/privacidad` ("cómo los proteges" → "cómo los protegemos") — ya parcheada durante esta auditoría.
4. **Agregar la URL del Perfil de Negocio de Google** (ya guardada en `configuracion.ts` como `googlePerfilUrl`) al arreglo `sameAs` del JSON-LD — cero datos nuevos necesarios.
5. **Mostrar la descripción de categoría que ya existe** (`descripcionCategoria()`) como párrafo visible en las 12 páginas `/products?categoria=X` — hoy solo vive en la etiqueta meta, nunca se renderiza.

---

## Trabajo ya realizado durante esta auditoría

Tres arreglos de código se identificaron como bugs mecánicos, sin ambigüedad y sin necesidad de inventar contenido, y se corrigieron directamente en el código fuente **durante esta sesión** (verificados con `svelte-check`, 0 errores):

| Archivo | Cambio | Estado |
|---|---|---|
| `src/routes/+page.svelte`, `src/routes/products/+page.svelte`, `src/routes/categorias/+page.svelte`, `src/routes/products/[id]/+page.svelte` | `<p>` → `<h1>` en el encabezado principal de cada plantilla | **Sin commitear, sin desplegar** |
| `src/lib/seo.ts` (`recortar()`) | Corte por límite de palabra en vez de corte duro por caracteres | **Sin commitear, sin desplegar** |
| `src/routes/privacidad/+page.server.ts` | "cómo los proteges" → "cómo los protegemos" | **Sin commitear, sin desplegar** |

**Ninguno de estos cambios se ha commiteado ni desplegado a producción** — están únicamente en el working tree local, siguiendo la práctica de no hacer commit sin pedirlo explícitamente. Cuando quieras, dime y los subo.

**Lo que NO se corrigió, deliberadamente:** la descripción incorrecta de `/products/1` (TOCOBO vs. Dr. Althea) y el contenido faltante de `/contacts`. Ambos requieren una decisión de contenido — no son bugs de código con una única solución correcta, y fabricar copy de producto o texto de contacto no es algo que deba hacer sin tu input. Estos quedan documentados con evidencia completa en `findings/content-integrity-product1.md` y en el plan de acción, listos para que los resuelvas desde el panel de administración.

---

## Technical SEO — 68/100

Ver `findings/technical.md` para el detalle completo. Fortalezas: SSR real y verificado, sitemap y robots.txt correctos, canonicals impecables, cabeceras de seguridad (CSP, HSTS, Permissions-Policy, etc.) confirmadas en vivo en producción. Problemas: el bug de `<h1>` (crítico, ya resuelto localmente), un soft-404 en IDs de producto inválidos, cero dimensiones en imágenes (riesgo de CLS), e imágenes de producto servidas sin caché (`Cache-Control: private, max-age=0`).

## Content Quality — 52/100 (E-E-A-T ponderado: 45/100)

Ver `findings/content.md`. La descripción errónea en `/products/1` y la página `/contacts` abandonada son los dos hallazgos críticos. Las 12 páginas de categoría son 95-98% idénticas a `/products` en contenido — el texto diferenciador ya existe pero no se muestra. Las fichas de producto son delgadas (mediana 82 palabras únicas) sin lista de ingredientes ni modo de uso. `/categorias`, en cambio, es el mejor contenido del sitio: 485 palabras de copy genuinamente experto en K-Beauty — la prueba de que la tienda sí puede producir contenido de calidad, solo falta que llegue a las páginas que lo necesitan.

## On-Page SEO — 48/100

Ver detalle en `audit-data.json`. Títulos y canonicals son sólidos; el defecto dominante es, otra vez, la ausencia de `<h1>` y la ausencia de marca en títulos/encabezados de producto (solo 22 de 108 páginas mencionan la marca en el contenido principal, pese a que los datos ya existen y se muestran correctamente en las tarjetas del listado).

## Schema / Structured Data — 35/100

Ver `findings/schema.md`. `OnlineStore` y `WebSite` están bien implementados y validan correctamente. La brecha real es la ausencia total de `Product`/`Offer` en 108 páginas — el agente `seo-schema` ya dejó el código exacto para implementarlo (incluye el patrón de escape ya usado en `+layout.svelte`), junto con la recomendación explícita de **no** agregar `aggregateRating`/`Review` fabricados, ya que las reseñas del home son curadas manualmente y no por producto.

## Performance (Core Web Vitals) — 41/100

Ver `findings/performance.md`. Datos de laboratorio (Lighthouse, sin acceso a CrUX/PSI por límite de tasa) muestran LCP y TBT en "Pobre" en las tres páginas medidas; CLS aprueba en las tres. La causa raíz es sistémica: imágenes de Firebase Storage sin redimensionar ni lazy-loading — la página `/products` sola carga 108 imágenes en resolución completa (7.98MB) de forma inmediata, sin importar la posición en pantalla.

## AI Search Readiness (GEO) — 50/100

Ver `findings/geo.md`. El sitio está técnicamente abierto a todo crawler de IA relevante (verificado con fetch en vivo, no solo lectura de robots.txt). El techo está en lo semántico: sin `Product` schema, sin `<h1>`, y sin marca en el contenido principal, un motor de IA no puede citar ni resolver la mayoría de las páginas como entidades específicas. Un dato notable: el negocio **ya tiene una entidad en el Knowledge Graph de Google** (`kgmid: /g/11ntskjjk6`) — la parte difícil ya está resuelta, y el sitio simplemente no la referencia en ningún lugar.

## Images — 65/100

Ver `findings/images.md`. El alt text en productos y logos de marca es específico y correcto. El único hallazgo real es que las ~20 imágenes del carrusel de Instagram comparten el mismo alt text genérico.

---

## Hallazgos complementarios (fuera de las 7 categorías ponderadas)

Estas tres auditorías se ejecutaron por el tipo de negocio detectado y aportan contexto adicional, pero no forman parte del cálculo del Health Score:

- **SXO (Search Experience) — 38/100** (`findings/sxo.md`): análisis inverso de 5 SERPs reales muestra que una búsqueda casi-marca ("Moon Beauty skincare coreano Valencia") no devuelve ninguna propiedad de Moon Beauty — ni el sitio ni Instagram. La persona peor atendida es la "novata en K-Beauty" (27/100) que busca una rutina paso a paso, un tipo de contenido que el sitio no tiene en absoluto.
- **Local SEO** (`findings/local.md`, cualitativo): el hallazgo más importante es que la distinción Valencia (delivery pago, coordinado por WhatsApp) / Naguanagua (delivery gratis) — el diferenciador más fuerte del negocio — solo existe dentro del flujo de checkout, que está bloqueado en `robots.txt` y es estructuralmente invisible para cualquier buscador.
- **E-commerce** (`findings/ecommerce.md`, 55/100): confirma de forma independiente el hallazgo de `/products/1` y el vacío de schema `Product`; el manejo de productos agotados (200, badge visible, sin `noindex`) está bien implementado.
- **Backlinks** (`findings/backlinks.md`): sin datos suficientes para un puntaje numérico (sin credenciales de Moz/Bing, y el sitio tiene solo ~3 meses de antigüedad). No es una señal de alarma — es el punto de partida esperado para un negocio de este tamaño y edad. El hallazgo accionable: el carrusel de "Marcas que amamos" en el home no enlaza a ninguna marca, una oportunidad de co-marketing sin explotar con las 10 marcas coreanas que ya vende.

---

## Archivos de esta auditoría

- `moonbeautyval.com-audit/audit-data.json` — envelope estructurado para generación de reporte PDF
- `moonbeautyval.com-audit/ACTION-PLAN.md` — plan de acción por fases
- `moonbeautyval.com-audit/findings/*.md` — los 13 análisis detallados por especialidad
- `moonbeautyval.com-audit/screenshots/` — 30 capturas desktop/mobile + mediciones DOM
- `moonbeautyval.com-audit/sitemap.xml`, `robots.txt` — snapshots de producción usados en esta auditoría
- Baseline de drift capturado (primera vez para esta URL) para comparación en auditorías futuras
