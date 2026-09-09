import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '$lib/firebase';

const COLECCION = 'configuracion';

/* ------------------------- Datos de pago ------------------------- */

export type ConfiguracionPagos = {
	/** Datos que se le muestran al comprador para hacer un pago móvil. */
	pagoMovilCedula: string;
	pagoMovilTelefono: string;
	pagoMovilBanco: string;
	binanceCorreo: string;
	zelleCorreo: string;
	zinliCorreo: string;
	/** Texto del banner que recorre la parte de arriba del sitio. */
	bannerTexto: string;
	bannerActivo: boolean;
};

/**
 * Valores por defecto. Son los que estuvieron escritos en el código hasta
 * ahora, y sirven de respaldo si el documento de configuración todavía no
 * existe en Firestore (así el sitio nunca se queda sin contenido).
 */
export const CONFIGURACION_PAGOS_POR_DEFECTO: ConfiguracionPagos = {
	pagoMovilCedula: 'V-27854705',
	pagoMovilTelefono: '0412-5050043',
	pagoMovilBanco: 'Banco de Venezuela (0102)',
	binanceCorreo: 'juancjs71@gmail.com',
	zelleCorreo: 'juancjs71@gmail.com',
	zinliCorreo: 'juancjs71@gmail.com',
	bannerTexto:
		'20% de descuento para pagos en $ con el código MOON20. Aplica para pagos en Efectivo $, Binance, Zelle y Zinli.',
	bannerActivo: true
};

/* --------------------------- Portada --------------------------- */

export type ConfiguracionPortada = {
	heroEtiqueta: string;
	/** Los saltos de línea se respetan tal cual en el título grande. */
	heroTitulo: string;
	heroSubtitulo: string;
	heroBoton: string;
	esenciaEtiqueta: string;
	esenciaTitulo: string;
	esencia1Titulo: string;
	esencia1Texto: string;
	esencia2Titulo: string;
	esencia2Texto: string;
	esencia3Titulo: string;
	esencia3Texto: string;
	esencia4Titulo: string;
	esencia4Texto: string;
	esencia4Boton: string;
};

export const CONFIGURACION_PORTADA_POR_DEFECTO: ConfiguracionPortada = {
	heroEtiqueta: 'K-BEAUTY · MOON BEAUTY',
	heroTitulo: 'Tu piel,\nen su mejor era.',
	heroSubtitulo:
		'Skincare coreano seleccionado para elevar tu rutina diaria y darle a tu piel el glow que se merece.',
	heroBoton: 'Descubrir productos',
	esenciaEtiqueta: 'Nuestra esencia',
	esenciaTitulo: 'Belleza, calma y cuidado',
	esencia1Titulo: 'La ciencia de la calma',
	esencia1Texto:
		'Seleccionamos rituales coreanos que combinan tecnología clínica avanzada con ingredientes botánicos ancestrales.',
	esencia2Titulo: 'Curaduría exclusiva',
	esencia2Texto:
		'Solo seleccionamos marcas que cumplen con altos estándares de K-Beauty, calidad, innovación y sostenibilidad.',
	esencia3Titulo: 'Envío directo',
	esencia3Texto:
		'Logística optimizada para que tu ritual no se detenga. Productos cuidadosamente preparados hasta llegar a tu puerta.',
	esencia4Titulo: 'Luminous Serenity',
	esencia4Texto:
		'Descubre el brillo que nace desde adentro con productos diseñados para nutrir no solo tu piel, sino también tu bienestar diario.',
	esencia4Boton: 'Saber más'
};

/* --------------------- Contacto y pie de página --------------------- */

export type ConfiguracionContacto = {
	descripcion: string;
	instagramUrl: string;
	/** Solo dígitos, en formato internacional: se usa en los links de wa.me. */
	whatsappNumero: string;
	/** Cómo se muestra escrito el teléfono. */
	whatsappTexto: string;
	correo: string;
	direccion: string;
	horario: string;
	copyright: string;
};

export const CONFIGURACION_CONTACTO_POR_DEFECTO: ConfiguracionContacto = {
	descripcion:
		'Descubre el brillo que nace desde adentro con nuestra curaduría exclusiva de cosmética coreana, entregada directamente en tu puerta.',
	instagramUrl: 'https://www.instagram.com/moonbeauty.val/',
	whatsappNumero: '584125050043',
	whatsappTexto: '+58 412-505 0043',
	correo: 'moonbeautyval@gmail.com',
	direccion: 'Valencia, Estado Carabobo, Venezuela',
	horario: 'Todos los días · Respondemos por WhatsApp',
	copyright: 'Luminous Serenity for your skin.'
};

/* --------------------------- Utilidades --------------------------- */

/**
 * Rellena con los valores por defecto cualquier campo que falte o venga
 * vacío, de modo que el sitio nunca muestre huecos en blanco aunque el
 * documento esté incompleto.
 */
function combinarConDefectos<T extends Record<string, unknown>>(
	defectos: T,
	datos: Record<string, unknown> | undefined | null
): T {
	if (!datos) return { ...defectos };

	const resultado = { ...defectos };

	for (const clave of Object.keys(defectos) as Array<keyof T>) {
		const valor = datos[clave as string];
		const porDefecto = defectos[clave];

		if (typeof porDefecto === 'boolean') {
			if (typeof valor === 'boolean') {
				resultado[clave] = valor as T[keyof T];
			}
			continue;
		}

		if (typeof valor === 'string' && valor.trim()) {
			resultado[clave] = valor as T[keyof T];
		}
	}

	return resultado;
}

export function normalizarConfiguracionPagos(
	datos: Record<string, unknown> | undefined | null
): ConfiguracionPagos {
	return combinarConDefectos(CONFIGURACION_PAGOS_POR_DEFECTO, datos);
}

export function normalizarConfiguracionPortada(
	datos: Record<string, unknown> | undefined | null
): ConfiguracionPortada {
	return combinarConDefectos(CONFIGURACION_PORTADA_POR_DEFECTO, datos);
}

export function normalizarConfiguracionContacto(
	datos: Record<string, unknown> | undefined | null
): ConfiguracionContacto {
	return combinarConDefectos(CONFIGURACION_CONTACTO_POR_DEFECTO, datos);
}

/** Documentos disponibles dentro de la colección "configuracion". */
export type SeccionConfiguracion = 'pagos' | 'portada' | 'contacto';

export function escucharConfiguracion<T extends Record<string, unknown>>(
	seccion: SeccionConfiguracion,
	normalizar: (datos: Record<string, unknown> | null) => T,
	callback: (configuracion: T) => void,
	alError?: (error: Error) => void
) {
	return onSnapshot(
		doc(db, COLECCION, seccion),
		(snapshot) => {
			callback(normalizar(snapshot.exists() ? snapshot.data() : null));
		},
		(error) => {
			console.error(`Error escuchando la configuración (${seccion}):`, error);
			alError?.(error);
		}
	);
}

export async function guardarConfiguracion(
	seccion: SeccionConfiguracion,
	configuracion: Record<string, unknown>
) {
	await setDoc(
		doc(db, COLECCION, seccion),
		{
			...configuracion,
			actualizadoEn: serverTimestamp()
		},
		{ merge: true }
	);
}
