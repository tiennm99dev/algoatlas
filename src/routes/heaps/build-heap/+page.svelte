<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { heapForest } from '$lib/components/tree-layout.js';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    SIZES,
    buildHeapTrace,
    buildPseudocode,
    depthOf,
    levelCaps,
    makeBuildValues,
    parseBuildValues,
  } from '$lib/algo-engine/build-heap.js';
  import { en as m } from '$lib/lessons/build-heap/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/build-heap.js').BuildMethod} BuildMethod */
  /** @typedef {import('$lib/algo-engine/build-heap.js').BuildPreset} BuildPreset */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PRESETS = /** @type {BuildPreset[]} */ (Object.keys(m.presets));
  const METHOD_OPTIONS = /** @type {BuildMethod[]} */ (['bottom-up', 'one-by-one']).map(
    (value) => ({ value, label: m.methods[value] }),
  );
  // A fixed first array keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [53, 21, 87, 9, 64, 38, 75, 12, 46, 95, 30, 68, 5, 81, 17];

  let values = $state.raw(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let method = $state(/** @type {BuildMethod} */ ('bottom-up'));
  let preset = $state(/** @type {BuildPreset} */ ('random'));
  let size = $state(String(INITIAL.length));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(buildHeapTrace(INITIAL, 'bottom-up'));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const n = $derived(frame.values.length);
  const totals = $derived({
    bottomUp: /** @type {import('$lib/algo-engine/build-heap.js').BuildHeapFrame} */ (
      buildHeapTrace(values, 'bottom-up').at(-1)
    ).swaps,
    oneByOne: /** @type {import('$lib/algo-engine/build-heap.js').BuildHeapFrame} */ (
      buildHeapTrace(values, 'one-by-one').at(-1)
    ).swaps,
  });
  const caps = $derived(levelCaps(n, frame.method));
  const bound = $derived(caps.reduce((s, c) => s + c.nodes * c.cap, 0));
  const startDepth = $derived(frame.start >= 0 ? depthOf(frame.start) : -1);
  /** Slots drawn in the tree: one by one shows only the heap built so far. */
  const treeSize = $derived(
    frame.method === 'one-by-one' && frame.kind !== 'done'
      ? Math.max(frame.region, frame.start + 1)
      : n,
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(buildHeapTrace(values, method));
  }

  /** @param {number[]} next */
  function load(next) {
    values = next;
    valuesText = next.join(', ');
    rebuild();
  }

  function commitValues() {
    const parsed = parseBuildValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    load(parsed.values);
  }

  function newArray() {
    load(makeBuildValues(preset, Number(size), Math.random));
    say(m.newArrayNotice);
  }

  /** @param {number} i */
  const waiting = (i) => frame.method === 'one-by-one' && i >= treeSize;

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    const k = frame.kind;
    if ((k === 'swap' || k === 'up-swap') && frame.focus.includes(i)) return 'swap';
    if ((k === 'compare' || k === 'up-compare' || k === 'children') && frame.focus.includes(i)) {
      if (k === 'children' && i === frame.other) return 'frontier';
      return i === frame.node ? 'active' : 'compare';
    }
    if (i === frame.node && k !== 'done') return 'active';
    if (frame.method === 'bottom-up' && i >= frame.region && 2 * i + 1 < n) return 'visited';
    return '';
  }

  /** @param {number} i */
  function markerOf(i) {
    const s = stateOf(i);
    return s ? m.markers[/** @type {keyof typeof m.markers} */ (s)] : '';
  }

  /** @param {number} i */
  function slotLabel(i) {
    const s = stateOf(i);
    const state = waiting(i)
      ? m.states.waiting
      : s
        ? m.states[/** @type {keyof typeof m.states} */ (s)]
        : '';
    return m.slotLabel(i, frame.values[i], state);
  }

  const forest = $derived(
    heapForest(frame.values, treeSize, (i) => ({
      state: stateOf(i),
      marker: markerOf(i),
      note: `[${i}]`,
    })),
  );

  const legend = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
    }}
  >
    <SegmentedControl
      legend={m.methodLabel}
      name="method"
      options={METHOD_OPTIONS}
      bind:value={method}
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
      {m.sizeLabel}
      <select class="field" name="size" bind:value={size} onchange={newArray}>
        {#each SIZES as s (s)}
          <option value={String(s)}>{s}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select class="field" name="preset" bind:value={preset} onchange={newArray}>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-secondary" onclick={newArray}>{m.newArrayButton}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.heapTitle}
        </h2>
        <div class="flex flex-col gap-3">
          <TreeView
            roots={forest}
            binary
            ariaLabel={m.heapAria(frame.values, treeSize, frame.method)}
            labelOf={(node) => slotLabel(Number(node.id))}
            speed={player.speed}
          />
          <ArrayStrip
            values={frame.values}
            ariaLabel={m.arrayAria(frame.values)}
            {stateOf}
            {markerOf}
            labelOf={slotLabel}
            dimmed={waiting}
            speed={player.speed}
          />
        </div>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {m.markers[s]}
              {m.legend[s]}
            </li>
          {/each}
          {#if frame.method === 'one-by-one'}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-400 bg-white opacity-40"></span>
              {m.waitingLegend}
            </li>
          {/if}
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
          <dt class="text-xs text-slate-500">{m.stats.bottomUp(n)}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{totals.bottomUp}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.oneByOne(n)}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{totals.oneByOne}</dd>
        </div>
      </dl>

      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.levelsTitle}</h2>
        <table class="w-full text-right text-sm tabular-nums">
          <thead>
            <tr class="text-xs text-slate-500">
              {#each m.levelHead as h, j (h)}
                <th scope="col" class="px-1 py-1 font-medium {j === 0 ? 'text-left' : ''}">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each caps as c (c.depth)}
              <tr
                class="border-t border-slate-100 {c.depth === startDepth
                  ? 'bg-slate-100 font-semibold'
                  : ''}"
              >
                <th scope="row" class="px-1 py-1 text-left font-medium">
                  {m.levelName(c.depth)}{c.depth === startDepth ? ' ◀' : ''}
                </th>
                <td class="px-1 py-1">{c.nodes}</td>
                <td class="px-1 py-1">{c.cap}</td>
                <td class="px-1 py-1">{c.nodes * c.cap}</td>
                <td class="px-1 py-1">{frame.levelMoves[c.depth]}</td>
              </tr>
            {/each}
            <tr class="border-t-2 border-slate-300 font-bold">
              <th scope="row" class="px-1 py-1 text-left">{m.totalRow}</th>
              <td class="px-1 py-1">{n}</td>
              <td class="px-1 py-1"></td>
              <td class="px-1 py-1">{bound}</td>
              <td class="px-1 py-1">{frame.swaps}</td>
            </tr>
          </tbody>
        </table>
        <p class="mt-2 text-xs text-slate-600">{m.levelsNote(frame.method)}</p>
      </div>
      <CodePanel lines={buildPseudocode(frame.method)} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
