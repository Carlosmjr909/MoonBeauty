<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import Icon from "@iconify/svelte";
	import { cantidadCarrito } from "$lib/cart";
	// @ts-ignore
	import CartDrawer from "$lib/components/CartDrawer.svelte";

	let { children, data } = $props();

	let menuAbierto = $state(false);
	let carritoAbierto = $state(false);

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
	if (typeof document === 'undefined') {
		return;
	}

	document.body.style.overflow = carritoAbierto
		? 'hidden'
		: '';

	return () => {
		document.body.style.overflow = '';
	};
});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header
	class="sticky top-0 z-50 bg-white/60 backdrop-blur-md"
>
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
				aria-label="Buscar"
				class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
			>
				<Icon icon="material-symbols:search" width="24" />
			</button>

			<a
				href="/create_account"
				aria-label="Cuenta"
				class="hidden rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:flex"
			>
				<Icon icon="gg:profile" width="24" />
			</a>

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
				aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
				aria-expanded={menuAbierto}
				onclick={alternarMenu}
				class="flex rounded-full p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
			>
				<Icon
					icon={menuAbierto
						? 'material-symbols:close-rounded'
						: 'material-symbols:menu-rounded'}
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

			<a
				href="/"
				class="transition hover:text-slate-900 hover:underline"
			>
				Facebook
			</a>

			<a
				href="/"
				class="transition hover:text-slate-900 hover:underline"
			>
				Pinterest
			</a>
		</nav>

		<p
			class="mt-8 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg"
		>
			Suscríbete para recibir consejos de K-Beauty y ofertas
			exclusivas.
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
			© {new Date().getFullYear()} MoonBeauty. Luminous Serenity for
			your skin.
		</p>
	</div>
</footer>