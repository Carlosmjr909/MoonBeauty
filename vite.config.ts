import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// svelte.config.js se ignora en cuanto se le pasan opciones al
			// plugin sveltekit() acá, así que el adapter (y el resto de la
			// config de "kit", como csp) tienen que vivir en este archivo
			// para que realmente se usen.
			adapter: adapter(),

			// Content-Security-Policy con nonce automático de SvelteKit
			// (mode: "auto" usa nonce en páginas dinámicas como esta app).
			// Solo se permiten los dominios externos que el sitio usa de
			// verdad, confirmados navegando el sitio real:
			// - firebasestorage.googleapis.com: imágenes/videos de productos
			//   e Instagram (Firebase Storage).
			// - identitytoolkit/securetoken/firestore.googleapis.com: SDK de
			//   Firebase Auth y Firestore.
			// - apis.google.com: librería de "Iniciar sesión con Google".
			// - moonbeauty-9ba8f.firebaseapp.com: iframe interno que usa
			//   Firebase Auth para el popup de Google (sin esto se rompe
			//   el login con Google).
			// - api.iconify.design: @iconify/svelte pide los íconos en vivo.
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self', 'https://apis.google.com'],
					// Varios componentes usan estilos inline dinámicos
					// (transform-origin del zoom, alturas de logos, padding
					// del carrusel), así que style-src necesita
					// unsafe-inline. El riesgo es mucho menor que en
					// script-src (no permite ejecutar JS).
					'style-src': ['self', 'unsafe-inline'],
					// "data:" es necesario porque Vite inserta el favicon.svg
					// del sitio como data URI (es más chico que su umbral de
					// inlineado); no es un permiso genérico para cualquier
					// imagen externa.
					'img-src': ['self', 'data:', 'https://firebasestorage.googleapis.com'],
					'font-src': ['self'],
					'media-src': ['self', 'https://firebasestorage.googleapis.com'],
					'connect-src': [
						'self',
						// api.iconify.design es el principal; simplesvg.com y
						// unisvg.com son los espejos a los que @iconify/svelte
						// cambia automáticamente si el principal no responde.
						'https://api.iconify.design',
						'https://api.simplesvg.com',
						'https://api.unisvg.com',
						'https://identitytoolkit.googleapis.com',
						'https://securetoken.googleapis.com',
						'https://firestore.googleapis.com',
						'https://firebasestorage.googleapis.com'
					],
					'frame-src': ['https://moonbeauty-9ba8f.firebaseapp.com'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['self'],
					'upgrade-insecure-requests': true
				}
			}
		})
	]
});
