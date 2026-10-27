<script>
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import { en as m } from '$lib/lessons/review-foundations-lesson/copy.en.js';
</script>

<LessonLayout lesson={m}>
  <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
</LessonLayout>
