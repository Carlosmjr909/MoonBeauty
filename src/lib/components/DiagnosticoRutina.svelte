<script lang="ts">
	import Icon from "@iconify/svelte";
	import { carrito } from "$lib/cart.js";
	import {
		convertirUSDaVES,
		formatearUSD,
		formatearVES,
	} from "$lib/utils/moneda";

	interface PropTypes {
		tasaBCV?: number | null;
	}

	const { tasaBCV = null }: PropTypes = $props();

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
	const limpiadores: Record<TipoPiel, ProductoRutina> = {
		Grasa: {
			id: "9ttpK1YiaSF8tNDe2M2Q",
			Nombre: "BHA+ PORE ZERO Cleansing Foam 150ml",
			marca: "Be The Skin",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2F3c697ae2-1088-4ffe-81f6-6985b5ac3376-IMG_3545.jpeg?alt=media&token=b367d108-f319-4662-bcad-c2f43bb41b48",
			precio: 12,
			stock: 2,
			beneficio: "Limpieza profunda y control de brillo",
		},
		Seca: {
			id: "6ZsTWjI26HBznC6p38EM",
			Nombre: "Bean Cleansing Oil 195ml",
			marca: "Mixsoon",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2F0ccc27ce-0edc-4f97-9243-54095898025f-IMG_3605.jpeg?alt=media&token=0fdf2827-780a-43f3-a839-456aec5b9513",
			precio: 25,
			stock: 10,
			beneficio: "Primer paso suave y muy hidratante",
		},
		Mixta: {
			id: "JAi7uO5HSSeDov7yZjTT",
			Nombre: "Heartleaf Pore Cleansing Foam Double Set",
			marca: "Anua",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2Fb6ec106c-f44d-44fc-ae9c-7d31c19779dd-IMG_3528.webp?alt=media&token=d26d5552-099e-4782-8562-ccb68496eee2",
			precio: 32,
			stock: 1,
			beneficio: "Paso de limpieza profunda",
		},
		Normal: {
			id: "Sp4umofUowF7CxyMkLut",
			Nombre: "Centella Cleansing Foam 150ml",
			marca: "Mixsoon",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2Faac1c501-e8ac-4bf0-af73-adc30c1dd579-IMG_3604.jpeg?alt=media&token=bf312980-ad3f-4519-9932-fc2263d39859",
			precio: 20,
			stock: 5,
			beneficio: "Limpieza equilibrada para uso diario",
		},
		Sensible: {
			id: "9SaFx8L7bg4rf41xjzA4",
			Nombre: "Low pH Cleansing Water 290ml",
			marca: "Pyunkang Yul",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2F24b57ccd-6b58-414a-b276-784fa050141b-IMG_3593.jpeg?alt=media&token=4fb212af-9c64-4616-9777-1b6100bdd73e",
			precio: 18,
			stock: 10,
			beneficio: "Limpieza suave, ideal para piel reactiva",
		},
	};

	// Paso 2 — Tratamiento o activo, elegido según la preocupación principal.
	const tratamientos: Record<Preocupacion, ProductoRutina> = {
		Hidratación: {
			id: "7DUzhmKfaM99FM564WTS",
			Nombre: "PDRN Collagen Serum 30ml",
			marca: "Mixsoon",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2F7e1aceb8-1272-4630-8c95-09c8ba3475a0-IMG_3809.jpeg?alt=media&token=1affcf57-4de6-465c-906e-2a2c10cda023",
			precio: 28,
			stock: 5,
			beneficio: "Hidratación profunda y efecto plump",
		},
		Manchas: {
			id: "qOEZvukkZOLx1dnQArkz",
			Nombre: "TXA 6 Niacinamide 10 Retinal Serum 30ml",
			marca: "Purito Seoul",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2F9f799530-3ac3-4063-8686-ee955142f378-IMG_3550.jpeg?alt=media&token=42654b94-f57e-44a2-93bb-4eb853e059fd",
			precio: 25,
			stock: 1,
			beneficio: "Ataca manchas oscuras y marcas",
		},
		Acné: {
			id: "jrc3U2jdRzgwxWsuuCnO",
			Nombre: "Madagascar Centella Tone Brightening Capsule Ampoule 50ml",
			marca: "Skin1004",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2F0ac0738c-9b95-4e14-9fd1-7c84d3e14fc3-IMG_3549.jpeg?alt=media&token=d9dcd678-2104-4e24-a538-35e317a50bed",
			precio: 12,
			stock: 1,
			beneficio: "Calma brotes e irritación",
		},
		"Poros Dilatados": {
			id: "OOpbOHIr2BaqUjTzHQJW",
			Nombre: "Shrink Pore Spicule 300 Ampoule 50ml",
			marca: "Veramore",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2F9d1a3a96-d42f-4c37-8c7c-5aecc0928490-IMG_3582.jpeg?alt=media&token=de80a8da-52cf-42af-ab29-8caee1c808a8",
			precio: 15,
			stock: 10,
			beneficio: "Minimiza poros visiblemente",
		},
		Luminosidad: {
			id: "rIbEPQE7O4GyX8yAjco4",
			Nombre: "AGE-R Glutathione Glow Serum 30ml",
			marca: "Medicube",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2F7673827d-dcc6-4888-81a6-40206f8344e3-IMG_3843.jpeg?alt=media&token=1ab04dd5-5ef4-4bde-8793-3e65a4b4e36f",
			precio: 29,
			stock: 10,
			beneficio: "Ilumina y da luminosidad",
		},
		"Barrera Cutánea": {
			id: "xIVkOB4xUV5Of51xLlLO",
			Nombre: "Wonder Releaf Centella Serum Unscented",
			marca: "Purito Seoul",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2F12e8c175-ee8e-4417-867b-a6f20fb1e011-IMG_3627.jpeg?alt=media&token=98d16cb2-c00b-4cd2-8f8e-b40d717e1467",
			precio: 18,
			stock: 8,
			beneficio: "Repara y fortalece la barrera",
		},
	};

	// Paso 3 — Hidratante o protector solar, elegido según el tipo de piel.
	const hidratantes: Record<TipoPiel, ProductoRutina> = {
		Grasa: {
			id: "jDgb2lxBflQFwzc6f0AN",
			Nombre: "Oil Control Mattifying Sun Stick",
			marca: "Celimax",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2F80cac599-c903-45e9-b022-0ebbbe2b448f-IMG_3639.webp?alt=media&token=74c96ce5-f3ec-453c-9b62-9bf9c79d2a77",
			precio: 18,
			stock: 1,
			beneficio: "Protección sin sensación grasa",
		},
		Seca: {
			id: "HjlpWEJqgfUfgph89E9l",
			Nombre: "Expert Madeca Cream Active Renew PDRN 50ml",
			marca: "Centellian24",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2Fda8916c9-db8b-489b-baee-03d9f6e66e41-IMG_3838.jpeg?alt=media&token=46bd27aa-a8ec-4fa0-9098-f60978b585b3",
			precio: 32,
			stock: 10,
			beneficio: "Hidratación intensa y nutrición",
		},
		Mixta: {
			id: "f1RBmZPgnDnZdAhnVFfg",
			Nombre: "Relief Sun: Rice + Probiotics 50ml",
			marca: "Beauty of Joseon",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2Fbe989e5f-98ea-4c49-a65d-9a859e78d767-IMG_3529.jpeg?alt=media&token=ec61c994-757b-4eb5-a301-b6e6fe721792",
			precio: 25,
			stock: 1,
			beneficio: "Protección sin sensación grasa",
		},
		Normal: {
			id: "YZ4Ih8Tii0UNesASD58Z",
			Nombre: "Bio Watery Sun Cream SPF50 PA++++ 50ml",
			marca: "Tocobo",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2Fc3dc0bab-6622-40b7-a0b8-c7297000c748-IMG_3591.jpeg?alt=media&token=2aac8092-4fd6-457e-818c-67b60ddd0949",
			precio: 18,
			stock: 10,
			beneficio: "Protección diaria ligera",
		},
		Sensible: {
			id: "pa1XcmQfzXSpO5sVJvMF",
			Nombre: "Green Tea Fresh Sunscreen 45ml",
			marca: "Dr. Althea",
			imagen:
				"https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/productos%2Fdb6063cf-57bb-405e-837e-6a235ea09591-IMG_3642.webp?alt=media&token=1151ae35-f4e9-43d5-9386-47e76a2f6275",
			precio: 18,
			stock: 8,
			beneficio: "Protección suave para piel sensible",
		},
	};

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
		Luminosidad: "Un sérum con glutatión o vitamina C te da ese brillo tipo 'piel de cristal' que tanto se busca en las rutinas coreanas.",
		"Barrera Cutánea": "Priorizamos fórmulas calmantes con Centella Asiática y pantenol para reforzar tu barrera cutánea, clave antes de cualquier tratamiento activo.",
	};

	let tipoPielSeleccionado = $state<TipoPiel>("Mixta");
	let preocupacionSeleccionada = $state<Preocupacion>("Hidratación");

	const limpiador = $derived(limpiadores[tipoPielSeleccionado]);
	const tratamiento = $derived(tratamientos[preocupacionSeleccionada]);
	const hidratante = $derived(hidratantes[tipoPielSeleccionado]);

	const pasos = $derived([
		{ numero: 1, etiqueta: "Limpiador", producto: limpiador },
		{ numero: 2, etiqueta: "Tratamiento", producto: tratamiento },
		{ numero: 3, etiqueta: "Hidratante / Protector", producto: hidratante },
	]);

	const subtotal = $derived(
		limpiador.precio + tratamiento.precio + hidratante.precio,
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
					class="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-sky-200 px-8 py-3 font-Manrope text-base font-semibold text-slate-600 transition duration-300 hover:-translate-y-1 hover:bg-slate-600 hover:text-white"
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
