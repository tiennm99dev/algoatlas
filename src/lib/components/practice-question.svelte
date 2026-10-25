<script>
  import { tick } from 'svelte';
  import { t } from '$lib/i18n/index.js';
  import { checkAnswer } from './answer-check.js';

  /** @typedef {import('./answer-check.js').Exercise} Exercise */
  /** @typedef {import('./answer-check.js').CheckResult} CheckResult */

  /**
   * One practice question: the answer input for its type, a Check button, hints revealed one at
   * a time, and the solution once the learner has tried at least once.
   * @type {{
   *   exercise: Exercise,
   *   index: number,
   *   total: number,
   *   solved: boolean,
   *   onsolve: () => void,
   * }}
   */
  let { exercise, index, total, solved, onsolve } = $props();

  const c = t().practice;
  const uid = $props.id();

  // Typed answers for number and text, a pick for choice, picks for multi, an arrangement for
  // order. Each starts empty (or in the authored item order) and resets with the component.
  let typed = $state('');
  /** @type {number | null} */
  let picked = $state(null);
  /** @type {number[]} */
  let picks = $state([]);
  // svelte-ignore state_referenced_locally
  let arrangement = $state(exercise.type === 'order' ? exercise.items.map((_, i) => i) : []);

  let result = $state(/** @type {CheckResult | null} */ (null));
  let hintsShown = $state(0);
  let tried = $state(false);
  let solutionShown = $state(false);
  let moveNote = $state('');
  /** @type {HTMLElement | undefined} */
  let orderList = $state();

  function response() {
    switch (exercise.type) {
      case 'number':
      case 'text':
        return typed;
      case 'choice':
        return picked;
      case 'multi':
        return picks;
      case 'order':
        return arrangement;
    }
  }

  function check() {
    result = checkAnswer(exercise, response());
    if (result.reason !== 'empty') tried = true;
    if (result.correct) onsolve();
  }

  /** @param {number} i @param {boolean} on */
  function togglePick(i, on) {
    picks = on ? [...picks.filter((p) => p !== i), i] : picks.filter((p) => p !== i);
  }

  /** @param {number} at @param {-1 | 1} dir */
  async function move(at, dir) {
    if (exercise.type !== 'order') return;
    const to = at + dir;
    if (to < 0 || to >= arrangement.length) return;
    const next = arrangement.slice();
    [next[at], next[to]] = [next[to], next[at]];
    arrangement = next;
    result = null;
    const item = exercise.items[next[to]];
    moveNote = c.moved(item, to + 1, next.length);
    // Keep focus on the moved item so repeated presses keep carrying it along.
    await tick();
    /** @type {HTMLElement | null | undefined} */ (
      orderList?.querySelector(`[data-pos="${to}"][data-dir="${dir < 0 ? 'up' : 'down'}"]`)
    )?.focus();
  }

  const tone = $derived(
    result?.correct
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
      : 'border-amber-300 bg-amber-50 text-amber-950',
  );
</script>

