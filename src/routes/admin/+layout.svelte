<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import Icon from "@iconify/svelte";
	import { usuario, autenticacionCargando } from "$lib/auth";
	import { esAdmin, esAdminCargando } from "$lib/admin";

	let { children } = $props();

	const verificando = $derived($autenticacionCargando || $esAdminCargando);
	const autorizado = $derived(Boolean($usuario) && $esAdmin);

	$effect(() => {
		if (verificando) return;

		if (!autorizado) {
			goto("/");
		}
	});

	// Modo oscuro solo del panel de administración — no afecta el resto
	// del sitio. Se recuerda por navegador con localStorage (preferencia
	// personal de quien lo usa, no un dato que necesite sincronizarse).
	let modoOscuro = $state(false);

	onMount(() => {
		try {
			modoOscuro = localStorage.getItem("moonbeauty-admin-tema") === "oscuro";
		} catch {
			// Sin acceso a localStorage (navegación privada, etc.): se queda
			// en modo claro, sin romper nada.
		}
	});

	function alternarTema() {
		modoOscuro = !modoOscuro;
		try {
			localStorage.setItem(
				"moonbeauty-admin-tema",
				modoOscuro ? "oscuro" : "claro",
			);
		} catch {
			// Ignorar: el toggle sigue funcionando en esta sesión igual.
		}
	}

	type ItemMenu = {
		href: string;
		etiqueta: string;
		icono: string;
	};

	const menu: ItemMenu[] = [
		{ href: "/admin", etiqueta: "Dashboard", icono: "material-symbols:dashboard-outline" },
		{ href: "/admin/pedidos", etiqueta: "Pedidos", icono: "material-symbols:receipt-long-outline" },
		{ href: "/admin/inventario", etiqueta: "Inventario", icono: "material-symbols:inventory-2-outline" },
		{ href: "/admin/cupones", etiqueta: "Cupones", icono: "material-symbols:sell-outline" },
		{ href: "/admin/contenido", etiqueta: "Contenido", icono: "material-symbols:auto-awesome-mosaic-outline" },
		{ href: "/admin/legales", etiqueta: "Legales", icono: "material-symbols:gavel-rounded" },
	];

	const rutaActual = $derived(page.url.pathname);

	function estaActivo(href: string) {
		return href === "/admin" ? rutaActual === "/admin" : rutaActual.startsWith(href);
	}

	let menuMovilAbierto = $state(false);
</script>

{#if verificando}
	<div class="flex min-h-[60vh] items-center justify-center">
		<p class="text-slate-500">Verificando acceso...</p>
	</div>
{:else if autorizado}
	<div class:dark={modoOscuro} class="bg-slate-50 dark:bg-[#0b0f1c]">
		<div class="mx-auto flex min-h-[calc(100vh-1px)] max-w-[1600px]">
			<!-- Sidebar (escritorio) -->
			<aside
				class="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex dark:border-white/5 dark:bg-[#0b0f1c]"
			>
				<div class="flex flex-col items-center px-2 text-center">
					<div
						class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-indigo-200 text-lg font-semibold text-slate-700"
					>
						MB
					</div>
					<p class="mt-3 font-Manrope text-sm text-slate-500 dark:text-indigo-300">
						MoonBeauty
					</p>
					<p class="font-Manrope text-lg font-semibold tracking-wide text-slate-800 dark:text-white">
						ADMIN
					</p>
					<p class="mt-0.5 text-[11px] italic text-slate-400 dark:text-slate-500">
						Panel de administración
					</p>
				</div>

				<nav class="mt-8 flex flex-1 flex-col gap-1">
					{#each menu as item (item.href)}
						<a
							href={item.href}
							class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition {estaActivo(
								item.href,
							)
								? 'bg-slate-900 text-white dark:bg-white/10 dark:text-white'
								: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'}"
						>
							<Icon icon={item.icono} width="20" />
							{item.etiqueta}
						</a>
					{/each}
				</nav>

				<a
					href="/admin/inventario"
					class="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-transparent dark:bg-teal-200 dark:text-slate-900 dark:hover:bg-teal-100"
				>
					<Icon icon="material-symbols:add" width="18" />
					Agregar producto
				</a>

				<div class="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/5">
					<a
						href="/admin/configuracion"
						class="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-500 transition hover:bg-slate-100 dark:text-indigo-300 dark:hover:bg-white/5"
					>
						<Icon icon="material-symbols:settings-outline" width="20" />
						Configuración
					</a>

					<button
						type="button"
						onclick={alternarTema}
						class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
						aria-label={modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
						title={modoOscuro ? "Modo claro" : "Modo oscuro"}
					>
						<Icon icon={modoOscuro ? "material-symbols:light-mode-outline" : "material-symbols:dark-mode-outline"} width="18" />
					</button>
				</div>
			</aside>

			<!-- Barra superior móvil -->
			<div class="flex w-full flex-col lg:hidden">
				<div
					class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-white/5 dark:bg-[#0b0f1c]"
				>
					<button
						type="button"
						onclick={() => (menuMovilAbierto = !menuMovilAbierto)}
						class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400"
						aria-label="Abrir menú del panel"
					>
						<Icon icon="material-symbols:menu-rounded" width="22" />
					</button>
					<p class="font-Manrope text-sm font-semibold text-slate-800 dark:text-white">
						MoonBeauty ADMIN
					</p>
					<button
						type="button"
						onclick={alternarTema}
						class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400"
						aria-label={modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
					>
						<Icon icon={modoOscuro ? "material-symbols:light-mode-outline" : "material-symbols:dark-mode-outline"} width="18" />
					</button>
				</div>

				{#if menuMovilAbierto}
					<nav class="flex flex-col gap-1 border-b border-slate-200 bg-white px-3 py-3 dark:border-white/5 dark:bg-[#0b0f1c]">
						{#each menu as item (item.href)}
							<a
								href={item.href}
								onclick={() => (menuMovilAbierto = false)}
								class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition {estaActivo(
									item.href,
								)
									? 'bg-slate-900 text-white dark:bg-white/10 dark:text-white'
									: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'}"
							>
								<Icon icon={item.icono} width="20" />
								{item.etiqueta}
							</a>
						{/each}
						<a
							href="/admin/configuracion"
							onclick={() => (menuMovilAbierto = false)}
							class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400"
						>
							<Icon icon="material-symbols:settings-outline" width="20" />
							Configuración
						</a>
					</nav>
				{/if}

				<main class="min-w-0 flex-1 px-4 py-6">
					{@render children()}
				</main>
			</div>

			<!-- Contenido (escritorio) -->
			<main class="hidden flex-1 px-6 py-8 lg:block xl:px-10">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
