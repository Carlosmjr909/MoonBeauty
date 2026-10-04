import type { PageServerLoad } from './$types';
import { obtenerMarcasConCache } from '$lib/server/cachePublico';
import { agruparPorMarca } from '$lib/marcas';
import { SITIO_URL } from '$lib/seo';

/**
 * Todas las marcas del catálogo, armadas con los productos que ya trae el
 * layout. Los logos salen de la sección de marcas de la portada (panel de
 * contenido); las marcas sin logo se muestran con su nombre.
 */
export const load: PageServerLoad = async ({ parent }) => {
	const [{ productos }, logos] = await Promise.all([
		parent(),
		obtenerMarcasConCache().catch((error) => {
			console.error('Error obteniendo los logos de marcas:', error);
			return [];
		})
	]);

	const marcas = agruparPorMarca(productos, logos).map((marca) => ({
		slug: marca.slug,
		nombre: marca.nombre,
		logo: marca.logo,
		cantidad: marca.productos.length,
		// Tres fotos de muestra para las marcas que no tienen logo.
		muestras: marca.productos
			.map((producto) => producto.imagen)
			.filter(Boolean)
			.slice(0, 3)
	}));

	return {
		marcas,
		seo: {
			titulo: 'Marcas | Moon Beauty',
			descripcion: `Las ${marcas.length} marcas de skincare coreano de Moon Beauty: Medicube, Mixsoon, Dr. Althea, Purito Seoul y más, con envíos a toda Venezuela.`
		},
		breadcrumbSchema: {
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO_URL },
				{ '@type': 'ListItem', position: 2, name: 'Marcas' }
			]
		}
	};
};
