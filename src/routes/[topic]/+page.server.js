import { error } from '@sveltejs/kit';
import { t } from '$lib/i18n/index.js';
import { lessonCard, lessonsByTopic } from '$lib/lessons/registry.js';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return t().topicOrder.map((topic) => ({ topic }));
}

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
  if (!Object.hasOwn(t().topics, params.topic)) error(404, 'Unknown topic');
  return { topic: params.topic, written: lessonsByTopic(params.topic).map(lessonCard) };
}
