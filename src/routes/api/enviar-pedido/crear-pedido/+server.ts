import { json } from '@sveltejs/kit';
import { FieldValue } from 'firebase-admin/firestore';

import { adminAuth, adminDb } from '$lib/server/firebase-admin';
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
};

const MAXIMO_CUPONES = 2;

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

async function verificarUsuario(request: Request): Promise<string | null> {
	const encabezado = request.headers.get('authorization') ?? '';
	if (!encabezado.startsWith('Bearer ')) return null;

	const token = encabezado.slice('Bearer '.length).trim();
	if (!token) return null;

	try {
		const decodificado = await adminAuth.verifyIdToken(token);
		return decodificado.uid;
	} catch (err) {
		console.error('Token inválido al crear pedido:', err);
		return null;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const uid = await verificarUsuario(request);

	if (!uid) {
		return json({ ok: false, error: 'No autorizado.' }, { status: 401 });
	}

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

	// Se piden todos los productos reales de una vez (el catálogo es chico);
	// evita N idas y vueltas a Firestore por cada línea del carrito.
	const productosSnap = await adminDb.collection('productos').get();
	const productosPorId = new Map<string, FirebaseFirestore.DocumentData>();
	for (const doc of productosSnap.docs) {
		productosPorId.set(doc.id, doc.data());
	}

	// Se acumulan por id: si el navegador manda la misma línea repetida,
	// cuenta como una sola cantidad total, no como pedidos duplicados.
	const cantidadPorId = new Map<string, number>();
	for (const item of solicitud.items) {
		const id = String(item?.id ?? '').trim();
		const cantidad = Math.floor(Number(item?.cantidad ?? 0));
		if (!id || !Number.isFinite(cantidad) || cantidad <= 0) {
			return json({ ok: false, error: 'Hay un producto con cantidad inválida.' }, { status: 400 });
		}
		cantidadPorId.set(id, (cantidadPorId.get(id) ?? 0) + cantidad);
	}

	const itemsFinales: Array<{
		id: string;
		nombre: string;
		tipo: string;
		imagen: string;
		precioUSD: number;
		cantidad: number;
		subtotalUSD: number;
	}> = [];

	let subtotalUSD = 0;

	for (const [id, cantidad] of cantidadPorId) {
		const producto = productosPorId.get(id);

		if (!producto) {
			return json(
				{ ok: false, error: `Uno de los productos de tu carrito ya no está disponible (id ${id}).` },
				{ status: 400 }
			);
		}

		const stock = Number(producto.stock ?? 0);
		if (cantidad > stock) {
			return json(
				{
					ok: false,
					error: `Solo quedan ${stock} unidades de "${producto.Nombre ?? id}". Ajusta la cantidad en tu carrito.`
				},
				{ status: 409 }
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
	}

	subtotalUSD = Math.round(subtotalUSD * 100) / 100;

	// Cupones: se validan de nuevo contra el documento real, con la misma
	// lógica que ya aplican las reglas de Firestore para el contador de
	// usos — pero acá además se verifica que exista, esté vigente y
	// aplique al método de pago, algo que las reglas por sí solas no
	// pueden validar completo.
	const codigosPedidos = [
		...new Set(
			(solicitud.codigosCupones ?? [])
				.map((codigo) => normalizarCodigoCupon(String(codigo ?? '')))
				.filter(Boolean)
		)
	].slice(0, MAXIMO_CUPONES);

	type CuponValidado = {
		ref: FirebaseFirestore.DocumentReference;
		codigo: string;
		tipo: string;
		valor: number;
		combinable: boolean;
		usosActuales: number;
		limiteUsos: number | null;
	};

	const cuponesValidados: CuponValidado[] = [];

	for (const codigo of codigosPedidos) {
		const ref = adminDb.collection('cupones').doc(codigo);
		const snap = await ref.get();

		if (!snap.exists) {
			return json({ ok: false, error: `El cupón "${codigo}" no existe.` }, { status: 400 });
		}

		const datos = snap.data()!;

		if (!datos.activo) {
			return json({ ok: false, error: `El cupón "${codigo}" ya no está disponible.` }, { status: 400 });
		}

		const vencimiento = datos.fechaVencimiento;
		const vencimientoMs =
			vencimiento && typeof vencimiento.toMillis === 'function' ? vencimiento.toMillis() : null;

		if (vencimientoMs && Date.now() > vencimientoMs) {
			return json({ ok: false, error: `El cupón "${codigo}" ya venció.` }, { status: 400 });
		}

		const limiteUsos = datos.limiteUsos === null || datos.limiteUsos === undefined ? null : Number(datos.limiteUsos);
		const usosActuales = Number(datos.usos ?? 0);

		if (limiteUsos !== null && usosActuales >= limiteUsos) {
			return json({ ok: false, error: `El cupón "${codigo}" ya alcanzó su límite de usos.` }, { status: 400 });
		}

		const metodosPago = Array.isArray(datos.metodosPago) ? datos.metodosPago : [];
		if (!metodosPago.includes(solicitud.metodoPago)) {
			return json(
				{ ok: false, error: `El cupón "${codigo}" no aplica para el método de pago elegido.` },
				{ status: 400 }
			);
		}

		cuponesValidados.push({
			ref,
			codigo,
			tipo: datos.tipo === 'monto' ? 'monto' : 'porcentaje',
			valor: Number(datos.valor ?? 0),
			combinable: Boolean(datos.combinable ?? false),
			usosActuales,
			limiteUsos
		});
	}

	if (cuponesValidados.length === 2) {
		const [a, b] = cuponesValidados;
		if (!a.combinable && !b.combinable) {
			return json(
				{ ok: false, error: `Los cupones "${a.codigo}" y "${b.codigo}" no se pueden combinar.` },
				{ status: 400 }
			);
		}
	}

	const descuentoUSD = Math.round(
		Math.min(
			cuponesValidados.reduce((suma, cupon) => {
				const descuentoCupon =
					cupon.tipo === 'porcentaje' ? subtotalUSD * (cupon.valor / 100) : cupon.valor;
				return suma + Math.max(0, Math.min(descuentoCupon, subtotalUSD));
			}, 0),
			subtotalUSD
		) * 100
	) / 100;

	const totalUSD = Math.round((subtotalUSD - descuentoUSD) * 100) / 100;

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

	const totalVES = Math.round(totalUSD * tasaBCV * 100) / 100;

	const fecha = new Date().toISOString().slice(0, 10).replaceAll('-', '');
	const codigoPedido = crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
	const numeroPedido = `MB-${fecha}-${codigoPedido}`;

	// Todo lo que puede chocar con otra compra simultánea (el límite de un
	// cupón) se re-verifica y se escribe dentro de la misma transacción:
	// si dos personas usan el último cupo del mismo cupón al mismo tiempo,
	// solo una de las dos transacciones puede ganar.
	const refPedido = adminDb.collection('pedidos').doc();

	await adminDb.runTransaction(async (transaccion) => {
		for (const cupon of cuponesValidados) {
			const snapActual = await transaccion.get(cupon.ref);
			const datosActuales = snapActual.data() ?? {};
			const usosActuales = Number(datosActuales.usos ?? 0);
			const limiteActual =
				datosActuales.limiteUsos === null || datosActuales.limiteUsos === undefined
					? null
					: Number(datosActuales.limiteUsos);

			if (limiteActual !== null && usosActuales >= limiteActual) {
				throw new Error(`El cupón "${cupon.codigo}" se agotó justo ahora. Intenta sin ese código.`);
			}

			transaccion.update(cupon.ref, { usos: FieldValue.increment(1) });
		}

		transaccion.set(refPedido, {
			numeroPedido,
			usuarioId: uid,
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
			cupon: cuponesValidados.length > 0 ? cuponesValidados.map((c) => c.codigo).join(' + ') : null,
			descuentoUSD,
			totalUSD,
			tasaBCV,
			totalVES,
			estado: 'pendiente_contacto',
			stockDescontado: false,
			fechaCreacion: FieldValue.serverTimestamp()
		});
	});

	return json({
		ok: true,
		id: refPedido.id,
		numeroPedido,
		totalUSD,
		totalVES,
		tasaBCV
	});
};
