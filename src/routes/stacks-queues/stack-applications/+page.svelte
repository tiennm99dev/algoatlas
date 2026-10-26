<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StackQueueView from '$lib/components/stack-queue-view.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_CHARS,
    MAX_N,
    PRESETS,
    appPseudocode,
    bracketTrace,
    callTrace,
    parsePostfix,
    postfixTrace,
  } from '$lib/algo-engine/stack-applications.js';
  import { en as m } from '$lib/lessons/stack-applications/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/stack-applications.js').AppMode} AppMode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const modeOptions = /** @type {AppMode[]} */ (['brackets', 'postfix', 'calls']).map((v) => ({
    value: v,
    label: m.modes[v],
  }));

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_BRACKETS = PRESETS.brackets.nested;
  let mode = $state(/** @type {AppMode} */ ('brackets'));
  let brackets = $state(INITIAL_BRACKETS);
  let bracketsText = $state(INITIAL_BRACKETS);
  let postfix = $state(PRESETS.postfix.simple.split(' '));
  let postfixText = $state(PRESETS.postfix.simple);
  let n = $state(4);
  /** @type {number | null} */
  let nDraft = $state(4);
  let preset = $state('nested');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(bracketTrace(INITIAL_BRACKETS));
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(
      mode === 'brackets'
        ? bracketTrace(brackets)
        : mode === 'postfix'
          ? postfixTrace(postfix)
          : callTrace(n),
    );
  }

  function changeMode() {
    preset = mode === 'brackets' ? 'nested' : mode === 'postfix' ? 'simple' : '';
    if (mode === 'brackets') brackets = bracketsText = PRESETS.brackets.nested;
    if (mode === 'postfix') {
      postfixText = PRESETS.postfix.simple;
      postfix = postfixText.split(' ');
    }
    rebuild();
  }

  function commitBrackets() {
    if ([...bracketsText].length > MAX_CHARS) {
      bracketsText = brackets;
      say(m.bracketErrors.count);
      return;
    }
    if (bracketsText === brackets) return;
    brackets = bracketsText;
    preset = '';
    rebuild();
  }

  function commitPostfix() {
    const parsed = parsePostfix(postfixText);
    if ('error' in parsed) {
      postfixText = postfix.join(' ');
      say(m.postfixErrors[parsed.error]);
      return;
    }
    if (parsed.tokens.join(' ') === postfix.join(' ')) {
      postfixText = postfix.join(' ');
      return;
    }
    postfix = parsed.tokens;
    postfixText = postfix.join(' ');
    preset = '';
    rebuild();
  }

  function commitN() {
    const x = nDraft;
    if (x === null || !Number.isInteger(x) || x < 1 || x > MAX_N) {
      nDraft = n;
      say(m.nError);
      return;
    }
    if (x === n) return;
    n = x;
    rebuild();
  }

  function submit() {
    if (mode === 'brackets') commitBrackets();
    else if (mode === 'postfix') commitPostfix();
    else commitN();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = e.currentTarget.value;
    if (mode === 'brackets') {
      brackets = bracketsText = PRESETS.brackets[/** @type {'nested'} */ (picked)];
    } else {
      postfixText = PRESETS.postfix[/** @type {'simple'} */ (picked)];
      postfix = postfixText.split(' ');
    }
    preset = picked;
    rebuild();
  }

  const presetKeys = $derived(
    mode === 'brackets'
      ? /** @type {string[]} */ (Object.keys(PRESETS.brackets))
      : mode === 'postfix'
        ? Object.keys(PRESETS.postfix)
        : [],
  );

  const failed = $derived(
    frame.kind === 'mismatch' ||
      frame.kind === 'close-empty' ||
      frame.kind === 'too-few' ||
      frame.kind === 'div-zero',
  );
  /** Index of the token that ended the run in an error, or −1. */
  const errorAt = $derived(
    finalFrame.ok === false ? (player.frames.findLast((f) => f.pos >= 0)?.pos ?? -1) : -1,
  );

  /** @param {number} i @returns {VisualState} */
  function tokenState(i) {
    if (i === frame.pos) return failed ? 'swap' : 'active';
    const reached = frame.pos >= 0 ? frame.pos : frame.kind === 'start' ? 0 : frame.tokens.length;
    if (frame.kind === 'done' && i === errorAt) return 'swap';
    return i < reached ? 'visited' : '';
  }

  /** @type {Partial<Record<VisualState, string>>} */
  const MARKERS = m.markers;
  /** @type {Partial<Record<VisualState, string>>} */
  const STATES = m.states;

  /** @param {string} t */
  const shown = (t) => (t === ' ' ? '␣' : t);

  const stackItems = $derived(
    frame.stack.map((label, i) => {
      const fresh = frame.pushed !== null && i === frame.stack.length - 1;
      const bad = failed && frame.kind === 'mismatch' && i === frame.stack.length - 1;
      return {
        label,
        state: /** @type {VisualState} */ (bad ? 'swap' : fresh ? 'active' : ''),
        marker: bad ? '×' : fresh ? '+' : '',
      };
    }),
  );

  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['active', m.markers.active, m.legend.active],
    ['visited', '', m.legend.visited],
    ['swap', m.markers.swap, m.legend.swap],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      submit();
    }}
  >
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={modeOptions}
      bind:value={mode}
      onchange={changeMode}
    />
    {#if mode === 'brackets'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.bracketsLabel}
        <input
          type="text"
          name="brackets"
          class="field w-56 max-w-full font-mono"
          autocomplete="off"
          bind:value={bracketsText}
          onchange={commitBrackets}
        />
      </label>
    {:else if mode === 'postfix'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.postfixLabel}
        <input
          type="text"
          name="postfix"
          class="field w-56 max-w-full font-mono"
          autocomplete="off"
          bind:value={postfixText}
          onchange={commitPostfix}
        />
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.nLabel}
        <input
          type="number"
          name="n"
          min="1"
          max={MAX_N}
          step="1"
          class="field w-24"
          bind:value={nDraft}
          onchange={commitN}
        />
      </label>
    {/if}
    {#if presetKeys.length}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.presetLabel}
        <select name="preset" class="field" value={preset} onchange={loadPreset}>
          <option value="" disabled>{m.presetPlaceholder}</option>
          {#each presetKeys as p (p)}
            <option value={p}>{m.presetNames[/** @type {'nested'} */ (p)]}</option>
          {/each}
        </select>
      </label>
    {/if}
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        {#if frame.mode !== 'calls'}
          <h3 class="mb-1 text-xs text-slate-500">{m.inputTitle}</h3>
          {#if frame.tokens.length}
            <ArrayStrip
              values={frame.tokens.map(shown)}
              ariaLabel={m.inputLabel(frame.tokens.map(shown), frame.pos)}
              stateOf={tokenState}
              markerOf={(i) => MARKERS[tokenState(i)] ?? ''}
              labelOf={(i) =>
                [shown(frame.tokens[i]), STATES[tokenState(i)] ?? ''].filter(Boolean).join(', ')}
              pointers={frame.pos >= 0 ? [{ name: 'c', index: frame.pos }] : []}
              speed={player.speed}
            />
          {/if}
        {/if}
        <h3 class="mt-3 mb-1 text-xs text-slate-500">
          {frame.mode === 'calls' ? m.callTitle : m.stackTitle}
        </h3>
        <StackQueueView
          kind="stack"
          items={stackItems}
          capacity={finalFrame.maxDepth}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {marker ? `${marker} ${label}` : label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.active}"></span>
            {m.legend.pushed}
          </li>
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
          <dt class="text-xs text-slate-500">{m.stats.pushes}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="pushes">{frame.pushes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pops}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="pops">{frame.pops}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.depth}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="depth">{frame.maxDepth}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.verdict}</dt>
          <dd class="text-lg font-bold break-words" data-testid="verdict">{m.verdict(frame)}</dd>
        </div>
      </dl>
      <CodePanel lines={appPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
