<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    SPARSE_OPS,
    parseSparseValues,
    sparsePseudocode,
    sparseTrace,
  } from '$lib/algo-engine/sparse-table.js';
  import { en as m } from '$lib/lessons/sparse-table/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/sparse-table.js').SparseOp} SparseOp */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [5, 2, 4, 7, 1, 3, 6, 8];
  const INITIAL_L = 1;
  const INITIAL_R = 6;

  let op = $state(/** @type {SparseOp} */ ('min'));
  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let l = $state(INITIAL_L);
  let r = $state(INITIAL_R);
  /** @type {number | null} */
  let lDraft = $state(INITIAL_L);
  /** @type {number | null} */
  let rDraft = $state(INITIAL_R);
  let anchor = $state(-1);
  /** @type {{ k: number, i: number } | null} */
  let inspected = $state(null);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(sparseTrace(INITIAL, INITIAL_L, INITIAL_R, 'min'));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  const opOptions = SPARSE_OPS.map((value) => ({ value, label: m.ops[value] }));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** Rebuild the trace; a new range jumps straight to its query. @param {boolean} [toQuery] */
  function rebuild(toQuery = false) {
    notice = { text: '', at: -1 };
    anchor = -1;
    const frames = sparseTrace(values, l, r, op);
    player.load(frames);
    if (toQuery) player.seek(frames.findIndex((f) => f.kind === 'pick-k'));
  }

  function commitValues() {
    const parsed = parseSparseValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    values = parsed.values;
    valuesText = values.join(', ');
    // Keep the range inside the new array.
    r = rDraft = Math.min(r, values.length - 1);
    l = lDraft = Math.min(l, r);
    inspected = null;
    rebuild();
  }

  function commitRange() {
    const last = values.length - 1;
    if (
      whole(lDraft, 0, last) &&
      whole(rDraft, 0, last) &&
      /** @type {number} */ (lDraft) <= /** @type {number} */ (rDraft)
    ) {
      l = /** @type {number} */ (lDraft);
      r = /** @type {number} */ (rDraft);
      rebuild(true);
    } else {
      lDraft = l;
      rDraft = r;
      say(m.rangeError(values.length));
    }
  }

  /** Two picks make a range: the first click anchors it, the second closes it. @param {number} i */
  function pick(i) {
    if (anchor < 0) {
      anchor = i;
      say(m.pickFirst(i));
      return;
    }
    l = lDraft = Math.min(anchor, i);
    r = rDraft = Math.max(anchor, i);
    rebuild(true);
  }

  /** @param {number} k @param {number} i */
  const fits = (k, i) => i + (1 << k) <= frame.items.length;

  /** @param {number} k @param {number} i */
  function inspect(k, i) {
    if (!fits(k, i)) {
      inspected = null;
      say(m.noBlockNotice(k, i, frame.items.length));
      return;
    }
    inspected = { k, i };
  }

  const size = $derived(frame.level >= 0 ? 1 << frame.level : 0);
  const querying = $derived(frame.at < 0 && frame.level >= 0 && frame.kind !== 'base');

  /** @param {number} i */
  const inLeft = (i) => frame.leftAt >= 0 && i >= frame.leftAt && i < frame.leftAt + size;
  /** @param {number} i */
  const inRight = (i) => frame.rightAt >= 0 && i >= frame.rightAt && i < frame.rightAt + size;

  /** @param {number} i @returns {VisualState} */
  function stateA(i) {
    if (inLeft(i) && inRight(i)) return 'swap';
    if (inLeft(i) || inRight(i)) return 'sorted';
    if (querying && i >= frame.l && i <= frame.r) return 'frontier';
    if (frame.kind === 'cell' && i >= frame.at && i < frame.at + size) return 'compare';
    return '';
  }

  /** @param {number} i */
  function markerA(i) {
    if (inLeft(i) && inRight(i)) return m.markers.both;
    if (inLeft(i)) return m.markers.left;
    return inRight(i) ? m.markers.right : '';
  }

  /** @param {number} i */
  function nameA(i) {
    if (inLeft(i) && inRight(i)) return m.states.both;
    if (inLeft(i)) return m.states.left;
    if (inRight(i)) return m.states.right;
    return stateA(i) === 'frontier' ? m.states.range : '';
  }

  const windows = $derived.by(() => {
    const out = [];
    if (frame.kind === 'cell') {
      out.push({ from: frame.at, to: frame.at + size, label: m.blockWindow(frame.level) });
    }
    if (frame.kind === 'pick-k') {
      out.push({ from: frame.l, to: frame.r + 1, label: m.rangeWindow(frame.l, frame.r) });
    }
    if (frame.leftAt >= 0) {
      out.push({
        from: frame.leftAt,
        to: frame.leftAt + size,
        label: m.markers.left,
      });
    }
    if (frame.rightAt >= 0 && frame.rightAt !== frame.leftAt) {
      out.push({
        from: frame.rightAt,
        to: frame.rightAt + size,
        label: m.markers.right,
      });
    }
    if (inspected && fits(inspected.k, inspected.i)) {
      out.push({
        from: inspected.i,
        to: inspected.i + (1 << inspected.k),
        label: m.inspectWindow(inspected.k, inspected.i),
      });
    }
    return out;
  });

  /** @param {number} k @param {number} i @returns {VisualState} */
  function stateT(k, i) {
    if (frame.kind === 'cell') {
      if (k === frame.level && i === frame.at) return 'swap';
      if (k === frame.level - 1 && (i === frame.at || i === frame.at + size / 2)) return 'compare';
      return '';
    }
    if (k !== frame.level) return '';
    return i === frame.leftAt || i === frame.rightAt ? 'sorted' : '';
  }

  /** @param {number} k @param {number} i */
  function markerT(k, i) {
    if (frame.kind === 'cell' || k !== frame.level) return '';
    if (i === frame.leftAt && i === frame.rightAt) return m.markers.left + m.markers.right;
    if (i === frame.leftAt) return m.markers.left;
    return i === frame.rightAt ? m.markers.right : '';
  }

  /** @param {number} k @param {number} i */
  function nameT(k, i) {
    const s = stateT(k, i);
    if (s === 'swap') return m.states.target;
    if (s === 'compare') return m.states.source;
    return s === 'sorted' ? m.states.read : '';
  }

  const cells = $derived(
    frame.table.map((row, k) => row.map((v, i) => (fits(k, i) ? v : m.noBlock))),
  );
  const arrows = $derived(
    frame.kind === 'cell'
      ? [
          {
            from: /** @type {[number, number]} */ ([frame.level - 1, frame.at]),
            to: /** @type {[number, number]} */ ([frame.level, frame.at]),
          },
          {
            from: /** @type {[number, number]} */ ([frame.level - 1, frame.at + size / 2]),
            to: /** @type {[number, number]} */ ([frame.level, frame.at]),
          },
        ]
      : [],
  );

  const legend = /** @type {[VisualState, string][]} */ ([
    ['frontier', m.legend.range],
    ['swap', m.legend.write],
    ['compare', m.legend.source],
    ['sorted', m.legend.block],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
    }}
  >
    <SegmentedControl
      legend={m.opLegend}
      name="op"
      options={opOptions}
      bind:value={op}
      onchange={() => rebuild(true)}
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
      {m.lLabel}
      <input
        type="number"
        name="l"
        min="0"
        max={values.length - 1}
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
        max={values.length - 1}
        step="1"
        class="field w-20"
        bind:value={rDraft}
        onchange={commitRange}
      />
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.arrayTitle}
        </h2>
        <ArrayStrip
          values={frame.items}
          ariaLabel={m.arrayAria}
          stateOf={stateA}
          markerOf={markerA}
          labelOf={(i) => m.cellLabel(i, frame.items[i], nameA(i))}
          {windows}
          onselect={pick}
          selected={anchor}
          speed={player.speed}
        />
        <p class="mt-1 text-xs text-slate-500">{m.pickHint}</p>

        <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <DpTable
          values={cells}
          ariaLabel={m.tableAria}
          rowHeaders={frame.table.map((_, k) => m.rowHeader(k))}
          colHeaders={frame.items.map((_, i) => String(i))}
          stateOf={stateT}
          markerOf={markerT}
          labelOf={(k, i) => m.tableCellLabel(k, i, frame.table[k][i], fits(k, i), nameT(k, i))}
          {arrows}
          onselect={inspect}
          selected={inspected ? [inspected.k, inspected.i] : null}
          speed={player.speed}
        />
        <p class="mt-1 text-xs text-slate-500">{m.tableHint}</p>
        {#if inspected}
          <p class="mt-2 font-mono text-sm text-slate-700" data-testid="inspect-line">
            {m.inspectLine(
              inspected.k,
              inspected.i,
              frame.table[inspected.k]?.[inspected.i] ?? null,
              frame.op,
            )}
          </p>
        {/if}
        {#if frame.result !== null}
          <p class="mt-2 font-mono text-sm text-slate-700 tabular-nums" data-testid="result-line">
            {m.resultLine(frame)}
          </p>
        {/if}

        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>
              {st === 'swap' ? `${label}; ${m.legend.both}` : label}
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
          <dt class="text-xs text-slate-500">{m.stats.filled}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.filled}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.merges}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.merges}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.reads}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.reads}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{frame.r - frame.l + 1}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.result ?? m.pending}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.truth}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{frame.truth}</dd>
        </div>
      </dl>

      <CodePanel lines={sparsePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
