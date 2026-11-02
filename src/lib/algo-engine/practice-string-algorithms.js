/**
 * A playground for one text. Search mode races five single-pattern matchers on the same text and
 * pattern: every tick spends one step of each matcher, so the one that finishes first spent the
 * fewest. A step is one letter compared, one letter fed into a hash, one hash compared, or one
 * pattern letter entered into a skip table. Structure mode reads the text for its borders and
 * periods with the prefix function, then for its palindromes with Manacher's algorithm. All
 * indices are 0-based; the Boyer-Moore here uses the bad-character rule only.
 */

export const MAX_TEXT = 40;
export const MAX_PATTERN = 8;
// A small modulus keeps Rabin-Karp's spurious hits within reach of a 40-letter text.
export const HASH_BASE = 31;
export const HASH_MOD = 101;

/** @typedef {'naive'|'rabin'|'kmp'|'boyer'|'z'} MatcherId */

/** @type {MatcherId[]} */
export const MATCHER_IDS = ['naive', 'rabin', 'kmp', 'boyer', 'z'];

/** @type {Record<MatcherId, string[]>} */
export const searchPseudocode = {
  naive: [
    'for s = 0 to n − m:',
    '  j = 0',
    '  while j < m and P[j] == T[s + j]: j = j + 1',
    '  if j == m: report a match at s',
  ],
  rabin: [
    'high = b^(m − 1) mod q',
    'hp = hash(P), ht = hash(T[0..m))',
    'for s = 0 to n − m:',
    '  if ht == hp:',
    '    compare T[s..s + m) with P letter by letter',
    '    all equal: report a match; otherwise: a spurious hit',
    '  if s < n − m:',
    '    ht = (b · (ht − T[s] · high) + T[s + m]) mod q',
  ],
  kmp: [
    'π[0] = 0, k = 0',
    'for i = 1 to m − 1:',
    '  while k > 0 and P[k] ≠ P[i]: k = π[k − 1]',
    '  if P[k] == P[i]: k = k + 1',
    '  π[i] = k',
    'q = 0',
    'for i = 0 to n − 1:',
    '  while q > 0 and P[q] ≠ T[i]: q = π[q − 1]',
    '  if P[q] == T[i]: q = q + 1',
    '  if q == m: report a match at i − m + 1, q = π[q − 1]',
  ],
  boyer: [
    'last[c] = rightmost index of c in P, −1 if absent',
    's = 0',
    'while s ≤ n − m:',
    '  j = m − 1',
    '  while j ≥ 0 and P[j] == T[s + j]: j = j − 1',
    '  if j < 0: report a match at s',
    '    s = s + (s + m < n ? m − last[T[s + m]] : 1)',
    '  else: s = s + max(1, j − last[T[s + j]])',
  ],
  z: [
    'S = P + $ + T, l = 0, r = 0',
    'for i = 1 to |S| − 1:',
    '  Z[i] = i < r ? min(r − i, Z[i − l]) : 0',
    '  while i + Z[i] < |S| and S[Z[i]] == S[i + Z[i]]: Z[i] = Z[i] + 1',
    '  if i + Z[i] > r: l = i, r = i + Z[i]',
    '  if Z[i] == m: report a match at i − m − 1',
  ],
};

export const structurePseudocode = [
  'π[0] = 0, k = 0',
  'for i = 1 to n − 1:',
  '  while k > 0 and S[k] ≠ S[i]: k = π[k − 1]',
  '  if S[k] == S[i]: k = k + 1',
  '  π[i] = k',
  'p = n − π[n − 1]   // the smallest period',
  'S is a block repeated when p divides n and p < n',
  'T = S with # around every letter, C = 0, R = 0',
  'for i = 0 to |T| − 1:',
  '  P[i] = i < R ? min(R − i, P[2C − i]) : 0',
  '  while T[i − P[i] − 1] == T[i + P[i] + 1]: P[i] = P[i] + 1',
  '  if i + P[i] > R: C = i, R = i + P[i]',
  'the longest palindrome has length max P[i]',
];

