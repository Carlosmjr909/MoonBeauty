import {
	collection,
	doc,
	limit,
	onSnapshot,
	orderBy,
	query,
	setDoc,
	where
} from 'firebase/firestore';
import type { User } from 'firebase/auth';

import { db } from '$lib/firebase';
import type { PorcentajeCanje } from '$lib/puntosMoon';

/* ------------------------------ Perfil ------------------------------ */

/** Una dirección de entrega guardada por la clienta. */
export type Direccion = {
	id: string;
	/** Cómo la reconoce ella: "Casa", "Trabajo"... */
	alias: string;
	direccion: string;
	casaApartamento: string;
	ciudad: string;
	estado: string;
	codigoPostal: string;
};

export type PerfilCliente = {
	nombre: string;
	telefono: string;
	direcciones: Direccion[];
	recibirPromociones: boolean;
};

function normalizarDirecciones(valor: unknown): Direccion[] {
	if (!Array.isArray(valor)) return [];

	return valor
		.map((item) => {
			const d = (item ?? {}) as Partial<Direccion>;

			return {
				id: String(d.id ?? crypto.randomUUID()),
				alias: String(d.alias ?? '').trim(),
				direccion: String(d.direccion ?? '').trim(),
				casaApartamento: String(d.casaApartamento ?? '').trim(),
				ciudad: String(d.ciudad ?? '').trim(),
				estado: String(d.estado ?? '').trim(),
				codigoPostal: String(d.codigoPostal ?? '').trim()
			};
		})
		.filter((d) => d.direccion);
}

/** Perfil de la clienta en /usuarios, que ella misma puede editar. */
export function escucharPerfil(
	usuario: User,
	callback: (perfil: PerfilCliente) => void,
	alError?: (error: Error) => void
) {
	return onSnapshot(
		doc(db, 'usuarios', usuario.uid),
		(snapshot) => {
			const datos = snapshot.data() ?? {};

			callback({
				nombre: String(datos.nombre ?? usuario.displayName ?? ''),
				telefono: String(datos.telefono ?? ''),
				direcciones: normalizarDirecciones(datos.direcciones),
				// Si el campo no existe se asume que sí (es lo que acepta al
				// registrarse según la política de privacidad).
				recibirPromociones: datos.recibirPromociones !== false
			});
		},
		(error) => {
			console.error('Error escuchando el perfil:', error);
			alError?.(error);
		}
	);
}

export async function guardarDatosPersonales(
	usuario: User,
	datos: { nombre: string; telefono: string }
) {
	const nombre = datos.nombre.trim();

	if (!nombre) {
		throw new Error('Escribe tu nombre.');
	}

	// El nombre también se guarda en la cuenta de Firebase porque es el
	// que se muestra en el encabezado ("displayName").
	const { updateProfile } = await import('firebase/auth');
	await updateProfile(usuario, { displayName: nombre });

	await setDoc(
		doc(db, 'usuarios', usuario.uid),
		{
			uid: usuario.uid,
			correo: usuario.email,
			nombre,
			telefono: datos.telefono.trim()
		},
		{ merge: true }
	);
}

export async function guardarDirecciones(usuario: User, direcciones: Direccion[]) {
	await setDoc(
		doc(db, 'usuarios', usuario.uid),
		{ uid: usuario.uid, correo: usuario.email, direcciones },
		{ merge: true }
	);
}

export async function guardarPreferenciaPromociones(usuario: User, recibir: boolean) {
	await setDoc(
		doc(db, 'usuarios', usuario.uid),
		{ uid: usuario.uid, correo: usuario.email, recibirPromociones: recibir },
		{ merge: true }
	);
}

/* ------------------------------ Puntos ------------------------------ */

export type SaldoPuntos = {
	saldo: number;
	ganados: number;
	canjeados: number;
};

