<script lang="ts">
    import Icon from "@iconify/svelte";
    import { carrito, totalCarritoUSD, cantidadCarrito } from "$lib/cart.js";
    import { goto } from "$app/navigation";

    import {
        convertirUSDaVES,
        formatearUSD,
        formatearVES,
    } from "$lib/utils/moneda";

    let {
        abierto,
        cerrar,
        tasaBCV,
    }: {
        abierto: boolean;
        cerrar: () => void;
        tasaBCV: number | null;
    } = $props();

    const tasaValida = $derived(
        typeof tasaBCV === "number" && Number.isFinite(tasaBCV) && tasaBCV > 0,
    );

    const totalCarritoVES = $derived(
        tasaValida
            ? convertirUSDaVES($totalCarritoUSD, tasaBCV as number)
            : null,
    );

    const carritoItems = $derived($carrito ?? []);

    async function continuarCompra() {
        cerrar();
        await goto("/checkout");
    }
</script>

{#if abierto}
    <div
        class="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        role="presentation"
        onclick={cerrar}
    ></div>
{/if}

<aside
    class="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out"
    class:translate-x-0={abierto}
    class:translate-x-full={!abierto}
    aria-hidden={!abierto}
>
    <header
        class="flex items-center justify-between border-b border-slate-200 px-6 py-5"
    >
        <div>
            <h2 class="font-PlayFair text-2xl text-slate-700">Tu carrito</h2>

            <p class="mt-1 text-sm text-slate-400">
                {$cantidadCarrito}
                {$cantidadCarrito === 1 ? " producto" : " productos"}
            </p>
        </div>

        <button
            type="button"
            aria-label="Cerrar carrito"
            onclick={cerrar}
            class="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
        >
            <Icon icon="material-symbols:close-rounded" width="27" />
        </button>
    </header>

    {#if $carrito.length === 0}
        <div
            class="flex flex-1 flex-col items-center justify-center px-8 text-center"
        >
            <Icon icon="ph:bag-thin" width="70" class="text-slate-300" />

            <h3 class="mt-5 text-xl font-semibold text-slate-600">
                Tu carrito está vacío
            </h3>

            <p class="mt-2 text-sm text-slate-400">
                Agrega tus productos favoritos para comenzar.
            </p>

            <a
                href="/products"
                onclick={cerrar}
                class="mt-7 rounded-full bg-sky-200 px-7 py-3 font-semibold text-slate-700 transition hover:bg-sky-300"
            >
                Ver productos
            </a>
        </div>
    {:else}
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {#each carritoItems as producto, index (producto?.id ?? index)}
                <article
                    class="flex gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                >
                    <a
                        href="/products/{producto.id}"
                        onclick={cerrar}
                        class="shrink-0"
                    >
                        <img
                            src={producto?.imagen ?? ""}
                            alt={producto?.Nombre ?? "Producto sin nombre"}
                            class="h-24 w-24 rounded-xl object-cover"
                        />
                    </a>

                    <div class="min-w-0 flex-1">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <p class="text-xs text-slate-400">
                                    {producto?.Tipo ?? "Producto"}
                                </p>

                                <a
                                    href={producto?.id != null
                                        ? `/products/${producto.id}`
                                        : "/products"}
                                    onclick={cerrar}
                                    class="line-clamp-2 font-semibold text-slate-700 hover:underline"
                                >
                                    {producto?.Nombre ?? "Producto sin nombre"}
                                </a>
                            </div>

                            <button
                                type="button"
                                aria-label="Eliminar producto"
                                onclick={() =>
                                    producto?.id != null &&
                                    carrito.eliminar(producto.id)}
                                class="text-slate-400 transition hover:text-red-500"
                            >
                                <Icon
                                    icon="material-symbols:delete-outline-rounded"
                                    width="21"
                                />
                            </button>
                        </div>

                        <p class="mt-2 font-semibold text-sky-700">
                            {formatearUSD(producto?.precio ?? 0)}
                        </p>
                        <div class="mt-3 flex items-center justify-between">
                            <div
                                class="flex h-9 items-center rounded-full border border-slate-200"
                            >
                                <button
                                    type="button"
                                    aria-label="Disminuir cantidad"
                                    onclick={() =>
                                        producto?.id != null &&
                                        carrito.disminuir(producto.id)}
                                    class="px-3 text-lg text-slate-500"
                                >
                                    −
                                </button>

                                <span class="min-w-6 text-center text-sm">
                                    {producto?.cantidad ?? 0}
                                </span>

                                <button
                                    type="button"
                                    aria-label="Aumentar cantidad"
                                    onclick={() =>
                                        producto?.id != null &&
                                        carrito.aumentar(producto.id)}
                                    class="px-3 text-lg text-slate-500"
                                >
                                    +
                                </button>
                            </div>

                            <strong class="text-sm text-slate-700">
                                {formatearUSD(
                                    (producto?.precio ?? 0) *
                                        (producto?.cantidad ?? 0),
                                )}
                            </strong>
                        </div>
                    </div>
                </article>
            {/each}
        </div>

        <footer class="border-t border-slate-200 bg-white px-6 py-5">
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-base text-slate-500"> Total en USD </span>

                    <strong class="text-xl text-slate-800">
                        {formatearUSD($totalCarritoUSD)}
                    </strong>
                </div>

                <div class="flex items-center justify-between">
                    <span class="text-lg font-semibold text-slate-700">
                        Total en VES
                    </span>

                    {#if totalCarritoVES !== null}
                        <strong class="text-xl text-sky-700">
                            {formatearVES(totalCarritoVES)}
                        </strong>
                    {:else}
                        <span class="text-sm text-amber-600">
                            Tasa no disponible
                        </span>
                    {/if}
                </div>
            </div>

            <div>
                <p class="mt-1 text-xs text-slate-400">
                    El costo de envío se calculará después.
                </p>

                <button
                    type="button"
                    onclick={continuarCompra}
                    class="mt-5 flex w-full justify-center rounded-full bg-slate-600 px-6 py-4 font-semibold text-white transition hover:bg-slate-500"
                >
                    Continuar compra
                </button>
                <button
                    type="button"
                    onclick={() => carrito.vaciar()}
                    class="mt-3 w-full py-2 text-sm text-red-500 hover:underline"
                >
                    Vaciar carrito
                </button>
            </div>
        </footer>
    {/if}
</aside>
