<script lang="ts">
	import PaginaLegal from "$lib/components/PaginaLegal.svelte";
</script>

<svelte:head>
	<title>Términos y Condiciones | Moon Beauty</title>
</svelte:head>

<PaginaLegal
	titulo="Términos y Condiciones"
	actualizado="2 de septiembre de 2026"
>
	{#snippet children()}
		<p>
			Bienvenido/a a Moon Beauty (<strong>moonbeautyval</strong>). Al
			navegar y comprar en este sitio aceptas los términos descritos a
			continuación. Si tienes dudas, escríbenos por WhatsApp o correo
			antes de confirmar tu pedido.
		</p>

		<h2>1. Quiénes somos</h2>
		<p>
			Moon Beauty es una tienda que selecciona y distribuye productos de
			cuidado de la piel de origen coreano (K-Beauty) en Venezuela,
			operando principalmente desde Valencia, Estado Carabobo.
		</p>

		<h2>2. Elegibilidad</h2>
		<p>
			Para comprar en Moon Beauty debes ser mayor de edad (18 años o
			más) o realizar tu compra con la autorización y supervisión de
			un adulto responsable.
		</p>

		<h2>3. Productos y precios</h2>
		<p>
			Todos los precios se muestran en dólares (USD) y su referencia en
			bolívares (VES) se calcula con la tasa oficial del Banco Central
			de Venezuela (BCV) del momento, la cual puede variar entre el
			instante en que ves un precio y el momento del pago. El precio
			final a pagar es el vigente al confirmar tu pedido.
		</p>
		<p>
			Trabajamos con inventario limitado: la disponibilidad mostrada en
			el sitio puede cambiar. Si un producto de tu pedido se agota antes
			de confirmarse el pago, te lo notificaremos y podrás elegir un
			reemplazo o el reembolso de esa unidad.
		</p>
		<p>
			Si por un error humano o técnico un precio se muestra
			incorrecto de forma evidente, nos reservamos el derecho de
			cancelar el pedido afectado y notificarte, ofreciéndote el
			precio correcto o el reembolso correspondiente.
		</p>

		<h2>4. Cómo se procesa un pedido</h2>
		<p>
			Puedes comprar con o sin crear una cuenta. Al finalizar la
			compra generamos un número de pedido y coordinamos contigo por
			WhatsApp o correo electrónico para confirmar el pago y la
			entrega. El pedido se considera confirmado cuando verificamos el
			pago (comprobante o referencia) que subiste en el checkout.
		</p>

		<h2>5. Métodos de pago</h2>
		<p>
			Aceptamos efectivo, pago móvil, Binance, Zelle y Zinli. No
			procesamos pagos con tarjeta directamente en el sitio: cada
			pedido se verifica de forma manual con el comprobante o número de
			referencia que nos envíes. El cupón de descuento vigente aplica
			únicamente a los métodos de pago indicados en el checkout.
		</p>

		<h2>6. Envíos y devoluciones</h2>
		<p>
			Consulta los detalles de cobertura y tiempos en nuestra <a
				href="/envios">Política de Envíos</a
			>, y las condiciones para cambios o devoluciones en nuestra <a
				href="/cambios-y-devoluciones">Política de Cambios y Devoluciones</a
			>.
		</p>

		<h2>7. Cuentas de usuario</h2>
		<p>
			Crear una cuenta es opcional. Si te registras, eres responsable
			de mantener la confidencialidad de tus datos de acceso y de la
			actividad realizada desde tu cuenta.
		</p>

		<h2>8. Uso del sitio y propiedad intelectual</h2>
		<p>
			El contenido de este sitio (textos, imágenes, logo y diseño) es
			propiedad de Moon Beauty o de sus proveedores y no puede
			reproducirse sin autorización. Te pedimos usar el sitio de buena
			fe y no intentar vulnerar su funcionamiento o seguridad.
		</p>

		<h2>9. Marcas de terceros</h2>
		<p>
			Moon Beauty selecciona, importa y revende productos de marcas de
			terceros (por ejemplo, marcas coreanas de skincare). Los nombres,
			logos y marcas de esos productos pertenecen a sus respectivos
			fabricantes. Moon Beauty no es el fabricante de dichos productos
			ni, salvo que se indique expresamente, un distribuidor oficial o
			representante autorizado de esas marcas.
		</p>

		<h2>10. Limitación de responsabilidad</h2>
		<p>
			Hacemos lo posible por mostrar información precisa de cada
			producto, pero no garantizamos que esté libre de errores. Moon
			Beauty no se hace responsable por reacciones alérgicas o de
			sensibilidad a los ingredientes: te recomendamos revisar la lista
			de ingredientes y hacer una prueba de parche antes del primer uso.
		</p>

		<h2>11. Ley aplicable y resolución de disputas</h2>
		<p>
			Estos términos se rigen por las leyes de la República
			Bolivariana de Venezuela. Cualquier controversia relacionada con
			el uso del sitio o tus compras se intentará resolver primero de
			forma directa y amistosa, escribiéndonos por los canales de
			contacto indicados abajo; de no llegar a un acuerdo, se
			someterá a los tribunales competentes de Venezuela.
		</p>

		<h2>12. Cambios a estos términos</h2>
		<p>
			Podemos actualizar estos términos en cualquier momento; la fecha
			de la última actualización se indica arriba. El uso continuo del
			sitio después de un cambio implica tu aceptación de la nueva
			versión.
		</p>

		<h2>13. Contacto</h2>
		<p>
			Para cualquier duda sobre estos términos, escríbenos a <a
				href="mailto:moonbeautyval@gmail.com">moonbeautyval@gmail.com</a
			>
			o por
			<a href="https://wa.me/584125050043" target="_blank" rel="noreferrer"
				>WhatsApp</a
			>.
		</p>
	{/snippet}
</PaginaLegal>
