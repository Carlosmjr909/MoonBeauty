<script lang="ts">
	import { page } from "$app/state";
	import {
		convertirUSDaVES,
		formatearUSD,
		formatearVES,
		formatearFecha,
	} from "$lib/utils/moneda";
	import { carrito } from "$lib/cart";

	let { data } = $props();

	const product = $derived(
		(data.productos ?? []).find(
			(producto) => producto.id === page.params.id,
		),
	);

	const precioBolivares = $derived(
		product && data.tasaBCV
			? convertirUSDaVES(product.precio, data.tasaBCV.promedio)
			: null,
	);

	let cantidad = $state(1);
	let mensaje = $state("");

	const agotado = $derived((product?.stock ?? 0) <= 0);

	function restar() {
		if (cantidad > 1) {
			cantidad--;
		}
	}

	function sumar() {
		if (product && cantidad >= product.stock) {
			return;
		}
		cantidad++;
	}

	function agregarAlCarrito() {
		if (!product || agotado) {
			return;
		}

		const seAgrego = carrito.agregar(product, cantidad);

		mensaje = seAgrego
			? `${cantidad} producto${cantidad > 1 ? "s" : ""} agregado${cantidad > 1 ? "s" : ""} al carrito`
			: `Solo queda${product.stock === 1 ? "" : "n"} ${product.stock} unidad${product.stock === 1 ? "" : "es"} disponible${product.stock === 1 ? "" : "s"} de este producto.`;

		cantidad = 1;

		setTimeout(() => {
			mensaje = "";
		}, 2500);
	}

	let zoomActivo = $state(false);
	let posicionX = $state(50);
	let posicionY = $state(50);

	function moverZoom(event: MouseEvent) {
		const elemento = event.currentTarget as HTMLElement;
		const rectangulo = elemento.getBoundingClientRect();

		posicionX =
			((event.clientX - rectangulo.left) / rectangulo.width) * 100;
		posicionY =
			((event.clientY - rectangulo.top) / rectangulo.height) * 100;
	}

	function activarZoom() {
		zoomActivo = true;
	}

	function desactivarZoom() {
		zoomActivo = false;
		posicionX = 50;
		posicionY = 50;
	}
</script>

<section class="bg-gray-50">
	{#if product}
		<div
			class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8
		sm:px-6
		md:gap-10 md:px-8
		lg:flex-row lg:items-start lg:gap-14 lg:px-12 lg:py-16
		xl:gap-20
		2xl:max-w-[1600px]"
		>
			<div
				role="presentation"
				class="relative h-180 flex-1 cursor-zoom-in overflow-hidden rounded-3xl hover:border hover:border-black/40"
				onmousemove={moverZoom}
				onmouseenter={activarZoom}
				onmouseleave={desactivarZoom}
			>
				<img
					src={product.imagen}
					alt=""
					draggable="false"
					class="h-full w-full select-none object-cover transition-transform duration-200 ease-out"
					class:scale-[2.5]={zoomActivo}
					style:transform-origin={`${posicionX}% ${posicionY}%`}
				/>
			</div>

			<div class="w-full lg:w-1/2 lg:pt-4 flex flex-col">
				<p
					class="font-PlayFair text-3xl leading-tight text-gray-600
			sm:text-4xl
			lg:text-5xl
			2xl:text-6xl"
				>
					{product.Nombre}
				</p>

				{#if product.especificacion}
					<p
						class="font-BeVietnam text-base text-slate-400
				sm:text-lg
				lg:text-xl"
					>
						{product.especificacion}
					</p>
				{/if}

				<div class="bg-slate-700 h-px w-24 my-8"></div>

				<p
					class="whitespace-pre-line font-BeVietnam text-base leading-7 text-gray-500
			sm:text-lg
			lg:text-xl lg:leading-8
			2xl:text-2xl"
				>
					{product.descripcion}
				</p>

				<div class="mt-6 gap-4 sm:flex-row sm:flex-wrap">
					<div
						class="rounded-4xl bg-sky-100 w-38 px-5 py-4 sm:min-w-52"
					>
						<p class="font-BeVietnam text-2xl sm:text-3xl">
							{formatearUSD(product.precio)}
						</p>

						{#if precioBolivares !== null}
							<p
								class="mt-1 text-lg font-semibold text-sky-700 sm:text-xl"
							>
								{formatearVES(precioBolivares)}
							</p>
						{/if}
					</div>
				</div>
				{#if agotado}
					<p
						class="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
					>
						Agotado
					</p>
				{:else if product.stock <= 5}
					<p class="mt-8 text-sm font-semibold text-amber-600">
						¡Últimas {product.stock} unidades disponibles!
					</p>
				{/if}

				<div class="mt-4 flex gap-4 sm:flex-row sm:items-center">
					<div
						class="flex h-14 w-full items-center rounded-full
			border border-black/30 px-2 sm:w-auto"
						class:opacity-50={agotado}
					>
						<button
							type="button"
							aria-label="Disminuir cantidad"
							onclick={restar}
							disabled={agotado}
							class="px-5 text-2xl text-black/50 disabled:cursor-not-allowed"
						>
							−
						</button>

						<p class="min-w-10 text-center text-xl text-black/60">
							{cantidad}
						</p>

						<button
							type="button"
							aria-label="Aumentar cantidad"
							onclick={sumar}
							disabled={agotado || cantidad >= product.stock}
							class="px-5 text-2xl text-black/50 disabled:cursor-not-allowed disabled:opacity-40"
						>
							+
						</button>
					</div>

					<button
						type="button"
						onclick={agregarAlCarrito}
						disabled={agotado}
						class="h-14 w-full rounded-full bg-gray-600 px-8
			text-base font-semibold text-white transition
			hover:bg-gray-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:bg-slate-300 sm:flex-1 lg:text-lg"
					>
						{agotado ? 'Sin stock' : 'Agregar al carrito'}
					</button>
				</div>
				{#if mensaje}
					<div
						role="status"
						class="mt-4 rounded-2xl border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-700"
					>
						{mensaje}
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="p-24 text-center">
			<p class="text-2xl text-slate-600">Producto no encontrado</p>
		</div>
	{/if}
</section>
