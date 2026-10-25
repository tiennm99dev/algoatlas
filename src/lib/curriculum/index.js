import data from './dsa.json';

/**
 * @typedef {'theory' | 'practice' | 'review'} LessonKind
 *
 * @typedef {object} CurriculumLesson
 * @property {number} no
 * @property {string} title
 * @property {string} slug
 * @property {LessonKind} kind
 * @property {string[]} keyIdeas
 * @property {string} interactiveIdea
 *
 * @typedef {object} Chapter  A chapter is a topic: its slug is the topic key in every URL.
 * @property {number} no
 * @property {string} title
 * @property {string} slug
 * @property {string} strand
 * @property {string} blurb
 * @property {CurriculumLesson[]} lessons
 *
 * @typedef {object} Level
 * @property {number} level
 * @property {string} title
 * @property {Chapter[]} chapters
 *
 * @typedef {object} Topic
 * @property {string} title
 * @property {string} blurb
 * @property {number} level
 */

/** Levels in learning order, each with its chapters in book order. */
export const levels = /** @type {Level[]} */ (data.levels);

/** Every chapter in learning order. */
export const chapters = levels.flatMap((l) => l.chapters);

/** Topic keys (chapter slugs) in learning order. */
export const topicOrder = chapters.map((c) => c.slug);

/** @type {Record<string, Topic>} */
export const topics = Object.fromEntries(
  levels.flatMap((l) =>
    l.chapters.map((c) => [c.slug, { title: c.title, blurb: c.blurb, level: l.level }]),
  ),
);

/** Lesson slugs in learning order: level, then chapter, then lesson. */
export const lessonOrder = chapters.flatMap((c) => c.lessons.map((l) => l.slug));

const lessonIndex = new Map(
  chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => [lesson.slug, { lesson, chapter }]),
  ),
);

/**
 * The curriculum entry for a lesson slug and the chapter (topic) it sits in.
 * @param {string} slug
 */
export function findLesson(slug) {
  return lessonIndex.get(slug);
}
