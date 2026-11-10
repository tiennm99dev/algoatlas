<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_CAPACITY,
    MAX_NODES,
    SCENARIOS,
    SCENARIO_KEYS,
    checkModel,
    modelPseudocode,
    modelTrace,
  } from '$lib/algo-engine/practice-flows.js';
  import { en as m } from '$lib/lessons/practice-flows/copy.en.js';
  import FlowBoard from '$lib/lessons/ford-fulkerson/flow-board.svelte';
  import NetworkEditor from '$lib/lessons/ford-fulkerson/network-editor.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/ford-fulkerson/board-types.js').BoardArc} BoardArc */
  /** @typedef {import('$lib/algo-engine/practice-flows.js').ScenarioKey} ScenarioKey */
  /** @typedef {import('$lib/algo-engine/practice-flows.js').ModelCheck} ModelCheck */

  /** @param {ScenarioKey} key @returns {GraphNode[]} */
  const nodesOf = (key) =>
    SCENARIOS[key].nodes.map((n) => ({ ...n, label: m.scenarios[key].labels[n.id] }));
  /** @param {GraphEdge[]} list @returns {GraphEdge[]} */
  const copyEdges = (list) => list.map((e) => ({ ...e }));

  let key = $state(/** @type {ScenarioKey} */ ('supply'));
  let view = $state(/** @type {'build' | 'run'} */ ('build'));
  let nodes = $state.raw(nodesOf('supply'));
  let edges = $state.raw(copyEdges(SCENARIOS.supply.start));
  let notice = $state({ text: '', at: -1 });
  let checked = $state.raw(/** @type {ModelCheck | null} */ (null));

  const scenario = $derived(SCENARIOS[key]);
  const story = $derived(m.scenarios[key]);
  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const byId = $derived(new Map(nodes.map((n) => [n.id, n])));
  const names = $derived(order.map((id) => byId.get(id)?.label ?? letter(id)));
  const points = $derived(
    order.map((id, i) => {
      const n = /** @type {GraphNode} */ (byId.get(id));
      return { x: n.x, y: n.y, label: names[i] };
    }),
  );
  /** @param {number} id */
  const nameOf = (id) => byId.get(id)?.label ?? letter(id);
  /** @param {{from: number, to: number}} e */
  const edgeName = (e) => `${nameOf(e.from)} → ${nameOf(e.to)}`;
  const s = $derived(order.indexOf(scenario.source));
  const t = $derived(order.indexOf(scenario.sink));

  const build = () =>
    modelTrace({
      ids: nodes.map((n) => n.id),
      edges,
      source: order.indexOf(scenario.source),
      sink: order.indexOf(scenario.sink),
    });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const ends = $derived({ s: names[s] ?? '', t: names[t] ?? '', vertices: nodes.length });
  const edgeInfo = $derived(edges.map((e) => ({ name: edgeName(e), cap: e.weight ?? 1 })));
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, names, ends, edgeInfo),
  );
  const showCut = $derived(frame.kind === 'maxflow' || frame.kind === 'done');

  let built = graphShape(nodesOf('supply'), SCENARIOS.supply.start);

  /** @param {string} [text] */
  function rebuild(text = '') {
    built = graphShape(nodes, edges);
    checked = null;
    player.load(build());
    notice = { text, at: text ? 0 : -1 };
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    const tooBig = g.edges.some((e) => (e.weight ?? 1) > MAX_CAPACITY);
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges.map((e) => ({ ...e, weight: Math.min(MAX_CAPACITY, e.weight ?? 1) }));
    // Dragging a vertex only moves the drawing; keep the current step and the check.
    if (graphShape(nodes, edges) !== built || tooBig)
      rebuild(tooBig ? m.clipped(MAX_CAPACITY) : '');
  }

  /** @param {ScenarioKey} next */
  function pick(next) {
    key = next;
    reset();
  }

  function reset() {
    nodes = nodesOf(key);
    edges = copyEdges(SCENARIOS[key].start);
    rebuild();
  }

  function showModel() {
    nodes = nodesOf(key);
    edges = copyEdges(SCENARIOS[key].model);
    rebuild(m.shownModel);
  }

  function check() {
    checked = checkModel(scenario.model, edges);
  }

  /** @param {number} k @param {boolean} forward */
  const onPath = (k, forward) =>
    frame.kind === 'augment' && frame.path.some((a) => a.edge === k && a.forward === forward);

  /** @type {BoardArc[]} */
  const arcs = $derived.by(() => {
    /** @type {BoardArc[]} */
    const out = [];
    edges.forEach((e, k) => {
      const u = order.indexOf(e.from);
      const v = order.indexOf(e.to);
      if (u < 0 || v < 0 || u === v) return;
      const c = e.weight ?? 1;
      const f = frame.flow[k] ?? 0;
      const cut = showCut && frame.cut.includes(k);
      /** @type {VisualState} */
      let state = '';
      let what = '';
      if (cut) [state, what] = ['path', m.states.cut];
      else if (onPath(k, true)) [state, what] = ['active', m.states.onPath];
      else if (onPath(k, false)) [state, what] = ['swap', m.states.onPath];
      else if (f > 0 && f === c) [state, what] = ['sorted', m.states.full];
      else if (f > 0) [state, what] = ['visited', m.states.carries];
      out.push({
        from: u,
        to: v,
        label: cut ? m.cutLabel(f, c) : m.flowLabel(f, c),
        title: m.edgeTitle(names[u], names[v], f, c, what),
        state,
      });
    });
    return out;
  });

  /** @param {number} i @returns {VisualState} */
  const stateAt = (i) => (showCut && frame.side[i] ? 'visited' : '');

  /** @param {number} i */
  function vertexLabel(i) {
    const parts = [];
    if (i === s) parts.push(m.states.source);
    if (i === t) parts.push(m.states.sink);
    if (stateAt(i)) parts.push(m.states.sSide);
    return m.vertexLabel(names[i], parts.join(', '));
  }

  const legend = [
    ['size-3 bg-state-visited', m.legend.sSide],
    ['h-1 w-3 bg-state-active', m.legend.path],
    ['h-1 w-3 bg-state-visited', m.legend.carries],
    ['h-1 w-3 bg-state-sorted', m.legend.full],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.scenarioLabel}
      <select
        name="scenario"
        class="field"
        value={key}
        onchange={(e) => pick(/** @type {ScenarioKey} */ (e.currentTarget.value))}
      >
        {#each SCENARIO_KEYS as k (k)}
          <option value={k}>{m.scenarios[k].name}</option>
        {/each}
      </select>
    </label>
    <SegmentedControl
      legend={m.viewLabel}
      name="view"
      options={[
        { value: 'build', label: m.views.build },
        { value: 'run', label: m.views.run },
      ]}
      bind:value={view}
    />
    <button type="button" class="btn-primary" onclick={check}>{m.checkModel}</button>
    <button type="button" class="btn-outline" onclick={showModel}>{m.showModel}</button>
    <button type="button" class="btn-outline" onclick={reset}>{m.resetDrawing}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="text-sm font-semibold text-slate-700">{m.storyTitle}: {story.name}</h2>
        <p class="mt-1 text-sm text-slate-700">{story.story}</p>
        <details class="mt-2 text-sm text-slate-600">
          <summary class="cursor-pointer font-semibold">{m.tipTitle}</summary>
          <p class="mt-1">{story.tip}</p>
        </details>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
        {#if view === 'build'}
          <NetworkEditor
            bind:nodes
            bind:edges
            maxNodes={MAX_NODES}
            maxCapacity={MAX_CAPACITY}
            text={m.editor}
            {edgeName}
            onchange={onGraphChange}
            onrefuse={() => (notice = { text: m.badCapacity(MAX_CAPACITY), at: player.index })}
          />
        {:else}
          <FlowBoard
            {points}
            {arcs}
            ariaLabel={m.boardAria}
            nodeState={stateAt}
            markerOf={(i) => (i === s ? 's' : i === t ? 't' : '')}
            labelOf={vertexLabel}
            speed={player.speed}
          />
          <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each legend as [cls, label] (label)}
              <li class="flex items-center gap-1.5">
                <span class="rounded-sm {cls}"></span>{label}
              </li>
            {/each}
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm bg-state-path"></span>✂ {m.legend.cut}
            </li>
          </ul>
        {/if}
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
          <dt class="text-xs text-slate-500">{m.stats.value}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.value}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.paths}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.augmentations}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.edges}</dt>
          <dd class="text-2xl font-bold tabular-nums">{edges.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cut}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {showCut && frame.valid ? frame.cutCapacity : '—'}
          </dd>
        </div>
      </dl>
      <section class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="text-sm font-semibold text-slate-700">{m.check.title}</h2>
        <div role="status" data-check class="mt-1 text-sm text-slate-700">
          {#if !checked}
            <p>{m.check.idle}</p>
          {:else if checked.ok}
            <p class="font-semibold text-emerald-700">✓ {m.check.ok(scenario.answer)}</p>
          {:else}
            <p class="font-semibold">✗ {m.check.summary(checked)}</p>
            {#if checked.extra.length}
              <p class="mt-1">
                {m.check.extraTitle}: {checked.extra.map((e) => edgeName(e)).join(', ')}
              </p>
            {/if}
            {#if checked.wrong.length}
              <p class="mt-1">
                {m.check.wrongTitle}:
                {checked.wrong.map((w) => m.check.wrong(edgeName(w), w.got)).join(', ')}
              </p>
            {/if}
          {/if}
        </div>
      </section>
      <CodePanel lines={modelPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
