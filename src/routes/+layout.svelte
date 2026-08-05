<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import Icon from "@iconify/svelte";
	import { cantidadCarrito } from "$lib/cart";
	import { usuario, autenticacionCargando } from "$lib/auth";
	import { signOut } from "firebase/auth";
	import { auth } from "$lib/firebase";
	import { goto } from "$app/navigation";
	// @ts-ignore
	import CartDrawer from "$lib/components/CartDrawer.svelte";
	import { products as productosImportados } from "$lib/products.js";

	let { children, data } = $props();

	type Producto = {
		id?: string | number;
		Nombre: string;
		Tipo: string;
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
			: productosImportados
					.filter((producto) => {
						const texto = textoBusqueda.trim().toLowerCase();

						const nombre = producto.Nombre?.toLowerCase() ?? "";
						const tipo = producto.Tipo?.toLowerCase() ?? "";
						const especificacion =
							producto.especificacion?.toLowerCase() ?? "";

						return (
							nombre.includes(texto) ||
							tipo.includes(texto) ||
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
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="sticky top-0 z-50 bg-white/60 backdrop-blur-md">
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

			<a
				href="/contacts"
				class="font-BeVietnam font-bold text-slate-500 transition-all duration-300 hover:-translate-y-1 hover:text-slate-800 hover:underline"
			>
				Contactos
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
	{#if $usuario}
		<div class="flex items-center gap-3">
			<a
				href="/account"
				class="flex items-center gap-2 text-sm text-slate-600"
			>
				<Icon
					icon="material-symbols:account-circle-outline"
					width="25"
				/>

				<span class="hidden lg:inline">
					{$usuario.displayName ?? 'Mi cuenta'}
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
					href="/contacts"
					onclick={cerrarMenu}
					class="rounded-xl px-4 py-3 font-BeVietnam font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-800"
				>
					Contactos
				</a>

				<a
					href="/create_account"
					onclick={cerrarMenu}
					class="flex items-center gap-3 rounded-xl px-4 py-3 font-BeVietnam font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-800 sm:hidden"
				>
					<Icon icon="gg:profile" width="23" />
					Mi cuenta
				</a>
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
											{producto.Tipo}
										</p>

										<p
											class="truncate font-semibold text-slate-700"
										>
											{producto.Nombre}
										</p>

										<p
											class="mt-1 text-sm font-bold text-sky-700"
										>
											${producto.precio.toFixed(2)}
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

{@render children()}

<CartDrawer
	abierto={carritoAbierto}
	cerrar={cerrarCarrito}
	tasaBCV={data?.tasaBCV?.promedio ?? null}
/>

<footer class="bg-slate-100">
	<div
		class="mx-auto flex max-w-7xl flex-col items-center px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16 2xl:max-w-[1600px]"
	>
		<p class="font-PlayFair text-3xl text-slate-700 sm:text-4xl">
			MoonBeauty
		</p>

		<nav
			aria-label="Redes sociales"
			class="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-base text-slate-600 sm:text-lg"
		>
			<a
				href="https://www.instagram.com/moonbeauty.val/"
				target="_blank"
				rel="noreferrer"
				class="transition hover:text-slate-900 hover:underline"
			>
				Instagram
			</a>

			<a href="/" class="transition hover:text-slate-900 hover:underline">
				Facebook
			</a>

			<a href="/" class="transition hover:text-slate-900 hover:underline">
				Pinterest
			</a>
		</nav>

		<p class="mt-8 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
			Suscríbete para recibir consejos de K-Beauty y ofertas exclusivas.
		</p>

		<form
			class="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
			onsubmit={(event) => event.preventDefault()}
		>
			<label for="correo-suscripcion" class="sr-only">
				Correo electrónico
			</label>

			<input
				id="correo-suscripcion"
				class="h-12 min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-6 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
				type="email"
				name="correo"
				placeholder="Tu correo electrónico"
				required
			/>

			<button
				class="h-12 rounded-full bg-slate-600 px-7 font-semibold text-white transition hover:bg-slate-500"
				type="submit"
			>
				Unirse
			</button>
		</form>

		<div class="my-8 h-px w-full bg-slate-300"></div>

		<p class="text-sm leading-6 text-slate-500 sm:text-base">
			© {new Date().getFullYear()} MoonBeauty. Luminous Serenity for your
			skin.
		</p>
	</div>
</footer>
