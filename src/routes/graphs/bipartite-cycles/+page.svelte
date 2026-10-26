<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_NODES,
    bipartitePseudocode,
    bipartiteTrace,
    directedCyclePseudocode,
    directedCycleTrace,
    undirectedCyclePseudocode,
    undirectedCycleTrace,
  } from '$lib/algo-engine/bipartite-cycles.js';
  import { en as m } from '$lib/lessons/bipartite-cycles/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'bipartite' | 'undirected' | 'directed'} Mode */
  /** @typedef {keyof typeof m.presets} Preset */

  /** @param {number} id */
  const letter = (id) => (id < 26 ? String.fromCharCode(65 + id) : `V${id}`);

  /**
   * @param {[number, number][]} spots
   * @param {[number, number][]} pairs
   * @returns {{nodes: GraphNode[], edges: GraphEdge[]}}
   */
  const graphOf = (spots, pairs) => ({
    nodes: spots.map(([x, y], id) => ({ id, x, y, label: letter(id) })),
    edges: pairs.map(([from, to]) => ({ from, to })),
  });

  /** @type {Record<Preset, {nodes: GraphNode[], edges: GraphEdge[]}>} */
  const PRESETS = {
    odd: graphOf(
      [
        [150, 40],
        [260, 90],
        [220, 220],
        [80, 220],
        [40, 90],
        [350, 210],
        [440, 120],
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 0],
        [2, 5],
        [5, 6],
      ],
    ),
    even: graphOf(
      [
        [140, 40],
        [300, 40],
        [380, 150],
        [300, 260],
        [140, 260],
        [60, 150],
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 0],
        [0, 3],
      ],
    ),
    diamond: graphOf(
      [
        [60, 150],
        [240, 50],
        [240, 250],
        [420, 150],
      ],
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
      ],
    ),
    tree: graphOf(
      [
        [240, 40],
        [130, 140],
        [350, 140],
        [60, 250],
        [200, 250],
        [420, 250],
      ],
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
      ],
    ),
  };
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRESETS));

  let nodes = $state.raw(PRESETS.odd.nodes);
  let edges = $state.raw(PRESETS.odd.edges);
  let mode = $state(/** @type {Mode} */ ('bipartite'));

  const TRACES = {
    bipartite: bipartiteTrace,
    undirected: undirectedCycleTrace,
    directed: directedCycleTrace,
  };
  const CODE = {
    bipartite: bipartitePseudocode,
    undirected: undirectedCyclePseudocode,
    directed: directedCyclePseudocode,
  };

  const build = () => TRACES[mode]({ ids: nodes.map((n) => n.id), edges });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const narration = $derived(m.describe(frame, names, mode));
  const usedSet = $derived(new Set(frame.used));
  const treeSet = $derived(new Set(frame.tree));
  const found = $derived(frame.kind === 'conflict' || frame.kind === 'cycle');
  const cycleSet = $derived(new Set(found ? frame.cycle : []));

  /** Index pairs (a, b) of consecutive cycle vertices, closing back to the first. */
  const cycleLinks = $derived.by(() => {
    const c = found ? frame.cycle : [];
    return new Set(c.map((v, i) => `${v}>${c[(i + 1) % c.length]}`));
  });

  const result = $derived.by(() => {
    if (frame.kind === 'conflict') return m.results.oddCycle(frame.cycle.length);
    if (frame.kind === 'cycle') return m.results.cycle(frame.cycle.length);
    if (frame.kind === 'done')
      return mode === 'bipartite' ? m.results.bipartite : m.results.acyclic;
    return m.results.running;
  });
  const reached = $derived(frame.colour.filter((c) => c !== 0).length);
  const sides = $derived(
    `${frame.colour.filter((c) => c === 1).length} | ${frame.colour.filter((c) => c === 2).length}`,
  );

  /** @param {GraphNode[]} ns @param {GraphEdge[]} es */
  const shape = (ns, es) => JSON.stringify([ns.map((n) => n.id), es.map((e) => [e.from, e.to])]);
  let built = shape(PRESETS.odd.nodes, PRESETS.odd.edges);

  /** Undirected checks keep one edge per pair, the first one drawn. @param {GraphEdge[]} es */
  function onePerPair(es) {
    return es.filter(
      (e, i) =>
        es.findIndex(
          (x) => (x.from === e.from && x.to === e.to) || (x.from === e.to && x.to === e.from),
        ) === i,
    );
  }

  function rebuild() {
    if (mode !== 'directed') edges = onePerPair(edges);
    built = shape(nodes, edges);
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (shape(nodes, edges) !== built) rebuild();
  }

  /** @param {Preset} key */
  function load(key) {
    nodes = PRESETS[key].nodes;
    edges = PRESETS[key].edges;
    rebuild();
  }

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (cycleSet.has(i)) return 'path';
    if (i === frame.current && frame.kind !== 'done') return 'active';
    if (mode === 'bipartite') {
      if (frame.colour[i] === 1) return 'sorted';
      if (frame.colour[i] === 2) return 'visited';
      return '';
    }
    if (frame.colour[i] === 1) return 'frontier';
    if (frame.colour[i] === 2) return 'visited';
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    const parts = [];
    const s = stateAt(i);
    if (s === 'path') parts.push(m.states.cycle);
    if (s === 'active') parts.push(m.states.current);
    if (mode === 'bipartite') {
      if (frame.colour[i] === 1) parts.push(m.states.side1);
      if (frame.colour[i] === 2) parts.push(m.states.side2);
    } else if (frame.colour[i] === 1) parts.push(m.states.inProgress);
    else if (frame.colour[i] === 2)
      parts.push(mode === 'directed' ? m.states.finished : m.states.visited);
    return parts.join(', ');
  }

  /** The side number for the two-colouring, so colour is never the only cue. @param {number} i */
  const marker = (i) => (mode === 'bipartite' && frame.colour[i] ? String(frame.colour[i]) : '');

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    const onCycle =
      cycleLinks.has(`${a}>${b}`) || (mode !== 'directed' && cycleLinks.has(`${b}>${a}`));
    if (onCycle) return 'path';
    if (k === frame.edge) return 'active';
    if (treeSet.has(k)) return 'visited';
    return usedSet.has(k) ? 'compare' : '';
  }

  const pendingItems = $derived(
    (mode === 'bipartite' ? frame.pending : frame.pending.toReversed()).map((v) => ({
      label: names[v],
    })),
  );

  const legend = $derived(
    mode === 'bipartite'
      ? [
          ['bg-state-active', m.legend.current],
          ['bg-state-sorted', m.legend.side1],
          ['bg-state-visited', m.legend.side2],
          ['bg-state-path', m.legend.cycle],
        ]
      : [
          ['bg-state-active', m.legend.current],
          ['bg-state-frontier', m.legend.inProgress],
          ['bg-state-visited', m.legend.finished],
          ['bg-state-path', m.legend.cycle],
        ],
  );
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={[
        { value: 'bipartite', label: m.modes.bipartite },
        { value: 'undirected', label: m.modes.undirected },
        { value: 'directed', label: m.modes.directed },
      ]}
      bind:value={mode}
      onchange={rebuild}
    />
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.presetLabel}
      </legend>
      <div class="flex flex-wrap gap-2">
        {#each PRESET_KEYS as key (key)}
          <button type="button" class="btn-outline" onclick={() => load(key)}
            >{m.presets[key]}</button
          >
        {/each}
      </div>
    </fieldset>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GraphCanvas
          bind:nodes
          bind:edges
          ariaLabel={m.graphAria}
          directed={mode === 'directed'}
          editable
          maxNodes={MAX_NODES}
          nodeState={(id) => stateAt(order.indexOf(id))}
          {edgeState}
          markerOf={(id) => marker(order.indexOf(id))}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], stateName(i));
          }}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-visited"></span>{m.legend.treeEdge}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-compare"></span>{m.legend.checkedEdge}
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

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.checks}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          {#if mode === 'bipartite'}
            <dt class="text-xs text-slate-500">{m.stats.sides}</dt>
            <dd class="text-2xl font-bold tabular-nums">{sides}</dd>
          {:else}
            <dt class="text-xs text-slate-500">{m.stats.reached}</dt>
            <dd class="text-2xl font-bold tabular-nums">{reached}</dd>
          {/if}
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-xl font-bold">{result}</dd>
        </div>
      </dl>
      <ChipList
        title={mode === 'bipartite' ? m.queueLabel : m.stackLabel}
        emptyText={m.emptyText}
        items={pendingItems}
      />
      <CodePanel lines={CODE[mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
