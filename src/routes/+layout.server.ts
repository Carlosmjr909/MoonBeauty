import type { LayoutServerLoad } from './$types';
import {
	obtenerCategoriasPublicasConCache,
	obtenerConfiguracionSitioConCache,
	obtenerProductosPublicosConCache
} from '$lib/server/cachePublico';
import {
	normalizarConfiguracionContacto,
	normalizarConfiguracionPagos,
	normalizarConfiguracionPortada
} from '$lib/configuracion';
import { obtenerTasaBCVConCache } from '$lib/server/tasaBCV';

export type { TasaBCV } from '$lib/server/tasaBCV';

async function cargarTasaBCV(
	fetch: typeof globalThis.fetch,
	setHeaders: Parameters<LayoutServerLoad>[0]['setHeaders']
) {
	const resultado = await obtenerTasaBCVConCache(fetch);

	if (resultado.tasaBCV) {
		/*
		 * Permite reutilizar la respuesta de esta página en el borde de
		 * Vercel durante cinco minutos. Es independiente del caché de la
		 * tasa en sí (ver $lib/server/tasaBCV.ts): esto cachea el HTML
		 * de ESTA URL; el otro cachea el VALOR de la tasa, compartido
		 * entre todas las URLs del sitio.
		 */
		setHeaders({
			'cache-control':
				'public, max-age=300, stale-while-revalidate=600'
		});
	}

	return resultado;
}

export const load: LayoutServerLoad = async ({ fetch, setHeaders }) => {
	const [datosTasaBCV, productos, categorias, configuracion] =
		await Promise.all([
			cargarTasaBCV(fetch, setHeaders),
			obtenerProductosPublicosConCache().catch((error) => {
				console.error('Error obteniendo productos:', error);
				return [];
			}),
			obtenerCategoriasPublicasConCache().catch((error) => {
				console.error('Error obteniendo categorías:', error);
				return [];
			}),
			obtenerConfiguracionSitioConCache().catch((error) => {
				console.error('Error obteniendo la configuración del sitio:', error);
				return {} as Record<string, Record<string, unknown>>;
			})
		]);

	return {
		...datosTasaBCV,
		productos,
		categorias,
		// Si un documento todavía no existe, normalizar devuelve los
		// valores por defecto, así que nunca llegan vacíos a las páginas.
		configuracionPagos: normalizarConfiguracionPagos(configuracion.pagos),
		configuracionPortada: normalizarConfiguracionPortada(
			configuracion.portada
		),
		configuracionContacto: normalizarConfiguracionContacto(
			configuracion.contacto
		)
	};
};