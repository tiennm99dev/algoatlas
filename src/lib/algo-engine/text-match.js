/**
 * String helpers shared by the string algorithm lessons:
 *
 * - `parseLetters`: reads a lowercase word typed into a text field.
 * - `naiveComparisons`: the letter comparisons of the plain matcher, the baseline every faster
 *   matcher is measured against.
 */

/**
 * Reads a lowercase word from a text field: trims, lowers the case, and refuses anything else.
 * @param {string} text
 * @param {number} max
 * @returns {{word: string} | {error: 'empty'|'format'|'length'}}
 */
export function parseLetters(text, max) {
  const word = text.trim().toLowerCase();
  if (word === '') return { error: 'empty' };
  if (!/^[a-z]+$/.test(word)) return { error: 'format' };
  if (word.length > max) return { error: 'length' };
  return { word };
}

/**
 * Letter comparisons of the plain matcher: at each start, left to right until a mismatch.
 * @param {string} text
 * @param {string} pattern
 * @returns {number}
 */
export function naiveComparisons(text, pattern) {
  let total = 0;
  for (let s = 0; s + pattern.length <= text.length; s++) {
    for (let j = 0; j < pattern.length; j++) {
      total++;
      if (text[s + j] !== pattern[j]) break;
    }
  }
  return total;
}
