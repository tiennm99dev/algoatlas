// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-union-find/copy.en.js';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const el = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}
/** @param {string} name */
const select = (name) =>
  /** @type {HTMLSelectElement} */ (document.querySelector(`select[name="${name}"]`));
const graphLabel = () =>
  document.querySelector('svg[role="img"]')?.getAttribute('aria-label') ?? '';

describe('union-find practice lesson', () => {
  it('runs the road network to two components and three cycle edges', () => {
    render();
    expect(narration()).toContain('9 edges will arrive one at a time');
    expect(statValue('Components')).toBe('8');
    click(button('Last step'));
    expect(narration()).toBe(
      'All 9 edges processed: 2 components, 3 edges closed a cycle, the first was #4.',
    );
    expect(statValue('Edges that merged')).toBe('6');
    expect(statValue('First cycle edge')).toBe('#4');
    expect(graphLabel()).toContain('{A, B, C, D, E, F, G}, {H}');
    expect(graphLabel()).toContain('A–D, G–E, B–F');
  });

  it('flags the edge that closes the first cycle', () => {
    render();
    for (let i = 0; i < 7; i++) click(button('Next step'));
    expect(narration()).toBe('Edge #4 A–D: find(A) = A, find(D) = A.');
    click(button('Next step'));
    expect(narration()).toContain('#4 A–D closes a cycle');
    expect(text()).toContain('#4 A–D ✕');
    expect(text()).toContain('#4: 5');
  });

  it('adds an edge with Enter and refuses loops and repeats', () => {
    render();
    commit(select('from'), '7');
    commit(select('to'), '0');
    const form = /** @type {HTMLFormElement} */ (select('from').closest('form'));
    form.requestSubmit();
    flushSync();
    expect(narration()).toBe('Edge #10 H–A: find(H) = H, find(A) = A.');
    click(button('Last step'));
    expect(statValue('Components')).toBe('1');
    commit(select('to'), '7');
    click(buttonByText('Add edge'));
    expect(narration()).toBe(m.edits.loop);
    commit(select('from'), '0');
    commit(select('to'), '1');
    click(buttonByText('Add edge'));
    expect(narration()).toBe(m.edits.repeat);
    expect(text()).not.toContain('#11');
  });

  it('undoes, clears and loads the spanning tree stream', () => {
    render();
    click(buttonByText('Undo last'));
    click(button('Last step'));
    expect(statValue('Edges that closed a cycle')).toBe('2');
    click(buttonByText('Clear'));
    expect(text()).toContain('no edges yet');
    expect(buttonByText('Clear').getAttribute('aria-disabled')).toBe('true');
    commit(select('preset'), 'tree');
    click(button('Last step'));
    expect(statValue('Components')).toBe('1');
    expect(statValue('First cycle edge')).toBe('—');
  });

  it('refuses a seventeenth edge', () => {
    render();
    const pairs = [
      [0, 2],
      [0, 4],
      [0, 5],
      [0, 6],
      [0, 7],
      [1, 3],
      [1, 4],
    ];
    for (const [u, v] of pairs) {
      commit(select('from'), String(u));
      commit(select('to'), String(v));
      click(buttonByText('Add edge'));
    }
    expect(text()).toContain('#16');
    commit(select('from'), '1');
    commit(select('to'), '6');
    click(buttonByText('Add edge'));
    expect(narration()).toBe(m.edits.full);
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '1');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '2');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
