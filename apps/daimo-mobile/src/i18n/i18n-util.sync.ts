/* eslint-disable */

import { initFormatters } from "./formatters";
import type { Locales, Translations } from "./i18n-types";
import { loadedFormatters, loadedLocales, locales } from "./i18n-util";

import en from "./en";

const localeTranslations = {
  en,
};

export const loadLocale = (locale: Locales): void => {
  if (loadedLocales[locale]) return;

  loadedLocales[locale] = localeTranslations[locale] as unknown as Translations;
  loadFormatters(locale);
};

export const loadAllLocales = (): void => locales.forEach(loadLocale);

export const loadFormatters = (locale: Locales): void =>
  void (loadedFormatters[locale] = initFormatters(locale));
