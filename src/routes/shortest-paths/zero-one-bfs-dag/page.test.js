// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/zero-one-bfs-dag/copy.en.js';

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
/** The drawn vertex's accessible name, read from its SVG title. @param {string} name */
const vertexTitle = (name) =>
  [...document.querySelectorAll('svg title')]
    .map((t) => t.textContent ?? '')
    .find((t) => t.startsWith(`Vertex ${name},`));
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();
/** @param {string} name */
const weightField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.weightAria(name)}"]`)
  );
const sourceSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="source"]'));
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

describe('0-1 BFS and DAG shortest paths lesson', () => {
  it('runs 0-1 BFS with front and back pushes and a skipped copy', () => {
    render();
    expect(text()).toContain('Set d[S] = 0, every other label ∞, and put S in the deque.');
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain(
      'Edge S → A has weight 1: d[A] = 0 + 1 = 1 < ∞. One more than S, so push A to the back.',
    );
    click(button('Next step'));
    expect(text()).toContain(
      'Edge S → B has weight 0: d[B] = 0 + 0 = 0 < ∞. Same distance as S, so push B to the front.',
    );
    let guard = 0;
    while (!text().includes('Pop T again') && guard++ < 40) click(button('Next step'));
    expect(text()).toContain('Pop T again: this copy was pushed before a shorter route was found');
    click(button('Last step'));
    expect(text()).toContain('The deque is empty after 8 pops, 3 to the front and 4 to the back.');
    expect(vertexTitle('T')).toBe('Vertex T, d = 1, done');
  });

  it('toggles a 0-1 weight and reruns', () => {
    render();
    click(button(m.toggleAria('E → T', 0)));
    click(button('Last step'));
    expect(statValue(m.stats.pops)).toBe('7');
    expect(vertexTitle('T')).toBe('Vertex T, d = 2, done');
    click(buttonByText(m.resetWeights));
    click(button('Last step'));
    expect(statValue(m.stats.pops)).toBe('8');
  });

  it('relaxes the DAG in topological order, skipping the unreachable vertex', () => {
    render();
    radio('short');
    expect(text()).toContain(
      'Sort the DAG topologically: R, S, T, X, Y, Z. Every edge points from left to right in this order.',
    );
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('R still has d = ∞: the source cannot reach it');
    click(button('Last step'));
    expect(text()).toContain('One pass over the order relaxed 8 edges, each once');
    expect(vertexTitle('Z')).toContain('Vertex Z, d = 3');
    expect(statValue(m.stats.relaxations)).toBe('8 / 10');
  });

  it('finds longest paths and rejects a bad weight', () => {
    render();
    radio('long');
    click(button('Last step'));
    expect(vertexTitle('Z')).toContain('Vertex Z, d = 10');
    expect(vertexTitle('R')).toContain('Vertex R, d = −∞');
    commit(weightField('X → Z'), '-5');
    click(button('Last step'));
    expect(vertexTitle('Z')).toContain('Vertex Z, d = 6');
    commit(weightField('X → Z'), '500');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('X → Z').value).toBe('-5');
  });

  it('changes the source and steps with the keyboard', () => {
    render();
    commit(sourceSelect(), '2');
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Pop B from the front.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '1');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '2');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
