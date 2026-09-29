import { en as sortCopy } from './bubble-insertion-sort/copy.en.js';
import { en as mergeQuickCopy } from './merge-quick-sort/copy.en.js';
import { en as binaryCopy } from './binary-search/copy.en.js';
import { en as boundsCopy } from './lower-upper-bound/copy.en.js';
import { en as hashCopy } from './hash-table/copy.en.js';
import { en as bstCopy } from './bst/copy.en.js';
import { en as bfsCopy } from './bfs-grid/copy.en.js';
import { en as dfsCopy } from './dfs-grid/copy.en.js';
import { en as dijkstraCopy } from './dijkstra-grid/copy.en.js';

/**
 * Fields every lesson copy module provides to the shared layout and hubs.
 * @typedef {object} LessonCopy
 * @property {string} slug
 * @property {string} topic
 * @property {string} level
 * @property {string} title
 * @property {string} intro
 * @property {string} [summary]  One sentence for the meta description; falls back to `intro`.
 * @property {string} instruction
 * @property {string[]} takeaways
 * @property {string[]} [complexityHead]  Column headers when the default Case/Cost/Why does not fit.
 * @property {string[][]} complexity  Rows of [case, cost, why].
 * @property {string} nextTeaser
 */

// Order: by topic (sorting → searching → structures → graphs), then by difficulty.
/** @type {LessonCopy[]} */
export const lessons = [
  sortCopy,
  mergeQuickCopy,
  binaryCopy,
  boundsCopy,
  hashCopy,
  bstCopy,
  bfsCopy,
  dfsCopy,
  dijkstraCopy,
];

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
