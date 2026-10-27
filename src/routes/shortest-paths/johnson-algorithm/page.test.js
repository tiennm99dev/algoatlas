// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/johnson-algorithm/copy.en.js';

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
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

/** Matrix values of one row, by its source name. @param {string} from */
function matrixRow(from) {
  return [...document.querySelectorAll('svg title')]
    .map((el) => el.textContent ?? '')
    .filter((l) => l.startsWith(`From ${from} to `))
    .map((l) => l.split(': ')[1].split(',')[0]);
}

/** The w′ column of the edge table, by edge name. @param {string} name */
function reweighted(name) {
  const row = weightField(name).closest('tr');
  return row?.querySelectorAll('td')[3]?.textContent?.trim();
}

/** Steps forward until the narration contains `needle`. @param {string} needle */
function stepUntil(needle) {
  const next = button('Next step');
  for (let i = 0; i < 400 && !text().includes(needle); i++) click(next);
  expect(text()).toContain(needle);
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

describe('Johnson’s algorithm lesson', () => {
  it('runs Bellman-Ford, reweights, and fills the matrix row by row', () => {
    render();
    expect(text()).toContain(
      'Add a new vertex q with an edge of weight 0 to each of the 5 vertices.',
    );
    expect(statValue(m.stats.phase)).toBe(m.phases.start);
    click(button('Next step'));
    expect(text()).toContain('Bellman-Ford round 1');
    stepUntil('Round 3 changed nothing, so the potentials are final');
    expect(text()).toContain('h(C) = −5');
    stepUntil('Edge A → C: w′ = 8 + 0 − (−5) = 13.');
    expect(statValue(m.stats.phase)).toBe(m.phases.reweight);
    expect(reweighted('A → C')).toBe('13');
    stepUntil('Dijkstra from A is done.');
    expect(matrixRow('A')).toEqual(['0', '1', '−3', '2', '−4']);
    expect(matrixRow('B')).toEqual(['—', '—', '—', '—', '—']);
    click(button('Last step'));
    expect(text()).toContain('Done: 5 Dijkstra runs filled the whole matrix');
    expect(matrixRow('B')).toEqual(['3', '0', '−4', '1', '−1']);
    expect(matrixRow('E')).toEqual(['8', '5', '1', '6', '0']);
    expect(statValue(m.stats.bfChecks)).toBe('42');
    expect(statValue(m.stats.dijkstraChecks)).toBe('45');
  });

  it('shows the reweighted graph in the w′ view', () => {
    render();
    click(button('Last step'));
    radio('wp');
    const svg = document.querySelector(`svg[aria-label^="${m.graphAriaReweighted}"]`);
    expect(svg).not.toBeNull();
    const labels = [...(svg?.querySelectorAll('text') ?? [])].map((t) => t.textContent);
    expect(labels).toContain('13');
    expect(labels).not.toContain('-4');
    radio('w');
    expect(document.querySelector(`svg[aria-label^="${m.graphAria}"]`)).not.toBeNull();
  });

  it('stops at a negative cycle', () => {
    render();
    commit(presetSelect(), 'cycle');
    click(button('Last step'));
    expect(text()).toContain(
      'Stopped: with a negative cycle there is no all-pairs answer to give.',
    );
    expect(statValue(m.stats.phase)).toBe(m.phases.cycle);
    click(button('Previous step'));
    expect(text()).toContain('so the graph has a negative cycle: B → D → C → B.');
    expect(vertex(1).getAttribute('aria-label')).toContain('on the negative cycle');
  });

  it('keeps every h at 0 when no weight is negative', () => {
    render();
    commit(presetSelect(), 'positive');
    click(button('Last step'));
    for (const v of 'ABCDE') expect(text()).toContain(`h(${v}) = 0`);
    expect(reweighted('D → C')).toBe('5');
  });

  it('reruns on a typed weight, rejects a bad one, and resets', () => {
    render();
    commit(weightField('D → C'), '-6');
    click(button('Last step'));
    expect(text()).toContain('Stopped: with a negative cycle');
    commit(weightField('D → C'), 'abc');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('D → C').value).toBe('-6');
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(text()).toContain('Done: 5 Dijkstra runs');
  });

  it('steps with the keyboard', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Bellman-Ford round 1');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '-4');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '−5');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
