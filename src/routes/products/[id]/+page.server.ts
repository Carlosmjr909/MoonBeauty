import type { PageServerLoad } from './$types';
import { imagenParaCompartir, recortar, SEO_POR_DEFECTO } from '$lib/seo';

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

	if (!producto) {
		return { seo: SEO_POR_DEFECTO };
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

	return {
		seo: {
			titulo: `${producto.Nombre} · Moon Beauty`,
			descripcion,
			imagen: imagenParaCompartir(producto.imagen),
			tipo: 'article' as const
		}
	};
};
