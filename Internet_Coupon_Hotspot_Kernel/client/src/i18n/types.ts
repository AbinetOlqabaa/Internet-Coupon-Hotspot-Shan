export type SupportedLocale = 'en' | 'am' | 'om';

export interface LanguageOption {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  dir: 'ltr';
  script: 'Latn' | 'Ethi';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    script: 'Latn',
  },
  {
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    dir: 'ltr',
    script: 'Ethi',
  },
  {
    code: 'om',
    name: 'Afaan Oromo',
    nativeName: 'Afaan Oromoo',
    dir: 'ltr',
    script: 'Latn',
  },
];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const LOCALE_STORAGE_KEY = 'hotspot_language_preference';
