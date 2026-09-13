# Search Experience Optimization (SXO) — moonbeautyval.com

**Audited:** 2026-09-13
**Method:** Backwards SERP analysis on 5 Spanish-language buyer queries → page-type
classification → intent-match scoring against Moon Beauty's home, category and product
templates → user stories → persona scoring.
**Pages fetched:** `/`, `/products`, `/products?categoria=Protector solar`, `/categorias`,
`/products/1`, `/products/3`, `/products/5`, `/products/7`, `/products/10`,
`/products/AjApDNxlFk7pfmjBzAqA`, `/products/0GJ7WCWLCHvisN1gqEuo`, `/envios`
(all via `render_page.py --mode always`, `is_spa: false`, SSR confirmed).

> **SXO Gap Score: 38/100** — this is a *search-experience* score and is deliberately
> separate from the SEO Health Score in the other findings files. A site can be
> technically clean and still score badly here.

---

## Headline finding

**The single biggest problem is not a page-type mismatch — it is page-type *absence*
combined with template-level intent starvation.**

Where Moon Beauty *has* the right page type (home for "tienda skincare coreano venezuela",
category for "protector solar coreano", product for branded product queries), the template
omits nearly every content element that the currently-ranking pages use to win the click.
Where the SERP rewards a page type Moon Beauty does not have at all (informational blog
content, a local/delivery page), there is zero eligible surface across all 127 indexable URLs.

Confirming symptom: a near-branded search (`"Moon Beauty" skincare coreano Valencia Venezuela
moonbeautyval`) returns **zero Moon Beauty properties** — not the site, not the Instagram
profile. Competitors' Instagram profiles (`@kbeautystorevzla`, `@deltacosmeticss`,
`@thekoreanfaceve`) rank for that query instead.

---

## 1. Backwards SERP analysis

### Q1 — "protector solar coreano venezuela comprar"
*Intent: commercial investigation → transactional. Mid-funnel.*

| # | Result | Page type |
|---|--------|-----------|
| 1 | listado.mercadolibre — `/protector-solar-coreano` | Category / marketplace listing |
| 2 | yesstyle.com/es/korean-sunscreen | Category / collection |
| 3 | notino.es/cosmetica-coreana/protector-solar-coreano/ | Category / collection |
| 4 | farmaciasenante.com — "10 MEJORES PROTECTORES SOLARES COREANOS" | Comparison / listicle |
| 5 | sansacosmetics.com (VE) | Store homepage (Hybrid) |
| 6 | uyubeauty.com/collections/protector-solar | Category / collection |
| 7 | holastylekorean.com/collections/mejores-protectores-solares | Category / collection |

**SERP consensus: Category/Collection page — 71% (5/7).** Secondary type: Comparison listicle.
**Format signals:** superlative collection naming ("mejores protectores solares"), editorial
copy above or below the grid, SPF/PA and skin-type faceting, price visible in snippet.

**Moon Beauty's matching page:** `/products?categoria=Protector solar`
**Verdict: ALIGNED page type, CRITICAL content mismatch.**
- 258 words total, of which the visible on-page copy is a heading and a grid — the
  category description exists only in the meta tag, never rendered on the page.
- Zero H1. The visible heading is the generic string **"Productos"** with
  "Categoría: Protector solar" demoted to a subline — identical across all 12 categories.
  The commercial keyword has no heading prominence anywhere in the DOM.
- Title `Protector solar | Moon Beauty` contains neither **"coreano"** nor **"Venezuela"**,
  the two modifiers that define the query.
- Query-parameter URL (`?categoria=Protector%20solar`) versus competitors' clean
  `/collections/protector-solar` paths.
- **2 of the 8 sunscreens are "AGOTADO" and both are sorted first in the grid** — the
  first impression of the highest-commercial-intent category is "sold out."

### Q2 — "donde comprar skincare coreano en Valencia Venezuela"
*Intent: local transactional. Bottom-funnel.*

