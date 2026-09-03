import {
	cert,
	getApps,
	initializeApp
} from 'firebase-admin/app';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { env } from '$env/dynamic/private';

/**
 * Obtiene la clave privada del service account. Acepta dos formatos:
 *
 * - FIREBASE_ADMIN_PRIVATE_KEY_BASE64: la clave completa codificada en
 *   base64 (recomendado para plataformas como Vercel, donde pegar la
 *   clave PEM con "\n" literales es propenso a romperse en la UI).
 * - FIREBASE_ADMIN_PRIVATE_KEY: la clave PEM con saltos de línea escapados
 *   como "\n" (formato usado en el .env local).
 */
function obtenerClavePrivada(): string {
	const claveBase64 = env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64;

	if (claveBase64) {
		return Buffer.from(claveBase64, 'base64').toString('utf8');
	}

	const claveEscapada = env.FIREBASE_ADMIN_PRIVATE_KEY;

	if (!claveEscapada) {
		throw new Error(
			'Falta FIREBASE_ADMIN_PRIVATE_KEY (o FIREBASE_ADMIN_PRIVATE_KEY_BASE64) en las variables de entorno.'
		);
	}

	return claveEscapada.replace(/\\n/g, '\n');
}

function inicializarFirebaseAdmin() {
	if (getApps().length > 0) {
		return getApps()[0];
	}

	if (
		!env.FIREBASE_ADMIN_PROJECT_ID ||
		!env.FIREBASE_ADMIN_CLIENT_EMAIL
	) {
		throw new Error(
			'Faltan las variables privadas de Firebase Admin.'
		);
	}

	return initializeApp({
		credential: cert({
			projectId:
				env.FIREBASE_ADMIN_PROJECT_ID,

			clientEmail:
				env.FIREBASE_ADMIN_CLIENT_EMAIL,

			privateKey:
				obtenerClavePrivada()
		})
	});
}

export const firebaseAdminApp =
	inicializarFirebaseAdmin();

export const adminAuth =
	getAuth(firebaseAdminApp);

export const adminDb =
	getFirestore(firebaseAdminApp);
