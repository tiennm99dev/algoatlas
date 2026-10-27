// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/hash-functions/copy.en.js';
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
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
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

describe('designing hash functions lesson', () => {
  it('piles the attack keys into one bucket on the left only', () => {
    render();
    expect(narration()).toContain(
      'Left: k mod 16. Right: universal hashing with a = 389, b = 120.',
    );
    next(1);
    expect(narration()).toBe('Key 0: 0 mod 16 = 0; ((389·0 + 120) mod 1009) mod 16 = 8.');
    next(1);
    expect(narration()).toBe('Left bucket 0 now holds 1 key; right bucket 8 holds 1 key.');
    click(button('Last step'));
    expect(narration()).toBe(
      '32 keys hashed. Colliding pairs: 496 with the fixed hash, 19 with the universal one.',
    );
    expect(byTest('left-max')).toBe('32');
    expect(byTest('left-empty')).toBe('15');
    expect(byTest('expected')).toBe(
      'A truly random hash expects C(32, 2)/16 = 31 colliding pairs.',
    );
  });

  it('shows an unlucky draw of a and b, and keeps the last valid one on bad input', () => {
    render();
    const a = field('input[name="a"]');
    const b = field('input[name="b"]');
    commit(a, '0');
    expect(narration()).toBe(m.abError);
    expect(a.value).toBe('389');
    commit(a, '3');
    commit(b, '5');
    click(button('Last step'));
    expect(byTest('right-pairs')).toBe('Colliding pairs: 265');
    expect(document.body.textContent).toContain('Universal: ((3·k + 5) mod 1009) mod 16');
  });

  it('rebuilds the attack against the multiplication method', () => {
    render();
    click(field('input[name="fixed"][value="multiply"]'));
    next(3);
    expect(narration()).toBe(
      'Key 13: ⌊16 · frac(13 · 0.618…)⌋ = 0; ((389·13 + 120) mod 1009) mod 16 = 4.',
    );
    click(button('Last step'));
    expect(byTest('left-pairs')).toBe('Colliding pairs: 496');
  });

  it('spreads sequential keys evenly under k mod 16', () => {
    render();
    commit(field('select[name="keys"]'), 'sequential');
    click(button('Last step'));
    expect(byTest('left-pairs')).toBe('Colliding pairs: 16');
    expect(byTest('left-max')).toBe('2');
    commit(field('input[name="count"]'), '4');
    click(button('Last step'));
    expect(narration()).toContain('4 keys hashed.');
  });

  it('draws new a and b from the button and offers new random keys', () => {
    render();
    click(buttonByText('New a, b'));
    const a = Number(field('input[name="a"]').value);
    expect(a >= 1 && a <= 1008).toBe(true);
    expect(document.body.textContent).toContain(`Universal: ((${a}·k`);
    commit(field('select[name="keys"]'), 'random');
    click(buttonByText('New keys'));
    click(button('Last step'));
    expect(narration()).toContain('32 keys hashed.');
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Key 0:');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[1]);
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
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
