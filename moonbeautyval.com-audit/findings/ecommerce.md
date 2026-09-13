# E-commerce SEO Findings — moonbeautyval.com

**Scope:** 108 individual product pages (`/products/{id}`), `/products` (full catalog), 12 category filter URLs (`/products?categoria=X`).
**Data sources:** On-page analysis (static) via `render_page.py` / raw `curl` fetches of live production URLs, plus source review at `c:\Users\HP\Desktop\MoonBeauty\src\routes\products` and `src\lib`. No DataForSEO/Google Shopping/Amazon API access was available for this audit — marketplace/competitor pricing comparisons and cross-site duplicate-content checks are **not covered** below.

Overall scores (on-page only, no marketplace data):
- Schema: **20/100** — sitewide `OnlineStore` JSON-LD only; zero `Product` schema on any of the 108 product pages.
- Images: **65/100** — alt text present everywhere, images reasonably sized, but no dimensions/lazy-loading, generic alt text.
- Content: **70/100** — descriptions are unique per product and well-written, but at least one confirmed title/description mismatch and likely more (manufacturer-style copy).
- Pricing/currency display: **85/100** — clear, unambiguous USD/VES labeling; only gap is that this clarity isn't mirrored in any schema (because none exists).
- Overall: **55/100**

---

## Critical

### 1. No `Product` structured data anywhere — zero rich-result / Shopping eligibility
Verified on multiple product pages (both via rendered HTML and raw HTTP fetch, e.g. `/products/1`, `/products/3`, `/products/0GJ7WCWLCHvisN1gqEuo`): the only JSON-LD present sitewide is a single `OnlineStore` block (from `src/routes/+layout.svelte`) plus a `WebSite` block on the homepage only. **None of the 108 product pages emit `@type: Product`** — no `price`, `priceCurrency`, `availability`, `sku`, `brand`, `image` array, or `aggregateRating`.

Impact:
- No eligibility for Google price/availability rich results or the free "Shopping" surfaces that key off `Product`/`Offer` markup.
- The site's own out-of-stock handling (see the Medium finding below — it's actually done well in the UI) has **no structured signal at all**: Google has no machine-readable way to know a page is `InStock` vs `OutOfStock`, since there's no `Offer.availability` to set in the first place.
- The USD/VES dual-currency display (done cleanly in the UI, see Low finding) also has no structured counterpart — there's no `priceCurrency` to get wrong, but there's also none to help Google display the price at all.

Recommendation: add a `Product` JSON-LD block per product page (in `src/routes/products/[id]/+page.svelte` or its `+page.server.ts`) with at minimum: `name`, `image`, `description`, `sku` (Firestore doc id), `brand.name` (`producto.marca`), and `offers.{ @type: Offer, priceCurrency: "USD", price: producto.precio, availability: producto.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url }`. Declare `USD` explicitly (matching the primary displayed price) — do not attempt to also encode the VES estimate in schema, since that rate fluctuates daily (BCV) and a stale `priceValidUntil`/second currency in schema would be actively misleading to Google. Expected impact: unlocks price/availability rich results and Shopping tab eligibility, the highest-leverage fix available in this audit.

---

## High

### 2. Product data-integrity bug: title/description mismatch on at least one live product
`/products/1` ("Cotton Soft Sun Stick", a TOCOBO sunscreen stick) currently serves a `<title>`, `og:title`, and visible on-page name of "Cotton Soft Sun Stick," but its **meta description, og:description, twitter:description, and the actual visible product-description paragraph on the page all describe a completely different product**: a Dr. Althea mist/spray cream ("Una de las cremas más conocidas de Dr. Althea ahora tiene una versión en bruma... Contiene ingredientes como Agua de Arroz, Pantenol y Centella Asiática..."). This is a Firestore data-entry error (wrong `descripcion` field assigned to this product), not a code/template bug — a sample of ~15 other products (ids `3, 4, 5, 7, 9, 10, 12, 13, 14` and several Firestore-hash ids) all had correctly matched titles/descriptions, so this looks isolated rather than systemic, but it was found in a small spot-check sample, so **more mismatches likely exist across the full 108-product catalog**.

Impact: undermines the "unique meta description" work already completed (SITE-CONTEXT.md item), actively misleads users and Google about what the product is, and could suppress click-through or trigger a "description doesn't match page content" quality signal.

Recommendation: run a full pass over the `productos` Firestore collection cross-checking `Nombre` against `descripcion` for topical mismatches (e.g., an LLM-assisted consistency check comparing product name/category keywords against description keywords) before the next content push. Fix `/products/1` specifically.

---

## Medium

### 3. Missing breadcrumb navigation and `BreadcrumbList` schema
No breadcrumb trail (visual or structured) exists anywhere in the codebase (`src/routes/products/[id]/+page.svelte`, category pages) — confirmed via source search. Product pages only link back to their category via a single "Ver todo" button, and there is no Home → Category → Product breadcrumb either in the DOM or as `BreadcrumbList` JSON-LD.

Impact: weaker internal linking signal to categories from product pages, no breadcrumb rich result in SERPs (which also usually shortens the displayed URL), and a slightly weaker crawl path reinforcing the category → product hierarchy for the 108 product URLs.

Recommendation: add a simple breadcrumb component (Home / Products / Category / Product name) on both category and product pages, plus matching `BreadcrumbList` JSON-LD. Low implementation cost, reuses data already loaded (`product.Tipo` / `categorias`).

### 4. No image `width`/`height` or `loading="lazy"` attributes
Sampled `<img>` tags on `/products/1` and the recommended-products grid have no `width`/`height` attributes (CLS risk) and no `loading="lazy"` on below-the-fold images (product grids, recommended-products carousel, search-result thumbnails in the header search). Core Web Vitals (CLS, LCP) are a confirmed ranking factor, so this compounds across all 108 product pages and the 12 category grids.

