// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/string-basics/copy.vi.js';

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
  for (let i = 0; i < 400 && !narration().includes(part); i++) click(button('Bước tiếp'));
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
      'Nối 10 mảnh bằng s = s + p. s bắt đầu là xâu rỗng, và xâu là bất biến: đã tạo ra thì không bao giờ đổi.',
    );
    expect(text()).toContain(m.emptyString);
    stepUntil('Sao chép cả 2 kí tự');
    expect(narration()).toBe(
      'Sao chép cả 2 kí tự của s sang t. Bản thân s vẫn giữ nguyên; chỉ t được ghi.',
    );
    expect(text()).toContain(m.blocks.t);
    expect(text()).toContain('Chỉ số 0: a, được sao chép đi');
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Ghi “c” vào sau chúng rồi cho s = t: 1 lần ghi và 2 lần sao chép cho mảnh này. Xâu s cũ giờ thành rác.',
    );
    expect(text()).toContain('Chỉ số 2: c, vừa ghi');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Xong: “abcdefghij” sau 45 lần sao chép kí tự cũ và 10 lần ghi, tổng cộng 55 bước.',
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
    expect(text()).toContain('0 kí tự trong 4 ô');
    stepUntil('cần 5 ô');
    expect(narration()).toBe(
      'Mảnh 5, “e”, cần 5 ô nhưng vùng đệm chỉ có 4. Cấp phát vùng đệm mới gồm max(2 × 4, 5) = 8 ô.',
    );
    expect(text()).toContain(m.blocks.newBuffer);
    click(button('Đến bước cuối'));
    expect(stat(m.stats.copies)).toBe('22');
    expect(stat(m.stats.other)).toBe('55');
    expect(text()).toContain(m.blocks.result);
    commit(input('capacity'), '16');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.copies)).toBe('10');
    expect(stat(m.stats.garbage)).toBe('0');
  });

  it('loads presets and typed pieces', () => {
    render();
    click(buttonByText(m.presets.words));
    expect(input('pieces').value).toBe('Tin học thật là vui');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('“Tinhọcthậtlàvui”');
    commit(input('pieces'), 'ab cd ef gh ij kl');
    click(button('Đến bước cuối'));
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
    expect(summary()).toContain('6 kí tự (điểm mã), 11 byte UTF-8, 7 đơn vị UTF-16');
    expect(text()).toContain('U+1EC7');
    expect(text()).toContain('E1 BB 87');
    commit(input('inspect'), 'Ab');
    expect(summary()).toContain('2 kí tự (điểm mã), 2 byte UTF-8, 2 đơn vị UTF-16');
    commit(input('inspect'), '');
    expect(text()).toContain(m.inspectErrors.empty);
    expect(input('inspect').value).toBe('Ab');
  });

  it('steps with the keyboard', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Mảnh 1, “a”');
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
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '30';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
