// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet, flushSync, mount, tick, unmount } from 'svelte';
import SortPage from './sorting/bubble-insertion-sort/+page.svelte';
import BinaryPage from './searching/binary-search/+page.svelte';
import BfsPage from './graphs/bfs-grid/+page.svelte';
import DijkstraPage from './graphs/dijkstra-grid/+page.svelte';
import HubPage from './[topic]/+page.svelte';
import Layout from './+layout.svelte';
import { entries, load } from './[topic]/+page.js';
import { page } from '$app/state';
import { t } from '$lib/i18n/index.js';
import { lessonPath, lessons } from '$lib/lessons/registry.js';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {import('svelte').Component<any>} Page @param {Record<string, any>} [props] */
function render(Page, props = {}) {
  app = mount(Page, { target: document.body, props });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** Keyboard activation reports detail 0, which the BFS grid treats as an edit. */
/** @param {HTMLElement} el */
function keyActivate(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
  flushSync();
}

/** @param {HTMLElement} target @param {KeyboardEventInit} init */
function key(target, init) {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  flushSync();
}

const text = () => document.body.textContent ?? '';

describe('sorting lesson', () => {
  it('steps forward through the trace', () => {
    render(SortPage);
    expect(text()).toMatch(/Step 1 of \d+/);
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('42 > 17: out of order.');
  });

  it('switching algorithm reloads the pseudocode and trace', () => {
    render(SortPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="insertion"]')));
    expect(text()).toContain('key = a[i]; j = i - 1');
    expect(text()).toMatch(/Step 1 of \d+/);
  });

  it('shows both algorithms’ totals for the current array', () => {
    render(SortPage);
    expect(text()).toContain('Total cost on this array');
    expect(text()).toMatch(/Bubble sort\s*\d+ comparisons · \d+ swaps/);
    expect(text()).toMatch(/Insertion sort\s*\d+ comparisons · \d+ shifts/);
  });

  it('describes the values in the chart label', () => {
    render(SortPage);
    const chart = document.querySelector('[role="img"]');
    expect(chart?.getAttribute('aria-label')).toContain('Array: 42, 17, 88');
  });

  it('keeps arrow shortcuts working after a button was clicked', () => {
    render(SortPage);
    const next = button('Next step');
    click(next);
    key(next, { key: 'ArrowRight' });
    expect(text()).toMatch(/Step 3 of \d+/);
  });

  it('leaves modified arrows to the browser', () => {
    render(SortPage);
    click(button('Next step'));
    key(document.body, { key: 'ArrowLeft', altKey: true });
    expect(text()).toMatch(/Step 2 of \d+/);
  });

  it('keeps the step buttons focusable at the ends of the trace', () => {
    render(SortPage);
    const next = button('Next step');
    next.focus();
    click(button('Last step'));
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(next.disabled).toBe(false);
    expect(document.activeElement).toBe(next);
    click(next);
    expect(text()).toMatch(/Step (\d+) of \1/);
  });

  it('announces where playback stopped', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(SortPage);
    click(buttonByText('Play'));
    vi.advanceTimersByTime(500);
    flushSync();
    click(buttonByText('Pause'));
    // The status line is cleared first so a repeated message is announced again.
    await tick();
    flushSync();
    expect(document.querySelector('[role="status"]')?.textContent).toMatch(
      /^Paused at step 2 of \d+\.$/,
    );
  });

  it('lets Space scroll the page outside the player but toggles playback inside it', () => {
    render(SortPage);
    key(document.body, { key: ' ' });
    expect(buttonByText('Play')).toBeTruthy();
    const scope = /** @type {HTMLElement} */ (document.querySelector('[data-player-scope]'));
    key(scope, { key: ' ' });
    expect(buttonByText('Pause')).toBeTruthy();
    key(scope, { key: ' ' });
    expect(buttonByText('Play')).toBeTruthy();
  });

  it('stops autoplay when the lesson unmounts', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(SortPage);
    click(buttonByText('Play'));
    if (app) unmount(app);
    app = null;
    // A leaked player keeps rescheduling its tick; a stopped one schedules nothing.
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    vi.advanceTimersByTime(10_000);
    expect(schedule).not.toHaveBeenCalled();
  });
});

