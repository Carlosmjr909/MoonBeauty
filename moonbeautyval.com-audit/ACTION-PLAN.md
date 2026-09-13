# Plan de acción — moonbeautyval.com

Basado en `FULL-AUDIT-REPORT.md` y los 13 archivos en `findings/`. Prioridad: Crítico > Alto > Medio > Bajo.

---

## Fase 1: Arreglos críticos (Semana 1)

- [ ] **Commitear y desplegar el fix de `<h1>`** — ya escrito y verificado en el working tree (`+page.svelte` de home, `/products`, `/categorias`, `/products/[id]`). Cero código nuevo, solo publicar. *(Technical, Content, On-Page, GEO)*
- [ ] **Commitear y desplegar el fix de truncado de `recortar()`** — ya parcheado en `src/lib/seo.ts` durante esta auditoría; corrige el corte a mitad de palabra en 116 de 127 meta descriptions. *(Content, GEO)*
- [ ] **Commitear y desplegar la corrección gramatical** en `src/routes/privacidad/+page.server.ts` ("proteges" → "protegemos") — ya parcheada. *(Content)*
- [ ] **Corregir la descripción de `/products/1`** en el panel de administración (hoy muestra copy de una bruma Dr. Althea en una página de protector solar TOCOBO). Ver `findings/content-integrity-product1.md` para la evidencia completa (documento crudo de Firestore incluido). *(Content, E-commerce, GEO — requiere decisión humana, no automatizable)*
- [ ] **Revisar manualmente los ~20 productos más antiguos** por fecha de creación en busca de errores similares de copy/paste — el patrón sugiere que `/products/1` pudo ser una carga manual temprana directa en Firestore. Un chequeo heurístico automatizado durante esta auditoría no fue confiable (falsos positivos por pares nombre-en-inglés/descripción-en-español), así que esto necesita revisión humana.
- [ ] **Eliminar o construir la página `/contacts`** — hoy es un stub de desarrollador vivo e indexable ("Esta es la ruta de contactos", sin `<title>`). *(Content, Sitemap)*
- [ ] **Arreglar el soft-404 en `/products/[id]`** — lanzar `error(404)` de SvelteKit cuando el documento de Firestore no existe, en vez de renderizar un 200 con "Producto no encontrado". *(Technical)*

---

## Fase 2: Mejoras de alto impacto (Semanas 2-3)

- [ ] **Agregar `Product`/`Offer` JSON-LD a las 108 páginas de producto** — nombre, marca, imagen, precio en USD, disponibilidad, url. Todos los datos ya están renderizados en la página; el agente `seo-schema` dejó el código exacto en `findings/schema.md`. No agregar `aggregateRating`/`Review` fabricados. *(Schema, GEO, E-commerce, SXO)*
- [ ] **Mostrar la marca en la ficha de producto** — eyebrow label sobre el nombre, en `<title>`, y en el `alt` de la imagen. Los datos ya existen (se muestran en las tarjetas del listado) y solo faltan en la página de detalle. *(On-Page, GEO, SXO)*
- [ ] **Renderizar la descripción de categoría existente como párrafo visible** en las 12 páginas `/products?categoria=X`, con un `<h1>` real con el nombre de la categoría. *(Content, On-Page, GEO, SXO)*
- [ ] **Agregar la URL del Perfil de Negocio de Google al `sameAs`** del JSON-LD (`contacto.googlePerfilUrl` ya existe en `configuracion.ts`). *(Schema, Local, GEO)*
- [ ] **Arreglar la entrega de imágenes de Firebase Storage:** `loading="lazy"` en las imágenes del grid de `/products` fuera de la primera fila, y un paso de redimensionado/WebP en las subidas — la mejora de rendimiento de mayor impacto disponible en el sitio (LCP de 7.7s a probablemente <3s en `/products`). *(Performance)*
- [ ] **Reposicionar o retrasar el popup de newsletter en móvil** — hoy cubre el CTA principal del home y la descripción/precio del producto en la ficha de detalle a los ~5-6 segundos. *(Visual/UX, SXO)*
- [ ] **Agregar `BreadcrumbList` schema** a páginas de producto y categoría. *(Schema, On-Page)*

---

## Fase 3: Contenido y autoridad (Mes 2)

- [ ] **Escribir y publicar una página "Nosotros"** (~400-600 palabras): quién opera la tienda, cómo funciona la curaduría/autenticidad, zonas de entrega. Apuntar el enlace "Saber más" del home hacia esta página en vez de `/products`. *(Content, GEO, Local)*
- [ ] **Nombrar explícitamente Valencia y Naguanagua** en una página indexable (expandir `/envios` o crear `/zonas-de-entrega`) — esta información hoy solo existe dentro del checkout, bloqueado por `robots.txt`. Incluir rangos de tiempo y métodos de pago. *(Local, GEO, SXO — el hallazgo #1 de local.md)*
- [ ] **Agregar lista de ingredientes y "modo de uso"** a las fichas de producto, empezando por los SKUs de mayor tráfico. *(Content, GEO)*
- [ ] **Corregir los ~9 productos con artefactos de traducción automática** en inglés sin traducir, y dividir las oraciones más largas. *(Content)*
- [ ] **Crear una página de preguntas frecuentes** con schema `FAQPage` (zonas, tiempos, métodos de pago, autenticidad). *(GEO)*
- [ ] **Buscar oportunidades de enlaces realistas y de bajo costo:** listados como retailer autorizado de las 10 marcas coreanas que ya vende, directorios de negocios venezolanos, y outreach a comunidad/microinfluencers de K-Beauty en LatAm. *(Backlinks)*
- [ ] **Considerar contenido editorial de embudo alto** (4-6 guías tipo "rutina coreana paso a paso") que enlacen a las categorías existentes — la búsqueda de mayor volumen del análisis SXO (rutina de skincare paso a paso) no tiene ninguna página del sitio que la responda. *(SXO)*

---

## Fase 4: Monitoreo e iteración (Continuo)

- [ ] Confirmar en Google Search Console que `sitemap.xml` está enviado y muestra "Correcto" con ~127 URLs descubiertas.
- [ ] Re-ejecutar PageSpeed Insights/CrUX cuando se restablezca el límite de tasa, para reemplazar los datos de laboratorio de esta auditoría con datos reales de campo.
- [ ] Monitorear la velocidad de reseñas del Perfil de Negocio de Google (regla de 18 días); agregar schema `aggregateRating` cuando el volumen de reseñas lo justifique.
- [ ] Revisar la presencia en Common Crawl en 2-3 trimestres conforme el sitio acumule enlaces externos.
- [ ] Comparar el baseline de drift capturado en esta auditoría (2026-09-13) contra auditorías futuras para detectar regresiones.

---

## Nota sobre autoría de los cambios

Los tres arreglos de Fase 1 marcados como "ya escrito/parcheado" están únicamente en el working tree local — no se ha hecho commit ni deploy de ninguno. Avísame cuando quieras que los suba.

La corrección de `/products/1` y el destino de `/contacts` quedaron deliberadamente sin tocar: son decisiones de contenido, no bugs con una solución única, y no debo inventar copy de producto o de contacto sin tu indicación.
