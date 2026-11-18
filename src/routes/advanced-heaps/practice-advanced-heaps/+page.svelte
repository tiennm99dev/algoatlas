<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_BATCH,
    MAX_SIZE_BITS,
    MAX_V,
    MAX_W,
    MIN_V,
    UNIVERSE_BITS,
    dijkstraOps,
    dijkstraRace,
    leaders,
    makeGraph,
    maxEdges,
    mixRace,
    opCost,
    racePseudocode,
  } from '$lib/algo-engine/practice-advanced-heaps.js';
  import { vi as m } from '$lib/lessons/practice-advanced-heaps/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-advanced-heaps.js').RaceMode} RaceMode */
  /** @typedef {import('$lib/algo-engine/practice-advanced-heaps.js').Costs} Costs */
  /** @typedef {import('$lib/algo-engine/practice-advanced-heaps.js').QueueOpType} QueueOpType */

  // Fixed defaults keep the prerendered HTML and the hydrated page identical.
  const DEFAULTS = {
    v: 12,
    e: 40,
    w: 20,
    seed: 2,
    sizeBits: 10,
    inserts: 4,
    decreases: 8,
    extracts: 4,
    bits: 16,
  };
  const MODE_OPTIONS = /** @type {RaceMode[]} */ (['dijkstra', 'mix']).map((value) => ({
    value,
    label: m.modes[value],
  }));
  const UNIVERSE_OPTIONS = UNIVERSE_BITS.map((b) => ({
    value: String(b),
    label: m.universeOption(b),
  }));
  const QUEUES = /** @type {(keyof Costs)[]} */ (['binary', 'fibonacci', 'veb']);
  const OP_TYPES = /** @type {QueueOpType[]} */ (['insert', 'decrease', 'extract']);

  let mode = $state(/** @type {RaceMode} */ ('dijkstra'));
  let v = $state(DEFAULTS.v);
  let e = $state(DEFAULTS.e);
  let w = $state(DEFAULTS.w);
  let seed = $state(DEFAULTS.seed);
  let sizeBits = $state(DEFAULTS.sizeBits);
  let inserts = $state(DEFAULTS.inserts);
  let decreases = $state(DEFAULTS.decreases);
  let extracts = $state(DEFAULTS.extracts);
  let bitsText = $state(String(DEFAULTS.bits));
  const bits = $derived(Number(bitsText));

  /** The trace for the current settings. */
  function build() {
    const b = Number(bitsText);
    return mode === 'dijkstra'
      ? dijkstraRace(dijkstraOps(v, makeGraph(v, e, w, seed)), b)
      : mixRace({ sizeBits, inserts, decreases, extracts }, b);
  }

  const player = createPlayer(
    dijkstraRace(
      dijkstraOps(DEFAULTS.v, makeGraph(DEFAULTS.v, DEFAULTS.e, DEFAULTS.w, DEFAULTS.seed)),
      DEFAULTS.bits,
    ),
  );
  const frame = $derived(player.frame);
  const final = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(m.describe(frame, { v, e }, bits));
  const lead = $derived(frame.kind === 'start' ? [] : leaders(frame));
  // Bars share one scale, the largest final total, so they grow as the run is stepped.
  const scale = $derived(Math.max(1, ...QUEUES.map((q) => final.total[q])));
  const edgeMax = $derived(maxEdges(v));

  function rebuild() {
    player.load(build());
  }

  function changeVertices() {
    e = Math.min(Math.max(e, v - 1), maxEdges(v));
    rebuild();
  }

  function newGraph() {
    seed = 1 + Math.floor(Math.random() * 999);
    rebuild();
  }

  function resetSettings() {
    v = DEFAULTS.v;
    e = DEFAULTS.e;
    w = DEFAULTS.w;
    seed = DEFAULTS.seed;
    sizeBits = DEFAULTS.sizeBits;
    inserts = DEFAULTS.inserts;
    decreases = DEFAULTS.decreases;
    extracts = DEFAULTS.extracts;
    bitsText = String(DEFAULTS.bits);
    rebuild();
  }

  /** @param {keyof Costs} q */
  const fits = (q) => q !== 'veb' || frame.fits;

  /** The size the per-operation table charges at. */
  const costSize = $derived(mode === 'mix' ? 2 ** sizeBits : Math.max(1, frame.size));

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
  const legend = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={MODE_OPTIONS}
      bind:value={mode}
      onchange={rebuild}
    />
    {#if mode === 'dijkstra'}
      <label class={labelClass}>
        {m.verticesLabel}: {v}
        <input
          type="range"
          name="vertices"
          min={MIN_V}
          max={MAX_V}
          bind:value={v}
          onchange={changeVertices}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
      <label class={labelClass}>
        {m.edgesLabel}: {e}
        <input
          type="range"
          name="edges"
          min={v - 1}
          max={edgeMax}
          bind:value={e}
          onchange={rebuild}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
      <label class={labelClass}>
        {m.weightLabel}: {w}
        <input
          type="range"
          name="weight"
          min="1"
          max={MAX_W}
          bind:value={w}
          onchange={rebuild}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-slate-500">{m.graphName(seed)}</span>
        <button type="button" class="btn-secondary" onclick={newGraph}>{m.newGraph}</button>
      </div>
    {:else}
      <label class={labelClass}>
        {m.sizeLabel}: {m.power(sizeBits)}
        <input
          type="range"
          name="size"
          min="1"
          max={MAX_SIZE_BITS}
          bind:value={sizeBits}
          onchange={rebuild}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
      <label class={labelClass}>
        {m.insertsLabel}: {inserts}
        <input
          type="range"
          name="inserts"
          min="0"
          max={MAX_BATCH}
          bind:value={inserts}
          onchange={rebuild}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
      <label class={labelClass}>
        {m.decreasesLabel}: {decreases}
        <input
          type="range"
          name="decreases"
          min="0"
          max={MAX_BATCH}
          bind:value={decreases}
          onchange={rebuild}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
      <label class={labelClass}>
        {m.extractsLabel}: {extracts}
        <input
          type="range"
          name="extracts"
          min="0"
          max={MAX_BATCH}
          bind:value={extracts}
          onchange={rebuild}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
    {/if}
    <SegmentedControl
      legend={m.universeLabel}
      name="universe"
      options={UNIVERSE_OPTIONS}
      bind:value={bitsText}
      onchange={rebuild}
    />
    <button type="button" class="btn-outline" onclick={resetSettings}>{m.resetSettings}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.raceTitle}
        </h2>
        <ul class="flex flex-col gap-3" aria-label={m.raceAria(frame)}>
          {#each QUEUES as q (q)}
            {@const ok = fits(q)}
            {@const best = ok && lead.includes(q)}
            <li data-queue={q}>
              <div class="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span class="font-semibold text-slate-800">{m.queues[q]}</span>
                <span class="text-slate-600 tabular-nums">
                  <span class="text-lg font-bold text-slate-900">{m.total(frame.total[q])}</span>
                  {#if frame.step[q] > 0}<span class="ml-1 text-xs"
                      >{m.stepNote(frame.step[q])}</span
                    >{/if}
                </span>
              </div>
              <div class="h-4 w-full overflow-hidden rounded bg-slate-100">
                <div
                  class="h-full rounded {ok
                    ? best
                      ? STATE_BG.sorted
                      : STATE_BG.active
                    : STATE_BG.pruned} {player.speed < 8 ? 'transition-all' : ''}"
                  style="width: {(100 * frame.total[q]) / scale}%"
                ></div>
              </div>
              {#if !ok}
                <p class="mt-1 text-xs text-slate-600">{m.noFit}</p>
              {:else if best}
                <p class="mt-1 text-xs font-semibold text-emerald-800">{m.leader}</p>
              {/if}
            </li>
          {/each}
        </ul>
        <ul class="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {m.markers[s]}
              {m.legend[s]}
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

      <div class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.modelTitle}
        </h2>
        <ul class="list-disc space-y-1 pl-5">
          {#each m.model as line (line)}
            <li>{line}</li>
          {/each}
        </ul>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.inserts}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.counts.insert}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.decreases}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.counts.decrease}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.extracts}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.counts.extract}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.size}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.size} ({frame.maxSize})
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.maxKey}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.maxKey >= 0 ? frame.maxKey : m.noKeys}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.memory}</dt>
          <dd class="text-lg font-bold tabular-nums">{m.power(bits)}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-1 text-xs text-slate-500">{m.costTitle}</h2>
        <table class="w-full text-sm tabular-nums">
          <thead>
            <tr class="text-left text-xs text-slate-500">
              {#each m.costHead as h (h)}<th class="py-1 font-medium">{h}</th>{/each}
            </tr>
          </thead>
          <tbody>
            {#each OP_TYPES as t (t)}
              {@const c = opCost(t, costSize, bits)}
              <tr class="border-t border-slate-100">
                <th class="py-1 text-left font-normal text-slate-700">{m.opNames[t]}</th>
                <td>{c.binary}</td>
                <td>{c.fibonacci}</td>
                <td>{c.veb}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <p class="mt-1 text-xs text-slate-500">{m.costCaption(costSize)}</p>
      </div>
      <CodePanel lines={racePseudocode(mode)} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
