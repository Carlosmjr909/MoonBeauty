<script lang="ts">
    import Tarjeta from "$lib/components/tarjeta.svelte";
    import { onMount } from "svelte";
    import { products } from "../../lib/products";
    import { gsap } from "gsap";

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

    let { data } = $props();
</script>

<section class="bg-slate-50 py-12 px-16"
bind:this={estado.elementoAnimado}>
    <div>
        <p
            class="font-PlayFair text-3xl
    sm:text-2xl
    md:text-3xl
    lg:text-4xl
    2xl:text-6xl
    "
        >
            Nuestros Productos
        </p>
    </div>

    <div
        class="grid grid-cols-1 my-12
    sm:grid-cols-2
    md:grid-cols-3
    lg:grid-cols-4
    gap-4"
    >
        {#each products as product}
            <Tarjeta {...product} tasaBCV={data?.tasaBCV?.promedio ?? null}
            ></Tarjeta>
        {/each}
    </div>
</section>
