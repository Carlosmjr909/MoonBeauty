/**
 * Prueba de carga de Moon Beauty — SOLO navegación pública de solo
 * lectura (GET). No crea pedidos, no envía cupones, no sube archivos,
 * no toca /admin. Ver loadtest/README.md para el detalle completo de
 * qué se prueba y qué se excluye a propósito, y por qué.
 *
 * Uso:
 *   BASE_URL=http://localhost:5173 PROFILE=smoke k6 run loadtest/k6-browse.js
 *
 * Variables de entorno:
 *   BASE_URL  - obligatorio en la práctica (por defecto localhost:5173)
 *   PROFILE   - smoke | load25 | load50 | load100 | stress250 | stress500
 *               | prod50 | prod100 | prod250 | prod500 | prod1000 | prod2000
 *               (por defecto: smoke)
 *   VUS/DURATION - si se definen, ignoran PROFILE y corren un único
 *               escalón fijo (útil para pruebas puntuales rápidas).
 *   PROTECTION_BYPASS - opcional. Secreto de "Protection Bypass for
 *               Automation" de Vercel, necesario únicamente para poder
 *               llegar a un Preview Deployment (que por defecto exige
 *               login de Vercel). No se usa nunca contra producción,
 *               donde el dominio propio ya no tiene esa protección.
 *
 * No hay secretos ni credenciales en este archivo: todo lo que se prueba
 * acá es contenido público, sin autenticación. PROTECTION_BYPASS se lee
 * de una variable de entorno en el momento de correr la prueba, nunca
 * queda escrito acá.
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { CATEGORIAS, PRODUCT_IDS, elegirAlAzar } from './data.js';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
const PROTECTION_BYPASS = __ENV.PROTECTION_BYPASS || '';

/*
 * Modo caché fría (COLD_CACHE=true): agrega un query string único a cada
 * petición para forzar una clave de caché nueva en el edge de Vercel, sin
 * tocar ninguna ruta ni parámetro que la aplicación realmente use.
 *
 * Verificado a mano antes de usarlo en la prueba: ningún +page.server.ts
 * del sitio lee otro query param aparte de "categoria" en /products, así
 * que agregar "ref=..." es inerte para la app — no cambia contenido, no
 * genera errores — pero sí cambia la URL completa (path+query), que es
 * lo que Vercel usa como clave de caché (confirmado con curl: la misma
 * URL con un "ref" nuevo da MISS la primera vez y HIT si se repite).
 */
const CACHE_FRIA = (__ENV.COLD_CACHE || '').toLowerCase() === 'true';

