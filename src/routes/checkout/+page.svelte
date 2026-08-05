<script lang="ts">
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';

	import { auth } from '$lib/firebase';

	import {
		carrito,
		totalCarritoUSD
	} from '$lib/cart.js';

	import {
		convertirUSDaVES,
		formatearUSD,
		formatearVES
	} from '$lib/utils/moneda';

	import {
		crearPedido,
		type MetodoPago
	} from '$lib/pedidos';

	type CheckoutData = {
		tasaBCV?: {
			promedio?: number | null;
		} | null;
	};

	let {
		data
	}: {
		data: CheckoutData;
	} = $props();

	let nombre = $state('');
	let correo = $state('');
	let telefono = $state('');

	let metodoPago =
		$state<MetodoPago>('efectivo');

	let procesando = $state(false);
	let error = $state('');
	let numeroPedido = $state('');

	const opcionesPago: Array<{
		value: MetodoPago;
		label: string;
		icon: string;
	}> = [
		{
			value: 'efectivo',
			label: 'Efectivo',
			icon: 'material-symbols:payments-outline'
		},
		{
			value: 'pago_movil',
			label: 'Pago móvil',
			icon: 'material-symbols:phone-android-outline'
		},
		{
			value: 'binance',
			label: 'Binance',
			icon: 'token-branded:bnb'
		}
	];

	const tasaBCV = $derived(
		typeof data?.tasaBCV?.promedio === 'number'
			? data.tasaBCV.promedio
			: null
	);

	const totalVES = $derived(
		tasaBCV
			? convertirUSDaVES(
					$totalCarritoUSD,
					tasaBCV
				)
			: null
	);

	const whatsappEmpresa = $derived(
		env.PUBLIC_COMPANY_WHATSAPP ?? ''
	);


	const mensajeWhatsapp = $derived(
		numeroPedido
			? `Hola Moon Beauty, acabo de realizar el pedido ${numeroPedido}. Mi nombre es ${nombre}. Elegí ${etiquetaMetodoPago(metodoPago)} como método de pago y deseo continuar con el proceso.`
			: ''
	);

	const enlaceWhatsapp = $derived(
		whatsappEmpresa && mensajeWhatsapp
			? `https://wa.me/${whatsappEmpresa.replace(/\D/g, '')}?text=${encodeURIComponent(mensajeWhatsapp)}`
			: '#'
	);

	function etiquetaMetodoPago(
		metodo: MetodoPago
	): string {
		return {
			efectivo: 'efectivo',
			pago_movil: 'pago móvil',
			binance: 'Binance'
		}[metodo];
	}

	async function finalizarCompra(
		event: SubmitEvent
	) {
		event.preventDefault();
		error = '';

		if (!auth.currentUser) {
			error =
				'Debes iniciar sesión antes de finalizar la compra.';

			return;
		}

		if (!nombre.trim()) {
			error = 'Ingresa tu nombre.';
			return;
		}

		if (!correo.trim() && !telefono.trim()) {
			error =
				'Ingresa al menos un correo o número de teléfono.';

			return;
		}

		if ($carrito.length === 0) {
			error = 'Tu carrito está vacío.';
			return;
		}

		if (!tasaBCV || totalVES === null) {
			error =
				'La tasa BCV no está disponible. Intenta nuevamente.';

			return;
		}

		procesando = true;

		try {
			const items = $carrito.map((item) => ({
				id: item.id,
				nombre: item.Nombre,
				tipo: item.Tipo,
				imagen: item.imagen,
				precioUSD: item.precio,
				cantidad: item.cantidad,
				subtotalUSD:
					Math.round(
						item.precio *
							item.cantidad *
							100
					) / 100
			}));

			const totalUSDRedondeado =
	Math.round($totalCarritoUSD * 100) / 100;

const totalVESRedondeado =
	Math.round(totalVES * 100) / 100;

const resultado = await crearPedido({
	contacto: {
		nombre: nombre.trim(),
		correo: correo.trim(),
		telefono: telefono.trim()
	},

	metodoPago,
	items,
	totalUSD: totalUSDRedondeado,
	tasaBCV,
	totalVES: totalVESRedondeado
});

numeroPedido = resultado.numeroPedido;

try {
	const respuestaCorreo = await fetch(
		'/api/enviar-pedido',
		{
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},

			body: JSON.stringify({
				numeroPedido:
					resultado.numeroPedido,

				nombre: nombre.trim(),
				correo: correo.trim(),
				telefono: telefono.trim(),
				metodoPago,
				items,
				totalUSD: totalUSDRedondeado,
				tasaBCV,
				totalVES: totalVESRedondeado
			})
		}
	);

	const datosCorreo =
		await respuestaCorreo.json();

	if (!respuestaCorreo.ok) {
		console.error(
			'El pedido se guardó, pero el correo falló:',
			datosCorreo
		);
	}
} catch (errorCorreo) {
	console.error(
		'El pedido se guardó, pero no se pudo enviar el correo:',
		errorCorreo
	);
}

carrito.vaciar();

		} catch (e) {
			error =
				e instanceof Error
					? e.message
					: 'No se pudo crear el pedido.';
		} finally {
			procesando = false;
		}
	}
</script>

<svelte:head>
	<title>Finalizar compra | Moon Beauty</title>
</svelte:head>

<main
	class="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8"
