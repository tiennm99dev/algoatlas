// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/string-basics/copy.en.js';

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
function pickMode(value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="mode"][value="${value}"]`)
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
  for (let i = 0; i < 400 && !narration().includes(part); i++) click(button('Next step'));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('string basics lesson', () => {
  it('joins ten letters by concatenation with 45 copies', () => {
    render();
    expect(narration()).toBe(
      'Join 10 pieces with s = s + p. s starts as the empty string, and strings are immutable: once made, a string never changes.',
    );
    expect(text()).toContain(m.emptyString);
    stepUntil('Copy all 2 characters');
    expect(narration()).toBe(
      'Copy all 2 characters of s into t. s itself stays unchanged; only t is written.',
    );
    expect(text()).toContain(m.blocks.t);
    expect(text()).toContain('Index 0: a, copied from');
    click(button('Next step'));
    expect(narration()).toBe(
      'Write “c” after them and let s = t: 1 write and 2 copies for this piece. The old s is garbage now.',
    );
    expect(text()).toContain('Index 2: c, just written');
    click(button('Last step'));
    expect(narration()).toBe(
      'Done: “abcdefghij” after 45 copies of old characters and 10 writes, 55 steps in total.',
    );
    expect(stat(m.stats.copies)).toBe('45');
    expect(stat(m.stats.work)).toBe('55');
    expect(stat(m.stats.other)).toBe('32');
    expect(stat(m.stats.garbage)).toBe('9');
  });

  it('grows the builder buffer by doubling', () => {
    render();
    pickMode('builder');
    expect(text()).toContain('joinByBuilder(pieces, cap):');
    expect(text()).toContain('0 characters in 4 slots');
    stepUntil('needs 5 slots');
    expect(narration()).toBe(
      'Piece 5, “e”, needs 5 slots but the buffer has 4. Allocate a new buffer of max(2 × 4, 5) = 8.',
    );
    expect(text()).toContain(m.blocks.newBuffer);
    click(button('Last step'));
    expect(stat(m.stats.copies)).toBe('22');
    expect(stat(m.stats.other)).toBe('55');
    expect(text()).toContain(m.blocks.result);
    commit(input('capacity'), '16');
    click(button('Last step'));
    expect(stat(m.stats.copies)).toBe('10');
    expect(stat(m.stats.garbage)).toBe('0');
  });

  it('loads presets and typed pieces', () => {
    render();
    click(buttonByText(m.presets.words));
    expect(input('pieces').value).toBe('The quick brown fox jumps');
    click(button('Last step'));
    expect(narration()).toContain('“Thequickbrownfoxjumps”');
    commit(input('pieces'), 'ab cd ef gh ij kl');
    click(button('Last step'));
    expect(stat(m.stats.copies)).toBe('30');
  });

  it('rejects bad input and keeps the last valid values', () => {
    render();
    commit(input('pieces'), 'abcdefghi');
    expect(narration()).toBe(m.pieceErrors.long);
    expect(input('pieces').value).toBe('a b c d e f g h i j');
    commit(input('pieces'), '   ');
    expect(narration()).toBe(m.pieceErrors.empty);
    pickMode('builder');
    commit(input('capacity'), '0');
    expect(narration()).toBe(m.capacityError);
    expect(input('capacity').value).toBe('4');
  });

  it('inspects characters and their encodings', () => {
    render();
    const summary = () => document.querySelector('[data-testid="inspect-summary"]')?.textContent;
    expect(summary()).toContain('6 characters (code points), 11 UTF-8 bytes, 7 UTF-16 units');
    expect(text()).toContain('U+1EC7');
    expect(text()).toContain('E1 BB 87');
    commit(input('inspect'), 'Ab');
    expect(summary()).toContain('2 characters (code points), 2 UTF-8 bytes, 2 UTF-16 units');
    commit(input('inspect'), '');
    expect(text()).toContain(m.inspectErrors.empty);
    expect(input('inspect').value).toBe('Ab');
  });

  it('steps with the keyboard', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Piece 1, “a”');
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
    answer.value = '42';
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
