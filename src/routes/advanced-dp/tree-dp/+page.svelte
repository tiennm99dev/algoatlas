<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { letter } from '$lib/components/graph-editor.js';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_NODES,
    MAX_WEIGHT,
    TREE_PRESETS,
    addChild,
    childrenOf,
    randomTree,
    removeSubtree,
    treeDpPseudocode,
    treeDpTrace,
  } from '$lib/algo-engine/tree-dp.js';
  import { en as m } from '$lib/lessons/tree-dp/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/tree-dp.js').TreeProblem} TreeProblem */
  /** @typedef {import('$lib/algo-engine/tree-dp.js').TreeInput} TreeInput */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'current'|'stack'|'child'|'settled'|'picked'|'out'|'known'|'best'|''} Role */

  const PROBLEMS = /** @type {TreeProblem[]} */ (['mis', 'reroot']);
  const FIRST = TREE_PRESETS[0];

  let problem = $state(/** @type {TreeProblem} */ ('mis'));
  let tree = $state(/** @type {TreeInput} */ (FIRST.tree));
  let preset = $state(FIRST.key);
  let selected = $state(/** @type {number | null} */ (null));
  let weightDraft = $state(/** @type {number | null} */ (null));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(treeDpTrace('mis', FIRST.tree));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const mis = $derived(frame.problem === 'mis');
  const finalFrame = $derived(player.frames[player.frames.length - 1]);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {TreeInput} next */
  function setTree(next) {
    tree = next;
    notice = { text: '', at: -1 };
    player.load(treeDpTrace(problem, next));
  }

  function pickProblem() {
    setTree(tree);
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = TREE_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    select(null);
    setTree(p.tree);
  }

  /** @param {number | null} v */
  function select(v) {
    selected = v;
    weightDraft = v === null ? null : tree.weight[v];
  }

  function addUnder() {
    if (selected === null) return say(m.selectFirst);
    if (tree.parent.length >= MAX_NODES) return say(m.fullError(MAX_NODES));
    preset = '';
    const next = addChild(tree, selected, 1);
    setTree(next);
    select(next.parent.length - 1);
  }

  function removeSelected() {
    if (selected === null) return say(m.selectFirst);
    if (selected === 0) return say(m.rootError);
    preset = '';
    const next = removeSubtree(tree, selected);
    select(null);
    setTree(next);
  }

  function commitWeight() {
    if (selected === null) {
      weightDraft = null;
      return say(m.selectFirst);
    }
    if (!wholeInRange(weightDraft, 0, MAX_WEIGHT)) {
      weightDraft = tree.weight[selected];
      return say(m.weightError(MAX_WEIGHT));
    }
    const w = /** @type {number} */ (weightDraft);
    if (w === tree.weight[selected]) return;
    preset = '';
    const at = selected;
    setTree({ parent: tree.parent, weight: tree.weight.map((x, i) => (i === at ? w : x)) });
  }

  function randomize() {
    preset = '';
    select(null);
    setTree(randomTree(5 + Math.floor(Math.random() * (MAX_NODES - 4))));
  }

  /** @param {number} v @returns {Role} */
  function roleOf(v) {
    const f = frame;
    if (f.kind === 'done' && !mis && f.all[v] === f.result) return 'best';
    if (v === f.c && (f.kind === 'merge' || f.kind === 'move')) return 'child';
    if (v === f.v && f.kind !== 'done') return 'current';
    if (mis && f.taken[v] !== null) return f.taken[v] ? 'picked' : 'out';
    if (!mis && f.all[v] !== null) return 'known';
    if (f.stack.includes(v)) return 'stack';
    if (f.settled[v]) return 'settled';
    return '';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'active',
    stack: 'frontier',
    child: 'compare',
    settled: 'visited',
    picked: 'sorted',
    out: 'pruned',
    known: 'path',
    best: 'sorted',
    '': '',
  };

  /** @param {number} v */
  const noteOf = (v) =>
    mis
      ? m.misNote(frame.inc[v], frame.exc[v])
      : m.rerootNote(frame.size[v], frame.sub[v], frame.all[v]);
  /** @param {number} v */
  const spokenOf = (v) =>
    mis
      ? m.misSpoken(frame.inc[v], frame.exc[v])
      : m.rerootSpoken(frame.size[v], frame.sub[v], frame.all[v]);

  const roots = $derived.by(() => {
    if (!frame.n) return [];
    const kids = childrenOf(frame.parent);
    /** @param {number} v @returns {TreeNode} */
    const build = (v) => {
      const role = roleOf(v);
      return {
        id: v,
        label: mis ? m.nodeText(letter(v), frame.weight[v]) : letter(v),
        children: kids[v].map(build),
        state: ROLE_STATE[role],
        marker: role ? m.markers[role] : '',
        note: noteOf(v),
      };
    };
    return [build(0)];
  });

  /** @param {TreeNode} n */
  function nodeAria(n) {
    const v = /** @type {number} */ (n.id);
    const role = roleOf(v);
    return m.nodeLabel(
      letter(v),
      frame.weight[v],
      frame.problem,
      spokenOf(v),
      role ? m.nodeStates[role] : '',
    );
  }

  const names = $derived(Array.from({ length: frame.n }, (_, v) => letter(v)));
  const tableRows = $derived(mis ? [frame.inc, frame.exc] : [frame.size, frame.sub, frame.all]);
  /** @param {number} r @param {number} c @returns {VisualState} */
  function tableState(r, c) {
    if (
      c === frame.v &&
      (frame.kind === 'enter' || frame.kind === 'merge' || frame.kind === 'settle')
    )
      return 'active';
    if (c === frame.c && (frame.kind === 'merge' || frame.kind === 'move'))
      return r === 2 ? 'active' : 'compare';
    return '';
  }

  const legend = $derived(
    /** @type {[VisualState, string][]} */ ([
      ['active', `${m.markers.current} ${m.legend.current}`],
      ['frontier', `${m.markers.stack} ${m.legend.stack}`],
      ['compare', `${m.markers.child} ${m.legend.child}`],
      ['visited', `${m.markers.settled} ${m.legend.settled}`],
      ...(mis
        ? /** @type {[VisualState, string][]} */ ([
            ['sorted', `${m.markers.picked} ${m.legend.picked}`],
            ['pruned', `${m.markers.out} ${m.legend.out}`],
          ])
        : /** @type {[VisualState, string][]} */ ([
            ['path', `${m.markers.known} ${m.legend.known}`],
            ['sorted', `${m.markers.best} ${m.legend.best}`],
          ])),
    ]),
  );

  const chips = $derived(
    mis
      ? frame.taken.flatMap((t, v) => (t ? [{ label: letter(v), hot: v === frame.v }] : []))
      : frame.all.flatMap((a, v) =>
          a === null ? [] : [{ label: m.sumChip(v, a), hot: v === frame.c }],
        ),
  );
  const naive = $derived(mis ? 2 ** frame.n : frame.n * (frame.n - 1));
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the weight field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => e.preventDefault()}
    onkeydown={(e) => enterField(e, {})}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((v) => ({ value: v, label: m.problems[v] }))}
      bind:value={problem}
      onchange={pickProblem}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field max-w-full"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each TREE_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-outline" onclick={randomize}>{m.randomTree}</button>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.weightLabel}
      <input
        type="number"
        name="weight"
        min="0"
        max={MAX_WEIGHT}
        class="field w-20"
        bind:value={weightDraft}
        onchange={commitWeight}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={addUnder}>{m.addChild}</button>
    <button type="button" class="btn-outline" onclick={removeSelected}>{m.removeSubtree}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <TreeView
          {roots}
          ariaLabel={m.treeAria(frame.problem, frame.n)}
          labelOf={nodeAria}
          onselect={(id) => select(selected === id ? null : /** @type {number} */ (id))}
          {selected}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.noteKey(frame.problem)}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (label)}
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
          <dt class="text-xs text-slate-500">{m.stats.settled}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="settled">
            {frame.settled.filter(Boolean).length} / {frame.n}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.edges}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="edges">
            {frame.edges} / {finalFrame.edges}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer[frame.problem]}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="answer">
            {frame.result ?? m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naive[frame.problem]}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="naive">{naive}</dd>
        </div>
      </dl>
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.tableTitle[frame.problem]}</h2>
        <DpTable
          values={tableRows}
          ariaLabel={m.tableAria(frame.problem)}
          rowHeaders={m.rowHeads[frame.problem]}
          colHeaders={names}
          stateOf={tableState}
          speed={player.speed}
        />
      </div>
      <ChipList title={m.pickedTitle[frame.problem]} emptyText={m.pickedEmpty} items={chips} />
      <CodePanel lines={treeDpPseudocode[frame.problem]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
