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
		especificacion?: string;
		precio: number;
		imagen: string;
		id: number;
		OfertaEnDivisas?: number;
		tasaBCV?: number | null;
	}

	const {
		Tipo,
		Nombre,
		especificacion = '',
		precio,
		imagen,
		id,
		OfertaEnDivisas = 0,
		tasaBCV = null
	}: PropTypes = $props();

	const precioBolivares = $derived(
		tasaBCV
			? convertirUSDaVES(precio, tasaBCV)
			: null
	);

	let agregado = $state(false);

	function agregarAlCarrito(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		carrito.agregar(
			{
				id,
				Tipo,
				Nombre,
				imagen,
				precio,
				OfertaEnDivisas
			},
			1
		);

		agregado = true;

		setTimeout(() => {
			agregado = false;
		}, 1200);
	}
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
		</a>

		<button
			type="button"
			onclick={agregarAlCarrito}
			aria-label="Agregar {Nombre} al carrito"
			title="Agregar al carrito"
			class="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:scale-110 hover:bg-sky-100 active:scale-95"
		>
			{#if agregado}
				<Icon
					icon="material-symbols:check-rounded"
					width="24"
					class="text-green-600"
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
		<p class="text-sm text-slate-500">
			{Tipo}
		</p>

		<a
			href="/products/{id}"
			class="block font-PlayFair text-xl text-slate-700 transition hover:text-sky-700"
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