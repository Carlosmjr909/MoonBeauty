import { error, json } from '@sveltejs/kit';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { esColeccionCacheable, invalidarCachePublico } from '$lib/server/cachePublico';
import type { RequestHandler } from './$types';

/**
 * Verifica que quien llama sea realmente un admin — mismo patrón que
 * `src/routes/api/enviar-cupon/+server.ts`. No alcanza con que el panel
 * esté protegido en el navegador: sin esta comprobación cualquiera podría
 * llamar a este endpoint y forzar relecturas de Firestore a voluntad.
 */
async function verificarAdmin(request: Request): Promise<string | null> {
	const encabezado = request.headers.get('authorization') ?? '';

	if (!encabezado.startsWith('Bearer ')) {
		return null;
	}

	const token = encabezado.slice('Bearer '.length).trim();

	if (!token) return null;

	try {
		const decodificado = await adminAuth.verifyIdToken(token);
		const snapshot = await adminDb.collection('admins').doc(decodificado.uid).get();

		return snapshot.exists ? decodificado.uid : null;
	} catch (err) {
		console.error('Token inválido al intentar invalidar caché:', err);
		return null;
	}
}

/**
 * Llamado desde el panel de admin justo después de que una escritura en
 * Firestore tiene éxito (ver src/lib/inventario.ts, configuracion.ts,
 * contenido.ts). Solo invalida caché — nunca escribe datos.
 */
export const POST: RequestHandler = async ({ request }) => {
	const uid = await verificarAdmin(request);

	if (!uid) {
		error(401, 'No autorizado');
	}

	const cuerpo = await request.json().catch(() => null);
	const coleccion = cuerpo?.coleccion;

	if (!esColeccionCacheable(coleccion)) {
		error(400, 'Colección inválida');
	}

	await invalidarCachePublico(coleccion);

	return json({ ok: true });
};
