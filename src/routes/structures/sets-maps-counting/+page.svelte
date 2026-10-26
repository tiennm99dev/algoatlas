<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    PRESET_TEXT,
    countPseudocode,
    countTrace,
    parseWords,
  } from '$lib/algo-engine/sets-maps-counting.js';
  import { en as m } from '$lib/lessons/sets-maps-counting/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/sets-maps-counting.js').CountMode} CountMode */
  /** @typedef {import('$lib/algo-engine/sets-maps-counting.js').WordPreset} WordPreset */

  const MODES = /** @type {CountMode[]} */ (['map', 'set']);
  const PRESETS = /** @type {WordPreset[]} */ (['hat', 'woodchuck', 'hamlet']);

  /** @param {string} text */
  const wordsOf = (text) => {
    const parsed = parseWords(text);
    return 'words' in parsed ? parsed.words : [];
  };

  // A fixed first stream keeps the prerendered HTML and the hydrated page identical.
  let mode = $state(/** @type {CountMode} */ ('map'));
  let preset = $state('hat');
  let text = $state(PRESET_TEXT.hat);
  let lastValidText = PRESET_TEXT.hat;
  const INITIAL_WORDS = wordsOf(PRESET_TEXT.hat);
  let words = $state.raw(INITIAL_WORDS);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(countTrace(INITIAL_WORDS));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, mode));

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(countTrace(words));
  }

  function commitText() {
    const parsed = parseWords(text);
    if ('error' in parsed) {
      text = lastValidText;
      say(m.wordErrors[parsed.error]);
      return;
    }
    words = parsed.words;
    lastValidText = text;
    preset = '';
    rebuild();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {WordPreset} */ (e.currentTarget.value);
    preset = picked;
    text = lastValidText = PRESET_TEXT[picked];
    words = wordsOf(text);
    rebuild();
  }

  const acting = $derived(frame.kind === 'hit' || frame.kind === 'miss');
  const hotWord = $derived(acting ? frame.word : '');
  const hotState = $derived(frame.kind === 'miss' ? 'active' : 'sorted');
  const maxCount = $derived(Math.max(1, ...frame.entries.map((e) => e.count)));
  // The set shows its members in the order they were added; the map shows them by count.
  const setMembers = $derived([...frame.entries].sort((a, b) => a.first - b.first));

  /** @param {number} i */
  function streamClass(i) {
    if (i === frame.index) {
      if (frame.kind === 'miss') return 'bg-state-active text-white ring-2 ring-slate-700';
      if (frame.kind === 'hit') return 'bg-state-sorted text-white ring-2 ring-slate-700';
      return 'bg-white text-slate-900 ring-2 ring-slate-700';
    }
    const done = frame.kind === 'done' || i < frame.index;
    return done ? 'bg-state-visited text-slate-900' : 'bg-slate-100 text-slate-500';
  }

  /** @param {number} i */
  function streamState(i) {
    if (i === frame.index && frame.kind === 'miss') return m.streamStates.active;
    if (i === frame.index && frame.kind === 'hit') return m.streamStates.sorted;
    if (frame.kind === 'done' || i < frame.index) return m.streamStates.done;
    return '';
  }

  /** @param {number} i */
  function streamMark(i) {
    if (i !== frame.index) return '';
    if (frame.kind === 'miss') return m.marks.active;
    if (frame.kind === 'hit') return m.marks.sorted;
    return '';
  }

  const entryClass = /** @param {string} word */ (word) =>
    word === hotWord
      ? hotState === 'active'
        ? 'bg-state-active text-white'
        : 'bg-state-sorted text-white'
      : 'bg-slate-100 text-slate-900';

  const entryMark = /** @param {string} word */ (word) =>
    word === hotWord ? m.marks[/** @type {'active'|'sorted'} */ (hotState)] : '';

  const stats = $derived([
    [m.stats.distinct, String(frame.entries.length), 'distinct'],
    [m.stats.lookups, String(frame.lookups), 'lookups'],
    [m.stats.listCompares, String(frame.listCompares), 'list-compares'],
    [m.stats.repeats, String(frame.repeats), 'repeats'],
    [m.stats.firstRepeat, frame.firstRepeat || m.none, 'first-repeat'],
  ]);

  const legend = [
    ['bg-state-active', `${m.marks.active} ${m.legend.active}`],
    ['bg-state-sorted', `${m.marks.sorted} ${m.legend.sorted}`],
    ['bg-state-visited', m.legend.visited],
  ];

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={MODES.map((v) => ({ value: v, label: m.modes[v] }))}
      bind:value={mode}
    />
    <label class={labelClass}>
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <label class="{labelClass} min-w-0 flex-1 basis-64">
      {m.wordsLabel}
      <input
        type="text"
        name="words"
        class="field w-full"
        bind:value={text}
        onchange={commitText}
      />
    </label>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs text-slate-500">{m.streamTitle}</h2>
        <ol class="flex flex-wrap gap-1 font-mono text-xs" aria-label={m.streamTitle}>
          {#each words as word, i (i)}
            {@const st = streamState(i)}
            <li
              class="rounded px-1.5 py-0.5 {streamClass(i)} {player.speed < 8
                ? 'transition-colors'
                : ''}"
            >
              <span aria-hidden="true">{streamMark(i)}</span>{word}{#if st}<span class="sr-only"
                  >, {st}</span
                >{/if}
            </li>
          {/each}
        </ol>

        <h2 class="mt-4 mb-2 font-mono text-xs text-slate-500">
          {mode === 'map' ? m.mapTitle : m.setTitle}
        </h2>
        {#if frame.entries.length === 0}
          <p class="text-sm text-slate-500">{m.emptyMap}</p>
        {:else if mode === 'map'}
          <ol class="flex flex-col gap-1 text-sm" data-testid="map">
            {#each frame.entries as entry (entry.word)}
              <li class="grid grid-cols-[minmax(0,8rem)_1fr_2rem] items-center gap-2">
                <span
                  class="truncate rounded px-1.5 py-0.5 font-mono text-xs {entryClass(entry.word)}"
                  ><span aria-hidden="true">{entryMark(entry.word)}</span>{entry.word}</span
                >
                <span class="h-3 rounded-sm bg-slate-200" aria-hidden="true">
                  <span
                    class="block h-3 rounded-sm bg-teal-700 {player.speed < 8
                      ? 'transition-all'
                      : ''}"
                    style="width: {(entry.count / maxCount) * 100}%"
                  ></span>
                </span>
                <span class="text-right tabular-nums"
                  ><span class="sr-only">{m.entryLabel(entry.word, entry.count)}</span><span
                    aria-hidden="true">{entry.count}</span
                  ></span
                >
              </li>
            {/each}
          </ol>
        {:else}
          <ol class="flex flex-wrap gap-1 font-mono text-xs" data-testid="set">
            {#each setMembers as entry (entry.word)}
              <li class="rounded px-1.5 py-0.5 {entryClass(entry.word)}">
                <span aria-hidden="true">{entryMark(entry.word)}</span>{entry.word}
              </li>
            {/each}
          </ol>
        {/if}
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [cls, label] (cls)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {cls}"></span>{label}
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
        {#each stats as [label, value, id], i (id)}
          <div
            class="min-w-0 rounded-xl border border-slate-200 bg-white p-3 {i === stats.length - 1
              ? 'col-span-2'
              : ''}"
          >
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="truncate text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <CodePanel lines={countPseudocode[mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
