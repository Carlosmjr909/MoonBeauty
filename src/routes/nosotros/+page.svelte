<script lang="ts">
	import PaginaLegal from "$lib/components/PaginaLegal.svelte";

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.pagina.titulo} | Moon Beauty</title>
</svelte:head>

<PaginaLegal
	titulo={data.pagina.titulo}
	actualizado={data.pagina.actualizado}
	html={data.pagina.html}
/>
