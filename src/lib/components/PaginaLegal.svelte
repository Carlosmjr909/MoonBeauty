<script lang="ts">
	interface PropTypes {
		titulo: string;
		actualizado: string;
		children?: import("svelte").Snippet;
	}

	const { titulo, actualizado, children }: PropTypes = $props();
</script>

<main class="bg-white px-4 py-14 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-3xl">
		<a
			href="/"
			class="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-sky-700"
		>
			← Volver al inicio
		</a>

		<h1 class="mt-4 font-Mendigo text-4xl text-slate-800 sm:text-5xl">
			{titulo}
		</h1>

		<p class="mt-3 text-sm text-slate-400">
			Última actualización: {actualizado}
		</p>

		<div
			class="legal-contenido mt-10 space-y-6 text-base leading-7 text-slate-600"
		>
			{@render children?.()}
		</div>
	</div>
</main>

<style>
	.legal-contenido :global(h2) {
		margin-top: 2rem;
		font-family: "Mendigo", serif;
		font-size: 1.5rem;
		color: #334155;
	}

	.legal-contenido :global(p) {
		margin: 0;
	}

	.legal-contenido :global(ul) {
		list-style: disc;
		padding-left: 1.5rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.legal-contenido :global(a) {
		color: #0369a1;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.legal-contenido :global(strong) {
		color: #1e293b;
	}
</style>
