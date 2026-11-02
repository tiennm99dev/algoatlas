<script>
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    BLOCK_MAX_N,
    MAX_BLOCK_OPS,
    MAX_VALUE,
    MIN_VALUE,
    blocksPseudocode,
    blocksTrace,
    defaultBlockSize,
    parseValues,
  } from '$lib/algo-engine/sqrt-decomposition.js';
  import { en as m } from '$lib/lessons/sqrt-decomposition/copy.en.js';

  /** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').BlockFrame} BlockFrame */
  /** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').BlockOp} BlockOp */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /**
   * The online half of the lesson: block sums with queries and point updates. The page owns the
   * player and the inputs so they survive a switch to the other half.
   * @type {{
   *   player: ReturnType<typeof import('$lib/player/player.svelte.js').createPlayer<BlockFrame>>,
   *   values: number[],
   *   ops: BlockOp[],
   *   blockSize: number,
   *   controls: import('svelte').Snippet,
   * }}
   */
  let {
    player,
    values = $bindable(),
    ops = $bindable(),
    blockSize = $bindable(),
    controls,
  } = $props();

  // The fields start from what the page kept; later edits flow back through the bindings.
  let valuesText = $state(values.join(', '));
  let sDraft = $state(/** @type {number | null} */ (blockSize));
  // This panel remounts on every switch back, and the array may have shrunk meanwhile.
  const startLast = values.length - 1;
  let r = $state(Math.min(13, startLast));
  let rDraft = $state(/** @type {number | null} */ (Math.min(13, startLast)));
  let l = $state(Math.min(2, startLast));
  let lDraft = $state(/** @type {number | null} */ (Math.min(2, startLast)));
  let index = $state(Math.min(5, startLast));
  let indexDraft = $state(/** @type {number | null} */ (Math.min(5, startLast)));
  let newValue = $state(0);
  let valueDraft = $state(/** @type {number | null} */ (0));
  let anchor = $state(-1);
  let notice = $state({ text: '', at: -1 });

  const frame = $derived(player.frame);
  const n = $derived(frame.items.length);
  const s = $derived(frame.blockSize);
  const narration = $derived(notice.at === player.index ? notice.text : m.describeBlocks(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** Rebuild from the inputs; `at` picks the frame to show. @param {BlockOp[]} next @param {'op'|'end'|'start'} at */
  function rebuild(next, at) {
    notice = { text: '', at: -1 };
    anchor = -1;
    ops = next;
    const frames = blocksTrace(values, blockSize, next);
    player.load(frames);
    if (at === 'end' || (at === 'op' && next.length === 0)) player.seek(frames.length - 1);
    else if (at === 'op') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  function commitValues() {
    const parsed = parseValues(valuesText, BLOCK_MAX_N);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error](BLOCK_MAX_N));
      return;
    }
    values = parsed.values;
    valuesText = values.join(', ');
    const last = values.length - 1;
    // Keep the fields, the block size and the log inside the new array.
    r = rDraft = Math.min(r, last);
    l = lDraft = Math.min(l, r);
    index = indexDraft = Math.min(index, last);
    blockSize = sDraft = Math.min(blockSize, values.length);
    /** @param {BlockOp} op @returns {BlockOp[]} */
    const fit = (op) => {
      if (op.type === 'set') return op.i <= last ? [op] : [];
      return op.l > last ? [] : [{ ...op, r: Math.min(op.r, last) }];
    };
    rebuild(ops.flatMap(fit), 'start');
  }

  function commitBlockSize() {
    if (wholeInRange(sDraft, 1, n)) {
      blockSize = /** @type {number} */ (sDraft);
      rebuild(ops, 'op');
    } else {
      sDraft = blockSize;
      say(m.blockError(n));
    }
  }

  function useRoot() {
    blockSize = sDraft = defaultBlockSize(n);
    rebuild(ops, 'op');
  }

  /** @returns {boolean} Whether both fields hold a valid range. */
  function commitRange() {
    if (
      wholeInRange(lDraft, 0, n - 1) &&
      wholeInRange(rDraft, 0, n - 1) &&
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

  /** @returns {boolean} Whether the field held a valid index. */
  function commitIndex() {
    if (wholeInRange(indexDraft, 0, n - 1)) {
      index = /** @type {number} */ (indexDraft);
      return true;
    }
    indexDraft = index;
    say(m.indexError(n));
    return false;
  }

  /** @returns {boolean} Whether the field held a valid value. */
  function commitValue() {
    if (wholeInRange(valueDraft, MIN_VALUE, MAX_VALUE)) {
      newValue = /** @type {number} */ (valueDraft);
      return true;
    }
    valueDraft = newValue;
    say(m.valueError);
    return false;
  }

  /** @returns {boolean} */
  function roomForOp() {
    if (ops.length < MAX_BLOCK_OPS) return true;
    say(m.logFull);
    return false;
  }

  function queryOp() {
    if (!commitRange() || !roomForOp()) return;
    rebuild([...ops, { type: 'query', l, r }], 'op');
  }

  function setOp() {
    if (!commitIndex() || !commitValue() || !roomForOp()) return;
    rebuild([...ops, { type: 'set', i: index, x: newValue }], 'op');
  }

  /** The action Enter runs in a field; a field that is not listed only commits. */
  const ENTER_ACTIONS = /** @type {Record<string, () => void>} */ ({
    l: queryOp,
    r: queryOp,
    index: setOp,
    value: setOp,
  });

  function undo() {
    if (ops.length > 0) rebuild(ops.slice(0, -1), 'end');
  }

  function reset() {
    if (ops.length > 0) rebuild([], 'end');
  }

  /** Two picks run a query: the first anchors, the second closes. @param {number} i */
  function pick(i) {
    if (anchor < 0) {
      anchor = i;
      say(m.pickFirst(i));
      return;
    }
    const from = Math.min(anchor, i);
    const to = Math.max(anchor, i);
    l = lDraft = from;
    r = rDraft = to;
    if (roomForOp()) rebuild([...ops, { type: 'query', l: from, r: to }], 'op');
    else anchor = -1;
  }

  const query = $derived(frame.op?.type === 'query' ? frame.op : null);

  /** @param {number} i */
  const blockIn = (i) => Math.floor(i / s);

  /** @param {number} i @returns {VisualState} */
  function stateA(i) {
    if ((frame.kind === 'build' || frame.kind === 'set') && i === frame.at) return 'swap';
    if (frame.kind === 'read-cell' && i === frame.at) return 'compare';
    if (frame.readBlocks.includes(blockIn(i))) return 'sorted';
    if (frame.readCells.includes(i)) return 'path';
    return query && i >= query.l && i <= query.r ? 'frontier' : '';
  }

  /** @param {number} i */
  function markerA(i) {
    const st = stateA(i);
    if (st === 'swap') return m.markers.write;
    if (st === 'compare') return m.markers.read;
    if (st === 'sorted') return m.markers.block;
    return st === 'path' ? m.markers.cell : '';
  }

  /** @param {number} b @returns {VisualState} */
  function stateB(b) {
    if ((frame.kind === 'build' || frame.kind === 'set') && b === frame.block) return 'swap';
    return frame.readBlocks.includes(b) ? 'sorted' : '';
  }

  /** @param {number} b */
  function markerB(b) {
    const st = stateB(b);
    if (st === 'swap') return m.markers.write;
    return st === 'sorted' ? m.markers.block : '';
  }

  const windows = $derived(
    frame.sums.map((_, b) => ({
      from: b * s,
      to: Math.min(n, (b + 1) * s),
      label: m.blockName(b),
    })),
  );

  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));

  const legend = /** @type {[VisualState, string][]} */ ([
    ['frontier', m.legend.range],
    ['compare', m.legend.read],
    ['path', m.legend.cell],
    ['sorted', m.legend.block],
    ['swap', m.legend.write],
  ]);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
  class="mb-4 flex flex-wrap items-end gap-4"
  onkeydown={(e) => enterField(e, ENTER_ACTIONS, () => notice)}
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
    {m.blockLabel}
    <input
      type="number"
      name="block"
      min="1"
      max={n}
      step="1"
      class="field w-20"
      bind:value={sDraft}
      onchange={commitBlockSize}
    />
  </label>
  <button type="button" onclick={useRoot} class="btn-outline">{m.rootButton}</button>
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
  <button type="submit" class="btn-primary">{m.queryButton}</button>
  <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
    {m.indexLabel}
    <input
      type="number"
      name="index"
      min="0"
      max={n - 1}
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
  <button type="button" onclick={setOp} class="btn-secondary">{m.setButton}</button>
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
        {m.arrayTitle}
      </h2>
      <ArrayStrip
        values={frame.items}
        ariaLabel={m.arrayAria(s)}
        stateOf={stateA}
        markerOf={markerA}
        labelOf={(i) => m.cellLabel(i, frame.items[i], blockIn(i))}
        {windows}
        onselect={pick}
        selected={anchor}
        speed={player.speed}
      />
      <p class="mt-1 text-xs text-slate-500">{m.pickHint}</p>

      <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.sumsTitle}
      </h2>
      <ArrayStrip
        values={frame.sums}
        ariaLabel={m.sumsAria}
        stateOf={stateB}
        markerOf={markerB}
        labelOf={(b) => m.sumLabel(b, frame.sums[b])}
        speed={player.speed}
      />

      <p class="mt-2 font-mono text-sm text-slate-700" data-testid="trade-off">
        {m.tradeOff(n, s, frame.worst)}
      </p>
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
        <dt class="text-xs text-slate-500">{m.stats.scan}</dt>
        <dd class="text-2xl font-bold text-slate-500 tabular-nums">{frame.scan || m.pending}</dd>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <dt class="text-xs text-slate-500">{m.stats.total}</dt>
        <dd class="text-2xl font-bold tabular-nums">{query ? m.show(frame.total) : m.pending}</dd>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <dt class="text-xs text-slate-500">{m.stats.worst}</dt>
        <dd class="text-2xl font-bold text-slate-500 tabular-nums">{frame.worst}</dd>
      </div>
    </dl>
    <ChipList
      title={m.opsTitle}
      items={chips}
      emptyText={m.opsEmpty}
      limit={MAX_BLOCK_OPS}
      hotLabel={m.opsHotLabel}
    />
    <CodePanel lines={blocksPseudocode} active={frame.lines} />
  </div>
  <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
    {@render controls()}
  </div>
</div>
