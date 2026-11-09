// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { orient } from '$lib/algo-engine/geometry-orientation.js';
import { hullTrace } from '$lib/algo-engine/convex-hull.js';
import { en as m } from '$lib/lessons/convex-hull/copy.en.js';
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

/** @param {string} value */
function pick(value) {
  const select = /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} value */
function method(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="method"][value="${value}"]`)
  );
  radio.checked = true;
  radio.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {number} id */
const point = (id) => /** @type {SVGElement} */ (document.querySelector(`[data-point="${id}"]`));

/** @param {SVGElement} el @param {string} key @param {boolean} [shiftKey] */
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

describe('convex hull lesson', () => {
  it('walks Graham scan from the pivot to the finished hull', () => {
    render();
    expect(text()).toContain('12 points to wrap.');
    click(button('Next step'));
    expect(text()).toContain('The pivot is B');
    click(button('Next step'));
    expect(text()).toContain('Sort the rest by angle');
    click(button('Last step'));
    expect(cell('hull')).toBe('7');
    expect(text()).toContain('counter-clockwise');
  });

  it('reaches a pop and narrates it', () => {
    render();
    const narration = () => document.querySelector('p[aria-live]')?.textContent ?? '';
    for (let i = 0; i < 60 && !narration().startsWith('Pop '); i++) click(button('Next step'));
    expect(narration()).toMatch(/^Pop [A-L]\. It lies inside or on the hull\.$/);
    expect(Number(cell('pops'))).toBeGreaterThan(0);
  });

  it('finds the same hull with the monotone chain in two passes', () => {
    render();
    method('monotone');
    click(button('Next step'));
    expect(text()).toContain('Sort the points by x');
    click(button('Next step'));
    expect(text()).toContain('First pass, left to right');
    click(button('Last step'));
    expect(cell('hull')).toBe('7');
  });

  it('compares the two algorithms on the same points', () => {
    render();
    const row = (/** @type {string} */ key) =>
      [
        ...(document.querySelector(`[data-testid="compare-${key}"]`)?.querySelectorAll('td') ?? []),
      ].map((td) => td.textContent?.trim());
    click(button('Last step'));
    expect(row('graham')[0]).toBe(cell('tests'));
    method('monotone');
    click(button('Last step'));
    expect(row('monotone')[0]).toBe(cell('tests'));
  });

  it('pops nothing when every point is a corner', () => {
    render();
    pick('allOnHull');
    click(button('Last step'));
    expect(cell('hull')).toBe('10');
    expect(cell('pops')).toBe('0');
  });

  it('keeps two ends of a line', () => {
    render();
    pick('line');
    click(button('Last step'));
    expect(cell('hull')).toBe('2');
  });

  it('updates the hull live when a corner moves', () => {
    render();
    pick('square');
    click(button('Last step'));
    expect(cell('hull')).toBe('4');
    // The inner point I at (5, 4) goes out past the left edge to become a fifth corner.
    for (let i = 0; i < 5; i++) press(point(6), 'ArrowLeft', true);
    expect(point(6).getAttribute('aria-label')).toContain('(0, 4)');
    expect(cell('hull')).toBe('5');
  });

  it('refuses to move a point onto another', () => {
    render();
    pick('square');
    // Point 4 at (6, 1) moves along the edge onto nothing; point 7 at (7, 3) up to (7, 4), then left.
    press(point(6), 'ArrowRight', true);
    expect(point(6).getAttribute('aria-label')).toContain('(6, 4)');
    press(point(7), 'ArrowUp', true);
    press(point(7), 'ArrowLeft', true);
    expect(text()).toContain(m.occupiedError);
    expect(point(7).getAttribute('aria-label')).toContain('(7, 4)');
  });

  it('adds a point from the fields and removes it with Delete', async () => {
    render();
    commit(field('x'), '6');
    commit(field('y'), '0');
    click(buttonByText(m.addPoint));
    expect(cell('count')).toBe('13');
    expect(cell('hull')).not.toBe(m.pending);
    press(point(12), 'Delete');
    await Promise.resolve();
    expect(cell('count')).toBe('12');
  });

  it('adds a point by pressing empty ground', () => {
    render();
    const svg = /** @type {SVGSVGElement} */ (document.querySelector('svg[role="group"]'));
    svg.getBoundingClientRect = () =>
      /** @type {DOMRect} */ ({ left: 0, top: 0, width: 532, height: 372 });
    const ground = /** @type {SVGElement} */ (
      document.querySelector('[data-testid="plane-ground"]')
    );
    ground.dispatchEvent(new MouseEvent('click', { clientX: 26, clientY: 26, bubbles: true }));
    flushSync();
    expect(cell('count')).toBe('13');
    expect(point(12).getAttribute('aria-label')).toContain('(0, 8)');
  });

  it('refuses a bad coordinate and an occupied spot', () => {
    render();
    commit(field('y'), '50');
    expect(text()).toContain(m.coordError(12, 8));
    expect(field('y').value).toBe('0');
    commit(field('x'), '1');
    commit(field('y'), '2');
    click(buttonByText(m.addPoint));
    expect(text()).toContain(m.occupiedError);
    expect(cell('count')).toBe('12');
  });

  it('needs a selection to remove, and keeps at least one point', () => {
    render();
    click(buttonByText(m.removePoint));
    expect(text()).toContain(m.selectFirst);
    press(point(0), 'Enter');
    click(buttonByText(m.removePoint));
    expect(cell('count')).toBe('11');
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
    expect(cell('count')).toBe('14');
  });

  it('keeps its stored answers true to the engine', () => {
    /** @param {[number, number][]} coords */
    const hullOf = (coords) =>
      hullTrace(
        'graham',
        coords.map(([x, y], id) => ({ id, x, y })),
      ).at(-1);
    expect(
      hullOf([
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
        [2, 2],
        [2, 0],
      ])?.hull?.length,
    ).toBe(/** @type {any} */ (m.practice[0]).answer);
    expect(
      hullOf([
        [0, 0],
        [4, 0],
        [4, 1],
        [5, 3],
      ])?.pops,
    ).toBe(/** @type {any} */ (m.practice[1]).answer);
  });

  it('matches the worked example’s orientation values', () => {
    const [a, b, c, d] = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 1 },
      { x: 5, y: 3 },
    ];
    expect(orient(a, b, c)).toBe(4);
    expect(orient(b, c, d)).toBe(-1);
    expect(orient(a, b, d)).toBe(12);
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
    answer('6');
    expect(q.textContent).toContain('Not quite');
    click(
      /** @type {HTMLButtonElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Show a hint')
      ),
    );
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer('4');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
