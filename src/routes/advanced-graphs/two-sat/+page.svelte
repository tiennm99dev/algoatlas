<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_CLAUSES,
    VARS,
    literalTrue,
    twoSatPseudocode,
    twoSatTrace,
  } from '$lib/algo-engine/two-sat.js';
  import { en as m } from '$lib/lessons/two-sat/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/two-sat.js').Clause} Clause */
  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** Literals from the notation `1` = x₁, `-1` = ¬x₁. @param {number[][]} list @returns {Clause[]} */
  const parse = (list) =>
    list.map(
      ([a, b]) =>
        /** @type {Clause} */ ([a, b].map((x) => 2 * (Math.abs(x) - 1) + (x < 0 ? 1 : 0))),
    );
  const SAT_EXAMPLE = parse([
    [-1, 2],
    [-2, 3],
    [1, 3],
    [-3, -4],
    [4, 2],
  ]);
  const UNSAT_EXAMPLE = parse([
    [1, 2],
    [1, -2],
    [-1, 3],
    [-1, -3],
  ]);
  const LITERALS = Array.from({ length: 2 * VARS }, (_, l) => l);

  // Literals sit on an ellipse, each one opposite its negation: x₁…x₄ across the top,
  // ¬x₁…¬x₄ across the bottom from right to left. No three points of an ellipse are in
  // a line, so no edge runs through a vertex.
  /** @type {GraphNode[]} */
  const NODES = LITERALS.map((l) => {
    const x = l >> 1;
    const deg = 202.5 + 45 * x + (l % 2 ? 180 : 0);
    const rad = (deg * Math.PI) / 180;
    return {
      id: l,
      x: Math.round(240 + 190 * Math.cos(rad)),
      y: Math.round(150 + 112 * Math.sin(rad)),
      label: m.lit(l),
    };
  });

  let clauses = $state.raw(SAT_EXAMPLE);
  let notice = $state({ text: '', at: -1 });

  const build = () => twoSatTrace({ vars: VARS, clauses });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, clauses));
  const addedSet = $derived(
    new Set(frame.added.flatMap((k) => [frame.edges[k].from, frame.edges[k].to])),
  );
  const poppedSet = $derived(new Set(frame.popped));
  const conflict = $derived(frame.sat === false ? frame.variable : -1);
  const graphEdges = $derived(frame.edges.map((e) => ({ from: e.from, to: e.to })));

  /** Members of each component found so far, by number - 1. */
  const groups = $derived.by(() => {
    /** @type {number[][]} */
    const out = Array.from({ length: frame.count }, () => []);
    frame.comp.forEach((c, l) => c > 0 && out[c - 1].push(l));
    return out;
  });

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(build());
  }

  /** @param {Clause[]} next */
  function load(next) {
    clauses = next;
    rebuild();
  }

  /** @param {number} k @param {0 | 1} side @param {Event & {currentTarget: HTMLSelectElement}} e */
  function setLiteral(k, side, e) {
    const l = Number(e.currentTarget.value);
    if (!Number.isInteger(l) || l < 0 || l >= 2 * VARS) {
      e.currentTarget.value = String(clauses[k][side]);
      return;
    }
    const c = /** @type {Clause} */ (clauses[k].with(side, l));
    load(clauses.with(k, c));
  }

  function addClause() {
    if (clauses.length >= MAX_CLAUSES) {
      notice = { text: m.full(MAX_CLAUSES), at: player.index };
      return;
    }
    load([...clauses, [0, 2]]);
  }

  /** @param {number} l */
  function valueOf(l) {
    const v = frame.value[l >> 1];
    return v === -1 ? null : literalTrue(l, frame.value);
  }

  /** @param {number} l @returns {VisualState} */
  function stateAt(l) {
    if (conflict >= 0 && l >> 1 === conflict) return 'swap';
    if (frame.kind === 'scc' && poppedSet.has(l)) return 'path';
    if (frame.kind === 'clause' && addedSet.has(l)) return 'frontier';
    const v = valueOf(l);
    if (v === true) return 'sorted';
    if (frame.comp[l] > 0) return 'visited';
    return '';
  }

  /** @param {number} l */
  function stateName(l) {
    const s = stateAt(l);
    if (s === 'swap') return m.states.conflict;
    if (s === 'path') return m.states.popped;
    if (s === 'frontier') return m.states.added;
    const v = valueOf(l);
    return v === null ? '' : v ? m.states.yes : m.states.no;
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = frame.edges.findIndex((x) => x.from === e.from && x.to === e.to);
    if (frame.kind === 'clause' && frame.added.includes(k)) return 'active';
    if (frame.comp[e.from] > 0 && frame.comp[e.from] === frame.comp[e.to]) return 'sorted';
    return '';
  }

  const legend = [
    ['bg-state-frontier', m.legend.added],
    ['bg-state-path', m.legend.popped],
    ['bg-state-visited', m.legend.found],
    ['bg-state-sorted', m.legend.yes],
    ['bg-state-swap', m.legend.conflict],
  ];
  const edgeLegend = [
    ['bg-state-active', m.legend.newEdge],
    ['bg-state-sorted', m.legend.inside],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-2">
    <button type="button" class="btn-secondary" onclick={addClause}>{m.addClause}</button>
    <button type="button" class="btn-outline" onclick={() => load(SAT_EXAMPLE)}
      >{m.satExample}</button
    >
    <button type="button" class="btn-outline" onclick={() => load(UNSAT_EXAMPLE)}
      >{m.unsatExample}</button
    >
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <section class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="text-sm font-semibold text-slate-700">{m.clausesTitle}</h2>
        <p class="mb-2 text-xs text-slate-500">{m.varsNote}</p>
        <ol class="flex flex-col gap-2">
          {#each clauses as clause, k (k)}
            {@const ok =
              frame.kind === 'done' &&
              frame.sat === true &&
              (literalTrue(clause[0], frame.value) || literalTrue(clause[1], frame.value))}
            <li
              class="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1 {frame.clause === k
                ? 'bg-sky-50 ring-1 ring-sky-300'
                : ''}"
              aria-label={m.clauseAria(k)}
            >
              <span class="w-5 text-xs text-slate-500 tabular-nums">{k + 1}.</span>
              <select
                class="field"
                aria-label={m.literalAria(k, 'first')}
                value={String(clause[0])}
                onchange={(e) => setLiteral(k, 0, e)}
              >
                {#each LITERALS as l (l)}<option value={String(l)}>{m.lit(l)}</option>{/each}
              </select>
              <span class="font-semibold text-slate-700" aria-hidden="true">{m.or}</span>
              <select
                class="field"
                aria-label={m.literalAria(k, 'second')}
                value={String(clause[1])}
                onchange={(e) => setLiteral(k, 1, e)}
              >
                {#each LITERALS as l (l)}<option value={String(l)}>{m.lit(l)}</option>{/each}
              </select>
              <button
                type="button"
                class="btn-outline"
                aria-label={m.removeAria(k)}
                onclick={() => load(clauses.toSpliced(k, 1))}>{m.remove}</button
              >
              {#if ok}<span class="text-xs font-semibold text-emerald-700">✓ {m.satisfied}</span
                >{/if}
            </li>
          {:else}
            <li class="text-sm text-slate-600">{m.noClauses}</li>
          {/each}
        </ol>
      </section>

      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GraphCanvas
          nodes={NODES}
          edges={graphEdges}
          ariaLabel={m.graphAria}
          directed
          nodeState={stateAt}
          {edgeState}
          markerOf={(l) => (frame.comp[l] > 0 ? String(frame.comp[l]) : '')}
          noteOf={(l) => {
            const v = valueOf(l);
            return v === null ? '' : v ? m.states.yes : m.states.no;
          }}
          labelOf={(n) => m.literalLabel(m.lit(n.id), stateName(n.id), frame.comp[n.id])}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
          {#each edgeLegend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm {cls}"></span>{label}
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

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.clauses}</dt>
          <dd class="text-2xl font-bold tabular-nums">{clauses.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.edges}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.edges.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.count}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.sat === null ? m.results.pending : frame.sat ? m.results.sat : m.results.unsat}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.compsLabel}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={groups.map((list, k) => ({
          label: m.compChip(k + 1, list),
          hot: frame.kind === 'scc' && k === frame.count - 1,
        }))}
      />
      <ChipList
        title={m.assignLabel}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={frame.value.flatMap((v, x) =>
          v === -1
            ? []
            : [{ label: m.assignChip(x, v), hot: frame.kind === 'assign' && x === frame.variable }],
        )}
      />
      <CodePanel lines={twoSatPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
