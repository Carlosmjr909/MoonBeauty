<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";

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

	<div></div>
</header>

{@render children()}

<footer>
	<p>MoonBeauty</p>
	<div>
		<a href="https://www.instagram.com/moonbeauty.val/">Instagram</a>
		<a href="">Facebook</a>
		<a href="">Pinterest</a>
	</div>
	2024 MoonBeauty.Luminous Serenity for your skin.
</footer>
