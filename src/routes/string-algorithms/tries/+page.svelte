<script>
  import { createFieldGuard, enterField } from '$lib/components/numeric-field.js';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_LEN,
    MAX_OPS,
    MAX_WORDS,
    childIds,
    makeTrieOps,
    matchPrefix,
    prefixOf,
    trieTrace,
    triePseudocode,
  } from '$lib/algo-engine/tries.js';
  import { en as m } from '$lib/lessons/tries/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import { parseLetters } from '$lib/algo-engine/text-match.js';

  /** @typedef {import('$lib/algo-engine/tries.js').TrieOp} TrieOp */
  /** @typedef {import('$lib/algo-engine/tries.js').TriePreset} TriePreset */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.states} Role */

  const PRESET_KEYS = /** @type {TriePreset[]} */ (['shared', 'apart', 'nested']);
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'compare',
    new: 'active',
    found: 'sorted',
    missing: 'swap',
    path: 'visited',
    subtree: 'frontier',
    typed: 'path',
  };
  const ROLES = /** @type {Role[]} */ (Object.keys(ROLE_STATE));

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeTrieOps('shared');
  /** @type {TrieOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  // `draft` follows the input as the learner types; `word` changes only on a valid commit.
  let word = $state('car');
  let draft = $state('car');
  let preset = $state(/** @type {TriePreset | ''} */ ('shared'));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(trieTrace(INITIAL_OPS));
  // Open on the finished trie, as a preset does, so the typed word has a path to light up.
  player.seek(player.frames.length - 1);
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const errors = m.wordErrors(MAX_LEN);
  const wordField = createFieldGuard();

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function clearNotice() {
    notice = { text: '', at: -1 };
  }

  function commitWord() {
    const parsed = parseLetters(draft, MAX_LEN);
    if (wordField.commit(!('error' in parsed)) && 'word' in parsed) {
      word = draft = parsed.word;
      return;
    }
    draft = word;
    if ('error' in parsed) say(errors[parsed.error]);
  }

  /** @param {TrieOp['type']} type */
  function add(type) {
    const parsed = parseLetters(draft, MAX_LEN);
    if (wordField.refused() || 'error' in parsed) {
      draft = word;
      if ('error' in parsed) say(errors[parsed.error]);
      return;
    }
    word = draft = parsed.word;
    if (ops.length >= MAX_OPS) {
      say(m.logFull(MAX_OPS));
      return;
    }
    if (
      type === 'insert' &&
      finalFrame.wordCount >= MAX_WORDS &&
      !matchPrefix(finalFrame.nodes, word).isWord
    ) {
      say(m.full(MAX_WORDS));
      return;
    }
    clearNotice();
    preset = '';
    const next = [...ops, { type, word }];
    const frames = trieTrace(next);
    ops = next;
    player.load(frames);
    player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {TrieOp[]} next */
  function replaceLog(next) {
    clearNotice();
    ops = next;
    const frames = trieTrace(next);
    player.load(frames);
    player.seek(frames.length - 1);
  }

  function undo() {
    if (ops.length === 0) return;
    preset = '';
    replaceLog(ops.slice(0, -1));
  }

  function reset() {
    if (ops.length === 0) return;
    preset = '';
    replaceLog([]);
  }

  /** @param {TriePreset} picked */
  function loadPreset(picked) {
    preset = picked;
    replaceLog(makeTrieOps(picked));
  }

  /** Clicking a node copies the prefix it stands for into the field. @param {string | number} id */
  function pickNode(id) {
    const prefix = prefixOf(frame.nodes, Number(id));
    if (prefix === '') return;
    clearNotice();
    word = draft = prefix;
  }

  // What the field holds right now, as far as it can be read as a prefix.
  const typed = $derived.by(() => {
    const parsed = parseLetters(draft, MAX_LEN);
    return 'word' in parsed ? parsed.word : '';
  });
  const live = $derived(matchPrefix(frame.nodes, typed));

  /** @param {number} id @returns {Role | ''} */
  function roleOf(id) {
    if (frame.current === id) {
      if (frame.kind === 'create') return 'new';
      if (['mark', 'dup', 'found', 'collect'].includes(frame.kind)) return 'found';
      if (frame.kind === 'missing' || frame.kind === 'prefix-only') return 'missing';
      if (frame.kind !== 'subtree') return 'current';
    }
    if (frame.subtree.includes(id)) return 'subtree';
    if (frame.path.includes(id)) return 'path';
    // The typed path shows once the steps are over, so it never competes with a walk.
    if (frame.kind === 'done' || frame.kind === 'start') {
      if (id !== 0 && live.path.includes(id)) return 'typed';
    }
    return '';
  }

  /** @param {number} id @returns {TreeNode} */
  function toTree(id) {
    const node = frame.nodes[id];
    const role = roleOf(id);
    return {
      id,
      label: id === 0 ? m.rootLabel : node.letter,
      state: role ? ROLE_STATE[role] : '',
      marker: role ? m.markers[role] : '',
      note: node.isWord ? m.wordNote : undefined,
      children: childIds(node).map(toTree),
    };
  }

  const roots = $derived([toTree(0)]);
  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the word field inserts; the other buttons never submit. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(e) => enterField(e, { word: () => add('insert') })}
    onsubmit={(e) => {
      e.preventDefault();
      add('insert');
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.wordLabel}
      <input
        type="text"
        name="word"
        maxlength={MAX_LEN + 4}
        autocomplete="off"
        autocapitalize="none"
        class="field w-36 font-mono normal-case"
        bind:value={draft}
        onchange={commitWord}
      />
    </label>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.insert}</button>
      <button type="button" class="btn-secondary" onclick={() => add('search')}>{m.search}</button>
      <button type="button" class="btn-outline" onclick={() => add('complete')}>{m.complete}</button
      >
    </div>
    <!-- aria-disabled rather than disabled so keyboard focus stays on the button when the log empties. -->
    <div class="flex flex-wrap gap-2 border-l border-slate-300 pl-4">
      <button type="button" class="btn-outline" aria-disabled={ops.length === 0} onclick={undo}
        >{m.undo}</button
      >
      <button type="button" class="btn-outline" aria-disabled={ops.length === 0} onclick={reset}
        >{m.reset}</button
      >
    </div>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(/** @type {TriePreset} */ (e.currentTarget.value))}
      >
        {#if preset === ''}<option value="" disabled>{m.presetPlaceholder}</option>{/if}
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <TreeView
          {roots}
          ariaLabel={m.treeLabel(frame.nodeCount, frame.wordCount)}
          labelOf={(node) => {
            const id = Number(node.id);
            const role = roleOf(id);
            return m.nodeLabel(
              prefixOf(frame.nodes, id),
              frame.nodes[id].isWord,
              role ? m.states[role] : '',
            );
          }}
          onselect={pickNode}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each ROLES as role (role)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[role]]}"
              ></span>{m.markers[role]}
              {m.legend[role]}
            </li>
          {/each}
        </ul>
        <p class="mt-2 text-xs text-slate-600">{m.wordLegend}</p>
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
          <dt class="text-xs text-slate-500">{m.stats.steps}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="steps">{frame.steps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.words}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="words">{frame.wordCount}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.letters}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="letters">{frame.letterCount}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.nodes}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="nodes">{frame.nodeCount - 1}</dd>
        </div>
      </dl>
      <p class="text-sm text-slate-600">{m.saved(frame.letterCount, frame.storedNodeCount)}</p>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-1 text-xs text-slate-500">{m.liveTitle}</h2>
        <p class="text-sm text-slate-800" data-testid="live">
          {m.live(typed, live.matched, live.words)}
        </p>
      </div>
      <ChipList
        title={m.resultsTitle}
        items={frame.results.map((label) => ({ label }))}
        emptyText={m.resultsEmpty}
      />
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={triePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
