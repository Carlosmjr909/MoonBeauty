<script lang="ts">
	import { browser } from '$app/environment';
	import type { ScrollTrigger } from 'gsap/ScrollTrigger';
	import Categoria from '$lib/components/categoria.svelte';
	import { categoriasDeProducto } from '$lib/inventario';
	import { descripcionCategoria } from '$lib/seo';

	// gsap y gsap/ScrollTrigger no traen "type": "module" en su package.json
	// y en el servidor (SSR en Vercel) Node no logra resolverlos bien vía
	// import estático. Como esta animación solo tiene sentido en el
	// navegador, se cargan de forma dinámica y solo del lado del cliente.
	let gsapModulo: typeof import('gsap')['gsap'] | null = null;
	let scrollTriggerModulo: typeof ScrollTrigger | null = null;

	const gsapCargado = browser
		? Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
				([mod, stMod]) => {
					gsapModulo = mod.gsap;
					scrollTriggerModulo = stMod.ScrollTrigger;
					gsapModulo.registerPlugin(scrollTriggerModulo);
				}
			)
		: Promise.resolve();

	let { data } = $props();

	let grillaCategorias = $state<HTMLDivElement | null>(null);

	const products = $derived(data.productos ?? []);
	const categoriasMetadata = $derived(data.categorias ?? []);

	const categorias = $derived.by(() => {
		const mapa = new Map<
			string,
			{
				nombre: string;
				descripcion: string;
				imagen: string;
				cantidad: number;
				href: string;
			}
		>();

		for (const categoria of categoriasMetadata) {
			const nombre = String(categoria.nombre ?? '').trim();
			if (!nombre) continue;
			mapa.set(nombre.toLowerCase(), {
				nombre,
				descripcion: categoria.descripcion || descripcionCategoria(nombre),
				imagen: categoria.imagen || '',
				cantidad: 0,
				href: `/products?categoria=${encodeURIComponent(nombre)}`
			});
		}

		// Un producto puede pertenecer a varias categorías, así que suma
		// en cada una de ellas.
		for (const product of products) {
			for (const nombreCategoria of categoriasDeProducto(product)) {
				const nombre = String(nombreCategoria ?? '').trim();
				if (!nombre) continue;

				const clave = nombre.toLowerCase();
				if (!mapa.has(clave)) {
					mapa.set(clave, {
						nombre,
						descripcion: descripcionCategoria(nombre),
						imagen: String(product.imagen ?? ''),
						cantidad: 0,
						href: `/products?categoria=${encodeURIComponent(nombre)}`
					});
				}

				const categoria = mapa.get(clave);
				if (categoria) {
					categoria.cantidad += 1;
					if (!categoria.imagen && product.imagen) {
						categoria.imagen = String(product.imagen);
					}
				}
			}
		}

		return [...mapa.values()];
	});

	// Entrada diagonal en cascada para las tarjetas de categoría. Las que
	// ya están a la vista al entrar animan de inmediato; el resto va
	// apareciendo con el mismo efecto a medida que se hace scroll hacia
	// ellas (ScrollTrigger las agrupa en "lotes" según van cruzando el
	// umbral de la pantalla).
	$effect(() => {
		const contenedor = grillaCategorias;
		categorias; // se lee para que el efecto se vuelva a ejecutar

		if (!contenedor) return;

		const tarjetas = Array.from(contenedor.children) as HTMLElement[];
		if (!tarjetas.length) return;

		let cancelado = false;
		let triggers: ScrollTrigger[] = [];

		gsapCargado.then(() => {
			if (cancelado || !gsapModulo || !scrollTriggerModulo) return;

			const prefiereMenosMovimiento = window.matchMedia(
				'(prefers-reduced-motion: reduce)'
			).matches;

			if (prefiereMenosMovimiento) {
				gsapModulo.set(tarjetas, { opacity: 1, x: 0, y: 0 });
				return;
			}

			gsapModulo.set(tarjetas, { opacity: 0, x: -40, y: 50 });

			triggers = scrollTriggerModulo.batch(tarjetas, {
				start: 'top 88%',
				once: true,
				onEnter: (lote) => {
					gsapModulo!.to(lote, {
						opacity: 1,
						x: 0,
						y: 0,
						duration: 0.8,
						ease: 'power3.out',
						stagger: 0.09
					});
				}
			});
		});

		return () => {
			cancelado = true;
			triggers.forEach((trigger) => trigger.kill());
		};
	});
</script>

<svelte:head>
	<title>Categorías | Moon Beauty</title>
</svelte:head>

<section class="bg-slate-50 px-5 py-12 sm:px-8 lg:px-14">
	<div class="mx-auto max-w-7xl">
		<div class="mb-8">
			<p class="font-Manrope text-3xl text-slate-800 sm:text-4xl lg:text-5xl">
				Categorías
			</p>
			<p class="mt-2 text-sm text-slate-500 sm:text-base">
				Explora por categoría y encuentra el cuidado ideal para tu rutina.
			</p>
		</div>

		{#if categorias.length > 0}
			<div
				bind:this={grillaCategorias}
				class="grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3"
			>
				{#each categorias as categoria}
					<Categoria
						nombre={categoria.nombre}
						descripcion={categoria.descripcion}
						imagen={categoria.imagen}
						cantidad={categoria.cantidad}
						href={categoria.href}
					/>
				{/each}
			</div>
		{:else}
			<div class="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
				<p class="text-xl text-slate-600">Todavía no hay categorías creadas.</p>
			</div>
		{/if}
	</div>
</section>
