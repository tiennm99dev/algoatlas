// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/lcs-edit-distance/copy.en.js';
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
const arrows = () => document.querySelectorAll('line[marker-end]').length;
const titles = () => [...document.querySelectorAll('svg title')].map((t) => t.textContent ?? '');
const chips = () => {
  const card = [...document.querySelectorAll('h2')].find((h) => h.textContent === m.commonTitle);
  return [...(card?.parentElement?.querySelectorAll('li') ?? [])].map((li) =>
    li.textContent?.trim(),
  );
};

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('LCS and edit distance lesson', () => {
  it('fills the LCS table and walks back to read BCBA', () => {
    render();
    expect(narration()).toBe(
      'Find the longest common subsequence of ABCBDAB and BDCABA. The table has 8 × 7 cells, one per pair of prefixes.',
    );
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toBe(
      'A ≠ B: one of them is not in the LCS. Drop A → 0, drop B → 0. Keep the larger (drop A from a): L[1][1] = 0.',
    );
    expect(arrows()).toBe(2);
    expect(titles()).toContain('ε vs B: 0, read, and kept');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toBe(
      'a[1] = b[4] = A: a match. Extend the diagonal: L[1][4] = L[0][3] + 1 = 1.',
    );
    expect(arrows()).toBe(1);
    click(button('Last step'));
    expect(byTest('result')).toBe('4');
    expect(byTest('filled')).toBe('56 / 56');
    expect(chips()).toEqual(['B', 'C', 'B', 'A']);
    expect(titles()).toContain('ABCBDAB vs BDCABA: 4, the answer');
  });

  it('computes the edit distance and the alignment', () => {
    render();
    click(field('input[name="mode"][value="edit"]'));
    commit(field('select[name="preset"]'), 'kitten');
    expect(field('input[name="a"]').value).toBe('KITTEN');
    click(button('Next step'));
    expect(narration()).toBe(
      'Base cases: D[i][0] = i, deleting all i letters, and D[0][j] = j, inserting all j letters.',
    );
    click(button('Last step'));
    expect(byTest('result')).toBe('3');
    const edits = [...document.querySelectorAll('[data-testid="alignment"] ul li')].map(
      (li) => li.textContent,
    );
    expect(edits).toEqual(['K → S', 'E → I', 'insert G']);
    expect(narration()).toBe('KITTEN becomes SITTING in 3 edits: K → S, E → I, insert G.');
  });

  it('reads typed words and refuses bad ones', () => {
    render();
    click(field('input[name="mode"][value="edit"]'));
    commit(field('input[name="a"]'), 'horse');
    commit(field('input[name="b"]'), 'ros');
    expect(field('input[name="a"]').value).toBe('HORSE');
    click(button('Last step'));
    expect(byTest('result')).toBe('3');
    commit(field('input[name="b"]'), 'R0S');
    expect(narration()).toBe(m.wordErrors(8).format);
    expect(field('input[name="b"]').value).toBe('ROS');
    commit(field('input[name="a"]'), 'ABCDEFGHI');
    expect(narration()).toBe(m.wordErrors(8).length);
    expect(field('input[name="a"]').value).toBe('HORSE');
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toBe(
      'Base cases: row 0 and column 0 are 0, because an empty prefix has no letters in common with anything.',
    );
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
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
