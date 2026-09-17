<script lang="ts">
	import Icon from "@iconify/svelte";

	const puntos = [
		{
			icono: "material-symbols:verified-user-outline",
			color: "bg-sky-100 text-sky-700",
			titulo: "Skincare Coreano Original",
			descripcion: "Sellos y trazabilidad directa verificada desde Seúl.",
		},
		{
			icono: "material-symbols:local-shipping-outline",
			color: "bg-sky-100 text-sky-700",
			titulo: "Envíos a Toda Venezuela",
			descripcion: "MRW, Tealca y Zoom con guías aseguradas diarias.",
		},
		{
			icono: "material-symbols:moped-outline",
			color: "bg-rose-100 text-rose-600",
			titulo: "Delivery en Valencia",
			descripcion: "Entregas exprés en 24h dentro del área metropolitana.",
		},
		{
			icono: "material-symbols:speed-outline",
			color: "bg-sky-100 text-sky-700",
			titulo: "Atención Personalizada",
			descripcion: "Asesoría dermocosmética 1 a 1 vía WhatsApp.",
		},
	];
</script>

<section class="py-8 sm:py-10 lg:py-14">
	<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px]">
		<div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
			{#each puntos as punto (punto.titulo)}
				<div class="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 sm:gap-3 sm:p-5">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 {punto.color}"
					>
						<Icon icon={punto.icono} width="18" class="sm:hidden" />
						<Icon icon={punto.icono} width="22" class="hidden sm:block" />
					</div>

					<div class="min-w-0">
						<p class="break-words font-Manrope text-xs font-bold text-slate-800 sm:text-base">
							{punto.titulo}
						</p>
						<p class="mt-1 break-words text-[11px] leading-snug text-slate-500 sm:text-sm">
							{punto.descripcion}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
