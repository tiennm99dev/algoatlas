<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    boundPseudocode,
    boundTrace,
    makeSortedArrayWithDuplicates,
  } from '$lib/algo-engine/lower-upper-bound.js';
  import { en as m } from '$lib/lessons/lower-upper-bound/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {'lower'|'upper'} Variant */
  const VARIANTS = /** @type {Variant[]} */ (['lower', 'upper']);

  // A fixed first array keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [2, 5, 5, 5, 8, 11, 11, 14, 17, 17, 17, 17, 20, 23, 26];
  const INITIAL_TARGET = 17;
  let values = $state(INITIAL);
  // `draft` follows the input as the learner types; `target` changes only on commit,
  // so the narration and counters always describe the trace on screen.
  let target = $state(INITIAL_TARGET);
  /** @type {number | null} */
  let draft = $state(INITIAL_TARGET);
  let size = $state(INITIAL.length);
  let variant = $state(/** @type {Variant} */ ('lower'));

  const player = createPlayer(boundTrace(INITIAL, INITIAL_TARGET, 'lower'));
  const frame = $derived(player.frame);
  const n = $derived(values.length);
  const done = $derived(frame.kind === 'done');
  // Both bounds are computed up front so the copies of x can be shaded at the end.
  const lowerAnswer = $derived(boundTrace(values, target, 'lower').at(-1)?.answer ?? 0);
  const upperAnswer = $derived(boundTrace(values, target, 'upper').at(-1)?.answer ?? 0);
  const ceiling = $derived(Math.ceil(Math.log2(n + 1)));

  function rebuild() {
    // An emptied number input binds null; keep the last valid target until it is refilled.
    if (typeof draft === 'number' && Number.isFinite(draft)) target = draft;
    else draft = target;
    player.load(boundTrace(values, target, variant));
  }

  function newArray() {
    values = makeSortedArrayWithDuplicates(size);
    pickPresent();
  }

  function pickPresent() {
    draft = values[Math.floor(Math.random() * values.length)];
    rebuild();
  }

  function pickAbsent() {
    const present = new Set(values);
    const max = values[values.length - 1];
    let v;
    // Draw from 0 up to three past the largest value, so answers at both ends (0 and n) are reachable.
    do v = Math.floor(Math.random() * (max + 4));
    while (present.has(v));
    draft = v;
    rebuild();
  }

  /** @param {number} i */
  function cellClass(i) {
    if (done && i >= lowerAnswer && i < upperAnswer)
      return 'border-state-sorted bg-state-sorted text-white';
    if (frame.mid === i) return 'border-state-active bg-state-active text-white';
    if (i < frame.lo) return 'border-slate-300 bg-state-visited text-slate-900';
    if (i >= frame.hi) return 'border-slate-200 bg-slate-100 text-slate-600';
    return 'border-slate-300 bg-white text-slate-900';
  }

  /** Pointer text for slot i (0..n); slot n is the gap after the last value. @param {number} i */
  function marker(i) {
    return [i === frame.lo && 'lo', i === frame.mid && 'mid', i === frame.hi && 'hi']
      .filter(Boolean)
      .join(' ');
  }

  const legend = $derived([
    ['bg-state-active', m.legend.mid],
    ['border border-slate-300 bg-state-visited', m.legend.left],
    ['border border-slate-200 bg-slate-100', m.legend.right],
    ['bg-state-sorted', m.legend.range],
  ]);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.variantLabel}
      name="variant"
      options={VARIANTS.map((v) => ({ value: v, label: m.variants[v] }))}
      bind:value={variant}
      onchange={rebuild}
    />

    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.targetLabel}
      <input type="number" class="field w-24" bind:value={draft} onchange={rebuild} />
    </label>

    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sizeLabel}: {size}
      <input
        type="range"
        min="6"
        max="24"
        bind:value={size}
        onchange={newArray}
        class="accent-teal-700"
      />
    </label>

    <div class="flex flex-wrap gap-2">
      <button onclick={newArray} class="btn-secondary">{m.newArray}</button>
      <button onclick={pickPresent} class="btn-outline">{m.randomPresent}</button>
      <button onclick={pickAbsent} class="btn-outline">{m.randomAbsent}</button>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div
          role="img"
          class="flex flex-wrap gap-1.5"
          aria-label={m.arrayLabel(values, frame.lo, frame.hi)}
        >
          {#each values as v, i (i)}
            <div class="flex w-11 flex-col items-center">
              <!-- The caret sits on the left edge of slot `answer`, i.e. between answer - 1 and answer. -->
              <span class="relative h-4 w-full text-xs text-state-active" aria-hidden="true">
                {#if done && frame.answer === i}
                  <span class="absolute left-0 -translate-x-1/2">▼</span>
                {/if}
              </span>
              <div
                data-index={i}
                class="flex h-11 w-11 items-center justify-center rounded-lg border-2 font-mono text-sm font-semibold tabular-nums {cellClass(
                  i,
                )} {player.speed < 8 ? 'transition-colors' : ''}"
              >
                {v}
              </div>
              <span class="mt-0.5 text-[10px] text-slate-500 tabular-nums">{i}</span>
              <span class="h-4 text-[10px] font-bold text-state-active">{marker(i)}</span>
            </div>
          {/each}
          <!-- One slot past the end, so hi = n and an insertion point at n are both visible. -->
          <div class="flex w-11 flex-col items-center">
            <span class="relative h-4 w-full text-xs text-state-active" aria-hidden="true">
              {#if done && frame.answer === n}
                <span class="absolute left-0 -translate-x-1/2">▼</span>
              {/if}
            </span>
            <div
              data-index={n}
              class="h-11 w-11 rounded-lg border-2 border-dashed border-slate-300"
            ></div>
            <span class="mt-0.5 text-[10px] text-slate-500 tabular-nums">{n}</span>
            <span class="h-4 text-[10px] font-bold text-state-active">{marker(n)}</span>
          </div>
        </div>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="font-bold text-state-active" aria-hidden="true">▼</span>{m.legend.answer}
          </li>
        </ul>
        <p class="mt-2 text-xs text-slate-500">{m.windowHint}</p>
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {m.describe(frame, values, target)}
      </p>

      <div class="sticky bottom-2 z-10 lg:static">
        <StepControls {player} />
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.readsLabel}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.ceilingLabel}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{ceiling}</dd>
        </div>
      </dl>

      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.resultTitle}</h2>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt class="text-slate-500">{m.lowerLabel}</dt>
          <dd class="font-mono font-semibold tabular-nums">{done ? lowerAnswer : m.pending}</dd>
          <dt class="text-slate-500">{m.upperLabel}</dt>
          <dd class="font-mono font-semibold tabular-nums">{done ? upperAnswer : m.pending}</dd>
        </dl>
        <p class="mt-2 text-sm font-semibold text-state-sorted">
          {done ? m.countText(target, upperAnswer - lowerAnswer) : m.pending}
        </p>
      </div>

      <CodePanel lines={boundPseudocode[variant]} active={frame.lines} />
    </div>
  </div>
</LessonLayout>
