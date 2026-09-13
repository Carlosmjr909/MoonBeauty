# GEO (Generative Engine Optimization) Audit — moonbeautyval.com

**Audited:** 2026-09-13
**Scope:** AI Overviews / ChatGPT Search / Perplexity / Bing Copilot readiness
**Method:** live fetch of all 108 product pages + home, `/products`, `/categorias`, 12 category
URLs (sampled), 4 legal pages; robots.txt + llms.txt + RSL probes; 12 crawler user-agent
access tests; JSON-LD, heading, and passage-level extraction against raw SSR HTML.

---

## GEO Readiness Score: 50 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 44% | 11.0 |
| Structural Readability | 20% | 35% | 7.0 |
| Multi-Modal Content | 15% | 47% | 7.0 |
| Authority & Brand Signals | 20% | 40% | 8.0 |
| Technical Accessibility | 20% | 85% | 17.0 |
| **Total** | | | **50.0** |

The site is **technically wide open to every AI crawler and fully server-rendered** — the hard
part is already done. What blocks citation is almost entirely *semantic*: AI engines can fetch
every page but cannot tell what most of them are about, who makes the products, or what the
business actually does and where.

### Platform-specific estimates

| Platform | Score | Limiting factor |
|---|---|---|
| Google AI Overviews | 52 | Googlebot fine + Knowledge Graph entity exists; no `Product` schema kills product/shopping surfaces |
| Perplexity | 48 | Good factual product prose, but no headings to anchor passage extraction |
| ChatGPT Search | 45 | OAI-SearchBot allowed; almost no third-party corroboration to cross-reference |
| Bing Copilot | 45 | bingbot allowed; leans hard on structured data, which is absent |

---

## AI Crawler Access Status — PASS

`robots.txt` uses a single `User-agent: *` group with `Allow: /` and disallows only
`/admin`, `/account`, `/checkout`, `/login`, `/create_account`, `/forgot-password`.
There are no per-bot rules, so every crawler below inherits the wildcard `Allow: /`.

I also verified this is not silently overridden at the Vercel edge — each UA below was issued
a live request for a product page. All returned **HTTP 200 with an identical 134,981-byte
response**, i.e. no bot blocking, no throttling, no cloaking, no degraded variant.

| Crawler | What it actually governs | robots.txt | Live fetch |
|---|---|---|---|
| **OAI-SearchBot** | ChatGPT Search citability | Allowed | 200 |
| **Claude-SearchBot** | Claude search citability | Allowed | 200 |
| **PerplexityBot** | Perplexity index | Allowed | 200 |
| Googlebot | Google Search **and AI Overviews** | Allowed | 200 |
| bingbot | Bing + Copilot | Allowed | 200 |
| Applebot | Siri / Spotlight / Safari discoverability | Allowed | 200 |
| ChatGPT-User / Perplexity-User | live user-triggered fetches | Allowed | 200 |
| GPTBot | OpenAI **training** only — not ChatGPT Search | Allowed | 200 |
| ClaudeBot | Anthropic **training** only — not Claude search | Allowed | 200 |
| Google-Extended | Gemini/Vertex **training+grounding** only — never Search/AIO | Allowed (wildcard) | n/a |
| Applebot-Extended | Apple Intelligence **training** only — never Siri/Spotlight | Allowed (wildcard) | n/a |
| meta-externalagent, Bytespider | Meta AI / TikTok training | Allowed | 200 |

**Correction to the brief:** the audit request framed GPTBot, ClaudeBot, and Google-Extended as
AI-search-visibility crawlers. They are not. Blocking GPTBot would *not* remove the site from
ChatGPT Search (that is OAI-SearchBot), and blocking Google-Extended would *not* affect AI
Overviews (those follow Googlebot). All three are training-scope crawlers. Right now nothing is
blocked, which is the correct posture for a store that wants maximum AI visibility — the only
question is whether the owner wants to opt out of *training* use, which is a business decision
with no visibility downside. See L5.

**No `X-Robots-Tag` headers**, no `noindex` on any page checked. `Cache-Control: public,
max-age=300` is crawler-friendly.

## llms.txt / AI licensing status

