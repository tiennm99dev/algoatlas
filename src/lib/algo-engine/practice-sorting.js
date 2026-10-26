/**
 * A sorting race: six comparison sorts run on their own copy of the same cards, and the race
 * clock is the comparison count. At step t every sort that is still running has made its t-th
 * key comparison and the moves that follow it, so the sort that needs the fewest comparisons
 * on this input finishes first.
 *
 * Each sort runs once through a recorder that counts comparisons, element writes, the deepest
 * recursion and the largest extra buffer, and snapshots the array after every comparison. The
 * race frames are read off those snapshots, so stepping back never re-runs a sort.
 *
 * Variants: bubble sort with the early-exit flag; insertion sort by shifting (drawn as the key
 * sinking left, one write per shift plus one to drop the key); selection sort with one swap per
 * pass (skipped when the minimum is already in place); top-down merge sort that copies the run
 * into a buffer and takes the left card on ties; quicksort with Lomuto partition and the last
 * card as pivot; heapsort with a max-heap and sift-down. A swap writes two slots; swapping a
 * slot with itself is skipped and costs nothing.
 */

import { equalKeyOrder, toCards } from './selection-sort-stability.js';

/** @typedef {import('./selection-sort-stability.js').Card} Card */
/** @typedef {'bubble' | 'insertion' | 'selection' | 'merge' | 'quick' | 'heap'} SortId */
/** @typedef {'random' | 'nearly-sorted' | 'sorted' | 'reversed' | 'few-unique'} Shape */
/** @typedef {'stable' | 'in-place' | 'average' | 'worst' | 'adaptive' | 'few-writes'} Constraint */

export const MIN_N = 2;
export const MAX_N = 16;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;

/** @type {SortId[]} */
export const SORTS = ['bubble', 'insertion', 'selection', 'merge', 'quick', 'heap'];

/** @type {Shape[]} */
export const SHAPES = ['random', 'nearly-sorted', 'sorted', 'reversed', 'few-unique'];

/** @type {Constraint[]} */
export const CONSTRAINTS = ['stable', 'in-place', 'average', 'worst', 'adaptive', 'few-writes'];

/**
 * What each sort guarantees, as taught in this chapter. `in-place` means O(1) extra memory
 * (quicksort’s recursion stack is O(log n) at best and O(n) in this version’s worst case);
 * `average` and `worst` mean O(n log n) time; `adaptive` means O(n) on sorted input;
 * `few-writes` means O(n) element writes.
 * @type {Record<SortId, Record<Constraint, boolean>>}
 */
export const SORT_FACTS = {
  bubble: {
    stable: true,
    'in-place': true,
    average: false,
    worst: false,
    adaptive: true,
    'few-writes': false,
  },
  insertion: {
    stable: true,
    'in-place': true,
    average: false,
    worst: false,
    adaptive: true,
    'few-writes': false,
  },
  selection: {
    stable: false,
    'in-place': true,
    average: false,
    worst: false,
    adaptive: false,
    'few-writes': true,
  },
  merge: {
    stable: true,
    'in-place': false,
    average: true,
    worst: true,
    adaptive: false,
    'few-writes': false,
  },
  quick: {
    stable: false,
    'in-place': false,
    average: true,
    worst: false,
    adaptive: false,
    'few-writes': false,
  },
  heap: {
    stable: false,
    'in-place': true,
    average: true,
    worst: true,
    adaptive: false,
    'few-writes': false,
  },
};

/**
 * The sorts that meet every chosen constraint, in race order.
 * @param {Constraint[]} chosen
 * @returns {SortId[]}
 */
export function matchSorts(chosen) {
  return SORTS.filter((id) => chosen.every((c) => SORT_FACTS[id][c]));
}

export const racePseudocode = [
  'race(A):',
  '  give every sort its own copy of A',
  '  t = 0',
  '  while some sort is unfinished:',
  '    t = t + 1',
  '    every unfinished sort makes comparison t',
  '      and the moves that follow it',
  '  rank the sorts by comparisons, then writes',
];

/**
 * Reads values typed as whole numbers separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format' | 'range' | 'count'}}
 */
