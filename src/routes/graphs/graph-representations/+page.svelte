<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_NODES,
    cleanEdges,
    representationsPseudocode,
    representationsTrace,
  } from '$lib/algo-engine/graph-representations.js';
  import { en as m } from '$lib/lessons/graph-representations/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @param {number} id */
  const letter = (id) => (id < 26 ? String.fromCharCode(65 + id) : `V${id}`);

  /** @type {GraphNode[]} */
  const DEFAULT_NODES = [
    { id: 0, x: 80, y: 70, label: 'A' },
    { id: 1, x: 250, y: 50, label: 'B' },
    { id: 2, x: 150, y: 200, label: 'C' },
    { id: 3, x: 400, y: 110, label: 'D' },
    { id: 4, x: 330, y: 240, label: 'E' },
  ];
  /** @type {GraphEdge[]} */
  const DEFAULT_EDGES = [
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 2 },
    { from: 1, to: 2, weight: 5 },
    { from: 1, to: 3, weight: 10 },
    { from: 2, to: 4, weight: 3 },
    { from: 3, to: 4, weight: 4 },
  ];

  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(DEFAULT_EDGES);
  let direction = $state('undirected');
  let weighting = $state('unweighted');
  /** Vertex id whose row is selected, or null. */
  let selected = $state(/** @type {number | null} */ (null));
  /** Matrix cell picked for an edge test, or null. */
  let cell = $state(/** @type {[number, number] | null} */ (null));
  let notice = $state({ text: '', at: -1 });

  const directed = $derived(direction === 'directed');
  const weighted = $derived(weighting === 'weighted');

  /** Builds the trace for the current graph and options. */
  function build() {
    return representationsTrace({
      ids: nodes.map((n) => n.id),
      edges,
      directed,
      weighted,
    });
  }

  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const last = $derived(
    /** @type {import('$lib/algo-engine/graph-representations.js').RepFrame} */ (
      player.frames.at(-1)
    ),
  );

  /** Vertex ids in matrix order. */
  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const selectedRow = $derived(selected === null ? -1 : order.indexOf(selected));

  /** Rebuilds after any change to the graph or the options and jumps to the finished panels. */
  function rebuild() {
    edges = cleanEdges(edges, directed);
    if (selected !== null && !nodes.some((n) => n.id === selected)) selected = null;
    cell = null;
    notice = { text: '', at: -1 };
    built = shape(nodes, edges);
    player.load(build());
  }

  /** What the trace depends on: vertex ids and edges, not positions. @param {GraphNode[]} ns @param {GraphEdge[]} es */
  const shape = (ns, es) =>
    JSON.stringify([ns.map((n) => n.id), es.map((e) => [e.from, e.to, e.weight])]);
  let built = shape(DEFAULT_NODES, DEFAULT_EDGES);

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (shape(nodes, edges) !== built) rebuild();
  }

  function reset() {
    nodes = DEFAULT_NODES;
    edges = DEFAULT_EDGES;
    direction = 'undirected';
    weighting = 'unweighted';
    selected = null;
    rebuild();
  }

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {number} id */
  function selectVertex(id) {
    selected = id;
    cell = null;
    const row = order.indexOf(id);
    const neighbours = last.lists[row].map((e) => names[e.to]);
    say(m.neighboursQuery(names[row], order.length, neighbours));
  }

  /** @param {number} r @param {number} c */
  function selectCell(r, c) {
    cell = [r, c];
    selected = order[r];
    say(m.edgeQuery(names[r], names[c], last.matrix[r][c], last.lists[r].length));
  }

  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, names, directed),
  );

  const current = $derived(frame.edgeIndex >= 0 ? edges[frame.edgeIndex] : null);

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    if (current && e.from === current.from && e.to === current.to) return 'active';
    const at = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    const doneUpTo = frame.kind === 'done' ? edges.length : frame.edgeIndex;
    return at >= 0 && at < doneUpTo ? 'visited' : '';
  }

  /** @param {number} id @returns {VisualState} */
  function nodeState(id) {
    const row = order.indexOf(id);
    return row === frame.from || row === frame.to ? 'active' : '';
  }

  /** @param {number} r @param {number} c @returns {VisualState} */
  function matrixState(r, c) {
    if (r === frame.from && c === frame.to) return 'active';
    if (r === selectedRow) return 'compare';
    return '';
  }

  /** @param {number} r @param {number} c */
  function matrixLabel(r, c) {
    const s = matrixState(r, c);
    const state = s === 'active' ? m.states.writing : s === 'compare' ? m.states.selected : '';
    return m.matrixCell(names[r], names[c], frame.matrix[r][c], state);
  }

  const legend = [
    ['bg-state-active', m.legend.writing],
    ['bg-state-visited', m.legend.stored],
    ['bg-state-compare', m.legend.selected],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.directionLabel}
      name="direction"
      options={[
        { value: 'undirected', label: m.directions.undirected },
        { value: 'directed', label: m.directions.directed },
      ]}
      bind:value={direction}
      onchange={rebuild}
    />
    <SegmentedControl
      legend={m.weightLabel}
      name="weighting"
      options={[
        { value: 'unweighted', label: m.weights.unweighted },
        { value: 'weighted', label: m.weights.weighted },
      ]}
      bind:value={weighting}
      onchange={rebuild}
    />
    <button type="button" class="btn-outline" onclick={reset}>{m.resetGraph}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.graphTitle}
        </h2>
        <GraphCanvas
          bind:nodes
          bind:edges
          ariaLabel={m.graphAria}
          {directed}
          {weighted}
          editable
          maxNodes={MAX_NODES}
          {nodeState}
          {edgeState}
          onselect={selectVertex}
          {selected}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
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
      <div class="sticky bottom-2 z-10 print:hidden lg:static">
        <StepControls {player} />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.matrixTitle}
          </h2>
          <p class="mb-2 text-xs text-slate-500">{m.matrixHint}</p>
          {#if names.length}
            <DpTable
              values={frame.matrix}
              rowHeaders={names}
              colHeaders={names}
              ariaLabel={m.matrixAria(names)}
              stateOf={matrixState}
              markerOf={(r, c) => (r === frame.from && c === frame.to ? '•' : '')}
              labelOf={matrixLabel}
              onselect={selectCell}
              selected={cell}
              speed={player.speed}
            />
          {/if}
        </div>
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.listsTitle}
          </h2>
          <ol class="flex flex-col gap-1 font-mono text-sm">
            {#each frame.lists as list, row (row)}
              <li
                class="flex flex-wrap items-center gap-1 rounded px-1.5 py-0.5 {row === selectedRow
                  ? 'bg-state-compare'
                  : ''}"
              >
                <span class="font-bold">{names[row]}</span>
                <span aria-hidden="true">→</span>
                {#each list as entry, k (k)}
                  {@const fresh = row === frame.from && k === list.length - 1}
                  <span
                    class="rounded px-1 {fresh
                      ? 'bg-state-active text-white underline'
                      : 'bg-sky-100 text-sky-900'}"
                    >{names[entry.to]}{weighted ? `·${entry.weight}` : ''}{#if fresh}<span
                        class="sr-only">{` (${m.justAdded})`}</span
                      >{/if}</span
                  >{k < list.length - 1 ? ', ' : ''}
                {:else}
                  <span class="text-xs text-slate-500">{m.listsEmpty}</span>
                {/each}
                {#if row === selectedRow}<span class="sr-only">{` (${m.selectedRow})`}</span>{/if}
              </li>
            {/each}
          </ol>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.vertices}</dt>
          <dd class="text-2xl font-bold tabular-nums">{names.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.edges}</dt>
          <dd class="text-2xl font-bold tabular-nums">{edges.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.matrixCells}</dt>
          <dd class="text-2xl font-bold tabular-nums">{names.length * names.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.listEntries}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.listEntries}</dd>
        </div>
      </dl>
      <CodePanel lines={representationsPseudocode} active={frame.lines} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
