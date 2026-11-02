<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_OPS,
    MAX_VALUE,
    MIN_VALUE,
    blockStart,
    fenwickPseudocode,
    fenwickTrace,
    lowbit,
    parseFenwickValues,
  } from '$lib/algo-engine/fenwick-tree.js';
  import { en as m } from '$lib/lessons/fenwick-tree/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import FenwickArcs from './fenwick-arcs.svelte';

  /** @typedef {import('$lib/algo-engine/fenwick-tree.js').FenwickOp} FenwickOp */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [3, 1, 4, 1, 5, 9, 2, 6];
  const INITIAL_OPS = /** @type {FenwickOp[]} */ ([
    { type: 'prefix', i: 7 },
    { type: 'add', i: 3, delta: 5 },
    { type: 'range', l: 3, r: 7 },
  ]);

  let values = $state.raw(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  /** @type {FenwickOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let index = $state(5);
  /** @type {number | null} */
  let indexDraft = $state(5);
  let from = $state(2);
  /** @type {number | null} */
  let fromDraft = $state(2);
  let delta = $state(3);
  /** @type {number | null} */
  let deltaDraft = $state(3);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(fenwickTrace(INITIAL, INITIAL_OPS));
  // Open on the first operation: the build is one step back, and the arcs are the lesson.
  player.seek(player.frames.findIndex((f) => f.opIndex === 0));
  const frame = $derived(player.frame);
  const n = $derived(frame.t.length - 1);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, n));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {FenwickOp[]} next @param {boolean} [toLast]  Jump to the last operation's first step. */
  function setOps(next, toLast = true) {
    notice = { text: '', at: -1 };
    ops = next;
    const frames = fenwickTrace(values, next);
    player.load(frames);
    if (toLast && next.length > 0) {
      player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
    } else if (!toLast) {
      player.seek(frames.length - 1);
    }
  }

  function commitValues() {
    const parsed = parseFenwickValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    values = parsed.values;
    valuesText = values.join(', ');
    const size = values.length;
    // Keep the fields and the log inside the new array.
    index = indexDraft = Math.min(index, size);
    from = fromDraft = Math.min(from, size);
    notice = { text: '', at: -1 };
    ops = ops.filter((op) => (op.type === 'range' ? op.r <= size : op.i <= size));
    player.load(fenwickTrace(values, ops));
  }

  /** @returns {boolean} Whether the field held a valid value. */
  function commitIndex() {
    if (whole(indexDraft, 1, n)) {
      index = /** @type {number} */ (indexDraft);
      return true;
    }
    indexDraft = index;
    say(m.indexError(n));
    return false;
  }

  /** @returns {boolean} Whether the field held a valid value. */
  function commitFrom() {
    if (whole(fromDraft, 1, n)) {
      from = /** @type {number} */ (fromDraft);
      return true;
    }
    fromDraft = from;
    say(m.indexError(n));
    return false;
  }

  /** @returns {boolean} Whether the field held a valid value. */
  function commitDelta() {
    if (whole(deltaDraft, MIN_VALUE, MAX_VALUE)) {
      delta = /** @type {number} */ (deltaDraft);
      return true;
    }
    deltaDraft = delta;
    say(m.deltaError);
    return false;
  }

  /** @returns {boolean} */
  function roomForOp() {
    if (ops.length < MAX_OPS) return true;
    say(m.logFull);
    return false;
  }

  function addOp() {
    if (!commitIndex() || !commitDelta() || !roomForOp()) return;
    setOps([...ops, { type: 'add', i: index, delta }]);
  }

  function prefixOp() {
    if (!commitIndex() || !roomForOp()) return;
    setOps([...ops, { type: 'prefix', i: index }]);
  }

  function rangeOp() {
    if (!commitIndex() || !commitFrom()) return;
    if (from > index) {
      say(m.rangeError);
      return;
    }
    if (!roomForOp()) return;
    setOps([...ops, { type: 'range', l: from, r: index }]);
  }

  function undo() {
    if (ops.length === 0) return;
    setOps(ops.slice(0, -1), false);
  }

  function reset() {
    if (ops.length === 0) return;
    setOps([], false);
  }

  /** The action Enter runs in a field; a field that is not listed only commits. */
  const ENTER_ACTIONS = /** @type {Record<string, () => void>} */ ({
    index: prefixOp,
    delta: addOp,
    from: rangeOp,
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

  /** @param {number} i */
  function pick(i) {
    index = indexDraft = i;
    say(m.picked(i, n));
  }

  const acting = $derived(frame.opIndex >= 0 || frame.kind.startsWith('build'));

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (frame.kind === 'build-self' && i === frame.cursor) return 'swap';
    if (frame.kind === 'build-push') {
      if (i === frame.to) return 'swap';
      if (i === frame.from) return 'compare';
      return '';
    }
    if (frame.kind === 'add-visit' && i === frame.cursor) return 'swap';
    if (frame.kind === 'query-visit' && i === frame.cursor) return 'compare';
    if (acting && frame.cursor === i && frame.opIndex >= 0) return 'active';
    return frame.visited.includes(i) ? 'path' : '';
  }

  /** @param {number} i */
  function markerOf(i) {
    const s = stateOf(i);
    if (s === 'swap') return m.markers.write;
    if (s === 'compare') return m.markers.read;
    if (s === 'active') return m.markers.cursor;
    return s === 'path' ? m.markers.done : '';
  }

  /** @param {number} i */
  function labelOf(i) {
    const s = stateOf(i);
    return m.cellLabel(i, frame.t[i], blockStart(i), s ? m.states[s] : '');
  }

  // The jumps made so far by this operation, plus the one being taken now.
  const arcs = $derived.by(() => {
    const op = frame.op;
    /** @type {Record<string, { from: number, to: number, hot: boolean }>} */
    const out = {};
    if (op) {
      const dir = op.type === 'add' ? 1 : -1;
      frame.visited.forEach((v, k) => {
        const moved = k < frame.visited.length - 1 || !frame.kind.endsWith('-visit');
        const to = v + dir * lowbit(v);
        if (moved) out[`${v}-${to}`] = { from: v, to, hot: false };
      });
    }
    if (frame.from > 0) {
      out[`${frame.from}-${frame.to}`] = { from: frame.from, to: frame.to, hot: true };
    }
    return Object.values(out);
  });

  const bitsLine = $derived(
    frame.cursor >= 1 && frame.cursor <= n && frame.opIndex >= 0 ? m.bitsLine(frame.cursor) : '',
  );
  const opChips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));
  const visitedChips = $derived(frame.visited.map((v) => ({ label: `t[${v}]` })));
  const plain = $derived(m.plainCost(frame.op, n));

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', m.legend.cursor],
    ['compare', m.legend.read],
    ['swap', m.legend.write],
    ['path', m.legend.path],
  ]);
