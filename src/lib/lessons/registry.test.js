import { describe, expect, it } from 'vitest';
import { lessonPath, lessons, lessonsByTopic, topicPath } from './registry.js';

describe('registry', () => {
  it('groups lessons by topic in registry order', () => {
    const grouped = lessons.map((l) => l.topic).flatMap((topic) => lessonsByTopic(topic));
    expect(new Set(grouped)).toEqual(new Set(lessons));
    expect(lessonsByTopic('sorting').map((l) => l.slug)).toEqual(['bubble-insertion-sort']);
    expect(lessonsByTopic('nope')).toEqual([]);
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
