<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import type { ScrollTrigger } from 'gsap/ScrollTrigger';
	import Icon from '@iconify/svelte';
	import Tarjeta from '$lib/components/tarjeta.svelte';
	import { productoEnCategoria } from '$lib/inventario';

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

	let grillaProductos = $state<HTMLDivElement | null>(null);

	const products = $derived(data.productos ?? []);
	const categoriaSeleccionada = $derived(
		page.url.searchParams.get('categoria')?.trim() ?? ''
	);

	// Un producto puede estar en varias categorías, así que aparece en el
	// filtro si cualquiera de ellas coincide.
	const productosBase = $derived(
		categoriaSeleccionada
			? products.filter((product) =>
					productoEnCategoria(product, categoriaSeleccionada)
				)
			: products
	);

	type Orden = 'populares' | 'precio-asc' | 'precio-desc';

	const opcionesOrden: Array<{ valor: Orden; etiqueta: string }> = [
		{ valor: 'populares', etiqueta: 'Más populares' },
		{ valor: 'precio-asc', etiqueta: 'Precio: menor a mayor' },
		{ valor: 'precio-desc', etiqueta: 'Precio: mayor a menor' }
	];

	let ordenSeleccionado = $state<Orden | null>(null);
	let filtroAbierto = $state(false);

	const productosOrdenados = $derived.by(() => {
		const lista = [...productosBase];

		if (ordenSeleccionado === 'precio-asc') {
			lista.sort((a, b) => a.precio - b.precio);
		} else if (ordenSeleccionado === 'precio-desc') {
			lista.sort((a, b) => b.precio - a.precio);
		} else if (ordenSeleccionado === 'populares') {
			lista.sort((a, b) => Number(b.popular) - Number(a.popular));
		}

		return lista;
	});

	function elegirOrden(valor: Orden) {
		ordenSeleccionado = ordenSeleccionado === valor ? null : valor;
		filtroAbierto = false;
	}

	function quitarOrden() {
		ordenSeleccionado = null;
		filtroAbierto = false;
	}

	// Entrada diagonal en cascada para las tarjetas de producto. Las que
	// ya están a la vista al entrar animan de inmediato; el resto va
	// apareciendo con el mismo efecto a medida que se hace scroll hacia
	// ellas (ScrollTrigger las agrupa en "lotes" según van cruzando el
	// umbral de la pantalla).
	$effect(() => {
		const contenedor = grillaProductos;
		productosOrdenados; // se lee para que el efecto se vuelva a ejecutar

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
	<title>
		{categoriaSeleccionada
			? `${categoriaSeleccionada} | Moon Beauty`
			: 'Productos | Moon Beauty'}
	</title>
</svelte:head>

<section class="bg-slate-50 px-5 py-12 sm:px-8 lg:px-14">
	<div class="mx-auto max-w-7xl">
		<div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<p class="font-Manrope text-3xl text-slate-800 sm:text-4xl lg:text-5xl">
					Productos
				</p>
				<p class="mt-2 text-sm text-slate-500 sm:text-base">
					{#if categoriaSeleccionada}
						Categoría: <span class="font-semibold text-slate-700">{categoriaSeleccionada}</span>
					{:else}
						Explora todo nuestro catálogo de skincare coreano.
					{/if}
				</p>
			</div>

			<div class="flex items-center gap-3">
				{#if categoriaSeleccionada}
					<a
						href="/products"
						class="inline-flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
					>
						<span aria-hidden="true">←</span>
						Ver todos los productos
					</a>
				{/if}

				<div class="relative">
					<button
						type="button"
						onclick={() => (filtroAbierto = !filtroAbierto)}
						aria-expanded={filtroAbierto}
						class="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
						class:border-sky-400={Boolean(ordenSeleccionado)}
						class:text-sky-700={Boolean(ordenSeleccionado)}
					>
						<Icon icon="material-symbols:tune-rounded" width="18" />
						Filtros
						{#if ordenSeleccionado}
							<span
								class="flex h-5 w-5 items-center justify-center rounded-full bg-sky-200 text-xs font-bold text-slate-700"
							>
								1
							</span>
						{/if}
					</button>

					{#if filtroAbierto}
						<button
							type="button"
							aria-label="Cerrar filtros"
							class="fixed inset-0 z-10 cursor-default"
							onclick={() => (filtroAbierto = false)}
						></button>

						<div
							class="absolute left-0 z-20 mt-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200 lg:left-auto lg:right-0"
						>
							{#each opcionesOrden as opcion}
								<button
									type="button"
									onclick={() => elegirOrden(opcion.valor)}
									class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
									class:bg-sky-50={ordenSeleccionado === opcion.valor}
									class:text-sky-700={ordenSeleccionado === opcion.valor}
								>
									{opcion.etiqueta}
									{#if ordenSeleccionado === opcion.valor}
										<Icon icon="material-symbols:check-rounded" width="18" />
									{/if}
								</button>
							{/each}

							{#if ordenSeleccionado}
								<button
									type="button"
									onclick={quitarOrden}
									class="mt-1 w-full rounded-xl px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
								>
									Quitar filtro
								</button>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if productosOrdenados.length > 0}
			<div
				bind:this={grillaProductos}
				class="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4"
			>
				{#each productosOrdenados as product (product.id)}
					<Tarjeta
						{...product}
						tasaBCV={data?.tasaBCV?.promedio ?? null}
						etiquetaSuperior="marca"
					/>
				{/each}
			</div>
		{:else}
			<div class="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
				<p class="text-xl text-slate-600">
					{categoriaSeleccionada
						? 'No hay productos en esta categoría por el momento.'
						: 'Todavía no hay productos en el catálogo.'}
				</p>
			</div>
		{/if}
	</div>
</section>
