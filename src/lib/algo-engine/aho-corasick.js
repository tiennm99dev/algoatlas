/**
 * Aho-Corasick: a trie of all the patterns plus two extra links per node. The failure link of a
 * node points at the deepest other node whose prefix is a suffix of this node's prefix, and the
 * output link at the nearest node on that failure chain that ends a pattern. Links are set
 * breadth first, since a failure link always points to a shallower node. The scan reads each
 * letter once, falling back along failure links until an edge fits.
 */

export const MAX_PATTERNS = 6;
export const MAX_PATTERN_LEN = 6;
export const MAX_TEXT = 24;
export const ROOT = 0;

export const ahoPseudocode = [
  'for each pattern: insert it into the trie, mark its last node',
  'fail[children of root] = root; queue = those children',
  'while queue is not empty:',
  '  u = queue.pop()',
  '  for each child v of u on letter c:',
  '    f = fail[u]; while f ≠ root and f has no c edge: f = fail[f]',
  '    fail[v] = f has a c edge ? goto(f, c) : root',
  '    out[v] = fail[v] ends a pattern ? fail[v] : out[fail[v]]',
  '    queue.push(v)',
  'state = root',
  'for each letter c of the text:',
  '  while state ≠ root and state has no c edge: state = fail[state]',
  '  if state has a c edge: state = goto(state, c)',
  '  for w = state, out[w], out[out[w]], …: report the pattern ending at w',
];

/**
 * @typedef {object} AcNode
 * @property {number} id
 * @property {string} letter  The letter on the edge from the parent, empty at the root.
 * @property {number} parent  -1 at the root.
 * @property {Record<string, number>} next
 * @property {string | null} word  The pattern ending here.
 * @property {number | null} fail  null until set.
 * @property {number | null} out  The next pattern on the failure chain, null when there is none.
 */

/**
 * @typedef {object} AcMatch
 * @property {string} word
 * @property {number} start
 *
 * @typedef {object} AcFrame
 * @property {'start'|'insert'|'mark'|'seed'|'visit'|'child'|'hop'|'link'|'scan'|'read'|'fallback'|'advance'|'stay'|'report'|'done'} kind
 * @property {AcNode[]} nodes
 * @property {string} text
 * @property {string} word  insert, mark: the pattern being inserted.
 * @property {number[]} queue
 * @property {number} u  visit, child, hop, link: the node whose children get links; -1 otherwise.
 * @property {number} v  child, hop, link: the child; insert, mark: the node reached; report: the
 *   node w that ends the pattern; fallback: the state just left; -1 otherwise.
 * @property {number} f  child, hop, link: the node on the failure chain; -1 otherwise.
 * @property {string} letter  The letter in play, empty when none.
 * @property {number} state  The active state of the scan, -1 before it starts.
 * @property {number} i  Index of the text letter being read, -1 when none.
 * @property {boolean} viaOut  report: reached over an output link.
 * @property {AcMatch[]} matches
 * @property {number} edges  Trie edges followed by the scan.
 * @property {number} hops  Failure links followed by the scan.
 * @property {number} buildHops  Failure links followed while building.
 * @property {number[]} lines
 */

/**
 * Reads patterns separated by commas or spaces.
 * @param {string} text
 * @returns {{words: string[]} | {error: 'empty'|'format'|'count'|'length'|'duplicate'}}
 */
export function parsePatterns(text) {
  const words = text
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (words.length === 0) return { error: 'empty' };
  if (words.some((w) => !/^[a-z]+$/.test(w))) return { error: 'format' };
  if (words.length > MAX_PATTERNS) return { error: 'count' };
  if (words.some((w) => w.length > MAX_PATTERN_LEN)) return { error: 'length' };
  if (new Set(words).size < words.length) return { error: 'duplicate' };
  return { words };
}

/**
 * The prefix a node stands for.
 * @param {AcNode[]} nodes
 * @param {number} id
 * @returns {string}
 */
export function prefixOf(nodes, id) {
  let out = '';
  for (let at = id; at > ROOT; at = nodes[at].parent) out = nodes[at].letter + out;
  return out;
}

/**
 * Letter comparisons of running a plain search for every pattern over the text.
 * @param {string[]} words
 * @param {string} text
 * @returns {number}
 */
export function naiveComparisons(words, text) {
  let total = 0;
  for (const w of words) {
    for (let s = 0; s + w.length <= text.length; s++) {
      for (let k = 0; k < w.length; k++) {
        total++;
        if (text[s + k] !== w[k]) break;
      }
    }
  }
  return total;
}

/**
 * @param {string[]} words
 * @param {string} text
 * @returns {AcFrame[]}
 */
