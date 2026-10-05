import { readFileSync } from 'node:fs';
import {
	initializeTestEnvironment,
	assertFails,
	assertSucceeds,
	type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';

/**
 * Pruebas de seguridad de firestore.rules contra el Firebase Emulator
 * Suite (no toca producción). Corren con:
 *
 *   firebase emulators:exec --only firestore "vitest run tests/security/firestore.rules.test.ts"
 *
 * Cada bloque demuestra tanto lo que debe estar bloqueado (un usuario
 * normal manipulando productos/pedidos/roles ajenos) como lo que debe
 * seguir funcionando (comprar, ver el propio pedido, administrar como
 * admin) — para no solo probar la restricción sino también que no se
 * rompió nada legítimo.
 */

let testEnv: RulesTestEnvironment;

const PRODUCTO_ID = 'producto-1';
const PRODUCTO_DATA = { Nombre: 'Sun Stick', marca: 'TOCOBO', precio: 22, stock: 5 };

beforeAll(async () => {
	testEnv = await initializeTestEnvironment({
		projectId: 'moonbeauty-rules-test',
		firestore: {
			rules: readFileSync('firestore.rules', 'utf8')
		}
	});
});

afterAll(async () => {
	await testEnv.cleanup();
});

beforeEach(async () => {
	await testEnv.clearFirestore();

	// Datos base sembrados saltándose las reglas (representan lo que ya
	// existiría en la base de datos real antes de la acción bajo prueba).
	await testEnv.withSecurityRulesDisabled(async (context) => {
		const db = context.firestore();
		await db.collection('productos').doc(PRODUCTO_ID).set(PRODUCTO_DATA);
		await db.collection('admins').doc('admin-uid').set({ desde: 'seed' });
		await db
			.collection('pedidos')
			.doc('pedido-de-alicia')
			.set({ usuarioId: 'alicia-uid', totalUSD: 22, estado: 'pendiente_contacto' });
	});
});

describe('productos — catálogo', () => {
	it('cualquiera (sin sesión) puede leer productos', async () => {
		const db = testEnv.unauthenticatedContext().firestore();
		await assertSucceeds(db.collection('productos').doc(PRODUCTO_ID).get());
	});

	it('un usuario normal NO puede modificar el precio', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(
			db.collection('productos').doc(PRODUCTO_ID).update({ precio: 0.01 })
		);
	});

	it('un usuario normal NO puede modificar el stock', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(
			db.collection('productos').doc(PRODUCTO_ID).update({ stock: 9999 })
		);
	});

	it('un usuario normal NO puede crear un producto', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(
			db.collection('productos').add({ Nombre: 'Falso', precio: 1, stock: 1 })
		);
	});

	it('un usuario normal NO puede eliminar un producto', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(db.collection('productos').doc(PRODUCTO_ID).delete());
	});

	it('un usuario NO autenticado tampoco puede escribir', async () => {
		const db = testEnv.unauthenticatedContext().firestore();
		await assertFails(
			db.collection('productos').doc(PRODUCTO_ID).update({ precio: 0.01 })
		);
	});

	it('un admin SÍ puede modificar precio y stock', async () => {
		const db = testEnv.authenticatedContext('admin-uid').firestore();
		await assertSucceeds(
			db.collection('productos').doc(PRODUCTO_ID).update({ precio: 25, stock: 3 })
		);
	});

	it('un admin SÍ puede eliminar un producto', async () => {
		const db = testEnv.authenticatedContext('admin-uid').firestore();
		await assertSucceeds(db.collection('productos').doc(PRODUCTO_ID).delete());
	});
});

