# Schema.org / Structured Data Audit — moonbeautyval.com

**Scope:** Home, `/products`, `/products?categoria=X` (×12), `/products/{id}` (×108, sample-verified), `/categorias`, 4 legal pages.
**Method:** Read source (`src/routes/+layout.svelte`, `src/routes/products/[id]/+page.svelte`, `src/routes/products/[id]/+page.server.ts`, `src/lib/seo.ts`, `src/lib/configuracion.ts`, `src/lib/inventario.ts`) in `C:\Users\HP\Desktop\MoonBeauty`, then verified the **live rendered output** with direct HTTP fetches (not just source reading) against home, `/products`, `/categorias`, and a sample product page (`/products/0GJ7WCWLCHvisN1gqEuo`).

## Summary

| # | Finding | Severity |
|---|---|---|
| 1 | `Product` schema (price/availability/currency) missing on all 108 product pages | **High** |
| 2 | No `LocalBusiness`-style signals (service area, payment/currency, Google Business Profile link) on the existing store entity | **Medium** |
| 3 | `sameAs` omits the Google Business Profile URL that's already stored in `configuracionContacto` | **Medium** |
| 4 | No `BreadcrumbList` anywhere on the site | **Medium** |
| 5 | No `@id` linking the `OnlineStore` and `WebSite` nodes into one entity graph | **Low** |
| 6 | `sameAs` Google Business Profile field points at a `share.google` redirect link, not a canonical URL (once added, see #3) | **Low** |
| 7 | `WebSite` has no `SearchAction` (sitelinks search box) — informational, not currently actionable | **Low** |

Everything that currently exists (`OnlineStore`, `WebSite`) is **valid, well-formed JSON-LD** and the live output matches source exactly — no rendering discrepancies found.

---

## 1. Detection results — what exists today

### `OnlineStore` (site-wide, every page — including product pages)
Source: `src/routes/+layout.svelte` lines 86–109, emitted in `<svelte:head>` on every route.

Live-fetched from production (home, `/products`, `/categorias`, and a product page all match this exactly):

```json
{
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "name": "Moon Beauty",
  "url": "https://www.moonbeautyval.com",
  "logo": "https://www.moonbeautyval.com/favicon-512.png",
  "image": "https://www.moonbeautyval.com/og-imagen.jpg",
  "description": "Skincare coreano seleccionado para elevar tu rutina diaria. Envíos a toda Venezuela desde Valencia, Carabobo.",
  "email": "moonbeautyval@gmail.com",
  "telephone": "+584125050043",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Valencia",
    "addressRegion": "Carabobo",
    "addressCountry": "VE"
  },
  "sameAs": ["https://www.instagram.com/moonbeauty.val/"]
}
```

Note: an earlier fetch through the render-tool's JSON output showed the description as `EnvÃ­os` (mojibake). I verified this against the **raw production HTTP response** directly via `urllib`/`curl` and confirmed the live site serves correct UTF‑8 (`Envíos`) — the mojibake was an artifact of the rendering tool's own JSON re-encoding, not a real site bug. No action needed.

### `WebSite` (home page only)
Source: `+layout.svelte` lines 116–124, gated by `{#if esPortada}`.

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Moon Beauty",
  "alternateName": "MoonBeauty",
  "url": "https://www.moonbeautyval.com"
}
```

Confirmed present only on `/` and absent on `/products`, `/categorias`, and the sample product page — matches the intended design (sitename in SERPs comes only from the home page, per Google's guidance).

### Product pages (`/products/{id}`)
Checked source (`+page.svelte`, `+page.server.ts`) and live HTML for `/products/0GJ7WCWLCHvisN1gqEuo`: **only the site-wide `OnlineStore` block is present.** No `Product`, `Offer`, `AggregateOffer`, or `Brand` markup exists anywhere in the product template or its server load function.

### Not found anywhere: `LocalBusiness`, `BreadcrumbList`, `FAQPage`, `AggregateRating`, `Review`, `ItemList`.
(No `FAQPage` exists, so the May 2026 Google FAQ rich-result retirement doesn't require any cleanup here — nothing to flag.)

---

## 2. Validation results

| Block | @context | @type | Required props | Syntax | Result |
|---|---|---|---|---|---|
| `OnlineStore` | ✅ `https://schema.org` | ✅ valid, not deprecated (subtype of `Store` → `LocalBusiness` → `Organization`) | ✅ name, url, logo present (Google Logo rich result requirements met) | ✅ valid JSON, `<` escaped correctly to prevent script injection | **Pass** |
| `WebSite` | ✅ | ✅ valid | ✅ name, url present | ✅ valid JSON | **Pass** |
| Product pages | — | — | — | — | **N/A — no schema present (gap, see Finding 1)** |