export function ahoTrace(words, text) {
  /** @type {AcNode[]} */
  const nodes = [{ id: ROOT, letter: '', parent: -1, next: {}, word: null, fail: null, out: null }];
  /** @type {number[]} */
  let queue = [];
  /** @type {AcMatch[]} */
  const matches = [];
  /** @type {AcFrame[]} */
  const frames = [];
  let state = -1;
  let edges = 0;
  let hops = 0;
  let buildHops = 0;

  /**
   * @param {AcFrame['kind']} kind
   * @param {number[]} lines
   * @param {{word?: string, u?: number, v?: number, f?: number, letter?: string, i?: number, viaOut?: boolean}} [extra]
   */
  const push = (kind, lines, extra = {}) =>
    frames.push({
      kind,
      nodes: nodes.map((n) => ({ ...n, next: { ...n.next } })),
      text,
      word: extra.word ?? '',
      queue: queue.slice(),
      u: extra.u ?? -1,
      v: extra.v ?? -1,
      f: extra.f ?? -1,
      letter: extra.letter ?? '',
      state,
      i: extra.i ?? -1,
      viaOut: extra.viaOut ?? false,
      matches: matches.map((x) => ({ ...x })),
      edges,
      hops,
      buildHops,
      lines,
    });

  push('start', [0]);

  for (const word of words) {
    let at = ROOT;
    for (const letter of word) {
      if (nodes[at].next[letter] === undefined) {
        const id = nodes.length;
        nodes.push({ id, letter, parent: at, next: {}, word: null, fail: null, out: null });
        nodes[at].next[letter] = id;
      }
      at = nodes[at].next[letter];
      push('insert', [0], { word, v: at, letter });
    }
    nodes[at].word = word;
    push('mark', [0], { word, v: at });
  }

  /** @param {number} id @returns {[string, number][]} */
  const childrenOf = (id) =>
    Object.keys(nodes[id].next)
      .sort()
      .map((c) => [c, nodes[id].next[c]]);

  nodes[ROOT].fail = ROOT;
  for (const [, v] of childrenOf(ROOT)) {
    nodes[v].fail = ROOT;
    queue.push(v);
  }
  push('seed', [1]);

  while (queue.length > 0) {
    const u = /** @type {number} */ (queue[0]);
    queue = queue.slice(1);
    push('visit', [2, 3], { u });
    for (const [letter, v] of childrenOf(u)) {
      let f = /** @type {number} */ (nodes[u].fail);
      push('child', [4, 5], { u, v, f, letter });
      while (f !== ROOT && nodes[f].next[letter] === undefined) {
        f = /** @type {number} */ (nodes[f].fail);
        buildHops++;
        push('hop', [5], { u, v, f, letter });
      }
      const fail = nodes[f].next[letter] ?? ROOT;
      nodes[v].fail = fail;
      nodes[v].out = nodes[fail].word !== null ? fail : nodes[fail].out;
      queue.push(v);
      push('link', [6, 7, 8], { u, v, f, letter });
    }
  }

  state = ROOT;
  push('scan', [9]);

  for (let i = 0; i < text.length; i++) {
    const letter = text[i];
    push('read', [10], { letter, i });
    while (state !== ROOT && nodes[state].next[letter] === undefined) {
      const from = state;
      state = /** @type {number} */ (nodes[state].fail);
      hops++;
      push('fallback', [11], { letter, i, v: from });
    }
    const next = nodes[state].next[letter];
    if (next === undefined) {
      push('stay', [12], { letter, i });
      continue;
    }
    state = next;
    edges++;
    push('advance', [12], { letter, i });
    let viaOut = false;
    for (
      /** @type {number | null} */ let w = nodes[state].word !== null ? state : nodes[state].out;
      w !== null;
      w = nodes[w].out
    ) {
      const word = /** @type {string} */ (nodes[w].word);
      matches.push({ word, start: i - word.length + 1 });
      push('report', [13], { letter, i, v: w, viaOut: viaOut || w !== state });
      viaOut = true;
    }
  }

  push('done', []);
  return frames;
}

/** @type {Record<'classic'|'nested'|'chain'|'codons', {patterns: string[], text: string}>} */
export const AHO_PRESETS = {
  classic: { patterns: ['he', 'she', 'his', 'hers'], text: 'ushershishe' },
  nested: { patterns: ['a', 'aa', 'aaa'], text: 'aaaaa' },
  chain: { patterns: ['abcd', 'bc', 'c', 'bcx'], text: 'abcxabcd' },
  codons: { patterns: ['acg', 'cgt', 'gta', 'tac'], text: 'acgtacgtaacgtt' },
};