describe('admins — roles y escalada de privilegios', () => {
	it('un usuario normal NO puede leer el documento admin de otro uid', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(db.collection('admins').doc('admin-uid').get());
	});

	it('un usuario normal NO puede crearse a sí mismo como admin (escalada de privilegios)', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(
			db.collection('admins').doc('usuario-normal').set({ autoAsignado: true })
		);
	});

	it('ni siquiera un admin real puede escribir en la colección admins desde el cliente', async () => {
		// La regla es "allow write: if false" a propósito: los admins se
		// crean a mano desde la consola de Firebase, nunca desde la app.
		const db = testEnv.authenticatedContext('admin-uid').firestore();
		await assertFails(
			db.collection('admins').doc('otro-uid').set({ desde: 'admin-cliente' })
		);
	});

	it('un usuario SÍ puede leer su propio documento admin (para confirmar su rol)', async () => {
		const db = testEnv.authenticatedContext('admin-uid').firestore();
		await assertSucceeds(db.collection('admins').doc('admin-uid').get());
	});
});

describe('pedidos — propiedad y privacidad', () => {
	// Los pedidos solo los crea el servidor (crear-pedido, Admin SDK), en la
	// transacción que valida precios y reserva el stock. Crear uno directo
	// desde el cliente permitía precios, total o puntosMoon inventados.
	it('un usuario autenticado NO puede crear directamente un pedido propio', async () => {
		const db = testEnv.authenticatedContext('bob-uid').firestore();
		await assertFails(
			db.collection('pedidos').add({ usuarioId: 'bob-uid', totalUSD: 10 })
		);
	});

	it('NO se puede crear un pedido con id elegido, ni con puntos o precios inventados', async () => {
		const db = testEnv.authenticatedContext('bob-uid').firestore();
		await assertFails(
			db.collection('pedidos').doc('ck_inventado').set({
				usuarioId: 'bob-uid',
				totalUSD: 0.01,
				puntosMoon: 99999,
				reservaEnCheckout: true,
				stockDescontado: true,
				estado: 'confirmado',
				items: [{ id: 'producto-1', cantidad: 1, precioUSD: 0.01 }]
			})
		);
	});

	it('ni siquiera un admin crea pedidos desde el cliente', async () => {
		const db = testEnv.authenticatedContext('admin-uid').firestore();
		await assertFails(
			db.collection('pedidos').add({ usuarioId: 'admin-uid', totalUSD: 10 })
		);
	});

	it('sin sesión tampoco se puede crear un pedido', async () => {
		const db = testEnv.unauthenticatedContext().firestore();
		await assertFails(db.collection('pedidos').add({ usuarioId: 'x', totalUSD: 10 }));
	});

	it('un usuario NO puede crear un pedido a nombre de otro usuario', async () => {
		const db = testEnv.authenticatedContext('bob-uid').firestore();
		await assertFails(
			db.collection('pedidos').add({ usuarioId: 'alicia-uid', totalUSD: 10 })
		);
	});

	it('un usuario SÍ puede leer su propio pedido', async () => {
		const db = testEnv.authenticatedContext('alicia-uid').firestore();
		await assertSucceeds(db.collection('pedidos').doc('pedido-de-alicia').get());
	});

	it('un usuario NO puede leer el pedido de otro usuario', async () => {
		const db = testEnv.authenticatedContext('bob-uid').firestore();
		await assertFails(db.collection('pedidos').doc('pedido-de-alicia').get());
	});

	it('un usuario NO puede modificar el pedido de otro usuario', async () => {
		const db = testEnv.authenticatedContext('bob-uid').firestore();
		await assertFails(
			db.collection('pedidos').doc('pedido-de-alicia').update({ totalUSD: 0.01 })
		);
	});

	it('la compradora NO puede tocar estado, stock ni puntos de su propio pedido', async () => {
		const db = testEnv.authenticatedContext('alicia-uid').firestore();
		for (const cambio of [
			{ estado: 'confirmado' },
			{ stockDescontado: false },
			{ stockDevuelto: true },
			{ puntosMoon: 99999 },
			{ usuarioId: 'bob-uid' },
			{ items: [] }
		]) {
			await assertFails(db.collection('pedidos').doc('pedido-de-alicia').update(cambio));
		}
		await assertFails(db.collection('pedidos').doc('pedido-de-alicia').delete());
	});

	it('un usuario NO puede modificar ni siquiera su propio pedido ya creado', async () => {
		// Diseño actual: los pedidos son inmutables para el comprador una
		// vez creados; solo el admin cambia su estado.
		const db = testEnv.authenticatedContext('alicia-uid').firestore();
		await assertFails(
			db.collection('pedidos').doc('pedido-de-alicia').update({ totalUSD: 0.01 })
		);
	});

	it('un admin SÍ puede leer cualquier pedido', async () => {
		const db = testEnv.authenticatedContext('admin-uid').firestore();
		await assertSucceeds(db.collection('pedidos').doc('pedido-de-alicia').get());
	});

	it('un admin SÍ puede actualizar el estado de cualquier pedido', async () => {
		const db = testEnv.authenticatedContext('admin-uid').firestore();
		await assertSucceeds(
			db.collection('pedidos').doc('pedido-de-alicia').update({ estado: 'confirmado' })
		);
	});
});

