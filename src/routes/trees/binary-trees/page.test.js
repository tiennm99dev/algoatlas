// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/binary-trees/copy.en.js';
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
  /** @type {HTMLElement} */ (el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
/** @param {string} start */
const node = (start) => {
  const el = [...document.querySelectorAll('g[role="button"]')].find((g) =>
    g.getAttribute('aria-label')?.startsWith(start),
  );
  if (!el) throw new Error(`no node ${start}`);
  return /** @type {SVGGElement} */ (el);
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

describe('binary trees and terminology lesson', () => {
  it('measures depth on the way down and height on the way up', () => {
    render();
    expect(narration()).toBe('Call measure on the root A with depth 0.');
    next(1);
    expect(narration()).toBe('A is the root, so its depth is 0.');
    next(2);
    expect(narration()).toBe('B is one edge below its parent, so its depth is 1.');
    next(3);
    expect(narration()).toBe('D has no children: it is a leaf, with height 0.');
    expect(byTest('height')).toBe('?');
    click(button('Last step'));
    expect(narration()).toBe(
      'Done: height 2, 3 leaves. A perfect tree of this height would have 7 nodes.',
    );
    expect(byTest('height')).toBe('2');
    expect(byTest('prop-full')).toBe('no');
    expect(byTest('prop-complete')).toBe('yes');
    expect(node('Node A').getAttribute('aria-label')).toBe('Node A, depth 0, height 2, measured');
  });

  it('adds a child to the selected node and labels it at once', () => {
    render();
    click(node('Node C'));
    expect(byTest('selected')).toBe('Selected: C');
    expect(byTest('slot-math')).toBe(
      'Slot 2: parent ⌊(i − 1) / 2⌋ = 0, children 2i + 1 = 5 and 2i + 2 = 6.',
    );
    click(buttonByText('Add right child'));
    expect(byTest('size')).toBe('7');
    expect(byTest('prop-full')).toBe('yes');
    expect(byTest('prop-perfect')).toBe('yes');
    expect(node('Node G').getAttribute('aria-label')).toContain('depth 2, height 0');
  });

  it('refuses a taken child and a child that would be too deep', () => {
    render();
    click(node('Node A'));
    click(buttonByText('Add left child'));
    expect(narration()).toBe('A already has a left child.');
    commit(presetSelect(), 'chain');
    click(node('Node D'));
    click(buttonByText('Add left child'));
    expect(narration()).toBe(m.errors.depth(3));
    expect(byTest('size')).toBe('4');
  });

  it('shows the chain wasting array slots', () => {
    render();
    commit(presetSelect(), 'chain');
    expect(byTest('array')).toBe('15');
    expect(byTest('prop-complete')).toBe('no');
    const frames = document.querySelectorAll('[aria-label^="Slot "]');
    expect(frames.length).toBe(15);
  });

  it('removes a subtree, undoes it, and empties the tree', () => {
    render();
    click(node('Node B'));
    click(buttonByText('Remove subtree'));
    expect(byTest('size')).toBe('3');
    expect(byTest('selected')).toBe('Selected: A');
    click(buttonByText('Undo'));
    expect(byTest('size')).toBe('6');
    click(node('Node A'));
    click(buttonByText('Remove subtree'));
    expect(byTest('size')).toBe('0');
    click(buttonByText('Add root'));
    expect(byTest('size')).toBe('1');
    expect(narration()).toContain('Perfect');
  });

  it('selects a node from the array row and with the keyboard', () => {
    render();
    click(/** @type {Element} */ (document.querySelector('[aria-label="Slot 4: E"]')));
    expect(byTest('selected')).toBe('Selected: E');
    const a = node('Node A');
    a.focus();
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flushSync();
    /** @type {HTMLElement} */ (document.activeElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    flushSync();
    expect(byTest('selected')).toBe('Selected: B');
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
    answer.value = '8';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
