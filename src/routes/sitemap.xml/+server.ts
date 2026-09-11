import type { RequestHandler } from './$types';
import {
	obtenerCategoriasPublicas,
	obtenerProductosPublicos
} from '$lib/server/productos';
import { categoriasDeProducto } from '$lib/inventario';
import { SITIO_URL } from '$lib/seo';
import { SLUGS_LEGALES } from '$lib/server/legales';

type Entrada = {
	ruta: string;
	/** Fecha del último cambio, en formato AAAA-MM-DD. */
	fecha?: string;
	prioridad: string;
	frecuencia: 'daily' | 'weekly' | 'monthly' | 'yearly';
};

/** Escapa los caracteres que romperían el XML. */
function escaparXml(valor: string): string {
	return valor
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function comoFecha(milisegundos: number): string | undefined {
	if (!milisegundos) return undefined;

	const fecha = new Date(milisegundos);

	return Number.isNaN(fecha.getTime())
		? undefined
		: fecha.toISOString().slice(0, 10);
}

export const GET: RequestHandler = async ({ setHeaders }) => {
	const [productos, categoriasGuardadas] = await Promise.all([
		obtenerProductosPublicos().catch((error) => {
			console.error('Sitemap: no se pudieron leer los productos:', error);
			return [];
		}),
		obtenerCategoriasPublicas().catch((error) => {
			console.error('Sitemap: no se pudieron leer las categorías:', error);
			return [];
		})
	]);

	const entradas: Entrada[] = [
		{ ruta: '/', prioridad: '1.0', frecuencia: 'daily' },
		{ ruta: '/products', prioridad: '0.9', frecuencia: 'daily' },
		{ ruta: '/categorias', prioridad: '0.8', frecuencia: 'weekly' }
	];

	// Cada categoría es una página propia que la gente busca por su
	// nombre ("protector solar", "mascarillas"), así que va al sitemap.
	// Se juntan las guardadas en el panel con las que salen de los
	// productos, sin repetir.
	const nombresCategorias = new Set<string>();

	for (const categoria of categoriasGuardadas) {
		const nombre = categoria.nombre.trim();
		if (nombre) nombresCategorias.add(nombre);
	}

	for (const producto of productos) {
		for (const nombre of categoriasDeProducto(producto)) {
			const limpio = String(nombre).trim();
			if (limpio) nombresCategorias.add(limpio);
		}
	}

	for (const nombre of nombresCategorias) {
		entradas.push({
			ruta: `/products?categoria=${encodeURIComponent(nombre)}`,
			prioridad: '0.7',
			frecuencia: 'weekly'
		});
	}

	for (const producto of productos) {
		entradas.push({
			ruta: `/products/${producto.id}`,
			fecha: comoFecha(producto.fechaCreacion),
			prioridad: '0.8',
			frecuencia: 'weekly'
		});
	}

	for (const slug of SLUGS_LEGALES) {
		entradas.push({
			ruta: `/${slug}`,
			prioridad: '0.3',
			frecuencia: 'yearly'
		});
	}

	const cuerpo = entradas
		.map((entrada) => {
			const url = escaparXml(`${SITIO_URL}${entrada.ruta}`);

			return [
				'  <url>',
				`    <loc>${url}</loc>`,
				entrada.fecha ? `    <lastmod>${entrada.fecha}</lastmod>` : null,
				`    <changefreq>${entrada.frecuencia}</changefreq>`,
				`    <priority>${entrada.prioridad}</priority>`,
				'  </url>'
			]
				.filter(Boolean)
				.join('\n');
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${cuerpo}
</urlset>`;

	// Se cachea una hora: el catálogo no cambia tan seguido y evita
	// consultar la base de datos en cada visita del rastreador.
	setHeaders({
		'content-type': 'application/xml; charset=utf-8',
		'cache-control': 'public, max-age=3600, s-maxage=3600'
	});

	return new Response(xml);
};
