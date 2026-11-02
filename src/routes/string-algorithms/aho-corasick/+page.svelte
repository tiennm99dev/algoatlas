<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    AHO_PRESETS,
    MAX_PATTERNS,
    MAX_PATTERN_LEN,
    MAX_TEXT,
    ahoPseudocode,
    ahoTrace,
    naiveComparisons,
    parsePatterns,
    prefixOf,
  } from '$lib/algo-engine/aho-corasick.js';
  import { parseLetters } from '$lib/algo-engine/tries.js';
  import { en as m } from '$lib/lessons/aho-corasick/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import AcBoard from './ac-board.svelte';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof AHO_PRESETS} Preset */
  /** @typedef {keyof typeof m.states} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(AHO_PRESETS));
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    active: 'active',
    parent: 'compare',
    child: 'swap',
    chain: 'path',
    queued: 'frontier',
    found: 'sorted',
  };
  const ROLES = /** @type {Role[]} */ (Object.keys(ROLE_STATE));
  const errors = m.fieldErrors(MAX_PATTERNS, MAX_PATTERN_LEN, MAX_TEXT);
  const TEXT_ERRORS = /** @type {const} */ ({
    empty: 'textEmpty',
    format: 'textFormat',
    length: 'textLength',
  });
  const LINK_OPTIONS = [
    { value: 'useful', label: m.linkModes.useful },
    { value: 'all', label: m.linkModes.all },
  ];

  const INITIAL = AHO_PRESETS.classic;
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let patterns = $state.raw(INITIAL.patterns);
  let text = $state(INITIAL.text);
  let patternsDraft = $state(INITIAL.patterns.join(', '));
  let textDraft = $state(INITIAL.text);
  let linkMode = $state('useful');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(ahoTrace(INITIAL.patterns, INITIAL.text));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(ahoTrace(patterns, text));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function commitPatterns() {
    const parsed = parsePatterns(patternsDraft);
    if ('error' in parsed) {
      patternsDraft = patterns.join(', ');
      say(errors[parsed.error]);
      return;
    }
    patternsDraft = parsed.words.join(', ');
    if (parsed.words.join() === patterns.join()) return;
    patterns = parsed.words;
    preset = '';
    rebuild();
  }

  function commitText() {
    const parsed = parseLetters(textDraft, MAX_TEXT);
    if ('error' in parsed) {
      textDraft = text;
      say(errors[TEXT_ERRORS[parsed.error]]);
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
    patterns = AHO_PRESETS[p].patterns;
    patternsDraft = patterns.join(', ');
    text = textDraft = AHO_PRESETS[p].text;
    rebuild();
  }

  /** @param {number} id @returns {Role | ''} */
  function roleOf(id) {
    const { kind, u, v, f, state, queue } = frame;
    if (kind === 'report' && id === v) return 'found';
    if (kind === 'insert' || kind === 'mark') return id === v ? 'active' : '';
    if ((kind === 'child' || kind === 'hop' || kind === 'link') && id === v) return 'child';
    if ((kind === 'child' || kind === 'hop') && id === f) return 'chain';
    if (id === u) return 'parent';
    if (id === state) return 'active';
    return queue.includes(id) ? 'queued' : '';
  }

  /** @param {number} id */
  function nodeLabel(id) {
    const role = roleOf(id);
    const n = frame.nodes[id];
    return m.nodeLabel(
      prefixOf(frame.nodes, id),
      id !== 0 && n.fail !== null ? prefixOf(frame.nodes, n.fail) || 'root' : '',
      role ? m.states[role] : '',
      n.word ?? '',
    );
  }

  const hotLink = $derived(frame.kind === 'link' || frame.kind === 'fallback' ? frame.v : -1);
  const lastMatch = $derived(frame.kind === 'report' ? frame.matches.at(-1) : undefined);
  /** @param {number} i */
  const inMatch = (i) =>
    lastMatch !== undefined && i >= lastMatch.start && i < lastMatch.start + lastMatch.word.length;
  const naive = $derived(naiveComparisons(patterns, text));
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
      {m.patternsLabel}
      <input
        type="text"
        name="patterns"
        autocomplete="off"
        autocapitalize="none"
        class="field w-56 font-mono normal-case"
        bind:value={patternsDraft}
        onchange={commitPatterns}
      />
    </label>
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
    <SegmentedControl
      legend={m.linksLegend}
      name="links"
      options={LINK_OPTIONS}
      bind:value={linkMode}
    />
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.boardTitle}
        </h2>
        <AcBoard
          nodes={frame.nodes}
          ariaLabel={m.boardAria(frame.nodes.length)}
          stateOf={(id) => {
            const role = roleOf(id);
            return role ? ROLE_STATE[role] : '';
          }}
          markerOf={(id) => {
            const role = roleOf(id);
            return role ? m.markers[role] : '';
          }}
          labelOf={nodeLabel}
          showRootLinks={linkMode === 'all'}
          {hotLink}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.boardNote}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each ROLES as role (role)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[role]]}"
              ></span>{m.markers[role]}
              {m.legend[role]}
            </li>
          {/each}
          <li>{m.wordEnd}</li>
          <li class="flex items-center gap-1.5">
            <svg aria-hidden="true" width="24" height="6"
              ><line
                x1="0"
                y1="3"
                x2="24"
                y2="3"
                stroke-width="1.5"
                class="stroke-slate-400"
              /></svg
            >{m.linkKinds.tree}
          </li>
          <li class="flex items-center gap-1.5">
            <svg aria-hidden="true" width="24" height="6"
              ><line
                x1="0"
                y1="3"
                x2="24"
                y2="3"
                stroke-width="1.5"
                stroke-dasharray="6 4"
                class="stroke-rose-600"
              /></svg
            >{m.linkKinds.fail}
          </li>
          <li class="flex items-center gap-1.5">
            <svg aria-hidden="true" width="24" height="6"
              ><line
                x1="1"
                y1="3"
                x2="24"
                y2="3"
                stroke-width="2"
                stroke-dasharray="1.5 4"
                stroke-linecap="round"
                class="stroke-emerald-700"
              /></svg
            >{m.linkKinds.out}
          </li>
        </ul>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.textTitle}
        </h2>
        <ArrayStrip
          values={[...text]}
          ariaLabel={m.textAria}
          stateOf={(i) => (inMatch(i) ? 'sorted' : i === frame.i ? 'compare' : '')}
          markerOf={(i) =>
            inMatch(i) ? m.textMarkers.hit : i === frame.i ? m.textMarkers.read : ''}
          labelOf={(i) =>
            m.textLabelOf(
              i,
              text[i],
              inMatch(i) ? m.textStates.hit : i === frame.i ? m.textStates.read : '',
            )}
          pointers={frame.i >= 0 ? [{ name: 'i', index: frame.i }] : []}
          speed={player.speed}
        />
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
        {@render stat(m.stats.nodes, 'nodes', frame.nodes.length)}
        {@render stat(m.stats.state, 'state', m.stateValue(frame))}
        {@render stat(m.stats.edges, 'edges', frame.edges)}
        {@render stat(m.stats.hops, 'hops', frame.hops)}
        {@render stat(m.stats.naive, 'naive', naive)}
        {@render stat(m.stats.matches, 'matches', frame.matches.length)}
      </dl>
      <ChipList
        title={m.queueTitle}
        items={frame.queue.map((id) => ({ label: m.queueLabel(frame, id) }))}
        emptyText={m.queueEmpty}
        limit={40}
      />
      <ChipList
        title={m.matchesTitle}
        items={frame.matches.map((x) => ({ label: m.matchLabel(x) }))}
        emptyText={m.matchesEmpty}
        limit={150}
      />
      <CodePanel lines={ahoPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
