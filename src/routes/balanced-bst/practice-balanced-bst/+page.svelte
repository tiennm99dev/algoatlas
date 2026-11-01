<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    DEFAULT_SEED,
    MAX_OPS,
    RUNNER_PRESETS,
    formatOps,
    makeRunnerOps,
    parseOps,
    runnerPseudocode,
    runnerTrace,
    seededRand,
  } from '$lib/algo-engine/practice-balanced-bst.js';
  import { en as m } from '$lib/lessons/practice-balanced-bst/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-balanced-bst.js').RunnerOp} RunnerOp */
  /** @typedef {import('$lib/algo-engine/practice-balanced-bst.js').TreeShape} TreeShape */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {'compare'|'added'|'hit'} Role */

  /** @type {Record<Role, import('$lib/components/visual-state.js').VisualState>} */
  const ROLE_STATE = { compare: 'compare', added: 'active', hit: 'sorted' };
  const LEGEND = /** @type {Role[]} */ (['compare', 'added', 'hit']);
  const IDS = /** @type {const} */ (['bst', 'avl', 'skip']);
  const RANK_MODES = /** @type {const} */ (['walk', 'counted']);

  // A fixed first sequence and seed keep the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeRunnerOps('sorted');
  /** @type {RunnerOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let text = $state(formatOps(INITIAL_OPS));
  let preset = $state('sorted');
  let rankMode = $state(/** @type {'walk'|'counted'} */ ('walk'));
  let seed = DEFAULT_SEED;
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(runnerTrace(INITIAL_OPS, { rand: seededRand(seed) }));
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const counted = $derived(rankMode === 'counted');
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, counted));
  const barScale = $derived(Math.max(1, ...IDS.map((id) => finalFrame[id].total)));

  function trace() {
    return runnerTrace(ops, { rand: seededRand(seed), counted: rankMode === 'counted' });
  }

  /** Rebuild the trace on the same sequence, staying on the same step. */
  function rerun() {
    const at = player.index;
    notice = { text: '', at: -1 };
    player.load(trace());
    player.seek(at);
  }

  function flipCoins() {
    seed = 1 + Math.floor(Math.random() * 2147483646);
    rerun();
  }

  function commitOps() {
    const r = parseOps(text);
    if ('error' in r) {
      text = formatOps(ops);
      notice = { text: m.opErrors[r.error], at: player.index };
      return;
    }
    if (formatOps(r.ops) === formatOps(ops)) {
      text = formatOps(ops);
      return;
    }
    ops = r.ops;
    text = formatOps(r.ops);
    preset = '';
    notice = { text: '', at: -1 };
    player.load(trace());
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {typeof RUNNER_PRESETS[number]} */ (e.currentTarget.value);
    ops = makeRunnerOps(picked, Math.random);
    text = formatOps(ops);
    // A preset always gets the same coins, so its totals can be quoted and compared.
    seed = DEFAULT_SEED;
    notice = { text: '', at: -1 };
    player.load(trace());
    // A random sequence is never "the" preset: the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {number} key @param {number[]} path @returns {Role | null} */
  function roleOf(key, path) {
    if (frame.kind === 'op' && frame.op?.key === key) {
      if (frame.outcome === 'added') return 'added';
      if (frame.outcome === 'found' || frame.outcome === 'dup') return 'hit';
    }
    return path.includes(key) ? 'compare' : null;
  }

  /** @param {TreeShape | null} n @param {number[]} path @returns {TreeNode | null} */
  function toTree(n, path) {
    if (!n) return null;
    const role = roleOf(n.key, path);
    return {
      id: n.key,
      label: String(n.key),
      state: role ? ROLE_STATE[role] : '',
      marker: role ? m.markers[role] : '',
      children: [toTree(n.left, path), toTree(n.right, path)],
    };
  }

  /** @param {TreeShape | null} n @returns {number[]} */
  const keysOf = (n) => (n ? [...keysOf(n.left), n.key, ...keysOf(n.right)] : []);

  const panels = $derived(
    /** @type {const} */ (['bst', 'avl']).map((id) => {
      const tree = id === 'bst' ? frame.bstTree : frame.avlTree;
      const root = toTree(tree, frame[id].path);
      return {
        id,
        title: m.structures[id],
        height: frame[id].height,
        roots: root ? [root] : [],
        label: m.treeLabel(m.structures[id], frame[id].height, keysOf(tree)),
      };
    }),
  );

  const levels = $derived(
    Array.from({ length: frame.skip.height }, (_, i) => frame.skip.height - i),
  );
  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));

  /** @param {TreeNode} node */
  function labelOf(node) {
    const s = /** @type {string} */ (node.state ?? '');
    const role = LEGEND.find((l) => ROLE_STATE[l] === s);
    return m.nodeLabel(node.label, role ? m.roles[role] : '');
  }

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitOps();
    }}
  >
    <label class="{labelClass} min-w-64 flex-1">
      {m.opsLabel}
      <input
        type="text"
        name="ops"
        class="field w-full font-mono"
        aria-label={m.opsAria}
        bind:value={text}
        onchange={commitOps}
      />
      <span class="font-normal tracking-normal normal-case">{m.opsHelp}</span>
    </label>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.run}</button>
      <button type="button" class="btn-outline" onclick={flipCoins}>{m.coins}</button>
    </div>
    <SegmentedControl
      legend={m.rankLabel}
      name="rank-mode"
      options={RANK_MODES.map((v) => ({ value: v, label: m.rankModes[v] }))}
      bind:value={rankMode}
      onchange={rerun}
    />
    <label class={labelClass}>
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each RUNNER_PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </form>

  <!-- The structures take the full width, so a long chain stays readable beside its rival. -->
  <div class="mb-4 flex flex-col gap-4">
    <div class="grid gap-4 md:grid-cols-2">
      {#each panels as panel (panel.id)}
        <section class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-sm font-semibold text-slate-800">
            {panel.title}: {m.heightWord}
            {panel.height}
          </h2>
          <TreeView
            roots={panel.roots}
            binary
            ariaLabel={panel.label}
            {labelOf}
            emptyText={m.emptyTree}
            speed={player.speed}
          />
        </section>
      {/each}
    </div>
    <section class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <h2 class="mb-2 text-sm font-semibold text-slate-800">
        {m.structures.skip}: {m.levelsWord}
        {frame.skip.height}
      </h2>
      {#if frame.towers.length === 0}
        <p class="py-4 text-center text-sm text-slate-500">{m.emptySkip}</p>
      {:else}
        <div class="overflow-x-auto" data-testid="skip-list">
          <table
            class="border-separate border-spacing-1 font-mono text-xs"
            aria-label={m.skipLabel(
              frame.skip.height,
              frame.towers.map((t) => m.towerText(t.key, t.height)).join(', '),
            )}
          >
            <tbody>
              {#each levels as level (level)}
                <tr>
                  <th scope="row" class="pr-1 text-left font-medium text-slate-500"
                    >{m.levelHead(level)}</th
                  >
                  {#each frame.towers as t (t.key)}
                    {@const role = roleOf(t.key, frame.skip.path)}
                    <td class="min-w-8 text-center">
                      {#if t.height >= level}
                        <span
                          class="block rounded border border-slate-400 px-1 py-0.5 {role
                            ? `${STATE_BG[ROLE_STATE[role]]} ${role === 'compare' ? 'text-slate-900' : 'text-white'}`
                            : 'bg-white text-slate-900'}"
                          >{t.key}{#if role && level === 1}<span aria-hidden="true"
                              >{m.markers[role]}</span
                            >{/if}</span
                        >
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
    <ul class="flex flex-wrap gap-4 text-xs text-slate-600">
      {#each LEGEND as l (l)}
        <li class="flex items-center gap-1.5">
          <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[l]]}"></span>
          {m.markers[l]}
          {m.roles[l]}
        </li>
      {/each}
    </ul>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <section class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.costTitle}
        </h2>
        <ul class="flex flex-col gap-3">
          {#each IDS as id (id)}
            <li>
              <div class="flex flex-wrap items-baseline justify-between gap-x-3">
                <span class="font-semibold text-slate-800">{m.structures[id]}</span>
                <span class="text-2xl font-bold tabular-nums" data-testid="{id}-total"
                  >{frame[id].total}</span
                >
              </div>
              <div class="mt-1 h-2 rounded bg-slate-100" aria-hidden="true">
                <div
                  class="h-2 rounded bg-state-active"
                  style="width: {(frame[id].total / barScale) * 100}%"
                ></div>
              </div>
              <p class="mt-1 text-xs text-slate-600">
                {m.stats.thisOp} <span data-testid="{id}-cost">{frame[id].cost}</span>
                · {m.stats.worst} <span data-testid="{id}-worst">{frame[id].worst}</span>
                · {id === 'skip' ? m.stats.levels : m.stats.height}
                <span data-testid="{id}-height">{frame[id].height}</span>
              </p>
            </li>
          {/each}
        </ul>
      </section>
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
          <dt class="text-xs text-slate-500">{m.stats.keys}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="keys">{frame.size}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.rotations}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="rotations">{frame.rotations}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.rank}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="rank">
            {frame.rank ?? m.noRank}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={runnerPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
