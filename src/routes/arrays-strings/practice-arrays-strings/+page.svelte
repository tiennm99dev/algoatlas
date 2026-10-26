<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    FIT,
    MAX_TARGET,
    MAX_VALUE,
    PROBLEMS,
    SAMPLES,
    TECHNIQUES,
    parseQueries,
    parseText,
    parseValuesFor,
    pseudocodeFor,
    solveTrace,
    stepsByTechnique,
  } from '$lib/algo-engine/practice-arrays-strings.js';
  import { en as m } from '$lib/lessons/practice-arrays-strings/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').ProblemId} ProblemId */
  /** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').Technique} Technique */
  /** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').PracticeInput} PracticeInput */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @param {PracticeInput} x @returns {PracticeInput} */
  const clone = (x) => ({
    values: x.values.slice(),
    text: x.text,
    target: x.target,
    queries: x.queries.map(([l, r]) => /** @type {[number, number]} */ ([l, r])),
  });
  /** @param {PracticeInput} x */
  const queriesString = (x) => x.queries.map(([l, r]) => `${l} ${r}`).join(', ');
  /** @param {ProblemId} p @param {PracticeInput} x */
  const valuesString = (p, x) => (p === 'palindrome' ? x.text : x.values.join(', '));

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  let problem = $state(/** @type {ProblemId} */ ('pair-sum'));
  let technique = $state(/** @type {Technique} */ ('pointers'));
  let inputs = $state.raw(
    /** @type {Record<ProblemId, PracticeInput>} */ (
      Object.fromEntries(PROBLEMS.map((p) => [p, clone(SAMPLES[p])]))
    ),
  );
  let valuesText = $state(valuesString('pair-sum', SAMPLES['pair-sum']));
  /** @type {number | null} */
  let targetDraft = $state(SAMPLES['pair-sum'].target);
  let queriesText = $state('');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(solveTrace('pair-sum', 'pointers', SAMPLES['pair-sum']));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const input = $derived(inputs[problem]);
  const costs = $derived(stepsByTechnique(problem, input));
  const code = $derived(pseudocodeFor(frame.problem, frame.technique));
  const fit = $derived(FIT[frame.problem][frame.technique]);
  const done = $derived(frame.kind === 'done');

  const techniqueOptions = TECHNIQUES.map((t) => ({ value: t, label: m.techniques[t] }));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(solveTrace(problem, technique, inputs[problem]));
  }

  function syncDrafts() {
    valuesText = valuesString(problem, inputs[problem]);
    targetDraft = inputs[problem].target;
    queriesText = queriesString(inputs[problem]);
  }

  /** @param {PracticeInput} next */
  function setInput(next) {
    inputs = { ...inputs, [problem]: next };
    syncDrafts();
    rebuild();
  }

  function changeProblem() {
    syncDrafts();
    rebuild();
  }

  function commitValues() {
    const current = inputs[problem];
    if (problem === 'palindrome') {
      const parsed = parseText(valuesText);
      if ('error' in parsed) {
        valuesText = current.text;
        say(m.textErrors[parsed.error]);
        return;
      }
      setInput({ ...clone(current), text: parsed.text });
      return;
    }
    const parsed = parseValuesFor(problem, valuesText);
    if ('error' in parsed) {
      valuesText = valuesString(problem, current);
      say(m.valueErrors[parsed.error]);
      return;
    }
    const n = parsed.values.length;
    const next = { ...clone(current), values: parsed.values };
    // A shorter array cannot hold the old window or every old query; shrink them to fit.
    if (problem === 'max-window') next.target = Math.min(next.target, n);
    if (problem === 'range-sums') {
      next.queries = next.queries.filter(([, r]) => r < n);
      if (next.queries.length === 0) next.queries = [[0, n - 1]];
    }
    setInput(next);
  }

  function commitTarget() {
    const current = inputs[problem];
    const [lo, hi] =
      problem === 'pair-sum'
        ? [-2 * MAX_VALUE, 2 * MAX_VALUE]
        : problem === 'max-window'
          ? [1, current.values.length]
          : [1, MAX_TARGET];
    if (whole(targetDraft, lo, hi)) {
      setInput({ ...clone(current), target: /** @type {number} */ (targetDraft) });
    } else {
      targetDraft = current.target;
      say(m.targetError(problem, current.values.length));
    }
  }

  function commitQueries() {
    const current = inputs[problem];
    const parsed = parseQueries(queriesText, current.values.length);
    if ('error' in parsed) {
      queriesText = queriesString(current);
      say(m.queryErrors[parsed.error]);
      return;
    }
    setInput({ ...clone(current), queries: parsed.queries });
  }

  function useSample() {
    setInput(clone(SAMPLES[problem]));
  }

  function commitAll() {
    commitValues();
    if (problem in m.targetLabels) commitTarget();
    if (problem === 'range-sums') commitQueries();
  }

  /** @param {number} i */
  const inRange = (i) => frame.range !== null && i >= frame.range[0] && i < frame.range[1];

  /** @param {number} i */
  function isAnswer(i) {
    if (!done) return false;
    if (frame.problem === 'pair-sum') return frame.found !== null && frame.found.includes(i);
    if (frame.problem === 'palindrome') return frame.verdict === true;
    return frame.bestFrom >= 0 && i >= frame.bestFrom && i < frame.bestTo;
  }

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (frame.problem === 'palindrome' && frame.verdict === false && frame.found?.includes(i))
      return 'active';
    if (frame.reads.includes(i)) return 'compare';
    if (isAnswer(i)) return 'sorted';
    if (inRange(i)) return 'frontier';
    return '';
  }

  /** @param {number} i @returns {VisualState} */
  function auxStateOf(i) {
    if (i === frame.auxWrite) return 'swap';
    if (frame.auxReads.includes(i)) return 'compare';
    return '';
  }

  /** @type {Record<VisualState, string>} */
  const stateNames = {
    '': '',
    compare: m.states.read,
    swap: m.states.written,
    sorted: m.states.answer,
    active: m.states.differ,
    frontier: m.states.inside,
    visited: '',
    path: '',
  };
  /** @type {Record<VisualState, string>} */
  const markers = {
    '': '',
    compare: m.markers.read,
    swap: m.markers.written,
    sorted: m.markers.answer,
    active: m.markers.differ,
    frontier: '',
    visited: '',
    path: '',
  };

  const windows = $derived.by(() => {
    const out = [];
    const sums = frame.problem !== 'pair-sum' && frame.problem !== 'palindrome';
    if (sums && frame.range && frame.value !== null)
      out.push({ from: frame.range[0], to: frame.range[1], label: m.rangeLabel(frame.value) });
    const same =
      frame.range && frame.bestFrom === frame.range[0] && frame.bestTo === frame.range[1];
    if (frame.bestFrom >= 0 && !same && !done)
      out.push({ from: frame.bestFrom, to: frame.bestTo, label: m.bestLabel });
    return out;
  });

  const auxKind = $derived(frame.problem === 'palindrome' ? 'reversed' : 'prefix');
  const legend = /** @type {[VisualState, string][]} */ ([
    ['frontier', m.legend.inside],
    ['compare', m.legend.read],
    ['swap', m.legend.written],
    ['sorted', m.legend.answer],
    ['active', m.legend.differ],
  ]);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.problemLabel}
      <select
        class="field max-w-full normal-case"
        name="problem"
        bind:value={problem}
        onchange={changeProblem}
      >
        {#each PROBLEMS as p (p)}
          <option value={p}>{m.problems[p]}</option>
        {/each}
      </select>
    </label>
    <SegmentedControl
      legend={m.techniqueLegend}
      name="technique"
      options={techniqueOptions}
      bind:value={technique}
      onchange={rebuild}
    />
  </div>

  <p class="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
    <strong>{m.problems[problem]}.</strong>
    {m.statements[problem]}
  </p>

  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitAll();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabels[problem]}
      <input
        type="text"
        name="values"
        class="field w-64 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    {#if m.targetLabels[problem]}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.targetLabels[problem]}
        <input
          type="number"
          name="target"
          step="1"
          class="field w-24"
          bind:value={targetDraft}
          onchange={commitTarget}
        />
      </label>
    {/if}
    {#if problem === 'range-sums'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.queriesLabel}
        <input
          type="text"
          name="queries"
          class="field w-56 max-w-full"
          bind:value={queriesText}
          onchange={commitQueries}
        />
      </label>
    {/if}
    <button type="button" class="btn-secondary" onclick={useSample}>{m.sampleButton}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <section
        class="rounded-xl border px-4 py-3 {fit === 'best'
          ? 'border-teal-700 bg-teal-50'
          : fit === 'works'
            ? 'border-amber-600 bg-amber-50'
            : 'border-red-700 bg-red-50'}"
        data-testid="verdict"
      >
        <h2 class="text-sm font-semibold text-slate-900">
          {m.fitMarks[fit]}
          {m.techniqueNames[frame.technique]}: {m.fits[fit]}
        </h2>
        <p class="mt-1 text-sm text-slate-800">{m.why[frame.problem][frame.technique]}</p>
      </section>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.arrayTitle}
        </h2>
        <ArrayStrip
          values={frame.items}
          ariaLabel={m.arrayAria}
          {stateOf}
          markerOf={(i) => markers[stateOf(i)]}
          labelOf={(i) => m.cellLabel(i, frame.items[i], stateNames[stateOf(i)])}
          pointers={frame.pointers}
          {windows}
          speed={player.speed}
        />
        {#if frame.aux}
          <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.auxTitles[auxKind]}
          </h2>
          <ArrayStrip
            values={frame.aux.map((v) => (v === null ? m.spare : v))}
            ariaLabel={m.auxAria[auxKind]}
            stateOf={auxStateOf}
            markerOf={(i) => markers[auxStateOf(i)]}
            labelOf={(i) => m.cellLabel(i, frame.aux?.[i] ?? null, stateNames[auxStateOf(i)])}
            dimmed={(i) => frame.aux?.[i] === null}
            pointers={frame.auxPointers}
            speed={player.speed}
          />
        {/if}
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
          <dt class="text-xs text-slate-500">{m.stats.steps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.steps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer}</dt>
          <dd class="text-2xl font-bold break-words tabular-nums">{m.answer(frame)}</dd>
        </div>
      </dl>
      <p class="text-xs text-slate-500">{m.stepsNote}</p>

      <section class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <table class="w-full text-left text-sm tabular-nums" data-testid="compare">
          <thead>
            <tr class="text-xs text-slate-500">
              {#each m.compareHead as head (head)}
                <th scope="col" class="pb-1 font-semibold">{head}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each TECHNIQUES as t (t)}
              {@const tf = FIT[problem][t]}
              <tr
                class="border-t border-slate-100 {t === technique ? 'font-semibold' : ''}"
                aria-current={t === technique ? 'true' : undefined}
              >
                <th scope="row" class="py-1 font-normal">{m.techniqueNames[t]}</th>
                <td class="py-1">{m.fitMarks[tf]} {m.fits[tf]}</td>
                <td class="py-1">{costs[t] ?? m.notApplicable}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>

      {#if code.length > 0}
        <CodePanel lines={code} active={frame.lines} />
      {:else}
        <p class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
          {m.noCode}
        </p>
      {/if}
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
