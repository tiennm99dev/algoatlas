<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    PSEUDOCODE,
    PUZZLES,
    RULE_KINDS,
    bruteAnswer,
    parseValues,
    puzzleTrace,
    randomCase,
    testRule,
  } from '$lib/algo-engine/practice-greedy.js';
  import { en as m } from '$lib/lessons/practice-greedy/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-greedy.js').Puzzle} Puzzle */
  /** @typedef {import('$lib/algo-engine/practice-greedy.js').RuleKind} RuleKind */
  /** @typedef {import('$lib/algo-engine/practice-greedy.js').TestReport} TestReport */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.legend} CellKind */

  /** @type {Record<Puzzle, number[]>} */
  const START = {
    reach: [2, 3, 0, 1, 4],
    jumps: [2, 3, 1, 1, 4],
    boats: [8, 1, 9, 2],
  };

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  let puzzle = $state(/** @type {Puzzle} */ ('reach'));
  let rule = $state(/** @type {RuleKind} */ ('wrong'));
  /** @type {Record<Puzzle, number[]>} */
  let valuesBy = $state({ ...START });
  let valuesText = $state(START.reach.join(', '));
  /** @type {TestReport | null} */
  let report = $state(null);
  let notice = $state({ text: '', at: -1 });

  const values = $derived(valuesBy[puzzle]);
  const want = $derived(bruteAnswer(puzzle, values));
  const player = createPlayer(puzzleTrace('reach', 'wrong', START.reach));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, want));
  const done = $derived(frame.kind === 'done');

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(puzzleTrace(puzzle, rule, valuesBy[puzzle]));
  }

  /** @param {number[]} next */
  function setValues(next) {
    valuesBy = { ...valuesBy, [puzzle]: next };
    valuesText = next.join(', ');
    rebuild();
  }

  /** @param {Puzzle} p */
  function pickPuzzle(p) {
    if (p === puzzle) return;
    puzzle = p;
    valuesText = valuesBy[p].join(', ');
    report = null;
    rebuild();
  }

  function pickRule() {
    report = null;
    rebuild();
    say(m.ruleNotice(m.rules[puzzle][rule]));
  }

  function commitValues() {
    const parsed = parseValues(valuesText, puzzle);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(parsed.error === 'range' ? m.errors.range[puzzle] : m.errors[parsed.error]);
      return;
    }
    if (parsed.values.join() === values.join()) {
      valuesText = values.join(', ');
      return;
    }
    setValues(parsed.values);
  }

  function randomInput() {
    setValues(randomCase(puzzle, Math.random));
    say(m.newInputNotice);
  }

  function runTest() {
    report = testRule(puzzle, rule, Math.random);
  }

  function loadCounter() {
    if (!report?.first) return;
    setValues(report.first.values);
    say(m.counterNotice);
  }

  const n = $derived(frame.values.length);
  const reachedEnd = $derived(
    done && (puzzle === 'reach' ? frame.result === 1 : puzzle === 'jumps' && frame.result >= 0),
  );

  /** @param {number} i @returns {CellKind | ''} */
  function cellKind(i) {
    if (puzzle === 'boats') {
      const b = frame.boats.findIndex((boat) => boat.includes(i));
      if (b < 0) return '';
      return frame.kind === 'boat' && b === frame.boats.length - 1 ? 'boat' : 'done';
    }
    if (i === frame.i && frame.kind === 'stuck') return 'stuck';
    if (reachedEnd && i === n - 1) return 'goal';
    if (i === frame.i && !done) return 'current';
    if (rule === 'wrong') return frame.path.includes(i) ? 'path' : '';
    if (frame.i >= 0 ? i < frame.i : done && i <= frame.reach) return 'scanned';
    if (i <= frame.reach) return 'reachable';
    return '';
  }

  /** @type {Record<CellKind | '', VisualState>} */
  const STATE = {
    current: 'active',
    reachable: 'frontier',
    scanned: 'visited',
    path: 'path',
    stuck: 'swap',
    boat: 'active',
    done: 'sorted',
    goal: 'sorted',
    '': '',
  };

  /** @param {number} i */
  function markerOf(i) {
    if (puzzle === 'boats') {
      const b = frame.boats.findIndex((boat) => boat.includes(i));
      return b < 0 ? '' : m.boatMark(b);
    }
    const kind = cellKind(i);
    return kind ? m.markers[kind] : '';
  }

  const legend = $derived(
    /** @type {CellKind[]} */ (
      puzzle === 'boats'
        ? ['boat', 'done']
        : rule === 'wrong'
          ? ['current', 'path', 'stuck', 'goal']
          : ['current', 'reachable', 'scanned', 'stuck', 'goal']
    ),
  );

  const pointers = $derived.by(() => {
    if (puzzle === 'boats') return [];
    const list = frame.i >= 0 && !done ? [{ name: m.pointers.i, index: frame.i }] : [];
    if (puzzle === 'jumps' && rule === 'right') {
      list.push(
        { name: m.pointers.end, index: Math.min(frame.end, n - 1) },
        { name: m.pointers.far, index: Math.min(frame.reach, n - 1) },
      );
    }
    return list;
  });
  const windows = $derived(
    puzzle === 'reach' && rule === 'right'
      ? [{ from: 0, to: Math.min(frame.reach, n - 1) + 1, label: m.reachWindow }]
      : [],
  );

  const thirdStat = $derived(
    puzzle === 'boats'
      ? { label: m.stats.boats, value: String(frame.count) }
      : puzzle === 'reach' && rule === 'right'
        ? { label: m.stats.reach, value: String(frame.reach) }
        : { label: m.stats.jumps, value: String(frame.count) },
  );
