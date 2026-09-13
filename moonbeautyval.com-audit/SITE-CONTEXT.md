# Site context for this audit

**Site:** Moon Beauty — https://www.moonbeautyval.com (canonical host is `www`; apex `moonbeautyval.com` 308-redirects to it)
**Business type:** Hybrid — E-commerce (Korean skincare/K-Beauty products, USD + VES pricing) + Local delivery service (Valencia and Naguanagua, Carabobo, Venezuela; WhatsApp-coordinated checkout, no walk-in storefront)
**Stack:** SvelteKit 2 (Svelte 5 runes) on Vercel (`adapter-vercel`), SSR (not a SPA — verified via render_page.py, `is_spa: false`), Firebase (Firestore/Auth/Storage) as the backend, source at `c:\Users\HP\Desktop\MoonBeauty` if you need ground truth beyond what a crawl shows.
**Total indexable pages:** 127, all confirmed HTTP 200 (see `sitemap-urls.txt` / `sitemap.xml` in this audit folder — fetched directly from production, no need to re-crawl link-by-link). Breakdown: 1 home, 1 `/products` (all), 12 `/products?categoria=X` (one per category), 108 `/products/{id}` (individual products), 1 `/categorias`, 4 legal pages.
**robots.txt** (`robots.txt` in this folder): allows everything except `/admin`, `/account`, `/checkout`, `/login`, `/create_account`, `/forgot-password`. Sitemap declared correctly.
**Known recent SEO work already done** (so don't re-flag as missing — verify it actually works instead):
- Open Graph / Twitter Card tags site-wide, with a 1200x630 JPG fallback image and per-product images (WebP images fall back to the default OG image because WhatsApp doesn't render WebP previews).
- JSON-LD: `OnlineStore` (sitewide) + `WebSite` (home only, for sitename in SERPs).
- Per-page unique meta descriptions were just added (home, /products, each of the 12 categories, /categorias, 4 legal pages, each product) — please verify they're actually unique and not truncated oddly, this is the thing most worth double-checking.
- Favicon/app icons regenerated recently (192/512/apple-touch-icon + .ico), replacing a leftover default framework icon.
- CSP headers, HSTS, security.txt already configured.
- Google Business Profile exists ("Moon Beauty Val") — link: https://share.google/ZH6ApMIzQLYrrhGG1 — no BIMI/VMC (deliberately deferred, cost-prohibitive for this business size).
- Testimonials on homepage are manually curated (not live Google Reviews pulled via API — no Google Places billing set up).

**Please still verify everything independently** — this context is a head start, not a substitute for your own checks. Flag anything you find regardless of whether it's mentioned above.

**Output:** write your findings to `moonbeautyval.com-audit/findings/<your-category>.md` in the project root shown above. Use the Priority Definitions (Critical/High/Medium/Low) from the audit skill.
