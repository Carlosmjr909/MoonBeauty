import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { env } from '$env/dynamic/public';
import type { Auth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
	apiKey: env.PUBLIC_FIREBASE_API_KEY!,
	authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN!,
	projectId: env.PUBLIC_FIREBASE_PROJECT_ID!,
	storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET!,
	messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
	appId: env.PUBLIC_FIREBASE_APP_ID!
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

let promesaAuth: Promise<Auth> | undefined;

/**
 * Firebase Auth se carga bajo demanda: llamar a getAuth() dispara la
 * descarga de su iframe de sincronización entre pestañas (~289KB) y del
 * SDK de acceso con Google (~122KB), que nadie necesita hasta que alguien
 * realmente inicia sesión, crea una cuenta o entra al panel. Cargarlo de
 * una vez en cada página (incluida la portada, vía el store de $lib/auth)
 * competía por CPU con el contenido principal en móviles y le impedía a
 * Lighthouse medir el LCP.
 */
export function obtenerAuth(): Promise<Auth> {
	if (!promesaAuth) {
		promesaAuth = import('firebase/auth').then(({ getAuth }) => getAuth(app));
	}
	return promesaAuth;
}

let promesaGoogleProvider: Promise<GoogleAuthProvider> | undefined;

export function obtenerGoogleProvider(): Promise<GoogleAuthProvider> {
	if (!promesaGoogleProvider) {
		promesaGoogleProvider = import('firebase/auth').then(
			({ GoogleAuthProvider }) => new GoogleAuthProvider()
		);
	}
	return promesaGoogleProvider;
}