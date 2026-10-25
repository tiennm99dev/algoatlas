// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import StubPage from './+page.svelte';
import { entries, load } from './+page.server.js';
import { chapters, findLesson, lessonOrder } from '$lib/curriculum/index.js';
import { legacyRedirects } from '$lib/curriculum/legacy-redirects.js';
import { lessonRouteFile, stubReport } from '$lib/curriculum/stubs.js';
import { levels } from '$lib/curriculum/index.js';
import { lessonPath, lessons } from '$lib/lessons/registry.js';
import { hasStaticRoute } from '$lib/lessons/static-routes.js';

/** @type {Record<string, any> | null} */
let app = null;

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

/** @param {string} topic @param {string} slug */
function run(topic, slug) {
  return /** @type {any} */ (load(/** @type {any} */ ({ params: { topic, slug } })));
}

/** @param {Record<string, any>} data */
function render(data) {
  app = mount(StubPage, { target: document.body, props: /** @type {any} */ ({ data }) });
  flushSync();
}

const pathOf = (/** @type {{ topic: string, slug: string }} */ e) => `/${e.topic}/${e.slug}/`;

describe('stub route entries', () => {
  const generated = /** @type {{ topic: string, slug: string }[]} */ (entries());

  it('skips every lesson that has its own route', () => {
    for (const lesson of lessons) {
      expect(hasStaticRoute(lesson.topic, lesson.slug)).toBe(true);
      expect(generated.map(pathOf)).not.toContain(lessonPath(lesson));
    }
  });

  it('covers every other curriculum lesson once, plus the old paths of moved lessons', () => {
    const unwritten = chapters.flatMap((c) =>
      c.lessons
        .filter((l) => !hasStaticRoute(c.slug, l.slug))
        .map((l) => lessonPath({ topic: c.slug, slug: l.slug })),
    );
    const moved = legacyRedirects.map(pathOf);
    expect(generated.map(pathOf)).toEqual([...unwritten, ...moved]);
    expect(new Set(generated.map(pathOf)).size).toBe(generated.length);
    expect(unwritten).toHaveLength(lessonOrder.length - lessons.length);
  });

  it('agrees with the stub report', () => {
    const report = stubReport(levels, hasStaticRoute);
    const stubs = report.flatMap((l) => l.topics.flatMap((t) => t.stubs));
    expect(stubs).toHaveLength(lessonOrder.length - lessons.length);
    const trees = stubReport(levels, hasStaticRoute, 'trees');
    expect(trees).toHaveLength(1);
    expect(trees[0].topics).toEqual([
      {
        topic: 'trees',
        title: 'Trees',
        planned: 5,
        stubs: ['binary-trees', 'tree-traversals', 'nary-trees', 'practice-trees'],
      },
    ]);
    expect(lessonRouteFile('trees', 'bst')).toBe('src/routes/trees/bst/+page.svelte');
  });
});

describe('stub route load', () => {
  it('returns the curriculum entry with its book-order neighbors', () => {
    const { stub } = run('trees', 'tree-traversals');
    expect(stub.topic).toBe('trees');
    expect(stub.lesson).toBe(findLesson('tree-traversals')?.lesson);
    expect(stub.prev).toEqual({
      title: 'Binary trees and terminology',
      path: '/trees/binary-trees/',
    });
    expect(stub.next).toEqual({ title: 'Binary search tree', path: '/trees/bst/' });
  });

  it('has no neighbor past either end of the curriculum', () => {
    expect(run('complexity', lessonOrder[0]).stub.prev).toBeUndefined();
    const last = /** @type {string} */ (lessonOrder.at(-1));
    expect(run(/** @type {any} */ (findLesson(last)).chapter.slug, last).stub.next).toBeUndefined();
  });

  it('returns 404 for unknown, misplaced, or written lessons', () => {
    expect(() => run('trees', 'nope')).toThrow();
    expect(() => run('sorting', 'tree-traversals')).toThrow();
    expect(() => run('trees', 'bst')).toThrow();
    expect(() => run('constructor', 'constructor')).toThrow();
  });
});

describe('moved lessons', () => {
  it('redirect from the old topic to the lesson’s current route', () => {
    expect(legacyRedirects.map((r) => [pathOf(r), r.to])).toEqual([
      ['/structures/bst/', '/trees/bst/'],
      ['/graphs/dijkstra-grid/', '/shortest-paths/dijkstra-grid/'],
    ]);
    for (const r of legacyRedirects) {
      expect(run(r.topic, r.slug)).toEqual({ redirect: r.to });
      const [, topic, slug] = r.to.split('/');
      expect(hasStaticRoute(topic, slug)).toBe(true);
      expect(findLesson(slug)?.chapter.slug).toBe(topic);
      // The old path must not be a live lesson, or the redirect would never be served.
      expect(hasStaticRoute(r.topic, r.slug)).toBe(false);
      expect(findLesson(r.slug)?.chapter.slug).not.toBe(r.topic);
    }
  });

  it('render a script-free meta refresh, a canonical link, and a visible link', () => {
    render({ redirect: '/trees/bst/' });
    const refresh = document.head.querySelector('meta[http-equiv="refresh"]');
    expect(refresh?.getAttribute('content')).toBe('0; url=/trees/bst/');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      '/trees/bst/',
    );
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex',
    );
    expect(document.querySelector('section a')?.getAttribute('href')).toBe('/trees/bst/');
    expect(document.querySelectorAll('script')).toHaveLength(0);
  });
});

describe('stub page', () => {
  it('shows the title, kind, key ideas, planned interaction, and a coming-soon badge', () => {
    render(run('trees', 'tree-traversals'));
    const plan = /** @type {any} */ (findLesson('tree-traversals')).lesson;
    const text = document.body.textContent ?? '';
    expect(document.querySelector('h1')?.textContent).toBe(plan.title);
    expect(text).toContain('Trees · Lesson');
    expect(text).toContain('Coming soon');
    const ideas = [...document.querySelectorAll('section ul li')].map((li) => li.textContent);
    expect(ideas).toEqual(plan.keyIdeas);
    expect(text).toContain(plan.interactiveIdea);
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex',
    );
    expect(document.title).toBe(`${plan.title} — AlgoAtlas`);
  });

  it('links back to its topic and to both neighbors', () => {
    render(run('trees', 'tree-traversals'));
    const hrefs = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/trees/', '/trees/binary-trees/', '/trees/bst/']);
  });

  it('links home when the curriculum ends', () => {
    const last = /** @type {string} */ (lessonOrder.at(-1));
    render(run(/** @type {any} */ (findLesson(last)).chapter.slug, last));
    const nav = document.querySelector('nav[aria-label="Lesson navigation"]');
    expect(nav?.textContent).toContain('All topics');
    expect(nav?.textContent).not.toContain('Next lesson');
  });
});
