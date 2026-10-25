/**
 * The shared state palette as SVG and HTML classes, so every visualizer colours a state the
 * same way and keeps text readable on it. Class names are written out in full so Tailwind
 * finds them in this file.
 *
 * `active` is the element acted on now, `frontier` queued or pending work, `visited` finished
 * but not final, `sorted` final or found, `compare` and `swap` a read and a write, `path` the
 * answer path. `''` is the plain resting state.
 * @typedef {'' | 'compare' | 'swap' | 'sorted' | 'active' | 'frontier' | 'visited' | 'path'} VisualState
 */

/** @type {Record<VisualState, string>} */
export const STATE_FILL = {
  '': 'fill-white',
  compare: 'fill-state-compare',
  swap: 'fill-state-swap',
  sorted: 'fill-state-sorted',
  active: 'fill-state-active',
  frontier: 'fill-state-frontier',
  visited: 'fill-state-visited',
  path: 'fill-state-path',
};

/** @type {Record<VisualState, string>} */
export const STATE_BG = {
  '': 'bg-white',
  compare: 'bg-state-compare',
  swap: 'bg-state-swap',
  sorted: 'bg-state-sorted',
  active: 'bg-state-active',
  frontier: 'bg-state-frontier',
  visited: 'bg-state-visited',
  path: 'bg-state-path',
};

/** Text on each fill, chosen to reach 4.5:1. @type {Record<VisualState, string>} */
export const STATE_TEXT = {
  '': 'fill-slate-900',
  compare: 'fill-slate-900',
  swap: 'fill-white',
  sorted: 'fill-white',
  active: 'fill-white',
  frontier: 'fill-slate-900',
  visited: 'fill-slate-900',
  path: 'fill-slate-900',
};

/** Outline for a shape in each state: resting shapes get a light edge, marked ones a dark one. */
/** @param {VisualState} state */
export function stateStroke(state) {
  return state === '' ? 'stroke-slate-400' : 'stroke-slate-900';
}

/**
 * Moves a roving focus index by a key press over `n` items in a row: arrows step, Home and
 * End jump. Returns null for keys the row does not handle.
 * @param {string} key
 * @param {number} at
 * @param {number} n
 * @returns {number | null}
 */
export function rovingStep(key, at, n) {
  if (n === 0) return null;
  if (key === 'ArrowRight' || key === 'ArrowDown') return Math.min(n - 1, at + 1);
  if (key === 'ArrowLeft' || key === 'ArrowUp') return Math.max(0, at - 1);
  if (key === 'Home') return 0;
  if (key === 'End') return n - 1;
  return null;
}
