<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_BOUND_N,
    N_ITEMS,
    allRankings,
    decisionTree,
    lowerBound,
    orderOf,
    ranksOf,
    treeNodes,
    treeStats,
    walkPseudocode,
    walkTrace,
  } from '$lib/algo-engine/comparison-sort-lower-bound.js';
  import { en as m } from '$lib/lessons/comparison-sort-lower-bound/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/comparison-sort-lower-bound.js').TreeAlgo} TreeAlgo */
  /** @typedef {import('$lib/algo-engine/comparison-sort-lower-bound.js').DecisionNode} DecisionNode */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const ALGOS = /** @type {TreeAlgo[]} */ (['insertion', 'selection']);
  const TREES = { insertion: decisionTree('insertion'), selection: decisionTree('selection') };
  const STATS = { insertion: treeStats(TREES.insertion), selection: treeStats(TREES.selection) };
  // Orders are keyed by their letters, smallest first: 'CAB' means C < A < B.
  const ORDERS = allRankings(N_ITEMS).map((r) => orderOf(r));
  /** @param {number[]} order */
  const keyOf = (order) => order.map((i) => 'ABC'[i]).join('');

  let algo = $state(/** @type {TreeAlgo} */ ('insertion'));
  // A fixed first order keeps the prerendered HTML and the hydrated page identical.
  let orderKey = $state('CAB');
  let boundN = $state(10);
  /** @type {number | null} */
  let boundDraft = $state(10);
  let notice = $state({ text: '', at: -1 });

  /** @param {string} key */
  const ranksFor = (key) => ranksOf(/** @type {number[]} */ (ORDERS.find((o) => keyOf(o) === key)));

  const player = createPlayer(walkTrace(TREES.insertion, ranksFor('CAB')));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const stats = $derived(STATS[algo]);
  const bound = $derived(lowerBound(boundN));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(walkTrace(TREES[algo], ranksFor(orderKey)));
  }

  function commitBound() {
    const v = boundDraft;
    if (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= MAX_BOUND_N) {
      boundN = v;
    } else {
      boundDraft = boundN;
      say(m.boundError);
    }
  }

  /** @param {string | number} id */
  function pickNode(id) {
    const node = treeNodes(TREES[algo]).find((d) => `n${d.id}` === id);
    if (!node) return;
    if (node.kind === 'impossible') return say(m.impossibleNotice);
    if (node.kind !== 'leaf' || !node.order) return say(m.notLeafNotice);
    orderKey = keyOf(node.order);
    rebuild();
    say(m.pickedNotice(m.chain(node.order)));
  }

  /** @param {DecisionNode} d @returns {VisualState} */
  function stateOf(d) {
    if (d.id === frame.nodeId) return frame.kind === 'done' ? 'sorted' : 'active';
    if (frame.path.includes(d.id)) return 'path';
    if (d.kind === 'impossible') return 'visited';
    return '';
  }

  /** @param {DecisionNode} d */
  function markerOf(d) {
    if (d.id === frame.nodeId) return frame.kind === 'done' ? m.markers.found : m.markers.current;
    return d.kind === 'impossible' ? m.markers.impossible : '';
  }

  /** @param {DecisionNode} d @param {string} edgeLabel @returns {TreeNode} */
  function toTreeNode(d, edgeLabel) {
    return {
      id: `n${d.id}`,
      label:
        d.kind === 'compare' && d.pair
          ? `${'ABC'[d.pair[0]]}<${'ABC'[d.pair[1]]}`
          : d.kind === 'leaf' && d.order
            ? keyOf(d.order)
            : m.impossibleLabel,
      state: stateOf(d),
      marker: markerOf(d),
      note: d.kind === 'compare' ? String(d.possible) : undefined,
      edgeLabel,
      children:
        d.kind === 'compare'
          ? [d.yes ? toTreeNode(d.yes, m.yes) : null, d.no ? toTreeNode(d.no, m.no) : null]
          : [],
    };
  }

  const roots = $derived([toTreeNode(TREES[algo], '')]);
  const byId = $derived(new Map(treeNodes(TREES[algo]).map((d) => [`n${d.id}`, d])));

  /** @param {TreeNode} node */
  function labelOf(node) {
    const d = /** @type {DecisionNode} */ (byId.get(String(node.id)));
    const s = stateOf(d);
    const role =
      s === 'active'
        ? m.roles.current
        : s === 'sorted'
          ? m.roles.found
          : s === 'path'
            ? m.roles.path
            : '';
    return m.nodeAria(d, role);
  }

  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['active', m.markers.current, m.legend.current],
    ['path', '', m.legend.path],
    ['sorted', m.markers.found, m.legend.found],
    ['visited', m.markers.impossible, m.legend.impossible],
  ]);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.algorithmLabel}
      name="algo"
      options={ALGOS.map((a) => ({ value: a, label: m.algorithms[a] }))}
      bind:value={algo}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.orderLabel}
      <select class="field" name="order" bind:value={orderKey} onchange={rebuild}>
        {#each ORDERS as o (keyOf(o))}
          <option value={keyOf(o)}>{m.chain(o)}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeAria(m.algorithms[algo], stats.leaves, stats.height)}
          {labelOf}
          onselect={pickNode}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-500">{m.treeNote}</p>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {marker}
              {label}
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
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.possible}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.possible}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.height}</dt>
          <dd class="text-2xl font-bold tabular-nums">{stats.height}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.leaves}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {m.leavesValue(stats.leaves, stats.impossible)}
          </dd>
        </div>
      </dl>

      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="mb-2 text-xs text-slate-500">{m.boundTitle}</h2>
        <label class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          {m.boundN} =
          <input
            type="number"
            name="bound-n"
            min="1"
            max={MAX_BOUND_N}
            step="1"
            class="field w-20"
            bind:value={boundDraft}
            onchange={commitBound}
          />
        </label>
        <dl class="space-y-1 tabular-nums">
          <div class="flex flex-wrap justify-between gap-x-2">
            <dt class="text-slate-600">{m.boundRows.orders}</dt>
            <dd class="break-all">{m.bigNumber(bound.factorial)}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-slate-600">{m.boundRows.log}</dt>
            <dd>{m.decimal(bound.log2)}</dd>
          </div>
          <div class="flex justify-between gap-2 font-semibold text-slate-900">
            <dt>{m.boundRows.bound}</dt>
            <dd>{bound.bound}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-slate-600">{m.boundRows.nlogn}</dt>
            <dd>{m.decimal(bound.nLogN)}</dd>
          </div>
        </dl>
      </section>

      <CodePanel lines={walkPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
