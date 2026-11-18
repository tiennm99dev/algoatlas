import { describe, expect, it } from 'vitest';
import { oldToneMarks } from '$lib/components/tone-marks.js';
import curriculum from '$lib/curriculum/dsa.json';
import * as gridCopy from '$lib/lessons/grid-copy.vi.js';
import { allTerms } from '$lib/glossary/index.js';
import { english, glosses, names } from './glossary.js';
import * as siteCopy from './site.vi.js';

// Every lesson copy module; each one joins these checks by its name.
const lessonCopies = /** @type {Record<string, { vi: { topic: string } }>} */ (
  import.meta.glob('/src/lib/lessons/*/copy.vi.js', { eager: true })
);

/**
 * English words that never occur in Vietnamese text. Short words that are also Vietnamese or
 * pseudocode keywords (to, in, an, a, do, no, so, or, for, if, not) are left out on purpose.
 */
const STOPWORDS = [
  'the',
  'of',
  'and',
  'is',
  'are',
  'with',
  'this',
  'that',
  'each',
  'from',
  'into',
  'when',
  'which',
  'has',
  'have',
  'you',
  'your',
  'its',
  'will',
  'can',
  'click',
  'press',
  'step',
  'show',
  'next',
  'previous',
  'loading',
  'error',
  'unknown',
];
const STOPWORD_RE = new RegExp(
  `(?<![\\p{L}\\p{M}\\d_-])(${STOPWORDS.join('|')})(?![\\p{L}\\p{M}\\d_-])`,
  'u',
);
// Keys that hold identifiers or English names, not Vietnamese prose.
const CODE_KEYS = new Set([
  'slug',
  'topic',
  'strand',
  'subject',
  'kind',
  'id',
  'lesson',
  'see',
  'en',
  'aka',
]);
// Sample arguments for copy functions; a function that cannot take one set is tried with the next.
const SAMPLES = [
  [2, 5, 3, 1],
  ['A', 'B', 'C'],
  [['a', 'b'], true, true],
  [['a', 'b'], false, false],
  ['x', 2, 3],
  [3, 'x', 'y'],
  [0, 4],
  [4, 4],
];

/**
 * Every string a copy value can show, with where it came from.
 * @param {unknown} value @param {string} path @param {[string, string][]} out
 */
function collect(value, path, out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (typeof value === 'function') {
    for (const args of SAMPLES) {
      try {
        const result = value(...args);
        if (typeof result === 'string') out.push([`${path}(${args.join(', ')})`, result]);
      } catch {
        // These arguments do not fit this function; another set will.
      }
    }
  } else if (Array.isArray(value)) value.forEach((v, i) => collect(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (!CODE_KEYS.has(k)) collect(v, path ? `${path}.${k}` : k, out);
    }
  }
  return out;
}

const glossSet = new Set(glosses);
const escape = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NAME_RE = new RegExp(names.map(escape).join('|'), 'g');

/**
 * The text with its allowed English removed: glosses in parentheses, names, and code spans.
 * @param {string} text
 */
