// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/stack-applications/copy.en.js';
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
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const stackLabel = () =>
  [...document.querySelectorAll('svg[role="img"]')]
    .map((s) => s.getAttribute('aria-label') ?? '')
    .find((l) => l.startsWith('Stack') || l.startsWith('The stack')) ?? '';
/** @param {string} value */
const pickMode = (value) =>
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="mode"][value="${value}"]`)
    ),
  );
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

describe('stack applications lesson', () => {
  it('checks the nested preset, pushing openers and popping on matches', () => {
    render();
    expect(narration()).toContain('The stack starts empty');
    next(3);
    expect(narration()).toBe(
      'character 3 is (, an opening bracket: push it. It waits for its partner.',
    );
    expect(stackLabel()).toBe('Stack, bottom to top: {, [, (.');
    next(1);
    expect(narration()).toContain('the top was (: they match, so pop it');
    click(button('Last step'));
    expect(byTest('verdict')).toBe('balanced');
    expect(byTest('depth')).toBe('3');
  });

  it('stops at a closer that meets the wrong opener', () => {
    render();
    commit(input('brackets'), '(a[b)]');
    click(button('Last step'));
    click(button('Previous step'));
    expect(narration()).toContain('character 5 is ), but the top is [');
    expect(byTest('verdict')).toBe('unbalanced');
  });

  it('reports openers left at the end and a closer with nothing open', () => {
    render();
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'open');
    click(button('Last step'));
    click(button('Previous step'));
    expect(narration()).toContain('1 opener never closed');
    commit(input('brackets'), ')');
    next(1);
    expect(narration()).toContain('the stack is empty: no opener is waiting');
  });

  it('refuses text longer than 24 characters', () => {
    render();
    commit(input('brackets'), '('.repeat(25));
    expect(narration()).toBe(m.bracketErrors.count);
    expect(input('brackets').value).toBe('{[()()]}');
  });

  it('evaluates postfix, popping b then a', () => {
    render();
    pickMode('postfix');
    commit(input('postfix'), '8 3 -');
    next(3);
    expect(narration()).toBe('- is an operator: pop b = 3, then a = 8.');
    click(button('Last step'));
    expect(byTest('verdict')).toBe('5');
  });

  it('rejects a bad postfix token and keeps the expression', () => {
    render();
    pickMode('postfix');
    commit(input('postfix'), '3 x +');
    expect(narration()).toBe(m.postfixErrors.format);
    expect(input('postfix').value).toBe('3 4 + 2 *');
  });

  it('reports a missing operand', () => {
    render();
    pickMode('postfix');
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'missing');
    click(button('Last step'));
    click(button('Previous step'));
    expect(narration()).toContain('+ needs two values, but the stack holds 1');
  });

  it('grows and unwinds the call stack of fact(n)', () => {
    render();
    pickMode('calls');
    commit(input('n'), '3');
    next(3);
    expect(stackLabel()).toBe('Stack, bottom to top: fact(3), fact(2), fact(1).');
    next(2);
    expect(narration()).toBe('fact(2) resumes: 2 × 1 = 2. Return it and pop the frame.');
    click(button('Last step'));
    expect(byTest('verdict')).toBe('fact = 6');
    commit(input('n'), '12');
    expect(narration()).toBe(m.nError);
    expect(input('n').value).toBe('3');
  });

  it('commits the field when Enter submits the form', () => {
    render();
    input('brackets').value = '()';
    input('brackets').dispatchEvent(new Event('input', { bubbles: true }));
    /** @type {HTMLFormElement} */ (input('brackets').closest('form')).requestSubmit();
    flushSync();
    click(button('Last step'));
    expect(byTest('pushes')).toBe('1');
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
    answer.value = '20';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '30';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