| File | Status |
|---|---|
| `/llms.txt` | **404 — absent** |
| `/llms-full.txt` | 404 — absent |
| `/ai.txt` | 404 — absent |
| `/.well-known/rsl.xml` (RSL 1.0) | 404 — absent |

Treated as **Low priority** (L1/L2) per the brief's framing, and I agree with that framing.
Google has publicly confirmed Search ignores `llms.txt`, and neither OpenAI, Anthropic, nor
Perplexity has documented consuming it for retrieval either. For a 127-page catalogue there is
no realistic upside. Fixing the `Product` schema gap (C1) delivers strictly more value for
strictly less effort.

---

## Findings

### CRITICAL

#### C1 — Zero `Product` / `Offer` structured data on all 108 product pages
**Verified:** parsed JSON-LD on all 108 product URLs. **0 of 108** contain a `Product` node.
The *only* JSON-LD emitted anywhere on the site is the sitewide `OnlineStore` block (plus
`WebSite` on home). Every product page repeats the same store-level `OnlineStore` JSON and
nothing product-specific.

This is the single highest-impact GEO defect. All the data a `Product` node needs is already
rendered in the SSR HTML and just needs to be emitted as JSON-LD:

- name, description, image — present
- **brand** — present in the DB (shown on listing cards) but not on detail pages
- **price in USD and VES** — present (`USD 5,00` / `VES 4.162,44`)
- **availability** — present, three distinct states observed: `Agregar al carrito`,
  `¡Últimas 3 unidades disponibles!`, `Agotado` / `Sin stock`
- `priceCurrency`, `itemCondition`, `url` — trivially derivable

Consequence: Google AI Overviews' shopping/product surfaces, ChatGPT shopping, Bing Copilot
product answers, and Perplexity's product cards all have **nothing to attach to**. A store
answering "¿dónde compro protector solar coreano en Venezuela?" is invisible to precisely the
surfaces that answer that question.

Note the dual-currency wrinkle: emit USD as the primary `Offer` (stable, matches `priceCurrency: "USD"`)
and either omit VES or add it as a second `Offer`. Do **not** emit a VES price that drifts from
the displayed rate — mismatched price markup is a structured-data penalty risk.

**Effort:** Low — one Svelte component in the product route, all fields already in scope.

#### C2 — No `<h1>` on any page except the 4 legal pages; only heading on commercial pages is "Tu carrito"
**Verified:** heading extraction across home, `/products`, `/categorias`, category pages, and
product pages.

| Page | h1 | h2 | h3 |
|---|---|---|---|
| `/` (home) | **0** | 1 — `Tu carrito` | 1 — `Tu carrito está vacío` |
| `/products` | **0** | 1 — `Tu carrito` | 1 |
| `/products?categoria=Protector solar` | **0** | 1 — `Tu carrito` | 1 |
| `/products/{id}` (all 108) | **0** | 1 — `Tu carrito` | 1 |
| `/categorias` | **0** | 12 — category names (good) | 1 |
| `/envios` and legal pages | 1 (correct) | 6 incl. `¿Tu pedido no llegó?` | 1 |

So on **122 of 127 indexable pages the only semantic heading describes the shopping cart
drawer.** The visually-large text ("Tu piel, en su mejor era", product names, "Nuestra esencia")
is rendered in non-heading elements.

For GEO this is worse than it is for classic SEO. Passage-ranking systems (AI Overviews,
Perplexity) segment a document by its heading hierarchy to decide what a passage is *about*
before deciding whether to cite it. With no headings, every page is one undifferentiated blob,
and the one labelled section is the cart — actively misleading.

The legal pages prove the codebase has no technical obstacle to this; the commercial routes just
never got semantic markup.

**Fix:** product name → `<h1>`; "Recomendados" → `<h2>`. Home: hero headline → `<h1>`,
"New arrivals" / "Marcas que amamos" / "Lo que dicen de nosotras" / "Nuestra esencia" → `<h2>`.
Category pages: `Protector solar` → `<h1>`. Demote the cart drawer heading (it is an off-canvas
UI panel, not document content).

**Effort:** Low — element swaps, no layout change if the existing type classes are kept.

