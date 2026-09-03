<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import Icon from "@iconify/svelte";
	import { cantidadCarrito } from "$lib/cart";
	import { usuario, autenticacionCargando } from "$lib/auth";
	import { esAdmin } from "$lib/admin";
	import { signOut } from "firebase/auth";
	import { auth } from "$lib/firebase";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { fade } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import Lenis from "lenis";
	// @ts-ignore
	import CartDrawer from "$lib/components/CartDrawer.svelte";
	import { onMount } from "svelte";

	let { children, data } = $props();

	type Producto = {
		id?: string | number;
		Nombre: string;
		Tipo: string;
		marca?: string | null;
		imagen?: string | null;
		precio?: number | string | null;
		especificacion?: string | null;
	};

	type LayoutDataConProductos = {
		products?: Producto[];
		productos?: Producto[];
		[key: string]: unknown;
	};

	const layoutData = $derived(data as LayoutDataConProductos | undefined);
	const productosLayout = $derived.by(() => {
		const currentLayoutData = layoutData;

		return Array.isArray(currentLayoutData?.products)
			? (currentLayoutData.products as Producto[])
			: Array.isArray(currentLayoutData?.productos)
				? (currentLayoutData.productos as Producto[])
				: [];
	});

	let menuAbierto = $state(false);
	let carritoAbierto = $state(false);

	let buscadorAbierto = $state(false);
	let textoBusqueda = $state("");

	const productosEncontrados = $derived(
		textoBusqueda.trim().length === 0
			? []
			: productosLayout
					.filter((producto) => {
						const texto = textoBusqueda.trim().toLowerCase();

						const nombre = producto.Nombre?.toLowerCase() ?? "";
						const tipo = producto.Tipo?.toLowerCase() ?? "";
						const marca = producto.marca?.toLowerCase() ?? "";
						const especificacion =
							producto.especificacion?.toLowerCase() ?? "";

						return (
							nombre.includes(texto) ||
							tipo.includes(texto) ||
							marca.includes(texto) ||
							especificacion.includes(texto)
						);
					})
					.slice(0, 6),
	);

	function abrirBuscador() {
		cerrarMenu();
		buscadorAbierto = true;
	}

	function cerrarBuscador() {
		buscadorAbierto = false;
		textoBusqueda = "";
	}

	function alternarBuscador() {
		if (buscadorAbierto) {
			cerrarBuscador();
		} else {
			abrirBuscador();
		}
	}

	function manejarTeclado(event: KeyboardEvent) {
		if (event.key === "Escape") {
			cerrarBuscador();
		}
	}

	function alternarMenu() {
		menuAbierto = !menuAbierto;
	}

	function cerrarMenu() {
		menuAbierto = false;
	}

	function abrirCarrito() {
		cerrarMenu();
		carritoAbierto = true;
	}

	function cerrarCarrito() {
		carritoAbierto = false;
	}

	$effect(() => {
		if (typeof document === "undefined") {
			return;
		}

		document.body.style.overflow = carritoAbierto ? "hidden" : "";

		return () => {
			document.body.style.overflow = "";
		};
	});

	async function cerrarSesion() {
		await signOut(auth);
		await goto("/");
	}

	onMount(() => {
		const lenis = new Lenis({
			autoRaf: true,
		});
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="sticky top-0 z-50">
	<div class="cupon-marquee bg-slate-500/80 py-2 text-white">
		<div class="cupon-marquee__track">
			{#each Array(6) as _, copia (copia)}
				<p
					class="mx-10 shrink-0 whitespace-nowrap text-xs font-semibold sm:mx-14 sm:text-sm"
				>
					20% de descuento para pagos en $ con el código <strong>MOON20</strong>.
					Aplica para pagos en Efectivo $, Binance, Zelle y Zinli.
				</p>
			{/each}
		</div>
	</div>

	<header class="bg-white/60 backdrop-blur-md px-16">
	<div
		class="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-24 lg:px-8 2xl:max-w-[1600px]"
	>
		<a
			href="/"
			aria-label="Ir al inicio"
			onclick={cerrarMenu}
			class="shrink-0"
		>
			<img
				src="/logo.webp"
				alt="Moon Beauty"
				class="h-auto w-20 sm:w-24 lg:w-30"
			/>
		</a>

		<nav
			aria-label="Navegación principal"
			class="hidden items-center gap-8 lg:flex xl:gap-12"
		>
			<a
				href="/"
				class="font-BeVietnam font-bold text-slate-500 transition-all duration-300 hover:-translate-y-1 hover:text-slate-800 hover:underline"
			>
				Inicio
			</a>

			<a
				href="/products"
				class="font-BeVietnam font-bold text-slate-500 transition-all duration-300 hover:-translate-y-1 hover:text-slate-800 hover:underline"
			>
				Productos
			</a>
		</nav>

		<div class="flex items-center gap-2 sm:gap-4 lg:gap-5">
			<button
				type="button"
				aria-label={buscadorAbierto
					? "Cerrar buscador"
					: "Abrir buscador"}
				aria-expanded={buscadorAbierto}
				onclick={alternarBuscador}
				class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
			>
				<Icon
					icon={buscadorAbierto
						? "material-symbols:close-rounded"
						: "material-symbols:search"}
					width="24"
				/>
			</button>

			{#if !$autenticacionCargando}
				{#if $usuario && !$usuario.isAnonymous}
					<div class="flex items-center gap-3">
						{#if $esAdmin}
							<a
								href="/admin"
								class="flex items-center gap-2 rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
							>
								<Icon
									icon="material-symbols:admin-panel-settings-outline"
									width="20"
								/>

								<span class="hidden lg:inline">Admin</span>
							</a>
						{/if}

						<a
							href="/account"
							class="flex items-center gap-2 text-sm text-slate-600"
						>
							<Icon
								icon="material-symbols:account-circle-outline"
								width="25"
							/>

							<span class="hidden lg:inline">
								{$usuario.displayName ?? "Mi cuenta"}
							</span>
						</a>

						<button
							type="button"
							onclick={cerrarSesion}
							class="text-sm text-slate-500 hover:text-red-600"
						>
							Salir
						</button>
					</div>
				{:else}
					<a href="/login" aria-label="Iniciar sesión">
						<Icon icon="gg:profile" width="25" />
					</a>
				{/if}
			{/if}

			<button
				type="button"
				aria-label="Abrir carrito"
				onclick={abrirCarrito}
				class="relative transition hover:-translate-y-1"
			>
				<Icon icon="ph:bag-thin" width="25px" />

				{#if $cantidadCarrito > 0}
					<span
						class="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-300 px-1 text-xs font-bold text-slate-700"
					>
						{$cantidadCarrito}
					</span>
				{/if}
			</button>

			<button
				type="button"
				aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
				aria-expanded={menuAbierto}
				onclick={alternarMenu}
				class="flex rounded-full p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
			>
				<Icon
					icon={menuAbierto
						? "material-symbols:close-rounded"
						: "material-symbols:menu-rounded"}
					width="28"
				/>
			</button>
		</div>
	</div>

	{#if menuAbierto}
		<nav
			aria-label="Navegación móvil"
			class="border-t border-slate-200 bg-white px-4 py-5 shadow-lg lg:hidden"
		>
			<div class="mx-auto flex max-w-7xl flex-col gap-2">
				<a
					href="/"
					onclick={cerrarMenu}
					class="rounded-xl px-4 py-3 font-BeVietnam font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-800"
				>
					Inicio
				</a>

				<a
					href="/products"
					onclick={cerrarMenu}
					class="rounded-xl px-4 py-3 font-BeVietnam font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-800"
				>
					Productos
				</a>

				<a
					href="/create_account"
					onclick={cerrarMenu}
					class="flex items-center gap-3 rounded-xl px-4 py-3 font-BeVietnam font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-800 sm:hidden"
				>
					<Icon icon="gg:profile" width="23" />
					Mi cuenta
				</a>

				{#if $esAdmin}
					<a
						href="/admin"
						onclick={cerrarMenu}
						class="flex items-center gap-3 rounded-xl px-4 py-3 font-BeVietnam font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-800"
					>
						<Icon
							icon="material-symbols:admin-panel-settings-outline"
							width="23"
						/>
						Admin
					</a>
				{/if}
			</div>
		</nav>
	{/if}

	{#if buscadorAbierto}
		<div class="border-t border-slate-200 bg-white shadow-lg">
			<div class="mx-auto max-w-3xl px-4 py-5 sm:px-6">
				<div class="relative">
					<Icon
						icon="material-symbols:search"
						width="23"
						class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
					/>

					<input
						type="search"
						placeholder="Buscar productos..."
						aria-label="Buscar productos"
						bind:value={textoBusqueda}
						class="h-13 w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-12 pr-12 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
					/>

					{#if textoBusqueda}
						<button
							type="button"
							aria-label="Limpiar búsqueda"
							onclick={() => (textoBusqueda = "")}
							class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-200"
						>
							<Icon
								icon="material-symbols:close-rounded"
								width="20"
							/>
						</button>
					{/if}
				</div>

				{#if textoBusqueda.trim().length > 0}
					<div
						class="mt-4 max-h-96 overflow-y-auto rounded-2xl border border-slate-100 bg-white"
					>
						{#if productosEncontrados.length > 0}
							{#each productosEncontrados as producto (producto.id)}
								<a
									href="/products/{producto.id}"
									onclick={cerrarBuscador}
									class="flex items-center gap-4 border-b border-slate-100 p-3 transition last:border-b-0 hover:bg-sky-50"
								>
									<img
										src={producto.imagen}
										alt={producto.Nombre}
										class="h-16 w-16 shrink-0 rounded-xl object-cover"
									/>

									<div class="min-w-0 flex-1">
										<p class="text-xs text-slate-400">
											{producto.marca
												? `${producto.marca} · ${producto.Tipo}`
												: producto.Tipo}
										</p>

										<p
											class="truncate font-semibold text-slate-700"
										>
											{producto.Nombre}
										</p>

										<p
											class="mt-1 text-sm font-bold text-sky-700"
										>
											${Number(producto.precio ?? 0).toFixed(2)}
										</p>
									</div>

									<Icon
										icon="material-symbols:chevron-right-rounded"
										width="25"
										class="text-slate-400"
									/>
								</a>
							{/each}
						{:else}
							<div class="px-6 py-10 text-center">
								<Icon
									icon="material-symbols:search-off-rounded"
									width="45"
									class="mx-auto text-slate-300"
								/>

								<p class="mt-3 font-semibold text-slate-600">
									No encontramos productos
								</p>

								<p class="mt-1 text-sm text-slate-400">
									Intenta buscar con otro nombre.
								</p>
							</div>
						{/if}
					</div>
				{:else}
					<p class="mt-3 px-2 text-sm text-slate-400">
						Busca por nombre o tipo de producto.
					</p>
				{/if}
			</div>
		</div>
	{/if}
	</header>
</div>

<div class="grid grid-cols-1 *:[grid-area:1/1] *:min-w-0">
	{#key page.url.pathname}
		<div
			in:fade={{ duration: 350, delay: 150, easing: cubicOut }}
			out:fade={{ duration: 150 }}
		>
			{@render children()}
		</div>
	{/key}
</div>

<CartDrawer
	abierto={carritoAbierto}
	cerrar={cerrarCarrito}
	tasaBCV={data?.tasaBCV?.promedio ?? null}
/>

<footer class="border-t border-slate-200 bg-slate-100">
	<div
		class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16 2xl:max-w-[1600px]"
	>
		<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
			<div>
				<p class="font-PlayFair text-3xl text-slate-700">MoonBeauty</p>

				<p class="mt-3 max-w-sm text-sm leading-6 text-slate-500">
					Descubre el brillo que nace desde adentro con nuestra
					curaduría exclusiva de cosmética coreana, entregada
					directamente en tu puerta.
				</p>

				<nav
					aria-label="Redes sociales"
					class="mt-5 flex items-center gap-3"
				>
					<a
						href="https://www.instagram.com/moonbeauty.val/"
						target="_blank"
						rel="noreferrer"
						aria-label="Instagram"
						class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-sky-100 hover:text-sky-700"
					>
						<Icon icon="mdi:instagram" width="19" />
					</a>

					<a
						href="https://wa.me/584125050043"
						target="_blank"
						rel="noreferrer"
						aria-label="WhatsApp"
						class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-sky-100 hover:text-sky-700"
					>
						<Icon icon="mdi:whatsapp" width="19" />
					</a>

					<a
						href="mailto:moonbeautyval@gmail.com"
						aria-label="Correo electrónico"
						class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-sky-100 hover:text-sky-700"
					>
						<Icon icon="material-symbols:mail-outline-rounded" width="19" />
					</a>
				</nav>
			</div>

			<div>
				<p class="font-Mendigo text-lg text-slate-700">Contacto</p>

				<ul class="mt-4 space-y-3 text-sm text-slate-600">
					<li class="flex items-start gap-2">
						<Icon
							icon="material-symbols:location-on-outline-rounded"
							width="19"
							class="mt-0.5 shrink-0 text-slate-400"
						/>
						Valencia, Estado Carabobo, Venezuela
					</li>

					<li class="flex items-start gap-2">
						<Icon
							icon="material-symbols:chat-outline-rounded"
							width="19"
							class="mt-0.5 shrink-0 text-slate-400"
						/>
						<a
							href="https://wa.me/584125050043"
							target="_blank"
							rel="noreferrer"
							class="transition hover:text-sky-700 hover:underline"
						>
							+58 412-505 0043
						</a>
					</li>

					<li class="flex items-start gap-2">
						<Icon
							icon="material-symbols:schedule-outline-rounded"
							width="19"
							class="mt-0.5 shrink-0 text-slate-400"
						/>
						Todos los días · Respondemos por WhatsApp
					</li>
				</ul>
			</div>

			<div>
				<p class="font-Mendigo text-lg text-slate-700">Información</p>

				<ul class="mt-4 space-y-3 text-sm text-slate-600">
					<li>
						<a
							href="/envios"
							class="transition hover:text-sky-700 hover:underline"
						>
							Políticas de Envío
						</a>
					</li>
					<li>
						<a
							href="/cambios-y-devoluciones"
							class="transition hover:text-sky-700 hover:underline"
						>
							Cambios y Devoluciones
						</a>
					</li>
					<li>
						<a
							href="/terminos-y-condiciones"
							class="transition hover:text-sky-700 hover:underline"
						>
							Términos y Condiciones
						</a>
					</li>
					<li>
						<a
							href="/privacidad"
							class="transition hover:text-sky-700 hover:underline"
						>
							Política de Privacidad
						</a>
					</li>
				</ul>
			</div>
		</div>

		<div class="my-10 h-px w-full bg-slate-300"></div>

		<div
			class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
		>
			<div>
				<p class="text-sm font-semibold text-slate-700">
					Suscríbete para recibir consejos de K-Beauty.
				</p>

				<form
					class="mt-4 flex w-full max-w-md flex-col gap-3 sm:flex-row"
					onsubmit={(event) => event.preventDefault()}
				>
					<label for="correo-suscripcion" class="sr-only">
						Correo electrónico
					</label>

					<input
						id="correo-suscripcion"
						class="h-11 min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-5 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
						type="email"
						name="correo"
						placeholder="Tu correo electrónico"
						required
					/>

					<button
						class="h-11 shrink-0 rounded-full bg-slate-600 px-6 text-sm font-semibold text-white transition hover:bg-slate-500"
						type="submit"
					>
						Unirse
					</button>
				</form>
			</div>

			<p class="text-sm text-slate-500">
				© {new Date().getFullYear()} MoonBeauty. Luminous Serenity for
				your skin.
			</p>
		</div>
	</div>
</footer>

<a
	href="https://wa.me/584125050043?text=¡Hola! Estoy interesado en algunos productos de Moon Beauty. ¿Podrían asesorarme?"
	target="_blank"
	rel="noopener noreferrer"
	class="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-green-400/40"
	aria-label="WhatsApp"
>
	<Icon icon="mdi:whatsapp" class="h-9 w-9" />
</a>

<style>
	.cupon-marquee {
		width: 100%;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(
			to right,
			transparent,
			#000 4%,
			#000 96%,
			transparent
		);
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 4%,
			#000 96%,
			transparent
		);
	}

	.cupon-marquee__track {
		display: flex;
		width: max-content;
		animation: cupon-marquee-scroll 66s linear infinite;
	}

	.cupon-marquee:hover .cupon-marquee__track {
		animation-play-state: paused;
	}

	@keyframes cupon-marquee-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cupon-marquee__track {
			animation: none;
		}
	}
</style>
