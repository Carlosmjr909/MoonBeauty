import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import type { RequestHandler } from './$types';

const RESEND_API_KEY = env.RESEND_API_KEY ?? '';
const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL ?? '';

const SITIO = 'https://www.moonbeautyval.com';

function escaparHtml(valor: unknown): string {
	return String(valor ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

/**
 * Convierte los saltos de línea del mensaje escrito en el panel a HTML,
 * escapando todo lo demás para que nadie pueda inyectar etiquetas.
 */
function textoAParrafos(texto: string): string {
	return texto
		.split(/\n{2,}/)
		.map((parrafo) => parrafo.trim())
		.filter(Boolean)
		.map(
			(parrafo) =>
				`<p style="margin:0 0 16px;line-height:1.6;color:#334155;">${escaparHtml(
					parrafo
				).replaceAll('\n', '<br>')}</p>`
		)
		.join('');
}

type Destinatario = {
	correo: string;
	nombre: string;
};

/**
 * Verifica que quien llama sea realmente un admin. No alcanza con que el
 * panel esté protegido en el navegador: sin esta comprobación cualquiera
 * podría llamar a este endpoint y usar la cuenta de correo de la tienda.
 */
async function verificarAdmin(request: Request): Promise<string | null> {
	const encabezado = request.headers.get('authorization') ?? '';

	if (!encabezado.startsWith('Bearer ')) {
		return null;
	}

	const token = encabezado.slice('Bearer '.length).trim();

	if (!token) return null;

	try {
		const decodificado = await adminAuth.verifyIdToken(token);
		const snapshot = await adminDb
			.collection('admins')
			.doc(decodificado.uid)
			.get();

		return snapshot.exists ? decodificado.uid : null;
	} catch (error) {
		console.error('Token inválido al intentar enviar cupón:', error);
		return null;
	}
}

async function obtenerDestinatarios(): Promise<Destinatario[]> {
	const snapshot = await adminDb.collection('usuarios').get();

	const porCorreo = new Map<string, Destinatario>();

	for (const doc of snapshot.docs) {
		const datos = doc.data();

		// Quien apagó las promociones desde "Mi cuenta" queda fuera.
		if (datos.recibirPromociones === false) continue;

		const correo = String(datos.correo ?? '').trim().toLowerCase();

		if (!correo || !correo.includes('@')) continue;

		if (!porCorreo.has(correo)) {
			porCorreo.set(correo, {
				correo,
				nombre: String(datos.nombre ?? '').trim()
			});
		}
	}

	return [...porCorreo.values()];
}

function construirHtml(
	nombre: string,
	mensaje: string,
	codigo: string,
	detalleDescuento: string
): string {
	const saludo = nombre ? `Hola, ${escaparHtml(nombre)}` : 'Hola';

	return `
	<div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
		<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
			<div style="text-align:center;margin-bottom:24px;">
				<img src="${SITIO}/correo/logo-correo.png" alt="Moon Beauty" width="140" style="max-width:140px;height:auto;">
			</div>

			<p style="margin:0 0 16px;line-height:1.6;color:#334155;">${saludo},</p>

			${textoAParrafos(mensaje)}

			<div style="margin:28px 0;padding:24px;background:#e0f2fe;border-radius:16px;text-align:center;">
				<p style="margin:0 0 8px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#0369a1;">
					Tu código
				</p>
				<p style="margin:0;font-size:30px;font-weight:bold;letter-spacing:3px;color:#0c4a6e;">
					${escaparHtml(codigo)}
				</p>
				<p style="margin:10px 0 0;color:#0369a1;font-size:14px;">
					${escaparHtml(detalleDescuento)}
				</p>
			</div>

			<div style="text-align:center;margin:28px 0;">
				<a href="${SITIO}/products"
					style="display:inline-block;background:#334155;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:bold;">
					Ver productos
				</a>
			</div>

			<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px;">
				Recibes este correo porque tienes una cuenta en Moon Beauty.
				Puedes dejar de recibir promociones desde
				<a href="${SITIO}/account" style="color:#0369a1;">tu cuenta</a>.
			</p>
		</div>
	</div>`;
}

/**
 * Versión en texto plano. Enviar ambas versiones es lo normal en correo
 * legítimo (y su ausencia es otra señal de correo masivo), así que ayuda
 * tanto a la clasificación como a quien lee sin HTML.
 */
function construirTexto(
	nombre: string,
	mensaje: string,
	codigo: string,
	detalleDescuento: string
): string {
	const saludo = nombre ? `Hola, ${nombre}:` : 'Hola:';

	return [
		saludo,
		'',
		mensaje,
		'',
		`Tu código es ${codigo}${detalleDescuento ? ` (${detalleDescuento})` : ''}. Lo escribes al momento de pagar, en el paso de cupón.`,
		'',
		`Puedes ver los productos acá: ${SITIO}/products`,
		'',
		'Un abrazo,',
		'Moon Beauty',
		'',
		`Si prefieres no recibir estos correos, puedes desactivarlos en ${SITIO}/account`
	].join('\n');
}

export const POST: RequestHandler = async ({ request }) => {
	const uidAdmin = await verificarAdmin(request);

	if (!uidAdmin) {
		return json(
			{ ok: false, error: 'No autorizado.' },
			{ status: 401 }
		);
	}

	if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
		return json(
			{ ok: false, error: 'Faltan configuraciones de correo.' },
			{ status: 500 }
		);
	}

	const datos = await request.json();

	const codigo = String(datos.codigo ?? '').trim().toUpperCase();
	const mensaje = String(datos.mensaje ?? '').trim();
	const asunto = String(datos.asunto ?? '').trim();
	const detalleDescuento = String(datos.detalleDescuento ?? '').trim();
	const soloPrueba = Boolean(datos.soloPrueba);
	const correoPrueba = String(datos.correoPrueba ?? '').trim();

	if (!codigo || !mensaje || !asunto) {
		return json(
			{ ok: false, error: 'Falta el código, el asunto o el mensaje.' },
			{ status: 400 }
		);
	}

	// Envío de prueba: va a una sola dirección para revisar cómo se ve.
	const destinatarios: Destinatario[] = soloPrueba
		? correoPrueba
			? [{ correo: correoPrueba, nombre: '' }]
			: []
		: await obtenerDestinatarios();

	if (destinatarios.length === 0) {
		return json(
			{
				ok: false,
				error: soloPrueba
					? 'Indica un correo para la prueba.'
					: 'No hay destinatarios con correo registrado.'
			},
			{ status: 400 }
		);
	}

	const resend = new Resend(RESEND_API_KEY);

	let enviados = 0;
	const fallidos: string[] = [];

	// Se envía uno por uno para que cada persona reciba su propio correo
	// (nadie ve las direcciones de los demás) y para poder informar con
	// precisión cuáles fallaron.
	for (const destinatario of destinatarios) {
		try {
			const respuesta = await resend.emails.send({
				from: RESEND_FROM_EMAIL,
				to: [destinatario.correo],
				replyTo: RESEND_FROM_EMAIL,
				subject: asunto,
				html: construirHtml(
					destinatario.nombre,
					mensaje,
					codigo,
					detalleDescuento
				),
				text: construirTexto(
					destinatario.nombre,
					mensaje,
					codigo,
					detalleDescuento
				)
			});

			if (respuesta.error) {
				fallidos.push(destinatario.correo);
				console.error(
					`Falló el envío a ${destinatario.correo}:`,
					respuesta.error
				);
			} else {
				enviados++;
			}
		} catch (error) {
			fallidos.push(destinatario.correo);
			console.error(`Error enviando a ${destinatario.correo}:`, error);
		}
	}

	return json({
		ok: true,
		enviados,
		fallidos: fallidos.length,
		total: destinatarios.length
	});
};