| # | Result | Page type |
|---|--------|-----------|
| 1 | tiktok.com/discover/tienda-coreana-valencia | Social / discovery |
| 2 | listado.mercadolibre.com.ve — productos coreanos para la piel | Category |
| 3 | instagram.com/kbeautystorevzla | Social profile |
| 4 | instagram.com/deltacosmeticss | Social profile |
| 5 | miin-cosmetics.com/blog/miin-valencia-... | Blog post (Valencia, **Spain**) |
| 6 | galeriaavanti.com/blogs/news/... | Blog post |
| 7 | wetbeauty.myshopify.com | Store homepage — "Delivery disponible en todo Carabobo" |
| 8 | sansacosmetics.com | Store homepage |
| 9 | shopbloomia.com (physical store, Valencia VE) | Local page / store homepage |

**SERP consensus: Local page / store homepage + social profile — 44% social, 33% store
homepage.** No single classic "Local Page" dominates because **no Venezuelan K-beauty store
has built one**. This is the clearest open opportunity in the whole audit.

**Moon Beauty's matching page:** `/` (home)
**Verdict: HIGH mismatch.**
- The rendered homepage body contains **"Valencia, Estado Carabobo" only in the footer**.
  **"Naguanagua" appears nowhere on the site.** Neither does "delivery", "MRW", "Zoom",
  "Tealca", "pago móvil", or any delivery-zone statement.
- The homepage meta description promises *"delivery y envíos a toda Venezuela"* — the page
  body cannot substantiate it. That is a snippet-to-content mismatch that produces pogo-sticking.
- **Geo-ambiguity risk is unmanaged:** "Valencia" ranks a Spanish boutique (MiiN Valencia)
  in this SERP. Nothing in Moon Beauty's title, H1 (absent), or schema disambiguates
  Valencia, Carabobo, VE from Valencia, Spain beyond a footer line and `addressRegion`.
- Schema is `OnlineStore` with a bare `PostalAddress` — **no `geo`, no
  `openingHoursSpecification`, no `areaServed`, no `hasMap`**, so the site is not a credible
  local-pack candidate even though a Google Business Profile exists.
- Competitor snippets that win this SERP state the thing Moon Beauty hides:
  *"Delivery disponible en todo Carabobo"*, *"flete ultra económico: entre 3€ a 4€"*,
  *"envíos por Zoom o MRW"*, *"tienda física en Chacao con pickup"*.

### Q3 — "Beauty of Joseon Relief Sun Venezuela precio comprar"
*Intent: branded product transactional. Bottom-funnel, highest conversion value.*

| # | Result | Page type |
|---|--------|-----------|
| 1 | mercadolibre.com.ve/cuidado-piel/beauty-of-joseon | Category (brand) |
| 2 | maquillalia.com — "Comprar Beauty of Joseon - Protector solar de arroz + probióticos Relief Sun SPF50+" | Product page |
| 3-4 | yesstyle.com — Relief Sun product pages | Product page |
| 5 | sweetcare.com — "Beauty of Joseon - SweetCare Venezuela" | Brand/category page |
| 6 | stylevana.com/brands/beauty-of-joseon | Brand page |
| 7 | international-cosmetic.com/collections/beauty-of-joseon — "Envío gratis 24h" | Collection |
| 8 | farmaciasenante.com — "BEAUTY OF JOSEON RELIEF SUN RICE PROBIOTICS SPF50+ PA++++ 50ML" | Product page |

**SERP consensus: Product page — 67% (6/9).**
**Title pattern that wins: `[BRAND] [Full product name] [SPF/PA] [size]`, frequently prefixed
with "Comprar" and suffixed with a shipping promise.** Every ranking result carries a price
and most carry availability in the snippet.

**Moon Beauty stocks this exact SKU** (Beauty of Joseon Relief Sun : Rice + Probiotics 50ml,
USD 25,00 / VES 20.812,21).
**Verdict: ALIGNED page type, CRITICAL execution mismatch.** See §2.

### Q4 — "tienda skincare coreano venezuela envios nacionales originales"
*Intent: transactional, trust-qualified. Mid/bottom-funnel.*

