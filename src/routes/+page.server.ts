import type { PageServerLoad } from './$types';
import {
	obtenerMarcas,
	obtenerPublicacionesInstagram,
	obtenerTestimonios
} from '$lib/server/productos';

/**
 * Contenido de la portada que se administra desde el panel: las
 * publicaciones de Instagram, los logos de las marcas y los testimonios
 * de clientes. Se cargan en el servidor para que aparezcan ya
 * renderizados (sin salto visual) y para que los buscadores los vean.
 *
 * Si alguna consulta falla, se devuelve una lista vacía en vez de romper
 * la portada completa: la sección simplemente no se muestra.
 */
export const load: PageServerLoad = async () => {
	const [publicacionesInstagram, marcas, testimonios] = await Promise.all([
		obtenerPublicacionesInstagram().catch((error) => {
			console.error('Error obteniendo publicaciones de Instagram:', error);
			return [];
		}),
		obtenerMarcas().catch((error) => {
			console.error('Error obteniendo marcas:', error);
			return [];
		}),
		obtenerTestimonios().catch((error) => {
			console.error('Error obteniendo testimonios:', error);
			return [];
		})
	]);

	return { publicacionesInstagram, marcas, testimonios };
};
