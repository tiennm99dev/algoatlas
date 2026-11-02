<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MATCHER_IDS,
    MAX_PATTERN,
    MAX_TEXT,
    STRING_PRESETS,
    parseWord,
    searchPseudocode,
    searchTrace,
    structurePseudocode,
    structureTrace,
  } from '$lib/algo-engine/practice-string-algorithms.js';
  import { en as m } from '$lib/lessons/practice-string-algorithms/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-string-algorithms.js').MatcherId} MatcherId */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof STRING_PRESETS} Preset */
  /** @typedef {keyof typeof m.searchRoles} SearchRole */
  /** @typedef {keyof typeof m.structureRoles} StructureRole */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(STRING_PRESETS));
  /** @type {Record<SearchRole, VisualState>} */
  const SEARCH_STATE = { equal: 'active', miss: 'swap', read: 'compare', found: 'sorted' };
  const SEARCH_ROLES = /** @type {SearchRole[]} */ (Object.keys(SEARCH_STATE));
  /** @type {Record<StructureRole, VisualState>} */
  const STRUCTURE_STATE = {
    now: 'active',
    border: 'compare',
    period: 'frontier',
    palindrome: 'visited',
    best: 'sorted',
  };
  const STRUCTURE_ROLES = /** @type {StructureRole[]} */ (Object.keys(STRUCTURE_STATE));
  const errors = m.fieldErrors(MAX_TEXT, MAX_PATTERN);
  // A letter stays readable at this width; a wider board scrolls inside its card.
  const COLUMN_PX = 30;

  const INITIAL = STRING_PRESETS.english;
  const firstSearch = searchTrace(INITIAL.text, INITIAL.pattern);
  const firstStructure = structureTrace(INITIAL.text);

  let mode = $state(/** @type {'search'|'structure'} */ ('search'));
  let modeChoice = $state(/** @type {string} */ ('search'));
  let watch = $state(/** @type {MatcherId} */ ('boyer'));
  let preset = $state(/** @type {Preset | ''} */ ('english'));
  let text = $state(INITIAL.text);
  let pattern = $state(INITIAL.pattern);
  let textDraft = $state(INITIAL.text);
  let patternDraft = $state(INITIAL.pattern);
  // Text shown in place of the narration, only on the frame and in the mode it was raised on.
  let notice = $state({ text: '', at: -1, mode: '' });

  const searchPlayer = createPlayer(firstSearch);
  const structurePlayer = createPlayer(firstStructure);
  searchPlayer.seek(firstSearch.length - 1);
  structurePlayer.seek(firstStructure.length - 1);

  const player = $derived(mode === 'search' ? searchPlayer : structurePlayer);
  const race = $derived(searchPlayer.frame);
  const structure = $derived(structurePlayer.frame);
  const run = $derived(race.runs[watch]);
  const finalRace = $derived(searchPlayer.frames[searchPlayer.frames.length - 1]);
  const barScale = $derived(Math.max(1, ...MATCHER_IDS.map((id) => finalRace.runs[id].steps)));
  const narration = $derived(
    notice.mode === mode && notice.at === player.index
      ? notice.text
      : mode === 'search'
        ? m.describeSearch(race, watch)
        : m.describeStructure(structure),
  );

  /** Rebuilds both readings of the text and opens on their totals. */
  function rebuild() {
    notice = { text: '', at: -1, mode: '' };
    const nextSearch = searchTrace(text, pattern);
    const nextStructure = structureTrace(text);
    searchPlayer.load(nextSearch);
    structurePlayer.load(nextStructure);
    searchPlayer.seek(nextSearch.length - 1);
    structurePlayer.seek(nextStructure.length - 1);
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index, mode };
  }

  function commitText() {
    const parsed = parseWord(textDraft, MAX_TEXT);
    if ('error' in parsed) {
      textDraft = text;
      say(parsed.error === 'length' ? errors.textLength : errors[parsed.error]);
      return;
    }
    if (parsed.word.length < pattern.length && mode === 'search') {
      textDraft = text;
      say(errors.patternTooLong);
      return;
    }
    textDraft = parsed.word;
    if (parsed.word === text) return;
    // This mode hides the pattern, so it must not refuse a text: the pattern shortens to fit.
    if (parsed.word.length < pattern.length) {
      pattern = patternDraft = pattern.slice(0, parsed.word.length);
    }
    text = parsed.word;
    preset = '';
    rebuild();
  }

  function commitPattern() {
    const parsed = parseWord(patternDraft, MAX_PATTERN);
    if ('error' in parsed) {
      patternDraft = pattern;
      say(parsed.error === 'length' ? errors.patternLength : errors[parsed.error]);
      return;
    }
    if (parsed.word.length > text.length) {
      patternDraft = pattern;
      say(errors.patternTooLong);
      return;
    }
    patternDraft = parsed.word;
    if (parsed.word === pattern) return;
    pattern = parsed.word;
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    text = textDraft = STRING_PRESETS[p].text;
    pattern = patternDraft = STRING_PRESETS[p].pattern;
    rebuild();
  }

  function pickMode() {
    searchPlayer.pause();
    structurePlayer.pause();
    mode = /** @type {'search'|'structure'} */ (modeChoice);
  }

  const count = (/** @type {number} */ x) => x.toLocaleString('en-US');
  const share = (/** @type {number} */ part) => (part / barScale) * 100;

  // The pattern row sits where the matcher has lined it up; while preparing, under the start.
  const boardShift = $derived(Math.max(run.shift, 0));
  const patternLength = $derived(pattern.length);
  const cols = $derived(race.text.length);
  const boardValues = $derived([
    Array.from({ length: cols }, (_, c) => race.text[c]),
    Array.from({ length: cols }, (_, c) => race.pattern[c - boardShift] ?? null),
  ]);

  /** @param {number} r @param {number} c @returns {SearchRole | ''} */
  function searchRole(r, c) {
    const live = !run.finished && run.kind !== 'idle';
    const j = c - boardShift;
    if (live) {
      const compares = run.kind === 'compare' || run.kind === 'verify' || run.kind === 'build';
      const verdict = run.equal ? 'equal' : 'miss';
      if (r === 0 && c === run.textAt) return compares ? verdict : 'read';
      if (r === 1 && (j === run.patternAt || (j === run.selfAt && j >= 0))) {
        return compares ? verdict : 'read';
      }
      if (r === 0 && run.kind === 'hash-check' && j >= 0 && j < patternLength) return 'read';
    }
    if (r === 0 && run.matches.some((s) => c >= s && c < s + patternLength)) return 'found';
    return '';
  }

  const structureCols = $derived(structure.text.length);
  const structureValues = $derived([
    [...structure.text],
    structure.pi.slice(),
    Array.from({ length: structureCols }, (_, c) => structure.radii[2 * c + 1]),
    Array.from({ length: structureCols }, (_, c) => structure.radii[2 * c]),
  ]);
  /** The half-open span of the text a centre's palindrome covers. */
  const currentSpan = $derived.by(() => {
    if (structure.kind !== 'centre') return null;
    const from = (structure.i - structure.value) / 2;
    return { from, to: from + structure.value };
  });
  const bestSpan = $derived.by(() => {
    const from = (structure.bestCentre - structure.best) / 2;
    return { from, to: from + structure.best };
  });

  /** @param {number} r @param {number} c @returns {StructureRole | ''} */
  function structureRole(r, c) {
    const f = structure;
    if (f.kind === 'pi') {
      if (r === 1 && c === f.i) return 'now';
      const inPrefix = c < f.value;
      const inSuffix = c > f.i - f.value && c <= f.i;
      if (r === 0 && (inPrefix || inSuffix)) return 'border';
      return '';
    }
    if (f.kind === 'period') {
      if (r === 0 && c < f.period) return 'period';
      return r === 1 && c === f.text.length - 1 ? 'now' : '';
    }
    if (f.kind === 'centre') {
      const row = f.i % 2 === 1 ? 2 : 3;
      const col = f.i % 2 === 1 ? (f.i - 1) / 2 : f.i / 2;
      if (r === row && c === col) return 'now';
    }
    if (r !== 0) return '';
    if (currentSpan && c >= currentSpan.from && c < currentSpan.to) return 'palindrome';
    if (f.best > 0 && c >= bestSpan.from && c < bestSpan.to) return 'best';
    return '';
  }

  const structureNames = [
    m.structureRowNames.text,
    m.structureRowNames.pi,
    m.structureRowNames.odd,
    m.structureRowNames.even,
  ];

  // The cell being read stays in view when the board is wider than the card.
  /** @type {HTMLElement | undefined} */
  let board = $state();
  $effect(() => {
    const box = board?.parentElement;
    if (!board || !box) return;
    const col = run.textAt >= 0 ? run.textAt : boardShift;
    box.scrollLeft = Math.max(0, ((col + 1) / cols) * board.scrollWidth - box.clientWidth / 2);
  });

  /** @type {HTMLElement | undefined} */
  let structureBoard = $state();
  $effect(() => {
    const box = structureBoard?.parentElement;
    if (!structureBoard || !box) return;
    const f = structure;
    const col = f.kind === 'pi' ? f.i : f.kind === 'centre' ? Math.floor(f.i / 2) : 0;
    box.scrollLeft = Math.max(
      0,
      ((col + 1) / structureCols) * structureBoard.scrollWidth - box.clientWidth / 2,
    );
  });

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(e) => enterField(e, {})}
    onsubmit={(e) => e.preventDefault()}
  >
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={[
        { value: 'search', label: m.modes.search },
        { value: 'structure', label: m.modes.structure },
      ]}
      bind:value={modeChoice}
      onchange={pickMode}
    />
    <label class="{labelClass} min-w-0 flex-1 basis-56">
      {m.textLabel}
      <input
        type="text"
        name="text"
        maxlength={MAX_TEXT + 4}
        autocomplete="off"
        autocapitalize="none"
        class="field w-full font-mono normal-case"
        bind:value={textDraft}
        onchange={commitText}
      />
    </label>
    {#if mode === 'search'}
      <label class={labelClass}>
        {m.patternLabel}
        <input
          type="text"
          name="pattern"
          maxlength={MAX_PATTERN + 4}
          autocomplete="off"
          autocapitalize="none"
          class="field w-32 font-mono normal-case"
          bind:value={patternDraft}
          onchange={commitPattern}
        />
      </label>
    {/if}
    <label class={labelClass}>
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

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem] lg:grid-rows-[auto_1fr]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      {#if mode === 'search'}
        <section class="rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.raceTitle}
          </h2>
          <p class="mb-3 text-xs text-slate-600">{m.raceHelp}</p>
          <ul class="flex flex-col gap-1">
            {#each MATCHER_IDS as id (id)}
              {@const r = race.runs[id]}
              <li>
                <button
                  type="button"
                  class="w-full rounded-lg border p-2 text-left {watch === id
                    ? 'border-teal-700 bg-teal-50'
                    : 'border-transparent hover:bg-slate-50'}"
                  aria-pressed={watch === id}
                  aria-label={m.watchLabel(m.matchers[id])}
                  data-testid="{id}-row"
                  onclick={() => (watch = id)}
                >
                  <span class="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span class="font-semibold text-slate-800">
                      {m.matchers[id]}
                      {#if race.cheapest.includes(id)}
                        <span class="ml-1 text-xs font-bold text-state-sorted"
                          >{m.cheapestMark} {m.cheapestWord}</span
                        >
                      {:else if r.finished}
                        <span class="ml-1 text-xs font-bold text-slate-600"
                          >{m.finishedMark} {m.finishedWord}</span
                        >
                      {/if}
                    </span>
                    <span class="text-xl font-bold tabular-nums" data-testid="{id}-steps"
                      >{count(r.steps)}</span
                    >
                  </span>
                  <span
                    class="mt-1 flex h-2 overflow-hidden rounded bg-slate-100"
                    aria-hidden="true"
                  >
                    <span class="h-2 {STATE_BG.frontier}" style="width: {share(r.prep)}%"></span>
                    <span class="h-2 {STATE_BG.active}" style="width: {share(r.search)}%"></span>
                  </span>
                  <span class="mt-1 block text-xs text-slate-600">
                    {m.stats.prep} <span data-testid="{id}-prep">{count(r.prep)}</span>
                    · {m.stats.search} <span data-testid="{id}-search">{count(r.search)}</span>
                    · {m.stats.matches}
                    <span data-testid="{id}-matches">{r.matches.length}</span>
                  </span>
                </button>
              </li>
            {/each}
          </ul>
          <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.frontier}"></span>
              {m.barPrep}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.active}"></span>
              {m.barSearch}
            </li>
            <li>{m.finishedMark} {m.finishedWord}</li>
            <li>{m.cheapestMark} {m.cheapestWord}</li>
          </ul>
        </section>

        <section class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.boardTitle(m.matchers[watch])}
          </h2>
          <ScrollFrame>
            <div bind:this={board} style="min-width: {cols * COLUMN_PX + 28}px">
              <DpTable
                values={boardValues}
                ariaLabel={m.boardAria(m.matchers[watch], race.text, race.pattern, run.shift)}
                rowHeaders={[m.boardRows.text, m.boardRows.pattern]}
                colHeaders={Array.from({ length: cols }, (_, c) => String(c))}
                stateOf={(r, c) => {
                  const role = searchRole(r, c);
                  return role ? SEARCH_STATE[role] : '';
                }}
                markerOf={(r, c) => {
                  const role = searchRole(r, c);
                  return role ? m.searchMarkers[role] : '';
                }}
                labelOf={(r, c) => {
                  const role = searchRole(r, c);
                  return m.cellLabel(
                    r === 0 ? m.boardRows.text : m.boardRows.pattern,
                    c,
                    String(boardValues[r][c] ?? ''),
                    role ? m.searchRoles[role] : '',
                  );
                }}
                speed={searchPlayer.speed}
              />
            </div>
          </ScrollFrame>
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each SEARCH_ROLES as role (role)}
              <li class="flex items-center gap-1.5">
                <span
                  class="size-3 rounded-sm border border-slate-700 {STATE_BG[SEARCH_STATE[role]]}"
                ></span>{m.searchMarkers[role]}
                {m.searchRoles[role]}
              </li>
            {/each}
          </ul>
        </section>
      {:else}
        <section class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.structureTitle}
          </h2>
          <p class="mb-3 text-xs text-slate-600">{m.structureHelp}</p>
          <ScrollFrame>
            <div bind:this={structureBoard} style="min-width: {structureCols * COLUMN_PX + 44}px">
              <DpTable
                values={structureValues}
                ariaLabel={m.structureAria(structure.text)}
                rowHeaders={[
                  m.structureRows.text,
                  m.structureRows.pi,
                  m.structureRows.odd,
                  m.structureRows.even,
                ]}
                colHeaders={Array.from({ length: structureCols }, (_, c) => String(c))}
                stateOf={(r, c) => {
                  const role = structureRole(r, c);
                  return role ? STRUCTURE_STATE[role] : '';
                }}
                markerOf={(r, c) => {
                  const role = structureRole(r, c);
                  return role ? m.structureMarkers[role] : '';
                }}
                labelOf={(r, c) => {
                  const role = structureRole(r, c);
                  return m.cellLabel(
                    structureNames[r],
                    c,
                    String(structureValues[r][c] ?? ''),
                    role ? m.structureRoles[role] : '',
                  );
                }}
                speed={structurePlayer.speed}
              />
            </div>
          </ScrollFrame>
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each STRUCTURE_ROLES as role (role)}
              <li class="flex items-center gap-1.5">
                <span
                  class="size-3 rounded-sm border border-slate-700 {STATE_BG[
                    STRUCTURE_STATE[role]
                  ]}"
                ></span>{m.structureMarkers[role]}
                {m.structureRoles[role]}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      {#if mode === 'search'}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.steps}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="steps">{count(run.steps)}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.prepTotal}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="prep">{count(run.prep)}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.found}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="found">
              {run.matches.length}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.spurious}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="spurious">
              {race.runs.rabin.hits}
            </dd>
          </div>
        </dl>
        <ChipList
          title={m.matchesTitle}
          items={run.matches.map((s) => ({ label: String(s) }))}
          emptyText={m.matchesEmpty}
          limit={40}
        />
        <CodePanel lines={searchPseudocode[watch]} active={run.lines} />
      {:else}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.period}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="period">
              {structure.period || m.noValue}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.repeats}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="repeats">
              {structure.repeats || m.noValue}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.longest}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="longest">{structure.best}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.palindromes}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="palindromes">
              {count(structure.palindromes)}
            </dd>
          </div>
        </dl>
        <section class="rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-2 text-xs text-slate-500">{m.costsTitle}</h2>
          <dl class="grid grid-cols-2 gap-x-3 gap-y-2">
            <div>
              <dt class="text-xs text-slate-500">{m.stats.piComparisons}</dt>
              <dd class="text-lg font-bold tabular-nums" data-testid="pi-comparisons">
                {count(structure.piComparisons)}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">{m.stats.tryPeriods}</dt>
              <dd class="text-lg font-bold tabular-nums" data-testid="try-periods">
                {count(structure.tryPeriods)}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">{m.stats.palComparisons}</dt>
              <dd class="text-lg font-bold tabular-nums" data-testid="pal-comparisons">
                {count(structure.palComparisons)}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">{m.stats.tryCentres}</dt>
              <dd class="text-lg font-bold tabular-nums" data-testid="try-centres">
                {count(structure.tryCentres)}
              </dd>
            </div>
          </dl>
        </section>
        <ChipList
          title={m.periodsTitle}
          items={structure.periods.map((p) => ({ label: String(p) }))}
          emptyText={m.periodsEmpty}
          limit={40}
        />
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-1 text-xs text-slate-500">{m.longestTitle}</h2>
          <p class="font-mono text-sm break-all text-slate-800" data-testid="best-text">
            {m.bestText(structure) || m.noValue}
          </p>
        </div>
        <CodePanel lines={structurePseudocode} active={structure.lines} />
      {/if}
    </div>
    <div
      class="sticky bottom-2 z-10 self-start print:hidden lg:static lg:col-start-1 lg:row-start-2"
    >
      {#if mode === 'search'}
        <StepControls player={searchPlayer} />
      {:else}
        <StepControls player={structurePlayer} />
      {/if}
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
