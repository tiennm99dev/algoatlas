<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    LUP_PRESETS,
    MAX_ENTRY,
    MAX_SIZE,
    MIN_SIZE,
    luPseudocode,
    lupPseudocode,
    lupTrace,
    splitFactors,
  } from '$lib/algo-engine/lup-decomposition.js';
  import { en as m } from '$lib/lessons/lup-decomposition/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/lup-decomposition.js').Frac} Frac */
  /** @typedef {keyof typeof LUP_PRESETS} Preset */
  /** @typedef {keyof typeof m.roles} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(LUP_PRESETS));
  const SIZES = Array.from({ length: MAX_SIZE - MIN_SIZE + 1 }, (_, i) => MIN_SIZE + i);
  /** @type {Record<number, Preset>} */
  const PRESET_FOR_SIZE = { 2: 'twoByTwo', 3: 'clrs', 4: 'fourByFour' };
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    pivot: 'active',
    searched: 'compare',
    updated: 'swap',
    l: 'visited',
    u: 'sorted',
    '': '',
  };
  /** Text that stays readable on each role’s fill. @type {Record<Role, string>} */
  const ROLE_TEXT = {
    pivot: 'text-white',
    searched: 'text-slate-900',
    updated: 'text-white',
    l: 'text-slate-900',
    u: 'text-white',
    '': 'text-slate-900',
  };
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
  const FACTOR_NAMES = /** @type {('P' | 'L' | 'U')[]} */ (['P', 'L', 'U']);
  const PIVOTING = [
    { value: 'lup', label: m.pivotingOptions.lup },
    { value: 'lu', label: m.pivotingOptions.lu },
  ];

  const INITIAL = LUP_PRESETS.clrs;
  let preset = $state(/** @type {Preset | ''} */ ('clrs'));
  let pivotMode = $state('lup');
  let size = $state(INITIAL.a.length);
  let matrix = $state(INITIAL.a.map((row) => row.slice()));
  let rhs = $state(INITIAL.b.slice());
  let matrixDraft = $state(
    /** @type {(number | null)[][]} */ (INITIAL.a.map((row) => row.slice())),
  );
  let rhsDraft = $state(/** @type {(number | null)[]} */ (INITIAL.b.slice()));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(lupTrace(INITIAL.a, INITIAL.b, true));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const pseudocode = $derived(frame.pivoting ? lupPseudocode : luPseudocode);
  const factors = $derived(frame.kind === 'done' && !frame.failed ? splitFactors(frame) : null);

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(lupTrace(matrix, rhs, pivotMode === 'lup'));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  /** @param {number} r @param {number} c */
  function commitCell(r, c) {
    const v = matrixDraft[r][c];
    if (!wholeInRange(v, -MAX_ENTRY, MAX_ENTRY)) {
      matrixDraft[r][c] = matrix[r][c];
      say(m.entryError(MAX_ENTRY));
      return;
    }
    if (v === matrix[r][c]) return;
    matrix[r][c] = /** @type {number} */ (v);
    preset = '';
    rebuild();
  }

  /** @param {number} r */
  function commitRhs(r) {
    const v = rhsDraft[r];
    if (!wholeInRange(v, -MAX_ENTRY, MAX_ENTRY)) {
      rhsDraft[r] = rhs[r];
      say(m.entryError(MAX_ENTRY));
      return;
    }
    if (v === rhs[r]) return;
    rhs[r] = /** @type {number} */ (v);
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    matrix = LUP_PRESETS[p].a.map((row) => row.slice());
    rhs = LUP_PRESETS[p].b.slice();
    matrixDraft = matrix.map((row) => row.slice());
    rhsDraft = rhs.slice();
    size = matrix.length;
    rebuild();
  }

  /** @param {number} r @param {number} c @returns {Role} */
  function roleOf(r, c) {
    const f = frame;
    const pivotAt = f.kind === 'pivot' || f.kind === 'stuck' ? f.row : f.k;
    if (['pivot', 'stuck', 'swap', 'eliminate'].includes(f.kind) && c === f.k && r === pivotAt)
      return 'pivot';
    if (f.kind === 'pivot' && f.pivoting && c === f.k && r >= f.k) return 'searched';
    if (f.kind === 'eliminate' && r === f.row && c >= f.k) return 'updated';
    if (r > c && c < f.finished) return 'l';
    if (r <= c && r < f.finished) return 'u';
    return '';
  }

  const vectors = $derived([
    { key: /** @type {const} */ ('perm'), cells: frame.perm.map(String) },
    { key: /** @type {const} */ ('b'), cells: frame.b.map(m.fracText) },
    { key: /** @type {const} */ ('y'), cells: frame.y.map((f) => (f ? m.fracText(f) : '…')) },
    { key: /** @type {const} */ ('x'), cells: frame.x.map((f) => (f ? m.fracText(f) : '…')) },
  ]);
</script>

