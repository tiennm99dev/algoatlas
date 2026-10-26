// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/nary-trees/copy.en.js';
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

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

/** @param {HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} label */
const node = (label) => {
  const el = [...document.querySelectorAll('g[role="button"]')].find((g) => {
    const name = g.getAttribute('aria-label') ?? '';
    return name === `Node ${label}` || name.startsWith(`Node ${label},`);
  });
  if (!el) throw new Error(`no node ${label}`);
  return el;
};
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
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

describe('n-ary trees and tree recursion lesson', () => {
  it('bubbles sizes up and finds the diameter', () => {
    render();
    expect(narration()).toBe(
      'Call dfs on the root A. Each call returns its subtree’s size and height.',
    );
    next(1);
    expect(narration()).toBe(
      'Enter A: size starts at 1 (the node itself). A has 3 children to ask.',
    );
    next(2);
    expect(narration()).toBe(
      'Enter B: size starts at 1 (the node itself). B has 2 children to ask.',
    );
    next(4);
    expect(narration()).toBe(
      'C reports size 1 and height 0. B’s size grows to 2; its two tallest children are now a = 0, b = −1.',
    );
    click(button('Last step'));
    expect(narration()).toBe(
      'Done: 10 nodes, height 3, diameter 5 edges: H – G – F – A – B – C, bending at A.',
    );
    expect(byTest('size')).toBe('10');
    expect(byTest('diameter')).toBe('5');
    expect(node('F').getAttribute('aria-label')).toBe(
      'Node F, subtree size 5, height 2, on the diameter path',
    );
  });

  it('finds a diameter that bends away from the root', () => {
    render();
    commit(presetSelect(), 'skewed');
    expect(narration()).toContain('diameter 5 edges: E – D – C – B – F – G, bending at B.');
  });

  it('adds a child under the selected node and updates the sizes', () => {
    render();
    click(node('E'));
    expect(byTest('selected')).toBe('Selected: E');
    click(buttonByText('Add child'));
    expect(byTest('selected')).toBe('Selected: K');
    expect(byTest('size')).toBe('11');
    expect(byTest('lists')).toContain('E: K');
    expect(node('E').getAttribute('aria-label')).toContain('subtree size 2, height 1');
  });

  it('refuses a node too deep, too many children and removing the root', () => {
    render();
    commit(presetSelect(), 'path');
    click(node('E'));
    click(buttonByText('Add child'));
    expect(narration()).toBe(m.errors.depth(4));
    commit(presetSelect(), 'star');
    click(node('A'));
    click(buttonByText('Add child'));
    expect(narration()).toBe(m.errors.wide('A', 6));
    click(buttonByText('Remove subtree'));
    expect(narration()).toBe(m.errors.root);
    expect(byTest('size')).toBe('7');
  });

  it('removes a subtree and undoes it', () => {
    render();
    click(node('F'));
    click(buttonByText('Remove subtree'));
    expect(byTest('size')).toBe('5');
    expect(byTest('selected')).toBe('Selected: A');
    click(buttonByText('Undo'));
    expect(byTest('size')).toBe('10');
  });

  it('moves between nodes with the arrow keys and picks with Enter', () => {
    render();
    const a = /** @type {SVGGElement} */ (node('A'));
    a.focus();
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flushSync();
    const b = /** @type {SVGGElement} */ (document.activeElement);
    b.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    /** @type {SVGGElement} */ (document.activeElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    flushSync();
    expect(byTest('selected')).toBe('Selected: E');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
