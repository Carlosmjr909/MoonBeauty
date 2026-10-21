/**
 * "Encuentra tu rutina ideal": qué productos se recomiendan según el tipo
 * de piel y la preocupación, y el 10 % de descuento por comprar la rutina
 * completa.
 *
 * Lo usan el diagnóstico de la portada, el carrito y el checkout (para
 * mostrar el descuento) y también el servidor al crear el pedido, que
 * vuelve a armar la rutina con el catálogo y solo descuenta si el carrito
 * trae exactamente esos productos. Así el descuento no depende de nada
 * que el navegador pueda inventar.
 */

export type TipoPiel = 'Seca' | 'Grasa' | 'Mixta' | 'Normal' | 'Sensible';
export type Preocupacion =
	| 'Hidratación'
	| 'Manchas'
	| 'Acné'
	| 'Poros Dilatados'
	| 'Luminosidad'
	| 'Barrera Cutánea';
export type PasoRutina = 'limpiador' | 'tratamiento' | 'hidratante';

export const TIPOS_PIEL: TipoPiel[] = ['Seca', 'Grasa', 'Mixta', 'Normal', 'Sensible'];
export const PREOCUPACIONES: Preocupacion[] = [
	'Hidratación',
	'Manchas',
	'Acné',
	'Poros Dilatados',
	'Luminosidad',
	'Barrera Cutánea'
];

/** Descuento por comprar la rutina completa. */
export const DESCUENTO_RUTINA = 0.1;

/** Lo mínimo que hace falta de cada producto del catálogo. */
export type ProductoParaRutina = {
	id: string;
	Nombre: string;
	marca?: string;
	imagen: string;
	precio: number;
	stock: number;
	Tipo?: string;
	categorias?: string[];
};

export type ProductoRutina = {
	id: string;
	Nombre: string;
	marca: string;
	imagen: string;
	precio: number;
	stock: number;
	beneficio: string;
};

export type PasoArmado = {
	paso: PasoRutina;
	etiqueta: string;
	numero: number;
	producto: ProductoRutina;
};

/** La rutina que la persona armó, tal como se guarda y se manda al servidor. */
export type RutinaElegida = {
	tipoPiel: TipoPiel;
	preocupacion: Preocupacion;
	ids: Partial<Record<PasoRutina, string>>;
};

/**
 * Productos recomendados para un paso, en orden de preferencia (por su
 * id en el inventario). Se muestra el primero que siga existiendo y
 * tenga stock; así, si uno se elimina o se agota, entra el siguiente
 * sin tocar el código.
 */
type Opcion = { ids: string[]; beneficio: string };

// Paso 1 — Limpiador, elegido según el tipo de piel.
const limpiadores: Record<TipoPiel, Opcion> = {
	Grasa: {
		ids: [
			'9ttpK1YiaSF8tNDe2M2Q', // Be The Skin BHA+ Pore Zero Cleansing Foam
			'z3ToOEGCXE41SWCqREeT', // Sungboon Editor Green Tomato Deep Pore Foam
			'O7VqdvmM0AIYlVtwpcq0', // Tocobo Coconut Clay Cleansing Foam
			'K3KtPslI6ULkwu1Y0ueP' // COSRX Salicylic Acid Cleanser (mini)
		],
		beneficio: 'Limpieza profunda y control de brillo'
	},
	Seca: {
		ids: [
			'6ZsTWjI26HBznC6p38EM', // Mixsoon Bean Cleansing Oil
			'i39nSty6ezUjx8Z5E8Gs', // Pyunkang Yul Deep Cleansing Oil
			'Xt0HXKQuTxWa9FBjXix6' // Mixsoon PDRN Collagen Gel Cleanser
		],
		beneficio: 'Primer paso suave y muy hidratante'
	},
	Mixta: {
		ids: [
			'JAi7uO5HSSeDov7yZjTT', // Anua Heartleaf Pore Cleansing Foam Double Set
			'jQGhofSZtNkjvJdHFZCE', // Anua Heartleaf Quercetinol Pore Deep Cleansing Foam
			'bPwiboeYX3et5O5s0jt9', // Round Lab 1025 Dokdo Cleanser
			'N5KXTLrGDZ9Jyd7TVXow' // Fully Green Tomato Clay Pack Cleanser
		],
		beneficio: 'Paso de limpieza profunda'
	},
	Normal: {
		ids: [
			'Sp4umofUowF7CxyMkLut', // Mixsoon Centella Cleansing Foam
			'bPwiboeYX3et5O5s0jt9', // Round Lab 1025 Dokdo Cleanser
			'OCLddqZGb0V54XD96HWD' // COSRX Low pH Good Morning Cleanser (mini)
		],
		beneficio: 'Limpieza equilibrada para uso diario'
	},
	Sensible: {
		ids: [
			'9SaFx8L7bg4rf41xjzA4', // Pyunkang Yul Low pH Cleansing Water
			'esb1HBfpOiJjvqu5Mwwk', // Celimax Madecica pH Balancing Foam
			'gW64dChslnCJH9gBM1pm' // Purito Mighty Bamboo Panthenol Cleanser
		],
		beneficio: 'Limpieza suave, ideal para piel reactiva'
	}
};

