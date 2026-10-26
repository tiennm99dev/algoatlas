<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_VALUE,
    MIN_VALUE,
    linearPseudocode,
    linearSearchTrace,
    makeUnsortedArray,
    parseValues,
  } from '$lib/algo-engine/linear-search.js';
  import { en as m } from '$lib/lessons/linear-search/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/linear-search.js').LinearVariant} LinearVariant */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const VARIANTS = /** @type {LinearVariant[]} */ (['plain', 'sentinel']);

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [31, 8, 52, 19, 77, 40, 63, 25, 90, 14];
  const INITIAL_TARGET = 63;

  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let target = $state(INITIAL_TARGET);
  /** @type {number | null} */
  let draft = $state(INITIAL_TARGET);
  let variant = $state(/** @type {LinearVariant} */ ('plain'));

  const player = createPlayer(linearSearchTrace(INITIAL, INITIAL_TARGET, 'plain'));
  const frame = $derived(player.frame);
  const n = $derived(values.length);
  const sentinel = $derived(variant === 'sentinel');
  const finals = $derived(
    VARIANTS.map((v) => ({ v, f: linearSearchTrace(values, target, v).at(-1) })),
  );

  let notice = $state({ text: '', at: -1 });
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, values, target),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(linearSearchTrace(values, target, variant));
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

  function commitTarget() {
    const x = draft;
    if (x === null || !Number.isInteger(x) || x < MIN_VALUE || x > MAX_VALUE) {
      draft = target;
      say(m.targetError);
      return;
    }
    target = x;
    rebuild();
  }

  /** @param {number} x */
  function setTarget(x) {
    target = x;
    draft = x;
    rebuild();
  }

  /** @param {number} i */
  function pickCell(i) {
    if (i >= n) return;
    setTarget(values[i]);
    say(m.pickedNotice(values[i]));
  }

  function newArray() {
    values = makeUnsortedArray(n);
    valuesText = values.join(', ');
    setTarget(values[Math.floor(Math.random() * n)]);
  }

  function missing() {
    const present = new Set(values);
    let x;
    do x = Math.floor(Math.random() * 90) + 10;
    while (present.has(x));
    setTarget(x);
  }

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (i === n) return frame.i === n ? 'compare' : 'frontier';
    if (i === frame.i) return frame.match ? 'sorted' : 'compare';
    if (i < frame.i) return 'visited';
    return '';
  }

  /** @param {number} i */
  function markerOf(i) {
    if (i === n) return m.markers.frontier;
    if (i === frame.i) return frame.match ? m.markers.sorted : m.markers.compare;
    return i < frame.i ? m.markers.visited : '';
  }

  /** @param {number} i */
  function labelOf(i) {
    if (i === n) return m.sentinelLabel(n, target);
    const s =
      i === frame.i
        ? frame.match
          ? m.cellStates.found
          : m.cellStates.compare
        : i < frame.i
          ? m.cellStates.checked
          : '';
    return m.cellLabel(i, values[i], s);
  }

  const shown = $derived(sentinel ? [...values, target] : values);
  const pointers = $derived(frame.i >= 0 ? [{ name: 'i', index: frame.i }] : []);
  const legend = $derived(
    /** @type {[VisualState, string, string][]} */ ([
      ['compare', m.markers.compare, m.legend.compare],
      ['visited', m.markers.visited, m.legend.visited],
      ['sorted', m.markers.sorted, m.legend.sorted],
      ...(sentinel
        ? /** @type {[VisualState, string, string][]} */ ([
            ['frontier', m.markers.frontier, m.legend.frontier],
          ])
        : []),
    ]),
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
      commitTarget();
    }}
  >
    <SegmentedControl
      legend={m.variantLabel}
      name="variant"
      options={VARIANTS.map((v) => ({ value: v, label: m.variants[v] }))}
      bind:value={variant}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-80 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.targetLabel}
      <input
        type="number"
        name="target"
        min={MIN_VALUE}
        max={MAX_VALUE}
        class="field w-24"
        bind:value={draft}
        onchange={commitTarget}
      />
    </label>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="btn-secondary" onclick={newArray}>{m.newArray}</button>
      <button type="button" class="btn-outline" onclick={() => setTarget(values[0])}
        >{m.targetFirst}</button
      >
      <button type="button" class="btn-outline" onclick={() => setTarget(values[n - 1])}
        >{m.targetLast}</button
      >
      <button type="button" class="btn-outline" onclick={missing}>{m.targetMissing}</button>
    </div>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ArrayStrip
          values={shown}
          ariaLabel={m.arrayLabel(values, sentinel, target)}
          {stateOf}
          {markerOf}
          {labelOf}
          {pointers}
          onselect={pickCell}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              <span class="font-bold text-slate-900">{marker}</span>
              {label}
            </li>
          {/each}
        </ul>
        <p class="mt-2 text-xs text-slate-500">{m.selectHint}</p>
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
          <dd class="text-2xl font-bold tabular-nums" data-testid="comparisons">
            {frame.comparisons}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.boundChecks}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="bound-checks">
            {frame.boundChecks}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.total}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="total">
            {frame.comparisons + frame.boundChecks}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.worst}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums" data-testid="worst">
            {sentinel ? n + 1 : n}
          </dd>
        </div>
      </dl>

      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {#each finals as { v, f } (v)}
            <dt class="font-semibold {v === variant ? 'text-teal-800' : 'text-slate-600'}">
              {m.variants[v]}
            </dt>
            <dd class="tabular-nums" data-testid="final-{v}">
              {m.compareRow(f?.comparisons ?? 0, f?.boundChecks ?? 0)}
            </dd>
          {/each}
        </dl>
      </section>

      <CodePanel lines={linearPseudocode[variant]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
