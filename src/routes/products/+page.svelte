<script lang="ts">
	import { page } from '$app/state';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import Categoria from '$lib/components/categoria.svelte';
	import Tarjeta from '$lib/components/tarjeta.svelte';

	gsap.registerPlugin(ScrollTrigger);

	let { data } = $props();

	let grillaCategorias = $state<HTMLDivElement | null>(null);
	let grillaProductos = $state<HTMLDivElement | null>(null);

	const products = $derived(data.productos ?? []);
	const categoriasMetadata = $derived(data.categorias ?? []);
	const categoriaSeleccionada = $derived(
		page.url.searchParams.get('categoria')?.trim() ?? ''
	);

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

		for (const product of products) {
			const nombreTipo = String(product.Tipo ?? '').trim();
			if (!nombreTipo) continue;

			const clave = nombreTipo.toLowerCase();
			if (!mapa.has(clave)) {
				mapa.set(clave, {
					nombre: nombreTipo,
					descripcion: descripcionCategoria(nombreTipo),
					imagen: String(product.imagen ?? ''),
					cantidad: 0,
					href: `/products?categoria=${encodeURIComponent(nombreTipo)}`
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

		return [...mapa.values()];
	});

	const productosFiltrados = $derived(
		categoriaSeleccionada
			? products.filter(
					(product) =>
						String(product.Tipo ?? '').trim().toLowerCase() ===
						categoriaSeleccionada.toLowerCase()
			  )
			: []
	);

	function descripcionCategoria(tipo: string) {
		switch (tipo.toLowerCase()) {
			case 'protector solar':
				return 'Protección diaria con fórmulas ligeras, confortables y preparadas para pieles sensibles y con cobertura de alto nivel.';
			case 'balsamo labial':
				return 'Bálsamos y tintes para labios con hidratación intensa, brillo y un acabado suave, natural y cuidado constante.';
			case 'mascarilla facial':
				return 'Mascarillas y tratamientos faciales para calmar, hidratar y revitalizar la piel con una rutina efectiva.';
			default:
				return 'Productos pensados para mantener la piel fresca, cuidada y con un look luminoso y saludable.';
		}
	}

	// Entrada diagonal en cascada para las tarjetas de la grilla visible
	// (categorías o productos de una categoría). Las que ya están a la
	// vista al entrar animan de inmediato; el resto va apareciendo con el
	// mismo efecto a medida que se hace scroll hacia ellas (ScrollTrigger
	// las agrupa en "lotes" según van cruzando el umbral de la pantalla).
	$effect(() => {
		const contenedor = categoriaSeleccionada
			? grillaProductos
			: grillaCategorias;

		// Se leen para que el efecto se vuelva a ejecutar cuando cambien.
		categoriaSeleccionada;
		categorias;
		productosFiltrados;

		if (!contenedor) return;

		const tarjetas = Array.from(contenedor.children) as HTMLElement[];
		if (!tarjetas.length) return;

		const prefiereMenosMovimiento = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;

		if (prefiereMenosMovimiento) {
			gsap.set(tarjetas, { opacity: 1, x: 0, y: 0 });
			return;
		}

		gsap.set(tarjetas, { opacity: 0, x: -40, y: 50 });

		const triggers = ScrollTrigger.batch(tarjetas, {
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

		return () => {
			triggers.forEach((trigger) => trigger.kill());
		};
	});
</script>

<section class="bg-slate-50 px-5 py-12 sm:px-8 lg:px-14">
	<div class="mx-auto max-w-7xl">
		<div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<p class="font-Mendigo text-3xl text-slate-800 sm:text-4xl lg:text-5xl">
					Categorias
				</p>
				<p class="mt-2 text-sm text-slate-500 sm:text-base">
					Explora por categoría y encuentra el cuidado ideal para tu rutina.
				</p>
			</div>

			{#if categoriaSeleccionada}
				<a
					href="/products"
					class="inline-flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
				>
					<span aria-hidden="true">←</span>
					Ver todas las categorías
				</a>
			{/if}
		</div>

		{#if categoriaSeleccionada}
			<div class="mb-6">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
					Categoría
				</p>
				<h2 class="mt-2 font-Mendigo text-3xl text-slate-800 sm:text-4xl">
					{categoriaSeleccionada}
				</h2>
			</div>

			{#if productosFiltrados.length > 0}
				<div
					bind:this={grillaProductos}
					class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
				>
					{#each productosFiltrados as product}
						<Tarjeta
							{...product}
							tasaBCV={data?.tasaBCV?.promedio ?? null}
						/>
					{/each}
				</div>
			{:else}
				<div class="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
					<p class="text-xl text-slate-600">No hay productos en esta categoría por el momento.</p>
				</div>
			{/if}
		{:else}
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
		{/if}
	</div>
</section>
