<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    FEASIBLE_FROM,
    answerPseudocode,
    answerTrace,
    capRange,
    feasible,
    makeWeights,
    packDays,
    parseWeights,
  } from '$lib/algo-engine/binary-search-on-answer.js';
  import { en as m } from '$lib/lessons/binary-search-on-answer/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [7, 2, 5, 10, 8, 4, 9, 3];
  const INITIAL_DAYS = 3;

  let weights = $state(INITIAL);
  let weightsText = $state(INITIAL.join(', '));
  let limit = $state(INITIAL_DAYS);
  /** @type {number | null} */
  let daysDraft = $state(INITIAL_DAYS);
  /** @type {number | null} */
  let tryDraft = $state(null);
  let reveal = $state(false);

  const player = createPlayer(answerTrace(INITIAL, INITIAL_DAYS));
  const frame = $derived(player.frame);
  const range = $derived(capRange(weights));
  const count = $derived(range.hi - range.lo + 1);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const done = $derived(frame.kind === 'done');

  let notice = $state({ text: '', at: -1 });
  /** A capacity the learner typed, shown in the packing panel until the step changes. */
  let tried = $state({ cap: -1, at: -1 });
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, limit));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    tried = { cap: -1, at: -1 };
    player.load(answerTrace(weights, limit));
  }

  /** @param {number[]} next */
  function setWeights(next) {
    weights = next;
    weightsText = next.join(', ');
    if (limit > next.length) limit = daysDraft = next.length;
    rebuild();
  }

  function commitWeights() {
    const parsed = parseWeights(weightsText);
    if ('error' in parsed) {
      weightsText = weights.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    setWeights(parsed.values);
  }

  function commitDays() {
    const d = daysDraft;
    if (d === null || !Number.isInteger(d) || d < 1 || d > weights.length) {
      daysDraft = limit;
      say(m.daysError(weights.length));
      return;
    }
    limit = d;
    rebuild();
  }

  function commitTry() {
    const c = tryDraft;
    if (c === null) return;
    if (!Number.isInteger(c) || c < range.lo || c > range.hi) {
      tryDraft = null;
      say(m.tryError(range.lo, range.hi));
      return;
    }
    tried = { cap: c, at: player.index };
  }

  function newParcels() {
    const n = 4 + Math.floor(Math.random() * 7);
    limit = daysDraft = 1 + Math.floor(Math.random() * n);
    setWeights(makeWeights(n));
  }

  // The packing on screen: a typed capacity, else the current or latest check.
  const shownCheck = $derived.by(() => {
    if (tried.at === player.index) {
      const days = packDays(weights, tried.cap);
      return { cap: tried.cap, days, ok: days.length <= limit };
    }
    for (let i = player.index; i >= 0; i--) {
      const f = player.frames[i];
      if (f.kind === 'check') return { cap: f.mid, days: f.days, ok: f.ok };
      if (f.kind === 'done') return { cap: f.answer, days: f.days, ok: true };
    }
    return null;
  });

  // Strip geometry: one cell per candidate capacity, narrower when there are many.
  const CW = $derived(Math.max(10, Math.min(28, Math.floor(640 / count))));
  const CELL_H = 26;
  const MARK_H = 14;
  const ROW_H = 16;
  const stripW = $derived(count * CW);
  const tested = $derived(new Map(frame.checked.map((c) => [c.cap, c.ok])));
  const pointers = $derived(
    [
      { name: 'lo', cap: frame.lo },
      ...(frame.mid >= 0 ? [{ name: 'mid', cap: frame.mid }] : []),
      { name: 'hi', cap: frame.hi },
    ].map((p, row) => ({ ...p, row })),
  );
  const stripH = $derived(MARK_H + CELL_H + ROW_H + pointers.length * ROW_H + 4);

  /** @param {number} cap */
  function cellKind(cap) {
    if (done && cap === frame.answer) return 'answer';
    if (cap === frame.mid && !done) return 'mid';
    if (cap < frame.lo) return 'no';
    if (cap >= frame.hi) return 'yes';
    return 'open';
  }

  /** @type {Record<string, string>} */
  const FILL = {
    answer: 'fill-state-sorted',
    mid: 'fill-state-active',
    no: 'fill-slate-200',
    yes: 'fill-state-visited',
    open: 'fill-white',
  };

  /** @param {number} cap */
  function glyph(cap) {
    const k = cellKind(cap);
    if (k === 'no') return m.markers.no;
    if (k === 'yes' || k === 'answer') return m.markers.yes;
    if (reveal) return feasible(weights, cap, limit) ? m.markers.yes : m.markers.no;
    return '';
  }

  const caps = $derived(Array.from({ length: count }, (_, i) => range.lo + i));
  /** @param {number} cap */
  const cx = (cap) => (cap - range.lo) * CW + CW / 2;
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitWeights();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.weightsLabel}
      <input
        type="text"
        name="weights"
        class="field w-72 max-w-full"
        bind:value={weightsText}
        onchange={commitWeights}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.daysLabel}
      <input
        type="number"
        name="days"
        min="1"
        max={weights.length}
        class="field w-20"
        bind:value={daysDraft}
        onchange={commitDays}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.tryLabel}
      <input
        type="number"
        name="try"
        min={range.lo}
        max={range.hi}
        class="field w-24"
        bind:value={tryDraft}
        onchange={commitTry}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={newParcels}>{m.newParcels}</button>
    <label class="flex items-center gap-2 pb-2 text-sm text-slate-800">
      <input type="checkbox" name="reveal" class="size-4 accent-teal-700" bind:checked={reveal} />
      {m.revealLabel}
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.stripTitle}
        </h2>
        <ScrollFrame>
          <svg
            viewBox="-12 0 {stripW + 24} {stripH}"
            role="img"
            aria-label={m.stripLabel(range.lo, range.hi, frame.lo, frame.hi)}
            class="mx-auto block h-auto"
            style="width: {stripW + 24}px; max-width: 100%; min-width: {Math.min(
              stripW + 24,
              360,
            )}px"
            data-testid="strip"
          >
            {#each caps as cap (cap)}
              {@const k = cellKind(cap)}
              {@const x = (cap - range.lo) * CW}
              <g data-cap={cap} data-kind={k}>
                <rect
                  {x}
                  y={MARK_H}
                  width={CW}
                  height={CELL_H}
                  class="{FILL[k]} stroke-slate-400 {player.speed < 8 ? 'transition-colors' : ''}"
                  stroke-width="0.75"
                />
                {#if glyph(cap)}
                  <text
                    x={x + CW / 2}
                    y={MARK_H + CELL_H / 2}
                    text-anchor="middle"
                    dominant-baseline="central"
                    font-size={CW < 14 ? 8 : 12}
                    font-weight="700"
                    class={k === 'answer' || k === 'mid'
                      ? 'fill-white'
                      : k === 'open'
                        ? 'fill-slate-400'
                        : 'fill-slate-700'}
                    aria-hidden="true">{glyph(cap)}</text
                  >
                {/if}
                {#if tested.has(cap)}
                  <text
                    x={x + CW / 2}
                    y={MARK_H / 2}
                    text-anchor="middle"
                    dominant-baseline="central"
                    font-size="9"
                    class="fill-slate-900"
                    aria-hidden="true">{m.markers.tested}</text
                  >
                {/if}
              </g>
            {/each}
            {#each [range.lo, range.hi] as cap, e (e)}
              <text
                x={cx(cap)}
                y={MARK_H + CELL_H + ROW_H / 2 + 1}
                text-anchor="middle"
                dominant-baseline="central"
                font-size="10"
                class="fill-slate-500"
                aria-hidden="true">{cap}</text
              >
            {/each}
            {#each pointers as p (p.name)}
              {@const y = MARK_H + CELL_H + ROW_H * (p.row + 1)}
              <g aria-hidden="true">
                <path d="M{cx(p.cap)} {y + 1} l-4 5 h8 z" class="fill-slate-700" />
                <text
                  x={cx(p.cap) + (cx(p.cap) > stripW / 2 ? -7 : 7)}
                  y={y + 8}
                  text-anchor={cx(p.cap) > stripW / 2 ? 'end' : 'start'}
                  dominant-baseline="central"
                  font-size="10"
                  font-weight="600"
                  class="fill-slate-800">{p.name} {p.cap}</text
                >
              </g>
            {/each}
          </svg>
        </ScrollFrame>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-active"></span>
            {m.legend.active}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-slate-200"></span>
            <span class="font-bold text-slate-900">{m.markers.no}</span>
            {m.legend.no}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-visited"></span>
            <span class="font-bold text-slate-900">{m.markers.yes}</span>
            {m.legend.yes}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-sorted"></span>
            {m.legend.sorted}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="font-bold text-slate-900">{m.markers.tested}</span>
            {m.legend.tested}
          </li>
          {#if reveal}
            <li class="flex items-center gap-1.5">
              <span class="font-bold text-slate-400">{m.markers.yes} {m.markers.no}</span>
              {m.legend.revealed}
            </li>
          {/if}
        </ul>
      </div>

      <section class="rounded-xl border border-slate-200 bg-white p-4" data-testid="packing">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.packTitle}
        </h2>
        {#if shownCheck}
          <p class="mb-2 text-sm font-semibold text-slate-800">{m.packHeading(shownCheck.cap)}</p>
          <ol class="flex flex-col gap-1.5">
            {#each shownCheck.days as parcels, d (d)}
              <li
                class="flex items-center gap-2"
                aria-label={m.dayLabel(d + 1, parcels, shownCheck.cap)}
              >
                <span class="w-12 shrink-0 text-xs text-slate-500" aria-hidden="true"
                  >{m.dayShort} {d + 1}</span
                >
                <span
                  class="flex h-7 min-w-0 flex-1 overflow-hidden rounded border border-dashed border-slate-400"
                  aria-hidden="true"
                >
                  {#each parcels as x, j (j)}
                    <span
                      class="flex items-center justify-center border-r border-white bg-teal-700 text-xs font-semibold text-white"
                      style="width: {(x / shownCheck.cap) * 100}%">{x}</span
                    >
                  {/each}
                </span>
              </li>
            {/each}
          </ol>
          <p
            class="mt-2 text-sm font-semibold {shownCheck.ok
              ? 'text-emerald-800'
              : 'text-rose-700'}"
            data-testid="verdict"
          >
            {m.verdict(shownCheck.days.length, limit, shownCheck.ok)}
          </p>
        {:else}
          <p class="text-sm text-slate-500">{m.packEmpty}</p>
        {/if}
      </section>

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
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="checks">{frame.checks}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.reads}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.reads}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.linear}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums" data-testid="linear">
            {done ? finalFrame.answer - range.lo + 1 : m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.range}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{count}</dd>
        </div>
      </dl>

      <ChipList
        title={m.testedTitle}
        items={frame.checked.map((c, i) => ({
          label: m.testedChip(c.cap, c.ok),
          hot: i === frame.checked.length - 1 && frame.kind === 'check',
        }))}
        emptyText={m.testedEmpty}
      />

      <CodePanel lines={answerPseudocode.slice(0, FEASIBLE_FROM)} active={frame.lines} />
      <CodePanel
        lines={answerPseudocode.slice(FEASIBLE_FROM)}
        active={frame.lines.filter((l) => l >= FEASIBLE_FROM).map((l) => l - FEASIBLE_FROM)}
      />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
