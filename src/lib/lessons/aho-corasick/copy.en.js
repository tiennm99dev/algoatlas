/** @typedef {import('$lib/algo-engine/aho-corasick.js').AcFrame} AcFrame */
import { prefixOf } from '$lib/algo-engine/aho-corasick.js';

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** A node by the prefix it stands for. @param {AcFrame} f @param {number} id */
const name = (f, id) => (id === 0 ? 'the root' : `“${prefixOf(f.nodes, id)}”`);

export const en = {
  slug: 'aho-corasick',
  topic: 'string-algorithms',
  level: 'Advanced',
  title: 'Aho-Corasick',
  intro:
    'Searching for many patterns one at a time repeats work for every pattern. Aho-Corasick puts them all in one trie and adds failure links, so a mismatch falls back to the longest suffix still in the trie instead of restarting. One pass over the text then finds every pattern, however many there are.',
  summary:
    'Build a trie with failure and output links, then find many patterns in one pass over the text, with no backtracking.',
  instruction:
    'Type some patterns and a text, then step. First the trie grows, then breadth-first order adds the dashed failure links, then the active state walks the trie as the text is read. On a mismatch, watch it follow a dashed link instead of moving back in the text.',
  patternsLabel: 'Patterns (commas or spaces)',
  textLabel: 'Text',
  presetLabel: 'Example',
  linksLegend: 'Failure links shown',
  linkModes: { useful: 'Hide those to the root', all: 'All' },
  presets: {
    classic: 'he, she, his, hers',
    nested: 'Patterns inside patterns',
    chain: 'Long fallback chain',
    codons: 'Equal lengths',
  },
  /** @param {number} words @param {number} len @param {number} text */
  fieldErrors: (words, len, text) => ({
    empty: 'Type at least one pattern.',
    format: 'Use letters a to z only.',
    count: `Use at most ${words} patterns.`,
    length: `Each pattern may have at most ${len} letters.`,
    duplicate: 'Each pattern may appear only once.',
    textEmpty: 'Type a text to search.',
    textFormat: 'The text may use letters a to z only, with no spaces.',
    textLength: `The text may have at most ${text} letters.`,
  }),
  boardTitle: 'Trie with its links',
  /** @param {number} n */
  boardAria: (n) => `A trie of ${plural(n, 'node', 'nodes')} with failure and output links.`,
  textTitle: 'Text',
  textAria: 'The text being searched, letter by letter.',
  boardNote:
    'Each node stands for the letters on its path from the root. A node with no arrow drawn fails to the root, unless all links are shown.',
  linkKinds: {
    tree: 'Trie edge',
    fail: 'Failure link, dashed',
    out: 'Output link, dotted',
  },
  /** @param {string} prefix @param {string} fail @param {string} role @param {string} word */
  nodeLabel: (prefix, fail, role, word) =>
    `Node ${prefix || 'root'}${word ? `, ends the pattern ${word}` : ''}${fail ? `, fails to ${fail}` : ''}${role ? `, ${role}` : ''}`,
  states: {
    active: 'active state',
    parent: 'node u',
    child: 'child v',
    chain: 'node f on the failure chain',
    queued: 'in the queue',
    found: 'reported',
  },
  markers: { active: '▶', parent: 'u', child: 'v', chain: 'f', queued: 'q', found: '★' },
  legend: {
    active: 'Active state or new node',
    parent: 'Node u',
    child: 'Child v',
    chain: 'Node f on the chain',
    queued: 'In the queue',
    found: 'Pattern reported',
  },
  wordEnd: '◎ Double ring: a pattern ends here',
  textMarkers: { read: '↓', hit: '★' },
  /** @param {number} i @param {string} letter @param {string} state */
  textLabelOf: (i, letter, state) => `Text position ${i}: ${letter}${state ? `, ${state}` : ''}`,
  textStates: { read: 'being read', hit: 'inside the match just reported' },
  stats: {
    nodes: 'Trie nodes',
    state: 'Active state',
    edges: 'Scan: edges followed',
    hops: 'Scan: failure hops',
    naive: 'Plain search comparisons',
    matches: 'Matches found',
  },
  /** @param {AcFrame} f */
  stateValue: (f) => (f.state < 0 ? '—' : f.state === 0 ? 'root' : prefixOf(f.nodes, f.state)),
  matchesTitle: 'Matches, as pattern @ start',
  matchesEmpty: 'none yet',
  /** @param {{word: string, start: number}} x */
  matchLabel: (x) => `${x.word} @ ${x.start}`,
  queueTitle: 'Breadth-first queue',
  queueEmpty: 'empty',
  /** @param {AcFrame} f @param {number} id */
  queueLabel: (f, id) => prefixOf(f.nodes, id),
  /** @param {AcFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return 'Start with an empty trie: only the root.';
      case 'insert':
        return `Pattern ${f.word}: letter ${f.letter} leads to ${name(f, f.v)}.`;
      case 'mark':
        return `Mark ${name(f, f.v)}: the pattern ${f.word} ends here.`;
      case 'seed':
        return 'Every child of the root fails to the root, since a one-letter prefix has no shorter suffix. They start the queue.';
      case 'visit':
        return `Take ${name(f, f.u)} from the queue. Its failure link is already known, so its children can use it.`;
      case 'child':
        return `Child ${name(f, f.v)} on letter ${f.letter}: start the search at f = ${name(f, f.f)}, the failure link of its parent.`;
      case 'hop':
        return `No ${f.letter} edge there, so f moves along its failure link to ${name(f, f.f)}.`;
      case 'link': {
        const target = /** @type {number} */ (f.nodes[f.v].fail);
        const out = f.nodes[f.v].out;
        const outText = out === null ? '' : ` Its output link points to ${name(f, out)}.`;
        return `${name(f, f.v)} fails to ${name(f, target)}, its longest proper suffix in the trie.${outText}`;
      }
      case 'scan':
        return `The links are ready. Read the text ${f.text} from the root.`;
      case 'read':
        return `Read text letter ${f.i}: ${f.letter}. The state is ${name(f, f.state)}.`;
      case 'fallback':
        return `No ${f.letter} edge at the old state, so follow its failure link to ${name(f, f.state)}. The text position does not move back.`;
      case 'advance':
        return `Follow the ${f.letter} edge to ${name(f, f.state)}.`;
      case 'stay':
        return `The root has no ${f.letter} edge either, so stay at the root and read on.`;
      case 'report': {
        const word = /** @type {string} */ (f.nodes[f.v].word);
        return f.viaOut
          ? `An output link shows ${word} also ends here, at text position ${f.i}.`
          : `Pattern ${word} ends here, at text position ${f.i}.`;
      }
      case 'done':
        return `Done: ${plural(f.matches.length, 'match', 'matches')}, with ${plural(f.edges, 'edge', 'edges')} and ${plural(f.hops, 'failure hop', 'failure hops')} over ${plural(f.text.length, 'letter', 'letters')}.`;
    }
  },
  takeaways: [
    'A trie holds all the patterns, so patterns that share a prefix share the same path and one walk tests them together.',
    'The failure link of a node points to the longest proper suffix of its prefix that is also in the trie: the most that can still count after a mismatch.',
    'Links are set breadth first, because a failure link always points to a shallower node, whose own link is already known.',
    'An output link points to the next pattern on the failure chain, so a pattern hidden inside another, such as he inside she, is reported too.',
    'Try “Patterns inside patterns”, then compare the failure hops with the plain search comparisons on a longer text of your own.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    ['Trie', 'O(L)', 'One step per letter over all the patterns, L in total.'],
    [
      'Failure and output links',
      'O(L)',
      'Along each pattern the depth of f falls by at least one per hop and rises by at most one per letter, with a fixed alphabet.',
    ],
    [
      'Search',
      'O(n + z)',
      'Depth rises at most once per text letter and each hop lowers it, so hops total at most n. Each of the z matches takes one output step.',
    ],
    [
      'Separate searches',
      'O(kn + L)',
      'One KMP run per pattern repeats the whole text k times; Aho-Corasick reads it once.',
    ],
    ['Memory', 'O(L)', 'One node per distinct prefix, with its edges and two links.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many trie nodes do he, she, his and hers need, counting the root?',
      answer: 10,
      unit: 'nodes',
      hints: ['Count distinct prefixes: he and hers share a path, as do he and his up to h.'],
      solution:
        'The prefixes are h, he, her, hers, hi, his, s, sh and she: nine, and the root makes ten.',
    },
    {
      type: 'text',
      prompt:
        'In the trie of he, she, his and hers, where does the failure link of she point? Type the prefix.',
      accept: ['he'],
      hints: ['List the proper suffixes of she, longest first, and look each one up in the trie.'],
      solution:
        'The proper suffixes are he and e. The longest in the trie is he, so she fails to he.',
    },
    {
      type: 'number',
      prompt: 'Search ushers for he, she, his and hers. How many matches are reported?',
      answer: 3,
      unit: 'matches',
      hints: ['Set the classic preset’s text to ushers and read the last step.'],
      solution:
        'she ends at position 3, and he ends there too through an output link. hers ends at position 5.',
    },
    {
      type: 'number',
      prompt: 'Search aaaa for a, aa and aaa. How many matches are reported, overlaps included?',
      answer: 9,
      unit: 'matches',
      hints: ['Count the occurrences of each pattern separately.'],
      solution: 'a occurs 4 times, aa 3 times and aaa 2 times: 4 + 3 + 2 = 9.',
    },
    {
      type: 'number',
      prompt:
        'With patterns abcd, bc, c and bcx, read the text abcx. How many failure hops does the scan make?',
      answer: 1,
      unit: 'hops',
      hints: ['After abc the next letter is x. Does abc have an x edge? Does its failure target?'],
      solution:
        'abc has no x edge, so it follows its failure link to bc. bc has an x edge (from bcx), so one hop is enough.',
    },
  ],
  nextTeaser:
    'Next up: Suffix arrays and LCP, which sort every suffix of one text so that any pattern can be looked up later.',
};
