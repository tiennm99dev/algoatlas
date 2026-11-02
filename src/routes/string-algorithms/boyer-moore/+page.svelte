<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import { naiveComparisons } from '$lib/algo-engine/rabin-karp.js';
  import { parseLetters } from '$lib/algo-engine/tries.js';
  import {
    BOYER_MOORE_PRESETS,
    MAX_PATTERN,
    MAX_TEXT,
    boyerMoorePseudocode,
    boyerMooreTrace,
  } from '$lib/algo-engine/boyer-moore.js';
  import { en as m } from '$lib/lessons/boyer-moore/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof BOYER_MOORE_PRESETS} Preset */
  /** @typedef {keyof typeof m.states} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(BOYER_MOORE_PRESETS));
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    read: 'pruned',
    equal: 'active',
    miss: 'swap',
    bad: 'frontier',
    found: 'sorted',
  };
  const ROLES = /** @type {Role[]} */ (Object.keys(ROLE_STATE));
  const errors = m.fieldErrors(MAX_TEXT, MAX_PATTERN);

  const INITIAL = BOYER_MOORE_PRESETS.classic;
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let text = $state(INITIAL.text);
  let pattern = $state(INITIAL.pattern);
  let textDraft = $state(INITIAL.text);
  let patternDraft = $state(INITIAL.pattern);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(boyerMooreTrace(INITIAL.text, INITIAL.pattern));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(boyerMooreTrace(text, pattern));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function commitText() {
    const parsed = parseLetters(textDraft, MAX_TEXT);
    if ('error' in parsed) {
      textDraft = text;
      say(parsed.error === 'length' ? errors.textLength : errors[parsed.error]);
      return;
    }
    textDraft = parsed.word;
    if (parsed.word === text) return;
    text = parsed.word;
    preset = '';
    rebuild();
  }

  function commitPattern() {
    const parsed = parseLetters(patternDraft, MAX_PATTERN);
    if ('error' in parsed) {
      patternDraft = pattern;
      say(parsed.error === 'length' ? errors.patternLength : errors[parsed.error]);
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
    text = textDraft = BOYER_MOORE_PRESETS[p].text;
    pattern = patternDraft = BOYER_MOORE_PRESETS[p].pattern;
    rebuild();
  }

  const pl = $derived(frame.pattern.length);
  const cols = $derived(Math.max(frame.text.length, pl));
  const values = $derived([
    Array.from({ length: cols }, (_, c) => frame.text[c] ?? null),
    Array.from({ length: cols }, (_, c) => {
      const j = c - frame.shift;
      return j >= 0 && j < pl ? frame.pattern[j] : null;
    }),
  ]);
  // The letters that matched in this alignment, on the way left to the current one.
  const matchedFrom = $derived(frame.j >= 0 ? frame.j + 1 : pl);

  /** @param {number} r @param {number} c @returns {Role | ''} */
  function roleOf(r, c) {
    const { kind, shift, j } = frame;
    const inP = c - shift;
    if (kind === 'match' && inP >= 0 && inP < pl) return 'found';
    if (kind === 'compare' || kind === 'shift') {
      if (r === 0 && c === frame.badAt) return 'bad';
      if (kind === 'compare' && inP === j) return frame.equal ? 'equal' : 'miss';
      if (kind === 'shift' && !frame.afterMatch && inP === j) return 'miss';
      if (j >= 0 && inP >= matchedFrom && inP < pl) return 'equal';
    }
    if (r === 0 && frame.reads.includes(c)) return 'read';
    return '';
  }

  const tableLetters = $derived(Object.keys(frame.last).sort());
  const tableValues = $derived([tableLetters, tableLetters.map((c) => frame.last[c])]);

  /** @param {number} r @param {number} c @returns {Role | ''} */
  function tableRoleOf(r, c) {
    const letter = tableLetters[c];
    if (frame.kind === 'table') return letter === frame.pattern[frame.j] ? 'equal' : '';
    return frame.kind === 'shift' && letter === frame.badLetter ? 'bad' : '';
  }

  /**
   * @param {'text'|'pattern'|'letter'|'last'} rowKey
   * @param {number} c
   * @param {unknown} value
   * @param {Role | ''} role
   */
  const labelFor = (rowKey, c, value, role) =>
    m.cellLabel(
      m.rowNames[rowKey],
      c,
      value === null || value === undefined ? '' : String(value),
      role ? m.states[role] : '',
    );

  // The current alignment stays in view when the board is wider than a phone screen.
  /** @type {HTMLElement | undefined} */
  let board = $state();
  $effect(() => {
    const box = board?.parentElement;
    if (!board || !box) return;
    const col = frame.shift + Math.max(frame.j, 0);
    box.scrollLeft = Math.max(0, ((col + 1) / cols) * board.scrollWidth - box.clientWidth / 2);
  });

  const naive = $derived(naiveComparisons(frame.text, frame.pattern));
  const unread = $derived(frame.text.length - frame.reads.length);
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
              ariaLabel={m.boardAria(frame.text, frame.pattern, frame.shift)}
              rowHeaders={[m.rows.text, m.rows.pattern]}
              colHeaders={Array.from({ length: cols }, (_, c) => String(c))}
              stateOf={(r, c) => {
                const role = roleOf(r, c);
                return role ? ROLE_STATE[role] : '';
              }}
              markerOf={(r, c) => {
                const role = roleOf(r, c);
                return role ? m.markers[role] : '';
              }}
              labelOf={(r, c) =>
                labelFor(r === 0 ? 'text' : 'pattern', c, values[r][c], roleOf(r, c))}
              speed={player.speed}
            />
          </div>
        </ScrollFrame>
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
        <h2 class="mb-1 text-xs text-slate-500">{m.ruleTitle}</h2>
        <p class="font-mono text-sm break-words text-slate-800" data-testid="rule">
          {m.ruleLine(frame)}
        </p>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <DpTable
          values={tableValues}
          ariaLabel={m.tableAria(frame.pattern)}
          rowHeaders={[m.tableRows.letter, m.tableRows.last]}
          stateOf={(r, c) => {
            const role = tableRoleOf(r, c);
            return role ? ROLE_STATE[role] : '';
          }}
          markerOf={(r, c) => {
            const role = tableRoleOf(r, c);
            return role ? m.markers[role] : '';
          }}
          labelOf={(r, c) =>
            labelFor(r === 0 ? 'letter' : 'last', c, tableValues[r][c], tableRoleOf(r, c))}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.tableNote}</p>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="comparisons">
            {frame.comparisons}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.alignments}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="alignments">
            {frame.alignments}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.unread}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="unread">{unread}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="naive">{naive}</dd>
        </div>
      </dl>
      <ChipList
        title={m.skipsTitle}
        items={frame.skips.map((s, i) => ({
          label: `+${s}`,
          hot: frame.kind === 'shift' && i === frame.skips.length - 1,
        }))}
        emptyText={m.skipsEmpty}
      />
      <ChipList
        title={m.matchesTitle}
        items={frame.matches.map((s) => ({ label: String(s) }))}
        emptyText={m.matchesEmpty}
      />
      <CodePanel lines={boyerMoorePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
