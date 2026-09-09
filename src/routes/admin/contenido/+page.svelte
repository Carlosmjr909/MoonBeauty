<script lang="ts">
	import { onDestroy } from "svelte";
	import Icon from "@iconify/svelte";
	import {
		escucharPublicaciones,
		escucharMarcas,
		subirArchivoInstagram,
		subirLogoMarca,
		agregarPublicacion,
		agregarMarca,
		actualizarMarca,
		actualizarOrdenPublicacion,
		eliminarPublicacion,
		eliminarMarca,
		type PublicacionInstagram,
		type Marca,
		type TipoPublicacion,
	} from "$lib/contenido";

	let publicaciones = $state<PublicacionInstagram[]>([]);
	let marcas = $state<Marca[]>([]);
	let cargandoPublicaciones = $state(true);
	let cargandoMarcas = $state(true);
	let error = $state("");
	let mensaje = $state("");

	const detenerPublicaciones = escucharPublicaciones(
		(datos) => {
			publicaciones = datos;
			cargandoPublicaciones = false;
		},
		(err) => {
			error = `No se pudieron cargar las publicaciones: ${err.message}`;
			cargandoPublicaciones = false;
		},
	);

	const detenerMarcas = escucharMarcas(
		(datos) => {
			marcas = datos;
			cargandoMarcas = false;
		},
		(err) => {
			error = `No se pudieron cargar las marcas: ${err.message}`;
			cargandoMarcas = false;
		},
	);

	onDestroy(() => {
		detenerPublicaciones();
		detenerMarcas();
	});

	function avisar(texto: string) {
		mensaje = texto;
		setTimeout(() => {
			mensaje = "";
		}, 4000);
	}

	/* -------------------- Publicaciones de Instagram -------------------- */

	let tipoPublicacion = $state<TipoPublicacion>("imagen");
	let archivosPublicacion = $state<FileList | null>(null);
	let miniaturaVideo = $state<FileList | null>(null);
	let permalink = $state("");
	let subiendoPublicacion = $state(false);
	let progreso = $state("");
	let inputArchivos = $state<HTMLInputElement | null>(null);
	let inputMiniatura = $state<HTMLInputElement | null>(null);

	async function crearPublicacion(evento: SubmitEvent) {
		evento.preventDefault();

		if (!archivosPublicacion || archivosPublicacion.length === 0) {
			error = "Selecciona al menos un archivo.";
			return;
		}

		subiendoPublicacion = true;
		error = "";

		try {
			const lista = Array.from(archivosPublicacion);
			const urls: string[] = [];

			for (const [indice, archivo] of lista.entries()) {
				progreso = `Subiendo archivo ${indice + 1} de ${lista.length}...`;
				urls.push(await subirArchivoInstagram(archivo));
			}

			let urlMiniatura: string | null = null;

			if (tipoPublicacion === "video" && miniaturaVideo?.[0]) {
				progreso = "Subiendo la portada del video...";
				urlMiniatura = await subirArchivoInstagram(miniaturaVideo[0]);
			}

			progreso = "Guardando...";

			await agregarPublicacion({
				tipo: tipoPublicacion,
				archivos: urls,
				miniatura: urlMiniatura,
				permalink: permalink.trim(),
				// Se agrega al final del carrusel.
				orden:
					publicaciones.reduce(
						(maximo, post) => Math.max(maximo, post.orden),
						-1,
					) + 1,
			});

			permalink = "";
			archivosPublicacion = null;
			miniaturaVideo = null;
			if (inputArchivos) inputArchivos.value = "";
			if (inputMiniatura) inputMiniatura.value = "";

			avisar("Publicación agregada.");
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo agregar la publicación.";
		} finally {
			subiendoPublicacion = false;
			progreso = "";
		}
	}

	async function moverPublicacion(
		publicacion: PublicacionInstagram,
		direccion: -1 | 1,
	) {
		const indice = publicaciones.findIndex(
			(post) => post.id === publicacion.id,
		);
		const vecino = publicaciones[indice + direccion];

		if (!vecino) return;

		try {
			// Se intercambian los órdenes entre las dos publicaciones.
			await Promise.all([
				actualizarOrdenPublicacion(publicacion.id, vecino.orden),
				actualizarOrdenPublicacion(vecino.id, publicacion.orden),
			]);
		} catch (err) {
			error =
				err instanceof Error ? err.message : "No se pudo reordenar.";
		}
	}

	async function borrarPublicacion(publicacion: PublicacionInstagram) {
		if (
			!confirm(
				"¿Eliminar esta publicación? También se borrarán sus archivos subidos.",
			)
		) {
			return;
		}

		try {
			await eliminarPublicacion(publicacion);
			avisar("Publicación eliminada.");
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo eliminar la publicación.";
		}
	}

	/* ----------------------------- Marcas ----------------------------- */

	let nombreMarca = $state("");
	let altoMarca = $state("80");
	let logoMarca = $state<FileList | null>(null);
	let subiendoMarca = $state(false);
	let inputLogo = $state<HTMLInputElement | null>(null);

	async function crearMarca(evento: SubmitEvent) {
		evento.preventDefault();

		if (!logoMarca?.[0]) {
			error = "Selecciona el logo de la marca.";
			return;
		}

		subiendoMarca = true;
		error = "";

		try {
			const url = await subirLogoMarca(logoMarca[0]);

			await agregarMarca({
				nombre: nombreMarca,
				imagen: url,
				alto: `${Number(altoMarca)}%`,
				orden:
					marcas.reduce(
						(maximo, marca) => Math.max(maximo, marca.orden),
						-1,
					) + 1,
			});

			nombreMarca = "";
			altoMarca = "80";
			logoMarca = null;
			if (inputLogo) inputLogo.value = "";

			avisar("Marca agregada.");
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo agregar la marca.";
		} finally {
			subiendoMarca = false;
		}
	}

	async function cambiarAlto(marca: Marca, valor: string) {
		try {
			await actualizarMarca(marca.id, { alto: `${Number(valor)}%` });
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo actualizar el tamaño.";
		}
	}

	async function borrarMarca(marca: Marca) {
		if (!confirm(`¿Eliminar la marca ${marca.nombre}?`)) return;

		try {
			await eliminarMarca(marca);
			avisar("Marca eliminada.");
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo eliminar la marca.";
		}
	}