/**
 * @typedef {object} MatcherEvent
 * @property {'table'|'build'|'hash-letter'|'hash-check'|'verify'|'roll-out'|'roll-in'|'compare'} kind
 * @property {'prep'|'search'} phase
 * @property {number} shift  Where the pattern lines up with the text, -1 when it does not yet.
 * @property {number} patternAt  The pattern index read, -1 when none; m stands for the $ of P + $ + T.
 * @property {number} textAt  The text index read, -1 when none.
 * @property {number} selfAt  build: the second index into the pattern (or P + $), -1 otherwise.
 * @property {boolean} equal  The two sides of a comparison are equal.
 * @property {number} found  A match this step completes at this start, -1 when none.
 * @property {boolean} spurious  This step shows that a hash hit was false.
 * @property {number|null} hash  Rabin-Karp: the hash being built or of the window.
 * @property {number|null} target  Rabin-Karp: the pattern's hash, once known.
 * @property {number[]} lines
 */

/**
 * @typedef {object} RunState
 * @property {MatcherEvent['kind']|'idle'} kind  The step shown now; idle before the first.
 * @property {'prep'|'search'} phase
 * @property {number} shift
 * @property {number} patternAt
 * @property {number} textAt
 * @property {number} selfAt
 * @property {boolean} equal
 * @property {number} found
 * @property {boolean} spurious
 * @property {number|null} hash
 * @property {number|null} target
 * @property {number[]} lines
 * @property {number} steps  Steps spent so far.
 * @property {number} prep  Of those, steps before the text is searched.
 * @property {number} search  Of those, steps of the search itself.
 * @property {number[]} matches  Match starts so far.
 * @property {number} hits  Rabin-Karp: spurious hits so far.
 * @property {boolean} finished  The matcher has no steps left.
 */

/**
 * @typedef {object} SearchFrame
 * @property {'start'|'tick'|'done'} kind
 * @property {number} tick  Steps each unfinished matcher has spent.
 * @property {string} text
 * @property {string} pattern
 * @property {Record<MatcherId, RunState>} runs
 * @property {MatcherId[]} finishers  Matchers finished so far, first to finish first.
 * @property {MatcherId[]} cheapest  done: the matchers with the fewest steps; empty before.
 */

/**
 * @typedef {object} StructureFrame
 * @property {'start'|'pi'|'period'|'centre'|'done'} kind
 * @property {string} text
 * @property {string} t  The text with # around every letter.
 * @property {(number|null)[]} pi  null until computed.
 * @property {(number|null)[]} radii  P over T, null until computed.
 * @property {number} i  pi: the text index; centre: the index in T; -1 otherwise.
 * @property {number} value  pi: the border length; centre: the radius.
 * @property {number} falls  pi: fallback jumps at this index; 0 otherwise.
 * @property {number} reused  centre: letters of the radius known from the mirror.
 * @property {number} read  centre: comparisons made at this centre.
 * @property {boolean} moved  centre: this palindrome reached further right.
 * @property {number} period  The smallest period, 0 until known.
 * @property {number} repeats  How many whole blocks of that period make the text, 0 until known.
 * @property {number[]} borders  Every border length, longest first, once known.
 * @property {number[]} periods  Every period, smallest first, once known.
 * @property {number} best  The longest palindrome so far.
 * @property {number} bestCentre  Its centre in T.
 * @property {number} palindromes  Palindromic substrings counted so far.
 * @property {number} piComparisons
 * @property {number} tryPeriods  Comparisons of testing each period in turn on the same text.
 * @property {number} palComparisons  Manacher's comparisons.
 * @property {number} tryCentres  Comparisons of expanding the same centres from zero.
 * @property {number[]} lines
 */

/**
 * Reads a typed word: lower case letters only, up to `max`.
 * @param {string} raw
 * @param {number} max
 * @returns {{word: string} | {error: 'empty'|'format'|'length'}}
 */
export function parseWord(raw, max) {
  const word = raw.trim().toLowerCase();
  if (word === '') return { error: 'empty' };
  if (!/^[a-z]+$/.test(word)) return { error: 'format' };
  if (word.length > max) return { error: 'length' };
  return { word };
}

/** @param {string} c */
const letterValue = (c) => c.charCodeAt(0) - 96;

