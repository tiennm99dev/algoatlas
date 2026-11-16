<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    HLD_PRESETS,
    MAX_VALUE,
    hldPseudocode,
    hldQueryStart,
    hldTrace,
    makeHldPreset,
  } from '$lib/algo-engine/heavy-light-decomposition.js';
  import {
    MAX_NODES,
    addLeaf,
    childrenOf,
    removeSubtree,
  } from '$lib/algo-engine/lca-binary-lifting.js';
  import { en as m } from '$lib/lessons/heavy-light-decomposition/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/heavy-light-decomposition.js').ValuedTree} ValuedTree */
  /** @typedef {import('$lib/algo-engine/heavy-light-decomposition.js').HldPreset} HldPreset */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {{ tree: ValuedTree, u: number, v: number }} Setup */

  // A fixed first tree keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makeHldPreset('sample');
  /** @type {ValuedTree} */
  let tree = $state.raw(INITIAL.tree);
  let qu = $state(INITIAL.u);
  let qv = $state(INITIAL.v);
  /** @type {Setup[]} */
  let history = $state.raw([]);
  let selected = $state(0);
  /** @type {number | null} */
  let valueDraft = $state(INITIAL.tree.value[0]);
  let preset = $state('sample');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(hldTrace(INITIAL.tree, INITIAL.u, INITIAL.v));
  const frame = $derived(player.frame);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, tree.labels),
  );
  const kids = $derived(childrenOf(tree.parent));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {number} x */
  function select(x) {
    selected = x;
    valueDraft = tree.value[x];
  }

  /** Rebuilds the trace; edits open on the query, the chains already numbered. @param {boolean} [toQuery] */
  function run(toQuery = true) {
    notice = { text: '', at: -1 };
    const frames = hldTrace(tree, qu, qv);
    player.load(frames);
    if (toQuery) player.seek(hldQueryStart(frames));
  }

  /** @param {Setup} next @param {boolean} [toQuery] */
  function apply(next, toQuery = true) {
    tree = next.tree;
    qu = next.u;
    qv = next.v;
    run(toQuery);
  }

  /** @param {Setup} next */
  function edit(next) {
    history = [...history, { tree, u: qu, v: qv }];
    preset = '';
    apply(next);
  }

  function add() {
    const grown = addLeaf(tree, selected);
    if (!grown) return say(m.errors.full(MAX_NODES));
    edit({ tree: { ...grown, value: [...tree.value, 1] }, u: qu, v: qv });
    select(grown.parent.length - 1);
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
    const value = keep.map((x) => tree.value[x]);
    edit({ tree: { ...next, value }, u: mapped(qu), v: mapped(qv) });
    select(Math.max(0, next.labels.indexOf(parentLabel)));
  }

  function commitValue() {
    if (!wholeInRange(valueDraft, 0, MAX_VALUE)) {
      valueDraft = tree.value[selected];
      return say(m.errors.value(MAX_VALUE));
    }
    const x = /** @type {number} */ (valueDraft);
    if (x === tree.value[selected]) return;
    const at = selected;
    edit({ tree: { ...tree, value: tree.value.map((w, i) => (i === at ? x : w)) }, u: qu, v: qv });
  }

  function undo() {
    if (history.length === 0) return;
    const prev = /** @type {Setup} */ (history.at(-1));
    history = history.slice(0, -1);
    preset = '';
    apply(prev);
    select(selected < prev.tree.labels.length ? selected : 0);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {HldPreset} */ (e.currentTarget.value);
    history = [...history, { tree, u: qu, v: qv }];
    apply(makeHldPreset(picked, Math.random), false);
    select(0);
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

  /** Position → node for the positions numbered so far. */
  const nodeAt = $derived.by(() => {
    /** @type {number[]} */
    const out = [];
    frame.pos.forEach((p, x) => {
      if (p !== null) out[p] = x;
    });
    return out;
  });
  const lastRange = $derived(
    frame.kind === 'range' || frame.kind === 'last' ? frame.ranges.at(-1) : undefined,
  );
  /** @param {number} p */
  const inLast = (p) => lastRange !== undefined && p >= lastRange.from && p <= lastRange.to;
  /** @param {number} p */
  const summed = (p) => frame.ranges.some((r) => p >= r.from && p <= r.to);
  const isHead = (/** @type {number} */ x) => frame.head[x] === x;

  /** @param {number} x @returns {{ state: VisualState, marker: string, spoken: string }} */
  function look(x) {
    const f = frame;
    const p = f.pos[x];
    const head = isHead(x) ? m.markers.head : '';
    if (f.u >= 0 && f.kind !== 'done') {
      const tag = x === f.u && x === f.v ? 'u=v' : x === f.u ? 'u' : x === f.v ? 'v' : '';
      const spokenTag =
        x === f.u && x === f.v
          ? m.states.both
          : x === f.u
            ? m.states.u
            : x === f.v
              ? m.states.v
              : '';
      if (p !== null && inLast(p))
        return {
          state: 'active',
          marker: tag || head,
          spoken: [m.states.range, spokenTag].filter(Boolean).join(', '),
        };
      if (p !== null && summed(p))
        return {
          state: 'path',
          marker: tag || head,
          spoken: [m.states.summed, spokenTag].filter(Boolean).join(', '),
        };
      return { state: '', marker: tag || head, spoken: spokenTag || (head ? m.states.head : '') };
    }
    if (f.kind === 'done') {
      return p !== null && summed(p)
        ? { state: 'path', marker: head, spoken: m.states.summed }
        : { state: '', marker: head, spoken: head ? m.states.head : '' };
    }
    if (x === f.current)
      return { state: 'active', marker: m.markers.active, spoken: m.states.active };
    const finished = f.kind === 'place' ? p !== null : f.size[x] !== null;
    return finished
      ? {
          state: 'visited',
          marker: head,
          spoken: [m.states.visited, head ? m.states.head : ''].filter(Boolean).join(', '),
        }
      : { state: '', marker: '', spoken: '' };
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
      note: m.note(tree.value[x], frame.pos[x]),
      edgeLabel: p >= 0 && frame.heavy[p] === x ? m.heavyMark : undefined,
      children: kids[x].map(build),
    };
  }
  const roots = $derived(frame.pos.length === tree.labels.length ? [build(0)] : []);

  /** @param {TreeNode} node */
  const nodeLabel = (node) => {
    const x = Number(node.id);
    const h = frame.head[x];
    return m.nodeLabel(
      node.label,
      tree.value[x],
      frame.pos[x],
      h === null ? '' : tree.labels[h],
      look(x).spoken,
    );
  };

  /** @param {number} p @returns {VisualState} */
  function cellState(p) {
    if (inLast(p)) return 'active';
    if (summed(p)) return 'path';
    if (frame.kind === 'place' && nodeAt[p] === frame.current) return 'active';
    return '';
  }

  const chains = $derived.by(() => {
    /** @type {{ label: string, hot: boolean }[]} */
    const out = [];
    nodeAt.forEach((x, p) => {
      if (frame.head[x] !== x) return;
      const members = [];
      for (let q = p; q < nodeAt.length && frame.head[nodeAt[q]] === x; q++)
        members.push(tree.labels[nodeAt[q]]);
      out.push({
        label: members.join('–'),
        hot: inLast(p) || (frame.kind === 'place' && members.includes(tree.labels[frame.current])),
      });
    });
    return out;
  });

  const stats = $derived([
    [m.stats.sum, frame.u >= 0 ? String(frame.sum) : m.notYet, 'sum'],
    [m.stats.ranges, String(frame.ranges.length), 'ranges'],
    [m.stats.visits, String(frame.visits), 'visits'],
    [m.stats.walk, frame.u >= 0 ? String(frame.pathNodes) : m.notYet, 'walk'],
  ]);

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', m.legend.active],
    ['visited', m.legend.visited],
    ['path', m.legend.path],
  ]);
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the value field leaves and re-enters it, which commits it through its change handler. -->
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
        {#each HLD_PRESETS as p (p)}
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
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valueLabel}
      <input
        type="number"
        name="value"
        min="0"
        max={MAX_VALUE}
        class="field w-20"
        bind:value={valueDraft}
        onchange={commitValue}
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
          onselect={(id) => select(Number(id))}
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
          <li>{m.legend.head}</li>
          <li>{m.legend.heavy}</li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-full border-2 border-teal-700 bg-white"></span>{m.legend
              .selected}
          </li>
        </ul>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.arrayTitle}
        </h2>
        <ArrayStrip
          values={nodeAt.map((x) => tree.value[x])}
          ariaLabel={m.arrayAria}
          stateOf={cellState}
          markerOf={(p) => (frame.head[nodeAt[p]] === nodeAt[p] ? m.markers.head : '')}
          labelOf={(p) => m.cellLabel(tree.labels[nodeAt[p]], tree.value[nodeAt[p]])}
          pointers={nodeAt.map((x, p) => ({ name: tree.labels[x], index: p }))}
          windows={frame.ranges.map((r) => ({
            from: r.from,
            to: r.to + 1,
            label: m.windowLabel(tree.labels[nodeAt[r.from]]),
          }))}
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
      <ChipList title={m.chainsTitle} items={chains} emptyText={m.chainsEmpty} />
      <CodePanel lines={hldPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
