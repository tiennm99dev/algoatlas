// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/analysing-loops-recursion/copy.en.js';

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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

const nodeTitles = () =>
  [...document.querySelectorAll('svg [aria-label^="Call of size"]')].map(
    (t) => t.getAttribute('aria-label') ?? '',
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('analysing loops and recursion lesson', () => {
  it('starts merge sort on n = 16 with only the root drawn', () => {
    render();
    expect(narration()).toContain('T(n) = 2T(n/2) + n with n = 16');
    expect(stat('Calls drawn')).toBe('1');
  });

  it('sums level 0, then splits it into two calls', () => {
    render();
    click(button('Next step'));
    expect(narration()).toContain('Level 0: 1 call of size 16, each doing 16 work');
    click(button('Next step'));
    expect(narration()).toContain('level 1 has 2');
    expect(stat('Calls drawn')).toBe('3');
  });

  it('ends merge sort at T(16) = 80 with every level costing 16', () => {
    render();
    click(button('Last step'));
    expect(narration()).toContain('T(16) = 80, so T(n) = Θ(n log n).');
    expect(stat('Running total')).toBe('80');
    expect(stat('Calls drawn')).toBe('31');
    expect(nodeTitles().filter((t) => t.includes('size 1 at level 4'))).toHaveLength(16);
  });

  it('loads Karatsuba and finds that the leaves dominate', () => {
    render();
    commit(presetSelect(), 'karatsuba');
    expect(input('a').value).toBe('3');
    click(button('Last step'));
    expect(narration()).toContain('T(8) = 65');
    expect(narration()).toContain('the aᵏ = 27 leaves dominate');
  });

  it('rebuilds when a field changes and refuses a tree that is too big', () => {
    render();
    commit(input('d'), '2');
    expect(presetSelect().value).toBe('');
    click(button('Last step'));
    expect(narration()).toContain('the root’s n² dominates');
    commit(input('a'), '4');
    expect(narration()).toBe(m.fieldError(85));
    expect(input('a').value).toBe('2');
    commit(input('b'), '');
    expect(input('b').value).toBe('2');
  });

  it('picks a call with the keyboard and shows its subtree cost', () => {
    render();
    click(button('Last step'));
    const root = /** @type {SVGElement} */ (document.querySelector('svg [tabindex="0"]'));
    root.focus();
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flushSync();
    const child = /** @type {SVGElement} */ (document.activeElement);
    child.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain('T(8) at level 1 = 2 × T(4) + 8 = 32');
  });

  it('checks the T(16) question and its hints', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[2]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '64';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    answer.value = '80';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
