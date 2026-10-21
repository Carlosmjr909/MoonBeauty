<script lang="ts">
	import Icon from "@iconify/svelte";
	import { carrito } from "$lib/cart.js";
	import { rutinaGuardada } from "$lib/rutinaCarrito";
	import {
		armarRutina,
		calcularDescuentoRutina,
		PREOCUPACIONES,
		TIPOS_PIEL,
		type Preocupacion,
		type ProductoParaRutina,
		type TipoPiel,
	} from "$lib/rutinas";
	import {
		convertirUSDaVES,
		formatearUSD,
		formatearVES,
	} from "$lib/utils/moneda";

	interface PropTypes {
		tasaBCV?: number | null;
		/** Catálogo real; de aquí salen nombre, foto, precio y stock. */
		productos?: ProductoParaRutina[];
	}

	const { tasaBCV = null, productos = [] }: PropTypes = $props();

	// Qué productos recomienda cada paso vive en $lib/rutinas: el servidor
	// usa la misma lógica para validar el 10 % al crear el pedido.
	const tiposPiel = TIPOS_PIEL;
	const preocupaciones = PREOCUPACIONES;

	const notasPiel: Record<TipoPiel, string> = {
		Seca: "En el clima venezolano, tu piel seca necesita capas que sellen la humedad sin sentirse pesadas — priorizamos aceites limpiadores suaves y cremas ricas en ceramidas.",
		Grasa: "Con el calor y la humedad de Venezuela, tu piel grasa se beneficia de texturas ligeras tipo espuma y gel que controlan el brillo sin resecar.",
		Mixta: "Para el calor y humedad venezolana en piel mixta recomendamos texturas tipo gel-crema y esencias ligeras con Centella Asiática.",
		Normal: "Tu piel normal se adapta bien al clima tropical, así que buscamos mantener el equilibrio con fórmulas livianas que hidratan sin sobrecargar.",
		Sensible: "En un clima cálido como el venezolano, tu piel sensible agradece fórmulas sin fragancia y con ingredientes calmantes como Centella Asiática, para evitar irritación.",
	};

	const notasPreocupacion: Record<Preocupacion, string> = {
		Hidratación: "Sumamos un paso con PDRN o ácido hialurónico para reponer la humedad que el calor tiende a evaporar más rápido.",
		Manchas: "Incorporamos activos como niacinamida y TXA para unificar el tono y atenuar manchas post-sol o post-acné, muy comunes en climas soleados.",
		Acné: "Elige activos calmantes y no comedogénicos que traten los brotes sin resecar ni irritar más la piel.",
		"Poros Dilatados": "Sumamos un tratamiento con espículas o niacinamida para minimizar la apariencia de los poros dilatados por el calor y la grasa.",
		Luminosidad: "Un sérum con vitamina C o activos iluminadores te da ese brillo tipo 'piel de cristal' que tanto se busca en las rutinas coreanas.",
		"Barrera Cutánea": "Priorizamos fórmulas calmantes con Centella Asiática y pantenol para reforzar tu barrera cutánea, clave antes de cualquier tratamiento activo.",
	};

	let tipoPielSeleccionado = $state<TipoPiel>("Mixta");
	let preocupacionSeleccionada = $state<Preocupacion>("Hidratación");

	const pasos = $derived(
		armarRutina(tipoPielSeleccionado, preocupacionSeleccionada, productos),
	);

	const subtotal = $derived(
		pasos.reduce((total, paso) => total + paso.producto.precio, 0),
	);
	// Mismo cálculo que el carrito, el checkout y el servidor.
	const totalConDescuento = $derived(
		Math.round(
			(subtotal -
				calcularDescuentoRutina(
					pasos.map((paso) => ({ ...paso.producto, cantidad: 1 })),
					pasos.map((paso) => paso.producto.id),
				).descuentoUSD) *
				100,
		) / 100,
	);
	const totalVES = $derived(
		tasaBCV ? convertirUSDaVES(totalConDescuento, tasaBCV) : null,
	);

	const consejo = $derived(
		`${notasPiel[tipoPielSeleccionado]} ${notasPreocupacion[preocupacionSeleccionada]}`,
	);

	let agregado = $state(false);

	function crearRutina() {
		for (const { etiqueta, producto } of pasos) {
			carrito.agregar(
				{
					id: producto.id,
					Nombre: producto.Nombre,
					Tipo: etiqueta,
					imagen: producto.imagen,
					precio: producto.precio,
					stock: producto.stock,
				},
				1,
			);
		}

		// El carrito y el checkout descuentan el 10 % mientras estén todos
		// los productos de esta rutina.
		rutinaGuardada.set({
			tipoPiel: tipoPielSeleccionado,
			preocupacion: preocupacionSeleccionada,
			ids: Object.fromEntries(
				pasos.map((paso) => [paso.paso, paso.producto.id]),
			),
		});

		agregado = true;
		setTimeout(() => {
			agregado = false;
		}, 2200);
	}
</script>

