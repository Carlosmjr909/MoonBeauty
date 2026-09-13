# Images — findings

No dedicated image-optimization subagent was spawned for this audit (not part of the seo-audit orchestration list); this section was checked directly against the source at `c:\Users\HP\Desktop\MoonBeauty` and the live site.

## What works
- Product cards (`src/lib/components/tarjeta.svelte:92`) and the product detail hero image (`src/routes/products/[id]/+page.svelte:250`) use the product name as `alt` — descriptive, not generic.
- Brand logos (`src/routes/+page.svelte:579`) use the brand name as `alt`.
- Purely decorative images are correctly marked: the homepage hero background (`+page.svelte:459-464`, `alt="" aria-hidden="true"`) and the product-tone color-swatch thumbnails (`products/[id]/+page.svelte:329-333`, `alt=""` — correct because the parent `<button>` already carries `aria-label="Ver el tono {tono.nombre}"`, so an alt here would be a redundant double-announcement for screen readers, not a miss).
- Product/category imagery is served as WebP (small file sizes); OG/share images and icons were recently redone as JPG/PNG specifically because WhatsApp doesn't render WebP previews — correct tradeoff, not an oversight.

## Findings

**Medium** — Every photo across every Instagram carousel post on the homepage shares the exact same `alt` text, `"Publicación de Moon Beauty en Instagram"` (`src/routes/+page.svelte:673`), regardless of what's actually in the photo. For a screen-reader user, all ~20+ images in that carousel announce as identical; for Google Images, none of them carry any differentiating signal.
- *Fix*: the underlying data (`escucharPublicaciones`/`obtenerPublicacionesInstagram` in `src/lib/contenido.ts` and `src/lib/server/productos.ts`) has no caption field to source better text from. Cheapest fix: append the photo index for carousels (`"Publicación de Moon Beauty en Instagram — foto 2 de 4"`), which at least disambiguates. Better fix: add an optional `alt`/`descripcion` field per post in the admin panel (`/admin/contenido`) and fall back to the generic text only when empty.

**Low** — No `width`/`height` attributes on `<img>` tags site-wide (checked a sample across the homepage, product cards, and product detail). Browsers can still infer aspect ratio from the CSS (`aspect-4/5`, `object-cover`, etc. are used consistently), so this is unlikely to be causing real CLS — flagged as low-priority hygiene, not a performance defect. The dedicated performance agent's findings should be treated as authoritative on any actual CLS measurement.
