/**
 * Regular expressions over the letters a to z, with `.`, `|`, `*`, `+`, `?` and brackets. Thompson's
 * construction turns one into an NFA: every letter adds one state and one edge, and every
 * operator adds a few states and ε edges, so the size stays linear. Running it keeps
 * the set of states the machine could be in, so each input letter costs at most one pass over
 * the edges and there is no backtracking. A piece enters at an existing state and always
 * leaves through a fresh one, and loops only re-enter a state made inside that piece.
 */

export const MAX_REGEX = 16;
export const MAX_INPUT = 12;
export const EPSILON = 'ε';
/** Backtracking stops counting here, so a pathological pattern cannot hang the page. */
export const BACKTRACK_CAP = 1000000;

export const nfaPseudocode = [
  'build the NFA: one small piece per letter and operator',
  'set = ε-closure({start})',
  'for each letter c of the input:',
  '  next = states reached from set by a c edge',
  '  set = ε-closure(next)',
  '  if set is empty: stop and reject',
  'accept if set contains the accepting state',
];

/**
 * @typedef {{type: 'char', c: string}
 *   | {type: 'any'}
 *   | {type: 'cat' | 'alt', items: RegexNode[]}
 *   | {type: 'star' | 'plus' | 'opt', item: RegexNode}} RegexNode
 *
 * @typedef {object} NfaState
 * @property {number} id
 * @property {number} x  Column.
 * @property {number} y  Row, possibly fractional.
 *
 * @typedef {object} NfaEdge
 * @property {number} from
 * @property {number} to
 * @property {string} label  A letter, `.` or ε.
 * @property {number} bend  How far the drawn arc bows, in rows: negative above, positive below.
 *
 * @typedef {object} NfaPiece
 * @property {RegexNode['type']} type
 * @property {string} text  The source of this piece.
 * @property {number} states  States existing once it is built.
 * @property {number} edges  Edges existing once it is built.
 *
 * @typedef {object} Nfa
 * @property {NfaState[]} states
 * @property {NfaEdge[]} edges
 * @property {number} start
 * @property {number} accept
 * @property {number} width  In columns.
 * @property {number} height  In rows.
 * @property {NfaPiece[]} pieces  In build order.
 * @property {RegexNode} ast
 *
 * @typedef {object} NfaFrame
 * @property {'start'|'build'|'ready'|'read'|'closure'|'dead'|'done'} kind
 * @property {string} regex
 * @property {string} input
 * @property {NfaPiece | null} piece  build: the piece just added.
 * @property {number} visibleStates
 * @property {number} visibleEdges
 * @property {number[]} set  The active states.
 * @property {number[]} fresh  read: states just reached; closure: states added by ε edges.
 * @property {number[]} taken  Indices of the edges just followed.
 * @property {number} i  The input letter being read, -1 when none.
 * @property {string} letter
 * @property {boolean | null} accepted  done: the verdict; null until then.
 * @property {number} edgeChecks  Edges looked at while simulating.
 * @property {{letter: string, set: number[]}[]} history  The set after each letter.
 * @property {number[]} lines
 */

/**
 * @param {string} source
 * @returns {{ast: RegexNode} | {error: 'empty'|'format'|'length'|'paren'|'branch'|'repeat'|'stacked'}}
 */
