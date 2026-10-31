// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/prim/copy.en.js';

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

/** @param {string} name */
const select = (name) =>
  /** @type {HTMLSelectElement} */ (document.querySelector(`select[name="${name}"]`));

describe('Prim’s algorithm lesson', () => {
  it('grows the tree from A with a heap and skips stale edges', () => {
    render();
    expect(text()).toContain(
      'Start the tree at A and push its 2 edges into the heap: A — B 3, A — C 4.',
    );
    click(button('Next step'));
    expect(text()).toContain(
      'Pop A — B (weight 3), the lightest edge in the heap. B is outside the tree',
    );
    expect(vertex(1).getAttribute('aria-label')).toBe(
      'Vertex B, just added or expanded, in the tree, joined 2',
    );
    let guard = 0;
    while (!text().includes('it is stale') && guard++ < 40) click(button('Next step'));
    expect(text()).toContain('Pop A — C (weight 4), but C is already in the tree.');
    click(button('Last step'));
    expect(text()).toContain(
      'All 6 vertices are in the tree, weight 18. 2 entries left in the heap are never popped.',
    );
    expect(statValue(m.stats.stale)).toBe('2');
    expect(statValue(m.stats.pushes)).toBe('9');
    expect(vertex(5).getAttribute('aria-label')).toBe('Vertex F, in the tree, joined 6');
  });

  it('switches to the array of keys and counts the scans', () => {
    render();
    radio('array');
    expect(text()).toContain('Set key[A] = 0 and every other key to ∞.');
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('Edge A — B (weight 3) is lighter than key[B] = ∞.');
    expect(text()).toContain('B 3 via A');
    click(button('Last step'));
    expect(text()).toContain('weight 18, after 15 key comparisons.');
    expect(statValue(m.stats.comparisons)).toBe('15');
  });

  it('reruns for another start, a dense preset and a new weight, and rejects bad weights', () => {
    render();
    commit(select('start'), '5');
    click(button('Last step'));
    expect(vertex(0).getAttribute('aria-label')).toBe('Vertex A, in the tree, joined 6');
    commit(select('preset'), 'dense');
    click(button('Last step'));
    expect(statValue(m.stats.weight)).toBe('17');
    commit(weightField('B — E'), '9');
    click(button('Last step'));
    expect(statValue(m.stats.weight)).toBe('18');
    commit(weightField('B — E'), '-1');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('B — E').value).toBe('9');
    click(buttonByText(m.resetGraph));
    expect(select('preset').value).toBe('sparse');
  });

  it('spans only the start’s component when a vertex is cut off', () => {
    render();
    radio('connect');
    click(vertex(3));
    click(vertex(5));
    click(vertex(4));
    click(vertex(5));
    click(button('Last step'));
    expect(text()).toContain('1 vertex cannot be reached from A');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Pop A — B (weight 3)');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll(':scope > ol > li')[1]);
    answer(q, '3');
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer(q, '2');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
