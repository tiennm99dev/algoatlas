// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/greedy-exchange-argument/copy.en.js';

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

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
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

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const summary = () =>
  document.querySelector('[data-testid="counter-summary"]')?.textContent?.trim() ?? '';

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('greedy change-making lesson', () => {
  it('starts on paying 6 with 1, 3, 4', () => {
    render();
    expect(narration()).toContain('Pay 6 with as few coins as possible from 1, 3, 4.');
    expect(stat('Still to pay')).toBe('6');
    expect(stat('Fewest coins')).toBe('2');
  });

  it('steps through the sort and the first coin', () => {
    render();
    click(button('Next step'));
    expect(narration()).toContain('Sort the coins from largest to smallest: 4, 3, 1.');
    click(button('Next step'));
    expect(narration()).toContain('Coin 4: ⌊6 / 4⌋ = 1');
    click(button('Next step'));
    expect(narration()).toContain('Take 1 × 4. 2 is left to pay.');
    expect(stat('Greedy coins')).toBe('1');
  });

  it('ends with greedy using one coin too many', () => {
    render();
    click(button('Last step'));
    expect(narration()).toContain('Greedy paid 6 = 4 + 1 + 1, 3 coins, but 3 + 3 uses only 2.');
    expect(stat('Verdict')).toBe('Greedy uses too many coins');
    const strip = document.querySelector('[aria-label^="Coins:"]');
    expect(strip?.textContent).toContain('×2');
  });

  it('finds no counterexample for canonical coins', () => {
    render();
    commit(field('preset'), 'us');
    expect(text()).toContain('New coin set loaded.');
    expect(summary()).toBe('Greedy is optimal for every amount from 1 to 200 with these coins.');
    expect(buttonByText('Step through the smallest one').getAttribute('aria-disabled')).toBe(
      'true',
    );
    commit(field('preset'), 'vnd');
    expect(summary()).toContain('Greedy is optimal for every amount');
  });

  it('loads the smallest counterexample and steps through it', () => {
    render();
    commit(field('preset'), 'sevenTen');
    expect(summary()).toContain('Greedy is not optimal for');
    click(buttonByText('Step through the smallest one'));
    expect(narration()).toContain('Amount 14 loaded');
    click(button('Last step'));
    expect(narration()).toContain('Greedy paid 14 = 10 + 1 + 1 + 1 + 1, 5 coins, but 7 + 7');
  });

  it('shows greedy stuck and impossible amounts without a 1 coin', () => {
    render();
    commit(field('preset'), 'noOne');
    commit(field('amount'), '9');
    click(button('Last step'));
    expect(narration()).toContain('Greedy got stuck with 1 unpaid, yet 9 = 3 + 3 + 3 works');
    expect(stat('Verdict')).toBe('Greedy is stuck');
    commit(field('amount'), '7');
    click(button('Last step'));
    expect(narration()).toContain('No combination of these coins pays 7');
    expect(stat('Fewest coins')).toBe('—');
  });

  it('reads typed coins and refuses bad input', () => {
    render();
    commit(field('coins'), '9 6 5 1');
    expect(/** @type {HTMLInputElement} */ (field('coins')).value).toBe('1, 5, 6, 9');
    expect(summary()).toContain('Greedy is not optimal');
    commit(field('coins'), '1, 0');
    expect(narration()).toContain('Keep every coin between 1 and 100.');
    expect(/** @type {HTMLInputElement} */ (field('coins')).value).toBe('1, 5, 6, 9');
    commit(field('amount'), '500');
    expect(narration()).toContain('The amount must be a whole number from 1 to 200.');
    expect(/** @type {HTMLInputElement} */ (field('amount')).value).toBe('6');
  });

  it('commits typed fields on Enter', () => {
    render();
    const amount = /** @type {HTMLInputElement} */ (field('amount'));
    amount.value = '11';
    amount.dispatchEvent(new Event('input', { bubbles: true }));
    amount.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('Pay 11 with as few coins');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '17';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '14';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
