<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MANACHER_PRESETS,
    MAX_LEN,
    manacherPseudocode,
    manacherTrace,
    naiveExpansions,
  } from '$lib/algo-engine/manacher.js';
  import { parseLetters } from '$lib/algo-engine/tries.js';
  import { en as m } from '$lib/lessons/manacher/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import ArcBoard from './arc-board.svelte';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof MANACHER_PRESETS} Preset */
  /** @typedef {keyof typeof m.states} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(MANACHER_PRESETS));
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'active',
    mirror: 'compare',
    band: 'frontier',
    equal: 'visited',
    miss: 'swap',
    best: 'sorted',
  };
  const ROLES = /** @type {Role[]} */ (Object.keys(ROLE_STATE));
  const errors = m.fieldErrors(MAX_LEN);

  const INITIAL = MANACHER_PRESETS.nested;
  let preset = $state(/** @type {Preset | ''} */ ('nested'));
  let text = $state(INITIAL);
  let textDraft = $state(INITIAL);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(manacherTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(manacherTrace(text));
  }

  function commitText() {
    const parsed = parseLetters(textDraft, MAX_LEN);
    if ('error' in parsed) {
      textDraft = text;
      notice = { text: errors[parsed.error], at: player.index };
      return;
    }
    textDraft = parsed.word;
    if (parsed.word === text) return;
    text = parsed.word;
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    text = textDraft = MANACHER_PRESETS[p];
    rebuild();
  }

  /** @param {number} c @returns {Role | ''} */
  function roleOf(c) {
    const f = frame;
    if (f.kind === 'done') {
      return Math.abs(c - f.bestCentre) <= f.best ? 'best' : '';
    }
    if (f.kind === 'compare') {
      if (c === f.i - f.value - 1 || c === f.i + f.value + 1) return f.equal ? 'equal' : 'miss';
    }
    if (c === f.i) return 'current';
    if (c === f.mirror) return 'mirror';
    return f.r > 0 && Math.abs(c - f.c) <= f.r - f.c ? 'band' : '';
  }

  /** @param {number} c */
  function cellLabel(c) {
    const role = roleOf(c);
    const radius = frame.p[c];
    return m.cellLabel(
      c,
      frame.t[c],
      radius === null ? '' : String(radius),
      role ? m.states[role] : '',
    );
  }

  const naive = $derived(naiveExpansions(frame.t));
  const answer = $derived(m.answer(frame));
</script>

{#snippet stat(
  /** @type {string} */ label,
  /** @type {string} */ id,
  /** @type {string | number} */ value,
)}
  <div class="rounded-xl border border-slate-200 bg-white p-3">
    <dt class="text-xs text-slate-500">{label}</dt>
    <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
  </div>
{/snippet}

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
        <ArcBoard
          {frame}
          ariaLabel={m.boardAria(frame.s)}
          stateOf={(c) => {
            const role = roleOf(c);
            return role ? ROLE_STATE[role] : '';
          }}
          markerOf={(c) => {
            const role = roleOf(c);
            return role ? m.markers[role] : '';
          }}
          labelOf={cellLabel}
          centreMark={m.centreMark}
          rightMark={m.rightMark}
          rowP={m.rowP}
          rowIndex={m.rowIndex}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.boardNote}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each ROLES as role (role)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[role]]}"
              ></span>{m.legend[role]}
            </li>
          {/each}
          <li>{m.arcs.done}</li>
          <li>{m.arcs.current}</li>
          <li>{m.arcs.mirror}</li>
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
        {@render stat(m.stats.i, 'i', frame.i < 0 ? '—' : frame.i)}
        {@render stat(m.stats.band, 'band', m.bandValue(frame.c, frame.r))}
        {@render stat(m.stats.comparisons, 'comparisons', frame.comparisons)}
        {@render stat(m.stats.reused, 'reused', frame.reused)}
        {@render stat(m.stats.naive, 'naive', naive)}
        {@render stat(m.stats.best, 'best', frame.best)}
      </dl>
      <ChipList
        title={m.answerTitle}
        items={answer ? [{ label: answer }] : []}
        emptyText={m.answerEmpty}
      />
      <CodePanel lines={manacherPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
