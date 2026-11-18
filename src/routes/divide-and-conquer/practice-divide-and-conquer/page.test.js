// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-divide-and-conquer/copy.vi.js';
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
/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const sample = (name) =>
  /** @type {HTMLButtonElement} */ (document.querySelector(`button[data-sample="${name}"]`));
/** @param {string} prefix */
const callNode = (prefix) =>
  /** @type {SVGGElement} */ (
    [...document.querySelectorAll('g[role="button"]')].find((g) =>
      g.getAttribute('aria-label')?.startsWith(prefix),
    )
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('practice: divide and conquer problems', () => {
  it('opens on max(L, R), which misses the crossing run of Sample 1', () => {
    render();
    expect(text()).toContain('Gọi best(0, 8) trên 9 giá trị.');
    expect(text()).toContain('return max(L, R)');
    expect(byTest('samples-summary')).toBe('Bước kết hợp của bạn qua 1/5 mảng.');
    expect(byTest('expected')).toBe('6');
    click(button('Đến bước cuối'));
    expect(byTest('returned')).toBe('4 ✕');
    expect(byTest('calls')).toBe('17');
    expect(byTest('reads')).toBe('38');
    expect(text()).toContain('nhưng đáp án đúng là 6. Lời gọi sai đầu tiên là [5, 6].');
  });

  it('ticking C fixes every sample', () => {
    render();
    click(input('part-cross'));
    expect(text()).toContain('return max(L, R, C)');
    expect(byTest('samples-summary')).toContain('qua cả 5/5 mảng');
    click(button('Đến bước cuối'));
    expect(byTest('returned')).toBe('6 ✓');
    expect(text()).toContain('mọi lời gọi đều đúng với chính đoạn của nó');
  });

  it('jumps to the first wrong call and explains it', () => {
    render();
    click(buttonByText(m.jumpWrong));
    expect(text()).toContain(
      'Bước kết hợp của bạn trả về 2, lấy từ L. ✕ Sai: đáp án đúng của [5, 6] là 3.',
    );
    expect(callNode('Lời gọi [5, 6]').getAttribute('aria-label')).toBe(
      'Lời gọi [5, 6]: sai với đoạn của nó, trả về 2.',
    );
  });

  it('C alone passes four samples but the tree shows wrong calls', () => {
    render();
    click(input('part-left'));
    click(input('part-right'));
    click(input('part-cross'));
    expect(byTest('samples-summary')).toBe('Bước kết hợp của bạn qua 4/5 mảng.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('đúng đáp án, nhưng lời gọi [0, 1] đã sai trên đường đi.');
    click(sample('Mẫu 3'));
    click(button('Đến bước cuối'));
    expect(byTest('returned')).toBe('−8 ✕');
  });

  it('majority needs counting, and one candidate is not enough', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="majority"]')));
    expect(input('values').value).toBe('3, 3, 4, 2, 4, 4, 2, 4, 4');
    expect(byTest('samples-summary')).toBe('Bước kết hợp của bạn qua 2/5 mảng.');
    click(input('part-count'));
    expect(byTest('samples-summary')).toContain('qua cả 5/5 mảng');
    click(button('Đến bước cuối'));
    expect(byTest('reads')).toBe('38');
    expect(byTest('returned')).toBe('4 ✓');
    click(input('part-left'));
    expect(byTest('samples-summary')).toBe('Bước kết hợp của bạn qua 4/5 mảng.');
    click(sample('Mẫu 2'));
    click(button('Đến bước cuối'));
    expect(byTest('returned')).toBe('không có ✕');
  });

  it('a typed array joins the samples, and bad input is refused', () => {
    render();
    commit(input('values'), '1, -2, 3');
    expect(sample(m.yourArray).getAttribute('aria-label')).toBe(
      'Mảng của bạn: 1, −2, 3. Đáp án đúng 3, của bạn 3, đạt. Nạp mẫu này.',
    );
    expect(byTest('samples-summary')).toBe('Bước kết hợp của bạn qua 2/6 mảng.');
    commit(input('values'), '1, 200');
    expect(text()).toContain(m.errors.range);
    expect(input('values').value).toBe('1, -2, 3');
    commit(input('values'), 'a b');
    expect(text()).toContain(m.errors.format);
  });

  it('a call node picked by keyboard seeks to its return', () => {
    render();
    const node = callNode('Lời gọi [0, 0]');
    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain('[0, 0] chỉ có một ô, nên return a[0] = −2. ✓ Đúng với [0, 0].');
  });

  it('Random array loads a new array and a notice says when nothing is wrong', () => {
    render();
    click(input('part-cross'));
    click(buttonByText(m.randomArray));
    expect(input('values').value.split(', ').length).toBeGreaterThanOrEqual(6);
    expect(sample(m.yourArray)).toBeTruthy();
    click(buttonByText(m.jumpWrong));
    expect(text()).toContain(m.noWrong);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