// Paso 2 — Tratamiento o activo, elegido según la preocupación principal.
const tratamientos: Record<Preocupacion, Opcion> = {
	Hidratación: {
		ids: [
			'7DUzhmKfaM99FM564WTS', // Mixsoon PDRN Collagen Serum
			'iIzoml2gZgdy6LwApLTC', // Medicube PDRN Pink Peptide Serum
			'VJarqTRTMK3hTkmLnGKP' // Medicube Triple Collagen Serum 4.0
		],
		beneficio: 'Hidratación profunda y efecto plump'
	},
	Manchas: {
		ids: [
			'qOEZvukkZOLx1dnQArkz', // Purito TXA 6 Niacinamide 10 Retinal Serum
			'p1OGARH1wW83X5ZPHsxk', // Nineless B-Boost 10% Niacinamide Serum
			'srL7Deb4Yq30gNGt6qCR' // Arencia Vitamin C Booster Shot
		],
		beneficio: 'Ataca manchas oscuras y marcas'
	},
	Acné: {
		ids: [
			'jrc3U2jdRzgwxWsuuCnO', // Skin1004 Centella Tone Brightening Capsule Ampoule
			'nFcTNX3rlKLNbDL0QPXx', // Medicube Azelaic Acid 16 BB Soothing Serum
			'pbZrUpejonjcRenJiLqD' // Fully Green Tomato Serum
		],
		beneficio: 'Calma brotes e irritación'
	},
	'Poros Dilatados': {
		ids: [
			'OOpbOHIr2BaqUjTzHQJW', // Veramore Shrink Pore Spicule 300 Ampoule
			'gf7vVCJeTlpHAO5zZtKt', // VT Cosmetics Reedle Shot 100
			'pbZrUpejonjcRenJiLqD' // Fully Green Tomato Serum
		],
		beneficio: 'Minimiza poros visiblemente'
	},
	Luminosidad: {
		ids: [
			'QLVgs3laCH12NlYIEgBQ', // Medicube Collagen Glow Booster Serum
			'srL7Deb4Yq30gNGt6qCR', // Arencia Vitamin C Booster Shot
			'w4bGv40RNEdnK73m60U1' // Dr. Melaxin Peel Shot White Rice Ampoule
		],
		beneficio: 'Ilumina y da luminosidad'
	},
	'Barrera Cutánea': {
		ids: [
			'xIVkOB4xUV5Of51xLlLO', // Purito Wonder Releaf Centella Serum
			'29nhSrP4GhNh27fKcr5j' // Medicube Exosome Cica Ampoule
		],
		beneficio: 'Repara y fortalece la barrera'
	}
};

// Paso 3 — Hidratante o protector solar, elegido según el tipo de piel.
const hidratantes: Record<TipoPiel, Opcion> = {
	Grasa: {
		ids: [
			'jDgb2lxBflQFwzc6f0AN', // Celimax Oil Control Mattifying Sun Stick
			'hmk80QTxsD9qOVBKQxLZ', // Medicube Zero Pore Moisture Sun Serum
			'YZ4Ih8Tii0UNesASD58Z' // Tocobo Bio Watery Sun Cream
		],
		beneficio: 'Protección sin sensación grasa'
	},
	Seca: {
		ids: [
			'HjlpWEJqgfUfgph89E9l', // Centellian24 Expert Madeca Cream PDRN
			'D5RyNL5y7X410JzVV6bH', // Mixsoon PDRN Collagen Cream
			'Np4sztcj6OFDC7DwL50f' // Fully Rice Ceramide Moisture Sun Cream
		],
		beneficio: 'Hidratación intensa y nutrición'
	},
	Mixta: {
		ids: [
			'f1RBmZPgnDnZdAhnVFfg', // Beauty of Joseon Relief Sun Rice + Probiotics
			'Np4sztcj6OFDC7DwL50f', // Fully Rice Ceramide Moisture Sun Cream
			'YZ4Ih8Tii0UNesASD58Z' // Tocobo Bio Watery Sun Cream
		],
		beneficio: 'Protección sin sensación grasa'
	},
	Normal: {
		ids: [
			'YZ4Ih8Tii0UNesASD58Z', // Tocobo Bio Watery Sun Cream
			'1', // Tocobo Cotton Soft Sun Stick
			'Np4sztcj6OFDC7DwL50f' // Fully Rice Ceramide Moisture Sun Cream
		],
		beneficio: 'Protección diaria ligera'
	},
	Sensible: {
		ids: [
			'pa1XcmQfzXSpO5sVJvMF', // Dr. Althea Green Tea Fresh Sunscreen
			'Yy9WLCni7qr3qCbhDi9n', // Round Lab Pine Calming Cica Cream
			'QImTOBorN2i8bxouQGuJ' // Pyunkang Yul Ultimate Calming Solution Cream
		],
		beneficio: 'Protección suave para piel sensible'
	}
};

