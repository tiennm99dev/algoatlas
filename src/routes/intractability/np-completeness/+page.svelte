<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    GADGET_PRESETS,
    MAP_PROBLEMS,
    MAP_REDUCTIONS,
    MAX_CLAUSES,
    clauseVertex,
    formatFormula,
    gadgetPseudocode,
    gadgetTrace,
    literalText,
    parseFormula,
  } from '$lib/algo-engine/np-completeness.js';
  import { vi as m } from '$lib/lessons/np-completeness/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/np-completeness.js').Formula} Formula */
  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const W = 560;
  const H = 320;
  const BOX_W = 150;
  const BOX_H = 30;
  const FIRST = GADGET_PRESETS[0];
  const FIRST_FORMULA = /** @type {Formula} */ (parseFormula(FIRST.formula));

  let formula = $state.raw(FIRST_FORMULA);
  let assignment = $state.raw(FIRST.assignment);
  let formulaText = $state(formatFormula(FIRST_FORMULA));
  let preset = $state(FIRST.key);
  let picked = $state('vertexCover');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(gadgetTrace(FIRST_FORMULA, FIRST.assignment));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, formula));

  /** @param {boolean} toCover Jump to where the cover starts. */
  function rebuild(toCover = false) {
    notice = { text: '', at: -1 };
    player.load(gadgetTrace(formula, assignment.slice()));
    if (toCover) player.seek(player.frames.findIndex((f) => f.kind === 'target') + 1);
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = GADGET_PRESETS.find((x) => x.key === key) ?? FIRST;
    const f = /** @type {Formula} */ (parseFormula(p.formula));
    preset = p.key;
    formula = f;
    formulaText = formatFormula(f);
    assignment = p.assignment;
    rebuild();
  }

  function commitFormula() {
    const next = parseFormula(formulaText);
    if (next === null) {
      formulaText = formatFormula(formula);
      notice = { text: m.formulaError(MAX_CLAUSES), at: player.index };
      return;
    }
    formulaText = formatFormula(next);
    if (formulaText === formatFormula(formula)) return;
    // Keep each variable's value by name.
    assignment = next.vars.map((v) => {
      const i = formula.vars.indexOf(v);
      return i >= 0 ? assignment[i] : false;
    });
    formula = next;
    preset = '';
    rebuild();
  }

  /** @param {number} i */
  function flip(i) {
    assignment = assignment.map((v, j) => (j === i ? !v : v));
    preset = '';
    rebuild(true);
  }

  /** Variable pairs on top, one triangle per clause below. */
  const gNodes = $derived.by(() => {
    const n = formula.vars.length;
    const c = formula.clauses.length;
    /** @type {GraphNode[]} */
    const out = [];
    for (let i = 0; i < n; i++) {
      const cx = ((i + 0.5) * W) / n;
      out.push({ id: 2 * i, x: cx - 30, y: 40, label: literalText(formula, i, false) });
      out.push({ id: 2 * i + 1, x: cx + 30, y: 40, label: literalText(formula, i, true) });
    }
    formula.clauses.forEach((clause, j) => {
      const cx = ((j + 0.5) * W) / c;
      const spots = [
        [cx, 190],
        [cx - 40, 275],
        [cx + 40, 275],
      ];
      clause.forEach((l, t) => {
        const [x, y] = spots[t];
        out.push({
          id: clauseVertex(formula, j, t),
          x,
          y,
          label: literalText(formula, l.v, l.neg),
        });
      });
    });
    return out;
  });
  const shownNodes = $derived(gNodes.filter((n) => n.id < frame.shown));
  const shownEdges = $derived(
    frame.edges.map((e) => /** @type {GraphEdge} */ ({ from: e.a, to: e.b })),
  );
  const coverSet = $derived(new Set(frame.cover));
  const currentSet = $derived(new Set(frame.current));
  const uncoveredSet = $derived(new Set(frame.uncovered));

  /** @param {number} id @returns {VisualState} */
  function nodeState(id) {
    if (currentSet.has(id) && frame.kind !== 'done') return 'active';
    if (coverSet.has(id)) return 'sorted';
    return '';
  }

  /** @param {number} id */
  function stateName(id) {
    const parts = [];
    if (currentSet.has(id) && frame.kind !== 'done') parts.push(m.states.current);
    if (coverSet.has(id)) parts.push(m.states.cover);
    return parts.join(', ');
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const i = frame.edges.findIndex((x) => x.a === e.from && x.b === e.to);
    if (uncoveredSet.has(i)) return 'swap';
    if (i === frame.edge) return 'active';
    return '';
  }

  const byKey = new Map(MAP_PROBLEMS.map((p) => [p.key, p]));
  /** @param {string} key */
  const spot = (key) => /** @type {(typeof MAP_PROBLEMS)[number]} */ (byKey.get(key));

  /** End of an arrow from a to b, stopped at b's box edge. @param {string} a @param {string} b */
  function arrow(a, b) {
    const p = spot(a);
    const q = spot(b);
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    // Leave and enter each box where the straight line crosses its border.
    const cut = (/** @type {number} */ sx, /** @type {number} */ sy) =>
      Math.min(
        sx === 0 ? Infinity : BOX_W / 2 / Math.abs(sx),
        sy === 0 ? Infinity : BOX_H / 2 / Math.abs(sy),
      );
    const t0 = cut(dx, dy);
    const t1 = cut(dx, dy) + 0.02;
    return {
      x1: p.x + dx * t0,
      y1: p.y + dy * t0,
      x2: q.x - dx * t1,
      y2: q.y - dy * t1,
    };
  }

  /** @param {KeyboardEvent} e @param {string} key */
  function onMapKey(e, key) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    picked = key;
  }

  const shown = $derived(m.problems[picked]);
