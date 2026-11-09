<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    LUCAS_PRESETS,
    MAX_CATALAN_N,
    MAX_LUCAS_N,
    MAX_PRIME,
    MAX_ROWS,
    PASCAL_PRESETS,
    binomial,
    bracketPseudocode,
    bracketTrace,
    catalan,
    heightsOf,
    lucasPseudocode,
    lucasTrace,
    pascalPseudocode,
    pascalTrace,
    treeOfSequence,
  } from '$lib/algo-engine/combinatorics.js';
  import { en as m } from '$lib/lessons/combinatorics/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import { isPrime } from '$lib/algo-engine/number-theory.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.modes} Mode */
  /** @typedef {keyof typeof m.cellStates} CellRole */
  /** @typedef {keyof typeof PASCAL_PRESETS} PascalPreset */
  /** @typedef {keyof typeof LUCAS_PRESETS} LucasPreset */

  const MAX_MODULUS = 97;
  const CATALAN_SHOWN = 11;
  const MODE_OPTIONS = /** @type {Mode[]} */ (Object.keys(m.modes)).map((value) => ({
    value,
    label: m.modes[value],
  }));
  const VIEW_OPTIONS = /** @type {(keyof typeof m.views)[]} */ (Object.keys(m.views)).map(
    (value) => ({ value, label: m.views[value] }),
  );
  const PASCAL_KEYS = /** @type {PascalPreset[]} */ (Object.keys(PASCAL_PRESETS));
  const LUCAS_KEYS = /** @type {LucasPreset[]} */ (Object.keys(LUCAS_PRESETS));
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
  /** @type {Record<CellRole, VisualState>} */
  const CELL_STATE = {
    current: 'active',
    read: 'compare',
    multiple: 'sorted',
    mirror: 'path',
    plain: '',
  };

  let mode = $state(/** @type {Mode} */ ('pascal'));

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const P0 = PASCAL_PRESETS.small;
  const L0 = LUCAS_PRESETS.single;
  const B0 = 3;
  let pascalPreset = $state(/** @type {PascalPreset | ''} */ ('small'));
  let rows = $state(P0.rows);
  let rowsDraft = $state(/** @type {number | null} */ (P0.rows));
  let modulus = $state(P0.p);
  let modulusDraft = $state(/** @type {number | null} */ (P0.p));
  let view = $state(/** @type {keyof typeof m.views} */ ('exact'));
  let selected = $state(/** @type {[number, number] | null} */ (null));

  let lucasPreset = $state(/** @type {LucasPreset | ''} */ ('single'));
  let n = $state(L0.n);
  let k = $state(L0.k);
  let p = $state(L0.p);
  let nDraft = $state(/** @type {number | null} */ (L0.n));
  let kDraft = $state(/** @type {number | null} */ (L0.k));
  let pDraft = $state(/** @type {number | null} */ (L0.p));

  let pairs = $state(B0);
  let pairsDraft = $state(/** @type {number | null} */ (B0));

  const pascalPlayer = createPlayer(pascalTrace(P0.rows));
  const lucasPlayer = createPlayer(lucasTrace(L0.n, L0.k, L0.p));
  const bracketPlayer = createPlayer(bracketTrace(B0));
  const pf = $derived(pascalPlayer.frame);
  const lf = $derived(lucasPlayer.frame);
  const bf = $derived(bracketPlayer.frame);
  const player = $derived(
    mode === 'pascal' ? pascalPlayer : mode === 'lucas' ? lucasPlayer : bracketPlayer,
  );

  let notice = $state({ text: '', at: -1, mode: /** @type {Mode} */ ('pascal') });

  const narration = $derived.by(() => {
    if (notice.mode === mode && notice.at === player.index) return notice.text;
    if (mode === 'pascal') return m.describePascal(pf, modulus, view === 'mod');
    if (mode === 'lucas') return m.describeLucas(lf);
    return m.describeBrackets(bf);
  });

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index, mode };
  }

  function clearNotice() {
    notice = { text: '', at: -1, mode };
  }

  function commitRows() {
    if (!wholeInRange(rowsDraft, 0, MAX_ROWS)) {
      rowsDraft = rows;
      say(m.rowsError(MAX_ROWS));
      return;
    }
    if (rowsDraft === rows) return;
    rows = /** @type {number} */ (rowsDraft);
    pascalPreset = '';
    selected = null;
    clearNotice();
    pascalPlayer.load(pascalTrace(rows));
  }

  function commitModulus() {
    if (!wholeInRange(modulusDraft, 2, MAX_MODULUS)) {
      modulusDraft = modulus;
      say(m.modulusError(MAX_MODULUS));
      return;
    }
    if (modulusDraft === modulus) return;
    modulus = /** @type {number} */ (modulusDraft);
    pascalPreset = '';
    clearNotice();
  }

  /** @param {PascalPreset} key */
  function loadPascal(key) {
    pascalPreset = key;
    rows = rowsDraft = PASCAL_PRESETS[key].rows;
    modulus = modulusDraft = PASCAL_PRESETS[key].p;
    selected = null;
    clearNotice();
    pascalPlayer.load(pascalTrace(rows));
  }

  function rebuildLucas() {
    lucasPreset = '';
    clearNotice();
    lucasPlayer.load(lucasTrace(n, k, p));
  }

  function commitN() {
    if (!wholeInRange(nDraft, 0, MAX_LUCAS_N)) {
      nDraft = n;
      say(m.numberError(MAX_LUCAS_N));
      return;
    }
    if (nDraft === n) return;
    n = /** @type {number} */ (nDraft);
    rebuildLucas();
  }

  function commitK() {
    if (!wholeInRange(kDraft, 0, MAX_LUCAS_N)) {
      kDraft = k;
      say(m.numberError(MAX_LUCAS_N));
      return;
    }
    if (kDraft === k) return;
    k = /** @type {number} */ (kDraft);
    rebuildLucas();
  }

  function commitP() {
    if (pDraft === null || pDraft > MAX_PRIME || !isPrime(pDraft)) {
      pDraft = p;
      say(m.primeError(MAX_PRIME));
      return;
    }
    if (pDraft === p) return;
    p = pDraft;
    rebuildLucas();
  }

  /** @param {LucasPreset} key */
  function loadLucas(key) {
    n = nDraft = LUCAS_PRESETS[key].n;
    k = kDraft = LUCAS_PRESETS[key].k;
    p = pDraft = LUCAS_PRESETS[key].p;
    rebuildLucas();
    lucasPreset = key;
  }

  function commitPairs() {
    if (!wholeInRange(pairsDraft, 0, MAX_CATALAN_N)) {
      pairsDraft = pairs;
      say(m.pairsError(MAX_CATALAN_N));
      return;
    }
    if (pairsDraft === pairs) return;
    pairs = /** @type {number} */ (pairsDraft);
    clearNotice();
    bracketPlayer.load(bracketTrace(pairs));
  }

  /** @param {number} r @param {number} c */
  const isMirror = (r, c) =>
    pickedValue !== null &&
    selected !== null &&
    selected[0] === r &&
    selected[1] === r - c &&
    selected[1] !== c &&
    pf.table[r][c] !== null;

  /** @param {number} r @param {number} c @returns {CellRole} */
  function cellRole(r, c) {
    if (pf.kind === 'edge' && r === pf.n && (c === 0 || c === r)) return 'current';
    if (pf.kind === 'add') {
      if (r === pf.n && c === pf.k) return 'current';
      if (r === pf.n - 1 && (c === pf.k || c === pf.k - 1)) return 'read';
    }
    if (isMirror(r, c)) return 'mirror';
    const value = pf.table[r][c];
    return value !== null && value % modulus === 0 ? 'multiple' : 'plain';
  }

  /** @param {number | null} value */
  const shownValue = (value) => (value === null ? null : view === 'mod' ? value % modulus : value);

  const shownTable = $derived(pf.table.map((row) => row.map(shownValue)));
  const rowHeaders = $derived(pf.table.map((_, r) => String(r)));
  const colHeaders = $derived(pf.table.map((_, c) => String(c)));
  const arrows = $derived(
    pf.kind === 'add'
      ? [
          {
            from: /** @type {[number, number]} */ ([pf.n - 1, pf.k - 1]),
            to: /** @type {[number, number]} */ ([pf.n, pf.k]),
          },
          {
            from: /** @type {[number, number]} */ ([pf.n - 1, pf.k]),
            to: /** @type {[number, number]} */ ([pf.n, pf.k]),
          },
        ]
      : [],
  );
  const multiples = $derived(pf.table.flat().filter((v) => v !== null && v % modulus === 0).length);
  const fullRow = $derived.by(() => {
    let last = -1;
    pf.table.forEach((row, r) => {
      if (row.every((v) => v !== null)) last = r;
    });
    return last;
  });
  const pickedValue = $derived(selected ? pf.table[selected[0]][selected[1]] : null);

  const lucasRow = $derived(
    lf.kind === 'digit' || lf.kind === 'zero' || lf.kind === 'multiply' ? lf.rows.length - 1 : -1,
  );
  // At n = 10⁹ the count is past 2⁵³, where a plain number would round it.
  const lucasCells = $derived(((BigInt(lf.n0) + 1n) * (BigInt(lf.n0) + 2n)) / 2n);

  const STEP_X = 28;
  const STEP_Y = 24;
  const PAD = 18;
  const heights = $derived(heightsOf(bf.prefix));
  const pathW = $derived(Math.max(2, 2 * bf.n) * STEP_X + 2 * PAD);
  const pathH = $derived(Math.max(1, bf.n) * STEP_Y + 2 * PAD + 10);
  /** @param {number} i */
  const px = (i) => PAD + i * STEP_X;
  /** @param {number} h */
  const py = (h) => pathH - PAD - h * STEP_Y;
  const pathPoints = $derived(heights.map((h, i) => `${px(i)},${py(h)}`).join(' '));
  const lastTree = $derived(treeOfSequence(bf.last));
  const treeRoots = $derived(lastTree ? [lastTree] : []);
  const catalans = $derived(
    Array.from({ length: CATALAN_SHOWN }, (_, i) => ({
      label: String(catalan(i)),
      hot: i === bf.n,
    })),
  );
