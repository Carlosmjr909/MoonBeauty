<script lang="ts">
	import Icon from '@iconify/svelte';
	import Tarjeta from '$lib/components/tarjeta.svelte';
	import { animarGrilla } from '$lib/animarGrilla';

	let { data } = $props();

	const breadcrumbSchemaJson = $derived(
		JSON.stringify(data.breadcrumbSchema).replaceAll('<', '\\u003c')
	);

	type Orden = 'populares' | 'precio-asc' | 'precio-desc';

	const opcionesOrden: Array<{ valor: Orden; etiqueta: string }> = [
		{ valor: 'populares', etiqueta: 'Más populares' },
		{ valor: 'precio-asc', etiqueta: 'Precio: menor a mayor' },
		{ valor: 'precio-desc', etiqueta: 'Precio: mayor a menor' }
	];

	let orden = $state<Orden | null>(null);

	// Los disponibles primero; dentro de eso, el orden elegido.
	const productos = $derived.by(() => {
		const lista = [...data.productosMarca];

		if (orden === 'precio-asc') lista.sort((a, b) => a.precio - b.precio);
		else if (orden === 'precio-desc') lista.sort((a, b) => b.precio - a.precio);
		else if (orden === 'populares') lista.sort((a, b) => Number(b.popular) - Number(a.popular));

		return lista.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
	});

	let grilla = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const contenedor = grilla;
		void productos;
		if (!contenedor) return;
		return animarGrilla(contenedor);
	});
</script>

<svelte:head>
	<title>{data.marca.nombre} | Moon Beauty</title>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${breadcrumbSchemaJson}</scr` + `ipt>`}
</svelte:head>

<section class="bg-slate-50 px-5 py-12 sm:px-8 lg:px-14">
	<div class="mx-auto max-w-7xl">
		<a
			href="/marcas"
			class="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800"
		>
			<Icon icon="material-symbols:chevron-left-rounded" width="20" />
			Todas las marcas
		</a>

		<div class="mt-4 mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
			<div class="flex items-center gap-4 sm:gap-6">
				{#if data.marca.logo}
					<div
						class="flex h-20 w-28 shrink-0 items-center justify-center rounded-2xl bg-white p-3 ring-1 ring-slate-100 sm:h-24 sm:w-36"
					>
						<img
							src={data.marca.logo}
							alt=""
							class="max-h-full w-auto max-w-full object-contain"
						/>
					</div>
				{/if}

				<div class="min-w-0">
					<p
						class="font-Manrope text-sm font-bold uppercase tracking-[0.2em] text-sky-700"
					>
						Marca
					</p>
					<h1 class="mt-1 font-Manrope text-3xl text-slate-800 sm:text-4xl lg:text-5xl">
						{data.marca.nombre}
					</h1>
					<p class="mt-2 text-sm text-slate-500 sm:text-base">
						{data.productosMarca.length}
						{data.productosMarca.length === 1 ? 'producto' : 'productos'}
					</p>
				</div>
			</div>

			<label class="flex items-center gap-2 text-sm text-slate-600">
				<Icon icon="material-symbols:tune-rounded" width="18" />
				<span class="sr-only">Ordenar</span>
				<select
					bind:value={orden}
					class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition hover:border-sky-300 focus:border-sky-400"
				>
					<option value={null}>Ordenar por...</option>
					{#each opcionesOrden as opcion (opcion.valor)}
						<option value={opcion.valor}>{opcion.etiqueta}</option>
					{/each}
				</select>
			</label>
		</div>

		<div bind:this={grilla} class="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
			{#each productos as producto, indice (producto.id)}
				<Tarjeta
					{...producto}
					tasaBCV={data?.tasaBCV?.promedio ?? null}
					prioridad={indice < 4}
				/>
			{/each}
		</div>

		<div class="mt-12 text-center">
			<a
				href="/products"
				class="inline-flex min-h-12 items-center justify-center rounded-full bg-sky-200 px-8 py-3 font-Manrope font-semibold text-slate-600 transition hover:bg-slate-600 hover:text-white"
			>
				Ver todo el catálogo
			</a>
		</div>
	</div>
</section>
