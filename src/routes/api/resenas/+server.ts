import { json } from '@sveltejs/kit';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '$lib/server/firebase-admin';
import type { RequestHandler } from './$types';

/**
 * Reseñas internas por producto: solo califican de 1 a 5 estrellas, no se
 * muestran públicamente en ningún lado (solo la cantidad total), y quien
 * las administra las ve en /admin/resenas. Como es un formulario público
 * sin login, todo el escrito pasa por acá (Admin SDK) en vez de dejar
 * que el cliente escriba directo a Firestore — así "productos" no
 * necesita abrirse a escritura pública solo para este contador.
 */
export const POST: RequestHandler = async ({ request }): Promise<Response> => {
	try {
		const cuerpo = (await request.json()) as {
			productoId?: string;
			calificacion?: number;
		};

		const productoId = cuerpo.productoId?.trim();
		const calificacion = Number(cuerpo.calificacion);

		if (!productoId) {
			return json({ ok: false, error: 'Falta el producto.' }, { status: 400 });
		}

		if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
			return json(
				{ ok: false, error: 'La calificación debe ser un número entero de 1 a 5.' },
				{ status: 400 }
			);
		}

		const refProducto = adminDb.collection('productos').doc(productoId);
		const snapshotProducto = await refProducto.get();

		if (!snapshotProducto.exists) {
			return json({ ok: false, error: 'El producto no existe.' }, { status: 404 });
		}

		const datosProducto = snapshotProducto.data() as {
			Nombre?: string;
			marca?: string;
		};

		const refResena = adminDb.collection('resenas').doc();

		const lote = adminDb.batch();

		lote.set(refResena, {
			productoId,
			productoNombre: datosProducto.Nombre ?? '',
			marca: datosProducto.marca ?? '',
			calificacion,
			fecha: FieldValue.serverTimestamp()
		});

		lote.update(refProducto, {
			cantidadResenas: FieldValue.increment(1),
			sumaCalificaciones: FieldValue.increment(calificacion)
		});

		await lote.commit();

		return json({ ok: true, message: 'Reseña registrada.' });
	} catch (error) {
		console.error('Error al guardar la reseña:', error);

		return json({ ok: false, error: 'No se pudo guardar la reseña.' }, { status: 500 });
	}
};
