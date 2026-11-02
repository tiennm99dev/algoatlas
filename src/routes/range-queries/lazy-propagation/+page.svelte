<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_OPS,
    MAX_VALUE,
    MIN_VALUE,
    lazyPseudocode,
    lazyTrace,
    parseLazyValues,
  } from '$lib/algo-engine/lazy-propagation.js';
  import { en as m } from '$lib/lessons/lazy-propagation/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/lazy-propagation.js').LazyOp} LazyOp */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [1, 2, 3, 4, 5, 6, 7, 8];
  const INITIAL_OPS = /** @type {LazyOp[]} */ ([
    { type: 'add', l: 0, r: 7, x: 5 },
    { type: 'add', l: 4, r: 7, x: 2 },
    { type: 'query', l: 5, r: 5 },
  ]);

  let values = $state.raw(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  /** @type {LazyOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let l = $state(2);
  /** @type {number | null} */
  let lDraft = $state(2);
  let r = $state(5);
  /** @type {number | null} */
  let rDraft = $state(5);
  let x = $state(3);
  /** @type {number | null} */
  let xDraft = $state(3);
  let anchor = $state(-1);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(lazyTrace(INITIAL, INITIAL_OPS));
  // Open on the first update: the build is one step back, and the tags are the lesson.
  player.seek(player.frames.findIndex((f) => f.opIndex === 0));
  const frame = $derived(player.frame);
  const n = $derived(frame.items.length);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** Replace the log and rebuild. @param {LazyOp[]} next @param {boolean} [toLast]  Go to the last operation's first step, or else to the end. */
  function setOps(next, toLast = true) {
    notice = { text: '', at: -1 };
    anchor = -1;
    ops = next;
    const frames = lazyTrace(values, next);
    player.load(frames);
    if (toLast && next.length > 0) {
      player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
    } else {
      player.seek(frames.length - 1);
    }
  }

  function commitValues() {
    const parsed = parseLazyValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    values = parsed.values;
    valuesText = values.join(', ');
    const last = values.length - 1;
    // Keep the fields and the log inside the new array.
    r = rDraft = Math.min(r, last);
    l = lDraft = Math.min(l, r);
    setOps(
      ops.flatMap((op) => (op.l > last ? [] : [{ ...op, r: Math.min(op.r, last) }])),
      false,
    );
  }

  /** @returns {boolean} Whether both fields hold a valid range. */
  function commitRange() {
    const last = n - 1;
    if (
      whole(lDraft, 0, last) &&
      whole(rDraft, 0, last) &&
      /** @type {number} */ (lDraft) <= /** @type {number} */ (rDraft)
    ) {
      l = /** @type {number} */ (lDraft);
      r = /** @type {number} */ (rDraft);
      return true;
    }
    lDraft = l;
    rDraft = r;
    say(m.rangeError(n));
    return false;
  }

  /** @returns {boolean} Whether the field held a valid value. */
  function commitX() {
    if (whole(xDraft, MIN_VALUE, MAX_VALUE)) {
      x = /** @type {number} */ (xDraft);
      return true;
    }
    xDraft = x;
    say(m.xError);
    return false;
  }

  /** @returns {boolean} */
  function roomForOp() {
    if (ops.length < MAX_OPS) return true;
    say(m.logFull);
    return false;
  }

  function addOp() {
    if (!commitRange() || !commitX() || !roomForOp()) return;
    setOps([...ops, { type: 'add', l, r, x }]);
  }

  function queryOp() {
    if (!commitRange() || !roomForOp()) return;
    setOps([...ops, { type: 'query', l, r }]);
  }

  function undo() {
    if (ops.length === 0) return;
    setOps(ops.slice(0, -1), false);
  }

  function reset() {
    if (ops.length === 0) return;
    setOps([], false);
  }

  /** Two picks fill the range fields: the first anchors, the second closes. @param {number} i */
  function pick(i) {
    if (anchor < 0) {
      anchor = i;
      say(m.pickFirst(i));
      return;
    }
    l = lDraft = Math.min(anchor, i);
    r = rDraft = Math.max(anchor, i);
    say(m.picked(l, r));
    anchor = -1;
  }

  /** The state and marker of node v, before its tag. @param {number} v @returns {{ state: VisualState, marker: string, name: string }} */
  function look(v) {
    const hot = frame.node === v;
    if (frame.pushedTo.includes(v)) {
      return { state: 'swap', marker: m.markers.write, name: m.states.received };
    }
    if (hot && frame.kind === 'push') {
      return { state: 'active', marker: m.markers.push, name: m.states.pushing };
    }
    if (hot && (frame.kind === 'pull' || frame.kind === 'return')) {
      return { state: 'active', marker: m.markers.merge, name: m.states.merged };
    }
    if (hot && (frame.kind === 'build-leaf' || frame.kind === 'build-pull')) {
      return { state: 'swap', marker: m.markers.write, name: m.states.written };
    }
    if (frame.covered.includes(v)) {
      return { state: 'sorted', marker: m.markers.cover, name: m.states.cover };
    }
    if (frame.outside.includes(v)) {
      return { state: 'visited', marker: m.markers.outside, name: m.states.outside };
    }
    if (frame.split.includes(v)) {
      return { state: 'compare', marker: m.markers.split, name: m.states.split };
    }
    if (frame.tag[v] !== 0) return { state: 'frontier', marker: '', name: m.states.pending };
    return { state: '', marker: '', name: '' };
  }

  const spanOf = $derived(new Map(frame.spans.map((s) => [s.v, s])));

  /** @param {number} v @returns {TreeNode | null} */
  function nodeOf(v) {
    const span = spanOf.get(v);
    if (!span) return null;
    const value = frame.sum[v];
    const { state, marker } = look(v);
    const tag = frame.tag[v];
    return {
      id: v,
      label: value === null ? m.unbuilt : m.show(value),
      state,
      marker: `${marker}${tag !== 0 ? m.tagText(tag) : ''}`,
      note: span.lo === span.hi ? `[${span.lo}]` : `[${span.lo},${span.hi}]`,
      children: span.lo === span.hi ? [] : [nodeOf(2 * v), nodeOf(2 * v + 1)],
    };
  }

  const roots = $derived([/** @type {TreeNode} */ (nodeOf(1))]);

  /** @param {TreeNode} node */
  function nodeLabel(node) {
    const v = /** @type {number} */ (node.id);
    const span = spanOf.get(v);
    return m.nodeLabel(span?.lo ?? 0, span?.hi ?? 0, node.label, frame.tag[v], look(v).name);
  }

  /** @param {number} i */
  const isStale = (i) => frame.leaves[i] !== frame.items[i];
  const staleCount = $derived(frame.items.filter((_, i) => isStale(i)).length);

  const pending = $derived(
    frame.spans.flatMap((s) =>
      frame.tag[s.v] !== 0 ? [{ label: m.pendingChip(s.lo, s.hi, frame.tag[s.v]) }] : [],
    ),
  );
  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));

  const windows = $derived(
    frame.op ? [{ from: frame.op.l, to: frame.op.r + 1, label: m.opChip(frame.op) }] : [],
  );

  const legend = /** @type {[VisualState, string][]} */ ([
    ['frontier', m.legend.pending],
    ['sorted', m.legend.cover],
    ['compare', m.legend.split],
    ['visited', m.legend.outside],
    ['active', m.legend.merge],
    ['swap', m.legend.write],
  ]);
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field submits the form, which runs the sum query on the range. -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      queryOp();
    }}
  >
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
      {m.lLabel}
      <input
        type="number"
        name="l"
        min="0"
        max={n - 1}
        step="1"
        class="field w-20"
        bind:value={lDraft}
        onchange={commitRange}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.rLabel}
      <input
        type="number"
        name="r"
        min="0"
        max={n - 1}
        step="1"
        class="field w-20"
        bind:value={rDraft}
        onchange={commitRange}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.xLabel}
      <input
        type="number"
        name="x"
        min={MIN_VALUE}
        max={MAX_VALUE}
        step="1"
        class="field w-20"
        bind:value={xDraft}
        onchange={commitX}
      />
    </label>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.queryButton}</button>
      <button type="button" onclick={addOp} class="btn-secondary">{m.addButton}</button>
    </div>
    <div class="flex flex-wrap gap-2 border-l border-slate-300 pl-4">
      <button type="button" onclick={undo} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.undo}</button
      >
      <button type="button" onclick={reset} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.reset}</button
      >
    </div>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <!-- Node text stays readable on a phone: below this width the drawing scrolls sideways. -->
        <ScrollFrame label={m.treeScroller}>
          <div class="min-w-xl">
            <TreeView
              {roots}
              binary
              ariaLabel={m.treeAria(n, pending.length)}
              labelOf={nodeLabel}
              speed={player.speed}
            />
          </div>
        </ScrollFrame>

        <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.arrayTitle}
        </h2>
        <ArrayStrip
          values={frame.items}
          ariaLabel={m.arrayAria}
          labelOf={(i) => m.cellLabel('a', i, frame.items[i], '')}
          {windows}
          onselect={pick}
          selected={anchor}
          speed={player.speed}
        />
        <p class="mt-1 text-xs text-slate-500">{m.pickHint}</p>

        <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.leavesTitle}
        </h2>
        <ArrayStrip
          values={frame.leaves}
          ariaLabel={m.leavesAria(staleCount)}
          stateOf={(i) => (isStale(i) ? 'frontier' : '')}
          markerOf={(i) => (isStale(i) ? m.markers.stale : '')}
          labelOf={(i) => m.cellLabel('leaf', i, frame.leaves[i], isStale(i) ? m.states.stale : '')}
          speed={player.speed}
        />

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
          <dt class="text-xs text-slate-500">{m.stats.pushes}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.pushes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.writes}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.writes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.eager}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">
            {frame.eager || m.pending}
          </dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.result === null ? m.pending : m.show(frame.result)}
          </dd>
        </div>
      </dl>
      <ChipList title={m.pendingTitle} items={pending} emptyText={m.opsEmpty} limit={23} />
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={lazyPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