</script>

<LessonLayout lesson={m}>
  <section class="mb-6 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">{m.mapTitle}</h2>
    <p class="mt-1 mb-2 text-xs text-slate-600">{m.mapNote}</p>
    <ScrollFrame>
      <svg
        viewBox="0 0 640 380"
        class="mx-auto block w-full max-w-[44rem] min-w-[34rem]"
        role="group"
        aria-label={m.mapAria}
      >
        <defs>
          <marker
            id="np-map-head"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" class="fill-slate-600" />
          </marker>
        </defs>
        {#each MAP_REDUCTIONS as [a, b] (`${a}-${b}`)}
          {@const line = arrow(a, b)}
          {@const hot = a === 'threeSat' && b === 'vertexCover'}
          <line
            {...line}
            class={hot ? 'stroke-state-path' : 'stroke-slate-500'}
            stroke-width={hot ? 5 : 1.5}
            marker-end="url(#np-map-head)"
          />
        {/each}
        {#each MAP_PROBLEMS as p (p.key)}
          {@const on = picked === p.key}
          <g
            role="button"
            tabindex="0"
            aria-pressed={on}
            aria-label={m.mapNodeLabel(m.problems[p.key].name, on)}
            data-problem={p.key}
            class="cursor-pointer focus:outline-none [&:focus-visible>rect]:stroke-teal-700 [&:focus-visible>rect]:stroke-[3]"
            onclick={() => (picked = p.key)}
            onkeydown={(e) => onMapKey(e, p.key)}
          >
            <rect
              x={p.x - BOX_W / 2}
              y={p.y - BOX_H / 2}
              width={BOX_W}
              height={BOX_H}
              rx="8"
              class="{on ? 'fill-state-active' : 'fill-white'} stroke-slate-700"
              stroke-width="1.5"
            />
            <text
              x={p.x}
              y={p.y + 4.5}
              text-anchor="middle"
              class="text-[12px] font-semibold {on ? 'fill-white' : 'fill-slate-900'}"
              >{m.problems[p.key].name}</text
            >
          </g>
        {/each}
      </svg>
    </ScrollFrame>
    <div class="mt-3 rounded-lg bg-slate-50 p-3 text-sm" data-testid="problem-card">
      <p class="font-semibold text-slate-900">{shown.name}</p>
      <p class="text-slate-700">{shown.question}</p>
      <p class="mt-1 text-slate-700">{shown.why}</p>
    </div>
  </section>

  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitFormula();
    }}
  >
    <label
      class="flex max-w-full flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
    >
      {m.formulaLabel}
      <input
        type="text"
        name="formula"
        class="field w-[26rem] max-w-full font-mono"
        bind:value={formulaText}
        onchange={commitFormula}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each GADGET_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.assignmentLabel}
      </legend>
      <div class="flex flex-wrap gap-2">
        {#each formula.vars as name, i (name)}
          <button
            type="button"
            class="btn-outline font-mono"
            aria-pressed={assignment[i]}
            aria-label={m.valueAria(name, assignment[i])}
            onclick={() => flip(i)}>{m.valueButton(name, assignment[i])}</button
          >
        {/each}
      </div>
    </fieldset>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.graphTitle}
        </h2>
        <GraphCanvas
          nodes={shownNodes}
          edges={shownEdges}
          ariaLabel={m.graphAria}
          width={W}
          height={H}
          {nodeState}
          {edgeState}
          markerOf={(id) => (coverSet.has(id) ? m.markers.cover : '')}
          labelOf={(n) => m.vertexLabel(n.label ?? '', stateName(n.id))}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-active"></span>{m.legend.current}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-sorted"></span>{m.legend.cover}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-active"></span>{m.legend.edge}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-swap"></span>{m.legend.uncovered}
          </li>
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
          <dt class="text-xs text-slate-500">{m.stats.vertices}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="vertices">{frame.shown}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.edges}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="edges">
            {frame.edges.length}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.k}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="k">{frame.k || '—'}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cover}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="cover">
            {frame.cover.length}
          </dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-lg font-bold" data-testid="result">{m.result(frame)}</dd>
        </div>
      </dl>
      <CodePanel lines={gadgetPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
