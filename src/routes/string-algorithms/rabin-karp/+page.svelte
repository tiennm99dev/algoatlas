<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_BASE,
    MAX_MOD,
    MAX_PATTERN,
    MAX_TEXT,
    RABIN_KARP_PRESETS,
    expectedSpurious,
    rabinKarpPseudocode,
    rabinKarpTrace,
  } from '$lib/algo-engine/rabin-karp.js';
  import { en as m } from '$lib/lessons/rabin-karp/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import { parseLetters } from '$lib/algo-engine/text-match.js';
  import { naiveComparisons } from '$lib/algo-engine/text-match.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof RABIN_KARP_PRESETS} Preset */
  /** @typedef {keyof typeof m.states} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(RABIN_KARP_PRESETS));
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    window: 'frontier',
    hashing: 'active',
    read: 'compare',
    match: 'sorted',
    miss: 'swap',
    spurious: 'path',
  };
  const ROLES = /** @type {Role[]} */ (Object.keys(ROLE_STATE));
  const ROW_KEYS = /** @type {const} */ (['text', 'pattern', 'hash']);
  const errors = m.fieldErrors(MAX_TEXT, MAX_PATTERN);

  const INITIAL = RABIN_KARP_PRESETS.plain;
  let preset = $state(/** @type {Preset | ''} */ ('plain'));
  let input = $state({ ...INITIAL });
  // Each field's text follows the input as the learner types and commits on change.
  let textDraft = $state(INITIAL.text);
  let patternDraft = $state(INITIAL.pattern);
  let baseDraft = $state(/** @type {number | null} */ (INITIAL.base));
  let modDraft = $state(/** @type {number | null} */ (INITIAL.mod));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(
    rabinKarpTrace(INITIAL.text, INITIAL.pattern, INITIAL.base, INITIAL.mod),
  );
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(rabinKarpTrace(input.text, input.pattern, input.base, input.mod));
  }

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function commitText() {
    const parsed = parseLetters(textDraft, MAX_TEXT);
    if ('error' in parsed) {
      textDraft = input.text;
      say(parsed.error === 'length' ? errors.textLength : errors[parsed.error]);
      return;
    }
    textDraft = parsed.word;
    if (parsed.word === input.text) return;
    input.text = parsed.word;
    preset = '';
    rebuild();
  }

  function commitPattern() {
    const parsed = parseLetters(patternDraft, MAX_PATTERN);
    if ('error' in parsed) {
      patternDraft = input.pattern;
      say(parsed.error === 'length' ? errors.patternLength : errors[parsed.error]);
      return;
    }
    patternDraft = parsed.word;
    if (parsed.word === input.pattern) return;
    input.pattern = parsed.word;
    preset = '';
    rebuild();
  }

  function commitBase() {
    if (!wholeInRange(baseDraft, 2, MAX_BASE)) {
      baseDraft = input.base;
      say(m.baseError(MAX_BASE));
      return;
    }
    if (baseDraft === input.base) return;
    input.base = /** @type {number} */ (baseDraft);
    preset = '';
    rebuild();
  }

  function commitMod() {
    if (!wholeInRange(modDraft, 2, MAX_MOD)) {
      modDraft = input.mod;
      say(m.modError(MAX_MOD));
      return;
    }
    if (modDraft === input.mod) return;
    input.mod = /** @type {number} */ (modDraft);
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    input = { ...RABIN_KARP_PRESETS[p] };
    textDraft = input.text;
    patternDraft = input.pattern;
    baseDraft = input.base;
    modDraft = input.mod;
    rebuild();
  }

  const n = $derived(frame.text.length);
  const pl = $derived(frame.pattern.length);
  const cols = $derived(Math.max(n, pl));
  const offset = $derived(Math.max(frame.shift, 0));
  const inWindow = (/** @type {number} */ c) => frame.shift >= 0 && c >= offset && c < offset + pl;
  const textRow = $derived(Array.from({ length: cols }, (_, c) => frame.text[c] ?? null));
  const patternRow = $derived(
    Array.from({ length: cols }, (_, c) => {
      const j = c - offset;
      return j >= 0 && j < pl ? frame.pattern[j] : null;
    }),
  );
  const values = $derived([
    textRow,
    patternRow,
    Array.from({ length: cols }, (_, c) => frame.hashes[c] ?? null),
  ]);

  /** @param {number} r @param {number} c @returns {Role | ''} */
  function roleOf(r, c) {
    if (r === 2) {
      if (frame.matches.includes(c)) return 'match';
      if (frame.spurious.includes(c)) return 'spurious';
      return c === frame.shift && frame.kind !== 'done' ? 'window' : '';
    }
    const j = c - offset;
    if (frame.kind === 'hash-letter') {
      return j === frame.at && (r === 1 || pl <= n) ? 'hashing' : '';
    }
    if (frame.kind === 'match' && inWindow(c)) return 'match';
    if (frame.kind === 'spurious' && inWindow(c)) return 'spurious';
    if (frame.kind === 'verify' && j >= 0 && j <= frame.at) {
      if (j < frame.at) return 'match';
      return frame.equal ? 'read' : 'miss';
    }
    if (frame.kind === 'roll' && r === 0 && c === frame.shift + pl) return 'hashing';
    if (r === 0 && inWindow(c) && frame.kind !== 'done') return 'window';
    return '';
  }

  /** @param {number} r @param {number} c */
  function cellLabel(r, c) {
    const role = roleOf(r, c);
    const value = values[r][c];
    return m.cellLabel(
      m.rowNames[ROW_KEYS[r]],
      c,
      value === null ? '' : String(value),
      role ? m.states[role] : '',
    );
  }

  // The current column stays in view when the board is wider than a phone screen.
  /** @type {HTMLElement | undefined} */
  let board = $state();
  $effect(() => {
    const box = board?.parentElement;
    if (!board || !box) return;
    const col = offset + Math.max(frame.at, 0);
    box.scrollLeft = Math.max(0, ((col + 1) / cols) * board.scrollWidth - box.clientWidth / 2);
  });

  const naive = $derived(naiveComparisons(frame.text, frame.pattern));
  const windows = $derived(Math.max(0, n - pl + 1));
  const expected = $derived(expectedSpurious(n, pl, frame.mod));
  const hashBoxes = $derived([
    { label: m.patternHash, value: frame.patternHash },
    { label: m.windowHash, value: frame.windowHash },
  ]);
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
      {m.textLabel}
      <input
        type="text"
        name="text"
        maxlength={MAX_TEXT + 4}
        autocomplete="off"
        autocapitalize="none"
        class="field w-56 font-mono normal-case"
        bind:value={textDraft}
        onchange={commitText}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
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
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.baseLabel}
      <input
        type="number"
        name="base"
        min="2"
        max={MAX_BASE}
        step="1"
        class="field w-24"
        bind:value={baseDraft}
        onchange={commitBase}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.modLabel}
      <input
        type="number"
        name="mod"
        min="2"
        max={MAX_MOD}
        step="1"
        class="field w-28"
        bind:value={modDraft}
        onchange={commitMod}
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
        <ScrollFrame>
          <!-- The minimum width keeps letters readable; the frame scrolls on a narrow screen. -->
          <div bind:this={board} style="min-width: {cols * 30 + 28}px">
            <DpTable
              {values}
              ariaLabel={m.boardAria(frame.text, frame.pattern)}
              rowHeaders={[m.rows.text, m.rows.pattern, m.rows.hash]}
              colHeaders={Array.from({ length: cols }, (_, c) => String(c))}
              stateOf={(r, c) => {
                const role = roleOf(r, c);
                return role ? ROLE_STATE[role] : '';
              }}
              markerOf={(r, c) => {
                const role = roleOf(r, c);
                return role ? m.markers[role] : '';
              }}
              labelOf={cellLabel}
              speed={player.speed}
            />
          </div>
        </ScrollFrame>
        <p class="mt-2 text-xs text-slate-600">{m.boardNote}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each ROLES as role (role)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[role]]}"
              ></span>{m.markers[role]}
              {m.legend[role]}
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

      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.hashTitle}</h2>
        <dl class="grid grid-cols-2 gap-3">
          {#each hashBoxes as box (box.label)}
            <div>
              <dt class="font-mono text-xs text-slate-500">{box.label}</dt>
              <dd class="text-xl font-bold tabular-nums">{box.value ?? '—'}</dd>
            </div>
          {/each}
        </dl>
        <h2 class="mt-3 mb-1 text-xs text-slate-500">{m.rollTitle}</h2>
        <p class="font-mono text-sm break-words text-slate-800" data-testid="roll">
          {m.rollLine(frame)}
        </p>
        <p class="mt-1 text-xs text-slate-600">{m.rollKey}</p>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="checks">{frame.hashChecks}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.reads}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="reads">{frame.letterReads}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.matches}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="matches">
            {frame.matches.length}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.spurious}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="spurious">
            {frame.spurious.length}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.hashWork}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="work">{frame.hashWork}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.scratch}</dt>
          <dd class="text-2xl font-bold tabular-nums">{pl + windows * pl}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="naive">{naive}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.expected}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="expected">
            {expected < 0.01 ? expected.toPrecision(2) : expected.toFixed(2)}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.matchesTitle}
        items={frame.matches.map((s) => ({ label: String(s), hot: s === frame.shift }))}
        emptyText={m.matchesEmpty}
      />
      <CodePanel lines={rabinKarpPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
