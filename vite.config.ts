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
			// plugin sveltekit() acá, así que el adapter tiene que vivir
			// en este archivo para que realmente se use.
			adapter: adapter()
		})
	]
});
