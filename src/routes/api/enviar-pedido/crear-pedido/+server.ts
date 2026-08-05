import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

import {
	adminAuth,
	adminDb
} from '$lib/server/firebase-admin';


type ProductoPedido = {
	id: string | number;
	cantidad: number;
};


type ProductoBD = {
	id: string;
	Nombre: string;
	imagen: string;
	precio: number;
};


type DatosPedido = {
	token: string;
	contacto: {
		nombre: string;
		correo: string;
		telefono: string;
	};

	metodoPago: 
		| 'efectivo'
		| 'pago_movil'
		| 'binance';

	productos: ProductoPedido[];
};


export const POST: RequestHandler = async ({
	request
}) => {

	try {

		const datos =
			await request.json() as DatosPedido;


		/*
			1. Verificar usuario Firebase
		*/

		if (!datos.token) {
			return json(
				{
					error:
						'Usuario no autenticado.'
				},
				{
					status:401
				}
			);
		}


		const usuario =
			await adminAuth.verifyIdToken(
				datos.token
			);



		/*
			2. Validar productos
		*/

		if (
			!datos.productos ||
			datos.productos.length === 0
		) {

			return json(
				{
					error:
						'El carrito está vacío.'
				},
				{
					status:400
				}
			);

		}



		/*
			3. Buscar productos reales
		*/


		const productosSnap =
			await adminDb
			.collection('productos')
			.get();



		const productosBD: ProductoBD[] =
			productosSnap.docs.map(doc => {
				const data =
					doc.data() as Partial<ProductoBD>;

				return {
					id: doc.id,
					Nombre:
						String(data.Nombre ?? ''),
					imagen:
						String(data.imagen ?? ''),
					precio:
						Number(data.precio ?? 0)
				};
			});



		let totalUSD = 0;


		const productosFinales =
			datos.productos.map(item => {


				const producto =
					productosBD.find(
						p =>
						String(p.id)
						===
						String(item.id)
					);



				if (!producto) {

					throw new Error(
						`Producto ${item.id} no existe`
					);

				}



				const cantidad =
					Number(item.cantidad);



				const subtotal =
					producto.precio *
					cantidad;



				totalUSD += subtotal;



				return {

					id:
						producto.id,

					nombre:
						producto.Nombre,

					imagen:
						producto.imagen,

					precio:
						producto.precio,

					cantidad,

					subtotal

				};

			});



		/*
			4. Obtener tasa BCV
		*/


		const respuestaBCV =
			await fetch(
				'https://ve.dolarapi.com/v1/dolares/oficial'
			);


		const datosBCV =
			await respuestaBCV.json();



		const tasa =
			Number(
				datosBCV.promedio
			);



		if (!tasa) {

			throw new Error(
				'No se pudo obtener la tasa BCV.'
			);

		}



		const totalVES =
			totalUSD * tasa;



		/*
			5. Crear número pedido
		*/


		const fecha =
			new Date()
			.toISOString()
			.slice(0,10)
			.replaceAll('-','');


		const codigo =
			crypto
			.randomUUID()
			.slice(0,6)
			.toUpperCase();



		const numeroPedido =
			`MB-${fecha}-${codigo}`;



		/*
			6. Guardar pedido
		*/


		await adminDb
		.collection('pedidos')
		.add({

			numeroPedido,

			usuarioId:
				usuario.uid,


			contacto:
				datos.contacto,


			metodoPago:
				datos.metodoPago,


			productos:
				productosFinales,


			totalUSD,


			tasaBCV:
				tasa,


			totalVES,


			estado:
				'pendiente_contacto',


			fecha:
				new Date()

		});



		return json({

			ok:true,

			numeroPedido,

			totalUSD,

			totalVES,

			tasaBCV:tasa

		});



	}
	catch(error){

		console.error(
			'Error creando pedido:',
			error
		);


		return json(
			{
				error:
				error instanceof Error
				?
				error.message
				:
				'Error desconocido'
			},
			{
				status:500
			}
		);

	}

};