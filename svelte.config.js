import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// El adapter (kit.adapter) vive en vite.config.ts: en cuanto se le pasan
// opciones al plugin sveltekit() ahí, esta sección "kit" de acá se ignora
// para el build real (svelte-check y el editor sí leen este archivo, por
// eso preprocess se mantiene).
const config = {
	preprocess: vitePreprocess()
};

export default config;