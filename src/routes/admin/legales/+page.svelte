<script lang="ts">
	import { untrack } from "svelte";
	import Icon from "@iconify/svelte";
	import { renderizarMarkdown } from "$lib/markdown";
	import { guardarPaginaLegal, fechaDeHoy } from "$lib/legales";

	let { data } = $props();

	type PaginaEditable = {
		slug: string;
		titulo: string;
		actualizado: string;
		contenido: string;
		contenidoOriginal: string;
	};

	// Dos copias de lo que vino del servidor: "paginas" es la que se
	// edita y "guardadas" es la referencia de lo último publicado, que
	// sirve para saber si hay cambios sin guardar.
	let paginas = $state<PaginaEditable[]>(
		untrack(() => data.paginas.map((pagina) => ({ ...pagina }))),
	);

	let guardadas = $state<PaginaEditable[]>(
		untrack(() => data.paginas.map((pagina) => ({ ...pagina }))),
	);

	let indiceActivo = $state(0);
	let guardando = $state(false);
	let error = $state("");
	let mensaje = $state("");
	let mostrarVistaPrevia = $state(true);
	let areaTexto = $state<HTMLTextAreaElement | null>(null);

	const paginaActual = $derived(paginas[indiceActivo]);

	const vistaPrevia = $derived(renderizarMarkdown(paginaActual.contenido));

	const hayCambios = $derived.by(() => {
		const publicada = guardadas[indiceActivo];

		return (
			paginaActual.titulo !== publicada.titulo ||
			paginaActual.actualizado !== publicada.actualizado ||
			paginaActual.contenido !== publicada.contenido
		);
	});

	const RUTAS_PUBLICAS: Record<string, string> = {
		envios: "/envios",
		"cambios-y-devoluciones": "/cambios-y-devoluciones",
		"terminos-y-condiciones": "/terminos-y-condiciones",
		privacidad: "/privacidad",
	};

	/**
	 * Envuelve o inserta texto en la posición del cursor, para que no
	 * haga falta saber Markdown de memoria.
	 */
	function insertar(antes: string, despues = "", textoEjemplo = "") {
		const area = areaTexto;
		if (!area) return;

		const inicio = area.selectionStart;
		const fin = area.selectionEnd;
		const seleccion = paginaActual.contenido.slice(inicio, fin);
		const texto = seleccion || textoEjemplo;

		paginaActual.contenido =
			paginaActual.contenido.slice(0, inicio) +
			antes +
			texto +
			despues +
			paginaActual.contenido.slice(fin);

		// Deja el cursor sobre el texto insertado para poder escribir encima.
		requestAnimationFrame(() => {
			area.focus();
			area.setSelectionRange(
				inicio + antes.length,
				inicio + antes.length + texto.length,
			);
		});
	}

	async function guardar() {
		guardando = true;
		error = "";
		mensaje = "";

		try {
			await guardarPaginaLegal(paginaActual.slug, {
				titulo: paginaActual.titulo,
				actualizado: paginaActual.actualizado,
				contenido: paginaActual.contenido,
			});

			// Se actualiza la referencia para que "hayCambios" vuelva a
			// quedar en falso sin tener que recargar la página.
			guardadas[indiceActivo] = { ...paginaActual };

			mensaje = "Guardado. La página ya está actualizada en el sitio.";
			setTimeout(() => {
				mensaje = "";
			}, 4000);
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: "No se pudo guardar la página.";
		} finally {
			guardando = false;
		}
	}

	function restaurarOriginal() {
		if (
			!confirm(
				"¿Restaurar el texto original de esta página? Se perderán los cambios que hayas hecho.",
			)
		) {
			return;
		}

		paginaActual.contenido = paginaActual.contenidoOriginal;
	}

	function descartarCambios() {
		paginas[indiceActivo] = { ...guardadas[indiceActivo] };
	}
</script>

<svelte:head>
	<title>Páginas legales | Panel Moon Beauty</title>
</svelte:head>

