import type { MetodoPago } from '$lib/pedidos';

export const CODIGO_CUPON = 'MOON20';
export const PORCENTAJE_DESCUENTO_CUPON = 0.2;

/**
 * Métodos de pago en divisas ($) elegibles para el cupón MOON20.
 * El pago móvil queda fuera porque se cobra en bolívares (VES).
 */
export const METODOS_PAGO_CON_CUPON: MetodoPago[] = [
	'efectivo',
	'binance',
	'zelle',
	'zinli'
];

export function esMetodoPagoElegibleParaCupon(metodo: MetodoPago): boolean {
	return METODOS_PAGO_CON_CUPON.includes(metodo);
}

export function calcularDescuentoUSD(totalUSD: number): number {
	if (!Number.isFinite(totalUSD) || totalUSD <= 0) {
		return 0;
	}

	return Math.round(totalUSD * PORCENTAJE_DESCUENTO_CUPON * 100) / 100;
}
