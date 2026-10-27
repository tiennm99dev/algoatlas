<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    ALGOS,
    MAX_NODES,
    MAX_WEIGHT,
    SCENARIOS,
    judge,
    pseudocode,
    shortestPathTrace,
  } from '$lib/algo-engine/practice-shortest-paths.js';
  import { en as m } from '$lib/lessons/practice-shortest-paths/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/practice-shortest-paths.js').Algo} Algo */
  /** @typedef {keyof typeof SCENARIOS} ScenarioKey */

  const SCENARIO_KEYS = /** @type {ScenarioKey[]} */ (Object.keys(SCENARIOS));

  let scenario = $state(/** @type {ScenarioKey} */ ('moves'));
  let algo = $state(/** @type {Algo} */ ('bfs'));
  let nodes = $state.raw(/** @type {GraphNode[]} */ (SCENARIOS.moves.nodes));
  let edges = $state.raw(/** @type {GraphEdge[]} */ (SCENARIOS.moves.edges));
  let sourceId = $state(SCENARIOS.moves.source);
  let targetId = $state(SCENARIOS.moves.target);
  let notice = $state({ text: '', at: -1 });

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const source = $derived(order.indexOf(sourceId));
  const target = $derived(order.indexOf(targetId));
  const input = $derived({ ids: nodes.map((n) => n.id), edges, source });

  const build = () =>
    shortestPathTrace({
      ids: nodes.map((n) => n.id),
      edges,
      source: order.indexOf(sourceId),
      algo,
    });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, names, algo),
  );
  const cycleSet = $derived(new Set(frame.cycle));
  const takenSet = $derived(new Set(frame.settled));
  // Depends on the graph only, never on the current frame, so stepping does not recompute it.
  const verdicts = $derived(Object.fromEntries(ALGOS.map((a) => [a, judge(input, a, target)])));
  const verdict = $derived(verdicts[algo]);

  let built = graphShape(SCENARIOS.moves.nodes, SCENARIOS.moves.edges);

  function rebuild() {
    built = graphShape(nodes, edges);
    notice = { text: '', at: -1 };
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    if (!nodes.some((n) => n.id === sourceId)) sourceId = order[0] ?? 0;
    if (!nodes.some((n) => n.id === targetId)) targetId = order.at(-1) ?? 0;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (graphShape(nodes, edges) !== built) rebuild();
  }

  /** @param {ScenarioKey} key */
  function loadScenario(key) {
    scenario = key;
    nodes = SCENARIOS[key].nodes;
    edges = SCENARIOS[key].edges;
    sourceId = SCENARIOS[key].source;
    targetId = SCENARIOS[key].target;
    rebuild();
  }

  /** @param {number} k @param {Event & {currentTarget: HTMLInputElement}} e */
  function setWeight(k, e) {
    const raw = e.currentTarget.value.trim();
    const w = Number(raw);
    if (raw === '' || !Number.isInteger(w) || Math.abs(w) > MAX_WEIGHT) {
      e.currentTarget.value = String(edges[k].weight ?? 1);
      notice = { text: m.badWeight(MAX_WEIGHT), at: player.index };
      return;
    }
    edges = edges.map((x, i) => (i === k ? { ...x, weight: w } : x));
    rebuild();
  }

  /** @param {GraphEdge} e */
  const edgeName = (e) =>
    `${names[order.indexOf(e.from)] ?? e.from} → ${names[order.indexOf(e.to)] ?? e.to}`;

  const live = $derived(frame.neighbor >= 0);

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (cycleSet.has(i)) return 'path';
    if (live && i === frame.neighbor) return frame.kind === 'relax' ? 'swap' : '';
    if (i === frame.current && frame.kind !== 'skip') return 'active';
    if (takenSet.has(i)) return 'visited';
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    const s = stateAt(i);
    const parts = [];
    if (i === source) parts.push(m.states.source);
    if (i === target) parts.push(m.states.target);
    if (s === 'path') parts.push(m.states.cycle);
    if (s === 'active') parts.push(m.states.current);
    if (s === 'swap') parts.push(m.states.write);
    if (s === 'visited') parts.push(m.states.taken);
    return parts.join(', ');
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    if (frame.cycle.length && cycleSet.has(a) && cycleSet.has(b)) {
      const c = frame.cycle;
      if (c[(c.indexOf(a) + 1) % c.length] === b) return 'path';
    }
    if (k === frame.edge) return 'active';
    if (frame.parent[b] === a) return 'visited';
    return '';
  }

  const frontier = $derived(
    algo === 'bellman-ford'
      ? frame.dist.map((d, v) => ({
          label: m.chip(names[v], d),
          hot: frame.kind === 'relax' && v === frame.neighbor,
        }))
      : frame.frontier.map((x) => ({
          label: m.chip(names[x.v], x.d),
          hot: frame.kind === 'relax' && x.v === frame.neighbor,
        })),
  );

  /** @param {Algo} a */
  const answerOf = (a) =>
    verdicts[a].negativeCycle && a === 'bellman-ford'
      ? m.cycleAnswer
      : m.show(verdicts[a].got[target] ?? Infinity);

  const legend = [
    ['bg-state-active', m.legend.current],
    ['bg-state-swap', m.legend.write],
    ['bg-state-visited', m.legend.taken],
    ['bg-state-path', m.legend.cycle],
  ];
