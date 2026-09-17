<script lang="ts">
	import { onDestroy } from "svelte";
	import Icon from "@iconify/svelte";
	import { escucharPedidos, type EstadoPedido, type PedidoAdmin } from "$lib/pedidos";
	import { formatearUSD } from "$lib/utils/moneda";

	let pedidos = $state<PedidoAdmin[]>([]);
	let cargando = $state(true);
	let error = $state("");

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

	const ESTADOS_ACTIVOS: EstadoPedido[] = [
		"pendiente_contacto",
		"confirmado",
		"enviado",
	];

	const ESTILO_ESTADO: Record<EstadoPedido, string> = {
		pendiente_contacto: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
		confirmado: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
		enviado: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
		entregado: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
		cancelado: "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300",
	};

	const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
		pendiente_contacto: "Sin contactar",
		confirmado: "Confirmado",
		enviado: "Enviado",
		entregado: "Entregado",
		cancelado: "Cancelado",
	};

	const UN_DIA_MS = 24 * 60 * 60 * 1000;

	// Todas las métricas de esta página salen de los pedidos reales que ya
	// carga el panel (misma fuente que /admin/pedidos) — nada acá es un
	// número inventado. Lo que no tenemos forma de medir todavía (tráfico
	// del sitio, conversión) simplemente no se muestra.
	const pedidosValidos = $derived(pedidos.filter((p) => p.estado !== "cancelado"));

	function pedidosEnVentana(desdeMs: number, hastaMs: number) {
		return pedidosValidos.filter(
			(p) => p.fechaCreacion >= desdeMs && p.fechaCreacion < hastaMs,
		);
	}

	function sumaVentas(lista: PedidoAdmin[]) {
		return lista.reduce((total, p) => total + p.totalUSD, 0);
	}

	function delta(actual: number, anterior: number): { texto: string; positivo: boolean } | null {
		if (anterior <= 0) return null;
		const cambio = ((actual - anterior) / anterior) * 100;
		return {
			texto: `${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)}%`,
			positivo: cambio >= 0,
		};
	}

	const metricas = $derived.by(() => {
		const ahora = Date.now();
		const ultimos7 = pedidosEnVentana(ahora - 7 * UN_DIA_MS, ahora);
		const previos7 = pedidosEnVentana(ahora - 14 * UN_DIA_MS, ahora - 7 * UN_DIA_MS);

		const ventasUltimos7 = sumaVentas(ultimos7);
		const ventasPrevios7 = sumaVentas(previos7);

		const clientesUltimos7 = new Set(ultimos7.map((p) => p.usuarioId)).size;
		const clientesPrevios7 = new Set(previos7.map((p) => p.usuarioId)).size;

		const ticketUltimos7 = ultimos7.length > 0 ? ventasUltimos7 / ultimos7.length : 0;
		const ticketPrevios7 = previos7.length > 0 ? ventasPrevios7 / previos7.length : 0;

		const activos = pedidos.filter((p) => ESTADOS_ACTIVOS.includes(p.estado));
		const activosUltimos7 = ultimos7.filter((p) => ESTADOS_ACTIVOS.includes(p.estado)).length;
		const activosPrevios7 = previos7.filter((p) => ESTADOS_ACTIVOS.includes(p.estado)).length;

		return {
			ventasTotales: pedidosValidos.reduce((t, p) => t + p.totalUSD, 0),
			ventasDelta: delta(ventasUltimos7, ventasPrevios7),
			pedidosActivos: activos.length,
			pedidosActivosDelta: delta(activosUltimos7, activosPrevios7),
			clientesUltimos7,
			clientesDelta: delta(clientesUltimos7, clientesPrevios7),
			ticketPromedio: ticketUltimos7,
			ticketDelta: delta(ticketUltimos7, ticketPrevios7),
		};
	});

	// Ingresos por día del mes actual, para el gráfico — datos reales, sin
	// librería de gráficos: es un polyline simple armado a mano.
	const grafico = $derived.by(() => {
		const ahora = new Date();
		const diaHoy = ahora.getDate();
		const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();

		const porDia = new Array(diaHoy).fill(0);
		for (const p of pedidosValidos) {
			if (p.fechaCreacion < inicioMes) continue;
			const dia = new Date(p.fechaCreacion).getDate();
			if (dia >= 1 && dia <= diaHoy) {
				porDia[dia - 1] += p.totalUSD;
			}
		}

		const total = porDia.reduce((a, b) => a + b, 0);
		const maximo = Math.max(...porDia, 1);

		const ancho = 600;
		const alto = 160;
		const puntos = porDia.map((valor, i) => {
			const x = diaHoy > 1 ? (i / (diaHoy - 1)) * ancho : ancho / 2;
			const y = alto - (valor / maximo) * (alto - 20) - 10;
			return `${x.toFixed(1)},${y.toFixed(1)}`;
		});

		return {
			tieneVentas: total > 0,
			puntosLinea: puntos.join(" "),
			puntosArea: `0,${alto} ${puntos.join(" ")} ${ancho},${alto}`,
			ancho,
			alto,
		};
	});

	// Más vendidos: unidades reales despachadas por producto, sumadas de
	// las líneas de todos los pedidos (sin cancelar).
	const masVendidos = $derived.by(() => {
		const porProducto = new Map<
			string | number,
			{ nombre: string; tipo: string; unidades: number }
		>();

		for (const p of pedidosValidos) {
			for (const item of p.items) {
				const previo = porProducto.get(item.id);
				if (previo) {
					previo.unidades += item.cantidad;
				} else {
					porProducto.set(item.id, {
						nombre: item.nombre,
						tipo: item.tipo,
						unidades: item.cantidad,
					});
				}
			}
		}

		return [...porProducto.values()]
			.sort((a, b) => b.unidades - a.unidades)
			.slice(0, 4);
	});

	const pedidosRecientes = $derived(pedidos.slice(0, 5));

	function nombreProductosPedido(pedido: PedidoAdmin) {
		if (pedido.items.length === 0) return "—";
		const primero = pedido.items[0];
		const sufijo = primero.cantidad > 1 ? ` x${primero.cantidad}` : "";
		const resto = pedido.items.length > 1 ? ` +${pedido.items.length - 1} más` : "";
		return `${primero.nombre}${sufijo}${resto}`;
	}
