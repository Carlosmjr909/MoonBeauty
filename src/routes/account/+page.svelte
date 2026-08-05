<script lang="ts">
	import { goto } from '$app/navigation';
	import { usuario, autenticacionCargando } from '$lib/auth';

	$effect(() => {
		if (!$autenticacionCargando && !$usuario) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Mi cuenta | MoonBeauty</title>
</svelte:head>

<main class="min-h-[70vh] bg-slate-50 px-4 py-12">
	<div class="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
		{#if $autenticacionCargando}
			<p>Cargando cuenta...</p>
		{:else if $usuario}
			<h1 class="font-PlayFair text-4xl text-slate-700">
				Mi cuenta
			</h1>

			<div class="mt-8 space-y-3">
				<p>
					<strong>Nombre:</strong>
					{$usuario.displayName ?? 'Sin nombre'}
				</p>

				<p>
					<strong>Correo:</strong>
					{$usuario.email}
				</p>

				<p>
					<strong>Correo verificado:</strong>
					{$usuario.emailVerified ? 'Sí' : 'No'}
				</p>
			</div>
		{/if}
	</div>
</main>