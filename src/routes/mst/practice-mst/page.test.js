// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-mst/copy.vi.js';

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

/** @param {Element} el */
function click(el) {
  /** @type {HTMLElement} */ (el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {Element} target @param {string} key */
function press(target, key) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();
/** @param {number} id */
const vertex = (id) => /** @type {Element} */ (document.querySelector(`[data-node="${id}"]`));
/** @param {string} name */
const weightField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.weightAria(name)}"]`)
  );
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}
function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const el = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {string} name */
const select = (name) =>
  /** @type {HTMLSelectElement} */ (document.querySelector(`select[name="${name}"]`));

/** @param {string} name */
const pickBox = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.pickAria(name)}"]`)
  );
/** @param {string} name */
function tick(name) {
  click(pickBox(name));
}

describe('MST problems lesson', () => {
  it('checks a predicted tree: cycle, size, a lighter swap, then correct', () => {
    render();
    expect(text()).toContain(m.predictHelp);
    for (const e of ['A — B', 'A — C', 'B — C']) tick(e);
    click(buttonByText(m.check));
    expect(text()).toContain('Chưa phải cây: B — C (2) khép một chu trình');
    tick('A — C');
    click(buttonByText(m.check));
    expect(text()).toContain('Cây khung trên 6 đỉnh có đúng 5 cạnh. Em đã chọn 2');
    for (const e of ['B — D', 'C — E', 'E — F']) tick(e);
    expect(text()).toContain('Đã chọn 5/5 cạnh, tổng trọng số 19.');
    expect(statValue(m.stats.picked)).toBe('5 / 5');
    expect(statValue(m.stats.yourWeight)).toBe('19');
    expect(statValue(m.stats.mst)).toBeUndefined();
    click(buttonByText(m.check));
    expect(text()).toContain(
      'Đây là một cây khung có trọng số 19, nhưng nhỏ nhất là 18. Gợi ý: D — E (7) khép một chu trình với cây của em, trên đó C — E (8) nặng hơn. Đổi hai cạnh này để bớt 1.',
    );
    tick('C — E');
    tick('D — E');
    click(buttonByText(m.check));
    expect(text()).toContain('Đúng rồi: đây là một cây khung nhỏ nhất, trọng số 18.');
    click(buttonByText(m.clear));
    expect(text()).toContain('Đã chọn 0/5 cạnh');
  });

  it('keeps the ticks when a weight changes and rejects a bad weight', () => {
    render();
    for (const e of ['A — B', 'B — C', 'C — D', 'D — E', 'E — F']) tick(e);
    commit(weightField('B — D'), '9');
    click(buttonByText(m.check));
    expect(text()).toContain('Đúng rồi: đây là một cây khung nhỏ nhất, trọng số 19.');
    commit(weightField('B — D'), 'abc');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('B — D').value).toBe('9');
  });

  it('steps through the minimum bottleneck path and reruns for new endpoints', () => {
    render();
    radio('bottleneck');
    expect(text()).toContain('Tìm một đường đi từ A đến F có cạnh nặng nhất nhẹ nhất có thể.');
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Đường đi nút cổ chai nhỏ nhất: A → B → D → E → F. Cạnh nặng nhất của nó nặng 7.',
    );
    expect(statValue(m.stats.bottleneck)).toBe('7');
    expect(vertex(0).getAttribute('aria-label')).toBe('Đỉnh A, điểm đầu');
    expect(vertex(3).getAttribute('aria-label')).toBe('Đỉnh D, trên đường đi');
    click(button('Bước trước'));
    expect(text()).toContain('Cạnh D — E (7) nối cây của A với cây của F.');
    commit(select('target'), '2');
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Đường đi nút cổ chai nhỏ nhất: A → B → C. Cạnh nặng nhất của nó nặng 3.',
    );
  });

  it('finds the second-best spanning tree', () => {
    render();
    radio('second');
    expect(text()).toContain('Cây khung nhỏ nhất T nặng 18.');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'Thêm A — C (4): đường đi trên T giữa hai đầu của nó có cạnh nặng nhất là A — B (3). 18 − 3 + 4 = 19',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain('Cây khung tốt nhì: thêm A — C (4), bỏ A — B (3), trọng số 19.');
    expect(statValue(m.stats.best)).toBe('19');
    expect(text()).toContain('+D — F −D — E → 20');
  });

  it('clears the ticks when an edge is removed on the canvas and resets the graph', () => {
    render();
    tick('A — B');
    radio('connect');
    click(vertex(3));
    click(vertex(5));
    expect(text()).toContain('Đã chọn 0/5 cạnh');
    click(vertex(4));
    click(vertex(5));
    click(buttonByText(m.check));
    expect(text()).toContain('Đồ thị này không liên thông');
    click(buttonByText(m.resetGraph));
    expect(weightField('D — F').value).toBe('9');
  });

  it('steps with the keyboard shortcut in a stepping mode', () => {
    render();
    radio('second');
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Thêm A — C (4)');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll(':scope > ol > li')[0]);
    answer(q, '9');
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '7');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
