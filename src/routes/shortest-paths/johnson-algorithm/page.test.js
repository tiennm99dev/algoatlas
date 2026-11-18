// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/johnson-algorithm/copy.vi.js';

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
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

/** Matrix values of one row, by its source name. @param {string} from */
function matrixRow(from) {
  return [...document.querySelectorAll('svg title')]
    .map((el) => el.textContent ?? '')
    .filter((l) => l.startsWith(`Từ ${from} đến `))
    .map((l) => l.split(': ')[1].split(',')[0]);
}

/** The w′ column of the edge table, by edge name. @param {string} name */
function reweighted(name) {
  const row = weightField(name).closest('tr');
  return row?.querySelectorAll('td')[3]?.textContent?.trim();
}

/** Steps forward until the narration contains `needle`. @param {string} needle */
function stepUntil(needle) {
  const next = button('Bước tiếp');
  for (let i = 0; i < 400 && !text().includes(needle); i++) click(next);
  expect(text()).toContain(needle);
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

describe('Johnson’s algorithm lesson', () => {
  it('runs Bellman-Ford, reweights, and fills the matrix row by row', () => {
    render();
    expect(text()).toContain(
      'Thêm một đỉnh mới q, nối đến mỗi đỉnh trong 5 đỉnh bằng một cạnh trọng số 0.',
    );
    expect(statValue(m.stats.phase)).toBe(m.phases.start);
    click(button('Bước tiếp'));
    expect(text()).toContain('Bellman-Ford, vòng 1');
    stepUntil('Vòng 3 không đổi gì, nên các thế năng đã là cuối cùng');
    expect(text()).toContain('h(C) = −5');
    stepUntil('Cạnh A → C: w′ = 8 + 0 − (−5) = 13.');
    expect(statValue(m.stats.phase)).toBe(m.phases.reweight);
    expect(reweighted('A → C')).toBe('13');
    stepUntil('Dijkstra từ A đã xong.');
    expect(matrixRow('A')).toEqual(['0', '1', '−3', '2', '−4']);
    expect(matrixRow('B')).toEqual(['—', '—', '—', '—', '—']);
    click(button('Đến bước cuối'));
    expect(text()).toContain('Xong: 5 lần chạy Dijkstra đã điền kín ma trận');
    expect(matrixRow('B')).toEqual(['3', '0', '−4', '1', '−1']);
    expect(matrixRow('E')).toEqual(['8', '5', '1', '6', '0']);
    expect(statValue(m.stats.bfChecks)).toBe('42');
    expect(statValue(m.stats.dijkstraChecks)).toBe('45');
  });

  it('shows the reweighted graph in the w′ view', () => {
    render();
    click(button('Đến bước cuối'));
    radio('wp');
    const svg = document.querySelector(`svg[aria-label^="${m.graphAriaReweighted}"]`);
    expect(svg).not.toBeNull();
    const labels = [...(svg?.querySelectorAll('text') ?? [])].map((t) => t.textContent);
    expect(labels).toContain('13');
    expect(labels).not.toContain('-4');
    radio('w');
    expect(document.querySelector(`svg[aria-label^="${m.graphAria}"]`)).not.toBeNull();
  });

  it('stops at a negative cycle', () => {
    render();
    commit(presetSelect(), 'cycle');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đã dừng: khi có chu trình âm thì không có kết quả cho mọi cặp đỉnh.');
    expect(statValue(m.stats.phase)).toBe(m.phases.cycle);
    click(button('Bước trước'));
    expect(text()).toContain('nên đồ thị có chu trình âm: B → D → C → B.');
    expect(vertex(1).getAttribute('aria-label')).toContain('trên chu trình âm');
  });

  it('keeps every h at 0 when no weight is negative', () => {
    render();
    commit(presetSelect(), 'positive');
    click(button('Đến bước cuối'));
    for (const v of 'ABCDE') expect(text()).toContain(`h(${v}) = 0`);
    expect(reweighted('D → C')).toBe('5');
  });

  it('reruns on a typed weight, rejects a bad one, and resets', () => {
    render();
    commit(weightField('D → C'), '-6');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đã dừng: khi có chu trình âm');
    commit(weightField('D → C'), 'abc');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('D → C').value).toBe('-6');
    click(buttonByText(m.resetGraph));
    click(button('Đến bước cuối'));
    expect(text()).toContain('Xong: 5 lần chạy Dijkstra');
  });

  it('steps with the keyboard', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Bellman-Ford, vòng 1');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '-4');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '−5');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
