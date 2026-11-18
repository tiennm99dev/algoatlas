// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
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
  vi.useRealTimers();
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

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));

/** Jump to the final frame by stepping. */
function toEnd() {
  const next = button('Đến bước cuối');
  click(next);
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent === label);
  return dt?.nextElementSibling?.textContent;
}

describe('hash table lesson', () => {
  it('ends with the inserts done and the table grown to 23', () => {
    render();
    toEnd();
    expect(text()).toContain('Đã chèn 10 khoá vào 23 bucket.');
    expect(stat('Kích thước bảng')).toBe('23');
  });

  it('switching to multiplication resets and shows its formula', () => {
    render();
    toEnd();
    click(field('input[value="multiply"]'));
    expect(text()).toMatch(/Bước 1\//);
    expect(text()).toContain('frac(k');
    toEnd();
    expect(text()).toContain('vào 16 bucket');
  });

  it('multiples of 8 pile up under a power of two and spread under a prime', () => {
    render();
    commit(field('select[name="preset"]'), 'multiples-of-8');
    click(field('input[value="mod-pow2"]'));
    toEnd();
    expect(stat('Chuỗi dài nhất')).toBe('5');
    click(field('input[value="mod-prime"]'));
    toEnd();
    expect(stat('Chuỗi dài nhất')).toBe('1');
  });

  it('seeks to a missing-key search and reports the whole chain', () => {
    render();
    commit(field('input[type="number"]'), '62');
    click(buttonByText('Tìm'));
    expect(text()).toContain('Tìm 62: hash vào bucket 16.');
    toEnd();
    expect(text()).toContain('62 không có trong chuỗi 16: tốn 2 phép so sánh.');
  });

  it('stops a search hit at the key’s position', () => {
    render();
    commit(field('input[type="number"]'), '39');
    click(buttonByText('Tìm'));
    toEnd();
    expect(text()).toContain('Tìm thấy 39 ở vị trí 0 của chuỗi 16 sau 1 phép so sánh.');
  });

  it('keeps the last valid keys when custom text is invalid', () => {
    render();
    commit(field('select[name="preset"]'), 'custom');
    const before = text().match(/Bước \d+\/\d+/)?.[0];
    commit(field('input[type="text"]'), '5, -3');
    expect(text()).toContain('Các khoá phải là số nguyên từ 0 đến 999.');
    expect(text().match(/Bước \d+\/\d+/)?.[0]).toBe(before);
    expect(field('input[type="text"]').value).toBe('12, 44, 13, 88, 23, 94, 11, 39, 20, 16');
  });

  it('shows a refusal in the narration and drops it after the next step', () => {
    render();
    commit(field('select[name="preset"]'), 'custom');
    commit(field('input[type="text"]'), '5, -3');
    expect(document.querySelector('[role="alert"]')).toBeNull();
    const narration = document.querySelector('p[aria-live]');
    expect(narration?.textContent).toContain('Các khoá phải là số nguyên từ 0 đến 999.');
    click(button('Bước tiếp'));
    expect(document.querySelector('p[aria-live]')?.textContent).not.toContain('Các khoá phải');
  });

  it('confirms new keys in the narration', () => {
    render();
    click(buttonByText('Bộ khoá mới'));
    expect(document.querySelector('p[aria-live]')?.textContent).toContain('Đã nạp bộ khoá mới.');
  });

  it('keeps the last valid search key when the entry is invalid', () => {
    render();
    const input = field('input[type="number"]');
    commit(input, '1500');
    expect(input.value).toBe('62');
    expect(text()).toContain('Các khoá phải là số nguyên từ 0 đến 999.');
    commit(input, '39');
    commit(input, '');
    expect(input.value).toBe('39');
    click(buttonByText('Tìm'));
    expect(text()).toContain('Tìm 39: hash vào bucket');
  });

  it('draws the hit chip at the end of a long colliding chain', () => {
    render();
    commit(field('select[name="preset"]'), 'custom');
    const keys = Array.from({ length: 22 }, (_, i) => i * 47);
    commit(field('input[type="text"]'), keys.join(', '));
    commit(field('input[type="number"]'), '987');
    click(buttonByText('Tìm'));
    toEnd();
    expect(text()).toContain('Tìm thấy 987 ở vị trí 21');
    const hit = [...document.querySelectorAll('ol[aria-label="Các bucket"] span.sr-only')].find(
      (e) => e.textContent?.includes('tìm thấy'),
    );
    expect(hit?.parentElement?.textContent).toContain('987');
  });

  it('runs the search when Enter submits the search field', () => {
    render();
    const input = field('input[type="number"]');
    commit(input, '39');
    input.form?.requestSubmit();
    flushSync();
    expect(text()).toContain('Tìm 39: hash vào bucket');
  });

  it('says a search was cleared when the hash function changes', () => {
    render();
    click(buttonByText('Tìm'));
    expect(text()).toContain('Tìm 62: hash vào bucket');
    click(field('input[value="mod-pow2"]'));
    expect(document.querySelector('p[aria-live]')?.textContent).toContain(
      'Phép tìm đã bị xoá vì bảng vừa thay đổi.',
    );
    expect(text()).toMatch(/Bước 1\//);
  });

  it('gives each bucket index a spoken Bucket prefix', () => {
    render();
    const first = document.querySelector('ol[aria-label="Các bucket"] li');
    expect(first?.querySelector('span.sr-only')?.textContent).toBe('Bucket ');
    expect(first?.textContent).toMatch(/^Bucket 0/);
  });
});