describe('binary search lesson', () => {
  it('watch mode reaches the target', () => {
    render(BinaryPage);
    click(button('Last step'));
    expect(text()).toContain('a[11] = 53. Found it after');
  });

  it('ignores a target the learner is still typing', () => {
    render(BinaryPage);
    click(button('Last step'));
    const input = /** @type {HTMLInputElement} */ (document.querySelector('input[type="number"]'));
    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    expect(text()).toContain('a[11] = 53. Found it after');
    expect(text()).not.toContain('< 5');
  });

  it('keeps the last target when the field is cleared', () => {
    render(BinaryPage);
    const input = /** @type {HTMLInputElement} */ (document.querySelector('input[type="number"]'));
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    expect(text()).toContain('Looking for 53');
    expect(text()).not.toContain('null');
  });

  it('you-drive mode rules out cells and detects a hit', () => {
    render(BinaryPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="drive"]')));
    click(button('Index 7, value 31'));
    expect(text()).toContain('31 < 53: everything left of here is ruled out.');
    const out = button('Index 3, value 14, ruled out');
    expect(out.getAttribute('aria-disabled')).toBe('true');
    expect(out.disabled).toBe(false);
    // Focus moves to the midpoint of the new window, indices 8–14.
    expect(document.activeElement).toBe(button('Index 11, value 53'));
    click(button('Index 11, value 53'));
    expect(text()).toMatch(/Found in 2 probes/);
    expect(button('Index 11, value 53, found')).toBeTruthy();
  });

  it('labels every cell ruled out once the watch is over, and names the hit', () => {
    render(BinaryPage);
    click(button('Last step'));
    expect(button('Index 11, value 53, found')).toBeTruthy();
    expect(button('Index 12, value 58, ruled out')).toBeTruthy();
  });
});

