// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { makeInput, solveFast, solveNaive } from '$lib/algo-engine/practice-advanced-dp.js';
import { en as m } from '$lib/lessons/practice-advanced-dp/copy.en.js';
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
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button with text ${label}`);
  return el;
}

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  flushSync();
}

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
const submitForm = () => {
  document
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
};

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('advanced DP practice lesson', () => {
  it('solves the default input both ways and compares the work', () => {
    render();
    const input = makeInput('window', 2000, 50, 1);
    const [a, b] = [solveNaive(input), solveFast(input)];
    expect(byTest('naive-answer')).toBe(String(a.answer));
    expect(byTest('fast-answer')).toBe(String(b.answer));
    expect(byTest('naive-ops')).toBe(m.big(a.ops));
    expect(byTest('fast-ops')).toBe(m.big(b.ops));
    expect(byTest('naive-time')).toBe(m.notTimed);
    expect(byTest('verdict')).toBe(`${m.same} ${m.ratio(a.ops, b.ops)}`);
    expect(document.querySelectorAll('[role="img"] text').length).toBeGreaterThan(0);
  });

  it('runs and times both methods and fills the growth table', () => {
    render();
    click(buttonByText(m.run));
    expect(byTest('naive-time')).toMatch(/ms$/);
    const rows = document.querySelectorAll('[data-testid="growth"] tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].querySelector('th')?.textContent?.trim()).toBe('500');
    commit(field('seed'), '2');
    expect(byTest('naive-time')).toBe(m.notTimed);
    expect(document.querySelector('[data-testid="growth"]')).toBeNull();
  });

  it('answers the practice questions with the runner', () => {
    render();
    commit(field('n'), '10');
    commit(field('param'), '3');
    expect(byTest('naive-answer')).toBe('61');
    expect(byTest('naive-ops')).toBe('24');
    expect(byTest('fast-ops')).toBe('27');
    expect(byTest('verdict')).toContain('the naive method does less work');
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="tour"]')));
    commit(field('n'), '9');
    expect(byTest('naive-ops')).toBe('362,880');
    expect(field('param')).toBeNull();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="squares"]')));
    commit(field('n'), '2000');
    expect(byTest('naive-ops')).toBe('1,999,000');
  });

  it('refuses bad values and does not run on them', () => {
    render();
    commit(field('n'), '1');
    expect(byTest('verdict')).toBe(m.sizeError(2, 20000));
    expect(field('n').value).toBe('2000');
    submitForm();
    expect(byTest('naive-time')).toBe(m.notTimed);
    commit(field('n'), '10');
    commit(field('param'), '10');
    expect(byTest('verdict')).toBe(m.paramError('window', 1, 9));
    expect(field('param').value).toBe('9');
    commit(field('seed'), '0');
    expect(byTest('verdict')).toBe(m.seedError(9999));
    expect(field('seed').value).toBe('1');
  });

  it('clamps the window when n shrinks below it', () => {
    render();
    commit(field('n'), '20');
    expect(field('param').value).toBe('19');
    click(buttonByText(m.newInput));
    expect(Number(field('seed').value)).toBeGreaterThanOrEqual(1);
  });

  it('stores practice answers that the solvers reproduce', () => {
    const q = /** @type {{answer: number}[]} */ (/** @type {unknown} */ (m.practice));
    expect(solveNaive(makeInput('window', 10, 3, 1)).answer).toBe(q[0].answer);
    expect(solveNaive(makeInput('window', 1000, 50, 1)).ops).toBe(q[1].answer);
    expect(solveNaive(makeInput('squares', 2000, 100, 1)).ops).toBe(q[2].answer);
    expect(solveNaive(makeInput('tour', 9, 0, 1)).ops).toBe(q[3].answer);
    const small = makeInput('window', 10, 3, 1);
    expect(solveNaive(small).ops).toBeLessThan(solveFast(small).ops);
    expect(q[5].answer).toBe(0);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '60';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    /** @type {HTMLButtonElement} */ (hint).click();
    flushSync();
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '61';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
