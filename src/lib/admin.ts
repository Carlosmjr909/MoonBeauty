import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '$lib/firebase';
import { usuario } from '$lib/auth';

export const esAdmin = writable<boolean>(false);
export const esAdminCargando = writable<boolean>(true);

if (browser) {
	usuario.subscribe(async (usuarioActual) => {
		esAdminCargando.set(true);

		if (!usuarioActual) {
			esAdmin.set(false);
			esAdminCargando.set(false);
			return;
		}

		try {
			const referencia = doc(db, 'admins', usuarioActual.uid);
			const snap = await getDoc(referencia);
			esAdmin.set(snap.exists());
		} catch (error) {
			console.error('Error verificando permisos de admin:', error);
			esAdmin.set(false);
		} finally {
			esAdminCargando.set(false);
		}
	});
}
