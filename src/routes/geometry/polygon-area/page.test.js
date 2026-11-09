// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { POLYGON_PRESETS, polygonTrace, shoelaceSum } from '$lib/algo-engine/polygon-area.js';
import { en as m } from '$lib/lessons/polygon-area/copy.en.js';
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
const QUERY = 1000;

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

const vertices = () => document.querySelectorAll('[data-point]').length;

describe('polygon area and point in polygon lesson', () => {
  it('adds up the rectangle’s terms to its area', () => {
    render();
    click(button('Next step'));
    expect(text()).toContain('Edge 0 → 1: 2 · 1 − 8 · 1 = −6.');
    expect(cell('sum')).toBe('−6');
    click(button('Last step'));
    expect(cell('area')).toBe('30');
    expect(cell('sum')).toBe('60');
    expect(cell('direction')).toBe('Counter-clockwise');
    expect(document.querySelectorAll('[data-testid="edge-row"]')).toHaveLength(4);
  });

  it('reads the clockwise triangle as clockwise', () => {
    render();
    pick('clockwise');
    click(button('Last step'));
    expect(cell('sum')).toBe('−40');
    expect(cell('area')).toBe('20');
    expect(cell('direction')).toBe('Clockwise');
  });

  it('tests a point by ray casting', () => {
    render();
    pick('notch');
    method('ray');
    expect(point(QUERY)).toBeTruthy();
    click(button('Last step'));
    expect(cell('location')).toBe('Outside');
    expect(cell('count')).toBe('2');
    expect(text()).toContain('2 crossings in all, which is even');
  });

  it('counts a ray through a vertex once', () => {
    render();
    pick('throughVertex');
    method('ray');
    click(button('Last step'));
    expect(cell('count')).toBe('1');
    expect(cell('location')).toBe('Inside');
  });

  it('splits the two tests on the star and warns about the outline', () => {
    render();
    pick('star');
    expect(cell('self-crossing')).toBe(m.selfCrossing);
    method('ray');
    click(button('Last step'));
    expect(cell('location')).toBe('Outside');
    method('winding');
    click(button('Last step'));
    expect(cell('location')).toBe('Inside');
    expect(cell('count')).toBe('−2');
  });

  it('moves Q with Shift + arrow and locates it live', () => {
    render();
    method('ray');
    for (let i = 0; i < 2; i++) press(point(QUERY), 'ArrowDown', true);
    expect(cell('location')).toBe('On the boundary');
    press(point(QUERY), 'ArrowDown', true);
    expect(cell('location')).toBe('Outside');
  });

  it('moves a vertex and updates the area', () => {
    render();
    press(point(2), 'ArrowUp', true);
    // Vertex 2 from (8, 6) to (8, 7) adds a triangle of area 3.
    expect(cell('area')).toBe('33');
  });

  it('adds a vertex from the fields and removes it with Delete', async () => {
    render();
    expect(vertices()).toBe(4);
    commit(field('x'), '5');
    commit(field('y'), '8');
    click(buttonByText(m.addVertex));
    expect(vertices()).toBe(5);
    // A roof of height 2 on the top edge of width 6 adds area 6.
    expect(cell('area')).toBe('36');
    press(point(3), 'Delete');
    await Promise.resolve();
    expect(vertices()).toBe(4);
  });

  it('adds a vertex by pressing empty ground', () => {
    render();
    const svg = /** @type {SVGSVGElement} */ (document.querySelector('svg[role="group"]'));
    svg.getBoundingClientRect = () =>
      /** @type {DOMRect} */ ({ left: 0, top: 0, width: 532, height: 372 });
    const ground = /** @type {SVGElement} */ (
      document.querySelector('[data-testid="plane-ground"]')
    );
    // Canvas (226, 346) is grid (5, 0).
    ground.dispatchEvent(new MouseEvent('click', { clientX: 226, clientY: 346, bubbles: true }));
    flushSync();
    expect(vertices()).toBe(5);
    expect(point(1).getAttribute('aria-label')).toContain('(5, 0)');
  });

  it('refuses a bad coordinate and keeps the polygon', () => {
    render();
    commit(field('x'), '99');
    expect(text()).toContain(m.coordError(12, 8));
    click(buttonByText(m.addVertex));
    expect(vertices()).toBe(4);
    expect(field('x').value).toBe('6');
  });

  it('refuses a vertex on top of another', () => {
    render();
    commit(field('x'), '2');
    commit(field('y'), '1');
    click(buttonByText(m.addVertex));
    expect(text()).toContain(m.occupiedError);
    expect(vertices()).toBe(4);
  });

  it('refuses to shrink below a triangle, and to remove with nothing selected', () => {
    render();
    click(buttonByText(m.removeVertex));
    expect(text()).toContain(m.selectFirst);
    pick('clockwise');
    press(point(0), 'Delete');
    expect(text()).toContain(m.minError(3));
    expect(vertices()).toBe(3);
  });

  it('removes the vertex selected with Enter', () => {
    render();
    press(point(1), 'Enter');
    expect(point(1).getAttribute('aria-pressed')).toBe('true');
    click(buttonByText(m.removeVertex));
    expect(vertices()).toBe(3);
  });

  it('keeps its stored answers true to the engine', () => {
    const answer = (/** @type {number} */ i) => /** @type {any} */ (m.practice[i]).answer;
    expect(
      Math.abs(
        shoelaceSum([
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 3 },
          { x: 0, y: 3 },
        ]),
      ) / 2,
    ).toBe(answer(0));
    expect(shoelaceSum(POLYGON_PRESETS.clockwise.polygon)).toBe(answer(1));
    expect(
      polygonTrace('ray', POLYGON_PRESETS.lShape.polygon, { x: 0, y: 5 }).at(-1)?.crossings,
    ).toBe(answer(3));
  });

  it('matches the worked example', () => {
    const triangle = [
      { x: 1, y: 1 },
      { x: 5, y: 1 },
      { x: 3, y: 4 },
    ];
    const f = polygonTrace('shoelace', triangle, { x: 0, y: 0 }).at(-1);
    expect(f?.rows.map((r) => r.value)).toEqual([-4, 17, -1]);
    expect(f?.area).toBe(6);
    const ray = polygonTrace('ray', triangle, { x: 3, y: 2 }).at(-1);
    expect(ray?.crossings).toBe(1);
    expect(ray?.hits[0].x).toBeCloseTo(13 / 3);
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
    answer('24');
    expect(q.textContent).toContain('Not quite');
    click(
      /** @type {HTMLButtonElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Show a hint')
      ),
    );
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer('12');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
