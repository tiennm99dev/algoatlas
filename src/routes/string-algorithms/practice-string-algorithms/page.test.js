// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  MAX_PATTERN,
  MAX_TEXT,
  STRING_PRESETS,
  searchTrace,
  structureTrace,
} from '$lib/algo-engine/practice-string-algorithms.js';
import { en as m } from '$lib/lessons/practice-string-algorithms/copy.en.js';
import Page from './+page.svelte';

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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));

function structureMode() {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector('input[name="mode"][value="structure"]')
  );
  radio.checked = true;
  radio.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

describe('practice: string problems lesson', () => {
  it('opens on the totals of the race, with the winner named', () => {
    render();
    expect(presetSelect().value).toBe('english');
    expect(stat('boyer-steps')).toBe('15');
    expect(stat('naive-steps')).toBe('35');
    expect(stat('rabin-steps')).toBe('107');
    expect(stat('kmp-matches')).toBe('1');
    expect(stat('spurious')).toBe('1');
    expect(narration()).toBe('Cheapest: Boyer-Moore with 15 steps. Every matcher found 1 match.');
    expect(document.querySelector('[data-testid="boyer-row"]')?.textContent).toContain(
      m.cheapestWord,
    );
  });

  it('rewinds and spends one step of every matcher per tick', () => {
    render();
    click(button('First step'));
    expect(narration()).toContain('All five matchers start on 35 letters');
    expect(stat('boyer-steps')).toBe('0');
    click(button('Next step'));
    for (const id of ['naive', 'rabin', 'kmp', 'boyer', 'z']) {
      expect(stat(`${id}-steps`)).toBe('1');
    }
    expect(narration()).toBe('Skip table: the rightmost l seen so far is at 0.');
  });

  it('watches the matcher whose row is pressed, without moving the race', () => {
    render();
    click(button('First step'));
    click(button('Next step'));
    click(button(m.watchLabel('Plain scan')));
    expect(button(m.watchLabel('Plain scan')).getAttribute('aria-pressed')).toBe('true');
    expect(button(m.watchLabel('Boyer-Moore')).getAttribute('aria-pressed')).toBe('false');
    expect(narration()).toBe('P[0] = l against T[0] = t: different.');
    expect(stat('naive-steps')).toBe('1');
    click(button(m.watchLabel('Rabin-Karp')));
    expect(narration()).toBe('P[0] = l goes into the pattern’s hash, now 12.');
    click(button(m.watchLabel('KMP')));
    expect(narration()).toBe('Preparing: P[0] = l against position 1, a: different.');
  });

  it('narrates a finished matcher while the others still run', () => {
    render();
    click(button('First step'));
    for (let i = 0; i < 16; i++) click(button('Next step'));
    expect(narration()).toContain('Boyer-Moore finished after 15 steps.');
    expect(document.querySelector('[data-testid="boyer-row"]')?.textContent).toContain(
      m.finishedWord,
    );
    expect(stat('naive-steps')).toBe('16');
  });

  it('narrates a spurious hit and its true match when watching Rabin-Karp', () => {
    render();
    click(button(m.watchLabel('Rabin-Karp')));
    click(button('First step'));
    const seen = [];
    for (let i = 0; i < 110; i++) {
      seen.push(narration());
      click(button('Next step'));
    }
    expect(seen.some((s) => s.includes('a spurious hit, the hashes collided'))).toBe(true);
    expect(seen.some((s) => s.includes('a true match at 28'))).toBe(true);
    expect(seen.some((s) => s.includes('leaves the window'))).toBe(true);
    expect(seen.some((s) => s.includes('enters: the window at'))).toBe(true);
  });

  it('rebuilds on a preset and on typed text and pattern', () => {
    render();
    commit(presetSelect(), 'head');
    expect(stat('naive-steps')).toBe('37');
    expect(stat('boyer-steps')).toBe('152');
    expect(narration()).toContain('Cheapest: Plain scan with 37 steps');
    commit(field('text'), 'ABAB');
    expect(field('text').value).toBe('abab');
    expect(presetSelect().value).toBe('');
    commit(field('pattern'), 'ab');
    expect(field('pattern').value).toBe('ab');
    expect(stat('kmp-matches')).toBe('2');
    click(button(m.watchLabel('KMP')));
    expect(stat('found')).toBe('2');
    expect(document.body.textContent).toContain(m.matchesTitle);
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_TEXT, MAX_PATTERN);
    commit(field('text'), 'a b');
    expect(narration()).toBe(errors.format);
    expect(field('text').value).toBe(STRING_PRESETS.english.text);
    commit(field('text'), 'a'.repeat(MAX_TEXT + 1));
    expect(narration()).toBe(errors.textLength);
    commit(field('pattern'), 'a'.repeat(MAX_PATTERN + 1));
    expect(narration()).toBe(errors.patternLength);
    commit(field('pattern'), '');
    expect(narration()).toBe(errors.empty);
    expect(field('pattern').value).toBe('lazy');
    commit(field('text'), 'abc');
    expect(narration()).toBe(errors.patternTooLong);
    expect(field('text').value).toBe(STRING_PRESETS.english.text);
    commit(presetSelect(), 'palindrome');
    commit(field('pattern'), 'abcdefgh');
    commit(field('text'), 'abcdefgh');
    commit(field('pattern'), 'abcdefgh');
    expect(field('pattern').value).toBe('abcdefgh');
    commit(field('text'), 'abc');
    expect(narration()).toBe(errors.patternTooLong);
  });

  it('commits a field on Enter through its change handler', () => {
    render();
    const input = field('text');
    input.value = 'abcabc';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    expect(narration()).toContain('Cheapest');
    expect(stat('kmp-matches')).toBe('0');
  });

  it('switches to periods and palindromes and hides the pattern field', () => {
    render();
    commit(presetSelect(), 'palindrome');
    structureMode();
    expect(document.querySelector('input[name="pattern"]')).toBeNull();
    expect(stat('period')).toBe('13');
    expect(stat('repeats')).toBe('1');
    expect(stat('longest')).toBe('10');
    expect(stat('palindromes')).toBe('23');
    expect(stat('best-text')).toBe('geeksskeeg');
    expect(narration()).toContain('Longest palindrome: “geeksskeeg”, length 10');
    click(button('First step'));
    expect(narration()).toContain('Read forgeeksskeegfor twice');
    expect(stat('period')).toBe(m.noValue);
    click(button('Next step'));
    expect(narration()).toBe('π[1] = 0: the longest border of S[0..1] is empty.');
  });

  it('steps through a period and a palindrome centre', () => {
    render();
    structureMode();
    commit(field('text'), 'ababab');
    click(button('First step'));
    const seen = [];
    for (let i = 0; i < structureTrace('ababab').length; i++) {
      seen.push(narration());
      click(button('Next step'));
    }
    expect(seen).toContain('π[5] = 4: the longest border of S[0..5] is “abab”.');
    expect(seen).toContain(
      'π[5] = 4, so the smallest period is 6 − 4 = 2. It divides 6, so S is “ab” repeated 3 times.',
    );
    expect(seen.some((s) => s.startsWith('Centre on letter 2:'))).toBe(true);
    expect(seen.some((s) => s.startsWith('Centre on the gap before letter 2:'))).toBe(true);
    expect(stat('repeats')).toBe('3');
    expect(stat('period')).toBe('2');
  });

  it('accepts a text shorter than the hidden pattern and shortens the pattern to fit', () => {
    render();
    commit(presetSelect(), 'periodic');
    structureMode();
    commit(field('text'), 'aaaa');
    expect(field('text').value).toBe('aaaa');
    expect(stat('palindromes')).toBe('10');
    const radio = /** @type {HTMLInputElement} */ (
      document.querySelector('input[name="mode"][value="search"]')
    );
    click(radio);
    expect(field('pattern').value).toBe('abca');
    expect(stat('kmp-matches')).toBe('0');
    expect(narration()).toContain('Cheapest');
  });

  it('names the last centre as the end of the text, not a letter past it', () => {
    render();
    structureMode();
    commit(field('text'), 'aba');
    click(button('First step'));
    const seen = [];
    for (let i = 0; i < structureTrace('aba').length; i++) {
      seen.push(narration());
      click(button('Next step'));
    }
    expect(seen).toContain('Centre on the end: 0 comparisons, and no palindrome.');
    expect(seen.some((s) => s.includes('gap before letter 3'))).toBe(false);
  });

  it('reports a Z-function match on the comparison that completes it', () => {
    render();
    commit(presetSelect(), 'periodic');
    click(button('Watch Z-function'));
    click(button('First step'));
    const seen = [];
    for (let i = 0; i < 80; i++) {
      click(button('Next step'));
      seen.push(narration());
    }
    expect(seen).toContain(
      'The $ after P stops the run against T[6]. All 6 letters agreed, so P occurs at 0.',
    );
  });

  it('keeps each mode on its own step when switching back', () => {
    render();
    click(button('First step'));
    click(button('Next step'));
    structureMode();
    expect(narration()).toContain('Longest palindrome');
    const radio = /** @type {HTMLInputElement} */ (
      document.querySelector('input[name="mode"][value="search"]')
    );
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    expect(stat('boyer-steps')).toBe('1');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '35';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toMatch(/not|try/i);
    const hint = [...q.querySelectorAll('button')].find((b) => /hint/i.test(b.textContent ?? ''));
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain('Boyer-Moore’s row');
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toMatch(/correct/i);
  });

  it('stores practice answers that the widget actually shows', () => {
    const race = (/** @type {keyof typeof STRING_PRESETS} */ key) =>
      /** @type {import('$lib/algo-engine/practice-string-algorithms.js').SearchFrame} */ (
        searchTrace(STRING_PRESETS[key].text, STRING_PRESETS[key].pattern).at(-1)
      );
    const reading = (/** @type {string} */ text) =>
      /** @type {import('$lib/algo-engine/practice-string-algorithms.js').StructureFrame} */ (
        structureTrace(text).at(-1)
      );
    const stored = /** @type {any[]} */ (m.practice);

    expect(stored[0].answer).toBe(race('english').runs.boyer.steps);
    expect(stored[1].answer).toBe(race('english').runs.rabin.hits);
    expect(race('tail').cheapest).toEqual(['boyer']);
    expect(race('tail').runs.boyer.steps).toBe(41);
    expect(race('tail').runs.naive.steps).toBe(148);
    expect(race('tail').runs.kmp.steps).toBe(82);
    expect(race('head').finishers.at(-1)).toBe('boyer');
    expect(race('head').runs.boyer.steps).toBe(152);
    expect(race('head').runs.naive.steps).toBe(37);
    const all = race('repeats').runs;
    expect([all.naive, all.rabin, all.kmp, all.boyer, all.z].map((r) => r.steps > 100)).toEqual(
      stored[4].options.map((/** @type {string} */ _, /** @type {number} */ i) =>
        stored[4].answers.includes(i),
      ),
    );
    expect(race('periodic').cheapest).toEqual(['kmp']);
    expect(race('periodic').runs.kmp.steps).toBe(41);
    expect(reading('abaabaabaab').period).toBe(stored[6].answer);
    expect(reading('abaabaabaab').repeats).toBe(1);
    expect(reading(STRING_PRESETS.palindrome.text).best).toBe(stored[7].answer);
    expect(reading(STRING_PRESETS.repeats.text).tryCentres).toBe(stored[8].answer);
    expect(reading(STRING_PRESETS.repeats.text).palComparisons).toBe(79);
    expect(reading('aaaa').palindromes).toBe(stored[9].answer);
  });

  it('keeps every practice problem well formed', () => {
    expect(m.practice.flatMap((q) => exerciseProblems(q))).toEqual([]);
    expect(m.practice.length).toBeGreaterThanOrEqual(5);
  });
});