<section class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
	<a
		href="/admin"
		class="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
	>
		<Icon icon="material-symbols:chevron-left-rounded" width="20" />
		Panel
	</a>

	<p class="mt-1 font-Manrope text-3xl text-slate-700">Páginas legales</p>

	<p class="mt-2 text-sm leading-6 text-slate-500">
		Edita el texto de tus políticas. Usa los botones de formato: no hace
		falta saber nada técnico, y a la derecha ves cómo va quedando.
	</p>

	<div class="mt-6 flex flex-wrap gap-2">
		{#each paginas as pagina, indice (pagina.slug)}
			<button
				type="button"
				onclick={() => {
					indiceActivo = indice;
					error = "";
					mensaje = "";
				}}
				class="rounded-full px-4 py-2 text-sm font-semibold transition"
				class:bg-slate-700={indiceActivo === indice}
				class:text-white={indiceActivo === indice}
				class:bg-slate-100={indiceActivo !== indice}
				class:text-slate-600={indiceActivo !== indice}
			>
				{pagina.titulo}
			</button>
		{/each}
	</div>

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

	<div class="mt-6 grid gap-4 sm:grid-cols-2">
		<div class="flex flex-col gap-1">
			<label for="titulo" class="text-sm font-semibold text-slate-600">
				Título de la página
			</label>
			<input
				id="titulo"
				type="text"
				bind:value={paginaActual.titulo}
				class="rounded-lg border border-slate-200 px-3 py-2"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label
				for="actualizado"
				class="text-sm font-semibold text-slate-600"
			>
				Última actualización
			</label>

			<div class="flex gap-2">
				<input
					id="actualizado"
					type="text"
					bind:value={paginaActual.actualizado}
					class="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2"
				/>

				<button
					type="button"
					onclick={() => (paginaActual.actualizado = fechaDeHoy())}
					class="shrink-0 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
				>
					Hoy
				</button>
			</div>
		</div>
	</div>

	<div class="mt-6 flex flex-wrap items-center gap-2">
		<button
			type="button"
			onclick={() => insertar("## ", "", "Título de sección")}
			class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
		>
			Título
		</button>

		<button
			type="button"
			onclick={() => insertar("**", "**", "texto en negrita")}
			class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
		>
			Negrita
		</button>

		<button
			type="button"
			onclick={() => insertar("- ", "", "elemento de la lista")}
			class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
		>
			Lista
		</button>

		<button
			type="button"
			onclick={() => insertar("[", "](https://)", "texto del enlace")}
			class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
		>
			Enlace
		</button>

		<button
			type="button"
			onclick={() => (mostrarVistaPrevia = !mostrarVistaPrevia)}
			class="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 lg:hidden"
		>
			{mostrarVistaPrevia ? "Ocultar vista previa" : "Ver vista previa"}
		</button>
	</div>

	<div class="mt-3 grid gap-4 lg:grid-cols-2">
		<div class="flex flex-col gap-1">
			<label
				for="contenido"
				class="text-sm font-semibold text-slate-600"
			>
				Contenido
			</label>

			<textarea
				id="contenido"
				bind:this={areaTexto}
				bind:value={paginaActual.contenido}
				rows="24"
				spellcheck="true"
				class="rounded-xl border border-slate-200 p-4 font-mono text-sm leading-6"
			></textarea>

			<p class="text-xs text-slate-400">
				Deja una línea en blanco entre párrafos para separarlos.
			</p>
		</div>

		<div class:hidden={!mostrarVistaPrevia} class="lg:block">
			<p class="text-sm font-semibold text-slate-600">
				Así se va a ver
			</p>

			<div
				class="legal-vista-previa mt-1 h-144 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-base leading-7 text-slate-600"
			>
				{@html vistaPrevia}
			</div>
		</div>
	</div>

	<div class="mt-6 flex flex-wrap items-center gap-3">
		<button
			type="button"
			onclick={guardar}
			disabled={guardando || !hayCambios}
			class="h-12 rounded-full bg-slate-700 px-8 font-semibold text-white transition hover:bg-slate-600 disabled:opacity-50"
		>
			{guardando
				? "Guardando..."
				: hayCambios
					? "Guardar cambios"
					: "Sin cambios"}
		</button>

		{#if hayCambios}
			<button
				type="button"
				onclick={descartarCambios}
				class="h-12 rounded-full px-5 font-semibold text-slate-600 transition hover:bg-slate-100"
			>
				Descartar
			</button>
		{/if}

		<a
			href={RUTAS_PUBLICAS[paginaActual.slug]}
			target="_blank"
			rel="noreferrer"
			class="inline-flex h-12 items-center gap-1 rounded-full px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
		>
			<Icon icon="material-symbols:open-in-new" width="18" />
			Ver la página
		</a>

		<button
			type="button"
			onclick={restaurarOriginal}
			class="ml-auto text-sm font-semibold text-slate-400 transition hover:text-slate-600"
		>
			Restaurar texto original
		</button>
	</div>
</section>

<style>
	/* Se replican los estilos de la página legal real para que la vista
	previa muestre lo mismo que verá el visitante. */
	.legal-vista-previa :global(h2) {
		margin-top: 2rem;
		font-family: "Manrope", sans-serif;
		font-size: 1.5rem;
		color: #334155;
	}

	.legal-vista-previa :global(h2:first-child) {
		margin-top: 0;
	}

	.legal-vista-previa :global(p) {
		margin: 0 0 1.5rem;
	}

	.legal-vista-previa :global(ul) {
		list-style: disc;
		padding-left: 1.5rem;
		margin: 0 0 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.legal-vista-previa :global(a) {
		color: #0369a1;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.legal-vista-previa :global(strong) {
		color: #1e293b;
	}
</style>