export function parseRegex(source) {
  const src = source.trim().toLowerCase();
  if (src === '') return { error: 'empty' };
  if (!/^[a-z.|*+?()]+$/.test(src)) return { error: 'format' };
  if (src.length > MAX_REGEX) return { error: 'length' };
  let at = 0;

  /** @param {'paren'|'branch'|'repeat'|'stacked'} error */
  const fail = (error) => {
    throw new SyntaxError(error);
  };

  /** @returns {RegexNode} */
  function alternation() {
    const items = [concatenation()];
    while (src[at] === '|') {
      at++;
      items.push(concatenation());
    }
    return items.length === 1 ? items[0] : { type: 'alt', items };
  }

  /** @returns {RegexNode} */
  function concatenation() {
    /** @type {RegexNode[]} */
    const items = [];
    while (at < src.length && src[at] !== '|' && src[at] !== ')') items.push(repeated());
    if (items.length === 0) fail('branch');
    return items.length === 1 ? items[0] : { type: 'cat', items };
  }

  /** @returns {RegexNode} */
  function repeated() {
    const item = atom();
    const op = src[at];
    if (op !== '*' && op !== '+' && op !== '?') return item;
    at++;
    if ('*+?'.includes(src[at] ?? ' ')) fail('stacked');
    return { type: op === '*' ? 'star' : op === '+' ? 'plus' : 'opt', item };
  }

  /** @returns {RegexNode} */
  function atom() {
    const c = src[at];
    if (c === '*' || c === '+' || c === '?') fail('repeat');
    at++;
    if (c === '.') return { type: 'any' };
    if (c !== '(') return { type: 'char', c };
    const inner = alternation();
    if (src[at] !== ')') fail('paren');
    at++;
    return inner;
  }

  try {
    const ast = alternation();
    if (at < src.length) fail('paren');
    return { ast };
  } catch (e) {
    return { error: /** @type {'paren'} */ (/** @type {Error} */ (e).message) };
  }
}

/**
 * The source text of a node.
 * @param {RegexNode} node
 * @returns {string}
 */
export function showRegex(node) {
  /** @param {RegexNode} n @param {RegexNode['type'][]} wrap */
  const part = (n, wrap) => (wrap.includes(n.type) ? `(${showRegex(n)})` : showRegex(n));
  switch (node.type) {
    case 'char':
      return node.c;
    case 'any':
      return '.';
    case 'cat':
      return node.items.map((n) => part(n, ['alt'])).join('');
    case 'alt':
      return node.items.map(showRegex).join('|');
    case 'star':
      return `${part(node.item, ['cat', 'alt', 'star', 'plus', 'opt'])}*`;
    case 'plus':
      return `${part(node.item, ['cat', 'alt', 'star', 'plus', 'opt'])}+`;
    case 'opt':
      return `${part(node.item, ['cat', 'alt', 'star', 'plus', 'opt'])}?`;
  }
}

/** Room an arc around a repeated piece takes, in rows. */
const ARC = 0.6;

/**
 * The size of a piece around its middle line.
 * @param {RegexNode} node
 * @returns {{w: number, up: number, down: number}}
 */
function measure(node) {
  switch (node.type) {
    case 'char':
    case 'any':
      return { w: 1, up: 0, down: 0 };
    case 'cat': {
      const parts = node.items.map(measure);
      return {
        w: parts.reduce((sum, p) => sum + p.w, 0),
        up: Math.max(...parts.map((p) => p.up)),
        down: Math.max(...parts.map((p) => p.down)),
      };
    }
    case 'alt': {
      const parts = node.items.map(measure);
      const height = parts.reduce((sum, p) => sum + p.up + p.down, 0) + parts.length - 1;
      return { w: Math.max(...parts.map((p) => p.w)) + 2, up: height / 2, down: height / 2 };
    }
    case 'star':
    case 'plus':
    case 'opt': {
      const p = measure(node.item);
      return {
        w: p.w + 2,
        up: p.up + (node.type === 'opt' ? 0 : ARC),
        down: p.down + (node.type === 'plus' ? 0 : ARC),
      };
    }
  }
}

/**
 * Thompson's construction, with every state placed on a grid.
 * @param {RegexNode} ast
 * @returns {Nfa}
 */
