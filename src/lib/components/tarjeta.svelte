<script lang="ts">
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
		tasaBCV?: number | null;
	}

	const {
		Tipo,
		Nombre,
		especificacion = '',
		precio,
		imagen,
		id,
		tasaBCV = null
	}: PropTypes = $props();

	const precioBolivares = $derived(
		tasaBCV ? convertirUSDaVES(precio, tasaBCV) : null
	);
</script>

<a href="/products/{id}" class="block">
<div>

		<div class="apect-[4/5] overflow-hidden rounded-2xl flex">
			<img
				src={imagen}
				alt={Nombre}
				class="h-full w-full transition-transform duration-500 hover:scale-120"
			/>
		</div>

		<div class="space-y-1 py-4">
			<p class="text-sm text-slate-500">
				{Tipo}
			</p>

			<p class="font-PlayFair text-xl text-slate-700">
				{Nombre}
			</p>

			{#if especificacion}
				<p class="text-sm text-slate-400">
					{especificacion}
				</p>
			{/if}

			<p class="text-lg font-bold text-slate-700">
				{formatearUSD(precio)}
			</p>

			{#if precioBolivares}
				<p class="font-semibold text-sky-700">
					{formatearVES(precioBolivares)}
				</p>
			{/if}

		</div>
	</div>
</a>