</script>

<LessonLayout lesson={m}>
  <fieldset class="mb-4">
    <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.scenarioLabel}
    </legend>
    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {#each SCENARIO_KEYS as key (key)}
        <button
          type="button"
          aria-pressed={key === scenario}
          class="rounded-xl border p-3 text-left text-sm {key === scenario
            ? 'border-teal-700 bg-teal-50 ring-1 ring-teal-700'
            : 'border-slate-200 bg-white hover:border-slate-400'}"
          onclick={() => loadScenario(key)}
        >
          <span class="block font-semibold text-slate-900">{m.scenarios[key].title}</span>
          <span class="mt-1 block text-slate-600">{m.scenarios[key].story}</span>
        </button>
      {/each}
    </div>
  </fieldset>

  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.algoLabel}
      name="algo"
      options={ALGOS.map((a) => ({ value: a, label: m.algos[a] }))}
      bind:value={algo}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sourceLabel}
      <select
        name="source"
        class="field"
        value={sourceId}
        onchange={(e) => {
          sourceId = Number(e.currentTarget.value);
          rebuild();
        }}
      >
        {#each order as id, i (id)}
          <option value={id}>{names[i]}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.targetLabel}
      <select
        name="target"
        class="field"
        value={targetId}
        onchange={(e) => (targetId = Number(e.currentTarget.value))}
      >
        {#each order as id, i (id)}
          <option value={id}>{names[i]}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-outline" onclick={() => loadScenario(scenario)}
      >{m.resetScenario}</button
    >
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GraphCanvas
          bind:nodes
          bind:edges
          ariaLabel={m.graphAria}
          directed
          weighted
          editable
          maxNodes={MAX_NODES}
          nodeState={(id) => stateAt(order.indexOf(id))}
          {edgeState}
          markerOf={(id) => (id === sourceId ? 's' : id === targetId ? 't' : '')}
          noteOf={(id) => m.dNote(frame.dist[order.indexOf(id)])}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], frame.dist[i], stateName(i));
          }}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="font-mono font-bold">s</span>{m.states.source}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="font-mono font-bold">t</span>{m.legend.target}
          </li>
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-active"></span>{m.legend.edgeNow}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-visited"></span>{m.legend.tree}
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

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-3">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.checks}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.taken}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.settled.length}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.cycle.length ? m.cycleAnswer : m.show(frame.dist[target] ?? Infinity)}
          </dd>
        </div>
      </dl>

      <div
        class="rounded-xl border p-3 {player.atEnd
          ? verdict.verdict === 'wrong'
            ? 'border-rose-300 bg-rose-50'
            : verdict.verdict === 'best'
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-amber-300 bg-amber-50'
          : 'border-slate-200 bg-white'}"
      >
        <h2 class="mb-1 text-xs text-slate-500">{m.verdictTitle}</h2>
        {#if player.atEnd}
          <p class="font-semibold text-slate-900">{m.verdicts[verdict.verdict]}</p>
          <p class="mt-1 text-sm text-slate-700">
            {m.verdictDetail(verdict, algo, names, target)}
          </p>
        {:else}
          <p class="text-sm text-slate-600">{m.verdictPending}</p>
        {/if}
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <table class="w-full text-sm tabular-nums">
          <thead>
            <tr class="text-left text-xs text-slate-500">
              {#each m.compareHead as head, i (i)}
                <th scope="col" class="py-1 font-semibold {i ? 'text-right' : ''}">{head}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each ALGOS as a (a)}
              <tr class="border-t border-slate-100 {a === algo ? 'bg-teal-50' : ''}">
                <th scope="row" class="py-1 text-left font-normal">{m.algos[a]}</th>
                <td class="text-right font-semibold">{answerOf(a)}</td>
                <td class="text-right font-semibold">{verdicts[a].checks}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <ChipList
        title={m.frontierTitle[algo]}
        emptyText={m.frontierEmpty}
        hotLabel={m.hotLabel}
        items={frontier}
      />
      <CodePanel lines={pseudocode[algo]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-3">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.edgesTitle}</h2>
        {#if edges.length}
          <ol class="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
            {#each edges as e, k (k)}
              <li
                class="flex items-center justify-between gap-2 rounded px-1 text-sm {k ===
                frame.edge
                  ? 'bg-amber-50'
                  : ''}"
              >
                <span class="font-mono">{edgeName(e)}</span>
                <input
                  type="number"
                  min={-MAX_WEIGHT}
                  max={MAX_WEIGHT}
                  step="1"
                  class="field w-16"
                  aria-label={m.weightAria(edgeName(e))}
                  value={e.weight ?? 1}
                  onchange={(ev) => setWeight(k, ev)}
                />
              </li>
            {/each}
          </ol>
        {:else}
          <p class="text-sm text-slate-600">{m.noEdges}</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
