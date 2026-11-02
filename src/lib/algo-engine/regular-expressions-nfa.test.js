import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/regular-expressions-nfa/copy.en.js';
import {
  EPSILON,
  MAX_INPUT,
  MAX_REGEX,
  NFA_PRESETS,
  backtrackSteps,
  buildNfa,
  nfaPseudocode,
  nfaTrace,
  parseRegex,
  showRegex,
} from './regular-expressions-nfa.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./regular-expressions-nfa.js').NfaFrame[]} frames */
const last = (frames) =>
  /** @type {import('./regular-expressions-nfa.js').NfaFrame} */ (frames.at(-1));

/** @param {string} source */
function nfaOf(source) {
  const parsed = parseRegex(source);
  if ('error' in parsed) throw new Error(`${source}: ${parsed.error}`);
  return buildNfa(parsed.ast);
}

/** @param {string} regex @param {string} input */
const run = (regex, input) => nfaTrace(regex, nfaOf(regex), input);

/** A random expression from the grammar. @param {() => number} rand @param {number} depth @returns {string} */
function randomTree(rand, depth) {
  const pick = rand();
  if (depth === 0 || pick < 0.3) return 'abc.'[Math.floor(rand() * 4)];
  if (pick < 0.55) return randomTree(rand, depth - 1) + randomTree(rand, depth - 1);
  if (pick < 0.75) return `(${randomTree(rand, depth - 1)}|${randomTree(rand, depth - 1)})`;
  return `(${randomTree(rand, depth - 1)})${'*+?'[Math.floor(rand() * 3)]}`;
}

/** A random expression within the length cap. @param {() => number} rand @param {number} depth */
function randomRegex(rand, depth) {
  for (;;) {
    const source = randomTree(rand, depth);
    if (source.length <= MAX_REGEX) return source;
  }
}

/** @param {number} len @param {() => number} rand */
function randomInput(len, rand) {
  let w = '';
  for (let i = 0; i < len; i++) w += 'abc'[Math.floor(rand() * 3)];
  return w;
}

describe('parseRegex', () => {
  it('reads the grammar and round-trips through its source', () => {
    for (const source of ['a', 'ab', 'a|b', '(a|b)*abb', 'a+b?', '.*', '(ab)+', '(a*)*']) {
      const parsed = parseRegex(source);
      if ('error' in parsed) throw new Error(parsed.error);
      expect(showRegex(parsed.ast)).toBe(source);
    }
  });

  it('refuses malformed patterns with the reason', () => {
    expect(parseRegex('  ')).toEqual({ error: 'empty' });
    expect(parseRegex('a1')).toEqual({ error: 'format' });
    expect(parseRegex('a'.repeat(MAX_REGEX + 1))).toEqual({ error: 'length' });
    expect(parseRegex('(a')).toEqual({ error: 'paren' });
    expect(parseRegex('a)')).toEqual({ error: 'paren' });
    expect(parseRegex('a|')).toEqual({ error: 'branch' });
    expect(parseRegex('|a')).toEqual({ error: 'branch' });
    expect(parseRegex('()')).toEqual({ error: 'branch' });
    expect(parseRegex('*a')).toEqual({ error: 'repeat' });
    expect(parseRegex('(*a)')).toEqual({ error: 'repeat' });
    expect(parseRegex('a**')).toEqual({ error: 'stacked' });
  });
});

describe('Thompson construction', () => {
  it('builds the known size for a single letter and a star', () => {
    const one = nfaOf('a');
    expect(one.states.length).toBe(2);
    expect(one.edges).toEqual([{ from: 0, to: 1, label: 'a', bend: 0 }]);
    const star = nfaOf('a*');
    expect(star.states.length).toBe(4);
    expect(star.edges.length).toBe(5);
    expect(star.edges.filter((e) => e.label === EPSILON).length).toBe(4);
  });

  it('stays within 2m states and 4m edges for a regex of m symbols', () => {
    const rand = seeded(3);
    for (let round = 0; round < 300; round++) {
      const source = randomRegex(rand, 4);
      const size = source.replace(/[()]/g, '').length;
      const nfa = nfaOf(source);
      expect(nfa.states.length).toBeLessThanOrEqual(2 * size);
      expect(nfa.edges.length).toBeLessThanOrEqual(4 * size);
    }
  });

  it('places every state on its own spot', () => {
    const rand = seeded(5);
    for (let round = 0; round < 200; round++) {
      const nfa = nfaOf(randomRegex(rand, 4));
      const spots = nfa.states.map((s) => `${s.x},${s.y}`);
      expect(new Set(spots).size).toBe(spots.length);
      for (const s of nfa.states) {
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.x).toBeLessThanOrEqual(nfa.width);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeLessThanOrEqual(nfa.height);
      }
    }
  });

  it('adds each piece on top of the last', () => {
    const nfa = nfaOf('(a|b)*c');
    expect(nfa.pieces.map((p) => p.text)).toEqual(['a', 'b', 'a|b', '(a|b)*', 'c']);
    expect(nfa.pieces.at(-1)?.states).toBe(nfa.states.length);
    expect(nfa.pieces.at(-1)?.edges).toBe(nfa.edges.length);
  });
});

