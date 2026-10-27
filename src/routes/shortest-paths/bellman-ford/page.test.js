// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/bellman-ford/copy.en.js';

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

/** Values of one table row, by its header. @param {string} header */
function row(header) {
  const cells = [...document.querySelectorAll('svg title')]
    .map((el) => el.textContent ?? '')
    .filter((l) => l.startsWith(`Round ${header},`));
  return cells.map((l) => l.split(': ')[1].split(',')[0]);
}

describe('Bellman-Ford lesson', () => {
  it('fills the table round by round and stops early', () => {
    render();
    expect(text()).toContain(
      'Set the source’s label to 0 and every other label to ∞. With 5 vertices, at most 4 rounds are needed.',
    );
    click(button('Next step'));
    expect(text()).toContain('Round 1: relax every edge once, in list order.');
    click(button('Next step'));
    expect(text()).toContain(
      'Edge C → D (weight 3): d[C] is still ∞, so nothing to do this round.',
    );
    click(button('Last step'));
    expect(text()).toContain('Done after 3 rounds and 24 edge checks');
    click(button('Previous step'));
    expect(text()).toContain('Round 3 changed nothing, so the next round would not either.');
    expect(statValue(m.stats.relaxations)).toBe('24');
    expect(statValue(m.stats.updates)).toBe('5');
    expect(statValue(m.stats.round)).toBe('3 of 4');
    expect(row('1')).toEqual(['0', '6', '7', '11', '4']);
    expect(row('2')).toEqual(['0', '6', '7', '5', '4']);
  });

  it('finishes in fewer rounds with a good edge order', () => {
    render();
    commit(presetSelect(), 'good');
    click(button('Last step'));
    expect(text()).toContain('Done after 2 rounds and 16 edge checks');
  });

  it('flags the negative cycle in round V', () => {
    render();
    commit(presetSelect(), 'cycle');
    click(button('Last step'));
    expect(text()).toContain(
      'Edge B → C (weight −2): 1 + (−2) = −1 < 1: after V − 1 rounds an edge can still be relaxed, so a negative cycle is reachable. Following the parent links finds A → B → D → A.',
    );
    expect(statValue(m.stats.round)).toBe('V (check)');
    expect(row('V')).toEqual(['0', '−3', '1', '1', '−2']);
    expect(vertex(1).getAttribute('aria-label')).toContain('on the negative cycle');
  });

  it('reruns on a typed weight, rejects a bad one, and resets', () => {
    render();
    commit(weightField('D → A'), '0');
    click(button('Last step'));
    expect(text()).toContain('Following the parent links finds A → B → D → A.');
    commit(weightField('D → A'), '1.5');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('D → A').value).toBe('0');
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(text()).toContain('Done after 3 rounds');
  });

  it('changes the source, draws an edge, and steps with the keyboard', () => {
    render();
    commit(sourceSelect(), '2');
    click(button('Last step'));
    expect(vertex(0).getAttribute('aria-label')).toBe('Vertex S, d = ∞');
    radio('connect');
    click(vertex(2));
    click(vertex(0));
    click(button('Last step'));
    expect(vertex(0).getAttribute('aria-label')).toBe('Vertex S, d = 1');
    click(button('First step'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Round 1: relax every edge once');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '3');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
