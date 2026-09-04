<script lang="ts">
	import { onDestroy } from "svelte";
	import {
		agregarProducto,
		actualizarCategoria,
		actualizarProducto,
		eliminarProducto,
		escucharCategorias,
		escucharProductos,
		guardarCategoria,
		subirImagenCategoria,
		subirImagenProducto,
		type Categoria,
		type Producto
	} from "$lib/inventario";

	let productos = $state<Producto[]>([]);
	let categorias = $state<Categoria[]>([]);
	let cargando = $state(true);
	let error = $state<string | null>(null);
	let guardando = $state(false);
	let subiendoImagen = $state(false);
	let guardandoCategoria = $state(false);
	let subiendoImagenCategoria = $state(false);

	const formularioVacio = {
		Nombre: "",
		Tipo: "",
		marca: "",
		descripcion: "",
		especificacion: "",
		precio: 0,
		stock: 0,
		popular: false
	};

	let formulario = $state({ ...formularioVacio });
	let archivoImagen = $state<File | null>(null);
	let vistaPreviaImagen = $state<string | null>(null);
	let inputImagen = $state<HTMLInputElement | null>(null);

	const formularioCategoriaVacio = {
		nombre: "",
		descripcion: "",
		imagen: ""
	};

	let formularioCategoria = $state({ ...formularioCategoriaVacio });
	let archivoImagenCategoria = $state<File | null>(null);
	let vistaPreviaImagenCategoria = $state<string | null>(null);
	let inputImagenCategoria = $state<HTMLInputElement | null>(null);
	let categoriaEditandoId = $state<string | null>(null);

	function manejarSeleccionImagen(evento: Event) {
		const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;

		if (vistaPreviaImagen) {
			URL.revokeObjectURL(vistaPreviaImagen);
		}

		archivoImagen = archivo;
		vistaPreviaImagen = archivo ? URL.createObjectURL(archivo) : null;
	}

	function limpiarImagenSeleccionada() {
		if (vistaPreviaImagen) {
			URL.revokeObjectURL(vistaPreviaImagen);
		}

		archivoImagen = null;
		vistaPreviaImagen = null;

		if (inputImagen) {
			inputImagen.value = "";
		}
	}

	function manejarSeleccionImagenCategoria(evento: Event) {
		const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;

		if (vistaPreviaImagenCategoria) {
			URL.revokeObjectURL(vistaPreviaImagenCategoria);
		}

		archivoImagenCategoria = archivo;
		vistaPreviaImagenCategoria = archivo ? URL.createObjectURL(archivo) : null;
	}

	function limpiarImagenSeleccionadaCategoria() {
		if (vistaPreviaImagenCategoria) {
			URL.revokeObjectURL(vistaPreviaImagenCategoria);
		}

		archivoImagenCategoria = null;
		vistaPreviaImagenCategoria = null;
		formularioCategoria.imagen = "";

		if (inputImagenCategoria) {
			inputImagenCategoria.value = "";
		}
	}

	function prepararEdicionCategoria(categoria: Categoria) {
		categoriaEditandoId = categoria.id;
		formularioCategoria = {
			nombre: categoria.nombre,
			descripcion: categoria.descripcion,
			imagen: categoria.imagen
		};
		vistaPreviaImagenCategoria = categoria.imagen || null;
		archivoImagenCategoria = null;
	}

	function resetearFormularioCategoria() {
		categoriaEditandoId = null;
		formularioCategoria = { ...formularioCategoriaVacio };
		archivoImagenCategoria = null;
		if (vistaPreviaImagenCategoria) {
			URL.revokeObjectURL(vistaPreviaImagenCategoria);
		}
		vistaPreviaImagenCategoria = null;
		if (inputImagenCategoria) {
			inputImagenCategoria.value = "";
		}
	}

	type CambiosProducto = {
		Tipo?: string;
		marca?: string;
		precio?: number;
		stock?: number;
		popular?: boolean;
	};
	const cambiosPorGuardar = $state<Record<string, CambiosProducto>>({});

	const nombresCategorias = $derived(
		categorias
			.map((categoria) => categoria.nombre)
			.filter((nombre) => nombre.trim().length > 0)
	);

	function opcionesTipo(tipoActual?: string) {
		const opciones = [...nombresCategorias];
		if (tipoActual && !opciones.includes(tipoActual)) {
			opciones.push(tipoActual);
		}
		return opciones;
	}

	const detenerProductos = escucharProductos(
		(datos) => {
			productos = datos;
			cargando = false;
		},
		(err) => {
			error = err.message;
			cargando = false;
		}
	);

	const detenerCategorias = escucharCategorias(
		(datos) => {
			categorias = datos;
		},
		(err) => {
			error = err.message;
		}
	);

	onDestroy(() => {
		detenerProductos();
		detenerCategorias();
		if (vistaPreviaImagen) {
			URL.revokeObjectURL(vistaPreviaImagen);
		}
		if (vistaPreviaImagenCategoria) {
			URL.revokeObjectURL(vistaPreviaImagenCategoria);
		}
	});

	async function manejarAgregar(evento: SubmitEvent) {
		evento.preventDefault();

		if (!formulario.Nombre.trim() || !formulario.Tipo.trim()) {
			error = "El nombre y el tipo son obligatorios.";
			return;
		}

		if (!archivoImagen) {
			error = "Selecciona una imagen para el producto.";
			return;
		}

		guardando = true;
		error = null;

		try {
			subiendoImagen = true;
			const urlImagen = await subirImagenProducto(archivoImagen);
			subiendoImagen = false;

			await agregarProducto({
				Nombre: formulario.Nombre.trim(),
				Tipo: formulario.Tipo.trim(),
				marca: formulario.marca.trim(),
				descripcion: formulario.descripcion.trim(),
				especificacion: formulario.especificacion.trim(),
				imagen: urlImagen,
				precio: Number(formulario.precio) || 0,
				stock: Number(formulario.stock) || 0,
				popular: formulario.popular
			});

			formulario = { ...formularioVacio };
			limpiarImagenSeleccionada();
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo agregar el producto.";
		} finally {
			subiendoImagen = false;
			guardando = false;
		}
	}

	async function manejarEliminar(id: string, nombre: string, imagen: string) {
		const confirmado = confirm(`¿Eliminar "${nombre}" del inventario?`);
		if (!confirmado) return;

		try {
			await eliminarProducto(id, imagen);
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo eliminar el producto.";
		}
	}

	function actualizarCampoPendiente<K extends keyof CambiosProducto>(
		id: string,
		campo: K,
		valor: CambiosProducto[K]
	) {
		cambiosPorGuardar[id] = {
			...cambiosPorGuardar[id],
			[campo]: valor
		};
	}

	async function manejarGuardarProducto(id: string) {
		const cambios = cambiosPorGuardar[id];
		if (!cambios || Object.keys(cambios).length === 0) return;

		try {
			await actualizarProducto(id, cambios);
			delete cambiosPorGuardar[id];
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo actualizar el producto.";
		}
	}

	async function manejarGuardarCategoria(evento: SubmitEvent) {
		evento.preventDefault();

		if (!formularioCategoria.nombre.trim()) {
			error = "El nombre de la categoría es obligatorio.";
			return;
		}

		guardandoCategoria = true;
		error = null;

		try {
			let imagenFinal = formularioCategoria.imagen;

			if (archivoImagenCategoria) {
				subiendoImagenCategoria = true;
				imagenFinal = await subirImagenCategoria(archivoImagenCategoria);
				subiendoImagenCategoria = false;
			}

			if (categoriaEditandoId) {
				await actualizarCategoria(categoriaEditandoId, {
					nombre: formularioCategoria.nombre.trim(),
					descripcion: formularioCategoria.descripcion.trim(),
					imagen: imagenFinal
				});
			} else {
				await guardarCategoria({
					nombre: formularioCategoria.nombre.trim(),
					descripcion: formularioCategoria.descripcion.trim(),
					imagen: imagenFinal
				});
			}

			resetearFormularioCategoria();
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo guardar la categoría.";
		} finally {
			subiendoImagenCategoria = false;
			guardandoCategoria = false;
		}
	}