describe('usuarios — perfiles', () => {
	beforeEach(async () => {
		await testEnv.withSecurityRulesDisabled(async (context) => {
			await context
				.firestore()
				.collection('usuarios')
				.doc('bob-uid')
				.set({ nombre: 'Bob', correo: 'bob@example.com' });
		});
	});

	it('un usuario SÍ puede editar su propio perfil', async () => {
		const db = testEnv.authenticatedContext('bob-uid').firestore();
		await assertSucceeds(
			db.collection('usuarios').doc('bob-uid').update({ nombre: 'Bob Actualizado' })
		);
	});

	it('un usuario NO puede editar el perfil de otro usuario', async () => {
		const db = testEnv.authenticatedContext('alicia-uid').firestore();
		await assertFails(
			db.collection('usuarios').doc('bob-uid').update({ nombre: 'Hackeado' })
		);
	});

	it('un usuario NO puede leer el perfil de otro usuario', async () => {
		const db = testEnv.authenticatedContext('alicia-uid').firestore();
		await assertFails(db.collection('usuarios').doc('bob-uid').get());
	});

	it('un admin SÍ puede leer el perfil de cualquier usuario', async () => {
		const db = testEnv.authenticatedContext('admin-uid').firestore();
		await assertSucceeds(db.collection('usuarios').doc('bob-uid').get());
	});
});

describe('cupones', () => {
	beforeEach(async () => {
		await testEnv.withSecurityRulesDisabled(async (context) => {
			await context.firestore().collection('cupones').doc('MOON20').set({
				activo: true,
				usos: 0,
				limiteUsos: 10,
				fechaVencimiento: null
			});
		});
	});

	it('cualquiera puede leer (get) un cupón por su código exacto', async () => {
		const db = testEnv.unauthenticatedContext().firestore();
		await assertSucceeds(db.collection('cupones').doc('MOON20').get());
	});

	it('un usuario normal NO puede listar la colección de cupones', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(db.collection('cupones').get());
	});

	// El contador de usos ya no se incrementa desde el cliente: desde que
	// crear-pedido lo valida y cuenta en el servidor con el Admin SDK
	// (que no pasa por estas reglas), permitir el +1 aquí solo dejaba que
	// cualquier sesión anónima agotara el límite de un cupón sin comprar
	// (pentest de cupones, auditoría de seguridad).
	it('un usuario normal NO puede sumar ni siquiera 1 uso (el conteo ya es solo del servidor)', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(db.collection('cupones').doc('MOON20').update({ usos: 1 }));
	});

	it('un usuario NO puede saltar el contador de usos (sumar más de 1 de golpe)', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(db.collection('cupones').doc('MOON20').update({ usos: 5 }));
	});

	it('un usuario NO puede modificar otros campos del cupón junto con el contador', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(
			db.collection('cupones').doc('MOON20').update({ usos: 1, limiteUsos: 999999 })
		);
	});

	it('un usuario NO puede modificar un cupón directamente (crear/borrar/reescribir)', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertFails(
			db.collection('cupones').doc('NUEVO').set({ activo: true, usos: 0 })
		);
	});

	it('un admin SÍ puede crear, editar (incluido "usos") y borrar cupones', async () => {
		const db = testEnv.authenticatedContext('admin-uid').firestore();
		await assertSucceeds(
			db.collection('cupones').doc('NUEVO').set({ activo: true, usos: 0, limiteUsos: 5 })
		);
		await assertSucceeds(
			db.collection('cupones').doc('MOON20').update({ usos: 3, limiteUsos: 20 })
		);
		await assertSucceeds(db.collection('cupones').doc('NUEVO').delete());
	});
});

