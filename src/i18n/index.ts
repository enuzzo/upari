import { setLocale } from './format';
import type { Dict } from './it';

// The language of the page: the one the viewer chose, else the browser's, else English.
// Each dictionary is its own chunk; switching reloads nothing but the words.

export type { Dict };
export const LANGS = ['en', 'it', 'es', 'fr', 'de', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'] as const;
export type Lang = (typeof LANGS)[number];

const LOAD: Record<Lang, () => Promise<{ default: Dict }>> = {
  en: () => import('./en'), it: () => import('./it'), es: () => import('./es'), fr: () => import('./fr'),
  de: () => import('./de'), pt: () => import('./pt'), ru: () => import('./ru'), zh: () => import('./zh'),
  ja: () => import('./ja'), ko: () => import('./ko'), ar: () => import('./ar'), hi: () => import('./hi'),
};

/** Native names, for the menu: shown before the dictionary of that language is loaded. */
export const NATIVE: Record<Lang, string> = {
  en: 'English', it: 'Italiano', es: 'Español', fr: 'Français', de: 'Deutsch', pt: 'Português',
  ru: 'Русский', zh: '中文', ja: '日本語', ko: '한국어', ar: 'العربية', hi: 'हिन्दी',
};

/** Scripts that Instrument Serif and Inter Tight do not draw: Noto from Google Fonts, sliced by range. */
const FONTS: Partial<Record<Lang, string>> = {
  ru: 'Cormorant+Garamond:wght@500',
  zh: 'Noto+Serif+SC:wght@400;600&family=Noto+Sans+SC:wght@400;500',
  ja: 'Noto+Serif+JP:wght@400;600&family=Noto+Sans+JP:wght@400;500',
  ko: 'Noto+Serif+KR:wght@400;600&family=Noto+Sans+KR:wght@400;500',
  ar: 'Noto+Naskh+Arabic:wght@400;600&family=Noto+Sans+Arabic:wght@400;500',
  hi: 'Noto+Serif+Devanagari:wght@400;600&family=Noto+Sans+Devanagari:wght@400;500',
};

export let t: Dict;
export let lang: Lang = 'en';
const listeners: (() => void)[] = [];
const KEY = 'upari.lang';

/** Called after every switch, to put the new words on screen. */
export function onLang(f: () => void) { listeners.push(f); }

const isLang = (v: string | null | undefined): v is Lang => !!v && (LANGS as readonly string[]).includes(v);

export function detect(): Lang {
  const asked = new URLSearchParams(location.search).get('lang');
  if (isLang(asked)) return asked;
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch { /* private mode */ }
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l.toLowerCase().split('-')[0];
    if (isLang(code)) return code;
  }
  return 'en';
}

export async function setLang(code: Lang, remember = false) {
  const dict = (await LOAD[code]()).default;
  t = dict;
  lang = code;
  setLocale(dict.lang.locale);
  const html = document.documentElement;
  html.lang = code;
  const font = FONTS[code];
  if (font && !document.querySelector(`link[data-font="${code}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.font = code;
    link.href = `https://fonts.googleapis.com/css2?family=${font}&display=swap`;
    document.head.appendChild(link);
  }
  if (remember) try { localStorage.setItem(KEY, code); } catch { /* private mode */ }
  for (const f of listeners) f();
}
