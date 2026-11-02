<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_OPS,
    MAX_VALUE,
    MIN_VALUE,
    SEG_MERGES,
    parseSegmentValues,
    segmentPseudocode,
    segmentTrace,
  } from '$lib/algo-engine/segment-tree.js';
  import { en as m } from '$lib/lessons/segment-tree/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import RangeDrag from './range-drag.svelte';

  /** @typedef {import('$lib/algo-engine/segment-tree.js').SegMerge} SegMerge */
  /** @typedef {import('$lib/algo-engine/segment-tree.js').SegOp} SegOp */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [2, 5, 1, 4, 9, 3, 7, 6];
  const INITIAL_OPS = /** @type {SegOp[]} */ ([{ type: 'query', l: 1, r: 6 }]);

  let merge = $state(/** @type {SegMerge} */ ('sum'));
  let values = $state.raw(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  /** @type {SegOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let index = $state(4);
  /** @type {number | null} */
  let indexDraft = $state(4);
  let newValue = $state(0);
  /** @type {number | null} */
  let valueDraft = $state(0);
  let anchor = $state(-1);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(segmentTrace(INITIAL, INITIAL_OPS, 'sum'));
  // Open on the finished query: the lit cover is the lesson, and stepping back replays it.
  player.seek(player.frames.findIndex((f) => f.kind === 'answer'));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  const mergeOptions = SEG_MERGES.map((value) => ({ value, label: m.merges[value] }));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** The current query: the running one, or else the last one in the log. */
  const shownQuery = $derived.by(() => {
    if (frame.op?.type === 'query') return frame.op;
    const last = ops.findLast((op) => op.type === 'query');
    return last?.type === 'query' ? last : null;
  });

  /**
   * Replace the log and rebuild.
   * @param {SegOp[]} next
   * @param {'answer'|'op'|'end'} at  The last operation's result, its first step, or the end.
   */
  function setOps(next, at) {
    notice = { text: '', at: -1 };
    anchor = -1;
    ops = next;
    const frames = segmentTrace(values, next, merge);
    player.load(frames);
    const lastOp = next.length - 1;
    if (at === 'end' || lastOp < 0) player.seek(frames.length - 1);
    else if (at === 'op') player.seek(frames.findIndex((f) => f.opIndex === lastOp));
    else player.seek(frames.findLastIndex((f) => f.opIndex === lastOp));
  }

  /** A drag keeps replacing the query at the end of the log. @param {number} l @param {number} r */
  function setRange(l, r) {
    const last = ops.at(-1);
    if (last?.type === 'query') {
      if (last.l === l && last.r === r && anchor < 0) return;
      setOps([...ops.slice(0, -1), { type: 'query', l, r }], 'answer');
      return;
    }
    if (ops.length >= MAX_OPS) {
      anchor = -1;
      say(m.logFull);
      return;
    }
    setOps([...ops, { type: 'query', l, r }], 'answer');
  }

  /** @param {number} i */
  function setAnchor(i) {
    anchor = i;
    say(m.pickFirst(i));
  }

  function replay() {
    const lastOp = ops.length - 1;
    if (lastOp < 0) return;
    player.seek(player.frames.findIndex((f) => f.opIndex === lastOp));
  }

  function commitValues() {
    const parsed = parseSegmentValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    values = parsed.values;
    valuesText = values.join(', ');
    const last = values.length - 1;
    index = indexDraft = Math.min(index, last);
    // Keep the log inside the new array; clamp queries and drop updates past the end.
    /** @param {SegOp} op @returns {SegOp[]} */
    const fit = (op) => {
      if (op.type === 'set') return op.i <= last ? [op] : [];
      return op.l > last ? [] : [{ ...op, r: Math.min(op.r, last) }];
    };
    setOps(ops.flatMap(fit), 'answer');
  }

  /** @returns {boolean} Whether the field held a valid value. */
  function commitIndex() {
    const last = frame.items.length - 1;
    if (whole(indexDraft, 0, last)) {
      index = /** @type {number} */ (indexDraft);
      return true;
    }
    indexDraft = index;
    say(m.indexError(frame.items.length));
    return false;
  }

  /** @returns {boolean} Whether the field held a valid value. */
  function commitValue() {
    if (whole(valueDraft, MIN_VALUE, MAX_VALUE)) {
      newValue = /** @type {number} */ (valueDraft);
      return true;
    }
    valueDraft = newValue;
    say(m.valueError);
    return false;
  }

  function setPoint() {
    if (!commitIndex() || !commitValue()) return;
    if (ops.length >= MAX_OPS) {
      say(m.logFull);
      return;
    }
    setOps([...ops, { type: 'set', i: index, x: newValue }], 'op');
  }

  /** The action Enter runs in a field; a field that is not listed only commits. */
  const ENTER_ACTIONS = /** @type {Record<string, () => void>} */ ({
    index: setPoint,
    value: setPoint,
  });

  /**
   * Enter commits the field through its own change handler, then runs that field's action, unless
   * the commit raised a notice. The browser would otherwise submit the form after the field has
   * reverted, which hides the refusal behind an operation nobody asked for.
   * @param {KeyboardEvent} e
   */
  function enterField(e) {
    const field = e.target;
    if (e.key !== 'Enter' || !(field instanceof HTMLInputElement) || field.type === 'radio') return;
    e.preventDefault();
    const before = notice;
    field.blur();
    field.focus();
    if (notice === before) ENTER_ACTIONS[field.name]?.();
  }

  function undo() {
    if (ops.length === 0) return;
    setOps(ops.slice(0, -1), 'answer');
  }

  function reset() {
    if (ops.length === 0) return;
    setOps([], 'end');
  }

  /** The state and marker of node v. @param {number} v @returns {{ state: VisualState, marker: string, name: string }} */
  function look(v) {
    const hot = frame.node === v;
    if (hot && ['build-leaf', 'build-pull', 'write', 'pull'].includes(frame.kind)) {
      return { state: 'swap', marker: m.markers.write, name: m.states.written };
    }
    if (hot && frame.kind === 'return') {
      return { state: 'active', marker: m.markers.merge, name: m.states.merged };
    }
    if (frame.covered.includes(v)) {
      return { state: 'sorted', marker: m.markers.cover, name: m.states.cover };
    }
    if (frame.outside.includes(v)) {
      return { state: 'visited', marker: m.markers.outside, name: m.states.outside };
    }
    if (frame.split.includes(v)) {
      return { state: 'frontier', marker: m.markers.split, name: m.states.split };
    }
    return { state: '', marker: '', name: '' };
  }

  const spanOf = $derived(new Map(frame.spans.map((s) => [s.v, s])));

  /** @param {number} lo @param {number} hi */
  const rangeNote = (lo, hi) => (lo === hi ? `[${lo}]` : `[${lo},${hi}]`);

  /** @param {number} v @returns {TreeNode | null} */
  function nodeOf(v) {
    const span = spanOf.get(v);
    if (!span) return null;
    const value = frame.tree[v];
    const { state, marker } = look(v);
    return {
      id: v,
      label: value === null ? m.unbuilt : m.show(value),
      state,
      marker,
      note: rangeNote(span.lo, span.hi),
      children: span.lo === span.hi ? [] : [nodeOf(2 * v), nodeOf(2 * v + 1)],
    };
  }

  const roots = $derived([/** @type {TreeNode} */ (nodeOf(1))]);

  /** @param {TreeNode} node */
  function nodeLabel(node) {
    const span = spanOf.get(/** @type {number} */ (node.id));
    const { name } = look(/** @type {number} */ (node.id));
    return m.nodeLabel(span?.lo ?? 0, span?.hi ?? 0, node.label, name);
  }

  const coverSpans = $derived(
    frame.covered.flatMap((v) => {
      const span = spanOf.get(v);
      return span ? [span] : [];
    }),
  );
  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));

  const legend = /** @type {[VisualState, string][]} */ ([
    ['sorted', m.legend.cover],
    ['frontier', m.legend.split],
    ['visited', m.legend.outside],
    ['swap', m.legend.write],
    ['active', m.legend.merge],
  ]);
