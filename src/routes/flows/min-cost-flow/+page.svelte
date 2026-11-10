<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_COST,
    MAX_N,
    hungarianPseudocode,
    hungarianTrace,
  } from '$lib/algo-engine/min-cost-flow.js';
  import { en as m } from '$lib/lessons/min-cost-flow/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'jobs' | 'trap' | 'five'} Preset */

  /** @type {Record<Preset, number[][]>} */
  const PRESETS = {
    jobs: [
      [9, 2, 7, 8],
      [6, 4, 3, 7],
      [5, 8, 1, 8],
      [7, 6, 9, 4],
    ],
    trap: [
      [1, 2, 9],
      [2, 9, 9],
      [9, 3, 4],
    ],
    five: [
      [12, 9, 27, 10, 23],
      [7, 13, 13, 30, 19],
      [25, 18, 26, 11, 26],
      [9, 28, 26, 23, 13],
      [16, 16, 24, 6, 9],
    ],
  };
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRESETS));
  const SIZES = Array.from({ length: MAX_N - 1 }, (_, i) => i + 2);
  /** Cost given to a cell that appears when the matrix grows. */
  const NEW_COST = 10;

  let preset = $state(/** @type {Preset} */ ('jobs'));
  let costs = $state.raw(PRESETS.jobs);
  let notice = $state({ text: '', at: -1 });

  const n = $derived(costs.length);
  const player = createPlayer(hungarianTrace({ costs: PRESETS.jobs }));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(hungarianTrace({ costs }));
  }

  /** @param {Preset} p */
  function load(p) {
    preset = p;
    costs = PRESETS[p];
    rebuild();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function resize(e) {
    const size = Number(e.currentTarget.value);
    costs = Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => costs[i]?.[j] ?? NEW_COST),
    );
    rebuild();
  }

  /** @param {number} i @param {number} j @param {Event & {currentTarget: HTMLInputElement}} e */
  function setCost(i, j, e) {
    const raw = e.currentTarget.value.trim();
    const x = Number(raw);
    if (raw === '' || !Number.isInteger(x) || x < 0 || x > MAX_COST) {
      e.currentTarget.value = String(costs[i][j]);
      notice = { text: m.badCost(MAX_COST), at: player.index };
      return;
    }
    costs = costs.map((row, r) => (r === i ? row.map((c, k) => (k === j ? x : c)) : row));
    rebuild();
  }

  const treeRows = $derived(new Set(frame.treeRows));
  const treeCols = $derived(new Set(frame.treeCols));
  const flipped = $derived(new Set(frame.path.map(([r, c]) => `${r}-${c}`)));
  const picking = $derived(frame.kind === 'scan' || frame.kind === 'adjust');
  const shifting = $derived(frame.kind === 'adjust');

  /** The table: reduced costs with u in the last column, then the v row and the slack row. */
  const values = $derived([
    ...frame.reduced.map((row, i) => [...row.map(m.show), m.show(frame.u[i])]),
    [...frame.v.map(m.show), null],
    [...frame.slack.map((s) => (s === null ? null : m.show(s))), null],
  ]);
  const rowHeaders = $derived([
    ...Array.from({ length: n }, (_, i) => m.rowName(i)),
    m.potentialV,
    m.slackRow,
  ]);
  const colHeaders = $derived([...Array.from({ length: n }, (_, j) => m.colName(j)), m.potentialU]);

  /** @param {number} r @param {number} c @returns {VisualState} */
  function cellState(r, c) {
    if (r < n && c < n) {
      if (flipped.has(`${r}-${c}`)) return 'path';
      if (picking && c === frame.pick && r === frame.via[frame.pick]) return 'active';
      if (frame.colOf[r] === c) return 'sorted';
      if (frame.kind === 'scan' && r === frame.from && !treeCols.has(c)) return 'compare';
      return '';
    }
    if (r < n && c === n) return treeRows.has(r) ? (shifting ? 'swap' : 'visited') : '';
    if (r === n && c < n) return treeCols.has(c) ? (shifting ? 'swap' : 'visited') : '';
    if (r === n + 1 && c < n && picking && c === frame.pick) return 'active';
    return '';
  }

  /** @param {number} r @param {number} c */
  function cellName(r, c) {
    const s = cellState(r, c);
    const state =
      s === 'path'
        ? m.states.flipped
        : s === 'active'
          ? m.states.picked
          : s === 'sorted'
            ? m.states.assigned
            : s === 'compare'
              ? m.states.read
              : s === 'swap'
                ? m.states.shifted
                : s === 'visited'
                  ? m.states.tree
                  : '';
    const rowLabel = r < n ? m.rowHead(r) : rowHeaders[r];
    const colLabel = c < n ? m.colHead(c) : m.potentialU;
    const value = values[r][c];
    return m.cellLabel(rowLabel, colLabel, value === null ? '—' : String(value), state);
  }

  const legend = [
    ['bg-state-sorted', `★ ${m.legend.assigned}`],
    ['bg-state-path', m.legend.flipped],
    ['bg-state-compare', m.legend.read],
    ['bg-state-active', m.legend.picked],
    ['bg-state-visited', m.legend.tree],
    ['bg-state-swap', m.legend.shifted],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => load(/** @type {Preset} */ (e.currentTarget.value))}
      >
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sizeLabel}
      <select name="size" class="field" value={n} onchange={resize}>
        {#each SIZES as k (k)}
          <option value={k}>{k}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-outline" onclick={() => load(preset)}>{m.resetCosts}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.tableTitle}</h2>
        <DpTable
          {values}
          ariaLabel={m.tableAria}
          {rowHeaders}
          {colHeaders}
          stateOf={cellState}
          markerOf={(r, c) => (r < n && c < n && frame.colOf[r] === c ? '★' : '')}
          labelOf={cellName}
          speed={player.speed}
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

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-3">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cost}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.cost}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.bound}</dt>
          <dd class="text-2xl font-bold tabular-nums">{m.show(frame.bound)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.rows}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.colOf.filter((c) => c >= 0).length} / {n}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.reads}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.reads}</dd>
        </div>
      </dl>
      <CodePanel lines={hungarianPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div
      class="min-w-0 rounded-xl border border-slate-200 bg-white p-3 lg:col-start-1 lg:row-start-3"
    >
      <h2 class="mb-2 text-xs text-slate-500">{m.costsTitle}</h2>
      <div class="overflow-x-auto">
        <table class="text-sm">
          <thead>
            <tr>
              <th></th>
              {#each costs as _, j (j)}
                <th scope="col" class="px-1 text-center font-mono text-slate-600">{m.colName(j)}</th
                >
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each costs as row, i (i)}
              <tr>
                <th scope="row" class="pr-2 font-mono text-slate-600">{m.rowName(i)}</th>
                {#each row as cost, j (j)}
                  <td class="p-0.5">
                    <input
                      type="number"
                      min="0"
                      max={MAX_COST}
                      step="1"
                      class="field w-16"
                      aria-label={m.costAria(m.rowName(i), m.colName(j))}
                      value={cost}
                      onchange={(e) => setCost(i, j, e)}
                    />
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
