<script>
  import BarChart from '$lib/components/bar-chart.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_INSERTS,
    loadPseudocode,
    loadTrace,
  } from '$lib/algo-engine/load-factor-rehashing.js';
  import { en as m } from '$lib/lessons/load-factor-rehashing/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/load-factor-rehashing.js').Growth} Growth */
  /** @typedef {import('$lib/algo-engine/load-factor-rehashing.js').Threshold} Threshold */
  /** @typedef {'0.5'|'0.75'|'1'|'never'} ThresholdKey */
  /** @typedef {'active'|'frontier'|''} ChipState */

  const THRESHOLD_KEYS = /** @type {ThresholdKey[]} */ (['0.5', '0.75', '1', 'never']);
  const GROWTHS = /** @type {Growth[]} */ (['double', 'add']);
  /** The gauge spans α from 0 to this value; larger loads pin the bar to the end. */
  const GAUGE_MAX = 2;

  // Fixed first settings keep the prerendered HTML and the hydrated page identical.
  let count = $state(12);
  let thresholdKey = $state(/** @type {ThresholdKey} */ ('0.75'));
  let growth = $state(/** @type {Growth} */ ('double'));
  const threshold = $derived(
    /** @type {Threshold} */ (thresholdKey === 'never' ? null : Number(thresholdKey)),
  );

  const player = createPlayer(loadTrace(12, 0.75, 'double'));
  const frame = $derived(player.frame);
  const narration = $derived(m.describe(frame, threshold, growth));

  function rebuild() {
    player.load(loadTrace(count, threshold, growth));
  }

  const gaugeLoad = $derived(frame.n / frame.m);
  const over = $derived(threshold !== null && gaugeLoad > threshold);
  const resizing = $derived(frame.kind === 'grow' || frame.kind === 'move');

  /**
   * @param {number} b
   * @param {number} i
   * @returns {ChipState}
   */
  function chipState(b, i) {
    const chain = frame.buckets[b];
    if (frame.kind === 'move')
      return b === frame.movedTo && i === chain.length - 1 ? 'frontier' : '';
    if (frame.kind === 'insert' && b === frame.bucket && i === chain.length - 1) return 'active';
    return '';
  }

  const CHIP_CLASS = {
    active: 'bg-state-active text-white',
    frontier: 'bg-state-frontier text-slate-900',
    '': 'bg-slate-100 text-slate-900',
  };

  const mark = /** @param {ChipState} s */ (s) => (s ? m.marks[s] : '');

  const columnsClass = $derived(
    frame.buckets.length > 32
      ? 'columns-2 md:columns-4'
      : frame.buckets.length > 8
        ? 'columns-2'
        : '',
  );

  const costItems = $derived(frame.costs.map((value, id) => ({ id, value })));
  const current = $derived(
    frame.kind === 'start' || frame.kind === 'done' ? -1 : frame.costs.length - 1,
  );

  /** @param {number} i */
  function barClass(i) {
    if (frame.costs[i] > 1) return 'bg-state-swap';
    return i === current ? 'bg-state-active' : 'bg-slate-400';
  }

  /** @param {number} i */
  const barMark = (i) => (frame.costs[i] > 1 ? m.marks.swap : i === current ? m.marks.active : '');

  const stats = $derived([
    [m.stats.n, String(frame.n), 'n'],
    [m.stats.m, String(frame.m), 'm'],
    [m.stats.work, String(frame.work), 'work'],
    [m.stats.perInsert, frame.n ? (frame.work / frame.n).toFixed(2) : m.none, 'per-insert'],
    [m.stats.grows, String(frame.grows), 'grows'],
    [m.stats.longest, String(frame.longest), 'longest'],
  ]);

  const legend = [
    ['bg-state-active', `${m.marks.active} ${m.legend.active}`],
    ['bg-state-frontier', `${m.marks.frontier} ${m.legend.frontier}`],
    ['bg-state-swap', `${m.marks.swap} ${m.legend.swap}`],
  ];

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class={labelClass}>
      {m.countLabel}: {count}
      <input
        type="range"
        name="count"
        min="1"
        max={MAX_INSERTS}
        bind:value={count}
        onchange={rebuild}
        class="focus-ring rounded accent-teal-700"
      />
    </label>
    <SegmentedControl
      legend={m.thresholdLabel}
      name="threshold"
      options={THRESHOLD_KEYS.map((v) => ({ value: v, label: m.thresholds[v] }))}
      bind:value={thresholdKey}
      onchange={rebuild}
    />
    <SegmentedControl
      legend={m.growthLabel}
      name="growth"
      options={GROWTHS.map((v) => ({ value: v, label: m.growths[v] }))}
      bind:value={growth}
      onchange={rebuild}
    />
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-1 text-xs text-slate-500">{m.gaugeLabel}</h2>
        <div
          class="relative h-6 overflow-hidden rounded-full bg-slate-100"
          role="meter"
          aria-label={m.gaugeLabel}
          aria-valuemin="0"
          aria-valuemax={GAUGE_MAX}
          aria-valuenow={Math.min(gaugeLoad, GAUGE_MAX)}
          aria-valuetext={m.gaugeText(frame.n, frame.m, threshold)}
        >
          <div
            class="h-full rounded-full {over ? 'bg-state-swap' : 'bg-state-active'} {player.speed <
            8
              ? 'transition-all'
              : ''}"
            style="width: {(Math.min(gaugeLoad, GAUGE_MAX) / GAUGE_MAX) * 100}%"
          ></div>
          {#if threshold !== null}
            <div
              class="absolute inset-y-0 w-0.5 bg-slate-900"
              style="left: {(threshold / GAUGE_MAX) * 100}%"
              aria-hidden="true"
            ></div>
          {/if}
        </div>
        <p class="mt-1 text-sm text-slate-700 tabular-nums" data-testid="gauge">
          {m.gaugeText(frame.n, frame.m, threshold)}{#if over}
            <strong class="ml-1">{m.marks.swap} {m.gaugeOver}</strong>{/if}
        </p>

        <h2 class="mt-4 mb-2 text-xs text-slate-500">
          {frame.kind === 'move' ? m.growingTo(frame.m) : m.bucketsLabel}
        </h2>
        <ol class="text-sm {columnsClass}" aria-label={m.bucketsLabel}>
          {#each frame.buckets as chain, b (b)}
            <li class="flex min-h-7 items-center gap-2 break-inside-avoid py-0.5">
              <span class="w-6 shrink-0 text-right text-xs text-slate-500 tabular-nums"
                ><span class="sr-only">{m.bucketPrefix + ' '}</span>{b}</span
              >
              <span class="flex flex-wrap items-center gap-1 font-mono text-xs">
                {#each chain as key, i (i)}
                  {@const s = chipState(b, i)}
                  <span
                    class="rounded px-1.5 py-0.5 tabular-nums {CHIP_CLASS[s]} {player.speed < 8
                      ? 'transition-colors'
                      : ''}"
                    ><span aria-hidden="true">{mark(s)}</span>{key}{#if s}<span class="sr-only"
                        >, {m.chipStates[s]}</span
                      >{/if}</span
                  >
                {:else}
                  <span class="text-slate-500">{m.emptyBucket}</span>
                {/each}
              </span>
            </li>
          {/each}
        </ol>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs text-slate-500">{m.costsLabel}</h2>
        <BarChart
          items={costItems}
          stateOf={barClass}
          markerOf={barMark}
          ariaLabel={m.costsAria(frame.costs)}
          speed={player.speed}
        />
        <p class="mt-2 text-sm text-slate-700 tabular-nums" data-testid="average">
          {m.average(frame.work, frame.n)}
        </p>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [cls, label] (cls)}
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

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        {#each stats as [label, value, id] (id)}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <ChipList
        title={m.pendingTitle}
        items={resizing ? frame.pending.map((k) => ({ label: String(k) })) : []}
        emptyText={m.pendingEmpty}
        limit={MAX_INSERTS}
      />
      <CodePanel lines={loadPseudocode[growth]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
