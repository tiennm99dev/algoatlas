<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PointPlane from '$lib/components/point-plane.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    HULL_PRESETS,
    INTERCEPT_MAX,
    INTERCEPT_MIN,
    MAX_LINES,
    MAX_QUERIES,
    PLOT,
    SLOPE_RANGE,
    clipToPlot,
    envelopePieces,
    hullPseudocode,
    hullTrace,
    parseLines,
    parseQueries,
  } from '$lib/algo-engine/dp-optimisations.js';
  import { vi as m } from '$lib/lessons/dp-optimisations/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/dp-optimisations.js').Line} Line */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/components/plane-types.js').PlaneSegment} PlaneSegment */
  /** @typedef {import('$lib/components/plane-types.js').PlaneMark} PlaneMark */

  const FIRST = HULL_PRESETS[0];
  const errors = m.errors(
    MAX_LINES,
    SLOPE_RANGE,
    INTERCEPT_MIN,
    INTERCEPT_MAX,
    MAX_QUERIES,
    PLOT.xMax,
  );
  /** @param {[number, number][]} pairs */
  const linesText = (pairs) => pairs.map(([a, b]) => `${a} ${b}`).join(', ');
  /** @param {number[]} xs */
  const queriesText = (xs) => xs.join(' ');

  let pairs = $state(/** @type {[number, number][]} */ (FIRST.lines));
  let queries = $state(FIRST.queries);
  let pairsDraft = $state(linesText(FIRST.lines));
  let queriesDraft = $state(queriesText(FIRST.queries));
  let preset = $state(FIRST.key);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(hullTrace(FIRST.lines, FIRST.queries));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const finalFrame = $derived(player.frames[player.frames.length - 1]);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(hullTrace($state.snapshot(pairs), $state.snapshot(queries)));
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = HULL_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    pairs = p.lines;
    queries = p.queries;
    pairsDraft = linesText(p.lines);
    queriesDraft = queriesText(p.queries);
    rebuild();
  }

  function commitLines() {
    const parsed = parseLines(pairsDraft);
    if ('error' in parsed) {
      pairsDraft = linesText(pairs);
      return say(errors.lines[parsed.error]);
    }
    pairsDraft = linesText(parsed.lines);
    if (pairsDraft === linesText(pairs)) return;
    pairs = parsed.lines;
    preset = '';
    rebuild();
  }

  function commitQueries() {
    const parsed = parseQueries(queriesDraft);
    if ('error' in parsed) {
      queriesDraft = queriesText(queries);
      return say(errors.queries[parsed.error]);
    }
    queriesDraft = queriesText(parsed.queries);
    if (queriesDraft === queriesText(queries)) return;
    queries = parsed.queries;
    preset = '';
    rebuild();
  }

  function randomize() {
    const n = 3 + Math.floor(Math.random() * (MAX_LINES - 2));
    /** @type {[number, number][]} */
    const next = Array.from({ length: n }, () => {
      const slope = Math.floor(Math.random() * 7) - 3;
      // Keep the line's middle near the plot, so most lines show.
      const b = Math.max(
        INTERCEPT_MIN,
        Math.min(INTERCEPT_MAX, 6 - slope * 5 + Math.floor(Math.random() * 7) - 3),
      );
      return [slope, b];
    });
    pairs = next;
    pairsDraft = linesText(next);
    preset = '';
    rebuild();
  }

  const byId = $derived(new Map(frame.pool.map((l) => [l.id, l])));
  /** @param {number} id */
  const line = (id) => /** @type {Line} */ (byId.get(id));
  const queryX = $derived(frame.q >= 0 && frame.kind !== 'done' ? frame.queries[frame.q] : null);

  /** @param {number} id @returns {VisualState} */
  function lineState(id) {
    if (frame.kind === 'check' && frame.triple.includes(id)) return 'compare';
    if (id === frame.cur) return 'active';
    if (frame.removed.includes(id)) return 'pruned';
    if (queryX !== null && id === frame.hull[frame.p]) return 'swap';
    if (frame.hull.includes(id)) return 'visited';
    return '';
  }

  const segments = $derived.by(() => {
    /** @type {PlaneSegment[]} */
    const out = [];
    for (const l of frame.pool) {
      const seg = clipToPlot(l);
      if (!seg) continue;
      const state = lineState(l.id);
      out.push({
        key: `l${l.id}`,
        ...seg,
        state,
        dashed: state === 'pruned' || state === '',
        label: m.name(l.id),
      });
    }
    for (const piece of envelopePieces(frame.hull.map(line))) {
      const seg = clipToPlot(line(piece.id), piece.from, piece.to);
      if (seg) out.push({ key: `e${piece.id}`, ...seg, state: 'path', thick: true });
    }
    if (queryX !== null)
      out.push({
        key: 'query',
        x1: queryX,
        y1: 0,
        x2: queryX,
        y2: PLOT.yMax,
        state: 'frontier',
        dashed: true,
      });
    return out;
  });

  const marks = $derived(
    /** @type {PlaneMark[]} */ (
      frame.queries.flatMap((x, q) => {
        const y = frame.answers[q];
        return y === null || y < 0 || y > PLOT.yMax
          ? []
          : [{ key: `a${q}`, x, y, label: m.markLabel(y) }];
      })
    ),
  );

  const answerRows = $derived(
    /** @type {(number|string|null)[][]} */ ([frame.queries, frame.answers]),
  );
  /** @param {number} r @param {number} c @returns {VisualState} */
  const answerState = (r, c) =>
    c === frame.q && frame.kind !== 'done'
      ? 'active'
      : frame.answers[c] !== null && r === 1
        ? 'sorted'
        : '';

  const hullChips = $derived(
    frame.hull.map((id, i) => ({ label: m.name(id), hot: queryX !== null && i === frame.p })),
  );
  const lineChips = $derived(
    frame.pool
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((l) => ({
        label: m.lineChip(l, frame.removed.includes(l.id)),
        hot: l.id === frame.cur,
      })),
  );

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', m.legend.current],
    ['compare', m.legend.compare],
    ['visited', m.legend.hull],
    ['pruned', m.legend.removed],
    ['', m.legend.pending],
    ['path', m.legend.envelope],
    ['frontier', m.legend.query],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitLines();
      commitQueries();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.linesLabel}
      <input
        type="text"
        name="lines"
        class="field w-80 max-w-full font-mono"
        bind:value={pairsDraft}
        onchange={commitLines}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.queriesLabel}
      <input
        type="text"
        name="queries"
        class="field w-56 max-w-full font-mono"
        bind:value={queriesDraft}
        onchange={commitQueries}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field max-w-full"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each HULL_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-outline" onclick={randomize}>{m.randomLines}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <PointPlane
          ariaLabel={m.plotLabel(frame.pool.length)}
          xMax={PLOT.xMax}
          yMax={PLOT.yMax}
          {segments}
          {marks}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
        </ul>
        <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.answersTitle}
        </h2>
        <DpTable
          values={answerRows}
          ariaLabel={m.answersAria}
          rowHeaders={m.answersRows}
          stateOf={answerState}
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="checks">
            {frame.checks} / {finalFrame.checks}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.moves}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="moves">
            {frame.moves} / {finalFrame.moves}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.compares}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="compares">
            {frame.compares} / {finalFrame.compares}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="naive">
            {frame.pool.length * frame.queries.length}
          </dd>
        </div>
      </dl>
      <ChipList title={m.hullTitle} emptyText={m.hullEmpty} items={hullChips} />
      <ChipList title={m.linesTitle} emptyText="" items={lineChips} />
      <CodePanel lines={hullPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
