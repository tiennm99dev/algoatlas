// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { BACKTRACK_CAP, MAX_INPUT, MAX_REGEX } from '$lib/algo-engine/regular-expressions-nfa.js';
import { en as m } from '$lib/lessons/regular-expressions-nfa/copy.en.js';
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
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));
const titles = () => [...document.querySelectorAll('svg title')].map((t) => t.textContent ?? '');
const toLast = () => click(button('Last step'));
/** @param {string} kindText */
function stepUntil(kindText) {
  for (let i = 0; i < 500; i++) {
    if (narration().includes(kindText)) return;
    click(button('Next step'));
  }
  throw new Error(`never narrated ${kindText}`);
}

/** One wrong answer, a hint, then the right answer, on the first practice question. */
/** @param {string} wrong @param {string} right */
function checkFirstQuestion(wrong, right) {
  const section = /** @type {HTMLElement} */ (
    [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    )
  );
  const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[0]);
  const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  const submit = () => {
    q.querySelector('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    flushSync();
  };
  answer.value = wrong;
  answer.dispatchEvent(new Event('input', { bubbles: true }));
  submit();
  expect(q.textContent).toContain('Not quite');
  const hint = [...q.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === 'Show a hint',
  );
  click(/** @type {HTMLButtonElement} */ (hint));
  expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
  answer.value = right;
  answer.dispatchEvent(new Event('input', { bubbles: true }));
  submit();
  expect(q.textContent).toContain('Correct!');
  for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
}

const drawnStates = () => document.querySelectorAll('[data-state]').length;
const hotEdges = () => document.querySelectorAll('[data-hot="true"]').length;

describe('Regular expressions lesson', () => {
  it('grows the NFA piece by piece, then simulates to a verdict', () => {
    render();
    expect(narration()).toBe('Build the NFA of (a|b)*abb, starting from one state.');
    expect(drawnStates()).toBe(1);
    click(button('Next step'));
    expect(narration()).toContain('a: add a letter edge');
    expect(drawnStates()).toBe(4);
    stepUntil('(a|b)*: add a loop back');
    stepUntil('follow every ε edge from the start');
    expect(hotEdges()).toBeGreaterThan(0);
    stepUntil('Read a:');
    expect(titles().some((t) => t.includes('just reached'))).toBe(true);
    toLast();
    expect(narration()).toContain('aababb is accepted');
    expect(stat('verdict')).toBe('accepted');
    expect(document.body.textContent).toContain('b →');
  });

  it('rejects when the set empties, and stops reading', () => {
    render();
    commit(field('preset'), 'dead');
    stepUntil('The active set is empty');
    expect(stat('active')).toBe('0');
    toLast();
    expect(stat('verdict')).toBe('rejected');
  });

  it('decides the empty input from the start set', () => {
    render();
    commit(field('regex'), 'a*');
    commit(field('input'), '');
    expect(document.body.textContent).toContain(m.inputEmpty);
    toLast();
    expect(stat('verdict')).toBe('accepted');
    expect(narration()).toContain('the empty input is accepted');
    expect(stat('states')).toBe('4');
    expect(stat('edges')).toBe('5');
  });

  it('shows backtracking blow up where the simulation does not', () => {
    render();
    commit(field('preset'), 'blowup');
    toLast();
    expect(Number(stat('backtrack'))).toBeGreaterThan(8000);
    expect(Number(stat('checks'))).toBeLessThan(600);
    commit(field('regex'), '(a|a|a|a)*b');
    expect(stat('backtrack')).toBe(m.overCap(BACKTRACK_CAP));
  });

  it('keeps the drawing right when a shorter regex replaces a longer one', () => {
    render();
    toLast();
    commit(field('regex'), 'a');
    expect(drawnStates()).toBe(1);
    toLast();
    expect(drawnStates()).toBe(2);
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_REGEX, MAX_INPUT);
    const good = field('regex').value;
    for (const [bad, reason] of /** @type {const} */ ([
      ['(a', 'paren'],
      ['a|', 'branch'],
      ['*a', 'repeat'],
      ['a**', 'stacked'],
      ['a1', 'format'],
      [' ', 'empty'],
      ['a'.repeat(MAX_REGEX + 1), 'length'],
    ])) {
      commit(field('regex'), bad);
      expect(narration()).toBe(errors[reason]);
      expect(field('regex').value).toBe(good);
    }
    commit(field('input'), 'a1');
    expect(narration()).toBe(errors.inputFormat);
    commit(field('input'), 'a'.repeat(MAX_INPUT + 1));
    expect(narration()).toBe(errors.inputLength);
    expect(field('input').value).toBe('aababb');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    checkFirstQuestion('3', '4');
  });
});