function agregarParametroFrio(url) {
	if (!CACHE_FRIA) return url;
	const separador = url.includes('?') ? '&' : '?';
	const token = `loadtest-cold-${__VU}-${__ITER}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
	return `${url}${separador}ref=${token}`;
}

// Contador propio, aparte de los http_req_failed automáticos de k6, para
// dejar bien visible en el resumen si por error algo tocó una ruta que
// no debería (ver checkNuncaRutasProhibidas). Si esto marca más de 0,
// algo en el script está mal, no es una métrica de rendimiento del sitio.
const solicitudesARutasProhibidas = new Counter('solicitudes_a_rutas_prohibidas');

// Desglose de códigos de estado y de X-Vercel-Cache, para el reporte de
// cada escalón (Fase 3/6 del informe de carga).
const httpEstado2xx = new Counter('http_estado_2xx');
const httpEstado3xx = new Counter('http_estado_3xx');
const httpEstado4xx = new Counter('http_estado_4xx');
const httpEstado5xx = new Counter('http_estado_5xx');
const httpEstado429 = new Counter('http_estado_429');
const cacheHit = new Counter('vercel_cache_hit');
const cacheMiss = new Counter('vercel_cache_miss');
const cacheStale = new Counter('vercel_cache_stale');
const cacheOtro = new Counter('vercel_cache_otro');

// Mismo desglose de caché, pero separado por grupo/ruta, para poder ver
// exactamente cuáles páginas provocan los MISS (pedido explícito antes
// del escalón de 100 VUs). Cada nombre de grupo del escenario (más abajo)
// se traduce a una etiqueta corta para el reporte.
const GRUPO_A_ETIQUETA_CACHE = {
	home: 'home',
	listado_productos: 'products',
	categoria: 'categoria',
	producto: 'producto',
	categorias_listado: 'categorias',
	checkout_shell: 'checkout'
};

const cachePorGrupo = {};
for (const etiqueta of Object.values(GRUPO_A_ETIQUETA_CACHE)) {
	cachePorGrupo[etiqueta] = {
		hit: new Counter(`vercel_cache_hit_${etiqueta}`),
		miss: new Counter(`vercel_cache_miss_${etiqueta}`),
		stale: new Counter(`vercel_cache_stale_${etiqueta}`),
		otro: new Counter(`vercel_cache_otro_${etiqueta}`)
	};
}

/*
 * Desglose de tiempos "desde el cliente" que k6 ya mide para cada
 * petición (res.timings), pero que el resumen compacto de k6 v2.2 no
 * imprime por defecto — se exponen acá como Trends explícitos.
 *
 *  - blocked: incluye la resolución DNS (k6 no expone un campo "DNS"
 *    puro y separado; "blocked" es lo más cercano que ofrece la API).
 *  - connecting / tls_handshaking: TCP y TLS por separado.
 *  - waiting: tiempo hasta el primer byte de respuesta (TTFB).
 *  - receiving: descarga del cuerpo de la respuesta.
 *  - duration: tiempo total de la petición (igual que http_req_duration).
 *
 * Son globales (no por ruta) porque así se pidió explícitamente.
 */
const tiempoDnsBloqueo = new Trend('cliente_dns_bloqueo', true);
const tiempoTcp = new Trend('cliente_tcp_conexion', true);
const tiempoTls = new Trend('cliente_tls_handshake', true);
const tiempoHastaRespuesta = new Trend('cliente_ttfb_espera', true);
const tiempoDescarga = new Trend('cliente_descarga', true);
const tiempoTotalCliente = new Trend('cliente_tiempo_total', true);

const RUTAS_PROHIBIDAS = [
	'/api/enviar-pedido',
	'/api/enviar-cupon',
	'/admin',
	'/account',
	'/checkout' // el shell de /checkout SÍ se visita (ver abajo), pero solo con GET; nunca se envía el formulario.
];

/* ------------------------- Perfiles de carga ------------------------- */

const PERFILES = {
	// Fase 4A — Smoke test: confirma que el script funciona y que las
	// URLs responden antes de aumentar la carga.
	smoke: [{ duration: '30s', target: 5 }],

	// Fase 4B — Load test local.
	load25: [
		{ duration: '30s', target: 25 },
		{ duration: '1m', target: 25 },
		{ duration: '15s', target: 0 }
	],
	load50: [
		{ duration: '30s', target: 50 },
		{ duration: '1m', target: 50 },
		{ duration: '15s', target: 0 }
	],
	load100: [
		{ duration: '30s', target: 100 },
		{ duration: '1m30s', target: 100 },
		{ duration: '20s', target: 0 }
	],

	// Fase 4C — Stress test local: buscar el punto de quiebre, no
	// simular tráfico realista.
	stress250: [
		{ duration: '1m', target: 250 },
		{ duration: '2m', target: 250 },
		{ duration: '30s', target: 0 }
	],
	stress500: [
		{ duration: '1m30s', target: 500 },
		{ duration: '2m', target: 500 },
		{ duration: '30s', target: 0 }
	],

	// Fase 7 — Producción, un escalón a la vez. Rampa progresiva, nunca
	// un salto abrupto. Cada uno se ejecuta por separado y solo con
	// autorización explícita — ver README.md antes de usar cualquiera
	// de estos contra moonbeautyval.com.
	prod50: [
		{ duration: '2m', target: 50 },
		{ duration: '3m', target: 50 },
		{ duration: '1m', target: 0 }
	],
	prod100: [
		{ duration: '2m', target: 100 },
		{ duration: '3m', target: 100 },
		{ duration: '1m', target: 0 }
	],
	prod250: [
		{ duration: '3m', target: 250 },
		{ duration: '4m', target: 250 },
		{ duration: '1m', target: 0 }
	],
	prod500: [
		{ duration: '3m', target: 500 },
		{ duration: '5m', target: 500 },
		{ duration: '1m', target: 0 }
	],
	prod1000: [
		{ duration: '4m', target: 1000 },
		{ duration: '5m', target: 1000 },
		{ duration: '2m', target: 0 }
	],
	prod2000: [
		{ duration: '5m', target: 2000 },
		{ duration: '5m', target: 2000 },
		{ duration: '2m', target: 0 }
	]
};

const perfilElegido = __ENV.PROFILE || 'smoke';

function construirOpciones() {
	// VUS/DURATION sueltos, para una prueba puntual sin usar un perfil.
	if (__ENV.VUS && __ENV.DURATION) {
		return {
			vus: Number(__ENV.VUS),
			duration: __ENV.DURATION,
			thresholds: umbralesPorDefecto()
		};
	}

	const stages = PERFILES[perfilElegido];
	if (!stages) {
		throw new Error(
			`PROFILE "${perfilElegido}" no existe. Opciones: ${Object.keys(PERFILES).join(', ')}`
		);
	}

	const esProduccion = perfilElegido.startsWith('prod');

	return {
		stages,
		thresholds: esProduccion ? umbralesProduccionConParada() : umbralesPorDefecto(),
		// p50 (mediana), p90, p95, p99 y máximo explícitos en el resumen
		// final, tal como los pide el informe de cada escalón.
		summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
		// En producción, si un threshold con abortOnFail se rompe, k6
		// corta la corrida entera de inmediato — no espera a que termine
		// la rampa. Ver Fase 6/7 del informe para la justificación de
		// cada valor.
		...(esProduccion ? { noConnectionReuse: false } : {})
	};
}

/* ---------------------------- Umbrales ---------------------------- */

function umbralesPorDefecto() {
	return {
		http_req_failed: ['rate<0.01'],
		'http_req_duration{group:::home}': ['p(95)<1500', 'p(99)<2500'],
		'http_req_duration{group:::listado_productos}': ['p(95)<1500', 'p(99)<2500'],
		'http_req_duration{group:::categoria}': ['p(95)<1500', 'p(99)<2500'],
		'http_req_duration{group:::producto}': ['p(95)<1200', 'p(99)<2000'],
		'http_req_duration{group:::categorias_listado}': ['p(95)<1200', 'p(99)<2000'],
		'http_req_duration{group:::paginas_estaticas}': ['p(95)<800', 'p(99)<1500'],
		'http_req_duration{group:::checkout_shell}': ['p(95)<1500', 'p(99)<2500'],
		solicitudes_a_rutas_prohibidas: ['count==0']
	};
}

function umbralesProduccionConParada() {
	// Los mismos umbrales de arriba, pero con abortOnFail: si se rompen,
	// la prueba contra producción se detiene sola en vez de seguir
	// mandando tráfico a un sitio que ya está degradado.
	const base = umbralesPorDefecto();
	const conParada = {};

	for (const [metrica, reglas] of Object.entries(base)) {
		conParada[metrica] = reglas.map((regla) => ({
			threshold: regla,
			abortOnFail: true,
			delayAbortEval: '10s'
		}));
	}

	// Umbral global adicional, específico del criterio de parada de
	// producción: más de 5% de error corta la prueba inmediatamente.
	conParada.http_req_failed = [
		{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '10s' }
	];

	return conParada;
}

export const options = construirOpciones();

/* ---------------------------- Escenario ---------------------------- */

function pausaRealista() {
	// 1 a 4 segundos: tiempo de "leer la pantalla" entre pasos, para no
	// mandar todo el tráfico como una ráfaga instantánea sin sentido.
	sleep(1 + Math.random() * 3);
}

function get(url, tags) {
	// k6 no envía Accept-Encoding por defecto (confirmado en la sesión de
	// diagnóstico: un navegador real sí lo hace). Sin este header, Vercel
	// sirve las páginas sin comprimir — varias veces más pesadas de lo que
	// cualquier usuario real recibiría. Se agrega explícitamente para que
	// esta prueba negocie compresión como lo haría un navegador.
	const params = { tags, headers: { 'Accept-Encoding': 'gzip, br' } };
	if (PROTECTION_BYPASS) {
		// Solo necesario para pasar la protección de Vercel (login SSO) en
		// un Preview Deployment. En producción el dominio propio no tiene
		// esta protección, así que esto no se usaría ahí.
		params.headers['x-vercel-protection-bypass'] = PROTECTION_BYPASS;
	}

	const urlFinal = agregarParametroFrio(url);
	const res = http.get(`${BASE_URL}${urlFinal}`, params);

	tiempoDnsBloqueo.add(res.timings.blocked);
	tiempoTcp.add(res.timings.connecting);
	tiempoTls.add(res.timings.tls_handshaking);
	tiempoHastaRespuesta.add(res.timings.waiting);
	tiempoDescarga.add(res.timings.receiving);
	tiempoTotalCliente.add(res.timings.duration);

	if (RUTAS_PROHIBIDAS.some((ruta) => url.startsWith(ruta)) && res.request.method !== 'GET') {
		solicitudesARutasProhibidas.add(1);
	}

	if (res.status === 429) {
		httpEstado429.add(1);
	} else if (res.status >= 500) {
		httpEstado5xx.add(1);
	} else if (res.status >= 400) {
		httpEstado4xx.add(1);
	} else if (res.status >= 300) {
		httpEstado3xx.add(1);
	} else if (res.status >= 200) {
		httpEstado2xx.add(1);
	}

	const cacheHeader = (res.headers['X-Vercel-Cache'] || '').toUpperCase();
	if (cacheHeader === 'HIT') {
		cacheHit.add(1);
	} else if (cacheHeader === 'MISS') {
		cacheMiss.add(1);
	} else if (cacheHeader === 'STALE') {
		cacheStale.add(1);
	} else if (cacheHeader) {
		cacheOtro.add(1);
	}

	// Mismo desglose, pero por grupo/ruta (ver GRUPO_A_ETIQUETA_CACHE).
	const etiquetaCache = tags && GRUPO_A_ETIQUETA_CACHE[tags.name];
	if (etiquetaCache) {
		const contadores = cachePorGrupo[etiquetaCache];
		if (cacheHeader === 'HIT') {
			contadores.hit.add(1);
		} else if (cacheHeader === 'MISS') {
			contadores.miss.add(1);
		} else if (cacheHeader === 'STALE') {
			contadores.stale.add(1);
		} else if (cacheHeader) {
			contadores.otro.add(1);
		}
	}

	check(res, {
		'status es 200': (r) => r.status === 200,
		'no es 5xx': (r) => r.status < 500,
		'respuesta no vacía': (r) => r.body && r.body.length > 0
	});

	return res;
}

export default function () {
	// 1) Todo el mundo entra por el home.
	group('home', () => {
		get('/', { name: 'home' });
	});
	pausaRealista();

	// 2) La mayoría navega el catálogo completo.
	if (Math.random() < 0.7) {
		group('listado_productos', () => {
			get('/products', { name: 'listado_productos' });
		});
		pausaRealista();
	}

	// 3) Una parte filtra por categoría.
	if (Math.random() < 0.45) {
		const categoria = elegirAlAzar(CATEGORIAS);
		group('categoria', () => {
			get(`/products?categoria=${encodeURIComponent(categoria)}`, { name: 'categoria' });
		});
		pausaRealista();
	}

	// 4) Muchos abren uno o dos productos puntuales.
	const productosAAbrir = Math.random() < 0.6 ? (Math.random() < 0.4 ? 2 : 1) : 0;
	for (let i = 0; i < productosAAbrir; i++) {
		const id = elegirAlAzar(PRODUCT_IDS);
		group('producto', () => {
			get(`/products/${id}`, { name: 'producto' });
		});
		pausaRealista();
	}

	// 5) Algunos exploran la vista de categorías en vez de filtrar.
	if (Math.random() < 0.2) {
		group('categorias_listado', () => {
			get('/categorias', { name: 'categorias_listado' });
		});
		pausaRealista();
	}

	// 6) Una fracción chica visita páginas informativas.
	if (Math.random() < 0.1) {
		const pagina = elegirAlAzar(['/nosotros', '/preguntas-frecuentes', '/envios']);
		group('paginas_estaticas', () => {
			get(pagina, { name: 'paginas_estaticas' });
		});
		pausaRealista();
	}

	// 7) "Agregar al carrito" y "abrir el carrito" son solo localStorage
	// en el navegador — no generan ninguna petición al servidor, así que
	// no hay nada que simular ahí (ver README.md).

	// 8) Una fracción pequeña llega hasta el checkout — solo se pide la
	// página (el shell), NUNCA se envía el formulario ni se llama a
	// /api/enviar-pedido/crear-pedido. Eso crearía un pedido real.
	if (Math.random() < 0.08) {
		group('checkout_shell', () => {
			get('/checkout', { name: 'checkout_shell' });
		});
	}
}