#### C3 — Product brand is absent from detail pages, titles, and meta descriptions
**Verified:** only **22 of 108** product detail pages mention a known K-Beauty brand anywhere in
the main content block, and those are incidental mentions inside description prose, not a brand
label. The listing pages *do* render the brand correctly on every card (`TOCOBO`, `Dr. Althea`,
`Medicube`, `Beauty of Joseon`, `Centellian24`, `AXIS-Y`, `Mixsoon`, `Treecell`,
`Well-being Health Pharm`, `Heimish`, `Tocobo`...). The data exists; the detail route just
doesn't display it.

Concrete consequences:

- `/products/0GJ7WCWLCHvisN1gqEuo` — the entire page identifies this product as **"Hand Cream"**.
  Title: `Hand Cream · Moon Beauty`. Image alt: `Hand Cream`. It is a Well-being Health Pharm
  product, and nothing on the page says so.
- Same pattern for `Madeca Cream`, `Powder Cream Lip Balm`, `Vita Tone Up Sun Cream`,
  `Triple PDRN Gel Toner`, `Centella Mask (1ea)`, `Jelly Seal Dewy Mask`, and ~80 others.

An LLM cannot cite "Hand Cream" — it is an unresolvable entity. Worse, it cannot *match* the page
to a user query like "¿tienen la Madeca Cream de Centellian24?" because the brand token never
co-occurs with the product name on the page it should rank. Brand+product is the dominant query
form in K-Beauty; this gap forfeits it across 86 pages.

**Fix:** render brand as an eyebrow label above the `<h1>` on the detail page, include it in the
`<title>` (`Centellian24 Madeca Cream · Moon Beauty`), in the image `alt`, and as `brand.name` in
the C1 `Product` schema. One data field, four surfaces.

**Effort:** Low.

---

### HIGH

#### H1 — No factual entity statement anywhere; "Naguanagua" appears 0 times sitewide; delivery model undocumented
The brief describes the business as delivery-only serving **Valencia and Naguanagua** with
WhatsApp checkout. I searched all 127 fetched pages:

- **`Naguanagua`: 0 occurrences sitewide.**
- `Valencia` / `Carabobo`: present, but only in the meta description, `og:description`, the
  `OnlineStore` JSON-LD address, and the footer contact block — **never in body prose.**
- `delivery`: 2 occurrences on home, both inside the same meta/og description string.
- There is **no About/Nosotros page** (`/nosotros`, `/about`, `/sobre-nosotros` all 404), no
  `/contacto` (404), no FAQ (404), no blog (404). The sitemap confirms: 1 home + 1 `/products`
  + 12 categories + 108 products + `/categorias` + 4 legal. Zero informational pages.

The homepage body, in full, offers this as its self-description: *"Skincare coreano seleccionado
para elevar tu rutina diaria y darle a tu piel el glow que se merece"*, *"La ciencia de la calma"*,
*"Luminous Serenity"*, *"Descubre el brillo que nace desde adentro"*. That is atmosphere, not
information. There is not one extractable sentence stating what Moon Beauty is, where it
operates, who it serves, or how delivery works.

This is the difference between being crawled and being *cited*. For local-intent queries —
"tienda de skincare coreano en Valencia Venezuela", "¿hacen delivery en Naguanagua?",
"dónde comprar Beauty of Joseon en Carabobo" — the model needs a self-contained, quotable
passage. There is none, so it will cite a competitor or the Instagram profile instead.

**Fix:** add a 134–167 word About block (the optimal citation passage length) on the homepage
*and* a dedicated `/nosotros` page, written as flat declarative fact. Something structurally like:

> Moon Beauty es una tienda venezolana de skincare coreano (K-Beauty) con sede en Valencia,
> estado Carabobo. Opera bajo un modelo de solo delivery — no tiene tienda física para visitas.
> Realiza entregas a domicilio en Valencia y Naguanagua y envía a todo el territorio venezolano
> por encomienda. El catálogo reúne N productos de M marcas coreanas, entre ellas Beauty of
> Joseon, Medicube, TOCOBO, Dr. Althea, Centellian24, AXIS-Y y SKIN1004. Los precios se muestran
> en dólares y en bolívares. Los pedidos se coordinan y confirman por WhatsApp al +58 412-505 0043.

Every clause there is a fact an engine can lift verbatim. Mirror the same facts into the
`OnlineStore` JSON-LD via `areaServed` (Valencia, Naguanagua, Venezuela).

