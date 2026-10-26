import { describe, expect, it } from 'vitest';
import { t } from '$lib/i18n/index.js';
import { chapters, lessonOrder } from '$lib/curriculum/index.js';
import { hasStaticRoute } from './static-routes.js';
import { lessonNeighbors, lessonPath, lessons, lessonsByTopic, topicPath } from './registry.js';

describe('registry', () => {
  it('groups lessons by topic in registry order', () => {
    const grouped = lessons.map((l) => l.topic).flatMap((topic) => lessonsByTopic(topic));
    expect(new Set(grouped)).toEqual(new Set(lessons));
    for (const chapter of chapters) {
      const written = chapter.lessons.filter((p) => lessons.some((l) => l.slug === p.slug));
      expect(lessonsByTopic(chapter.slug).map((l) => l.slug)).toEqual(written.map((p) => p.slug));
    }
    expect(lessonsByTopic('sorting').map((l) => l.slug)).toEqual(
      expect.arrayContaining(['bubble-insertion-sort', 'merge-quick-sort']),
    );
    expect(lessonsByTopic('trees').map((l) => l.slug)).toContain('bst');
    expect(lessonsByTopic('nope')).toEqual([]);
  });

  it('discovers a copy module for exactly the lessons with a route, in curriculum order', () => {
    const routed = chapters.flatMap((c) =>
      c.lessons.filter((l) => hasStaticRoute(c.slug, l.slug)).map((l) => l.slug),
    );
    expect(lessons.map((l) => l.slug)).toEqual(routed);
    expect(routed).toEqual(
      expect.arrayContaining([
        'bubble-insertion-sort',
        'merge-quick-sort',
        'binary-search',
        'lower-upper-bound',
        'hash-table',
        'bst',
        'bfs-grid',
        'dfs-grid',
        'dijkstra-grid',
      ]),
    );
    const positions = lessons.map((l) => lessonOrder.indexOf(l.slug));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('is grouped by topic in the site topic order', () => {
    const runs = lessons.map((l) => l.topic).filter((topic, i, all) => all[i - 1] !== topic);
    expect(runs).toEqual(t().topicOrder.filter((topic) => runs.includes(topic)));
  });

  it('uses only the known difficulty levels', () => {
    for (const lesson of lessons) {
      expect(['Beginner', 'Intermediate', 'Advanced']).toContain(lesson.level);
    }
  });

  it('gives every lesson a one-sentence summary shorter than its intro', () => {
    for (const lesson of lessons) {
      expect(lesson.summary?.length ?? 0).toBeGreaterThan(20);
      expect(lesson.summary?.length ?? 0).toBeLessThan(lesson.intro.length);
      expect(lesson.summary).toMatch(/\.$/);
    }
  });

  it('starts the learning path with a Beginner lesson', () => {
    expect(lessons[0].level).toBe('Beginner');
    expect(t().topics[lessons[0].topic].level).toBe(1);
  });

  it('builds directory-style paths with trailing slashes', () => {
    expect(lessonPath({ topic: 'sorting', slug: 'bubble-insertion-sort' })).toBe(
      '/sorting/bubble-insertion-sort/',
    );
    expect(topicPath('graphs')).toBe('/graphs/');
  });

  it('gives every lesson the fields the layout renders', () => {
    for (const lesson of lessons) {
      expect(lesson.slug).toMatch(/^[a-z0-9-]+$/);
      expect(lesson.takeaways.length).toBeGreaterThan(0);
      for (const row of lesson.complexity) expect(row).toHaveLength(3);
    }
  });

  it('links each lesson to its curriculum neighbours, stubs included', () => {
    for (let i = 1; i < lessonOrder.length - 1; i++) {
      const { prev, next } = lessonNeighbors(lessonOrder[i]);
      expect(prev?.path).toMatch(new RegExp(`/${lessonOrder[i - 1]}/$`));
      expect(next?.path).toMatch(new RegExp(`/${lessonOrder[i + 1]}/$`));
    }
    expect(lessonNeighbors(lessonOrder[0]).prev).toBeUndefined();
    expect(lessonNeighbors(/** @type {string} */ (lessonOrder.at(-1))).next).toBeUndefined();
    expect(lessonNeighbors('no-such-lesson')).toEqual({ prev: undefined, next: undefined });
    const written = new Set(lessons.map((l) => l.slug));
    const beforeStub = lessonOrder.findIndex(
      (s, i) => written.has(s) && i + 1 < lessonOrder.length && !written.has(lessonOrder[i + 1]),
    );
    if (beforeStub !== -1) {
      expect(lessonNeighbors(lessonOrder[beforeStub]).next?.path).toContain(
        lessonOrder[beforeStub + 1],
      );
    }
  });
});
