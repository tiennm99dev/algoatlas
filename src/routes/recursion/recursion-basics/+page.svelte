<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_N,
    STACK_LIMIT,
    recursionPseudocode,
    recursionTrace,
    withoutBaseCase,
  } from '$lib/algo-engine/recursion-basics.js';
  import { en as m } from '$lib/lessons/recursion-basics/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/recursion-basics.js').RecursionFn} RecursionFn */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'active'|'waiting'|'returned'|'lost'} CallStatus */

  const FNS = /** @type {RecursionFn[]} */ (['fact', 'fib']);

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_N = 4;
  let fn = $state(/** @type {RecursionFn} */ ('fact'));
  let n = $state(INITIAL_N);
  /** @type {number | null} */
  let draft = $state(INITIAL_N);
  let withBase = $state(true);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(recursionTrace('fact', INITIAL_N));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(recursionTrace(fn, n, withBase));
  }

  function changeFn() {
    // Fibonacci allows a smaller n; keep the value when it still fits.
    n = Math.min(n, MAX_N[fn]);
    draft = n;
    rebuild();
  }

  function commitN() {
    const v = draft;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > MAX_N[fn]) {
      draft = n;
      say(m.nError(fn, MAX_N[fn]));
      return;
    }
    n = v;
    rebuild();
  }

  function toggleBase() {
    rebuild();
    say(m.baseNotice(withBase));
  }

  const pseudocode = $derived(
    withBase ? recursionPseudocode[fn] : withoutBaseCase(recursionPseudocode[fn]),
  );

  const onStack = $derived(new Set(frame.stack.map((r) => r.id)));

  /** @param {{id: number, result: number|null}} c @returns {CallStatus} */
  function statusOf(c) {
    if (c.id === frame.current) return 'active';
    if (onStack.has(c.id)) return 'waiting';
    return c.result === null ? 'lost' : 'returned';
  }

  /** @type {Record<CallStatus, VisualState>} */
  const STATE = { active: 'active', waiting: 'frontier', returned: 'visited', lost: 'swap' };
  /** @type {Record<CallStatus, string>} */
  const MARK = {
    active: m.markers.active,
    waiting: m.markers.waiting,
    returned: m.markers.returned,
    lost: m.markers.lost,
  };

  const roots = $derived.by(() => {
    /** @type {Record<number, TreeNode & {children: TreeNode[]}>} */
    const byId = {};
    /** @type {TreeNode[]} */
    const top = [];
    for (const c of frame.calls) {
      const s = statusOf(c);
      const node = {
        id: c.id,
        label: String(c.n).replace('-', '−'),
        note: c.result === null ? '' : `= ${c.result}`,
        state: STATE[s],
        marker: MARK[s],
        children: /** @type {TreeNode[]} */ ([]),
      };
      byId[c.id] = node;
      if (c.parent === null) top.push(node);
      else byId[c.parent]?.children.push(node);
    }
    return top;
  });

  /** @type {Record<number, {n: number, result: number|null}>} */
  const callById = $derived(Object.fromEntries(frame.calls.map((c) => [c.id, c])));

  /** @param {TreeNode} node */
  function nodeLabel(node) {
    const c = callById[Number(node.id)];
    const s = statusOf({ id: Number(node.id), result: c.result });
    return m.nodeAria(fn, c.n, c.result, s);
  }

  const stackRows = $derived(frame.stack.slice().reverse());

  const legend = $derived(
    /** @type {[VisualState, string][]} */ ([
      ['active', `${m.markers.active} ${m.legend.active}`],
      ['frontier', `${m.markers.waiting} ${m.legend.waiting}`],
      ['visited', `${m.markers.returned} ${m.legend.returned}`],
      ...(frame.overflow ? [['swap', `${m.markers.lost} ${m.legend.lost}`]] : []),
    ]),
  );

  const result = $derived(
    frame.kind !== 'done'
      ? m.resultPending
      : frame.result === null
        ? m.resultOverflow
        : String(frame.result),
  );
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
      legend={m.fnLabel}
      name="fn"
      options={FNS.map((f) => ({ value: f, label: m.fns[f] }))}
      bind:value={fn}
      onchange={changeFn}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.nLabel}
      <input
        type="number"
        name="n"
        min="0"
        max={MAX_N[fn]}
        step="1"
        class="field w-24"
        bind:value={draft}
        onchange={commitN}
      />
    </label>
    <label class="flex items-center gap-2 pb-2 text-sm text-slate-800">
      <input
        type="checkbox"
        name="base"
        class="size-4 accent-teal-700"
        bind:checked={withBase}
        onchange={toggleBase}
      />
      {m.baseLabel}
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <TreeView
          {roots}
          ariaLabel={m.treeAria(fn, n, frame.callCount)}
          labelOf={nodeLabel}
          emptyText={m.treeEmpty}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
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
          <dt class="text-xs text-slate-500">{m.stats.calls}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="calls">{frame.callCount}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.depth}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="depth">
            {m.depthValue(frame.depth, frame.maxDepth)}
          </dd>
        </div>
        <div class="col-span-2 min-w-0 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="truncate text-2xl font-bold tabular-nums" data-testid="result">{result}</dd>
        </div>
      </dl>

      <section class="rounded-xl border border-slate-200 bg-white p-3" data-testid="stack">
        <h2 class="mb-2 flex justify-between gap-2 text-xs text-slate-500">
          <span>{m.stackTitle}</span><span>{m.stackLimit(STACK_LIMIT)}</span>
        </h2>
        <ol class="flex flex-col gap-1 font-mono text-xs">
          {#each stackRows as r (r.id)}
            {@const active = r.id === frame.current}
            <li
              class="flex flex-wrap items-baseline justify-between gap-x-2 rounded border border-slate-700 px-2 py-1 {active
                ? 'bg-state-active text-white'
                : 'bg-state-frontier text-slate-900'}"
            >
              <span class="font-semibold"
                ><span aria-hidden="true"
                  >{active ? m.markers.active : m.markers.waiting}
                </span>{m.callName(fn, String(r.n).replace('-', '−'))}</span
              >
              <span>{m.locals(fn, r)}</span>
              <span class="w-full text-[11px] opacity-90"
                >{active ? m.status.active : m.status.waiting} · {m.atLine(r.line)}</span
              >
            </li>
          {:else}
            <li class="text-slate-500">{m.stackEmpty}</li>
          {/each}
        </ol>
      </section>
      <CodePanel lines={pseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
