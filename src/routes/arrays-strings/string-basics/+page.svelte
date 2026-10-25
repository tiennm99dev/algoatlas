<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    JOIN_MODES,
    MAX_CAPACITY,
    MAX_PIECES,
    MIN_CAPACITY,
    inspectText,
    joinCost,
    joinPseudocode,
    joinTrace,
    parsePieces,
  } from '$lib/algo-engine/string-basics.js';
  import { en as m } from '$lib/lessons/string-basics/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/string-basics.js').JoinMode} JoinMode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @type {Record<keyof typeof m.presets, string[]>} */
  const PRESETS = {
    letters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
    words: ['The', 'quick', 'brown', 'fox', 'jumps'],
    vietnamese: ['Xin', 'chào', 'các', 'bạn'],
  };
  const presetKeys = /** @type {(keyof typeof m.presets)[]} */ (Object.keys(PRESETS));

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = PRESETS.letters;
  const INITIAL_CAPACITY = 4;
  // ệ is written as an escape so the text is the single precomposed code point U+1EC7.
  const INITIAL_INSPECT = 'Việt \u{1F600}';

  let mode = $state(/** @type {JoinMode} */ ('concat'));
  let pieces = $state(INITIAL);
  let piecesText = $state(INITIAL.join(' '));
  let capacity = $state(INITIAL_CAPACITY);
  /** @type {number | null} */
  let capacityDraft = $state(INITIAL_CAPACITY);
  let notice = $state({ text: '', at: -1 });
  let inspectDraft = $state(INITIAL_INSPECT);
  let inspected = $state(INITIAL_INSPECT);
  let inspectError = $state('');

  const player = createPlayer(joinTrace('concat', INITIAL, INITIAL_CAPACITY));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const other = $derived(
    joinCost(frame.mode === 'concat' ? 'builder' : 'concat', frame.pieces, capacity),
  );
  const info = $derived(inspectText(inspected));

  const modeOptions = JOIN_MODES.map((v) => ({ value: v, label: m.modes[v] }));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(joinTrace(mode, pieces, capacity));
  }

  function commitPieces() {
    const parsed = parsePieces(piecesText);
    if ('error' in parsed) {
      piecesText = pieces.join(' ');
      say(m.pieceErrors[parsed.error]);
      return;
    }
    pieces = parsed.pieces;
    piecesText = pieces.join(' ');
    rebuild();
  }

  function commitCapacity() {
    if (whole(capacityDraft, MIN_CAPACITY, MAX_CAPACITY)) {
      capacity = /** @type {number} */ (capacityDraft);
      rebuild();
    } else {
      capacityDraft = capacity;
      say(m.capacityError);
    }
  }

  /** @param {keyof typeof m.presets} key */
  function preset(key) {
    pieces = PRESETS[key];
    piecesText = pieces.join(' ');
    rebuild();
  }

  function commitInspect() {
    const r = inspectText(inspectDraft);
    if ('error' in r) {
      inspectError = m.inspectErrors[r.error];
      inspectDraft = inspected;
      return;
    }
    inspectError = '';
    inspected = inspectDraft;
  }

  /** @param {[number, number] | null} range @param {number} i */
  const inRange = (range, i) => range !== null && i >= range[0] && i < range[1];

  /** The block the frame writes into: `next` when it exists, else `cells`. */
  const writesNext = $derived(frame.next !== null);

  /** @param {number} i @returns {VisualState} */
  function stateA(i) {
    if (inRange(frame.read, i)) return 'compare';
    if (!writesNext && inRange(frame.wrote, i)) return 'swap';
    return '';
  }
  /** @param {number} i @returns {VisualState} */
  const stateB = (i) => (writesNext && inRange(frame.wrote, i) ? 'swap' : '');

  /** @param {VisualState} s */
  const markerFor = (s) =>
    s === 'compare' ? m.markers.read : s === 'swap' ? m.markers.written : '';
  /** @param {VisualState} s */
  const stateName = (s) => (s === 'compare' ? m.states.read : s === 'swap' ? m.states.written : '');

  /** @param {(string | null)[]} cells */
  const shown = (cells) => cells.map((c) => (c === null ? m.spare : c));

  const titleA = $derived(frame.mode === 'concat' ? m.blocks.s : m.blocks.buffer);
  const titleB = $derived(
    frame.mode === 'concat'
      ? m.blocks.t
      : frame.kind === 'build' || frame.kind === 'done'
        ? m.blocks.result
        : m.blocks.newBuffer,
  );
  const nextLength = $derived(frame.next ? frame.next.filter((c) => c !== null).length : 0);

  const pieceChips = $derived(frame.pieces.map((p, k) => ({ label: p, hot: k === frame.piece })));
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitPieces();
    }}
  >
    <SegmentedControl
      legend={m.modeLegend}
      name="mode"
      options={modeOptions}
      bind:value={mode}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.piecesLabel}
      <input
        type="text"
        name="pieces"
        class="field w-64 max-w-full"
        bind:value={piecesText}
        onchange={commitPieces}
      />
    </label>
    {#if mode === 'builder'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.capacityLabel}
        <input
          type="number"
          name="capacity"
          min={MIN_CAPACITY}
          max={MAX_CAPACITY}
          step="1"
          class="field w-24"
          bind:value={capacityDraft}
          onchange={commitCapacity}
        />
      </label>
    {/if}
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.presetsLegend}
      </legend>
      <div class="flex flex-wrap gap-2">
        {#each presetKeys as key (key)}
          <button type="button" class="btn-secondary" onclick={() => preset(key)}>
            {m.presets[key]}
          </button>
        {/each}
      </div>
    </fieldset>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {titleA}
        </h2>
        {#if frame.capacity === 0}
          <p class="text-sm text-slate-600">{m.emptyString}</p>
        {:else}
          <p class="mb-2 font-mono text-xs text-slate-600 tabular-nums">
            {m.blockLine(frame.length, frame.capacity)}
          </p>
          <ArrayStrip
            values={shown(frame.cells)}
            ariaLabel={m.blockAria(titleA)}
            stateOf={stateA}
            markerOf={(i) => markerFor(stateA(i))}
            labelOf={(i) => m.cellLabel(i, frame.cells[i], stateName(stateA(i)))}
            dimmed={(i) => frame.cells[i] === null}
            speed={player.speed}
          />
        {/if}
        {#if frame.next}
          <h2 class="mt-4 mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {titleB}
          </h2>
          <p class="mb-2 font-mono text-xs text-slate-600 tabular-nums">
            {m.blockLine(nextLength, frame.next.length)}
          </p>
          <ArrayStrip
            values={shown(frame.next)}
            ariaLabel={m.blockAria(titleB)}
            stateOf={stateB}
            markerOf={(i) => markerFor(stateB(i))}
            labelOf={(i) => m.cellLabel(i, frame.next?.[i] ?? null, stateName(stateB(i)))}
            dimmed={(i) => frame.next?.[i] === null}
            speed={player.speed}
          />
        {/if}
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 {STATE_BG['']}"></span>
            {m.legend.stored}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 opacity-40 {STATE_BG['']}"
            ></span>
            {m.legend.spare}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.compare}"></span>
            {m.legend.read}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.swap}"></span>
            {m.legend.written}
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.copies}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.copies}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.writes}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.writes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.work}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.copies + frame.writes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.other}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{other.work}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.allocations}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.allocations}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.garbage}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.garbage}</dd>
        </div>
      </dl>
      <p class="text-xs text-slate-500">{m.otherNote(frame.mode)}</p>

      <ChipList
        title={m.piecesTitle}
        items={pieceChips}
        emptyText={m.piecesEmpty}
        hotLabel={m.piecesHot}
        limit={MAX_PIECES}
      />

      <CodePanel lines={joinPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <section class="mt-8 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="mb-3 text-lg font-semibold text-slate-900">{m.inspectTitle}</h2>
    <form
      class="mb-3 flex flex-wrap items-end gap-4"
      onsubmit={(e) => {
        e.preventDefault();
        commitInspect();
      }}
    >
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.inspectLabel}
        <input
          type="text"
          name="inspect"
          class="field w-64 max-w-full"
          bind:value={inspectDraft}
          onchange={commitInspect}
        />
      </label>
    </form>
    {#if inspectError}
      <p class="mb-2 text-sm text-red-700" role="status">{inspectError}</p>
    {/if}
    {#if !('error' in info)}
      <div class="overflow-x-auto">
        <table class="w-full min-w-[22rem] text-left text-sm tabular-nums">
          <thead>
            <tr class="border-b border-slate-200 text-xs text-slate-500">
              {#each m.inspectHead as head (head)}
                <th scope="col" class="py-1 pr-4 font-semibold">{head}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each info.chars as c, i (i)}
              <tr class="border-b border-slate-100">
                <td class="py-1 pr-4 text-base">{m.showChar(c.char)}</td>
                <td class="py-1 pr-4 font-mono">{c.hex}</td>
                <td class="py-1 pr-4 font-mono">
                  {c.utf8.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
                </td>
                <td class="py-1 pr-4 font-mono">{c.utf16}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-sm text-slate-700" data-testid="inspect-summary">
        {m.inspectSummary(info.chars.length, info.utf8, info.utf16)}
      </p>
    {/if}
    <p class="mt-2 text-xs text-slate-500">{m.inspectNote}</p>
  </section>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
