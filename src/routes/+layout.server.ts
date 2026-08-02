import type { LayoutServerLoad } from './$types';

export type TasaBCV = {
	moneda: string;
	fuente: string;
	nombre: string;
	compra: number | null;
	venta: number | null;
	promedio: number;
	fechaActualizacion: string;
};

export const load: LayoutServerLoad = async ({ fetch, setHeaders }) => {
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

		return {
			tasaBCV,
			errorTasaBCV: null
		};
	} catch (error) {
		console.error('Error obteniendo la tasa BCV:', error);

		return {
			tasaBCV: null,
			errorTasaBCV:
				'No se pudo consultar la tasa BCV en este momento.'
		};
	}
};