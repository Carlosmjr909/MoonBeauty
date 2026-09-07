<script lang="ts">
	import Icon from '@iconify/svelte';
	import { tick } from 'svelte';
	import { slide } from 'svelte/transition';
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
		asegurarSesion,
		crearPedido,
		subirComprobantePago,
		type MetodoPago
	} from '$lib/pedidos';

	import {
		CODIGO_CUPON,
		calcularDescuentoUSD,
		esMetodoPagoElegibleParaCupon
	} from '$lib/cupones';

	import { ESTADOS_VENEZUELA } from '$lib/estadosVenezuela';

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

	let direccion = $state('');
	let casaApartamento = $state('');
	let ciudad = $state('');
	let codigoPostal = $state('');
	let estadoEntrega = $state('');
	let ubicacionMapa = $state<{ lat: number; lng: number } | null>(null);

	// Selector de ubicación con Google Maps: solo aparece si hay una API
	// key configurada (PUBLIC_GOOGLE_MAPS_API_KEY). Si no, el formulario
	// manual de dirección/ciudad/estado sigue funcionando igual.
	const GOOGLE_MAPS_API_KEY = env.PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
	let mostrarMapa = $state(false);
	let contenedorMapa = $state<HTMLDivElement | null>(null);
	let inputAutocompletado = $state<HTMLInputElement | null>(null);
	let mapaListo = false;
	let scriptMapaPromesa: Promise<void> | null = null;

	function cargarScriptGoogleMaps(): Promise<void> {
		if (scriptMapaPromesa) return scriptMapaPromesa;

		scriptMapaPromesa = new Promise((resolve, reject) => {
			const ventana = window as typeof window & {
				google?: { maps: unknown };
			};

			if (ventana.google?.maps) {
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () =>
				reject(new Error('No se pudo cargar Google Maps.'));
			document.head.appendChild(script);
		});

		return scriptMapaPromesa;
	}

	function procesarComponentesDireccion(
		componentes: Array<{ long_name: string; types: string[] }>
	) {
		const buscar = (tipo: string) =>
			componentes.find((c) => c.types.includes(tipo))?.long_name ?? '';

		const calle = [
			buscar('route'),
			buscar('street_number')
		]
			.filter(Boolean)
			.join(' ');

		if (calle) direccion = calle;

		const ciudadEncontrada =
			buscar('locality') || buscar('administrative_area_level_2');
		if (ciudadEncontrada) ciudad = ciudadEncontrada;

		const estadoEncontrado = buscar('administrative_area_level_1');
		if (estadoEncontrado) {
			const coincidencia = ESTADOS_VENEZUELA.find(
				(e) => e.toLowerCase() === estadoEncontrado.toLowerCase()
			);
			estadoEntrega = coincidencia ?? estadoEncontrado;
		}

		const postal = buscar('postal_code');
		if (postal) codigoPostal = postal;
	}

	async function inicializarMapa() {
		if (mapaListo || !contenedorMapa) return;

		try {
			await cargarScriptGoogleMaps();
		} catch {
			error = 'No se pudo cargar el mapa. Completa la dirección manualmente.';
			return;
		}

		const g = (window as any).google;
		const centroInicial = { lat: 10.1621, lng: -68.0077 }; // Valencia, Venezuela

		const mapa = new g.maps.Map(contenedorMapa, {
			center: centroInicial,
			zoom: 13,
			streetViewControl: false,
			mapTypeControl: false
		});

		const marcador = new g.maps.Marker({
			position: centroInicial,
			map: mapa,
			draggable: true
		});

		const geocoder = new g.maps.Geocoder();

		function actualizarDesdePosicion(posicion: { lat: () => number; lng: () => number }) {
			ubicacionMapa = { lat: posicion.lat(), lng: posicion.lng() };

			geocoder.geocode(
				{ location: { lat: posicion.lat(), lng: posicion.lng() } },
				(resultados: Array<{ address_components: any }>, estado: string) => {
					if (estado === 'OK' && resultados?.[0]) {
						procesarComponentesDireccion(resultados[0].address_components);
					}
				}
			);
		}

		marcador.addListener('dragend', () => {
			actualizarDesdePosicion(marcador.getPosition());
		});

		if (inputAutocompletado) {
			const autocompletado = new g.maps.places.Autocomplete(
				inputAutocompletado,
				{ componentRestrictions: { country: 've' } }
			);

			autocompletado.addListener('place_changed', () => {
				const lugar = autocompletado.getPlace();
				if (!lugar.geometry?.location) return;

				mapa.setCenter(lugar.geometry.location);
				mapa.setZoom(16);
				marcador.setPosition(lugar.geometry.location);

				ubicacionMapa = {
					lat: lugar.geometry.location.lat(),
					lng: lugar.geometry.location.lng()
				};

				if (lugar.address_components) {
					procesarComponentesDireccion(lugar.address_components);
				}
			});
		}

		mapaListo = true;
	}

	async function alternarMapa() {
		mostrarMapa = !mostrarMapa;

		if (mostrarMapa) {
			await tick();
			inicializarMapa();
		}
	}

	let metodoPago =
		$state<MetodoPago>('efectivo');

	let comprobanteArchivo = $state<File | null>(null);
	let comprobanteReferencia = $state('');
	let inputComprobante = $state<HTMLInputElement | null>(null);

	let procesando = $state(false);
	let error = $state('');
	let numeroPedido = $state('');

	let codigoCupon = $state('');
	let cuponAplicado = $state(false);
	let errorCupon = $state('');

	const infoPago: Partial<Record<MetodoPago, string[]>> = {
		pago_movil: [
			'V-27854705',
			'0412-5050043',
			'Banco de Venezuela (0102)'
		],
		binance: ['juancjs71@gmail.com'],
		zinli: ['juancjs71@gmail.com'],
		zelle: ['juancjs71@gmail.com']
	};

	function manejarSeleccionComprobante(evento: Event) {
		comprobanteArchivo =
			(evento.target as HTMLInputElement).files?.[0] ?? null;
	}

	function quitarComprobante() {
		comprobanteArchivo = null;
		if (inputComprobante) {
			inputComprobante.value = '';
		}
	}

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
		},
		{
			value: 'zelle',
			label: 'Zelle',
			icon: 'simple-icons:zelle'
		},
		{
			value: 'zinli',
			label: 'Zinli',
			icon: 'material-symbols:account-balance-wallet-outline'
		}
	];

	const metodoElegibleParaCupon = $derived(
		esMetodoPagoElegibleParaCupon(metodoPago)
	);

	// Si el usuario cambia a un método sin descuento (pago móvil), el cupón deja de aplicar.
	$effect(() => {
		if (cuponAplicado && !metodoElegibleParaCupon) {
			cuponAplicado = false;
			errorCupon =
				'El cupón MOON20 no aplica para pago móvil (bolívares). Se quitó el descuento.';
		}
	});

	function aplicarCupon() {
		errorCupon = '';

		const codigo = codigoCupon.trim().toUpperCase();

		if (!codigo) {
			errorCupon = 'Ingresa un código de cupón.';
			return;
		}

		if (codigo !== CODIGO_CUPON) {
			errorCupon = 'El código ingresado no es válido.';
			return;
		}

		if (!metodoElegibleParaCupon) {
			errorCupon =
				'Este cupón solo aplica para pagos en $ (efectivo, Binance, Zelle o Zinli).';
			return;
		}

		cuponAplicado = true;
		codigoCupon = CODIGO_CUPON;
	}

	function quitarCupon() {
		cuponAplicado = false;
		codigoCupon = '';
		errorCupon = '';
	}

	const descuentoUSD = $derived(
		cuponAplicado ? calcularDescuentoUSD($totalCarritoUSD) : 0
	);

	const totalConDescuentoUSD = $derived(
		Math.max(0, $totalCarritoUSD - descuentoUSD)
	);

	const tasaBCV = $derived(
		typeof data?.tasaBCV?.promedio === 'number'
			? data.tasaBCV.promedio
			: null
	);

	// El total en VES nunca refleja el descuento del cupón: el cupón
	// solo aplica a pagos en $ (no a pago móvil / bolívares), así que
	// este monto siempre es el equivalente completo, sin descontar.
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
			binance: 'Binance',
			zelle: 'Zelle',
			zinli: 'Zinli'
		}[metodo];
	}

	async function finalizarCompra(
		event: SubmitEvent
	) {
		event.preventDefault();
		error = '';

		if (!nombre.trim()) {
			error = 'Ingresa tu nombre.';
			return;
		}

		if (!correo.trim() && !telefono.trim()) {
			error =
				'Ingresa al menos un correo o número de teléfono.';

			return;
		}

		if (!direccion.trim() || !ciudad.trim() || !estadoEntrega.trim()) {
			error =
				'Completa la dirección, ciudad y estado de entrega (o marca la ubicación en el mapa).';

			return;
		}

		if ($carrito.length === 0) {
			error = 'Tu carrito está vacío.';
			return;
		}

		const itemSinStock = $carrito.find(
			(item) => typeof item.stock === 'number' && item.cantidad > item.stock
		);

		if (itemSinStock) {
			error = `Solo quedan ${itemSinStock.stock} unidad${itemSinStock.stock === 1 ? '' : 'es'} de "${itemSinStock.Nombre}" — ajusta la cantidad en el carrito.`;
			return;
		}

		if (!tasaBCV || totalVES === null) {
			error =
				'La tasa BCV no está disponible. Intenta nuevamente.';

			return;
		}

		if (!comprobanteArchivo && !comprobanteReferencia.trim()) {
			error =
				'Sube tu comprobante de pago o ingresa el número de referencia.';

			return;
		}

		procesando = true;

		try {
			// Aseguramos la sesión (anónima si es invitado) antes de subir
			// nada — la regla de Storage exige un usuario autenticado.
			await asegurarSesion();

			let comprobanteUrl: string | null = null;

			if (comprobanteArchivo) {
				comprobanteUrl = await subirComprobantePago(comprobanteArchivo);
			}

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

			const subtotalUSDRedondeado =
	Math.round($totalCarritoUSD * 100) / 100;

const descuentoUSDRedondeado =
	Math.round(descuentoUSD * 100) / 100;

const totalUSDRedondeado =
	Math.round(totalConDescuentoUSD * 100) / 100;

const totalVESRedondeado =
	Math.round(totalVES * 100) / 100;

const cuponFinal = cuponAplicado ? CODIGO_CUPON : null;

const entregaFinal = {
	direccion: direccion.trim(),
	casaApartamento: casaApartamento.trim(),
	ciudad: ciudad.trim(),
	codigoPostal: codigoPostal.trim(),
	estado: estadoEntrega.trim(),
	ubicacionMapa
};

const comprobanteFinal = {
	url: comprobanteUrl,
	referencia: comprobanteReferencia.trim()
};

const resultado = await crearPedido({
	contacto: {
		nombre: nombre.trim(),
		correo: correo.trim(),
		telefono: telefono.trim()
	},

	entrega: entregaFinal,
	metodoPago,
	comprobantePago: comprobanteFinal,
	items,
	subtotalUSD: subtotalUSDRedondeado,
	cupon: cuponFinal,
	descuentoUSD: descuentoUSDRedondeado,
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
				entrega: entregaFinal,
				metodoPago,
				comprobantePago: comprobanteFinal,
				items,
				subtotalUSD: subtotalUSDRedondeado,
				cupon: cuponFinal,
				descuentoUSD: descuentoUSDRedondeado,
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
					class="mt-2 font-Manrope text-4xl text-slate-700"
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
						class="mt-2 font-Manrope text-4xl text-slate-700"
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
							2. Entrega
						</h2>

						<p class="mt-2 text-sm text-slate-500">
							Dinos dónde te llevamos el pedido.
						</p>

						{#if GOOGLE_MAPS_API_KEY}
							<button
								type="button"
								onclick={alternarMapa}
								class="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
							>
								<Icon icon="material-symbols:location-on-outline" width="18" />
								{mostrarMapa
									? 'Ocultar mapa'
									: 'Elegir ubicación en el mapa'}
							</button>

							{#if mostrarMapa}
								<div class="mt-4">
									<input
										bind:this={inputAutocompletado}
										placeholder="Busca tu dirección..."
										class="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-sky-300"
									/>
									<div
										bind:this={contenedorMapa}
										class="mt-3 h-64 w-full rounded-xl bg-slate-100"
									></div>
									{#if ubicacionMapa}
										<p class="mt-2 text-xs text-sky-700">
											Ubicación marcada — completa o revisa los datos abajo.
										</p>
									{/if}
								</div>
							{/if}
						{/if}

						<div class="mt-5 grid gap-4 sm:grid-cols-2">
							<label class="sm:col-span-2">
								<span class="mb-2 block text-sm text-slate-600">
									Dirección
								</span>

								<input
									bind:value={direccion}
									required
									placeholder="Calle, avenida, referencia..."
									class="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-sky-300"
								/>
							</label>

							<label>
								<span class="mb-2 block text-sm text-slate-600">
									Casa / apartamento (opcional)
								</span>

								<input
									bind:value={casaApartamento}
									class="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-sky-300"
								/>
							</label>

							<label>
								<span class="mb-2 block text-sm text-slate-600">
									Ciudad
								</span>

								<input
									bind:value={ciudad}
									required
									class="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-sky-300"
								/>
							</label>

							<label>
								<span class="mb-2 block text-sm text-slate-600">
									Estado
								</span>

								<select
									bind:value={estadoEntrega}
									required
									class="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-300"
								>
									<option value="" disabled selected={!estadoEntrega}>
										Selecciona un estado
									</option>
									{#each ESTADOS_VENEZUELA as estadoOpcion}
										<option value={estadoOpcion}>{estadoOpcion}</option>
									{/each}
								</select>
							</label>

							<label>
								<span class="mb-2 block text-sm text-slate-600">
									Código postal (opcional)
								</span>

								<input
									bind:value={codigoPostal}
									class="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-sky-300"
								/>
							</label>
						</div>
					</section>

					<section class="mt-10">
						<h2
							class="text-xl font-semibold text-slate-700"
						>
							3. Método de pago
						</h2>

						<div
							class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
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

									{#if metodoPago === opcion.value && infoPago[opcion.value]}
										<div
											transition:slide={{ duration: 200 }}
										class="mt-3 space-y-1 border-t border-sky-200 pt-3"
										>
											{#each infoPago[opcion.value] ?? [] as linea}
												<p class="text-xs font-medium text-sky-800 break-all">
													{linea}
												</p>
											{/each}
										</div>
									{/if}
								</label>
							{/each}
						</div>
					</section>

					<section class="mt-10">
						<h2
							class="text-xl font-semibold text-slate-700"
						>
							4. Cupón de descuento
						</h2>

						<p class="mt-2 text-sm text-slate-500">
							Válido para pagos en $ (efectivo, Binance, Zelle o Zinli) — no aplica para pago móvil.
						</p>

						{#if cuponAplicado}
							<div
								class="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-sky-300 bg-sky-50 p-4"
							>
								<div class="flex items-center gap-3">
									<Icon
										icon="material-symbols:local-offer-outline"
										width="24"
										class="text-sky-700"
									/>
									<div>
										<p class="font-semibold text-sky-800">
											Cupón {CODIGO_CUPON} aplicado
										</p>
										<p class="text-sm text-sky-700">
											-20% sobre el total ({formatearUSD(descuentoUSD)})
										</p>
									</div>
								</div>

								<button
									type="button"
									onclick={quitarCupon}
									class="text-sm font-semibold text-sky-700 hover:underline"
								>
									Quitar
								</button>
							</div>
						{:else}
							<div class="mt-4 flex flex-col gap-2 sm:flex-row">
								<input
									bind:value={codigoCupon}
									placeholder="Código de cupón"
									class="h-12 w-full rounded-xl border border-slate-200 px-4 uppercase outline-none focus:border-sky-300 sm:flex-1"
								/>

								<button
									type="button"
									onclick={aplicarCupon}
									class="h-12 shrink-0 rounded-xl bg-gray-500 px-6 font-semibold text-white transition hover:bg-slate-500"
								>
									Aplicar
								</button>
							</div>
						{/if}

						{#if errorCupon}
							<p class="mt-3 text-sm text-red-600">
								{errorCupon}
							</p>
						{/if}
					</section>

					<section class="mt-10">
						<h2
							class="text-xl font-semibold text-slate-700"
						>
							5. Comprobante de pago
						</h2>

						<p class="mt-2 text-sm text-slate-500">
							Sube una captura de tu pago o ingresa el número de
							referencia/confirmación — con uno de los dos alcanza.
						</p>

						<div class="mt-5 grid gap-4 sm:grid-cols-2">
							<div class="flex flex-col gap-1">
								<span class="text-sm text-slate-600">
									Captura del comprobante (opcional)
								</span>

								<input
									id="comprobante"
									type="file"
									accept="image/*,application/pdf"
									bind:this={inputComprobante}
									onchange={manejarSeleccionComprobante}
									class="rounded-xl border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
								/>

								{#if comprobanteArchivo}
									<div class="mt-1 flex items-center gap-2">
										<p class="truncate text-xs text-slate-500">
											{comprobanteArchivo.name}
										</p>
										<button
											type="button"
											onclick={quitarComprobante}
											class="text-xs font-semibold text-red-600 hover:underline"
										>
											Quitar
										</button>
									</div>
								{/if}
							</div>

							<label>
								<span class="mb-2 block text-sm text-slate-600">
									Número de referencia (opcional)
								</span>

								<input
									bind:value={comprobanteReferencia}
									placeholder="Ej. 000123456789"
									class="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-sky-300"
								/>
							</label>
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
						class="font-Manrope text-2xl text-slate-700"
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
								Subtotal USD
							</span>

							<span class:text-slate-400={cuponAplicado} class:line-through={cuponAplicado}>
								{formatearUSD(
									$totalCarritoUSD
								)}
							</span>
						</div>

						{#if cuponAplicado}
							<div class="flex justify-between text-sky-700">
								<span>
									Descuento ({CODIGO_CUPON})
								</span>

								<span>
									-{formatearUSD(descuentoUSD)}
								</span>
							</div>
						{/if}

						<div
							class="flex justify-between"
						>
							<span class="text-slate-500">
								Total USD
							</span>

							<strong>
								{formatearUSD(
									totalConDescuentoUSD
								)}
							</strong>
						</div>

						<div
							class="flex justify-between"
						>
							<span class="text-slate-500">
								Total VES
							</span>

							<strong class:text-slate-400={cuponAplicado} class:line-through={cuponAplicado} class:font-normal={cuponAplicado}>
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

