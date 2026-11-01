<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import { MAX_N, fibPseudocode, fibTrace } from '$lib/algo-engine/memoization-tabulation.js';
  import { en as m } from '$lib/lessons/memoization-tabulation/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/memoization-tabulation.js').FibMode} FibMode */
  /** @typedef {import('$lib/algo-engine/memoization-tabulation.js').FibCall} FibCall */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'active'|'waiting'|'returned'|'cached'} CallStatus */

  const MODES = /** @type {FibMode[]} */ (['plain', 'memo', 'table']);

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_N = 5;
  let mode = $state(/** @type {FibMode} */ ('plain'));
  let n = $state(INITIAL_N);
  /** @type {number | null} */
  let draft = $state(INITIAL_N);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(fibTrace('plain', INITIAL_N));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(fibTrace(mode, n));
  }

  function commitN() {
    const v = draft;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > MAX_N) {
      draft = n;
      notice = { text: m.nError(MAX_N), at: player.index };
      return;
    }
    n = v;
    rebuild();
  }

  const onStack = $derived(new Set(frame.stack));

  /** @param {FibCall} c @returns {CallStatus} */
  function statusOf(c) {
    if (c.id === frame.current) return 'active';
    if (onStack.has(c.id)) return 'waiting';
    return c.cached ? 'cached' : 'returned';
  }

  /** @type {Record<CallStatus, VisualState>} */
  const STATE = { active: 'active', waiting: 'frontier', returned: 'visited', cached: 'sorted' };

  const roots = $derived.by(() => {
    /** @type {Record<number, TreeNode & {children: TreeNode[]}>} */
    const byId = {};
    /** @type {TreeNode[]} */
    const top = [];
    for (const c of frame.calls) {
      const s = statusOf(c);
      const node = {
        id: c.id,
        label: String(c.n),
        note: c.result === null ? '' : `= ${c.result}`,
        state: STATE[s],
        marker: m.markers[s],
        children: /** @type {TreeNode[]} */ ([]),
      };
      byId[c.id] = node;
      if (c.parent === null) top.push(node);
      else byId[c.parent]?.children.push(node);
    }
    return top;
  });

  /** @param {TreeNode} node */
  function nodeLabel(node) {
    const c = frame.calls[Number(node.id)];
    return m.nodeAria(c.n, c.result, statusOf(c));
  }

  const writing = $derived(['base', 'return', 'fill'].includes(frame.kind) && frame.cell >= 0);
  const readSet = $derived(new Set(frame.kind === 'hit' ? [frame.cell] : frame.reads));

  /** @param {number} c @returns {'write'|'read'|'answer'|''} */
  function storedRole(c) {
    if (frame.kind === 'done' && c === frame.n && frame.table[c] !== null) return 'answer';
    if (writing && c === frame.cell) return 'write';
    if (frame.kind === 'base' && frame.mode === 'table' && c <= 1) return 'write';
    if (readSet.has(c)) return 'read';
    return '';
  }

  /** @type {Record<'write'|'read'|'answer'|'', VisualState>} */
  const ROLE_STATE = { write: 'swap', read: 'compare', answer: 'sorted', '': '' };

  /** @param {number} r @param {number} c @returns {VisualState} */
  function cellState(r, c) {
    if (r === 0) return ROLE_STATE[storedRole(c)];
    return frame.computed[c] > 1 ? 'visited' : '';
  }

  /** @param {number} r @param {number} c */
  function cellMarker(r, c) {
    if (r === 0) {
      const role = storedRole(c);
      return role ? m.cellMarkers[role] : '';
    }
    return frame.computed[c] > 1 ? m.cellMarkers.repeat : '';
  }

  /** @param {number} r @param {number} c */
  function cellLabel(r, c) {
    if (r === 1) return m.computedCell(c, frame.computed[c]);
    const role = storedRole(c);
    return m.storedCell(frame.mode, c, frame.table[c], role ? m.cellStates[role] : '');
  }

  const tableValues = $derived([frame.table, frame.computed]);
  const colHeaders = $derived(frame.table.map((_, k) => String(k)));

  const treeLegend = $derived(
    /** @type {[VisualState, string][]} */ ([
      ['active', `${m.markers.active} ${m.legend.active}`],
      ['frontier', `${m.markers.waiting} ${m.legend.waiting}`],
      ['visited', `${m.markers.returned} ${m.legend.returned}`],
      ...(frame.mode === 'memo' ? [['sorted', `${m.markers.cached} ${m.legend.cached}`]] : []),
    ]),
  );
  const cellLegend = /** @type {[VisualState, string][]} */ ([
    ['swap', `${m.cellMarkers.write} ${m.cellLegend.write}`],
    ['compare', `${m.cellMarkers.read} ${m.cellLegend.read}`],
    ['sorted', `${m.cellMarkers.answer} ${m.cellLegend.answer}`],
    ['visited', `${m.cellMarkers.repeat} ${m.cellLegend.repeat}`],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitN();
    }}
  >
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={MODES.map((v) => ({ value: v, label: m.modes[v] }))}
      bind:value={mode}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.nLabel}
      <input
        type="number"
        name="n"
        min="0"
        max={MAX_N}
        step="1"
        class="field w-24"
        bind:value={draft}
        onchange={commitN}
      />
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        {#if frame.mode === 'table'}
          <p class="text-sm text-slate-600" data-testid="no-tree">{m.tableTreeText}</p>
        {:else}
          <TreeView
            {roots}
            ariaLabel={m.treeAria(frame.n, frame.callCount)}
            labelOf={nodeLabel}
            emptyText={m.treeEmpty}
            speed={player.speed}
          />
          <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each treeLegend as [st, label] (st)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"
                ></span>{label}
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <DpTable
          values={tableValues}
          ariaLabel={m.tableAria}
          rowHeaders={[m.rowStored(frame.mode), m.rowComputed]}
          {colHeaders}
          stateOf={cellState}
          markerOf={cellMarker}
          labelOf={cellLabel}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.tableNote(frame.mode)}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each cellLegend as [st, label] (st)}
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
          <dt class="text-xs text-slate-500">{m.stats.calls}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="calls">{frame.callCount}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.additions}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="additions">
            {frame.additions}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.hits}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="hits">{frame.hits}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="result">
            {frame.result ?? m.resultPending}
          </dd>
        </div>
      </dl>
      <CodePanel lines={fibPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