</script>

<LessonLayout lesson={m}>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={enterField}
    onsubmit={(e) => {
      e.preventDefault();
      setPoint();
    }}
  >
    <SegmentedControl
      legend={m.mergeLegend}
      name="merge"
      options={mergeOptions}
      bind:value={merge}
      onchange={() => setOps(ops, 'answer')}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-64 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.indexLabel}
      <input
        type="number"
        name="index"
        min="0"
        max={frame.items.length - 1}
        step="1"
        class="field w-20"
        bind:value={indexDraft}
        onchange={commitIndex}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valueLabel}
      <input
        type="number"
        name="value"
        min={MIN_VALUE}
        max={MAX_VALUE}
        step="1"
        class="field w-20"
        bind:value={valueDraft}
        onchange={commitValue}
      />
    </label>
    <button type="submit" class="btn-secondary">{m.setButton}</button>
    <div class="flex flex-wrap gap-2 border-l border-slate-300 pl-4">
      <button type="button" onclick={undo} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.undo}</button
      >
      <button type="button" onclick={reset} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.reset}</button
      >
      <button type="button" onclick={replay} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.replay}</button
      >
    </div>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.dragTitle}
        </h2>
        <RangeDrag
          values={frame.items}
          l={shownQuery?.l ?? -1}
          r={shownQuery?.r ?? -2}
          {anchor}
          ariaLabel={m.dragAria}
          labelOf={(i) => m.cellLabel(i, frame.items[i])}
          onrange={setRange}
          onanchor={setAnchor}
        />
        <p class="mt-1 text-xs text-slate-500">{m.dragHint}</p>

        <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <!-- Node text stays readable on a phone: below this width the drawing scrolls sideways. -->
        <ScrollFrame label={m.treeScroller}>
          <div class="min-w-xl">
            <TreeView
              {roots}
              binary
              ariaLabel={m.treeAria(frame)}
              labelOf={nodeLabel}
              speed={player.speed}
            />
          </div>
        </ScrollFrame>
        {#if coverSpans.length > 0}
          <p class="mt-2 font-mono text-sm text-slate-700" data-testid="cover-line">
            {m.coverLine(coverSpans, frame.tree, frame.merge)}
          </p>
        {/if}
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>
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
          <dt class="text-xs text-slate-500">{m.stats.visits}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.visits}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.merges}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.merges}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">
            {shownQuery ? shownQuery.r - shownQuery.l + 1 : m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.result === null ? m.pending : m.show(frame.result)}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={segmentPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
