import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { imagenParaCompartir, recortar, SITIO_URL } from '$lib/seo';

/**
 * Datos de la vista previa al compartir un producto por WhatsApp: su
 * nombre, su descripción y su foto.
 *
 * Se resuelve en el servidor a propósito: los rastreadores de WhatsApp
 * y Facebook no ejecutan JavaScript, así que las etiquetas tienen que
 * venir ya escritas en el HTML.
 *
 * Se reutilizan los productos que ya cargó el layout (parent), sin
 * consultar de nuevo la base de datos.
 */
export const load: PageServerLoad = async ({ params, parent }) => {
	const { productos } = await parent();

	const producto = productos.find((item) => item.id === params.id);

	// Antes esto devolvía la página igual, con "seo" por defecto y un 200
	// silencioso: cualquier URL de producto vieja o mal escrita quedaba
	// indexable y auto-canonicalizada como si fuera una página real. Un
	// 404 real evita que esas URLs acumulen en el índice de Google.
	if (!producto) {
		error(404, 'Producto no encontrado');
	}

	const precio = Number.isFinite(producto.precio)
		? `$${producto.precio.toFixed(2)}`
		: '';

	const descripcion = producto.descripcion?.trim()
		? recortar(producto.descripcion)
		: recortar(
				[producto.marca, producto.Tipo, precio]
					.filter(Boolean)
					.join(' · ')
			);

	const aUrlAbsoluta = (url: string) => (url.startsWith('http') ? url : `${SITIO_URL}${url}`);
	const imagenes = [producto.imagen, ...producto.imagenes].filter(Boolean).map(aUrlAbsoluta);

	// Datos estructurados de producto: sin esto Google no puede mostrar
	// precio ni disponibilidad en los resultados de búsqueda para
	// ninguna de las fichas del catálogo.
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
				producto.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
			itemCondition: 'https://schema.org/NewCondition'
		}
	};

	// Sin la marca en el título, "Hand Cream" o "Powder Cream Lip Balm" no
	// dicen nada por sí solos: la mayoría de las búsquedas de K-Beauty
	// llevan la marca ("tocobo cotton soft sun stick").
	const nombreConMarca = producto.marca
		? `${producto.marca} ${producto.Nombre}`
		: producto.Nombre;

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO_URL },
			{ '@type': 'ListItem', position: 2, name: 'Productos', item: `${SITIO_URL}/products` },
			...(producto.Tipo
				? [
						{
							'@type': 'ListItem',
							position: 3,
							name: producto.Tipo,
							item: `${SITIO_URL}/products?categoria=${encodeURIComponent(producto.Tipo)}`
						}
					]
				: []),
			{ '@type': 'ListItem', position: producto.Tipo ? 4 : 3, name: producto.Nombre }
		]
	};

	return {
		seo: {
			titulo: `${nombreConMarca} · Moon Beauty`,
			descripcion,
			imagen: imagenParaCompartir(producto.imagen),
			tipo: 'article' as const
		},
		productoSchema,
		breadcrumbSchema,
		nombreConMarca
	};
};
