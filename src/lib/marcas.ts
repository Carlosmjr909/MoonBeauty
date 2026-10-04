/**
 * Marcas del catálogo, armadas a partir del campo "marca" de cada
 * producto. No importa Firebase: lo usan tanto el servidor (las vistas
 * /marcas) como el navegador (el buscador del encabezado).
 *
 * El nombre de la marca se escribe a mano en cada producto, así que la
 * misma marca puede aparecer escrita distinto ("TOCOBO" / "Tocobo",
 * "VT Cosmetics" / "Vt Cosmetics"). Para agruparlas se compara una clave
 * sin mayúsculas, acentos, espacios ni signos.
 */

type ProductoConMarca = { marca?: string | null };

export type MarcaCatalogo<P> = {
	/** Para la URL: /marcas/{slug}. */
	slug: string;
	nombre: string;
	/** Logo cargado en el panel (sección de marcas de la portada), si hay. */
	logo: string;
	productos: P[];
};

function sinAcentos(texto: string): string {
	return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** "Dr. Althea" → "dralthea": para saber si dos nombres son la misma marca. */
export function claveMarca(nombre: string): string {
	return sinAcentos(nombre).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** "Dr. Althea" → "dr-althea": legible en la URL. */
export function slugMarca(nombre: string): string {
	return (
		sinAcentos(nombre)
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'marca'
	);
}

/**
 * Agrupa los productos por marca, de la que más productos tiene a la que
 * menos (y por nombre si empatan). Los productos sin marca quedan fuera.
 * Si la marca tiene logo cargado en el panel, se usa ese nombre; si no,
 * la forma en que está escrita en más productos.
 */
export function agruparPorMarca<P extends ProductoConMarca>(
	productos: P[],
	logos: Array<{ nombre: string; imagen: string }> = []
): MarcaCatalogo<P>[] {
	const grupos = new Map<string, { productos: P[]; escrituras: Map<string, number> }>();

	for (const producto of productos) {
		const nombre = String(producto.marca ?? '').trim();
		const clave = claveMarca(nombre);
		if (!clave) continue;

		const grupo = grupos.get(clave) ?? {
			productos: [] as P[],
			escrituras: new Map<string, number>()
		};
		grupo.productos.push(producto);
		grupo.escrituras.set(nombre, (grupo.escrituras.get(nombre) ?? 0) + 1);
		grupos.set(clave, grupo);
	}

	const logoPorClave = new Map(
		logos.filter((logo) => logo.nombre.trim()).map((logo) => [claveMarca(logo.nombre), logo])
	);

	return [...grupos.entries()]
		.map(([clave, grupo]) => {
			const logo = logoPorClave.get(clave);
			const masUsada = [...grupo.escrituras.entries()].sort((a, b) => b[1] - a[1])[0][0];
			const nombre = logo?.nombre.trim() || masUsada;

			return {
				slug: slugMarca(nombre),
				nombre,
				logo: logo?.imagen ?? '',
				productos: grupo.productos
			};
		})
		.sort(
			(a, b) =>
				b.productos.length - a.productos.length || a.nombre.localeCompare(b.nombre, 'es')
		);
}

/** La marca de una URL /marcas/{slug}; tolera mayúsculas y guiones de más. */
export function buscarMarcaPorSlug<P>(marcas: MarcaCatalogo<P>[], slug: string) {
	const clave = claveMarca(slug);
	return marcas.find((marca) => marca.slug === slug || claveMarca(marca.nombre) === clave) ?? null;
}

/**
 * La marca que alguien está buscando en el buscador: la que se llama
 * exactamente así, o si no, la única cuyo nombre empieza con lo escrito
 * (desde 2 letras, para que "vt" encuentre VT Cosmetics; si varias
 * empiezan igual, como "dr", no se adivina).
 */
export function marcaBuscada<P>(marcas: MarcaCatalogo<P>[], texto: string) {
	const clave = claveMarca(texto);
	if (clave.length < 2) return null;

	const exacta = marcas.find((marca) => claveMarca(marca.nombre) === clave);
	if (exacta) return exacta;

	const empiezan = marcas.filter((marca) => claveMarca(marca.nombre).startsWith(clave));
	return empiezan.length === 1 ? empiezan[0] : null;
}
