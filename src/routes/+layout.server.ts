import type { LayoutServerLoad } from './$types';
import {
	obtenerCategoriasPublicas,
	obtenerConfiguracionSitio,
	obtenerProductosPublicos
} from '$lib/server/productos';
import {
	normalizarConfiguracionContacto,
	normalizarConfiguracionPagos,
	normalizarConfiguracionPortada
} from '$lib/configuracion';

export type TasaBCV = {
	moneda: string;
	fuente: string;
	nombre: string;
	compra: number | null;
	venta: number | null;
	promedio: number;
	fechaActualizacion: string;
};

async function cargarTasaBCV(
	fetch: typeof globalThis.fetch,
	setHeaders: Parameters<LayoutServerLoad>[0]['setHeaders']
) {
	try {
		const respuesta = await fetch(
			'https://ve.dolarapi.com/v1/dolares/oficial',
			{
				headers: {
					accept: 'application/json'
				}
			}
		);

		if (!respuesta.ok) {
			throw new Error(
				`DolarApi respondió con el código ${respuesta.status}`
			);
		}

		const tasaBCV = (await respuesta.json()) as TasaBCV;

		if (
			typeof tasaBCV.promedio !== 'number' ||
			!Number.isFinite(tasaBCV.promedio) ||
			tasaBCV.promedio <= 0
		) {
			throw new Error('La tasa BCV recibida no es válida');
		}

		/*
		 * Permite reutilizar la tasa durante cinco minutos
		 * para no llamar innecesariamente a la API.
		 */
		setHeaders({
			'cache-control':
				'public, max-age=300, stale-while-revalidate=600'
		});

		return { tasaBCV, errorTasaBCV: null };
	} catch (error) {
		console.error('Error obteniendo la tasa BCV:', error);

		return {
			tasaBCV: null,
			errorTasaBCV:
				'No se pudo consultar la tasa BCV en este momento.'
		};
	}
}

export const load: LayoutServerLoad = async ({ fetch, setHeaders }) => {
	const [datosTasaBCV, productos, categorias, configuracion] =
		await Promise.all([
			cargarTasaBCV(fetch, setHeaders),
			obtenerProductosPublicos().catch((error) => {
				console.error('Error obteniendo productos:', error);
				return [];
			}),
			obtenerCategoriasPublicas().catch((error) => {
				console.error('Error obteniendo categorías:', error);
				return [];
			}),
			obtenerConfiguracionSitio().catch((error) => {
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