import {
	collection,
	deleteField,
	doc,
	increment,
	onSnapshot,
	orderBy,
	query,
	runTransaction,
	serverTimestamp,
	where
} from 'firebase/firestore';

import {
	getDownloadURL,
	ref,
	uploadBytes
} from 'firebase/storage';

import { db, storage, obtenerAuth } from '$lib/firebase';
import { calcularPuntos } from '$lib/puntosMoon';

export type MetodoPago =
	| 'efectivo'
	| 'pago_movil'
	| 'binance'
	| 'zelle'
	| 'zinli';

export type ContactoPedido = {
	nombre: string;
	correo: string;
	telefono: string;
};

export type EntregaPedido = {
	direccion: string;
	casaApartamento?: string;
	ciudad: string;
	codigoPostal?: string;
	estado: string;
	ubicacionMapa?: {
		lat: number;
		lng: number;
	} | null;
};

/**
 * Cómo recibe el pedido el comprador:
 * - delivery: a domicilio en Valencia, monto coordinado por WhatsApp.
 * - entrega_naguanagua: a domicilio en Naguanagua, sin costo adicional.
 * - envio_nacional: por encomienda, cobro a destino.
 */
export type TipoEntrega = 'delivery' | 'entrega_naguanagua' | 'envio_nacional';

export type EmpresaEnvio = 'mrw' | 'zoom' | 'tealca';

/**
 * Datos para enviar por empresa de encomienda. El flete lo paga quien
 * recibe al retirar en la agencia ("cobro a destino"), así que acá solo
 * se guarda a quién y a qué agencia va.
 */
