# Sitemap Audit — https://www.moonbeautyval.com/sitemap.xml

Source reviewed: `src/routes/sitemap.xml/+server.ts` (dynamic, built from Firestore at request time, 1h CDN/browser cache), cross-referenced against `src/routes/` tree, `robots.txt`, `src/routes/+layout.svelte` (nav), and `src/lib/server/legales.ts`.

## Summary

| Check | Result |
|---|---|
| XML well-formed | Pass (parsed cleanly with `xml.dom.minidom`) |
| URL count | 127 — matches SITE-CONTEXT.md count exactly |
| Duplicate `<loc>` entries | None found (`sort \| uniq -d` empty) |
| Per-file limits (≤50,000 URLs / ≤50MB) | Pass, nowhere close (127 URLs, ~24KB) — **splitting is not needed** |
| Disallowed paths leaking into sitemap | None — `/admin`, `/account`, `/checkout`, `/login`, `/create_account`, `/forgot-password` are all absent from the generator's entry list |
| Declared in robots.txt | Confirmed: `Sitemap: https://www.moonbeautyval.com/sitemap.xml` present |
| `priority` / `changefreq` | Present on every URL — deprecated/ignored by Google, harmless but dead weight |

## Findings

### Medium — `lastmod` is inconsistent and only reflects creation date, not last significant change
- Only the 108 `/products/{id}` URLs carry a `<lastmod>`. It's populated from `producto.fechaCreacion` (creation timestamp), **not** an update timestamp:
  ```ts
  fecha: comoFecha(producto.fechaCreacion)
  ```
  (`src/routes/sitemap.xml/+server.ts:85`). If a product's price, stock, description, or images change later, `lastmod` won't move — it will keep showing the original creation date forever. This defeats the purpose of `lastmod` (telling crawlers when to re-check a page) and could cause Google to under-prioritize re-crawling products that were actually just updated.
  - Fix: track a real `fechaActualizacion` (or use Firestore's document `updateTime`) and emit that instead.
- Home (`/`), `/products`, `/categorias`, all 12 `/products?categoria=X` category pages, and all 4 legal pages have **no `<lastmod>` at all**. For the legal pages this is a missed opportunity: `src/lib/server/legales.ts` already stores a human-readable `actualizado` field per page (e.g. "2 de septiembre de 2026") that could be normalized to W3C datetime and emitted as `lastmod` — the data exists but isn't wired into the sitemap generator.
- Net effect: lastmod coverage is 108/127 (85%), and even that subset is measuring the wrong event (creation, not modification).

### Low — `priority` and `changefreq` are dead weight
Every entry sets both tags (values ranging 0.3–1.0 and daily/weekly/yearly). Google has publicly stated both are ignored entirely; Bing gives `changefreq` minimal weight at best. Not harmful, but it's generator complexity with zero SEO return. Safe to strip in a future simplification pass — not urgent.

### Low — orphaned `/contacts` route: not in sitemap (correctly), but also not disallowed in robots.txt
`src/routes/contacts/+page.svelte` exists and renders literally just the placeholder text "Esta es la ruta de contactos" (a dev stub). It is:
- Not linked from anywhere in navigation (`+layout.svelte` header/footer/mobile menu all checked — no link to `/contacts`)
- Not in the sitemap generator's entry list (correct, since it's not a real page)
- Not in `robots.txt`'s `Disallow` list (unlike `/admin`, `/account`, etc.)

Since nothing links to it internally, it's unlikely to be crawled/indexed today, but it's a live 200-status page with placeholder content that costs nothing to clean up. Recommend either building it out with real contact content (site already surfaces contact info via footer + WhatsApp CTA — a dedicated `/contacts` page is plausibly intentional but unfinished) or removing the route until it's ready. If left as-is, no urgent action, but it should not be discoverable by accident (e.g., don't link it from anywhere until finished, or add it to `robots.txt`).

### Low — category-URL de-duplication relies on exact string matching from two sources
The generator merges category names from `categoriasGuardadas` (an admin-managed Firestore collection) and from each product's own `categorias` field into a `Set<string>` (`src/routes/sitemap.xml/+server.ts:60-72`), trimmed but **not case-normalized**. If a product is ever saved with a category string that differs only in casing/accents from the canonical category doc (e.g., "protector solar" vs "Protector solar"), the `Set` will treat them as distinct and emit two separate `/products?categoria=X` URLs that likely render near-identical or overlapping content — a near-duplicate-content risk. Currently, the live sitemap shows exactly the expected 12 categories with consistent casing, so this is not manifesting today — flagging as a latent data-integrity risk worth a normalization step (lowercase + trim comparison, or enforce a single canonical source) rather than an active problem.

### Info — no pages missing, no extra/broken pages
Cross-checked `src/routes/` against the sitemap entries and SITE-CONTEXT's crawl:
- `/`, `/products`, `/products?categoria=*` (×12), `/categorias`, `/products/{id}` (×108), and the 4 legal pages (`/envios`, `/cambios-y-devoluciones`, `/terminos-y-condiciones`, `/privacidad`) are all present and accounted for — this matches the sitemap generator's logic exactly, no drift between code and live output.
- Every other route under `src/routes/` (`/admin/*`, `/account`, `/checkout`, `/login`, `/create_account`, `/forgot-password`, the `api/*` server endpoints) is either correctly excluded via `robots.txt` `Disallow` or is a non-page server endpoint — none of these belong in the sitemap and none are present.
- No indexable route was found in the source tree that's missing from the sitemap. Nothing to add.

### Info / To-do — Search Console submission cannot be verified without GSC access
No way to confirm from the codebase/filesystem whether `sitemap.xml` has actually been submitted in Google Search Console. Flagging as a manual to-do: log into GSC for `moonbeautyval.com` (or `www.moonbeautyval.com`) → Sitemaps → confirm `sitemap.xml` is listed and shows "Success" status with ~127 discovered URLs. If GSC isn't verified/set up at all yet, that's a separate, larger to-do worth flagging to the site owner.

## Not an issue (confirmed working as intended)
- **No split needed**: 127 URLs is nowhere near the 50,000 URL / 50MB threshold. A single-file sitemap is correct at this scale.
- **No disallowed-path leakage**: verified by reading the generator source directly — it has a fixed, hand-built entry list plus a Firestore-driven product/category loop; there's no code path that could emit `/admin`, `/account`, `/checkout`, `/login`, `/create_account`, or `/forgot-password`.
- **No duplicate `<loc>` values**.
- **XML is valid** and correctly declared in `robots.txt`.
