import { lessonRouteFile } from '$lib/curriculum/stubs.js';

// A written lesson has its own static route; only the glob keys are read, nothing is loaded.
const routeFiles = import.meta.glob('/src/routes/*/*/+page.svelte');

/**
 * Whether a lesson has a hand-written route at `/<topic>/<slug>/`.
 * @param {string} topic
 * @param {string} slug
 */
export function hasStaticRoute(topic, slug) {
  return Object.hasOwn(routeFiles, `/${lessonRouteFile(topic, slug)}`);
}
