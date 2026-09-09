<script lang="ts">
	import { onDestroy } from "svelte";
	import Icon from "@iconify/svelte";
	import {
		escucharConfiguracion,
		guardarConfiguracion,
		normalizarConfiguracionPagos,
		normalizarConfiguracionPortada,
		normalizarConfiguracionContacto,
		CONFIGURACION_PAGOS_POR_DEFECTO,
		CONFIGURACION_PORTADA_POR_DEFECTO,
		CONFIGURACION_CONTACTO_POR_DEFECTO,
		type ConfiguracionPagos,
		type ConfiguracionPortada,
		type ConfiguracionContacto,
		type SeccionConfiguracion,
	} from "$lib/configuracion";

	type Campo = {
		clave: string;
		etiqueta: string;
		ayuda?: string;
		multilinea?: boolean;
	};

	let seccionActiva = $state<SeccionConfiguracion>("pagos");

	let pagos = $state<ConfiguracionPagos>({
		...CONFIGURACION_PAGOS_POR_DEFECTO,
	});
	let portada = $state<ConfiguracionPortada>({
		...CONFIGURACION_PORTADA_POR_DEFECTO,
	});
	let contacto = $state<ConfiguracionContacto>({
		...CONFIGURACION_CONTACTO_POR_DEFECTO,
	});

	let cargadoPagos = false;
	let cargadoPortada = false;
	let cargadoContacto = false;

	let cargando = $state(true);
	let guardando = $state(false);
	let error = $state("");
	let mensaje = $state("");

	// Solo se copia lo que llega de Firestore la primera vez, para no
	// pisar lo que la persona esté escribiendo en ese momento.
	const detenerPagos = escucharConfiguracion(
		"pagos",
		normalizarConfiguracionPagos,
		(datos) => {
			if (!cargadoPagos) {
				pagos = { ...datos };
				cargadoPagos = true;
				cargando = false;
			}
		},
		(err) => {
			error = `No se pudo cargar la configuración: ${err.message}`;
			cargando = false;
		},
	);

	const detenerPortada = escucharConfiguracion(
		"portada",
		normalizarConfiguracionPortada,
		(datos) => {
			if (!cargadoPortada) {
				portada = { ...datos };
				cargadoPortada = true;
			}
		},
	);

	const detenerContacto = escucharConfiguracion(
		"contacto",
		normalizarConfiguracionContacto,
		(datos) => {
			if (!cargadoContacto) {
				contacto = { ...datos };
				cargadoContacto = true;
			}
		},
	);

	onDestroy(() => {
		detenerPagos();
		detenerPortada();
		detenerContacto();
	});

	async function guardar(evento: SubmitEvent) {
		evento.preventDefault();

		guardando = true;
		error = "";
		mensaje = "";

		try {
			const datos =
				seccionActiva === "pagos"
					? pagos
					: seccionActiva === "portada"
						? portada
						: contacto;

			await guardarConfiguracion(seccionActiva, { ...datos });
			mensaje = "Cambios guardados. Ya están activos en la tienda.";

			setTimeout(() => {
				mensaje = "";
			}, 4000);
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudieron guardar los cambios.";
		} finally {
			guardando = false;
		}
	}

	const SECCIONES: Array<{
		valor: SeccionConfiguracion;
		etiqueta: string;
		descripcion: string;
	}> = [
		{
			valor: "pagos",
			etiqueta: "Datos de pago",
			descripcion:
				"Lo que ve el comprador en el checkout al elegir cómo pagar, más el banner de arriba.",
		},
		{
			valor: "portada",
			etiqueta: "Textos de la portada",
			descripcion:
				"El texto grande de bienvenida y las cuatro tarjetas de la sección “Nuestra esencia”.",
		},
		{
			valor: "contacto",
			etiqueta: "Contacto y pie de página",
			descripcion:
				"Los datos que aparecen abajo en todas las páginas y en el botón flotante de WhatsApp.",
		},
	];

	const CAMPOS_PAGOS: Campo[] = [
		{
			clave: "pagoMovilCedula",
			etiqueta: "Pago móvil — Cédula / RIF",
			ayuda: "Ejemplo: V-27854705",
		},
		{
			clave: "pagoMovilTelefono",
			etiqueta: "Pago móvil — Teléfono",
			ayuda: "Ejemplo: 0412-5050043",
		},
		{
			clave: "pagoMovilBanco",
			etiqueta: "Pago móvil — Banco",
			ayuda: "Ejemplo: Banco de Venezuela (0102)",
		},
		{ clave: "binanceCorreo", etiqueta: "Binance — Correo" },
		{ clave: "zelleCorreo", etiqueta: "Zelle — Correo" },
		{ clave: "zinliCorreo", etiqueta: "Zinli — Correo" },
	];

	const CAMPOS_PORTADA: Campo[] = [
		{
			clave: "heroEtiqueta",
			etiqueta: "Texto pequeño de arriba",
			ayuda: "Va sobre el título grande.",
		},
		{
			clave: "heroTitulo",
			etiqueta: "Título grande",
			multilinea: true,
			ayuda: "Cada salto de línea que dejes aquí parte el título en un renglón nuevo.",
		},
		{
			clave: "heroSubtitulo",
			etiqueta: "Texto debajo del título",
			multilinea: true,
		},
		{ clave: "heroBoton", etiqueta: "Texto del botón" },
		{
			clave: "esenciaEtiqueta",
			etiqueta: "“Nuestra esencia” — texto pequeño",
		},
		{
			clave: "esenciaTitulo",
			etiqueta: "“Nuestra esencia” — título",
		},
		{
			clave: "esencia1Titulo",
			etiqueta: "Tarjeta 1 (la de la planta) — título",
		},
		{ clave: "esencia1Texto", etiqueta: "Tarjeta 1 — texto", multilinea: true },
		{ clave: "esencia2Titulo", etiqueta: "Tarjeta 2 (centrada) — título" },
		{ clave: "esencia2Texto", etiqueta: "Tarjeta 2 — texto", multilinea: true },
		{ clave: "esencia3Titulo", etiqueta: "Tarjeta 3 (el camión) — título" },
		{ clave: "esencia3Texto", etiqueta: "Tarjeta 3 — texto", multilinea: true },
		{
			clave: "esencia4Titulo",
			etiqueta: "Tarjeta 4 (la del agua) — título",
		},
		{ clave: "esencia4Texto", etiqueta: "Tarjeta 4 — texto", multilinea: true },
		{ clave: "esencia4Boton", etiqueta: "Tarjeta 4 — texto del botón" },
	];

	const CAMPOS_CONTACTO: Campo[] = [
		{
			clave: "descripcion",
			etiqueta: "Descripción de la tienda",
			multilinea: true,
			ayuda: "El párrafo que aparece al lado del nombre, abajo.",
		},
		{ clave: "instagramUrl", etiqueta: "Link de Instagram" },
		{
			clave: "whatsappNumero",
			etiqueta: "WhatsApp — número",
			ayuda: "Solo números, con el código del país y sin el 0. Ejemplo: 584125050043",
		},
		{
			clave: "whatsappTexto",
			etiqueta: "WhatsApp — cómo se muestra escrito",
			ayuda: "Ejemplo: +58 412-505 0043",
		},
		{ clave: "correo", etiqueta: "Correo de contacto" },
		{ clave: "direccion", etiqueta: "Ubicación" },
		{
			clave: "horario",
			etiqueta: "Horario / disponibilidad",
			ayuda: "Ejemplo: Todos los días · Respondemos por WhatsApp",
		},
		{
			clave: "copyright",
			etiqueta: "Frase final del pie de página",
			ayuda: "Va después de “© 2026 MoonBeauty.”",
		},
	];

	const camposActuales = $derived(
		seccionActiva === "pagos"
			? CAMPOS_PAGOS
			: seccionActiva === "portada"
				? CAMPOS_PORTADA
				: CAMPOS_CONTACTO,
	);

	const datosActuales = $derived(
		seccionActiva === "pagos"
			? (pagos as unknown as Record<string, string>)
			: seccionActiva === "portada"
				? (portada as unknown as Record<string, string>)
				: (contacto as unknown as Record<string, string>),
	);
