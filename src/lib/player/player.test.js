import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlayer } from './player.svelte.js';

describe('createPlayer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('steps within bounds', () => {
    const p = createPlayer(['a', 'b', 'c']);
    p.back();
    expect(p.index).toBe(0);
    p.step();
    p.step();
    p.step();
    expect(p.frame).toBe('c');
    expect(p.atEnd).toBe(true);
  });

  it('autoplays at the chosen speed and stops at the end', () => {
    const p = createPlayer([0, 1, 2, 3]);
    p.speed = 4;
    p.play();
    vi.advanceTimersByTime(250);
    expect(p.index).toBe(1);
    vi.advanceTimersByTime(10_000);
    expect(p.index).toBe(3);
    expect(p.playing).toBe(false);
  });

  it('restarts from the beginning when played at the end', () => {
    const p = createPlayer([0, 1]);
    p.seek(1);
    p.play();
    expect(p.index).toBe(0);
    expect(p.playing).toBe(true);
  });

  it('manual stepping pauses playback', () => {
    const p = createPlayer([0, 1, 2, 3, 4]);
    p.play();
    p.step();
    vi.advanceTimersByTime(10_000);
    expect(p.index).toBe(1);
  });

  it('load resets to the first frame of the new trace', () => {
    const p = createPlayer(['x', 'y']);
    p.seek(1);
    p.load(['p', 'q', 'r']);
    expect(p.index).toBe(0);
    expect(p.frames).toHaveLength(3);
  });

  it('seek clamps out-of-range indices', () => {
    const p = createPlayer([0, 1, 2]);
    p.seek(99);
    expect(p.index).toBe(2);
    p.seek(-5);
    expect(p.index).toBe(0);
  });
});
