// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-shortest-paths/copy.vi.js';

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

/** A button whose text starts with `label` (scenario cards also hold their story). @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) =>
    b.textContent?.trim().startsWith(label),
  );
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
/** @param {string} name */
const weightField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.weightAria(name)}"]`)
  );
/** The comparison row of one algorithm, as [answer, edges]. @param {string} name */
function compareRow(name) {
  const row = [...document.querySelectorAll('tbody tr')].find(
    (r) => r.querySelector('th')?.textContent?.trim() === name,
  );
  return [...(row?.querySelectorAll('td') ?? [])].map((td) => td.textContent?.trim());
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

describe('shortest-path practice', () => {
  it('runs BFS on the moves puzzle and calls it the best fit', () => {
    render();
    expect(text()).toContain('BFS: đưa đỉnh nguồn vào queue.');
    expect(text()).toContain(m.verdictPending);
    click(button('Bước tiếp'));
    expect(text()).toContain('Lấy 1 ra khỏi queue, cách đỉnh nguồn 0 cạnh.');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.answer)).toBe('4');
    expect(text()).toContain(m.verdicts.best);
    expect(text()).toContain('d(10) = 4, sau khi xét 13 cạnh. Hợp nhất: BFS.');
  });

  it('shows BFS going wrong on the road trip, and Dijkstra getting it right', () => {
    render();
    click(buttonByText(m.scenarios.roads.title));
    click(button('Đến bước cuối'));
    expect(text()).toContain(m.verdicts.wrong);
    expect(text()).toContain(
      'BFS cho d(T) = 12, nhưng khoảng cách ngắn nhất là 8. Hợp nhất: Dijkstra.',
    );
    expect(compareRow('BFS')).toEqual(['12', '8']);
    expect(compareRow('Bellman-Ford')).toEqual(['8', '16']);
    radio('dijkstra');
    click(button('Đến bước cuối'));
    expect(text()).toContain(m.verdicts.best);
    expect(statValue(m.stats.answer)).toBe('8');
  });

  it('shows Dijkstra settling too early on a negative edge', () => {
    render();
    click(buttonByText(m.scenarios.cashback.title));
    radio('dijkstra');
    const next = button('Bước tiếp');
    for (let i = 0; i < 40 && !text().includes('Chốt B với d = 5'); i++) click(next);
    expect(text()).toContain('Chốt B với d = 5');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.answer)).toBe('7');
    expect(text()).toContain('Dijkstra cho d(T) = 7, nhưng khoảng cách ngắn nhất là 6.');
    radio('bellman-ford');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.answer)).toBe('6');
  });

  it('reports the trading loop as a negative cycle', () => {
    render();
    click(buttonByText(m.scenarios.arbitrage.title));
    radio('bellman-ford');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.answer)).toBe(m.cycleAnswer);
    click(button('Bước trước'));
    expect(text()).toContain('Đến được một chu trình âm: A → B → C → A.');
    radio('bfs');
    click(button('Đến bước cuối'));
    expect(text()).toContain('vậy mà BFS vẫn in ra các con số');
  });

  it('reruns on a typed weight, rejects a bad one, and resets', () => {
    render();
    commit(weightField('5 → 10'), '3');
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'BFS cho d(10) = 6, nhưng khoảng cách ngắn nhất là 5. Hợp nhất: Dijkstra.',
    );
    radio('dijkstra');
    click(button('Đến bước cuối'));
    expect(text()).toContain(m.verdicts.best);
    commit(weightField('5 → 10'), '2.5');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('5 → 10').value).toBe('3');
    click(buttonByText(m.resetScenario));
    click(button('Đến bước cuối'));
    expect(text()).toContain(m.verdicts.works);
  });

  it('changes the target and steps with the keyboard', () => {
    render();
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select[name="target"]')), '5');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.answer)).toBe('3');
    click(button('Về bước đầu'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Lấy 1 ra khỏi queue');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '5');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
