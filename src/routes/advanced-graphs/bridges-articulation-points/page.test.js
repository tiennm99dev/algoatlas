// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/bridges-articulation-points/copy.en.js';

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

/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
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
/** @param {string} title */
const chips = (title) =>
  [
    ...([...document.querySelectorAll('h2')]
      .find((h) => h.textContent?.trim() === title)
      ?.parentElement?.querySelectorAll('li') ?? []),
  ].map((li) => li.textContent?.trim());

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

describe('bridges and articulation points lesson', () => {
  it('labels tin/low and finds the bridge and the cut vertices', () => {
    render();
    expect(text()).toContain('Every vertex starts unvisited.');
    click(button('Next step'));
    expect(text()).toContain('Start a DFS tree at A: tin = low = 0. A is its root.');
    click(button('Last step'));
    expect(text()).toContain('Done: 1 bridge and 3 articulation points, after 20 edge checks.');
    expect(statValue(m.stats.bridges)).toBe('1');
    expect(chips(m.bridgesLabel)).toEqual(['E — F']);
    expect(chips(m.cutsLabel)).toEqual(['C', 'E', 'F']);
    expect(vertex(3).getAttribute('aria-label')).toBe('Vertex D, finished, tin 3, low 2');
    expect(vertex(2).getAttribute('aria-label')).toBe(
      'Vertex C, articulation point, finished, tin 2, low 0',
    );
  });

  it('explains the bridge test on the return from F to E', () => {
    render();
    const frames = 40;
    for (let i = 0; i < frames && !text().includes('Back from F to E'); i++)
      click(button('Next step'));
    expect(text()).toContain(
      'Back from F to E: low[E] = 2. low[F] = 5 > tin[E] = 4: nothing under F climbs back to E, so E — F is a bridge and E is an articulation point.',
    );
    expect(chips(m.bridgesLabel)).toEqual(['E — F (just found)']);
  });

  it('adding D — F removes the bridge, and reset brings it back', () => {
    render();
    radio('connect');
    click(vertex(3));
    click(vertex(5));
    click(button('Last step'));
    expect(statValue(m.stats.bridges)).toBe('0');
    expect(chips(m.cutsLabel)).toEqual(['C', 'F']);
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(statValue(m.stats.bridges)).toBe('1');
  });

  it('a root with two tree children is a cut vertex', () => {
    render();
    radio('connect');
    // Removing B — C leaves B hanging off A, so the DFS from A has two tree children.
    click(vertex(1));
    click(vertex(2));
    click(button('Last step'));
    expect(chips(m.bridgesLabel)).toEqual(['A — B', 'E — F', 'C — A']);
    expect(chips(m.cutsLabel)).toEqual(['A', 'C', 'E', 'F']);
    click(button('Previous step'));
    expect(text()).toContain('A is a root with 2 tree children.');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Start a DFS tree at A');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '3');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '1');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