**Effort:** Medium (copywriting + 1 route).

#### H2 — The 12 category landing pages have zero descriptive prose
`/categorias` contains genuinely excellent, factual, citation-grade category copy — e.g. for
sunscreen: *"Los protectores solares coreanos ofrecen alta protección (SPF 50+ y PA++++) con
texturas ultraligeras en gel o esencia que se absorben al instante sin dejar rastro blanco ni
grasa..."* That is exactly the kind of passage AI engines cite.

But it is stranded. `/products?categoria=Protector%20solar` — the page that actually targets
"protector solar coreano" — goes straight from `Categoría: Protector solar` to the product grid
with **no prose at all**. Extracted body text on that page is the promo banner plus product
names and prices.

So the citable content sits on an index page with 12 topics competing for one URL, while the 12
topically-focused URLs have nothing to cite.

**Fix:** render the existing category description (already in the data) as an intro paragraph
under the new `<h1>` on each `?categoria=` page. Near-zero cost, it's the same field.
Expand the two thin ones (`Suplementos` and `Cuidado Corporal` are one-liners of ~12 words vs
~45 for the rest).

**Effort:** Low.

#### H3 — All 108 product meta descriptions are mechanically truncated mid-word
The brief flagged this as the thing most worth double-checking. Result:

- **Uniqueness: PASS.** 108 unique titles, 108 unique descriptions, zero duplicates.
- **Truncation: FAIL.** **108 of 108** descriptions end in an ellipsis. Length distribution is
  min 159 / median 160 / max 160 characters — i.e. every single one is a hard character-count
  slice of the body copy, not a written description.

Examples of where the cut lands:

- `/products/1`: `...Contiene ingredientes como Agua d…` (cut mid-word)
- `/products/0GJ7...`: `...Se absorbe rápidamen…` (cut mid-word)
- `/products?categoria=Protector solar`: `...Skincare coreano…`

Non-product pages (home, `/products`, `/categorias`, legal) have proper hand-written
descriptions and are fine — this is specific to the 108 product pages.

For GEO this matters because several engines seed their snippet/summary from the meta
description; a sentence severed mid-word reads as low-quality and is unquotable.

**Fix:** truncate on the last sentence boundary under 155 chars rather than a raw slice, or
better, prepend the brand and compose: `{Brand} {Product} — {first complete sentence}`.
A sentence-boundary truncation helper is ~5 lines.

**Effort:** Low.

#### H4 — Confirmed factual error in product copy: `/products/1`
`/products/1` is titled **`Cotton Soft Sun Stick`** (TOCOBO, SPF50+ PA++++, USD 22,00) but its
description reads:

> "Una de las cremas más conocidas de **Dr. Althea** ahora tiene una versión **en bruma** que
> ayuda a refrescar tu piel y tu maquillaje... **Agita para integrar la fórmula bifásica**..."

That describes a Dr. Althea two-phase facial *mist*, not a TOCOBO sunscreen *stick*. The wrong
product record's description is attached to a live, sitemap-listed, indexable page.

This matters more for GEO than for classic SEO. A ranking algorithm mis-ranks the page; a
generative engine *ingests the claim as fact* and may tell a user that a sun stick should be
shaken because it has a biphasic formula. Once a model has been trained on or retrieves that
association, it is expensive to unwind. It also risks the whole domain being scored as
low-reliability if spot-checks find contradictions.

I found this in a sample of 2 detail pages, which suggests it may not be isolated.
**Audit all 108 descriptions for brand/format mismatch** — a quick automated pass flagging any
description whose named brand differs from the product's assigned brand, or whose stated format
(bruma/crema/stick/sérum/parche) conflicts with the product name, will surface the rest.

**Effort:** Low to detect, Medium to remediate depending on how many records are affected.

#### H5 — Almost no off-site entity corroboration; `sameAs` lists only Instagram
AI engines weight independent, third-party corroboration heavily when deciding whether a small
commercial domain is citable. Current state:

