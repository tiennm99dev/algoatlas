// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  binomial,
  catalan,
  lucasTrace,
  MAX_PRIME,
  MAX_ROWS,
} from '$lib/algo-engine/combinatorics.js';
import { en as m } from '$lib/lessons/combinatorics/copy.en.js';
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
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));
const titles = () =>
  [...document.querySelectorAll('[data-cell]')].map((t) => t.getAttribute('aria-label') ?? '');
const toLast = () => click(button('Last step'));
/** @param {string} value */
const pickMode = (value) =>
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="mode"][value="${value}"]`)
    ),
  );

describe('combinatorics lesson, Pascal view', () => {
  it('fills the triangle by adding the two cells above', () => {
    render();
    expect(narration()).toContain('Build rows 0 to 6');
    click(button('Next step'));
    expect(narration()).toContain('C(0, 0) = 1');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toBe('C(2, 1) = C(1, 0) + C(1, 1) = 1 + 1 = 2.');
    expect(stat('additions')).toBe('1');
    expect(titles()).toContain('C(2, 1) shows 2, being filled');
    expect(titles()).toContain('C(1, 0) shows 1, read by this addition');
    toLast();
    expect(stat('additions')).toBe('15');
    expect(stat('filled')).toBe('28');
    expect(stat('row-sum')).toBe('Row 6: 2^6 = 64');
    expect(titles()).toContain('C(6, 3) shows 20, divisible by p');
  });

  it('marks the multiples of the modulus and shows remainders on request', () => {
    render();
    toLast();
    expect(stat('multiples')).toBe('9');
    commit(field('modulus'), '3');
    expect(titles()).toContain('C(6, 3) shows 20');
    expect(titles()).toContain('C(6, 2) shows 15, divisible by p');
    click(
      /** @type {HTMLInputElement} */ (document.querySelector('input[name="view"][value="mod"]')),
    );
    expect(titles()).toContain('C(6, 3) shows 2');
    expect(titles()).toContain('C(6, 2) shows 0, divisible by p');
  });

  it('tells what a selected cell counts, with the pointer and the keyboard', () => {
    render();
    toLast();
    expect(stat('selected')).toContain(m.selectedEmpty);
    const cell = /** @type {SVGElement} */ (document.querySelector('[data-cell="6-2"]'));
    cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(stat('selected')).toContain('C(6, 2) = 15');
    expect(stat('selected')).toContain('= 10 + 5');
    expect(titles()).toContain('C(6, 4) shows 15, the mirror of the selected cell');
    /** @type {SVGElement} */ (document.querySelector('[data-cell="6-0"]')).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    flushSync();
    expect(stat('selected')).toContain(m.selectedEdge);
  });

  it('rebuilds from the fields and a preset, and refuses bad input', () => {
    render();
    commit(field('rows'), '3');
    toLast();
    expect(stat('additions')).toBe('3');
    commit(field('rows'), String(MAX_ROWS + 1));
    expect(narration()).toBe(m.rowsError(MAX_ROWS));
    expect(field('rows').value).toBe('3');
    commit(field('modulus'), '1');
    expect(narration()).toBe(m.modulusError(97));
    expect(field('modulus').value).toBe('2');
    commit(field('pascal-preset'), 'sierpinski');
    expect(field('rows').value).toBe('15');
    toLast();
    expect(stat('row-sum')).toBe('Row 15: 2^15 = 32,768');
  });
});

describe('combinatorics lesson, narration and mirror', () => {
  it('uses the singular for one cell and one addition', () => {
    render();
    commit(field('rows'), '0');
    toLast();
    expect(narration()).toContain('Done: 1 cell with 0 additions');
    commit(field('rows'), '2');
    toLast();
    expect(narration()).toContain('Done: 6 cells with 1 addition,');
  });

  it('marks no mirror until both cells are filled', () => {
    render();
    const cell = (/** @type {string} */ name) =>
      /** @type {HTMLElement} */ (document.querySelector(`[data-cell][aria-label^="${name}"]`));
    cell('C(4, 1)').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(titles().join()).not.toContain(m.cellStates.mirror);
    toLast();
    expect(titles().join()).toContain(m.cellStates.mirror);
  });
});

describe('combinatorics lesson, Lucas view', () => {
  it('walks C(1000, 300) mod 13 digit by digit', () => {
    render();
    pickMode('lucas');
    expect(narration()).toContain('Since n < p');
    commit(field('lucas-preset'), 'lucas');
    expect(field('n').value).toBe('1000');
    expect(narration()).toContain('Here n ≥ p');
    click(button('Next step'));
    expect(narration()).toContain('nᵢ = 1,000 mod 13 = 12 and kᵢ = 300 mod 13 = 1');
    click(button('Next step'));
    expect(narration()).toContain('C(12, 1) ≡ 12');
    expect(stat('formula')).toContain('≡ 12');
    toLast();
    expect(stat('result')).toBe('10');
    expect(stat('digits')).toBe('3');
    expect(stat('pascal-cells')).toBe('501,501');
  });

  it('counts the cells of a full triangle exactly past 2⁵³', () => {
    render();
    pickMode('lucas');
    commit(field('lucas-preset'), 'huge');
    expect(stat('pascal-cells')).toBe('500,000,001,500,000,001');
  });

  it('says there are no digits for C(0, 0)', () => {
    render();
    pickMode('lucas');
    commit(field('n'), '0');
    commit(field('k'), '0');
    expect(document.body.textContent).toContain(m.digitsNone);
    expect(document.body.textContent).not.toContain(m.digitsEmpty);
    toLast();
    expect(narration()).toContain('with no digits to read');
    expect(stat('result')).toBe('1');
  });

  it('stops at zero as soon as a digit of k is larger', () => {
    render();
    pickMode('lucas');
    commit(field('lucas-preset'), 'zero');
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toContain('kᵢ = 2 is more than nᵢ = 0');
    toLast();
    expect(stat('result')).toBe('0');
    expect(stat('formula')).toContain('≡ 0');
  });

  it('refuses bad input and keeps the last good value', () => {
    render();
    pickMode('lucas');
    commit(field('p'), '15');
    expect(narration()).toBe(m.primeError(MAX_PRIME));
    expect(field('p').value).toBe('13');
    commit(field('n'), '-1');
    expect(field('n').value).toBe('10');
    commit(field('k'), '');
    expect(field('k').value).toBe('3');
    commit(field('n'), '12');
    commit(field('k'), '4');
    commit(field('p'), '2');
    toLast();
    expect(stat('result')).toBe('1');
  });
});

describe('combinatorics lesson, Catalan view', () => {
  it('lists the 5 sequences of 3 pairs and matches the formula', () => {
    render();
    pickMode('brackets');
    expect(stat('prefix')).toBe(m.emptyPrefix);
    click(button('Next step'));
    expect(stat('prefix')).toBe('(');
    toLast();
    expect(stat('found')).toBe('5');
    expect(stat('all')).toBe('20');
    expect(stat('bad')).toBe('15');
    expect(stat('catalan')).toBe('5');
    expect(document.body.textContent).toContain('()()()');
  });

  it('draws the last sequence as a binary tree', () => {
    render();
    pickMode('brackets');
    expect(document.body.textContent).toContain(m.treeEmpty);
    toLast();
    expect(document.body.textContent).not.toContain(m.treeEmpty);
  });

  it('says the tree of zero pairs has no nodes', () => {
    render();
    pickMode('brackets');
    commit(field('pairs'), '0');
    toLast();
    expect(document.body.textContent).toContain(m.treeNone);
    expect(document.body.textContent).not.toContain(m.treeEmpty);
  });

  it('handles zero pairs and refuses too many', () => {
    render();
    pickMode('brackets');
    commit(field('pairs'), '0');
    expect(narration()).toContain('empty sequence');
    toLast();
    expect(stat('found')).toBe('1');
    commit(field('pairs'), '6');
    expect(narration()).toBe(m.pairsError(5));
    expect(field('pairs').value).toBe('0');
  });
});

describe('combinatorics practice', () => {
  it('checks an answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '21';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '35';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores answers the engine agrees with', () => {
    expect(/** @type {any} */ (m.practice[0]).answer).toBe(binomial(7, 3));
    expect(/** @type {any} */ (m.practice[1]).answer).toBe(
      lucasTrace(1000, 300, 13).at(-1)?.result,
    );
    expect(binomial(12, 4) % 2).toBe(/** @type {any} */ (m.practice[2]).answer === 0 ? 1 : 0);
    expect(/** @type {any} */ (m.practice[3]).answer).toBe(binomial(8, 4) - binomial(8, 5));
    expect(/** @type {any} */ (m.practice[3]).answer).toBe(catalan(4));
    expect(binomial(8, 4)).toBe(70);
  });
});