Note: this is *not* a file-size problem — sampled Firebase Storage product photos are reasonably sized JPEGs (~55–65KB), so the fix here is markup-only, not re-encoding.

Recommendation: add explicit `width`/`height` (or `aspect-ratio` via CSS, which is already used in several places like `aspect-4/5`, but that doesn't substitute for the HTML attributes some crawlers/Lighthouse checks look for) and `loading="lazy"` to all below-the-fold `<img>` tags (recommended products, grid/category listings, search dropdown thumbnails). Keep the hero product image eager (already effectively is, being above the fold).

### 5. Generic product image alt text
Alt text is present on every sampled product image (`alt={product.Nombre}` in `tarjeta.svelte` and the PDP gallery) — this clears the bar of "not missing," but it's just the bare product name with no differentiating context (brand, size/volume, or category), e.g. `alt="Bio Watery Sun Cream SPF50 PA++++ 50ml"` (fine, name already descriptive) vs. `alt="Cotton Soft Sun Stick"` (fine) vs. gallery/tone-swatch images that fall back to `alt=""` when a color swatch has no image (`tono.imagen` variants) — acceptable there since those are decorative, but worth confirming intentional. No action required beyond monitoring; noting as Medium only because it's the kind of thing that's easy to regress when new products are added manually via the admin panel with no enforced alt-text field distinct from the name.

### 6. Product descriptions read as manufacturer/brand marketing copy
Descriptions sampled across ~20 products (e.g., "Dear Darling Water Tint: Un tinte de agua húmeda y afrutada...", "Medicube Triple Collagen Serum 4.0...", "Purito SEOUL Wonder Releaf Centella...") read like translated brand copy rather than store-original writing. Since Moon Beauty resells established K-beauty SKUs, other Venezuelan/LatAm retailers carrying the same products may use similar or identical brand-supplied copy, creating cross-site duplicate-content exposure. **This cannot be confirmed without a DataForSEO/SERP duplicate-content check**, which was unavailable for this audit — flagging as a risk to verify manually (e.g., search an exact sentence from a description in quotes) rather than a confirmed finding.

---

## Low

### 7. `Content-Type` response header omits charset
`curl -I` on `/products/1` (and other pages) returns `Content-Type: text/html` with no `charset=utf-8` parameter; the page relies solely on the in-document `<meta charset="utf-8">` (confirmed present, correctly UTF-8-encoded — verified at the byte level, e.g. `más`/`versión` are correctly encoded as `\xc3\xa1`/`\xc3\xb3`, not double-encoded/mojibake as an earlier decode artifact of this audit's tooling briefly suggested). Low risk in practice since HTML5 UAs and Googlebot handle the meta-charset fallback fine, but setting the header explicitly (`text/html; charset=utf-8`) is a one-line best practice on the SvelteKit/Vercel response and removes any ambiguity for less-forgiving crawlers/tools.

---

## Verified as working correctly (no action needed)

- **Category filter canonical handling is correct.** Each `/products?categoria=X` URL (verified live for `Protector solar`) has a **self-referencing** canonical (`urlCanonica` logic in `src/routes/+layout.svelte` explicitly preserves the `categoria` param while stripping all other query params), a unique `<title>` and meta description (`descripcionCategoria()` in `src/lib/seo.ts`), and renders a genuinely distinct, smaller subset of products server-side (confirmed: "Protector solar" → 8 products / 16 product links vs. 108 products / 216 links on the base `/products`). Google will not see these as duplicate or thin — this was implemented correctly.
- **Out-of-stock handling is sound.** Confirmed live on products `3`, `4`, and `9` (all currently `stock: 0`): pages return HTTP 200, remain in `sitemap.xml` (the sitemap generator at `src/routes/sitemap.xml/+server.ts` includes every product regardless of stock), display a clear "Agotado" badge, and disable the add-to-cart button — no 404, no removal, no `noindex`. This avoids soft-404s and preserves link equity/crawl budget on products that will restock. The only gap is the missing `Product`/`Offer.availability` schema noted in Critical #1, which would let this signal reach Google structurally rather than only visually.
- **USD/VES price display is unambiguous.** Both `formatearUSD`/`formatearVES` (`src/lib/utils/moneda.ts`) use `Intl.NumberFormat` with explicit currency codes (`"USD"`, `"VES"` with `currencyDisplay: 'code'`), so the page always shows e.g. "USD 22,00" / "VES 18.314,74" rather than an ambiguous bare "$" — good practice for a market with two live currencies. No schema/display currency conflict exists today for the simple reason that no price schema exists yet (see Critical #1).
- **No accidental `noindex` or robots blocking** on any product/category page — confirmed via source search and `robots.txt` review; sitemap and crawl paths are open as intended.
- **No SPA/client-only rendering gap.** Title, meta description, OG/Twitter tags, and (limited) JSON-LD are all present in the raw server-rendered HTML (`raw_content` matches `content`), so nothing product-related is at risk of being invisible to crawlers that don't execute JS.

---

## Priority summary

| # | Finding | Severity |
|---|---|---|
| 1 | No `Product`/`Offer` JSON-LD on any of 108 product pages | Critical |
| 2 | Title/description content mismatch (confirmed on `/products/1`, sample-only check) | High |
| 3 | No breadcrumb nav or `BreadcrumbList` schema | Medium |
| 4 | Missing image `width`/`height`/`loading="lazy"` | Medium |
| 5 | Generic (but present) product image alt text | Medium |
| 6 | Possible manufacturer-copy duplicate content (unverifiable without SERP/API access) | Medium |
| 7 | `Content-Type` header missing explicit charset | Low |
