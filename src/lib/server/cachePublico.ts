import { getCache } from '@vercel/functions';
import {
	obtenerCategoriasPublicas,
	obtenerConfiguracionSitio,
	obtenerMarcas,
	obtenerProductosPublicos,
	obtenerPublicacionesInstagram,
	obtenerTestimonios,
	type CategoriaPublica,
	type MarcaPublica,
	type ProductoPublico,
	type PublicacionInstagramPublica,
	type TestimonioPublico
} from '$lib/server/productos';

/**
 * Caché de dos capas para los datos públicos de Firestore que se leen en
 * (casi) cada request SSR — productos, categorías, configuración, marcas,
 * testimonios e instagram. Mismo concepto que `$lib/server/tasaBCV.ts`
 * (memoria de instancia + promise dedup + Vercel Runtime Cache), pero en
 * un módulo separado: esto NO tiene nada que ver con DolarAPI.
 *
 * A diferencia de la tasa BCV, estos datos SÍ los edita un humano desde
 * `/admin` en cualquier momento, así que además de TTL hay invalidación
 * activa (ver `invalidarCachePublico`), llamada desde `src/lib/inventario.ts`,
 * `src/lib/configuracion.ts` y `src/lib/contenido.ts` justo después de que
 * cada escritura en Firestore tiene éxito.
 *
 * LIMITACIÓN IMPORTANTE, documentada explícitamente: invalidar borra el
 * Runtime Cache compartido y la memoria de LA INSTANCIA que procesa esa
 * invalidación — no puede alcanzar la memoria de otras instancias que ya
 * tengan el valor viejo cargado. Por eso cada caché tiene un TTL de
 * memoria corto (ver abajo, especialmente productos): es la única forma
 * de acotar cuánto puede durar ese valor viejo en una instancia que no
 * se enteró de la invalidación.
 */

const DEBUG = process.env.TASA_BCV_DEBUG === 'true';

function obs(nombre: string, evento: string, detalle?: Record<string, unknown>) {
	if (!DEBUG) return;
	console.info(`[cachePublico:OBS] ${nombre}_${evento}`, detalle ? JSON.stringify(detalle) : '');
}

type EntradaCache<T> = {
	datos: T;
	obtenidaEn: number;
};

type OpcionesCache<T> = {
	/** Nombre corto usado en la clave de Runtime Cache y en los logs (ej. "productos"). */
	nombre: string;
	/** Cuánto dura fresco el valor en memoria de esta instancia. */
	ttlMemoriaMs: number;
	/** TTL pasado a Runtime Cache — red de seguridad si la invalidación activa falla. */
	ttlRuntimeCacheSegundos: number;
	/** La consulta real a Firestore (vía Admin SDK). */
	cargar: () => Promise<T>;
	/** Chequeo mínimo de forma antes de confiar en un valor leído de Runtime Cache. */
	esValido: (valor: unknown) => boolean;
};

function crearCachePublico<T>(opciones: OpcionesCache<T>) {
	const ETIQUETA = opciones.nombre.toUpperCase();
	const CLAVE_RUNTIME_CACHE = `moonbeauty:${opciones.nombre}`;

	let memoria: EntradaCache<T> | null = null;
	let refrescoEnCurso: Promise<EntradaCache<T>> | null = null;

	function esEntradaValida(valor: unknown): valor is EntradaCache<T> {
		if (!valor || typeof valor !== 'object') return false;
		const v = valor as Record<string, unknown>;
		return typeof v.obtenidaEn === 'number' && opciones.esValido(v.datos);
	}

	// Los datos que caen dentro de esEntradaValida ya pasaron el chequeo de
	// forma de opciones.esValido; TypeScript no puede seguir esa relación a
	// través del predicado genérico, así que se confía igual que en
	// esEntradaValida (mismo patrón que $lib/server/tasaBCV.ts).

	async function leerRuntimeCache(): Promise<EntradaCache<T> | null> {
		try {
			const cache = getCache();
			const valor = await cache.get(CLAVE_RUNTIME_CACHE);
			return esEntradaValida(valor) ? valor : null;
		} catch (error) {
			console.error(`[cachePublico] Error leyendo Runtime Cache de ${opciones.nombre}:`, error);
			return null;
		}
	}

	async function guardarRuntimeCache(entrada: EntradaCache<T>): Promise<void> {
		try {
			const cache = getCache();
			await cache.set(CLAVE_RUNTIME_CACHE, entrada, {
				ttl: opciones.ttlRuntimeCacheSegundos
			});
		} catch (error) {
			console.error(`[cachePublico] Error guardando en Runtime Cache de ${opciones.nombre}:`, error);
		}
	}

	async function refrescar(): Promise<EntradaCache<T>> {
		const desdeRuntimeCache = await leerRuntimeCache();
		if (desdeRuntimeCache) {
			const fresca = Date.now() - desdeRuntimeCache.obtenidaEn < opciones.ttlRuntimeCacheSegundos * 1000;
			if (fresca) {
				obs(ETIQUETA, 'RUNTIME_HIT');
				memoria = desdeRuntimeCache;
				return desdeRuntimeCache;
			}
		}

		obs(ETIQUETA, 'RUNTIME_MISS');
		obs(ETIQUETA, 'FIRESTORE_READ');

		const datos = await opciones.cargar();
		const entrada: EntradaCache<T> = { datos, obtenidaEn: Date.now() };
		memoria = entrada;
		await guardarRuntimeCache(entrada);
		return entrada;
	}

	async function obtener(): Promise<T> {
		const memoriaFresca = memoria && Date.now() - memoria.obtenidaEn < opciones.ttlMemoriaMs;

		if (memoriaFresca) {
			// MEMORY_HIT: sin log, es el camino caliente de la mayoría de requests.
			return memoria!.datos;
		}

		obs(ETIQUETA, 'MEMORY_MISS');

		if (!refrescoEnCurso) {
			refrescoEnCurso = refrescar().finally(() => {
				refrescoEnCurso = null;
			});
		}

		const entrada = await refrescoEnCurso;
		return entrada.datos;
	}

	async function invalidar(): Promise<void> {
		memoria = null;

		try {
			const cache = getCache();
			await cache.delete(CLAVE_RUNTIME_CACHE);
		} catch (error) {
			console.error(`[cachePublico] Error invalidando Runtime Cache de ${opciones.nombre}:`, error);
		}

		obs(ETIQUETA, 'CACHE_INVALIDATED');
	}

	return { obtener, invalidar };
}

