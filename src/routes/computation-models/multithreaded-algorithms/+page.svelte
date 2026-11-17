<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG, STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';
  import {
    MAX_FIB,
    MAX_P,
    MAX_SORT,
    MIN_FIB,
    MIN_SORT,
    buildDag,
    programPseudocode,
    scheduleTime,
    scheduleTrace,
  } from '$lib/algo-engine/multithreaded-algorithms.js';
  import { en as m } from '$lib/lessons/multithreaded-algorithms/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/multithreaded-algorithms.js').Program} Program */
  /** @typedef {import('$lib/algo-engine/multithreaded-algorithms.js').StrandState} StrandState */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // Fixed defaults keep the prerendered HTML and the hydrated page identical.
  const DEFAULTS = { program: /** @type {Program} */ ('fib'), fib: 5, sort: 8, p: 2 };
  const PROGRAM_OPTIONS = /** @type {Program[]} */ (['fib', 'mergesort']).map((value) => ({
    value,
    label: m.programs[value],
  }));
  const COL = 44;
  const ROW = 50;
  const PAD = 26;
  const R = 15;

  let program = $state(DEFAULTS.program);
  let fibN = $state(DEFAULTS.fib);
  let sortN = $state(DEFAULTS.sort);
  let p = $state(DEFAULTS.p);
  let showCritical = $state(true);

  const n = $derived(program === 'fib' ? fibN : sortN);
  const INITIAL_DAG = buildDag(DEFAULTS.program, DEFAULTS.fib);
  let dag = $state.raw(INITIAL_DAG);
  const player = createPlayer(scheduleTrace(INITIAL_DAG, DEFAULTS.p));
  const frame = $derived(player.frame);
  const final = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(m.describe(frame, dag));
  const criticalSet = $derived(new Set(dag.critical));
  const speedups = $derived(
    Array.from({ length: MAX_P }, (_, i) => ({ p: i + 1, t: scheduleTime(dag, i + 1) })),
  );

  const width = $derived(Math.max(dag.cols * COL + 2 * PAD, 160));
  const height = $derived(dag.rows * ROW + 2 * PAD - ROW + 2 * R);
  /** @param {number} x */
  const px = (x) => PAD + x * COL + COL / 2 + (width - dag.cols * COL - 2 * PAD) / 2;
  /** @param {number} y */
  const py = (y) => PAD + R + y * ROW;

  function rebuild() {
    dag = buildDag(program, n);
    player.load(scheduleTrace(dag, p));
  }

  /** @param {StrandState} s @returns {VisualState} */
  function visual(s) {
    if (s === 'running') return 'active';
    if (s === 'ready') return 'frontier';
    if (s === 'done') return 'visited';
    return '';
  }

  /** @param {number} id */
  function marker(id) {
    const s = frame.states[id];
    if (s === 'running') return m.procMarker(frame.proc[id]);
    if (s === 'ready') return m.markers.ready;
    if (s === 'done') return m.markers.done;
    return '';
  }

  /** @param {number} a @param {number} b */
  const criticalEdge = (a, b) => {
    const i = dag.critical.indexOf(a);
    return showCritical && i >= 0 && dag.critical[i + 1] === b;
  };

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

