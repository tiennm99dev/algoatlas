// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/huffman-coding/copy.en.js';

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

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} prefix */
const node = (prefix) =>
  [...document.querySelectorAll('[aria-label]')]
    .map((el) => el.getAttribute('aria-label') ?? '')
    .find((l) => l.startsWith(prefix)) ?? '';
const rows = () =>
  [...document.querySelectorAll('[data-testid="codes"] tbody tr')].map((tr) =>
    [...tr.children].map((c) => c.textContent?.trim()).join(' '),
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('Huffman coding lesson', () => {
  it('starts with six leaves in the queue, lightest first', () => {
    render();
    expect(narration()).toContain(
      '6 symbols, each a one-leaf tree in the queue, lightest first: f (5), e (9), c (12), b (13), d (16), a (45).',
    );
    expect(stat('Fixed-length bits')).toBe('300');
    expect(stat('Huffman bits')).toBe('0');
  });

  it('picks the two lightest and merges them', () => {
    render();
    click(button('Next step'));
    expect(narration()).toContain('Take the two lightest trees: f (5) and e (9).');
    expect(node('f, weight 5')).toContain('One of the two lightest');
    click(button('Next step'));
    expect(narration()).toContain('Merge them under a node of weight 14');
    expect(narration()).toContain('5 trees left.');
    expect(stat('Huffman bits')).toBe('14');
    expect(node('14, weight 14')).toContain('Merged node');
  });

  it('reads the codes and reaches 224 bits', () => {
    render();
    click(button('Last step'));
    expect(narration()).toContain(
      'Done: 224 bits in all, 2.24 bits per symbol on average, against 300 bits for a fixed 3-bit code.',
    );
    expect(stat('Merges')).toBe('5');
    expect(stat('Bits per symbol')).toBe('2.24');
    expect(rows()).toEqual([
      'a 45 0 45',
      'b 13 101 39',
      'c 12 100 36',
      'd 16 111 48',
      'e 9 1101 36',
      'f 5 1100 20',
    ]);
    click(button('Previous step'));
    expect(narration()).toContain(
      'd: follow the edges from the root to read 111, 3 bits × 16 = 48 bits.',
    );
    expect(node('d, weight 16')).toContain('Path to the leaf');
  });

  it('jumps to the step that reads a leaf’s code when the leaf is picked', () => {
    render();
    click(button('Last step'));
    const leaf = /** @type {HTMLElement} */ (
      document.querySelector('g[role="button"][aria-label^="f, weight 5"]')
    );
    leaf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toContain(
      'f: follow the edges from the root to read 1100, 4 bits × 5 = 20 bits.',
    );
    const merged = /** @type {HTMLElement} */ (
      document.querySelector('g[role="button"][aria-label^="14, weight 14"]')
    );
    merged.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(narration()).toContain('Merge them under a node of weight 14');
  });

  it('counts the letters of a text', () => {
    render();
    commit(field('text'), 'abracadabra');
    expect(narration()).toContain('Counted 5 different characters');
    expect(/** @type {HTMLInputElement} */ (field('frequencies')).value).toBe(
      'a:5, b:2, r:2, c:1, d:1',
    );
    click(button('Last step'));
    expect(narration()).toContain('Done: 23 bits in all');
    expect(stat('Fixed-length bits')).toBe('33');
  });

  it('matches the fixed-length code on equal counts', () => {
    render();
    commit(field('preset'), 'equal');
    expect(text()).toContain('New frequencies loaded.');
    click(button('Last step'));
    expect(stat('Huffman bits')).toBe('40');
    expect(stat('Fixed-length bits')).toBe('40');
  });

  it('refuses bad frequencies and texts, keeping the last valid ones', () => {
    render();
    commit(field('frequencies'), 'a:1, a:2');
    expect(narration()).toContain('Give each symbol once.');
    expect(/** @type {HTMLInputElement} */ (field('frequencies')).value).toBe(
      'a:45, b:13, c:12, d:16, e:9, f:5',
    );
    commit(field('frequencies'), 'a=3');
    expect(narration()).toContain('Type pairs like a:45');
    commit(field('text'), 'zzzz');
    expect(narration()).toContain('Use between 2 and 10 different symbols.');
    expect(stat('Fixed-length bits')).toBe('300');
  });

  it('commits typed frequencies on Enter', () => {
    render();
    const input = /** @type {HTMLInputElement} */ (field('frequencies'));
    input.value = 'x:3 y:7';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('2 symbols, each a one-leaf tree');
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
    answer.value = '33';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '23';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
