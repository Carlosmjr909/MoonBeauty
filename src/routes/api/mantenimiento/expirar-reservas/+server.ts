import { json } from '@sveltejs/kit';
import { createHash, timingSafeEqual } from 'node:crypto';

import { env } from '$env/dynamic/private';
import { adminDb } from '$lib/server/firebase-admin';
import { invalidarCachePublico } from '$lib/server/cachePublico';
import { expirarReservasVencidas } from '$lib/server/reservas';
import type { RequestHandler } from './$types';

/**
 * Vence las reservas de stock de los pedidos que siguen pendientes después
 * de su plazo (ver $lib/server/reservas.ts). Lo llama el cron de Vercel
 * (vercel.json) y se puede llamar a mano o desde otro programador con:
 *
 *   Authorization: Bearer <CRON_SECRET>
 *
 * CRON_SECRET vive solo en las variables de entorno del servidor (Vercel
 * lo manda solo en ese encabezado). Sin el secreto, o si la variable no
 * está configurada, responde 401 y no toca nada. No recibe parámetros: el
 * servidor decide qué reservas vencieron.
 */

const LIMITE_POR_RONDA = 50;
const MAXIMO_RONDAS = 4;
const PRESUPUESTO_MS = 6_000;

function autorizado(request: Request): boolean {
	const secreto = env.CRON_SECRET ?? '';
	if (secreto.length < 16) {
		console.error('[reservas] CRON_SECRET no está configurado (o es muy corto): se rechaza la llamada.');
		return false;
	}
	// Se comparan los hashes para que el tiempo de la comparación no
	// dependa de cuántos caracteres coinciden.
	const recibido = createHash('sha256').update(request.headers.get('authorization') ?? '').digest();
	const esperado = createHash('sha256').update(`Bearer ${secreto}`).digest();
	return timingSafeEqual(recibido, esperado);
}

const expirarReservas: RequestHandler = async ({ request }) => {
	const sinCache = { 'cache-control': 'no-store' };

	if (!autorizado(request)) {
		return json({ ok: false, error: 'No autorizado.' }, { status: 401, headers: sinCache });
	}

	const inicio = Date.now();
	const total = { revisados: 0, expirados: 0, omitidos: 0, errores: 0, quedanMas: false };

	for (let ronda = 0; ronda < MAXIMO_RONDAS; ronda++) {
		const resultado = await expirarReservasVencidas(adminDb, { limite: LIMITE_POR_RONDA });
		total.revisados += resultado.revisados;
		total.expirados += resultado.expirados;
		total.omitidos += resultado.omitidos;
		total.errores += resultado.errores;
		total.quedanMas = resultado.quedanMas;

		// Si esta ronda no avanzó (solo errores) o no queda tiempo, el
		// resto lo toma el siguiente barrido.
		const avanzo = resultado.expirados + resultado.omitidos > 0;
		if (!resultado.quedanMas || !avanzo || Date.now() - inicio > PRESUPUESTO_MS) break;
	}

	if (total.expirados > 0) await invalidarCachePublico('productos');

	return json({ ok: true, ...total }, { headers: sinCache });
};

export const GET = expirarReservas;
export const POST = expirarReservas;