| # | Result | Page type |
|---|--------|-----------|
| 1-2 | TikTok discover pages | Social / discovery |
| 3 | mercadolibre.com.ve | Category |
| 4 | wetbeauty.myshopify.com | Store homepage |
| 5 | sansacosmetics.com | Store homepage |
| 6-7 | instagram.com/deltacosmeticss, /kbeautystorevzla | Social profile |
| 8 | holaluma.com — "Auténtico Skincare Coreano en Venezuela" | Store homepage |
| 9 | galeriaavanti.com/blogs/news/... | Blog post |

**SERP consensus: Store homepage (Hybrid) — 33%, with social at 44%.**
**Recurring snippet themes across every ranking store:** "100% original", "traídos
directamente de Corea", "asesoría personalizada según tu tipo de piel", "envíos a todo el
país", named couriers, named physical location.

**Moon Beauty's matching page:** `/` (home)
**Verdict: ALIGNED page type, HIGH content mismatch.** The homepage copy is brand-poetic
("Tu piel, en su mejor era", "Luminous Serenity", "La ciencia de la calma") and addresses
**none** of the four recurring trust themes. "Curaduría exclusiva" is the closest thing to an
authenticity claim and it never says *original* or *importado directo de Corea*.

### Q5 — "rutina de skincare coreano para piel grasa paso a paso productos"
*Intent: informational. Top-funnel, highest volume.*

All 8 results are blog posts, and **7 of 8 sit on e-commerce store blogs** — ipsy.mx,
coppel.com/blog, miin-cosmetics.com/blog, skinthinks.com/blog, koryobeauty.cl/blog (×2),
dermicare.com.co/blogs, pielcoreana.com/blogs.

**SERP consensus: Blog Post — 100%.** List-format featured snippets ("10 pasos",
"rutina de 3, 5 y 10 pasos").

**Moon Beauty's matching page: none exists.** Across all 127 indexable URLs there is
**zero editorial content** — 1 home, 1 catalog, 12 category, 108 product, 1 categorias,
4 legal. **Verdict: CRITICAL — total absence from the highest-volume funnel stage, in a
SERP where direct competitors are using exactly this tactic to acquire the same buyer.**

---

## 2. Page-type mismatch summary

| Query | SERP dominant type | Moon Beauty page | Type match | Severity |
|-------|-------------------|------------------|-----------|----------|
| protector solar coreano venezuela | Category/Collection (71%) | `/products?categoria=Protector solar` | ✅ | **Critical** (content) |
| donde comprar skincare coreano Valencia VE | Local page / store home (77%) | `/` | ⚠️ partial | **High** |
| Beauty of Joseon Relief Sun Venezuela | Product page (67%) | `/products/{id}` | ✅ | **Critical** (execution) |
| tienda skincare coreano VE envíos originales | Store homepage (Hybrid) | `/` | ✅ | **High** (content) |
| rutina skincare coreano piel grasa | Blog post (100%) | — none — | ❌ | **Critical** (absence) |

---

## 3. Findings by severity

### CRITICAL

**C1 — Zero `Product` schema on all 108 product pages.**
Every PDP emits only the sitewide `OnlineStore` block (581 bytes). There is no `Product`,
no `Offer`, no `price`, no `priceCurrency`, no `availability`, no `aggregateRating`.
Verified on `/products/1` and confirmed by `structured_data.block_count: 1`.
Consequence: ineligible for merchant rich results, price/availability annotations, and
Popular-Products treatment — the exact SERP features that 6 of 9 results in Q3 are winning
with. This is the highest-leverage single fix on the site.
→ Cross-ref: `/seo schema` for generation; see also `findings/schema.md`.

**C2 — Product titles and headings omit the brand name.**
Sampled PDP titles: `Powder Cream Lip Balm · Moon Beauty`, `Triple PDRN Gel Toner · Moon
Beauty`, `Hand Cream · Moon Beauty`, `Noni Mist 50ml · Moon Beauty`, `Cotton Soft Sun Stick
· Moon Beauty`. The brand (TOCOBO, AXIS-Y, Celimax, Beauty of Joseon…) is rendered on the
**category card** but not in the PDP title, not in the on-page product heading, and not in
the meta description. K-beauty demand is overwhelmingly brand-led — real queries are
"tocobo cotton soft sun stick", "anua heartleaf", "medicube pdrn". These pages cannot match
their own highest-intent queries.
**Fix:** `TOCOBO Cotton Soft Sun Stick SPF50+ PA++++ | Comprar en Venezuela · Moon Beauty`.