/** @param {Partial<MatcherEvent> & Pick<MatcherEvent, 'kind'|'phase'|'lines'>} e @returns {MatcherEvent} */
const event = (e) => ({
  shift: -1,
  patternAt: -1,
  textAt: -1,
  selfAt: -1,
  equal: false,
  found: -1,
  spurious: false,
  hash: null,
  target: null,
  ...e,
});

/** @param {string} T @param {string} P @returns {MatcherEvent[]} */
function naiveEvents(T, P) {
  /** @type {MatcherEvent[]} */
  const out = [];
  const m = P.length;
  for (let s = 0; s + m <= T.length; s++) {
    for (let j = 0; j < m; j++) {
      const equal = P[j] === T[s + j];
      const hit = equal && j === m - 1;
      const lines = j === 0 ? [0, 1, 2] : [2];
      out.push(
        event({
          kind: 'compare',
          phase: 'search',
          shift: s,
          patternAt: j,
          textAt: s + j,
          equal,
          found: hit ? s : -1,
          lines: hit ? [...lines, 3] : lines,
        }),
      );
      if (!equal) break;
    }
  }
  return out;
}

/** @param {string} T @param {string} P @returns {MatcherEvent[]} */
function rabinEvents(T, P) {
  /** @type {MatcherEvent[]} */
  const out = [];
  const n = T.length;
  const m = P.length;
  let high = 1;
  for (let j = 1; j < m; j++) high = (high * HASH_BASE) % HASH_MOD;
  let hp = 0;
  for (let j = 0; j < m; j++) {
    hp = (hp * HASH_BASE + letterValue(P[j])) % HASH_MOD;
    out.push(
      event({
        kind: 'hash-letter',
        phase: 'prep',
        patternAt: j,
        hash: hp,
        lines: j === 0 ? [0, 1] : [1],
      }),
    );
  }
  let ht = 0;
  for (let j = 0; j < m; j++) {
    ht = (ht * HASH_BASE + letterValue(T[j])) % HASH_MOD;
    out.push(
      event({
        kind: 'hash-letter',
        phase: 'prep',
        shift: 0,
        textAt: j,
        hash: ht,
        target: hp,
        lines: [1],
      }),
    );
  }
  for (let s = 0; s + m <= n; s++) {
    const hit = ht === hp;
    out.push(
      event({
        kind: 'hash-check',
        phase: 'search',
        shift: s,
        equal: hit,
        hash: ht,
        target: hp,
        lines: [2, 3],
      }),
    );
    if (hit) {
      for (let j = 0; j < m; j++) {
        const equal = P[j] === T[s + j];
        const whole = equal && j === m - 1;
        out.push(
          event({
            kind: 'verify',
            phase: 'search',
            shift: s,
            patternAt: j,
            textAt: s + j,
            equal,
            found: whole ? s : -1,
            spurious: !equal,
            hash: ht,
            target: hp,
            lines: whole || !equal ? [4, 5] : [4],
          }),
        );
        if (!equal) break;
      }
    }
    if (s + m < n) {
      const without =
        (((ht - ((letterValue(T[s]) * high) % HASH_MOD)) % HASH_MOD) + HASH_MOD) % HASH_MOD;
      out.push(
        event({
          kind: 'roll-out',
          phase: 'search',
          shift: s,
          textAt: s,
          hash: ht,
          target: hp,
          lines: [6, 7],
        }),
      );
      ht = (without * HASH_BASE + letterValue(T[s + m])) % HASH_MOD;
      out.push(
        event({
          kind: 'roll-in',
          phase: 'search',
          shift: s + 1,
          textAt: s + m,
          hash: ht,
          target: hp,
          lines: [7],
        }),
      );
    }
  }
  return out;
}

