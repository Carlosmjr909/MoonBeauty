<script lang="ts">
	import Icon from "@iconify/svelte";
</script>

<svelte:head>
	<title>Panel de administración | Moon Beauty</title>
</svelte:head>

<section class="mx-auto max-w-3xl px-6 py-16">
	<p class="font-Manrope text-3xl text-slate-700">Panel de administración</p>

	<div class="mt-8 grid gap-4 sm:grid-cols-2">
		<a
			href="/admin/pedidos"
			class="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
		>
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-slate-700"
			>
				<Icon icon="material-symbols:receipt-long-outline" width="26" />
			</div>

			<p class="mt-4 font-Manrope text-xl text-slate-700">Pedidos</p>

			<p class="mt-1 text-sm leading-6 text-slate-500">
				Revisa los pedidos que entran, contacta al cliente por WhatsApp y
				marca su estado hasta la entrega.
			</p>
		</a>

		<a
			href="/admin/inventario"
			class="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
		>
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-slate-700"
			>
				<Icon icon="material-symbols:inventory-2-outline" width="26" />
			</div>

			<p class="mt-4 font-Manrope text-xl text-slate-700">Inventario</p>

			<p class="mt-1 text-sm leading-6 text-slate-500">
				Agrega y edita productos, controla el stock y administra las
				categorías de la tienda.
			</p>
		</a>

		<a
			href="/admin/cupones"
			class="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
		>
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-slate-700"
			>
				<Icon icon="material-symbols:local-offer-outline" width="26" />
			</div>

			<p class="mt-4 font-Manrope text-xl text-slate-700">Cupones</p>

			<p class="mt-1 text-sm leading-6 text-slate-500">
				Crea cupones de descuento, ponles vencimiento y límite de usos,
				y envíaselos por correo a tus clientes.
			</p>
		</a>

		<a
			href="/admin/contenido"
			class="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
		>
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-slate-700"
			>
				<Icon icon="material-symbols:auto-awesome-mosaic-outline" width="26" />
			</div>

			<p class="mt-4 font-Manrope text-xl text-slate-700">
				Contenido de la portada
			</p>

			<p class="mt-1 text-sm leading-6 text-slate-500">
				Sube las publicaciones de Instagram y administra los logos de
				las marcas que aparecen en la página de inicio.
			</p>
		</a>

		<a
			href="/admin/legales"
			class="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
		>
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-slate-700"
			>
				<Icon icon="material-symbols:gavel-rounded" width="26" />
			</div>

			<p class="mt-4 font-Manrope text-xl text-slate-700">
				Páginas legales
			</p>

			<p class="mt-1 text-sm leading-6 text-slate-500">
				Edita las políticas de envío, cambios y devoluciones, términos
				y condiciones, y privacidad.
			</p>
		</a>

		<a
			href="/admin/configuracion"
			class="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
		>
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-slate-700"
			>
				<Icon icon="material-symbols:credit-card-outline" width="26" />
			</div>

			<p class="mt-4 font-Manrope text-xl text-slate-700">
				Configuración del sitio
			</p>

			<p class="mt-1 text-sm leading-6 text-slate-500">
				Datos de pago y banner, los textos de la portada, y la
				información de contacto del pie de página.
			</p>
		</a>
	</div>
</section>
