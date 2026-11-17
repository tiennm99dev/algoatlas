import { lessonCard, lessons } from '$lib/lessons/registry.js';

/** @type {import('./$types').PageServerLoad} */
export function load() {
  return { lessons: lessons.map(lessonCard) };
}