export function buildNfa(ast) {
  /** @type {NfaState[]} */
  const states = [];
  /** @type {NfaEdge[]} */
  const edges = [];
  /** @type {NfaPiece[]} */
  const pieces = [];

  /** @param {number} x @param {number} y */
  const state = (x, y) => {
    states.push({ id: states.length, x, y });
    return states.length - 1;
  };
  /** @param {number} from @param {number} to @param {string} label @param {number} [bend] */
  const edge = (from, to, label, bend = 0) => {
    edges.push({ from, to, label, bend });
  };
  /** @param {RegexNode} node */
  const piece = (node) => {
    pieces.push({
      type: node.type,
      text: showRegex(node),
      states: states.length,
      edges: edges.length,
    });
  };

  /**
   * Builds a piece that enters at `entry`, placed at column x on middle line y.
   * @param {RegexNode} node
   * @param {number} entry
   * @param {number} x
   * @param {number} y
   * @returns {number} The state it leaves through.
   */
  function emit(node, entry, x, y) {
    switch (node.type) {
      case 'char':
      case 'any': {
        const exit = state(x + 1, y);
        edge(entry, exit, node.type === 'char' ? node.c : '.');
        piece(node);
        return exit;
      }
      case 'cat': {
        let at = entry;
        let col = x;
        for (const item of node.items) {
          at = emit(item, at, col, y);
          col += measure(item).w;
        }
        return at;
      }
      case 'alt': {
        const size = measure(node);
        let top = y - size.up;
        const ends = node.items.map((item) => {
          const part = measure(item);
          const line = top + part.up;
          top = line + part.down + 1;
          const start = state(x + 1, line);
          edge(entry, start, EPSILON);
          return emit(item, start, x + 1, line);
        });
        const exit = state(x + size.w, y);
        for (const end of ends) edge(end, exit, EPSILON);
        piece(node);
        return exit;
      }
      case 'star':
      case 'plus':
      case 'opt': {
        const inner = measure(node.item);
        const start = state(x + 1, y);
        edge(entry, start, EPSILON);
        const end = emit(node.item, start, x + 1, y);
        const exit = state(x + inner.w + 2, y);
        edge(end, exit, EPSILON);
        if (node.type !== 'opt') edge(end, start, EPSILON, -(inner.up + ARC));
        if (node.type !== 'plus') edge(entry, exit, EPSILON, inner.down + ARC);
        piece(node);
        return exit;
      }
    }
  }

  const size = measure(ast);
  const start = state(0, size.up);
  const accept = emit(ast, start, 0, size.up);
  return {
    states,
    edges,
    start,
    accept,
    width: size.w,
    height: size.up + size.down,
    pieces,
    ast,
  };
}

/**
 * Whether an edge label takes an input letter.
 * @param {string} label
 * @param {string} letter
 */
const takes = (label, letter) => label !== EPSILON && (label === '.' || label === letter);

/**
 * Runs the NFA on the input, building it step by step first.
 * @param {string} regex
 * @param {Nfa} nfa
 * @param {string} input
 * @returns {NfaFrame[]}
 */
