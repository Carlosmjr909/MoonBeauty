import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
	writeBatch
} from 'firebase/firestore';

import {
	deleteObject,
	getDownloadURL,
	ref,
	uploadBytes
} from 'firebase/storage';

import { db, storage } from '$lib/firebase';

/** Un tono o color disponible del producto, con su propia foto. */
export type Tono = {
	nombre: string;
	/** Color del círculo que se muestra; si va vacío se usa la foto. */
	color: string;
	imagen: string;
};

export type Producto = {
	id: string;
	Nombre: string;
	/**
	 * Categoría principal. Se mantiene por compatibilidad (los pedidos ya
	 * guardados la usan) y siempre equivale a la primera de "categorias".
	 */
	Tipo: string;
	/** Todas las categorías a las que pertenece el producto. */
	categorias: string[];
	marca: string;
	descripcion: string;
	especificacion: string;
	/** Foto principal: la que se ve en las tarjetas y al compartir. */
	imagen: string;
	/** Fotos adicionales de la galería, además de la principal. */
	imagenes: string[];
	/** Tonos o colores disponibles, cada uno con su foto. */
	tonos: Tono[];
	precio: number;
	stock: number;
	popular: boolean;
	/** Si aparece en el carrusel "New arrivals" de la portada. */
	nuevoIngreso: boolean;
};

/** Normaliza la lista de tonos que viene de la base de datos. */
export function normalizarTonos(valor: unknown): Tono[] {
	if (!Array.isArray(valor)) return [];

	return valor
		.map((item) => {
			const tono = (item ?? {}) as Partial<Tono>;

			return {
				nombre: String(tono.nombre ?? '').trim(),
				color: String(tono.color ?? '').trim(),
				imagen: String(tono.imagen ?? '').trim()
			};
		})
		.filter((tono) => tono.imagen);
}

export function normalizarImagenes(valor: unknown): string[] {
	if (!Array.isArray(valor)) return [];

	return valor.map((item) => String(item ?? '').trim()).filter(Boolean);
}

/**
 * Todas las fotos que se pueden ver de un producto, sin repetir: la
 * principal, las de la galería y las de cada tono. Es la lista por la
 * que se mueven las flechas en la ficha del producto.
 */
export function galeriaDeProducto(producto: {
	imagen?: string;
	imagenes?: string[];
	tonos?: Tono[];
}): string[] {
	const todas = [
		producto.imagen ?? '',
		...(producto.imagenes ?? []),
		...(producto.tonos ?? []).map((tono) => tono.imagen)
	];

	return [...new Set(todas.filter(Boolean))];
}

/**
 * Un producto puede tener varias categorías. Los productos viejos solo
 * tienen "Tipo", así que se usa como respaldo para que sigan apareciendo
 * en su categoría de siempre.
 */
export function categoriasDeProducto(producto: {
	Tipo?: string;
	categorias?: string[];
}): string[] {
	if (Array.isArray(producto.categorias) && producto.categorias.length > 0) {
		return producto.categorias;
	}

	return producto.Tipo ? [producto.Tipo] : [];
}

export function productoEnCategoria(
	producto: { Tipo?: string; categorias?: string[] },
	categoria: string
): boolean {
	const buscada = categoria.trim().toLowerCase();

	return categoriasDeProducto(producto).some(
		(nombre) => String(nombre).trim().toLowerCase() === buscada
	);
}

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

				const tipo = String(datos.Tipo ?? '');

				return {
					id: docSnap.id,
					Nombre: String(datos.Nombre ?? ''),
					Tipo: tipo,
					categorias: Array.isArray(datos.categorias)
						? datos.categorias.map((nombre) => String(nombre))
						: tipo
							? [tipo]
							: [],
					marca: String(datos.marca ?? ''),
					descripcion: String(datos.descripcion ?? ''),
					especificacion: String(datos.especificacion ?? ''),
					imagen: String(datos.imagen ?? ''),
					imagenes: normalizarImagenes(datos.imagenes),
					tonos: normalizarTonos(datos.tonos),
					precio: Number(datos.precio ?? 0),
					stock: Number(datos.stock ?? 0),
					popular: Boolean(datos.popular ?? false),
					nuevoIngreso: Boolean(datos.nuevoIngreso ?? false)
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

/**
 * Cambia el nombre de una categoría y actualiza todos los productos que
 * la usaban.
 *
 * Los productos guardan la categoría por su nombre, no por su id, así
 * que renombrar sin migrarlos dejaría a esos productos apuntando a una
 * categoría que ya no existe y desaparecerían del catálogo. Por eso
 * ambas cosas van juntas, en una sola operación que se aplica completa
 * o no se aplica.
 */
export async function renombrarCategoria(
	idCategoria: string,
	nombreAnterior: string,
	nombreNuevo: string
): Promise<number> {
	const nuevo = nombreNuevo.trim();
	const anterior = nombreAnterior.trim();

	if (!nuevo) {
		throw new Error('El nombre de la categoría no puede quedar vacío.');
	}

	if (nuevo === anterior) return 0;

	const lote = writeBatch(db);

	lote.update(doc(db, COLECCION_CATEGORIAS, idCategoria), {
		nombre: nuevo,
		updatedAt: serverTimestamp()
	});

	// Se recorren todos los productos y se reemplaza el nombre donde
	// aparezca, tanto en la categoría principal como en la lista.
	const productos = await getDocs(collection(db, COLECCION));
	let actualizados = 0;

	for (const docProducto of productos.docs) {
		const datos = docProducto.data();

		const categorias = Array.isArray(datos.categorias)
			? datos.categorias.map((nombre: unknown) => String(nombre))
			: datos.Tipo
				? [String(datos.Tipo)]
				: [];

		const usaLaCategoria = categorias.some(
			(nombre) => nombre.trim().toLowerCase() === anterior.toLowerCase()
		);

		if (!usaLaCategoria) continue;

		const nuevasCategorias = categorias.map((nombre) =>
			nombre.trim().toLowerCase() === anterior.toLowerCase() ? nuevo : nombre
		);

		const cambios: Record<string, unknown> = {
			categorias: nuevasCategorias
		};

		// "Tipo" siempre refleja la primera categoría.
		if (nuevasCategorias.length > 0) {
			cambios.Tipo = nuevasCategorias[0];
		}

		lote.update(docProducto.ref, cambios);
		actualizados++;
	}

	await lote.commit();

	return actualizados;
}

export async function eliminarCategoria(idCategoria: string, imagen?: string) {
	await deleteDoc(doc(db, COLECCION_CATEGORIAS, idCategoria));

	if (!imagen) return;

	try {
		await deleteObject(ref(storage, imagen));
	} catch (error) {
		console.error('No se pudo eliminar la imagen de la categoría:', error);
	}
}

export async function subirImagenCategoria(archivo: File): Promise<string> {
	const nombreUnico = `${crypto.randomUUID()}-${archivo.name}`;
	const referencia = ref(storage, `categorias/${nombreUnico}`);

	await uploadBytes(referencia, archivo);

	return getDownloadURL(referencia);
}
