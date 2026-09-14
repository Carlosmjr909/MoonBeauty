import { dev } from '$app/environment';

/**
 * Anchos permitidos para la Optimización de Imágenes de Vercel. Tienen que
 * coincidir exactamente con "images.sizes" en vite.config.ts (Vercel
 * rechaza cualquier ancho que no esté en esa lista).
 */
export const ANCHOS_IMAGEN_OPTIMIZADA = [200, 300, 400, 600, 800, 1200] as const;

type AnchoImagenOptimizada = (typeof ANCHOS_IMAGEN_OPTIMIZADA)[number];

function anchoPermitido(ancho: number): AnchoImagenOptimizada {
	return (
		ANCHOS_IMAGEN_OPTIMIZADA.find((permitido) => permitido >= ancho) ??
		ANCHOS_IMAGEN_OPTIMIZADA[ANCHOS_IMAGEN_OPTIMIZADA.length - 1]
	);
}

/**
 * Foto de Firebase Storage redimensionada por Vercel a un ancho puntual.
 *
 * Solo tiene efecto con fotos absolutas de un dominio permitido en
 * "images.domains" (vite.config.ts) — hoy solo firebasestorage.googleapis.com.
 * Rutas locales (/logos/*.webp, etc.) se devuelven tal cual: ya están
 * optimizadas por Vite y no necesitan pasar por este endpoint.
 *
 * En desarrollo se devuelve la URL original sin tocar: el endpoint
 * /_vercel/image solo existe una vez desplegado en Vercel.
 */
export function fotoOptimizada(
	url: string | null | undefined,
	ancho: number,
	calidad = 75
): string {
	if (!url || dev || !url.startsWith('https://firebasestorage.googleapis.com/')) {
		return url ?? '';
	}

	const w = anchoPermitido(ancho);
	return `/_vercel/image?url=${encodeURIComponent(url)}&w=${w}&q=${calidad}`;
}

/**
 * Igual que fotoOptimizada, pero arma un "srcset" con varios anchos para
 * que el navegador elija la versión más chica que le alcance según el
 * tamaño real con el que se está mostrando la imagen (ver el atributo
 * "sizes" del <img>, que tiene que acompañar al srcset para que esto
 * funcione bien).
 */
export function srcsetOptimizado(
	url: string | null | undefined,
	anchos: number[] = [...ANCHOS_IMAGEN_OPTIMIZADA],
	calidad = 75
): string | undefined {
	if (!url || dev || !url.startsWith('https://firebasestorage.googleapis.com/')) {
		return undefined;
	}

	const unicos = [...new Set(anchos.map(anchoPermitido))].sort((a, b) => a - b);

	return unicos.map((w) => `${fotoOptimizada(url, w, calidad)} ${w}w`).join(', ');
}
