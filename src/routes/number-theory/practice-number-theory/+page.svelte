<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    CALC_OPS,
    MAX_CALC,
    MAX_CALC_MODULUS,
    MAX_DIVISOR_N,
    MAX_MODULUS,
    MAX_RANGE_N,
    MAX_VALUE,
    MAX_VALUES,
    PSEUDOCODE,
    PUZZLES,
    START,
    calculate,
    divisorsTrace,
    pairsTrace,
    rangeSumTrace,
    subarraysTrace,
  } from '$lib/algo-engine/practice-number-theory.js';
  import { parseValueList } from '$lib/algo-engine/parse-values.js';
  import { en as m } from '$lib/lessons/practice-number-theory/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-number-theory.js').Puzzle} Puzzle */
  /** @typedef {import('$lib/algo-engine/practice-number-theory.js').CalcOp} CalcOp */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.seenStates} SeenRole */

  const ROWS_SHOWN = 8;
  /** @type {Record<SeenRole, VisualState>} */
  const SEEN_STATE = { lookup: 'compare', bumped: 'active', plain: '' };
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  let puzzle = $state(/** @type {Puzzle} */ ('divisors'));
  let n = $state(START.n);
  let nDraft = $state(/** @type {number | null} */ (START.n));
  let limit = $state(START.N);
  let limitDraft = $state(/** @type {number | null} */ (START.N));
  /** @type {Record<'pairs'|'subarrays', {values: number[], m: number}>} */
  const lists = $state({
    pairs: { values: START.values.slice(), m: START.m },
    subarrays: { values: START.subValues.slice(), m: START.subM },
  });
  let valuesText = $state('');
  let modDraft = $state(/** @type {number | null} */ (null));

  const player = createPlayer(divisorsTrace(START.n));
  const frame = $derived(player.frame);
  let notice = $state({ text: '', at: -1 });
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  let guess = $state(/** @type {number | null} */ (null));
  let feedback = $state({ text: '', at: -1 });
  let right = $state(0);
  let wrong = $state(0);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @returns {import('$lib/algo-engine/practice-number-theory.js').PracticeFrame[]} */
  function traceNow() {
    switch (puzzle) {
      case 'divisors':
        return divisorsTrace(n);
      case 'rangeSum':
        return rangeSumTrace(limit);
      case 'pairs':
        return pairsTrace($state.snapshot(lists.pairs.values), lists.pairs.m);
      case 'subarrays':
        return subarraysTrace($state.snapshot(lists.subarrays.values), lists.subarrays.m);
    }
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    feedback = { text: '', at: -1 };
    guess = null;
    right = 0;
    wrong = 0;
    player.load(traceNow());
  }

  function syncListFields() {
    if (puzzle === 'pairs' || puzzle === 'subarrays') {
      valuesText = lists[puzzle].values.join(', ');
      modDraft = lists[puzzle].m;
    }
  }

  function commitN() {
    if (!wholeInRange(nDraft, 1, MAX_DIVISOR_N)) {
      nDraft = n;
      say(m.nError(MAX_DIVISOR_N));
      return;
    }
    if (nDraft === n) return;
    n = /** @type {number} */ (nDraft);
    rebuild();
  }

  function commitLimit() {
    if (!wholeInRange(limitDraft, 1, MAX_RANGE_N)) {
      limitDraft = limit;
      say(m.rangeError(MAX_RANGE_N));
      return;
    }
    if (limitDraft === limit) return;
    limit = /** @type {number} */ (limitDraft);
    rebuild();
  }

  function commitValues() {
    if (puzzle !== 'pairs' && puzzle !== 'subarrays') return;
    const list = lists[puzzle];
    const parsed = parseValueList(valuesText, { max: MAX_VALUE, maxN: MAX_VALUES });
    if ('error' in parsed) {
      valuesText = list.values.join(', ');
      say(m.valuesError(MAX_VALUES, MAX_VALUE));
      return;
    }
    valuesText = parsed.values.join(', ');
    if (parsed.values.join() === list.values.join()) return;
    list.values = parsed.values;
    rebuild();
  }

  function commitMod() {
    if (puzzle !== 'pairs' && puzzle !== 'subarrays') return;
    const list = lists[puzzle];
    if (!wholeInRange(modDraft, 1, MAX_MODULUS)) {
      modDraft = list.m;
      say(m.modulusError(MAX_MODULUS));
      return;
    }
    if (modDraft === list.m) return;
    list.m = /** @type {number} */ (modDraft);
    rebuild();
  }

  function pickPuzzle() {
    syncListFields();
    rebuild();
  }

  function checkGuess() {
    const want = frame.ask;
    if (want === null) return;
    if (guess === null || !Number.isInteger(guess)) {
      feedback = { text: m.askEmpty, at: player.index };
      return;
    }
    if (guess === want) {
      right++;
      player.step();
      guess = null;
      feedback = { text: m.askRight(want), at: player.index };
    } else {
      wrong++;
      feedback = { text: m.askWrong(frame), at: player.index };
    }
  }

  const isList = $derived(puzzle === 'pairs' || puzzle === 'subarrays');
  const shownFeedback = $derived(feedback.at === player.index ? feedback.text : '');

  /** @param {number} r @returns {SeenRole} */
  function seenRole(r) {
    if (frame.kind === 'count' && r === frame.r) return 'bumped';
    if ((frame.kind === 'read' || frame.kind === 'count') && r === frame.need) return 'lookup';
    return 'plain';
  }

  const pointers = $derived(frame.i >= 0 ? [{ name: m.valuePointer, index: frame.i }] : []);
  const hidden = $derived(Math.max(0, frame.rows.length - ROWS_SHOWN));
  const shownRows = $derived(frame.rows.slice(hidden));
  const tableHead = $derived(puzzle === 'rangeSum' ? m.tableHead.rangeSum : m.tableHead.divisors);

  let calcA = $state(5);
  let calcB = $state(3);
  let calcM = $state(7);
  let calcOp = $state(/** @type {CalcOp} */ ('div'));
  let aDraft = $state(/** @type {number | null} */ (5));
  let bDraft = $state(/** @type {number | null} */ (3));
  let cDraft = $state(/** @type {number | null} */ (7));
  let calcNotice = $state('');

  const calcOut = $derived(calculate(calcOp, calcA, calcB, calcM));
  const calcLine = $derived(
    calcNotice ||
      ('error' in calcOut
        ? m.calcNoInverse(calcB, calcM)
        : m.calcResult(calcOp, calcA, calcB, calcM, calcOut.value, calcOut.inverse)),
  );

  function commitCalcA() {
    calcNotice = '';
    if (!wholeInRange(aDraft, 0, MAX_CALC)) {
      aDraft = calcA;
      calcNotice = m.calcValueError(MAX_CALC);
      return;
    }
    calcA = /** @type {number} */ (aDraft);
  }

  function commitCalcB() {
    calcNotice = '';
    if (!wholeInRange(bDraft, 0, MAX_CALC)) {
      bDraft = calcB;
      calcNotice = m.calcValueError(MAX_CALC);
      return;
    }
    calcB = /** @type {number} */ (bDraft);
  }

  function commitCalcM() {
    calcNotice = '';
    if (!wholeInRange(cDraft, 1, MAX_CALC_MODULUS)) {
      cDraft = calcM;
      calcNotice = m.calcModulusError(MAX_CALC_MODULUS);
      return;
    }
    calcM = /** @type {number} */ (cDraft);
  }