export type EnvioNacionalPedido = {
	empresa: EmpresaEnvio;
	nombreCompleto: string;
	/** Cédula o RIF: las agencias lo exigen para entregar. */
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

export type ComprobantePago = {
	url?: string | null;
	referencia?: string | null;
};

export type ItemPedido = {
	id: string | number;
	nombre: string;
	tipo: string;
	imagen: string;
	precioUSD: number;
	cantidad: number;
	subtotalUSD: number;
};

export type EstadoPedido =
	| 'pendiente_contacto'
	| 'confirmado'
	| 'enviado'
	| 'entregado'
	| 'cancelado';

/** Un pedido tal como lo lee el panel de administración. */
export type PedidoAdmin = {
	id: string;
	numeroPedido: string;
	usuarioId: string;
	usuarioCorreo: string | null;
	contacto: ContactoPedido;
	entrega: EntregaPedido;
	metodoPago: MetodoPago;
	comprobantePago: ComprobantePago;
	items: ItemPedido[];
	subtotalUSD: number;
	cupon: string | null;
	descuentoUSD: number;
	totalUSD: number;
	tasaBCV: number;
	totalVES: number;
	estado: EstadoPedido;
	/** Milisegundos desde epoch, 0 si el pedido no trae fecha. */
	fechaCreacion: number;
	/** Puntos Moon Beauty que da el pedido (0 en compras como invitado). */
	puntosMoon: number;
	/** Si esos puntos ya se sumaron al saldo de la clienta. */
	puntosOtorgados: boolean;
	/** "reserva_expirada" si se canceló solo porque nadie lo confirmó a tiempo. */
	motivoCancelacion: string | null;
};

/**
 * Lo único que el navegador decide de cada línea del carrito es cuál
 * producto y cuántas unidades. El precio, el subtotal y el total los
 * calcula el servidor con los datos reales de productos.ts (ver
 * hallazgo A1 de la auditoría de seguridad) — mandarlos desde acá ya no
 * tendría ningún efecto, el endpoint los ignora.
 */
export type ItemCarritoInput = {
	id: string | number;
	cantidad: number;
};

export type CrearPedidoInput = {
	contacto: ContactoPedido;
	tipoEntrega: TipoEntrega;
	entrega: EntregaPedido;
	envioNacional?: EnvioNacionalPedido | null;
	metodoPago: MetodoPago;
	comprobantePago: ComprobantePago;
	items: ItemCarritoInput[];
	/** Códigos de cupón tal como los escribió el comprador; el servidor
	 * los valida y calcula el descuento, no se manda ya calculado. */
	codigosCupones?: string[];
	/**
	 * Id de este intento de compra. Se genera una vez y se reutiliza si se
	 * reintenta: el servidor lo usa para no crear dos pedidos ni descontar
	 * el stock dos veces (doble clic, reintento tras un corte de red).
	 */
	checkoutId?: string;
};

/**
 * Sube el comprobante de pago (imagen o PDF) a Storage y devuelve su URL.
 *
 * Se guarda el uid de quien sube el archivo como metadata: las reglas de
 * Storage lo usan para que solo esa persona (o un admin) pueda leerlo
 * después, en vez de dejarlo abierto a cualquier usuario autenticado.
 * Quien llama a esta función ya debe haber llamado a asegurarSesion().
 */
export async function subirComprobantePago(archivo: File): Promise<string> {
	const auth = await obtenerAuth();
	const uid = auth.currentUser?.uid;

	if (!uid) {
		throw new Error('No hay una sesión activa para subir el comprobante.');
	}

	const nombreUnico = `${crypto.randomUUID()}-${archivo.name}`;
	const referencia = ref(storage, `comprobantes/${nombreUnico}`);

	await uploadBytes(referencia, archivo, { customMetadata: { uid } });

	return getDownloadURL(referencia);
}

/**
 * Compra como invitado: no requiere que el usuario tenga una cuenta.
 * Iniciamos sesión anónima por detrás (si no hay sesión ya) para que el
 * pedido siempre tenga un usuarioId válido con el que las reglas de
 * Firestore puedan verificar la escritura, sin obligar a crear cuenta.
 */
export async function asegurarSesion() {
	const auth = await obtenerAuth();

	if (auth.currentUser) {
		return auth.currentUser;
	}

	const { signInAnonymously } = await import('firebase/auth');
	const resultado = await signInAnonymously(auth);
	return resultado.user;
}

/**
 * Crea el pedido llamando al endpoint del servidor, que es quien de
 * verdad calcula precios, descuentos y total (ver hallazgo A1 de la
 * auditoría de seguridad). Antes esta función escribía el pedido directo
 * a Firestore con los números que traía "input", así que cualquiera
 * podía fabricar un pedido con precios inventados llamando a Firestore
 * manualmente desde el navegador.
 */
/**
 * Error al crear un pedido. "codigo" vale "reserva_expirada" o
 * "pedido_cancelado" cuando el intento de compra apunta a un pedido que
 * ya no está vigente: el checkout debe empezar un intento nuevo.
 */
export class ErrorCrearPedido extends Error {
	constructor(
		mensaje: string,
		readonly codigo: string | null
	) {
		super(mensaje);
	}
}

export async function crearPedido(
	input: CrearPedidoInput
): Promise<{
	id: string;
	numeroPedido: string;
}> {
	if (!Array.isArray(input.items) || input.items.length === 0) {
		throw new Error('El carrito está vacío.');
	}

	const usuarioActual = await asegurarSesion();
	const token = await usuarioActual.getIdToken();

	const respuesta = await fetch('/api/enviar-pedido/crear-pedido', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify(input)
	});

	const datos = await respuesta.json();

	if (!respuesta.ok || !datos.ok) {
		throw new ErrorCrearPedido(datos.error ?? 'No se pudo crear el pedido.', datos.codigo ?? null);
	}

	return {
		id: datos.id,
		numeroPedido: datos.numeroPedido
	};
}

const ESTADOS_VALIDOS: EstadoPedido[] = [
	'pendiente_contacto',
	'confirmado',
	'enviado',
	'entregado',
	'cancelado'
];

/**
 * Convierte el documento crudo de Firestore en un PedidoAdmin completo.
 *
 * Lee de forma tolerante porque hay dos formas históricas del documento:
 * la que escribe crearPedido() (items / fechaCreacion) y la del endpoint
 * api/enviar-pedido/crear-pedido (productos / fecha), que hoy no se usa
 * pero pudo haber creado pedidos antes.
 */
