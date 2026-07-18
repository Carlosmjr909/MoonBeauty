<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import Icon from "@iconify/svelte";
	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="flex justify-between items-center px-15">

<img src="/logo.webp" alt="" class="w-30 h-auto">

		<div class="flex gap-12 group">
		<a class="hover:underline hover:-translate-y-1 duration-300 transition-all font-bold text-slate-500" href="/">Inicio</a>
		<a class="hover:underline hover:-translate-y-1 duration-300 transition-all font-bold text-slate-500	" href="/products">Productos</a>
		<a class="hover:underline hover:-translate-y-1 duration-300 transition-all font-bold text-slate-500	" href="/contacts">Contactos</a>
	</div>

	<div class="flex gap-6 font-bold text-slate-500">
		<Icon icon="material-symbols:search" width="25px"/>
		<Icon icon="ph:bag-thin" width="25px" />
	</div>
</header>

{@render children()}

<footer class="bg-slate-100 flex flex-col items-center" >
	<p class="text-3xl p-12">MoonBeauty</p>
	<div class="text-lg space-x-6">
		<a href="https://www.instagram.com/moonbeauty.val/">Instagram</a>
		<a href="">Facebook</a>
		<a href="">Pinterest</a>
	</div>
	<p class="text-xl p-7">Suscribete para recibir consejos de J-Beauty y ofertas exclusivas.</p>

	<form action="">
		<input class="bg-white rounded-3xl px-6 py-2" type="email" name="" id="" placeholder="Tu correo electronico"/>
		<button class="bg-slate-500 hover:bg-slate-400 duration-500 transition-all text-white px-4 py-2 rounded-3xl" type="submit">Unirse</button>
	</form>

	<div class="bg-gray-400 w-425 h-px my-12"></div>

	<p class="py-">2024 MoonBeauty.Luminous Serenity for your skin.</p>
</footer>
