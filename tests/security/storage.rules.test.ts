import { readFileSync } from 'node:fs';
import {
	initializeTestEnvironment,
	assertFails,
	assertSucceeds,
	type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { beforeAll, afterAll, describe, it } from 'vitest';

/**
 * Pruebas de storage.rules contra el emulador. Corren con:
 *
 *   firebase emulators:exec --only storage,firestore "vitest run tests/security/storage.rules.test.ts"
 *
 * El emulador de Storage evalúa firestore.exists(...) contra el emulador
 * de Firestore, así que ambos deben estar corriendo (por eso el comando
 * incluye "firestore" aunque estas pruebas solo escriban en Storage).
 */

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
	testEnv = await initializeTestEnvironment({
		projectId: 'moonbeauty-rules-test',
		storage: {
			rules: readFileSync('storage.rules', 'utf8')
		},
		firestore: {
			rules: readFileSync('firestore.rules', 'utf8')
		}
	});

	await testEnv.withSecurityRulesDisabled(async (context) => {
		await context.firestore().collection('admins').doc('admin-uid').set({ desde: 'seed' });
	});
});

afterAll(async () => {
	await testEnv.cleanup();
});

const ARCHIVO_PNG = new Uint8Array([137, 80, 78, 71]); // firma PNG, contenido no importa acá

describe('comprobantes de pago — B1: solo el dueño (o admin) puede leer', () => {
	it('el comprador SÍ puede subir su propio comprobante con su uid en la metadata', async () => {
		const storage = testEnv.authenticatedContext('alicia-uid').storage();
		const archivo = storage.ref('comprobantes/prueba-alicia.png');

		await assertSucceeds(
			Promise.resolve(archivo.put(ARCHIVO_PNG, {
				contentType: 'image/png',
				customMetadata: { uid: 'alicia-uid' }
			}))
		);
	});

	it('el dueño SÍ puede leer/descargar su propio comprobante', async () => {
		const storage = testEnv.authenticatedContext('alicia-uid').storage();
		await assertSucceeds(storage.ref('comprobantes/prueba-alicia.png').getMetadata());
	});

	it('otro usuario autenticado NO puede leer el comprobante de alicia', async () => {
		const storage = testEnv.authenticatedContext('bob-uid').storage();
		await assertFails(storage.ref('comprobantes/prueba-alicia.png').getMetadata());
	});

	it('un usuario NO autenticado no puede leer ningún comprobante', async () => {
		const storage = testEnv.unauthenticatedContext().storage();
		await assertFails(storage.ref('comprobantes/prueba-alicia.png').getMetadata());
	});

	it('un admin SÍ puede leer el comprobante de cualquier comprador', async () => {
		const storage = testEnv.authenticatedContext('admin-uid').storage();
		await assertSucceeds(storage.ref('comprobantes/prueba-alicia.png').getMetadata());
	});

	it('un usuario SÍ puede subir el suyo aunque sea una sesión anónima de invitado', async () => {
		const storage = testEnv.authenticatedContext('invitado-anonimo-uid').storage();
		await assertSucceeds(
			Promise.resolve(storage.ref('comprobantes/prueba-invitado.png').put(ARCHIVO_PNG, {
				contentType: 'image/png',
				customMetadata: { uid: 'invitado-anonimo-uid' }
			}))
		);
	});
});

describe('productos/categorias/marcas — solo admin escribe', () => {
	it('un usuario normal NO puede subir una imagen de producto', async () => {
		const storage = testEnv.authenticatedContext('usuario-normal').storage();
		await assertFails(
			Promise.resolve(storage
				.ref('productos/falsa.png')
				.put(ARCHIVO_PNG, { contentType: 'image/png' }))
		);
	});

	it('un admin SÍ puede subir una imagen de producto', async () => {
		const storage = testEnv.authenticatedContext('admin-uid').storage();
		await assertSucceeds(
			Promise.resolve(storage
				.ref('productos/real.png')
				.put(ARCHIVO_PNG, { contentType: 'image/png' }))
		);
	});

	it('cualquiera puede leer imágenes de producto (catálogo público)', async () => {
		const storage = testEnv.unauthenticatedContext().storage();
		await assertSucceeds(storage.ref('productos/real.png').getMetadata());
	});

	it('rechaza un archivo que no sea imagen en /productos', async () => {
		const storage = testEnv.authenticatedContext('admin-uid').storage();
		await assertFails(
			Promise.resolve(storage
				.ref('productos/script.exe')
				.put(ARCHIVO_PNG, { contentType: 'application/octet-stream' }))
		);
	});
});
