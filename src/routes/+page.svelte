<script lang="ts">
	import { onMount, untrack } from "svelte";
	import Tarjeta from "$lib/components/tarjeta.svelte";
	import Icon from "@iconify/svelte";

	let { data } = $props();

	// Las publicaciones de Instagram y los logos de marcas se administran
	// desde el panel y llegan resueltos desde el servidor.
	const publicacionesInstagram = $derived(data.publicacionesInstagram ?? []);
	const logos = $derived(data.marcas ?? []);

	// Textos editables del hero y de "Nuestra esencia".
	const textos = $derived(data.configuracionPortada);

	// Testimonios y enlaces al perfil de Google, todos administrables.
	const testimonios = $derived(data.testimonios ?? []);
	const enlaceResena = $derived(
		data.configuracionContacto?.googleResenaUrl ?? "",
	);
	const enlacePerfilGoogle = $derived(
		data.configuracionContacto?.googlePerfilUrl ?? "",
	);

	// Referencias para las animaciones de scroll de esta vista (una por
	// sección, con efectos distintos entre sí para que no se repitan).
	let encabezadoFavoritos = $state<HTMLDivElement | null>(null);
	let carruselFavoritosWrap = $state<HTMLDivElement | null>(null);
	let seccionMarcas = $state<HTMLElement | null>(null);
	let encabezadoInstagramTexto = $state<HTMLDivElement | null>(null);
	let botonInstagramSeguir = $state<HTMLAnchorElement | null>(null);
	let carruselInstagramWrap = $state<HTMLDivElement | null>(null);
	let encabezadoTestimonios = $state<HTMLDivElement | null>(null);
	let grillaTestimonios = $state<HTMLDivElement | null>(null);
	let encabezadoEsencia = $state<HTMLDivElement | null>(null);
	let grillaEsencia = $state<HTMLDivElement | null>(null);

	const INSTAGRAM_URL = "https://www.instagram.com/moonbeauty.val/";

	// Solo se necesita el valor inicial, para arrancar el carrusel
	// centrado; untrack deja claro que la lectura no debe ser reactiva.
	const indiceInicialInstagram = untrack(() =>
		Math.floor(((data.publicacionesInstagram ?? []).length - 1) / 2),
	);

	let pistaInstagram = $state<HTMLDivElement | null>(null);
	let indiceActivoInstagram = $state(indiceInicialInstagram);
	let paddingInstagram = $state(0);
	let centradoInicialInstagram = false;
	let sonidoActivo = $state<Record<number, boolean>>({});
	let reproduciendo = $state<Record<number, boolean>>({});
	let videosInstagram: Record<number, HTMLVideoElement> = {};
	let slideActivoPorPost = $state<Record<number, number>>({});

	function slideActual(indice: number) {
		return slideActivoPorPost[indice] ?? 0;
	}

	function cambiarSlide(
		evento: MouseEvent,
		indice: number,
		direccion: 1 | -1,
		totalSlides: number,
	) {
		evento.preventDefault();
		evento.stopPropagation();
		const actual = slideActual(indice);
		slideActivoPorPost[indice] = Math.max(
			0,
			Math.min(totalSlides - 1, actual + direccion),
		);
	}

	function actualizarIndiceInstagram() {
		if (!pistaInstagram) return;
		const item = pistaInstagram.querySelector<HTMLElement>("[data-ig-item]");
		if (!item) return;
		const paso = item.offsetWidth + 20;
		// El padding lateral solo existe para que el primer/último post
		// puedan llegar a quedar centrados; la posición de scroll que
		// centra al post i es siempre i * paso (el padding se cancela).
		indiceActivoInstagram = Math.round(pistaInstagram.scrollLeft / paso);
	}

	function actualizarPaddingInstagram() {
		if (!pistaInstagram) return;
		const item = pistaInstagram.querySelector<HTMLElement>("[data-ig-item]");
		if (!item) return;
		paddingInstagram = Math.max(
			0,
			(pistaInstagram.clientWidth - item.offsetWidth) / 2,
		);
	}

	function irAInstagram(indice: number, comportamiento: ScrollBehavior = "smooth") {
		if (!pistaInstagram) return;
		const item = pistaInstagram.querySelector<HTMLElement>("[data-ig-item]");
		const paso = item ? item.offsetWidth + 20 : pistaInstagram.clientWidth;
		pistaInstagram.scrollTo({
			left: paso * indice,
			behavior: comportamiento,
		});
	}

	$effect(() => {
		if (!pistaInstagram) return;
		actualizarPaddingInstagram();

		if (!centradoInicialInstagram) {
			centradoInicialInstagram = true;
			// Arranca ya centrado en el post de en medio, sin animación.
			// Se espera a que el padding recién calculado se aplique al
			// DOM (y el navegador reacomode los puntos de snap) antes de
			// mover el scroll, si no el snap nativo puede "corregir" el
			// scroll hacia otro post distinto justo después.
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					irAInstagram(indiceInicialInstagram, "instant");
				});
			});
		}

		const resize = () => actualizarPaddingInstagram();
		window.addEventListener("resize", resize);
		return () => window.removeEventListener("resize", resize);
	});

	// Solo reproduce (y por lo tanto solo descarga) el video de Instagram
	// que está centrado/activo en el carrusel; los demás se quedan
	// pausados en su miniatura para no gastar ancho de banda.
	$effect(() => {
		const activo = indiceActivoInstagram;
		for (const [clave, video] of Object.entries(videosInstagram)) {
			if (Number(clave) === activo) {
				video.play().catch(() => {});
			} else {
				video.pause();
			}
		}
	});

	function alternarReproduccion(indice: number) {
		const video = videosInstagram[indice];
		if (!video) return;

		if (video.paused) {
			video.play();
		} else {
			video.pause();
		}
	}

	// "New arrivals": los productos que se marcaron como nuevo ingreso en
	// el panel. Si todavía no hay ninguno marcado, se muestran los 12 más
	// recientes, para que la sección nunca quede vacía.
	const nuevosProductos = $derived.by(() => {
		const todos = data.productos ?? [];
		const marcados = todos.filter((producto) => producto.nuevoIngreso);

		if (marcados.length > 0) {
			return [...marcados].sort(
				(a, b) => b.fechaCreacion - a.fechaCreacion,
			);
		}

		return [...todos]
			.sort((a, b) => b.fechaCreacion - a.fechaCreacion)
			.slice(0, 12);
	});

	let pista = $state<HTMLDivElement | null>(null);
	let alInicio = $state(true);
	let alFinal = $state(false);

	function actualizarLimites() {
		if (!pista) return;
		alInicio = pista.scrollLeft <= 1;
		alFinal =
			pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 1;
	}

	function desplazar(direccion: 1 | -1) {
		if (!pista) return;
		const item = pista.querySelector<HTMLElement>("[data-item]");
		const paso = item ? item.offsetWidth + 20 : pista.clientWidth;
		pista.scrollBy({ left: paso * direccion, behavior: "smooth" });
	}

	$effect(() => {
		void nuevosProductos;
		void pista;
		const id = requestAnimationFrame(actualizarLimites);
		return () => cancelAnimationFrame(id);
	});

	const estado = $state<{
		elementoAnimado: null | HTMLElement;
	}>({
		elementoAnimado: null,
	});

	// Animaciones de scroll de la vista de inicio: cada sección aparece
	// con un efecto distinto (no se repite el mismo en todas) a medida
	// que se hace scroll hacia ella. El hero no anima porque ya se ve
	// completo apenas carga la página.
	onMount(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}

		// gsap/ScrollTrigger es CommonJS y en el servidor (SSR en Vercel)
		// Node no puede resolver su named export vía import estático. Como
		// esta animación solo tiene sentido en el navegador, se carga de
		// forma dinámica aquí adentro, que nunca corre en el servidor.
		let cancelado = false;
		let limpiar: (() => void) | undefined;

		Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
			([{ gsap }, { ScrollTrigger }]) => {
				if (cancelado) return;
				gsap.registerPlugin(ScrollTrigger);

		const animaciones: Array<{ scrollTrigger?: { kill: () => void } | null }> = [];

		// "Favoritos de temporada": el encabezado sube con fade, y el
		// carrusel de productos sube un poco después con un leve zoom-in.
		if (encabezadoFavoritos) {
			animaciones.push(
				gsap.from(encabezadoFavoritos, {
					opacity: 0,
					y: 50,
					duration: 0.8,
					ease: "power3.out",
					scrollTrigger: {
						trigger: encabezadoFavoritos,
						start: "top 88%",
						once: true,
					},
				}),
			);
		}

		if (carruselFavoritosWrap) {
			animaciones.push(
				gsap.from(carruselFavoritosWrap, {
					opacity: 0,
					y: 70,
					scale: 0.96,
					duration: 0.9,
					delay: 0.15,
					ease: "power3.out",
					scrollTrigger: {
						trigger: carruselFavoritosWrap,
						start: "top 90%",
						once: true,
					},
				}),
			);
		}

		// "Marcas que amamos": aparece con un zoom suave desde adentro.
		if (seccionMarcas) {
			animaciones.push(
				gsap.from(seccionMarcas, {
					opacity: 0,
					scale: 0.88,
					duration: 1,
					ease: "power2.out",
					scrollTrigger: {
						trigger: seccionMarcas,
						start: "top 85%",
						once: true,
					},
				}),
			);
		}

		// "Nuestro Instagram": el texto entra desde la izquierda y el
		// botón desde la derecha, como si se encontraran; el carrusel
		// aparece con fade + zoom un momento después.
		if (encabezadoInstagramTexto) {
			animaciones.push(
				gsap.from(encabezadoInstagramTexto, {
					opacity: 0,
					x: -90,
					duration: 0.8,
					ease: "power3.out",
					scrollTrigger: {
						trigger: encabezadoInstagramTexto,
						start: "top 88%",
						once: true,
					},
				}),
			);
		}

		if (botonInstagramSeguir) {
			animaciones.push(
				gsap.from(botonInstagramSeguir, {
					opacity: 0,
					x: 90,
					duration: 0.8,
					ease: "power3.out",
					scrollTrigger: {
						trigger: botonInstagramSeguir,
						start: "top 88%",
						once: true,
					},
				}),
			);
		}

		if (carruselInstagramWrap) {
			animaciones.push(
				gsap.from(carruselInstagramWrap, {
					opacity: 0,
					scale: 0.9,
					duration: 0.9,
					delay: 0.2,
					ease: "power2.out",
					scrollTrigger: {
						trigger: carruselInstagramWrap,
						start: "top 90%",
						once: true,
					},
				}),
			);
		}

		// Testimonios: el encabezado sube con fade y las tarjetas
		// aparecen escalonadas, una detrás de otra.
		if (encabezadoTestimonios) {
			animaciones.push(
				gsap.from(encabezadoTestimonios, {
					opacity: 0,
					y: 30,
					duration: 0.7,
					ease: "power3.out",
					scrollTrigger: {
						trigger: encabezadoTestimonios,
						start: "top 88%",
						once: true,
					},
				}),
			);
		}

		if (grillaTestimonios) {
			const tarjetas = Array.from(
				grillaTestimonios.children,
			) as HTMLElement[];

			if (tarjetas.length) {
				animaciones.push(
					gsap.from(tarjetas, {
						opacity: 0,
						y: 40,
						duration: 0.7,
						ease: "power3.out",
						stagger: 0.12,
						scrollTrigger: {
							trigger: grillaTestimonios,
							start: "top 88%",
							once: true,
						},
					}),
				);
			}
		}

		// "Nuestra esencia": el título cae desde arriba y las 4 tarjetas
		// entran en diagonal (como en /products), con un leve giro extra
		// para diferenciarla del resto de las animaciones de esta vista.
		if (encabezadoEsencia) {
			animaciones.push(
				gsap.from(encabezadoEsencia, {
					opacity: 0,
					y: -40,
					duration: 0.7,
					ease: "power3.out",
					scrollTrigger: {
						trigger: encabezadoEsencia,
						start: "top 88%",
						once: true,
					},
				}),
			);
		}

		let triggersEsencia: ScrollTrigger[] = [];

		if (grillaEsencia) {
			const tarjetas = Array.from(
				grillaEsencia.children,
			) as HTMLElement[];

			if (tarjetas.length) {
				gsap.set(tarjetas, { opacity: 0, x: -30, y: 60, rotate: -3 });

				triggersEsencia = ScrollTrigger.batch(tarjetas, {
					start: "top 90%",
					once: true,
					onEnter: (lote) => {
						gsap.to(lote, {
							opacity: 1,
							x: 0,
							y: 0,
							rotate: 0,
							duration: 0.8,
							ease: "power3.out",
							stagger: 0.12,
						});
					},
				});
			}
		}

				limpiar = () => {
					animaciones.forEach((tween) => tween.scrollTrigger?.kill());
					triggersEsencia.forEach((trigger) => trigger.kill());
				};
			},
		);

		return () => {
			cancelado = true;
			limpiar?.();
		};
	});
