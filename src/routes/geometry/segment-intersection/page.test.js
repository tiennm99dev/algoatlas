// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { orient } from '$lib/algo-engine/geometry-orientation.js';
import { segmentTrace } from '$lib/algo-engine/segment-intersection.js';
import { en as m } from '$lib/lessons/segment-intersection/copy.en.js';
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

/** @param {number} id */
const point = (id) => /** @type {SVGElement} */ (document.querySelector(`[data-point="${id}"]`));

/** @param {SVGElement} el @param {string} key @param {boolean} [shiftKey] */
function press(el, key, shiftKey = false) {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
  );
  flushSync();
}

const redLines = () =>
  document.querySelectorAll('svg line.stroke-state-swap[stroke-width="4"]').length;

describe('segment intersection lesson', () => {
  it('ends the crossing preset with a red pair and an exact t', () => {
    render();
    expect(redLines()).toBe(0);
    click(button('Last step'));
    expect(cell('verdict')).toBe('Proper crossing');
    expect(cell('tests')).toBe('4');
    expect(redLines()).toBe(2);
    expect(cell('t')).toBe('7 / 13');
    expect(cell('where')).toBe('(≈ 5.31, ≈ 3.69)');
  });

  it('fills o1 to o4 one step at a time', () => {
    render();
    click(button('Next step'));
    expect(text()).toContain('o1 =');
    const rows = () =>
      [...document.querySelectorAll('[data-testid="orient-row"]')].map((r) =>
        r.querySelectorAll('td')[0].textContent?.trim(),
      );
    expect(rows().filter((v) => v !== m.pending)).toHaveLength(1);
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(rows().filter((v) => v !== m.pending)).toHaveLength(4);
  });

  it.each([
    ['tee', 'They touch', '(5, 2)'],
    ['overlap', 'They overlap', '(3, 2) to (7, 4)'],
    ['endToEnd', 'They touch', '(5, 3)'],
    ['gap', 'No intersection', '—'],
    ['parallel', 'No intersection', '—'],
    ['lineOnly', 'No intersection', '—'],
  ])('reads preset %s as %s at %s', (preset, verdict, where) => {
    render();
    pick(preset);
    click(button('Last step'));
    expect(cell('verdict')).toBe(verdict);
    expect(cell('where')).toBe(where);
  });

  it('keeps the pair grey when they miss', () => {
    render();
    pick('gap');
    click(button('Last step'));
    expect(redLines()).toBe(0);
    expect(cell('boxes')).toBe('4');
  });

  it('turns red live when a drag makes the segments meet', () => {
    render();
    pick('lineOnly');
    // B from (5, 3) to (9, 3) takes it past the line x = 8.
    for (let i = 0; i < 4; i++) press(point(1), 'ArrowRight', true);
    expect(cell('verdict')).toBe('Proper crossing');
    expect(redLines()).toBe(2);
    expect(cell('where')).toContain('8');
  });

  it('turns back when it leaves again', () => {
    render();
    for (let i = 0; i < 8; i++) press(point(3), 'ArrowUp', true);
    expect(cell('verdict')).toBe('No intersection');
    expect(redLines()).toBe(0);
    expect(cell('where')).toBe('—');
  });

  it('keeps its stored answers true to the engine', () => {
    const f = segmentTrace({ x: 0, y: 0 }, { x: 6, y: 3 }, { x: 0, y: 3 }, { x: 6, y: 0 }).at(-1);
    expect(f?.point?.y).toBe(/** @type {any} */ (m.practice[0]).answer);
    const base = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
    ];
    const hits = [
      [
        { x: 2, y: 0 },
        { x: 2, y: 3 },
      ],
      [
        { x: 5, y: 0 },
        { x: 8, y: 0 },
      ],
      [
        { x: 1, y: 1 },
        { x: 3, y: 1 },
      ],
      [
        { x: 4, y: 0 },
        { x: 6, y: 2 },
      ],
    ].flatMap(([c, d], i) =>
      segmentTrace(base[0], base[1], c, d).at(-1)?.outcome !== 'none' ? [i] : [],
    );
    expect(hits).toEqual(/** @type {any} */ (m.practice[1]).answers);
    const [a, b, c, d] = [
      { x: 1, y: 1 },
      { x: 5, y: 3 },
      { x: 8, y: 1 },
      { x: 8, y: 7 },
    ];
    expect(Math.sign(orient(a, b, c)) * Math.sign(orient(a, b, d))).toBe(-1);
    expect(Math.sign(orient(c, d, a)) * Math.sign(orient(c, d, b))).toBe(1);
    const lap = segmentTrace({ x: 1, y: 1 }, { x: 7, y: 4 }, { x: 3, y: 2 }, { x: 11, y: 6 }).at(
      -1,
    );
    expect(lap?.shared?.[1].x).toBe(/** @type {any} */ (m.practice[3]).answer);
  });

  it('matches the worked example step by step', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 6, y: 3 };
    const c = { x: 0, y: 3 };
    const d = { x: 6, y: 0 };
    const f = segmentTrace(a, b, c, d).at(-1);
    expect(f?.o).toEqual([-18, 18, 18, -18]);
    expect(f?.t).toEqual({ num: 1, den: 2 });
    expect(m.workedSteps[0]).toContain('o1 = orient(c, d, a) = −18');
    expect(m.workedSteps[0]).toContain('o2 = orient(c, d, b) = 18');
    expect(m.workedSteps[1]).toContain('o3 = orient(a, b, c) = 18');
    expect(m.workedSteps[1]).toContain('o4 = orient(a, b, d) = −18');
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
    answer('2');
    expect(q.textContent).toContain('Not quite');
    click(
      /** @type {HTMLButtonElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Show a hint')
      ),
    );
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer('1.5');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
