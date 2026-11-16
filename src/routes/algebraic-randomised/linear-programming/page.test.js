// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  LP_PRESETS,
  MAX_COEF,
  MAX_CONSTRAINTS,
  MAX_RHS,
  simplexTrace,
} from '$lib/algo-engine/linear-programming.js';
import { fvalue } from '$lib/algo-engine/lup-decomposition.js';
import { en as m } from '$lib/lessons/linear-programming/copy.en.js';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body });
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

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));
const corners = () =>
  [...document.querySelectorAll('svg [data-point]')].map((g) => g.getAttribute('aria-label'));
const toLast = () => click(button('Last step'));
/** @param {number} times */
const next = (times) => {
  for (let i = 0; i < times; i++) click(button('Next step'));
};

describe('linear programming lesson', () => {
  it('walks the classic example from (0, 0) to the optimum (3, 1)', () => {
    render();
    expect(narration()).toContain('Maximise z = 3x + 2y');
    expect(corners()).toHaveLength(5);
    expect(corners()).toContain('Corner A (0, 0), current corner');
    next(1);
    expect(narration()).toContain('x has the largest positive reduced cost, 3');
    expect(document.querySelector('[data-testid="tableau"] thead')?.textContent).toContain('x ↓');
    next(1);
    expect(narration()).toContain('The smallest ratio is 3, in row 3, so s₃ leaves');
    expect(stat('row-2')).toContain('●');
    next(1);
    expect(narration()).toContain('Now at corner (3, 0) with z = 9');
    expect(stat('corner')).toBe('(3, 0)');
    toLast();
    expect(stat('z')).toBe('11');
    expect(stat('corner')).toBe('(3, 1)');
    expect(stat('pivots')).toBe('2');
    expect(stat('status')).toBe('optimal');
    expect(stat('dual')).toBe(
      m.dualValues(
        /** @type {any} */ (simplexTrace(LP_PRESETS.classic.c, LP_PRESETS.classic.cons).at(-1))
          .dual,
        { num: 11, den: 1 },
      ),
    );
    expect(corners()).toContain('Corner C (3, 1), optimal');
    expect(corners().filter((label) => label?.endsWith('visited'))).toHaveLength(2);
  });

  it('rebuilds from the objective, a coefficient and the presets', () => {
    render();
    commit(field('c1'), '1');
    toLast();
    // max x + 2y: (1.5, 2.5) gives 6.5, the best corner.
    expect(stat('z')).toBe('13/2');
    expect(stat('corner')).toBe('(3/2, 5/2)');
    commit(field('b-1'), '6');
    toLast();
    // x + 3y ≤ 6 now meets x + y ≤ 4 at (3, 1): z = 5.
    expect(stat('z')).toBe('5');
    commit(field('preset'), 'unbounded');
    toLast();
    expect(stat('status')).toBe('unbounded');
    expect(stat('dual')).toBe(m.dualNone);
    commit(field('c1'), '-3');
    toLast();
    expect(stat('status')).toBe('optimal');
    expect(stat('corner')).toBe('(0, 2)');
    commit(field('preset'), 'degenerate');
    next(2);
    expect(narration()).toContain('degenerate');
  });

  it('adds and removes constraints within the limits', () => {
    render();
    click(buttonByText(m.addConstraint));
    expect(document.querySelectorAll('[data-testid="constraint-list"] li')).toHaveLength(4);
    click(buttonByText(m.addConstraint));
    expect(narration()).toBe(m.tooMany(MAX_CONSTRAINTS));
    for (let i = 3; i >= 1; i--) click(button(m.removeConstraint(i)));
    expect(field('b-0').value).toBe('4');
    toLast();
    // Only x + y ≤ 4 is left: max 3x + 2y at (4, 0).
    expect(stat('corner')).toBe('(4, 0)');
    click(button(m.removeConstraint(0)));
    expect(narration()).toBe(m.tooFew);
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    commit(field('c2'), String(MAX_COEF + 1));
    expect(narration()).toBe(m.coefError(MAX_COEF));
    expect(field('c2').value).toBe('2');
    commit(field('b-0'), '-1');
    expect(narration()).toBe(m.rhsError(MAX_RHS));
    expect(field('b-0').value).toBe('4');
    commit(field('a1-2'), '');
    expect(narration()).toBe(m.coefError(MAX_COEF));
    expect(field('a1-2').value).toBe('1');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '11';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    const frames = simplexTrace(LP_PRESETS.classic.c, LP_PRESETS.classic.cons);
    const end = /** @type {import('$lib/algo-engine/linear-programming.js').LpFrame} */ (
      frames.at(-1)
    );
    expect(fvalue(end.z)).toBe(/** @type {any} */ (m.practice[0]).answer);
    const leave = frames.find((f) => f.kind === 'leave');
    expect(fvalue(/** @type {any} */ (leave?.ratios[leave.leaving]))).toBe(
      /** @type {any} */ (m.practice[1]).answer,
    );
    const degenerate = /** @type {any} */ (
      simplexTrace(LP_PRESETS.degenerate.c, LP_PRESETS.degenerate.cons).at(-1)
    );
    expect(fvalue(degenerate.z)).toBe(6);
    expect(degenerate.dual.map(fvalue)).toEqual([0.5, 1.5]);
  });
});
