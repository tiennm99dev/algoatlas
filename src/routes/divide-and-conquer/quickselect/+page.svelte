<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_N,
    MAX_VALUE,
    parseSelectValues,
    selectPseudocode,
    selectTrace,
  } from '$lib/algo-engine/quickselect.js';
  import { en as m } from '$lib/lessons/quickselect/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/quickselect.js').PivotRule} PivotRule */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.presets} PresetKey */

  const SORTED = [3, 8, 14, 21, 27, 35, 42, 50, 58, 66, 73, 81];
  /** @type {Record<PresetKey, number[]>} */
  const PRESETS = {
    example: [38, 12, 77, 5, 64, 29, 91, 46, 18, 83, 55, 3],
    sorted: SORTED,
    reversed: SORTED.slice().reverse(),
    duplicates: [5, 3, 5, 1, 3, 5, 1, 3, 5, 3],
  };
  const PRESET_KEYS = /** @type {PresetKey[]} */ (Object.keys(PRESETS));
  const RULES = /** @type {PivotRule[]} */ (['last', 'random', 'mom']);

  /** Fixed generator for the first random-pivot trace, so prerendering and hydration agree. */
  function firstRand() {
    let s = 7;
    return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  }

  /** @param {number[]} values @param {number} k @param {() => number} rand */
  function build(values, k, rand) {
    return {
      last: selectTrace(values, k, 'last'),
      random: selectTrace(values, k, 'random', rand),
      mom: selectTrace(values, k, 'mom'),
    };
  }

  // A fixed first array keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = PRESETS.example;
  const INITIAL_K = 6;
  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let k = $state(INITIAL_K);
  /** @type {number | null} */
  let kDraft = $state(INITIAL_K);
  let rule = $state(/** @type {PivotRule} */ ('last'));
  let preset = $state('example');
  let notice = $state({ text: '', at: -1 });

  const first = build(INITIAL, INITIAL_K, firstRand());
  let traces = $state.raw(first);
  const player = createPlayer(first.last);
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, rule));
  const pseudocode = $derived(selectPseudocode(rule));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {number[]} nextValues @param {number} nextK */
  function load(nextValues, nextK) {
    values = nextValues;
    valuesText = nextValues.join(', ');
    k = nextK;
    kDraft = nextK;
    notice = { text: '', at: -1 };
    traces = build(nextValues, nextK, Math.random);
    player.load(traces[rule]);
  }

  function commitValues() {
    const parsed = parseSelectValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.errors[parsed.error]);
      return;
    }
    if (parsed.values.join() === values.join()) return;
    preset = '';
    load(parsed.values, Math.min(k, parsed.values.length));
  }

  function commitK() {
    const v = kDraft;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > values.length) {
      kDraft = k;
      say(m.kError(values.length));
      return;
    }
    if (v === k) return;
    load(values, v);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const key = /** @type {PresetKey} */ (e.currentTarget.value);
    preset = key;
    load(PRESETS[key], Math.min(k, PRESETS[key].length));
    say(m.newArrayNotice);
  }

  function randomArray() {
    const size = 8 + Math.floor(Math.random() * (MAX_N - 7));
    preset = '';
    const next = Array.from({ length: size }, () => Math.floor(Math.random() * (MAX_VALUE + 1)));
    load(next, Math.min(k, size));
    say(m.newArrayNotice);
  }

  // The random rule gets a fresh draw each time it is picked; the other traces are kept.
  function switchRule() {
    if (rule === 'random') traces = { ...traces, random: selectTrace(values, k, 'random') };
    notice = { text: '', at: -1 };
    player.load(traces[rule]);
    say(m.ruleNotice(m.rules[rule]));
  }

  const scanning = $derived(frame.kind === 'scan' || frame.kind === 'swap');
  const grouping = $derived(frame.kind === 'groups' || frame.kind === 'medians');

  /** @param {number} i @returns {'pivot'|'compare'|'swap'|'low'|'median'|'answer'|''} */
  function cellKind(i) {
    if (frame.answer === i) return 'answer';
    if (frame.kind === 'swap' && (i === frame.i || i === frame.j)) return 'swap';
    if (i === frame.pivot) return 'pivot';
    if (frame.kind === 'place' && i === frame.placed) return 'pivot';
    if (frame.kind === 'scan' && i === frame.j) return 'compare';
    if (grouping && frame.groups.some((g) => g.median === i)) return 'median';
    if ((scanning || frame.kind === 'pivot') && i >= frame.lo && i <= frame.i) return 'low';
    return '';
  }

  /** @type {Record<string, VisualState>} */
  const STATE = {
    pivot: 'active',
    compare: 'compare',
    swap: 'swap',
    low: 'visited',
    median: 'frontier',
    answer: 'sorted',
    '': '',
  };
  /** @type {Record<string, string>} */
  const MARK = m.markers;

  /** @param {number} i */
  function dimmed(i) {
    if (frame.kind === 'done' || frame.kind === 'found') return i !== frame.answer;
    return i < frame.lo || i > frame.hi;
  }

  const pointers = $derived.by(() => {
    const list = [{ name: m.targetPointer, index: frame.k - 1 }];
    if (frame.kind === 'done' || frame.kind === 'found') return list;
    list.push({ name: 'lo', index: frame.lo }, { name: 'hi', index: frame.hi });
    if (scanning) list.push({ name: 'j', index: frame.j });
    return list;
  });
  const windows = $derived(
    grouping
      ? frame.groups.map((g, t) => ({ from: g.from, to: g.to, label: m.groupLabel(t) }))
      : [],
  );
  const sizeChips = $derived(
    frame.sizes.map((s, t) => ({ label: String(s), hot: t === frame.sizes.length - 1 })),
  );
  const totals = $derived(RULES.map((r) => ({ rule: r, last: traces[r].at(-1) })));
  const legend = /** @type {const} */ (['pivot', 'compare', 'swap', 'low', 'median', 'answer']);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
      commitK();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <label
      class="flex min-w-0 grow flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
    >
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        inputmode="numeric"
        class="field w-full max-w-md font-mono"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.kLabel}
      <input
        type="number"
        name="k"
        min="1"
        max={values.length}
        step="1"
        class="field w-20"
        bind:value={kDraft}
        onchange={commitK}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={randomArray}>{m.shuffle}</button>
  </form>
  <div class="mb-4">
    <SegmentedControl
      legend={m.ruleLabel}
      name="rule"
      options={RULES.map((r) => ({ value: r, label: m.rules[r] }))}
      bind:value={rule}
      onchange={switchRule}
    />
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ArrayStrip
          values={frame.values}
          ariaLabel={m.arrayAria(frame.values, frame.lo, frame.hi)}
          stateOf={(i) => STATE[cellKind(i)]}
          markerOf={(i) => MARK[cellKind(i)] ?? ''}
          {dimmed}
          {pointers}
          {windows}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[STATE[s]]}"></span>
              {MARK[s]}
              {m.legend[s]}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-300 bg-white opacity-40"></span>
            {m.legend.faded}
          </li>
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
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.swaps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.swaps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.rounds}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.sizes.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.live}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.kind === 'done' || frame.kind === 'found' ? 1 : frame.hi - frame.lo + 1}
          </dd>
        </div>
      </dl>
      <ChipList title={m.sizesTitle} items={sizeChips} emptyText={m.sizesEmpty} />
      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <dl class="space-y-1.5">
          {#each totals as row (row.rule)}
            <div
              class="flex flex-wrap justify-between gap-x-2 {row.rule === rule
                ? 'font-semibold text-slate-900'
                : 'text-slate-600'}"
            >
              <dt>{m.rules[row.rule]}</dt>
              <dd class="tabular-nums">{m.compareRow(row.last?.comparisons ?? 0)}</dd>
              {#if row.rule === 'mom'}
                <dd class="w-full text-xs font-normal text-slate-500">
                  {m.pivotCost(row.last?.pivotComparisons ?? 0)}
                </dd>
              {/if}
            </div>
          {/each}
          <div class="flex flex-wrap justify-between gap-x-2 text-slate-600">
            <dt>{m.sortLabel}</dt>
            <dd class="tabular-nums">{m.sortRow(values.length)}</dd>
          </div>
        </dl>
      </section>
      <CodePanel lines={pseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