function normalizarPedido(id: string, datos: Record<string, unknown>): PedidoAdmin {
	const contacto = (datos.contacto ?? {}) as Partial<ContactoPedido>;
	const entrega = (datos.entrega ?? {}) as Partial<EntregaPedido>;
	const comprobante = (datos.comprobantePago ?? {}) as Partial<ComprobantePago>;

	const listaItems = Array.isArray(datos.items)
		? datos.items
		: Array.isArray(datos.productos)
			? datos.productos
			: [];

	const items = listaItems.map((item) => {
		const producto = (item ?? {}) as Partial<ItemPedido> & {
			precio?: number;
		};

		const precioUSD = Number(producto.precioUSD ?? producto.precio ?? 0);
		const cantidad = Number(producto.cantidad ?? 0);

		return {
			id: producto.id ?? '',
			nombre: String(producto.nombre ?? ''),
			tipo: String(producto.tipo ?? ''),
			imagen: String(producto.imagen ?? ''),
			precioUSD,
			cantidad,
			subtotalUSD: Number(
				producto.subtotalUSD ?? precioUSD * cantidad
			)
		} satisfies ItemPedido;
	});

	// fechaCreacion es un Timestamp de Firestore; el formato viejo guardaba
	// un Date plano en "fecha".
	const marcaTiempo = (datos.fechaCreacion ?? datos.fecha) as
		| { toMillis?: () => number; getTime?: () => number }
		| string
		| undefined;

	let fechaCreacion = 0;

	if (marcaTiempo && typeof marcaTiempo === 'object') {
		if (typeof marcaTiempo.toMillis === 'function') {
			fechaCreacion = marcaTiempo.toMillis();
		} else if (typeof marcaTiempo.getTime === 'function') {
			fechaCreacion = marcaTiempo.getTime();
		}
	} else if (typeof marcaTiempo === 'string') {
		const convertida = new Date(marcaTiempo).getTime();
		fechaCreacion = Number.isNaN(convertida) ? 0 : convertida;
	}

	const estado = String(datos.estado ?? '') as EstadoPedido;

	const subtotalUSD = Number(
		datos.subtotalUSD ??
			items.reduce((suma, item) => suma + item.subtotalUSD, 0)
	);

	return {
		id,
		numeroPedido: String(datos.numeroPedido ?? ''),
		usuarioId: String(datos.usuarioId ?? ''),
		usuarioCorreo: datos.usuarioCorreo ? String(datos.usuarioCorreo) : null,

		contacto: {
			nombre: String(contacto.nombre ?? ''),
			correo: String(contacto.correo ?? ''),
			telefono: String(contacto.telefono ?? '')
		},

		entrega: {
			direccion: String(entrega.direccion ?? ''),
			casaApartamento: String(entrega.casaApartamento ?? ''),
			ciudad: String(entrega.ciudad ?? ''),
			codigoPostal: String(entrega.codigoPostal ?? ''),
			estado: String(entrega.estado ?? ''),
			ubicacionMapa: entrega.ubicacionMapa ?? null
		},

		metodoPago: String(datos.metodoPago ?? 'efectivo') as MetodoPago,
		comprobantePago: {
			url: comprobante.url ?? null,
			referencia: comprobante.referencia ?? null
		},

		items,
		subtotalUSD,
		cupon: datos.cupon ? String(datos.cupon) : null,
		descuentoUSD: Number(datos.descuentoUSD ?? 0),
		totalUSD: Number(datos.totalUSD ?? 0),
		tasaBCV: Number(datos.tasaBCV ?? 0),
		totalVES: Number(datos.totalVES ?? 0),
		estado: ESTADOS_VALIDOS.includes(estado) ? estado : 'pendiente_contacto',
		fechaCreacion,
		puntosMoon: Number(datos.puntosMoon ?? 0),
		puntosOtorgados: Boolean(datos.puntosOtorgados),
		motivoCancelacion: datos.motivoCancelacion ? String(datos.motivoCancelacion) : null
	};
}

