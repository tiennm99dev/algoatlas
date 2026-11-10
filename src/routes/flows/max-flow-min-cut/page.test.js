// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/max-flow-min-cut/copy.en.js';

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

/** @param {number} i */
const vertexTitle = (i) => document.querySelector(`[data-vertex="${i}"] > title`)?.textContent;

describe('Max-flow min-cut lesson', () => {
  it('finds the flow, shades the reachable set and reads off the cut', () => {
    render();
    expect(text()).toContain('First find a maximum flow from S to T');
    click(button('Next step'));
    expect(text()).toContain('Pushed 12 along S → A → C → T. Flow value: 12.');
    for (let i = 0; i < 3; i++) click(button('Next step'));
    expect(text()).toContain('the flow of value 23 is maximum.');
    click(button('Next step'));
    expect(text()).toContain(
      'Take S from the queue. Its arcs with room reach A and B, which join the S side.',
    );
    expect(vertexTitle(0)).toBe('Vertex S, source, taken from the queue now, reachable from s');
    expect(vertexTitle(1)).toBe('Vertex A, just reached, reachable from s');
    click(button('Next step'));
    expect(text()).toContain('Take A from the queue. It reaches no new vertex');
    click(button('Last step'));
    click(button('Previous step'));
    expect(text()).toContain(
      'S = {S, A, B, D}, and T holds the rest. The cut edges A → C, D → C and D → T are all saturated, and edges from T back to S carry nothing, so c(S, T) = 12 + 7 + 4 = 23 = |f|.',
    );
    expect(statValue(m.stats.cut)).toBe('23');
    expect(statValue(m.stats.edges)).toBe('3');
    expect(arcTitles()).toContain('Edge A → C: flow 12 of 12, cut edge');
    radio('residual');
    expect(arcTitles()).toContain('Arc S → A: room 4');
    expect(arcTitles()).toContain('Backward arc C → A: can cancel 12');
  });

  it('lets the learner try their own cut', () => {
    render();
    radio('mine');
    expect(text()).toContain(m.mine.verdict(29, 23));
    click(button(m.mine.aria('A')));
    expect(text()).toContain('S → B (13), A → C (12)');
    expect(text()).toContain(m.mine.verdict(25, 23));
    click(button(m.mine.aria('B')));
    click(button(m.mine.aria('D')));
    expect(text()).toContain(m.mine.verdict(23, 23));
    expect(arcTitles()).toContain('Edge D → T: capacity 4, crosses from S to T');
    expect(vertexTitle(4)).toBe('Vertex D, S side');
    click(button(m.mine.aria('T')));
    expect(text()).toContain(m.mine.verdict(23, 23));
    click(button(m.mine.aria('D')));
    expect(text()).toContain(m.mine.verdict(26, 23));
  });

  it('returns the smallest minimum cut on ties and reruns on edits', () => {
    render();
    commit(select('preset'), 'ties');
    click(button('Last step'));
    expect(text()).toContain('A minimum cut of capacity 7, equal to the maximum flow.');
    expect(vertexTitle(1)).toBe('Vertex A');
    commit(capacityField('S → A'), '9');
    click(button('Last step'));
    expect(statValue(m.stats.cut)).toBe('7');
    expect(vertexTitle(1)).toBe('Vertex A, S side');
    commit(capacityField('S → A'), 'x');
    expect(text()).toContain(m.badCapacity(20));
    commit(select('source'), '3');
    expect(text()).toContain(m.sameEnds);
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(vertexTitle(1)).toBe('Vertex A');
    click(button('First step'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Pushed 2 along S → A → T.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '23');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '25');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
