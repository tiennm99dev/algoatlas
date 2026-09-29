<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GridBoard from '$lib/components/grid-board.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { bfsGridTrace, bfsPseudocode } from '$lib/algo-engine/graph.js';
  import { en as m } from '$lib/lessons/bfs-grid/copy.en.js';
  import { createGridEditor } from '$lib/player/grid-editor.svelte.js';

  const TOOLS = /** @type {(keyof typeof m.tools)[]} */ (Object.keys(m.tools));
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

  const editor = createGridEditor({
    rows: ROWS,
    cols: COLS,
    walls: DEFAULT_WALLS,
    start: DEFAULT_START,
    goal: DEFAULT_GOAL,
    trace: bfsGridTrace,
    copy: m,
  });
  const player = editor.player;
  const frame = $derived(player.frame);
  const queueSet = $derived(new Set(frame.queue));
  const pathSet = $derived(new Set(frame.path));
  const discoveredCount = $derived(frame.dist.filter((d) => d >= 0).length);

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
    // The path fill is close in luminance to the visited fill, so it also gets an inset ring.
    if (pathSet.has(cell))
      return {
        cls: 'bg-state-path text-slate-900 ring-2 ring-amber-700 ring-inset',
        label: m.legend.path,
        mark,
      };
    if (cell === frame.current)
      return { cls: 'bg-state-active text-white', label: m.legend.current, mark };
    if (queueSet.has(cell)) {
      const ring = cell === frame.touched ? ' ring-2 ring-inset ring-sky-900' : '';
      return { cls: 'bg-state-frontier text-slate-900' + ring, label: m.legend.frontier, mark };
    }
    if (d >= 0) return { cls: 'bg-state-visited text-indigo-900', label: m.legend.visited, mark };
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
      bind:value={editor.tool}
      onchange={editor.clearNotice}
    />
    <div class="flex gap-2">
      <button onclick={editor.scatter} class="btn-secondary">{m.randomMaze}</button>
      <button onclick={editor.clearWalls} class="btn-outline">{m.clearWalls}</button>
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
            const d = editor.walls.has(cell) ? -1 : frame.dist[cell];
            return { ...s, label: m.cellLabel(cell, COLS, s.label, m.distanceNote(d)) };
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

      <div class="sticky bottom-2 z-10 lg:static">
        <StepControls {player} />
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.discoveredLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">{discoveredCount}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.pathLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.path.length ? frame.path.length - 1 : '—'}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.queueLabel}
        emptyText={m.queueEmpty}
        items={frame.queue.map((c) => ({ label: m.coord(c, COLS), hot: c === frame.touched }))}
      />
      <CodePanel lines={bfsPseudocode} active={frame.lines} />
    </div>
  </div>
</LessonLayout>
