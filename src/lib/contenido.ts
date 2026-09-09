import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	updateDoc
} from 'firebase/firestore';

import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { db, storage } from '$lib/firebase';

const COLECCION_INSTAGRAM = 'instagram';
const COLECCION_MARCAS = 'marcas';

export type TipoPublicacion = 'imagen' | 'video';

export type PublicacionInstagram = {
	id: string;
	tipo: TipoPublicacion;
	/**
	 * Para "imagen": las fotos del carrusel, en orden.
	 * Para "video": un solo archivo.
	 */
	archivos: string[];
	/** Portada del video mientras carga. */
	miniatura: string | null;
	/** Link al post real en Instagram. */
	permalink: string;
	orden: number;
};

export type Marca = {
	id: string;
	nombre: string;
	imagen: string;
	/**
	 * Alto máximo del logo dentro de su casilla, en porcentaje ("82%").
	 * Sirve para que logos de proporciones distintas se vean parejos.
	 */
	alto: string;
	orden: number;
};

/* ---------------------- Publicaciones de Instagram ---------------------- */

function convertirPublicacion(
	id: string,
	datos: Record<string, unknown>
): PublicacionInstagram {
	return {
		id,
		tipo: datos.tipo === 'video' ? 'video' : 'imagen',
		archivos: Array.isArray(datos.archivos)
			? datos.archivos.map((archivo) => String(archivo))
			: [],
		miniatura: datos.miniatura ? String(datos.miniatura) : null,
		permalink: String(datos.permalink ?? ''),
		orden: Number(datos.orden ?? 0)
	};
}

export function escucharPublicaciones(
	callback: (publicaciones: PublicacionInstagram[]) => void,
	alError?: (error: Error) => void
) {
	const referencia = query(
		collection(db, COLECCION_INSTAGRAM),
		orderBy('orden')
	);

	return onSnapshot(
		referencia,
		(snapshot) => {
			callback(
				snapshot.docs.map((docSnap) =>
					convertirPublicacion(docSnap.id, docSnap.data())
				)
			);
		},
		(error) => {
			console.error('Error escuchando publicaciones:', error);
			alError?.(error);
		}
	);
}

export async function subirArchivoInstagram(archivo: File): Promise<string> {
	const nombreUnico = `${crypto.randomUUID()}-${archivo.name}`;
	const referencia = ref(storage, `instagram/${nombreUnico}`);

	await uploadBytes(referencia, archivo);

	return getDownloadURL(referencia);
}

export async function agregarPublicacion(publicacion: {
	tipo: TipoPublicacion;
	archivos: string[];
	miniatura: string | null;
	permalink: string;
	orden: number;
}) {
	if (publicacion.archivos.length === 0) {
		throw new Error('Sube al menos un archivo para la publicación.');
	}

	await addDoc(collection(db, COLECCION_INSTAGRAM), {
		...publicacion,
		fechaCreacion: serverTimestamp()
	});
}

export async function actualizarOrdenPublicacion(id: string, orden: number) {
	await updateDoc(doc(db, COLECCION_INSTAGRAM, id), { orden });
}

/**
 * Borra la publicación y, si sus archivos están en Storage, también los
 * borra para no dejar videos pesados ocupando espacio. Los archivos que
 * viven en /static (los originales del repositorio) se ignoran.
 */
export async function eliminarPublicacion(publicacion: PublicacionInstagram) {
	await deleteDoc(doc(db, COLECCION_INSTAGRAM, publicacion.id));

	const archivos = [...publicacion.archivos, publicacion.miniatura].filter(
		(archivo): archivo is string =>
			Boolean(archivo) && String(archivo).includes('firebasestorage')
	);

	for (const archivo of archivos) {
		try {
			await deleteObject(ref(storage, archivo));
		} catch (error) {
			console.error('No se pudo borrar el archivo de la publicación:', error);
		}
	}
}

/* ----------------------------- Marcas ----------------------------- */

function convertirMarca(id: string, datos: Record<string, unknown>): Marca {
	return {
		id,
		nombre: String(datos.nombre ?? ''),
		imagen: String(datos.imagen ?? ''),
		alto: String(datos.alto ?? '80%'),
		orden: Number(datos.orden ?? 0)
	};
}

export function escucharMarcas(
	callback: (marcas: Marca[]) => void,
	alError?: (error: Error) => void
) {
	const referencia = query(collection(db, COLECCION_MARCAS), orderBy('orden'));

	return onSnapshot(
		referencia,
		(snapshot) => {
			callback(
				snapshot.docs.map((docSnap) =>
					convertirMarca(docSnap.id, docSnap.data())
				)
			);
		},
		(error) => {
			console.error('Error escuchando marcas:', error);
			alError?.(error);
		}
	);
}

export async function subirLogoMarca(archivo: File): Promise<string> {
	const nombreUnico = `${crypto.randomUUID()}-${archivo.name}`;
	const referencia = ref(storage, `marcas/${nombreUnico}`);

	await uploadBytes(referencia, archivo);

	return getDownloadURL(referencia);
}

export async function agregarMarca(marca: {
	nombre: string;
	imagen: string;
	alto: string;
	orden: number;
}) {
	if (!marca.nombre.trim()) {
		throw new Error('El nombre de la marca es obligatorio.');
	}

	if (!marca.imagen) {
		throw new Error('Sube el logo de la marca.');
	}

	await addDoc(collection(db, COLECCION_MARCAS), {
		...marca,
		nombre: marca.nombre.trim(),
		fechaCreacion: serverTimestamp()
	});
}

export async function actualizarMarca(
	id: string,
	cambios: Partial<Omit<Marca, 'id'>>
) {
	await updateDoc(doc(db, COLECCION_MARCAS, id), cambios);
}

export async function eliminarMarca(marca: Marca) {
	await deleteDoc(doc(db, COLECCION_MARCAS, marca.id));

	if (!marca.imagen.includes('firebasestorage')) return;

	try {
		await deleteObject(ref(storage, marca.imagen));
	} catch (error) {
		console.error('No se pudo borrar el logo de la marca:', error);
	}
}
