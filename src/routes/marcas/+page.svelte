<script lang="ts">
	import { animarGrilla } from '$lib/animarGrilla';

	let { data } = $props();

	const breadcrumbSchemaJson = $derived(
		JSON.stringify(data.breadcrumbSchema).replaceAll('<', '\\u003c')
	);

	let grilla = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const contenedor = grilla;
		void data.marcas;
		if (!contenedor) return;
		return animarGrilla(contenedor);
	});
</script>

<svelte:head>
	<title>Marcas | Moon Beauty</title>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${breadcrumbSchemaJson}</scr` + `ipt>`}
</svelte:head>

<section class="bg-slate-50 px-5 py-12 sm:px-8 lg:px-14">
	<div class="mx-auto max-w-7xl">
		<div class="mb-8">
			<h1 class="font-Manrope text-3xl text-slate-800 sm:text-4xl lg:text-5xl">Marcas</h1>
			<p class="mt-2 text-sm text-slate-500 sm:text-base">
				{data.marcas.length} marcas de skincare coreano. Elige una para ver todos sus productos.
			</p>
		</div>

		{#if data.marcas.length > 0}
			<div
				bind:this={grilla}
				class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4"
			>
				{#each data.marcas as marca (marca.slug)}
					<a
						href="/marcas/{marca.slug}"
						class="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
					>
						<div class="flex aspect-[4/3] items-center justify-center bg-white p-5">
							{#if marca.logo}
								<img
									src={marca.logo}
									alt={marca.nombre}
									loading="lazy"
									class="max-h-full w-auto max-w-full object-contain transition duration-500 group-hover:scale-105"
								/>
							{:else if marca.muestras.length > 0}
								<div class="flex -space-x-5">
									{#each marca.muestras as imagen, indice (indice)}
										<img
											src={imagen}
											alt=""
											loading="lazy"
											class="h-16 w-16 rounded-2xl object-cover ring-4 ring-white transition duration-500 sm:h-20 sm:w-20 group-hover:scale-105"
										/>
									{/each}
								</div>
							{/if}
						</div>

						<div class="flex flex-1 items-end justify-between gap-2 border-t border-slate-100 px-4 py-3">
							<div class="min-w-0">
								<p class="truncate font-Manrope text-base font-semibold text-slate-700 sm:text-lg">
									{marca.nombre}
								</p>
								<p class="text-xs text-slate-500 sm:text-sm">
									{marca.cantidad}
									{marca.cantidad === 1 ? 'producto' : 'productos'}
								</p>
							</div>
							<span
								aria-hidden="true"
								class="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-700"
							>
								→
							</span>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
				<p class="text-xl text-slate-600">Todavía no hay marcas en el catálogo.</p>
			</div>
		{/if}
	</div>
</section>
