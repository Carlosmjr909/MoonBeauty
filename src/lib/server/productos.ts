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
