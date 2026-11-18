// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet, flushSync, mount, tick, unmount } from 'svelte';
import SortPage from './sorting/bubble-insertion-sort/+page.svelte';
import BinaryPage from './searching/binary-search/+page.svelte';
import BfsPage from './graphs/bfs-grid/+page.svelte';
import HubPage from './[topic]/+page.svelte';
import HomePage from './+page.svelte';
import Layout from './+layout.svelte';
import { entries, load } from './[topic]/+page.server.js';
import { load as homeLoad } from './+page.server.js';
import { page } from '$app/state';
import { t } from '$lib/i18n/index.js';
import { lessonNeighbors, lessonPath, lessons } from '$lib/lessons/registry.js';
import { findLesson, lessonOrder, levels } from '$lib/curriculum/index.js';

// Lesson pages load on demand, so the path tests can render whichever lessons are first and last.
const lessonPages =
  /** @type {Record<string, () => Promise<{ default: import('svelte').Component<any> }>>} */ (
    import.meta.glob('./*/*/+page.svelte')
  );

/** @param {{ topic: string, slug: string }} lesson */
async function pageOf(lesson) {
  return (await lessonPages[`.${lessonPath(lesson)}+page.svelte`]()).default;
}

/** @param {string} topic */
const hubData = (topic) => load(/** @type {any} */ ({ params: { topic } }));

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
    expect(text()).toMatch(/Bước 1\/\d+/);
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain('42 > 17: sai thứ tự.');
  });

  it('switching algorithm reloads the pseudocode and trace', () => {
    render(SortPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="insertion"]')));
    expect(text()).toContain('key = a[i]; j = i - 1');
    expect(text()).toMatch(/Bước 1\/\d+/);
  });

  it('shows both algorithms’ totals for the current array', () => {
    render(SortPage);
    expect(text()).toContain('Tổng chi phí trên mảng này');
    expect(text()).toMatch(/Sắp xếp nổi bọt\s*\d+ lần so sánh · \d+ lần đổi chỗ/);
    expect(text()).toMatch(/Sắp xếp chèn\s*\d+ lần so sánh · \d+ lần dời/);
  });

  it('describes the values in the chart label', () => {
    render(SortPage);
    const chart = document.querySelector('[role="img"]');
    expect(chart?.getAttribute('aria-label')).toContain('Mảng: 42, 17, 88');
  });

  it('keeps arrow shortcuts working after a button was clicked', () => {
    render(SortPage);
    const next = button('Bước tiếp');
    click(next);
    key(next, { key: 'ArrowRight' });
    expect(text()).toMatch(/Bước 3\/\d+/);
  });

  it('leaves modified arrows to the browser', () => {
    render(SortPage);
    click(button('Bước tiếp'));
    key(document.body, { key: 'ArrowLeft', altKey: true });
    expect(text()).toMatch(/Bước 2\/\d+/);
  });

  it('keeps the step buttons focusable at the ends of the trace', () => {
    render(SortPage);
    const next = button('Bước tiếp');
    next.focus();
    click(button('Đến bước cuối'));
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(next.disabled).toBe(false);
    expect(document.activeElement).toBe(next);
    click(next);
    expect(text()).toMatch(/Bước (\d+)\/\1/);
  });

  it('announces where playback stopped', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(SortPage);
    click(buttonByText('Phát'));
    vi.advanceTimersByTime(500);
    flushSync();
    click(buttonByText('Tạm dừng'));
    // The status line is cleared first so a repeated message is announced again.
    await tick();
    flushSync();
    expect(document.querySelector('[role="status"]')?.textContent).toMatch(
      /^Đã dừng ở bước 2\/\d+\.$/,
    );
  });

  it('lets Space scroll the page outside the player but toggles playback inside it', () => {
    render(SortPage);
    key(document.body, { key: ' ' });
    expect(buttonByText('Phát')).toBeTruthy();
    const scope = /** @type {HTMLElement} */ (document.querySelector('[data-player-scope]'));
    key(scope, { key: ' ' });
    expect(buttonByText('Tạm dừng')).toBeTruthy();
    key(scope, { key: ' ' });
    expect(buttonByText('Phát')).toBeTruthy();
  });

  it('stops autoplay when the lesson unmounts', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(SortPage);
    click(buttonByText('Phát'));
    if (app) unmount(app);
    app = null;
    // A leaked player keeps rescheduling its tick; a stopped one schedules nothing.
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    vi.advanceTimersByTime(10_000);
    expect(schedule).not.toHaveBeenCalled();
  });
});

