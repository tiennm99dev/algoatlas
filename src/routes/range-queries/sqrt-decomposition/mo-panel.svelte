<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MO_MAX_N,
    formatQueries,
    moPseudocode,
    moTrace,
    parseQueries,
    parseValues,
  } from '$lib/algo-engine/sqrt-decomposition.js';
  import { en as m } from '$lib/lessons/sqrt-decomposition/copy.en.js';
  import { MO_PRESETS } from './start-inputs.js';

  /** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').MoFrame} MoFrame */
  /** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').MoQuery} MoQuery */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /**
   * The offline half of the lesson: Mo's algorithm counting distinct values. The page owns the
   * player and the inputs so they survive a switch to the other half.
   * @type {{
   *   player: ReturnType<typeof import('$lib/player/player.svelte.js').createPlayer<MoFrame>>,
   *   values: number[],
   *   queries: MoQuery[],
   *   preset: string,
   *   controls: import('svelte').Snippet,
   * }}
   */
  let {
    player,
    values = $bindable(),
    queries = $bindable(),
    preset = $bindable(),
    controls,
  } = $props();

  // The fields start from what the page kept; later edits flow back through the bindings.
  let valuesText = $state(values.join(', '));
  let queriesText = $state(formatQueries(queries));
  let notice = $state({ text: '', at: -1 });

  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describeMo(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(moTrace(values, queries));
  }

  function commitValues() {
    const parsed = parseValues(valuesText, MO_MAX_N);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error](MO_MAX_N));
      return;
    }
    const last = parsed.values.length - 1;
    // Keep the queries inside the new array; a query entirely past the end is dropped.
    const kept = queries.flatMap((q) => (q.l > last ? [] : [{ l: q.l, r: Math.min(q.r, last) }]));
    values = parsed.values;
    valuesText = values.join(', ');
    queries = kept.length > 0 ? kept : [{ l: 0, r: last }];
    queriesText = formatQueries(queries);
    preset = '';
    rebuild();
  }

  function commitQueries() {
    const parsed = parseQueries(queriesText, values.length);
    if ('error' in parsed) {
      queriesText = formatQueries(queries);
      say(m.queryErrors[parsed.error](values.length));
      return;
    }
    queries = parsed.queries;
    queriesText = formatQueries(queries);
    preset = '';
    rebuild();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {keyof typeof MO_PRESETS} */ (e.currentTarget.value);
    preset = picked;
    values = MO_PRESETS[picked].values;
    queries = MO_PRESETS[picked].queries;
    valuesText = values.join(', ');
    queriesText = formatQueries(queries);
    rebuild();
  }

  const running = $derived(frame.current >= 0 ? frame.order[frame.current] : -1);
  const target = $derived(running >= 0 ? frame.queries[running] : null);
  const adding = $derived(frame.kind === 'add-left' || frame.kind === 'add-right');
  const removing = $derived(frame.kind === 'remove-left' || frame.kind === 'remove-right');

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (adding && i === frame.at) return 'swap';
    if (removing && i === frame.at) return 'compare';
    return i >= frame.curL && i <= frame.curR ? 'frontier' : '';
  }

  /** @param {number} i */
  function markerOf(i) {
    if (adding && i === frame.at) return m.markers.add;
    if (removing && i === frame.at) return m.markers.remove;
    return '';
  }

  const pointers = $derived(
    frame.curR >= frame.curL
      ? [
          { name: m.markers.left, index: frame.curL },
          { name: m.markers.right, index: frame.curR },
        ]
      : [],
  );

  const windows = $derived.by(() => {
    const out = [];
    for (let from = 0; from < frame.items.length; from += frame.blockSize) {
      out.push({
        from,
        to: Math.min(frame.items.length, from + frame.blockSize),
        label: m.blockName(from / frame.blockSize),
      });
    }
    if (target) {
      out.push({ from: target.l, to: target.r + 1, label: m.targetWindow(running) });
    }
    return out;
  });

  const queryChips = $derived(
    frame.order.map((k, position) => ({
      label: m.queryChip(k, frame.queries[k], frame.answers[k], frame.blockSize),
      hot: position === frame.current,
    })),
  );
  const countChips = $derived(frame.counts.map(([v, c]) => ({ label: m.countChip(v, c) })));

  const legend = /** @type {[VisualState, string][]} */ ([
    ['frontier', m.legend.window],
    ['swap', m.legend.added],
    ['compare', m.legend.removed],
  ]);
</script>

<form class="mb-4 flex flex-wrap items-end gap-4" onsubmit={(e) => e.preventDefault()}>
  <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
    {m.valuesLabel}
    <input
      type="text"
      name="mo-values"
      class="field w-72 max-w-full"
      bind:value={valuesText}
      onchange={commitValues}
    />
  </label>
  <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
    {m.queriesLabel}
    <input
      type="text"
      name="queries"
      class="field w-72 max-w-full"
      bind:value={queriesText}
      onchange={commitQueries}
    />
  </label>
  <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
    {m.presetLabel}
    <select name="preset" class="field" value={preset} onchange={loadPreset}>
      <option value="" disabled>{m.presetPlaceholder}</option>
      <option value="zigzag">{m.presets.zigzag}</option>
      <option value="nested">{m.presets.nested}</option>
    </select>
  </label>
</form>

<div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
  <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
    <div class="rounded-xl border border-slate-200 bg-white p-4">
      <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.moArrayTitle(frame.blockSize)}
      </h2>
      <ArrayStrip
        values={frame.items}
        ariaLabel={m.moArrayAria(frame.curL, frame.curR)}
        {stateOf}
        {markerOf}
        {pointers}
        {windows}
        speed={player.speed}
      />
      <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
        {#each legend as [st, label] (st)}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>
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
        <dt class="text-xs text-slate-500">{m.stats.moves}</dt>
        <dd class="text-2xl font-bold tabular-nums">{frame.moves}</dd>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <dt class="text-xs text-slate-500">{m.stats.distinct}</dt>
        <dd class="text-2xl font-bold tabular-nums">{frame.distinct}</dd>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <dt class="text-xs text-slate-500">{m.stats.sortedMoves}</dt>
        <dd class="text-2xl font-bold tabular-nums">{frame.sortedMoves}</dd>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <dt class="text-xs text-slate-500">{m.stats.inputMoves}</dt>
        <dd class="text-2xl font-bold text-slate-500 tabular-nums">{frame.inputMoves}</dd>
      </div>
    </dl>
    <ChipList
      title={m.queriesTitle}
      items={queryChips}
      emptyText={m.opsEmpty}
      limit={6}
      hotLabel={m.opsHotLabel}
    />
    <ChipList title={m.countsTitle} items={countChips} emptyText={m.opsEmpty} limit={16} />
    <CodePanel lines={moPseudocode} active={frame.lines} />
  </div>
  <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
    {@render controls()}
  </div>
</div>