/**
 * Escucha en vivo todos los pedidos, del más reciente al más viejo.
 * Solo se usa desde el panel de administración.
 */
export function escucharPedidos(
	callback: (pedidos: PedidoAdmin[]) => void,
	alError?: (error: Error) => void
) {
	const referencia = query(
		collection(db, 'pedidos'),
		orderBy('fechaCreacion', 'desc')
	);

	return onSnapshot(
		referencia,
		(snapshot) => {
			callback(
				snapshot.docs.map((docSnap) =>
					normalizarPedido(docSnap.id, docSnap.data())
				)
			);
		},
		(error) => {
			console.error('Error escuchando pedidos:', error);
			alError?.(error);
		}
	);
}

/** Estados en los que el pago ya está verificado: el pedido da puntos. */
const ESTADOS_CON_PUNTOS: EstadoPedido[] = ['confirmado', 'enviado', 'entregado'];

/**
 * Cambia el estado del pedido. Todo va en una sola transacción: el estado,
 * el stock y los puntos se aplican juntos o no se aplica nada, y como la
 * transacción relee el pedido, cambiar dos veces al mismo estado (o desde
 * dos pestañas a la vez) no repite ningún efecto.
 *
 * Stock — "stockDescontado" dice si el pedido tiene ahora mismo su stock
 * apartado:
 * - Pedidos NUEVOS (reservaEnCheckout: true): el stock se reservó al
 *   crearlos. Confirmar/enviar/entregar no lo vuelve a descontar. Al
 *   cancelar se devuelve exactamente lo reservado, una sola vez
 *   (stockDescontado pasa a false y stockDevuelto a true). Si un pedido
 *   cancelado se reabre, se vuelve a reservar validando el stock.
 * - Pedidos LEGACY (creados antes de la reserva, sin reservaEnCheckout):
 *   como siempre, el stock se descuenta al pasar a "confirmado" si todavía
 *   no se había descontado, y cancelarlos no lo devuelve.
 * En ambos casos, si no alcanza el stock el cambio falla con un mensaje
 * claro y no se modifica nada. Antes se usaba Math.max(0, stock - cantidad),
 * que dejaba el stock en 0 en silencio y ocultaba ventas de más.
 *
 * Vencimiento — al pasar a cualquier estado distinto de
 * "pendiente_contacto" se borra "reservaExpiraEn", así un pedido ya
 * gestionado nunca se cancela solo (ver $lib/server/reservas.ts). Si se
 * reabre un pedido cuya reserva venció, se vuelve a reservar su stock y a
 * consumir el uso de sus cupones (que se habían liberado), validando que
 * queden usos; un pedido reabierto no vuelve a vencer.
 *
 * Puntos — al confirmarse (o pasar directo a enviado/entregado) se suman
 * una sola vez ("puntosOtorgados"); al cancelar se restan. Lo que se suma
 * nunca supera lo que corresponde al total del pedido: un "puntosMoon"
 * mayor (p. ej. en un pedido viejo escrito desde el navegador cuando las
 * reglas todavía lo permitían) no da puntos de más.
 */
