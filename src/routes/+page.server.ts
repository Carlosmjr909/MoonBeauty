import type { PageServerLoad } from './$types';
import {
	obtenerMarcas,
	obtenerPublicacionesInstagram
} from '$lib/server/productos';

/**
 * Contenido de la portada que se administra desde el panel: las
 * publicaciones de Instagram y los logos de las marcas. Se cargan en el
 * servidor para que aparezcan ya renderizados (sin salto visual) y para
 * que los buscadores los vean.
 *
 * Si alguna consulta falla, se devuelve una lista vacía en vez de romper
 * la portada completa: la sección simplemente no se muestra.
 */
export const load: PageServerLoad = async () => {
	const [publicacionesInstagram, marcas] = await Promise.all([
		obtenerPublicacionesInstagram().catch((error) => {
			console.error('Error obteniendo publicaciones de Instagram:', error);
			return [];
		}),
		obtenerMarcas().catch((error) => {
			console.error('Error obteniendo marcas:', error);
			return [];
		})
	]);

	return { publicacionesInstagram, marcas };
};
