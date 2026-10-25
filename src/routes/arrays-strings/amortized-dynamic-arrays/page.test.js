// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/amortized-dynamic-arrays/copy.en.js';

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
  localStorage.clear();
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {string} value */
function pickMethod(value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="method"][value="${value}"]`)
    ),
  );
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Step until the narration matches. @param {string} part */
function stepUntil(part) {
  for (let k = 0; k < 400 && !narration().includes(part); k++) click(button('Next step'));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('amortized dynamic arrays lesson', () => {
  it('pays for 9 appends with 3 coins each', () => {
    render();
    expect(narration()).toBe(
      'An empty dynamic array with capacity 1 and an empty bank. We will run 9 appends, each charged 3 coins.',
    );
    click(button('Next step'));
    expect(narration()).toBe('Append 1: pay 3 coins into the bank, which now holds 3.');
    click(button('Next step'));
    expect(narration()).toContain('Write 1 into A[0] for 1 coin. Append 1 cost 1 step');
    click(button('Last step'));
    expect(stat(m.stats.total)).toBe('24');
    expect(stat(m.stats.bound)).toBe('27');
    expect(stat(m.stats.bank)).toBe('3');
    expect(stat(m.stats.worst)).toBe('9');
    expect(narration()).toContain('The bank never went below 0, so c = 3 pays for every append.');
  });

  it('shows the old block while a resize copies it', () => {
    render();
    stepUntil('Allocate a block of 4 slots');
    expect(text()).toContain(m.oldBlockTitle);
    click(button('Next step'));
    expect(narration()).toBe('Copy element 0 for 1 coin. Bank: 5.');
    stepUntil('Resize done');
    expect(text()).not.toContain(m.oldBlockTitle);
  });

  it('goes into debt on append 5 with a charge of 2', () => {
    render();
    commit(input('charge'), '2');
    stepUntil('in debt!');
    expect(narration()).toBe('Copy element 3 for 1 coin. Bank: −1 — in debt!');
    expect(stat(m.stats.op)).toBe('5 / 9');
    expect(text()).toContain(m.debt);
    click(button('Last step'));
    expect(text()).toContain(m.accounting.broke(5, 2));
    expect(narration()).toContain('The bank went into debt on append 5, so c = 2 is not enough.');
  });

  it('adds up the same run with the aggregate method', () => {
    render();
    pickMethod('aggregate');
    click(button('Last step'));
    expect(text()).toContain('9 appends: 9 writes + copies 1 + 2 + 4 + 8 = 9 + 15 = 24 steps.');
    expect(text()).toContain('24 < 3 × 9 = 27, an average of 2.67 steps per append.');
  });

  it('keeps the last valid values and submits with Enter', () => {
    render();
    commit(input('appends'), '65');
    expect(narration()).toBe(m.appendsError);
    expect(input('appends').value).toBe('9');
    commit(input('charge'), '0');
    expect(narration()).toBe(m.chargeError);
    expect(input('charge').value).toBe('3');
    input('appends').value = '64';
    input('appends').dispatchEvent(new Event('input', { bubbles: true }));
    /** @type {HTMLFormElement} */ (input('appends').closest('form')).requestSubmit();
    flushSync();
    click(button('Last step'));
    expect(stat(m.stats.total)).toBe('127');
    expect(stat(m.stats.worst)).toBe('33');
    expect(stat(m.stats.bank)).toBe('65');
  });

  it('checks the first question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '48';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '31';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
