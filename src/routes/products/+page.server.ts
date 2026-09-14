import type { PageServerLoad } from './$types';
import { descripcionCategoria, recortar, SITIO_URL } from '$lib/seo';

/**
 * Esta ruta sirve dos vistas distintas según ?categoria=: el catálogo
 * completo, o una categoría puntual. Cada una de esas variantes es una
 * URL propia en el sitemap (ver src/routes/sitemap.xml/+server.ts), así
 * que cada una necesita su propia descripción para que Google entienda
 * que no son la misma página.
 */
export const load: PageServerLoad = async ({ url, parent }) => {
	const categoria = url.searchParams.get('categoria')?.trim();

	if (categoria) {
		// La misma descripción que ya se ve en las tarjetas de /categorias
		// (la que carga el panel de administración) es la fuente de verdad;
		// descripcionCategoria() queda solo como respaldo para categorías
		// creadas sin descripción propia. Antes existían dos textos
		// distintos para la misma categoría y no coincidían entre sí.
		const { categorias } = await parent();
		const categoriaGuardada = categorias.find(
			(item) => item.nombre.trim().toLowerCase() === categoria.toLowerCase()
		);
		const descripcionBase =
			categoriaGuardada?.descripcion?.trim() || descripcionCategoria(categoria);

		return {
			seo: {
				titulo: `${categoria} | Moon Beauty`,
				// "coreano/a/os/as" no se pega directo al nombre de la
				// categoría a propósito: varias son plurales ("Limpiadores
				// Faciales") o de género distinto, y forzar la concordancia
				// ahí quedaría mal escrito. Así la frase concuerda siempre.
				descripcion: recortar(
					`${categoria} en Moon Beauty: ${descripcionBase} Skincare coreano con envíos a toda Venezuela.`
				)
			},
			categoriaDescripcion: descripcionBase,
			breadcrumbSchema: {
				'@context': 'https://schema.org',
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO_URL },
					{ '@type': 'ListItem', position: 2, name: 'Productos', item: `${SITIO_URL}/products` },
					{ '@type': 'ListItem', position: 3, name: categoria }
				]
			}
		};
	}

	return {
		seo: {
			titulo: 'Productos | Moon Beauty',
			descripcion:
				'Todo el catálogo de skincare coreano de Moon Beauty: limpiadores, serums, cremas, protectores solares, mascarillas, cuidado capilar y más.'
		},
		categoriaDescripcion: null,
		breadcrumbSchema: null
	};
};
