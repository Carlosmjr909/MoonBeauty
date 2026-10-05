import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';

/**
 * Vencimiento de las reservas de stock de los pedidos.
 *
 * Desde la corrección de concurrencia, crear-pedido descuenta el stock al
 * crear el pedido (reservaEnCheckout: true). Si la clienta nunca concreta
 * el pago, ese stock quedaría apartado para siempre. Por eso cada pedido
 * nuevo guarda "reservaExpiraEn" (fecha del servidor = creación + la
 * duración de la reserva) y, pasada esa fecha, si el pedido sigue en
 * "pendiente_contacto", se cancela solo y devuelve su stock.
 *
 * El pedido vencido queda en "cancelado" (no hay un estado nuevo, así el
 * panel, los filtros y las estadísticas no cambian) con
 * motivoCancelacion: 'reserva_expirada' para distinguirlo de una
 * cancelación manual.
 *
 * Al confirmar, enviar, entregar o cancelar un pedido desde el panel se
 * borra "reservaExpiraEn" (ver actualizarEstadoPedido), así que solo los
 * pedidos que siguen pendientes pueden vencer. Los pedidos legacy nunca
 * tuvieron ese campo y la consulta de vencidos no los encuentra.
 */

export const MINUTOS_RESERVA_POR_DEFECTO = 45;
const MINUTOS_RESERVA_MINIMO = 10;
const MINUTOS_RESERVA_MAXIMO = 24 * 60;

/**
 * Duración de la reserva en minutos a partir de RESERVA_STOCK_MINUTOS. Si
 * la variable falta o no es un entero, se usan 45 minutos; si se sale del
 * rango, se ajusta a entre 10 minutos y 24 horas.
 */
export function minutosReserva(valor: string | undefined): number {
	const texto = valor?.trim() ?? '';
	const minutos = Number(texto);
	if (texto === '' || !Number.isInteger(minutos)) return MINUTOS_RESERVA_POR_DEFECTO;
	return Math.min(MINUTOS_RESERVA_MAXIMO, Math.max(MINUTOS_RESERVA_MINIMO, minutos));
}

function milisegundos(valor: unknown): number | null {
	return valor instanceof Timestamp ? valor.toMillis() : null;
}

/**
 * Si el pedido es una reserva pendiente cuyo plazo ya pasó (aunque todavía
 * no la haya procesado ningún barrido).
 */
export function reservaVencida(datos: FirebaseFirestore.DocumentData, ahoraMs = Date.now()): boolean {
	const expiraMs = milisegundos(datos.reservaExpiraEn);
	return (
		datos.reservaEnCheckout === true &&
		datos.estado === 'pendiente_contacto' &&
		datos.stockDescontado === true &&
		expiraMs !== null &&
		expiraMs <= ahoraMs
	);
}

export type ResultadoExpiracion =
	| { expirado: true; unidades: number; cuponesLiberados: number }
	| { expirado: false; motivo: 'no_existe' | 'vigente' | 'no_aplica' };

/**
 * Vence la reserva de un pedido si corresponde. Todo ocurre en una
 * transacción que vuelve a leer el pedido y comprueba otra vez cada
 * condición, así que varias ejecuciones a la vez (dos barridos, un
 * barrido y una cancelación o confirmación desde el panel) devuelven el
 * stock una sola vez: la segunda ve que el pedido ya no está pendiente
 * con stock apartado y no hace nada.
 *
 * Si el pedido ya no puede vencer (se confirmó, se canceló o es legacy)
 * pero todavía tiene "reservaExpiraEn", se borra el campo para que el
 * barrido no lo vuelva a encontrar.
 */
