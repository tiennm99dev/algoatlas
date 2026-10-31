// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-divide-and-conquer/copy.en.js';
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
/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const sample = (name) =>
  /** @type {HTMLButtonElement} */ (document.querySelector(`button[data-sample="${name}"]`));
/** @param {string} prefix */
const callNode = (prefix) =>
  /** @type {SVGGElement} */ (
    [...document.querySelectorAll('g[role="button"]')].find((g) =>
      g.getAttribute('aria-label')?.startsWith(prefix),
    )
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('practice: divide and conquer problems', () => {
  it('opens on max(L, R), which misses the crossing run of Sample 1', () => {
    render();
    expect(text()).toContain('Call best(0, 8) on 9 values.');
    expect(text()).toContain('return max(L, R)');
    expect(byTest('samples-summary')).toBe('Your combine passes 1 of 5 arrays.');
    expect(byTest('expected')).toBe('6');
    click(button('Last step'));
    expect(byTest('returned')).toBe('4 ✕');
    expect(byTest('calls')).toBe('17');
    expect(byTest('reads')).toBe('38');
    expect(text()).toContain('but the right answer is 6. The first wrong call was [5, 6].');
  });

  it('ticking C fixes every sample', () => {
    render();
    click(input('part-cross'));
    expect(text()).toContain('return max(L, R, C)');
    expect(byTest('samples-summary')).toContain('passes all 5 arrays');
    click(button('Last step'));
    expect(byTest('returned')).toBe('6 ✓');
    expect(text()).toContain('every call was right for its own range');
  });

  it('jumps to the first wrong call and explains it', () => {
    render();
    click(buttonByText(m.jumpWrong));
    expect(text()).toContain(
      'Your combine returns 2, from L. ✕ Wrong: the right answer for [5, 6] is 3.',
    );
    expect(callNode('Call [5, 6]').getAttribute('aria-label')).toBe(
      'Call [5, 6]: wrong for its range, returned 2.',
    );
  });

  it('C alone passes four samples but the tree shows wrong calls', () => {
    render();
    click(input('part-left'));
    click(input('part-right'));
    click(input('part-cross'));
    expect(byTest('samples-summary')).toBe('Your combine passes 4 of 5 arrays.');
    click(button('Last step'));
    expect(text()).toContain('the right answer, but call [0, 1] was wrong on the way.');
    click(sample('Sample 3'));
    click(button('Last step'));
    expect(byTest('returned')).toBe('−8 ✕');
  });

  it('majority needs counting, and one candidate is not enough', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="majority"]')));
    expect(input('values').value).toBe('3, 3, 4, 2, 4, 4, 2, 4, 4');
    expect(byTest('samples-summary')).toBe('Your combine passes 2 of 5 arrays.');
    click(input('part-count'));
    expect(byTest('samples-summary')).toContain('passes all 5 arrays');
    click(button('Last step'));
    expect(byTest('reads')).toBe('38');
    expect(byTest('returned')).toBe('4 ✓');
    click(input('part-left'));
    expect(byTest('samples-summary')).toBe('Your combine passes 4 of 5 arrays.');
    click(sample('Sample 2'));
    click(button('Last step'));
    expect(byTest('returned')).toBe('none ✕');
  });

  it('a typed array joins the samples, and bad input is refused', () => {
    render();
    commit(input('values'), '1, -2, 3');
    expect(sample(m.yourArray).getAttribute('aria-label')).toBe(
      'Your array: 1, −2, 3. Right answer 3, yours 3, pass. Load it.',
    );
    expect(byTest('samples-summary')).toBe('Your combine passes 2 of 6 arrays.');
    commit(input('values'), '1, 200');
    expect(text()).toContain(m.errors.range);
    expect(input('values').value).toBe('1, -2, 3');
    commit(input('values'), 'a b');
    expect(text()).toContain(m.errors.format);
  });

  it('a call node picked by keyboard seeks to its return', () => {
    render();
    const node = callNode('Call [0, 0]');
    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain('[0, 0] is one cell, so return a[0] = −2. ✓ Right for [0, 0].');
  });

  it('Random array loads a new array and a notice says when nothing is wrong', () => {
    render();
    click(input('part-cross'));
    click(buttonByText(m.randomArray));
    expect(input('values').value.split(', ').length).toBeGreaterThanOrEqual(6);
    expect(sample(m.yourArray)).toBeTruthy();
    click(buttonByText(m.jumpWrong));
    expect(text()).toContain(m.noWrong);
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
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
