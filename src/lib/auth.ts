import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '$lib/firebase';

export const usuario = writable<User | null>(null);
export const autenticacionCargando = writable(true);

if (browser) {
	onAuthStateChanged(auth, (usuarioFirebase) => {
		usuario.set(usuarioFirebase);
		autenticacionCargando.set(false);
	});
}