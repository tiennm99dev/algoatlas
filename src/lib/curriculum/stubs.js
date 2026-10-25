// Pure stub accounting, shared by the stub route's tests and scripts/stub-report.js.
// It takes the curriculum levels as data so plain Node can use it without Vite's JSON import.

/**
 * @typedef {object} TopicStubs
 * @property {string} topic
 * @property {string} title
 * @property {number} planned
 * @property {string[]} stubs  Unwritten lesson slugs, in book order.
 *
 * @typedef {object} LevelStubs
 * @property {number} level
 * @property {string} title
 * @property {TopicStubs[]} topics
 */

/**
 * The route file a written lesson provides, relative to the repo root.
 * @param {string} topic
 * @param {string} slug
 */
export function lessonRouteFile(topic, slug) {
  return `src/routes/${topic}/${slug}/+page.svelte`;
}

/**
 * Counts the unwritten lessons of every topic, optionally only one topic.
 * @param {import('./index.js').Level[]} levels
 * @param {(topic: string, slug: string) => boolean} isWritten
 * @param {string} [onlyTopic]
 * @returns {LevelStubs[]}
 */
export function stubReport(levels, isWritten, onlyTopic) {
  return levels
    .map((l) => ({
      level: l.level,
      title: l.title,
      topics: l.chapters
        .filter((c) => onlyTopic === undefined || c.slug === onlyTopic)
        .map((c) => ({
          topic: c.slug,
          title: c.title,
          planned: c.lessons.length,
          stubs: c.lessons.filter((x) => !isWritten(c.slug, x.slug)).map((x) => x.slug),
        })),
    }))
    .filter((l) => l.topics.length > 0);
}
