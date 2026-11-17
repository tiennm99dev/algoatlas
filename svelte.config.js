import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const base = process.env.SITE_BASE ?? '/algoatlas';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    paths: { base },
    // The live host, which url.origin reports while prerendering, so the sitemap names absolute
    // URLs; SITE_ORIGIN overrides it like SITE_BASE does base.
    prerender: { origin: process.env.SITE_ORIGIN ?? 'https://tiennm99dev.github.io' },
    // Hash mode puts a CSP meta tag with script hashes on every prerendered page.
    // Inline styles stay allowed because Svelte writes style attributes at runtime.
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:'],
        'font-src': ['self'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
      },
    },
  },
};

export default config;
