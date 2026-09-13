import type { PageServerLoad } from './$types';
import { descripcionCategoria, recortar } from '$lib/seo';

/**
 * Esta ruta sirve dos vistas distintas según ?categoria=: el catálogo
 * completo, o una categoría puntual. Cada una de esas variantes es una
 * URL propia en el sitemap (ver src/routes/sitemap.xml/+server.ts), así
 * que cada una necesita su propia descripción para que Google entienda
 * que no son la misma página.
 */
export const load: PageServerLoad = async ({ url }) => {
	const categoria = url.searchParams.get('categoria')?.trim();

	if (categoria) {
		return {
			seo: {
				titulo: `${categoria} | Moon Beauty`,
				// "coreano/a/os/as" no se pega directo al nombre de la
				// categoría a propósito: varias son plurales ("Limpiadores
				// Faciales") o de género distinto, y forzar la concordancia
				// ahí quedaría mal escrito. Así la frase concuerda siempre.
				descripcion: recortar(
					`${categoria} en Moon Beauty: ${descripcionCategoria(categoria)} Skincare coreano con envíos a toda Venezuela.`
				)
			}
		};
	}

	return {
		seo: {
			titulo: 'Productos | Moon Beauty',
			descripcion:
				'Todo el catálogo de skincare coreano de Moon Beauty: limpiadores, serums, cremas, protectores solares, mascarillas, cuidado capilar y más.'
		}
	};
};
