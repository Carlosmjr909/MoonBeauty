import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { db } from '$lib/firebase';

const COLECCION_RESENAS = 'resenas';

export type Resena = {
	id: string;
	productoId: string;
	productoNombre: string;
	marca: string;
	/** De 1 a 5 estrellas. */
	calificacion: number;
	/** Milisegundos desde epoch; null si aún no se confirma en el servidor. */
	fecha: number | null;
};

function convertirResena(id: string, datos: Record<string, unknown>): Resena {
	const fecha = datos.fecha as { toMillis?: () => number } | null | undefined;

	return {
		id,
		productoId: String(datos.productoId ?? ''),
		productoNombre: String(datos.productoNombre ?? ''),
		marca: String(datos.marca ?? ''),
		calificacion: Number(datos.calificacion ?? 0),
		fecha: fecha && typeof fecha.toMillis === 'function' ? fecha.toMillis() : null
	};
}

/**
 * Escucha todas las reseñas internas, de la más reciente a la más
 * antigua. Solo funciona para admins (ver firestore.rules): estas
 * reseñas nunca se muestran en el sitio público, solo en /admin/resenas.
 * Se escriben siempre desde el servidor (POST /api/resenas), nunca
 * directo desde el cliente.
 */
export function escucharResenas(
	callback: (resenas: Resena[]) => void,
	alError?: (error: Error) => void
) {
	const referencia = query(collection(db, COLECCION_RESENAS), orderBy('fecha', 'desc'));

	return onSnapshot(
		referencia,
		(snapshot) => {
			callback(snapshot.docs.map((docSnap) => convertirResena(docSnap.id, docSnap.data())));
		},
		(error) => {
			console.error('Error escuchando reseñas:', error);
			alError?.(error);
		}
	);
}