describe('lesson layout at phone width', () => {
  it('lets the takeaways and complexity boxes shrink and the cost column wrap', () => {
    render(BinaryPage);
    const sections = [...document.querySelectorAll('article > div.grid > section')];
    expect(sections).toHaveLength(2);
    for (const s of sections) expect(s.classList.contains('min-w-0')).toBe(true);
    const cost = document.querySelector('tbody td:nth-child(2)');
    expect(cost?.className).not.toContain('whitespace-nowrap');
    expect(cost?.className).toContain('[overflow-wrap:anywhere]');
  });
});

describe('binary search lesson', () => {
  it('watch mode reaches the target', () => {
    render(BinaryPage);
    click(button('Đến bước cuối'));
    expect(text()).toContain('a[11] = 53. Tìm thấy sau');
  });

  it('ignores a target the learner is still typing', () => {
    render(BinaryPage);
    click(button('Đến bước cuối'));
    const input = /** @type {HTMLInputElement} */ (document.querySelector('input[type="number"]'));
    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    expect(text()).toContain('a[11] = 53. Tìm thấy sau');
    expect(text()).not.toContain('< 5');
  });

  it('keeps the last target when the field is cleared', () => {
    render(BinaryPage);
    const input = /** @type {HTMLInputElement} */ (document.querySelector('input[type="number"]'));
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    expect(text()).toContain('Ta tìm 53');
    expect(text()).not.toContain('null');
  });

  it('you-drive mode rules out cells and detects a hit', () => {
    render(BinaryPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="drive"]')));
    click(button('Chỉ số 7, giá trị 31'));
    expect(text()).toContain('31 < 53: mọi ô bên trái chỗ này đều bị loại.');
    const out = button('Chỉ số 3, giá trị 14, đã loại');
    expect(out.getAttribute('aria-disabled')).toBe('true');
    expect(out.disabled).toBe(false);
    // Focus moves to the midpoint of the new window, indices 8–14.
    expect(document.activeElement).toBe(button('Chỉ số 11, giá trị 53'));
    click(button('Chỉ số 11, giá trị 53'));
    expect(text()).toMatch(/Tìm thấy sau 2 lần đọc/);
    expect(button('Chỉ số 11, giá trị 53, đã tìm thấy')).toBeTruthy();
  });

  it('labels every cell ruled out once the watch is over, and names the hit', () => {
    render(BinaryPage);
    click(button('Đến bước cuối'));
    expect(button('Chỉ số 11, giá trị 53, đã tìm thấy')).toBeTruthy();
    expect(button('Chỉ số 12, giá trị 58, đã loại')).toBeTruthy();
  });
});

