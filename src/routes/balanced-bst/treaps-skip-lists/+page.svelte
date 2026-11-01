<script>
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    makeSkipOps,
    makeTreapOps,
    skipListTrace,
    treapTrace,
  } from '$lib/algo-engine/treaps-skip-lists.js';
  import { en as m } from '$lib/lessons/treaps-skip-lists/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import SkipListPanel from './skip-list-panel.svelte';
  import TreapPanel from './treap-panel.svelte';

  // Fixed first logs keep the prerendered HTML and the hydrated page identical.
  const SKIP_OPS = makeSkipOps('towers');
  const TREAP_OPS = makeTreapOps('shuffled');
  let skipOps = $state.raw(SKIP_OPS);
  let treapOps = $state.raw(TREAP_OPS);
  let mode = $state('skip');

  const MODE_OPTIONS = [
    { value: 'skip', label: m.modes.skip },
    { value: 'treap', label: m.modes.treap },
  ];

  const skipPlayer = createPlayer(skipListTrace(SKIP_OPS));
  // The towers are already built by the time the search, the lesson’s point, begins.
  skipPlayer.seek(skipPlayer.frames.findIndex((f) => f.opIndex === SKIP_OPS.length - 1));
  const treapPlayer = createPlayer(treapTrace(TREAP_OPS));
</script>

<LessonLayout lesson={m}>
  <div class="mb-4">
    <SegmentedControl legend={m.modeLabel} name="mode" options={MODE_OPTIONS} bind:value={mode} />
  </div>

  {#if mode === 'skip'}
    <SkipListPanel player={skipPlayer} bind:ops={skipOps}>
      {#snippet controls()}
        <StepControls player={skipPlayer} />
      {/snippet}
    </SkipListPanel>
  {:else}
    <TreapPanel player={treapPlayer} bind:ops={treapOps}>
      {#snippet controls()}
        <StepControls player={treapPlayer} />
      {/snippet}
    </TreapPanel>
  {/if}

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
