import type { PageServerLoad } from './$types';
import { obtenerPaginaLegal } from '$lib/server/legales';

// La descripción se escribe a mano y no se recorta del contenido: el
// contenido está en Markdown (##, -, **), y eso se vería tal cual en el
// resultado de búsqueda si se usara sin procesar.
export const load: PageServerLoad = async () => {
	const pagina = await obtenerPaginaLegal('envios');

	return {
		pagina,
		seo: {
			titulo: `${pagina.titulo} | Moon Beauty`,
			descripcion:
				'Política de envíos de Moon Beauty: cobertura, tiempos de entrega y qué hacer si tu pedido no llega a tiempo.'
		}
	};
};