**C3 — No H1 on any page type, sitewide.**
Confirmed `H1 Tags: 0` on `/`, `/products`, `/categorias`, all 12 category URLs, and all 6
sampled PDPs. Headings are visually styled but semantically absent. On category pages the
only H2 is the generic "Productos"; on PDPs the only H2/H3 belong to the cart drawer
("Tu carrito", "Tu carrito está vacío"). The primary topic of every commercial page on the
site is unmarked.

**C4 — No informational content surface at all.**
No blog, no guides, no "cómo elegir", no skin-type routing, no ingredient explainers.
Q5's SERP is 100% blog posts on competitor store blogs. Moon Beauty cannot enter that funnel
stage, cannot build topical authority for "skincare coreano", and has no asset to earn the
links or internal-linking depth that would lift the commercial pages.

### HIGH

**H1 — Intrusive newsletter interstitial covers the only above-the-fold CTA on mobile.**
`home_mobile_atf.png` shows the "Un espacio creado para ti ✨ / Suscríbete aquí" modal
rendering over the hero and **fully obscuring the "Descubrir productos" button** — the
homepage's single primary conversion path. The WhatsApp floating action button additionally
overlaps the modal's own subscribe button. This is both a Google mobile-intrusive-interstitial
signal and a direct conversion loss on the arrival viewport for every organic mobile entry.

**H2 — Delivery, shipping and payment reality is invisible on every commercial page.**
The business's genuine differentiators — free/local delivery in Valencia and Naguanagua,
national courier shipping (MRW / Zoom / Tealca, cash-on-pickup), and WhatsApp-coordinated
payment via pago móvil, Zelle, Binance, Zinli, cash — appear **nowhere in the rendered body
of the home, category, or product templates**. Only the promo bar mentions payment rails, and
only in the context of the MOON20 discount. `/envios` is generic legalese: it names no zone,
no courier, no cost range, no delivery window, no free-shipping threshold. Every competitor
ranking in Q2 and Q4 states these explicitly in the indexed snippet.

**H3 — No local-business schema or local surface, despite an existing GBP.**
`OnlineStore` + `PostalAddress` only. Missing `geo`, `openingHoursSpecification`,
`areaServed` (Valencia / Naguanagua / Carabobo), `hasMap` pointing at the GBP, and
`paymentAccepted`. There is no `/delivery-valencia` or equivalent page, no map, no hours,
no GBP review surfacing. Q2's SERP shows no incumbent has built this — it is uncontested.
→ Cross-ref: `/seo local` for GBP alignment.

**H4 — Zero review or rating surface on 108 product pages.**
No reviews, no star ratings, no Q&A, no UGC on any PDP (`Rese…`, `opinion`, `review` all
return no match in the rendered DOM). The only social proof on the entire site is 3
hand-curated testimonials on the homepage. In a market where "100% original" is the
recurring competitor claim, the absence of buyer proof on the page where the purchase
decision happens is a direct trust failure.

**H5 — Out-of-stock products sort first in the highest-intent category.**
`/products?categoria=Protector solar` renders TOCOBO Cotton Soft Sun Stick (Agotado) and
TOCOBO Vita Tone Up Sun Cream (Agotado) as items 1 and 2 of 8, confirmed across two renders.
The sunscreen category — the single most commercially valuable K-beauty category and the
subject of Q1 — presents as sold out above the fold on mobile.

**H6 — Out-of-stock PDPs are conversion dead ends.**
`/products/1` renders a disabled "Sin stock" button and nothing else: no "Avísame cuando
llegue", no WhatsApp "consultar disponibilidad" deep link, no in-category alternatives above
the fold. The WhatsApp FAB is present but generic — it does not carry product context.

### MEDIUM

