// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/disjoint-set-union/copy.en.js';
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

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
const preset = () => /** @type {HTMLSelectElement} */ (document.querySelector('select'));
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

describe('disjoint set union lesson', () => {
  it('starts with every element alone and ends the friends preset at five sets', () => {
    render();
    expect(narration()).toContain('Every element starts alone');
    expect(statValue('Sets')).toBe('10');
    click(button('Last step'));
    expect(narration()).toBe(
      'Done: 5 sets, tallest tree 2 links, 10 parent links followed in total.',
    );
    expect(text()).toContain('{0, 1, 2, 3}');
    expect(text()).toContain('{4, 5, 6}');
  });

  it('walks a find from an element up to its root', () => {
    render();
    commit(field('a'), '3');
    click(buttonByText('Find a'));
    expect(narration()).toContain('find(3): start at 3');
    click(button('Next step'));
    expect(narration()).toBe('parent[3] = 2, so climb to 2.');
    click(button('Next step'));
    expect(narration()).toBe('parent[2] = 0, so climb to 0.');
    click(button('Next step'));
    expect(narration()).toContain('0 is the root');
    expect(statValue('Links followed (this operation)')).toBe('2');
  });

  it('merges two sets with union and answers same-set queries', () => {
    render();
    commit(field('a'), '6');
    commit(field('b'), '9');
    click(buttonByText('Union'));
    click(button('Last step'));
    expect(statValue('Sets')).toBe('4');
    commit(field('a'), '9');
    commit(field('b'), '5');
    click(buttonByText('Same set?'));
    click(button('Last step'));
    expect(text()).not.toContain('{9}');
    click(button('Previous step'));
    expect(narration()).toBe('Both roots are 4: yes, 9 and 5 are in the same set.');
  });

  it('runs union when Enter submits the form', () => {
    render();
    commit(field('a'), '7');
    commit(field('b'), '8');
    const form = /** @type {HTMLFormElement} */ (field('a').closest('form'));
    form.requestSubmit();
    flushSync();
    expect(narration()).toContain('Find the root of a = 7');
    expect(buttonByText('Same set?').type).toBe('button');
  });

  it('runs find on a node picked with Enter in the forest', () => {
    render();
    const node = /** @type {HTMLElement} */ (document.querySelector('g[role="button"]'));
    node.focus();
    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toMatch(/^find\(\d\): start at \d/);
    expect(text()).toMatch(/find\(\d\)/);
  });

  it('builds a tall chain with the chain preset', () => {
    render();
    commit(preset(), 'chain');
    expect(statValue('Tallest tree (links)')).toBe('6');
    expect(statValue('Links followed (total)')).toBe('6');
  });

  it('keeps the last valid element and refuses invalid input', () => {
    render();
    commit(field('a'), '5');
    commit(field('a'), '12');
    expect(field('a').value).toBe('5');
    commit(field('b'), '');
    expect(field('b').value).toBe('4');
  });

  it('undoes, resets and refuses a full log', () => {
    render();
    click(buttonByText('Undo last'));
    click(button('Last step'));
    expect(narration()).toContain('Done: 5 sets');
    click(buttonByText('Reset'));
    expect(text()).toContain('none yet');
    expect(buttonByText('Reset').getAttribute('aria-disabled')).toBe('true');
    for (let i = 0; i < 17; i++) click(buttonByText('Find a'));
    expect(narration()).toBe(m.logFull);
    click(button('Next step'));
    expect(narration()).not.toBe(m.logFull);
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '5');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
