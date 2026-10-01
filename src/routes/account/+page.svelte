<script lang="ts">
	import Icon from '@iconify/svelte';
	import { slide } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import { usuario, autenticacionCargando } from '$lib/auth';
	import {
		canjearPuntos,
		escucharCodigosPropios,
		escucharMovimientos,
		escucharPerfil,
		escucharPuntos,
		guardarDatosPersonales,
		guardarDirecciones,
		guardarPreferenciaPromociones,
		type CodigoPropio,
		type Direccion,
		type MovimientoPuntos,
		type PerfilCliente,
		type SaldoPuntos
	} from '$lib/cuenta';
	import {
		escucharPedidosDeUsuario,
		type EstadoPedido,
		type PedidoAdmin
	} from '$lib/pedidos';
	import {
		DOLARES_POR_PUNTO,
		LARGO_MAXIMO_CODIGO,
		NIVELES_CANJE,
		errorCodigoPersonal,
		normalizarCodigoPersonal,
		type PorcentajeCanje
	} from '$lib/puntosMoon';
	import { ESTADOS_VENEZUELA } from '$lib/estadosVenezuela';
	import { formatearUSD } from '$lib/utils/moneda';

	// Las sesiones anónimas (compras como invitado) no tienen perfil.
	$effect(() => {
		if (!$autenticacionCargando && (!$usuario || $usuario.isAnonymous)) {
			goto('/login');
		}
	});

	type Pestaña = 'pedidos' | 'puntos' | 'direcciones' | 'datos';

	const PESTAÑAS: Array<{ id: Pestaña; etiqueta: string; icono: string }> = [
		{ id: 'pedidos', etiqueta: 'Mis pedidos', icono: 'material-symbols:package-2-outline' },
		{ id: 'puntos', etiqueta: 'Puntos Moon', icono: 'material-symbols:star-outline-rounded' },
		{ id: 'direcciones', etiqueta: 'Direcciones', icono: 'material-symbols:location-on-outline-rounded' },
		{ id: 'datos', etiqueta: 'Mis datos', icono: 'material-symbols:person-outline-rounded' }
	];

	let pestaña = $state<Pestaña>('pedidos');

	// Permite enlazar directo a una pestaña, p. ej. /account#puntos.
	$effect(() => {
		const desdeEnlace = window.location.hash.slice(1);
		if (PESTAÑAS.some((p) => p.id === desdeEnlace)) {
			pestaña = desdeEnlace as Pestaña;
		}
	});

	function elegirPestaña(id: Pestaña) {
		pestaña = id;
		history.replaceState(history.state, '', `#${id}`);
	}

	/* ----------------------------- Datos en vivo ----------------------------- */

	let perfil = $state<PerfilCliente | null>(null);
	let pedidos = $state<PedidoAdmin[]>([]);
	let cargandoPedidos = $state(true);
	let errorPedidos = $state('');
	let puntos = $state<SaldoPuntos>({ saldo: 0, ganados: 0, canjeados: 0 });
	let movimientos = $state<MovimientoPuntos[]>([]);
	let codigos = $state<CodigoPropio[]>([]);

	$effect(() => {
		const actual = $usuario;
		if (!actual || actual.isAnonymous) return;

		const detener = [
			escucharPerfil(actual, (datos) => {
				perfil = datos;
			}),
			escucharPedidosDeUsuario(
				actual.uid,
				(datos) => {
					pedidos = datos;
					cargandoPedidos = false;
				},
				() => {
					errorPedidos = 'No se pudieron cargar tus pedidos.';
					cargandoPedidos = false;
				}
			),
			escucharPuntos(actual.uid, (datos) => {
				puntos = datos;
			}),
			escucharMovimientos(actual.uid, (datos) => {
				movimientos = datos;
			}),
			escucharCodigosPropios(actual.uid, (datos) => {
				codigos = datos;
			})
		];

		return () => detener.forEach((parar) => parar());
	});

	const primerNombre = $derived(
		(perfil?.nombre || $usuario?.displayName || '').trim().split(/\s+/)[0] ?? ''
	);

	const formatoFecha = new Intl.DateTimeFormat('es-VE', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});

	function fecha(milisegundos: number) {
		return milisegundos ? formatoFecha.format(milisegundos) : 'Hace un momento';
	}

	/* -------------------------------- Pedidos -------------------------------- */

	const ESTADOS: Record<EstadoPedido, { etiqueta: string; clases: string; paso: number }> = {
		pendiente_contacto: {
			etiqueta: 'Recibido',
			clases: 'bg-amber-100 text-amber-800',
			paso: 0
		},
		confirmado: { etiqueta: 'Confirmado', clases: 'bg-sky-100 text-sky-800', paso: 1 },
		enviado: { etiqueta: 'Enviado', clases: 'bg-indigo-100 text-indigo-800', paso: 2 },
		entregado: { etiqueta: 'Entregado', clases: 'bg-green-100 text-green-800', paso: 3 },
		cancelado: { etiqueta: 'Cancelado', clases: 'bg-slate-200 text-slate-600', paso: -1 }
	};

	const PASOS_PEDIDO = ['Recibido', 'Confirmado', 'Enviado', 'Entregado'];

	let pedidosAbiertos = $state<Record<string, boolean>>({});

	/* --------------------------------- Puntos -------------------------------- */

	let porcentajeElegido = $state<PorcentajeCanje>(NIVELES_CANJE[0].porcentaje);
	let nombreCodigo = $state('');
	let canjeando = $state(false);
	let errorCanje = $state('');
	let codigoCreado = $state('');
	let copiado = $state('');

	const nivelElegido = $derived(
		NIVELES_CANJE.find((nivel) => nivel.porcentaje === porcentajeElegido) ?? NIVELES_CANJE[0]
	);

	// El próximo descuento que todavía no alcanza, para la barra de progreso.
	const proximoNivel = $derived(
		NIVELES_CANJE.find((nivel) => puntos.saldo < nivel.puntos) ?? null
	);

	const progreso = $derived(
		proximoNivel ? Math.min(100, (puntos.saldo / proximoNivel.puntos) * 100) : 100
	);

	async function crearCodigo(evento: SubmitEvent) {
		evento.preventDefault();
		errorCanje = '';
		codigoCreado = '';

		const actual = $usuario;
		if (!actual) return;

		const codigo = normalizarCodigoPersonal(nombreCodigo);
		const errorFormato = errorCodigoPersonal(codigo);

		if (errorFormato) {
			errorCanje = errorFormato;
			return;
		}

		if (puntos.saldo < nivelElegido.puntos) {
			errorCanje = `Te faltan ${nivelElegido.puntos - puntos.saldo} puntos para este descuento.`;
			return;
		}

		canjeando = true;

		try {
			const resultado = await canjearPuntos(actual, codigo, porcentajeElegido);
			codigoCreado = resultado.codigo;
			nombreCodigo = '';
		} catch (err) {
			errorCanje = err instanceof Error ? err.message : 'No se pudo completar el canje.';
		} finally {
			canjeando = false;
		}
	}

	async function copiar(codigo: string) {
		try {
			await navigator.clipboard.writeText(codigo);
			copiado = codigo;
			setTimeout(() => {
				if (copiado === codigo) copiado = '';
			}, 2000);
		} catch {
			// Sin permiso de portapapeles: el código igual queda a la vista.
		}
	}

	/* ------------------------------ Direcciones ------------------------------ */

	const MAXIMO_DIRECCIONES = 5;

	const direccionVacia = (): Direccion => ({
		id: '',
		alias: '',
		direccion: '',
		casaApartamento: '',
		ciudad: '',
		estado: 'Carabobo',
		codigoPostal: ''
	});

	let formularioDireccion = $state<Direccion | null>(null);
	let guardandoDireccion = $state(false);
	let errorDireccion = $state('');

	function nuevaDireccion() {
		errorDireccion = '';
		formularioDireccion = direccionVacia();
	}

	function editarDireccion(direccion: Direccion) {
		errorDireccion = '';
		formularioDireccion = { ...direccion };
	}

	async function guardarDireccion(evento: SubmitEvent) {
		evento.preventDefault();
		const actual = $usuario;
		const formulario = formularioDireccion;
		if (!actual || !perfil || !formulario) return;

		if (!formulario.direccion.trim() || !formulario.ciudad.trim()) {
			errorDireccion = 'Escribe la dirección y la ciudad.';
			return;
		}

		const limpia: Direccion = {
			id: formulario.id || crypto.randomUUID(),
			alias: formulario.alias.trim() || 'Mi dirección',
			direccion: formulario.direccion.trim(),
			casaApartamento: formulario.casaApartamento.trim(),
			ciudad: formulario.ciudad.trim(),
			estado: formulario.estado,
			codigoPostal: formulario.codigoPostal.trim()
		};

		const existe = perfil.direcciones.some((d) => d.id === limpia.id);
		const lista = existe
			? perfil.direcciones.map((d) => (d.id === limpia.id ? limpia : d))
			: [...perfil.direcciones, limpia];

		guardandoDireccion = true;
		errorDireccion = '';

		try {
			await guardarDirecciones(actual, lista);
			formularioDireccion = null;
		} catch {
			errorDireccion = 'No se pudo guardar la dirección.';
		} finally {
			guardandoDireccion = false;
		}
	}

	async function eliminarDireccion(direccion: Direccion) {
		const actual = $usuario;
		if (!actual || !perfil) return;
		if (!confirm(`¿Eliminar la dirección "${direccion.alias}"?`)) return;

		try {
			await guardarDirecciones(
				actual,
				perfil.direcciones.filter((d) => d.id !== direccion.id)
			);
		} catch {
			errorDireccion = 'No se pudo eliminar la dirección.';
		}
	}

	/* ------------------------------- Mis datos ------------------------------- */

	let nombreEditado = $state('');
	let telefonoEditado = $state('');
	let datosCargados = false;
	let guardandoDatos = $state(false);
	let mensajeDatos = $state('');
	let errorDatos = $state('');

	// Se copian al formulario una sola vez, cuando llega el perfil, para
	// no pisar lo que la clienta esté escribiendo si el documento cambia.
	$effect(() => {
		if (perfil && !datosCargados) {
			nombreEditado = perfil.nombre;
			telefonoEditado = perfil.telefono;
			datosCargados = true;
		}
	});

	const usaContraseña = $derived(
		$usuario?.providerData.some((proveedor) => proveedor.providerId === 'password') ?? false
	);

	async function guardarDatos(evento: SubmitEvent) {
		evento.preventDefault();
		const actual = $usuario;
		if (!actual) return;

		guardandoDatos = true;
		mensajeDatos = '';
		errorDatos = '';

		try {
			await guardarDatosPersonales(actual, {
				nombre: nombreEditado,
				telefono: telefonoEditado
			});
			mensajeDatos = 'Tus datos se guardaron.';
			setTimeout(() => (mensajeDatos = ''), 4000);
		} catch (err) {
			errorDatos = err instanceof Error ? err.message : 'No se pudieron guardar tus datos.';
		} finally {
			guardandoDatos = false;
		}
	}

	let guardandoPreferencia = $state(false);
	let mensajePreferencia = $state('');
	let errorPreferencia = $state('');

	async function cambiarPreferencia(recibir: boolean) {
		const actual = $usuario;
		if (!actual) return;

		guardandoPreferencia = true;
		mensajePreferencia = '';
		errorPreferencia = '';

		try {
			await guardarPreferenciaPromociones(actual, recibir);
			mensajePreferencia = recibir
				? 'Listo, seguirás recibiendo nuestras promociones.'
				: 'Listo, no te enviaremos más correos promocionales.';
			setTimeout(() => (mensajePreferencia = ''), 4000);
		} catch {
			errorPreferencia = 'No se pudo guardar tu preferencia.';
		} finally {
			guardandoPreferencia = false;
		}
	}

	const claseCampo =
		'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100';