**M1 — No price, stock status or CTA above the fold on mobile PDPs.**
`product-detail_mobile_atf.png`: the product image consumes the entire first viewport below
the header. Price (USD + VES), availability, and the add-to-cart control are all below the
fold. The dual USD/VES display is a real competitive advantage in this market and it is
hidden on arrival.

**M2 — Category pages render no on-page descriptive copy.**
The per-category descriptions exist as meta tags only. Ranking collection pages in Q1
(Notino, YesStyle, uyubeauty) carry intro copy, SPF/skin-type guidance, and often an FAQ
block. Moon Beauty's category pages are grid-only, 258 words including chrome.

**M3 — Category titles omit the defining query modifiers.**
`Serums o Ampollas | Moon Beauty`, `Limpiadores Faciales | Moon Beauty`,
`Protector solar | Moon Beauty` — none contain "coreano" or "Venezuela", although the meta
descriptions correctly do. Titles carry far more ranking weight than descriptions.
**Fix:** `Protector Solar Coreano | Comprar en Venezuela · Moon Beauty`.

**M4 — Query-parameter category URLs.**
`/products?categoria=Protector%20solar` (URL-encoded spaces) versus competitors'
`/collections/protector-solar`. Weaker keyword signal, weaker shareability, and awkward in
WhatsApp shares — the site's primary distribution channel.

**M5 — `og:type` is `article` on product pages, and the OG image falls back to the sitewide default.**
`/products/1` emits `og:type="article"` (should be `product`) and
`og:image=".../og-imagen.jpg"` — the generic brand image, not the product. The site context
notes this is a deliberate WebP/WhatsApp workaround, but the consequence is that **every
product link shared in WhatsApp — the checkout channel for this business — previews as an
identical generic tile.** Worth solving properly by generating a JPG/PNG derivative per
product rather than falling back.

**M6 — No breadcrumbs, visually or as `BreadcrumbList` schema.**
Absent on category and product pages. Costs the breadcrumb SERP treatment and weakens the
category → product hierarchy signal.

**M7 — No comparison or "mejores" surface.**
Q1's SERP includes a "10 MEJORES PROTECTORES SOLARES COREANOS" listicle and a
`/collections/mejores-protectores-solares` collection. Moon Beauty has no curated,
superlative, or comparison framing anywhere — including no use of its own `Kits` category
as a "por dónde empezar" entry point.

### LOW

**L1 — Meta descriptions verified unique and well-formed** across home, `/products`,
`/categorias`, 4 sampled categories and 6 sampled PDPs. No duplication found. Category
descriptions correctly carry "Skincare coreano con envíos a toda Venezuela". PDP
descriptions are auto-truncated from the product copy with an ellipsis and carry no price,
no availability, and no geo modifier — a missed CTR opportunity rather than a defect.

**L2 — Homepage promo bar repeats 6× in the DOM.** The MOON20 marquee duplicates its text
node, inflating the extracted text and pushing the promo string into the first ~600
characters of every page's text content. Cosmetic, but it dilutes the text-content signal
on every URL.

**L3 — Instagram handle/domain mismatch.** `sameAs` points to `instagram.com/moonbeauty.val`
while the domain is `moonbeautyval.com`. Correctly declared, so entity resolution should
hold, but worth keeping consistent as the profile is a ranking asset in this SERP (see Q2/Q4,
where competitor IG profiles outrank their own sites).

**L4 — Freshness signals are thin.** `htmldate` returns 2026-09-11 for the homepage and
`/envios` was updated 2026-09-02, but no content carries a visible date, there is no
`dateModified` in schema, and "New arrivals" is unmarked. Low impact absent a blog; becomes
relevant once C4 is addressed.

---

