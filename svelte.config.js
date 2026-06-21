import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Pure front SPA: prerender the shell, fall back to it for every route.
    // 404.html doubles as the SPA shell GitHub Pages serves on unknown paths.
    adapter: adapter({
      fallback: '404.html',
      precompress: false,
      strict: false,
    }),
    // GitHub Pages serves project sites under /<repo>/. Set BASE_PATH=/<repo>
    // at build time (the deploy workflow does this automatically). Empty locally.
    paths: {
      base: process.env['BASE_PATH'] ?? '',
    },
    alias: {
      $lib: './src/lib',
      $components: './src/components',
    },
  },
};

export default config;
