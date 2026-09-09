<script lang="ts">
	import { onDestroy } from "svelte";
	import Icon from "@iconify/svelte";
	import {
		actualizarEstadoPedido,
		escucharPedidos,
		type EstadoPedido,
		type PedidoAdmin,
	} from "$lib/pedidos";
	import { formatearUSD, formatearVES } from "$lib/utils/moneda";

	let pedidos = $state<PedidoAdmin[]>([]);
	let cargando = $state(true);
	let error = $state("");

	let filtroEstado = $state<EstadoPedido | "todos">("todos");
	let busqueda = $state("");
	let expandidos = $state<Record<string, boolean>>({});
	let actualizandoId = $state<string | null>(null);

	const ESTADOS: Array<{
		valor: EstadoPedido;
		etiqueta: string;
		clases: string;
	}> = [
		{
			valor: "pendiente_contacto",
			etiqueta: "Sin contactar",
			clases: "bg-amber-100 text-amber-800",
		},
		{
			valor: "confirmado",
			etiqueta: "Confirmado",
			clases: "bg-sky-100 text-sky-800",
		},
		{
			valor: "enviado",
			etiqueta: "Enviado",
			clases: "bg-indigo-100 text-indigo-800",
		},
		{
			valor: "entregado",
			etiqueta: "Entregado",
			clases: "bg-green-100 text-green-800",
		},
		{
			valor: "cancelado",
			etiqueta: "Cancelado",
			clases: "bg-slate-200 text-slate-600",
		},
	];

	const ETIQUETAS_PAGO: Record<string, string> = {
		efectivo: "Efectivo",
		pago_movil: "Pago móvil",
		binance: "Binance",
		zelle: "Zelle",
		zinli: "Zinli",
	};

	function datosEstado(valor: EstadoPedido) {
		return (
			ESTADOS.find((estado) => estado.valor === valor) ?? ESTADOS[0]
		);
	}

	const pedidosFiltrados = $derived.by(() => {
		const texto = busqueda.trim().toLowerCase();

		return pedidos.filter((pedido) => {
			if (filtroEstado !== "todos" && pedido.estado !== filtroEstado) {
				return false;
			}

			if (!texto) return true;

			return (
				pedido.numeroPedido.toLowerCase().includes(texto) ||
				pedido.contacto.nombre.toLowerCase().includes(texto) ||
				pedido.contacto.correo.toLowerCase().includes(texto) ||
				pedido.contacto.telefono.toLowerCase().includes(texto)
			);
		});
	});

	const conteoPorEstado = $derived.by(() => {
		const conteo: Record<string, number> = { todos: pedidos.length };

		for (const estado of ESTADOS) {
			conteo[estado.valor] = 0;
		}

		for (const pedido of pedidos) {
			conteo[pedido.estado] = (conteo[pedido.estado] ?? 0) + 1;
		}

		return conteo;
	});

	function formatearFechaPedido(milisegundos: number) {
		if (!milisegundos) return "Sin fecha";

		return new Intl.DateTimeFormat("es-VE", {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(milisegundos));
	}

	/**
	 * Convierte un teléfono venezolano (0412-5050043) al formato
	 * internacional que necesita el enlace de WhatsApp (584125050043).
	 */
	function enlaceWhatsApp(telefono: string) {
		const digitos = telefono.replace(/\D/g, "");
		if (digitos.length < 10) return null;

		const internacional = digitos.startsWith("58")
			? digitos
			: digitos.startsWith("0")
				? `58${digitos.slice(1)}`
				: `58${digitos}`;

		return `https://wa.me/${internacional}`;
	}

	function alternarDetalle(id: string) {
		expandidos[id] = !expandidos[id];
	}

	async function cambiarEstado(pedido: PedidoAdmin, nuevoEstado: EstadoPedido) {
		if (nuevoEstado === pedido.estado) return;

		actualizandoId = pedido.id;
		error = "";

		try {
			await actualizarEstadoPedido(pedido.id, nuevoEstado);
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo actualizar el estado del pedido.";
		} finally {
			actualizandoId = null;
		}
	}

	const detenerPedidos = escucharPedidos(
		(datos) => {
			pedidos = datos;
			cargando = false;
		},
		(err) => {
			error = `No se pudieron cargar los pedidos: ${err.message}`;
			cargando = false;
		},
	);

	onDestroy(() => {
		detenerPedidos();
	});
</script>

<svelte:head>
	<title>Pedidos | Panel Moon Beauty</title>
</svelte:head>

<section class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<a
				href="/admin"
				class="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
			>
				<Icon icon="material-symbols:chevron-left-rounded" width="20" />
				Panel
			</a>

			<p class="mt-1 font-Manrope text-3xl text-slate-700">Pedidos</p>
		</div>

		<p class="text-sm text-slate-500">
			{pedidos.length}
			{pedidos.length === 1 ? "pedido" : "pedidos"} en total
		</p>
	</div>

	{#if error}
		<div class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
			{error}
		</div>
	{/if}

	<div class="mt-6 flex flex-wrap gap-2">
		<button
			type="button"
			onclick={() => (filtroEstado = "todos")}
			class="rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm"
			class:bg-slate-700={filtroEstado === "todos"}
			class:text-white={filtroEstado === "todos"}
			class:bg-slate-100={filtroEstado !== "todos"}
			class:text-slate-600={filtroEstado !== "todos"}
		>
			Todos ({conteoPorEstado.todos})
		</button>

		{#each ESTADOS as estado}
			<button
				type="button"
				onclick={() => (filtroEstado = estado.valor)}
				class="rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm"
				class:bg-slate-700={filtroEstado === estado.valor}
				class:text-white={filtroEstado === estado.valor}
				class:bg-slate-100={filtroEstado !== estado.valor}
				class:text-slate-600={filtroEstado !== estado.valor}
			>
				{estado.etiqueta} ({conteoPorEstado[estado.valor] ?? 0})
			</button>
		{/each}
	</div>

	<div class="relative mt-4">
		<Icon
			icon="material-symbols:search"
			width="20"
			class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
		/>

		<input
			type="search"
			placeholder="Buscar por número de pedido, nombre, correo o teléfono..."
			aria-label="Buscar pedidos"
			bind:value={busqueda}
			class="h-12 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
		/>
	</div>

	{#if cargando}
		<p class="mt-10 text-slate-500">Cargando pedidos...</p>
	{:else if pedidosFiltrados.length === 0}
		<div
			class="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center"
		>
			<p class="text-slate-500">
				{pedidos.length === 0
					? "Todavía no hay pedidos."
					: "Ningún pedido coincide con el filtro."}
			</p>
		</div>
	{:else}
		<div class="mt-6 flex flex-col gap-3">
			{#each pedidosFiltrados as pedido (pedido.id)}
				{@const infoEstado = datosEstado(pedido.estado)}
				{@const whatsapp = enlaceWhatsApp(pedido.contacto.telefono)}

				<article
					class="overflow-hidden rounded-2xl border border-slate-200 bg-white"
				>
					<div class="flex flex-wrap items-start justify-between gap-3 p-4">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<p class="font-Manrope font-bold text-slate-700">
									{pedido.numeroPedido || "Sin número"}
								</p>

								<span
									class="rounded-full px-3 py-1 text-xs font-semibold {infoEstado.clases}"
								>
									{infoEstado.etiqueta}
								</span>
							</div>

							<p class="mt-1 text-sm text-slate-500">
								{formatearFechaPedido(pedido.fechaCreacion)}
							</p>

							<p class="mt-1 text-sm text-slate-600">
								{pedido.contacto.nombre || "Sin nombre"} ·
								{ETIQUETAS_PAGO[pedido.metodoPago] ?? pedido.metodoPago}
							</p>
						</div>

						<div class="text-right">
							<p class="font-Manrope text-xl text-slate-700">
								{formatearUSD(pedido.totalUSD)}
							</p>

							{#if pedido.totalVES > 0}
								<p class="text-sm text-sky-700">
									{formatearVES(pedido.totalVES)}
								</p>
							{/if}
						</div>
					</div>

					<div
						class="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3"
					>
						<label class="sr-only" for="estado-{pedido.id}">
							Estado del pedido {pedido.numeroPedido}
						</label>

						<select
							id="estado-{pedido.id}"
							value={pedido.estado}
							disabled={actualizandoId === pedido.id}
							onchange={(evento) =>
								cambiarEstado(
									pedido,
									evento.currentTarget.value as EstadoPedido,
								)}
							class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
						>
							{#each ESTADOS as estado}
								<option value={estado.valor}>{estado.etiqueta}</option>
							{/each}
						</select>

						{#if whatsapp}
							<a
								href={whatsapp}
								target="_blank"
								rel="noreferrer"
								class="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
							>
								<Icon icon="mdi:whatsapp" width="18" />
								WhatsApp
							</a>
						{/if}

						{#if pedido.comprobantePago.url}
							<a
								href={pedido.comprobantePago.url}
								target="_blank"
								rel="noreferrer"
								class="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
							>
								<Icon icon="material-symbols:receipt-long-outline" width="18" />
								Comprobante
							</a>
						{/if}

						<button
							type="button"
							onclick={() => alternarDetalle(pedido.id)}
							class="ml-auto inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
						>
							{expandidos[pedido.id] ? "Ocultar" : "Ver detalle"}

							<Icon
								icon={expandidos[pedido.id]
									? "material-symbols:expand-less-rounded"
									: "material-symbols:expand-more-rounded"}
								width="20"
							/>
						</button>
					</div>

					{#if expandidos[pedido.id]}
						<div class="border-t border-slate-100 bg-slate-50 p-4">
							<div class="grid gap-6 md:grid-cols-2">
								<div>
									<p
										class="text-xs font-bold uppercase tracking-wider text-slate-400"
									>
										Contacto
									</p>

									<ul class="mt-2 space-y-1 text-sm text-slate-600">
										<li>{pedido.contacto.nombre || "—"}</li>

										{#if pedido.contacto.correo}
											<li>
												<a
													href="mailto:{pedido.contacto.correo}"
													class="transition hover:text-sky-700 hover:underline"
												>
													{pedido.contacto.correo}
												</a>
											</li>
										{/if}

										{#if pedido.contacto.telefono}
											<li>{pedido.contacto.telefono}</li>
										{/if}
									</ul>
								</div>

								<div>
									<p
										class="text-xs font-bold uppercase tracking-wider text-slate-400"
									>
										Entrega
									</p>

									<ul class="mt-2 space-y-1 text-sm text-slate-600">
										<li>{pedido.entrega.direccion || "—"}</li>

										{#if pedido.entrega.casaApartamento}
											<li>{pedido.entrega.casaApartamento}</li>
										{/if}

										<li>
											{[pedido.entrega.ciudad, pedido.entrega.estado]
												.filter(Boolean)
												.join(", ") || "—"}
											{#if pedido.entrega.codigoPostal}
												· {pedido.entrega.codigoPostal}
											{/if}
										</li>

										{#if pedido.entrega.ubicacionMapa}
											<li>
												<a
													href="https://www.google.com/maps?q={pedido.entrega
														.ubicacionMapa.lat},{pedido.entrega.ubicacionMapa
														.lng}"
													target="_blank"
													rel="noreferrer"
													class="inline-flex items-center gap-1 text-sky-700 transition hover:underline"
												>
													<Icon
														icon="material-symbols:location-on-outline-rounded"
														width="16"
													/>
													Ver ubicación en el mapa
												</a>
											</li>
										{/if}
									</ul>
								</div>
							</div>

							<p
								class="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400"
							>
								Productos
							</p>

							<div class="mt-2 flex flex-col gap-2">
								{#each pedido.items as item (item.id)}
									<div
										class="flex items-center gap-3 rounded-xl bg-white p-2"
									>
										{#if item.imagen}
											<img
												src={item.imagen}
												alt={item.nombre}
												class="h-12 w-12 shrink-0 rounded-lg object-cover"
											/>
										{:else}
											<div class="h-12 w-12 shrink-0 rounded-lg bg-slate-100"></div>
										{/if}

										<div class="min-w-0 flex-1">
											<p class="truncate text-sm text-slate-700">
												{item.nombre}
											</p>
											<p class="text-xs text-slate-500">
												{item.cantidad} × {formatearUSD(item.precioUSD)}
											</p>
										</div>

										<p class="text-sm font-semibold text-slate-700">
											{formatearUSD(item.subtotalUSD)}
										</p>
									</div>
								{:else}
									<p class="text-sm text-slate-500">
										Este pedido no tiene productos guardados.
									</p>
								{/each}
							</div>

							<div
								class="mt-4 flex flex-col gap-1 border-t border-slate-200 pt-3 text-sm"
							>
								<div class="flex justify-between text-slate-600">
									<span>Subtotal</span>
									<span>{formatearUSD(pedido.subtotalUSD)}</span>
								</div>

								{#if pedido.descuentoUSD > 0}
									<div class="flex justify-between text-green-700">
										<span>
											Descuento{pedido.cupon ? ` (${pedido.cupon})` : ""}
										</span>
										<span>−{formatearUSD(pedido.descuentoUSD)}</span>
									</div>
								{/if}

								<div
									class="flex justify-between font-bold text-slate-700"
								>
									<span>Total</span>
									<span>{formatearUSD(pedido.totalUSD)}</span>
								</div>

								{#if pedido.totalVES > 0}
									<div class="flex justify-between text-sky-700">
										<span>Total en bolívares</span>
										<span>{formatearVES(pedido.totalVES)}</span>
									</div>
								{/if}

								{#if pedido.tasaBCV > 0}
									<p class="mt-1 text-xs text-slate-400">
										Tasa BCV usada: {pedido.tasaBCV}
									</p>
								{/if}

								{#if pedido.comprobantePago.referencia}
									<p class="mt-1 text-xs text-slate-500">
										Referencia de pago: {pedido.comprobantePago.referencia}
									</p>
								{/if}
							</div>
						</div>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</section>
