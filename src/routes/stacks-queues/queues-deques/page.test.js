// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/queues-deques/copy.en.js';
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
const ringLabel = () =>
  document.querySelector('svg[aria-label^="Circular buffer"]')?.getAttribute('aria-label') ?? '';
const preset = () => /** @type {HTMLSelectElement} */ (document.querySelector('select'));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('queues and deques lesson', () => {
  it('builds the short queue and draws every slot of the ring', () => {
    render();
    expect(narration()).toContain('An empty circular buffer');
    click(button('Last step'));
    expect(ringLabel()).toBe(
      'Circular buffer of 8 slots, head = 0, tail = 4, size = 4. Front to back: 12, 5, 31, 8.',
    );
    expect(document.querySelectorAll('svg[aria-label^="Circular buffer"] title')).toHaveLength(8);
  });

  it('dequeues from the front by moving head, with no shifting', () => {
    render();
    click(buttonByText('Dequeue'));
    expect(narration()).toContain('dequeue(): size = 4');
    click(button('Next step'));
    expect(narration()).toContain('Read 12 from slot 0 and move head to 1');
    expect(byTest('result')).toBe('12');
    expect(byTest('naive-shifts')).toBe('3');
    expect(byTest('ring-shifts')).toBe('0');
  });

  it('wraps the tail into slot 0', () => {
    render();
    commit(preset(), 'wrap');
    click(button('Last step'));
    click(button('Previous step'));
    expect(narration()).toContain('Write 90 into slot 0');
    expect(narration()).toContain('wrapped around');
    expect(byTest('wraps')).toBe('1');
    expect(byTest('tail')).toBe('1');
  });

  it('pushes at the front and pops at the back as a deque', () => {
    render();
    click(buttonByText('Reset'));
    commit(valueInput(), '9');
    click(buttonByText('Push front'));
    click(button('Next step'));
    expect(narration()).toContain('Step head back to slot 7 and write 9 there');
    expect(byTest('head')).toBe('7');
    click(buttonByText('Pop back'));
    click(button('Next step'));
    expect(narration()).toContain('Read 9 from slot 7');
  });

  it('refuses a ninth item and a pop from an empty buffer', () => {
    render();
    commit(preset(), 'full');
    click(button('Last step'));
    click(button('Previous step'));
    expect(narration()).toContain('Full: all 8 slots are in use, so 9 is refused');
    click(buttonByText('Reset'));
    click(buttonByText('Dequeue'));
    click(button('Next step'));
    expect(narration()).toBe('Empty: there is nothing to remove. The buffer is unchanged.');
  });

  it('keeps the last valid value and shows a notice for a bad one', () => {
    render();
    commit(valueInput(), '-3');
    expect(valueInput().value).toBe('17');
    valueInput().value = '';
    valueInput().dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    click(buttonByText('Push front'));
    expect(narration()).toBe(m.valueError);
  });

  it('undoes, and enqueues when Enter submits the form', () => {
    render();
    click(buttonByText('Dequeue'));
    click(buttonByText('Undo last'));
    expect(ringLabel()).toContain('Front to back: 12, 5, 31, 8.');
    commit(valueInput(), '44');
    /** @type {HTMLFormElement} */ (valueInput().closest('form')).requestSubmit();
    flushSync();
    expect(narration()).toContain('enqueue(44)');
    expect(buttonByText('Dequeue').type).toBe('button');
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
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
