/**
 * Trie (prefix tree) operation log over lowercase words: insert, exact search, and autocomplete
 * of a prefix. The whole log is replayed into one frame trace. A node stands for the prefix
 * spelt on the way down from the root, and an `isWord` flag says a stored word ends there.
 * Node ids are creation order and never change, so an id identifies a node across frames.
 */

export const MAX_LEN = 8;
export const MAX_WORDS = 10;
export const MAX_OPS = 20;

export const triePseudocode = [
  'insert(word):',
  '  node = root',
  '  for each letter c of word:',
  '    if node has no child c: create it',
  '    node = node.child[c]',
  '  node.isWord = true',
  'search(word):',
  '  walk word from the root; no child: not found',
  '  found only if the last node has isWord',
  'complete(prefix):',
  '  walk prefix from the root; no child: no matches',
  '  go depth-first below that node, letters in order',
  '  at each node with isWord: report its word',
];

/**
 * @typedef {object} TrieOp
 * @property {'insert'|'search'|'complete'} type
 * @property {string} word
 */

/**
 * @typedef {object} TrieNodeData
 * @property {number} id
 * @property {string} letter  The letter on the edge from the parent, empty for the root.
 * @property {number} parent  -1 for the root.
 * @property {boolean} isWord
 * @property {Record<string, number>} next  Child id by letter.
 */

/**
 * @typedef {object} TrieFrame
 * @property {'start'|'begin'|'follow'|'create'|'mark'|'dup'|'missing'|'found'|'prefix-only'|'subtree'|'collect'|'collected'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {TrieOp | null} op
 * @property {TrieNodeData[]} nodes
 * @property {number} current  Node acted on now, -1 when none.
 * @property {number[]} path  Nodes walked by this operation, from the root.
 * @property {number[]} subtree  complete: the nodes below the prefix, in depth-first order.
 * @property {string} letter  The letter read now, empty when none.
 * @property {string[]} results  complete: the words reported so far; done: those of the last
 *   complete in the log.
 * @property {number} steps  Nodes this operation touched below the root.
 * @property {number} nodeCount  Nodes, root included.
 * @property {number} wordCount
 * @property {number} letterCount  Letters across all stored words.
 * @property {number} storedNodeCount  Nodes below the root that those words use, so a word still
 *   being inserted counts in neither this nor letterCount.
 * @property {number[]} lines
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
 * The children of a node, letters in order.
 * @param {TrieNodeData} node
 * @returns {number[]}
 */
export const childIds = (node) =>
  Object.keys(node.next)
    .sort()
    .map((c) => node.next[c]);

/**
 * The prefix a node stands for.
 * @param {TrieNodeData[]} nodes
 * @param {number} id
 * @returns {string}
 */
export function prefixOf(nodes, id) {
  let out = '';
  for (let at = id; at > 0; at = nodes[at].parent) out = nodes[at].letter + out;
  return out;
}

/**
 * A node and everything below it, depth-first with letters in order.
 * @param {TrieNodeData[]} nodes
 * @param {number} id
 * @returns {number[]}
 */
function below(nodes, id) {
  return [id, ...childIds(nodes[id]).flatMap((c) => below(nodes, c))];
}

/**
 * How far a typed prefix follows the trie, and the words under it when all of it matches.
 * @param {TrieNodeData[]} nodes
 * @param {string} prefix
 * @returns {{path: number[], matched: number, words: string[], isWord: boolean}}
 */
export function matchPrefix(nodes, prefix) {
  const path = [0];
  for (const c of prefix) {
    const child = nodes[path[path.length - 1]].next[c];
    if (child === undefined) break;
    path.push(child);
  }
  const matched = path.length - 1;
  const end = nodes[path[matched]];
  const whole = matched === prefix.length;
  return {
    path,
    matched,
    isWord: whole && end.isWord,
    words: whole
      ? below(nodes, end.id)
          .filter((id) => nodes[id].isWord)
          .map((id) => prefixOf(nodes, id))
      : [],
  };
}

/**
 * @param {TrieOp[]} ops
 * @returns {TrieFrame[]}
 */
