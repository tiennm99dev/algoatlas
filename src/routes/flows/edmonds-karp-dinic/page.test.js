// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/edmonds-karp-dinic/copy.en.js';

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
/** @param {string} name */
const select = (name) =>
  /** @type {HTMLSelectElement} */ (document.querySelector(`select[name="${name}"]`));
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}
/** @param {string} name */
const capacityField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.editor.capacityAria(name)}"]`)
  );
/** Titles of the board's arrows. */
const arcTitles = () =>
  [...document.querySelectorAll('[data-arc] > title')].map((el) => el.textContent ?? '');

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

describe('Edmonds-Karp and Dinic lesson', () => {
  it('runs Edmonds-Karp with one BFS per augmenting path', () => {
    render();
    expect(text()).toContain('Each round runs BFS from S');
    click(button('Next step'));
    expect(text()).toContain(
      'BFS reached T in 3 arcs along S → A → C → T. Its bottleneck is b = 12.',
    );
    expect(arcTitles()).toContain('Arc S → A: room 16, path adds flow here');
    click(button('Next step'));
    expect(statValue(m.stats.value)).toBe('12');
    click(button('Last step'));
    expect(text()).toContain(
      'Done: 3 augmenting paths and 4 BFS runs found the maximum flow 23 from S to T.',
    );
    expect(statValue(m.stats.searches.ek)).toBe('4');
    expect(statValue(m.stats.checks)).toBe('66');
  });

  it('switches to Dinic: levels, dead ends and blocking flows', () => {
    render();
    radio('dinic');
    expect(text()).toContain('Each phase runs BFS once');
    click(button('Next step'));
    expect(text()).toContain('Phase 1: BFS puts T at level 3.');
    expect(arcTitles()).toContain('Arc B → A: room 4, outside the level graph');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('DFS reached A, but no level-graph arc out of A has room');
    expect(document.querySelector('[data-vertex="1"] > title')?.textContent).toBe(
      'Vertex A, level 1, dead end this phase',
    );
    click(button('Last step'));
    expect(text()).toContain(
      'Done: 3 augmenting paths and 3 BFS runs found the maximum flow 23 from S to T.',
    );
    expect(statValue(m.stats.searches.dinic)).toBe('3');
  });

  it('needs one phase on the layered network and shows the flow view', () => {
    render();
    commit(select('preset'), 'layers');
    radio('dinic');
    click(button('Last step'));
    expect(statValue(m.stats.searches.dinic)).toBe('2');
    expect(statValue(m.stats.paths)).toBe('4');
    radio('flow');
    expect(arcTitles()).toContain('Edge C → E: flow 3 of 4, carries flow');
    radio('ek');
    click(button('Last step'));
    expect(statValue(m.stats.searches.ek)).toBe('5');
  });

  it('reruns on a new capacity, refuses a bad one and a bad sink, and resets', () => {
    render();
    commit(select('preset'), 'zigzag');
    commit(capacityField('A → T'), '5');
    click(button('Last step'));
    expect(statValue(m.stats.value)).toBe('25');
    commit(capacityField('A → T'), '0');
    expect(text()).toContain(m.badCapacity(20));
    expect(capacityField('A → T').value).toBe('5');
    commit(select('sink'), '0');
    expect(text()).toContain(m.sameEnds);
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(statValue(m.stats.value)).toBe('40');
    click(button('First step'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('along S → A → T');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '3');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
