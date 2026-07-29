<script lang="ts">
    interface PropTypes {
        Tipo: string;
        Nombre: string;
        precio: number;
        imagen: string;
        id: number;
    }
    const { Tipo, Nombre, precio, imagen, id }: PropTypes = $props();
</script>

<!-- 
  PROPIEDADES DEL COMPONENTE
   Tipo: Rostro
   Nombre: Lunar Mist Serum
   precio: $85.00
   imagen: source
-->

<a href="/products/{id}">
    <div class="flex-1">
     <div class="overflow-hidden h-150">
        <img src={imagen} alt="" class="w-full h-150 object-cover hover:scale-110 duration-600 transition-transform<"/>
    
    </div>
        

        <div>
            <p>{Tipo}</p>
            <p>{Nombre}</p>
            <p>${precio}</p>
        </div>
    </div>
</a>
