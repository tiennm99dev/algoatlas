import { chapters } from './index.js';

/**
 * Every page a search engine should index, root-relative with the trailing slash the
 * prerendered directories need: the home page, the glossary, each topic hub and each lesson.
 * @returns {string[]}
 */
export function sitemapPaths() {
  return [
    '/',
    '/thuat-ngu/',
    ...chapters.flatMap((c) => [`/${c.slug}/`, ...c.lessons.map((l) => `/${c.slug}/${l.slug}/`)]),
  ];
}

/**
 * The sitemap XML for the given absolute page URLs.
 * @param {string[]} urls
 */
export function sitemapXml(urls) {
  const entries = urls.map((u) => `  <url><loc>${u}</loc></url>\n`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}</urlset>\n`;
}
