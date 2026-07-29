<script>
    const { params } = $props();
    import { products } from "$lib/products.js";
</script>

{#each products as data}
    {#if data.id == parseInt(params.id)}
        <div class="flex items-start gap-16 p-24">
            <img
                src={data.imagen}
                alt=""
                class="h-150 object-cover rounded-3xl flex-1"
            />

            <div class="flex-1">
                <p class="text-4xl font-PlayFair text-gray-700">{data.Nombre}</p>
                <div>
                    <p class="text-xl font-BeVietnam">${data.precio}</p>
                </div>

                <div>
                    <p class="text-base font-BeVietnam text-gray-500">{data.descripcion}</p>
                </div>
            </div>

        </div>
    {/if}
{/each}