// Si ninguno de los recomendados está disponible, se usa el producto
// con más stock de la categoría del paso, para que nunca quede vacío.
const categoriasRespaldo: Record<PasoRutina, string[]> = {
	limpiador: ['Limpiadores Faciales'],
	tratamiento: ['Serums o Ampollas'],
	hidratante: ['Protector solar', 'Cremas Faciales']
};

const PASOS: { paso: PasoRutina; etiqueta: string }[] = [
	{ paso: 'limpiador', etiqueta: 'Limpiador' },
	{ paso: 'tratamiento', etiqueta: 'Tratamiento' },
	{ paso: 'hidratante', etiqueta: 'Hidratante / Protector' }
];

export function esTipoPiel(valor: unknown): valor is TipoPiel {
	return TIPOS_PIEL.includes(valor as TipoPiel);
}

export function esPreocupacion(valor: unknown): valor is Preocupacion {
	return PREOCUPACIONES.includes(valor as Preocupacion);
}

function opcionDelPaso(paso: PasoRutina, tipo: TipoPiel, preocupacion: Preocupacion): Opcion {
	if (paso === 'limpiador') return limpiadores[tipo];
	if (paso === 'tratamiento') return tratamientos[preocupacion];
	return hidratantes[tipo];
}

function categoriasDe(producto: ProductoParaRutina): string[] {
	return producto.categorias?.length
		? producto.categorias
		: producto.Tipo
			? [producto.Tipo]
			: [];
}

const disponible = (producto?: ProductoParaRutina) => !!producto && Number(producto.stock) > 0;

/** El producto con más stock de la categoría del paso (sin kits). */
function productoDeRespaldo(
	respaldo: string[],
	productos: ProductoParaRutina[]
): ProductoParaRutina | undefined {
	return productos
		.filter(
			(producto) =>
				disponible(producto) &&
				categoriasDe(producto).some((categoria) => respaldo.includes(categoria)) &&
				!categoriasDe(producto).includes('Kits')
		)
		.sort((a, b) => Number(b.stock) - Number(a.stock))[0];
}

function elegirProducto(
	opcion: Opcion,
	respaldo: string[],
	productos: ProductoParaRutina[],
	porId: Map<string, ProductoParaRutina>
): ProductoRutina | null {
	const elegido =
		opcion.ids.map((id) => porId.get(id)).find(disponible) ?? productoDeRespaldo(respaldo, productos);

	if (!elegido) return null;

	return {
		id: String(elegido.id),
		Nombre: elegido.Nombre,
		marca: elegido.marca ?? '',
		imagen: elegido.imagen,
		precio: Number(elegido.precio) || 0,
		stock: Number(elegido.stock) || 0,
		beneficio: opcion.beneficio
	};
}

/** La rutina recomendada para ese tipo de piel y esa preocupación. */
export function armarRutina(
	tipo: TipoPiel,
	preocupacion: Preocupacion,
	productos: ProductoParaRutina[]
): PasoArmado[] {
	const porId = new Map(productos.map((producto) => [String(producto.id), producto]));

	return PASOS.flatMap(({ paso, etiqueta }) => {
		const producto = elegirProducto(
			opcionDelPaso(paso, tipo, preocupacion),
			categoriasRespaldo[paso],
			productos,
			porId
		);
		return producto ? [{ paso, etiqueta, producto }] : [];
	}).map((paso, indice) => ({ ...paso, numero: indice + 1 }));
}

