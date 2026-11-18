// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MAX_LEN } from '$lib/algo-engine/data-compression.js';
import { vi as m } from '$lib/lessons/data-compression/copy.vi.js';
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
  for (let i = 0; i < 500; i++) {
    if (narration().includes(kindText)) return;
    click(button('Bước tiếp'));
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
  expect(q.textContent).toContain('Chưa đúng');
  const hint = [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Xem gợi ý');
  click(/** @type {HTMLButtonElement} */ (hint));
  expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
  answer.value = right;
  answer.dispatchEvent(new Event('input', { bubbles: true }));
  submit();
  expect(q.textContent).toContain('Đúng rồi!');
  for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
}

describe('Data compression lesson', () => {
  it('builds the Huffman tree first, then reads through all three', () => {
    render();
    expect(narration()).toContain('Huffman cần biết số lần xuất hiện');
    expect(stat('stream')).toBe(m.streamEmpty);
    click(button('Bước tiếp'));
    expect(narration()).toBe('Gộp hai cây nhẹ nhất thành cb, với số lần 6.');
    stepUntil('Chỉ còn một cây');
    expect(document.body.textContent).toContain('a = 1');
    stepUntil('Giờ đọc văn bản');
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'a: Loạt dài mở một loạt a. Huffman ghi 1. LZW đã biết a, nên tiếp tục mở rộng.',
    );
    expect(stat('raw')).toBe('8 bit');
    expect(stat('huff')).toBe(m.bitsValue(1));
    expect(stat('open-run')).toBe('Loạt đang mở: a × 1');
    expect(titles()).toContain('Chữ cái 0: a, đang đọc');
  });

  it('reaches the known totals for each method', () => {
    render();
    toLast();
    expect(stat('raw')).toBe('112 bit');
    expect(stat('run')).toBe('48 bit');
    expect(stat('huff')).toBe('20 bit');
    expect(stat('lzw')).toBe('81 bit');
    expect(document.body.textContent).toContain('a × 8');
    expect(narration()).toContain('Không nén 112 bit, loạt dài 48, Huffman 20, LZW 81');
  });

  it('grows the LZW dictionary with each code', () => {
    render();
    commit(field('text'), 'abab');
    stepUntil('LZW ghi 97, thêm ab với mã 256');
    expect(document.body.textContent).toContain('256 = ab');
    expect(document.body.textContent).toContain('97 (a)');
    stepUntil('LZW ghi 98, thêm ba với mã 257');
    stepUntil('LZW đã biết ab');
    expect(stat('lzw-w')).toBe('Xâu w đang lớn dần: ab');
    toLast();
    expect(stat('lzw')).toBe('27 bit');
    expect(document.body.textContent).toContain('256 (ab)');
  });

  it('switches presets and shows which method suits the text', () => {
    render();
    commit(field('preset'), 'flat');
    toLast();
    expect(stat('raw')).toBe('80 bit');
    expect(stat('run')).toBe('160 bit');
    commit(field('preset'), 'repeats');
    toLast();
    expect(stat('run')).toBe(`${16 * 16} bit`);
    expect(Number(stat('lzw')?.split(' ')[0])).toBeLessThan(128);
  });

  it('handles a text of one letter', () => {
    render();
    commit(field('text'), 'aaa');
    expect(narration()).toContain('Huffman cần');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Chỉ còn một cây');
    toLast();
    expect(stat('huff')).toBe('3 bit');
    expect(stat('run')).toBe('16 bit');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_LEN);
    const good = field('text').value;
    commit(field('text'), 'a b');
    expect(narration()).toBe(errors.format);
    expect(field('text').value).toBe(good);
    commit(field('text'), 'a'.repeat(MAX_LEN + 1));
    expect(narration()).toBe(errors.length);
    commit(field('text'), ' ');
    expect(narration()).toBe(errors.empty);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    checkFirstQuestion('6', '48');
  });
});
