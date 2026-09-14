import type { PageServerLoad } from './$types';

/**
 * Preguntas frecuentes basadas únicamente en hechos ya confirmados en el
 * checkout, la configuración de contacto/pagos y la política de envíos:
 * nada aquí es una afirmación nueva sobre el negocio. A propósito no
 * incluye nada sobre autenticidad de los productos, porque esa es una
 * afirmación de negocio que no corresponde inventar aquí.
 */
const PREGUNTAS = [
	{
		pregunta: '¿Hacen delivery en Valencia y Naguanagua?',
		respuesta:
			'Sí. Hacemos delivery a domicilio en Valencia (el monto se coordina por WhatsApp según tu ubicación) y entrega gratuita en Naguanagua, ambas en el estado Carabobo.'
	},
	{
		pregunta: '¿Hacen envíos a otras ciudades de Venezuela?',
		respuesta:
			'Sí, por encomienda a través de MRW, Zoom o Tealca. El flete lo pagas directamente al retirar el paquete en la agencia.'
	},
	{
		pregunta: '¿Cuánto tarda mi pedido en llegar?',
		respuesta:
			'Depende de la modalidad elegida y de la disponibilidad del courier; te confirmamos el tiempo estimado al coordinar tu pedido por WhatsApp.'
	},
	{
		pregunta: '¿Qué métodos de pago aceptan?',
		respuesta:
			'Efectivo en dólares, pago móvil (Banco de Venezuela), Binance, Zelle y Zinli. Te confirmamos los datos exactos por WhatsApp al coordinar tu pedido.'
	},
	{
		pregunta: '¿Tienen tienda física para comprar en persona?',
		respuesta:
			'No. Moon Beauty opera bajo un modelo de solo delivery y envío: no contamos con un local para visitas.'
	},
	{
		pregunta: '¿Cómo hago un pedido?',
		respuesta:
			'Eliges tus productos en el catálogo del sitio y coordinas y confirmas el pedido por WhatsApp al +58 412-505 0043.'
	},
	{
		pregunta: '¿Qué pasa si mi pedido no llega a tiempo?',
		respuesta:
			'Escríbenos con tu número de pedido y lo investigamos con el courier de inmediato.'
	},
	{
		pregunta: '¿Qué marcas coreanas venden?',
		respuesta:
			'Entre otras, Anua, Arencia, Beauty of Joseon, Celimax, Dr. Althea, Medicube, Purito, Pyunkang Yul, Skin1004 y Tocobo.'
	}
];

export const load: PageServerLoad = async () => {
	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: PREGUNTAS.map(({ pregunta, respuesta }) => ({
			'@type': 'Question',
			name: pregunta,
			acceptedAnswer: {
				'@type': 'Answer',
				text: respuesta
			}
		}))
	};

	return {
		preguntas: PREGUNTAS,
		faqSchema,
		seo: {
			titulo: 'Preguntas Frecuentes | Moon Beauty',
			descripcion:
				'Resolvemos tus dudas sobre delivery en Valencia y Naguanagua, envíos nacionales, métodos de pago y cómo hacer tu pedido en Moon Beauty.'
		}
	};
};
