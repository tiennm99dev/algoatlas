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
  import {
    MAX_LEN,
    Z_PRESETS,
    naiveZComparisons,
    zInput,
    zPseudocode,
    zTrace,
  } from '$lib/algo-engine/z-function.js';
  import { en as m } from '$lib/lessons/z-function/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import { parseLetters } from '$lib/algo-engine/text-match.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof Z_PRESETS} Preset */
  /** @typedef {keyof typeof m.states} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(Z_PRESETS));
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    box: 'frontier',
    mirror: 'path',
    matched: 'visited',
    equal: 'active',
    miss: 'swap',
    current: 'compare',
    found: 'sorted',
  };
  const ROLES = /** @type {Role[]} */ (Object.keys(ROLE_STATE));
  const ROW_KEYS = /** @type {const} */ (['s', 'prefix', 'z']);
  const errors = m.fieldErrors(MAX_LEN);

  const INITIAL = Z_PRESETS.classic;
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let text = $state(INITIAL.text);
  let pattern = $state(INITIAL.pattern);
  let textDraft = $state(INITIAL.text);
  let patternDraft = $state(INITIAL.pattern);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(zTrace(INITIAL.text, INITIAL.pattern));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(zTrace(text, pattern));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function commitText() {
    const parsed = parseLetters(textDraft, MAX_LEN);
    if ('error' in parsed) {
      textDraft = text;
      say(errors[parsed.error]);
      return;
    }
    if (zInput(parsed.word, pattern).length > MAX_LEN) {
      textDraft = text;
      say(errors.combined);
      return;
    }
    textDraft = parsed.word;
    if (parsed.word === text) return;
    text = parsed.word;
    preset = '';
    rebuild();
  }

  function commitPattern() {
    // An emptied pattern is fine here: it means a plain Z-function of the text.
    const parsed = patternDraft.trim() === '' ? { word: '' } : parseLetters(patternDraft, MAX_LEN);
    if ('error' in parsed) {
      patternDraft = pattern;
      say(errors[parsed.error]);
      return;
    }
    if (zInput(text, parsed.word).length > MAX_LEN) {
      patternDraft = pattern;
      say(errors.combined);
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
    text = textDraft = Z_PRESETS[p].text;
    pattern = patternDraft = Z_PRESETS[p].pattern;
    rebuild();
  }

  const n = $derived(frame.s.length);
  const inBox = (/** @type {number} */ c) => frame.r > frame.l && c >= frame.l && c < frame.r;
  const comparing = $derived(frame.kind === 'compare');
  const values = $derived([
    [...frame.s],
    Array.from({ length: n }, (_, c) => {
      if (frame.i < 0) return null;
      const k = c - frame.i;
      return k >= 0 ? frame.s[k] : null;
    }),
    frame.z,
  ]);
  const zMatch = (/** @type {number} */ c) =>
    frame.patternLength > 0 && frame.z[c] === frame.patternLength;

  /** @param {number} r @param {number} c @returns {Role | ''} */
  function roleOf(r, c) {
    const { i, value, mirror } = frame;
    if (r === 2) {
      if (zMatch(c)) return 'found';
      if (c === i) return 'current';
      return mirror >= 0 && c === mirror ? 'mirror' : '';
    }
    if (i >= 0 && c >= i && c < i + value) return 'matched';
    if (comparing && c === i + value) return frame.equal ? 'equal' : 'miss';
    if (r === 1) return '';
    if (comparing && c === value) return frame.equal ? 'equal' : 'miss';
    if (mirror >= 0 && c === mirror) return 'mirror';
    return inBox(c) ? 'box' : '';
  }

  /** @param {number} r @param {number} c */
  function markerOf(r, c) {
    if (r === 0 && frame.r > frame.l) {
      if (c === frame.l) return m.boxEnds.left;
      if (c === frame.r - 1) return m.boxEnds.right;
    }
    const role = roleOf(r, c);
    return role ? m.markers[role] : '';
  }

  /** @param {number} r @param {number} c */
  function cellLabel(r, c) {
    const role = roleOf(r, c);
    const value = values[r][c];
    return m.cellLabel(
      m.rowNames[ROW_KEYS[r]],
      c,
      value === null || value === undefined ? '' : String(value),
      role ? m.states[role] : '',
    );
  }

  // Position i stays in view when the board is wider than a phone screen.
  /** @type {HTMLElement | undefined} */
  let board = $state();
  $effect(() => {
    const box = board?.parentElement;
    if (!board || !box) return;
    const col = Math.max(frame.i + frame.value, 0);
    box.scrollLeft = Math.max(0, ((col + 1) / n) * board.scrollWidth - box.clientWidth / 2);
  });

  const naive = $derived(naiveZComparisons(frame.s));
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
        maxlength={MAX_LEN + 4}
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
        maxlength={MAX_LEN + 4}
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
          {m.boardTitle}
        </h2>
        <ScrollFrame>
          <!-- The minimum width keeps letters readable; the frame scrolls on a narrow screen. -->
          <div bind:this={board} style="min-width: {n * 30 + 28}px">
            <DpTable
              {values}
              ariaLabel={m.boardAria(frame.s)}
              rowHeaders={[m.rows.s, m.rows.prefix, m.rows.z]}
              colHeaders={Array.from({ length: n }, (_, c) => String(c))}
              stateOf={(r, c) => {
                const role = roleOf(r, c);
                return role ? ROLE_STATE[role] : '';
              }}
              {markerOf}
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
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.i}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="i">
            {frame.i < 0 ? '—' : frame.i}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.box}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="box">
            {m.boxValue(frame.l, frame.r)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="comparisons">
            {frame.comparisons}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.reused}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="reused">{frame.reused}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="naive">{naive}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.matches}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="matches">
            {frame.matches.length}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.matchesTitle}
        items={frame.matches.map((s) => ({ label: String(s) }))}
        emptyText={m.matchesEmpty}
      />
      <CodePanel lines={zPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
