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
  import { createGridEditor } from '$lib/player/grid-editor.svelte.js';

  /** @typedef {import('$lib/player/grid-editor.svelte.js').GridInput} GridInput */
  const TOOLS = /** @type {(keyof typeof m.tools)[]} */ (Object.keys(m.tools));
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

  let cost = $state.raw(defaultCost());

  /**
   * The mud layer: the page owns the costs, the editor decides when to change them.
   * @type {import('$lib/player/grid-editor.svelte.js').TerrainTool}
   */
  const mud = {
    tool: 'mud',
    /** @param {number} cell */
    isOn: (cell) => cost[cell] === MUD_COST,
    /** @param {number} cell @param {boolean} on */
    set(cell, on) {
      cost = cost.map((c, i) => (i === cell ? (on ? MUD_COST : 1) : c));
    },
    /** @param {number} cell */
    clear(cell) {
      if (cost[cell] === 1) return false;
      cost = cost.map((c, i) => (i === cell ? 1 : c));
      return true;
    },
    /** @param {number[]} exclude */
    randomize(exclude) {
      const terrain = randomTerrain(ROWS, COLS, 0.15, 0.3, exclude);
      cost = terrain.cost;
      return terrain.walls;
    },
    reset() {
      cost = new Array(ROWS * COLS).fill(1);
    },
    added: m.edits.mudAdded,
    removed: m.edits.mudRemoved,
  };

  const editor = createGridEditor({
    rows: ROWS,
    cols: COLS,
    walls: [],
    start: DEFAULT_START,
    goal: DEFAULT_GOAL,
    trace: (/** @type {GridInput} */ grid) => dijkstraGridTrace({ ...grid, cost }),
    copy: m,
    terrain: mud,
  });
  const player = editor.player;
  const frame = $derived(player.frame);
  const queueSet = $derived(new Set(frame.pq.map(([c]) => c)));
  const settledSet = $derived(new Set(frame.settled));
  const pathSet = $derived(new Set(frame.path));

  /** Both routes on the current grid, independent of playback. Null when the goal is cut off. */
  const routes = $derived.by(() => {
    const grid = {
      rows: ROWS,
      cols: COLS,
      walls: editor.walls,
      start: editor.start,
      goal: editor.goal,
      cost,
    };
    const bfs = bfsGridTrace(grid).at(-1);
    const dijkstra = dijkstraGridTrace(grid).at(-1);
    if (!bfs?.path.length || !dijkstra?.path.length) return null;
    return {
      bfs: m.bfsRoute(bfs.path.length - 1, pathCost(bfs.path, cost)),
      dijkstra: m.dijkstraRoute(dijkstra.path.length - 1, pathCost(dijkstra.path, cost)),
    };
  });

  const narration = $derived(editor.narration(m.describe(frame, COLS)));

  /** @param {number} cell */
  function cellLook(cell) {
    if (cell === editor.start)
      return { cls: 'bg-emerald-700 text-white', label: m.legend.start, mark: 'S' };
    if (cell === editor.goal)
      return { cls: 'bg-rose-600 text-white', label: m.legend.goal, mark: 'G' };
    if (editor.walls.has(cell)) return { cls: 'bg-slate-800', label: m.legend.wall, mark: '' };
    const d = frame.dist[cell];
    const mark = d >= 0 ? String(d) : '';
    // Mud is a hatch over whatever state color the cell has; the label carries its cost.
    const mudCls = cost[cell] === MUD_COST ? ' terrain-mud' : '';
    // The path fill is close in luminance to the settled fill, so it also gets an inset ring.
    if (pathSet.has(cell))
      return {
        cls: 'bg-state-path text-slate-900 ring-2 ring-amber-700 ring-inset' + mudCls,
        label: m.legend.path,
        mark,
      };
    // A stale pop is a leftover entry for a cell that is already settled, not new work.
    if (cell === frame.current && frame.kind === 'stale')
      return {
        cls: 'bg-state-visited text-indigo-900 ring-2 ring-inset ring-slate-700' + mudCls,
        label: m.legend.stale,
        mark,
      };
    if (cell === frame.current)
      return { cls: 'bg-state-active text-white' + mudCls, label: m.legend.current, mark };
    if (queueSet.has(cell)) {
      const ring = cell === frame.touched ? ' ring-2 ring-inset ring-sky-900' : '';
      return {
        cls: 'bg-state-frontier text-slate-900' + ring + mudCls,
        label: m.legend.frontier,
        mark,
      };
    }
    if (settledSet.has(cell))
      return { cls: 'bg-state-visited text-indigo-900' + mudCls, label: m.legend.visited, mark };
    return { cls: 'bg-white text-slate-900' + mudCls, label: '', mark };
  }

  const legend = [
    ['bg-emerald-700', m.legend.start],
    ['bg-rose-600', m.legend.goal],
    ['bg-slate-800', m.legend.wall],
    ['bg-white border border-slate-300 terrain-mud', m.legend.mud],
    ['bg-state-frontier', m.legend.frontier],
    ['bg-state-visited', m.legend.visited],
    ['bg-state-active', m.legend.current],
    ['bg-state-visited ring-2 ring-slate-700 ring-inset', m.legend.stale],
    ['bg-state-path ring-1 ring-amber-700 ring-inset', m.legend.path],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.toolLabel}
      name="tool"
      options={TOOLS.map((tl) => ({ value: tl, label: m.tools[tl] }))}
      bind:value={editor.tool}
      onchange={editor.clearNotice}
    />
    <div class="flex gap-2">
      <button onclick={editor.scatter} class="btn-secondary">{m.randomTerrain}</button>
      <button onclick={editor.clearWalls} class="btn-outline">{m.clearTerrain}</button>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GridBoard
          rows={ROWS}
          cols={COLS}
          cellState={(cell) => {
            const s = cellLook(cell);
            const isWall = editor.walls.has(cell);
            return {
              ...s,
              label: m.cellLabel(
                cell,
                COLS,
                s.label,
                m.mudNote(!isWall && cost[cell] === MUD_COST),
                m.costNote(isWall ? -1 : frame.dist[cell]),
              ),
            };
          }}
          gridLabel={m.gridLabel}
          initialFocus={DEFAULT_START}
          speed={player.speed}
          onPaintStart={editor.onPaintStart}
          onPaint={editor.onPaint}
          onEdit={editor.edit}
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
    </div>

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.settledLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.settled.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.relaxLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.relaxations}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
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
          hot: c === frame.touched && d === frame.dist[c],
        }))}
      />
      <CodePanel lines={dijkstraPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>
</LessonLayout>
