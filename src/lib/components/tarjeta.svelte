<script lang="ts">
	import Icon from '@iconify/svelte';
	import { carrito } from '$lib/cart.js';

	import {
		convertirUSDaVES,
		formatearUSD,
		formatearVES
	} from '$lib/utils/moneda';

	interface PropTypes {
		Tipo: string;
		Nombre: string;
		marca?: string | null;
		especificacion?: string;
		precio: number;
		imagen: string;
		id: string | number;
		OfertaEnDivisas?: number;
		tasaBCV?: number | null;
		stock?: number;
		/** Qué mostrar como etiqueta pequeña arriba del nombre. */
		etiquetaSuperior?: 'tipo' | 'marca';
	}

	const {
		Tipo,
		Nombre,
		marca = '',
		especificacion = '',
		precio,
		imagen,
		id,
		OfertaEnDivisas = 0,
		tasaBCV = null,
		stock = 1,
		etiquetaSuperior = 'tipo'
	}: PropTypes = $props();

	const etiqueta = $derived(
		etiquetaSuperior === 'marca' && marca ? marca : Tipo
	);

	const agotado = $derived(stock <= 0);

	const precioBolivares = $derived(
		tasaBCV
			? convertirUSDaVES(precio, tasaBCV)
			: null
	);

	let agregado = $state(false);
	let sinCupo = $state(false);

	const agregarAlCarrito = () => {
		const seAgrego = carrito.agregar(
			{
				id,
				Tipo,
				Nombre,
				imagen,
				precio,
				stock
			},
			1
		);

		if (seAgrego) {
			agregado = true;
			setTimeout(() => {
				agregado = false;
			}, 1200);
		} else {
			sinCupo = true;
			setTimeout(() => {
				sinCupo = false;
			}, 1500);
		}
	};
</script>

<article class="group">
	<div class="relative overflow-hidden rounded-2xl bg-white">
		<a
			href="/products/{id}"
			aria-label="Ver {Nombre}"
			class="block"
		>
			<div class="aspect-4/5 overflow-hidden">
				<img
					src={imagen}
					alt={Nombre}
					class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
				/>
			</div>

			{#if agotado}
				<span
					class="absolute left-4 top-4 rounded-full bg-slate-900/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm"
				>
					Agotado
				</span>
			{/if}
		</a>

		<button
			type="button"
			onclick={agregarAlCarrito}
			disabled={agotado}
			aria-label={agotado
				? `${Nombre} sin stock`
				: `Agregar ${Nombre} al carrito`}
			title={agotado ? 'Sin stock' : 'Agregar al carrito'}
			class="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:scale-110 hover:bg-sky-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-white"
		>
			{#if agregado}
				<Icon
					icon="material-symbols:check-rounded"
					width="24"
					class="text-green-600"
				/>
			{:else if sinCupo}
				<Icon
					icon="material-symbols:production-quantity-limits"
					width="20"
					class="text-amber-600"
				/>
			{:else}
				<Icon
					icon="material-symbols:add-rounded"
					width="27"
				/>
			{/if}
		</button>
	</div>

	<div class="space-y-1 py-4">
		<p class="text-sm text-slate-500 font-Manrope">
			{etiqueta}
		</p>

		<a
			href="/products/{id}"
			class="block font-Manrope text-xl text-slate-700 transition hover:text-sky-700"
		>
			{Nombre}
		</a>

		{#if especificacion}
			<p class="text-sm text-slate-400">
				{especificacion}
			</p>
		{/if}

		<p class="text-lg font-bold text-slate-700">
			{formatearUSD(precio)}
		</p>

		{#if precioBolivares !== null}
			<p class="font-semibold text-sky-700">
				{formatearVES(precioBolivares)}
			</p>
		{/if}
	</div>
</article>