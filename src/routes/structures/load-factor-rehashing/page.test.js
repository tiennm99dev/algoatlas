// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/load-factor-rehashing/copy.en.js';
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
/** @param {string} name @param {string} value */
const pick = (name, value) => click(field(`input[name="${name}"][value="${value}"]`));
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

describe('load factor and rehashing lesson', () => {
  it('inserts, crosses the threshold and rehashes key by key', () => {
    render();
    expect(narration()).toBe(
      'An empty table with 4 buckets. It grows by doubling m when α passes 0.75.',
    );
    next(1);
    expect(narration()).toBe('Insert 12 into chain 12 mod 4 = 0. Now n = 1. One step.');
    next(7);
    expect(narration()).toBe('α = 4/4 = 1.00 > 0.75: time to grow.');
    expect(byTest('gauge')).toContain('over the threshold');
    expect(document.querySelector('[role="meter"]')?.getAttribute('aria-valuenow')).toBe('1');
    next(1);
    expect(narration()).toBe(
      'Allocate 8 buckets by doubling m. All 4 keys must move, because k mod 8 is not k mod 4.',
    );
    next(1);
    expect(narration()).toBe('Move 12 to chain 12 mod 8 = 4. 3 keys still waiting.');
    expect(document.body.textContent).toContain('Rehashing into 8 buckets');
    next(4);
    expect(narration()).toBe('Rehashed: α drops to 4/8 = 0.50. This insert cost 1 + 4 = 5 steps.');
    expect(byTest('gauge')).not.toContain('over the threshold');
  });

  it('ends with the total and the average cost', () => {
    render();
    click(button('Last step'));
    expect(narration()).toBe(
      '12 inserts cost 23 steps with 2 resizes: 1.92 steps per insert on average.',
    );
    expect(byTest('m')).toBe('16');
    expect(byTest('average')).toBe('Average: 23/12 = 1.92 steps per insert');
  });

  it('shows adding 4 buckets costing more than doubling', () => {
    render();
    commit(field('input[name="count"]'), '20');
    pick('threshold', '1');
    pick('growth', 'add');
    click(button('Last step'));
    expect(byTest('work')).toBe('64');
    expect(byTest('per-insert')).toBe('3.20');
    pick('growth', 'double');
    click(button('Last step'));
    expect(byTest('work')).toBe('51');
  });

  it('never resizes when the threshold is off, so chains grow', () => {
    render();
    commit(field('input[name="count"]'), '32');
    pick('threshold', 'never');
    click(button('Last step'));
    expect(byTest('m')).toBe('4');
    expect(byTest('grows')).toBe('0');
    expect(byTest('gauge')).toBe('α = 32/4 = 8.00, never resizes');
    expect(Number(byTest('longest'))).toBeGreaterThanOrEqual(8);
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
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '20';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '24';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