describe('cupones personales (canjeados con puntos)', () => {
	beforeEach(async () => {
		await testEnv.withSecurityRulesDisabled(async (context) => {
			const db = context.firestore();
			await db.collection('cupones').doc('ALICIA10').set({
				activo: true,
				usos: 0,
				limiteUsos: 1,
				usuarioId: 'alicia-uid'
			});
			await db.collection('cupones').doc('BOB20').set({
				activo: true,
				usos: 0,
				limiteUsos: 1,
				usuarioId: 'bob-uid'
			});
		});
	});

	it('una clienta SÍ puede listar sus propios códigos canjeados', async () => {
		const db = testEnv.authenticatedContext('alicia-uid').firestore();
		await assertSucceeds(
			db.collection('cupones').where('usuarioId', '==', 'alicia-uid').get()
		);
	});

	it('una clienta NO puede listar los códigos de otra cuenta', async () => {
		const db = testEnv.authenticatedContext('alicia-uid').firestore();
		await assertFails(db.collection('cupones').where('usuarioId', '==', 'bob-uid').get());
	});

	it('una clienta NO puede crearse un cupón personal desde el cliente', async () => {
		const db = testEnv.authenticatedContext('alicia-uid').firestore();
		await assertFails(
			db.collection('cupones').doc('GRATIS').set({
				activo: true,
				usos: 0,
				limiteUsos: 1,
				valor: 100,
				usuarioId: 'alicia-uid'
			})
		);
	});
});

describe('puntos Moon Beauty', () => {
	beforeEach(async () => {
		await testEnv.withSecurityRulesDisabled(async (context) => {
			const db = context.firestore();
			await db.collection('puntos').doc('alicia-uid').set({ saldo: 12 });
			await db
				.collection('puntos')
				.doc('alicia-uid')
				.collection('movimientos')
				.doc('mov-1')
				.set({ tipo: 'ganados', puntos: 12 });
		});
	});

	it('una clienta SÍ puede leer su saldo y su historial', async () => {
		const db = testEnv.authenticatedContext('alicia-uid').firestore();
		await assertSucceeds(db.collection('puntos').doc('alicia-uid').get());
		await assertSucceeds(
			db.collection('puntos').doc('alicia-uid').collection('movimientos').get()
		);
	});

	it('una clienta NO puede leer los puntos de otra cuenta', async () => {
		const db = testEnv.authenticatedContext('bob-uid').firestore();
		await assertFails(db.collection('puntos').doc('alicia-uid').get());
		await assertFails(
			db.collection('puntos').doc('alicia-uid').collection('movimientos').get()
		);
	});

	it('una clienta NO puede subirse el saldo ni inventar movimientos', async () => {
		const db = testEnv.authenticatedContext('alicia-uid').firestore();
		await assertFails(db.collection('puntos').doc('alicia-uid').update({ saldo: 9999 }));
		await assertFails(db.collection('puntos').doc('bob-uid').set({ saldo: 9999 }));
		await assertFails(
			db
				.collection('puntos')
				.doc('alicia-uid')
				.collection('movimientos')
				.add({ tipo: 'ganados', puntos: 500 })
		);
	});

	it('sin sesión no se puede leer ningún saldo', async () => {
		const db = testEnv.unauthenticatedContext().firestore();
		await assertFails(db.collection('puntos').doc('alicia-uid').get());
	});

	it('un admin SÍ puede sumar puntos y registrar el movimiento', async () => {
		const db = testEnv.authenticatedContext('admin-uid').firestore();
		await assertSucceeds(db.collection('puntos').doc('alicia-uid').update({ saldo: 20 }));
		await assertSucceeds(
			db
				.collection('puntos')
				.doc('alicia-uid')
				.collection('movimientos')
				.add({ tipo: 'ganados', puntos: 8 })
		);
	});
});
