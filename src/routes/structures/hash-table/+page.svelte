<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_KEYS,
    MAX_KEY,
    hashPseudocode,
    hashTableTrace,
    makeKeys,
    parseKeys,
  } from '$lib/algo-engine/hash-table.js';
  import { en as m } from '$lib/lessons/hash-table/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/hash-table.js').HashFn} HashFn */
  /** @typedef {'random'|'sequential'|'multiples-of-8'|'custom'} Preset */
  /** @typedef {'compare'|'hit'|'new'|'moved'|''} ChipState */

  const FNS = /** @type {HashFn[]} */ (['mod-prime', 'mod-pow2', 'multiply']);
  const PRESETS = /** @type {Preset[]} */ (['random', 'sequential', 'multiples-of-8', 'custom']);

  // A fixed first key set keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [12, 44, 13, 88, 23, 94, 11, 39, 20, 16];
  let keys = $state(INITIAL);
  let fn = $state(/** @type {HashFn} */ ('mod-prime'));
  let preset = $state(/** @type {Preset} */ ('random'));
  let count = $state(INITIAL.length);
  let customText = $state(INITIAL.join(', '));
  let lastValidText = INITIAL.join(', ');
  let searchKey = 62;
  /** @type {number | null} */
  let searchDraft = $state(62);

  /** A message shown in place of the narration, only on the frame it was raised on. */
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(hashTableTrace(INITIAL, 'mod-prime'));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function clearNotice() {
    notice = { text: '', at: -1 };
  }

  /** @param {number | null} [search] Key to look up after the inserts. */
  function rebuild(search = null) {
    clearNotice();
    const trace = hashTableTrace(keys, fn, search);
    player.load(trace);
    // Land on the lookup so the learner sees the filled table, not the inserts again.
    if (search !== null) player.seek(trace.findIndex((f) => f.kind === 'hash' && f.lines[0] === 6));
  }

  function generate() {
    if (preset === 'custom') return;
    keys = makeKeys(preset, count);
    customText = lastValidText = keys.join(', ');
    rebuild();
    say(m.newKeysLoaded);
  }

  function changePreset() {
    if (preset === 'custom') {
      clearNotice();
      return;
    }
    generate();
  }

  function commitCustom() {
    const parsed = parseKeys(customText);
    if ('error' in parsed) {
      say(m.keyErrors[parsed.error]);
      customText = lastValidText;
      return;
    }
    keys = parsed.keys;
    lastValidText = customText;
    rebuild();
  }

  /** Accept the search field when it holds a valid key; otherwise restore the last valid one. */
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
   * @param {number} b
   * @param {number} i
   * @returns {ChipState}
   */
  function chipState(b, i) {
    if (frame.bucket !== b) return '';
    switch (frame.kind) {
      case 'walk':
        return frame.pos === i ? 'compare' : '';
      case 'update':
      case 'search-hit':
        return frame.pos === i ? 'hit' : '';
      case 'append':
        return frame.pos === i ? 'new' : '';
      case 'rehash':
        return i === frame.buckets[b].length - 1 ? 'moved' : '';
      default:
        return '';
    }
  }

  const CHIP_CLASS = {
    compare: 'bg-state-compare text-white',
    hit: 'bg-state-sorted text-white',
    new: 'bg-state-active text-white',
    moved: 'bg-state-frontier text-slate-900',
    '': 'bg-slate-100 text-slate-900',
  };

  const mark = /** @param {ChipState} s */ (s) => (s ? m.marks[s] : '');

  const growing = $derived(frame.kind === 'grow' || frame.kind === 'rehash');
  const legend = $derived([
    ['bg-state-compare', `${m.marks.compare} ${m.legend.compare}`],
    ['bg-state-sorted', `${m.marks.hit} ${m.legend.hit}`],
    ['bg-state-active', `${m.marks.new} ${m.legend.new}`],
    ['bg-state-frontier', `${m.marks.moved} ${m.legend.moving}`],
  ]);
  const stats = $derived([
    [m.stats.comparisons, String(frame.comparisons)],
    [m.stats.collisions, String(frame.collisions)],
    [m.stats.load, frame.load.toFixed(2)],
    [m.stats.longest, String(frame.longest)],
    [m.stats.size, String(frame.m)],
  ]);

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.hashLabel}
      name="hash"
      options={FNS.map((f) => ({ value: f, label: m.hashes[f] }))}
      bind:value={fn}
      onchange={() => rebuild()}
    />

    <label class={labelClass}>
      {m.presetLabel}
      <select name="preset" class="field" bind:value={preset} onchange={changePreset}>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>

    {#if preset === 'custom'}
      <label class={labelClass}>
        {m.customLabel}
        <input type="text" class="field w-64" bind:value={customText} onchange={commitCustom} />
      </label>
    {:else}
      <label class={labelClass}>
        {m.countLabel}: {count}
        <input
          type="range"
          min="4"
          max={MAX_KEYS}
          bind:value={count}
          onchange={generate}
          class="accent-teal-700"
        />
      </label>
    {/if}
    {#if preset === 'random'}
      <button onclick={generate} class="btn-secondary">{m.newKeys}</button>
    {/if}

    <label class={labelClass}>
      {m.searchLabel}
      <input
        type="number"
        min="0"
        max={MAX_KEY}
        class="field w-24"
        bind:value={searchDraft}
        onchange={commitSearch}
      />
    </label>
    <button onclick={runSearch} class="btn-outline">{m.searchButton}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs text-slate-500">
          {m.bucketsLabel}
        </h2>
        <ol
          class="text-sm {frame.buckets.length > 16 ? 'sm:columns-2' : ''}"
          aria-label={m.bucketsLabel}
        >
          {#each frame.buckets as chain, b (b)}
            <li class="flex min-h-7 items-center gap-2 break-inside-avoid py-0.5">
              <span class="w-6 shrink-0 text-right text-xs text-slate-500 tabular-nums">{b}</span>
              <span
                class="flex flex-wrap items-center gap-1 font-mono text-xs {frame.bucket === b &&
                frame.kind !== 'rehash'
                  ? 'rounded ring-2 ring-slate-700'
                  : ''}"
              >
                {#each chain as key, i (i)}
                  {@const s = chipState(b, i)}
                  <span
                    class="rounded px-1.5 py-0.5 tabular-nums {CHIP_CLASS[s]} {player.speed < 8
                      ? 'transition-colors'
                      : ''}"
                    ><span aria-hidden="true">{mark(s)}</span>{key}{#if s}<span class="sr-only"
                        >, {m.chipStates[s]}</span
                      >{/if}</span
                  >
                {:else}
                  <span class="text-slate-400">{m.emptyBucket}</span>
                {/each}
              </span>
            </li>
          {/each}
        </ol>
        <p class="mt-3 font-mono text-sm text-slate-700">{m.formula(fn, frame.m)}</p>
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

      <div class="sticky bottom-2 z-10 lg:static">
        <StepControls {player} />
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <dl class="grid grid-cols-2 gap-3">
        {#each stats as [label, value], i (label)}
          <div
            class="rounded-xl border border-slate-200 bg-white p-3 {stats.length % 2 === 1 &&
            i === stats.length - 1
              ? 'col-span-2'
              : ''}"
          >
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        {/each}
      </dl>
      {#if growing}
        <ChipList
          title={m.pendingLabel}
          items={frame.pending.map((k) => ({ label: String(k) }))}
          emptyText={m.pendingEmpty}
          limit={MAX_KEYS}
        />
      {/if}
      <CodePanel lines={hashPseudocode} active={frame.lines} />
    </div>
  </div>
</LessonLayout>
