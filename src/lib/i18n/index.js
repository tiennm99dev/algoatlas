import * as siteCopy from './site.en.js';

const locales = { en: siteCopy };
const defaultLocale = 'en';

/** Site-wide chrome copy for the default locale. */
export function t() {
  return locales[defaultLocale];
}
