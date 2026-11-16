<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    BINS,
    START_HAND,
    binOf,
    classifyPseudocode,
    dealHand,
    sortTrace,
  } from '$lib/algo-engine/practice-intractability.js';
  import { en as m } from '$lib/lessons/practice-intractability/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-intractability.js').Bin} Bin */

  // A fixed first hand keeps the prerendered HTML and the hydrated page identical.
  let hand = $state.raw(START_HAND);
  let answers = $state(/** @type {(Bin | '')[]} */ (START_HAND.map(() => '')));

  const player = createPlayer(
    sortTrace(
      START_HAND,
      START_HAND.map(() => ''),
    ),
  );
  const frame = $derived(player.frame);
  const narration = $derived(
    m.describe(frame, frame.card >= 0 ? binOf(frame.hand[frame.card]) : 'p'),
  );

  function rebuild() {
    player.load(sortTrace(hand, $state.snapshot(answers)));
  }

  function checkAll() {
    player.pause();
    player.seek(player.frames.length - 1);
  }

  function deal() {
    hand = dealHand();
    answers = hand.map(() => '');
    rebuild();
  }

  function clear() {
    answers = hand.map(() => '');
    rebuild();
  }

  const options = BINS.map((b) => ({ value: b, label: m.bins[b] }));

  /** @param {number} i @returns {{kind: 'right' | 'wrong' | 'unsorted', want: Bin} | null} */
  function verdictOf(i) {
    if (i >= frame.revealed) return null;
    const want = binOf(hand[i]);
    const given = frame.answers[i];
    if (given === '') return { kind: 'unsorted', want };
    return { kind: given === want ? 'right' : 'wrong', want };
  }
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-3">
    <button type="button" class="btn-outline" onclick={checkAll}>{m.checkAll}</button>
    <button type="button" class="btn-outline" onclick={deal}>{m.deal}</button>
    <button type="button" class="btn-outline" onclick={clear}>{m.clear}</button>
  </div>
  <dl class="mb-4 grid gap-2 text-sm sm:grid-cols-3">
    {#each BINS as b (b)}
      <div class="rounded-lg border border-slate-200 bg-white px-3 py-2">
        <dt class="font-semibold text-slate-900">{m.bins[b]}</dt>
        <dd class="text-slate-600">{m.binNotes[b]}</dd>
      </div>
    {/each}
  </dl>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <section class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.handTitle}
        </h2>
        <ul class="grid gap-3 xl:grid-cols-2">
          {#each hand as key, i (key)}
            {@const card = m.cards[key]}
            {@const verdict = verdictOf(i)}
            {@const now = frame.card === i}
            <li
              class="flex min-w-0 flex-col gap-2 rounded-lg border p-3 {now
                ? 'border-slate-900 ring-2 ring-state-active'
                : 'border-slate-200'}"
              data-card={key}
            >
              <p class="font-semibold text-slate-900">{card.name}</p>
              <p class="text-sm text-slate-700">{card.statement}</p>
              <div class="max-w-full overflow-x-auto">
                <SegmentedControl
                  legend={m.cardLegend(card.name)}
                  name={`bin-${key}`}
                  {options}
                  bind:value={answers[i]}
                  onchange={rebuild}
                />
              </div>
              {#if verdict}
                <p
                  class="rounded-md px-2 py-1 text-sm {verdict.kind === 'right'
                    ? 'bg-state-sorted text-white'
                    : verdict.kind === 'wrong'
                      ? 'bg-state-swap text-white'
                      : 'bg-slate-100 text-slate-800'}"
                  data-testid="verdict-{key}"
                >
                  <span class="font-semibold">{m.verdicts[verdict.kind]}.</span>
                  {m.belongs(verdict.want)}
                  {card.why}
                </p>
              {/if}
            </li>
          {/each}
        </ul>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border-2 border-state-active"></span>{m.legend.active}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-sorted"></span>{m.legend.right}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-swap"></span>{m.legend.wrong}
          </li>
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
          <dt class="text-xs text-slate-500">{m.stats.right}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="right">{frame.right}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.wrong}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="wrong">{frame.wrong}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.unsorted}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="unsorted">
            {frame.unsorted}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checked}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="checked">
            {frame.revealed} / {frame.hand.length}
          </dd>
        </div>
      </dl>
      <CodePanel lines={classifyPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
