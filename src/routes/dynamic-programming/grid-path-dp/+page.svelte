<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    GRID_PRESETS,
    MAX_SIDE,
    WALL,
    cycleCost,
    greedyCost,
    gridPseudocode,
    gridTrace,
    openPaths,
    parseSide,
    resizeGrid,
    toggleWall,
  } from '$lib/algo-engine/grid-path-dp.js';
  import { en as m } from '$lib/lessons/grid-path-dp/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/grid-path-dp.js').GridMode} GridMode */
  /** @typedef {import('$lib/algo-engine/grid-path-dp.js').GridMove} GridMove */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'current'|'read'|'kept'|'path'|'answer'|''} Role */
  /** @typedef {'wall'|'cost'} Tool */

  const MODES = /** @type {GridMode[]} */ (['count', 'min']);
  const TOOLS = /** @type {Tool[]} */ (['wall', 'cost']);
  const FIRST = GRID_PRESETS[0];
  /** @type {Record<GridMove, [number, number]>} */
  const STEP = { up: [-1, 0], left: [0, -1] };

  let mode = $state(/** @type {GridMode} */ ('count'));
  let tool = $state(/** @type {Tool} */ ('wall'));
  let grid = $state(FIRST.grid);
  let base = $state(FIRST.key);
  let preset = $state(FIRST.key);
  let rowsText = $state(String(FIRST.grid.length));
  let colsText = $state(String(FIRST.grid[0].length));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(gridTrace('count', FIRST.grid));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const rows = $derived(frame.grid.length);
  const cols = $derived(frame.grid[0].length);

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(gridTrace(mode, $state.snapshot(grid)));
  }

  /** Rebuild and show the finished table, so an edit shows its effect at once. */
  function rebuildToEnd() {
    rebuild();
    player.seek(player.frames.length - 1);
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = GRID_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    base = p.key;
    grid = p.grid;
    rowsText = String(p.grid.length);
    colsText = String(p.grid[0].length);
    rebuild();
  }

  function commitSize() {
    const r = parseSide(rowsText);
    const c = parseSide(colsText);
    if (r === null || c === null) {
      rowsText = String(grid.length);
      colsText = String(grid[0].length);
      notice = { text: m.sideError(MAX_SIDE), at: player.index };
      return;
    }
    rowsText = String(r);
    colsText = String(c);
    if (r === grid.length && c === grid[0].length) return;
    grid = resizeGrid(grid, r, c);
    preset = '';
    rebuild();
  }

  /** @param {number} r @param {number} c */
  function editCell(r, c) {
    grid = mode === 'min' && tool === 'cost' ? cycleCost(grid, r, c) : toggleWall(grid, r, c);
    preset = '';
    rebuildToEnd();
  }

  /** @param {number} r @param {number} c */
  function seekCell(r, c) {
    const at = player.frames.findIndex(
      (f) =>
        (f.kind === 'fill' || f.kind === 'wall' || f.kind === 'first') && f.r === r && f.c === c,
    );
    if (at < 0) return;
    player.pause();
    player.seek(at);
  }

  const filling = $derived(frame.kind === 'fill');
  const pathSet = $derived(new Set(frame.path.map(([r, c]) => `${r}-${c}`)));

  /** @param {GridMove} mv @returns {[number, number]} */
  const from = (mv) => [frame.r + STEP[mv][0], frame.c + STEP[mv][1]];

  /** @param {number} r @param {number} c @returns {Role} */
  function roleOf(r, c) {
    if (frame.kind === 'done' && r === rows - 1 && c === cols - 1) return 'answer';
    if (pathSet.has(`${r}-${c}`)) return 'path';
    if (frame.r === r && frame.c === c && frame.kind !== 'trace') return 'current';
    if (!filling) return '';
    for (const o of frame.options) {
      const [y, x] = from(o.move);
      if (y === r && x === c) return frame.move === o.move ? 'kept' : 'read';
    }
    return '';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'active',
    read: 'compare',
    kept: 'compare',
    path: 'path',
    answer: 'sorted',
    '': '',
  };

  /** @type {{from: [number, number], to: [number, number]}[]} */
  const arrows = $derived.by(() => {
    if (filling) return frame.options.map((o) => ({ from: from(o.move), to: [frame.r, frame.c] }));
    if (frame.kind === 'trace' && frame.move) {
      return [{ from: [frame.r, frame.c], to: from(frame.move) }];
    }
    return [];
  });

  const counting = $derived(frame.mode === 'count');

  const gridValues = $derived(
    frame.grid.map((row) => row.map((v) => (v === WALL ? m.wallText : counting ? m.openText : v))),
  );
  const tableValues = $derived(
    frame.table.map((row, r) =>
      row.map((v, c) => (v === null ? null : frame.grid[r][c] === WALL ? m.wallText : m.value(v))),
    ),
  );

  /** @param {number} r @param {number} c */
  const stateLabel = (r, c) => {
    const role = roleOf(r, c);
    return role ? m.cellStates[role] : '';
  };

  /** @param {number} r @param {number} c */
  function gridMark(r, c) {
    if (r === 0 && c === 0) return m.startMark;
    return r === rows - 1 && c === cols - 1 ? m.goalMark : '';
  }

  const headers = (/** @type {number} */ n) => Array.from({ length: n }, (_, k) => String(k));

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', `${m.markers.current} ${m.legend.current}`],
    ['compare', `${m.markers.read} ${m.legend.read}, ${m.markers.kept} ${m.legend.kept}`],
    ['path', `${m.markers.path} ${m.legend.path}`],
    ['sorted', `${m.markers.answer} ${m.legend.answer}`],
  ]);

  const greedy = $derived(greedyCost(frame.grid));
  const total = $derived(rows * cols);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitSize();
    }}
  >
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={MODES.map((v) => ({ value: v, label: m.modes[v] }))}
      bind:value={mode}
      onchange={rebuild}
    />
    {#if mode === 'min'}
      <SegmentedControl
        legend={m.toolLabel}
        name="tool"
        options={TOOLS.map((v) => ({ value: v, label: m.tools[v] }))}
        bind:value={tool}
      />
    {/if}
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.rowsLabel}
      <input
        type="text"
        inputmode="numeric"
        name="rows"
        class="field w-16 font-mono"
        bind:value={rowsText}
        onchange={commitSize}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.colsLabel}
      <input
        type="text"
        inputmode="numeric"
        name="cols"
        class="field w-16 font-mono"
        bind:value={colsText}
        onchange={commitSize}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each GRID_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-secondary" onclick={() => loadPreset(base)}
      >{m.resetGrid}</button
    >
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div
        class="grid min-w-0 gap-4 rounded-xl border border-slate-200 bg-white p-4 xl:grid-cols-2"
      >
        <div class="min-w-0">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.gridTitle}
          </h2>
          <DpTable
            values={gridValues}
            ariaLabel={m.gridAria(rows, cols)}
            rowHeaders={headers(rows)}
            colHeaders={headers(cols)}
            stateOf={(r, c) => ROLE_STATE[roleOf(r, c)]}
            markerOf={gridMark}
            labelOf={(r, c) => m.gridCell(r, c, frame.grid[r][c], frame.mode, stateLabel(r, c))}
            onselect={editCell}
            speed={player.speed}
          />
          <p class="mt-2 text-xs text-slate-600">{m.gridNote(frame.mode)}</p>
        </div>
        <div class="min-w-0">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.tableTitle[frame.mode]}
          </h2>
          <DpTable
            values={tableValues}
            ariaLabel={m.tableAria(frame.mode, rows, cols)}
            rowHeaders={headers(rows)}
            colHeaders={headers(cols)}
            stateOf={(r, c) => ROLE_STATE[roleOf(r, c)]}
            markerOf={(r, c) => {
              const role = roleOf(r, c);
              return role ? m.markers[role] : '';
            }}
            labelOf={(r, c) => {
              const v = tableValues[r][c];
              return m.tableCell(r, c, v === null ? '' : String(v), stateLabel(r, c));
            }}
            {arrows}
            onselect={seekCell}
            speed={player.speed}
          />
          <p class="mt-2 text-xs text-slate-600">{m.tableNote(frame.mode)}</p>
        </div>
        <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 xl:col-span-2">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
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

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.filled}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="filled">
            {frame.filled} / {total}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer[frame.mode]}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="answer">
            {frame.result === null ? m.pending : m.value(frame.result)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3 {counting ? 'col-span-2' : ''}">
          <dt class="text-xs text-slate-500">{m.stats.open}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="open">
            {openPaths(rows, cols)}
          </dd>
        </div>
        {#if !counting}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.greedy}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="greedy">
              {greedy === null ? m.stuck : greedy}
            </dd>
          </div>
        {/if}
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.sumsTitle}</h2>
        <p class="font-mono text-sm text-slate-800" data-testid="sums">
          {m.sums(frame) || m.sumsEmpty}
        </p>
      </div>
      {#if !counting}
        <ChipList
          title={m.pathTitle}
          emptyText={m.pathEmpty}
          limit={MAX_SIDE * 2}
          items={frame.path
            .slice()
            .reverse()
            .map(([r, c]) => ({ label: m.pathChip(r, c) }))}
        />
      {/if}
      <CodePanel lines={gridPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
