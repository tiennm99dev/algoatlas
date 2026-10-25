import { describe, expect, it } from 'vitest';
import { t } from '$lib/i18n/index.js';
import { lessons } from '$lib/lessons/registry.js';
import { chapters, findLesson, lessonOrder, levels, topicOrder, topics } from './index.js';

const allLessons = chapters.flatMap((c) => c.lessons);

describe('curriculum', () => {
  it('has three levels and 34 chapters', () => {
    expect(levels.map((l) => l.level)).toEqual([1, 2, 3]);
    expect(levels.map((l) => l.title)).toEqual([
      'Foundations',
      'Core algorithms',
      'Advanced topics',
    ]);
    expect(chapters).toHaveLength(34);
    expect(allLessons.length).toBeGreaterThanOrEqual(186);
  });

  it('gives every chapter the fields the hubs render', () => {
    for (const c of chapters) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.strand).toMatch(/^[a-z-]+$/);
      expect(c.blurb).toMatch(/^[A-Z].{20,}\.$/);
      expect(c.lessons.length).toBeGreaterThan(0);
    }
  });

  it('gives every lesson a known kind and its plan', () => {
    for (const l of allLessons) {
      expect(['theory', 'practice', 'review']).toContain(l.kind);
      expect(l.title.length).toBeGreaterThan(0);
      expect(l.keyIdeas.length).toBeGreaterThan(0);
      expect(l.interactiveIdea.length).toBeGreaterThan(0);
    }
  });

  it('keeps chapter and lesson slugs URL-safe, at most 80 characters, and unique', () => {
    const slugs = [...chapters.map((c) => c.slug), ...lessonOrder];
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(slug.length).toBeLessThanOrEqual(80);
    }
    expect(new Set(chapters.map((c) => c.slug)).size).toBe(chapters.length);
    expect(new Set(lessonOrder).size).toBe(lessonOrder.length);
  });

  it('never lets a topic slug shadow a static route or a lesson slug', () => {
    for (const slug of topicOrder) expect(lessonOrder).not.toContain(slug);
  });

  it('derives the site topics from the chapters, in learning order', () => {
    expect(topicOrder).toEqual(chapters.map((c) => c.slug));
    expect(t().topicOrder).toBe(topicOrder);
    expect(t().topics).toBe(topics);
    expect(topics['shortest-paths']).toEqual({
      title: 'Shortest paths',
      blurb: chapters.find((c) => c.slug === 'shortest-paths')?.blurb,
      level: 2,
    });
    expect(Object.hasOwn(topics, 'constructor')).toBe(false);
  });

  it('finds a lesson with the chapter it sits in', () => {
    expect(findLesson('bst')?.chapter.slug).toBe('trees');
    expect(findLesson('dijkstra-grid')?.chapter.slug).toBe('shortest-paths');
    expect(findLesson('nope')).toBeUndefined();
  });

  it('places every written lesson in the curriculum under its own topic', () => {
    expect(lessons).toHaveLength(9);
    for (const lesson of lessons) expect(findLesson(lesson.slug)?.chapter.slug).toBe(lesson.topic);
  });
});
