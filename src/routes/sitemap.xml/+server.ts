import type { RequestHandler } from './$types';
import { obtenerProductosPublicos } from '$lib/server/productos';
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
	const productos = await obtenerProductosPublicos().catch((error) => {
		console.error('Sitemap: no se pudieron leer los productos:', error);
		return [];
	});

	const entradas: Entrada[] = [
		{ ruta: '/', prioridad: '1.0', frecuencia: 'daily' },
		{ ruta: '/products', prioridad: '0.9', frecuencia: 'daily' },
		{ ruta: '/categorias', prioridad: '0.8', frecuencia: 'weekly' },
		{ ruta: '/preguntas-frecuentes', prioridad: '0.5', frecuencia: 'monthly' }
	];

	// Las vistas filtradas por categoría (/products?categoria=X) ya NO
	// van al sitemap: son casi el mismo contenido que /products, así
	// que competían por presupuesto de rastreo con las páginas de
	// producto reales sin aportar valor propio a Google. La página
	// "/categorias" sigue en el sitemap porque esa sí es una página
	// distinta.
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
