<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_TIME,
    dedupPseudocode,
    dedupTrace,
    formatIntervals,
    mergePseudocode,
    mergeTrace,
    isCorrectMerge,
    parseIntervals,
    parseValues,
  } from '$lib/algo-engine/sorting-applications.js';
  import { en as m } from '$lib/lessons/sorting-applications/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {'merge'|'dedup'} Mode */
  /** @typedef {import('$lib/algo-engine/sorting-applications.js').Comparator} Comparator */
  /** @typedef {import('$lib/algo-engine/sorting-applications.js').Interval} Interval */
  /** @typedef {import('$lib/algo-engine/sorting-applications.js').MergeFrame} MergeFrame */
  /** @typedef {import('$lib/algo-engine/sorting-applications.js').DedupFrame} DedupFrame */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const MODES = /** @type {Mode[]} */ (['merge', 'dedup']);
  const BYS = /** @type {Comparator[]} */ (['start', 'end', 'none']);
  const TICKS = [0, 6, 12, 18, 24];
  // Fixed first inputs keep the prerendered HTML and the hydrated page identical.
  const INITIAL_TEXT = '8-10, 1-3, 15-18, 2-6, 4-5, 12-16';
  const INITIAL_INTERVALS = /** @type {{intervals: Interval[]}} */ (parseIntervals(INITIAL_TEXT))
    .intervals;
  const INITIAL_VALUES = [7, 3, 9, 3, 7, 1, 9, 9];

  let mode = $state(/** @type {Mode} */ ('merge'));
  let by = $state(/** @type {Comparator} */ ('start'));
  let intervals = $state.raw(INITIAL_INTERVALS);
  let values = $state.raw(INITIAL_VALUES);
  let intervalsText = $state(formatIntervals(INITIAL_INTERVALS));
  let valuesText = $state(INITIAL_VALUES.join(', '));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(
    /** @type {(MergeFrame | DedupFrame)[]} */ (mergeTrace(INITIAL_INTERVALS, 'start')),
  );
  // The frame's own shape says which problem it came from.
  const mf = $derived('blocks' in player.frame ? /** @type {MergeFrame} */ (player.frame) : null);
  const df = $derived('kept' in player.frame ? /** @type {DedupFrame} */ (player.frame) : null);

  const narration = $derived.by(() => {
    if (notice.at === player.index) return notice.text;
    if (mf) return m.describeMerge(mf, by);
    return df ? m.describeDedup(df) : '';
  });

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(mode === 'merge' ? mergeTrace(intervals, by) : dedupTrace(values));
  }

  function commitIntervals() {
    const parsed = parseIntervals(intervalsText);
    if ('error' in parsed) {
      intervalsText = formatIntervals(intervals);
      say(m.intervalErrors[parsed.error]);
      return;
    }
    intervals = parsed.intervals;
    intervalsText = formatIntervals(intervals);
    rebuild();
  }

  function commitValues() {
    const parsed = parseValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    values = parsed.values;
    valuesText = values.join(', ');
    rebuild();
  }

  /** @param {number} t */
  const pct = (t) => `${(t / MAX_TIME) * 100}%`;

  /** Block index each scanned interval went into, by interval id. */
  const blockOf = $derived(
    new Map(
      (mf?.blocks ?? []).flatMap((b, k) =>
        b.ids.map((id) => /** @type {[number, number]} */ ([id, k])),
      ),
    ),
  );

  /** @param {number} i @returns {VisualState} */
  function intervalState(i) {
    if (!mf || mf.kind === 'start') return '';
    if (i === mf.i) return 'active';
    if (blockOf.has(mf.items[i].id)) return 'visited';
    return '';
  }

  /** @param {number} k @returns {VisualState} */
  function blockState(k) {
    if (!mf) return '';
    return mf.kind !== 'done' && k === mf.blocks.length - 1 ? 'frontier' : 'sorted';
  }

  /** @param {number} i @returns {VisualState} */
  function valueState(i) {
    if (!df) return '';
    if (i === df.i) return 'active';
    if (df.kind === 'start' || df.kind === 'sorted') return '';
    if (df.kept.includes(i)) return 'sorted';
    return i < df.i || df.kind === 'done' ? 'visited' : '';
  }

  /** @param {number} i */
  function valueMarker(i) {
    const s = valueState(i);
    if (s === 'active') return m.markers.current;
    if (s === 'sorted') return m.markers.kept;
    return s === 'visited' ? m.markers.skipped : '';
  }

  /** @param {number} i */
  const valueLabel = (i) => {
    const s = valueState(i);
    const name =
      s === 'active'
        ? m.states.current
        : s === 'sorted'
          ? m.states.kept
          : s === 'visited'
            ? m.states.skipped
            : '';
    return m.cellLabel(i, /** @type {DedupFrame} */ (df).items[i], name);
  };

  // Swap, active and sorted fills are dark, so their text is white.
  const DARK = /** @type {VisualState[]} */ (['swap', 'active', 'sorted']);
  /** @param {VisualState} s */
  const barClass = (s) =>
    `${s ? STATE_BG[s] : 'bg-slate-300'} ${DARK.includes(s) ? 'text-white' : 'text-slate-900'}`;

  const legend = $derived(
    /** @type {[VisualState, string, string][]} */ (
      mode === 'merge'
        ? [
            ['active', '', m.legend.current],
            ['visited', '', m.legend.scanned],
            ['frontier', '', m.legend.open],
            ['sorted', '', m.legend.closed],
          ]
        : [
            ['active', m.markers.current, m.legend.current],
            ['sorted', m.markers.kept, m.legend.kept],
            ['visited', m.markers.skipped, m.legend.skipped],
          ]
    ),
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      if (mode === 'merge') commitIntervals();
      else commitValues();
    }}
  >
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={MODES.map((v) => ({ value: v, label: m.modes[v] }))}
      bind:value={mode}
      onchange={rebuild}
    />
    {#if mode === 'merge'}
      <SegmentedControl
        legend={m.comparatorLabel}
        name="by"
        options={BYS.map((v) => ({ value: v, label: m.comparators[v] }))}
        bind:value={by}
        onchange={rebuild}
      />
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.intervalsLabel}
        <input
          type="text"
          name="intervals"
          class="field w-72 max-w-full"
          bind:value={intervalsText}
          onchange={commitIntervals}
        />
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.valuesLabel}
        <input
          type="text"
          name="values"
          class="field w-72 max-w-full"
          bind:value={valuesText}
          onchange={commitValues}
        />
      </label>
    {/if}
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
        {#if mf}
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.timelineTitle}
            </h2>
            <ol class="flex flex-col gap-1" aria-label={m.timelineAria(mf.items)}>
              {#each mf.items as x, i (x.id)}
                {@const s = intervalState(i)}
                <li class="relative h-6 rounded bg-slate-50">
                  <span
                    class="absolute inset-y-0 rounded {barClass(s)}"
                    style="left: {pct(x.start)}; width: {pct(x.end - x.start)}"
                  ></span>
                  <!-- The label sits beside the bar, so a one-hour bar never has to hold it. -->
                  <span
                    class="absolute inset-y-0 flex items-center px-1 text-xs whitespace-nowrap text-slate-700 tabular-nums {s ===
                    'active'
                      ? 'font-bold'
                      : ''}"
                    style={x.end > MAX_TIME * 0.7
                      ? `right: calc(100% - ${pct(x.start)})`
                      : `left: ${pct(x.end)}`}
                  >
                    {m.span(x)}{blockOf.has(x.id) && s !== ''
                      ? ` ${m.blockMarker(/** @type {number} */ (blockOf.get(x.id)))}`
                      : ''}{s === 'active' ? ` ${m.markers.current}` : ''}
                  </span>
                </li>
              {/each}
            </ol>
            <div class="relative mt-1 h-4 text-[0.65rem] text-slate-500" aria-hidden="true">
              {#each TICKS as t (t)}
                <span class="absolute -translate-x-1/2 tabular-nums" style="left: {pct(t)}"
                  >{t}</span
                >
              {/each}
            </div>
          </div>
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.blocksTitle}
            </h2>
            <ol class="relative h-7 rounded bg-slate-50" aria-label={m.blocksAria(mf.blocks)}>
              {#each mf.blocks as b, k (k)}
                <li
                  class="absolute inset-y-0 flex items-center justify-center rounded text-[0.65rem] font-semibold whitespace-nowrap {barClass(
                    blockState(k),
                  )}"
                  style="left: {pct(b.start)}; width: {pct(b.end - b.start)}"
                >
                  {m.blockMarker(k)}
                </li>
              {/each}
            </ol>
            <p class="mt-2 font-mono text-xs text-slate-600">{m.comparatorCode[by]}</p>
            <p class="mt-1 text-xs text-slate-500">{m.comparatorNote}</p>
          </div>
        {:else if df}
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.valuesTitle}
            </h2>
            <ArrayStrip
              values={df.items}
              ariaLabel={m.valuesAria}
              stateOf={valueState}
              markerOf={valueMarker}
              labelOf={valueLabel}
              speed={player.speed}
            />
          </div>
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.outTitle}
            </h2>
            {#if df.out.length > 0}
              <ArrayStrip
                values={df.out}
                ariaLabel={m.outAria}
                stateOf={() => 'sorted'}
                speed={player.speed}
              />
            {:else}
              <p class="text-sm text-slate-500">{m.outEmpty}</p>
            {/if}
          </div>
        {/if}
        <ul class="flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {marker}
              {label}
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
        {#if mf}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
            <dd class="text-2xl font-bold tabular-nums">{mf.checks}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.blocks}</dt>
            <dd class="text-2xl font-bold tabular-nums">{mf.blocks.length}</dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.intervals}</dt>
            <dd class="text-2xl font-bold tabular-nums">
              {mf.items.length}
              {#if mf.kind === 'done'}
                <span class="ml-2 text-sm font-semibold"
                  >{isCorrectMerge(mf.items, mf.blocks) ? m.verdict.right : m.verdict.wrong}</span
                >
              {/if}
            </dd>
          </div>
        {:else if df}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
            <dd class="text-2xl font-bold tabular-nums">{df.checks}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.distinct}</dt>
            <dd class="text-2xl font-bold tabular-nums">{df.out.length}</dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.pairs}</dt>
            <dd class="text-2xl font-bold text-slate-500 tabular-nums">
              {(df.items.length * (df.items.length - 1)) / 2}
            </dd>
          </div>
        {/if}
      </dl>
      <CodePanel
        lines={mode === 'merge' ? mergePseudocode[by] : dedupPseudocode}
        active={player.frame.lines}
      />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