| Signal | Status | Correlation w/ AI citation |
|---|---|---|
| **YouTube presence** | **None** — `youtube.com/@moonbeautyval` returns 404 | **~0.737 (strongest known)** |
| Reddit presence | None found | High |
| Wikipedia entity | None (`es.wikipedia.org/wiki/Moon_Beauty` → 404) | High |
| LinkedIn company page | **None** — returns 404 | Moderate |
| Instagram | Present — `@moonbeauty.val`, **734 followers, 17 posts** | Moderate |
| Google Business Profile | **Present and, notably, has a Knowledge Graph entity** | High |

The GBP result is the strongest asset here and it is under-exploited. The share link resolves to
`google.com/search?kgmid=/g/11ntskjjk6&q=Moon+Beauty+Val` — **Moon Beauty Val already has a
Google Knowledge Graph MID (`/g/11ntskjjk6`)**. Google has already resolved this business as a
distinct entity. That is the hard part, and the site does not reference it anywhere.

Yet `sameAs` on the `OnlineStore` node contains exactly one URL:
`["https://www.instagram.com/moonbeauty.val/"]`.

**Fixes, in order of value per unit effort:**
1. Add the GBP/Maps URL to `sameAs` (and TikTok/Facebook if the accounts are real — I could not
   confirm either, since TikTok returns 200 for non-existent handles). **Effort: trivial.**
2. Get the Instagram content onto **YouTube** as Shorts — it is the same vertical video already
   being produced, and it is the single strongest correlate with AI citation. 17 IG posts is a
   thin corpus; YouTube would also create an indexable, transcribable, citable surface that
   Instagram does not provide (Instagram is largely opaque to AI crawlers). **Effort: Medium,
   highest ceiling.**
3. Seed genuine presence in Venezuelan skincare communities (Reddit r/Venezuela, r/AsianBeauty)
   — organic participation, not promotion.

**Effort:** Low (1) / Medium (2,3).

---

### MEDIUM

#### M1 — No `BreadcrumbList`, `ItemList`, or `CollectionPage` schema
Product pages render a visible breadcrumb (`Inicio › Productos › Categorías`) but emit no
`BreadcrumbList`. Note the visible trail is also generic global nav — it does not reflect the
product's actual category or include the product itself, so it conveys no hierarchy.

The 12 category pages and `/products` are product listings with no `ItemList` / `CollectionPage`
markup, so engines must infer the grid's meaning from unlabelled DOM.

**Fix:** `BreadcrumbList` (Inicio › Categorías › {Categoría} › {Producto}) on product pages;
`CollectionPage` + `ItemList` on category pages. Pairs naturally with the C1 schema work.
**Effort:** Low.

#### M2 — No FAQ content; the answers that do exist defer to WhatsApp and are unextractable
`/envios` is well-structured (proper `h1`, question-style `h2`s including `¿Tu pedido no llegó?`)
— the template is right. The *content* is not answerable:

> **Costo de envío:** "se calcula según tu ubicación y **se te informa por WhatsApp**"
> **Tiempos de entrega:** "depende de tu zona... **te lo confirmamos al coordinar tu pedido**"
> **Cobertura:** "Hacemos envíos a nivel nacional dentro de Venezuela" — Valencia and
> Naguanagua are never named on the one page where coverage is defined.

Every answer is a pointer to an off-web channel. An AI engine asked "¿cuánto cobra Moon Beauty
por delivery en Valencia?" has literally nothing to extract.

I understand *why* — a VES-denominated business in a high-inflation market cannot publish fixed
figures. But ranges and rules are publishable and citable: "Delivery en Valencia y Naguanagua:
entrega en 24–48 h. Envío nacional por encomienda: 2–5 días hábiles. El costo depende de la zona
y se confirma por WhatsApp antes del despacho."

**Fix:** add a `/preguntas-frecuentes` page with `FAQPage` schema covering: zonas de delivery,
tiempos, métodos de pago (the promo banner already names Efectivo $, Binance, Zelle, Zinli —
these are facts, and they are currently buried in a marketing ribbon repeated 6× per page),
¿tienen tienda física?, ¿los productos son originales?, ¿cómo compro por WhatsApp?
Note `FAQPage` rich results are deprecated in Google Search for non-gov/health sites, but the
markup **is still consumed by AI/LLM extraction pipelines** — worth adding for that reason alone.
**Effort:** Medium.

#### M3 — Thin multi-modal signals
- Product detail pages carry **one image each** (verified on sampled pages: logo + 1 product
  image + recommendation thumbs). No gallery, no texture/swatch/packaging shots, no video.
