<script>
  import { flip } from 'svelte/animate';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
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

  /** @type {Algo} */
  let algo = $state('bubble');
  /** @type {Preset} */
  let preset = $state('random');
  let size = $state(12);
  // A fixed first array keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [42, 17, 88, 5, 63, 29, 71, 12, 95, 36, 54, 24];
  let values = $state(INITIAL);

  const player = createPlayer(traces.bubble(toItems(INITIAL)));
  const frame = $derived(player.frame);
  const maxValue = $derived(Math.max(...values, 1));

  let quiz = $state(false);
  let answered = $state(-1);
  let right = $state(0);
  let asked = $state(0);
  /** @type {{ok: boolean, text: string} | null} */
  let feedback = $state(null);
  const awaiting = $derived(quiz && frame.kind === 'compare' && answered !== player.index);

  $effect(() => {
    if (awaiting) player.pause();
  });

  function rebuild() {
    player.load(traces[algo](toItems(values)));
    answered = -1;
    feedback = null;
  }

  function regenerate() {
    values = makeArray(preset, size);
    rebuild();
  }

  /** @param {boolean} guess */
  function answer(guess) {
    const ok = guess === frame.swapped;
    asked++;
    if (ok) right++;
    answered = player.index;
    feedback = { ok, text: ok ? m.quiz.right : m.quiz.wrong(Boolean(frame.swapped)) };
  }

  /** @param {number} i */
  function barColor(i) {
    if (frame.focus.includes(i)) {
      if (frame.kind === 'swap') return 'bg-state-swap';
      if (frame.kind === 'compare') return 'bg-state-compare';
      return 'bg-state-active';
    }
    return frame.sorted.includes(i) ? 'bg-state-sorted' : 'bg-slate-400';
  }

  const selectClass = 'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">{m.algorithmLabel}</legend>
      <div class="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
        {#each ALGOS as a (a)}
          <label class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium has-checked:bg-teal-600 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-teal-600">
            <input type="radio" class="sr-only" name="algo" value={a} bind:group={algo} onchange={rebuild} />
            {m.algorithms[a]}
          </label>
        {/each}
      </div>
    </fieldset>

    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select class={selectClass} bind:value={preset} onchange={regenerate}>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>

    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sizeLabel}: {size}
      <input type="range" min="5" max="30" bind:value={size} onchange={regenerate} class="accent-teal-600" />
    </label>

    <button onclick={regenerate} class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600">{m.shuffle}</button>

    <label class="ml-auto flex items-center gap-2 text-sm font-medium text-slate-700">
      <input type="checkbox" bind:checked={quiz} class="size-4 accent-teal-600" />
      {m.quiz.toggle}
      {#if quiz}<span class="text-slate-500 tabular-nums">{m.quiz.score(right, asked)}</span>{/if}
    </label>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="flex h-64 items-end gap-1" role="img" aria-label={m.barsLabel}>
          {#each frame.items as item, i (item.id)}
            <div class="flex h-full min-w-0 flex-1 flex-col justify-end" animate:flip={{ duration: 200 }}>
              {#if frame.items.length <= 16}
                <span class="mb-1 text-center text-xs text-slate-600 tabular-nums">{item.value}</span>
              {/if}
              <div class="rounded-t transition-colors {barColor(i)}" style="height: {(item.value / maxValue) * 100}%"></div>
            </div>
          {/each}
        </div>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5"><span class="bg-state-compare size-3 rounded-sm"></span>{m.legend.compare}</li>
          <li class="flex items-center gap-1.5"><span class="bg-state-swap size-3 rounded-sm"></span>{m.legend.swap}</li>
          <li class="flex items-center gap-1.5"><span class="bg-state-sorted size-3 rounded-sm"></span>{m.legend.sorted}</li>
        </ul>
      </div>

      {#if awaiting}
        <div class="rounded-xl border-2 border-state-compare bg-amber-50 p-4">
          <p class="mb-3 font-medium text-slate-900">
            {m.quiz.question(frame.items[frame.focus[0]].value, frame.items[frame.focus[1]].value)}
          </p>
          <div class="flex gap-2">
            <button onclick={() => answer(true)} class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">{m.quiz.yes}</button>
            <button onclick={() => answer(false)} class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">{m.quiz.no}</button>
          </div>
        </div>
      {:else}
        <p class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800" aria-live="polite">
          {#if feedback && answered === player.index}
            <span class="font-semibold {feedback.ok ? 'text-emerald-700' : 'text-rose-700'}">{feedback.text}</span>
          {/if}
          {m.describe(frame, algo)}
        </p>
      {/if}

      <StepControls {player} locked={awaiting} />
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
      <CodePanel lines={pseudocode[algo]} active={frame.line} />
    </div>
  </div>
</LessonLayout>
