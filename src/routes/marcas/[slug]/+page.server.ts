import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { obtenerMarcasConCache } from '$lib/server/cachePublico';
import { agruparPorMarca, buscarMarcaPorSlug } from '$lib/marcas';
import { recortar, SITIO_URL } from '$lib/seo';

export const load: PageServerLoad = async ({ params, parent }) => {
	const [{ productos }, logos] = await Promise.all([
		parent(),
		obtenerMarcasConCache().catch((error) => {
			console.error('Error obteniendo los logos de marcas:', error);
			return [];
		})
	]);

	const marca = buscarMarcaPorSlug(agruparPorMarca(productos, logos), params.slug);

	if (!marca) {
		error(404, 'No encontramos esa marca.');
	}

	// Una sola URL por marca (p. ej. /marcas/Dr-Althea → /marcas/dr-althea),
	// para que Google no la vea como páginas duplicadas.
	if (params.slug !== marca.slug) {
		redirect(301, `/marcas/${marca.slug}`);
	}

	return {
		marca: { slug: marca.slug, nombre: marca.nombre, logo: marca.logo },
		productosMarca: marca.productos,
		seo: {
			titulo: `${marca.nombre} | Moon Beauty`,
			descripcion: recortar(
				`Productos de ${marca.nombre} en Moon Beauty: ${marca.productos.length} ${
					marca.productos.length === 1 ? 'producto' : 'productos'
				} de skincare coreano original con envíos a toda Venezuela.`
			)
		},
		breadcrumbSchema: {
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO_URL },
				{ '@type': 'ListItem', position: 2, name: 'Marcas', item: `${SITIO_URL}/marcas` },
				{ '@type': 'ListItem', position: 3, name: marca.nombre }
			]
		}
	};
};