- Alt text is otherwise decent — brand logos use correct brand names (`Anua`, `Purito`,
  `Pyunkang Yul`, `Skin1004`, `Celimax`, `Arencia`...), product images use the product name —
  but they inherit C3's flaw (`alt="Hand Cream"`, no brand).
- The 14 Instagram embeds on the homepage **all share one identical alt**:
  `"Publicación de Moon Beauty en Instagram"` — 14 images contributing zero descriptive signal.
- No `ImageObject` or `VideoObject` markup anywhere.

**Fix:** add brand to image alts; give the Instagram embeds per-post alts (or mark them
decorative with `alt=""` — either is better than 14 identical strings); add product images to the
C1 `Product` schema as an `image` array. **Effort:** Low–Medium.

#### M4 — Inconsistent entity naming across surfaces
Four different names for one business:

| Surface | Name |
|---|---|
| `<title>`, JSON-LD `name`, `og:site_name` | `Moon Beauty` |
| Footer + copyright + JSON-LD `alternateName` | `MoonBeauty` |
| Google Business Profile / Knowledge Graph | `Moon Beauty Val` |
| Instagram | `Moon Beauty \| Skincare Coreano Valencia` |

"Moon Beauty" is a generic, globally reused name — there are unrelated businesses using it in
several countries. Inconsistent naming raises the risk that an engine fails to reconcile the
site with the existing `/g/11ntskjjk6` Knowledge Graph entity, or merges it with a foreign
namesake.

**Fix:** pick `Moon Beauty` as canonical, keep `Moon Beauty Val` and `MoonBeauty` as
`alternateName` values (an array — currently only one is set), and always pair the name with the
disambiguating qualifier "Valencia, Venezuela" in titles and prose. **Effort:** Low.

#### M5 — Raw whitespace inside `<title>` on `/products` and the 12 category pages
Actual emitted markup: `<title>\n\t\tProductos | Moon Beauty\n\t</title>` and
`<title>\n\t\tProtector solar | Moon Beauty\n\t</title>`.

Home, `/categorias`, product pages, and legal pages are clean, so this is isolated to the
`/products` route template. Renderers normalise whitespace, so impact is cosmetic, but it is a
1-character fix (trim the Svelte `<svelte:head>` interpolation) and it removes noise from
extraction pipelines.

Related: category titles are bare (`Protector solar | Moon Beauty`). Given these are the main
local-commercial landing pages, `Protector solar coreano | Moon Beauty Valencia` would carry the
qualifying tokens. **Effort:** Low.

#### M6 — Category pages are query-parameter URLs
All 12 category landing pages are `?categoria=X` with URL-encoded spaces
(`?categoria=Contornos%20de%20ojos`). They are correctly listed in the sitemap and return 200,
so this is not a blocker. But parameterised URLs are more likely to be treated as duplicates or
deprioritised as canonical citation targets than clean paths, and AI engines that surface a
source URL to users render these poorly.

Given these are the highest-commercial-intent pages on the site, `/categorias/protector-solar`
would be materially stronger. Also worth noting `Tonicos` is missing its accent (`Tónicos`) in
the category slug/name.

**Fix:** path-based category routes with 301s from the current parameter URLs. **Effort:** Medium
— worth scheduling, not urgent.

---

### LOW

#### L1 — `/llms.txt` absent
Confirmed 404, as anticipated. Low priority and I'd leave it. Google Search explicitly ignores
it; no major AI search engine has documented consuming it for retrieval. If one is ever added,
the highest-value contents would be the H1 About paragraph plus links to `/categorias` and
`/preguntas-frecuentes` — but build those pages first; `llms.txt` can only point at content that
exists. **Effort:** Low, low value.

#### L2 — No RSL 1.0 licensing
`/.well-known/rsl.xml` returns 404. RSL is an emerging AI-content-licensing standard. For a
127-page product catalogue with no original editorial corpus there is nothing to license and no
reason to act. Revisit only if the store starts publishing substantial original K-Beauty
editorial content. **Effort:** n/a.