describe('set simulation', () => {
  it('decides known cases', () => {
    expect(last(run('(a|b)*abb', 'aababb')).accepted).toBe(true);
    expect(last(run('(a|b)*abb', 'abab')).accepted).toBe(false);
    expect(last(run('a*', '')).accepted).toBe(true);
    expect(last(run('a', '')).accepted).toBe(false);
    expect(last(run('colou?r', 'color')).accepted).toBe(true);
    expect(last(run('colou?r', 'colouur')).accepted).toBe(false);
    expect(last(run('a.c', 'abc')).accepted).toBe(true);
    expect(last(run('a+', '')).accepted).toBe(false);
  });

  it('agrees with the JavaScript regex engine on random patterns', () => {
    const rand = seeded(7);
    for (let round = 0; round < 500; round++) {
      const source = randomRegex(rand, 4);
      const oracle = new RegExp(`^(?:${source})$`);
      for (let t = 0; t < 4; t++) {
        const input = randomInput(Math.floor(rand() * 7), rand);
        expect(last(run(source, input)).accepted, `${source} on ${input}`).toBe(oracle.test(input));
      }
    }
  });

  it('keeps the active set closed under ε edges', () => {
    const nfa = nfaOf('(a|b)*abb');
    for (const f of nfaTrace('(a|b)*abb', nfa, 'aababb')) {
      if (f.kind !== 'closure' && f.kind !== 'ready') continue;
      for (const e of nfa.edges) {
        if (e.label === EPSILON && f.set.includes(e.from)) expect(f.set).toContain(e.to);
      }
    }
  });

  it('stops as soon as the set is empty', () => {
    const frames = run('(ab)+c', 'ababd');
    expect(frames.at(-2)?.kind).toBe('dead');
    expect(frames.at(-2)?.set).toEqual([]);
    expect(last(frames).accepted).toBe(false);
  });

  it('never looks at more than twice the edges per letter', () => {
    const rand = seeded(11);
    for (let round = 0; round < 100; round++) {
      const source = randomRegex(rand, 4);
      const nfa = nfaOf(source);
      const input = randomInput(MAX_INPUT, rand);
      const f = last(nfaTrace(source, nfa, input));
      expect(f.edgeChecks).toBeLessThanOrEqual(2 * nfa.edges.length * (input.length + 1));
    }
  });
});

describe('backtracking comparison', () => {
  /** @param {string} source */
  const astOf = (source) => {
    const parsed = parseRegex(source);
    if ('error' in parsed) throw new Error(parsed.error);
    return parsed.ast;
  };

  it('agrees with the simulation on random patterns', () => {
    const rand = seeded(13);
    for (let round = 0; round < 300; round++) {
      const source = randomRegex(rand, 3);
      const input = randomInput(Math.floor(rand() * 6), rand);
      expect(backtrackSteps(astOf(source), input).matched, `${source} on ${input}`).toBe(
        last(run(source, input)).accepted,
      );
    }
  });

  it('blows up on an ambiguous pattern while the simulation does not', () => {
    const { regex, input } = NFA_PRESETS.blowup;
    const slow = backtrackSteps(astOf(regex), input);
    const frames = run(regex, input);
    expect(slow.matched).toBe(false);
    expect(slow.steps).toBeGreaterThan(8000);
    expect(last(frames).edgeChecks).toBeLessThan(600);
    const short = backtrackSteps(astOf(regex), 'aaaaaa').steps;
    expect(slow.steps).toBeGreaterThan(short * 30);
  });

  it('stops counting at the cap', () => {
    const res = backtrackSteps(astOf('(a|a|a|a)*b'), 'aaaaaaaaaaaa');
    expect(res.capped).toBe(true);
    expect(res.matched).toBe(null);
  });
});

describe('frames', () => {
  it('never alias', () => {
    const frames = run('a*b', 'ab');
    const copy = JSON.stringify(frames[frames.length - 2]);
    const earlier = frames[frames.length - 3];
    earlier.set.push(77);
    earlier.fresh.push(77);
    earlier.taken.push(77);
    earlier.history.push({ letter: 'z', set: [77] });
    expect(JSON.stringify(frames[frames.length - 2])).toBe(copy);
  });

  it('stay under 400 at the cap', () => {
    expect(run('(a|b|c|d|e|f|g)*', 'abcdefgabcde').length).toBeLessThan(400);
    expect(run('a?a?a?a?a?a?', 'aaaaaa').length).toBeLessThan(400);
  });

  it('start with start and end with done', () => {
    const frames = run('a', 'a');
    expect(frames[0].kind).toBe('start');
    expect(last(frames).kind).toBe('done');
  });
});

describe('practice answers', () => {
  const practice = /** @type {any[]} */ (m.practice);

  it('counts the states of the pieces', () => {
    expect(practice[0].answer).toBe(nfaOf('a*').states.length);
    expect(practice[1].answer).toBe(nfaOf('a|b').edges.filter((e) => e.label === EPSILON).length);
  });

  it('reads the set sizes and verdicts', () => {
    const start = run('a|b', '').find((f) => f.kind === 'ready');
    expect(practice[2].answer).toBe(start?.set.length);
    const q = practice[3];
    const inputs = ['abb', 'aabb', 'abab', 'babb', 'ab'];
    const accepted = inputs.flatMap((w, k) => (last(run('(a|b)*abb', w)).accepted ? [k] : []));
    expect(q.options).toEqual(inputs);
    expect(q.answers).toEqual(accepted);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const seen = new Set(
      Object.values(NFA_PRESETS).flatMap(({ regex, input }) =>
        run(regex, input).flatMap((f) => f.lines),
      ),
    );
    nfaPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
