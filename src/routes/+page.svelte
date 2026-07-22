<script>
// @ts-nocheck

    import Tarjeta from "$lib/components/tarjeta.svelte";
    import Icon from "@iconify/svelte";
</script>

<section class="flex justify-center py-62 text-center">
    <img src="/fondo.jpg" alt="" class="absolute -z-10 w-full h-full top-0 object-cover"/>
    <div class="space-y-4">
        <p class="font-PlayFair text-6xl text-slate-500 text-center">MoonBeauty</p>
        <p class="font-BeVietnam text-2xl text-slate-500">Desde Corea hasta tu hogar</p>
        <a class="font-BeVietnam bg-sky-200 px-12 py-3 rounded-3xl text-lg text-slate-500 hover:bg-slate-500 hover:text-white transition-all duration-500 " href="/products">Ver Catalogo</a>
    </div>
</section>

<section class="p-12 space-y-4 bg-gray-50">
    <div class="flex space-x-4">


        <div class="bg-white rounded-3xl flex flex-col p-10 hover:-translate-y-2 transition-all ">
            <Icon icon="mdi:stars" width="35px"/>
            <p>La Ciencia de la Calma</p>
            <p>
                Seleccionamos cuidadosamente rituales coreanos que combinan la
                tecnologia clinica mas avanzada con ingredientes botanicos
                ancestrales
            </p>
            <img src="/planta.png" alt="" class="w-full rounded-2xl" />
        </div>


        <div class="p-4 bg-blue-50 rounded-3xl flex flex-col justify-center items-center text-center font-bold text-indigo-950 hover:-translate-y-2 transition-all duration-500">
            <Icon icon="mdi:medal-outline" width="25px"/>
            <p>Curaduria Exclusiva</p>
            <p>
                Solo marcas que cumplen con los estandares mas estrictos de K-Beauty y sostenibilidad
            </p>
        </div>
    </div>

    <div class="flex space-x-4">
        <div class="bg-blue-50 rounded-3xl hover:-translate-y-2 transition-all duration-500">
            <Icon icon="mdi:truck-outline" width="25px" />
            <p>Envio Directo</p>
            <p>
                Logistica optimizada para que tu ritual no se detenga. Directo
                desde Seul a tu puerta
            </p>
        </div>

        <div class="p-4 bg-slate-700 flex gap-10 rounded-3xl overflow-hidden relative hover:-translate-y-2 transition-all duration-500">
            <img src="/Agua.png" alt="" class="rounded-3xl"/>

            <div class="text-white">
                <p>Luminous Serenity</p>
                <p>
                    Descubre el brillo que nace desde adentro con productos
                    diseñados para nutrir no solo tu piel, sino tu bienestar
                    diario
                </p>
                <button>Saber Mas</button>
            </div>
        </div>
    </div>
</section>

<section class="p-12 font-bold text-slate-600">
    <p class="text-base py-10 px-12 font-BeVietnam">New arrivals</p>
    <div class="flex justify-between px-12">
        <p class="text-3xl font-PlayFair">Favoritos de Temporada</p>
        <a class="bg-sky-200 rounded-3xl px-4 py-2 font-BeVietnam" href="/products">Ver Todos</a>
    </div>
    <div class="flex gap-16 p-12">
        <Tarjeta 
         Tipo="Protector solar"
         Nombre="Tocobo bio watery sun cream"
         precio="19"
         imagen="/Tocobo-bio-watery-sun-cream.jpg"
         ></Tarjeta>


        <Tarjeta
        Tipo="Balsamo labial"
        Nombre="glass tinted lip balm"
        precio="12"
        imagen="/glass tinted lip balm.png"
        ></Tarjeta>

        <Tarjeta 
        Tipo="Balsamo limpiador"
        Nombre="pure grinding cleansing balm"
        precio="25"
        imagen="/pure grinding cleansing balm.png"
        ></Tarjeta>
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
