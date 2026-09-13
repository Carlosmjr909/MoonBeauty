# Technical SEO Audit — moonbeautyval.com

**Date:** 2026-09-13
**Scope:** Crawlability, indexability, canonicals, HTTP status codes, redirects, security headers, URL structure, mobile-friendliness, Core Web Vitals (source-level), structured data (presence only), JS rendering, IndexNow.
**Method:** Direct HTTP fetches (curl) + `render_page.py` against home, `/products`, `/categorias`, all 12 `/products?categoria=X` listing pages, 6 product detail pages (mixed ID formats), all 4 legal pages, the 6 gated/disallowed routes, and synthetic 404/soft-404 probes. Cross-referenced with `screenshots/results.json` (Playwright DOM measurements already captured for home/products/category/product-detail/checkout at desktop + mobile viewports).

## Technical Score: 68 / 100

Strong foundation (real SSR, clean sitemap, hardened security headers, unique per-page metadata) undercut by several concrete, fixable bugs: sitewide missing `<h1>` tags on every commerce template, a soft-404 on invalid product URLs, zero image dimensions (CLS risk), uncached product images, and mid-word-truncated meta descriptions.

---

## Pass / Fail Summary

| Category | Status | Notes |
|---|---|---|
| Crawlability | PASS | robots.txt valid, sitemap declared and discoverable, no accidental blocks |
| Indexability | FAIL (Critical + High issues) | Zero `<h1>` on all commerce templates; soft 404 on invalid product IDs; gated pages return 200 with no noindex |
| Canonicals | PASS | Self-referencing, absolute, https+www, correct on every sampled page — including the soft-404 case, which is itself part of that bug |
| Security headers | PASS (minor gaps) | CSP/HSTS/COOP/CORP/Permissions-Policy all present and solid; charset + HSTS preload are nice-to-haves |
| URL structure | PASS (minor gaps) | Clean host/redirect strategy; category pages use query strings; product IDs are a mixed legacy-numeric/Firestore-hash scheme |
| Mobile-friendliness | PASS (medium issues) | Valid viewport meta, no horizontal overflow at 375/390/1920px, 16px base font; multiple tap targets below 44px, one below-the-fold-blocking popup on mobile home |
| Core Web Vitals (source-level) | FAIL (High issues) | No `width`/`height` on any of 50 sampled `<img>` tags; product images served `Cache-Control: private, max-age=0`; no preconnect/preload for the LCP-candidate image origin |
| Structured Data (presence only) | PARTIAL | `OnlineStore` sitewide + `WebSite` on home confirmed; no `Product`/`Offer` schema on 108 product pages, no `BreadcrumbList` anywhere |
| JS Rendering | PASS | Confirmed SSR — title, price (USD+VES), stock count, description, and category listings all present in the raw (non-executed) HTML on every template tested |
| IndexNow | FAIL | No IndexNow key file found at `/` or `/.well-known/`; protocol not implemented |

---

## Critical Issues

### 1. Sitewide missing `<h1>` on every commerce template
Independently confirmed via direct HTML fetch + `grep` on the homepage, `/products`, `/categorias`, all `/products?categoria=X` listing pages, and sampled `/products/{id}` detail pages: **zero `<h1>` tags** exist on any of them. The only heading elements present on these templates are an `<h2>`/`<h3>` pair belonging to the empty-cart drawer ("Tu carrito" / "Tu carrito está vacío") — the page's actual subject (brand tagline, category name, product name) isn't wrapped in any heading element at all. Only the 4 static legal pages have a correct `<h1>` + `<h2>` outline.

This was cross-verified independently by a second check in this audit (`drift_baseline.py` + direct HTML fetch), confirming the homepage, `/products`, and `/categorias` all lack an `<h1>` in production. **A fix has already been written to the source for those three templates plus the product detail page, but has not yet been deployed to production** — the bug described above is still live on moonbeautyval.com as of this audit.

**Why Critical:** this is not a one-off page but the heading structure of the entire indexable catalog — home, every category listing, and every one of the 108 product pages are missing the single most important on-page structural signal search engines use to understand page topic, on top of being a WCAG heading-hierarchy accessibility failure. Because a fix already exists and just needs deploying, this is also the highest-leverage, lowest-effort item in this report.

**Fix:** Deploy the already-written fix. Confirm it wraps the hero headline (home), category/listing title (`/products`, `/products?categoria=X`, `/categorias`), and product name (PDP) in a semantic `<h1>` — one per page, not competing with the cart-drawer headings.

