<script lang="ts">
	import PaginaLegal from "$lib/components/PaginaLegal.svelte";
</script>

<svelte:head>
	<title>Política de Envíos | Moon Beauty</title>
</svelte:head>

<PaginaLegal
	titulo="Política de Envíos"
	actualizado="2 de septiembre de 2026"
>
	{#snippet children()}
		<h2>Cobertura</h2>
		<p>
			Hacemos envíos a nivel nacional dentro de Venezuela. En el
			checkout te pedimos tu dirección completa (o la ubicación
			marcada en el mapa) para coordinar la entrega según tu zona.
		</p>

		<h2>Costo de envío</h2>
		<p>
			El costo de envío se calcula según tu ubicación y se te informa
			por WhatsApp junto con las instrucciones de pago, antes de
			despachar tu pedido. No está incluido en el total mostrado en el
			checkout.
		</p>

		<h2>Tiempos de entrega</h2>
		<p>
			El tiempo estimado depende de tu zona y del servicio de
			encomienda o delivery disponible; te lo confirmamos al coordinar
			tu pedido. Los tiempos pueden extenderse por causas fuera de
			nuestro control (feriados, condiciones climáticas, disponibilidad
			del courier).
		</p>

		<h2>Verifica tu dirección</h2>
		<p>
			Eres responsable de que la dirección de entrega esté completa y
			correcta. Si el envío se retrasa o se devuelve por datos
			incorrectos o incompletos, cualquier costo adicional de reenvío
			corre por tu cuenta.
		</p>

		<h2>Seguimiento</h2>
		<p>
			Te compartimos el número de guía o los datos de contacto del
			servicio de envío cuando tu pedido salga hacia tu destino, para
			que puedas hacerle seguimiento directamente.
		</p>

		<h2>¿Tu pedido no llegó?</h2>
		<p>
			Si tu pedido no llega en el tiempo estimado, escríbenos con tu
			número de pedido y lo investigamos con el courier de inmediato.
		</p>
	{/snippet}
</PaginaLegal>