>
	<div class="mx-auto max-w-6xl">
		{#if numeroPedido}
			<section
				class="mx-auto max-w-2xl rounded-3xl bg-white p-7 text-center shadow-sm sm:p-10"
			>
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600"
				>
					<Icon
						icon="material-symbols:check-rounded"
						width="38"
					/>
				</div>

				<p
					class="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600"
				>
					Pedido registrado
				</p>

				<h1
					class="mt-2 font-PlayFair text-4xl text-slate-700"
				>
					¡Gracias por tu compra!
				</h1>

				<div
					class="mt-7 rounded-2xl bg-slate-50 p-5"
				>
					<p class="text-sm text-slate-500">
						Tu número de pedido es
					</p>

					<p
						class="mt-1 break-all text-2xl font-bold text-slate-800"
					>
						{numeroPedido}
					</p>
				</div>

				<p
					class="mx-auto mt-6 max-w-xl text-slate-600"
				>
					Comunícate con Moon Beauty por
					WhatsApp para recibir las instrucciones
					de pago y confirmar tu pedido.
				</p>

				{#if whatsappEmpresa}
					<a
						href={enlaceWhatsapp}
						target="_blank"
						rel="noreferrer"
						class="mt-7 inline-flex items-center justify-center gap-3 rounded-full bg-green-500 px-7 py-4 font-semibold text-white transition hover:bg-green-600"
					>
						<Icon
							icon="logos:whatsapp-icon"
							width="25"
						/>

						Continuar por WhatsApp
					</a>
				{:else}
					<p
						class="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700"
					>
						Configura
						PUBLIC_COMPANY_WHATSAPP en el
						archivo .env.
					</p>
				{/if}

				<button
					type="button"
					onclick={() => goto('/products')}
					class="mt-5 block w-full text-sm text-sky-700 hover:underline"
				>
					Volver a productos
				</button>
			</section>
		{:else}
			<div
				class="grid gap-8 lg:grid-cols-[1fr_380px]"
			>
				<form
					onsubmit={finalizarCompra}
					class="rounded-3xl bg-white p-6 shadow-sm sm:p-8"
				>
					<p
						class="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600"
					>
						Checkout
					</p>

					<h1
						class="mt-2 font-PlayFair text-4xl text-slate-700"
					>
						Finalizar compra
					</h1>

					<section class="mt-8">
						<h2
							class="text-xl font-semibold text-slate-700"
						>
							1. Información de contacto
						</h2>

						<div
							class="mt-5 grid gap-4 sm:grid-cols-2"
						>
							<label class="sm:col-span-2">
								<span
									class="mb-2 block text-sm text-slate-600"
								>
									Nombre completo
								</span>

								<input
									bind:value={nombre}
									required
									class="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-sky-300"
								/>
							</label>

							<label>
								<span
									class="mb-2 block text-sm text-slate-600"
								>
									Correo electrónico
								</span>

								<input
									type="email"
									bind:value={correo}
									class="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-sky-300"
								/>
							</label>

							<label>
								<span
									class="mb-2 block text-sm text-slate-600"
								>
									Número de teléfono
								</span>

								<input
									type="tel"
									bind:value={telefono}
									class="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-sky-300"
								/>
							</label>
						</div>

						<p
							class="mt-3 text-xs text-slate-400"
						>
							Debes ingresar al menos un correo
							o un teléfono.
						</p>
					</section>

					<section class="mt-10">
						<h2
							class="text-xl font-semibold text-slate-700"
						>
							2. Método de pago
						</h2>

						<div
							class="mt-5 grid gap-3 sm:grid-cols-3"
						>
							{#each opcionesPago as opcion}
								<label
									class="cursor-pointer rounded-2xl border p-4 transition"
									class:border-sky-400={metodoPago === opcion.value}
									class:bg-sky-50={metodoPago === opcion.value}
								>
									<input
										class="sr-only"
										type="radio"
										name="metodoPago"
										value={opcion.value}
										bind:group={metodoPago}
									/>

									<Icon
										icon={opcion.icon}
										width="28"
										class="text-slate-600"
									/>

									<span
										class="mt-3 block font-semibold text-slate-700"
									>
										{opcion.label}
									</span>
								</label>
							{/each}
						</div>
					</section>

					{#if error}
						<div
							role="alert"
							class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
						>
							{error}
						</div>
					{/if}

					<button
						type="submit"
						disabled={procesando ||
							$carrito.length === 0}
						class="mt-8 h-14 w-full rounded-full bg-slate-600 px-6 font-semibold text-white transition hover:bg-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{procesando
							? 'Registrando pedido...'
							: 'Finalizar pedido'}
					</button>
				</form>

				<aside
					class="h-fit rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-28"
				>
					<h2
						class="font-PlayFair text-2xl text-slate-700"
					>
						Resumen
					</h2>

					<div
						class="mt-5 max-h-80 space-y-4 overflow-y-auto pr-1"
					>
						{#each $carrito as item, index (`${item.id}-${index}`)}
							<div class="flex gap-3">
								<img
									src={item.imagen}
									alt={item.Nombre}
									class="h-16 w-16 rounded-xl object-cover"
								/>

								<div class="min-w-0 flex-1">
									<p
										class="truncate font-semibold text-slate-700"
									>
										{item.Nombre}
									</p>

									<p
										class="text-sm text-slate-400"
									>
										Cantidad:
										{item.cantidad}
									</p>
								</div>

								<strong
									class="text-sm text-slate-700"
								>
									{formatearUSD(
										item.precio *
											item.cantidad
									)}
								</strong>
							</div>
						{/each}
					</div>

					<div
						class="mt-6 space-y-3 border-t border-slate-200 pt-5"
					>
						<div
							class="flex justify-between"
						>
							<span class="text-slate-500">
								Total USD
							</span>

							<strong>
								{formatearUSD(
									$totalCarritoUSD
								)}
							</strong>
						</div>

						<div
							class="flex justify-between"
						>
							<span class="text-slate-500">
								Total VES
							</span>

							<strong>
								{totalVES !== null
									? formatearVES(
											totalVES
										)
									: 'No disponible'}
							</strong>
						</div>
					</div>
				</aside>
			</div>
		{/if}
	</div>
</main>