<li class="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="{uid}-q">
  <div class="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
    <span>{c.questionOf(index + 1, total)}</span>
    {#if solved}
      <span class="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900"
        ><span aria-hidden="true">✓</span> {c.solved}</span
      >
    {/if}
  </div>
  <p id="{uid}-q" class="mb-3 leading-relaxed text-slate-900">{exercise.prompt}</p>

  <form
    class="flex flex-col gap-3"
    onsubmit={(e) => {
      e.preventDefault();
      check();
    }}
  >
    {#if exercise.type === 'number' || exercise.type === 'text'}
      <label class="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        {c.answerLabel}
        <input
          type="text"
          name="answer"
          inputmode={exercise.type === 'number' ? 'decimal' : 'text'}
          autocomplete="off"
          spellcheck="false"
          class="field w-48 font-mono"
          bind:value={typed}
          oninput={() => (result = null)}
        />
        {#if exercise.type === 'number' && exercise.unit}
          <span class="text-xs text-slate-500">{c.unitHint(exercise.unit)}</span>
        {/if}
      </label>
    {:else if exercise.type === 'choice' || exercise.type === 'multi'}
      <fieldset>
        <legend class="sr-only">{exercise.prompt}</legend>
        {#if exercise.type === 'multi'}
          <p class="mb-2 text-xs text-slate-500">{c.pickAll}</p>
        {/if}
        <div class="flex flex-col gap-2">
          {#each exercise.options as option, i (i)}
            <label
              class="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 has-checked:border-teal-700 has-checked:bg-teal-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-700"
            >
              {#if exercise.type === 'choice'}
                <input
                  type="radio"
                  class="mt-0.5 accent-teal-700"
                  name="{uid}-choice"
                  value={i}
                  checked={picked === i}
                  onchange={() => {
                    picked = i;
                    result = null;
                  }}
                />
              {:else}
                <input
                  type="checkbox"
                  class="mt-0.5 accent-teal-700"
                  value={i}
                  checked={picks.includes(i)}
                  onchange={(e) => {
                    togglePick(i, e.currentTarget.checked);
                    result = null;
                  }}
                />
              {/if}
              <span>{option}</span>
            </label>
          {/each}
        </div>
      </fieldset>
    {:else if exercise.type === 'order'}
      {@const items = exercise.items}
      <ol class="flex flex-col gap-2" aria-label={c.orderListLabel} bind:this={orderList}>
        {#each arrangement as item, pos (item)}
          <li
            class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm"
          >
            <span class="w-5 text-right text-xs text-slate-500 tabular-nums" aria-hidden="true"
              >{pos + 1}</span
            >
            <span class="min-w-0 flex-1 text-slate-800">{items[item]}</span>
            <button
              type="button"
              class="btn-icon"
              data-pos={pos}
              data-dir="up"
              aria-label={c.moveUp(items[item])}
              aria-disabled={pos === 0}
              onclick={() => move(pos, -1)}
              ><svg viewBox="0 0 24 24" class="size-5 fill-current" aria-hidden="true"
                ><path d="M12 6l7 9H5z" /></svg
              ></button
            >
            <button
              type="button"
              class="btn-icon"
              data-pos={pos}
              data-dir="down"
              aria-label={c.moveDown(items[item])}
              aria-disabled={pos === arrangement.length - 1}
              onclick={() => move(pos, 1)}
              ><svg viewBox="0 0 24 24" class="size-5 fill-current" aria-hidden="true"
                ><path d="M12 18l-7-9h14z" /></svg
              ></button
            >
          </li>
        {/each}
      </ol>
      <p class="sr-only" role="status">{moveNote}</p>
    {/if}

    <div class="flex flex-wrap items-center gap-2">
      <button type="submit" class="btn-primary">{c.check}</button>
      {#if hintsShown < exercise.hints.length}
        <button type="button" class="btn-outline" onclick={() => hintsShown++}
          >{c.showHint(hintsShown, exercise.hints.length)}</button
        >
      {/if}
      {#if tried && !solutionShown}
        <button type="button" class="btn-outline" onclick={() => (solutionShown = true)}
          >{c.showSolution}</button
        >
      {/if}
    </div>
  </form>

  <p class="mt-3 text-sm empty:hidden" role="status">
    {#if result}<span class="block rounded-lg border px-3 py-2 {tone}"
        >{c.feedback[result.reason]}</span
      >{/if}
  </p>

  {#if hintsShown > 0}
    <ol class="mt-3 flex flex-col gap-2">
      {#each exercise.hints.slice(0, hintsShown) as hint, i (i)}
        <li class="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-950">
          <strong class="font-semibold">{c.hintTitle(i + 1, exercise.hints.length)}:</strong>
          {hint}
        </li>
      {/each}
    </ol>
  {/if}

  {#if solutionShown}
    <div class="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <strong class="font-semibold text-slate-900">{c.solutionTitle}:</strong>
      <span class="text-slate-700">{exercise.solution}</span>
    </div>
  {/if}
</li>
