<script lang="ts">
	import { onDestroy } from "svelte";
	import Icon from "@iconify/svelte";
	import { escucharResenas, type Resena } from "$lib/resenas";
	import { formatearFecha } from "$lib/utils/moneda";

	let resenas = $state<Resena[]>([]);
	let cargando = $state(true);
	let error = $state("");

	const detener = escucharResenas(
		(datos) => {
			resenas = datos;
			cargando = false;
		},
		(err) => {
			error = `No se pudieron cargar las reseñas: ${err.message}`;
			cargando = false;
		},
	);

	onDestroy(() => detener());

	type ResumenProducto = {
		productoId: string;
		nombre: string;
		marca: string;
		cantidad: number;
		promedio: number;
	};

	const resumenPorProducto = $derived.by<ResumenProducto[]>(() => {
		const mapa = new Map<
			string,
			{ nombre: string; marca: string; cantidad: number; suma: number }
		>();

		for (const resena of resenas) {
			const actual = mapa.get(resena.productoId) ?? {
				nombre: resena.productoNombre,
				marca: resena.marca,
				cantidad: 0,
				suma: 0,
			};

			actual.cantidad += 1;
			actual.suma += resena.calificacion;
			mapa.set(resena.productoId, actual);
		}

		return [...mapa.entries()]
			.map(([productoId, datos]) => ({
				productoId,
				nombre: datos.nombre,
				marca: datos.marca,
				cantidad: datos.cantidad,
				promedio: datos.suma / datos.cantidad,
			}))
			.sort((a, b) => b.cantidad - a.cantidad);
	});

	const totalResenas = $derived(resenas.length);
	const promedioGeneral = $derived(
		totalResenas > 0
			? resenas.reduce((suma, r) => suma + r.calificacion, 0) / totalResenas
			: 0,
	);
</script>

<svelte:head>
	<title>Reseñas de productos | Panel MoonBeauty</title>
</svelte:head>

<h1 class="font-Manrope text-2xl font-semibold text-slate-800 dark:text-white">
	Reseñas de productos
</h1>
<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
	Calificaciones internas de 1 a 5 estrellas. No se muestran en el sitio
	público, solo la cantidad total en cada producto.
</p>

{#if error}
	<p
		class="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
	>
		{error}
	</p>
{:else if cargando}
	<p class="mt-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
{:else if totalResenas === 0}
	<p
		class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/5 dark:bg-[#141a2e] dark:text-slate-400"
	>
		Todavía no hay reseñas registradas.
	</p>
{:else}
	<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div
			class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-[#141a2e]"
		>
			<p
				class="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500"
			>
				Total de reseñas
			</p>
			<p class="mt-2 font-Manrope text-2xl font-semibold text-slate-800 dark:text-white">
				{totalResenas}
			</p>
		</div>

		<div
			class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-[#141a2e]"
		>
			<p
				class="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500"
			>
				Promedio general
			</p>
			<div class="mt-2 flex items-center gap-2">
				<p class="font-Manrope text-2xl font-semibold text-slate-800 dark:text-white">
					{promedioGeneral.toFixed(1)}
				</p>
				<Icon
					icon="material-symbols:star-rounded"
					width="20"
					class="text-amber-400"
				/>
			</div>
		</div>
	</div>

	<div
		class="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/5 dark:bg-[#141a2e]"
	>
		<p
			class="px-5 pt-5 text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500"
		>
			Por producto
		</p>

		<table class="mt-3 w-full min-w-[520px] text-left text-sm">
			<thead>
				<tr class="border-b border-slate-100 text-slate-400 dark:border-white/5 dark:text-slate-500">
					<th class="px-5 py-2 font-medium">Producto</th>
					<th class="px-5 py-2 font-medium">Marca</th>
					<th class="px-5 py-2 font-medium">Reseñas</th>
					<th class="px-5 py-2 font-medium">Promedio</th>
				</tr>
			</thead>
			<tbody>
				{#each resumenPorProducto as fila (fila.productoId)}
					<tr class="border-b border-slate-50 last:border-none dark:border-white/5">
						<td class="px-5 py-3 text-slate-700 dark:text-slate-200">
							<a
								href="/products/{fila.productoId}"
								target="_blank"
								class="hover:underline"
							>
								{fila.nombre}
							</a>
						</td>
						<td class="px-5 py-3 text-slate-500 dark:text-slate-400">
							{fila.marca}
						</td>
						<td class="px-5 py-3 text-slate-700 dark:text-slate-200">
							{fila.cantidad}
						</td>
						<td class="px-5 py-3">
							<span class="flex items-center gap-1 text-slate-700 dark:text-slate-200">
								{fila.promedio.toFixed(1)}
								<Icon
									icon="material-symbols:star-rounded"
									width="16"
									class="text-amber-400"
								/>
							</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div
		class="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/5 dark:bg-[#141a2e]"
	>
		<p
			class="px-5 pt-5 text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500"
		>
			Últimas reseñas
		</p>

		<table class="mt-3 w-full min-w-[520px] text-left text-sm">
			<thead>
				<tr class="border-b border-slate-100 text-slate-400 dark:border-white/5 dark:text-slate-500">
					<th class="px-5 py-2 font-medium">Producto</th>
					<th class="px-5 py-2 font-medium">Calificación</th>
					<th class="px-5 py-2 font-medium">Fecha</th>
				</tr>
			</thead>
			<tbody>
				{#each resenas as resena (resena.id)}
					<tr class="border-b border-slate-50 last:border-none dark:border-white/5">
						<td class="px-5 py-3 text-slate-700 dark:text-slate-200">
							{resena.productoNombre}
						</td>
						<td class="px-5 py-3">
							<div class="flex items-center gap-0.5">
								{#each [1, 2, 3, 4, 5] as estrella}
									<Icon
										icon={estrella <= resena.calificacion
											? "material-symbols:star-rounded"
											: "material-symbols:star-outline-rounded"}
										width="16"
										class={estrella <= resena.calificacion
											? "text-amber-400"
											: "text-slate-300 dark:text-slate-600"}
									/>
								{/each}
							</div>
						</td>
						<td class="px-5 py-3 text-slate-500 dark:text-slate-400">
							{resena.fecha ? formatearFecha(new Date(resena.fecha).toISOString()) : "—"}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
