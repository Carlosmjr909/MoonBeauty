<script lang="ts">
	import { onDestroy } from "svelte";
	import Icon from "@iconify/svelte";
	import { auth } from "$lib/firebase";
	import {
		escucharCupones,
		guardarCupon,
		eliminarCupon,
		normalizarCodigo,
		METODOS_PAGO_EN_DIVISAS,
		type Cupon,
		type TipoCupon,
	} from "$lib/cupones";
	import type { MetodoPago } from "$lib/pedidos";

	let cupones = $state<Cupon[]>([]);
	let cargando = $state(true);
	let error = $state("");
	let mensaje = $state("");

	const OPCIONES_PAGO: Array<{ valor: MetodoPago; etiqueta: string }> = [
		{ valor: "efectivo", etiqueta: "Efectivo $" },
		{ valor: "binance", etiqueta: "Binance" },
		{ valor: "zelle", etiqueta: "Zelle" },
		{ valor: "zinli", etiqueta: "Zinli" },
		{ valor: "pago_movil", etiqueta: "Pago móvil (Bs)" },
	];

	const formularioVacio = {
		codigo: "",
		descripcion: "",
		tipo: "porcentaje" as TipoCupon,
		valor: 20,
		metodosPago: [...METODOS_PAGO_EN_DIVISAS] as MetodoPago[],
		activo: true,
		limiteUsos: "" as number | "",
		fechaVencimiento: "",
	};

	let formulario = $state({ ...formularioVacio });
	let editando = $state(false);
	let guardando = $state(false);

	const detener = escucharCupones(
		(datos) => {
			cupones = datos;
			cargando = false;
		},
		(err) => {
			error = `No se pudieron cargar los cupones: ${err.message}`;
			cargando = false;
		},
	);

	onDestroy(() => detener());

	function alternarMetodo(metodo: MetodoPago, marcado: boolean) {
		formulario.metodosPago = marcado
			? [...formulario.metodosPago, metodo]
			: formulario.metodosPago.filter((m) => m !== metodo);
	}

	function editarCupon(cupon: Cupon) {
		formulario = {
			codigo: cupon.codigo,
			descripcion: cupon.descripcion,
			tipo: cupon.tipo,
			valor: cupon.valor,
			metodosPago: [...cupon.metodosPago],
			activo: cupon.activo,
			limiteUsos: cupon.limiteUsos ?? "",
			fechaVencimiento: cupon.fechaVencimiento
				? new Date(cupon.fechaVencimiento).toISOString().slice(0, 10)
				: "",
		};
		editando = true;
		mensaje = "";
		error = "";
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function cancelarEdicion() {
		formulario = { ...formularioVacio };
		editando = false;
	}

	async function enviarFormulario(evento: SubmitEvent) {
		evento.preventDefault();
		guardando = true;
		error = "";
		mensaje = "";

		try {
			// La fecha se toma al final del día elegido, para que un cupón
			// que vence "el 20" siga sirviendo todo el día 20.
			const vencimiento = formulario.fechaVencimiento
				? new Date(`${formulario.fechaVencimiento}T23:59:59`).getTime()
				: null;

			await guardarCupon({
				codigo: formulario.codigo,
				descripcion: formulario.descripcion,
				tipo: formulario.tipo,
				valor: Number(formulario.valor),
				metodosPago: formulario.metodosPago,
				activo: formulario.activo,
				limiteUsos:
					formulario.limiteUsos === "" ||
					Number(formulario.limiteUsos) <= 0
						? null
						: Number(formulario.limiteUsos),
				fechaVencimiento: vencimiento,
			});

			mensaje = editando
				? "Cupón actualizado."
				: `Cupón ${normalizarCodigo(formulario.codigo)} creado.`;

			formulario = { ...formularioVacio };
			editando = false;
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo guardar el cupón.";
		} finally {
			guardando = false;
		}
	}

	async function borrar(cupon: Cupon) {
		if (
			!confirm(
				`¿Eliminar el cupón ${cupon.codigo}? Los pedidos que ya lo usaron no se modifican.`,
			)
		) {
			return;
		}

		try {
			await eliminarCupon(cupon.codigo);
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo eliminar el cupón.";
		}
	}

	function descripcionDescuento(cupon: Cupon) {
		return cupon.tipo === "porcentaje"
			? `${cupon.valor}% de descuento`
			: `$${cupon.valor.toFixed(2)} de descuento`;
	}

	/* ---------------- Envío por correo ---------------- */

	let cuponAEnviar = $state<Cupon | null>(null);
	let asunto = $state("");
	let mensajeCorreo = $state("");
	let correoPrueba = $state("");
	let enviando = $state(false);
	let resultadoEnvio = $state("");

	function abrirEnvio(cupon: Cupon) {
		cuponAEnviar = cupon;
		asunto = `Tu cupón ${cupon.codigo} en Moon Beauty ✨`;
		mensajeCorreo = `Tenemos algo para ti: ${descripcionDescuento(cupon)} en toda la tienda.\n\nUsa el código al momento de pagar. ¡Gracias por acompañarnos en tu rutina de cuidado!`;
		resultadoEnvio = "";
		error = "";
	}

	function cerrarEnvio() {
		cuponAEnviar = null;
		resultadoEnvio = "";
	}

	async function enviarCorreo(soloPrueba: boolean) {
		if (!cuponAEnviar) return;

		if (
			!soloPrueba &&
			!confirm(
				"Se va a enviar el cupón por correo a todos los clientes registrados que no hayan desactivado las promociones. ¿Continuar?",
			)
		) {
			return;
		}

		enviando = true;
		resultadoEnvio = "";
		error = "";

		try {
			const usuarioActual = auth.currentUser;

			if (!usuarioActual) {
				throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
			}

			// El servidor vuelve a verificar este token y que el uid sea
			// admin, así que la protección no depende del navegador.
			const token = await usuarioActual.getIdToken();

			const respuesta = await fetch("/api/enviar-cupon", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					codigo: cuponAEnviar.codigo,
					asunto,
					mensaje: mensajeCorreo,
					detalleDescuento: descripcionDescuento(cuponAEnviar),
					soloPrueba,
					correoPrueba,
				}),
			});

			const datos = await respuesta.json();

			if (!respuesta.ok || !datos.ok) {
				throw new Error(datos.error ?? "No se pudo enviar el correo.");
			}

			resultadoEnvio = soloPrueba
				? `Correo de prueba enviado a ${correoPrueba}.`
				: `Enviado a ${datos.enviados} de ${datos.total} clientes.${
						datos.fallidos > 0
							? ` ${datos.fallidos} fallaron (revisa los registros).`
							: ""
					}`;
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo enviar el correo.";
		} finally {
			enviando = false;
		}
	}
