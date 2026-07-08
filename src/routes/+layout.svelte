<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>


<header>
   <div>
<p>MoonBeauty</p>
<a href="/">Inicio</a>
<a href="products">Productos</a> 
<a href="contacts">Contactos</a>
   </div>

   <div>


   </div>
</header>

{@render children()}


<footer>
 Mi Footer
</footer>