export type MovimientoPuntos = {
	id: string;
	tipo: 'ganados' | 'canjeados' | 'revertidos';
	/** Positivo si suma, negativo si resta. */
	puntos: number;
	descripcion: string;
	/** Milisegundos desde epoch, 0 mientras el servidor asigna la fecha. */
	fecha: number;
};

/** Un código de descuento que la clienta creó canjeando sus puntos. */
export type CodigoPropio = {
	codigo: string;
	porcentaje: number;
	usado: boolean;
	creadoEn: number;
};

function aMilisegundos(valor: unknown): number {
	const marca = valor as { toMillis?: () => number } | null | undefined;
	return marca && typeof marca.toMillis === 'function' ? marca.toMillis() : 0;
}

/** Saldo de puntos. Solo lectura: lo escriben el servidor y el panel. */
export function escucharPuntos(
	uid: string,
	callback: (saldo: SaldoPuntos) => void,
	alError?: (error: Error) => void
) {
	return onSnapshot(
		doc(db, 'puntos', uid),
		(snapshot) => {
			const datos = snapshot.data() ?? {};

			callback({
				saldo: Number(datos.saldo ?? 0),
				ganados: Number(datos.ganados ?? 0),
				canjeados: Number(datos.canjeados ?? 0)
			});
		},
		(error) => {
			console.error('Error escuchando los puntos:', error);
			alError?.(error);
		}
	);
}

export function escucharMovimientos(
	uid: string,
	callback: (movimientos: MovimientoPuntos[]) => void
) {
	const referencia = query(
		collection(db, 'puntos', uid, 'movimientos'),
		orderBy('fecha', 'desc'),
		limit(30)
	);

	return onSnapshot(
		referencia,
		(snapshot) => {
			callback(
				snapshot.docs.map((docSnap) => {
					const datos = docSnap.data();
					const tipo = String(datos.tipo ?? 'ganados');

					return {
						id: docSnap.id,
						tipo:
							tipo === 'canjeados' || tipo === 'revertidos'
								? tipo
								: 'ganados',
						puntos: Number(datos.puntos ?? 0),
						descripcion: String(datos.descripcion ?? ''),
						fecha: aMilisegundos(datos.fecha)
					};
				})
			);
		},
		(error) => console.error('Error escuchando el historial de puntos:', error)
	);
}

/**
 * Códigos que creó la clienta. Las reglas solo permiten esta consulta si
 * filtra por su propio usuarioId; se ordena aquí para no necesitar un
 * índice compuesto.
 */
export function escucharCodigosPropios(
	uid: string,
	callback: (codigos: CodigoPropio[]) => void
) {
	const referencia = query(collection(db, 'cupones'), where('usuarioId', '==', uid));

	return onSnapshot(
		referencia,
		(snapshot) => {
			callback(
				snapshot.docs
					.map((docSnap) => {
						const datos = docSnap.data();
						const limite = Number(datos.limiteUsos ?? 1);

						return {
							codigo: String(datos.codigo ?? docSnap.id),
							porcentaje: Number(datos.valor ?? 0),
							usado: Number(datos.usos ?? 0) >= limite || !datos.activo,
							creadoEn: aMilisegundos(datos.creadoEn)
						};
					})
					.sort((a, b) => b.creadoEn - a.creadoEn)
			);
		},
		(error) => console.error('Error escuchando los códigos propios:', error)
	);
}

/** Canjea puntos por un código personal (lo valida y crea el servidor). */
export async function canjearPuntos(
	usuario: User,
	codigo: string,
	porcentaje: PorcentajeCanje
): Promise<{ codigo: string; saldo: number }> {
	const token = await usuario.getIdToken();

	const respuesta = await fetch('/api/puntos/canjear', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ codigo, porcentaje })
	});

	const datos = await respuesta.json().catch(() => ({}));

	if (!respuesta.ok || !datos.ok) {
		throw new Error(datos.error ?? 'No se pudo completar el canje.');
	}

	return { codigo: datos.codigo, saldo: datos.saldo };
}
