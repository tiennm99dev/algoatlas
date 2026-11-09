// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { RANGE_PRESETS, rangeTreeTrace } from '$lib/algo-engine/range-trees.js';
import { en as m } from '$lib/lessons/range-trees/copy.en.js';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button with text ${label}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {string} id */
const cell = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';

/** @param {string} value */
function pick(value) {
  const select = /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {number} id */
const point = (id) => /** @type {SVGElement} */ (document.querySelector(`[data-point="${id}"]`));

/** @param {Element} el @param {string} key @param {boolean} [shiftKey] */
function press(el, key, shiftKey = false) {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
  );
  flushSync();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

describe('range trees lesson', () => {
  it('walks the scattered query from the split node to the answer', () => {
    render();
    expect(narration()).toBe('13 points. Find those in [3, 10] × [2, 6].');
    click(button('Next step'));
    expect(narration()).toContain('The tree is built once');
    expect(cell('storage')).toBe('41');
    click(button('Next step'));
    expect(narration()).toContain('This is the split node.');
    expect(document.querySelector('[data-testid="list-idle"]')).not.toBeNull();
    click(button('Last step'));
    expect(cell('reported')).toBe('5');
    expect(cell('visited')).toBe('7');
    expect(cell('searches')).toBe('2');
    expect(cell('brute')).toBe('13');
    expect(narration()).toContain('Done: 5 points found');
  });

  it('shows the binary search window over a canonical subtree’s y-list', () => {
    render();
    for (let i = 0; i < 30 && !narration().startsWith('Every point under'); i++)
      click(button('Next step'));
    expect(narration()).toContain('Every point under F has x in range');
    expect(text()).toContain(m.listTitle('F'));
    expect(text()).toContain(m.listWindow);
  });

  it('marks the split node and canonical roots in the tree', () => {
    render();
    click(button('Last step'));
    const tree = /** @type {Element} */ (document.querySelector(`[aria-label="${m.treeLabel}"]`));
    const labels = [...tree.querySelectorAll('title')].map((e) => e.textContent);
    expect(labels.some((l) => l?.startsWith('Node M at (6, 8)') && l.includes('split node'))).toBe(
      true,
    );
    expect(labels.some((l) => l?.startsWith('Node F') && l.includes('canonical'))).toBe(true);
  });

  it('ends early when no x lies in the range', () => {
    render();
    pick('empty');
    click(button('Last step'));
    expect(cell('reported')).toBe('0');
    click(button('Previous step'));
    expect(narration()).toContain('The search fell off the tree');
  });

  it('handles points that share an x', () => {
    render();
    pick('column');
    click(button('Last step'));
    expect(cell('reported')).toBe('2');
  });

  it('re-runs the query when a bound is typed, and refuses a bad one', () => {
    render();
    commit(field('y2'), '8');
    expect(cell('reported')).toBe('8');
    commit(field('x1'), '11');
    expect(text()).toContain(m.queryError(12, 8));
    expect(field('x1').value).toBe('3');
    commit(field('x1'), '');
    expect(field('x1').value).toBe('3');
  });

  it('moves a rectangle corner with Shift + arrow and swaps the bounds past the other one', () => {
    render();
    // Corner 1 at (3, 2) moves left to (2, 2): x1 = 2 adds B (2, 2).
    press(point(-1), 'ArrowLeft', true);
    expect(field('x1').value).toBe('2');
    expect(cell('reported')).toBe('6');
    // Corner 2 at (10, 6) drops below corner 1: the bounds stay ordered.
    for (let i = 0; i < 6; i++) press(point(-2), 'ArrowDown', true);
    expect(field('y1').value).toBe('0');
    expect(field('y2').value).toBe('2');
    expect(cell('reported')).toBe('3');
  });

  it('refuses to remove a corner and to move a point onto another', () => {
    render();
    press(point(-1), 'Delete');
    expect(text()).toContain(m.cornerError);
    // D (4, 4) moves up to (4, 5), right to (5, 5), then right again onto F at (6, 5).
    press(point(3), 'ArrowUp', true);
    press(point(3), 'ArrowRight', true);
    press(point(3), 'ArrowRight', true);
    expect(text()).toContain(m.occupiedError);
    expect(point(3).getAttribute('aria-label')).toContain('(5, 5)');
  });

  it('adds a point from the fields and removes the selected one', () => {
    render();
    commit(field('x'), '5');
    commit(field('y'), '4');
    click(buttonByText(m.addPoint));
    expect(cell('brute')).toBe('14');
    expect(cell('reported')).toBe('6');
    press(point(13), 'Enter');
    click(buttonByText(m.removePoint));
    expect(cell('brute')).toBe('13');
    click(buttonByText(m.removePoint));
    expect(text()).toContain(m.selectFirst);
  });

  it('refuses a bad coordinate', () => {
    render();
    commit(field('y'), '50');
    expect(text()).toContain(m.coordError(12, 8));
    expect(field('y').value).toBe('4');
  });

  it('loads a random cloud on the button', () => {
    render();
    vi.spyOn(Math, 'random').mockImplementation(
      (() => {
        let s = 3;
        return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
      })(),
    );
    click(buttonByText(m.random));
    expect(cell('brute')).toBe('12');
  });

  it('keeps its stored answers true to the engine', () => {
    const { points, query } = RANGE_PRESETS.scatter;
    const last = rangeTreeTrace(points, query).at(-1);
    expect(last?.reported.length).toBe(/** @type {any} */ (m.practice[0]).answer);
    const full = Array.from({ length: 15 }, (_, id) => ({ id, x: id, y: (id * 5) % 9 }));
    expect(rangeTreeTrace(full, query)[0].storage).toBe(/** @type {any} */ (m.practice[1]).answer);
  });

  it('checks a right and a wrong answer, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[0]);
    const input = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    /** @param {string} value */
    const answer = (value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer('8');
    expect(q.textContent).toContain('Not quite');
    click(
      /** @type {HTMLButtonElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Show a hint')
      ),
    );
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer('5');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