No broken/invalid JSON-LD found on the site. The two existing blocks are correctly implemented.

---

## Finding 1 (High): `Product` schema missing on all 108 product pages

This is an e‑commerce site with 108 individually indexable product URLs, none of which carry `Product`/`Offer` markup. Without it, Google cannot show price, availability, or currency in search results/snippets for any product, and the site is not eligible for product rich results or Merchant listing experiences on Search — a meaningful visibility/CTR gap given the site type.

**Where to add it:** `src/routes/products/[id]/+page.server.ts` already loads the matched `producto` server-side for the `seo` object — extend it to also return a `productoSchema` object, then render it in `src/routes/products/[id]/+page.svelte`'s `<svelte:head>` using the same inline-script escaping pattern already used in `+layout.svelte` (`replaceAll('<', '\\u003c')`).

`src/routes/products/[id]/+page.server.ts`:

```ts
import type { PageServerLoad } from './$types';
import { imagenParaCompartir, recortar, SEO_POR_DEFECTO, SITIO_URL } from '$lib/seo';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { productos } = await parent();
	const producto = productos.find((item) => item.id === params.id);

	if (!producto) {
		return { seo: SEO_POR_DEFECTO, productoSchema: null };
	}

	const precio = Number.isFinite(producto.precio) ? `$${producto.precio.toFixed(2)}` : '';
	const descripcion = producto.descripcion?.trim()
		? recortar(producto.descripcion)
		: recortar([producto.marca, producto.Tipo, precio].filter(Boolean).join(' · '));

	const aUrlAbsoluta = (url: string) => (url.startsWith('http') ? url : `${SITIO_URL}${url}`);
	const imagenes = [producto.imagen, ...(producto.imagenes ?? [])]
		.filter(Boolean)
		.map(aUrlAbsoluta);

	const productoSchema = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: producto.Nombre,
		description: producto.descripcion?.trim() || descripcion,
		image: imagenes,
		sku: producto.id,
		...(producto.marca ? { brand: { '@type': 'Brand', name: producto.marca } } : {}),
		offers: {
			'@type': 'Offer',
			url: `${SITIO_URL}/products/${producto.id}`,
			priceCurrency: 'USD',
			price: producto.precio.toFixed(2),
			availability:
				producto.stock > 0
					? 'https://schema.org/InStock'
					: 'https://schema.org/OutOfStock',
			itemCondition: 'https://schema.org/NewCondition'
		}
	};

	return {
		seo: {
			titulo: `${producto.Nombre} · Moon Beauty`,
			descripcion,
			imagen: imagenParaCompartir(producto.imagen),
			tipo: 'article' as const
		},
		productoSchema
	};
};
```

`src/routes/products/[id]/+page.svelte` (add near the top of `<script>` and inside `<svelte:head>`):

