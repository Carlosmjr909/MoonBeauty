import {
	cert,
	getApps,
	initializeApp
} from 'firebase-admin/app';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import {
	FIREBASE_ADMIN_CLIENT_EMAIL,
	FIREBASE_ADMIN_PRIVATE_KEY,
	FIREBASE_ADMIN_PROJECT_ID
} from '$env/static/private';

function obtenerClavePrivada(): string {
	if (!FIREBASE_ADMIN_PRIVATE_KEY) {
		throw new Error(
			'Falta FIREBASE_ADMIN_PRIVATE_KEY en las variables de entorno.'
		);
	}

	return FIREBASE_ADMIN_PRIVATE_KEY.replace(
		/\\n/g,
		'\n'
	);
}

function inicializarFirebaseAdmin() {
	if (getApps().length > 0) {
		return getApps()[0];
	}

	if (
		!FIREBASE_ADMIN_PROJECT_ID ||
		!FIREBASE_ADMIN_CLIENT_EMAIL
	) {
		throw new Error(
			'Faltan las variables privadas de Firebase Admin.'
		);
	}

	return initializeApp({
		credential: cert({
			projectId:
				FIREBASE_ADMIN_PROJECT_ID,

			clientEmail:
				FIREBASE_ADMIN_CLIENT_EMAIL,

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