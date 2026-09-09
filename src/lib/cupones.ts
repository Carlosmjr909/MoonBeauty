import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	increment,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	Timestamp,
	updateDoc
} from 'firebase/firestore';

import { db } from '$lib/firebase';
import type { MetodoPago } from '$lib/pedidos';

const COLECCION_CUPONES = 'cupones';

export type TipoCupon = 'porcentaje' | 'monto';

export type Cupon = {
	/** El código en mayúsculas; también es el id del documento. */
	codigo: string;
	descripcion: string;
	tipo: TipoCupon;
	/** Porcentaje (0-100) si tipo es "porcentaje"; dólares si es "monto". */
	valor: number;
	/** Métodos de pago en los que aplica. */
	metodosPago: MetodoPago[];
	activo: boolean;
	/** Tope de usos; null significa ilimitado. */
	limiteUsos: number | null;
	usos: number;
	/** Milisegundos desde epoch; null significa sin vencimiento. */
	fechaVencimiento: number | null;
};

export type NuevoCupon = Omit<Cupon, 'usos'>;

/**
 * Métodos de pago que se cobran en dólares. Un cupón en pago móvil no
 * tiene sentido porque ese método se cobra en bolívares al total sin
 * descuento, así que el formulario del panel lo advierte.
 */
export const METODOS_PAGO_EN_DIVISAS: MetodoPago[] = [
	'efectivo',
	'binance',
	'zelle',
	'zinli'
];

export function normalizarCodigo(codigo: string): string {
	return codigo.trim().toUpperCase().replace(/\s+/g, '');
}

function convertirCupon(id: string, datos: Record<string, unknown>): Cupon {
	const vencimiento = datos.fechaVencimiento as
		| { toMillis?: () => number }
		| null
		| undefined;

	const limite = datos.limiteUsos;

	return {
		codigo: String(datos.codigo ?? id),
		descripcion: String(datos.descripcion ?? ''),
		tipo: datos.tipo === 'monto' ? 'monto' : 'porcentaje',
		valor: Number(datos.valor ?? 0),
		metodosPago: Array.isArray(datos.metodosPago)
			? (datos.metodosPago as MetodoPago[])
			: [],
		activo: Boolean(datos.activo),
		limiteUsos:
			limite === null || limite === undefined ? null : Number(limite),
		usos: Number(datos.usos ?? 0),
		fechaVencimiento:
			vencimiento && typeof vencimiento.toMillis === 'function'
				? vencimiento.toMillis()
				: null
	};
}

/**
 * Escucha todos los cupones. Solo funciona para admins: las reglas de
 * Firestore permiten "get" público pero "list" únicamente a admins.
 */
export function escucharCupones(
	callback: (cupones: Cupon[]) => void,
	alError?: (error: Error) => void
) {
	const referencia = query(
		collection(db, COLECCION_CUPONES),
		orderBy('codigo')
	);

	return onSnapshot(
		referencia,
		(snapshot) => {
			callback(
				snapshot.docs.map((docSnap) =>
					convertirCupon(docSnap.id, docSnap.data())
				)
			);
		},
		(error) => {
			console.error('Error escuchando cupones:', error);
			alError?.(error);
		}
	);
}

export async function guardarCupon(cupon: NuevoCupon) {
	const codigo = normalizarCodigo(cupon.codigo);

	if (!codigo) {
		throw new Error('El código del cupón es obligatorio.');
	}

	if (!Number.isFinite(cupon.valor) || cupon.valor <= 0) {
		throw new Error('El descuento debe ser mayor que cero.');
	}

	if (cupon.tipo === 'porcentaje' && cupon.valor > 100) {
		throw new Error('Un descuento en porcentaje no puede pasar de 100.');
	}

	if (cupon.metodosPago.length === 0) {
		throw new Error('Elige al menos un método de pago para el cupón.');
	}

	const referencia = doc(db, COLECCION_CUPONES, codigo);
	const existente = await getDoc(referencia);

	await setDoc(
		referencia,
		{
			codigo,
			descripcion: cupon.descripcion.trim(),
			tipo: cupon.tipo,
			valor: cupon.valor,
			metodosPago: cupon.metodosPago,
			activo: cupon.activo,
			limiteUsos: cupon.limiteUsos,
			fechaVencimiento: cupon.fechaVencimiento
				? Timestamp.fromMillis(cupon.fechaVencimiento)
				: null,
			// Solo se inicializa al crear: editar un cupón no borra su historial.
			...(existente.exists() ? {} : { usos: 0 }),
			actualizadoEn: serverTimestamp()
		},
		{ merge: true }
	);

	return codigo;
}

export async function eliminarCupon(codigo: string) {
	await deleteDoc(doc(db, COLECCION_CUPONES, normalizarCodigo(codigo)));
}

export type ResultadoValidacion =
	| { valido: true; cupon: Cupon }
	| { valido: false; error: string };

/**
 * Valida un código contra Firestore. Se usa desde el checkout, donde el
 * comprador escribe el código: por eso lee el documento exacto (las
 * reglas no permiten listar la colección).
 */
export async function validarCupon(
	codigoIngresado: string,
	metodoPago: MetodoPago
): Promise<ResultadoValidacion> {
	const codigo = normalizarCodigo(codigoIngresado);

	if (!codigo) {
		return { valido: false, error: 'Ingresa un código de cupón.' };
	}

	let snapshot;

	try {
		snapshot = await getDoc(doc(db, COLECCION_CUPONES, codigo));
	} catch {
		return {
			valido: false,
			error: 'No se pudo validar el cupón. Revisa tu conexión.'
		};
	}

	if (!snapshot.exists()) {
		return { valido: false, error: 'El código ingresado no es válido.' };
	}

	const cupon = convertirCupon(snapshot.id, snapshot.data());

	if (!cupon.activo) {
		return { valido: false, error: 'Este cupón ya no está disponible.' };
	}

	if (cupon.fechaVencimiento && Date.now() > cupon.fechaVencimiento) {
		return { valido: false, error: 'Este cupón ya venció.' };
	}

	if (cupon.limiteUsos !== null && cupon.usos >= cupon.limiteUsos) {
		return {
			valido: false,
			error: 'Este cupón ya alcanzó su límite de usos.'
		};
	}

	if (!cupon.metodosPago.includes(metodoPago)) {
		return {
			valido: false,
			error: 'Este cupón no aplica para el método de pago seleccionado.'
		};
	}

	return { valido: true, cupon };
}

export function calcularDescuentoUSD(cupon: Cupon, totalUSD: number): number {
	if (!Number.isFinite(totalUSD) || totalUSD <= 0) {
		return 0;
	}

	const descuento =
		cupon.tipo === 'porcentaje'
			? totalUSD * (cupon.valor / 100)
			: cupon.valor;

	// Nunca puede dejar el total en negativo.
	return Math.round(Math.min(descuento, totalUSD) * 100) / 100;
}

/**
 * Suma 1 al contador de usos. Las reglas de Firestore verifican que sea
 * exactamente +1 y que no se pase del límite, así que el tope se respeta
 * aunque alguien manipule el navegador.
 */
export async function registrarUsoCupon(codigo: string) {
	await updateDoc(doc(db, COLECCION_CUPONES, normalizarCodigo(codigo)), {
		usos: increment(1)
	});
}
