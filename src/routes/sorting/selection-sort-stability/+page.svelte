<script>
  import { flip } from 'svelte/animate';
  import { prefersReducedMotion } from 'svelte/motion';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    equalKeyOrder,
    parseKeys,
    randomKeys,
    selectionPseudocode,
    selectionSortTrace,
    toCards,
  } from '$lib/algo-engine/selection-sort-stability.js';
  import { en as m } from '$lib/lessons/selection-sort-stability/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/selection-sort-stability.js').SelectionVariant} Variant */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'moved'|'compare'|'min'|'current'|'sorted'|''} Role */

  const VARIANTS = /** @type {Variant[]} */ (['swap', 'shift']);
  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [3, 4, 3, 1, 4, 2];
  // Tag colours: the first card with a key is blue, the second amber, and so on.
  const TAG_CLASS = [
    'border-sky-600 bg-sky-50',
    'border-amber-600 bg-amber-50',
    'border-rose-600 bg-rose-50',
    'border-violet-600 bg-violet-50',
    'border-emerald-600 bg-emerald-50',
    'border-orange-600 bg-orange-50',
    'border-cyan-600 bg-cyan-50',
    'border-fuchsia-600 bg-fuchsia-50',
    'border-lime-600 bg-lime-50',
    'border-slate-600 bg-slate-50',
  ];

  let variant = $state(/** @type {Variant} */ ('swap'));
  let keys = $state(INITIAL);
  let keysText = $state(INITIAL.join(', '));

  /** @param {number[]} values */
  function build(values) {
    const traces = {
      swap: selectionSortTrace(toCards(values), 'swap'),
      shift: selectionSortTrace(toCards(values), 'shift'),
    };
    const totals = VARIANTS.map((v) => {
      const last =
        /** @type {import('$lib/algo-engine/selection-sort-stability.js').SelectionFrame} */ (
          traces[v].at(-1)
        );
      const groups = equalKeyOrder(last.items);
      return {
        variant: v,
        comparisons: last.comparisons,
        writes: last.writes,
        stable: groups.length === 0 ? null : groups.every((g) => g.kept),
      };
    });
    return { traces, totals };
  }

  const first = build(INITIAL);
  let built = $state.raw(first);
  const player = createPlayer(first.traces.swap);
  const frame = $derived(player.frame);

  let notice = $state({ text: '', at: -1 });
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const n = $derived(frame.items.length);
  const groups = $derived(equalKeyOrder(frame.items));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    built = build(keys);
    player.load(built.traces[variant]);
  }

  function switchVariant() {
    notice = { text: '', at: -1 };
    player.load(built.traces[variant]);
  }

  function commitKeys() {
    const parsed = parseKeys(keysText);
    if ('error' in parsed) {
      keysText = keys.join(', ');
      say(m.keyErrors[parsed.error]);
      return;
    }
    keys = parsed.keys;
    keysText = keys.join(', ');
    rebuild();
  }

  function randomize() {
    keys = randomKeys(keys.length);
    keysText = keys.join(', ');
    rebuild();
  }

  /** @param {number} k @returns {Role[]} */
  function rolesOf(k) {
    /** @type {Role[]} */
    const roles = [];
    const moving = frame.kind === 'swap' || frame.kind === 'shift';
    if (moving && (k === frame.i || k === frame.from)) roles.push('moved');
    if (frame.kind === 'compare' && k === frame.j) roles.push('compare');
    if (!moving && k === frame.min) roles.push('min');
    if (k === frame.i && frame.kind !== 'done') roles.push('current');
    if (k < frame.sortedCount) roles.push('sorted');
    return roles;
  }

  /** @type {Record<Exclude<Role, ''>, VisualState>} */
  const ROLE_STATE = {
    moved: 'swap',
    compare: 'compare',
    min: 'active',
    current: 'frontier',
    sorted: 'sorted',
  };

  /** @param {number} k */
  const markerOf = (k) =>
    rolesOf(k)
      .filter((r) => r !== 'sorted' || rolesOf(k).length === 1)
      .map((r) => (r ? m.markers[r] : ''))
      .join(' ');

  // Swap, active and sorted fills are dark, so their markers are white (as in STATE_TEXT).
  const DARK = /** @type {VisualState[]} */ (['swap', 'active', 'sorted']);

  /** @param {number} k */
  function stripClass(k) {
    const top = rolesOf(k)[0];
    if (!top) return 'bg-transparent';
    const s = ROLE_STATE[top];
    return `${STATE_BG[s]} ${DARK.includes(s) ? 'text-white' : 'text-slate-900'}`;
  }

  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['frontier', m.markers.current, m.legend.current],
    ['active', m.markers.min, m.legend.min],
    ['compare', m.markers.compare, m.legend.compare],
    ['swap', m.markers.moved, m.legend.moved],
    ['sorted', m.markers.sorted, m.legend.sorted],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitKeys();
    }}
  >
    <SegmentedControl
      legend={m.variantLabel}
      name="variant"
      options={VARIANTS.map((v) => ({ value: v, label: m.variants[v] }))}
      bind:value={variant}
      onchange={switchVariant}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.keysLabel}
      <input
        type="text"
        name="keys"
        class="field w-64 max-w-full"
        bind:value={keysText}
        onchange={commitKeys}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={randomize}>{m.randomButton}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.cardsTitle}
        </h2>
        <div class="overflow-x-auto pb-1">
          <!-- New keys remount the row, so only reordering within one input animates. -->
          {#key built}
            <ol class="flex w-max gap-2" aria-label={m.cardsAria(frame.items, frame.sortedCount)}>
              {#each frame.items as c, k (c.id)}
                <li
                  class="flex w-12 flex-col items-center gap-1"
                  animate:flip={{
                    duration: prefersReducedMotion.current || player.speed >= 8 ? 0 : 250,
                  }}
                >
                  <span class="text-[0.65rem] text-slate-500 tabular-nums">[{k}]</span>
                  <span
                    class="flex h-16 w-12 flex-col items-center justify-center rounded-lg border-2 {TAG_CLASS[
                      c.tag % TAG_CLASS.length
                    ]} {k < frame.sortedCount ? '' : 'shadow-sm'}"
                  >
                    <span class="text-xl leading-none font-bold text-slate-900 tabular-nums"
                      >{c.key}</span
                    >
                    <span class="text-sm font-semibold text-slate-700">{m.tagName(c.tag)}</span>
                  </span>
                  <span
                    class="h-5 w-full rounded text-center text-xs leading-5 font-bold {stripClass(
                      k,
                    )}"
                    aria-hidden="true">{markerOf(k)}</span
                  >
                  <span class="sr-only"
                    >{m.cardLabel(
                      c,
                      rolesOf(k)
                        .map((r) => (r ? m.roles[r] : ''))
                        .join(', '),
                    )}</span
                  >
                </li>
              {/each}
            </ol>
          {/key}
        </div>
        <p class="mt-2 text-xs text-slate-500">{m.tagNote}</p>
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
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pairs}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{(n * (n - 1)) / 2}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.writes}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.writes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.sorted}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.sortedCount} / {n}</dd>
        </div>
      </dl>

      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="mb-2 text-xs text-slate-500">{m.equalTitle}</h2>
        {#if groups.length === 0}
          <p class="text-slate-500">{m.equalEmpty}</p>
        {:else}
          <ul class="space-y-1">
            {#each groups as g (g.key)}
              <li class="flex justify-between gap-2 tabular-nums">
                <span>{m.equalRow(g.key, g.tags)}</span>
                <span class={g.kept ? 'text-slate-600' : 'font-semibold text-rose-700'}
                  >{m.equalVerdict(g.kept)}</span
                >
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <dl class="space-y-2">
          {#each built.totals as row (row.variant)}
            <div
              class="flex flex-wrap justify-between gap-x-2 {row.variant === variant
                ? 'font-semibold text-slate-900'
                : 'text-slate-600'}"
            >
              <dt>{m.variants[row.variant]}</dt>
              <dd class="tabular-nums">{m.compareRow(row.comparisons, row.writes)}</dd>
              <dd class="w-full text-xs font-normal text-slate-500">{m.stableLabel(row.stable)}</dd>
            </div>
          {/each}
        </dl>
      </section>

      <CodePanel lines={selectionPseudocode[variant]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
