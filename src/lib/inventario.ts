import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc
} from 'firebase/firestore';

import {
	deleteObject,
	getDownloadURL,
	ref,
	uploadBytes
} from 'firebase/storage';

import { db, storage } from '$lib/firebase';

export type Producto = {
	id: string;
	Nombre: string;
	Tipo: string;
	marca: string;
	descripcion: string;
	especificacion: string;
	imagen: string;
	precio: number;
	stock: number;
};

export type NuevoProducto = Omit<Producto, 'id'>;

export type Categoria = {
	id: string;
	nombre: string;
	descripcion: string;
	imagen: string;
};

const COLECCION = 'productos';
const COLECCION_CATEGORIAS = 'categorias';

function normalizarCategoria(nombre: string) {
	return nombre
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		|| 'categoria';
}

export function escucharProductos(
	callback: (productos: Producto[]) => void,
	alError?: (error: Error) => void
) {
	const referencia = query(collection(db, COLECCION), orderBy('Nombre'));

	return onSnapshot(
		referencia,
		(snapshot) => {
			const productos = snapshot.docs.map((docSnap) => {
				const datos = docSnap.data();

				return {
					id: docSnap.id,
					Nombre: String(datos.Nombre ?? ''),
					Tipo: String(datos.Tipo ?? ''),
					marca: String(datos.marca ?? ''),
					descripcion: String(datos.descripcion ?? ''),
					especificacion: String(datos.especificacion ?? ''),
					imagen: String(datos.imagen ?? ''),
					precio: Number(datos.precio ?? 0),
					stock: Number(datos.stock ?? 0)
				} satisfies Producto;
			});

			callback(productos);
		},
		(error) => {
			console.error('Error escuchando productos:', error);
			alError?.(error);
		}
	);
}

export async function agregarProducto(producto: NuevoProducto) {
	await addDoc(collection(db, COLECCION), {
		...producto,
		fechaCreacion: serverTimestamp()
	});
}

export async function subirImagenProducto(archivo: File): Promise<string> {
	const nombreUnico = `${crypto.randomUUID()}-${archivo.name}`;
	const referencia = ref(storage, `productos/${nombreUnico}`);

	await uploadBytes(referencia, archivo);

	return getDownloadURL(referencia);
}

export async function eliminarProducto(id: string, imagen?: string) {
	await deleteDoc(doc(db, COLECCION, id));

	if (!imagen) return;

	try {
		await deleteObject(ref(storage, imagen));
	} catch (error) {
		console.error('No se pudo eliminar la imagen del producto:', error);
	}
}

export async function actualizarStock(id: string, stock: number) {
	await updateDoc(doc(db, COLECCION, id), { stock });
}

export async function actualizarProducto(
	id: string,
	datos: Partial<Omit<Producto, 'id'>>
) {
	await updateDoc(doc(db, COLECCION, id), datos);
}

export function escucharCategorias(
	callback: (categorias: Categoria[]) => void,
	alError?: (error: Error) => void
) {
	const referencia = query(collection(db, COLECCION_CATEGORIAS), orderBy('nombre'));

	return onSnapshot(
		referencia,
		(snapshot) => {
			const categorias = snapshot.docs.map((docSnap) => {
				const datos = docSnap.data();

				return {
					id: String(docSnap.id),
					nombre: String(datos.nombre ?? ''),
					descripcion: String(datos.descripcion ?? ''),
					imagen: String(datos.imagen ?? '')
				} satisfies Categoria;
			});

			callback(categorias);
		},
		(error) => {
			console.error('Error escuchando categorías:', error);
			alError?.(error);
		}
	);
}

export async function guardarCategoria(payload: {
	nombre: string;
	descripcion: string;
	imagen: string;
}) {
	const nombre = payload.nombre.trim();
	if (!nombre) {
		throw new Error('El nombre de la categoría es obligatorio.');
	}

	const idCategoria = normalizarCategoria(nombre);
	const referencia = doc(db, COLECCION_CATEGORIAS, idCategoria);

	await setDoc(
		referencia,
		{
			nombre,
			descripcion: payload.descripcion.trim(),
			imagen: payload.imagen,
			updatedAt: serverTimestamp()
		},
		{ merge: true }
	);

	return idCategoria;
}

export async function actualizarCategoria(
	idCategoria: string,
	payload: {
		nombre: string;
		descripcion: string;
		imagen: string;
	}
) {
	const referencia = doc(db, COLECCION_CATEGORIAS, idCategoria);

	await updateDoc(referencia, {
		nombre: payload.nombre.trim(),
		descripcion: payload.descripcion.trim(),
		imagen: payload.imagen,
		updatedAt: serverTimestamp()
	});
}

export async function subirImagenCategoria(archivo: File): Promise<string> {
	const nombreUnico = `${crypto.randomUUID()}-${archivo.name}`;
	const referencia = ref(storage, `categorias/${nombreUnico}`);

	await uploadBytes(referencia, archivo);

	return getDownloadURL(referencia);
}
