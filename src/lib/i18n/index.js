import * as siteCopy from './site.en.js';
import { topicOrder, topics } from '$lib/curriculum/index.js';

const locales = { en: { ...siteCopy, topics, topicOrder } };
const defaultLocale = 'en';

/** Site-wide chrome copy for the default locale, with the topics the curriculum defines. */
export function t() {
  return locales[defaultLocale];
}