</script>

<svelte:head>
	<title>Cupones | Panel Moon Beauty</title>
</svelte:head>

<section class="mx-auto max-w-5xl px-4 py-12 sm:px-6">
	<a
		href="/admin"
		class="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
	>
		<Icon icon="material-symbols:chevron-left-rounded" width="20" />
		Panel
	</a>

	<p class="mt-1 font-Manrope text-3xl text-slate-700">Cupones</p>

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

	<form
		onsubmit={enviarFormulario}
		class="mt-6 rounded-2xl bg-slate-50 p-5 sm:p-6"
	>
		<p class="font-Manrope text-lg text-slate-700">
			{editando ? `Editando ${formulario.codigo}` : "Nuevo cupón"}
		</p>

		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-1">
				<label
					for="codigo"
					class="text-sm font-semibold text-slate-600"
				>
					Código
				</label>
				<input
					id="codigo"
					type="text"
					bind:value={formulario.codigo}
					disabled={editando}
					required
					placeholder="MOON20"
					class="rounded-lg border border-slate-200 px-3 py-2 uppercase disabled:bg-slate-100"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label
					for="descripcion"
					class="text-sm font-semibold text-slate-600"
				>
					Descripción (solo para ti)
				</label>
				<input
					id="descripcion"
					type="text"
					bind:value={formulario.descripcion}
					placeholder="Promo de lanzamiento"
					class="rounded-lg border border-slate-200 px-3 py-2"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label for="tipo" class="text-sm font-semibold text-slate-600">
					Tipo de descuento
				</label>
				<select
					id="tipo"
					bind:value={formulario.tipo}
					class="rounded-lg border border-slate-200 bg-white px-3 py-2"
				>
					<option value="porcentaje">Porcentaje (%)</option>
					<option value="monto">Monto fijo ($)</option>
				</select>
			</div>

			<div class="flex flex-col gap-1">
				<label for="valor" class="text-sm font-semibold text-slate-600">
					{formulario.tipo === "porcentaje"
						? "Porcentaje de descuento"
						: "Monto en dólares"}
				</label>
				<input
					id="valor"
					type="number"
					min="1"
					step={formulario.tipo === "porcentaje" ? "1" : "0.01"}
					max={formulario.tipo === "porcentaje" ? 100 : undefined}
					bind:value={formulario.valor}
					required
					class="rounded-lg border border-slate-200 px-3 py-2"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label
					for="limiteUsos"
					class="text-sm font-semibold text-slate-600"
				>
					Límite de usos
				</label>
				<input
					id="limiteUsos"
					type="number"
					min="1"
					bind:value={formulario.limiteUsos}
					placeholder="Sin límite"
					class="rounded-lg border border-slate-200 px-3 py-2"
				/>
				<p class="text-xs text-slate-400">
					Déjalo vacío para que no tenga tope.
				</p>
			</div>

			<div class="flex flex-col gap-1">
				<label
					for="vencimiento"
					class="text-sm font-semibold text-slate-600"
				>
					Vence el
				</label>
				<input
					id="vencimiento"
					type="date"
					bind:value={formulario.fechaVencimiento}
					class="rounded-lg border border-slate-200 px-3 py-2"
				/>
				<p class="text-xs text-slate-400">
					Déjalo vacío para que no venza.
				</p>
			</div>
		</div>

		<fieldset class="mt-5">
			<legend class="text-sm font-semibold text-slate-600">
				Aplica en estos métodos de pago
			</legend>

			<div class="mt-2 flex flex-wrap gap-3">
				{#each OPCIONES_PAGO as opcion}
					<label
						class="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200"
					>
						<input
							type="checkbox"
							checked={formulario.metodosPago.includes(
								opcion.valor,
							)}
							onchange={(evento) =>
								alternarMetodo(
									opcion.valor,
									evento.currentTarget.checked,
								)}
							class="h-4 w-4"
						/>
						{opcion.etiqueta}
					</label>
				{/each}
			</div>

			{#if formulario.metodosPago.includes("pago_movil")}
				<p class="mt-2 text-xs text-slate-500">
					Con pago móvil el descuento se aplica sobre el monto en
					bolívares, que es lo que la persona realmente paga.
				</p>
			{/if}
		</fieldset>

		<label class="mt-5 flex items-center gap-2 text-sm text-slate-600">
			<input
				type="checkbox"
				bind:checked={formulario.activo}
				class="h-4 w-4"
			/>
			Cupón activo
		</label>

		<div class="mt-6 flex flex-wrap gap-3">
			<button
				type="submit"
				disabled={guardando}
				class="h-11 rounded-full bg-slate-700 px-6 font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
			>
				{guardando
					? "Guardando..."
					: editando
						? "Guardar cambios"
						: "Crear cupón"}
			</button>

			{#if editando}
				<button
					type="button"
					onclick={cancelarEdicion}
					class="h-11 rounded-full px-6 font-semibold text-slate-600 transition hover:bg-slate-200"
				>
					Cancelar
				</button>
			{/if}
		</div>
	</form>

	<div class="mt-10">
		{#if cargando}
			<p class="text-slate-500">Cargando cupones...</p>
		{:else if cupones.length === 0}
			<div
				class="rounded-2xl border border-dashed border-slate-300 p-10 text-center"
			>
				<p class="text-slate-500">
					Todavía no has creado ningún cupón.
				</p>
			</div>
		{:else}
			<div class="grid gap-3 md:grid-cols-2">
				{#each cupones as cupon (cupon.codigo)}
					{@const vencido =
						cupon.fechaVencimiento !== null &&
						Date.now() > cupon.fechaVencimiento}
					{@const agotado =
						cupon.limiteUsos !== null &&
						cupon.usos >= cupon.limiteUsos}

					<article
						class="rounded-2xl border border-slate-200 bg-white p-5"
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<p
									class="font-Manrope text-xl font-bold tracking-wide text-slate-700"
								>
									{cupon.codigo}
								</p>
								<p class="text-sm text-slate-500">
									{descripcionDescuento(cupon)}
								</p>
							</div>

							<span
								class="rounded-full px-3 py-1 text-xs font-semibold {!cupon.activo
									? 'bg-slate-200 text-slate-600'
									: vencido || agotado
										? 'bg-amber-100 text-amber-800'
										: 'bg-green-100 text-green-800'}"
							>
								{!cupon.activo
									? "Inactivo"
									: vencido
										? "Vencido"
										: agotado
											? "Agotado"
											: "Activo"}
							</span>
						</div>

						{#if cupon.descripcion}
							<p class="mt-2 text-sm text-slate-500">
								{cupon.descripcion}
							</p>
						{/if}

						<ul class="mt-3 space-y-1 text-xs text-slate-500">
							<li>
								Usos: {cupon.usos}{cupon.limiteUsos !== null
									? ` de ${cupon.limiteUsos}`
									: " (sin límite)"}
							</li>
							<li>
								Vence: {cupon.fechaVencimiento
									? new Intl.DateTimeFormat("es-VE", {
											dateStyle: "medium",
										}).format(
											new Date(cupon.fechaVencimiento),
										)
									: "No vence"}
							</li>
							<li>
								Métodos: {cupon.metodosPago
									.map(
										(m) =>
											OPCIONES_PAGO.find(
												(o) => o.valor === m,
											)?.etiqueta ?? m,
									)
									.join(", ") || "Ninguno"}
							</li>
						</ul>

						<div class="mt-4 flex flex-wrap gap-2">
							<button
								type="button"
								onclick={() => abrirEnvio(cupon)}
								class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
							>
								<Icon
									icon="material-symbols:mail-outline-rounded"
									width="16"
								/>
								Enviar por correo
							</button>

							<button
								type="button"
								onclick={() => editarCupon(cupon)}
								class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
							>
								Editar
							</button>

							<button
								type="button"
								onclick={() => borrar(cupon)}
								class="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
							>
								Eliminar
							</button>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>

{#if cuponAEnviar}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
	>
		<div class="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
			<div class="flex items-start justify-between gap-3">
				<p class="font-Manrope text-xl text-slate-700">
					Enviar {cuponAEnviar.codigo} por correo
				</p>

				<button
					type="button"
					onclick={cerrarEnvio}
					aria-label="Cerrar"
					class="text-slate-400 transition hover:text-slate-600"
				>
					<Icon icon="material-symbols:close-rounded" width="22" />
				</button>
			</div>

			<p class="mt-2 text-sm text-slate-500">
				Se enviará a los clientes registrados que no hayan desactivado
				las promociones desde su cuenta.
			</p>

			<div class="mt-4 flex flex-col gap-1">
				<label
					for="asunto"
					class="text-sm font-semibold text-slate-600"
				>
					Asunto
				</label>
				<input
					id="asunto"
					type="text"
					bind:value={asunto}
					class="rounded-lg border border-slate-200 px-3 py-2"
				/>
			</div>

			<div class="mt-4 flex flex-col gap-1">
				<label
					for="mensajeCorreo"
					class="text-sm font-semibold text-slate-600"
				>
					Mensaje
				</label>
				<textarea
					id="mensajeCorreo"
					rows="6"
					bind:value={mensajeCorreo}
					class="rounded-lg border border-slate-200 px-3 py-2"
				></textarea>
				<p class="text-xs text-slate-400">
					El código del cupón y el botón "Ver productos" se agregan
					automáticamente debajo del mensaje.
				</p>
			</div>

			<div class="mt-5 rounded-xl bg-slate-50 p-4">
				<p class="text-sm font-semibold text-slate-600">
					Probar antes de enviar
				</p>

				<div class="mt-2 flex flex-col gap-2 sm:flex-row">
					<input
						type="email"
						bind:value={correoPrueba}
						placeholder="tu@correo.com"
						class="h-10 flex-1 rounded-lg border border-slate-200 px-3"
					/>

					<button
						type="button"
						onclick={() => enviarCorreo(true)}
						disabled={enviando || !correoPrueba}
						class="h-10 shrink-0 rounded-lg bg-white px-4 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 transition hover:bg-slate-100 disabled:opacity-50"
					>
						Enviar prueba
					</button>
				</div>
			</div>

			{#if resultadoEnvio}
				<div
					class="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700"
				>
					{resultadoEnvio}
				</div>
			{/if}

			{#if error}
				<div
					class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					{error}
				</div>
			{/if}

			<div class="mt-6 flex flex-wrap justify-end gap-3">
				<button
					type="button"
					onclick={cerrarEnvio}
					class="h-11 rounded-full px-5 font-semibold text-slate-600 transition hover:bg-slate-100"
				>
					Cerrar
				</button>

				<button
					type="button"
					onclick={() => enviarCorreo(false)}
					disabled={enviando}
					class="h-11 rounded-full bg-slate-700 px-6 font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
				>
					{enviando ? "Enviando..." : "Enviar a todos"}
				</button>
			</div>
		</div>
	</div>
{/if}
