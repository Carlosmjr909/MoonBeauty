<script>
    const { params } = $props();
    import { products } from "$lib/products.js";

    const product = products.find(
        (product) => product.id == parseInt(params.id),
    );
</script>

{#if product}
    <div class="flex items-start gap-16 p-24">
        <img
            src={product.imagen}
            alt=""
            class="h-150 object-cover rounded-3xl flex-1"
        />

        <div class="flex-1">
            <p class="text-4xl font-PlayFair text-gray-700">{product.Nombre}</p>
            <div>
                <p class="text-xl font-BeVietnam">${product.precio}</p>
            </div>

            <div>
                <p class="text-base font-BeVietnam text-gray-500">
                    {product.descripcion}
                </p>
            </div>
        </div>
    </div>
    {:else}
    <div>
        <p>Producto no encontrado</p>
    </div>
{/if}
