<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import HeapView from '$lib/components/heap-view.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import { heapsortPseudocode, heapsortTrace, parseHeapValues } from '$lib/algo-engine/heapsort.js';
  import { makeArray } from '$lib/algo-engine/sorting.js';
  import { en as m } from '$lib/lessons/heapsort/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.presets} Preset */

  const PRESETS = /** @type {Preset[]} */ (Object.keys(m.presets));
  // A fixed first array keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [35, 12, 58, 7, 91, 26, 44, 63, 19, 80];

  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let preset = $state(/** @type {Preset} */ ('random'));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(heapsortTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const n = $derived(frame.values.length);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {number[]} next */
  function load(next) {
    values = next;
    valuesText = next.join(', ');
    notice = { text: '', at: -1 };
    player.load(heapsortTrace(next));
  }

  function commitValues() {
    const parsed = parseHeapValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    load(parsed.values);
  }

  // makeArray reaches 100 at the top of its range; the field accepts up to 99.
  function loadPreset() {
    load(makeArray(preset, values.length).map((v) => Math.min(v, 99)));
    say(m.newArrayNotice);
  }

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    const k = frame.kind;
    if ((k === 'swap' || k === 'extract') && frame.focus.includes(i)) return 'swap';
    if ((k === 'compare' || k === 'children') && frame.focus.includes(i)) return 'compare';
    if (i === frame.node && i < frame.size) return 'active';
    if (i === frame.child) return 'frontier';
    return '';
  }

  /** @param {number} i */
  function markerOf(i) {
    const s = stateOf(i);
    if (s === 'swap') return m.markers.swap;
    if (i === frame.node && i < frame.size) return m.markers.node;
    if (i === frame.child) return m.markers.child;
    if (s === 'compare') return m.markers.compare;
    return i >= frame.size ? m.markers.sorted : '';
  }

  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['active', m.markers.node, m.legend.node],
    ['frontier', m.markers.child, m.legend.child],
    ['compare', m.markers.compare, m.legend.compare],
    ['swap', m.markers.swap, m.legend.swap],
    ['sorted', m.markers.sorted, m.legend.sorted],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-72 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select class="field" name="preset" bind:value={preset} onchange={loadPreset}>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-secondary" onclick={loadPreset}>{m.newArrayButton}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.heapTitle}
        </h2>
        <HeapView
          values={frame.values}
          size={frame.size}
          ariaLabel={frame.size > 0
            ? m.heapAria(frame.values, frame.size)
            : m.emptyHeapAria(frame.values)}
          {stateOf}
          {markerOf}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.phase}</dt>
          <dd class="text-lg font-bold">{m.phases[frame.phase]}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.size}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.size} / {n}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.swaps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.swaps}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.boundLabel(n)}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">
            {Math.round(2 * n * Math.log2(Math.max(1, n)))}
          </dd>
        </div>
      </dl>
      <CodePanel lines={heapsortPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
