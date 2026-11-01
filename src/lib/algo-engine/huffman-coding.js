/**
 * Huffman coding: build an optimal prefix-free binary code from symbol frequencies. Every
 * symbol starts as a one-node tree in a min-priority queue keyed by weight; the two lightest
 * trees are merged under a new node again and again until one tree is left. The first one taken
 * becomes the left child (bit 0), the second the right child (bit 1), and a symbol's code is the
 * path from the root to its leaf. Ties are broken by creation order, leaves first in typed order,
 * so the run is deterministic. The encoded length Σ f · depth equals the sum of every merged
 * weight, since each merge pushes all its symbols one level deeper.
 */

export const MIN_N = 2;
export const MAX_N = 10;
export const MAX_FREQ = 999;
export const MAX_TEXT = 200;

/**
 * @typedef {object} SymbolFreq
 * @property {string} symbol  One character; a space shows as ␣.
 * @property {number} freq
 */

/**
 * @typedef {object} HuffNode
 * @property {number} id  Leaves are 0..n − 1 in typed order, merged nodes n, n + 1, … in merge order.
 * @property {number} weight
 * @property {string} symbol  '' for a merged node.
 * @property {number} left  Child ids, -1 for a leaf.
 * @property {number} right
 */

/**
 * @typedef {object} HuffFrame
 * @property {'start'|'pick'|'merge'|'code'|'done'} kind
 * @property {HuffNode[]} nodes  Every node made so far, by id.
 * @property {number[]} queue  Root ids still in the queue, lightest first (ties by id).
 * @property {number[]} picked  On 'pick' and 'merge': the two ids taken, left then right.
 * @property {number} made  On 'merge': the new node's id, -1 otherwise.
 * @property {string[]} codes  Code of each leaf by id, '' until it is read.
 * @property {number} leaf  On 'code': the leaf whose code is read, -1 otherwise.
 * @property {number[]} path  On 'code': node ids from the root down to the leaf.
 * @property {number} merges
 * @property {number} cost  Sum of the merged weights so far; at the end, Σ f · code length.
 * @property {number[]} lines
 */

export const huffmanPseudocode = [
  'huffman(symbols with frequencies):',
  '  Q = min-priority queue of one leaf per symbol',
  '  while Q holds more than one tree:',
  '    x = extractMin(Q); y = extractMin(Q)  // the two lightest',
  '    z = new node(left x, right y, weight x + y)',
  '    insert(Q, z)',
  '  for each leaf: its code is the path from the root, left 0, right 1',
  '  return the codes',
];

/** @param {string} ch */
const shown = (ch) => (/\s/.test(ch) ? '␣' : ch);

/**
 * Reads `symbol:frequency` pairs separated by commas or spaces, such as `a:45, b:13`. The
 * symbol is any one visible character, so `,:2` and `::1` (a comma, a colon) read back what
 * `countSymbols` and `formatFrequencies` write for a text with punctuation.
 * @param {string} text
 * @returns {{symbols: SymbolFreq[]} | {error: 'format'|'range'|'count'|'duplicate'}}
 */
export function parseFrequencies(text) {
  const pairs = [...text.matchAll(/(?<![^\s,;])(\S):(\d+)(?![^\s,;])/gu)];
  const rest = text.replace(/(?<![^\s,;])\S:\d+(?![^\s,;])/gu, '');
  if (pairs.length === 0 || !/^[\s,;]*$/.test(rest)) return { error: 'format' };
  const symbols = pairs.map((p) => ({ symbol: p[1], freq: Number(p[2]) }));
  if (symbols.some((s) => s.freq < 1 || s.freq > MAX_FREQ)) return { error: 'range' };
  if (new Set(symbols.map((s) => s.symbol)).size !== symbols.length) return { error: 'duplicate' };
  if (symbols.length < MIN_N || symbols.length > MAX_N) return { error: 'count' };
  return { symbols };
}

/** @param {SymbolFreq[]} symbols */
export const formatFrequencies = (symbols) =>
  symbols.map((s) => `${s.symbol}:${s.freq}`).join(', ');

/**
 * Counts the characters of a text, in order of first appearance; spaces become ␣.
 * @param {string} text
 * @returns {{symbols: SymbolFreq[]} | {error: 'empty'|'long'|'count'}}
 */
export function countSymbols(text) {
  if (text.length === 0) return { error: 'empty' };
  if (text.length > MAX_TEXT) return { error: 'long' };
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const ch of text) counts.set(shown(ch), (counts.get(shown(ch)) ?? 0) + 1);
  if (counts.size < MIN_N || counts.size > MAX_N) return { error: 'count' };
  return { symbols: [...counts].map(([symbol, freq]) => ({ symbol, freq })) };
}

/**
 * Bits a fixed-length code needs: ⌈log₂ n⌉ per symbol.
 * @param {SymbolFreq[]} symbols
 */
export function fixedBits(symbols) {
  const width = Math.ceil(Math.log2(symbols.length));
  return width * symbols.reduce((s, x) => s + x.freq, 0);
}

/**
 * @param {SymbolFreq[]} symbols  At least two, distinct.
 * @returns {HuffFrame[]}
 */
export function huffmanTrace(symbols) {
  /** @type {HuffNode[]} */
  const nodes = symbols.map((s, id) => ({
    id,
    weight: s.freq,
    symbol: s.symbol,
    left: -1,
    right: -1,
  }));
  let queue = nodes.map((n) => n.id);
  /** @type {HuffFrame[]} */
  const frames = [];
  const codes = symbols.map(() => '');
  let merges = 0;
  let cost = 0;

  /** @param {number} a @param {number} b */
  const lighter = (a, b) => nodes[a].weight - nodes[b].weight || a - b;
  const sortQueue = () => queue.sort(lighter);

  /** @param {Pick<HuffFrame, 'kind'|'lines'> & Partial<HuffFrame>} f */
  const push = (f) =>
    frames.push({
      picked: [],
      made: -1,
      leaf: -1,
      path: [],
      ...f,
      nodes: nodes.map((n) => ({ ...n })),
      queue: queue.slice(),
      codes: codes.slice(),
      merges,
      cost,
    });

  sortQueue();
  push({ kind: 'start', lines: [0, 1] });
  while (queue.length > 1) {
    const [x, y] = queue;
    push({ kind: 'pick', lines: [2, 3], picked: [x, y] });
    const z = nodes.length;
    nodes.push({
      id: z,
      weight: nodes[x].weight + nodes[y].weight,
      symbol: '',
      left: x,
      right: y,
    });
    queue = [...queue.slice(2), z];
    sortQueue();
    merges++;
    cost += nodes[z].weight;
    push({ kind: 'merge', lines: [4, 5], picked: [x, y], made: z });
  }

  const root = queue[0];
  /** @param {number} id @param {string} code @param {number[]} path */
  const walk = (id, code, path) => {
    const node = nodes[id];
    const here = [...path, id];
    if (node.left < 0) {
      codes[id] = code;
      push({ kind: 'code', lines: [6], leaf: id, path: here });
      return;
    }
    walk(node.left, `${code}0`, here);
    walk(node.right, `${code}1`, here);
  };
  walk(root, '', []);
  push({ kind: 'done', lines: [7] });
  return frames;
}
