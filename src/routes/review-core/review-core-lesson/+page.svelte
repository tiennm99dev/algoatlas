<script>
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import { vi as m } from '$lib/lessons/review-core-lesson/copy.vi.js';
</script>

<LessonLayout lesson={m}>
  <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
</LessonLayout>
