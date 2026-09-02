<script lang="ts">
	interface PropTypes {
		nombre: string;
		descripcion: string;
		imagen: string;
		cantidad: number;
		href: string;
	}

	let {
		nombre,
		descripcion,
		imagen,
		cantidad,
		href
	}: PropTypes = $props();
</script>

<article class="group h-full">
	<a
		href={href}
		class="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl sm:rounded-[28px]"
	>
		<div class="relative aspect-4/3 overflow-hidden">
			<img
				src={imagen}
				alt={nombre}
				class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
			/>
			<span
				class="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-700 backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.2em]"
			>
				{cantidad} productos
			</span>
		</div>

		<div class="flex flex-1 flex-col justify-between p-3 sm:p-5">
			<div class="space-y-1.5 sm:space-y-3">
				<p class="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600 sm:block">
					Categoría
				</p>
				<h2 class="font-Mendigo text-base text-slate-800 sm:text-2xl lg:text-3xl">
					{nombre}
				</h2>
				<p class="hidden text-sm leading-6 text-slate-600 lg:block">
					{descripcion}
				</p>
			</div>

			<div class="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 sm:mt-5 sm:pt-4">
				<span class="text-xs font-semibold text-slate-800 sm:text-sm">Explorar</span>
				<span class="flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-base text-sky-700 transition group-hover:bg-sky-600 group-hover:text-white sm:h-9 sm:w-9 sm:text-lg">
					→
				</span>
			</div>
		</div>
	</a>
</article>
