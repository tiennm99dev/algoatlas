// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-advanced-graphs/copy.en.js';

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

/** @param {string} label */
function edgeButton(label) {
  const el = document.querySelector(`[role="button"][aria-label="${label}"]`);
  if (!el) throw new Error(`no edge labelled ${label}`);
  return el;
}

/** @param {string} value */
function failNode(value) {
  const el = /** @type {HTMLSelectElement} */ (document.querySelector('select'));
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

describe('advanced graph practice', () => {
  it('failing D splits the network into three parts', () => {
    render();
    expect(text()).toContain('The whole network is 1 connected piece. Pick a node to fail.');
    failNode('3');
    expect(text()).toContain('Now fail D.');
    click(button('Next step'));
    expect(text()).toContain('D fails: remove it and every link it has.');
    click(button('Last step'));
    expect(text()).toContain(
      '3 parts still work together. That is more than the 1 before, so D is critical: an articulation point.',
    );
    expect(statValue(m.stats.critical)).toBe('yes');
    expect(statValue(m.stats.largest)).toBe('3');
    expect(chips(m.partsLabel)).toEqual(['P1: A B C', 'P2: E', 'P3: F G H']);
  });

  it('pressing a router fails it, and pressing it again restores it', () => {
    render();
    click(vertex(5));
    click(button('Last step'));
    expect(statValue(m.stats.largest)).toBe('5');
    expect(vertex(5).getAttribute('aria-label')).toBe('Router F, failed');
    click(vertex(5));
    click(button('Last step'));
    expect(text()).toContain('1 part still works together. Pick a node to fail and compare.');
  });

  it('a non-critical failure keeps the network whole', () => {
    render();
    failNode('4');
    click(button('Last step'));
    expect(statValue(m.stats.critical)).toBe('no');
  });

  it('adding E — F turns three parts into two', () => {
    render();
    radio('connect');
    click(vertex(4));
    click(vertex(5));
    failNode('3');
    click(button('Last step'));
    expect(statValue(m.stats.after)).toBe('2');
    click(buttonByText(m.resetGraph));
    expect(statValue(m.stats.after)).toBe('0');
    click(button('Last step'));
    expect(statValue(m.stats.critical)).toBe('—');
  });

  it('finds the dependency cycles and a build order once they are broken', () => {
    render();
    radio('deps');
    expect(text()).toContain('Run Tarjan’s SCC search');
    click(button('Last step'));
    expect(text()).toContain('Done: 2 dependency cycles on 5 modules.');
    expect(chips(m.cyclesLabel)).toEqual(['F G', 'C D E']);
    expect(statValue(m.stats.buildable)).toBe('no');
    radio('remove');
    click(edgeButton('Delete edge E to C'));
    click(edgeButton('Delete edge G to F'));
    click(button('Last step'));
    expect(text()).toContain(
      'Done: no cycle. Build in the order the components finished: E, G, D, C, B, F, A.',
    );
    expect(chips(m.orderLabel)).toEqual(['E', 'G', 'D', 'C', 'B', 'F', 'A']);
    expect(statValue(m.stats.buildable)).toBe('yes');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('A works and has no part yet');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '2');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '3');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
