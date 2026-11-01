// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-greedy/copy.en.js';

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
  vi.restoreAllMocks();
});

/** Deterministic LCG so the random tests are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const report = () => document.querySelector('[data-testid="report"]')?.textContent?.trim() ?? '';

/** @param {string} p */
function card(p) {
  click(/** @type {HTMLElement} */ (document.querySelector(`[data-card="${p}"]`)));
}

/** @param {string} value */
function pickRule(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('greedy practice lesson', () => {
  it('starts on the jump game with the longest-jump rule', () => {
    render();
    expect(narration()).toContain('Start at cell 0 and always take the longest jump');
    expect(stat('Right answer')).toBe('yes');
    expect(stat('Rule’s answer')).toBe('…');
    expect(report()).toContain('Not tested yet.');
  });

  it('steps the wrong rule onto a zero and reports the counterexample', () => {
    render();
    click(button('Next step'));
    expect(narration()).toContain('Jump 2 from cell 0 to cell 2. 1 jump so far.');
    click(button('Next step'));
    expect(narration()).toContain('Cell 2 holds 0: the rule is stuck there.');
    click(button('Last step'));
    expect(narration()).toContain(
      'The rule answers no, but the right answer is yes: a counterexample',
    );
    expect(stat('Rule’s answer')).toBe('no');
    const titles = [...document.querySelectorAll('svg title')].map((t) => t.textContent);
    expect(titles).toContain('Cell 2: 0, Stuck here');
  });

  it('switches to the farthest-reach rule, which is right here', () => {
    render();
    pickRule('right');
    expect(narration()).toContain('Rule: Track the farthest reach.');
    expect(text()).toContain('reach = max(reach, i + a[i])');
    click(button('Next step'));
    expect(narration()).toContain(
      'Cell 0 is reachable (0 ≤ reach). From it you can get to 2, so reach = 2.',
    );
    click(button('Last step'));
    expect(narration()).toContain('The rule answers yes, which is right on this input.');
    expect(stat('Farthest reach')).toBe('8');
  });

  it('breaks the wrong rule on random cases and loads the counterexample', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(4));
    render();
    click(buttonByText('Test on 200 random cases'));
    expect(report()).toMatch(/Failed \d+ of 200 random cases\./);
    expect(report()).toContain('Shortest counterexample:');
    click(buttonByText('Load the counterexample'));
    expect(narration()).toContain('Counterexample loaded');
    click(button('Last step'));
    expect(narration()).toContain('a counterexample, so this rule is wrong');
  });

  it('passes the right rule on every random case', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(9));
    render();
    pickRule('right');
    click(buttonByText('Test on 200 random cases'));
    expect(report()).toContain('Passed all 200 random cases.');
  });

  it('counts jumps by layers on the fewest-jumps card', () => {
    render();
    card('jumps');
    expect(/** @type {HTMLInputElement} */ (field('values')).value).toBe('2, 3, 1, 1, 4');
    click(button('Last step'));
    expect(narration()).toContain('The rule answers 3 jumps, but the right answer is 2 jumps');
    pickRule('right');
    expect(text()).toContain('if i = end:');
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toContain(
      'Cell 0 is the end of the range covered by 0 jumps, so take jump 1: it can land anywhere up to cell 2.',
    );
    click(button('Last step'));
    expect(narration()).toContain('The rule answers 2 jumps, which is right');
  });

  it('fills boats with the two lightest and with heaviest plus lightest', () => {
    render();
    card('boats');
    click(button('Next step'));
    expect(narration()).toContain('Sort the weights: 1, 2, 8, 9.');
    click(button('Next step'));
    expect(narration()).toContain('Boat 1: the two lightest, 1 and 2, share it.');
    click(button('Last step'));
    expect(narration()).toContain('The rule answers 3 boats, but the right answer is 2 boats');
    expect(text()).toContain('1 + 2');
    pickRule('right');
    click(button('Last step'));
    expect(narration()).toContain('The rule answers 2 boats, which is right');
    expect(text()).toContain('9 + 1');
    expect(document.querySelector('[aria-label^="Cells:"]')?.textContent).toContain('b2');
  });

  it('refuses bad input and keeps the last valid one', () => {
    render();
    commit(field('values'), '2, 12');
    expect(narration()).toContain('Keep every jump length between 0 and 9.');
    expect(/** @type {HTMLInputElement} */ (field('values')).value).toBe('2, 3, 0, 1, 4');
    card('boats');
    commit(field('values'), '0 3');
    expect(narration()).toContain('Keep every weight between 1 and 9.');
    commit(field('values'), '5 5 5');
    click(button('Last step'));
    expect(stat('Right answer')).toBe('2 boats');
  });

  it('commits typed input on Enter and loads a random one', () => {
    render();
    const input = /** @type {HTMLInputElement} */ (field('values'));
    input.value = '1 1 1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    click(button('Last step'));
    expect(narration()).toContain('The rule answers yes, which is right');
    click(buttonByText('Random input'));
    expect(text()).toContain('New input loaded.');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
