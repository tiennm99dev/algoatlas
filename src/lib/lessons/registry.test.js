import { describe, expect, it } from 'vitest';
import { t } from '$lib/i18n/index.js';
import { lessonOrder } from '$lib/curriculum/index.js';
import { lessonPath, lessons, lessonsByTopic, topicPath } from './registry.js';

describe('registry', () => {
  it('groups lessons by topic in registry order', () => {
    const grouped = lessons.map((l) => l.topic).flatMap((topic) => lessonsByTopic(topic));
    expect(new Set(grouped)).toEqual(new Set(lessons));
    expect(lessonsByTopic('sorting').map((l) => l.slug)).toEqual([
      'bubble-insertion-sort',
      'merge-quick-sort',
    ]);
    expect(lessonsByTopic('trees').map((l) => l.slug)).toEqual(['bst']);
    expect(lessonsByTopic('nope')).toEqual([]);
  });

  it('discovers every copy module and orders the lessons by the curriculum', () => {
    expect(lessons.map((l) => l.slug)).toEqual([
      'bubble-insertion-sort',
      'merge-quick-sort',
      'binary-search',
      'lower-upper-bound',
      'hash-table',
      'bst',
      'bfs-grid',
      'dfs-grid',
      'dijkstra-grid',
    ]);
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
    expect(lessonPath(lessons[0])).toBe('/sorting/bubble-insertion-sort/');
    expect(topicPath('graphs')).toBe('/graphs/');
  });

  it('gives every lesson the fields the layout renders', () => {
    for (const lesson of lessons) {
      expect(lesson.slug).toMatch(/^[a-z0-9-]+$/);
      expect(lesson.takeaways.length).toBeGreaterThan(0);
      for (const row of lesson.complexity) expect(row).toHaveLength(3);
    }
  });
});
