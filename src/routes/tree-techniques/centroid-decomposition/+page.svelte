<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    CENTROID_PRESETS,
    MAX_K,
    centroidLevels,
    centroidPseudocode,
    centroidTrace,
    makeCentroidPreset,
  } from '$lib/algo-engine/centroid-decomposition.js';
  import {
    MAX_NODES,
    addLeaf,
    childrenOf,
    removeSubtree,
  } from '$lib/algo-engine/lca-binary-lifting.js';
  import { en as m } from '$lib/lessons/centroid-decomposition/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/lca-binary-lifting.js').RootedTree} RootedTree */
  /** @typedef {import('$lib/algo-engine/centroid-decomposition.js').CentroidPreset} CentroidPreset */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const FIRST_K = 3;
  // A fixed first tree keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makeCentroidPreset('sample');
  /** @type {RootedTree} */
  let tree = $state.raw(INITIAL);
  let k = $state(FIRST_K);
  /** @type {number | null} */
  let kDraft = $state(FIRST_K);
  /** @type {RootedTree[]} */
  let history = $state.raw([]);
  let selected = $state(0);
  let preset = $state('sample');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(centroidTrace(INITIAL, FIRST_K));
  const frame = $derived(player.frame);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, tree.labels),
  );
  const kids = $derived(childrenOf(tree.parent));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {RootedTree} next */
  function load(next) {
    tree = next;
    notice = { text: '', at: -1 };
    player.load(centroidTrace(next, k));
  }

  /** @param {RootedTree} next */
  function edit(next) {
    history = [...history, tree];
    preset = '';
    load(next);
  }

  function add() {
    const next = addLeaf(tree, selected);
    if (!next) return say(m.errors.full(MAX_NODES));
    edit(next);
    selected = next.parent.length - 1;
  }

  function remove() {
    if (selected === 0) return say(m.errors.root);
    const parentLabel = tree.labels[tree.parent[selected]];
    const next = removeSubtree(tree, selected).tree;
    edit(next);
    selected = Math.max(0, next.labels.indexOf(parentLabel));
  }

  function undo() {
    if (history.length === 0) return;
    const prev = /** @type {RootedTree} */ (history.at(-1));
    history = history.slice(0, -1);
    preset = '';
    load(prev);
    if (selected >= prev.labels.length) selected = 0;
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {CentroidPreset} */ (e.currentTarget.value);
    history = [...history, tree];
    load(makeCentroidPreset(picked, Math.random));
    selected = 0;
    // A random tree is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** A new K keeps the decomposition, so the learner stays on the same step. */
  function commitK() {
    if (!wholeInRange(kDraft, 1, MAX_K)) {
      kDraft = k;
      return say(m.errors.k(MAX_K));
    }
    if (kDraft === k) return;
    k = /** @type {number} */ (kDraft);
    const at = player.index;
    notice = { text: '', at: -1 };
    player.load(centroidTrace(tree, k));
    player.seek(at);
  }

  const inPiece = $derived(new Set(frame.piece));
  const waiting = $derived(new Set(frame.pending.flat()));

  /** @param {number} x @returns {{ state: VisualState, marker: string, spoken: string, note: string, said: string }} */
  function look(x) {
    const f = frame;
    if (f.removed[x]) {
      const l = /** @type {number} */ (f.level[x]);
      return {
        state: x === f.c ? 'sorted' : 'pruned',
        marker: x === f.c ? m.markers.sorted : '',
        spoken: x === f.c ? m.states.centroid : m.states.removed,
        note: m.levelNote(l),
        said: m.spoken.level(l),
      };
    }
    if (inPiece.has(x)) {
      const counting = f.kind === 'count';
      const d = f.dist[x];
      const s = f.size[x];
      const note = counting ? m.distNote(d) : m.sizeNote(s);
      const said = counting
        ? d === null
          ? ''
          : m.spoken.dist(d)
        : s === null
          ? ''
          : m.spoken.size(s);
      if (x === f.c && f.kind === 'walk')
        return { state: 'active', marker: m.markers.active, spoken: m.states.walk, note, said };
      if (x === f.c)
        return { state: 'sorted', marker: m.markers.sorted, spoken: m.states.centroid, note, said };
      return { state: '', marker: '', spoken: m.states.piece, note, said };
    }
    if (waiting.has(x))
      return {
        state: 'frontier',
        marker: m.markers.frontier,
        spoken: m.states.pending,
        note: '',
        said: '',
      };
    return { state: '', marker: '', spoken: '', note: '', said: '' };
  }

  /** @param {number} x @returns {TreeNode} */
  function build(x) {
    const l = look(x);
    return {
      id: x,
      label: tree.labels[x],
      state: l.state,
      marker: l.marker,
      note: l.note || undefined,
      children: kids[x].map(build),
    };
  }
  const roots = $derived(frame.removed.length === tree.labels.length ? [build(0)] : []);

  /** @param {TreeNode} node */
  const nodeLabel = (node) => {
    const l = look(Number(node.id));
    return m.nodeLabel(node.label, l.spoken, l.said);
  };

  const centroidRoots = $derived.by(() => {
    const f = frame;
    if (f.ctParent.length !== tree.labels.length) return [];
    /** @type {number[][]} */
    const below = f.ctParent.map(() => []);
    let top = -1;
    f.ctParent.forEach((p, x) => {
      if (p === null) return;
      if (p < 0) top = x;
      else below[p].push(x);
    });
    if (top < 0) return [];
    /** @param {number} x @returns {TreeNode} */
    const node = (x) => ({
      id: x,
      label: tree.labels[x],
      state: x === f.c ? 'sorted' : '',
      marker: x === f.c ? m.markers.sorted : '',
      children: below[x].map(node),
    });
    return [node(top)];
  });

  const pendingChips = $derived(
    frame.pending.map((nodes, i, all) => ({
      label: `{${nodes.map((x) => tree.labels[x]).join(' ')}}`,
      hot: i === all.length - 1,
    })),
  );

  const stats = $derived([
    [m.stats.pairs, String(frame.pairs), 'pairs'],
    [m.stats.removed, String(frame.removed.filter(Boolean).length), 'removed'],
    [m.stats.levels, String(centroidLevels(frame)), 'levels'],
    [m.stats.work, String(frame.work), 'work'],
  ]);

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', m.legend.active],
    ['sorted', m.legend.sorted],
    ['frontier', m.legend.frontier],
    ['pruned', m.legend.pruned],
  ]);
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the K field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => e.preventDefault()}
    onkeydown={(e) => enterField(e, {})}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each CENTROID_PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.kLabel}
      <input
        type="number"
        name="k"
        min="1"
        max={MAX_K}
        class="field w-20"
        bind:value={kDraft}
        onchange={commitK}
      />
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
          onselect={(id) => (selected = Number(id))}
          {selected}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.noteKey}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
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
          {m.centroidTreeTitle}
        </h2>
        <TreeView
          roots={centroidRoots}
          ariaLabel={m.centroidTreeAria}
          labelOf={(n, depth) => m.centroidNodeLabel(n.label, depth, n.id === frame.c)}
          emptyText={m.centroidTreeEmpty}
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
      <ChipList title={m.pendingTitle} items={pendingChips} emptyText={m.pendingEmpty} />
      <CodePanel lines={centroidPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
