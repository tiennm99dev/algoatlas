<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GridBoard from '$lib/components/grid-board.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MUD_COST,
    dijkstraGridTrace,
    dijkstraPseudocode,
    pathCost,
    randomTerrain,
  } from '$lib/algo-engine/dijkstra-grid.js';
  import { bfsGridTrace } from '$lib/algo-engine/graph.js';
  import { en as m } from '$lib/lessons/dijkstra-grid/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {keyof typeof m.tools} Tool */
  const TOOLS = /** @type {Tool[]} */ (Object.keys(m.tools));
  const ROWS = 10;
  const COLS = 16;
  const at = (/** @type {number} */ r, /** @type {number} */ c) => r * COLS + c;

  const DEFAULT_START = at(4, 2);
  const DEFAULT_GOAL = at(4, 13);
  // A mud band between start and goal, fixed so the prerendered HTML matches the hydrated page.
  const defaultCost = () => {
    const cost = new Array(ROWS * COLS).fill(1);
    for (let r = 2; r <= 7; r++) for (let c = 6; c <= 9; c++) cost[at(r, c)] = MUD_COST;
    return cost;
  };

  let walls = $state.raw(/** @type {Set<number>} */ (new Set()));
  let cost = $state.raw(defaultCost());
  let start = $state(DEFAULT_START);
  let goal = $state(DEFAULT_GOAL);
  let tool = $state(/** @type {Tool} */ ('wall'));

  const player = createPlayer(
    dijkstraGridTrace({
      rows: ROWS,
      cols: COLS,
      walls: new Set(),
      start: DEFAULT_START,
      goal: DEFAULT_GOAL,
      cost: defaultCost(),
    }),
  );
  const frame = $derived(player.frame);
  const queueSet = $derived(new Set(frame.pq.map(([c]) => c)));
  const settledSet = $derived(new Set(frame.settled));
  const pathSet = $derived(new Set(frame.path));

  /** Both routes on the current grid, independent of playback. Null when the goal is cut off. */
  const routes = $derived.by(() => {
    const grid = { rows: ROWS, cols: COLS, walls, start, goal, cost };
    const bfs = bfsGridTrace(grid).at(-1);
    const dijkstra = dijkstraGridTrace(grid).at(-1);
    if (!bfs?.path.length || !dijkstra?.path.length) return null;
    return {
      bfs: m.bfsRoute(bfs.path.length - 1, pathCost(bfs.path, cost)),
      dijkstra: m.dijkstraRoute(dijkstra.path.length - 1, pathCost(dijkstra.path, cost)),
    };
  });

  /** A message shown in place of the narration, only on the frame it was raised on. */
  let notice = $state({ text: '', at: -1 });
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, COLS));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function clearNotice() {
    notice = { text: '', at: -1 };
  }

  function rebuild() {
    clearNotice();
    player.load(dijkstraGridTrace({ rows: ROWS, cols: COLS, walls, start, goal, cost }));
  }

  /** @param {number} cell @param {boolean} on */
  function setWall(cell, on) {
    if (cell === start || cell === goal || walls.has(cell) === on) return;
    // Fresh copies assigned to $state.raw below; they are never mutated after that.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const next = new Set(walls);
    if (on) {
      next.add(cell);
      // A wall has no terrain, so it forgets any mud underneath.
      if (cost[cell] !== 1) cost = cost.map((c, i) => (i === cell ? 1 : c));
    } else next.delete(cell);
    walls = next;
    rebuild();
  }

  /** @param {number} cell @param {boolean} on */
  function setMud(cell, on) {
    if (cell === start || cell === goal || walls.has(cell)) return;
    if ((cost[cell] === MUD_COST) === on) return;
    cost = cost.map((c, i) => (i === cell ? (on ? MUD_COST : 1) : c));
    rebuild();
  }

  /**
   * A single deliberate edit (keyboard, or a click with the move tools). Each one is
   * confirmed in the narration, since recoloring a cell is silent for screen readers.
   * @param {number} cell
   */
  function edit(cell) {
    const here = m.coord(cell, COLS);
    if (tool === 'wall') {
      if (cell === start || cell === goal) {
        say(m.blockedCell);
        return;
      }
      const on = !walls.has(cell);
      setWall(cell, on);
      say(on ? m.edits.wallAdded(here) : m.edits.wallRemoved(here));
      return;
    }
    if (walls.has(cell) || cell === start || cell === goal) {
      say(m.blockedCell);
      return;
    }
    if (tool === 'mud') {
      const on = cost[cell] !== MUD_COST;
      setMud(cell, on);
      say(on ? m.edits.mudAdded(here) : m.edits.mudRemoved(here));
      return;
    }
    if (tool === 'start') start = cell;
    else goal = cell;
    rebuild();
    say(tool === 'start' ? m.edits.startMoved(here) : m.edits.goalMoved(here));
  }

  function scatter() {
    const terrain = randomTerrain(ROWS, COLS, 0.15, 0.3, [start, goal]);
    walls = terrain.walls;
    cost = terrain.cost;
    rebuild();
  }

  function clearTerrain() {
    walls = new Set();
    cost = new Array(ROWS * COLS).fill(1);
    rebuild();
  }

  /** @param {number} cell */
  function cellLook(cell) {
    if (cell === start)
      return { cls: 'bg-emerald-700 text-white', label: m.legend.start, mark: 'S' };
    if (cell === goal) return { cls: 'bg-rose-600 text-white', label: m.legend.goal, mark: 'G' };
    if (walls.has(cell)) return { cls: 'bg-slate-800', label: m.legend.wall, mark: '' };
    const d = frame.dist[cell];
    const mark = d >= 0 ? String(d) : '';
    // Mud is a hatch over whatever state color the cell has; the label carries its cost.
    const mud = cost[cell] === MUD_COST ? ' terrain-mud' : '';
    // The path fill is close in luminance to the settled fill, so it also gets an inset ring.
    if (pathSet.has(cell))
      return {
        cls: 'bg-state-path text-slate-900 ring-2 ring-amber-700 ring-inset' + mud,
        label: m.legend.path,
        mark,
      };
    if (cell === frame.current)
      return { cls: 'bg-state-active text-white' + mud, label: m.legend.current, mark };
    if (queueSet.has(cell)) {
      const ring = cell === frame.touched ? ' ring-2 ring-inset ring-sky-900' : '';
      return {
        cls: 'bg-state-frontier text-slate-900' + ring + mud,
        label: m.legend.frontier,
        mark,
      };
    }
    if (settledSet.has(cell))
      return { cls: 'bg-state-visited text-indigo-900' + mud, label: m.legend.visited, mark };
    return { cls: 'bg-white text-slate-900' + mud, label: '', mark };
  }

  const legend = [
    ['bg-emerald-700', m.legend.start],
    ['bg-rose-600', m.legend.goal],
    ['bg-slate-800', m.legend.wall],
    ['bg-white border border-slate-300 terrain-mud', m.legend.mud],
    ['bg-state-frontier', m.legend.frontier],
    ['bg-state-visited', m.legend.visited],
    ['bg-state-active', m.legend.current],
    ['bg-state-path ring-1 ring-amber-700 ring-inset', m.legend.path],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.toolLabel}
      name="tool"
      options={TOOLS.map((tl) => ({ value: tl, label: m.tools[tl] }))}
      bind:value={tool}
      onchange={clearNotice}
    />
    <div class="flex gap-2">
      <button onclick={scatter} class="btn-secondary">{m.randomTerrain}</button>
      <button onclick={clearTerrain} class="btn-outline">{m.clearTerrain}</button>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GridBoard
          rows={ROWS}
          cols={COLS}
          cellState={(cell) => {
            const s = cellLook(cell);
            const isWall = walls.has(cell);
            return {
              ...s,
              label: m.cellLabel(
                cell,
                COLS,
                s.label,
                !isWall && cost[cell] === MUD_COST,
                isWall ? -1 : frame.dist[cell],
              ),
            };
          }}
          gridLabel={m.gridLabel}
          initialFocus={DEFAULT_START}
          speed={player.speed}
          onPaintStart={(cell) => {
            if (tool === 'start' || tool === 'goal') {
              edit(cell);
              return null;
            }
            if (tool === 'mud') {
              const on = cost[cell] !== MUD_COST;
              setMud(cell, on);
              return on;
            }
            const on = !walls.has(cell);
            setWall(cell, on);
            return on;
          }}
          onPaint={(cell, on) => (tool === 'mud' ? setMud(cell, on) : setWall(cell, on))}
          onEdit={edit}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
        </ul>
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>

      <div class="sticky bottom-2 z-10 lg:static">
        <StepControls {player} />
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <dl class="grid grid-cols-3 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.settledLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.settled.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.relaxLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.relaxations}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.costLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.path.length ? pathCost(frame.path, cost) : '—'}
          </dd>
        </div>
      </dl>
      {#if routes}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
          <p class="text-sm text-slate-800">{routes.bfs}</p>
          <p class="text-sm text-slate-800">{routes.dijkstra}</p>
        </div>
      {/if}
      <ChipList
        title={m.pqLabel}
        emptyText={m.pqEmpty}
        items={frame.pq.map(([c, d]) => ({
          label: m.pqChip(c, COLS, d),
          hot: c === frame.touched,
        }))}
      />
      <CodePanel lines={dijkstraPseudocode} active={frame.lines} />
    </div>
  </div>
</LessonLayout>
