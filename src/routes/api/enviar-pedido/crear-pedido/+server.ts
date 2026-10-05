import { json } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { env } from '$env/dynamic/private';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { barrerReservasVencidas } from '$lib/server/barridoReservas';
import { expirarReservaPedido, minutosReserva, reservaVencida } from '$lib/server/reservas';
import { calcularPuntos } from '$lib/puntosMoon';
import type { RequestHandler } from './$types';

/**
 * Crea un pedido validando todo lo sensible en el servidor (auditoría de
 * seguridad, hallazgo A1): el navegador nunca decide precios, totales, ni
 * si un cupón es válido — sólo dice QUÉ productos y en qué cantidad, y el
 * servidor recalcula todo contra los datos reales de Firestore con el
 * Admin SDK. Antes, crearPedido() en $lib/pedidos.ts escribía el pedido
 * directo desde el cliente con el precio/total que el propio navegador
 * calculaba, así que cualquiera podía fabricar un pedido con precios
 * inventados con solo llamar a Firestore manualmente desde la consola.
 *
 * Auditoría de concurrencia: el stock se reserva aquí mismo. Leer los
 * productos del carrito, validar el stock, descontarlo, consumir los
 * cupones y crear el pedido ocurren en UNA transacción: o se aplica todo
 * o no se aplica nada. Antes el stock solo se validaba (sin reservarlo) y
 * se descontaba recién al confirmar, así que se aceptaban más pedidos
 * que unidades disponibles. El pedido queda con reservaEnCheckout: true.
 *
 * La reserva dura RESERVA_STOCK_MINUTOS (45 por defecto): si para entonces
 * el pedido sigue pendiente, se cancela solo y devuelve el stock (ver
 * $lib/server/reservas.ts).
 */

type MetodoPago = 'efectivo' | 'pago_movil' | 'binance' | 'zelle' | 'zinli';

type ContactoPedido = {
	nombre: string;
	correo: string;
	telefono: string;
};

type EntregaPedido = {
	direccion: string;
	casaApartamento?: string;
	ciudad: string;
	codigoPostal?: string;
	estado: string;
	ubicacionMapa?: { lat: number; lng: number } | null;
};

type EnvioNacionalPedido = {
	empresa: 'mrw' | 'zoom' | 'tealca';
	nombreCompleto: string;
	documento: string;
	telefono: string;
	agencia: {
		calle: string;
		avenida: string;
		parroquia: string;
		ciudad: string;
		estado: string;
	};
};

type ComprobantePago = {
	url?: string | null;
	referencia?: string | null;
};

type ItemSolicitado = {
	id: string;
	cantidad: number;
};

type SolicitudPedido = {
	contacto: ContactoPedido;
	tipoEntrega: 'delivery' | 'entrega_naguanagua' | 'envio_nacional';
	entrega: EntregaPedido;
	envioNacional?: EnvioNacionalPedido | null;
	metodoPago: MetodoPago;
	comprobantePago?: ComprobantePago;
	items: ItemSolicitado[];
	codigosCupones?: string[];
	/** Id del intento de compra, para que un reintento no duplique el pedido. */
	checkoutId?: string;
};

const MAXIMO_CUPONES = 2;

/** Error que se le muestra tal cual al comprador, con su código HTTP. */
class ErrorPedido extends Error {
	constructor(
		mensaje: string,
		readonly estado: number
	) {
		super(mensaje);
	}
}

function normalizarCodigoCupon(codigo: string): string {
	return codigo.trim().toUpperCase().replace(/\s+/g, '');
}

async function obtenerTasaBCV(): Promise<number> {
	const respuesta = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
		headers: { accept: 'application/json' }
	});

	if (!respuesta.ok) {
		throw new Error(`DolarApi respondió con el código ${respuesta.status}`);
	}

	const datos = (await respuesta.json()) as { promedio?: number };
	const tasa = Number(datos.promedio);

	if (!Number.isFinite(tasa) || tasa <= 0) {
		throw new Error('No se pudo obtener la tasa BCV.');
	}

	return tasa;
}