</script>

<svelte:head>
	<title>Mi cuenta | Moon Beauty</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="min-h-[70vh] bg-gray-50 px-4 py-10 sm:px-6 sm:py-14">
	<div class="mx-auto max-w-5xl">
		{#if $autenticacionCargando || !$usuario || $usuario.isAnonymous}
			<p class="py-20 text-center text-slate-500">Cargando tu cuenta...</p>
		{:else}
			<!-- Encabezado y tarjeta de puntos -->
			<div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
				<div>
					<p class="font-Manrope text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
						Mi cuenta
					</p>
					<h1 class="mt-2 font-Manrope text-4xl text-slate-700 sm:text-5xl">
						Hola{primerNombre ? `, ${primerNombre}` : ''}
					</h1>
					<p class="mt-2 text-slate-500">{$usuario.email}</p>
				</div>

				<button
					type="button"
					onclick={() => elegirPestaña('puntos')}
					class="group flex items-center gap-4 rounded-3xl bg-linear-to-br from-sky-200 to-sky-100 px-6 py-5 text-left shadow-sm ring-1 ring-sky-200 transition hover:-translate-y-0.5 hover:shadow-md lg:min-w-80"
				>
					<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm">
						<Icon icon="material-symbols:star-rounded" width="28" />
					</span>
					<span class="min-w-0 flex-1">
						<span class="block text-xs font-bold uppercase tracking-[0.15em] text-slate-600">
							Puntos Moon
						</span>
						<span class="block font-Manrope text-3xl text-slate-700">
							{puntos.saldo}
							<span class="text-base text-slate-500">pts</span>
						</span>
					</span>
					<Icon
						icon="material-symbols:chevron-right-rounded"
						width="26"
						class="text-slate-500 transition group-hover:translate-x-1"
					/>
				</button>
			</div>

			<!-- Pestañas -->
			<nav
				aria-label="Secciones de mi cuenta"
				class="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
			>
				{#each PESTAÑAS as item (item.id)}
					<button
						type="button"
						onclick={() => elegirPestaña(item.id)}
						aria-current={pestaña === item.id ? 'page' : undefined}
						class="flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 font-Manrope text-sm font-semibold transition {pestaña ===
						item.id
							? 'bg-slate-700 text-white shadow-md'
							: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}"
					>
						<Icon icon={item.icono} width="19" />
						{item.etiqueta}
					</button>
				{/each}
			</nav>

			<div class="mt-6">
				<!-- ============================ PEDIDOS ============================ -->
				{#if pestaña === 'pedidos'}
					{#if cargandoPedidos}
						<p class="rounded-3xl bg-white p-8 text-slate-500">Cargando tus pedidos...</p>
					{:else if errorPedidos}
						<p class="rounded-3xl bg-red-50 p-6 text-red-700">{errorPedidos}</p>
					{:else if pedidos.length === 0}
						<div class="rounded-3xl bg-white p-10 text-center shadow-sm">
							<Icon
								icon="material-symbols:package-2-outline"
								width="48"
								class="mx-auto text-slate-300"
							/>
							<p class="mt-4 font-Manrope text-xl text-slate-700">Aún no tienes pedidos</p>
							<p class="mx-auto mt-2 max-w-md text-sm text-slate-500">
								Cuando compres con tu cuenta, aquí verás cada pedido y su estado.
								Las compras hechas como invitada no aparecen en esta lista.
							</p>
							<a
								href="/products"
								class="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-sky-200 px-8 py-3 font-Manrope font-semibold text-slate-600 transition hover:bg-slate-600 hover:text-white"
							>
								Ver productos
							</a>
						</div>
					{:else}
						<div class="flex flex-col gap-4">
							{#each pedidos as pedido (pedido.id)}
								{@const estado = ESTADOS[pedido.estado]}
								<article class="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div>
											<p class="font-Manrope text-lg font-semibold text-slate-700">
												{pedido.numeroPedido || 'Pedido'}
											</p>
											<p class="text-sm text-slate-500">{fecha(pedido.fechaCreacion)}</p>
										</div>
										<span class="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide {estado.clases}">
											{estado.etiqueta}
										</span>
									</div>

									{#if pedido.estado === 'cancelado'}
										<p class="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
											Este pedido fue cancelado. Si tienes dudas, escríbenos por WhatsApp.
										</p>
									{:else}
										<!-- Seguimiento -->
										<ol class="mt-5 grid grid-cols-4 gap-1" aria-label="Seguimiento del pedido">
											{#each PASOS_PEDIDO as nombrePaso, indice (nombrePaso)}
												{@const hecho = indice <= estado.paso}
												<li class="flex flex-col gap-2">
													<span
														class="h-1.5 rounded-full {hecho ? 'bg-sky-400' : 'bg-slate-200'}"
													></span>
													<span
														class="text-[11px] font-semibold sm:text-xs {hecho
															? 'text-slate-700'
															: 'text-slate-400'}"
													>
														{nombrePaso}
													</span>
												</li>
											{/each}
										</ol>
										{#if pedido.estado === 'pendiente_contacto'}
											<p class="mt-3 text-sm text-slate-500">
												Recibimos tu pedido. Te contactaremos para confirmar el pago y la entrega.
											</p>
										{/if}
									{/if}

									<div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
										<div class="flex -space-x-2">
											{#each pedido.items.slice(0, 4) as item, indice (indice)}
												<img
													src={item.imagen}
													alt={item.nombre}
													loading="lazy"
													class="h-11 w-11 rounded-xl object-cover ring-2 ring-white"
												/>
											{/each}
											{#if pedido.items.length > 4}
												<span class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 ring-2 ring-white">
													+{pedido.items.length - 4}
												</span>
											{/if}
										</div>

										<div class="text-right">
											<p class="font-Manrope text-lg font-bold text-sky-700">
												{formatearUSD(pedido.totalUSD)}
											</p>
											{#if pedido.puntosMoon > 0 && pedido.estado !== 'cancelado'}
												<p class="text-xs font-semibold text-slate-500">
													{pedido.puntosOtorgados
														? `+${pedido.puntosMoon} puntos ganados`
														: `+${pedido.puntosMoon} puntos al confirmarse`}
												</p>
											{/if}
										</div>
									</div>

									<button
										type="button"
										onclick={() => (pedidosAbiertos[pedido.id] = !pedidosAbiertos[pedido.id])}
										aria-expanded={Boolean(pedidosAbiertos[pedido.id])}
										class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:underline"
									>
										{pedidosAbiertos[pedido.id] ? 'Ocultar detalle' : 'Ver detalle'}
										<Icon
											icon="material-symbols:expand-more-rounded"
											width="20"
											class="transition {pedidosAbiertos[pedido.id] ? 'rotate-180' : ''}"
										/>
									</button>

									{#if pedidosAbiertos[pedido.id]}
										<div transition:slide={{ duration: 200 }} class="mt-3 space-y-3">
											{#each pedido.items as item, indice (indice)}
												<div class="flex items-center gap-3">
													<img
														src={item.imagen}
														alt=""
														loading="lazy"
														class="h-12 w-12 shrink-0 rounded-xl object-cover"
													/>
													<p class="min-w-0 flex-1 text-sm text-slate-700">
														<span class="line-clamp-2">{item.nombre}</span>
														<span class="text-xs text-slate-500">
															{item.cantidad} × {formatearUSD(item.precioUSD)}
														</span>
													</p>
													<p class="shrink-0 text-sm font-semibold text-slate-700">
														{formatearUSD(item.subtotalUSD)}
													</p>
												</div>
											{/each}

											<dl class="space-y-1 border-t border-slate-100 pt-3 text-sm">
												<div class="flex justify-between text-slate-500">
													<dt>Subtotal</dt>
													<dd>{formatearUSD(pedido.subtotalUSD)}</dd>
												</div>
												{#if pedido.descuentoUSD > 0}
													<div class="flex justify-between text-slate-500">
														<dt>Descuento {pedido.cupon ? `(${pedido.cupon})` : ''}</dt>
														<dd>−{formatearUSD(pedido.descuentoUSD)}</dd>
													</div>
												{/if}
												<div class="flex justify-between font-semibold text-slate-700">
													<dt>Total</dt>
													<dd>{formatearUSD(pedido.totalUSD)}</dd>
												</div>
											</dl>

											{#if pedido.entrega.direccion}
												<p class="text-sm text-slate-500">
													<span class="font-semibold text-slate-600">Entrega:</span>
													{pedido.entrega.direccion}{pedido.entrega.casaApartamento
														? `, ${pedido.entrega.casaApartamento}`
														: ''}{pedido.entrega.ciudad ? `, ${pedido.entrega.ciudad}` : ''}
												</p>
											{/if}
										</div>
									{/if}
								</article>
							{/each}
						</div>
					{/if}

				<!-- ============================= PUNTOS ============================= -->
				{:else if pestaña === 'puntos'}
					<div class="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
						<div class="flex flex-col gap-5">
							<section class="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
								<p class="text-sm font-semibold text-slate-500">Tu saldo</p>
								<p class="mt-1 font-Manrope text-5xl text-slate-700">
									{puntos.saldo} <span class="text-xl text-slate-500">puntos</span>
								</p>
								<p class="mt-3 text-sm text-slate-500">
									Ganas 1 punto por cada {formatearUSD(DOLARES_POR_PUNTO)} que pagas en tus
									compras. Se suman cuando confirmamos tu pedido.
								</p>

								{#if proximoNivel}
									<div class="mt-6">
										<div class="flex justify-between text-xs font-semibold text-slate-600">
											<span>Próximo descuento: {proximoNivel.porcentaje}%</span>
											<span>{puntos.saldo} / {proximoNivel.puntos}</span>
										</div>
										<div class="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
											<div
												class="h-full rounded-full bg-sky-400 transition-all duration-700"
												style:width="{progreso}%"
											></div>
										</div>
										<p class="mt-2 text-xs text-slate-500">
											Te faltan {proximoNivel.puntos - puntos.saldo} puntos
											(unos {formatearUSD((proximoNivel.puntos - puntos.saldo) * DOLARES_POR_PUNTO)} en compras).
										</p>
									</div>
								{/if}

								<dl class="mt-6 grid grid-cols-2 gap-3">
									<div class="rounded-2xl bg-slate-50 p-4">
										<dt class="text-xs text-slate-500">Ganados en total</dt>
										<dd class="font-Manrope text-xl text-slate-700">{puntos.ganados}</dd>
									</div>
									<div class="rounded-2xl bg-slate-50 p-4">
										<dt class="text-xs text-slate-500">Canjeados</dt>
										<dd class="font-Manrope text-xl text-slate-700">{puntos.canjeados}</dd>
									</div>
								</dl>
							</section>

							<!-- Canje -->
							<section class="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
								<h2 class="font-Manrope text-2xl text-slate-700">Crea tu código de descuento</h2>
								<p class="mt-2 text-sm text-slate-500">
									Elige el descuento y ponle el nombre que quieras.
								</p>

								<form onsubmit={crearCodigo} class="mt-5 flex flex-col gap-4">
									<fieldset class="grid grid-cols-2 gap-3">
										<legend class="sr-only">Descuento</legend>
										{#each NIVELES_CANJE as nivel (nivel.porcentaje)}
											{@const alcanza = puntos.saldo >= nivel.puntos}
											<label
												class="cursor-pointer rounded-2xl border-2 p-4 transition {porcentajeElegido ===
												nivel.porcentaje
													? 'border-sky-400 bg-sky-50'
													: 'border-slate-200 hover:border-slate-300'}"
											>
												<input
													type="radio"
													name="nivel"
													value={nivel.porcentaje}
													bind:group={porcentajeElegido}
													class="sr-only"
												/>
												<span class="block font-Manrope text-3xl text-slate-700">
													{nivel.porcentaje}%
												</span>
												<span class="block text-sm font-semibold text-slate-600">
													{nivel.puntos} puntos
												</span>
												<span
													class="mt-1 block text-xs {alcanza ? 'text-green-700' : 'text-slate-400'}"
												>
													{alcanza ? 'Disponible' : `Te faltan ${nivel.puntos - puntos.saldo}`}
												</span>
											</label>
										{/each}
									</fieldset>

									<label>
										<span class="mb-2 block text-sm font-semibold text-slate-600">
											Nombre de tu código
										</span>
										<input
											bind:value={nombreCodigo}
											oninput={() => (nombreCodigo = normalizarCodigoPersonal(nombreCodigo))}
											maxlength={LARGO_MAXIMO_CODIGO}
											placeholder="Ej. LUNA10"
											autocomplete="off"
											autocapitalize="characters"
											spellcheck="false"
											class="{claseCampo} font-mono uppercase tracking-wider"
										/>
										<span class="mt-1.5 block text-xs text-slate-400">
											Solo letras y números, de 4 a {LARGO_MAXIMO_CODIGO} caracteres.
										</span>
									</label>

									{#if errorCanje}
										<p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorCanje}</p>
									{/if}

									{#if codigoCreado}
										<div class="rounded-2xl bg-green-50 px-4 py-4 text-sm text-green-800">
											<p class="font-semibold">¡Listo! Tu código ya está activo:</p>
											<button
												type="button"
												onclick={() => copiar(codigoCreado)}
												class="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-mono text-lg font-bold tracking-wider text-slate-700 ring-1 ring-green-200"
											>
												{codigoCreado}
												<Icon
													icon={copiado === codigoCreado
														? 'material-symbols:check-rounded'
														: 'material-symbols:content-copy-outline-rounded'}
													width="18"
												/>
											</button>
											<p class="mt-2">Úsalo al pagar en el checkout.</p>
										</div>
									{/if}

									<button
										type="submit"
										disabled={canjeando || puntos.saldo < nivelElegido.puntos}
										class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sky-200 px-8 py-3 font-Manrope font-semibold text-slate-600 transition hover:bg-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-sky-200 disabled:hover:text-slate-600"
									>
										{canjeando
											? 'Creando tu código...'
											: `Canjear ${nivelElegido.puntos} puntos`}
									</button>

									<p class="text-xs leading-relaxed text-slate-400">
										Cada código sirve una sola vez y solo con tu cuenta. Aplica en pagos en
										divisas (efectivo, Binance, Zelle y Zinli) y no se combina con otros
										cupones.
									</p>
								</form>
							</section>
						</div>

						<div class="flex flex-col gap-5">
							<section class="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
								<h2 class="font-Manrope text-xl text-slate-700">Mis códigos</h2>
								{#if codigos.length === 0}
									<p class="mt-3 text-sm text-slate-500">
										Todavía no has creado ningún código.
									</p>
								{:else}
									<ul class="mt-4 flex flex-col gap-3">
										{#each codigos as item (item.codigo)}
											<li class="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
												<div class="min-w-0">
													<p
														class="truncate font-mono font-bold tracking-wider {item.usado
															? 'text-slate-400 line-through'
															: 'text-slate-700'}"
													>
														{item.codigo}
													</p>
													<p class="text-xs text-slate-500">
														{item.porcentaje}% de descuento · {item.usado ? 'Usado' : 'Disponible'}
													</p>
												</div>
												{#if !item.usado}
													<button
														type="button"
														onclick={() => copiar(item.codigo)}
														aria-label="Copiar el código {item.codigo}"
														class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 transition hover:bg-sky-100"
													>
														<Icon
															icon={copiado === item.codigo
																? 'material-symbols:check-rounded'
																: 'material-symbols:content-copy-outline-rounded'}
															width="18"
														/>
													</button>
												{/if}
											</li>
										{/each}
									</ul>
								{/if}
							</section>

							<section class="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
								<h2 class="font-Manrope text-xl text-slate-700">Historial</h2>
								{#if movimientos.length === 0}
									<p class="mt-3 text-sm text-slate-500">
										Aquí verás los puntos que ganes y canjees.
									</p>
								{:else}
									<ul class="mt-4 divide-y divide-slate-100">
										{#each movimientos as movimiento (movimiento.id)}
											<li class="flex items-center justify-between gap-3 py-3">
												<div class="min-w-0">
													<p class="truncate text-sm text-slate-700">{movimiento.descripcion}</p>
													<p class="text-xs text-slate-400">{fecha(movimiento.fecha)}</p>
												</div>
												<span
													class="shrink-0 font-Manrope font-bold {movimiento.puntos >= 0
														? 'text-green-700'
														: 'text-slate-500'}"
												>
													{movimiento.puntos >= 0 ? '+' : ''}{movimiento.puntos}
												</span>
											</li>
										{/each}
									</ul>
								{/if}
							</section>
						</div>
					</div>

				<!-- =========================== DIRECCIONES =========================== -->
				{:else if pestaña === 'direcciones'}
					<section class="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 class="font-Manrope text-2xl text-slate-700">Mis direcciones</h2>
								<p class="mt-1 text-sm text-slate-500">
									Elígelas al comprar para no escribirlas cada vez.
								</p>
							</div>
							{#if !formularioDireccion && (perfil?.direcciones.length ?? 0) < MAXIMO_DIRECCIONES}
								<button
									type="button"
									onclick={nuevaDireccion}
									class="inline-flex items-center gap-2 rounded-full bg-sky-200 px-5 py-2.5 font-Manrope text-sm font-semibold text-slate-600 transition hover:bg-slate-600 hover:text-white"
								>
									<Icon icon="material-symbols:add-rounded" width="20" />
									Agregar dirección
								</button>
							{/if}
						</div>

						{#if errorDireccion && !formularioDireccion}
							<p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorDireccion}</p>
						{/if}

						{#if formularioDireccion}
							<form
								onsubmit={guardarDireccion}
								transition:slide={{ duration: 200 }}
								class="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2"
							>
								<label>
									<span class="mb-2 block text-sm text-slate-600">Nombre de la dirección</span>
									<input
										bind:value={formularioDireccion.alias}
										placeholder="Casa, Trabajo..."
										class={claseCampo}
									/>
								</label>
								<label>
									<span class="mb-2 block text-sm text-slate-600">Ciudad</span>
									<input
										bind:value={formularioDireccion.ciudad}
										required
										placeholder="Valencia"
										class={claseCampo}
									/>
								</label>
								<label class="sm:col-span-2">
									<span class="mb-2 block text-sm text-slate-600">Dirección</span>
									<input
										bind:value={formularioDireccion.direccion}
										required
										placeholder="Calle, avenida, referencia..."
										class={claseCampo}
									/>
								</label>
								<label>
									<span class="mb-2 block text-sm text-slate-600">Casa / apartamento (opcional)</span>
									<input bind:value={formularioDireccion.casaApartamento} class={claseCampo} />
								</label>
								<label>
									<span class="mb-2 block text-sm text-slate-600">Código postal (opcional)</span>
									<input bind:value={formularioDireccion.codigoPostal} class={claseCampo} />
								</label>
								<label class="sm:col-span-2">
									<span class="mb-2 block text-sm text-slate-600">Estado</span>
									<select bind:value={formularioDireccion.estado} class={claseCampo}>
										{#each ESTADOS_VENEZUELA as estadoVe (estadoVe)}
											<option value={estadoVe}>{estadoVe}</option>
										{/each}
									</select>
								</label>

								{#if errorDireccion}
									<p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
										{errorDireccion}
									</p>
								{/if}

								<div class="flex flex-wrap gap-3 sm:col-span-2">
									<button
										type="submit"
										disabled={guardandoDireccion}
										class="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-700 px-8 font-Manrope font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
									>
										{guardandoDireccion ? 'Guardando...' : 'Guardar dirección'}
									</button>
									<button
										type="button"
										onclick={() => (formularioDireccion = null)}
										class="min-h-12 rounded-full px-6 font-Manrope font-semibold text-slate-600 transition hover:bg-slate-200"
									>
										Cancelar
									</button>
								</div>
							</form>
						{/if}

						{#if perfil && perfil.direcciones.length > 0}
							<ul class="mt-6 grid gap-4 sm:grid-cols-2">
								{#each perfil.direcciones as direccion (direccion.id)}
									<li class="flex flex-col rounded-2xl border border-slate-200 p-5">
										<p class="flex items-center gap-2 font-Manrope font-semibold text-slate-700">
											<Icon icon="material-symbols:location-on-outline-rounded" width="20" class="text-sky-700" />
											{direccion.alias}
										</p>
										<p class="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
											{direccion.direccion}{direccion.casaApartamento
												? `, ${direccion.casaApartamento}`
												: ''}<br />
											{direccion.ciudad}, {direccion.estado}{direccion.codigoPostal
												? ` · ${direccion.codigoPostal}`
												: ''}
										</p>
										<div class="mt-4 flex gap-2">
											<button
												type="button"
												onclick={() => editarDireccion(direccion)}
												class="rounded-full bg-sky-50 px-4 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
											>
												Editar
											</button>
											<button
												type="button"
												onclick={() => eliminarDireccion(direccion)}
												class="rounded-full bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
											>
												Eliminar
											</button>
										</div>
									</li>
								{/each}
							</ul>
						{:else if !formularioDireccion}
							<p class="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
								Todavía no tienes direcciones guardadas.
							</p>
						{/if}

						{#if (perfil?.direcciones.length ?? 0) >= MAXIMO_DIRECCIONES}
							<p class="mt-4 text-xs text-slate-400">
								Puedes guardar hasta {MAXIMO_DIRECCIONES} direcciones.
							</p>
						{/if}
					</section>

				<!-- ============================ MIS DATOS ============================ -->
				{:else}
					<div class="grid gap-5 lg:grid-cols-2">
						<section class="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
							<h2 class="font-Manrope text-2xl text-slate-700">Datos personales</h2>

							<form onsubmit={guardarDatos} class="mt-5 flex flex-col gap-4">
								<label>
									<span class="mb-2 block text-sm text-slate-600">Nombre completo</span>
									<input bind:value={nombreEditado} required autocomplete="name" class={claseCampo} />
								</label>
								<label>
									<span class="mb-2 block text-sm text-slate-600">Teléfono</span>
									<input
										type="tel"
										bind:value={telefonoEditado}
										autocomplete="tel"
										placeholder="0412 000 0000"
										class={claseCampo}
									/>
								</label>
								<label>
									<span class="mb-2 block text-sm text-slate-600">Correo</span>
									<input
										value={$usuario.email ?? ''}
										disabled
										class="{claseCampo} cursor-not-allowed bg-slate-50 text-slate-500"
									/>
									<span class="mt-1.5 block text-xs text-slate-400">
										Para cambiar tu correo, escríbenos por WhatsApp.
									</span>
								</label>

								{#if mensajeDatos}
									<p class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{mensajeDatos}</p>
								{/if}
								{#if errorDatos}
									<p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorDatos}</p>
								{/if}

								<button
									type="submit"
									disabled={guardandoDatos}
									class="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-700 px-8 font-Manrope font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
								>
									{guardandoDatos ? 'Guardando...' : 'Guardar cambios'}
								</button>
							</form>
						</section>

						<div class="flex flex-col gap-5">
							{#if usaContraseña}
								<section class="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
									<h2 class="font-Manrope text-xl text-slate-700">Contraseña</h2>
									<p class="mt-2 text-sm text-slate-500">
										Te enviamos un enlace a tu correo para crear una nueva.
									</p>
									<a
										href="/forgot-password"
										class="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-sky-200 px-6 font-Manrope text-sm font-semibold text-slate-600 transition hover:bg-slate-600 hover:text-white"
									>
										Cambiar contraseña
									</a>
								</section>
							{/if}

							<section class="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
								<h2 class="font-Manrope text-xl text-slate-700">Correos promocionales</h2>
								{#if perfil}
									<label class="mt-4 flex items-start gap-3">
										<input
											type="checkbox"
											checked={perfil.recibirPromociones}
											disabled={guardandoPreferencia}
											onchange={(evento) => cambiarPreferencia(evento.currentTarget.checked)}
											class="mt-1 h-4 w-4 shrink-0"
										/>
										<span class="text-sm leading-6 text-slate-600">
											Quiero recibir cupones, ofertas y novedades de Moon Beauty en mi correo.
											Puedes cambiar esto cuando quieras.
										</span>
									</label>
								{:else}
									<p class="mt-3 text-sm text-slate-500">Cargando preferencia...</p>
								{/if}
								{#if mensajePreferencia}
									<p class="mt-3 text-sm text-green-700">{mensajePreferencia}</p>
								{/if}
								{#if errorPreferencia}
									<p class="mt-3 text-sm text-red-600">{errorPreferencia}</p>
								{/if}
							</section>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</main>
