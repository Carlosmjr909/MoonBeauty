<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import Icon from "@iconify/svelte";
	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="flex justify-between items-center px-12 py-4">

<p class="text-2xl font-semibold text-cyan-800">MoonBeauty</p>

		<div class="flex gap-6">
		<a href="/">Inicio</a>
		<a href="/products">Productos</a>
		<a href="/contacts">Contactos</a>
	</div>

	<div class="flex gap-4">
		<Icon icon="material-symbols:search" width="25px" />
		<Icon icon="ph:bag-thin" width="25px" />
	</div>
</header>

{@render children()}

<footer>
	<p>MoonBeauty</p>
	<div>
		<a href="https://www.instagram.com/moonbeauty.val/">Instagram</a>
		<a href="">Facebook</a>
		<a href="">Pinterest</a>
	</div>
	<p>Suscribete para recibir consejos de J-Beauty y ofertas exclusivas.</p>

	<form action="">
		<input type="email" name="" id="" placeholder="Tu correo electronico" />
		<button type="submit">Unirse</button>
	</form>

	<p>2024 MoonBeauty.Luminous Serenity for your skin.</p>
</footer>
