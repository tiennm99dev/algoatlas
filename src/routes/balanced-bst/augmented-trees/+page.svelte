<script>
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    intervalTrace,
    makeIntervalOps,
    makeOrderOps,
    orderTrace,
  } from '$lib/algo-engine/augmented-trees.js';
  import { en as m } from '$lib/lessons/augmented-trees/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import IntervalPanel from './interval-panel.svelte';
  import { QUERY_TYPES } from './node-roles.js';
  import OrderPanel from './order-panel.svelte';

  // Fixed first logs keep the prerendered HTML and the hydrated page identical.
  const ORDER_OPS = makeOrderOps('queries');
  const INTERVAL_OPS = makeIntervalOps('textbook');
  let orderOps = $state.raw(ORDER_OPS);
  let intervalOps = $state.raw(INTERVAL_OPS);
  let orderPreset = $state('queries');
  let intervalPreset = $state('textbook');
  let mode = $state('order');

  const MODE_OPTIONS = [
    { value: 'order', label: m.modes.order },
    { value: 'interval', label: m.modes.interval },
  ];

  /** @param {{ frames: import('$lib/algo-engine/augmented-trees.js').AugFrame[], seek: (i: number) => void }} player */
  function seekFirstQuery(player) {
    player.seek(player.frames.findIndex((f) => f.op !== null && QUERY_TYPES.has(f.op.type)));
  }

  const orderPlayer = createPlayer(orderTrace(ORDER_OPS));
  seekFirstQuery(orderPlayer);
  const intervalPlayer = createPlayer(intervalTrace(INTERVAL_OPS));
  seekFirstQuery(intervalPlayer);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4">
    <SegmentedControl legend={m.modeLabel} name="mode" options={MODE_OPTIONS} bind:value={mode} />
  </div>

  {#if mode === 'order'}
    <OrderPanel player={orderPlayer} bind:ops={orderOps} bind:preset={orderPreset}>
      {#snippet controls()}
        <StepControls player={orderPlayer} />
      {/snippet}
    </OrderPanel>
  {:else}
    <IntervalPanel player={intervalPlayer} bind:ops={intervalOps} bind:preset={intervalPreset}>
      {#snippet controls()}
        <StepControls player={intervalPlayer} />
      {/snippet}
    </IntervalPanel>
  {/if}

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