function withoutAllowedEnglish(text) {
  return text
    .replace(/`[^`]*`/g, ' ')
    .replace(/\(([^()]*)\)/g, (m, inner) =>
      inner
        .split(/[,;/]/)
        .every((/** @type {string} */ part) => glossSet.has(part.trim().toLowerCase()))
        ? ' '
        : m,
    )
    .replace(NAME_RE, ' ');
}

/**
 * Whole-word search for any of `forms`, ignoring case; Vietnamese letters and tone marks count
 * as word characters, so "băm" does not match inside a longer word.
 * @param {string[]} forms
 */
const wordsRe = (forms) =>
  new RegExp(
    `(?<![\\p{L}\\p{M}\\d_-])(${forms.map(escape).join('|')})(?![\\p{L}\\p{M}\\d_-])`,
    'iu',
  );
// The Vietnamese forms of the terms written in English, which may appear only in parentheses.
const BANNED_RE = wordsRe(english.filter((t) => t.ban !== false).flatMap((t) => t.vi));
// "bạn" addresses the reader, who is "em"; it may only mean a friend inside a problem story.
const FRIEND_RE = /người bạn|bạn bè|bạn học|kết bạn/giu;
const BAN_RE = wordsRe(['bạn']);

/** @param {string} text */
const withoutParentheses = (text) => text.replace(/\([^()]*\)/g, ' ');

/**
 * Every source the checks read: its name and its strings.
 * @type {[string, [string, string][]][]}
 */
const sources = [
  ['site.vi.js', collect(siteCopy, '')],
  ['grid-copy.vi.js', collect(gridCopy, '')],
  ['dsa.json', collect(curriculum, '')],
  ['glossary', collect(allTerms(), '')],
  ...Object.entries(lessonCopies).map(
    ([file, mod]) => /** @type {[string, [string, string][]]} */ ([file, collect(mod, '')]),
  ),
];

describe('withoutAllowedEnglish', () => {
  it('drops glosses, names and code but keeps other English', () => {
    expect(withoutAllowedEnglish('chốt (pivot) và chia để trị (divide and conquer)')).toBe(
      'chốt   và chia để trị  ',
    );
    expect(withoutAllowedEnglish('thuật toán Dijkstra')).toBe('thuật toán  ');
    expect(withoutAllowedEnglish('dòng `if a and b`')).toBe('dòng  ');
    expect(withoutAllowedEnglish('mảng (the array)')).toBe('mảng (the array)');
  });
});

describe('the English-term and voice patterns', () => {
  it('find the Vietnamese forms outside parentheses only', () => {
    expect(BANNED_RE.test(withoutParentheses('Đỉnh của ngăn xếp'))).toBe(true);
    expect(BANNED_RE.test(withoutParentheses('Đỉnh của stack (ngăn xếp)'))).toBe(false);
    expect(BANNED_RE.test('Hàm băm rải đều khoá')).toBe(true);
    expect(BANNED_RE.test('Mỗi bucket là một ngăn')).toBe(false);
  });

  it('find "bạn" as the address but not as a friend', () => {
    expect(BAN_RE.test('Câu trả lời của bạn'.replace(FRIEND_RE, ' '))).toBe(true);
    expect(BAN_RE.test('Bạn có thể mở gợi ý.'.replace(FRIEND_RE, ' '))).toBe(true);
    expect(BAN_RE.test('Hai người bạn và bạn bè'.replace(FRIEND_RE, ' '))).toBe(false);
  });
});

describe.each(sources)('Vietnamese copy in %s', (_, strings) => {
  it('is NFC', () => {
    for (const [path, s] of strings) expect(s.normalize('NFC'), path).toBe(s);
  });

  it('uses new-style tone marks', () => {
    for (const [path, s] of strings) expect(oldToneMarks(s), path).toEqual([]);
  });

  it('has no English left over', () => {
    for (const [path, s] of strings) {
      const hit = STOPWORD_RE.exec(withoutAllowedEnglish(s));
      expect(hit?.[0], `${path}: ${s}`).toBeUndefined();
    }
  });

  it('addresses the reader as "em", never "bạn"', () => {
    for (const [path, s] of strings) {
      const hit = BAN_RE.exec(s.replace(FRIEND_RE, ' '));
      expect(hit?.[0], `${path}: ${s}`).toBeUndefined();
    }
  });

  it('writes the English terms in English outside parentheses', () => {
    for (const [path, s] of strings) {
      // The glossary's own `vi` field is the Vietnamese meaning, so it is the one place they stay.
      if (path.endsWith('.vi')) continue;
      const hit = BANNED_RE.exec(withoutParentheses(s));
      expect(hit?.[0], `${path}: ${s}`).toBeUndefined();
    }
  });
});
