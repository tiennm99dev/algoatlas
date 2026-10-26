// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/sorting-applications/copy.en.js';

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

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name @param {string} value */
function pick(name, value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="${name}"][value="${value}"]`)
    ),
  );
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
const blocksLabel = () =>
  document
    .querySelector('ol[aria-label^="Merged blocks"], ol[aria-label="No blocks yet."]')
    ?.getAttribute('aria-label');

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('sorting applications lesson', () => {
  it('sorts by start and merges the example into three blocks', () => {
    render();
    expect(blocksLabel()).toBe('No blocks yet.');
    click(button('Next step'));
    expect(text()).toContain('Sorted by start');
    expect(
      document
        .querySelector('ol[aria-label^="Intervals in scan order"]')
        ?.getAttribute('aria-label'),
    ).toBe('Intervals in scan order: 1–3, 2–6, 4–5, 8–10, 12–16, 15–18.');
    click(button('Next step'));
    expect(text()).toContain('Open the first block with 1–3.');
    click(button('Next step'));
    expect(text()).toContain(
      '2–6 starts at 2, not after the block’s end: they overlap, so the block becomes 1–6.',
    );
    click(button('Last step'));
    expect(text()).toContain(
      '3 blocks after 5 checks: 1–6, 8–10, 12–18. This is the correct merge.',
    );
    expect(blocksLabel()).toBe('Merged blocks: 1–6, 8–10, 12–18.');
    expect(text()).toContain('✓ correct merge');
  });

  it('shows a wrong merge when sorting by end or not at all', () => {
    render();
    pick('by', 'end');
    expect(text()).toContain('sort intervals by end, ties by start');
    click(button('Last step'));
    expect(text()).toContain('Wrong: the correct merge is 1–6, 8–10, 12–18.');
    expect(text()).toContain('✕ wrong merge');
    pick('by', 'none');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain(
      'But it ends before the block starts at 8: they do not really overlap, and the block stays 8–10.',
    );
    click(button('Last step'));
    expect(blocksLabel()).toBe('Merged blocks: 8–10, 15–18.');
  });

  it('loads typed intervals and refuses bad ones', () => {
    render();
    commit(field('intervals'), '1-3 3-5');
    click(button('Last step'));
    expect(blocksLabel()).toBe('Merged blocks: 1–5.');
    commit(field('intervals'), '5-2, 6-7');
    expect(text()).toContain('Each interval needs start < end');
    expect(field('intervals').value).toBe('1-3, 3-5');
    commit(field('intervals'), '1-3, oops');
    expect(text()).toContain('Type intervals as start-end pairs');
  });

  it('removes duplicates with one neighbour check per value', () => {
    render();
    pick('mode', 'dedup');
    expect(text()).toContain('8 values. Sort them first');
    click(button('Next step'));
    expect(text()).toContain('Sorted: 1, 3, 3, 7, 7, 9, 9, 9.');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('a[2] = 3 equals a[1]: skip the repeat.');
    click(button('Last step'));
    expect(text()).toContain(
      '4 distinct values after 7 checks. Without sorting, comparing every pair would take 28.',
    );
    commit(field('values'), '5, 5');
    click(button('Last step'));
    expect(text()).toContain('1 distinct value after 1 check.');
    commit(field('values'), '5');
    expect(text()).toContain('Type from 2 to 14 values.');
  });

  it('checks the first practice question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '1-3, 2-6, 8-10, 15-18';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '1-6, 8-10, 15-18';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
