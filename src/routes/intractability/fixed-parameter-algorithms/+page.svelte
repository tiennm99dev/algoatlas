<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    FPT_PRESETS,
    MAX_K,
    MAX_NODES,
    fptPseudocode,
    fptTrace,
    subsetsUpTo,
  } from '$lib/algo-engine/fixed-parameter-algorithms.js';
  import { en as m } from '$lib/lessons/fixed-parameter-algorithms/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/algo-engine/fixed-parameter-algorithms.js').FptFrame} FptFrame */
  /** @typedef {import('$lib/algo-engine/fixed-parameter-algorithms.js').FptPreset} FptPreset */
  /** @typedef {import('$lib/algo-engine/fixed-parameter-algorithms.js').SearchStatus} SearchStatus */

  /** @param {FptPreset} p */
  const nodesOf = (p) =>
    /** @type {GraphNode[]} */ (p.spots.map(([x, y], id) => ({ id, x, y, label: letter(id) })));
  /** @param {FptPreset} p */
  const edgesOf = (p) => /** @type {GraphEdge[]} */ (p.pairs.map(([from, to]) => ({ from, to })));

  const FIRST = FPT_PRESETS[0];

  let nodes = $state.raw(nodesOf(FIRST));
  let edges = $state.raw(edgesOf(FIRST));
  let k = $state(FIRST.k);
  let kText = $state(String(FIRST.k));
  let kernel = $state(FIRST.kernel ? 'on' : 'off');
  let preset = $state(FIRST.key);
  let notice = $state({ text: '', at: -1 });

  const build = () => fptTrace({ ids: nodes.map((n) => n.id), edges, k, kernel: kernel === 'on' });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, names));

  let built = graphShape(nodesOf(FIRST), edgesOf(FIRST), false);

  function rebuild() {
    notice = { text: '', at: -1 };
    built = graphShape(nodes, edges, false);
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    if (graphShape(nodes, edges, false) === built) return;
    preset = '';
    rebuild();
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = FPT_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    nodes = nodesOf(p);
    edges = edgesOf(p);
    k = p.k;
    kText = String(p.k);
    kernel = p.kernel ? 'on' : 'off';
    rebuild();
  }

  function commitK() {
    const t = kText.trim();
    const next = /^\d+$/.test(t) ? Number(t) : NaN;
    if (!(next >= 0 && next <= MAX_K)) {
      kText = String(k);
      notice = { text: m.kError(MAX_K), at: player.index };
      return;
    }
    kText = String(next);
    if (next === k) return;
    k = next;
    preset = '';
    rebuild();
  }

  function onKernel() {
    preset = '';
    rebuild();
  }

  /** @param {string | number} id */
  function seekNode(id) {
    const at = player.frames.findIndex((f) => f.current === id);
    if (at < 0) return;
    player.pause();
    player.seek(at);
  }

  /** @type {Record<SearchStatus, VisualState>} */
  const STATUS_STATE = { active: 'frontier', fail: 'pruned', yes: 'path', done: 'visited' };

  /** @param {FptFrame} f @returns {TreeNode[]} */
  function forest(f) {
    /** @type {TreeNode[]} */
    const built = f.nodes.map((n) => ({
      id: n.id,
      label: String(n.budget),
      children: [null, null],
      state: n.id === f.current && f.kind !== 'done' ? 'active' : STATUS_STATE[n.status],
      marker:
        n.status === 'yes' ? m.nodeMarkers.yes : n.status === 'fail' ? m.nodeMarkers.fail : '',
      note: String(n.left),
      edgeLabel: n.took < 0 ? '' : m.edgeLabel(names[n.took]),
    }));
    for (const n of f.nodes) {
      const kids = built[n.parent]?.children;
      if (kids) kids[kids[0] === null ? 0 : 1] = built[n.id];
    }
    return built.slice(0, 1);
  }

  const roots = $derived(forest(frame));
  const nodeById = $derived(new Map(frame.nodes.map((n) => [n.id, n])));
  const coverSet = $derived(new Set(frame.cover));
  const forcedSet = $derived(new Set(frame.forced));
  const branchEdge = $derived(frame.edge >= 0 ? frame.edges[frame.edge] : null);

  /** @param {number} id @returns {VisualState} */
  function nodeState(id) {
    const i = order.indexOf(id);
    if (i === frame.vertex) return 'active';
    if (branchEdge?.includes(i) && frame.kind !== 'done') return 'active';
    if (coverSet.has(i)) return 'sorted';
    return '';
  }

  /** @param {number} id */
  function stateName(id) {
    const i = order.indexOf(id);
    const parts = [];
    if (nodeState(id) === 'active') parts.push(m.states.current);
    if (coverSet.has(i)) parts.push(m.states.cover);
    if (forcedSet.has(i)) parts.push(m.states.forced);
    return parts.join(', ');
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    const i = frame.edges.findIndex(([u, v]) => (u === a && v === b) || (u === b && v === a));
    if (i < 0) return '';
    if (i === frame.edge && frame.kind !== 'done') return 'active';
    return frame.covered[i] ? 'visited' : '';
  }

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', m.legend.current],
    ['frontier', m.legend.path],
    ['visited', m.legend.done],
    ['path', m.legend.found],
    ['pruned', m.legend.fail],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitK();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.kLabel}
      <input
        type="text"
        inputmode="numeric"
        name="k"
        class="field w-20 font-mono"
        bind:value={kText}
        onchange={commitK}
      />
    </label>
    <SegmentedControl
      legend={m.kernelLabel}
      name="kernel"
      options={[
        { value: 'off', label: m.kernels.off },
        { value: 'on', label: m.kernels.on },
      ]}
      bind:value={kernel}
      onchange={onKernel}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each FPT_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.graphTitle}
        </h2>
        <GraphCanvas
          bind:nodes
          bind:edges
          ariaLabel={m.graphAria}
          editable
          maxNodes={MAX_NODES}
          {nodeState}
          {edgeState}
          markerOf={(id) => (forcedSet.has(order.indexOf(id)) ? m.markers.forced : '')}
          labelOf={(n) => m.vertexLabel(n.label ?? letter(n.id), stateName(n.id))}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-active"></span>{m.legend.current}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-sorted"></span>{m.legend.cover}
          </li>
          <li>{m.legend.forced}</li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-active"></span>{m.legend.branchEdge}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-visited"></span>{m.legend.covered}
          </li>
        </ul>
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">{m.treeTitle}</h2>
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeAria}
          emptyText={m.treeEmpty}
          labelOf={(node) => {
            const n = nodeById.get(/** @type {number} */ (node.id));
            return n ? m.nodeLabel(n, n.took < 0 ? '' : names[n.took]) : node.label;
          }}
          onselect={seekNode}
          selected={frame.current < 0 ? null : frame.current}
          speed={player.speed}
        />
        <p class="text-xs text-slate-600">{m.treeNote}</p>
        <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
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
          <dt class="text-xs text-slate-500">{m.stats.made}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="made">{frame.nodes.length}</dd>
          <dd class="text-xs text-slate-600">{m.boundNote(frame.budget)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.budget}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="budget">{frame.budget}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.brute}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="brute">
            {subsetsUpTo(frame.n, frame.k)}
          </dd>
          <dd class="text-xs text-slate-600">{m.bruteNote(frame.n, frame.k)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer}</dt>
          <dd class="text-lg font-bold" data-testid="answer">{m.answer(frame, names)}</dd>
        </div>
      </dl>
      <CodePanel lines={fptPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
