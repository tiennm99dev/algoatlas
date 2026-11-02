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
    KMP_PRESETS,
    MAX_PATTERN,
    MAX_TEXT,
    kmpPseudocode,
    kmpTrace,
  } from '$lib/algo-engine/kmp.js';
  import { en as m } from '$lib/lessons/kmp/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof KMP_PRESETS} Preset */
  /** @typedef {keyof typeof m.states} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(KMP_PRESETS));
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    matched: 'visited',
    read: 'compare',
    equal: 'active',
    miss: 'swap',
    border: 'frontier',
    found: 'sorted',
  };
  const ROLES = /** @type {Role[]} */ (Object.keys(ROLE_STATE));
  const errors = m.fieldErrors(MAX_TEXT, MAX_PATTERN);

  const INITIAL = KMP_PRESETS.classic;
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let text = $state(INITIAL.text);
  let pattern = $state(INITIAL.pattern);
  let textDraft = $state(INITIAL.text);
  let patternDraft = $state(INITIAL.pattern);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(kmpTrace(INITIAL.text, INITIAL.pattern));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(kmpTrace(text, pattern));
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
    text = textDraft = KMP_PRESETS[p].text;
    pattern = patternDraft = KMP_PRESETS[p].pattern;
    rebuild();
  }

  const building = $derived(frame.phase === 'build');
  const top = $derived(building ? frame.pattern : frame.text);
  const pl = $derived(frame.pattern.length);
  const cols = $derived(Math.max(frame.text.length, pl));
  // Comparing, P[k] sits under index i. After a match or its fallback, i is already read, so the
  // k letters that count end at i.
  const settled = $derived(frame.kind === 'match' || frame.kind === 'advance');
  const offset = $derived(frame.i - frame.k + (settled ? 1 : 0));
  // No alignment exists before the first comparison or after the last one.
  const aligned = $derived(!['start', 'search-start', 'done', 'build-store'].includes(frame.kind));
  const showUnder = $derived(aligned && !(building && frame.i === 0));
  const values = $derived([
    Array.from({ length: cols }, (_, c) => top[c] ?? null),
    Array.from({ length: cols }, (_, c) => {
      if (!showUnder) return null;
      const j = c - offset;
      return j >= 0 && j < pl ? frame.pattern[j] : null;
    }),
  ]);

  /** @param {number} r @param {number} c @returns {Role | ''} */
  function roleOf(r, c) {
    const { kind, i } = frame;
    if (kind === 'match') return c > i - pl && c <= i ? 'found' : '';
    if (kind === 'build-store') return r === 0 && c === i ? 'matched' : '';
    if (kind === 'advance') return c >= offset && c <= i ? 'border' : '';
    if (!showUnder) return '';
    if (c >= offset && c < i) {
      return kind === 'fall' || kind === 'build-fall' ? 'border' : 'matched';
    }
    if (c !== i) return '';
    if (kind === 'compare' || kind === 'build-compare') return frame.equal ? 'equal' : 'miss';
    return 'read';
  }

  // The prefix function table: the border just used lights up at both of its ends.
  const piValues = $derived([[...frame.pattern], frame.pi]);

  /** @param {number} r @param {number} c @returns {Role | ''} */
  function piRoleOf(r, c) {
    const { fallFrom, k, kind, i } = frame;
    if (kind === 'build-store' && r === 1 && c === i) return 'equal';
    if (fallFrom < 0) return '';
    if (r === 1) return c === fallFrom - 1 ? 'read' : '';
    return c < k || (c >= fallFrom - k && c < fallFrom) ? 'border' : '';
  }

  /**
   * @param {'top'|'under'|'letter'|'pi'} rowKey
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

  // The current column stays in view when the board is wider than a phone screen.
  /** @type {HTMLElement | undefined} */
  let board = $state();
  $effect(() => {
    const box = board?.parentElement;
    if (!board || !box) return;
    box.scrollLeft = Math.max(0, ((frame.i + 1) / cols) * board.scrollWidth - box.clientWidth / 2);
  });

  const naive = $derived(naiveComparisons(frame.text, frame.pattern));
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
        class="field w-40 font-mono normal-case"
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
          {m.boardTitle[frame.phase]}
        </h2>
        <ScrollFrame>
          <!-- The minimum width keeps letters readable; the frame scrolls on a narrow screen. -->
          <div bind:this={board} style="min-width: {cols * 30 + 28}px">
            <DpTable
              {values}
              ariaLabel={m.boardAria(top, frame.pattern)}
              rowHeaders={[m.rows.top[frame.phase], m.rows.under]}
              colHeaders={Array.from({ length: cols }, (_, c) => String(c))}
              stateOf={(r, c) => {
                const role = roleOf(r, c);
                return role ? ROLE_STATE[role] : '';
              }}
              markerOf={(r, c) => {
                const role = roleOf(r, c);
                return role ? m.markers[role] : '';
              }}
              labelOf={(r, c) => labelFor(r === 0 ? 'top' : 'under', c, values[r][c], roleOf(r, c))}
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

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.piTitle}
        </h2>
        <DpTable
          values={piValues}
          ariaLabel={m.piAria(frame.pattern)}
          rowHeaders={[m.piRows.letter, m.piRows.pi]}
          colHeaders={Array.from({ length: pl }, (_, c) => String(c))}
          stateOf={(r, c) => {
            const role = piRoleOf(r, c);
            return role ? ROLE_STATE[role] : '';
          }}
          markerOf={(r, c) => {
            const role = piRoleOf(r, c);
            return role ? m.markers[role] : '';
          }}
          labelOf={(r, c) => labelFor(r === 0 ? 'letter' : 'pi', c, piValues[r][c], piRoleOf(r, c))}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.piNote}</p>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.i}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="i">{frame.i}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.k}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="k">{frame.k}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.build}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="build">
            {frame.buildComparisons}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="comparisons">
            {frame.comparisons}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.falls}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="falls">{frame.falls}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="naive">{naive}</dd>
        </div>
      </dl>
      <p class="text-sm text-slate-600">{m.bound(frame.text.length)}</p>
      <ChipList
        title={m.matchesTitle}
        items={frame.matches.map((s) => ({ label: String(s) }))}
        emptyText={m.matchesEmpty}
      />
      <CodePanel lines={kmpPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