</script>

<svelte:head>
	<title>Moon Beauty · Skincare coreano en Venezuela</title>
</svelte:head>

<section
	class="isolate relative flex min-h-[calc(100svh-5rem)] items-center justify-center overflow-hidden px-4 py-20 sm:px-6 lg:min-h-[calc(100svh-6rem)] lg:px-8"
>
	<img
		src="/fondo.webp"
		alt=""
		aria-hidden="true"
		class="absolute -top-30 left-0 -z-10 h-[calc(100%+7.5rem)] w-full object-cover lg:-top-34 lg:h-[calc(100%+8.5rem)]"
	/>
	

	<div class="mx-auto w-full px-8 lg:px-12">
		<p class="text-sky-200 font-Manrope text-lg">{textos.heroEtiqueta}</p>

		<!-- whitespace-pre-line respeta los saltos de línea que se escriban
		en el panel, que es lo que parte el título en dos renglones. -->
		<p
			class="font-Manrope my-4 whitespace-pre-line text-5xl leading-none text-slate-600 sm:text-6xl md:text-7xl lg:text-8xl 2xl:text-9xl"
		>
			{textos.heroTitulo}
		</p>

		<p
			class="mt-5 max-w-2xl font-Manrope text-lg text-slate-600 sm:text-xl md:text-2xl lg:text-3xl"
		>
			{textos.heroSubtitulo}
		</p>

		<a
			class="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-sky-200 px-8 py-3 font-Manrope text-base font-semibold text-slate-600 transition duration-300 hover:-translate-y-1 hover:bg-slate-600 hover:text-white hover:shadow-lg sm:px-10 sm:text-lg lg:px-12"
			href="/products"
		>
			{textos.heroBoton}
		</a>
	</div>