</script>

<section class="mx-auto max-w-6xl px-6 py-12">
	<p class="font-Manrope text-3xl text-slate-700">Inventario</p>

	{#if error}
		<div class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
			{error}
		</div>
	{/if}

	<form
		onsubmit={manejarAgregar}
		class="mt-8 grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-6 sm:grid-cols-2"
	>
		<div class="flex flex-col gap-1">
			<label for="nombre" class="text-sm font-semibold text-slate-600">
				Nombre
			</label>
			<input
				id="nombre"
				type="text"
				bind:value={formulario.Nombre}
				required
				class="rounded-lg border border-slate-200 px-3 py-2"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="tipo" class="text-sm font-semibold text-slate-600">
				Tipo (categoría)
			</label>
			<select
				id="tipo"
				bind:value={formulario.Tipo}
				required
				class="rounded-lg border border-slate-200 bg-white px-3 py-2"
			>
				<option value="" disabled selected={!formulario.Tipo}>
					Selecciona una categoría
				</option>
				{#each nombresCategorias as nombre}
					<option value={nombre}>{nombre}</option>
				{/each}
			</select>
			{#if nombresCategorias.length === 0}
				<p class="text-xs text-slate-400">
					Todavía no hay categorías creadas. Crea una abajo antes de agregar el producto.
				</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1">
			<label for="marca" class="text-sm font-semibold text-slate-600">
				Marca
			</label>
			<input
				id="marca"
				type="text"
				placeholder="Ej. Anua, COSRX..."
				bind:value={formulario.marca}
				class="rounded-lg border border-slate-200 px-3 py-2"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="precio" class="text-sm font-semibold text-slate-600">
				Precio (USD)
			</label>
			<input
				id="precio"
				type="number"
				min="0"
				step="0.01"
				bind:value={formulario.precio}
				required
				class="rounded-lg border border-slate-200 px-3 py-2"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="stock" class="text-sm font-semibold text-slate-600">
				Stock
			</label>
			<input
				id="stock"
				type="number"
				min="0"
				step="1"
				bind:value={formulario.stock}
				required
				class="rounded-lg border border-slate-200 px-3 py-2"
			/>
		</div>

		<div class="flex items-center gap-2 sm:col-span-2">
			<input
				id="popular"
				type="checkbox"
				bind:checked={formulario.popular}
				class="h-4 w-4 rounded border-slate-300"
			/>
			<label for="popular" class="text-sm font-semibold text-slate-600">
				Marcar como "Más popular" (aparecerá en el filtro de más populares)
			</label>
		</div>

		<div class="flex flex-col gap-1 sm:col-span-2">
			<label for="especificacion" class="text-sm font-semibold text-slate-600">
				Especificación (opcional, ej. "SPF50+ PA++++")
			</label>
			<input
				id="especificacion"
				type="text"
				bind:value={formulario.especificacion}
				class="rounded-lg border border-slate-200 px-3 py-2"
			/>
		</div>

		<div class="flex flex-col gap-1 sm:col-span-2">
			<label for="imagen" class="text-sm font-semibold text-slate-600">
				Imagen del producto
			</label>
			<input
				id="imagen"
				type="file"
				accept="image/*"
				bind:this={inputImagen}
				onchange={manejarSeleccionImagen}
				class="rounded-lg border border-slate-200 px-3 py-2 file:mr-3 file:rounded-full file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
			/>

			{#if vistaPreviaImagen}
				<div class="mt-2 flex items-center gap-3">
					<img
						src={vistaPreviaImagen}
						alt="Vista previa"
						class="h-20 w-20 rounded-lg object-cover"
					/>
					<button
						type="button"
						onclick={limpiarImagenSeleccionada}
						class="text-xs font-semibold text-red-600 hover:underline"
					>
						Quitar imagen
					</button>
				</div>
			{/if}
		</div>

		<div class="flex flex-col gap-1 sm:col-span-2">
			<label for="descripcion" class="text-sm font-semibold text-slate-600">
				Descripción
			</label>
			<textarea
				id="descripcion"
				rows="3"
				bind:value={formulario.descripcion}
				class="rounded-lg border border-slate-200 px-3 py-2"
			></textarea>
		</div>

		<div class="sm:col-span-2">
			<button
				type="submit"
				disabled={guardando}
				class="rounded-full bg-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-600 disabled:opacity-50"
			>
				{subiendoImagen
					? "Subiendo imagen..."
					: guardando
						? "Agregando..."
						: "Agregar producto"}
			</button>
		</div>
	</form>

<div class="mt-10 rounded-2xl bg-slate-50 p-6">
		<div class="mb-5 flex items-end justify-between gap-3">
			<div>
				<p class="font-Manrope text-2xl text-slate-700">Categorías</p>
				<p class="text-sm text-slate-500">
					Edita la imagen y la descripción que verán los clientes.
				</p>
			</div>
			{#if categoriaEditandoId}
				<button
					type="button"
					onclick={resetearFormularioCategoria}
					class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
				>
					Nueva categoría
				</button>
			{/if}
		</div>

		<form onsubmit={manejarGuardarCategoria} class="grid gap-4 md:grid-cols-2">
			<div class="flex flex-col gap-1 md:col-span-2">
				<label for="categoria-nombre" class="text-sm font-semibold text-slate-600">
					Nombre de la categoría
				</label>
				<input
					id="categoria-nombre"
					type="text"
					bind:value={formularioCategoria.nombre}
					disabled={Boolean(categoriaEditandoId)}
					class="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:bg-slate-100"
				/>
			</div>

			<div class="flex flex-col gap-1 md:col-span-2">
				<label for="categoria-descripcion" class="text-sm font-semibold text-slate-600">
					Descripción
				</label>
				<textarea
					id="categoria-descripcion"
					rows="3"
					bind:value={formularioCategoria.descripcion}
					class="rounded-lg border border-slate-200 px-3 py-2"
				></textarea>
			</div>

			<div class="flex flex-col gap-1 md:col-span-2">
				<label for="categoria-imagen" class="text-sm font-semibold text-slate-600">
					Imagen de la categoría
				</label>
				<input
					id="categoria-imagen"
					type="file"
					accept="image/*"
					bind:this={inputImagenCategoria}
					onchange={manejarSeleccionImagenCategoria}
					class="rounded-lg border border-slate-200 px-3 py-2 file:mr-3 file:rounded-full file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
				/>

				{#if vistaPreviaImagenCategoria}
					<div class="mt-2 flex items-center gap-3">
						<img
							src={vistaPreviaImagenCategoria}
							alt="Vista previa categoría"
							class="h-20 w-20 rounded-lg object-cover"
						/>
						<button
							type="button"
							onclick={limpiarImagenSeleccionadaCategoria}
							class="text-xs font-semibold text-red-600 hover:underline"
						>
							Quitar imagen
						</button>
					</div>
				{/if}
			</div>

			<div class="md:col-span-2">
				<button
					type="submit"
					disabled={guardandoCategoria}
					class="rounded-full bg-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-600 disabled:opacity-50"
				>
					{subiendoImagenCategoria
						? "Subiendo imagen..."
						: guardandoCategoria
							? "Guardando..."
							: categoriaEditandoId
								? "Guardar cambios"
								: "Guardar categoría"}
				</button>
			</div>
		</form>

		<div class="mt-8">
			{#if categorias.length === 0}
				<p class="text-sm text-slate-500">Todavía no hay categorías guardadas.</p>
			{:else}
				<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{#each categorias as categoria (categoria.id)}
						<div class="rounded-2xl border border-slate-200 bg-white p-4">
							<div class="flex items-start gap-3">
								{#if categoria.imagen}
									<img
										src={categoria.imagen}
										alt={categoria.nombre}
										class="h-16 w-16 rounded-xl object-cover"
									/>
								{:else}
									<div class="h-16 w-16 rounded-xl bg-slate-100"></div>
								{/if}
								<div class="flex-1">
									<p class="font-semibold text-slate-700">{categoria.nombre}</p>
									<p class="mt-1 line-clamp-2 text-sm text-slate-500">{categoria.descripcion || "Sin descripción"}</p>
								</div>
							</div>
							<div class="mt-4 flex justify-end">
								<button
									type="button"
									onclick={() => prepararEdicionCategoria(categoria)}
									class="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
								>
									Editar
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="mt-10">
		{#if cargando}
			<p class="text-slate-500">Cargando productos...</p>
		{:else if productos.length === 0}
			<p class="text-slate-500">No hay productos en el inventario.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full min-w-180 table-auto border-collapse text-left text-sm">
					<thead>
						<tr class="border-b border-slate-200 text-slate-500">
							<th class="py-2 pr-4">Imagen</th>
							<th class="py-2 pr-4">Nombre</th>
							<th class="py-2 pr-4">Tipo</th>
							<th class="py-2 pr-4">Marca</th>
							<th class="py-2 pr-4">Precio</th>
							<th class="py-2 pr-4">Stock</th>
							<th class="py-2 pr-4">Popular</th>
							<th class="py-2 pr-4">Descripción</th>
							<th class="py-2 pr-4"></th>
						</tr>
					</thead>
					<tbody>
						{#each productos as producto (producto.id)}
							<tr class="border-b border-slate-100 align-top">
								<td class="py-3 pr-4">
									{#if producto.imagen}
										<img
											src={producto.imagen}
											alt={producto.Nombre}
											class="h-14 w-14 rounded-lg object-cover"
										/>
									{:else}
										<div
											class="h-14 w-14 rounded-lg bg-slate-100"
										></div>
									{/if}
								</td>
								<td class="py-3 pr-4 font-semibold text-slate-700">
									{producto.Nombre}
								</td>
								<td class="py-3 pr-4">
									<select
										value={cambiosPorGuardar[producto.id]?.Tipo ??
											producto.Tipo}
										onchange={(evento) =>
											actualizarCampoPendiente(
												producto.id,
												"Tipo",
												(evento.target as HTMLSelectElement).value
											)}
										class="w-36 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700"
									>
										{#each opcionesTipo(producto.Tipo) as nombre}
											<option value={nombre}>{nombre}</option>
										{/each}
									</select>
								</td>
								<td class="py-3 pr-4">
									<input
										type="text"
										placeholder="Marca"
										value={cambiosPorGuardar[producto.id]?.marca ??
											producto.marca}
										oninput={(evento) =>
											actualizarCampoPendiente(
												producto.id,
												"marca",
												(evento.target as HTMLInputElement).value
											)}
										class="w-28 rounded-lg border border-slate-200 px-2 py-1 text-slate-700"
									/>
								</td>
								<td class="py-3 pr-4">
									<div class="flex items-center gap-1">
										<span class="text-slate-500">$</span>
										<input
											type="number"
											min="0"
											step="0.01"
											value={cambiosPorGuardar[producto.id]?.precio ??
												producto.precio}
											oninput={(evento) =>
												actualizarCampoPendiente(
													producto.id,
													"precio",
													Number(
														(evento.target as HTMLInputElement)
															.value
													) || 0
												)}
											class="w-20 rounded-lg border border-slate-200 px-2 py-1 text-slate-700"
										/>
									</div>
								</td>
								<td class="py-3 pr-4">
									<input
										type="number"
										min="0"
										value={cambiosPorGuardar[producto.id]?.stock ??
											producto.stock}
										oninput={(evento) =>
											actualizarCampoPendiente(
												producto.id,
												"stock",
												Number(
													(evento.target as HTMLInputElement)
														.value
												) || 0
											)}
										class="w-20 rounded-lg border border-slate-200 px-2 py-1 text-slate-700"
									/>
								</td>
								<td class="py-3 pr-4 text-center">
									<input
										type="checkbox"
										checked={cambiosPorGuardar[producto.id]?.popular ??
											producto.popular}
										onchange={(evento) =>
											actualizarCampoPendiente(
												producto.id,
												"popular",
												(evento.target as HTMLInputElement).checked
											)}
										class="h-4 w-4 rounded border-slate-300"
									/>
								</td>
								<td class="max-w-xs py-3 pr-4 text-slate-500">
									<p class="line-clamp-2">{producto.descripcion}</p>
								</td>
								<td class="py-3 pr-4">
									<div class="flex items-center gap-2">
										<button
											type="button"
											onclick={() =>
												manejarGuardarProducto(producto.id)}
											disabled={!cambiosPorGuardar[producto.id]}
											class="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-40"
										>
											Guardar
										</button>
										<button
											type="button"
											onclick={() =>
												manejarEliminar(
													producto.id,
													producto.Nombre,
													producto.imagen
												)}
											class="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
										>
											Eliminar
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</section>
