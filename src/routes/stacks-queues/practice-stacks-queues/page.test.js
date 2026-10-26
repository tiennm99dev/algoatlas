// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-stacks-queues/copy.en.js';
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
const valueInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="value"]'));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} prefix */
const label = (prefix) =>
  [...document.querySelectorAll('svg[role="img"]')]
    .map((s) => s.getAttribute('aria-label') ?? '')
    .find((l) => l.startsWith(prefix)) ?? '';
/** @param {string} value */
const pickProblem = (value) =>
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="problem"][value="${value}"]`)
    ),
  );
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Next step'));
};

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('practice: stacks and queues lesson', () => {
  it('pours the inbox into the outbox on the first dequeue', () => {
    render();
    next(4);
    expect(narration()).toBe('dequeue(): the outbox is empty, so pour the whole inbox into it.');
    next(1);
    expect(narration()).toContain('Pop 3 from the inbox and push it onto the outbox');
    next(2);
    expect(label('outbox')).toBe('outbox (dequeue pops here), bottom to top: 3, 2, 1. Top is 1.');
    next(1);
    expect(narration()).toContain('Pop 1 from the outbox and return it');
    expect(byTest('result')).toBe('1');
  });

  it('ends the mixed log with 4 pours and 2 stack ops per queue op', () => {
    render();
    click(button('Last step'));
    expect(byTest('transfers')).toBe('4');
    expect(byTest('stack-ops')).toBe('16');
    expect(byTest('per-op')).toBe('2.00');
  });

  it('enqueues from the form and reports an empty queue', () => {
    render();
    click(buttonByText('Reset'));
    commit(valueInput(), '42');
    /** @type {HTMLFormElement} */ (valueInput().closest('form')).requestSubmit();
    flushSync();
    expect(narration()).toBe('enqueue(42): push 42 onto the inbox. One stack operation.');
    click(buttonByText('Dequeue'));
    click(buttonByText('Dequeue'));
    click(button('Last step'));
    click(button('Previous step'));
    expect(narration()).toContain('the queue is empty');
  });

  it('refuses a ninth item and a bad value', () => {
    render();
    click(buttonByText('Reset'));
    for (let k = 0; k < 9; k++) click(buttonByText('Enqueue'));
    expect(narration()).toBe(m.full);
    commit(valueInput(), '500');
    expect(valueInput().value).toBe('6');
  });

  it('tracks the minimum with a second stack in the min-stack', () => {
    render();
    pickProblem('min-stack');
    click(button('Last step'));
    expect(label('mins')).toBe('mins (top = minimum), bottom to top: 5, 3. Top is 3.');
    expect(byTest('min')).toBe('3');
    click(button('Previous step'));
    expect(narration()).toBe('getMin() reads the top of mins: 3. No searching.');
    click(buttonByText('Undo last'));
    commit(valueInput(), '9');
    click(buttonByText('Push'));
    click(button('Next step'));
    expect(narration()).toBe('9 > the minimum 3: mins stays as it is.');
  });

  it('loads a preset and undoes', () => {
    render();
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'burst');
    click(button('Last step'));
    expect(byTest('transfers')).toBe('5');
    click(buttonByText('Undo last'));
    expect(byTest('queue-ops')).toBe('9');
  });

  it('steps back with the arrow keys', () => {
    render();
    click(button('Last step'));
    const before = narration();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    flushSync();
    expect(narration()).not.toBe(before);
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
    answer.value = '3';
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
