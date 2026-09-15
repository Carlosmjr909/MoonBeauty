import { get } from 'svelte/store';
import { usuario } from '$lib/auth';

export type ColeccionCacheable =
	| 'productos'
	| 'categorias'
	| 'configuracion'
	| 'marcas'
	| 'testimonios'
	| 'instagram';

/**
 * Avisa al servidor que una colección pública cambió, para que invalide
 * su caché (ver `$lib/server/cachePublico.ts`). Se llama SIEMPRE después
 * de que la escritura en Firestore ya tuvo éxito — nunca antes.
 *
 * Si esto falla (red, sesión vencida, etc.) NO se propaga el error: el
 * dato ya se guardó correctamente en Firestore, y el TTL de la caché
 * actúa como red de seguridad. Fallar la acción del admin por esto sería
 * peor que una ventana de caché un poco más larga de lo ideal.
 */
export async function invalidarCachePublico(coleccion: ColeccionCacheable): Promise<void> {
	try {
		const usuarioActual = get(usuario);
		if (!usuarioActual) return;

		const token = await usuarioActual.getIdToken();

		await fetch('/api/admin/invalidar-cache', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ coleccion })
		});
	} catch (error) {
		console.error(`No se pudo invalidar la caché de "${coleccion}":`, error);
	}
}
