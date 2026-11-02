<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_LEN,
    SUFFIX_PRESETS,
    directSortComparisons,
    distinctSubstrings,
    longestRepeat,
    suffixPseudocode,
    suffixTrace,
  } from '$lib/algo-engine/suffix-arrays.js';
  import { parseLetters } from '$lib/algo-engine/tries.js';
  import { en as m } from '$lib/lessons/suffix-arrays/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof SUFFIX_PRESETS} Preset */
  /** @typedef {keyof typeof m.states} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(SUFFIX_PRESETS));
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    first: 'frontier',
    second: 'visited',
    shared: 'path',
    equal: 'sorted',
    miss: 'swap',
  };
  /** Text that stays readable on each cell colour. @type {Record<Role, string>} */
  const ROLE_TEXT = {
    first: 'text-slate-900',
    second: 'text-slate-900',
    shared: 'text-slate-900',
    equal: 'text-white',
    miss: 'text-white',
  };
  const ROLES = /** @type {Role[]} */ (Object.keys(ROLE_STATE));
  const KEY_KINDS = ['pairs', 'sorted'];
  const KASAI_KINDS = ['visit', 'compare', 'store', 'shrink'];
  const errors = m.fieldErrors(MAX_LEN);

  const INITIAL = SUFFIX_PRESETS.banana;
  let preset = $state(/** @type {Preset | ''} */ ('banana'));
  let text = $state(INITIAL);
  let textDraft = $state(INITIAL);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(suffixTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(suffixTrace(text));
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
    text = textDraft = SUFFIX_PRESETS[p];
    rebuild();
  }

  /** @param {number} start @param {number} k @returns {Role | ''} */
  function roleOf(start, k) {
    const f = frame;
    if (KASAI_KINDS.includes(f.kind)) {
      if (start !== f.i && start !== f.j) return '';
      if (k < f.h) return 'shared';
      if (f.kind === 'compare' && k === f.h) return f.equal ? 'equal' : 'miss';
      return '';
    }
    if (f.kind === 'start') return k < 1 ? 'first' : '';
    if (f.kind === 'double' || f.kind === 'stop' || f.kind === 'kasai' || f.kind === 'skip') {
      return '';
    }
    if (f.kind === 'done') return '';
    if (k < f.k) return 'first';
    return k < 2 * f.k ? 'second' : '';
  }

  /** @param {number} start */
  const rowRole = (start) =>
    start === frame.i ? 'current' : start === frame.j ? 'above' : /** @type {''} */ ('');

  /** @param {number} row @param {number} start */
  function rowLabel(row, start) {
    const role = rowRole(start);
    return m.rowLabel(row, start, frame.s.slice(start), role ? m.rowStates[role] : '');
  }

  const hasKeys = $derived(KEY_KINDS.includes(frame.kind));
  const n = $derived(frame.s.length);
  const finished = $derived(frame.kind === 'done');
  const direct = $derived(directSortComparisons(text));
</script>

{#snippet stat(
  /** @type {string} */ label,
  /** @type {string} */ id,
  /** @type {string | number} */ value,
)}
  <div class="rounded-xl border border-slate-200 bg-white p-3">
    <dt class="text-xs text-slate-500">{label}</dt>
    <dd class="text-2xl font-bold break-all tabular-nums" data-testid={id}>{value}</dd>
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
        <ScrollFrame>
          <ol
            aria-label={m.boardAria(frame.s)}
            class="font-mono text-sm"
            style="min-width: {n * 22 + 190}px"
          >
            <li class="flex items-center gap-2 pb-1 text-xs text-slate-500" aria-hidden="true">
              <span class="w-8 text-right">{m.heads.rank}</span>
              <span class="w-10 text-right">{m.heads.start}</span>
              <span class="w-16 text-center">{m.heads.key}</span>
            </li>
            {#each frame.sa as start, row (start)}
              {@const role = rowRole(start)}
              {@const h = frame.lcp[row]}
              {#if row > 0}
                <li
                  class="flex h-5 items-center gap-2"
                  data-testid="bar-{row}"
                  aria-hidden={h === null}
                >
                  <span class="w-8"></span>
                  <span class="w-10"></span>
                  <span class="w-16"></span>
                  {#if h !== null}
                    <span class="h-2.5 rounded-sm bg-state-compare" style="width: {h * 22}px"
                    ></span>
                    <span class="text-xs whitespace-nowrap text-slate-700">{m.barLabel(h)}</span>
                  {/if}
                </li>
              {/if}
              <li
                class="flex items-center gap-2 rounded {role ? 'ring-2 ring-slate-900' : ''}"
                aria-label={rowLabel(row, start)}
                data-testid="row-{row}"
              >
                <span class="w-8 text-right text-xs text-slate-500">{row}</span>
                <span class="w-10 text-right text-xs text-slate-700">
                  {#if role}<strong>{m.rowMarkers[role]}</strong>{/if}
                  {start}
                </span>
                <span class="w-16 text-center text-xs whitespace-nowrap text-slate-700">
                  {hasKeys ? `${frame.keys[start][0]}, ${frame.keys[start][1]}` : frame.rank[start]}
                </span>
                <span class="flex" data-testid="suffix-{row}">
                  {#each frame.s.slice(start) as letter, k (k)}
                    {@const cell = roleOf(start, k)}
                    <span
                      class="relative flex h-6 w-[22px] items-center justify-center border border-slate-200 {cell
                        ? `${STATE_BG[ROLE_STATE[cell]]} ${ROLE_TEXT[cell]}`
                        : 'bg-white text-slate-900'}"
                    >
                      {letter}{#if cell}<span
                          class="absolute top-0 right-0.5 text-[9px] leading-3"
                          aria-hidden="true">{m.markers[cell]}</span
                        >{/if}
                    </span>
                  {/each}
                </span>
              </li>
            {/each}
          </ol>
        </ScrollFrame>
        <p class="mt-2 text-xs text-slate-600">{m.boardNote}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each ROLES as cell (cell)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[cell]]}"
              ></span>{m.legend[cell]}
            </li>
          {/each}
          <li>{m.rowLegend}</li>
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
        {@render stat(m.stats.k, 'k', frame.k)}
        {@render stat(m.stats.rounds, 'rounds', frame.rounds)}
        {@render stat(m.stats.keyChecks, 'keyChecks', frame.keyChecks)}
        {@render stat(m.stats.comparisons, 'comparisons', frame.comparisons)}
        {@render stat(m.stats.h, 'h', frame.h)}
        {@render stat(m.stats.direct, 'direct', direct)}
        {@render stat(
          m.stats.distinct,
          'distinct',
          finished ? distinctSubstrings(n, frame.lcp) : '—',
        )}
        {@render stat(
          m.stats.repeat,
          'repeat',
          finished ? longestRepeat(frame.s, frame.sa, frame.lcp) || m.repeatNone : '—',
        )}
      </dl>
      <ChipList
        title={m.arraysTitle}
        items={frame.sa.map((s) => ({ label: String(s) }))}
        emptyText={m.lcpEmpty}
        limit={MAX_LEN}
      />
      <ChipList
        title={m.lcpTitle}
        items={frame.lcp.flatMap((h) => (h === null ? [] : [{ label: String(h) }]))}
        emptyText={m.lcpEmpty}
        limit={MAX_LEN}
      />
      <CodePanel lines={suffixPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
