// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/heavy-light-decomposition/copy.en.js';
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
function setValue(value) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector('input[name="value"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

describe('heavy-light decomposition lesson', () => {
  it('sizes subtrees, then numbers the chains heavy child first', () => {
    render();
    expect(narration()).toContain('First walk (dfs1)');
    expect(byTest('array-empty')).toBe(m.arrayEmpty);
    next(2);
    expect(narration()).toBe(
      'H has size 2. Its largest child is M (size 1), so H–M is a heavy edge.',
    );
    next(14);
    expect(narration()).toBe(
      'Second walk (dfs2): the root A starts the first chain at position 0.',
    );
    next(5);
    expect(narration()).toBe('I hangs on a light edge: it starts a new chain at position 5.');
    expect(byTest('array-empty')).toBeUndefined();
    expect(node('I').getAttribute('aria-label')).toBe(
      'Node I, value 5, position 5 on chain I, worked on now',
    );
    expect(byTest('chains')).toBeUndefined();
  });

  it('splits the path M – L into three chain ranges', () => {
    render();
    click(button('Last step'));
    expect(narration()).toBe(
      'Path sum = 8 + 6 + 20 = 34, from 3 ranges and 29 segment-tree nodes. Walking the path one node at a time reads 8 nodes.',
    );
    expect(byTest('sum')).toBe('34');
    expect(byTest('ranges')).toBe('3');
    expect(byTest('walk')).toBe('8');
    expect(node('G').getAttribute('aria-label')).toContain('already summed');
    expect(node('K').getAttribute('aria-label')).not.toContain('summed');
    expect(document.body.textContent).toContain('A–B–D–H–M');
  });

  it('re-runs the query on a new u and opens on the query', () => {
    render();
    choose('u', '10');
    expect(narration()).toBe(
      'Every chain is now a block of positions. Sum the values on the path K – L (3 nodes).',
    );
    click(button('Last step'));
    expect(byTest('sum')).toBe(String(5 + 2 + 8));
    expect(byTest('ranges')).toBe('2');
  });

  it('answers a path query on one chain with a single range', () => {
    render();
    choose('preset', 'path');
    click(button('Last step'));
    expect(byTest('ranges')).toBe('1');
    expect(byTest('sum')).toBe('30');
  });

  it('changes a value, refuses a bad one and undoes', () => {
    render();
    click(node('L'));
    setValue('0');
    click(button('Last step'));
    expect(byTest('sum')).toBe('26');
    setValue('12');
    expect(narration()).toBe(m.errors.value(9));
    click(buttonByText('Undo'));
    click(button('Last step'));
    expect(byTest('sum')).toBe('34');
  });

  it('adds a child, removes a subtree and refuses the root', () => {
    render();
    click(node('M'));
    click(buttonByText('Add child'));
    expect(byTest('selected')).toBe('Selected: P');
    click(node('A'));
    click(buttonByText('Remove subtree'));
    expect(narration()).toBe(m.errors.root);
    click(node('C'));
    click(buttonByText('Remove subtree'));
    // L went with C's subtree, so v falls back to the root A.
    click(button('Last step'));
    expect(byTest('sum')).toBe(String(3 + 1 + 1 + 6 + 9));
    expect(byTest('ranges')).toBe('1');
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
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
