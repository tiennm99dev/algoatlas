// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/comparison-sort-lower-bound/copy.en.js';

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

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
  return el;
}

/** @param {Element} el */
function click(el) {
  /** @type {HTMLElement} */ (el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} prefix */
const node = (prefix) => {
  const el = [...document.querySelectorAll('g[role="button"]')].find((g) =>
    g.getAttribute('aria-label')?.startsWith(prefix),
  );
  if (!el) throw new Error(`no tree node ${prefix}`);
  return el;
};
/** @param {string} label */
const stat = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();

/** @param {string} value */
function pickAlgo(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('comparison sort lower bound lesson', () => {
  it('walks the insertion tree for C < A < B in three questions', () => {
    render();
    expect(stat(m.stats.possible)).toBe('6');
    click(button('Next step'));
    expect(text()).toContain('Is B < A? No. 3 of 6 orders still fit.');
    click(button('Next step'));
    expect(text()).toContain('Is C < B? Yes. 2 of 6 orders still fit.');
    click(button('Last step'));
    expect(text()).toContain('Leaf reached after 3 comparisons: the sorted order is C < A < B.');
    expect(stat(m.stats.possible)).toBe('1');
    expect(node('Leaf: C < A < B').getAttribute('aria-label')).toContain('the answer');
  });

  it('reaches a sorted input in two comparisons', () => {
    render();
    commit(
      /** @type {HTMLSelectElement} */ (document.querySelector('select[name="order"]')),
      'ABC',
    );
    click(button('Last step'));
    expect(text()).toContain('Leaf reached after 2 comparisons: the sorted order is A < B < C.');
  });

  it('counts the leaves and height of each tree', () => {
    render();
    expect(stat(m.stats.height)).toBe('3');
    expect(stat(m.stats.leaves)).toBe('6 / 0');
    pickAlgo('selection');
    expect(stat(m.stats.leaves)).toBe('6 / 2');
    expect(document.querySelectorAll('g[role="button"]')).toHaveLength(15);
    expect(node('Impossible leaf')).toBeTruthy();
  });

  it('sets the hidden order from a clicked leaf and refuses other nodes', () => {
    render();
    click(node('Leaf: B < C < A'));
    expect(text()).toContain('Hidden order set to B < C < A.');
    expect(
      /** @type {HTMLSelectElement} */ (document.querySelector('select[name="order"]')).value,
    ).toBe('BCA');
    click(node('Question: is B < A?'));
    expect(text()).toContain('Click a leaf to pick its order as the hidden input.');
    pickAlgo('selection');
    click(node('Impossible leaf'));
    expect(text()).toContain('No input order reaches this leaf');
  });

  it('picks a leaf with the keyboard', () => {
    render();
    /** @param {string} key */
    const press = (key) => {
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      flushSync();
    };
    /** @type {SVGElement} */ (node('Question: is B < A?')).focus();
    press('ArrowDown');
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^Question: is C < A\?/);
    press('ArrowDown');
    press('ArrowDown');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Leaf: C < B < A');
    press('Enter');
    expect(text()).toContain('Hidden order set to C < B < A.');
  });

  it('computes the bound for any n and refuses bad n', () => {
    render();
    expect(text()).toContain('3,628,800');
    const n = /** @type {HTMLInputElement} */ (document.querySelector('input[name="bound-n"]'));
    commit(n, '5');
    expect(text()).toMatch(/Worst case at least ⌈log₂ n!⌉\s*7/);
    expect(text()).toContain('120');
    commit(n, '25');
    expect(text()).toContain('n must be a whole number from 1 to 20.');
    expect(n.value).toBe('5');
  });

  it('checks the first practice question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '16';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '24';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
