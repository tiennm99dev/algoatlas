/**
 * The editable grid shared by the grid lessons: walls, a movable start and goal, the
 * tool that decides what a click does, and a notice that confirms each edit.
 * A lesson supplies the trace function and, optionally, one terrain tool (mud).
 */
import { randomWalls } from '$lib/algo-engine/graph.js';
import { createPlayer } from './player.svelte.js';

/**
 * @typedef {object} GridInput
 * @property {number} rows
 * @property {number} cols
 * @property {Set<number>} walls
 * @property {number} start
 * @property {number} goal
 */

/**
 * A paintable terrain layer that lives in the lesson page (for example mud costs).
 * The editor calls it but never owns its data, so the page's trace can read it.
 * @typedef {object} TerrainTool
 * @property {string} tool Key in the lesson's `tools` copy that selects this layer.
 * @property {(cell: number) => boolean} isOn
 * @property {(cell: number, on: boolean) => void} set
 * @property {(cell: number) => boolean} clear Reset one cell; true when it held terrain.
 * @property {(exclude: number[]) => Set<number>} randomize Scatter terrain, return the walls.
 * @property {() => void} reset Remove all terrain.
 * @property {(at: string) => string} added
 * @property {(at: string) => string} removed
 */

/**
 * @typedef {object} GridEditorCopy
 * @property {(cell: number, cols: number) => string} coord
 * @property {string} blockedCell
 * @property {{
 *   wallAdded: (at: string) => string,
 *   wallRemoved: (at: string) => string,
 *   startMoved: (at: string) => string,
 *   goalMoved: (at: string) => string,
 *   terrainCleared?: string,
 * }} edits
 */

/**
 * @template T
 * @param {{
 *   rows: number,
 *   cols: number,
 *   walls: Iterable<number>,
 *   start: number,
 *   goal: number,
 *   trace: (grid: GridInput) => T[],
 *   copy: GridEditorCopy,
 *   terrain?: TerrainTool,
 * }} options `walls` is the initial set; `trace` must return at least one frame.
 */
export function createGridEditor({
  rows,
  cols,
  walls: initialWalls,
  start: s0,
  goal: g0,
  trace,
  copy,
  terrain,
}) {
  // Fresh sets are assigned to $state.raw and never mutated afterwards.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  let walls = $state.raw(new Set(initialWalls));
  let start = $state(s0);
  let goal = $state(g0);
  let tool = $state('wall');
  /** A message shown in place of the narration, only on the frame it was raised on. */
  let notice = $state({ text: '', at: -1 });

  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const first = new Set(initialWalls);
  const player = createPlayer(trace({ rows, cols, walls: first, start: s0, goal: g0 }));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function clearNotice() {
    notice = { text: '', at: -1 };
  }

  function rebuild() {
    clearNotice();
    player.load(trace({ rows, cols, walls, start, goal }));
  }

  /** @param {number} cell @param {boolean} on */
  function setWall(cell, on) {
    if (cell === start || cell === goal || walls.has(cell) === on) return;
    // A fresh copy assigned to $state.raw below; it is never mutated after that.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const next = new Set(walls);
    if (on) {
      next.add(cell);
      // A wall has no terrain, so it forgets any underneath.
      terrain?.clear(cell);
    } else next.delete(cell);
    walls = next;
    rebuild();
  }

  /** @param {number} cell @param {boolean} on */
  function setTerrain(cell, on) {
    if (!terrain || cell === start || cell === goal || walls.has(cell)) return;
    if (terrain.isOn(cell) === on) return;
    terrain.set(cell, on);
    rebuild();
  }

  /**
   * A single deliberate edit (keyboard, or a click with the move tools). Each one is
   * confirmed in the narration, since recoloring a cell is silent for screen readers.
   * @param {number} cell
   */
  function edit(cell) {
    const here = copy.coord(cell, cols);
    const occupied = cell === start || cell === goal;
    if (tool === 'wall') {
      if (occupied) {
        say(copy.blockedCell);
        return;
      }
      const on = !walls.has(cell);
      setWall(cell, on);
      say(on ? copy.edits.wallAdded(here) : copy.edits.wallRemoved(here));
      return;
    }
    if (walls.has(cell) || occupied) {
      say(copy.blockedCell);
      return;
    }
    if (terrain && tool === terrain.tool) {
      const on = !terrain.isOn(cell);
      setTerrain(cell, on);
      say(on ? terrain.added(here) : terrain.removed(here));
      return;
    }
    // Start and goal never sit on terrain, so moving onto it clears it.
    const cleared = terrain?.clear(cell) ?? false;
    if (tool === 'start') start = cell;
    else goal = cell;
    rebuild();
    const moved = tool === 'start' ? copy.edits.startMoved(here) : copy.edits.goalMoved(here);
    say(cleared && copy.edits.terrainCleared ? `${moved} ${copy.edits.terrainCleared}` : moved);
  }

  function scatter() {
    walls = terrain
      ? terrain.randomize([start, goal])
      : randomWalls(rows, cols, 0.28, [start, goal]);
    rebuild();
  }

  function clearWalls() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    walls = new Set();
    terrain?.reset();
    rebuild();
  }

  return {
    player,
    get walls() {
      return walls;
    },
    get start() {
      return start;
    },
    get goal() {
      return goal;
    },
    get tool() {
      return tool;
    },
    /** @param {string} v */
    set tool(v) {
      tool = v;
    },
    /** The notice when one was raised on this frame, else the frame's own narration. @param {string} text */
    narration(text) {
      return notice.at === player.index ? notice.text : text;
    },
    clearNotice,
    scatter,
    clearWalls,
    edit,
    /** Start a pointer stroke: a single edit for the move tools, else a paint value. @param {number} cell */
    onPaintStart(cell) {
      if (tool === 'start' || tool === 'goal') {
        edit(cell);
        return null;
      }
      if (terrain && tool === terrain.tool) {
        const on = !terrain.isOn(cell);
        setTerrain(cell, on);
        return on;
      }
      const on = !walls.has(cell);
      setWall(cell, on);
      return on;
    },
    /** @param {number} cell @param {boolean} on */
    onPaint(cell, on) {
      if (terrain && tool === terrain.tool) setTerrain(cell, on);
      else setWall(cell, on);
    },
    onEdit: edit,
  };
}
