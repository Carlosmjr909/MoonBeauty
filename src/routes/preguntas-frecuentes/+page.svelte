<script lang="ts">
	let { data } = $props();

	const faqSchemaJson = $derived(
		JSON.stringify(data.faqSchema).replaceAll('<', '\\u003c')
	);
</script>

<svelte:head>
	<title>{data.seo.titulo}</title>

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${faqSchemaJson}</scr` + `ipt>`}
</svelte:head>

<section class="bg-slate-50 px-5 py-12 sm:px-8 lg:px-14">
	<div class="mx-auto max-w-3xl">
		<h1 class="font-Manrope text-3xl text-slate-800 sm:text-4xl lg:text-5xl">
			Preguntas Frecuentes
		</h1>
		<p class="mt-2 text-sm text-slate-500 sm:text-base">
			Delivery, envíos, pagos y cómo hacer tu pedido en Moon Beauty.
		</p>

		<div class="mt-8 space-y-6">
			{#each data.preguntas as { pregunta, respuesta }}
				<div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
					<h2 class="font-Manrope text-lg text-slate-800 sm:text-xl">
						{pregunta}
					</h2>
					<p class="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
						{respuesta}
					</p>
				</div>
			{/each}
		</div>
	</div>
</section>
