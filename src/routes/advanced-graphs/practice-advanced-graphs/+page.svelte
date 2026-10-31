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
    MAX_NODES,
    cyclePseudocode,
    cycleTrace,
    failurePseudocode,
    failureTrace,
  } from '$lib/algo-engine/practice-advanced-graphs.js';
  import { en as m } from '$lib/lessons/practice-advanced-graphs/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @type {GraphNode[]} */
  const NET_NODES = [
    { id: 0, x: 40, y: 60, label: 'A' },
    { id: 1, x: 40, y: 240, label: 'B' },
    { id: 2, x: 140, y: 150, label: 'C' },
    { id: 3, x: 240, y: 150, label: 'D' },
    { id: 4, x: 240, y: 40, label: 'E' },
    { id: 5, x: 340, y: 150, label: 'F' },
    { id: 6, x: 440, y: 60, label: 'G' },
    { id: 7, x: 440, y: 240, label: 'H' },
  ];
  /** @type {GraphEdge[]} */
  const NET_EDGES = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 3, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 7 },
    { from: 7, to: 5 },
  ];
  /** @type {GraphNode[]} */
  const DEP_NODES = [
    { id: 0, x: 50, y: 150, label: 'A' },
    { id: 1, x: 140, y: 50, label: 'B' },
    { id: 2, x: 250, y: 60, label: 'C' },
    { id: 3, x: 330, y: 160, label: 'D' },
    { id: 4, x: 430, y: 60, label: 'E' },
    { id: 5, x: 160, y: 250, label: 'F' },
    { id: 6, x: 330, y: 260, label: 'G' },
  ];
  /** @type {GraphEdge[]} */
  const DEP_EDGES = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 2 },
    { from: 0, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 5 },
    { from: 3, to: 6 },
  ];

  let mode = $state(/** @type {'network' | 'deps'} */ ('network'));
  let netNodes = $state.raw(NET_NODES);
  let netEdges = $state.raw(NET_EDGES);
  let depNodes = $state.raw(DEP_NODES);
  let depEdges = $state.raw(DEP_EDGES);
  let failed = $state(-1);

  const buildFailure = () =>
    failureTrace({ ids: netNodes.map((n) => n.id), edges: netEdges, failed });
  const buildCycles = () => cycleTrace({ ids: depNodes.map((n) => n.id), edges: depEdges });

  const net = createPlayer(buildFailure());
  const dep = createPlayer(buildCycles());
  const nf = $derived(net.frame);
  const df = $derived(dep.frame);

  const netOrder = $derived(netNodes.map((n) => n.id).toSorted((a, b) => a - b));
  const netNames = $derived(
    netOrder.map((id) => netNodes.find((n) => n.id === id)?.label ?? letter(id)),
  );
  const depOrder = $derived(depNodes.map((n) => n.id).toSorted((a, b) => a - b));
  const depNames = $derived(
    depOrder.map((id) => depNodes.find((n) => n.id === id)?.label ?? letter(id)),
  );

  const narration = $derived(
    mode === 'network' ? m.describeFailure(nf, netNames) : m.describeCycles(df, depNames),
  );
  const queueSet = $derived(new Set(nf.queue));
  const stackSet = $derived(new Set(df.stack));
  const cycleComps = $derived(new Set(df.cycles.map((c) => df.comp[c[0]])));
  const largest = $derived(nf.sizes.length ? Math.max(...nf.sizes) : 0);

  let netBuilt = graphShape(NET_NODES, NET_EDGES, false);
  let depBuilt = graphShape(DEP_NODES, DEP_EDGES, false);

  function rebuildNet() {
    netBuilt = graphShape(netNodes, netEdges, false);
    net.load(buildFailure());
  }

  function rebuildDeps() {
    depBuilt = graphShape(depNodes, depEdges, false);
    dep.load(buildCycles());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onNetChange(g) {
    netNodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    netEdges = g.edges;
    if (failed >= 0 && !netNodes.some((n) => n.id === failed)) failed = -1;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (graphShape(netNodes, netEdges, false) !== netBuilt) rebuildNet();
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onDepChange(g) {
    depNodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    depEdges = g.edges;
    if (graphShape(depNodes, depEdges, false) !== depBuilt) rebuildDeps();
  }

  /** @param {number} id */
  function fail(id) {
    failed = id;
    rebuildNet();
  }

  function reset() {
    if (mode === 'network') {
      netNodes = NET_NODES;
      netEdges = NET_EDGES;
      failed = -1;
      rebuildNet();
    } else {
      depNodes = DEP_NODES;
      depEdges = DEP_EDGES;
      rebuildDeps();
    }
  }

  /** @param {number} i @returns {VisualState} */
  function netState(i) {
    if (nf.part[i] === -1) return 'swap';
    if (i === nf.current && nf.kind !== 'done' && nf.kind !== 'fail') return 'active';
    if (queueSet.has(i)) return 'frontier';
    if (nf.part[i] > 0) return 'sorted';
    return '';
  }

  /** @param {number} i */
  function netStateName(i) {
    const s = netState(i);
    if (s === 'swap') return m.states.failed;
    if (s === 'active') return m.states.current;
    if (s === 'frontier') return m.states.queued;
    return '';
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function netEdgeState(e) {
    const a = netOrder.indexOf(e.from);
    const b = netOrder.indexOf(e.to);
    if (a === nf.failed || b === nf.failed) return nf.kind === 'start' ? '' : 'swap';
    if (
      nf.kind === 'reach' &&
      ((a === nf.current && b === nf.other) || (b === nf.current && a === nf.other))
    )
      return 'active';
    return '';
  }

  /** @param {number} i @returns {VisualState} */
  function depState(i) {
    if (i === df.current && df.kind === 'enter') return 'active';
    if (df.comp[i] > 0) return cycleComps.has(df.comp[i]) ? 'swap' : 'sorted';
    if (stackSet.has(i)) return 'frontier';
    return '';
  }

  /** @param {number} i */
  function depStateName(i) {
    const s = depState(i);
    if (s === 'active') return m.states.current;
    if (s === 'swap') return m.states.cycle;
    if (s === 'sorted') return m.states.done;
    if (s === 'frontier') return m.states.stack;
    return '';
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function depEdgeState(e) {
    const a = depOrder.indexOf(e.from);
    const b = depOrder.indexOf(e.to);
    const c = df.comp[a];
    return c > 0 && c === df.comp[b] && cycleComps.has(c) ? 'swap' : '';
  }

  /** Members of each part so far, by number - 1. */
  const parts = $derived.by(() => {
    /** @type {number[][]} */
    const out = Array.from({ length: nf.parts }, () => []);
    nf.part.forEach((p, v) => p > 0 && out[p - 1].push(v));
    return out;
  });

  const netLegend = [
    ['bg-state-swap', m.legend.failed],
    ['bg-state-active', m.legend.current],
    ['bg-state-frontier', m.legend.queued],
    ['bg-state-sorted', m.legend.part],
  ];
  const depLegend = [
    ['bg-state-active', m.legend.current],
    ['bg-state-frontier', m.legend.stack],
    ['bg-state-swap', m.legend.cycle],
    ['bg-state-sorted', m.legend.single],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={[
        { value: 'network', label: m.modes.network },
        { value: 'deps', label: m.modes.deps },
      ]}
      bind:value={mode}
    />
    {#if mode === 'network'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.failLabel}
        <select
          class="field"
          value={String(failed)}
          onchange={(e) => {
            const id = Number(e.currentTarget.value);
            if (id === -1 || netNodes.some((n) => n.id === id)) fail(id);
            else e.currentTarget.value = String(failed);
          }}
        >
          <option value="-1">{m.noFailure}</option>
          {#each netOrder as id, i (id)}<option value={String(id)}>{netNames[i]}</option>{/each}
        </select>
      </label>
    {/if}
    <button type="button" class="btn-outline" onclick={reset}>{m.resetGraph}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        {#if mode === 'network'}
          <GraphCanvas
            bind:nodes={netNodes}
            bind:edges={netEdges}
            ariaLabel={m.networkAria}
            editable
            maxNodes={MAX_NODES}
            nodeState={(id) => netState(netOrder.indexOf(id))}
            edgeState={netEdgeState}
            markerOf={(id) => {
              const p = nf.part[netOrder.indexOf(id)];
              return p > 0 ? String(p) : '';
            }}
            labelOf={(n) => {
              const i = netOrder.indexOf(n.id);
              return m.routerLabel(netNames[i], netStateName(i), nf.part[i]);
            }}
            onselect={(id) => fail(id === failed ? -1 : id)}
            selected={failed >= 0 ? failed : null}
            onchange={onNetChange}
            speed={net.speed}
          />
        {:else}
          <GraphCanvas
            bind:nodes={depNodes}
            bind:edges={depEdges}
            ariaLabel={m.depsAria}
            directed
            editable
            maxNodes={MAX_NODES}
            nodeState={(id) => depState(depOrder.indexOf(id))}
            edgeState={depEdgeState}
            markerOf={(id) => {
              const c = df.comp[depOrder.indexOf(id)];
              return c > 0 ? String(c) : '';
            }}
            noteOf={(id) => {
              const i = depOrder.indexOf(id);
              return df.tin[i] >= 0 ? m.tinLow(df.tin[i], df.low[i]) : '';
            }}
            labelOf={(n) => {
              const i = depOrder.indexOf(n.id);
              return m.moduleLabel(depNames[i], m.modules[n.id] ?? '', depStateName(i));
            }}
            onchange={onDepChange}
            speed={dep.speed}
          />
        {/if}
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each mode === 'network' ? netLegend : depLegend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
          {#if mode === 'network'}
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm bg-state-active"></span>{m.legend.link}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm bg-state-swap"></span>{m.legend.failed}
            </li>
          {:else}
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm bg-state-swap"></span>{m.legend.inside}
            </li>
          {/if}
        </ul>
        {#if mode === 'deps'}
          <p class="mt-2 text-xs text-slate-600">
            <span class="font-semibold">{m.modulesTitle}:</span>
            {depNodes
              .filter((n) => m.modules[n.id])
              .map((n) => `${n.label} ${m.modules[n.id]}`)
              .join(' · ')}
          </p>
        {/if}
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={(mode === 'network' ? net : dep).playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">
      {#if mode === 'network'}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.before}</dt>
            <dd class="text-2xl font-bold tabular-nums">{nf.before}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.after}</dt>
            <dd class="text-2xl font-bold tabular-nums">{nf.parts}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.largest}</dt>
            <dd class="text-2xl font-bold tabular-nums">{largest}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.critical}</dt>
            <dd class="text-2xl font-bold">
              {nf.kind !== 'done' || nf.failed < 0
                ? m.pending
                : nf.parts > nf.before
                  ? m.yes
                  : m.no}
            </dd>
          </div>
        </dl>
        <ChipList
          title={m.partsLabel}
          emptyText={m.emptyText}
          items={parts.map((list, k) => ({
            label: m.partChip(k + 1, list.map((v) => netNames[v]).join(' ')),
            hot: k === nf.parts - 1 && nf.kind !== 'done',
          }))}
          hotLabel={m.hotLabel}
        />
        <ChipList
          title={m.queueLabel}
          emptyText={m.emptyText}
          items={nf.queue.map((v) => ({ label: netNames[v] }))}
        />
        <CodePanel lines={failurePseudocode} active={nf.lines} />
      {:else}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.comps}</dt>
            <dd class="text-2xl font-bold tabular-nums">{df.count}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.onCycle}</dt>
            <dd class="text-2xl font-bold tabular-nums">{df.cycles.flat().length}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.cycles}</dt>
            <dd class="text-2xl font-bold tabular-nums">{df.cycles.length}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.buildable}</dt>
            <dd class="text-2xl font-bold">
              {df.kind !== 'done' ? m.pending : df.cycles.length ? m.no : m.yes}
            </dd>
          </div>
        </dl>
        <ChipList
          title={m.stackLabel}
          emptyText={m.emptyText}
          items={df.stack.toReversed().map((v) => ({ label: depNames[v] }))}
        />
        <ChipList
          title={m.cyclesLabel}
          emptyText={m.emptyText}
          hotLabel={m.hotLabel}
          items={df.cycles.map((c) => ({
            label: c.map((v) => depNames[v]).join(' '),
            hot: df.kind === 'scc' && df.popped.length > 1 && c.includes(df.current),
          }))}
        />
        <ChipList
          title={m.orderLabel}
          emptyText={df.kind === 'done' ? m.noOrder : m.pending}
          items={df.kind === 'done' && df.cycles.length === 0
            ? df.order.map((v) => ({ label: depNames[v] }))
            : []}
        />
        <CodePanel lines={cyclePseudocode} active={df.lines} />
      {/if}
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      {#if mode === 'network'}
        <StepControls player={net} />
      {:else}
        <StepControls player={dep} />
      {/if}
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