/**
 * Cuántas rutinas completas trae el carrito y cuánto se descuenta: el 10 %
 * del precio de los productos de la rutina, una vez por cada rutina
 * completa (con 2 de cada producto, dos rutinas). Las unidades sueltas que
 * sobran van a precio normal.
 */
export function calcularDescuentoRutina(
	lineas: { id: string | number; precio: number; cantidad: number }[],
	idsRutina: string[]
): { rutinas: number; descuentoUSD: number } {
	if (idsRutina.length === 0) return { rutinas: 0, descuentoUSD: 0 };

	const porId = new Map<string, { precio: number; cantidad: number }>();
	for (const linea of lineas) {
		const id = String(linea.id);
		const actual = porId.get(id);
		porId.set(id, {
			precio: Number(linea.precio) || 0,
			cantidad: (actual?.cantidad ?? 0) + (Number(linea.cantidad) || 0)
		});
	}

	const rutinas = Math.min(...idsRutina.map((id) => Math.floor(porId.get(id)?.cantidad ?? 0)));
	if (!(rutinas > 0)) return { rutinas: 0, descuentoUSD: 0 };

	const precioRutina = idsRutina.reduce((suma, id) => suma + (porId.get(id)?.precio ?? 0), 0);
	return {
		rutinas,
		descuentoUSD: Math.round(precioRutina * rutinas * DESCUENTO_RUTINA * 100) / 100
	};
}

function leerRutina(rutina: unknown): RutinaElegida | null {
	if (!rutina || typeof rutina !== 'object') return null;
	const { tipoPiel, preocupacion, ids } = rutina as Partial<RutinaElegida>;
	if (!esTipoPiel(tipoPiel) || !esPreocupacion(preocupacion) || !ids || typeof ids !== 'object') {
		return null;
	}
	return { tipoPiel, preocupacion, ids };
}

/**
 * Los productos recomendados de los tres pasos de esa rutina: el servidor
 * los lee en el momento para saber cuáles tienen stock.
 */
export function idsRecomendadosRutina(rutina: unknown): string[] {
	const elegida = leerRutina(rutina);
	if (!elegida) return [];
	return [
		...new Set(
			PASOS.flatMap(({ paso }) => opcionDelPaso(paso, elegida.tipoPiel, elegida.preocupacion).ids)
		)
	];
}

/**
 * Si algún paso se quedó sin recomendados con stock: solo entonces hace
 * falta el catálogo para validar el producto de respaldo.
 */
export function rutinaUsaRespaldo(rutina: unknown, disponibles: Set<string>): boolean {
	const elegida = leerRutina(rutina);
	if (!elegida) return false;
	return PASOS.some(
		({ paso }) =>
			!opcionDelPaso(paso, elegida.tipoPiel, elegida.preocupacion).ids.some((id) => disponibles.has(id))
	);
}

/**
 * Comprueba en el servidor la rutina que manda el checkout y devuelve sus
 * productos, o null si no es una rutina válida.
 *
 * - Cada paso tiene que traer uno de sus productos recomendados para ese
 *   tipo de piel y preocupación (cualquiera de la lista: el stock pudo
 *   cambiar desde que se armó).
 * - Solo si ninguno de los recomendados de un paso tiene stock
 *   ("disponibles", leído en el momento) vale el de respaldo, y únicamente
 *   el que elegiría el servidor con el catálogo. Ese paso puede faltar solo
 *   si tampoco hay respaldo.
 */
export function validarRutina(
	rutina: unknown,
	disponibles: Set<string>,
	catalogo: ProductoParaRutina[] | null
): string[] | null {
	const elegida = leerRutina(rutina);
	if (!elegida) return null;

	const elegidos: string[] = [];
	for (const { paso } of PASOS) {
		const recomendados = opcionDelPaso(paso, elegida.tipoPiel, elegida.preocupacion).ids;
		const id = String(elegida.ids[paso] ?? '');

		if (id && recomendados.includes(id)) {
			elegidos.push(id);
			continue;
		}
		if (recomendados.some((recomendado) => disponibles.has(recomendado))) return null;

		const respaldo = catalogo ? productoDeRespaldo(categoriasRespaldo[paso], catalogo) : undefined;
		if (!respaldo) {
			if (id) return null;
			continue;
		}
		if (id !== String(respaldo.id)) return null;
		elegidos.push(id);
	}

	if (elegidos.length === 0) return null;
	return new Set(elegidos).size === elegidos.length ? elegidos : null;
}
