// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-balanced-bst/copy.en.js';
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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const opsField = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="ops"]'));
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
/** @param {string} value */
const rankRadio = (value) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="rank-mode"][value="${value}"]`)
  );

describe('practice: balanced tree problems lesson', () => {
  it('starts on the sorted preset and reaches the totals', () => {
    render();
    expect(narration()).toContain('Nothing has run yet');
    expect(stat('bst-total')).toBe('0');
    click(button('Last step'));
    expect(stat('bst-total')).toBe('170');
    expect(stat('avl-total')).toBe('62');
    expect(stat('bst-height')).toBe('15');
    expect(stat('avl-height')).toBe('4');
    expect(stat('avl-worst')).toBe('4');
    expect(stat('rotations')).toBe('11');
    expect(narration()).toContain('Totals: plain BST 170, AVL tree 62');
  });

  it('narrates each operation with what every structure spent', () => {
    render();
    commit(opsField(), 'i2 i1 i3 s3 d9 i3');
    expect(narration()).toContain('Nothing has run yet');
    click(button('Next step'));
    expect(narration()).toBe('Insert 2. Comparisons: plain BST 0, AVL tree 0, skip list 0.');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toContain('Search for 3: found.');
    expect(stat('bst-cost')).toBe('2');
    click(button('Next step'));
    expect(narration()).toContain('9 is not stored, so the delete changes nothing.');
    click(button('Next step'));
    expect(narration()).toContain('3 is already stored');
    expect(stat('keys')).toBe('3');
  });

  it('reports AVL rotations in the narration', () => {
    render();
    commit(opsField(), 'i1 i2 i3');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toContain('The AVL tree needed 1 rotation.');
    expect(stat('rotations')).toBe('1');
    expect(stat('avl-height')).toBe('2');
    expect(stat('bst-height')).toBe('3');
  });

  it('rank costs less with stored counts, and the switch keeps the current step', () => {
    render();
    commit(presetSelect(), 'scoreboard');
    click(button('Last step'));
    expect(stat('avl-total')).toBe('117');
    click(rankRadio('counted'));
    expect(stat('avl-total')).toBe('67');
    expect(narration()).toContain('Totals:');
    click(rankRadio('walk'));
    expect(stat('avl-total')).toBe('117');
  });

  it('shows the rank a query found', () => {
    render();
    commit(opsField(), 'i10 i20 i30 i40 i50 r35');
    expect(stat('rank')).toBe(m.noRank);
    click(button('Last step'));
    click(button('Previous step'));
    expect(stat('rank')).toBe('4');
    expect(narration()).toContain('The rank of 35 is 4, found by comparing keys in sorted order.');
    click(rankRadio('counted'));
    expect(narration()).toContain('found by walking one path');
  });

  it('draws the skip list towers, and new coins can change only the skip list', () => {
    render();
    click(button('Last step'));
    const before = [stat('bst-total'), stat('avl-total')];
    expect(
      document.querySelector('[data-testid="skip-list"] table')?.getAttribute('aria-label'),
    ).toContain('15 (height 3)');
    /** @type {Set<string | undefined>} */
    const totals = new Set();
    for (let i = 0; i < 12; i++) {
      click(buttonByText(m.coins));
      totals.add(stat('skip-total'));
      expect([stat('bst-total'), stat('avl-total')]).toEqual(before);
    }
    expect(totals.size).toBeGreaterThan(1);
  });

  it('a preset puts the first coins back, so its totals can be quoted', () => {
    render();
    click(buttonByText(m.coins));
    commit(presetSelect(), 'shuffled');
    click(button('Last step'));
    expect(stat('skip-total')).toBe('95');
    expect(stat('bst-total')).toBe('57');
    expect(opsField().value).toContain('i7 i2 i13');
  });

  it('refuses a bad sequence with a notice and keeps the last valid one', () => {
    render();
    const kept = opsField().value;
    commit(opsField(), 'i5 oops');
    expect(narration()).toBe(m.opErrors.format);
    expect(opsField().value).toBe(kept);
    commit(opsField(), '');
    expect(narration()).toBe(m.opErrors.empty);
    commit(opsField(), 'i1 i2 i3 i4 i5 i6 i7 i8 i9 i10 i11 i12 i13 i14 i15 i16');
    expect(narration()).toBe(m.opErrors.full);
    expect(opsField().value).toBe(kept);
    click(button('Last step'));
    expect(stat('bst-total')).toBe('170');
  });

  it('submits the form with Enter, and a random preset can be picked again', () => {
    render();
    opsField().value = 'i4 i2';
    opsField().dispatchEvent(new Event('input', { bubbles: true }));
    opsField()
      .closest('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    click(button('Last step'));
    expect(stat('keys')).toBe('2');
    expect(presetSelect().value).toBe('');
    commit(presetSelect(), 'random');
    expect(presetSelect().value).toBe('');
    click(button('Last step'));
    expect(stat('keys')).toBe('11');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
    const section = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (el) => el.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    /** @param {string} value */
    const submit = (value) => {
      answer.value = value;
      answer.dispatchEvent(new Event('input', { bubbles: true }));
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    submit('15');
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    submit('4');
    expect(q.textContent).not.toContain('Not quite');
  });
});
