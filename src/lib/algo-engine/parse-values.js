/**
 * Reads a list of whole numbers a learner typed, for the many engines that take one.
 */

/**
 * Whole numbers separated by commas or spaces. Failures are reported in this order: anything that
 * is not a whole number or nothing at all (`format`), then a value out of range (`range`), then
 * too few or too many values (`count`).
 * @param {string} text
 * @param {{ min?: number, max: number, minN?: number, maxN: number, signed?: boolean }} limits
 *   `signed` lets values carry a minus sign, including the typographic ones a phone inserts.
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseValueList(text, { min = 0, max, minN = 1, maxN, signed = false }) {
  const raw = signed ? text.replace(/[−–]/g, '-') : text;
  const tokens = raw.split(/[\s,]+/).filter(Boolean);
  const number = signed ? /^-?\d+$/ : /^\d+$/;
  if (tokens.length === 0 || !tokens.every((s) => number.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < min || v > max)) return { error: 'range' };
  if (values.length < minN || values.length > maxN) return { error: 'count' };
  return { values };
}