{#snippet plainMatrix(/** @type {Frac[][]} */ rows, /** @type {string} */ name)}
  <table
    class="border-x-2 border-slate-700 font-mono text-sm tabular-nums"
    aria-label={m.factorAria(name)}
    data-testid="factor-{name}"
  >
    <tbody>
      {#each rows as row, r (r)}
        <tr>
          {#each row as cell, c (c)}
            <td class="px-2 py-0.5 text-right whitespace-nowrap">{m.fracText(cell)}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
{/snippet}

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.size}
      <select
        name="size"
        class="field"
        value={size}
        onchange={(ev) => loadPreset(PRESET_FOR_SIZE[Number(ev.currentTarget.value)])}
      >
        {#each SIZES as s (s)}
          <option value={s}>{s} × {s}</option>
        {/each}
      </select>
    </label>
    <SegmentedControl
      legend={m.fields.pivoting}
      name="pivoting"
      options={PIVOTING}
      bind:value={pivotMode}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(ev) => loadPreset(/** @type {Preset} */ (ev.currentTarget.value))}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </div>

  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 rounded-xl border border-slate-200 bg-white p-4"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.inputTitle}
    </h2>
    <ScrollFrame>
      <div class="flex items-center gap-3">
        <div
          class="grid gap-1 border-x-2 border-slate-700 px-1"
          style="grid-template-columns: repeat({size}, 3.5rem)"
        >
          {#each matrixDraft as row, r (r)}
            {#each row as _, c (c)}
              <input
                type="number"
                name="a-{r}-{c}"
                min={-MAX_ENTRY}
                max={MAX_ENTRY}
                aria-label={m.cellAria(r, c)}
                class="field w-14 text-right tabular-nums"
                bind:value={matrixDraft[r][c]}
                onchange={() => commitCell(r, c)}
              />
            {/each}
          {/each}
        </div>
        <span class="font-mono text-lg" aria-hidden="true">· x =</span>
        <div class="grid gap-1 border-x-2 border-slate-700 px-1">
          {#each rhsDraft as _, r (r)}
            <input
              type="number"
              name="b-{r}"
              min={-MAX_ENTRY}
              max={MAX_ENTRY}
              aria-label={m.rhsAria(r)}
              class="field w-14 text-right tabular-nums"
              bind:value={rhsDraft[r]}
              onchange={() => commitRhs(r)}
            />
          {/each}
        </div>
      </div>
    </ScrollFrame>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.workTitle}
        </h2>
        <ScrollFrame>
          <table
            class="font-mono text-base tabular-nums"
            aria-label={m.workAria}
            data-testid="work"
          >
            <tbody>
              {#each frame.a as row, r (r)}
                <tr>
                  <th scope="row" class="pr-2 text-right text-xs font-normal text-slate-500">{r}</th
                  >
                  {#each row as cell, c (c)}
                    {@const role = roleOf(r, c)}
                    <td
                      class="relative h-11 min-w-16 border border-slate-300 px-2 text-right whitespace-nowrap {STATE_BG[
                        ROLE_STATE[role]
                      ]} {ROLE_TEXT[role]} {player.speed < 8 ? 'transition-colors' : ''}"
                      title={m.workCell(r, c, m.fracText(cell), m.roles[role])}
                      data-role={role}
                    >
                      {#if role}<span
                          class="absolute top-0 left-1 text-[10px] font-semibold"
                          aria-hidden="true">{m.markers[role]}</span
                        >{/if}
                      {m.fracText(cell)}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </ScrollFrame>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each LEGEND as role (role)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[role]]}"
              ></span>{m.legend[role]}
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

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.vectorsTitle}
        </h2>
        <ScrollFrame>
          <table class="font-mono text-sm tabular-nums">
            <tbody>
              {#each vectors as vec (vec.key)}
                <tr class="border-t border-slate-100" data-testid="vector-{vec.key}">
                  <th scope="row" class="pr-3 text-left font-semibold">{m.vectorNames[vec.key]}</th>
                  {#each vec.cells as cell, i (i)}
                    <td
                      class="px-2 py-1 text-right whitespace-nowrap {(frame.kind === 'forward' &&
                        vec.key === 'y') ||
                      (frame.kind === 'back' && vec.key === 'x')
                        ? i === frame.row
                          ? 'bg-state-active font-bold text-white'
                          : ''
                        : ''}">{cell}</td
                    >
                  {/each}
                  <td class="pl-3 text-left font-sans text-xs text-slate-500"
                    >{m.vectorHints[vec.key]}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </ScrollFrame>
      </div>

      {#if factors}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.factorsTitle}
          </h2>
          <ScrollFrame>
            <div class="flex items-center gap-4">
              {#each FACTOR_NAMES as name (name)}
                <div class="flex items-center gap-2">
                  <span class="font-semibold">{m.factorNames[name]} =</span>
                  {@render plainMatrix(factors[name], name)}
                </div>
              {/each}
            </div>
          </ScrollFrame>
        </div>
      {/if}
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.column}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="column">
            {frame.k >= 0 ? frame.k : m.noColumn}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.swaps}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="swaps">{frame.swaps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.factorOps}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="factor-ops">
            {frame.factorOps}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.solveOps}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="solve-ops">{frame.solveOps}</dd>
        </div>
      </dl>
      <CodePanel lines={pseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
