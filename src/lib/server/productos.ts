import { adminDb } from '$lib/server/firebase-admin';

export type ProductoPublico = {
	id: string;
	Nombre: string;
	Tipo: string;
	marca: string;
	descripcion: string;
	especificacion: string;
	imagen: string;
	precio: number;
	stock: number;
	popular: boolean;
	fechaCreacion: number;
};

export type CategoriaPublica = {
	id: string;
	nombre: string;
	descripcion: string;
	imagen: string;
};

export async function obtenerProductosPublicos(): Promise<ProductoPublico[]> {
	const snapshot = await adminDb.collection('productos').get();

	return snapshot.docs.map((doc) => {
		const datos = doc.data();
		const fechaCreacion = datos.fechaCreacion;

		return {
			id: doc.id,
			Nombre: String(datos.Nombre ?? ''),
			Tipo: String(datos.Tipo ?? ''),
			marca: String(datos.marca ?? ''),
			descripcion: String(datos.descripcion ?? ''),
			especificacion: String(datos.especificacion ?? ''),
			imagen: String(datos.imagen ?? ''),
			precio: Number(datos.precio ?? 0),
			stock: Number(datos.stock ?? 0),
			popular: Boolean(datos.popular ?? false),
			fechaCreacion:
				fechaCreacion && typeof fechaCreacion.toMillis === 'function'
					? fechaCreacion.toMillis()
					: 0
		};
	});
}

/**
 * Toda la configuración editable del sitio (datos de pago, textos de la
 * portada y datos de contacto). Se trae la colección completa en una sola
 * consulta en vez de un "get" por documento, y se lee en el servidor para
 * que las páginas lleguen con el contenido ya puesto, sin salto visual.
 */
export async function obtenerConfiguracionSitio(): Promise<
	Record<string, Record<string, unknown>>
> {
	const snapshot = await adminDb.collection('configuracion').get();

	const configuracion: Record<string, Record<string, unknown>> = {};

	for (const doc of snapshot.docs) {
		configuracion[doc.id] = doc.data() ?? {};
	}

	return configuracion;
}

export type PublicacionInstagramPublica = {
	id: string;
	tipo: 'imagen' | 'video';
	archivos: string[];
	miniatura: string | null;
	permalink: string;
};

export type MarcaPublica = {
	id: string;
	nombre: string;
	imagen: string;
	alto: string;
};

export async function obtenerPublicacionesInstagram(): Promise<
	PublicacionInstagramPublica[]
> {
	const snapshot = await adminDb
		.collection('instagram')
		.orderBy('orden')
		.get();

	return snapshot.docs.map((doc) => {
		const datos = doc.data();

		return {
			id: doc.id,
			tipo: datos.tipo === 'video' ? 'video' : 'imagen',
			archivos: Array.isArray(datos.archivos)
				? datos.archivos.map((archivo: unknown) => String(archivo))
				: [],
			miniatura: datos.miniatura ? String(datos.miniatura) : null,
			permalink: String(datos.permalink ?? '')
		};
	});
}

export async function obtenerMarcas(): Promise<MarcaPublica[]> {
	const snapshot = await adminDb.collection('marcas').orderBy('orden').get();

	return snapshot.docs.map((doc) => {
		const datos = doc.data();

		return {
			id: doc.id,
			nombre: String(datos.nombre ?? ''),
			imagen: String(datos.imagen ?? ''),
			alto: String(datos.alto ?? '80%')
		};
	});
}

export async function obtenerCategoriasPublicas(): Promise<CategoriaPublica[]> {
	const snapshot = await adminDb.collection('categorias').get();

	return snapshot.docs.map((doc) => {
		const datos = doc.data();

		return {
			id: doc.id,
			nombre: String(datos.nombre ?? ''),
			descripcion: String(datos.descripcion ?? ''),
			imagen: String(datos.imagen ?? '')
		};
	});
}
