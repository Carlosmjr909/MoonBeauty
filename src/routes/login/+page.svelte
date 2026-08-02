<script lang="ts">
	import Icon from '@iconify/svelte';

	let mostrarContrasena = $state(false);
</script>

<svelte:head>
	<title>Iniciar sesión | MoonBeauty</title>

	<meta
		name="description"
		content="Inicia sesión en tu cuenta de MoonBeauty."
	/>
</svelte:head>

<section class="min-h-[calc(100svh-5rem)] bg-slate-50 lg:min-h-[calc(100svh-6rem)]">
	<div
		class="mx-auto grid min-h-[calc(100svh-5rem)] max-w-[1600px] grid-cols-1 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-2"
	>
		<!-- Formulario -->
		<div
			class="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-10 xl:px-16"
		>
			<form
				class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-sm sm:p-8 lg:p-10 xl:p-12"
				onsubmit={(event) => event.preventDefault()}
			>
				<div class="text-center">
					<p
						class="font-PlayFair text-3xl text-slate-600 sm:text-4xl lg:text-5xl"
					>
						MoonBeauty
					</p>

					<p
						class="mt-3 font-BeVietnam text-sm leading-6 text-slate-500 sm:text-base lg:text-lg"
					>
						El ritual de tu bienestar comienza aquí.
					</p>
				</div>

				<div class="mt-8">
					<label
						for="correo"
						class="mb-2 block font-BeVietnam text-sm font-semibold uppercase tracking-wide text-slate-600"
					>
						Correo electrónico
					</label>

					<div class="relative">
						<Icon
							icon="material-symbols:mail-outline-rounded"
							width="21"
							class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
						/>

						<input
							id="correo"
							type="email"
							name="correo"
							autocomplete="email"
							placeholder="tu@ejemplo.com"
							required
							class="h-13 w-full rounded-full border border-slate-200 bg-slate-50 pl-12 pr-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
						/>
					</div>
				</div>

				<div class="mt-5">
					<label
						for="contrasena"
						class="mb-2 block font-BeVietnam text-sm font-semibold uppercase tracking-wide text-slate-600"
					>
						Contraseña
					</label>

					<div class="relative">
						<Icon
							icon="material-symbols:lock-outline-rounded"
							width="21"
							class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
						/>

						<input
							id="contrasena"
							type={mostrarContrasena ? 'text' : 'password'}
							name="contrasena"
							autocomplete="current-password"
							placeholder="••••••••"
							required
							class="h-13 w-full rounded-full border border-slate-200 bg-slate-50 pl-12 pr-14 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
						/>

						<button
							type="button"
							aria-label={mostrarContrasena
								? 'Ocultar contraseña'
								: 'Mostrar contraseña'}
							onclick={() => (mostrarContrasena = !mostrarContrasena)}
							class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-slate-700"
						>
							<Icon
								icon={mostrarContrasena
									? 'material-symbols:visibility-off-outline-rounded'
									: 'material-symbols:visibility-outline-rounded'}
								width="22"
							/>
						</button>
					</div>
				</div>

				<div
					class="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"
				>
					<label class="flex cursor-pointer items-center gap-2 text-slate-600">
						<input
							type="checkbox"
							name="recordarme"
							class="h-4 w-4 rounded border-slate-300 accent-slate-600"
						/>

						<span>Recordarme</span>
					</label>

					<a
						href="/forgot-password"
						class="font-medium text-slate-500 transition hover:text-sky-700 hover:underline"
					>
						¿Olvidaste tu contraseña?
					</a>
				</div>

				<button
					type="submit"
					class="mt-7 h-13 w-full rounded-full bg-slate-600 px-6 font-BeVietnam font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-500 hover:shadow-lg"
				>
					Iniciar sesión
				</button>

				<div class="my-7 flex items-center">
					<div class="h-px flex-1 bg-slate-200"></div>

					<p class="px-4 text-sm text-slate-400">
						o continúa con
					</p>

					<div class="h-px flex-1 bg-slate-200"></div>
				</div>

				<button
					type="button"
					class="flex h-13 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5 font-BeVietnam font-medium text-slate-600 transition hover:bg-slate-100"
				>
					<Icon icon="flat-color-icons:google" width="24" />
					Google
				</button>

				<div
					class="mt-8 flex flex-col items-center justify-center gap-2 text-center text-sm sm:flex-row sm:text-base"
				>
					<p class="text-slate-500">
						¿Aún no tienes cuenta?
					</p>

					<a
						class="font-semibold text-sky-700 transition hover:underline"
						href="/create_account"
					>
						Crear una cuenta
					</a>
				</div>
			</form>
		</div>

		<!-- Imagen -->
		<div class="relative hidden min-h-full overflow-hidden lg:block">
			<img
				src="/fondo inicio de sesion 2.webp"
				alt="Productos de skincare coreano MoonBeauty"
				class="absolute inset-0 h-full w-full object-cover"
			/>

			<div
				class="absolute inset-0 bg-linear-to-t from-slate-900/45 via-transparent to-white/10"
			></div>

			<div
				class="absolute bottom-12 left-10 right-10 rounded-3xl bg-white/20 p-8 text-white backdrop-blur-md xl:bottom-16 xl:left-16 xl:right-16"
			>
				<p class="font-PlayFair text-3xl xl:text-4xl">
					Tu piel, tu ritual
				</p>

				<p class="mt-3 max-w-xl text-base leading-7 text-white/90 xl:text-lg">
					Descubre una selección de skincare coreano pensada para
					acompañar cada etapa de tu rutina.
				</p>
			</div>
		</div>
	</div>
</section>