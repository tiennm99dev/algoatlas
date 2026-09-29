import { error } from '@sveltejs/kit';
import { t } from '$lib/i18n/index.js';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return t().topicOrder.map((topic) => ({ topic }));
}

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
  if (!(params.topic in t().topics)) error(404, 'Unknown topic');
  return { topic: params.topic };
}
