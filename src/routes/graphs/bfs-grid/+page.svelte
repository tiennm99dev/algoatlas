<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { bfsGridTrace, bfsPseudocode, randomWalls } from '$lib/algo-engine/graph.js';
  import { en as m } from '$lib/lessons/bfs-grid/copy.en.js';
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
  let focusIndex = $state(DEFAULT_START);
  /** @type {HTMLButtonElement[]} */
  const cellRefs = [];

  const player = createPlayer(
    bfsGridTrace({ rows: ROWS, cols: COLS, walls: new Set(DEFAULT_WALLS), start: DEFAULT_START, goal: DEFAULT_GOAL }),
  );
  const frame = $derived(player.frame);
  const queueSet = $derived(new Set(frame.queue));
  const pathSet = $derived(new Set(frame.path));
  const visitedCount = $derived(frame.dist.filter((d) => d >= 0).length);

  /** Shown in place of the narration when an edit is refused. */
  let notice = $state('');

  function rebuild() {
    notice = '';
    player.load(bfsGridTrace({ rows: ROWS, cols: COLS, walls, start, goal }));
  }

  /** Whether a drag is painting walls on (true) or erasing them (false). */
  let painting = /** @type {boolean | null} */ (null);

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

  /** @param {number} cell */
  function edit(cell) {
    if (tool === 'wall') {
      setWall(cell, !walls.has(cell));
      return;
    }
    if (walls.has(cell) || cell === start || cell === goal) {
      notice = m.blockedCell;
      return;
    }
    if (tool === 'start') start = cell;
    else goal = cell;
    rebuild();
  }

  /** @param {PointerEvent} e */
  function cellFromPoint(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-cell]');
    return el ? Number(/** @type {HTMLElement} */ (el).dataset.cell) : -1;
  }

  /** @param {PointerEvent} e */
  function onPointerDown(e) {
    if (e.button !== 0) return;
    const cell = cellFromPoint(e);
    if (cell < 0) return;
    e.preventDefault();
    if (tool === 'wall') {
      painting = !walls.has(cell);
      setWall(cell, painting);
    } else {
      edit(cell);
    }
  }

  /** @param {PointerEvent} e */
  function onPointerMove(e) {
    if (painting === null) return;
    // A release outside the window never reaches pointerup; stop once no button is held.
    if ((e.buttons & 1) === 0) {
      painting = null;
      return;
    }
    const cell = cellFromPoint(e);
    if (cell >= 0) setWall(cell, painting);
  }

  /** @param {KeyboardEvent} e @param {number} cell */
  function onCellKeydown(e, cell) {
    const r = Math.floor(cell / COLS);
    const c = cell % COLS;
    /** @type {Record<string, number>} */
    const moves = {
      ArrowUp: r > 0 ? cell - COLS : cell,
      ArrowDown: r < ROWS - 1 ? cell + COLS : cell,
      ArrowLeft: c > 0 ? cell - 1 : cell,
      ArrowRight: c < COLS - 1 ? cell + 1 : cell,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    focusIndex = moves[e.key];
    cellRefs[focusIndex]?.focus();
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
  function cellState(cell) {
    if (cell === start) return { cls: 'bg-emerald-700 text-white', label: m.legend.start, mark: 'S' };
    if (cell === goal) return { cls: 'bg-rose-600 text-white', label: m.legend.goal, mark: 'G' };
    if (walls.has(cell)) return { cls: 'bg-slate-800', label: m.legend.wall, mark: '' };
    const d = frame.dist[cell];
    const mark = d >= 0 ? String(d) : '';
    if (pathSet.has(cell)) return { cls: 'bg-state-path text-slate-900', label: m.legend.path, mark };
    if (cell === frame.current) return { cls: 'bg-state-active text-white', label: m.legend.current, mark };
    if (queueSet.has(cell)) {
      const ring = cell === frame.touched ? ' ring-2 ring-inset ring-sky-700' : '';
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
    ['bg-state-path', m.legend.path],
  ];
</script>

<svelte:window onpointerup={() => (painting = null)} onpointercancel={() => (painting = null)} />

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.toolLabel}
      name="tool"
      options={TOOLS.map((tl) => ({ value: tl, label: m.tools[tl] }))}
      bind:value={tool}
    />
    <div class="flex gap-2">
      <button onclick={scatter} class="btn-secondary">{m.randomMaze}</button>
      <button onclick={clearWalls} class="btn-outline">{m.clearWalls}</button>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <div
          role="grid"
          tabindex="-1"
          aria-label={m.gridLabel}
          class="grid touch-none gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 select-none"
          style="grid-template-columns: 1.5rem repeat({COLS}, minmax(0, 1fr));"
          onpointerdown={onPointerDown}
          onpointermove={onPointerMove}
        >
          <!-- Axis numbers let the (row,col) narration be read off the grid; screen readers get coordinates from cell labels instead. -->
          <div role="row" class="contents">
            <span class="bg-white" aria-hidden="true"></span>
            {#each { length: COLS } as _, c (c)}
              <span class="bg-white text-center text-[10px] leading-5 text-slate-500 tabular-nums" aria-hidden="true">{c}</span>
            {/each}
          </div>
          {#each { length: ROWS } as _, r (r)}
            <div role="row" class="contents">
              <span class="flex items-center justify-center bg-white text-[10px] text-slate-500 tabular-nums" aria-hidden="true">{r}</span>
              {#each { length: COLS } as _, c (c)}
                {@const cell = at(r, c)}
                {@const s = cellState(cell)}
                <div role="gridcell" class="flex">
                  <button
                    data-cell={cell}
                    bind:this={cellRefs[cell]}
                    tabindex={cell === focusIndex ? 0 : -1}
                    aria-label={m.cellLabel(cell, COLS, s.label, walls.has(cell) ? -1 : frame.dist[cell])}
                    class="flex aspect-square w-full items-center justify-center text-xs font-semibold tabular-nums transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset {s.cls}"
                    onclick={(e) => e.detail === 0 && edit(cell)}
                    onfocus={() => (focusIndex = cell)}
                    onkeydown={(e) => onCellKeydown(e, cell)}
                  >{s.mark}</button>
                </div>
              {/each}
            </div>
          {/each}
        </div>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [cls, label] (label)}
            <li class="flex items-center gap-1.5"><span class="size-3 rounded-sm {cls}"></span>{label}</li>
          {/each}
        </ul>
      </div>

      <p class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800" aria-live={player.playing ? 'off' : 'polite'}>
        {notice || m.describe(frame, COLS)}
      </p>

      <StepControls {player} />
    </div>

    <div class="flex flex-col gap-4">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.visitedLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">{visitedCount}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.pathLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.path.length ? frame.path.length - 1 : '—'}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.queueLabel}</h2>
        <ol class="flex flex-wrap gap-1 font-mono text-xs">
          {#each frame.queue.slice(0, 18) as cell (cell)}
            <li class="rounded px-1.5 py-0.5 {cell === frame.touched ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-900'}">{m.coord(cell, COLS)}</li>
          {:else}
            <li class="text-slate-500">{m.queueEmpty}</li>
          {/each}
          {#if frame.queue.length > 18}<li class="text-slate-500">+{frame.queue.length - 18}</li>{/if}
        </ol>
      </div>
      <CodePanel lines={bfsPseudocode} active={frame.lines} />
    </div>
  </div>
</LessonLayout>
