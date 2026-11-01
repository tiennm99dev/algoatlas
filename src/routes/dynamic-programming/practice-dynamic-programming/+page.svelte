<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    ANSWERS,
    BASES,
    COMBINES,
    MAX_ABS,
    MAX_N,
    MIN_N,
    PROBLEMS,
    SAMPLES,
    STARTERS,
    STATES,
    TERMS,
    designPseudocode,
    designTrace,
    normalizeTerms,
    parseValues,
    randomValues,
    runDesign,
  } from '$lib/algo-engine/practice-dynamic-programming.js';
  import { en as m } from '$lib/lessons/practice-dynamic-programming/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-dynamic-programming.js').Problem} Problem */
  /** @typedef {import('$lib/algo-engine/practice-dynamic-programming.js').Design} Design */
  /** @typedef {import('$lib/algo-engine/practice-dynamic-programming.js').Term} Term */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'current'|'read'|'right'|'wrong'|''} Role */

  const INITIAL_PROBLEM = /** @type {Problem} */ ('max-subarray');
  const INITIAL = SAMPLES[INITIAL_PROBLEM][0];
  const errors = m.errors(MIN_N, MAX_N, MAX_ABS);

  let problem = $state(INITIAL_PROBLEM);
  /** @type {Record<Problem, Design>} */
  let designs = $state({
    'max-subarray': { ...STARTERS['max-subarray'] },
    climb: { ...STARTERS.climb },
    decode: { ...STARTERS.decode },
  });
  let values = $state(INITIAL);
  let valuesText = $state(m.inputText(INITIAL_PROBLEM, INITIAL));
  let notice = $state({ text: '', at: -1 });

  const design = $derived(designs[problem]);
  const plain = () => /** @type {Design} */ ($state.snapshot(designs[problem]));
  const player = createPlayer(designTrace(INITIAL_PROBLEM, STARTERS[INITIAL_PROBLEM], INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const code = $derived(designPseudocode(problem, design));
  const firstWrongAt = $derived(
    player.frames.findIndex((f) => f.kind === 'cell' && f.right[f.i] === false),
  );
  const last = $derived(player.frames[player.frames.length - 1]);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(designTrace(problem, plain(), $state.snapshot(values)));
  }

  /** @param {number[]} next */
  function setValues(next) {
    values = next;
    valuesText = m.inputText(problem, next);
    rebuild();
  }

  function commitValues() {
    const parsed = parseValues(problem, valuesText);
    if ('error' in parsed) {
      valuesText = m.inputText(problem, values);
      say(parsed.error === 'count' ? errors.count : errors[parsed.error][problem]);
      return;
    }
    if (parsed.values.join() === values.join()) {
      valuesText = m.inputText(problem, values);
      return;
    }
    setValues(parsed.values);
  }

  function pickProblem() {
    setValues(SAMPLES[problem][0]);
  }

  /** @param {Partial<Design>} patch */
  function change(patch) {
    designs = { ...designs, [problem]: { ...designs[problem], ...patch } };
    rebuild();
  }

  /** @param {Term} term @param {boolean} on */
  function toggleTerm(term, on) {
    const next = on ? [...design.terms, term] : design.terms.filter((t) => t !== term);
    change({ terms: normalizeTerms(problem, next) });
  }

  function randomInput() {
    setValues(randomValues(problem, 3 + Math.floor(Math.random() * (MAX_N - 2))));
  }

  function jumpWrong() {
    if (firstWrongAt < 0) {
      say(m.noWrong);
      return;
    }
    player.pause();
    player.seek(firstWrongAt);
  }

  const shown = $derived(
    /** @type {(number|string|null)[][]} */ ([
      [null, ...frame.a.map(m.num)],
      frame.dp.map((v, i) => (v === null && frame.right[i] === null ? null : m.num(v))),
      frame.truth.map((v, i) => (i === 0 ? m.num(null) : v === null ? null : m.num(v))),
    ]),
  );

  /** The dp cells the terms read, as cell indices. */
  const reading = $derived.by(() => {
    if (frame.kind !== 'cell') return [];
    /** @type {number[]} */
    const read = [];
    for (const o of frame.options) {
      if (o.value === null) continue;
      if (o.term === 'prev' || o.term === 'prev-a' || o.term === 'prev-if') read.push(frame.i - 1);
      if (o.term === 'prev2' || o.term === 'prev2-a' || o.term === 'prev2-if') {
        read.push(frame.i - 2);
      }
    }
    return [...new Set(read)];
  });

  /** @param {number} r @param {number} c @returns {Role} */
  function roleOf(r, c) {
    if (r === 0) return frame.i === c ? 'current' : '';
    if (r === 1) {
      if (frame.i === c) return 'current';
      if (reading.includes(c)) return 'read';
      if (frame.right[c] === true) return 'right';
      if (frame.right[c] === false) return 'wrong';
      return '';
    }
    if (frame.right[c] === false) return 'wrong';
    return '';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'active',
    read: 'compare',
    right: 'sorted',
    wrong: 'swap',
    '': '',
  };

  /** @param {number} r @param {number} c */
  function markOf(r, c) {
    const role = roleOf(r, c);
    if (r === 1 && frame.i === c && frame.right[c] !== null) {
      return frame.right[c] ? m.markers.right : m.markers.wrong;
    }
    return role ? m.markers[role] : '';
  }

  /** @type {{from: [number, number], to: [number, number]}[]} */
  const arrows = $derived(
    reading.map((c) => ({
      from: /** @type {[number, number]} */ ([1, c]),
      to: /** @type {[number, number]} */ ([1, frame.i]),
    })),
  );

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', `${m.markers.current} ${m.legend.current}`],
    ['compare', `${m.markers.read} ${m.legend.read}`],
    ['sorted', `${m.markers.right} ${m.legend.right}`],
    ['swap', `${m.markers.wrong} ${m.legend.wrong}`],
  ]);

  const ROW_NAMES = [m.rows.a, m.rows.dp, m.rows.truth];

  const isSample = $derived(SAMPLES[problem].some((s) => s.join() === values.join()));
  const checks = $derived.by(() => {
    const rows = SAMPLES[problem].map((a, k) => ({ name: m.sampleName(k + 1), a }));
    if (!isSample) rows.push({ name: m.yourInput, a: values });
    const d = $state.snapshot(design);
    return rows.map((r) => ({ ...r, ...runDesign(problem, /** @type {Design} */ (d), r.a) }));
  });
  const passed = $derived(checks.filter((c) => c.ok).length);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((p) => ({ value: p, label: m.problems[p] }))}
      bind:value={problem}
      onchange={pickProblem}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabel[problem]}
      <input
        type="text"
        name="values"
        class="field w-72 max-w-full font-mono"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={randomInput}>{m.randomInput}</button>
  </form>

  <section class="mb-4 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.designTitle}
    </h2>
    <p class="mb-3 text-sm text-slate-700">{m.goals[problem]}</p>
    <div class="grid gap-4 md:grid-cols-2">
      <fieldset>
        <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.stateLabel}
        </legend>
        <div class="flex flex-col gap-1">
          {#each STATES[problem] as s (s)}
            <label class="flex items-start gap-2 text-sm text-slate-800">
              <input
                type="radio"
                name="state"
                value={s}
                class="mt-0.5 size-4 accent-teal-700"
                checked={design.state === s}
                onchange={() => change({ state: s })}
              />
              {m.states[s]}
            </label>
          {/each}
        </div>
      </fieldset>
      <fieldset>
        <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.termsLabel}
        </legend>
        <div class="flex flex-col gap-1">
          {#each TERMS[problem] as term (term)}
            <label class="flex items-center gap-2 font-mono text-sm text-slate-800">
              <input
                type="checkbox"
                name="term-{term}"
                class="size-4 accent-teal-700"
                checked={design.terms.includes(term)}
                onchange={(e) => toggleTerm(term, e.currentTarget.checked)}
              />
              {m.terms[term]}
            </label>
          {/each}
        </div>
      </fieldset>
    </div>
    <div class="mt-4 flex flex-wrap gap-4">
      <SegmentedControl
        legend={m.combineLabel}
        name="combine"
        options={COMBINES.map((c) => ({ value: c, label: m.combines[c] }))}
        bind:value={() => design.combine, (combine) => change({ combine })}
      />
      <SegmentedControl
        legend={m.baseLabel}
        name="base"
        options={BASES.map((b) => ({ value: String(b), label: String(b) }))}
        bind:value={() => String(design.base), (b) => change({ base: Number(b) })}
      />
      <SegmentedControl
        legend={m.answerLabel}
        name="answer"
        options={ANSWERS.map((a) => ({ value: a, label: m.answers[a] }))}
        bind:value={() => design.answer, (answer) => change({ answer })}
      />
    </div>
  </section>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <DpTable
          values={shown}
          ariaLabel={m.tableAria(frame.a.length)}
          rowHeaders={ROW_NAMES}
          colHeaders={frame.dp.map((_, i) => String(i))}
          stateOf={(r, c) => ROLE_STATE[roleOf(r, c)]}
          markerOf={markOf}
          labelOf={(r, c) => {
            const role = roleOf(r, c);
            const v = shown[r][c];
            return m.cellLabel(
              ROW_NAMES[r],
              c,
              v === null ? '' : String(v),
              role ? m.cellStates[role] : '',
            );
          }}
          {arrows}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.tableNote}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.wrong}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="wrong">{frame.wrong}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.reads}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="reads">{frame.reads}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.got}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="got">
            {frame.kind === 'answer' || frame.kind === 'done'
              ? `${m.num(frame.got)} ${frame.answerOk ? m.pass : m.fail}`
              : m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.expected}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="expected">
            {m.num(last.expected)}
          </dd>
        </div>
      </dl>

      <button type="button" class="btn-outline" aria-disabled={firstWrongAt < 0} onclick={jumpWrong}
        >{m.jumpWrong}</button
      >

      <div class="rounded-xl border border-slate-200 bg-white p-3" data-testid="options">
        <h2 class="mb-2 text-xs text-slate-500">{m.optionsTitle}</h2>
        {#if frame.kind === 'cell' && frame.options.length}
          <ul class="flex flex-col gap-1 text-sm">
            {#each frame.options as o (o.term)}
              <li class="flex items-center justify-between gap-2">
                <span class="font-mono text-xs">{m.terms[o.term]}</span>
                <span class="font-bold whitespace-nowrap tabular-nums">
                  {o.value === null ? m.offersNothing : m.num(o.value)}
                  {#if frame.winner === o.term}<span class="ml-1 text-xs text-emerald-800"
                      >{m.chosen}</span
                    >{/if}
                </span>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-slate-600">{m.optionsEmpty}</p>
        {/if}
      </div>

      <CodePanel lines={code} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <section class="mt-4 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.samplesTitle}
    </h2>
    <p class="mb-2 text-sm font-semibold text-slate-800" data-testid="samples-summary">
      {m.samplesSummary(passed, checks.length)}
    </p>
    <ul class="flex flex-col gap-1">
      {#each checks as c (c.name)}
        {@const current = c.a.join() === values.join()}
        <li>
          <button
            type="button"
            data-sample={c.name}
            class="focus-ring flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded border-2 px-2 py-1 text-left text-sm {c.ok
              ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
              : 'border-rose-700 bg-rose-50 text-rose-900'} {current
              ? 'ring-2 ring-slate-900 ring-offset-1'
              : ''}"
            aria-label={m.sampleAria(
              c.name,
              m.inputText(problem, c.a),
              c.expected,
              c.got,
              c.wrong,
              c.ok,
            )}
            aria-pressed={current}
            onclick={() => setValues(c.a)}
          >
            <span class="font-bold" aria-hidden="true">{c.ok ? m.pass : m.fail}</span>
            <span class="font-semibold">{c.name}</span>
            <span class="font-mono text-xs break-all">{m.inputText(problem, c.a)}</span>
            <span class="ml-auto text-xs tabular-nums">
              {m.expectedLabel}
              <strong>{m.num(c.expected)}</strong>, {m.gotLabel}
              <strong>{m.num(c.got)}</strong>, {m.wrongCells(c.wrong)}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </section>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