</script>

<LessonLayout lesson={m}>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={enterField}
    onsubmit={(e) => {
      e.preventDefault();
      prefixOp();
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
      {m.indexLabel}
      <input
        type="number"
        name="index"
        min="1"
        max={n}
        step="1"
        class="field w-20"
        bind:value={indexDraft}
        onchange={commitIndex}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.deltaLabel}
      <input
        type="number"
        name="delta"
        min={MIN_VALUE}
        max={MAX_VALUE}
        step="1"
        class="field w-20"
        bind:value={deltaDraft}
        onchange={commitDelta}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fromLabel}
      <input
        type="number"
        name="from"
        min="1"
        max={n}
        step="1"
        class="field w-20"
        bind:value={fromDraft}
        onchange={commitFrom}
      />
    </label>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.prefixButton}</button>
      <button type="button" onclick={addOp} class="btn-secondary">{m.addButton}</button>
      <button type="button" onclick={rangeOp} class="btn-secondary">{m.rangeButton}</button>
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
        <FenwickArcs
          a={frame.a}
          t={frame.t}
          {arcs}
          {stateOf}
          {markerOf}
          {labelOf}
          ariaLabel={m.treeAria}
          barLabel={(i) => `t[${i}]`}
          stopLow={m.stopLow}
          stopHigh={m.stopHigh}
          valuesName={m.valuesName}
          treeName={m.treeName}
          onselect={pick}
          selected={index}
          speed={player.speed}
        />
        <p class="mt-1 text-xs text-slate-500">{m.pickHint}</p>
        {#if bitsLine}
          <p class="mt-2 font-mono text-sm text-slate-700" data-testid="bits-line">{bitsLine}</p>
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
          <dt class="text-xs text-slate-500">{m.stats.reads}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.reads}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.writes}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.writes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{plain.label}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{plain.cost}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.sum}</dt>
          <dd class="text-2xl font-bold tabular-nums">{m.sumShown(frame)}</dd>
        </div>
      </dl>
      <ChipList
        title={m.opsTitle}
        items={opChips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <ChipList title={m.visitedTitle} items={visitedChips} emptyText={m.opsEmpty} limit={16} />
      <CodePanel lines={fenwickPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
