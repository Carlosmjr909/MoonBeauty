import type { PageServerLoad } from './$types';
import {
	obtenerContenidoOriginal,
	obtenerPaginaLegal,
	SLUGS_LEGALES
} from '$lib/server/legales';

/**
 * Carga las cuatro páginas legales con el contenido que se está
 * publicando ahora mismo, más el contenido original de cada una para
 * poder restaurarlo desde el panel.
 *
 * Este contenido es el mismo que ya es público en /envios, /privacidad,
 * etc., así que no expone nada que no se pueda ver sin iniciar sesión.
 */
export const load: PageServerLoad = async () => {
	const paginas = await Promise.all(
		SLUGS_LEGALES.map(async (slug) => {
			const pagina = await obtenerPaginaLegal(slug);
			const original = obtenerContenidoOriginal(slug);

			return {
				slug: pagina.slug,
				titulo: pagina.titulo,
				actualizado: pagina.actualizado,
				contenido: pagina.contenido,
				contenidoOriginal: original.contenido
			};
		})
	);

	return { paginas };
};
