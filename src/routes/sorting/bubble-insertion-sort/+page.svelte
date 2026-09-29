<script>
  import { flip } from 'svelte/animate';
  import { prefersReducedMotion } from 'svelte/motion';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    bubblePseudocode,
    bubbleSortTrace,
    insertionPseudocode,
    insertionSortTrace,
    makeArray,
    toItems,
  } from '$lib/algo-engine/sorting.js';
  import { en as m } from '$lib/lessons/bubble-insertion-sort/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {'bubble'|'insertion'} Algo */
  /** @typedef {keyof typeof m.presets} Preset */

  const ALGOS = /** @type {Algo[]} */ (['bubble', 'insertion']);
  const PRESETS = /** @type {Preset[]} */ (Object.keys(m.presets));
  const traces = { bubble: bubbleSortTrace, insertion: insertionSortTrace };
  const pseudocode = { bubble: bubblePseudocode, insertion: insertionPseudocode };

  let algo = $state(/** @type {Algo} */ ('bubble'));
  let preset = $state(/** @type {Preset} */ ('random'));
  let size = $state(12);
  // A fixed first array keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [42, 17, 88, 5, 63, 29, 71, 12, 95, 36, 54, 24];
  let values = $state(INITIAL);

  const player = createPlayer(traces.bubble(toItems(INITIAL)));
  const frame = $derived(player.frame);
  const maxValue = $derived(Math.max(...values, 1));
  // Final totals of both algorithms on the current array, for side-by-side comparison.
  const totals = $derived(
    ALGOS.map((a) => {
      const last = traces[a](toItems(values)).at(-1);
      return { algo: a, comparisons: last?.comparisons ?? 0, swaps: last?.swaps ?? 0 };
    }),
  );

  function rebuild() {
    player.load(traces[algo](toItems(values)));
  }

  function regenerate() {
    values = makeArray(preset, size);
    rebuild();
  }

  /** @param {number} i */
  function barState(i) {
    if (frame.focus.includes(i)) {
      if (frame.kind === 'swap') return 'swap';
      if (frame.kind === 'compare') return 'compare';
      if (frame.kind !== 'pass' && frame.kind !== 'pass-start') return 'key';
    }
    return frame.sorted.includes(i) ? 'sorted' : 'idle';
  }

  /** @type {Record<string, string>} */
  const barClass = {
    swap: 'bg-state-swap',
    compare: 'bg-state-compare',
    key: 'bg-state-active',
    sorted: 'bg-state-sorted',
    idle: 'bg-slate-400',
  };

  /** @type {Record<string, string>} */
  const barMarker = { swap: m.markers.swap, compare: m.markers.compare, sorted: m.markers.sorted };

  const legend = $derived([
    ['bg-state-compare', `${m.markers.compare} ${m.legend.compare}`],
    ['bg-state-swap', `${m.markers.swap} ${m.legend.swap}`],
    ...(algo === 'insertion' ? [['bg-state-active', m.legend.key]] : []),
    ['bg-state-sorted', `${m.markers.sorted} ${m.legend.sorted}`],
  ]);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.algorithmLabel}
      name="algo"
      options={ALGOS.map((a) => ({ value: a, label: m.algorithms[a] }))}
      bind:value={algo}
      onchange={rebuild}
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
      <input type="range" min="5" max="30" bind:value={size} onchange={regenerate} class="accent-teal-700" />
    </label>

    <button onclick={regenerate} class="btn-secondary">{m.shuffle}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="flex h-72 gap-1" role="img" aria-label={m.barsLabel(frame.items.map((it) => it.value), frame.sorted.length)}>
          {#each frame.items as item, i (item.id)}
            {@const state = barState(i)}
            <!-- Label, bar area, and marker are separate rows so the bar height is a true share of its own area. -->
            <div class="flex min-w-0 flex-1 flex-col" animate:flip={{ duration: prefersReducedMotion.current ? 0 : 200 }}>
              <span class="h-5 shrink-0 text-center text-xs text-slate-600 tabular-nums">{frame.items.length <= 20 ? item.value : ''}</span>
              <div class="relative flex-1">
                <div class="absolute inset-x-0 bottom-0 rounded-t transition-colors {barClass[state]}" style="height: {(item.value / maxValue) * 100}%"></div>
              </div>
              <span class="h-5 shrink-0 text-center text-sm leading-5 font-bold text-slate-700">{barMarker[state] ?? ''}</span>
            </div>
          {/each}
        </div>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [cls, label] (label)}
            <li class="flex items-center gap-1.5"><span class="size-3 rounded-sm {cls}"></span>{label}</li>
          {/each}
        </ul>
      </div>

      <p class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800" aria-live={player.playing ? 'off' : 'polite'}>
        {m.describe(frame, algo)}
      </p>

      <StepControls {player} />
    </div>

    <div class="flex flex-col gap-4">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.swaps[algo]}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.swaps}</dd>
        </div>
      </dl>
      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <dl class="space-y-1">
          {#each totals as row (row.algo)}
            <div class="flex justify-between gap-2 {row.algo === algo ? 'font-semibold text-slate-900' : 'text-slate-600'}">
              <dt>{m.algorithms[row.algo]}</dt>
              <dd class="tabular-nums">{m.compareRow(row.comparisons, row.swaps, m.swaps[row.algo])}</dd>
            </div>
          {/each}
        </dl>
      </section>
      <CodePanel lines={pseudocode[algo]} active={frame.lines} />
    </div>
  </div>
</LessonLayout>
