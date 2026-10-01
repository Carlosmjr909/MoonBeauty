/**
 * Reglas del programa de puntos Moon Beauty. Este archivo no importa
 * Firebase a propósito: lo usan tanto el navegador (perfil, checkout)
 * como el servidor (crear-pedido, canje), y así los dos calculan igual.
 */

/** Cada cuántos dólares pagados se gana 1 punto. */
export const DOLARES_POR_PUNTO = 5;

/** Descuentos que se pueden canjear y cuántos puntos cuesta cada uno. */
export const NIVELES_CANJE = [
	{ porcentaje: 10, puntos: 20 },
	{ porcentaje: 20, puntos: 40 }
] as const;

export type PorcentajeCanje = (typeof NIVELES_CANJE)[number]['porcentaje'];

export const LARGO_MINIMO_CODIGO = 4;
export const LARGO_MAXIMO_CODIGO = 15;

/** Puntos que da una compra según lo que se pagó (ya con descuentos). */
export function calcularPuntos(totalUSD: number): number {
	if (!Number.isFinite(totalUSD) || totalUSD <= 0) return 0;
	return Math.floor(totalUSD / DOLARES_POR_PUNTO);
}

export function nivelCanje(porcentaje: number) {
	return NIVELES_CANJE.find((nivel) => nivel.porcentaje === porcentaje) ?? null;
}

/** Mismo formato que los cupones del panel: mayúsculas y sin espacios. */
export function normalizarCodigoPersonal(codigo: string): string {
	return codigo.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Devuelve el motivo por el que un nombre de código no sirve, o null si
 * está bien. Solo letras y números sin acentos, para que se pueda
 * escribir igual en cualquier teclado al pagar.
 */
export function errorCodigoPersonal(codigo: string): string | null {
	if (codigo.length < LARGO_MINIMO_CODIGO) {
		return `El código debe tener al menos ${LARGO_MINIMO_CODIGO} caracteres.`;
	}

	if (codigo.length > LARGO_MAXIMO_CODIGO) {
		return `El código puede tener como máximo ${LARGO_MAXIMO_CODIGO} caracteres.`;
	}

	if (!/^[A-Z0-9]+$/.test(codigo)) {
		return 'Usa solo letras y números, sin acentos, espacios ni símbolos.';
	}

	return null;
}
