<script lang="ts">

interface PropTypes {
   Tipo: string
   Nombre: string
   precio: number
   imagen: string
}
const { Tipo, Nombre, precio, imagen }: PropTypes= $props()


</script>

<!-- 
  PROPIEDADES DEL COMPONENTE
   Tipo: Rostro
   Nombre: Lunar Mist Serum
   precio: $85.00
   imagen: source
-->


<div class="flex-1">
    <img src={imagen} alt="" class="w-full h-150 object-cover" />

    <div>
        <p>{Tipo}</p>
        <p>{Nombre}</p>
        <p>${precio}</p>
    </div>
</div>