export function parseValues(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length < MIN_N || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * An input of a given shape. Sorted, reversed and nearly sorted inputs use distinct values
 * spread from 5 to 95; few-unique draws from 1 to 4, so many keys repeat.
 * @param {Shape} shape
 * @param {number} n
 * @param {() => number} [rand]  Injectable for deterministic tests.
 * @returns {number[]}
 */
export function shapeValues(shape, n, rand = Math.random) {
  const ascending = Array.from({ length: n }, (_, i) =>
    n === 1 ? 50 : Math.round(5 + (90 * i) / (n - 1)),
  );
  switch (shape) {
    case 'sorted':
      return ascending;
    case 'reversed':
      return ascending.reverse();
    case 'nearly-sorted': {
      const a = ascending.slice();
      for (let k = 0; k < Math.max(1, Math.floor(n / 8)) && n > 1; k++) {
        const i = Math.floor(rand() * (n - 1));
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
      }
      return a;
    }
    case 'few-unique':
      return Array.from({ length: n }, () => 1 + Math.floor(rand() * 4));
    default: {
      const a = ascending.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
  }
}

/**
 * @typedef {object} SortEvent
 * @property {number[]} focus  Slots this comparison read, or (merge) the slot it filled.
 * @property {Card[]} items  The array after this comparison and the moves that follow it.
 * @property {number} writes  Writes so far, including those moves.
 */

/**
 * @typedef {object} SortRun
 * @property {SortId} id
 * @property {SortEvent[]} events  One per comparison.
 * @property {Card[]} items  The final array.
 * @property {number} comparisons
 * @property {number} writes
 * @property {number} depth  Deepest nesting of recursive calls that do work (0 for loops).
 * @property {number} buffer  Largest extra buffer, in cards (merge sort only).
 * @property {boolean | null} stable  Whether equal keys kept their input order; null when no key repeats.
 */

/** @param {Card[]} input */
function recorder(input) {
  const a = input.slice();
  /** @type {SortEvent[]} */
  const events = [];
  /** @type {number[] | null} */
  let pending = null;
  let writes = 0;
  let depth = 0;
  let peakDepth = 0;
  let buffer = 0;

  const flush = () => {
    if (pending) events.push({ focus: pending, items: a.slice(), writes });
    pending = null;
  };

  return {
    a,
    /** Compares two cards by key and returns the sign of x − y. @param {Card} x @param {Card} y @param {number[]} focus */
    cmp(x, y, focus) {
      flush();
      pending = focus.slice();
      return Math.sign(x.key - y.key);
    },
    /** @param {number} i @param {Card} card */
    write(i, card) {
      a[i] = card;
      writes++;
    },
    /** @param {number} i @param {number} j */
    swap(i, j) {
      if (i === j) return;
      [a[i], a[j]] = [a[j], a[i]];
      writes += 2;
    },
    /** Counts writes that the drawing shows as a swap: the insertion key sinking. @param {number} k */
    count(k) {
      writes += k;
    },
    enter() {
      depth++;
      peakDepth = Math.max(peakDepth, depth);
    },
    leave() {
      depth--;
    },
    /** @param {number} size */
    useBuffer(size) {
      buffer = Math.max(buffer, size);
    },
    /** @param {SortId} id @returns {SortRun} */
    finish(id) {
      flush();
      const groups = equalKeyOrder(a);
      return {
        id,
        events,
        items: a.slice(),
        comparisons: events.length,
        writes,
        depth: peakDepth,
        buffer,
        stable: groups.length === 0 ? null : groups.every((g) => g.kept),
      };
    },
  };
}

/** @typedef {ReturnType<typeof recorder>} Recorder */

/** @type {Record<SortId, (r: Recorder) => void>} */
const RUNNERS = {
  bubble(r) {
    const { a } = r;
    for (let end = a.length - 1; end >= 1; end--) {
      let swapped = false;
      for (let i = 0; i < end; i++) {
        if (r.cmp(a[i], a[i + 1], [i, i + 1]) > 0) {
          r.swap(i, i + 1);
          swapped = true;
        }
      }
      if (!swapped) break;
    }
  },
  insertion(r) {
    const { a } = r;
    for (let i = 1; i < a.length; i++) {
      let j = i - 1;
      // The key sits at j + 1 while it sinks; each shift writes one slot.
      while (j >= 0 && r.cmp(a[j], a[j + 1], [j, j + 1]) > 0) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        r.count(1);
        j--;
      }
      r.count(1);
    }
  },
  selection(r) {
    const { a } = r;
    for (let i = 0; i < a.length - 1; i++) {
      let min = i;
      for (let j = i + 1; j < a.length; j++) if (r.cmp(a[j], a[min], [j, min]) < 0) min = j;
      r.swap(i, min);
    }
  },
  merge(r) {
    const { a } = r;
    /** @param {number} lo @param {number} hi */
    const sort = (lo, hi) => {
      if (lo >= hi) return;
      r.enter();
      const mid = Math.floor((lo + hi) / 2);
      sort(lo, mid);
      sort(mid + 1, hi);
      const aux = a.slice(lo, hi + 1);
      r.useBuffer(aux.length);
      let i = lo;
      let j = mid + 1;
      let k = lo;
      while (i <= mid && j <= hi) {
        if (r.cmp(aux[j - lo], aux[i - lo], [k]) < 0) r.write(k++, aux[j++ - lo]);
        else r.write(k++, aux[i++ - lo]);
      }
      // Leftover right cards are already in place; leftover left cards are copied back.
      while (i <= mid) r.write(k++, aux[i++ - lo]);
      r.leave();
    };
    sort(0, a.length - 1);
  },
  quick(r) {
    const { a } = r;
    /** @param {number} lo @param {number} hi */
    const sort = (lo, hi) => {
      if (lo >= hi) return;
      r.enter();
      let i = lo;
      for (let j = lo; j < hi; j++) {
        if (r.cmp(a[j], a[hi], [j, hi]) <= 0) {
          r.swap(i, j);
          i++;
        }
      }
      r.swap(i, hi);
      sort(lo, i - 1);
      sort(i + 1, hi);
      r.leave();
    };
    sort(0, a.length - 1);
  },
  heap(r) {
    const { a } = r;
    /** @param {number} i @param {number} size */
    const siftDown = (i, size) => {
      for (;;) {
        const l = 2 * i + 1;
        if (l >= size) return;
        let c = l;
        if (l + 1 < size && r.cmp(a[l + 1], a[l], [l + 1, l]) > 0) c = l + 1;
        if (r.cmp(a[c], a[i], [c, i]) <= 0) return;
        r.swap(i, c);
        i = c;
      }
    };
    const n = a.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i, n);
    for (let end = n - 1; end >= 1; end--) {
      r.swap(0, end);
      siftDown(0, end);
    }
  },
};

