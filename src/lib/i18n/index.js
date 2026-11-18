import * as siteCopy from './site.vi.js';
import { topicOrder, topics } from '$lib/curriculum/index.js';

const locales = { vi: { ...siteCopy, topics, topicOrder } };
const defaultLocale = 'vi';

/** Site-wide chrome copy for the default locale, with the topics the curriculum defines. */
export function t() {
  return locales[defaultLocale];
}