/** @param {string} T @param {string} P @returns {MatcherEvent[]} */
function kmpEvents(T, P) {
  /** @type {MatcherEvent[]} */
  const out = [];
  const m = P.length;
  const pi = Array.from({ length: m }, () => 0);
  let k = 0;
  for (let i = 1; i < m; i++) {
    for (;;) {
      const equal = P[k] === P[i];
      const settled = equal || k === 0;
      out.push(
        event({
          kind: 'build',
          phase: 'prep',
          patternAt: k,
          selfAt: i,
          equal,
          lines: settled ? [1, 3, 4] : [1, 2],
        }),
      );
      if (settled) {
        if (equal) k++;
        break;
      }
      k = pi[k - 1];
    }
    pi[i] = k;
  }
  let q = 0;
  for (let i = 0; i < T.length; i++) {
    for (;;) {
      const equal = P[q] === T[i];
      const settled = equal || q === 0;
      const full = equal && q + 1 === m;
      out.push(
        event({
          kind: 'compare',
          phase: 'search',
          shift: i - q,
          patternAt: q,
          textAt: i,
          equal,
          found: full ? i - m + 1 : -1,
          lines: full ? [6, 8, 9] : settled ? [6, 8] : [6, 7],
        }),
      );
      if (settled) {
        if (equal) q++;
        break;
      }
      q = pi[q - 1];
    }
    if (q === m) q = pi[q - 1];
  }
  const firstSearch = out.findIndex((e) => e.phase === 'search');
  out[0].lines = [0, ...out[0].lines];
  out[firstSearch].lines = [5, ...out[firstSearch].lines];
  return out;
}

/** @param {string} T @param {string} P @returns {MatcherEvent[]} */
function boyerEvents(T, P) {
  /** @type {MatcherEvent[]} */
  const out = [];
  const n = T.length;
  const m = P.length;
  /** @type {Record<string, number>} */
  const last = {};
  for (let j = 0; j < m; j++) {
    last[P[j]] = j;
    out.push(event({ kind: 'table', phase: 'prep', patternAt: j, lines: [0] }));
  }
  /** @param {string} c */
  const lastOf = (c) => last[c] ?? -1;
  let s = 0;
  let first = true;
  while (s <= n - m) {
    let j = m - 1;
    for (;;) {
      const equal = P[j] === T[s + j];
      const full = equal && j === 0;
      /** @type {number[]} */
      const lines = j === m - 1 ? (first ? [1, 2, 3, 4] : [2, 3, 4]) : [4];
      if (full) lines.push(5, 6);
      else if (!equal) lines.push(7);
      first = false;
      out.push(
        event({
          kind: 'compare',
          phase: 'search',
          shift: s,
          patternAt: j,
          textAt: s + j,
          equal,
          found: full ? s : -1,
          lines,
        }),
      );
      if (!equal || full) break;
      j--;
    }
    if (P[j] === T[s + j]) s += s + m < n ? m - lastOf(T[s + m]) : 1;
    else s += Math.max(1, j - lastOf(T[s + j]));
  }
  return out;
}

/** @param {string} T @param {string} P @returns {MatcherEvent[]} */
function zEvents(T, P) {
  /** @type {MatcherEvent[]} */
  const out = [];
  const m = P.length;
  const S = `${P}$${T}`;
  const z = Array.from({ length: S.length }, () => 0);
  let l = 0;
  let r = 0;
  for (let i = 1; i < S.length; i++) {
    let v = i < r ? Math.min(r - i, z[i - l]) : 0;
    let first = true;
    const before = out.length;
    const inText = i > m;
    while (i + v < S.length) {
      const equal = S[v] === S[i + v];
      out.push(
        event({
          kind: inText ? 'compare' : 'build',
          phase: inText ? 'search' : 'prep',
          shift: inText ? i - m - 1 : -1,
          patternAt: v,
          textAt: inText ? i + v - m - 1 : -1,
          selfAt: inText ? -1 : i + v,
          equal,
          lines: first ? [1, 2, 3] : [3],
        }),
      );
      first = false;
      if (!equal) break;
      v++;
    }
    z[i] = v;
    const moved = i + v > r;
    if (moved) {
      l = i;
      r = i + v;
    }
    if (out.length > before) {
      const tail = out[out.length - 1];
      if (moved) tail.lines = [...tail.lines, 4];
      if (inText && v === m) {
        tail.found = i - m - 1;
        tail.lines = [...tail.lines, 5];
      }
    }
  }
  out[0].lines = [0, ...out[0].lines];
  return out;
}

