<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_LEN,
    STRING_PRESETS,
    parseWord,
    stringDpPseudocode,
    stringDpTrace,
  } from '$lib/algo-engine/lcs-edit-distance.js';
  import { en as m } from '$lib/lessons/lcs-edit-distance/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/lcs-edit-distance.js').StringDpMode} StringDpMode */
  /** @typedef {import('$lib/algo-engine/lcs-edit-distance.js').StringDpMove} StringDpMove */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof STRING_PRESETS} Preset */
  /** @typedef {'current'|'kept'|'read'|'path'|'answer'|''} Role */

  const MODES = /** @type {StringDpMode[]} */ (['lcs', 'edit']);
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(STRING_PRESETS));
  /** @type {Record<StringDpMove, [number, number]>} */
  const STEP = { diag: [-1, -1], up: [-1, 0], left: [0, -1] };

  let mode = $state(/** @type {StringDpMode} */ ('lcs'));
  let preset = $state(/** @type {Preset | ''} */ ('clrs'));
  let a = $state(STRING_PRESETS.clrs[0]);
  let b = $state(STRING_PRESETS.clrs[1]);
  let aText = $state(STRING_PRESETS.clrs[0]);
  let bText = $state(STRING_PRESETS.clrs[1]);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(stringDpTrace('lcs', STRING_PRESETS.clrs[0], STRING_PRESETS.clrs[1]));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const errors = m.wordErrors(MAX_LEN);

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(stringDpTrace(mode, a, b));
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    [a, b] = STRING_PRESETS[p];
    aText = a;
    bText = b;
    rebuild();
  }

  /** @param {'a'|'b'} which */
  function commitWord(which) {
    const parsed = parseWord(which === 'a' ? aText : bText);
    if ('error' in parsed) {
      if (which === 'a') aText = a;
      else bText = b;
      notice = { text: errors[parsed.error], at: player.index };
      return;
    }
    if (which === 'a') a = aText = parsed.word;
    else b = bText = parsed.word;
    preset = '';
    rebuild();
  }

  const filling = $derived(frame.kind === 'fill');
  /** @param {StringDpMove} mv @returns {[number, number]} */
  const from = (mv) => [frame.i + STEP[mv][0], frame.j + STEP[mv][1]];
  const reads = $derived(filling ? frame.options.map((o) => from(o.move)) : []);
  const kept = $derived(filling && frame.move ? from(frame.move) : null);
  const pathSet = $derived(new Set(frame.path.map(([r, c]) => `${r}-${c}`)));

  /** @param {number} r @param {number} c @returns {Role} */
  function roleOf(r, c) {
    if (frame.kind === 'done' && r === frame.a.length && c === frame.b.length) return 'answer';
    if (pathSet.has(`${r}-${c}`)) return 'path';
    if (filling && r === frame.i && c === frame.j) return 'current';
    if (kept && kept[0] === r && kept[1] === c) return 'kept';
    if (reads.some(([x, y]) => x === r && y === c)) return 'read';
    return '';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'active',
    kept: 'compare',
    read: 'compare',
    path: 'path',
    answer: 'sorted',
    '': '',
  };

  /** @type {{from: [number, number], to: [number, number]}[]} */
  const arrows = $derived.by(() => {
    if (filling) return reads.map((cell) => ({ from: cell, to: [frame.i, frame.j] }));
    if (frame.kind === 'trace' && frame.move) {
      const [di, dj] = STEP[frame.move];
      return [{ from: [frame.i, frame.j], to: [frame.i + di, frame.j + dj] }];
    }
    return [];
  });

  /** @param {number} r @param {number} c */
  function cellLabel(r, c) {
    const role = roleOf(r, c);
    return m.cellLabel(frame.a, frame.b, r, c, frame.table[r][c], role ? m.cellStates[role] : '');
  }

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', `${m.markers.current} ${m.legend.current}`],
    ['compare', `${m.markers.read} ${m.legend.read}, ${m.markers.kept} ${m.legend.kept}`],
    ['path', `${m.markers.path} ${m.legend.path}`],
    ['sorted', `${m.markers.answer} ${m.legend.answer}`],
  ]);

  const total = $derived((frame.a.length + 1) * (frame.b.length + 1));
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitWord('a');
      commitWord('b');
    }}
  >
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={MODES.map((v) => ({ value: v, label: m.modes[v] }))}
      bind:value={mode}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.aLabel}
      <input
        type="text"
        name="a"
        maxlength={MAX_LEN + 4}
        autocapitalize="characters"
        class="field w-36 font-mono"
        bind:value={aText}
        onchange={() => commitWord('a')}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.bLabel}
      <input
        type="text"
        name="b"
        maxlength={MAX_LEN + 4}
        autocapitalize="characters"
        class="field w-36 font-mono"
        bind:value={bText}
        onchange={() => commitWord('b')}
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
          {m.tableTitle}
        </h2>
        <DpTable
          values={frame.table}
          ariaLabel={m.tableAria(frame.mode, frame.a, frame.b)}
          rowHeaders={[m.empty, ...frame.a]}
          colHeaders={[m.empty, ...frame.b]}
          stateOf={(r, c) => ROLE_STATE[roleOf(r, c)]}
          markerOf={(r, c) => {
            const role = roleOf(r, c);
            return role ? m.markers[role] : '';
          }}
          labelOf={cellLabel}
          {arrows}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.tableNote(frame.mode)}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.filled}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="filled">
            {frame.filled} / {total}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="result">
            {frame.result ?? m.resultPending}
          </dd>
        </div>
      </dl>
      {#if frame.mode === 'lcs'}
        <ChipList
          title={m.commonTitle}
          emptyText={m.commonEmpty}
          items={[...frame.common].map((label) => ({ label }))}
        />
      {:else}
        <div class="rounded-xl border border-slate-200 bg-white p-3" data-testid="alignment">
          <h2 class="mb-2 text-xs text-slate-500">{m.alignTitle}</h2>
          {#if frame.ops.length}
            <div class="overflow-x-auto">
              <table class="font-mono text-sm" aria-label={m.alignAria}>
                <tbody>
                  <tr>
                    {#each frame.ops as o, k (k)}
                      <td class="px-1 text-center">{o.from || m.gap}</td>
                    {/each}
                  </tr>
                  <tr>
                    {#each frame.ops as o, k (k)}
                      <td
                        class="px-1 text-center text-[10px] {o.op === 'keep'
                          ? 'text-slate-500'
                          : 'font-bold text-rose-800'}">{m.opNames[o.op]}</td
                      >
                    {/each}
                  </tr>
                  <tr>
                    {#each frame.ops as o, k (k)}
                      <td class="px-1 text-center">{o.to || m.gap}</td>
                    {/each}
                  </tr>
                </tbody>
              </table>
            </div>
            <ul class="mt-2 flex flex-wrap gap-1 font-mono text-xs">
              {#each frame.ops.filter((o) => o.op !== 'keep') as o, k (k)}
                <li class="rounded bg-rose-100 px-1.5 py-0.5 text-rose-900">{m.opLabel(o)}</li>
              {/each}
            </ul>
          {:else}
            <p class="text-sm text-slate-600">{m.alignEmpty}</p>
          {/if}
        </div>
      {/if}
      <CodePanel lines={stringDpPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
