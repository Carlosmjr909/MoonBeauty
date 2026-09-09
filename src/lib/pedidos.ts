import {
	addDoc,
	collection,
	doc,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	updateDoc
} from 'firebase/firestore';

import {
	getDownloadURL,
	ref,
	uploadBytes
} from 'firebase/storage';

import {
	signInAnonymously
} from 'firebase/auth';

import { auth, db, storage } from '$lib/firebase';

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

export type CrearPedidoInput = {
	contacto: ContactoPedido;
	entrega: EntregaPedido;
	metodoPago: MetodoPago;
	comprobantePago: ComprobantePago;
	items: ItemPedido[];
	subtotalUSD: number;
	cupon?: string | null;
	descuentoUSD?: number;
	totalUSD: number;
	tasaBCV: number;
	totalVES: number;
};

/**
 * Sube el comprobante de pago (imagen o PDF) a Storage y devuelve su URL.
 */
export async function subirComprobantePago(archivo: File): Promise<string> {
	const nombreUnico = `${crypto.randomUUID()}-${archivo.name}`;
	const referencia = ref(storage, `comprobantes/${nombreUnico}`);

	await uploadBytes(referencia, archivo);

	return getDownloadURL(referencia);
}

/**
 * Compra como invitado: no requiere que el usuario tenga una cuenta.
 * Iniciamos sesión anónima por detrás (si no hay sesión ya) para que el
 * pedido siempre tenga un usuarioId válido con el que las reglas de
 * Firestore puedan verificar la escritura, sin obligar a crear cuenta.
 */
export async function asegurarSesion() {
	if (auth.currentUser) {
		return auth.currentUser;
	}

	const resultado = await signInAnonymously(auth);
	return resultado.user;
}

export async function crearPedido(
	input: CrearPedidoInput
): Promise<{
	id: string;
	numeroPedido: string;
}> {
	const usuarioActual = await asegurarSesion();

	if (!Array.isArray(input.items) || input.items.length === 0) {
		throw new Error('El carrito está vacío.');
	}

	if (
		!Number.isFinite(input.totalUSD) ||
		!Number.isFinite(input.tasaBCV) ||
		!Number.isFinite(input.totalVES)
	) {
		throw new Error(
			'Los valores del pedido no son válidos.'
		);
	}

	const fecha = new Date()
		.toISOString()
		.slice(0, 10)
		.replaceAll('-', '');

	const codigo = crypto
		.randomUUID()
		.replaceAll('-', '')
		.slice(0, 6)
		.toUpperCase();

	const numeroPedido = `MB-${fecha}-${codigo}`;

	const referencia = await addDoc(
		collection(db, 'pedidos'),
		{
			numeroPedido,
			usuarioId: usuarioActual.uid,
			usuarioCorreo:
				usuarioActual.email ?? null,

			contacto: {
				nombre: input.contacto.nombre,
				correo: input.contacto.correo,
				telefono: input.contacto.telefono
			},

			entrega: {
				direccion: input.entrega.direccion,
				casaApartamento: input.entrega.casaApartamento ?? '',
				ciudad: input.entrega.ciudad,
				codigoPostal: input.entrega.codigoPostal ?? '',
				estado: input.entrega.estado,
				ubicacionMapa: input.entrega.ubicacionMapa ?? null
			},

			metodoPago: input.metodoPago,
			comprobantePago: {
				url: input.comprobantePago.url ?? null,
				referencia: input.comprobantePago.referencia ?? null
			},
			items: input.items,
			subtotalUSD: input.subtotalUSD,
			cupon: input.cupon ?? null,
			descuentoUSD: input.descuentoUSD ?? 0,
			totalUSD: input.totalUSD,
			tasaBCV: input.tasaBCV,
			totalVES: input.totalVES,
			estado: 'pendiente_contacto',
			fechaCreacion: serverTimestamp()
		}
	);

	return {
		id: referencia.id,
		numeroPedido
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

export async function actualizarEstadoPedido(
	id: string,
	estado: EstadoPedido
) {
	await updateDoc(doc(db, 'pedidos', id), { estado });
}