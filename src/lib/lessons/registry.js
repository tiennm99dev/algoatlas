import { findLesson, lessonOrder } from '$lib/curriculum/index.js';

// Path helpers live apart so pages can link lessons without bundling every lesson's copy.
export { lessonNeighbors, lessonPath, topicPath } from './paths.js';

/**
 * Fields every lesson copy module provides to the shared layout and hubs.
 * @typedef {object} LessonCopy
 * @property {string} slug
 * @property {string} topic  The curriculum chapter slug the lesson sits in.
 * @property {string} level  Difficulty within the topic, one of `lessonLevels` in `site.vi.js`.
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

// A lesson registers itself by adding `<slug>/copy.vi.js`; the curriculum decides its place.
// Lessons still on the old `copy.en.js` name are read too, until every copy is renamed.
const modules = /** @type {Record<string, {vi?: LessonCopy, en?: LessonCopy}>} */ (
  import.meta.glob(['./*/copy.vi.js', './*/copy.en.js'], { eager: true })
);

/**
 * Every written lesson, in curriculum order: level, then chapter, then lesson.
 * @type {LessonCopy[]}
 */
export const lessons = Object.values(modules)
  .map((mod) => {
    const copy = /** @type {LessonCopy} */ (mod.vi ?? mod.en);
    const entry = findLesson(copy.slug);
    if (!entry) throw new Error(`Lesson ${copy.slug} is not in the curriculum`);
    if (entry.chapter.slug !== copy.topic) {
      throw new Error(
        `Lesson ${copy.slug} belongs to topic ${entry.chapter.slug}, not ${copy.topic}`,
      );
    }
    return copy;
  })
  .sort((a, b) => lessonOrder.indexOf(a.slug) - lessonOrder.indexOf(b.slug));

/** @param {string} topic */
export function lessonsByTopic(topic) {
  return lessons.filter((l) => l.topic === topic);
}

/**
 * The fields a hub card shows, so prerendered hubs ship a short list instead of every lesson's copy.
 * @param {LessonCopy} l
 */
export function lessonCard(l) {
  return { topic: l.topic, slug: l.slug, title: l.title, level: l.level, intro: l.intro };
}
