<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    PARTS,
    PROBLEMS,
    SAMPLES,
    callTree,
    combinePseudocode,
    normalizeParts,
    parseValues,
    randomValues,
    runCombine,
    solveTrace,
  } from '$lib/algo-engine/practice-divide-and-conquer.js';
  import { en as m } from '$lib/lessons/practice-divide-and-conquer/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-divide-and-conquer.js').Problem} Problem */
  /** @typedef {import('$lib/algo-engine/practice-divide-and-conquer.js').Part} Part */
  /** @typedef {import('$lib/algo-engine/practice-divide-and-conquer.js').CallStatus} CallStatus */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */

  // Both combines start without the step that makes them correct, so the first run shows a bug.
  /** @type {Record<Problem, Part[]>} */
  const START_PARTS = { 'max-subarray': ['left', 'right'], majority: ['left', 'right'] };
  const INITIAL_PROBLEM = /** @type {Problem} */ ('max-subarray');
  const INITIAL = SAMPLES[INITIAL_PROBLEM][0];

  let problem = $state(INITIAL_PROBLEM);
  /** @type {Record<Problem, Part[]>} */
  let partsBy = $state({ ...START_PARTS });
  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let notice = $state({ text: '', at: -1 });

  const parts = $derived(partsBy[problem]);
  const player = createPlayer(solveTrace(INITIAL_PROBLEM, START_PARTS[INITIAL_PROBLEM], INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, values));
  const code = $derived(combinePseudocode(problem, parts));
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const firstWrongAt = $derived(
    player.frames.findIndex((f) => (f.kind === 'base' || f.kind === 'combine') && !f.ok),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(solveTrace(problem, parts, values));
  }

  /** @param {number[]} next */
  function setValues(next) {
    values = next;
    valuesText = next.join(', ');
    rebuild();
  }

  function commitValues() {
    const parsed = parseValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.errors[parsed.error]);
      return;
    }
    if (parsed.values.join() === values.join()) {
      valuesText = values.join(', ');
      return;
    }
    setValues(parsed.values);
  }

  function pickProblem() {
    values = SAMPLES[problem][0];
    valuesText = values.join(', ');
    rebuild();
  }

  /** @param {Part} part @param {boolean} on */
  function togglePart(part, on) {
    const next = on ? [...parts, part] : parts.filter((p) => p !== part);
    partsBy = { ...partsBy, [problem]: normalizeParts(problem, next) };
    rebuild();
  }

  function randomArray() {
    setValues(randomValues(problem, 6 + Math.floor(Math.random() * 11)));
  }

  function jumpWrong() {
    if (firstWrongAt < 0) {
      say(m.noWrong);
      return;
    }
    player.pause();
    player.seek(firstWrongAt);
  }

  /** @param {string | number} id */
  function selectCall(id) {
    const at = player.frames.findIndex(
      (f) => (f.kind === 'base' || f.kind === 'combine') && `${f.lo}-${f.hi}` === id,
    );
    if (at >= 0) {
      player.pause();
      player.seek(at);
    }
  }

  /** @type {Record<CallStatus, VisualState>} */
  const CALL_STATE = { open: 'active', waiting: 'frontier', right: 'sorted', wrong: 'swap' };
  /** @type {Record<string, string>} */
  const MARK = m.markers;

  /** @param {string} id @returns {VisualState} */
  const callState = (id) => {
    const s = frame.status[id];
    return s ? CALL_STATE[s] : '';
  };

  /** @param {string} id */
  const resultText = (id) => {
    const s = frame.status[id];
    if (s !== 'right' && s !== 'wrong') return '';
    const r = frame.results[id];
    return r === null ? m.pending : m.num(r);
  };

  const roots = $derived.by(() => {
    const shape = callTree(values.length);
    /** @param {import('$lib/algo-engine/practice-divide-and-conquer.js').CallRange} t @returns {TreeNode} */
    const build = (t) => {
      const state = callState(t.id);
      return {
        id: t.id,
        label: resultText(t.id),
        state,
        marker: MARK[state] ?? '',
        note: m.note(t.lo, t.hi),
        children: t.children.map(build),
      };
    };
    return shape ? [build(shape)] : [];
  });

  /** @param {TreeNode} node */
  function callLabel(node) {
    const [lo, hi] = String(node.id).split('-').map(Number);
    const state = /** @type {keyof typeof m.callStates} */ (node.state ?? '');
    const r = node.label === m.pending ? m.value(problem, null) : node.label;
    return m.callLabel(lo, hi, m.callStates[state], r);
  }

  const counted = $derived(
    [frame.countL >= 0 ? frame.L : null, frame.countR >= 0 ? frame.R : null].filter(
      (v) => v !== null,
    ),
  );

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (frame.lo < 0 || i < frame.lo || i > frame.hi) return '';
    if (frame.kind === 'base') return 'active';
    if (frame.kind === 'measure' && frame.suffix && frame.prefix) {
      if (i >= frame.suffix[0] && i <= frame.prefix[1]) return 'compare';
    }
    if (frame.kind === 'count' && counted.includes(values[i])) return 'compare';
    return '';
  }

  /** @param {number} i */
  const markerOf = (i) => MARK[stateOf(i)] ?? '';

  const windows = $derived.by(() => {
    if (frame.kind === 'split' || frame.kind === 'count' || frame.kind === 'combine') {
      return [
        { from: frame.lo, to: frame.mid + 1, label: m.windows.left },
        { from: frame.mid + 1, to: frame.hi + 1, label: m.windows.right },
      ];
    }
    if (frame.kind === 'measure' && frame.suffix && frame.prefix) {
      return [
        { from: frame.suffix[0], to: frame.suffix[1] + 1, label: m.windows.suffix },
        { from: frame.prefix[0], to: frame.prefix[1] + 1, label: m.windows.prefix },
      ];
    }
    return [];
  });
  const pointers = $derived(frame.mid >= 0 ? [{ name: 'mid', index: frame.mid }] : []);

  const isSample = $derived(SAMPLES[problem].some((s) => s.join() === values.join()));
  const checks = $derived.by(() => {
    const rows = SAMPLES[problem].map((a, k) => ({ name: m.sampleName(k + 1), a }));
    if (!isSample) rows.push({ name: m.yourArray, a: values });
    return rows.map((r) => ({ ...r, ...runCombine(problem, parts, r.a) }));
  });
  const passed = $derived(checks.filter((c) => c.ok).length);

  const done = $derived(frame.kind === 'done');
  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['active', m.markers.active, m.legend.active],
    ['frontier', m.markers.frontier, m.legend.frontier],
    ['sorted', m.markers.sorted, m.legend.sorted],
    ['swap', m.markers.swap, m.legend.swap],
    ['', '', m.legend.idle],
    ['compare', m.markers.compare, m.legend.compare],
  ]);
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
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-80 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={randomArray}>{m.randomArray}</button>
  </form>

  <section class="mb-4 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.combineTitle}
    </h2>
    <p class="mb-3 text-sm text-slate-700">{m.goals[problem]} {m.combineHint[problem]}</p>
    <div class="flex flex-wrap gap-x-6 gap-y-2">
      {#each PARTS[problem] as part (`${problem}-${part}`)}
        <label class="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            name="part-{part}"
            class="size-4 accent-teal-700"
            checked={parts.includes(part)}
            onchange={(e) => togglePart(part, e.currentTarget.checked)}
          />
          {m.parts[problem][part]}
        </label>
      {/each}
    </div>
  </section>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeLabel(values.length)}
          labelOf={callLabel}
          onselect={selectCall}
          selected={frame.lo >= 0 ? `${frame.lo}-${frame.hi}` : null}
          speed={player.speed}
        />
        <ArrayStrip
          {values}
          ariaLabel={m.arrayLabel(values, frame.lo, frame.hi)}
          {stateOf}
          {markerOf}
          dimmed={(i) => frame.lo >= 0 && (i < frame.lo || i > frame.hi)}
          {pointers}
          {windows}
          speed={player.speed}
        />
        <ul class="flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (label)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {#if marker}<span class="font-bold text-slate-900">{marker}</span>{/if}
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
          <dt class="text-xs text-slate-500">{m.stats.calls}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="calls">{frame.calls}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.reads}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="reads">{frame.reads}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.returned}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="returned">
            {done ? `${m.value(problem, frame.result)} ${frame.ok ? m.pass : m.fail}` : m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.expected}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="expected">
            {m.value(problem, finalFrame.expected)}
          </dd>
        </div>
      </dl>

      <button type="button" class="btn-outline" aria-disabled={firstWrongAt < 0} onclick={jumpWrong}
        >{m.jumpWrong}</button
      >

      <ChipList
        title={m.stackTitle}
        items={frame.stack.map((id, k) => ({
          label: m.stackChip(id),
          hot: k === frame.stack.length - 1,
        }))}
        emptyText={m.stackEmpty}
      />

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
            aria-label={m.sampleAria(c.name, c.a, problem, c.expected, c.got, c.ok)}
            aria-pressed={current}
            onclick={() => setValues(c.a)}
          >
            <span class="font-bold" aria-hidden="true">{c.ok ? m.pass : m.fail}</span>
            <span class="font-semibold">{c.name}</span>
            <span class="font-mono text-xs break-all">{c.a.map(m.num).join(', ')}</span>
            <span class="ml-auto text-xs tabular-nums">
              {m.expectedLabel}
              <strong>{m.value(problem, c.expected)}</strong>, {m.gotLabel}
              <strong>{m.value(problem, c.got)}</strong>
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
