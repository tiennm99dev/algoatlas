<script>
  import BarChart from '$lib/components/bar-chart.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import { parseValueList } from '$lib/algo-engine/parse-values.js';
  import {
    MAX_N,
    MAX_RUNS,
    MAX_VALUE,
    MIN_N,
    QUICK_PRESETS,
    RUN_BATCH,
    expectedComparisons,
    histogram,
    lcg,
    quicksortPseudocode,
    quicksortRun,
    quicksortTrace,
    worstComparisons,
  } from '$lib/algo-engine/randomised-algorithms.js';
  import { en as m } from '$lib/lessons/randomised-algorithms/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/randomised-algorithms.js').PivotRule} PivotRule */
  /** @typedef {keyof typeof QUICK_PRESETS} Preset */
  /** @typedef {keyof typeof m.barStates} BarRole */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(QUICK_PRESETS));
  /** @type {Record<BarRole, VisualState>} */
  const BAR_STATE = {
    pivot: 'active',
    compare: 'compare',
    left: 'frontier',
    right: 'visited',
    placed: 'sorted',
    '': '',
  };
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
  const RULES = [
    { value: 'random', label: m.rules.random },
    { value: 'last', label: m.rules.last },
  ];
  const BINS = 24;
  // The first run uses fixed coin flips, so the prerendered page and the hydrated one agree.
  const FIRST_SEED = 7;

  const INITIAL = QUICK_PRESETS.shuffled;
  let preset = $state(/** @type {Preset | ''} */ ('shuffled'));
  let rule = $state(/** @type {PivotRule} */ ('random'));
  let values = $state(INITIAL.slice());
  let draft = $state(INITIAL.join(', '));
  let samples = $state(/** @type {number[]} */ ([]));
  let correct = $state(0);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(quicksortTrace(INITIAL, 'random', lcg(FIRST_SEED)));
  const frame = $derived(player.frame);
  const pivot = $derived(
    frame.kind === 'place'
      ? frame.items[frame.i + 1].value
      : frame.hi >= 0
        ? frame.items[frame.hi].value
        : 0,
  );
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, pivot));

  /** @param {() => number} [rand] */
  function rebuild(rand = Math.random) {
    notice = { text: '', at: -1 };
    player.load(quicksortTrace(values, rule, rand));
  }

  function resetRuns() {
    samples = [];
    correct = 0;
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function commitValues() {
    const parsed = parseValueList(draft, { max: MAX_VALUE, minN: MIN_N, maxN: MAX_N });
    if (!('values' in parsed)) {
      draft = values.join(', ');
      say(m.valuesError(MIN_N, MAX_N, MAX_VALUE));
      return;
    }
    if (parsed.values.join(',') === values.join(',')) return;
    values = parsed.values;
    preset = '';
    resetRuns();
    rebuild();
  }

  function changeRule() {
    resetRuns();
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    values = QUICK_PRESETS[p].slice();
    draft = values.join(', ');
    resetRuns();
    rebuild();
  }

  function runMany() {
    if (samples.length + RUN_BATCH > MAX_RUNS) {
      say(m.runsFull(MAX_RUNS));
      return;
    }
    const more = [];
    for (let t = 0; t < RUN_BATCH; t++) {
      const run = quicksortRun(values, rule);
      more.push(run.comparisons);
      if (run.sorted) correct++;
    }
    samples = [...samples, ...more];
  }

  /** Resting bars get a grey fill so they stand out from the white card. @param {BarRole} role */
  const barClass = (role) => (role === '' ? 'bg-slate-400' : STATE_BG[BAR_STATE[role]]);

  /** @param {number} i @returns {BarRole} */
  function roleOf(i) {
    const f = frame;
    if (f.placed[i]) return 'placed';
    if (f.hi < 0 || i < f.lo || i > f.hi) return '';
    if (f.kind === 'call') return '';
    if (i === f.hi && f.kind !== 'place') return 'pivot';
    if (f.kind === 'compare' && i === f.j) return 'compare';
    if (i <= f.i) return 'left';
    const scanned =
      f.kind === 'compare' ? f.j : f.kind === 'place' ? f.hi + 1 : f.j < 0 ? f.lo : f.j + 1;
    if (i < scanned) return 'right';
    return '';
  }

  const n = $derived(values.length);
  const expected = $derived(expectedComparisons(n));
  const hist = $derived(histogram(samples, BINS));
  const peak = $derived(Math.max(1, ...hist.counts));
  const mean = $derived(samples.length ? samples.reduce((s, x) => s + x, 0) / samples.length : 0);
  const span = $derived(hist.counts.length * hist.width);
  /** Position of a comparison count across the histogram, as a percentage. @param {number} x */
  const at = (x) => Math.max(0, Math.min(100, ((x - hist.from + hist.width / 2) / span) * 100));
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.values}
      <input
        type="text"
        name="values"
        class="field w-72 max-w-full tabular-nums"
        bind:value={draft}
        onchange={commitValues}
      />
    </label>
    <SegmentedControl
      legend={m.fields.rule}
      name="rule"
      options={RULES}
      bind:value={rule}
      onchange={changeRule}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(ev) => loadPreset(/** @type {Preset} */ (ev.currentTarget.value))}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-outline" onclick={() => rebuild()}>{m.reroll}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.barsTitle}
        </h2>
        <BarChart
          items={frame.items}
          stateOf={(i) => barClass(roleOf(i))}
          markerOf={(i) => m.barStates[roleOf(i)]}
          dimmed={(i) => frame.hi >= 0 && !frame.placed[i] && (i < frame.lo || i > frame.hi)}
          ariaLabel={m.barsAria(frame.items.map((it) => it.value))}
          speed={player.speed}
        />
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each LEGEND as role (role)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[BAR_STATE[role]]}"
              ></span>{m.legend[role]}
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

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.histTitle}
          </h2>
          <div class="flex gap-2">
            <button type="button" class="btn-primary" onclick={runMany}
              >{m.runMany(RUN_BATCH)}</button
            >
            <button type="button" class="btn-outline" onclick={resetRuns}>{m.clear}</button>
          </div>
        </div>
        {#if samples.length === 0}
          <p class="text-sm text-slate-500">{m.histEmpty}</p>
        {:else}
          <div class="relative" role="img" aria-label={m.histAria(samples.length)}>
            <div class="flex h-40 items-end gap-px" data-testid="histogram">
              {#each hist.counts as count, b (b)}
                {@const from = hist.from + b * hist.width}
                <div
                  class="flex-1 rounded-t bg-state-frontier"
                  style="height: {(count / peak) * 100}%"
                  title={m.binLabel(from, from + hist.width - 1, count)}
                ></div>
              {/each}
            </div>
            <div class="relative h-5 text-xs font-bold text-slate-900" aria-hidden="true">
              <span class="absolute -translate-x-1/2" style="left: {at(mean)}%">▲</span>
              <span class="absolute -translate-x-1/2" style="left: {at(expected)}%">◆</span>
            </div>
            <div class="flex justify-between text-xs text-slate-500 tabular-nums">
              <span>{hist.from}</span>
              <span>{hist.from + span - 1}</span>
            </div>
          </div>
          <p class="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-600">
            <span>{m.histMean}</span><span>{m.histExpected}</span>
          </p>
        {/if}
        <dl class="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
          <div>
            <dt class="text-xs text-slate-500">{m.runStats.runs}</dt>
            <dd class="font-bold tabular-nums" data-testid="runs">{samples.length}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">{m.runStats.mean}</dt>
            <dd class="font-bold tabular-nums" data-testid="mean">
              {samples.length ? m.oneDp(mean) : '—'}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">{m.runStats.min}</dt>
            <dd class="font-bold tabular-nums" data-testid="min">
              {samples.length ? Math.min(...samples) : '—'}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">{m.runStats.max}</dt>
            <dd class="font-bold tabular-nums" data-testid="max">
              {samples.length ? Math.max(...samples) : '—'}
            </dd>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <dt class="text-xs text-slate-500">{m.runStats.correct}</dt>
            <dd class="font-bold tabular-nums" data-testid="correct">
              {m.correctText(correct, samples.length)}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="comparisons">
            {frame.comparisons}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.swaps}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="swaps">{frame.swaps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.expected}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="expected">
            {m.oneDp(expected)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.worst}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="worst">
            {worstComparisons(n)}
          </dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.depth}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="depth">{frame.maxDepth}</dd>
        </div>
      </dl>
      <CodePanel lines={quicksortPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
