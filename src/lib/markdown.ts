import MarkdownIt from 'markdown-it';

/**
 * Configuración compartida entre el sitio público y la vista previa del
 * panel, para que lo que se ve al editar sea exactamente lo que se
 * publica.
 *
 * html: false es la propiedad de seguridad importante: cualquier
 * etiqueta HTML escrita dentro del contenido se muestra como texto en
 * vez de ejecutarse. Como el contenido se guarda en la base de datos y
 * después se inserta con {@html}, el renderizador nunca debe poder
 * emitir etiquetas que no haya generado él mismo.
 */
const md = new MarkdownIt({
	html: false,
	linkify: false,
	breaks: false
});

export function renderizarMarkdown(contenido: string): string {
	return md.render(contenido ?? '');
}
