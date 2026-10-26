// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/doubly-circular-lists/copy.en.js';
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
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const listLabel = () =>
  document.querySelector('svg[role="group"]')?.getAttribute('aria-label') ?? '';
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

/** @param {number} id */
const node = (id) => /** @type {SVGGElement} */ (document.querySelector(`g[data-node="${id}"]`));
/** @param {string} key */
const link = (key) => document.querySelector(`path[data-link="${key}"]`);

describe('doubly and circular linked lists lesson', () => {
  it('opens on a removal and shows both pointer updates', () => {
    render();
    expect(narration()).toContain('Remove 20. We already hold the node');
    next(1);
    expect(narration()).toBe('10.next = 30: walking forward now skips 20.');
    expect(byTest('writes')).toBe('1');
    expect(link('0-next')?.getAttribute('class')).toContain('stroke-teal-700');
    next(1);
    expect(narration()).toBe('30.prev = 10: walking backward skips 20 too.');
    expect(link('2-prev')?.getAttribute('class')).toContain('stroke-teal-700');
    next(1);
    expect(narration()).toBe('20 is freed after 2 pointer writes. The list holds 3 nodes.');
    click(button('Last step'));
    expect(listLabel()).toBe(
      'Circular doubly linked list: S ⇄ 10 ⇄ 30 ⇄ 40 ⇄ back to S. Backwards: 40, 30, 10.',
    );
  });

  it('removes a node picked in the drawing', () => {
    render();
    click(node(2));
    expect(byTest('selected')).toBe('30');
    click(buttonByText('Remove selected'));
    expect(narration()).toContain('Remove 30.');
    click(button('Last step'));
    expect(listLabel()).toContain('S ⇄ 10 ⇄ 40 ⇄ back to S');
    expect(byTest('selected')).toBe('none');
  });

  it('picks a node with the arrow keys and Enter', () => {
    render();
    const first = /** @type {SVGGElement} */ (document.querySelector('g[data-index="0"]'));
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    const second = /** @type {SVGGElement} */ (document.activeElement);
    expect(second.getAttribute('data-index')).toBe('1');
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(byTest('selected')).toBe('10');
  });

  it('refuses to remove the sentinel or nothing at all', () => {
    render();
    click(buttonByText('Remove selected'));
    expect(narration()).toBe(m.pickFirst);
    click(node(-2));
    expect(narration()).toBe(m.sentinelPick);
  });

  it('counts special cases only in the head and tail design', () => {
    render();
    click(button('Last step'));
    expect(byTest('special')).toBe('0');
    commit(
      /** @type {HTMLInputElement} */ (document.querySelectorAll('input[name="mode"]')[1]),
      'plain',
    );
    click(button('Last step'));
    expect(byTest('special')).toBe('1');
    expect(listLabel()).toBe(
      'Doubly linked list: null ← 10 ⇄ 30 ⇄ 40 → null. Backwards: 40, 30, 10.',
    );
    click(node(0));
    click(buttonByText('Remove selected'));
    next(1);
    expect(narration()).toBe('10 has no node before it, so head moves to 30. A special case.');
    expect(byTest('special')).toBe('2');
  });

  it('inserts at the front after the sentinel', () => {
    render();
    commit(input('value'), '5');
    click(buttonByText('Insert at front'));
    expect(narration()).toBe(
      'Make a node for 5 with prev = S and next = 10. Nothing points at it yet.',
    );
    click(button('Last step'));
    expect(listLabel()).toContain('S ⇄ 5 ⇄ 10 ⇄ 30 ⇄ 40 ⇄ back to S');
  });

  it('inserts at the back when Enter submits the form', () => {
    render();
    commit(input('value'), '50');
    const form = /** @type {HTMLFormElement} */ (input('value').closest('form'));
    form.requestSubmit();
    flushSync();
    click(button('Last step'));
    expect(listLabel()).toContain('40 ⇄ 50 ⇄ back to S');
    expect(buttonByText('Insert at front').type).toBe('button');
  });

  it('keeps the last valid value when the field is emptied or out of range', () => {
    render();
    commit(input('value'), '');
    expect(input('value').value).toBe('25');
    commit(input('value'), '120');
    expect(input('value').value).toBe('25');
  });

  it('empties down to the sentinel on reset and refills from a preset', () => {
    render();
    click(buttonByText('Reset'));
    expect(listLabel()).toContain('only the sentinel S');
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'front');
    expect(listLabel()).toContain('S ⇄ 40 ⇄ 30 ⇄ 20 ⇄ 10 ⇄ back to S');
    click(buttonByText('Undo last'));
    expect(listLabel()).toContain('S ⇄ 30 ⇄ 20 ⇄ 10 ⇄ back to S');
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
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
