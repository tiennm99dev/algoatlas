<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_N,
    MAX_TARGET,
    MAX_VALUE,
    SEARCH_PRESETS,
    fullTreeSize,
    parseTarget,
    parseValues,
    searchPseudocode,
    searchTrace,
  } from '$lib/algo-engine/backtracking-search-tree.js';
  import { en as m } from '$lib/lessons/backtracking-search-tree/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/backtracking-search-tree.js').PruneMode} PruneMode */
  /** @typedef {import('$lib/algo-engine/backtracking-search-tree.js').SearchNode} SearchNode */
  /** @typedef {import('$lib/algo-engine/backtracking-search-tree.js').TreeStatus} TreeStatus */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PRUNES = /** @type {PruneMode[]} */ (['off', 'over', 'both']);
  const FIRST = SEARCH_PRESETS[0];

  let mode = $state(/** @type {PruneMode} */ ('both'));
  let values = $state(FIRST.values);
  let target = $state(FIRST.target);
  let preset = $state(FIRST.key);
  let valuesText = $state(FIRST.values.join(', '));
  let targetText = $state(String(FIRST.target));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(searchTrace(FIRST.values, FIRST.target, 'both'));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(searchTrace($state.snapshot(values), target, mode));
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = SEARCH_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    values = p.values;
    target = p.target;
    valuesText = p.values.join(', ');
    targetText = String(p.target);
    rebuild();
  }

  function commitValues() {
    const next = parseValues(valuesText);
    if (next === null) {
      valuesText = values.join(', ');
      notice = { text: m.numbersError(MAX_N, MAX_VALUE), at: player.index };
      return;
    }
    valuesText = next.join(', ');
    if (next.join() === values.join()) return;
    values = next;
    preset = '';
    rebuild();
  }

  function commitTarget() {
    const next = parseTarget(targetText);
    if (next === null) {
      targetText = String(target);
      notice = { text: m.targetError(MAX_TARGET), at: player.index };
      return;
    }
    targetText = String(next);
    if (next === target) return;
    target = next;
    preset = '';
    rebuild();
  }

  /** @param {string | number} id */
  function seekNode(id) {
    const at = player.frames.findIndex((f) => f.nodes.some((n) => n.id === id));
    if (at < 0) return;
    player.pause();
    player.seek(at);
  }

  /** @type {Record<TreeStatus, VisualState>} */
  const STATUS_STATE = {
    active: 'active',
    open: 'path',
    finished: 'visited',
    pruned: '',
    found: 'sorted',
    dead: 'visited',
  };

  /** @param {SearchNode} n */
  const markOf = (n) =>
    n.status === 'pruned' || n.status === 'found' || n.status === 'dead' ? m.markers[n.status] : '';

  /** @param {SearchNode[]} nodes @param {number[]} numbers @returns {TreeNode[]} */
  function forest(nodes, numbers) {
    // A node's id is its index, so the array finds a parent directly.
    /** @type {TreeNode[]} */
    const built = nodes.map((n) => ({
      id: n.id,
      label: String(n.sum),
      children: [null, null],
      state: STATUS_STATE[n.status],
      marker: markOf(n),
      edgeLabel: n.parent < 0 ? '' : n.took ? `+${numbers[n.depth - 1]}` : '+0',
    }));
    for (const n of nodes) {
      const kids = built[n.parent]?.children;
      if (kids) kids[n.took ? 0 : 1] = built[n.id];
    }
    return built.slice(0, 1);
  }

  const roots = $derived(forest(frame.nodes, frame.values));
  const nodeById = $derived(new Map(frame.nodes.map((n) => [n.id, n])));
  const chosenSet = $derived(new Set(frame.chosen));
  const deciding = $derived(frame.kind === 'done' ? frame.values.length : frame.depth);

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', m.legend.active],
    ['path', m.legend.open],
    ['visited', m.legend.finished],
    ['sorted', `${m.markers.found} ${m.legend.found}`],
    ['', `${m.markers.pruned} ${m.legend.pruned}`],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
      commitTarget();
    }}
  >
    <SegmentedControl
      legend={m.pruneLabel}
      name="prune"
      options={PRUNES.map((v) => ({ value: v, label: m.prunes[v] }))}
      bind:value={mode}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.numbersLabel}
      <input
        type="text"
        name="numbers"
        class="field w-40 font-mono"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.targetLabel}
      <input
        type="text"
        inputmode="numeric"
        name="target"
        class="field w-20 font-mono"
        bind:value={targetText}
        onchange={commitTarget}
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
        {#each SEARCH_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-sm text-slate-700">{m.problem(frame.target)}</p>
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.numbersTitle}
        </h2>
        <ArrayStrip
          values={frame.values}
          ariaLabel={m.numbersAria}
          stateOf={(i) => (chosenSet.has(i) ? 'path' : '')}
          markerOf={(i) => (chosenSet.has(i) ? m.chosenMark : '')}
          labelOf={(i) => m.numberCell(i, frame.values[i], chosenSet.has(i))}
          pointers={[{ name: m.pointer, index: deciding }]}
          speed={player.speed}
        />
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">{m.treeTitle}</h2>
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeAria}
          labelOf={(node) => {
            const n = nodeById.get(/** @type {number} */ (node.id));
            return n ? m.nodeLabel(n) : node.label;
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
          <dt class="text-xs text-slate-500">{m.stats.visited}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="visited">
            {frame.visited} / {fullTreeSize(frame.values.length)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pruned}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="pruned">{frame.pruned}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.sum}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="sum">
            {frame.sum} / {frame.target}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.solutions}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="solutions">
            {frame.solutions.length}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.chosenTitle}
        emptyText={m.chosenEmpty}
        items={frame.chosen.map((at) => ({ label: String(frame.values[at]) }))}
      />
      <ChipList
        title={m.solutionsTitle}
        emptyText={m.solutionsEmpty}
        items={frame.solutions.map((s) => ({ label: m.solution(s) }))}
      />
      <CodePanel lines={searchPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