export async function actualizarEstadoPedido(
	id: string,
	estado: EstadoPedido
) {
	await runTransaction(db, async (transaccion) => {
		const refPedido = doc(db, 'pedidos', id);
		const snapPedido = await transaccion.get(refPedido);

		if (!snapPedido.exists()) {
			throw new Error('El pedido ya no existe.');
		}

		const datosPedido = snapPedido.data();
		const cambios: Record<string, unknown> = { estado };

		/* ---------------------------- Qué hacer ---------------------------- */

		const reservaEnCheckout = datosPedido.reservaEnCheckout === true;
		const stockApartado = Boolean(datosPedido.stockDescontado);

		let accionStock: 'descontar' | 'devolver' | null = null;
		if (reservaEnCheckout) {
			if (estado === 'cancelado' && stockApartado) accionStock = 'devolver';
			else if (estado !== 'cancelado' && !stockApartado) accionStock = 'descontar';
		} else if (estado === 'confirmado' && !stockApartado) {
			accionStock = 'descontar';
		}

		const codigosCupones =
			accionStock === 'descontar' &&
			reservaEnCheckout &&
			datosPedido.cuponesLiberados === true &&
			Array.isArray(datosPedido.cuponesCodigos)
				? [...new Set((datosPedido.cuponesCodigos as unknown[]).map(String))].filter(
						(codigo) => codigo && !codigo.includes('/')
					)
				: [];

		// Cantidades por producto (un pedido viejo podía repetir líneas).
		const cantidades = new Map<string, number>();
		const items = Array.isArray(datosPedido.items) ? datosPedido.items : [];
		for (const item of items as Array<{ id?: string | number; cantidad?: number }>) {
			const cantidad = Number(item?.cantidad ?? 0);
			if (item?.id == null || !(cantidad > 0)) continue;
			cantidades.set(String(item.id), (cantidades.get(String(item.id)) ?? 0) + cantidad);
		}
		const lineas = accionStock
			? [...cantidades].map(([idProducto, cantidad]) => ({
					idProducto,
					cantidad,
					ref: doc(db, 'productos', idProducto)
				}))
			: [];

		const usuarioId = String(datosPedido.usuarioId ?? '');
		const puntosPedido = Number(datosPedido.puntosMoon ?? 0);
		const puntosAOtorgar = Math.max(
			0,
			Math.min(puntosPedido, calcularPuntos(Number(datosPedido.totalUSD ?? 0)))
		);
		const puntosYaOtorgados = Number(datosPedido.puntosOtorgadosCantidad ?? puntosPedido);

		const otorgarPuntos =
			ESTADOS_CON_PUNTOS.includes(estado) &&
			puntosAOtorgar > 0 &&
			usuarioId !== '' &&
			!datosPedido.puntosOtorgados;

		const revertirPuntos =
			estado === 'cancelado' &&
			puntosYaOtorgados > 0 &&
			usuarioId !== '' &&
			Boolean(datosPedido.puntosOtorgados);

		/* ---------- Lecturas (Firestore exige leer antes de escribir) ---------- */

		const snapsProductos = await Promise.all(
			lineas.map((linea) => transaccion.get(linea.ref))
		);

		const refPuntos = usuarioId ? doc(db, 'puntos', usuarioId) : null;
		const snapPuntos =
			refPuntos && (otorgarPuntos || revertirPuntos)
				? await transaccion.get(refPuntos)
				: null;

		const snapsCupones = await Promise.all(
			codigosCupones.map((codigo) => transaccion.get(doc(db, 'cupones', codigo)))
		);

		/* ------------- Validación (antes de cualquier escritura) ------------- */

		const nuevosStocks: Array<{ ref: (typeof lineas)[number]['ref']; stock: number }> = [];

		lineas.forEach((linea, indice) => {
			const snapProducto = snapsProductos[indice];

			if (!snapProducto.exists()) {
				// Un pedido legacy puede tener un producto que ya se borró del
				// catálogo: no hay stock que mover (como antes). En un pedido
				// nuevo que se reabre, faltar el producto es un error.
				if (accionStock === 'descontar' && reservaEnCheckout) {
					throw new Error(
						`El producto "${linea.idProducto}" ya no existe en el inventario: no se puede reservar este pedido.`
					);
				}
				return;
			}

			const stockActual = Number(snapProducto.data()?.stock ?? 0);

			if (accionStock === 'devolver') {
				nuevosStocks.push({ ref: linea.ref, stock: stockActual + linea.cantidad });
				return;
			}

			if (stockActual < linea.cantidad) {
				const nombre = String(snapProducto.data()?.Nombre ?? linea.idProducto);
				throw new Error(
					`No hay stock suficiente de "${nombre}": quedan ${stockActual} y el pedido necesita ${linea.cantidad}. ` +
						'Ajusta el inventario antes de cambiar el estado; no se modificó nada.'
				);
			}

			nuevosStocks.push({ ref: linea.ref, stock: stockActual - linea.cantidad });
		});

		const usosCupones: Array<{ ref: (typeof snapsCupones)[number]['ref']; usos: number }> = [];

		snapsCupones.forEach((snapCupon, indice) => {
			if (!snapCupon.exists()) return;
			const usos = Number(snapCupon.data()?.usos ?? 0);
			const limite = snapCupon.data()?.limiteUsos;
			if (limite !== null && limite !== undefined && usos >= Number(limite)) {
				throw new Error(
					`El cupón "${codigosCupones[indice]}" de este pedido ya no tiene usos disponibles ` +
						'(se liberó cuando venció la reserva). Ajusta el cupón antes de reabrir el pedido; no se modificó nada.'
				);
			}
			usosCupones.push({ ref: snapCupon.ref, usos: usos + 1 });
		});

		/* ------------------------------ Escrituras ----------------------------- */

		for (const { ref, stock } of nuevosStocks) {
			transaccion.update(ref, { stock });
		}

		for (const { ref, usos } of usosCupones) {
			transaccion.update(ref, { usos });
		}
		if (codigosCupones.length > 0) cambios.cuponesLiberados = false;

		// Un pedido gestionado ya no vence; uno reabierto deja de figurar
		// como cancelado por vencimiento.
		if (estado !== 'pendiente_contacto' && datosPedido.reservaExpiraEn !== undefined) {
			cambios.reservaExpiraEn = deleteField();
		}
		if (estado !== 'cancelado' && datosPedido.motivoCancelacion !== undefined) {
			cambios.motivoCancelacion = deleteField();
		}

		if (accionStock === 'descontar') {
			cambios.stockDescontado = true;
			if (reservaEnCheckout) cambios.stockDevuelto = false;
		} else if (accionStock === 'devolver') {
			cambios.stockDescontado = false;
			cambios.stockDevuelto = true;
		}

		if (refPuntos && snapPuntos && (otorgarPuntos || revertirPuntos)) {
			const saldo = Number(snapPuntos.data()?.saldo ?? 0);
			const numero = String(datosPedido.numeroPedido ?? '');

			// Al revertir no se baja de 0: si la clienta ya canjeó esos
			// puntos, el cupón que creó sigue siendo suyo.
			const variacion = otorgarPuntos
				? puntosAOtorgar
				: -Math.min(puntosYaOtorgados, saldo);

			transaccion.set(
				refPuntos,
				{
					saldo: saldo + variacion,
					...(otorgarPuntos ? { ganados: increment(puntosAOtorgar) } : {}),
					actualizadoEn: serverTimestamp()
				},
				{ merge: true }
			);

			transaccion.set(doc(collection(db, 'puntos', usuarioId, 'movimientos')), {
				tipo: otorgarPuntos ? 'ganados' : 'revertidos',
				puntos: variacion,
				descripcion: otorgarPuntos
					? `Compra ${numero}`
					: `Pedido ${numero} cancelado`,
				pedidoId: id,
				fecha: serverTimestamp()
			});

			cambios.puntosOtorgados = otorgarPuntos;
			if (otorgarPuntos) cambios.puntosOtorgadosCantidad = puntosAOtorgar;
		}

		transaccion.update(refPedido, cambios);
	});
}

/**
 * Escucha en vivo los pedidos de una clienta, del más reciente al más
 * viejo, para su perfil. Se filtra por "usuarioId" porque las reglas
 * solo dejan leer los pedidos propios; el orden se hace aquí para no
 * necesitar un índice compuesto en Firestore.
 */
export function escucharPedidosDeUsuario(
	uid: string,
	callback: (pedidos: PedidoAdmin[]) => void,
	alError?: (error: Error) => void
) {
	const referencia = query(
		collection(db, 'pedidos'),
		where('usuarioId', '==', uid)
	);

	return onSnapshot(
		referencia,
		(snapshot) => {
			callback(
				snapshot.docs
					.map((docSnap) => normalizarPedido(docSnap.id, docSnap.data()))
					.sort((a, b) => b.fechaCreacion - a.fechaCreacion)
			);
		},
		(error) => {
			console.error('Error escuchando los pedidos del usuario:', error);
			alError?.(error);
		}
	);
}