<section class="bg-gradient-to-b from-sky-50/70 via-white to-white py-12 sm:py-16 lg:py-20 2xl:py-24">
	<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px]">
		<p class="font-Manrope text-sm font-bold uppercase tracking-[0.2em] text-sky-700 sm:text-base">
			Diagnóstico rápido
		</p>
		<h2 class="mt-2 font-Manrope text-3xl text-slate-700 sm:text-4xl lg:text-5xl">
			Encuentra tu rutina <em class="italic">ideal</em>
		</h2>
		<p class="mt-4 max-w-2xl font-Manrope text-base text-slate-500 sm:text-lg">
			Elige tus características dérmicas y nuestro algoritmo seleccionará los
			activos coreanos exactos que necesitas.
		</p>

		<div class="mt-10 grid grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-2 lg:gap-12">
			<!-- Selectores -->
			<div class="flex flex-col gap-8">
				<div>
					<p class="font-Manrope text-sm font-bold uppercase tracking-[0.1em] text-slate-700">
						Selecciona tu tipo de piel:
					</p>
					<div class="mt-4 flex flex-wrap gap-2.5">
						{#each tiposPiel as tipo (tipo)}
							<button
								type="button"
								onclick={() => (tipoPielSeleccionado = tipo)}
								class="rounded-full px-5 py-2.5 font-Manrope text-sm font-semibold transition duration-200 {tipoPielSeleccionado ===
								tipo
									? 'bg-slate-700 text-white shadow-md'
									: 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-100'}"
							>
								{tipo}
							</button>
						{/each}
					</div>
				</div>

				<div>
					<p class="font-Manrope text-sm font-bold uppercase tracking-[0.1em] text-slate-700">
						Tu principal preocupación:
					</p>
					<div class="mt-4 flex flex-wrap gap-2.5">
						{#each preocupaciones as preocupacion (preocupacion)}
							<button
								type="button"
								onclick={() => (preocupacionSeleccionada = preocupacion)}
								class="rounded-full px-5 py-2.5 font-Manrope text-sm font-semibold transition duration-200 {preocupacionSeleccionada ===
								preocupacion
									? 'bg-slate-700 text-white shadow-md'
									: 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-100'}"
							>
								{preocupacion}
							</button>
						{/each}
					</div>
				</div>

				<div class="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-5">
					<Icon
						icon="material-symbols:lightbulb-outline-rounded"
						width="22"
						class="mt-0.5 shrink-0 text-sky-700"
					/>
					<p class="font-Manrope text-sm leading-relaxed text-slate-600 sm:text-base">
						{consejo}
					</p>
				</div>
			</div>

			<!-- Rutina sugerida -->
			<div class="rounded-3xl border border-slate-100 bg-white p-4 shadow-lg sm:p-8">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<p class="font-Manrope text-sm font-bold uppercase tracking-[0.1em] text-slate-700 sm:text-base">
						Rutina sugerida: piel {tipoPielSeleccionado.toLowerCase()}
					</p>
					<span class="rounded-full bg-sky-200 px-3 py-1 font-Manrope text-xs font-bold uppercase tracking-wide text-slate-700">
						-10% bundle
					</span>
				</div>

				<div class="mt-6 flex flex-col gap-5">
					{#each pasos as paso (paso.numero)}
						<div class="flex items-center gap-2.5 sm:gap-4">
							<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 font-Manrope text-xs font-bold text-sky-700 sm:h-8 sm:w-8 sm:text-sm">
								{paso.numero}
							</div>

							<img
								src={paso.producto.imagen}
								alt={paso.producto.Nombre}
								loading="lazy"
								class="h-11 w-11 shrink-0 rounded-xl object-cover sm:h-14 sm:w-14"
							/>

							<div class="min-w-0 flex-1">
								<div class="flex items-baseline justify-between gap-2">
									<p class="truncate font-Manrope text-xs font-semibold text-slate-700 sm:text-base">
										{paso.producto.Nombre}
									</p>
									<p class="shrink-0 font-Manrope text-xs font-bold text-slate-700 sm:text-base">
										{formatearUSD(paso.producto.precio)}
									</p>
								</div>
								<p class="mt-0.5 text-[11px] leading-snug text-slate-500 sm:text-sm">
									{paso.producto.beneficio}
								</p>
							</div>
						</div>
					{/each}
				</div>

				<div class="mt-6 border-t border-slate-100 pt-6">
					<div class="flex items-center justify-between">
						<p class="text-sm text-slate-500">Precio regular</p>
						<p class="text-sm text-slate-400 line-through">
							{formatearUSD(subtotal)}
						</p>
					</div>
					<div class="mt-1 flex items-center justify-between">
						<p class="font-Manrope text-base font-bold text-slate-700 sm:text-lg">
							Total con descuento
						</p>
						<p class="font-Manrope text-xl font-bold text-sky-700 sm:text-2xl">
							{formatearUSD(totalConDescuento)}
						</p>
					</div>
					{#if totalVES !== null}
						<p class="mt-1 text-right text-sm font-semibold text-slate-500">
							≈ {formatearVES(totalVES)} BCV
						</p>
					{/if}
				</div>

				<button
					type="button"
					onclick={crearRutina}
					disabled={pasos.length === 0}
					class="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-sky-200 px-8 py-3 font-Manrope text-base font-semibold text-slate-600 transition duration-300 hover:-translate-y-1 hover:bg-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
				>
					{#if agregado}
						<Icon icon="material-symbols:check-rounded" width="20" />
						Agregada al carrito
					{:else}
						Crear mi rutina
						<Icon icon="material-symbols:arrow-forward-rounded" width="20" />
					{/if}
				</button>
			</div>
		</div>
	</div>
</section>
