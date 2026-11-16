// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/centroid-decomposition/copy.en.js';
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

/** @param {string} name @param {string} value */
function choose(name, value) {
  const el = /** @type {HTMLSelectElement} */ (document.querySelector(`select[name="${name}"]`));
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

/** @param {string} value */
function setK(value) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector('input[name="k"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
const centroidNode = (label) =>
  [...document.querySelectorAll('svg[role="img"] g')].some(
    (g) => g.querySelector('title')?.textContent?.startsWith(`Centroid ${label},`) ?? false,
  );

describe('centroid decomposition lesson', () => {
  it('walks to the first centroid and counts pairs through it', () => {
    render();
    expect(narration()).toContain('Decompose the whole tree, 14 nodes');
    next(2);
    expect(narration()).toBe(
      'B holds 8 nodes, more than half of 14: the centroid must be in there. Move to B.',
    );
    expect(node('B').getAttribute('aria-label')).toBe('Node B, subtree size 8, the walk is here');
    next(1);
    expect(narration()).toContain('B is the centroid: removing it leaves parts of 6, 5, 2.');
    next(1);
    expect(byTest('pairs')).toBe('10');
    expect(node('N').getAttribute('aria-label')).toBe(
      'Node N, distance 4 from the centroid, in the piece worked on',
    );
    next(1);
    expect(byTest('removed')).toBe('1');
    expect(centroidNode('B')).toBe(true);
    expect(node('D').getAttribute('aria-label')).toContain('in a piece waiting its turn');
  });

  it('finishes with the centroid tree and the pair count', () => {
    render();
    click(button('Last step'));
    expect(narration()).toBe(
      'Done: the centroid tree has 4 levels for 14 nodes, and 41 nodes were sized in all pieces together. Pairs exactly 3 edges apart: 16.',
    );
    expect(byTest('levels')).toBe('4');
    expect(byTest('removed')).toBe('14');
    expect(node('A').getAttribute('aria-label')).toContain('level 3 in the centroid tree');
  });

  it('recounts for a new K on the same step and refuses a bad K', () => {
    render();
    click(button('Last step'));
    setK('2');
    expect(byTest('pairs')).toBe('15');
    expect(byTest('levels')).toBe('4');
    setK('0');
    expect(narration()).toBe(m.errors.k(15));
    expect(byTest('pairs')).toBe('15');
  });

  it('splits a path in the middle and a star at its centre', () => {
    render();
    choose('preset', 'path');
    click(button('Last step'));
    expect(byTest('levels')).toBe('4');
    choose('preset', 'star');
    setK('2');
    click(button('Last step'));
    expect(byTest('pairs')).toBe('28');
    expect(byTest('levels')).toBe('2');
  });

  it('adds a child, removes a subtree, refuses the root and undoes', () => {
    render();
    click(node('N'));
    click(buttonByText('Add child'));
    expect(byTest('selected')).toBe('Selected: O');
    click(button('Last step'));
    expect(byTest('removed')).toBe('15');
    click(node('A'));
    click(buttonByText('Remove subtree'));
    expect(narration()).toBe(m.errors.root);
    click(node('B'));
    click(buttonByText('Remove subtree'));
    click(button('Last step'));
    expect(byTest('removed')).toBe('6');
    click(buttonByText('Undo'));
    click(buttonByText('Undo'));
    click(button('Last step'));
    expect(byTest('removed')).toBe('14');
  });

  it('refuses a seventeenth node', () => {
    render();
    for (let i = 0; i < 2; i++) click(buttonByText('Add child'));
    click(buttonByText('Add child'));
    expect(narration()).toBe(m.errors.full(16));
  });

  it('selects a node with the arrow keys and Enter', () => {
    render();
    const a = /** @type {SVGGElement} */ (node('A'));
    a.focus();
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flushSync();
    /** @type {SVGGElement} */ (document.activeElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    flushSync();
    expect(byTest('selected')).toBe('Selected: B');
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
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
