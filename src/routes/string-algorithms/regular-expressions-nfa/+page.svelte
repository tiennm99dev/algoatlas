<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    BACKTRACK_CAP,
    MAX_INPUT,
    MAX_REGEX,
    NFA_PRESETS,
    backtrackSteps,
    buildNfa,
    nfaPseudocode,
    nfaTrace,
    parseRegex,
  } from '$lib/algo-engine/regular-expressions-nfa.js';
  import { en as m } from '$lib/lessons/regular-expressions-nfa/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import NfaBoard from './nfa-board.svelte';

  /** @typedef {import('$lib/algo-engine/regular-expressions-nfa.js').RegexNode} RegexNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof NFA_PRESETS} Preset */
  /** @typedef {keyof typeof m.states} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(NFA_PRESETS));
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = { active: 'visited', fresh: 'active', accept: 'sorted' };
  const ROLES = /** @type {Role[]} */ (Object.keys(ROLE_STATE));
  const errors = m.fieldErrors(MAX_REGEX, MAX_INPUT);

  /** @param {string} source */
  function astOf(source) {
    const parsed = parseRegex(source);
    if ('error' in parsed) throw new Error(`Bad preset ${source}`);
    return parsed.ast;
  }

  const INITIAL = NFA_PRESETS.classic;
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let regex = $state(INITIAL.regex);
  let input = $state(INITIAL.input);
  let regexDraft = $state(INITIAL.regex);
  let inputDraft = $state(INITIAL.input);
  let notice = $state({ text: '', at: -1 });
  let nfa = $state.raw(buildNfa(astOf(INITIAL.regex)));

  const player = createPlayer(
    nfaTrace(INITIAL.regex, buildNfa(astOf(INITIAL.regex)), INITIAL.input),
  );
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const backtrack = $derived(backtrackSteps(nfa.ast, input));

  /** @param {RegexNode} ast */
  function rebuild(ast) {
    notice = { text: '', at: -1 };
    nfa = buildNfa(ast);
    player.load(nfaTrace(regex, nfa, input));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function commitRegex() {
    const parsed = parseRegex(regexDraft);
    if ('error' in parsed) {
      regexDraft = regex;
      say(errors[parsed.error]);
      return;
    }
    const source = regexDraft.trim().toLowerCase();
    regexDraft = source;
    if (source === regex) return;
    regex = source;
    preset = '';
    rebuild(parsed.ast);
  }

  function commitInput() {
    const word = inputDraft.trim().toLowerCase();
    if (word !== '' && !/^[a-z]+$/.test(word)) {
      inputDraft = input;
      say(errors.inputFormat);
      return;
    }
    if (word.length > MAX_INPUT) {
      inputDraft = input;
      say(errors.inputLength);
      return;
    }
    inputDraft = word;
    if (word === input) return;
    input = word;
    preset = '';
    rebuild(nfa.ast);
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    regex = regexDraft = NFA_PRESETS[p].regex;
    input = inputDraft = NFA_PRESETS[p].input;
    rebuild(astOf(regex));
  }

  /** @param {number} id @returns {Role | ''} */
  function roleOf(id) {
    const { set, fresh } = frame;
    if (fresh.includes(id)) return 'fresh';
    if (set.includes(id)) return id === nfa.accept ? 'accept' : 'active';
    return '';
  }

  const verdict = $derived(
    frame.accepted === null ? m.verdicts.pending : frame.accepted ? m.verdicts.yes : m.verdicts.no,
  );
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
    class="mb-2 flex flex-wrap items-end gap-4"
    onkeydown={(e) => enterField(e, {})}
    onsubmit={(e) => e.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.regexLabel}
      <input
        type="text"
        name="regex"
        maxlength={MAX_REGEX + 4}
        autocomplete="off"
        autocapitalize="none"
        class="field w-56 font-mono normal-case"
        bind:value={regexDraft}
        onchange={commitRegex}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.inputLabel}
      <input
        type="text"
        name="input"
        maxlength={MAX_INPUT + 4}
        autocomplete="off"
        autocapitalize="none"
        class="field w-48 font-mono normal-case"
        bind:value={inputDraft}
        onchange={commitInput}
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
  <p class="mb-4 text-xs text-slate-600">{m.syntax}</p>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.boardTitle}
        </h2>
        <NfaBoard
          {nfa}
          visibleStates={Math.min(frame.visibleStates, nfa.states.length)}
          visibleEdges={Math.min(frame.visibleEdges, nfa.edges.length)}
          taken={frame.taken}
          ariaLabel={m.boardAria(regex, nfa.states.length)}
          stateOf={(id) => {
            const role = roleOf(id);
            return role ? ROLE_STATE[role] : '';
          }}
          markerOf={(id) => {
            const role = roleOf(id);
            return role ? m.markers[role] : '';
          }}
          labelOf={(id) => {
            const role = roleOf(id);
            return m.stateLabel(
              id,
              role ? m.states[role] : '',
              id === nfa.accept,
              id === nfa.start,
            );
          }}
          edgeLabelOf={(k) => {
            const e = nfa.edges[k];
            return m.edgeLabel(e.from, e.to, e.label, frame.taken.includes(k));
          }}
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
          <li>{m.legend.edge}</li>
        </ul>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.inputTitle}
        </h2>
        {#if input === ''}
          <p class="text-sm text-slate-600">{m.inputEmpty}</p>
        {:else}
          <ArrayStrip
            values={[...input]}
            ariaLabel={m.inputAria}
            stateOf={(i) => (i === frame.i ? 'compare' : i < frame.history.length ? 'visited' : '')}
            markerOf={(i) => (i === frame.i ? m.inputMarker : '')}
            labelOf={(i) => m.inputCell(i, input[i], i === frame.i)}
            pointers={frame.i >= 0 ? [{ name: 'i', index: frame.i }] : []}
            speed={player.speed}
          />
        {/if}
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
        {@render stat(m.stats.states, 'states', nfa.states.length)}
        {@render stat(m.stats.edges, 'edges', nfa.edges.length)}
        {@render stat(m.stats.active, 'active', frame.set.length)}
        {@render stat(m.stats.checks, 'checks', frame.edgeChecks)}
        {@render stat(
          m.stats.backtrack,
          'backtrack',
          backtrack.capped ? m.overCap(BACKTRACK_CAP) : backtrack.steps,
        )}
        {@render stat(m.stats.verdict, 'verdict', verdict)}
      </dl>
      <ChipList
        title={m.setTitle}
        items={frame.history.map((h) => ({ label: m.setChip(h) }))}
        emptyText={m.setEmpty}
        limit={MAX_INPUT}
      />
      <CodePanel lines={nfaPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
