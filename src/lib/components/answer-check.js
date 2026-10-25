/**
 * Pure answer checking for practice exercises. DOM-free so it runs in Node tests and in the
 * browser alike. Exercises are plain data, so a lesson's questions stay serialisable.
 *
 * Responses by exercise type:
 * - `number`, `text`: the raw string the learner typed (a number is accepted for `number`).
 * - `choice`: the picked option index.
 * - `multi`: the picked option indices.
 * - `order`: item indices in the order the learner arranged them.
 */

/**
 * @typedef {object} ExerciseBase
 * @property {string} prompt
 * @property {string[]} hints  Revealed one at a time.
 * @property {string} solution  Shown on request, after the first check.
 */

/** @typedef {ExerciseBase & { type: 'number', answer: number, tolerance?: number, unit?: string }} NumberExercise */
/** @typedef {ExerciseBase & { type: 'choice', options: string[], answer: number }} ChoiceExercise */
/** @typedef {ExerciseBase & { type: 'multi', options: string[], answers: number[] }} MultiExercise */
/** @typedef {ExerciseBase & { type: 'text', accept: string[] }} TextExercise */
/**
 * `items` is the order the learner first sees; `answer` lists item indices in the right order.
 * @typedef {ExerciseBase & { type: 'order', items: string[], answer: number[] }} OrderExercise
 */

/** @typedef {NumberExercise | ChoiceExercise | MultiExercise | TextExercise | OrderExercise} Exercise */

/** @typedef {Exercise['type']} ExerciseType */

/**
 * - `correct`: the answer is right.
 * - `empty`: nothing was answered yet.
 * - `incomplete`: some of a multi-part answer is missing.
 * - `invalid`: the input could not be read as the expected form.
 * - `unit`: the value is right but a different unit was written.
 * - `wrong`: a readable, complete answer that is not right.
 * @typedef {'correct' | 'empty' | 'incomplete' | 'invalid' | 'unit' | 'wrong'} CheckReason
 */

/** @typedef {{ correct: boolean, reason: CheckReason }} CheckResult */

export const EXERCISE_TYPES = /** @type {const} */ (['number', 'choice', 'multi', 'text', 'order']);

const MINUS_RE = /[−–—]/g;
// JS `\s` already covers no-break and thin spaces.
const SPACE_RE = /\s+/g;
const SUPERSCRIPTS = /** @type {Record<string, string>} */ ({ '²': '2', '³': '3', '¹': '1' });

/**
 * Normalises a unit for comparison: case, spaces, `^` and superscript digits are ignored, so
 * `ms`, `MS` and ` ms ` match, as do `n²` and `n^2`.
 * @param {string} unit
 */
export function normalizeUnit(unit) {
  return unit
    .toLowerCase()
    .replace(SPACE_RE, '')
    .replace(/\^/g, '')
    .replace(/[²³¹]/g, (c) => SUPERSCRIPTS[c]);
}

/**
 * Reads the digits part of a number written the English way: `.` is the decimal mark, and
 * commas or spaces group thousands in threes (`1,000,000`, `1 000 000`, `12,345.75`).
 * `3,5` is not a number here, because a comma never marks decimals.
 * @param {string} digits
 * @returns {number | null}
 */
function readDigits(digits) {
  const s = digits.replace(SPACE_RE, ' ');
  const at = s.indexOf('.');
  if (at !== s.lastIndexOf('.')) return null;
  const intPart = at < 0 ? s : s.slice(0, at) || '0';
  const frac = at < 0 ? '' : s.slice(at + 1);
  if (frac !== '' && !/^\d+$/.test(frac)) return null;
  if (at >= 0 && frac === '') return null;
  const grouped = /[ ,]/.test(intPart);
  if (grouped && !/^\d{1,3}(?:([ ,])\d{3})(?:\1\d{3})*$/.test(intPart)) return null;
  const whole = intPart.replace(/[ ,]/g, '');
  if (!/^\d+$/.test(whole)) return null;
  return Number(frac ? `${whole}.${frac}` : whole);
}

/**
 * Parses a typed number with an optional trailing unit.
 * @param {string} input
 * @returns {{ value: number, unit: string } | null}
 */
export function parseNumber(input) {
  const s = input.trim().replace(MINUS_RE, '-');
  const m = /^([+-]?)\s*((?:\d|\.(?=\d))[\d.,\s]*?)\s*([^\d\s.,].*)?$/u.exec(s);
  if (!m) return null;
  const [, sign, digits, unit = ''] = m;
  if (!/\d$/.test(digits)) return null;
  const value = readDigits(digits);
  if (value === null) return null;
  return { value: sign === '-' ? -value : value, unit: unit.trim() };
}

/**
 * Folds case, diacritics, surrounding spaces, inner runs of spaces, spaces next to brackets
 * and operators, superscript powers and trailing sentence punctuation, so `O( N² ).` equals
 * `o(n^2)` and `Binary  Search` equals `binary search`.
 * @param {string} s
 */
export function normalizeText(s) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[²³]/g, (c) => `^${SUPERSCRIPTS[c]}`)
    .replace(MINUS_RE, '-')
    .replace(SPACE_RE, ' ')
    .trim()
    .replace(/\s*([()[\]{},^*/+=<>-])\s*/g, '$1')
    .replace(/\s*[.!?;]+$/, '');
}

