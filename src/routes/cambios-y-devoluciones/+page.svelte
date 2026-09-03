<script lang="ts">
	import PaginaLegal from "$lib/components/PaginaLegal.svelte";
</script>

<svelte:head>
	<title>Cambios y Devoluciones | Moon Beauty</title>
</svelte:head>

<PaginaLegal
	titulo="Cambios y Devoluciones"
	actualizado="2 de septiembre de 2026"
>
	{#snippet children()}
		<p>
			Por tratarse de productos de cuidado personal, por higiene solo
			aceptamos cambios en los siguientes casos:
		</p>
		<ul>
			<li>El producto llegó dañado o en mal estado.</li>
			<li>Recibiste un producto distinto al que compraste.</li>
			<li>El producto presenta un defecto de fábrica.</li>
		</ul>

		<h2>Plazo y requisitos</h2>
		<p>
			Debes reportarlo dentro de las <strong>48 horas</strong> siguientes
			a recibir tu pedido, escribiéndonos por WhatsApp con:
		</p>
		<ul>
			<li>Tu número de pedido.</li>
			<li>Foto o video del producto y del empaque recibido.</li>
			<li>Una breve descripción del problema.</li>
		</ul>

		<h2>Qué no cubre esta política</h2>
		<p>
			No se aceptan devoluciones ni cambios por simple cambio de
			opinión en productos ya abiertos o usados, por tratarse de
			artículos de cuidado personal. Tampoco cubrimos reacciones de
			sensibilidad a los ingredientes: te recomendamos revisar la
			lista de ingredientes de cada producto antes de comprarlo y
			hacer una prueba de parche antes del primer uso.
		</p>

		<h2>Resolución</h2>
		<p>
			Una vez confirmado el caso, te ofrecemos el reemplazo del
			producto o una nota de crédito para tu próxima compra. Si el
			error fue nuestro (producto incorrecto o defectuoso), cubrimos
			nosotros el costo del reenvío; en los demás casos, el costo de
			envío corre por parte del comprador.
		</p>

		<h2>Contacto</h2>
		<p>
			Escríbenos por
			<a href="https://wa.me/584125050043" target="_blank" rel="noreferrer"
				>WhatsApp</a
			>
			o a
			<a href="mailto:moonbeautyval@gmail.com">moonbeautyval@gmail.com</a>
			y con gusto te ayudamos.
		</p>
	{/snippet}
</PaginaLegal>
