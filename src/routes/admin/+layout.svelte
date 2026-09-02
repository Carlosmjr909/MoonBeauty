<script lang="ts">
	import { goto } from "$app/navigation";
	import { usuario, autenticacionCargando } from "$lib/auth";
	import { esAdmin, esAdminCargando } from "$lib/admin";

	let { children } = $props();

	const verificando = $derived($autenticacionCargando || $esAdminCargando);
	const autorizado = $derived(Boolean($usuario) && $esAdmin);

	$effect(() => {
		if (verificando) return;

		if (!autorizado) {
			goto("/");
		}
	});
</script>

{#if verificando}
	<div class="flex min-h-[60vh] items-center justify-center">
		<p class="text-slate-500">Verificando acceso...</p>
	</div>
{:else if autorizado}
	{@render children()}
{/if}
