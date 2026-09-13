import type { PageServerLoad } from './$types';

/**
 * Descripción propia de esta vista, distinta de la de /products y de la
 * de cada producto: aquí lo que importa es que existe un listado de
 * categorías, no un catálogo plano ni un producto puntual.
 */
export const load: PageServerLoad = async () => {
	return {
		seo: {
			titulo: 'Categorías | Moon Beauty',
			descripcion:
				'Explora el catálogo de Moon Beauty por categoría: protectores solares, limpiadores, serums, mascarillas, cuidado capilar y más skincare coreano.'
		}
	};
};
