<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    binaryPseudocode,
    binarySearchTrace,
    decide,
    linearSearchComparisons,
    makeSortedArray,
  } from '$lib/algo-engine/searching.js';
  import { en as m } from '$lib/lessons/binary-search/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {'watch'|'drive'} Mode */
  const MODES = /** @type {Mode[]} */ (['watch', 'drive']);

  // A fixed first array keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [3, 7, 11, 14, 19, 23, 28, 31, 36, 42, 47, 53, 58, 64, 71];
  const INITIAL_TARGET = 53;
  let values = $state(INITIAL);
  let target = $state(INITIAL_TARGET);
  let size = $state(15);
  /** @type {Mode} */
  let mode = $state('watch');

  const player = createPlayer(binarySearchTrace(INITIAL, INITIAL_TARGET));
  const frame = $derived(player.frame);
  const binaryReads = $derived(player.frames.at(-1)?.comparisons ?? 0);
  const linearReads = $derived(linearSearchComparisons(values, target));

  let lo = $state(0);
  let hi = $state(INITIAL.length - 1);
  /** @type {number[]} */
  let probes = $state([]);
  /** @type {'playing'|'found'|'missing'} */
  let driveStatus = $state('playing');
  let driveMessage = $state(m.drive.prompt);

  function rebuild() {
    // An emptied number input binds null; keep the last valid trace until it is refilled.
    if (!Number.isFinite(target)) return;
    player.load(binarySearchTrace(values, target));
    lo = 0;
    hi = values.length - 1;
    probes = [];
    driveStatus = 'playing';
    driveMessage = m.drive.prompt;
  }

  function newArray() {
    values = makeSortedArray(size);
    pickPresent();
  }

  function pickPresent() {
    target = values[Math.floor(Math.random() * values.length)];
    rebuild();
  }

  function pickAbsent() {
    const present = new Set(values);
    let v;
    do v = Math.floor(Math.random() * (values[values.length - 1] + 5)); while (present.has(v));
    target = v;
    rebuild();
  }

  /** @param {number} i */
  function probe(i) {
    if (driveStatus !== 'playing' || i < lo || i > hi) return;
    probes = [...probes, i];
    const move = decide(values, i, target);
    if (move === 'found') {
      driveStatus = 'found';
      driveMessage = m.drive.found(probes.length, binaryReads);
      return;
    }
    if (move === 'go-right') {
      lo = i + 1;
      driveMessage = m.drive.higher(values[i], target);
    } else {
      hi = i - 1;
      driveMessage = m.drive.lower(values[i], target);
    }
    if (lo > hi) {
      driveStatus = 'missing';
      driveMessage = m.drive.missing(probes.length);
    }
  }

  const windowLo = $derived(mode === 'watch' ? frame.lo : lo);
  const windowHi = $derived(mode === 'watch' ? frame.hi : hi);
  const doneWatching = $derived(frame.kind === 'found' || frame.kind === 'not-found');

  /** @param {number} i */
  function cellClass(i) {
    const hit = mode === 'watch' ? frame.kind === 'found' && frame.mid === i : driveStatus === 'found' && probes.at(-1) === i;
    if (hit) return 'border-state-sorted bg-state-sorted text-white';
    if (mode === 'watch' && frame.mid === i) return 'border-state-active bg-state-active text-white';
    if (mode === 'drive' && probes.includes(i)) return 'border-slate-300 bg-slate-200 text-slate-500 line-through';
    const out = i < windowLo || i > windowHi || (mode === 'watch' && doneWatching);
    return out ? 'border-slate-200 bg-slate-100 text-slate-300' : 'border-slate-300 bg-white text-slate-900';
  }

  /** @param {number} i */
  function marker(i) {
    if (mode !== 'watch' || doneWatching) return '';
    return [i === frame.lo && 'lo', i === frame.mid && 'mid', i === frame.hi && 'hi'].filter(Boolean).join(' ');
  }

  const selectClass = 'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">{m.modeLabel}</legend>
      <div class="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
        {#each MODES as md (md)}
          <label class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium has-checked:bg-teal-600 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-teal-600">
            <input type="radio" class="sr-only" name="mode" value={md} bind:group={mode} onchange={rebuild} />
            {m.modes[md]}
          </label>
        {/each}
      </div>
    </fieldset>

    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.targetLabel}
      <input type="number" class="{selectClass} w-24" bind:value={target} onchange={rebuild} />
    </label>

    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sizeLabel}: {size}
      <input type="range" min="7" max="31" step="2" bind:value={size} onchange={newArray} class="accent-teal-600" />
    </label>

    <div class="flex flex-wrap gap-2">
      <button onclick={newArray} class="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600">{m.newArray}</button>
      <button onclick={pickPresent} class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100">{m.randomPresent}</button>
      <button onclick={pickAbsent} class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100">{m.randomAbsent}</button>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ol class="flex flex-wrap gap-1.5" aria-label={m.arrayLabel}>
          {#each values as v, i (i)}
            {@const out = i < windowLo || i > windowHi}
            <li class="flex w-11 flex-col items-center">
              <button
                class="flex h-11 w-11 items-center justify-center rounded-lg border-2 font-mono text-sm font-semibold tabular-nums transition-colors {cellClass(i)} {mode === 'drive' && driveStatus === 'playing' && !out ? 'cursor-pointer hover:border-teal-500' : 'cursor-default'}"
                disabled={mode !== 'drive' || driveStatus !== 'playing' || out}
                aria-label={m.cellLabel(i, v, out)}
                onclick={() => probe(i)}
              >{v}</button>
              <span class="mt-0.5 text-[10px] text-slate-400 tabular-nums">{i}</span>
              <span class="h-4 text-[10px] font-bold text-state-active">{marker(i)}</span>
            </li>
          {/each}
        </ol>
      </div>

      <p class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800" aria-live="polite">
        {mode === 'watch' ? m.describe(frame, values, target) : driveMessage}
      </p>

      {#if mode === 'watch'}
        <StepControls {player} />
      {:else if driveStatus !== 'playing'}
        <button onclick={rebuild} class="self-start rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">{m.drive.restart}</button>
      {/if}
    </div>

    <div class="flex flex-col gap-4">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{mode === 'watch' ? m.binaryCount : m.yourCount}</dt>
          <dd class="text-2xl font-bold tabular-nums">{mode === 'watch' ? frame.comparisons : probes.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.linearCount}</dt>
          <dd class="text-2xl font-bold text-slate-400 tabular-nums">{linearReads}</dd>
        </div>
      </dl>
      {#if mode === 'watch'}
        <CodePanel lines={binaryPseudocode} active={frame.line} />
      {:else}
        <p class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
          {m.binaryCount}: <strong class="tabular-nums">{binaryReads}</strong>
        </p>
      {/if}
    </div>
  </div>
</LessonLayout>
