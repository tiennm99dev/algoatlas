<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GridBoard from '$lib/components/grid-board.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    HEURISTICS,
    aStarPseudocode,
    aStarTrace,
    compareHeuristics,
    heuristic,
  } from '$lib/algo-engine/a-star.js';
  import { en as m } from '$lib/lessons/a-star/copy.en.js';
  import { createGridEditor } from '$lib/player/grid-editor.svelte.js';

  /** @typedef {import('$lib/player/grid-editor.svelte.js').GridInput} GridInput */
  /** @typedef {import('$lib/algo-engine/a-star.js').Heuristic} Heuristic */
  /** @typedef {keyof typeof m.numbers} NumberKind */

  const TOOLS = /** @type {(keyof typeof m.tools)[]} */ (Object.keys(m.tools));
  const NUMBER_KINDS = /** @type {NumberKind[]} */ (Object.keys(m.numbers));
  const ROWS = 10;
  const COLS = 16;
  const at = (/** @type {number} */ r, /** @type {number} */ c) => r * COLS + c;

  const DEFAULT_START = at(4, 2);
  const DEFAULT_GOAL = at(4, 13);
  // A bar along row 3 and a wall down column 9 make a pocket that points at the goal; fixed so
  // the prerendered HTML matches the hydrated page.
  const DEFAULT_WALLS = [
    ...[3, 4, 5, 6, 7, 8, 9].map((c) => at(3, c)),
    ...[4, 5, 6, 7, 8].map((r) => at(r, 9)),
  ];

  let kind = $state(/** @type {Heuristic} */ ('manhattan'));
  let numbers = $state(/** @type {NumberKind} */ ('f'));

  const editor = createGridEditor({
    rows: ROWS,
    cols: COLS,
    walls: DEFAULT_WALLS,
    start: DEFAULT_START,
    goal: DEFAULT_GOAL,
    trace: (/** @type {GridInput} */ grid) => aStarTrace({ ...grid, heuristic: kind }),
    copy: m,
  });
  const player = editor.player;
  const frame = $derived(player.frame);
  const openSet = $derived(new Set(frame.open.map(([c]) => c)));
  const closedSet = $derived(new Set(frame.closed));
  const pathSet = $derived(new Set(frame.path));
  /** @param {number} cell */
  const h = (cell) => heuristic(kind, cell, editor.goal, COLS);

  // Depends on the grid only, never on the current frame, so stepping does not recompute it.
  const compare = $derived(
    compareHeuristics({
      rows: ROWS,
      cols: COLS,
      walls: editor.walls,
      start: editor.start,
      goal: editor.goal,
    }),
  );

  const narration = $derived(editor.narration(m.describe(frame, COLS, kind, h)));

  function rerun() {
    editor.clearNotice();
    player.load(
      aStarTrace({
        rows: ROWS,
        cols: COLS,
        walls: editor.walls,
        start: editor.start,
        goal: editor.goal,
        heuristic: kind,
      }),
    );
  }

  /** @param {number} cell */
  function numberAt(cell) {
    if (editor.walls.has(cell)) return null;
    if (numbers === 'h') return h(cell);
    const g = frame.g[cell];
    if (g < 0) return null;
    return numbers === 'g' ? g : g + h(cell);
  }

  /** @param {number} cell */
  function cellLook(cell) {
    const n = numberAt(cell);
    const mark = n === null ? '' : String(n);
    if (cell === editor.start)
      return { cls: 'bg-emerald-700 text-white', label: m.legend.start, mark: 'S' };
    if (cell === editor.goal)
      return { cls: 'bg-rose-600 text-white', label: m.legend.goal, mark: 'G' };
    if (editor.walls.has(cell)) return { cls: 'bg-slate-800', label: m.legend.wall, mark: '' };
    // The path fill is close in luminance to the closed fill, so it also gets an inset ring.
    if (pathSet.has(cell))
      return {
        cls: 'bg-state-path text-slate-900 ring-2 ring-amber-700 ring-inset',
        label: m.legend.path,
        mark,
      };
    if (cell === frame.current && frame.kind !== 'stale')
      return { cls: 'bg-state-active text-white', label: m.legend.current, mark };
    if (closedSet.has(cell))
      return { cls: 'bg-state-visited text-indigo-900', label: m.legend.closed, mark };
    if (openSet.has(cell)) {
      const ring = cell === frame.touched ? ' ring-2 ring-inset ring-sky-900' : '';
      return { cls: 'bg-state-frontier text-slate-900' + ring, label: m.legend.frontier, mark };
    }
    return { cls: 'bg-white text-slate-500', label: '', mark };
  }

  const legend = [
    ['bg-emerald-700', m.legend.start],
    ['bg-rose-600', m.legend.goal],
    ['bg-slate-800', m.legend.wall],
    ['bg-state-frontier', m.legend.frontier],
    ['bg-state-visited', m.legend.closed],
    ['bg-state-active', m.legend.current],
    ['bg-state-path ring-1 ring-amber-700 ring-inset', m.legend.path],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.heuristicLabel}
      name="heuristic"
      options={HEURISTICS.map((k) => ({ value: k, label: m.heuristics[k] }))}
      bind:value={kind}
      onchange={rerun}
    />
    <SegmentedControl
      legend={m.numbersLabel}
      name="numbers"
      options={NUMBER_KINDS.map((k) => ({ value: k, label: m.numbers[k] }))}
      bind:value={numbers}
    />
    <SegmentedControl
      legend={m.toolLabel}
      name="tool"
      options={TOOLS.map((tl) => ({ value: tl, label: m.tools[tl] }))}
      bind:value={editor.tool}
      onchange={editor.clearNotice}
    />
    <div class="flex gap-2">
      <button type="button" onclick={editor.clearWalls} class="btn-outline">{m.clearWalls}</button>
      <button type="button" onclick={editor.reset} class="btn-outline">{m.resetGrid}</button>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GridBoard
          rows={ROWS}
          cols={COLS}
          cellState={(cell) => {
            const s = cellLook(cell);
            return {
              ...s,
              label: m.cellLabel(cell, COLS, s.label, m.numberNote(numbers, numberAt(cell))),
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
          <dt class="text-xs text-slate-500">{m.stats.expanded}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.closed.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pushes}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.pushes}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.path}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.path.length ? frame.path.length - 1 : '—'}
          </dd>
        </div>
      </dl>

      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <table class="w-full text-sm tabular-nums">
          <thead>
            <tr class="text-left text-xs text-slate-500">
              {#each m.compareHead as head, i (i)}
                <th scope="col" class="py-1 font-semibold {i ? 'text-right' : ''}">{head}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each HEURISTICS as k (k)}
              <tr class="border-t border-slate-100 {k === kind ? 'bg-teal-50' : ''}">
                <th scope="row" class="py-1 text-left font-normal">{m.heuristics[k]}</th>
                <td class="text-right font-semibold">{compare[k].expanded}</td>
                <td class="text-right font-semibold">{compare[k].steps ?? m.noPath}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <ChipList
        title={m.openLabel}
        emptyText={m.openEmpty}
        hotLabel={m.hotLabel}
        items={frame.open.map(([c, g, hc]) => ({
          label: m.openChip(m.coord(c, COLS), g, hc, closedSet.has(c) || g > frame.g[c]),
          hot: frame.kind === 'push' && c === frame.touched && g === frame.g[c],
        }))}
      />
      <CodePanel lines={aStarPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
