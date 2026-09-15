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
	it('un usuario autenticado SÍ puede crear un pedido propio', async () => {
		const db = testEnv.authenticatedContext('bob-uid').firestore();
		await assertSucceeds(
			db.collection('pedidos').add({ usuarioId: 'bob-uid', totalUSD: 10 })
		);
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

	it('un usuario autenticado SÍ puede sumar exactamente 1 uso', async () => {
		const db = testEnv.authenticatedContext('usuario-normal').firestore();
		await assertSucceeds(db.collection('cupones').doc('MOON20').update({ usos: 1 }));
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
});
