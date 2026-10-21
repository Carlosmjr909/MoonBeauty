import { derived, writable } from 'svelte/store';
import { browser } from '$app/environment';

import { carrito } from '$lib/cart.js';
import {
	calcularDescuentoRutina,
	esPreocupacion,
	esTipoPiel,
	type RutinaElegida
} from '$lib/rutinas';

/**
 * La última rutina armada en "Encuentra tu rutina ideal". Se guarda en el
 * navegador para que el carrito y el checkout sepan qué productos forman
 * la rutina y muestren el 10 %. El descuento real lo vuelve a calcular el
 * servidor al crear el pedido.
 */

const CLAVE = 'moonbeauty-rutina';

function leerGuardada(): RutinaElegida | null {
	try {
		const datos = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
		if (!datos || !esTipoPiel(datos.tipoPiel) || !esPreocupacion(datos.preocupacion)) return null;
		if (!datos.ids || typeof datos.ids !== 'object') return null;
		return { tipoPiel: datos.tipoPiel, preocupacion: datos.preocupacion, ids: datos.ids };
	} catch {
		return null;
	}
}

export const rutinaGuardada = writable<RutinaElegida | null>(browser ? leerGuardada() : null);

if (browser) {
	rutinaGuardada.subscribe((rutina) => {
		try {
			if (rutina) localStorage.setItem(CLAVE, JSON.stringify(rutina));
			else localStorage.removeItem(CLAVE);
		} catch {
			// Sin almacenamiento (modo privado): la rutina vale mientras la página siga abierta.
		}
	});
}

/** Rutinas completas en el carrito y su descuento (0 si no hay ninguna). */
export const descuentoRutina = derived([carrito, rutinaGuardada], ([$carrito, $rutina]) =>
	$rutina
		? calcularDescuentoRutina(
				$carrito ?? [],
				Object.values($rutina.ids).filter((id): id is string => Boolean(id))
			)
		: { rutinas: 0, descuentoUSD: 0 }
);