/** @param {unknown} v */
function isBlank(v) {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

/**
 * @param {CheckReason} reason
 * @returns {CheckResult}
 */
function result(reason) {
  return { correct: reason === 'correct', reason };
}

/** @param {unknown} v @returns {number[] | null} */
function indexList(v) {
  return Array.isArray(v) && v.every((x) => Number.isInteger(x))
    ? /** @type {number[]} */ (v)
    : null;
}

/**
 * Checks a learner's response against an exercise.
 * @param {Exercise} exercise
 * @param {unknown} response
 * @returns {CheckResult}
 */
export function checkAnswer(exercise, response) {
  switch (exercise.type) {
    case 'number': {
      if (isBlank(response)) return result('empty');
      if (typeof response !== 'string' && typeof response !== 'number') return result('invalid');
      const parsed =
        typeof response === 'number' ? { value: response, unit: '' } : parseNumber(response);
      if (!parsed || !Number.isFinite(parsed.value)) return result('invalid');
      const tol = exercise.tolerance ?? 1e-9 * Math.max(1, Math.abs(exercise.answer));
      const close = Math.abs(parsed.value - exercise.answer) <= tol;
      if (parsed.unit !== '') {
        if (!exercise.unit) return result('invalid');
        if (normalizeUnit(parsed.unit) !== normalizeUnit(exercise.unit)) {
          return result(close ? 'unit' : 'wrong');
        }
      }
      return result(close ? 'correct' : 'wrong');
    }
    case 'choice': {
      if (response === undefined || response === null) return result('empty');
      if (!Number.isInteger(response)) return result('invalid');
      return result(response === exercise.answer ? 'correct' : 'wrong');
    }
    case 'multi': {
      const picked = indexList(response);
      if (!picked) return result(isBlank(response) ? 'empty' : 'invalid');
      if (picked.length === 0) return result('empty');
      const want = new Set(exercise.answers);
      const got = new Set(picked);
      const same = got.size === want.size && [...got].every((i) => want.has(i));
      return result(same ? 'correct' : 'wrong');
    }
    case 'text': {
      if (isBlank(response)) return result('empty');
      if (typeof response !== 'string') return result('invalid');
      const given = normalizeText(response);
      return result(exercise.accept.some((a) => normalizeText(a) === given) ? 'correct' : 'wrong');
    }
    case 'order': {
      const got = indexList(response);
      if (!got) return result(isBlank(response) ? 'empty' : 'invalid');
      if (got.length !== exercise.answer.length) return result('incomplete');
      return result(got.every((v, i) => v === exercise.answer[i]) ? 'correct' : 'wrong');
    }
  }
}

/** @param {unknown} v @param {number} n */
const isIndex = (v, n) =>
  Number.isInteger(v) && /** @type {number} */ (v) >= 0 && /** @type {number} */ (v) < n;

/**
 * Authoring mistakes in an exercise, as readable messages; empty when it is well formed.
 * Lesson tests call this over every question so a broken quiz fails `npm test`.
 * @param {Exercise} ex
 * @returns {string[]}
 */
export function exerciseProblems(ex) {
  /** @type {string[]} */
  const out = [];
  if (!EXERCISE_TYPES.includes(ex.type)) return [`unknown type ${String(ex.type)}`];
  if (!ex.prompt?.trim()) out.push('prompt is empty');
  if (!Array.isArray(ex.hints) || ex.hints.length === 0) out.push('needs at least one hint');
  else if (ex.hints.some((h) => !h.trim())) out.push('a hint is empty');
  if (!ex.solution?.trim()) out.push('solution is empty');
  switch (ex.type) {
    case 'number':
      if (!Number.isFinite(ex.answer)) out.push('answer is not a finite number');
      if (ex.tolerance !== undefined && !(ex.tolerance >= 0)) out.push('tolerance is negative');
      break;
    case 'choice':
      if (ex.options.length < 2) out.push('needs at least two options');
      if (!isIndex(ex.answer, ex.options.length)) out.push('answer is not an option index');
      break;
    case 'multi':
      if (ex.options.length < 2) out.push('needs at least two options');
      if (ex.answers.length === 0) out.push('answers is empty');
      if (!ex.answers.every((a) => isIndex(a, ex.options.length))) {
        out.push('answers holds an index that is not an option');
      }
      if (new Set(ex.answers).size !== ex.answers.length) out.push('answers repeats an index');
      break;
    case 'text':
      if (ex.accept.length === 0 || ex.accept.some((a) => !normalizeText(a))) {
        out.push('accept needs at least one non-empty answer');
      }
      break;
    case 'order': {
      const n = ex.items.length;
      const perm =
        ex.answer.length === n &&
        new Set(ex.answer).size === n &&
        ex.answer.every((a) => isIndex(a, n));
      if (n < 2) out.push('needs at least two items');
      if (!perm) out.push('answer is not a permutation of the item indices');
      else if (ex.answer.every((a, i) => a === i))
        out.push('items already start in the answer order');
      break;
    }
  }
  return out;
}