export function nfaTrace(regex, nfa, input) {
  /** @type {NfaFrame[]} */
  const frames = [];
  /** @type {number[]} */
  let set = [];
  let edgeChecks = 0;
  /** @type {{letter: string, set: number[]}[]} */
  const history = [];
  let visibleStates = 1;
  let visibleEdges = 0;
  const outOf = nfa.states.map((s) =>
    nfa.edges.map((_, k) => k).filter((k) => nfa.edges[k].from === s.id),
  );

  /**
   * @param {NfaFrame['kind']} kind
   * @param {number[]} lines
   * @param {{piece?: NfaPiece, fresh?: number[], taken?: number[], i?: number, letter?: string, accepted?: boolean}} [extra]
   */
  const push = (kind, lines, extra = {}) =>
    frames.push({
      kind,
      regex,
      input,
      piece: extra.piece ? { ...extra.piece } : null,
      visibleStates,
      visibleEdges,
      set: set.slice(),
      fresh: extra.fresh?.slice() ?? [],
      taken: extra.taken?.slice() ?? [],
      i: extra.i ?? -1,
      letter: extra.letter ?? '',
      accepted: extra.accepted ?? null,
      edgeChecks,
      history: history.map((h) => ({ letter: h.letter, set: h.set.slice() })),
      lines,
    });

  /**
   * Follows ε edges from the given states.
   * @param {number[]} from
   * @returns {{all: number[], added: number[], taken: number[]}}
   */
  function closure(from) {
    const seen = new Set(from);
    /** @type {number[]} */
    const taken = [];
    const stack = from.slice();
    while (stack.length > 0) {
      const at = /** @type {number} */ (stack.pop());
      for (const k of outOf[at]) {
        edgeChecks++;
        const e = nfa.edges[k];
        if (e.label !== EPSILON) continue;
        taken.push(k);
        if (!seen.has(e.to)) {
          seen.add(e.to);
          stack.push(e.to);
        }
      }
    }
    return {
      all: [...seen].sort((a, b) => a - b),
      added: [...seen].filter((s) => !from.includes(s)).sort((a, b) => a - b),
      taken,
    };
  }

  push('start', [0]);
  for (const piece of nfa.pieces) {
    visibleStates = piece.states;
    visibleEdges = piece.edges;
    push('build', [0], { piece });
  }

  const first = closure([nfa.start]);
  set = first.all;
  push('ready', [1], { fresh: first.added, taken: first.taken });

  let dead = false;
  for (let i = 0; i < input.length; i++) {
    const letter = input[i];
    /** @type {number[]} */
    const taken = [];
    const reached = new Set();
    for (const s of set) {
      for (const k of outOf[s]) {
        edgeChecks++;
        if (takes(nfa.edges[k].label, letter)) {
          taken.push(k);
          reached.add(nfa.edges[k].to);
        }
      }
    }
    const next = /** @type {number[]} */ ([...reached]).sort((a, b) => a - b);
    push('read', [2, 3], { fresh: next, taken, i, letter });
    if (next.length === 0) {
      set = [];
      history.push({ letter, set: [] });
      push('dead', [5], { i, letter });
      dead = true;
      break;
    }
    const closed = closure(next);
    set = closed.all;
    history.push({ letter, set: set.slice() });
    push('closure', [4], { fresh: closed.added, taken: closed.taken, i, letter });
  }

  push('done', dead ? [5] : [6], { accepted: !dead && set.includes(nfa.accept) });
  return frames;
}

/**
 * Counts the attempts of a plain backtracking matcher, the way many regex libraries work, to
 * compare with the set simulation. Repeats must consume a letter, so it always ends.
 * @param {RegexNode} ast
 * @param {string} input
 * @returns {{matched: boolean | null, steps: number, capped: boolean}}
 */
export function backtrackSteps(ast, input) {
  let steps = 0;
  const OVER = Symbol('over');

  /**
   * @param {RegexNode} node
   * @param {number} i
   * @param {(j: number) => boolean} k
   * @returns {boolean}
   */
  function match(node, i, k) {
    if (++steps > BACKTRACK_CAP) throw OVER;
    switch (node.type) {
      case 'char':
        return input[i] === node.c && k(i + 1);
      case 'any':
        return i < input.length && k(i + 1);
      case 'cat': {
        /** @param {number} at @param {number} from @returns {boolean} */
        const walk = (at, from) =>
          at === node.items.length ? k(from) : match(node.items[at], from, (j) => walk(at + 1, j));
        return walk(0, i);
      }
      case 'alt':
        return node.items.some((item) => match(item, i, k));
      case 'opt':
        return match(node.item, i, k) || k(i);
      case 'star':
      case 'plus': {
        /** @param {number} from @returns {boolean} */
        const loop = (from) => match(node.item, from, (j) => j > from && loop(j)) || k(from);
        return node.type === 'star' ? loop(i) : match(node.item, i, loop);
      }
    }
  }

  try {
    const matched = match(ast, 0, (j) => j === input.length);
    return { matched, steps, capped: false };
  } catch (e) {
    if (e !== OVER) throw e;
    return { matched: null, steps: BACKTRACK_CAP, capped: true };
  }
}

/** @type {Record<'classic'|'choice'|'optional'|'dead'|'blowup', {regex: string, input: string}>} */
export const NFA_PRESETS = {
  classic: { regex: '(a|b)*abb', input: 'aababb' },
  choice: { regex: '(cat|dog)s?', input: 'dogs' },
  optional: { regex: 'colou?r', input: 'color' },
  dead: { regex: '(ab)+c', input: 'ababd' },
  blowup: { regex: '(a|a)*b', input: 'aaaaaaaaaaaa' },
};
