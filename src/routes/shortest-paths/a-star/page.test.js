// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/a-star/copy.en.js';

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

/** Keyboard activation reports detail 0, which the grid treats as an edit. */
/** @param {HTMLElement} el */
function keyActivate(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
  flushSync();
}

/** @param {HTMLElement} target @param {string} key */
function press(target, key) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

/** @param {string} value */
const radio = (value) =>
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));

const text = () => document.body.textContent ?? '';
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();
/** The comparison row of one heuristic, as [expanded, path]. @param {string} name */
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

describe('A* lesson', () => {
  it('runs Manhattan A* to a shortest path and compares the heuristics', () => {
    render();
    expect(text()).toContain('Put the start in the open set with g = 0 and f = h(start) = 11.');
    click(button('Next step'));
    expect(text()).toContain('Pop (4,2) with f = g + h = 0 + 11 = 11');
    click(button('Next step'));
    expect(text()).toContain('g = 0 + 1 = 1 and h = 12, so f = 13. Push it.');
    click(button('Last step'));
    expect(text()).toContain('Reached the goal after expanding 36 cells. The path has 15 steps');
    expect(statValue(m.stats.expanded)).toBe('36');
    expect(statValue(m.stats.path)).toBe('15');
    expect(compareRow(m.heuristics.zero)).toEqual(['118', '15']);
    expect(compareRow(m.heuristics.manhattan)).toEqual(['36', '15']);
    expect(compareRow(m.heuristics.triple)).toEqual(['39', '21']);
  });

  it('switches the heuristic and reruns', () => {
    render();
    radio('zero');
    expect(text()).toContain('A* is exactly Dijkstra');
    click(button('Last step'));
    expect(statValue(m.stats.expanded)).toBe('118');
    radio('triple');
    click(button('Last step'));
    expect(text()).toContain('The path has 21 steps, but 3 × Manhattan can overestimate');
  });

  it('switches the cell numbers between g, h and f', () => {
    render();
    radio('h');
    expect(button('Row 0, column 0, h 17')).toBeTruthy();
    radio('f');
    click(button('Last step'));
    expect(button('Row 4, column 2, Start, f 11')).toBeTruthy();
    radio('g');
    expect(button('Row 4, column 13, Goal, g 15')).toBeTruthy();
  });

  it('edits walls from the keyboard, refuses the start cell, and resets', () => {
    render();
    keyActivate(button('Row 4, column 9, Wall'));
    expect(text()).toContain('Wall removed at (4,9).');
    expect(compareRow(m.heuristics.manhattan)).toEqual(['12', '11']);
    keyActivate(button('Row 4, column 2, Start, f 11'));
    expect(text()).toContain(m.blockedCell);
    radio('goal');
    keyActivate(button('Row 0, column 0'));
    expect(text()).toContain('Goal moved to (0,0).');
    click(buttonByText(m.resetGrid));
    expect(compareRow(m.heuristics.manhattan)).toEqual(['36', '15']);
    expect(button('Row 4, column 13, Goal')).toBeTruthy();
  });

  it('reports a sealed goal and steps with the keyboard', () => {
    render();
    for (const [r, c] of [
      [3, 13],
      [5, 13],
      [4, 12],
      [4, 14],
    ])
      keyActivate(button(`Row ${r}, column ${c}`));
    click(button('Last step'));
    expect(text()).toContain('walls cut it off');
    click(button('First step'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Pop (4,2)');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '36');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '118');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
