import { error } from '@sveltejs/kit';
import { chapters, findLesson, lessonOrder } from '$lib/curriculum/index.js';
import { findRedirect, legacyRedirects } from '$lib/curriculum/legacy-redirects.js';
import { lessonPath } from '$lib/lessons/registry.js';
import { hasStaticRoute } from '$lib/lessons/static-routes.js';

/**
 * Every unwritten curriculum lesson, plus the old paths of moved lessons. Written lessons are
 * skipped: their static route wins, and SvelteKit rejects an entry another route answers.
 * @type {import('./$types').EntryGenerator}
 */
export function entries() {
  const stubs = chapters.flatMap((c) =>
    c.lessons
      .filter((l) => !hasStaticRoute(c.slug, l.slug))
      .map((l) => ({ topic: c.slug, slug: l.slug })),
  );
  const moved = legacyRedirects.map(({ topic, slug }) => ({ topic, slug }));
  return [...stubs, ...moved];
}

/** @param {string | undefined} slug */
function neighbor(slug) {
  const entry = slug === undefined ? undefined : findLesson(slug);
  return (
    entry && {
      title: entry.lesson.title,
      path: lessonPath({ topic: entry.chapter.slug, slug: entry.lesson.slug }),
    }
  );
}

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
  const redirect = findRedirect(params.topic, params.slug);
  if (redirect) return { redirect: redirect.to };

  const entry = findLesson(params.slug);
  if (!entry || entry.chapter.slug !== params.topic || hasStaticRoute(params.topic, params.slug)) {
    error(404, 'Unknown lesson');
  }
  // Stubs link to their neighbors in book order, written or not, so every page is reachable.
  const at = lessonOrder.indexOf(entry.lesson.slug);
  return {
    stub: {
      topic: entry.chapter.slug,
      lesson: entry.lesson,
      prev: neighbor(lessonOrder[at - 1]),
      next: neighbor(lessonOrder[at + 1]),
    },
  };
}
