# Local SEO Audit — Moon Beauty (moonbeautyval.com)

**Business type:** Hybrid — nationwide e-commerce (K-Beauty skincare) + local delivery service, no walk-in storefront. Delivery is WhatsApp-coordinated: **Valencia** (paid, amount confirmed via WhatsApp) and **Naguanagua** (free) are the two service zones; all other Venezuelan addresses ship via national courier ("cobro a destino").
**Industry vertical:** Retail/e-commerce (cosmetics) with a local same-day-delivery layer bolted on — closest schema.org analogue is `Store`/`OnlineStore` with `areaServed`, not a pure SAB vertical (Plumber/HVAC-style) and not brick-and-mortar retail.
**GBP:** "Moon Beauty Val" — https://share.google/ZH6ApMIzQLYrrhGG1. **Could not be accessed directly** (no API/browser-authenticated access in this session); see Limitations.

---

## Local SEO Score (qualitative)

| Dimension | Weight | Assessment |
|---|---|---|
| GBP Signals | 25% | Weak-Moderate — review CTA present, no Maps embed, GBP itself unverifiable (see Limitations) |
| Reviews & Reputation | 20% | Weak — no live review count/rating on-site, no review schema, only 3 static curated testimonials |
| Local On-Page SEO | 20% | Weak — the two named delivery zones (the site's single strongest "near me" signal) exist only inside a robots-disallowed checkout flow, in no indexable page |
| NAP Consistency & Citations | 15% | Moderate — phone/address consistent between schema and footer, but brand **name** varies across GBP/schema/logo; Tier-1 US directories (Yelp/BBB) not applicable to this market |
| Local Schema Markup | 10% | Weak — `OnlineStore` present with locality-only address, but no `geo`, `openingHoursSpecification`, `areaServed`, or `sameAs` to GBP (see `schema.md` for full JSON-LD detail) |
| Local Link & Authority Signals | 10% | Unassessed — outside on-page scope; see Limitations |

This is directional, not a precise 0–100 composite — several inputs (GBP category, live rating/velocity, backlink/citation authority) could not be verified this session.

---

## Critical

### C1. The Valencia/Naguanagua delivery-zone distinction exists nowhere Google (or a citation source) can crawl it
Confirmed via `checkout/+page.svelte` and the live `checkout_desktop_atf.png` screenshot: the exact, high-value local copy —

> **Delivery — "En toda Valencia" — "El monto se coordina por WhatsApp"**
> **Entrega — "Sin costo adicional" — "Solo disponible en Naguanagua"**

— is rendered only inside the interactive checkout step. `/checkout` is disallowed in `robots.txt`, so this content is **structurally invisible to search engines** regardless of how the copy is worded. I confirmed "Naguanagua" does not appear anywhere in the indexable page set: not on the homepage, not in the JSON-LD, not in `/envios` (the shipping-policy page), not in the legal pages. `/envios` only says cost/timing "depends on your zone, confirmed via WhatsApp" — it never names either city.

This is the single biggest missed opportunity in this audit relative to the Whitespark 2026 factor that dedicated service-area content is the **#1 local organic ranking factor and #2 AI-visibility factor**. Right now there is no URL a user, Google, or an AI answer engine could point to for "envío gratis Naguanagua" / "delivery a domicilio Valencia" intent.

**Fix:** Add a short, indexable section (homepage block and/or a dedicated `/zonas-de-entrega` or expanded `/envios` page) stating plainly: "Delivery gratis en Naguanagua" and "Delivery en Valencia (monto coordinado por WhatsApp)," plus the national-courier option. This also directly feeds the `areaServed` schema property recommended in `schema.md`.

---

## High

### H1. Business name is inconsistent across the only sources that exist
| Source | Name shown |
|---|---|
| GBP (per task brief) | "Moon Beauty Val" |
| JSON-LD (`OnlineStore.name`) | "Moon Beauty" |
| `og:site_name` / `<title>` | "Moon Beauty" |
| Footer wordmark (visual) | "MoonBeauty" (one word) |
| Header logo (screenshot) | "MOON BEAUTY" (stacked, two lines) |

Three distinct string variants for what should be one entity name is exactly the kind of mismatch that weakens GBP↔website entity association (Google explicitly cross-checks NAP name between GBP and the linked website). Since the domain itself is `moonbeautyval.com`, "Moon Beauty Val" is plausibly the more defensible canonical form — but the fix is to **pick one string and use it identically** in the GBP name, JSON-LD `name`, page `<title>`/`og:site_name`, and ideally the visual wordmark.

### H2. No dedicated, crawlable page names either delivery zone or the delivery model
Follows directly from C1: even setting aside the checkout-only issue, there is no `/contacto`, `/zonas-de-entrega`, or "cobertura" page in the 127-URL sitemap at all. The only local-intent-adjacent page is `/envios`, and it's generic. For a hybrid business whose entire differentiator vs. a generic online store is "we deliver same-zone in Valencia/Naguanagua," this is a missing asset, not just missing copy.

### H3. JSON-LD has no `sameAs` link to the Google Business Profile
Cross-checking against `schema.md` (Finding 4, already flagged there): the `OnlineStore` block's `sameAs` array contains only the Instagram URL. `CONFIGURACION_CONTACTO_POR_DEFECTO.googlePerfilUrl` already holds the GBP link (`https://share.google/ZH6ApMIzQLYrrhGG1`) and is already used for the on-page "Ver todas en Google" button — it just isn't also pushed into the schema's `sameAs` array. I'm flagging this independently because it's a Local-SEO-specific entity-linking gap (not just a schema-completeness one): without it, Google has no machine-readable signal tying this website to that specific GBP listing.

### H4. No `geo`, `openingHoursSpecification`, or `areaServed` in the local schema, despite the underlying data already existing in plain text
The footer states hours as "Todos los días · Respondemos por WhatsApp" and the business info config (`configuracion.ts`) has a structured `horario` field — none of this is expressed as `openingHoursSpecification`. Similarly, no `geo` coordinates and no `areaServed` (Valencia, Naguanagua) are present. Per the schema reference, `geo` needs 5-decimal precision and `areaServed` should use named cities (ideally with `sameAs` to Wikidata/Wikipedia per the skill reference) — none of this is a heavy lift since the source data already exists elsewhere on the site. (Overlaps with `schema.md`'s Finding 2 recommendation to enrich the existing `OnlineStore` block rather than add a competing `LocalBusiness` type — agreed with that approach.)

---

## Medium

### M1. No visible review count/rating, and testimonials aren't schema-marked — but the review-generation mechanism is already live
The homepage testimonials section (3 curated quotes: Danniela Jimenez, Dernys Camacho, Genesis Jimenez) shows no star rating, review count, or date, and there is no `AggregateRating`/`Review` JSON-LD (confirmed: only `OnlineStore` + `WebSite` blocks exist site-wide). This is consistent with SITE-CONTEXT's note that testimonials are manually curated rather than pulled from live Google Reviews.

**Positive finding, worth noting explicitly:** the homepage *does* already have a working, correctly-wired review-generation CTA — a "Déjanos tu reseña" button linking to `https://g.page/r/CVXoPc_Sze_JEBM/review` (Google's direct write-a-review short link) sitting right next to "Ver todas en Google" (the GBP profile link). This is good practice and directly supports the review-velocity factor (Sterling Sky's "18-day rule": rankings can fall off a cliff after ~3 weeks without a new review). What's missing is any on-site indicator that this is working — no rating/count is surfaced, so there's no way to verify from the site alone whether reviews are actually accruing at a healthy cadence. Recommend periodically checking GBP review velocity directly and, once volume supports it, adding `aggregateRating` schema and a visible star-rating snippet.

### M2. Phone number formatting is inconsistent between schema and visible footer
JSON-LD: `"telephone":"+584125050043"` (no separators). Footer: `+58 412-505 0043` (spaced/dashed). Same number, so this isn't a true NAP conflict, but citation directories often do strict or semi-strict string matching — standardize to one format (E.164 in schema is fine; the visible footer can stay human-readable, but consistency of the *digits and country code* across every future citation submission matters more than which format is used).

### M3. Schema address has no `postalCode`
`address` in the `OnlineStore` block includes only `addressLocality`, `addressRegion`, `addressCountry` — no `postalCode` (Valencia/Carabobo has assigned postal codes). Low-impact but easy completeness fix, and worth doing at the same time as the `geo`/`areaServed` additions in H4.

---

## Low

### L1. Tier-1 US citation directories (Yelp, BBB) have low applicability to this market
I did not find (and would not expect to find) Moon Beauty listed on Yelp or BBB — both have negligible penetration in Venezuela. This dimension of the standard local-SEO checklist should be weighted down for this specific business; the operative citation sources here are the GBP listing itself and Instagram (both confirmed present via the `sameAs`/footer link to `instagram.com/moonbeauty.val`). I did not have live web-search/API access this session to check Venezuela-relevant directories (e.g., local business directories, WhatsApp Business catalog) — see Limitations.

### L2. No Google Maps embed on any indexable page
Google Maps JS is loaded only inside `/checkout` (for pin-dropping a delivery location) — never rendered as a public embed on the homepage or a contact page. Given there's no storefront, an address-pinned embed would be inappropriate, but a lightweight "service area" map or simple text callout of the two zones (see C1) would substitute reasonably well.

---

## NAP Consistency Audit (source comparison)

| Field | JSON-LD (`OnlineStore`) | Footer (visible HTML) | Legal pages (`/terminos-y-condiciones`) | GBP (per task brief, unverified) |
|---|---|---|---|---|
| Name | Moon Beauty | "MoonBeauty" (wordmark) / "Moon Beauty" (og:site_name) | "Moon Beauty" | **Moon Beauty Val** ← mismatch |
| Address | Valencia, Carabobo, VE (locality only, no street — correct for no-storefront model) | "Valencia, Estado Carabobo, Venezuela" | "operando principalmente desde Valencia, Estado Carabobo" | Not verifiable this session |
| Phone | `+584125050043` | `+58 412-505 0043` (linked to `wa.me/584125050043`) | Not restated | Not verifiable this session |
| Hours | Not present in schema | "Todos los días · Respondemos por WhatsApp" | Not restated | Not verifiable this session |

Phone and address are functionally consistent (same number/city across all on-site sources); the only real discrepancy found is the **business name**, and the **absence of hours/geo in structured data** despite existing in plain text.

---

## GBP Optimization Checklist (detected vs. missing, on-site only)

| Signal | Status |
|---|---|
| Link to GBP profile on-site | Present ("Ver todas en Google" button, homepage) |
| Direct "write a review" link | Present (`g.page/r/.../review` short link, homepage) |
| `sameAs` to GBP in JSON-LD | **Missing** (H3) |
| Maps embed | Missing (acceptable given no storefront; see L2) |
| Visible rating/review count | **Missing** (M1) |
| Photo evidence / posts indicators | Not assessable from static HTML |
| Primary GBP category, verified NAP on the listing itself | **Unverifiable this session** — no API/browser access to the GBP listing |

---

## Location Page Quality

Not applicable — single-location/service-area business, no multi-location page set to evaluate for doorway-page risk or duplicate-content patterns.

---

## Top 10 Prioritized Actions

1. **(Critical)** Surface the Valencia (paid, WhatsApp-coordinated) / Naguanagua (free) delivery-zone distinction on an indexable, crawlable page — expand `/envios` or add a dedicated `/zonas-de-entrega` section — using the exact zone names, not just "depends on your location."
2. **(High)** Standardize the business name to one canonical string and apply it identically to the GBP listing, JSON-LD `name`, `<title>`/`og:site_name`, and the visual wordmark.
3. **(High)** Add the missing local-intent page (contact/coverage) so there's a citable URL for "delivery near me" style queries in Valencia/Naguanagua.
4. **(High)** Add the existing `googlePerfilUrl` to the JSON-LD `sameAs` array (zero new data needed — value already exists in `configuracion.ts` and is already used on-page).
5. **(High)** Add `openingHoursSpecification`, `geo` (5-decimal precision), and `areaServed` (Valencia, Naguanagua) to the existing `OnlineStore` schema block, per `schema.md`'s enrichment recommendation.
6. **(Medium)** Once review volume supports it, add `aggregateRating` schema and a visible rating/count snippet near the testimonials section; in the meantime, monitor GBP review velocity manually against the 18-day-rule risk.
7. **(Medium)** Standardize phone number formatting (schema vs. footer) before it's used in any future citation submissions.
8. **(Medium)** Add `postalCode` to the schema `address` object.
9. **(Low)** Treat Yelp/BBB as low-priority for this market; if pursuing citations, prioritize Venezuela-relevant directories and a proper WhatsApp Business catalog instead.
10. **(Low)** Consider a lightweight service-area visual/callout in place of a Maps embed, since a storefront-style embed isn't appropriate for a no-walk-in business.

---

## Limitations

- **GBP listing itself could not be accessed.** `https://share.google/ZH6ApMIzQLYrrhGG1` redirects to a Google Maps interstitial that requires JS/account-authenticated rendering not available in this session (confirmed via one fetch attempt — redirected to `google.com/share.google?q=...` with no usable content). Primary GBP category (the **#1 ranking factor** per Whitespark 2026), live rating/review count, review velocity, photos, and Google Posts activity could **not** be independently verified — all GBP-side assessments above are inferred only from on-site links/CTAs referencing it.
- **No live citation search performed** against Venezuela-relevant directories or WhatsApp Business catalog status — assessed only via absence/presence of expected patterns on-site, not via direct queries to those services.
- **Proximity** (55.2% of local ranking variance per the Search Atlas ML study) and other off-page/link authority signals are outside on-page control and were not assessed.
- Findings on JSON-LD structure and validity overlap intentionally with `moonbeautyval.com-audit/findings/schema.md` (produced by a separate schema-focused pass) — cross-referenced above where relevant rather than re-deriving from scratch.
