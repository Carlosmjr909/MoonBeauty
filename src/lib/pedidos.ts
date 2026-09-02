import {
	addDoc,
	collection,
	serverTimestamp
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