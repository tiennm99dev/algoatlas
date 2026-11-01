<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    inorderKeys,
    makeKeys,
    parseKeys,
    whyBalancePseudocode,
    whyBalanceTrace,
  } from '$lib/algo-engine/why-balance-matters.js';
  import { en as m } from '$lib/lessons/why-balance-matters/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/why-balance-matters.js').BalanceNode} BalanceNode */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {'sorted'|'reversed'|'zigzag'|'balanced'|'random'} Preset */

  const PRESETS = /** @type {const} */ (['sorted', 'reversed', 'zigzag', 'balanced', 'random']);
  // A fixed first list keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makeKeys('sorted');

  let keys = $state.raw(INITIAL);
  let draft = $state(INITIAL.join(', '));
  let preset = $state('sorted');
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(whyBalanceTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {number[]} next */
  function load(next) {
    keys = next;
    draft = next.join(', ');
    notice = { text: '', at: -1 };
    player.load(whyBalanceTrace(next));
  }

  function commit() {
    const parsed = parseKeys(draft);
    if (parsed.error !== null) {
      draft = keys.join(', ');
      notice = { text: m.errors[parsed.error], at: player.index };
      return;
    }
    const next = /** @type {number[]} */ (parsed.keys);
    if (next.join() === keys.join()) {
      draft = next.join(', ');
      return;
    }
    preset = '';
    load(next);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {Preset} */ (e.currentTarget.value);
    load(makeKeys(picked, Math.random));
    // A random list is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  function reset() {
    preset = 'sorted';
    load(INITIAL);
  }

  /**
   * @param {BalanceNode} node
   * @returns {'added'|'up'|'down'|''}
   */
  function roleOf(node) {
    const r = frame.rotation;
    if (r && node.key === r.up) return 'up';
    if (r && node.key === r.pivot) return 'down';
    return !r && node.key === frame.key ? 'added' : '';
  }

  const ROLE_STATE = /** @type {const} */ ({
    added: 'active',
    up: 'swap',
    down: 'compare',
    '': '',
  });

  /**
   * @param {BalanceNode | null} node
   * @param {boolean} live  Only the tree the current frame changes carries a highlight.
   * @returns {TreeNode | null}
   */
  function toTree(node, live) {
    if (!node) return null;
    const role = live ? roleOf(node) : '';
    return {
      id: node.key,
      label: String(node.key),
      state: ROLE_STATE[role],
      marker: role ? m.markers[role] : '',
      children: [toTree(node.left, live), toTree(node.right, live)],
    };
  }

  const plainRoots = $derived.by(() => {
    const t = toTree(frame.plain, frame.kind === 'insert-plain');
    return t ? [t] : [];
  });
  const avlRoots = $derived.by(() => {
    const t = toTree(frame.avl, frame.kind === 'insert-avl' || frame.kind === 'rotate');
    return t ? [t] : [];
  });

  const panels = $derived([
    {
      id: 'plain',
      title: m.plainTitle,
      height: frame.plainHeight,
      roots: plainRoots,
      label: m.treeLabel(m.plainTitle, frame.plainHeight, inorderKeys(frame.plain)),
    },
    {
      id: 'avl',
      title: m.avlTitle,
      height: frame.avlHeight,
      roots: avlRoots,
      label: m.treeLabel(m.avlTitle, frame.avlHeight, inorderKeys(frame.avl)),
    },
  ]);

  const stats = $derived([
    [m.stats.plainHeight, frame.plainHeight],
    [m.stats.avlHeight, frame.avlHeight],
    [m.stats.plainComparisons, frame.plainComparisons],
    [m.stats.avlComparisons, frame.avlComparisons],
    [m.stats.rotations, frame.rotations],
    [m.stats.ideal, frame.idealHeight],
  ]);

  const LEGEND = /** @type {const} */ (['added', 'up', 'down']);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commit();
    }}
  >
    <label
      class="flex min-w-64 flex-1 flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
    >
      {m.keysLabel}
      <input
        type="text"
        name="keys"
        class="field w-full font-mono"
        aria-label={m.keysAria}
        bind:value={draft}
        onchange={commit}
      />
    </label>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.run}</button>
      <button type="button" class="btn-outline" onclick={reset}>{m.resetLabel}</button>
    </div>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </form>

  <!-- The trees take the full width, so both stay readable side by side. -->
  <div class="mb-4 flex flex-col gap-4">
    <div class="grid gap-4 md:grid-cols-2">
      {#each panels as panel (panel.id)}
        <section class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-sm font-semibold text-slate-800">
            {panel.title}: {m.heightWord}
            <span data-testid="{panel.id}-height">{panel.height}</span>
          </h2>
          <TreeView
            roots={panel.roots}
            binary
            ariaLabel={panel.label}
            emptyText={m.emptyTree}
            speed={player.speed}
          />
        </section>
      {/each}
    </div>
    <ul class="flex flex-wrap gap-4 text-xs text-slate-600">
      {#each LEGEND as l (l)}
        <li class="flex items-center gap-1.5">
          <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[l]]}"></span>
          {m.markers[l]}
          {m.legend[l]}
        </li>
      {/each}
    </ul>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        {#each stats as [label, value] (label)}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        {/each}
      </dl>
      <p class="text-sm text-slate-600">{m.heightNote}</p>
      <CodePanel lines={whyBalancePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