{#snippet stat(/** @type {string} */ label, /** @type {string | number} */ value)}
  <div class="rounded-xl border border-slate-200 bg-white p-3">
    <dt class="text-xs text-slate-500">{label}</dt>
    <dd class="text-2xl font-bold tabular-nums">{value}</dd>
  </div>
{/snippet}

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.programLabel}
      name="program"
      options={PROGRAM_OPTIONS}
      bind:value={program}
      onchange={rebuild}
    />
    {#if program === 'fib'}
      <label class={labelClass}>
        {m.sizeLabel('fib')}: {fibN}
        <input
          type="range"
          name="size"
          min={MIN_FIB}
          max={MAX_FIB}
          bind:value={fibN}
          onchange={rebuild}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
    {:else}
      <label class={labelClass}>
        {m.sizeLabel('mergesort')}: {sortN}
        <input
          type="range"
          name="size"
          min={MIN_SORT}
          max={MAX_SORT}
          bind:value={sortN}
          onchange={rebuild}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
    {/if}
    <label class={labelClass}>
      {m.processorsLabel}: {p}
      <input
        type="range"
        name="processors"
        min="1"
        max={MAX_P}
        bind:value={p}
        onchange={rebuild}
        class="focus-ring rounded accent-teal-700"
      />
    </label>
    <label class="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        name="critical"
        bind:checked={showCritical}
        class="focus-ring size-4 rounded accent-teal-700"
      />
      {m.criticalLabel}
    </label>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.dagTitle}
        </h2>
        <div class="overflow-x-auto">
          <svg
            {width}
            {height}
            viewBox="0 0 {width} {height}"
            role="img"
            aria-label={m.dagAria(dag)}
            class="mx-auto block"
          >
            {#each dag.strands as s (s.id)}
              {#each s.preds as q (q)}
                {@const from = dag.strands[q]}
                {@const hot = criticalEdge(q, s.id)}
                <line
                  x1={px(from.x)}
                  y1={py(from.y) + R}
                  x2={px(s.x)}
                  y2={py(s.y) - R}
                  class={hot ? 'stroke-state-path' : 'stroke-slate-300'}
                  stroke-width={hot ? 4 : 1.5}
                />
              {/each}
            {/each}
            {#each dag.strands as s (s.id)}
              {@const st = visual(frame.states[s.id])}
              <g>
                <title
                  >{m.strandLabel(
                    s,
                    frame.states[s.id],
                    frame.remaining[s.id],
                    frame.proc[s.id],
                    showCritical && criticalSet.has(s.id),
                  )}</title
                >
                <circle
                  cx={px(s.x)}
                  cy={py(s.y)}
                  r={R}
                  class="{STATE_FILL[st]} {stateStroke(st)} {player.speed < 8
                    ? 'transition-colors'
                    : ''}"
                  stroke-width={showCritical && criticalSet.has(s.id) ? 2.5 : 1.5}
                />
                <text
                  x={px(s.x)}
                  y={py(s.y)}
                  text-anchor="middle"
                  dominant-baseline="central"
                  class="text-[10px] font-semibold {STATE_TEXT[st]}">{m.short(s)}</text
                >
                {#if marker(s.id)}
                  <text
                    x={px(s.x) + R + 2}
                    y={py(s.y) - R + 2}
                    class="fill-slate-800 text-[10px] font-bold">{marker(s.id)}</text
                  >
                {/if}
              </g>
            {/each}
          </svg>
        </div>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.active}"></span>
            {m.legend.running}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.frontier}"></span>
            {m.legend.ready}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.visited}"></span>
            {m.legend.done}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 bg-white"></span>
            {m.legend.waiting}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-path"></span>
            {m.legend.critical}
          </li>
        </ul>
        <p class="mt-2 text-xs text-slate-500">{m.legendNote}</p>
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
        {@render stat(m.stats.work, dag.work)}
        {@render stat(m.stats.span, dag.span)}
        {@render stat(m.stats.parallelism, m.num(dag.work / dag.span))}
        {@render stat(m.stats.time, m.time(frame.t, final.t))}
        {@render stat(m.stats.usage, m.usage(frame.busy, frame.idle))}
        {@render stat(m.stats.brent, m.num(dag.work / p + dag.span))}
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-1 text-xs text-slate-500">{m.speedupTitle}</h2>
        <table class="w-full text-sm tabular-nums">
          <thead>
            <tr class="text-left text-xs text-slate-500">
              {#each m.speedupHead as h (h)}<th class="py-1 font-medium">{h}</th>{/each}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each speedups as row (row.p)}
              <tr
                class="border-t border-slate-100 {row.p === p ? 'font-bold text-slate-900' : ''}"
                data-p={row.p}
              >
                <th class="py-0.5 text-left font-normal">{row.p}</th>
                <td>{row.t}</td>
                <td>{m.num(dag.work / row.t)}</td>
                <td aria-hidden={row.p !== p}>{row.p === p ? m.currentRow : ''}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <CodePanel lines={programPseudocode(program)} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
