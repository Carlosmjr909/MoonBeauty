import type { PageServerLoad } from './$types';
import { obtenerPaginaLegal } from '$lib/server/legales';

export const load: PageServerLoad = async () => {
	const pagina = await obtenerPaginaLegal('privacidad');

	return {
		pagina,
		seo: {
			titulo: `${pagina.titulo} | Moon Beauty`,
			descripcion:
				'Política de privacidad de Moon Beauty: qué datos recopilamos, cómo los usamos y cómo los proteges al comprar o crear una cuenta.'
		}
	};
};