describe('bfs lesson', () => {
  it('finds the shortest path on the default grid', () => {
    render(BfsPage);
    click(button('Đến bước cuối'));
    expect(text()).toMatch(/đường đi ngắn nhất dài \d+ bước/);
  });

  it('keyboard activation toggles a wall and rebuilds the trace', () => {
    render(BfsPage);
    keyActivate(button('Hàng 0, cột 0'));
    expect(button('Hàng 0, cột 0, Tường')).toBeTruthy();
    expect(text()).toMatch(/Bước 1\/\d+/);
  });

  it('announces distances in cell labels', () => {
    render(BfsPage);
    click(button('Đến bước cuối'));
    expect(button('Hàng 4, cột 2, Điểm xuất phát, khoảng cách 0')).toBeTruthy();
  });

  it('explains why a start move onto a wall is refused', () => {
    render(BfsPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="start"]')));
    keyActivate(button('Hàng 0, cột 6, Tường'));
    expect(text()).toContain('Hãy chọn một ô trống');
  });

  it('drops a refusal notice as soon as the learner steps on', () => {
    render(BfsPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="start"]')));
    keyActivate(button('Hàng 0, cột 6, Tường'));
    expect(text()).toContain('Hãy chọn một ô trống');
    click(button('Bước tiếp'));
    expect(text()).not.toContain('Hãy chọn một ô trống');
    expect(text()).toContain('Lấy (4,2) ra khỏi đầu hàng');
  });

  it('confirms keyboard edits in the narration', () => {
    render(BfsPage);
    keyActivate(button('Hàng 0, cột 0'));
    expect(text()).toContain('Đã thêm tường ở (0,0).');
    keyActivate(button('Hàng 0, cột 0, Tường'));
    expect(text()).toContain('Đã bỏ tường ở (0,0).');
    keyActivate(button('Hàng 4, cột 2, Điểm xuất phát, khoảng cách 0'));
    expect(text()).toContain('Hãy chọn một ô trống');
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="goal"]')));
    expect(text()).not.toContain('Hãy chọn một ô trống');
    keyActivate(button('Hàng 0, cột 0'));
    expect(text()).toContain('Đã dời đích đến (0,0).');
    expect(button('Hàng 0, cột 0, Đích')).toBeTruthy();
  });

  it('moves focus with the arrow keys', () => {
    render(BfsPage);
    const startCell = button('Hàng 4, cột 2, Điểm xuất phát, khoảng cách 0');
    startCell.focus();
    key(startCell, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(button('Hàng 4, cột 3'));
    expect(button('Hàng 4, cột 3').tabIndex).toBe(0);
    expect(startCell.tabIndex).toBe(-1);
  });

  it('draws the grid transposed on narrow screens and keeps arrows on-screen', () => {
    const real = window.matchMedia;
    window.matchMedia = (q) => ({ ...real(q), matches: q.includes('max-width') });
    try {
      render(BfsPage);
      const grid = /** @type {HTMLElement} */ (document.querySelector('[role="grid"]'));
      expect(grid.style.gridTemplateColumns).toContain('repeat(10,');
      const startCell = button('Hàng 4, cột 2, Điểm xuất phát, khoảng cách 0');
      startCell.focus();
      key(startCell, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(button('Hàng 5, cột 2'));
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
      keyActivate(button(`Hàng ${r}, cột ${c}`));
    }
    click(button('Đến bước cuối'));
    expect(text()).toContain('tường đã chặn kín đường');
  });
});

describe('routing', () => {
  it('rejects prototype keys as topics', () => {
    const run = (/** @type {string} */ topic) => load(/** @type {any} */ ({ params: { topic } }));
    expect(() => run('constructor')).toThrow();
    expect(run('sorting')).toMatchObject({ topic: 'sorting' });
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

  it('every lesson route is a curriculum lesson under its own topic, with registered copy', () => {
    const routes = Object.keys(lessonPages).filter((file) => !file.startsWith('./['));
    for (const file of routes) {
      const [, topic, slug] = file.split('/');
      expect(findLesson(slug)?.chapter.slug, file).toBe(topic);
      expect(
        lessons.some((l) => l.slug === slug),
        file,
      ).toBe(true);
    }
    expect(routes).toHaveLength(lessons.length);
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

  it('links each level to its home section and marks the level of the open topic', () => {
    expect(currentTopics('/sorting/')).toEqual([
      ['Phần 1: Nền tảng', 'true'],
      ['Phần 2: Thuật toán cốt lõi', null],
      ['Phần 3: Chủ đề nâng cao', null],
      ['Thuật ngữ', null],
    ]);
    const hrefs = [...document.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/#level-1', '/#level-2', '/#level-3', '/thuat-ngu/']);
  });

  it('marks the glossary link while the glossary is open', () => {
    expect(currentTopics('/thuat-ngu/').at(-1)).toEqual(['Thuật ngữ', 'page']);
  });

  it('marks the level of an open lesson and nothing on the home page', () => {
    expect(currentTopics('/shortest-paths/dijkstra-grid/')[1]).toEqual([
      'Phần 2: Thuật toán cốt lõi',
      'true',
    ]);
    unmount(/** @type {Record<string, any>} */ (app));
    app = null;
    expect(currentTopics('/').every(([, current]) => current === null)).toBe(true);
  });

  it('marks the current level with more than colour', () => {
    currentTopics('/sorting/bubble-insertion-sort/');
    const link = /** @type {HTMLElement} */ (document.querySelector('nav a[aria-current]'));
    expect(link.className).toContain('aria-[current]:font-semibold');
    expect(link.className).toContain('aria-[current]:underline');
  });

  describe('lesson navigation', () => {
    const nav = () => document.querySelector('nav[aria-label="Điều hướng bài học"]');
    const hrefs = () =>
      [...(nav()?.querySelectorAll('a') ?? [])].map((a) => a.getAttribute('href'));

    it('links the next lesson in curriculum order, stub or not, as the teaser does', async () => {
      const first = lessons[0];
      render(await pageOf(first));
      const links = hrefs();
      const { prev, next } = lessonNeighbors(first.slug);
      expect(links).toHaveLength((prev ? 1 : 0) + (next ? 1 : 0));
      if (next) expect(links.at(-1)).toMatch(new RegExp(`${next.path}$`));
      expect(nav()?.textContent).toContain(first.nextTeaser);
    });

    it('links a middle lesson to its curriculum neighbors', () => {
      render(BinaryPage);
      const at = lessonOrder.indexOf('binary-search');
      const links = hrefs();
      expect(links).toHaveLength(2);
      expect(links[0]).toMatch(new RegExp(`/${lessonOrder[at - 1]}/$`));
      expect(links[1]).toMatch(new RegExp(`/${lessonOrder[at + 1]}/$`));
    });

    it('sends the last written lesson on to the next curriculum lesson, even a stub', async () => {
      const last = lessons[lessons.length - 1];
      render(await pageOf(last));
      const links = hrefs();
      const { next } = lessonNeighbors(last.slug);
      expect(nav()?.textContent).toContain(last.nextTeaser);
      if (next) {
        expect(links.at(-1)).toMatch(new RegExp(`${next.path}$`));
        expect(nav()?.textContent).toContain('Bài sau');
      } else {
        expect(links.at(-1)).toMatch(/\/$/);
        expect(nav()?.textContent).toContain('Tất cả chủ đề');
      }
    });

    it('names the back link after the topic and leads the banner with "Thử xem:"', () => {
      render(BinaryPage);
      expect(text()).toContain('Các bài trong Tìm kiếm');
      expect(document.querySelector('header strong')?.textContent).toBe('Thử xem:');
    });

    it('glosses O(…) under the complexity heading', () => {
      render(BinaryPage);
      expect(text()).toContain('cho biết số bước tăng thế nào');
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
    render(HubPage, { data: hubData('sorting') });
    const names = [...document.querySelectorAll('li a')].map((a) => a.textContent?.trim());
    const plan = levels[0].chapters.find((c) => c.slug === 'sorting')?.lessons ?? [];
    expect(names).toEqual(
      plan.map((p) => lessons.find((l) => l.slug === p.slug)?.title ?? p.title),
    );
  });

  it('lists every planned lesson of a topic in book order and marks the unwritten ones', () => {
    render(HubPage, { data: hubData('trees') });
    const cards = [...document.querySelectorAll('section > ul > li')].map((li) => ({
      title: li.querySelector('h2')?.textContent?.trim(),
      href: li.querySelector('a')?.getAttribute('href'),
      soon: li.textContent?.includes('Sắp ra mắt') ?? false,
    }));
    const plan = levels[0].chapters.find((c) => c.slug === 'trees')?.lessons ?? [];
    expect(cards.map((c) => c.title)).toEqual(plan.map((l) => l.title));
    // Every card links to its page; unwritten lessons open their stub page.
    expect(cards.map((c) => c.href)).toEqual(plan.map((l) => `/trees/${l.slug}/`));
    const written = plan.filter((p) => lessons.some((l) => l.slug === p.slug));
    expect(cards.filter((c) => !c.soon).map((c) => c.title)).toEqual(
      written.map((p) => lessons.find((l) => l.slug === p.slug)?.title),
    );
    expect(cards.filter((c) => !c.soon).map((c) => c.title)).toContain('Cây nhị phân tìm kiếm');
  });
});

describe('home page', () => {
  it('groups every topic under its level, in curriculum order', () => {
    render(HomePage, { data: homeLoad(/** @type {any} */ ({})) });
    const sections = [...document.querySelectorAll('section[id^="level-"]')];
    expect(sections.map((el) => el.id)).toEqual(['level-1', 'level-2', 'level-3']);
    sections.forEach((el, i) => {
      const titles = [...el.querySelectorAll('h4')].map((h) => h.textContent?.trim());
      expect(titles).toEqual(levels[i].chapters.map((c) => c.title));
      expect(el.querySelector('h3')?.textContent).toContain(levels[i].title);
    });
  });

  it('counts written against planned lessons and links the written ones', () => {
    render(HomePage, { data: homeLoad(/** @type {any} */ ({})) });
    const sorting = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('li')].find(
        (li) => li.querySelector('h4')?.textContent?.trim() === 'Sắp xếp',
      )
    );
    const written = lessons.filter((l) => l.topic === 'sorting');
    const planned = levels[0].chapters.find((c) => c.slug === 'sorting')?.lessons.length;
    expect(sorting.textContent).toContain(`${written.length}/${planned} bài đã sẵn sàng`);
    const links = [...sorting.querySelectorAll(':scope ul a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(written.map(lessonPath));
    expect(links).toContain('/sorting/bubble-insertion-sort/');
  });

  it('starts the path at the first written lesson', () => {
    render(HomePage, { data: homeLoad(/** @type {any} */ ({})) });
    const cta = /** @type {HTMLAnchorElement} */ (document.querySelector('a.btn-primary'));
    expect(cta.getAttribute('href')).toBe(lessonPath(lessons[0]));
    expect(cta.textContent).toContain(
      `Bắt đầu với ${t().topics[lessons[0].topic].title.toLowerCase()}`,
    );
  });
});