/** @type {Record<MatcherId, (text: string, pattern: string) => MatcherEvent[]>} */
const EVENTS = {
  naive: naiveEvents,
  rabin: rabinEvents,
  kmp: kmpEvents,
  boyer: boyerEvents,
  z: zEvents,
};

/**
 * The race: every matcher runs once, then each frame shows all of them one step further.
 * @param {string} text  At least as long as the pattern.
 * @param {string} pattern  Not empty.
 * @returns {SearchFrame[]}
 */
export function searchTrace(text, pattern) {
  const all = MATCHER_IDS.map((id) => EVENTS[id](text, pattern));
  const longest = Math.max(...all.map((events) => events.length));
  /** @type {SearchFrame[]} */
  const frames = [];
  /** @type {MatcherId[]} */
  const finishers = [];
  /** @type {Record<string, {prep: number, search: number, matches: number[], hits: number}>} */
  const totals = {};
  for (const id of MATCHER_IDS) totals[id] = { prep: 0, search: 0, matches: [], hits: 0 };

  /** @param {number} tick @param {SearchFrame['kind']} kind */
  const snapshot = (tick, kind) => {
    /** @type {Record<string, RunState>} */
    const runs = {};
    MATCHER_IDS.forEach((id, a) => {
      const events = all[a];
      const e = tick > 0 ? events[Math.min(tick, events.length) - 1] : null;
      if (e && tick <= events.length) {
        const sum = totals[id];
        if (e.phase === 'prep') sum.prep++;
        else sum.search++;
        if (e.found >= 0) sum.matches.push(e.found);
        if (e.spurious) sum.hits++;
      }
      const sum = totals[id];
      runs[id] = {
        kind: 'idle',
        phase: 'prep',
        shift: -1,
        patternAt: -1,
        textAt: -1,
        selfAt: -1,
        equal: false,
        found: -1,
        spurious: false,
        hash: null,
        target: null,
        ...(e ?? {}),
        lines: e ? e.lines.slice() : [],
        steps: sum.prep + sum.search,
        prep: sum.prep,
        search: sum.search,
        matches: sum.matches.slice(),
        hits: sum.hits,
        finished: tick > events.length,
      };
      if (tick === events.length + 1) finishers.push(id);
    });
    return {
      kind,
      tick,
      text,
      pattern,
      runs: /** @type {Record<MatcherId, RunState>} */ (runs),
      finishers: finishers.slice(),
      cheapest: /** @type {MatcherId[]} */ ([]),
    };
  };

  frames.push(snapshot(0, 'start'));
  for (let tick = 1; tick <= longest; tick++) frames.push(snapshot(tick, 'tick'));
  const done = snapshot(longest + 1, 'done');
  const fewest = Math.min(...MATCHER_IDS.map((id) => done.runs[id].steps));
  done.cheapest = MATCHER_IDS.filter((id) => done.runs[id].steps === fewest);
  frames.push(done);
  return frames;
}

/** @param {string} s */
const separate = (s) => `#${[...s].join('#')}#`;

/**
 * Comparisons of testing the periods 1, 2, … in turn until one holds.
 * @param {string} s
 */
export function tryPeriodComparisons(s) {
  let total = 0;
  for (let p = 1; p < s.length; p++) {
    let holds = true;
    for (let i = 0; i + p < s.length; i++) {
      total++;
      if (s[i] !== s[i + p]) {
        holds = false;
        break;
      }
    }
    if (holds) break;
  }
  return total;
}

/**
 * The palindrome of the text that a centre and radius of T stand for.
 * @param {string} s
 * @param {number} centre
 * @param {number} radius
 */
export function palindromeAt(s, centre, radius) {
  const start = (centre - radius) / 2;
  return s.slice(start, start + radius);
}

/**
 * One text read twice: the prefix function gives its borders and periods, then Manacher's
 * algorithm gives its palindromes.
 * @param {string} text  Not empty.
 * @returns {StructureFrame[]}
 */
