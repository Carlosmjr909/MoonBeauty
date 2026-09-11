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

type EntregaPedido = {
	direccion: string;
	casaApartamento?: string;
	ciudad: string;
	codigoPostal?: string;
	estado: string;
};

type ComprobantePago = {
	url?: string | null;
	referencia?: string | null;
};

type EnvioNacional = {
	empresa: string;
	nombreCompleto: string;
	documento: string;
	telefono: string;
	agencia: {
		calle: string;
		avenida: string;
		parroquia: string;
		ciudad: string;
		estado: string;
	};
};

type DatosPedido = {
	numeroPedido: string;
	nombre: string;
	correo: string;
	telefono: string;
	tipoEntrega?: string;
	envioNacional?: EnvioNacional | null;
	entrega: EntregaPedido;
	metodoPago: string;
	comprobantePago?: ComprobantePago;
	items: ItemPedido[];
	subtotalUSD: number;
	cupon?: string | null;
	descuentoUSD?: number;
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
		binance: 'Binance',
		zelle: 'Zelle',
		zinli: 'Zinli'
	};

	return metodos[metodo] ?? metodo;
}

function filaDescuento(datos: DatosPedido): string {
	if (!datos.cupon || !datos.descuentoUSD) {
		return '';
	}

	return `
		<p><strong>Subtotal USD:</strong> ${escaparHtml(formatearNumero(datos.subtotalUSD))}</p>
		<p><strong>Cupón aplicado:</strong> ${escaparHtml(datos.cupon)} (-${escaparHtml(formatearNumero(datos.descuentoUSD))} USD)</p>
	`;
}

const NOMBRES_EMPRESA_ENVIO: Record<string, string> = {
	mrw: 'MRW',
	zoom: 'Zoom',
	tealca: 'Tealca'
};

function filaEntrega(datos: DatosPedido): string {
	// Envío por encomienda: lo que importa es a qué agencia va y quién
	// retira, no una dirección de domicilio.
	if (datos.tipoEntrega === 'envio_nacional' && datos.envioNacional) {
		const envio = datos.envioNacional;
		const empresa =
			NOMBRES_EMPRESA_ENVIO[envio.empresa] ?? envio.empresa;

		const direccionAgencia = [
			envio.agencia.calle,
			envio.agencia.avenida,
			envio.agencia.parroquia
		]
			.map((parte) => parte?.trim())
			.filter(Boolean)
			.join(', ');

		return `
		<h3 style="margin-top: 16px;">Envío a nivel nacional (cobro a destino)</h3>
		<p><strong>Empresa:</strong> ${escaparHtml(empresa)}</p>
		<p><strong>Quien retira:</strong> ${escaparHtml(envio.nombreCompleto)}</p>
		<p><strong>Cédula / RIF:</strong> ${escaparHtml(envio.documento)}</p>
		<p><strong>Teléfono:</strong> ${escaparHtml(envio.telefono)}</p>
		${direccionAgencia ? `<p><strong>Agencia:</strong> ${escaparHtml(direccionAgencia)}</p>` : ''}
		<p><strong>Ciudad:</strong> ${escaparHtml(envio.agencia.ciudad)}</p>
		<p><strong>Estado:</strong> ${escaparHtml(envio.agencia.estado)}</p>
	`;
	}

	const entrega = datos.entrega;
	if (!entrega) return '';

	const casaApartamento = entrega.casaApartamento?.trim();
	const codigoPostal = entrega.codigoPostal?.trim();

	return `
		<h3 style="margin-top: 16px;">Entrega a domicilio</h3>
		<p><strong>Dirección:</strong> ${escaparHtml(entrega.direccion)}</p>
		${casaApartamento ? `<p><strong>Casa/Apartamento:</strong> ${escaparHtml(casaApartamento)}</p>` : ''}
		<p><strong>Ciudad:</strong> ${escaparHtml(entrega.ciudad)}</p>
		<p><strong>Estado:</strong> ${escaparHtml(entrega.estado)}</p>
		${codigoPostal ? `<p><strong>Código postal:</strong> ${escaparHtml(codigoPostal)}</p>` : ''}
	`;
}