</script>

<svelte:head>
	<title>Dashboard | Panel de administración | Moon Beauty</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="font-Manrope text-2xl font-semibold text-slate-800 dark:text-white">
			Resumen del panel
		</h1>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			Datos en vivo de los pedidos de Moon Beauty.
		</p>
	</div>

	{#if error}
		<p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
			{error}
		</p>
	{:else if cargando}
		<p class="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
	{:else}
		<section>
			<h2 class="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
				Pulso del negocio
			</h2>

			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-[#141a2e]">
					<div class="flex items-start justify-between">
						<p class="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
							Ventas totales
						</p>
						<Icon icon="material-symbols:payments-outline" width="20" class="text-slate-300 dark:text-slate-500" />
					</div>
					<p class="mt-2 font-Manrope text-2xl font-semibold text-slate-800 dark:text-white">
						{formatearUSD(metricas.ventasTotales)}
					</p>
					{#if metricas.ventasDelta}
						<p class="mt-2 flex items-center gap-1 text-xs {metricas.ventasDelta.positivo ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}">
							<Icon icon={metricas.ventasDelta.positivo ? "material-symbols:trending-up-rounded" : "material-symbols:trending-down-rounded"} width="16" />
							{metricas.ventasDelta.texto} vs. semana anterior
						</p>
					{/if}
				</div>

				<div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-[#141a2e]">
					<div class="flex items-start justify-between">
						<p class="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
							Pedidos activos
						</p>
						<Icon icon="material-symbols:local-shipping-outline" width="20" class="text-slate-300 dark:text-slate-500" />
					</div>
					<p class="mt-2 font-Manrope text-2xl font-semibold text-slate-800 dark:text-white">
						{metricas.pedidosActivos}
					</p>
					{#if metricas.pedidosActivosDelta}
						<p class="mt-2 flex items-center gap-1 text-xs {metricas.pedidosActivosDelta.positivo ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}">
							<Icon icon={metricas.pedidosActivosDelta.positivo ? "material-symbols:trending-up-rounded" : "material-symbols:trending-down-rounded"} width="16" />
							{metricas.pedidosActivosDelta.texto} vs. semana anterior
						</p>
					{/if}
				</div>

				<div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-[#141a2e]">
					<div class="flex items-start justify-between">
						<p class="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
							Clientes (7 días)
						</p>
						<Icon icon="material-symbols:person-add-outline" width="20" class="text-slate-300 dark:text-slate-500" />
					</div>
					<p class="mt-2 font-Manrope text-2xl font-semibold text-slate-800 dark:text-white">
						{metricas.clientesUltimos7}
					</p>
					{#if metricas.clientesDelta}
						<p class="mt-2 flex items-center gap-1 text-xs {metricas.clientesDelta.positivo ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}">
							<Icon icon={metricas.clientesDelta.positivo ? "material-symbols:trending-up-rounded" : "material-symbols:trending-down-rounded"} width="16" />
							{metricas.clientesDelta.texto} vs. semana anterior
						</p>
					{/if}
				</div>

				<div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-[#141a2e]">
					<div class="flex items-start justify-between">
						<p class="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
							Ticket promedio
						</p>
						<Icon icon="material-symbols:bar-chart-4-bars-rounded" width="20" class="text-slate-300 dark:text-slate-500" />
					</div>
					<p class="mt-2 font-Manrope text-2xl font-semibold text-slate-800 dark:text-white">
						{formatearUSD(metricas.ticketPromedio)}
					</p>
					{#if metricas.ticketDelta}
						<p class="mt-2 flex items-center gap-1 text-xs {metricas.ticketDelta.positivo ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}">
							<Icon icon={metricas.ticketDelta.positivo ? "material-symbols:trending-up-rounded" : "material-symbols:trending-down-rounded"} width="16" />
							{metricas.ticketDelta.texto} vs. semana anterior
						</p>
					{/if}
				</div>
			</div>
		</section>

		<div class="mt-6 grid min-w-0 gap-6 xl:grid-cols-3">
			<div class="min-w-0 space-y-6 xl:col-span-2">
				<section class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-[#141a2e]">
					<div class="flex items-center justify-between">
						<h2 class="font-Manrope text-base font-semibold text-slate-800 dark:text-white">
							Resumen de ingresos
						</h2>
						<span class="text-xs text-slate-400 dark:text-slate-500">Este mes</span>
					</div>

					{#if grafico.tieneVentas}
						<svg
							viewBox="0 0 {grafico.ancho} {grafico.alto}"
							class="mt-4 h-40 w-full"
							preserveAspectRatio="none"
						>
							<polygon points={grafico.puntosArea} class="fill-sky-100 dark:fill-sky-500/10" />
							<polyline
								points={grafico.puntosLinea}
								fill="none"
								class="stroke-sky-500 dark:stroke-sky-400"
								stroke-width="2.5"
							/>
						</svg>
					{:else}
						<div class="mt-4 flex h-40 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400 dark:bg-[#1c2440] dark:text-slate-500">
							Sin ventas registradas este mes todavía
						</div>
					{/if}
				</section>

				<section class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-[#141a2e]">
					<div class="flex items-center justify-between">
						<h2 class="font-Manrope text-base font-semibold text-slate-800 dark:text-white">
							Pedidos recientes
						</h2>
						<a
							href="/admin/pedidos"
							class="flex items-center gap-1 text-sm text-sky-600 hover:underline dark:text-sky-400"
						>
							Ver todos
							<Icon icon="material-symbols:arrow-right-alt-rounded" width="18" />
						</a>
					</div>

					{#if pedidosRecientes.length === 0}
						<p class="mt-4 text-sm text-slate-400 dark:text-slate-500">Todavía no hay pedidos.</p>
					{:else}
						<div class="mt-4 overflow-x-auto">
							<table class="w-full min-w-[560px] text-sm">
								<thead>
									<tr class="border-b border-slate-100 text-left text-xs font-semibold tracking-wide text-slate-400 uppercase dark:border-white/5 dark:text-slate-500">
										<th class="pb-2 font-semibold">Pedido</th>
										<th class="pb-2 font-semibold">Cliente</th>
										<th class="pb-2 font-semibold">Producto</th>
										<th class="pb-2 font-semibold">Estado</th>
										<th class="pb-2 text-right font-semibold">Total</th>
									</tr>
								</thead>
								<tbody>
									{#each pedidosRecientes as pedido (pedido.id)}
										<tr class="border-b border-slate-50 last:border-0 dark:border-white/5">
											<td class="py-2.5 text-slate-500 dark:text-slate-400">#{pedido.numeroPedido}</td>
											<td class="py-2.5 text-slate-700 dark:text-slate-200">{pedido.contacto.nombre || "—"}</td>
											<td class="py-2.5 text-slate-500 dark:text-slate-400">{nombreProductosPedido(pedido)}</td>
											<td class="py-2.5">
												<span class="rounded-full px-2.5 py-1 text-xs font-medium {ESTILO_ESTADO[pedido.estado]}">
													{ETIQUETA_ESTADO[pedido.estado]}
												</span>
											</td>
											<td class="py-2.5 text-right font-medium text-slate-700 dark:text-slate-200">
												{formatearUSD(pedido.totalUSD)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</section>
			</div>

			<section class="h-fit rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-[#141a2e]">
				<h2 class="font-Manrope text-base font-semibold text-slate-800 dark:text-white">
					Más vendidos
				</h2>

				{#if masVendidos.length === 0}
					<p class="mt-4 text-sm text-slate-400 dark:text-slate-500">
						Todavía no hay unidades vendidas registradas.
					</p>
				{:else}
					<div class="mt-4 space-y-4">
						{#each masVendidos as producto (producto.nombre)}
							<div class="flex items-center gap-3">
								<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-[#1c2440] dark:text-slate-500">
									<Icon icon="material-symbols:spa-outline" width="22" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
										{producto.nombre}
									</p>
									<p class="truncate text-xs text-slate-400 dark:text-slate-500">
										{producto.tipo || "Sin categoría"}
									</p>
								</div>
								<div class="shrink-0 text-right">
									<p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
										{producto.unidades}
									</p>
									<p class="text-[11px] tracking-wide text-slate-400 uppercase dark:text-slate-500">
										unidades
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</div>
	{/if}
</div>
