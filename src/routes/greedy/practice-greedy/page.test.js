// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-greedy/copy.vi.js';

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
  vi.restoreAllMocks();
});

/** Deterministic LCG so the random tests are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

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
const report = () => document.querySelector('[data-testid="report"]')?.textContent?.trim() ?? '';

/** @param {string} p */
function card(p) {
  click(/** @type {HTMLElement} */ (document.querySelector(`[data-card="${p}"]`)));
}

/** @param {string} value */
function pickRule(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('greedy practice lesson', () => {
  it('starts on the jump game with the longest-jump rule', () => {
    render();
    expect(narration()).toContain('Xuất phát từ ô 0 và luôn nhảy bước xa nhất');
    expect(stat('Đáp án đúng')).toBe('có');
    expect(stat('Đáp án của quy tắc')).toBe('…');
    expect(report()).toContain('Chưa kiểm tra.');
  });

  it('steps the wrong rule onto a zero and reports the counterexample', () => {
    render();
    click(button('Bước tiếp'));
    expect(narration()).toContain('Nhảy 2 từ ô 0 đến ô 2. Đã nhảy 1 bước.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Ô 2 chứa 0: quy tắc bị kẹt ở đó.');
    click(button('Đến bước cuối'));
    expect(narration()).toContain(
      'Quy tắc cho đáp án không, nhưng đáp án đúng là có: đây là một phản ví dụ',
    );
    expect(stat('Đáp án của quy tắc')).toBe('không');
    const titles = [...document.querySelectorAll('svg title')].map((t) => t.textContent);
    expect(titles).toContain('Ô 2: 0, bị kẹt ở đây');
  });

  it('switches to the farthest-reach rule, which is right here', () => {
    render();
    pickRule('right');
    expect(narration()).toContain('Quy tắc: Theo dõi điểm xa nhất tới được.');
    expect(text()).toContain('reach = max(reach, i + a[i])');
    click(button('Bước tiếp'));
    expect(narration()).toContain(
      'Ô 0 tới được (0 ≤ reach). Từ ô này có thể tới 2, nên reach = 2.',
    );
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Quy tắc cho đáp án có, đúng với đầu vào này.');
    expect(stat('Điểm xa nhất tới được')).toBe('8');
  });

  it('breaks the wrong rule on random cases and loads the counterexample', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(4));
    render();
    click(buttonByText('Kiểm tra trên 200 trường hợp ngẫu nhiên'));
    expect(report()).toMatch(/Sai \d+\/200 trường hợp ngẫu nhiên\./);
    expect(report()).toContain('Phản ví dụ ngắn nhất:');
    click(buttonByText('Nạp phản ví dụ'));
    expect(narration()).toContain('Đã nạp phản ví dụ');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('đây là một phản ví dụ, nên quy tắc này sai');
  });

  it('passes the right rule on every random case', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(9));
    render();
    pickRule('right');
    click(buttonByText('Kiểm tra trên 200 trường hợp ngẫu nhiên'));
    expect(report()).toContain('Đúng cả 200 trường hợp ngẫu nhiên.');
  });

  it('counts jumps by layers on the fewest-jumps card', () => {
    render();
    card('jumps');
    expect(/** @type {HTMLInputElement} */ (field('values')).value).toBe('2, 3, 1, 1, 4');
    click(button('Đến bước cuối'));
    expect(narration()).toContain(
      'Quy tắc cho đáp án 3 bước nhảy, nhưng đáp án đúng là 2 bước nhảy',
    );
    pickRule('right');
    expect(text()).toContain('if i = end:');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(narration()).toContain(
      'Ô 0 là cuối tầm mà 0 bước nhảy phủ tới, nên thực hiện bước nhảy 1: nó có thể đáp xuống bất kì đâu, tới tận ô 2.',
    );
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Quy tắc cho đáp án 2 bước nhảy, đúng');
  });

  it('fills boats with the two lightest and with heaviest plus lightest', () => {
    render();
    card('boats');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Sắp xếp các khối lượng: 1, 2, 8, 9.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Thuyền 1: hai người nhẹ nhất, 1 và 2, đi chung.');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Quy tắc cho đáp án 3 thuyền, nhưng đáp án đúng là 2 thuyền');
    expect(text()).toContain('1 + 2');
    pickRule('right');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Quy tắc cho đáp án 2 thuyền, đúng');
    expect(text()).toContain('9 + 1');
    expect(document.querySelector('[aria-label^="Các ô:"]')?.textContent).toContain('b2');
  });

  it('refuses bad input and keeps the last valid one', () => {
    render();
    commit(field('values'), '2, 12');
    expect(narration()).toContain('Mỗi độ dài bước nhảy phải từ 0 đến 9.');
    expect(/** @type {HTMLInputElement} */ (field('values')).value).toBe('2, 3, 0, 1, 4');
    card('boats');
    commit(field('values'), '0 3');
    expect(narration()).toContain('Mỗi khối lượng phải từ 1 đến 9.');
    commit(field('values'), '5 5 5');
    click(button('Đến bước cuối'));
    expect(stat('Đáp án đúng')).toBe('2 thuyền');
  });

  it('commits typed input on Enter and loads a random one', () => {
    render();
    const input = /** @type {HTMLInputElement} */ (field('values'));
    input.value = '1 1 1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Quy tắc cho đáp án có, đúng');
    click(buttonByText('Đầu vào ngẫu nhiên'));
    expect(text()).toContain('Đã nạp đầu vào mới.');
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
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
