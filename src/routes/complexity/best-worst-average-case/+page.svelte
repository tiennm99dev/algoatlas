<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_N,
    MAX_VALUE,
    averageFound,
    caseTarget,
    costProfile,
    linearSearchPseudocode,
    linearSearchTrace,
  } from '$lib/algo-engine/best-worst-average-case.js';
  import { en as m } from '$lib/lessons/best-worst-average-case/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/best-worst-average-case.js').CaseKind} CaseKind */
  /** @typedef {{kind: CaseKind | 'typed', x: number, c: number}} Run */

  const CASES = /** @type {CaseKind[]} */ (['best', 'worst', 'random']);
  /** @type {('compare' | 'visited' | 'sorted')[]} */
  const LEGEND = ['compare', 'visited', 'sorted'];
  const MAX_RUNS = 40;

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [42, 17, 8, 93, 25, 61, 4, 76];
  const INITIAL_TARGET = 25;
  let values = $state(INITIAL);
  let arrayDraft = $state(INITIAL.join(', '));
  let target = $state(INITIAL_TARGET);
  /** @type {number | null} */
  let targetDraft = $state(INITIAL_TARGET);
  /** @type {Run[]} */
  let runs = $state([]);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(linearSearchTrace(INITIAL, INITIAL_TARGET));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const n = $derived(values.length);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {string} raw @returns {number[] | null} */
  function parseArray(raw) {
    const parts = raw.split(/[\s,]+/).filter((p) => p !== '');
    if (parts.length < 1 || parts.length > MAX_N) return null;
    if (!parts.every((p) => /^\d+$/.test(p))) return null;
    const out = parts.map(Number);
    return out.every((v) => v <= MAX_VALUE) ? out : null;
  }

  /** @param {unknown} v */
  const validTarget = (v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAX_VALUE;

  /** Run the search and log it. @param {number} x @param {CaseKind | 'typed'} kind */
  function run(x, kind) {
    target = x;
    targetDraft = x;
    notice = { text: '', at: -1 };
    const frames = linearSearchTrace(values, x);
    player.load(frames);
    const c = frames[frames.length - 1].comparisons;
    runs = [...runs, { kind, x, c }].slice(-MAX_RUNS);
  }

  function commitArray() {
    const parsed = parseArray(arrayDraft);
    if (!parsed) {
      arrayDraft = values.join(', ');
      say(m.arrayError);
      return;
    }
    values = parsed;
    arrayDraft = parsed.join(', ');
    runs = [];
    notice = { text: '', at: -1 };
    player.load(linearSearchTrace(values, target));
  }

  function commitTarget() {
    if (validTarget(targetDraft)) target = /** @type {number} */ (targetDraft);
    else {
      targetDraft = target;
      say(m.targetError);
    }
  }

  function search() {
    if (!validTarget(targetDraft)) {
      targetDraft = target;
      say(m.targetError);
      return;
    }
    run(/** @type {number} */ (targetDraft), 'typed');
  }

  /** @param {CaseKind} kind */
  function runCase(kind) {
    run(caseTarget(values, kind, Math.random), kind);
  }

  function clearRuns() {
    runs = [];
  }

  /** @param {number} i @returns {import('$lib/components/visual-state.js').VisualState} */
  function stateOf(i) {
    if (frame.foundAt === i) return 'sorted';
    if (frame.kind === 'compare' && frame.i === i) return 'compare';
    if (frame.kind !== 'start' && i < frame.comparisons) return 'visited';
    return '';
  }
  /** @param {number} i */
  function markerOf(i) {
    const s = stateOf(i);
    return s === '' ? '' : m.markers[/** @type {'compare'|'visited'|'sorted'} */ (s)];
  }
  /** @param {number} i */
  function labelOf(i) {
    const s = stateOf(i);
    return m.cellLabel(
      i,
      String(frame.values[i]),
      s === '' ? '' : m.states[/** @type {'compare'|'visited'|'sorted'} */ (s)],
    );
  }

  const pointers = $derived(frame.i >= 0 ? [{ name: m.pointer, index: frame.i }] : []);
  const profile = $derived(costProfile(n));
  const outcome = $derived(
    frame.kind === 'found' || frame.kind === 'missing' || frame.kind === 'done'
      ? frame.foundAt >= 0
        ? frame.foundAt
        : n
      : -1,
  );
  const randomRuns = $derived(runs.filter((r) => r.kind === 'random'));
  const randomAvg = $derived(
    randomRuns.length ? randomRuns.reduce((s, r) => s + r.c, 0) / randomRuns.length : 0,
  );
  const chips = $derived(
    runs.map((r, i) => ({ label: m.runChip(r.kind, r.x, r.c), hot: i === runs.length - 1 })),
  );

  // Profile chart geometry.
  const BAR = 28;
  const GAP = 6;
  const LEFT = 8;
  const TOP = 18;
  const PLOT_H = 120;
  const chartW = $derived(LEFT * 2 + (n + 1) * (BAR + GAP));
  /** @param {number} c */
  const barH = (c) => (c / Math.max(1, n)) * PLOT_H;
  const avgY = $derived(TOP + PLOT_H - barH(averageFound(n)));
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      search();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.arrayLabel}
      <input
        type="text"
        name="array"
        inputmode="numeric"
        class="field w-72 max-w-full"
        bind:value={arrayDraft}
        onchange={commitArray}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.targetLabel}
      <input
        type="number"
        name="target"
        min="0"
        max={MAX_VALUE}
        step="1"
        class="field w-24"
        bind:value={targetDraft}
        onchange={commitTarget}
      />
    </label>
    <button type="submit" class="btn-primary">{m.search}</button>
    <div class="flex flex-wrap gap-2 border-l border-slate-300 pl-4">
      {#each CASES as c (c)}
        <button type="button" class="btn-outline" onclick={() => runCase(c)}
          >{m.caseButtons[c]}</button
        >
      {/each}
    </div>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ArrayStrip
          values={frame.values}
          ariaLabel={m.arrayAria}
          {stateOf}
          {markerOf}
          {labelOf}
          {pointers}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each LEGEND as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {m.markers[s]}
              {m.legend[s]}
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

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.profileTitle}
        </h2>
        <!-- A scrollable region must be keyboard focusable. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div class="overflow-x-auto" tabindex="0" role="group" aria-label={m.profileTitle}>
          <svg
            viewBox="0 0 {chartW} {TOP + PLOT_H + 36}"
            role="img"
            aria-label={m.profileLabel(n)}
            class="h-auto"
            style="width: {chartW}px; max-width: 100%; min-width: {Math.min(chartW, 320)}px"
          >
            {#each profile as c, i (i)}
              {@const x = LEFT + i * (BAR + GAP)}
              {@const hot = i === outcome}
              <rect
                {x}
                y={TOP + PLOT_H - barH(c)}
                width={BAR}
                height={barH(c)}
                rx="3"
                class="{hot
                  ? 'fill-state-active'
                  : i === n
                    ? 'fill-slate-400'
                    : 'fill-sky-200'} {hot ? 'stroke-slate-900' : 'stroke-slate-400'}"
              />
              <text
                x={x + BAR / 2}
                y={TOP + PLOT_H - barH(c) - 4}
                text-anchor="middle"
                font-size="10"
                font-weight={hot ? 700 : 400}
                class="fill-slate-700">{c}</text
              >
              <text
                x={x + BAR / 2}
                y={TOP + PLOT_H + 13}
                text-anchor="middle"
                font-size="10"
                class="fill-slate-500">{i === n ? m.absent : i}</text
              >
              {#if hot}
                <text
                  x={x + BAR / 2}
                  y={TOP + PLOT_H + 28}
                  text-anchor="middle"
                  font-size="10"
                  font-weight="700"
                  class="fill-slate-900">▲</text
                >
              {/if}
            {/each}
            <line
              x1={LEFT}
              x2={LEFT + n * (BAR + GAP) - GAP}
              y1={avgY}
              y2={avgY}
              stroke-dasharray="5 3"
              stroke-width="1.5"
              class="stroke-slate-900"
            />
            <text
              x={LEFT + 2}
              y={avgY - 4}
              font-size="10"
              font-weight="700"
              stroke="white"
              stroke-width="3"
              paint-order="stroke"
              class="fill-slate-900">{m.averageLine(averageFound(n))}</text
            >
          </svg>
        </div>
        <ul class="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
          <li>{m.axisIndex}</li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.active}"></span>
            ▲ {m.thisRun}
          </li>
          <li class="flex items-center gap-1.5">
            <svg width="24" height="8" aria-hidden="true"
              ><line
                x1="0"
                x2="24"
                y1="4"
                y2="4"
                stroke-dasharray="5 3"
                stroke-width="1.5"
                class="stroke-slate-900"
              /></svg
            >
            {m.averageLine(averageFound(n))}
          </li>
        </ul>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.best}</dt>
          <dd class="text-2xl font-bold tabular-nums">1</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.worst}</dt>
          <dd class="text-2xl font-bold tabular-nums">{n}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.average}</dt>
          <dd class="text-2xl font-bold tabular-nums">{m.num(averageFound(n))}</dd>
        </div>
      </dl>
      <p class="text-sm font-semibold text-slate-700">
        {m.randomAverage(randomRuns.length, randomAvg)}
      </p>
      <ChipList
        title={m.runsTitle}
        items={chips}
        emptyText={m.runsEmpty}
        limit={MAX_RUNS}
        hotLabel={m.runsHot}
      />
      <button
        type="button"
        class="btn-outline self-start"
        aria-disabled={runs.length === 0}
        onclick={clearRuns}>{m.clearRuns}</button
      >
      <CodePanel lines={linearSearchPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