export async function expirarReservaPedido(
	db: Firestore,
	pedidoId: string,
	ahoraMs = Date.now()
): Promise<ResultadoExpiracion> {
	const refPedido = db.collection('pedidos').doc(pedidoId);

	return db.runTransaction(async (transaccion): Promise<ResultadoExpiracion> => {
		const snapPedido = await transaccion.get(refPedido);
		if (!snapPedido.exists) return { expirado: false, motivo: 'no_existe' };

		const pedido = snapPedido.data()!;
		const expiraMs = milisegundos(pedido.reservaExpiraEn);

		const puedeVencer =
			pedido.reservaEnCheckout === true &&
			pedido.estado === 'pendiente_contacto' &&
			pedido.stockDescontado === true &&
			pedido.stockDevuelto !== true &&
			pedido.puntosOtorgados !== true &&
			expiraMs !== null;

		if (!puedeVencer) {
			if (pedido.reservaExpiraEn !== undefined) {
				transaccion.update(refPedido, { reservaExpiraEn: FieldValue.delete() });
			}
			return { expirado: false, motivo: 'no_aplica' };
		}

		if (expiraMs > ahoraMs) return { expirado: false, motivo: 'vigente' };

		const cantidades = new Map<string, number>();
		for (const item of Array.isArray(pedido.items) ? pedido.items : []) {
			const id = String(item?.id ?? '');
			const cantidad = Number(item?.cantidad ?? 0);
			if (!id || id.includes('/') || !(cantidad > 0)) continue;
			cantidades.set(id, (cantidades.get(id) ?? 0) + cantidad);
		}

		// El uso del cupón se consumió junto con la reserva; al vencer se
		// devuelve también (una sola vez, marcado con cuponesLiberados).
		const codigosCupones =
			pedido.cuponesLiberados === true || !Array.isArray(pedido.cuponesCodigos)
				? []
				: [...new Set(pedido.cuponesCodigos.map(String))].filter((codigo) => codigo && !codigo.includes('/'));

		const refsProductos = [...cantidades.keys()].map((id) => db.collection('productos').doc(id));
		const refsCupones = codigosCupones.map((codigo) => db.collection('cupones').doc(codigo));
		const refs = [...refsProductos, ...refsCupones];
		const snaps = refs.length > 0 ? await transaccion.getAll(...refs) : [];

		let unidades = 0;
		refsProductos.forEach((ref, indice) => {
			const snap = snaps[indice];
			// Un producto que se borró del catálogo no tiene a dónde volver.
			if (!snap.exists) return;
			const stockActual = Number(snap.data()?.stock ?? 0);
			const cantidad = cantidades.get(ref.id)!;
			transaccion.update(ref, { stock: (Number.isFinite(stockActual) ? stockActual : 0) + cantidad });
			unidades += cantidad;
		});

		let cuponesLiberados = 0;
		refsCupones.forEach((ref, indice) => {
			const snap = snaps[refsProductos.length + indice];
			if (!snap.exists) return;
			const usos = Number(snap.data()?.usos ?? 0);
			if (!(usos > 0)) return;
			transaccion.update(ref, { usos: usos - 1 });
			cuponesLiberados++;
		});

		transaccion.update(refPedido, {
			estado: 'cancelado',
			motivoCancelacion: 'reserva_expirada',
			canceladoEn: FieldValue.serverTimestamp(),
			stockDescontado: false,
			stockDevuelto: true,
			reservaExpiraEn: FieldValue.delete(),
			...(codigosCupones.length > 0 ? { cuponesLiberados: true } : {})
		});

		return { expirado: true, unidades, cuponesLiberados };
	});
}

export type ResultadoBarrido = {
	revisados: number;
	expirados: number;
	omitidos: number;
	errores: number;
	quedanMas: boolean;
};

/**
 * Busca hasta "limite" pedidos con la reserva vencida y los vence. Solo
 * consulta por reservaExpiraEn (índice simple que Firestore crea solo; no
 * hace falta índice compuesto): nunca recorre todos los pedidos. Si hay
 * más vencidos que el límite, el siguiente barrido sigue con el resto.
 */
export async function expirarReservasVencidas(
	db: Firestore,
	{ limite = 25, ahoraMs = Date.now() }: { limite?: number; ahoraMs?: number } = {}
): Promise<ResultadoBarrido> {
	const vencidos = await db
		.collection('pedidos')
		.where('reservaExpiraEn', '<=', Timestamp.fromMillis(ahoraMs))
		.orderBy('reservaExpiraEn')
		.limit(limite)
		.select()
		.get();

	const resultados = await Promise.allSettled(
		vencidos.docs.map((snap) => expirarReservaPedido(db, snap.id, ahoraMs))
	);

	let expirados = 0;
	let errores = 0;
	for (const resultado of resultados) {
		if (resultado.status === 'rejected') {
			errores++;
			console.error('[reservas] No se pudo vencer una reserva:', resultado.reason);
		} else if (resultado.value.expirado) {
			expirados++;
		}
	}

	return {
		revisados: vencidos.size,
		expirados,
		omitidos: vencidos.size - expirados - errores,
		errores,
		quedanMas: vencidos.size === limite
	};
}
