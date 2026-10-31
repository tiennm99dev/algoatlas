// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { inversionTrace } from '$lib/algo-engine/counting-inversions.js';
import { en as m } from '$lib/lessons/counting-inversions/copy.en.js';

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
  vi.useRealTimers();
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
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

/** @param {number} index */
function seek(index) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector('input[aria-label="Step"]'));
  el.value = String(index);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const valuesField = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="values"]'));
const EXAMPLE = [3, 7, 1, 8, 5, 2, 6, 4];

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('counting inversions lesson', () => {
  it('starts with the pair count a full check would need', () => {
    render();
    expect(narration()).toContain('Checking every pair would read 28 pairs');
    expect(stat('Inversions')).toBe('0');
    expect(stat('Pairs a check of every pair reads')).toBe('28');
  });

  it('counts 14 inversions on the example and lists them', () => {
    render();
    click(button('Last step'));
    expect(narration()).toContain('14 inversions, found with');
    expect(stat('Inversions')).toBe('14');
    expect(text()).toContain('8 > 4');
  });

  it('explains a take from the right with the values it jumps over', () => {
    render();
    const trace = inversionTrace(EXAMPLE);
    const at = trace.findIndex((f) => f.kind === 'take-right' && f.gained >= 2);
    seek(at);
    const f = trace[at];
    expect(narration()).toContain(`each one an inversion: +${f.gained}.`);
    const left = document.querySelector('[aria-label^="L:"]');
    expect(left?.textContent).toContain('>');
    expect(stat('Cross pairs in this merge')).toBe(String(f.call?.cross));
  });

  it('shows L and R only while a range is merging', () => {
    render();
    expect(text()).toContain(m.bufferIdle);
    const copy = inversionTrace(EXAMPLE).findIndex((f) => f.kind === 'copy');
    seek(copy);
    expect(document.querySelector('[aria-label^="L:"]')).not.toBeNull();
    expect(document.querySelector('[aria-label^="R:"]')).not.toBeNull();
  });

  it('takes from the left on ties, so repeated values add nothing', () => {
    render();
    commit(valuesField(), '5, 5, 5, 5');
    click(button('Last step'));
    expect(narration()).toContain('0 inversions');
    expect(narration()).toContain('already sorted');
  });

  it('loads a preset and announces it', () => {
    render();
    commit(
      /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]')),
      'reversed',
    );
    expect(text()).toContain('New array loaded.');
    click(button('Last step'));
    expect(narration()).toContain('66 inversions');
    expect(narration()).toContain('Every pair is inverted');
  });

  it('refuses bad values and keeps the last valid array', () => {
    render();
    commit(valuesField(), '3, x');
    expect(narration()).toContain('Type whole numbers');
    expect(valuesField().value).toBe(EXAMPLE.join(', '));
    commit(valuesField(), '1, 200');
    expect(narration()).toContain('between 0 and 99');
    commit(valuesField(), '1');
    expect(narration()).toContain('between 2 and 16 values');
  });

  it('commits typed values on Enter', () => {
    render();
    const field = valuesField();
    field.value = '2 1';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    click(button('Last step'));
    expect(narration()).toContain('1 inversion, found with 1 comparison');
  });

  it('loads a random array from the button', () => {
    render();
    click(buttonByText('Random array'));
    expect(text()).toContain('New array loaded.');
    expect(
      /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]')).value,
    ).toBe('');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});

describe('take-left narration', () => {
  it('mentions the tie rule only when the two heads are equal', () => {
    const takes = (/** @type {number[]} */ a) =>
      inversionTrace(a)
        .filter((f) => f.kind === 'take-left' && f.j < f.right.length)
        .map((f) => m.describe(f));
    expect(takes([1, 2])).toEqual([expect.stringContaining('1 < R[0] = 2')]);
    expect(takes([1, 2])[0]).not.toContain('Ties');
    expect(takes([3, 3])).toEqual([expect.stringContaining('Ties go left')]);
  });
});