```svelte
<script lang="ts">
	// ...existing code...
	let { data } = $props();

	const productoSchemaJson = $derived(
		data.productoSchema
			? JSON.stringify(data.productoSchema).replaceAll('<', '\\u003c')
			: null
	);
</script>

<svelte:head>
	<title>{product ? `${product.Nombre} · Moon Beauty` : "Producto | Moon Beauty"}</title>

	{#if productoSchemaJson}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `<script type="application/ld+json">${productoSchemaJson}</scr` + `ipt>`}
	{/if}
</svelte:head>
```

**Important — do not add `aggregateRating`/`review` to this block.** The homepage testimonials are manually curated, not real per-product reviews (per `SITE-CONTEXT.md`), and Google's structured-data policies require reviews to be genuine and product-specific. Adding fabricated or unrelated ratings here would violate policy and risk a manual action.

**Optional future enhancement (not required for basic eligibility):** Google's product-snippet guidelines also recognize `shippingDetails` and `hasMerchantReturnPolicy` on the `Offer`, which could reference the site's existing `/envios` and `/cambios-y-devoluciones` policy pages. Worth doing once the base `Product`/`Offer` block above is shipped and validated — not urgent.

---

## Finding 2 (Medium): No service-area / payment signals on the store entity

The business is hybrid — e‑commerce plus WhatsApp-coordinated local delivery in Valencia and Naguanagua, Carabobo — but the existing `OnlineStore` entity (which is already a `LocalBusiness` subtype, so a second competing `LocalBusiness` block is not needed and would just create duplicate/conflicting entities) doesn't carry any of the local-delivery signals it could. Recommend enriching the existing block rather than adding a new type:

```json
{
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": "https://www.moonbeautyval.com/#organizacion",
  "name": "Moon Beauty",
  "url": "https://www.moonbeautyval.com",
  "logo": "https://www.moonbeautyval.com/favicon-512.png",
  "image": "https://www.moonbeautyval.com/og-imagen.jpg",
  "description": "Skincare coreano seleccionado para elevar tu rutina diaria. Envíos a toda Venezuela desde Valencia, Carabobo.",
  "email": "moonbeautyval@gmail.com",
  "telephone": "+584125050043",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Valencia",
    "addressRegion": "Carabobo",
    "addressCountry": "VE"
  },
  "areaServed": [
    { "@type": "City", "name": "Valencia" },
    { "@type": "City", "name": "Naguanagua" }
  ],
  "priceRange": "$",
  "currenciesAccepted": "USD, VES",
  "paymentAccepted": "Cash, Zelle, Binance Pay, Zinli, Venezuelan bank transfer (Pago Móvil)",
  "sameAs": [
    "https://www.instagram.com/moonbeauty.val/",
    "https://share.google/ZH6ApMIzQLYrrhGG1"
  ]
}
```

Note: no `streetAddress` is included — that's intentional and correct, since there's no walk-in storefront to disclose; keep `addressLocality`/`addressRegion`/`addressCountry` only, as today.

Implementation note: `paymentAccepted`/`currenciesAccepted` values above are static text derived from `CONFIGURACION_PAGOS_POR_DEFECTO` in `src/lib/configuracion.ts` (pago móvil, Binance, Zelle, Zinli) — if the admin panel's live `configuracionPagos` data should drive this instead of a hardcoded string, wire it from `layoutData.configuracionPagos` the same way `bannerTexto` already is.

---

## Finding 3 (Medium): `sameAs` omits the Google Business Profile link that already exists in code

`CONFIGURACION_CONTACTO_POR_DEFECTO` in `src/lib/configuracion.ts` already defines `googlePerfilUrl: 'https://share.google/ZH6ApMIzQLYrrhGG1'`, and `SITE-CONTEXT.md` confirms the Google Business Profile ("Moon Beauty Val") is live — but this URL is never referenced in the `OnlineStore` JSON-LD's `sameAs` array (only Instagram is). This is a zero-new-data fix: change

```js
sameAs: [contacto.instagramUrl].filter(Boolean)
```

to

```js
sameAs: [contacto.instagramUrl, contacto.googlePerfilUrl].filter(Boolean)
```

