// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/singly-linked-lists/copy.en.js';
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

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const listLabel = () => document.querySelector('svg[role="img"]')?.getAttribute('aria-label') ?? '';
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

describe('singly linked lists lesson', () => {
  it('builds the four-node preset by inserting at the head', () => {
    render();
    expect(narration()).toBe('The list is empty: head is null.');
    click(button('Last step'));
    expect(listLabel()).toBe('Singly linked list, head first: 12 → 7 → 30 → 4 → null.');
    expect(byTest('length')).toBe('4');
  });

  it('inserts at the head in two pointer writes', () => {
    render();
    commit(input('value'), '15');
    click(buttonByText('Insert at head'));
    expect(narration()).toContain('Make a node for 15 and point its next at the current head, 12.');
    expect(document.querySelector('[data-link]')).not.toBeNull();
    expect(document.querySelector('[data-pointer="node"]')).not.toBeNull();
    next(1);
    expect(narration()).toContain('Move head to the new node');
    expect(byTest('writes')).toBe('2');
    expect(byTest('steps')).toBe('0');
    click(button('Last step'));
    expect(listLabel()).toContain('15 → 12 → 7 → 30 → 4 → null');
  });

  it('walks index by index to read a value', () => {
    render();
    commit(input('index'), '2');
    click(buttonByText('Get index'));
    expect(narration()).toContain('cur starts at head, 12');
    next(2);
    expect(byTest('steps')).toBe('2');
    next(1);
    expect(narration()).toContain('Index 2 holds 30, reached after 2 hops');
  });

  it('reports an index past the end', () => {
    render();
    commit(input('index'), '6');
    click(buttonByText('Get index'));
    next(5);
    expect(narration()).toContain('Index 6 is past the end');
  });

  it('deletes a middle value by rewiring prev.next', () => {
    render();
    commit(input('value'), '30');
    click(buttonByText('Delete value'));
    for (let i = 0; i < 6 && !narration().includes('skips'); i++) next(1);
    expect(narration()).toContain('prev.next skips over 30: node 7 now points where 30 pointed.');
    expect(byTest('writes')).toBe('1');
    click(button('Last step'));
    expect(listLabel()).toContain('12 → 7 → 4 → null');
  });

  it('deletes the head, and refuses nothing on an empty list', () => {
    render();
    click(buttonByText('Delete head'));
    click(button('Last step'));
    expect(listLabel()).toContain('7 → 30 → 4 → null');
    click(buttonByText('Reset'));
    click(buttonByText('Delete head'));
    expect(narration()).toBe('Head is null: there is nothing to delete.');
  });

  it('keeps the last valid value and index when a field is emptied or out of range', () => {
    render();
    commit(input('value'), '45');
    commit(input('value'), '');
    expect(input('value').value).toBe('45');
    commit(input('value'), '150');
    expect(input('value').value).toBe('45');
    commit(input('index'), '12');
    expect(input('index').value).toBe('2');
  });

  it('refuses an insert into a full list and shows it in place of the narration', () => {
    render();
    for (const v of [1, 2, 3, 4, 5, 6, 7]) {
      commit(input('value'), String(v));
      click(buttonByText('Insert at head'));
    }
    expect(narration()).toBe('The list is full (10 nodes). Delete a node first.');
    next(1);
    expect(narration()).not.toContain('full');
  });

  it('undoes the last operation and loads a preset', () => {
    render();
    click(buttonByText('Delete head'));
    click(buttonByText('Undo last'));
    expect(listLabel()).toContain('12 → 7 → 30 → 4 → null');
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'long');
    expect(listLabel()).toContain('5 → 18 → 23 → 41 → 9 → 64 → 37 → 50 → null');
  });

  it('inserts when Enter submits the form', () => {
    render();
    commit(input('value'), '8');
    const form = /** @type {HTMLFormElement} */ (input('value').closest('form'));
    form.requestSubmit();
    flushSync();
    expect(narration()).toContain('Make a node for 8');
    expect(buttonByText('Delete head').type).toBe('button');
    expect(buttonByText('Get index').type).toBe('button');
  });

  it('steps back with the arrow keys from the step controls', () => {
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
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('labels every node in the drawing', () => {
    render();
    click(button('Last step'));
    expect(text()).toContain('head');
    expect(document.querySelectorAll('svg[role="img"] title')).toHaveLength(4);
  });
});
