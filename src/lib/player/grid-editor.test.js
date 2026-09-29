import { describe, expect, it, vi } from 'vitest';
import { gridCopy } from '$lib/lessons/grid-copy.en.js';
import { createGridEditor } from './grid-editor.svelte.js';

const ROWS = 4;
const COLS = 5;
const copy = { ...gridCopy, edits: { ...gridCopy.edits, terrainCleared: 'Mud cleared.' } };

/** @param {Record<string, any>} [extra] */
function make(extra = {}) {
  const trace = vi.fn((/** @type {import('./grid-editor.svelte.js').GridInput} */ grid) => [
    { walls: [...grid.walls], start: grid.start, goal: grid.goal },
    { walls: [...grid.walls], start: grid.start, goal: grid.goal },
  ]);
  const editor = createGridEditor({
    rows: ROWS,
    cols: COLS,
    walls: [7],
    start: 0,
    goal: 19,
    trace,
    copy,
    ...extra,
  });
  return { editor, trace };
}

/** A mud layer backed by a plain set, like the Dijkstra page's cost array. */
function mudLayer() {
  const mud = new Set([12]);
  return {
    mud,
    layer: {
      tool: 'mud',
      isOn: (/** @type {number} */ c) => mud.has(c),
      set: (/** @type {number} */ c, /** @type {boolean} */ on) => {
        if (on) mud.add(c);
        else mud.delete(c);
      },
      clear: (/** @type {number} */ c) => mud.delete(c),
      randomize: () => new Set([3]),
      reset: () => mud.clear(),
      added: (/** @type {string} */ at) => `Mud added at ${at}.`,
      removed: (/** @type {string} */ at) => `Mud removed at ${at}.`,
    },
  };
}

describe('createGridEditor', () => {
  it('starts on a trace of the initial grid', () => {
    const { editor, trace } = make();
    expect(trace).toHaveBeenCalledTimes(1);
    expect([...editor.walls]).toEqual([7]);
    expect(editor.player.frame).toMatchObject({ start: 0, goal: 19 });
  });

  it('toggles a wall, rebuilds from frame 0, and confirms it', () => {
    const { editor, trace } = make();
    editor.player.step();
    editor.edit(2);
    expect(editor.walls.has(2)).toBe(true);
    expect(trace).toHaveBeenCalledTimes(2);
    expect(editor.player.index).toBe(0);
    expect(editor.narration('frame text')).toBe('Wall added at (0,2).');
    editor.edit(2);
    expect(editor.walls.has(2)).toBe(false);
    expect(editor.narration('frame text')).toBe('Wall removed at (0,2).');
  });

  it('refuses a wall on the start or goal without rebuilding', () => {
    const { editor, trace } = make();
    editor.edit(0);
    editor.edit(19);
    expect(editor.walls.size).toBe(1);
    expect(trace).toHaveBeenCalledTimes(1);
    expect(editor.narration('x')).toBe(gridCopy.blockedCell);
  });

  it('moves the start and goal, and refuses walls and each other', () => {
    const { editor } = make();
    editor.tool = 'start';
    editor.edit(1);
    expect(editor.start).toBe(1);
    expect(editor.narration('x')).toBe('Start moved to (0,1).');
    editor.tool = 'goal';
    editor.edit(18);
    expect(editor.goal).toBe(18);
    editor.edit(7);
    expect(editor.goal).toBe(18);
    editor.edit(1);
    expect(editor.goal).toBe(18);
    expect(editor.narration('x')).toBe(gridCopy.blockedCell);
  });

  it('shows a notice only on the frame it was raised on', () => {
    const { editor } = make();
    editor.edit(0);
    expect(editor.narration('x')).toBe(gridCopy.blockedCell);
    editor.player.step();
    expect(editor.narration('x')).toBe('x');
    editor.player.back();
    expect(editor.narration('x')).toBe(gridCopy.blockedCell);
    editor.clearNotice();
    expect(editor.narration('x')).toBe('x');
  });

  it('scatters walls away from the start and goal, and clears them', () => {
    const { editor } = make();
    editor.scatter();
    expect(editor.walls.has(0)).toBe(false);
    expect(editor.walls.has(19)).toBe(false);
    editor.clearWalls();
    expect(editor.walls.size).toBe(0);
  });

  it('paints with one value per stroke and ignores start and goal', () => {
    const { editor } = make();
    expect(editor.onPaintStart(2)).toBe(true);
    editor.onPaint(3, true);
    editor.onPaint(0, true);
    expect([...editor.walls].sort((a, b) => a - b)).toEqual([2, 3, 7]);
    expect(editor.onPaintStart(2)).toBe(false);
    editor.onPaint(3, false);
    expect(editor.walls.has(3)).toBe(false);
  });

  it('treats a press with a move tool as a single edit', () => {
    const { editor } = make();
    editor.tool = 'goal';
    expect(editor.onPaintStart(18)).toBeNull();
    expect(editor.goal).toBe(18);
  });

  describe('with a terrain tool', () => {
    it('paints terrain but never on walls, start, or goal', () => {
      const { mud, layer } = mudLayer();
      const { editor } = make({ terrain: layer });
      editor.tool = 'mud';
      editor.edit(2);
      expect(mud.has(2)).toBe(true);
      expect(editor.narration('x')).toBe('Mud added at (0,2).');
      editor.edit(2);
      expect(mud.has(2)).toBe(false);
      editor.edit(7);
      editor.edit(0);
      expect(mud.has(7)).toBe(false);
      expect(mud.has(0)).toBe(false);
      expect(editor.onPaintStart(3)).toBe(true);
      editor.onPaint(4, true);
      expect([...mud].sort((a, b) => a - b)).toEqual([3, 4, 12]);
    });

    it('a wall replaces the terrain under it', () => {
      const { mud, layer } = mudLayer();
      const { editor } = make({ terrain: layer });
      editor.edit(12);
      expect(editor.walls.has(12)).toBe(true);
      expect(mud.has(12)).toBe(false);
    });

    it('moving the start or goal onto terrain clears it and says so', () => {
      const { mud, layer } = mudLayer();
      const { editor } = make({ terrain: layer });
      editor.tool = 'start';
      editor.edit(12);
      expect(editor.start).toBe(12);
      expect(mud.has(12)).toBe(false);
      expect(editor.narration('x')).toBe('Start moved to (2,2). Mud cleared.');
      mud.add(13);
      editor.tool = 'goal';
      editor.edit(13);
      expect(mud.has(13)).toBe(false);
      editor.edit(14);
      expect(editor.narration('x')).toBe('Goal moved to (2,4).');
    });

    it('scatter takes the walls from the terrain, and clear resets it', () => {
      const { mud, layer } = mudLayer();
      const { editor } = make({ terrain: layer });
      editor.scatter();
      expect([...editor.walls]).toEqual([3]);
      editor.clearWalls();
      expect(editor.walls.size).toBe(0);
      expect(mud.size).toBe(0);
    });
  });
});