</script>

{#snippet stat(
  /** @type {string} */ label,
  /** @type {string | number} */ v,
  /** @type {string} */ id,
  wide = false,
)}
  <div class="rounded-xl border border-slate-200 bg-white p-3 {wide ? 'col-span-2' : ''}">
    <dt class="text-xs text-slate-500">{label}</dt>
    <dd class="text-xl font-bold break-all tabular-nums" data-testid={id}>
      {typeof v === 'number' ? v.toLocaleString('en-US') : v}
    </dd>
  </div>
{/snippet}

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.puzzleLabel}
      <select name="puzzle" class="field" bind:value={puzzle} onchange={pickPuzzle}>
        {#each PUZZLES as p (p)}
          <option value={p}>{m.puzzles[p]}</option>
        {/each}
      </select>
    </label>
    {#if puzzle === 'divisors'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.n}
        <input
          type="number"
          name="n"
          min="1"
          max={MAX_DIVISOR_N}
          class="field w-36 tabular-nums"
          bind:value={nDraft}
          onchange={commitN}
        />
      </label>
    {:else if puzzle === 'rangeSum'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.N}
        <input
          type="number"
          name="limit"
          min="1"
          max={MAX_RANGE_N}
          class="field w-24 tabular-nums"
          bind:value={limitDraft}
          onchange={commitLimit}
        />
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.values}
        <input
          type="text"
          name="values"
          class="field w-56 tabular-nums"
          bind:value={valuesText}
          onchange={commitValues}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.m}
        <input
          type="number"
          name="m"
          min="1"
          max={MAX_MODULUS}
          class="field w-24 tabular-nums"
          bind:value={modDraft}
          onchange={commitMod}
        />
      </label>
    {/if}
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      {#if isList}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.valuesTitle}
          </h2>
          <ArrayStrip
            values={frame.values}
            ariaLabel={m.valuesAria(frame.m)}
            stateOf={(i) => (i === frame.i ? 'active' : i < frame.i ? 'visited' : '')}
            {pointers}
            speed={player.speed}
          />
          <h2 class="mt-3 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.seenTitle}
          </h2>
          <ArrayStrip
            values={frame.seen}
            ariaLabel={m.seenAria}
            stateOf={(r) => SEEN_STATE[seenRole(r)]}
            markerOf={(r) => m.seenMarkers[seenRole(r)]}
            labelOf={(r) => m.seenLabel(r, frame.seen[r], m.seenStates[seenRole(r)])}
            speed={player.speed}
          />
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each LEGEND as role (role)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[SEEN_STATE[role]]}"
                ></span>{m.legend[role]}
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.tableTitle}
          </h2>
          {#if frame.rows.length === 0}
            <p class="text-sm text-slate-500">{m.tableEmpty}</p>
          {:else}
            {#if hidden > 0}
              <p class="mb-1 text-xs text-slate-500">{m.tableHidden(hidden)}</p>
            {/if}
            <ScrollFrame>
              <table class="w-full text-right text-sm tabular-nums" data-testid="rows">
                <thead>
                  <tr class="text-xs text-slate-500">
                    {#each tableHead as head (head)}
                      <th scope="col" class="px-2 py-1 font-semibold">{head}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each shownRows as row, r (hidden + r)}
                    <tr class="border-t border-slate-100">
                      {#each row as cell, c (c)}
                        <td class="px-2 py-1">{cell.toLocaleString('en-US')}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </ScrollFrame>
          {/if}
        </div>
      {/if}

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>

      <div class="rounded-xl border border-teal-300 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-teal-800 uppercase">
          {m.askTitle}
        </h2>
        {#if frame.ask !== null}
          <form
            class="flex flex-wrap items-end gap-3"
            onsubmit={(ev) => {
              ev.preventDefault();
              checkGuess();
            }}
          >
            <label class="flex flex-col gap-1 text-sm text-slate-700">
              {m.askLabels[puzzle]}
              <input
                type="number"
                name="guess"
                class="field w-40 tabular-nums"
                bind:value={guess}
              />
            </label>
            <button type="submit" class="btn-secondary">{m.askCheck}</button>
          </form>
        {:else}
          <p class="text-sm text-slate-600">{m.askIdle}</p>
        {/if}
        <p
          class="mt-2 min-h-5 text-sm font-medium text-slate-800"
          aria-live="polite"
          data-testid="feedback"
        >
          {shownFeedback}
        </p>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        {@render stat(m.stats.answer[puzzle], frame.total, 'answer', puzzle !== 'divisors')}
        {#if puzzle === 'divisors'}
          {@render stat(m.stats.tau, frame.tau, 'tau')}
        {/if}
        {@render stat(m.stats.steps, frame.steps, 'steps')}
        {@render stat(m.stats.brute, frame.brute, 'brute')}
        {@render stat(m.stats.right, right, 'right')}
        {@render stat(m.stats.wrong, wrong, 'wrong')}
      </dl>
      {#if puzzle === 'divisors'}
        <ChipList
          title={m.divisorsTitle}
          items={frame.divisors.map((d) => ({ label: d.toLocaleString('en-US') }))}
          emptyText={m.divisorsEmpty}
          limit={100}
        />
      {/if}
      <CodePanel lines={PSEUDOCODE[puzzle]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-4 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">{m.calcTitle}</h2>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form
      class="flex flex-wrap items-end gap-3"
      onkeydown={(ev) => enterField(ev, {})}
      onsubmit={(ev) => ev.preventDefault()}
    >
      <label class="flex flex-col gap-1 text-sm text-slate-700">
        {m.calcFields.a}
        <input
          type="number"
          name="calc-a"
          min="0"
          max={MAX_CALC}
          class="field w-32 tabular-nums"
          bind:value={aDraft}
          onchange={commitCalcA}
        />
      </label>
      <label class="flex flex-col gap-1 text-sm text-slate-700">
        {m.calcFields.op}
        <select name="calc-op" class="field" bind:value={calcOp}>
          {#each CALC_OPS as op (op)}
            <option value={op}>{m.calcOps[op]}</option>
          {/each}
        </select>
      </label>
      <label class="flex flex-col gap-1 text-sm text-slate-700">
        {m.calcFields.b}
        <input
          type="number"
          name="calc-b"
          min="0"
          max={MAX_CALC}
          class="field w-32 tabular-nums"
          bind:value={bDraft}
          onchange={commitCalcB}
        />
      </label>
      <label class="flex flex-col gap-1 text-sm text-slate-700">
        {m.calcFields.m}
        <input
          type="number"
          name="calc-m"
          min="1"
          max={MAX_CALC_MODULUS}
          class="field w-36 tabular-nums"
          bind:value={cDraft}
          onchange={commitCalcM}
        />
      </label>
    </form>
    <p
      class="mt-3 font-mono text-sm font-semibold break-words text-slate-900"
      aria-live="polite"
      data-testid="calc"
    >
      {calcLine}
    </p>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
