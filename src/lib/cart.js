import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

/**
 * @typedef {Object} ProductoCarritoInput
 * @property {string | number} id
 * @property {string} Nombre
 * @property {string} Tipo
 * @property {string} imagen
 * @property {number} precio
 * @property {number} [OfertaEnDivisas]
 * @property {number} [stock]
 */

/**
 * @typedef {Object} ProductoCarrito
 * @property {string | number} id
 * @property {string} Nombre
 * @property {string} Tipo
 * @property {string} imagen
 * @property {number} precio
 * @property {number} precioOriginal
 * @property {number} cantidad
 * @property {number | undefined} stock
 */

/**
 * @typedef {Object} CarritoStore
 * @property {(run: (productos: ProductoCarrito[]) => void) => () => void} subscribe
 * @property {(producto: ProductoCarritoInput, cantidad?: number) => boolean} agregar
 * @property {(id: string | number) => void} aumentar
 * @property {(id: string | number) => void} disminuir
 * @property {(id: string | number) => void} eliminar
 * @property {() => void} vaciar
 */

const STORAGE_KEY = 'moonbeauty-carrito';

/**
 * Lee el carrito guardado en el navegador.
 * @returns {ProductoCarrito[]}
 */
function obtenerCarritoGuardado() {
	if (!browser) {
		return [];
	}

	try {
		const carritoGuardado = localStorage.getItem(STORAGE_KEY);

		if (!carritoGuardado) {
			return [];
		}

		const carrito = JSON.parse(carritoGuardado);

		return Array.isArray(carrito) ? carrito : [];
	} catch (error) {
		console.error('No se pudo leer el carrito:', error);
		return [];
	}
}

/**
 * @returns {CarritoStore}
 */
function crearCarrito() {
	const { subscribe, set, update } = writable(obtenerCarritoGuardado());

	if (browser) {
		subscribe((productos) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
		});
	}

	return {
		subscribe,

		/**
		 * @param {ProductoCarritoInput} producto
		 * @param {number} [cantidad=1]
		 * @returns {boolean} true si se agregó todo lo pedido, false si se
		 *   recortó por falta de stock (o no se pudo agregar nada más).
		 */
		agregar(producto, cantidad = 1) {
			const cantidadPedida = Math.max(1, Number(cantidad) || 1);
			const stockDisponible =
				typeof producto.stock === 'number' && Number.isFinite(producto.stock)
					? Math.max(0, producto.stock)
					: undefined;

			let seAgregoTodo = true;

			update((productos) => {
				const productoExistente = productos.find(
					(item) => item.id === producto.id
				);

				const yaEnCarrito = productoExistente?.cantidad ?? 0;

				const cupoRestante =
					stockDisponible === undefined
						? cantidadPedida
						: Math.max(0, stockDisponible - yaEnCarrito);

				const cantidadAAgregar = Math.min(cantidadPedida, cupoRestante);
				seAgregoTodo = cantidadAAgregar === cantidadPedida;

				if (cantidadAAgregar <= 0) {
					// Ya se llegó al tope de stock; solo refrescamos el stock guardado.
					return productoExistente
						? productos.map((item) =>
								item.id === producto.id
									? { ...item, stock: stockDisponible }
									: item
							)
						: productos;
				}

				if (productoExistente) {
					return productos.map((item) =>
						item.id === producto.id
							? {
									...item,
									cantidad: item.cantidad + cantidadAAgregar,
									stock: stockDisponible
								}
							: item
					);
				}

				const precioFinal =
					typeof producto.precio === 'number' &&
					typeof producto.OfertaEnDivisas === 'number' &&
					producto.OfertaEnDivisas > 0
						? producto.OfertaEnDivisas
						: producto.precio;

				return [
					...productos,
					{
						id: producto.id,
						Nombre: producto.Nombre,
						Tipo: producto.Tipo,
						imagen: producto.imagen,

						/*
						 * Si existe una oferta mayor que cero,
						 * se utiliza como precio final.
						 */
						precio: precioFinal,

						precioOriginal: producto.precio,
						cantidad: cantidadAAgregar,
						stock: stockDisponible
					}
				];
			});

			return seAgregoTodo;
		},

		/**
		 * @param {string | number} id
		 */
		aumentar(id) {
			update((productos) =>
				productos.map((producto) => {
					if (producto.id !== id) return producto;

					const hayCupo =
						typeof producto.stock !== 'number' ||
						producto.cantidad < producto.stock;

					return hayCupo
						? { ...producto, cantidad: producto.cantidad + 1 }
						: producto;
				})
			);
		},

		/**
		 * @param {string | number} id
		 */
		disminuir(id) {
			update((productos) =>
				productos
					.map((producto) =>
						producto.id === id
							? {
									...producto,
									cantidad: producto.cantidad - 1
								}
							: producto
					)
					.filter((producto) => producto.cantidad > 0)
			);
		},

		/**
		 * @param {string | number} id
		 */
		eliminar(id) {
			update((productos) =>
				productos.filter((producto) => producto.id !== id)
			);
		},

		vaciar() {
			set([]);
		}
	};
}

/** @type {CarritoStore} */
export const carrito = crearCarrito();

/**
 * Cantidad total de unidades.
 * @returns {import('svelte/store').Readable<number>}
 */
export const cantidadCarrito = derived(carrito, ($carrito) =>
	$carrito.reduce(
		(total, producto) => total + producto.cantidad,
		0
	)
);

/**
 * Total del carrito en dólares.
 * @returns {import('svelte/store').Readable<number>}
 */
export const totalCarritoUSD = derived(carrito, ($carrito) =>
	$carrito.reduce(
		(total, producto) =>
			total + producto.precio * producto.cantidad,
		0
	)
);