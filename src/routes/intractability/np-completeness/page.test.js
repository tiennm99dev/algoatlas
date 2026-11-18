// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/np-completeness/copy.en.js';
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

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));

describe('NP-completeness lesson', () => {
  it('shows a problem from the map by pointer and keyboard', () => {
    render();
    expect(byTest('problem-card')).toContain(m.problems.vertexCover.why);
    click(/** @type {Element} */ (document.querySelector('[data-problem="sat"]')));
    expect(byTest('problem-card')).toContain('Cook 1971');
    const tsp = /** @type {Element} */ (document.querySelector('[data-problem="tsp"]'));
    tsp.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(byTest('problem-card')).toContain(m.problems.tsp.why);
    expect(tsp.getAttribute('aria-pressed')).toBe('true');
  });

  it('builds the gadget and covers it with a satisfying assignment', () => {
    render();
    expect(narration()).toContain('φ has n = 3 variables and m = 3 clauses');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Variable a: add vertices a and ¬a');
    expect(byTest('vertices')).toBe('2');
    click(button('Đến bước cuối'));
    expect(byTest('vertices')).toBe('15');
    expect(byTest('edges')).toBe('21');
    expect(byTest('k')).toBe('9');
    expect(byTest('cover')).toBe('9');
    expect(byTest('result')).toBe('covered: φ is satisfied');
  });

  it('an assignment that misses leaves an edge uncovered, and a flip fixes it', () => {
    render();
    commit(field('select[name="preset"]'), 'missed');
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(narration()).toContain('1 edge is not covered: this assignment fails');
    expect(narration()).toContain('φ is still satisfiable, for example with a = F, b = F, c = T');
    expect(byTest('result')).toBe('1 edge uncovered');
    click(button('c is false; press to flip it'));
    expect(narration()).toContain('a is false, so take vertex ¬a');
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('covered: φ is satisfied');
  });

  it('loads an unsatisfiable formula and edits the formula', () => {
    render();
    commit(field('select[name="preset"]'), 'unsatisfiable');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('φ is unsatisfiable');
    commit(field('input[name="formula"]'), '(a ∨ a ∨ b) & (¬a ∨ ¬a ∨ b) & (¬b ∨ ¬b ∨ a)');
    expect(field('input[name="formula"]').value).toBe(
      '(a ∨ a ∨ b) ∧ (¬a ∨ ¬a ∨ b) ∧ (¬b ∨ ¬b ∨ a)',
    );
    click(button('b is false; press to flip it'));
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('covered: φ is satisfied');
    expect(field('select[name="preset"]').value).toBe('');
  });

  it('refuses a formula that is not 3-CNF', () => {
    render();
    commit(field('input[name="formula"]'), '(a ∨ b)');
    expect(narration()).toBe(m.formulaError(4));
    expect(field('input[name="formula"]').value).toBe(
      '(a ∨ b ∨ c) ∧ (¬a ∨ ¬b ∨ c) ∧ (a ∨ ¬b ∨ ¬c)',
    );
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelector('li[aria-labelledby]'));
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('Two per variable');
    answer.value = '12';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Chưa đúng');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
