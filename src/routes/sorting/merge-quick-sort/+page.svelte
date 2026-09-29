<script>
  import BarChart from '$lib/components/bar-chart.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    mergePseudocode,
    mergeSortTrace,
    quickPseudocode,
    quickSortTrace,
  } from '$lib/algo-engine/merge-quick-sort.js';
  import { makeArray, toItems } from '$lib/algo-engine/sorting.js';
  import { en as m } from '$lib/lessons/merge-quick-sort/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {'merge'|'quick'} Algo */
  /** @typedef {import('$lib/algo-engine/merge-quick-sort.js').PivotRule} PivotRule */
  /** @typedef {keyof typeof m.presets} Preset */

  const ALGOS = /** @type {Algo[]} */ (['merge', 'quick']);
  const PRESETS = /** @type {Preset[]} */ (Object.keys(m.presets));
  const RULES = /** @type {PivotRule[]} */ (Object.keys(m.pivots));
  const pseudocode = { merge: mergePseudocode, quick: quickPseudocode };

  let algo = $state(/** @type {Algo} */ ('merge'));
  let rule = $state(/** @type {PivotRule} */ ('last'));
  let preset = $state(/** @type {Preset} */ ('random'));
  let size = $state(12);
  // A fixed first array keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [42, 17, 88, 5, 63, 29, 71, 12, 95, 36, 54, 24];

  /**
   * Whether equal values kept their input order (ids ascend within each run of equals), or
   * null when no value repeats, since stability cannot show on such an array.
   * @param {import('$lib/algo-engine/merge-quick-sort.js').DivideFrame} last
   * @returns {boolean|null}
   */
  function isStable(last) {
    const pairs = last.items.slice(1).map((it, i) => [last.items[i], it]);
    if (!pairs.some(([a, b]) => a.value === b.value)) return null;
    return pairs.every(([a, b]) => a.value !== b.value || a.id < b.id);
  }

  /** @param {number[]} values @param {PivotRule} pivotRule */
  function build(values, pivotRule) {
    const traces = {
      merge: mergeSortTrace(toItems(values)),
      quick: quickSortTrace(toItems(values), pivotRule, Math.random),
    };
    // Totals come from the very traces the learner steps through, so a random pivot cannot disagree.
    const totals = ALGOS.map((a) => {
      const last = traces[a].at(-1);
      return {
        algo: a,
        comparisons: last?.comparisons ?? 0,
        moves: last?.swaps ?? 0,
        stable: last ? isStable(last) : null,
      };
    });
    return { traces, totals };
  }

  // The fixed first array uses the deterministic 'last' rule, so no randomness runs at load.
  const first = build(INITIAL, 'last');
  let built = $state.raw(first);
  const player = createPlayer(first.traces.merge);
  const frame = $derived(player.frame);

  /** A message shown in place of the narration, only on the frame it was raised on. */
  let notice = $state({ text: '', at: -1 });
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, algo));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function clearNotice() {
    notice = { text: '', at: -1 };
  }

  /** @param {number[]} values */
  function rebuild(values) {
    clearNotice();
    built = build(values, rule);
    player.load(built.traces[algo]);
  }

  function regenerate() {
    clearNotice();
    rebuild(makeArray(preset, size));
  }

  // Reloading lands on frame 0, so an unchanged narration would give no feedback.
  function newArray() {
    regenerate();
    say(m.newArrayNotice);
  }

  // Switching algorithm keeps the traces (and totals) already computed for this array.
  function switchAlgo() {
    clearNotice();
    player.load(built.traces[algo]);
  }

  // Pivot changes only affect quicksort, but both traces are rebuilt on the current array.
  function changeRule() {
    rebuild(built.traces.merge[0].items.map((it) => it.value));
  }

  const merging = $derived(algo === 'merge');
  const mid = $derived(frame.range ? Math.floor((frame.range[0] + frame.range[1]) / 2) : -1);

  /** @param {number} i */
  function barState(i) {
    const kind = frame.kind;
    // With two bars in focus the pivot was just swapped to the end of the range.
    if (kind === 'pivot' && frame.focus.length === 2 && frame.focus.includes(i)) return 'write';
    if (frame.focus.includes(i)) {
      if (kind === 'take' || kind === 'swap') return 'write';
      if (kind === 'scan' && i !== frame.pivot) return 'compare';
    }
    if (i === frame.pivot) return 'pivot';
    if (frame.sorted.includes(i)) return 'sorted';
    if (frame.runs.some(([lo, hi]) => i >= lo && i <= hi)) return 'run';
    return 'idle';
  }

  /** @type {Record<string, string>} */
  const barClass = {
    write: 'bg-state-swap',
    compare: 'bg-state-compare',
    pivot: 'bg-state-active',
    run: 'bg-state-visited',
    sorted: 'bg-state-sorted',
    idle: 'bg-slate-400',
  };

  /** @type {Record<string, string>} */
  const barMarker = {
    write: m.markers.write,
    compare: m.markers.compare,
    pivot: m.markers.pivot,
    sorted: m.markers.sorted,
    run: m.markers.run,
  };

  /** The buffer row spans the whole array; only slots lo..hi hold buffer items. */
  const auxRow = $derived.by(() => {
    const { aux, range } = frame;
    if (!aux || !range) return null;
    return frame.items.map((_, i) => (i >= range[0] && i <= range[1] ? aux[i - range[0]] : null));
  });

  /** @param {number} i @returns {'head'|'taken'|'waiting'} */
  function auxKind(i) {
    const left = i <= mid;
    if ((left && i === frame.i) || (!left && i === frame.j)) return 'head';
    const [lo] = frame.range ?? [0];
    const taken = left ? i >= lo && i < frame.i : i > mid && i < frame.j;
    return taken ? 'taken' : 'waiting';
  }

  /** @type {Record<string, string>} */
  const auxClass = {
    head: 'bg-slate-400 ring-2 ring-state-active ring-inset',
    taken: 'bg-slate-200',
    waiting: 'bg-slate-400',
  };

  /** @type {Record<string, string>} */
  const auxMarker = { head: m.markers.head, taken: m.markers.taken, waiting: '' };

  /** Screen-reader summary of which buffer slots are next and how many are taken. */
  const bufferProgress = $derived.by(() => {
    const { aux, range } = frame;
    if (!aux || !range) return '';
    const [lo, hi] = range;
    const slots = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
    const head = (/** @type {boolean} */ left) =>
      slots.find((i) => auxKind(i) === 'head' && i <= mid === left);
    const value = (/** @type {number|undefined} */ i) =>
      i === undefined ? null : aux[i - lo].value;
    return m.bufferProgress(
      value(head(true)),
      value(head(false)),
      slots.filter((i) => auxKind(i) === 'taken').length,
    );
  });

  const chips = $derived.by(() => {
    const ranges = frame.stack.map(([lo, hi]) => m.rangeChip(lo, hi));
    if (merging) return ranges.map((label, i) => ({ label, hot: i === ranges.length - 1 }));
    const current = frame.range ? [{ label: m.rangeChip(...frame.range), hot: true }] : [];
    return [...current, ...ranges.map((label) => ({ label }))];
  });

  const legend = $derived(
    merging
      ? [
          ['bg-state-swap', `${m.markers.write} ${m.legend.write}`],
          [
            'bg-slate-400 ring-2 ring-state-active ring-inset',
            `${m.markers.head} ${m.legend.head}`,
          ],
          ['bg-slate-200', `${m.markers.taken} ${m.legend.taken}`],
          ['bg-state-visited', `${m.markers.run} ${m.legend.run}`],
          ['bg-state-sorted', `${m.markers.sorted} ${m.legend.sorted}`],
        ]
      : [
          ['bg-state-compare', `${m.markers.compare} ${m.legend.compare}`],
          ['bg-state-swap', `${m.markers.write} ${m.legend.write}`],
          ['bg-state-active', `${m.markers.pivot} ${m.legend.pivot}`],
          ['bg-state-sorted', `${m.markers.sorted} ${m.legend.sorted}`],
        ],
  );
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.algorithmLabel}
      name="algo"
      options={ALGOS.map((a) => ({ value: a, label: m.algorithms[a] }))}
      bind:value={algo}
      onchange={switchAlgo}
    />

    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select class="field" bind:value={preset} onchange={regenerate}>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>

    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sizeLabel}: {size}
      <input
        type="range"
        min="6"
        max="24"
        bind:value={size}
        onchange={regenerate}
        class="focus-ring rounded accent-teal-700"
      />
    </label>

    {#if !merging}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.pivotLabel}
        <select class="field" name="pivot" bind:value={rule} onchange={changeRule}>
          {#each RULES as r (r)}
            <option value={r}>{m.pivots[r]}</option>
          {/each}
        </select>
      </label>
    {/if}

    <button onclick={newArray} class="btn-secondary">{m.shuffle}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <BarChart
          items={frame.items}
          stateOf={(i) => barClass[barState(i)]}
          markerOf={(i) => barMarker[barState(i)] ?? ''}
          dimmed={(i) => !!frame.range && (i < frame.range[0] || i > frame.range[1])}
          aux={auxRow}
          auxStateOf={(i) => auxClass[auxKind(i)]}
          auxMarkerOf={(i) => auxMarker[auxKind(i)]}
          ariaLabel={m.barsLabel(
            frame.items.map((it) => it.value),
            frame.sorted.length,
            frame.range,
          )}
          auxLabel={m.auxLabel(
            (frame.aux ?? []).map((it) => it.value),
            bufferProgress,
          )}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
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
          <dt class="text-xs text-slate-500">{m.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.moves[algo]}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.swaps}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.depthLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {m.depthValue(frame.depth, frame.maxDepth)}
          </dd>
        </div>
      </dl>
      <ChipList title={m.stackTitle[algo]} items={chips} emptyText={m.stackEmpty} />
      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <dl class="space-y-2">
          {#each built.totals as row (row.algo)}
            <div
              class="flex flex-wrap justify-between gap-x-2 {row.algo === algo
                ? 'font-semibold text-slate-900'
                : 'text-slate-600'}"
            >
              <dt>{m.algorithms[row.algo]}</dt>
              <dd class="tabular-nums">
                {m.compareRow(row.comparisons, row.moves, m.moves[row.algo])}
              </dd>
              <dd class="w-full text-xs font-normal text-slate-500">{m.stableLabel(row.stable)}</dd>
            </div>
          {/each}
        </dl>
      </section>
      <CodePanel lines={pseudocode[algo]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>
</LessonLayout>
