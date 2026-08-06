<script lang="ts">
	import Tarjeta from '$lib/components/tarjeta.svelte';
	import Icon from '@iconify/svelte';

	import { products } from '$lib/products';
    import { onMount } from 'svelte';

	const miniListaProductos = products.filter(
		(product) => product.precio <= 15
	);

	const estado = $state<{
        elementoAnimado: null | HTMLElement
    }>({
        elementoAnimado: null,
    });


    onMount(() => {
        gsap.from(estado.elementoAnimado, {
            opacity: 0,
            translateY:-100, 
        })
    })
</script>

<section
bind:this={estado.elementoAnimado}
class="isolate flex min-h-[calc(100svh-5rem)] items-center justify-center overflow-hidden px-4 py-20 text-center sm:px-6 lg:min-h-[calc(100svh-6rem)] lg:px-8"
>
	<img
		src="/fondo.jpg"
		alt=""
		aria-hidden="true"
		class="absolute top-0 -z-10 h-full w-full object-cover"
	/>

	<div
		class=" -z-10 bg-white/20 backdrop-blur-[1px]"
	></div>

	<div class="mx-auto w-full max-w-4xl">
		<p
			class="font-PlayFair text-5xl leading-none text-slate-600 sm:text-6xl md:text-7xl lg:text-8xl 2xl:text-9xl"
		>
			MoonBeauty
		</p>

		<p
			class="mx-auto mt-5 max-w-2xl font-BeVietnam text-lg text-slate-600 sm:text-xl md:text-2xl lg:text-3xl"
		>
			Desde Corea hasta tu hogar
		</p>

		<a
			class="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-sky-200 px-8 py-3 font-BeVietnam text-base font-semibold text-slate-600 transition duration-300 hover:-translate-y-1 hover:bg-slate-600 hover:text-white hover:shadow-lg sm:px-10 sm:text-lg lg:px-12"
			href="/products"
		>
			Ver catálogo
		</a>
	</div>
</section>

<section class="bg-gray-50 py-12 sm:py-16 lg:py-20 2xl:py-24">
	<div
		class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px]"
	>
		<p
			class="font-BeVietnam text-sm font-bold uppercase tracking-[0.2em] text-sky-700 sm:text-base"
		>
			New arrivals
		</p>

		<div
			class="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
		>
			<div>
				<p
					class="font-PlayFair text-3xl font-bold text-slate-700 sm:text-4xl lg:text-5xl 2xl:text-6xl"
				>
					Favoritos de temporada
            </p>
			</div>

			<a
				class="inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-sky-200 px-6 py-3 font-BeVietnam text-sm font-semibold text-slate-600 transition duration-300 hover:bg-slate-600 hover:text-white sm:text-base"
				href="/products"
			>
				Ver todos
			</a>
		</div>

		<div
			class="mt-10 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:gap-8"
		>
			{#each miniListaProductos as producto}
				<Tarjeta
					{...producto}
				/>
			{/each}
		</div>
	</div>
</section>

<section class="bg-slate-50 py-12 sm:py-16 lg:py-20 2xl:py-24">
	<div
		class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px]"
	>
		<div class="mx-auto mb-10 max-w-3xl text-center lg:mb-14">
			<p
				class="font-BeVietnam text-sm font-bold uppercase tracking-[0.2em] text-sky-700"
			>
				Nuestra esencia
			</p>

			<p
				class="mt-3 font-PlayFair text-3xl text-slate-700 sm:text-4xl lg:text-5xl"
			>
				Belleza, calma y cuidado
		</p>
		</div>

		<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">

			<article
				class="group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
			>
				<div
					class="grid h-full grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
				>
					<div class="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-slate-700"
						>
							<Icon icon="mdi:stars" width="28" />
						</div>

						<p
							class="mt-5 font-PlayFair text-2xl font-bold text-slate-700 sm:text-3xl"
						>
							La ciencia de la calma
					</p>

						<p
							class="mt-4 text-sm leading-7 text-slate-600 sm:text-base"
						>
							Seleccionamos rituales coreanos que combinan
							tecnología clínica avanzada con ingredientes
							botánicos ancestrales.
						</p>
					</div>

					<div class="min-h-64 overflow-hidden md:min-h-80">
						<img
							src="/planta.png"
							alt="Ingredientes botánicos utilizados en skincare"
							class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
						/>
					</div>
				</div>
			</article>

	
			<article
				class="flex min-h-72 flex-col items-center justify-center rounded-3xl bg-blue-50 p-7 text-center text-indigo-950 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl sm:p-10"
			>
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full bg-white/80"
				>
					<Icon icon="mdi:medal-outline" width="30" />
				</div>

				<p
					class="mt-5 font-PlayFair text-2xl font-bold sm:text-3xl"
				>
					Curaduría exclusiva
            </p>

				<p
					class="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg"
				>
					Solo seleccionamos marcas que cumplen con altos estándares
					de K-Beauty, calidad, innovación y sostenibilidad.
				</p>
			</article>

		
			<article
				class="flex min-h-64 flex-col justify-center rounded-3xl bg-blue-50 p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl sm:p-10"
			>
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-slate-700"
				>
					<Icon icon="mdi:truck-outline" width="28" />
				</div>

				<p
					class="mt-5 font-PlayFair text-2xl font-bold text-slate-700 sm:text-3xl"
				>
					Envío directo
			</p>

				<p
					class="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg"
				>
					Logística optimizada para que tu ritual no se detenga.
					Productos cuidadosamente preparados hasta llegar a tu
					puerta.
				</p>
			</article>

		
			<article
				class="group relative min-h-105 overflow-hidden rounded-3xl bg-slate-700 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl sm:min-h-115 lg:min-h-80"
			>
				<img
					src="/Agua.png"
					alt="Rutina de cuidado para una piel luminosa"
					class="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105"
				/>

				<div
					class="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-800/55 to-transparent lg:bg-linear-to-r"
				></div>

				<div
					class="relative flex h-full min-h-105 flex-col justify-end p-7 text-white sm:min-h-115 sm:p-10 lg:min-h-80 lg:max-w-xl lg:justify-center"
				>
					<p class="font-PlayFair text-3xl font-bold sm:text-4xl">
						Luminous Serenity
					</p>

					<p
						class="mt-4 text-sm leading-7 text-white/85 sm:text-base lg:text-lg"
					>
						Descubre el brillo que nace desde adentro con productos
						diseñados para nutrir no solo tu piel, sino también tu
						bienestar diario.
					</p>

					<a
						href="/products"
						class="mt-6 inline-flex w-fit items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-sky-100"
					>
						Saber más
					</a>
				</div>
			</article>
		</div>
	</div>
</section>