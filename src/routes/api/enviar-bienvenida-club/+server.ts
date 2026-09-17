import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import type { RequestHandler } from './$types';

const RESEND_API_KEY = env.RESEND_API_KEY ?? '';
const COMPANY_ORDER_EMAIL = env.COMPANY_ORDER_EMAIL ?? '';
const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL ?? '';

function escaparHtml(valor: unknown): string {
	return String(valor ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

/**
 * Verifica el token de Firebase y devuelve el uid, o null si no es válido.
 * Igual que en enviar-pedido: sin esto cualquiera podría pedirle a este
 * endpoint que mande un correo de bienvenida a quien sea.
 */
async function verificarUsuario(request: Request): Promise<string | null> {
	const encabezado = request.headers.get('authorization') ?? '';

	if (!encabezado.startsWith('Bearer ')) {
		return null;
	}

	const token = encabezado.slice('Bearer '.length).trim();
	if (!token) return null;

	try {
		const decodificado = await adminAuth.verifyIdToken(token);
		return decodificado.uid;
	} catch (error) {
		console.error('Token inválido al intentar enviar el correo de bienvenida al club:', error);
		return null;
	}
}

const encabezadoCorreo = `
	<div style="text-align: center; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
		<img
			src="https://www.moonbeautyval.com/correo/logo-correo.png"
			alt="Moon Beauty"
			width="140"
			style="max-width: 140px; height: auto;"
		/>
	</div>
`;

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
	try {
		const uid = await verificarUsuario(request);

		if (!uid) {
			return json({ ok: false, error: 'No autorizado.' }, { status: 401 });
		}

		// El nombre y el correo se leen desde Firestore con el Admin SDK,
		// nunca del cuerpo del POST, para que nadie pueda hacer que este
		// endpoint mande un correo con datos inventados.
		const snapshotUsuario = await adminDb.collection('usuarios').doc(uid).get();

		if (!snapshotUsuario.exists) {
			return json({ ok: false, error: 'El usuario no existe.' }, { status: 404 });
		}

		const datosUsuario = snapshotUsuario.data() as { nombre?: string; correo?: string };
		const nombre = datosUsuario.nombre?.trim() || 'Bienvenida';
		const correo = datosUsuario.correo?.trim();

		if (!correo) {
			return json({ ok: false, error: 'El usuario no tiene correo registrado.' }, { status: 400 });
		}

		if (!RESEND_API_KEY || !COMPANY_ORDER_EMAIL || !RESEND_FROM_EMAIL) {
			return json({ ok: false, error: 'Faltan configuraciones de correo.' }, { status: 500 });
		}

		const resend = new Resend(RESEND_API_KEY);

		const htmlEmpresa = `
			<div style="font-family: Arial, sans-serif; color: #111827;">
				${encabezadoCorreo}
				<h2 style="margin-bottom: 12px;">Nuevo miembro en Moon Beauty Club</h2>
				<p><strong>Nombre:</strong> ${escaparHtml(nombre)}</p>
				<p><strong>Correo:</strong> ${escaparHtml(correo)}</p>
			</div>
		`;

		const htmlClienta = `
			<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
				${encabezadoCorreo}
				<h2 style="margin-bottom: 4px;">✦ ¡Te damos la bienvenida a Moon Beauty Club, ${escaparHtml(nombre)}!</h2>
				<p style="font-style: italic; color: #92400e; margin-top: 0;">Más belleza. Más beneficios. Más luminosidad en cada compra.</p>

				<p>Gracias por unirte a nuestra comunidad. A partir de hoy formas parte de un espacio pensado para acompañarte en cada paso de tu ritual de skincare coreano, con beneficios exclusivos solo para ti:</p>

				<ul style="padding-left: 20px;">
					<li>Ofertas exclusivas de temporada</li>
					<li>Acceso anticipado a lanzamientos</li>
					<li>Puntos glow canjeables en USD</li>
					<li>Regalos sorpresa en cada orden</li>
				</ul>

				<p>Estamos felices de que la luminosidad de tu piel también sea nuestra misión. Bienvenida a la familia Moon Beauty. ✨</p>

				<p style="margin-top: 24px;">Con cariño,<br />El equipo de Moon Beauty</p>
			</div>
		`;

		const [envioEmpresa, envioClienta] = await Promise.all([
			resend.emails.send({
				from: RESEND_FROM_EMAIL,
				to: [COMPANY_ORDER_EMAIL],
				subject: `Nuevo miembro en Moon Beauty Club: ${nombre}`,
				html: htmlEmpresa
			}),
			resend.emails.send({
				from: RESEND_FROM_EMAIL,
				to: [correo],
				subject: '✦ ¡Bienvenida a Moon Beauty Club!',
				html: htmlClienta
			})
		]);

		if (envioEmpresa.error) {
			console.error('No se pudo notificar a la empresa del nuevo miembro del club:', envioEmpresa.error);
		}

		if (envioClienta.error) {
			return json(
				{ ok: false, error: envioClienta.error.message ?? 'No se pudo enviar el correo de bienvenida.' },
				{ status: 500 }
			);
		}

		return json({ ok: true, message: 'Correo de bienvenida enviado correctamente.' });
	} catch (error) {
		console.error('Error al enviar el correo de bienvenida al club:', error);

		return json({ ok: false, error: 'No se pudo enviar el correo de bienvenida.' }, { status: 500 });
	}
};
