<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import { parseValueList } from '$lib/algo-engine/parse-values.js';
  import {
    BIG_PRESETS,
    MAX_COEFF,
    MAX_DIGITS,
    MAX_INDEX,
    MAX_MODULUS,
    MAX_ORDER,
    MIN_MODULUS,
    PSEUDOCODE,
    RECURRENCE_PRESETS,
    bigTrace,
    parseBig,
    recurrenceTrace,
  } from '$lib/algo-engine/practice-algebraic-randomised.js';
  import { vi as m } from '$lib/lessons/practice-algebraic-randomised/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/practice-algebraic-randomised.js').Problem} Problem */
  /** @typedef {import('$lib/algo-engine/practice-algebraic-randomised.js').Recurrence} Recurrence */
  /** @typedef {keyof typeof RECURRENCE_PRESETS} RecPreset */
  /** @typedef {keyof typeof BIG_PRESETS} BigPreset */

  const PROBLEM_OPTIONS = [
    { value: 'recurrence', label: m.problems.recurrence },
    { value: 'bignum', label: m.problems.bignum },
  ];
  const REC_KEYS = /** @type {RecPreset[]} */ (Object.keys(RECURRENCE_PRESETS));
  const BIG_KEYS = /** @type {BigPreset[]} */ (Object.keys(BIG_PRESETS));

  const FIRST = RECURRENCE_PRESETS.constant;
  let problem = $state(/** @type {Problem} */ ('recurrence'));
  let notice = $state({ text: '', at: -1 });

  // Recurrence inputs, each with the draft its field shows.
  let recPreset = $state(/** @type {RecPreset | ''} */ ('constant'));
  let rec = $state(/** @type {Recurrence} */ ({ ...FIRST.rec }));
  let n = $state(FIRST.n);
  let mod = $state(FIRST.mod);
  let coeffsDraft = $state(FIRST.rec.coeffs.join(', '));
  let initialDraft = $state(FIRST.rec.initial.join(', '));
  let constantDraft = $state(/** @type {number | null} */ (FIRST.rec.constant));
  let nDraft = $state(/** @type {number | null} */ (FIRST.n));
  let modDraft = $state(/** @type {number | null} */ (FIRST.mod));

  // Big-number inputs.
  let bigPreset = $state(/** @type {BigPreset | ''} */ ('small'));
  let x = $state(BIG_PRESETS.small[0]);
  let y = $state(BIG_PRESETS.small[1]);
  let xDraft = $state(BIG_PRESETS.small[0]);
  let yDraft = $state(BIG_PRESETS.small[1]);

  const recPlayer = createPlayer(recurrenceTrace(FIRST.rec, FIRST.n, FIRST.mod));
  const bigPlayer = createPlayer(bigTrace(...BIG_PRESETS.small));
  const rf = $derived(recPlayer.frame);
  const bf = $derived(bigPlayer.frame);
  const index = $derived(problem === 'recurrence' ? recPlayer.index : bigPlayer.index);
  const playing = $derived(problem === 'recurrence' ? recPlayer.playing : bigPlayer.playing);
  const narration = $derived(
    notice.at === index
      ? notice.text
      : problem === 'recurrence'
        ? m.describeRecurrence(rf, rec)
        : m.describeBig(bf),
  );

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: index };
  }

  function rebuildRec() {
    notice = { text: '', at: -1 };
    recPlayer.load(recurrenceTrace(rec, n, mod));
  }

  function rebuildBig() {
    notice = { text: '', at: -1 };
    bigPlayer.load(bigTrace(x, y));
  }

  function changeProblem() {
    notice = { text: '', at: -1 };
  }

  /** @param {Recurrence} next */
  function setRec(next) {
    rec = next;
    coeffsDraft = next.coeffs.join(', ');
    initialDraft = next.initial.join(', ');
    constantDraft = next.constant;
    recPreset = '';
    rebuildRec();
  }

  function commitCoeffs() {
    const parsed = parseValueList(coeffsDraft, { max: MAX_COEFF, maxN: MAX_ORDER });
    if (!('values' in parsed)) {
      coeffsDraft = rec.coeffs.join(', ');
      say(m.coeffsError(MAX_ORDER, MAX_COEFF));
      return;
    }
    if (parsed.values.join(',') === rec.coeffs.join(',')) return;
    const k = parsed.values.length;
    // A new order keeps the start values it can and pads the rest with 1.
    const initial = Array.from({ length: k }, (_, i) => rec.initial[i] ?? 1);
    setRec({ ...rec, coeffs: parsed.values, initial });
  }

  function commitInitial() {
    const k = rec.coeffs.length;
    const parsed = parseValueList(initialDraft, { max: MAX_COEFF, minN: k, maxN: k });
    if (!('values' in parsed)) {
      initialDraft = rec.initial.join(', ');
      say(m.initialError(k, MAX_COEFF));
      return;
    }
    if (parsed.values.join(',') === rec.initial.join(',')) return;
    setRec({ ...rec, initial: parsed.values });
  }

  function commitConstant() {
    if (!wholeInRange(constantDraft, 0, MAX_COEFF)) {
      constantDraft = rec.constant;
      say(m.constantError(MAX_COEFF));
      return;
    }
    const d = /** @type {number} */ (constantDraft);
    if (d !== rec.constant) setRec({ ...rec, constant: d });
  }

  function commitN() {
    if (!wholeInRange(nDraft, 0, MAX_INDEX)) {
      nDraft = n;
      say(m.nError(MAX_INDEX));
      return;
    }
    if (nDraft === n) return;
    n = /** @type {number} */ (nDraft);
    recPreset = '';
    rebuildRec();
  }

  function commitMod() {
    if (!wholeInRange(modDraft, MIN_MODULUS, MAX_MODULUS)) {
      modDraft = mod;
      say(m.modError(MIN_MODULUS, MAX_MODULUS));
      return;
    }
    if (modDraft === mod) return;
    mod = /** @type {number} */ (modDraft);
    recPreset = '';
    rebuildRec();
  }

  /** @param {RecPreset} p */
  function loadRecPreset(p) {
    const preset = RECURRENCE_PRESETS[p];
    rec = { ...preset.rec };
    n = preset.n;
    mod = preset.mod;
    coeffsDraft = rec.coeffs.join(', ');
    initialDraft = rec.initial.join(', ');
    constantDraft = rec.constant;
    nDraft = n;
    modDraft = mod;
    recPreset = p;
    rebuildRec();
  }

  /** @param {'x' | 'y'} which */
  function commitFactor(which) {
    const draft = which === 'x' ? xDraft : yDraft;
    const value = parseBig(draft);
    if (value === null) {
      if (which === 'x') xDraft = x;
      else yDraft = y;
      say(m.bigError(MAX_DIGITS));
      return;
    }
    if (which === 'x') {
      xDraft = value;
      if (value === x) return;
      x = value;
    } else {
      yDraft = value;
      if (value === y) return;
      y = value;
    }
    bigPreset = '';
    rebuildBig();
  }

  /** @param {BigPreset} p */
  function loadBigPreset(p) {
    [x, y] = BIG_PRESETS[p];
    xDraft = x;
    yDraft = y;
    bigPreset = p;
    rebuildBig();
  }

  /** @param {number} r @returns {VisualState} */
  const matrixRowState = (r) => (rf.kind === 'row' && rf.row === r ? 'active' : '');

  const k = $derived(rec.coeffs.length);
  const heads = $derived({
    cols: Array.from({ length: rf.size }, (_, j) => m.colHead(j, k)),
    rows: Array.from({ length: rf.size }, (_, i) => m.rowHead(i, k)),
  });

  // The digit grid is drawn as written: the highest digit first on both axes.
  const la = $derived(bf.a.length);
  const lb = $derived(bf.b.length);
  const grid = $derived(
    Array.from({ length: lb }, (_, r) =>
      Array.from({ length: la }, (_, c) => bf.a[la - 1 - c] * bf.b[lb - 1 - r]),
    ),
  );
  /** Place of the grid cell (r, c): i + j. @param {number} r @param {number} c */
  const placeOf = (r, c) => la - 1 - c + (lb - 1 - r);
  /** @param {number} r @param {number} c @returns {VisualState} */
  function gridState(r, c) {
    return bf.kind === 'conv' && placeOf(r, c) === bf.k ? 'compare' : '';
  }
  const cWritten = $derived(bf.c.slice().reverse());
  const digitsWritten = $derived(bf.digits.slice().reverse());
  /** @param {number} i @returns {VisualState} */
  function convState(i) {
    const p = bf.c.length - 1 - i;
    if (bf.k !== p) return '';
    return bf.kind === 'conv' ? 'compare' : 'active';
  }
  /** @param {number} i @returns {VisualState} */
  const digitState = (i) => (i === 0 && bf.kind !== 'done' && bf.kind !== 'start' ? 'active' : '');
  /** @param {VisualState} s */
  const markerFor = (s) =>
    s === 'compare' ? m.markers.sum : s === 'active' ? m.markers.carry : '';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4">
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEM_OPTIONS}
      bind:value={problem}
      onchange={changeProblem}
    />
  </div>

  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    {#if problem === 'recurrence'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.coeffs}
        <input
          type="text"
          name="coeffs"
          class="field w-36 tabular-nums"
          bind:value={coeffsDraft}
          onchange={commitCoeffs}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.constant}
        <input
          type="number"
          name="constant"
          min="0"
          max={MAX_COEFF}
          class="field w-20 tabular-nums"
          bind:value={constantDraft}
          onchange={commitConstant}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.initial}
        <input
          type="text"
          name="initial"
          class="field w-36 tabular-nums"
          bind:value={initialDraft}
          onchange={commitInitial}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.n}
        <input
          type="number"
          name="n"
          min="0"
          max={MAX_INDEX}
          class="field w-48 tabular-nums"
          bind:value={nDraft}
          onchange={commitN}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.mod}
        <input
          type="number"
          name="mod"
          min={MIN_MODULUS}
          max={MAX_MODULUS}
          class="field w-36 tabular-nums"
          bind:value={modDraft}
          onchange={commitMod}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.presetLabel}
        <select
          name="rec-preset"
          class="field"
          value={recPreset}
          onchange={(ev) => loadRecPreset(/** @type {RecPreset} */ (ev.currentTarget.value))}
        >
          {#if recPreset === ''}<option value="" disabled>—</option>{/if}
          {#each REC_KEYS as p (p)}<option value={p}>{m.recurrencePresets[p]}</option>{/each}
        </select>
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.x}
        <input
          type="text"
          name="x"
          inputmode="numeric"
          class="field w-44 tabular-nums"
          bind:value={xDraft}
          onchange={() => commitFactor('x')}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.y}
        <input
          type="text"
          name="y"
          inputmode="numeric"
          class="field w-44 tabular-nums"
          bind:value={yDraft}
          onchange={() => commitFactor('y')}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.presetLabel}
        <select
          name="big-preset"
          class="field"
          value={bigPreset}
          onchange={(ev) => loadBigPreset(/** @type {BigPreset} */ (ev.currentTarget.value))}
        >
          {#if bigPreset === ''}<option value="" disabled>—</option>{/if}
          {#each BIG_KEYS as p (p)}<option value={p}>{m.bigPresets[p]}</option>{/each}
        </select>
      </label>
    {/if}
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      {#if problem === 'recurrence'}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <p class="mb-2 font-mono text-sm text-slate-900" data-testid="formula">
            {m.formula(rec)}; {m.startText(rec)}
          </p>
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.matrixTitle}
          </h2>
          <DpTable
            values={rf.matrix}
            ariaLabel={m.matrixAria(rf.size)}
            rowHeaders={heads.rows}
            colHeaders={heads.cols}
            stateOf={(r) => matrixRowState(r)}
            markerOf={(r, c) => (c === 0 && matrixRowState(r) === 'active' ? m.markers.row : '')}
            speed={recPlayer.speed}
          />
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="min-w-0">
              <h3 class="mb-1 text-xs font-semibold text-slate-600">{m.rTitle(rf.covered)}</h3>
              {#if rf.r.length}
                <DpTable values={rf.r} ariaLabel={m.rAria} speed={recPlayer.speed} />
              {:else}<p class="text-sm text-slate-500">{m.notYet}</p>{/if}
            </div>
            <div class="min-w-0">
              <h3 class="mb-1 text-xs font-semibold text-slate-600">{m.pTitle(rf.power)}</h3>
              {#if rf.p.length}
                <DpTable values={rf.p} ariaLabel={m.pAria} speed={recPlayer.speed} />
              {:else}<p class="text-sm text-slate-500">{m.notYet}</p>{/if}
            </div>
          </div>
          <p class="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.active}"></span>{m
              .legend.row}
          </p>
          <p class="mt-3 font-mono text-sm break-all text-slate-700" data-testid="vectors">
            {m.startVector(rf.start)}{rf.result.length
              ? `; ${m.resultVector(rf.result, rf.n)}`
              : ''}
          </p>
        </div>
      {:else}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.gridTitle}
          </h2>
          <DpTable
            values={grid}
            ariaLabel={m.gridAria(x, y)}
            colHeaders={Array.from({ length: la }, (_, c) => m.digitHead(bf.a[la - 1 - c]))}
            rowHeaders={Array.from({ length: lb }, (_, r) => m.digitHead(bf.b[lb - 1 - r]))}
            stateOf={gridState}
            markerOf={(r, c) => markerFor(gridState(r, c))}
            speed={bigPlayer.speed}
          />
          <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.convTitle}
          </h2>
          <ArrayStrip
            values={cWritten.map((v) => v ?? '')}
            ariaLabel={m.convAria}
            stateOf={convState}
            markerOf={(i) => markerFor(convState(i))}
            showIndices={false}
            speed={bigPlayer.speed}
          />
          <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.digitsTitle}
          </h2>
          <ArrayStrip
            values={digitsWritten}
            ariaLabel={m.digitsAria}
            stateOf={digitState}
            markerOf={(i) => markerFor(digitState(i))}
            showIndices={false}
            speed={bigPlayer.speed}
          />
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.compare}"></span>{m
                .legend.sum}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.active}"></span>{m
                .legend.carry}
            </li>
          </ul>
        </div>
      {/if}

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      {#if problem === 'recurrence'}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.recStats.size}</dt>
            <dd class="text-xl font-bold tabular-nums" data-testid="size">
              {m.sizeText(rf.size)}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.recStats.products}</dt>
            <dd class="text-xl font-bold tabular-nums" data-testid="products">
              {rf.matrixProducts}
            </dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.recStats.e}</dt>
            <dd class="text-xl font-bold break-all tabular-nums" data-testid="e">
              {rf.e}
            </dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.recStats.answer}</dt>
            <dd class="text-xl font-bold break-all tabular-nums" data-testid="answer">
              {rf.answer || '—'}
            </dd>
          </div>
        </dl>
        <CodePanel lines={PSEUDOCODE.recurrence} active={rf.lines} />
      {:else}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.bigStats.products}</dt>
            <dd class="text-xl font-bold tabular-nums" data-testid="digit-products">
              {bf.products}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.bigStats.carry}</dt>
            <dd class="text-xl font-bold tabular-nums" data-testid="carry">{bf.carry}</dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.bigStats.answer}</dt>
            <dd class="text-xl font-bold break-all tabular-nums" data-testid="product">
              {bf.answer || '—'}
            </dd>
          </div>
        </dl>
        <CodePanel lines={PSEUDOCODE.bignum} active={bf.lines} />
      {/if}
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      {#if problem === 'recurrence'}
        <StepControls player={recPlayer} />
      {:else}
        <StepControls player={bigPlayer} />
      {/if}
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