</script>

{#snippet stat(
  /** @type {string} */ label,
  /** @type {string | number} */ value,
  /** @type {string} */ id,
  wide = false,
)}
  <div class="rounded-xl border border-slate-200 bg-white p-3 {wide ? 'col-span-2' : ''}">
    <dt class="text-xs text-slate-500">{label}</dt>
    <dd class="text-xl font-bold break-all tabular-nums" data-testid={id}>{value}</dd>
  </div>
{/snippet}

<LessonLayout lesson={m}>
  <div class="mb-4">
    <SegmentedControl legend={m.modeLegend} name="mode" options={MODE_OPTIONS} bind:value={mode} />
  </div>

  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    {#if mode === 'pascal'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.rows}
        <input
          type="number"
          name="rows"
          min="0"
          max={MAX_ROWS}
          class="field w-24 tabular-nums"
          bind:value={rowsDraft}
          onchange={commitRows}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.modulus}
        <input
          type="number"
          name="modulus"
          min="2"
          max={MAX_MODULUS}
          class="field w-24 tabular-nums"
          bind:value={modulusDraft}
          onchange={commitModulus}
        />
      </label>
      <SegmentedControl
        legend={m.viewLegend}
        name="view"
        options={VIEW_OPTIONS}
        bind:value={view}
      />
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.presetLabel}
        <select
          name="pascal-preset"
          class="field"
          value={pascalPreset}
          onchange={(ev) => loadPascal(/** @type {PascalPreset} */ (ev.currentTarget.value))}
        >
          {#if pascalPreset === ''}<option value="" disabled>—</option>{/if}
          {#each PASCAL_KEYS as key (key)}
            <option value={key}>{m.pascalPresets[key]}</option>
          {/each}
        </select>
      </label>
    {:else if mode === 'lucas'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.n}
        <input
          type="number"
          name="n"
          min="0"
          max={MAX_LUCAS_N}
          class="field w-36 tabular-nums"
          bind:value={nDraft}
          onchange={commitN}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.k}
        <input
          type="number"
          name="k"
          min="0"
          max={MAX_LUCAS_N}
          class="field w-36 tabular-nums"
          bind:value={kDraft}
          onchange={commitK}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.p}
        <input
          type="number"
          name="p"
          min="2"
          max={MAX_PRIME}
          class="field w-24 tabular-nums"
          bind:value={pDraft}
          onchange={commitP}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.presetLabel}
        <select
          name="lucas-preset"
          class="field"
          value={lucasPreset}
          onchange={(ev) => loadLucas(/** @type {LucasPreset} */ (ev.currentTarget.value))}
        >
          {#if lucasPreset === ''}<option value="" disabled>—</option>{/if}
          {#each LUCAS_KEYS as key (key)}
            <option value={key}>{m.lucasPresets[key]}</option>
          {/each}
        </select>
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.pairs}
        <input
          type="number"
          name="pairs"
          min="0"
          max={MAX_CATALAN_N}
          class="field w-24 tabular-nums"
          bind:value={pairsDraft}
          onchange={commitPairs}
        />
      </label>
    {/if}
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      {#if mode === 'pascal'}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.triangleTitle}
          </h2>
          <DpTable
            values={shownTable}
            {rowHeaders}
            {colHeaders}
            {arrows}
            ariaLabel={m.triangleAria(modulus)}
            stateOf={(r, c) => CELL_STATE[cellRole(r, c)]}
            markerOf={(r, c) => m.cellMarkers[cellRole(r, c)]}
            labelOf={(r, c) => {
              const value = shownValue(pf.table[r][c]);
              return m.cellLabel(
                r,
                c,
                value === null ? '' : String(value),
                m.cellStates[cellRole(r, c)],
              );
            }}
            onselect={(r, c) => (selected = [r, c])}
            {selected}
            speed={player.speed}
          />
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each LEGEND as role (role)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[CELL_STATE[role]]}"
                ></span>{m.legend[role]}
              </li>
            {/each}
          </ul>
        </div>
      {:else if mode === 'lucas'}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.digitsTitle}
          </h2>
          {#if lf.rows.length === 0}
            <p class="text-sm text-slate-500">
              {lf.n0 === 0 && lf.k0 === 0 ? m.digitsNone : m.digitsEmpty}
            </p>
          {:else}
            <ScrollFrame>
              <table class="w-full text-right text-sm tabular-nums">
                <thead>
                  <tr class="text-xs text-slate-500">
                    <th scope="col" class="w-5"></th>
                    <th scope="col" class="px-2 py-1 font-semibold">{m.digitsHead.pos}</th>
                    <th scope="col" class="px-2 py-1 font-semibold">{m.digitsHead.ni}</th>
                    <th scope="col" class="px-2 py-1 font-semibold">{m.digitsHead.ki}</th>
                    <th scope="col" class="px-2 py-1 font-semibold">{m.digitsHead.term}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each lf.rows as row (row.pos)}
                    {@const here = row.pos === lucasRow}
                    <tr class="border-t border-slate-100 {here ? 'bg-amber-50 font-semibold' : ''}">
                      <td aria-hidden="true">{here ? m.currentRow : ''}</td>
                      <td class="px-2 py-1">{row.pos}</td>
                      <td class="px-2 py-1">{row.ni}</td>
                      <td class="px-2 py-1">{row.ki}</td>
                      <td class="px-2 py-1">
                        {#if row.term === null}
                          {m.termWaiting}
                        {:else if row.ki > row.ni}
                          {m.termZero(row.ni, row.ki)}
                        {:else}
                          {row.term}
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </ScrollFrame>
          {/if}
        </div>
      {:else}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.pathTitle}
          </h2>
          <p
            class="mb-2 font-mono text-lg font-semibold break-all text-slate-900"
            data-testid="prefix"
          >
            {bf.prefix || m.emptyPrefix}
          </p>
          <ScrollFrame>
            <svg
              viewBox="0 0 {pathW} {pathH}"
              role="img"
              aria-label={m.pathAria(bf.prefix)}
              class="mx-auto block h-auto"
              style="width: {pathW}px; max-width: 100%; min-width: {Math.min(pathW, 300)}px"
            >
              <line
                x1={px(0)}
                x2={pathW - PAD}
                y1={py(0)}
                y2={py(0)}
                stroke-dasharray="4 4"
                class="stroke-slate-400"
              />
              <text
                x={pathW - PAD}
                y={py(0) + 13}
                text-anchor="end"
                font-size="10"
                class="fill-slate-500"
              >
                {m.baseline}
              </text>
              {#if bf.prefix}
                <polyline
                  points={pathPoints}
                  fill="none"
                  stroke-width="3"
                  stroke-linejoin="round"
                  class="stroke-teal-700"
                />
              {/if}
              {#each heights as h, i (i)}
                <circle cx={px(i)} cy={py(h)} r="4" class="fill-slate-900" />
              {/each}
              {#each [...bf.prefix] as c, i (i)}
                <text
                  x={px(i) + STEP_X / 2}
                  y={Math.min(py(heights[i]), py(heights[i + 1])) - 8}
                  text-anchor="middle"
                  font-size="13"
                  font-weight="700"
                  class="fill-slate-700">{c}</text
                >
              {/each}
            </svg>
          </ScrollFrame>
        </div>
      {/if}

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>

      {#if mode === 'pascal'}
        <div
          class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800"
          data-testid="selected"
        >
          <h2 class="mb-1 text-xs text-slate-500">{m.selectedTitle}</h2>
          {#if selected === null || pickedValue === null}
            <p>{m.selectedEmpty}</p>
          {:else}
            {@const [r, c] = selected}
            <p class="font-semibold">{m.selectedCount(r, c, pickedValue)}</p>
            <p>{m.selectedMirror(r, c)}</p>
            {#if c === 0 || c === r}
              <p>{m.selectedEdge}</p>
            {:else}
              <p>{m.selectedSum(r, c, binomial(r - 1, c), binomial(r - 1, c - 1))}</p>
            {/if}
          {/if}
        </div>
      {:else if mode === 'brackets'}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.treeTitle}
          </h2>
          <TreeView
            roots={treeRoots}
            binary
            ariaLabel={m.treeAria}
            emptyText={bf.n === 0 ? m.treeNone : m.treeEmpty}
            speed={player.speed}
          />
        </div>
      {/if}
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        {#if mode === 'pascal'}
          {@render stat(m.pascalStats.additions, pf.additions, 'additions')}
          {@render stat(m.pascalStats.filled, pf.filled, 'filled')}
          {@render stat(m.pascalStats.multiples, multiples, 'multiples')}
          {@render stat(
            m.pascalStats.rowSum,
            fullRow < 0 ? m.rowSumEmpty : m.rowSumNote(fullRow, 2 ** fullRow),
            'row-sum',
          )}
        {:else if mode === 'lucas'}
          {@render stat(m.lucasStats.result, lf.result, 'result')}
          {@render stat(m.lucasStats.digits, lf.rows.length, 'digits')}
          {@render stat(m.lucasStats.table, lf.tableSize, 'table')}
          {@render stat(m.lucasStats.pascal, lucasCells.toLocaleString('en-US'), 'pascal-cells')}
        {:else}
          {@render stat(m.bracketStats.found, bf.found.length, 'found')}
          {@render stat(m.bracketStats.calls, bf.calls, 'calls')}
          {@render stat(m.bracketStats.all, binomial(2 * bf.n, bf.n), 'all')}
          {@render stat(m.bracketStats.bad, binomial(2 * bf.n, bf.n + 1), 'bad')}
          {@render stat(m.bracketStats.catalan, catalan(bf.n), 'catalan', true)}
        {/if}
      </dl>
      {#if mode === 'lucas'}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-1 text-xs text-slate-500">{m.formulaTitle}</h2>
          <p
            class="font-mono text-sm font-semibold break-words text-slate-900"
            data-testid="formula"
          >
            {m.lucasFormula(lf)}
          </p>
        </div>
        <CodePanel lines={lucasPseudocode} active={lf.lines} />
      {:else if mode === 'brackets'}
        <ChipList
          title={m.foundTitle}
          items={bf.found.map((label) => ({ label: label || m.emptyPrefix }))}
          emptyText={m.foundEmpty}
          limit={42}
        />
        <ChipList title={m.catalanTitle} items={catalans} emptyText="" limit={CATALAN_SHOWN} />
        <CodePanel lines={bracketPseudocode} active={bf.lines} />
      {:else}
        <CodePanel lines={pascalPseudocode} active={pf.lines} />
      {/if}
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      {#key mode}
        <StepControls {player} />
      {/key}
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
