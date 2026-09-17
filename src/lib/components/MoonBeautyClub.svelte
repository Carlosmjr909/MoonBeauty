<script lang="ts">
	import Icon from "@iconify/svelte";

	const beneficios = [
		{ icono: "material-symbols:sell-outline", texto: "Ofertas exclusivas de temporada" },
		{ icono: "material-symbols:bolt-rounded", texto: "Acceso anticipado a lanzamientos" },
		{ icono: "material-symbols:star-outline-rounded", texto: "Puntos glow canjeables en USD" },
		{ icono: "material-symbols:card-giftcard-outline", texto: "Regalos sorpresa en cada orden" },
	];
</script>

<section class="py-12 sm:py-16 lg:py-20 2xl:py-24">
	<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px]">
		<div
			class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-white to-rose-50 p-5 sm:p-12 lg:p-16"
		>
			<span
				class="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 font-Manrope text-xs font-bold uppercase tracking-[0.15em] text-slate-700 shadow-sm"
			>
				<Icon icon="material-symbols:auto-awesome-rounded" width="14" />
				Membresía exclusiva
			</span>

			<h2 class="mt-6 font-serif text-3xl text-slate-800 sm:text-4xl lg:text-5xl">
				Moon Beauty Club
			</h2>

			<p class="mt-3 max-w-xl font-serif text-base italic text-amber-800/80 sm:text-lg lg:text-xl">
				Más belleza. Más beneficios. Más luminosidad en cada compra.
			</p>

			<div class="mt-8 grid max-w-2xl grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2">
				{#each beneficios as beneficio (beneficio.texto)}
					<div
						class="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4"
					>
						<Icon icon={beneficio.icono} width="20" class="shrink-0 text-sky-700" />
						<p class="font-Manrope text-sm font-medium text-slate-700">
							{beneficio.texto}
						</p>
					</div>
				{/each}
			</div>

			<div class="mt-8 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:items-center sm:gap-5">
				<a
					href="/create_account"
					class="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-sky-300 px-6 py-3 text-center font-Manrope text-base font-semibold text-slate-700 shadow-md transition duration-300 hover:-translate-y-1 hover:bg-slate-600 hover:text-white sm:w-auto sm:px-8"
				>
					Unirme al Moon Beauty Club
				</a>

				<p class="font-Manrope text-sm text-slate-500">
					Totalmente gratuito para clientes Moon
				</p>
			</div>
		</div>
	</div>
</section>
