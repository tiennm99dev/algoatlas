// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/master-theorem/copy.en.js';

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
  vi.useRealTimers();
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

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const nodeTitles = () =>
  [...document.querySelectorAll('svg g > title')]
    .map((t) => t.textContent ?? '')
    .filter((t) => t.startsWith('Call of size'));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('master theorem lesson', () => {
  it('starts on merge sort with divide, conquer and combine named', () => {
    render();
    expect(narration()).toContain('T(n) = 2T(n/2) + n.');
    expect(narration()).toContain('Divide: 2 subproblems of size n/2');
    expect(narration()).toContain('Combine: f(n) = n work');
    expect(nodeTitles()).toHaveLength(31);
  });

  it('sums each level and ends in case 2 with every level starred', () => {
    render();
    click(button('Next step'));
    expect(narration()).toContain('Level 0: 1 call of size 16');
    expect(text()).toContain('Level 0');
    click(button('Last step'));
    expect(narration()).toContain('T(n) = Θ(n log n). Every level is starred');
    expect(text()).toContain('Case 2: T(n) = Θ(n log n)');
    expect(nodeTitles().every((t) => t.endsWith('dominant'))).toBe(true);
  });

  it('stars only the leaves for Strassen and names the irrational exponent', () => {
    render();
    commit(field('preset'), 'strassen');
    click(button('Last step'));
    expect(text()).toContain('Case 1: T(n) = Θ(n^(log₂ 7)) ≈ Θ(n^2.81)');
    const dominant = nodeTitles().filter((t) => t.endsWith('dominant'));
    expect(dominant).toHaveLength(49);
    expect(dominant.every((t) => t.startsWith('Call of size 1 '))).toBe(true);
  });

  it('stars the root in case 3 and checks regularity', () => {
    render();
    commit(field('preset'), 'root');
    click(button('Last step'));
    click(button('Previous step'));
    expect(narration()).toContain('a·f(n/b) ≤ 0.5·f(n), with 0.5 < 1');
    expect(nodeTitles().filter((t) => t.endsWith('dominant'))).toEqual([
      'Call of size 16 at level 0, cost 256, dominant',
    ]);
  });

  it('says no case applies to n / log n', () => {
    render();
    commit(field('preset'), 'gap');
    click(button('Last step'));
    expect(text()).toContain('No case applies');
    expect(nodeTitles().some((t) => t.endsWith('dominant'))).toBe(false);
  });

  it('rebuilds the trace when a field changes and clears the preset', () => {
    render();
    commit(field('k'), '3');
    commit(field('a'), '4');
    expect(narration()).toContain('T(n) = 4T(n/2) + n.');
    expect(/** @type {HTMLSelectElement} */ (field('preset')).value).toBe('');
    commit(field('p'), '1');
    expect(narration()).toContain('T(n) = 4T(n/2) + n log n.');
    commit(field('d'), '2');
    click(button('Last step'));
    expect(text()).toContain('Case 2: T(n) = Θ(n² log² n)');
  });

  it('refuses a tree too big to draw and keeps the last valid value', () => {
    render();
    commit(field('k'), '6');
    expect(text()).toContain('keep the drawn tree at 85 calls or fewer');
    expect(/** @type {HTMLInputElement} */ (field('k')).value).toBe('4');
    commit(field('a'), '0');
    expect(/** @type {HTMLInputElement} */ (field('a')).value).toBe('2');
    click(button('Next step'));
    expect(text()).not.toContain('keep the drawn tree');
  });

  it('commits the number fields on Enter', () => {
    render();
    const b = /** @type {HTMLInputElement} */ (field('b'));
    b.value = '4';
    b.dispatchEvent(new Event('input', { bubbles: true }));
    b.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('T(n) = 2T(n/4) + n.');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[2]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '0.75';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    answer.value = '0.1875';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
