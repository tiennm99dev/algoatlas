<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_NODES,
    addLeaf,
    childrenOf,
    depthsOf,
    removeSubtree,
  } from '$lib/algo-engine/rooted-tree.js';
  import {
    PRESETS,
    eulerLca,
    liftingPseudocode,
    liftingTrace,
    makeLiftPreset,
    pathUp,
    queryStart,
  } from '$lib/algo-engine/lca-binary-lifting.js';
  import { vi as m } from '$lib/lessons/lca-binary-lifting/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/lca-binary-lifting.js').RootedTree} RootedTree */
  /** @typedef {import('$lib/algo-engine/lca-binary-lifting.js').LiftPreset} LiftPreset */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {{ tree: RootedTree, u: number, v: number }} Setup */

  // A fixed first tree keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makeLiftPreset('family');
  /** @type {RootedTree} */
  let tree = $state.raw(INITIAL.tree);
  let qu = $state(INITIAL.u);
  let qv = $state(INITIAL.v);
  /** @type {Setup[]} */
  let history = $state.raw([]);
  let selected = $state(0);
  let preset = $state('family');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(liftingTrace(INITIAL.tree, INITIAL.u, INITIAL.v));
  const frame = $derived(player.frame);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, tree.labels),
  );
  const kids = $derived(childrenOf(tree.parent));
  // Where u and v started once the deeper one is called u.
  const level = $derived(player.frames.find((f) => f.kind === 'level'));
  const euler = $derived(eulerLca(tree.parent, qu, qv));
  const depth = $derived(depthsOf(tree.parent));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** Rebuilds the trace; edits open on the query, the table already built. @param {boolean} [toQuery] */
  function run(toQuery = true) {
    notice = { text: '', at: -1 };
    const frames = liftingTrace(tree, qu, qv);
    player.load(frames);
    if (toQuery) player.seek(queryStart(frames));
  }

  /** @param {Setup} next */
  function apply(next) {
    tree = next.tree;
    qu = next.u;
    qv = next.v;
    run();
  }

  /** @param {Setup} next */
  function edit(next) {
    history = [...history, { tree, u: qu, v: qv }];
    preset = '';
    apply(next);
  }

  function add() {
    const next = addLeaf(tree, selected);
    if (!next) return say(m.errors.full(MAX_NODES));
    edit({ tree: next, u: qu, v: qv });
    selected = next.parent.length - 1;
  }

  function remove() {
    if (selected === 0) return say(m.errors.root);
    const parentLabel = tree.labels[tree.parent[selected]];
    const { tree: next, keep } = removeSubtree(tree, selected);
    // A query node that went with the subtree falls back to its nearest kept ancestor.
    /** @param {number} x */
    const mapped = (x) => {
      let y = x;
      while (!keep.includes(y)) y = tree.parent[y];
      return keep.indexOf(y);
    };
    edit({ tree: next, u: mapped(qu), v: mapped(qv) });
    selected = Math.max(0, next.labels.indexOf(parentLabel));
  }

  function undo() {
    if (history.length === 0) return;
    const prev = /** @type {Setup} */ (history.at(-1));
    history = history.slice(0, -1);
    preset = '';
    apply(prev);
    if (selected >= prev.tree.labels.length) selected = 0;
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {LiftPreset} */ (e.currentTarget.value);
    history = [...history, { tree, u: qu, v: qv }];
    const next = makeLiftPreset(picked, Math.random);
    tree = next.tree;
    qu = next.u;
    qv = next.v;
    selected = 0;
    run(false);
    // A random tree is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {'u'|'v'} which @param {Event & {currentTarget: HTMLSelectElement}} e */
  function pickNode(which, e) {
    const x = Number(e.currentTarget.value);
    history = [...history, { tree, u: qu, v: qv }];
    if (which === 'u') qu = x;
    else qv = x;
    run();
  }

  const querying = $derived(frame.u >= 0);
  const climbed = $derived.by(() => {
    if (!level || !querying || frame.kind === 'query') return new Set();
    return new Set([
      ...pathUp(tree.parent, level.u, frame.u),
      ...pathUp(tree.parent, level.v, frame.v),
    ]);
  });
  const answerPath = $derived(
    frame.kind === 'done' && level
      ? new Set([
          ...pathUp(tree.parent, level.u, frame.answer),
          ...pathUp(tree.parent, level.v, frame.answer),
        ])
      : new Set(),
  );

  /** @param {number} x @returns {{ state: VisualState, marker: string, spoken: string }} */
  function look(x) {
    const f = frame;
    const none = { state: /** @type {VisualState} */ (''), marker: '', spoken: '' };
    if (f.kind === 'fill') {
      const to = f.up[f.k][f.node];
      if (x === f.node)
        return { state: 'active', marker: m.markers.active, spoken: m.states.filling };
      if (x === to)
        return { state: 'compare', marker: m.markers.compare, spoken: m.states.landing };
      if (x === f.mid)
        return { state: 'frontier', marker: m.markers.frontier, spoken: m.states.halfway };
      return none;
    }
    if (!querying) return none;
    if (f.kind === 'done') {
      if (x === f.answer) return { state: 'path', marker: m.markers.path, spoken: m.states.lca };
      return answerPath.has(x) ? { state: 'path', marker: '', spoken: m.states.path } : none;
    }
    if (x === f.answer) return { state: 'sorted', marker: m.markers.sorted, spoken: m.states.lca };
    if (x === f.u && x === f.v) return { state: 'active', marker: 'u=v', spoken: m.states.both };
    if (x === f.u) return { state: 'active', marker: 'u', spoken: m.states.u };
    if (x === f.v) return { state: 'active', marker: 'v', spoken: m.states.v };
    if (f.kind === 'hold' && x === f.up[f.k][f.u])
      return { state: 'frontier', marker: m.markers.frontier, spoken: m.states.candidate };
    if (climbed.has(x)) return { state: 'visited', marker: '', spoken: m.states.climbed };
    return none;
  }

  /** @param {number} x @returns {TreeNode} */
  function build(x) {
    const l = look(x);
    return {
      id: x,
      label: tree.labels[x],
      state: l.state,
      marker: l.marker,
      note: m.note(frame.depth[x]) || undefined,
      children: kids[x].map(build),
    };
  }
  const roots = $derived(frame.depth.length === tree.labels.length ? [build(0)] : []);

  /** @param {TreeNode} node */
  const nodeLabel = (node) => {
    const x = Number(node.id);
    return m.nodeLabel(node.label, frame.depth[x], look(x).spoken);
  };

  const cells = $derived(
    frame.up.map((row) => row.map((t) => (t === null ? null : tree.labels[t]))),
  );
  /** Cells the current step reads. */
  const reads = $derived.by(() => {
    const f = frame;
    /** @type {[number, number][]} */
    const out = [];
    if (f.kind === 'fill') out.push([f.k - 1, f.node], [f.k - 1, f.mid]);
    if (f.kind === 'lift') out.push([f.k, f.from]);
    if (f.kind === 'jump') out.push([f.k, f.from], [f.k, f.fromV]);
    if (f.kind === 'hold') out.push([f.k, f.u], [f.k, f.v]);
    if (f.kind === 'answer') out.push([0, f.u]);
    return out;
  });
  /** @param {number} r @param {number} c @returns {VisualState} */
  function cellState(r, c) {
    if (frame.kind === 'fill' && r === frame.k && c === frame.node) return 'active';
    if (frame.kind === 'base' && r === 0) return 'active';
    return reads.some(([a, b]) => a === r && b === c) ? 'compare' : '';
  }
  const arrows = $derived(
    frame.kind === 'fill'
      ? reads.map(([r, c]) => ({
          from: /** @type {[number, number]} */ ([r, c]),
          to: /** @type {[number, number]} */ ([frame.k, frame.node]),
        }))
      : [],
  );

  const stats = $derived([
    [m.stats.lca, frame.answer >= 0 ? tree.labels[frame.answer] : m.notYet, 'lca'],
    [m.stats.d, frame.d >= 0 ? String(frame.d) : m.notYet, 'd'],
    [m.stats.cells, String(frame.cells), 'cells'],
    [m.stats.reads, String(frame.reads), 'reads'],
  ]);

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', m.legend.active],
    ['frontier', m.legend.frontier],
    ['compare', m.legend.compare],
    ['visited', m.legend.visited],
    ['sorted', m.legend.sorted],
    ['path', m.legend.path],
  ]);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.uLabel}
      <select name="u" class="field" value={String(qu)} onchange={(e) => pickNode('u', e)}>
        {#each tree.labels as label, x (label)}
          <option value={String(x)}>{label}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.vLabel}
      <select name="v" class="field" value={String(qv)} onchange={(e) => pickNode('v', e)}>
        {#each tree.labels as label, x (label)}
          <option value={String(x)}>{label}</option>
        {/each}
      </select>
    </label>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="btn-primary" onclick={add}>{m.addChild}</button>
      <button type="button" class="btn-outline" onclick={remove}>{m.remove}</button>
    </div>
    <!-- aria-disabled rather than disabled so keyboard focus stays on the button when history empties. -->
    <button type="button" class="btn-outline" onclick={undo} aria-disabled={history.length === 0}
      >{m.undo}</button
    >
    <p class="text-sm text-slate-600" data-testid="selected">
      {m.selectedText(tree.labels[selected])}
    </p>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <TreeView
          {roots}
          ariaLabel={m.treeAria(tree.labels.length)}
          labelOf={nodeLabel}
          onselect={(id) => (selected = Number(id))}
          {selected}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-full border-2 border-teal-700 bg-white"></span>{m.legend
              .selected}
          </li>
        </ul>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <DpTable
          values={cells}
          ariaLabel={m.tableAria}
          rowHeaders={frame.up.map((_, k) => m.rowHeader(k))}
          colHeaders={tree.labels}
          stateOf={cellState}
          labelOf={(k, c) => m.cellLabel(k, tree.labels[c], cells[k]?.[c] ?? null)}
          {arrows}
          speed={player.speed}
        />
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
        {#each stats as [label, value, id] (id)}
          <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <CodePanel lines={liftingPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div
      class="min-w-0 rounded-xl border border-slate-200 bg-white p-4 lg:col-start-1 lg:row-start-3"
    >
      <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.eulerTitle}
      </h2>
      <ArrayStrip
        values={euler.tour.map((x) => tree.labels[x])}
        ariaLabel={m.eulerAria}
        stateOf={(i) =>
          i === euler.at ? 'sorted' : i >= euler.lo && i <= euler.hi ? 'compare' : ''}
        markerOf={(i) => (i === euler.at ? m.markers.sorted : '')}
        labelOf={(i) => m.eulerCell(tree.labels[euler.tour[i]], depth[euler.tour[i]])}
        dimmed={(i) => i < euler.lo || i > euler.hi}
        windows={[{ from: euler.lo, to: euler.hi + 1, label: m.eulerWindow }]}
        speed={player.speed}
      />
      <p class="mt-2 text-sm text-slate-700" data-testid="euler">
        {m.eulerNote(
          tree.labels[qu],
          tree.labels[qv],
          tree.labels[euler.node],
          depth[euler.node],
          euler.tour.length,
        )}
      </p>
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
