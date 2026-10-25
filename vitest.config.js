import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // The svelte plugin compiles `*.svelte.js` rune modules so tests can import them.
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
    // SvelteKit normally injects $lib; vitest runs without that layer.
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      '$app/paths': fileURLToPath(new URL('./src/test-support/app-paths-stub.js', import.meta.url)),
      '$app/state': fileURLToPath(new URL('./src/test-support/app-state-stub.js', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.js'],
    // Component tests opt into jsdom with a `@vitest-environment jsdom` docblock.
    environment: 'node',
    setupFiles: ['src/test-support/setup-dom.js'],
    // Page tests step hundreds of frames through jsdom; with every file running in parallel
    // that takes several seconds, past the 5 s default.
    testTimeout: 30_000,
  },
});
