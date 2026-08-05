import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

import type { RequestHandler } from './$types';

const RESEND_API_KEY = env.RESEND_API_KEY ?? '';
const COMPANY_ORDER_EMAIL = env.COMPANY_ORDER_EMAIL ?? '';
const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL ?? '';

type ItemPedido = {
	nombre: string;
	cantidad: number;
	precioUSD: number;
	subtotalUSD: number;
};

type DatosPedido = {
	numeroPedido: string;
	nombre: string;
	correo: string;
	telefono: string;
	metodoPago: string;
	items: ItemPedido[];
	totalUSD: number;
	tasaBCV: number;
	totalVES: number;
};


function escaparHtml(valor: unknown): string {
	return String(valor ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

function formatearNumero(valor: number): string {
	return new Intl.NumberFormat('es-VE', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(valor);
}

function obtenerMetodoPago(metodo: string): string {
	const metodos: Record<string, string> = {
		efectivo: 'Efectivo',
		pago_movil: 'Pago móvil',
		binance: 'Binance'
	};

	return metodos[metodo] ?? metodo;
}

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
	try {
		const datos = (await request.json()) as DatosPedido;

		if (!datos.numeroPedido?.trim()) {
			return json(
				{
					ok: false,
					error: 'Falta el número del pedido.'
				},
				{
					status: 400
				}
			);
		}

		if (!datos.nombre?.trim()) {
			return json(
				{
					ok: false,
					error: 'Falta el nombre del comprador.'
				},
				{
					status: 400
				}
			);
		}

		if (!datos.correo?.trim() && !datos.telefono?.trim()) {
			return json(
				{
					ok: false,
					error: 'Falta el correo o el teléfono del comprador.'
				},
				{
					status: 400
				}
			);
		}

		if (!datos.items?.length) {
			return json(
				{
					ok: false,
					error: 'El pedido no tiene productos.'
				},
				{
					status: 400
				}
			);
		}

		const html = `
			<div style="font-family: Arial, sans-serif; color: #111827;">
				<h2 style="margin-bottom: 12px;">Nuevo pedido recibido</h2>
				<p><strong>Número del pedido:</strong> ${escaparHtml(datos.numeroPedido)}</p>
				<p><strong>Comprador:</strong> ${escaparHtml(datos.nombre)}</p>
				<p><strong>Correo:</strong> ${escaparHtml(datos.correo ?? '')}</p>
				<p><strong>Teléfono:</strong> ${escaparHtml(datos.telefono ?? '')}</p>
				<p><strong>Método de pago:</strong> ${escaparHtml(obtenerMetodoPago(datos.metodoPago))}</p>
				<p><strong>Total USD:</strong> ${escaparHtml(formatearNumero(datos.totalUSD))}</p>
				<p><strong>Tasa BCV:</strong> ${escaparHtml(formatearNumero(datos.tasaBCV))}</p>
				<p><strong>Total VES:</strong> ${escaparHtml(formatearNumero(datos.totalVES))}</p>
				<h3 style="margin-top: 16px;">Productos</h3>
				<table style="border-collapse: collapse; width: 100%;">
					<thead>
						<tr>
							<th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Producto</th>
							<th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Cantidad</th>
							<th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Precio USD</th>
							<th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Subtotal USD</th>
						</tr>
					</thead>
					<tbody>
						${datos.items
							.map(
								(item) => `
									<tr>
										<td style="border: 1px solid #d1d5db; padding: 8px;">${escaparHtml(item.nombre)}</td>
										<td style="border: 1px solid #d1d5db; padding: 8px;">${escaparHtml(item.cantidad)}</td>
										<td style="border: 1px solid #d1d5db; padding: 8px;">${escaparHtml(formatearNumero(item.precioUSD))}</td>
										<td style="border: 1px solid #d1d5db; padding: 8px;">${escaparHtml(formatearNumero(item.subtotalUSD))}</td>
									</tr>
								`
							)
							.join('')}
					</tbody>
				</table>
			</div>
		`;

		if (!RESEND_API_KEY || !COMPANY_ORDER_EMAIL || !RESEND_FROM_EMAIL) {
			return json(
				{
					ok: false,
					error: 'Faltan configuraciones de correo.'
				},
				{
					status: 500
				}
			);
		}

		const resend = new Resend(
	RESEND_API_KEY
);
		const { error: emailError } = await resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: [COMPANY_ORDER_EMAIL],
			subject: `Nuevo pedido ${datos.numeroPedido}`,
			html
		});

		if (emailError) {
			return json(
				{
					ok: false,
					error: emailError.message ?? 'No se pudo enviar el correo.'
				},
				{
					status: 500
				}
			);
		}

		return json({
			ok: true,
			message: 'Pedido enviado correctamente.'
		});
	} catch (error) {
		console.error('Error al enviar pedido:', error);

		return json(
			{
				ok: false,
				error: 'No se pudo procesar el pedido.'
			},
			{
				status: 500
			}
		);
	}
};
