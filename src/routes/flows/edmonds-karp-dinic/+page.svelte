<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_CAPACITY,
    MAX_NODES,
    dinicPseudocode,
    edmondsKarpPseudocode,
    phaseFlowTrace,
  } from '$lib/algo-engine/edmonds-karp-dinic.js';
  import { en as m } from '$lib/lessons/edmonds-karp-dinic/copy.en.js';
  import FlowBoard from '$lib/lessons/ford-fulkerson/flow-board.svelte';
  import NetworkEditor from '$lib/lessons/ford-fulkerson/network-editor.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/ford-fulkerson/board-types.js').BoardArc} BoardArc */
  /** @typedef {import('$lib/algo-engine/edmonds-karp-dinic.js').FlowMethod} FlowMethod */
  /** @typedef {'classic' | 'layers' | 'zigzag'} Preset */
  /** @typedef {'flow' | 'residual'} View */

  /** @param {[number, number, number, string][]} list @returns {GraphNode[]} */
  const at = (list) => list.map(([id, x, y, label]) => ({ id, x, y, label }));
  /** @param {[number, number, number][]} list @returns {GraphEdge[]} */
  const caps = (list) => list.map(([from, to, weight]) => ({ from, to, weight }));

  /** @type {Record<Preset, {nodes: GraphNode[], edges: GraphEdge[]}>} */
  const PRESETS = {
    classic: {
      nodes: at([
        [0, 40, 150, 'S'],
        [1, 160, 60, 'A'],
        [2, 160, 240, 'B'],
        [3, 320, 60, 'C'],
        [4, 320, 240, 'D'],
        [5, 440, 150, 'T'],
      ]),
      edges: caps([
        [0, 1, 16],
        [0, 2, 13],
        [2, 1, 4],
        [1, 3, 12],
        [3, 2, 9],
        [2, 4, 14],
        [4, 3, 7],
        [3, 5, 20],
        [4, 5, 4],
      ]),
    },
    layers: {
      nodes: at([
        [0, 40, 150, 'S'],
        [1, 160, 50, 'A'],
        [2, 160, 150, 'B'],
        [3, 160, 250, 'C'],
        [4, 310, 90, 'D'],
        [5, 310, 220, 'E'],
        [6, 440, 150, 'T'],
      ]),
      edges: caps([
        [0, 1, 4],
        [0, 2, 3],
        [0, 3, 5],
        [1, 4, 3],
        [2, 4, 2],
        [2, 5, 2],
        [3, 5, 4],
        [4, 6, 6],
        [5, 6, 4],
        [1, 2, 2],
      ]),
    },
    zigzag: {
      nodes: at([
        [0, 60, 150, 'S'],
        [1, 240, 60, 'A'],
        [2, 240, 240, 'B'],
        [3, 420, 150, 'T'],
      ]),
      edges: caps([
        [0, 1, 20],
        [0, 2, 20],
        [1, 2, 1],
        [1, 3, 20],
        [2, 3, 20],
      ]),
    },
  };
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRESETS));
  const lastId = (/** @type {GraphNode[]} */ ns) => Math.max(...ns.map((n) => n.id));

  let preset = $state(/** @type {Preset} */ ('classic'));
  let method = $state(/** @type {FlowMethod} */ ('ek'));
  let view = $state(/** @type {View} */ ('residual'));
  let nodes = $state.raw(PRESETS.classic.nodes);
  let edges = $state.raw(PRESETS.classic.edges);
  let sourceId = $state(0);
  let sinkId = $state(5);
  let notice = $state({ text: '', at: -1 });

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const byId = $derived(new Map(nodes.map((n) => [n.id, n])));
  const names = $derived(order.map((id) => byId.get(id)?.label ?? letter(id)));
  const points = $derived(
    order.map((id, i) => {
      const n = /** @type {GraphNode} */ (byId.get(id));
      return { x: n.x, y: n.y, label: names[i] };
    }),
  );
  const s = $derived(order.indexOf(sourceId));
  const t = $derived(order.indexOf(sinkId));

  const build = () =>
    phaseFlowTrace({
      ids: nodes.map((n) => n.id),
      edges,
      source: order.indexOf(sourceId),
      sink: order.indexOf(sinkId),
      method,
    });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const ends = $derived({ s: names[s] ?? '', t: names[t] ?? '', sink: t });
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, method, names, ends),
  );
  const pseudocode = $derived(method === 'ek' ? edmondsKarpPseudocode : dinicPseudocode);

  let built = graphShape(PRESETS.classic.nodes, PRESETS.classic.edges);

  /** @param {string} [text] */
  function rebuild(text = '') {
    built = graphShape(nodes, edges);
    player.load(build());
    notice = { text, at: text ? 0 : -1 };
  }

  /** @param {string} text */
  const refuse = (text) => (notice = { text, at: player.index });

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    const tooBig = g.edges.some((e) => (e.weight ?? 1) > MAX_CAPACITY);
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges.map((e) => ({ ...e, weight: Math.min(MAX_CAPACITY, e.weight ?? 1) }));
    const ids = nodes.map((n) => n.id);
    /** @param {number} id */
    const others = (id) => ids.filter((x) => x !== id);
    if (!ids.includes(sourceId)) sourceId = Math.min(...others(sinkId), Infinity);
    if (!ids.includes(sinkId)) sinkId = Math.max(...others(sourceId), -Infinity);
    if (!Number.isFinite(sourceId)) sourceId = ids[0] ?? 0;
    if (!Number.isFinite(sinkId)) sinkId = sourceId;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (graphShape(nodes, edges) !== built || tooBig)
      rebuild(tooBig ? m.clipped(MAX_CAPACITY) : '');
  }

  /** @param {Preset} p */
  function load(p) {
    preset = p;
    nodes = PRESETS[p].nodes;
    edges = PRESETS[p].edges;
    sourceId = 0;
    sinkId = lastId(PRESETS[p].nodes);
    rebuild();
  }

  /** @param {'source' | 'sink'} end @param {Event & {currentTarget: HTMLSelectElement}} e */
  function pickEnd(end, e) {
    const id = Number(e.currentTarget.value);
    if (id === (end === 'source' ? sinkId : sourceId)) {
      e.currentTarget.value = String(end === 'source' ? sourceId : sinkId);
      refuse(m.sameEnds);
      return;
    }
    if (end === 'source') sourceId = id;
    else sinkId = id;
    rebuild();
  }

  /** @param {GraphEdge} e */
  const edgeName = (e) =>
    `${names[order.indexOf(e.from)] ?? e.from} → ${names[order.indexOf(e.to)] ?? e.to}`;

  const showPath = $derived(
    frame.path.length > 0 && ['bfs', 'path', 'push', 'dead'].includes(frame.kind),
  );
  /** @param {number} k @param {boolean} forward */
  const onPath = (k, forward) =>
    showPath && frame.path.some((a) => a.edge === k && a.forward === forward);
  const pathVertices = $derived(new Set(showPath ? frame.path.flatMap((a) => [a.from, a.to]) : []));
  const deadSet = $derived(new Set(frame.dead));
  const leveled = $derived(method === 'dinic' && frame.kind !== 'start' && frame.kind !== 'done');
  /** @param {number} u @param {number} v */
  const inLevelGraph = (u, v) =>
    frame.level[u] >= 0 && frame.level[v] === frame.level[u] + 1 && !deadSet.has(v);
  const before = $derived(frame.kind === 'bfs' || frame.kind === 'path' || frame.kind === 'dead');

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
      if (view === 'flow') {
        /** @type {VisualState} */
        let state = '';
        let what = '';
        if (onPath(k, true)) [state, what] = ['active', m.states.forward];
        else if (onPath(k, false)) [state, what] = ['swap', m.states.backward];
        else if (f > 0 && f === c) [state, what] = ['sorted', m.states.full];
        else if (f > 0) [state, what] = ['visited', m.states.carries];
        out.push({
          from: u,
          to: v,
          label: m.flowLabel(f, c),
          title: m.edgeTitle(names[u], names[v], f, c, what),
          state,
        });
        return;
      }
      /** @type {[number, number, number, boolean][]} */
      const both = [
        [u, v, c - f, true],
        [v, u, f, false],
      ];
      for (const [a, b, room, forward] of both) {
        if (room <= 0) continue;
        const hot = onPath(k, forward) && before;
        const dim = leveled && !hot && !inLevelGraph(a, b);
        const what = hot
          ? forward
            ? m.states.forward
            : m.states.backward
          : dim
            ? m.states.outside
            : '';
        out.push({
          from: a,
          to: b,
          label: String(room),
          title: m.arcTitle(names[a], names[b], room, forward, what),
          state: hot ? (forward ? 'active' : 'swap') : '',
          dashed: !forward,
          dim,
        });
      }
    });
    return out;
  });

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (deadSet.has(i)) return 'pruned';
    if (pathVertices.has(i)) return 'active';
    return '';
  }

  /** @param {number} i */
  function vertexLabel(i) {
    const st = stateAt(i);
    const parts = [];
    if (i === s) parts.push(m.states.source);
    if (i === t) parts.push(m.states.sink);
    if (st === 'active') parts.push(m.states.onPath);
    if (st === 'pruned') parts.push(m.states.dead);
    return m.vertexLabel(names[i], frame.level[i], parts.join(', '));
  }

  const viewOptions = [
    { value: 'residual', label: m.views.residual },
    { value: 'flow', label: m.views.flow },
  ];
  const methodOptions = [
    { value: 'ek', label: m.methods.ek },
    { value: 'dinic', label: m.methods.dinic },
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.methodLabel}
      name="method"
      options={methodOptions}
      bind:value={method}
      onchange={() => rebuild()}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => load(/** @type {Preset} */ (e.currentTarget.value))}
      >
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sourceLabel}
      <select name="source" class="field" value={sourceId} onchange={(e) => pickEnd('source', e)}>
        {#each order as id, i (id)}
          <option value={id}>{names[i]}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sinkLabel}
      <select name="sink" class="field" value={sinkId} onchange={(e) => pickEnd('sink', e)}>
        {#each order as id, i (id)}
          <option value={id}>{names[i]}</option>
        {/each}
      </select>
    </label>
    <SegmentedControl legend={m.viewLabel} name="view" options={viewOptions} bind:value={view} />
    <button type="button" class="btn-outline" onclick={() => load(preset)}>{m.resetGraph}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <FlowBoard
          {points}
          {arcs}
          ariaLabel={m.boardAria[view]}
          nodeState={stateAt}
          markerOf={(i) => (i === s ? 's' : i === t ? 't' : '')}
          noteOf={(i) => (frame.kind === 'start' ? '' : m.levelNote(frame.level[i]))}
          labelOf={vertexLabel}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-active"></span>{m.legend.onPath}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 bg-slate-200"></span>{m.legend
              .dead}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-active"></span>{m.legend.forward}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-swap"></span>{m.legend.backward}
          </li>
          {#if view === 'flow'}
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm bg-state-visited"></span>{m.legend.carries}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm bg-state-sorted"></span>{m.legend.full}
            </li>
          {:else}
            <li class="flex items-center gap-1.5">
              <span class="w-3 border-t-2 border-dashed border-slate-500"></span>{m.legend.dashed}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm bg-slate-400 opacity-35"></span>{m.legend.faded}
            </li>
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

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-3">
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
          <dt class="text-xs text-slate-500">{m.stats.searches[method]}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.searches}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.checks}</dd>
        </div>
      </dl>
      <ChipList
        title={m.pathTitle}
        emptyText={m.emptyPath}
        items={showPath
          ? frame.path.map((a) => ({
              label: m.pathStep(names[a.from], names[a.to], a.forward),
              hot: !a.forward,
            }))
          : []}
      />
      <CodePanel lines={pseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <details
      class="min-w-0 rounded-xl border border-slate-200 bg-white p-3 lg:col-start-1 lg:row-start-3"
    >
      <summary class="cursor-pointer text-sm font-semibold text-slate-700">{m.editTitle}</summary>
      <div class="mt-3">
        <NetworkEditor
          bind:nodes
          bind:edges
          maxNodes={MAX_NODES}
          maxCapacity={MAX_CAPACITY}
          text={m.editor}
          {edgeName}
          onchange={onGraphChange}
          onrefuse={() => refuse(m.badCapacity(MAX_CAPACITY))}
        />
      </div>
    </details>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
