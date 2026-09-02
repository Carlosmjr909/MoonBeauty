// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface PageData {
			productos?: Array<{
				id: string;
				Nombre: string;
				Tipo: string;
				descripcion: string;
				especificacion: string;
				imagen: string;
				precio: number;
				stock: number;
				fechaCreacion?: number;
			}>;
			tasaBCV?: {
				promedio: number;
				moneda?: string;
				fuente?: string;
				nombre?: string;
				compra?: number | null;
				venta?: number | null;
				fechaActualizacion?: string;
			} | null;
			errorTasaBCV?: string | null;
			categorias?: Array<{
				id: string;
				nombre: string;
				descripcion: string;
				imagen: string;
			}>;
		}
		// interface Error {}
		// interface Locals {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