#### L3 — No `dateModified` / freshness signal on commercial pages
Legal pages carry `Última actualización: 2 de septiembre de 2026`. Home, category, and the 108
product pages carry no visible or structured date. AI engines weight recency when choosing
between candidate sources, and for a store with live prices and stock, freshness is a genuine
competitive advantage that is currently invisible. Add `dateModified` to the `Product` schema in
C1 (free — you are already writing that node). **Effort:** Low.

#### L4 — Homepage testimonials carry no `Review` markup — and should stay that way
Three named testimonials (Danniela Jimenez, Dernys Camacho, Genesis Jimenez) plus a
`Ver todas en Google` link. Per the brief these are manually curated, not API-sourced.

**Recommendation: do not add `Review`/`AggregateRating` schema to these.** Google's structured
data policy prohibits self-serving review markup for reviews collected and published by the
business about itself, and it carries manual-action risk. The current implementation — plain
testimonials plus a link out to the real Google reviews — is the correct and safe pattern.
Flagging it here so a later audit pass doesn't "fix" it into a penalty.

If verified ratings are wanted in AI answers, the route is the Google Business Profile (which
already has a Knowledge Graph entity), not on-site markup. **Effort:** none — no action.

#### L5 — Training-scope crawlers are unrestricted (informational)
`CCBot`, `ClaudeBot`, `GPTBot`, `Google-Extended`, `Applebot-Extended`, `cohere-ai`,
`meta-externalagent`, and `Bytespider` all inherit `Allow: /`. This means product copy and
imagery may be used for model training.

**No action recommended.** Blocking these would not reduce AI *search* visibility (that's
OAI-SearchBot / Claude-SearchBot / PerplexityBot / Googlebot / bingbot / Applebot, all of which
must stay allowed), but for a small brand fighting for entity recognition, presence in training
corpora is mildly net-positive. Noting it only so the choice is explicit rather than accidental.

---

## What is already working (do not regress)

- **Full SSR, no SPA shell.** `is_spa: false`; every AI crawler UA receives the complete
  134,981-byte document with products, prices, stock states, and footer NAP in the initial HTML.
  No hydration dependency, no cloaking, byte-identical across all 12 UAs tested.
- **robots.txt is correct.** Public catalogue open, transactional/private paths closed, sitemap
  declared and accurate (127 URLs, all 200).
- **Meta description uniqueness: 108/108 unique**, zero duplicates sitewide (truncation is the
  only issue — H3).
- **Title uniqueness: 108/108 unique.**
- **`/categorias` category copy is genuinely citation-grade** — factual, ingredient-specific,
  ~45 words each, with correct `<h2>` structure. This is the quality bar the rest of the site
  should meet; it just needs to be distributed to the pages that need it (H2).
- **Product body descriptions are substantive and factual** — median 95 words, naming real
  actives (urea, hialuronato de sodio, centella asiática, pantenol, PDRN, SPF50+ PA++++).
  39 of 108 already fall in the 100–167 word citation sweet spot. This is real raw material;
  it is the missing brand (C3) and missing headings (C2) that make it uncitable, not the prose.
- **Legal page templates are correct** — proper `h1`, question-form `h2`s, `Última actualización`
  dates. Reuse this template for the new About/FAQ pages.
- **Footer NAP is present on all 127 pages** — `Valencia, Estado Carabobo, Venezuela`,
  `+58 412-505 0043`, `Todos los días · Respondemos por WhatsApp`, consistent with the
  `OnlineStore` JSON-LD `address` and `telephone`.
- **A Google Knowledge Graph entity already exists** (`/g/11ntskjjk6`). Most businesses this
  size do not have one. Everything in H1/H5 is about connecting the site to it.
- **Image alt coverage is good** — only 1 empty alt out of 50 on the homepage, brand logos
  correctly named.

---

## Top 5 highest-impact changes

