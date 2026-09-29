import { en as sortCopy } from './bubble-insertion-sort/copy.en.js';
import { en as binaryCopy } from './binary-search/copy.en.js';
import { en as bfsCopy } from './bfs-grid/copy.en.js';

/**
 * @typedef {{slug: string, topic: string, level: string, title: string,
 *            intro: string, [k: string]: any}} LessonCopy
 */

// Order: by topic (sorting → searching → graphs), then by difficulty.
/** @type {LessonCopy[]} */
export const lessons = [sortCopy, binaryCopy, bfsCopy];

/** @param {string} topic */
export function lessonsByTopic(topic) {
  return lessons.filter((l) => l.topic === topic);
}

/** @param {LessonCopy} lesson */
export function lessonPath(lesson) {
  return `/${lesson.topic}/${lesson.slug}/`;
}

/**
 * Topic hub path with the trailing slash the prerendered directory needs;
 * `resolve('/[topic]', …)` would drop it.
 * @param {string} topic
 */
export function topicPath(topic) {
  return `/${topic}/`;
}
