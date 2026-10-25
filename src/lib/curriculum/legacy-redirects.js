/**
 * Lessons that changed topic keep their old URL as a redirect page.
 * @typedef {object} LegacyRedirect
 * @property {string} topic  Old topic segment.
 * @property {string} slug  Old lesson segment.
 * @property {string} to  New path, with the trailing slash.
 */

/** @type {LegacyRedirect[]} */
export const legacyRedirects = [
  { topic: 'structures', slug: 'bst', to: '/trees/bst/' },
  { topic: 'graphs', slug: 'dijkstra-grid', to: '/shortest-paths/dijkstra-grid/' },
];

/**
 * The redirect for an old topic and lesson segment, if there is one.
 * @param {string} topic
 * @param {string} slug
 */
export function findRedirect(topic, slug) {
  return legacyRedirects.find((r) => r.topic === topic && r.slug === slug);
}
