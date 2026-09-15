import { getCache } from '@vercel/functions';

/**
 * Caché de dos capas para la tasa BCV usada SOLO para mostrar precios en
 * pantalla (home, listado de productos, producto, carrito, checkout).
 *
 * NO tiene ninguna relación con el cálculo real de un pedido: eso sigue
 * obteniéndose de forma completamente independiente en
 * `src/routes/api/enviar-pedido/crear-pedido/+server.ts`, que no fue
 * tocado.
 *
 * Capa 1 — memoria del módulo: válida mientras la instancia serverless
 * siga viva y caliente. Incluye deduplicación de refrescos concurrentes
 * (varias peticiones a la misma instancia esperan la MISMA promesa en
 * vez de disparar varios fetch a DolarAPI a la vez).
 *
 * Capa 2 — Vercel Runtime Cache (`getCache()` de `@vercel/functions`):
 * compartida entre instancias de la misma región y sobrevive cold
 * starts. En el plan Hobby el Runtime Cache se comparte entre TODOS los
 * proyectos de la cuenta, por eso la clave lleva el prefijo `moonbeauty:`.
 *
 * Ninguna de las dos capas garantiza una única llamada global a
 * DolarAPI: si varias instancias detectan el vencimiento casi al mismo
 * tiempo, cada una puede hacer su propia llamada. Lo que sí garantizan
 * es que el número de llamadas queda acotado por el número de
 * instancias que "ganan la carrera", no por el número de requests.
 */

export type TasaBCV = {
	moneda: string;
	fuente: string;
	nombre: string;
	compra: number | null;
	venta: number | null;
	promedio: number;
	fechaActualizacion: string;
};

type EntradaCache = {
	tasa: TasaBCV;
	obtenidaEn: number;
};

const CLAVE_RUNTIME_CACHE = 'moonbeauty:tasaBCV';
const TTL_MS = 900_000; // 15 minutos
const TIMEOUT_MS = 5000;
const COOLDOWN_FALLO_MS = 30_000;

let memoria: EntradaCache | null = null;
let refrescoEnCurso: Promise<EntradaCache | null> | null = null;
let ultimoFalloEn: number | null = null;

/*
 * Observabilidad TEMPORAL para la prueba de carga posterior a esta
 * implementación (ver informe de la prueba de 100 VUs). Apagada por
 * defecto: no agrega ningún log en operación normal. Se activa solo con
 * TASA_BCV_DEBUG=true en el ambiente del deployment usado para probar.
 * Candidata a eliminarse una vez concluida esa prueba.
 */
const DEBUG = process.env.TASA_BCV_DEBUG === 'true';

function obs(evento: string, detalle?: Record<string, unknown>) {
	if (!DEBUG) return;
	console.info(`[tasaBCV:OBS] ${evento}`, detalle ? JSON.stringify(detalle) : '');
}

function esTasaValida(valor: unknown): valor is TasaBCV {
	if (!valor || typeof valor !== 'object') return false;
	const promedio = (valor as Record<string, unknown>).promedio;
	return typeof promedio === 'number' && Number.isFinite(promedio) && promedio > 0;
}

function esEntradaCacheValida(valor: unknown): valor is EntradaCache {
	if (!valor || typeof valor !== 'object') return false;
	const v = valor as Record<string, unknown>;
	return typeof v.obtenidaEn === 'number' && esTasaValida(v.tasa);
}

async function fetchDolarApiConTimeout(
	fetchFn: typeof globalThis.fetch
): Promise<TasaBCV> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const respuesta = await fetchFn('https://ve.dolarapi.com/v1/dolares/oficial', {
			headers: { accept: 'application/json' },
			signal: controller.signal
		});

		if (!respuesta.ok) {
			throw new Error(`DolarApi respondió con el código ${respuesta.status}`);
		}

		const datos = await respuesta.json();

		if (!esTasaValida(datos)) {
			throw new Error('La tasa BCV recibida no es válida');
		}

		return datos;
	} finally {
		clearTimeout(timeoutId);
	}
}

