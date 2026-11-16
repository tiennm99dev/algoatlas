<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { createFieldGuard, enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import { parseValueList } from '$lib/algo-engine/parse-values.js';
  import {
    GAME_PRESETS,
    MAX_MOVE,
    MAX_MOVES,
    MAX_PILE,
    MAX_PILES,
    MIN_PILES,
    bestMove,
    canMove,
    grundyPseudocode,
    grundyTrace,
    grundyValues,
    nimSum,
    takesFrom,
    winningMoves,
  } from '$lib/algo-engine/sprague-grundy.js';
  import { en as m } from '$lib/lessons/sprague-grundy/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/sprague-grundy.js').GameRule} GameRule */
  /** @typedef {keyof typeof GAME_PRESETS} Preset */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(GAME_PRESETS));
  const RULES = [
    { value: 'nim', label: m.rules.nim },
    { value: 'subtraction', label: m.rules.subtraction },
  ];
  /** @type {Record<keyof typeof m.legend, VisualState>} */
  const LEGEND_STATE = { active: 'active', compare: 'compare', done: 'sorted' };
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));

  const INITIAL = GAME_PRESETS.classic;
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let rule = $state(/** @type {GameRule} */ (INITIAL.rule));
  let piles = $state(INITIAL.piles.slice());
  let moves = $state(INITIAL.moves.slice());
  let pilesDraft = $state(INITIAL.piles.join(', '));
  let movesDraft = $state(INITIAL.moves.join(', '));
  let notice = $state({ text: '', at: -1 });

  let board = $state(INITIAL.piles.slice());
  let status = $state('');
  let showHint = $state(false);
  let over = $state(false);
  let chosenPile = $state(0);
  let take = $state(/** @type {number | null} */ (1));
  let takeDraft = $state(/** @type {number | null} */ (1));
  const takeGuard = createFieldGuard();

  const player = createPlayer(grundyTrace(INITIAL.piles, INITIAL.rule, INITIAL.moves));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  const g = $derived(grundyValues(rule, moves, Math.max(...piles)));
  const X = $derived(nimSum(board, g));
  const bits = $derived(Math.max(1, ...g.map((v) => v.toString(2).length)));
  const wins = $derived(winningMoves(board, rule, moves, g));
  const gameStatus = $derived(status || m.yourTurn(X));

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function restart() {
    board = piles.slice();
    status = '';
    showHint = false;
    over = false;
    chosenPile = 0;
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(grundyTrace(piles, rule, moves));
    restart();
  }

  function commitPiles() {
    const parsed = parseValueList(pilesDraft, {
      max: MAX_PILE,
      minN: MIN_PILES,
      maxN: MAX_PILES,
    });
    if (!('values' in parsed)) {
      pilesDraft = piles.join(', ');
      say(m.pilesError(MIN_PILES, MAX_PILES, MAX_PILE));
      return;
    }
    if (parsed.values.join(',') === piles.join(',')) return;
    piles = parsed.values;
    pilesDraft = piles.join(', ');
    preset = '';
    rebuild();
  }

  function commitMoves() {
    const parsed = parseValueList(movesDraft, { min: 1, max: MAX_MOVE, maxN: MAX_MOVES });
    if (!('values' in parsed) || new Set(parsed.values).size !== parsed.values.length) {
      movesDraft = moves.join(', ');
      say(m.movesError(MAX_MOVES, MAX_MOVE));
      return;
    }
    const sorted = parsed.values.sort((a, b) => a - b);
    movesDraft = sorted.join(', ');
    if (sorted.join(',') === moves.join(',')) return;
    moves = sorted;
    preset = '';
    rebuild();
  }

  function changeRule() {
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    const game = GAME_PRESETS[p];
    preset = p;
    rule = game.rule;
    piles = game.piles.slice();
    moves = game.moves.slice();
    pilesDraft = piles.join(', ');
    movesDraft = moves.join(', ');
    rebuild();
  }

  /** @param {number} pile @param {number} count */
  function play(pile, count) {
    if (over) {
      status = m.over;
      return;
    }
    const legal = takesFrom(rule, moves, board[pile]);
    if (!legal.includes(count)) {
      status = m.illegal(pile, legal);
      return;
    }
    const you = { pile, take: count };
    const after = board.slice();
    after[pile] -= count;
    showHint = false;
    if (!canMove(after, rule, moves)) {
      board = after;
      over = true;
      status = m.youWin(you);
      return;
    }
    const it = /** @type {{ pile: number, take: number }} */ (bestMove(after, rule, moves, g));
    after[it.pile] -= it.take;
    board = after;
    if (!canMove(after, rule, moves)) {
      over = true;
      status = m.youLose(you, it);
      return;
    }
    status = m.reply(you, it, nimSum(after, g));
  }

  function commitTake() {
    if (takeGuard.commit(wholeInRange(takeDraft, 1, MAX_PILE))) take = takeDraft;
    else {
      takeDraft = take;
      status = m.takeError(MAX_PILE);
    }
  }

  function playForm() {
    if (takeGuard.refused() || !wholeInRange(takeDraft, 1, MAX_PILE)) {
      takeDraft = take;
      status = m.takeError(MAX_PILE);
      return;
    }
    take = takeDraft;
    play(chosenPile, /** @type {number} */ (take));
  }

  /** @param {number} x @returns {VisualState} */
  function cellState(x) {
    const f = frame;
    if (f.x === x) return 'active';
    if (f.kind === 'look' && f.x - f.take === x) return 'compare';
    if (f.kind === 'pile' && f.piles[f.pile] === x) return 'active';
    return f.g[x] === null ? '' : 'sorted';
  }

  /** @param {number} x */
  function cellMarker(x) {
    const s = cellState(x);
    if (s === 'active') return m.markers.active;
    if (s === 'compare') return m.markers.compare;
    return '';
  }

  const pointers = $derived.by(() => {
    const f = frame;
    const list = [];
    if (f.x >= 0) list.push({ name: m.pointerX, index: f.x });
    if (f.kind === 'look') list.push({ name: m.pointerFrom, index: f.x - f.take });
    return list;
  });

  /** @param {number} v */
  const binary = (v) => v.toString(2).padStart(bits, '0');
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.piles}
      <input
        type="text"
        name="piles"
        class="field w-44 tabular-nums"
        bind:value={pilesDraft}
        onchange={commitPiles}
      />
    </label>
    <SegmentedControl
      legend={m.fields.rule}
      name="rule"
      options={RULES}
      bind:value={rule}
      onchange={changeRule}
    />
    {#if rule === 'subtraction'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.moves}
        <input
          type="text"
          name="moves"
          class="field w-32 tabular-nums"
          bind:value={movesDraft}
          onchange={commitMoves}
        />
      </label>
    {/if}
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(ev) => loadPreset(/** @type {Preset} */ (ev.currentTarget.value))}
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
        <ArrayStrip
          values={frame.g.map((v) => v ?? m.unknown)}
          ariaLabel={m.tableAria(frame.g)}
          stateOf={cellState}
          markerOf={cellMarker}
          {pointers}
          speed={player.speed}
        />
        <p class="mt-1 font-mono text-sm text-slate-700" data-testid="seen">
          {frame.x >= 0 ? m.seenText(frame.seen) : ''}
        </p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each LEGEND as key (key)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[LEGEND_STATE[key]]}"
              ></span>{m.legend[key]}
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

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.gameTitle}
        </h2>
        <ul class="flex flex-col gap-2" data-testid="board">
          {#each board as h, i (i)}
            <li class="flex flex-wrap items-center gap-2">
              <span class="w-44 shrink-0 text-sm text-slate-700">{m.pileLabel(i, h, g[h])}</span>
              <span class="flex flex-wrap gap-1">
                {#each { length: h } as _, s (s)}
                  <button
                    type="button"
                    tabindex="-1"
                    class="size-6 rounded-full border border-slate-700 bg-amber-300 hover:bg-amber-500"
                    aria-label={m.stoneAria(i, h - s)}
                    title={m.stoneAria(i, h - s)}
                    onclick={() => play(i, h - s)}
                  ></button>
                {/each}
              </span>
            </li>
          {/each}
        </ul>

        <div class="mt-3 overflow-x-auto">
          <table class="text-sm tabular-nums" aria-label={m.xorAria(X)}>
            <thead>
              <tr class="text-left text-xs text-slate-500">
                {#each m.bitsHead as head (head)}<th class="pr-4 font-semibold">{head}</th>{/each}
              </tr>
            </thead>
            <tbody>
              {#each board as h, i (i)}
                <tr>
                  <td class="pr-4">{i + 1}</td>
                  <td class="pr-4">{h}</td>
                  <td class="pr-4">{g[h]}</td>
                  <td class="pr-4 font-mono tracking-widest">{binary(g[h])}</td>
                </tr>
              {/each}
              <tr class="border-t border-slate-400 font-bold">
                <td class="pr-4" colspan="2">{m.xorRow}</td>
                <td class="pr-4" data-testid="xor">{X}</td>
                <td class="pr-4 font-mono tracking-widest">{binary(X)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="mt-3 text-sm text-slate-800" aria-live="polite" data-testid="status">
          {gameStatus}
        </p>
        {#if showHint && !over}
          <p class="mt-1 text-sm font-semibold text-slate-900" data-testid="hint">
            {m.hint(wins)}
          </p>
        {/if}

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <form
          class="mt-3 flex flex-wrap items-end gap-3"
          onkeydown={(ev) => enterField(ev, { take: playForm })}
          onsubmit={(ev) => ev.preventDefault()}
        >
          <label
            class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
            {m.pileField}
            <select name="pile" class="field" bind:value={chosenPile}>
              {#each board as _, i (i)}<option value={i}>{m.pileOption(i)}</option>{/each}
            </select>
          </label>
          <label
            class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
            {m.takeField}
            <input
              type="number"
              name="take"
              min="1"
              max={MAX_PILE}
              class="field w-20 tabular-nums"
              bind:value={takeDraft}
              onchange={commitTake}
            />
          </label>
          <button type="button" class="btn-primary" onclick={playForm}>{m.takeButton}</button>
          <button type="button" class="btn-outline" onclick={() => (showHint = true)}
            >{m.hintButton}</button
          >
          <button type="button" class="btn-outline" onclick={restart}>{m.restart}</button>
        </form>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.lookups}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="lookups">{frame.lookups}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.positions}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="positions">
            {frame.g.filter((v) => v !== null).length}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.xor}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="trace-xor">{frame.xor}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.verdict}</dt>
          <dd class="text-xl font-bold" data-testid="verdict">
            {frame.kind !== 'done'
              ? m.verdicts.open
              : frame.xor !== 0
                ? m.verdicts.win
                : m.verdicts.lose}
          </dd>
        </div>
      </dl>
      <CodePanel lines={grundyPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
