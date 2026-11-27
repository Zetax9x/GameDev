import en from './en.json';
import it from './it.json';

export const LANGS = ['en', 'it'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export type TranslationKey = keyof typeof en;

// Compile-time guarantee that both files have exactly the same keys.
const dictionaries: Record<Lang, Record<TranslationKey, string>> = { en, it };
type _ItHasAllKeys = Record<TranslationKey, string> extends typeof it ? true : never;
const _check: _ItHasAllKeys = true;
void _check;

export function t(lang: Lang, key: TranslationKey): string {
  return dictionaries[lang][key];
}

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'it' : 'en';
}

/** Section slugs differ per language (e.g. /en/projects/ vs /it/progetti/). */
export const SECTIONS = {
  home: { en: '', it: '' },
  devlog: { en: 'devlog', it: 'devlog' },
  projects: { en: 'projects', it: 'progetti' },
  roadmap: { en: 'roadmap', it: 'percorso' },
  about: { en: 'about', it: 'chi-sono' },
} as const satisfies Record<string, Record<Lang, string>>;

export type Section = keyof typeof SECTIONS;

/** Builds a localized path: path('it', 'projects', 'pong') -> /it/progetti/pong/ */
export function path(lang: Lang, section: Section, ...rest: string[]): string {
  const parts = [lang, SECTIONS[section][lang], ...rest].filter(Boolean);
  return `/${parts.join('/')}/`;
}

const LOCALE: Record<Lang, string> = { en: 'en-GB', it: 'it-IT' };

/** Formats an ISO date (YYYY-MM-DD or Date) in the page language. */
export function formatDate(lang: Lang, value: string | Date, style: 'long' | 'short' = 'long'): string {
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T12:00:00Z`) : value;
  return new Intl.DateTimeFormat(LOCALE[lang], {
    timeZone: 'Europe/Rome',
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  }).format(date);
}