/**
 * Runs one sort on its own copy of the cards.
 * @param {SortId} id
 * @param {Card[]} cards
 * @returns {SortRun}
 */
export function runSort(id, cards) {
  const r = recorder(cards);
  RUNNERS[id](r);
  return r.finish(id);
}

/**
 * @typedef {object} Lane
 * @property {SortId} id
 * @property {Card[]} items
 * @property {number[]} focus  Slots touched by this step’s comparison; empty when idle.
 * @property {number} comparisons  Comparisons so far.
 * @property {number} writes  Writes so far.
 * @property {boolean} done  This sort has finished.
 * @property {number} place  Finishing place (1 = first, ties share a place); 0 while running.
 */

/**
 * @typedef {object} RaceFrame
 * @property {'start' | 'tick' | 'done'} kind
 * @property {number} t  The race clock: comparisons each running sort has made.
 * @property {Lane[]} lanes  In SORTS order.
 * @property {SortId[]} finished  Sorts that finished on this step.
 * @property {number[]} lines
 */

/**
 * Finishing places: sorts with fewer comparisons finish earlier; equal counts share a place.
 * @param {SortRun[]} runs
 * @returns {Record<SortId, number>}
 */
function places(runs) {
  return /** @type {Record<SortId, number>} */ (
    Object.fromEntries(
      runs.map((r) => [r.id, 1 + runs.filter((o) => o.comparisons < r.comparisons).length]),
    )
  );
}

/**
 * The race on one input.
 * @param {number[]} values
 * @returns {RaceFrame[]}
 */
export function raceTrace(values) {
  const cards = toCards(values);
  const runs = SORTS.map((id) => runSort(id, cards));
  const place = places(runs);
  const end = Math.max(0, ...runs.map((r) => r.comparisons));
  /** @type {RaceFrame[]} */
  const frames = [];

  /** @param {SortRun} run @param {number} t @returns {Lane} */
  const laneAt = (run, t) => {
    if (t === 0)
      return {
        id: run.id,
        items: cards.slice(),
        focus: [],
        comparisons: 0,
        writes: 0,
        done: false,
        place: 0,
      };
    const done = t >= run.comparisons;
    const event = run.events[Math.min(t, run.comparisons) - 1];
    return {
      id: run.id,
      items: done ? run.items.slice() : event.items.slice(),
      focus: event && t <= run.comparisons ? event.focus.slice() : [],
      comparisons: Math.min(t, run.comparisons),
      writes: done ? run.writes : event.writes,
      done,
      place: done ? place[run.id] : 0,
    };
  };

  frames.push({
    kind: 'start',
    t: 0,
    lanes: runs.map((r) => laneAt(r, 0)),
    finished: [],
    lines: [0, 1, 2],
  });
  for (let t = 1; t <= end; t++) {
    frames.push({
      kind: 'tick',
      t,
      lanes: runs.map((r) => laneAt(r, t)),
      finished: runs.filter((r) => r.comparisons === t).map((r) => r.id),
      lines: [3, 4, 5, 6],
    });
  }
  frames.push({
    kind: 'done',
    t: end,
    lanes: runs.map((r) => ({ ...laneAt(r, end), focus: [] })),
    finished: [],
    lines: [3, 7],
  });
  return frames;
}

/**
 * Every sort’s totals on one input, ranked by comparisons, then writes.
 * @param {number[]} values
 */
export function raceResults(values) {
  const cards = toCards(values);
  const runs = SORTS.map((id) => runSort(id, cards));
  const place = places(runs);
  return runs
    .map(({ id, comparisons, writes, depth, buffer, stable }) => ({
      id,
      comparisons,
      writes,
      depth,
      buffer,
      stable,
      place: place[id],
    }))
    .sort((x, y) => x.comparisons - y.comparisons || x.writes - y.writes);
}
