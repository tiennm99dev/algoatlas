<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MODELS,
    SCENARIOS,
    initialParams,
    matchPseudocode,
    matchTrace,
    scenario,
  } from '$lib/algo-engine/practice-computation-models.js';
  import { en as m } from '$lib/lessons/practice-computation-models/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-computation-models.js').Model} Model */
  /** @typedef {import('$lib/algo-engine/practice-computation-models.js').Params} Params */

  // Fixed defaults keep the prerendered HTML and the hydrated page identical.
  const FIRST = SCENARIOS[0];
  const FIRST_PICK = {
    model: /** @type {Model} */ ('parallel'),
    algorithm: FIRST.candidates[0].id,
  };

  let cardId = $state(FIRST.id);
  let params = $state(/** @type {Params} */ (initialParams(FIRST)));
  let model = $state(FIRST_PICK.model);
  let algorithm = $state(FIRST_PICK.algorithm);
  let results = $state(/** @type {Record<string, 'right' | 'wrong'>} */ ({}));
  /** The card, numbers and pick the trace on show was built from. */
  let shown = $state.raw({ id: FIRST.id, pick: FIRST_PICK });

  const card = $derived(scenario(cardId));
  const text = $derived(m.card(cardId));
  const player = createPlayer(matchTrace(FIRST.id, initialParams(FIRST), FIRST_PICK));
  const frame = $derived(player.frame);
  const narration = $derived(m.describe(frame, shown.id, shown.pick));
  const costOf = $derived(new Map(frame.costs.map((c) => [c.id, c.cost])));
  const matched = $derived(Object.values(results).filter((r) => r === 'right').length);

  function rebuild() {
    const pick = { model, algorithm };
    shown = { id: cardId, pick };
    player.load(matchTrace(cardId, { ...params }, pick));
  }

  function changeCard() {
    const s = scenario(cardId);
    params = initialParams(s);
    model = 'parallel';
    algorithm = s.candidates[0].id;
    rebuild();
  }

  function check() {
    rebuild();
    const last = player.frames[player.frames.length - 1];
    results = { ...results, [cardId]: last.modelOk && last.algorithmOk ? 'right' : 'wrong' };
    player.seek(player.frames.length - 2);
  }

  /** @param {string} id @returns {'right'|'wrong'|'open'} */
  const resultOf = (id) => results[id] ?? 'open';

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class={labelClass}>
      {m.cardLabel}
      <select name="card" class="field" bind:value={cardId} onchange={changeCard}>
        {#each SCENARIOS as s (s.id)}
          <option value={s.id}>{m.cardTitles[s.id]}</option>
        {/each}
      </select>
    </label>
    {#each card.params as spec (`${cardId}-${spec.key}`)}
      <label class={labelClass}>
        {text.params[spec.key]}: {m.paramValue(spec, params[spec.key])}
        <input
          type="range"
          name={spec.key}
          min={spec.min}
          max={spec.max}
          bind:value={params[spec.key]}
          onchange={rebuild}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
    {/each}
  </div>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class={labelClass}>
      {m.modelLabel}
      <select name="model" class="field" bind:value={model} onchange={rebuild}>
        {#each MODELS as id (id)}
          <option value={id}>{m.modelNames[id]}</option>
        {/each}
      </select>
    </label>
    <label class={labelClass}>
      {m.algorithmLabel}
      <select name="algorithm" class="field max-w-full" bind:value={algorithm} onchange={rebuild}>
        {#each card.candidates as c (c.id)}
          <option value={c.id}>{text.candidates[c.id].name}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-primary" onclick={check}>{m.check}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="text-lg font-semibold text-slate-900">{m.card(shown.id).title}</h2>
        <p class="mt-1 text-slate-700">{m.card(shown.id).job}</p>
        <h3 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.costsTitle}
        </h3>
        <ul class="flex flex-col gap-2">
          {#each scenario(shown.id).candidates as c (c.id)}
            {@const cost = costOf.get(c.id)}
            {@const best = frame.best.includes(c.id)}
            {@const now = frame.candidate === c.id}
            <li
              class="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border px-3 py-2 {best
                ? `${STATE_BG.sorted} border-slate-900 text-white`
                : now
                  ? `${STATE_BG.active} border-slate-900 text-white`
                  : 'border-slate-200'}"
              data-candidate={c.id}
            >
              <span class="font-medium">
                {m.card(shown.id).candidates[c.id].name}
                {#if shown.pick.algorithm === c.id}<span class="ml-1 text-xs">{m.pickMark}</span
                  >{/if}
              </span>
              <span class="tabular-nums">
                {cost === undefined ? m.costPending : m.costText(frame.model, cost)}
                {#if best}<span class="ml-1 text-xs font-bold">{m.bestMark}</span>{/if}
              </span>
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
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-1 text-xs text-slate-500">{m.scoreTitle}</h2>
        <p class="text-2xl font-bold tabular-nums">{m.score(matched, SCENARIOS.length)}</p>
        <ul class="mt-2 flex flex-col gap-1 text-sm">
          {#each SCENARIOS as s (s.id)}
            {@const r = resultOf(s.id)}
            <li class="flex items-center gap-2" data-result={s.id}>
              <span
                aria-hidden="true"
                class="flex size-5 items-center justify-center rounded text-xs font-bold {r ===
                'right'
                  ? `${STATE_BG.sorted} text-white`
                  : r === 'wrong'
                    ? `${STATE_BG.swap} text-white`
                    : 'bg-slate-100 text-slate-600'}">{m.scoreMarks[r]}</span
              >
              <span class="sr-only">{m.scoreLabel(m.cardTitles[s.id], r)}</span>
              <span aria-hidden="true">{m.cardTitles[s.id]}</span>
            </li>
          {/each}
        </ul>
      </div>
      <CodePanel lines={matchPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