function filaComprobante(datos: DatosPedido): string {
	const comprobante = datos.comprobantePago;
	if (!comprobante || (!comprobante.url && !comprobante.referencia)) {
		return '';
	}

	const referencia = comprobante.referencia?.trim();

	return `
		<h3 style="margin-top: 16px;">Comprobante de pago</h3>
		${referencia ? `<p><strong>Referencia:</strong> ${escaparHtml(referencia)}</p>` : ''}
		${comprobante.url ? `<p><a href="${escaparHtml(comprobante.url)}">Ver comprobante subido</a></p>` : ''}
	`;
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

		const filasProductos = datos.items
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
			.join('');

		const tablaProductos = `
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
					${filasProductos}
				</tbody>
			</table>
		`;

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

		const htmlEmpresa = `
			<div style="font-family: Arial, sans-serif; color: #111827;">
				${encabezadoCorreo}
				<h2 style="margin-bottom: 12px;">Nuevo pedido recibido</h2>
				<p><strong>Número del pedido:</strong> ${escaparHtml(datos.numeroPedido)}</p>
				<p><strong>Comprador:</strong> ${escaparHtml(datos.nombre)}</p>
				<p><strong>Correo:</strong> ${escaparHtml(datos.correo ?? '')}</p>
				<p><strong>Teléfono:</strong> ${escaparHtml(datos.telefono ?? '')}</p>
				<p><strong>Método de pago:</strong> ${escaparHtml(obtenerMetodoPago(datos.metodoPago))}</p>
				${filaDescuento(datos)}
				<p><strong>Total USD:</strong> ${escaparHtml(formatearNumero(datos.totalUSD))}</p>
				<p><strong>Tasa BCV:</strong> ${escaparHtml(formatearNumero(datos.tasaBCV))}</p>
				<p><strong>Total VES:</strong> ${escaparHtml(formatearNumero(datos.totalVES))}</p>
				${filaEntrega(datos)}
				${filaComprobante(datos)}
				${tablaProductos}
			</div>
		`;

		const htmlComprador = `
			<div style="font-family: Arial, sans-serif; color: #111827;">
				${encabezadoCorreo}
				<h2 style="margin-bottom: 12px;">¡Gracias por tu compra, ${escaparHtml(datos.nombre)}!</h2>
				<p>Recibimos tu pedido y pronto nos pondremos en contacto para coordinar el pago y la entrega.</p>
				<p><strong>Número del pedido:</strong> ${escaparHtml(datos.numeroPedido)}</p>
				<p><strong>Método de pago:</strong> ${escaparHtml(obtenerMetodoPago(datos.metodoPago))}</p>
				${filaDescuento(datos)}
				<p><strong>Total USD:</strong> ${escaparHtml(formatearNumero(datos.totalUSD))}</p>
				<p><strong>Tasa BCV:</strong> ${escaparHtml(formatearNumero(datos.tasaBCV))}</p>
				<p><strong>Total VES:</strong> ${escaparHtml(formatearNumero(datos.totalVES))}</p>
				${filaEntrega(datos)}
				${tablaProductos}
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

		const correoComprador = datos.correo?.trim();

		const [envioEmpresa, envioComprador] = await Promise.all([
			resend.emails.send({
				from: RESEND_FROM_EMAIL,
				to: [COMPANY_ORDER_EMAIL],
				subject: `Nuevo pedido ${datos.numeroPedido}`,
				html: htmlEmpresa
			}),
			correoComprador
				? resend.emails.send({
						from: RESEND_FROM_EMAIL,
						to: [correoComprador],
						subject: `Confirmación de tu pedido ${datos.numeroPedido}`,
						html: htmlComprador
					})
				: Promise.resolve({ error: null })
		]);

		if (envioEmpresa.error) {
			return json(
				{
					ok: false,
					error: envioEmpresa.error.message ?? 'No se pudo enviar el correo a la empresa.'
				},
				{
					status: 500
				}
			);
		}

		if (envioComprador.error) {
			console.error(
				'El correo a la empresa se envió, pero falló el del comprador:',
				envioComprador.error
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
