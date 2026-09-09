import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '$lib/firebase';

export type PaginaLegalEditable = {
	titulo: string;
	actualizado: string;
	/** El contenido en Markdown. */
	contenido: string;
};

export async function guardarPaginaLegal(
	slug: string,
	pagina: PaginaLegalEditable
) {
	if (!pagina.contenido.trim()) {
		throw new Error('El contenido no puede quedar vacío.');
	}

	if (!pagina.titulo.trim()) {
		throw new Error('El título es obligatorio.');
	}

	await setDoc(
		doc(db, 'legales', slug),
		{
			titulo: pagina.titulo.trim(),
			actualizado: pagina.actualizado.trim(),
			contenido: pagina.contenido,
			actualizadoEn: serverTimestamp()
		},
		{ merge: true }
	);
}

/** Fecha de hoy escrita como aparece en las páginas legales. */
export function fechaDeHoy(): string {
	return new Intl.DateTimeFormat('es-VE', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date());
}
