<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import { createFieldGuard, enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import {
    DEFAULTS,
    MAX_SEED,
    PARAM,
    PROBLEMS,
    SIZE,
    growthSizes,
    makeInput,
    racePseudocode,
    solveFast,
    solveNaive,
  } from '$lib/algo-engine/practice-advanced-dp.js';
  import { en as m } from '$lib/lessons/practice-advanced-dp/copy.en.js';

  /** @typedef {import('$lib/algo-engine/practice-advanced-dp.js').RaceProblem} RaceProblem */
  /** @typedef {{n: number, naiveOps: number, fastOps: number, naiveMs: number, fastMs: number}} GrowthRow */

  const PREVIEW = 12;
  const SIDES = /** @type {('naive'|'fast')[]} */ (['naive', 'fast']);

  let problem = $state(/** @type {RaceProblem} */ ('window'));
  let n = $state(DEFAULTS.window.n);
  let param = $state(DEFAULTS.window.param);
  let seed = $state(1);
  let nDraft = $state(/** @type {number | null} */ (DEFAULTS.window.n));
  let paramDraft = $state(/** @type {number | null} */ (DEFAULTS.window.param));
  let seedDraft = $state(/** @type {number | null} */ (1));
  let notice = $state('');
  let timing = $state(/** @type {{naive: number, fast: number} | null} */ (null));
  let growth = $state(/** @type {GrowthRow[]} */ ([]));

  const guards = { n: createFieldGuard(), param: createFieldGuard(), seed: createFieldGuard() };

  const input = $derived(makeInput(problem, n, param, seed));
  const naive = $derived(solveNaive(input));
  const fast = $derived(solveFast(input));
  const top = $derived(Math.max(naive.ops, fast.ops, 1));
  const paramMax = $derived(
    problem === 'window' ? Math.min(PARAM.window.max, n - 1) : PARAM[problem].max,
  );

  function changed() {
    timing = null;
    growth = [];
    notice = '';
  }

  function pickProblem() {
    n = DEFAULTS[problem].n;
    param = DEFAULTS[problem].param;
    nDraft = n;
    paramDraft = param;
    changed();
  }

  function commitN() {
    const { min, max } = SIZE[problem];
    if (!guards.n.commit(wholeInRange(nDraft, min, max))) {
      nDraft = n;
      notice = m.sizeError(min, max);
      return;
    }
    if (nDraft === n) return;
    n = /** @type {number} */ (nDraft);
    if (problem === 'window' && param > n - 1) param = paramDraft = n - 1;
    changed();
  }

  function commitParam() {
    if (!guards.param.commit(wholeInRange(paramDraft, PARAM[problem].min, paramMax))) {
      paramDraft = param;
      notice = m.paramError(problem, PARAM[problem].min, paramMax);
      return;
    }
    if (paramDraft === param) return;
    param = /** @type {number} */ (paramDraft);
    changed();
  }

  function commitSeed() {
    if (!guards.seed.commit(wholeInRange(seedDraft, 1, MAX_SEED))) {
      seedDraft = seed;
      notice = m.seedError(MAX_SEED);
      return;
    }
    if (seedDraft === seed) return;
    seed = /** @type {number} */ (seedDraft);
    changed();
  }

  function newInput() {
    seed = seedDraft = 1 + Math.floor(Math.random() * MAX_SEED);
    changed();
  }

  /** @param {() => unknown} work */
  function timed(work) {
    const start = performance.now();
    work();
    return performance.now() - start;
  }

  function run() {
    // A field refused just before this click keeps its old value; say so instead of running.
    if (guards.n.refused() || guards.param.refused() || guards.seed.refused()) return;
    notice = '';
    timing = { naive: timed(() => solveNaive(input)), fast: timed(() => solveFast(input)) };
    growth = growthSizes(problem, n).map((size) => {
      const k = problem === 'window' ? Math.min(param, size - 1) : param;
      const sample = makeInput(problem, size, k, seed);
      /** @type {{ops: number}} */
      let a = { ops: 0 };
      /** @type {{ops: number}} */
      let b = { ops: 0 };
      const naiveMs = timed(() => (a = solveNaive(sample)));
      const fastMs = timed(() => (b = solveFast(sample)));
      return { n: size, naiveOps: a.ops, fastOps: b.ops, naiveMs, fastMs };
    });
  }

  const preview = $derived(problem === 'tour' ? [] : input.values.slice(0, PREVIEW));
  const cityChips = $derived(input.cities.map((c, i) => ({ label: `${i}: ${m.city(c)}` })));
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      run();
    }}
    onkeydown={(e) => enterField(e, { n: run, param: run, seed: run })}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((v) => ({ value: v, label: m.problems[v] }))}
      bind:value={problem}
      onchange={pickProblem}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sizeLabel}
      <input
        type="number"
        name="n"
        min={SIZE[problem].min}
        max={SIZE[problem].max}
        class="field w-28"
        bind:value={nDraft}
        onchange={commitN}
      />
    </label>
    {#if problem !== 'tour'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.paramLabel[problem]}
        <input
          type="number"
          name="param"
          min={PARAM[problem].min}
          max={paramMax}
          class="field w-24"
          bind:value={paramDraft}
          onchange={commitParam}
        />
      </label>
    {/if}
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.seedLabel}
      <input
        type="number"
        name="seed"
        min="1"
        max={MAX_SEED}
        class="field w-24"
        bind:value={seedDraft}
        onchange={commitSeed}
      />
    </label>
    <button type="button" class="btn-outline" onclick={newInput}>{m.newInput}</button>
    <button type="submit" class="btn-primary">{m.run}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-slate-800">{m.statements[problem]}</p>
        <p class="mt-1 text-sm font-semibold text-teal-800">{m.optimisation[problem]}</p>
        {#if problem === 'tour'}
          <div class="mt-4">
            <ChipList title={m.inputTitle} emptyText="" items={cityChips} limit={10} />
          </div>
        {:else}
          <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.inputTitle}
          </h2>
          <ArrayStrip values={preview} ariaLabel={m.inputAria(problem, preview.length)} />
          <p class="mt-1 text-xs text-slate-600">
            {m.inputMore(preview.length, input.values.length)}
          </p>
        {/if}
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        {#each SIDES as side (side)}
          {@const result = side === 'naive' ? naive : fast}
          <section
            class="rounded-xl border border-slate-200 bg-white p-4"
            aria-label={side === 'naive' ? m.naiveTitle : m.fastTitle}
          >
            <h2 class="mb-2 text-sm font-semibold text-slate-700">
              {side === 'naive' ? m.naiveTitle : m.fastTitle}
            </h2>
            <dl class="grid grid-cols-3 gap-2">
              <div>
                <dt class="text-xs text-slate-500">{m.answer}</dt>
                <dd class="text-xl font-bold tabular-nums" data-testid="{side}-answer">
                  {m.big(result.answer)}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-slate-500">{m.work}</dt>
                <dd class="text-xl font-bold tabular-nums" data-testid="{side}-ops">
                  {m.big(result.ops)}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-slate-500">{m.time}</dt>
                <dd class="text-xl font-bold tabular-nums" data-testid="{side}-time">
                  {timing ? m.ms(timing[side]) : m.notTimed}
                </dd>
              </div>
            </dl>
            <div class="mt-3 h-3 rounded-full bg-slate-100" aria-hidden="true">
              <div
                class="h-3 rounded-full {side === 'naive' ? 'bg-state-swap' : 'bg-state-sorted'}"
                style="width: {Math.max(1, (100 * result.ops) / top)}%"
              ></div>
            </div>
          </section>
        {/each}
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live="polite"
        data-testid="verdict"
      >
        {notice ||
          `${naive.answer === fast.answer ? m.same : m.differ(naive.answer, fast.answer)} ${m.ratio(naive.ops, fast.ops)}`}
      </p>
      <p class="text-xs text-slate-600">{m.workNote[problem]}</p>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.growthTitle}
        </h2>
        {#if growth.length}
          <div class="overflow-x-auto">
            <table class="w-full text-right text-sm tabular-nums" data-testid="growth">
              <thead class="text-xs text-slate-500">
                <tr>
                  {#each m.growthHead as h (h)}<th scope="col" class="px-2 py-1">{h}</th>{/each}
                </tr>
              </thead>
              <tbody>
                {#each growth as row (row.n)}
                  <tr class="border-t border-slate-100">
                    <th scope="row" class="px-2 py-1">{m.big(row.n)}</th>
                    <td class="px-2 py-1">{m.big(row.naiveOps)}</td>
                    <td class="px-2 py-1">{m.big(row.fastOps)}</td>
                    <td class="px-2 py-1">{m.ms(row.naiveMs)}</td>
                    <td class="px-2 py-1">{m.ms(row.fastMs)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="text-sm text-slate-600">{m.growthEmpty}</p>
        {/if}
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4">
      <div>
        <h2 class="mb-1 text-xs font-semibold text-slate-500">{m.codeTitle.naive}</h2>
        <CodePanel lines={racePseudocode[problem].naive} active={[]} />
      </div>
      <div>
        <h2 class="mb-1 text-xs font-semibold text-slate-500">{m.codeTitle.fast}</h2>
        <CodePanel lines={racePseudocode[problem].fast} active={[]} />
      </div>
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
