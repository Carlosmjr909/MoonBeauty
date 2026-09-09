<script lang="ts">
	import { goto } from '$app/navigation';
	import { usuario, autenticacionCargando } from '$lib/auth';
	import { doc, getDoc, setDoc } from 'firebase/firestore';
	import { db } from '$lib/firebase';

	$effect(() => {
		if (!$autenticacionCargando && !$usuario) {
			goto('/login');
		}
	});

	let recibirPromociones = $state(true);
	let cargandoPreferencia = $state(true);
	let guardandoPreferencia = $state(false);
	let errorPreferencia = $state('');
	let mensajePreferencia = $state('');

	// Se lee la preferencia guardada del cliente. Si el documento todavía
	// no tiene el campo, se asume que sí quiere recibirlas (es lo que dice
	// la política de privacidad al registrarse).
	$effect(() => {
		const usuarioActual = $usuario;

		if (!usuarioActual || usuarioActual.isAnonymous) return;

		let cancelado = false;

		getDoc(doc(db, 'usuarios', usuarioActual.uid))
			.then((snapshot) => {
				if (cancelado) return;

				const datos = snapshot.data();
				recibirPromociones = datos?.recibirPromociones !== false;
				cargandoPreferencia = false;
			})
			.catch(() => {
				if (cancelado) return;
				cargandoPreferencia = false;
			});

		return () => {
			cancelado = true;
		};
	});

	async function cambiarPreferencia(nuevoValor: boolean) {
		const usuarioActual = $usuario;
		if (!usuarioActual) return;

		const valorPrevio = recibirPromociones;
		recibirPromociones = nuevoValor;
		guardandoPreferencia = true;
		errorPreferencia = '';
		mensajePreferencia = '';

		try {
			await setDoc(
				doc(db, 'usuarios', usuarioActual.uid),
				{
					uid: usuarioActual.uid,
					correo: usuarioActual.email,
					recibirPromociones: nuevoValor
				},
				{ merge: true }
			);

			mensajePreferencia = nuevoValor
				? 'Listo, seguirás recibiendo nuestras promociones.'
				: 'Listo, no te enviaremos más correos promocionales.';

			setTimeout(() => {
				mensajePreferencia = '';
			}, 4000);
		} catch {
			// Si falla, se devuelve el interruptor a como estaba para no
			// mostrarle al cliente un estado que no se guardó.
			recibirPromociones = valorPrevio;
			errorPreferencia = 'No se pudo guardar tu preferencia.';
		} finally {
			guardandoPreferencia = false;
		}
	}
</script>

<svelte:head>
	<title>Mi cuenta | MoonBeauty</title>
</svelte:head>

<main class="min-h-[70vh] bg-slate-50 px-4 py-12">
	<div class="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
		{#if $autenticacionCargando}
			<p>Cargando cuenta...</p>
		{:else if $usuario}
			<h1 class="font-Manrope text-4xl text-slate-700">
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

			<div class="mt-10 border-t border-slate-200 pt-8">
				<h2 class="font-Manrope text-2xl text-slate-700">
					Correos promocionales
				</h2>

				{#if cargandoPreferencia}
					<p class="mt-3 text-sm text-slate-500">
						Cargando preferencia...
					</p>
				{:else}
					<label class="mt-4 flex items-start gap-3">
						<input
							type="checkbox"
							checked={recibirPromociones}
							disabled={guardandoPreferencia}
							onchange={(evento) =>
								cambiarPreferencia(
									evento.currentTarget.checked
								)}
							class="mt-1 h-4 w-4 shrink-0"
						/>

						<span class="text-sm leading-6 text-slate-600">
							Quiero recibir cupones, ofertas y novedades de Moon
							Beauty en mi correo. Puedes cambiar esto cuando
							quieras.
						</span>
					</label>
				{/if}

				{#if mensajePreferencia}
					<p class="mt-3 text-sm text-green-700">
						{mensajePreferencia}
					</p>
				{/if}

				{#if errorPreferencia}
					<p class="mt-3 text-sm text-red-600">
						{errorPreferencia}
					</p>
				{/if}
			</div>
		{/if}
	</div>
</main>
