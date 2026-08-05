import {
	addDoc,
	collection,
	serverTimestamp
} from 'firebase/firestore';

import { auth, db } from '$lib/firebase';

export type MetodoPago =
	| 'efectivo'
	| 'pago_movil'
	| 'binance';

export type ContactoPedido = {
	nombre: string;
	correo: string;
	telefono: string;
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
	metodoPago: MetodoPago;
	items: ItemPedido[];
	totalUSD: number;
	tasaBCV: number;
	totalVES: number;
};

export async function crearPedido(
	input: CrearPedidoInput
): Promise<{
	id: string;
	numeroPedido: string;
}> {
	const usuarioActual = auth.currentUser;

	if (!usuarioActual) {
		throw new Error(
			'Debes iniciar sesión para finalizar la compra.'
		);
	}

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

			metodoPago: input.metodoPago,
			items: input.items,
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