in `src/routes/+layout.svelte` (line 103). Linking the Google Business Profile strengthens entity association between the website and the GBP listing, which helps Google (and any GEO/AI surfaces) tie the two together as the same business.

---

## Finding 4 (Medium): No `BreadcrumbList` anywhere

The site has a clean, crawlable hierarchy (Home → Products → Category → Product) but no `BreadcrumbList` schema on any page. Adding it reinforces the site structure for Google and can produce breadcrumb trails in search results instead of the raw URL. Recommended for `/products/{id}` pages (highest value, pairs naturally with the `Product` schema in Finding 1):

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.moonbeautyval.com/" },
    { "@type": "ListItem", "position": 2, "name": "Productos", "item": "https://www.moonbeautyval.com/products" },
    { "@type": "ListItem", "position": 3, "name": "{Tipo/categoría del producto}", "item": "https://www.moonbeautyval.com/products?categoria={encodeURIComponent(Tipo)}" },
    { "@type": "ListItem", "position": 4, "name": "{Nombre del producto}" }
  ]
}
```

(Last `ListItem` in a trail conventionally omits `item` since it's the current page.) The same pattern applies to `/products?categoria=X` pages with a 2-level trail (Home → Products → Category). This can be added alongside the `Product` block in the same `<svelte:head>` change from Finding 1.

---

## Finding 5 (Low): No `@id` linking `OnlineStore` and `WebSite`

Minor entity-graph hygiene: giving `OnlineStore` an `@id` (e.g. `https://www.moonbeautyval.com/#organizacion`, as shown in Finding 2's snippet) and adding `"publisher": { "@id": "https://www.moonbeautyval.com/#organizacion" }` to the `WebSite` block on the home page lets Google merge them into one graph node instead of inferring the relationship. Cosmetic — not required for either block to validate or work independently.

---

## Finding 6 (Low): Google Business Profile `sameAs` link is a redirect, not canonical

Once Finding 3 is implemented, note `contacto.googlePerfilUrl` (`https://share.google/ZH6ApMIzQLYrrhGG1`) is a short redirect link rather than the resolved canonical Google Maps/Business Profile URL. It will still function in `sameAs`, but if/when the canonical `google.com/maps/place/...` URL is known, swapping it in is marginally more robust (redirect links can theoretically change destination or expire).

---

## Finding 7 (Low, informational): `WebSite` has no `SearchAction`

The sitelinks search box (`potentialAction: SearchAction`) is not present, and **cannot usefully be added yet**: the current on-site search (in `+layout.svelte`) is a client-side modal that filters an in-memory product list — there's no crawlable URL-based search-results route (e.g. `/products?buscar={term}`) for a `SearchAction` target to point at. This would require building that route first; not a schema fix by itself. No action needed unless that feature is planned.

---

## Files referenced
- `C:\Users\HP\Desktop\MoonBeauty\src\routes\+layout.svelte` — site-wide `OnlineStore` + home-only `WebSite`
- `C:\Users\HP\Desktop\MoonBeauty\src\routes\products\[id]\+page.svelte` — product page template (no schema)
- `C:\Users\HP\Desktop\MoonBeauty\src\routes\products\[id]\+page.server.ts` — product page load function (no schema)
- `C:\Users\HP\Desktop\MoonBeauty\src\lib\seo.ts` — `SITIO_URL`, `SEO_POR_DEFECTO`, image/description helpers
- `C:\Users\HP\Desktop\MoonBeauty\src\lib\configuracion.ts` — `CONFIGURACION_CONTACTO_POR_DEFECTO` (contains unused `googlePerfilUrl`), `CONFIGURACION_PAGOS_POR_DEFECTO`
- `C:\Users\HP\Desktop\MoonBeauty\src\lib\inventario.ts` — `Producto` type used to build the `Product` schema fields
- `c:\Users\HP\Desktop\MoonBeauty\moonbeautyval.com-audit\findings\schema.md` — this file
