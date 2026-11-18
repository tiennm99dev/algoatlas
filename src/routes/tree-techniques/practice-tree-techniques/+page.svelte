<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import { decompose } from '$lib/algo-engine/heavy-light-core.js';
  import { childrenOf } from '$lib/algo-engine/rooted-tree.js';
  import {
    PRACTICE_PRESETS,
    formatOp,
    formatOps,
    makePracticePreset,
    parseOps,
    practicePseudocode,
    practiceTrace,
  } from '$lib/algo-engine/practice-tree-techniques.js';
  import { vi as m } from '$lib/lessons/practice-tree-techniques/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/heavy-light-decomposition.js').ValuedTree} ValuedTree */
  /** @typedef {import('$lib/algo-engine/practice-tree-techniques.js').TreeOp} TreeOp */
  /** @typedef {import('$lib/algo-engine/practice-tree-techniques.js').PracticePreset} PracticePreset */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first workload keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makePracticePreset('sample');
  /** @type {ValuedTree} */
  let tree = $state.raw(INITIAL.tree);
  /** @type {TreeOp[]} */
  let ops = $state.raw(INITIAL.ops);
  let text = $state(formatOps(INITIAL.ops, INITIAL.tree.labels));
  let preset = $state('sample');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(practiceTrace(INITIAL.tree, INITIAL.ops));
  const frame = $derived(player.frame);
  const kids = $derived(childrenOf(tree.parent));
  const hld = $derived(decompose(tree.parent));
  const chainCount = $derived(hld.head.filter((h, x) => h === x).length);
  const narration = $derived(
    notice.at === player.index
      ? notice.text
      : m.describe(frame, ops, tree.labels, hld.depth, chainCount),
  );
  const op = $derived(frame.op >= 0 ? ops[frame.op] : null);

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function run() {
    notice = { text: '', at: -1 };
    player.load(practiceTrace(tree, ops));
    text = formatOps(ops, tree.labels);
  }

  function commitOps() {
    const r = parseOps(text, tree.labels);
    if ('error' in r) {
      text = formatOps(ops, tree.labels);
      say(m.opErrors[r.error]);
      return;
    }
    if (formatOps(r.ops, tree.labels) === formatOps(ops, tree.labels)) {
      text = formatOps(ops, tree.labels);
      return;
    }
    ops = r.ops;
    preset = '';
    run();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {PracticePreset} */ (e.currentTarget.value);
    const next = makePracticePreset(picked, Math.random);
    tree = next.tree;
    ops = next.ops;
    run();
    // A random workload is never "the" preset: going back to the placeholder lets it be drawn again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  const onPath = $derived(new Set(frame.path));

  /** @param {number} x @returns {{ state: VisualState, marker: string, spoken: string }} */
  function look(x) {
    if (op && op.type === 'set')
      return x === op.u
        ? { state: 'swap', marker: m.markers.swap, spoken: m.states.set }
        : { state: '', marker: '', spoken: '' };
    if (!op || !onPath.has(x)) return { state: '', marker: '', spoken: '' };
    const ends = [x === op.u ? m.states.u : '', x === op.v ? m.states.v : ''].filter(Boolean);
    const tag = ends.join('=');
    if (x === frame.lca)
      return {
        state: 'path',
        marker: tag || m.markers.sorted,
        spoken: [m.states.lca, ...ends].join(', '),
      };
    return { state: 'path', marker: tag, spoken: [m.states.path, ...ends].join(', ') };
  }

  /** @param {number} x @returns {TreeNode} */
  function build(x) {
    const l = look(x);
    const p = tree.parent[x];
    return {
      id: x,
      label: tree.labels[x],
      state: l.state,
      marker: l.marker,
      note: m.note(frame.values[x]),
      edgeLabel: p >= 0 && hld.heavy[p] === x ? m.heavyMark : undefined,
      children: kids[x].map(build),
    };
  }
  const roots = $derived(frame.values.length === tree.labels.length ? [build(0)] : []);

  /** @param {TreeNode} node */
  const nodeLabel = (node) => {
    const x = Number(node.id);
    return m.nodeLabel(node.label, frame.values[x], look(x).spoken);
  };

  const nodeAt = $derived.by(() => {
    /** @type {number[]} */
    const out = [];
    hld.pos.forEach((p, x) => (out[p] = x));
    return out;
  });
  /** @param {number} p @returns {VisualState} */
  function cellState(p) {
    if (op && op.type === 'set') return nodeAt[p] === op.u ? 'swap' : '';
    return frame.ranges.some((r) => p >= r.from && p <= r.to) ? 'path' : '';
  }

  const chips = $derived(
    ops.map((o, i) => {
      const f = player.frames[i + 1];
      const seen = player.index > i;
      return {
        label: m.opChip(
          formatOp(o, tree.labels),
          seen ? f.answer : null,
          seen ? f.naive : 0,
          seen ? f.hld : 0,
        ),
        hot: i === frame.op,
      };
    }),
  );

  const stats = $derived([
    [m.stats.answer, frame.answer === null ? m.none : String(frame.answer), 'answer'],
    [
      m.stats.step,
      frame.op >= 0
        ? `${frame.op + 1}/${ops.length}`
        : `${frame.kind === 'done' ? ops.length : 0}/${ops.length}`,
      'step',
    ],
    [m.stats.naive, String(frame.naiveTotal), 'naive'],
    [m.stats.hld, String(frame.hldTotal), 'hld'],
  ]);

  const legend = /** @type {[VisualState, string][]} */ ([
    ['path', m.legend.path],
    ['swap', m.legend.swap],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitOps();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRACTICE_PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <label
      class="flex min-w-64 flex-1 flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
    >
      {m.opsLabel}
      <input
        type="text"
        name="ops"
        class="field w-full font-mono"
        bind:value={text}
        onchange={commitOps}
      />
      <span class="font-normal tracking-normal normal-case">{m.opsHelp}</span>
    </label>
  </form>

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
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.noteKey}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
          <li>{m.legend.sorted}</li>
        </ul>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.arrayTitle}
        </h2>
        <ArrayStrip
          values={nodeAt.map((x) => frame.values[x])}
          ariaLabel={m.arrayAria}
          stateOf={cellState}
          labelOf={(p) => m.cellLabel(tree.labels[nodeAt[p]], frame.values[nodeAt[p]])}
          pointers={nodeAt.map((x, p) => ({ name: tree.labels[x], index: p }))}
          windows={frame.kind === 'sum'
            ? frame.ranges.map((r, i) => ({ from: r.from, to: r.to + 1, label: m.windowLabel(i) }))
            : []}
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
      <ChipList title={m.opsTitle} items={chips} emptyText={m.opsEmpty} />
      <CodePanel lines={practicePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
