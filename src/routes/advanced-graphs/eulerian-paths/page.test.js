// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/eulerian-paths/copy.en.js';

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

describe('eulerian paths lesson', () => {
  it('checks degrees, then traces the circuit with two detours', () => {
    render();
    expect(text()).toContain('Count degrees: every degree is even.');
    expect(vertex(2).getAttribute('aria-label')).toBe('Vertex C, deg 4');
    click(button('Next step'));
    expect(text()).toContain('so an Euler circuit exists. Start at A.');
    click(button('Next step'));
    expect(text()).toContain('Walk A — B and push B. 1 unused edge is left at A.');
    expect(vertex(1).getAttribute('aria-label')).toBe('Vertex B, pen is here, 1 left');
    for (let i = 0; i < 3; i++) click(button('Next step'));
    expect(text()).toContain('A has no unused edge: pop it onto the route. Back up to C.');
    click(button('Next step'));
    expect(text()).toContain('C still has unused edges: start a detour cycle here along C — D.');
    click(button('Last step'));
    expect(text()).toContain(
      'Euler circuit A → B → C → D → E → F → G → E → C → A, using all 9 edges once.',
    );
    expect(statValue(m.stats.detours)).toBe('2');
    expect(statValue(m.stats.used)).toBe('9 / 9');
    expect(chips(m.routeLabel)).toEqual(['A', 'C', 'E', 'G', 'F', 'E', 'D', 'C', 'B', 'A']);
  });

  it('removing G — E gives a path from E to G', () => {
    render();
    radio('remove');
    click(edgeButton('Delete edge G and E'));
    expect(text()).toContain('Count degrees: 2 odd (E, G).');
    click(button('Next step'));
    expect(text()).toContain('Exactly two odd vertices, E, G');
    click(button('Last step'));
    expect(text()).toContain('Euler path E → ');
    expect(text()).toMatch(/→ G, using all 8 edges once/);
    click(buttonByText(m.resetGraph));
    expect(text()).toContain('every degree is even');
  });

  it('refuses a graph with four odd vertices', () => {
    render();
    radio('connect');
    click(vertex(0));
    click(vertex(3));
    click(vertex(1));
    click(vertex(6));
    click(button('Last step'));
    expect(text()).toContain('4 vertices have odd degree (A, B, D, G)');
    expect(text()).toContain('no Euler path exists');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Start at A');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '2');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '0');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
