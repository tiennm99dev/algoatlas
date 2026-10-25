<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_BITS,
    MAX_OPS,
    MIN_BITS,
    aggregateFlips,
    counterTrace,
    incrementPseudocode,
  } from '$lib/algo-engine/amortized-analysis.js';
  import { en as m } from '$lib/lessons/amortized-analysis/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/lessons/amortized-analysis/copy.en.js').AmortizedMethod} AmortizedMethod */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_K = 4;
  const INITIAL_M = 16;
  let k = $state(INITIAL_K);
  let ops = $state(INITIAL_M);
  /** @type {number | null} */
  let kDraft = $state(INITIAL_K);
  /** @type {number | null} */
  let opsDraft = $state(INITIAL_M);
  let method = $state(/** @type {AmortizedMethod} */ ('accounting'));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(counterTrace(INITIAL_K, INITIAL_M));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  const methodOptions = /** @type {AmortizedMethod[]} */ ([
    'aggregate',
    'accounting',
    'potential',
  ]).map((v) => ({ value: v, label: m.methods[v] }));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(counterTrace(k, ops));
  }

  function commitK() {
    if (whole(kDraft, MIN_BITS, MAX_BITS)) {
      k = /** @type {number} */ (kDraft);
      rebuild();
    } else {
      kDraft = k;
      notice = { text: m.bitsError, at: player.index };
    }
  }

  function commitOps() {
    if (whole(opsDraft, 1, MAX_OPS)) {
      ops = /** @type {number} */ (opsDraft);
      rebuild();
    } else {
      opsDraft = ops;
      notice = { text: m.opsError, at: player.index };
    }
  }

  // The strip shows the highest bit first, so display position d is bit k − 1 − d.
  /** @param {number} d */
  const bitAt = (d) => frame.k - 1 - d;
  const display = $derived(frame.bits.slice().reverse());

  /** @param {number} d @returns {VisualState} */
  function stateOf(d) {
    const bit = bitAt(d);
    if (bit !== frame.i) return '';
    if (frame.kind === 'reset') return 'swap';
    if (frame.kind === 'set') return 'sorted';
    return '';
  }
  /** @param {number} d */
  function markerOf(d) {
    if (stateOf(d) === 'swap') return '↓';
    return frame.bits[bitAt(d)] === 1 ? m.coin : '';
  }
  /** @param {number} d */
  function labelOf(d) {
    const s = stateOf(d);
    const bit = bitAt(d);
    const state = s === 'swap' ? m.states.reset : s === 'sorted' ? m.states.set : '';
    return m.bitLabel(bit, frame.bits[bit], frame.bits[bit] === 1, state);
  }
  const pointers = $derived(
    frame.i >= 0 ? [{ name: m.pointerI, index: frame.k - 1 - frame.i }] : [],
  );

  const worst = $derived(frame.costs.length ? Math.max(...frame.costs) : 0);
  const finished = $derived(frame.amortized.length);

  const aggregateValues = $derived(frame.flips.map((f, i) => [f, Math.floor(finished / 2 ** i)]));
  const aggregateRows = $derived(frame.flips.map((_, i) => m.aggregate.row(i)));
  /** @param {number} r @param {number} c @returns {VisualState} */
  const aggregateState = (r, c) =>
    c === 0 && r === frame.i && frame.kind !== 'call' ? 'active' : '';

  // Chart geometry: one bar per increment, cost and Φ share the axis 0..k.
  // Bars widen for short runs so a few increments still fill the card.
  const GAP = 4;
  const BAR = $derived(Math.max(12, Math.min(32, Math.floor(600 / frame.m) - GAP)));
  const LEFT = 26;
  const TOP = 14;
  const PLOT_H = 110;
  const chartW = $derived(LEFT + frame.m * (BAR + GAP) + 8);
  /** @param {number} v */
  const y = (v) => TOP + PLOT_H - (v / frame.k) * PLOT_H;
  /** Centre of the bar for increment t; t = 0 sits on the axis. @param {number} t */
  const x = (t) => (t === 0 ? LEFT : LEFT + (t - 1) * (BAR + GAP) + GAP / 2 + BAR / 2);
  const ticks = $derived(Array.from({ length: frame.k + 1 }, (_, v) => v));
  const phiPoints = $derived(frame.potentials.map((p, t) => `${x(t)},${y(p)}`).join(' '));
  const running = $derived(frame.kind !== 'done' && frame.kind !== 'start' ? frame.op : -1);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitK();
      commitOps();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.bitsLabel}
      <input
        type="number"
        name="bits"
        min={MIN_BITS}
        max={MAX_BITS}
        step="1"
        class="field w-24"
        bind:value={kDraft}
        onchange={commitK}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.opsLabel}
      <input
        type="number"
        name="ops"
        min="1"
        max={MAX_OPS}
        step="1"
        class="field w-24"
        bind:value={opsDraft}
        onchange={commitOps}
      />
    </label>
    <SegmentedControl
      legend={m.methodLegend}
      name="method"
      options={methodOptions}
      bind:value={method}
    />
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.counterTitle}
        </h2>
        <ArrayStrip
          values={display}
          ariaLabel={m.counterAria}
          {stateOf}
          {markerOf}
          {labelOf}
          {pointers}
          showIndices={false}
          speed={player.speed}
        />
        <p class="mt-2 font-mono text-sm text-slate-700 tabular-nums">
          {m.valueLine(frame.bits, frame.value)}
        </p>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG['']}"></span>
            {m.coin}
            {m.legend.coin}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.swap}"></span>
            ↓ {m.legend.reset}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.sorted}"></span>
            {m.coin}
            {m.legend.set}
          </li>
        </ul>
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.chartTitle}
        </h2>
        <!-- A scrollable region must be keyboard focusable. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div class="overflow-x-auto" tabindex="0" role="group" aria-label={m.chartScroller}>
          <svg
            viewBox="0 0 {chartW} {TOP + PLOT_H + 24}"
            role="img"
            aria-label={m.chartLabel(frame.costs.length, frame.m, frame.total, frame.phi)}
            class="h-auto"
            style="width: {chartW}px; max-width: none"
          >
            {#each ticks as v (v)}
              <line
                x1={LEFT}
                x2={chartW - 4}
                y1={y(v)}
                y2={y(v)}
                class="stroke-slate-200"
                stroke-width="1"
              />
              <text x={LEFT - 6} y={y(v) + 3} text-anchor="end" font-size="9" class="fill-slate-500"
                >{v}</text
              >
            {/each}
            {#each frame.costs as c, t (t)}
              {@const hot = t + 1 === running}
              <rect
                x={x(t + 1) - BAR / 2}
                y={y(c)}
                width={BAR}
                height={TOP + PLOT_H - y(c)}
                rx="2"
                class="{hot
                  ? 'fill-state-active stroke-slate-900'
                  : 'fill-sky-200 stroke-slate-400'} {player.speed < 8 ? 'transition-all' : ''}"
              />
              {#if hot}
                <text
                  x={x(t + 1)}
                  y={TOP + PLOT_H + 20}
                  text-anchor="middle"
                  font-size="9"
                  font-weight="700"
                  class="fill-slate-900">▲</text
                >
              {/if}
              {#if (t + 1) % 4 === 0 || t === 0}
                <text
                  x={x(t + 1)}
                  y={TOP + PLOT_H + 11}
                  text-anchor="middle"
                  font-size="9"
                  class="fill-slate-500">{t + 1}</text
                >
              {/if}
            {/each}
            <polyline
              points={phiPoints}
              fill="none"
              stroke-width="2"
              stroke-dasharray="5 3"
              class="stroke-slate-900"
            />
            {#each frame.potentials as p, t (t)}
              <circle cx={x(t)} cy={y(p)} r="2.5" class="fill-slate-900" />
            {/each}
          </svg>
        </div>
        <ul class="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
          <li>{m.axisOps}</li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 bg-sky-200"></span>
            {m.chartLegend.cost}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.active}"></span>
            ▲ {m.chartLegend.now}
          </li>
          <li class="flex items-center gap-1.5">
            <svg width="24" height="8" aria-hidden="true"
              ><line
                x1="0"
                x2="24"
                y1="4"
                y2="4"
                stroke-dasharray="5 3"
                stroke-width="2"
                class="stroke-slate-900"
              /></svg
            >
            {m.chartLegend.phi}
          </li>
        </ul>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.op}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.op} / {frame.m}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.opCost}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.opCost}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.total}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.total}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.bound}</dt>
          <dd class="text-2xl font-bold tabular-nums">{2 * frame.op}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.phi}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.phi}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.worst}</dt>
          <dd class="text-2xl font-bold tabular-nums">{worst}</dd>
        </div>
      </dl>

      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        {#if method === 'aggregate'}
          <h2 class="mb-2 text-xs text-slate-500">{m.aggregate.title}</h2>
          <DpTable
            values={aggregateValues}
            ariaLabel={m.aggregate.tableAria}
            rowHeaders={aggregateRows}
            colHeaders={m.aggregate.cols}
            stateOf={aggregateState}
            speed={player.speed}
          />
          <p class="mt-2 tabular-nums">
            {m.aggregate.sum(finished, aggregateFlips(finished, frame.k), frame.total)}
          </p>
        {:else if method === 'accounting'}
          <h2 class="mb-2 text-xs text-slate-500">{m.accounting.title}</h2>
          <p>{m.accounting.rule}</p>
          <dl class="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <dt class="text-xs text-slate-500">{m.accounting.charged}</dt>
              <dd class="text-lg font-bold tabular-nums">{frame.charged}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">{m.accounting.spent}</dt>
              <dd class="text-lg font-bold tabular-nums">{frame.total}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">{m.accounting.bank}</dt>
              <dd class="text-lg font-bold tabular-nums">{frame.phi} {m.coin}</dd>
            </div>
          </dl>
          <p class="mt-2 tabular-nums">
            {m.accounting.balance(frame.charged, frame.total, frame.phi)}
          </p>
        {:else}
          <h2 class="mb-2 text-xs text-slate-500">{m.potential.title}</h2>
          <p class="font-semibold tabular-nums">{m.potential.formula(frame)}</p>
          <p class="mt-2 tabular-nums">{m.potential.sum(frame)}</p>
        {/if}
      </section>

      <CodePanel lines={incrementPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
