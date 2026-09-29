// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import SortPage from './sorting/bubble-insertion-sort/+page.svelte';
import BinaryPage from './searching/binary-search/+page.svelte';
import BfsPage from './graphs/bfs-grid/+page.svelte';
import { load } from './[topic]/+page.js';
import { lessonPath, lessons } from '$lib/lessons/registry.js';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {import('svelte').Component<any>} Page */
function render(Page) {
  app = mount(Page, { target: document.body });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** Keyboard activation reports detail 0, which the BFS grid treats as an edit. */
/** @param {HTMLElement} el */
function keyActivate(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
  flushSync();
}

/** @param {HTMLElement} target @param {KeyboardEventInit} init */
function key(target, init) {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  flushSync();
}

const text = () => document.body.textContent ?? '';

describe('sorting lesson', () => {
  it('steps forward through the trace', () => {
    render(SortPage);
    expect(text()).toMatch(/Step 1 of \d+/);
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('42 > 17: out of order.');
  });

  it('switching algorithm reloads the pseudocode and trace', () => {
    render(SortPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="insertion"]')));
    expect(text()).toContain('key = a[i]; j = i - 1');
    expect(text()).toMatch(/Step 1 of \d+/);
  });

  it('shows both algorithms’ totals for the current array', () => {
    render(SortPage);
    expect(text()).toContain('Total cost on this array');
    expect(text()).toMatch(/Bubble sort\s*\d+ comparisons · \d+ swaps/);
    expect(text()).toMatch(/Insertion sort\s*\d+ comparisons · \d+ shifts/);
  });

  it('describes the values in the chart label', () => {
    render(SortPage);
    const chart = document.querySelector('[role="img"]');
    expect(chart?.getAttribute('aria-label')).toContain('Array: 42, 17, 88');
  });

  it('keeps arrow shortcuts working after a button was clicked', () => {
    render(SortPage);
    const next = button('Next step');
    click(next);
    key(next, { key: 'ArrowRight' });
    expect(text()).toMatch(/Step 3 of \d+/);
  });

  it('leaves modified arrows to the browser', () => {
    render(SortPage);
    click(button('Next step'));
    key(document.body, { key: 'ArrowLeft', altKey: true });
    expect(text()).toMatch(/Step 2 of \d+/);
  });

  it('stops autoplay when the lesson unmounts', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(SortPage);
    click(buttonByText('Play'));
    if (app) unmount(app);
    app = null;
    // A leaked player keeps rescheduling its tick; a stopped one schedules nothing.
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    vi.advanceTimersByTime(10_000);
    expect(schedule).not.toHaveBeenCalled();
  });
});

describe('binary search lesson', () => {
  it('watch mode reaches the target', () => {
    render(BinaryPage);
    click(button('Last step'));
    expect(text()).toContain('a[11] = 53. Found it after');
  });

  it('ignores a target the learner is still typing', () => {
    render(BinaryPage);
    click(button('Last step'));
    const input = /** @type {HTMLInputElement} */ (document.querySelector('input[type="number"]'));
    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    expect(text()).toContain('a[11] = 53. Found it after');
    expect(text()).not.toContain('< 5');
  });

  it('keeps the last target when the field is cleared', () => {
    render(BinaryPage);
    const input = /** @type {HTMLInputElement} */ (document.querySelector('input[type="number"]'));
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    expect(text()).toContain('Looking for 53');
    expect(text()).not.toContain('null');
  });

  it('you-drive mode rules out cells and detects a hit', () => {
    render(BinaryPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="drive"]')));
    click(button('Index 7, value 31'));
    expect(text()).toContain('31 < 53: everything left of here is ruled out.');
    expect(button('Index 3, value 14, ruled out').disabled).toBe(true);
    click(button('Index 11, value 53'));
    expect(text()).toMatch(/Found in 2 probes/);
  });
});

describe('bfs lesson', () => {
  it('finds the shortest path on the default grid', () => {
    render(BfsPage);
    click(button('Last step'));
    expect(text()).toMatch(/shortest path of \d+ steps/);
  });

  it('keyboard activation toggles a wall and rebuilds the trace', () => {
    render(BfsPage);
    keyActivate(button('Row 0, column 0'));
    expect(button('Row 0, column 0, Wall')).toBeTruthy();
    expect(text()).toMatch(/Step 1 of \d+/);
  });

  it('announces distances in cell labels', () => {
    render(BfsPage);
    click(button('Last step'));
    expect(button('Row 4, column 2, Start, distance 0')).toBeTruthy();
  });

  it('explains why a start move onto a wall is refused', () => {
    render(BfsPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="start"]')));
    keyActivate(button('Row 0, column 6, Wall'));
    expect(text()).toContain('Pick an open cell');
  });

  it('reports no path when the goal is walled in', () => {
    render(BfsPage);
    // Goal sits at row 5, column 13; seal its four neighbors.
    for (const [r, c] of [[4, 13], [6, 13], [5, 12], [5, 14]]) {
      keyActivate(button(`Row ${r}, column ${c}`));
    }
    click(button('Last step'));
    expect(text()).toContain('walls cut it off');
  });
});

describe('routing', () => {
  it('rejects prototype keys as topics', () => {
    const run = (/** @type {string} */ topic) =>
      load(/** @type {any} */ ({ params: { topic } }));
    expect(() => run('constructor')).toThrow();
    expect(run('sorting')).toEqual({ topic: 'sorting' });
  });

  it('every registered lesson has a route', () => {
    const routeFiles = import.meta.glob('./**/+page.svelte');
    for (const lesson of lessons) {
      expect(Object.keys(routeFiles)).toContain(`.${lessonPath(lesson)}+page.svelte`);
    }
  });
});
