<script>
    import Tarjeta from "$lib/components/tarjeta.svelte";
    import Icon from "@iconify/svelte";
</script>

<section>
    <img src="/labial.png" alt="" />
    <div>
        <p class="text-4xl text-cyan-300">MoonBeauty</p>
        <p>Desde Corea hasta tu hogar</p>
        <a href="/products">Ver Catalogo</a>
    </div>
</section>

<section class="p-12 space-y-4 bg-gray-50">
    <div class="flex">
        <div class="bg-white">
            <Icon icon="mdi:stars" width="35px" />
            <p>La Ciencia de la Calma</p>
            <p>
                Seleccionamos cuidadosamente rituales coreanos que combinan la
                tecnologia clinica mas avanzada con ingredientes botanicos
                ancestrales
            </p>
            <img src="/planta.png" alt="" />
        </div>

        <div class="p-4 bg-blue-50">
            <Icon icon="mdi:medal-outline" width="25px" />
            <p>Curaduria Exclusiva</p>
            <p>
                Solo marcas que cumplen con los estandares mas estrictos de
                K-Beauty y sostenibilidad
            </p>
        </div>
    </div>

    <div class="flex">
        <div class="bg-blue-50">
            <Icon icon="mdi:truck-outline" width="25px" />
            <p>Envio Directo</p>
            <p>
                Logistica optimizada para que tu ritual no se detenga. Directo
                desde Seul a tu puerta
            </p>
        </div>

        <div class="p-4 bg-slate-900 flex gap-3">
            <img src="/Agua.png" alt="" />

            <div class="text-white">
            <p>Luminous Serenity</p>
            <p>
                Descubre el brillo que nace desde adentro con productos
                diseñados para nutrir no solo tu piel, sino tu bienestar diario
            </p>
            <button>Saber Mas</button>
            </div>
        </div>
    </div>
</section>

<section>
    <p>LO NUEVO</p>
    <div>
        <p>Favoritos de Temporada</p>
        <button>Ver Todos</button>
    </div>
    <div>
        <Tarjeta></Tarjeta>
        <Tarjeta></Tarjeta>
        <Tarjeta></Tarjeta>
    </div>
</section>

<section>
    <Icon icon="at-icons:quotation-marks" width="25px" />
    <p>
        "La verdadera belleza no se trata de perfeccion, sino de la luz que
        emanas cuando te sientes en paz con tu ritual".
    </p>
    <p>Filosofia MoonBeauty</p>
</section>
