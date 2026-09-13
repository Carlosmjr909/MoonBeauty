import type { PageServerLoad } from './$types';
import { obtenerPaginaLegal } from '$lib/server/legales';

export const load: PageServerLoad = async () => {
	const pagina = await obtenerPaginaLegal('terminos-y-condiciones');

	return {
		pagina,
		seo: {
			titulo: `${pagina.titulo} | Moon Beauty`,
			descripcion:
				'Términos y condiciones de Moon Beauty: precios, métodos de pago, envíos y condiciones de uso del sitio.'
		}
	};
};