async function leerRuntimeCache(): Promise<EntradaCache | null> {
	try {
		const cache = getCache();
		const valor = await cache.get(CLAVE_RUNTIME_CACHE);
		return esEntradaCacheValida(valor) ? valor : null;
	} catch (error) {
		console.error('[tasaBCV] Error leyendo Runtime Cache:', error);
		return null;
	}
}

async function guardarRuntimeCache(entrada: EntradaCache): Promise<void> {
	try {
		const cache = getCache();
		await cache.set(CLAVE_RUNTIME_CACHE, entrada, { ttl: TTL_MS / 1000 });
	} catch (error) {
		console.error('[tasaBCV] Error guardando en Runtime Cache:', error);
	}
}

async function refrescar(fetchFn: typeof globalThis.fetch): Promise<EntradaCache | null> {
	// Capa 2: si otra instancia ya dejó una tasa vigente en Runtime Cache,
	// la reutilizamos sin llamar a DolarAPI. Un valor vencido igual se
	// guarda como candidato de fallback (mejor que nada si DolarAPI falla).
	const desdeRuntimeCache = await leerRuntimeCache();
	if (desdeRuntimeCache) {
		if (!memoria || desdeRuntimeCache.obtenidaEn > memoria.obtenidaEn) {
			memoria = desdeRuntimeCache;
		}
		if (Date.now() - desdeRuntimeCache.obtenidaEn < TTL_MS) {
			obs('RUNTIME_CACHE_HIT', { obtenidaEn: desdeRuntimeCache.obtenidaEn });
			return memoria;
		}
	}

	obs('RUNTIME_CACHE_MISS');
	console.info('[tasaBCV] Runtime Cache MISS o vencido, consultando DolarAPI');

	if (ultimoFalloEn && Date.now() - ultimoFalloEn < COOLDOWN_FALLO_MS) {
		// DolarAPI falló hace poco: no insistir en cada request, solo
		// servir lo último que tengamos (puede ser null).
		obs('COOLDOWN', { ultimoFalloEn });
		return memoria;
	}

	obs('DOLARAPI_CALL');

	try {
		const tasa = await fetchDolarApiConTimeout(fetchFn);
		const entrada: EntradaCache = { tasa, obtenidaEn: Date.now() };
		memoria = entrada;
		ultimoFalloEn = null;
		await guardarRuntimeCache(entrada);
		obs('DOLARAPI_SUCCESS', { promedio: tasa.promedio });
		return entrada;
	} catch (error) {
		console.error('[tasaBCV] Error obteniendo la tasa BCV de DolarAPI:', error);
		obs('DOLARAPI_ERROR', { mensaje: error instanceof Error ? error.message : String(error) });
		ultimoFalloEn = Date.now();
		if (memoria) {
			console.warn('[tasaBCV] DolarAPI falló; usando última tasa válida conocida como fallback de display');
			obs('FALLBACK', { obtenidaEn: memoria.obtenidaEn });
		}
		return memoria;
	}
}

/**
 * Punto de entrada usado por `+layout.server.ts`. Nunca inventa una
 * tasa: si nunca hubo un valor válido disponible, devuelve
 * `tasaBCV: null` con un mensaje de error, igual que antes de este
 * caché.
 */
export async function obtenerTasaBCVConCache(
	fetchFn: typeof globalThis.fetch
): Promise<{ tasaBCV: TasaBCV | null; errorTasaBCV: string | null }> {
	const memoriaFresca = memoria && Date.now() - memoria.obtenidaEn < TTL_MS;

	if (memoriaFresca) {
		// MEMORY_HIT: intencionalmente sin log — es el camino caliente,
		// ocurre en la gran mayoría de los requests.
		return { tasaBCV: memoria!.tasa, errorTasaBCV: null };
	}

	obs('MEMORY_MISS');

	if (!refrescoEnCurso) {
		refrescoEnCurso = refrescar(fetchFn).finally(() => {
			refrescoEnCurso = null;
		});
	}

	const resultado = await refrescoEnCurso;

	if (resultado) {
		return { tasaBCV: resultado.tasa, errorTasaBCV: null };
	}

	return {
		tasaBCV: null,
		errorTasaBCV: 'No se pudo consultar la tasa BCV en este momento.'
	};
}
