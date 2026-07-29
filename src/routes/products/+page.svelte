<script>
    import Tarjeta from "$lib/components/tarjeta.svelte";
    import { products } from "$lib/products";
</script>


<section class="bg-slate-50">
    <div class="flex flex-col items-center p-12 space-y-4">
        <p class="text-4xl font-PlayFair">Nuestra Coleccion</p>
        <p class="text-lg text-center">
            Rituales de belleza inspirados en la serenidad luminosa. Descubre formulas clinicas envueltas en texturas etereas.
        </p>
    </div>
    <div class="flex gap-4 p-12">
    {#each products as data}
        <Tarjeta {...data}></Tarjeta>
    {/each}

    </div>
</section>