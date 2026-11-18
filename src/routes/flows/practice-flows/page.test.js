// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-flows/copy.vi.js';

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
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}
/** @param {number} id */
const vertex = (id) => /** @type {Element} */ (document.querySelector(`[data-node="${id}"]`));
/** @param {string} name */
const capacityField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.editor.capacityAria(name)}"]`)
  );
const scenario = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="scenario"]'));
const status = () => document.querySelector('[data-check]')?.textContent ?? '';
/** Titles of the run board's arrows. */
const arcTitles = () =>
  [...document.querySelectorAll('[data-arc] > title')].map((el) => el.textContent ?? '');

/** Draws the edge a → b with the connect tool and gives it capacity c. */
function connect(
  /** @type {number} */ a,
  /** @type {number} */ b,
  /** @type {string} */ name,
  c = 1,
) {
  click(vertex(a));
  click(vertex(b));
  commit(capacityField(name), String(c));
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

describe('Flow modelling practice', () => {
  it('builds the farms model by hand, checks it and solves it', () => {
    render();
    expect(text()).toContain(m.scenarios.supply.story);
    expect(text()).toContain('Mô hình của bạn có 7 đỉnh và 6 cạnh.');
    expect(status()).toContain(m.check.idle);
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.value)).toBe('0');

    click(buttonByText(m.checkModel));
    expect(status()).toContain('Chưa đúng: thiếu 4 cạnh.');

    radio('connect');
    connect(0, 1, 'S → F', 9);
    connect(0, 2, 'S → G', 7);
    connect(4, 6, 'P → T', 8);
    connect(5, 6, 'Q → T', 9);
    expect(status()).toContain(m.check.idle);
    click(buttonByText(m.checkModel));
    expect(status()).toContain(m.check.ok(15));

    radio('run');
    click(button('Bước tiếp'));
    expect(text()).toContain('Đã đẩy 3 theo S → F → P → T. Luồng đến lúc này: 3.');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.value)).toBe('15');
    expect(statValue(m.stats.cut)).toBe('15');
    expect(text()).toContain('Mô hình của bạn mang được tối đa 15.');
    click(button('Bước trước'));
    expect(text()).toContain(
      'S vẫn đến được {S, F}; các cạnh đầy F → D, F → P và S → G đi ra khỏi phía đó, tạo thành lát cắt nhỏ nhất 5 + 3 + 7 = 15.',
    );
    expect(arcTitles()).toContain('Cạnh F → D: luồng 5/5, cạnh cắt');
    expect(arcTitles()).toContain('Cạnh S → F: luồng 8/9, đang có luồng');
    expect(document.querySelector('[data-vertex="1"] > title')?.textContent).toBe(
      'Đỉnh F, phía S của lát cắt',
    );
    click(button('Về bước đầu'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Đã đẩy 3 theo S → F → P → T.');
  });

  it('lists what is wrong and loads a correct model', () => {
    render();
    commit(scenario(), 'routers');
    expect(text()).toContain(m.scenarios.routers.story);
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.value)).toBe('14');
    click(buttonByText(m.checkModel));
    expect(status()).toContain('Chưa đúng: thiếu 5 cạnh, 3 cạnh câu chuyện không cần.');
    expect(status()).toContain(`${m.check.extraTitle}: A → B, A → T, B → T`);

    click(buttonByText(m.showModel));
    expect(text()).toContain(m.shownModel);
    click(buttonByText(m.checkModel));
    expect(status()).toContain(m.check.ok(12));
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(text()).toContain(
      'các cạnh đầy S → B và A → A′ đi ra khỏi phía đó, tạo thành lát cắt nhỏ nhất 6 + 6 = 12.',
    );

    commit(scenario(), 'convoys');
    click(buttonByText(m.checkModel));
    expect(status()).toContain('Chưa đúng: 12 sức chứa sai.');
    expect(status()).toContain(m.check.wrongTitle);
    expect(status()).toContain('S → A (4), S → B (3)');
    click(buttonByText(m.resetDrawing));
    expect(status()).toContain(m.check.idle);
  });

  it('refuses a bad capacity and reports a deleted sink', () => {
    render();
    commit(capacityField('F → D'), '0');
    expect(text()).toContain(m.badCapacity(20));
    expect(capacityField('F → D').value).toBe('5');
    commit(capacityField('F → D'), '4');
    expect(text()).not.toContain(m.badCapacity(20));
    radio('remove');
    click(vertex(6));
    expect(text()).toContain('Mô hình cần có cả S và T.');
    click(buttonByText('Thêm đỉnh'));
    expect(vertex(6).getAttribute('aria-label')).toContain('Đỉnh T,');
    expect(text()).not.toContain('Mô hình cần có cả S và T.');
    click(buttonByText(m.resetDrawing));
    expect(text()).toContain('Mô hình của bạn có 7 đỉnh và 6 cạnh.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '16');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '15');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
