import type { PageServerLoad } from './$types';
import { obtenerPaginaLegal } from '$lib/server/legales';

export const load: PageServerLoad = async () => {
	const pagina = await obtenerPaginaLegal('cambios-y-devoluciones');

	return {
		pagina,
		seo: {
			titulo: `${pagina.titulo} | Moon Beauty`,
			descripcion:
				'Política de cambios y devoluciones de Moon Beauty: qué casos cubrimos, plazos y cómo reportar un problema con tu pedido.'
		}
	};
};
