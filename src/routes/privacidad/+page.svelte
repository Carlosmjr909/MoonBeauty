<script lang="ts">
	import PaginaLegal from "$lib/components/PaginaLegal.svelte";
</script>

<svelte:head>
	<title>Política de Privacidad | Moon Beauty</title>
</svelte:head>

<PaginaLegal
	titulo="Política de Privacidad"
	actualizado="2 de septiembre de 2026"
>
	{#snippet children()}
		<p>
			En Moon Beauty cuidamos tus datos igual que tu piel: con
			cuidado y transparencia. Aquí te explicamos qué información
			recopilamos, para qué la usamos y qué puedes hacer al respecto.
		</p>

		<h2>1. Qué datos recopilamos</h2>
		<ul>
			<li>
				<strong>Datos de contacto:</strong> nombre, correo electrónico
				y/o número de teléfono que ingresas al comprar o crear una cuenta.
			</li>
			<li>
				<strong>Datos de entrega:</strong> dirección, ciudad, estado y,
				si lo usas, la ubicación que marques en el mapa al hacer checkout.
			</li>
			<li>
				<strong>Datos del pedido:</strong> productos comprados, método
				de pago elegido y el comprobante o número de referencia de pago
				que subas.
			</li>
			<li>
				<strong>Datos de cuenta</strong> (si te registras): correo y,
				si inicias sesión con Google, tu nombre y foto de perfil públicos
				de esa cuenta.
			</li>
			<li>
				<strong>Datos técnicos básicos:</strong> el carrito de compras
				se guarda en tu propio navegador (localStorage) para que no lo
				pierdas al recargar la página.
			</li>
		</ul>

		<h2>2. Para qué usamos tus datos</h2>
		<ul>
			<li>Procesar, confirmar y coordinar la entrega de tus pedidos.</li>
			<li>
				Contactarte por WhatsApp, correo o teléfono sobre tu compra.
			</li>
			<li>
				Enviarte novedades o promociones, solo si te suscribes
				voluntariamente a nuestro boletín.
			</li>
			<li>Mejorar el catálogo y el funcionamiento del sitio.</li>
			<li>Prevenir fraude y verificar los pagos reportados.</li>
		</ul>

		<h2>3. Con quién compartimos tus datos</h2>
		<p>
			No vendemos tus datos. Los compartimos únicamente con los
			proveedores que usamos para operar el sitio:
		</p>
		<ul>
			<li>
				<strong>Firebase / Google Cloud:</strong> aloja nuestra base de
				datos, autenticación e imágenes.
			</li>
			<li>
				<strong>Resend:</strong> envía los correos de confirmación de pedido.
			</li>
			<li>
				<strong>WhatsApp (Meta):</strong> cuando nos escribes o te escribimos
				para coordinar tu compra.
			</li>
			<li>
				<strong>Google Maps</strong> (si está disponible al momento de
				tu compra): solo si eliges marcar tu ubicación de entrega en el
				mapa.
			</li>
		</ul>

		<h2>4. Cómo protegemos tus datos</h2>
		<p>
			El sitio funciona bajo conexión segura (HTTPS) y nuestra base de
			datos tiene reglas de acceso que impiden que un usuario vea los
			datos de otro. Solo el equipo de Moon Beauty puede consultar los
			pedidos para gestionarlos.
		</p>

		<h2>5. Cookies y almacenamiento local</h2>
		<p>
			El sitio guarda tu carrito de compras en el almacenamiento local
			de tu navegador (localStorage), no en un servidor, y solo tu
			navegador puede leerlo. Para mantener tu sesión iniciada
			usamos las cookies/almacenamiento propios de Firebase
			Authentication. No usamos cookies de publicidad ni de
			rastreo de terceros.
		</p>

		<h2>6. Tus derechos</h2>
		<p>
			Puedes pedirnos en cualquier momento acceder, corregir o eliminar
			tus datos personales, o dejar de recibir nuestro boletín,
			escribiéndonos a
			<a href="mailto:moonbeautyval@gmail.com">moonbeautyval@gmail.com</a>.
			Atenderemos tu solicitud en un plazo razonable.
		</p>

		<h2>7. Cuánto tiempo guardamos tus datos</h2>
		<p>
			Conservamos los datos de tus pedidos mientras sea necesario para
			fines contables, de garantía y de atención al cliente. Si
			solicitas la eliminación de tu cuenta, eliminamos tus datos
			personales salvo lo que debamos conservar por obligaciones
			legales o contables.
		</p>

		<h2>8. Menores de edad</h2>
		<p>
			Este sitio no está dirigido a menores de edad. Si eres menor,
			realiza tus compras con la supervisión de un adulto responsable.
		</p>

		<h2>9. Cambios a esta política</h2>
		<p>
			Podemos actualizar esta política ocasionalmente; la fecha de la
			última actualización se indica arriba.
		</p>

		<h2>10. Contacto</h2>
		<p>
			Si tienes preguntas sobre el manejo de tus datos, escríbenos a
			<a href="mailto:moonbeautyval@gmail.com">moonbeautyval@gmail.com</a>
			o por
			<a href="https://wa.me/584125050043" target="_blank" rel="noreferrer"
				>WhatsApp</a
			>.
		</p>
	{/snippet}
</PaginaLegal>