export function structureTrace(text) {
  const n = text.length;
  const t = separate(text);
  /** @type {(number|null)[]} */
  const pi = Array.from({ length: n }, () => null);
  /** @type {(number|null)[]} */
  const radii = Array.from({ length: t.length }, () => null);
  /** @type {StructureFrame[]} */
  const frames = [];
  const tryPeriods = tryPeriodComparisons(text);
  let period = 0;
  let repeats = 0;
  /** @type {number[]} */
  let borders = [];
  /** @type {number[]} */
  let periods = [];
  let best = 0;
  let bestCentre = 0;
  let palindromes = 0;
  let piComparisons = 0;
  let palComparisons = 0;
  let tryCentres = 0;

  /**
   * @param {StructureFrame['kind']} kind
   * @param {number[]} lines
   * @param {Partial<Pick<StructureFrame, 'i'|'value'|'falls'|'reused'|'read'|'moved'>>} [extra]
   */
  const push = (kind, lines, extra = {}) =>
    frames.push({
      kind,
      text,
      t,
      pi: pi.slice(),
      radii: radii.slice(),
      i: extra.i ?? -1,
      value: extra.value ?? 0,
      falls: extra.falls ?? 0,
      reused: extra.reused ?? 0,
      read: extra.read ?? 0,
      moved: extra.moved ?? false,
      period,
      repeats,
      borders: borders.slice(),
      periods: periods.slice(),
      best,
      bestCentre,
      palindromes,
      piComparisons,
      tryPeriods,
      palComparisons,
      tryCentres,
      lines,
    });

  pi[0] = 0;
  push('start', [0]);

  let k = 0;
  for (let i = 1; i < n; i++) {
    let falls = 0;
    for (;;) {
      piComparisons++;
      const equal = text[k] === text[i];
      if (equal) {
        k++;
        break;
      }
      if (k === 0) break;
      k = /** @type {number} */ (pi[k - 1]);
      falls++;
    }
    pi[i] = k;
    push('pi', falls > 0 ? [1, 2, 3, 4] : [1, 3, 4], { i, value: k, falls });
  }

  for (let b = /** @type {number} */ (pi[n - 1]); b > 0; b = /** @type {number} */ (pi[b - 1])) {
    borders.push(b);
  }
  periods = [...borders.map((b) => n - b), n];
  period = periods[0];
  repeats = n % period === 0 ? n / period : 1;
  push('period', [5, 6]);

  let c = 0;
  let r = 0;
  for (let i = 0; i < t.length; i++) {
    const reused = i < r ? Math.min(r - i, /** @type {number} */ (radii[2 * c - i])) : 0;
    let value = reused;
    let read = 0;
    while (i - value - 1 >= 0 && i + value + 1 < t.length) {
      palComparisons++;
      read++;
      if (t[i - value - 1] !== t[i + value + 1]) break;
      value++;
    }
    for (let d = 1; i - d >= 0 && i + d < t.length; d++) {
      tryCentres++;
      if (t[i - d] !== t[i + d]) break;
    }
    radii[i] = value;
    palindromes += Math.ceil(value / 2);
    const moved = i + value > r;
    if (moved) {
      c = i;
      r = i + value;
    }
    if (value > best) {
      best = value;
      bestCentre = i;
    }
    const lines = moved ? [8, 9, 10, 11] : [8, 9, 10];
    push('centre', i === 0 ? [7, ...lines] : lines, { i, value, reused, read, moved });
  }

  push('done', [12]);
  return frames;
}

/** @type {Record<'english'|'repeats'|'tail'|'head'|'periodic'|'dna'|'palindrome', {text: string, pattern: string}>} */
export const STRING_PRESETS = {
  english: { text: 'thequickbrownfoxjumpsoverthelazydog', pattern: 'lazy' },
  repeats: { text: 'a'.repeat(MAX_TEXT), pattern: 'aaaa' },
  tail: { text: 'a'.repeat(MAX_TEXT), pattern: 'aaab' },
  head: { text: 'a'.repeat(MAX_TEXT), pattern: 'baaa' },
  periodic: { text: 'abc'.repeat(12), pattern: 'abcabc' },
  dna: { text: 'acgtacgtgacgatacgtacgtgcgtacgatacgtacgta', pattern: 'acgta' },
  palindrome: { text: 'forgeeksskeegfor', pattern: 'geek' },
};
