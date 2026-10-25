<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_APPENDS,
    MAX_CHARGE,
    MIN_CHARGE,
    aggregateCost,
    appendPseudocode,
    appendTrace,
  } from '$lib/algo-engine/amortized-dynamic-arrays.js';
  import { en as m } from '$lib/lessons/amortized-dynamic-arrays/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/lessons/amortized-dynamic-arrays/copy.en.js').AppendMethod} AppendMethod */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_N = 9;
  const INITIAL_C = 3;
  let n = $state(INITIAL_N);
  let charge = $state(INITIAL_C);
  /** @type {number | null} */
  let nDraft = $state(INITIAL_N);
  /** @type {number | null} */
  let chargeDraft = $state(INITIAL_C);
  let method = $state(/** @type {AppendMethod} */ ('accounting'));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(appendTrace(INITIAL_N, INITIAL_C));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  const methodOptions = /** @type {AppendMethod[]} */ (['accounting', 'aggregate']).map((v) => ({
    value: v,
    label: m.methods[v],
  }));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(appendTrace(n, charge));
  }

  function commitN() {
    if (whole(nDraft, 1, MAX_APPENDS)) {
      n = /** @type {number} */ (nDraft);
      rebuild();
    } else {
      nDraft = n;
      notice = { text: m.appendsError, at: player.index };
    }
  }

  function commitCharge() {
    if (whole(chargeDraft, MIN_CHARGE, MAX_CHARGE)) {
      charge = /** @type {number} */ (chargeDraft);
      rebuild();
    } else {
      chargeDraft = charge;
      notice = { text: m.chargeError, at: player.index };
    }
  }

  /** @param {(number|null)[]} cells */
  const shown = (cells) => cells.map((v) => (v === null ? m.spare : v));

  /** @param {number} i @returns {VisualState} */
  const stateNew = (i) =>
    i === frame.at && (frame.kind === 'copy' || frame.kind === 'write') ? 'swap' : '';
  /** @param {number} i @returns {VisualState} */
  const stateOld = (i) => (i === frame.at && frame.kind === 'copy' ? 'compare' : '');
  /** @param {number} i */
  const labelNew = (i) => m.cellLabel(i, frame.cells[i], stateNew(i) ? m.states.written : '');
  /** @param {number} i */
  const labelOld = (i) => m.cellLabel(i, frame.old?.[i] ?? null, stateOld(i) ? m.states.read : '');
  const pointersNew = $derived(
    frame.kind === 'copy'
      ? [{ name: m.pointerI, index: frame.at }]
      : frame.old
        ? []
        : [{ name: m.pointerSize, index: frame.size }],
  );
  const pointersOld = $derived(
    frame.kind === 'copy' ? [{ name: m.pointerI, index: frame.at }] : [],
  );

  const worst = $derived(frame.costs.length ? Math.max(...frame.costs) : 0);
  // Appends whose write has happened; the aggregate sum counts only those.
  const finished = $derived(
    frame.kind === 'write' || frame.kind === 'done' ? frame.op : Math.max(0, frame.op - 1),
  );
  const agg = $derived(aggregateCost(finished));
  const resizeCopies = $derived.by(() => {
    /** @type {number[]} */
    const out = [];
    for (let p = 1; p < finished; p *= 2) out.push(p);
    return out;
  });

  // Chart geometry: one bar per append; costs, the bank and the charge share one axis.
  const GAP = 4;
  const BAR = $derived(Math.max(10, Math.min(32, Math.floor(600 / frame.n) - GAP)));
  const LEFT = 30;
  const TOP = 12;
  const PLOT_H = 130;
  const chartW = $derived(LEFT + frame.n * (BAR + GAP) + 8);
  const final = $derived(
    /** @type {import('$lib/algo-engine/amortized-dynamic-arrays.js').AppendFrame} */ (
      player.frames[player.frames.length - 1]
    ),
  );
  // The axis is fixed for the whole run, so bars do not rescale while stepping.
  const yMax = $derived(Math.max(1, frame.charge, ...final.costs, ...final.banks));
  const yMin = $derived(Math.min(0, ...final.banks));
  /** @param {number} v */
  const y = (v) => TOP + PLOT_H - ((v - yMin) / (yMax - yMin)) * PLOT_H;
  /** Centre of the bar for append t; t = 0 sits on the axis. @param {number} t */
  const x = (t) => (t === 0 ? LEFT : LEFT + (t - 1) * (BAR + GAP) + GAP / 2 + BAR / 2);
  const ticks = $derived.by(() => {
    const step = Math.max(1, Math.ceil((yMax - yMin) / 6));
    /** @type {number[]} */
    const out = [];
    for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) out.push(v);
    return out;
  });
  const bankPoints = $derived(frame.banks.map((b, t) => `${x(t)},${y(b)}`).join(' '));
  const running = $derived(frame.kind !== 'done' && frame.kind !== 'start' ? frame.op : -1);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitN();
      commitCharge();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.appendsLabel}
      <input
        type="number"
        name="appends"
        min="1"
        max={MAX_APPENDS}
        step="1"
        class="field w-24"
        bind:value={nDraft}
        onchange={commitN}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.chargeLabel}
      <input
        type="number"
        name="charge"
        min={MIN_CHARGE}
        max={MAX_CHARGE}
        step="1"
        class="field w-24"
        bind:value={chargeDraft}
        onchange={commitCharge}
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
        {#if frame.old}
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.oldBlockTitle}
          </h2>
          <ArrayStrip
            values={shown(frame.old)}
            ariaLabel={m.oldAria}
            stateOf={stateOld}
            labelOf={labelOld}
            pointers={pointersOld}
            speed={player.speed}
          />
        {/if}
        <h2
          class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase {frame.old
            ? 'mt-4'
            : ''}"
        >
          {frame.old ? m.newBlockTitle : m.arrayTitle}
        </h2>
        <ArrayStrip
          values={shown(frame.cells)}
          ariaLabel={m.arrayAria}
          stateOf={stateNew}
          labelOf={labelNew}
          dimmed={(i) => frame.cells[i] === null}
          pointers={pointersNew}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.compare}"></span>
            {m.legend.read}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.swap}"></span>
            {m.legend.written}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 opacity-40 {STATE_BG['']}"
            ></span>
            {m.legend.spare}
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
            aria-label={m.chartLabel(frame.costs.length, frame.n, frame.total, frame.bank)}
            class="h-auto"
            style="width: {chartW}px; max-width: none"
          >
            {#each ticks as v (v)}
              <line
                x1={LEFT}
                x2={chartW - 4}
                y1={y(v)}
                y2={y(v)}
                class={v === 0 ? 'stroke-slate-500' : 'stroke-slate-200'}
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
                height={y(0) - y(c)}
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
            <line
              x1={LEFT}
              x2={chartW - 4}
              y1={y(frame.charge)}
              y2={y(frame.charge)}
              stroke-dasharray="2 3"
              stroke-width="1.5"
              class="stroke-teal-700"
            />
            <polyline
              points={bankPoints}
              fill="none"
              stroke-width="2"
              stroke-dasharray="5 3"
              class="stroke-slate-900"
            />
            {#each frame.banks as b, t (t)}
              <circle
                cx={x(t)}
                cy={y(b)}
                r="2.5"
                class={b < 0 ? 'fill-red-700' : 'fill-slate-900'}
              />
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
            {m.chartLegend.bank}
          </li>
          <li class="flex items-center gap-1.5">
            <svg width="24" height="8" aria-hidden="true"
              ><line
                x1="0"
                x2="24"
                y1="4"
                y2="4"
                stroke-dasharray="2 3"
                stroke-width="1.5"
                class="stroke-teal-700"
              /></svg
            >
            {m.chartLegend.charge}
          </li>
        </ul>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.op}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.op} / {frame.n}</dd>
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
          <dd class="text-2xl font-bold tabular-nums">{frame.charged}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.bank}</dt>
          <dd class="text-2xl font-bold tabular-nums {frame.bank < 0 ? 'text-red-700' : ''}">
            {frame.bank < 0 ? `−${-frame.bank}` : frame.bank}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.worst}</dt>
          <dd class="text-2xl font-bold tabular-nums">{worst}</dd>
        </div>
      </dl>

      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        {#if method === 'accounting'}
          <h2 class="mb-2 text-xs text-slate-500">{m.accounting.title}</h2>
          <p>{m.accounting.rule}</p>
          <p class="mt-2 text-lg font-bold tabular-nums {frame.bank < 0 ? 'text-red-700' : ''}">
            {m.bankTitle}: {frame.bank < 0 ? `−${-frame.bank}` : frame.bank}
            {m.coin}
            {#if frame.bank < 0}<span class="ml-1 text-sm">({m.debt})</span>{/if}
          </p>
          <p class="mt-1 tabular-nums">
            {m.accounting.balance(frame.charged, frame.total, frame.bank)}
          </p>
          <p class="mt-2">
            {frame.firstDebt < 0
              ? m.accounting.ok
              : m.accounting.broke(frame.firstDebt, frame.charge)}
          </p>
          <p class="mt-2 text-slate-600">{m.accounting.why}</p>
        {:else}
          <h2 class="mb-2 text-xs text-slate-500">{m.aggregate.title}</h2>
          <p class="tabular-nums">
            {m.aggregate.sum(finished, agg.writes, resizeCopies, agg.copies, agg.total)}
          </p>
          <p class="mt-2 tabular-nums">{m.aggregate.bound(finished, agg.total)}</p>
        {/if}
      </section>

      <CodePanel lines={appendPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
