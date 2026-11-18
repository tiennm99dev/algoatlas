// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/amortized-analysis/copy.vi.js';

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
function pickMethod(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="method"][value="${value}"]`)
  );
  radio.click();
  flushSync();
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Step until the narration matches. @param {string} part */
function stepUntil(part) {
  for (let k = 0; k < 400 && !narration().includes(part); k++) click(button('Bước tiếp'));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('amortized analysis lesson', () => {
  it('counts 30 flips for 16 increments of a 4-bit counter', () => {
    render();
    expect(narration()).toBe(
      'Bộ đếm 4 bit đang là 0000: không có bit 1, không có xu, Φ = 0. Ta sẽ tăng 16 lần.',
    );
    click(button('Bước tiếp'));
    expect(narration()).toBe('Lần tăng 1: bắt đầu từ bit 0 của 0000 (giá trị 0).');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Bit 0 bằng 0: bật lên 1');
    expect(stat(m.stats.phi)).toBe('1');
    expect(text()).toContain('Bit 0: 1, đang giữ một đồng xu, vừa bật');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.total)).toBe('30');
    expect(stat(m.stats.bound)).toBe('32');
    expect(stat(m.stats.worst)).toBe('4');
    expect(stat(m.stats.phi)).toBe('0');
    expect(narration()).toContain('16 lần tăng tốn tổng cộng 30 lần lật');
  });

  it('spends coins on the overflow and shows the amortized cost 0', () => {
    render();
    stepUntil('Cả 4 bit đều là 1');
    expect(narration()).toContain('Chi phí 4, chi phí khấu hao 0');
    pickMethod('potential');
    expect(text()).toContain('Lần tăng 16: ĉ = c + ΔΦ = 4 + (0 − 4) = 0.');
  });

  it('reads the same run with each method', () => {
    render();
    commit(input('ops'), '3');
    click(button('Đến bước cuối'));
    expect(text()).toContain(m.accounting.balance(6, 4, 2));
    expect(text()).toContain('0011₂ = 3');
    pickMethod('aggregate');
    expect(document.querySelector(`[aria-label="${m.aggregate.tableAria}"]`)).not.toBeNull();
    expect(text()).toContain('Sau 3 lần tăng: Σ ⌊3/2ⁱ⌋ = 4 < 2 × 3 = 6 lần lật');
    pickMethod('potential');
    expect(text()).toContain('Σ ĉ = 6 = Σ c + Φ − Φ₀ = 4 + 2 − 0');
  });

  it('keeps the aggregate sum to finished increments while one is running', () => {
    render();
    pickMethod('aggregate');
    stepUntil('Bit 0 bằng 1: đặt lại về 0');
    expect(text()).toContain('Sau 1 lần tăng: Σ ⌊1/2ⁱ⌋ = 1 < 2 × 1 = 2 lần lật');
    expect(text()).toContain('Lần tăng 2 đang chạy và đến giờ đã lật 1 lần.');
  });

  it('keeps the last valid values and submits with Enter', () => {
    render();
    commit(input('bits'), '9');
    expect(narration()).toBe(m.bitsError);
    expect(input('bits').value).toBe('4');
    commit(input('ops'), '0');
    expect(narration()).toBe(m.opsError);
    expect(input('ops').value).toBe('16');
    input('bits').value = '8';
    input('bits').dispatchEvent(new Event('input', { bubbles: true }));
    input('ops').value = '64';
    input('ops').dispatchEvent(new Event('input', { bubbles: true }));
    /** @type {HTMLFormElement} */ (input('bits').closest('form')).requestSubmit();
    flushSync();
    click(button('Đến bước cuối'));
    expect(stat(m.stats.total)).toBe('127');
    expect(stat(m.stats.worst)).toBe('7');
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
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '31';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
