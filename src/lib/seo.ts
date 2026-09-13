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

/**
 * Descripción de cada categoría, en dos lugares a la vez: como texto de
 * la tarjeta en /categorias, y como base de la meta descripción de
 * /products?categoria=X. Cada categoría del catálogo es una página
 * propia en el sitemap, así que le conviene una descripción distinta a
 * la de las demás para que Google entienda de qué trata cada una.
 *
 * Si en el panel se crea una categoría nueva que no está en esta lista,
 * se arma una descripción genérica a partir de su nombre en vez de
 * dejarla sin nada.
 */
export function descripcionCategoria(nombre: string): string {
	switch (nombre.trim().toLowerCase()) {
		case 'protector solar':
			return 'Protección diaria con fórmulas ligeras, cómodas y con cobertura de alto nivel, ideales para pieles sensibles.';
		case 'limpiadores faciales':
			return 'Geles, espumas y bálsamos de limpieza que retiran impurezas y maquillaje sin resecar la piel.';
		case 'cremas faciales':
			return 'Cremas hidratantes y nutritivas para el día y la noche, según cada tipo de piel.';
		case 'serums o ampollas':
			return 'Fórmulas concentradas con activos como niacinamida, vitamina C o ácido hialurónico para tratar necesidades específicas de la piel.';
		case 'mascarillas faciales':
			return 'Mascarillas y tratamientos exprés para calmar, hidratar y darle luminosidad a la piel.';
		case 'tonicos':
			return 'Tónicos para equilibrar el pH de la piel y preparar el rostro para el resto de la rutina.';
		case 'contornos de ojos':
			return 'Cremas y gel-contornos para hidratar, reducir bolsas y cuidar la piel más delicada del rostro.';
		case 'cuidado corporal':
			return 'Cremas, exfoliantes y aceites corporales para hidratar y cuidar la piel de todo el cuerpo.';
		case 'cuidado capilar':
			return 'Shampoos, tratamientos y sueros capilares para fortalecer y darle brillo al cabello.';
		case 'maquillaje y accesorios':
			return 'Maquillaje coreano y accesorios de skincare para completar tu rutina de belleza.';
		case 'kits':
			return 'Sets y combos armados para empezar o completar tu rutina de skincare coreano.';
		case 'suplementos':
			return 'Suplementos para complementar el cuidado de la piel desde adentro.';
		default:
			return `Productos de ${nombre} seleccionados para tu rutina de skincare coreano.`;
	}
}