---

## High Priority Issues

### 2. Soft 404 on invalid `/products/{id}` URLs — indexation risk
`https://www.moonbeautyval.com/products/doesnotexist123` (and any mistyped/removed product ID) returns **HTTP 200**, not 404. Confirmed via `curl -o /dev/null -w "%{http_code}"`. The rendered page:
- Title: `Producto | Moon Beauty`
- Body text literally shows "**Producto no encontrado**" (product not found)
- Has a **self-referencing `<link rel="canonical" href=".../products/doesnotexist123">`**
- Has no `<meta name="robots" content="noindex">` and no `X-Robots-Tag` header
- Carries valid `OnlineStore` JSON-LD, making it look like a legitimate, indexable page to a crawler

By contrast, genuinely undefined routes (e.g. `/this-page-does-not-exist-xyz`) correctly return **404**, confirming this is specific to the `/products/[id]` load logic (it isn't throwing a 404 when the Firestore lookup misses) rather than a routing/hosting issue.

**Why it matters:** any old/removed product ID still linked externally (social, ads, WhatsApp shares, review sites), any deleted product still in Google's index, or scraper probing will accumulate as indexable, self-canonicalized thin-content pages — duplicate-content and crawl-budget risk that grows over time as the 108-product catalog churns.

**Fix:** In the `/products/[id]` server load function, throw a SvelteKit `error(404)` when the Firestore document doesn't exist, so it inherits the site's existing (correct) 404 template/status.

### 3. Zero images have `width`/`height` attributes — CLS risk
All 50 `<img>` tags sampled on the homepage (logo, hero background, 12 product/testimonial photos, icons) omit `width`/`height` (or matching `aspect-ratio` CSS). Same pattern confirmed on category/product pages. Without reserved space, the browser cannot allocate a layout box before the image downloads, which is the single most common cause of poor CLS — particularly relevant here since the hero and product-carousel images are large, above-the-fold, and loaded from an external origin (see #4), so they resolve later than same-origin assets.

**Fix:** Add explicit `width`/`height` (or `aspect-ratio` via CSS) to every `<img>`, especially the hero image and the first row of product cards.

### 4. Product images served fully uncacheable
The Firebase Storage-hosted product photos (`firebasestorage.googleapis.com/.../productos%2F...jpeg`) — which appear on the homepage, every category page, and every product page — are served with:
```
Cache-Control: private, max-age=0
```
This tells browsers (and any CDN in front of them) never to reuse the image across page views, forcing a full re-download of every product photo on every page load, including repeat visits and internal navigation between category and product pages. Confirmed with `curl -I` against a sampled image (128 KB, `image/jpeg`, `private, max-age=0`).

**Why it matters:** this directly hurts LCP on repeat views/navigations (which dominate real user CrUX data for a small returning-customer base) and adds unnecessary bandwidth cost.

**Fix:** Serve product images through a caching layer (Firebase Hosting rewrite, a CDN/image-proxy such as `next/image`-style resizing, or Vercel's Image Optimization) that sets `public, max-age=<long>, immutable` (Firebase Storage download URLs are already content-addressed via the `token` param, so they're safe to cache aggressively).

---

## Medium Priority Issues

### 5. Meta descriptions truncated mid-word
Verified against a 26-URL sample: descriptions are unique per page (good — matches the recent work) but every description over ~155 characters is hard-cut at a fixed character count and appended with `…`, without regard for word boundaries. Real examples pulled from production HTML:
- `Se absorbe rápidamen…` (product 0GJ7WCWLCHvisN1gqEuo — cuts "rápidamente" mid-word)
- `Skincare coreano con envíos a toda Venezue…` (Cuidado capilar category)
- `este tónico exfolia sua…` (product 0KlHrfiPQxZ5c5DpIY8D)
- `producto a uti…` (product 10)

This affects every category page (10 of 12 sampled hit the limit) and every product page whose source description exceeds the budget. It looks unpolished in SERP snippets and signals an unfinished truncation function.

**Fix:** Truncate at the last whitespace boundary before the character limit (e.g. ~155 chars) before appending the ellipsis, rather than a hard character-index cut.

### 6. Gated/private routes return 200 with no noindex signal
`/admin`, `/account`, `/checkout`, `/login`, `/create_account`, `/forgot-password` all return **HTTP 200** to an unauthenticated request (SSR shell renders fine, no sensitive data leaks — confirmed by inspecting `/account`'s raw response). They rely solely on the robots.txt `Disallow` to stay out of search results. Disallow prevents crawling but does **not** prevent indexing of the bare URL if it's ever discovered via an external link — Google can index a "no information available" listing for a Disallowed URL. `/account` even carries a self-referencing canonical tag, reinforcing that nothing here currently blocks indexing at the page level.

**Fix:** Add `X-Robots-Tag: noindex` (or a `<meta name="robots" content="noindex">`) on these six routes as defense-in-depth alongside the existing Disallow rules.

### 7. No `Product`/`Offer` structured data on product pages; no breadcrumbs
Confirmed (presence/absence only, per scope): every one of the 108 product pages carries only the sitewide `OnlineStore` JSON-LD block — no `Product` schema (name, image, `offers.price`, `priceCurrency`, `availability`). This is a missed opportunity for price/availability rich results on an e-commerce catalog. No `BreadcrumbList` schema was found on any page type either, despite a clear category-to-product hierarchy. (Deep schema validation is out of scope here — flagging to the schema-focused review for implementation detail.)

### 8. Firebase product images: unoptimized format/size for photo-heavy pages
Sampled hero/product image: 128 KB `image/jpeg`, filename pattern (`IMG_3854.jpeg`) indicating a direct phone-camera upload with no resizing or modern-format (WebP/AVIF) conversion, unlike the site's own static assets (`/logo.webp`, `/fondo.webp`) which are already optimized. With ~12 such images per page (home, categories, PDPs), this compounds the caching issue above into a real LCP risk, especially on mobile/cellular connections common to the target market.

**Fix:** Run uploads through a resize/convert step (Firebase Extensions "Resize Images" or a Vercel/Cloudinary-style image proxy) to produce right-sized WebP/AVIF variants.

### 9. No preconnect/preload hints for the image origin
`firebasestorage.googleapis.com` serves the LCP-candidate images on every template but the homepage has no `<link rel="preconnect">` (or `dns-prefetch`) to that origin, and no `<link rel="preload">` for the actual hero/LCP image. This adds an avoidable DNS+TLS negotiation delay before the largest above-the-fold asset can start downloading.

### 10. Mobile tap targets below recommended minimum size
Real Playwright DOM measurements (`screenshots/results.json`, mobile 375px viewport) show numerous interactive elements under the ~44-48px minimum touch-target guideline: header icon buttons at 25x25px, several 32x32px controls, and carousel/pagination dots as small as **7x7px** on the homepage. These are effectively unusable/hard-to-hit on a touchscreen and are the kind of finding Google's own mobile-usability checks (and Lighthouse's "Tap targets are not sized appropriately" audit) flag directly.

### 11. Mobile home: subscribe popup overlaps the primary CTA
The screenshot capture for `home` mobile above-the-fold shows the newsletter/account popup ("Un espacio creado para ti ✨ / Suscríbete aquí") rendering directly over the hero's "Descubrir productos" button on first paint at 375px width. Google's mobile-friendly guidelines penalize interstitials that cover main content immediately on load; a reasonably-sized bottom banner is generally exempt, but confirm the current banner height/close-button reachability doesn't cross that line, and that it doesn't fire before the user has had a chance to see the primary CTA.

---

## Low Priority Issues

### 12. Two-hop redirect chain from apex HTTP
`http://moonbeautyval.com/` → 308 → `https://moonbeautyval.com/` → 308 → `https://www.moonbeautyval.com/` (2 hops). `http://www.moonbeautyval.com/` correctly redirects in a single hop. Minor latency cost only on the (uncommon) bare-apex-HTTP entry point; consolidating to a single redirect rule (apex → https://www in one 308) would be cleaner but isn't urgent.

### 13. `Content-Type` header omits charset
All HTML responses send `Content-Type: text/html` without `; charset=utf-8` (the `<meta charset="utf-8">` in `<head>` is correct and browsers handle this fine per HTML5 sniffing rules — verified actual bytes are correctly UTF-8-encoded, e.g. "envíos" is valid `C3 AD` UTF-8, not corrupted). Some simpler HTTP clients, proxies, or bots that don't sniff HTML meta tags (unlike browsers) could mis-decode as Latin-1. Given the business's reliance on WhatsApp link sharing for checkout coordination, it's cheap insurance to add `; charset=utf-8` to the header explicitly. (Note: `/sitemap.xml` and `/.well-known/security.txt` already send correct charset — this only affects the HTML document responses.)

### 14. HSTS present but not preload-eligible in its current form
`Strict-Transport-Security: max-age=31536000; includeSubDomains` is solid (1 year, subdomains covered) but lacks `preload`. Optional: add `preload` and submit to hstspreload.org once confirmed stable across all subdomains.

### 15. Category pages use query-string URLs
`/products?categoria=Kits` etc. work correctly (unique canonical/title/description, included in sitemap, crawlable) but a path-based structure (`/categorias/kits`) would be marginally more keyword-friendly and conventional for faceted e-commerce navigation. Not urgent given current implementation is technically sound.

### 16. Mixed product ID schemes in URLs
Product URLs mix short legacy numeric IDs (`/products/1`, `/products/10`) with 20-character Firestore document IDs (`/products/0GJ7WCWLCHvisN1gqEuo`). Neither is human-readable/keyword-bearing. Not a crawl or index problem, just a missed long-tail keyword opportunity; a slug-based URL would require redirect handling and isn't worth the churn purely for SEO.

### 17. IndexNow not implemented
No IndexNow key file at `/` or `/.well-known/`. For a catalog with 108 products whose price/stock changes frequently, wiring up IndexNow submission (Bing, Yandex, Naver) on publish/update would get faster re-crawling than waiting on sitemap-based discovery. Low priority given Google (the dominant engine for this market) doesn't consume IndexNow.

### 18. No `lastmod` in sitemap.xml
`sitemap.xml` is well-formed (valid XML, correct `application/xml; charset=utf-8` content-type, `changefreq`/`priority` present) but omits `<lastmod>` on every URL. Adding it (especially for product pages, tied to actual Firestore update timestamps) would help crawlers prioritize re-fetching changed pages over the 127-URL set.

---

## What's Confirmed Working (no action needed)

- **Sitemap discovery**: `sitemap_discovery.py` validates the declared sitemap; robots.txt correctly points to it; no orphaned/broken common-path sitemap variants.
- **robots.txt**: valid syntax, only the 6 intended private routes disallowed, catalog fully open.
- **Canonicals**: correct, absolute, self-referencing, `https://www` host on every single page type sampled (this is the one place the soft-404 bug does the *technically correct* thing, which paradoxically makes the bug worse).
- **JS rendering / SSR**: fully verified — product price (USD + VES), live stock count copy ("¡Últimas 3 unidades disponibles!"), full descriptions, and category product listings are all present in the raw HTML with zero JS execution (`is_spa: false`, `mode_used: raw` on every sample). No client-side-only content gap exists.
- **Redirect hygiene**: `www` canonicalization, HTTPS enforcement, and trailing-slash normalization (`/products/{id}/` → `/products/{id}`) all resolve in a single clean 308 hop (except the apex-HTTP edge case in #12).
- **Security headers**: CSP (nonce-based script-src, no `unsafe-inline` for scripts), HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP all present and reasonably scoped. `security.txt` is live at `/.well-known/security.txt`, correctly formed (Contact + Expires 2027-09-03 + Preferred-Languages), served with correct `text/plain; charset=utf-8`.
- **Meta description uniqueness**: verified across 26 sampled URLs (home, /products, /categorias, all 12 categories, 6 products, 4 legal pages) — zero duplicates. The recent per-page work is real; the only defect is the mid-word truncation (#5).
- **Title tags**: unique, reasonable length (18–56 chars) on every sample, no truncation issues.
- **Mobile viewport**: `width=device-width, initial-scale=1`, no zoom-blocking `user-scalable=no`/`maximum-scale`. No horizontal overflow at 375px, 390px, or 1920px (verified via real browser DOM measurement, not just source inspection). Base font size 16px.
- **404 handling for genuinely unmapped routes**: `/this-page-does-not-exist-xyz` correctly returns 404 (isolates the soft-404 bug to the `/products/[id]` dynamic route specifically).

---

## Files referenced
- `c:\Users\HP\Desktop\MoonBeauty\moonbeautyval.com-audit\SITE-CONTEXT.md`
- `c:\Users\HP\Desktop\MoonBeauty\moonbeautyval.com-audit\robots.txt`
- `c:\Users\HP\Desktop\MoonBeauty\moonbeautyval.com-audit\sitemap.xml` / `sitemap-urls.txt`
- `c:\Users\HP\Desktop\MoonBeauty\moonbeautyval.com-audit\screenshots\results.json` (mobile tap-target / overflow / popup measurements)
- `c:\Users\HP\Desktop\MoonBeauty\moonbeautyval.com-audit\findings\technical.md` (this file)
