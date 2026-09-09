import type { PageServerLoad } from './$types';
import { obtenerPaginaLegal } from '$lib/server/legales';

export const load: PageServerLoad = async () => {
	return { pagina: await obtenerPaginaLegal('privacidad') };
};
