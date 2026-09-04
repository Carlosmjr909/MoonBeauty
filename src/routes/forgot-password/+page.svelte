<script lang="ts">
	import { sendPasswordResetEmail } from 'firebase/auth';
	import { auth } from '$lib/firebase';

	let correo = $state('');
	let cargando = $state(false);
	let error = $state('');
	let mensaje = $state('');

	async function recuperar(event: SubmitEvent) {
		event.preventDefault();

		error = '';
		mensaje = '';
		cargando = true;

		try {
			await sendPasswordResetEmail(auth, correo.trim());

			mensaje =
				'Te enviamos un enlace para restablecer tu contraseña.';
		} catch {
			error =
				'No se pudo enviar el correo. Verifica la dirección ingresada.';
		} finally {
			cargando = false;
		}
	}
</script>

<svelte:head>
	<title>Recuperar contraseña | MoonBeauty</title>
</svelte:head>

<main class="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12">
	<form
		onsubmit={recuperar}
		class="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"
	>
		<h1 class="font-Manrope text-3xl text-slate-700">
			Recuperar contraseña
		</h1>

		<p class="mt-3 text-sm text-slate-500">
			Introduce el correo asociado a tu cuenta.
		</p>

		<input
			type="email"
			bind:value={correo}
			placeholder="tu@ejemplo.com"
			required
			class="mt-7 h-13 w-full rounded-full border border-slate-200 bg-slate-50 px-5 outline-none focus:border-sky-300"
		/>

		{#if error}
			<p class="mt-4 text-sm text-red-600">{error}</p>
		{/if}

		{#if mensaje}
			<p class="mt-4 text-sm text-green-600">{mensaje}</p>
		{/if}

		<button
			type="submit"
			disabled={cargando}
			class="mt-6 h-13 w-full rounded-full bg-slate-600 font-semibold text-white disabled:opacity-60"
		>
			{cargando ? 'Enviando...' : 'Enviar enlace'}
		</button>
	</form>
</main>