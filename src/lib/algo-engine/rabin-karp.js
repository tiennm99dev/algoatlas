/**
 * Rabin-Karp substring search with a polynomial rolling hash. Letters count as a = 1 … z = 26,
 * so a leading a still changes the hash. A window of m letters hashes to
 * h = (s[0]·b^(m−1) + s[1]·b^(m−2) + … + s[m−1]) mod q, and sliding one place takes one
 * subtraction, one multiplication and one addition. Equal hashes only suggest a match, so the
 * letters are compared to confirm it; a window that fails the check is a spurious hit.
 */

export const MAX_TEXT = 20;
export const MAX_PATTERN = 8;
export const MAX_BASE = 256;
// The largest six-digit prime: a hash stays six digits wide, so it fits in a table cell.
export const MAX_MOD = 999983;

export const rabinKarpPseudocode = [
  'high = b^(m − 1) mod q',
  'hp = hash(P), ht = hash(T[0..m))',
  'for s = 0 to n − m:',
  '  if ht == hp:',
  '    compare T[s..s + m) with P letter by letter',
  '    all equal: report a match; otherwise: a spurious hit',
  '  if s < n − m:',
  '    ht = (b · (ht − T[s] · high) + T[s + m]) mod q',
];

/**
 * @typedef {object} RabinKarpRoll
 * @property {string} out  The letter leaving the window.
 * @property {string} in  The letter entering the window.
 * @property {number} before  The hash before the slide.
 * @property {number} after  The hash after the slide.
 */

/**
 * @typedef {object} RabinKarpFrame
 * @property {'start'|'high'|'hash-letter'|'too-long'|'check'|'verify'|'match'|'spurious'|'roll'|'done'} kind
 * @property {string} text
 * @property {string} pattern
 * @property {number} base
 * @property {number} mod
 * @property {number} high  b^(m − 1) mod q, 0 until computed.
 * @property {number} shift  The start of the window, -1 before the search reaches one.
 * @property {number} at  hash-letter and verify: the pattern index read now, -1 otherwise.
 * @property {boolean} equal  check: the hashes are equal; verify: the letters are equal.
 * @property {number|null} patternHash  null until any letter is hashed.
 * @property {number|null} windowHash
 * @property {(number|null)[]} hashes  The hash of each window by its start, null until reached.
 * @property {RabinKarpRoll|null} roll
 * @property {number[]} matches  Window starts confirmed as matches.
 * @property {number[]} spurious  Window starts whose hash matched but whose letters did not.
 * @property {number} hashChecks  Hash comparisons.
 * @property {number} letterReads  Letter comparisons in the confirming step.
 * @property {number} hashWork  Letters fed through the hash: m + m to set up, two per slide.
 * @property {number[]} lines
 */

/** @param {string} c */
export const letterValue = (c) => c.charCodeAt(0) - 96;

/**
 * The polynomial hash of a whole string, computed from scratch.
 * @param {string} s
 * @param {number} base
 * @param {number} mod
 */
export function polyHash(s, base, mod) {
  let h = 0;
  for (const c of s) h = (h * base + letterValue(c)) % mod;
  return h;
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

/**
 * The chance model of a spurious hit: each of the n − m + 1 windows hits a given hash value
 * about once in q tries when hashes spread evenly.
 * @param {number} n
 * @param {number} m
 * @param {number} mod
 */
export const expectedSpurious = (n, m, mod) => Math.max(0, n - m + 1) / mod;

/**
 * @param {string} text
 * @param {string} pattern
 * @param {number} base
 * @param {number} mod
 * @returns {RabinKarpFrame[]}
 */
export function rabinKarpTrace(text, pattern, base, mod) {
  const n = text.length;
  const m = pattern.length;
  /** @type {RabinKarpFrame[]} */
  const frames = [];
  /** @type {(number|null)[]} */
  const hashes = Array.from({ length: Math.max(0, n - m + 1) }, () => null);
  /** @type {number[]} */
  const matches = [];
  /** @type {number[]} */
  const spurious = [];
  let high = 0;
  let shift = -1;
  /** @type {number|null} */
  let patternHash = null;
  /** @type {number|null} */
  let windowHash = null;
  let hashChecks = 0;
  let letterReads = 0;
  let hashWork = 0;

  /**
   * @param {RabinKarpFrame['kind']} kind
   * @param {number[]} lines
   * @param {{at?: number, equal?: boolean, roll?: RabinKarpRoll|null}} [extra]
   */
  const push = (kind, lines, extra = {}) =>
    frames.push({
      kind,
      text,
      pattern,
      base,
      mod,
      high,
      shift,
      at: extra.at ?? -1,
      equal: extra.equal ?? false,
      patternHash,
      windowHash,
      hashes: hashes.slice(),
      roll: extra.roll ? { ...extra.roll } : null,
      matches: matches.slice(),
      spurious: spurious.slice(),
      hashChecks,
      letterReads,
      hashWork,
      lines,
    });

  push('start', []);

  high = 1 % mod;
  for (let k = 1; k < m; k++) high = (high * base) % mod;
  push('high', [0]);

  const fits = m <= n;
  for (let j = 0; j < m; j++) {
    patternHash = ((((patternHash ?? 0) * base) % mod) + letterValue(pattern[j])) % mod;
    hashWork++;
    if (fits) {
      windowHash = ((((windowHash ?? 0) * base) % mod) + letterValue(text[j])) % mod;
      hashWork++;
    }
    push('hash-letter', [1], { at: j });
  }

  if (!fits) {
    push('too-long', [2]);
    push('done', []);
    return frames;
  }

  for (let s = 0; s <= n - m; s++) {
    shift = s;
    const ht = /** @type {number} */ (windowHash);
    hashes[s] = ht;
    hashChecks++;
    const equal = ht === patternHash;
    push('check', [2, 3], { equal });
    if (equal) {
      let same = true;
      for (let j = 0; j < m && same; j++) {
        letterReads++;
        same = text[s + j] === pattern[j];
        push('verify', [4], { at: j, equal: same });
      }
      if (same) matches.push(s);
      else spurious.push(s);
      push(same ? 'match' : 'spurious', [5]);
    }
    if (s < n - m) {
      const out = letterValue(text[s]);
      const incoming = letterValue(text[s + m]);
      const kept = (ht - ((out * high) % mod) + mod) % mod;
      windowHash = (((kept * base) % mod) + incoming) % mod;
      hashWork += 2;
      push('roll', [6, 7], {
        roll: { out: text[s], in: text[s + m], before: ht, after: windowHash },
      });
    }
  }

  push('done', []);
  return frames;
}

/** @typedef {{text: string, pattern: string, base: number, mod: number}} RabinKarpInput */

/**
 * The examples are chosen for what they show. `plain` has one spurious hit by chance. `collide`
 * uses a base that is a multiple of the modulus, so only the last letter of a window survives.
 * @type {Record<'plain'|'collide'|'repeats'|'large', RabinKarpInput>}
 */
export const RABIN_KARP_PRESETS = {
  plain: { text: 'abracadabra', pattern: 'abra', base: 31, mod: 101 },
  collide: { text: 'abcbabaacab', pattern: 'aba', base: 10, mod: 5 },
  repeats: { text: 'aaaaaaaaaa', pattern: 'aaa', base: 31, mod: 101 },
  large: { text: 'thequickbrownfoxthe', pattern: 'the', base: 31, mod: 999983 },
};