async function verificarUsuario(
	request: Request
): Promise<{ uid: string; anonimo: boolean } | null> {
	const encabezado = request.headers.get('authorization') ?? '';
	if (!encabezado.startsWith('Bearer ')) return null;

	const token = encabezado.slice('Bearer '.length).trim();
	if (!token) return null;

	try {
		const decodificado = await adminAuth.verifyIdToken(token);
		return {
			uid: decodificado.uid,
			anonimo: decodificado.firebase?.sign_in_provider === 'anonymous'
		};
	} catch (err) {
		console.error('Token inválido al crear pedido:', err);
		return null;
	}
}

/**
 * El checkoutId lo genera el navegador una vez por intento de compra y lo
 * reutiliza si reintenta. Se valida el formato y nunca se usa tal cual:
 * el id del pedido sale de un hash de (uid + checkoutId), así que el
 * mismo checkoutId de otra cuenta da otro pedido y nadie puede elegir ni
 * adivinar el id de un pedido ajeno.
 */
const FORMATO_CHECKOUT_ID = /^[A-Za-z0-9_-]{16,80}$/;
const MAXIMO_LINEAS = 50;

function idPedidoIdempotente(uid: string, checkoutId: string): string {
	return 'ck_' + createHash('sha256').update(`${uid}:${checkoutId}`).digest('hex').slice(0, 40);
}

type ResultadoTransaccion =
	| { repetido: true; datos: FirebaseFirestore.DocumentData }
	| { repetido: false; numeroPedido: string; totalUSD: number; totalVES: number };

