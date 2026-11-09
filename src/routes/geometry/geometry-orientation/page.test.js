// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { cross, dot, orient, sub } from '$lib/algo-engine/geometry-orientation.js';
import { en as m } from '$lib/lessons/geometry-orientation/copy.en.js';
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

describe('points, vectors and orientation lesson', () => {
  it('starts with the question and no verdict', () => {
    render();
    expect(text()).toContain('Going from a to b, where is c?');
    expect(cell('turn')).toBe(m.pending);
  });

  it('steps to the worked example’s numbers', () => {
    render();
    click(button('Last step'));
    expect(cell('cross')).toBe('18');
    expect(cell('dot')).toBe('13');
    expect(cell('area')).toBe('9');
    expect(cell('turn')).toBe('Left turn');
    expect(cell('angle')).toBe(m.angles.acute);
  });

  it('narrates each product while stepping', () => {
    render();
    click(button('Next step'));
    expect(text()).toContain('u = b − a = (4, 1)');
    click(button('Next step'));
    expect(text()).toContain('v = c − a = (2, 5)');
    click(button('Next step'));
    expect(text()).toContain('Dot = u.x · v.x + u.y · v.y = 13');
  });

  it('flips the turn when a preset changes the points', () => {
    render();
    pick('right');
    expect(cell('turn')).toBe(m.pending);
    click(button('Last step'));
    expect(cell('turn')).toBe('Right turn');
    pick('collinear');
    click(button('Last step'));
    expect(cell('turn')).toBe('Collinear');
    expect(cell('area')).toBe('0');
  });

  it('shows floats disagreeing with the exact answer on the float trap', () => {
    render();
    pick('floatTrap');
    click(button('Last step'));
    expect(cell('turn')).toBe('Collinear');
    expect(cell('float-row')).toContain('Right turn');
    expect(cell('epsilon-row')).toBe('Collinear');
    expect(cell('float-verdict')).toBe(m.precisionWrong);
  });

  it('moves a point with Shift + arrow and shows the live verdict', () => {
    render();
    // C from (3, 6) straight down to (3, 1) leaves c below the line a → b.
    for (let i = 0; i < 5; i++) press(point(2), 'ArrowDown', true);
    expect(point(2).getAttribute('aria-label')).toContain('(3, 1)');
    expect(cell('turn')).toBe('Right turn');
    expect(cell('cross')).toBe('−2');
  });

  it('roves between the points with plain arrows', async () => {
    render();
    point(0).focus();
    press(point(0), 'ArrowRight');
    await Promise.resolve();
    expect(document.activeElement).toBe(point(1));
    expect(point(1).getAttribute('tabindex')).toBe('0');
    expect(point(0).getAttribute('tabindex')).toBe('-1');
  });

  it('stops a point at the edge of the plane', () => {
    render();
    press(point(0), 'ArrowLeft', true);
    press(point(0), 'ArrowLeft', true);
    expect(point(0).getAttribute('aria-label')).toContain('(0, 1)');
  });

  it('drags a point with the pointer, snapping to the grid', () => {
    render();
    const svg = /** @type {SVGSVGElement} */ (document.querySelector('svg[role="group"]'));
    // A 532 by 372 drawing laid out at its own size: one canvas unit is one pixel.
    svg.getBoundingClientRect = () =>
      /** @type {DOMRect} */ ({ left: 0, top: 0, width: 532, height: 372 });
    /** @param {EventTarget} el @param {string} type @param {number} x @param {number} y */
    const fire = (el, type, x, y) => {
      el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true }));
      flushSync();
    };
    fire(point(2), 'pointerdown', 146, 106);
    // Canvas (266, 306) is grid (6, 1), with x = 26 + 6·40 and y = 26 + 7·40.
    fire(svg, 'pointermove', 268, 303);
    fire(svg, 'pointerup', 268, 303);
    expect(point(2).getAttribute('aria-label')).toContain('(6, 1)');
    // u = (4, 1) and v = (5, 0).
    expect(cell('cross')).toBe('−5');
    expect(cell('turn')).toBe('Right turn');
  });

  it('keeps its stored answers true to the engine', () => {
    const [q1, , q3, q4] = m.practice;
    expect(orient({ x: 0, y: 0 }, { x: 4, y: 1 }, { x: 1, y: 3 })).toBe(
      /** @type {{answer: number}} */ (q1).answer,
    );
    expect(cross({ x: 4, y: 0 }, { x: 4, y: -2 })).toBeLessThan(0);
    expect(dot({ x: 3, y: 4 }, { x: 4, y: -3 })).toBe(/** @type {{answer: number}} */ (q3).answer);
    const a = { x: 1, y: 1 };
    expect(Math.abs(cross(sub({ x: 5, y: 1 }, a), sub({ x: 2, y: 4 }, a))) / 2).toBe(
      /** @type {{answer: number}} */ (q4).answer,
    );
  });

  it('checks a right and a wrong answer, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[0]);
    const field = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    /** @param {string} value */
    const answer = (value) => {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer('7');
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer('11');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