| # | Change | Finding | Impact | Effort |
|---|---|---|---|---|
| 1 | Emit `Product` + `Offer` JSON-LD on all 108 product pages (name, brand, image, description, USD price, availability, url) | C1 | **Very high** — unlocks AI Overviews / Copilot / Perplexity product surfaces entirely | **Low** — data already rendered |
| 2 | Add real `<h1>` + section `<h2>`s to home, product, and category routes; demote the cart-drawer heading | C2 | **Very high** — makes 122 pages passage-extractable for the first time | **Low** — element swaps |
| 3 | Surface product **brand** on detail pages, in `<title>`, in image `alt`, and in `Product.brand` | C3 | **Very high** — makes 86 product pages resolvable entities and wins brand+product queries | **Low** — one existing data field |
| 4 | Write a factual 134–167 word About passage (home + `/nosotros`) naming Valencia **and Naguanagua**, delivery-only model, WhatsApp ordering, brand list; mirror into `areaServed` | H1 | **High** — creates the only citable answer for local-intent queries; currently zero exist | **Medium** |
| 5 | Move existing category descriptions onto the 12 `?categoria=` landing pages; add GBP URL to `sameAs` | H2, H5 | **High** — puts citable prose on the highest-intent URLs and links the site to its Knowledge Graph entity | **Low** |

Items 1–3 and 5 are all low-effort and together account for most of the gap between the current
50/100 and a realistic ~75/100. Item 4 is the one that requires writing rather than coding, and
it is the one that determines whether Moon Beauty can be cited as *a business* rather than merely
as a page of products.

---

## Structured findings (for `audit-data.json` — AI Search Readiness)

```json
{
  "category": "AI Search Readiness (GEO)",
  "score": 50,
  "dimensions": {
    "citability": { "score": 44, "weight": 25 },
    "structural_readability": { "score": 35, "weight": 20 },
    "multimodal": { "score": 47, "weight": 15 },
    "authority_brand": { "score": 40, "weight": 20 },
    "technical_accessibility": { "score": 85, "weight": 20 }
  },
  "platform_scores": {
    "google_ai_overviews": 52,
    "perplexity": 48,
    "chatgpt_search": 45,
    "bing_copilot": 45
  },
  "crawler_access": {
    "method": "robots.txt parse + live user-agent fetch of a product page",
    "all_200_identical_bytes": true,
    "edge_blocking_detected": false,
    "search_crawlers": {
      "OAI-SearchBot": "allowed", "Claude-SearchBot": "allowed",
      "PerplexityBot": "allowed", "Googlebot": "allowed",
      "bingbot": "allowed", "Applebot": "allowed",
      "ChatGPT-User": "allowed", "Perplexity-User": "allowed"
    },
    "training_crawlers": {
      "GPTBot": "allowed", "ClaudeBot": "allowed", "Google-Extended": "allowed",
      "Applebot-Extended": "allowed", "CCBot": "allowed",
      "meta-externalagent": "allowed", "Bytespider": "allowed"
    }
  },
  "llms_txt": { "status": "absent", "http": 404, "priority": "low" },
  "rsl_licensing": { "status": "absent", "http": 404, "priority": "low" },
  "structured_data": {
    "OnlineStore": "sitewide, valid, includes address + telephone + email",
    "WebSite": "home only",
    "Product": "0 of 108 product pages",
    "BreadcrumbList": "absent",
    "ItemList_CollectionPage": "absent",
    "FAQPage": "absent",
    "sameAs_count": 1
  },
  "content_metrics": {
    "indexable_pages": 127,
    "pages_with_h1": 4,
    "pages_without_h1": 123,
    "product_pages": 108,
    "product_meta_descriptions_unique": 108,
    "product_meta_descriptions_truncated": 108,
    "product_titles_unique": 108,
    "product_pages_mentioning_brand_in_main_content": 22,
    "product_body_word_count_median": 95,
    "product_pages_in_citation_sweet_spot_100_167_words": 39,
    "category_pages_with_intro_prose": 0,
    "informational_pages": 0,
    "confirmed_factual_errors": 1
  },
  "entity_signals": {
    "google_knowledge_graph_mid": "/g/11ntskjjk6",
    "google_business_profile": "present",
    "instagram": { "handle": "@moonbeauty.val", "followers": 734, "posts": 17 },
    "youtube": "absent", "linkedin": "absent",
    "wikipedia": "absent", "reddit": "none found",
    "naguanagua_mentions_sitewide": 0,
    "name_variants": ["Moon Beauty", "MoonBeauty", "Moon Beauty Val", "Moon Beauty | Skincare Coreano Valencia"]
  },
  "findings": {
    "critical": 3, "high": 5, "medium": 6, "low": 5
  }
}
```
