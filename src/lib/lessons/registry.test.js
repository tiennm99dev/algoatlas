import { describe, expect, it } from 'vitest';
import { t } from '$lib/i18n/index.js';
import { lessonPath, lessons, lessonsByTopic, topicPath } from './registry.js';

describe('registry', () => {
  it('groups lessons by topic in registry order', () => {
    const grouped = lessons.map((l) => l.topic).flatMap((topic) => lessonsByTopic(topic));
    expect(new Set(grouped)).toEqual(new Set(lessons));
    expect(lessonsByTopic('sorting').map((l) => l.slug)).toEqual([
      'bubble-insertion-sort',
      'merge-quick-sort',
    ]);
    expect(lessonsByTopic('structures').map((l) => l.slug)).toEqual(['hash-table', 'bst']);
    expect(lessonsByTopic('nope')).toEqual([]);
  });

  it('is grouped by topic in the site topic order', () => {
    const runs = lessons.map((l) => l.topic).filter((topic, i, all) => all[i - 1] !== topic);
    expect(runs).toEqual(t().topicOrder);
  });

  it('uses only the known difficulty levels', () => {
    for (const lesson of lessons) expect(['Beginner', 'Intermediate']).toContain(lesson.level);
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
