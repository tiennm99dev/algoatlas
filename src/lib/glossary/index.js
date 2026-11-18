/**
 * The "Thuật ngữ" glossary: one data file per group of topics, each `{ topics, entries }`. A
 * term lives in the file whose `topics` hold the lesson that teaches it first, in curriculum
 * order; `glossary.test.js` checks the shape, links and sizes.
 *
 * @typedef {object} GlossaryEntry
 * @property {string} id  Kebab ASCII, unique across the site; also the anchor on `/thuat-ngu/`.
 * @property {string} term  As the lessons write it: English for the terms kept in English.
 * @property {string} [vi]  The Vietnamese meaning, when `term` is English.
 * @property {string} [en]  The English name, when `term` is Vietnamese.
 * @property {string} def  One or two plain sentences, at most 240 characters.
 * @property {string} lesson  `<topic slug>/<lesson slug>` of the lesson that defines it.
 * @property {string[]} [see]  Ids of related entries.
 * @property {string[]} [aka]  Other names and abbreviations, searchable.
 *
 * @typedef {object} GlossaryGroup
 * @property {string[]} topics
 * @property {GlossaryEntry[]} entries
 */

/** Every data file, by path. */
export const groups = /** @type {Record<string, GlossaryGroup>} */ (
  import.meta.glob(['./*.js', '!./index.js', '!./*.test.js'], { eager: true, import: 'default' })
);

const collator = new Intl.Collator('vi');

/**
 * Lower case without tone marks or other diacritics, đ as d, so "ngan xep" finds "ngăn xếp".
 * @param {string} s
 */
export function fold(s) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

/**
 * The letter an entry is listed under on the page: its folded first letter in capitals (Đ under
 * D, Ư under U), or "0–9" for a term that starts with a digit.
 * @param {string} term
 */
export function letterOf(term) {
  const first = fold(term).charAt(0);
  return /\d/.test(first) ? '0–9' : first.toUpperCase();
}

/**
 * Every entry, sorted the Vietnamese way by term.
 * @returns {GlossaryEntry[]}
 */
export function allTerms() {
  return Object.values(groups)
    .flatMap((g) => g.entries)
    .sort((a, b) => collator.compare(a.term, b.term));
}

/**
 * The entries a lesson teaches, for its "Thuật ngữ trong bài" block.
 * @param {string} topic
 * @param {string} slug
 */
export function termsForLesson(topic, slug) {
  return allTerms().filter((e) => e.lesson === `${topic}/${slug}`);
}