</script>

<svelte:head>
	<title>Contenido de la portada | Panel Moon Beauty</title>
</svelte:head>

<section class="mx-auto max-w-5xl px-4 py-12 sm:px-6">
	<a
		href="/admin"
		class="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
	>
		<Icon icon="material-symbols:chevron-left-rounded" width="20" />
		Panel
	</a>

	<p class="mt-1 font-Manrope text-3xl text-slate-700">
		Contenido de la portada
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

	<!-- ------------------------- INSTAGRAM ------------------------- -->
	<h2 class="mt-10 font-Manrope text-2xl text-slate-700">
		Publicaciones de Instagram
	</h2>

	<p class="mt-1 text-sm text-slate-500">
		Es el carrusel "Nuestro Instagram". Para una foto con varias
		imágenes, selecciónalas todas juntas y se mostrarán como carrusel.
	</p>

	<form onsubmit={crearPublicacion} class="mt-5 rounded-2xl bg-slate-50 p-5">
		<div class="flex flex-wrap gap-3">
			{#each [{ valor: "imagen" as TipoPublicacion, etiqueta: "Foto(s)" }, { valor: "video" as TipoPublicacion, etiqueta: "Video / Reel" }] as opcion}
				<label
					class="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200"
				>
					<input
						type="radio"
						value={opcion.valor}
						bind:group={tipoPublicacion}
					/>
					{opcion.etiqueta}
				</label>
			{/each}
		</div>

		<div class="mt-4 flex flex-col gap-1">
			<label
				for="archivos"
				class="text-sm font-semibold text-slate-600"
			>
				{tipoPublicacion === "video"
					? "Archivo del video"
					: "Foto(s) de la publicación"}
			</label>

			<input
				id="archivos"
				type="file"
				bind:this={inputArchivos}
				bind:files={archivosPublicacion}
				accept={tipoPublicacion === "video" ? "video/*" : "image/*"}
				multiple={tipoPublicacion === "imagen"}
				required
				class="text-sm"
			/>

			<p class="text-xs text-slate-400">
				{tipoPublicacion === "video"
					? "Máximo 15 MB. Si el video pesa más, compáctalo antes de subirlo."
					: "Puedes seleccionar varias a la vez; se muestran en el orden en que las elijas. Máximo 15 MB cada una."}
			</p>
		</div>

		{#if tipoPublicacion === "video"}
			<div class="mt-4 flex flex-col gap-1">
				<label
					for="miniatura"
					class="text-sm font-semibold text-slate-600"
				>
					Portada del video (opcional)
				</label>

				<input
					id="miniatura"
					type="file"
					bind:this={inputMiniatura}
					bind:files={miniaturaVideo}
					accept="image/*"
					class="text-sm"
				/>

				<p class="text-xs text-slate-400">
					Es la imagen que se ve mientras el video carga.
				</p>
			</div>
		{/if}

		<div class="mt-4 flex flex-col gap-1">
			<label
				for="permalink"
				class="text-sm font-semibold text-slate-600"
			>
				Link al post en Instagram
			</label>

			<input
				id="permalink"
				type="url"
				bind:value={permalink}
				placeholder="https://www.instagram.com/p/..."
				class="rounded-lg border border-slate-200 px-3 py-2"
			/>

			<p class="text-xs text-slate-400">
				Al tocar la publicación en la web, lleva a este link.
			</p>
		</div>

		<button
			type="submit"
			disabled={subiendoPublicacion}
			class="mt-5 h-11 rounded-full bg-slate-700 px-6 font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
		>
			{subiendoPublicacion ? progreso || "Subiendo..." : "Agregar publicación"}
		</button>
	</form>

	<div class="mt-6">
		{#if cargandoPublicaciones}
			<p class="text-slate-500">Cargando publicaciones...</p>
		{:else if publicaciones.length === 0}
			<div
				class="rounded-2xl border border-dashed border-slate-300 p-8 text-center"
			>
				<p class="text-slate-500">
					No hay publicaciones. La sección de Instagram no se mostrará
					en la portada.
				</p>
			</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each publicaciones as publicacion, indice (publicacion.id)}
					<article
						class="overflow-hidden rounded-2xl border border-slate-200 bg-white"
					>
						<div class="aspect-square bg-slate-100">
							{#if publicacion.tipo === "video"}
								{#if publicacion.miniatura}
									<img
										src={publicacion.miniatura}
										alt=""
										class="h-full w-full object-cover"
									/>
								{:else}
									<!-- svelte-ignore a11y_media_has_caption -->
									<video
										src={publicacion.archivos[0]}
										class="h-full w-full object-cover"
										muted
										preload="metadata"
									></video>
								{/if}
							{:else}
								<img
									src={publicacion.archivos[0]}
									alt=""
									class="h-full w-full object-cover"
								/>
							{/if}
						</div>

						<div class="p-3">
							<p class="text-xs font-semibold text-slate-600">
								{publicacion.tipo === "video"
									? "Video"
									: `${publicacion.archivos.length} foto(s)`}
							</p>

							<div class="mt-2 flex items-center gap-1">
								<button
									type="button"
									aria-label="Mover antes"
									disabled={indice === 0}
									onclick={() =>
										moverPublicacion(publicacion, -1)}
									class="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
								>
									<Icon
										icon="material-symbols:arrow-back-rounded"
										width="18"
									/>
								</button>

								<button
									type="button"
									aria-label="Mover después"
									disabled={indice === publicaciones.length - 1}
									onclick={() =>
										moverPublicacion(publicacion, 1)}
									class="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
								>
									<Icon
										icon="material-symbols:arrow-forward-rounded"
										width="18"
									/>
								</button>

								<button
									type="button"
									onclick={() =>
										borrarPublicacion(publicacion)}
									class="ml-auto rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
								>
									Eliminar
								</button>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>

	<!-- --------------------------- MARCAS --------------------------- -->
	<h2 class="mt-14 font-Manrope text-2xl text-slate-700">
		Logos de marcas
	</h2>

	<p class="mt-1 text-sm text-slate-500">
		Es la cinta "Marcas que amamos". Lo ideal son logos en PNG o WebP con
		fondo transparente.
	</p>

	<form onsubmit={crearMarca} class="mt-5 rounded-2xl bg-slate-50 p-5">
		<div class="grid gap-4 sm:grid-cols-3">
			<div class="flex flex-col gap-1">
				<label
					for="nombreMarca"
					class="text-sm font-semibold text-slate-600"
				>
					Nombre
				</label>
				<input
					id="nombreMarca"
					type="text"
					bind:value={nombreMarca}
					required
					placeholder="Anua"
					class="rounded-lg border border-slate-200 px-3 py-2"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label
					for="logoMarca"
					class="text-sm font-semibold text-slate-600"
				>
					Logo
				</label>
				<input
					id="logoMarca"
					type="file"
					bind:this={inputLogo}
					bind:files={logoMarca}
					accept="image/*"
					required
					class="text-sm"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label
					for="altoMarca"
					class="text-sm font-semibold text-slate-600"
				>
					Tamaño (%)
				</label>
				<input
					id="altoMarca"
					type="number"
					min="20"
					max="100"
					bind:value={altoMarca}
					class="rounded-lg border border-slate-200 px-3 py-2"
				/>
				<p class="text-xs text-slate-400">
					Ajústalo para que se vea parejo con los demás.
				</p>
			</div>
		</div>

		<button
			type="submit"
			disabled={subiendoMarca}
			class="mt-5 h-11 rounded-full bg-slate-700 px-6 font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
		>
			{subiendoMarca ? "Subiendo..." : "Agregar marca"}
		</button>
	</form>

	<div class="mt-6">
		{#if cargandoMarcas}
			<p class="text-slate-500">Cargando marcas...</p>
		{:else if marcas.length === 0}
			<div
				class="rounded-2xl border border-dashed border-slate-300 p-8 text-center"
			>
				<p class="text-slate-500">No hay marcas cargadas.</p>
			</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each marcas as marca (marca.id)}
					<article
						class="rounded-2xl border border-slate-200 bg-white p-4"
					>
						<div
							class="flex h-20 items-center justify-center rounded-xl bg-slate-50 px-4"
						>
							<img
								src={marca.imagen}
								alt={marca.nombre}
								class="w-auto max-w-full object-contain"
								style="max-height: {marca.alto}"
							/>
						</div>

						<p class="mt-3 text-sm font-semibold text-slate-700">
							{marca.nombre}
						</p>

						<div class="mt-2 flex items-center gap-2">
							<label
								class="flex items-center gap-1 text-xs text-slate-500"
							>
								Tamaño
								<input
									type="number"
									min="20"
									max="100"
									value={parseInt(marca.alto)}
									onchange={(evento) =>
										cambiarAlto(
											marca,
											evento.currentTarget.value,
										)}
									class="w-16 rounded border border-slate-200 px-2 py-1"
								/>
								%
							</label>

							<button
								type="button"
								onclick={() => borrarMarca(marca)}
								class="ml-auto rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
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
