// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MAX_BASE, MAX_MOD, MAX_PATTERN, MAX_TEXT } from '$lib/algo-engine/rabin-karp.js';
import { vi as m } from '$lib/lessons/rabin-karp/copy.vi.js';
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
const toLast = () => click(button('Đến bước cuối'));
/** @param {string} kindText */
function stepUntil(kindText) {
  for (let i = 0; i < 400; i++) {
    if (narration().includes(kindText)) return;
    click(button('Bước tiếp'));
  }
  throw new Error(`never narrated ${kindText}`);
}

describe('Rabin-Karp lesson', () => {
  it('sets up the hashes, then rolls the window and finishes with the counters', () => {
    render();
    expect(narration()).toBe('Tìm abra trong abracadabra, với cơ số 31 và modulo 101.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('b^(m − 1)');
    stepUntil('Trượt một vị trí');
    expect(stat('roll')).toMatch(/^\(31 · \(\d+ − a·\d+\) \+ c\) mod 101 = \d+$/);
    toLast();
    expect(stat('matches')).toBe('2');
    expect(stat('spurious')).toBe('1');
    expect(stat('checks')).toBe('8');
    expect(stat('work')).toBe(String(4 + 4 + 2 * 7));
    expect(narration()).toContain('2 lần khớp và 1 lần khớp giả');
  });

  it('marks a window whose hash agrees but whose letters do not', () => {
    render();
    stepUntil('Khớp giả:');
    expect(titles().some((t) => t.includes('khớp giả'))).toBe(true);
    expect(narration()).toContain('brac');
  });

  it('rebuilds when any field or preset changes', () => {
    render();
    commit(field('text'), 'banana');
    commit(field('pattern'), 'ANA');
    toLast();
    expect(stat('matches')).toBe('2');
    commit(field('mod'), '2');
    expect(narration()).toContain('modulo 2');
    toLast();
    expect(stat('matches')).toBe('2');
    commit(field('base'), '3');
    expect(narration()).toContain('cơ số 3');
    commit(field('preset'), 'collide');
    toLast();
    expect(stat('spurious')).toBe('3');
    expect(field('text').value).toBe('abcbabaacab');
    expect(field('mod').value).toBe('5');
    commit(field('mod'), '101');
    toLast();
    expect(stat('spurious')).toBe('0');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_TEXT, MAX_PATTERN);
    commit(field('text'), 'a1');
    expect(narration()).toBe(errors.format);
    expect(field('text').value).toBe('abracadabra');
    commit(field('text'), 'x'.repeat(MAX_TEXT + 1));
    expect(narration()).toBe(errors.textLength);
    commit(field('pattern'), 'x'.repeat(MAX_PATTERN + 1));
    expect(narration()).toBe(errors.patternLength);
    commit(field('pattern'), ' ');
    expect(narration()).toBe(errors.empty);
    expect(field('pattern').value).toBe('abra');
    commit(field('base'), '1');
    expect(narration()).toBe(m.baseError(MAX_BASE));
    expect(field('base').value).toBe('31');
    commit(field('mod'), '');
    expect(narration()).toBe(m.modError(MAX_MOD));
    expect(field('mod').value).toBe('101');
  });

  it('keeps its place when a field is committed unchanged', () => {
    render();
    click(button('Bước tiếp'));
    const shown = narration();
    commit(field('text'), 'abracadabra');
    commit(field('mod'), '101');
    expect(narration()).toBe(shown);
  });

  it('says so when the pattern is longer than the text', () => {
    render();
    commit(field('text'), 'ab');
    commit(field('pattern'), 'abc');
    stepUntil('không có cửa sổ nào');
    toLast();
    expect(stat('checks')).toBe('0');
    expect(stat('expected')).toBe('0.0');
    commit(field('preset'), 'large');
    expect(stat('expected')).toBe('0.000017');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
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
    answer.value = '321';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '123';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
