<script>
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { blocksTrace, moTrace } from '$lib/algo-engine/sqrt-decomposition.js';
  import { en as m } from '$lib/lessons/sqrt-decomposition/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import BlocksPanel from './blocks-panel.svelte';
  import MoPanel from './mo-panel.svelte';
  import { BLOCK_START, BLOCK_START_OPS, MO_PRESETS } from './start-inputs.js';

  /** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').BlockOp} BlockOp */
  /** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').MoQuery} MoQuery */

  // Fixed first inputs keep the prerendered HTML and the hydrated page identical.
  let mode = $state('blocks');
  let blockValues = $state.raw(BLOCK_START);
  /** @type {BlockOp[]} */
  let blockOps = $state.raw(BLOCK_START_OPS);
  let blockSize = $state(4);
  let moValues = $state.raw(MO_PRESETS.zigzag.values);
  /** @type {MoQuery[]} */
  let moQueries = $state.raw(MO_PRESETS.zigzag.queries);
  let moPreset = $state('zigzag');

  const MODE_OPTIONS = [
    { value: 'blocks', label: m.modes.blocks },
    { value: 'mo', label: m.modes.mo },
  ];

  const blockPlayer = createPlayer(blocksTrace(BLOCK_START, 4, BLOCK_START_OPS));
  // Open on the first query: the build is one step back, and the block walk is the lesson.
  blockPlayer.seek(blockPlayer.frames.findIndex((f) => f.opIndex === 0));
  const moPlayer = createPlayer(moTrace(MO_PRESETS.zigzag.values, MO_PRESETS.zigzag.queries));
</script>

<LessonLayout lesson={m}>
  <div class="mb-4">
    <SegmentedControl legend={m.modeLabel} name="mode" options={MODE_OPTIONS} bind:value={mode} />
  </div>

  {#if mode === 'blocks'}
    <BlocksPanel player={blockPlayer} bind:values={blockValues} bind:ops={blockOps} bind:blockSize>
      {#snippet controls()}
        <StepControls player={blockPlayer} />
      {/snippet}
    </BlocksPanel>
  {:else}
    <MoPanel
      player={moPlayer}
      bind:values={moValues}
      bind:queries={moQueries}
      bind:preset={moPreset}
    >
      {#snippet controls()}
        <StepControls player={moPlayer} />
      {/snippet}
    </MoPanel>
  {/if}

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
