import { findLesson, lessonOrder } from '$lib/curriculum/index.js';

/**
 * Path of a lesson page, written or not.
 * @param {{ topic: string, slug: string }} lesson
 */
export function lessonPath(lesson) {
  return `/${lesson.topic}/${lesson.slug}/`;
}

/**
 * The lessons before and after `slug` in curriculum order, written or still a stub, as
 * `{ title, path }`; undefined at either end of the curriculum. Lesson pages and stub pages
 * both link these, so the "next lesson" link always names the lesson `nextTeaser` describes.
 * @param {string} slug
 */
export function lessonNeighbors(slug) {
  const at = lessonOrder.indexOf(slug);
  /** @param {string | undefined} s */
  const link = (s) => {
    const entry = s === undefined ? undefined : findLesson(s);
    return (
      entry && {
        title: entry.lesson.title,
        path: lessonPath({ topic: entry.chapter.slug, slug: entry.lesson.slug }),
      }
    );
  };
  return at === -1
    ? { prev: undefined, next: undefined }
    : { prev: link(lessonOrder[at - 1]), next: link(lessonOrder[at + 1]) };
}

/**
 * Topic hub path with the trailing slash the prerendered directory needs;
 * `resolve('/[topic]', …)` would drop it.
 * @param {string} topic
 */
export function topicPath(topic) {
  return `/${topic}/`;
}
