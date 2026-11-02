<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG, STATE_FILL, STATE_TEXT } from '$lib/components/visual-state.js';
  import {
    GCD_PRESETS,
    MAX_C,
    MAX_VALUE,
    gcdPseudocode,
    gcdTrace,
  } from '$lib/algo-engine/gcd-extended-euclid.js';
  import { en as m } from '$lib/lessons/gcd-extended-euclid/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/gcd-extended-euclid.js').GcdSquare} GcdSquare */
  /** @typedef {keyof typeof GCD_PRESETS} Preset */
  /** @typedef {'fresh'|'earlier'|'final'} SquareRole */
  /** @typedef {keyof typeof m.cellStates} CellRole */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(GCD_PRESETS));
  /** @type {Record<SquareRole, VisualState>} */
  const SQUARE_STATE = { fresh: 'active', earlier: 'visited', final: 'sorted' };
  /** @type {Record<CellRole, VisualState>} */
  const CELL_STATE = { used: 'compare', fresh: 'active', answer: 'sorted' };
  const SQUARE_ROLES = /** @type {SquareRole[]} */ (Object.keys(SQUARE_STATE));
  const DRAW_WIDTH = 560;
  const DRAW_HEIGHT = 300;

  const INITIAL = GCD_PRESETS.classic;
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let a = $state(INITIAL.a);
  let b = $state(INITIAL.b);
  let c = $state(INITIAL.c);
  let aDraft = $state(/** @type {number | null} */ (INITIAL.a));
  let bDraft = $state(/** @type {number | null} */ (INITIAL.b));
  let cDraft = $state(/** @type {number | null} */ (INITIAL.c));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(gcdTrace(INITIAL.a, INITIAL.b, INITIAL.c));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(gcdTrace(a, b, c));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function commitA() {
    if (!wholeInRange(aDraft, 1, MAX_VALUE)) {
      aDraft = a;
      say(m.valueError(MAX_VALUE));
      return;
    }
    if (aDraft === a) return;
    a = /** @type {number} */ (aDraft);
    preset = '';
    rebuild();
  }

  function commitB() {
    if (!wholeInRange(bDraft, 1, MAX_VALUE)) {
      bDraft = b;
      say(m.valueError(MAX_VALUE));
      return;
    }
    if (bDraft === b) return;
    b = /** @type {number} */ (bDraft);
    preset = '';
    rebuild();
  }

  function commitC() {
    if (!wholeInRange(cDraft, -MAX_C, MAX_C)) {
      cDraft = c;
      say(m.cError(MAX_C));
      return;
    }
    if (cDraft === c) return;
    c = /** @type {number} */ (cDraft);
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    a = aDraft = GCD_PRESETS[p].a;
    b = bDraft = GCD_PRESETS[p].b;
    c = cDraft = GCD_PRESETS[p].c;
    rebuild();
  }

  // The drawing fits a box, but a long thin rectangle keeps its short side readable and scrolls.
  const scale = $derived(Math.max(Math.min(DRAW_WIDTH / a, DRAW_HEIGHT / b), 8 / Math.min(a, b)));
  const drawW = $derived(a * scale);
  const drawH = $derived(b * scale);

  /** @param {GcdSquare} sq @returns {SquareRole} */
  function squareRole(sq) {
    if (frame.g !== null && sq.side === frame.g && sq.step === frame.step) return 'final';
    return frame.kind === 'divide' && sq.step === frame.step ? 'fresh' : 'earlier';
  }

  const headValues = $derived(
    frame.rows.map((row) => [row.r, row.q, row.s, row.t].map(m.cellText)),
  );

  /** @param {number} r @param {number} col @returns {CellRole | ''} */
  function cellRole(r, col) {
    const last = frame.rows.length - 1;
    if (frame.g !== null) return r === last - 1 && col !== 1 ? 'answer' : '';
    if (frame.kind === 'divide' && col === 0 && (r === last || r === last - 1)) return 'used';
    return frame.kind === 'update' && r === last ? 'fresh' : '';
  }

  const leftArea = $derived(frame.rest.w * frame.rest.h);
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(e) => enterField(e, {})}
    onsubmit={(e) => e.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.a}
      <input
        type="number"
        name="a"
        min="1"
        max={MAX_VALUE}
        class="field w-24 tabular-nums"
        bind:value={aDraft}
        onchange={commitA}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.b}
      <input
        type="number"
        name="b"
        min="1"
        max={MAX_VALUE}
        class="field w-24 tabular-nums"
        bind:value={bDraft}
        onchange={commitB}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.c}
      <input
        type="number"
        name="c"
        min={-MAX_C}
        max={MAX_C}
        class="field w-28 tabular-nums"
        bind:value={cDraft}
        onchange={commitC}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(/** @type {Preset} */ (e.currentTarget.value))}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.boardTitle}
        </h2>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div
          class="focus-ring overflow-y-auto rounded"
          style="max-height: {DRAW_HEIGHT + 2}px"
          tabindex={drawH > DRAW_HEIGHT ? 0 : undefined}
          role="group"
          aria-label={m.boardScroll}
          data-testid="board-scroll"
        >
          <ScrollFrame>
            <svg
              viewBox="-1 -1 {drawW + 2} {drawH + 2}"
              role="img"
              aria-label={m.boardAria(a, b, frame.squares.length, leftArea)}
              class="mx-auto block h-auto"
              style="width: {drawW + 2}px; max-width: {drawW > DRAW_WIDTH ? 'none' : '100%'}"
            >
              {#each frame.squares as sq, i (i)}
                {@const role = squareRole(sq)}
                {@const size = sq.side * scale}
                {@const state = SQUARE_STATE[role]}
                <g>
                  <title>{m.squareLabel(sq.side, sq.step, m.states[role])}</title>
                  <rect
                    x={sq.x * scale}
                    y={sq.y * scale}
                    width={size}
                    height={size}
                    stroke-width={role === 'earlier' ? 1 : 2}
                    class="{STATE_FILL[state]} stroke-slate-900"
                  />
                  {#if size >= 16}
                    <text
                      x={sq.x * scale + size / 2}
                      y={sq.y * scale + size / 2}
                      text-anchor="middle"
                      dominant-baseline="central"
                      font-size={Math.min(14, size / 2.2)}
                      font-weight="600"
                      class={STATE_TEXT[state]}>{m.markers[role]}{sq.side}</text
                    >
                  {/if}
                </g>
              {/each}
              {#if leftArea > 0}
                {@const w = frame.rest.w * scale}
                {@const h = frame.rest.h * scale}
                <g>
                  <title>{m.restLabel(frame.rest.w, frame.rest.h)}</title>
                  <rect
                    x={frame.rest.x * scale}
                    y={frame.rest.y * scale}
                    width={w}
                    height={h}
                    stroke-width="1.5"
                    stroke-dasharray="5 4"
                    class="fill-slate-50 stroke-slate-500"
                  />
                  {#if w >= 40 && h >= 16}
                    <text
                      x={frame.rest.x * scale + w / 2}
                      y={frame.rest.y * scale + h / 2}
                      text-anchor="middle"
                      dominant-baseline="central"
                      font-size="12"
                      class="fill-slate-600">{m.restText(frame.rest.w, frame.rest.h)}</text
                    >
                  {/if}
                </g>
              {/if}
            </svg>
          </ScrollFrame>
        </div>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each SQUARE_ROLES as role (role)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[SQUARE_STATE[role]]}"
              ></span>{m.legend[role]}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-dashed border-slate-500 bg-slate-50"
            ></span>{m.legend.rest}
          </li>
        </ul>
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <DpTable
          values={headValues}
          ariaLabel={m.tableAria(a, b)}
          colHeaders={m.tableHead}
          rowHeaders={frame.rows.map((_, i) => String(i))}
          stateOf={(r, col) => {
            const role = cellRole(r, col);
            return role ? CELL_STATE[role] : '';
          }}
          markerOf={(r, col) => {
            const role = cellRole(r, col);
            return role ? m.cellMarkers[role] : '';
          }}
          labelOf={(r, col) => {
            const role = cellRole(r, col);
            return m.tableCell(
              m.tableHead[col],
              r,
              headValues[r][col],
              role ? m.cellStates[role] : '',
            );
          }}
          speed={player.speed}
        />
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.divisions}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="divisions">{frame.divisions}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.subtractions}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="subtractions">
            {frame.subtractions}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.g}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="g">{frame.g ?? '—'}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.bezout}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="bezout">
            {m.bezoutValue(frame)}
          </dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-1 text-xs text-slate-500">{m.equationTitle}</h2>
        <p class="font-mono text-sm font-semibold text-slate-900">{m.equation(frame)}</p>
        <p class="mt-1 text-sm text-slate-700" data-testid="solution">{m.solutionText(frame)}</p>
      </div>
      <CodePanel lines={gcdPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
