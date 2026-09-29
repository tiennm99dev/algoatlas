<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GridBoard from '$lib/components/grid-board.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { dfsGridTrace, dfsPseudocode } from '$lib/algo-engine/dfs-grid.js';
  import { bfsGridTrace, randomWalls } from '$lib/algo-engine/graph.js';
  import { en as m } from '$lib/lessons/dfs-grid/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {keyof typeof m.tools} Tool */
  const TOOLS = /** @type {Tool[]} */ (Object.keys(m.tools));
  const ROWS = 10;
  const COLS = 16;
  const at = (/** @type {number} */ r, /** @type {number} */ c) => r * COLS + c;

  // Two offset barriers, fixed so the prerendered HTML matches the hydrated page.
  const DEFAULT_WALLS = [
    ...Array.from({ length: 7 }, (_, r) => at(r, 6)),
    ...Array.from({ length: 7 }, (_, r) => at(r + 3, 10)),
  ];

  const DEFAULT_START = at(4, 2);
  const DEFAULT_GOAL = at(5, 13);

  let walls = $state.raw(new Set(DEFAULT_WALLS));
  let start = $state(DEFAULT_START);
  let goal = $state(DEFAULT_GOAL);
  let tool = $state(/** @type {Tool} */ ('wall'));

  const player = createPlayer(
    dfsGridTrace({
      rows: ROWS,
      cols: COLS,
      walls: new Set(DEFAULT_WALLS),
      start: DEFAULT_START,
      goal: DEFAULT_GOAL,
    }),
  );
  const frame = $derived(player.frame);
  const stackSet = $derived(new Set(frame.stack));
  const pathSet = $derived(new Set(frame.path));
  // Depends on the grid only, never on the current frame, so stepping does not recompute it.
  const bfsSteps = $derived.by(() => {
    const last = bfsGridTrace({ rows: ROWS, cols: COLS, walls, start, goal }).at(-1);
    return last && last.path.length ? last.path.length - 1 : null;
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
    player.load(dfsGridTrace({ rows: ROWS, cols: COLS, walls, start, goal }));
  }

  /** @param {number} cell @param {boolean} on */
  function setWall(cell, on) {
    if (cell === start || cell === goal || walls.has(cell) === on) return;
    // A fresh copy assigned to $state.raw below; it is never mutated after that.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const next = new Set(walls);
    if (on) next.add(cell);
    else next.delete(cell);
    walls = next;
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
    if (tool === 'start') start = cell;
    else goal = cell;
    rebuild();
    say(tool === 'start' ? m.edits.startMoved(here) : m.edits.goalMoved(here));
  }

  function scatter() {
    walls = randomWalls(ROWS, COLS, 0.28, [start, goal]);
    rebuild();
  }

  function clearWalls() {
    walls = new Set();
    rebuild();
  }

  /** @param {number} cell */
  function cellLook(cell) {
    if (cell === start)
      return { cls: 'bg-emerald-700 text-white', label: m.legend.start, mark: 'S' };
    if (cell === goal) return { cls: 'bg-rose-600 text-white', label: m.legend.goal, mark: 'G' };
    if (walls.has(cell)) return { cls: 'bg-slate-800', label: m.legend.wall, mark: '' };
    const d = frame.order[cell];
    const mark = d >= 1 ? String(d) : '';
    // The path fill is close in luminance to the visited fill, so it also gets an inset ring.
    if (pathSet.has(cell))
      return {
        cls: 'bg-state-path text-slate-900 ring-2 ring-amber-700 ring-inset',
        label: m.legend.path,
        mark,
      };
    if (cell === frame.current)
      return { cls: 'bg-state-active text-white', label: m.legend.current, mark };
    if (stackSet.has(cell)) {
      const ring = cell === frame.touched ? ' ring-2 ring-inset ring-sky-900' : '';
      return { cls: 'bg-state-frontier text-slate-900' + ring, label: m.legend.frontier, mark };
    }
    if (d >= 1) return { cls: 'bg-state-visited text-indigo-900', label: m.legend.visited, mark };
    return { cls: 'bg-white', label: '', mark: '' };
  }

  const legend = [
    ['bg-emerald-700', m.legend.start],
    ['bg-rose-600', m.legend.goal],
    ['bg-slate-800', m.legend.wall],
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
      <button onclick={scatter} class="btn-secondary">{m.randomMaze}</button>
      <button onclick={clearWalls} class="btn-outline">{m.clearWalls}</button>
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
            return {
              ...s,
              label: m.cellLabel(cell, COLS, s.label, walls.has(cell) ? -1 : frame.order[cell]),
            };
          }}
          gridLabel={m.gridLabel}
          initialFocus={DEFAULT_START}
          speed={player.speed}
          onPaintStart={(cell) => {
            if (tool !== 'wall') {
              edit(cell);
              return null;
            }
            const on = !walls.has(cell);
            setWall(cell, on);
            return on;
          }}
          onPaint={setWall}
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
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.visitedLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.visited}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.pathLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.path.length ? frame.path.length - 1 : '—'}
          </dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.bfsLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">{bfsSteps ?? '—'}</dd>
        </div>
      </dl>
      <ChipList
        title={m.stackLabel}
        emptyText={m.stackEmpty}
        items={frame.stack
          .toReversed()
          .map((c) => ({ label: m.coord(c, COLS), hot: c === frame.touched }))}
      />
      <CodePanel lines={dfsPseudocode} active={frame.lines} />
    </div>
  </div>
</LessonLayout>