## 4. SXO Gap Score breakdown

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Page Type | 8/15 | Correct type for 3 of 5 queries; no informational surface, no local page; param-based category URLs |
| Content Depth | 4/15 | Home 542w, category 258w, PDP ~200w; no editorial, no FAQ, no buying guidance; competitors run 1,500w+ guides |
| UX Signals | 6/15 | Interstitial over hero CTA; no price/CTA above fold on mobile PDP; out-of-stock sorted first; no breadcrumbs. Credits: fast SSR, clean design, dual USD/VES pricing, WhatsApp FAB present |
| Schema | 3/15 | `OnlineStore` + `WebSite` only. No Product/Offer/AggregateRating (108 pages), no ItemList/CollectionPage (13 pages), no BreadcrumbList, no LocalBusiness geo/hours/areaServed, no FAQPage |
| Media | 8/15 | Strong product photography, 50 images on home, IG feed embed. No video, no texture/swatch shots, no UGC; per-product OG previews fall back to a generic tile |
| Authority | 4/15 | Zero PDP reviews; 3 curated homepage testimonials; GBP exists but never surfaced on-site; no authenticity claim; no about/team page; invisible for near-branded search |
| Freshness | 5/10 | Policies dated 2026-09-02, htmldate 2026-09-11; no dated content, no `dateModified`, no editorial cadence |
| **Total** | **38/100** | |

---

## 5. User stories

**US-1 — Novata en K-Beauty (awareness)**
> As a **first-time K-beauty buyer with oily skin**, I want a step-by-step Korean routine that
> tells me what to buy and in what order, because I'm **confused and overwhelmed** by a
> 10-step ritual I've only seen on TikTok, but I'm blocked by an **information gap** — every
> store shows me a product grid before it shows me a routine.
> *Signals: Q5 SERP is 100% blog posts with list-format snippets ("rutina de 3, 5 y 10 pasos",
> "10 pasos rutina efectiva"); 7 of 8 sit on competitor e-commerce blogs; query itself carries
> "paso a paso".*

**US-2 — Compradora local de Valencia (decision)**
> As a **woman in Valencia/Naguanagua ready to order today**, I want to confirm that this
> store actually delivers to my zone and how I pay without a card, because I'm
> **skeptical of Instagram-only sellers** and I've been burned before, but I'm blocked by a
> **trust and information gap** — the site never states its delivery zones, couriers, costs,
> or payment rails.
> *Signals: Q2 returns TikTok "tienda coreana valencia", two Instagram profiles, and store
> homepages whose snippets lead with "Delivery disponible en todo Carabobo", "flete ultra
> económico: entre 3€ a 4€", "envíos por Zoom o MRW", "tienda física en Chacao con pickup".
> Q4's query literally contains "originales".*

**US-3 — Buscadora de un producto específico (decision)**
> As a **buyer who already knows she wants Beauty of Joseon Relief Sun**, I want to find a
> Venezuelan seller with the price and confirmation it's in stock and genuine, because I'm
> **ready to buy and price-comparing against MercadoLibre**, but I'm blocked by a
> **trust gap** — the page shows no reviews, no authenticity statement, no brand name in the
> title, and Google shows me no price for it.
> *Signals: Q3's SERP is 67% product pages; every ranking title leads with the brand and most
> carry price + availability in the snippet; "SweetCare Venezuela" and "Envío gratis 24h" win
> on shipping promises; MercadoLibre VE holds position 1 on trust + logistics.*

---

## 6. Persona scores

Personas derived from the SERP signal clusters above — no invented personas.

| Persona | Landing page | Relevance | Clarity | Trust | Action | Total | Rating |
|---------|-------------|-----------|---------|-------|--------|-------|--------|
| Novata en K-Beauty | `/categorias` (nearest) | 6/25 | 5/25 | 6/25 | 10/25 | **27/100** | Critical Mismatch |
| Buscadora de producto específico | `/products/{id}` | 14/25 | 10/25 | 5/25 | 8/25 | **37/100** | Critical Mismatch |
| Compradora local de Valencia | `/` | 12/25 | 6/25 | 9/25 | 12/25 | **39/100** | Critical Mismatch |
| Compradora nacional escéptica | `/` + `/envios` | 13/25 | 7/25 | 8/25 | 14/25 | **42/100** | Needs Work |
| Comparadora de precio | `/products?categoria=…` | 15/25 | 13/25 | 9/25 | 12/25 | **49/100** | Needs Work |

