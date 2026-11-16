<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_NODES,
    REDUCTION_PRESETS,
    reductionPseudocode,
    reductionTrace,
  } from '$lib/algo-engine/p-np-reductions.js';
  import { en as m } from '$lib/lessons/p-np-reductions/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/p-np-reductions.js').ReductionPreset} ReductionPreset */

  /** @param {ReductionPreset} p */
  const nodesOf = (p) =>
    /** @type {GraphNode[]} */ (p.spots.map(([x, y], id) => ({ id, x, y, label: letter(id) })));
  /** @param {ReductionPreset} p */
  const edgesOf = (p) => /** @type {GraphEdge[]} */ (p.pairs.map(([from, to]) => ({ from, to })));

  const FIRST = REDUCTION_PRESETS[0];

  let nodes = $state.raw(nodesOf(FIRST));
  let edges = $state.raw(edgesOf(FIRST));
  let k = $state(FIRST.k);
  let kText = $state(String(FIRST.k));
  let cert = $state.raw(FIRST.cert);
  let preset = $state(FIRST.key);
  let notice = $state({ text: '', at: -1 });

  const build = () => reductionTrace({ ids: nodes.map((n) => n.id), edges, k, cert: cert.slice() });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, names));

  let built = graphShape(nodesOf(FIRST), edgesOf(FIRST), false);

  /** Rebuilds the trace; `verify` jumps to where the verifier starts. @param {boolean} verify */
  function rebuild(verify = false) {
    notice = { text: '', at: -1 };
    built = graphShape(nodes, edges, false);
    player.load(build());
    if (verify) player.seek(player.frames.findIndex((f) => f.kind === 'mapped') + 1);
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    if (graphShape(nodes, edges, false) === built) return;
    const ids = new Set(nodes.map((n) => n.id));
    cert = cert.filter((id) => ids.has(id));
    if (k > nodes.length) {
      k = Math.max(1, nodes.length);
      kText = String(k);
    }
    preset = '';
    rebuild();
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = REDUCTION_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    nodes = nodesOf(p);
    edges = edgesOf(p);
    k = p.k;
    kText = String(p.k);
    cert = p.cert;
    rebuild();
  }

  function commitK() {
    const t = kText.trim();
    const next = /^\d+$/.test(t) ? Number(t) : NaN;
    if (!(next >= 1 && next <= nodes.length)) {
      kText = String(k);
      notice = { text: m.kError(nodes.length), at: player.index };
      return;
    }
    kText = String(next);
    if (next === k) return;
    k = next;
    preset = '';
    rebuild();
  }

  /** @param {number} id */
  function toggleCert(id) {
    cert = cert.includes(id) ? cert.filter((x) => x !== id) : [...cert, id];
    preset = '';
    rebuild(true);
  }

  const certSet = $derived(new Set(frame.cert));
  const pairSet = $derived(new Set(frame.pair ?? []));
  /** @param {[number, number][]} list */
  const keys = (list) => new Set(list.map(([u, v]) => `${u}-${v}`));
  const checkedKeys = $derived(keys(frame.checked));
  const pairKey = $derived(frame.pair ? `${frame.pair[0]}-${frame.pair[1]}` : '');
  const lastAdded = $derived(
    frame.kind === 'add' && frame.built.length ? frame.built[frame.built.length - 1] : null,
  );

  /** @param {GraphEdge} e */
  function edgeKey(e) {
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    return `${Math.min(a, b)}-${Math.max(a, b)}`;
  }

  /** @param {number} id @returns {VisualState} */
  function nodeState(id) {
    const i = order.indexOf(id);
    if (pairSet.has(i)) return 'active';
    if (certSet.has(i) && frame.mapped) return 'frontier';
    return '';
  }

  /** @param {number} id */
  function stateName(id) {
    const i = order.indexOf(id);
    const parts = [];
    if (pairSet.has(i)) parts.push(m.states.pair);
    if (certSet.has(i)) parts.push(m.states.cert);
    return parts.join(', ');
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function gEdgeState(e) {
    const key = edgeKey(e);
    if (key === pairKey) return 'active';
    if (checkedKeys.has(key)) return 'sorted';
    return '';
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function hEdgeState(e) {
    const key = edgeKey(e);
    if (lastAdded && key === `${lastAdded[0]}-${lastAdded[1]}`) return 'active';
    return 'visited';
  }

  const hEdges = $derived(frame.built.map(([u, v]) => ({ from: order[u], to: order[v] })));
  const yes = $derived(frame.largest >= frame.k);
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
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each REDUCTION_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.certLabel}
      </legend>
      <div class="flex flex-wrap gap-2">
        {#each order as id, i (id)}
          <button
            type="button"
            class="btn-outline min-w-10 font-mono"
            aria-pressed={cert.includes(id)}
            aria-label={m.certAria(names[i], cert.includes(id))}
            onclick={() => toggleCert(id)}>{m.certButton(names[i], cert.includes(id))}</button
          >
        {/each}
      </div>
    </fieldset>
  </form>
  <p class="mb-4 text-xs text-slate-600">{m.certNote}</p>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="grid gap-4 xl:grid-cols-2">
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.graphTitle}
          </h2>
          <p class="mb-2 text-sm text-slate-700">{m.cliqueQuestion(frame.k)}</p>
          <GraphCanvas
            bind:nodes
            bind:edges
            ariaLabel={m.graphAria}
            editable
            maxNodes={MAX_NODES}
            {nodeState}
            edgeState={gEdgeState}
            markerOf={(id) => (certSet.has(order.indexOf(id)) ? m.markers.cert : '')}
            labelOf={(n) => m.vertexLabel(n.label ?? letter(n.id), stateName(n.id))}
            onchange={onGraphChange}
            speed={player.speed}
          />
        </div>
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.complementTitle}
          </h2>
          <p class="mb-2 text-sm text-slate-700">{m.indepQuestion(frame.k)}</p>
          <GraphCanvas
            nodes={nodes.map((n) => ({ ...n }))}
            edges={hEdges}
            ariaLabel={m.complementAria}
            {nodeState}
            edgeState={hEdgeState}
            markerOf={(id) => (certSet.has(order.indexOf(id)) ? m.markers.cert : '')}
            labelOf={(n) => m.vertexLabel(n.label ?? letter(n.id), stateName(n.id))}
            speed={player.speed}
          />
        </div>
      </div>
      <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <li class="flex items-center gap-1.5">
          <span class="size-3 rounded-sm bg-state-active"></span>{m.legend.pair}
        </li>
        <li class="flex items-center gap-1.5">
          <span class="size-3 rounded-sm bg-state-frontier"></span>{m.legend.cert}
        </li>
        <li class="flex items-center gap-1.5">
          <span class="h-1 w-3 rounded-sm bg-state-sorted"></span>{m.legend.checked}
        </li>
        <li class="flex items-center gap-1.5">
          <span class="h-1 w-3 rounded-sm bg-state-visited"></span>{m.legend.added}
        </li>
      </ul>

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
          <dt class="text-xs text-slate-500">{m.stats.mapSteps}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="map-steps">
            {frame.mapSteps}
          </dd>
          <dd class="text-xs text-slate-600">{m.mapNote((frame.n * (frame.n - 1)) / 2)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="checks">{frame.checks}</dd>
          <dd class="text-xs text-slate-600" data-testid="verdict">{m.verdict(frame)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.subsets}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="subsets">{frame.subsets}</dd>
          <dd class="text-xs text-slate-600">{m.subsetNote(frame.n, frame.k)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer}</dt>
          <dd class="text-lg font-bold" data-testid="answer">
            {m.answer(yes, names, frame.witness)}
          </dd>
        </div>
      </dl>
      <CodePanel lines={reductionPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