describe('bfs lesson', () => {
  it('finds the shortest path on the default grid', () => {
    render(BfsPage);
    click(button('Last step'));
    expect(text()).toMatch(/shortest path of \d+ steps/);
  });

  it('keyboard activation toggles a wall and rebuilds the trace', () => {
    render(BfsPage);
    keyActivate(button('Row 0, column 0'));
    expect(button('Row 0, column 0, Wall')).toBeTruthy();
    expect(text()).toMatch(/Step 1 of \d+/);
  });

  it('announces distances in cell labels', () => {
    render(BfsPage);
    click(button('Last step'));
    expect(button('Row 4, column 2, Start, distance 0')).toBeTruthy();
  });

  it('explains why a start move onto a wall is refused', () => {
    render(BfsPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="start"]')));
    keyActivate(button('Row 0, column 6, Wall'));
    expect(text()).toContain('Pick an open cell');
  });

  it('drops a refusal notice as soon as the learner steps on', () => {
    render(BfsPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="start"]')));
    keyActivate(button('Row 0, column 6, Wall'));
    expect(text()).toContain('Pick an open cell');
    click(button('Next step'));
    expect(text()).not.toContain('Pick an open cell');
    expect(text()).toContain('Dequeue (4,2)');
  });

  it('confirms keyboard edits in the narration', () => {
    render(BfsPage);
    keyActivate(button('Row 0, column 0'));
    expect(text()).toContain('Wall added at (0,0).');
    keyActivate(button('Row 0, column 0, Wall'));
    expect(text()).toContain('Wall removed at (0,0).');
    keyActivate(button('Row 4, column 2, Start, distance 0'));
    expect(text()).toContain('Pick an open cell');
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="goal"]')));
    expect(text()).not.toContain('Pick an open cell');
    keyActivate(button('Row 0, column 0'));
    expect(text()).toContain('Goal moved to (0,0).');
    expect(button('Row 0, column 0, Goal')).toBeTruthy();
  });

  it('moves focus with the arrow keys', () => {
    render(BfsPage);
    const startCell = button('Row 4, column 2, Start, distance 0');
    startCell.focus();
    key(startCell, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(button('Row 4, column 3'));
    expect(button('Row 4, column 3').tabIndex).toBe(0);
    expect(startCell.tabIndex).toBe(-1);
  });

  it('draws the grid transposed on narrow screens and keeps arrows on-screen', () => {
    const real = window.matchMedia;
    window.matchMedia = (q) => ({ ...real(q), matches: q.includes('max-width') });
    try {
      render(BfsPage);
      const grid = /** @type {HTMLElement} */ (document.querySelector('[role="grid"]'));
      expect(grid.style.gridTemplateColumns).toContain('repeat(10,');
      const startCell = button('Row 4, column 2, Start, distance 0');
      startCell.focus();
      key(startCell, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(button('Row 5, column 2'));
    } finally {
      window.matchMedia = real;
    }
  });

  it('reports no path when the goal is walled in', () => {
    render(BfsPage);
    // Goal sits at row 5, column 13; seal its four neighbors.
    for (const [r, c] of [
      [4, 13],
      [6, 13],
      [5, 12],
      [5, 14],
    ]) {
      keyActivate(button(`Row ${r}, column ${c}`));
    }
    click(button('Last step'));
    expect(text()).toContain('walls cut it off');
  });
});

describe('routing', () => {
  it('rejects prototype keys as topics', () => {
    const run = (/** @type {string} */ topic) => load(/** @type {any} */ ({ params: { topic } }));
    expect(() => run('constructor')).toThrow();
    expect(run('sorting')).toEqual({ topic: 'sorting' });
  });

  it('prerenders exactly the ordered topics, and every lesson belongs to one', async () => {
    const order = t().topicOrder;
    const generated = await entries();
    expect(generated.map((e) => e.topic)).toEqual(order);
    for (const lesson of lessons) expect(order).toContain(lesson.topic);
  });

  it('every registered lesson has a route', () => {
    const routeFiles = import.meta.glob('./**/+page.svelte');
    for (const lesson of lessons) {
      expect(Object.keys(routeFiles)).toContain(`.${lessonPath(lesson)}+page.svelte`);
    }
  });
});

describe('site chrome', () => {
  const children = createRawSnippet(() => ({ render: () => '<p>content</p>' }));
  /** @param {string} pathname */
  const currentTopics = (pathname) => {
    // The test stub holds a plain URL; SvelteKit's type narrows pathname to known routes.
    page.url = /** @type {any} */ (new URL(pathname, 'http://localhost/'));
    render(Layout, { children });
    return [...document.querySelectorAll('nav a')].map((a) => [
      a.textContent?.trim(),
      a.getAttribute('aria-current'),
    ]);
  };

  it('marks the topic hub as the current page and its lessons as inside it', () => {
    expect(currentTopics('/sorting/')).toEqual([
      ['Sorting', 'page'],
      ['Searching', null],
      ['Data structures', null],
      ['Graphs', null],
    ]);
  });

  it('does not call a lesson the current page', () => {
    expect(currentTopics('/sorting/bubble-insertion-sort/')[0]).toEqual(['Sorting', 'true']);
  });

  it('marks the current topic with more than colour', () => {
    currentTopics('/sorting/');
    const link = /** @type {HTMLElement} */ (document.querySelector('nav a[aria-current]'));
    expect(link.className).toContain('aria-[current]:font-semibold');
    expect(link.className).toContain('aria-[current]:underline');
  });

  describe('lesson navigation', () => {
    const nav = () => document.querySelector('nav[aria-label="Lesson navigation"]');
    const hrefs = () =>
      [...(nav()?.querySelectorAll('a') ?? [])].map((a) => a.getAttribute('href'));

    it('has no previous link on the first lesson and links to the second as next', () => {
      render(SortPage);
      const links = hrefs();
      expect(links).toHaveLength(1);
      expect(links[0]).toMatch(new RegExp(`${lessonPath(lessons[1])}$`));
      expect(nav()?.textContent).toContain(lessons[0].nextTeaser);
      expect(nav()?.textContent).not.toContain('Previous lesson');
    });

    it('links a middle lesson to its registry neighbors', () => {
      render(BinaryPage);
      const at = lessons.findIndex((l) => l.slug === 'binary-search');
      const links = hrefs();
      expect(links).toHaveLength(2);
      expect(links[0]).toMatch(new RegExp(`${lessonPath(lessons[at - 1])}$`));
      expect(links[1]).toMatch(new RegExp(`${lessonPath(lessons[at + 1])}$`));
    });

    it('ends the path on the last lesson with the teaser and a link home', () => {
      render(DijkstraPage);
      const last = lessons[lessons.length - 1];
      const links = hrefs();
      expect(links).toHaveLength(2);
      expect(links[0]).toMatch(new RegExp(`${lessonPath(lessons[lessons.length - 2])}$`));
      expect(links[1]).toMatch(/\/$/);
      expect(links[1]).not.toContain(last.slug);
      expect(nav()?.textContent).toContain(last.nextTeaser);
      expect(nav()?.textContent).toContain('All topics');
      expect(nav()?.textContent).not.toContain('Next lesson');
    });

    it('names the back link after the topic and leads the banner with "Try it:"', () => {
      render(BinaryPage);
      expect(text()).toContain('All lessons in Searching');
      expect(document.querySelector('header strong')?.textContent).toBe('Try it:');
    });

    it('glosses O(…) under the complexity heading', () => {
      render(BinaryPage);
      expect(text()).toContain('says how the number of steps grows');
    });
  });

  it('places the sticky controls last in the lesson grid, after the code panel', () => {
    render(BfsPage);
    const grid = /** @type {HTMLElement} */ (
      document.querySelector('.lg\\:grid-cols-\\[1fr_22rem\\]')
    );
    const last = /** @type {HTMLElement} */ (grid.lastElementChild);
    expect(last.className).toContain('sticky');
    expect(last.querySelector('[role="group"]')).not.toBeNull();
  });

  it('names each hub card link by the lesson title only', () => {
    render(HubPage, { data: { topic: 'sorting' } });
    const names = [...document.querySelectorAll('li a')].map((a) => a.textContent?.trim());
    expect(names).toEqual(lessons.filter((l) => l.topic === 'sorting').map((l) => l.title));
  });
});
