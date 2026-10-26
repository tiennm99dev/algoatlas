<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    M,
    MAX_KEY,
    collisionPseudocode,
    collisionTrace,
    makeKeys,
    parseKeys,
    probeSlot,
  } from '$lib/algo-engine/collision-resolution.js';
  import { en as m } from '$lib/lessons/collision-resolution/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/collision-resolution.js').ProbeMethod} ProbeMethod */
  /** @typedef {import('$lib/algo-engine/collision-resolution.js').CollisionPreset} CollisionPreset */
  /** @typedef {'compare'|'collision'|'active'|'sorted'|'frontier'|''} CellState */

  const METHODS = /** @type {ProbeMethod[]} */ (['linear', 'quadratic', 'double']);
  const PRESETS = /** @type {CollisionPreset[]} */ (['mixed', 'cluster', 'same-home', 'random']);

  // A fixed first key set keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makeKeys('mixed');
  let keys = $state.raw(INITIAL);
  let method = $state(/** @type {ProbeMethod} */ ('linear'));
  let preset = $state('mixed');
  let keysText = $state(INITIAL.join(', '));
  let lastValidText = INITIAL.join(', ');
  let searchKey = 34;
  /** @type {number | null} */
  let searchDraft = $state(34);
  let searched = false;
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(collisionTrace(INITIAL, 'linear'));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, method));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /**
   * Rebuild the trace; with a search key, land on the lookup.
   * @param {number | null} [search]
   */
  function rebuild(search = null) {
    const dropped = searched && search === null;
    searched = search !== null;
    notice = { text: '', at: -1 };
    const trace = collisionTrace(keys, method, search);
    player.load(trace);
    if (search !== null) player.seek(trace.findIndex((f) => f.search));
    if (dropped) say(m.searchDropped);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {CollisionPreset} */ (e.currentTarget.value);
    preset = picked;
    keys = makeKeys(picked);
    keysText = lastValidText = keys.join(', ');
    rebuild();
  }

  function newRandom() {
    keys = makeKeys('random');
    keysText = lastValidText = keys.join(', ');
    rebuild();
  }

  function commitKeys() {
    const parsed = parseKeys(keysText);
    if ('error' in parsed) {
      keysText = lastValidText;
      say(m.keyErrors[parsed.error]);
      return;
    }
    keys = parsed.keys;
    lastValidText = keysText;
    preset = '';
    rebuild();
  }

  function commitSearch() {
    if (
      typeof searchDraft !== 'number' ||
      !Number.isInteger(searchDraft) ||
      searchDraft < 0 ||
      searchDraft > MAX_KEY
    ) {
      searchDraft = searchKey;
      say(m.keyErrors.range);
      return false;
    }
    searchKey = searchDraft;
    return true;
  }

  function runSearch() {
    if (commitSearch()) rebuild(searchKey);
  }

  /**
   * State of chip `i` in chain `b`.
   * @param {number} b
   * @param {number} i
   * @returns {CellState}
   */
  function chipState(b, i) {
    if (frame.home !== b || frame.pos !== i) return '';
    if (frame.kind === 'chain-compare') return 'compare';
    if (frame.kind === 'chain-add') return 'active';
    if (frame.kind === 'chain-hit') return 'sorted';
    return '';
  }

  /**
   * State of open-addressing slot `s`.
   * @param {number} s
   * @returns {CellState}
   */
  function slotState(s) {
    if (frame.slot !== s) return '';
    if (frame.kind === 'probe') return 'collision';
    if (frame.kind === 'place') return 'active';
    if (frame.kind === 'probe-hit') return 'sorted';
    if (frame.kind === 'probe-miss') return 'frontier';
    return '';
  }

  /** @type {Record<CellState, string>} */
  const CELL_CLASS = {
    compare: 'bg-state-compare text-slate-900',
    collision: 'bg-state-compare text-slate-900',
    active: 'bg-state-active text-white',
    sorted: 'bg-state-sorted text-white',
    frontier: 'bg-state-frontier text-slate-900',
    '': 'bg-slate-100 text-slate-900',
  };

  /** Frames that act on the chaining table, so its home chain gets the focus ring. */
  const CHAIN_KINDS = ['hash', 'chain-compare', 'chain-add', 'chain-hit', 'chain-miss'];

  const mark = /** @param {CellState} s */ (s) => (s ? m.marks[s] : '');

  // The probe sequence of the key in flight, up to the current probe.
  const sequence = $derived(
    frame.attempt < 0
      ? []
      : Array.from({ length: frame.attempt + 1 }, (_, i) => ({
          label: m.sequenceChip(probeSlot(frame.key, i, method), i),
          hot: i === frame.attempt,
        })),
  );

  const stats = $derived([
    [m.stats.chainCompares, String(frame.chainCompares), 'chain-compares'],
    [m.stats.probes, String(frame.probes), 'probes'],
    [m.stats.longest, String(frame.longest), 'longest'],
    [m.stats.emptySlots, String(frame.slots.filter((s) => s === null).length), 'empty-slots'],
    [m.stats.failed, String(frame.failed), 'failed'],
  ]);

  const legend = /** @type {[import('$lib/components/visual-state.js').VisualState, string][]} */ ([
    ['compare', `${m.marks.compare} / ${m.marks.collision} ${m.legend.compare}`],
    ['active', `${m.marks.active} ${m.legend.active}`],
    ['sorted', `${m.marks.sorted} ${m.legend.sorted}`],
    ['frontier', `${m.marks.frontier} ${m.legend.frontier}`],
  ]);

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.methodLabel}
      name="method"
      options={METHODS.map((v) => ({ value: v, label: m.methods[v] }))}
      bind:value={method}
      onchange={() => rebuild()}
    />
    <label class={labelClass}>
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    {#if preset === 'random'}
      <button type="button" class="btn-secondary" onclick={newRandom}>{m.newKeys}</button>
    {/if}
    <label class={labelClass}>
      {m.keysLabel}
      <input
        type="text"
        name="keys"
        class="field w-64 max-w-full"
        bind:value={keysText}
        onchange={commitKeys}
      />
    </label>
    <form
      class="flex items-end gap-2"
      onsubmit={(e) => {
        e.preventDefault();
        runSearch();
      }}
    >
      <label class={labelClass}>
        {m.searchLabel}
        <input
          type="number"
          name="search"
          min="0"
          max={MAX_KEY}
          class="field w-24"
          bind:value={searchDraft}
          onchange={commitSearch}
        />
      </label>
      <button type="submit" class="btn-outline">{m.searchButton}</button>
    </form>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="overflow-x-auto">
          <table class="w-full text-sm" aria-label={m.tableLabel}>
            <thead>
              <tr class="text-left text-xs text-slate-500">
                <th scope="col" class="w-14 pb-2 font-medium">{m.head.slot}</th>
                <th scope="col" class="pb-2 font-medium">{m.head.chaining}</th>
                <th scope="col" class="pb-2 font-medium">{m.probingHead(method)}</th>
              </tr>
            </thead>
            <tbody>
              {#each frame.chains as chain, b (b)}
                {@const s = slotState(b)}
                {@const value = frame.slots[b]}
                <tr class="border-t border-slate-100" data-slot={b}>
                  <th
                    scope="row"
                    class="py-1 text-left text-xs font-normal text-slate-500 tabular-nums"
                  >
                    {b}{#if frame.home === b}
                      <span class="ml-1 font-bold text-slate-900" aria-hidden="true"
                        >{m.homeMark}</span
                      ><span class="sr-only">, {m.homeLabel}</span>
                    {/if}
                  </th>
                  <td class="py-1 pr-2">
                    <span
                      class="inline-flex flex-wrap items-center gap-1 font-mono text-xs {frame.home ===
                        b && CHAIN_KINDS.includes(frame.kind)
                        ? 'rounded ring-2 ring-slate-700'
                        : ''}"
                    >
                      {#each chain as key, i (i)}
                        {@const cs = chipState(b, i)}
                        <span
                          class="rounded px-1.5 py-0.5 tabular-nums {CELL_CLASS[cs]} {player.speed <
                          8
                            ? 'transition-colors'
                            : ''}"
                          ><span aria-hidden="true">{mark(cs)}</span>{key}{#if cs}<span
                              class="sr-only">, {m.chipStates[cs]}</span
                            >{/if}</span
                        >
                      {:else}
                        <span class="text-slate-500">{m.empty}</span>
                      {/each}
                    </span>
                  </td>
                  <td class="py-1">
                    <span
                      class="inline-block min-w-12 rounded px-1.5 py-0.5 text-center font-mono text-xs tabular-nums {s
                        ? 'ring-2 ring-slate-700'
                        : ''} {value === null && !s
                        ? 'border border-dashed border-slate-300 text-slate-500'
                        : CELL_CLASS[s]}"
                      ><span aria-hidden="true">{mark(s)}</span>{value ?? m.empty}{#if s}<span
                          class="sr-only">, {m.chipStates[s]}</span
                        >{/if}</span
                    >
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="mt-3 font-mono text-sm text-slate-700">{m.formulas[method]}</p>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
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
        {#each stats as [label, value, id], i (id)}
          <div
            class="rounded-xl border border-slate-200 bg-white p-3 {i === stats.length - 1
              ? 'col-span-2'
              : ''}"
          >
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <ChipList
        title={m.sequenceTitle}
        items={sequence}
        emptyText={m.sequenceEmpty}
        limit={M}
        hotLabel={m.sequenceHot}
      />
      <CodePanel lines={collisionPseudocode[method]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
