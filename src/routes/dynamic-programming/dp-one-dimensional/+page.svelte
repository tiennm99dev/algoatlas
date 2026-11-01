<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG, STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';
  import {
    DEFAULT_INPUT,
    MAX_AMOUNT,
    MAX_COIN,
    MAX_COINS,
    MAX_HOUSE,
    MAX_HOUSES,
    MAX_STAIRS,
    oneDimPseudocode,
    oneDimTrace,
    parseOneDimList,
  } from '$lib/algo-engine/dp-one-dimensional.js';
  import { en as m } from '$lib/lessons/dp-one-dimensional/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/dp-one-dimensional.js').OneDimProblem} OneDimProblem */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'current'|'read'|'chosen'|'base'|'answer'|'path'|''} Role */

  const PROBLEMS = /** @type {OneDimProblem[]} */ (['stairs', 'coins', 'robber']);
  const uid = $props.id();

  let problem = $state(/** @type {OneDimProblem} */ ('stairs'));
  let input = $state.raw(DEFAULT_INPUT);
  /** @type {number | null} */
  let stepsDraft = $state(DEFAULT_INPUT.n);
  /** @type {number | null} */
  let amountDraft = $state(DEFAULT_INPUT.amount);
  let coinsText = $state(DEFAULT_INPUT.coins.join(', '));
  let housesText = $state(DEFAULT_INPUT.houses.join(', '));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(oneDimTrace('stairs', DEFAULT_INPUT));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(oneDimTrace(problem, input));
  }

  /** @param {string} text */
  function refuse(text) {
    notice = { text, at: player.index };
  }

  /** @param {number | null} v @param {number} max */
  const wholeUpTo = (v, max) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;

  function commitSteps() {
    if (!wholeUpTo(stepsDraft, MAX_STAIRS)) {
      stepsDraft = input.n;
      return refuse(m.errors.steps(MAX_STAIRS));
    }
    input = { ...input, n: /** @type {number} */ (stepsDraft) };
    rebuild();
  }

  function commitAmount() {
    if (!wholeUpTo(amountDraft, MAX_AMOUNT)) {
      amountDraft = input.amount;
      return refuse(m.errors.amount(MAX_AMOUNT));
    }
    input = { ...input, amount: /** @type {number} */ (amountDraft) };
    rebuild();
  }

  function commitCoins() {
    const parsed = parseOneDimList(coinsText, { min: 1, max: MAX_COIN, count: MAX_COINS });
    if ('error' in parsed) {
      coinsText = input.coins.join(', ');
      return refuse(m.errors.coins(MAX_COINS, MAX_COIN));
    }
    input = { ...input, coins: parsed.values };
    coinsText = parsed.values.join(', ');
    rebuild();
  }

  function commitHouses() {
    const parsed = parseOneDimList(housesText, { min: 0, max: MAX_HOUSE, count: MAX_HOUSES });
    if ('error' in parsed) {
      housesText = input.houses.join(', ');
      return refuse(m.errors.houses(MAX_HOUSES, MAX_HOUSE));
    }
    input = { ...input, houses: parsed.values };
    housesText = parsed.values.join(', ');
    rebuild();
  }

  // Drawing: cells in a row, arcs above from each read cell to the cell being filled.
  const CELL = 40;
  const PITCH = 44;
  const ARC = 104;
  const cellX = (/** @type {number} */ i) => 4 + i * PITCH;
  const mid = (/** @type {number} */ i) => cellX(i) + CELL / 2;
  const hasHouses = $derived(frame.problem === 'robber');
  const size = $derived(frame.dp.length);
  const vbW = $derived(8 + size * PITCH);
  const vbH = $derived(ARC + CELL + 18 + (hasHouses ? 22 : 0));
  const fade = $derived(player.speed < 8 ? 'transition-colors' : '');

  const readSet = $derived(new Set(frame.candidates.map((c) => c.from)));
  const chosenFrom = $derived(frame.candidates[frame.chosen]?.from ?? -1);
  const pathSet = $derived(new Set(frame.path));
  const writtenSet = $derived(new Set(frame.kind === 'base' ? frame.written : []));

  /** @param {number} i @returns {Role} */
  function roleOf(i) {
    if (frame.kind === 'done') {
      if (i === frame.cell) return 'answer';
      return pathSet.has(i) ? 'path' : '';
    }
    if (writtenSet.has(i)) return 'base';
    if (frame.kind === 'fill' && i === frame.cell) return 'current';
    if (i === chosenFrom) return 'chosen';
    if (readSet.has(i)) return 'read';
    return '';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'active',
    read: 'compare',
    chosen: 'compare',
    base: 'swap',
    answer: 'sorted',
    path: 'path',
    '': '',
  };
  /** @type {Record<Role, string>} */
  const ROLE_MARK = {
    current: m.markers.current,
    read: m.markers.read,
    chosen: m.markers.chosen,
    base: m.markers.current,
    answer: m.markers.answer,
    path: m.markers.path,
    '': '',
  };

  const arcs = $derived(
    frame.kind !== 'fill'
      ? []
      : frame.candidates.map((c, k) => {
          const x1 = mid(c.from);
          const x2 = mid(frame.cell) - 4;
          const h = Math.min(ARC - 18, 18 + 16 * (frame.cell - c.from));
          const y = ARC - 2;
          return {
            d: `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - 2 * h} ${x2} ${y}`,
            lx: (x1 + x2) / 2,
            ly: y - h - 4,
            chosen: k === frame.chosen,
            label: m.arcLabel(frame.problem, c),
          };
        }),
  );

  /** @param {number} i */
  function cellName(i) {
    const role = roleOf(i);
    return m.cellLabel(frame.problem, i, frame.dp[i], role ? m.cellStates[role] : '');
  }

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', `${m.markers.current} ${m.legend.current}`],
    ['compare', `${m.markers.read} ${m.legend.read}`],
    ['path', `${m.markers.path} ${m.legend.path}`],
    ['sorted', `${m.markers.answer} ${m.legend.answer}`],
  ]);

  const show = (/** @type {number|null} */ v) =>
    v === null ? '' : v === Infinity ? m.infinity : String(v);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      if (problem === 'stairs') commitSteps();
      else if (problem === 'coins') {
        commitCoins();
        commitAmount();
      } else commitHouses();
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((p) => ({ value: p, label: m.problems[p] }))}
      bind:value={problem}
      onchange={rebuild}
    />
    {#if problem === 'stairs'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.stepsLabel}
        <input
          type="number"
          name="steps"
          min="0"
          max={MAX_STAIRS}
          step="1"
          class="field w-24"
          bind:value={stepsDraft}
          onchange={commitSteps}
        />
      </label>
    {:else if problem === 'coins'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.coinsLabel}
        <input
          type="text"
          name="coins"
          class="field w-40"
          bind:value={coinsText}
          onchange={commitCoins}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.amountLabel}
        <input
          type="number"
          name="amount"
          min="0"
          max={MAX_AMOUNT}
          step="1"
          class="field w-24"
          bind:value={amountDraft}
          onchange={commitAmount}
        />
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.housesLabel}
        <input
          type="text"
          name="houses"
          class="field w-72 max-w-full"
          bind:value={housesText}
          onchange={commitHouses}
        />
      </label>
    {/if}
    <p class="w-full text-xs text-slate-600">{m.problemText(problem)}</p>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.rowTitle}
        </h2>
        <ScrollFrame>
          <svg
            viewBox="0 0 {vbW} {vbH}"
            role="img"
            aria-label={m.rowAria(frame.problem, frame.filled, size)}
            class="mx-auto block h-auto"
            style="width: {vbW}px; max-width: 100%; min-width: {Math.min(vbW, 340)}px"
            data-testid="row"
          >
            <defs>
              <marker
                id="{uid}-arc"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 z" class="fill-slate-700" />
              </marker>
            </defs>
            {#each frame.dp as v, i (i)}
              {@const role = roleOf(i)}
              {@const st = ROLE_STATE[role]}
              <g>
                <title>{cellName(i)}</title>
                <rect
                  x={cellX(i)}
                  y={ARC}
                  width={CELL}
                  height={CELL}
                  rx="4"
                  stroke-width={st === '' ? 1 : 2}
                  class="{v === null && st === '' ? 'fill-slate-50' : STATE_FILL[st]} {stateStroke(
                    st,
                  )} {fade}"
                  stroke-dasharray={v === null ? '3 3' : undefined}
                />
                <text
                  x={mid(i)}
                  y={ARC + CELL / 2}
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size={show(v).length > 3 ? 10 : 13}
                  font-weight="600"
                  class={STATE_TEXT[st]}>{show(v)}</text
                >
                {#if ROLE_MARK[role]}
                  <text
                    x={cellX(i) + CELL - 7}
                    y={ARC + 8}
                    text-anchor="middle"
                    dominant-baseline="central"
                    font-size="10"
                    font-weight="700"
                    stroke="white"
                    stroke-width="3"
                    paint-order="stroke"
                    class="fill-slate-900"
                    aria-hidden="true">{ROLE_MARK[role]}</text
                  >
                {/if}
              </g>
              <text
                x={mid(i)}
                y={ARC + CELL + 12}
                text-anchor="middle"
                font-size="11"
                class="fill-slate-600"
                aria-hidden="true">{i}</text
              >
              {#if hasHouses && i > 0}
                <text
                  x={mid(i)}
                  y={ARC + CELL + 32}
                  text-anchor="middle"
                  font-size="11"
                  font-weight="600"
                  class="fill-slate-800"
                  aria-hidden="true">{m.houseRow} {frame.input.houses[i - 1]}</text
                >
              {/if}
            {/each}
            {#each arcs as a, k (k)}
              <path
                d={a.d}
                fill="none"
                stroke-width={a.chosen ? 3 : 1.5}
                stroke-dasharray={a.chosen || frame.chosen < 0 ? undefined : '4 3'}
                class={a.chosen ? 'stroke-teal-700' : 'stroke-rose-700'}
                marker-end="url(#{uid}-arc)"
                aria-hidden="true"
              />
              <text
                x={a.lx}
                y={a.ly}
                text-anchor="middle"
                font-size="10"
                font-weight={a.chosen ? 700 : 500}
                stroke="white"
                stroke-width="3"
                paint-order="stroke"
                class={a.chosen ? 'fill-teal-800' : 'fill-rose-800'}
                aria-hidden="true">{a.chosen ? `${m.markers.chosen} ` : ''}{a.label}</text
              >
            {/each}
          </svg>
        </ScrollFrame>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-4 rounded-sm bg-teal-700"></span>{m.markers.chosen}
            {m.legend.chosen}
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
          <dt class="text-xs text-slate-500">{m.stats.filled}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="filled">
            {frame.filled} / {size}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.lookups}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="lookups">{frame.lookups}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="result">
            {frame.kind === 'done' ? show(frame.result) : m.resultPending}
          </dd>
        </div>
      </dl>
      {#if frame.problem !== 'stairs'}
        <ChipList
          title={m.picksTitle[frame.problem]}
          emptyText={frame.kind === 'done' ? m.picksNone : m.picksEmpty}
          items={frame.picks.map((k) => ({ label: m.pickLabel(frame.problem, k) }))}
        />
      {/if}
      <CodePanel lines={oneDimPseudocode[frame.problem]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