</script>

<LessonLayout lesson={m}>
  <fieldset class="mb-4">
    <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.cardsLabel}
    </legend>
    <div class="grid gap-3 sm:grid-cols-3">
      {#each PUZZLES as p (p)}
        <button
          type="button"
          data-card={p}
          aria-pressed={p === puzzle}
          class="focus-ring rounded-xl border-2 bg-white p-3 text-left {p === puzzle
            ? 'border-teal-700 ring-2 ring-teal-700/20'
            : 'border-slate-200 hover:border-slate-400'}"
          onclick={() => pickPuzzle(p)}
        >
          <span class="block font-semibold text-slate-900">{m.cards[p].title}</span>
          <span class="mt-1 block text-sm text-slate-600">{m.cards[p].goal}</span>
        </button>
      {/each}
    </div>
  </fieldset>

  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
    }}
  >
    <SegmentedControl
      legend={m.ruleLabel}
      name="rule"
      options={RULE_KINDS.map((r) => ({ value: r, label: m.rules[puzzle][r] }))}
      bind:value={rule}
      onchange={pickRule}
    />
    <label
      class="flex min-w-0 grow flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
    >
      {m.valuesLabel[puzzle]}
      <input
        type="text"
        name="values"
        inputmode="numeric"
        class="field w-full max-w-xs font-mono"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={randomInput}>{m.random}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ArrayStrip
          values={frame.values}
          ariaLabel={m.stripAria(frame.values)}
          stateOf={(i) => STATE[cellKind(i)]}
          {markerOf}
          {pointers}
          {windows}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[STATE[s]]}"></span>
              {#if m.markers[s]}<span class="font-bold text-slate-900">{m.markers[s]}</span>{/if}
              {m.legend[s]}
            </li>
          {/each}
          {#if puzzle === 'boats'}
            <li>{m.boatMarkerNote}</li>
          {/if}
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
          <dt class="text-xs text-slate-500">{m.stats.got}</dt>
          <dd class="text-lg font-bold">{done ? m.answer(puzzle, frame.result) : m.pending}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.want}</dt>
          <dd class="text-lg font-bold">{m.answer(puzzle, want)}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{thirdStat.label}</dt>
          <dd class="text-2xl font-bold tabular-nums">{thirdStat.value}</dd>
        </div>
      </dl>
      {#if puzzle === 'boats'}
        <ChipList
          title={m.boatsTitle}
          items={frame.boats.map((b, k) => ({
            label: m.boatChip(b.map((i) => frame.values[i])),
            hot: frame.kind === 'boat' && k === frame.boats.length - 1,
          }))}
          emptyText={m.boatsEmpty}
        />
      {/if}
      <CodePanel lines={PSEUDOCODE[puzzle][rule]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <section class="mt-4 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.testTitle}
    </h2>
    <div class="flex flex-wrap items-start gap-3">
      <button type="button" class="btn-outline" onclick={runTest}>{m.test}</button>
      <div class="min-w-0 grow text-sm text-slate-800" data-testid="report" aria-live="polite">
        {#if !report}
          <p class="text-slate-600">{m.untested}</p>
        {:else if report.failed === 0}
          <p class="font-semibold text-emerald-800">✓ {m.passed(report.tested)}</p>
        {:else}
          <p class="font-semibold text-rose-800">✗ {m.failed(report.failed, report.tested)}</p>
          {#if report.first}
            <p class="mt-1">
              {m.counterexample(puzzle, report.first.values, report.first.got, report.first.want)}
            </p>
            <button type="button" class="btn-secondary mt-2" onclick={loadCounter}
              >{m.loadCounter}</button
            >
          {/if}
        {/if}
      </div>
    </div>
  </section>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
