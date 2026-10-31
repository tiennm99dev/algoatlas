// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-mst/copy.en.js';

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

/** @param {string} name */
const pickBox = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.pickAria(name)}"]`)
  );
/** @param {string} name */
function tick(name) {
  click(pickBox(name));
}

describe('MST problems lesson', () => {
  it('checks a predicted tree: cycle, size, a lighter swap, then correct', () => {
    render();
    expect(text()).toContain(m.predictHelp);
    for (const e of ['A — B', 'A — C', 'B — C']) tick(e);
    click(buttonByText(m.check));
    expect(text()).toContain('Not a tree: B — C (2) closes a cycle');
    tick('A — C');
    click(buttonByText(m.check));
    expect(text()).toContain('A spanning tree on 6 vertices has exactly 5 edges. You picked 2');
    for (const e of ['B — D', 'C — E', 'E — F']) tick(e);
    expect(text()).toContain('5 of 5 edges picked, total weight 19.');
    click(buttonByText(m.check));
    expect(text()).toContain(
      'A spanning tree of weight 19, but the minimum is 18. Hint: D — E (7) closes a cycle with your tree on which C — E (8) is heavier. Swap them to save 1.',
    );
    tick('C — E');
    tick('D — E');
    click(buttonByText(m.check));
    expect(text()).toContain('Correct: a minimum spanning tree, weight 18.');
    click(buttonByText(m.clear));
    expect(text()).toContain('0 of 5 edges picked');
  });

  it('keeps the ticks when a weight changes and rejects a bad weight', () => {
    render();
    for (const e of ['A — B', 'B — C', 'C — D', 'D — E', 'E — F']) tick(e);
    commit(weightField('B — D'), '9');
    click(buttonByText(m.check));
    expect(text()).toContain('Correct: a minimum spanning tree, weight 19.');
    commit(weightField('B — D'), 'abc');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('B — D').value).toBe('9');
  });

  it('steps through the minimum bottleneck path and reruns for new endpoints', () => {
    render();
    radio('bottleneck');
    expect(text()).toContain(
      'Find a path from A to F whose heaviest edge is as light as possible.',
    );
    click(button('Last step'));
    expect(text()).toContain(
      'Minimum bottleneck path: A → B → D → E → F. Its heaviest edge weighs 7.',
    );
    expect(statValue(m.stats.bottleneck)).toBe('7');
    expect(vertex(0).getAttribute('aria-label')).toBe('Vertex A, from');
    expect(vertex(3).getAttribute('aria-label')).toBe('Vertex D, on the path');
    click(button('Previous step'));
    expect(text()).toContain('Edge D — E (7) joins the tree of A to the tree of F.');
    commit(select('target'), '2');
    click(button('Last step'));
    expect(text()).toContain('Minimum bottleneck path: A → B → C. Its heaviest edge weighs 3.');
  });

  it('finds the second-best spanning tree', () => {
    render();
    radio('second');
    expect(text()).toContain('The minimum spanning tree T weighs 18.');
    click(button('Next step'));
    expect(text()).toContain(
      'Add A — C (4): the T-path between its ends has heaviest edge A — B (3). 18 − 3 + 4 = 19',
    );
    click(button('Last step'));
    expect(text()).toContain(
      'Second-best spanning tree: add A — C (4), drop A — B (3), weight 19.',
    );
    expect(statValue(m.stats.best)).toBe('19');
    expect(text()).toContain('+D — F −D — E → 20');
  });

  it('clears the ticks when an edge is removed on the canvas and resets the graph', () => {
    render();
    tick('A — B');
    radio('connect');
    click(vertex(3));
    click(vertex(5));
    expect(text()).toContain('0 of 5 edges picked');
    click(vertex(4));
    click(vertex(5));
    click(buttonByText(m.check));
    expect(text()).toContain('This graph is not connected');
    click(buttonByText(m.resetGraph));
    expect(weightField('D — F').value).toBe('9');
  });

  it('steps with the keyboard shortcut in a stepping mode', () => {
    render();
    radio('second');
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Add A — C (4)');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll(':scope > ol > li')[0]);
    answer(q, '9');
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '7');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
