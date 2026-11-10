// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-flows/copy.en.js';

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
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}
/** @param {number} id */
const vertex = (id) => /** @type {Element} */ (document.querySelector(`[data-node="${id}"]`));
/** @param {string} name */
const capacityField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.editor.capacityAria(name)}"]`)
  );
const scenario = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="scenario"]'));
const status = () => document.querySelector('[data-check]')?.textContent ?? '';
/** Titles of the run board's arrows. */
const arcTitles = () =>
  [...document.querySelectorAll('[data-arc] > title')].map((el) => el.textContent ?? '');

/** Draws the edge a → b with the connect tool and gives it capacity c. */
function connect(
  /** @type {number} */ a,
  /** @type {number} */ b,
  /** @type {string} */ name,
  c = 1,
) {
  click(vertex(a));
  click(vertex(b));
  commit(capacityField(name), String(c));
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

describe('Flow modelling practice', () => {
  it('builds the farms model by hand, checks it and solves it', () => {
    render();
    expect(text()).toContain(m.scenarios.supply.story);
    expect(text()).toContain('Your model has 7 vertices and 6 edges.');
    expect(status()).toContain(m.check.idle);
    click(button('Last step'));
    expect(statValue(m.stats.value)).toBe('0');

    click(buttonByText(m.checkModel));
    expect(status()).toContain('Not yet: 4 edges missing.');

    radio('connect');
    connect(0, 1, 'S → F', 9);
    connect(0, 2, 'S → G', 7);
    connect(4, 6, 'P → T', 8);
    connect(5, 6, 'Q → T', 9);
    expect(status()).toContain(m.check.idle);
    click(buttonByText(m.checkModel));
    expect(status()).toContain(m.check.ok(15));

    radio('run');
    click(button('Next step'));
    expect(text()).toContain('Pushed 3 along S → F → P → T. Flow so far: 3.');
    click(button('Last step'));
    expect(statValue(m.stats.value)).toBe('15');
    expect(statValue(m.stats.cut)).toBe('15');
    expect(text()).toContain('Your model carries at most 15.');
    click(button('Previous step'));
    expect(text()).toContain(
      'S still reaches {S, F}; the full edges F → D, F → P and S → G leave that side, a minimum cut of 5 + 3 + 7 = 15.',
    );
    expect(arcTitles()).toContain('Edge F → D: flow 5 of 5, cut edge');
    expect(arcTitles()).toContain('Edge S → F: flow 8 of 9, carries flow');
    expect(document.querySelector('[data-vertex="1"] > title')?.textContent).toBe(
      'Vertex F, S side of the cut',
    );
    click(button('First step'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Pushed 3 along S → F → P → T.');
  });

  it('lists what is wrong and loads a correct model', () => {
    render();
    commit(scenario(), 'routers');
    expect(text()).toContain(m.scenarios.routers.story);
    click(button('Last step'));
    expect(statValue(m.stats.value)).toBe('14');
    click(buttonByText(m.checkModel));
    expect(status()).toContain('Not yet: 5 edges missing, 3 edges the story does not need.');
    expect(status()).toContain(`${m.check.extraTitle}: A → B, A → T, B → T`);

    click(buttonByText(m.showModel));
    expect(text()).toContain(m.shownModel);
    click(buttonByText(m.checkModel));
    expect(status()).toContain(m.check.ok(12));
    click(button('Last step'));
    click(button('Previous step'));
    expect(text()).toContain(
      'the full edges S → B and A → A′ leave that side, a minimum cut of 6 + 6 = 12.',
    );

    commit(scenario(), 'convoys');
    click(buttonByText(m.checkModel));
    expect(status()).toContain('Not yet: 12 capacities wrong.');
    expect(status()).toContain(m.check.wrongTitle);
    expect(status()).toContain('S → A (4), S → B (3)');
    click(buttonByText(m.resetDrawing));
    expect(status()).toContain(m.check.idle);
  });

  it('refuses a bad capacity and reports a deleted sink', () => {
    render();
    commit(capacityField('F → D'), '0');
    expect(text()).toContain(m.badCapacity(20));
    expect(capacityField('F → D').value).toBe('5');
    commit(capacityField('F → D'), '4');
    expect(text()).not.toContain(m.badCapacity(20));
    radio('remove');
    click(vertex(6));
    expect(text()).toContain('The model needs both S and T.');
    click(buttonByText('Add node'));
    expect(vertex(6).getAttribute('aria-label')).toContain('Node T,');
    expect(text()).not.toContain('The model needs both S and T.');
    click(buttonByText(m.resetDrawing));
    expect(text()).toContain('Your model has 7 vertices and 6 edges.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '16');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '15');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
