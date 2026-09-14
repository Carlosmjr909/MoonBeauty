import type { PageServerLoad } from './$types';
import { obtenerPaginaLegal } from '$lib/server/legales';

export const load: PageServerLoad = async () => {
	const pagina = await obtenerPaginaLegal('nosotros');

	return {
		pagina,
		seo: {
			titulo: `${pagina.titulo} | Moon Beauty`,
			descripcion:
				'Moon Beauty: tienda venezolana de skincare coreano en Valencia, Carabobo. Delivery en Valencia y Naguanagua, envíos a toda Venezuela, pedidos por WhatsApp.'
		}
	};
};
