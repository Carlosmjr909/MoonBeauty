# Performance / Core Web Vitals Audit — moonbeautyval.com

## Method & data source (important limitation)

No Google API / CrUX credentials are reachable in this environment: the
PageSpeed Insights API call returned `PSI rate limit exceeded (240 QPM /
25,000 QPD)` on every attempt, and there is no CrUX field-data access either.
**All figures below are lab data from a single Lighthouse 13.4.1 run per
page** (mobile emulation, default simulated "Slow 4G"-equivalent network + 4x
CPU throttling — Lighthouse's standard navigation preset), not real-user
75th-percentile field data. Lighthouse also emitted a runtime warning that
the host CPU is slower than its calibration target, which can inflate
CPU-bound numbers (TBT, TTI) somewhat. Treat absolute millisecond values as
directional; the relative severity ranking (huge unoptimized image payloads,
heavy JS hydration, no lazy-loading on the catalog grid) is reliable and
corroborated by multiple independent audits (image-delivery, third-parties,
DOM-size, network payload) agreeing with each other across all three pages.
**Recommend re-running via PSI/CrUX once the rate limit resets, or waiting
for real-world CrUX field data to accumulate (needs ~28 days of qualifying
traffic), to confirm real-user 75th-percentile pass/fail status.**

Lighthouse note: two of the three CLI runs hit a benign `LanternError: NO_LCP`
during an auxiliary "insights" computation pass (used only for byte-level LCP
sub-part breakdowns) and a Windows-only temp-cleanup `EPERM` error on exit;
neither affected the primary metrics/score computation, which completed
successfully and is what's reported below. It does mean the granular
"LCP element" / "LCP phases" breakdown wasn't available for the homepage —
noted where relevant.

Pages tested: homepage (`/`), one product detail page (`/products/1`), and
the `/products` catalog listing.

---

## Summary scorecard (mobile, lab)

| Page | Perf score | LCP | TBT (INP proxy) | CLS | Page weight | Requests |
|---|---|---|---|---|---|---|
| Homepage `/` | 31/100 | **19.1s** — Poor | **1,960ms** — Poor | 0.017 — Good | 4,648 KiB | 91 |
| Product `/products/1` | 56/100 | **5.0s** — Poor | **770ms** — Poor | 0.002 — Good | 1,291 KiB | 49 |
| Listing `/products` | 36/100 | **7.7s** — Poor | **1,860ms** — Poor | 0.002 — Good | **8,953 KiB** | 152 |

Core Web Vitals status (lab, all three pages): **LCP fails, INP/TBT fails,
CLS passes.** CLS is the one metric that's in good shape site-wide; LCP and
interactivity are the problems, and they're both traceable to the same root
cause on every template: unoptimized, unresized, non-lazy-loaded images
served straight from Firebase Storage.

---

## Critical

### 1. `/products` catalog is one un-paginated grid that eagerly loads all 108 products' images (7.98MB, 109 image requests)
Confirmed via rendered DOM: the listing page has **no pagination and no
infinite scroll** — all 108 products are rendered in a single
`grid.grid-cols-2...xl:grid-cols-4` container (1,531 DOM elements total,
grid div alone has 108 children, page height ~23,462px). Checked all 109
`<img>` tags in the rendered HTML: **zero have `loading="lazy"`, zero have
`width`/`height` attributes, zero have `srcset`.** Because nothing is marked
lazy, the browser fetches every product image immediately on page load
regardless of viewport position.

Result: 109 image requests totaling **7,984,564 bytes (7.8MB)** — of which
**7,414,677 bytes (7.4MB) is the "Firebase" third-party entity alone**
(raw, full-resolution JPEGs pulled directly from
`firebasestorage.googleapis.com`, unresized for their ~180×230px grid
thumbnail display). Total page weight is **8,953 KiB**, LCP is **7.7s**, TBT
is **1,860ms**. On a real mid-tier mobile connection this page will fail LCP
and INP for effectively all visitors, and 8MB of billable Firebase Storage
egress per page view is also a cost concern at 108-product-catalog scale.

**Fix (highest priority, biggest single win on the site):**
- Add `loading="lazy"` to every product-grid `<img>` except the first
  visible row (leave those eager/high `fetchpriority` so the actual LCP
  candidate isn't delayed).
- Serve resized thumbnails, not full-resolution Firebase Storage originals.
  Either put a resize step in the upload pipeline (e.g. a Firebase Storage
  "Resize Images" Cloud Function/extension) or proxy through an image CDN
  transform (Vercel's built-in Image Optimization via `@sveltejs/enhanced-img`
  or a `next/image`-style loader would work well since the site is already
  on Vercel) so the grid requests ~400×500 WebP/AVIF variants instead of
  800–1200px JPEGs.
- Add explicit `width`/`height` (or keep the current aspect-ratio wrapper
  divs, which are already doing their job for CLS — just don't remove them).
- Consider genuine pagination, a "load more" button, or virtualization for
  108 items; even with lazy-loading fixed, shipping the full 108-item DOM
  and image manifest upfront is unnecessary for a catalog this size.

### 2. Firebase Storage is used as a raw file host for all product/marketing imagery, site-wide — no resizing, no responsive variants
This is the systemic root cause behind both the listing page (#1) and the
homepage's poor LCP. Every `productos/*.jpeg` URL returned by Lighthouse's
image-delivery audit is flagged as "larger than it needs to be" for its
displayed size — e.g. an 800×1000 product photo displayed at 394×394
wastes 103KB; a 677×1200 Instagram thumbnail displayed at 411×548 wastes
up to 175KB. Homepage image-delivery audit alone estimates **2,051 KiB**
of wasted image bytes; product page estimates 234 KiB; this compounds
hugely on the 108-image listing page. None of the ~150+ distinct image URLs
observed across the three pages use `srcset`/`sizes` for responsive
delivery.

**Fix:** same as #1 — introduce a resizing step (Firebase Extension,
Cloud Function, or CDN-based transform) so product photography and
Instagram/brand imagery are served at the resolutions actually needed per
breakpoint, in WebP/AVIF. This is an architecture-level fix that will
improve LCP on every page that references Firebase-hosted media, not just
the two flagged above.

---

## High

### 3. Homepage ships 4.6MB / 91 requests, including an 846KB autoplay-adjacent video, before first paint completes
`total-byte-weight` for `/` is 4,648 KiB: 41 images (2.7MB), **1 video file
at 846KB** (an Instagram Reel `.mp4` fetched via Firebase Storage even
though a static poster JPG for the same reel already exists and is also
being downloaded separately), 30 scripts (712KB), plus fonts/CSS. LCP is
19.1s and TBT is 1,960ms — the worst of the three pages by a wide margin.
**Fix:** set the reel `<video>` to `preload="none"` and only fetch the
actual `.mp4` on user interaction (play click) rather than on page load;
rely on the poster image (already present) for the initial paint. Combine
with the image-resizing fix in #2 for the Instagram thumbnails and
`fondo.webp` hero background (131KB, 114KB of which Lighthouse flags as
recoverable via better compression).

### 4. No `fetchpriority`/preload for the actual LCP candidate, and the LCP element itself couldn't be confirmed
Because the homepage trace hit the benign `NO_LCP` insight-computation error
noted above, Lighthouse's dedicated LCP-element/LCP-phase breakdown audits
didn't populate for `/`. The observed `largest-contentful-paint` metric
(19.1s) is trustworthy, but confirm manually in Chrome DevTools which element
is winning LCP (the hero copy block / background image at the top of the
page, `div.grid > div > section.isolate`, is the likely candidate based on
the CLS-culprits data) and add `fetchpriority="high"` + a `<link rel=preload>`
for it once identified.

### 5. Custom web font (`Manrope-Regular.ttf`, ~95–97KB) blocks text render and causes measurable layout shift
Flagged by Lighthouse's font-display insight on every page (homepage: 1,270ms
estimated savings; product page: 275ms). On the homepage, the CLS-culprits
audit attributes **0.015 of the total 0.017 CLS score** directly to this web
font swapping in over the hero heading — it is the single largest layout-shift
contributor on the page (the other minor culprit is an unsized partner-logo
image, see Low #10). The font isn't preloaded (no `<link rel=preload as=font>`
found) and is served as `.ttf` rather than `.woff2` (worse compression, larger
transfer).
**Fix:** convert to WOFF2, add `<link rel=preload as="font" type="font/woff2"
crossorigin>` for it in `<head>`, and ensure `font-display: swap` (or better,
`optional`) is set so it can't force a layout-shifting reflow at all.

### 6. Product detail page: gallery/related-product thumbnails still pull full-resolution Firebase originals
Even on the best-performing template, `image-delivery-insight` finds 234 KiB
of avoidable image weight: the logo (`logo.webp`, 945×639 displayed at
140×95, wasting 62KB) and three related-product thumbnails pulling
960×1200/958×1200 Firebase originals for ~184×230 display slots (wasting
38–56KB each). LCP is 5.0s (just past the 4.0s "Poor" threshold) and TBT is
770ms. Same fix as #1/#2 — resize at the source.

### 7. Heavy client-side hydration produces long main-thread tasks on every template
Homepage: 18 long tasks (up to 862ms), mainthread-work-breakdown totals
13.8s (script evaluation 3.4s, style/layout 3.1s — the latter likely GSAP
carousel/marquee layout work). Listing page: 18 long tasks (up to 441ms),
9.3s mainthread total. Product page: 10 long tasks (up to 600ms). ~30 JS
chunks are fetched per page (SvelteKit hydration + GSAP + Firebase SDK +
Google API SDK), several exceeding 50ms of scripting each. One chunk in
particular (`C_If4RCk.js`, ~158–175KB) is **85–87% unused** on the pages
where it loads (137–152KB of dead code shipped per page load) — worth
auditing for what's bundling into it (possibly Firebase Auth/Firestore
modules or GSAP plugins that aren't tree-shaken for the homepage/product
use case).
**Fix:** code-split so GSAP/carousel logic only loads on pages that use it,
audit `C_If4RCk.js` for dead code, and consider breaking up hydration work
with `requestIdleCallback`/chunking so no single task exceeds ~50ms. As
noted in the Method section, treat the absolute TBT numbers as
CPU-calibration-affected, but 18 long tasks with several >400ms is a real
signal independent of calibration.

---

## Medium

### 8. Firebase Auth iframe (289KB) and Google Sign-In SDK (122KB) load unconditionally on every page, not on-demand
`https://moonbeauty-9ba8f.firebaseapp.com/__/auth/iframe.js` (289KB) and
`apis.google.com/.../gapi_iframes` + `api.js` (122KB combined, 30–41ms
main-thread each) were observed loading on **all three** pages tested —
homepage, product detail, and listing — even though there's no visible
sign-in UI actively in use on initial load. This is separate from Vercel
Analytics/Speed Insights (which are intentionally installed and out of
scope for this flag — notably, no requests to `/_vercel/insights/script.js`,
`/_vercel/speed-insights/script.js`, or `va.vercel-scripts.com` were observed
in any of the three traces or in the raw page source; if they're expected to
be actively collecting field data, it's worth a quick manual DevTools check
outside this audit to confirm they still fire in a real browser session).
**Fix:** defer Firebase Auth initialization (and the Google API SDK it pulls
in) until the user actually opens the login/account-creation popup mentioned
in `SITE-CONTEXT.md`, rather than on every page load.

### 9. Icons fetched at runtime from third-party APIs, duplicated across two providers
Every page queries `api.iconify.design` **and** `api.simplesvg.com` for the
same icon sets (material-symbols, mdi, keyline-icons, gg, ph) — e.g. on the
homepage both hosts are queried for overlapping icon lists, roughly doubling
the number of small icon-fetch requests needed for basic UI chrome (search,
cart, nav, WhatsApp/Instagram icons). This is Iconify's runtime API fallback
behavior, not a bug, but it's avoidable.
**Fix:** bundle icons at build time instead (e.g. `unplugin-icons` or a
self-hosted SVG sprite) so icon rendering has zero runtime network
dependency.

### 10. Render-blocking CSS on every template
A single stylesheet chunk (`_app/immutable/assets/0.BrNmshnv.css`, ~59–60KB)
is flagged as render-blocking on all three pages, with Lighthouse estimating
~440–450ms of savings if it were split/inlined. Given it's the same file on
every route, most of it is likely global/shared CSS rather than route-critical
CSS.
**Fix:** extract above-the-fold critical CSS per template and defer/inline
the rest, or confirm SvelteKit/Vite's CSS code-splitting is configured to
emit smaller per-route chunks instead of one shared bundle.

### 11. TTFB ~650–800ms on every page (SSR on Vercel)
`server-response-time` audit: homepage 797ms, product 690ms, listing 650ms.
All exceed the ~200ms "good" TTFB guidance and eat 15–20% of the LCP time
budget before any client rendering starts. Given the stack is SvelteKit SSR
+ Firestore reads per request, investigate whether product/category data
needed for SSR can be cached at the edge (Vercel's ISR/data cache, or a
short-TTL cache in front of Firestore) rather than re-queried on every
request.

---

## Low

### 12. Unsized partner-logo image causes a minor CLS contribution
`/logos/Medicube.webp` in the homepage brand marquee has no explicit
dimensions and is flagged by the CLS-culprits audit as an "unsized image
element" contributing to two of the homepage's small layout-shift events.
Trivial fix: add `width`/`height` to all marquee logo images.

### 13. No preconnect hints for the cross-origin hosts actually in use
Lighthouse's network-dependency-tree insight found **zero** preconnected
origins on the homepage despite the page depending on
`firebasestorage.googleapis.com`, `apis.google.com`,
`api.iconify.design`/`api.simplesvg.com`. Add `<link rel="preconnect">`
(and `dns-prefetch` as a fallback) for `firebasestorage.googleapis.com` at
minimum, since it's the single biggest external dependency by bytes on every
template.

---

## Priority order for remediation (expected impact)

1. **Fix image delivery from Firebase Storage** (resize + lazy-load + WebP/AVIF) — items #1 and #2. This alone should cut the listing page from ~9MB to well under 1MB and is very likely to move LCP on all three templates from "Poor" into "Needs Improvement" or "Good" range.
2. **Defer the homepage reel video and reduce homepage image weight** (#3) — homepage LCP is the worst offender at 19.1s.
3. **Preload/convert the web font to WOFF2** (#5) — cheap fix, removes the largest CLS contributor and ~275–1,270ms of render delay.
4. **Reduce/defer JS: code-split GSAP, defer Firebase Auth SDK, dedupe icon-fetching** (#7, #8, #9) — addresses TBT/INP risk.
5. **Critical CSS + TTFB investigation** (#10, #11) — smaller wins, worth doing once the above are shipped.

## Files referenced
- Lab data: Lighthouse 13.4.1 JSON reports generated for this audit (homepage, `/products/1`, `/products`), mobile emulation, default throttling.
- Rendered DOM check for `/products`: confirmed via `render_page.py --mode auto` (108 `<img>` tags, 0 with `loading="lazy"`, 0 with `width`/`srcset`).
