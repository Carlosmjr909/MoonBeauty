<script lang="ts">
    import Tarjeta from "$lib/components/tarjeta.svelte";
    import { products } from "../../lib/products";
</script>

<section class="bg-slate-50 py-12 px-16">
    <div class="grid grid-cols-1 
    sm:grid-cols-2 
    md:grid-cols-3 
    lg:grid-cols-4 
    gap-4">

        {#each products as data}            
            <Tarjeta {...data}></Tarjeta>
        {/each}
    </div>
</section>