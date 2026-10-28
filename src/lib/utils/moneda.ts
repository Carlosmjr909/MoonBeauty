export function convertirUSDaVES(
	precioUSD: number,
	tasaBCV: number
): number {
	if (!Number.isFinite(precioUSD) || precioUSD < 0) {
		return 0;
	}

	if (!Number.isFinite(tasaBCV) || tasaBCV <= 0) {
		return 0;
	}

	return Math.round(precioUSD * tasaBCV * 100) / 100;
}

/**
 * Lee un precio escrito en el panel: acepta coma o punto como decimal
 * ("30,5", "30.50", "$ 30,5") y hasta 2 decimales. Devuelve null si no es
 * un precio válido (vacío, a medio escribir como "30," o con letras).
 */
export function leerPrecioUSD(texto: string | number): number | null {
	const limpio = String(texto ?? '').replace(/[\s$]/g, '').replace(',', '.');
	if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
	return Math.round(Number(limpio) * 100) / 100;
}

export function formatearUSD(monto: number): string {
	return new Intl.NumberFormat('es-VE', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(monto);
}

export function formatearVES(monto: number): string {
	return new Intl.NumberFormat('es-VE', {
		style: 'currency',
		currency: 'VES',
		currencyDisplay: 'code',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(monto);
}

export function formatearFecha(fecha: string): string {
	const fechaConvertida = new Date(fecha);

	if (Number.isNaN(fechaConvertida.getTime())) {
		return 'Fecha no disponible';
	}

	return new Intl.DateTimeFormat('es-VE', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(fechaConvertida);
}