export const POST: RequestHandler = async ({ request }) => {
	const sesion = await verificarUsuario(request);

	if (!sesion) {
		return json({ ok: false, error: 'No autorizado.' }, { status: 401 });
	}

	const { uid } = sesion;

	const solicitud = (await request.json()) as SolicitudPedido;

	if (!Array.isArray(solicitud.items) || solicitud.items.length === 0) {
		return json({ ok: false, error: 'El carrito está vacío.' }, { status: 400 });
	}

	if (!solicitud.contacto?.nombre?.trim()) {
		return json({ ok: false, error: 'Falta el nombre del comprador.' }, { status: 400 });
	}

	const metodosValidos: MetodoPago[] = ['efectivo', 'pago_movil', 'binance', 'zelle', 'zinli'];
	if (!metodosValidos.includes(solicitud.metodoPago)) {
		return json({ ok: false, error: 'Método de pago no válido.' }, { status: 400 });
	}

	// Se acumulan por id: si el navegador manda la misma línea repetida,
	// cuenta como una sola cantidad total, no como pedidos duplicados.
	const cantidadPorId = new Map<string, number>();
	for (const item of solicitud.items) {
		const id = String(item?.id ?? '').trim();
		const cantidad = Math.floor(Number(item?.cantidad ?? 0));
		if (!id || id.includes('/') || !Number.isFinite(cantidad) || cantidad <= 0) {
			return json({ ok: false, error: 'Hay un producto con cantidad inválida.' }, { status: 400 });
		}
		cantidadPorId.set(id, (cantidadPorId.get(id) ?? 0) + cantidad);
	}

	if (cantidadPorId.size > MAXIMO_LINEAS) {
		return json({ ok: false, error: 'El carrito tiene demasiados productos distintos.' }, { status: 400 });
	}

	const codigosPedidos = [
		...new Set(
			(solicitud.codigosCupones ?? [])
				.map((codigo) => normalizarCodigoCupon(String(codigo ?? '')))
				.filter((codigo) => codigo && !codigo.includes('/'))
		)
	].slice(0, MAXIMO_CUPONES);

	// Idempotencia: con checkoutId el pedido tiene un id fijo para esta
	// cuenta y este intento de compra. Sin checkoutId (una pestaña con el
	// código anterior) se crea con un id nuevo, como antes.
	const checkoutId = solicitud.checkoutId === undefined ? null : String(solicitud.checkoutId);
	if (checkoutId !== null && !FORMATO_CHECKOUT_ID.test(checkoutId)) {
		return json({ ok: false, error: 'Identificador de compra inválido.' }, { status: 400 });
	}

	const refPedido = checkoutId
		? adminDb.collection('pedidos').doc(idPedidoIdempotente(uid, checkoutId))
		: adminDb.collection('pedidos').doc();

	const respuestaRepetida = (datos: FirebaseFirestore.DocumentData) => {
		// Un reintento nunca reactiva un pedido que ya no está vigente: se
		// avisa con un código para que el checkout empiece un intento nuevo
		// (otro checkoutId) si la clienta quiere comprar otra vez.
		const vencido = datos.motivoCancelacion === 'reserva_expirada' || reservaVencida(datos);
		if (vencido || datos.estado === 'cancelado') {
			const numero = String(datos.numeroPedido ?? '');
			return json(
				{
					ok: false,
					codigo: vencido ? 'reserva_expirada' : 'pedido_cancelado',
					id: refPedido.id,
					numeroPedido: numero,
					error: vencido
						? `La reserva de tu pedido ${numero} venció y los productos se liberaron. Vuelve a confirmar para hacer un pedido nuevo.`
						: `El pedido ${numero} fue cancelado. Vuelve a confirmar para hacer un pedido nuevo.`
				},
				{ status: 409 }
			);
		}
		return json({
			ok: true,
			id: refPedido.id,
			numeroPedido: String(datos.numeroPedido ?? ''),
			totalUSD: Number(datos.totalUSD ?? 0),
			totalVES: Number(datos.totalVES ?? 0),
			tasaBCV: Number(datos.tasaBCV ?? 0),
			repetido: true
		});
	};

	// Atajo para un reintento de un pedido que ya se creó: responde lo
	// mismo sin volver a consultar la tasa (que podría estar caída). La
	// comprobación que de verdad cuenta es la de dentro de la transacción.
	if (checkoutId) {
		const existente = await refPedido.get();
		if (existente.exists) {
			if (existente.data()?.usuarioId !== uid) {
				return json({ ok: false, error: 'Identificador de compra inválido.' }, { status: 409 });
			}
			// Si su reserva venció y todavía no la procesó ningún barrido,
			// se vence ahora mismo, así el stock se libera ya.
			if (reservaVencida(existente.data()!)) {
				try {
					await expirarReservaPedido(adminDb, refPedido.id);
					const actual = await refPedido.get();
					return respuestaRepetida(actual.data() ?? existente.data()!);
				} catch (err) {
					console.error('[reservas] No se pudo vencer la reserva en un reintento:', err);
				}
			}
			return respuestaRepetida(existente.data()!);
		}
	}

	// Antes de reservar, libera las reservas que ya vencieron (como mucho
	// una vez por minuto en esta instancia; nunca falla el pedido).
	await barrerReservasVencidas();
	const minutosDeReserva = minutosReserva(env.RESERVA_STOCK_MINUTOS);

	// La tasa se consulta antes de la transacción: una llamada de red
	// dentro de ella se repetiría en cada reintento por contención.
	let tasaBCV: number;
	try {
		tasaBCV = await obtenerTasaBCV();
	} catch (err) {
		console.error('Error obteniendo la tasa BCV al crear el pedido:', err);
		return json(
			{ ok: false, error: 'No se pudo consultar la tasa del dólar. Intenta de nuevo.' },
			{ status: 502 }
		);
	}

	const idsProductos = [...cantidadPorId.keys()];
	const refsProductos = idsProductos.map((id) => adminDb.collection('productos').doc(id));
	const refsCupones = codigosPedidos.map((codigo) => adminDb.collection('cupones').doc(codigo));

	let resultado: ResultadoTransaccion;

	try {
		// Una sola transacción para todo lo que puede chocar con otra compra
		// simultánea: leer el stock de los productos del carrito, validarlo,
		// descontarlo, consumir los cupones y crear el pedido. Se aplica
		// completa o no se aplica nada; si otra compra cambió el stock o un
		// cupón entre medio, Firestore la reintenta con los datos nuevos.
		resultado = await adminDb.runTransaction(async (transaccion): Promise<ResultadoTransaccion> => {
			// Firestore exige hacer todas las lecturas antes de cualquier
			// escritura: el pedido (idempotencia), los productos del carrito
			// (no todo el catálogo) y los cupones, en una sola ida.
			const [snapPedido, ...snaps] = await transaccion.getAll(refPedido, ...refsProductos, ...refsCupones);
			const snapsProductos = snaps.slice(0, refsProductos.length);
			const snapsCupones = snaps.slice(refsProductos.length);

			if (snapPedido.exists) {
				if (snapPedido.data()?.usuarioId !== uid) {
					throw new ErrorPedido('Identificador de compra inválido.', 409);
				}
				return { repetido: true, datos: snapPedido.data()! };
			}

			/* --------------------- Productos y stock --------------------- */

			const itemsFinales: Array<{
				id: string;
				nombre: string;
				tipo: string;
				imagen: string;
				precioUSD: number;
				cantidad: number;
				subtotalUSD: number;
			}> = [];
			const nuevosStocks: Array<{ ref: FirebaseFirestore.DocumentReference; stock: number }> = [];
			let subtotalUSD = 0;

			idsProductos.forEach((id, indice) => {
				const snap = snapsProductos[indice];
				const cantidad = cantidadPorId.get(id)!;

				if (!snap.exists) {
					throw new ErrorPedido(`Uno de los productos de tu carrito ya no está disponible (id ${id}).`, 400);
				}

				const producto = snap.data()!;
				const stock = Number(producto.stock ?? 0);

				if (!Number.isFinite(stock) || cantidad > stock) {
					throw new ErrorPedido(
						`Solo quedan ${Math.max(0, stock)} unidades de "${producto.Nombre ?? id}". Ajusta la cantidad en tu carrito.`,
						409
					);
				}

				const precioUSD = Number(producto.precio ?? 0);
				const subtotalLinea = Math.round(precioUSD * cantidad * 100) / 100;
				subtotalUSD += subtotalLinea;

				itemsFinales.push({
					id,
					nombre: String(producto.Nombre ?? ''),
					tipo: String(producto.Tipo ?? ''),
					imagen: String(producto.imagen ?? ''),
					precioUSD,
					cantidad,
					subtotalUSD: subtotalLinea
				});
				nuevosStocks.push({ ref: snap.ref, stock: stock - cantidad });
			});

			subtotalUSD = Math.round(subtotalUSD * 100) / 100;

			/* -------------------------- Cupones -------------------------- */

			// Se validan con los datos leídos en esta misma transacción: el
			// uso del cupón se cuenta junto con el pedido, nunca uno sin el
			// otro.
			const cupones = codigosPedidos.map((codigo, indice) => {
				const snap = snapsCupones[indice];
				if (!snap.exists) throw new ErrorPedido(`El cupón "${codigo}" no existe.`, 400);

				const datos = snap.data()!;
				if (!datos.activo) throw new ErrorPedido(`El cupón "${codigo}" ya no está disponible.`, 400);

				const vencimiento = datos.fechaVencimiento;
				const vencimientoMs =
					vencimiento && typeof vencimiento.toMillis === 'function' ? vencimiento.toMillis() : null;
				if (vencimientoMs && Date.now() > vencimientoMs) {
					throw new ErrorPedido(`El cupón "${codigo}" ya venció.`, 400);
				}

				const limiteUsos =
					datos.limiteUsos === null || datos.limiteUsos === undefined ? null : Number(datos.limiteUsos);
				if (limiteUsos !== null && Number(datos.usos ?? 0) >= limiteUsos) {
					throw new ErrorPedido(`El cupón "${codigo}" ya alcanzó su límite de usos.`, 409);
				}

				// Los cupones canjeados con puntos Moon Beauty son personales:
				// solo los puede usar la cuenta que los canjeó.
				if (datos.usuarioId && datos.usuarioId !== uid) {
					throw new ErrorPedido(`El cupón "${codigo}" es personal y pertenece a otra cuenta.`, 400);
				}

				const metodosPago = Array.isArray(datos.metodosPago) ? datos.metodosPago : [];
				if (!metodosPago.includes(solicitud.metodoPago)) {
					throw new ErrorPedido(`El cupón "${codigo}" no aplica para el método de pago elegido.`, 400);
				}

				return {
					ref: snap.ref,
					codigo,
					tipo: datos.tipo === 'monto' ? 'monto' : 'porcentaje',
					valor: Number(datos.valor ?? 0),
					combinable: Boolean(datos.combinable ?? false)
				};
			});

			if (cupones.length === 2 && !cupones[0].combinable && !cupones[1].combinable) {
				throw new ErrorPedido(
					`Los cupones "${cupones[0].codigo}" y "${cupones[1].codigo}" no se pueden combinar.`,
					400
				);
			}

			const descuentoUSD = Math.round(
				Math.min(
					cupones.reduce((suma, cupon) => {
						const descuentoCupon =
							cupon.tipo === 'porcentaje' ? subtotalUSD * (cupon.valor / 100) : cupon.valor;
						return suma + Math.max(0, Math.min(descuentoCupon, subtotalUSD));
					}, 0),
					subtotalUSD
				) * 100
			) / 100;

			const totalUSD = Math.round((subtotalUSD - descuentoUSD) * 100) / 100;
			const totalVES = Math.round(totalUSD * tasaBCV * 100) / 100;

			// Puntos Moon Beauty que da esta compra, calculados con el total
			// real. Se suman al saldo cuando el pedido se confirma (ver
			// actualizarEstadoPedido). Las compras como invitado no acumulan.
			const puntosMoon = sesion.anonimo ? 0 : calcularPuntos(totalUSD);

			const fecha = new Date().toISOString().slice(0, 10).replaceAll('-', '');
			const codigoPedido = crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
			const numeroPedido = `MB-${fecha}-${codigoPedido}`;

			/* ------------------------- Escrituras ------------------------- */

			for (const { ref, stock } of nuevosStocks) {
				transaccion.update(ref, { stock });
			}

			for (const cupon of cupones) {
				transaccion.update(cupon.ref, { usos: FieldValue.increment(1) });
			}

			// create (no set): si otra solicitud con el mismo checkoutId ganó
			// la carrera, esta falla y al reintentarse ve el pedido existente.
			transaccion.create(refPedido, {
				numeroPedido,
				usuarioId: uid,
				checkoutId,
				contacto: {
					nombre: solicitud.contacto.nombre.trim(),
					correo: solicitud.contacto.correo?.trim() ?? '',
					telefono: solicitud.contacto.telefono?.trim() ?? ''
				},
				tipoEntrega: solicitud.tipoEntrega,
				entrega: solicitud.entrega,
				envioNacional: solicitud.envioNacional ?? null,
				metodoPago: solicitud.metodoPago,
				comprobantePago: {
					url: solicitud.comprobantePago?.url ?? null,
					referencia: solicitud.comprobantePago?.referencia ?? null
				},
				items: itemsFinales,
				subtotalUSD,
				cupon: cupones.length > 0 ? cupones.map((c) => c.codigo).join(' + ') : null,
				// Para devolver el uso de los cupones si la reserva vence.
				cuponesCodigos: cupones.map((c) => c.codigo),
				descuentoUSD,
				totalUSD,
				tasaBCV,
				totalVES,
				estado: 'pendiente_contacto',
				// El stock de este pedido ya está apartado desde ahora (ver
				// actualizarEstadoPedido para confirmar/cancelar).
				reservaEnCheckout: true,
				stockDescontado: true,
				stockDevuelto: false,
				// Hasta cuándo se aparta el stock si nadie confirma el pedido
				// (reloj del servidor; el navegador no lo puede cambiar).
				reservaExpiraEn: Timestamp.fromMillis(Date.now() + minutosDeReserva * 60_000),
				puntosMoon,
				puntosOtorgados: false,
				fechaCreacion: FieldValue.serverTimestamp()
			});

			return { repetido: false, numeroPedido, totalUSD, totalVES };
		});
	} catch (err) {
		if (err instanceof ErrorPedido) {
			return json({ ok: false, error: err.message }, { status: err.estado });
		}
		throw err;
	}

	if (resultado.repetido) {
		return respuestaRepetida(resultado.datos);
	}

	return json({
		ok: true,
		id: refPedido.id,
		numeroPedido: resultado.numeroPedido,
		totalUSD: resultado.totalUSD,
		totalVES: resultado.totalVES,
		tasaBCV
	});
};