</section>

<section class="bg-gray-50 py-12 sm:py-16 lg:py-20 2xl:py-24">
	<div
		class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px]"
	>
		<p
			class="font-Manrope text-sm font-bold uppercase tracking-[0.2em] text-sky-700 sm:text-base"
		>
			New arrivals
		</p>

		<div
			bind:this={encabezadoFavoritos}
			class="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
		>

			<a
				class="inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-sky-200 px-6 py-3 font-Manrope text-sm font-semibold text-slate-600 transition duration-300 hover:bg-slate-600 hover:text-white sm:text-base"
				href="/products"
			>
				Ver todos
			</a>
		</div>

		<div bind:this={carruselFavoritosWrap} class="relative mt-10">
			<button
				type="button"
				onclick={() => desplazar(-1)}
				disabled={alInicio}
				aria-label="Producto anterior"
				class="absolute -left-3 top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:scale-110 hover:bg-sky-100 active:scale-95 disabled:pointer-events-none disabled:opacity-0 lg:flex lg:-left-5"
			>
				<Icon icon="material-symbols:chevron-left-rounded" width="28" />
			</button>

			<div
				bind:this={pista}
				onscroll={actualizarLimites}
				class="pista-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-webkit-overflow-scrolling:touch]"
			>
				{#each nuevosProductos as producto (producto.id)}
					<div
						data-item
						class="w-[calc((100%-1.25rem)/2)] shrink-0 snap-start lg:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)]"
					>
						<Tarjeta
							{...producto}
							tasaBCV={data?.tasaBCV?.promedio ?? null}
							etiquetaSuperior="marca"
						/>
					</div>
				{/each}
			</div>

			<button
				type="button"
				onclick={() => desplazar(1)}
				disabled={alFinal}
				aria-label="Producto siguiente"
				class="absolute -right-3 top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:scale-110 hover:bg-sky-100 active:scale-95 disabled:pointer-events-none disabled:opacity-0 lg:flex lg:-right-5"
			>
				<Icon icon="material-symbols:chevron-right-rounded" width="28" />
			</button>
		</div>
	</div>
</section>

<section
	bind:this={seccionMarcas}
	class="overflow-hidden bg-white py-12 sm:py-16 lg:py-20 2xl:py-24"
>
	<p
		class="mb-10 text-center font-Manrope text-sm font-bold uppercase tracking-[0.2em] text-sky-700 sm:text-base lg:mb-14"
	>
		Marcas que amamos
	</p>

	<div class="marquee">
		<div class="marquee__track">
			{#each [...logos, ...logos] as logo}
				<div
					class="flex h-24 w-40 shrink-0 items-center justify-center px-6 sm:h-28 sm:w-48 sm:px-8"
				>
					<img
						src={logo.imagen}
						alt={logo.nombre}
						class="w-auto max-w-full object-contain"
						style="max-height: {logo.alto}"
						loading="lazy"
					/>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="bg-white py-12 sm:py-16 lg:py-20 2xl:py-24">
	<div
		class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px]"
	>
		<div
			class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
		>
			<div bind:this={encabezadoInstagramTexto}>
				<p
					class="font-Manrope text-sm font-bold uppercase tracking-[0.2em] text-sky-700"
				>
					Síguenos
				</p>
				<p
					class="mt-2 font-Manrope text-3xl text-slate-700 sm:text-4xl lg:text-5xl"
				>
					Nuestro Instagram
				</p>
			</div>

			<a
				bind:this={botonInstagramSeguir}
				href={INSTAGRAM_URL}
				target="_blank"
				rel="noreferrer"
				class="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-full bg-sky-200 px-6 py-3 font-Manrope text-sm font-semibold text-slate-600 transition duration-300 hover:bg-slate-600 hover:text-white sm:text-base"
			>
				<Icon icon="mdi:instagram" width="20" />
				Síguenos en Instagram
			</a>
		</div>

		{#if publicacionesInstagram.length > 0}
			<div bind:this={carruselInstagramWrap} class="relative mt-10">
				<button
					type="button"
					onclick={() => irAInstagram(Math.max(0, indiceActivoInstagram - 1))}
					disabled={indiceActivoInstagram === 0}
					aria-label="Publicación anterior"
					class="absolute left-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:scale-110 hover:bg-sky-100 active:scale-95 disabled:pointer-events-none disabled:opacity-0 sm:left-2 lg:left-4"
				>
					<Icon icon="material-symbols:chevron-left-rounded" width="28" />
				</button>

				<div
					bind:this={pistaInstagram}
					onscroll={actualizarIndiceInstagram}
					style="padding-left:{paddingInstagram}px; padding-right:{paddingInstagram}px;"
					class="pista-scroll flex snap-x snap-mandatory items-center gap-5 overflow-x-auto scroll-smooth py-6"
				>
					{#each publicacionesInstagram as post, indice (post.permalink)}
						{@const activo = indiceActivoInstagram === indice}
						{@const slide = slideActual(indice)}
						<div
							data-ig-item
							class="relative shrink-0 snap-center transition-all duration-300"
							class:scale-110={activo}
							class:z-10={activo}
							class:opacity-60={!activo}
						>
							<a
								href={post.permalink}
								target="_blank"
								rel="noreferrer"
								class="group relative block aspect-9/16 w-44 overflow-hidden rounded-3xl bg-slate-100 shadow-lg sm:w-48 lg:w-56 xl:w-72 2xl:w-80"
							>
								{#if post.tipo === "video"}
									<video
										bind:this={videosInstagram[indice]}
										src={post.archivos[0]}
										poster={post.miniatura}
										muted={!sonidoActivo[indice]}
										preload="none"
										loop
										playsinline
										class="h-full w-full object-cover"
										onplay={() => (reproduciendo[indice] = true)}
										onpause={() => (reproduciendo[indice] = false)}
									></video>
								{:else}
									{#each post.archivos as foto, indiceFoto}
										<img
											src={foto}
											alt="Publicación de Moon Beauty en Instagram"
											loading="lazy"
											class="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
											class:opacity-100={indiceFoto === slide}
											class:opacity-0={indiceFoto !== slide}
										/>
									{/each}
								{/if}

								{#if post.tipo === "video"}
									<button
										type="button"
										aria-label={!reproduciendo[indice]
											? "Reproducir"
											: "Pausar"}
										onclick={(evento) => {
											evento.preventDefault();
											alternarReproduccion(indice);
										}}
										class="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 backdrop-blur-sm transition hover:bg-white"
									>
										<Icon
											icon={!reproduciendo[indice]
												? "material-symbols:play-arrow-rounded"
												: "material-symbols:pause-rounded"}
											width="20"
										/>
									</button>

									<button
										type="button"
										aria-label={sonidoActivo[indice] ? "Silenciar" : "Activar sonido"}
										onclick={(evento) => {
											evento.preventDefault();
											sonidoActivo[indice] = !sonidoActivo[indice];
										}}
										class="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 backdrop-blur-sm transition hover:bg-white"
									>
										<Icon
											icon={sonidoActivo[indice]
												? "material-symbols:volume-up-rounded"
												: "material-symbols:volume-off-rounded"}
											width="20"
										/>
									</button>
								{:else if post.archivos.length > 1}
									<button
										type="button"
										aria-label="Foto anterior de esta publicación"
										disabled={slide === 0}
										onclick={(evento) =>
											cambiarSlide(evento, indice, -1, post.archivos.length)}
										class="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 backdrop-blur-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-0"
									>
										<Icon
											icon="material-symbols:chevron-left-rounded"
											width="18"
										/>
									</button>

									<button
										type="button"
										aria-label="Siguiente foto de esta publicación"
										disabled={slide === post.archivos.length - 1}
										onclick={(evento) =>
											cambiarSlide(evento, indice, 1, post.archivos.length)}
										class="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 backdrop-blur-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-0"
									>
										<Icon
											icon="material-symbols:chevron-right-rounded"
											width="18"
										/>
									</button>

									<div
										class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1"
									>
										{#each post.archivos as _, indiceFoto}
											<span
												class="h-1.5 w-1.5 rounded-full transition-colors {indiceFoto ===
												slide
													? 'bg-white'
													: 'bg-white/40'}"
											></span>
										{/each}
									</div>
								{/if}

								<Icon
									icon="mdi:instagram"
									width="20"
									class="absolute right-3 top-3 text-white drop-shadow"
								/>
							</a>
						</div>
					{/each}
				</div>

				<button
					type="button"
					onclick={() =>
						irAInstagram(
							Math.min(
								publicacionesInstagram.length - 1,
								indiceActivoInstagram + 1,
							),
						)}
					disabled={indiceActivoInstagram === publicacionesInstagram.length - 1}
					aria-label="Publicación siguiente"
					class="absolute right-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:scale-110 hover:bg-sky-100 active:scale-95 disabled:pointer-events-none disabled:opacity-0 sm:right-2 lg:right-4"
				>
					<Icon icon="material-symbols:chevron-right-rounded" width="28" />
				</button>

				{#if publicacionesInstagram.length > 1}
					<div class="mt-3 flex items-center justify-center gap-2">
						{#each publicacionesInstagram as _, indice}
							<button
								type="button"
								aria-label={`Ir a la publicación ${indice + 1}`}
								onclick={() => irAInstagram(indice)}
								class="h-2 rounded-full transition-all"
								class:w-6={indiceActivoInstagram === indice}
								class:bg-sky-500={indiceActivoInstagram === indice}
								class:w-2={indiceActivoInstagram !== indice}
								class:bg-slate-300={indiceActivoInstagram !== indice}
							></button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</section>

{#if testimonios.length > 0 || enlaceResena}
	<section class="bg-white py-12 sm:py-16 lg:py-20 2xl:py-24">
		<div
			class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px]"
		>
			<div
				bind:this={encabezadoTestimonios}
				class="mx-auto mb-10 max-w-3xl text-center lg:mb-14"
			>
				<p
					class="font-Manrope text-sm font-bold uppercase tracking-[0.2em] text-sky-700"
				>
					Lo que dicen de nosotras
				</p>

				<p
					class="mt-3 font-Manrope text-3xl text-slate-700 sm:text-4xl lg:text-5xl"
				>
					Clientas que ya brillan
				</p>
			</div>

			{#if testimonios.length > 0}
				<div
					bind:this={grillaTestimonios}
					class="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
				>
					{#each testimonios as testimonio (testimonio.id)}
						<article
							class="flex h-full flex-col rounded-2xl bg-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-8"
						>
							<div
								class="flex gap-0.5 text-amber-400"
								aria-label="{testimonio.estrellas} de 5 estrellas"
							>
								{#each Array(5) as _, indice}
									<Icon
										icon={indice < testimonio.estrellas
											? "material-symbols:star-rounded"
											: "material-symbols:star-outline-rounded"}
										width="20"
									/>
								{/each}
							</div>

							<p
								class="mt-4 flex-1 text-sm leading-7 text-slate-600 sm:text-base"
							>
								{testimonio.texto}
							</p>

							<p
								class="mt-5 font-Manrope font-bold text-slate-700"
							>
								{testimonio.nombre}
							</p>
						</article>
					{/each}
				</div>
			{/if}

			<div
				class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
			>
				{#if enlaceResena}
					<a
						href={enlaceResena}
						target="_blank"
						rel="noreferrer"
						class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-sky-200 px-8 py-3 font-Manrope text-base font-semibold text-slate-600 transition duration-300 hover:-translate-y-1 hover:bg-slate-600 hover:text-white sm:w-auto"
					>
						<Icon icon="material-symbols:star-rounded" width="20" />
						Déjanos tu reseña
					</a>
				{/if}

				{#if enlacePerfilGoogle}
					<a
						href={enlacePerfilGoogle}
						target="_blank"
						rel="noreferrer"
						class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-8 py-3 font-Manrope text-base font-semibold text-slate-600 ring-1 ring-slate-300 transition duration-300 hover:bg-slate-100 sm:w-auto"
					>
						Ver todas en Google
					</a>
				{/if}
			</div>
		</div>
	</section>
{/if}

<section class="bg-slate-50 py-12 sm:py-16 lg:py-20 2xl:py-24">
	<div
		class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px]"
	>
		<div
			bind:this={encabezadoEsencia}
			class="mx-auto mb-10 max-w-3xl text-center lg:mb-14"
		>
			<p
				class="font-Manrope text-sm font-bold uppercase tracking-[0.2em] text-sky-700"
			>
				{textos.esenciaEtiqueta}
			</p>

			<p
				class="mt-3 font-Manrope text-3xl text-slate-700 sm:text-4xl lg:text-5xl"
			>
				{textos.esenciaTitulo}
			</p>
		</div>

		<div bind:this={grillaEsencia} class="grid grid-cols-2 gap-3 sm:gap-5">
			<article
				class="group overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl sm:rounded-3xl"
			>
				<div
					class="grid h-full grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
				>
					<div
						class="flex flex-col justify-center p-4 sm:p-8 lg:p-10"
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-slate-700 sm:h-12 sm:w-12"
						>
							<Icon icon="mdi:stars" width="24" />
						</div>

						<p
							class="mt-3 font-Manrope text-lg font-bold text-slate-700 sm:mt-5 sm:text-2xl lg:text-3xl"
						>
							{textos.esencia1Titulo}
						</p>

						<p
							class="mt-2 text-xs leading-6 text-slate-600 sm:mt-4 sm:text-sm sm:leading-7 lg:text-base"
						>
							{textos.esencia1Texto}
						</p>
					</div>

					<div class="min-h-40 overflow-hidden sm:min-h-64 md:min-h-80">
						<img
							src="/planta.webp"
							alt="Ingredientes botánicos utilizados en skincare"
							class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
						/>
					</div>
				</div>
			</article>

			<article
				class="flex min-h-52 flex-col items-center justify-center rounded-2xl bg-blue-50 p-4 text-center text-indigo-950 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl sm:min-h-72 sm:rounded-3xl sm:p-10"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 sm:h-14 sm:w-14"
				>
					<Icon icon="mdi:medal-outline" width="24" />
				</div>

				<p class="mt-3 font-Manrope text-base font-bold sm:mt-5 sm:text-2xl lg:text-3xl">
					{textos.esencia2Titulo}
				</p>

				<p
					class="mt-2 max-w-xl text-xs leading-6 text-slate-600 sm:mt-4 sm:text-sm sm:leading-7 lg:text-lg"
				>
					{textos.esencia2Texto}
				</p>
			</article>

			<article
				class="flex min-h-52 flex-col justify-center rounded-2xl bg-blue-50 p-4 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl sm:min-h-64 sm:rounded-3xl sm:p-10"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-700 sm:h-12 sm:w-12"
				>
					<Icon icon="mdi:truck-outline" width="24" />
				</div>

				<p
					class="mt-3 font-Manrope text-base font-bold text-slate-700 sm:mt-5 sm:text-2xl lg:text-3xl"
				>
					{textos.esencia3Titulo}
				</p>

				<p
					class="mt-2 max-w-xl text-xs leading-6 text-slate-600 sm:mt-4 sm:text-sm sm:leading-7 lg:text-lg"
				>
					{textos.esencia3Texto}
				</p>
			</article>

			<article
				class="group relative min-h-64 overflow-hidden rounded-2xl bg-slate-700 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl sm:min-h-105 sm:rounded-3xl lg:min-h-80"
			>
				<img
					src="/Agua.webp"
					alt="Rutina de cuidado para una piel luminosa"
					class="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105"
				/>

				<div
					class="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-800/55 to-transparent lg:bg-linear-to-r"
				></div>

				<div
					class="relative flex h-full min-h-64 flex-col justify-end p-4 text-white sm:min-h-105 sm:p-10 lg:min-h-80 lg:max-w-xl lg:justify-center"
				>
					<p class="font-Manrope text-xl font-bold sm:text-4xl">
						{textos.esencia4Titulo}
					</p>

					<p
						class="mt-2 text-xs leading-6 text-white/85 sm:mt-4 sm:text-base sm:leading-7 lg:text-lg"
					>
						{textos.esencia4Texto}
					</p>

					<a
						href="/products"
						class="mt-4 inline-flex w-fit items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-100 sm:mt-6 sm:px-6 sm:py-3 sm:text-base"
					>
						{textos.esencia4Boton}
					</a>
				</div>
			</article>
		</div>
	</div>
</section>


<style>
	.pista-scroll {
		scrollbar-width: none;
	}

	.pista-scroll::-webkit-scrollbar {
		display: none;
	}

	.marquee {
		width: 100%;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(
			to right,
			transparent,
			#000 8%,
			#000 92%,
			transparent
		);
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 8%,
			#000 92%,
			transparent
		);
	}

	.marquee__track {
		display: flex;
		width: max-content;
		animation: marquee-scroll 35s linear infinite;
	}

	@keyframes marquee-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.marquee__track {
			animation: none;
		}
	}
</style>
