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
    MAX_KEY,
    MAX_NODES,
    MAX_OPS,
    MIN_KEY,
    avlPseudocode,
    avlTrace,
    balanceOf,
    inorderKeys,
    makeOps,
  } from '$lib/algo-engine/avl-trees.js';
  import { en as m } from '$lib/lessons/avl-trees/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/avl-trees.js').AvlOp} AvlOp */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {'compare'|'path'|'added'|'retrace'|'unbalanced'|'up'|'down'|'successor'} Role */

  const PRESETS = /** @type {const} */ (['ll', 'rr', 'lr', 'rl', 'sorted', 'cascade', 'random']);
  const CASES = /** @type {const} */ (['LL', 'LR', 'RR', 'RL']);
  /** @type {Record<Role, import('$lib/components/visual-state.js').VisualState>} */
  const ROLE_STATE = {
    compare: 'compare',
    path: 'visited',
    added: 'active',
    retrace: 'frontier',
    unbalanced: 'swap',
    up: 'sorted',
    down: 'path',
    successor: 'frontier',
  };
  const LEGEND = /** @type {Role[]} */ ([
    'compare',
    'path',
    'added',
    'retrace',
    'unbalanced',
    'up',
    'down',
    'successor',
  ]);

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeOps('lr');
  /** @type {AvlOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  // `draft` follows the input as the learner types; `key` changes only on a valid commit.
  let key = $state(25);
  /** @type {number | null} */
  let draft = $state(25);
  let preset = $state('lr');
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(avlTrace(INITIAL_OPS));
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const validKey = (v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= MIN_KEY && v <= MAX_KEY;

  const keyField = createFieldGuard();

  function commitKey() {
    if (keyField.commit(validKey(draft))) key = /** @type {number} */ (draft);
    else {
      draft = key;
      say(m.keyError);
    }
  }

  /** @param {AvlOp['type']} type */
  function add(type) {
    if (keyField.refused() || !validKey(draft)) {
      draft = key;
      say(m.keyError);
      return;
    }
    key = /** @type {number} */ (draft);
    if (ops.length >= MAX_OPS) {
      say(m.logFull);
      return;
    }
    if (
      type === 'insert' &&
      finalFrame.size >= MAX_NODES &&
      !inorderKeys(finalFrame).includes(key)
    ) {
      say(m.full);
      return;
    }
    notice = { text: '', at: -1 };
    preset = '';
    const next = [...ops, { type, key }];
    const frames = avlTrace(next);
    ops = next;
    player.load(frames);
    player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {AvlOp[]} next @param {boolean} toEnd */
  function setOps(next, toEnd) {
    notice = { text: '', at: -1 };
    ops = next;
    const frames = avlTrace(next);
    player.load(frames);
    if (toEnd) player.seek(frames.length - 1);
  }

  function undo() {
    if (ops.length === 0) return;
    preset = '';
    setOps(ops.slice(0, -1), true);
  }

  function reset() {
    if (ops.length === 0) return;
    preset = '';
    setOps([], false);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {typeof PRESETS[number]} */ (e.currentTarget.value);
    setOps(makeOps(picked, Math.random), false);
    // A random log is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {string | number} id */
  function pick(id) {
    const k = frame.nodes[/** @type {number} */ (id)].key;
    if (k === null) return;
    draft = k;
    key = k;
  }

  /** @param {number} slot @returns {Role | null} */
  function roleOf(slot) {
    const f = frame;
    if (f.kind === 'rotate' && slot === f.moved) return 'up';
    if (f.kind === 'rotate' && slot === f.sunk) return 'down';
    if (f.kind === 'unbalanced' && slot === f.current) return 'unbalanced';
    if (f.kind === 'retrace' && slot === f.current) return 'retrace';
    if (f.kind === 'insert' && slot === f.current) return 'added';
    if ((f.kind === 'successor' || f.kind === 'copy') && slot === f.succ) return 'successor';
    if (f.current === slot && ['visit', 'go-left', 'go-right', 'found', 'dup'].includes(f.kind))
      return 'compare';
    return f.path.includes(slot) && f.kind !== 'retrace' && f.kind !== 'rotate' ? 'path' : null;
  }

  /** @param {number} slot @returns {TreeNode | null} */
  function toTree(slot) {
    if (slot === -1) return null;
    const n = frame.nodes[slot];
    const role = roleOf(slot);
    return {
      id: slot,
      label: String(n.key),
      state: role ? ROLE_STATE[role] : '',
      marker: role ? m.markers[role] : '',
      note: m.note(balanceOf(frame.nodes, slot)),
      children: [toTree(n.left), toTree(n.right)],
    };
  }

  const roots = $derived.by(() => {
    const t = toTree(frame.root);
    return t ? [t] : [];
  });
  const keys = $derived(inorderKeys(frame));
  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));

  /** @param {TreeNode} node */
  function labelOf(node) {
    const role = roleOf(/** @type {number} */ (node.id));
    return m.nodeLabel(node.label, node.note ?? '', role ? m.roles[role] : '');
  }
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the key field submits the form, which inserts; the other buttons never submit. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    onkeydown={(e) => enterField(e, { key: () => add('insert') })}
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      add('insert');
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.keyLabel}
      <input
        type="number"
        name="key"
        min={MIN_KEY}
        max={MAX_KEY}
        step="1"
        class="field w-24"
        bind:value={draft}
        onchange={commitKey}
      />
    </label>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.insert}</button>
      <button type="button" onclick={() => add('search')} class="btn-secondary">{m.search}</button>
      <button type="button" onclick={() => add('delete')} class="btn-outline">{m.remove}</button>
    </div>
    <!-- aria-disabled rather than disabled so keyboard focus stays on the button when the log empties. -->
    <div class="flex flex-wrap gap-2 border-l border-slate-300 pl-4">
      <button type="button" onclick={undo} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.undo}</button
      >
      <button type="button" onclick={reset} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.reset}</button
      >
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

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeLabel(keys, frame.height)}
          {labelOf}
          onselect={pick}
          emptyText={m.emptyTree}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each LEGEND as l (l)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[l]]}"
              ></span>
              {m.markers[l] ? `${m.markers[l]} ${m.roles[l]}` : m.roles[l]}
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

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.opRotations}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="op-rotations">
            {frame.opRotations}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.rotations}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="rotations">{frame.rotations}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.height}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="height">{frame.height}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.size}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.size}</dd>
        </div>
      </dl>
      <p class="text-sm text-slate-600">{m.bound(frame.size)}</p>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.casesTitle}</h2>
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-500">
              {#each m.caseHead as h (h)}
                <th class="pr-2 font-medium">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each CASES as c (c)}
              {@const on = frame.imbalance === c}
              <tr class={on ? 'bg-amber-100 font-semibold' : ''} data-testid="case-{c}">
                <td class="pr-2 align-top font-mono">
                  {c}
                  {#if on}<span class="font-sans">{m.caseCurrent}</span>{/if}
                </td>
                <td class="pr-2 align-top">{m.cases[c][0]}</td>
                <td class="align-top">{m.cases[c][1]}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={avlPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
