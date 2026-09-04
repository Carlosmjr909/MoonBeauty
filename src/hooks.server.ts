import type { Handle } from '@sveltejs/kit';

/**
 * Headers de seguridad aplicados a toda respuesta del sitio.
 *
 * La Content-Security-Policy se configura aparte, en vite.config.ts, con
 * el sistema nativo de nonce de SvelteKit (necesita generarse por
 * request junto con el HTML, algo que este hook no puede hacer).
 */
export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');

	// Complementa frame-ancestors de la CSP para navegadores viejos que
	// no la soportan. El sitio no necesita ser embebido en iframes.
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');

	response.headers.set(
		'Referrer-Policy',
		'strict-origin-when-cross-origin'
	);

	// Se deshabilitan explícitamente las funciones del navegador que el
	// sitio no usa. No se restringe "fullscreen" porque los videos de
	// Instagram sí lo aprovechan con los controles nativos.
	response.headers.set(
		'Permissions-Policy',
		[
			'camera=()',
			'microphone=()',
			'geolocation=()',
			'payment=()',
			'usb=()',
			'bluetooth=()',
			'midi=()',
			'magnetometer=()',
			'gyroscope=()',
			'accelerometer=()'
		].join(', ')
	);

	// "same-origin" (a secas) rompe signInWithPopup de Firebase/Google:
	// el popup de Google pierde la referencia a la ventana que lo abrió.
	// "same-origin-allow-popups" mantiene la protección contra otras
	// páginas sin romper el login.
	response.headers.set(
		'Cross-Origin-Opener-Policy',
		'same-origin-allow-popups'
	);

	// Nadie más necesita embeber recursos de este sitio.
	response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

	// No se agrega Cross-Origin-Embedder-Policy: exigiría que Firebase
	// Storage, Iconify y Google tengan headers CORP/CORS compatibles, lo
	// cual no está garantizado, y el sitio no usa SharedArrayBuffer/WASM
	// que la justifique.

	// Vercel ya agrega un HSTS básico a nivel de plataforma, pero sin
	// includeSubDomains; este header explícito lo reemplaza. Sin
	// "preload" a propósito.
	response.headers.set(
		'Strict-Transport-Security',
		'max-age=31536000; includeSubDomains'
	);

	return response;
};
