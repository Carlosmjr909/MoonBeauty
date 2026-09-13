# Visual & Mobile-Rendering Audit — moonbeautyval.com

**Date:** 2026-09-13
**Method:** Playwright (Chromium, headless), automated capture + DOM measurement (`document.documentElement.scrollWidth/clientWidth` for overflow, `getBoundingClientRect()` for tap-target sizing, computed body font-size), plus manual visual review of screenshots.
**Viewports tested:** Desktop 1920×1080, Mobile 375×812 (iPhone), and Mobile 390×844 specifically for `/checkout` (the width the recent overflow-fix targeted).
**Pages tested:** Home (`/`), `/products`, `/products?categoria=Protector%20solar`, a product detail page (`/products/0GJ7WCWLCHvisN1gqEuo` — "Hand Cream"), `/checkout`.
**Screenshots:** `moonbeautyval.com-audit/screenshots/` — files named `{page}_{viewport}_{atf|full|popup}.png` (`atf` = above-the-fold viewport-only shot at load; `popup` = same viewport ~6s later once the newsletter popup fires; `full` = full-page). Raw measurements: `moonbeautyval.com-audit/screenshots/results.json`.

---

## Critical

### 1. "Create account" / newsletter popup covers the primary CTA on mobile home, and covers the product title + description on mobile PDP
The popup ("Un espacio creado para ti ✨ … Suscríbete aquí") is positioned `fixed inset-x-4 bottom-4 z-50` — anchored to the *viewport* bottom, not to a fixed point in the page. Since it fires ~5-6s after load regardless of scroll position, whatever content is sitting in the bottom of the viewport at that moment gets covered:

- **Home, mobile (375px):** the popup lands directly on top of the hero's primary CTA button, "Descubrir productos" — it's fully obscured underneath the popup card. See `home_mobile_popup.png` (button ghosted/visible only through the popup's semi-transparent background).
- **Product detail page, mobile:** the popup lands on top of the product title ("Hand Cream") and the first two lines of the product description, directly above the price/quantity/Add-to-Cart block. See `product-detail_mobile_full.png`.
- On **desktop**, the popup doesn't overlap the hero CTA (wider layout puts it in open space bottom-right), so this is a mobile-specific severity escalation.

Impact: on the two page types most responsible for driving action (home CTA, PDP purchase block), the site auto-covers its own primary conversion element within 6 seconds, on mobile. It is dismissible (see Critical/High #2 for how well), but the default behavior actively blocks the CTA rather than sitting beside it.

**Recommendation:** anchor the popup so it never overlaps a primary CTA/heading (e.g., dock it as a slide-up sheet only after user has scrolled past the hero, or reduce it to a bottom bar that reserves space rather than floats over content, or simply delay/skip it on `/` hero and PDP above-the-fold zones).

---

## High

### 2. Popup close ("X") button is a 20×20px tap target
Measured via `getBoundingClientRect()`: the close button inside the popup is `20×20px` (`button.absolute.right-3.top-3`, wrapping a 20×20 svg). This is well under the 44×44px (Apple HIG) / 48×48px (Google) minimum recommended touch target. Combined with Critical #1 (popup blocks a CTA the user wants), the one obvious way to reclaim the CTA is itself hard to tap precisely on a touchscreen.

**Recommendation:** increase the close button's hit area to at least 44×44px (padding is fine even if the icon stays visually small).

### 3. Floating WhatsApp chat bubble has no reserved safe-area and overlaps content/controls on every page tested
The WhatsApp bubble is fixed at bottom-right (~56-64px circle) with no bottom padding/margin reserved on the page content behind it, so it sits on top of whatever scrolls underneath:

- **Product detail (mobile):** covers two lines of the product description body copy ("...previniendo padrastos..." / "...grietas gracias al hialuronato de sodio...") — text is unreadable behind the bubble. See `product-detail_mobile_atf.png`.
- **Checkout (mobile, both 375px and 390px):** overlaps the top-right corner of the first delivery-method card ("Delivery" / "En toda Valencia"), sitting on top of part of the tappable card. See `checkout_mobile_atf.png`, `checkout_mobile390_atf.png`.
- **On the popup itself (both mobile and desktop):** overlaps the right edge of the popup's own "Suscríbete aquí" CTA button — two floating UI layers stacking on each other. See `home_mobile_popup.png`, `home_desktop_popup.png`.

**Recommendation:** add bottom padding/safe-area to scrollable content equal to the chat bubble's height + margin (a common pattern: `padding-bottom: 80px` on the last content block, or constrain the bubble's stacking to not sit over interactive cards/buttons).

### 4. Header icon tap targets are undersized on mobile
On every page tested (mobile 375/390px), the account icon (`<a>`, 25×25px) and the icon next to it (`<button>`, 25×25px) in the header are below the 44px minimum touch target guideline; only the hamburger menu button (40×40) comes close. These sit close together at the top-right, increasing mis-tap risk.

**Recommendation:** pad the tappable area of header icons to ≥44×44px even if the icon glyph itself stays visually small (~24px).

---

## Medium

### 5. Product-detail quantity stepper buttons are short (32px height)
The `−` / `+` quantity buttons on the PDP measure ~53-54px wide but only **32px tall** — under the 44px height guideline. Width is generous but vertical tap precision is reduced on a touchscreen.

### 6. Category page "Protector solar" — both listed products are sold out, no visual affordance differentiates the dead-end
Not a rendering bug, but worth flagging from a visual/UX-content standpoint: both products under `/products?categoria=Protector%20solar` show an "AGOTADO" (sold out) badge with no in-stock alternative or "notify me" surfaced above the fold — a user following a link to this category currently lands on an effectively empty category visually. Low-cost fix (surface related in-stock items) would materially help this specific category page.

### 7. Small pagination/carousel controls (homepage, mobile)
Homepage mobile has recurring carousel elements at ~42×42px (just under the 44px guideline) and small pagination dots at ~7×7px. The dots are decorative-adjacent (they double as buttons per DOM) — low risk individually, but part of a broader pattern of controls sized a few px under the recommended minimum across the site (see Findings 4-5 also).

---

## Low

### 8. Secondary buttons at 38px height
`Filtros` button (100×38) and `← Ver todos los productos` link (208×38) on `/products` and category pages are 38px tall — slightly under 44px, but they have generous width and enough surrounding whitespace that mis-taps are unlikely. Cosmetic/consistency note only.

### 9. Announcement marquee text truncates mid-word at any single instant
The scrolling top banner ("...% de descuento para pagos en $ con el código MOON20...") is mid-animation in any static screenshot/viewport capture, so text is legitimately cut off at page edges at any instant — this is expected marquee behavior, not a bug, but confirm the marquee doesn't visually stall/jank on low-powered mobile devices (not verifiable via static screenshot; worth a manual spot-check on an actual device).

---

## Verified Fixed / Working Correctly

- **Checkout horizontal-overflow bug: CONFIRMED FIXED.** Measured `document.documentElement.scrollWidth` vs `clientWidth` on `/checkout` at both 375px and 390px viewports — equal in both cases (no horizontal scroll). Same check passed with no overflow on home, `/products`, the category page, and the PDP at 375px. Raw values in `results.json`.
- **The 3 delivery-method cards** (Delivery / Entrega Naguanagua / Envío a nivel nacional) render cleanly on mobile: full-width, stacked, readable icons and copy, consistent spacing, correct radio-selection highlight state (blue ring on selected "Delivery" card) — no clipping, no overlap with each other. (Only issue is the WhatsApp bubble overlapping the first card, see High #3.)
- **Payment method cards** (Efectivo / Pago móvil / Binance / Zelle / Zinli) render in a clean 2-column grid on mobile with no overflow.
- **Popup correctly does not appear on `/checkout`** — verified programmatically (0 modal-like elements detected 7s after load), matching the intended "no popup on checkout" behavior for logged-out users.
- **Base font size is 16px** on `<body>` across all mobile pages tested — meets legibility guidance, no forced pinch-zoom to read body text.
- **Above-the-fold mobile home:** logo, header icons, and hero H1 ("Tu piel, en su mejor era.") are visible without scrolling on first load; the CTA button is present and unobstructed in the *initial* 0-5s render — it only becomes obstructed once the popup fires (Critical #1).
- No overlapping/broken layout, no text cut-off/overflow, and images scale correctly across all 5 pages at both desktop and mobile widths, aside from the specific overlays noted above.

---

## Files
- Screenshots: `c:\Users\HP\Desktop\MoonBeauty\moonbeautyval.com-audit\screenshots\` (30 PNGs + `results.json` with raw overflow/tap-target/font measurements)
- This file: `c:\Users\HP\Desktop\MoonBeauty\moonbeautyval.com-audit\findings\visual.md`
