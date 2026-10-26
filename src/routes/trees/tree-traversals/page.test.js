// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/tree-traversals/copy.en.js';
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
/** @param {string} order */
const pick = (order) => click(field(`input[name="order"][value="${order}"]`));
/** @param {string} label */
const nodeTitle = (label) =>
  [...document.querySelectorAll('svg title')]
    .map((t) => t.textContent ?? '')
    .find((t) => t.startsWith(`Node ${label},`)) ?? '';

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('tree traversals lesson', () => {
  it('runs preorder with an explicit stack and numbers the nodes', () => {
    render();
    expect(narration()).toBe('Preorder: push “expand A”, the whole tree, on the stack.');
    click(button('Next step'));
    expect(narration()).toContain('Pop “expand A”.');
    click(button('Next step'));
    expect(narration()).toBe('Pop “visit A” and output it: visit number 1.');
    expect(nodeTitle('A')).toBe('Node A, visited 1st, acted on now');
    click(button('Last step'));
    expect(narration()).toBe('Done: preorder is A B D E C F. Every node was visited once.');
    expect(byTest('visited')).toBe('6 of 6');
    expect(byTest('pushes')).toBe('12');
    expect(byTest('all-orders')).toContain('D B E A C F');
  });

  it('switches to level order with a queue', () => {
    render();
    pick('level');
    expect(narration()).toBe('Level order: put the root A in the queue.');
    expect(document.body.textContent).toContain('Queue (front → back)');
    click(button('Last step'));
    expect(narration()).toContain('level order is A B C D E F');
    expect(byTest('pushes')).toBe('6');
    expect(nodeTitle('F')).toBe('Node F, visited 6th');
  });

  it('reads the expression preset in postorder', () => {
    render();
    commit(
      /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]')),
      'expression',
    );
    pick('post');
    click(button('Last step'));
    expect(narration()).toContain('postorder is a b + c d − ×');
  });

  it('accepts an edited tree and refuses an orphan, keeping the last valid one', () => {
    render();
    commit(field('input[name="tree"]'), 'A - B C');
    expect(narration()).toBe(m.treeErrors.orphan);
    expect(field('input[name="tree"]').value).toBe('A, B, C, D, E, -, F');
    commit(field('input[name="tree"]'), 'R L');
    pick('in');
    click(button('Last step'));
    expect(narration()).toContain('inorder is L R');
    expect(field('input[name="tree"]').value).toBe('R, L');
  });

  it('steps back with the arrow keys', () => {
    render();
    click(button('Last step'));
    const before = narration();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    flushSync();
    expect(narration()).not.toBe(before);
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
    answer.value = 'A B D E C F';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = 'd e b f c a';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
