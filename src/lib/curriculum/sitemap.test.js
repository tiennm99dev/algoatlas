import { describe, expect, it } from 'vitest';
import { chapters } from './index.js';
import { lessonPath, topicPath } from '$lib/lessons/paths.js';
import { sitemapPaths, sitemapXml } from './sitemap.js';

describe('sitemap', () => {
  const paths = sitemapPaths();

  it('lists the home page, every topic hub and every curriculum lesson once', () => {
    expect(paths[0]).toBe('/');
    for (const c of chapters) {
      expect(paths).toContain(topicPath(c.slug));
      for (const l of c.lessons)
        expect(paths).toContain(lessonPath({ topic: c.slug, slug: l.slug }));
    }
    const lessons = chapters.reduce((n, c) => n + c.lessons.length, 0);
    expect(paths).toHaveLength(1 + chapters.length + lessons);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('writes one url element per address', () => {
    const xml = sitemapXml(['https://example.com/a/', 'https://example.com/b/']);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(xml.match(/<url><loc>/g)).toHaveLength(2);
  });
});