const esArray = (valor: unknown): valor is unknown[] => Array.isArray(valor);
const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
	typeof valor === 'object' && valor !== null && !Array.isArray(valor);

/*
 * TTLs: no son iguales para todas las colecciones. La invalidación activa
 * (ver invalidarCachePublico) cubre el caso normal (un admin guarda un
 * cambio), así que el TTL es sobre todo una red de seguridad para cuando
 * esa invalidación no llega a ejecutarse (ej. el admin pierde conexión
 * justo después de guardar). Por eso:
 *
 * - productos: TTL de memoria muy corto (15s) porque precio/stock son
 *   sensibles y no queremos depender solo de la invalidación activa; TTL
 *   de Runtime Cache moderado (5 min) como red de seguridad.
 * - categorias/configuracion: cambian con más cuidado/frecuencia que
 *   marcas o testimonios (categorías se tocan al reorganizar el catálogo),
 *   TTL intermedio.
 * - marcas/testimonios/instagram: contenido editorial que cambia rara
 *   vez, TTL largo — la invalidación activa sigue haciendo que un cambio
 *   se vea de inmediato en la instancia que lo procesó.
 */

const cacheProductos = crearCachePublico<ProductoPublico[]>({
	nombre: 'productos',
	ttlMemoriaMs: 15_000,
	// Bajado de 300s a 120s: en el escenario donde la llamada de
	// invalidación falla (ver revisión de Fase 1), este TTL es el
	// verdadero límite de cuánto puede durar un precio/stock viejo — no
	// el TTL de memoria. 120s acota ese peor caso sin perder casi nada
	// de la reducción de lecturas a Firestore.
	ttlRuntimeCacheSegundos: 120,
	cargar: obtenerProductosPublicos,
	esValido: esArray
});

const cacheCategorias = crearCachePublico<CategoriaPublica[]>({
	nombre: 'categorias',
	ttlMemoriaMs: 120_000,
	ttlRuntimeCacheSegundos: 1800,
	cargar: obtenerCategoriasPublicas,
	esValido: esArray
});

const cacheConfiguracion = crearCachePublico<Record<string, Record<string, unknown>>>({
	nombre: 'configuracion',
	ttlMemoriaMs: 120_000,
	ttlRuntimeCacheSegundos: 1800,
	cargar: obtenerConfiguracionSitio,
	esValido: esObjeto
});

const cacheMarcas = crearCachePublico<MarcaPublica[]>({
	nombre: 'marcas',
	ttlMemoriaMs: 300_000,
	ttlRuntimeCacheSegundos: 3600,
	cargar: obtenerMarcas,
	esValido: esArray
});

const cacheTestimonios = crearCachePublico<TestimonioPublico[]>({
	nombre: 'testimonios',
	ttlMemoriaMs: 300_000,
	ttlRuntimeCacheSegundos: 3600,
	cargar: obtenerTestimonios,
	esValido: esArray
});

const cacheInstagram = crearCachePublico<PublicacionInstagramPublica[]>({
	nombre: 'instagram',
	ttlMemoriaMs: 300_000,
	ttlRuntimeCacheSegundos: 3600,
	cargar: obtenerPublicacionesInstagram,
	esValido: esArray
});

export const obtenerProductosPublicosConCache = () => cacheProductos.obtener();
export const obtenerCategoriasPublicasConCache = () => cacheCategorias.obtener();
export const obtenerConfiguracionSitioConCache = () => cacheConfiguracion.obtener();
export const obtenerMarcasConCache = () => cacheMarcas.obtener();
export const obtenerTestimoniosConCache = () => cacheTestimonios.obtener();
export const obtenerPublicacionesInstagramConCache = () => cacheInstagram.obtener();

export type ColeccionCacheable =
	| 'productos'
	| 'categorias'
	| 'configuracion'
	| 'marcas'
	| 'testimonios'
	| 'instagram';

const CACHES: Record<ColeccionCacheable, { invalidar: () => Promise<void> }> = {
	productos: cacheProductos,
	categorias: cacheCategorias,
	configuracion: cacheConfiguracion,
	marcas: cacheMarcas,
	testimonios: cacheTestimonios,
	instagram: cacheInstagram
};

export function esColeccionCacheable(valor: unknown): valor is ColeccionCacheable {
	return typeof valor === 'string' && valor in CACHES;
}

/**
 * Invalida el caché de una colección: borra Runtime Cache (la capa
 * compartida entre instancias) y la memoria de ESTA instancia. No puede
 * alcanzar la memoria de otras instancias — ver la nota al inicio del
 * archivo.
 */
export async function invalidarCachePublico(coleccion: ColeccionCacheable): Promise<void> {
	await CACHES[coleccion].invalidar();
}
