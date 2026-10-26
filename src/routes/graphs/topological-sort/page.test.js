// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/topological-sort/copy.en.js';

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

describe('topological sort lesson', () => {
  it('runs Kahn on the dinner graph', () => {
    render();
    expect(text()).toContain('Count the edges into each task: A 0, B 1, C 1, D 0, E 2, F 1, G 2.');
    click(button('Next step'));
    expect(text()).toContain('Tasks with in-degree 0 need nothing first: queue A, D.');
    click(button('Next step'));
    expect(text()).toContain('Dequeue A and place it at position 1.');
    click(button('Next step'));
    expect(text()).toContain('Remove A → B: B now has in-degree 0, so enqueue it.');
    click(button('Next step'));
    expect(text()).toContain('Remove A → E: E still waits on 1 more.');
    click(button('Last step'));
    expect(text()).toContain('Done. Order: A, D, B, E, C, F, G. Every edge points forward.');
    expect(statValue(m.stats.backward)).toBe('0');
    expect(statValue(m.stats.placed)).toBe('7 / 7');
  });

  it('runs the DFS method and reverses the finish order', () => {
    render();
    radio('dfs');
    expect(text()).toContain('Every task starts unvisited.');
    click(button('Next step'));
    expect(text()).toContain('Visit A: mark it in progress.');
    click(button('Last step'));
    expect(text()).toContain('Reverse the finish order: D, A, E, B, C, F, G.');
    const card = [...document.querySelectorAll('h2')].find(
      (h) => h.textContent?.trim() === m.resultLabel,
    )?.parentElement;
    const chips = [...(card?.querySelectorAll('li') ?? [])].map((li) => li.textContent?.trim());
    expect(chips).toEqual(['D', 'A', 'E', 'B', 'C', 'F', 'G']);
  });

  it('both methods report a cycle after adding G → A', () => {
    render();
    radio('connect');
    click(vertex(6));
    click(vertex(0));
    click(button('Last step'));
    expect(text()).toContain('The queue is empty but A, B, C, E, F, G were never placed');
    expect(statValue(m.stats.backward)).toBe('—');
    radio('dfs');
    click(button('Last step'));
    expect(text()).toContain('Cycle A, B, C, F, G → A: no topological order exists.');
    expect(vertex(6).getAttribute('aria-label')).toContain('on the cycle');
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(text()).toContain('Reverse the finish order');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('queue A, D');
  });

  it('labels each task with its state and in-degree', () => {
    render();
    click(button('Next step'));
    expect(vertex(0).getAttribute('aria-label')).toBe('Task A, queued, in 0');
    expect(vertex(4).getAttribute('aria-label')).toBe('Task E, in 2');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, 'A, B, C, D, E, F, G');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, 'A,D,B,E,C,F,G');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
