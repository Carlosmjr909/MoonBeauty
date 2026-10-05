import { adminDb } from '$lib/server/firebase-admin';
import { invalidarCachePublico } from '$lib/server/cachePublico';
import { expirarReservasVencidas } from '$lib/server/reservas';

/**
 * Barrido de reservas vencidas que se dispara con el tráfico normal del
 * sitio (al cargar páginas y al crear pedidos). En el plan Hobby de Vercel
 * los cron jobs solo pueden correr una vez al día, así que el cron diario
 * (vercel.json) queda como red de seguridad y esto es lo que libera el
 * stock unos minutos después de que vence cada reserva.
 *
 * Como mucho un barrido por minuto en cada instancia; las solicitudes que
 * llegan mientras uno está en curso esperan ese mismo. Nunca lanza: un
 * error se registra y la página o el pedido siguen como si nada.
 */

const INTERVALO_MINIMO_MS = 60_000;

let ultimoInicio = 0;
let barridoEnCurso: Promise<void> | null = null;

export function barrerReservasVencidas(): Promise<void> {
	if (barridoEnCurso) return barridoEnCurso;
	if (Date.now() - ultimoInicio < INTERVALO_MINIMO_MS) return Promise.resolve();
	ultimoInicio = Date.now();

	barridoEnCurso = (async () => {
		try {
			const resultado = await expirarReservasVencidas(adminDb, { limite: 25 });
			// Que el catálogo muestre el stock devuelto sin esperar el TTL.
			if (resultado.expirados > 0) await invalidarCachePublico('productos');
		} catch (err) {
			console.error('[reservas] Falló el barrido de reservas vencidas:', err);
		} finally {
			barridoEnCurso = null;
		}
	})();

	return barridoEnCurso;
}
