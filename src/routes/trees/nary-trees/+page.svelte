<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_CHILDREN,
    MAX_DEPTH,
    MAX_NODES,
    PRESETS,
    addChild,
    childrenLists,
    makeTree,
    naryPseudocode,
    naryTrace,
    removeSubtree,
  } from '$lib/algo-engine/nary-trees.js';
  import { en as m } from '$lib/lessons/nary-trees/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/nary-trees.js').NaryTree} NaryTree */
  /** @typedef {import('$lib/algo-engine/nary-trees.js').NaryPreset} NaryPreset */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'active'|'frontier'|'compare'|'visited'|'path'} MarkedState */

  // A fixed first tree keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makeTree('org');
  /** @type {NaryTree} */
  let tree = $state.raw(INITIAL);
  /** @type {NaryTree[]} */
  let history = $state.raw([]);
  let selected = $state(0);
  let preset = $state('org');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(naryTrace(INITIAL));
  const frame = $derived(player.frame);
  const kids = $derived(childrenLists(tree));
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, tree.labels, kids),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** Rebuilds the trace and jumps to the end so every size shows at once. @param {NaryTree} next */
  function load(next) {
    tree = next;
    notice = { text: '', at: -1 };
    const frames = naryTrace(next);
    player.load(frames);
    player.seek(frames.length - 1);
  }

  /** @param {NaryTree} next */
  function edit(next) {
    history = [...history, tree];
    preset = '';
    load(next);
  }

  function add() {
    const r = addChild(tree, selected);
    if (!r.ok) {
      if (r.error === 'full') return say(m.errors.full(MAX_NODES));
      if (r.error === 'depth') return say(m.errors.depth(MAX_DEPTH));
      return say(m.errors.wide(tree.labels[selected], MAX_CHILDREN));
    }
    edit(r.tree);
    selected = r.tree.labels.length - 1;
  }

  function remove() {
    if (selected === 0) return say(m.errors.root);
    const parentLabel = tree.labels[tree.parent[selected]];
    const next = removeSubtree(tree, selected);
    edit(next);
    selected = Math.max(0, next.labels.indexOf(parentLabel));
  }

  function undo() {
    if (history.length === 0) return;
    const prev = /** @type {NaryTree} */ (history.at(-1));
    history = history.slice(0, -1);
    preset = '';
    load(prev);
    if (selected >= prev.labels.length) selected = 0;
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {NaryPreset} */ (e.currentTarget.value);
    history = [...history, tree];
    load(makeTree(picked, Math.random));
    selected = 0;
    // A random tree is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {number} v @returns {VisualState} */
  function stateOf(v) {
    if (frame.kind === 'done') return frame.path.includes(v) ? 'path' : 'visited';
    if (v === frame.current) return 'active';
    if (v === frame.child && frame.kind === 'add') return 'compare';
    if (frame.stack.includes(v)) return 'frontier';
    if (frame.done[v]) return 'visited';
    return '';
  }

  /** @param {VisualState} s @returns {s is MarkedState} */
  const marked = (s) => s !== '' && s !== 'swap' && s !== 'sorted';

  /** @param {number} v @returns {TreeNode} */
  function build(v) {
    const s = stateOf(v);
    return {
      id: v,
      label: tree.labels[v],
      state: s,
      marker: marked(s) ? m.markers[s] : '',
      note: m.note(frame.size[v], frame.height[v]) || undefined,
      children: kids[v].map(build),
    };
  }

  const roots = $derived(frame.size.length === tree.labels.length ? [build(0)] : []);

  /** @param {TreeNode} node */
  function nodeLabel(node) {
    const v = Number(node.id);
    const s = stateOf(v);
    return m.nodeLabel(node.label, frame.size[v], frame.height[v], marked(s) ? m.states[s] : '');
  }

  const stackChips = $derived(
    frame.stack.map((v, k, all) => ({
      label: `dfs(${tree.labels[v]})`,
      hot: k === all.length - 1,
    })),
  );

  const stats = $derived([
    [m.stats.size, frame.size[0] === null ? m.notYet : String(frame.size[0]), 'size'],
    [m.stats.height, frame.height[0] === null ? m.notYet : String(frame.height[0]), 'height'],
    [m.stats.diameter, frame.kind === 'done' ? String(frame.diameter) : m.notYet, 'diameter'],
    [m.stats.calls, String(frame.calls), 'calls'],
  ]);

  const legend = /** @type {[MarkedState, string][]} */ ([
    ['active', m.legend.active],
    ['frontier', m.legend.frontier],
    ['compare', m.legend.compare],
    ['visited', m.legend.visited],
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
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <TreeView
          {roots}
          ariaLabel={m.treeAria(tree.labels.length, frame.diameter)}
          labelOf={nodeLabel}
          onselect={(id) => (selected = Number(id))}
          {selected}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{m
                .markers[st]}
              {label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-full border-2 border-teal-700 bg-white"></span>{m.legend
              .selected}
          </li>
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
        {#each stats as [label, value, id] (id)}
          <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.listsTitle}</h2>
        <ul class="font-mono text-xs" data-testid="lists">
          {#each tree.labels as label, v (label)}
            <li
              class="rounded px-1.5 py-0.5 {v === frame.current
                ? 'bg-sky-700 text-white'
                : 'text-slate-800'}"
            >
              {m.listRow(
                label,
                kids[v].map((c) => tree.labels[c]),
              )}
            </li>
          {/each}
        </ul>
      </div>
      <ChipList title={m.stackTitle} items={stackChips} emptyText={m.stackEmpty} />
      <CodePanel lines={naryPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
