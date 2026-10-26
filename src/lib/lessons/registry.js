import { findLesson, lessonOrder } from '$lib/curriculum/index.js';

/**
 * Fields every lesson copy module provides to the shared layout and hubs.
 * @typedef {object} LessonCopy
 * @property {string} slug
 * @property {string} topic  The curriculum chapter slug the lesson sits in.
 * @property {string} level  Difficulty within the topic: Beginner, Intermediate, or Advanced.
 * @property {string} title
 * @property {string} intro
 * @property {string} [summary]  One sentence for the meta description; falls back to `intro`.
 * @property {string} instruction
 * @property {string[]} takeaways
 * @property {string[]} [complexityHead]  Column headers when the default Case/Cost/Why does not fit.
 * @property {string[][]} complexity  Rows of [case, cost, why].
 * @property {string} nextTeaser
 * @property {import('$lib/components/answer-check.js').Exercise[]} [practice]  Answer-checked
 *   questions for the page's practice block; required for practice and review lessons.
 */

// A lesson registers itself by adding `<slug>/copy.en.js`; the curriculum decides its place.
const modules = /** @type {Record<string, {en: LessonCopy}>} */ (
  import.meta.glob('./*/copy.en.js', { eager: true })
);

/**
 * Every written lesson, in curriculum order: level, then chapter, then lesson.
 * @type {LessonCopy[]}
 */
export const lessons = Object.values(modules)
  .map(({ en }) => {
    const entry = findLesson(en.slug);
    if (!entry) throw new Error(`Lesson ${en.slug} is not in the curriculum`);
    if (entry.chapter.slug !== en.topic) {
      throw new Error(`Lesson ${en.slug} belongs to topic ${entry.chapter.slug}, not ${en.topic}`);
    }
    return en;
  })
  .sort((a, b) => lessonOrder.indexOf(a.slug) - lessonOrder.indexOf(b.slug));

/** @param {string} topic */
export function lessonsByTopic(topic) {
  return lessons.filter((l) => l.topic === topic);
}

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
