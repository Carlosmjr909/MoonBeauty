import type { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Entrada diagonal en cascada para las tarjetas de una grilla, la misma
 * de /products y /categorias: las que ya están a la vista animan de
 * inmediato y el resto aparece a medida que se hace scroll hacia ellas.
 * Devuelve la función que limpia los disparadores.
 *
 * gsap se carga de forma dinámica porque en el servidor (SSR en Vercel)
 * Node no resuelve bien su import estático; esto solo corre en el
 * navegador.
 */
export function animarGrilla(contenedor: HTMLElement): () => void {
	const tarjetas = Array.from(contenedor.children) as HTMLElement[];
	if (!tarjetas.length) return () => {};

	let cancelado = false;
	let disparadores: ScrollTrigger[] = [];

	Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
		([{ gsap }, { ScrollTrigger: Disparador }]) => {
			if (cancelado) return;
			gsap.registerPlugin(Disparador);

			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				gsap.set(tarjetas, { opacity: 1, x: 0, y: 0 });
				return;
			}

			gsap.set(tarjetas, { opacity: 0, x: -40, y: 50 });

			disparadores = Disparador.batch(tarjetas, {
				start: 'top 88%',
				once: true,
				onEnter: (lote) => {
					gsap.to(lote, {
						opacity: 1,
						x: 0,
						y: 0,
						duration: 0.8,
						ease: 'power3.out',
						stagger: 0.09
					});
				}
			});
		}
	);

	return () => {
		cancelado = true;
		disparadores.forEach((disparador) => disparador.kill());
	};
}
