import { adminDb } from '$lib/server/firebase-admin';
import { renderizarMarkdown } from '$lib/markdown';

import envios from '$lib/legales/envios.md?raw';
import cambiosYDevoluciones from '$lib/legales/cambios-y-devoluciones.md?raw';
import terminosYCondiciones from '$lib/legales/terminos-y-condiciones.md?raw';
import privacidad from '$lib/legales/privacidad.md?raw';

export type SlugLegal =
	| 'envios'
	| 'cambios-y-devoluciones'
	| 'terminos-y-condiciones'
	| 'privacidad';

export type PaginaLegalDatos = {
	slug: SlugLegal;
	titulo: string;
	actualizado: string;
	/** El contenido en Markdown, tal como se edita en el panel. */
	contenido: string;
	/** El contenido ya convertido a HTML, listo para mostrar. */
	html: string;
};

/**
 * Contenido original de cada página, versionado en el repositorio. Sirve
 * de respaldo: si el documento de Firestore no existe o la consulta
 * falla, la página legal igual se muestra completa. Nunca puede quedar
 * una página legal en blanco.
 */
const CONTENIDO_POR_DEFECTO: Record<
	SlugLegal,
	{ titulo: string; actualizado: string; contenido: string }
> = {
	envios: {
		titulo: 'Política de Envíos',
		actualizado: '2 de septiembre de 2026',
		contenido: envios
	},
	'cambios-y-devoluciones': {
		titulo: 'Cambios y Devoluciones',
		actualizado: '2 de septiembre de 2026',
		contenido: cambiosYDevoluciones
	},
	'terminos-y-condiciones': {
		titulo: 'Términos y Condiciones',
		actualizado: '2 de septiembre de 2026',
		contenido: terminosYCondiciones
	},
	privacidad: {
		titulo: 'Política de Privacidad',
		actualizado: '2 de septiembre de 2026',
		contenido: privacidad
	}
};

export const SLUGS_LEGALES = Object.keys(
	CONTENIDO_POR_DEFECTO
) as SlugLegal[];

export async function obtenerPaginaLegal(
	slug: SlugLegal
): Promise<PaginaLegalDatos> {
	const porDefecto = CONTENIDO_POR_DEFECTO[slug];

	let guardado: FirebaseFirestore.DocumentData | undefined;

	try {
		const snapshot = await adminDb.collection('legales').doc(slug).get();
		guardado = snapshot.exists ? snapshot.data() : undefined;
	} catch (error) {
		console.error(`Error obteniendo la página legal "${slug}":`, error);
	}

	const texto = (clave: 'titulo' | 'actualizado' | 'contenido') => {
		const valor = guardado?.[clave];
		return typeof valor === 'string' && valor.trim()
			? valor
			: porDefecto[clave];
	};

	const contenido = texto('contenido');

	return {
		slug,
		titulo: texto('titulo'),
		actualizado: texto('actualizado'),
		contenido,
		html: renderizarMarkdown(contenido)
	};
}

/** Contenido original de una página, para poder restaurarlo. */
export function obtenerContenidoOriginal(slug: SlugLegal) {
	return CONTENIDO_POR_DEFECTO[slug];
}
