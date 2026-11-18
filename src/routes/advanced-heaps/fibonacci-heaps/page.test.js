// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/fibonacci-heaps/copy.vi.js';

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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
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
const forestLabel = () =>
  document.querySelector('svg[aria-label*="khoá"]')?.getAttribute('aria-label') ?? '';
/** @param {string} start */
const node = (start) =>
  /** @type {HTMLElement} */ (
    [...document.querySelectorAll('[role="button"]')].find((c) =>
      c.getAttribute('aria-label')?.startsWith(start),
    )
  );
function submit() {
  document
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('binomial and Fibonacci heaps lesson', () => {
  it('starts lazily and consolidates on extract-min', () => {
    render();
    expect(text()).toContain('Một heap Fibonacci rỗng');
    click(button('Bước tiếp'));
    expect(text()).toContain('Chèn 41: thêm nó vào danh sách gốc như một cây một nút');
    click(button('Đến bước cuối'));
    expect(forestLabel()).toContain('1 cây chứa 8 khoá.');
    expect(text()).toContain('Đã làm xong mọi thao tác: 7 lần nối, 0 lần cắt.');
  });

  it('shows the degree table while consolidating', () => {
    render();
    expect(text()).toContain(m.tableIdle);
    // Step past nine inserts, the extract and the promotion to the first scan.
    for (let i = 0; i < 12; i++) click(button('Bước tiếp'));
    expect(text()).toContain('Hợp nhất: lấy gốc');
    expect(document.querySelector('svg[aria-label^="Bảng bậc"]')).not.toBeNull();
  });

  it('inserts a typed key and extracts the minimum', () => {
    render();
    commit(input('value'), '1');
    submit();
    expect(text()).toContain('Chèn 1: thêm nó vào danh sách gốc');
    click(buttonByText(m.extract));
    expect(text()).toContain('Lấy min: con trỏ min chỉ vào 1.');
    click(button('Đến bước cuối'));
    expect(forestLabel()).toContain('chứa 8 khoá.');
  });

  it('switches to a binomial heap on the same log', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="binomial"]')));
    expect(text()).toContain('Số lần đổi chỗ khi vun lên');
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'counter');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain('Chèn 9: nó bắt đầu là một số nhớ');
    click(button('Bước tiếp'));
    expect(text()).toContain('cũng có bậc 0, nên hai cây phải được nối');
    click(button('Đến bước cuối'));
    expect(forestLabel()).toContain('1 cây chứa 8 khoá.');
  });

  it('decreases a chosen key from the keyboard and cuts it out', () => {
    render();
    click(button('Đến bước cuối'));
    const leaf = node('Khoá 46,');
    leaf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain(m.selectedInfo(46));
    commit(input('key'), '2');
    click(buttonByText(m.decrease));
    expect(text()).toContain('Giảm 46 xuống 2. Cha của nó chứa 39.');
    click(button('Bước tiếp'));
    expect(text()).toContain('cắt 2 ra cùng cây con của nó');
    click(button('Đến bước cuối'));
    expect(forestLabel()).toContain('2 cây chứa 8 khoá.');
    expect(text()).toContain('46↓2');
  });

  it('refuses a decrease without a node, a larger key and a bad value', () => {
    render();
    click(buttonByText(m.decrease));
    expect(text()).toContain(m.pickFirst);
    click(button('Đến bước cuối'));
    node('Khoá 18,').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    commit(input('key'), '30');
    click(buttonByText(m.decrease));
    expect(text()).toContain(m.notSmaller(18));
    commit(input('key'), '150');
    expect(input('key').value).toBe('30');
    expect(text()).toContain(m.valueError);
  });

  it('undoes, resets and refuses to extract from an empty heap', () => {
    render();
    click(buttonByText(m.undo));
    expect(forestLabel()).toContain('9 cây chứa 9 khoá.');
    click(buttonByText(m.reset));
    expect(text()).toContain('Một heap Fibonacci rỗng');
    click(buttonByText(m.extract));
    expect(text()).toContain(m.emptyError);
  });

  it('refuses inserts into a full heap', () => {
    render();
    for (let i = 0; i < 8; i++) {
      commit(input('value'), String(i));
      submit();
    }
    expect(text()).toContain(m.full);
  });

  it('checks a practice answer with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const send = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
