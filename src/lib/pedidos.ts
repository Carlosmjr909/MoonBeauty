import {
	collection,
	doc,
	onSnapshot,
	orderBy,
	query,
	runTransaction,
	updateDoc
} from 'firebase/firestore';

import {
	getDownloadURL,
	ref,
	uploadBytes
} from 'firebase/storage';

import { db, storage, obtenerAuth } from '$lib/firebase';

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
		throw new Error(datos.error ?? 'No se pudo crear el pedido.');
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
		fechaCreacion
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

/**
 * Cambia el estado del pedido. Al pasar a "confirmado" descuenta el stock
 * de cada producto una sola vez (protegido por "stockDescontado" para
 * que no se reste dos veces si el pedido se vuelve a marcar como
 * confirmado más adelante); el stock nunca baja de 0. Esto es
 * independiente de la edición manual de stock del panel de inventario,
 * que sigue funcionando igual — ambas formas escriben el mismo campo,
 * pero por caminos distintos y en momentos distintos.
 */
export async function actualizarEstadoPedido(
	id: string,
	estado: EstadoPedido
) {
	if (estado !== 'confirmado') {
		await updateDoc(doc(db, 'pedidos', id), { estado });
		return;
	}

	await runTransaction(db, async (transaccion) => {
		const refPedido = doc(db, 'pedidos', id);
		const snapPedido = await transaccion.get(refPedido);

		if (!snapPedido.exists()) {
			throw new Error('El pedido ya no existe.');
		}

		const datosPedido = snapPedido.data();

		if (datosPedido.stockDescontado) {
			transaccion.update(refPedido, { estado });
			return;
		}

		const items = Array.isArray(datosPedido.items) ? datosPedido.items : [];

		const lineas = items.flatMap(
			(item: { id?: string | number; cantidad?: number }) => {
				const cantidad = Number(item?.cantidad ?? 0);
				if (item?.id == null || cantidad <= 0) return [];
				return [{ cantidad, ref: doc(db, 'productos', String(item.id)) }];
			}
		);

		// Firestore exige leer todo antes de escribir nada en una transacción.
		const snapsProductos = await Promise.all(
			lineas.map((linea) => transaccion.get(linea.ref))
		);

		lineas.forEach((linea, indice) => {
			const snapProducto = snapsProductos[indice];
			// El producto pudo haberse eliminado del catálogo desde que se
			// hizo el pedido; en ese caso no hay stock que descontar.
			if (!snapProducto.exists()) return;

			const stockActual = Number(snapProducto.data()?.stock ?? 0);
			const nuevoStock = Math.max(0, stockActual - linea.cantidad);

			transaccion.update(linea.ref, { stock: nuevoStock });
		});

		transaccion.update(refPedido, { estado, stockDescontado: true });
	});
}