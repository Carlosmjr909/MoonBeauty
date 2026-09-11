/**
 * Datos para la vista previa que aparece al compartir un link del sitio
 * (WhatsApp, Instagram, Facebook, Telegram, etc.).
 */

export const SITIO_URL = 'https://www.moonbeautyval.com';

/** Imagen por defecto: 1200x630, en JPG y liviana, como piden estas apps. */
export const IMAGEN_POR_DEFECTO = `${SITIO_URL}/og-imagen.jpg`;

export type DatosSeo = {
	titulo: string;
	descripcion: string;
	imagen: string;
	tipo: 'website' | 'article';
};

export const SEO_POR_DEFECTO: DatosSeo = {
	titulo: 'Moon Beauty · Skincare coreano en Venezuela',
	descripcion:
		'Skincare coreano seleccionado para elevar tu rutina diaria. Envíos a toda Venezuela desde Valencia, Carabobo.',
	imagen: IMAGEN_POR_DEFECTO,
	tipo: 'website'
};

/**
 * Elige qué imagen usar para la vista previa.
 *
 * WhatsApp no renderiza WebP en las vistas previas: si se le pasa una,
 * el link aparece sin imagen. Como en la tienda hay fotos en WebP y en
 * JPG mezcladas, aquí se usa la del producto solo cuando el formato es
 * compatible, y si no se cae a la imagen general de la tienda (que
 * siempre se ve) en vez de quedar sin nada.
 */
export function imagenParaCompartir(imagen?: string | null): string {
	if (!imagen) return IMAGEN_POR_DEFECTO;

	// Las URLs de Firebase Storage traen "?alt=media&token=..." al final.
	const sinParametros = imagen.split('?')[0].toLowerCase();

	const compatible =
		sinParametros.endsWith('.jpg') ||
		sinParametros.endsWith('.jpeg') ||
		sinParametros.endsWith('.png');

	if (!compatible) return IMAGEN_POR_DEFECTO;

	return imagen.startsWith('http') ? imagen : `${SITIO_URL}${imagen}`;
}

/** Recorta un texto largo para que entre en la vista previa. */
export function recortar(texto: string, maximo = 160): string {
	const limpio = texto.replace(/\s+/g, ' ').trim();

	if (limpio.length <= maximo) return limpio;

	return `${limpio.slice(0, maximo - 1).trimEnd()}…`;
}
