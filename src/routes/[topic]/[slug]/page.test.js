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
import { t } from '$lib/i18n/index.js';

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

/** @param {string | undefined} slug */
function neighborOf(slug) {
  const entry = slug === undefined ? undefined : findLesson(slug);
  return (
    entry && {
      title: entry.lesson.title,
      path: pathOf({ topic: entry.chapter.slug, slug: entry.lesson.slug }),
    }
  );
}

// The sample is the first unwritten lesson with a neighbor on both sides, so these tests keep
// working as lessons get written; once none is left there is no stub page to test.
const sampleSlug = lessonOrder.find((slug, i) => {
  const entry = /** @type {NonNullable<ReturnType<typeof findLesson>>} */ (findLesson(slug));
  return i > 0 && i < lessonOrder.length - 1 && !hasStaticRoute(entry.chapter.slug, slug);
});
const sample = sampleSlug === undefined ? undefined : findLesson(sampleSlug);
const sampleAt = sampleSlug === undefined ? -1 : lessonOrder.indexOf(sampleSlug);
const sampleTopic = sample?.chapter.slug ?? '';
const sampleLesson = sample?.lesson.slug ?? '';

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
    const plan = /** @type {import('$lib/curriculum/index.js').Chapter} */ (
      chapters.find((c) => c.slug === 'trees')
    );
    const trees = stubReport(levels, hasStaticRoute, 'trees');
    expect(trees).toHaveLength(1);
    expect(trees[0].topics).toEqual([
      {
        topic: 'trees',
        title: 'Trees',
        planned: plan.lessons.length,
        stubs: plan.lessons.filter((l) => !hasStaticRoute('trees', l.slug)).map((l) => l.slug),
      },
    ]);
    expect(trees[0].topics[0].stubs).not.toContain('bst');
    expect(lessonRouteFile('trees', 'bst')).toBe('src/routes/trees/bst/+page.svelte');
  });
});

describe.skipIf(!sample)('stub route load', () => {
  it('returns the curriculum entry with its book-order neighbors', () => {
    const { stub } = run(sampleTopic, sampleLesson);
    expect(stub.topic).toBe(sampleTopic);
    expect(stub.lesson).toBe(sample?.lesson);
    expect(stub.prev).toEqual(neighborOf(lessonOrder[sampleAt - 1]));
    expect(stub.next).toEqual(neighborOf(lessonOrder[sampleAt + 1]));
    expect(stub.prev).toBeDefined();
    expect(stub.next).toBeDefined();
  });

  it('has no neighbor past either end of the curriculum', () => {
    const first = lessonOrder[0];
    if (!hasStaticRoute('complexity', first)) {
      expect(run('complexity', first).stub.prev).toBeUndefined();
    }
    const last = /** @type {string} */ (lessonOrder.at(-1));
    const lastTopic = /** @type {any} */ (findLesson(last)).chapter.slug;
    if (!hasStaticRoute(lastTopic, last)) expect(run(lastTopic, last).stub.next).toBeUndefined();
  });

  it('returns 404 for unknown, misplaced, or written lessons', () => {
    expect(() => run(sampleTopic, 'nope')).toThrow();
    const elsewhere = chapters.find((c) => c.slug !== sampleTopic)?.slug ?? '';
    expect(() => run(elsewhere, sampleLesson)).toThrow();
    expect(() => run('trees', 'bst')).toThrow();
    for (const lesson of lessons) expect(() => run(lesson.topic, lesson.slug)).toThrow();
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

describe.skipIf(!sample)('stub page', () => {
  it('shows the title, kind, key ideas, planned interaction, and a coming-soon badge', () => {
    render(run(sampleTopic, sampleLesson));
    const plan = /** @type {any} */ (sample).lesson;
    const text = document.body.textContent ?? '';
    expect(document.querySelector('h1')?.textContent).toBe(plan.title);
    expect(text).toContain(
      `${t().topics[sampleTopic].title} · ${t().stub.kinds[/** @type {'theory'} */ (plan.kind)]}`,
    );
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
    render(run(sampleTopic, sampleLesson));
    const hrefs = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([
      `/${sampleTopic}/`,
      neighborOf(lessonOrder[sampleAt - 1])?.path,
      neighborOf(lessonOrder[sampleAt + 1])?.path,
    ]);
  });

  it('links home when the curriculum ends', () => {
    const last = /** @type {string} */ (lessonOrder.at(-1));
    const lastTopic = /** @type {any} */ (findLesson(last)).chapter.slug;
    if (hasStaticRoute(lastTopic, last)) return;
    render(run(lastTopic, last));
    const nav = document.querySelector('nav[aria-label="Lesson navigation"]');
    expect(nav?.textContent).toContain('All topics');
    expect(nav?.textContent).not.toContain('Next lesson');
  });
});
