// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/branch-and-bound/copy.en.js';
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

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));

describe('branch and bound lesson', () => {
  it('steps from the root bound to the optimum', () => {
    render();
    expect(narration()).toContain('the bound is 175');
    click(button('Next step'));
    expect(narration()).toContain('highest bound is 175');
    click(button('Next step'));
    expect(narration()).toContain('Take D: value 95 is a new best');
    expect(byTest('best')).toBe('95');
    click(button('Last step'));
    expect(byTest('best')).toBe('150');
    expect(byTest('made')).toBe('21');
    expect(byTest('expanded')).toBe('10');
    expect(byTest('pruned')).toBe('7');
    expect(byTest('plain')).toBe('With no bound: 27.');
    expect(narration()).toContain('so 150 is the optimum');
  });

  it('shows the items in value-per-weight order', () => {
    render();
    const rows = [...document.querySelectorAll('[data-testid="items"] tbody th')];
    expect(rows.map((r) => r.textContent)).toEqual(['D', 'A', 'C', 'B']);
  });

  it('compares the two search orders', () => {
    render();
    commit(field('select[name="preset"]'), 'order');
    click(button('Last step'));
    expect(byTest('made')).toBe('27');
    click(field('input[name="order"][value="depth"]'));
    click(button('Last step'));
    expect(byTest('made')).toBe('71');
    expect(byTest('best')).toBe('87');
  });

  it('edits the items and the capacity', () => {
    render();
    commit(field('input[name="items"]'), '1:10 2:15');
    click(button('Last step'));
    expect(byTest('best')).toBe('25');
    commit(field('input[name="capacity"]'), '1');
    click(button('Last step'));
    expect(byTest('best')).toBe('10');
    expect(field('select[name="preset"]').value).toBe('');
  });

  it('refuses bad input and keeps the last valid values', () => {
    render();
    commit(field('input[name="items"]'), '2-40');
    expect(narration()).toBe(
      'Enter 1 to 6 items as weight:value, each a whole number from 1 to 99.',
    );
    expect(field('input[name="items"]').value).toBe('2:40 3:50 5:100 4:95');
    commit(field('input[name="capacity"]'), '0');
    expect(narration()).toBe('The capacity must be a whole number from 1 to 99.');
    expect(field('input[name="capacity"]').value).toBe('8');
  });

  it('jumps to a node by pointer and keyboard', () => {
    render();
    click(button('Last step'));
    click(/** @type {Element} */ (document.querySelector('[data-node="0"]')));
    expect(byTest('made')).toBe('1');
    click(button('Last step'));
    /** @type {Element} */ (document.querySelector('[data-node="0"]')).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(byTest('made')).toBe('1');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelector('li[aria-labelledby]'));
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '150';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('Sort by value per weight');
    answer.value = '175';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Not quite');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