**Weakest persona: Novata en K-Beauty (27/100)** — and by search-volume weight this is also
the largest segment (Q5 is the highest-volume query of the five). Weakest persona × highest
volume = the biggest single opportunity on the site.
*Top issue:* no page on the domain addresses a buyer who doesn't yet know what to buy.
*Fix:* publish 4-6 guides that route to existing categories — "Rutina coreana paso a paso
para piel grasa", "Cómo elegir tu protector solar coreano", "Doble limpieza: qué es y con qué
empezar", "Kit de inicio K-Beauty: 4 productos" — each ending in a CTA into the relevant
`?categoria=` page and the `Kits` category.

**Systemic issues**
- **Trust is the lowest dimension for every persona (5-9 of 25).** No PDP reviews, no
  authenticity claim, no delivery/payment transparency, no local proof, no schema-backed
  price or availability. Fixing trust lifts all five personas simultaneously.
- **Clarity is second-lowest (5-13 of 25).** The answer each persona needs — routine, zone,
  price, availability, authenticity — is either absent or below the fold on mobile.

**Priority actions, weakest persona first**
1. **Novata (27):** ship an editorial section (C4). Highest-volume, zero current coverage.
2. **Trust, systemic:** add `Product` schema with `offers` + `availability` (C1), a
   "100% original — importado directamente de Corea" statement on home/category/PDP, and a
   review capture mechanism on PDPs (H4).
3. **Buscadora (37):** put the brand in PDP titles and headings (C2); surface price, stock
   and CTA above the fold on mobile (M1); give out-of-stock PDPs a WhatsApp "avísame" path (H6).
4. **Compradora local (39):** build `/delivery-valencia-naguanagua` with zones, couriers,
   costs, windows and payment rails; add `geo` + `areaServed` + `openingHoursSpecification`
   + `hasMap` to the schema (H3); state delivery in the homepage body, not just the footer (H2).
5. **Comparadora (49):** stop sorting out-of-stock first (H5); add on-page category copy
   and "mejores" curation (M2, M7); put "coreano"/"Venezuela" in category titles (M3).
6. **Site-wide:** add a real `<h1>` to every template (C3) and suppress the newsletter modal
   on first mobile view or delay it past the hero (H1).

---

## 7. Cross-skill referrals

- **Schema:** C1, H3, M6 are all schema generation work → `/seo schema`; see `findings/schema.md`.
- **Local:** H3 and the uncontested local opportunity in Q2 → `/seo local` for GBP-to-site alignment.
- **Content / E-E-A-T:** C4, H4 and the systemic Trust deficit → `/seo content`.
- **Page-level:** C3, M1, M2, M5 are template-level fixes → `/seo page`.

---

## 8. Limitations

- **WebSearch is US-geolocated.** These SERPs approximate but do not reproduce what a user
  in Valencia, Carabobo sees on google.co.ve. Local-pack composition, ad density, and the
  exact ordering of Venezuelan competitors will differ. Before acting on the local findings,
  re-run each query through a Venezuela-located rank tracker or `&gl=ve&hl=es` check.
- **SERP features not directly observable.** The search tool returns organic links only, so
  featured snippets, People Also Ask, AI Overviews, ads, Shopping carousels and the local
  pack were inferred from result titles, snippet phrasing and page types rather than observed.
  PAA-derived personas would sharpen US-1 considerably.
- **No search volume data.** Query selection is based on buyer-behaviour reasoning and the
  business's stated logistics, not on measured volume. Volume weighting in §6 is an estimate.
  Run Keyword Planner or GSC query data for Venezuela before allocating effort.
- **No GSC/GA4 access.** Actual impressions, CTR, entry pages and bounce behaviour were not
  available; the "invisible in search" conclusion rests on the near-branded query test, not
  on impression data.
- **Screenshots reused from the existing capture set** (2026-09-13 12:37-12:40) rather than
  re-captured; mobile viewport is 750px-wide renders.
- **108 product pages were sampled, not fully crawled** — 6 PDPs inspected in detail. The
  template-level findings (C1, C2, C3, H4, H6, M1, M5) held on every one sampled and are
  template-driven, so they should generalise, but per-product content quality was not assessed.
- **Competitor pages were not fetched directly** — competitor characterisations come from
  SERP snippets, so their on-page depth and schema were not verified.
