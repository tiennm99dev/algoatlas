// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/static-dynamic-arrays/copy.en.js';

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
  localStorage.clear();
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const readLine = () =>
  document.querySelector('[data-testid="read-line"]')?.textContent?.trim() ?? '';

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {string} value */
function pickGrowth(value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="growth"][value="${value}"]`)
    ),
  );
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Step until the narration matches. @param {string} part */
function stepUntil(part) {
  for (let k = 0; k < 400 && !narration().includes(part); k++) click(button('Next step'));
}

/** @param {number} i */
const cellA = (i) =>
  /** @type {SVGElement} */ (
    document.querySelector(`svg[aria-label^="${m.blockAria}"] [data-index="${i}"]`)
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('static and dynamic arrays lesson', () => {
  it('counts a resizing push as started in the steps per push', () => {
    render();
    stepUntil('Copy A[0]');
    // Pushes 1 and 2 wrote, push 3 has made one copy: 3 steps over 3 started pushes.
    expect(stat(m.stats.average)).toBe('1');
    stepUntil('Push 3: write');
    expect(stat(m.stats.average)).toBe('1.67');
  });

  it('doubles from capacity 2 through 9 pushes', () => {
    render();
    expect(narration()).toContain('An empty dynamic array with capacity 2 at address 1000.');
    click(button('Next step'));
    expect(narration()).toContain('Push 1: write 10 into A[0]');
    expect(stat(m.stats.size)).toBe('1 / 2');
    click(button('Last step'));
    expect(stat(m.stats.size)).toBe('9 / 16');
    expect(stat(m.stats.copies)).toBe('14');
    expect(stat(m.stats.resizes)).toBe('3');
    expect(stat(m.stats.spare)).toBe('7');
    expect(stat(m.stats.average)).toBe('2.56');
    expect(narration()).toContain('9 pushes made 9 writes and 14 copies over 3 resizes');
  });

  it('shows the new block while copying and moves A to its address', () => {
    render();
    stepUntil('Allocate block B');
    expect(text()).toContain(m.blockB);
    expect(narration()).toContain('Allocate block B with 4 slots at address 1024');
    click(button('Next step'));
    expect(narration()).toBe('Copy A[0] = 10 into B[0]. 1 copy so far in this push.');
    stepUntil('Free the old one');
    expect(narration()).toContain('A now starts at 1024 with capacity 4');
    expect(text()).not.toContain(m.blockB);
  });

  it('refuses pushes onto a full static array', () => {
    render();
    pickGrowth('static');
    expect(text()).toContain('error "array is full"');
    click(button('Last step'));
    expect(narration()).toBe(
      'Done: 2 values stored, 7 pushes refused because the static array was full.',
    );
    expect(stat(m.stats.copies)).toBe('0');
  });

  it('copies far more when growing by one slot', () => {
    render();
    pickGrowth('plus-one');
    commit(input('capacity'), '1');
    commit(input('pushes'), '8');
    click(button('Last step'));
    expect(stat(m.stats.copies)).toBe('28');
    pickGrowth('double');
    click(button('Last step'));
    expect(stat(m.stats.copies)).toBe('7');
  });

  it('reads an index by address with the keyboard', () => {
    render();
    click(button('Last step'));
    expect(readLine()).toBe(m.readHint);
    cellA(0).focus();
    cellA(0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(document.activeElement).toBe(cellA(1));
    cellA(1).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(readLine()).toContain('A[1] lives at');
    expect(readLine()).toContain('give 20');
    cellA(12).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(readLine()).toBe(m.readSpare(12));
  });

  it('keeps the last valid values', () => {
    render();
    commit(input('capacity'), '0');
    expect(narration()).toBe(m.capacityError);
    expect(input('capacity').value).toBe('2');
    commit(input('pushes'), '25');
    expect(narration()).toBe(m.pushesError);
    expect(input('pushes').value).toBe('9');
    commit(input('pushes'), '0');
    click(button('Last step'));
    expect(narration()).toBe('Done: nothing was pushed.');
  });

  it('checks the first question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '32';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '31';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
