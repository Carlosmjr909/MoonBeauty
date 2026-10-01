<script lang="ts">
	import Icon from "@iconify/svelte";
	import { carrito } from "$lib/cart.js";
	import {
		convertirUSDaVES,
		formatearUSD,
		formatearVES,
	} from "$lib/utils/moneda";

	/** Lo mínimo que esta sección necesita de cada producto del catálogo. */
	type ProductoCatalogo = {
		id: string;
		Nombre: string;
		marca?: string;
		imagen: string;
		precio: number;
		stock: number;
		Tipo?: string;
		categorias?: string[];
	};

	interface PropTypes {
		tasaBCV?: number | null;
		/** Catálogo real; de aquí salen nombre, foto, precio y stock. */
		productos?: ProductoCatalogo[];
	}

	const { tasaBCV = null, productos = [] }: PropTypes = $props();

	type TipoPiel = "Seca" | "Grasa" | "Mixta" | "Normal" | "Sensible";
	type Preocupacion =
		| "Hidratación"
		| "Manchas"
		| "Acné"
		| "Poros Dilatados"
		| "Luminosidad"
		| "Barrera Cutánea";

	type ProductoRutina = {
		id: string;
		Nombre: string;
		marca: string;
		imagen: string;
		precio: number;
		stock: number;
		beneficio: string;
	};

	/**
	 * Productos recomendados para un paso, en orden de preferencia (por su
	 * id en el inventario). Se muestra el primero que siga existiendo y
	 * tenga stock; así, si uno se elimina o se agota, entra el siguiente
	 * sin tocar el código.
	 */
	type Opcion = { ids: string[]; beneficio: string };

	const tiposPiel: TipoPiel[] = ["Seca", "Grasa", "Mixta", "Normal", "Sensible"];
	const preocupaciones: Preocupacion[] = [
		"Hidratación",
		"Manchas",
		"Acné",
		"Poros Dilatados",
		"Luminosidad",
		"Barrera Cutánea",
	];

	// Paso 1 — Limpiador, elegido según el tipo de piel.
	const limpiadores: Record<TipoPiel, Opcion> = {
		Grasa: {
			ids: [
				"9ttpK1YiaSF8tNDe2M2Q", // Be The Skin BHA+ Pore Zero Cleansing Foam
				"z3ToOEGCXE41SWCqREeT", // Sungboon Editor Green Tomato Deep Pore Foam
				"O7VqdvmM0AIYlVtwpcq0", // Tocobo Coconut Clay Cleansing Foam
				"K3KtPslI6ULkwu1Y0ueP", // COSRX Salicylic Acid Cleanser (mini)
			],
			beneficio: "Limpieza profunda y control de brillo",
		},
		Seca: {
			ids: [
				"6ZsTWjI26HBznC6p38EM", // Mixsoon Bean Cleansing Oil
				"i39nSty6ezUjx8Z5E8Gs", // Pyunkang Yul Deep Cleansing Oil
				"Xt0HXKQuTxWa9FBjXix6", // Mixsoon PDRN Collagen Gel Cleanser
			],
			beneficio: "Primer paso suave y muy hidratante",
		},
		Mixta: {
			ids: [
				"JAi7uO5HSSeDov7yZjTT", // Anua Heartleaf Pore Cleansing Foam Double Set
				"jQGhofSZtNkjvJdHFZCE", // Anua Heartleaf Quercetinol Pore Deep Cleansing Foam
				"bPwiboeYX3et5O5s0jt9", // Round Lab 1025 Dokdo Cleanser
				"N5KXTLrGDZ9Jyd7TVXow", // Fully Green Tomato Clay Pack Cleanser
			],
			beneficio: "Paso de limpieza profunda",
		},
		Normal: {
			ids: [
				"Sp4umofUowF7CxyMkLut", // Mixsoon Centella Cleansing Foam
				"bPwiboeYX3et5O5s0jt9", // Round Lab 1025 Dokdo Cleanser
				"OCLddqZGb0V54XD96HWD", // COSRX Low pH Good Morning Cleanser (mini)
			],
			beneficio: "Limpieza equilibrada para uso diario",
		},
		Sensible: {
			ids: [
				"9SaFx8L7bg4rf41xjzA4", // Pyunkang Yul Low pH Cleansing Water
				"esb1HBfpOiJjvqu5Mwwk", // Celimax Madecica pH Balancing Foam
				"gW64dChslnCJH9gBM1pm", // Purito Mighty Bamboo Panthenol Cleanser
			],
			beneficio: "Limpieza suave, ideal para piel reactiva",
		},
	};

	// Paso 2 — Tratamiento o activo, elegido según la preocupación principal.
	const tratamientos: Record<Preocupacion, Opcion> = {
		Hidratación: {
			ids: [
				"7DUzhmKfaM99FM564WTS", // Mixsoon PDRN Collagen Serum
				"iIzoml2gZgdy6LwApLTC", // Medicube PDRN Pink Peptide Serum
				"VJarqTRTMK3hTkmLnGKP", // Medicube Triple Collagen Serum 4.0
			],
			beneficio: "Hidratación profunda y efecto plump",
		},
		Manchas: {
			ids: [
				"qOEZvukkZOLx1dnQArkz", // Purito TXA 6 Niacinamide 10 Retinal Serum
				"p1OGARH1wW83X5ZPHsxk", // Nineless B-Boost 10% Niacinamide Serum
				"srL7Deb4Yq30gNGt6qCR", // Arencia Vitamin C Booster Shot
			],
			beneficio: "Ataca manchas oscuras y marcas",
		},
		Acné: {
			ids: [
				"jrc3U2jdRzgwxWsuuCnO", // Skin1004 Centella Tone Brightening Capsule Ampoule
				"nFcTNX3rlKLNbDL0QPXx", // Medicube Azelaic Acid 16 BB Soothing Serum
				"pbZrUpejonjcRenJiLqD", // Fully Green Tomato Serum
			],
			beneficio: "Calma brotes e irritación",
		},
		"Poros Dilatados": {
			ids: [
				"OOpbOHIr2BaqUjTzHQJW", // Veramore Shrink Pore Spicule 300 Ampoule
				"gf7vVCJeTlpHAO5zZtKt", // VT Cosmetics Reedle Shot 100
				"pbZrUpejonjcRenJiLqD", // Fully Green Tomato Serum
			],
			beneficio: "Minimiza poros visiblemente",
		},
		Luminosidad: {
			ids: [
				"QLVgs3laCH12NlYIEgBQ", // Medicube Collagen Glow Booster Serum
				"srL7Deb4Yq30gNGt6qCR", // Arencia Vitamin C Booster Shot
				"w4bGv40RNEdnK73m60U1", // Dr. Melaxin Peel Shot White Rice Ampoule
			],
			beneficio: "Ilumina y da luminosidad",
		},
		"Barrera Cutánea": {
			ids: [
				"xIVkOB4xUV5Of51xLlLO", // Purito Wonder Releaf Centella Serum
				"29nhSrP4GhNh27fKcr5j", // Medicube Exosome Cica Ampoule
			],
			beneficio: "Repara y fortalece la barrera",
		},
	};

	// Paso 3 — Hidratante o protector solar, elegido según el tipo de piel.
	const hidratantes: Record<TipoPiel, Opcion> = {
		Grasa: {
			ids: [
				"jDgb2lxBflQFwzc6f0AN", // Celimax Oil Control Mattifying Sun Stick
				"hmk80QTxsD9qOVBKQxLZ", // Medicube Zero Pore Moisture Sun Serum
				"YZ4Ih8Tii0UNesASD58Z", // Tocobo Bio Watery Sun Cream
			],
			beneficio: "Protección sin sensación grasa",
		},
		Seca: {
			ids: [
				"HjlpWEJqgfUfgph89E9l", // Centellian24 Expert Madeca Cream PDRN
				"D5RyNL5y7X410JzVV6bH", // Mixsoon PDRN Collagen Cream
				"Np4sztcj6OFDC7DwL50f", // Fully Rice Ceramide Moisture Sun Cream
			],
			beneficio: "Hidratación intensa y nutrición",
		},
		Mixta: {
			ids: [
				"f1RBmZPgnDnZdAhnVFfg", // Beauty of Joseon Relief Sun Rice + Probiotics
				"Np4sztcj6OFDC7DwL50f", // Fully Rice Ceramide Moisture Sun Cream
				"YZ4Ih8Tii0UNesASD58Z", // Tocobo Bio Watery Sun Cream
			],
			beneficio: "Protección sin sensación grasa",
		},
		Normal: {
			ids: [
				"YZ4Ih8Tii0UNesASD58Z", // Tocobo Bio Watery Sun Cream
				"1", // Tocobo Cotton Soft Sun Stick
				"Np4sztcj6OFDC7DwL50f", // Fully Rice Ceramide Moisture Sun Cream
			],
			beneficio: "Protección diaria ligera",
		},
		Sensible: {
			ids: [
				"pa1XcmQfzXSpO5sVJvMF", // Dr. Althea Green Tea Fresh Sunscreen
				"Yy9WLCni7qr3qCbhDi9n", // Round Lab Pine Calming Cica Cream
				"QImTOBorN2i8bxouQGuJ", // Pyunkang Yul Ultimate Calming Solution Cream
			],
			beneficio: "Protección suave para piel sensible",
		},
	};

	// Si ninguno de los recomendados está disponible, se usa el producto
	// con más stock de la categoría del paso, para que nunca quede vacío.
	const categoriasRespaldo = {
		limpiador: ["Limpiadores Faciales"],
		tratamiento: ["Serums o Ampollas"],
		hidratante: ["Protector solar", "Cremas Faciales"],
	};

	const productosPorId = $derived(
		new Map(productos.map((producto) => [String(producto.id), producto])),
	);

	function categoriasDe(producto: ProductoCatalogo): string[] {
		return producto.categorias?.length
			? producto.categorias
			: producto.Tipo
				? [producto.Tipo]
				: [];
	}

	function elegirProducto(
		opcion: Opcion,
		respaldo: string[],
	): ProductoRutina | null {
		const disponible = (producto?: ProductoCatalogo) =>
			!!producto && Number(producto.stock) > 0;

		let elegido = opcion.ids
			.map((id) => productosPorId.get(id))
			.find(disponible);

		if (!elegido) {
			elegido = productos
				.filter(
					(producto) =>
						disponible(producto) &&
						categoriasDe(producto).some((categoria) =>
							respaldo.includes(categoria),
						) &&
						!categoriasDe(producto).includes("Kits"),
				)
				.sort((a, b) => Number(b.stock) - Number(a.stock))[0];
		}

		if (!elegido) return null;

		return {
			id: String(elegido.id),
			Nombre: elegido.Nombre,
			marca: elegido.marca ?? "",
			imagen: elegido.imagen,
			precio: Number(elegido.precio) || 0,
			stock: Number(elegido.stock) || 0,
			beneficio: opcion.beneficio,
		};
	}

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
		[
			{
				etiqueta: "Limpiador",
				producto: elegirProducto(
					limpiadores[tipoPielSeleccionado],
					categoriasRespaldo.limpiador,
				),
			},
			{
				etiqueta: "Tratamiento",
				producto: elegirProducto(
					tratamientos[preocupacionSeleccionada],
					categoriasRespaldo.tratamiento,
				),
			},
			{
				etiqueta: "Hidratante / Protector",
				producto: elegirProducto(
					hidratantes[tipoPielSeleccionado],
					categoriasRespaldo.hidratante,
				),
			},
		]
			.filter(
				(paso): paso is { etiqueta: string; producto: ProductoRutina } =>
					paso.producto !== null,
			)
			.map((paso, indice) => ({ ...paso, numero: indice + 1 })),
	);

	const subtotal = $derived(
		pasos.reduce((total, paso) => total + paso.producto.precio, 0),
	);
	const totalConDescuento = $derived(Math.round(subtotal * 0.9 * 100) / 100);
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
