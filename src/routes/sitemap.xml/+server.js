import { resolve } from '$app/paths';
import { sitemapPaths, sitemapXml } from '$lib/curriculum/sitemap.js';

export const prerender = true;
export const trailingSlash = 'never';

/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {
  // url is this file's live address (prerender.origin in svelte.config.js), and resolve() may
  // return a path relative to it, so each page URL is resolved against it.
  const urls = sitemapPaths().map((p) => new URL(resolve(/** @type {'/'} */ (p)), url).href);
  return new Response(sitemapXml(urls), { headers: { 'content-type': 'application/xml' } });
}
