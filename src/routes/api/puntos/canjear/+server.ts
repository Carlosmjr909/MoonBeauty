import { json } from '@sveltejs/kit';
import { FieldValue } from 'firebase-admin/firestore';

import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import {
	errorCodigoPersonal,
	nivelCanje,
	normalizarCodigoPersonal
} from '$lib/puntosMoon';
import type { RequestHandler } from './$types';

/**
 * Canjea puntos Moon Beauty por un cupón personal con el nombre que elija
 * la clienta. Todo pasa aquí, con el Admin SDK: las reglas de Firestore
 * no dejan que nadie escriba su propio saldo de puntos ni cree cupones,
 * así que no hay forma de canjear sin pasar por estas validaciones.
 *
 * El cupón queda atado a quien lo canjeó ("usuarioId"), sirve una sola
 * vez y solo en los métodos de pago en divisas, igual que el resto de
 * los cupones (pago móvil se cobra en bolívares al total sin descuento).
 */

const METODOS_PAGO_EN_DIVISAS = ['efectivo', 'binance', 'zelle', 'zinli'];

class ErrorCanje extends Error {}

export const POST: RequestHandler = async ({ request }) => {
	const encabezado = request.headers.get('authorization') ?? '';
	const token = encabezado.startsWith('Bearer ')
		? encabezado.slice('Bearer '.length).trim()
		: '';

	if (!token) {
		return json({ ok: false, error: 'Inicia sesión para canjear tus puntos.' }, { status: 401 });
	}

	let uid: string;

	try {
		const decodificado = await adminAuth.verifyIdToken(token);

		// Una sesión anónima (compra como invitado) no tiene puntos.
		if (decodificado.firebase?.sign_in_provider === 'anonymous') {
			return json(
				{ ok: false, error: 'Inicia sesión con tu cuenta para canjear tus puntos.' },
				{ status: 401 }
			);
		}

		uid = decodificado.uid;
	} catch (err) {
		console.error('Token inválido al canjear puntos:', err);
		return json({ ok: false, error: 'Tu sesión expiró. Vuelve a iniciar sesión.' }, { status: 401 });
	}

	const cuerpo = (await request.json().catch(() => ({}))) as {
		codigo?: unknown;
		porcentaje?: unknown;
	};

	const codigo = normalizarCodigoPersonal(String(cuerpo.codigo ?? ''));
	const errorCodigo = errorCodigoPersonal(codigo);

	if (errorCodigo) {
		return json({ ok: false, error: errorCodigo }, { status: 400 });
	}

	const nivel = nivelCanje(Number(cuerpo.porcentaje));

	if (!nivel) {
		return json({ ok: false, error: 'Ese descuento no está disponible.' }, { status: 400 });
	}

	const refPuntos = adminDb.collection('puntos').doc(uid);
	const refCupon = adminDb.collection('cupones').doc(codigo);

	try {
		const saldoFinal = await adminDb.runTransaction(async (transaccion) => {
			const [snapPuntos, snapCupon] = await Promise.all([
				transaccion.get(refPuntos),
				transaccion.get(refCupon)
			]);

			const saldo = Number(snapPuntos.data()?.saldo ?? 0);

			if (saldo < nivel.puntos) {
				throw new ErrorCanje(
					`Necesitas ${nivel.puntos} puntos para este descuento y tienes ${saldo}.`
				);
			}

			// Los cupones se guardan con el código como id, así que un nombre
			// ya usado (por otra clienta o por una promoción de la tienda) no
			// se puede repetir sin pisar ese cupón.
			if (snapCupon.exists) {
				throw new ErrorCanje('Ese código ya existe. Prueba con otro nombre.');
			}

			transaccion.create(refCupon, {
				codigo,
				descripcion: `Canje de ${nivel.puntos} puntos Moon Beauty`,
				tipo: 'porcentaje',
				valor: nivel.porcentaje,
				metodosPago: METODOS_PAGO_EN_DIVISAS,
				activo: true,
				combinable: false,
				limiteUsos: 1,
				usos: 0,
				fechaVencimiento: null,
				usuarioId: uid,
				puntosCanjeados: nivel.puntos,
				creadoEn: FieldValue.serverTimestamp(),
				actualizadoEn: FieldValue.serverTimestamp()
			});

			transaccion.set(
				refPuntos,
				{
					saldo: saldo - nivel.puntos,
					canjeados: FieldValue.increment(nivel.puntos),
					actualizadoEn: FieldValue.serverTimestamp()
				},
				{ merge: true }
			);

			transaccion.create(refPuntos.collection('movimientos').doc(), {
				tipo: 'canjeados',
				puntos: -nivel.puntos,
				descripcion: `Código ${codigo} (${nivel.porcentaje}% de descuento)`,
				cupon: codigo,
				fecha: FieldValue.serverTimestamp()
			});

			return saldo - nivel.puntos;
		});

		return json({
			ok: true,
			codigo,
			porcentaje: nivel.porcentaje,
			saldo: saldoFinal
		});
	} catch (err) {
		if (err instanceof ErrorCanje) {
			return json({ ok: false, error: err.message }, { status: 400 });
		}

		console.error('Error canjeando puntos:', err);
		return json(
			{ ok: false, error: 'No se pudo completar el canje. Intenta de nuevo.' },
			{ status: 500 }
		);
	}
};