</script>

<svelte:head>
	<title>Configuración del sitio | Panel Moon Beauty</title>
</svelte:head>

<section class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
	<a
		href="/admin"
		class="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
	>
		<Icon icon="material-symbols:chevron-left-rounded" width="20" />
		Panel
	</a>

	<p class="mt-1 font-Manrope text-3xl text-slate-700">
		Configuración del sitio
	</p>

	<div class="mt-6 flex flex-wrap gap-2">
		{#each SECCIONES as seccion}
			<button
				type="button"
				onclick={() => {
					seccionActiva = seccion.valor;
					mensaje = "";
					error = "";
				}}
				class="rounded-full px-4 py-2 text-sm font-semibold transition"
				class:bg-slate-700={seccionActiva === seccion.valor}
				class:text-white={seccionActiva === seccion.valor}
				class:bg-slate-100={seccionActiva !== seccion.valor}
				class:text-slate-600={seccionActiva !== seccion.valor}
			>
				{seccion.etiqueta}
			</button>
		{/each}
	</div>

	<p class="mt-4 text-sm leading-6 text-slate-500">
		{SECCIONES.find((s) => s.valor === seccionActiva)?.descripcion}
	</p>

	{#if error}
		<div class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
			{error}
		</div>
	{/if}

	{#if mensaje}
		<div
			class="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700"
		>
			{mensaje}
		</div>
	{/if}

	{#if cargando}
		<p class="mt-8 text-slate-500">Cargando configuración...</p>
	{:else}
		<form onsubmit={guardar} class="mt-6">
			<div class="grid gap-4 sm:grid-cols-2">
				{#each camposActuales as campo (campo.clave)}
					<div
						class="flex flex-col gap-1"
						class:sm:col-span-2={campo.multilinea}
					>
						<label
							for={campo.clave}
							class="text-sm font-semibold text-slate-600"
						>
							{campo.etiqueta}
						</label>

						{#if campo.multilinea}
							<textarea
								id={campo.clave}
								rows={campo.clave === "heroTitulo" ? 2 : 3}
								bind:value={datosActuales[campo.clave]}
								class="rounded-lg border border-slate-200 px-3 py-2"
							></textarea>
						{:else}
							<input
								id={campo.clave}
								type="text"
								bind:value={datosActuales[campo.clave]}
								class="rounded-lg border border-slate-200 px-3 py-2"
							/>
						{/if}

						{#if campo.ayuda}
							<p class="text-xs text-slate-400">{campo.ayuda}</p>
						{/if}
					</div>
				{/each}
			</div>

			{#if seccionActiva === "pagos"}
				<div class="mt-8 rounded-2xl bg-slate-50 p-5">
					<p class="font-Manrope text-lg text-slate-700">
						Banner de promoción
					</p>

					<p class="mt-1 text-sm text-slate-500">
						Es la cinta que se desplaza en la parte de arriba de
						todas las páginas.
					</p>

					<div class="mt-4 flex flex-col gap-1">
						<label
							for="bannerTexto"
							class="text-sm font-semibold text-slate-600"
						>
							Texto del banner
						</label>

						<textarea
							id="bannerTexto"
							rows="2"
							bind:value={pagos.bannerTexto}
							class="rounded-lg border border-slate-200 px-3 py-2"
						></textarea>
					</div>

					<label
						class="mt-4 flex items-center gap-2 text-sm text-slate-600"
					>
						<input
							type="checkbox"
							bind:checked={pagos.bannerActivo}
							class="h-4 w-4"
						/>
						Mostrar el banner en la tienda
					</label>
				</div>
			{/if}

			<button
				type="submit"
				disabled={guardando}
				class="mt-8 h-12 rounded-full bg-slate-700 px-8 font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
			>
				{guardando ? "Guardando..." : "Guardar cambios"}
			</button>
		</form>
	{/if}
</section>
