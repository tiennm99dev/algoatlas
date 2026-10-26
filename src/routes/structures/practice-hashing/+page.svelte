<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    ANAGRAM_PRESETS,
    MAX_WORDS,
    TWO_SUM_PRESETS,
    anagramTrace,
    hashPracticePseudocode,
    parseAnagramWords,
    parseNums,
    twoSumTrace,
  } from '$lib/algo-engine/practice-hashing.js';
  import { en as m } from '$lib/lessons/practice-hashing/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-hashing.js').HashProblem} HashProblem */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PROBLEMS = /** @type {HashProblem[]} */ (['two-sum', 'anagrams']);
  const MAX_TARGET = 198;

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  let problem = $state(/** @type {HashProblem} */ ('two-sum'));
  let preset = $state('classic');
  let nums = $state.raw(TWO_SUM_PRESETS.classic.nums);
  let target = $state(TWO_SUM_PRESETS.classic.target);
  let words = $state.raw(ANAGRAM_PRESETS.classic);
  let numsText = $state(TWO_SUM_PRESETS.classic.nums.join(', '));
  /** @type {number | null} */
  let targetDraft = $state(TWO_SUM_PRESETS.classic.target);
  let wordsText = $state(ANAGRAM_PRESETS.classic.join(' '));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(
    twoSumTrace(TWO_SUM_PRESETS.classic.nums, TWO_SUM_PRESETS.classic.target),
  );
  const frame = $derived(player.frame);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, { nums, target, words }),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(problem === 'two-sum' ? twoSumTrace(nums, target) : anagramTrace(words));
  }

  function changeProblem() {
    preset = '';
    rebuild();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = e.currentTarget.value;
    preset = picked;
    if (problem === 'two-sum') {
      const p = TWO_SUM_PRESETS[/** @type {keyof typeof TWO_SUM_PRESETS} */ (picked)];
      nums = p.nums;
      target = targetDraft = p.target;
      numsText = p.nums.join(', ');
    } else {
      words = ANAGRAM_PRESETS[/** @type {keyof typeof ANAGRAM_PRESETS} */ (picked)];
      wordsText = words.join(' ');
    }
    rebuild();
  }

  function commitNums() {
    const parsed = parseNums(numsText);
    if ('error' in parsed) {
      numsText = nums.join(', ');
      say(m.numsErrors[parsed.error]);
      return;
    }
    nums = parsed.nums;
    preset = '';
    rebuild();
  }

  function commitTarget() {
    if (
      typeof targetDraft !== 'number' ||
      !Number.isInteger(targetDraft) ||
      Math.abs(targetDraft) > MAX_TARGET
    ) {
      targetDraft = target;
      say(m.targetError);
      return;
    }
    target = targetDraft;
    preset = '';
    rebuild();
  }

  function commitWords() {
    const parsed = parseAnagramWords(wordsText);
    if ('error' in parsed) {
      wordsText = words.join(' ');
      say(m.wordErrors[parsed.error]);
      return;
    }
    words = parsed.words;
    preset = '';
    rebuild();
  }

  /**
   * State of the map entry with `key` on this frame.
   * @param {string} key
   * @returns {VisualState}
   */
  function entryState(key) {
    if (key !== frame.hotKey) return '';
    if (frame.kind === 'found') return 'sorted';
    if (frame.kind === 'store' || frame.kind === 'join' || frame.kind === 'new') return 'active';
    if (frame.kind === 'look' || frame.kind === 'key') return 'compare';
    return '';
  }

  /** @type {Partial<Record<VisualState, string>>} */
  const ENTRY_CLASS = {
    compare: 'bg-state-compare text-slate-900',
    active: 'bg-state-active text-white',
    sorted: 'bg-state-sorted text-white',
  };

  /** @param {number} i @returns {VisualState} */
  function numState(i) {
    if (frame.pair.includes(i)) return 'sorted';
    if (i === frame.index) return 'active';
    if (frame.index >= 0 ? i < frame.index : frame.kind !== 'start') return 'visited';
    return '';
  }

  /** @param {number} i */
  const numMark = (i) => (frame.pair.includes(i) ? m.marks.sorted : '');

  const stats = $derived(
    frame.problem === 'two-sum'
      ? [
          [m.stats.lookups, String(frame.lookups), 'lookups'],
          [m.stats.covered, String(frame.covered), 'covered'],
          [m.stats.entries, String(frame.entries.length), 'entries'],
          [
            m.stats.result,
            frame.pair.length
              ? m.pairText(frame.pair)
              : frame.kind === 'none' || frame.kind === 'done'
                ? m.noPair
                : m.none,
            'result',
          ],
        ]
      : [
          [m.stats.lookups, String(frame.lookups), 'lookups'],
          [m.stats.groups, String(frame.entries.length), 'groups'],
        ],
  );

  const wordChips = $derived(words.map((w, i) => ({ label: w, hot: i === frame.index })));
  const presetKeys = $derived(
    Object.keys(problem === 'two-sum' ? m.presets['two-sum'] : m.presets.anagrams),
  );
  /** @param {string} key */
  const presetName = (key) => /** @type {Record<string, string>} */ (m.presets[problem])[key];

  const legend = /** @type {[VisualState, string][]} */ ([
    ['compare', `${m.marks.compare} ${m.legend.compare}`],
    ['active', `${m.marks.active} ${m.legend.active}`],
    ['sorted', `${m.marks.sorted} ${m.legend.sorted}`],
  ]);

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((v) => ({ value: v, label: m.problems[v] }))}
      bind:value={problem}
      onchange={changeProblem}
    />
    <label class={labelClass}>
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each presetKeys as p (p)}
          <option value={p}>{presetName(p)}</option>
        {/each}
      </select>
    </label>
    {#if problem === 'two-sum'}
      <label class={labelClass}>
        {m.numsLabel}
        <input
          type="text"
          name="nums"
          class="field w-56 max-w-full"
          bind:value={numsText}
          onchange={commitNums}
        />
      </label>
      <label class={labelClass}>
        {m.targetLabel}
        <input
          type="number"
          name="target"
          min={-MAX_TARGET}
          max={MAX_TARGET}
          class="field w-24"
          bind:value={targetDraft}
          onchange={commitTarget}
        />
      </label>
    {:else}
      <label class={labelClass}>
        {m.wordsLabel}
        <input
          type="text"
          name="words"
          class="field w-72 max-w-full"
          bind:value={wordsText}
          onchange={commitWords}
        />
      </label>
    {/if}
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        {#if frame.problem === 'two-sum'}
          <h2 class="mb-2 font-mono text-xs text-slate-500">{m.arrayLabel}</h2>
          <ArrayStrip
            values={nums}
            ariaLabel={m.arrayAria(nums)}
            stateOf={numState}
            markerOf={numMark}
            pointers={frame.index >= 0 ? [{ name: m.pointerI, index: frame.index }] : []}
            speed={player.speed}
          />
        {:else}
          <ChipList
            title={m.wordsTitle}
            items={wordChips}
            emptyText={m.mapEmpty}
            limit={MAX_WORDS}
            hotLabel={m.wordsHot}
          />
        {/if}

        <h2 class="mt-4 mb-2 font-mono text-xs text-slate-500">{m.mapTitles[frame.problem]}</h2>
        <table class="w-full text-sm" data-testid="map">
          <thead>
            <tr class="text-left text-xs text-slate-500">
              {#each m.mapHead[frame.problem] as head (head)}
                <th scope="col" class="pb-1 font-medium">{head}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each frame.entries as entry (entry.key)}
              {@const s = entryState(entry.key)}
              <tr class="border-t border-slate-100">
                <td class="py-1 pr-2 font-mono text-xs">
                  <span
                    class="rounded px-1.5 py-0.5 {ENTRY_CLASS[s] ??
                      'bg-slate-100 text-slate-900'} {player.speed < 8 ? 'transition-colors' : ''}"
                    ><span aria-hidden="true"
                      >{s ? m.marks[/** @type {'compare'|'active'|'sorted'} */ (s)] : ''}</span
                    >{entry.key}{#if s}<span class="sr-only"
                        >, {m.mapStates[/** @type {'compare'|'active'|'sorted'} */ (s)]}</span
                      >{/if}</span
                  >
                </td>
                <td class="py-1 font-mono text-xs break-words">{entry.value}</td>
              </tr>
            {:else}
              <tr><td colspan="2" class="py-1 text-slate-500">{m.mapEmpty}</td></tr>
            {/each}
          </tbody>
        </table>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
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
        {#each stats as [label, value, id] (id)}
          <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="truncate text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <CodePanel lines={hashPracticePseudocode[frame.problem]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