export function trieTrace(ops) {
  /** @type {TrieNodeData[]} */
  const nodes = [{ id: 0, letter: '', parent: -1, isWord: false, next: {} }];
  let wordCount = 0;
  let letterCount = 0;
  let storedNodeCount = 0;
  /** @type {string[]} */
  let lastResults = [];
  /** @type {TrieFrame[]} */
  const frames = [];

  /**
   * @param {TrieFrame['kind']} kind
   * @param {number} opIndex
   * @param {number[]} lines
   * @param {Partial<Pick<TrieFrame, 'current'|'path'|'subtree'|'letter'|'results'|'steps'>>} [state]
   */
  const push = (kind, opIndex, lines, state = {}) =>
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      nodes: nodes.map((n) => ({ ...n, next: { ...n.next } })),
      current: state.current ?? -1,
      path: (state.path ?? []).slice(),
      subtree: (state.subtree ?? []).slice(),
      letter: state.letter ?? '',
      results: (state.results ?? []).slice(),
      steps: state.steps ?? 0,
      nodeCount: nodes.length,
      wordCount,
      letterCount,
      storedNodeCount,
      lines,
    });

  push('start', -1, []);

  ops.forEach((op, opIndex) => {
    const insert = op.type === 'insert';
    const walkLines = insert ? [2, 3, 4] : op.type === 'search' ? [7] : [10];
    const path = [0];
    let steps = 0;
    /** @param {TrieFrame['kind']} kind @param {number[]} lines @param {string} [letter] */
    const emit = (kind, lines, letter = '') =>
      push(kind, opIndex, lines, {
        current: path[path.length - 1],
        path,
        letter,
        steps,
      });

    emit('begin', insert ? [0, 1] : op.type === 'search' ? [6] : [9]);

    for (const c of op.word) {
      const at = path[path.length - 1];
      let child = nodes[at].next[c];
      if (child === undefined) {
        if (!insert) {
          emit('missing', walkLines, c);
          return;
        }
        child = nodes.length;
        nodes.push({ id: child, letter: c, parent: at, isWord: false, next: {} });
        nodes[at].next[c] = child;
        path.push(child);
        steps++;
        emit('create', walkLines, c);
      } else {
        path.push(child);
        steps++;
        emit('follow', walkLines, c);
      }
    }

    const end = nodes[path[path.length - 1]];
    if (insert) {
      if (end.isWord) emit('dup', [5]);
      else {
        end.isWord = true;
        wordCount++;
        letterCount += op.word.length;
        storedNodeCount = nodes.length - 1;
        emit('mark', [5]);
      }
    } else if (op.type === 'search') {
      emit(end.isWord ? 'found' : 'prefix-only', [8]);
    } else {
      const subtree = below(nodes, end.id);
      steps += subtree.length - 1;
      /** @type {string[]} */
      const results = [];
      const tail = { path, subtree, steps };
      push('subtree', opIndex, [11], { ...tail, current: end.id });
      for (const id of subtree) {
        if (!nodes[id].isWord) continue;
        results.push(prefixOf(nodes, id));
        push('collect', opIndex, [12], { ...tail, current: id, results });
      }
      push('collected', opIndex, [11], { ...tail, results });
      lastResults = results;
    }
  });

  push('done', -1, [], { results: lastResults });
  return frames;
}

/** @typedef {'shared'|'apart'|'nested'} TriePreset */

/** @type {Record<TriePreset, {words: string[], then: TrieOp[]}>} */
const PRESETS = {
  shared: {
    words: ['car', 'card', 'care', 'cat', 'dog', 'dot'],
    then: [
      { type: 'search', word: 'ca' },
      { type: 'search', word: 'cat' },
      { type: 'complete', word: 'car' },
    ],
  },
  apart: {
    words: ['ant', 'bee', 'cow', 'elk', 'fox'],
    then: [
      { type: 'search', word: 'bee' },
      { type: 'complete', word: 'co' },
    ],
  },
  nested: {
    words: ['a', 'an', 'ant', 'ante', 'anteater', 'antler'],
    then: [
      { type: 'search', word: 'ante' },
      { type: 'search', word: 'ant' },
      { type: 'complete', word: 'ant' },
    ],
  },
};

/**
 * @param {TriePreset} preset
 * @returns {TrieOp[]}
 */
export function makeTrieOps(preset) {
  const { words, then } = PRESETS[preset];
  return [
    ...words.map((word) => /** @type {TrieOp} */ ({ type: 'insert', word })),
    ...then.map((op) => ({ ...op })),
  ];
}
