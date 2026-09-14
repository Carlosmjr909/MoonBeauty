import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';

export const usuario = writable<User | null>(null);
export const autenticacionCargando = writable(true);

if (browser) {
	// Se arranca en un momento de inactividad del navegador, no apenas
	// carga la página: así Firebase Auth (ver obtenerAuth en $lib/firebase)
	// no compite por CPU con el primer pintado. El estado de sesión llega
	// unos milisegundos más tarde nada más; todo lo que depende de
	// "autenticacionCargando" (el guard de /admin, la redirección de
	// /account) ya está preparado para esperar a que termine.
	const iniciar = async () => {
		const [{ onAuthStateChanged }, { obtenerAuth }] = await Promise.all([
			import('firebase/auth'),
			import('$lib/firebase')
		]);
		const auth = await obtenerAuth();

		onAuthStateChanged(auth, (usuarioFirebase) => {
			usuario.set(usuarioFirebase);
			autenticacionCargando.set(false);
		});
	};

	if ('requestIdleCallback' in window) {
		requestIdleCallback(iniciar);
	} else {
		setTimeout(iniciar, 1);
	}
}